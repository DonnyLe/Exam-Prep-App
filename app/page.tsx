import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
export default async function Home() {
  try {
    const {
      data: { user },
    } = await createClient().auth.getUser();
    if (user) redirect("/dashboard");
  } catch (error) {
    if ((error as { digest?: string }).digest?.startsWith("NEXT_REDIRECT"))
      throw error;
  }
  return (
    <section className="landing">
      <span className="eyebrow">LESS CRAMMING. MORE CONFIDENCE.</span>
      <h1>
        A little practice.
        <br />
        <em>A lot of progress.</em>
      </h1>
      <p>
        A study plan built around what you know, what needs a little love, and
        when your exam is coming. One small step at a time.
      </p>
      <div className="button-row">
        <Link className="primary-button" href="/login">
          Build my study plan ↗
        </Link>
        <Link className="secondary-button" href="/demo">
          Explore a sample plan
        </Link>
      </div>
      <div className="landing-features">
        <span>✦ Confidence-based recommendations</span>
        <span>↻ Spaced practice</span>
        <span>◷ Your pace, your progress</span>
      </div>
      <div className="hero-art" aria-hidden="true">
        <span>✦</span>
        <i />
        <b />
      </div>
    </section>
  );
}
