import Image from 'next/image'
import { useRef, useState, type ChangeEvent, type DragEvent } from 'react'
import { X } from 'lucide-react'
import { useIsMutating } from '@tanstack/react-query'
import {
  useConfirmUpload,
  useDeleteUpload,
  useSignUpload,
  type AdminAsset,
} from '@/lib/hooks/use-admin-products'

export interface PendingMedia {
  publicId: string
  previewUrl: string
  fileName: string
}

interface PendingMediaManagerProps {
  /** Existing assets on the product (edit mode). */
  assets: AdminAsset[]
  /** Temporary uploads collected on the create form (not yet linked to any product). */
  pending: PendingMedia[]
  /** Set once a product id exists, so new files link immediately (edit mode). */
  productId: string | null
  /** Alt-text prefix used when confirming uploads. */
  altTextPrefix: string
  onPendingChange: (pending: PendingMedia[]) => void
  onAssetRemoved: (assetId: string) => void
  onError: (message: string) => void
}

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_FILE_SIZE = 10 * 1024 * 1024

/**
 * Media dropzone shared by the create and edit forms.
 * Edit mode (productId set): dropped files confirm to the product and existing
 * assets can be removed. Create mode: files stay pending as publicIds until
 * the product is created.
 */
export default function MediaManager({
  assets,
  pending,
  productId,
  altTextPrefix,
  onPendingChange,
  onAssetRemoved,
  onError,
}: PendingMediaManagerProps) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [uploading, setUploading] = useState(false)
  const [dragging, setDragging] = useState(false)
  const { mutateAsync: signUpload } = useSignUpload()
  const { mutateAsync: confirmUpload } = useConfirmUpload()
  const { mutateAsync: deleteUpload } = useDeleteUpload()
  const isMutating = useIsMutating()

  const busy = uploading || isMutating > 0

  const handleFiles = async (files: File[]) => {
    const valid = files.filter(
      (file) => ACCEPTED_TYPES.includes(file.type) && file.size <= MAX_FILE_SIZE,
    )
    if (valid.length !== files.length) {
      onError('Some files were skipped. Only JPEG, PNG or WebP under 10MB are allowed.')
    }
    if (valid.length === 0) return

    setUploading(true)
    try {
      for (const file of valid) {
        const signed = await signUpload({
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type,
        })

        const formData = new FormData()
        formData.append('file', file)
        formData.append('api_key', signed.apiKey)
        formData.append('timestamp', String(signed.timestamp))
        formData.append('signature', signed.signature)
        formData.append('upload_preset', signed.uploadPreset)

        const res = await fetch(
          `https://api.cloudinary.com/v1_1/${signed.cloudName}/image/upload`,
          { method: 'POST', body: formData },
        )
        const uploaded: { public_id?: string } = await res.json()
        if (!uploaded.public_id) {
          throw new Error(`Cloudinary upload failed for ${file.name}`)
        }

        if (productId) {
          await confirmUpload({
            publicId: uploaded.public_id,
            entityId: productId,
            entityType: 'Product',
            altText: `${altTextPrefix} image`,
          })
        } else {
          onPendingChange([
            ...pending,
            {
              publicId: uploaded.public_id,
              previewUrl: URL.createObjectURL(file),
              fileName: file.name,
            },
          ])
        }
      }
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleRemoveAsset = async (assetId: string) => {
    try {
      await deleteUpload(assetId)
      onAssetRemoved(assetId)
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Delete failed')
    }
  }

  const handleRemovePending = (publicId: string) => {
    onPendingChange(pending.filter((item) => item.publicId !== publicId))
  }

  return (
    <div className="flex flex-col gap-4">
      <div
        role="button"
        tabIndex={0}
        aria-label="Upload product images"
        onClick={() => inputRef.current?.click()}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') inputRef.current?.click()
        }}
        onDragOver={(event: DragEvent<HTMLDivElement>) => {
          event.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event: DragEvent<HTMLDivElement>) => {
          event.preventDefault()
          setDragging(false)
          const files = Array.from(event.dataTransfer.files ?? [])
          if (files.length) void handleFiles(files)
        }}
        className={
          'flex flex-col items-center justify-center border border-dashed px-6 py-10 text-center transition-colors' +
          (dragging
            ? ' cursor-pointer border-black bg-accent'
            : ' cursor-pointer border-gray-300 bg-muted hover:border-black') +
          (busy ? ' pointer-events-none opacity-50' : '')
        }
      >
        <p className="text-sm font-medium">
          {uploading ? 'Uploading…' : 'Drag images here, or click to browse'}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">JPEG, PNG or WebP — max 10MB each</p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(',')}
        multiple
        className="hidden"
        onChange={(event: ChangeEvent<HTMLInputElement>) => {
          if (event.target.files?.length) {
            void handleFiles(Array.from(event.target.files))
            event.target.value = ''
          }
        }}
      />

      {(assets.length > 0 || pending.length > 0) && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {assets.map((asset) => (
            <div key={asset.id} className="relative aspect-square overflow-hidden bg-muted">
              <Image
                src={asset.publicId}
                alt={asset.altText ?? altTextPrefix}
                fill
                sizes='(max-width: 768px) 50vw, 25vw'
                className="object-cover"
              />
              <button
                type="button"
                onClick={() => void handleRemoveAsset(asset.id)}
                aria-label={`Remove ${asset.publicId}`}
                className="absolute top-2 right-2 flex size-7 items-center justify-center bg-black/70 text-white transition-colors hover:bg-black"
              >
                <X size={14} />
              </button>
            </div>
          ))}
          {pending.map((item) => (
            <div key={item.publicId} className="relative aspect-square overflow-hidden bg-muted">
              <Image
                src={item.previewUrl}
                alt={item.fileName}
                fill
                unoptimized
                sizes='(max-width: 768px) 50vw, 25vw'
                className="object-cover"
              />
              <button
                type="button"
                onClick={() => handleRemovePending(item.publicId)}
                aria-label={`Remove ${item.fileName}`}
                className="absolute top-2 right-2 flex size-7 items-center justify-center bg-black/70 text-white transition-colors hover:bg-black"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}