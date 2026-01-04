"use client"

import type React from "react"
import { Card } from "./card"
import { Button } from "./button"
import { Icon } from "./icon"
import { cn } from "@/lib/utils"

export interface CatalogCardProps {
  id: string
  title: string
  description?: string
  priceRange: string
  secondaryPrice?: string
  material?: string
  category?: string
  thumbnailUrl: string
  inStock?: boolean
  onPreview: (id: string) => void
  onAddToProject: (id: string) => void
}

export const CatalogCard: React.FC<CatalogCardProps> = ({
  id,
  title,
  description,
  priceRange,
  secondaryPrice,
  material,
  category,
  thumbnailUrl,
  inStock = true,
  onPreview,
  onAddToProject,
}) => {
  return (
    <Card variant="elevated" className="group flex flex-col h-full overflow-hidden border border-[var(--neutral-200)] hover:border-[var(--primary-400)] hover:shadow-lg transition-all duration-300">
      {/* Thumbnail Area */}
      <div 
        className="relative aspect-square w-full bg-[var(--bg-100)] overflow-hidden cursor-pointer"
        onClick={() => onPreview(id)}
      >
        <img 
          src={thumbnailUrl || "/placeholder.svg"} 
          alt={title} 
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
        />
        {inStock && (
          <div className="absolute top-3 right-3">
            <span className="inline-flex items-center rounded-full bg-white/90 backdrop-blur-sm px-2.5 py-1 text-[11px] font-bold text-[var(--success-700)] shadow-sm border border-[var(--success-100)]">
              In Stock
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        {/* Title */}
        <h4 
          className="font-semibold text-[15px] leading-tight text-[var(--neutral-900)] mb-1 cursor-pointer hover:text-[var(--primary-700)] transition-colors"
          onClick={() => onPreview(id)}
        >
          {title}
        </h4>
        
        {/* Metadata */}
        <div className="flex items-center gap-1.5 text-[12px] text-[var(--neutral-500)] font-medium mb-3">
          {material && <span>{material}</span>}
          {material && category && <span className="text-[var(--neutral-300)]">•</span>}
          {category && <span>{category}</span>}
        </div>

        {description && (
          <p className="text-[13px] text-[var(--neutral-500)] line-clamp-2 mb-4 leading-relaxed">
            {description}
          </p>
        )}

        <div className="mt-auto pt-3 border-t border-[var(--neutral-100)]">
          {/* Prices */}
          <div className="mb-3 flex flex-col">
            <span className="text-lg font-bold text-[var(--neutral-900)]">
              {priceRange}
            </span>
            {secondaryPrice && (
              <span className="text-[12px] font-medium text-[var(--neutral-500)]">
                {secondaryPrice}
              </span>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1 border-[var(--neutral-200)] text-[var(--neutral-700)] hover:bg-[var(--neutral-50)]" 
              onClick={() => onPreview(id)}
            >
              Preview
            </Button>
            <Button 
              variant="primary" 
              size="sm" 
              className="flex-1 bg-[var(--primary-700)] hover:bg-[var(--primary-800)]" 
              onClick={() => onAddToProject(id)}
            >
              Add
            </Button>
          </div>
        </div>
      </div>
    </Card>
  )
}
