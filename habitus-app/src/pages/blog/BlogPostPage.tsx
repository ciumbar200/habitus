import { Link, useParams } from "react-router-dom";
import { marked } from "marked";
import { getBlogPost, getRelatedPosts } from "@/lib/blog-content";
import { ArrowRight, Calendar, Clock, ShareNetwork } from "@phosphor-icons/react";
import { accessSignupUrl } from "@/lib/accessLinks";

export function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const post = getBlogPost(slug || "");
  const relatedPosts = getRelatedPosts(slug || "", 3);

  if (!post) {
    return (
      <main className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="section-title">Artículo no encontrado</h1>
          <p className="text-stone-600 mt-4">
            El artículo que buscas no existe o ha sido eliminado.
          </p>
          <Link to="/blog" className="inline-flex items-center gap-2 text-terracotta font-medium mt-6">
            Volver al blog
            <ArrowRight weight="bold" className="w-4 h-4" />
          </Link>
        </div>
      </main>
    );
  }

  const htmlContent = marked(post.content, { gfm: true, breaks: true }) as string;

  return (
    <main className="min-h-screen bg-stone-50">
      {/* Article Header */}
      <article className="bg-gradient-to-br from-stone-100 to-stone-200 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <Link
              to="/blog"
              className="inline-flex items-center gap-2 text-sm font-medium text-stone-600 hover:text-terracotta mb-6"
            >
              <ArrowRight weight="bold" className="w-4 h-4 rotate-180" />
              Volver al blog
            </Link>

            <div className="flex items-center gap-3 mb-4">
              <span className="text-xs font-semibold bg-terracotta text-white px-3 py-1 rounded-full">
                {post.category}
              </span>
              <span className="flex items-center gap-1 text-sm text-stone-600">
                <Calendar size={16} />
                {new Date(post.publishedAt).toLocaleDateString("es-ES", {
                  day: "numeric",
                  month: "long",
                  year: "numeric"
                })}
              </span>
              <span className="flex items-center gap-1 text-sm text-stone-600">
                <Clock size={16} />
                {post.readTime} minutos de lectura
              </span>
            </div>

            <h1 className="section-title lg:text-5xl mb-4">
              {post.title}
            </h1>

            <p className="text-lg text-stone-600 max-w-3xl">
              {post.excerpt}
            </p>

            <div className="flex items-center gap-2 mt-6">
              {post.tags.map((tag) => (
                <span key={tag} className="text-sm bg-white text-stone-600 px-3 py-1 rounded-full">
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </article>

      {/* Article Content */}
      <article className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* Featured Image */}
            {post.featuredImage && (
              <div className="aspect-video rounded-2xl overflow-hidden mb-12 shadow-lg">
                <img
                  src={post.featuredImage}
                  alt={post.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Content */}
            <div
              className="prose prose-lg max-w-none
                prose-headings:font-semibold prose-headings:text-stone-900
                prose-h1:text-3xl prose-h1:mt-12 prose-h1:mb-6
                prose-h2:text-2xl prose-h2:mt-12 prose-h2:mb-6
                prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-4
                prose-p:text-stone-700 prose-p:leading-relaxed prose-p:mb-6
                prose-ul:text-stone-700 prose-ul:my-4 prose-ul:pl-6
                prose-ol:text-stone-700 prose-ol:my-4 prose-ol:pl-6
                prose-li:mb-2 prose-li:leading-relaxed
                prose-strong:text-stone-900 prose-strong:font-semibold
                prose-em:text-stone-700
                prose-a:text-terracotta prose-a:font-medium prose-a:no-underline hover:prose-a:underline
                prose-blockquote:border-l-4 prose-blockquote:border-stone-900 prose-blockquote:bg-stone-100 prose-blockquote:py-4 prose-blockquote:px-6 prose-blockquote:rounded-r-xl prose-blockquote:not-italic
                prose-blockquote:text-stone-700
                prose-table:border-collapse prose-th:bg-stone-100 prose-th:px-4 prose-th:py-2 prose-th:text-left prose-th:text-sm prose-th:font-semibold
                prose-td:px-4 prose-td:py-2 prose-td:border prose-td:border-stone-200 prose-td:text-sm
                prose-code:bg-stone-100 prose-code:px-2 prose-code:py-0.5 prose-code:rounded prose-code:text-sm
                prose-pre:bg-stone-900 prose-pre:text-stone-100 prose-pre:rounded-xl
                prose-hr:border-stone-200 prose-hr:my-10"
              dangerouslySetInnerHTML={{ __html: htmlContent }}
            />

            {/* Share Section */}
            <div className="mt-12 pt-8 border-t border-stone-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-stone-900">¿Te ha sido útil?</p>
                  <p className="text-sm text-stone-600">Compártelo con alguien que esté buscando piso</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 rounded-full border border-stone-300 hover:bg-stone-50 transition-colors">
                  <ShareNetwork size={20} />
                  Compartir
                </button>
              </div>
            </div>

            {/* Author */}
            <div className="mt-8 p-6 bg-stone-100 rounded-xl">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-[#1a1a2e] to-[#c9a962] flex items-center justify-center">
                  <span className="text-white font-bold">:m</span>
                </div>
                <div>
                  <p className="font-semibold text-stone-900">{post.author}</p>
                  <p className="text-sm text-stone-600">Equipo : moon shared living</p>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="mt-12 p-8 bg-gradient-to-br from-terracotta to-orange-600 rounded-2xl text-white text-center">
              <h2 className="text-2xl font-bold mb-4">
                Encuentra compañeros compatibles en Barcelona
              </h2>
              <p className="text-white/90 mb-6 max-w-xl mx-auto">
                Deja de adivinar. En : moon analizamos compatibilidad real antes de que te mudes.
              </p>
              <Link
                to={accessSignupUrl("inquilino")}
                className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-white text-stone-900 font-medium hover:bg-stone-100 transition-colors"
              >
                Crear cuenta gratis
                <ArrowRight weight="bold" className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </article>

      {/* Related Posts */}
      {relatedPosts.length > 0 && (
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="section-title mb-8">Artículos relacionados</h2>
              <div className="grid md:grid-cols-3 gap-6">
                {relatedPosts.map((relatedPost) => (
                  <Link
                    key={relatedPost.slug}
                    to={`/blog/${relatedPost.slug}`}
                    className="group"
                  >
                    <div className="bg-stone-50 rounded-xl overflow-hidden hover:shadow-lg transition-shadow">
                      {relatedPost.featuredImage && (
                        <div className="aspect-video bg-gradient-to-br from-terracotta/20 to-emerald-700/20">
                          <img
                            src={relatedPost.featuredImage}
                            alt={relatedPost.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      )}
                      <div className="p-4">
                        <span className="text-xs font-medium text-terracotta">
                          {relatedPost.category}
                        </span>
                        <h3 className="font-semibold mt-2 mb-1 line-clamp-2 group-hover:text-terracotta transition-colors">
                          {relatedPost.title}
                        </h3>
                        <p className="text-sm text-stone-600 line-clamp-2">
                          {relatedPost.excerpt}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
