const { expect } = require("chai")

const {
  createHouseholdExpense,
  listHouseholdExpenses,
  resetExpenseState,
  settleExpense,
} = require("../services/expenseService")

const {
  createRecurringBill,
  resetRecurringBillState,
} = require("../services/recurringBillService")

const members = [
  { id: 1, first_name: "Ana", last_name: "Lopez", household_id: 1 },
  { id: 2, first_name: "Ben", last_name: "Park", household_id: 1 },
  { id: 3, first_name: "Cleo", last_name: "Diaz", household_id: 1 },
  { id: 4, first_name: "Drew", last_name: "Kim", household_id: 2 },
]

const expenses = [
  {
    id: 10,
    household_id: 1,
    expense_name: "Television",
    description: "Living room television",
    price: 600,
    paid_by: "Ana",
  },
  {
    id: 11,
    household_id: 2,
    expense_name: "Desk",
    description: "Office desk",
    price: 200,
    paid_by: "Drew",
  },
]

const loadExpenses = async () => expenses
const loadMembers = async () => members

describe("expenseService", () => {
  beforeEach(() => {
    resetRecurringBillState()
    resetExpenseState()
  })

  it("lists one-time and recurring household expenses", async () => {
    createRecurringBill(1, {
      name: "Rent",
      amount: "1200",
      frequency: "monthly",
    })

    const result = await listHouseholdExpenses(1, loadExpenses, loadMembers)

    expect(result.expenses.map((expense) => expense.name)).to.deep.equal([
      "Television",
      "Rent",
    ])
    expect(result.members).to.have.length(3)
  })

  it("creates a one-time expense with an even split for every household member", async () => {
    const result = await createHouseholdExpense(
      1,
      {
        name: "Groceries",
        description: "Shared dinner supplies",
        amount: "60.00",
      },
      1,
      loadMembers,
    )

    expect(result.expense).to.include({
      householdId: 1,
      name: "Groceries",
      description: "Shared dinner supplies",
      amount: 60,
      kind: "one-time",
      frequency: null,
    })
    expect(result.expense.paidByMemberIds).to.deep.equal([1])
    expect(result.expense.splits).to.deep.equal([
      { memberId: 1, amount: 20 },
      { memberId: 2, amount: 20 },
      { memberId: 3, amount: 20 },
    ])
  })

  it("lists a created expense only for its household", async () => {
    const created = await createHouseholdExpense(
      1,
      {
        name: "Cleaning supplies",
        amount: "30.00",
      },
      1,
      loadMembers,
    )

    const householdOne = await listHouseholdExpenses(
      1,
      loadExpenses,
      loadMembers,
    )
    const householdTwo = await listHouseholdExpenses(
      2,
      loadExpenses,
      loadMembers,
    )

    expect(
      householdOne.expenses.some(
        (expense) => expense.id === created.expense.id,
      ),
    ).to.equal(true)
    expect(
      householdTwo.expenses.some(
        (expense) => expense.id === created.expense.id,
      ),
    ).to.equal(false)
  })

  ;["0", "-1", "ten", "10.999"].forEach((amount) => {
    it(`rejects the invalid amount "${amount}"`, async () => {
      const result = await createHouseholdExpense(
        1,
        {
          name: "Groceries",
          amount,
        },
        1,
        loadMembers,
      )

      expect(result.errors.amount).to.equal(
        "Amount must be a positive number with at most two decimal places",
      )
    })
  })

  it("settles an expense once for a household member", async () => {
    await settleExpense(1, "mock-10", 2, loadExpenses, loadMembers)
    const result = await settleExpense(
      1,
      "mock-10",
      2,
      loadExpenses,
      loadMembers,
    )

    expect(result.expense.paidByMemberIds).to.deep.equal([1, 2])
  })

  it("rejects a member outside the household", async () => {
    const result = await settleExpense(
      1,
      "mock-10",
      4,
      loadExpenses,
      loadMembers,
    )

    expect(result).to.deep.equal({
      status: 404,
      error: "Member not found in this household",
    })
  })
})