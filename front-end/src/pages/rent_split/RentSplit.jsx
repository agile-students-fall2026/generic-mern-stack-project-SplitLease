import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import Header from "../../components/Header"
import { getCurrentUser } from "../login/authApi"
import {
  calculateRentSplit,
  getRentSplitMembers,
} from "./rentSplitApi"
import "./RentSplit.css"

const formatMoney = (amount) =>
  `$${Number(amount).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`

const RentSplit = () => {
  const navigate = useNavigate()
  const currentUser = getCurrentUser()
  const householdId = currentUser?.householdId

  const [members, setMembers] = useState([])
  const [totalRent, setTotalRent] = useState("")
  const [amounts, setAmounts] = useState({})
  const [result, setResult] = useState(null)
  const [formErrors, setFormErrors] = useState({})
  const [pageError, setPageError] = useState("")
  const [loading, setLoading] = useState(true)
  const [calculating, setCalculating] = useState(false)

  useEffect(() => {
    if (!householdId) {
      setPageError("You must belong to a household to split rent.")
      setLoading(false)
      return
    }

    const loadMembers = async () => {
      try {
        const data = await getRentSplitMembers(householdId)

        setMembers(data.members)
        setAmounts(
          data.members.reduce(
            (currentAmounts, member) => ({
              ...currentAmounts,
              [member.id]: "",
            }),
            {},
          ),
        )
      } catch {
        setPageError("Could not load household members. Please try again.")
      } finally {
        setLoading(false)
      }
    }

    loadMembers()
  }, [householdId])

  const applyResult = (split) => {
    setResult(split)
    setAmounts(
      split.shares.reduce(
        (currentAmounts, share) => ({
          ...currentAmounts,
          [share.memberId]: share.amount.toFixed(2),
        }),
        {},
      ),
    )
  }

  const handleEvenSplit = async () => {
    setCalculating(true)
    setFormErrors({})
    setPageError("")

    try {
      const split = await calculateRentSplit(householdId, { totalRent })

      if (split.errors) {
        setFormErrors(split.errors)
        return
      }

      if (split.error) {
        setPageError(split.error)
        return
      }

      applyResult(split)
    } catch {
      setPageError("Could not calculate the rent split. Please try again.")
    } finally {
      setCalculating(false)
    }
  }

  const handleCustomSplit = async (event) => {
    event.preventDefault()

    setCalculating(true)
    setFormErrors({})
    setPageError("")

    try {
      const split = await calculateRentSplit(householdId, {
        totalRent,
        shares: members.map((member) => ({
          memberId: member.id,
          amount: amounts[member.id],
        })),
      })

      if (split.errors) {
        setFormErrors(split.errors)
        return
      }

      if (split.error) {
        setPageError(split.error)
        return
      }

      applyResult(split)
    } catch {
      setPageError("Could not calculate the rent split. Please try again.")
    } finally {
      setCalculating(false)
    }
  }

  if (loading) {
    return (
      <div className="mainContainer">
        <p className="rentSplitMessage">Loading roommates...</p>
      </div>
    )
  }

  return (
    <div className="mainContainer">
      <Header page_title="Split Rent" backTo="/expenses" />

      <section className="rentSplitCard">
        <h1>Rent Split</h1>
        <p>Enter the rent total, then split it evenly or set each amount.</p>

        {pageError && <p className="rentSplitError">{pageError}</p>}

        <form onSubmit={handleCustomSplit}>
          <label htmlFor="totalRent">Total Monthly Rent</label>
          <input
            id="totalRent"
            type="text"
            value={totalRent}
            onChange={(event) => setTotalRent(event.target.value)}
            placeholder="2500.00"
          />
          {formErrors.totalRent && (
            <p className="rentSplitError">{formErrors.totalRent}</p>
          )}

          <div className="rentSplitActions">
            <button
              type="button"
              onClick={handleEvenSplit}
              disabled={calculating}
            >
              Split Evenly
            </button>

            <button type="submit" disabled={calculating}>
              {calculating ? "Calculating..." : "Save Custom Split"}
            </button>
          </div>

          <h2>Roommate Shares</h2>

          {members.map((member) => (
            <div className="rentShareRow" key={member.id}>
              <label htmlFor={`member-${member.id}`}>
                {member.firstName} {member.lastName}
              </label>
              <input
                id={`member-${member.id}`}
                type="text"
                value={amounts[member.id] || ""}
                onChange={(event) =>
                  setAmounts((currentAmounts) => ({
                    ...currentAmounts,
                    [member.id]: event.target.value,
                  }))
                }
                placeholder="0.00"
              />
            </div>
          ))}

          {formErrors.shares && (
            <p className="rentSplitError">{formErrors.shares}</p>
          )}
        </form>
      </section>

      {result && (
        <section className="rentSplitCard">
          <h2>Calculated Split</h2>
          <p>Total Rent: {formatMoney(result.totalRent)}</p>

          <ul className="rentSplitResults">
            {result.shares.map((share) => (
              <li key={share.memberId}>
                <span>{share.name}</span>
                <strong>{formatMoney(share.amount)}</strong>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="actionButtons">
        <button
          className="monthlyActivityButton"
          type="button"
          onClick={() => navigate("/expenses")}
        >
          Back to Expenses
        </button>
      </div>
    </div>
  )
}

export default RentSplit