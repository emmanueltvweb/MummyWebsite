"use client"

import { Suspense, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Poppins } from "next/font/google"
import { AlertCircle, Clock, Loader2, Lock, LockOpen, User } from "lucide-react"

import { AdminAuthProvider, useAuth } from "@/components/admin/admin-auth-provider"
import { LoginScenery } from "@/components/admin/login-scenery"
import { errorMessage } from "@/lib/admin/api-client"
import { cn } from "@/lib/utils"

const poppins = Poppins({ subsets: ["latin"], weight: ["400", "500", "600"] })

const pillInput =
  "h-12 w-full rounded-full border-2 border-white/60 bg-transparent pr-12 pl-5 text-[15px] text-white outline-none transition placeholder:text-white/85 focus:border-white focus:bg-white/5"

function LoginForm() {
  const { login } = useAuth()
  const params = useSearchParams()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(false)
  const [showForgot, setShowForgot] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const expired = params.get("reason") === "expired"

  const next = params.get("next")
  const destination = next && next.startsWith("/admin") && !next.startsWith("//") ? next : "/admin"

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading) return
    setError("")
    setLoading(true)
    try {
      await login(email, password, remember)
      // Full page load (not a client-side transition) so the new session cookie is used and any
      // cached "redirect to login" response from before signing in can't send us back here.
      window.location.replace(destination)
    } catch (err) {
      setError(errorMessage(err, "Unable to sign in"))
      setLoading(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-6" noValidate>
      {expired && !error && (
        <p role="status" className="flex items-start gap-2 rounded-2xl bg-white/12 px-4 py-3 text-sm text-white">
          <Clock className="mt-0.5 size-4 shrink-0" aria-hidden />
          Your session has expired. Please sign in again.
        </p>
      )}
      {error && (
        <p role="alert" className="flex items-start gap-2 rounded-2xl bg-red-500/25 px-4 py-3 text-sm text-white">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          {error}
        </p>
      )}

      <div className="relative">
        <label htmlFor="email" className="sr-only">Email address</label>
        <input
          id="email"
          type="email"
          autoComplete="username"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email address"
          className={pillInput}
        />
        <User className="pointer-events-none absolute top-1/2 right-5 size-[18px] -translate-y-1/2 text-white" aria-hidden />
      </div>

      <div className="relative">
        <label htmlFor="password" className="sr-only">Password</label>
        <input
          id="password"
          type={showPassword ? "text" : "password"}
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className={pillInput}
        />
        <button
          type="button"
          onClick={() => setShowPassword((v) => !v)}
          className="absolute top-1/2 right-3 -translate-y-1/2 rounded-full p-2 text-white transition hover:bg-white/10"
          aria-label={showPassword ? "Hide password" : "Show password"}
          title={showPassword ? "Hide password" : "Show password"}
        >
          {showPassword ? <LockOpen className="size-[18px]" /> : <Lock className="size-[18px]" />}
        </button>
      </div>

      <div className="flex items-center justify-between gap-3 text-sm text-white">
        <label
          htmlFor="remember"
          className="flex cursor-pointer items-center gap-2"
          title={remember ? "Stay signed in for 30 days" : "Sign out when the browser closes"}
        >
          <input
            id="remember"
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            className="size-3.5 cursor-pointer rounded-sm accent-white"
          />
          Remember me
        </label>
        <button
          type="button"
          onClick={() => setShowForgot((v) => !v)}
          className="text-white/90 transition hover:text-white hover:underline"
          aria-expanded={showForgot}
        >
          Forgot password?
        </button>
      </div>

      {showForgot && (
        <p role="status" className="rounded-2xl bg-white/12 px-4 py-3 text-sm leading-relaxed text-white/90">
          For security, passwords are reset by a Super Admin. Ask them to use <strong>Reset password</strong> on the Users page and
          they&apos;ll give you a temporary password.
        </p>
      )}

      <button
        type="submit"
        disabled={loading || !email || !password}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#F49500] text-[15px] font-medium text-[#14262f] shadow-lg transition hover:bg-[#e08800] disabled:cursor-not-allowed"
      >
        {loading && <Loader2 className="size-4 animate-spin" aria-hidden />}
        {loading ? "Signing in…" : "Login"}
      </button>

      <p className="text-center text-[15px] text-white">
        Not an admin?{" "}
        <Link href="/" className="font-semibold hover:underline">
          Back to website
        </Link>
      </p>
    </form>
  )
}

export default function AdminLoginPage() {
  return (
    <AdminAuthProvider enabled={false}>
      <div className={cn("relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12", poppins.className)}>
        <LoginScenery />

        <main className="relative w-full max-w-[420px]">
          <div className="relative rounded-[22px] border-2 border-white/45 bg-[#0d1d26]/55 px-8 pt-24 pb-10 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.6)] backdrop-blur-[14px] sm:px-10">
            {/* Title tab */}
            <div className="absolute top-0 left-1/2 flex h-[66px] w-[130px] -translate-x-1/2 items-center justify-center rounded-b-[20px] bg-[#F49500]">
              <h1 className="text-[28px] font-normal text-[#14262f]">Login</h1>
            </div>
            <Suspense>
              <LoginForm />
            </Suspense>
          </div>
        </main>
      </div>
    </AdminAuthProvider>
  )
}
