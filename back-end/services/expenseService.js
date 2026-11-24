const axios = require("axios")
const { listRecurringBills } = require("./recurringBillService")

let settledMemberIdsByExpenseId = new Map()

const loadMockExpenses = async () => {
  const response = await axios.get(process.env.MOCKAROO_EXPENSES_API_URL)
  return response.data
}

const loadMockMembers = async () => {
  const response = await axios.get(process.env.MOCKAROO_MEMBERS_API_URL)
  return response.data
}

const toInteger = (value) => {
  const number = Number(value)
  return Number.isInteger(number) ? number : null
}

const getMemberIdFromName = (name, members) => {
  const normalizedName = String(name).trim().toLowerCase()

  const member = members.find((currentMember) => {
    const firstName = String(currentMember.first_name || "").toLowerCase()
    const fullName =
      `${currentMember.first_name || ""} ${currentMember.last_name || ""}`
        .trim()
        .toLowerCase()

    return normalizedName === firstName || normalizedName === fullName
  })

  return member ? member.id : null
}

const normalizePaidByMemberIds = (expense, members) => {
  const payerNames = String(expense.paid_by || "")
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean)

  return [
    ...new Set(
      payerNames
        .map(
          (payerName) =>
            toInteger(payerName) ?? getMemberIdFromName(payerName, members),
        )
        .filter((memberId) => memberId !== null),
    ),
  ]
}

const normalizeMockExpense = (expense, members) => ({
  id: `mock-${expense.id}`,
  householdId: expense.household_id,
  name: expense.name || expense.expense_name || "Unnamed expense",
  description: expense.description || "",
  amount: Number(expense.amount ?? expense.price ?? 0),
  kind: "one-time",
  frequency: null,
  paidByMemberIds: normalizePaidByMemberIds(expense, members),
})

const addSettlementOverlay = (expense) => {
  const settledMemberIds = settledMemberIdsByExpenseId.get(expense.id) || new Set()

  return {
    ...expense,
    paidByMemberIds: [
      ...new Set([...expense.paidByMemberIds, ...settledMemberIds]),
    ],
  }
}

const buildHouseholdExpenses = (householdId, expenses, members) => {
  const mockExpenses = expenses
    .filter((expense) => expense.household_id === householdId)
    .map((expense) => normalizeMockExpense(expense, members))

  const recurringResult = listRecurringBills(householdId)
  const recurringBills = recurringResult.bills || []

  return [...mockExpenses, ...recurringBills].map(addSettlementOverlay)
}

const listHouseholdExpenses = async (
  householdId,
  loadExpenses = loadMockExpenses,
  loadMembers = loadMockMembers,
) => {
  const householdIdNumber = toInteger(householdId)

  if (householdIdNumber === null) {
    return {
      status: 400,
      error: "householdId must be a number",
    }
  }

  const [expenses, allMembers] = await Promise.all([
    loadExpenses(),
    loadMembers(),
  ])

  const members = allMembers
    .filter((member) => member.household_id === householdIdNumber)
    .map((member) => ({
      id: member.id,
      firstName: member.first_name,
      lastName: member.last_name,
      householdId: member.household_id,
    }))

  return {
    expenses: buildHouseholdExpenses(
      householdIdNumber,
      expenses,
      allMembers,
    ),
    members,
  }
}

const settleExpense = async (
  householdId,
  expenseId,
  memberId,
  loadExpenses = loadMockExpenses,
  loadMembers = loadMockMembers,
) => {
  const householdIdNumber = toInteger(householdId)
  const memberIdNumber = toInteger(memberId)

  if (householdIdNumber === null || memberIdNumber === null) {
    return {
      status: 400,
      error: "householdId and memberId must be numbers",
    }
  }

  const [expenses, members] = await Promise.all([
    loadExpenses(),
    loadMembers(),
  ])

  const member = members.find(
    (currentMember) =>
      currentMember.id === memberIdNumber &&
      currentMember.household_id === householdIdNumber,
  )

  if (!member) {
    return {
      status: 404,
      error: "Member not found in this household",
    }
  }

  const expense = buildHouseholdExpenses(
    householdIdNumber,
    expenses,
    members,
  ).find((currentExpense) => currentExpense.id === expenseId)

  if (!expense) {
    return {
      status: 404,
      error: "Expense not found in this household",
    }
  }

  const settledMemberIds =
    settledMemberIdsByExpenseId.get(expense.id) || new Set()

  settledMemberIds.add(memberIdNumber)
  settledMemberIdsByExpenseId.set(expense.id, settledMemberIds)

  return {
    expense: addSettlementOverlay(expense),
  }
}

const resetExpenseState = () => {
  settledMemberIdsByExpenseId = new Map()
}

module.exports = {
  listHouseholdExpenses,
  settleExpense,
  resetExpenseState,
}