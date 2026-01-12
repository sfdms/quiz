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
    
    // Проверяем и нормализуем формат вопроса
    if (!q.id && q.question_id) {
        q.id = q.question_id;
    }
    
    // Убеждаемся что вопрос имеет необходимые поля
    if (!q.text || !q.options || !Array.isArray(q.options)) {
        console.error('Некорректный формат вопроса:', q);
        return;
    }
    
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
    
    // Переподключаем обработчики кликов для новых кнопок
    document.querySelectorAll('.option').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const idx = parseInt(e.target.dataset.idx, 10);
            onAnswer(idx);
        });
    });
    
    console.log('Вопрос загружен:', q);
}

function startTimer(limitSec) {
    clearInterval(timerId);
    timeLeft = limitSec;
    updateTimerDisplay();
    timerId = setInterval(() => {
        timeLeft = Math.max(0, timeLeft - 0.1);
        updateTimerDisplay();
        
        // При time_left = 0 автоматически вызываем submitAnswer с time_left=0
        if (timeLeft <= 0) {
            clearInterval(timerId);
            // Вызываем onAnswer с -1 (timeout), это означает что время истекло
            console.log('Время вышло, отправляем ответ с time_left=0');
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
    // Блокировка повторных кликов
    if (locked) return;
    locked = true;
    clearInterval(timerId);
    
    document.querySelectorAll('.option').forEach(btn => btn.disabled = true);
    
    // Проверяем наличие question_id в currentQuestion
    if (!currentQuestion || currentQuestion.id === undefined) {
        console.error('Question не содержит id');
        locked = false;
        return;
    }
    
    const payload = {
        question_id: currentQuestion.id,
        answer: selectedIdx,
        time_left: Math.round(timeLeft * 10) / 10
    };
    
    console.log('Отправляем ответ:', payload);
    
    try {
        // Вызов реального API сервера
        const res = await fetch('/api/submit_answer', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        if (!res.ok) {
            console.error('Ошибка HTTP:', res.status);
            throw new Error('Ошибка ответа');
        }
        
        const data = await res.json();
        console.log('Ответ сервера:', data);
        
        // Получаем gained_score и total_score от сервера
        const gainedScore = data.score || 0;
        const totalScore = data.total_score || 0;
        
        const gameEl = document.querySelector('.game-container');
        const resultDiv = document.createElement('div');
        resultDiv.className = data.correct ? 'result correct' : 'result wrong';
        
        // Показываем gained_score и total_score в UI
        const resultText = data.correct 
            ? `✓ Верно! +${gainedScore} очков (Всего: ${totalScore})`
            : `✗ Неверно. +0 очков (Всего: ${totalScore})`;
        resultDiv.textContent = resultText;
        gameEl.appendChild(resultDiv);
        
        if (data.next_question && data.next_question.id) {
            await new Promise(resolve => setTimeout(resolve, 1200));
            locked = false;
            currentQuestionIndex++;
            renderQuestion(data.next_question);
            startTimer(timeLimit);
        } else {
            await new Promise(resolve => setTimeout(resolve, 1200));
            gameEl.innerHTML = `<div class="end-message">Игра окончена! Ваш результат: ${totalScore} очков</div>`;
            await refreshLeaderboard(true);
        }
    } catch (e) {
        console.error('Answer error:', e);
        locked = false;
    }
}

async function refreshLeaderboard(showContainer = false) {
    try {
        const res = await fetch('/api/leaderboard');
        if (!res.ok) return;
        
        const data = await res.json();
        const leaders = data.leaderboard || [];
        
        let leaderboardEl = document.querySelector('.leaderboard-table');
        if (!leaderboardEl) {
            leaderboardEl = document.createElement('div');
            leaderboardEl.className = 'leaderboard-table';
            document.querySelector('.game-container').appendChild(leaderboardEl);
        }
        
        let html = '<table><thead><tr><th>#</th><th>Никнейм</th><th>Очки</th></tr></thead><tbody>';
        if (leaders.length === 0) {
            html += '<tr><td colspan="3">Пока нет результатов</td></tr>';
        } else {
            leaders.forEach((row, idx) => {
                html += `<tr><td>${idx + 1}</td><td>${row.nickname}</td><td>${row.score}</td></tr>`;
            });
        }
        html += '</tbody></table>';
        leaderboardEl.innerHTML = html;
        
        // Показать контейнер лидерборда только если showContainer = true
        if (showContainer) {
            const container = document.querySelector('.leaderboard-container');
            if (container) container.style.display = 'block';
        }
    } catch (e) {
        console.warn('Leaderboard error:', e);
    }
}

// Обработчик формы
startForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    if (started) return;
    
    const nick = nicknameInput?.value?.trim();
    if (!nick) {
        alert('Введите никнейм');
        return;
    }
    
    started = true;
    const btn = startForm.querySelector('button');
    if (btn) {
        btn.disabled = true;
        btn.textContent = 'Идёт игра...';
    }
    if (nicknameInput) nicknameInput.disabled = true;
    
    startGame(nick);
});

// Лидерборд при загрузке
refreshLeaderboard();
