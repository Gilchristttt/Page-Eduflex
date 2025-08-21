// src/App.jsx
import React from "react";
import Navbar from "./Navbar";
import TrainingPlanFull from "./TrainingPlan";

export default function App() {
  return (
    <div>
      <Navbar />
      <div className="px-6 py-4">
        <TrainingPlanFull />
      </div>
    </div>
  );
}
