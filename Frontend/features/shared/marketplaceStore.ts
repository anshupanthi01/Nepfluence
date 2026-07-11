"use client"

import { useEffect, useSyncExternalStore } from "react"
import { apiClient } from "@/lib/api-client"
import { readMockSession } from "@/lib/auth"

export type CampaignStatus = "DRAFT" | "OPEN" | "PUBLISHED" | "PAUSED" | "CLOSED" | "COMPLETED"
export type ApplicationStatus = "PENDING" | "ACCEPTED" | "REJECTED"
export type EscrowStatus = "NOT_REQUIRED" | "PENDING" | "HELD" | "RELEASED"
export type CollaborationState = "ESCROW_PENDING" | "IN_PROGRESS" | "SUBMITTED" | "APPROVED"

export type DeliverableSubmission = {
  videoUrl: string
  postUrl: string
  caption: string
  notes: string
  aspectRatio: string
  duration: string
  submittedAt: string
  checklist: {
    briefMatched: boolean
    usageRights: boolean
    noCopyrightMusic: boolean
  }
}

export type MarketplaceCampaign = {
  id: number
  brandUserId?: string
  brand: string
  title: string
  niche: string
  budget: number
  country: "NP" | "IN"
  platform: string
  status: CampaignStatus
  applications: number
  accepted: number
  reach: number
  deadline: string
  brief: string
}

export type MarketplaceApplication = {
  id: number
  creatorUserId?: string
  creator: string
  handle: string
  country: "NP" | "IN"
  niche: string
  followers: string
  match: number
  status: ApplicationStatus
  campaignId: number
}

export type MarketplaceCollaboration = {
  id: number
  brandUserId?: string
  creatorUserId?: string
  campaign: string
  campaignId: number
  brand: string
  creator: string
  state: CollaborationState
  escrow: EscrowStatus
  deliverable: string
  payout: number
  submission?: DeliverableSubmission
  hiddenForBrandAt?: string
  hiddenForCreatorAt?: string
}

export type MarketplaceMessage = {
  id: number
  roomId: number
  campaignId?: number
  brandUserId?: string
  creatorUserId?: string
  sender: "brand" | "creator"
  senderName: string
  body: string
  createdAt: string
  deletedForBrandAt?: string
  deletedForCreatorAt?: string
}

export type MarketplaceWallet = {
  userId: string
  role: "brand" | "creator"
  balance: number
  escrowHeld: number
  released: number
}

export type MarketplaceLedgerEntry = {
  id: number
  collaborationId: number
  fromUserId?: string
  toUserId?: string
  type: "ESCROW_DEPOSIT" | "PAYOUT_RELEASE"
  amount: number
  createdAt: string
}

export type CreatorDiscoveryDecision = {
  handle: string
  creator: string
  status: "SELECTED" | "REJECTED"
  decidedAt: string
}

export type MarketplaceState = {
  campaigns: MarketplaceCampaign[]
  applications: MarketplaceApplication[]
  collaborations: MarketplaceCollaboration[]
  messages: MarketplaceMessage[]
  wallets: MarketplaceWallet[]
  ledger: MarketplaceLedgerEntry[]
  discoveryDecisions: CreatorDiscoveryDecision[]
}

type CreatorProfile = {
  creator: string
  handle: string
  country: "NP" | "IN"
  niche: string
  followers: string
  match?: number
}

const storeKey = "nepfluence-marketplace-state-v5"
const storeEvent = "nepfluence-marketplace-updated"
let cachedState: MarketplaceState | null = null
let remoteSyncStarted = false

const initialState: MarketplaceState = {
  campaigns: [],
  applications: [],
  collaborations: [],
  messages: [],
  wallets: [],
  ledger: [],
  discoveryDecisions: [],
}

function defaultWallet(userId: string | undefined, role: MarketplaceWallet["role"]): MarketplaceWallet | null {
  if (!userId) return null

  return {
    userId,
    role,
    balance: role === "brand" ? 150000 : 0,
    escrowHeld: 0,
    released: 0,
  }
}

function mergeById<T extends { id: number }>(base: T[] | undefined, override: T[] | undefined) {
  const merged = new Map<number, T>()
  ;(base ?? []).forEach((record) => merged.set(record.id, record))
  ;(override ?? []).forEach((record) => merged.set(record.id, record))
  return Array.from(merged.values())
}

function mergeWallets(base: MarketplaceWallet[] | undefined, override: MarketplaceWallet[] | undefined) {
  const merged = new Map<string, MarketplaceWallet>()
  ;(base ?? []).forEach((wallet) => merged.set(`${wallet.userId}:${wallet.role}`, wallet))
  ;(override ?? []).forEach((wallet) => merged.set(`${wallet.userId}:${wallet.role}`, wallet))
  return Array.from(merged.values())
}

function mergeDiscovery(base: CreatorDiscoveryDecision[] | undefined, override: CreatorDiscoveryDecision[] | undefined) {
  const merged = new Map<string, CreatorDiscoveryDecision>()
  ;(base ?? []).forEach((decision) => merged.set(decision.handle, decision))
  ;(override ?? []).forEach((decision) => merged.set(decision.handle, decision))
  return Array.from(merged.values())
}

function mergeMarketplaceStates(base: MarketplaceState, override: MarketplaceState): MarketplaceState {
  return {
    campaigns: mergeById(base.campaigns, override.campaigns),
    applications: mergeById(base.applications, override.applications),
    collaborations: mergeById(base.collaborations, override.collaborations),
    messages: mergeById(base.messages, override.messages),
    wallets: mergeWallets(base.wallets, override.wallets),
    ledger: mergeById(base.ledger, override.ledger),
    discoveryDecisions: mergeDiscovery(base.discoveryDecisions, override.discoveryDecisions),
  }
}

function ensureWallet(wallets: MarketplaceWallet[], userId: string | undefined, role: MarketplaceWallet["role"]) {
  if (!userId) return wallets
  if (wallets.some((wallet) => wallet.userId === userId && wallet.role === role)) return wallets
  const wallet = defaultWallet(userId, role)
  return wallet ? [...wallets, wallet] : wallets
}

function deriveWallet(state: MarketplaceState, userId: string | undefined, role: MarketplaceWallet["role"]) {
  const wallet = state.wallets.find((item) => item.userId === userId && item.role === role)
  if (wallet || !userId) return wallet ?? null

  const collaborations = state.collaborations.filter((collab) =>
    role === "brand" ? collab.brandUserId === userId : collab.creatorUserId === userId,
  )
  const escrowHeld = collaborations.filter((collab) => collab.escrow === "HELD").reduce((sum, collab) => sum + collab.payout, 0)
  const released = collaborations.filter((collab) => collab.escrow === "RELEASED").reduce((sum, collab) => sum + collab.payout, 0)

  if (role === "brand") {
    return {
      userId,
      role,
      balance: Math.max(0, 150000 - escrowHeld - released),
      escrowHeld,
      released,
    }
  }

  return {
    userId,
    role,
    balance: released,
    escrowHeld,
    released,
  }
}

function readState(): MarketplaceState {
  if (typeof window === "undefined") return initialState

  try {
    const stored = window.localStorage.getItem(storeKey)
    return stored ? normalizeState({ ...initialState, ...JSON.parse(stored) }) : normalizeState(initialState)
  } catch {
    return normalizeState(initialState)
  }
}

function normalizeState(state: MarketplaceState): MarketplaceState {
  const campaigns = state.campaigns ?? []
  const applications = state.applications ?? []
  const collaborations = state.collaborations ?? []

  return {
    campaigns: campaigns.map((campaign) => ({
      ...campaign,
      brandUserId: campaign.brandUserId,
      brand: campaign.brand ?? campaign.title.split(" ").slice(0, 2).join(" "),
      status: campaign.status === "OPEN" ? "PUBLISHED" : campaign.status,
      applications: campaign.applications ?? 0,
      accepted: campaign.accepted ?? 0,
      reach: campaign.reach ?? 0,
      brief: campaign.brief ?? "Campaign brief pending.",
    })),
    applications: applications.map((application) => ({
      ...application,
      creatorUserId: application.creatorUserId,
      match: application.match ?? 90,
      status: application.status ?? "PENDING",
    })),
    collaborations: collaborations.map((collab) => {
      const campaign = campaigns.find((item) => item.title === collab.campaign || item.id === collab.campaignId)

      return {
        ...collab,
        brandUserId: collab.brandUserId ?? campaign?.brandUserId,
        creatorUserId: collab.creatorUserId,
        campaignId: collab.campaignId ?? campaign?.id ?? collab.id,
        brand: collab.brand ?? campaign?.brand ?? "Brand",
        creator: collab.creator,
        payout: collab.payout ?? Math.min(campaign?.budget ?? 45000, 45000),
        submission: collab.submission,
        hiddenForBrandAt: collab.hiddenForBrandAt,
        hiddenForCreatorAt: collab.hiddenForCreatorAt,
      }
    }),
    messages: (state.messages ?? []).map((message) => {
      const collaboration = collaborations.find((collab) => collab.id === message.roomId)
      return {
        ...message,
        campaignId: message.campaignId ?? collaboration?.campaignId,
        brandUserId: message.brandUserId ?? collaboration?.brandUserId,
        creatorUserId: message.creatorUserId ?? collaboration?.creatorUserId,
        deletedForBrandAt: message.deletedForBrandAt,
        deletedForCreatorAt: message.deletedForCreatorAt,
      }
    }),
    wallets: (state.wallets ?? []).map((wallet) => ({
      ...wallet,
      balance: wallet.balance ?? 0,
      escrowHeld: wallet.escrowHeld ?? 0,
      released: wallet.released ?? 0,
    })),
    ledger: state.ledger ?? [],
    discoveryDecisions: state.discoveryDecisions ?? [],
  }
}

function writeState(nextState: MarketplaceState) {
  if (typeof window === "undefined") return

  cachedState = nextState
  window.localStorage.setItem(storeKey, JSON.stringify(nextState))
  window.dispatchEvent(new Event(storeEvent))
}

async function loadRemoteState() {
  try {
    const remoteState = await apiClient<MarketplaceState>("/api/marketplace/state")
    const localState = readState()
    writeState(normalizeState(mergeMarketplaceStates(remoteState, localState)))
  } catch {
    remoteSyncStarted = false
    return
  }
}

async function persistRemoteState(nextState: MarketplaceState) {
  try {
    const remoteState = await apiClient<MarketplaceState>("/api/marketplace/state", {
      method: "PUT",
      body: JSON.stringify(nextState),
    })
    writeState(normalizeState(remoteState))
  } catch {
    return
  }
}

function getSnapshot() {
  cachedState ??= readState()
  return cachedState
}

function getServerSnapshot() {
  return normalizeState(initialState)
}

function subscribe(onStoreChange: () => void) {
  function syncState() {
    cachedState = readState()
    onStoreChange()
  }

  window.addEventListener(storeEvent, syncState)
  window.addEventListener("storage", syncState)

  return () => {
    window.removeEventListener(storeEvent, syncState)
    window.removeEventListener("storage", syncState)
  }
}

export function useMarketplaceStore() {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  function commit(updater: (current: MarketplaceState) => MarketplaceState) {
    const nextState = updater(readState())
    writeState(nextState)
    void persistRemoteState(nextState)
  }

  useEffect(() => {
    if (remoteSyncStarted) return
    remoteSyncStarted = true
    void loadRemoteState()
  }, [])

  return {
    ...state,
    getWallet(userId: string | undefined, role: MarketplaceWallet["role"]) {
      return deriveWallet(state, userId, role) ?? defaultWallet(userId, role)
    },
    createCampaign(campaign: Omit<MarketplaceCampaign, "id" | "brand"> & { brand?: string }) {
      const session = readMockSession()
      commit((current) => ({
        ...current,
        wallets: ensureWallet(current.wallets, session?.userId, "brand"),
        campaigns: [
          {
            ...campaign,
            id: Date.now(),
            brandUserId: session?.userId,
            brand: campaign.brand ?? session?.username ?? "Your brand",
          },
          ...current.campaigns,
        ],
      }))
    },
    publishCampaign(id: number) {
      commit((current) => ({
        ...current,
        campaigns: current.campaigns.map((campaign) =>
          campaign.id === id
            ? { ...campaign, status: "PUBLISHED" }
            : campaign,
        ),
      }))
    },
    updateCampaign(id: number, updates: Partial<Pick<MarketplaceCampaign, "status" | "budget" | "deadline">>) {
      commit((current) => ({
        ...current,
        campaigns: current.campaigns.map((campaign) =>
          campaign.id === id
            ? {
                ...campaign,
                ...updates,
                status: updates.status === "OPEN" ? "PUBLISHED" : updates.status ?? campaign.status,
              }
            : campaign,
        ),
      }))
    },
    applyToCampaign(campaignId: number, creator: CreatorProfile) {
      const session = readMockSession()
      commit((current) => {
        const alreadyApplied = current.applications.some((application) =>
          application.campaignId === campaignId &&
          (application.creatorUserId ? application.creatorUserId === session?.userId : application.handle === creator.handle),
        )
        if (alreadyApplied) return current

        return {
          ...current,
          campaigns: current.campaigns.map((campaign) =>
            campaign.id === campaignId ? { ...campaign, applications: campaign.applications + 1 } : campaign,
          ),
          applications: [
            {
              id: Date.now(),
              creatorUserId: session?.userId,
              creator: creator.creator,
              handle: creator.handle,
              country: creator.country,
              niche: creator.niche,
              followers: creator.followers,
              match: creator.match ?? 92,
              status: "PENDING",
              campaignId,
            },
            ...current.applications,
          ],
        }
      })
    },
    withdrawApplication(campaignId: number, handle: string) {
      const session = readMockSession()
      commit((current) => {
        const application = current.applications.find((item) =>
          item.campaignId === campaignId &&
          (item.creatorUserId ? item.creatorUserId === session?.userId : item.handle === handle),
        )

        return {
          ...current,
          campaigns: application
            ? current.campaigns.map((campaign) =>
                campaign.id === campaignId ? { ...campaign, applications: Math.max(0, campaign.applications - 1) } : campaign,
              )
            : current.campaigns,
          applications: current.applications.filter((item) =>
            !(item.campaignId === campaignId && (item.creatorUserId ? item.creatorUserId === session?.userId : item.handle === handle)),
          ),
        }
      })
    },
    reviewApplication(id: number, status: ApplicationStatus) {
      commit((current) => {
        const application = current.applications.find((item) => item.id === id)
        const campaign = current.campaigns.find((item) => item.id === application?.campaignId)
        const wasAccepted = application?.status === "ACCEPTED"
        const isAccepted = status === "ACCEPTED"
        const acceptedDelta = isAccepted && !wasAccepted ? 1 : !isAccepted && wasAccepted ? -1 : 0

        return {
          ...current,
          applications: current.applications.map((item) => {
            if (item.id === id) return { ...item, status }
            if (isAccepted && item.campaignId === application?.campaignId) return { ...item, status: "REJECTED" }
            return item
          }),
          campaigns: current.campaigns.map((item) =>
            item.id === application?.campaignId ? { ...item, accepted: isAccepted ? 1 : Math.max(0, item.accepted + acceptedDelta) } : item,
          ),
          collaborations:
            application && campaign && isAccepted
              ? [
                  {
                    id: Date.now(),
                    brandUserId: campaign.brandUserId,
                    creatorUserId: application.creatorUserId,
                    campaign: campaign.title,
                    campaignId: campaign.id,
                    brand: campaign.brand,
                    creator: application.creator,
                    state: "ESCROW_PENDING",
                    escrow: "PENDING",
                    deliverable: "Escrow required before chat unlocks",
                    payout: Math.min(campaign.budget, Math.max(15000, Math.round(campaign.budget * 0.38))),
                  },
                  ...current.collaborations.filter((item) => item.campaignId !== campaign.id),
                ]
              : current.collaborations.filter((item) => item.campaignId !== application?.campaignId || item.creator !== application?.creator),
          messages: current.messages,
        }
      })
    },
    depositEscrow(id: number) {
      const session = readMockSession()
      commit((current) => {
        const collaboration = current.collaborations.find((collab) => collab.id === id)
        if (!collaboration || collaboration.escrow !== "PENDING") return current

        const campaign = current.campaigns.find((item) => item.id === collaboration.campaignId)
        const brandUserId = collaboration.brandUserId ?? campaign?.brandUserId ?? session?.userId
        const wallets = ensureWallet(current.wallets, brandUserId, "brand")
        const brandWallet = wallets.find((wallet) => wallet.userId === brandUserId && wallet.role === "brand")

        if (!brandWallet || brandWallet.balance < collaboration.payout) {
          return {
            ...current,
            wallets,
            collaborations: current.collaborations.map((collab) =>
              collab.id === id ? { ...collab, deliverable: "Brand wallet balance is too low to deposit escrow." } : collab,
            ),
          }
        }

        return {
          ...current,
          wallets: wallets.map((wallet) =>
            wallet.userId === brandUserId && wallet.role === "brand"
              ? { ...wallet, balance: wallet.balance - collaboration.payout, escrowHeld: wallet.escrowHeld + collaboration.payout }
              : wallet,
          ),
          ledger: [
            ...current.ledger,
            {
              id: Date.now(),
              collaborationId: id,
              fromUserId: brandUserId,
              type: "ESCROW_DEPOSIT",
              amount: collaboration.payout,
              createdAt: new Date().toISOString(),
            },
          ],
          collaborations: current.collaborations.map((collab) =>
            collab.id === id ? { ...collab, brandUserId, state: "IN_PROGRESS", escrow: "HELD", deliverable: "Chat unlocked. Waiting for first deliverable." } : collab,
          ),
        }
      })
    },
    markSubmitted(id: number, submission?: Omit<DeliverableSubmission, "submittedAt">) {
      commit((current) => ({
        ...current,
        collaborations: current.collaborations.map((collab) =>
          collab.id === id
            ? {
                ...collab,
                state: "SUBMITTED",
                deliverable: "Video deliverable submitted. Waiting for brand review.",
                submission: submission ? { ...submission, submittedAt: new Date().toISOString() } : collab.submission,
              }
            : collab,
        ),
      }))
    },
    approveDeliverable(id: number) {
      const session = readMockSession()
      commit((current) => {
        const collaboration = current.collaborations.find((collab) => collab.id === id)
        if (!collaboration || collaboration.escrow === "RELEASED") return current

        const campaign = current.campaigns.find((item) => item.id === collaboration.campaignId)
        const acceptedApplication = current.applications.find((application) => application.campaignId === collaboration.campaignId && application.status === "ACCEPTED")
        const brandUserId = collaboration.brandUserId ?? campaign?.brandUserId ?? session?.userId
        const creatorUserId = collaboration.creatorUserId ?? acceptedApplication?.creatorUserId
        let wallets = current.wallets
        if (brandUserId && !wallets.some((wallet) => wallet.userId === brandUserId && wallet.role === "brand")) {
          const brandWallet = deriveWallet(current, brandUserId, "brand")
          if (brandWallet) wallets = [...wallets, brandWallet]
        }
        if (creatorUserId && !wallets.some((wallet) => wallet.userId === creatorUserId && wallet.role === "creator")) {
          const creatorWallet = deriveWallet(current, creatorUserId, "creator")
          if (creatorWallet) wallets = [...wallets, creatorWallet]
        }

        return {
          ...current,
          wallets: wallets.map((wallet) => {
            if (wallet.userId === brandUserId && wallet.role === "brand") {
              return { ...wallet, escrowHeld: Math.max(0, wallet.escrowHeld - collaboration.payout), released: wallet.released + collaboration.payout }
            }
            if (wallet.userId === creatorUserId && wallet.role === "creator") {
              return { ...wallet, balance: wallet.balance + collaboration.payout, released: wallet.released + collaboration.payout }
            }
            return wallet
          }),
          ledger: [
            ...current.ledger,
            {
              id: Date.now(),
              collaborationId: id,
              fromUserId: brandUserId,
              toUserId: creatorUserId,
              type: "PAYOUT_RELEASE",
              amount: collaboration.payout,
              createdAt: new Date().toISOString(),
            },
          ],
          collaborations: current.collaborations.map((collab) =>
            collab.id === id ? { ...collab, brandUserId, creatorUserId, state: "APPROVED", escrow: "RELEASED", deliverable: "Approved. Payout released to creator wallet." } : collab,
          ),
        }
      })
    },
    sendMessage(roomId: number, message: Omit<MarketplaceMessage, "id" | "roomId" | "createdAt">) {
      commit((current) => ({
        ...current,
        messages: [
          ...current.messages,
          {
            ...message,
            id: Date.now(),
            roomId,
            campaignId: message.campaignId ?? current.collaborations.find((collab) => collab.id === roomId)?.campaignId,
            brandUserId: message.brandUserId ?? current.collaborations.find((collab) => collab.id === roomId)?.brandUserId,
            creatorUserId: message.creatorUserId ?? current.collaborations.find((collab) => collab.id === roomId)?.creatorUserId,
            createdAt: new Date().toISOString(),
          },
        ],
      }))
    },
    hideConversation(roomId: number, role: "brand" | "creator") {
      commit((current) => ({
        ...current,
        collaborations: current.collaborations.map((collab) =>
          collab.id === roomId
            ? {
                ...collab,
                hiddenForBrandAt: role === "brand" ? new Date().toISOString() : collab.hiddenForBrandAt,
                hiddenForCreatorAt: role === "creator" ? new Date().toISOString() : collab.hiddenForCreatorAt,
              }
            : collab,
        ),
      }))
    },
    hideMessage(messageId: number, role: "brand" | "creator") {
      commit((current) => ({
        ...current,
        messages: current.messages.map((message) =>
          message.id === messageId
            ? {
                ...message,
                deletedForBrandAt: role === "brand" ? new Date().toISOString() : message.deletedForBrandAt,
                deletedForCreatorAt: role === "creator" ? new Date().toISOString() : message.deletedForCreatorAt,
              }
            : message,
        ),
      }))
    },
    decideCreatorDiscovery(creator: Pick<CreatorDiscoveryDecision, "creator" | "handle">, status: CreatorDiscoveryDecision["status"]) {
      commit((current) => ({
        ...current,
        discoveryDecisions: [
          {
            creator: creator.creator,
            handle: creator.handle,
            status,
            decidedAt: new Date().toISOString(),
          },
          ...current.discoveryDecisions.filter((decision) => decision.handle !== creator.handle),
        ],
      }))
    },
  }
}
