# Resume Analyzer

This app analyzes a resume against a job description to provide match scores, ATS keyword coverage, and interview prep.

## Project Structure

- `my-resume-tool/` - React + Vite frontend
- `backend/` - FastAPI backend that talks to OpenAI GPT-4o securely

## Backend Setup (FastAPI)

1. Create a virtual environment and install dependencies:

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

2. Create your environment file:

```bash
cp .env.example .env
```

3. Add your OpenAI API key in `backend/.env`:

```
OPENAI_API_KEY=your_real_key_here
ALLOWED_ORIGINS=http://localhost:5173
```

4. Run the API:

```bash
uvicorn main:app --reload --port 8000
```

## Frontend Setup (React + Vite)

```bash
cd my-resume-tool
npm install
npm run dev
```

The frontend calls the backend at `http://localhost:8000/analyze`.

## Health Check

```bash
curl http://localhost:8000/health
```
