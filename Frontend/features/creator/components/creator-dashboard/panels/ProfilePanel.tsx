"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { BadgeCheck, Camera, CheckCircle2, Edit3, Eye, FileText, Globe, Heart, KeyRound, PlayCircle, Star, Trash2, Upload, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { changePassword } from "@/features/account/api/accountApi"
import { createMyCreatorProfile, updateMyCreatorProfile } from "@/features/creator-profile/api/creatorProfileApi"
import {
  listConnectedAccounts,
  startSocialConnect,
  type ConnectedAccount,
  type ConnectPlatform,
} from "@/features/creator-profile/api/socialConnectApi"
import { type CreatorWorkspaceProfile } from "../creator-dashboard.shared"

const nicheOptions = ["beauty", "food", "travel", "lifestyle", "education", "fitness", "tech", "gaming", "other"]

// Only YouTube has a registered OAuth app today (see backend/src/social_connect/
// oauth_clients.py) - Instagram/TikTok are scaffolded but dormant until developer apps are
// registered, so they render disabled rather than letting a click 503.
const connectablePlatforms: { platform: ConnectPlatform; label: string; available: boolean }[] = [
  { platform: "youtube", label: "YouTube", available: true },
  { platform: "instagram", label: "Instagram", available: false },
  { platform: "tiktok", label: "TikTok", available: false },
]

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("") || "CR"
}

function titleCase(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase())
}

function normalizeNiche(value: string) {
  const normalized = value.toLowerCase().replace(/[^a-z]+/g, "_").replace(/^_+|_+$/g, "")
  return nicheOptions.includes(normalized) ? normalized : "other"
}

type ProfileForm = {
  creator: string
  handle: string
  niche: string
  location: string
  bio: string
}

type PortfolioDraft = {
  id: string
  name: string
  kind: "image" | "video" | "file"
  size: string
  previewUrl?: string
}

function fileSizeLabel(size: number) {
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

function readFilePreview(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

export function ProfilePanel({
  creatorProfile,
  onProfileChange,
}: {
  creatorProfile: CreatorWorkspaceProfile
  onProfileChange: (profile: CreatorWorkspaceProfile) => void
}) {
  const photoInputRef = useRef<HTMLInputElement>(null)
  const portfolioInputRef = useRef<HTMLInputElement>(null)
  const profileDetailsRef = useRef<HTMLDivElement>(null)
  const categorySelectRef = useRef<HTMLSelectElement>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [passwordOpen, setPasswordOpen] = useState(false)
  const [socialConnectorOpen, setSocialConnectorOpen] = useState(false)
  const [connectedAccounts, setConnectedAccounts] = useState<ConnectedAccount[]>([])
  const [connectingPlatform, setConnectingPlatform] = useState<ConnectPlatform | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [profileImagePreview, setProfileImagePreview] = useState("")
  const [portfolioDrafts, setPortfolioDrafts] = useState<PortfolioDraft[]>([])
  const [statusMessage, setStatusMessage] = useState("")
  const [passwordMessage, setPasswordMessage] = useState("")
  const [form, setForm] = useState<ProfileForm>({
    creator: creatorProfile.creator,
    handle: creatorProfile.handle,
    niche: creatorProfile.niche,
    location: creatorProfile.location,
    bio: creatorProfile.bio,
  })
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" })

  useEffect(() => {
    setForm({
      creator: creatorProfile.creator,
      handle: creatorProfile.handle,
      niche: creatorProfile.niche,
      location: creatorProfile.location,
      bio: creatorProfile.bio,
    })
  }, [creatorProfile])

  useEffect(() => {
    listConnectedAccounts()
      .then(setConnectedAccounts)
      .catch(() => setConnectedAccounts([]))
  }, [])

  const profileTags = useMemo(() => {
    return [
      creatorProfile.niche,
      creatorProfile.location,
      ...creatorProfile.connectedPlatforms.map((platform) => `${platform} connected`),
    ].filter((tag) => tag && tag !== "Profile not set" && tag !== "Location not set")
  }, [creatorProfile])

  const connectionStatus = creatorProfile.connectedPlatforms.length ? "Socials connected" : "Socials not connected"
  const profileScore = Math.round(
    ([
      creatorProfile.creator,
      creatorProfile.niche !== "Profile not set" ? creatorProfile.niche : "",
      creatorProfile.location !== "Location not set" ? creatorProfile.location : "",
      creatorProfile.bio,
      creatorProfile.connectedPlatforms.length ? "socials" : "",
    ].filter(Boolean).length /
      5) *
      100,
  )

  async function saveProfile() {
    setIsSaving(true)
    setStatusMessage("")

    const updatedProfile: CreatorWorkspaceProfile = {
      ...creatorProfile,
      creator: form.creator.trim() || "Creator",
      handle: form.handle.trim() || creatorProfile.handle,
      niche: form.niche.trim() || "other",
      location: form.location.trim() || "Location not set",
      bio: form.bio.trim() || "Connect your social accounts and complete your profile to show brands what you create.",
    }

    try {
      const payload = {
        full_name: updatedProfile.creator,
        bio: updatedProfile.bio,
        niche: normalizeNiche(updatedProfile.niche),
        availability: true,
      }
      const saved = creatorProfile.profileId ? await updateMyCreatorProfile(payload) : await createMyCreatorProfile(payload)
      onProfileChange({
        ...updatedProfile,
        profileId: saved.id,
        niche: titleCase(saved.niche),
        bio: saved.bio ?? updatedProfile.bio,
        creator: saved.full_name,
      })
      setIsEditing(false)
      setStatusMessage("Profile saved.")
    } catch (error) {
      onProfileChange(updatedProfile)
      setIsEditing(false)
      setStatusMessage(error instanceof Error ? `${error.message}. Saved locally for now.` : "Saved locally for now.")
    } finally {
      setIsSaving(false)
    }
  }

  function scrollToProfileDetails() {
    profileDetailsRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })
  }

  function startProfileCompletion() {
    setIsEditing(true)
    setStatusMessage("Complete the profile details below, then save.")
    window.setTimeout(scrollToProfileDetails, 0)
  }

  function startSocialConnection() {
    setSocialConnectorOpen(true)
    setStatusMessage("Choose the social accounts you want to show on your creator profile.")
  }

  function startCategoryEdit() {
    setIsEditing(true)
    setStatusMessage("Choose your content category, then save.")
    window.setTimeout(() => {
      scrollToProfileDetails()
      categorySelectRef.current?.focus()
    }, 0)
  }

  async function connectPlatform(platform: ConnectPlatform) {
    setConnectingPlatform(platform)
    setStatusMessage("")
    try {
      const { authorize_url } = await startSocialConnect(platform)
      window.location.href = authorize_url
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Unable to start connection.")
      setConnectingPlatform(null)
    }
  }

  function refreshProfileData() {
    if (!creatorProfile.connectedPlatforms.length) {
      startSocialConnection()
      return
    }

    setStatusMessage("Profile data refreshed from connected social selections.")
    onProfileChange({
      ...creatorProfile,
      analytics: creatorProfile.analytics.map((item) =>
        item.label === "Accounts" ? { ...item, value: creatorProfile.connectedPlatforms.length.toString(), detail: "Connected" } : item,
      ),
    })
  }

  async function submitPasswordChange() {
    setPasswordMessage("")
    if (passwordForm.newPassword.length < 8) {
      setPasswordMessage("New password must be at least 8 characters.")
      return
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordMessage("New password and confirmation do not match.")
      return
    }

    setIsChangingPassword(true)
    try {
      await changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      })
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" })
      setPasswordMessage("Password changed successfully.")
    } catch (error) {
      setPasswordMessage(error instanceof Error ? error.message : "Unable to change password.")
    } finally {
      setIsChangingPassword(false)
    }
  }

  function cancelEdit() {
    setForm({
      creator: creatorProfile.creator,
      handle: creatorProfile.handle,
      niche: creatorProfile.niche,
      location: creatorProfile.location,
      bio: creatorProfile.bio,
    })
    setIsEditing(false)
    setStatusMessage("")
  }

  async function selectProfilePhoto(fileList: FileList | null) {
    const file = fileList?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      setStatusMessage("Choose an image file for your profile photo.")
      return
    }

    try {
      setProfileImagePreview(await readFilePreview(file))
      setStatusMessage("Profile photo selected. Upload API is pending backend Phase 7.")
    } catch {
      setStatusMessage("Unable to preview this profile photo.")
    } finally {
      if (photoInputRef.current) photoInputRef.current.value = ""
    }
  }

  async function selectPortfolioFiles(fileList: FileList | null) {
    const files = Array.from(fileList ?? [])
    if (!files.length) return

    const drafts = await Promise.all(
      files.map(async (file) => {
        const isImage = file.type.startsWith("image/")
        const isVideo = file.type.startsWith("video/")
        const previewUrl = isImage ? await readFilePreview(file).catch(() => undefined) : undefined

        return {
          id: `${file.name}-${file.lastModified}-${file.size}`,
          name: file.name,
          kind: isImage ? "image" : isVideo ? "video" : "file",
          size: fileSizeLabel(file.size),
          previewUrl,
        } satisfies PortfolioDraft
      }),
    )

    setPortfolioDrafts((current) => {
      const existing = new Set(current.map((item) => item.id))
      return [...current, ...drafts.filter((item) => !existing.has(item.id))].slice(0, 8)
    })
    setStatusMessage("Portfolio work selected. Upload API is pending backend Phase 7.")
    if (portfolioInputRef.current) portfolioInputRef.current.value = ""
  }

  return (
    <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
      <div className="overflow-hidden rounded-[28px] border border-[#e8e2d9] bg-[#fbfaf7] shadow-[0_18px_46px_rgba(31,37,43,0.07)]">
        <div className="relative min-h-[300px] bg-[#e8e2d9]">
          <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url(https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1600&q=80)" }} />
          <div className="absolute inset-0 bg-gradient-to-r from-[#fbfaf7] via-[#fbfaf7]/82 to-[#fbfaf7]/25" />

          <div className="relative flex min-h-[300px] flex-col justify-end gap-5 p-5 sm:p-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
              <div className="relative">
                <div className="grid size-28 overflow-hidden rounded-[28px] bg-[#1f252b] text-4xl font-black text-white shadow-[0_18px_44px_rgba(31,37,43,0.18)] ring-4 ring-white sm:size-32">
                  {profileImagePreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img className="h-full w-full object-cover" src={profileImagePreview} alt="" />
                  ) : (
                    <span className="grid h-full w-full place-items-center">{initials(creatorProfile.creator)}</span>
                  )}
                </div>
                <input ref={photoInputRef} className="sr-only" type="file" accept="image/*" onChange={(event) => void selectProfilePhoto(event.target.files)} />
                <button className="absolute -bottom-2 -right-2 grid size-10 place-items-center rounded-full bg-[#1f252b] text-white shadow-lg transition hover:bg-[#363d43]" type="button" aria-label="Change profile photo" onClick={() => photoInputRef.current?.click()}>
                  <Camera className="size-4" aria-hidden="true" />
                </button>
              </div>

              <div className="max-w-xl">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/85 px-3 py-1 text-xs font-black text-[#1f252b] ring-1 ring-[#e8e2d9]">
                  <BadgeCheck className="size-3.5 text-[#16864f]" aria-hidden="true" />
                  {connectionStatus}
                </span>
                <h2 className="mt-3 text-3xl font-black tracking-tight text-[#1f252b] sm:text-4xl">{creatorProfile.creator}</h2>
                <p className="mt-1 text-sm font-black text-[#69716b]">{creatorProfile.handle} / {creatorProfile.niche} / {creatorProfile.location}</p>
                <p className="mt-3 max-w-lg text-sm font-semibold leading-6 text-[#505852]">{creatorProfile.bio}</p>
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row lg:flex-col xl:flex-row">
              {!isEditing ? (
                <Button className="h-10 rounded-full bg-[#1f252b] px-4 text-xs font-black text-white hover:bg-[#363d43]" type="button" onClick={() => setIsEditing(true)}>
                  <Edit3 className="size-4" aria-hidden="true" />
                  Edit profile
                </Button>
              ) : (
                <Button className="h-10 rounded-full border-[#ded8cf] px-4 text-xs font-black text-[#505852]" variant="outline" type="button" onClick={cancelEdit}>
                  <X className="size-4" aria-hidden="true" />
                  Cancel
                </Button>
              )}
              <Button className="h-10 rounded-full border-[#ded8cf] bg-white/80 px-4 text-xs font-black text-[#1f252b]" variant="outline" type="button" onClick={() => setPreviewOpen((open) => !open)}>
                <Globe className="size-4" aria-hidden="true" />
                {previewOpen ? "Hide preview" : "Preview public profile"}
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-5 p-5">
          <div className="flex flex-wrap gap-2">
            {profileTags.length ? (
              profileTags.map((tag) => (
                <span key={tag} className="rounded-full bg-[#f0ece5] px-3 py-1.5 text-xs font-black text-[#505852]">{tag}</span>
              ))
            ) : (
              <>
                <button className="rounded-full bg-[#1f252b] px-3 py-1.5 text-xs font-black text-white transition hover:bg-[#363d43]" type="button" onClick={startProfileCompletion}>
                  Complete your profile
                </button>
                <button className="rounded-full bg-[#f0ece5] px-3 py-1.5 text-xs font-black text-[#505852] transition hover:bg-[#e3ddd4]" type="button" onClick={startSocialConnection}>
                  Connect social accounts
                </button>
              </>
            )}
          </div>

          {previewOpen && (
            <section className="rounded-[24px] border border-[#e8e2d9] bg-white p-5">
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#8a8175]">Public preview</p>
              <div className="mt-4 flex flex-col gap-4 rounded-[22px] bg-[#fbfaf7] p-4 sm:flex-row sm:items-center">
                <div className="grid size-20 overflow-hidden rounded-[22px] bg-[#1f252b] text-2xl font-black text-white">
                  {profileImagePreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img className="h-full w-full object-cover" src={profileImagePreview} alt="" />
                  ) : (
                    <span className="grid h-full w-full place-items-center">{initials(creatorProfile.creator)}</span>
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-black text-[#1f252b]">{creatorProfile.creator}</h3>
                  <p className="mt-1 text-sm font-semibold text-[#69716b]">{creatorProfile.handle} / {creatorProfile.niche}</p>
                  <p className="mt-2 max-w-xl text-sm font-semibold leading-6 text-[#505852]">{creatorProfile.bio}</p>
                </div>
              </div>
            </section>
          )}

          <section className="grid gap-4 lg:grid-cols-[1fr_0.8fr]">
            <div ref={profileDetailsRef} className="rounded-[24px] border border-[#e8e2d9] bg-white p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#8a8175]">Profile details</p>
                  <h3 className="mt-1 text-lg font-black tracking-tight text-[#1f252b]">{isEditing ? "Edit creator profile" : "Public creator card"}</h3>
                </div>
                <Globe className="size-4 text-[#8a8175]" aria-hidden="true" />
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <Field disabled={!isEditing} label="Display name" value={form.creator} onChange={(value) => setForm((current) => ({ ...current, creator: value }))} />
                <Field disabled={!isEditing} label="Handle" value={form.handle} onChange={(value) => setForm((current) => ({ ...current, handle: value }))} />
                <label className="text-xs font-black text-[#69716b]">
                  Category
                  <select ref={categorySelectRef} disabled={!isEditing} className="mt-2 h-10 w-full rounded-full border border-[#ded8cf] bg-[#fbfaf7] px-4 text-sm font-semibold text-[#505852] outline-none disabled:opacity-70 focus:border-[#1f252b]" value={normalizeNiche(form.niche)} onChange={(event) => setForm((current) => ({ ...current, niche: titleCase(event.target.value) }))}>
                    {nicheOptions.map((option) => (
                      <option key={option} value={option}>{titleCase(option)}</option>
                    ))}
                  </select>
                </label>
                <Field disabled={!isEditing} label="Location" value={form.location} onChange={(value) => setForm((current) => ({ ...current, location: value }))} />
              </div>
              <label className="mt-3 block text-xs font-black text-[#69716b]">
                Bio
                <textarea disabled={!isEditing} className="mt-2 min-h-24 w-full resize-none rounded-[18px] border border-[#ded8cf] bg-[#fbfaf7] px-4 py-3 text-sm font-semibold leading-6 text-[#505852] outline-none disabled:opacity-70 focus:border-[#1f252b]" value={form.bio} onChange={(event) => setForm((current) => ({ ...current, bio: event.target.value }))} />
              </label>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                {isEditing && (
                  <Button className="h-9 rounded-full bg-[#1f252b] px-4 text-xs font-black text-white hover:bg-[#363d43]" disabled={isSaving} type="button" onClick={saveProfile}>
                    {isSaving ? "Saving..." : "Save profile"}
                  </Button>
                )}
                <Button className="h-9 rounded-full border-[#ded8cf] px-4 text-xs font-black text-[#505852]" variant="outline" type="button" onClick={() => setPasswordOpen((open) => !open)}>
                  <KeyRound className="size-4" aria-hidden="true" />
                  {passwordOpen ? "Hide password" : "Change password"}
                </Button>
                {statusMessage && <p className="text-xs font-black text-[#69716b]">{statusMessage}</p>}
              </div>
            </div>

            <div className="rounded-[24px] border border-[#e8e2d9] bg-white p-5">
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#8a8175]">Media kit</p>
              <h3 className="mt-1 text-lg font-black tracking-tight text-[#1f252b]">Creator strength</h3>
              <div className="mt-4 grid grid-cols-3 gap-2">
                <SmallStat label="Followers" value={creatorProfile.followers} />
                <SmallStat label="Accounts" value={creatorProfile.connectedPlatforms.length.toString()} />
                <SmallStat label="Status" value={creatorProfile.connectedPlatforms.length ? "Live" : "Draft"} />
              </div>
              <div className="mt-4 space-y-2 text-sm font-semibold text-[#505852]">
                <Signal icon={Eye} text={creatorProfile.connectedPlatforms.length ? "Social metrics connected" : "Connect socials to unlock reach"} onClick={startSocialConnection} />
                <Signal icon={Heart} text={creatorProfile.niche === "Profile not set" ? "Set your content category" : `${creatorProfile.niche} category`} onClick={startCategoryEdit} />
                <Signal icon={Star} text="Profile data updates after social connection" onClick={refreshProfileData} />
              </div>
            </div>
          </section>

          {socialConnectorOpen && (
            <section className="rounded-[24px] border border-[#e8e2d9] bg-white p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#8a8175]">Social accounts</p>
                  <h3 className="mt-1 text-lg font-black tracking-tight text-[#1f252b]">Connect channels</h3>
                </div>
                <button className="grid size-9 place-items-center rounded-full border border-[#ded8cf] bg-white text-[#69716b]" type="button" aria-label="Close social connector" onClick={() => setSocialConnectorOpen(false)}>
                  <X className="size-4" aria-hidden="true" />
                </button>
              </div>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {connectablePlatforms.map(({ platform, label, available }) => {
                  const connection = connectedAccounts.find((account) => account.platform === platform)
                  const isConnecting = connectingPlatform === platform

                  return (
                    <button
                      key={platform}
                      className={`flex h-12 items-center justify-between rounded-[14px] border px-4 text-sm font-black transition ${
                        connection
                          ? "border-[#1f252b] bg-[#1f252b] text-white"
                          : available
                            ? "border-[#ded8cf] bg-[#fbfaf7] text-[#505852] hover:border-[#1f252b]"
                            : "cursor-not-allowed border-[#ded8cf] bg-[#f0ece5] text-[#a19a8e]"
                      }`}
                      type="button"
                      disabled={!available || isConnecting}
                      onClick={() => connectPlatform(platform)}
                    >
                      {label}
                      <span className={`rounded-full px-2 py-1 text-[10px] ${connection ? "bg-white/15 text-white" : "bg-white text-[#69716b]"}`}>
                        {connection
                          ? connection.platform_handle
                            ? `@${connection.platform_handle}`
                            : "Connected"
                          : isConnecting
                            ? "Connecting..."
                            : available
                              ? "Connect"
                              : "Coming soon"}
                      </span>
                    </button>
                  )
                })}
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Button className="h-9 rounded-full bg-[#1f252b] px-4 text-xs font-black text-white hover:bg-[#363d43]" type="button" onClick={() => setSocialConnectorOpen(false)}>
                  Done
                </Button>
              </div>
            </section>
          )}

          {passwordOpen && (
            <section className="rounded-[24px] border border-[#e8e2d9] bg-white p-5">
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#8a8175]">Security</p>
              <h3 className="mt-1 text-lg font-black tracking-tight text-[#1f252b]">Change password</h3>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <PasswordField label="Current password" value={passwordForm.currentPassword} onChange={(value) => setPasswordForm((current) => ({ ...current, currentPassword: value }))} />
                <PasswordField label="New password" value={passwordForm.newPassword} onChange={(value) => setPasswordForm((current) => ({ ...current, newPassword: value }))} />
                <PasswordField label="Confirm password" value={passwordForm.confirmPassword} onChange={(value) => setPasswordForm((current) => ({ ...current, confirmPassword: value }))} />
              </div>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
                <Button className="h-9 rounded-full bg-[#1f252b] px-4 text-xs font-black text-white hover:bg-[#363d43]" disabled={isChangingPassword} type="button" onClick={submitPasswordChange}>
                  {isChangingPassword ? "Changing..." : "Update password"}
                </Button>
                {passwordMessage && <p className="text-xs font-black text-[#69716b]">{passwordMessage}</p>}
              </div>
            </section>
          )}

          <section className="rounded-[24px] border border-[#e8e2d9] bg-white p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#8a8175]">Portfolio</p>
                <h3 className="mt-1 text-lg font-black tracking-tight text-[#1f252b]">Featured work</h3>
              </div>
              <Button className="h-9 rounded-full border-[#ded8cf] px-3 text-xs font-black text-[#505852]" variant="outline" type="button" onClick={() => portfolioInputRef.current?.click()}>
                <Upload className="size-4" aria-hidden="true" />
                Add work
              </Button>
              <input ref={portfolioInputRef} className="sr-only" type="file" accept="image/*,video/*,.pdf" multiple onChange={(event) => void selectPortfolioFiles(event.target.files)} />
            </div>
            {portfolioDrafts.length ? (
              <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {portfolioDrafts.map((item) => (
                  <article key={item.id} className="overflow-hidden rounded-[20px] border border-[#e8e2d9] bg-[#fbfaf7]">
                    <div className="grid aspect-video place-items-center bg-[#f0ece5]">
                      {item.previewUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img className="h-full w-full object-cover" src={item.previewUrl} alt="" />
                      ) : item.kind === "video" ? (
                        <PlayCircle className="size-8 text-[#8a8175]" aria-hidden="true" />
                      ) : (
                        <FileText className="size-8 text-[#8a8175]" aria-hidden="true" />
                      )}
                    </div>
                    <div className="flex items-start justify-between gap-3 p-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-black text-[#1f252b]">{item.name}</p>
                        <p className="mt-1 text-xs font-semibold capitalize text-[#69716b]">{item.kind} / {item.size}</p>
                      </div>
                      <button className="grid size-8 shrink-0 place-items-center rounded-full border border-[#ded8cf] bg-white text-[#69716b] transition hover:text-[#b83232]" type="button" aria-label={`Remove ${item.name}`} onClick={() => setPortfolioDrafts((current) => current.filter((draft) => draft.id !== item.id))}>
                        <Trash2 className="size-4" aria-hidden="true" />
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <button className="mt-4 w-full rounded-[20px] border border-dashed border-[#ded8cf] bg-[#fbfaf7] p-8 text-center transition hover:border-[#1f252b]" type="button" onClick={() => portfolioInputRef.current?.click()}>
                <PlayCircle className="mx-auto size-7 text-[#8a8175]" aria-hidden="true" />
                <p className="mt-3 text-sm font-black text-[#1f252b]">No content samples connected yet</p>
                <p className="mt-2 text-xs font-semibold leading-5 text-[#69716b]">Add real campaign work or connect socials when the backend upload endpoints land.</p>
              </button>
            )}
          </section>
        </div>
      </div>

      <aside className="space-y-4">
        <div className="rounded-[28px] border border-[#e8e2d9] bg-[#fbfaf7] p-5 shadow-[0_18px_46px_rgba(31,37,43,0.07)]">
          <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#8a8175]">Creator score</p>
          <div className="mt-4 rounded-[24px] bg-[#1f252b] p-6 text-center text-white">
            <div className="text-5xl font-black">{profileScore}</div>
            <p className="mt-2 text-sm font-semibold text-white/72">{profileScore === 100 ? "Profile complete" : "Profile completion"}</p>
          </div>
          <div className="mt-4 space-y-2">
            {["Connect at least one social account", "Add recent content samples", "Complete payout verification"].map((item) => (
              <p key={item} className="flex items-center gap-2 rounded-[16px] bg-white px-3 py-3 text-sm font-semibold text-[#505852]">
                <CheckCircle2 className="size-4 text-[#16864f]" aria-hidden="true" />
                {item}
              </p>
            ))}
          </div>
        </div>

        <div className="rounded-[28px] border border-[#e8e2d9] bg-[#fbfaf7] p-5">
          <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#8a8175]">Profile checklist</p>
          <div className="mt-4 space-y-3">
            <ChecklistItem title="Your identity" body="This profile now comes from your logged-in account, not the demo creator." />
            <ChecklistItem title="Social metrics" body="Follower and analytics values stay empty until social accounts are connected." />
            <ChecklistItem title="Match profile" body="Set your niche and portfolio so campaigns can match your real profile." />
          </div>
        </div>
      </aside>
    </section>
  )
}

function Field({ disabled, label, value, onChange }: { disabled: boolean; label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="text-xs font-black text-[#69716b]">
      {label}
      <input className="mt-2 h-10 w-full rounded-full border border-[#ded8cf] bg-[#fbfaf7] px-4 text-sm font-semibold text-[#505852] outline-none disabled:opacity-70 focus:border-[#1f252b]" disabled={disabled} value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  )
}

function PasswordField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="text-xs font-black text-[#69716b]">
      {label}
      <input className="mt-2 h-10 w-full rounded-full border border-[#ded8cf] bg-[#fbfaf7] px-4 text-sm font-semibold text-[#505852] outline-none focus:border-[#1f252b]" type="password" value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  )
}

function SmallStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[16px] bg-[#f5f3ef] p-3">
      <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#8a8175]">{label}</p>
      <p className="mt-1 text-sm font-black text-[#1f252b]">{value}</p>
    </div>
  )
}

function Signal({ icon: Icon, onClick, text }: { icon: typeof Eye; onClick: () => void; text: string }) {
  return (
    <button className="flex w-full items-center gap-2 rounded-[16px] bg-[#f5f3ef] p-3 text-left transition hover:bg-[#e8e2d9] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1f252b]" type="button" onClick={onClick}>
      <Icon className="size-4 text-[#8a8175]" aria-hidden="true" />
      {text}
    </button>
  )
}

function ChecklistItem({ body, title }: { body: string; title: string }) {
  return (
    <div className="rounded-[18px] bg-white p-4">
      <h3 className="text-sm font-black text-[#1f252b]">{title}</h3>
      <p className="mt-1 text-xs font-semibold leading-5 text-[#69716b]">{body}</p>
    </div>
  )
}
