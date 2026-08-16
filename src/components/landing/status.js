/**
 * The only place on the landing page that knows which phase we are in.
 *
 * Everything else is written to be true in both phases, so shipping the
 * developer platform means editing this file and nothing else. Keep it that
 * way: if a section needs new copy when Phase 2 lands, the copy is wrong now.
 */

/** Flip to true the day API keys and the SDKs are publicly available. */
export const DEV_PLATFORM_LIVE = false

/** Badge text next to anything that needs API access. */
export const DEV_PLATFORM_STATUS = DEV_PLATFORM_LIVE
  ? 'Available now'
  : 'Private beta'

/** The same fact as a sentence fragment, for running copy. */
export const DEV_PLATFORM_BLURB = DEV_PLATFORM_LIVE
  ? 'API keys are self-serve — generate them in Settings.'
  : 'API access is in private beta — we onboard these accounts by hand.'

/**
 * Where "talk to us about API access" should point. A mailto today; swap for
 * /signup or the docs once self-serve keys exist.
 */
export const DEV_PLATFORM_HREF = DEV_PLATFORM_LIVE
  ? '/signup'
  : 'mailto:hello@oryn.com?subject=API%20access'
