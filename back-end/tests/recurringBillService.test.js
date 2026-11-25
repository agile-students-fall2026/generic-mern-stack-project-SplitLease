const { expect } = require("chai")

const {
  createRecurringBill,
  listRecurringBills,
  resetRecurringBillState,
} = require("../services/recurringBillService")

const validBill = {
  name: "Rent",
  description: "Monthly apartment rent",
  amount: "1200.00",
  frequency: "monthly",
}

describe("recurringBillService", () => {
  beforeEach(resetRecurringBillState)

  it("creates a monthly bill", () => {
    const { bill } = createRecurringBill(1, validBill)

    expect(bill).to.include({
      id: "recurring-10000",
      householdId: 1,
      name: "Rent",
      amount: 1200,
      frequency: "monthly",
    })
  })

  it("lists bills for only the requested household", () => {
    createRecurringBill(1, validBill)
    createRecurringBill(2, { ...validBill, name: "Internet" })

    expect(listRecurringBills(1).bills.map((bill) => bill.name)).to.deep.equal([
      "Rent",
    ])
  })

  ;[
    ["missing name", { ...validBill, name: " " }, "name"],
    ["zero amount", { ...validBill, amount: "0" }, "amount"],
    ["negative amount", { ...validBill, amount: "-1" }, "amount"],
    ["invalid amount", { ...validBill, amount: "1.999" }, "amount"],
    ["weekly frequency", { ...validBill, frequency: "weekly" }, "frequency"],
  ].forEach(([label, form, field]) => {
    it(`rejects ${label}`, () => {
      expect(createRecurringBill(1, form).errors).to.have.property(field)
    })
  })
})