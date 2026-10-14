"use client"

import { Facebook, Instagram, Youtube, Mail } from "lucide-react"
import Link from "next/link"

import { useSiteContent } from "@/components/content/site-content-provider"

export function Footer() {
  const { content } = useSiteContent()
  const { branding, footer } = content
  const currentYear = new Date().getFullYear()

  const socialIcons = [
    { icon: Facebook, label: "Facebook", href: footer.socialLinks.facebook },
    { icon: Instagram, label: "Instagram", href: footer.socialLinks.instagram },
    { icon: Youtube, label: "YouTube", href: footer.socialLinks.youtube },
    { icon: Mail, label: "Email", href: footer.socialLinks.email },
  ]

  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-accent to-accent/70 rounded-full flex items-center justify-center shadow-sm">
                <span className="text-primary-foreground font-bold text-sm">{branding.brandInitial}</span>
              </div>
              <span className="font-bold text-primary-foreground text-lg">{branding.brandName}</span>
            </Link>
            <p className="text-primary-foreground/70 text-sm">{footer.tagline}</p>
          </div>

          <div>
            <h3 className="font-semibold mb-4 text-accent">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              {footer.quickLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-primary-foreground/70 hover:text-accent transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4 text-accent">Contact</h3>
            <ul className="space-y-2 text-sm text-primary-foreground/70">
              <li>Email: {footer.email}</li>
              <li>Phone: {footer.phone}</li>
              <li>{footer.address}</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4 text-accent">Follow Us</h3>
            <div className="flex gap-4">
              {socialIcons.map(({ icon: Icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  target={href.startsWith("http") ? "_blank" : undefined}
                  rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
                  className="w-10 h-10 bg-primary-foreground/10 rounded-lg flex items-center justify-center hover:bg-accent hover:text-primary transition-all duration-300"
                  aria-label={label}
                >
                  <Icon size={20} />
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-primary-foreground/10 pt-8">
          <p className="text-center text-primary-foreground/60 text-sm">
            &copy; {currentYear} {footer.copyright}
          </p>
        </div>
      </div>
    </footer>
  )
}
