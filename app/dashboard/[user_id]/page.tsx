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
import {
  generateFullSchedule,
  updateExamData,
} from "@/app/schedule/algorithm/generateSchedule";
import { useQuery } from "@tanstack/react-query";
import { FullSchedule } from "@/lib/algorithm-types";
// import { calculateSchedule } from "@/utils/generateSchedule";

const supabase = createClient();
export const examQuery = supabase
  .from("exams")
  .select("*, topics(*, subtopics(*))");

export const subjectQuery = supabase.from("subtopics").select("*");
export type ExamData = QueryData<typeof examQuery>[number];

export type SubjectData = QueryData<typeof subjectQuery>;

export type TopicData = ExamData["topics"][number];
export type SubtopicData = TopicData["subtopics"][number];

export default async function Dashboard({
  params,
}: {
  params: { user_id: string };
}) {
  const { data: examdata, error } = await examQuery;
  if (error) throw error;

  let allData: ExamData[] = await examdata;

  let schedule: FullSchedule = await generateFullSchedule(
    allData,
    new Date().toISOString().split("T")[0]
  );
  console.log(schedule)
  return (
    <div className="w-full">
      <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16">
        <div className="w-full max-w-4xl flex justify-between items-center p-3 text-sm bg-sec">
          <AuthButton />
        </div>
      </nav>
      <div className="flex flex-col">
        <h1 className="text-6xl bg-primary-foreground"></h1>
        <h1>Welcome Back Donny!</h1>
        <div className="grid grid-cols-2 justify-items-center h-screen">
          <DailyPlanCarousel full_schedule={schedule} />
          <div className="flex flex-col h-full justify-center">
            <CreateExamButton user_id={params.user_id} />
            <Button>Add Study Session </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
