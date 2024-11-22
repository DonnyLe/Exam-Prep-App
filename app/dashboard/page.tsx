export const revalidate = 0;

import AuthButton from "@/components/AuthButton";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cache } from "react";
import { SupabaseClient } from "@supabase/supabase-js";
import { QueryResult, QueryError } from "@supabase/supabase-js";
import { Database } from "@/lib/supabase-types";
import DailyPlanCarousel from "./DailyPlanCarousel";
import { CreateExamButton } from "@/components/CreateExamButton";
import {
  generateFullSchedule,
  updateExamData,
} from "@/app/schedule/algorithm/generateSchedule";
import { createClient } from "@/utils/supabase/server";

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
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return redirect("/login/");
  }
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
    <div className="w-full h-full">
      <div className="flex flex-col  w-full">
        <h1>Welcome Back Donny!</h1>
        <div className="h-72 grid grid-cols-2 justify-items-center">
          <DailyPlanCarousel full_schedule={schedule} />
          <div className="flex flex-col justify-center">
            <CreateExamButton />
            <Button asChild>
              <Link href={`/confidence-form/`}>
                Update Your Confidence Levels
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
