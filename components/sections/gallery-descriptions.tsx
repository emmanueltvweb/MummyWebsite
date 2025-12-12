"use client"

import Link from "next/link"
import { ExternalLink } from "lucide-react"

interface CategoryDescription {
  title: string
  description: string
  readMoreUrl: string
}

const categoryDescriptions: Record<string, CategoryDescription> = {
  "SCOAN HQ": {
    title: "SCOAN Headquarters",
    description: "The Synagogue, Church Of All Nations (SCOAN) headquarters in Lagos, Nigeria, serves as the spiritual epicenter of our global ministry. Here, thousands gather weekly to experience powerful worship, healing, and deliverance services that transform lives.",
    readMoreUrl: "https://www.scoan.org/about-us"
  },
  "Ghana": {
    title: "Ghana Ministry",
    description: "Our Ghana ministry extends the healing and deliverance mission across West Africa. Through crusades and outreach programs, we bring hope to communities, offering spiritual guidance and practical support to those in need.",
    readMoreUrl: "https://www.scoan.org/scoan-ghana-charity-2024/"
  },
  "Kenya": {
    title: "Kenya Outreach",
    description: "In Kenya, our ministry focuses on community development and spiritual empowerment. From Nairobi to rural villages, we conduct healing services, educational programs, and humanitarian initiatives that impact thousands.",
    readMoreUrl: "https://www.scoan.org/kenya-outreach"
  },
  "Lagos": {
    title: "Lagos Crusades",
    description: "Lagos, Nigeria's commercial capital, hosts some of our largest crusades. These massive gatherings bring together people from all walks of life seeking healing, deliverance, and spiritual renewal in the power of God.",
    readMoreUrl: "https://www.scoan.org/lagos-crusades"
  },
  "Colombia": {
    title: "Colombian Mission",
    description: "Our Colombian ministry brings the message of hope and healing to South America. Through strategic partnerships and community engagement, we reach diverse populations with the transformative power of the Gospel.",
    readMoreUrl: "https://www.scoan.org/colombia-mission"
  },
  "Indonesia": {
    title: "Indonesian Outreach",
    description: "Spanning thousands of islands, our Indonesian ministry reaches diverse communities with healing and deliverance. We conduct crusades in major cities and remote areas, bringing spiritual renewal to this vast nation.",
    readMoreUrl: "https://www.scoan.org/indonesia-outreach"
  },
  "Ecuador": {
    title: "Ecuadorian Ministry",
    description: "In Ecuador, our ministry focuses on both spiritual and practical needs. From Quito to coastal cities, we conduct healing services while supporting community development projects that improve quality of life.",
    readMoreUrl: "https://www.scoan.org/ecuador-ministry"
  },
  "South Africa": {
    title: "South African Revival",
    description: "In South Africa, our ministry focuses on community development, healing, and deliverance. Through various programs and initiatives, we reach marginalized communities, offering spiritual guidance and practical support to those in need.",
    readMoreUrl: "https://www.scoan.org/gods-love-at-the-holy-spirit-visitation-in-south-africa/"
  },
  "Argentina": {
    title: "Argentinian Crusade",
    description: "In Argentina, our ministry focuses on community development, healing, and deliverance. Through various programs and initiatives, we reach marginalized communities, offering spiritual guidance and practical support to those in need.",
    readMoreUrl: "https://www.scoan.org/argentina-crusade-day-1-the-rain-of-the-holy-spirit/"
  },
  "Spain": {
    title: "Spanish Crusade",
    description: "In Spain, our ministry focuses on community development, healing, and deliverance. Through various programs and initiatives, we reach marginalized communities, offering spiritual guidance and practical support to those in need.",
    readMoreUrl: "https://www.scoan.org/the-crusade-in-spain-day-1believe-jesus-christ-redeem-time/"
  },
  "Dominican Republic": {
    title: "Dominican Mission",
    description: "In the Dominican Republic, our ministry focuses on community development, healing, and deliverance. Through various programs and initiatives, we reach marginalized communities, offering spiritual guidance and practical support to those in need.",
    readMoreUrl: "https://www.scoan.org/dominican-republic-mission"
  },
  "Israel": {
    title: "Israel Mission",
    description: "In Israel, our ministry focuses on community development, healing, and deliverance. Through various programs and initiatives, we reach marginalized communities, offering spiritual guidance and practical support to those in need.",
    readMoreUrl: "https://www.scoan.org/israel-mission"
  },
  
}

interface CategoryDescriptionsProps {
  activeCategory: string
}

export function CategoryDescriptions({ activeCategory }: CategoryDescriptionsProps) {
  const category = categoryDescriptions[activeCategory]
  
  if (!category) return null

  return (
    <div className="mb-12 sm:mb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-card rounded-2xl p-6 sm:p-8 shadow-lg border border-border/50">
          <h3 className="text-2xl sm:text-3xl font-bold text-primary mb-4">
            {category.title}
          </h3>
          
          <div className="space-y-4">
            {category.description.split('. ').map((sentence, index) => (
              <p key={index} className="text-foreground/80 leading-relaxed text-base sm:text-lg">
                {sentence}{index < category.description.split('. ').length - 1 ? '.' : ''}
              </p>
            ))}
          </div>
          
          <div className="mt-6 sm:mt-8">
            <Link
              href={category.readMoreUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-accent text-blue  px-6 py-3 rounded-full font-medium transition-all duration-300 hover:bg-primary/90 hover:shadow-lg hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              Read More
              <ExternalLink size={16} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}