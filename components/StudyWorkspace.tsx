"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  CalendarDays,
  Plus,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  RotateCcw,
  Check,
  Clock3,
  Sparkles,
  X,
  BookOpen,
  TrendingUp,
} from "lucide-react";
import type { ExamData } from "@/lib/algorithm-types";
import {
  dateLabel,
  shiftDate,
  interleave,
  materialItems,
  StudyItem,
  StudySession,
} from "@/lib/study";
import { localDate } from "@/lib/study";
import { daysBetween } from "@/app/schedule/algorithm/generateSchedule";
import { completeStudySession } from "@/app/study-actions";
export default function StudyWorkspace({
  exams,
  sessions,
  schedule,
  today,
  view,
  error,
  demo = false,
}: {
  exams: ExamData[];
  sessions: StudySession[];
  schedule: Record<string, StudyItem[]>;
  today: string;
  view: string;
  error?: string | null;
  demo?: boolean;
}) {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(today);
  const [mix, setMix] = useState(false);
  const [selected, setSelected] = useState<StudyItem | null>(null);
  const [feedback, setFeedback] = useState<StudyItem | null>(null);
  const [score, setScore] = useState(3);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [demoSessions, setDemoSessions] = useState<StudySession[]>([]);
  const [minutes, setMinutes] = useState(25);
  const [remaining, setRemaining] = useState(1500);
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState<Record<string, number>>({});
  const [timerMessage, setTimerMessage] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);
  const requestId = useRef("");
  const expiry = useRef(0);
  const lastTick = useRef(0);
  const allSessions = demo ? [...demoSessions, ...sessions] : sessions;
  const catalog = materialItems(exams);
  const catalogMap = new Map(catalog.map((item) => [item.id, item]));
  const completed = allSessions.filter(
    (session) => session.studied_on === selectedDate,
  );
  const completedIds = new Set(completed.map((session) => session.material_id));
  const raw = (schedule[selectedDate] ?? []).map((item) => {
    const session = completed.find(
      (session) => session.material_id === item.id,
    );
    return session
      ? {
          ...item,
          confidence: session.confidence_after,
          lastStudied: session.studied_on,
        }
      : item;
  });
  const completedItems = completed
    .map((session) => {
      const item = catalogMap.get(session.material_id);
      return item
        ? {
            ...item,
            confidence: session.confidence_after,
            lastStudied: session.studied_on,
          }
        : undefined;
    })
    .filter((item): item is StudyItem => !!item);
  const unique = Array.from(
    new Map(
      [...raw, ...completedItems].map((item) => [item.id, item]),
    ).values(),
  );
  const items = mix ? interleave(unique) : unique;
  const activeExams = exams.filter(
    (exam) => exam.exam_date.slice(0, 10) > today,
  );
  const firstDay = shiftDate(
    selectedDate,
    -((new Date(selectedDate + "T12:00:00").getDay() + 6) % 7),
  );
  const week = Array.from({ length: 7 }, (_, index) =>
    shiftDate(firstDay, index),
  );
  const studiedCount = items.filter((item) => completedIds.has(item.id)).length;
  useEffect(() => {
    try {
      setMix(localStorage.getItem("exam-prep-mix") === "true");
    } catch {}
  }, []);
  useEffect(() => {
    if (!running || !selected) return;
    expiry.current = Date.now() + remaining * 1000;
    lastTick.current = Date.now();
    const id = setInterval(() => {
      const now = Date.now();
      const delta = Math.max(
        0,
        Math.round((Math.min(now, expiry.current) - lastTick.current) / 1000),
      );
      lastTick.current = now;
      setElapsed((previous) => ({
        ...previous,
        [selected.id]: (previous[selected.id] ?? 0) + delta,
      }));
      const seconds = Math.max(0, Math.ceil((expiry.current - now) / 1000));
      setRemaining(seconds);
      if (seconds === 0) {
        setRunning(false);
        setTimerMessage(
          "Nice focus! Record your confidence when you’re ready.",
        );
      }
    }, 1000);
    return () => clearInterval(id);
  }, [running, selected?.id]); // Countdown uses an absolute deadline so background tabs stay accurate.
  useEffect(() => {
    if (feedback) {
      dialog.current?.showModal();
    } else dialog.current?.close();
  }, [feedback]);
  function startItem(item: StudyItem) {
    if (selected?.id !== item.id) {
      setRunning(false);
      setRemaining(minutes * 60);
      setTimerMessage("");
    }
    setSelected(item);
  }
  function openFeedback(item: StudyItem) {
    if (localDate() !== today) {
      router.refresh();
      return;
    }
    setFeedback(item);
    setScore(item.confidence);
    setSaveError("");
    requestId.current = crypto.randomUUID();
  }
  async function save() {
    if (!feedback) return;
    setSaving(true);
    setSaveError("");
    const input = {
      id: requestId.current,
      exam_id: feedback.examId,
      material_id: feedback.id,
      material_type: feedback.type,
      confidence: score,
      studied_on: today,
      elapsed_seconds: Math.min(86400, elapsed[feedback.id] ?? 0),
    };
    try {
      if (demo) {
        setDemoSessions((previous) => [
          {
            ...input,
            confidence_before: feedback.confidence,
            confidence_after: score,
            created_at: new Date().toISOString(),
          },
          ...previous,
        ]);
      } else {
        const result = await completeStudySession(input);
        if (result.error) {
          setSaveError(result.error);
          return;
        }
        router.refresh();
      }
      if (selected?.id === feedback.id) setRunning(false);
      setFeedback(null);
    } catch {
      setSaveError("Your session wasn’t saved. Please try again.");
    } finally {
      setSaving(false);
    }
  }
  function toggleMix() {
    setMix(!mix);
    localStorage.setItem("exam-prep-mix", String(!mix));
  }
  const title =
    view === "exams"
      ? "Big goals. Small steps."
      : view === "schedule"
        ? "A little rhythm goes a long way."
        : view === "progress"
          ? "Look how far you’ve come."
          : "A little practice.";
  return (
    <div className="study-page">
      <header className="topbar">
        <span>
          <span className="status-dot" /> YOUR STUDY SPACE
        </span>
        <div>
          <span className="top-date">
            {dateLabel(today, {
              weekday: "long",
              month: "short",
              day: "numeric",
            })}
          </span>
          <Link className="avatar" href="/login" aria-label="Account">
            <BookOpen size={19} />
          </Link>
        </div>
      </header>
      {demo && (
        <div className="notice demo-notice">
          <Sparkles size={16} />
          <span>
            Sample workspace · Try the timer, mixed order, and completion flow.
            Changes are temporary.
          </span>
          <Link href="/login">Make it yours ↗</Link>
        </div>
      )}
      {error && (
        <div className="notice error-notice" role="alert">
          {error}
          <button onClick={() => router.refresh()}>Retry</button>
        </div>
      )}
      <section className="page-heading">
        <div>
          <span className="eyebrow">
            {view === "today" ? "YOU’VE GOT THIS" : "ONE STEP AT A TIME"}
          </span>
          <h1>
            {title}
            {view === "today" && (
              <>
                <br />
                <em>A lot of progress.</em>
              </>
            )}
          </h1>
          <p>
            {view === "today"
              ? "A plan that meets you where you are. Let’s make a little progress today."
              : view === "exams"
                ? "Everything you’re working toward, in one place."
                : view === "schedule"
                  ? "Your next steps, spaced out before exam day."
                  : "Every session counts. Confidence takes practice."}
          </p>
        </div>
        <div className="heading-art" aria-hidden="true">
          <span>✦</span>
          <i />
          <b />
        </div>
      </section>
      {view === "exams" ? (
        <>
          <div className="section-title">
            <h2>
              Your exams <span className="count-pill">{exams.length}</span>
            </h2>
            <Link
              className="primary-button small"
              href={demo ? "/login" : "/create-exam"}
            >
              <Plus size={16} /> Add exam
            </Link>
          </div>
          <div className="exam-grid">
            {exams.map((exam) => (
              <article key={exam.id} className="panel exam-detail">
                <span className="subject-tag">
                  {exam.subjects?.subject_name ?? "General"}
                </span>
                <h2>{exam.name}</h2>
                <p>
                  <CalendarDays size={16} />{" "}
                  {dateLabel(exam.exam_date.slice(0, 10), {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
                <div className="exam-stats">
                  <span>
                    <strong>
                      {Math.max(0, daysBetween(today, exam.exam_date))}
                    </strong>{" "}
                    days left
                  </span>
                  <span>
                    <strong>
                      {(exam.confidence ?? 3).toFixed(1)}
                      <small>/10</small>
                    </strong>{" "}
                    confidence
                  </span>
                </div>
                <div className="confidence-track">
                  <i style={{ width: `${(exam.confidence ?? 3) * 10}%` }} />
                </div>
                <p>
                  Goal: {exam.confidence_goal ?? 9}/10 · {exam.topics.length}{" "}
                  topics
                </p>
                <div className="topic-chips">
                  {exam.topics.map((topic) => (
                    <span key={topic.id}>{topic.name}</span>
                  ))}
                </div>
                <Link
                  className="secondary-button"
                  href={demo ? "/login" : `/exams/${exam.id}/edit`}
                >
                  Edit exam <ArrowUpRight size={16} />
                </Link>
              </article>
            ))}
          </div>
          {!exams.length && <Empty demo={demo} />}
        </>
      ) : view === "progress" ? (
        <>
          <div className="progress-stats">
            <article className="panel">
              <span className="mini-label">SESSIONS COMPLETED</span>
              <strong>{allSessions.length}</strong>
              <p>Small wins, adding up.</p>
            </article>
            <article className="panel">
              <span className="mini-label">FOCUSED MINUTES</span>
              <strong>
                {Math.floor(
                  allSessions.reduce(
                    (sum, session) => sum + session.elapsed_seconds,
                    0,
                  ) / 60,
                )}
              </strong>
              <p>Time you made for yourself.</p>
            </article>
            <article className="panel">
              <span className="mini-label">TOPICS PRACTICED</span>
              <strong>
                {
                  new Set(allSessions.map((session) => session.material_id))
                    .size
                }
              </strong>
              <p>A little more familiar each time.</p>
            </article>
          </div>
          <section className="panel history-panel">
            <div className="section-title">
              <h2>Session history</h2>
              <TrendingUp size={20} />
            </div>
            {allSessions.length ? (
              allSessions.map((session) => (
                <div className="history-row" key={session.id}>
                  <span className="done-icon">
                    <Check size={17} />
                  </span>
                  <div>
                    <strong>
                      {catalogMap.get(session.material_id)?.name ??
                        "Studied material"}
                    </strong>
                    <p>
                      {dateLabel(session.studied_on)} ·{" "}
                      {Math.floor(session.elapsed_seconds / 60)} focused minutes
                    </p>
                  </div>
                  <span className="confidence-pill">
                    {session.confidence_before.toFixed(1)} →{" "}
                    {session.confidence_after.toFixed(1)}
                    <small> confidence / 10</small>
                  </span>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <Sparkles />
                <h3>Your story starts with one session.</h3>
                <p>Mark a topic studied to see your progress here.</p>
              </div>
            )}
          </section>
        </>
      ) : (
        <>
          <div className="plan-layout">
            <div className="plan-main">
              <div className="week-nav">
                <button
                  className="icon-button"
                  aria-label="Previous week"
                  onClick={() => setSelectedDate(shiftDate(selectedDate, -7))}
                >
                  <ChevronLeft size={18} />
                </button>
                {week.map((date) => (
                  <button
                    key={date}
                    className={`day-button ${date === selectedDate ? "selected" : ""}`}
                    onClick={() => setSelectedDate(date)}
                  >
                    <span>{dateLabel(date, { weekday: "short" })}</span>
                    <strong>{new Date(date + "T12:00:00").getDate()}</strong>
                    <i className={date === today ? "today-dot" : ""} />
                  </button>
                ))}
                <button
                  className="icon-button"
                  aria-label="Next week"
                  onClick={() => setSelectedDate(shiftDate(selectedDate, 7))}
                >
                  <ChevronRight size={18} />
                </button>
              </div>
              <div className="section-title daily-title">
                <div>
                  <h2>
                    {selectedDate === today
                      ? "Your study plan for today"
                      : dateLabel(selectedDate, {
                          weekday: "long",
                          month: "short",
                          day: "numeric",
                        })}
                  </h2>
                  <p>
                    {selectedDate > today
                      ? "Projected plan · assumes earlier recommendations are completed"
                      : selectedDate < today
                        ? "Your recorded sessions for this day"
                        : "One topic at a time. You’re building something good."}
                  </p>
                </div>
                {selectedDate !== today && (
                  <button
                    className="text-button"
                    onClick={() => setSelectedDate(today)}
                  >
                    Today
                  </button>
                )}
              </div>
              {view === "schedule" && (
                <div className="notice">
                  <CalendarDays size={17} /> Future confidence is an estimate,
                  not a saved score.
                </div>
              )}
              <section className="panel checklist">
                <div className="checklist-header">
                  <div>
                    <span className="mini-label">
                      {selectedDate === today
                        ? "TODAY’S CHECKLIST"
                        : "STUDY CHECKLIST"}
                    </span>
                    <p>
                      <strong>{studiedCount}</strong> of {items.length} topics
                      studied <span>✦</span>
                    </p>
                  </div>
                  <label
                    className="mix-control"
                    title="Alternate selected topics within each subject"
                  >
                    <input type="checkbox" checked={mix} onChange={toggleMix} />
                    <span className="switch" />
                    Mix topics
                  </label>
                </div>
                <div className="completion-track">
                  <i
                    style={{
                      width: `${items.length ? (studiedCount / items.length) * 100 : 0}%`,
                    }}
                  />
                </div>
                {items.map((item, index) => {
                  const done = completedIds.has(item.id);
                  return (
                    <article
                      className={`study-card ${done ? "is-done" : ""}`}
                      key={item.id}
                    >
                      <span className={`topic-symbol tone-${index % 3}`}>
                        {done ? (
                          <Check size={21} />
                        ) : index % 3 === 0 ? (
                          <BookOpen size={20} />
                        ) : index % 3 === 1 ? (
                          <Sparkles size={20} />
                        ) : (
                          <TrendingUp size={20} />
                        )}
                      </span>
                      <div className="study-card-content">
                        <span className="topic-path">
                          {item.subject} <span>/</span> {item.path}
                        </span>
                        <h3>{item.name}</h3>
                        <div className="card-meta">
                          <span className="confidence-pill">
                            {Number(item.confidence.toFixed(1))}/10{" "}
                            <small>confidence</small>
                          </span>
                          <span>
                            <Clock3 size={13} />
                            {item.lastStudied
                              ? `${Math.max(0, daysBetween(item.lastStudied, selectedDate))}d since practice`
                              : "Not studied yet"}
                          </span>
                        </div>
                        <p className="recommendation-reason">
                          {item.confidence < 5
                            ? "Build confidence with a little more practice."
                            : "Keep it fresh with another review."}
                        </p>
                      </div>
                      <div className="card-actions">
                        {done ? (
                          <span className="studied-label">
                            <Check size={15} /> Studied
                          </span>
                        ) : selectedDate === today ? (
                          <>
                            <button
                              className="secondary-button small"
                              onClick={() => startItem(item)}
                            >
                              <Play size={13} /> Focus
                            </button>
                            <button
                              className="text-button"
                              onClick={() => openFeedback(item)}
                            >
                              Mark studied
                            </button>
                          </>
                        ) : (
                          <span className="forecast-label">
                            {selectedDate > today ? "Planned" : ""}
                          </span>
                        )}
                      </div>
                    </article>
                  );
                })}
                {!items.length && (
                  <div className="empty-state">
                    <Sparkles size={30} />
                    <h3>
                      {!exams.length
                        ? "Your next chapter starts here."
                        : selectedDate < today
                          ? "No sessions recorded."
                          : "A little breathing room."}
                    </h3>
                    <p>
                      {!exams.length
                        ? "Add an exam and tell us how confident you feel."
                        : "No recommended work for this day. Your plan will adapt when you record progress."}
                    </p>
                    {!exams.length && (
                      <Link
                        className="primary-button"
                        href={demo ? "/login" : "/create-exam"}
                      >
                        <Plus size={16} /> Add your first exam
                      </Link>
                    )}
                  </div>
                )}
                {items.length > 0 && studiedCount === items.length && (
                  <div className="completion-celebration">
                    ✦ Today’s little steps are done. Nice work!
                  </div>
                )}
              </section>
              <div className="plan-footnote">
                <Sparkles size={15} />
                <p>
                  Built around your confidence, time since practice, and exam
                  date.
                </p>
              </div>
            </div>
            <aside className="right-rail">
              <section className="panel upcoming">
                <div className="section-title">
                  <h3>On the horizon</h3>
                  <CalendarDays size={18} />
                </div>
                {activeExams.slice(0, 2).map((exam, index) => (
                  <div
                    key={exam.id}
                    className={`exam-preview tone-${index % 3}`}
                  >
                    <span className="mini-label">
                      {exam.subjects?.subject_name ?? "EXAM"}
                    </span>
                    <h3>{exam.name}</h3>
                    <p>
                      {dateLabel(exam.exam_date.slice(0, 10), {
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                    <div className="deadline">
                      <strong>{daysBetween(today, exam.exam_date)}</strong>
                      <span>
                        days to go
                        <br />
                        <small>You’ve got time to grow.</small>
                      </span>
                    </div>
                    <div className="topic-chips">
                      {exam.topics.slice(0, 3).map((topic) => (
                        <span key={topic.id}>{topic.name}</span>
                      ))}
                    </div>
                  </div>
                ))}
                {!activeExams.length && (
                  <p className="muted">No upcoming exams yet.</p>
                )}
                <Link
                  className="rail-link"
                  href={`${demo ? "/demo" : "/dashboard"}?view=exams`}
                >
                  All exams <ArrowUpRight size={15} />
                </Link>
              </section>
              <section className="panel timer-panel">
                <div className="section-title">
                  <h3>A moment to focus</h3>
                  <Clock3 size={18} />
                </div>
                <p>
                  {selected
                    ? selected.name
                    : "Choose a topic’s Focus button to begin."}
                </p>
                <div className={`timer-face ${running ? "running" : ""}`}>
                  <span>
                    {String(Math.floor(remaining / 60)).padStart(2, "0")}:
                    {String(remaining % 60).padStart(2, "0")}
                  </span>
                  <small>
                    {running ? "YOU’RE DOING GREAT" : "ONE THING AT A TIME"}
                  </small>
                </div>
                <label className="duration-label">
                  Focus length
                  <select
                    value={minutes}
                    disabled={running}
                    onChange={(event) => {
                      const value = Number(event.target.value);
                      setMinutes(value);
                      setRemaining(value * 60);
                      setTimerMessage("");
                    }}
                  >
                    {[5, 10, 15, 25, 45, 60].map((value) => (
                      <option key={value} value={value}>
                        {value} minutes
                      </option>
                    ))}
                  </select>
                </label>
                <div className="timer-actions">
                  <button
                    className="primary-button"
                    disabled={!selected || remaining === 0}
                    onClick={() => {
                      setRunning(!running);
                      setTimerMessage("");
                    }}
                  >
                    {running ? <Pause size={16} /> : <Play size={16} />}{" "}
                    {running ? "Pause" : "Start focus"}
                  </button>
                  <button
                    className="icon-button"
                    aria-label="Reset timer"
                    onClick={() => {
                      setRunning(false);
                      setRemaining(minutes * 60);
                      setTimerMessage("");
                    }}
                  >
                    <RotateCcw size={17} />
                  </button>
                </div>
                <p className="timer-message" role="status">
                  {timerMessage ||
                    "A timer helps you focus. You decide when you’re done."}
                </p>
                {selected && !completedIds.has(selected.id) && (
                  <button
                    className="text-button"
                    onClick={() => openFeedback(selected)}
                  >
                    Finish & record confidence ↗
                  </button>
                )}
              </section>
              <div className="gentle-note">
                <span>✦</span>
                <p>
                  Progress isn’t always a straight line.
                  <br />
                  <strong>Showing up counts.</strong>
                </p>
              </div>
            </aside>
          </div>
        </>
      )}
      <dialog
        ref={dialog}
        className="feedback-dialog"
        onCancel={(event) => {
          event.preventDefault();
          if (!saving) setFeedback(null);
        }}
        onClose={() => {
          if (!saving) setFeedback(null);
        }}
      >
        <div className="dialog-heading">
          <span className="topic-symbol tone-0">
            <Sparkles />
          </span>
          <button
            disabled={saving}
            className="icon-button"
            aria-label="Close"
            onClick={() => setFeedback(null)}
          >
            <X size={20} />
          </button>
        </div>
        <span className="eyebrow">ANOTHER LITTLE STEP</span>
        <h2>How does it feel now?</h2>
        <p>{feedback?.name}</p>
        <label className="score-label" htmlFor="session-confidence">
          Your confidence{" "}
          <strong>
            {score}
            <small>/10</small>
          </strong>
        </label>
        <input
          id="session-confidence"
          className="confidence-slider"
          type="range"
          min="0"
          max="10"
          step="1"
          value={score}
          onChange={(event) => setScore(Number(event.target.value))}
        />
        <div className="range-labels">
          <span>Need more practice</span>
          <span>Ready to explain it</span>
        </div>
        <p className="feedback-help">
          The same score or a lower one is okay. An honest check-in helps your
          next plan.
        </p>
        {saveError && (
          <p className="form-error" role="alert">
            {saveError}
          </p>
        )}
        <button
          disabled={saving}
          className="primary-button full-width"
          onClick={save}
        >
          {saving
            ? "Saving…"
            : demo
              ? "Complete sample session"
              : "Save study session"}{" "}
          <Check size={17} />
        </button>
      </dialog>
    </div>
  );
}
function Empty({ demo }: { demo: boolean }) {
  return (
    <div className="panel empty-state">
      <BookOpen />
      <h3>A fresh start.</h3>
      <p>Add your first exam to build a personal study plan.</p>
      <Link href={demo ? "/login" : "/create-exam"} className="primary-button">
        Add exam
      </Link>
    </div>
  );
}
