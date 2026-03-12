/**
 * QR Code Image Generation
 * Generate QR code images for registrations, tickets, and check-in
 */

import QRCode from 'qrcode'
import { logger } from '@/lib/logger';

export interface QRCodeOptions {
  width?: number
  margin?: number
  color?: {
    dark?: string
    light?: string
  }
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H'
  logo?: {
    src: string | Buffer
    width?: number
    height?: number
  }
}

export interface StyledQRCodeOptions extends QRCodeOptions {
  title?: string
  subtitle?: string
  backgroundColor?: string
  borderColor?: string
  borderWidth?: number
  showText?: boolean
}

const DEFAULT_OPTIONS: QRCodeOptions = {
  width: 300,
  margin: 2,
  color: {
    dark: '#000000',
    light: '#FFFFFF',
  },
  errorCorrectionLevel: 'M',
}

/**
 * Generate QR code as data URL (base64)
 */
export async function generateQRCodeDataURL(
  data: string,
  options: QRCodeOptions = {}
): Promise<string> {
  const opts = { ...DEFAULT_OPTIONS, ...options }

  try {
    const dataURL = await QRCode.toDataURL(data, {
      width: opts.width,
      margin: opts.margin,
      color: opts.color,
      errorCorrectionLevel: opts.errorCorrectionLevel,
    })

    return dataURL
  } catch (error) {
    logger.error('[QR] Failed to generate QR code data URL:', error)
    throw new Error('Failed to generate QR code')
  }
}

/**
 * Generate QR code as Buffer
 */
export async function generateQRCodeBuffer(
  data: string,
  options: QRCodeOptions = {}
): Promise<Buffer> {
  const opts = { ...DEFAULT_OPTIONS, ...options }

  try {
    const buffer = await QRCode.toBuffer(data, {
      width: opts.width,
      margin: opts.margin,
      color: opts.color,
      errorCorrectionLevel: opts.errorCorrectionLevel,
    })

    return buffer
  } catch (error) {
    logger.error('[QR] Failed to generate QR code buffer:', error)
    throw new Error('Failed to generate QR code')
  }
}

/**
 * Generate QR code as Base64 string (without data URL prefix)
 */
export async function generateQRCodeBase64(
  data: string,
  options: QRCodeOptions = {}
): Promise<string> {
  const dataURL = await generateQRCodeDataURL(data, options)
  return dataURL.split(',')[1]
}

/**
 * Generate styled QR code with decorative frame
 * Creates an SVG with QR code and additional styling
 */
export async function generateStyledQRCodeSVG(
  data: string,
  options: StyledQRCodeOptions = {}
): Promise<string> {
  const {
    title,
    subtitle,
    backgroundColor = '#ffffff',
    borderColor = '#6366f1',
    borderWidth = 8,
    width = 300,
    showText = true,
    ...qrOptions
  } = options

  try {
    // Generate base QR code
    const qrDataUrl = await generateQRCodeDataURL(data, {
      width: width - 40,
      margin: 1,
      ...qrOptions,
    })

    // Create SVG with frame
    const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${width + (showText ? 60 : 20)}" viewBox="0 0 ${width} ${width + (showText ? 60 : 20)}">
  <!-- Background -->
  <rect x="0" y="0" width="${width}" height="${width + (showText ? 60 : 20)}" fill="${backgroundColor}"/>

  <!-- Border Frame -->
  <rect x="${borderWidth}" y="${borderWidth}" width="${width - borderWidth * 2}" height="${width - borderWidth * 2}" fill="none" stroke="${borderColor}" stroke-width="${borderWidth}" rx="12"/>

  <!-- QR Code -->
  <image x="20" y="20" width="${width - 40}" height="${width - 40}" href="${qrDataUrl}" />

  ${title || subtitle ? `
  <!-- Title and Subtitle -->
  <text x="${width / 2}" y="${width + 25}" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#333">${title || ''}</text>
  <text x="${width / 2}" y="${width + 45}" text-anchor="middle" font-family="Arial, sans-serif" font-size="11" fill="#666">${subtitle || ''}</text>
  ` : ''}
</svg>
    `.trim()

    // Convert SVG to base64
    const base64 = Buffer.from(svg).toString('base64')
    return `data:image/svg+xml;base64,${base64}`
  } catch (error) {
    logger.error('[QR] Failed to generate styled QR code:', error)
    throw new Error('Failed to generate styled QR code')
  }
}

/**
 * Generate QR code for registration with event branding
 */
export async function generateRegistrationQRCode(
  registrationNumber: string,
  eventTitle: string,
  options?: StyledQRCodeOptions
): Promise<{
  png: Buffer
  dataURL: string
  svg: string
}> {
  // Generate PNG buffer
  const pngBuffer = await generateQRCodeBuffer(registrationNumber, options)

  // Generate data URL
  const dataURL = await generateQRCodeDataURL(registrationNumber, options)

  // Generate styled SVG
  const svg = await generateStyledQRCodeSVG(registrationNumber, {
    title: 'Your Ticket',
    subtitle: eventTitle.length > 30 ? eventTitle.substring(0, 30) + '...' : eventTitle,
    ...options,
  })

  return {
    png: pngBuffer,
    dataURL,
    svg,
  }
}

/**
 * Generate QR code for check-in (simple, scannable)
 */
export async function generateCheckInQRCode(
  data: string,
  options?: QRCodeOptions
): Promise<Buffer> {
  // High error correction for check-in QR codes
  return generateQRCodeBuffer(data, {
    errorCorrectionLevel: 'H',
    width: 400,
    margin: 1,
    ...options,
  })
}

/**
 * Validate QR code data format
 */
export function isValidQRCodeData(data: string): boolean {
  // Check if it matches our QR code format: FSTIVO-{id}-{hex}
  const qrPattern = /^FSTIVO-[a-f0-9-]+-[a-f0-9]+$/i
  return qrPattern.test(data)
}

/**
 * Extract registration ID from QR code data
 */
export function extractRegistrationIdFromQR(qrData: string): string | null {
  if (!isValidQRCodeData(qrData)) {
    return null
  }

  // QR format: FSTIVO-{registration_id}-{random}
  const parts = qrData.split('-')
  if (parts.length >= 2) {
    return parts[1]
  }

  return null
}

/**
 * Generate multiple QR codes for batch operations
 */
export async function generateBatchQRCodes(
  dataList: string[],
  options: QRCodeOptions = {}
): Promise<Buffer[]> {
  const promises = dataList.map(data => generateQRCodeBuffer(data, options))
  return Promise.all(promises)
}

/**
 * Get QR code cache key
 */
export function getQRCodeCacheKey(data: string, options: QRCodeOptions = {}): string {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  return `qr:${data}:${JSON.stringify(opts)}`
}

/**
 * QR code dimensions for different use cases
 */
export const QR_DIMENSIONS = {
  ticket: 300,
  checkin: 400,
  small: 150,
  print: 600,
} as const

/**
 * Get recommended QR code options for different use cases
 */
export function getQROptionsForUseCase(useCase: 'ticket' | 'checkin' | 'small' | 'print'): QRCodeOptions {
  const dimensions = {
    ticket: { width: QR_DIMENSIONS.ticket, errorCorrectionLevel: 'M' as const },
    checkin: { width: QR_DIMENSIONS.checkin, errorCorrectionLevel: 'H' as const },
    small: { width: QR_DIMENSIONS.small, errorCorrectionLevel: 'M' as const },
    print: { width: QR_DIMENSIONS.print, errorCorrectionLevel: 'H' as const },
  }

  return dimensions[useCase]
}
