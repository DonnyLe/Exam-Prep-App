import { AllData } from "@/app/dashboard/[user_id]/page";
import { Topics } from "./Topics";

export class Exams {
    topics: Topics[];
    examName: string;
    confidence: number; 
    capacity: number;
    daysUntillExam: number;


    public constructor(examName: string, topics: Topics[], daysUntillExam: number) {
        this.topics = topics; 
        this.daysUntillExam = daysUntillExam; 
        this.examName = examName; 
        this.confidence = this.calculateExamConfidence();
        this.capacity = 0;
        this.topics.map((topic) => topic.calculateCapacity(this.calculateTopicCofficient()))
    }

    public chooseTopics(): AllData {
        let test: AllData = [
            
        ]
        return test;
        

    }

    public calculateCapacity(coefficient: number) {
        this.capacity = (this.confidence ** (-0.4) * 144) * coefficient;
    } 

    public calculateExamConfidence (): number{
        let sum = 0; 
        for(var i = 0; i < this.topics.length; i++) {
            sum += this.topics[i].confidence
        }
        this.confidence = sum/this.topics.length;
        return sum;
    }    

    private calculateTopicCofficient(): number {
        if(this.topics){
        return this.capacity / this.topics.reduce((a, b) => a + b.confidence ** (-0.4) * 48, 0) 
        }
        return 0;
    }
}