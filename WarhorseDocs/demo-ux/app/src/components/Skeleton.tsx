export default function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-wh-border-soft ${className}`} aria-hidden="true" />
}
