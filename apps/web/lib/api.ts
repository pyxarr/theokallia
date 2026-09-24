import axios from 'axios'

export const API_VERSION = 'v1'

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

// suppress 401 console errors — expected when user is not logged in
api.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error),
)

export default api
