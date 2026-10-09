import type { Tables } from "./supabase-types";

export type FullSchedule = Map<string, ConfidenceUpdates[]>;

export type ConfidenceUpdates = {
  studyMaterial: StudyMaterial;
  confidenceIncrease: number;
  newDate: string;
  childrenConfidenceUpdates: Map<string, ConfidenceUpdates> | null;
};

export type StudyMaterial = {
  name: string;
  id: string;
  subject_id?: string;
  subjects?: { id: string; subject_name: string; user_id: string } | null;
  confidence: number | null;
  confidence_goal?: number | null;
  priority: number | null;
  exam_date?: string | null;
  last_studied: string;
  created_at?: string | null;
  topics?: StudyMaterial[];
  subtopics?: StudyMaterial[];
};
export type Combination = {
  linesInCombination: Line[];
  totalWeightedError: number;
  totalWeight: number;
};
export type Function = (x: number) => number;
export type Line = {
  fnc: Function;
  coefficient: number;
  yIntercept: number;
  exponent: number;
  confidenceGoal: number;
  startDayNum: number;
  startingConfidenceLevel: number;
  endDayNum: number;
  examId: string;
};
export type insertEntryTablesType = (
  studyMaterial: StudyMaterial,
  confidenceChange: number,
  date: string,
) => Promise<string>;

export type updateMainTablesType = (
  studyMaterial: StudyMaterial,
) => Promise<void>; // import { calculateSchedule } from "@/utils/generateSchedule";
export type ExamData = Tables<"exams"> & {
  subjects: Tables<"subjects"> | null;
  topics: TopicData[];
};
export type SubjectData = Tables<"subjects">[];
export type TopicData = Tables<"topics"> & { subtopics: SubtopicData[] };
export type SubtopicData = Tables<"subtopics">;
