import { Navigate, Outlet, useLocation } from "react-router-dom"
import { useAuthStore } from "../store/authStore"
import LogoMark from "../components/LogoMark"

function FullScreenLoader() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-black text-white">
      <div className="animate-pulse" aria-label="Loading">
        <LogoMark />
      </div>
    </main>
  )
}


export function ProtectedRoute() {
  const status = useAuthStore((state) => state.status)
  const location = useLocation()

  if (status === "loading") return <FullScreenLoader />

  if (status === "unauthenticated") {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return <Outlet />
}


export function PublicOnlyRoute() {
  const status = useAuthStore((state) => state.status)
  const location = useLocation()

  if (status === "loading") return <FullScreenLoader />

  if (status === "authenticated") {
    const from = (location.state as { from?: string } | null)?.from
    return <Navigate to={from || "/search"} replace />
  }

  return <Outlet />
}
