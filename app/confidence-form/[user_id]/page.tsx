export const revalidate = 0;

import { createClient } from "@/utils/supabase/client";
import { ExamData } from "@/lib/algorithm-types";
import { ConfidenceUpdates } from "@/lib/algorithm-types";
import ConfidenceForm from "../ConfidenceForm";
import { StudyType } from "@/lib/form-types";

export type ConfidenceData = {
  type: StudyType;
  confidence_level: number;
};

export default async function Page({
  params,
}: {
  params: { user_id: string };
}) {
  const supabase = createClient();
  const supabaseQuery = supabase
    .from("exams")
    .select("*, subjects(*), topics(*, subtopics(*))");

  const { data, error } = await supabaseQuery;

  if (error) throw error;
  const allExams: ExamData[] = data;
  return (
    <div>
      {allExams.map((exam, key) => {
        return <ConfidenceForm allExams={allExams} user_id={params.user_id} />;
      })}
    </div>
  );
}
