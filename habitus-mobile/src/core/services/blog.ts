import { getSupabase } from "../client";
import type { BlogPost } from "../types/models";

type BlogRow = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  body_md: string;
  cover_image_url: string | null;
  author_name: string;
  published_at: string;
  tags: string[];
};

function mapPost(row: BlogRow): BlogPost {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    bodyMd: row.body_md,
    coverImageUrl: row.cover_image_url,
    authorName: row.author_name,
    publishedAt: row.published_at,
    tags: row.tags ?? [],
  };
}

export async function fetchBlogPosts(): Promise<BlogPost[]> {
  const { data, error } = await getSupabase()
    .from("habitus_blog_posts")
    .select("id, slug, title, excerpt, body_md, cover_image_url, author_name, published_at, tags")
    .eq("is_published", true)
    .order("published_at", { ascending: false });

  if (error) throw error;
  return ((data ?? []) as BlogRow[]).map(mapPost);
}

export async function fetchBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  const { data, error } = await getSupabase()
    .from("habitus_blog_posts")
    .select("id, slug, title, excerpt, body_md, cover_image_url, author_name, published_at, tags")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return mapPost(data as BlogRow);
}
