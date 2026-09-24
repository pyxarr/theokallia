import { useMutation } from '@tanstack/react-query'
import api from '@/lib/api'
import { useAuthStore } from '@/lib/stores/auth-store'
import type { AuthUser } from '@theokallia/types'
import type { UpdateProfileInput } from '@/lib/validations/update-profile'

export function useUpdateProfile() {
  const { setUser } = useAuthStore()

  return useMutation({
    // sends updated fields to PATCH /users/me
    mutationFn: (data: UpdateProfileInput) =>
      api.patch<AuthUser>('/users/me', data).then((res) => res.data),

    // update Zustand store immediately so profile modal reflects changes without a page refresh
    onSuccess: (updatedUser) => {
      setUser(updatedUser)
    },
  })
}