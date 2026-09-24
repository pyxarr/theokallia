'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  updateProfileSchema,
  type UpdateProfileInput,
} from '@/lib/validations/update-profile'
import { useUpdateProfile } from '@/lib/hooks/use-profile'
import { useAuthStore } from '@/lib/stores/auth-store'

interface EditProfileFormProps {
  onBack: () => void
}

export default function EditProfileForm({ onBack }: EditProfileFormProps) {
  const { user } = useAuthStore()
  const { mutate: updateProfile, isPending } = useUpdateProfile()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    // pre-fill with current user data
    defaultValues: {
      firstName: user?.firstName ?? '',
      lastName: user?.lastName ?? '',
      email: user?.email ?? '',
      phone: user?.phone ?? '',
      address: user?.address ?? '',
    },
  })

  const onSubmit = (data: UpdateProfileInput) => {
    updateProfile(data, {
      onSuccess: () => onBack(),
    })
  }

  return (
    <div className="scrollbar-hide flex max-h-[600px] flex-col overflow-y-auto">
      <h2 className="mb-8 text-center font-le-jour text-2xl font-normal">
        EDIT PROFILE
      </h2>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label className="text-sm font-normal text-gray-700">
            First Name
          </Label>
          <Input
            {...register('firstName')}
            className="rounded-none border-gray-300"
          />
          {errors.firstName && (
            <p className="text-xs text-red-500">{errors.firstName.message}</p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label className="text-sm font-normal text-gray-700">Last Name</Label>
          <Input
            {...register('lastName')}
            className="rounded-none border-gray-300"
          />
          {errors.lastName && (
            <p className="text-xs text-red-500">{errors.lastName.message}</p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label className="text-sm font-normal text-gray-700">Email</Label>
          <Input
            {...register('email')}
            type="email"
            className="rounded-none border-gray-300"
          />
          {errors.email && (
            <p className="text-xs text-red-500">{errors.email.message}</p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label className="text-sm font-normal text-gray-700">Phone</Label>
          <Input
            {...register('phone')}
            type="tel"
            className="rounded-none border-gray-300"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label className="text-sm font-normal text-gray-700">Address</Label>
          <Textarea
            {...register('address')}
            rows={4}
            className="w-full resize-none border-gray-300 px-3 py-2 text-sm outline-none focus:border-purple-700 focus:ring-1 focus:ring-purple-700"
            style={{ fontFamily: 'var(--font-cormorant-garamond)' }}
            placeholder="Enter your address"
          />
        </div>

        <div className="sticky bottom-0 mt-4 bg-white pt-2">
          <Button
            type="submit"
            disabled={isPending}
            className="w-full rounded-none bg-purple-700 py-5 text-sm tracking-wide text-white hover:bg-purple-800"
          >
            {isPending ? 'Saving...' : 'Save changes'}
          </Button>
        </div>
      </form>
    </div>
  )
}
