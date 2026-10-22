import { useState } from "react"
import { useForm } from "react-hook-form"
import axios from "axios"
import { useLocation, useNavigate } from "react-router-dom"
import LogoMark from "../components/LogoMark"
import { useAuthStore } from "../store/authStore"

interface LoginFormData{
  email: string;
  password: string;
}

const inputClass =
  "w-full rounded-full border bg-white/5 px-5 py-[0.7em] text-[15px] text-white placeholder:text-white/40 transition-colors focus:outline-none focus:border-white"

const Login = () => {

  const navigate = useNavigate()
  const location = useLocation()

  const login = useAuthStore((state)=>state.login)

  const state = location.state as {registered?: boolean, from:string} | null;

  const justRegistered = state?.registered;
  const from = state?.from || "/dashboard";
  

  const [serverError, setServerError] = useState("")

  const {register, handleSubmit, formState:{errors, isSubmitting, isValid}} = useForm<LoginFormData>({
    mode: "onTouched",
    defaultValues:{
      email: "",
      password: ""
    }
  })

  const onSubmit = async (data: LoginFormData) => {
    setServerError("")

    try {

      await login(data.email, data.password)
      navigate(from, { replace: true })

    } catch (error) {
      if (!axios.isAxiosError(error) || !error.response) {
        setServerError("could not reach the server, please try again")
        return
      }

      const { status, data} = error.response

      if (status === 401 || status === 404) {
        setServerError("incorrect email or password")
        return
      }

      setServerError(data?.message || "something went wrong, please try again")
    }
  }

  const borderFor = (hasError: boolean) =>
    hasError ? "border-red-400" : "border-white/30"

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
          onClick={() => navigate("/register")}
          className="inline-flex items-center justify-center whitespace-nowrap rounded-full border border-white bg-transparent px-5 py-[0.3em] text-[15px] text-white transition-colors duration-200 hover:bg-white hover:text-black sm:text-[17px]"
        >
          Sign up
        </button>
      </nav>

      <section className="flex flex-1 items-center justify-center px-5 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <h1 className="font-mainframe-heading mb-3 text-[clamp(30px,5vw,44px)] leading-[1.05] tracking-[-0.02em]">
            Welcome back
          </h1>
          <p className="mb-8 text-[16px] leading-snug text-white/70 sm:text-[17px]">
            Log in to check your medicines and their interactions.
          </p>

          {justRegistered && (
            <p role="status" className="mb-6 rounded-full border border-emerald-400/60 bg-emerald-400/10 px-5 py-[0.6em] text-[14px] text-emerald-300">
              account created, log in to continue
            </p>
          )}

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
            <div>
              <label htmlFor="email" className="mb-2 block pl-5 text-[13px] text-white/70">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                aria-invalid={!!errors.email}
                className={`${inputClass} ${borderFor(!!errors.email)}`}
                {...register("email",{
                  required: "email is required",
                  pattern:{
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: "enter a valid email address"
                  }
                })}
              />
              {errors.email && (
                <p className="mt-2 pl-5 text-[13px] text-red-400">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="mb-2 block pl-5 text-[13px] text-white/70">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="Your password"
                aria-invalid={!!errors.password}
                className={`${inputClass} ${borderFor(!!errors.password)}`}
                {...register("password",{
                  required: "password is required"
                })}
              />
              {errors.password && (
                <p className="mt-2 pl-5 text-[13px] text-red-400">{errors.password.message}</p>
              )}
            </div>

            {serverError && (
              <p role="alert" className="mt-2 rounded-full border border-red-400/60 bg-red-400/10 px-5 py-[0.6em] text-[14px] text-red-300">
                {serverError}
              </p>
            )}

            <button
              type="submit"
              disabled={!isValid || isSubmitting}
              className="mt-4 inline-flex items-center justify-center gap-3 rounded-full bg-white px-7 py-[0.65em] text-[15px] text-black transition-colors duration-200 hover:bg-white/80 disabled:cursor-not-allowed disabled:opacity-40 sm:text-[17px]"
            >
              {isSubmitting ? "Logging in..." : "Log in"}
              {!isSubmitting && <span aria-hidden="true">→</span>}
            </button>

            <p className="mt-2 text-center text-[14px] text-white/60">
              New to medSafe?{" "}
              <button type="button" onClick={() => navigate("/register")} className="text-white underline underline-offset-4 hover:opacity-60">
                Create an account
              </button>
            </p>
          </form>
        </div>
      </section>
    </main>
  )
}

export default Login
