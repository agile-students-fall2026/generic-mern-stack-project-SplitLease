import axios from "axios";

// Gets how much each member of the household owes.
export const getBalances = async (householdId) => {
  const { data } = await axios.get(`/api/households/${householdId}/balances`);
  return data;
};

// Sends a payment from one roommate to another.
// Returns the server's response when it worked, or { error } when the payment is not allowed.
export const settlePayment = async (householdId, payment) => {
  try {
    const { data } = await axios.post(`/api/households/${householdId}/settle`, payment);
    return data;
  } catch (error) {
    if (error.response && error.response.status < 500 && error.response.data) {
      return { error: error.response.data.error };
    }
    throw error;
  }
};
export const getDebts = async (householdId) => {
  const { data } = await axios.get(`/api/households/${householdId}/debts`);
  return data;
};