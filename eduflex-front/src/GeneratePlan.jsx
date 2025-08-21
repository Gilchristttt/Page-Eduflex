import React, { useState } from "react";

export default function GeneratePlan() {
  const [subject, setSubject] = useState("");
  const [level, setLevel] = useState("");
  const [focusPoints, setFocusPoints] = useState("");
  const [timePerDay, setTimePerDay] = useState("");
  const [duration, setDuration] = useState("");
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setPlan(null);
    setLoading(true);

    try {
      const response = await fetch("http://127.0.0.1:8000/api/generate-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject,
          level,
          focus_points: focusPoints.split(",").map((s) => s.trim()),
          time_per_day: timePerDay,
          duration,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        setError(err.detail || "Erreur serveur");
        setLoading(false);
        return;
      }

      const data = await response.json();
      setPlan(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 700, margin: "auto", padding: 20 }}>
      <h1>EduFlex — Générateur de formation complet</h1>

      <form onSubmit={handleSubmit} style={{ marginBottom: 20 }}>
        <div style={{ marginBottom: 12 }}>
          <label>Sujet :</label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
            style={{ width: "100%", padding: 8 }}
            placeholder="Ex: Développement Web"
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label>Niveau :</label>
          <input
            type="text"
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            required
            style={{ width: "100%", padding: 8 }}
            placeholder="Ex: Débutant, Intermédiaire, Avancé"
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label>Points à approfondir (séparés par des virgules) :</label>
          <input
            type="text"
            value={focusPoints}
            onChange={(e) => setFocusPoints(e.target.value)}
            style={{ width: "100%", padding: 8 }}
            placeholder="Ex: HTML, CSS, JavaScript"
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label>Temps disponible par jour :</label>
          <input
            type="text"
            value={timePerDay}
            onChange={(e) => setTimePerDay(e.target.value)}
            required
            style={{ width: "100%", padding: 8 }}
            placeholder="Ex: 1 heure"
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label>Durée totale :</label>
          <input
            type="text"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            required
            style={{ width: "100%", padding: 8 }}
            placeholder="Ex: 4 semaines"
          />
        </div>

        <button type="submit" disabled={loading} style={{ padding: "10px 20px" }}>
          {loading ? "Génération en cours..." : "Générer le plan"}
        </button>
      </form>

      {error && <p style={{ color: "red" }}>Erreur : {error}</p>}

      {plan && (
        <div>
          <h2>Plan généré :</h2>
          <pre
            style={{
              backgroundColor: "#f4f4f4",
              padding: 10,
              borderRadius: 5,
              maxHeight: 400,
              overflowY: "auto",
            }}
          >
            {JSON.stringify(plan, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
