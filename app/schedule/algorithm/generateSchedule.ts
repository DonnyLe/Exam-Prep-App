import type {
  ExamData,
  StudyMaterial,
  ConfidenceUpdates,
  Line,
  Combination,
  Function,
  FullSchedule,
  updateMainTablesType,
  insertEntryTablesType,
} from "@/lib/algorithm-types";
import { Heap } from "heap-js";
import { correlation } from "@mathigon/fermat";

export function daysBetween(from: string, to: string): number {
  if (!from || !to) return 0;
  const difference =
    (Date.parse(to.slice(0, 10)) - Date.parse(from.slice(0, 10))) / 86400000;
  return Number.isFinite(difference) ? Math.round(difference) : 0;
}
export const boundedConfidence = (value: number | null | undefined) =>
  Math.max(0, Math.min(10, value ?? 3));
export function calculateConfidenceIncrease(confidence: number) {
  return -0.5 * boundedConfidence(confidence) + 5;
}
export function getStudyMaterialInfo(data: StudyMaterial): {
  subStudyMaterial: StudyMaterial[] | null;
  studyMaterialType: "exams" | "topics" | "subtopics";
} {
  if (data.topics)
    return { subStudyMaterial: data.topics, studyMaterialType: "exams" };
  if (data.subtopics)
    return { subStudyMaterial: data.subtopics, studyMaterialType: "topics" };
  return { subStudyMaterial: null, studyMaterialType: "subtopics" };
}
export function refreshPriorities(material: StudyMaterial, date: string) {
  const children = getStudyMaterialInfo(material).subStudyMaterial;
  children?.forEach((child) => refreshPriorities(child, date));
  material.confidence = children?.length
    ? children.reduce(
        (sum, child) => sum + boundedConfidence(child.confidence),
        0,
      ) / children.length
    : boundedConfidence(material.confidence);
  material.priority =
    70 / (material.confidence + 5) +
    1.2 ** Math.min(365, Math.max(0, daysBetween(material.last_studied, date)));
}
function getNextDayExamGoal(
  parent: StudyMaterial,
  amount: number,
  date: string,
  completed = new Set<string>(),
): ConfidenceUpdates {
  const children = getStudyMaterialInfo(parent).subStudyMaterial;
  const confidence = boundedConfidence(parent.confidence);
  const budget = completed.has(parent.id)
    ? 0
    : Math.max(0, Math.min(amount, 10 - confidence));
  if (!children?.length)
    return {
      studyMaterial: structuredClone(parent),
      confidenceIncrease: budget,
      newDate: budget > 0 ? date : parent.last_studied,
      childrenConfidenceUpdates: null,
    };
  const heap = new Heap<StudyMaterial>(
    (a, b) => (b.priority ?? 0) - (a.priority ?? 0) || a.id.localeCompare(b.id),
  );
  heap.init(children);
  const updates = new Map<string, ConfidenceUpdates>();
  let remaining = budget * children.length;
  let total = 0;
  while (remaining > 1e-9 && heap.length) {
    const child = heap.pop()!;
    const update = getNextDayExamGoal(
      child,
      Math.min(
        calculateConfidenceIncrease(boundedConfidence(child.confidence)),
        remaining,
      ),
      date,
      completed,
    );
    if (update.confidenceIncrease > 1e-9) {
      updates.set(child.id, update);
      total += update.confidenceIncrease;
      remaining -= update.confidenceIncrease;
    }
  }
  return {
    studyMaterial: structuredClone(parent),
    confidenceIncrease: total / children.length,
    newDate: total > 0 ? date : parent.last_studied,
    childrenConfidenceUpdates: updates,
  };
}
export function getExamConfidenceFunctions(
  data: ExamData[],
  optimizeSchedule: boolean,
  date: string,
): Line[] {
  const active = data.filter(
    (exam) =>
      exam.exam_date.slice(0, 10) > date &&
      exam.created_at.slice(0, 10) <= date,
  );
  const functions = active.map((exam) =>
    createFunction(
      1.7,
      Math.max(0, daysBetween(exam.created_at, date)),
      boundedConfidence(exam.confidence),
      daysBetween(exam.created_at, exam.exam_date),
      Math.max(
        boundedConfidence(exam.confidence),
        boundedConfidence(exam.confidence_goal ?? 9),
      ),
      exam.id,
    ),
  );
  if (!optimizeSchedule || functions.length < 2) return functions;
  const combinations = getCombinations(functions).filter(
    (c) => c.totalWeight > 0 && Number.isFinite(c.totalWeightedError),
  );
  combinations.sort(
    (a, b) =>
      a.totalWeightedError / a.totalWeight -
      b.totalWeightedError / b.totalWeight,
  );
  return combinations[0]?.linesInCombination ?? functions;
}
export function generateNextDaySchedule(
  data: ExamData[],
  date: string,
  lines: Line[],
  completed = new Set<string>(),
): ConfidenceUpdates[] {
  return lines.flatMap((line) => {
    const exam = data.find((exam) => exam.id === line.examId);
    if (!exam || exam.exam_date.slice(0, 10) <= date) return [];
    refreshPriorities(exam, date);
    const change = Math.max(
      0,
      line.fnc(line.startDayNum + 1) - line.fnc(line.startDayNum),
    );
    const update = getNextDayExamGoal(exam, change, date, completed);
    return update.confidenceIncrease > 1e-9 ? [update] : [];
  });
}
export async function generateFullSchedule(
  allData: ExamData[],
  start: string,
  completedMaterialIds: string[] = [],
): Promise<FullSchedule> {
  const data = structuredClone(allData);
  const schedule: FullSchedule = new Map();
  const end = data.reduce(
    (latest, exam) =>
      exam.exam_date.slice(0, 10) > latest
        ? exam.exam_date.slice(0, 10)
        : latest,
    start,
  );
  for (
    let date = start;
    date < end;
    date = new Date(Date.parse(date) + 86400000).toISOString().slice(0, 10)
  ) {
    data.forEach((exam) => refreshPriorities(exam, date));
    const updates = generateNextDaySchedule(
      data,
      date,
      getExamConfidenceFunctions(data, false, date),
      new Set(date === start ? completedMaterialIds : []),
    );
    schedule.set(date, structuredClone(updates));
    for (const update of updates)
      await updateExamData(
        data.find((exam) => exam.id === update.studyMaterial.id)!,
        date,
        update,
      );
  }
  return schedule;
}
export async function updateExamData(
  parent: StudyMaterial,
  date: string,
  update?: ConfidenceUpdates,
  database?: {
    updateMainTables: updateMainTablesType;
    insertEntryTables?: insertEntryTablesType;
  },
) {
  if (!update) {
    refreshPriorities(parent, date);
    return;
  }
  const before = boundedConfidence(parent.confidence);
  const children = getStudyMaterialInfo(parent).subStudyMaterial;
  if (children?.length) {
    for (const child of children) {
      const childUpdate = update.childrenConfidenceUpdates?.get(child.id);
      if (childUpdate) await updateExamData(child, date, childUpdate, database);
    }
    parent.confidence =
      children.reduce(
        (sum, child) => sum + boundedConfidence(child.confidence),
        0,
      ) / children.length;
  } else
    parent.confidence = boundedConfidence(before + update.confidenceIncrease);
  parent.last_studied = update.newDate;
  refreshPriorities(parent, date);
  if (database) {
    await database.updateMainTables(parent);
    await database.insertEntryTables?.(
      parent,
      parent.confidence! - before,
      date,
    );
  }
}
export function printExams(exams: ExamData[]) {
  console.log(exams);
}

export function getCombinations(functions: Line[]) {
  let allFunctions = [];
  for (let i = 0; i < functions.length; i++) {
    allFunctions.push(functions[i]);

    let inverseFunction = createFunction(
      1 / functions[i].exponent,
      functions[i].startDayNum,
      functions[i].startingConfidenceLevel,
      functions[i].endDayNum,
      functions[i].confidenceGoal,
      functions[i].examId,
    );

    allFunctions.push(inverseFunction);
  }
  let res1 = getCombinationsHelper(allFunctions, 0);
  let res2 = getCombinationsHelper(allFunctions, 1);

  let combinations: Combination[] = [...res1, ...res2];
  return combinations;
}

/**
 * Finds the optimal pairing between functions created from createFunction and their inverses.
 * @param lines
 * @param n
 * @returns
 */
export function getCombinationsHelper(lines: Line[], n: number): Combination[] {
  if (n >= lines.length - 2) {
    return [
      { linesInCombination: [lines[n]], totalWeightedError: 0, totalWeight: 0 },
    ];
  } else {
    if (n % 2 == 0) {
      var part1 = getCombinationsHelper(lines, n + 2);
      var part2 = getCombinationsHelper(lines, n + 3);
      var allCombinations = [...part1, ...part2];
    } else {
      var part1 = getCombinationsHelper(lines, n + 1);
      var part2 = getCombinationsHelper(lines, n + 2);
      var allCombinations = [...part1, ...part2];
    }
    allCombinations.map((combination) => {
      let linesInCombination: Line[] = combination.linesInCombination;
      linesInCombination.push(lines[n]);
      let len = linesInCombination.length;
      for (let i = len - 2; i >= 0; i--) {
        let weightedCorrelationCoefficient = calculateCorrelation(
          linesInCombination[len - 1],
          linesInCombination[i],
        );
        if (weightedCorrelationCoefficient) {
          combination.totalWeightedError +=
            weightedCorrelationCoefficient.weightedCorrelationCoefficient;
          combination.totalWeight += weightedCorrelationCoefficient.weight;
        }
      }
    });
    return allCombinations;
  }
}

/**
 * Creates an object containing the data for a line whose vertex is at the y-intercept. Used to model the progress of studying for an exam
 * and create goals for the user
 * @param exponent
 * @param startDayNum
 * @param startingConfidenceLevel
 * @param endDayNum
 * @param confidenceGoal
 * @param examId
 * @returns
 */
export function createFunction(
  exponent: number,
  startDayNum: number,
  startingConfidenceLevel: number,
  endDayNum: number,
  confidenceGoal: number,
  examId: string,
): Line {
  let x0_exp = Math.pow(startDayNum, exponent);
  let x1_exp = Math.pow(endDayNum, exponent);

  // Calculate the value of a
  let a =
    x0_exp === x1_exp
      ? 0
      : (startingConfidenceLevel - confidenceGoal) / (x0_exp - x1_exp);
  // console.log(a)
  // console.log("Starting CL: " + startingConfidenceLevel)
  // console.log("Starting CG: " + confidenceGoal)
  // console.log("Start Day: " + startDayNum)
  // console.log("End Day: " +endDayNum)
  // console.log("x0_exp: " + x0_exp)
  // console.log("x1_exp " +x1_exp)

  // Calculate the value of k using the first equation
  let k = startingConfidenceLevel - a * x0_exp;
  return {
    fnc: (x: number) => a * x ** exponent + k,
    coefficient: a,
    yIntercept: k,
    exponent: exponent,
    startDayNum: startDayNum,
    startingConfidenceLevel: startingConfidenceLevel,
    endDayNum: endDayNum,
    examId: examId,
    confidenceGoal: confidenceGoal,
  };
}

export function calculateCorrelation(
  f: Line,
  g: Line,
): { weightedCorrelationCoefficient: number; weight: number } | null {
  //find the derivatives
  let fPrime: Function = (x: number) =>
    f.coefficient * f.exponent * x ** (f.exponent - 1);
  let gPrime: Function = (x: number) =>
    g.coefficient * g.exponent * x ** (g.exponent - 1);

  //find the overlapping interval
  let start = Math.max(f.startDayNum, g.startDayNum);
  let end = 0;
  if (Math.min(start, f.endDayNum, g.endDayNum) == start) {
    end = Math.min(f.endDayNum, g.endDayNum);
  }
  let fPrimeY = [];
  let gPrimeY = [];

  for (let i = start; i <= end; i++) {
    let res1 = fPrime(i);
    let res2 = gPrime(i);
    if (Number.isFinite(res1) && Number.isFinite(res2)) {
      // console.log("Insert:" + res1, res2)
      fPrimeY.push(res1);
      gPrimeY.push(res2);
    }
  }

  if (fPrimeY.length < 2) {
    return null;
  }
  let weight = (end - start) * 0.1;

  return {
    weightedCorrelationCoefficient: correlation(fPrimeY, gPrimeY) * weight,
    weight: weight,
  };
}
