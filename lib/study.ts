import type {
  ExamData,
  StudyMaterial,
  FullSchedule,
  ConfidenceUpdates,
} from "./algorithm-types";
export type StudySession = {
  id: string;
  exam_id: string;
  material_id: string;
  material_type: "topics" | "subtopics";
  confidence_before: number;
  confidence_after: number;
  studied_on: string;
  elapsed_seconds: number;
  created_at: string;
};
export type StudyItem = {
  id: string;
  examId: string;
  topicId: string;
  name: string;
  path: string;
  subject: string;
  subjectId: string;
  examName: string;
  confidence: number;
  lastStudied: string;
  priority: number;
  projectedGain: number;
  type: "topics" | "subtopics";
};
export function localDate(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
export function shiftDate(date: string, days: number) {
  return new Date(Date.parse(date) + days * 86400000)
    .toISOString()
    .slice(0, 10);
}
export function dateLabel(
  date: string,
  options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" },
) {
  return new Date(date + "T12:00:00").toLocaleDateString("en-US", options);
}
export function materialItems(exams: ExamData[]): StudyItem[] {
  return exams.flatMap((exam) =>
    exam.topics.flatMap((topic) =>
      (topic.subtopics.length ? topic.subtopics : [topic]).map((material) => ({
        id: material.id,
        examId: exam.id,
        topicId: topic.id,
        name: material.name,
        path: topic.subtopics.length ? topic.name : exam.name,
        subject: exam.subjects?.subject_name ?? "General",
        subjectId: exam.subject_id,
        examName: exam.name,
        confidence: material.confidence ?? 3,
        lastStudied: material.last_studied.slice(0, 10),
        priority: material.priority ?? 0,
        projectedGain: 0,
        type: topic.subtopics.length
          ? ("subtopics" as const)
          : ("topics" as const),
      })),
    ),
  );
}
export function scheduleItems(
  schedule: FullSchedule,
  exams: ExamData[],
): Record<string, StudyItem[]> {
  const result: Record<string, StudyItem[]> = {};
  const catalog = new Map(materialItems(exams).map((item) => [item.id, item]));
  function flatten(update: ConfidenceUpdates): StudyItem[] {
    if (update.childrenConfidenceUpdates?.size)
      return Array.from(update.childrenConfidenceUpdates.values()).flatMap(
        flatten,
      );
    const item = catalog.get(update.studyMaterial.id);
    return item && update.confidenceIncrease > 0
      ? [
          {
            ...item,
            confidence: update.studyMaterial.confidence ?? 3,
            lastStudied: update.studyMaterial.last_studied.slice(0, 10),
            priority: update.studyMaterial.priority ?? 0,
            projectedGain: update.confidenceIncrease,
          },
        ]
      : [];
  }
  schedule.forEach((goals, date) => {
    result[date] = goals
      .flatMap(flatten)
      .sort((a, b) => b.priority - a.priority || a.id.localeCompare(b.id));
  });
  return result;
}
export function interleave(items: StudyItem[]): StudyItem[] {
  const subjects = new Map<string, StudyItem[]>();
  items.forEach((item) =>
    subjects.set(item.subjectId, [
      ...(subjects.get(item.subjectId) ?? []),
      item,
    ]),
  );
  return Array.from(subjects.values()).flatMap((group) => {
    const remaining = [...group];
    const result: StudyItem[] = [];
    let previous = "";
    while (remaining.length) {
      let index = remaining.findIndex((item) => item.topicId !== previous);
      if (index < 0) index = 0;
      const [item] = remaining.splice(index, 1);
      result.push(item);
      previous = item.topicId;
    }
    return result;
  });
}
