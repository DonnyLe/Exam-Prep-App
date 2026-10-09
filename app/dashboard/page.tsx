import { redirect } from "next/navigation";
import { loadStudyData, studyToday } from "@/lib/load-study";
import { generateFullSchedule } from "@/app/schedule/algorithm/generateSchedule";
import { scheduleItems } from "@/lib/study";
import StudyWorkspace from "@/components/StudyWorkspace";
export const dynamic = "force-dynamic";
export default async function Dashboard({
  searchParams,
}: {
  searchParams: { view?: string };
}) {
  const data = await loadStudyData();
  if (!data.user) redirect("/login");
  const today = studyToday();
  const schedule = await generateFullSchedule(
    data.exams,
    today,
    data.sessions
      .filter((session) => session.studied_on === today)
      .map((session) => session.material_id),
  );
  return (
    <StudyWorkspace
      exams={data.exams}
      sessions={data.sessions}
      schedule={scheduleItems(schedule, data.exams)}
      today={today}
      view={searchParams.view ?? "today"}
      error={data.error}
    />
  );
}
