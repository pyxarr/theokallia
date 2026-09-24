// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Sample 10% of traces for performance monitoring
  tracesSampleRate: 0.1,

  enableLogs: true,

  // Disable PII collection to align with privacy policy
  dataCollection: {
    userInfo: false,
    httpBodies: [],
  },
});
