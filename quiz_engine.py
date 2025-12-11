from typing import Dict, Optional

Question = Dict[str, object]

# Тестовый вопрос для разработки
SAMPLE_QUESTION = {
    "id": 1,
    "text": "Столица Франции?",
    "options": ["Париж", "Лондон", "Берлин", "Мадрид"],
    "correct_index": 0,  # Париж - правильный ответ
    "difficulty": 1      # Легкий вопрос
}

def generate_question() -> Optional[Question]:
    """Заглушка для генерации вопроса"""
    return SAMPLE_QUESTION

def calculate_score(correct: bool, time_left: float, difficulty: int) -> int:
    """Заглушка для подсчета очков"""
    if not correct:
        return 0
    return 10  # Базовые очки за правильный ответ