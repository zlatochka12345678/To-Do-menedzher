import threading
import time
from datetime import datetime, timedelta
import pytest
import uvicorn
from playwright.sync_api import sync_playwright
import main


@pytest.fixture(scope="module")
def live_server():
    """Запускает FastAPI сервер в отдельном потоке для UI-тестов."""
    config = uvicorn.Config(main.app, host="127.0.0.1", port=8001, log_level="error")
    server = uvicorn.Server(config)
    thread = threading.Thread(target=server.run, daemon=True)
    thread.start()
    time.sleep(1)
    yield "http://127.0.0.1:8001"
    server.should_exit = True


@pytest.fixture(autouse=True)
def clean_db(tmp_path, monkeypatch):
    test_db = tmp_path / "ui_tasks.json"
    test_db.write_text("[]", encoding="utf-8")
    monkeypatch.setattr(main, "DATA_FILE", str(test_db))


def test_ui_urgency_colors_and_filters(live_server):
    now = datetime.now()
    fmt = "%Y-%m-%dT%H:%M"

    tasks_seed = [
        {
            "id": 1,
            "title": "Просроченный долг",
            "subject": "Матан",
            "priority": "high",
            "deadline": (now - timedelta(hours=2)).strftime(fmt),
            "completed": False,
        },
        {
            "id": 2,
            "title": "Срочная лаба",
            "subject": "Программирование",
            "priority": "medium",
            "deadline": (now + timedelta(hours=5)).strftime(fmt),
            "completed": False,
        },
        {
            "id": 3,
            "title": "Обычное ДЗ",
            "subject": "Английский",
            "priority": "low",
            "deadline": (now + timedelta(days=3)).strftime(fmt),
            "completed": False,
        },
    ]
    main.save_tasks(tasks_seed)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto(live_server)

        cards = page.locator(".task-card")
        assert cards.count() == 3

        assert "deadline-danger" in cards.nth(0).get_attribute("class")
        assert "deadline-warning" in cards.nth(1).get_attribute("class")
        assert "deadline-danger" not in cards.nth(2).get_attribute("class")
        assert "deadline-warning" not in cards.nth(2).get_attribute("class")

        assert page.locator("#currentCount").inner_text() == "3"
        assert page.locator("#completedCount").inner_text() == "0"

        cards.nth(0).locator(".task-checkbox").click()
        page.wait_for_timeout(300)

        assert page.locator("#currentCount").inner_text() == "2"
        assert page.locator("#completedCount").inner_text() == "1"

        page.locator('.tab-btn[data-filter="completed"]').click()
        page.wait_for_timeout(300)
        assert page.locator(".task-card").count() == 1
        assert "Просроченный долг" in page.locator(".task-card").nth(0).inner_text()

        page.locator("#openModalBtn").click()
        page.fill("#taskTitle", "<script>alert('XSS')</script>")
        page.fill("#taskSubject", "Безопасность")
        page.fill("#taskDeadline", (now + timedelta(days=1)).strftime(fmt))
        page.click('button[type="submit"]')
        page.wait_for_timeout(300)

        page.locator('.tab-btn[data-filter="all"]').click()
        page.wait_for_timeout(300)
        assert "<script>alert('XSS')</script>" in page.locator("#taskList").inner_text()

        browser.close()
