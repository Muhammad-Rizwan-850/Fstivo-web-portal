'use client'

import React, { useState, useRef, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Upload,
  X,
  Image as ImageIcon,
  File,
  Camera,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Download,
  Loader2
} from 'lucide-react'
import { uploadFile as uploadFileUtil, deleteFile, validateFile } from '@/lib/utils/uploadUtils'
import { toast } from 'sonner'
import { logger } from '@/lib/logger';

// File types configuration
export const FILE_TYPES = {
  IMAGE: {
    accept: 'image/*',
    maxSize: 5 * 1024 * 1024, // 5MB
    icon: ImageIcon,
    label: 'Image'
  },
  DOCUMENT: {
    accept: '.pdf,.doc,.docx',
    maxSize: 10 * 1024 * 1024, // 10MB
    icon: File,
    label: 'Document'
  },
  ANY: {
    accept: '*',
    maxSize: 10 * 1024 * 1024, // 10MB
    icon: File,
    label: 'Any File'
  }
}

export interface UploadFile {
  id: string
  file: File
  preview?: string
  progress: number
  status: 'uploading' | 'success' | 'error'
  url?: string
  error?: string
}

export interface FileUploadSystemProps {
  bucket: string
  path?: string
  fileType?: keyof typeof FILE_TYPES
  multiple?: boolean
  maxFiles?: number
  maxFileSize?: number
  onUploadComplete?: (urls: string[]) => void
  onFileDelete?: (url: string) => void
  existingFiles?: string[]
  className?: string
  showPreview?: boolean
  disabled?: boolean
}

export function FileUploadSystem({
  bucket,
  path = '',
  fileType = 'IMAGE',
  multiple = false,
  maxFiles = 10,
  maxFileSize,
  onUploadComplete,
  onFileDelete,
  existingFiles = [],
  className = '',
  showPreview = true,
  disabled = false
}: FileUploadSystemProps) {
  const [files, setFiles] = useState<UploadFile[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [isCameraOpen, setIsCameraOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const dropZoneRef = useRef<HTMLDivElement>(null)

  const fileConfig = FILE_TYPES[fileType]
  const effectiveMaxSize = maxFileSize || fileConfig.maxSize

  // Handle file selection
  const handleFileSelect = useCallback(async (selectedFiles: FileList | File[]) => {
    if (disabled) return

    const fileArray = Array.from(selectedFiles)

    // Check max files limit
    if (!multiple && fileArray.length > 1) {
      toast.error('Only one file is allowed')
      return
    }

    if (files.length + fileArray.length > maxFiles) {
      toast.error(`Maximum ${maxFiles} files allowed`)
      return
    }

    const newFiles: UploadFile[] = []

    for (const file of fileArray) {
      // Validate file
      const validation = validateFile(file, {
        maxSize: effectiveMaxSize,
        allowedTypes: fileConfig.accept
      })

      if (!validation.valid) {
        toast.error(validation.error || 'Invalid file')
        continue
      }

      // Create preview for images
      let preview: string | undefined
      if (file.type.startsWith('image/')) {
        preview = URL.createObjectURL(file)
      }

      newFiles.push({
        id: `${Date.now()}-${Math.random()}`,
        file,
        preview,
        progress: 0,
        status: 'uploading'
      })
    }

    if (newFiles.length === 0) return

    setFiles(prev => [...prev, ...newFiles])

    // Upload each file
    for (const uploadFile of newFiles) {
      try {
        await uploadFileWithProgress(uploadFile)
      } catch (error) {
        logger.error('Upload error:', error)
        setFiles(prev =>
          prev.map(f =>
            f.id === uploadFile.id
              ? { ...f, status: 'error', error: 'Upload failed' }
              : f
          )
        )
      }
    }
  }, [disabled, files.length, maxFiles, effectiveMaxSize, fileConfig.accept, multiple])

  // Upload file with progress tracking
  const uploadFileWithProgress = async (uploadFile: UploadFile) => {
    const filePath = path
      ? `${path}/${uploadFile.file.name}`
      : `${Date.now()}-${uploadFile.file.name}`

    // Simulate progress (in production, use actual upload progress)
    const progressInterval = setInterval(() => {
      setFiles(prev =>
        prev.map(f =>
          f.id === uploadFile.id && f.progress < 90
            ? { ...f, progress: f.progress + 10 }
            : f
        )
      )
    }, 200)

    try {
      const result = await uploadFileUtil(bucket, filePath, uploadFile.file)

      clearInterval(progressInterval)

      if (result.error) {
        throw new Error(result.error)
      }

      setFiles(prev =>
        prev.map(f =>
          f.id === uploadFile.id
            ? {
                ...f,
                progress: 100,
                status: 'success',
                url: result.publicUrl
              }
            : f
        )
      )

      toast.success(`${uploadFile.file.name} uploaded successfully`)

      // Notify parent component
      const successUrls = files
        .filter(f => f.status === 'success' && f.url)
        .map(f => f.url!)

      if (result.publicUrl) {
        onUploadComplete?.([...successUrls, result.publicUrl])
      }
    } catch (error: any) {
      clearInterval(progressInterval)
      throw error
    }
  }

  // Handle drag and drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!disabled) {
      setIsDragging(true)
    }
  }, [disabled])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    if (disabled) return

    const droppedFiles = e.dataTransfer.files
    handleFileSelect(droppedFiles)
  }, [disabled, handleFileSelect])

  // Handle file input change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFileSelect(e.target.files)
    }
    // Reset input so same file can be selected again
    e.target.value = ''
  }

  // Handle camera capture
  const handleCameraCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFileSelect(e.target.files)
    }
  }

  // Remove file
  const removeFile = async (fileId: string) => {
    const file = files.find(f => f.id === fileId)

    if (file?.url) {
      // Delete from storage
      const result = await deleteFile(bucket, file.url)
      if (result.error) {
        toast.error('Failed to delete file')
        return
      }
    }

    setFiles(prev => prev.filter(f => f.id !== fileId))
    onFileDelete?.(file?.url || '')

    // Clean up preview
    if (file?.preview) {
      URL.revokeObjectURL(file.preview)
    }

    toast.success('File removed')
  }

  // Retry upload
  const retryUpload = async (fileId: string) => {
    const file = files.find(f => f.id === fileId)
    if (!file) return

    setFiles(prev =>
      prev.map(f =>
        f.id === fileId
          ? { ...f, status: 'uploading', progress: 0, error: undefined }
          : f
      )
    )

    try {
      await uploadFileWithProgress(file)
    } catch (error) {
      logger.error('Retry upload error:', error)
    }
  }

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  // Cleanup previews on unmount
  useEffect(() => {
    return () => {
      files.forEach(f => {
        if (f.preview) {
          URL.revokeObjectURL(f.preview)
        }
      })
    }
  }, [files])

  const FileIcon = fileConfig.icon

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      {!disabled && (
        <Card
          ref={dropZoneRef}
          className={`relative border-2 border-dashed transition-colors ${
            isDragging
              ? 'border-primary bg-primary/5'
              : 'border-muted-foreground/25 hover:border-primary/50'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="p-8">
            <div className="flex flex-col items-center justify-center text-center space-y-4">
              <div className="p-4 bg-primary/10 rounded-full">
                <Upload className="h-8 w-8 text-primary" />
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-lg">
                  {multiple ? 'Upload Files' : 'Upload File'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  Drag and drop files here, or click to browse
                </p>
              </div>

              <div className="flex flex-wrap gap-2 justify-center">
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={disabled}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Browse Files
                </Button>

                {fileType === 'IMAGE' && (
                  <Button
                    onClick={() => cameraInputRef.current?.click()}
                    variant="outline"
                    disabled={disabled}
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    Camera
                  </Button>
                )}
              </div>

              <p className="text-xs text-muted-foreground">
                Max size: {formatFileSize(effectiveMaxSize)}
                {multiple && ` • Max ${maxFiles} files`}
              </p>
            </div>

            {/* Hidden file inputs */}
            <input
              ref={fileInputRef}
              type="file"
              accept={fileConfig.accept}
              multiple={multiple}
              onChange={handleFileInputChange}
              className="hidden"
            />
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleCameraCapture}
              className="hidden"
            />
          </div>
        </Card>
      )}

      {/* File List */}
      {(files.length > 0 || existingFiles.length > 0) && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">
              {files.length + existingFiles.length}{' '}
              {files.length + existingFiles.length === 1 ? 'File' : 'Files'}
            </h4>
            <Badge variant="secondary">
              {files.filter(f => f.status === 'success').length} /{' '}
              {files.length + existingFiles.length}
            </Badge>
          </div>

          {/* Existing Files */}
          {existingFiles.map((url, index) => (
            <Card key={`existing-${index}`} className="p-3">
              <div className="flex items-center gap-3">
                {showPreview && url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                  <img
                    src={url}
                    alt={`File ${index + 1}`}
                    className="w-16 h-16 object-cover rounded"
                  />
                ) : (
                  <div className="w-16 h-16 bg-muted rounded flex items-center justify-center">
                    <FileIcon className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {url.split('/').pop() || 'Uploaded file'}
                  </p>
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline"
                  >
                    View file
                  </a>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    onFileDelete?.(url)
                    toast.success('File removed')
                  }}
                  disabled={disabled}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </Card>
          ))}

          {/* New Files */}
          {files.map(file => (
            <Card key={file.id} className="p-3">
              <div className="flex items-center gap-3">
                {showPreview && file.preview ? (
                  <img
                    src={file.preview}
                    alt={file.file.name}
                    className="w-16 h-16 object-cover rounded"
                  />
                ) : (
                  <div className="w-16 h-16 bg-muted rounded flex items-center justify-center">
                    <FileIcon className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {file.file.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(file.file.size)}
                  </p>

                  {file.status === 'uploading' && (
                    <div className="mt-2">
                      <Progress value={file.progress} className="h-1" />
                      <p className="text-xs text-muted-foreground mt-1">
                        Uploading... {file.progress}%
                      </p>
                    </div>
                  )}

                  {file.status === 'success' && file.url && (
                    <div className="flex items-center gap-2 mt-1">
                      <CheckCircle2 className="h-3 w-3 text-green-500" />
                      <a
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline"
                      >
                        View file
                      </a>
                    </div>
                  )}

                  {file.status === 'error' && (
                    <Alert variant="destructive" className="mt-2 py-2">
                      <AlertCircle className="h-3 w-3" />
                      <AlertDescription className="text-xs">
                        {file.error || 'Upload failed'}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>

                <div className="flex gap-1">
                  {file.status === 'error' && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => retryUpload(file.id)}
                    >
                      <Loader2 className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeFile(file.id)}
                    disabled={file.status === 'uploading'}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {files.length === 0 && existingFiles.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <FileIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">No files uploaded yet</p>
        </div>
      )}
    </div>
  )
}

// Standalone demo mode export
export default FileUploadSystem
