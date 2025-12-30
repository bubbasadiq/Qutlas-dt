'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { PriceDisplay } from '@/components/price-display';
import type { CatalogPart } from '@/lib/catalog-data';

interface QuickAddModalProps {
  open: boolean;
  onClose: () => void;
  part: CatalogPart;
}

export function QuickAddModal({ open, onClose, part }: QuickAddModalProps) {
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [selectedFinish, setSelectedFinish] = useState(
    part.finish || part.finishes?.[0] || 'Raw',
  );
  const [isAdding, setIsAdding] = useState(false);

  if (!open) return null;

  const totalPrice = part.basePrice * quantity;

  const handleAddToWorkspace = () => {
    setIsAdding(true);
    try {
      const workspaceData = {
        type: 'catalog-part',
        partId: part.id,
        name: part.name,
        category: part.category,
        material: part.material,
        finish: selectedFinish,
        quantity,
        basePrice: part.basePrice,
        totalPrice,
        specs: part.specs,
      };

      localStorage.setItem(
        `workspace-import-${Date.now()}`,
        JSON.stringify(workspaceData),
      );
      toast.success(`Added ${quantity}x ${part.name} to workspace`);
      onClose();
      router.push(`/studio?import=${part.id}`);
    } catch (_error) {
      toast.error('Failed to add part to workspace');
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
        <div className="border-b border-[var(--neutral-200)] p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-[var(--neutral-900)]">
              Quick Add to Workspace
            </h2>
            <button
              onClick={onClose}
              className="text-[var(--neutral-400)] hover:text-[var(--neutral-600)]"
            >
              <Icon name="x" size={20} />
            </button>
          </div>
        </div>

        <div className="space-y-6 p-6">
          <div>
            <h3 className="font-medium text-[var(--neutral-900)]">
              {part.name}
            </h3>
            <p className="mt-1 text-sm text-[var(--neutral-500)]">
              {part.material} • {part.process || 'Standard Process'}
            </p>
          </div>

          <div>
            <Label className="mb-3 block text-sm font-medium text-[var(--neutral-700)]">
              Quantity
            </Label>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="h-10 w-10 bg-transparent p-0"
              >
                -
              </Button>
              <Input
                type="number"
                value={quantity}
                onChange={(e) =>
                  setQuantity(Math.max(1, Number(e.target.value)))
                }
                className="h-10 w-20 text-center"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setQuantity(quantity + 1)}
                className="h-10 w-10 bg-transparent p-0"
              >
                +
              </Button>
            </div>
          </div>

          <div>
            <Label className="mb-3 block text-sm font-medium text-[var(--neutral-700)]">
              Finish
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {(part.finishes || [part.finish || 'Raw'])
                .slice(0, 6)
                .map((finish) => (
                  <button
                    key={finish}
                    onClick={() => setSelectedFinish(finish)}
                    className={`rounded-lg border p-3 text-left text-sm transition-colors ${
                      selectedFinish === finish
                        ? 'border-[var(--primary-500)] bg-[var(--primary-50)]'
                        : 'border-[var(--neutral-200)] hover:border-[var(--neutral-300)]'
                    }`}
                  >
                    {finish}
                  </button>
                ))}
            </div>
          </div>

          <div className="rounded-xl bg-[var(--bg-50)] p-4">
            <div className="mb-2 flex justify-between text-sm">
              <span className="text-[var(--neutral-600)]">Unit Price</span>
              <PriceDisplay amount={part.basePrice} variant="compact" />
            </div>
            <div className="mb-2 flex justify-between text-sm">
              <span className="text-[var(--neutral-600)]">Quantity</span>
              <span className="font-medium">{quantity}</span>
            </div>
            <div className="mt-2 flex justify-between border-t border-[var(--neutral-200)] pt-2">
              <span className="font-medium text-[var(--neutral-900)]">
                Total
              </span>
              <PriceDisplay amount={totalPrice} variant="default" />
            </div>
          </div>
        </div>

        <div className="flex gap-3 border-t border-[var(--neutral-200)] p-6">
          <Button
            variant="outline"
            className="flex-1 bg-transparent"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            className="flex-1 bg-[var(--accent-500)] text-[var(--neutral-900)] hover:bg-[var(--accent-600)]"
            onClick={handleAddToWorkspace}
            disabled={isAdding}
          >
            {isAdding ? 'Adding...' : 'Add to Workspace'}
          </Button>
        </div>
      </div>
    </div>
  );
}
