"use client";
import { Button } from "@/components/ui/button";
import { ExamData } from "../dashboard/[user_id]/page";
import { ConfidenceData } from "./[user_id]/page";
import TopicConfidenceForm from "./TopicForm";
import { updateConfidenceScores } from "../actions";
import {
  createContext,
  Dispatch,
  SetStateAction,
  useEffect,
  useState,
} from "react";
import { ConfidenceUpdates } from "@/lib/algorithm-types";
import {
  daysBetween,
  getStudyMaterialInfo,
} from "../schedule/algorithm/generateSchedule";
import { examFormSchema } from "@/lib/form-types";

export const appendChangesToParentFunction =
  (
    parentConfidenceUpdates: ConfidenceUpdates,
    updateParentConfidenceUpdates: Dispatch<SetStateAction<ConfidenceUpdates>>
  ) =>
  (child: ConfidenceUpdates) => {
    let parentConfidenceUpdatesCpy = structuredClone(parentConfidenceUpdates);
    let childrenConfidenceUpdatesMap =
      parentConfidenceUpdatesCpy.childrenConfidenceUpdates;
    if (parentConfidenceUpdatesCpy && childrenConfidenceUpdatesMap) {
      let { subStudyMaterial } = getStudyMaterialInfo(
        parentConfidenceUpdatesCpy.studyMaterial
      );
      let len = subStudyMaterial!.length;
      parentConfidenceUpdatesCpy.confidenceIncrease =
        (parentConfidenceUpdatesCpy?.confidenceIncrease! ?? 0) +
        (-(
          parentConfidenceUpdatesCpy?.childrenConfidenceUpdates?.get(
            child.studyMaterial.id
          )?.confidenceIncrease ?? 0
        ) +
          child.confidenceIncrease) /
          len;
      parentConfidenceUpdatesCpy.newDate =
        daysBetween(parentConfidenceUpdatesCpy.newDate, child.newDate) > 0
          ? child.newDate
          : parentConfidenceUpdatesCpy.newDate;
      parentConfidenceUpdatesCpy.childrenConfidenceUpdates!.set(
        child.studyMaterial.id,
        child
      );
      updateParentConfidenceUpdates(parentConfidenceUpdatesCpy);
    }
  };

export default function ExamConfidenceForm({
  exam,
  appendChangesToPage,
}: {
  exam: ExamData;
  appendChangesToPage: (child: ConfidenceUpdates) => void;
}) {
  const [examConfidenceUpdates, updateExamConfidenceUpdates] =
    useState<ConfidenceUpdates>({
      studyMaterial: exam,
      confidenceIncrease: 0,
      newDate: exam.last_studied,
      childrenConfidenceUpdates: new Map(),
    });

  useEffect(() => {
    appendChangesToPage(examConfidenceUpdates);
  }, [examConfidenceUpdates]);
  //if a topic is updated, update the exam study material confidence update
  return (
    <div className="space-y-5">
      <h1>{exam.name}</h1>
      <h1>{`Current Confidence: ${
        exam.confidence ?? 0
      }`}</h1>
      <h1>{`New Confidence: ${
        (exam.confidence ?? 0) + examConfidenceUpdates.confidenceIncrease
      }`}</h1>

      {exam.topics.map((topic, key) => (
        <>
          <TopicConfidenceForm
            key={key}
            appendChangesToExam={appendChangesToParentFunction(
              examConfidenceUpdates,
              updateExamConfidenceUpdates
            )}
            topic={topic}
          />
        </>
      ))}
    </div>
  );
}
