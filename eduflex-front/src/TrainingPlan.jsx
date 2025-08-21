// src/TrainingPlanFull.jsx
import React, { useState } from "react";
import './App.css';
//import html2pdf from "html2pdf.js";

// Composant Quiz intégré ici (tu peux aussi le mettre dans src/Quiz.jsx séparément)
function Quiz({ questions = [], onFinish, onClose }) {
  const [answers, setAnswers] = React.useState(Array(questions.length).fill(null));
  const [submitted, setSubmitted] = React.useState(false);
  const [score, setScore] = React.useState(null);

  // On attend que chaque question ait un champ 'explanations' qui est un objet { option: explanation }
  // Exemple : 
  // questions = [
  //   {
  //     question: "Quelle est la capitale de la France ?",
  //     options: ["Paris", "Londres", "Berlin"],
  //     answer: "Paris",
  //     explanations: {
  //       "Paris": "Paris est la capitale de la France.",
  //       "Londres": "Londres est la capitale du Royaume-Uni.",
  //       "Berlin": "Berlin est la capitale de l'Allemagne."
  //     }
  //   }
  // ]

  const handleAnswer = (qIndex, choiceIndex) => {
    if (submitted) return;
    const newAnswers = [...answers];
    newAnswers[qIndex] = choiceIndex;
    setAnswers(newAnswers);
  };

  const handleSubmit = () => {
    let s = 0;
    questions.forEach((q, i) => {
      const chosenIndex = answers[i];
      if (chosenIndex !== null) {
        const chosenAnswer = q.options[chosenIndex];
        if (chosenAnswer === q.answer) {
          s++;
        }
      }
    });
    setScore(s);
    setSubmitted(true);
    if (onFinish) onFinish(s);
  };

  return (
    <div>
      <h3>Quiz</h3>
      {questions.map((q, i) => (
        <div key={i} style={{ marginBottom: 20 }}>
          <div><strong>{i + 1}. {q.question}</strong></div>
          <div>
            {q.options.map((option, ci) => {
              const isCorrect = option === q.answer;
              const isSelected = answers[i] === ci;
              let bgColor = "transparent";

              if (submitted) {
                if (isSelected) {
                  bgColor = isCorrect ? "#d4edda" : "#f8d7da"; // vert pâle ou rouge pâle
                } else if (isCorrect) {
                  bgColor = "#d4edda"; // on colore la bonne réponse même si non choisie
                }
              }

              return (
                <label
                  key={ci}
                  style={{
                    display: "block",
                    cursor: submitted ? "default" : "pointer",
                    backgroundColor: bgColor,
                    borderRadius: 4,
                    padding: "4px 8px",
                    marginBottom: 4,
                    border: submitted && isSelected ? "2px solid #155724" : "1px solid #ccc"
                  }}
                >
                  <input
                    type="radio"
                    name={`q${i}`}
                    disabled={submitted}
                    checked={isSelected}
                    onChange={() => handleAnswer(i, ci)}
                    style={{ marginRight: 8 }}
                  />
                  {option}
                </label>
              );
            })}
          </div>

          {/* Affichage de l'explication si soumis */}
          {submitted && answers[i] !== null && q.explanations && (
            <div
              style={{
                marginTop: 6,
                padding: 8,
                backgroundColor: "#f0f0f0",
                borderRadius: 4,
                fontStyle: "italic",
                color: "#333"
              }}
            >
              {q.explanations[q.options[answers[i]]] || "Aucune explication disponible."}
            </div>
          )}
        </div>
      ))}

      {!submitted ? (
        <button onClick={handleSubmit} disabled={answers.some(a => a === null)}>
          Valider
        </button>
      ) : (
        <div>
          <strong>Votre score : {score} / {questions.length}</strong>
          <button onClick={onClose} style={{ marginLeft: 12 }}>Fermer le quiz</button>
        </div>
      )}
    </div>
  );
}




export default function TrainingPlanFull() {

  const [plan, setPlan] = useState(null);
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [loadingFull, setLoadingFull] = useState(false);
  const [error, setError] = useState(null);
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [fullCourse, setFullCourse] = useState(null);
 

  // Nouveaux états pour le formulaire
  const [subject, setSubject] = useState("Développement Web");
  const [level, setLevel] = useState("Débutant");
  const [focusPoints, setFocusPoints] = useState("React, CSS");
  const [timePerDay, setTimePerDay] = useState("1h");
  const [duration, setDuration] = useState("3 semaines");

  // États quiz
  const [quizQuestions, setQuizQuestions] = useState(null);
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizError, setQuizError] = useState(null);
  const [quizLoadingChapterTitle, setQuizLoadingChapterTitle] = useState(null);
  const [quizForChapterTitle, setQuizForChapterTitle] = useState(null);

  // Vidéo
  const [loading, setLoading] = useState(false);
  const [videoUrl, setVideoUrl] = useState(null);

  const fetchPlan = async (payload) => {
    setLoadingPlan(true);
    setError(null);
    try {
      const res = await fetch("https://eduflex-backend-sqid.onrender.com/api/generate-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error("Erreur génération plan");
      const data = await res.json();
      setPlan(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingPlan(false);
    }
  };



  const fetchChapterOnDemand = async (chapter) => {
    setSelectedChapter({ title: chapter.title, loading: true, html: "" });
    try {
      const res = await fetch("https://eduflex-backend-sqid.onrender.com/api/generate-lessons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chapter_title: chapter.title,
          chapter_summary: chapter.summary
        })
      });
      if (!res.ok) throw new Error("Erreur génération chapitre");
      const data = await res.json();
      setSelectedChapter({ title: chapter.title, loading: false, html: data.html, json: data.json });
    } catch (err) {
      setSelectedChapter({ title: chapter.title, loading: false, html: "", json: null });
      setError(err.message);
    }
  };

  const fetchQuiz = async (chapterTitle, chapterSummary) => {
    setQuizLoadingChapterTitle(chapterTitle);
    setQuizError(null);
    setQuizQuestions(null);
    setQuizForChapterTitle(null);
    try {
      const res = await fetch("https://eduflex-backend-sqid.onrender.com/api/generate-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chapter_title: chapterTitle, chapter_summary: chapterSummary }),
      });
      if (!res.ok) throw new Error("Erreur génération quiz");
      const data = await res.json();
      setQuizQuestions(data.questions);
      setQuizForChapterTitle(chapterTitle);
    } catch (err) {
      setQuizError(err.message);
    } finally {
      setQuizLoadingChapterTitle(null);
    }
  };



  //const exportChapterPDF = (chapterHtml, filename = "chapter.pdf") => {
  //  const el = document.createElement("div");
  //  el.innerHTML = chapterHtml;
 //   html2pdf().from(el).set({
 //     margin: 0.5,
 //     filename,
 //     html2canvas: { scale: 2 },
 //     jsPDF: { unit: "in", format: "a4", orientation: "portrait" }
 //   }).save();
 // };

  // Gestion formulaire
  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      subject,
      level,
      focus_points: focusPoints.split(",").map(s => s.trim()).filter(s => s.length > 0),
      time_per_day: timePerDay,
      duration,
    };
    setPlan(null);    // Reset ancien plan avant nouvelle génération
    setFullCourse(null);
    fetchPlan(payload);
  };

  // Debug console logs
  console.log("plan:", plan);
  console.log("fullCourse:", fullCourse);

  return (
    <div style={{ padding: 20, maxWidth: 1000, margin: "auto" }}>
      <h1>EduFlex — Générateur de formation complet</h1>
      

      {/* Liens réseaux sociaux */}
      <div style={{ marginBottom: 20 }}>
        <p>
        <a
          href="https://github.com/Gilchristttt"
          target="_blank"
          rel="noopener noreferrer"
          style={{ marginRight: 15, color: "#0366d6", textDecoration: "none",fontSize: "20px" }}
        >
          🐙 GitHub
        </a>
      
        </p>
        <p>
        <a
          href="https://www.linkedin.com/in/gilchrist-ou%C3%A9draogo-2279072a5"
          target="_blank"
          rel="noopener noreferrer"
          style={{ marginRight: 15, color: "#0e76a8", textDecoration: "none",fontSize: "20px" }}
        >
          💼 LinkedIn
        </a>
        </p>
        <p>
        <a
          href="https://www.kaggle.com/gilchr"
          target="_blank"
          rel="noopener noreferrer"
          style={{marginRight: 15, color: "#5396a1ff", textDecoration: "none",fontSize: "20px" }}
        >
           📊 Kaggle
        </a>
        </p>
        <p>
        <a
          href="https://huggingface.co/Christ20"
          target="_blank"
          rel="noopener noreferrer"
          style={{marginRight: 15, color: "#062d36ff", textDecoration: "none",fontSize: "20px"  }}
        >
          🤗 Hugging Face
        </a>
        </p>
      </div>

      {/* Formulaire de saisie */}
      <form onSubmit={handleSubmit} style={{ marginBottom: 20 }}>
        <div>
          <label> <b>Sujet :</b></label><br />
          <input
            type="text"
            value={subject}
            onChange={e => setSubject(e.target.value)}
            required
            style={{ width: "100%", padding: 6, marginBottom: 10 }}
          />
        </div>
        <div>
          <label><b>Niveau :</b></label><br />
          <input
            type="text"
            value={level}
            onChange={e => setLevel(e.target.value)}
            required
            style={{ width: "100%", padding: 6, marginBottom: 10 }}
          />
        </div>
        <div>
          <label><b>Points à approfondir (séparés par des virgules) :</b></label><br />
          <input
            type="text"
            value={focusPoints}
            onChange={e => setFocusPoints(e.target.value)}
            placeholder="Ex: React, CSS"
            style={{ width: "100%", padding: 6, marginBottom: 10 }}
          />
        </div>
        <div>
          <label><b>Temps disponible par jour :</b></label><br />
          <input
            type="text"
            value={timePerDay}
            onChange={e => setTimePerDay(e.target.value)}
            placeholder="Ex: 1h"
            style={{ width: "100%", padding: 6, marginBottom: 10 }}
          />
        </div>
        <div>
          <label><b>Durée de la formation :</b></label><br />
          <input
            type="text"
            value={duration}
            onChange={e => setDuration(e.target.value)}
            placeholder="Ex: 3 semaines"
            style={{ width: "100%", padding: 6, marginBottom: 10 }}
          />
        </div>
        <button type="submit" disabled={loadingPlan} style={{ padding: "8px 20px" }}>
          {loadingPlan ? "Génération en cours..." : "Générer plan de formation"}
        </button>
      </form>

      {/* Affichage d’erreur */}
      {error && (
        <div style={{ color: "red", marginBottom: 20 }}>
          <strong>Erreur :</strong> {error}
        </div>
      )}

      {/* Affichage plan */}
    {plan ? (
  plan.modules && plan.modules.length > 0 ? (
    <div style={{ marginBottom: 30 }}>
      <h2>📚 Plan de formation généré</h2>
      {plan.modules.map((module, idxModule) => (
        <div key={idxModule} style={{ marginBottom: 20 }}>
          <h3>{module.title}</h3>
          <ul>
            {module.chapters.map((chapter, idxChapter) => (
              <li key={idxChapter} style={{ marginBottom: 10 }}>
                <strong>{chapter.title}</strong><br />
                <em>{chapter.summary}</em><br />
                <button
                  onClick={() => fetchChapterOnDemand(chapter)}
                  disabled={selectedChapter && selectedChapter.title === chapter.title && selectedChapter.loading}
                  style={{ marginRight: 10 }}
                >
                  {selectedChapter && selectedChapter.title === chapter.title && selectedChapter.loading
                    ? "Chargement..."
                    : "Afficher contenu"}
                </button>

                <button
                    onClick={() => fetchQuiz(chapter.title, chapter.summary)}
                    disabled={quizLoadingChapterTitle !== null}
                  >
                    {quizLoadingChapterTitle === chapter.title && !quizQuestions ? "Chargement quiz..." : "Afficher quiz"}
                  </button>

                

              </li>
            ))}
          </ul>
        </div>
      ))}

     
    </div>
  ) : (
    <p style={{ color: "orange" }}>Aucun module disponible dans le plan reçu.</p>
  )
) : null}



      {/* Affichage chapitre sélectionné */}
      {selectedChapter && !selectedChapter.loading && selectedChapter.html && (
        <div style={{ marginBottom: 30,fontSize: "20px" }}>
          <h2>{selectedChapter.title}</h2>
          <div
            className="chapter-html"
            dangerouslySetInnerHTML={{ __html: selectedChapter.html }}
            style={{ border: "1px solid #ddd", padding: 15, borderRadius: 5 }}
          />
          {/* <button onClick={() => exportChapterPDF(selectedChapter.html, `${selectedChapter.title}.pdf`)} style={{ marginTop: 10 }}>
            Exporter ce chapitre en PDF
          </button> */}
        </div>
      )}

      {/* Affichage quiz */}
        {quizQuestions && quizForChapterTitle && (
      <div style={{ marginTop: 20 }}>
        <h3>Quiz pour : {quizForChapterTitle}</h3>
        <Quiz
          questions={quizQuestions}
          onClose={() => {
            setQuizQuestions(null);
            setQuizForChapterTitle(null);
          }}
          onFinish={(score) => alert(`Votre score : ${score} / ${quizQuestions.length}`)}
        />
      </div>
    )}

    {/* Affichage Video */}
    {videoUrl && (
  <div style={{ marginTop: 20 }}>
    <h3>Vidéo générée :</h3>
    <video controls src={videoUrl} style={{ width: "100%", maxHeight: 480 }} />
  </div>
)}



  
    </div>
  );
}