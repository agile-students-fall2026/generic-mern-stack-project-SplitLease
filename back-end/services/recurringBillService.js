const MONTHLY = "monthly"

let nextId = 10000
let bills = []

const householdId = (value) =>
  Number.isInteger(Number(value)) ? Number(value) : null

const validate = (form = {}) => {
  const name = String(form.name || "").trim()
  const description = String(form.description || "").trim()
  const amount = String(form.amount ?? "").trim()
  const frequency = String(form.frequency || "").trim().toLowerCase()
  const errors = {}

  if (!name) errors.name = "Bill name is required"
  if (!amount) errors.amount = "Amount is required"
  else if (!/^\d+(\.\d{1,2})?$/.test(amount))
    errors.amount = "Amount must be a positive number with at most two decimal places"
  else if (Number(amount) <= 0) errors.amount = "Amount must be greater than zero"
  if (frequency !== MONTHLY) errors.frequency = "Frequency must be monthly"

  return Object.keys(errors).length
    ? { errors }
    : { value: { name, description, amount: Number(amount) } }
}

const createRecurringBill = (id, form) => {
  const household = householdId(id)
  if (household === null)
    return { status: 400, error: "householdId must be a number" }

  const result = validate(form)
  if (result.errors) return result

  const bill = {
    id: `recurring-${nextId++}`,
    householdId: household,
    ...result.value,
    kind: "recurring",
    frequency: MONTHLY,
    paidByMemberIds: [],
  }

  bills.push(bill)
  return { bill }
}

const listRecurringBills = (id) => {
  const household = householdId(id)
  if (household === null)
    return { status: 400, error: "householdId must be a number" }

  return { bills: bills.filter((bill) => bill.householdId === household) }
}

const resetRecurringBillState = () => {
  nextId = 10000
  bills = []
}

module.exports = {
  createRecurringBill,
  listRecurringBills,
  resetRecurringBillState,
}