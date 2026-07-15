"use client"

import { useState, type FormEvent } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { changeAdminPassword } from "@/features/admin/api/session"

export function ChangePasswordPanel() {
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)

    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters.")
      return
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.")
      return
    }

    setIsSubmitting(true)
    try {
      await changeAdminPassword(currentPassword, newPassword)
      // Full reload so AdminSessionProvider re-fetches /api/admin/me and clears the
      // must_change_password redirect gate.
      window.location.href = "/admin/dashboard"
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to change password")
      setIsSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-sm space-y-4">
      <div>
        <h1 className="text-lg font-bold">Change your password</h1>
        <p className="text-sm text-muted-foreground">
          This account was created with a temporary password. Set a new one before continuing.
        </p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-3">
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Input
          type="password"
          placeholder="Current (temporary) password"
          value={currentPassword}
          onChange={(event) => setCurrentPassword(event.target.value)}
          autoComplete="current-password"
          required
        />
        <Input
          type="password"
          placeholder="New password (min. 8 characters)"
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
          autoComplete="new-password"
          required
        />
        <Input
          type="password"
          placeholder="Confirm new password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          autoComplete="new-password"
          required
        />
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Saving…" : "Save password"}
        </Button>
      </form>
    </div>
  )
}
