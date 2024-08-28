"use client";
import { Dispatch, SetStateAction, useContext, useState } from "react";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { ConfidenceData, StudyType } from "./[user_id]/page";
import {
  ConfidenceFormContext,

} from "./exams";

export type Subtopic = {
  confidence: number | null;
  id: string;
  last_studied: string | null;
  name: string;
  topic_id: string;
};

export default function SubtopicsConfienceForm({
  subtopics,
  exam_id,
}: {
  subtopics: Subtopic[];
  exam_id: string;
}) {
  const confidenceFormContext = useContext(ConfidenceFormContext);

  return (
    <div>
      {subtopics.map((subtopic, index) =>
        !subtopic.confidence ? (
          <div key={index}>
            <Label>{subtopic.name}</Label>
            <Slider
              onValueCommit={(value: number[]) => {
                let confidenceLevels = confidenceFormContext.confidenceLevels;
                let updateConfidenceLevels =
                  confidenceFormContext.updateConfidenceLevels;

                const allChanges = new Map(confidenceLevels);
                const examChanges = new Map(allChanges.get(exam_id));

                examChanges.set(subtopic.id, {
                  confidenceIncrease: value[0] - (subtopic.confidence ?? 0),
                  currentConfidence: subtopic.confidence,
                  studyMaterialName: subtopic.name,
                  date: new Date().toISOString().split("T")[0],
                });
                allChanges.set(exam_id, examChanges);

                updateConfidenceLevels(allChanges);
              }}
              defaultValue={[5]}
              max={10}
              min={1}
              step={1}
            />
          </div>
        ) : (
          <> </>
        )
      )}
    </div>
  );
}
