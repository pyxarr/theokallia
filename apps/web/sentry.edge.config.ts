// This file configures the initialization of Sentry for edge features (middleware, edge routes, and so on).
// The config you add here will be used whenever one of the edge features is loaded.
// Note that this config is unrelated to the Vercel Edge Runtime and is also required when running locally.
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
