import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { fetchBlogPost, signedBlogUrl, type BlogPost } from "@/lib/app-state";

export const Route = createFileRoute("/feeds/$id")({
  head: () => ({
    meta: [
      { title: "Market Update — Column & Gable" },
      { name: "description", content: "Read the full Column & Gable member briefing." },
      { property: "og:title", content: "Market Update — Column & Gable" },
      { property: "og:description", content: "Read the full Column & Gable member briefing." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: FeedDetail,
});

function FeedDetail() {
  const { id } = useParams({ from: "/feeds/$id" });
  const [post, setPost] = useState<BlogPost | null>(null);
  const [img, setImg] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    void fetchBlogPost(id)
      .then(async (p) => {
        if (!alive) return;
        setPost(p);
        setImg(await signedBlogUrl(p?.image_url ?? null));
      })
      .catch((e) => {
        console.error("FeedDetail load failed:", e);
      });
    return () => {
      alive = false;
    };
  }, [id]);

  return (
    <div className="min-h-screen bg-background pb-16">
      <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-border bg-background/90 px-5 py-4 backdrop-blur-xl">
        <Link to="/feeds" aria-label="Back">
          <ArrowLeft className="size-6" />
        </Link>
        <h1 className="font-display text-xl font-bold">Article</h1>
      </header>

      {!post && <p className="px-5 pt-6 text-sm text-muted-foreground">Article not found.</p>}

      {post && (
        <article className="px-5 pt-5">
          {img && (
            <img
              src={img}
              alt={post.title}
              width={1024}
              height={640}
              className="h-52 w-full rounded-2xl object-cover"
            />
          )}
          <div className="mt-4 flex items-center gap-2 text-xs">
            <span className="rounded-full bg-accent px-2 py-0.5 font-semibold text-accent-foreground">{post.tag}</span>
            <span className="text-muted-foreground">{post.read_time} read</span>
          </div>
          <h2 className="mt-3 font-display text-2xl font-extrabold leading-tight">{post.title}</h2>
          <p className="mt-2 text-muted-foreground">{post.excerpt}</p>
          <div className="mt-5 space-y-4 leading-relaxed">
            {post.body.split("\n").filter(Boolean).map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>
        </article>
      )}
    </div>
  );
}
