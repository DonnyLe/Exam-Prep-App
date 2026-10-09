import { demoExams } from "@/lib/demo";
import { generateFullSchedule } from "@/app/schedule/algorithm/generateSchedule";
import { scheduleItems, materialItems } from "@/lib/study";
import { studyToday } from "@/lib/load-study";
import StudyWorkspace from "@/components/StudyWorkspace";
export const dynamic = "force-dynamic";
export default async function Demo({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const today = await studyToday();
  const exams = demoExams(today);
  const schedule = scheduleItems(
    await generateFullSchedule(exams, today),
    exams,
  );
  // Show the catalog in the preview so confidence levels and mixed order are easy to explore.
  schedule[today] = materialItems(exams);
  return (
    <StudyWorkspace
      exams={exams}
      sessions={[]}
      schedule={schedule}
      today={today}
      view={(await searchParams).view ?? "today"}
      demo
    />
  );
}
