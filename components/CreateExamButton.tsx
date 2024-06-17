'use client'
import { redirect } from "next/navigation";
import { Button } from "./ui/button";
import Link from "next/link";

export function CreateExamButton({user_id}: {user_id: string}) {
  return (
    <Button asChild>
        <Link href={`/create-exam/${user_id}`}>Add Exam</Link>
    </Button>
  );
}
