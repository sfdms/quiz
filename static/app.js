console.log('app.js загружен');

const startForm = document.querySelector('#start-form');
const nicknameInput = document.querySelector('#nickname');

let currentQuestion = null;
let timeLimit = 10;
let timerId = null;
let timeLeft = 0;
let locked = false;
let started = false;
let questions = [];
let currentQuestionIndex = 0;

function renderQuestion(q) {
    if (!q) return;
    currentQuestion = q;
    
    const gameEl = document.querySelector('.game-container') || (() => {
        const el = document.createElement('div');
        el.className = 'game-container';
        document.querySelector('.container').appendChild(el);
        return el;
    })();
    
    if (startForm) startForm.style.display = 'none';
    
    let html = `<h2>${q.text}</h2>`;
    html += '<div class="options">';
    q.options.forEach((opt, idx) => {
        html += `<button class="option" data-idx="${idx}">${opt}</button>`;
    });
    html += '</div>';
    html += '<div class="timer">10</div>';
    
    gameEl.innerHTML = html;
    gameEl.style.display = 'block';
    
    document.querySelectorAll('.option').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const idx = parseInt(e.target.dataset.idx, 10);
            onAnswer(idx);
        });
    });
}

function startTimer(limitSec) {
    clearInterval(timerId);
    timeLeft = limitSec;
    updateTimerDisplay();
    timerId = setInterval(() => {
        timeLeft = Math.max(0, timeLeft - 0.1);
        updateTimerDisplay();
        if (timeLeft <= 0) {
            clearInterval(timerId);
            onAnswer(-1);
        }
    }, 100);
}

function updateTimerDisplay() {
    const timerEl = document.querySelector('.timer');
    if (timerEl) {
        timerEl.textContent = Math.ceil(timeLeft);
    }
}

async function startGame(nickname) {
    const res = await fetch('/api/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname })
    });
    
    if (!res.ok) {
        alert('Ошибка старта игры');
        started = false;
        const btn = startForm?.querySelector('button');
        if (btn) btn.disabled = false;
        if (nicknameInput) nicknameInput.disabled = false;
        return;
    }
    
    try {
        const qRes = await fetch('/data/questions.json');
        if (!qRes.ok) throw new Error('Не удалось загрузить вопросы');
        questions = await qRes.json();
        
        if (questions.length > 0) {
            currentQuestionIndex = 0;
            renderQuestion(questions[0]);
            startTimer(timeLimit);
        } else {
            alert('Нет вопросов');
        }
    } catch (e) {
        console.error('Error loading questions:', e);
        alert('Ошибка загрузки вопросов');
        started = false;
    }
}

async function onAnswer(selectedIdx) {
    if (locked) return;
    locked = true;
    clearInterval(timerId);
    
    document.querySelectorAll('.option').forEach(btn => btn.disabled = true);
    
    const payload = {
        question_id: currentQuestion?.id,
        answer: selectedIdx,
        time_left: Math.round(timeLeft * 10) / 10
    };
    
    try {
        const res = await fetch('/api/submit_answer', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        if (!res.ok) throw new Error('Ошибка ответа');
        
        const data = await res.json();
        
        const gameEl = document.querySelector('.game-container');
        const resultDiv = document.createElement('div');
        resultDiv.className = data.correct ? 'result correct' : 'result wrong';
        resultDiv.textContent = data.correct ? `✓ Верно! +${data.score}` : `✗ Неверно. +0`;
        gameEl.appendChild(resultDiv);
        
        if (data.next_question && data.next_question.id) {
            await new Promise(resolve => setTimeout(resolve, 1200));
            locked = false;
            currentQuestionIndex++;
            renderQuestion(data.next_question);
            startTimer(timeLimit);
        } else {
            await new Promise(resolve => setTimeout(resolve, 1200));
            gameEl.innerHTML = '<div class="end-message">Игра окончена! Результат сохранён.</div>';
            await refreshLeaderboard();
        }
    } catch (e) {
        console.error('Answer error:', e);
        locked = false;
    }
}

async function refreshLeaderboard() {
    try {
        const res = await fetch('/api/leaderboard');
        if (!res.ok) return;
        
        const data = await res.json();
        const leaders = data.leaderboard || [];
        
        const leaderboardContainer = document.querySelector('.leaderboard-container');
        if (leaderboardContainer) {
            leaderboardContainer.style.display = 'block';
        }
        
        const tbody = document.querySelector('.leaderboard-table tbody');
        if (!tbody) return;
        
        if (leaders.length === 0) {
            tbody.innerHTML = '<tr><td colspan="3">Пока нет результатов</td></tr>';
        } else {
            tbody.innerHTML = leaders.map((row, idx) => `
                <tr>
                    <td>${idx + 1}</td>
                    <td>${row.nickname}</td>
                    <td>${row.score}</td>
                </tr>
            `).join('');
        }
    } catch (e) {
        console.warn('Leaderboard error:', e);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('#start-form');
    const input = document.querySelector('#nickname');
    
    if (form && input) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            if (started) return;
            
            const nick = input.value?.trim();
            if (!nick) {
                alert('Введите никнейм');
                return;
            }
            
            started = true;
            const btn = form.querySelector('button');
            if (btn) {
                btn.disabled = true;
                btn.textContent = 'Идёт игра...';
            }
            input.disabled = true;
            
            startGame(nick);
        });
    }
});

