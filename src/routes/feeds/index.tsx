import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { fetchBlogPosts, signedBlogUrl, type BlogPost } from "@/lib/app-state";

export const Route = createFileRoute("/feeds/")({
  head: () => ({
    meta: [
      { title: "Market Updates — Column & Gable" },
      {
        name: "description",
        content: "Every Column & Gable market update: compounding strategy, retirement, loans and risk explained.",
      },
      { property: "og:title", content: "Market Updates — Column & Gable" },
      { property: "og:description", content: "All six member briefings in one feed." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Feeds,
});

function Feeds() {
  const [posts, setPosts] = useState<BlogPost[]>([]);

  useEffect(() => {
    void fetchBlogPosts().then(setPosts);
  }, []);

  return (
    <div className="min-h-screen bg-background pb-16">
      <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-border bg-background/90 px-5 py-4 backdrop-blur-xl">
        <Link to="/discover" aria-label="Back">
          <ArrowLeft className="size-6" />
        </Link>
        <h1 className="font-display text-xl font-bold">Market updates</h1>
      </header>

      <div className="space-y-4 px-5 pt-5">
        {posts.map((post) => (
          <FeedCard key={post.id} post={post} />
        ))}
        {posts.length === 0 && <p className="text-sm text-muted-foreground">No articles published yet.</p>}
      </div>
    </div>
  );
}

function FeedCard({ post }: { post: BlogPost }) {
  const [img, setImg] = useState<string | null>(null);

  useEffect(() => {
    void signedBlogUrl(post.image_url).then(setImg);
  }, [post.image_url]);

  return (
    <Link
      to="/feeds/$id"
      params={{ id: post.id }}
      className="block overflow-hidden rounded-2xl border border-border bg-card"
    >
      {img && (
        <img src={img} alt={post.title} loading="lazy" width={1024} height={640} className="h-44 w-full object-cover" />
      )}
      <div className="p-4">
        <div className="flex items-center gap-2 text-xs">
          <span className="rounded-full bg-accent px-2 py-0.5 font-semibold text-accent-foreground">{post.tag}</span>
          <span className="text-muted-foreground">{post.read_time} read</span>
        </div>
        <h2 className="mt-2 font-display text-lg font-bold">{post.title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{post.excerpt}</p>
      </div>
    </Link>
  );
}
