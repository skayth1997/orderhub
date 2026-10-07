import { buttonClass } from '../ui';

interface PagerProps {
  page: number;
  hasNext: boolean;
  onChange: (page: number) => void;
}

export function Pager({ page, hasNext, onChange }: PagerProps) {
  return (
    <div className="mt-4 flex items-center gap-3 text-sm">
      <button
        className={buttonClass}
        disabled={page === 1}
        onClick={() => onChange(page - 1)}
      >
        Previous
      </button>
      <span>Page {page}</span>
      <button
        className={buttonClass}
        disabled={!hasNext}
        onClick={() => onChange(page + 1)}
      >
        Next
      </button>
    </div>
  );
}
