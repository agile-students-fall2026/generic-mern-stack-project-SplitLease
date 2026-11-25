const chai = require("chai")
const chaiHttp = require("chai-http")

const recurringBills = require("../services/recurringBillService")
const expenses = require("../services/expenseService")
const app = require("../app")

chai.use(chaiHttp)

const bill = {
  id: "recurring-10000",
  householdId: 1,
  name: "Rent",
  amount: 1200,
  frequency: "monthly",
  paidByMemberIds: [],
}

describe("Recurring bill routes", () => {
  const original = {
    listBills: recurringBills.listRecurringBills,
    createBill: recurringBills.createRecurringBill,
    listExpenses: expenses.listHouseholdExpenses,
    settle: expenses.settleExpense,
  }

  afterEach(() => {
    recurringBills.listRecurringBills = original.listBills
    recurringBills.createRecurringBill = original.createBill
    expenses.listHouseholdExpenses = original.listExpenses
    expenses.settleExpense = original.settle
  })

  it("lists recurring bills", async () => {
    recurringBills.listRecurringBills = () => ({ bills: [bill] })

    const response = await chai
      .request(app)
      .get("/api/households/1/recurring-bills")

    expect(response).to.have.status(200)
    expect(response.body.bills).to.deep.equal([bill])
  })

  it("creates a recurring bill", async () => {
    recurringBills.createRecurringBill = () => ({ bill })

    const response = await chai
      .request(app)
      .post("/api/households/1/recurring-bills")
      .send({ name: "Rent", amount: "1200", frequency: "monthly" })

    expect(response).to.have.status(201)
    expect(response.body.bill).to.deep.equal(bill)
  })

  ;[
    ["amount", { amount: "Amount must be greater than zero" }],
    ["frequency", { frequency: "Frequency must be monthly" }],
  ].forEach(([field, errors]) => {
    it(`returns 400 for an invalid ${field}`, async () => {
      recurringBills.createRecurringBill = () => ({ errors })

      const response = await chai
        .request(app)
        .post("/api/households/1/recurring-bills")
        .send({})

      expect(response).to.have.status(400)
      expect(response.body.errors).to.deep.equal(errors)
    })
  })

  it("lists household expenses", async () => {
    expenses.listHouseholdExpenses = async () => ({
      expenses: [{ id: "mock-10", name: "Television" }],
      members: [{ id: 1, firstName: "Ana", lastName: "Lopez" }],
    })

    const response = await chai.request(app).get("/api/households/1/expenses")

    expect(response).to.have.status(200)
    expect(response.body.expenses).to.have.length(1)
  })

  it("settles an expense", async () => {
    expenses.settleExpense = async () => ({
      expense: { id: "mock-10", paidByMemberIds: [1, 2] },
    })

    const response = await chai
      .request(app)
      .post("/api/households/1/expenses/mock-10/settlements")
      .send({ memberId: 2 })

    expect(response).to.have.status(200)
    expect(response.body.expense.paidByMemberIds).to.deep.equal([1, 2])
  })
})