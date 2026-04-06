import ast
import hashlib
import json
import logging
import os
import re
import unicodedata
import secrets
import ssl
import threading
import time
from contextlib import contextmanager
from datetime import datetime, timedelta, timezone
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import parse_qs, urlparse
from urllib.request import Request, urlopen

import psycopg2
import psycopg2.errors
import psycopg2.extras


BASE_DIR = Path(__file__).resolve().parent
PUBLIC_DIR = BASE_DIR / "public"

# ── Chargement automatique du fichier .env ─────────────────────────────────────
_env_path = BASE_DIR / ".env"
if _env_path.exists():
    with open(_env_path, encoding="utf-8") as _f:
        for _line in _f:
            _line = _line.strip()
            if _line and not _line.startswith("#") and "=" in _line:
                _k, _, _v = _line.partition("=")
                os.environ.setdefault(_k.strip(), _v.strip())
PORT = int(os.environ.get("PORT", "3000"))
DATABASE_URL = os.environ.get("DATABASE_URL", "")
KNOWN_TOPICS = {"SYSLIN", "POLY", "FVAR", "FRAT"}
KNOWN_LEVELS = {"facile", "intermediaire", "avance"}
KNOWN_ROLES = {"student", "teacher"}
DEFAULT_TEACHER_CODE = "MATHMENTOR-PROF"
EMAIL_PATTERN = re.compile(r"^[A-Z0-9._%+\-]+@[A-Z0-9.\-]+\.[A-Z]{2,}$", re.IGNORECASE)
CLASS_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
SESSION_TTL_DAYS = 30
UPLOADS_DIR = BASE_DIR / "uploads"
ALLOWED_MIMETYPES = {
    "application/pdf", "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "image/png", "image/jpeg", "image/gif", "image/webp",
}
MAX_UPLOAD_SIZE = 20 * 1024 * 1024  # 20 Mo

# ── Fournisseurs IA ────────────────────────────────────────────────────────────
# Priorité : Ollama → Cerebras → SambaNova → Groq → OpenRouter → Gemini → erreur
OLLAMA_HOST         = os.environ.get("OLLAMA_HOST",         "http://localhost:11434")
OLLAMA_MODEL        = os.environ.get("OLLAMA_MODEL",        "llama3.2:3b")
CEREBRAS_API_KEY    = os.environ.get("CEREBRAS_API_KEY",    "")
CEREBRAS_MODEL      = os.environ.get("CEREBRAS_MODEL",      "llama-3.3-70b")
SAMBANOVA_API_KEY   = os.environ.get("SAMBANOVA_API_KEY",   "")
SAMBANOVA_MODEL     = os.environ.get("SAMBANOVA_MODEL",     "Meta-Llama-3.3-70B-Instruct")
GROQ_API_KEY        = os.environ.get("GROQ_API_KEY",        "")
GROQ_MODEL          = os.environ.get("GROQ_MODEL",          "llama-3.1-8b-instant")
OPENROUTER_API_KEY  = os.environ.get("OPENROUTER_API_KEY",  "")
OPENROUTER_MODEL    = os.environ.get("OPENROUTER_MODEL",    "meta-llama/llama-3.3-70b-instruct:free")
GEMINI_API_KEY      = os.environ.get("GEMINI_API_KEY",      "")
GEMINI_MODEL        = os.environ.get("GEMINI_MODEL",        "gemini-1.5-flash")

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("mathmentor")

# Rate limiting : max AI_RATE_LIMIT requêtes par AI_RATE_WINDOW secondes par utilisateur
AI_RATE_LIMIT = 200
AI_RATE_WINDOW = 60
_rate_limit_lock = threading.Lock()
_ai_requests: dict[int, list[float]] = {}


def check_ai_rate_limit(user_id: int) -> bool:
    now = time.time()
    with _rate_limit_lock:
        timestamps = [t for t in _ai_requests.get(user_id, []) if now - t < AI_RATE_WINDOW]
        if len(timestamps) >= AI_RATE_LIMIT:
            _ai_requests[user_id] = timestamps
            return False
        timestamps.append(now)
        _ai_requests[user_id] = timestamps
        return True


def utc_now():
    return datetime.now(timezone.utc).isoformat()


@contextmanager
def db_connection():
    conn = psycopg2.connect(DATABASE_URL, cursor_factory=psycopg2.extras.RealDictCursor)
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def column_exists(connection, table_name, column_name):
    with connection.cursor() as cur:
        cur.execute(
            "SELECT 1 FROM information_schema.columns WHERE table_name=%s AND column_name=%s",
            (table_name, column_name)
        )
        return cur.fetchone() is not None


def init_db():
    UPLOADS_DIR.mkdir(exist_ok=True)

    with db_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS users (
                    id BIGSERIAL PRIMARY KEY,
                    name TEXT NOT NULL,
                    email TEXT NOT NULL UNIQUE,
                    password_hash TEXT NOT NULL,
                    created_at TEXT NOT NULL
                )
                """
            )
            cursor.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'student'")
            cursor.execute("UPDATE users SET role = 'student' WHERE role IS NULL OR role = ''")

            cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS sessions (
                    token TEXT PRIMARY KEY,
                    user_id BIGINT NOT NULL,
                    created_at TEXT NOT NULL,
                    FOREIGN KEY(user_id) REFERENCES users(id)
                )
                """
            )
            cursor.execute("ALTER TABLE sessions ADD COLUMN IF NOT EXISTS expires_at TEXT")
            cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS progress (
                    user_id BIGINT PRIMARY KEY,
                    viewed_exercises TEXT NOT NULL DEFAULT '[]',
                    favorite_exercises TEXT NOT NULL DEFAULT '[]',
                    generated_exercises TEXT NOT NULL DEFAULT '[]',
                    recent_questions TEXT NOT NULL DEFAULT '[]',
                    quiz_history TEXT NOT NULL DEFAULT '[]',
                    updated_at TEXT NOT NULL,
                    FOREIGN KEY(user_id) REFERENCES users(id)
                )
                """
            )
            cursor.execute("ALTER TABLE progress ADD COLUMN IF NOT EXISTS self_evaluations TEXT NOT NULL DEFAULT '{}'")
            cursor.execute("ALTER TABLE progress ADD COLUMN IF NOT EXISTS daily_activity TEXT NOT NULL DEFAULT '{}'")
            cursor.execute("ALTER TABLE progress ADD COLUMN IF NOT EXISTS chat_history TEXT NOT NULL DEFAULT '[]'")
            cursor.execute("ALTER TABLE progress ADD COLUMN IF NOT EXISTS earned_badges TEXT NOT NULL DEFAULT '{}'")
            cursor.execute("ALTER TABLE progress ADD COLUMN IF NOT EXISTS exercise_schedule TEXT NOT NULL DEFAULT '{}'")
            cursor.execute("ALTER TABLE progress ADD COLUMN IF NOT EXISTS topic_fail_counts TEXT NOT NULL DEFAULT '{}'")
            cursor.execute("ALTER TABLE progress ADD COLUMN IF NOT EXISTS learning_history TEXT NOT NULL DEFAULT '[]'")
            cursor.execute("ALTER TABLE progress ADD COLUMN IF NOT EXISTS error_history TEXT NOT NULL DEFAULT '[]'")
            cursor.execute("ALTER TABLE progress ADD COLUMN IF NOT EXISTS appearance TEXT NOT NULL DEFAULT '{}'")
            cursor.execute("ALTER TABLE progress ADD COLUMN IF NOT EXISTS grapher_state TEXT NOT NULL DEFAULT '{}'")
            cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS teacher_classes (
                    id BIGSERIAL PRIMARY KEY,
                    teacher_id BIGINT NOT NULL,
                    name TEXT NOT NULL,
                    code TEXT NOT NULL UNIQUE,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL,
                    FOREIGN KEY(teacher_id) REFERENCES users(id)
                )
                """
            )
            cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS class_memberships (
                    id BIGSERIAL PRIMARY KEY,
                    class_id BIGINT NOT NULL,
                    student_id BIGINT NOT NULL,
                    joined_at TEXT NOT NULL,
                    UNIQUE(class_id, student_id),
                    FOREIGN KEY(class_id) REFERENCES teacher_classes(id),
                    FOREIGN KEY(student_id) REFERENCES users(id)
                )
                """
            )
            cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS teacher_courses (
                    id BIGSERIAL PRIMARY KEY,
                    author_id BIGINT NOT NULL,
                    class_id BIGINT,
                    title TEXT NOT NULL,
                    topic_code TEXT NOT NULL,
                    semester TEXT NOT NULL,
                    objective TEXT NOT NULL,
                    focus TEXT NOT NULL DEFAULT '[]',
                    lessons TEXT NOT NULL DEFAULT '[]',
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL,
                    FOREIGN KEY(author_id) REFERENCES users(id),
                    FOREIGN KEY(class_id) REFERENCES teacher_classes(id)
                )
                """
            )
            cursor.execute("ALTER TABLE teacher_courses ADD COLUMN IF NOT EXISTS class_id BIGINT")

            cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS teacher_exercises (
                    id BIGSERIAL PRIMARY KEY,
                    author_id BIGINT NOT NULL,
                    class_id BIGINT,
                    title TEXT NOT NULL,
                    topic_code TEXT NOT NULL,
                    semester TEXT NOT NULL,
                    level TEXT NOT NULL,
                    duration TEXT NOT NULL,
                    statement TEXT NOT NULL,
                    correction TEXT NOT NULL DEFAULT '[]',
                    keywords TEXT NOT NULL DEFAULT '[]',
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL,
                    FOREIGN KEY(author_id) REFERENCES users(id),
                    FOREIGN KEY(class_id) REFERENCES teacher_classes(id)
                )
                """
            )
            cursor.execute("ALTER TABLE teacher_exercises ADD COLUMN IF NOT EXISTS class_id BIGINT")

            cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS self_evaluations (
                    id BIGSERIAL PRIMARY KEY,
                    user_id BIGINT NOT NULL,
                    exercise_id TEXT NOT NULL,
                    rating INTEGER NOT NULL,
                    created_at TEXT NOT NULL,
                    UNIQUE(user_id, exercise_id),
                    FOREIGN KEY(user_id) REFERENCES users(id)
                )
                """
            )

            cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS teacher_files (
                    id BIGSERIAL PRIMARY KEY,
                    author_id BIGINT NOT NULL,
                    class_id BIGINT,
                    title TEXT NOT NULL,
                    original_name TEXT NOT NULL,
                    stored_name TEXT NOT NULL,
                    mimetype TEXT NOT NULL,
                    size INTEGER NOT NULL,
                    created_at TEXT NOT NULL,
                    FOREIGN KEY(author_id) REFERENCES users(id),
                    FOREIGN KEY(class_id) REFERENCES teacher_classes(id)
                )
                """
            )
            cursor.execute("ALTER TABLE teacher_files ADD COLUMN IF NOT EXISTS class_id BIGINT")

            cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS refresh_tokens (
                    token TEXT PRIMARY KEY,
                    user_id BIGINT NOT NULL,
                    created_at TEXT NOT NULL,
                    expires_at TEXT NOT NULL,
                    FOREIGN KEY(user_id) REFERENCES users(id)
                )
                """
            )

            cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS notifications (
                    id BIGSERIAL PRIMARY KEY,
                    user_id BIGINT NOT NULL,
                    type TEXT NOT NULL,
                    message TEXT NOT NULL,
                    is_read INTEGER NOT NULL DEFAULT 0,
                    created_at TEXT NOT NULL,
                    FOREIGN KEY(user_id) REFERENCES users(id)
                )
                """
            )

            cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS teacher_devoirs (
                    id BIGSERIAL PRIMARY KEY,
                    teacher_id BIGINT NOT NULL,
                    class_id BIGINT NOT NULL,
                    title TEXT NOT NULL,
                    description TEXT NOT NULL DEFAULT '',
                    topic_code TEXT NOT NULL DEFAULT '',
                    level TEXT NOT NULL DEFAULT 'all',
                    due_date TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    FOREIGN KEY(teacher_id) REFERENCES users(id),
                    FOREIGN KEY(class_id) REFERENCES teacher_classes(id)
                )
                """
            )

        connection.commit()


def notify_class_members(connection, class_id, author_name, kind, title):
    """Insère une notification pour chaque élève de la classe."""
    with connection.cursor() as cur:
        cur.execute(
            "SELECT student_id FROM class_memberships WHERE class_id = %s",
            (class_id,),
        )
        rows = cur.fetchall()
    kind_label = "cours" if kind == "course" else "exercice"
    message = f"Nouveau {kind_label} publié par {author_name} : « {title} »."
    now = utc_now()
    for row in rows:
        with connection.cursor() as cur:
            cur.execute(
                "INSERT INTO notifications (user_id, type, message, is_read, created_at) VALUES (%s, %s, %s, 0, %s)",
                (row["student_id"], kind, message, now),
            )


def hash_password(password: str) -> str:
    """Hache un mot de passe avec scrypt + sel aléatoire."""
    salt = secrets.token_hex(16)
    dk = hashlib.scrypt(password.encode("utf-8"), salt=salt.encode("utf-8"), n=16384, r=8, p=1)
    return f"scrypt${salt}${dk.hex()}"


def verify_password(password: str, stored_hash: str) -> bool:
    """Vérifie un mot de passe. Supporte scrypt (nouveau) et SHA-256 brut (héritage)."""
    if stored_hash.startswith("scrypt$"):
        try:
            _, salt, dk_hex = stored_hash.split("$", 2)
        except ValueError:
            return False
        dk = hashlib.scrypt(password.encode("utf-8"), salt=salt.encode("utf-8"), n=16384, r=8, p=1)
        return secrets.compare_digest(dk.hex(), dk_hex)
    # Rétrocompatibilité SHA-256 sans sel
    legacy = hashlib.sha256(password.encode("utf-8")).hexdigest()
    return secrets.compare_digest(legacy, stored_hash)


def json_load(value, fallback):
    try:
        return json.loads(value or "")
    except json.JSONDecodeError:
        return fallback


def json_dump(value):
    return json.dumps(value, ensure_ascii=False)


def normalize_role(value):
    role = str(value or "").strip().lower()
    return role if role in KNOWN_ROLES else "student"


def is_valid_email(value):
    return bool(EMAIL_PATTERN.fullmatch(str(value or "").strip()))


def parse_int(value):
    try:
        return int(value)
    except (TypeError, ValueError):
        return None


def generate_class_code(connection):
    while True:
        code = "".join(secrets.choice(CLASS_CODE_ALPHABET) for _ in range(6))
        with connection.cursor() as cur:
            cur.execute("SELECT id FROM teacher_classes WHERE code = %s", (code,))
            existing = cur.fetchone()
        if not existing:
            return code


def serialize_user(row):
    return {
        "id": row["id"],
        "name": row["name"],
        "email": row["email"],
        "role": row["role"],
    }


def get_progress(connection, user_id):
    with connection.cursor() as cur:
        cur.execute("SELECT * FROM progress WHERE user_id = %s", (user_id,))
        row = cur.fetchone()
    if not row:
        progress = {
            "viewedExercises": [],
            "favoriteExercises": [],
            "generatedExercises": [],
            "recentQuestions": [],
            "quizHistory": [],
            "selfEvaluations": {},
            "dailyActivity": {},
        }
        with connection.cursor() as cur:
            cur.execute(
                """
                INSERT INTO progress (user_id, viewed_exercises, favorite_exercises, generated_exercises, recent_questions, quiz_history, self_evaluations, daily_activity, updated_at)
                VALUES (%s, '[]', '[]', '[]', '[]', '[]', '{}', '{}', %s)
                """,
                (user_id, utc_now()),
            )
        connection.commit()
        return progress

    return {
        "viewedExercises": json_load(row["viewed_exercises"], []),
        "favoriteExercises": json_load(row["favorite_exercises"], []),
        "generatedExercises": json_load(row["generated_exercises"], []),
        "recentQuestions": json_load(row["recent_questions"], []),
        "quizHistory": json_load(row["quiz_history"], []),
        "selfEvaluations": json_load(row.get("self_evaluations", "{}"), {}),
        "dailyActivity": json_load(row.get("daily_activity", "{}"), {}),
        "chatHistory": json_load(row.get("chat_history", "[]"), []),
        "earnedBadges": json_load(row.get("earned_badges", "{}"), {}),
        "exerciseSchedule": json_load(row.get("exercise_schedule", "{}"), {}),
        "topicFailCounts": json_load(row.get("topic_fail_counts", "{}"), {}),
        "learningHistory": json_load(row.get("learning_history", "[]"), []),
        "errorHistory": json_load(row.get("error_history", "[]"), []),
        "appearance": json_load(row.get("appearance", "{}"), {}),
        "grapherState": json_load(row.get("grapher_state", "{}"), {}),
    }


def update_progress(connection, user_id, payload):
    with connection.cursor() as cur:
        cur.execute(
            """
            INSERT INTO progress (
                user_id, viewed_exercises, favorite_exercises, generated_exercises,
                recent_questions, quiz_history, self_evaluations, daily_activity,
                chat_history, earned_badges, exercise_schedule, topic_fail_counts,
                learning_history, error_history, appearance, grapher_state, updated_at
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT(user_id) DO UPDATE SET
                viewed_exercises = EXCLUDED.viewed_exercises,
                favorite_exercises = EXCLUDED.favorite_exercises,
                generated_exercises = EXCLUDED.generated_exercises,
                recent_questions = EXCLUDED.recent_questions,
                quiz_history = EXCLUDED.quiz_history,
                self_evaluations = EXCLUDED.self_evaluations,
                daily_activity = EXCLUDED.daily_activity,
                chat_history = EXCLUDED.chat_history,
                earned_badges = EXCLUDED.earned_badges,
                exercise_schedule = EXCLUDED.exercise_schedule,
                topic_fail_counts = EXCLUDED.topic_fail_counts,
                learning_history = EXCLUDED.learning_history,
                error_history = EXCLUDED.error_history,
                appearance = EXCLUDED.appearance,
                grapher_state = EXCLUDED.grapher_state,
                updated_at = EXCLUDED.updated_at
            """,
            (
                user_id,
                json_dump(payload.get("viewedExercises", [])),
                json_dump(payload.get("favoriteExercises", [])),
                json_dump(payload.get("generatedExercises", [])),
                json_dump(payload.get("recentQuestions", [])),
                json_dump(payload.get("quizHistory", [])),
                json_dump(payload.get("selfEvaluations", {})),
                json_dump(payload.get("dailyActivity", {})),
                json_dump(payload.get("chatHistory", [])),
                json_dump(payload.get("earnedBadges", {})),
                json_dump(payload.get("exerciseSchedule", {})),
                json_dump(payload.get("topicFailCounts", {})),
                json_dump(payload.get("learningHistory", [])),
                json_dump(payload.get("errorHistory", [])),
                json_dump(payload.get("appearance", {})),
                json_dump(payload.get("grapherState", {})),
                utc_now(),
            ),
        )
    connection.commit()


def normalize_focus(values):
    if isinstance(values, str):
        values = values.split(",")
    return [str(value).strip() for value in (values or []) if str(value).strip()]


def normalize_lessons(values):
    lessons = []
    for value in values or []:
        if not isinstance(value, dict):
            continue
        title = str(value.get("title", "")).strip()
        summary = str(value.get("summary", "")).strip()
        if len(title) >= 2 and len(summary) >= 6:
            lessons.append({"title": title, "summary": summary})
    return lessons


def normalize_correction_blocks(values):
    if isinstance(values, str):
        values = [block.strip() for block in values.split("\n\n") if block.strip()]
    return [str(value).strip() for value in (values or []) if str(value).strip()]


def normalize_keywords(values):
    if isinstance(values, str):
        values = values.split(",")
    return [str(value).strip() for value in (values or []) if str(value).strip()]


def serialize_class_member(row):
    return {
        "id": row["id"],
        "name": row["name"],
        "email": row["email"],
        "joinedAt": row["joined_at"],
    }


def serialize_teacher_class(row, members=None):
    member_list = members if members is not None else []
    keys = set(row.keys()) if hasattr(row, "keys") else set()
    student_count = row["student_count"] if "student_count" in keys else len(member_list)
    return {
        "id": row["id"],
        "name": row["name"],
        "code": row["code"],
        "studentCount": student_count,
        "members": member_list,
        "createdAt": row["created_at"],
    }


def serialize_joined_class(row):
    return {
        "id": row["id"],
        "name": row["name"],
        "code": row["code"],
        "teacherName": row["teacher_name"],
        "teacherEmail": row["teacher_email"],
        "joinedAt": row["joined_at"],
    }


def serialize_teacher_course(row):
    return {
        "id": f"teacher-course-{row['id']}",
        "dbId": row["id"],
        "code": row["topic_code"],
        "semester": row["semester"],
        "title": row["title"],
        "objective": row["objective"],
        "focus": json_load(row["focus"], []),
        "lessons": json_load(row["lessons"], []),
        "source": "teacher",
        "authorName": row["author_name"],
        "authorEmail": row["author_email"],
        "publishedAt": row["created_at"],
        "classId": row["class_id"],
        "className": row["class_name"],
        "classCode": row["class_code"],
    }


def serialize_teacher_exercise(row):
    return {
        "id": f"teacher-exercise-{row['id']}",
        "dbId": row["id"],
        "title": row["title"],
        "topic": row["topic_code"],
        "semester": row["semester"],
        "level": row["level"],
        "duration": row["duration"],
        "statement": row["statement"],
        "correction": json_load(row["correction"], []),
        "keywords": json_load(row["keywords"], []),
        "source": "teacher",
        "authorName": row["author_name"],
        "authorEmail": row["author_email"],
        "publishedAt": row["created_at"],
        "classId": row["class_id"],
        "className": row["class_name"],
        "classCode": row["class_code"],
    }


COURSE_SELECT = """
    SELECT teacher_courses.*, users.name AS author_name, users.email AS author_email,
           teacher_classes.name AS class_name, teacher_classes.code AS class_code
    FROM teacher_courses
    JOIN users ON users.id = teacher_courses.author_id
    LEFT JOIN teacher_classes ON teacher_classes.id = teacher_courses.class_id
"""

EXERCISE_SELECT = """
    SELECT teacher_exercises.*, users.name AS author_name, users.email AS author_email,
           teacher_classes.name AS class_name, teacher_classes.code AS class_code
    FROM teacher_exercises
    JOIN users ON users.id = teacher_exercises.author_id
    LEFT JOIN teacher_classes ON teacher_classes.id = teacher_exercises.class_id
"""


def get_teacher_class_row(connection, class_id, teacher_id=None):
    with connection.cursor() as cur:
        if teacher_id is None:
            cur.execute("SELECT * FROM teacher_classes WHERE id = %s", (class_id,))
        else:
            cur.execute(
                "SELECT * FROM teacher_classes WHERE id = %s AND teacher_id = %s",
                (class_id, teacher_id),
            )
        return cur.fetchone()


def get_teacher_class_by_id(connection, class_id, teacher_id):
    with connection.cursor() as cur:
        cur.execute(
            """
            SELECT teacher_classes.*, COUNT(class_memberships.id) AS student_count
            FROM teacher_classes
            LEFT JOIN class_memberships ON class_memberships.class_id = teacher_classes.id
            WHERE teacher_classes.id = %s AND teacher_classes.teacher_id = %s
            GROUP BY teacher_classes.id
            """,
            (class_id, teacher_id),
        )
        row = cur.fetchone()
    if not row:
        return None
    with connection.cursor() as cur:
        cur.execute(
            """
            SELECT users.id, users.name, users.email, class_memberships.joined_at
            FROM class_memberships
            JOIN users ON users.id = class_memberships.student_id
            WHERE class_memberships.class_id = %s
            ORDER BY LOWER(users.name) ASC
            """,
            (class_id,),
        )
        members = cur.fetchall()
    return serialize_teacher_class(row, [serialize_class_member(member) for member in members])


def get_teacher_classes(connection, teacher_id):
    with connection.cursor() as cur:
        cur.execute(
            """
            SELECT teacher_classes.*, COUNT(class_memberships.id) AS student_count
            FROM teacher_classes
            LEFT JOIN class_memberships ON class_memberships.class_id = teacher_classes.id
            WHERE teacher_classes.teacher_id = %s
            GROUP BY teacher_classes.id
            ORDER BY teacher_classes.created_at DESC
            """,
            (teacher_id,),
        )
        rows = cur.fetchall()
    classes = []
    for row in rows:
        with connection.cursor() as cur:
            cur.execute(
                """
                SELECT users.id, users.name, users.email, class_memberships.joined_at
                FROM class_memberships
                JOIN users ON users.id = class_memberships.student_id
                WHERE class_memberships.class_id = %s
                ORDER BY LOWER(users.name) ASC
                """,
                (row["id"],),
            )
            members = cur.fetchall()
        classes.append(serialize_teacher_class(row, [serialize_class_member(member) for member in members]))
    return classes


def get_joined_classes(connection, student_id):
    with connection.cursor() as cur:
        cur.execute(
            """
            SELECT teacher_classes.*, class_memberships.joined_at, users.name AS teacher_name, users.email AS teacher_email
            FROM class_memberships
            JOIN teacher_classes ON teacher_classes.id = class_memberships.class_id
            JOIN users ON users.id = teacher_classes.teacher_id
            WHERE class_memberships.student_id = %s
            ORDER BY teacher_classes.created_at DESC
            """,
            (student_id,),
        )
        rows = cur.fetchall()
    return [serialize_joined_class(row) for row in rows]


def get_teacher_courses_for_teacher(connection, teacher_id):
    with connection.cursor() as cur:
        cur.execute(
            COURSE_SELECT + " WHERE teacher_courses.author_id = %s ORDER BY teacher_courses.created_at DESC",
            (teacher_id,),
        )
        rows = cur.fetchall()
    return [serialize_teacher_course(row) for row in rows]


def get_teacher_exercises_for_teacher(connection, teacher_id):
    with connection.cursor() as cur:
        cur.execute(
            EXERCISE_SELECT + " WHERE teacher_exercises.author_id = %s ORDER BY teacher_exercises.created_at DESC",
            (teacher_id,),
        )
        rows = cur.fetchall()
    return [serialize_teacher_exercise(row) for row in rows]


def get_teacher_courses_for_student(connection, student_id):
    with connection.cursor() as cur:
        cur.execute(
            COURSE_SELECT
            + """
              JOIN class_memberships ON class_memberships.class_id = teacher_courses.class_id
              WHERE class_memberships.student_id = %s
              ORDER BY teacher_courses.created_at DESC
            """,
            (student_id,),
        )
        rows = cur.fetchall()
    return [serialize_teacher_course(row) for row in rows]


def get_teacher_exercises_for_student(connection, student_id):
    with connection.cursor() as cur:
        cur.execute(
            EXERCISE_SELECT
            + """
              JOIN class_memberships ON class_memberships.class_id = teacher_exercises.class_id
              WHERE class_memberships.student_id = %s
              ORDER BY teacher_exercises.created_at DESC
            """,
            (student_id,),
        )
        rows = cur.fetchall()
    return [serialize_teacher_exercise(row) for row in rows]


def get_teacher_course_by_id(connection, course_id, teacher_id=None):
    query = COURSE_SELECT + " WHERE teacher_courses.id = %s"
    params = [course_id]
    if teacher_id is not None:
        query += " AND teacher_courses.author_id = %s"
        params.append(teacher_id)
    with connection.cursor() as cur:
        cur.execute(query, tuple(params))
        row = cur.fetchone()
    return serialize_teacher_course(row) if row else None


def get_teacher_exercise_by_id(connection, exercise_id, teacher_id=None):
    query = EXERCISE_SELECT + " WHERE teacher_exercises.id = %s"
    params = [exercise_id]
    if teacher_id is not None:
        query += " AND teacher_exercises.author_id = %s"
        params.append(teacher_id)
    with connection.cursor() as cur:
        cur.execute(query, tuple(params))
        row = cur.fetchone()
    return serialize_teacher_exercise(row) if row else None


def get_devoirs_for_teacher(connection, teacher_id):
    with connection.cursor() as cur:
        cur.execute(
            """SELECT d.id, d.title, d.description, d.topic_code, d.level, d.due_date, d.created_at,
                      tc.name as class_name, tc.code as class_code
               FROM teacher_devoirs d
               JOIN teacher_classes tc ON tc.id = d.class_id
               WHERE d.teacher_id = %s
               ORDER BY d.due_date ASC""",
            (teacher_id,),
        )
        rows = cur.fetchall()
    return [dict(r) for r in rows]


def get_devoirs_for_student(connection, student_id):
    with connection.cursor() as cur:
        cur.execute(
            """SELECT d.id, d.title, d.description, d.topic_code, d.level, d.due_date, d.created_at,
                      tc.name as class_name, u.name as teacher_name
               FROM teacher_devoirs d
               JOIN teacher_classes tc ON tc.id = d.class_id
               JOIN class_memberships cm ON cm.class_id = tc.id AND cm.student_id = %s
               JOIN users u ON u.id = d.teacher_id
               WHERE d.due_date >= (NOW() - INTERVAL '1 day')::date::text
               ORDER BY d.due_date ASC""",
            (student_id,),
        )
        rows = cur.fetchall()
    return [dict(r) for r in rows]


def get_resources_bundle(connection, user):
    if user["role"] == "teacher":
        return {
            "courses": get_teacher_courses_for_teacher(connection, user["id"]),
            "exercises": get_teacher_exercises_for_teacher(connection, user["id"]),
            "teacherClasses": get_teacher_classes(connection, user["id"]),
            "joinedClasses": [],
            "devoirs": get_devoirs_for_teacher(connection, user["id"]),
        }
    return {
        "courses": get_teacher_courses_for_student(connection, user["id"]),
        "exercises": get_teacher_exercises_for_student(connection, user["id"]),
        "teacherClasses": [],
        "joinedClasses": get_joined_classes(connection, user["id"]),
        "devoirs": get_devoirs_for_student(connection, user["id"]),
    }


def extract_text(response_data):
    # Format OpenAI Responses API (legacy)
    output_text = response_data.get("output_text")
    if output_text:
        return output_text

    parts = []
    for item in response_data.get("output", []):
        for content in item.get("content", []):
            text = content.get("text")
            if text:
                parts.append(text)
    return "\n".join(parts).strip()


def build_ssl_context():
    cafile = os.environ.get("SSL_CERT_FILE")
    if cafile:
        return ssl.create_default_context(cafile=cafile)

    try:
        import certifi

        return ssl.create_default_context(cafile=certifi.where())
    except Exception:
        return ssl.create_default_context()


def _chat_completions(base_url, model, system_prompt, user_prompt, api_key="", timeout=90):
    """Appel générique OpenAI-compatible /v1/chat/completions. Retourne le texte brut."""
    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user",   "content": user_prompt},
        ],
        "temperature": 0.7,
    }
    headers = {"Content-Type": "application/json", "User-Agent": "MathMentor/1.0"}
    if api_key:
        headers["Authorization"] = f"Bearer {api_key}"

    req = Request(
        f"{base_url.rstrip('/')}/v1/chat/completions",
        data=json_dump(payload).encode("utf-8"),
        headers=headers,
        method="POST",
    )
    ssl_ctx = build_ssl_context()
    with urlopen(req, timeout=timeout, context=ssl_ctx) as resp:
        data = json.loads(resp.read().decode("utf-8"))
        return data["choices"][0]["message"]["content"]


def _gemini_request(system_prompt, user_prompt, timeout=60):
    """Appel à l'API Google Gemini (REST natif). Retourne le texte brut."""
    url = (
        f"https://generativelanguage.googleapis.com/v1beta/models/"
        f"{GEMINI_MODEL}:generateContent?key={GEMINI_API_KEY}"
    )
    payload = {
        "systemInstruction": {"parts": [{"text": system_prompt}]},
        "contents": [{"parts": [{"text": user_prompt}]}],
        "generationConfig": {"temperature": 0.7},
    }
    req = Request(
        url,
        data=json_dump(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    ssl_ctx = build_ssl_context()
    with urlopen(req, timeout=timeout, context=ssl_ctx) as resp:
        data = json.loads(resp.read().decode("utf-8"))
        return data["candidates"][0]["content"]["parts"][0]["text"]


def _html_to_markdown(text):
    """Convertit les balises HTML de formatage en markdown (pour les réponses chat)."""
    text = re.sub(r'<strong>([\s\S]*?)</strong>', r'**\1**', text, flags=re.IGNORECASE)
    text = re.sub(r'<b>([\s\S]*?)</b>', r'**\1**', text, flags=re.IGNORECASE)
    text = re.sub(r'<em>([\s\S]*?)</em>', r'*\1*', text, flags=re.IGNORECASE)
    text = re.sub(r'<i>([\s\S]*?)</i>', r'*\1*', text, flags=re.IGNORECASE)
    text = re.sub(r'<h[1-6][^>]*>([\s\S]*?)</h[1-6]>', r'## \1', text, flags=re.IGNORECASE)
    text = re.sub(r'<br\s*/?>', '\n', text, flags=re.IGNORECASE)
    text = re.sub(r'<li[^>]*>([\s\S]*?)</li>', r'- \1', text, flags=re.IGNORECASE)
    text = re.sub(r'</?(?:ul|ol|p)[^>]*>', '\n', text, flags=re.IGNORECASE)
    # Supprimer les balises HTML restantes
    text = re.sub(r'<[^>]+>', '', text)
    return text.strip()


def _clean_ai_text(text):
    """Nettoyage préliminaire du texte brut retourné par une IA avant parsing JSON."""
    # Supprimer les blocs <think>...</think> (modèles raisonneurs type Qwen/DeepSeek)
    # Cas 1 : think fermé — on retire juste le bloc
    text = re.sub(r'<think>[\s\S]*?</think>', '', text, flags=re.IGNORECASE).strip()
    # Cas 2 : think non fermé (tout le reste du texte est dans le think) — on retire à partir de <think>
    text = re.sub(r'<think>[\s\S]*$', '', text, flags=re.IGNORECASE).strip()
    # Supprimer les balises Markdown entourant le JSON (```json ... ```)
    text = re.sub(r'^```[a-z]*\s*', '', text.strip())
    text = re.sub(r'\s*```$', '', text.strip())
    return text.strip()


def _extract_balanced(text, opener, closer, start):
    """Extrait la chaîne équilibrée depuis text[start] (doit être opener)."""
    depth = 0
    in_string = False
    i = start
    while i < len(text):
        c = text[i]
        if c == '\\' and in_string:
            i += 2
            continue
        if c == '"':
            in_string = not in_string
        if not in_string:
            if c == opener:
                depth += 1
            elif c == closer:
                depth -= 1
                if depth == 0:
                    return text[start:i+1]
        i += 1
    return None


def _extract_json_from_text(text, is_array=False):
    """Extrait tous les objets JSON valides et retourne le plus grand (le plus complet)."""
    opener, closer = ('[', ']') if is_array else ('{', '}')
    candidates = []
    i = 0
    while i < len(text):
        if text[i] == opener:
            candidate = _extract_balanced(text, opener, closer, i)
            if candidate:
                candidates.append(candidate)
                i += len(candidate)
                continue
        i += 1
    # Prendre le candidat le plus long (le plus susceptible d'être l'objet principal)
    if candidates:
        return max(candidates, key=len)
    # Fallback : essayer avec l'autre forme
    alt_opener, alt_closer = ('{', '}') if is_array else ('[', ']')
    i = 0
    while i < len(text):
        if text[i] == alt_opener:
            candidate = _extract_balanced(text, alt_opener, alt_closer, i)
            if candidate:
                candidates.append(candidate)
                i += len(candidate)
                continue
        i += 1
    return max(candidates, key=len) if candidates else None


def _fix_string_newlines(s):
    """Remplace les newlines/tabs littéraux à l'intérieur des strings JSON par leurs séquences d'échappement."""
    result = []
    in_string = False
    i = 0
    while i < len(s):
        c = s[i]
        if c == '\\' and in_string:
            result.append(c)
            i += 1
            if i < len(s):
                result.append(s[i])
                i += 1
            continue
        if c == '"':
            in_string = not in_string
            result.append(c)
            i += 1
            continue
        if in_string:
            if c == '\n':
                result.append('\\n')
                i += 1
                continue
            if c == '\r':
                i += 1
                continue
            if c == '\t':
                result.append('\\t')
                i += 1
                continue
        result.append(c)
        i += 1
    return ''.join(result)


def _double_unescaped_backslashes(s):
    """Double les backslashes invalides dans les strings JSON (parseur caractère par caractère).
    Seuls \\\\, \\", \\n, \\r, \\t, \\/, \\uXXXX sont valides en JSON — tout le reste est du LaTeX."""
    result = []
    in_string = False
    i = 0
    while i < len(s):
        c = s[i]
        if not in_string:
            result.append(c)
            if c == '"':
                in_string = True
            i += 1
            continue
        # Inside a JSON string
        if c == '\\':
            if i + 1 < len(s):
                nxt = s[i + 1]
                if nxt in ('"', '\\', '/', 'n', 'r', 't'):
                    # Valid JSON escape — keep as-is
                    result.append(c)
                    result.append(nxt)
                    i += 2
                elif nxt == 'u' and i + 5 < len(s) and all(c2 in '0123456789abcdefABCDEF' for c2 in s[i+2:i+6]):
                    # Valid \uXXXX escape
                    result.append(s[i:i+6])
                    i += 6
                else:
                    # Invalid escape (LaTeX like \(, \[, \f, \alpha…) — double the backslash
                    result.append('\\\\')
                    i += 1
            else:
                result.append('\\\\')
                i += 1
        elif c == '"':
            in_string = False
            result.append(c)
            i += 1
        else:
            result.append(c)
            i += 1
    return ''.join(result)


def _repair_json_strings(s):
    """Répare les strings JSON en une seule passe :
    - Échappe les newlines/tabs littéraux
    - Double les backslashes invalides (LaTeX : \\[, \\(, \\begin, etc.)
    Seuls \\", \\\\, \\/,  \\n, \\r, \\t, \\b, \\f, \\uXXXX sont valides en JSON."""
    result = []
    in_string = False
    i = 0
    while i < len(s):
        c = s[i]
        if not in_string:
            result.append(c)
            if c == '"':
                in_string = True
            i += 1
            continue
        # Inside a JSON string
        if c == '\\':
            if i + 1 >= len(s):
                result.append('\\\\')
                i += 1
                continue
            nxt = s[i + 1]
            if nxt in ('"', '\\', '/', 'n', 'r', 't'):
                result.append(c)
                result.append(nxt)
                i += 2
            elif nxt == 'u' and i + 5 < len(s) and all(h in '0123456789abcdefABCDEF' for h in s[i+2:i+6]):
                result.append(s[i:i+6])
                i += 6
            else:
                # Invalid escape (LaTeX) — double the backslash
                result.append('\\\\')
                i += 1
        elif c == '"':
            in_string = False
            result.append(c)
            i += 1
        elif c == '\n':
            result.append('\\n')
            i += 1
        elif c == '\r':
            i += 1  # skip bare CR
        elif c == '\t':
            result.append('\\t')
            i += 1
        else:
            result.append(c)
            i += 1
    return ''.join(result)


def parse_ai_json(text):
    """Parse le JSON retourné par une IA, même s'il contient du LaTeX avec des backslashes."""

    text = _clean_ai_text(text)
    text = text.replace('&amp;', '&').replace('&lt;', '<').replace('&gt;', '>').replace('&quot;', '"').replace('&#39;', "'")
    text = text.strip('\ufeff\u200b\u200c\u200d\u00a0\x00\x01\x02\x03')

    logger.info("parse_ai_json input (first 100): %r", text[:100])

    # Tentative 1 : JSON brut
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    # Tentative 2 : réparation complète en une passe (newlines + backslashes LaTeX)
    t2 = _repair_json_strings(text)
    logger.info("parse_ai_json after repair (first 100): %r", t2[:100])
    try:
        return json.loads(t2)
    except json.JSONDecodeError as e2:
        logger.error("After repair failed at char %d: %r", e2.pos, t2[max(0,e2.pos-5):e2.pos+10])

    # Tentative 3 : ast.literal_eval (guillemets simples Python-style)
    try:
        result = ast.literal_eval(t2)
        if isinstance(result, (dict, list)):
            return result
    except Exception:
        pass

    # Tentative 4 : réparation sur le texte original puis ast
    try:
        result = ast.literal_eval(text)
        if isinstance(result, (dict, list)):
            return result
    except Exception:
        pass

    raise json.JSONDecodeError("Impossible de parser la réponse IA", text, 0)


def normalize_ai_text(text):
    """NFC normalization + fix character-by-character AI output (newlines between each letter)."""
    if not isinstance(text, str):
        return text
    text = unicodedata.normalize("NFC", text)
    # Detect runs of ≥4 consecutive lines with ≤2 non-space chars and join them
    lines = text.split("\n")
    result = []
    i = 0
    while i < len(lines):
        stripped = lines[i].strip()
        if 0 < len(stripped) <= 2:
            run = [stripped]
            j = i + 1
            while j < len(lines) and 0 < len(lines[j].strip()) <= 2:
                run.append(lines[j].strip())
                j += 1
            if len(run) >= 4:
                result.append("".join(run))
                i = j
                continue
        result.append(lines[i])
        i += 1
    return "\n".join(result)


def ai_request(system_prompt, user_prompt):
    """Essaie les fournisseurs dans l'ordre de priorité. Lève RuntimeError si tout échoue."""

    # 1. Ollama local (gratuit, illimité, hors-ligne)
    try:
        text = _chat_completions(OLLAMA_HOST, OLLAMA_MODEL, system_prompt, user_prompt, timeout=90)
        logger.info("Réponse IA via Ollama (%s)", OLLAMA_MODEL)
        return text
    except Exception as err:
        logger.info("Ollama indisponible (%s: %s).", type(err).__name__, err)

    # 2. Cerebras (cloud gratuit, très rapide — cloud.cerebras.ai)
    if CEREBRAS_API_KEY:
        try:
            text = _chat_completions(
                "https://api.cerebras.ai", CEREBRAS_MODEL,
                system_prompt, user_prompt,
                api_key=CEREBRAS_API_KEY, timeout=60,
            )
            logger.info("Réponse IA via Cerebras (%s)", CEREBRAS_MODEL)
            return text
        except Exception as err:
            logger.warning("Cerebras indisponible (%s: %s).", type(err).__name__, err)

    # 3. SambaNova (cloud gratuit, ultra rapide — cloud.sambanova.ai)
    if SAMBANOVA_API_KEY:
        try:
            text = _chat_completions(
                "https://api.sambanova.ai", SAMBANOVA_MODEL,
                system_prompt, user_prompt,
                api_key=SAMBANOVA_API_KEY, timeout=60,
            )
            logger.info("Réponse IA via SambaNova (%s)", SAMBANOVA_MODEL)
            return text
        except Exception as err:
            logger.warning("SambaNova indisponible (%s: %s).", type(err).__name__, err)

    # 4. Groq (cloud gratuit, 14 400 req/jour — console.groq.com)
    if GROQ_API_KEY:
        try:
            text = _chat_completions(
                "https://api.groq.com/openai", GROQ_MODEL,
                system_prompt, user_prompt,
                api_key=GROQ_API_KEY, timeout=60,
            )
            logger.info("Réponse IA via Groq (%s)", GROQ_MODEL)
            return text
        except Exception as err:
            logger.warning("Groq indisponible (%s: %s).", type(err).__name__, err)

    # 5. OpenRouter (agrège des modèles gratuits — openrouter.ai)
    if OPENROUTER_API_KEY:
        try:
            text = _chat_completions(
                "https://openrouter.ai/api", OPENROUTER_MODEL,
                system_prompt, user_prompt,
                api_key=OPENROUTER_API_KEY, timeout=60,
            )
            logger.info("Réponse IA via OpenRouter (%s)", OPENROUTER_MODEL)
            return text
        except Exception as err:
            logger.warning("OpenRouter indisponible (%s: %s).", type(err).__name__, err)

    # 6. Google Gemini Flash (cloud gratuit — aistudio.google.com)
    if GEMINI_API_KEY:
        try:
            text = _gemini_request(system_prompt, user_prompt, timeout=60)
            logger.info("Réponse IA via Gemini (%s)", GEMINI_MODEL)
            return text
        except Exception as err:
            logger.warning("Gemini indisponible (%s: %s).", type(err).__name__, err)

    raise RuntimeError(
        "Aucune IA disponible. Configurez au moins une option dans le fichier .env : "
        "1) Ollama local (ollama.com) "
        "2) Cerebras (cloud.cerebras.ai) "
        "3) SambaNova (cloud.sambanova.ai) "
        "4) Groq (console.groq.com) "
        "5) OpenRouter (openrouter.ai) "
        "6) Gemini (aistudio.google.com)"
    )


def get_ai_provider():
    """Retourne le fournisseur IA actif selon la même priorité que ai_request()."""
    try:
        req = Request(f"{OLLAMA_HOST.rstrip('/')}/api/tags", method="GET")
        with urlopen(req, timeout=2) as resp:
            if resp.status == 200:
                return "ollama"
    except Exception:
        pass
    if CEREBRAS_API_KEY:
        return "cerebras"
    if SAMBANOVA_API_KEY:
        return "sambanova"
    if GROQ_API_KEY:
        return "groq"
    if OPENROUTER_API_KEY:
        return "openrouter"
    if GEMINI_API_KEY:
        return "gemini"
    return None


class AppHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(PUBLIC_DIR), **kwargs)

    def log_message(self, format, *args):
        logger.info("%s - %s", self.address_string(), format % args)

    def end_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.send_header("Access-Control-Allow-Methods", "GET,POST,OPTIONS")
        # Prevent JS/CSS caching so module changes are always picked up
        if self.path and (self.path.split("?")[0].endswith(".js") or self.path.split("?")[0].endswith(".css")):
            self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(204)
        self.end_headers()

    def do_GET(self):
        if self.path == "/api/ping":
            self.send_json(200, {"ok": True})
            return

        if self.path == "/api/ai-status":
            provider = get_ai_provider()
            labels = {
                "ollama":     f"Ollama · {OLLAMA_MODEL}",
                "cerebras":   f"Cerebras · {CEREBRAS_MODEL}",
                "sambanova":  f"SambaNova · {SAMBANOVA_MODEL}",
                "groq":       f"Groq · {GROQ_MODEL}",
                "openrouter": f"OpenRouter · {OPENROUTER_MODEL}",
                "gemini":     f"Gemini · {GEMINI_MODEL}",
                None:         "IA indisponible",
            }
            self.send_json(200, {
                "provider": provider,
                "label": labels.get(provider, f"IA · {provider}"),
                "available": provider is not None,
            })
            return

        if self.path == "/api/me":
            user = self.require_user()
            if not user:
                return

            with db_connection() as connection:
                progress = get_progress(connection, user["id"])
            self.send_json(200, {"user": serialize_user(user), "progress": progress})
            return

        if self.path == "/api/appearance":
            self.handle_appearance()
            return

        if self.path == "/api/resources":
            user = self.require_user()
            if not user:
                return

            with db_connection() as connection:
                payload = get_resources_bundle(connection, user)
            self.send_json(200, payload)
            return

        if self.path.startswith("/api/teacher/exercise-stats"):
            self.handle_teacher_exercise_stats()
            return

        if self.path.startswith("/api/teacher/class-progress"):
            self.handle_teacher_class_progress()
            return

        if self.path.startswith("/api/class/leaderboard"):
            self.handle_class_leaderboard()
            return

        if self.path.startswith("/api/teacher/class-evaluations"):
            self.handle_teacher_class_evaluations()
            return

        if self.path.startswith("/api/teacher/class-analytics"):
            self.handle_teacher_class_analytics()
            return

        if self.path.startswith("/api/teacher/class-files"):
            self.handle_teacher_class_files()
            return

        if self.path.startswith("/uploads/"):
            self.handle_serve_upload()
            return

        if self.path.startswith("/api/notifications"):
            self.handle_notifications_get()
            return

        if self.path == "/manifest.json":
            path = PUBLIC_DIR / "manifest.json"
            if path.exists():
                content = path.read_bytes()
                self.send_response(200)
                self.send_header("Content-Type", "application/manifest+json")
                self.send_header("Content-Length", str(len(content)))
                self.end_headers()
                self.wfile.write(content)
            else:
                self.send_response(404)
                self.end_headers()
            return

        if self.path == "/sw.js":
            path = PUBLIC_DIR / "sw.js"
            if path.exists():
                content = path.read_bytes()
                self.send_response(200)
                self.send_header("Content-Type", "application/javascript")
                self.send_header("Content-Length", str(len(content)))
                self.end_headers()
                self.wfile.write(content)
            else:
                self.send_response(404)
                self.end_headers()
            return

        super().do_GET()

    def do_POST(self):
        route = self.path

        if route == "/api/register":
            self.handle_register()
            return
        if route == "/api/login":
            self.handle_login()
            return
        if route == "/api/progress":
            self.handle_progress()
            return
        if route == "/api/teacher/class":
            self.handle_teacher_class_create()
            return
        if route == "/api/student/class/join":
            self.handle_student_class_join()
            return
        if route == "/api/teacher/course":
            self.handle_teacher_course_create()
            return
        if route == "/api/teacher/course/update":
            self.handle_teacher_course_update()
            return
        if route == "/api/teacher/course/delete":
            self.handle_teacher_course_delete()
            return
        if route == "/api/teacher/exercise":
            self.handle_teacher_exercise_create()
            return
        if route == "/api/teacher/exercise/update":
            self.handle_teacher_exercise_update()
            return
        if route == "/api/teacher/exercise/delete":
            self.handle_teacher_exercise_delete()
            return
        if route == "/api/teacher/devoir":
            self.handle_devoir_create()
            return
        if route == "/api/teacher/devoir/delete":
            self.handle_devoir_delete()
            return
        if route == "/api/self-eval":
            self.handle_self_eval()
            return
        if route == "/api/appearance":
            self.handle_appearance()
            return
        if route == "/api/teacher/file":
            self.handle_teacher_file_upload()
            return
        if route == "/api/teacher/file/delete":
            self.handle_teacher_file_delete()
            return
        if route == "/api/ai":
            self.handle_ai_chat()
            return
        if route == "/api/generate-exercise":
            self.handle_ai_exercise()
            return
        if route == "/api/ai/correct":
            self.handle_ai_correct()
            return
        if route == "/api/ai/generate-flashcards":
            self.handle_ai_generate_flashcards()
            return
        if route == "/api/ai/generate-qcm":
            self.handle_ai_generate_qcm()
            return
        if route == "/api/ai/analyze-image":
            self.handle_ai_analyze_image()
            return
        if route == "/api/auth/refresh":
            self.handle_auth_refresh()
            return
        if route == "/api/notifications/read":
            self.handle_notifications_read()
            return
        if route == "/api/teacher/notify-student":
            self.handle_teacher_notify_student()
            return
        if route == "/api/ai/from-pdf":
            self.handle_ai_from_pdf()
            return

        self.send_json(404, {"error": "Endpoint not found."})

    def parse_json_body(self):
        content_length = int(self.headers.get("Content-Length", "0"))
        raw_body = self.rfile.read(content_length).decode("utf-8") if content_length else "{}"
        try:
            return json.loads(raw_body)
        except json.JSONDecodeError:
            self.send_json(400, {"error": "Invalid JSON body."})
            return None

    def require_user(self):
        auth_header = self.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            self.send_json(401, {"error": "Authentication required."})
            return None

        token = auth_header.split(" ", 1)[1].strip()
        with db_connection() as connection:
            with connection.cursor() as cur:
                cur.execute(
                    """
                    SELECT users.id, users.name, users.email, users.role
                    FROM sessions
                    JOIN users ON users.id = sessions.user_id
                    WHERE sessions.token = %s
                      AND (sessions.expires_at IS NULL OR sessions.expires_at > %s)
                    """,
                    (token, utc_now()),
                )
                row = cur.fetchone()

        if not row:
            self.send_json(401, {"error": "Invalid session token."})
            return None

        return dict(row)

    def require_teacher(self):
        user = self.require_user()
        if not user:
            return None
        if user["role"] != "teacher":
            self.send_json(403, {"error": "Teacher account required for this action."})
            return None
        return user

    def create_session(self, connection, user_id):
        token = secrets.token_urlsafe(32)
        expires_at = (datetime.now(timezone.utc) + timedelta(days=SESSION_TTL_DAYS)).isoformat()
        with connection.cursor() as cur:
            cur.execute(
                "INSERT INTO sessions (token, user_id, created_at, expires_at) VALUES (%s, %s, %s, %s)",
                (token, user_id, utc_now(), expires_at),
            )
        connection.commit()
        return token

    def create_refresh_token(self, connection, user_id):
        token = secrets.token_urlsafe(48)
        expires_at = (datetime.now(timezone.utc) + timedelta(days=90)).isoformat()
        with connection.cursor() as cur:
            cur.execute(
                "INSERT INTO refresh_tokens (token, user_id, created_at, expires_at) VALUES (%s, %s, %s, %s)",
                (token, user_id, utc_now(), expires_at),
            )
        return token

    def handle_register(self):
        body = self.parse_json_body()
        if body is None:
            return

        name = str(body.get("name", "")).strip()
        email = str(body.get("email", "")).strip().lower()
        password = str(body.get("password", "")).strip()
        role = normalize_role(body.get("role", "student"))
        teacher_code = str(body.get("teacherCode", "")).strip()
        expected_teacher_code = os.environ.get("MATHMENTOR_TEACHER_CODE", DEFAULT_TEACHER_CODE)

        if len(name) < 2:
            self.send_json(400, {"error": "Le nom doit contenir au moins 2 caractères."})
            return
        if not is_valid_email(email):
            self.send_json(400, {"error": "L'adresse mail n'est pas valide."})
            return
        if len(password) < 10:
            self.send_json(400, {"error": "Le mot de passe doit contenir au moins 10 caractères."})
            return
        if role == "teacher" and teacher_code != expected_teacher_code:
            self.send_json(403, {"error": "Le code enseignant est invalide."})
            return

        try:
            with db_connection() as connection:
                with connection.cursor() as cur:
                    cur.execute(
                        "INSERT INTO users (name, email, password_hash, role, created_at) VALUES (%s, %s, %s, %s, %s) RETURNING id",
                        (name, email, hash_password(password), role, utc_now()),
                    )
                    user_id = cur.fetchone()["id"]
                token = self.create_session(connection, user_id)
                refresh_token = self.create_refresh_token(connection, user_id)
                connection.commit()
                progress = get_progress(connection, user_id)
                user = {"id": user_id, "name": name, "email": email, "role": role}
                logger.info("Nouveau compte créé : %s (rôle=%s)", email, role)
                self.send_json(201, {"token": token, "refreshToken": refresh_token, "user": user, "progress": progress})
        except psycopg2.errors.UniqueViolation:
            self.send_json(409, {"error": "Cette adresse mail est déjà utilisée."})

    def handle_login(self):
        body = self.parse_json_body()
        if body is None:
            return

        email = str(body.get("email", "")).strip().lower()
        password = str(body.get("password", "")).strip()

        if not is_valid_email(email):
            self.send_json(400, {"error": "L'adresse mail n'est pas valide."})
            return

        with db_connection() as connection:
            with connection.cursor() as cur:
                cur.execute(
                    "SELECT id, name, email, role, password_hash FROM users WHERE email = %s",
                    (email,),
                )
                row = cur.fetchone()

            if not row or not verify_password(password, row["password_hash"]):
                self.send_json(401, {"error": "Identifiants invalides."})
                logger.warning("Échec de connexion pour : %s", email)
                return

            # Migration automatique SHA-256 → scrypt au premier login
            if not row["password_hash"].startswith("scrypt$"):
                with connection.cursor() as cur:
                    cur.execute(
                        "UPDATE users SET password_hash = %s WHERE id = %s",
                        (hash_password(password), row["id"]),
                    )
                connection.commit()
                logger.info("Hash migré vers scrypt pour l'utilisateur id=%s", row["id"])

            logger.info("Connexion réussie : %s (rôle=%s)", email, row["role"])
            token = self.create_session(connection, row["id"])
            refresh_token = self.create_refresh_token(connection, row["id"])
            connection.commit()
            progress = get_progress(connection, row["id"])

        self.send_json(200, {"token": token, "refreshToken": refresh_token, "user": serialize_user(row), "progress": progress})

    def handle_progress(self):
        user = self.require_user()
        if not user:
            return

        body = self.parse_json_body()
        if body is None:
            return

        with db_connection() as connection:
            update_progress(connection, user["id"], body)

        self.send_json(200, {"ok": True})

    def handle_teacher_class_create(self):
        user = self.require_teacher()
        if not user:
            return

        body = self.parse_json_body()
        if body is None:
            return

        name = str(body.get("name", "")).strip()
        if len(name) < 3:
            self.send_json(400, {"error": "Le nom de classe doit contenir au moins 3 caractères."})
            return

        with db_connection() as connection:
            with connection.cursor() as cur:
                cur.execute(
                    "SELECT id FROM teacher_classes WHERE teacher_id = %s AND lower(name) = lower(%s)",
                    (user["id"], name),
                )
                duplicate = cur.fetchone()
            if duplicate:
                self.send_json(409, {"error": "Vous avez déjà une classe avec ce nom."})
                return

            code = generate_class_code(connection)
            with connection.cursor() as cur:
                cur.execute(
                    "INSERT INTO teacher_classes (teacher_id, name, code, created_at, updated_at) VALUES (%s, %s, %s, %s, %s) RETURNING id",
                    (user["id"], name, code, utc_now(), utc_now()),
                )
                class_id = cur.fetchone()["id"]
            classroom = get_teacher_class_by_id(connection, class_id, user["id"])
            connection.commit()

        self.send_json(201, {"classroom": classroom})

    def handle_student_class_join(self):
        user = self.require_user()
        if not user:
            return
        if user["role"] != "student":
            self.send_json(403, {"error": "Seuls les comptes élève peuvent rejoindre une classe."})
            return

        body = self.parse_json_body()
        if body is None:
            return

        code = str(body.get("code", "")).strip().upper()
        if len(code) < 4:
            self.send_json(400, {"error": "Le code de classe est trop court."})
            return

        with db_connection() as connection:
            with connection.cursor() as cur:
                cur.execute(
                    """
                    SELECT teacher_classes.*, users.name AS teacher_name, users.email AS teacher_email
                    FROM teacher_classes
                    JOIN users ON users.id = teacher_classes.teacher_id
                    WHERE teacher_classes.code = %s
                    """,
                    (code,),
                )
                class_row = cur.fetchone()
            if not class_row:
                self.send_json(404, {"error": "Aucune classe ne correspond à ce code."})
                return

            try:
                with connection.cursor() as cur:
                    cur.execute(
                        "INSERT INTO class_memberships (class_id, student_id, joined_at) VALUES (%s, %s, %s)",
                        (class_row["id"], user["id"], utc_now()),
                    )
                connection.commit()
            except psycopg2.errors.UniqueViolation:
                self.send_json(409, {"error": "Vous avez déjà rejoint cette classe."})
                return

            with connection.cursor() as cur:
                cur.execute(
                    """
                    SELECT teacher_classes.*, class_memberships.joined_at, users.name AS teacher_name, users.email AS teacher_email
                    FROM class_memberships
                    JOIN teacher_classes ON teacher_classes.id = class_memberships.class_id
                    JOIN users ON users.id = teacher_classes.teacher_id
                    WHERE class_memberships.class_id = %s AND class_memberships.student_id = %s
                    """,
                    (class_row["id"], user["id"]),
                )
                joined_row = cur.fetchone()

        self.send_json(201, {"joinedClass": serialize_joined_class(joined_row)})

    def handle_teacher_course_create(self):
        user = self.require_teacher()
        if not user:
            return

        body = self.parse_json_body()
        if body is None:
            return

        title = str(body.get("title", "")).strip()
        topic_code = str(body.get("topicCode", "")).strip().upper()
        semester = str(body.get("semester", "")).strip()
        objective = str(body.get("objective", "")).strip()
        focus = normalize_focus(body.get("focus", []))
        lessons = normalize_lessons(body.get("lessons", []))
        class_id = parse_int(body.get("classId"))

        if len(title) < 4 or topic_code not in KNOWN_TOPICS or not semester or len(objective) < 12 or not lessons:
            self.send_json(400, {"error": "Titre, chapitre, objectif et parties du cours sont requis."})
            return
        if not class_id:
            self.send_json(400, {"error": "Sélectionnez la classe destinataire de ce cours."})
            return

        with db_connection() as connection:
            if not get_teacher_class_row(connection, class_id, user["id"]):
                self.send_json(403, {"error": "Cette classe n'appartient pas à ce professeur."})
                return

            with connection.cursor() as cur:
                cur.execute(
                    """
                    INSERT INTO teacher_courses (author_id, class_id, title, topic_code, semester, objective, focus, lessons, created_at, updated_at)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING id
                    """,
                    (
                        user["id"],
                        class_id,
                        title,
                        topic_code,
                        semester,
                        objective,
                        json_dump(focus),
                        json_dump(lessons),
                        utc_now(),
                        utc_now(),
                    ),
                )
                course_id = cur.fetchone()["id"]
            notify_class_members(connection, class_id, user["name"], "course", title)
            course = get_teacher_course_by_id(connection, course_id, user["id"])
            connection.commit()

        self.send_json(201, {"course": course})

    def handle_teacher_course_update(self):
        user = self.require_teacher()
        if not user:
            return

        body = self.parse_json_body()
        if body is None:
            return

        course_id = parse_int(body.get("id"))
        class_id = parse_int(body.get("classId"))
        title = str(body.get("title", "")).strip()
        topic_code = str(body.get("topicCode", "")).strip().upper()
        semester = str(body.get("semester", "")).strip()
        objective = str(body.get("objective", "")).strip()
        focus = normalize_focus(body.get("focus", []))
        lessons = normalize_lessons(body.get("lessons", []))

        if not course_id:
            self.send_json(400, {"error": "Cours introuvable."})
            return
        if len(title) < 4 or topic_code not in KNOWN_TOPICS or not semester or len(objective) < 12 or not lessons:
            self.send_json(400, {"error": "Titre, chapitre, objectif et parties du cours sont requis."})
            return
        if not class_id:
            self.send_json(400, {"error": "Sélectionnez la classe destinataire de ce cours."})
            return

        with db_connection() as connection:
            if not get_teacher_course_by_id(connection, course_id, user["id"]):
                self.send_json(404, {"error": "Cours professeur introuvable."})
                return
            if not get_teacher_class_row(connection, class_id, user["id"]):
                self.send_json(403, {"error": "Cette classe n'appartient pas à ce professeur."})
                return

            with connection.cursor() as cur:
                cur.execute(
                    """
                    UPDATE teacher_courses
                    SET class_id = %s, title = %s, topic_code = %s, semester = %s, objective = %s, focus = %s, lessons = %s, updated_at = %s
                    WHERE id = %s AND author_id = %s
                    """,
                    (
                        class_id,
                        title,
                        topic_code,
                        semester,
                        objective,
                        json_dump(focus),
                        json_dump(lessons),
                        utc_now(),
                        course_id,
                        user["id"],
                    ),
                )
            connection.commit()
            course = get_teacher_course_by_id(connection, course_id, user["id"])

        self.send_json(200, {"course": course})

    def handle_teacher_course_delete(self):
        user = self.require_teacher()
        if not user:
            return

        body = self.parse_json_body()
        if body is None:
            return

        course_id = parse_int(body.get("id"))
        if not course_id:
            self.send_json(400, {"error": "Cours introuvable."})
            return

        with db_connection() as connection:
            if not get_teacher_course_by_id(connection, course_id, user["id"]):
                self.send_json(404, {"error": "Cours professeur introuvable."})
                return
            with connection.cursor() as cur:
                cur.execute("DELETE FROM teacher_courses WHERE id = %s AND author_id = %s", (course_id, user["id"]))
            connection.commit()

        self.send_json(200, {"ok": True, "deletedId": course_id})

    def handle_teacher_exercise_create(self):
        user = self.require_teacher()
        if not user:
            return

        body = self.parse_json_body()
        if body is None:
            return

        title = str(body.get("title", "")).strip()
        topic_code = str(body.get("topicCode", "")).strip().upper()
        semester = str(body.get("semester", "")).strip()
        level = str(body.get("level", "")).strip().lower()
        duration = str(body.get("duration", "")).strip() or "20 min"
        statement = str(body.get("statement", "")).strip()
        correction = normalize_correction_blocks(body.get("correction", []))
        keywords = normalize_keywords(body.get("keywords", []))
        class_id = parse_int(body.get("classId"))

        if len(title) < 4 or topic_code not in KNOWN_TOPICS or not semester or level not in KNOWN_LEVELS or len(statement) < 20 or not correction:
            self.send_json(400, {"error": "Titre, chapitre, niveau, énoncé et correction sont requis."})
            return
        if not class_id:
            self.send_json(400, {"error": "Sélectionnez la classe destinataire de cet exercice."})
            return

        with db_connection() as connection:
            if not get_teacher_class_row(connection, class_id, user["id"]):
                self.send_json(403, {"error": "Cette classe n'appartient pas à ce professeur."})
                return

            with connection.cursor() as cur:
                cur.execute(
                    """
                    INSERT INTO teacher_exercises (author_id, class_id, title, topic_code, semester, level, duration, statement, correction, keywords, created_at, updated_at)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING id
                    """,
                    (
                        user["id"],
                        class_id,
                        title,
                        topic_code,
                        semester,
                        level,
                        duration,
                        statement,
                        json_dump(correction),
                        json_dump(keywords),
                        utc_now(),
                        utc_now(),
                    ),
                )
                exercise_id = cur.fetchone()["id"]
            notify_class_members(connection, class_id, user["name"], "exercise", title)
            exercise = get_teacher_exercise_by_id(connection, exercise_id, user["id"])
            connection.commit()

        self.send_json(201, {"exercise": exercise})

    def handle_teacher_exercise_update(self):
        user = self.require_teacher()
        if not user:
            return

        body = self.parse_json_body()
        if body is None:
            return

        exercise_id = parse_int(body.get("id"))
        class_id = parse_int(body.get("classId"))
        title = str(body.get("title", "")).strip()
        topic_code = str(body.get("topicCode", "")).strip().upper()
        semester = str(body.get("semester", "")).strip()
        level = str(body.get("level", "")).strip().lower()
        duration = str(body.get("duration", "")).strip() or "20 min"
        statement = str(body.get("statement", "")).strip()
        correction = normalize_correction_blocks(body.get("correction", []))
        keywords = normalize_keywords(body.get("keywords", []))

        if not exercise_id:
            self.send_json(400, {"error": "Exercice introuvable."})
            return
        if len(title) < 4 or topic_code not in KNOWN_TOPICS or not semester or level not in KNOWN_LEVELS or len(statement) < 20 or not correction:
            self.send_json(400, {"error": "Titre, chapitre, niveau, énoncé et correction sont requis."})
            return
        if not class_id:
            self.send_json(400, {"error": "Sélectionnez la classe destinataire de cet exercice."})
            return

        with db_connection() as connection:
            if not get_teacher_exercise_by_id(connection, exercise_id, user["id"]):
                self.send_json(404, {"error": "Exercice professeur introuvable."})
                return
            if not get_teacher_class_row(connection, class_id, user["id"]):
                self.send_json(403, {"error": "Cette classe n'appartient pas à ce professeur."})
                return

            with connection.cursor() as cur:
                cur.execute(
                    """
                    UPDATE teacher_exercises
                    SET class_id = %s, title = %s, topic_code = %s, semester = %s, level = %s, duration = %s, statement = %s, correction = %s, keywords = %s, updated_at = %s
                    WHERE id = %s AND author_id = %s
                    """,
                    (
                        class_id,
                        title,
                        topic_code,
                        semester,
                        level,
                        duration,
                        statement,
                        json_dump(correction),
                        json_dump(keywords),
                        utc_now(),
                        exercise_id,
                        user["id"],
                    ),
                )
            connection.commit()
            exercise = get_teacher_exercise_by_id(connection, exercise_id, user["id"])

        self.send_json(200, {"exercise": exercise})

    def handle_teacher_exercise_delete(self):
        user = self.require_teacher()
        if not user:
            return

        body = self.parse_json_body()
        if body is None:
            return

        exercise_id = parse_int(body.get("id"))
        if not exercise_id:
            self.send_json(400, {"error": "Exercice introuvable."})
            return

        with db_connection() as connection:
            if not get_teacher_exercise_by_id(connection, exercise_id, user["id"]):
                self.send_json(404, {"error": "Exercice professeur introuvable."})
                return
            with connection.cursor() as cur:
                cur.execute("DELETE FROM teacher_exercises WHERE id = %s AND author_id = %s", (exercise_id, user["id"]))
            connection.commit()

        self.send_json(200, {"ok": True, "deletedId": exercise_id})

    def handle_devoir_create(self):
        user = self.require_teacher()
        if not user:
            return

        body = self.parse_json_body()
        if body is None:
            return

        title = str(body.get("title", "")).strip()
        description = str(body.get("description", "")).strip()
        topic_code = str(body.get("topicCode", "")).strip().upper()
        level = str(body.get("level", "all")).strip().lower()
        due_date = str(body.get("dueDate", "")).strip()
        class_id = parse_int(body.get("classId"))

        if not title or not due_date or not class_id:
            self.send_json(400, {"error": "Titre, date limite et classe sont requis."})
            return

        now = datetime.now(timezone.utc).isoformat()
        with db_connection() as connection:
            # Verify teacher owns the class
            with connection.cursor() as cur:
                cur.execute(
                    "SELECT id FROM teacher_classes WHERE id = %s AND teacher_id = %s",
                    (class_id, user["id"]),
                )
                cls = cur.fetchone()
            if not cls:
                self.send_json(403, {"error": "Classe introuvable."})
                return
            with connection.cursor() as cur:
                cur.execute(
                    """INSERT INTO teacher_devoirs (teacher_id, class_id, title, description, topic_code, level, due_date, created_at)
                       VALUES (%s, %s, %s, %s, %s, %s, %s, %s) RETURNING id""",
                    (user["id"], class_id, title, description, topic_code, level, due_date, now),
                )
                devoir_id = cur.fetchone()["id"]
            connection.commit()

        self.send_json(201, {"ok": True, "id": devoir_id})

    def handle_devoir_delete(self):
        user = self.require_teacher()
        if not user:
            return

        body = self.parse_json_body()
        if body is None:
            return

        devoir_id = parse_int(body.get("id"))
        if not devoir_id:
            self.send_json(400, {"error": "Identifiant manquant."})
            return

        with db_connection() as connection:
            with connection.cursor() as cur:
                cur.execute(
                    "DELETE FROM teacher_devoirs WHERE id = %s AND teacher_id = %s",
                    (devoir_id, user["id"]),
                )
            connection.commit()

        self.send_json(200, {"ok": True})

    def handle_appearance(self):
        """GET → retourne l'apparence ; POST → sauvegarde l'apparence."""
        user = self.require_user()
        if not user:
            return

        if self.command == "GET":
            with db_connection() as connection:
                progress = get_progress(connection, user["id"])
            self.send_json(200, {"appearance": progress.get("appearance", {})})
            return

        body = self.parse_json_body()
        if body is None:
            return

        appearance = body.get("appearance")
        if not isinstance(appearance, dict):
            self.send_json(400, {"error": "appearance doit être un objet."})
            return

        # Validate allowed keys
        allowed_keys = {"theme", "primaryColor", "fontSize"}
        appearance = {k: v for k, v in appearance.items() if k in allowed_keys}

        with db_connection() as connection:
            with connection.cursor() as cur:
                cur.execute(
                    """
                    INSERT INTO progress (user_id, updated_at, appearance)
                    VALUES (%s, %s, %s)
                    ON CONFLICT(user_id) DO UPDATE SET
                        appearance = EXCLUDED.appearance,
                        updated_at = EXCLUDED.updated_at
                    """,
                    (user["id"], utc_now(), json_dump(appearance)),
                )
            connection.commit()

        self.send_json(200, {"ok": True})

    def handle_self_eval(self):
        user = self.require_user()
        if not user:
            return

        body = self.parse_json_body()
        if body is None:
            return

        exercise_id = str(body.get("exerciseId", "")).strip()
        rating = parse_int(body.get("rating"))

        if not exercise_id or rating not in (1, 2, 3):
            self.send_json(400, {"error": "exerciseId et rating (1-3) requis."})
            return

        with db_connection() as connection:
            with connection.cursor() as cur:
                cur.execute(
                    """
                    INSERT INTO self_evaluations (user_id, exercise_id, rating, created_at)
                    VALUES (%s, %s, %s, %s)
                    ON CONFLICT(user_id, exercise_id) DO UPDATE SET rating = EXCLUDED.rating, created_at = EXCLUDED.created_at
                    """,
                    (user["id"], exercise_id, rating, utc_now()),
                )
            connection.commit()

        self.send_json(200, {"ok": True})

    def handle_teacher_class_evaluations(self):
        user = self.require_teacher()
        if not user:
            return

        params = parse_qs(urlparse(self.path).query)
        class_id = parse_int((params.get("classId") or [None])[0])

        if not class_id:
            self.send_json(400, {"error": "classId requis."})
            return

        with db_connection() as connection:
            if not get_teacher_class_row(connection, class_id, user["id"]):
                self.send_json(403, {"error": "Cette classe ne vous appartient pas."})
                return

            with connection.cursor() as cur:
                cur.execute(
                    """
                    SELECT self_evaluations.exercise_id, self_evaluations.rating,
                           self_evaluations.created_at, users.id AS student_id,
                           users.name AS student_name, users.email AS student_email
                    FROM self_evaluations
                    JOIN users ON users.id = self_evaluations.user_id
                    JOIN class_memberships ON class_memberships.student_id = users.id
                    WHERE class_memberships.class_id = %s
                    ORDER BY self_evaluations.created_at DESC
                    """,
                    (class_id,),
                )
                rows = cur.fetchall()

        evaluations = [
            {
                "exerciseId": row["exercise_id"],
                "rating": row["rating"],
                "createdAt": row["created_at"],
                "studentId": row["student_id"],
                "studentName": row["student_name"],
                "studentEmail": row["student_email"],
            }
            for row in rows
        ]
        self.send_json(200, {"evaluations": evaluations})

    def handle_teacher_exercise_stats(self):
        """Agrège les auto-évaluations par exercice pour les élèves d'une classe."""
        user = self.require_teacher()
        if not user:
            return

        params = parse_qs(urlparse(self.path).query)
        class_id = parse_int((params.get("classId") or [None])[0])

        if not class_id:
            self.send_json(400, {"error": "classId requis."})
            return

        with db_connection() as connection:
            if not get_teacher_class_row(connection, class_id, user["id"]):
                self.send_json(403, {"error": "Cette classe ne vous appartient pas."})
                return

            # Exercices publiés par ce prof pour cette classe
            with connection.cursor() as cur:
                cur.execute(
                    "SELECT id, title FROM teacher_exercises WHERE class_id = %s AND author_id = %s ORDER BY created_at DESC",
                    (class_id, user["id"]),
                )
                exo_rows = cur.fetchall()

            stats = []
            for exo in exo_rows:
                with connection.cursor() as cur:
                    cur.execute(
                        """
                        SELECT self_evaluations.rating
                        FROM self_evaluations
                        JOIN class_memberships ON class_memberships.student_id = self_evaluations.user_id
                        WHERE class_memberships.class_id = %s
                          AND self_evaluations.exercise_id = %s
                        """,
                        (class_id, f"teacher-exercise-{exo['id']}"),
                    )
                    eval_rows = cur.fetchall()
                ratings = [r["rating"] for r in eval_rows]
                stats.append({
                    "exerciseId": str(exo["id"]),
                    "title": exo["title"],
                    "totalEvals": len(ratings),
                    "ok":   ratings.count(3),
                    "hard": ratings.count(2),
                    "fail": ratings.count(1),
                })

        self.send_json(200, {"stats": stats})

    def handle_teacher_file_upload(self):
        user = self.require_teacher()
        if not user:
            return

        content_type = self.headers.get("Content-Type", "")
        if "multipart/form-data" not in content_type:
            self.send_json(400, {"error": "multipart/form-data requis."})
            return

        boundary = ""
        for part in content_type.split(";"):
            part = part.strip()
            if part.startswith("boundary="):
                boundary = part[len("boundary="):].strip()
                break

        if not boundary:
            self.send_json(400, {"error": "Boundary multipart manquant."})
            return

        content_length = int(self.headers.get("Content-Length", "0"))
        if content_length > MAX_UPLOAD_SIZE:
            self.send_json(413, {"error": "Fichier trop volumineux (max 20 Mo)."})
            return

        raw = self.rfile.read(content_length)

        # Parsing multipart simple
        def parse_multipart(data, boundary):
            fields = {}
            sep = f"--{boundary}".encode()
            parts = data.split(sep)
            for part in parts[1:]:
                if part.strip() in (b"", b"--", b"--\r\n"):
                    continue
                if part.startswith(b"--"):
                    continue
                header_end = part.find(b"\r\n\r\n")
                if header_end == -1:
                    continue
                header_raw = part[:header_end].decode("utf-8", errors="replace")
                body = part[header_end + 4:]
                if body.endswith(b"\r\n"):
                    body = body[:-2]
                name = ""
                filename = ""
                mime = "application/octet-stream"
                for line in header_raw.splitlines():
                    if "Content-Disposition" in line:
                        for token in line.split(";"):
                            token = token.strip()
                            if token.startswith('name="'):
                                name = token[6:-1]
                            if token.startswith('filename="'):
                                filename = token[10:-1]
                    if "Content-Type:" in line:
                        mime = line.split("Content-Type:")[-1].strip()
                fields[name] = {"value": body, "filename": filename, "mime": mime}
            return fields

        fields = parse_multipart(raw, boundary)

        title = fields.get("title", {}).get("value", b"").decode("utf-8", errors="replace").strip()
        class_id_raw = fields.get("classId", {}).get("value", b"").decode("utf-8", errors="replace").strip()
        class_id = parse_int(class_id_raw) if class_id_raw else None
        file_field = fields.get("file", {})
        file_data = file_field.get("value", b"")
        original_name = file_field.get("filename", "").strip()
        mimetype = file_field.get("mime", "application/octet-stream").strip()

        if not title or len(title) < 2:
            self.send_json(400, {"error": "Titre requis (2 caractères minimum)."})
            return
        if not original_name or not file_data:
            self.send_json(400, {"error": "Fichier requis."})
            return
        if mimetype not in ALLOWED_MIMETYPES:
            self.send_json(400, {"error": "Type de fichier non autorisé."})
            return

        with db_connection() as connection:
            if class_id and not get_teacher_class_row(connection, class_id, user["id"]):
                self.send_json(403, {"error": "Cette classe ne vous appartient pas."})
                return

            ext = Path(original_name).suffix.lower()
            stored_name = f"{secrets.token_hex(16)}{ext}"
            (UPLOADS_DIR / stored_name).write_bytes(file_data)

            with connection.cursor() as cur:
                cur.execute(
                    """
                    INSERT INTO teacher_files (author_id, class_id, title, original_name, stored_name, mimetype, size, created_at)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s) RETURNING id
                    """,
                    (user["id"], class_id, title, original_name, stored_name, mimetype, len(file_data), utc_now()),
                )
                file_id = cur.fetchone()["id"]
            connection.commit()

        logger.info("Fichier uploadé par user id=%s : %s (%s)", user["id"], original_name, mimetype)
        self.send_json(201, {
            "file": {
                "id": file_id,
                "title": title,
                "originalName": original_name,
                "mimetype": mimetype,
                "size": len(file_data),
                "url": f"/uploads/{stored_name}",
                "classId": class_id,
                "createdAt": utc_now(),
            }
        })

    def handle_teacher_class_files(self):
        user = self.require_user()
        if not user:
            return

        params = parse_qs(urlparse(self.path).query)
        class_id = parse_int((params.get("classId") or [None])[0])

        with db_connection() as connection:
            with connection.cursor() as cur:
                if class_id:
                    cur.execute(
                        """
                        SELECT teacher_files.*, users.name AS author_name,
                               teacher_classes.name AS class_name
                        FROM teacher_files
                        JOIN users ON users.id = teacher_files.author_id
                        LEFT JOIN teacher_classes ON teacher_classes.id = teacher_files.class_id
                        WHERE teacher_files.class_id = %s
                        ORDER BY teacher_files.created_at DESC
                        """,
                        (class_id,),
                    )
                else:
                    cur.execute(
                        """
                        SELECT teacher_files.*, users.name AS author_name,
                               teacher_classes.name AS class_name
                        FROM teacher_files
                        JOIN users ON users.id = teacher_files.author_id
                        LEFT JOIN teacher_classes ON teacher_classes.id = teacher_files.class_id
                        WHERE teacher_files.author_id = %s
                        ORDER BY teacher_files.created_at DESC
                        """,
                        (user["id"],),
                    )
                rows = cur.fetchall()

        files = [
            {
                "id": row["id"],
                "title": row["title"],
                "originalName": row["original_name"],
                "mimetype": row["mimetype"],
                "size": row["size"],
                "url": f"/uploads/{row['stored_name']}",
                "classId": row["class_id"],
                "className": row["class_name"],
                "authorName": row["author_name"],
                "createdAt": row["created_at"],
            }
            for row in rows
        ]
        self.send_json(200, {"files": files})

    def handle_teacher_file_delete(self):
        user = self.require_teacher()
        if not user:
            return

        body = self.parse_json_body()
        if body is None:
            return

        file_id = parse_int(body.get("id"))
        if not file_id:
            self.send_json(400, {"error": "id requis."})
            return

        with db_connection() as connection:
            with connection.cursor() as cur:
                cur.execute(
                    "SELECT * FROM teacher_files WHERE id = %s AND author_id = %s",
                    (file_id, user["id"]),
                )
                row = cur.fetchone()
            if not row:
                self.send_json(404, {"error": "Fichier introuvable."})
                return

            stored_path = UPLOADS_DIR / row["stored_name"]
            if stored_path.exists():
                stored_path.unlink()

            with connection.cursor() as cur:
                cur.execute("DELETE FROM teacher_files WHERE id = %s", (file_id,))
            connection.commit()

        self.send_json(200, {"ok": True, "deletedId": file_id})

    def handle_serve_upload(self):
        user = self.require_user()
        if not user:
            return

        filename = self.path[len("/uploads/"):]
        if "/" in filename or ".." in filename:
            self.send_json(400, {"error": "Chemin invalide."})
            return

        file_path = UPLOADS_DIR / filename

        with db_connection() as connection:
            with connection.cursor() as cur:
                cur.execute(
                    "SELECT * FROM teacher_files WHERE stored_name = %s",
                    (filename,),
                )
                row = cur.fetchone()

        if not row or not file_path.exists():
            self.send_json(404, {"error": "Fichier introuvable."})
            return

        # Vérifier accès : prof auteur OU élève inscrit dans la classe du fichier
        is_author = user["role"] == "teacher" and row["author_id"] == user["id"]
        if not is_author:
            if row["class_id"]:
                with db_connection() as connection:
                    with connection.cursor() as cur:
                        cur.execute(
                            "SELECT id FROM class_memberships WHERE class_id = %s AND student_id = %s",
                            (row["class_id"], user["id"]),
                        )
                        membership = cur.fetchone()
                if not membership:
                    self.send_json(403, {"error": "Accès refusé."})
                    return

        data = file_path.read_bytes()
        self.send_response(200)
        self.send_header("Content-Type", row["mimetype"])
        self.send_header("Content-Length", str(len(data)))
        self.send_header(
            "Content-Disposition",
            f'inline; filename="{row["original_name"]}"',
        )
        self.end_headers()
        self.wfile.write(data)

    def handle_teacher_class_progress(self):
        user = self.require_teacher()
        if not user:
            return

        params = parse_qs(urlparse(self.path).query)
        class_id = parse_int((params.get("classId") or [None])[0])

        if not class_id:
            self.send_json(400, {"error": "classId requis."})
            return

        # Correspondance préfixe d'ID d'exercice → code de thème
        ID_PREFIXES = {
            "exo-sys": "SYSLIN",
            "exo-poly": "POLY",
            "exo-fvar": "FVAR",
            "exo-frat": "FRAT",
        }

        with db_connection() as connection:
            if not get_teacher_class_row(connection, class_id, user["id"]):
                self.send_json(403, {"error": "Cette classe ne vous appartient pas."})
                return

            with connection.cursor() as cur:
                cur.execute(
                    """
                    SELECT users.id, users.name, users.email, class_memberships.joined_at
                    FROM class_memberships
                    JOIN users ON users.id = class_memberships.student_id
                    WHERE class_memberships.class_id = %s
                    ORDER BY LOWER(users.name) ASC
                    """,
                    (class_id,),
                )
                students = cur.fetchall()

            result = []
            for student in students:
                with connection.cursor() as cur:
                    cur.execute(
                        "SELECT * FROM progress WHERE user_id = %s",
                        (student["id"],),
                    )
                    row = cur.fetchone()

                if row:
                    viewed = json_load(row["viewed_exercises"], [])
                    favorites = json_load(row["favorite_exercises"], [])
                    generated = json_load(row["generated_exercises"], [])
                    questions = json_load(row["recent_questions"], [])
                    quiz = json_load(row["quiz_history"], [])
                else:
                    viewed = favorites = generated = questions = quiz = []

                topic_counts = {"SYSLIN": 0, "POLY": 0, "FVAR": 0, "FRAT": 0}
                for ex_id in viewed:
                    s = str(ex_id).lower()
                    for prefix, topic in ID_PREFIXES.items():
                        if s.startswith(prefix):
                            topic_counts[topic] += 1
                            break
                    else:
                        if s.startswith("teacher-exercise-"):
                            db_ex_id = parse_int(s.replace("teacher-exercise-", ""))
                            if db_ex_id:
                                with connection.cursor() as cur:
                                    cur.execute(
                                        "SELECT topic_code FROM teacher_exercises WHERE id = %s",
                                        (db_ex_id,),
                                    )
                                    ex_row = cur.fetchone()
                                if ex_row and ex_row["topic_code"] in topic_counts:
                                    topic_counts[ex_row["topic_code"]] += 1

                # Self-evaluations
                with connection.cursor() as cur:
                    cur.execute(
                        "SELECT exercise_id, rating FROM self_evaluations WHERE user_id = %s",
                        (student["id"],),
                    )
                    eval_rows = cur.fetchall()
                self_evals = {r["exercise_id"]: r["rating"] for r in eval_rows}
                ok_count   = sum(1 for v in self_evals.values() if v == 3)
                hard_count = sum(1 for v in self_evals.values() if v == 2)
                fail_count = sum(1 for v in self_evals.values() if v == 1)
                last_activity = row["updated_at"] if row else None

                result.append({
                    "id": student["id"],
                    "name": student["name"],
                    "email": student["email"],
                    "joinedAt": student["joined_at"],
                    "lastActivity": last_activity,
                    "selfEvals": self_evals,
                    "stats": {
                        "viewedCount": len(viewed),
                        "favoritesCount": len(favorites),
                        "generatedCount": len(generated),
                        "questionsCount": len(questions),
                        "quizCount": len(quiz),
                        "topicBreakdown": topic_counts,
                        "okCount": ok_count,
                        "hardCount": hard_count,
                        "failCount": fail_count,
                    },
                })

        self.send_json(200, {"students": result})

    def handle_class_leaderboard(self):
        """Retourne le classement des élèves d'une classe par score d'activité."""
        user = self.require_user()
        if not user:
            return

        params = parse_qs(urlparse(self.path).query)
        class_id = parse_int((params.get("classId") or [None])[0])

        if not class_id:
            self.send_json(400, {"error": "classId requis."})
            return

        with db_connection() as connection:
            # Verify user belongs to this class (as student or teacher)
            is_teacher = user["role"] == "teacher"
            if is_teacher:
                class_row = get_teacher_class_row(connection, class_id, user["id"])
                if not class_row:
                    self.send_json(403, {"error": "Cette classe ne vous appartient pas."})
                    return
            else:
                with connection.cursor() as cur:
                    cur.execute(
                        "SELECT id FROM class_memberships WHERE class_id = %s AND student_id = %s",
                        (class_id, user["id"]),
                    )
                    member = cur.fetchone()
                if not member:
                    self.send_json(403, {"error": "Vous n'êtes pas membre de cette classe."})
                    return

            with connection.cursor() as cur:
                cur.execute(
                    """
                    SELECT users.id, users.name, users.email
                    FROM class_memberships
                    JOIN users ON users.id = class_memberships.student_id
                    WHERE class_memberships.class_id = %s
                    ORDER BY LOWER(users.name) ASC
                    """,
                    (class_id,),
                )
                students = cur.fetchall()

            leaderboard = []
            for student in students:
                with connection.cursor() as cur:
                    cur.execute(
                        "SELECT * FROM progress WHERE user_id = %s",
                        (student["id"],),
                    )
                    row = cur.fetchone()

                if row:
                    viewed = json_load(row["viewed_exercises"], [])
                    generated = json_load(row["generated_exercises"], [])
                    questions = json_load(row["recent_questions"], [])
                else:
                    viewed = generated = questions = []

                # Score = viewedCount + generatedCount*2 + questionsCount
                score = len(viewed) + len(generated) * 2 + len(questions)
                leaderboard.append({
                    "name": student["name"],
                    "email": student["email"],
                    "score": score,
                    "viewedCount": len(viewed),
                    "generatedCount": len(generated),
                    "questionsCount": len(questions),
                })

        leaderboard.sort(key=lambda x: x["score"], reverse=True)
        self.send_json(200, {"leaderboard": leaderboard})

    def handle_teacher_notify_student(self):
        """Envoie une notification à un élève d'une des classes du professeur."""
        user = self.require_teacher()
        if not user:
            return
        body = self.parse_json_body()
        if body is None:
            return
        student_id = parse_int(body.get("studentId"))
        class_id   = parse_int(body.get("classId"))
        message    = str(body.get("message", "")).strip()
        if not student_id or not class_id or not message:
            self.send_json(400, {"error": "studentId, classId et message requis."})
            return
        with db_connection() as connection:
            if not get_teacher_class_row(connection, class_id, user["id"]):
                self.send_json(403, {"error": "Cette classe ne vous appartient pas."})
                return
            with connection.cursor() as cur:
                cur.execute(
                    "SELECT id FROM class_memberships WHERE class_id = %s AND student_id = %s",
                    (class_id, student_id),
                )
                member = cur.fetchone()
            if not member:
                self.send_json(403, {"error": "Cet élève n'est pas dans votre classe."})
                return
            with connection.cursor() as cur:
                cur.execute(
                    "INSERT INTO notifications (user_id, type, message, is_read, created_at) VALUES (%s, 'teacher', %s, 0, %s)",
                    (student_id, f"{user['name']} : {message}", utc_now()),
                )
            connection.commit()
        self.send_json(200, {"ok": True})

    def handle_notifications_get(self):
        user = self.require_user()
        if not user:
            return
        with db_connection() as connection:
            with connection.cursor() as cur:
                cur.execute(
                    "SELECT id, type, message, is_read, created_at FROM notifications WHERE user_id = %s ORDER BY created_at DESC LIMIT 30",
                    (user["id"],),
                )
                rows = cur.fetchall()
        notifs = [
            {"id": r["id"], "type": r["type"], "message": r["message"], "isRead": bool(r["is_read"]), "createdAt": r["created_at"]}
            for r in rows
        ]
        self.send_json(200, {"notifications": notifs})

    def handle_notifications_read(self):
        user = self.require_user()
        if not user:
            return
        with db_connection() as connection:
            with connection.cursor() as cur:
                cur.execute("UPDATE notifications SET is_read = 1 WHERE user_id = %s", (user["id"],))
            connection.commit()
        self.send_json(200, {"ok": True})

    def handle_auth_refresh(self):
        body = self.parse_json_body()
        if body is None:
            return
        refresh_token = str(body.get("refreshToken", "")).strip()
        if not refresh_token:
            self.send_json(400, {"error": "Token de rafraîchissement manquant."})
            return
        with db_connection() as connection:
            with connection.cursor() as cur:
                cur.execute(
                    "SELECT user_id FROM refresh_tokens WHERE token = %s AND expires_at > %s",
                    (refresh_token, utc_now()),
                )
                row = cur.fetchone()
            if not row:
                self.send_json(401, {"error": "Token de rafraîchissement invalide ou expiré."})
                return
            token = self.create_session(connection, row["user_id"])
        self.send_json(200, {"token": token})

    def handle_ai_correct(self):
        user = self.require_user()
        if not user:
            return
        if not check_ai_rate_limit(user["id"]):
            self.send_json(429, {"error": "Trop de requêtes IA. Veuillez patienter."})
            return
        body = self.parse_json_body()
        if body is None:
            return
        statement = str(body.get("statement", "")).strip()
        student_answer = str(body.get("studentAnswer", "")).strip()
        topic = str(body.get("topic", "MATH")).strip()
        if not statement or not student_answer:
            self.send_json(400, {"error": "Énoncé et réponse de l'élève requis."})
            return
        system_prompt = (
            "Tu es un tuteur pédagogique en mathématiques du BUT Génie Chimique Génie des Procédés. "
            "Corrige la réponse de l'élève de façon bienveillante et précise. "
            "Réponds uniquement en JSON valide avec ces clés : "
            "isCorrect (bool), score (entier entre 0 et 5), feedback (string courte d'encouragement/bilan, max 3 phrases), correction (string détaillée). "
            "Utilise la notation LaTeX standard : \\(...\\) pour les formules en ligne."
        )
        user_prompt = (
            f"Thème : {topic}\n"
            f"Énoncé :\n{statement}\n\n"
            f"Réponse de l'élève :\n{student_answer}\n\n"
            "Évalue et corrige cette réponse."
        )
        try:
            raw_text = _clean_ai_text(ai_request(system_prompt, user_prompt))
            json_str = _extract_json_from_text(raw_text, is_array=False)
            if not json_str:
                raise ValueError("Réponse IA non JSON.")
            result = parse_ai_json(json_str)
            result.setdefault("isCorrect", False)
            result.setdefault("score", 0)
            result.setdefault("feedback", "Correction générée.")
            result.setdefault("correction", raw_text)
            self.send_json(200, result)
        except Exception as error:
            self.send_json(503, {"error": str(error)})

    def handle_ai_chat(self):
        user = self.require_user()
        if not user:
            return

        if not check_ai_rate_limit(user["id"]):
            logger.warning("Rate limit dépassé (chat) pour user id=%s", user["id"])
            self.send_json(429, {"error": "Trop de requêtes IA. Veuillez patienter avant de réessayer."})
            return

        body = self.parse_json_body()
        if body is None:
            return

        prompt = str(body.get("prompt", "")).strip()
        context = str(body.get("context", "")).strip()
        mode = str(body.get("mode", "direct")).strip()
        if not prompt:
            self.send_json(400, {"error": "Prompt is required."})
            return

        logger.info("Chat IA demandé par user id=%s (mode=%s)", user["id"], mode)

        fmt = (
            "FORMATAGE OBLIGATOIRE : utilise uniquement le markdown standard — **gras**, *italique*, `code`, "
            "## Titre, - liste. N'utilise JAMAIS de balises HTML (<strong>, <em>, <b>, <br>, etc.). "
        )
        if mode == "socratic":
            system_prompt = (
                "Tu es un tuteur de mathématiques pour des étudiants de BUT Génie Chimique Génie des Procédés. "
                "Tu utilises la méthode Socratique : tu ne donnes JAMAIS la réponse directement. "
                "Tu identifies d'abord où l'étudiant est bloqué, puis tu poses des questions guidantes "
                "pour l'amener à trouver lui-même. Exemples : 'Qu'as-tu essayé jusqu'ici ?', "
                "'Quelle formule s'applique ici selon toi ?', 'Si tu avais x = …, que ferais-tu ensuite ?'. "
                "Tu valides les étapes correctes et challenges doucement les erreurs par des questions. "
                "Utilise un langage mathématique rigoureux (symboles ∈, ⟹, ⟺, ∀, ∃) et la notation LaTeX : "
                "\\(...\\) pour les formules en ligne, \\[...\\] pour les formules centrées. "
                "Écris les accents directement : é, è, à, ç, ê, î, ô, û — jamais de commandes LaTeX d'accent. "
                + fmt +
                "Réponds toujours en français."
            )
        else:
            system_prompt = (
                "Tu es un tuteur de mathématiques pour des étudiants de BUT Génie Chimique Génie des Procédés. "
                "Tu expliques clairement, avec un lien explicite vers les procédés, les bilans matière et énergie, "
                "les transferts thermiques et la physico-chimie. Quand tu proposes un exercice, donne l'énoncé "
                "structuré (données, questions numérotées), puis une correction détaillée par étapes logiques. "
                "Emploie un langage mathématique précis : utilise les symboles ∈, ⟹, ⟺, ∀, ∃, "
                "les notations ensemblistes (ℝ, ℂ, ℕ) et les opérateurs ∂, ∫, ∑, ∏ selon le contexte. "
                "Notation LaTeX standard : \\(...\\) pour les formules en ligne et \\[...\\] pour les formules en display. "
                "Écris les accents directement : é, è, à, ç, ê, î, ô, û — jamais de commandes LaTeX d'accent. "
                + fmt +
                "Réponds toujours en français."
            )

        try:
            text = ai_request(
                system_prompt,
                f"Contexte de l'application:\n{context}\n\nDemande de l'etudiant:\n{prompt}",
            )
            text = _html_to_markdown(_clean_ai_text(normalize_ai_text(text or "")))
            self.send_json(200, {"text": text or "Aucune reponse textuelle retournee."})
        except Exception as error:
            self.send_json(503, {"error": str(error)})

    def handle_ai_generate_flashcards(self):
        user = self.require_user()
        if not user:
            return
        if not check_ai_rate_limit(user["id"]):
            self.send_json(429, {"error": "Trop de requêtes IA. Veuillez patienter."})
            return
        body = self.parse_json_body()
        if body is None:
            return
        text = str(body.get("text", "")).strip()
        topic = str(body.get("topic", "GENERAL")).strip()
        count = min(max(parse_int(body.get("count")) or 5, 1), 8)
        if not text:
            self.send_json(400, {"error": "Texte de cours requis."})
            return
        system_prompt = (
            "Tu es un assistant pedagogique en mathematiques pour BUT Genie Chimique Genie des Procedes. "
            "A partir d'un texte de cours, genere des flashcards de revision en JSON. "
            "Retourne UNIQUEMENT un tableau JSON valide. "
            "Chaque flashcard est un objet avec exactement deux cles : "
            "heading (string, titre court de la notion, max 6 mots) et "
            "items (tableau de 2 a 3 strings, points cles a retenir). "
            "Notation mathematique OBLIGATOIRE : entoure CHAQUE formule ou expression mathematique avec \\(...\\) "
            "pour l'inline (ex : \\(f'(x) = 2x\\), \\(\\frac{a}{b}\\), \\(\\int_a^b f\\,dx\\)). "
            "Ne jamais ecrire de formule en texte brut sans ces delimiteurs LaTeX. "
            "Exemple : [{\"heading\": \"Derivee du produit\", \"items\": [\"\\((uv)' = u'v + uv'\\)\", \"Choisir \\(u\\) derivable et \\(v'\\) integrable\"]}]"
        )
        user_prompt = (
            f"Texte de cours (theme: {topic}) :\n{text[:3000]}\n\n"
            f"Genere exactement {count} flashcards sur les points cles de ce cours."
        )
        try:
            raw = _repair_json_strings(_clean_ai_text(ai_request(system_prompt, user_prompt)))
            json_str = _extract_json_from_text(raw, is_array=True)
            if not json_str:
                raise ValueError("Reponse IA non JSON.")
            cards = parse_ai_json(json_str)
            if not isinstance(cards, list):
                raise ValueError("Format invalide.")
            result = []
            for card in cards[:count]:
                result.append({
                    "heading": str(card.get("heading", "Notion")).strip(),
                    "items": [str(i) for i in card.get("items", []) if str(i).strip()][:3],
                })
            self.send_json(200, {"cards": result})
        except Exception as err:
            self.send_json(503, {"error": str(err)})

    def handle_ai_exercise(self):
        user = self.require_user()
        if not user:
            return

        if not check_ai_rate_limit(user["id"]):
            logger.warning("Rate limit dépassé (exercice) pour user id=%s", user["id"])
            self.send_json(429, {"error": "Trop de requêtes IA. Veuillez patienter avant de réessayer."})
            return

        body = self.parse_json_body()
        if body is None:
            return

        topic = str(body.get("topic", "")).strip()
        semester = str(body.get("semester", "")).strip()
        level = str(body.get("level", "")).strip()
        goal = str(body.get("goal", "")).strip()
        exercise_type = str(body.get("type", "")).strip()
        mode = str(body.get("mode", "guide")).strip() or "guide"
        exercise_type_expectation = {
            "pure": "maths pures, sans contexte procede, avec des equations, fonctions ou calculs a resoudre directement",
            "procede": "application procede, avec un contexte de genie des procedes et une interpretation physique",
        }.get(exercise_type, exercise_type or "application procede")

        method_expectations = {
            "SYSLIN": (
                "Pour les systemes lineaires de premiere annee, choisir d'abord entre substitution et pivot de Gauss, "
                "puis conclure proprement sur solution unique, incompatibilite ou verification finale."
            ),
            "POLY": (
                "Pour les polynomes, ordonner les termes par degre, tester une racine simple si c'est pertinent, "
                "puis utiliser le theoreme du facteur pour obtenir une factorisation exploitable."
            ),
            "FVAR": (
                "Pour les fonctions a plusieurs variables, fixer correctement la variable qui reste constante, "
                "verifier une EDP simple par substitution directe et annoncer l'ordre d'integration avant le calcul."
            ),
            "FRAT": (
                "Pour les fractions rationnelles, comparer les degres, faire une division euclidienne si necessaire, "
                "factoriser le denominateur, poser la bonne forme de decomposition puis verifier le resultat."
            ),
        }
        method_expectation = method_expectations.get(
            topic,
            "Rappeler d'abord la methode attendue, appliquer les calculs de maniere ordonnee, puis conclure avec une verification ou une interpretation.",
        )

        logger.info("Génération exercice IA demandée par user id=%s (topic=%s, level=%s)", user["id"], topic, level)

        # Topics where a graphical component makes sense
        graph_topics = {"FVAR", "SYSLIN"}
        needs_graph = topic in graph_topics

        is_procede = exercise_type == "procede"

        # Topic-specific math requirements
        topic_math_requirements = {
            "SYSLIN": (
                "L'énoncé DOIT contenir le système d'équations en LaTeX display, par exemple : "
                "\\[\\begin{cases} 2x + 3y = 7 \\\\\\\\ x - 2y = -3 \\end{cases}\\] "
                "avec des valeurs numériques concrètes. Interdiction de décrire le système en texte sans LaTeX."
            ),
            "POLY": (
                "L'énoncé DOIT contenir l'expression du polynôme en LaTeX, par exemple : "
                "\\(P(x) = 3x^3 - 2x^2 + x - 5\\). "
                "Toutes les racines, factorisations et calculs doivent apparaître en LaTeX."
            ),
            "FVAR": (
                "L'énoncé DOIT contenir la définition de la fonction en LaTeX, par exemple : "
                "\\(f(x,y) = x^2 y + e^{xy}\\), et poser des questions sur les dérivées partielles "
                "\\(\\frac{\\partial f}{\\partial x}\\) ou des intégrales doubles \\(\\iint_D f\\,dx\\,dy\\). "
                "Toutes les expressions mathématiques DOIVENT être en LaTeX."
            ),
            "FRAT": (
                "L'énoncé DOIT contenir la fraction rationnelle en LaTeX, par exemple : "
                "\\(F(x) = \\frac{2x+1}{x^2 - 3x + 2}\\). "
                "La décomposition en éléments simples doit être posée avec les inconnues A, B en LaTeX."
            ),
        }
        topic_math_req = topic_math_requirements.get(topic, (
            "L'énoncé DOIT contenir au moins 2 expressions ou équations mathématiques en LaTeX. "
            "Interdiction de générer un énoncé sans équations."
        ))

        system_prompt = (
            "IMPORTANT : ta réponse doit commencer DIRECTEMENT par { et se terminer par }. "
            "Aucun texte, titre, explication ou markdown avant ou après le JSON. "
            "Tu génères uniquement du JSON valide pour une application de soutien en mathématiques du BUT GCGP. "
            "Retourne un objet JSON avec exactement les clés suivantes : title, statement, correction, keywords, duration"
            + (", graphData" if needs_graph else "") + ". "
            "correction doit être un tableau de exactement 3 chaînes, keywords un tableau de chaînes, duration une chaîne courte. "
            + (
                "Type 'application procédés' : l'énoncé doit s'ancrer dans une situation industrielle concrète "
                "(réacteur, colonne, échangeur, bilan matière, procédé pharmaceutique…) avec des données chiffrées et leurs unités. "
                if is_procede else
                "Type 'maths pures' : énoncé direct centré sur les calculs, sans mise en situation industrielle. "
            )
            + "RÈGLE ABSOLUE : un énoncé sans équations LaTeX est INVALIDE. "
            + topic_math_req + " "
            "Les environnements LaTeX (cases, pmatrix, bmatrix, array) doivent TOUJOURS être encadrés dans \\[...\\]. "
            "Le niveau de difficulté doit guider librement la complexité : nombre de questions, imbrication des calculs, richesse des données. "
            "Les questions doivent être numérotées et progressives. "
            "Si le mode est 'guide', ajouter une courte aide après chaque question. "
            "La correction (3 blocs) doit : (1) rappeler la méthode, (2) résoudre entièrement avec calculs détaillés et justifiés en LaTeX, "
            "(3) vérifier le résultat" + (" et l'interpréter dans le contexte procédé." if is_procede else ".") + " "
            "Rédige des paragraphes logiques, jamais de liste 'Étape 1, Étape 2'. "
            "Emploie un langage mathématique rigoureux : ∈, ⟹, ⟺, ℝ, ℂ. "
            "Notation LaTeX OBLIGATOIRE : \\(...\\) pour l'inline, \\[...\\] pour les blocs et environnements. Jamais de formule en texte brut. "
            "Caractères accentués directement (é, è, à, ç…), jamais de commandes LaTeX d'accent."
            + (
                " graphData : {\"axes\":{\"xMin\":n,\"xMax\":n,\"yMin\":n,\"yMax\":n,\"xLabel\":str,\"yLabel\":str},"
                "\"points\":[{\"id\":str,\"label\":str,\"x\":n,\"y\":n,\"hint\":str}],"
                "\"curves\":[{\"expr\":str,\"label\":str}]}. "
                "Points = positions attendues exactes. Courbes = expression JS en x. graphData:null si non pertinent."
                if needs_graph else ""
            )
        )

        user_prompt = (
            f"Theme: {topic}\nSemestre: {semester}\nNiveau: {level}\nType: {exercise_type_expectation}\n"
            f"Mode: {mode}\nObjectif: {goal or 'application procede'}\n"
            f"Methode attendue: {method_expectation}\n"
            "Genere un exercice original et varié, adapté au niveau demandé. "
            "La correction doit être explicative et traiter chaque question avec les calculs complets."
            + (" Inclure graphData si pertinent." if needs_graph else "")
        )
        try:
            raw_text = _repair_json_strings(_clean_ai_text(ai_request(system_prompt, user_prompt)))
            logger.info("RAW AI RESPONSE (first 400 chars): %r", raw_text[:400])
            json_str = _extract_json_from_text(raw_text, is_array=False)
            if not json_str:
                raise ValueError("Le modèle n'a pas retourné de JSON valide.")
            logger.info("EXTRACTED JSON (first 300 chars): %r", json_str[:300])
            try:
                generated = parse_ai_json(json_str)
            except Exception as parse_err:
                logger.error("PARSE FAILED on: %r", json_str[:500])
                raise parse_err
            required_keys = {"title", "statement", "correction", "keywords", "duration"}
            if not required_keys.issubset(generated.keys()):
                raise ValueError("Réponse JSON incomplète du modèle.")
            # Normalize text fields (NFC + fix char-by-char newlines)
            generated["title"] = normalize_ai_text(generated.get("title", ""))
            generated["statement"] = normalize_ai_text(generated.get("statement", ""))
            if isinstance(generated.get("correction"), list):
                generated["correction"] = [normalize_ai_text(c) for c in generated["correction"]]
            # Validate and sanitize graphData if present
            gd = generated.get("graphData")
            if gd and isinstance(gd, dict):
                axes = gd.get("axes", {})
                points = gd.get("points", [])
                if not (isinstance(axes, dict) and isinstance(points, list)):
                    generated.pop("graphData", None)
            elif "graphData" in generated and not gd:
                generated.pop("graphData", None)
            self.send_json(200, generated)
        except (json.JSONDecodeError, ValueError) as error:
            self.send_json(502, {"error": f"Format de réponse invalide : {error}"})
        except Exception as error:
            self.send_json(503, {"error": str(error)})

    def handle_ai_generate_qcm(self):
        """Génère un QCM (questions à choix multiples) sur un thème donné."""
        user = self.require_user()
        if not user:
            return

        if not check_ai_rate_limit(user["id"]):
            self.send_json(429, {"error": "Trop de requêtes IA. Veuillez patienter."})
            return

        body = self.parse_json_body()
        if body is None:
            return

        topic = str(body.get("topic", "")).strip()
        level = str(body.get("level", "intermediaire")).strip()
        count = min(parse_int(body.get("count")) or 5, 10)

        if not topic:
            self.send_json(400, {"error": "topic requis."})
            return

        system_prompt = (
            "IMPORTANT : ta réponse doit commencer DIRECTEMENT par [ et se terminer par ]. "
            "Aucun texte avant ou après le JSON. "
            "Tu génères uniquement du JSON valide. "
            "Retourne un tableau JSON de questions QCM avec exactement les clés suivantes par question : "
            "question (string), options (tableau de 4 strings étiquetés A/B/C/D), correct (string 'A', 'B', 'C' ou 'D'), explanation (string). "
            "Le contenu doit être en français, adapté au niveau BUT Génie Chimique, rigoureux mathématiquement. "
            "Les distracteurs (mauvaises réponses) doivent être plausibles et correspondre à des erreurs classiques. "
            "L'explication doit justifier la bonne réponse et pointer l'erreur des distracteurs. "
            "Notation LaTeX OBLIGATOIRE : entoure chaque formule avec \\(...\\) pour l'inline et \\[...\\] pour le bloc. Ne jamais écrire de formule sans délimiteurs."
        )
        user_prompt = (
            f"Theme: {topic}\nNiveau: {level}\n"
            f"Genere exactement {count} questions QCM sur ce theme mathematique. "
            "Chaque question doit avoir 4 propositions (A, B, C, D), une seule bonne reponse, et une explication courte."
        )

        logger.info("Génération QCM IA demandée par user id=%s (topic=%s, level=%s, count=%s)", user["id"], topic, level, count)

        try:
            raw_text = _clean_ai_text(ai_request(system_prompt, user_prompt))
            json_str = _extract_json_from_text(raw_text, is_array=True)
            if not json_str:
                raise ValueError("Le modèle n'a pas retourné un tableau JSON valide.")
            questions = parse_ai_json(json_str)
            if not isinstance(questions, list):
                raise ValueError("La réponse JSON n'est pas un tableau.")
            # Validate and normalize each question
            validated = []
            for q in questions:
                if not isinstance(q, dict):
                    continue
                if not all(k in q for k in ("question", "options", "correct", "explanation")):
                    continue
                # Normalize options: accept dict {A:..., B:..., C:..., D:...} or list
                opts = q["options"]
                if isinstance(opts, dict):
                    q["options"] = [opts.get("A", ""), opts.get("B", ""), opts.get("C", ""), opts.get("D", "")]
                elif not isinstance(opts, list):
                    q["options"] = ["", "", "", ""]
                validated.append(q)
            if not validated:
                raise ValueError("Aucune question valide retournée.")
            self.send_json(200, {"questions": validated})
        except (json.JSONDecodeError, ValueError) as error:
            self.send_json(502, {"error": f"Format de réponse invalide : {error}"})
        except Exception as error:
            self.send_json(503, {"error": str(error)})

    def handle_ai_analyze_image(self):
        """Analyse une image (problème de maths) via Gemini Vision."""
        user = self.require_user()
        if not user:
            return
        if not check_ai_rate_limit(user["id"]):
            self.send_json(429, {"error": "Trop de requêtes IA. Veuillez patienter."})
            return
        body = self.parse_json_body()
        if body is None:
            return
        image_b64 = str(body.get("image", "")).strip()
        mime_type = str(body.get("mimeType", "image/jpeg")).strip()
        prompt = str(body.get("prompt", "Analyse ce problème de mathématiques.")).strip()
        if not image_b64:
            self.send_json(400, {"error": "image (base64) requis."})
            return
        if not GEMINI_API_KEY:
            self.send_json(503, {"error": "La clé API Gemini n'est pas configurée sur ce serveur."})
            return
        url = (
            f"https://generativelanguage.googleapis.com/v1beta/models/"
            f"gemini-1.5-flash:generateContent?key={GEMINI_API_KEY}"
        )
        payload = {
            "contents": [{
                "parts": [
                    {
                        "inlineData": {
                            "mimeType": mime_type,
                            "data": image_b64,
                        }
                    },
                    {"text": (
                        "Tu es un tuteur de mathématiques pour des étudiants de BUT Génie Chimique Génie des Procédés. "
                        "Analyse cette image et réponds en français. "
                        "Utilise la notation LaTeX : \\(...\\) pour les formules en ligne et \\[...\\] pour les formules centrées. "
                        f"Demande de l'étudiant : {prompt}"
                    )},
                ]
            }],
            "generationConfig": {"temperature": 0.4},
        }
        req = Request(
            url,
            data=json_dump(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        try:
            ssl_ctx = build_ssl_context()
            with urlopen(req, timeout=60, context=ssl_ctx) as resp:
                data = json.loads(resp.read().decode("utf-8"))
            try:
                text = data["candidates"][0]["content"]["parts"][0]["text"]
            except (KeyError, IndexError, TypeError):
                error_msg = data.get("error", {}).get("message", "Réponse Gemini invalide.")
                self.send_json(503, {"error": error_msg})
                return
            self.send_json(200, {"response": text})
        except Exception as error:
            self.send_json(503, {"error": str(error)})

    def handle_teacher_class_analytics(self):
        """Statistiques avancées de classe : topicStats, progressOverTime, studentRankings, weakTopics."""
        user = self.require_teacher()
        if not user:
            return
        params = parse_qs(urlparse(self.path).query)
        class_id = parse_int((params.get("classId") or [None])[0])
        if not class_id:
            self.send_json(400, {"error": "classId requis."})
            return
        with db_connection() as connection:
            if not get_teacher_class_row(connection, class_id, user["id"]):
                self.send_json(403, {"error": "Cette classe ne vous appartient pas."})
                return
            # Topic stats : avgScore (1=fail,2=hard,3=ok) per exercise_id prefix
            with connection.cursor() as cur:
                cur.execute(
                    """
                    SELECT se.exercise_id,
                           AVG(se.rating::REAL) AS avg_rating,
                           COUNT(*) AS total_evals,
                           COUNT(DISTINCT se.user_id) AS student_count
                    FROM self_evaluations se
                    JOIN class_memberships cm ON cm.student_id = se.user_id
                    WHERE cm.class_id = %s
                    GROUP BY se.exercise_id
                    """,
                    (class_id,),
                )
                topic_rows = cur.fetchall()
            # Aggregate by topic code (exercise_id format: "TOPICCODE-..." or "teacher-exercise-N")
            topic_agg = {}
            for row in topic_rows:
                eid = row["exercise_id"]
                # Exercise IDs: "exo-syslin-01" → parts[1], "teacher-exercise-N" → skip
                parts = eid.lower().split("-")
                if len(parts) >= 2 and parts[0] == "exo":
                    topic_code = parts[1].upper()
                elif len(parts) >= 2 and parts[0] == "teacher":
                    continue  # teacher exercises tracked separately
                else:
                    topic_code = parts[0].upper() if parts else "UNKNOWN"
                if topic_code not in topic_agg:
                    topic_agg[topic_code] = {"sum": 0.0, "count": 0, "students": set()}
                topic_agg[topic_code]["sum"] += row["avg_rating"] * row["total_evals"]
                topic_agg[topic_code]["count"] += row["total_evals"]
                topic_agg[topic_code]["students"].add(row["student_count"])
            topic_stats = []
            for code, agg in topic_agg.items():
                avg = round(agg["sum"] / agg["count"], 2) if agg["count"] > 0 else 0
                topic_stats.append({
                    "topic": code,
                    "avgScore": avg,
                    "totalEvals": agg["count"],
                    "studentCount": max(agg["students"]) if agg["students"] else 0,
                })
            # Progress over time
            with connection.cursor() as cur:
                cur.execute(
                    """
                    SELECT to_char(se.created_at::timestamp, 'IYYY-"W"IW') AS week,
                           AVG(se.rating::REAL) AS avg_rating
                    FROM self_evaluations se
                    JOIN class_memberships cm ON cm.student_id = se.user_id
                    WHERE cm.class_id = %s
                    GROUP BY week
                    ORDER BY week
                    """,
                    (class_id,),
                )
                time_rows = cur.fetchall()
            progress_over_time = [
                {"week": row["week"], "avgScore": round(row["avg_rating"], 2)}
                for row in time_rows
            ]
            # Student rankings
            with connection.cursor() as cur:
                cur.execute(
                    """
                    SELECT u.id, u.name AS username,
                           COUNT(*) AS total_evals,
                           AVG(se.rating::REAL) AS avg_score,
                           MAX(se.created_at) AS last_active
                    FROM self_evaluations se
                    JOIN users u ON u.id = se.user_id
                    JOIN class_memberships cm ON cm.student_id = se.user_id
                    WHERE cm.class_id = %s
                    GROUP BY se.user_id, u.id, u.name
                    ORDER BY avg_score DESC
                    """,
                    (class_id,),
                )
                ranking_rows = cur.fetchall()
            student_rankings = [
                {
                    "username": row["username"],
                    "totalEvals": row["total_evals"],
                    "avgScore": round(row["avg_score"], 2),
                    "lastActive": row["last_active"],
                }
                for row in ranking_rows
            ]
            # Weak topics (avgScore < 2.0)
            weak_topics = [ts["topic"] for ts in topic_stats if ts["avgScore"] < 2.0]

            # Students at risk: avgScore < 1.8 or inactive > 14 days
            from datetime import timezone as _tz
            now = datetime.now(timezone.utc)
            at_risk = []
            for s in student_rankings:
                last = s.get("lastActive")
                days_inactive = (now - last.replace(tzinfo=_tz.utc)).days if last else 999
                if s["avgScore"] < 1.8 or days_inactive > 14:
                    at_risk.append({
                        "username": s["username"],
                        "avgScore": s["avgScore"],
                        "daysInactive": days_inactive,
                        "reason": "score faible" if s["avgScore"] < 1.8 else "inactif depuis %d j" % days_inactive,
                    })

            # Completion rate per topic: students who viewed ≥1 exercise vs total students
            with connection.cursor() as cur:
                cur.execute("SELECT COUNT(*) AS total FROM class_memberships WHERE class_id = %s", (class_id,))
                total_students = (cur.fetchone() or {}).get("total", 0)
            completion = []
            if total_students > 0:
                for ts in topic_stats:
                    rate = round(min(ts["studentCount"] / total_students, 1.0) * 100)
                    completion.append({"topic": ts["topic"], "rate": rate})

        self.send_json(200, {
            "topicStats": topic_stats,
            "progressOverTime": progress_over_time,
            "studentRankings": student_rankings,
            "weakTopics": weak_topics,
            "atRisk": at_risk,
            "completion": completion,
            "totalStudents": total_students,
        })

    def handle_ai_from_pdf(self):
        """Extrait le texte d'un PDF uploadé et génère des exercices IA alignés dessus."""
        user = self.require_teacher()
        if not user:
            return
        if not check_ai_rate_limit(user["id"]):
            self.send_json(429, {"error": "Trop de requêtes IA. Veuillez patienter."})
            return

        content_type = self.headers.get("Content-Type", "")
        if "multipart/form-data" not in content_type:
            self.send_json(400, {"error": "multipart/form-data requis."})
            return
        boundary = ""
        for part in content_type.split(";"):
            part = part.strip()
            if part.startswith("boundary="):
                boundary = part[len("boundary="):].strip()
                break
        if not boundary:
            self.send_json(400, {"error": "Boundary manquant."})
            return
        content_length = int(self.headers.get("Content-Length", "0"))
        if content_length > 10 * 1024 * 1024:
            self.send_json(413, {"error": "PDF trop volumineux (max 10 Mo)."})
            return
        raw = self.rfile.read(content_length)

        # Parse multipart
        sep = f"--{boundary}".encode()
        pdf_bytes = None
        topic = ""
        count = 3
        for part in raw.split(sep)[1:]:
            if part.strip() in (b"", b"--", b"--\r\n"):
                continue
            header_end = part.find(b"\r\n\r\n")
            if header_end == -1:
                continue
            header_raw = part[:header_end].decode("utf-8", errors="replace")
            body = part[header_end + 4:]
            if body.endswith(b"\r\n"):
                body = body[:-2]
            name = ""
            for line in header_raw.splitlines():
                if "Content-Disposition" in line:
                    for token in line.split(";"):
                        token = token.strip()
                        if token.startswith('name="'):
                            name = token[6:-1]
            if name == "pdf":
                pdf_bytes = body
            elif name == "topic":
                topic = body.decode("utf-8", errors="replace").strip()
            elif name == "count":
                try:
                    count = min(int(body.decode()), 5)
                except Exception:
                    count = 3

        if not pdf_bytes:
            self.send_json(400, {"error": "Aucun fichier PDF reçu."})
            return

        # Extract text from PDF
        try:
            import io
            try:
                from pypdf import PdfReader
            except ImportError:
                from PyPDF2 import PdfReader
            reader = PdfReader(io.BytesIO(pdf_bytes))
            pages_text = []
            for page in reader.pages[:20]:  # max 20 pages
                text = page.extract_text() or ""
                if text.strip():
                    pages_text.append(text.strip())
            pdf_text = "\n\n".join(pages_text)
            if len(pdf_text) > 8000:
                pdf_text = pdf_text[:8000] + "…"
            if not pdf_text.strip():
                self.send_json(400, {"error": "Impossible d'extraire du texte de ce PDF (PDF scanné non supporté)."})
                return
        except Exception as e:
            logger.error("PDF extraction error: %s", e)
            self.send_json(500, {"error": "Erreur lors de la lecture du PDF."})
            return

        logger.info("Génération depuis PDF par user id=%s (topic=%s, count=%d, chars=%d)", user["id"], topic, count, len(pdf_text))

        system_prompt = (
            "IMPORTANT : ta réponse doit commencer DIRECTEMENT par [ et se terminer par ]. "
            "Retourne un tableau JSON de " + str(count) + " exercices. "
            "Chaque exercice est un objet avec les clés : title (string), statement (string), correction (tableau de 3 strings), keywords (tableau de strings), duration (string). "
            "Les exercices doivent être directement inspirés du contenu du cours fourni : utilise les mêmes notations, définitions et méthodes. "
            "Les questions doivent être progressives et couvrir différents aspects du cours. "
            "Notation LaTeX OBLIGATOIRE : \\(...\\) pour l'inline, \\[...\\] pour le bloc. "
            "Caractères accentués directement (é, è, à, ç…), jamais de commandes LaTeX d'accent."
        )
        user_prompt = (
            f"Thème : {topic or 'mathématiques'}\n\n"
            f"Voici le contenu du cours :\n\n{pdf_text}\n\n"
            f"Génère {count} exercices originaux et variés basés sur ce cours, avec des corrections détaillées."
        )

        try:
            raw_text = _repair_json_strings(_clean_ai_text(ai_request(system_prompt, user_prompt)))
            json_str = _extract_json_from_text(raw_text, is_array=True)
            if not json_str:
                raise ValueError("Pas de JSON valide retourné.")
            exercises = parse_ai_json(json_str)
            if not isinstance(exercises, list):
                raise ValueError("La réponse n'est pas un tableau.")
            validated = []
            for ex in exercises:
                if not isinstance(ex, dict):
                    continue
                if not all(k in ex for k in ("title", "statement", "correction")):
                    continue
                ex["title"] = normalize_ai_text(str(ex.get("title", "")))
                ex["statement"] = normalize_ai_text(str(ex.get("statement", "")))
                if isinstance(ex.get("correction"), list):
                    ex["correction"] = [normalize_ai_text(str(c)) for c in ex["correction"]]
                else:
                    ex["correction"] = [normalize_ai_text(str(ex.get("correction", "")))]
                validated.append(ex)
            if not validated:
                raise ValueError("Aucun exercice valide généré.")
            self.send_json(200, {"exercises": validated})
        except Exception as e:
            logger.error("Erreur génération depuis PDF: %s", e)
            self.send_json(500, {"error": "L'IA n'a pas pu générer les exercices. Réessayez."})

    def handle_http_error(self, error):
        detail = error.read().decode("utf-8")
        try:
            message = json.loads(detail).get("error", {}).get("message", detail)
        except json.JSONDecodeError:
            message = detail or "OpenAI API request failed."
        self.send_json(error.code, {"error": message})

    def send_json(self, status_code, payload):
        body = json_dump(payload).encode("utf-8")
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)


if __name__ == "__main__":
    init_db()
    host = "0.0.0.0"
    server = ThreadingHTTPServer((host, PORT), AppHandler)
    logger.info("MathMentor démarré sur http://%s:%s", host, PORT)
    server.serve_forever()
