import { ApiError } from "@/lib/server/api"
import { can, type SessionUser } from "@/lib/server/auth"
import type { Post, PostStatus } from "./types"

/** Without `blog.edit_any`, users may only work on their own posts. */
export function assertCanEditPost(user: SessionUser, post: Pick<Post, "authorId">) {
  if (!can(user, "blog.edit_any") && post.authorId !== user.id) {
    throw new ApiError(403, "You can only edit your own posts", "FORBIDDEN")
  }
}

/** Publishing, scheduling and archiving need `blog.publish`; everyone with blog access can save drafts. */
export function assertCanSetStatus(user: SessionUser, status: PostStatus) {
  if (status !== "draft" && !can(user, "blog.publish")) {
    throw new ApiError(403, "You can save drafts only. Someone with publishing rights will publish your post.", "FORBIDDEN")
  }
}
