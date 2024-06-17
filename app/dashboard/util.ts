import { Database } from "@/lib/supabase-types";
import { createClient } from "@/utils/supabase/server";
import { SupabaseClient } from "@supabase/supabase-js";
import { cache } from "react";

export const getData = cache(async (id: string) => {
  const supabase = createClient();

    const { data } = await supabase.from("exams").select("*, topics(*, subtopics(*)) ");
    console.log(data)
    return data;
  })

  export const supabase = createClient();
