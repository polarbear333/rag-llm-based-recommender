import axios, { AxiosError } from "axios"

const API_BASE_URL = "http://localhost:8000"

export const searchProducts = async (query: string) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/search`, { params: { query } })
    console.log("API Response:", response.data)
    return response.data
  } catch (error) {
    let errorMessage = "Unknown error occurred"
    
    if (axios.isAxiosError(error)) {
      // Handle Axios-specific errors
      const axiosError = error as AxiosError<{ detail?: string }>
      errorMessage = axiosError.response?.data?.detail || axiosError.message
    } else if (error instanceof Error) {
      // Handle generic errors
      errorMessage = error.message
    }

    console.error("Error searching products:", errorMessage)
    throw new Error(errorMessage)
  }
}