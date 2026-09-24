'use client'

import { useState } from 'react'
import { ChevronRight, ChevronDown, SquarePen } from 'lucide-react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import EditProfileForm from '@/components/profile/edit-profile-form'
import { useLogout } from '@/lib/hooks/use-auth'
import { useRouter } from 'next/navigation'
import LogoutConfirmDialog from '@/components/profile/logout-confirm-dialog'
import { useAuthStore } from '@/lib/stores/auth-store'

type OpenSection = 'address' | 'orders' | null

interface ProfileModalProps {
  trigger: React.ReactNode
}

export default function ProfileModal({ trigger }: ProfileModalProps) {
  const { user } = useAuthStore()
  const [openSection, setOpenSection] = useState<OpenSection>(null)
  const [isPopoverOpen, setIsPopoverOpen] = useState(false)
  const [isEditingOpen, setIsEditingOpen] = useState(false)
  const [isLogoutOpen, setIsLogoutOpen] = useState(false)

  const { mutate: logout, isPending: isLoggingOut } = useLogout()
  const router = useRouter()

  const toggleSection = (section: OpenSection) => {
    setOpenSection((prev) => (prev === section ? null : section))
  }

  const handlePopoverOpenChange = (open: boolean) => {
    setIsPopoverOpen(open)
    if (!open) setOpenSection(null)
  }

  const handleEditOpen = () => {
    setIsPopoverOpen(false)
    setIsEditingOpen(true)
  }

  const handleLogoutConfirm = () => {
    logout(undefined, {
      onSuccess: () => {
        setIsLogoutOpen(false)
        setIsPopoverOpen(false)
        router.push('/')
      },
    })
  }

  return (
    <>
      {/* profile popover */}
      <Popover open={isPopoverOpen} onOpenChange={handlePopoverOpenChange}>
        <PopoverTrigger asChild>{trigger}</PopoverTrigger>
        <PopoverContent
          align="end"
          className="w-80 rounded-none border border-gray-200 p-6 shadow-lg"
        >
          <div className="flex flex-col">
            {/* user info */}
            <div className="mb-5 text-center">
              <h2 className="font-cormorant-garamond text-2xl font-normal">
                {user?.firstName} {user?.lastName}
              </h2>
              <p className="mt-1 font-cormorant-garamond text-xs text-gray-500">
                {user?.email}
              </p>
            </div>

            {/* accordion sections */}
            <div className="flex flex-col gap-3">
              {/* address */}
              <div className="border border-gray-200">
                <button
                  onClick={() => toggleSection('address')}
                  className="flex w-full items-center justify-between px-4 py-2"
                >
                  <span className="font-cormorant-garamond text-lg font-normal">
                    Address
                  </span>
                  {openSection === 'address' ? (
                    <ChevronDown size={16} strokeWidth={1.5} />
                  ) : (
                    <ChevronRight size={16} strokeWidth={1.5} />
                  )}
                </button>
                {openSection === 'address' && (
                  <div className="px-4 pb-3 font-cormorant-garamond text-sm text-gray-600">
                    {user?.address ? (
                      <p>{user.address}</p>
                    ) : (
                      <button
                        onClick={handleEditOpen}
                        className="border border-gray-300 px-4 py-1.5 text-sm hover:border-gray-400"
                      >
                        Add Address
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* order history */}
              <div className="border border-gray-200">
                <button
                  onClick={() => toggleSection('orders')}
                  className="flex w-full items-center justify-between px-4 py-2"
                >
                  <span className="font-cormorant-garamond text-lg font-normal">
                    Order history
                  </span>
                  {openSection === 'orders' ? (
                    <ChevronDown size={16} strokeWidth={1.5} />
                  ) : (
                    <ChevronRight size={16} strokeWidth={1.5} />
                  )}
                </button>
                {openSection === 'orders' && (
                  <div className="px-4 pb-3 font-cormorant-garamond text-sm">
                    <p className="text-gray-400">No orders yet</p>
                  </div>
                )}
              </div>
            </div>

            {/* edit profile button */}
            <Button
              onClick={handleEditOpen}
              className="mt-5 w-full rounded-none bg-purple-700 py-5 text-sm tracking-wide text-white hover:bg-purple-800"
            >
              <SquarePen size={15} strokeWidth={1.5} />
              Edit profile
            </Button>

            <Button
              variant="link"
              onClick={() => {
                setIsPopoverOpen(false)
                setIsLogoutOpen(true)
              }}
              className="mt-2 text-base text-red-500"
            >
              Log Out
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      {/* edit profile dialog */}
      <Dialog open={isEditingOpen} onOpenChange={setIsEditingOpen}>
        <DialogContent className="w-full max-w-sm rounded-none bg-white p-8 px-6 pb-4 shadow-md">
          <DialogTitle className="sr-only">Edit Profile</DialogTitle>
          <DialogDescription className="sr-only">
            Update your personal information including name, email, phone, and
            address
          </DialogDescription>
          <EditProfileForm onBack={() => setIsEditingOpen(false)} />
        </DialogContent>
      </Dialog>

      {/* logout confirm dialog */}
      <LogoutConfirmDialog
        isOpen={isLogoutOpen}
        onConfirm={handleLogoutConfirm}
        onCancel={() => setIsLogoutOpen(false)}
        isPending={isLoggingOut}
      />
    </>
  )
}
