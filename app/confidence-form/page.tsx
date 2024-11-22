export const revalidate = 0;

import { createClient } from "@/utils/supabase/server";
import { ExamData, SubjectData } from "@/lib/algorithm-types";
import { ConfidenceUpdates } from "@/lib/algorithm-types";
import ConfidenceForm from "./ConfidenceForm";
import { StudyType } from "@/lib/form-types";
import { redirect } from "next/navigation";

export type ConfidenceData = {
  type: StudyType;
  confidence_level: number;
};

export default async function Page() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return redirect("/login/");
  }

  const supabaseQuery = supabase
    .from("exams")
    .select("*, subjects(*), topics(*, subtopics(*))");

  const res1 = await supabaseQuery;
  const subjectQuery = supabase.from("subjects").select("*");
  const res2 = await subjectQuery;

  if (res1.error) throw res1.error;
  const allExams: ExamData[] = res1.data;

  return (
    <div className="w-full">
      {allExams.map((exam, key) => {
        return <ConfidenceForm allExams={allExams} user_id={user.id} />;
      })}
    </div>
  );
}
