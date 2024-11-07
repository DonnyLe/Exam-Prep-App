"use client";
import { Dispatch, SetStateAction, useContext, useState } from "react";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { ConfidenceData } from "./[user_id]/page";
import { StudyType } from "@/lib/form-types";
import { SubtopicData } from "@/lib/algorithm-types";
import { ConfidenceUpdates } from "@/lib/algorithm-types";

export default function SubtopicsConfienceForm({
  subtopic,
  appendChangesToParent,
}: {
  subtopic: SubtopicData;
  appendChangesToParent: (child: ConfidenceUpdates) => void;
}) {
  return (
    <>
      <Label>{subtopic.name}</Label>
      <h1>{subtopic.confidence}</h1>
      <Slider
        onValueCommit={(value: number[]) => {
          let subtopicConfidenceUpdate: ConfidenceUpdates = {
            studyMaterial: subtopic,
            confidenceIncrease: value[0] - (subtopic.confidence ?? 0),
            newDate: new Date().toISOString().split("T")[0],
            childrenConfidenceUpdates: null,
          };
          appendChangesToParent(subtopicConfidenceUpdate);
        }}
        defaultValue={[subtopic.confidence ?? 0]}
        max={10}
        min={0}
        step={1}
      />
    </>
  );
}
