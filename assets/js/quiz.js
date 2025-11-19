checkSession(); // Ensure logged in

const params = new URLSearchParams(window.location.search);
const role = params.get('role') || 'cc';
const setNum = params.get('set') || '1';

document.getElementById('set-title').innerText = `${role.toUpperCase()} - Set ${setNum}`;

let questions = [];
let userAnswers = [];
let currIndex = 0;
let timerInterval;
let totalSeconds = 0;
let isQuizActive = true;


fetch(`data/${role}/set${setNum}.json`)
    .then(r => r.json())
    .then(data => {
      
        questions = shuffleArray(data);
        
        userAnswers = new Array(questions.length).fill(null);
        document.getElementById('total-q').innerText = questions.length;
        
   
        totalSeconds = questions.length * 30;
        startTimer();

        initPagination();
        loadQuestion(0);
    })
    .catch(err => {
        document.getElementById('question-text').innerText = "Error: Set file not found.";
    });


function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}


function startTimer() {
    updateTimerUI();
    timerInterval = setInterval(() => {
        totalSeconds--;
        updateTimerUI();
        if(totalSeconds <= 0) {
            clearInterval(timerInterval);
            finishQuiz(true); 
        }
    }, 1000);
}

function updateTimerUI() {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    document.getElementById('timer-display').innerText = `${m}:${s < 10 ? '0'+s : s}`;
    if(totalSeconds < 60) document.getElementById('timer-display').style.color = 'red';
}


function loadQuestion(idx) {
    currIndex = idx;
    const q = questions[idx];
    
    document.getElementById('curr-num').innerText = idx + 1;
    document.getElementById('question-text').innerText = q.question;
    
    const area = document.getElementById('options-area');
    area.innerHTML = '';
    
    q.options.forEach((opt, i) => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.innerText = `${String.fromCharCode(65+i)}. ${opt}`;
        if(userAnswers[idx] === i) btn.classList.add('selected');
        
        btn.onclick = () => {
            userAnswers[idx] = i;
            document.getElementById('solved-count').innerText = userAnswers.filter(x=>x!==null).length;
            loadQuestion(idx);
        };
        area.appendChild(btn);
    });

    document.getElementById('btn-prev').disabled = (idx === 0);
    document.getElementById('btn-next').innerText = (idx === questions.length - 1) ? "Submit" : "Next";
    
    updatePagination();
}

function initPagination() {
    const grid = document.getElementById('num-grid');
    questions.forEach((_, i) => {
        const d = document.createElement('div');
       
        d.style.cssText = "width:30px; height:30px; background:#e2e8f0; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:0.8rem; cursor:pointer; color:#64748b;";
        d.innerText = i + 1;
        d.id = `pg-${i}`;
        d.onclick = () => loadQuestion(i);
        grid.appendChild(d);
    });
}

function updatePagination() {
    questions.forEach((_, i) => {
        const el = document.getElementById(`pg-${i}`);
        el.style.background = '#e2e8f0'; el.style.color = '#64748b';
        if(userAnswers[i] !== null) { el.style.background = '#93c5fd'; el.style.color = '#1e3a8a'; }
        if(i === currIndex) { el.style.background = '#2563eb'; el.style.color = '#ffffff'; }
    });
}


document.getElementById('btn-next').onclick = () => nextQ();
document.getElementById('btn-prev').onclick = () => prevQ();

function nextQ() {
    if(currIndex < questions.length - 1) loadQuestion(currIndex + 1);
    else finishQuiz();
}
function prevQ() {
    if(currIndex > 0) loadQuestion(currIndex - 1);
}


function finishQuiz(auto=false) {
    if(!auto && !confirm("Are you sure you want to submit?")) return;

    isQuizActive = false; 
    clearInterval(timerInterval);
    
    document.getElementById('quiz-ui').style.display = 'none';
    document.getElementById('result-ui').style.display = 'block';
    
    // Hide header extras
    document.querySelector('.header-center').style.display = 'none'; 

    let score = 0;
    const list = document.getElementById('review-list');
    list.innerHTML = '';

    questions.forEach((q, i) => {
        const userIdx = userAnswers[i];
        const correctIdx = q.answer;
        const isCorrect = (userIdx === correctIdx);
        if(isCorrect) score++;

        const div = document.createElement('div');
        div.className = `review-card ${isCorrect ? 'correct' : 'wrong'}`;
        div.innerHTML = `
            <p><strong>Q${i+1}: ${q.question}</strong></p>
            <p>Your Answer: ${userIdx !== null ? q.options[userIdx] : 'Skipped'} ${isCorrect ? '✅' : '❌'}</p>
            ${!isCorrect ? `<p style="color:#16a34a">Correct: ${q.options[correctIdx]}</p>` : ''}
            <div style="margin-top:8px; font-size:0.9rem; color:#555;"><em>💡 ${q.explanation || 'No explanation.'}</em></div>
        `;
        list.appendChild(div);
    });

    document.getElementById('score-val').innerText = `${score} / ${questions.length}`;
    const pct = (score / questions.length) * 100;
    const msg = document.getElementById('pass-fail-text');
    
    if(pct >= 60) { msg.innerText = "Congratulations! You Passed"; msg.style.color = "#16a34a"; }
    else { msg.innerText = "You did not pass"; msg.style.color = "#dc2626"; }
}

// --- HELP & EXIT ---
function confirmExit() {
    if(isQuizActive) {
        if(confirm("Quit Quiz? Your progress will be lost.")) window.location.href = "dashboard.html";
    } else {
        window.location.href = "dashboard.html";
    }
}

function openHelp() { document.getElementById('help-modal').classList.add('show'); }
function closeHelp() { document.getElementById('help-modal').classList.remove('show'); }

window.onbeforeunload = function() { if(isQuizActive) return "Progress will be lost."; };