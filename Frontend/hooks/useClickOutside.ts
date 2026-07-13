"use client"

import { useEffect } from "react"
import type { RefObject } from "react"

export function useClickOutside(active: boolean, ref: RefObject<HTMLElement | null>, onOutside: () => void) {
  useEffect(() => {
    if (!active) return

    function handleClick(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) onOutside()
    }

    // Listen for "click" (not "pointerdown"/"mousedown") so a toggle-button trigger's own
    // React onClick runs first (React's delegated listener fires before this document-level
    // one in the bubble phase). That means a re-click on the trigger already toggles state
    // before we get here, so our closing call is a harmless no-op instead of racing the
    // toggle and forcing the panel back open.
    document.addEventListener("click", handleClick)
    return () => document.removeEventListener("click", handleClick)
  }, [active, ref, onOutside])
}
