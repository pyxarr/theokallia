const BASE_URL = process.env.NEXT_PUBLIC_CLOUDINARY_BASE_URL

interface CloudinaryLoaderProps {
  src: string
  width: number
  quality?: number
}

/**
 * Custom next/image loader for Cloudinary.
 * Transforms a Cloudinary publicId into a fully qualified URL with
 * automatic format selection (f_auto) and quality optimisation (q_auto)
 * for responsive, optimised image delivery.
 *
 * Local paths (starting with /) are returned as-is with width param
 * so Next.js can optimize them natively.
 *
 * Usage — set globally in next.config.js via loaderFile:
 *   images: { loader: 'custom', loaderFile: './lib/cloudinary-loader.ts' }
 */
const cloudinaryLoader = ({ src, width, quality }: CloudinaryLoaderProps): string => {
  if (src.startsWith('/')) {
    // Local static files — return as-is with width for Next.js native optimization
    return `${src}?w=${width}`
  }
  if (!BASE_URL) return src
  const params = [`w_${width}`, 'f_auto', 'q_auto']
  if (quality) params.push(`q_${quality}`)
  return `${BASE_URL}/${params.join(',')}/${src}`
}

export default cloudinaryLoader
