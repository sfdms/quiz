// app.js для спринтов 1–2
console.log('app.js загружен');

const startForm = document.querySelector('#start-form');
const nicknameInput = document.querySelector('#nickname');

let currentQuestion = null;
let timeLimit = 10; // сек
let timerId = null;
let timeLeft = 0;
let locked = false;
let started = false;

function renderQuestion(q) {
    if (!q) return;
    currentQuestion = q;
    
    // Найти или создать контейнер игры
    const gameEl = document.querySelector('.game-container') || (() => {
        const el = document.createElement('div');
        el.className = 'game-container';
        startForm.parentElement.appendChild(el);
        return el;
    })();
    
    // Скрыть форму старта
    if (startForm) startForm.style.display = 'none';
    
    // Собрать UI вопроса
    let html = `<h2>${q.text}</h2>`;
    html += '<div class="options">';
    q.options.forEach((opt, idx) => {
        html += `<button class="option" data-idx="${idx}">${opt}</button>`;
    });
    html += '</div>';
    html += '<div class="timer">10</div>';
    
    gameEl.innerHTML = html;
    gameEl.style.display = 'block';
    
    // Подвешиваем клики на кнопки
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
            onAnswer(-1); // истек таймер
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
    
    const data = await res.json();
    console.log('Game started:', data);
    
    // Загружаем вопросы
    try {
        const qRes = await fetch('/data/questions.json');
        if (!qRes.ok) throw new Error('Не удалось загрузить вопросы');
        const questions = await qRes.json();
        console.log('Loaded questions:', questions.length);
        
        // Показываем первый вопрос
        if (questions.length > 0) {
            renderQuestion(questions[0]);
            timeLimit = 10;
            startTimer(timeLimit);
        } else {
            alert('Нет вопросов');
        }
    } catch (e) {
        console.error('Error loading questions:', e);
        alert('Ошибка загрузки вопросов');
    }
}

async function onAnswer(selectedIdx) {
    if (locked) return;
    locked = true;
    clearInterval(timerId);
    
    // Блокируем кнопки
    document.querySelectorAll('.option').forEach(btn => btn.disabled = true);
    
    const payload = {
        question_id: currentQuestion?.id,
        answer: selectedIdx,
        time_left: Math.round(timeLeft * 10) / 10
    };
    
    console.log('Submitting answer:', payload);
    
    try {
        const res = await fetch('/api/submit_answer', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        if (!res.ok) throw new Error('Ошибка ответа');
        
        const data = await res.json();
        console.log('Answer response:', data);
        
        // Показываем результат
        const gameEl = document.querySelector('.game-container');
        const resultDiv = document.createElement('div');
        resultDiv.className = 'result';
        resultDiv.textContent = data.correct ? `✓ Верно! +${data.score}` : `✗ Неверно. +0`;
        gameEl.appendChild(resultDiv);
        
        // Если есть следующий вопрос
        if (data.next_question && data.next_question.id) {
            console.log('Next question:', data.next_question);
            await new Promise(resolve => setTimeout(resolve, 1200));
            locked = false;
            renderQuestion(data.next_question);
            timeLimit = 10;
            startTimer(timeLimit);
        } else {
            // Игра закончена
            console.log('Game ended');
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
