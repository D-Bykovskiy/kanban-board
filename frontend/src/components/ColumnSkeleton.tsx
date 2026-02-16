import { TaskCardSkeleton } from './TaskCardSkeleton';

export function ColumnSkeleton() {
  return (
    <div className="flex flex-col w-80 min-w-[320px] max-w-[400px] rounded-2xl glass-column p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gray-200 rounded-lg animate-pulse"></div>
          <div>
            <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-1"></div>
            <div className="h-2 w-16 bg-gray-200 rounded-full animate-pulse"></div>
          </div>
        </div>
        <div className="w-8 h-8 bg-gray-200 rounded-xl animate-pulse"></div>
      </div>
      
      <div className="space-y-3">
        <TaskCardSkeleton />
        <TaskCardSkeleton />
        <TaskCardSkeleton />
      </div>
    </div>
  );
}
