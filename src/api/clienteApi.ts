import axios from 'axios'

export const clienteApi = axios.create({
  baseURL: 'http://localhost:8080/api',
})

clienteApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})
