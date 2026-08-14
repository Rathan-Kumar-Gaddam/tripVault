import React from 'react';

export function DashboardSkeleton() {
  return (
    <div className="p-4 sm:p-6 md:p-8 lg:p-10 space-y-6 animate-in fade-in duration-200">
      {/* Header Skeleton */}
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <div className="w-24 h-3 rounded-full skeleton-box"></div>
          <div className="w-48 h-8 rounded-xl skeleton-box"></div>
        </div>
        <div className="w-12 h-12 rounded-2xl skeleton-box"></div>
      </div>

      {/* Hero Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 h-56 rounded-[2.5rem] skeleton-box-dark p-6 flex flex-col justify-between">
          <div className="flex justify-between">
            <div className="w-28 h-4 rounded-lg bg-slate-800"></div>
            <div className="w-16 h-4 rounded-lg bg-slate-800"></div>
          </div>
          <div className="space-y-2">
            <div className="w-20 h-3 rounded-md bg-slate-800"></div>
            <div className="w-48 h-10 rounded-xl bg-slate-700"></div>
          </div>
          <div className="flex gap-4">
            <div className="w-28 h-8 rounded-xl bg-slate-800"></div>
            <div className="w-28 h-8 rounded-xl bg-slate-800"></div>
          </div>
        </div>

        <div className="lg:col-span-5 grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 rounded-2xl skeleton-box"></div>
          ))}
        </div>
      </div>

      {/* Mid Sections Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-48 rounded-[2.5rem] skeleton-box p-6"></div>
        <div className="h-48 rounded-[2.5rem] skeleton-box p-6"></div>
      </div>
    </div>
  );
}

export function TripListSkeleton() {
  return (
    <div className="p-4 sm:p-6 md:p-8 lg:p-10 space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl skeleton-box"></div>
          <div className="space-y-2">
            <div className="w-20 h-3 rounded-full skeleton-box"></div>
            <div className="w-32 h-6 rounded-xl skeleton-box"></div>
          </div>
        </div>
        <div className="w-11 h-11 rounded-2xl skeleton-box"></div>
      </div>

      {/* Portfolio Card Skeleton */}
      <div className="h-40 rounded-[2.5rem] skeleton-box-dark p-6 flex flex-col justify-between">
        <div className="w-32 h-4 rounded-lg bg-slate-800"></div>
        <div className="w-44 h-8 rounded-xl bg-slate-700"></div>
        <div className="flex gap-4">
          <div className="w-28 h-4 rounded-md bg-slate-800"></div>
          <div className="w-28 h-4 rounded-md bg-slate-800"></div>
        </div>
      </div>

      {/* Trips Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-36 rounded-[2rem] skeleton-box"></div>
        ))}
      </div>
    </div>
  );
}

export function HistorySkeleton() {
  return (
    <div className="p-4 sm:p-6 md:p-8 lg:p-10 space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl skeleton-box"></div>
        <div className="space-y-1.5">
          <div className="w-44 h-6 rounded-lg skeleton-box"></div>
          <div className="w-28 h-3 rounded-md skeleton-box"></div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 rounded-3xl skeleton-box"></div>
        ))}
      </div>

      {/* Search Bar Skeleton */}
      <div className="h-12 rounded-2xl skeleton-box"></div>

      {/* Transaction List Skeleton */}
      <div className="space-y-3 pt-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-20 rounded-2xl skeleton-box"></div>
        ))}
      </div>
    </div>
  );
}
