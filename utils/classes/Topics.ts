//has capacity = calculated using confidence (because lower confidence = more time taken)
//has priortiy = calculate using confidence (lower confidence = study it more), daysPassedWithoutStudying, days untill exam 
    //sorted in minimum priority heap

import { Subtopics } from "./Subtopics";


export class Topics {
    subtopics?: Subtopics[];
    topicName: string;
    confidence: number; 
    priority: number;
    daysPassedWithoutStudying: number;
    capacity: number;


    public constructor(topicName: string) {
        this.topicName = topicName;
        this.daysPassedWithoutStudying = -1;
        this.confidence = 0;
        this.priority = 0;
        this.capacity = 0;
    }
    public setDaysPassedWithoutStudying(daysPassed: number) {
        this.daysPassedWithoutStudying = daysPassed;
        return this;

    }

    public setTopicWithNoSubTopics(confidence: number): Topics{
        this.confidence = confidence; 
        this.subtopics = undefined;
        this.calculateTopicPriority();
        return this;
    }

    public setTopicWithSubTopics(subtopics: Subtopics[]): Topics {
        this.subtopics = subtopics;
        this.calculateTopicConfidence(); 
        this.calculateTopicPriority();
        this.subtopics.map((subtopic) => subtopic.calculateCapacity(this.calculateSubTopicCofficient()))

        return this;
    }

    private calculateTopicPriority() {
        if(this.daysPassedWithoutStudying == -1) {
            this.daysPassedWithoutStudying = 7;
        }
        this.priority = (this.confidence + 5)**(-1) * 70 + 1.2 ** this.daysPassedWithoutStudying;
    }

    public calculateCapacity(coefficient: number) {
        this.capacity = (this.confidence ** (-0.4) * 48) * coefficient;
    }

    private calculateSubTopicCofficient(): number {
        if(this.subtopics){
        return this.capacity / this.subtopics.reduce((a, b) => a + b.confidence ** (-0.4) * 4, 0) 
        }
        return 0;
    }


    public chooseSubtopics(capacity: number) {
        if(this.capacity > capacity) {

        } else {

        }
        
    }

    private calculateTopicConfidence() {
        let sum = 0; 
        if(this.subtopics) {
        for(var i = 0; i < this.subtopics.length; i++) {
            sum += this.subtopics[i].confidence
        }
        this.confidence = sum/this.subtopics.length;
        
    }
        
    }

    
    
}