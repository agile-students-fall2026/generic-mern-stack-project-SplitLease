const localExpenses = require("../mock-data/expenses.json")
const localMembers = require("../mock-data/members.json")

const { listRecurringBills } = require("./recurringBillService")

let settlements = new Map()
let createdExpenses = []
let nextExpenseId = 10000

const toId = (value) =>
  Number.isInteger(Number(value)) ? Number(value) : null

const loadExpenses = async () => localExpenses

const loadMembers = async () => localMembers

const payerIds = (paidBy, members) =>
  String(paidBy || "")
    .split(",")
    .map((payer) => payer.trim().toLowerCase())
    .filter(Boolean)
    .map((payer) => {
      const id = toId(payer)
      if (id !== null) return id

      const member = members.find((current) => {
        const first = String(current.first_name).toLowerCase()
        const full =
          `${current.first_name} ${current.last_name}`.toLowerCase()

        return payer === first || payer === full
      })

      return member?.id
    })
    .filter(Boolean)

const createEvenSplits = (amount, members) => {
  const amountInCents = Math.round(amount * 100)
  const baseShareInCents = Math.floor(amountInCents / members.length)
  const remainingCents = amountInCents % members.length

  return [...members]
    .sort((first, second) => first.id - second.id)
    .map((member, index) => ({
      memberId: member.id,
      amount:
        (baseShareInCents + (index < remainingCents ? 1 : 0)) / 100,
    }))
}

const normalizeExpense = (expense, members) => {
  const householdMembers = members.filter(
    (member) => member.household_id === expense.household_id,
  )
  const amount = Number(expense.amount ?? expense.price ?? 0)

  return {
    id: `mock-${expense.id}`,
    householdId: expense.household_id,
    name: expense.name || expense.expense_name || "Unnamed expense",
    description: expense.description || "",
    amount,
    kind: "one-time",
    frequency: null,
    paidByMemberIds: payerIds(expense.paid_by, members),
    splits: createEvenSplits(amount, householdMembers),
  }
}

const validateExpense = (form = {}) => {
  const name = String(form.name || "").trim()
  const description = String(form.description || "").trim()
  const amount = String(form.amount ?? "").trim()
  const errors = {}

  if (!name) errors.name = "Expense name is required"

  if (!amount) errors.amount = "Amount is required"
  else if (!/^\d+(\.\d{1,2})?$/.test(amount) || Number(amount) <= 0) {
    errors.amount =
      "Amount must be a positive number with at most two decimal places"
  }

  return Object.keys(errors).length
    ? { errors }
    : {
        value: {
          name,
          description,
          amount: Number(amount),
        },
      }
}

const withSettlements = (expense) => ({
  ...expense,
  paidByMemberIds: [
    ...new Set([
      ...expense.paidByMemberIds,
      ...(settlements.get(expense.id) || []),
    ]),
  ],
})

const createHouseholdExpense = async (
  id,
  form,
  payerId,
  getMembers = loadMembers,
) => {
  const householdId = toId(id)
  const payer = toId(payerId)

  if (householdId === null || payer === null) {
    return {
      status: 400,
      error: "householdId and payerId must be numbers",
    }
  }

  const result = validateExpense(form)
  if (result.errors) return result

  const allMembers = await getMembers()
  const householdMembers = allMembers.filter(
    (member) => member.household_id === householdId,
  )

  if (householdMembers.length === 0) {
    return {
      status: 404,
      error: "Household not found",
    }
  }

  if (!householdMembers.some((member) => member.id === payer)) {
    return {
      status: 404,
      error: "Payer not found in this household",
    }
  }

  const expense = {
    id: `one-time-${nextExpenseId++}`,
    householdId,
    ...result.value,
    kind: "one-time",
    frequency: null,
    paidByMemberIds: [payer],
    splits: createEvenSplits(result.value.amount, householdMembers),
  }

  createdExpenses.push(expense)

  return { expense }
}

const loadHouseholdData = async (
  householdId,
  getExpenses = loadExpenses,
  getMembers = loadMembers,
) => {
  const [rawExpenses, allMembers] = await Promise.all([
    getExpenses(),
    getMembers(),
  ])

  const members = allMembers.filter(
    (member) => member.household_id === householdId,
  )

  const mockExpenses = rawExpenses
    .filter((expense) => expense.household_id === householdId)
    .map((expense) => normalizeExpense(expense, allMembers))

  const recurringBills = listRecurringBills(householdId).bills
  const householdCreatedExpenses = createdExpenses.filter(
    (expense) => expense.householdId === householdId,
  )

  return {
    allMembers,
    members,
    expenses: [
      ...mockExpenses,
      ...householdCreatedExpenses,
      ...recurringBills,
    ].map(withSettlements),
  }
}

const listHouseholdExpenses = async (
  id,
  getExpenses = loadExpenses,
  getMembers = loadMembers,
) => {
  const householdId = toId(id)

  if (householdId === null) {
    return {
      status: 400,
      error: "householdId must be a number",
    }
  }

  const data = await loadHouseholdData(householdId, getExpenses, getMembers)

  return {
    expenses: data.expenses,
    members: data.members.map((member) => ({
      id: member.id,
      firstName: member.first_name,
      lastName: member.last_name,
      householdId: member.household_id,
    })),
  }
}

const settleExpense = async (
  id,
  expenseId,
  memberId,
  getExpenses = loadExpenses,
  getMembers = loadMembers,
) => {
  const householdId = toId(id)
  const member = toId(memberId)

  if (householdId === null || member === null) {
    return {
      status: 400,
      error: "householdId and memberId must be numbers",
    }
  }

  const data = await loadHouseholdData(householdId, getExpenses, getMembers)

  if (!data.members.some((current) => current.id === member)) {
    return {
      status: 404,
      error: "Member not found in this household",
    }
  }

  const expense = data.expenses.find((current) => current.id === expenseId)

  if (!expense) {
    return {
      status: 404,
      error: "Expense not found in this household",
    }
  }

  settlements.set(
    expenseId,
    new Set([...(settlements.get(expenseId) || []), member]),
  )

  return { expense: withSettlements(expense) }
}

const resetExpenseState = () => {
  settlements = new Map()
  createdExpenses = []
  nextExpenseId = 10000
}

module.exports = {
  createHouseholdExpense,
  listHouseholdExpenses,
  settleExpense,
  resetExpenseState,
}