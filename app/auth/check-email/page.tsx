"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useState } from "react"
import { createClient } from "@/lib/supabase/client"

export default function CheckEmailPage() {
  const [isResending, setIsResending] = useState(false)
  const [message, setMessage] = useState("")

  const handleResendEmail = async () => {
    setIsResending(true)
    setMessage("")

    // Get email from URL params or localStorage if available
    const urlParams = new URLSearchParams(window.location.search)
    const email = urlParams.get("email") || localStorage.getItem("signup-email")

    if (!email) {
      setMessage("Please go back and sign up again")
      setIsResending(false)
      return
    }

    const supabase = createClient()
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setMessage("Error resending email. Please try signing up again.")
    } else {
      setMessage("Confirmation email resent! Check your inbox.")
    }
    setIsResending(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-purple-900">Check Your Email</CardTitle>
          <CardDescription>We've sent you a confirmation link</CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-sm text-gray-600">
            Please check your email and click the confirmation link to activate your account. Once confirmed, you can
            sign in and start creating your flute song collection.
          </p>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm">
            <p className="font-medium text-yellow-800 mb-2">Email not arriving?</p>
            <ul className="text-yellow-700 text-left space-y-1">
              <li>• Check your spam/junk folder</li>
              <li>• Wait a few minutes for delivery</li>
              <li>• Make sure you entered the correct email</li>
            </ul>
          </div>

          {message && (
            <p className={`text-sm ${message.includes("Error") ? "text-red-600" : "text-green-600"}`}>{message}</p>
          )}

          <div className="space-y-2">
            <Button
              onClick={handleResendEmail}
              disabled={isResending}
              variant="outline"
              className="w-full bg-transparent"
            >
              {isResending ? "Resending..." : "Resend Email"}
            </Button>

            <Link href="/auth/login">
              <Button variant="ghost" className="w-full">
                Back to Sign In
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
