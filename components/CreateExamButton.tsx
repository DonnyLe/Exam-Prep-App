'use client'
import { redirect } from "next/navigation";
import { Button } from "./ui/button";
import Link from "next/link";

export function CreateExamButton() {
  return (
    <Button asChild>
        <Link href={`/create-exam`}>Add Exam</Link>
    </Button>
  );
}
