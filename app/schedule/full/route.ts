import { ExamData } from "@/app/dashboard/[user_id]/page";
import { generateFullSchedule } from "../algorithm/generateSchedule";
import { FullSchedule } from "@/lib/algorithm-types";

export async function POST(request: Request) {
  let res: ExamData = await request.json();
  let schedule: FullSchedule = generateFullSchedule(
    res,
    new Date().toISOString()
  );
  return Response.json(JSON.stringify(schedule));
}
