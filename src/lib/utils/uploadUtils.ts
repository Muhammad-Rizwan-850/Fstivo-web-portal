/**
 * FSTIVO File Upload Utilities
 * Comprehensive upload system for Supabase Storage
 */

import { createClient } from '@/lib/auth/client'
import { getStorageUrl } from '@/lib/supabase/client'
import { getErrorMessage } from '@/lib/utils/errors'
import { logger } from '@/lib/logger';

// -----------------------------------------------------------------------------
// TYPES
// -----------------------------------------------------------------------------

export interface UploadOptions {
  cacheControl?: number
  upsert?: boolean
  metadata?: Record<string, any>
}

export interface UploadResult {
  publicUrl?: string
  path?: string
  error?: string
}

export interface ValidationResult {
  valid: boolean
  error?: string
}

export interface ValidationOptions {
  maxSize?: number
  allowedTypes?: string
  maxWidth?: number
  maxHeight?: number
}

// -----------------------------------------------------------------------------
// VALIDATION
// -----------------------------------------------------------------------------

/**
 * Validate file before upload
 */
export function validateFile(
  file: File,
  options: ValidationOptions = {}
): ValidationResult {
  if (!file || !(file instanceof File)) {
    throw new Error('Invalid file provided');
  }

  const { maxSize, allowedTypes, maxWidth, maxHeight } = options

  // Check file size
  if (maxSize && file.size > maxSize) {
    return {
      valid: false,
      error: `File size exceeds ${formatFileSize(maxSize)}`
    }
  }

  // Check file type
  if (allowedTypes && allowedTypes !== '*') {
    const types = allowedTypes.split(',').map(t => t.trim())

    const isAllowed = types.some(type => {
      if (type.startsWith('.')) {
        // Extension check
        return file.name.toLowerCase().endsWith(type.toLowerCase())
      } else if (type.endsWith('/*')) {
        // MIME type category check (e.g., 'image/*')
        const category = type.split('/')[0]
        return file.type.startsWith(category + '/')
      } else {
        // Exact MIME type check
        return file.type === type
      }
    })

    if (!isAllowed) {
      return {
        valid: false,
        error: `File type not allowed. Allowed: ${allowedTypes}`
      }
    }
  }

  // For images, check dimensions
  if (maxWidth || maxHeight) {
    return new Promise((resolve) => {
      if (!file.type.startsWith('image/')) {
        resolve({ valid: true })
        return
      }

      const img = new Image()
      const url = URL.createObjectURL(file)

      img.onload = () => {
        URL.revokeObjectURL(url)

        if (maxWidth && img.width > maxWidth) {
          resolve({
            valid: false,
            error: `Image width exceeds ${maxWidth}px`
          })
          return
        }

        if (maxHeight && img.height > maxHeight) {
          resolve({
            valid: false,
            error: `Image height exceeds ${maxHeight}px`
          })
          return
        }

        resolve({ valid: true })
      }

      img.onerror = () => {
        URL.revokeObjectURL(url)
        resolve({ valid: false, error: 'Failed to load image' })
      }

      img.src = url
    }) as any
  }

  return { valid: true }
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'

  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  if (i >= sizes.length) {
    return `${parseFloat((bytes / Math.pow(k, sizes.length - 1)).toFixed(1))} ${sizes[sizes.length - 1]}`
  }

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

/**
 * Get file extension
 */
export function getFileExtension(filename: string): string {
  const lastDotIndex = filename.lastIndexOf('.');
  if (lastDotIndex === -1 || lastDotIndex === 0) {
    return '';
  }
  return filename.slice(lastDotIndex + 1);
}

/**
 * Generate unique filename
 */
export function generateUniqueFilename(originalName: string, userId?: string): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  const extension = getFileExtension(originalName)

  const baseName = `${timestamp}-${random}`
  const filename = extension ? `${baseName}.${extension}` : baseName

  if (userId) {
    return `${userId}/${filename}`
  }

  return filename
}

// -----------------------------------------------------------------------------
// UPLOAD FUNCTIONS
// -----------------------------------------------------------------------------

/**
 * Upload file to Supabase Storage
 */
export async function uploadFile(
  bucket: string,
  path: string,
  file: File,
  options: UploadOptions = {}
): Promise<UploadResult> {
  try {
    const supabase = await createClient()

    if (!supabase) {
      return { error: 'Failed to initialize Supabase client' }
    }

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: (options.cacheControl || 3600).toString(),
        upsert: options.upsert || false,
        metadata: options.metadata
      })

    if (error) {
      logger.error('Upload error:', error)
      return { error: error.message }
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(path)

    return {
      publicUrl,
      path: data.path
    }
  } catch (error: unknown) {
    logger.error('Upload error:', error)
    return { error: getErrorMessage(error) || 'Failed to upload file' }
  }
}

/**
 * Upload multiple files
 */
export async function uploadMultipleFiles(
  bucket: string,
  files: Array<{ path: string; file: File }>,
  options: UploadOptions = {}
): Promise<UploadResult[]> {
  const results = await Promise.allSettled(
    files.map(({ path, file }) => uploadFile(bucket, path, file, options))
  )

  return results.map(result => {
    if (result.status === 'fulfilled') {
      return result.value
    } else {
      return { error: result.reason?.message || 'Upload failed' }
    }
  })
}

/**
 * Upload with progress tracking
 */
export async function uploadFileWithProgress(
  bucket: string,
  path: string,
  file: File,
  onProgress: (progress: number) => void,
  options: UploadOptions = {}
): Promise<UploadResult> {
  // Note: Supabase JS client doesn't support progress tracking natively
  // This is a simplified version that calls back on start and completion

  onProgress(0)

  const result = await uploadFile(bucket, path, file, options)

  onProgress(100)

  return result
}

// -----------------------------------------------------------------------------
// DELETE FUNCTIONS
// -----------------------------------------------------------------------------

/**
 * Delete file from Supabase Storage
 */
export async function deleteFile(
  bucket: string,
  path: string
): Promise<{ error?: string }> {
  try {
    const supabase = await createClient()

    if (!supabase) {
      return { error: 'Failed to initialize Supabase client' }
    }

    // Extract path from full URL if needed
    const filePath = path.includes('/storage/v1/object/public/')
      ? path.split('/object/public/' + bucket + '/')[1]
      : path

    const { error } = await supabase.storage
      .from(bucket)
      .remove([filePath])

    if (error) {
      logger.error('Delete error:', error)
      return { error: error.message }
    }

    return {}
  } catch (error: unknown) {
    logger.error('Delete error:', error)
    return { error: getErrorMessage(error) || 'Failed to delete file' }
  }
}

/**
 * Delete multiple files
 */
export async function deleteMultipleFiles(
  bucket: string,
  paths: string[]
): Promise<{ error?: string }> {
  try {
    const supabase = await createClient()

    if (!supabase) {
      return { error: 'Failed to initialize Supabase client' }
    }

    // Extract paths from full URLs if needed
    const filePaths = paths.map(path =>
      path.includes('/storage/v1/object/public/')
        ? path.split('/object/public/' + bucket + '/')[1]
        : path
    )

    const { error } = await supabase.storage
      .from(bucket)
      .remove(filePaths)

    if (error) {
      logger.error('Delete error:', error)
      return { error: error.message }
    }

    return {}
  } catch (error: unknown) {
    logger.error('Delete error:', error)
    return { error: getErrorMessage(error) || 'Failed to delete files' }
  }
}

// -----------------------------------------------------------------------------
// LIST FILES
// -----------------------------------------------------------------------------

/**
 * List files in a bucket/folder
 */
export async function listFiles(
  bucket: string,
  folder?: string,
  limit = 100
): Promise<{ files: string[]; error?: string }> {
  try {
    const supabase = await createClient()

    if (!supabase) {
      return { files: [], error: 'Failed to initialize Supabase client' }
    }

    const { data, error } = await supabase.storage
      .from(bucket)
      .list(folder || '', { limit })

    if (error) {
      logger.error('List error:', error)
      return { files: [], error: error.message }
    }

    const files = data
      .filter(item => !item.id.endsWith('/folder')) // Exclude folders
      .map(item => {
        const path = folder ? `${folder}/${item.name}` : item.name
        return getStorageUrl(`${bucket}/${path}`)
      })

    return { files }
  } catch (error: unknown) {
    logger.error('List error:', error)
    return { files: [], error: getErrorMessage(error) || 'Failed to list files' }
  }
}

// -----------------------------------------------------------------------------
// SPECIALIZED UPLOAD FUNCTIONS
// -----------------------------------------------------------------------------

/**
 * Upload event cover image
 */
export async function uploadEventCoverImage(
  eventId: string,
  file: File
): Promise<UploadResult> {
  const validation = validateFile(file, {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: 'image/*'
  })

  if (!validation.valid) {
    return { error: validation.error }
  }

  const fileName = generateUniqueFilename(file.name)
  const path = `events/${eventId}/cover/${fileName}`

  return uploadFile('event-images', path, file)
}

/**
 * Upload event banner image
 */
export async function uploadEventBannerImage(
  eventId: string,
  file: File
): Promise<UploadResult> {
  const validation = validateFile(file, {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: 'image/*'
  })

  if (!validation.valid) {
    return { error: validation.error }
  }

  const fileName = generateUniqueFilename(file.name)
  const path = `events/${eventId}/banner/${fileName}`

  return uploadFile('event-images', path, file)
}

/**
 * Upload event gallery image
 */
export async function uploadEventGalleryImage(
  eventId: string,
  file: File
): Promise<UploadResult> {
  const validation = validateFile(file, {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: 'image/*'
  })

  if (!validation.valid) {
    return { error: validation.error }
  }

  const fileName = generateUniqueFilename(file.name)
  const path = `events/${eventId}/gallery/${fileName}`

  return uploadFile('event-gallery', path, file)
}

/**
 * Upload user avatar
 */
export async function uploadUserAvatar(
  userId: string,
  file: File
): Promise<UploadResult> {
  const validation = validateFile(file, {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: 'image/*'
  })

  if (!validation.valid) {
    return { error: validation.error }
  }

  const fileName = generateUniqueFilename(file.name)
  const path = `avatars/${userId}/${fileName}`

  // Upload with upsert to replace old avatar
  return uploadFile('avatars', path, file, { upsert: true })
}

/**
 * Upload document
 */
export async function uploadDocument(
  userId: string,
  file: File,
  folder?: string
): Promise<UploadResult> {
  const validation = validateFile(file, {
    maxSize: 20 * 1024 * 1024, // 20MB
    allowedTypes: '.pdf,.doc,.docx,.jpg,.jpeg,.png'
  })

  if (!validation.valid) {
    return { error: validation.error }
  }

  const fileName = generateUniqueFilename(file.name)
  const basePath = folder ? `${userId}/${folder}` : userId
  const path = `${basePath}/${fileName}`

  return uploadFile('documents', path, file)
}

// -----------------------------------------------------------------------------
// IMAGE UTILITIES
// -----------------------------------------------------------------------------

/**
 * Get image dimensions
 */
export function getImageDimensions(
  file: File
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('File is not an image'))
      return
    }

    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve({ width: img.width, height: img.height })
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load image'))
    }

    img.src = url
  })
}

/**
 * Resize image
 */
export async function resizeImage(
  file: File,
  maxWidth: number,
  maxHeight: number,
  quality = 0.9
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)

      let { width, height } = img

      // Calculate new dimensions
      if (width > maxWidth) {
        height = (height * maxWidth) / width
        width = maxWidth
      }

      if (height > maxHeight) {
        width = (width * maxHeight) / height
        height = maxHeight
      }

      // Create canvas and resize
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Failed to get canvas context'))
        return
      }

      ctx.drawImage(img, 0, 0, width, height)

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob)
          } else {
            reject(new Error('Failed to resize image'))
          }
        },
        file.type,
        quality
      )
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load image'))
    }

    img.src = url
  })
}

/**
 * Compress image
 */
export async function compressImage(
  file: File,
  maxSizeKB = 500,
  quality = 0.9
): Promise<Blob> {
  let blob: Blob = file
  let currentQuality = quality

  while (blob.size > maxSizeKB * 1024 && currentQuality > 0.1) {
    blob = await resizeImage(
      new File([blob], file.name, { type: file.type }),
      1920,
      1080,
      currentQuality
    )
    currentQuality -= 0.1
  }

  return blob
}

// -----------------------------------------------------------------------------
// EXPORT ALL UTILITIES
// -----------------------------------------------------------------------------

export const uploadUtils = {
  validateFile,
  formatFileSize,
  getFileExtension,
  generateUniqueFilename,
  uploadFile,
  uploadMultipleFiles,
  uploadFileWithProgress,
  deleteFile,
  deleteMultipleFiles,
  listFiles,
  uploadEventCoverImage,
  uploadEventBannerImage,
  uploadEventGalleryImage,
  uploadUserAvatar,
  uploadDocument,
  getImageDimensions,
  resizeImage,
  compressImage
}
