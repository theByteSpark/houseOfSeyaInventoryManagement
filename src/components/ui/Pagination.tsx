import { ChevronLeft, ChevronRight } from 'lucide-react';
import { IconButton } from './IconButton';
import { Select } from './Select';

const PAGE_SIZE_OPTIONS = [10, 20, 50];

interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

export function Pagination({ page, pageSize, total, onPageChange, onPageSizeChange }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-graphite-100 px-4 py-3 text-sm text-graphite-500">
      <div className="flex items-center gap-2">
        <span>Rows per page</span>
        <Select
          aria-label="Rows per page"
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          className="w-auto py-1"
        >
          {PAGE_SIZE_OPTIONS.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </Select>
      </div>

      <div className="flex items-center gap-3">
        <span>
          {start}–{end} of {total}
        </span>
        <div className="flex items-center gap-1">
          <IconButton
            label="Previous page"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
          >
            <ChevronLeft className="h-4 w-4" strokeWidth={2} />
          </IconButton>
          <IconButton
            label="Next page"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
          >
            <ChevronRight className="h-4 w-4" strokeWidth={2} />
          </IconButton>
        </div>
      </div>
    </div>
  );
}
