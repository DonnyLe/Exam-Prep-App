"use client";

import { useState } from "react";
import { ExamData } from "../dashboard/[user_id]/page";
import { ConfidenceUpdates } from "@/lib/algorithm-types";
import { Button } from "@/components/ui/button";
import { updateConfidenceScores } from "../actions";
import ExamConfidenceForm from "./ExamForm";

export default function ConfidenceForm({
  allExams,
  user_id,
}: {
  allExams: ExamData[];
  user_id: string;
}) {
  const [allExamConfidenceUpdates, updateAllExamConfidenceUpdates] = useState<
    Map<string, ConfidenceUpdates>
  >(new Map());
  const appendChangesToForm = (exam: ConfidenceUpdates) => {
    let cpy = new Map(allExamConfidenceUpdates);
    cpy.set(exam.studyMaterial.id, exam);
    updateAllExamConfidenceUpdates(cpy);
  };

  console.log(allExamConfidenceUpdates);
  
  return (
    <div>
      {allExams.map((exam, key) => {
        return (
          <ExamConfidenceForm
            key={key}
            exam={exam}
            appendChangesToPage={appendChangesToForm}
          />
        );
      })}
      <Button
        onClick={async () => {
          updateConfidenceScores(
            allExams,
            new Date().toISOString().split("T")[0],
            allExamConfidenceUpdates,
            user_id
          );
        }}
      ></Button>
    </div>
  );
}
