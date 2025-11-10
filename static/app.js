console.log('app.js загружен');

// Находим элементы на странице
const startForm = document.querySelector('#start-form');
const nicknameInput = document.querySelector('#nickname');

// Тестовый вопрос для разработки
const testQuestion = {
    id: 1,
    text: "Столица Франции?",
    options: ["Париж", "Лондон", "Берлин", "Мадрид"]
};
// Покажем тестовый вопрос в консоли при загрузке (критерий приёмки для Sprint 1)
console.log('Тестовый вопрос:', testQuestion);

// Функция для отображения вопроса
function showQuestion(question) {
    // Создаем элементы для вопроса
    const questionDiv = document.createElement('div');
    questionDiv.className = 'question-container';
    
    // Добавляем текст вопроса
    const questionText = document.createElement('h2');
    questionText.textContent = question.text;
    questionDiv.appendChild(questionText);
    
    // Создаем контейнер для вариантов ответа
    const optionsDiv = document.createElement('div');
    optionsDiv.className = 'options';
    
    // Добавляем варианты ответов
    question.options.forEach((option, index) => {
        const button = document.createElement('button');
        button.textContent = option;
        button.onclick = () => onSelectOption(index);
        optionsDiv.appendChild(button);
    });
    
    questionDiv.appendChild(optionsDiv);
    
    // Заменяем форму на вопрос
    const container = startForm.parentElement;
    container.replaceChild(questionDiv, startForm);
}

// Обработчик отправки формы
startForm.addEventListener('submit', function(event) {
    event.preventDefault(); // Предотвращаем отправку формы
    const nickname = nicknameInput.value.trim();
    
    if (nickname) {
        console.log('Введен никнейм:', nickname);
        // Показываем тестовый вопрос
        showQuestion(testQuestion);
    }
});

// Обработка выбора варианта — показываем результат inline
function onSelectOption(selectedIndex) {
    // Найдем контейнер с вариантами (последняя вставленная .options на странице)
    const optionsDiv = document.querySelector('.options');
    if (!optionsDiv) return;

    // Отключаем все кнопки и подсвечиваем правильно/неправильно
    const buttons = Array.from(optionsDiv.querySelectorAll('button'));
    const correctIndex = testQuestion.options.indexOf('Париж') >= 0 ? 0 : 0; // корректный индекс для теста

    buttons.forEach((btn, idx) => {
        // блокируем кнопку
        btn.disabled = true;
        if (idx === correctIndex) {
            btn.classList.add('correct');
        }
        if (idx === selectedIndex && idx !== correctIndex) {
            btn.classList.add('wrong');
        }
    });

    // Показываем текстовый результат под вариантами
    let resultText = document.querySelector('.result-text');
    if (!resultText) {
        resultText = document.createElement('div');
        resultText.className = 'result-text';
        optionsDiv.parentElement.appendChild(resultText);
    }

    if (selectedIndex === correctIndex) {
        resultText.textContent = 'Верно!';
        resultText.classList.remove('wrong');
        resultText.classList.add('correct');
    } else {
        const correctAnswer = buttons[correctIndex]?.textContent || '—';
        resultText.textContent = 'Неверно — правильный ответ: ' + correctAnswer;
        resultText.classList.remove('correct');
        resultText.classList.add('wrong');
    }
}