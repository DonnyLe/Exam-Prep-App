import { createClient } from "@/utils/supabase/client";
import { z } from "zod";

export const subtopicSchema = z.object({
  subtopic_name: z.string({
    required_error: "Please choose a description for the subtopic",
  }),
});
export const topicsSchema = z.object({
  topic_name: z.string({
    required_error: "Please choose a description for the subtopic",
  }),
  subtopics: z.array(subtopicSchema),
});

export const examFormSchema = z.object({
  subject_id: z.string({
    required_error: "Please select an subject for the exam.",
  }),
  exam_name: z.string({
    required_error: "Please select an exam_name.",
  }),
  topics: z.array(topicsSchema),
  exam_date: z.date({
    required_error: "Please select an exam date.",
  }),
});

export type ExamFormData = z.infer<typeof examFormSchema>;

export interface Subjects {
  id?: number;
  subject_name: string;
}
export enum StudyType {
  Topic,
  Subtopic,
}

export type ConfidenceData = {
  type: StudyType;
  confidence_level: number;
};
const supabase = createClient();
export const supabaseQuery = supabase
  .from("exams")
  .select("*, subjects(*), topics(*, subtopics(*))");
