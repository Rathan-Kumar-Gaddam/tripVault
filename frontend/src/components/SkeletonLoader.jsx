export function DashboardSkeleton() {
  return (
    <div className="p-4 sm:p-6 md:p-8 lg:p-10 space-y-6 animate-in fade-in duration-200">
      {/* Header Skeleton */}
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <div className="w-24 h-3 rounded-full skeleton-box"></div>
          <div className="w-48 h-8 rounded-xl skeleton-box"></div>
        </div>
        <div className="w-10 h-10 rounded-2xl skeleton-box"></div>
      </div>

      {/* Hero Overview Card Skeleton */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex justify-between items-center">
          <div className="w-32 h-3.5 rounded-full skeleton-box"></div>
          <div className="w-20 h-6 rounded-xl skeleton-box"></div>
        </div>
        <div className="w-56 h-10 rounded-2xl skeleton-box"></div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 rounded-2xl bg-slate-50 border border-slate-100 p-3 flex flex-col justify-between">
              <div className="w-12 h-2.5 rounded-md skeleton-box"></div>
              <div className="w-20 h-4 rounded-md skeleton-box"></div>
            </div>
          ))}
        </div>
      </div>

      {/* Settlements Strip Skeleton */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs space-y-3">
        <div className="w-36 h-4 rounded-lg skeleton-box"></div>
        <div className="space-y-2">
          <div className="h-14 rounded-2xl skeleton-box"></div>
          <div className="h-14 rounded-2xl skeleton-box"></div>
        </div>
      </div>

      {/* Mid Sections Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="h-44 rounded-3xl bg-white border border-slate-200/90 shadow-xs p-6 space-y-3">
          <div className="w-32 h-4 rounded-lg skeleton-box"></div>
          <div className="w-full h-8 rounded-xl skeleton-box"></div>
          <div className="w-3/4 h-8 rounded-xl skeleton-box"></div>
        </div>
        <div className="h-44 rounded-3xl bg-white border border-slate-200/90 shadow-xs p-6 space-y-3">
          <div className="w-32 h-4 rounded-lg skeleton-box"></div>
          <div className="w-full h-8 rounded-xl skeleton-box"></div>
          <div className="w-3/4 h-8 rounded-xl skeleton-box"></div>
        </div>
      </div>
    </div>
  );
}

export function TripListSkeleton() {
  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto space-y-6 sm:space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex justify-between items-center pb-1">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl skeleton-box"></div>
          <div className="space-y-1.5">
            <div className="w-32 h-6 rounded-xl skeleton-box"></div>
            <div className="w-48 h-3 rounded-full skeleton-box"></div>
          </div>
        </div>
        <div className="flex gap-2">
          <div className="w-24 h-9 rounded-2xl skeleton-box"></div>
          <div className="w-24 h-9 rounded-2xl skeleton-box"></div>
        </div>
      </div>

      {/* Net Balance Card Skeleton (Clean Light White) */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
        <div className="space-y-2">
          <div className="w-36 h-3 rounded-full skeleton-box"></div>
          <div className="w-52 h-9 rounded-2xl skeleton-box"></div>
        </div>
        <div className="w-24 h-8 rounded-xl skeleton-box"></div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="w-full sm:w-80 h-10 rounded-2xl skeleton-box"></div>
        <div className="w-full sm:w-48 h-10 rounded-xl skeleton-box"></div>
      </div>

      {/* Trips Grid Skeleton (Clean Light White Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl skeleton-box"></div>
              <div className="space-y-1.5 flex-1">
                <div className="w-28 h-4 rounded-md skeleton-box"></div>
                <div className="w-16 h-3 rounded-md skeleton-box"></div>
              </div>
            </div>
            <div className="h-10 rounded-xl bg-slate-50 border border-slate-100 p-2.5 flex items-center justify-between">
              <div className="w-16 h-3 rounded-md skeleton-box"></div>
              <div className="w-20 h-4 rounded-md skeleton-box"></div>
            </div>
            <div className="flex items-center justify-between pt-1">
              <div className="w-16 h-5 rounded-full skeleton-box"></div>
              <div className="w-20 h-5 rounded-full skeleton-box"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function HistorySkeleton() {
  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl skeleton-box"></div>
        <div className="space-y-1.5">
          <div className="w-44 h-6 rounded-lg skeleton-box"></div>
          <div className="w-28 h-3 rounded-md skeleton-box"></div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white border border-slate-200/90 rounded-3xl p-4 shadow-xs space-y-2">
            <div className="w-12 h-3 rounded-md skeleton-box"></div>
            <div className="w-20 h-5 rounded-md skeleton-box"></div>
          </div>
        ))}
      </div>

      {/* Search Bar Skeleton */}
      <div className="h-11 rounded-2xl bg-white border border-slate-200/90 skeleton-box"></div>

      {/* Transaction List Skeleton */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-3 divide-y divide-slate-100 space-y-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="py-3 px-2 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl skeleton-box"></div>
              <div className="space-y-1">
                <div className="w-32 h-4 rounded-md skeleton-box"></div>
                <div className="w-20 h-3 rounded-md skeleton-box"></div>
              </div>
            </div>
            <div className="w-16 h-5 rounded-md skeleton-box"></div>
          </div>
        ))}
      </div>
    </div>
  );
}
