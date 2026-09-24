import api from '@/lib/api'
import { useMutation } from '@tanstack/react-query'

// types

interface PaymentInitializeResponse {
  access_code: string
  publicKey: string
  amount: number
  email: string
  reference: string
}

interface PaymentVerifyResponse {
  status: string
  reference: string
  amount: number
  customer: {
    email: string
  }
  metadata: {
    orderId: string
  }
}

// fetchers

const initializePayment = async (orderId: string): Promise<PaymentInitializeResponse> => {
  const res = await api.post(`/payments/initialize/${orderId}`)
  return res.data
}

const verifyPayment = async (reference: string): Promise<PaymentVerifyResponse> => {
  const res = await api.get(`/payments/verify`, {
    params: { reference },
  })
  return res.data
}

// hooks

export const useInitializePayment = () => {
  return useMutation({
    mutationFn: initializePayment,
  })
}

export const useVerifyPayment = () => {
  return useMutation({
    mutationFn: verifyPayment,
  })
}
