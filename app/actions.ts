"use server"
import { createClient } from "@/utils/supabase/server";
import { ExamData } from "@/lib/types";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";


export async function addExam(data: ExamData, user_id: string) {

    const supabase = createClient();
    let date: Date= new Date()
    let dateStr: string = date.toISOString();
    const {data: exams, error} = await supabase.from("exams").insert([{exam_date: dateStr, 
                    exam_name: data.exam_name, user_id: user_id, subject_id: data.subject_id}]).select('id');   
    if(error) {
        console.log(error)
    }       
    for(let i = 0; i < data.topics.length; i++) {
        if(exams) {
        const {data: topics, error} = await supabase.from("topics").insert([{topic_name: data.topics[i].topic_name, exam_id: exams[0].id}]).select('id');
        for(let j = 0; j < data.topics[i].sub_topics.length; j++) {
            if(topics) {
            const {error} = await supabase.from("subtopics").insert([{subtopic_name: data.topics[i].sub_topics[j].subtopic_name, topic_id: topics[0].id
            }]);
        }
            if(error) {
                console.log(error)
            }
        }    
    }
        if(error) {
            console.log(error)

        }
        
    }
    revalidatePath("/dashboard/[user_id]", 'page');
    redirect(`/dashboard/${user_id}`);



}



