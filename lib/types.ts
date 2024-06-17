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
    sub_topics: z.array(subtopicSchema),
  });

  
  
 export const examFormSchema = z.object({
    subject_id: z.string({
      required_error: "Please select an subject for the exam.",
    }),
    exam_name: z.string({
      required_error: "Please select an exam_name.",
    }),
    topics: z.array(topicsSchema),

  });
  
  export type ExamData = z.infer<typeof examFormSchema>;

  export interface Subjects {
    id?: number;
    subject_name: string;
  }