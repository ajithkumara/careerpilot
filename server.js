require("dotenv").config();
const express = require("express");
const multer = require("multer");
const fetch = require("node-fetch");
const fs = require("fs");
const path = require("path");

const app = express();
const upload = multer({ dest: "uploads/" });

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Health check
app.get("/api/status", (req, res) => {
  const hasKey = !!process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY !== "your_api_key_here";
  res.json({ ok: true, apiKeySet: hasKey });
});

// Main agent endpoint
app.post("/api/analyze", upload.single("resume"), async (req, res) => {
  const { jobUrl, jobDescription } = req.body;
  const resumeFile = req.file;

  if (!resumeFile) {
    return res.status(400).json({ error: "No resume uploaded." });
  }
  if (!jobUrl && !jobDescription) {
    return res.status(400).json({ error: "Please provide a job URL or job description." });
  }

  // Read resume as base64
  const resumeBuffer = fs.readFileSync(resumeFile.path);
  const resumeBase64 = resumeBuffer.toString("base64");

  // Clean up uploaded file
  fs.unlinkSync(resumeFile.path);

  const systemPrompt = `You are an expert job application assistant specialising in Senior Data Engineer and Principal Data Engineer roles.

Given a candidate's resume (PDF) and a job posting, you must:
1. If a URL is provided, use the web_search tool to fetch and read the job posting
2. Extract: company name, job title, location, ATS platform (Workday/Greenhouse/Lever/LinkedIn/Other), and key requirements
3. Generate tailored, professional answers for all application fields based STRICTLY on the candidate's actual resume — never invent experience
4. Estimate a skills match percentage based on overlap between resume and job requirements
5. Give one ATS-specific tip for the detected platform

Respond ONLY with a valid JSON object (no markdown, no backticks, no preamble) in this exact structure:
{
  "company": "...",
  "jobTitle": "...",
  "location": "...",
  "platform": "Greenhouse",
  "matchPercent": 82,
  "salaryRange": "...",
  "fields": [
    {"label": "Professional Summary", "value": "3-4 sentences tailored to this specific role and company"},
    {"label": "Years of Experience", "value": "X years"},
    {"label": "Key Technical Skills", "value": "comma-separated skills matching the job requirements"},
    {"label": "Cover Letter", "value": "3 short paragraphs specific to this company and role"},
    {"label": "Why this company?", "value": "2-3 sentences showing genuine interest"},
    {"label": "Most challenging data pipeline you built", "value": "specific story from resume with problem, action, result"},
    {"label": "Data quality and testing approach", "value": "specific methodology from resume experience"},
    {"label": "Salary expectation", "value": "Open to discussion based on total compensation package"},
    {"label": "LinkedIn / Portfolio URL", "value": "extracted from resume or placeholder"},
    {"label": "Notice period", "value": "extracted from resume context or 2 weeks"}
  ],
  "atsTip": "...",
  "missingSkills": ["skill1", "skill2"]
}`;

  const userContent = [
    {
      type: "document",
      source: {
        type: "base64",
        media_type: "application/pdf",
        data: resumeBase64,
      },
    },
    {
      type: "text",
      text: jobUrl
        ? `Job posting URL: ${jobUrl}\n\nPlease search the web to fetch and read this job posting, then analyse it against my resume and return the JSON response.`
        : `Job description:\n\n${jobDescription}\n\nPlease analyse this job description against my resume and return the JSON response.`,
    },
  ];

  const requestBody = {
    model: "claude-sonnet-4-20250514",
    max_tokens: 2000,
    system: systemPrompt,
    messages: [{ role: "user", content: userContent }],
  };

  // Add web search tool only if URL provided
  if (jobUrl) {
    requestBody.tools = [{ type: "web_search_20250305", name: "web_search" }];
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "anthropic-beta": "pdfs-2024-09-25",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const err = await response.text();
      return res.status(500).json({ error: `Anthropic API error: ${err}` });
    }

    const data = await response.json();

    // Extract text from all content blocks
    const textBlocks = data.content
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("\n");

    // Parse JSON from response
    let jsonStr = textBlocks.replace(/```json|```/g, "").trim();
    const firstBrace = jsonStr.indexOf("{");
    const lastBrace = jsonStr.lastIndexOf("}");
    if (firstBrace === -1 || lastBrace === -1) {
      return res.status(500).json({ error: "Could not parse AI response. Please try again." });
    }
    jsonStr = jsonStr.slice(firstBrace, lastBrace + 1);

    const result = JSON.parse(jsonStr);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n✅ Job Application Agent running at http://localhost:${PORT}\n`);
});
