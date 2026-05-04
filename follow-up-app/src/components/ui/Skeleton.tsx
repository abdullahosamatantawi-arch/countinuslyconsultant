import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility for tailwind classes
 */
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

/**
 * Base Skeleton component for loading states
 */
export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-slate-200 dark:bg-slate-800", className)}
      {...props}
    />
  );
}

/**
 * Specifically designed to match the Mosque Project Card
 */
export function ProjectCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <Skeleton className="h-6 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2" />
          </div>
          <Skeleton className="h-10 w-24 rounded-full" />
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="p-3 bg-slate-50/50 rounded-xl">
            <Skeleton className="h-3 w-16 mb-2" />
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="p-3 bg-slate-50/50 rounded-xl">
            <Skeleton className="h-3 w-16 mb-2" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
        
        <div className="space-y-3">
          <div className="flex justify-between">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-10" />
          </div>
          <Skeleton className="h-2 w-full rounded-full" />
        </div>
      </div>
    </div>
  );
}

/**
 * Specifically designed to match the Projects Table Row
 */
export function TableRowSkeleton() {
  return (
    <tr className="border-b border-slate-50 animate-pulse">
      <td className="px-6 py-5"><Skeleton className="h-4 w-24" /></td>
      <td className="px-6 py-5"><Skeleton className="h-4 w-20" /></td>
      <td className="px-6 py-5"><Skeleton className="h-4 w-32" /></td>
      <td className="px-6 py-5"><Skeleton className="h-6 w-16 rounded-full" /></td>
      <td className="px-6 py-5"><Skeleton className="h-2 w-full rounded-full" /></td>
      <td className="px-6 py-5"><Skeleton className="h-4 w-24" /></td>
      <td className="px-6 py-5 text-left"><Skeleton className="h-8 w-8 rounded-lg" /></td>
    </tr>
  );
}

/**
 * Specifically designed to match the Dashboard KPI cards
 */
export function KPISkeleton() {
  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm animate-pulse">
      <div className="flex items-start justify-between">
        <div>
          <Skeleton className="h-3 w-32 mb-3" />
          <Skeleton className="h-10 w-12" />
        </div>
        <Skeleton className="w-12 h-12 rounded-2xl" />
      </div>
    </div>
  );
}

/**
 * Specifically designed to match the Dashboard Submissions Table Row (6 columns)
 */
export function DashboardTableSkeleton() {
  return (
    <tr className="border-b border-slate-50 animate-pulse">
      <td className="px-6 py-5">
        <Skeleton className="h-4 w-32 mb-2" />
        <Skeleton className="h-3 w-48" />
      </td>
      <td className="px-6 py-5"><Skeleton className="h-4 w-28" /></td>
      <td className="px-6 py-5"><Skeleton className="h-4 w-20" /></td>
      <td className="px-6 py-5"><Skeleton className="h-4 w-24" /></td>
      <td className="px-6 py-5"><Skeleton className="h-6 w-16 rounded-lg" /></td>
      <td className="px-6 py-5 text-center flex justify-center"><Skeleton className="h-8 w-28 rounded-lg" /></td>
    </tr>
  );
}
