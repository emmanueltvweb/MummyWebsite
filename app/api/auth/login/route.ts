import { audit } from "@/lib/server/audit"
import { authenticate, startSession, toPublicUser } from "@/lib/server/auth"
import { ApiError, parseBody, route } from "@/lib/server/api"
import { users } from "@/lib/cms/store"
import { loginInput } from "@/lib/cms/schemas"

export const POST = route(
  { auth: false, rateLimit: { limit: 8, windowMs: 10 * 60_000, key: "auth-login" } },
  async ({ request, ip }) => {
    const { email, password, remember } = await parseBody(request, loginInput)
    const result = await authenticate(email, password)
    if (!result.ok) {
      await audit(null, "auth.failed", "user", `Failed sign-in attempt for ${email}${result.reason === "suspended" ? " (suspended account)" : ""}`, { ip })
      if (result.reason === "suspended") {
        throw new ApiError(403, "This account has been suspended. Please contact a Super Admin.", "ACCOUNT_SUSPENDED")
      }
      throw new ApiError(401, "Invalid email or password", "INVALID_CREDENTIALS")
    }
    const user = (await users.update(result.user.id, { lastLoginAt: new Date().toISOString() })) ?? result.user
    await startSession(user, { remember })
    await audit(user, "auth.login", "user", `${user.name} signed in${remember ? " (remember me)" : ""}`, { entityId: user.id, ip })
    return toPublicUser(user)
  }
)
