import axios from 'axios'
import { env } from '@/lib/env'

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
        // clear any cached queries and redirect
        window.location.href = '/login'
      }
      return Promise.reject(error)
    },
  )
}

export default api