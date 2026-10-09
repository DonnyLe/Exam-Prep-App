import "server-only";
import { createClient } from "@/utils/supabase/server";
import type { ExamData } from "@/lib/algorithm-types";
import { cookies } from "next/headers";
export async function loadStudyData() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return { user: null, exams: [] as ExamData[], sessions: [], error: null };
  const [exams, sessions] = await Promise.all([
    supabase
      .from("exams")
      .select("*, subjects(*), topics(*, subtopics(*))")
      .eq("user_id", user.id)
      .order("exam_date"),
    supabase
      .from("study_sessions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(500),
  ]);
  const data = (exams.data ?? []) as ExamData[];
  data.forEach((exam) => {
    exam.topics.sort((a, b) => a.order - b.order);
    exam.topics.forEach((topic) =>
      topic.subtopics.sort((a, b) => a.order - b.order),
    );
  });
  return {
    user,
    exams: data,
    sessions: sessions.data ?? [],
    error: exams.error
      ? "We couldn’t load your exams. Check your connection and try again."
      : sessions.error
        ? "Study history is unavailable. Apply the study-flow migration to enable session saving and progress."
        : null,
  };
}
export function studyToday() {
  let timezone = "America/New_York";
  try {
    timezone = decodeURIComponent(
      cookies().get("study_timezone")?.value ?? timezone,
    );
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}
