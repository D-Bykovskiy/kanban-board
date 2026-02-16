import { useState } from 'react';
import { Search, Filter, X, ChevronDown, Tag, User, Calendar, Flag } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { TaskFilter } from '../types';
import { TaskStatus, TaskPriority } from '../types';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface FilterBarProps {
  filter: TaskFilter;
  onFilterChange: (filter: TaskFilter) => void;
  availableTags: string[];
  availableAssignees: string[];
}

const statusOptions: { value: TaskStatus | ''; label: string; color: string }[] = [
  { value: '', label: 'All Statuses', color: 'bg-gray-100 text-gray-700' },
  { value: TaskStatus.TODO, label: 'To Do', color: 'bg-gray-100 text-gray-700' },
  { value: TaskStatus.IN_PROGRESS, label: 'In Progress', color: 'bg-blue-100 text-blue-700' },
  { value: TaskStatus.DONE, label: 'Done', color: 'bg-green-100 text-green-700' },
];

const priorityOptions: { value: TaskPriority | ''; label: string; color: string }[] = [
  { value: '', label: 'All Priorities', color: 'bg-gray-100 text-gray-700' },
  { value: TaskPriority.LOW, label: 'Low', color: 'bg-green-100 text-green-700' },
  { value: TaskPriority.MEDIUM, label: 'Medium', color: 'bg-amber-100 text-amber-700' },
  { value: TaskPriority.HIGH, label: 'High', color: 'bg-red-100 text-red-700' },
];

interface FilterChip {
  key: string;
  label: string;
  onRemove: () => void;
  icon?: React.ReactNode;
  color?: string;
}

export function FilterBar({
  filter,
  onFilterChange,
  availableTags,
  availableAssignees,
}: FilterBarProps) {
  const [showFilters, setShowFilters] = useState(false);

  const hasActiveFilters =
    filter.status || filter.priority || filter.tags?.length || filter.assignee || filter.search;

  const clearFilters = () => {
    onFilterChange({});
  };

  const updateFilter = (updates: Partial<TaskFilter>) => {
    onFilterChange({ ...filter, ...updates });
  };

  // Build filter chips
  const filterChips: FilterChip[] = [];
  
  if (filter.search) {
    filterChips.push({
      key: 'search',
      label: `Search: "${filter.search}"`,
      onRemove: () => updateFilter({ search: undefined }),
      icon: <Search className="w-3 h-3" />,
      color: 'bg-purple-100 text-purple-700 border-purple-200',
    });
  }

  if (filter.status) {
    const statusLabel = statusOptions.find(s => s.value === filter.status)?.label || filter.status;
    filterChips.push({
      key: 'status',
      label: `Status: ${statusLabel}`,
      onRemove: () => updateFilter({ status: undefined }),
      icon: <Calendar className="w-3 h-3" />,
      color: 'bg-blue-100 text-blue-700 border-blue-200',
    });
  }

  if (filter.priority) {
    const priorityLabel = priorityOptions.find(p => p.value === filter.priority)?.label || filter.priority;
    filterChips.push({
      key: 'priority',
      label: `Priority: ${priorityLabel}`,
      onRemove: () => updateFilter({ priority: undefined }),
      icon: <Flag className="w-3 h-3" />,
      color: 'bg-red-100 text-red-700 border-red-200',
    });
  }

  if (filter.assignee) {
    filterChips.push({
      key: 'assignee',
      label: `Assignee: ${filter.assignee}`,
      onRemove: () => updateFilter({ assignee: undefined }),
      icon: <User className="w-3 h-3" />,
      color: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    });
  }

  filter.tags?.forEach((tag) => {
    filterChips.push({
      key: `tag-${tag}`,
      label: `Tag: ${tag}`,
      onRemove: () => updateFilter({ tags: filter.tags?.filter((t) => t !== tag) }),
      icon: <Tag className="w-3 h-3" />,
      color: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    });
  });

  return (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 space-y-4">
      {/* Search Row */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={filter.search || ''}
            onChange={(e) => updateFilter({ search: e.target.value || undefined })}
            placeholder="Search tasks..."
            className="w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
          />
          {filter.search && (
            <button
              onClick={() => updateFilter({ search: undefined })}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          )}
        </div>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg border transition-all font-medium',
            showFilters || hasActiveFilters
              ? 'bg-blue-50 dark:bg-blue-900/50 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-400'
              : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
          )}
        >
          <Filter className="w-4 h-4" />
          Filters
          {hasActiveFilters && (
            <span className="ml-1 bg-blue-600 text-white text-xs px-1.5 py-0.5 rounded-full">
              {filterChips.length}
            </span>
          )}
          <ChevronDown
            className={cn('w-4 h-4 transition-transform duration-200', showFilters && 'rotate-180')}
          />
        </button>

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
            Clear all
          </button>
        )}
      </div>

      {/* Active Filter Chips */}
      {filterChips.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 animate-fade-in">
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Active:
          </span>
          {filterChips.map((chip) => (
            <button
              key={chip.key}
              onClick={chip.onRemove}
              className={cn(
                'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all duration-200 hover:scale-105',
                chip.color,
                'dark:bg-opacity-20 dark:border-opacity-30'
              )}
            >
              {chip.icon}
              <span>{chip.label}</span>
              <X className="w-3 h-3 ml-0.5 opacity-70 hover:opacity-100" />
            </button>
          ))}
        </div>
      )}

      {/* Filter Options */}
      {showFilters && (
        <div className="flex flex-wrap items-center gap-4 pt-3 border-t border-gray-100 dark:border-gray-700 animate-slide-in">
          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">Status:</span>
            <select
              value={filter.status || ''}
              onChange={(e) =>
                updateFilter({ status: (e.target.value as TaskStatus) || undefined })
              }
              className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none dark:bg-gray-700 dark:text-white"
            >
              {statusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Priority Filter */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">Priority:</span>
            <select
              value={filter.priority || ''}
              onChange={(e) =>
                updateFilter({ priority: (e.target.value as TaskPriority) || undefined })
              }
              className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none dark:bg-gray-700 dark:text-white"
            >
              {priorityOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Assignee Filter */}
          {availableAssignees.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">Assignee:</span>
              <select
                value={filter.assignee || ''}
                onChange={(e) =>
                  updateFilter({ assignee: e.target.value || undefined })
                }
                className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none dark:bg-gray-700 dark:text-white"
              >
                <option value="">All Assignees</option>
                {availableAssignees.map((assignee) => (
                  <option key={assignee} value={assignee}>
                    {assignee}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Tags Filter */}
          {availableTags.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">Tags:</span>
              <div className="flex gap-1.5 flex-wrap">
                {availableTags.slice(0, 10).map((tag) => {
                  const isSelected = filter.tags?.includes(tag);
                  return (
                    <button
                      key={tag}
                      onClick={() => {
                        const currentTags = filter.tags || [];
                        if (isSelected) {
                          updateFilter({ tags: currentTags.filter((t) => t !== tag) });
                        } else {
                          updateFilter({ tags: [...currentTags, tag] });
                        }
                      }}
                      className={cn(
                        'px-2.5 py-1 text-xs rounded-full transition-all duration-200 border',
                        isSelected
                          ? 'bg-blue-100 dark:bg-blue-900/50 border-blue-300 dark:border-blue-700 text-blue-800 dark:text-blue-300'
                          : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600'
                      )}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
