const { expect } = require("chai")

const {
  createRecurringBill,
  listRecurringBills,
  resetRecurringBillState,
} = require("../services/recurringBillService")

describe("recurringBillService", () => {
  const validBill = {
    name: "Rent",
    description: "Monthly apartment rent",
    amount: "1200.00",
    frequency: "monthly",
  }

  beforeEach(() => {
    resetRecurringBillState()
  })

  it("creates a valid monthly recurring bill", () => {
    const result = createRecurringBill(1, validBill)

    expect(result.bill).to.deep.equal({
      id: "recurring-10000",
      householdId: 1,
      name: "Rent",
      description: "Monthly apartment rent",
      amount: 1200,
      frequency: "monthly",
      paidByMemberIds: [],
    })
  })

  it("lists bills only for the requested household", () => {
    createRecurringBill(1, validBill)
    createRecurringBill(2, {
      ...validBill,
      name: "Internet",
    })

    const result = listRecurringBills(1)

    expect(result.bills).to.have.length(1)
    expect(result.bills[0].name).to.equal("Rent")
  })

  it("rejects a missing bill name", () => {
    const result = createRecurringBill(1, {
      ...validBill,
      name: " ",
    })

    expect(result.errors).to.have.property("name", "Bill name is required")
  })

  it("rejects a missing amount", () => {
    const result = createRecurringBill(1, {
      ...validBill,
      amount: "",
    })

    expect(result.errors).to.have.property("amount", "Amount is required")
  })

  it("rejects a zero amount", () => {
    const result = createRecurringBill(1, {
      ...validBill,
      amount: "0",
    })

    expect(result.errors).to.have.property(
      "amount",
      "Amount must be greater than zero",
    )
  })

  it("rejects a negative amount", () => {
    const result = createRecurringBill(1, {
      ...validBill,
      amount: "-50",
    })

    expect(result.errors).to.have.property(
      "amount",
      "Amount must be a positive number with at most two decimal places",
    )
  })

  it("rejects an amount with more than two decimal places", () => {
    const result = createRecurringBill(1, {
      ...validBill,
      amount: "25.999",
    })

    expect(result.errors).to.have.property(
      "amount",
      "Amount must be a positive number with at most two decimal places",
    )
  })

  it("rejects a non-monthly frequency", () => {
    const result = createRecurringBill(1, {
      ...validBill,
      frequency: "weekly",
    })

    expect(result.errors).to.have.property(
      "frequency",
      "Frequency must be monthly",
    )
  })
})