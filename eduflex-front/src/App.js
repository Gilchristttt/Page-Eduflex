// src/App.js
import React from "react";
import Navbar from "./Navbar";
import TrainingPlanFull from "./TrainingPlan";

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar fixe */}
      <header className="fixed top-0 left-0 w-full z-50">
        <Navbar />
      </header>

      {/* Contenu avec espace pour compenser la hauteur de la Navbar */}
      <main className="flex-1 pt-20 px-6 bg-gray-50">
        <TrainingPlanFull />
      </main>
    </div>
  );
}
