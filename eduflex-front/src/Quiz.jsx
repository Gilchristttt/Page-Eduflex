// src/Quiz.jsx
import React, { useState } from "react";

export default function Quiz({ questions, onFinish, onClose }) {
  const [answers, setAnswers] = useState(Array(questions.length).fill(null));
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(null);

  const handleAnswer = (qIndex, choiceIndex) => {
    if (submitted) return;
    const newAnswers = [...answers];
    newAnswers[qIndex] = choiceIndex;
    setAnswers(newAnswers);
  };

  const handleSubmit = () => {
    let s = 0;
    questions.forEach((q, i) => {
      if (answers[i] === q.correct_answer_index) s++;
    });
    setScore(s);
    setSubmitted(true);
    if (onFinish) onFinish(s);
  };

  return (
    <div style={{ marginTop: 20, padding: 16, border: "1px solid #aaa", borderRadius: 8, backgroundColor: "#f9f9f9" }}>
      <h3>Quiz</h3>
      {questions.map((q, i) => (
        <div key={i} style={{ marginBottom: 12 }}>
          <div><strong>{i + 1}. {q.question}</strong></div>
          <div>
            {q.choices.map((choice, ci) => (
              <label
                key={ci}
                style={{
                  display: "block",
                  cursor: submitted ? "default" : "pointer",
                  color: submitted && ci === q.correct_answer_index ? "green" : undefined,
                  fontWeight: submitted && answers[i] === ci && ci !== q.correct_answer_index ? "bold" : "normal",
                }}
              >
                <input
                  type="radio"
                  name={`q${i}`}
                  disabled={submitted}
                  checked={answers[i] === ci}
                  onChange={() => handleAnswer(i, ci)}
                  style={{ marginRight: 8 }}
                />
                {choice}
              </label>
            ))}
          </div>
        </div>
      ))}

      {!submitted ? (
        <button
          onClick={handleSubmit}
          disabled={answers.some(a => a === null)}
          style={{ padding: "8px 14px", marginTop: 10 }}
        >
          Valider
        </button>
      ) : (
        <div style={{ marginTop: 10 }}>
          <strong>Votre score : {score} / {questions.length}</strong>
          <div>
            <button onClick={onClose} style={{ marginTop: 10 }}>
              Fermer le quiz
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
