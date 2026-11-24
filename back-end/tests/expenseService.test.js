const { expect } = require("chai")

const {
  listHouseholdExpenses,
  settleExpense,
  resetExpenseState,
} = require("../services/expenseService")

const {
  createRecurringBill,
  resetRecurringBillState,
} = require("../services/recurringBillService")

const members = [
  {
    id: 1,
    first_name: "Ana",
    last_name: "Lopez",
    household_id: 1,
  },
  {
    id: 2,
    first_name: "Ben",
    last_name: "Park",
    household_id: 1,
  },
  {
    id: 3,
    first_name: "Cleo",
    last_name: "Diaz",
    household_id: 2,
  },
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
    paid_by: "Cleo",
  },
]

const loadMembers = async () => members
const loadExpenses = async () => expenses

describe("expenseService", () => {
  beforeEach(() => {
    resetRecurringBillState()
    resetExpenseState()
  })

  it("lists only the selected household's expenses and members", async () => {
    const result = await listHouseholdExpenses(
      1,
      loadExpenses,
      loadMembers,
    )

    expect(result.members).to.deep.equal([
      {
        id: 1,
        firstName: "Ana",
        lastName: "Lopez",
        householdId: 1,
      },
      {
        id: 2,
        firstName: "Ben",
        lastName: "Park",
        householdId: 1,
      },
    ])

    expect(result.expenses).to.deep.equal([
      {
        id: "mock-10",
        householdId: 1,
        name: "Television",
        description: "Living room television",
        amount: 600,
        kind: "one-time",
        frequency: null,
        paidByMemberIds: [1],
      },
    ])
  })

  it("includes recurring bills in the household expense list", async () => {
    createRecurringBill(1, {
      name: "Rent",
      description: "Monthly apartment rent",
      amount: "1200.00",
      frequency: "monthly",
    })

    const result = await listHouseholdExpenses(
      1,
      loadExpenses,
      loadMembers,
    )

    expect(result.expenses).to.have.length(2)
    expect(result.expenses[1]).to.include({
      name: "Rent",
      kind: "recurring",
      frequency: "monthly",
    })
  })

  it("settles an expense for a member in the household", async () => {
    const result = await settleExpense(
      1,
      "mock-10",
      2,
      loadExpenses,
      loadMembers,
    )

    expect(result.expense.paidByMemberIds).to.have.members([1, 2])
  })

  it("does not add the same member twice when they settle again", async () => {
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

  it("rejects settlement by a member outside the household", async () => {
    const result = await settleExpense(
      1,
      "mock-10",
      3,
      loadExpenses,
      loadMembers,
    )

    expect(result).to.deep.equal({
      status: 404,
      error: "Member not found in this household",
    })
  })

  it("rejects settlement for an expense outside the household", async () => {
    const result = await settleExpense(
      1,
      "mock-11",
      1,
      loadExpenses,
      loadMembers,
    )

    expect(result).to.deep.equal({
      status: 404,
      error: "Expense not found in this household",
    })
  })
})