export type FullSchedule = Map<string, ExamGoal[]>;
export type StudyMaterialConfidenceUpdates = {
  studyMaterialName: string;
  currentConfidence: number | null;
  confidenceIncrease: number;
  date: string;
};
export type ExamGoal = {
  examId: string;
  examName: string;
  totalConfidenceIncrease: number;
  allStudyMaterialGoals: Map<string, StudyMaterialConfidenceUpdates>;
  currentConfidence: number;
};
export type StudyMaterial = {
  name: string;
  id: string;
  confidence: number | null;
  confidence_goal?: number | null;
  priority: number | null;
  exam_date?: string | null;
  last_studied: string | null;
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
export type updateEntryTablesType = {
  updateFunction: (
    childEntryID: string,
    parentEntryID: string,
    studyMaterial: StudyMaterial
  ) => void;
  insertFunction: (
    studyMaterial: StudyMaterial,
    confidenceChange: number
  ) => Promise<string>;
};
export type updateMainTablesType = (studyMaterial: StudyMaterial) => void;
