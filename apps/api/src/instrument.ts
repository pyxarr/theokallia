import * as Sentry from '@sentry/nestjs'
import { nodeProfilingIntegration } from '@sentry/profiling-node'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV || 'development',
  integrations: [nodeProfilingIntegration()],

  // controls trace sampling — return 0 to drop, 1 to always keep, or a rate between
  // tracesSampleRate is not set separately since tracesSampler always wins when both exist
  tracesSampler: ({ name }) => {
    if (name.includes('/health')) return 0 // health checks are noise, drop entirely
    if (name.includes('/payments')) return 1.0 // payment flows are critical, keep all of them
    return process.env.NODE_ENV === 'production' ? 0.05 : 1.0 // 5% in prod, 100% in dev
  },

  // fraction of sessions to profile (CPU/memory sampling), independent of trace sampling
  profileSessionSampleRate: process.env.NODE_ENV === 'production' ? 0.01 : 1.0,
  // 'trace' mode starts/stops profiling automatically alongside sampled traces above —
  // without this, profileSessionSampleRate does nothing (default lifecycle is manual start/stop)
  profileLifecycle: 'trace',

  // controls which data categories Sentry auto-collects — all default to true/permissive
  dataCollection: {
    userInfo: false, // don't attach IP address or user identity to events
    httpBodies: [], // never capture request/response bodies (may contain passwords, tokens)
  },

  // last-resort scrub before an event leaves the server
  beforeSend: (event) => {
    const redact = (s: string) =>
      s.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL_REDACTED]')
    
    // 1. Redact emails from messages and exceptions
    if (event.message) event.message = redact(event.message)
    event.exception?.values?.forEach((v) => {
      if (v.value) v.value = redact(v.value)
    })

    // 2. Strip cookies from request/response to ensure total privacy
    const e = event as any
    if (e.request) delete e.request.cookies
    if (e.response) delete e.response.cookies

    return event
  },
})
