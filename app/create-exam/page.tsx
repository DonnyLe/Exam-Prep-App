import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import ExamEditor from "@/components/ExamEditor";
export const dynamic = "force-dynamic";
export default async function CreateExam() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data, error } = await supabase
    .from("subjects")
    .select("*")
    .eq("user_id", user.id);
  if (error)
    throw new Error("We couldn’t load your subjects. Please try again.");
  return <ExamEditor subjects={data ?? []} />;
}
