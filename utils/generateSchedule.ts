/* first input pretest scores for rating 
update database to reflect confidence level 
    to generate schedule: factors to include
        days untill exam
        current confidence on topic
        days between last studied 
    possible algorithm approach (n log n):
        assign "capacities" to each exam based on how close each exam is + confidence for each subject 
            e.g. I have three exams: cs, math, and english. cs and math are the same distance away. cs has low confidence, therefore
            increase frequency of cs. english is far away and high confidence. therefore split (values not final) would be 
            60 40 10 = more frequency for cs + some overlap with math.

        assign each subtopic/topic a value based on current confidence, days untill exam, days between last studied 
            higher number if current confidence is low, days untill exam is close, and days between last studied is low 
            days between last studied: spaced repitition

            how to incoporate interleaving? 
                put multiple subtopics into one day (build connections in a certain topic)
        use heap 
            take top, update rest of items (o(n)), heapify (log n)
        

 */

import { AllData } from "@/app/dashboard/[user_id]/page";
import { Heap } from "heap-js";
import { Exams } from "./classes/Exams";
import { Subtopics } from "./classes/Subtopics";
import { Topics } from "./classes/Topics";

export function calculateSchedule(data: AllData) {
  let exams: Exams[] = [];
  for (let i = 0; i < data.length; i++) {
    let topics: Topics[] = [];
    for (let j = 0; j < data[i].topics.length; j++) {
      let subtopics: Subtopics[] = [];
      for (let k = 0; k < data[i].topics[j].subtopics.length; k++) {
        let subtopic = data[i].topics[j].subtopics[k];
        let subtopicObject: Subtopics;
        if (subtopic.last_studied) {
          let daysPassedWithoutStudying = daysBetween(subtopic.last_studied);
          subtopicObject = new Subtopics(
            subtopic.subtopic_name,
            daysPassedWithoutStudying,
            subtopic.confidence
          );
        } else {
          subtopicObject = new Subtopics(
            subtopic.subtopic_name,
            subtopic.confidence
          );
        }

        subtopics.push(subtopicObject);
      }
      let topic = data[i].topics[j];
      let topicObject: Topics = new Topics(topic.topic_name);
      if (topic.last_studied) {
        topicObject.setDaysPassedWithoutStudying(
          daysBetween(topic.last_studied)
        );
      }

      if (subtopics.length == 0 && topic.confidence) {
        topicObject = topicObject.setTopicWithNoSubTopics(topic.confidence);
      } else {
        topicObject = topicObject.setTopicWithSubTopics(subtopics);
      }
      topics.push(topicObject);
    }

    let exam = data[i];
    let examObject = new Exams(exam.exam_name, topics, daysBetween(exam.exam_date));
    exams.push(examObject);
  }
  let coefficient = 720 / exams.reduce((a, b) => a + b.confidence ** (-0.4) * 48, 0) 
  exams.map((exam) => exam.calculateCapacity(coefficient))
  console.log(exams)


}

function daysBetween(date1: string): number {
  // Parse the date string into a Date object
  const d1 = new Date(date1);

  // Get the current date
  const d2 = new Date();

  // Calculate the difference in time (milliseconds)
  const diffInTime = Math.abs(d2.getTime() - d1.getTime());

  // Convert the time difference from milliseconds to days
  const diffInDays = Math.ceil(diffInTime / (1000 * 60 * 60 * 24));

  return diffInDays;
}



