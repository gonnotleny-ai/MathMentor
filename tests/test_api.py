"""
Tests d'intégration pour l'API MathMentor.

Usage :
    pip install pytest requests
    # Depuis la racine du projet, démarrer le serveur sur le port par défaut (3000) :
    #   python server.py &
    # Puis lancer les tests :
    #   pytest tests/test_api.py -v

Le port et l'hôte peuvent être configurés via les variables d'environnement :
    MM_TEST_HOST=http://localhost:3000 pytest tests/test_api.py -v
"""

import os
import time
import threading
import urllib.request
import urllib.error
import json
import tempfile
import pytest

# ── Config ──────────────────────────────────────────────────────────────────

BASE_URL = os.environ.get("MM_TEST_HOST", "http://127.0.0.1:3000")


# ── Helpers ─────────────────────────────────────────────────────────────────

def _req(method: str, path: str, body=None, token: str = None) -> tuple[int, dict]:
    """Effectue une requête HTTP et retourne (status_code, json_body)."""
    url = BASE_URL + path
    data = json.dumps(body).encode() if body is not None else b"{}"
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            return resp.status, json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode())


def post(path, body=None, token=None):
    return _req("POST", path, body, token)


def get(path, token=None):
    return _req("GET", path, None, token)


def unique_email():
    import uuid
    return f"test_{uuid.uuid4().hex[:8]}@example.com"


# ── Fixtures ─────────────────────────────────────────────────────────────────

@pytest.fixture(scope="module")
def student_session():
    """Crée un compte élève et retourne (token, refresh_token, user)."""
    email = unique_email()
    status, data = post("/api/register", {
        "name": "Élève Test",
        "email": email,
        "password": "motdepasse123",
        "role": "student",
    })
    assert status == 201, f"Échec inscription élève : {data}"
    return data["token"], data.get("refreshToken"), data["user"]


@pytest.fixture(scope="module")
def teacher_session():
    """Crée un compte professeur et retourne (token, refresh_token, user)."""
    email = unique_email()
    status, data = post("/api/register", {
        "name": "Prof Test",
        "email": email,
        "password": "motdepasse123",
        "role": "teacher",
        "teacherCode": "MATHMENTOR-PROF",
    })
    assert status == 201, f"Échec inscription prof : {data}"
    return data["token"], data.get("refreshToken"), data["user"]


# ── Tests : Auth ──────────────────────────────────────────────────────────────

class TestAuth:
    def test_register_student(self):
        status, data = post("/api/register", {
            "name": "Étudiant A",
            "email": unique_email(),
            "password": "motdepasse123",
            "role": "student",
        })
        assert status == 201
        assert "token" in data
        assert data["user"]["role"] == "student"

    def test_register_teacher_valid_code(self):
        status, data = post("/api/register", {
            "name": "Prof A",
            "email": unique_email(),
            "password": "motdepasse123",
            "role": "teacher",
            "teacherCode": "MATHMENTOR-PROF",
        })
        assert status == 201
        assert data["user"]["role"] == "teacher"
        assert "refreshToken" in data

    def test_register_teacher_bad_code(self):
        status, data = post("/api/register", {
            "name": "Faux Prof",
            "email": unique_email(),
            "password": "motdepasse123",
            "role": "teacher",
            "teacherCode": "MAUVAIS-CODE",
        })
        assert status == 403

    def test_register_short_password(self):
        status, data = post("/api/register", {
            "name": "User",
            "email": unique_email(),
            "password": "court",
            "role": "student",
        })
        assert status == 400

    def test_register_duplicate_email(self):
        email = unique_email()
        post("/api/register", {"name": "A", "email": email, "password": "motdepasse123", "role": "student"})
        status, data = post("/api/register", {"name": "B", "email": email, "password": "motdepasse123", "role": "student"})
        assert status == 409

    def test_login_valid(self):
        email = unique_email()
        post("/api/register", {"name": "Login Test", "email": email, "password": "motdepasse123", "role": "student"})
        status, data = post("/api/login", {"email": email, "password": "motdepasse123"})
        assert status == 200
        assert "token" in data
        assert "refreshToken" in data

    def test_login_wrong_password(self):
        email = unique_email()
        post("/api/register", {"name": "X", "email": email, "password": "motdepasse123", "role": "student"})
        status, data = post("/api/login", {"email": email, "password": "mauvaismdp"})
        assert status == 401

    def test_me_with_valid_token(self, student_session):
        token, _, _ = student_session
        status, data = get("/api/me", token=token)
        assert status == 200
        assert "user" in data

    def test_me_without_token(self):
        status, data = get("/api/me")
        assert status == 401

    def test_refresh_token(self, student_session):
        token, refresh, _ = student_session
        if not refresh:
            pytest.skip("Pas de refresh token dans la réponse")
        status, data = post("/api/auth/refresh", {"refreshToken": refresh})
        assert status == 200
        assert "token" in data

    def test_refresh_invalid_token(self):
        status, data = post("/api/auth/refresh", {"refreshToken": "faux-token"})
        assert status == 401


# ── Tests : Progress ──────────────────────────────────────────────────────────

class TestProgress:
    def test_update_and_retrieve_progress(self, student_session):
        token, _, _ = student_session
        status, data = post("/api/progress", {
            "viewedExercises": ["exo-sys-01", "exo-poly-01"],
            "generatedExercises": [],
            "recentQuestions": [{"question": "Qu'est-ce que le pivot de Gauss ?", "date": "01/01/2025"}],
            "selfEvaluations": {"exo-sys-01": 3},
            "chatHistory": [],
        }, token=token)
        assert status == 200

        status2, data2 = get("/api/me", token=token)
        assert status2 == 200
        progress = data2.get("progress", {})
        assert "exo-sys-01" in (progress.get("viewedExercises") or [])

    def test_progress_requires_auth(self):
        status, _ = post("/api/progress", {"viewedExercises": []})
        assert status == 401


# ── Tests : Notifications ─────────────────────────────────────────────────────

class TestNotifications:
    def test_get_notifications_authenticated(self, student_session):
        token, _, _ = student_session
        status, data = get("/api/notifications", token=token)
        assert status == 200
        assert "notifications" in data

    def test_get_notifications_unauthenticated(self):
        status, _ = get("/api/notifications")
        assert status == 401

    def test_mark_notifications_read(self, student_session):
        token, _, _ = student_session
        status, data = post("/api/notifications/read", {}, token=token)
        assert status == 200
        assert data.get("ok") is True


# ── Tests : Teacher ───────────────────────────────────────────────────────────

class TestTeacher:
    def test_create_class(self, teacher_session):
        token, _, _ = teacher_session
        status, data = post("/api/teacher/class", {"name": "Classe Test S1"}, token=token)
        assert status == 201
        assert "classroom" in data
        return data["classroom"]["id"]

    def test_create_class_requires_teacher(self, student_session):
        token, _, _ = student_session
        status, data = post("/api/teacher/class", {"name": "Hack"}, token=token)
        assert status == 403

    def test_resources_returns_classes(self, teacher_session):
        token, _, _ = teacher_session
        # Créer une classe d'abord
        post("/api/teacher/class", {"name": "Classe Ressources"}, token=token)
        status, data = get("/api/resources", token=token)
        assert status == 200
        assert "teacherClasses" in data


# ── Tests : AI status ─────────────────────────────────────────────────────────

class TestAiStatus:
    def test_ai_status_returns_json(self):
        status, data = get("/api/ai-status")
        assert status == 200
        assert "provider" in data
        assert "available" in data


# ── Tests : Routing ───────────────────────────────────────────────────────────

class TestRouting:
    def test_unknown_route_returns_404(self):
        status, _ = post("/api/unknown-endpoint", {})
        assert status == 404

    def test_static_file_served(self):
        url = BASE_URL + "/"
        req = urllib.request.Request(url)
        try:
            with urllib.request.urlopen(req, timeout=5) as resp:
                assert resp.status == 200
        except urllib.error.HTTPError as e:
            assert e.code in (200, 301, 302)
