interface PagerProps {
  page: number;
  hasNext: boolean;
  onChange: (page: number) => void;
}

export function Pager({ page, hasNext, onChange }: PagerProps) {
  return (
    <div className="pager">
      <button disabled={page === 1} onClick={() => onChange(page - 1)}>
        Previous
      </button>
      <span>Page {page}</span>
      <button disabled={!hasNext} onClick={() => onChange(page + 1)}>
        Next
      </button>
    </div>
  );
}
