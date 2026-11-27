import { useEffect, useState } from "react";
import Header from "../../components/Header";
import { getCurrentUser } from "../login/authApi";
import { getBalances, getDebts, settlePayment } from "./settleApi";
import "./SettlePayments.css";

const formatMoney = (amount) => `$${Math.abs(amount).toFixed(2)}`;

const SettlePayments = () => {
    const currentUser = getCurrentUser();
    const householdId = currentUser?.householdId;

    const [balances, setBalances] = useState([]);
    const [debts, setDebts] = useState([]);
    const [toMemberId, setToMemberId] = useState("");
    const [amount, setAmount] = useState("");
    const [message, setMessage] = useState(null);

  useEffect(() => {
    if (!householdId) return;

    getBalances(householdId)
      .then((data) => setBalances(data.balances))
      .catch(() => setMessage({ type: "error", text: "Could not load balances." }));
      
    getDebts(householdId)
      .then((data) => setDebts(data.debts))
      .catch(() => setMessage({ type: "error", text: "Could not load who owes whom." }));

  }, [householdId]);

  const roommates = balances.filter((balance) => balance.memberId !== currentUser?.id);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage(null);

    try {
      const result = await settlePayment(householdId, {
        fromMemberId: currentUser.id,
        toMemberId: Number(toMemberId),
        amount: Number(amount),
      });

      if (result.error) {
        setMessage({ type: "error", text: result.error });
        return;
      }

      setMessage({ type: "success", text: result.message });
      setAmount("");
      const updated = await getBalances(householdId);
      setBalances(updated.balances);
      const updatedDebts = await getDebts(householdId);
      setDebts(updatedDebts.debts);
    } catch {
      setMessage({ type: "error", text: "Could not reach the server. Please try again." });
    }
  };

  if (!householdId) {
    return (
      <div className="mainContainer">
        <Header page_title="Settle Payments" backTo="/home" />
        <p className="settleMessage">Log in and choose a household on the Home page first.</p>
      </div>
    );
  }

  return (
    <div className="mainContainer">
      <Header page_title="Settle Payments" backTo="/household" />

      <div className="sectionContainer">
        <h2 className="sectionTitle">Balances</h2>
        <div className="settleList">
          {balances.map((balance) => (
            <div key={balance.memberId} className="listRow settleRow">
              <span>{balance.name}</span>
              <span className={balance.owes > 0 ? "settleOwes" : "settleOwed"}>
                {balance.owes > 0
                  ? `Owes ${formatMoney(balance.owes)}`
                  : `Is owed ${formatMoney(balance.owes)}`}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="sectionContainer">
        <h2 className="sectionTitle">Who Owes Whom</h2>
        {debts.length === 0 ? (
          <p className="settleMessage">Everyone is even!</p>
        ) : (
          debts.map((debt) => (
            <div key={`${debt.fromMemberId}-${debt.toMemberId}`} className="listRow settleRow">
              <span>{debt.fromName} → {debt.toName}</span>
              <span>{formatMoney(debt.amount)}</span>
            </div>
          ))
        )}
      </div>

      <form className="sectionContainer" onSubmit={handleSubmit}>
        <h2 className="sectionTitle">Pay a Roommate</h2>

        <label htmlFor="settleTo" className="settleLabel">Pay to</label>
        <select
          id="settleTo"
          className="textField"
          value={toMemberId}
          onChange={(e) => setToMemberId(e.target.value)}
          required
        >
          <option value="">Choose a roommate</option>
          {roommates.map((balance) => (
            <option key={balance.memberId} value={balance.memberId}>
              {balance.name}
            </option>
          ))}
        </select>

        <label htmlFor="settleAmount" className="settleLabel">Amount</label>
        <input
          id="settleAmount"
          type="number"
          min="0.01"
          step="0.01"
          className="textField"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
        />

        {message && (
          <p className={message.type === "error" ? "settleError" : "settleSuccess"}>
            {message.text}
          </p>
        )}

        <button type="submit" className="primaryButton settleButton"> Settle </button>
      </form>
    </div>
  );
};

export default SettlePayments;