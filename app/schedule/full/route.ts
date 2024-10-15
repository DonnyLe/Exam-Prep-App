// import { ExamData } from "@/app/dashboard/[user_id]/page";
// import { generateFullSchedule } from "../algorithm/generateSchedule";
// import { FullSchedule } from "@/lib/algorithm-types";


// export async function POST(request: Request) {
//   let req: ExamData = await request.json();
//   let schedule: FullSchedule = await generateFullSchedule(
//     req,
//     new Date().toISOString()
//   );
//   console.log(schedule)
//   const data = JSON.stringify(schedule)
//   console.log(data)
//   return Response.json(data)
// }
