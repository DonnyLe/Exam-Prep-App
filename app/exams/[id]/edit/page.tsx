import { redirect, notFound } from "next/navigation";
import { loadStudyData } from "@/lib/load-study";
import { createClient } from "@/utils/supabase/server";
import ExamEditor from "@/components/ExamEditor";
export const dynamic = "force-dynamic";
export default async function EditExam({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await loadStudyData();
  if (!data.user) redirect("/login");
  const exam = data.exams.find((exam) => exam.id === id);
  if (!exam) notFound();
  const { data: subjects } = await (await createClient())
    .from("subjects")
    .select("*")
    .eq("user_id", data.user.id);
  return <ExamEditor exam={exam} subjects={subjects ?? []} />;
}
