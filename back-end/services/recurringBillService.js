const MONTHLY_FREQUENCY = "monthly"

let nextRecurringBillId = 10000
let recurringBills = []

const toHouseholdId = (value) => {
  const householdId = Number(value)
  return Number.isInteger(householdId) ? householdId : null
}

const validateBill = (form = {}) => {
  const name = String(form.name || "").trim()
  const description = String(form.description || "").trim()
  const amount = String(form.amount ?? "").trim()
  const frequency = String(form.frequency || "")
    .trim()
    .toLowerCase()

  const errors = {}

  if (!name) {
    errors.name = "Bill name is required"
  }

  if (!amount) {
    errors.amount = "Amount is required"
  } else if (!/^\d+(\.\d{1,2})?$/.test(amount)) {
    errors.amount =
      "Amount must be a positive number with at most two decimal places"
  } else if (Number(amount) <= 0) {
    errors.amount = "Amount must be greater than zero"
  }

  if (frequency !== MONTHLY_FREQUENCY) {
    errors.frequency = "Frequency must be monthly"
  }

  if (Object.keys(errors).length > 0) {
    return { errors }
  }

  return {
    value: {
      name,
      description,
      amount: Number(amount),
      frequency,
    },
  }
}

const createRecurringBill = (householdId, form = {}) => {
  const householdIdNumber = toHouseholdId(householdId)

  if (householdIdNumber === null) {
    return {
      status: 400,
      error: "householdId must be a number",
    }
  }

  const validation = validateBill(form)

  if (validation.errors) {
    return validation
  }

  const bill = {
    id: `recurring-${nextRecurringBillId++}`,
    householdId: householdIdNumber,
    name: validation.value.name,
    description: validation.value.description,
    amount: validation.value.amount,
    frequency: MONTHLY_FREQUENCY,
    paidByMemberIds: [],
  }

  recurringBills.push(bill)

  return { bill }
}

const listRecurringBills = (householdId) => {
  const householdIdNumber = toHouseholdId(householdId)

  if (householdIdNumber === null) {
    return {
      status: 400,
      error: "householdId must be a number",
    }
  }

  return {
    bills: recurringBills.filter(
      (bill) => bill.householdId === householdIdNumber,
    ),
  }
}

const resetRecurringBillState = () => {
  nextRecurringBillId = 10000
  recurringBills = []
}

module.exports = {
  createRecurringBill,
  listRecurringBills,
  resetRecurringBillState,
}