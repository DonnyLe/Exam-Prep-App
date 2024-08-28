"use client";
import { Button } from "@/components/ui/button";
import { ExamData } from "../dashboard/[user_id]/page";
import { ConfidenceData } from "./[user_id]/page";
import TopicConfidenceForm from "./topics";
import { updateConfidenceScores } from "../actions";
import { createContext, useState } from "react";
import { StudyMaterialConfidenceUpdates } from "@/lib/algorithm-types";

export const ConfidenceFormContext = createContext({
  confidenceLevels: new Map<
    string,
    Map<string, StudyMaterialConfidenceUpdates>
  >(),
  updateConfidenceLevels: (
    val: Map<string, Map<string, StudyMaterialConfidenceUpdates>>
  ) => {},
});

export default function ExamConfidenceForm({
  data,
  user_id,
}: {
  data: ExamData;
  user_id: string;
}) {
  const [confidenceLevels, updateConfidenceLevels] = useState<
    Map<string, Map<string, StudyMaterialConfidenceUpdates>>
  >(new Map());

  return (
    <ConfidenceFormContext.Provider
      value={{
        confidenceLevels: confidenceLevels,
        updateConfidenceLevels: (
          newVal: Map<string, Map<string, StudyMaterialConfidenceUpdates>>
        ) => updateConfidenceLevels(newVal),
      }}
    >
      <div className="space-y-5">
        {data.map((exam, index) => (
          <div key={index}>
            <h1> {exam.name}</h1>
            <div key={index}>
              <TopicConfidenceForm exam_id={exam.id} topics={exam.topics} />
            </div>
          </div>
        ))}

        <Button
          onClick={() =>
            updateConfidenceScores(
              data,
              new Date().toISOString().split("T")[0],
              confidenceLevels
            )
          }
        >
          Submit
        </Button>
      </div>
    </ConfidenceFormContext.Provider>
  );
}
