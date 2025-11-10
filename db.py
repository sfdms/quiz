import os
import sqlite3
from flask import g


def get_db():
    if "db" not in g:
        g.db = sqlite3.connect("quiz.db", detect_types=sqlite3.PARSE_DECLTYPES)
        g.db.row_factory = sqlite3.Row
    return g.db


def close_db(e=None):
    db = g.pop("db", None)
    if db is not None:
        db.close()


def init_db():
    db = sqlite3.connect("quiz.db")
    with open("schema.sql", "r", encoding="utf-8") as f:
        db.executescript(f.read())
    db.commit()
    db.close()
