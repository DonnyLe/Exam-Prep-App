import { redirect } from "next/navigation";
export default function ConfidencePage() {
  redirect("/dashboard?view=exams");
}
