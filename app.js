/**
 * 🌟 app.js
 * Assess Your Knowledge Frontend Logic & State Management
 */

// Application State
const state = {
  uploadedImages: [], // Array of { mimeType: string, data: string } (base64)
  quizData: null,      // Generated quiz object
  currentQuestionIndex: 0,
  studentAnswers: {},  // Map of questionId -> studentAnswer string
  gradingResult: null  // Response from Gemini grading
};

// DOM Elements
const elements = {
  stepUpload: document.getElementById('step-upload'),
  stepLoading: document.getElementById('step-loading'),
  stepQuiz: document.getElementById('step-quiz'),
  stepResults: document.getElementById('step-results'),
  loaderStatus: document.getElementById('loader-status'),
  
  dropZone: document.getElementById('drop-zone'),
  imageInput: document.getElementById('image-input'),
  previewsContainer: document.getElementById('previews-container'),
  generateBtn: document.getElementById('generate-btn'),
  setupForm: document.getElementById('setup-form'),
  
  quizTitle: document.getElementById('quiz-title'),
  progressQuestionNum: document.getElementById('progress-question-num'),
  progressPercent: document.getElementById('progress-percent'),
  progressBarFill: document.getElementById('progress-bar-fill'),
  questionTypeBadge: document.getElementById('question-type-badge'),
  questionText: document.getElementById('question-text'),
  optionsContainer: document.getElementById('options-container'),
  inputContainer: document.getElementById('input-container'),
  textAnswer: document.getElementById('text-answer'),
  textareaAnswer: document.getElementById('textarea-answer'),
  hintToggleBtn: document.getElementById('hint-toggle-btn'),
  hintText: document.getElementById('hint-text'),
  prevQuestionBtn: document.getElementById('prev-question-btn'),
  nextQuestionBtn: document.getElementById('next-question-btn'),
  
  scoreTextNum: document.getElementById('score-text-num'),
  scoreTextTotal: document.getElementById('score-text-total'),
  scoreStars: document.getElementById('score-stars'),
  mascotFeedback: document.getElementById('mascot-feedback'),
  resultsBreakdownList: document.getElementById('results-breakdown-list'),
  restartBtn: document.getElementById('restart-btn'),
  
  settingsToggleBtn: document.getElementById('settings-toggle-btn'),
  settingsModal: document.getElementById('settings-modal'),
  settingsCloseBtn: document.getElementById('settings-close-btn'),
  apiKeyInput: document.getElementById('api-key-input'),
  apiKeyClearBtn: document.getElementById('api-key-clear-btn'),
  apiKeySaveBtn: document.getElementById('api-key-save-btn')
};

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
  loadSavedApiKey();
  updateGenerateButtonState();
});

// Load saved key from localStorage
function loadSavedApiKey() {
  const savedKey = localStorage.getItem('sparky_gemini_api_key');
  if (savedKey) {
    elements.apiKeyInput.value = savedKey;
  }
}

// Set up UI event listeners
function setupEventListeners() {
  // Settings Drawer Toggle
  elements.settingsToggleBtn.addEventListener('click', () => {
    elements.settingsModal.classList.add('active');
  });
  
  elements.settingsCloseBtn.addEventListener('click', () => {
    elements.settingsModal.classList.remove('active');
  });
  
  // Close modal when clicking outside content
  elements.settingsModal.addEventListener('click', (e) => {
    if (e.target === elements.settingsModal) {
      elements.settingsModal.classList.remove('active');
    }
  });

  // Save / Clear Key
  elements.apiKeySaveBtn.addEventListener('click', () => {
    const key = elements.apiKeyInput.value.trim();
    if (key) {
      localStorage.setItem('sparky_gemini_api_key', key);
      alert('Settings saved successfully!');
    } else {
      localStorage.removeItem('sparky_gemini_api_key');
      alert('Key removed.');
    }
    elements.settingsModal.classList.remove('active');
  });

  elements.apiKeyClearBtn.addEventListener('click', () => {
    elements.apiKeyInput.value = '';
    localStorage.removeItem('sparky_gemini_api_key');
    alert('API Key cleared.');
    elements.settingsModal.classList.remove('active');
  });

  // Drag and Drop Upload Handlers
  ['dragenter', 'dragover'].forEach(eventName => {
    elements.dropZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      elements.dropZone.classList.add('dragover');
    }, false);
  });

  ['dragleave', 'drop'].forEach(eventName => {
    elements.dropZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      elements.dropZone.classList.remove('dragover');
    }, false);
  });

  elements.dropZone.addEventListener('drop', (e) => {
    const dt = e.dataTransfer;
    const files = dt.files;
    handleFiles(files);
  });

  elements.imageInput.addEventListener('change', (e) => {
    handleFiles(e.target.files);
  });

  // Generate Test Button
  elements.generateBtn.addEventListener('click', startTestGeneration);

  // Hint Toggle
  elements.hintToggleBtn.addEventListener('click', () => {
    elements.hintText.classList.toggle('active');
  });

  // Quiz Navigation
  elements.prevQuestionBtn.addEventListener('click', loadPreviousQuestion);
  elements.nextQuestionBtn.addEventListener('click', handleNextOrFinish);

  // Restart Button
  elements.restartBtn.addEventListener('click', resetQuizFlow);

  // Input Listeners to store answers on the fly
  elements.textAnswer.addEventListener('input', (e) => {
    const currentQ = state.quizData.questions[state.currentQuestionIndex];
    state.studentAnswers[currentQ.id] = e.target.value.trim();
  });

  elements.textareaAnswer.addEventListener('input', (e) => {
    const currentQ = state.quizData.questions[state.currentQuestionIndex];
    state.studentAnswers[currentQ.id] = e.target.value.trim();
  });
}

// File Upload Logic
function handleFiles(files) {
  Array.from(files).forEach(file => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload image files only (PNG, JPG, WebP).');
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = () => {
      const base64Data = reader.result.split(',')[1];
      state.uploadedImages.push({
        mimeType: file.type,
        data: base64Data,
        dataUrl: reader.result // For preview
      });
      renderPreviews();
      updateGenerateButtonState();
    };
  });
}

function renderPreviews() {
  elements.previewsContainer.innerHTML = '';
  state.uploadedImages.forEach((img, index) => {
    const item = document.createElement('div');
    item.className = 'preview-item';
    
    const imgEl = document.createElement('img');
    imgEl.src = img.dataUrl;
    imgEl.alt = `Uploaded page ${index + 1}`;
    
    const removeBtn = document.createElement('button');
    removeBtn.className = 'preview-remove';
    removeBtn.innerHTML = '&times;';
    removeBtn.ariaLabel = 'Remove image';
    removeBtn.onclick = (e) => {
      e.stopPropagation();
      state.uploadedImages.splice(index, 1);
      renderPreviews();
      updateGenerateButtonState();
    };
    
    item.appendChild(imgEl);
    item.appendChild(removeBtn);
    elements.previewsContainer.appendChild(item);
  });
}

function updateGenerateButtonState() {
  elements.generateBtn.disabled = state.uploadedImages.length === 0;
}

// Switch between step screens
function navigateToStep(stepId) {
  document.querySelectorAll('.step-screen').forEach(screen => {
    screen.classList.remove('active');
  });
  const target = document.getElementById(stepId);
  if (target) {
    target.classList.add('active');
  }
}

// Call Gemini API (dual mode: direct or vercel proxy)
async function callGemini(payload, model = 'gemini-3.6-flash') {
  const localKey = localStorage.getItem('sparky_gemini_api_key');
  
  if (!localKey && (window.location.protocol === 'file:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    throw new Error('You are running Assess Your Knowledge locally. To test it, click the settings gear (⚙️) in the top-right and enter your Gemini API Key. The Vercel serverless proxy is only active when deployed to Vercel!');
  }
  
  if (localKey) {
    // Direct call (client-side)
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${localKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.error?.message || 'Error communicating directly with Gemini API.');
    }
    return await response.json();
  } else {
    // Vercel Serverless proxy call
    const url = `/api/gemini-proxy?model=${model}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      const errData = await response.json();
      if (errData.code === 'MISSING_API_KEY') {
        throw new Error('Gemini API Key is not set. Please click the ⚙️ icon in the top-right corner to input your key.');
      }
      throw new Error(errData.error || errData.message || 'Error communicating with Vercel API proxy.');
    }
    return await response.json();
  }
}

// API Quiz Generation
async function startTestGeneration() {
  const subject = document.getElementById('subject-select').value;
  const count = parseInt(document.getElementById('count-select').value);
  const style = document.getElementById('style-select').value;
  const grade = document.getElementById('grade-select').value;
  const difficulty = document.getElementById('difficulty-select').value;
  
  elements.loaderStatus.textContent = 'Sparky is reading the worksheet... 📖';
  navigateToStep('step-loading');
  
  try {
    // Construct inline image contents
    const imageParts = state.uploadedImages.map(img => ({
      inlineData: {
        mimeType: img.mimeType,
        data: img.data
      }
    }));
    
    const systemPrompt = `You are an expert elementary school teacher creating worksheets and quizzes. 
Generate a ${grade} standard interactive test based on the educational content found in the provided screenshots.
The questions should be appropriate for ${grade} students with a ${difficulty} difficulty level.
Strictly ensure that questions are child-friendly and suitable for the reading/comprehension level of ${grade}.
Create exactly ${count} questions. 
Subject: ${subject}
Tone Style: ${style}
Difficulty Level: ${difficulty}

Mix these three types of questions:
- multiple-choice: Include exactly 4 options. Make options distinct and clear.
- fill-in-the-blank: A question containing a clear sentence with a missing word or phrase.
- short-answer: A simple descriptive question where the child writes a short sentence.

Output the result in JSON matching the schema format. Make sure the correctAnswer matches the expected text or option. Provide a helpful, friendly hint for the kid.

IMPORTANT: If the subject is Hindi, generate questions, answers, and hints strictly in Hindi. For all other subjects, generate in English.`;

    const responseSchema = {
      type: 'OBJECT',
      properties: {
        title: { type: 'STRING' },
        subject: { type: 'STRING' },
        grade: { type: 'STRING' },
        questions: {
          type: 'ARRAY',
          items: {
            type: 'OBJECT',
            properties: {
              id: { type: 'INTEGER' },
              type: { type: 'STRING', enum: ['multiple-choice', 'fill-in-the-blank', 'short-answer'] },
              questionText: { type: 'STRING' },
              options: {
                type: 'ARRAY',
                items: { type: 'STRING' }
              },
              correctAnswer: { type: 'STRING' },
              hint: { type: 'STRING' }
            },
            required: ['id', 'type', 'questionText', 'correctAnswer', 'hint']
          }
        }
      },
      required: ['title', 'subject', 'grade', 'questions']
    };

    const payload = {
      contents: [
        {
          parts: [
            ...imageParts,
            { text: `Create a ${grade} quiz (difficulty: ${difficulty}) on ${subject} containing exactly ${count} questions based on these materials.` }
          ]
        }
      ],
      systemInstruction: {
        parts: [{ text: systemPrompt }]
      },
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: responseSchema
      }
    };
    
    elements.loaderStatus.textContent = 'Sparky is building your quiz... 🎨';
    const result = await callGemini(payload);
    
    // Parse response content
    const responseText = result.candidates[0].content.parts[0].text;
    console.log("Raw API Response:", responseText); // Debugging
    // More robust cleanup: remove everything before the first '{' and after the last '}'
    const firstBrace = responseText.indexOf('{');
    const lastBrace = responseText.lastIndexOf('}');
    const cleanJson = (firstBrace !== -1 && lastBrace !== -1) 
      ? responseText.substring(firstBrace, lastBrace + 1) 
      : responseText;
    state.quizData = JSON.parse(cleanJson);

    
    // Initialize Quiz Player
    state.currentQuestionIndex = 0;
    state.studentAnswers = {};
    elements.quizTitle.textContent = state.quizData.title || `${grade} ${subject}`;
    
    navigateToStep('step-quiz');
    loadQuestion(0);
    
  } catch (error) {
    alert(`Generation failed: ${error.message}`);
    navigateToStep('step-upload');
  }
}

// Render quiz player questions
function loadQuestion(index) {
  if (!state.quizData || !state.quizData.questions[index]) return;
  
  state.currentQuestionIndex = index;
  const question = state.quizData.questions[index];
  
  // Update progress bar
  const total = state.quizData.questions.length;
  elements.progressQuestionNum.textContent = `Question ${index + 1} of ${total}`;
  const percent = Math.round(((index) / total) * 100);
  elements.progressPercent.textContent = `${percent}% Done`;
  elements.progressBarFill.style.width = `${percent}%`;
  
  // Set question metadata and text
  elements.questionText.textContent = question.questionText;
  elements.hintText.classList.remove('active');
  elements.hintText.textContent = question.hint || 'Try your best!';
  
  // Hide all answer containers first
  elements.optionsContainer.style.display = 'none';
  elements.inputContainer.style.display = 'none';
  elements.textAnswer.style.display = 'none';
  elements.textareaAnswer.style.display = 'none';
  
  // Set question type badge
  if (question.type === 'multiple-choice') {
    elements.questionTypeBadge.className = 'question-meta meta-mc';
    elements.questionTypeBadge.textContent = 'Multiple Choice';
    renderMultipleChoice(question);
  } else if (question.type === 'fill-in-the-blank') {
    elements.questionTypeBadge.className = 'question-meta meta-fib';
    elements.questionTypeBadge.textContent = 'Fill in the Blank';
    renderTextInput(question, false);
  } else {
    elements.questionTypeBadge.className = 'question-meta meta-sa';
    elements.questionTypeBadge.textContent = 'Short Answer';
    renderTextInput(question, true);
  }
  
  // Set back button state
  elements.prevQuestionBtn.disabled = index === 0;
  
  // Set next button text
  if (index === total - 1) {
    elements.nextQuestionBtn.innerHTML = '<span>Finish & Grade!</span> <span>🎉</span>';
  } else {
    elements.nextQuestionBtn.innerHTML = '<span>Next Question</span> <span>→</span>';
  }
}

function renderMultipleChoice(question) {
  elements.optionsContainer.innerHTML = '';
  elements.optionsContainer.style.display = 'grid';
  
  const selectedAnswer = state.studentAnswers[question.id] || '';
  const badges = ['A', 'B', 'C', 'D'];
  
  question.options.forEach((option, idx) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `option-btn ${selectedAnswer === option ? 'selected' : ''}`;
    
    const badge = document.createElement('span');
    badge.className = 'option-badge';
    badge.textContent = badges[idx] || '•';
    
    const text = document.createElement('span');
    text.textContent = option;
    
    btn.appendChild(badge);
    btn.appendChild(text);
    
    btn.onclick = () => {
      // Toggle selected class on sibling buttons
      const buttons = elements.optionsContainer.querySelectorAll('.option-btn');
      buttons.forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      
      // Store answer
      state.studentAnswers[question.id] = option;
    };
    
    elements.optionsContainer.appendChild(btn);
  });
}

function renderTextInput(question, isLongAnswer) {
  elements.inputContainer.style.display = 'flex';
  const savedAnswer = state.studentAnswers[question.id] || '';
  
  if (isLongAnswer) {
    elements.textareaAnswer.style.display = 'block';
    elements.textareaAnswer.value = savedAnswer;
    // Set focus
    setTimeout(() => elements.textareaAnswer.focus(), 50);
  } else {
    elements.textAnswer.style.display = 'block';
    elements.textAnswer.value = savedAnswer;
    setTimeout(() => elements.textAnswer.focus(), 50);
  }
}

function loadPreviousQuestion() {
  if (state.currentQuestionIndex > 0) {
    loadQuestion(state.currentQuestionIndex - 1);
  }
}

function handleNextOrFinish() {
  const currentQ = state.quizData.questions[state.currentQuestionIndex];
  const currentAnswer = state.studentAnswers[currentQ.id];
  
  // Mild validation: encourage filling answers
  if (!currentAnswer || currentAnswer.toString().trim() === '') {
    if (!confirm('You did not answer this question yet. Do you want to continue?')) {
      return;
    }
  }
  
  const total = state.quizData.questions.length;
  if (state.currentQuestionIndex === total - 1) {
    // Last question: Trigger Grading flow
    gradeTestSubmission();
  } else {
    // Go to next
    loadQuestion(state.currentQuestionIndex + 1);
  }
}

// Submit answers and evaluate using Gemini
async function gradeTestSubmission() {
  elements.loaderStatus.textContent = 'Sparky is checking your answers... 🐾';
  navigateToStep('step-loading');
  
  try {
    const grade = state.quizData.grade || 'Grade 3';
    const systemPrompt = `You are a supportive, encouraging AI grading assistant for ${grade} students.
Grade the student's test answers based on the correct answers.
Be flexible: if it's a fill-in-the-blank or short-answer and the meaning is correct, or there is a minor spelling mistake suitable for a student of this grade, mark it correct (isCorrect: true).
For each question, explain why it was correct or how they can improve in a gentle, warm, and highly positive manner.
For the overall feedback, write a highly encouraging response from Sparky, the cute puppy mascot.
Output the grading result in JSON matching the schema.`;

    const gradingSchema = {
      type: 'OBJECT',
      properties: {
        score: { type: 'INTEGER' },
        totalQuestions: { type: 'INTEGER' },
        overallFeedback: { type: 'STRING' },
        breakdown: {
          type: 'ARRAY',
          items: {
            type: 'OBJECT',
            properties: {
              questionId: { type: 'INTEGER' },
              isCorrect: { type: 'BOOLEAN' },
              studentAnswer: { type: 'STRING' },
              correctAnswer: { type: 'STRING' },
              explanation: { type: 'STRING' }
            },
            required: ['questionId', 'isCorrect', 'studentAnswer', 'correctAnswer', 'explanation']
          }
        }
      },
      required: ['score', 'totalQuestions', 'overallFeedback', 'breakdown']
    };

    // Formulate evaluation payload
    const evaluationPayload = state.quizData.questions.map(q => ({
      id: q.id,
      questionText: q.questionText,
      correctAnswer: q.correctAnswer,
      studentAnswer: state.studentAnswers[q.id] || '(No Answer Provided)'
    }));

    const payload = {
      contents: [
        {
          parts: [
            { text: `Grade this student submission:\n${JSON.stringify(evaluationPayload)}` }
          ]
        }
      ],
      systemInstruction: {
        parts: [{ text: systemPrompt }]
      },
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: gradingSchema
      }
    };
    
    const result = await callGemini(payload);
    
    // Parse results
    const responseText = result.candidates[0].content.parts[0].text;
    console.log("Raw API Response (Grading):", responseText); // Debugging
    // More robust cleanup: remove everything before the first '{' and after the last '}'
    const firstBrace = responseText.indexOf('{');
    const lastBrace = responseText.lastIndexOf('}');
    const cleanJson = (firstBrace !== -1 && lastBrace !== -1) 
      ? responseText.substring(firstBrace, lastBrace + 1) 
      : responseText;
    state.gradingResult = JSON.parse(cleanJson);

    
    renderResults();
    
  } catch (error) {
    alert(`Grading failed: ${error.message}`);
    navigateToStep('step-quiz');
  }
}

// Display results screen
function renderResults() {
  const res = state.gradingResult;
  if (!res) return;
  
  navigateToStep('step-results');
  
  // Set progress bar on quiz to 100% just in case
  elements.progressBarFill.style.width = '100%';
  
  // Set Score info
  elements.scoreTextNum.textContent = res.score;
  elements.scoreTextTotal.textContent = `out of ${res.totalQuestions}`;
  
  // Star assessment
  const percent = (res.score / res.totalQuestions) * 100;
  let starsHtml = '';
  if (percent === 100) {
    starsHtml = '⭐ ⭐ ⭐';
    triggerConfetti(120);
  } else if (percent >= 60) {
    starsHtml = '⭐ ⭐';
    triggerConfetti(50);
  } else if (percent > 0) {
    starsHtml = '⭐';
  } else {
    starsHtml = '✏️'; // Keep trying badge
  }
  elements.scoreStars.innerHTML = starsHtml;
  
  // Mascot text
  elements.mascotFeedback.textContent = res.overallFeedback;
  
  // Render breakdown
  elements.resultsBreakdownList.innerHTML = '';
  
  state.quizData.questions.forEach(q => {
    // Find grading for this question
    const itemGrading = res.breakdown.find(b => b.questionId === q.id) || {
      isCorrect: false,
      studentAnswer: state.studentAnswers[q.id] || '(No Answer)',
      correctAnswer: q.correctAnswer,
      explanation: 'No feedback generated.'
    };
    
    const card = document.createElement('div');
    card.className = `breakdown-item ${itemGrading.isCorrect ? 'correct' : 'incorrect'}`;
    
    // Header row
    const metaRow = document.createElement('div');
    metaRow.className = 'breakdown-q-meta';
    
    const num = document.createElement('span');
    num.className = 'breakdown-q-num';
    num.textContent = `Question ${q.id}`;
    
    const badge = document.createElement('span');
    badge.className = 'breakdown-status-badge';
    badge.innerHTML = itemGrading.isCorrect ? '🟢 Correct' : '🔴 Keep Learning';
    
    metaRow.appendChild(num);
    metaRow.appendChild(badge);
    
    // Question Text
    const qText = document.createElement('div');
    qText.className = 'breakdown-question-text';
    qText.textContent = q.questionText;
    
    // Answers grid
    const answersGrid = document.createElement('div');
    answersGrid.className = 'breakdown-answers';
    
    const studCard = document.createElement('div');
    studCard.className = 'answer-card student';
    studCard.innerHTML = `<div class="label">Your Answer</div><div class="val">${itemGrading.studentAnswer || '(Empty)'}</div>`;
    
    const corrCard = document.createElement('div');
    corrCard.className = 'answer-card correct-val';
    corrCard.innerHTML = `<div class="label">Correct Answer</div><div class="val">${itemGrading.correctAnswer}</div>`;
    
    answersGrid.appendChild(studCard);
    answersGrid.appendChild(corrCard);
    
    // Explanation
    const expl = document.createElement('div');
    expl.className = 'breakdown-explanation';
    expl.innerHTML = `<div class="label">Teacher Sparky explains:</div><div>${itemGrading.explanation}</div>`;
    
    card.appendChild(metaRow);
    card.appendChild(qText);
    card.appendChild(answersGrid);
    card.appendChild(expl);
    
    elements.resultsBreakdownList.appendChild(card);
  });
}

// Confetti effects
function triggerConfetti(particleCount) {
  if (window.confetti) {
    window.confetti({
      particleCount: particleCount,
      spread: 70,
      origin: { y: 0.6 }
    });
  }
}

// Restart quiz creation flow
function resetQuizFlow() {
  state.quizData = null;
  state.currentQuestionIndex = 0;
  state.studentAnswers = {};
  state.gradingResult = null;
  state.uploadedImages = [];
  
  // Clear file inputs and preview grids
  elements.imageInput.value = '';
  renderPreviews();
  updateGenerateButtonState();
  
  // Clear inputs
  elements.textAnswer.value = '';
  elements.textareaAnswer.value = '';
  
  navigateToStep('step-upload');
}
