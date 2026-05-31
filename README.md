# Zamp Nexus OS

An accounting firm portfolio dashboard where accountants log in and manage the sales tax nexus exposure for all of their clients in one place.

## How to Run Locally

1. Install root dependencies and client dependencies:
   ```bash
   npm install
   cd client && npm install && cd ..
   ```
2. Copy the `.env.example` file to `.env` and fill in your Gemini API key and a secure JWT secret:
   ```bash
   # Copy config
   cp .env.example .env
   ```
3. Start the project:
   - For frontend development:
     ```bash
     cd client && npm run dev
     ```
   - For backend API and database proxy:
     ```bash
     vercel dev
     ```

## Demo Credentials

* **Email:** `demo@smithtax.com`
* **Password:** `zamp2026`
