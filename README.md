# MealMind 🍊

An AI-powered meal recommendation assistant designed to eliminate decision fatigue daily. Developed as an MVP with a completely decoupled MVC architecture separating the React Frontend and Express Backend.

## Project Architecture

This repository contains two completely isolated environments:
1. **`frontend/`**: The Next.js (React) web application. It handles the premium Glassmorphism UI and Firebase Authentication.
2. **`backend/`**: A Node.js and Express.js REST API. It handles the secure integration with the Google Gemini AI Model and processes the culinary constraints.

---

## Prerequisites

Before you start, make sure you have the following installed on your machine:
- [Node.js](https://nodejs.org/) (v16.x or higher)
- A [Firebase Project](https://console.firebase.google.com/) equipped with Email/Password Authentication.
- A [Google Gemini API Key](https://aistudio.google.com/).

---

## Installation & Setup

You must install dependencies for **both** the frontend and backend separately. 

### 1. Set Up the Backend
The backend requires your Gemini API key strictly to securely connect to the AI model. 

```bash
cd backend
npm install
```

Create a deeply hidden `.env` file inside the `backend/` folder and paste your key:
```env
GEMINI_API_KEY="your_actual_gemini_api_key_here"
```

### 2. Set Up the Frontend
The frontend requires your Firebase project keys to allow users to sign up securely. 

```bash
cd ../frontend
npm install
```

Create a hidden `.env.local` file inside the `frontend/` folder entirely in this format:
```env
VITE_FIREBASE_API_KEY="your_api_key_from_firebase"
VITE_FIREBASE_AUTH_DOMAIN="your_firebase_domain"
VITE_FIREBASE_PROJECT_ID="your_project_id"
VITE_FIREBASE_STORAGE_BUCKET="your_storage_bucket"
VITE_FIREBASE_MESSAGING_SENDER_ID="your_sender_id"
VITE_FIREBASE_APP_ID="your_app_id"
```
*(Note: If you omit the Firebase keys, the frontend UI will still render beautifully in "Read-Only Mock Mode", but you won't be able to log in or create database accounts until they are provided).*

---

## Running the Application Locally

For the AI Chef to successfully answer your questions on the site, **both servers must be running at the exact same time.**

### 1. Start the Backend API (Terminal 1)
```bash
cd backend
node server.js
```
*You should see a success log explicitly stating: `✅ MealMind Backend running perfectly on http://localhost:5000`*

### 2. Start the Frontend React App (Terminal 2)
Open a completely new terminal window alongside the other one:
```bash
cd frontend
npm run dev
```

### 3. Open the App
Go to [http://localhost:3000](http://localhost:3000) in your web browser. Type ingredients into the AI Dashboard and you will see the frontend ping your local Express API, which consults Gemini, and returns the customized recipe natively!
