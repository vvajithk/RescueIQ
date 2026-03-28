// App State
const state = {
    apiKey: sessionStorage.getItem('gemini_api_key') || '',
    activeTab: 'text',
    imageData: null, // { mimeType, data }
    fileData: null,  // { mimeType, data, name }
    isAnalyzing: false,
    isRecording: false,
    recognition: null
};

// DOM Elements
const elements = {
    apiKeyInput: document.getElementById('api-key'),
    saveKeyBtn: document.getElementById('save-key'),
    analyzeBtn: document.getElementById('analyze-btn'),
    tabBtns: document.querySelectorAll('.tab-btn'),
    tabPanels: document.querySelectorAll('.tab-panel'),
    symptomText: document.getElementById('symptom-text'),
    micBtn: document.getElementById('mic-btn'),
    voiceIndicator: document.getElementById('voice-indicator'),
    verifyTimes: document.querySelectorAll('.verify-time'),
    imageInput: document.getElementById('image-input'),
    fileInput: document.getElementById('file-input'),
    imageDropZone: document.getElementById('image-drop-zone'),
    fileDropZone: document.getElementById('file-drop-zone'),
    imagePreview: document.getElementById('image-preview'),
    filePreview: document.getElementById('file-preview'),
    resultsSection: document.getElementById('results-section'),
    severityCard: document.getElementById('severity-card'),
    severityBadge: document.getElementById('severity-badge'),
    severityDescription: document.getElementById('severity-description'),
    conditionExplanation: document.getElementById('condition-explanation'),
    actionPlan: document.getElementById('action-plan'),
    specialistInfo: document.getElementById('specialist-info'),
    medicalSummaryJson: document.getElementById('medical-summary-json'),
    copySummaryBtn: document.getElementById('copy-summary'),
    errorToast: document.getElementById('error-toast'),
    errorMessage: document.getElementById('error-message'),
    closeToast: document.getElementById('close-toast')
};

// Initialize
function init() {
    if (state.apiKey) {
        elements.apiKeyInput.value = state.apiKey;
    }
    setupEventListeners();
}

function setupEventListeners() {
    // API Key
    elements.saveKeyBtn.addEventListener('click', () => {
        state.apiKey = elements.apiKeyInput.value.trim();
        if (state.apiKey) {
            sessionStorage.setItem('gemini_api_key', state.apiKey);
            showNotification('API Key saved for this session.', 'success');
        }
    });

    // Tabs
    elements.tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.id.replace('tab-', '');
            switchTab(tabId);
        });
    });

    // Demo Buttons
    const demoTexts = {
        'heart': "45 year old male, sudden severe crushing chest pain radiating to left arm and jaw. Started 15 mins ago, sweating profusely and feeling dizzy.",
        'accident': "28 year old female pedestrian hit by a bicycle. Deep 3-inch laceration on right forearm, bleeding heavily. She is conscious but confused.",
        'fever': "7 year old child with 103F fever for 2 days. Persistent dry cough, no appetite, and pulling at right ear. Slight lethargy but drinking fluids."
    };

    document.querySelectorAll('.demo-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const sample = btn.getAttribute('data-sample');
            if (demoTexts[sample]) {
                elements.symptomText.value = demoTexts[sample];
                elements.symptomText.focus();
            }
        });
    });

    // Voice Input Setup
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
        state.recognition = new SpeechRecognition();
        state.recognition.continuous = true;
        state.recognition.interimResults = false;

        state.recognition.onstart = () => {
            state.isRecording = true;
            elements.micBtn.classList.add('recording');
            elements.voiceIndicator.hidden = false;
        };

        state.recognition.onresult = (event) => {
            let finalTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                }
            }
            if (finalTranscript) {
                elements.symptomText.value += (elements.symptomText.value ? ' ' : '') + finalTranscript;
            }
        };

        state.recognition.onerror = (e) => {
            console.error('Speech recognition error:', e);
            stopRecording();
            showNotification('Voice input ended or errored.', 'error');
        };

        state.recognition.onend = () => {
            stopRecording();
        };

        elements.micBtn.addEventListener('click', () => {
            if (state.isRecording) {
                stopRecording();
            } else {
                state.recognition.start();
            }
        });
    } else {
        elements.micBtn.style.display = 'none'; // Hide if browser doesn't support
    }

    // File Uploads
    elements.imageDropZone.addEventListener('click', () => elements.imageInput.click());
    elements.fileDropZone.addEventListener('click', () => elements.fileInput.click());

    elements.imageInput.addEventListener('change', (e) => handleFileUpload(e.target.files[0], 'image'));
    elements.fileInput.addEventListener('change', (e) => handleFileUpload(e.target.files[0], 'file'));

    // Drag and Drop
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        elements.imageDropZone.addEventListener(eventName, preventDefaults, false);
        elements.fileDropZone.addEventListener(eventName, preventDefaults, false);
    });

    elements.imageDropZone.addEventListener('drop', (e) => {
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            handleFileUpload(file, 'image');
        }
    });

    elements.fileDropZone.addEventListener('drop', (e) => {
        const file = e.dataTransfer.files[0];
        if (file) {
            handleFileUpload(file, 'file');
        }
    });

    // Analyze
    elements.analyzeBtn.addEventListener('click', performAnalysis);

    // Copy JSON
    elements.copySummaryBtn.addEventListener('click', () => {
        const text = elements.medicalSummaryJson.textContent;
        navigator.clipboard.writeText(text).then(() => {
            showNotification('Copied to clipboard!', 'success');
        });
    });

    // Error Toast
    elements.closeToast.addEventListener('click', hideError);
}

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

function switchTab(tabId) {
    state.activeTab = tabId;
    elements.tabBtns.forEach(btn => {
        btn.classList.toggle('active', btn.id === `tab-${tabId}`);
        btn.setAttribute('aria-selected', btn.id === `tab-${tabId}`);
    });
    elements.tabPanels.forEach(panel => {
        panel.hidden = panel.id !== `${tabId}-panel`;
    });
}

function handleFileUpload(file, type) {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        const base64Data = e.target.result.split(',')[1];
        const mimeType = file.type;

        if (type === 'image') {
            state.imageData = { mimeType, data: base64Data };
            elements.imagePreview.innerHTML = `
                <img src="${e.target.result}" alt="Preview">
                <p>${file.name}</p>
            `;
            elements.imagePreview.hidden = false;
        } else {
            state.fileData = { mimeType, data: base64Data, name: file.name };
            elements.filePreview.innerHTML = `
                <div class="file-icon-large">📄</div>
                <p>${file.name}</p>
            `;
            elements.filePreview.hidden = false;
        }
    };
    reader.readAsDataURL(file);
}

async function performAnalysis() {
    if (!state.apiKey) {
        showNotification('Please enter your Gemini API Key first.', 'error');
        return;
    }

    const promptText = elements.symptomText.value.trim();
    if (state.activeTab === 'text' && !promptText) {
        showNotification('Please enter symptoms or medical history.', 'error');
        return;
    }

    if (state.activeTab === 'image' && !state.imageData) {
        showNotification('Please upload an image.', 'error');
        return;
    }

    if (state.activeTab === 'file' && !state.fileData) {
        showNotification('Please upload a file.', 'error');
        return;
    }

    setLoading(true);
    hideError();

    try {
        const response = await callGeminiAPI();
        const data = parseGeminiResponse(response);
        displayResults(data);
    } catch (error) {
        console.error('Analysis failed:', error);
        showNotification(error.message || 'Failed to analyze data. Please check your API key and network.', 'error');
    } finally {
        setLoading(false);
    }
}

async function callGeminiAPI() {
    // Force use local proxy if on localhost, otherwise direct API if user provided a manual key
    const isLocalServer = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    
    // Determine the URL. If local server is not working or not reachable, this check might fail later, but it's our target.
    const url = isLocalServer ? '/api/analyze' : `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${state.apiKey}`;

    const systemPrompt = `You are an expert Emergency Medical Triage Assistant. Analyze the provided clinical information (text, image, or document).
    Return a structured JSON response with the following fields:
    1. "severity": "Critical" | "Urgent" | "Moderate" | "Low"
    2. "severity_explanation": A brief reason why this level was chosen.
    3. "likely_condition": A plain-language explanation of the most likely condition or symptoms seen.
    4. "action_plan": An array of at least 3-5 immediate step-by-step action items. Starting with life-saving steps if critical.
    5. "specialist": The type of doctor or medical specialist required.
    6. "doctor_summary": A professional medical summary in JSON format intended for a clinician.

    Rules:
    - If it's a critical emergency, the action plan MUST start with "Call 911" or local emergency services.
    - Be professional but clear.
    - Focus on emergency triage.
    - Return ONLY the JSON object.`;

    let userContent = {
        parts: [{ text: systemPrompt + "\n\nUser Input: " + (elements.symptomText.value || "Analyzing media/document data...") }]
    };

    if (state.activeTab === 'image' && state.imageData) {
        userContent.parts.push({
            inline_data: {
                mime_type: state.imageData.mimeType,
                data: state.imageData.data
            }
        });
    } else if (state.activeTab === 'file' && state.fileData) {
         userContent.parts.push({
            inline_data: {
                mime_type: state.fileData.mimeType,
                data: state.fileData.data
            }
        });
    }

    const payload = {
        contents: [userContent],
        generationConfig: {
            response_mime_type: "application/json"
        }
    };

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'API request failed');
    }

    const result = await response.json();
    return result.candidates[0].content.parts[0].text;
}

function parseGeminiResponse(jsonString) {
    try {
        // Handle cases where Gemini might wrap JSON in Markdown code blocks
        const cleanedJson = jsonString.replace(/```json|```/g, '').trim();
        return JSON.parse(cleanedJson);
    } catch (e) {
        console.error('Parsing error:', e, jsonString);
        throw new Error('Failed to parse AI response. The response may have been in an unexpected format.');
    }
}

function displayResults(data) {
    elements.resultsSection.hidden = false;
    elements.resultsSection.scrollIntoView({ behavior: 'smooth' });

    // Set AI Verified Timestamps
    const now = new Date();
    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    elements.verifyTimes.forEach(el => el.textContent = timeString);

    // Severity
    const severity = data.severity || 'Moderate';
    elements.severityBadge.textContent = severity;
    elements.severityBadge.className = `severity-badge badge-${severity.toLowerCase()}`;
    elements.severityCard.className = `analysis-status card severity-card ${severity.toLowerCase()}`;
    elements.severityDescription.textContent = data.severity_explanation || 'No explanation provided.';

    // Condition
    elements.conditionExplanation.textContent = data.likely_condition || 'Condition unclear from provided information.';

    // Action Plan
    elements.actionPlan.innerHTML = '';
    const actions = Array.isArray(data.action_plan) ? data.action_plan : ['Follow standard first-aid procedures.'];
    actions.forEach(step => {
        const li = document.createElement('li');
        li.textContent = step;
        elements.actionPlan.appendChild(li);
    });

    // Specialist
    elements.specialistInfo.textContent = data.specialist || 'Consult a general physician.';

    // JSON Summary
    elements.medicalSummaryJson.textContent = JSON.stringify(data.doctor_summary || data, null, 2);
}

function setLoading(isLoading) {
    state.isAnalyzing = isLoading;
    elements.analyzeBtn.disabled = isLoading;
    elements.analyzeBtn.querySelector('.spinner').hidden = !isLoading;
    elements.analyzeBtn.querySelector('.btn-text').textContent = isLoading ? 'Analyzing...' : 'Analyze with Gemini AI';
}

function showNotification(message, type) {
    elements.errorMessage.textContent = message;
    elements.errorToast.className = `toast ${type}`;
    elements.errorToast.hidden = false;

    // Auto hide after 5 seconds if success
    if (type === 'success') {
        setTimeout(hideError, 5000);
    }
}

function hideError() {
    elements.errorToast.hidden = true;
}

function stopRecording() {
    state.isRecording = false;
    elements.micBtn.classList.remove('recording');
    elements.voiceIndicator.hidden = true;
    if (state.recognition) {
        try { state.recognition.stop(); } catch(e) {}
    }
}

// Start the app
init();
