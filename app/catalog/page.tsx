'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback, useMemo } from 'react';
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
import {
  CATALOG_CATEGORIES,
  type CatalogPart,
  type CategoryId,
} from '@/lib/catalog-data';
import {
  ALL_MATERIALS,
  ALL_FINISHES,
  getAvailableFinishesForMaterials,
  getFinishCompatibilityStatus,
  type Material,
  type Finish,
} from '@/lib/finish-material-compatibility';
import { QuickAddModal } from '@/components/catalog/quick-add-modal';
import { CustomizeAddModal } from '@/components/catalog/customize-add-modal';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

// Process options
const PROCESSES = [
  { name: 'CNC Milling', count: 120 },
  { name: 'Laser Cutting', count: 85 },
  { name: '3D Printing', count: 45 },
  { name: 'Sheet Metal', count: 65 },
  { name: 'Welding', count: 55 },
  { name: 'Casting', count: 50 },
  { name: 'Cut', count: 25 },
  { name: 'Machined', count: 15 },
  { name: 'Molded', count: 5 },
] as const;

// Filter section component
function FilterSection({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-[var(--neutral-200)] pb-4 mb-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between text-left"
      >
        <h3 className="text-sm font-semibold text-[var(--neutral-900)]">
          {title}
        </h3>
        <Icon
          name={isOpen ? 'chevron-up' : 'chevron-down'}
          size={16}
          className="text-[var(--neutral-400)]"
        />
      </button>
      {isOpen && <div className="mt-3">{children}</div>}
    </div>
  );
}

// Filter option checkbox component
function FilterCheckbox({
  label,
  count,
  checked,
  disabled,
  onChange,
  tooltip,
}: {
  label: string;
  count?: number;
  checked: boolean;
  disabled?: boolean;
  onChange: () => void;
  tooltip?: string;
}) {
  return (
    <label
      className={cn(
        'flex cursor-pointer items-center gap-2 text-sm transition-colors',
        disabled
          ? 'cursor-not-allowed opacity-50'
          : 'hover:text-[var(--neutral-900)]',
      )}
      title={tooltip}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={onChange}
        className={cn(
          'h-4 w-4 rounded border-[var(--neutral-300)] transition-colors',
          'focus:ring-2 focus:ring-[var(--primary-500)] focus:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
        )}
      />
      <span className="flex-1">{label}</span>
      {count !== undefined && (
        <span className="text-xs text-[var(--neutral-400)]">({count})</span>
      )}
    </label>
  );
}

// Mobile filter drawer
function MobileFilterDrawer({
  open,
  onClose,
  selectedCategories,
  onCategoriesChange,
  selectedMaterials,
  onMaterialsChange,
  selectedProcesses,
  onProcessesChange,
  selectedFinishes,
  onFinishesChange,
  onClearAll,
}: {
  open: boolean;
  onClose: () => void;
  selectedCategories: CategoryId[];
  onCategoriesChange: (cats: CategoryId[]) => void;
  selectedMaterials: Material[];
  onMaterialsChange: (mats: Material[]) => void;
  selectedProcesses: string[];
  onProcessesChange: (procs: string[]) => void;
  selectedFinishes: Finish[];
  onFinishesChange: (finishes: Finish[]) => void;
  onClearAll: () => void;
}) {
  const [tempCategories, setTempCategories] = useState(selectedCategories);
  const [tempMaterials, setTempMaterials] = useState(selectedMaterials);
  const [tempProcesses, setTempProcesses] = useState(selectedProcesses);
  const [tempFinishes, setTempFinishes] = useState(selectedFinishes);

  const availableFinishes = useMemo(
    () => getAvailableFinishesForMaterials(tempMaterials),
    [tempMaterials],
  );

  const handleApply = () => {
    onCategoriesChange(tempCategories);
    onMaterialsChange(tempMaterials);
    onProcessesChange(tempProcesses);
    onFinishesChange(tempFinishes);
    onClose();
  };

  const handleClearAll = () => {
    setTempCategories([]);
    setTempMaterials([]);
    setTempProcesses([]);
    setTempFinishes([]);
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent
        side="left"
        className="w-full max-w-xs h-full rounded-r-xl"
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between border-b border-[var(--neutral-200)] pb-4">
            <h2 className="text-lg font-semibold text-[var(--neutral-900)]">
              Filters
            </h2>
            <button
              onClick={handleClearAll}
              className="text-sm text-[var(--primary-700)] hover:text-[var(--primary-800)]"
            >
              Clear All
            </button>
          </div>

          <div className="flex-1 overflow-y-auto py-4">
            {/* Category Filter */}
            <div className="mb-4">
              <h3 className="mb-3 text-xs font-semibold tracking-wider text-[var(--neutral-400)] uppercase">
                Category
              </h3>
              <div className="space-y-2">
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={tempCategories.length === 0}
                    onChange={() => setTempCategories([])}
                    className="h-4 w-4 rounded border-[var(--neutral-300)]"
                  />
                  <span className="font-medium">All Categories</span>
                  <span className="text-xs text-[var(--neutral-400)]">
                    (465)
                  </span>
                </label>
                {CATALOG_CATEGORIES.map((cat) => (
                  <label
                    key={cat.id}
                    className="flex cursor-pointer items-center gap-2 text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={tempCategories.includes(cat.id)}
                      onChange={() => {
                        setTempCategories(
                          tempCategories.includes(cat.id)
                            ? tempCategories.filter((c) => c !== cat.id)
                            : [...tempCategories, cat.id],
                        );
                      }}
                      className="h-4 w-4 rounded border-[var(--neutral-300)]"
                    />
                    <span>{cat.name}</span>
                    <span className="text-xs text-[var(--neutral-400)]">
                      ({cat.count})
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Material Filter */}
            <div className="mb-4">
              <h3 className="mb-3 text-xs font-semibold tracking-wider text-[var(--neutral-400)] uppercase">
                Material
              </h3>
              <div className="space-y-2">
                {ALL_MATERIALS.map((mat) => (
                  <label
                    key={mat}
                    className="flex cursor-pointer items-center gap-2 text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={tempMaterials.includes(mat)}
                      onChange={() => {
                        setTempMaterials(
                          tempMaterials.includes(mat)
                            ? tempMaterials.filter((m) => m !== mat)
                            : [...tempMaterials, mat],
                        );
                      }}
                      className="h-4 w-4 rounded border-[var(--neutral-300)]"
                    />
                    <span>{mat}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Process Filter */}
            <div className="mb-4">
              <h3 className="mb-3 text-xs font-semibold tracking-wider text-[var(--neutral-400)] uppercase">
                Process
              </h3>
              <div className="space-y-2">
                {PROCESSES.map((proc) => (
                  <label
                    key={proc.name}
                    className="flex cursor-pointer items-center gap-2 text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={tempProcesses.includes(proc.name)}
                      onChange={() => {
                        setTempProcesses(
                          tempProcesses.includes(proc.name)
                            ? tempProcesses.filter((p) => p !== proc.name)
                            : [...tempProcesses, proc.name],
                        );
                      }}
                      className="h-4 w-4 rounded border-[var(--neutral-300)]"
                    />
                    <span>{proc.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Finish Filter with Material Compatibility */}
            <div className="mb-4">
              <h3 className="mb-3 text-xs font-semibold tracking-wider text-[var(--neutral-400)] uppercase">
                Finish
              </h3>
              <div className="space-y-2">
                {ALL_FINISHES.map((finish) => {
                  const { compatible, reason } =
                    getFinishCompatibilityStatus(finish, tempMaterials);
                  return (
                    <FilterCheckbox
                      key={finish}
                      label={finish}
                      checked={tempFinishes.includes(finish)}
                      disabled={!compatible}
                      onChange={() => {
                        setTempFinishes(
                          tempFinishes.includes(finish)
                            ? tempFinishes.filter((f) => f !== finish)
                            : [...tempFinishes, finish],
                        );
                      }}
                      tooltip={!compatible ? reason : undefined}
                    />
                  );
                })}
              </div>
            </div>
          </div>

          <div className="border-t border-[var(--neutral-200)] pt-4">
            <Button onClick={handleApply} className="w-full">
              Apply Filters
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function CatalogContent() {
  const { user } = useAuth();
  const { currency } = useCurrency();
  const router = useRouter();

  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Filter states
  const [selectedCategories, setSelectedCategories] = useState<CategoryId[]>(
    [],
  );
  const [selectedMaterials, setSelectedMaterials] = useState<Material[]>([]);
  const [selectedProcesses, setSelectedProcesses] = useState<string[]>([]);
  const [selectedFinishes, setSelectedFinishes] = useState<Finish[]>([]);

  // View state
  const [parts, setParts] = useState<CatalogPart[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Modal states
  const [quickAddModalOpen, setQuickAddModalOpen] = useState(false);
  const [customizeModalOpen, setCustomizeModalOpen] = useState(false);
  const [selectedPart, setSelectedPart] = useState<CatalogPart | null>(null);

  // Computed available finishes based on selected materials
  const availableFinishes = useMemo(
    () => getAvailableFinishesForMaterials(selectedMaterials),
    [selectedMaterials],
  );

  // Fetch parts from API
  const fetchParts = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) {
        params.set('search', searchQuery);
      }
      if (selectedCategories.length > 0) {
        params.set('categories', selectedCategories.join(','));
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
  }, [searchQuery, selectedCategories, selectedMaterials, selectedProcesses, selectedFinishes]);

  useEffect(() => {
    fetchParts();
  }, [fetchParts]);

  // Handle preview
  const handlePreview = (partId: string) => {
    router.push(`/catalog/${partId}`);
  };

  // Handle quick add
  const handleQuickAdd = (part: CatalogPart) => {
    setSelectedPart(part);
    setQuickAddModalOpen(true);
  };

  // Handle customize add
  const handleCustomizeAdd = (part: CatalogPart) => {
    setSelectedPart(part);
    setCustomizeModalOpen(true);
  };

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    setSelectedCategories([]);
    setSelectedMaterials([]);
    setSelectedProcesses([]);
    setSelectedFinishes([]);
    setSearchQuery('');
  }, []);

  // Active filter count
  const activeFilterCount =
    selectedCategories.length +
    selectedMaterials.length +
    selectedProcesses.length +
    selectedFinishes.length;

  // Get active filter summary for display
  const activeFiltersSummary = useMemo(() => {
    const filters: string[] = [];
    if (selectedMaterials.length > 0) {
      filters.push(`${selectedMaterials.length} material(s)`);
    }
    if (selectedCategories.length > 0) {
      filters.push(`${selectedCategories.length} category(ies)`);
    }
    if (selectedProcesses.length > 0) {
      filters.push(`${selectedProcesses.length} process(es)`);
    }
    if (selectedFinishes.length > 0) {
      filters.push(`${selectedFinishes.length} finish(es)`);
    }
    return filters.join(', ');
  }, [selectedMaterials, selectedCategories, selectedProcesses, selectedFinishes]);

  // Calculate category counts (simplified - would come from API in production)
  const getCategoryCount = (categoryId: CategoryId) => {
    const cat = CATALOG_CATEGORIES.find((c) => c.id === categoryId);
    return cat?.count || 0;
  };

  return (
    <div className="min-h-screen bg-[var(--bg-50)]">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-[var(--neutral-200)] bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-4">
            <Logo variant="blue" size="sm" href="/" />
            <span className="hidden font-serif text-lg font-semibold text-[var(--neutral-900)] md:block">
              Parts Catalog
            </span>
          </div>

          <div className="hidden flex-1 px-8 md:block md:max-w-md lg:max-w-lg">
            <div className="relative">
              <Icon
                name="search"
                size={18}
                className="absolute top-1/2 left-3 -translate-y-1/2 text-[var(--neutral-400)]"
              />
              <Input
                placeholder="Search parts by name, category, material..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10 w-full bg-[var(--bg-50)] pl-10 pr-4"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute top-1/2 right-3 -translate-y-1/2 text-[var(--neutral-400)] hover:text-[var(--neutral-600)]"
                >
                  <Icon name="x" size={16} />
                </button>
              )}
            </div>
          </div>

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
              Logout
            </Button>
          </div>
        </div>

        {/* Mobile search bar */}
        <div className="border-t border-[var(--neutral-100)] px-4 py-2 md:hidden">
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
              className="h-10 w-full bg-[var(--bg-50)] pl-10 pr-4"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute top-1/2 right-3 -translate-y-1/2 text-[var(--neutral-400)] hover:text-[var(--neutral-600)]"
              >
                <Icon name="x" size={16} />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8">
        <div className="flex gap-6 lg:gap-8">
          {/* Left Sidebar - Desktop */}
          <aside className="hidden w-64 flex-shrink-0 lg:block">
            <div className="sticky top-24 space-y-6">
              {/* Search in sidebar (mobile fallback) */}
              <div className="relative lg:hidden">
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

              {/* Category Filter */}
              <FilterSection title="Category">
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  <label className="flex cursor-pointer items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={selectedCategories.length === 0}
                      onChange={() => setSelectedCategories([])}
                      className="h-4 w-4 rounded border-[var(--neutral-300)]"
                    />
                    <span className="font-medium">All Parts</span>
                    <span className="text-xs text-[var(--neutral-400)]">
                      (465)
                    </span>
                  </label>
                  {CATALOG_CATEGORIES.map((cat) => (
                    <label
                      key={cat.id}
                      className="flex cursor-pointer items-center gap-2 text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes(cat.id)}
                        onChange={() => {
                          setSelectedCategories(
                            selectedCategories.includes(cat.id)
                              ? selectedCategories.filter((c) => c !== cat.id)
                              : [...selectedCategories, cat.id],
                          );
                        }}
                        className="h-4 w-4 rounded border-[var(--neutral-300)]"
                      />
                      <span className="flex-1">{cat.name}</span>
                      <span className="text-xs text-[var(--neutral-400)]">
                        ({cat.count})
                      </span>
                    </label>
                  ))}
                </div>
              </FilterSection>

              {/* Material Filter */}
              <FilterSection title="Material">
                <div className="space-y-2">
                  {ALL_MATERIALS.map((mat) => (
                    <label
                      key={mat}
                      className="flex cursor-pointer items-center gap-2 text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={selectedMaterials.includes(mat)}
                        onChange={() => {
                          setSelectedMaterials(
                            selectedMaterials.includes(mat)
                              ? selectedMaterials.filter((m) => m !== mat)
                              : [...selectedMaterials, mat],
                          );
                        }}
                        className="h-4 w-4 rounded border-[var(--neutral-300)]"
                      />
                      <span>{mat}</span>
                    </label>
                  ))}
                </div>
              </FilterSection>

              {/* Process Filter */}
              <FilterSection title="Process">
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {PROCESSES.map((proc) => (
                    <label
                      key={proc.name}
                      className="flex cursor-pointer items-center gap-2 text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={selectedProcesses.includes(proc.name)}
                        onChange={() => {
                          setSelectedProcesses(
                            selectedProcesses.includes(proc.name)
                              ? selectedProcesses.filter((p) => p !== proc.name)
                              : [...selectedProcesses, proc.name],
                          );
                        }}
                        className="h-4 w-4 rounded border-[var(--neutral-300)]"
                      />
                      <span className="flex-1">{proc.name}</span>
                    </label>
                  ))}
                </div>
              </FilterSection>

              {/* Finish Filter with Material Compatibility */}
              <FilterSection title="Finish">
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {ALL_FINISHES.map((finish) => {
                    const { compatible, reason } = getFinishCompatibilityStatus(
                      finish,
                      selectedMaterials,
                    );
                    return (
                      <FilterCheckbox
                        key={finish}
                        label={finish}
                        checked={selectedFinishes.includes(finish)}
                        disabled={!compatible}
                        onChange={() => {
                          setSelectedFinishes(
                            selectedFinishes.includes(finish)
                              ? selectedFinishes.filter((f) => f !== finish)
                              : [...selectedFinishes, finish],
                          );
                        }}
                        tooltip={!compatible ? reason : undefined}
                      />
                    );
                  })}
                </div>
              </FilterSection>

              {/* Clear All Filters */}
              {activeFilterCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={clearAllFilters}
                >
                  <Icon name="x" size={14} className="mr-2" />
                  Clear All Filters ({activeFilterCount})
                </Button>
              )}
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            {/* Results header */}
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-[var(--neutral-500)]">
                  {isLoading ? (
                    'Loading...'
                  ) : (
                    <>
                      Showing{' '}
                      <span className="font-medium text-[var(--neutral-900)]">
                        {totalCount}
                      </span>{' '}
                      of 465 parts
                      {activeFilterCount > 0 && (
                        <span className="text-[var(--neutral-400)]">
                          {' '}
                          (filtered by: {activeFiltersSummary})
                        </span>
                      )}
                    </>
                  )}
                </p>
              </div>

              <div className="flex items-center gap-4">
                {/* Mobile filter button */}
                <Button
                  variant="outline"
                  size="sm"
                  className="lg:hidden"
                  onClick={() => setMobileFilterOpen(true)}
                >
                  <Icon name="filter" size={16} className="mr-2" />
                  Filters
                  {activeFilterCount > 0 && (
                    <span className="ml-2 rounded-full bg-[var(--primary-100)] px-2 py-0.5 text-xs text-[var(--primary-700)]">
                      {activeFilterCount}
                    </span>
                  )}
                </Button>
              </div>
            </div>

            {/* Parts Grid */}
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-[var(--primary-700)]"></div>
              </div>
            ) : parts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Icon
                  name="search"
                  size={48}
                  className="mb-4 text-[var(--neutral-300)]"
                />
                <h3 className="mb-2 text-lg font-medium text-[var(--neutral-900)]">
                  No parts found
                </h3>
                <p className="mb-4 text-sm text-[var(--neutral-500)]">
                  Try adjusting your filters or search query
                </p>
                <Button variant="outline" onClick={clearAllFilters}>
                  Clear All Filters
                </Button>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {parts.map((part) => {
                  const categoryData = CATALOG_CATEGORIES.find(
                    (c) => c.id === part.category,
                  );
                  return (
                    <div
                      key={part.id}
                      className="group overflow-hidden rounded-xl border border-[var(--neutral-200)] bg-white transition-all hover:border-[var(--primary-300)] hover:shadow-md"
                    >
                      {/* Thumbnail */}
                      <div
                        className="aspect-square cursor-pointer bg-[var(--bg-100)]"
                        onClick={() => handlePreview(part.id)}
                      >
                        <img
                          src={part.thumbnail || '/placeholder.svg'}
                          alt={part.name}
                          className="h-full w-full object-cover transition-transform group-hover:scale-105"
                        />
                      </div>

                      {/* Content */}
                      <div className="p-4">
                        {/* Category badge */}
                        {categoryData && (
                          <div className="mb-2">
                            <span className="inline-flex items-center gap-1 rounded bg-[var(--accent-50)] px-2 py-0.5 text-xs text-[var(--accent-700)]">
                              <Icon name="box" size={12} />
                              {categoryData.name}
                            </span>
                          </div>
                        )}

                        {/* Title */}
                        <h3
                          className="mb-1 cursor-pointer font-medium text-[var(--neutral-900)] line-clamp-2 hover:text-[var(--primary-700)]"
                          onClick={() => handlePreview(part.id)}
                        >
                          {part.name}
                        </h3>

                        {/* Tags */}
                        <div className="mb-3 flex flex-wrap gap-1">
                          <span className="rounded bg-[var(--neutral-100)] px-2 py-0.5 text-xs text-[var(--neutral-600)]">
                            {part.material}
                          </span>
                          {part.process && (
                            <span className="rounded bg-[var(--neutral-100)] px-2 py-0.5 text-xs text-[var(--neutral-600)]">
                              {part.process}
                            </span>
                          )}
                          {part.finish && (
                            <span className="rounded bg-[var(--neutral-100)] px-2 py-0.5 text-xs text-[var(--neutral-600)]">
                              {part.finish}
                            </span>
                          )}
                        </div>

                        {/* Lead time */}
                        <p className="mb-3 text-xs text-[var(--neutral-500)]">
                          Lead time: {part.leadTime || '3-5 days'}
                        </p>

                        {/* Price and action */}
                        <div className="flex items-center justify-between">
                          <div>
                            <PriceDisplay
                              amount={part.basePrice}
                              variant="default"
                              className="text-lg"
                            />
                          </div>
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleQuickAdd(part);
                            }}
                          >
                            Add to Workspace
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

      {/* Mobile Filter Drawer */}
      <MobileFilterDrawer
        open={mobileFilterOpen}
        onClose={() => setMobileFilterOpen(false)}
        selectedCategories={selectedCategories}
        onCategoriesChange={setSelectedCategories}
        selectedMaterials={selectedMaterials}
        onMaterialsChange={setSelectedMaterials}
        selectedProcesses={selectedProcesses}
        onProcessesChange={setSelectedProcesses}
        selectedFinishes={selectedFinishes}
        onFinishesChange={setSelectedFinishes}
        onClearAll={clearAllFilters}
      />

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
