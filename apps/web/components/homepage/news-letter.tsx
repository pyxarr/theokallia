'use client'

import { useState } from 'react'
import { Input } from '../ui/input'
import { Button } from '../ui/button'
import { ArrowRight, Check } from 'lucide-react'
import { toast } from 'sonner'
import { useSubscribeNewsletter } from '@/lib/hooks/use-newsletter'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Homepage newsletter signup — posts to the public POST /subscribers endpoint.
 * Success always reads the same way (the API never reveals membership), so a
 * generic thank-you is shown even for already-subscribed emails.
 */
const NewsLetter = () => {
  const [email, setEmail] = useState('')
  const [done, setDone] = useState(false)
  const { mutateAsync: subscribe, isPending } = useSubscribeNewsletter()

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    const trimmed = email.trim()
    if (!emailPattern.test(trimmed)) {
      toast.error('Enter a valid email address')
      return
    }
    try {
      await subscribe({ email: trimmed })
      setDone(true)
    } catch {
      toast.error('Could not subscribe — please try again')
    }
  }

  return (
    <section className="container mx-auto my-10 flex flex-col items-center justify-center space-y-6">
      <p className="max-w-120 text-center text-xl">
        Subscribe to receive exclusive offers, new collection updates, and
        timeless jewelry inspiration.
      </p>

      {done ? (
        <p className="flex items-center gap-2 text-lg font-medium">
          <Check className="size-6" />
          You are on the list. Watch your inbox.
        </p>
      ) : (
        <form
          onSubmit={(event) => void handleSubmit(event)}
          className="mx-auto flex w-full max-w-2xl gap-2"
        >
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={isPending}
            className="h-14 rounded-none border-gray-200 text-lg placeholder:text-lg focus-visible:ring-0 focus-visible:ring-offset-0"
          />
          <Button
            type="submit"
            disabled={isPending}
            className="h-14 w-14 shrink-0 rounded-none"
          >
            <ArrowRight className="size-6 text-white" />
          </Button>
        </form>
      )}
    </section>
  )
}

export default NewsLetter
