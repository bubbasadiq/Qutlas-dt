'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Icon } from '@/components/ui/icon';
import { Logo } from '@/components/logo';
import { AuthGuard } from '@/components/auth-guard';
import { useAuth } from '@/lib/auth-context';
import { useCurrency } from '@/hooks/use-currency';
import { PriceDisplay } from '@/components/price-display';
import { CurrencySelector } from '@/components/currency-selector';
import {
  CATALOG_CATEGORIES,
  type CatalogPart,
  type CategoryId,
} from '@/lib/catalog-data';
import { QuickAddModal } from '@/components/catalog/quick-add-modal';
import { CustomizeAddModal } from '@/components/catalog/customize-add-modal';

const materials = [
  { name: 'Aluminum', checked: false },
  { name: 'Steel', checked: false },
  { name: 'Stainless Steel', checked: false },
  { name: 'Brass', checked: false },
  { name: 'Basalt', checked: false },
  { name: 'Plastic', checked: false },
  { name: 'Ceramic', checked: false },
  { name: 'Rubber', checked: false },
];

const processes = [
  { name: 'CNC Milling', checked: false },
  { name: 'CNC', checked: false },
  { name: 'Laser Cutting', checked: false },
  { name: 'Cut', checked: false },
  { name: 'Sheet Metal', checked: false },
  { name: 'Welding', checked: false },
  { name: 'Casting', checked: false },
  { name: 'Cast', checked: false },
  { name: 'Machined', checked: false },
  { name: 'Molded', checked: false },
  { name: 'Stamped', checked: false },
];

const finishes = [
  { id: 'powder-coat', name: 'Powder Coat', checked: false },
  { id: 'anodize', name: 'Anodize', checked: false },
  { id: 'hard-anodize', name: 'Hard Anodize', checked: false },
  { id: 'paint', name: 'Paint', checked: false },
  { id: 'polished', name: 'Polished', checked: false },
  { id: 'brushed', name: 'Brushed', checked: false },
  { id: 'raw', name: 'Raw', checked: false },
  { id: 'galvanized', name: 'Galvanized', checked: false },
  { id: 'zinc-plated', name: 'Zinc Plated', checked: false },
  { id: 'stainless', name: 'Stainless', checked: false },
];

function CatalogContent() {
  const { user } = useAuth();
  const { currency } = useCurrency();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<CategoryId | 'all'>(
    'all',
  );
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [unitSystem, setUnitSystem] = useState<'mm' | 'in'>('mm');
  const [parts, setParts] = useState<CatalogPart[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);
  const [selectedProcesses, setSelectedProcesses] = useState<string[]>([]);
  const [selectedFinishes, setSelectedFinishes] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<CategoryId[]>(
    [],
  );
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 20000]);

  // Modal states
  const [quickAddModalOpen, setQuickAddModalOpen] = useState(false);
  const [customizeModalOpen, setCustomizeModalOpen] = useState(false);
  const [selectedPart, setSelectedPart] = useState<CatalogPart | null>(null);

  const fetchParts = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (activeCategory !== 'all') {
        params.set('category', activeCategory);
      }
      if (searchQuery) {
        params.set('search', searchQuery);
      }
      if (selectedMaterials.length > 0) {
        params.set('materials', selectedMaterials.join(','));
      }
      if (selectedProcesses.length > 0) {
        params.set('processes', selectedProcesses.join(','));
      }
      if (selectedFinishes.length > 0) {
        params.set('finishes', selectedFinishes.join(','));
      }
      if (selectedCategories.length > 0) {
        params.set('categories', selectedCategories.join(','));
      }
      params.set('minPrice', priceRange[0].toString());
      params.set('maxPrice', priceRange[1].toString());

      const response = await fetch(`/api/catalog?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setParts(data.items || []);
        setTotalCount(data.total || 0);
      }
    } catch (error) {
      console.error('Failed to fetch catalog:', error);
    } finally {
      setIsLoading(false);
    }
  }, [
    activeCategory,
    searchQuery,
    selectedMaterials,
    selectedProcesses,
    selectedFinishes,
    selectedCategories,
    priceRange,
  ]);

  useEffect(() => {
    fetchParts();
  }, [fetchParts]);

  const handlePreview = (partId: string) => {
    router.push(`/catalog/${partId}`);
  };

  const handleQuickAdd = (part: CatalogPart) => {
    setSelectedPart(part);
    setQuickAddModalOpen(true);
  };

  const handleCustomizeAdd = (part: CatalogPart) => {
    setSelectedPart(part);
    setCustomizeModalOpen(true);
  };

  const activeCategoryData = CATALOG_CATEGORIES.find(
    (cat) => cat.id === activeCategory,
  );

  return (
    <div className="min-h-screen bg-[var(--bg-50)]">
      <header className="sticky top-0 z-50 border-b border-[var(--neutral-200)] bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Logo variant="blue" size="md" href="/" />

          <nav className="hidden items-center gap-6 md:flex">
            <Link
              href="/dashboard"
              className="text-sm font-medium text-[var(--neutral-500)] hover:text-[var(--neutral-900)]"
            >
              Dashboard
            </Link>
            <Link
              href="/catalog"
              className="text-sm font-medium text-[var(--primary-700)]"
            >
              Catalog
            </Link>
            <Link
              href="/studio"
              className="text-sm font-medium text-[var(--neutral-500)] hover:text-[var(--neutral-900)]"
            >
              Workspace
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium text-[var(--neutral-900)]">
                {user?.name}
              </p>
              <p className="text-xs text-[var(--neutral-500)]">
                {user?.company}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/')}
            >
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <div className="border-b border-[var(--neutral-200)] bg-white">
        <div className="mx-auto max-w-7xl px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="mb-2 font-serif text-3xl text-[var(--neutral-900)]">
                Parts Catalog
              </h1>
              <p className="text-[var(--neutral-500)]">
                465 production-ready parts across 11 categories
              </p>
            </div>
            <CurrencySelector />
          </div>
        </div>
      </div>

      {/* Category Navigation */}
      <div className="border-b border-[var(--neutral-200)] bg-white">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="flex gap-2 overflow-x-auto pb-2">
            <button
              onClick={() => setActiveCategory('all')}
              className={`rounded-lg px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
                activeCategory === 'all'
                  ? 'bg-[var(--primary-700)] text-white'
                  : 'bg-[var(--neutral-100)] text-[var(--neutral-700)] hover:bg-[var(--neutral-200)]'
              }`}
            >
              All Parts (465)
            </button>
            {CATALOG_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
                  activeCategory === cat.id
                    ? 'bg-[var(--primary-700)] text-white'
                    : 'bg-[var(--neutral-100)] text-[var(--neutral-700)] hover:bg-[var(--neutral-200)]'
                }`}
              >
                <span>{cat.icon}</span>
                <span>
                  {cat.name} ({cat.count})
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Category Description */}
      {activeCategoryData && (
        <div className="border-b border-[var(--neutral-200)] bg-[var(--accent-50)]">
          <div className="mx-auto max-w-7xl px-6 py-4">
            <div className="flex items-start gap-4">
              <span className="text-3xl">{activeCategoryData.icon}</span>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-[var(--neutral-900)]">
                  {activeCategoryData.name}
                </h2>
                <p className="mt-1 text-sm text-[var(--neutral-600)]">
                  {activeCategoryData.description}
                </p>
                <p className="mt-2 text-xs text-[var(--accent-700)]">
                  <strong>Unlocks:</strong> {activeCategoryData.unlocks}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="flex gap-8">
          <aside className="hidden w-64 flex-shrink-0 lg:block">
            <div className="mb-6">
              <div className="relative">
                <Icon
                  name="search"
                  size={18}
                  className="absolute top-1/2 left-3 -translate-y-1/2 text-[var(--neutral-400)]"
                />
                <Input
                  placeholder="Search parts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-10 bg-white pl-10"
                />
              </div>
            </div>

            {/* Category Filter */}
            <div className="mb-6">
              <h3 className="mb-3 text-xs font-semibold tracking-wider text-[var(--neutral-400)] uppercase">
                Filter by Category
              </h3>
              <div className="max-h-64 space-y-2 overflow-y-auto">
                {CATALOG_CATEGORIES.map((cat) => (
                  <label
                    key={cat.id}
                    className="flex cursor-pointer items-center gap-2 text-sm text-[var(--neutral-700)]"
                  >
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(cat.id)}
                      onChange={() => {
                        const newCategories = selectedCategories.includes(
                          cat.id,
                        )
                          ? selectedCategories.filter((c) => c !== cat.id)
                          : [...selectedCategories, cat.id];
                        setSelectedCategories(newCategories);
                      }}
                      className="rounded border-[var(--neutral-300)]"
                    />
                    <span>{cat.icon}</span>
                    <span className="flex-1">{cat.name}</span>
                    <span className="text-xs text-[var(--neutral-400)]">
                      ({cat.count})
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <h3 className="mb-3 text-xs font-semibold tracking-wider text-[var(--neutral-400)] uppercase">
                Materials
              </h3>
              <div className="space-y-2">
                {materials.map((mat) => (
                  <label
                    key={mat.name}
                    className="flex cursor-pointer items-center gap-2 text-sm text-[var(--neutral-700)]"
                  >
                    <input
                      type="checkbox"
                      checked={selectedMaterials.includes(mat.name)}
                      onChange={() => {
                        const newMaterials = selectedMaterials.includes(
                          mat.name,
                        )
                          ? selectedMaterials.filter((m) => m !== mat.name)
                          : [...selectedMaterials, mat.name];
                        setSelectedMaterials(newMaterials);
                      }}
                      className="rounded border-[var(--neutral-300)]"
                    />
                    {mat.name}
                  </label>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <h3 className="mb-3 text-xs font-semibold tracking-wider text-[var(--neutral-400)] uppercase">
                Process
              </h3>
              <div className="max-h-48 space-y-2 overflow-y-auto">
                {processes.map((proc) => (
                  <label
                    key={proc.name}
                    className="flex cursor-pointer items-center gap-2 text-sm text-[var(--neutral-700)]"
                  >
                    <input
                      type="checkbox"
                      checked={selectedProcesses.includes(proc.name)}
                      onChange={() => {
                        const newProcesses = selectedProcesses.includes(
                          proc.name,
                        )
                          ? selectedProcesses.filter((p) => p !== proc.name)
                          : [...selectedProcesses, proc.name];
                        setSelectedProcesses(newProcesses);
                      }}
                      className="rounded border-[var(--neutral-300)]"
                    />
                    {proc.name}
                  </label>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <h3 className="mb-3 text-xs font-semibold tracking-wider text-[var(--neutral-400)] uppercase">
                Finish
              </h3>
              <div className="max-h-48 space-y-2 overflow-y-auto">
                {finishes.map((finish) => (
                  <label
                    key={finish.id}
                    className="flex cursor-pointer items-center gap-2 text-sm text-[var(--neutral-700)]"
                  >
                    <input
                      type="checkbox"
                      checked={selectedFinishes.includes(finish.id)}
                      onChange={() => {
                        const newFinishes = selectedFinishes.includes(finish.id)
                          ? selectedFinishes.filter((f) => f !== finish.id)
                          : [...selectedFinishes, finish.id];
                        setSelectedFinishes(newFinishes);
                      }}
                      className="rounded border-[var(--neutral-300)]"
                    />
                    {finish.name}
                  </label>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <h3 className="mb-3 text-xs font-semibold tracking-wider text-[var(--neutral-400)] uppercase">
                Price Range
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-[var(--neutral-600)]">
                    {currency.symbol}
                    {priceRange[0]}
                  </span>
                  <div className="flex-1">
                    <input
                      type="range"
                      min="0"
                      max="20000"
                      step="500"
                      value={priceRange[0]}
                      onChange={(e) =>
                        setPriceRange([Number(e.target.value), priceRange[1]])
                      }
                      className="w-full"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-[var(--neutral-600)]">
                    {currency.symbol}
                    {priceRange[1]}
                  </span>
                  <div className="flex-1">
                    <input
                      type="range"
                      min="0"
                      max="20000"
                      step="500"
                      value={priceRange[1]}
                      onChange={(e) =>
                        setPriceRange([priceRange[0], Number(e.target.value)])
                      }
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="mb-3 text-xs font-semibold tracking-wider text-[var(--neutral-400)] uppercase">
                Units
              </h3>
              <div className="flex rounded-lg bg-[var(--neutral-100)] p-1">
                <button
                  onClick={() => setUnitSystem('mm')}
                  className={`flex-1 rounded-md py-1.5 text-xs font-medium transition-colors ${
                    unitSystem === 'mm'
                      ? 'bg-white text-[var(--neutral-900)] shadow-sm'
                      : 'text-[var(--neutral-500)]'
                  }`}
                >
                  Metric (mm)
                </button>
                <button
                  onClick={() => setUnitSystem('in')}
                  className={`flex-1 rounded-md py-1.5 text-xs font-medium transition-colors ${
                    unitSystem === 'in'
                      ? 'bg-white text-[var(--neutral-900)] shadow-sm'
                      : 'text-[var(--neutral-500)]'
                  }`}
                >
                  Imperial (in)
                </button>
              </div>
            </div>
          </aside>

          <main className="flex-1">
            <div className="mb-6 flex items-center justify-between">
              <p className="text-sm text-[var(--neutral-500)]">
                {isLoading ? 'Loading...' : `${totalCount} parts found`}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`rounded-lg p-2 ${viewMode === 'grid' ? 'bg-[var(--neutral-100)]' : ''}`}
                >
                  <svg
                    className="h-5 w-5 text-[var(--neutral-500)]"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`rounded-lg p-2 ${viewMode === 'list' ? 'bg-[var(--neutral-100)]' : ''}`}
                >
                  <svg
                    className="h-5 w-5 text-[var(--neutral-500)]"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-[var(--primary-700)]"></div>
              </div>
            ) : (
              <div
                className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}
              >
                {parts.map((part) => {
                  const categoryData = CATALOG_CATEGORIES.find(
                    (c) => c.id === part.category,
                  );
                  return (
                    <div
                      key={part.id}
                      className={`overflow-hidden rounded-xl border border-[var(--neutral-200)] bg-white transition-all hover:border-[var(--primary-500)] hover:shadow-lg ${viewMode === 'list' ? 'flex' : ''}`}
                    >
                      <div
                        className={`cursor-pointer bg-[var(--bg-100)] ${viewMode === 'list' ? 'h-32 w-40' : 'aspect-square'}`}
                        onClick={() => handlePreview(part.id)}
                      >
                        <img
                          src={part.thumbnail || '/placeholder.svg'}
                          alt={part.name}
                          className="h-full w-full object-cover"
                        />
                      </div>

                      <div className="flex-1 p-4">
                        <div className="mb-2 flex items-start justify-between">
                          <div className="flex-1">
                            <div className="mb-1 flex items-center gap-2">
                              {categoryData && (
                                <span className="rounded bg-[var(--accent-100)] px-2 py-0.5 text-xs text-[var(--accent-700)]">
                                  {categoryData.icon} {categoryData.name}
                                </span>
                              )}
                            </div>
                            <h3
                              className="cursor-pointer font-medium text-[var(--neutral-900)] hover:text-[var(--primary-700)]"
                              onClick={() => handlePreview(part.id)}
                            >
                              {part.name}
                            </h3>
                            <p className="text-xs text-[var(--neutral-500)]">
                              {part.material} • {part.process || 'Standard'}
                            </p>
                          </div>
                          {part.manufacturability && (
                            <span className="ml-2 rounded-full bg-[var(--accent-100)] px-2 py-1 text-xs text-[var(--accent-700)]">
                              {part.manufacturability}%
                            </span>
                          )}
                        </div>

                        <div className="mt-4 flex items-center justify-between">
                          <div>
                            <PriceDisplay
                              amount={part.basePrice}
                              variant="default"
                            />
                            <p className="text-xs text-[var(--neutral-500)]">
                              {part.leadTime || '3-5 days'}
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 bg-transparent text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleQuickAdd(part);
                            }}
                          >
                            Quick Add
                          </Button>
                          <Button
                            size="sm"
                            className="flex-1 text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCustomizeAdd(part);
                            }}
                          >
                            Customize
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Modals */}
      {selectedPart && (
        <>
          <QuickAddModal
            open={quickAddModalOpen}
            onClose={() => {
              setQuickAddModalOpen(false);
              setSelectedPart(null);
            }}
            part={selectedPart}
          />
          <CustomizeAddModal
            open={customizeModalOpen}
            onClose={() => {
              setCustomizeModalOpen(false);
              setSelectedPart(null);
            }}
            part={selectedPart}
          />
        </>
      )}
    </div>
  );
}

export default function CatalogPage() {
  return (
    <AuthGuard>
      <CatalogContent />
    </AuthGuard>
  );
}
