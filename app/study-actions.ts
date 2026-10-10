"use server";
import { createClient } from "@/utils/supabase/server";
import { examInput, sessionInput } from "@/lib/exam-input";
import { revalidatePath } from "next/cache";
import { localDate } from "@/lib/study";
export async function saveStudyExam(input: unknown) {
  const parsed = examInput.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  if (parsed.data.exam_date <= localDate())
    return { error: "Choose an exam date after today." };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in to save your exam." };
  const { data, error } = await supabase.rpc("save_study_exam", {
    p: parsed.data,
  });
  if (error)
    return {
      error:
        "We couldn’t save your exam. Check your connection and that the study-flow database migration is installed.",
    };
  revalidatePath("/dashboard");
  return { id: data as string };
}
export async function completeStudySession(input: unknown) {
  const parsed = sessionInput.safeParse(input);
  if (!parsed.success)
    return { error: "Check your confidence score and session details." };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in to save your progress." };
  const { error } = await supabase.rpc("complete_study_session", {
    p: parsed.data,
  });
  if (error)
    return {
      error:
        "Your session wasn’t saved. Check your connection and that the study-flow database migration is installed, then retry.",
    };
  revalidatePath("/dashboard");
  return { success: true };
}
