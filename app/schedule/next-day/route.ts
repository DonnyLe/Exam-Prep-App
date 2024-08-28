import { ExamData } from "@/app/dashboard/[user_id]/page";
import {
  generateNextDaySchedule,
  getExamConfidenceFunctions,
} from "../algorithm/generateSchedule";
import { Line } from "@/lib/algorithm-types";
import { ExamGoal } from "@/lib/algorithm-types";

export type AlgorithmRequest = {
  examData: ExamData;
  examConfidenceFunctions: Line[];
};

export async function POST(request: Request) {
  let res: AlgorithmRequest = await request.json();
  let schedule: ExamGoal[] = generateNextDaySchedule(
    res.examData,
    new Date().toISOString(),
    res.examConfidenceFunctions,
    false
  );
  return Response.json(JSON.stringify(schedule));
}
