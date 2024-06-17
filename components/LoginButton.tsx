'use client'

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function LoginButton() {
    const router = useRouter();

    let handleLogin = () => {
        return router.push("/login");
      };

  return (
    <Button
      className="w-2/4 h-2/4 text-6xl overflow-y-clip"
      onClick={handleLogin}
    >
      {" "}
      Get started
    </Button>
  );
}
