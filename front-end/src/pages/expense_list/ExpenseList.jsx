import React, { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import SplitLeaseLogo from "../../assets/splitlease-blank-background-logo.png"
import { getCurrentUser } from "../login/authApi"
import {
  createHouseholdExpense,
  getHouseholdExpenses,
  settleExpense,
} from "./expenseApi"
import "./ExpenseList.css"

const EMPTY_FORM = {
  name: "",
  description: "",
  amount: "",
}
import Header from '../../components/Header';

const ExpenseList = () => {
  const navigate = useNavigate()
  const currentUser = getCurrentUser()
  const householdId = currentUser?.householdId

  const [expenses, setExpenses] = useState([])
  const [members, setMembers] = useState([])
  const [selectedExpenseId, setSelectedExpenseId] = useState(null)
  const [formData, setFormData] = useState(EMPTY_FORM)
  const [formErrors, setFormErrors] = useState({})
  const [pageError, setPageError] = useState("")
  const [settlementError, setSettlementError] = useState("")
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [settlingExpenseId, setSettlingExpenseId] = useState(null)

  const selectedExpense = expenses.find(
    (expense) => expense.id === selectedExpenseId,
  )

  const unpaidExpenses = expenses.filter(
    (expense) => !expense.paidByMemberIds.includes(currentUser?.id),
  )

  const memberName = (memberId) => {
    const member = members.find((currentMember) => currentMember.id === memberId)

    return member
      ? `${member.firstName} ${member.lastName}`
      : "Unknown member"
  }

  useEffect(() => {
    if (!householdId) {
      setLoading(false)
      return
    }

    const fetchExpenses = async () => {
      try {
        const data = await getHouseholdExpenses(householdId)
        setExpenses(data.expenses)
        setMembers(data.members)
      } catch {
        setPageError("Could not load household expenses. Please try again.")
      } finally {
        setLoading(false)
      }
    }

    fetchExpenses()
  }, [householdId])

  const handleInputChange = (event) => {
    const { name, value } = event.target

    setFormData((currentForm) => ({
      ...currentForm,
      [name]: value,
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    setCreating(true)
    setFormErrors({})
    setPageError("")

    try {
      const result = await createHouseholdExpense(
        householdId,
        formData,
        currentUser.id,
      )

      if (result.errors) {
        setFormErrors(result.errors)
        return
      }

      if (result.error) {
        setPageError(result.error)
        return
      }

      setExpenses((currentExpenses) => [...currentExpenses, result.expense])
      setSelectedExpenseId(result.expense.id)
      setFormData(EMPTY_FORM)
    } catch {
      setPageError("Could not create the one-time expense. Please try again.")
    } finally {
      setCreating(false)
    }
  }

  const handleSettle = async (expenseId) => {
    setSettlingExpenseId(expenseId)
    setSettlementError("")

    try {
      const result = await settleExpense(
        householdId,
        expenseId,
        currentUser.id,
      )

      if (result.error) {
        setSettlementError(result.error)
        return
      }

      setExpenses((currentExpenses) =>
        currentExpenses.map((expense) =>
          expense.id === result.expense.id ? result.expense : expense,
        ),
      )
    } catch {
      setSettlementError("Could not settle this expense. Please try again.")
    } finally {
      setSettlingExpenseId(null)
    }
  }

  return (
    <div className="mainContainer">
      <Header page_title= "Household Expenses" backTo="/household"/>
      {pageError && <p className="expense-error">{pageError}</p>}

      <div className="sectionContainer">
        <h2 className="sectionTitle">Expenses</h2>

        {loading ? (
          <p>Loading expenses...</p>
        ) : expenses.length === 0 ? (
          <p>There are currently no expenses available.</p>
        ) : (
          <div className="expenseRows">
          {expenses.map((expense) => (
            <div key={expense.id} className="expense-item">
              <button
                type="button"
                className="listRow"
                onClick={() => setSelectedExpenseId(expense.id)}
              >
                {expense.name}
              </button>
            </div>
          ))}
          </div>
        )}
      </div>

      <div className="sectionContainer">
        <h2 className="sectionTitle">Expenses to Be Settled</h2>

        {settlementError && (
          <p className="expense-error">{settlementError}</p>
        )}

        {loading ? (
          <p>Loading expenses...</p>
        ) : unpaidExpenses.length === 0 ? (
          <p>You have no expenses to settle.</p>
        ) : (
          <div className="expenseRows">
          {unpaidExpenses.map((expense) => (
            <div key={expense.id} className="listRow expenseSettleRow">
              <button
                type="button"
                className="expenseRowName"
                onClick={() => setSelectedExpenseId(expense.id)}
              >
                {expense.name}
              </button>

              <button
                type="button"
                className="primaryButton expenseSettleButton"
                disabled={settlingExpenseId === expense.id}
                onClick={() => handleSettle(expense.id)}
              >
                {settlingExpenseId === expense.id ? "Settling..." : "Settle"}
              </button>
            </div>
          ))}
          </div>
        )}
      </div>

      <div className="sectionContainer expenseDetails">
        <h2 className="sectionTitle"></h2>

        {selectedExpense ? (
          <div>
            <p>
              <strong>Name:</strong> {selectedExpense.name}
            </p>
            <p>
              <strong>Description:</strong>{" "}
              {selectedExpense.description || "No description provided."}
            </p>
            <p>
              <strong>Price:</strong> ${Number(selectedExpense.amount).toFixed(2)}
            </p>
            <p>
              <strong>Type:</strong>{" "}
              {selectedExpense.kind === "recurring"
                ? "Recurring Bill"
                : "One-Time Expense"}
            </p>

            {selectedExpense.frequency && (
              <p>
                <strong>Frequency:</strong> {selectedExpense.frequency}
              </p>
            )}

            <h2 className="expenseSubheading">Members Who Have Paid</h2>

            {selectedExpense.paidByMemberIds.length === 0 ? (
              <p>No members have settled this expense yet.</p>
            ) : (
              <ul className="paidMembersList">
                {selectedExpense.paidByMemberIds.map((memberId) => (
                  <li key={memberId}>{memberName(memberId)}</li>
                ))}
              </ul>
            )}
          </div>
        ) : (
          <p>No expense has been selected.</p>
        )}
      </div>

      <div className="sectionContainer">
        <h2 className="sectionTitle"></h2>

        <form onSubmit={handleSubmit} className="expenseForm">
          <div>
            <label htmlFor="expenseName" className="expenseLabel" >Expense Name</label>
            <input
              className="textField"
              id="expenseName"
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Enter expense name"
            />
            {formErrors.name && (
              <p className="field-error">{formErrors.name}</p>
            )}
          </div>

          <div>
            <label htmlFor="expenseDescription" className="expenseLabel">Description</label>
            <textarea
              className="textField"
              id="expenseDescription"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Enter expense description"
            />
          </div>

          <div>
            <label htmlFor="expenseAmount" className="expenseLabel">Price</label>
            <input
              className="textField"
              id="expenseAmount"
              type="text"
              name="amount"
              value={formData.amount}
              onChange={handleInputChange}
              placeholder="Enter expense price"
            />
            {formErrors.amount && (
              <p className="field-error">{formErrors.amount}</p>
            )}
          </div>

          <button type="submit" className="primaryButton" disabled={creating}>
            {creating ? "Submitting..." : "Submit Expense"}
          </button>
        </form>
      </div>

      <div className="sectionContainer expenseActions">
        <button
          className="primaryButton"
          type="button"
          onClick={() => navigate("/rent-split")}
        >
          Split Rent
        </button>
        <button
          className="primaryButton"
          type="button"
          onClick={() => navigate("/monthly-activity")}
        >
          See Monthly Activity
        </button>
      </div>
    </div>
  )
}

export default ExpenseList