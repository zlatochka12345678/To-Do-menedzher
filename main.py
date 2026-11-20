import json
import os
from datetime import datetime
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="IT.TEAM Task Manager API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATA_FILE = "tasks.json"

if not os.path.exists("static"):
    os.makedirs("static")
if not os.path.exists(DATA_FILE):
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump([], f, ensure_ascii=False, indent=4)


class Task(BaseModel):
    id: int = None
    title: str
    subject: str
    priority: str
    deadline: str
    completed: bool = False


def load_tasks():
    try:
        with open(DATA_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        print(f"Ошибка чтения JSON: {e}")
        return []


def save_tasks(tasks):
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(tasks, f, ensure_ascii=False, indent=4)


@app.get("/")
def get_index():
    return FileResponse("index.html")


@app.get("/calendar")
def get_calendar():
    return FileResponse("calendar.html")


@app.get("/group")
def get_group():
    return FileResponse("group.html")


@app.get("/api/tasks")
def get_tasks():
    tasks = load_tasks()

    def sort_key(x):
        try:
            dt = datetime.fromisoformat(x["deadline"])
        except Exception:
            dt = datetime.max
        return (x.get("completed", False), dt)

    return sorted(tasks, key=sort_key)


@app.post("/api/tasks")
async def create_task(request: Request):
    try:
        data = await request.json()
        print(f"ПОЛУЧЕНЫ ДАННЫЕ: {data}")

        if not data.get("title") or not data.get("deadline"):
            raise ValueError("Нет названия или дедлайна")

        tasks = load_tasks()

        new_task = {
            "id": int(datetime.now().timestamp() * 1000),
            "title": data["title"],
            "subject": data.get("subject", "Без описания"),
            "priority": data.get("priority", "medium"),
            "deadline": data["deadline"],
            "completed": False,
        }

        tasks.append(new_task)
        save_tasks(tasks)
        print(f"ЗАДАЧА СОХРАНЕНА: {new_task['title']}")
        return new_task

    except Exception as e:
        print(f"!!! ОШИБКА ПРИ СОЗДАНИИ: {e}")
        raise HTTPException(status_code=400, detail=str(e))


@app.patch("/api/tasks/{task_id}/toggle")
def toggle_task(task_id: int):
    tasks = load_tasks()
    for task in tasks:
        if task["id"] == task_id:
            task["completed"] = not task["completed"]
            save_tasks(tasks)
            return task
    raise HTTPException(status_code=404, detail="Task not found")


@app.delete("/api/tasks/{task_id}")
def delete_task(task_id: int):
    tasks = load_tasks()
    new_tasks = [t for t in tasks if t["id"] != task_id]
    if len(tasks) == len(new_tasks):
        raise HTTPException(status_code=404, detail="Task not found")
    save_tasks(new_tasks)
    return {"status": "success"}


app.mount("/static", StaticFiles(directory="static"), name="static")

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="127.0.0.1", port=8000)
