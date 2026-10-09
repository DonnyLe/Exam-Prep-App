import type { ExamData } from "./algorithm-types";
import { localDate, shiftDate } from "./study";
export function demoExams(today = localDate()): ExamData[] {
  return [
    {
      id: "demo-exam",
      user_id: "demo",
      name: "Midterm",
      subject_id: "math",
      subjects: { id: "math", subject_name: "Discrete Math", user_id: "demo" },
      created_at: shiftDate(today, -7),
      exam_date: shiftDate(today, 14),
      last_studied: shiftDate(today, -3),
      confidence: 5,
      confidence_goal: 9,
      priority: 0,
      topics: [
        {
          id: "graphs",
          exam_id: "demo-exam",
          name: "Graph theory",
          order: 0,
          confidence: 4,
          last_studied: shiftDate(today, -3),
          priority: 0,
          subtopics: [
            {
              id: "traversal",
              topic_id: "graphs",
              name: "Graph traversal",
              order: 0,
              confidence: 4,
              last_studied: shiftDate(today, -3),
              priority: 0,
            },
            {
              id: "trees",
              topic_id: "graphs",
              name: "Trees & spanning trees",
              order: 1,
              confidence: 5,
              last_studied: shiftDate(today, -2),
              priority: 0,
            },
          ],
        },
        {
          id: "counting",
          exam_id: "demo-exam",
          name: "Counting principles",
          order: 1,
          confidence: 6,
          last_studied: shiftDate(today, -2),
          priority: 0,
          subtopics: [],
        },
        {
          id: "proofs",
          exam_id: "demo-exam",
          name: "Proof by induction",
          order: 2,
          confidence: 5,
          last_studied: shiftDate(today, -4),
          priority: 0,
          subtopics: [],
        },
      ],
    },
  ];
}
