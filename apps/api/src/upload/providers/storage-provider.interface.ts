export interface SignUploadParams {
  fileName: string
  fileSize: number
  mimeType: string
}

export interface SignUploadResult {
  signature: string
  timestamp: number
  apiKey: string
  cloudName: string
  uploadPreset: string
}

export interface DeleteResult {
  result: string
}

/**
 * Port for cloud storage operations.
 * Theokallia uses Cloudinary today — implementing this interface
 * is the only change needed to swap providers (S3, Cloudflare R2, etc.).
 * Matches the MailModule pattern (see mail/providers/email-provider.interface.ts).
 */
export interface StorageProvider {
  signUpload(params: SignUploadParams): Promise<SignUploadResult>
  deleteAsset(publicId: string): Promise<DeleteResult>
}
