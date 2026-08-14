import React from 'react';

export function DashboardSkeleton() {
  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-200">
      {/* Header Skeleton */}
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <div className="w-24 h-3 rounded-full skeleton-box"></div>
          <div className="w-40 h-7 rounded-xl skeleton-box"></div>
        </div>
        <div className="w-12 h-12 rounded-2xl skeleton-box"></div>
      </div>

      {/* Hero Passbook Card Skeleton */}
      <div className="h-48 rounded-[2.5rem] skeleton-box-dark p-6 flex flex-col justify-between">
        <div className="flex justify-between">
          <div className="w-28 h-4 rounded-lg bg-slate-800"></div>
          <div className="w-16 h-4 rounded-lg bg-slate-800"></div>
        </div>
        <div className="space-y-2">
          <div className="w-20 h-3 rounded-md bg-slate-800"></div>
          <div className="w-48 h-10 rounded-xl bg-slate-700"></div>
        </div>
        <div className="flex gap-4">
          <div className="w-24 h-8 rounded-xl bg-slate-800"></div>
          <div className="w-24 h-8 rounded-xl bg-slate-800"></div>
        </div>
      </div>

      {/* Quick Actions Skeleton */}
      <div className="grid grid-cols-4 gap-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-20 rounded-2xl skeleton-box"></div>
        ))}
      </div>

      {/* Passbook / Debt Section Skeleton */}
      <div className="space-y-3">
        <div className="w-36 h-5 rounded-lg skeleton-box"></div>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-2xl skeleton-box"></div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function TripListSkeleton() {
  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl skeleton-box"></div>
          <div className="space-y-2">
            <div className="w-20 h-3 rounded-full skeleton-box"></div>
            <div className="w-32 h-5 rounded-xl skeleton-box"></div>
          </div>
        </div>
        <div className="w-10 h-10 rounded-2xl skeleton-box"></div>
      </div>

      {/* Portfolio Card Skeleton */}
      <div className="h-36 rounded-[2.5rem] skeleton-box-dark p-5 flex flex-col justify-between">
        <div className="w-32 h-4 rounded-lg bg-slate-800"></div>
        <div className="w-44 h-8 rounded-xl bg-slate-700"></div>
        <div className="flex gap-4">
          <div className="w-20 h-4 rounded-md bg-slate-800"></div>
          <div className="w-20 h-4 rounded-md bg-slate-800"></div>
        </div>
      </div>

      {/* Trips Grid Skeleton */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <div className="w-28 h-5 rounded-lg skeleton-box"></div>
          <div className="w-14 h-4 rounded-lg skeleton-box"></div>
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-28 rounded-3xl skeleton-box"></div>
        ))}
      </div>
    </div>
  );
}

export function HistorySkeleton() {
  return (
    <div className="p-6 space-y-4 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl skeleton-box"></div>
        <div className="space-y-1">
          <div className="w-32 h-5 rounded-lg skeleton-box"></div>
          <div className="w-20 h-3 rounded-md skeleton-box"></div>
        </div>
      </div>

      {/* Search Bar Skeleton */}
      <div className="h-12 rounded-2xl skeleton-box"></div>

      {/* Filter Chips Skeleton */}
      <div className="flex gap-2 overflow-hidden">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="w-20 h-8 rounded-xl skeleton-box shrink-0"></div>
        ))}
      </div>

      {/* Transaction List Skeleton */}
      <div className="space-y-2.5 pt-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-20 rounded-2xl skeleton-box"></div>
        ))}
      </div>
    </div>
  );
}
