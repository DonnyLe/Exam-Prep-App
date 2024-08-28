import { expect, jest, test } from "@jest/globals";
import {
  calculateCorrelation,
  createFunction,
  daysBetween,
  generateFullSchedule,
  generateNextDaySchedule,
  getCombinations,
  getExamConfidenceFunctions,
  updateGlobalDates,
  printExams,
  studyingEndDate,
  updateExamData,
  studyingStartDate,
} from "../generateSchedule";
import { Line } from "@/lib/algorithm-types";
import { Combination } from "@/lib/algorithm-types";
import { StudyMaterialConfidenceUpdates } from "@/lib/algorithm-types";
import { FullSchedule } from "@/lib/algorithm-types";

import { sampleExamData } from "./sampleData";

beforeEach(() => {
  global.console = require("console");
});

let functions: Line[] = [];

test("Test updateConfidenceAndPriority", () => {
  for (let i = 0; i < sampleExamData.length; i++) {
    let updatedExamData = updateExamData(
      sampleExamData[i],
      sampleExamData[i].created_at,
      "2024-08-25",
      new Map<string, StudyMaterialConfidenceUpdates>()
    );
  }
});

test("Test initializeData", () => {
  updateGlobalDates(sampleExamData, "2024-08-25");

  expect(studyingStartDate).toEqual("2024-08-21");
  expect(studyingEndDate).toEqual("2024-09-04");
});

test("Test getExamConfidenceFunctions ", () => {
  let exam1 = sampleExamData[0];
  let exam2 = sampleExamData[1];
  let exam3 = sampleExamData[2];

  let startDayIndexExam1 = daysBetween(studyingStartDate, exam1.created_at);
  let endDayIndexExam1 = daysBetween(studyingStartDate, exam1.exam_date);
  let startDayIndexExam2 = daysBetween(studyingStartDate, exam2.created_at);
  let endDayIndexExam2 = daysBetween(studyingStartDate, exam2.exam_date);
  let startDayIndexExam3 = daysBetween(studyingStartDate, exam3.created_at);
  let endDayIndexExam3 = daysBetween(studyingStartDate, exam3.exam_date);

  functions.push(
    createFunction(
      1.7,
      startDayIndexExam1,
      exam1.confidence!,
      endDayIndexExam1,
      exam1.confidence_goal!,
      exam1.id
    )
  );

  functions.push(
    createFunction(
      1.7,
      startDayIndexExam2,
      exam2.confidence!,
      endDayIndexExam2,
      exam2.confidence_goal!,
      exam2.id
    )
  );

  functions.push(
    createFunction(
      1.7,
      startDayIndexExam3,
      exam3.confidence!,
      endDayIndexExam3,
      exam3.confidence_goal!,
      exam3.id
    )
  );

  // functions.forEach((fnc) => {
  //   console.log();
  //   console.log("a: " + fnc.coefficient);
  //   console.log("c: " + fnc.yIntercept);
  //   console.log("exponent: " + fnc.exponent);
  //   console.log("(x1, y1): (" + fnc.startDayNum + ", N/A");
  //   console.log("(x2, y2): (" + fnc.endDayNum + ", " + fnc.confidenceGoal + ")");

  // })
});

test("Test calculateCovariance", () => {
  let allFunctions = [];
  for (let i = 0; i < functions.length; i++) {
    allFunctions.push(functions[i]);
    let newCoefficient =
      (functions[i].confidenceGoal - functions[i].yIntercept) /
      functions[i].endDayNum ** (1 / functions[i].exponent);
    allFunctions.push(
      createFunction(
        1 / functions[i].exponent,
        functions[i].startDayNum,
        functions[i].startingConfidenceLevel,
        functions[i].endDayNum,
        functions[i].confidenceGoal,
        functions[i].examId
      )
    );
  }
  let res = calculateCorrelation(allFunctions[3], allFunctions[5]);
  // console.log(res?.weight, res?.weightedCorrelationCoefficient);
});

test("Test getCombinations", () => {
  let res1: Combination[] = getCombinations(functions);
  res1.forEach((combination, index) => {
    console.log("Combination " + index + ": ");
    console.log("Total Weighted Error: " + combination.totalWeightedError);
    console.log("Total Weight: " + combination.totalWeight);
    console.log();
    console.log("Lines in Combination: ");
    combination.linesInCombination.forEach((fnc) => {
      console.log();
      console.log("   a: " + fnc.coefficient);
      console.log("   c: " + fnc.yIntercept);
      console.log("   exponent: " + fnc.exponent);
      console.log(
        "(x1, y1): (" + fnc.startDayNum + ", " + fnc.startingConfidenceLevel
      );
      console.log(
        "   (x2, y2): (" + fnc.endDayNum + ", " + fnc.confidenceGoal + ")"
      );
    });
  });
});
let optimalConfidenceFunctions: Line[] = [];

test("Test getExamConfidenceFunctions with OptimizeSchedule ", () => {
  optimalConfidenceFunctions = getExamConfidenceFunctions(
    sampleExamData,
    true,
    "2024-08-25"
  );
  optimalConfidenceFunctions.forEach((fnc) => {
    console.log("ExamID: " + fnc.examId);
    console.log("   a: " + fnc.coefficient);
    console.log("   c: " + fnc.yIntercept);
    console.log("   exponent: " + fnc.exponent);
    console.log(
      "(x1, y1): (" + fnc.startDayNum + ", " + fnc.startingConfidenceLevel
    );
    console.log(
      "   (x2, y2): (" + fnc.endDayNum + ", " + fnc.confidenceGoal + ")"
    );
  });
});

test("Test generateNextDaySchedule", () => {
  let res = generateNextDaySchedule(
    sampleExamData,
    "2024-08-25",
    optimalConfidenceFunctions,
    true
  );
  res.forEach((examStudyGoal) => {
    console.log("Exam Name: " + examStudyGoal.examName);
    console.log("Exam ID: " + examStudyGoal.examId);

    console.log(
      "Total Confidence Increase: " + examStudyGoal.totalConfidenceIncrease
    );
    console.log();
    examStudyGoal.allStudyMaterialGoals.forEach((studyMaterialGoal) => {
      console.log(
        "Study Material Name: " + studyMaterialGoal.studyMaterialName
      );
      console.log(
        "Study Material Current Confidence: " +
          studyMaterialGoal.currentConfidence
      );
      console.log(
        "Study Material Confidence Increase: " +
          studyMaterialGoal.confidenceIncrease
      );
      console.log();
    });
  });
});

test("Test generateFullSchedule", () => {
  let res: FullSchedule = generateFullSchedule(sampleExamData, "2024-08-21");
  res.forEach((day, key) => {
    console.log("Date: " + key);
    day.forEach((examsGoals) => {
      console.log("   Exam Name: " + examsGoals.examName);
      console.log(
        "   Goal Confidence Increase: " + examsGoals.totalConfidenceIncrease
      );
      console.log(
        "   Exam Current Confidence: " + examsGoals.currentConfidence
      );
      console.log(
        "   Goal Confidence: " +
          (examsGoals.currentConfidence + examsGoals.totalConfidenceIncrease)
      );

      examsGoals.allStudyMaterialGoals.forEach((studyMaterialGoal) => {
        console.log(
          "      Study Material Name: " + studyMaterialGoal.studyMaterialName
        );
        console.log(
          "      Study Material Current Confidence: " +
            studyMaterialGoal.currentConfidence
        );
        console.log(
          "      Study Material Confidence Increase: " +
            studyMaterialGoal.confidenceIncrease
        );
        console.log();
      });
      console.log();
    });
    console.log();
    console.log();
  });
});
