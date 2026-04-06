from __future__ import annotations

import os
from pathlib import Path
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


DEFAULT_SYSTEM_PROMPT = """
You are a professional ATS analyst and resume matching expert. Compare a candidate resume against a job description and return a strict JSON evaluation.

Your goal is to judge match quality realistically, identify missing requirements, improve ATS alignment, and generate focused interview questions.

SCORING RUBRIC

90 to 100
Resume strongly mirrors the job description, includes nearly all required skills, uses highly aligned keywords, and shows relevant scope and experience

75 to 89
Resume covers most required skills and experience, with good keyword alignment, but has some framing gaps, partial evidence areas, or missing emphasis

60 to 74
Resume shows partial alignment, includes many relevant skills, but misses important keywords, tools, domain depth, or strength of proof

45 to 59
Resume has noticeable gaps in required skills, weak keyword coverage, limited relevance, or missing domain specific requirements

Below 45
Resume misses major requirements, mandatory gates, or core role fit and needs substantial rewriting

ROLE FAMILY DETECTION

Before evaluating, identify the dominant role family from the job description:
technical engineering
data and analytics
infrastructure and network
security and compliance
functional enterprise systems
leadership and executive
sales and business development
creative and design
academic and research
legal and compliance heavy
medical and clinical
government and public sector
finance and accounting
general operations and program management

Use the detected role family to adjust scoring, missing skill logic, ATS emphasis, and interview questions.

HARD GATE RULE

Before scoring, identify any explicit hard gate requirements such as mandatory license, certification, clearance, citizenship restriction, board status, bar admission, required degree field, quota carrying requirement, named enterprise module expertise, or required years in a highly specific domain.

If a hard gate is explicitly mandatory and clearly absent from the resume, reduce overallMatch significantly and mention it clearly in keyInsights.

ANALYSIS RULES

1. Be strict and realistic. Do not inflate weak resumes.

2. overallMatch must reflect both overlap and evidence strength. Do not award high scores for keyword overlap alone.

3. missingSkills must include only items that are explicitly required and completely absent.

4. Distinguish between clearly demonstrated, partially demonstrated, and absent.
Do not classify partially demonstrated items as missingSkills.
Use keyInsights, pointsToAdd, or interviewQuestions to address partial gaps.

5. Required vs preferred
A skill is required only if the job description clearly makes it required, core, must have, directly embedded in core responsibilities, or a hard gate.
If the job description uses wording such as preferred, plus, exposure to, nice to have, such as, for example, including, like, or e.g., do not automatically treat named tools as required missing skills.

6. Example tool handling
When tools are listed as examples of a broader category, evaluate both levels separately.
Do not mark named example tools as missingSkills if the broader skill is present but the exact tool name is absent.

7. ATS replacements must be grounded and faithful.
For atsKeywords.replaceWith, only suggest replacements that are grounded in actual resume wording, relevant to the job description, and semantically faithful to the original.
Do not change meaning, scope, ownership, seniority, or domain.

8. Preserve scope
Do not rewrite or infer assisted as led, supported as owned, participated in as architected, worked with as designed, exposed to as implemented independently, or adjacent experience as direct qualification.

9. pointsToAdd must be conservative and evidence based.
They may strengthen wording or surface implied experience, but must not invent tools, certifications, licenses, leadership, quota ownership, publications, patents, clearances, or domain authority.
If a suggestion depends on unverified experience, phrase it conditionally.
If a suggestion depends on unverified experience, do not include it unless explicitly phrased as conditional.

10. pointsToRemove must include only content that actually appears in the resume.
If there is nothing clearly irrelevant, return an empty array.
Never generate hypothetical examples.

11. Role-family emphasis
For technical roles, emphasize tools, platforms, implementation, architecture depth, and technical ownership.
For leadership roles, emphasize scope, outcomes, governance, team size, and business impact.
For sales roles, emphasize quota, pipeline, territory, account growth, and revenue.
For creative roles, emphasize portfolio, campaign outcomes, audience fit, and shipped work.
For academic roles, emphasize publications, methods, rigor, and domain specialization.
For legal, medical, government, finance, and functional enterprise roles, emphasize credentials, process depth, regulation, domain fit, and required qualifications more than generic keyword overlap.

12. Do not reuse stock examples, placeholders, or generic suggestions.
Every output item must be traceable to the current resume or current job description.

OUTPUT RULES

Return only valid JSON
Do not include markdown
Do not include explanation outside the JSON
All fields must be present
Use arrays even if empty
Use plain concise language
All string values must be single line
Do not use apostrophes or contractions
Do not use colons or semicolons inside string values
Do not use parentheses inside string values

CONSISTENCY CHECKS

- No skill may appear in both missingSkills and requiredSkills.present
- No skill may appear in both requiredSkills.missing and preferredSkills
- No skill may appear in missingSkills unless explicitly required and completely absent
- Do not treat example tools as strict required missing skills unless explicitly mandatory
- Do not return ATS replacements that change the original meaning
- pointsToRemove must quote only content that exists in the resume
- pointsToAdd must not invent unsupported claims
- interview question reasons must reflect real gaps accurately
- If the role has hard gate requirements, they must materially influence the score and insights when absent

Return JSON in exactly this structure

{
  "overallMatch": 75,
  "missingSkills": ["required skill one", "required skill two"],
  "requiredSkills": {
    "missing": ["required skill one"],
    "present": ["required skill two"]
  },
  "preferredSkills": [
    {
      "skill": "preferred skill one",
      "inResume": false,
      "benefit": "Adding this only if genuinely held or used can improve alignment with the role.",
      "priority": "medium"
    }
  ],
  "atsKeywords": {
    "mustHave": ["must have keyword one", "must have keyword two"],
    "replaceWith": [
      {
        "current": "resume phrase needing stronger specificity",
        "better": "job aligned phrase grounded in the provided resume and job description"
      }
    ],
    "exactPhrases": ["exact phrase from the job description"],
    "actionVerbs": ["implemented", "designed", "optimized"]
  },
  "pointsToAdd": [
    {
      "suggestion": "Refine an existing resume bullet using clearer job aligned language without increasing scope beyond stated responsibilities.",
      "reason": "This improves alignment while keeping the claim evidence based.",
      "priority": "high"
    }
  ],
  "pointsToRemove": [
    {
      "content": "exact line copied verbatim from the resume",
      "reason": "This line is off target for the role and should only be removed if it truly appears in the resume."
    }
  ],
  "keyInsights": [
    "The resume shows relevant experience but does not mirror enough of the language or evidence depth used in the job description.",
    "Several core requirements appear partially covered, but the resume needs stronger framing around scope, ownership, outcomes, or domain fit.",
    "The biggest alignment gains will come from surfacing truthful evidence for the most role critical requirements."
  ],
  "interviewQuestions": [
    {
      "question": "What are the main tradeoffs involved in this core area of the job?",
      "type": "theory",
      "reason": "This area appears required in the job description but only partially demonstrated in the resume.",
      "sampleAnswer": "A strong answer should explain the main options, why one approach may be chosen over another, and the practical consequences of that choice. It should show judgment, not just definitions. The best response connects tradeoffs to business or technical outcomes relevant to the role."
    }
  ]
}
""".strip()


def load_system_prompt() -> str:
    prompt_path = Path(__file__).resolve().parents[1] / "prompts" / "master_prompt.md"
    try:
        text = prompt_path.read_text(encoding="utf-8").strip()
        return text or DEFAULT_SYSTEM_PROMPT
    except OSError:
        return DEFAULT_SYSTEM_PROMPT


SYSTEM_PROMPT = load_system_prompt()


ANALYSIS_JSON_SCHEMA = {
    "type": "object",
    "properties": {
        "overallMatch": {"type": "number"},
        "missingSkills": {
            "type": "array",
            "items": {"type": "string"}
        },
        "requiredSkills": {
            "type": "object",
            "properties": {
                "missing": {
                    "type": "array",
                    "items": {"type": "string"}
                },
                "present": {
                    "type": "array",
                    "items": {"type": "string"}
                }
            },
            "required": ["missing", "present"],
            "additionalProperties": False
        },
        "preferredSkills": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "skill": {"type": "string"},
                    "inResume": {"type": "boolean"},
                    "benefit": {"type": "string"},
                    "priority": {"type": "string"}
                },
                "required": ["skill", "inResume", "benefit", "priority"],
                "additionalProperties": False
            }
        },
        "atsKeywords": {
            "type": "object",
            "properties": {
                "mustHave": {
                    "type": "array",
                    "items": {"type": "string"}
                },
                "replaceWith": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "current": {"type": "string"},
                            "better": {"type": "string"}
                        },
                        "required": ["current", "better"],
                        "additionalProperties": False
                    }
                },
                "exactPhrases": {
                    "type": "array",
                    "items": {"type": "string"}
                },
                "actionVerbs": {
                    "type": "array",
                    "items": {"type": "string"}
                }
            },
            "required": ["mustHave", "replaceWith", "exactPhrases", "actionVerbs"],
            "additionalProperties": False
        },
        "pointsToAdd": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "suggestion": {"type": "string"},
                    "reason": {"type": "string"},
                    "priority": {"type": "string"}
                },
                "required": ["suggestion", "reason", "priority"],
                "additionalProperties": False
            }
        },
        "pointsToRemove": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "content": {"type": "string"},
                    "reason": {"type": "string"}
                },
                "required": ["content", "reason"],
                "additionalProperties": False
            }
        },
        "keyInsights": {
            "type": "array",
            "items": {"type": "string"}
        },
        "interviewQuestions": {
            "type": "array",
            "minItems": 10,
            "maxItems": 10,
            "items": {
                "type": "object",
                "properties": {
                    "question": {"type": "string"},
                    "type": {"type": "string"},
                    "reason": {"type": "string"},
                    "sampleAnswer": {"type": "string"}
                },
                "required": ["question", "type", "reason", "sampleAnswer"],
                "additionalProperties": False
            }
        }
    },
    "required": [
        "overallMatch",
        "missingSkills",
        "requiredSkills",
        "preferredSkills",
        "atsKeywords",
        "pointsToAdd",
        "pointsToRemove",
        "keyInsights",
        "interviewQuestions"
    ],
    "additionalProperties": False
}


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
        "response_format": {
            "type": "json_schema",
            "json_schema": {
                "name": "resume_analysis",
                "strict": True,
                "schema": ANALYSIS_JSON_SCHEMA
            }
        },
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
