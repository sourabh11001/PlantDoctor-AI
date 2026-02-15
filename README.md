# Plant Doctor AI 

A lightweight, AI-powered plant health assistant that helps you identify plant diseases and provides natural and chemical remedies.

## Prerequisites

- Python 3.9+
- A Google Gemini API Key

## Setup & Run

1.  **Set up Virtual Environment**
    ```bash
    python3 -m venv venv
    source venv/bin/activate
    ```

2.  **Install Dependencies**
    ```bash
    pip install -r requirements.txt
    ```

3.  **Set API Key (.env file)**
    
    Create a file named `.env` in the project root and add your key:
    ```
    GEMINI_API_KEY="your_api_key_here"
    ```
    *(Or rename `.env.example` to `.env`)*

4.  **Run the Backend**
    ```bash
    source venv/bin/activate
    uvicorn main:app --reload
    ```
    The server will start at `http://localhost:8000`.

4.  **Open the App**
    Simply open `index.html` in your browser. 
    
    *Note: Since the backend allows CORS from all origins, you can double-click the HTML file to open it directly.*

## Features
- 📸 **Image Upload**: Upload a photo of your plant.
- 🧠 **AI Analysis**: Uses Gemini 2.5 Flash to identify issues.
- 💊 **Remedies**: Get both natural home remedies and chemical options.
- 🛡️ **Prevention**: Tips to keep your plants healthy.

## Technology Stack
- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: FastAPI, Python
- **AI Model**: Gemini 2.5 Flash Preview 09-2025
