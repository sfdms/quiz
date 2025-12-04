from flask import Flask, render_template, jsonify, request, session
from db import init_db, get_db, init_app as init_db_app
import quiz_engine
import os


def create_app() -> Flask:
    app = Flask(__name__)
    app.config["SECRET_KEY"] = "dev-secret-key-change-me"
    app.config.setdefault("DATABASE", os.path.join(app.root_path, "quiz.db"))

    @app.cli.command("init-db")
    def init_db_command():
        """Создать файл базы данных по schema.sql"""
        init_db()
        print("Initialized the database.")

    # register db teardown
    init_db_app(app)

    @app.route("/")
    def index():
        return render_template("index.html")

    @app.route("/rules")
    def rules():
        return render_template("rules.html")

    @app.route("/api/start", methods=["POST"])
    def api_start():
        data = request.get_json() or {}
        nickname = data.get("nickname")
        if not nickname:
            return jsonify({"error": "nickname required"}), 400

        db = get_db()
        cur = db.execute("SELECT id FROM users WHERE nickname = ?", (nickname,))
        row = cur.fetchone()
        if row:
            user_id = row["id"]
        else:
            cur = db.execute("INSERT INTO users (nickname) VALUES (?)", (nickname,))
            db.commit()
            user_id = cur.lastrowid

        # create a game session
        cur = db.execute("INSERT INTO game_sessions (user_id, score) VALUES (?, 0)", (user_id,))
        db.commit()
        session["user_id"] = user_id
        session["total_score"] = 0
        session["combo"] = 0

        return jsonify({"user_id": user_id})

    @app.route("/api/leaderboard", methods=["GET"])
    def api_leaderboard():
        db = get_db()
        cur = db.execute(
            "SELECT u.nickname, gs.score, gs.created_at FROM users u JOIN game_sessions gs ON u.id = gs.user_id ORDER BY gs.score DESC, gs.created_at ASC LIMIT 10"
        )
        rows = cur.fetchall()
        result = []
        for r in rows:
            result.append({"nickname": r["nickname"], "score": r["score"]})
        return jsonify({"leaderboard": result})


    @app.route('/data/questions.json')
    def serve_questions():
        # serve questions file for client-side
        import os, json
        path = os.path.join(app.root_path, 'data', 'questions.json')
        if not os.path.exists(path):
            return jsonify([])
        with open(path, 'r', encoding='utf-8') as f:
            return app.response_class(f.read(), mimetype='application/json')

    @app.route("/api/submit_answer", methods=["POST"])
    def api_submit_answer():
        payload = request.get_json() or {}
        user_id = session.get("user_id")
        if not user_id:
            return jsonify({"error": "not logged in"}), 401

        question_id = payload.get("question_id")
        answer_index = payload.get("answer")
        try:
            time_left = float(payload.get("time_left", 0))
        except Exception:
            time_left = 0.0

        question = quiz_engine.get_question_by_id(question_id)
        if not question:
            return jsonify({"error": "question not found"}), 404

        correct = (answer_index == question.get("correct_index"))
        combo = session.get("combo", 0)
        if correct:
            combo += 1
        else:
            combo = 0

        gained = quiz_engine.calculate_score(correct, time_left, question.get("difficulty", 1), combo)
        total = session.get("total_score", 0) + gained
        session["total_score"] = total
        session["combo"] = combo

        # persist to latest game_session for this user
        db = get_db()
        cur = db.execute("SELECT id, score FROM game_sessions WHERE user_id = ? ORDER BY created_at DESC LIMIT 1", (user_id,))
        gs = cur.fetchone()
        if gs:
            new_score = gs["score"] + gained
            db.execute("UPDATE game_sessions SET score = ? WHERE id = ?", (new_score, gs["id"]))
            db.commit()

        # prepare next question (simple sequential)
        next_q = quiz_engine.next_question(question_id)

        return jsonify({
            "correct": correct,
            "score": gained,
            "total_score": total,
            "combo": combo,
            "next_question": next_q,
        })

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)), debug=True)
