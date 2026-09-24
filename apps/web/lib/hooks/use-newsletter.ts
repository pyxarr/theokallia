import { useMutation } from '@tanstack/react-query'
import api from '@/lib/api'
import { toast } from 'sonner'

// Fetchers

interface SubscribePayload {
  email: string
}

interface SubscribeResponse {
  success: boolean
  /** Always the same copy — membership is never leaked. */
  message: string
}

const subscribeNewsletter = async (
  payload: SubscribePayload
): Promise<SubscribeResponse> => {
  const res = await api.post('/subscribers', payload)
  return res.data
}

// Hooks

/**
 * Newsletter signup — used by the homepage newsletter form. No session is
 * needed; the API infers registered status from the email itself.
 */
export const useSubscribeNewsletter = () => {
  return useMutation({
    mutationFn: subscribeNewsletter,
    onError: (err: Error) => {
      toast.error(err.message || 'Could not subscribe — please try again')
    },
  })
}
