import { NextRequest } from "next/server";
import { getExamConfidenceFunctions } from "./algorithm/generateSchedule";
import { Line } from "@/lib/algorithm-types";
import { ExamData } from "../dashboard/[user_id]/page";

export async function POST(request: NextRequest) {
  let res: ExamData = await request.json();
  const searchParams = request.nextUrl.searchParams;
  let date: string | null = searchParams.get("date");

  let examConfidenceFunctions: Line[] = getExamConfidenceFunctions(
    res,
    true,
    date ?? new Date().toISOString()
  );
  return Response.json(JSON.stringify(examConfidenceFunctions));
}
