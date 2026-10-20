import { nextJsConfig } from '@theokallia/eslint-config/next-js'

/** @type {import("eslint").Linter.Config[]} */
export default [
  ...nextJsConfig,
  {
    // Payload generates both of these; payload-types.ts carries `any` from
    // Payload's type synthesis and importMap.js is camelCase.
    ignores: ['payload-types.ts', 'app/studio/importMap.js'],
  },
  {
    // PAYLOAD_SECRET / PAYLOAD_DATABASE_URL are not declared in the root
    // turbo.json, which is outside apps/admin.
    files: ['payload.config.ts'],
    rules: { 'turbo/no-undeclared-env-vars': 'off' },
  },
]
