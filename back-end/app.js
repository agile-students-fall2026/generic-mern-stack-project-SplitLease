const path = require("path");
require("dotenv").config();

const express = require("express");
const members = require("./mock-data/members.json");
const households = require("./mock-data/households.json");
const expenses = require("./mock-data/expenses.json");
const activity = require("./mock-data/activity.json");

const { getHouseholdActivity } = require("./services/activityService");
const { router: purchaseAssetRouter } = require("./services/purchase_asset");
const editAssetRouter = require("./services/edit_asset");
const authService = require("./services/authService");
const householdService = require("./services/householdService");
const roommateService = require("./services/roommateService");
const recurringBillService = require("./services/recurringBillService");
const expenseService = require("./services/expenseService");
const { router: itemValueRouter } = require("./services/item_value");

const app = express();

app.use(express.json());
app.use(purchaseAssetRouter);
app.use(editAssetRouter);
app.use(itemValueRouter);

app.get("/api/households", (req, res) => {
  res.json(households);
});
app.get("/api/expenses", (req, res) => {
  res.json(expenses);
});
app.get("/api/activity", (req, res) => {
  res.json(activity);
});
app.post("/api/expenses", (req, res) => {
  const { name, description, price } = req.body || {};
  if (!name || !description || !price) {
    return res
      .status(400)
      .json({ error: "name, description, and price are required" });
  }
  res.status(201).json({
    id: expenses.length + 1,
    name: String(name).trim(),
    description: String(description).trim(),
    price: Number(price),
  });
});

app.get("/api/households/:householdId/activity", async (req, res, next) => {
  const householdId = Number(req.params.householdId);

  if (!Number.isInteger(householdId)) {
    return res.status(400).json({
      error: "householdId must be a number",
    });
  }

  try {
    const result = await getHouseholdActivity(householdId);

    return res.json(result);
  } catch (error) {
    return next(error);
  }
});

app.post("/api/login", async (req, res, next) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({
      error: "Email and password are required",
    });
  }

  try {
    const user = await authService.loginUser(email, password);

    if (!user) {
      return res.status(401).json({
        error: "Incorrect email or password",
      });
    }

    // mock token for now; real sessions come with the database sprint
    return res.json({ user, token: `mock-token-${user.id}` });
  } catch (error) {
    return next(error);
  }
});

app.post("/api/register", async (req, res, next) => {
  try {
    const result = await authService.registerUser(req.body || {});

    if (result.errors) {
      // 409 means the email is already used, 400 means the form has mistakes
      const status = result.emailTaken ? 409 : 400;

      return res.status(status).json({ errors: result.errors });
    }

    return res.status(201).json({
      user: result.user,
      token: `mock-token-${result.user.id}`,
    });
  } catch (error) {
    return next(error);
  }
});

app.post("/api/households", (req, res) => {
  const result = householdService.createHousehold(req.body || {});

  if (result.errors) {
    return res.status(400).json({ errors: result.errors });
  }

  return res.status(201).json(result);
});

app.delete(
  "/api/households/:householdId/members/:memberId",
  async (req, res, next) => {
    try {
      const result = await roommateService.removeRoommate({
        householdId: req.params.householdId,
        memberId: req.params.memberId,
        requesterId: (req.body || {}).requesterId,
      });

      if (result.error) {
        return res.status(result.status).json({ error: result.error });
      }

      return res.json({ removed: result.removed });
    } catch (error) {
      return next(error);
    }
  },
);

const payments = []

const getBalances = (householdId) => {
  const householdMembers = members.filter((m) =>
    m.household_ids.includes(householdId),
  );
  const householdExpenses = expenses.filter(
    (e) => e.household_id === householdId,
  );

  return householdMembers.map((member) => {
    let owes = 0;

    householdExpenses.forEach((expense) => {
      owes += expense.price / householdMembers.length;

      if (expense.paid_by === member.id) {
        owes -= expense.price;
      }
    });
    payments .filter((p) => p.householdId === householdId)
      .forEach((p) => {
        if (p.fromMemberId === member.id) owes -= p.amount
        if (p.toMemberId === member.id) owes += p.amount
      })
    return {
      memberId: member.id,
      name: `${member.first_name} ${member.last_name}`,
      owes: Math.round(owes * 100) / 100, // round to cents
    };
  });
};

const getDebts = (householdId) => {
  const balances = getBalances(householdId)
  const debtors = balances.filter((b) => b.owes > 0).map((b) => ({ ...b }))
  const creditors = balances
    .filter((b) => b.owes < 0)
    .map((b) => ({ ...b, owes: -b.owes }))

  const debts = []
  let i = 0
  let j = 0

  while (i < debtors.length && j < creditors.length) {
    const amount = Math.min(debtors[i].owes, creditors[j].owes)

    debts.push({
      fromMemberId: debtors[i].memberId,
      fromName: debtors[i].name,
      toMemberId: creditors[j].memberId,
      toName: creditors[j].name,
      amount: Math.round(amount * 100) / 100,
    })
    debtors[i].owes -= amount
    creditors[j].owes -= amount

    if (debtors[i].owes < 0.01) i++
    if (creditors[j].owes < 0.01) j++
  }
  return debts
}


app.get("/api/households/:householdId/balances", (req, res) => {
  const householdId = Number(req.params.householdId);

  if (!Number.isInteger(householdId)) {
    return res.status(400).json({ error: "householdId must be a number" });
  }

  const balances = getBalances(householdId);

  if (balances.length === 0) {
    return res.status(404).json({ error: "Household not found" });
  }

  res.json({ householdId, balances });
});

app.get("/api/households/:householdId/debts", (req, res) => {
  const householdId = Number(req.params.householdId)

  if (!Number.isInteger(householdId)) {
    return res.status(400).json({ error: "householdId must be a number" })
  }

  if (getBalances(householdId).length === 0) {
    return res.status(404).json({ error: "Household not found" })
  }

  res.json({ householdId, debts: getDebts(householdId) })
})

app.post("/api/households/:householdId/settle", (req, res) => {
  const body = req.body || {};
  const householdId = Number(req.params.householdId);
  const fromMemberId = Number(body.fromMemberId);
  const toMemberId = Number(body.toMemberId);
  const amount = Math.round(Number(body.amount) * 100) / 100;

  if (fromMemberId === toMemberId) {
    return res.status(400).json({ error: "You cannot pay yourself" });
  }

  if (!(amount > 0)) {
    return res.status(400).json({ error: "amount must be a positive number" });
  }

  const balances = getBalances(householdId);
  const payer = balances.find((b) => b.memberId === fromMemberId);
  const payee = balances.find((b) => b.memberId === toMemberId);

  if (!payer || !payee) {
    return res
      .status(404)
      .json({ error: "Both people must be members of this household" });
  }
  if (payer.owes <= 0) {
    return res
      .status(400)
      .json({ error: `${payer.name} does not owe anything` });
  }
  if (amount > payer.owes) {
    return res
      .status(400)
      .json({ error: `${payer.name} only owes $${payer.owes.toFixed(2)}` });
  }
  payments.push({ householdId, fromMemberId, toMemberId, amount })
  
  res.status(201).json({
    status: "success",
    message: `${payer.name} paid ${payee.name} $${amount.toFixed(2)}`,
    payment: {
      householdId,
      fromMemberId,
      toMemberId,
      amount,
      settledAt: new Date().toISOString(),
    },
  });
});

app.get(
  "/api/households/:householdId/members/:memberId/balance",
  (req, res) => {
    const householdId = Number(req.params.householdId);
    const memberId = Number(req.params.memberId);

    const balance = getBalances(householdId).find(
      (b) => b.memberId === memberId,
    );

    if (!balance) {
      return res
        .status(404)
        .json({ error: "Member not found in this household" });
    }

    res.json(balance);
  },
);

app.get("/api/households/:householdId/recurring-bills", (req, res) => {
  const result = recurringBillService.listRecurringBills(
    req.params.householdId,
  );

  if (result.error) {
    return res.status(result.status).json({ error: result.error });
  }

  return res.json(result);
});

app.post("/api/households/:householdId/recurring-bills", (req, res) => {
  const result = recurringBillService.createRecurringBill(
    req.params.householdId,
    req.body || {},
  );

  if (result.errors) {
    return res.status(400).json({ errors: result.errors });
  }

  if (result.error) {
    return res.status(result.status).json({ error: result.error });
  }

  return res.status(201).json({ bill: result.bill });
});

app.get("/api/households/:householdId/expenses", async (req, res, next) => {
  try {
    const result = await expenseService.listHouseholdExpenses(
      req.params.householdId,
    );

    if (result.error) {
      return res.status(result.status).json({ error: result.error });
    }

    return res.json(result);
  } catch (error) {
    return next(error);
  }
});

app.post("/api/households/:householdId/recurring-bills", (req, res) => {
  const result = recurringBillService.createRecurringBill(
    req.params.householdId,
    req.body || {},
  );

  if (result.errors) {
    return res.status(400).json({ errors: result.errors });
  }

  if (result.error) {
    return res.status(result.status).json({ error: result.error });
  }

  return res.status(201).json({ bill: result.bill });
});

app.post("/api/households/:householdId/expenses", async (req, res, next) => {
  try {
    const body = req.body || {};
    const result = await expenseService.createHouseholdExpense(
      req.params.householdId,
      body,
      body.payerId,
    );

    if (result.errors) {
      return res.status(400).json({ errors: result.errors });
    }

    if (result.error) {
      return res.status(result.status).json({ error: result.error });
    }

    return res.status(201).json({ expense: result.expense });
  } catch (error) {
    return next(error);
  }
});

app.get("/api/households/:householdId/expenses", async (req, res, next) => {
  try {
    const result = await expenseService.listHouseholdExpenses(
      req.params.householdId,
    );

    if (result.error) {
      return res.status(result.status).json({ error: result.error });
    }

    return res.json(result);
  } catch (error) {
    return next(error);
  }
});

app.post(
  "/api/households/:householdId/expenses/:expenseId/settlements",
  async (req, res, next) => {
    try {
      const result = await expenseService.settleExpense(
        req.params.householdId,
        req.params.expenseId,
        (req.body || {}).memberId,
      );

      if (result.error) {
        return res.status(result.status).json({ error: result.error });
      }

      return res.json({ expense: result.expense });
    } catch (error) {
      return next(error);
    }
  },
);

app.use((error, req, res, next) => {
  console.error(error);

  res.status(502).json({
    error: "Could not load activity data",
  });
});

app.use(express.static(path.join(__dirname, "../front-end/dist")));

module.exports = app;
