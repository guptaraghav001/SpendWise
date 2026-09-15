export const handleApiResponse = async (response) => {
  let data = {}

  try {
    data = await response.json()
  } catch {
    data = {}
  }

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

  if (!response.ok) {
    throw new Error(
      data.message || 'Something went wrong'
    )
  }

  return data
}