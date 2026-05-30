import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  const apiKey = process.env.GEMINI_API_KEY;
  const ai = apiKey
    ? new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      })
    : null;

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", apiKeyConfigured: !!apiKey });
  });

  // API endpoint for role refinement / parsing
  app.post("/api/generate", async (req, res) => {
    try {
      const { notes } = req.body;
      if (!notes || notes.trim() === "") {
        return res.status(400).json({ error: "Please enter some notes about the role." });
      }

      if (!ai) {
        return res.status(500).json({
          error: "Gemini API key is missing. Please configure GEMINI_API_KEY in your Secrets list.",
        });
      }

      const prompt = `
You are an elite Recruiter, HR Specialist, and Talent Acquisition Strategist.
An employer has provided the following raw, informal, and unpolished notes regarding a desired job role they want to fill:

RAW USER NOTES:
"""
${notes}
"""

Your task is to take these raw notes and design a high-quality job blueprint in JSON format:

1) FINALIZED ROLE TITLE: Choose a highly marketable, clear, and professional job title search-optimized for general platforms and LinkedIn.

2) POLISHED LINKEDIN JOB DESCRIPTION:
   Draft a highly engaging, professional, and readable Job Description (JD) tailored for LinkedIn. 
   LinkedIn JDs need to be clear, clean, use visual dividers, formatting (headings, emojis for bullets), and capture attention quickly.
   Provide this in Markdown format so it can be formatted natively inside the UI, and easily copied. Include these sections with bullet points:
   - 🌟 **About the Role**: A 2-3 sentence engaging pitch summarizing the mission of the role.
   - 🎯 **Key Responsibilities**: What the person will own and do on a day-to-day basis.
   - 🛠 **Required Hard Skills & Technical Qualifications**: Solid tools, methodologies, credentials, or analytical abilities.
   - 🤝 **Ideal Soft Skills & Cultural Attributes**: Collaboration, communication, adaptability, work style, or mentorship style.
   - 🎁 **Benefits & Why You'll Love Working Here**: What we offer (financial, lifestyle, growth, culture).

3) INTERVIEW GUIDE WITH 10 BEHAVIORAL QUESTIONS:
   Generate exactly 10 behavioral interview questions targeted at the identified Hard and Soft skills mentioned in that JD.
   For each question:
   - Identify the specific target skill (e.g. "React development" or "Conflict Resolution").
   - Categorize skillType as "hard" or "soft".
   - Formulate a tailored behavioral question using the STAR model context (e.g., "describe a situation...", "give an example of a time when...").
   - Provide "What to Look For" which outlines positive indicators of a high-quality answer (e.g., active listening, deep technical reasoning, user-centric approach) and items that raise a red flag.

Please output the response as a JSON object matching this schema exactly:
{
  "roleTitle": "Optimized Job Title",
  "jobDescriptionMarkdown": "Full job description formatted in Markdown (using spacing, lists, heading levels, and visual bullet/emoji separators)",
  "skillsIdentified": [
    { "name": "React Hooks", "type": "hard" },
    { "name": "Cross-functional Collaboration", "type": "soft" }
  ],
  "interviewGuide": [
    {
      "id": 1,
      "question": "Behavioral question text...",
      "targetSkill": "Skill Name",
      "skillType": "hard",
      "whatToLookFor": "Detailed tips and signal highlights for the interviewer..."
    }
  ]
}
Ensure and double-check you generate exactly 10 high-quality, non-redundant interview questions, covering both key hard tools and key soft qualities of the role.
`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              roleTitle: { type: Type.STRING },
              jobDescriptionMarkdown: { type: Type.STRING },
              skillsIdentified: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    type: { type: Type.STRING, enum: ["hard", "soft"] },
                  },
                  required: ["name", "type"],
                },
              },
              interviewGuide: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.INTEGER },
                    question: { type: Type.STRING },
                    targetSkill: { type: Type.STRING },
                    skillType: { type: Type.STRING, enum: ["hard", "soft"] },
                    whatToLookFor: { type: Type.STRING },
                  },
                  required: ["id", "question", "targetSkill", "skillType", "whatToLookFor"],
                },
              },
            },
            required: ["roleTitle", "jobDescriptionMarkdown", "skillsIdentified", "interviewGuide"],
          },
        },
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error("Empty response received from the model.");
      }

      const generatedData = JSON.parse(responseText);
      return res.json(generatedData);
    } catch (err: any) {
      console.error("Error in generate content:", err);
      return res.status(500).json({ error: err.message || "An error occurred during generation." });
    }
  });

  // Serve static assets in production, otherwise Vite dev server handles it
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
