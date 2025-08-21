# main.py
import os
import json
from typing import List, Dict, Any
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from langchain_groq import ChatGroq
from langchain_core.prompts import PromptTemplate
#from video_generator import generate_ultimate_video

load_dotenv()

# ---------- Configuration LLM ----------
llm = ChatGroq(
    groq_api_key=os.getenv("GROQ_API_KEY"),
    model_name="llama-3.3-70b-versatile"
)

# ---------- FastAPI ----------
app = FastAPI(title="EduFlex API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # change en prod
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------- Pydantic schemas ----------
class PlanRequest(BaseModel):
    subject: str
    level: str
    focus_points: List[str]
    time_per_day: str
    duration: str

class ChapterRef(BaseModel):
    title: str
    summary: str

class LessonsRequest(BaseModel):
    chapter_title: str
    chapter_summary: str

class FullCourseRequest(BaseModel):
    plan: Dict[str, Any]  # plan JSON (modules, chapters, planning, resources)
    # option: if True generate each chapter, otherwise return error
    generate_all: bool = True
    # concurrency / safety options could be added here in future

class QuizRequest(BaseModel):
    chapter_title: str
    chapter_summary: str

# ---------- Helpers: prompts ----------
PLAN_PROMPT = """
Tu es un concepteur pédagogique expert.
Génère un plan de formation complet au format JSON.
Sujet : "{subject}"
Niveau de l'apprenant : {level}.
Points à approfondir : {focus_points}.
Temps disponible : {time_per_day} par jour pendant {duration}.

La structure JSON exacte attendue :
{{
  "modules": [
    {{
      "title": "Nom du module",
      "chapters": [
        {{
          "title": "Nom du chapitre",
          "summary": "Résumé en 2-3 phrases"
        }}
      ]
    }}
  ],
  "planning": [
    {{
      "week": 1,
      "focus": "Objectif de la semaine"
    }}
  ],
  "resources": [
    {{
      "title": "Nom de la ressource",
      "url": "https://..."
    }}
  ]
}}

Renvoie uniquement du JSON valide, sans explication.
"""

LESSON_PROMPT_HTML = """
Tu es un expert pédagogique très expérimenté.

Génère un contenu complet, clair, détaillé et structuré avec des paragraphes pour le chapitre suivant.
Explique les concepts avec des exemples concrets, des analogies et des illustrations quand c'est possible.
Détaille bien chaque point important pour que l'apprenant comprenne parfaitement.


Titre du chapitre : "{chapter_title}"
Résumé : "{chapter_summary}"

Structure demandée en HTML :
<h2>Cours détaillé</h2>
<p class="lesson">... (contenu pédagogique clair, pas trop verbeux)</p>



<h2>Exercices pratiques</h2>
<ul>
  <li>Exercice 1 (étape par étape)</li>
  <li>Exercice 2</li>
</ul>

<h2>Mini-projet</h2>
<p>Décris un mini-projet réalisable en 1-3 heures (objectifs + étapes)</p>

<h2>Ressources complémentaires</h2>
<ul>
  <li><a href="https://...">Ressource 1</a></li>
</ul>

Renvoie uniquement l'HTML demandé (commence par les balises).
"""

LESSON_PROMPT_JSON = """
Tu es un expert pédagogique très expérimenté.

Génère un contenu complet, clair, détaillé et structuré avec des paragraphes pour le chapitre suivant.
Explique les concepts avec des exemples concrets, des analogies et des illustrations quand c'est possible.
Détaille bien chaque point important pour que l'apprenant comprenne parfaitement au format JSON.

Titre du chapitre : "{chapter_title}"
Résumé : "{chapter_summary}"

Structure JSON attendue :
{{
  "chapter_title": "...",
  "lesson": "Texte du cours (quelques paragraphes)",
 
  "exercises": [
    "Instruction exercice 1",
    "Instruction exercice 2"
  ],
  "mini_project": {{
    "title": "...",
    "description": "...",
    "steps": ["étape 1", "étape 2"]
  }},
  "resources": [
    {{ "title": "Nom", "url": "https://..." }}
  ]
}}

Renvoie uniquement du JSON valide.
"""

# ---------- Endpoints ----------

@app.get("/")
def root():
    return {"message": "EduFlex API opérationnelle ✅"}

@app.post("/api/generate-plan")
def generate_plan(req: PlanRequest):
    try:
        prompt = PromptTemplate.from_template(PLAN_PROMPT)
        chain = prompt | llm
        resp = chain.invoke({
            "subject": req.subject,
            "level": req.level,
            "focus_points": ", ".join(req.focus_points),
            "time_per_day": req.time_per_day,
            "duration": req.duration
        })
        raw = resp.content.strip()
        if raw.startswith("```") and raw.endswith("```"):
            raw = raw[3:-3].strip()

        try:
            plan_json = json.loads(raw)
        except json.JSONDecodeError:
            raise HTTPException(status_code=502, detail={
                "error": "Réponse LLM non JSON parsable",
                "raw": raw
            })

        return plan_json
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/generate-lessons")
def generate_lessons(req: LessonsRequest):
    """
    Génère le contenu (HTML) d'un chapitre.
    """
    try:
        # HTML generation
        tmpl = PromptTemplate.from_template(LESSON_PROMPT_HTML)
        chain = tmpl | llm
        resp_html = chain.invoke({
            "chapter_title": req.chapter_title,
            "chapter_summary": req.chapter_summary
        }).content

        # JSON generation (optionnel) : also ask for structured JSON for later processing
        tmpl_json = PromptTemplate.from_template(LESSON_PROMPT_JSON)
        chain_json = tmpl_json | llm
        resp_json_raw = chain_json.invoke({
            "chapter_title": req.chapter_title,
            "chapter_summary": req.chapter_summary
        }).content

        # try parse JSON; if fail, include raw
        try:
            resp_json = json.loads(resp_json_raw)
        except json.JSONDecodeError:
            resp_json = {"error": "LLM JSON non valide", "raw": resp_json_raw}

        return {
            "html": resp_html,
            "json": resp_json
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

QUIZ_PROMPT = """
Tu es un expert pédagogique.

Génère 10 questions de quiz à choix multiples basées sur ce chapitre.

Chapitre : "{chapter_title}"
Résumé : "{chapter_summary}"

Pour chaque question, fournis :
- La question ("question")
- Les options ("options", liste de chaînes)
- La bonne réponse ("answer")
- Une explication pour chaque option (bonne ou mauvaise) sous forme d'un objet "explanations" où la clé est l'option et la valeur l'explication.

Format JSON attendu :
[
  {{
    "question": "Question 1 ... ?",
    "options": ["option1", "option2", "option3"],
    "answer": "option1",
    "explanations": {{
      "option1": "Cette réponse est correcte parce que ...",
      "option2": "Cette réponse est incorrecte parce que ...",
      "option3": "Cette réponse est incorrecte parce que ..."
    }}
  }},
  {{
    "question": "Question 2 ... ?",
    "options": ["option1", "option2", "option3"],
    "answer": "option2",
    "explanations": {{
      "option1": "Cette réponse est incorrecte parce que ...",
      "option2": "Cette réponse est correcte parce que ...",
      "option3": "Cette réponse est incorrecte parce que ..."
    }}
  }},
  {{
    "question": "Question 3 ... ?",
    "options": ["option1", "option2", "option3"],
    "answer": "option3",
    "explanations": {{
      "option1": "Cette réponse est incorrecte parce que ...",
      "option2": "Cette réponse est incorrecte parce que ...",
      "option3": "Cette réponse est correcte parce que ..."
    }}
  }}
]

Renvoie uniquement du JSON valide.
"""


@app.post("/api/generate-full-course")
def generate_full_course(req: FullCourseRequest):
    if not req.generate_all:
        return {"message": "generate_all=false, aucune génération effectuée."}

    plan = req.plan
    aggregated = {"subject": plan.get("subject", ""), "modules": [], "planning": plan.get("planning", []), "resources": plan.get("resources", [])}

    try:
        modules = plan.get("modules", [])
        for mod in modules:
            new_mod = {"title": mod.get("title"), "chapters": []}
            for chap in mod.get("chapters", []):
                ch_title = chap.get("title")
                ch_summary = chap.get("summary", "")

                # Génération contenu HTML
                tmpl = PromptTemplate.from_template(LESSON_PROMPT_HTML)
                chain_html = tmpl | llm
                html_resp = chain_html.invoke({
                    "chapter_title": ch_title,
                    "chapter_summary": ch_summary
                }).content

                # Génération contenu JSON
                tmpl_json = PromptTemplate.from_template(LESSON_PROMPT_JSON)
                chain_json = tmpl_json | llm
                json_resp_raw = chain_json.invoke({
                    "chapter_title": ch_title,
                    "chapter_summary": ch_summary
                }).content

                try:
                    json_resp = json.loads(json_resp_raw)
                except json.JSONDecodeError:
                    json_resp = {"error": "LLM JSON non valide", "raw": json_resp_raw}

                # Génération quiz (nouveau)
                quiz_prompt = PromptTemplate.from_template(QUIZ_PROMPT)
                chain_quiz = quiz_prompt | llm
                quiz_resp_raw = chain_quiz.invoke({
                    "chapter_title": ch_title,
                    "chapter_summary": ch_summary
                }).content

                # Nettoyer le markdown si besoin
                if quiz_resp_raw.startswith("```") and quiz_resp_raw.endswith("```"):
                    quiz_resp_raw = quiz_resp_raw[3:-3].strip()

                try:
                    quiz_resp = json.loads(quiz_resp_raw)
                except json.JSONDecodeError:
                    quiz_resp = {"error": "LLM JSON quiz non valide", "raw": quiz_resp_raw}

                new_chap = {
                    "title": ch_title,
                    "summary": ch_summary,
                    "content_html": html_resp,
                    "content_json": json_resp,
                    "quiz": quiz_resp  # ajout du quiz ici
                }
                new_mod["chapters"].append(new_chap)
            aggregated["modules"].append(new_mod)

        return aggregated

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/generate-quiz")
async def generate_quiz(request: QuizRequest):
  
    prompt = PromptTemplate.from_template(QUIZ_PROMPT)
    chain = prompt | llm
    resp = chain.invoke({
        "chapter_title": request.chapter_title,
        "chapter_summary": request.chapter_summary
    })

    raw = resp.content.strip()

    # Nettoyage si le LLM entoure la réponse de ``` ou autre
    if raw.startswith("```") and raw.endswith("```"):
        raw = raw[3:-3].strip()

    import json
    try:
        questions = json.loads(raw)
    except json.JSONDecodeError:
        # En cas d'erreur de parsing, renvoyer un message d'erreur clair avec contenu brut
        raise HTTPException(status_code=502, detail={
            "error": "Réponse LLM non JSON parsable",
            "raw": raw
        })

    return {"questions": questions}


@app.post("/generate_video")
def create_video(chapter_title: str, chapter_text: str, quiz_list: list):
    output_path = f"videos/{chapter_title.replace(' ', '_')}.mp4"
    generate_ultimate_video(chapter_title, chapter_text, quiz_list, output_path, background_image="static/background.png", logo_path="static/logo.png")
    return {"video_path": output_path}