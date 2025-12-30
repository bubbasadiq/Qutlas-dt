// app/studio/components/quote-panel.tsx
// Quote and pricing panel component

'use client';

import type React from 'react';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  generateQuote,
  formatPriceNGN,
  type DetailedQuoteResult,
} from '@/lib/quote/estimate';
import { useWorkspace } from '@/hooks/use-workspace';
import { useIsMobile } from '@/hooks/use-media-query';
import { Icon } from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { CheckoutModal } from './checkout-modal';
import { exportQuoteAsPDF, downloadQuoteAsJSON } from '@/lib/quote/pdf-export';
import { FINISHES, type FinishType } from '@/lib/finishes';

const PROCESSES = [
  { id: 'cnc-milling', name: 'CNC Milling', icon: 'settings' },
  { id: 'cnc-turning', name: 'CNC Turning', icon: 'rotate-cw' },
  { id: 'laser-cutting', name: 'Laser Cutting', icon: 'zap' },
  { id: '3d-printing', name: '3D Printing', icon: 'box' },
  { id: 'sheet-metal', name: 'Sheet Metal', icon: 'layers' },
  { id: 'welding', name: 'Welding', icon: 'flame' },
  { id: 'casting', name: 'Casting', icon: 'factory' },
];

export function QuotePanel() {
  const isMobile = useIsMobile();
  const router = useRouter();
  const { getObjectGeometry, selectedObjectId, objects, activeTool } =
    useWorkspace();

  const [quantity, setQuantity] = useState(1);
  const [selectedProcess, setSelectedProcess] = useState('cnc-milling');
  const [selectedFinish, setSelectedFinish] =
    useState<FinishType>('raw-unfinished');
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);

  const quote = useMemo<DetailedQuoteResult | null>(() => {
    if (!selectedObjectId) return null;

    const obj = getObjectGeometry(selectedObjectId);
    if (!obj) return null;

    // For catalog parts, use their stored pricing
    if (obj.type === 'catalog-part' && obj.params?.basePrice) {
      const basePrice = obj.params.basePrice as number;
      const catalogQuantity = (obj.params.quantity as number) || 1;
      const totalQuantity = catalogQuantity * quantity;
      const unitPrice = basePrice;
      const totalPrice = unitPrice * totalQuantity;

      return {
        unitPrice,
        totalPrice,
        manufacturability: {
          score: 95,
          issues: [],
          recommendations: [],
        },
        breakdown: {
          materialCost: unitPrice * 0.4,
          laborCost: unitPrice * 0.3,
          setupCost: unitPrice * 0.1,
          finishingCost: unitPrice * 0.1,
          overheadCost: unitPrice * 0.1,
          totalPrice,
          quantity: totalQuantity,
        },
        leadTime: '3-5 days',
      };
    }

    return generateQuote({
      geometryParams: obj.dimensions,
      objectType: obj.type,
      material: obj.material || 'aluminum-6061',
      process: selectedProcess,
      quantity,
      finish: selectedFinish,
      features: obj.features || [],
    });
  }, [
    selectedObjectId,
    getObjectGeometry,
    quantity,
    selectedProcess,
    selectedFinish,
  ]);

  const breakdown = quote?.breakdown;

  const submitDisabledReason =
    quote && quote.manufacturability.score <= 50
      ? 'Manufacturability score must be above 50'
      : !breakdown || breakdown.totalPrice <= 0
        ? 'Quote not ready'
        : null;

  const workspaceData = useMemo(
    () => ({
      objects,
      selectedObjectId,
      activeTool,
    }),
    [objects, selectedObjectId, activeTool],
  );

  if (!selectedObjectId) {
    return (
      <div className="p-4 text-center text-[var(--neutral-500)]">
        <Icon
          name="shopping-cart"
          className="mx-auto mb-2 h-8 w-8 opacity-50"
        />
        <p>Select an object to get a quote</p>
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="p-4 text-center text-[var(--neutral-500)]">
        <p>Unable to generate quote</p>
      </div>
    );
  }

  return (
    <div className={cn('flex h-full flex-col', isMobile ? '' : '')}>
      {/* Process Selection */}
      <div className="border-b p-3">
        <h3 className="mb-3 text-sm font-semibold tracking-wider text-[var(--neutral-600)] uppercase">
          Manufacturing Process
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {PROCESSES.map((process) => (
            <button
              key={process.id}
              onClick={() => setSelectedProcess(process.id)}
              className={cn(
                'rounded-lg border p-2 text-left transition-colors',
                selectedProcess === process.id
                  ? 'border-[var(--primary-700)] bg-[var(--primary-50)] text-[var(--primary-900)]'
                  : 'border-[var(--neutral-200)] hover:border-[var(--neutral-300)]',
              )}
            >
              <Icon name={process.icon} className="mb-1 h-4 w-4" />
              <span className="block text-xs font-medium">{process.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Quantity */}
      <div className="border-b p-3">
        <Label className="mb-2 block text-xs font-medium text-[var(--neutral-600)]">
          Quantity
        </Label>
        <Input
          type="number"
          value={quantity}
          onChange={(e) =>
            setQuantity(Math.max(1, parseInt(e.target.value) || 1))
          }
          min={1}
          className={isMobile ? 'h-10' : 'h-8'}
        />
        {quantity >= 10 && (
          <p className="mt-1 text-xs text-green-600">
            ✓ Quantity discount applied
          </p>
        )}
      </div>

      {/* Finish Selection */}
      <div className="border-b p-3">
        <Label className="mb-2 block text-xs font-medium text-[var(--neutral-600)]">
          Finish
        </Label>
        <select
          value={selectedFinish}
          onChange={(e) => setSelectedFinish(e.target.value as FinishType)}
          className="w-full rounded-lg border border-[var(--neutral-200)] px-3 py-2 text-sm"
        >
          {FINISHES.map((finish) => (
            <option key={finish.id} value={finish.id}>
              {finish.name}
            </option>
          ))}
        </select>
      </div>

      {/* Price Display */}
      <div className="border-b bg-gradient-to-br from-[var(--primary-50)] to-[var(--accent-50)] p-4">
        <div className="text-center">
          <p className="mb-1 text-sm text-[var(--neutral-600)]">
            Estimated Total
          </p>
          <p className="text-3xl font-bold text-[var(--primary-700)]">
            {formatPriceNGN(breakdown?.totalPrice || 0)}
          </p>
          <div className="mt-2 flex items-center justify-center gap-4 text-xs text-[var(--neutral-500)]">
            <span>Unit: {formatPriceNGN(breakdown?.unitPrice || 0)}</span>
            <span>•</span>
            <span>Lead time: {breakdown?.leadTimeDays || 0} days</span>
          </div>
        </div>
      </div>

      {/* Quick Summary */}
      <div className="space-y-2 border-b p-3">
        <div className="flex justify-between text-sm">
          <span className="text-[var(--neutral-600)]">Material:</span>
          <span className="font-medium">{quote.material.name}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-[var(--neutral-600)]">Volume:</span>
          <span className="font-medium">
            {quote.geometry.volumeCm3.toFixed(2)} cm³
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-[var(--neutral-600)]">Process:</span>
          <span className="font-medium">{selectedProcess}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-[var(--neutral-600)]">Finish:</span>
          <span className="font-medium">{breakdown?.finishName || 'None'}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-[var(--neutral-600)]">Manufacturability:</span>
          <span
            className={cn(
              'font-medium',
              quote.manufacturability.score >= 80
                ? 'text-green-600'
                : quote.manufacturability.score >= 60
                  ? 'text-yellow-600'
                  : 'text-red-600',
            )}
          >
            {quote.manufacturability.score}/100
          </span>
        </div>
      </div>

      {/* Toggle Breakdown */}
      <button
        onClick={() => setShowBreakdown(!showBreakdown)}
        className="flex items-center justify-between border-b p-3 transition-colors hover:bg-[var(--bg-50)]"
      >
        <span className="text-sm font-medium">Cost Breakdown</span>
        <Icon
          name={showBreakdown ? 'chevron-up' : 'chevron-down'}
          className="h-4 w-4"
        />
      </button>

      {/* Full Breakdown */}
      {showBreakdown && breakdown && (
        <div className="space-y-2 bg-[var(--neutral-50)] p-3">
          <BreakdownRow label="Material Cost" value={breakdown.materialCost} />
          <BreakdownRow
            label="Finish ({breakdown.finishName})"
            value={breakdown.finishCost}
          />
          <BreakdownRow
            label="Machine Time"
            value={breakdown.machineCost}
            showMinutes={breakdown.machineTimeMinutes}
          />
          <BreakdownRow label="Tooling" value={breakdown.toolCost} />
          <BreakdownRow label="Labor" value={breakdown.laborCost} />
          <BreakdownRow label="Setup" value={breakdown.setupCost} />
          <div className="mt-2 border-t border-[var(--neutral-200)] pt-2">
            <BreakdownRow label="Subtotal" value={breakdown.subtotal} bold />
            <div className="mt-1 flex justify-between text-xs text-[var(--neutral-500)]">
              <span>
                Platform Fee ({(breakdown.platformFeePercent * 100).toFixed(0)}
                %)
              </span>
              <span>{formatPriceNGN(breakdown.platformFee)}</span>
            </div>
            <div className="mt-2 flex justify-between border-t pt-2 font-bold text-[var(--primary-700)]">
              <span>Total</span>
              <span>{formatPriceNGN(breakdown.totalPrice)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="space-y-2 border-t p-3">
        <div className="grid grid-cols-2 gap-2">
          <Button
            onClick={() => {
              downloadQuoteAsJSON(quote);
              toast.success('Quote downloaded as JSON');
            }}
            variant="outline"
            size={isMobile ? 'default' : 'sm'}
            className="w-full"
          >
            <Icon name="download" className="mr-1 h-4 w-4" />
            JSON
          </Button>
          <Button
            onClick={async () => {
              try {
                await exportQuoteAsPDF(quote, {
                  includeBreakdown: true,
                  includeNotes: true,
                });
                toast.success('Quote PDF opened for printing');
              } catch {
                toast.error('Failed to export PDF');
              }
            }}
            variant="outline"
            size={isMobile ? 'default' : 'sm'}
            className="w-full"
          >
            <Icon name="file-text" className="mr-1 h-4 w-4" />
            PDF
          </Button>
        </div>
        <Button
          onClick={() => setShowCheckout(true)}
          size={isMobile ? 'default' : 'sm'}
          className="w-full"
          disabled={!!submitDisabledReason}
          title={submitDisabledReason || undefined}
        >
          <Icon name="send" className="mr-2 h-4 w-4" />
          Submit for Manufacturing
        </Button>
        {submitDisabledReason && (
          <p className="text-center text-xs text-[var(--neutral-500)]">
            {submitDisabledReason}
          </p>
        )}
      </div>

      {/* Warnings */}
      {quote.details.notes.length > 0 && (
        <div className="border-t bg-yellow-50 p-3">
          <h4 className="mb-2 flex items-center gap-1 text-xs font-semibold text-yellow-700">
            <Icon name="alert-triangle" className="h-3 w-3" />
            Notes
          </h4>
          <ul className="space-y-1 text-xs text-yellow-700">
            {quote.details.notes.map((note, idx) => (
              <li key={idx}>• {note}</li>
            ))}
          </ul>
        </div>
      )}

      <CheckoutModal
        isOpen={showCheckout}
        onClose={() => setShowCheckout(false)}
        quote={quote}
        workspaceData={workspaceData}
        onCompleted={(id) => {
          setShowCheckout(false);
          router.push(`/jobs/${id}`);
        }}
      />
    </div>
  );
}

interface BreakdownRowProps {
  label: string;
  value: number;
  showMinutes?: number;
  bold?: boolean;
}

function BreakdownRow({ label, value, showMinutes, bold }: BreakdownRowProps) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-[var(--neutral-600)]">{label}</span>
      <span className={bold ? 'font-bold' : ''}>
        {formatPriceNGN(value)}
        {showMinutes !== undefined && (
          <span className="ml-1 text-xs text-[var(--neutral-400)]">
            ({showMinutes} min)
          </span>
        )}
      </span>
    </div>
  );
}
