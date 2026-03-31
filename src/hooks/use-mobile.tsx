



import * as React from "react"

const MOBILE_BREAKPOINT = 768

type Breakpoint = "xs" | "sm" | "md" | "lg" | "xl" | "2xl"

const BREAKPOINTS: Record<Breakpoint, number> = {
  xs: 480,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
}

// ─── Core: useMediaQuery ──────────────────────────────────────────────────────

/**
 * Subscribes to a CSS media query string and returns whether it currently matches.
 * Uses the modern `useSyncExternalStore` pattern for React 18 concurrent-safe reads.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = React.useCallback(
    (callback: () => void) => {
      const mql = window.matchMedia(query)
      mql.addEventListener("change", callback)
      return () => mql.removeEventListener("change", callback)
    },
    [query]
  )

  const getSnapshot = React.useCallback(
    () => window.matchMedia(query).matches,
    [query]
  )

  // SSR-safe: returns false on server
  const getServerSnapshot = React.useCallback(() => false, [])

  return React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}

// ─── useIsMobile ──────────────────────────────────────────────────────────────

/**
 * Returns true when the viewport is narrower than the mobile breakpoint (768px).
 */
export function useIsMobile(): boolean {
  return useMediaQuery(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
}

// ─── useBreakpoint ────────────────────────────────────────────────────────────

/**
 * Returns true when the viewport is at or above the given named breakpoint.
 *
 * @example
 * const isDesktop = useBreakpoint("lg") // true if width >= 1024px
 */
export function useBreakpoint(breakpoint: Breakpoint): boolean {
  return useMediaQuery(`(min-width: ${BREAKPOINTS[breakpoint]}px)`)
}

// ─── useBreakpointValue ───────────────────────────────────────────────────────

/**
 * Returns the value mapped to the currently active breakpoint.
 * Breakpoints are evaluated from largest to smallest; the first match wins.
 *
 * @example
 * const columns = useBreakpointValue({ base: 1, md: 2, lg: 3 })
 */
export function useBreakpointValue<T>(
  values: Partial<Record<Breakpoint, T>> & { base: T }
): T {
  const sorted = (Object.keys(BREAKPOINTS) as Breakpoint[]).sort(
    (a, b) => BREAKPOINTS[b] - BREAKPOINTS[a]
  )

  // Capture all matches up-front (hooks can't be called conditionally)
  const matches = sorted.map((bp) =>
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useMediaQuery(`(min-width: ${BREAKPOINTS[bp]}px)`)
  )

  for (let i = 0; i < sorted.length; i++) {
    const bp = sorted[i]
    if (matches[i] && bp in values) {
      return values[bp] as T
    }
  }

  return values.base
}

// ─── useViewportSize ─────────────────────────────────────────────────────────

interface ViewportSize {
  width: number
  height: number
}

/**
 * Returns live viewport dimensions, debounced by one animation frame.
 */
export function useViewportSize(): ViewportSize {
  const [size, setSize] = React.useState<ViewportSize>(() => ({
    width: typeof window !== "undefined" ? window.innerWidth : 0,
    height: typeof window !== "undefined" ? window.innerHeight : 0,
  }))

  React.useEffect(() => {
    let rafId: number

    const handleResize = () => {
      cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(() => {
        setSize({ width: window.innerWidth, height: window.innerHeight })
      })
    }

    window.addEventListener("resize", handleResize, { passive: true })
    return () => {
      window.removeEventListener("resize", handleResize)
      cancelAnimationFrame(rafId)
    }
  }, [])

  return size
}
