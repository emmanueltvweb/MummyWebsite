import type { Post } from "./types"

/**
 * The image to use as a post's cover: the featured image if one is set,
 * otherwise the first image inside the article content.
 */
export function postCoverImage(post: Pick<Post, "featuredImage" | "content">): string {
  if (post.featuredImage) return post.featuredImage
  const match = post.content.match(/<img[^>]+src="(https:\/\/res\.cloudinary\.com\/[^"]+)"/i)
  return match ? match[1].replace(/&amp;/g, "&") : ""
}
