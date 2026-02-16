export function TaskCardSkeleton() {
  return (
    <div className="glass-card rounded-xl p-4 border-l-4 border-l-gray-300 animate-pulse">
      <div className="flex items-center justify-between mb-3">
        <div className="h-5 w-16 bg-gray-200 rounded-full"></div>
        <div className="h-4 w-4 bg-gray-200 rounded"></div>
      </div>
      
      <div className="h-4 bg-gray-200 rounded mb-2 w-3/4"></div>
      <div className="h-3 bg-gray-200 rounded mb-3 w-full"></div>
      <div className="h-3 bg-gray-200 rounded mb-3 w-2/3"></div>
      
      <div className="flex gap-1.5 mb-3">
        <div className="h-5 w-12 bg-gray-200 rounded-lg"></div>
        <div className="h-5 w-14 bg-gray-200 rounded-lg"></div>
      </div>
      
      <div className="flex items-center justify-between pt-3 border-t border-gray-100/70">
        <div className="flex items-center gap-3">
          <div className="h-6 w-16 bg-gray-200 rounded-lg"></div>
          <div className="h-6 w-14 bg-gray-200 rounded-lg"></div>
        </div>
        <div className="h-6 w-10 bg-gray-200 rounded-lg"></div>
      </div>
    </div>
  );
}
