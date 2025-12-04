import os
import sqlite3
from flask import g, current_app


def get_db():
    if "db" not in g:
        database_path = current_app.config.get("DATABASE") or os.path.join(current_app.root_path, "quiz.db")
        g.db = sqlite3.connect(database_path, detect_types=sqlite3.PARSE_DECLTYPES)
        g.db.row_factory = sqlite3.Row
    return g.db


def close_db(e=None):
    db = g.pop("db", None)
    if db is not None:
        db.close()


def init_db():
    database_path = current_app.config.get("DATABASE") or os.path.join(current_app.root_path, "quiz.db")
    # ensure directory exists (project root should exist)
    dirpath = os.path.dirname(database_path)
    if dirpath:
        os.makedirs(dirpath, exist_ok=True)
    db = sqlite3.connect(database_path)
    with open(os.path.join(current_app.root_path, "schema.sql"), "r", encoding="utf-8") as f:
        db.executescript(f.read())
    db.commit()
    db.close()


def init_app(app):
    app.teardown_appcontext(close_db)
