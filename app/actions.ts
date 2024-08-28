"use server";
import { createClient } from "@/utils/supabase/server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  ConfidenceData,
  StudyType,
} from "./initial-confidence-form/[user_id]/page";
import {
  getStudyMaterialInfo,
  updateExamData,
} from "./schedule/algorithm/generateSchedule";
import { StudyMaterial } from "@/lib/algorithm-types";
import { StudyMaterialConfidenceUpdates } from "@/lib/algorithm-types";

import { v4 as uuidv4 } from "uuid";
import { ExamFormData } from "@/lib/form-types";
import { ExamData } from "./dashboard/[user_id]/page";

export async function addExam(data: ExamFormData, user_id: string) {
  const supabase = createClient();
  let date: Date = new Date();
  let dateStr: string = date.toISOString();
  const { data: exams, error } = await supabase
    .from("exams")
    .insert([
      {
        exam_date: data.exam_date.toISOString(),
        name: data.exam_name,
        user_id: user_id,
        subject_id: data.subject_id,
      },
    ])
    .select("id");
  if (error) {
    console.log(error);
  }
  for (let i = 0; i < data.topics.length; i++) {
    if (exams) {
      const { data: topics, error } = await supabase
        .from("topics")
        .insert([{ name: data.topics[i].topic_name, exam_id: exams[0].id }])
        .select("id");
      for (let j = 0; j < data.topics[i].subtopics.length; j++) {
        if (topics) {
          const { error } = await supabase.from("subtopics").insert([
            {
              name: data.topics[i].subtopics[j].subtopic_name,
              topic_id: topics[0].id,
            },
          ]);
        }
        if (error) {
          console.log(error);
        }
      }
    }
    if (error) {
      console.log(error);
    }
  }
  revalidatePath("/dashboard/[user_id]", "page");
  redirect(`/dashboard/${user_id}`);
}

export async function updateConfidenceScores(
  data: ExamData,
  date: string,
  updatedData: Map<string, Map<string, StudyMaterialConfidenceUpdates>>
) {
  const supabase = createClient();
  let updateSupabase = async (studyMaterial: StudyMaterial) => {
    let res = getStudyMaterialInfo(studyMaterial);
    if (res) {
      const { data: topics, error } = await supabase
        .from(res.studyMaterialType)
        .update({
          confidence: studyMaterial.confidence,
          last_studied: studyMaterial.last_studied,
          priority: studyMaterial.priority,
        });
    }
  };

  let insertIntoEntryTables = async (
    studyMaterial: StudyMaterial,
    confidenceChange: number
  ) => {
    let res = getStudyMaterialInfo(studyMaterial);
    switch (res.studyMaterialType) {
      case "exams":
        let res2 = await supabase
          .from("studied_exam_entry")
          .insert({
            confidence_increase: confidenceChange,
            exam_id: studyMaterial.id,
          })
          .select("id");
        return res2.data![0].id;

      case "topics":
        let res3 = await supabase
          .from("studied_topic_entry")
          .insert({
            confidence_increase: confidenceChange,
            topic_id: studyMaterial.id,
          })
          .select("id");
        return res3.data![0].id;
      case "subtopics":
        const res4 = await supabase
          .from("studied_subtopic_entry")
          .insert({
            confidence_increase: confidenceChange,
            subtopic_id: studyMaterial.id,
          })
          .select("id");

        return res4.data![0].id;
      default:
        return "";
    }
  };

  let updateInEntryTables = async (
    childEntryId: string,
    parentEntryId: string,
    studyMaterial: StudyMaterial
  ) => {
    let res = getStudyMaterialInfo(studyMaterial);
    switch (res.studyMaterialType) {
      case "topics":
        await supabase
          .from("studied_subtopic_entry")
          .update({
            studied_topic_entry_id: parentEntryId,
          })
          .eq("id", childEntryId);

      case "exams":
        await supabase
          .from("studied_topic_entry")
          .update({
            studied_exam_entry_id: parentEntryId,
          })
          .eq("id", childEntryId);

      default:
        return "";
    }
  };

  for (let i = 0; i < data.length; i++) {
    let examUpdates = updatedData.get(data[i].id);
    if (examUpdates) {
      const exam_uuid = uuidv4();
      updateExamData(data[i], data[i].created_at, date, examUpdates, {
        updateMainTables: updateSupabase,
        updateEntryTables: {
          updateFunction: updateInEntryTables,
          insertFunction: insertIntoEntryTables,
        },
      });
    }
  }
}
