import type { Metadata } from "next"
import "./globals.css"
import { createClientForComponent } from "@/lib/auth/config"
import { PublicHeader } from "@/components/layout/public-header"
import { DashboardHeader } from "@/components/layout/dashboard-header"
import { Toaster } from "@/components/ui/toaster"
import { ThemeProvider } from "@/components/providers/theme-provider"
import { PwaProvider } from "@/components/pwa/pwa-provider"
import { PwaInstallPrompt } from "@/components/pwa/pwa-install-prompt"
import { validateEnv } from "@/lib/env"

// Validate environment variables on startup
if (typeof window === 'undefined') {
  const { valid, errors } = validateEnv();
  if (!valid && process.env.NODE_ENV === 'production') {
    console.error('❌ Environment validation failed. Cannot start application.');
    errors.forEach(err => console.error(`  - ${err}`));
    process.exit(1);
  }
}

export const metadata: Metadata = {
  title: "Fstivo - Revolutionizing Youth Event Management",
  description: "Empowering the next generation through seamless event coordination, volunteer engagement, and community impact.",
  keywords: ["event management", "youth events", "volunteer management", "Pakistan", "Fstivo"],
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/brand/fstivo-icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/brand/fstivo-icon-256.png", sizes: "256x256", type: "image/png" },
      { url: "/brand/fstivo-icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/brand/fstivo-icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/brand/fstivo-icon-256.png", sizes: "256x256", type: "image/png" },
    ],
  },
  openGraph: {
    title: "Fstivo - Revolutionizing Youth Event Management",
    description: "Empowering the next generation through seamless event coordination, volunteer engagement, and community impact.",
    type: "website",
    url: "https://fstivo.com",
    siteName: "Fstivo",
    images: [
      {
        url: "/brand/fstivo-icon-512.png",
        width: 512,
        height: 512,
        alt: "Fstivo Logo",
        type: "image/png",
      },
      {
        url: "/brand/fstivo-wordmark-512.png",
        width: 512,
        height: 150,
        alt: "Fstivo Wordmark",
        type: "image/png",
      },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "FSTIVO"
  },
}

export const viewport = {
  width: "device-width" as const,
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#6366f1",
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const supabase = await createClientForComponent()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <PwaProvider>
            {user ? (
              // Authenticated user experience
              <div className="min-h-screen bg-gray-50">
                <DashboardHeader user={user} />
                <main className="lg:pl-64 min-h-screen">
                  {children}
                </main>
              </div>
            ) : (
              // Public website experience
              <div className="min-h-screen bg-white">
                <PublicHeader />
                <main className="min-h-screen">
                  {children}
                </main>
                {/* PublicFooter is included in individual pages for now */}
              </div>
            )}
            <PwaInstallPrompt />
          </PwaProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
