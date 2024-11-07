export const revalidate = 0;

import { ExamData } from "@/app/dashboard/[user_id]/page";
import { ConfidenceUpdates } from "@/lib/algorithm-types";
import ConfidenceForm from "../ConfidenceForm";
import { supabaseQuery } from "@/lib/form-types";

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
        return <ConfidenceForm allExams={allExams} user_id={params.user_id} />;
      })}
    </div>
  );
}
