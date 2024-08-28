import { ExamData } from "@/app/dashboard/[user_id]/page";
import { Heap } from "heap-js";
import { correlation } from "@mathigon/fermat";
import {
  Combination,
  ExamGoal,
  FullSchedule,
  Function,
  Line,
  StudyMaterial,
  StudyMaterialConfidenceUpdates,
  updateEntryTablesType,
  updateMainTablesType,
} from "@/lib/algorithm-types";

export var studyingStartDate = "";
export var studyingEndDate = "";

/**
 * Calls getNextDayExamGoal for all exams if the chosen day is within the span of exams' start and end date.
 * @param studyMaterial
 * @param selectedDate
 * @param studyTrajectoryLines
 * @param usePredictedData
 * @returns an array of ExamGoal
 */
export function generateNextDaySchedule(
  studyMaterial: ExamData,
  selectedDate: string,
  studyTrajectoryLines: Line[],
  usePredictedData?: boolean
) {
  let allExamsDailyGoals: ExamGoal[] = [];

  for (let i = 0; i < studyTrajectoryLines.length; i++) {
    // * make more efficient if convert studyMaterial into a dictionary for faster getting
    let exam = studyMaterial.find(
      (studyMaterial) => studyMaterial.id == studyTrajectoryLines[i].examId
    );
    let currentDayIndex = daysBetween(selectedDate, studyingStartDate);
    if (
      currentDayIndex >= daysBetween(exam!.created_at!, studyingStartDate) &&
      currentDayIndex < daysBetween(exam!.exam_date!, studyingStartDate)
    ) {
      let confidenceChange =
        studyTrajectoryLines[i].fnc(currentDayIndex + 1) -
        (usePredictedData
          ? studyTrajectoryLines[i].fnc(currentDayIndex)
          : exam!.confidence!);

      let examDailyGoals: ExamGoal = getNextDayExamGoal(
        exam!,
        confidenceChange,
        selectedDate
      );
      examDailyGoals.examId = exam!.id;
      examDailyGoals.examName = exam!.name;
      examDailyGoals.currentConfidence = exam!.confidence!;

      allExamsDailyGoals.push(examDailyGoals);
    }
  }
  return allExamsDailyGoals;
}

/**
 * Makes a copy of the fetched data and calls generateNextDaySchedule repeatedly untill the endDate to
 * create a Map of dates to ExamGoals.
 * @param allData
 * @param startDate
 * @returns
 */
export function generateFullSchedule(allData: ExamData, startDate: string) {
  const data = structuredClone(allData);
  let res: FullSchedule = new Map<string, ExamGoal[]>();

  let datesList: string[] = getDatesBetween(startDate, studyingEndDate);

  for (let i = 0; i < datesList.length; i++) {
    let studyTrajectoryLines = getExamConfidenceFunctions(
      data,
      true,
      datesList[i]
    );
    let examsDailyGoals: ExamGoal[] = generateNextDaySchedule(
      data,
      datesList[i],
      studyTrajectoryLines
    );
    res.set(datesList[i], examsDailyGoals);
    for (let j = 0; j < examsDailyGoals.length; j++) {
      let exam = data.find((a) => a.id == examsDailyGoals[j].examId);
      if (exam) {
        updateExamData(
          exam,
          exam.created_at,
          datesList[i],
          examsDailyGoals[j].allStudyMaterialGoals
        );
      }
    }
  }
  return res;
}

function getDatesBetween(start: string, end: string): string[] {
  const startDate = new Date(start);
  const endDate = new Date(end);

  const isoDates: string[] = [];

  while (startDate <= endDate) {
    isoDates.push(startDate.toISOString().split("T")[0]);
    startDate.setDate(startDate.getDate() + 1);
  }

  return isoDates;
}

/**
 * Updates the start and end dates (global variables)
 * @param allData
 * @param chosenDay
 */
export function updateGlobalDates(allData: ExamData, chosenDay: string) {
  //find start day
  let maxDaysBetweenStartCurrent = 0;
  let maxDaysBetweenCurrentEnd = 0;

  for (let i = 0; i < allData.length; i++) {
    let created_at = allData[i].created_at;
    let exam_date = allData[i].exam_date;

    if (created_at && exam_date) {
      let daysBetweenStartCurrent = daysBetween(created_at, chosenDay);
      let daysBetweenCurrentEnd = daysBetween(exam_date, chosenDay);
      if (daysBetweenStartCurrent > maxDaysBetweenStartCurrent) {
        maxDaysBetweenStartCurrent = daysBetweenStartCurrent;
        studyingStartDate = created_at;
      }
      if (daysBetweenCurrentEnd > maxDaysBetweenCurrentEnd) {
        maxDaysBetweenCurrentEnd = daysBetweenCurrentEnd;
        studyingEndDate = exam_date;
      }
    }
  }
}

export function calculateConfidenceIncrease(currentConfidence: number) {
  return -0.5 * currentConfidence + 5;
}

/**
 * Recursive helper function that uses heaps to assign goals for ONE exam.
 * @param parent
 * @param parentConfidenceIncreaseAmount
 * @param selectedDate
 * @returns
 */
function getNextDayExamGoal(
  parent: StudyMaterial,
  parentConfidenceIncreaseAmount: number,
  selectedDate: string
): ExamGoal {
  let res = getStudyMaterialInfo(parent);
  let children = res.subStudyMaterial;
  if (children) {
    //ignore all study material that does not have a confidence/priority value
    children = children.filter((a: StudyMaterial) => a.confidence != null);

    const maxPriorityComparator = (a: StudyMaterial, b: StudyMaterial) =>
      b.priority! - a.priority!;
    const maxHeap = new Heap(maxPriorityComparator);
    maxHeap.init(children);
    let parentDailyGoal: ExamGoal = {
      examId: "",
      examName: "",
      currentConfidence: parent.confidence!,
      totalConfidenceIncrease: 0,
      allStudyMaterialGoals: new Map<string, StudyMaterialConfidenceUpdates>(),
    };
    let len = children.length;
    while (parentConfidenceIncreaseAmount > 0) {
      let child = maxHeap.pop();
      if (child) {
        //if the calculated confidence increase is higher than the amount of confidence increase left,
        //take the amount of confidence left
        let childConfidenceIncrease = Math.min(
          calculateConfidenceIncrease(child.confidence!),
          parentConfidenceIncreaseAmount * len
        );
        let childDailyGoals: ExamGoal = getNextDayExamGoal(
          child,
          childConfidenceIncrease,
          selectedDate
        );
        let actualParentConfidenceIncrease =
          childDailyGoals.totalConfidenceIncrease / len;

        parentDailyGoal.totalConfidenceIncrease +=
          actualParentConfidenceIncrease;
        childDailyGoals.allStudyMaterialGoals.forEach(
          (value: StudyMaterialConfidenceUpdates, key: string) => {
            parentDailyGoal.allStudyMaterialGoals.set(key, value);
          }
        );
        parentConfidenceIncreaseAmount -= actualParentConfidenceIncrease;
      } else {
        break;
      }
    }
    return parentDailyGoal;
  } else {
    return {
      examId: "",
      examName: "",
      currentConfidence: 0,
      totalConfidenceIncrease: Math.ceil(parentConfidenceIncreaseAmount),
      allStudyMaterialGoals: new Map<string, StudyMaterialConfidenceUpdates>([
        [
          parent.id,
          {
            studyMaterialName: parent.name,
            currentConfidence: parent.confidence!,
            confidenceIncrease: Math.ceil(parentConfidenceIncreaseAmount),
            date: selectedDate,
          },
        ],
      ]),
    };
  }
}

/**
 * Calls createFunction, getCombinations, etc. to get confidence functions for all exams
 * @param allData
 * @param optimizeSchedule
 * @param currentDay
 * @returns
 */
export function getExamConfidenceFunctions(
  allData: ExamData,
  optimizeSchedule: boolean,
  currentDay: string
) {
  let functions: Line[] = [];
  for (let i = 0; i < allData.length; i++) {
    let confidence = allData[i].confidence;

    if (confidence) {
      let confidenceGoal = allData[i].confidence_goal ?? 9;

      functions.push(
        createFunction(
          1.7, // * have the ability to change this modifier
          daysBetween(studyingStartDate, currentDay),
          confidence,
          daysBetween(studyingStartDate, allData[i].exam_date),
          confidenceGoal,
          allData[i].id
        )
      );
    }
  }
  if (optimizeSchedule) {
    let combinations: Combination[] = getCombinations(functions);
    let min = Infinity;
    let minIndex = 0;
    combinations.forEach((combination, index) => {
      let error = combination.totalWeightedError / combination.totalWeight;
      if (error < min) {
        min = error;
        minIndex = index;
      }
    });

    functions = combinations[minIndex].linesInCombination;
  }
  return functions;
}

/**
 * Creates inverses of functions and calls getCombinationsHelper
 * @param functions
 * @returns
 */
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
      functions[i].examId
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
          linesInCombination[i]
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
  examId: string
): Line {
  let x0_exp = Math.pow(startDayNum, exponent);
  let x1_exp = Math.pow(endDayNum, exponent);

  // Calculate the value of a
  let a = (startingConfidenceLevel - confidenceGoal) / (x0_exp - x1_exp);

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
  g: Line
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

/**
 * Updates exam data with new confidence values. Used by generateFullSchedule function to simulate changes in the database
 * @param parent parent study material (usually an exam)
 * @param examCreateDate create date of exam
 * @param selectedDate used to calculate priority parameter
 * @param confidenceUpdates confidence increases/decreases
 * @param updateDatabase functions to not only modify the parent object but to modify the database.
 *                       Can optionally add update instances to history inside of database
 */
export async function updateExamData(
  parent: StudyMaterial,
  examCreateDate: string,
  selectedDate: string,
  confidenceUpdates: Map<string, StudyMaterialConfidenceUpdates>,
  updateDatabase?: {
    updateMainTables: updateMainTablesType;
    updateEntryTables?: updateEntryTablesType;
  }
) {
  let res = getStudyMaterialInfo(parent);
  let children = res.subStudyMaterial;
  let originalParentConfidence = parent.confidence;

  if (children) {
    let updatedData = await getUpdatedParentStudyMaterialData(
      children,
      examCreateDate,
      selectedDate,
      confidenceUpdates,
      updateDatabase
    );

    if (originalParentConfidence != updatedData.updatedParentConfidence) {
      parent.confidence = updatedData.updatedParentConfidence;
      parent.last_studied = updatedData.updatedParentLastStudyDate;
      parent.priority = updatedData.updatedParentLastStudyDate
        ? (parent.confidence + 5) ** -1 * 70 +
          1.2 **
            daysBetween(updatedData.updatedParentLastStudyDate, selectedDate)
        : null;
      if (updateDatabase) {
        updateDatabase.updateMainTables(parent);
        if (
          updateDatabase.updateEntryTables &&
          updatedData.childEntriesIds.length != 0
        ) {
          let parentEntryId =
            await updateDatabase.updateEntryTables.insertFunction(
              parent,
              updatedData.updatedParentConfidence -
                (originalParentConfidence ?? 3)
            );
          updatedData.childEntriesIds.forEach((childEntryId: string) => {
            updateDatabase.updateEntryTables!.updateFunction(
              childEntryId,
              parentEntryId,
              parent
            );
          });
        }
      }
    } else {
      if (confidenceUpdates) {
        let confidenceChange = confidenceUpdates.get(parent.id);
        if (confidenceChange) {
          parent.confidence =
            confidenceChange.confidenceIncrease + (parent.confidence ?? 0);
          parent.last_studied = confidenceChange.date;
          parent.priority =
            (confidenceChange.confidenceIncrease + parent.confidence + 5) **
              -1 *
              70 +
            1.2 ** daysBetween(confidenceChange.date, selectedDate);
          if (updateDatabase) {
            updateDatabase.updateMainTables(parent);
            if (updateDatabase.updateEntryTables) {
              updateDatabase.updateEntryTables.insertFunction(
                parent,
                confidenceChange.confidenceIncrease
              );
            }
          }
        }
      }
    }
  }
}

/**
 * Helper function to get updated parent data
 * @param childrenSubMaterial
 * @param examCreateDate
 * @param selectedDate
 * @param confidenceUpdates
 * @param updateDatabase
 * @returns an object containing updated parent study material data
 */
async function getUpdatedParentStudyMaterialData(
  childrenSubMaterial: StudyMaterial[],
  examCreateDate: string,
  selectedDate: string,
  confidenceUpdates: Map<string, StudyMaterialConfidenceUpdates>,
  updateDatabase?: {
    updateMainTables: updateMainTablesType;
    updateEntryTables?: updateEntryTablesType;
  }
) {
  let numValidStudyMaterial = 0;
  let sum: number | null = 0;
  let studyMaterialLastStudied: string | null = null;
  let minDaysLastStudied = Infinity;

  let childEntriesIds = [];
  for (let k = 0; k < childrenSubMaterial.length; k++) {
    let originalSubMaterialConfidence = childrenSubMaterial[k].confidence;
    updateExamData(
      childrenSubMaterial[k],
      examCreateDate,
      selectedDate,
      confidenceUpdates,
      updateDatabase
    );
    let updatedSubMaterialConfidence = childrenSubMaterial[k].confidence;

    numValidStudyMaterial++;
    sum += updatedSubMaterialConfidence ?? 3;
    if (
      updateDatabase &&
      updateDatabase.updateEntryTables &&
      updatedSubMaterialConfidence != originalSubMaterialConfidence
    ) {
      childEntriesIds.push(
        await updateDatabase.updateEntryTables.insertFunction(
          childrenSubMaterial[k],
          (updatedSubMaterialConfidence ?? 0) -
            (originalSubMaterialConfidence ?? 3)
        )
      );
    }
    let subMaterialLastStudied = childrenSubMaterial[k].last_studied;
    if (subMaterialLastStudied) {
      let numDaysLastStudied = daysBetween(
        subMaterialLastStudied,
        selectedDate
      );

      if (numDaysLastStudied < minDaysLastStudied) {
        minDaysLastStudied = numDaysLastStudied;
        studyMaterialLastStudied = subMaterialLastStudied;
      }
    }
  }
  return {
    updatedParentConfidence: sum / numValidStudyMaterial,
    updatedParentLastStudyDate: studyMaterialLastStudied,
    childEntriesIds,
  };
}

/**
 * Gets information regarding study material (e.g. type and the StudyMaterial's children)
 * @param data
 * @returns
 */
export function getStudyMaterialInfo(data: StudyMaterial): {
  subStudyMaterial: StudyMaterial[] | null;
  studyMaterialType: "exams" | "topics" | "subtopics";
} {
  let subtopics: StudyMaterial[] | undefined = data.subtopics;
  let topics: StudyMaterial[] | undefined = data.topics;
  if (subtopics && subtopics.length > 0) {
    return { subStudyMaterial: subtopics, studyMaterialType: "topics" };
  } else if (topics && topics.length > 0) {
    return { subStudyMaterial: topics, studyMaterialType: "exams" };
  } else {
    return { subStudyMaterial: null, studyMaterialType: "subtopics" };
  }
}

/**
 * Calculates the number of days between two ISOString dates (e.g 2024-06-28)
 * @param date1
 * @param date2
 * @returns absolute value of the number of days between dates
 */
export function daysBetween(date1: string, date2: string): number {
  if (date1) {
    // Parse the date string into a Date object
    const d1 = new Date(date1);

    // Get the current date
    const d2 = new Date(date2);

    // Calculate the difference in time (milliseconds)
    const diffInTime = Math.abs(d2.getTime() - d1.getTime());

    // Convert the time difference from milliseconds to days
    const diffInDays = Math.ceil(diffInTime / (1000 * 60 * 60 * 24));

    return diffInDays;
  }
  return 0;
}

/**
 * Utility function to print an ExamData object
 * @param exams
 */
export function printExams(exams: ExamData) {
  for (let i = 0; i < exams.length; i++) {
    console.log("Exam Name: " + exams[i].name);
    console.log("Exam Confidence: " + exams[i].confidence);
    console.log("Exam Create Date: " + exams[i].created_at);
    console.log("Exam Date: " + exams[i].exam_date);

    for (let j = 0; j < exams[i].topics.length; j++) {
      console.log("       Topic Name: " + exams[i].topics[j].name);
      console.log("       Topic Confidence: " + exams[i].topics[j].confidence);
      console.log("       Topic priority: " + exams[i].topics[j].priority);
      console.log("");
      let subtopics = exams[i].topics[j].subtopics ?? [];
      for (let k = 0; k < subtopics.length; k++) {
        console.log(
          "               Subtopic Name: " +
            exams[i].topics[j].subtopics[k].name
        );

        console.log(
          "               Subtopic Confidence: " +
            exams[i].topics[j].subtopics[k].confidence
        );
        console.log(
          "               Subtopic Priority: " +
            exams[i].topics[j].subtopics[k].priority
        );
      }
    }
  }
}
