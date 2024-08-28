export const revalidate = 0;

import AuthButton from "@/components/AuthButton";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cache } from "react";
import { SupabaseClient } from "@supabase/supabase-js";
import { QueryResult, QueryData, QueryError } from "@supabase/supabase-js";
import { Database } from "@/lib/supabase-types";
import { createClient } from "@/utils/supabase/client";
import DailyPlanCarousel from "../DailyPlanCarousel";
import { CreateExamButton } from "@/components/CreateExamButton";
import { updateExamData } from "@/app/schedule/algorithm/generateSchedule";
import { FullSchedule } from "@/lib/algorithm-types";
import { useQuery } from "@tanstack/react-query";

// import { calculateSchedule } from "@/utils/generateSchedule";

const supabase = createClient();
export const examQuery = supabase
  .from("exams")
  .select("*, topics(*, subtopics(*))");

export const subjectQuery = supabase.from("subtopics").select("*");
export type ExamData = QueryData<typeof examQuery>;

export type SubjectData = QueryData<typeof subjectQuery>;

export type TopicData = ExamData[number]["topics"][number];
export type SubtopicData = TopicData["subtopics"][number];

export default async function Dashboard({
  params,
}: {
  params: { user_id: string };
}) {
  const { data: examdata, error } = await examQuery;
  if (error) throw error;

  let allData: ExamData = examdata;
  console.log(allData);

  let res = await fetch(`http://localhost:3000/schedule/full`, {
    method: "POST",
    body: JSON.stringify(allData),
    cache: "no-store",
  });
  let data: FullSchedule = await res.json();
  console.log(data);

  return (
    <div className="w-full">
      <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16">
        <div className="w-full max-w-4xl flex justify-between items-center p-3 text-sm bg-sec">
          <AuthButton />
        </div>
      </nav>
      <div className="flex flex-col">
        <h1 className="text-6xl bg-primary-foreground"></h1>

        <div className="grid grid-cols-2 justify-items-center h-screen">
          <DailyPlanCarousel />
          <div className="flex flex-col h-full justify-center">
            <CreateExamButton user_id={params.user_id} />
            <Button>Add Study Session </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
