import { useState } from "react"
import { useForm } from "react-hook-form"
import axios from "axios"
import { useLocation, useNavigate } from "react-router-dom"
import SiteNav from "../components/SiteNav"
import { ArrowRightIcon, Spinner } from "../components/icons"
import { useAuthStore } from "../store/authStore"

interface LoginFormData{
  email: string;
  password: string;
}


const Login = () => {

  const navigate = useNavigate()
  const location = useLocation()

  const login = useAuthStore((state)=>state.login)

  const state = location.state as {registered?: boolean, from:string} | null;

  const justRegistered = state?.registered;
  const from = state?.from || "/search";
  

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
        setServerError("Could not reach the server, please try again")
        return
      }

      const { status, data} = error.response

      if (status === 401 || status === 404) {
        setServerError("Incorrect email or password")
        return
      }

      setServerError(data?.message || "Something went wrong, please try again")
    }
  }

    return (
    <main className="flex min-h-screen flex-col bg-black text-white">
      <SiteNav
        actions={
          <button type="button" onClick={() => navigate("/register")} className="btn btn-secondary btn-sm">
            Sign up
          </button>
        }
      />

      <section className="flex flex-1 items-center justify-center px-5 pb-16 pt-6 sm:px-8">
        <div className="rise-in w-full max-w-md">
          <h1 className="display mb-3">
            Welcome back
          </h1>
          <p className="mb-8 text-[16px] leading-snug text-white/60 sm:text-[17px]">
            Log in to check your medicines and their interactions.
          </p>

          {justRegistered && (
            <p role="status" className="callout callout-success mb-6">
              Account created. Log in to continue.
            </p>
          )}

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
            <div>
              <label htmlFor="email" className="field-label">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                aria-invalid={!!errors.email}
                className="field"
                {...register("email",{
                  required: "Email is required",
                  pattern:{
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: "Enter a valid email address"
                  }
                })}
              />
              {errors.email && (
                <p className="field-error">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="field-label">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="Your password"
                aria-invalid={!!errors.password}
                className="field"
                {...register("password",{
                  required: "Password is required"
                })}
              />
              {errors.password && (
                <p className="field-error">{errors.password.message}</p>
              )}
            </div>

            {serverError && (
              <p role="alert" className="callout callout-error mt-2">
                {serverError}
              </p>
            )}

            <button
              type="submit"
              disabled={!isValid || isSubmitting}
              className="btn btn-primary btn-lg mt-4"
            >
              {isSubmitting ? "Logging in" : "Log in"}
              {isSubmitting ? <Spinner /> : <ArrowRightIcon size={17} />}
            </button>

            <p className="mt-2 text-center text-[14px] text-white/60">
              New to medSafe?{" "}
              <button type="button" onClick={() => navigate("/register")} className="rounded-full text-white underline decoration-white/40 underline-offset-4 transition-colors hover:decoration-white">
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
