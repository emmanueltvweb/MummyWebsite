"use client"

import { useState } from "react"
import { GalleryFilter } from "@/components/sections/gallery-filter"
import { GalleryGrid } from "@/components/sections/gallery-grid"
import { CategoryDescriptions } from "@/components/sections/gallery-descriptions"

interface GalleryItem {
  id: number
  title: string
  image: string
  type: "image" | "video"
  rotation?: number
  scale?: number
  zIndex?: number
}

const galleryData: Record<string, GalleryItem[]> = {
  "SCOAN HQ": [
    {
      id: 1,
      title: "SCOAN Headquarters Service",
      image: "/mum1.jpg",
      type: "image",
      rotation: -8,
      scale: 0.85,
      zIndex: 1,
    },
    {
      id: 2,
      title: "Sunday Service",
      image: "/mummy.jpg",
      type: "image",
      rotation: -4,
      scale: 0.9,
      zIndex: 2,
    },
    {
      id: 3,
      title: "Prayer Session",
      image: "/Evelyn-Joshua3.jpg",
      type: "image",
      rotation: 0,
      scale: 1,
      zIndex: 30,
    },
  ],
  "Ghana": [
    {
      id: 4,
      title: "Ghana Crusade",
      image: "/mum2.jpg",
      type: "image",
      rotation: 4,
      scale: 0.9,
      zIndex: 3,
    },
    {
      id: 5,
      title: "Accra Outreach",
      image: "/mum3.jpg",
      type: "image",
      rotation: 8,
      scale: 0.85,
      zIndex: 30,
    },
    {
      id: 6,
      title: "Kumasi Ministry",
      image: "/mum4.jpg",
      type: "image",
      rotation: 8,
      scale: 0.85,
      zIndex: 1,
    },
  ],
  "Kenya": [
    {
      id: 7,
      title: "Nairobi Crusade",
      image: "/mum1.jpg",
      type: "image",
      rotation: -6,
      scale: 0.88,
      zIndex: 2,
    },
    {
      id: 8,
      title: "Mombasa Outreach",
      image: "/mummy.jpg",
      type: "image",
      rotation: 2,
      scale: 0.92,
      zIndex: 1,
    },
    {
      id: 9,
      title: "Eldoret Ministry",
      image: "/Evelyn-Joshua3.jpg",
      type: "image",
      rotation: 0,
      scale: 1,
      zIndex: 30,
    },
  ],
  "Lagos": [
    {
      id: 10,
      title: "Lagos Crusade",
      image: "/mum2.jpg",
      type: "image",
      rotation: -4,
      scale: 0.9,
      zIndex: 3,
    },
    {
      id: 11,
      title: "Victoria Island Service",
      image: "/mum3.jpg",
      type: "image",
      rotation: 6,
      scale: 0.87,
      zIndex: 1,
    },
    {
      id: 12,
      title: "Ikeja Outreach",
      image: "/mum4.jpg",
      type: "image",
      rotation: 0,
      scale: 1,
      zIndex: 30,
    },
  ],
  "Colombia": [
    {
      id: 13,
      title: "Bogotá Crusade",
      image: "/mum1.jpg",
      type: "image",
      rotation: -8,
      scale: 0.85,
      zIndex: 1,
    },
    {
      id: 14,
      title: "Medellín Ministry",
      image: "/mummy.jpg",
      type: "image",
      rotation: 4,
      scale: 0.9,
      zIndex: 2,
    },
    {
      id: 15,
      title: "Cali Outreach",
      image: "/Evelyn-Joshua3.jpg",
      type: "image",
      rotation: 0,
      scale: 1,
      zIndex: 30,
    },
  ],
  "Indonesia": [
    {
      id: 16,
      title: "Jakarta Crusade",
      image: "/mum2.jpg",
      type: "image",
      rotation: -2,
      scale: 0.89,
      zIndex: 3,
    },
    {
      id: 17,
      title: "Bali Ministry",
      image: "/mum3.jpg",
      type: "image",
      rotation: 8,
      scale: 0.85,
      zIndex: 1,
    },
    {
      id: 18,
      title: "Surabaya Outreach",
      image: "/mum4.jpg",
      type: "image",
      rotation: 0,
      scale: 1,
      zIndex: 30,
    },
  ],
  "Ecuador": [
    {
      id: 19,
      title: "Quito Crusade",
      image: "/mum1.jpg",
      type: "image",
      rotation: -6,
      scale: 0.88,
      zIndex: 2,
    },
    {
      id: 20,
      title: "Guayaquil Ministry",
      image: "/mummy.jpg",
      type: "image",
      rotation: 6,
      scale: 0.87,
      zIndex: 1,
    },
    {
      id: 21,
      title: "Cuenca Outreach",
      image: "/Evelyn-Joshua3.jpg",
      type: "image",
      rotation: 0,
      scale: 1,
      zIndex: 30,
    },
  ],
  "South Africa":[
    {
      id: 34,
      title: "Cape Town Crusade",
      image: "/mum1.jpg",
      type: "image",
      rotation: -6,
      scale: 0.88,
      zIndex: 2,
    },
    {
      id: 35,
      title: "Johannesburg Ministry",
      image: "/mummy.jpg",
      type: "image",
      rotation: 6,
      scale: 0.87,
      zIndex: 1,
    },
    {
      id: 36,
      title: "Durban Outreach",
      image: "/Evelyn-Joshua3.jpg",
      type: "image",
      rotation: 0,
      scale: 1,
      zIndex: 30,
    }
  ],
  "Argentina": [
    {
      id: 22,
      title: "Buenos Aires Crusade",
      image: "/mum2.jpg",
      type: "image",
      rotation: -4,
      scale: 0.9,
      zIndex: 3,
    },
    {
      id: 23,
      title: "Rosario Ministry",
      image: "/mum3.jpg",
      type: "image",
      rotation: 8,
      scale: 0.85,
      zIndex: 1,
    },
    {
      id: 24,
      title: "Cordoba Outreach",
      image: "/Evelyn-Joshua3.jpg",
      type: "image",
      rotation: 0,
      scale: 1,
      zIndex: 30,
    },
  ],
  "Spain": [
    {
      id: 25,
      title: "Madrid Crusade",
      image: "/mum1.jpg",
      type: "image",
      rotation: -6,
      scale: 0.88,
      zIndex: 2,
    },
    {
      id: 26,
      title: "Barcelona Ministry",
      image: "/mummy.jpg",
      type: "image",
      rotation: 6,
      scale: 0.87,
      zIndex: 1,
    },
    {
      id: 27,
      title: "Valencia Outreach",
      image: "/Evelyn-Joshua3.jpg",
      type: "image",
      rotation: 0,
      scale: 1,
      zIndex: 30,
    },
  ],
  "Dominican Republic": [
    {
      id: 28,
      title: "Santo Domingo Crusade",
      image: "/mum2.jpg",
      type: "image",
      rotation: -4,
      scale: 0.9,
      zIndex: 3,
    },
    {
      id: 29,
      title: "La Union Ministry",
      image: "/mum3.jpg",
      type: "image",
      rotation: 8,
      scale: 0.85,
      zIndex: 1,
    },
    {
      id: 30,
      title: "Cartagena Outreach",
      image: "/Evelyn-Joshua3.jpg",
      type: "image",
      rotation: 0,
      scale: 1,
      zIndex: 30,
    },
  ],
  "Israel": [
    {
      id: 31,
      title: "Jerusalem Ministry",
      image: "/mum1.jpg",
      type: "image",
      rotation: -6,
      scale: 0.88,
      zIndex: 2,
    },
    {
      id: 32,
      title: "Tel Aviv Outreach",
      image: "/mummy.jpg",
      type: "image",
      rotation: 6,
      scale: 0.87,
      zIndex: 1,
    },
    {
      id: 33,
      title: "Haifa Service",
      image: "/Evelyn-Joshua3.jpg",
      type: "image",
      rotation: 0,
      scale: 1,
      zIndex: 30,
    },
  ],
}

export function GalleryContent() {
  const [activeCategory, setActiveCategory] = useState("SCOAN HQ")

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <GalleryFilter activeCategory={activeCategory} onCategoryChange={setActiveCategory} />
      <GalleryGrid galleryItems={galleryData[activeCategory] || []} />
      <CategoryDescriptions activeCategory={activeCategory} />
    </div>
  )
}