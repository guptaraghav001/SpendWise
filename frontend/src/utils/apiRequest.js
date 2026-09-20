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

  const response = await fetch(
    `${API_URL}${endpoint}`,
    {
      ...options,
      headers
    }
  )

  return handleApiResponse(response)
}