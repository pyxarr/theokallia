/* globals process */
export const env = {
  NEXT_PUBLIC_APP_URL:
    process.env.NEXT_PUBLIC_APP_URL ??
    (process.env.NODE_ENV === 'development' ? 'http://localhost:3002' : ''),
}

if (!env.NEXT_PUBLIC_APP_URL) {
  throw new Error('NEXT_PUBLIC_APP_URL is required in production')
}