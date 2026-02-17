'use client'

import React from 'react'
import { Cloudinary } from '@cloudinary/url-gen'
import { auto } from '@cloudinary/url-gen/actions/resize'
import { autoGravity } from '@cloudinary/url-gen/qualifiers/gravity'
import { AdvancedImage } from '@cloudinary/react'

interface CloudinaryImageProps {
  publicId: string
  alt: string
  width?: number
  height?: number
  className?: string
  priority?: boolean
  style?: React.CSSProperties
}

const CloudinaryImage: React.FC<CloudinaryImageProps> = ({ 
  publicId, 
  alt, 
  width = 800, 
  height = 600, 
  className,
  priority = false,
  style
}) => {
  const cld = new Cloudinary({ 
    cloud: { 
      cloudName: 'dvlcc2r5w' 
    } 
  })

  // Create optimized image with auto-format, auto-quality, and responsive sizing
  const img = cld
    .image(publicId)
    .format('auto') // Auto format (webp, avif, etc.)
    .quality('auto') // Auto quality optimization
    .resize(auto().gravity(autoGravity()).width(width).height(height))

  return (
    <AdvancedImage 
      cldImg={img} 
      alt={alt}
      className={className}
      style={style}
      loading={priority ? 'eager' : 'lazy'}
    />
  )
}

export default CloudinaryImage