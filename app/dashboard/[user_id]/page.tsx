export const revalidate = 0;

import AuthButton from "@/components/AuthButton";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cache } from "react";
import { SupabaseClient } from "@supabase/supabase-js";
import { QueryResult, QueryError } from "@supabase/supabase-js";
import { Database } from "@/lib/supabase-types";
import DailyPlanCarousel from "../DailyPlanCarousel";
import { CreateExamButton } from "@/components/CreateExamButton";
import {
  generateFullSchedule,
  updateExamData,
} from "@/app/schedule/algorithm/generateSchedule";
import { useQuery } from "@tanstack/react-query";
import {
  ExamData,
  examQuery,
  FullSchedule,
  SubjectData,
} from "@/lib/algorithm-types";
import Link from "next/link";
export default async function Dashboard({
  params,
}: {
  params: { user_id: string };
}) {
  const { data: examdata, error } = await examQuery;
  if (error) throw error;

  let allData: ExamData[] = await examdata;
  console.log(allData);

  let schedule: FullSchedule = await generateFullSchedule(
    allData,
    new Date().toISOString().split("T")[0]
  );
  console.log(schedule);
  return (
    <div className="w-full">
      <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16">
        <div className="w-full max-w-4xl flex justify-between items-center p-3 text-sm bg-sec">
          <AuthButton />
        </div>
      </nav>
      <div className="flex flex-col bg-slate-50 w-full">
        <h1>Welcome Back Donny!</h1>
        <div className="grid grid-cols-2 justify-items-center h-screen">
          <DailyPlanCarousel full_schedule={schedule} />
          <div className="flex flex-col h-full justify-center">
            <CreateExamButton user_id={params.user_id} />
            <Button asChild>
              <Link href={`/confidence-form/${params.user_id}`}>
                Update Your Confidence Levels{" "}
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
