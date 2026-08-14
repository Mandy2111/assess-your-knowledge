# 🌟 Grade 3 Interactive Test Creator

A beautiful, interactive web application designed for Class 3 (Grade 3) students. It allows teachers and parents to upload screenshots of worksheets or textbooks, automatically generates a child-friendly, interactive test using the Gemini API, and reviews/grades the student's submissions with helpful, encouraging AI explanations.

## 🚀 Features

- 📸 **Screenshot/Image Upload**: Drag-and-drop or select images of textbook pages or homework worksheets.
- 🧠 **AI Test Generation**: Gemini automatically extracts learning content and converts it into a Class 3 level quiz (multiple choice, fill-in-the-blanks, short answer).
- 🎨 **Playful child-friendly UI**: Modern pastel theme, rounded corners, progress bar tracking, and canvas confetti effects.
- 🤖 **Interactive Grading**: Gemini acts as a friendly AI tutor to evaluate student answers (including conceptual spelling/semantic grading) and offers encouraging, easy-to-understand explanations.
- ⚙️ **Dual-Mode API Support**: 
  - **Local Mode**: Input your Gemini API key in the settings drawer (saved only in your browser's local storage).
  - **Secure Serverless Proxy Mode**: Deploy to Vercel and set `GEMINI_API_KEY` in environment variables.

## 🛠️ Tech Stack

- **Frontend**: Vanilla HTML5, Vanilla CSS3 (custom variables, modern transitions), Modern Javascript (ES6).
- **Backend (Serverless)**: Node.js Vercel serverless function (`/api/gemini-proxy`).

## 💻 Running Locally

To run the project locally:
1. Open `index.html` in any modern browser (using standard Live Server or open the file directly).
2. Click the ⚙️ icon in the top-right corner to open Settings.
3. Paste your Gemini API key (from [Google AI Studio](https://aistudio.google.com/)) and save.
4. Upload an image and start testing!

## ☁️ Deploying to Vercel (Free)

1. Push this folder to a GitHub repository.
2. Link the repository to your [Vercel Dashboard](https://vercel.com).
3. In the project settings, add the environment variable:
   - `GEMINI_API_KEY`: Your Google Gemini API Key.
4. Vercel will automatically build and serve the application, using the server-side API proxy to keep your API key secure!
