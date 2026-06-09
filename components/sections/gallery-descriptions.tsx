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
    readMoreUrl: "https://www.scoan.org/scoan-sunday-service-october-26-2025-the-true-solution/"
  },
  "Ghana": {
    title: "Ghana Charity and Revival Meeting",
    description: "On Monday February 12, 2024, following the successful and testimony-filled Revival in Ghana, Pastor Evelyn Joshua and the Emmanuel TV Team set out on a charity journey with the gospel of love to the heart of the Greater Accra region in the Doryumu community – a traditional settlement in need of basic amenities.",
    readMoreUrl: "https://www.scoan.org/scoan-ghana-charity-2024/"
  },
  "Kenya": {
    title: "Kenya Crusade and Charity",
    description: "In James 2:15-16, the following observation is made, “If a brother or sister is naked and destitute of daily food, and one of you says to them, ‘Depart in peace, be warmed and filled,’ but you do not give them the things which are needed for the body, what does it profit?” James, a servant of God and of the Lord Jesus Christ, then declares without mincing words in verse 17: “Thus also faith by itself, if it does not have works, is dead.”",
    readMoreUrl: "https://www.scoan.org/charity-in-masai-country-kenya/"
  },
  "Lagos": {
    title: "Lagos Charity",
    description: "Lagos, Nigeria's commercial capital, hosts some of our largest charity events. These massive gatherings bring together people from all walks of life seeking healing, deliverance, and spiritual renewal in the power of God.",
    readMoreUrl: "https://www.scoan.org/lagos-charity"
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
    title: "South Africa Revival and Charity",
    description: "On Friday, May 16, 2025, the city of Johannesburg witnessed an uncommon event. Tagged ‘The Holy Spirit Visitation In South Africa With Pastor Evelyn Joshua’, the  event took place at the Expo Centre, a sprawling facility in the city’s Nasrec area. As early as the wee hours of the morning, tens of thousands had thronged the venue, hoping to keep a date with destiny. With faith in their hearts and trust in the finished work of Jesus Christ, they had come seeking the salvation of their souls.",
    readMoreUrl: "https://www.scoan.org/gods-love-at-the-holy-spirit-visitation-in-south-africa/"
  },
  "Argentina": {
    title: "Argentina Crusade and Charity",
    description: "On October 11-12, 2024, a momentous event happened in the Argentinian city of Resistencia, Chaco Province. For those two days, under the guidance of the Holy Spirit, Pastor Evelyn Joshua held a crusade in the Auditorio Portal del Cielo where the rain of the Holy Ghost fell on all. It was a most blessed day indeed, as thousands with solid faith in their hearts trooped in from different parts of South America and the rest of the world. ",
    readMoreUrl: "https://www.scoan.org/argentina-crusade-day-1-the-rain-of-the-holy-spirit/"
  },
  "Spain": {
    title: "Spain Crusade",
    description: "Friday, April 28, 2023 was a day like no other in the history of the sport arena Pabellón Fernando Martín, located in Madrid, Spain. It was the day that the venue hosted thousands of visitors from all over the world who were looking to get a unique experience of God’s raw power. The event was The Crusade In Spain With Pastor Evelyn Joshua – a two-day end-of-week ministration in the power of the Holy Spirit.   ",
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