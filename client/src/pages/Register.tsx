import { useState } from "react"
import { useForm } from "react-hook-form"
import axios from "axios"
import { useNavigate } from "react-router-dom"
import SiteNav from "../components/SiteNav"
import { ArrowRightIcon, Spinner } from "../components/icons"
import { api } from "../api/client"

interface RegisterFormData{
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}


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
      await api.post("/api/auth/register", {
        username: data.username,
        email: data.email,
        password: data.password,
      })

      navigate("/login", { state: { registered: true } })

    } catch (error) {

      if (!axios.isAxiosError(error) || !error.response) {
        setServerError("Could not reach the server, please try again")
        return
      }

      const {status, data} = error.response

      if (status === 409) {
        if (data?.message === "USER ALREADY EXISTS") {
          setError("email", { type: "server", message: "An account with this email already exists" }, { shouldFocus: true })
          return
        }
        if (data?.message === "Username already exists") {
          setError("username", { type: "server", message: "This username is already taken" }, { shouldFocus: true })
          return
        }
      }

      setServerError(data?.message || "Something went wrong, please try again")
    }
  }

    return (
    <main className="flex min-h-screen flex-col bg-black text-white">
      <SiteNav
        actions={
          <button type="button" onClick={() => navigate("/login")} className="btn btn-secondary btn-sm">
            Log in
          </button>
        }
      />

      <section className="flex flex-1 items-center justify-center px-5 pb-16 pt-6 sm:px-8">
        <div className="rise-in w-full max-w-md">
          <h1 className="display mb-3">
            Create your account
          </h1>
          <p className="mb-8 text-[16px] leading-snug text-white/60 sm:text-[17px]">
            Sign up to save your medicines and check them anytime.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
            <div>
              <label htmlFor="username" className="field-label">
                Username
              </label>
              <input
                id="username"
                type="text"
                autoComplete="username"
                placeholder="jane_doe"
                aria-invalid={!!errors.username}
                className="field"
                {...register("username",{
                  required: "Username is required",
                  minLength:{
                    value: 3,
                    message: "Username must be at least 3 characters"
                  },
                  maxLength:{
                    value: 20,
                    message: "Username must be at most 20 characters"
                  },
                  pattern:{
                    value: /^[a-zA-Z0-9_]+$/,
                    message: "Only letters, numbers and underscores are allowed"
                  }
                })}
              />
              {errors.username && (
                <p className="field-error">{errors.username.message}</p>
              )}
            </div>

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
                autoComplete="new-password"
                placeholder="At least 8 characters"
                aria-invalid={!!errors.password}
                className="field"
                {...register("password",{
                  required: "Password is required",
                  minLength:{
                    value: 8,
                    message: "Password must be at least 8 characters"
                  },
                  pattern:{
                    value: /^(?=.*[A-Za-z])(?=.*\d).+$/,
                    message: "Password must contain at least one letter and one number"
                  }
                })}
              />
              {errors.password && (
                <p className="field-error">{errors.password.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="field-label">
                Confirm password
              </label>
              <input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                placeholder="Repeat your password"
                aria-invalid={!!errors.confirmPassword}
                className="field"
                {...register("confirmPassword",{
                  required: "Please confirm your password",
                  validate: (value) =>
                    value === getValues("password") || "Passwords do not match"
                })}
              />
              {errors.confirmPassword && (
                <p className="field-error">{errors.confirmPassword.message}</p>
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
              {isSubmitting ? "Creating account" : "Create account"}
              {isSubmitting ? <Spinner /> : <ArrowRightIcon size={17} />}
            </button>

            <p className="mt-2 text-center text-[14px] text-white/60">
              Already have an account?{" "}
              <button type="button" onClick={() => navigate("/login")} className="rounded-full text-white underline decoration-white/40 underline-offset-4 transition-colors hover:decoration-white">
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
