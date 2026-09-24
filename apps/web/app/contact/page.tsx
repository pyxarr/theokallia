import React, { ViewTransition } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'

const page = () => {
  return (
    <ViewTransition>
      <div className="flex items-center bg-neutral-25 py-20 px-20">
        <div className="flex w-full items-center gap-10">

          <div className="flex flex-1 flex-col gap-6">
            <h1 className="font-le-jour text-6xl leading-tight tracking-tight uppercase">
              Contact Us
            </h1>
            <p className="max-w-md font-cormorant-garamond text-2xl/9 font-light text-black">
              Have a question about our pieces, your order, or anything else? Our
              team is always here to assist you and ensure you have the best
              experience with us.
            </p>
          </div>

          <div className="flex flex-1 flex-col gap-6">
            {/* First name + Last name */}
            <div className="flex gap-4">
              <div className="flex flex-1 flex-col gap-2">
                <Label className="text-sm font-light">First name</Label>
                <Input className="h-12 rounded-none border-gray-900 bg-white drop-shadow-md" />
              </div>
              <div className="flex flex-1 flex-col gap-2">
                <Label className="text-sm font-light">Last name</Label>
                <Input className="h-12 rounded-none border-gray-900 bg-white drop-shadow-md" />
              </div>
            </div>

            {/* Email */}
            <div className="flex flex-col gap-2">
              <Label className="text-sm font-light">Email</Label>
              <Input
                type="email"
                className="h-12 rounded-none border-gray-900 bg-white drop-shadow-md"
              />
            </div>

            {/* Message */}
            <div className="flex flex-col gap-2">
              <Label className="text-sm font-light">How can we help</Label>
              <Textarea
                placeholder="Enter Message......"
                className="h-44 resize-none rounded-none border-gray-900 bg-white placeholder:text-gray-300 drop-shadow-md"
              />
            </div>

            {/* Submit */}
            <div className="flex justify-end">
              <Button className="rounded-none px-6 py-4 text-sm tracking-wide">
                Send Message
              </Button>
            </div>
          </div>
        </div>
      </div>
    </ViewTransition>
  )
}

export default page
