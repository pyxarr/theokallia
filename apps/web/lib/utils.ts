import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import axios from 'axios'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Extracts a display-ready message from an error. Axios collapses API errors
 * into "Request failed with status code 403", so the NestJS response body
 * message (string or validation array) takes precedence.
 */
export function errorMessage(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    const message = (
      err.response?.data as { message?: string | string[] } | undefined
    )?.message
    if (Array.isArray(message)) return message.join(', ')
    if (message) return message
    if (err.response?.status) return `${fallback} (HTTP ${err.response.status})`
  }
  return err instanceof Error ? err.message : fallback
}
