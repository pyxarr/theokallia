import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface LogoutConfirmDialogProps {
  isOpen: boolean
  onConfirm: () => void
  onCancel: () => void
  isPending: boolean
}

export default function LogoutConfirmDialog({
  isOpen,
  onConfirm,
  onCancel,
  isPending,
}: LogoutConfirmDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent  className="w-[90vw] max-w-lg rounded-none border bg-white border-gray-200 px-6 shadow-lg [&>button]:hidden">
        <DialogTitle
          className="mb-4 text-center text-3xl font-normal leading-tight w-full"
          style={{ fontFamily: 'var(--font-cormorant-garamond)' }}
        >
          Are you sure you want to log out
        </DialogTitle>
        <DialogDescription
          className="mb-6 text-center text-base text-gray-600 w-full"
          style={{ fontFamily: 'var(--font-cormorant-garamond)' }}
        >
          You&apos;ll need to sign in again to access your account.
        </DialogDescription>

        <div className="flex gap-4">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isPending}
            className="flex-1 rounded-none border-gray-300 py-6 text-base font-normal tracking-wide hover:bg-gray-50"
            style={{ fontFamily: 'var(--font-cormorant-garamond)' }}
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isPending}
            className="flex-1 rounded-none bg-purple-700 py-6 text-base font-normal tracking-wide text-white hover:bg-purple-800 disabled:opacity-50"
            style={{ fontFamily: 'var(--font-cormorant-garamond)' }}
          >
            {isPending ? 'Logging out...' : 'Log out'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}