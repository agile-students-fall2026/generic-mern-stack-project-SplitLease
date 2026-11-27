const chai = require("chai")
const chaiHttp = require("chai-http")

const expenses = require("../services/expenseService")
const app = require("../app")

chai.use(chaiHttp)

describe("One-time expense routes", () => {
  const originalCreateExpense = expenses.createHouseholdExpense

  afterEach(() => {
    expenses.createHouseholdExpense = originalCreateExpense
  })

  it("creates a one-time household expense", async () => {
    const expense = {
      id: "one-time-10000",
      householdId: 1,
      name: "Groceries",
      description: "Shared dinner supplies",
      amount: 60,
      kind: "one-time",
      frequency: null,
      paidByMemberIds: [1],
      splits: [
        { memberId: 1, amount: 20 },
        { memberId: 2, amount: 20 },
        { memberId: 3, amount: 20 },
      ],
    }

    expenses.createHouseholdExpense = async () => ({ expense })

    const response = await chai
      .request(app)
      .post("/api/households/1/expenses")
      .send({
        name: "Groceries",
        description: "Shared dinner supplies",
        amount: "60.00",
        payerId: 1,
      })

    expect(response).to.have.status(201)
    expect(response.body.expense).to.deep.equal(expense)
  })

  it("returns validation errors for an invalid amount", async () => {
    expenses.createHouseholdExpense = async () => ({
      errors: {
        amount:
          "Amount must be a positive number with at most two decimal places",
      },
    })

    const response = await chai
      .request(app)
      .post("/api/households/1/expenses")
      .send({
        name: "Groceries",
        amount: "0",
        payerId: 1,
      })

    expect(response).to.have.status(400)
    expect(response.body.errors).to.deep.equal({
      amount:
        "Amount must be a positive number with at most two decimal places",
    })
  })
})