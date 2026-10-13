import API_URL from '../config/api.js'
import { handleApiResponse } from './handleApiResponse.js'

export const apiRequest = async (
  endpoint,
  options = {}
) => {
  const token =
    localStorage.getItem('token')

  const headers = {
    ...(options.body
      ? {
          'Content-Type':
            'application/json'
        }
      : {}),

    ...options.headers,

    Authorization:
      `Bearer ${token}`
  }

  let response

try {
  response = await fetch(
    `${API_URL}${endpoint}`,
    {
      ...options,
      headers
    }
  )
} catch (error) {
  if (error.name === 'AbortError') {
    throw error
  }

  throw new Error(
    'Unable to connect to the server. Please check your internet connection and try again.'
  )
}

return handleApiResponse(response)
}