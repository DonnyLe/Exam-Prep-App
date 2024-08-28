"use client";

import { Dispatch, SetStateAction, useContext, useState } from "react";
import SubtopicsConfienceForm, { Subtopic } from "./subtopics";
// import { Subtopics } from "@/utils/classes/Subtopics";
import { Label } from "@/components/ui/label";
import { ConfidenceData, StudyType } from "./[user_id]/page";
import { Slider } from "@/components/ui/slider";
import { ConfidenceFormContext } from "./exams";


export type Topic = {
  confidence: number | null;
  exam_id: string;
  id: string;
  last_studied: string | null;
  name: string;
  subtopics: Subtopic[] | null;
};

export default function TopicConfidenceForm({
  topics,
  exam_id
}: {
  topics: Topic[];
  exam_id: string
}) {
  const confidenceFormContext = useContext(ConfidenceFormContext);

  return (
    <div>
      {topics.map((topic, index) => (
        <div key={index}>
          {topic.subtopics != null && topic.subtopics.length > 0 ? (
            <SubtopicsConfienceForm exam_id={exam_id}subtopics={topic.subtopics} />
          ) : topic.confidence == null ? (
            <div>
              <Label>{topic.name}</Label>
              <Slider
                onValueCommit={(value: number[]) => {
                  value;
                  let confidenceLevels = confidenceFormContext.confidenceLevels
                  let updateConfidenceLevels = confidenceFormContext.updateConfidenceLevels

                  const allChanges = new Map(confidenceLevels);
                  const examChanges = new Map(allChanges.get(exam_id));

                  examChanges.set(topic.id, {
                    confidenceIncrease: value[0] - (topic.confidence ?? 0),
                    currentConfidence: topic.confidence,
                    studyMaterialName: topic.name,
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
            <div> </div>
          )}
        </div>
      ))}
    </div>
  );
}
