export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="card overflow-hidden">
      <div className="skeleton mb-4 h-8 w-48 rounded" />
      <div className="space-y-3">
        <div className="flex gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="skeleton h-4 flex-1 rounded" />
          ))}
        </div>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex gap-4">
            {Array.from({ length: 5 }).map((_, j) => (
              <div key={j} className="skeleton h-8 flex-1 rounded" />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

export function CardSkeleton() {
  return (
    <div className="card">
      <div className="skeleton mb-3 h-4 w-24 rounded" />
      <div className="skeleton h-8 w-32 rounded" />
    </div>
  )
}

export function DetailSkeleton() {
  return (
    <div className="card">
      <div className="skeleton mb-6 h-6 w-48 rounded" />
      <div className="space-y-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex gap-4">
            <div className="skeleton h-4 w-24 rounded" />
            <div className="skeleton h-4 flex-1 rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}
