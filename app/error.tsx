"use client";
import Link from "next/link";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="panel empty-state error-page">
      <h1>Let’s try that again.</h1>
      <p>
        We couldn’t reach your study workspace. Check your Supabase connection
        and try again.
      </p>
      <div className="button-row">
        <button className="primary-button" onClick={reset}>
          Retry
        </button>
        <Link className="secondary-button" href="/demo">
          Explore the sample plan
        </Link>
      </div>
    </div>
  );
}
