import { SupabaseClient } from "@supabase/supabase-js";

 
export const fetchSubjects = async (supabase: SupabaseClient, user_id: string) => {
    const { data, error } = await supabase
      .from("subjects")
      .select("id,subject_name").eq('user_id', user_id)
    if (!error) {
      return data;
    } 
    return [];
  };