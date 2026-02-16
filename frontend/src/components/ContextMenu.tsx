import { useEffect, useRef } from 'react';
import { Edit2, Trash2, Copy } from 'lucide-react';

interface ContextMenuItem {
  label: string;
  onClick: () => void;
  icon?: React.ReactNode;
  danger?: boolean;
}

interface ContextMenuProps {
  x: number;
  y: number;
  items: ContextMenuItem[];
  onClose: () => void;
}

export function ContextMenu({ x, y, items, onClose }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  // Adjust position if menu goes off screen
  const adjustedX = Math.min(x, window.innerWidth - 200);
  const adjustedY = Math.min(y, window.innerHeight - items.length * 40);

  return (
    <div
      ref={menuRef}
      style={{ top: adjustedY, left: adjustedX }}
      className="fixed z-[150] min-w-[160px] bg-white rounded-xl shadow-2xl border border-gray-100 py-1.5 animate-scale-in"
    >
      {items.map((item, index) => (
        <button
          key={index}
          onClick={() => {
            item.onClick();
            onClose();
          }}
          className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
            item.danger
              ? 'text-red-600 hover:bg-red-50'
              : 'text-gray-700 hover:bg-gray-50'
          }`}
        >
          {item.icon && <span className="flex-shrink-0">{item.icon}</span>}
          <span className="font-medium">{item.label}</span>
        </button>
      ))}
    </div>
  );
}

// Predefined menu items for TaskCard
export const createTaskContextMenuItems = (
  onEdit: () => void,
  onDelete: () => void,
  _onMove?: (status: string) => void,
  taskId?: string
): ContextMenuItem[] => [
  {
    label: 'Edit',
    onClick: onEdit,
    icon: <Edit2 className="w-4 h-4" />,
  },
  {
    label: 'Copy Link',
    onClick: () => {
      if (taskId) {
        navigator.clipboard.writeText(`${window.location.origin}/task/${taskId}`);
      }
    },
    icon: <Copy className="w-4 h-4" />,
  },
  {
    label: 'Delete',
    onClick: onDelete,
    icon: <Trash2 className="w-4 h-4" />,
    danger: true,
  },
];
