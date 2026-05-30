import type { ApiError, StandardResponse } from "@/types/api.types"

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"

type RequestOptions = RequestInit & {
  auth?: boolean
}

export async function apiClient<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers = new Headers(options.headers)
  headers.set("Accept", "application/json")

  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json")
  }

  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...options,
    credentials: options.auth === false ? "same-origin" : "include",
    headers,
  })

  const payload = (await response.json().catch(() => null)) as StandardResponse<T> | ApiError | null

  if (!response.ok) {
    const message = payload && "message" in payload ? payload.message : "Request failed"
    throw new Error(message)
  }

  if (payload && "data" in payload) {
    return payload.data
  }

  return payload as T
}
