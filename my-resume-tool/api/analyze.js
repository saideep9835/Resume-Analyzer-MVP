const SYSTEM_PROMPT = `You are an expert resume consultant and ATS specialist. Your job is to analyze how well a resume matches a job description and provide specific, actionable recommendations.

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
   - Create exactly 5 interview questions
   - Include mix of technical, behavioral, scenario based
   - Provide a short answer for each question in 1 to 2 sentences
   - Use simple language, no complex punctuation
   - Prioritize questions on gaps between resume and JD

CRITICAL JSON FORMATTING RULES:
- Return ONLY the JSON object, nothing before or after
- Do NOT use apostrophes or quotes inside string values
- Replace contractions with full forms
- Keep interview answers under 60 words each
- Use only basic punctuation: periods, commas, hyphens
- No special characters: avoid parentheses, colons inside strings, semicolons
- All text must be on single lines (no line breaks)
- Double check your JSON is valid before returning

Return ONLY valid JSON, no markdown.`;

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ detail: 'Method not allowed' });
    return;
  }

  const { resume, jobDescription } = req.body || {};
  if (!resume?.trim() || !jobDescription?.trim()) {
    res.status(400).json({ detail: 'Resume and job description are required' });
    return;
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    res.status(500).json({ detail: 'OPENAI_API_KEY is not set' });
    return;
  }

  const prompt = `RESUME:\n${resume}\n\nJOB DESCRIPTION:\n${jobDescription}`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        temperature: 0.2,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: prompt }
        ]
      })
    });

    const data = await response.json();
    if (!response.ok) {
      res.status(response.status).json({ detail: data?.error?.message || 'OpenAI request failed' });
      return;
    }

    const text = data?.choices?.[0]?.message?.content;
    if (!text) {
      res.status(502).json({ detail: 'OpenAI response missing content' });
      return;
    }

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (err) {
      res.status(502).json({ detail: 'Failed to parse JSON from model response' });
      return;
    }

    res.status(200).json({ content: parsed });
  } catch (error) {
    res.status(502).json({ detail: `OpenAI request failed: ${error.message}` });
  }
};