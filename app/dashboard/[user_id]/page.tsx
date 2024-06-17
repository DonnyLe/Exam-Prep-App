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
import { calculateSchedule } from "@/utils/generateSchedule";

const supabase = createClient();
const supabaseQuery = supabase
  .from("exams")
  .select("*, subjects(*), topics(*, subtopics(*))");
export type AllData = QueryData<typeof supabaseQuery>

    


export default async function Dashboard({
  params,
}: {
  params: { user_id: string };
}) {
  const supabase = createClient();
  const { data, error } = await supabaseQuery;

if (error) throw error
const allData: AllData = data

calculateSchedule(allData);

  return (
    <div className="w-full">
      <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16">
        <div className="w-full max-w-4xl flex justify-between items-center p-3 text-sm bg-sec">
          <AuthButton />
        </div>
      </nav>
      <div className="flex flex-col">
        <h1 className="text-6xl bg-primary-foreground">
          
        </h1> 

        <div className="grid grid-cols-2 justify-items-center h-screen">
          <DailyPlanCarousel />
          <div className="flex flex-col h-full justify-center">
            <CreateExamButton user_id={params.user_id}/>
            <Button>Add Study Session </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
