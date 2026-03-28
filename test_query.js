const fetch = require('node-fetch');

async function testTriage() {
    const payload = {
        contents: [
            {
                parts: [{
                    text: `You are an expert Emergency Medical Triage Assistant. Analyze the provided clinical information (text, image, or document).
    Return a structured JSON response with the following fields:
    1. "severity": "Critical" | "Urgent" | "Moderate" | "Low"
    2. "severity_explanation": A brief reason why this level was chosen.
    3. "likely_condition": A plain-language explanation of the most likely condition or symptoms seen.
    4. "action_plan": An array of at least 3-5 immediate step-by-step action items. Starting with life-saving steps if critical.
    5. "specialist": The type of doctor or medical specialist required.
    6. "doctor_summary": A professional medical summary in JSON format intended for a clinician.

    Rules:
    - If it's a critical emergency, the action plan MUST start with "Call 911" or local emergency services.
    - Return ONLY the JSON object.

    User Input: "45-year-old male presenting with sudden onset crushing chest pain, radiating to the left jaw and arm. Diaphoretic and short of breath for the last 15 minutes."`
                }]
            }
        ]
    };

    try {
        const response = await fetch('http://localhost:3000/api/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await response.json();
        console.log("FULL RAW RESPONSE:");
        console.log(JSON.stringify(data, null, 2));
    } catch (error) {
        console.error("Test Request Failed:", error);
    }
}

testTriage();
