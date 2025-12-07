"use client"

import type React from "react"
import { Card, CardContent } from "./card"
import { Button } from "./button"
import { Icon } from "./icon"

export interface CatalogCardProps {
  id: string
  title: string
  description?: string
  priceRange: string
  thumbnailUrl: string
  aiScore: number
  onPreview: (id: string) => void
  onAddToProject: (id: string) => void
}

export const CatalogCard: React.FC<CatalogCardProps> = ({
  id,
  title,
  description,
  priceRange,
  thumbnailUrl,
  aiScore,
  onPreview,
  onAddToProject,
}) => {
  return (
    <Card variant="elevated" padding="md" className="flex flex-col h-full">
      {/* Thumbnail */}
      <div className="relative w-full h-40 bg-[var(--bg-200)] rounded-[var(--radius-md)] overflow-hidden mb-4">
        <img src={thumbnailUrl || "/placeholder.svg"} alt={title} className="w-full h-full object-cover" />
        {/* AI Score Badge */}
        <div className="absolute top-2 right-2 bg-[var(--accent-700)] text-white px-2 py-1 rounded-[var(--radius-md)] text-xs font-medium">
          {(aiScore * 100).toFixed(0)}%
        </div>
      </div>

      <CardContent className="pt-0 flex-1">
        <h4 className="font-semibold text-[var(--neutral-900)] mb-1 line-clamp-2">{title}</h4>
        {description && <p className="text-sm text-[var(--neutral-500)] line-clamp-2 mb-3">{description}</p>}

        {/* Price and Stock */}
        <div className="flex justify-between items-center mb-4">
          <span className="text-lg font-semibold text-[var(--primary-700)]">{priceRange}</span>
          <span className="text-xs text-[var(--success)] font-medium flex items-center gap-1">
            <Icon name="icon-quality-check" size="xs" />
            In Stock
          </span>
        </div>
      </CardContent>

      {/* Actions */}
      <div className="flex gap-2 pt-4 border-t border-[var(--neutral-100)]">
        <Button variant="outline" size="sm" className="flex-1 bg-transparent" onClick={() => onPreview(id)}>
          Preview
        </Button>
        <Button variant="primary" size="sm" className="flex-1" onClick={() => onAddToProject(id)}>
          Add
        </Button>
      </div>
    </Card>
  )
}
