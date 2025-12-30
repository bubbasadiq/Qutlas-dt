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

interface CustomizeAddModalProps {
  open: boolean;
  onClose: () => void;
  part: CatalogPart;
}

export function CustomizeAddModal({
  open,
  onClose,
  part,
}: CustomizeAddModalProps) {
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [selectedMaterial, setSelectedMaterial] = useState(part.material);
  const [selectedProcess, setSelectedProcess] = useState(
    part.process || 'Standard',
  );
  const [selectedFinish, setSelectedFinish] = useState(
    part.finish || part.finishes?.[0] || 'Raw',
  );
  const [notes, setNotes] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  // Material options (including the default + optional variants)
  const materialOptions = part.materials
    ? part.materials.map((m) => m.name)
    : [part.material];

  // Process options (from part or defaults)
  const processOptions = [
    part.process || 'Standard',
    'CNC Milling',
    'Laser Cutting',
    'Sheet Metal',
    'Welding',
    'Casting',
  ].filter((v, i, a) => a.indexOf(v) === i); // unique

  // Finish options
  const finishOptions =
    part.finishes ||
    [
      part.finish || 'Raw',
      'Powder Coat',
      'Anodize',
      'Paint',
      'Polished',
      'Brushed',
      'Galvanized',
    ].filter((v, i, a) => a.indexOf(v) === i); // unique

  if (!open) return null;

  // Calculate price with material multiplier
  const materialMultiplier =
    part.materials?.find((m) => m.name === selectedMaterial)?.priceMultiplier ||
    1;
  const unitPrice = part.basePrice * materialMultiplier;
  const subtotal = unitPrice * quantity;
  const totalPrice = subtotal;

  const handleAddToWorkspace = () => {
    setIsAdding(true);
    try {
      const workspaceData = {
        type: 'catalog-part',
        partId: part.id,
        name: part.name,
        category: part.category,
        material: selectedMaterial,
        process: selectedProcess,
        finish: selectedFinish,
        quantity,
        basePrice: part.basePrice,
        unitPrice,
        totalPrice,
        specs: part.specs,
        notes: notes.trim() || undefined,
      };

      localStorage.setItem(
        `workspace-import-${Date.now()}`,
        JSON.stringify(workspaceData),
      );
      toast.success(`Added customized ${quantity}x ${part.name} to workspace`);
      onClose();
      router.push(`/studio?import=${part.id}`);
    } catch (_error) {
      toast.error('Failed to add part to workspace');
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4">
      <div className="my-8 w-full max-w-2xl rounded-2xl bg-white shadow-xl">
        <div className="border-b border-[var(--neutral-200)] p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-[var(--neutral-900)]">
              Customize & Add to Workspace
            </h2>
            <button
              onClick={onClose}
              className="text-[var(--neutral-400)] hover:text-[var(--neutral-600)]"
            >
              <Icon name="x" size={20} />
            </button>
          </div>
        </div>

        <div className="max-h-[70vh] space-y-6 overflow-y-auto p-6">
          <div>
            <h3 className="font-medium text-[var(--neutral-900)]">
              {part.name}
            </h3>
            <p className="mt-1 text-sm text-[var(--neutral-500)]">
              {part.description}
            </p>
            {part.unlocksText && (
              <p className="mt-2 text-xs text-[var(--accent-700)]">
                <strong>Unlocks:</strong> {part.unlocksText}
              </p>
            )}
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
                className="h-10 w-24 text-center"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setQuantity(quantity + 1)}
                className="h-10 w-10 bg-transparent p-0"
              >
                +
              </Button>
              <span className="text-sm text-[var(--neutral-500)]">
                {quantity >= 10 && '(Volume discount applied)'}
              </span>
            </div>
          </div>

          <div>
            <Label className="mb-3 block text-sm font-medium text-[var(--neutral-700)]">
              Material
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {materialOptions.map((material) => {
                const matData = part.materials?.find(
                  (m) => m.name === material,
                );
                return (
                  <button
                    key={material}
                    onClick={() => setSelectedMaterial(material)}
                    className={`rounded-lg border p-3 text-left transition-colors ${
                      selectedMaterial === material
                        ? 'border-[var(--primary-500)] bg-[var(--primary-50)]'
                        : 'border-[var(--neutral-200)] hover:border-[var(--neutral-300)]'
                    }`}
                  >
                    <p className="text-sm font-medium text-[var(--neutral-900)]">
                      {material}
                    </p>
                    {matData && matData.priceMultiplier !== 1 && (
                      <p className="text-xs text-[var(--neutral-500)]">
                        {matData.priceMultiplier > 1 ? '+' : ''}
                        {((matData.priceMultiplier - 1) * 100).toFixed(0)}%
                        price
                      </p>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <Label className="mb-3 block text-sm font-medium text-[var(--neutral-700)]">
              Process
            </Label>
            <div className="grid grid-cols-3 gap-2">
              {processOptions.slice(0, 6).map((process) => (
                <button
                  key={process}
                  onClick={() => setSelectedProcess(process)}
                  className={`rounded-lg border p-3 text-center text-sm transition-colors ${
                    selectedProcess === process
                      ? 'border-[var(--primary-500)] bg-[var(--primary-50)]'
                      : 'border-[var(--neutral-200)] hover:border-[var(--neutral-300)]'
                  }`}
                >
                  {process}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label className="mb-3 block text-sm font-medium text-[var(--neutral-700)]">
              Finish
            </Label>
            <div className="grid max-h-48 grid-cols-3 gap-2 overflow-y-auto">
              {finishOptions.map((finish) => (
                <button
                  key={finish}
                  onClick={() => setSelectedFinish(finish)}
                  className={`rounded-lg border p-3 text-center text-sm transition-colors ${
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

          {part.specs && (
            <div>
              <Label className="mb-3 block text-sm font-medium text-[var(--neutral-700)]">
                Specifications
              </Label>
              <div className="grid grid-cols-2 gap-3 rounded-lg bg-[var(--bg-50)] p-4">
                {Object.entries(part.specs).map(([key, value]) => (
                  <div key={key}>
                    <p className="text-xs text-[var(--neutral-500)] capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </p>
                    <p className="text-sm font-medium text-[var(--neutral-900)]">
                      {value}
                      {typeof value === 'number' ? 'mm' : ''}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <Label className="mb-3 block text-sm font-medium text-[var(--neutral-700)]">
              Custom Requirements (Optional)
            </Label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any custom requirements or modifications..."
              className="h-24 w-full resize-none rounded-lg border border-[var(--neutral-200)] p-3 text-sm focus:ring-2 focus:ring-[var(--primary-500)] focus:outline-none"
            />
          </div>

          <div className="space-y-2 rounded-xl bg-[var(--bg-50)] p-4">
            <div className="flex justify-between text-sm">
              <span className="text-[var(--neutral-600)]">Base Price</span>
              <PriceDisplay amount={part.basePrice} variant="compact" />
            </div>
            {materialMultiplier !== 1 && (
              <div className="flex justify-between text-sm">
                <span className="text-[var(--neutral-600)]">
                  Material Adjustment
                </span>
                <span className="text-sm">
                  ×{materialMultiplier.toFixed(2)}
                </span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-[var(--neutral-600)]">Unit Price</span>
              <PriceDisplay amount={unitPrice} variant="compact" />
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--neutral-600)]">Quantity</span>
              <span className="font-medium">{quantity}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--neutral-600)]">Subtotal</span>
              <PriceDisplay amount={subtotal} variant="compact" />
            </div>
            <div className="mt-2 flex justify-between border-t border-[var(--neutral-200)] pt-2">
              <span className="font-medium text-[var(--neutral-900)]">
                Total
              </span>
              <PriceDisplay amount={totalPrice} variant="default" />
            </div>
            <div className="flex justify-between text-xs text-[var(--neutral-500)]">
              <span>Lead Time</span>
              <span>{part.leadTime || '3-5 days'}</span>
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
