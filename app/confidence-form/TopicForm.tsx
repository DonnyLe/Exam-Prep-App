"use client";

import {
  Dispatch,
  SetStateAction,
  useContext,
  useEffect,
  useState,
} from "react";

// import { Subtopics } from "@/utils/classes/Subtopics";
import { Label } from "@/components/ui/label";
import { StudyType } from "@/lib/form-types";
import { Slider } from "@/components/ui/slider";
import { ConfidenceUpdates } from "@/lib/algorithm-types";
import { SubtopicData, TopicData } from "@/lib/algorithm-types";
import { appendChangesToParentFunction } from "./ExamForm";
import SubtopicsConfienceForm from "./SubtopicForm";

export default function TopicConfidenceForm({
  topic,
  appendChangesToExam,
}: {
  topic: TopicData;
  appendChangesToExam: (child: ConfidenceUpdates) => void;
}) {
  appendChangesToParentFunction;
  if (topic.subtopics.length > 0) {
    const [topicConfidenceUpdates, updateTopicConfidenceUpdates] =
      useState<ConfidenceUpdates>({
        studyMaterial: topic,
        confidenceIncrease: 0,
        newDate: topic.last_studied,
        childrenConfidenceUpdates: new Map(),
      });
    console.log(topicConfidenceUpdates.confidenceIncrease);
    useEffect(() => {
      appendChangesToExam(topicConfidenceUpdates);
    }, [topicConfidenceUpdates]);
    return (
      <>
        <h1>{`Topic: ${topic.name}`}</h1>
        <h1>{`Current Confidence: ${topic.confidence ?? 0}`}</h1>
        <h1>{`New Confidence: ${
          (topic.confidence ?? 0) + topicConfidenceUpdates.confidenceIncrease
        }`}</h1>

        {topic.subtopics.map((subtopic, key) => (
          <SubtopicsConfienceForm
            key={key}
            subtopic={subtopic}
            appendChangesToParent={appendChangesToParentFunction(
              topicConfidenceUpdates,
              updateTopicConfidenceUpdates
            )}
          />
        ))}
      </>
    );
  } else {
    return (
      <div>
        <h1>{topic.confidence ?? 0}</h1>
        <Label>{topic.name}</Label>
        <Slider
          onValueCommit={(value: number[]) => {
            let topicConfidenceUpdate: ConfidenceUpdates = {
              studyMaterial: topic,
              confidenceIncrease: value[0] - (topic.confidence ?? 0),
              newDate: new Date().toISOString().split("T")[0],
              childrenConfidenceUpdates: null,
            };
            appendChangesToExam(topicConfidenceUpdate);
          }}
          defaultValue={[5]}
          max={10}
          min={0}
          step={1}
        />
      </div>
    );
  }
}
