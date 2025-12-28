'use client';

import type React from 'react';
import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Icon } from '@/components/ui/icon';
import { useWorkspace } from '@/hooks/use-workspace';
import { useIsMobile } from '@/hooks/use-media-query';
import { toast } from 'sonner';
import {
  MaterialLibrary,
  MATERIALS,
  type Material,
} from '@/components/material-library';
import {
  selectToolpath,
  getAllProcesses,
} from '@/lib/toolpath/select-toolpath';
import { assessManufacturability } from '@/lib/manufacturability/assess';
import { generateQuote, formatPriceNGN } from '@/lib/quote/estimate';
import { FINISHES, getFinishById, type FinishType } from '@/lib/finishes';
import { cn } from '@/lib/utils';

export interface PropertiesPanelProps {
  selectedObject?: string;
  selectedObjects?: string[];
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  selectedObject,
  selectedObjects = [],
}) => {
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState('properties');
  const {
    getObjectParameters,
    updateObjectParameters,
    getObjectGeometry,
    updateObject,
    performBoolean,
  } = useWorkspace();
  const [params, setParams] = useState<Record<string, number>>({});
  const [applying, setApplying] = useState(false);
  const [showMaterialLibrary, setShowMaterialLibrary] = useState(false);
  const [selectedProcess, setSelectedProcess] = useState('cnc-milling');
  const [quantity, setQuantity] = useState(1);
  const [selectedFinish, setSelectedFinish] =
    useState<FinishType>('raw-unfinished');

  useEffect(() => {
    if (selectedObject) {
      const p = getObjectParameters(selectedObject);
      if (p) setParams(p);
    }
  }, [selectedObject, getObjectParameters]);

  const handleChange = (key: string, value: string | number) => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(numValue) || numValue <= 0) return;
    setParams((prev) => ({ ...prev, [key]: numValue }));
  };

  const handleApply = () => {
    if (!selectedObject) return;

    setApplying(true);
    try {
      updateObjectParameters(selectedObject, params);
      toast.success('Parameters updated');
    } catch {
      toast.error('Failed to update parameters');
    } finally {
      setApplying(false);
    }
  };

  const handleMaterialSelect = (material: Material) => {
    if (!selectedObject) return;
    updateObject(selectedObject, { material: material.id });
    toast.success(`Material changed to ${material.name}`);
  };

  const handleFinishSelect = (finishId: FinishType) => {
    if (!selectedObject) return;
    setSelectedFinish(finishId);
    updateObject(selectedObject, { finish: finishId });
    const finish = getFinishById(finishId);
    toast.success(`Finish changed to ${finish?.name || 'None'}`);
  };

  // Get dynamic parameters based on object type
  const getParametersForObject = () => {
    if (!selectedObject) return [];

    const obj = getObjectGeometry(selectedObject);
    if (!obj) return [];

    const type = obj.type;

    switch (type) {
      case 'cylinder':
        return [
          { key: 'radius', label: 'Radius', unit: 'mm' },
          { key: 'diameter', label: 'Diameter', unit: 'mm' },
          { key: 'height', label: 'Height', unit: 'mm' },
        ];
      case 'sphere':
        return [
          { key: 'radius', label: 'Radius', unit: 'mm' },
          { key: 'diameter', label: 'Diameter', unit: 'mm' },
        ];
      case 'torus':
        return [
          { key: 'majorRadius', label: 'Major Radius', unit: 'mm' },
          { key: 'minorRadius', label: 'Minor Radius', unit: 'mm' },
        ];
      case 'cone':
        return [
          { key: 'radius', label: 'Base Radius', unit: 'mm' },
          { key: 'height', label: 'Height', unit: 'mm' },
        ];
      case 'box':
      default:
        return [
          { key: 'width', label: 'Width', unit: 'mm' },
          { key: 'height', label: 'Height', unit: 'mm' },
          { key: 'depth', label: 'Depth', unit: 'mm' },
        ];
    }
  };

  // Tabs configuration
  const tabs = [
    { id: 'properties', label: 'Properties', icon: 'settings' },
    { id: 'toolpath', label: 'Toolpath', icon: 'settings' },
    { id: 'manufacturability', label: 'Analysis', icon: 'bar-chart' },
    { id: 'quote', label: 'Quote', icon: 'shopping-cart' },
  ];

  // Mobile optimized styles
  const mobileTabClass = isMobile
    ? 'flex-1 px-2 py-3 text-xs font-medium rounded-md transition-colors min-h-[44px]'
    : 'flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-colors';

  const mobileInputClass = isMobile ? 'h-12 text-base' : 'h-8 text-sm';

  return (
    <div
      className={`flex flex-col bg-white ${isMobile ? '' : 'border-l border-[var(--neutral-200)]'}`}
    >
      {/* Tabs */}
      <div
        className={`${isMobile ? 'border-b border-[var(--neutral-200)] p-3' : 'border-b border-[var(--neutral-200)] p-2'}`}
      >
        <div
          className={`flex gap-1 ${isMobile ? 'rounded-xl bg-gray-100 p-1' : 'rounded-lg bg-[var(--neutral-100)] p-1'}`}
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`${mobileTabClass} flex touch-manipulation items-center justify-center ${
                isMobile ? 'flex-col gap-0.5' : 'gap-1'
              } ${
                activeTab === tab.id
                  ? 'bg-white text-[var(--neutral-900)] shadow-sm'
                  : 'text-[var(--neutral-600)] hover:text-[var(--neutral-900)]'
              }`}
            >
              <Icon
                name={tab.icon}
                className={isMobile ? 'h-4 w-4' : 'h-3 w-3'}
              />
              <span className={isMobile ? 'text-[11px] leading-none' : ''}>
                {tab.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className={`flex-1 overflow-y-auto ${isMobile ? 'p-4' : 'p-4'}`}>
        {/* Properties Tab */}
        {activeTab === 'properties' && (
          <div className="space-y-6">
            {/* Object Info */}
            <div>
              <h3
                className={`mb-1 font-semibold text-[var(--neutral-900)] ${isMobile ? 'text-lg' : 'text-base'}`}
              >
                {selectedObject || 'No Selection'}
              </h3>
              <p
                className={`text-[var(--neutral-500)] ${isMobile ? 'text-base' : 'text-sm'}`}
              >
                Parametric Object
              </p>
            </div>

            {/* Material Selection */}
            {selectedObject && (
              <div className="space-y-3">
                <h4
                  className={`font-semibold tracking-wider text-[var(--neutral-700)] uppercase ${isMobile ? 'text-sm' : 'text-xs'}`}
                >
                  Material
                </h4>
                <button
                  onClick={() => setShowMaterialLibrary(true)}
                  className={`w-full touch-manipulation rounded-lg border border-[var(--neutral-200)] text-left transition-colors hover:border-[var(--neutral-300)] ${
                    isMobile ? 'p-4' : 'p-3'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`rounded border border-[var(--neutral-200)] ${
                        isMobile ? 'h-12 w-12' : 'h-8 w-8'
                      }`}
                      style={{
                        backgroundColor:
                          MATERIALS.find(
                            (m) =>
                              m.id ===
                              (getObjectGeometry(selectedObject)?.material ||
                                'aluminum-6061'),
                          )?.color || '#C0C0C0',
                      }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-base font-medium text-[var(--neutral-900)]">
                        {MATERIALS.find(
                          (m) =>
                            m.id ===
                            (getObjectGeometry(selectedObject)?.material ||
                              'aluminum-6061'),
                        )?.name || 'Aluminum 6061-T6'}
                      </p>
                      <p className="text-sm text-[var(--neutral-500)]">
                        Click to change
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            )}

            {/* Finish Selection */}
            {selectedObject && (
              <div className="space-y-3">
                <h4
                  className={`font-semibold tracking-wider text-[var(--neutral-700)] uppercase ${isMobile ? 'text-sm' : 'text-xs'}`}
                >
                  Finish
                </h4>
                <select
                  value={selectedFinish}
                  onChange={(e) =>
                    handleFinishSelect(e.target.value as FinishType)
                  }
                  className={`w-full rounded-lg border border-[var(--neutral-200)] transition-colors hover:border-[var(--neutral-300)] ${
                    isMobile ? 'p-4' : 'p-3'
                  }`}
                >
                  {FINISHES.map((finish) => (
                    <option key={finish.id} value={finish.id}>
                      {finish.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-[var(--neutral-500)]">
                  {getFinishById(selectedFinish)?.description}
                </p>
              </div>
            )}

            {/* Boolean Operations for Multi-selection */}
            {selectedObjects.length > 1 && (
              <div className="space-y-3">
                <h4
                  className={`font-semibold tracking-wider text-[var(--neutral-700)] uppercase ${isMobile ? 'text-sm' : 'text-xs'}`}
                >
                  Boolean Operations
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size={isMobile ? 'default' : 'sm'}
                    className={cn(
                      'flex touch-manipulation items-center gap-2',
                      isMobile ? 'min-h-[44px]' : '',
                    )}
                    onClick={() => {
                      toast.promise(
                        performBoolean(
                          'union',
                          selectedObjects[0],
                          selectedObjects[1],
                        ),
                        {
                          loading: 'Performing union...',
                          success: 'Objects combined',
                          error: 'Union failed',
                        },
                      );
                    }}
                  >
                    <Icon name="plus" className="h-3 w-3" />
                    Union
                  </Button>
                  <Button
                    variant="outline"
                    size={isMobile ? 'default' : 'sm'}
                    className={cn(
                      'flex touch-manipulation items-center gap-2',
                      isMobile ? 'min-h-[44px]' : '',
                    )}
                    onClick={() => {
                      toast.promise(
                        performBoolean(
                          'subtract',
                          selectedObjects[0],
                          selectedObjects[1],
                        ),
                        {
                          loading: 'Performing subtraction...',
                          success: 'Object subtracted',
                          error: 'Subtraction failed',
                        },
                      );
                    }}
                  >
                    <Icon name="minus" className="h-3 w-3" />
                    Subtract
                  </Button>
                </div>
                <p className="text-xs text-[var(--neutral-500)] italic">
                  * First selected object is the target.
                </p>
              </div>
            )}

            {/* Transform / Parameters */}
            {selectedObject ? (
              <div className="space-y-4">
                <h4
                  className={cn(
                    'font-semibold tracking-wider text-[var(--neutral-700)] uppercase',
                    isMobile ? 'text-sm' : 'text-xs',
                  )}
                >
                  Parameters
                </h4>
                {getParametersForObject().map((param) => (
                  <div key={param.key}>
                    <Label
                      className={cn(
                        'block font-medium text-[var(--neutral-700)]',
                        isMobile ? 'mb-2 text-sm' : 'mb-1 text-xs',
                      )}
                    >
                      {param.label} ({param.unit})
                    </Label>
                    <Input
                      type="number"
                      value={params[param.key] || 0}
                      onChange={(e) => handleChange(param.key, e.target.value)}
                      className={mobileInputClass}
                      min={0.1}
                      step={0.1}
                    />
                  </div>
                ))}
                <Button
                  variant="outline"
                  size={isMobile ? 'default' : 'sm'}
                  className={`w-full bg-transparent ${isMobile ? 'h-12 text-base' : ''}`}
                  onClick={handleApply}
                  disabled={applying}
                >
                  {applying ? 'Applying...' : 'Apply Changes'}
                </Button>
              </div>
            ) : (
              <p className="text-base text-[var(--neutral-500)]">
                Select an object to edit its properties
              </p>
            )}
          </div>
        )}

        {/* Toolpath Tab */}
        {activeTab === 'toolpath' && (
          <div className="space-y-6">
            {selectedObject ? (
              <>
                {/* Process Selection */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold tracking-wider text-[var(--neutral-400)] uppercase">
                    Manufacturing Process
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {getAllProcesses().map((process) => (
                      <button
                        key={process.id}
                        onClick={() => setSelectedProcess(process.id)}
                        className={`${isMobile ? 'p-3' : 'p-2'} rounded-lg border text-left transition-colors ${
                          selectedProcess === process.id
                            ? 'border-[var(--primary-700)] bg-[var(--primary-50)] text-[var(--primary-900)]'
                            : 'border-[var(--neutral-200)] hover:border-[var(--neutral-300)]'
                        }`}
                      >
                        <div
                          className={`font-medium ${isMobile ? 'text-sm' : 'text-xs'}`}
                        >
                          {process.name}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Toolpath Strategy */}
                {(() => {
                  const obj = getObjectGeometry(selectedObject);
                  const material = MATERIALS.find(
                    (m) => m.id === (obj?.material || 'aluminum-6061'),
                  );
                  const toolpath = selectToolpath({
                    process: selectedProcess,
                    material: material?.name,
                    objectType: obj?.type,
                    geometryParams: params,
                    featureCount: 0,
                  });

                  return (
                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold tracking-wider text-[var(--neutral-400)] uppercase">
                        Toolpath Strategy
                      </h4>
                      <div
                        className={`rounded-lg border border-[var(--neutral-200)] bg-[var(--neutral-50)] ${isMobile ? 'p-4' : 'p-3'}`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`${isMobile ? 'mt-1' : 'mt-0.5'}`}>
                            <Icon
                              name="settings"
                              className="h-5 w-5 text-[var(--primary-700)]"
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h5 className="mb-1 font-semibold text-[var(--neutral-900)]">
                              {toolpath.name}
                            </h5>
                            <p
                              className={`text-[var(--neutral-600)] ${isMobile ? 'text-sm' : 'text-xs'} mb-2`}
                            >
                              {toolpath.strategy}
                            </p>
                            <p
                              className={`text-[var(--neutral-600)] ${isMobile ? 'text-sm' : 'text-xs'} mb-2`}
                            >
                              {toolpath.description}
                            </p>
                            {toolpath.notes && (
                              <p
                                className={`text-[var(--neutral-500)] italic ${isMobile ? 'text-xs' : 'text-[11px]'}`}
                              >
                                {toolpath.notes}
                              </p>
                            )}
                            <div className="mt-2 border-t border-[var(--neutral-200)] pt-2">
                              <div className="flex justify-between text-xs text-[var(--neutral-500)]">
                                <span>Machine: {toolpath.machine}</span>
                                <span>~{toolpath.estimatedTime} min</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </>
            ) : (
              <p className="text-base text-[var(--neutral-500)]">
                Select an object to configure toolpath
              </p>
            )}
          </div>
        )}

        {/* Manufacturability Tab */}
        {activeTab === 'manufacturability' && (
          <div className="space-y-4">
            {selectedObject ? (
              <ManufacturabilityContent
                selectedObject={selectedObject}
                params={params}
              />
            ) : (
              <p className="text-base text-[var(--neutral-500)]">
                Select an object to analyze manufacturability
              </p>
            )}
          </div>
        )}

        {/* Quote Tab */}
        {activeTab === 'quote' && (
          <div className="space-y-4">
            {selectedObject ? (
              <QuoteContent
                selectedObject={selectedObject}
                params={params}
                selectedProcess={selectedProcess}
                setSelectedProcess={setSelectedProcess}
                quantity={quantity}
                setQuantity={setQuantity}
                selectedFinish={selectedFinish}
                isMobile={isMobile}
              />
            ) : (
              <p className="text-base text-[var(--neutral-500)]">
                Select an object to get a quote
              </p>
            )}
          </div>
        )}
      </div>

      {/* Material Library Modal */}
      <MaterialLibrary
        isOpen={showMaterialLibrary}
        onClose={() => setShowMaterialLibrary(false)}
        onSelect={handleMaterialSelect}
        currentMaterial={
          selectedObject
            ? getObjectGeometry(selectedObject)?.material
            : undefined
        }
      />
    </div>
  );
};

// Manufacturability content component
function ManufacturabilityContent({
  selectedObject,
  params,
}: {
  selectedObject: string;
  params: Record<string, number>;
}) {
  const { getObjectGeometry } = useWorkspace();

  const obj = getObjectGeometry(selectedObject);
  const analysis = useMemo(() => {
    if (!obj) return null;
    return assessManufacturability({
      dimensions: params,
      features: obj.features || [],
      material: obj.material || 'aluminum-6061',
      process: 'cnc-milling',
    });
  }, [obj, params]);

  if (!analysis) return null;

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-green-100';
    if (score >= 60) return 'bg-yellow-100';
    if (score >= 40) return 'bg-orange-100';
    return 'bg-red-100';
  };

  return (
    <>
      {/* Score */}
      <div className={`rounded-lg border ${getScoreBg(analysis.score)} p-4`}>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-medium">Manufacturability Score</span>
          <span
            className={`text-3xl font-bold ${getScoreColor(analysis.score)}`}
          >
            {analysis.score}
          </span>
        </div>
        <div className="h-2 w-full rounded-full bg-white/50">
          <div
            className={`h-2 rounded-full ${analysis.score >= 80 ? 'bg-green-500' : analysis.score >= 60 ? 'bg-yellow-500' : analysis.score >= 40 ? 'bg-orange-500' : 'bg-red-500'}`}
            style={{ width: `${analysis.score}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-[var(--neutral-600)]">
          {analysis.compatible
            ? 'Design is compatible with selected process'
            : 'Design has manufacturability issues'}
        </p>
      </div>

      {/* Summary */}
      <div className="text-sm text-[var(--neutral-600)]">
        {analysis.passedChecks} of {analysis.totalChecks} checks passed
      </div>

      {/* Issues */}
      {analysis.issues.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-[var(--neutral-700)]">
            Issues
          </h4>
          {analysis.issues.slice(0, 3).map((issue, idx) => (
            <div
              key={idx}
              className={`rounded p-2 text-xs ${
                issue.severity === 'error' || issue.severity === 'critical'
                  ? 'bg-red-50 text-red-700'
                  : issue.severity === 'warning'
                    ? 'bg-yellow-50 text-yellow-700'
                    : 'bg-blue-50 text-blue-700'
              }`}
            >
              <div className="font-medium">{issue.message}</div>
              <div className="mt-1 opacity-80">{issue.fix}</div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

// Quote content component
function QuoteContent({
  selectedObject,
  params,
  selectedProcess,
  setSelectedProcess,
  quantity,
  setQuantity,
  selectedFinish,
  isMobile,
}: {
  selectedObject: string;
  params: Record<string, number>;
  selectedProcess: string;
  setSelectedProcess: (p: string) => void;
  quantity: number;
  setQuantity: (q: number) => void;
  selectedFinish: FinishType;
  isMobile: boolean;
}) {
  const { getObjectGeometry } = useWorkspace();

  const obj = getObjectGeometry(selectedObject);
  const quote = useMemo(() => {
    if (!obj) return null;
    return generateQuote({
      geometryParams: params,
      objectType: obj.type,
      material: obj.material || 'aluminum-6061',
      process: selectedProcess,
      quantity,
      finish: selectedFinish,
      features: obj.features || [],
    });
  }, [obj, params, selectedProcess, quantity, selectedFinish]);

  if (!quote) return null;

  const breakdown = quote.breakdown;

  return (
    <>
      {/* Process Selection */}
      <div className="space-y-2">
        <Label className="text-xs font-medium text-[var(--neutral-600)]">
          Process
        </Label>
        <select
          value={selectedProcess}
          onChange={(e) => setSelectedProcess(e.target.value)}
          className="w-full rounded-lg border border-[var(--neutral-200)] px-3 py-2 text-sm"
        >
          <option value="cnc-milling">CNC Milling</option>
          <option value="cnc-turning">CNC Turning</option>
          <option value="laser-cutting">Laser Cutting</option>
          <option value="3d-printing">3D Printing</option>
          <option value="sheet-metal">Sheet Metal</option>
          <option value="welding">Welding</option>
          <option value="casting">Casting</option>
        </select>
      </div>

      {/* Quantity */}
      <div className="space-y-2">
        <Label className="text-xs font-medium text-[var(--neutral-600)]">
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
      </div>

      {/* Price */}
      <div className="rounded-lg bg-gradient-to-br from-[var(--primary-50)] to-[var(--accent-50)] p-4 text-center">
        <p className="text-sm text-[var(--neutral-600)]">Estimated Total</p>
        <p className="text-2xl font-bold text-[var(--primary-700)]">
          {formatPriceNGN(breakdown.totalPrice)}
        </p>
        <p className="mt-1 text-xs text-[var(--neutral-500)]">
          Unit: {formatPriceNGN(breakdown.unitPrice)} • {breakdown.leadTimeDays}{' '}
          days
        </p>
      </div>

      {/* Summary */}
      <div className="space-y-1 text-sm">
        <div className="flex justify-between">
          <span className="text-[var(--neutral-600)]">Material</span>
          <span>{formatPriceNGN(breakdown.materialCost)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[var(--neutral-600)]">
            Finish ({breakdown.finishName})
          </span>
          <span>{formatPriceNGN(breakdown.finishCost)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[var(--neutral-600)]">Machine Time</span>
          <span>{formatPriceNGN(breakdown.machineCost)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[var(--neutral-600)]">Tools</span>
          <span>{formatPriceNGN(breakdown.toolCost)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[var(--neutral-600)]">Labor</span>
          <span>{formatPriceNGN(breakdown.laborCost)}</span>
        </div>
        <div className="mt-2 flex justify-between border-t pt-2 font-medium">
          <span>Total</span>
          <span>{formatPriceNGN(breakdown.subtotal)}</span>
        </div>
        <div className="flex justify-between text-xs text-[var(--neutral-500)]">
          <span>Platform Fee (5%)</span>
          <span>{formatPriceNGN(breakdown.platformFee)}</span>
        </div>
      </div>
    </>
  );
}
