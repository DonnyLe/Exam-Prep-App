"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Trash2, ArrowLeft, Sparkles } from "lucide-react";
import type { ExamData, SubjectData } from "@/lib/algorithm-types";
import type { ExamInput } from "@/lib/exam-input";
import { localDate, shiftDate } from "@/lib/study";
import { saveStudyExam } from "@/app/study-actions";
export default function ExamEditor({
  exam,
  subjects,
}: {
  exam?: ExamData;
  subjects: SubjectData;
}) {
  const router = useRouter();
  const [data, setData] = useState<ExamInput>(
    exam
      ? {
          id: exam.id,
          name: exam.name,
          subject_id: exam.subject_id,
          subject_name: exam.subjects?.subject_name ?? "",
          exam_date: exam.exam_date.slice(0, 10),
          confidence_goal: exam.confidence_goal ?? 9,
          topics: exam.topics.map((topic) => ({
            id: topic.id,
            name: topic.name,
            confidence: topic.confidence ?? 3,
            subtopics: topic.subtopics.map((subtopic) => ({
              id: subtopic.id,
              name: subtopic.name,
              confidence: subtopic.confidence ?? 3,
            })),
          })),
        }
      : {
          name: "",
          subject_name: "",
          exam_date: shiftDate(localDate(), 14),
          confidence_goal: 9,
          topics: [{ name: "", confidence: 3, subtopics: [] }],
        },
  );
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  function topicChange(
    index: number,
    change: Partial<ExamInput["topics"][number]>,
  ) {
    setData((previous) => ({
      ...previous,
      topics: previous.topics.map((topic, i) =>
        i === index ? { ...topic, ...change } : topic,
      ),
    }));
  }
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const result = await saveStudyExam(data);
      if (result.error) setError(result.error);
      else {
        router.push("/dashboard?view=exams");
        router.refresh();
      }
    } catch {
      setError("We couldn’t save your exam. Try again.");
    } finally {
      setSaving(false);
    }
  }
  return (
    <div className="editor-page">
      <Link className="back-link" href="/dashboard?view=exams">
        <ArrowLeft size={16} /> Back to exams
      </Link>
      <span className="eyebrow">LET’S MAKE A PLAN</span>
      <h1>{exam ? "A little fine-tuning." : "Something to work toward."}</h1>
      <p>
        Tell us what’s on your exam and how confident you feel. We’ll take it
        one day at a time.
      </p>
      <form onSubmit={submit}>
        <fieldset disabled={saving}>
          <section className="panel editor-section">
            <h2>
              <span className="step-number">01</span> The big picture
            </h2>
            <div className="form-grid">
              <label>
                Exam name
                <input
                  required
                  maxLength={120}
                  value={data.name}
                  placeholder="e.g. Midterm exam"
                  onChange={(event) =>
                    setData({ ...data, name: event.target.value })
                  }
                />
              </label>
              <label>
                Subject
                <select
                  value={data.subject_id ?? "new"}
                  onChange={(event) => {
                    const subject = subjects.find(
                      (subject) => subject.id === event.target.value,
                    );
                    setData({
                      ...data,
                      subject_id: subject?.id,
                      subject_name: subject?.subject_name ?? "",
                    });
                  }}
                >
                  <option value="new">Create a new subject</option>
                  {subjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.subject_name}
                    </option>
                  ))}
                </select>
              </label>
              {!data.subject_id && (
                <label>
                  New subject name
                  <input
                    required
                    maxLength={120}
                    placeholder="e.g. Discrete Math"
                    value={data.subject_name}
                    onChange={(event) =>
                      setData({ ...data, subject_name: event.target.value })
                    }
                  />
                </label>
              )}
              <label>
                Exam date
                <input
                  required
                  type="date"
                  min={shiftDate(localDate(), 1)}
                  value={data.exam_date}
                  onChange={(event) =>
                    setData({ ...data, exam_date: event.target.value })
                  }
                />
              </label>
              <label>
                Confidence goal <span className="field-hint">0–10</span>
                <input
                  required
                  type="number"
                  min="0"
                  max="10"
                  step="1"
                  value={data.confidence_goal}
                  onChange={(event) =>
                    setData({
                      ...data,
                      confidence_goal: Number(event.target.value),
                    })
                  }
                />
              </label>
            </div>
          </section>
          <section className="panel editor-section">
            <h2>
              <span className="step-number">02</span> Break it into little steps
            </h2>
            <p className="muted">
              Add topics, and subtopics if useful. Rate 0 for unfamiliar, 5 for
              some understanding, and 10 for ready to explain.
            </p>
            {data.topics.map((topic, index) => (
              <div className="topic-editor" key={topic.id ?? index}>
                <div className="topic-editor-heading">
                  <span className="mini-label">TOPIC {index + 1}</span>
                  {!topic.id && data.topics.length > 1 && (
                    <button
                      type="button"
                      className="icon-button"
                      aria-label={`Remove topic ${index + 1}`}
                      onClick={() =>
                        setData({
                          ...data,
                          topics: data.topics.filter((_, i) => i !== index),
                        })
                      }
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
                <div className="material-inputs">
                  <label>
                    Topic name
                    <input
                      required
                      maxLength={120}
                      value={topic.name}
                      placeholder="e.g. Graph theory"
                      onChange={(event) =>
                        topicChange(index, { name: event.target.value })
                      }
                    />
                  </label>
                  {!topic.subtopics.length && (
                    <label>
                      Confidence
                      <input
                        required
                        type="number"
                        min="0"
                        max="10"
                        step="1"
                        value={topic.confidence}
                        onChange={(event) =>
                          topicChange(index, {
                            confidence: Number(event.target.value),
                          })
                        }
                      />
                    </label>
                  )}
                </div>
                {topic.subtopics.map((subtopic, subIndex) => (
                  <div
                    className="subtopic-editor"
                    key={subtopic.id ?? subIndex}
                  >
                    <label>
                      Subtopic
                      <input
                        required
                        maxLength={120}
                        value={subtopic.name}
                        placeholder="e.g. Graph traversal"
                        onChange={(event) =>
                          topicChange(index, {
                            subtopics: topic.subtopics.map((s, i) =>
                              i === subIndex
                                ? { ...s, name: event.target.value }
                                : s,
                            ),
                          })
                        }
                      />
                    </label>
                    <label>
                      Confidence
                      <input
                        required
                        type="number"
                        min="0"
                        max="10"
                        step="1"
                        value={subtopic.confidence}
                        onChange={(event) =>
                          topicChange(index, {
                            subtopics: topic.subtopics.map((s, i) =>
                              i === subIndex
                                ? {
                                    ...s,
                                    confidence: Number(event.target.value),
                                  }
                                : s,
                            ),
                          })
                        }
                      />
                    </label>
                    {!subtopic.id && (
                      <button
                        type="button"
                        className="icon-button"
                        aria-label={`Remove subtopic ${subIndex + 1}`}
                        onClick={() =>
                          topicChange(index, {
                            subtopics: topic.subtopics.filter(
                              (_, i) => i !== subIndex,
                            ),
                          })
                        }
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  disabled={topic.subtopics.length >= 50}
                  type="button"
                  className="text-button"
                  onClick={() =>
                    topicChange(index, {
                      subtopics: [
                        ...topic.subtopics,
                        { name: "", confidence: 3 },
                      ],
                    })
                  }
                >
                  <Plus size={14} /> Add subtopic
                </button>
              </div>
            ))}
            <button
              disabled={data.topics.length >= 50}
              type="button"
              className="secondary-button"
              onClick={() =>
                setData({
                  ...data,
                  topics: [
                    ...data.topics,
                    { name: "", confidence: 3, subtopics: [] },
                  ],
                })
              }
            >
              <Plus size={16} /> Add another topic
            </button>
          </section>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <div className="editor-footer">
            <p>
              <Sparkles size={16} /> You can adjust your plan as you go.
            </p>
            <button type="submit" className="primary-button">
              {saving
                ? "Saving…"
                : exam
                  ? "Save changes"
                  : "Create my study plan"}{" "}
              ↗
            </button>
          </div>
        </fieldset>
      </form>
    </div>
  );
}
