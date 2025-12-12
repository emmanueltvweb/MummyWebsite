"use client"

import { PillNav } from './pill-nav'

export function Header() {
  const navItems = [
    { label: "Home", href: "/" },
    { 
      label: "About", 
      href: "/about",
      dropdownItems: [
        { label: "Pst. Evelyn Joshua", href: "/components/sections/about-pst-evelyn-joshua.tsx" },
        { label: "TB Joshua", href: "/components/sections/about-tb-joshua.tsx" },
        { label: "Emmanuel TV", href: "/components/sections/about-emmanuel-tv.tsx" },
        { label: "The SCOAN", href: "/components/sections/about-scoan.tsx" },
      ]
    },
    { label: "Crusade/Outreach", href: "/gallery" },
    { label: "Sermon", href: "/Sermon" },
    { label: "Visit", href: "#"},
  ]

  return (
    <PillNav
      items={navItems}
      className=""
      ease="power3.easeOut"
      baseColor="#ffffff"
      pillColor="#060010"
      hoveredPillTextColor="#060010"
      pillTextColor="#ffffff"
      initialLoadAnimation={true}
    />
  )
}
