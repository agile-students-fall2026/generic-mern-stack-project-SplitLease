// back-end/tests/expenseService.test.js
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
  { id: 1, first_name: "Ana", last_name: "Lopez", household_id: 1 },
  { id: 2, first_name: "Ben", last_name: "Park", household_id: 1 },
  { id: 3, first_name: "Cleo", last_name: "Diaz", household_id: 2 },
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

    const result = await listHouseholdExpenses(
      1,
      loadExpenses,
      loadMembers,
    )

    expect(result.expenses.map((expense) => expense.name)).to.deep.equal([
      "Television",
      "Rent",
    ])
    expect(result.members).to.have.length(2)
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
      3,
      loadExpenses,
      loadMembers,
    )

    expect(result).to.deep.equal({
      status: 404,
      error: "Member not found in this household",
    })
  })
})