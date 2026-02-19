import os
import io
import json
import uvicorn
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import google.generativeai as genai
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure API Key
API_KEY = os.environ.get("GEMINI_API_KEY")
if not API_KEY:
    print("WARNING: GEMINI_API_KEY environment variable not found.")

genai.configure(api_key=API_KEY)

# Use the requested model
MODEL_NAME = "gemini-2.5-flash-preview-09-2025"

app = FastAPI(title="Plant Doctor AI")

# CORS - Allow all for simplicity in this local tool wrapper
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Schemas (for documentation/validation if needed, though we rely on Gemini JSON mode primarily) ---
# We will rely on the SYSTEM_PROMPT to enforce schema.

# --- System Prompt ---
SYSTEM_PROMPT = """You are an agricultural AI assistant specialized in plant disease 
identification and safe treatment guidance.

STRICT RULES:
- Never hallucinate diseases or chemicals.
- If unsure, set diagnosis_status = "uncertain".
- Only recommend safe, common remedies.
- Avoid precise hazardous chemical concentrations.
- Use beginner-friendly explanations.
- Output ONLY valid JSON.
- If data is missing, return null instead of guessing.

OUTPUT JSON SCHEMA:
{
  "diagnosis_status": "confirmed | uncertain",
  "plant_name": "string",
  "detected_problem": {
    "name": "string",
    "type": "disease | pest | nutrient_deficiency | unknown",
    "confidence": 0.0
  },
  "symptoms": ["string"],
  "cause": "string",

  "natural_remedies": [
    {
      "title": "string",
      "ingredients": ["string"],
      "steps": ["string"],
      "frequency": "string",
      "safety_level": "low | medium"
    }
  ],

  "chemical_treatments": [
    {
      "treatment_type": "fungicide | pesticide | fertilizer",
      "active_ingredient": "string",
      "usage_guidance": "string",
      "precautions": ["string"]
    }
  ],

  "prevention_tips": ["string"],
  "confidence_note": "string",
  "disclaimer": "This is AI-assisted guidance. Verify locally before applying chemicals."
}
"""

@app.get("/")
async def root():
    return {"message": "Plant Doctor AI API is running"}

@app.post("/analyze-plant")
async def analyze_plant(file: UploadFile = File(...)):
    if not API_KEY:
        raise HTTPException(status_code=500, detail="Server misconfigured: API Key missing.")

    # Validate file type roughly
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image.")

    try:
        # Read image
        contents = await file.read()
        
        # Prepare for Gemini
        # It accepts bytes directly in some SDK versions, or 'parts' with mime_type
        image_part = {
            "mime_type": file.content_type,
            "data": contents
        }

        # Initialize model
        model = genai.GenerativeModel(
            model_name=MODEL_NAME,
            system_instruction=SYSTEM_PROMPT
        )

        # Generate content
        # We request JSON response format explicitly if supported, or rely on prompt
        generation_config = genai.GenerationConfig(
            response_mime_type="application/json"
        )
        
        response = model.generate_content(
            contents=[image_part, "Analyze this plant image according to the system prompt."],
            generation_config=generation_config
        )
        
        # Parse output
        try:
            result_json = json.loads(response.text)
            return JSONResponse(content=result_json)
        except json.JSONDecodeError:
            # Fallback if model didn't return perfect JSON (rare with response_mime_type)
            # Try to find JSON blob
            import re
            match = re.search(r'\{.*\}', response.text, re.DOTALL)
            if match:
                return JSONResponse(content=json.loads(match.group(0)))
            else:
                 raise HTTPException(status_code=500, detail="AI response format error.")

    except Exception as e:
        print(f"Error processing image: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
