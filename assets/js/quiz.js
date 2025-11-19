const urlParams = new URLSearchParams(window.location.search);
const role = urlParams.get('role') || 'cc';
const setNum = urlParams.get('set') || '1';

document.getElementById('quiz-title').innerText = `${role.toUpperCase()} - Set ${setNum}`;

let questions = [];
let currentQuestionIndex = 0;
let score = 0;
let userAnswers = {}; // Store answers to keep state when going back/forth

// 1. Fetch Data
fetch(`data/${role}/set${setNum}.json`)
    .then(response => {
        if (!response.ok) throw new Error("Set not found");
        return response.json();
    })
    .then(data => {
        questions = data;
        initQuiz();
    })
    .catch(err => {
        document.getElementById('question-text').innerText = "Error: Question set not found. Please ensure data/set file exists.";
        console.error(err);
    });

function initQuiz() {
    document.getElementById('q-progress').innerText = `Question 1/${questions.length}`;
    loadQuestion(0);
}

function loadQuestion(index) {
    const q = questions[index];
    const qText = document.getElementById('question-text');
    const optContainer = document.getElementById('options-container');
    const prevBtn = document.getElementById('btn-prev');
    const nextBtn = document.getElementById('btn-next');

    // Update UI
    qText.innerText = `${index + 1}. ${q.question}`;
    optContainer.innerHTML = '';
    document.getElementById('q-progress').innerText = `Question ${index + 1}/${questions.length}`;
    
    // Update Progress Bar
    const percent = ((index + 1) / questions.length) * 100;
    document.getElementById('progress-bar').style.width = `${percent}%`;

    // Render Options
    q.options.forEach((opt, i) => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.innerText = opt;
        
        // If user already answered this question, highlight it
        if (userAnswers[index] !== undefined) {
            if (i === q.answer) btn.classList.add('correct');
            else if (i === userAnswers[index]) btn.classList.add('wrong');
            btn.disabled = true; // Lock answers if reviewing
        } else {
            btn.onclick = () => selectAnswer(index, i, btn);
        }
        optContainer.appendChild(btn);
    });

    // Nav Button States
    prevBtn.disabled = index === 0;
    if (index === questions.length - 1) {
        nextBtn.innerText = "Finish";
    } else {
        nextBtn.innerText = "Next";
    }
}

function selectAnswer(qIndex, optionIndex, btnElement) {
    // Prevent re-answering
    if (userAnswers[qIndex] !== undefined) return;

    userAnswers[qIndex] = optionIndex;
    const correctIndex = questions[qIndex].answer;
    const allOpts = document.querySelectorAll('.option-btn');

    if (optionIndex === correctIndex) {
        btnElement.classList.add('correct');
        score++;
    } else {
        btnElement.classList.add('wrong');
        // Highlight correct one
        allOpts[correctIndex].classList.add('correct');
    }

    // Update Score Tracker
    document.getElementById('score-tracker').innerText = `Score: ${score}`;
}

// Navigation Logic
document.getElementById('btn-prev').addEventListener('click', () => {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        loadQuestion(currentQuestionIndex);
    }
});

document.getElementById('btn-next').addEventListener('click', () => {
    if (currentQuestionIndex < questions.length - 1) {
        currentQuestionIndex++;
        loadQuestion(currentQuestionIndex);
    } else {
        showResults();
    }
});

function showResults() {
    document.getElementById('quiz-card').style.display = 'none';
    document.getElementById('quiz-controls').style.display = 'none';
    document.getElementById('result-card').style.display = 'block';
    
    document.getElementById('final-score').innerText = `${score} / ${questions.length}`;
    
    const percentage = (score / questions.length) * 100;
    const msg = document.getElementById('final-msg');
    
    if(percentage >= 80) msg.innerText = "Excellent Work!";
    else if(percentage >= 50) msg.innerText = "Good job, keep practicing.";
    else msg.innerText = "Keep studying, you can do it!";
}