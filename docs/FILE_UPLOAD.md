# FSTIVO File Upload System - Complete Guide

## Overview

The FSTIVO File Upload System provides a comprehensive, production-ready solution for uploading files to Supabase Storage. It includes:

- ✅ **Drag & Drop Upload** - Modern drag-and-drop interface
- ✅ **Multiple File Upload** - Upload single or multiple files
- ✅ **Camera Capture** - Direct camera capture on mobile devices
- ✅ **Progress Tracking** - Real-time upload progress
- ✅ **Image Preview** - Preview images before and after upload
- ✅ **File Validation** - Size, type, and dimension validation
- ✅ **Error Handling** - Comprehensive error messages and retry functionality
- ✅ **Image Optimization** - Automatic resizing and compression
- ✅ **Secure Storage** - Supabase Storage with Row Level Security (RLS)

---

## Quick Start (15 Minutes)

### 1. Run Migration

```bash
# Apply the storage buckets migration
supabase migration up --file supabase/migrations/005_storage_buckets.sql

# Or manually in Supabase SQL Editor
# Copy contents of 005_storage_buckets.sql
```

### 2. Verify Buckets

```sql
-- Check buckets created
SELECT * FROM storage.buckets;

-- Should show:
-- - event-images (public, 10MB)
-- - avatars (public, 5MB)
-- - event-gallery (public, 10MB)
-- - documents (private, 20MB)
```

### 3. Basic Usage

```tsx
import { FileUploadSystem } from '@/components/features/file-upload-system'

export default function EventCreatePage() {
  const handleUploadComplete = (urls: string[]) => {
    console.log('Uploaded:', urls)
    // Save URLs to database
  }

  return (
    <FileUploadSystem
      bucket="event-images"
      path="events/event-123"
      fileType="IMAGE"
      multiple={true}
      maxFiles={10}
      onUploadComplete={handleUploadComplete}
    />
  )
}
```

---

## Component Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `bucket` | `string` | required | Supabase storage bucket name |
| `path` | `string` | `''` | Folder path within bucket |
| `fileType` | `'IMAGE' \| 'DOCUMENT' \| 'ANY'` | `'IMAGE'` | File type restrictions |
| `multiple` | `boolean` | `false` | Allow multiple file selection |
| `maxFiles` | `number` | `10` | Maximum number of files |
| `maxFileSize` | `number` | varies | Maximum file size in bytes |
| `onUploadComplete` | `(urls: string[]) => void` | - | Callback when upload completes |
| `onFileDelete` | `(url: string) => void` | - | Callback when file is deleted |
| `existingFiles` | `string[]` | `[]` | Pre-existing file URLs |
| `showPreview` | `boolean` | `true` | Show image previews |
| `disabled` | `boolean` | `false` | Disable upload |
| `className` | `string` | `''` | Additional CSS classes |

---

## Storage Buckets

### 1. Event Images Bucket

**Name:** `event-images`
**Access:** Public
**Max Size:** 10MB per file
**Allowed Types:** JPEG, PNG, WebP, GIF

**Usage:** Event cover images and banners

```tsx
<FileUploadSystem
  bucket="event-images"
  path="events/event-123/cover"
  fileType="IMAGE"
  onUploadComplete={(urls) => updateEvent({ coverImage: urls[0] })}
/>
```

### 2. Avatars Bucket

**Name:** `avatars`
**Access:** Public
**Max Size:** 5MB per file
**Allowed Types:** JPEG, PNG, WebP

**Usage:** User profile pictures

```tsx
<FileUploadSystem
  bucket="avatars"
  path={`avatars/${userId}`}
  fileType="IMAGE"
  onUploadComplete={(urls) => updateProfile({ avatarUrl: urls[0] })}
/>
```

### 3. Event Gallery Bucket

**Name:** `event-gallery`
**Access:** Public
**Max Size:** 10MB per file
**Allowed Types:** JPEG, PNG, WebP, GIF

**Usage:** Event photo galleries

```tsx
<FileUploadSystem
  bucket="event-gallery"
  path="events/event-123/gallery"
  fileType="IMAGE"
  multiple={true}
  maxFiles={50}
  onUploadComplete={(urls) => updateEvent({ gallery: urls })}
/>
```

### 4. Documents Bucket

**Name:** `documents`
**Access:** Private
**Max Size:** 20MB per file
**Allowed Types:** PDF, DOC, DOCX

**Usage:** Contracts, invoices, certificates

```tsx
<FileUploadSystem
  bucket="documents"
  path={`documents/${userId}/contracts`}
  fileType="DOCUMENT"
  onUploadComplete={(urls) => saveContract(urls[0])}
/>
```

---

## Upload Utility Functions

### Basic Upload

```typescript
import { uploadFile } from '@/lib/utils/uploadUtils'

const result = await uploadFile(
  'event-images',
  'events/event-123/cover.jpg',
  file
)

if (result.publicUrl) {
  console.log('Uploaded:', result.publicUrl)
}
```

### Upload Multiple Files

```typescript
import { uploadMultipleFiles } from '@/lib/utils/uploadUtils'

const files = [
  { path: 'events/123/cover.jpg', file: coverFile },
  { path: 'events/123/banner.jpg', file: bannerFile }
]

const results = await uploadMultipleFiles('event-images', files)
```

### Delete File

```typescript
import { deleteFile } from '@/lib/utils/uploadUtils'

await deleteFile('event-images', 'events/event-123/cover.jpg')
```

### List Files

```typescript
import { listFiles } from '@/lib/utils/uploadUtils'

const { files, error } = await listFiles(
  'event-images',
  'events/event-123/gallery'
)
```

---

## Specialized Upload Functions

### Upload Event Cover Image

```typescript
import { uploadEventCoverImage } from '@/lib/utils/uploadUtils'

const result = await uploadEventCoverImage('event-123', file)

if (result.error) {
  toast.error(result.error)
} else {
  await updateEvent(eventId, { cover_image_url: result.publicUrl })
}
```

### Upload User Avatar

```typescript
import { uploadUserAvatar } from '@/lib/utils/uploadUtils'

const result = await uploadUserAvatar(userId, file)

if (result.publicUrl) {
  await updateProfile(userId, { avatar_url: result.publicUrl })
}
```

### Upload Event Gallery

```typescript
import { uploadEventGalleryImage } from '@/lib/utils/uploadUtils'

const urls = []

for (const file of files) {
  const result = await uploadEventGalleryImage(eventId, file)
  if (result.publicUrl) {
    urls.push(result.publicUrl)
  }
}

await updateEvent(eventId, { gallery_images: urls })
```

---

## Integration Examples

### 1. Event Creation Wizard

```tsx
'use client'

import { useState } from 'react'
import { FileUploadSystem } from '@/components/features/file-upload-system'
import { Button } from '@/components/ui/button'
import { uploadEventCoverImage, uploadEventBannerImage } from '@/lib/utils/uploadUtils'
import { toast } from 'sonner'

export function EventCreationWizard() {
  const [coverImage, setCoverImage] = useState<string>()
  const [bannerImage, setBannerImage] = useState<string>()
  const [gallery, setGallery] = useState<string[]>([])

  const handleCreateEvent = async () => {
    const result = await createEvent({
      cover_image_url: coverImage,
      banner_image_url: bannerImage,
      gallery_images: gallery
    })

    toast.success('Event created!')
  }

  return (
    <div className="space-y-8">
      {/* Cover Image */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Cover Image</h2>
        <FileUploadSystem
          bucket="event-images"
          path="events/temp/cover"
          fileType="IMAGE"
          onUploadComplete={(urls) => setCoverImage(urls[0])}
        />
      </section>

      {/* Banner Image */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Banner Image</h2>
        <FileUploadSystem
          bucket="event-images"
          path="events/temp/banner"
          fileType="IMAGE"
          onUploadComplete={(urls) => setBannerImage(urls[0])}
        />
      </section>

      {/* Gallery */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Event Gallery</h2>
        <FileUploadSystem
          bucket="event-gallery"
          path="events/temp/gallery"
          fileType="IMAGE"
          multiple={true}
          maxFiles={50}
          onUploadComplete={(urls) => setGallery([...gallery, ...urls])}
        />
      </section>

      <Button onClick={handleCreateEvent}>
        Create Event
      </Button>
    </div>
  )
}
```

### 2. Profile Picture Upload

```tsx
'use client'

import { useState } from 'react'
import { FileUploadSystem } from '@/components/features/file-upload-system'
import { uploadUserAvatar } from '@/lib/utils/uploadUtils'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'

export function ProfileSettings() {
  const [avatarUrl, setAvatarUrl] = useState<string>()
  const [loading, setLoading] = useState(false)

  const handleAvatarUpload = async (urls: string[]) => {
    setLoading(true)
    try {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        toast.error('You must be logged in')
        return
      }

      // Update profile in database
      const { error } = await supabase
        .from('user_profiles')
        .update({ avatar_url: urls[0] })
        .eq('id', user.id)

      if (error) throw error

      setAvatarUrl(urls[0])
      toast.success('Profile picture updated!')
    } catch (error) {
      toast.error('Failed to update profile picture')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Profile Picture</h2>

      {avatarUrl && (
        <img
          src={avatarUrl}
          alt="Profile"
          className="w-24 h-24 rounded-full mb-4"
        />
      )}

      <FileUploadSystem
        bucket="avatars"
        disabled={loading}
        fileType="IMAGE"
        onUploadComplete={handleAvatarUpload}
      />
    </div>
  )
}
```

### 3. Event Gallery Management

```tsx
'use client'

import { useState, useEffect } from 'react'
import { FileUploadSystem } from '@/components/features/file-upload-system'
import { listFiles } from '@/lib/utils/uploadUtils'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'

export function EventGallery({ eventId }: { eventId: string }) {
  const [gallery, setGallery] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  // Load existing gallery
  useEffect(() => {
    loadGallery()
  }, [eventId])

  const loadGallery = async () => {
    setLoading(true)
    const { files } = await listFiles(
      'event-gallery',
      `events/${eventId}/gallery`
    )
    setGallery(files)
    setLoading(false)
  }

  const handleDeleteImage = async (url: string) => {
    // Delete from storage
    await deleteFile('event-gallery', url)

    // Update state
    setGallery(gallery.filter(img => img !== url))

    // Update database
    await updateEvent(eventId, {
      gallery_images: gallery.filter(img => img !== url)
    })
  }

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Event Gallery</h2>

      {loading ? (
        <p>Loading gallery...</p>
      ) : (
        <div className="grid grid-cols-4 gap-4 mb-6">
          {gallery.map((url, index) => (
            <div key={index} className="relative group">
              <img
                src={url}
                alt={`Gallery ${index + 1}`}
                className="w-full aspect-square object-cover rounded"
              />
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100"
                onClick={() => handleDeleteImage(url)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <FileUploadSystem
        bucket="event-gallery"
        path={`events/${eventId}/gallery`}
        fileType="IMAGE"
        multiple={true}
        maxFiles={50}
        onUploadComplete={(urls) => setGallery([...gallery, ...urls])}
      />
    </div>
  )
}
```

---

## Image Optimization

### Auto-Resize on Upload

```typescript
import { resizeImage, uploadFile } from '@/lib/utils/uploadUtils'

const file = event.target.files[0]

// Resize to max 1920x1080
const resized = await resizeImage(file, 1920, 1080, 0.9)

// Upload resized image
const result = await uploadFile(
  'event-images',
  `events/${eventId}/cover.jpg`,
  new File([resized], file.name, { type: file.type })
)
```

### Compress Image

```typescript
import { compressImage, uploadFile } from '@/lib/utils/uploadUtils'

const file = event.target.files[0]

// Compress to max 500KB
const compressed = await compressImage(file, 500)

// Upload compressed image
const result = await uploadFile(
  'event-images',
  `events/${eventId}/cover.jpg`,
  new File([compressed], file.name, { type: file.type })
)
```

---

## Validation

### File Size Validation

```typescript
import { validateFile } from '@/lib/utils/uploadUtils'

const validation = validateFile(file, {
  maxSize: 5 * 1024 * 1024 // 5MB
})

if (!validation.valid) {
  toast.error(validation.error)
  return
}
```

### File Type Validation

```typescript
const validation = validateFile(file, {
  allowedTypes: 'image/*' // or '.pdf,.doc,.docx'
})

if (!validation.valid) {
  toast.error(validation.error)
  return
}
```

### Image Dimension Validation

```typescript
const validation = await validateFile(file, {
  maxWidth: 1920,
  maxHeight: 1080
})

if (!validation.valid) {
  toast.error(validation.error)
  return
}
```

---

## Server Actions

### Upload Event Cover (Server-Side)

```typescript
// src/lib/actions/events-server.ts
'use server'

import { createClient } from '@/lib/supabase/client'
import { revalidatePath } from 'next/cache'

export async function uploadEventCoverAction(eventId: string, file: File) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Unauthorized' }
  }

  // Check ownership
  const { data: event } = await supabase
    .from('events')
    .select('organizer_id')
    .eq('id', eventId)
    .single()

  if (event?.organizer_id !== user.id) {
    return { error: 'Forbidden' }
  }

  // Upload file
  const fileName = `${eventId}-cover-${Date.now()}.jpg`
  const { data, error } = await supabase.storage
    .from('event-images')
    .upload(`events/${eventId}/cover/${fileName}`, file)

  if (error) {
    return { error: 'Upload failed' }
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('event-images')
    .getPublicUrl(data.path)

  // Update event
  const { error: updateError } = await supabase
    .from('events')
    .update({ cover_image_url: publicUrl })
    .eq('id', eventId)

  if (updateError) {
    return { error: 'Failed to update event' }
  }

  revalidatePath('/dashboard/events')
  revalidatePath(`/events/${eventId}`)

  return { success: true, imageUrl: publicUrl }
}
```

---

## Database Schema Updates

### Add Image URL Columns to Events Table

```sql
-- Add image columns to events table if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'events'
        AND column_name = 'cover_image_url'
    ) THEN
        ALTER TABLE events
        ADD COLUMN cover_image_url TEXT,
        ADD COLUMN banner_image_url TEXT,
        ADD COLUMN gallery_images TEXT[] DEFAULT '{}';
    END IF;
END $$;

-- Create index for image URL lookups
CREATE INDEX IF NOT EXISTS idx_events_cover_image ON events(cover_image_url);
```

### Add Avatar URL to User Profiles

```sql
-- Add avatar column if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'user_profiles'
        AND column_name = 'avatar_url'
    ) THEN
        ALTER TABLE user_profiles
        ADD COLUMN avatar_url TEXT;
    END IF;
END $$;
```

---

## Security Best Practices

### 1. Always Validate on Server

```typescript
// ❌ Bad - Client-side only
const file = event.target.files[0]
await uploadFile('bucket', 'path', file)

// ✅ Good - Server validation
export async function uploadAction(file: File) {
  if (file.size > 5 * 1024 * 1024) {
    return { error: 'File too large' }
  }

  if (!file.type.startsWith('image/')) {
    return { error: 'Invalid file type' }
  }

  return await uploadFile('bucket', 'path', file)
}
```

### 2. Use Server Actions for Uploads

```typescript
// ✅ Recommended - Use server actions
import { uploadEventCoverAction } from '@/lib/actions/events-server'

const formData = new FormData()
formData.append('file', file)

const result = await uploadEventCoverAction(eventId, formData)
```

### 3. Implement Rate Limiting

```typescript
// Rate limit uploads per user
const uploadsLastHour = await db.uploads.count({
  where: {
    user_id: userId,
    created_at: { gte: new Date(Date.now() - 3600000) }
  }
})

if (uploadsLastHour > 100) {
  return { error: 'Too many uploads. Please try again later.' }
}
```

---

## Performance Optimization

### 1. Lazy Load Images

```tsx
<img
  src={imageUrl}
  loading="lazy"
  alt="Event image"
/>
```

### 2. Use Image CDN

```typescript
// Use Supabase image transformations
const transformUrl = (url: string, width: number, quality: number) => {
  return `${url}?width=${width}&quality=${quality}`
}

<img src={transformUrl(imageUrl, 800, 80)} />
```

### 3. Implement Progressive Loading

```tsx
const [blurUrl, setBlurUrl] = useState<string>()
const [fullUrl, setFullUrl] = useState<string>()

<img
  src={fullUrl || blurUrl}
  style={{ filter: fullUrl ? 'none' : 'blur(10px)' }}
  onLoad={() => setFullUrl(imageUrl)}
/>
```

---

## Troubleshooting

### Issue: Upload fails with "Bucket not found"

**Solution:**
```sql
-- Verify bucket exists
SELECT * FROM storage.buckets WHERE id = 'event-images';

-- If missing, recreate bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('event-images', 'event-images', true);
```

### Issue: "Permission denied" error

**Solution:**
```sql
-- Check RLS policies
SELECT * FROM pg_policies
WHERE tablename = 'objects' AND schemaname = 'storage';

-- Ensure user has INSERT permission
GRANT ALL ON storage.objects TO authenticated;
```

### Issue: File too large error

**Solution:**
```sql
-- Check bucket file size limit
SELECT file_size_limit FROM storage.buckets WHERE id = 'event-images';

-- Update limit (in bytes)
UPDATE storage.buckets
SET file_size_limit = 10485760 -- 10MB
WHERE id = 'event-images';
```

### Issue: Slow upload speeds

**Solutions:**
1. Compress images before upload
2. Use multiple smaller files instead of one large file
3. Implement chunked upload for large files
4. Check network connection

---

## Testing Checklist

- [ ] Single file upload
- [ ] Multiple file upload
- [ ] Drag and drop functionality
- [ ] Camera capture on mobile
- [ ] File size validation
- [ ] File type validation
- [ ] Progress tracking
- [ ] Error handling and retry
- [ ] File deletion
- [ ] Existing files display
- [ ] Preview images
- [ ] RLS policies enforcement
- [ ] Public/private bucket access
- [ ] Server action integration

---

## API Reference

### FileUploadSystem Component

```typescript
interface FileUploadSystemProps {
  bucket: string                          // Storage bucket name
  path?: string                           // Folder path
  fileType?: 'IMAGE' | 'DOCUMENT' | 'ANY' // File type
  multiple?: boolean                      // Allow multiple
  maxFiles?: number                       // Max files
  maxFileSize?: number                    // Max size in bytes
  onUploadComplete?: (urls: string[]) => void
  onFileDelete?: (url: string) => void
  existingFiles?: string[]                // Pre-existing URLs
  showPreview?: boolean                   // Show previews
  disabled?: boolean                      // Disable upload
  className?: string                      // Additional CSS
}
```

### Upload Utility Functions

```typescript
// Basic upload
uploadFile(bucket: string, path: string, file: File, options?: UploadOptions): Promise<UploadResult>

// Multiple files
uploadMultipleFiles(bucket: string, files: Array<{path: string, file: File}>): Promise<UploadResult[]>

// Delete file
deleteFile(bucket: string, path: string): Promise<{error?: string}>

// List files
listFiles(bucket: string, folder?: string, limit?: number): Promise<{files: string[], error?: string}>

// Validate file
validateFile(file: File, options?: ValidationOptions): ValidationResult

// Specialized uploads
uploadEventCoverImage(eventId: string, file: File): Promise<UploadResult>
uploadEventBannerImage(eventId: string, file: File): Promise<UploadResult>
uploadEventGalleryImage(eventId: string, file: File): Promise<UploadResult>
uploadUserAvatar(userId: string, file: File): Promise<UploadResult>
uploadDocument(userId: string, file: File, folder?: string): Promise<UploadResult>

// Image utilities
getImageDimensions(file: File): Promise<{width: number, height: number}>
resizeImage(file: File, maxWidth: number, maxHeight: number, quality?: number): Promise<Blob>
compressImage(file: File, maxSizeKB?: number, quality?: number): Promise<Blob>
```

---

## File Structure

```
src/
├── components/
│   └── features/
│       └── file-upload-system.tsx    # Main upload component
├── lib/
│   └── utils/
│       └── uploadUtils.ts            # Upload utility functions
└── app/
    └── api/
        └── upload/
            └── route.ts              # Upload API endpoint (optional)

supabase/
└── migrations/
    └── 005_storage_buckets.sql       # Storage buckets & RLS
```

---

## Support

For issues or questions:
- Check migration: `supabase/migrations/005_storage_buckets.sql`
- Check component: `src/components/features/file-upload-system.tsx`
- Check utilities: `src/lib/utils/uploadUtils.ts`

---

**Generated with ❤️ for FSTIVO Platform**
*File Upload System v1.0*
