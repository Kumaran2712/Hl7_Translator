import OpenAI from "openai";
import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import geoip from "geoip-lite";
dotenv.config();


const app = express();
app.set("trust proxy", 1);
app.use(express.json());
app.use(cors({origin:process.env.FRONTEND_ORIGIN || "http://localhost:5173"}));

const limiter  = rateLimit({
    windowMs: Number(process.env.RATE_WINDOW_MS) || 60000,
    max: Number(process.env.RATE_MAX || 10),
    standardHeaders: true,
    legacyHeaders: false,
    message: {error:"Too many requests from this IP, please try again later."},
})


app.use("/explain", limiter);

let totalRequests = 0;
let failures = 0;
let totalTokens = 0;
const DAILY_LIMIT = Number(process.env.DAILY_LIMIT || 300);

const countryCounts = {};

const client = new OpenAI();

//Hl7-LLm-Explanation

app.post("/explain", async(req,res)=>{

    if(totalRequests >= DAILY_LIMIT){
        return res.status(429).json({error:"Daily request limit reached. Please try again tomorrow."});
    }
    const {hl7} = req.body;
        if(!hl7 || hl7.length > Number(process.env.MAX_HL7_CHARS || 5000)){
            return res.status(400).json({error:"Hl7 missing or too large"});
        }
        totalRequests++;
        const ip = req.headers["x-forwarded-for"]?.split(",")[0] || req.ip;
        const geo = geoip.lookup(ip);
        const country = geo?.country || "Unknown";
        countryCounts[country] = (countryCounts[country] || 0) + 1;
    try{
        const prompt = `You are an HL7 expert who explains things like a friendly human, not like a technical document.

Your job:

1.Always assume the input is HL7 and give the best explanation possible.
2.Never say invalid. Just interpret whatever is available.
3. If it IS valid:
   - Explain the message in warm, simple, conversational English.
   - Talk as if you're explaining it to a friend who knows nothing about healthcare IT.
   - Avoid segment names unless absolutely needed.
   - Do NOT list bullet points unless the user asks.
   - Convert the message into a natural small story:
       Example: “This message is basically a lab report. It says that the lab at X sent a glucose result for a patient named Y…”
   - Summarize the important details only (who sent it, who it's about, what the results mean).
   - Keep it short, friendly, and easy to read.

Tone guidelines:
- Use natural phrases like “It looks like…”, “This message is basically saying…”
- Avoid jargon, segment codes, and technical formatting.
- Make it feel like a human conversation, not a structured analysis.

Example HL7 message:
MSH|^~\\&|IMMREG|HOSPITAL1|IIS|STATEIIS|20251115010000||VXU^V04|MSG00002|P|2.5.1\nPID|1||P789456^^^HOSPITAL1^MR||KUMAR^ARJUN^R||20120315|M||2106-3|45 TEMPLE STREET^^CHENNAI^TN^600002^IN||+91-9000000000|||||A123456789\nNK1|1|KUMAR^PRIYA|MTH|||+91-9444444444\nORC|RE|ORD0001^^HOSPITAL1\nRXA|0|1|20251110|20251110|141^Influenza, injectable^CVX|0.5|mL||00^New immunization record^NIP001||^^^HOSPITAL1|12345^SINGH^ARUN|20251110||A\nRXR|IM^Intramuscular\nOBX|1|CE|59784-9^Vaccine funding program eligibility category^LN||V01^VFC eligible-Medicaid/Medicaid Managed Care^HL70064||||||F\nOBX|2|TS|29768-9^Date vaccine information statement published^LN||20240806||||||F\nOBX|3|TS|29769-7^Date vaccine information statement presented^LN||20251110||||||F

Response should be: Here’s a very simple, non-technical explanation of your VXU (Vaccination Update) message.

🧒 Who is this about?

A boy named Arjun Kumar, born on 15 March 2012, living in Chennai, Tamil Nadu.
His father/mother/guardian listed is Priya Kumar.

💉 What vaccine was given?

Vaccine: Influenza (Flu shot)

Dose amount: 0.5 mL

How given: Intramuscular (in the arm or thigh)

Date given: 10 November 2025

Why recorded: It’s a new immunization record

Given by: Dr. Arun Singh, provider ID 12345

Facility: HOSPITAL1

📝 Extra information included
1. Funding eligibility

The system says the child is VFC eligible
(Vaccines for Children program — meaning the child qualifies for government-funded vaccines).

2. Vaccine Information Statement (VIS)

These are official information sheets given before vaccines.

The VIS sheet was published on: 06 Aug 2024

The VIS sheet was given/presented to the patient on: 10 Nov 2025 (same day as vaccination)

🧾 Summary in one line

This HL7 message says:

“On 10 Nov 2025, Arjun Kumar received a flu shot at HOSPITAL1, given by Dr. Arun Singh. He is eligible for VFC funding, and all required vaccine information sheets were provided.”
   
example 2:MSH|^~\&|CLINIC1|CITYHOSP|IIS|STATEIIS|20251115013000||VXU^V04|MSG00003|P|2.5.1
PID|1||P555222^^^CITYHOSP^MR||RAJ^MEERA^S||20180920|F||2106-3|12 GREEN PARK ROAD^^CHENNAI^TN^600040^IN||+91-9888888888|||||A987654321
NK1|1|RAJ^SUDHA|MTH|||+91-9777777777
ORC|RE|ORD0020^^CITYHOSP
RXA|0|1|20251114|20251114|10^Poliovirus vaccine, inactivated^CVX|0.5|mL||00^New immunization record^NIP001||^^^CITYHOSP|56789^KHAN^IMRAN|20251114||A
RXR|IM^Intramuscular
OBX|1|CE|59784-9^Vaccine funding program eligibility category^LN||V02^VFC eligible-Uninsured^HL70064||||||F
OBX|2|TS|29768-9^Date vaccine information statement published^LN||20230615||||||F
OBX|3|TS|29769-7^Date vaccine information statement presented^LN||20251114||||||F


explanation: 🧒 Patient Details

Name: Meera S Raj

DOB: 20 Sept 2018

Gender: Female

Lives at: Green Park Road, Chennai, TN

Contact: +91-9888888888

Mother/Guardian: Sudha Raj (+91-9777777777)

💉 What vaccine was given?

Vaccine: Polio (Inactivated Poliovirus Vaccine – IPV)

Code: CVX 10

Dose: 0.5 mL

How: Intramuscular injection

Date given: 14 Nov 2025

Recorded as: A new immunization record

Given by: Dr. Imran Khan (Provider ID: 56789)

Facility: CITYHOSP/CLINIC1

📝 Extra recorded details
✔ Funding Eligibility

The child qualifies for VFC (Vaccines for Children) under the category:
“Uninsured” (Code: V02)

✔ VIS Information (required by law)

The official information sheet about the vaccine (VIS):

Published on: 15 June 2023

Given to the patient on: 14 Nov 2025

This means the parent was given the government-approved vaccine info before administering the shot.

📦 In one simple sentence

On 14 Nov 2025, Meera Raj received a polio vaccine injection at CITYHOSP from Dr. Imran Khan, with all legal and funding requirements documented properly.

`;
        const response = await client.chat.completions.create({
            model:"gpt-4o-mini",
            max_tokens: 500,
            messages:[
                {role:"system", content:prompt},
                {role:"user", content: hl7}
            ]
        });

        totalTokens += response.usage.total_tokens;

        res.json({
            explanation: response.choices[0].message.content
        })
        
    } catch(error){
        failures++;
        console.error(error);
        res.status(500).json({error:"An error occurred while processing your request."});
    }
});

app.get("/stats",(req,res)=>{
    if(req.headers["x-admin"] !=process.env.ADMIN_KEY){
        return res.status(401).json({error:"Forbidden"});
    }
    res.json({
        totalRequests,
        failures,
        totalTokens,
        countryCounts,
        estimatedCostUSD: (totalTokens / 1000_000) * 5 // assuming $0.002 per 1K tokens
    });
});

app.listen(3000, ()=>{
    console.log("Server is running on port 3000");
});


