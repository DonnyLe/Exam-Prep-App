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
  date: string
) => Promise<string>;

export type updateMainTablesType = (
  studyMaterial: StudyMaterial
) => Promise<void>;
