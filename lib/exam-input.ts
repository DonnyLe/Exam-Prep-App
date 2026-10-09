import { z } from "zod";
const name = z.string().trim().min(1, "Enter a name").max(120);
const confidence = z.number().min(0).max(10);
const material = z.object({
  id: z.string().uuid().optional(),
  name,
  confidence,
});
export const examInput = z.object({
  id: z.string().uuid().optional(),
  subject_id: z.string().uuid().optional(),
  subject_name: name,
  name,
  exam_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  confidence_goal: confidence,
  topics: z
    .array(material.extend({ subtopics: z.array(material).max(50) }))
    .min(1, "Add at least one topic")
    .max(50),
});
export type ExamInput = z.infer<typeof examInput>;
export const sessionInput = z.object({
  id: z.string().uuid(),
  exam_id: z.string().uuid(),
  material_id: z.string().uuid(),
  material_type: z.enum(["topics", "subtopics"]),
  confidence: z.number().min(0).max(10),
  studied_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  elapsed_seconds: z.number().int().min(0).max(86400),
});
