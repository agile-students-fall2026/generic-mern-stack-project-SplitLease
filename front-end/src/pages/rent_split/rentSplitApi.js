import axios from "axios"

export const getRentSplitMembers = async (householdId) => {
  const { data } = await axios.get(
    `/api/households/${householdId}/rent-split`,
  )

  return data
}

export const calculateRentSplit = async (householdId, form) => {
  try {
    const { data } = await axios.post(
      `/api/households/${householdId}/rent-split`,
      form,
    )

    return data
  } catch (error) {
    if (error.response?.status === 400) {
      return { errors: error.response.data.errors }
    }

    if (error.response?.data?.error) {
      return { error: error.response.data.error }
    }

    throw error
  }
}