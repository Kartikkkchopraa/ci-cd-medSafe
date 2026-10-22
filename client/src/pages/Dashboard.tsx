import { useNavigate } from "react-router-dom"
import LogoMark from "../components/LogoMark"
import { useAuthStore } from "../store/authStore"

const Dashboard = () => {
  const navigate = useNavigate()
  const logout = useAuthStore((state) => state.logout)

  return (
    <main className="flex min-h-screen flex-col bg-black text-white">
      <nav className="flex items-center justify-between px-5 py-4 sm:px-8 sm:py-5">
        <button type="button" onClick={() => navigate("/")} className="flex items-center gap-2 text-white" aria-label="medSafe home">
          <LogoMark />
          <span className="font-mainframe-heading text-[21px] tracking-tight sm:text-[26px]">
            med<span className="text-white/70">Safe</span>
          </span>
        </button>

        <button
          type="button"
          onClick={logout}
          className="inline-flex items-center justify-center whitespace-nowrap rounded-full border border-white bg-transparent px-5 py-[0.3em] text-[15px] text-white transition-colors duration-200 hover:bg-white hover:text-black sm:text-[17px]"
        >
          Log out
        </button>
      </nav>

      <section className="flex flex-1 items-center px-5 py-10 sm:px-8 md:px-10">
        <div className="max-w-xl">
          <h1 className="font-mainframe-heading mb-3 text-[clamp(30px,5vw,44px)] leading-[1.05] tracking-[-0.02em]">
            Your dashboard
          </h1>
          <p className="text-[16px] leading-snug text-white/70 sm:text-[17px]">
            You&apos;re logged in. Only signed-in users can see this page.
          </p>
        </div>
      </section>
    </main>
  )
}

export default Dashboard
