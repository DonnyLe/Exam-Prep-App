export class Subtopics {
  subtopicName: string;
  confidence: number;
  daysPassedWithoutStudying: number;
  capacity: number;
  priority: number;

  public constructor(
    subtopicName: string,
    confidence: number,
    daysPassedWithoutStudying: number = -1
  ) {
    this.subtopicName = subtopicName;
    this.confidence = confidence;
    this.daysPassedWithoutStudying = daysPassedWithoutStudying;
    this.capacity = 0;
    this.priority = 0;
  }

  private getSubtopicPriority() {
    if (this.daysPassedWithoutStudying == -1) {
      this.daysPassedWithoutStudying = 7;
    }
    this.priority =
      (this.confidence + 5) ** -1 * 70 + 1.2 ** this.daysPassedWithoutStudying;
  }

  public calculateCapacity(coefficient: number) {
    this.capacity = this.confidence ** -0.6 * 4 * coefficient;
    this.getSubtopicPriority();
  }
}
