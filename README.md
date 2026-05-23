# 🤖 Job Application Agent — Local Setup Guide

An AI-powered browser app that reads your resume and generates tailored answers
for Senior Data Engineer job applications.

---

## Step 1 — Install Node.js

1. Go to: https://nodejs.org
2. Download the **LTS** version (the big green button)
3. Run the installer — click Next through all the steps
4. To verify it worked, open **Terminal** (Mac) or **Command Prompt** (Windows) and run:
   ```
   node --version
   ```
   You should see something like `v20.x.x`

---

## Step 2 — Get an Anthropic API Key

1. Go to: https://console.anthropic.com
2. Sign up for a free account
3. Click **"API Keys"** in the left sidebar
4. Click **"Create Key"** → give it a name like "job-agent"
5. Copy the key (starts with `sk-ant-...`) — you only see it once!

---

## Step 3 — Set up the project

Open **Terminal** (Mac/Linux) or **Command Prompt** / **PowerShell** (Windows).

### Navigate to the project folder:
```bash
cd path/to/job-agent
```
*(Replace `path/to/job-agent` with the actual folder location)*

### Install dependencies:
```bash
npm install
```

### Add your API key:
Open the `.env` file in any text editor (Notepad, VS Code, etc.) and replace:
```
ANTHROPIC_API_KEY=your_api_key_here
```
with your actual key:
```
ANTHROPIC_API_KEY=sk-ant-api03-xxxxxxxxxxxxxxxx
```
Save the file.

---

## Step 4 — Run the app

```bash
npm start
```

You should see:
```
✅ Job Application Agent running at http://localhost:3000
```

Open your browser and go to: **http://localhost:3000**

---

## How to use it

1. **Upload your PDF resume** — drag & drop or click to browse
2. **Paste the job URL** — works with Greenhouse, Workday, Lever, LinkedIn, etc.
3. **Click "Analyze & Generate Answers"**
4. Wait ~15–30 seconds while the AI reads the job posting and your resume
5. **Copy-paste each answer** directly into the application form
6. Click **"Open application"** to go to the job page

---

## Tips

- If the job page **requires a login** (e.g., internal portals), paste the job description text instead of the URL
- The app works best with job postings on **public ATS platforms**
- Your resume is sent to Anthropic's API to generate answers — it is not stored anywhere else
- The app runs entirely on your machine — no third-party servers involved (except Anthropic's API)

---

## To stop the server

Press `Ctrl + C` in the terminal window.

## To restart it

```bash
npm start
```

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `node: command not found` | Node.js not installed — repeat Step 1 |
| `Cannot find module 'express'` | Run `npm install` again |
| `API key error` | Check your `.env` file — no spaces around the `=` sign |
| Page won't load | Make sure the terminal shows "running at http://localhost:3000" |
| Port already in use | Change `PORT=3001` in `.env` and visit http://localhost:3001 |
