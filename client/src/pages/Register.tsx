import { useState } from "react"
import { useForm } from "react-hook-form"
import axios from "axios"
import { useNavigate } from "react-router-dom"
import LogoMark from "../components/LogoMark"

interface RegisterFormData{
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

const inputClass =
  "w-full rounded-full border bg-white/5 px-5 py-[0.7em] text-[15px] text-white placeholder:text-white/40 transition-colors focus:outline-none focus:border-white"

const Register = () => {
  const navigate = useNavigate()
  const [serverError, setServerError] = useState("")

  const {register, handleSubmit, getValues, setError, formState:{errors, isSubmitting, isValid}} = useForm<RegisterFormData>({
    mode: "onTouched",
    defaultValues:{
      username: "",
      email: "",
      password: "",
      confirmPassword: ""
    }
  })

  const onSubmit = async (data: RegisterFormData) => {
    setServerError("")

    try {
      await axios.post("/api/auth/register", {
        username: data.username,
        email: data.email,
        password: data.password,
      })

      navigate("/login", { state: { registered: true } })

    } catch (error) {

      if (!axios.isAxiosError(error) || !error.response) {
        setServerError("could not reach the server, please try again")
        return
      }

      const {status, data} = error.response

      if (status === 409) {
        if (data?.message === "USER ALREADY EXISTS") {
          setError("email", { type: "server", message: "an account with this email already exists" }, { shouldFocus: true })
          return
        }
        if (data?.message === "Username already exists") {
          setError("username", { type: "server", message: "this username is already taken" }, { shouldFocus: true })
          return
        }
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
          onClick={() => navigate("/login")}
          className="inline-flex items-center justify-center whitespace-nowrap rounded-full border border-white bg-transparent px-5 py-[0.3em] text-[15px] text-white transition-colors duration-200 hover:bg-white hover:text-black sm:text-[17px]"
        >
          Log in
        </button>
      </nav>

      <section className="flex flex-1 items-center justify-center px-5 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <h1 className="font-mainframe-heading mb-3 text-[clamp(30px,5vw,44px)] leading-[1.05] tracking-[-0.02em]">
            Create your account
          </h1>
          <p className="mb-8 text-[16px] leading-snug text-white/70 sm:text-[17px]">
            Sign up to save your medicines and check them anytime.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
            <div>
              <label htmlFor="username" className="mb-2 block pl-5 text-[13px] text-white/70">
                Username
              </label>
              <input
                id="username"
                type="text"
                autoComplete="username"
                placeholder="jane_doe"
                aria-invalid={!!errors.username}
                className={`${inputClass} ${borderFor(!!errors.username)}`}
                {...register("username",{
                  required: "username is required",
                  minLength:{
                    value: 3,
                    message: "username must be at least 3 characters"
                  },
                  maxLength:{
                    value: 20,
                    message: "username must be at most 20 characters"
                  },
                  pattern:{
                    value: /^[a-zA-Z0-9_]+$/,
                    message: "only letters, numbers and underscores are allowed"
                  }
                })}
              />
              {errors.username && (
                <p className="mt-2 pl-5 text-[13px] text-red-400">{errors.username.message}</p>
              )}
            </div>

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
                autoComplete="new-password"
                placeholder="At least 8 characters"
                aria-invalid={!!errors.password}
                className={`${inputClass} ${borderFor(!!errors.password)}`}
                {...register("password",{
                  required: "password is required",
                  minLength:{
                    value: 8,
                    message: "password must be at least 8 characters"
                  },
                  pattern:{
                    value: /^(?=.*[A-Za-z])(?=.*\d).+$/,
                    message: "password must contain at least one letter and one number"
                  }
                })}
              />
              {errors.password && (
                <p className="mt-2 pl-5 text-[13px] text-red-400">{errors.password.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="mb-2 block pl-5 text-[13px] text-white/70">
                Confirm password
              </label>
              <input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                placeholder="Repeat your password"
                aria-invalid={!!errors.confirmPassword}
                className={`${inputClass} ${borderFor(!!errors.confirmPassword)}`}
                {...register("confirmPassword",{
                  required: "please confirm your password",
                  validate: (value) =>
                    value === getValues("password") || "passwords do not match"
                })}
              />
              {errors.confirmPassword && (
                <p className="mt-2 pl-5 text-[13px] text-red-400">{errors.confirmPassword.message}</p>
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
              {isSubmitting ? "Creating account..." : "Create account"}
              {!isSubmitting && <span aria-hidden="true">→</span>}
            </button>

            <p className="mt-2 text-center text-[14px] text-white/60">
              Already have an account?{" "}
              <button type="button" onClick={() => navigate("/login")} className="text-white underline underline-offset-4 hover:opacity-60">
                Log in
              </button>
            </p>
          </form>
        </div>
      </section>
    </main>
  )
}

export default Register
