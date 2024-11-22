import { createClient } from "@/utils/supabase/server";
import SelectForm from "./SelectForm";
import { redirect } from "next/navigation";

export default async function CreateExamPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return redirect("/login/");
  }
  
  return <SelectForm user_id={user.id} />;
}
