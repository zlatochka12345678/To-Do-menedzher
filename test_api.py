import pytest
from fastapi.testclient import TestClient
import main

client = TestClient(main.app)


@pytest.fixture(autouse=True)
def isolated_db(tmp_path, monkeypatch):
    """
    Подменяет DATA_FILE на временный файл перед каждым тестом,
    чтобы автотесты не затирали реальные задачи в tasks.json.
    """
    test_db = tmp_path / "test_tasks.json"
    test_db.write_text("[]", encoding="utf-8")
    monkeypatch.setattr(main, "DATA_FILE", str(test_db))
    yield test_db


def test_create_task_and_persistence(isolated_db):
    payload = {
        "title": "Сдать отчет по практике",
        "subject": "Производственная практика",
        "priority": "high",
        "deadline": "2026-11-20T18:00",
    }
    response = client.post("/api/tasks", json=payload)
    assert response.status_code == 200

    data = response.json()
    assert data["title"] == "Сдать отчет по практике"
    assert data["subject"] == "Производственная практика"
    assert data["priority"] == "high"
    assert data["completed"] is False
    assert isinstance(data["id"], int)

    get_res = client.get("/api/tasks")
    assert len(get_res.json()) == 1


def test_get_tasks_smart_sorting():
    t_far = client.post("/api/tasks", json={
        "title": "Курсовая работа",
        "subject": "Базы данных",
        "priority": "high",
        "deadline": "2026-12-10T12:00",
        "completed": False,
    }).json()

    t_soon = client.post("/api/tasks", json={
        "title": "Лабораторная №3",
        "subject": "Физика",
        "priority": "medium",
        "deadline": "2026-11-18T10:00",
        "completed": False,
    }).json()

    t_done = client.post("/api/tasks", json={
        "title": "Самый ранний дедлайн, но уже сдано",
        "subject": "История",
        "priority": "low",
        "deadline": "2026-11-01T10:00",
        "completed": True,
    }).json()

    response = client.get("/api/tasks")
    assert response.status_code == 200
    tasks = response.json()

    assert [t["id"] for t in tasks] == [t_soon["id"], t_far["id"], t_done["id"]]


def test_toggle_task_completion():
    created = client.post("/api/tasks", json={
        "title": "Подготовить презентацию",
        "subject": "Экономика",
        "priority": "medium",
        "deadline": "2026-11-25T14:00",
    }).json()
    task_id = created["id"]

    res_1 = client.patch(f"/api/tasks/{task_id}/toggle")
    assert res_1.status_code == 200
    assert res_1.json()["completed"] is True

    res_2 = client.patch(f"/api/tasks/{task_id}/toggle")
    assert res_2.status_code == 200
    assert res_2.json()["completed"] is False


def test_toggle_nonexistent_task_returns_404():
    response = client.patch("/api/tasks/999999999/toggle")
    assert response.status_code == 404
    assert response.json()["detail"] == "Task not found"


def test_delete_task():
    created = client.post("/api/tasks", json={
        "title": "Удаляемая задача",
        "subject": "Физкультура",
        "priority": "low",
        "deadline": "2026-11-30T09:00",
    }).json()
    task_id = created["id"]

    del_res = client.delete(f"/api/tasks/{task_id}")
    assert del_res.status_code == 200
    assert del_res.json() == {"status": "success"}

    assert client.delete(f"/api/tasks/{task_id}").status_code == 404


def test_html_routes():
    assert client.get("/").status_code == 200
    assert client.get("/calendar").status_code == 200
    assert client.get("/group").status_code == 200
