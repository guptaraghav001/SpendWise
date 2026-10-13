// ======================================================
// API RESPONSE HANDLER
// ======================================================

export const handleApiResponse = async (response) => {
  let data = {}

  try {
    const text = await response.text()

    data = text ? JSON.parse(text) : {}
  } catch {
    data = {}
  }

  // Authentication failures
  if (
    response.status === 401 ||
    response.status === 403
  ) {
    localStorage.removeItem('token')
    localStorage.removeItem('user')

    window.dispatchEvent(
      new Event('auth-expired')
    )

    throw new Error(
      'Your session has expired. Please log in again.'
    )
  }

  // Rate limiting
  if (response.status === 429) {
    throw new Error(
      'Too many requests. Please wait a few minutes and try again.'
    )
  }

  // Backend unavailable
  if (response.status >= 500) {
    throw new Error(
      'The server is temporarily unavailable. Please try again later.'
    )
  }

  // Other API errors
  if (!response.ok) {
    throw new Error(
      typeof data.message === 'string'
        ? data.message
        : 'Something went wrong. Please try again.'
    )
  }

  return data
}