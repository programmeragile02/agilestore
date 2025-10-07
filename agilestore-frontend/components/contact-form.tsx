"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

export function ContactForm() {
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    try {
      const fd = new FormData(e.currentTarget)
      // Simulate submit
      console.log("[v0] Contact submit:", Object.fromEntries(fd.entries()))
      await new Promise((r) => setTimeout(r, 800))
      alert("Thanks! We’ll get back to you shortly.")
      e.currentTarget.reset()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="border">
      <CardContent className="p-6 sm:p-8">
        <form onSubmit={onSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <label className="text-sm font-medium text-foreground">Full name</label>
            <Input name="name" placeholder="Your name" required />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium text-foreground">Email</label>
            <Input type="email" name="email" placeholder="you@example.com" required />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium text-foreground">Message</label>
            <Textarea name="message" placeholder="Tell us how we can help..." className="min-h-32" required />
          </div>
          <Button
            type="submit"
            disabled={loading}
            className="mt-2 bg-gradient-to-r from-indigo-500 to-blue-500 hover:opacity-90"
          >
            {loading ? "Sending..." : "Send message"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

export default ContactForm
