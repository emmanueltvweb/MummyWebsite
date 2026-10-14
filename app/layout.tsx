import type React from "react"
import type { Metadata } from "next"
import Script from "next/script"
import { Geist, Geist_Mono } from "next/font/google"

import "./globals.css"
import { SiteContentProvider } from "@/components/content/site-content-provider"
import { Preloader } from "@/components/preloader"
import { PublicOnly } from "@/components/public-only"
import SplashCursor from "@/components/SplashCursor"
import { settings } from "@/lib/cms/store"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

const DEFAULT_ICONS: Metadata["icons"] = {
  icon: [
    { url: "/android-chrome-192x192.png", media: "(prefers-color-scheme: light)" },
    { url: "/android-chrome-512x512.png", media: "(prefers-color-scheme: dark)" },
    { url: "/icon.svg", type: "image/svg+xml" },
  ],
  apple: "/apple-touch-icon.png",
}

/** Site-wide SEO is driven by Admin → Settings (falls back to the original defaults). */
export async function generateMetadata(): Promise<Metadata> {
  const site = await settings.get()
  const { seo } = site
  return {
    metadataBase: process.env.NEXT_PUBLIC_SITE_URL ? new URL(process.env.NEXT_PUBLIC_SITE_URL) : undefined,
    title: { default: seo.defaultTitle, template: seo.titleTemplate || "%s" },
    description: seo.defaultDescription,
    keywords: seo.keywords.length ? seo.keywords : undefined,
    generator: "",
    robots: seo.allowIndexing ? undefined : { index: false, follow: false },
    icons: site.faviconUrl ? { icon: site.faviconUrl, apple: site.faviconUrl } : DEFAULT_ICONS,
    openGraph: {
      siteName: site.siteName,
      title: seo.defaultTitle,
      description: seo.defaultDescription,
      images: seo.ogImage ? [{ url: seo.ogImage }] : undefined,
      type: "website",
    },
    twitter: {
      card: seo.ogImage ? "summary_large_image" : "summary",
      site: seo.twitterHandle || undefined,
    },
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const { seo } = await settings.get()
  const gaId = seo.googleAnalyticsId

  return (
    <html lang="en">
      <body className={`font-sans antialiased`}>
        {/* Without JavaScript, scroll-reveal content must still be visible. */}
        <noscript>
          <style>{".reveal-pending{opacity:1!important}"}</style>
        </noscript>
        <SiteContentProvider>
          <PublicOnly>
            <Preloader />
            <SplashCursor />
          </PublicOnly>
          {children}
        </SiteContentProvider>
        {gaId && (
          <>
            <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="afterInteractive" />
            <Script id="ga-init" strategy="afterInteractive">
              {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${gaId}');`}
            </Script>
          </>
        )}
      </body>
    </html>
  )
}
