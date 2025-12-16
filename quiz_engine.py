from typing import Dict, Optional, List
import json
import os
from flask import current_app

Question = Dict[str, object]


def _load_questions() -> List[Question]:
    # load from data/questions.json if available
    try:
        if current_app:
            base = os.path.join(current_app.root_path, "data")
        else:
            base = os.path.join(os.path.dirname(__file__), "data")
        path = os.path.join(base, "questions.json")
        if os.path.exists(path):
            with open(path, "r", encoding="utf-8") as f:
                data = json.load(f)
                if isinstance(data, list) and len(data) > 0:
                    return data
    except Exception as e:
        print(f"Error loading questions: {e}")
    # fallback: return all 5 sample questions
    return [
        {
            "id": 1,
            "text": "Столица Франции?",
            "options": ["Париж", "Лондон", "Берлин", "Мадрид"],
            "correct_index": 0,
            "difficulty": 1,
        },
        {
            "id": 2,
            "text": "Сколько планет в Солнечной системе?",
            "options": ["7", "8", "9", "10"],
            "correct_index": 1,
            "difficulty": 2,
        },
        {
            "id": 3,
            "text": "Какой язык программирования используется для Flask?",
            "options": ["Java", "Python", "C#", "Ruby"],
            "correct_index": 1,
            "difficulty": 1,
        },
        {
            "id": 4,
            "text": "Сколько секунд в минуте?",
            "options": ["60", "100", "30", "120"],
            "correct_index": 0,
            "difficulty": 1,
        },
        {
            "id": 5,
            "text": "Какая планета ближе всего к Солнцу?",
            "options": ["Венера", "Земля", "Меркурий", "Марс"],
            "correct_index": 2,
            "difficulty": 2,
        },
    ]


def get_all_questions() -> List[Question]:
    try:
        return _load_questions()
    except Exception:
        return _load_questions()


def get_question_by_id(qid: int) -> Optional[Question]:
    for q in get_all_questions():
        if q.get("id") == qid:
            return q
    return None


def next_question(current_id: int) -> Optional[Question]:
    qs = get_all_questions()
    for i, q in enumerate(qs):
        if q.get("id") == current_id:
            if i + 1 < len(qs):
                return qs[i + 1]
            return None
    return qs[0] if qs else None


def calculate_score(correct: bool, time_left: float, difficulty: int, combo: int = 0) -> int:
    """Простая формула: 10 * difficulty + time_bonus + combo_bonus"""
    if not correct:
        return 0
    base = 10 * max(1, int(difficulty))
    # time_left is seconds remaining up to 10
    time_bonus = int(max(0, min(10.0, time_left)) * 2)  # up to 20
    combo_bonus = int(combo) * 5
    return base + time_bonus + combo_bonus
