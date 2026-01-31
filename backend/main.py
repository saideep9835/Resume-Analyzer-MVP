from __future__ import annotations

import os
from typing import Any, Dict

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(",")

if not OPENAI_API_KEY:
    raise RuntimeError("OPENAI_API_KEY is not set. Create backend/.env from .env.example")

app = FastAPI(title="Resume Analyzer API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in ALLOWED_ORIGINS if origin.strip()],
    allow_credentials=True,
    allow_methods=["POST", "OPTIONS"],
    allow_headers=["*"]
)


class AnalyzeRequest(BaseModel):
    resume: str = Field(..., min_length=1)
    jobDescription: str = Field(..., min_length=1)


class AnalyzeResponse(BaseModel):
    content: Dict[str, Any]


SYSTEM_PROMPT = """
You are an expert resume consultant and ATS specialist. Your job is to analyze how well a resume matches a job description and provide specific, actionable recommendations.

ANALYSIS INSTRUCTIONS:
1. Calculate an honest overall match score (0-100) based on:
   - Skills alignment (40%)
   - Experience relevance (35%)
   - Keyword coverage (25%)

2. Identify SPECIFIC missing skills or keywords from the JD that appear in the resume nowhere or insufficiently

3. For points to ADD:
   - Suggest concrete bullet points the candidate could reasonably add based on their existing experience
   - Connect each suggestion directly to a requirement in the JD
   - Prioritize based on high equals required or critical skills, medium equals preferred skills, low equals nice to have
   - Be specific with metrics, action verbs, and outcomes

4. For points to REMOVE:
   - Find resume content that is irrelevant to THIS specific role
   - Explain why it does not align with the JD priorities

5. Key insights should be strategic observations about:
   - Overall positioning gaps
   - Industry language mismatches
   - Experience framing opportunities

6. Extract ATS friendly keywords:
   - Identify critical keywords from the JD that MUST appear in the resume
   - Find synonyms or alternatives the candidate currently uses that should be replaced
   - Note exact phrases from JD that should be mirrored (job titles, tech stacks, certifications)
   - Highlight action verbs from JD that should be adopted

7. Separate REQUIRED vs PREFERRED skills:
   - Mark which skills are must haves vs nice to haves based on JD language
   - For preferred skills NOT in resume, explain the benefit of adding them without making it mandatory
   - Indicate impact, for example Adding this preferred skill could boost your match by X percent

8. Generate interview preparation:
   - Create exactly 10 interview questions
   - Include mix of technical, behavioral, scenario based
   - Provide a 5 lines sentences as answers
   - Use simple language, no complex punctuation
   - Prioritize questions on gaps between resume and JD

CRITICAL JSON FORMATTING RULES:
- Return ONLY the JSON object, nothing before or after
- Do NOT use apostrophes or quotes inside string values
- Replace contractions with full forms
- Keep interview answers under 150 words each
- Use only basic punctuation: periods, commas, hyphens
- No special characters: avoid parentheses, colons inside strings, semicolons
- All text must be on single lines (no line breaks)
- Double check your JSON is valid before returning

Return ONLY valid JSON, no markdown:
{
  "overallMatch": 75,
  "missingSkills": ["Python", "Docker", "CI/CD"],
  "requiredSkills": {
    "missing": ["Python", "Docker"],
    "present": ["JavaScript", "Git"]
  },
  "preferredSkills": [
    {
      "skill": "TypeScript",
      "inResume": false,
      "benefit": "Adding TypeScript could boost your match by 8% and shows commitment to type-safe development",
      "priority": "medium"
    }
  ],
  "atsKeywords": {
    "mustHave": ["Python", "microservices", "scalability", "RESTful APIs"],
    "replaceWith": [
      {"current": "worked with databases", "better": "PostgreSQL database optimization"},
      {"current": "team player", "better": "cross-functional collaboration"}
    ],
    "exactPhrases": ["5+ years experience", "Bachelor's degree in Computer Science"],
    "actionVerbs": ["architected", "optimized", "scaled", "implemented"]
  },
  "pointsToAdd": [
    {
      "suggestion": "Led migration of legacy system to microservices architecture, reducing deployment time by 60% and improving system reliability",
      "reason": "JD emphasizes microservices experience and system optimization - this demonstrates both with quantified impact",
      "priority": "high"
    }
  ],
  "pointsToRemove": [
    {
      "content": "Managed social media accounts for university club",
      "reason": "JD is for a backend engineering role - social media experience is irrelevant and takes valuable space"
    }
  ],
  "keyInsights": [
    "Your resume focuses heavily on frontend work, but this role is 80 percent backend - reframe your full stack projects to emphasize server-side contributions",
    "JD mentions scalability multiple times but your resume never quantifies scale - add metrics",
    "You have the technical skills but lack leadership language - JD wants mentoring and technical leadership"
  ],
  "interviewQuestions": [
    {
      "question": "Can you walk me through your experience with microservices?",
      "type": "technical",
      "reason": "JD emphasizes microservices but resume does not mention it",
      "sampleAnswer": "I have worked with microservices from a backend engineering perspective in my previous software roles. I’ve developed RESTful microservices using Java and Spring Boot, where each service handled a specific business function and communicated over HTTP using JSON. I’ve worked with API contracts, authentication mechanisms like JWT or OAuth, and followed principles such as loose coupling and independent deployment. I also have experience deploying these services in cloud environments like AWS and Azure using Docker and Kubernetes. From an operational standpoint, I’ve handled logging, monitoring, and basic production troubleshooting for distributed services. Although my current role is field-focused, this microservices background helps me understand complex systems and structured integration workflows quickly."
    }
  ]
}
""".strip()


@app.get("/health")
async def health() -> Dict[str, str]:
    return {"status": "ok"}


@app.post("/analyze", response_model=AnalyzeResponse)
async def analyze(payload: AnalyzeRequest) -> AnalyzeResponse:
    if not payload.resume.strip() or not payload.jobDescription.strip():
        raise HTTPException(status_code=400, detail="Resume and job description are required")

    prompt = f"""
RESUME:
{payload.resume}

JOB DESCRIPTION:
{payload.jobDescription}
""".strip()

    request_body = {
        "model": "gpt-4o",
        "temperature": 0.2,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": prompt}
        ]
    }

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {OPENAI_API_KEY}"
    }

    try:
        async with httpx.AsyncClient(timeout=60) as client:
            response = await client.post("https://api.openai.com/v1/chat/completions", json=request_body, headers=headers)
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=502, detail=f"OpenAI request failed: {exc}") from exc

    if response.status_code >= 400:
        raise HTTPException(status_code=response.status_code, detail=response.text)

    data = response.json()
    choices = data.get("choices", [])
    if not choices:
        raise HTTPException(status_code=502, detail="Unexpected response format from OpenAI")

    message = choices[0].get("message", {})
    text = message.get("content")
    if not text:
        raise HTTPException(status_code=502, detail="OpenAI response missing content")

    try:
        parsed = httpx.Response(200, text=text).json()
    except ValueError as exc:
        raise HTTPException(status_code=502, detail="Failed to parse JSON from model response") from exc

    return AnalyzeResponse(content=parsed)
