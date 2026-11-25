const axios = require("axios")
const { listRecurringBills } = require("./recurringBillService")

let settlements = new Map()

const toId = (value) =>
  Number.isInteger(Number(value)) ? Number(value) : null

const loadExpenses = async () =>
  (await axios.get(process.env.MOCKAROO_EXPENSES_API_URL)).data

const loadMembers = async () =>
  (await axios.get(process.env.MOCKAROO_MEMBERS_API_URL)).data

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

const normalizeExpense = (expense, members) => ({
  id: `mock-${expense.id}`,
  householdId: expense.household_id,
  name: expense.name || expense.expense_name || "Unnamed expense",
  description: expense.description || "",
  amount: Number(expense.amount ?? expense.price ?? 0),
  kind: "one-time",
  frequency: null,
  paidByMemberIds: payerIds(expense.paid_by, members),
})

const withSettlements = (expense) => ({
  ...expense,
  paidByMemberIds: [
    ...new Set([
      ...expense.paidByMemberIds,
      ...(settlements.get(expense.id) || []),
    ]),
  ],
})

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

  return {
    allMembers,
    members,
    expenses: [...mockExpenses, ...recurringBills].map(withSettlements),
  }
}

const listHouseholdExpenses = async (
  id,
  getExpenses = loadExpenses,
  getMembers = loadMembers,
) => {
  const householdId = toId(id)
  if (householdId === null)
    return { status: 400, error: "householdId must be a number" }

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

  if (householdId === null || member === null)
    return { status: 400, error: "householdId and memberId must be numbers" }

  const data = await loadHouseholdData(householdId, getExpenses, getMembers)

  if (!data.members.some((current) => current.id === member))
    return { status: 404, error: "Member not found in this household" }

  const expense = data.expenses.find((current) => current.id === expenseId)
  if (!expense)
    return { status: 404, error: "Expense not found in this household" }

  settlements.set(
    expenseId,
    new Set([...(settlements.get(expenseId) || []), member]),
  )

  return { expense: withSettlements(expense) }
}

const resetExpenseState = () => {
  settlements = new Map()
}

module.exports = {
  listHouseholdExpenses,
  settleExpense,
  resetExpenseState,
}