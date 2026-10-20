'use client'

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center">
      <h1 className="font-le-jour text-3xl tracking-wide uppercase">Access Denied</h1>
      <p className="mt-2 text-gray-600">
        You do not have permission to access the admin dashboard.
      </p>
    </div>
  )
}
