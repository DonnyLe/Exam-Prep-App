"use server";
import { createClient } from "@/utils/supabase/server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  getStudyMaterialInfo,
  printExams,
  updateExamData,
} from "./schedule/algorithm/generateSchedule";
import { StudyMaterial } from "@/lib/algorithm-types";
import { ConfidenceUpdates } from "@/lib/algorithm-types";

import { v4 as uuidv4 } from "uuid";
import { ExamFormData } from "@/lib/form-types";
import { ExamData } from "@/lib/algorithm-types";

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
              last_studied: new Date().toISOString().split("T")[0],
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
  data: ExamData[],
  date: string,
  dataChanges: Map<string, ConfidenceUpdates>,
  user_id: string
) {
  const supabase = createClient();
  let updateSupabase = async (studyMaterial: StudyMaterial) => {
    let res = getStudyMaterialInfo(studyMaterial);
    if (res) {
      console.log(res.subStudyMaterial);
      const { data: topics, error } = await supabase
        .from(res.studyMaterialType)
        .update({
          confidence: studyMaterial.confidence,
          last_studied: studyMaterial.last_studied,
          priority: studyMaterial.priority,
        })
        .eq("id", studyMaterial.id);
    }
    return;
  };

  let insertIntoEntryTables = async (
    studyMaterial: StudyMaterial,
    confidenceChange: number,
    date: string
  ) => {
    let res = getStudyMaterialInfo(studyMaterial);
    switch (res.studyMaterialType) {
      case "exams":
        let res2 = await supabase
          .from("studied_exam_entry")
          .insert({
            confidence_increase: confidenceChange,
            exam_id: studyMaterial.id,
            user_id: user_id,
            date_studied: date,
          })
          .select("id");
        return res2.data![0].id;

      case "topics":
        let res3 = await supabase
          .from("studied_topic_entry")
          .insert({
            confidence_increase: confidenceChange,
            topic_id: studyMaterial.id,
            date_studied: date,
          })
          .select("id");
        return res3.data![0].id;
      case "subtopics":
        const res4 = await supabase
          .from("studied_subtopic_entry")
          .insert({
            confidence_increase: confidenceChange,
            subtopic_id: studyMaterial.id,
            date_studied: date,
          })
          .select();
        return res4.data![0].id;
      default:
        return "";
    }
  };

  for (let i = 0; i < data.length; i++) {
    let examUpdates = dataChanges.get(data[i].id);
    if (examUpdates) {
      updateExamData(data[i], date, examUpdates, {
        updateMainTables: updateSupabase,
        insertEntryTables: insertIntoEntryTables,
      });
    }
  }
  redirect(`/dashboard/${user_id}`);
}
