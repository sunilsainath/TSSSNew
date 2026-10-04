/** Minimal chrome for the admin sign-in screen (no guard, no public header). */
export default function AdminAuthLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-ink-950">{children}</div>;
}
