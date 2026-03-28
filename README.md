# RescueIQ

Emergency Medical Triage Assistant built with Google Gemini 2.0 Flash for multi-modal, structured severity assessments.

## Run on Google Cloud Shell

Launch this application instantly in your browser using Google Cloud Shell with the click of a button!

[![Open in Cloud Shell](https://gstatic.com/cloudssh/images/open-btn.svg)](https://shell.cloud.google.com/cloudshell/editor?cloudshell_git_repo=https://github.com/vvajithk/RescueIQ)

### Setup Instructions

1. **Set up Environment**: First, create a `.env` file in the root of the cloned repository and add your Gemini API Key.
   ```env
   GEMINI_API_KEY="your_api_key_here"
   ```
2. **Install Dependencies**:
   ```bash
   npm install
   ```
3. **Start the Server**:
   ```bash
   npm start
   ```
4. The application will run locally and you can interact with it via its built-in proxy.
