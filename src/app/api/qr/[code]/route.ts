import { NextRequest, NextResponse } from 'next/server'
import { generateCheckInQRCode, generateRegistrationQRCode, isValidQRCodeData, type StyledQRCodeOptions } from '@/lib/qr/generate'
import { logger } from '@/lib/logger';

/**
 * GET /api/qr/[code]
 * Generate and serve QR code image
 *
 * Query parameters:
 * - format: 'png' | 'svg' | 'dataurl' (default: 'png')
 * - style: 'simple' | 'styled' (default: 'simple')
 * - size: number (default: 300)
 * - title: string (for styled QR codes)
 * - subtitle: string (for styled QR codes)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
): Promise<NextResponse> {
  const { code } = await params

  if (!code) {
    return NextResponse.json({ error: 'QR code data is required' }, { status: 400 })
  }

  // Validate QR code data
  if (!isValidQRCodeData(code)) {
    return NextResponse.json({ error: 'Invalid QR code format' }, { status: 400 })
  }

  try {
    const searchParams = request.nextUrl.searchParams
    const format = searchParams.get('format') || 'png'
    const style = searchParams.get('style') || 'simple'
    const size = parseInt(searchParams.get('size') || '300', 10)
    const title = searchParams.get('title') || ''
    const subtitle = searchParams.get('subtitle') || ''

    // Generate QR code based on format and style
    if (format === 'svg' || style === 'styled') {
      const { generateStyledQRCodeSVG } = await import('@/lib/qr/generate')
      const svgData = await generateStyledQRCodeSVG(code, {
        title,
        subtitle,
        width: size,
        showText: !!title || !!subtitle,
      } as StyledQRCodeOptions)

      // Return SVG as image
      return new NextResponse(svgData.split(',')[1], {
        headers: {
          'Content-Type': 'image/svg+xml',
          'Cache-Control': 'public, max-age=31536000, immutable', // 1 year cache
        },
      })
    }

    if (format === 'dataurl') {
      const { generateQRCodeDataURL } = await import('@/lib/qr/generate')
      const dataURL = await generateQRCodeDataURL(code, {
        width: size,
      })

      return NextResponse.json({ dataURL })
    }

    // Default: Return PNG
    const buffer = await generateCheckInQRCode(code, { width: size })

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=31536000, immutable', // 1 year cache
        'Content-Disposition': `inline; filename="qr-${code.substring(0, 8)}.png"`,
      },
    })
  } catch (error) {
    logger.error('[QR API] Failed to generate QR code:', error)
    return NextResponse.json(
      { error: 'Failed to generate QR code' },
      { status: 500 }
    )
  }
}

/**
 * OPTIONS handler for CORS
 */
export async function OPTIONS(): Promise<NextResponse> {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
