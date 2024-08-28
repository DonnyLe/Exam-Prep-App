export const revalidate = 0

import { createClient } from "@/utils/supabase/client";
import ExamConfidenceForm from "../exams";
import { ExamData } from "@/app/dashboard/[user_id]/page";

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
  const allData: ExamData = data;
  return <ExamConfidenceForm data={allData} user_id={params.user_id} />;
}
