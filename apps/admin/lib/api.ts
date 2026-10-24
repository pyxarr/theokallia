import axios from 'axios'

export const API_VERSION = 'v1'

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 401 interceptor — redirect to login on session expiry
// Only triggers on browser navigation, not during SSR
if (typeof window !== 'undefined') {
  api.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        // Clear any cached queries and redirect. The current path AND
        // query string are carried over as `?next=` so the admin lands
        // back on the exact page they were on (e.g. /orders?page=2).
        window.location.href =
          '/login?next=' +
          encodeURIComponent(window.location.pathname + window.location.search)
      }
      return Promise.reject(error)
    },
  )
}

export default api