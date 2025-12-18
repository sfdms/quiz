from flask import Flask, render_template
from db import init_db


def create_app() -> Flask:
    app = Flask(__name__)
    app.config["SECRET_KEY"] = "dev-secret-key-change-me"

    @app.cli.command("init-db")
    def init_db_command():
        """Создать файл базы данных по schema.sql"""
        init_db()
        print("Initialized the database.")

    @app.route("/")
    def index():
        return render_template("index.html")

    @app.route("/rules")
    def rules():
        return render_template("rules.html")

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(debug=True)
