'use client';

import React from 'react';
import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Icon } from '@/components/ui/icon';

interface SegmentedPanelProps {
  title: string;
  icon?: string;
  isOpen?: boolean;
  defaultOpen?: boolean;
  onToggle?: (isOpen: boolean) => void;
  children: React.ReactNode;
  className?: string;
  allowMultipleOpen?: boolean;
}

export function SegmentedPanel({
  title,
  icon,
  isOpen: controlledIsOpen,
  defaultOpen = false,
  onToggle,
  children,
  className,
  allowMultipleOpen = true,
}: SegmentedPanelProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(defaultOpen);
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | 'auto'>('auto');

  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;

  useEffect(() => {
    if (contentRef.current) {
      if (isOpen) {
        setHeight(contentRef.current.scrollHeight);
        // After animation completes, set to auto for dynamic content
        const timeout = setTimeout(() => setHeight('auto'), 200);
        return () => clearTimeout(timeout);
      } else {
        setHeight(0);
      }
    }
  }, [isOpen, children]);

  const handleToggle = () => {
    const newIsOpen = !isOpen;
    if (onToggle) {
      onToggle(newIsOpen);
    } else {
      setInternalIsOpen(newIsOpen);
    }
  };

  return (
    <div className={cn('border-b border-[var(--neutral-200)]', className)}>
      <button
        type="button"
        onClick={handleToggle}
        className={cn(
          'w-full flex items-center justify-between px-4 py-3',
          'hover:bg-[var(--neutral-50)] transition-colors duration-150',
          'focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[var(--primary-500)]',
          'group'
        )}
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-3">
          {icon && (
            <Icon
              name={icon}
              className="w-4 h-4 text-[var(--neutral-500)] group-hover:text-[var(--primary-600)] transition-colors"
            />
          )}
          <span className="text-sm font-semibold text-[var(--neutral-700)]">
            {title}
          </span>
        </div>
        <Icon
          name="chevron-down"
          className={cn(
            'w-4 h-4 text-[var(--neutral-400)] transition-transform duration-200',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      <div
        ref={contentRef}
        className="overflow-hidden transition-all duration-200 ease-in-out"
        style={{ height: isOpen ? height : 0, opacity: isOpen ? 1 : 0 }}
      >
        <div className="px-4 pb-4">
          {children}
        </div>
      </div>
    </div>
  );
}

interface SegmentedPanelGroupProps {
  children: React.ReactNode;
  allowMultipleOpen?: boolean;
  className?: string;
}

export function SegmentedPanelGroup({
  children,
  allowMultipleOpen = true,
  className,
}: SegmentedPanelGroupProps) {
  const [openPanels, setOpenPanels] = useState<Set<number>>(new Set());

  const handleToggle = (index: number, isOpen: boolean) => {
    setOpenPanels((prev) => {
      const next = new Set(prev);
      if (isOpen) {
        if (!allowMultipleOpen) {
          next.clear();
        }
        next.add(index);
      } else {
        next.delete(index);
      }
      return next;
    });
  };

  return (
    <div className={cn('flex flex-col', className)}>
      {React.Children.map(children, (child, index) => {
        if (React.isValidElement<SegmentedPanelProps>(child)) {
          return React.cloneElement(child, {
            isOpen: openPanels.has(index),
            onToggle: (isOpen: boolean) => handleToggle(index, isOpen),
            allowMultipleOpen,
          });
        }
        return child;
      })}
    </div>
  );
}
