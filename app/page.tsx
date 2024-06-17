import LoginButton from "@/components/LoginButton";
import AuthButton from "../components/AuthButton";
import { createClient } from "@/utils/supabase/server";

import { redirect } from "next/navigation";


export default async function Index() {
  const canInitSupabaseClient = () => {
    // This function is just for the interactive tutorial.
    // Feel free to remove it once you have Supabase connected.
    try {
      createClient();
      return true;
    } catch (e) {
      return false;
    }
  };

  const isSupabaseConnected = canInitSupabaseClient();

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  console.log(user);
  if (user) {
    return redirect("/dashboard/" + user.id);
  }

  
  return (
    <div className="h-screen w-screen">
      <div className="absolute bottom-0 right-0">
        <h1 className="text-6xl">Never cram before an exam again</h1>
        {isSupabaseConnected && <LoginButton />}
      </div>
    </div>
  );
}
