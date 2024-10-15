export const revalidate = 0;

import { createClient } from "@/utils/supabase/client";
import { ExamData } from "@/app/dashboard/[user_id]/page";
import { ConfidenceUpdates } from "@/lib/algorithm-types";
import ConfidenceForm from "../ConfidenceForm";

export enum StudyType {
  Topic,
  Subtopic,
}

export type ConfidenceData = {
  type: StudyType;
  confidence_level: number;
};

const supabase = createClient();
export const supabaseQuery = supabase
  .from("exams")
  .select("*, subjects(*), topics(*, subtopics(*))");

export default async function Page({
  params,
}: {
  params: { user_id: string };
}) {
  const { data, error } = await supabaseQuery;

  
  if (error) throw error;
  const allExams: ExamData[] = data;
  return (
    <div>
      {allExams.map((exam, key) => {
        return (
          <ConfidenceForm allExams={allExams} user_id={params.user_id}/>
        );
      })}
    </div>
  );
}
