import { useState } from "react";
import { Link } from "react-router-dom";
import { getBlogPosts } from "@/lib/blog-content";
import { ArrowRight, Calendar, Clock } from "@phosphor-icons/react";
import type { BlogPost } from "@/lib/blog-content";

const categories = [
  { name: "Todas", slug: undefined },
  { name: "Guías", slug: "guías" },
  { name: "Barrios", slug: "barrios" },
  { name: "Test", slug: "test" },
];

export function BlogPage() {
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);
  const posts = getBlogPosts(selectedCategory);

  return (
    <main className="min-h-screen bg-stone-50">
      {/* Header */}
      <section className="bg-gradient-to-br from-stone-100 to-stone-200 py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-terracotta font-semibold mb-3">Blog : moon</p>
            <h1 className="section-title">
              Guías y recursos<br />para compartir piso
            </h1>
            <p className="text-lg text-stone-600 mt-4">
              Artículos útiles basados en experiencias reales de cientos de personas buscando habitación en nuestras ciudades.
            </p>
          </div>
        </div>
      </section>

      {/* Category Filter */}
      <section className="border-b border-stone-200 bg-white sticky top-16 z-40">
        <div className="container mx-auto px-4">
          <div className="flex gap-2 overflow-x-auto py-4">
            {categories.map((cat) => (
              <button
                key={cat.name}
                onClick={() => setSelectedCategory(cat.slug)}
                className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedCategory === cat.slug
                    ? "bg-terracotta text-white"
                    : "bg-stone-100 text-stone-700 hover:bg-stone-200"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Blog Posts Grid */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post) => (
              <BlogCard key={post.slug} post={post} />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

function BlogCard({ post }: { post: BlogPost }) {
  return (
    <article className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow group">
      {post.featuredImage && (
        <div className="aspect-video bg-gradient-to-br from-terracotta/20 to-emerald-700/20 relative overflow-hidden">
          <img
            src={post.featuredImage}
            alt={post.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      )}

      <div className="p-6">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-xs font-medium text-terracotta">
            {post.category}
          </span>
          <span className="flex items-center gap-1 text-xs text-stone-500">
            <Calendar size={14} />
            {new Date(post.publishedAt).toLocaleDateString("es-ES", {
              day: "numeric",
              month: "short",
              year: "numeric"
            })}
          </span>
          <span className="flex items-center gap-1 text-xs text-stone-500">
            <Clock size={14} />
            {post.readTime} min
          </span>
        </div>

        <h2 className="card-title mb-2 line-clamp-2 group-hover:text-terracotta transition-colors">
          <Link to={`/blog/${post.slug}`}>
            {post.title}
          </Link>
        </h2>

        <p className="text-stone-600 text-sm mb-4 line-clamp-3">
          {post.excerpt}
        </p>

        <div className="flex items-center gap-2 mb-4">
          {post.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="text-xs bg-stone-100 text-stone-600 px-2 py-1 rounded-full">
              {tag}
            </span>
          ))}
        </div>

        <Link
          to={`/blog/${post.slug}`}
          className="inline-flex items-center gap-2 text-sm font-medium text-terracotta hover:gap-3 transition-all group"
        >
          Leer artículo
          <ArrowRight weight="bold" className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </article>
  );
}
