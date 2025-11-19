# 🧬 HL7 Translator

This project is a simple full-stack application that allows users to paste any HL7 v2.x message and get an easy-to-understand explanation in plain English.

## 🚀 What It Does
- Accepts raw HL7 messages (VXU, ADT, ORU, ORM, etc.)
- Sends them to a backend service powered by AI (OpenAI)
- Returns a friendly, human-readable explanation
- No HL7 data is stored — completely stateless
- Includes basic rate-limiting and usage tracking
- Frontend built with React + Vite + Tailwind + shadcn
- Backend built with Node.js + Express

## 💡 Why This Exists
HL7 messages are extremely technical and hard to read.  
This tool helps healthcare developers, students, and integrators understand HL7 messages quickly without needing deep HL7 expertise.

## 🛠 Tech Stack
**Frontend:** React, Vite, TailwindCSS, shadcn UI  
**Backend:** Node.js, Express, OpenAI API  

## 📦 How to Use
1. Paste your HL7 message into the input box  
2. Click **Translate**  
3. Read the simple English explanation  

That's it — fast and helpful.

---

Made with ❤️ by Kumaran.
