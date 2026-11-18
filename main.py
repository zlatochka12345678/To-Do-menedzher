import json
import os
from datetime import datetime
from fastapi import FastAPI, HTTPException
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

# Создаем структуру папок и пустую БД при старте
if not os.path.exists("static"):
    os.makedirs("static")
if not os.path.exists(DATA_FILE):
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump([], f, ensure_ascii=False, indent=4)


class Task(BaseModel):
    id: int | None = None
    title: str
    subject: str
    priority: str
    deadline: str
    completed: bool = False


def load_tasks():
    try:
        with open(DATA_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except (json.JSONDecodeError, FileNotFoundError):
        return []


def save_tasks(tasks):
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(tasks, f, ensure_ascii=False, indent=4)


# ---------- Навигация между страницами ----------
@app.get("/")
def get_index():
    return FileResponse("index.html")


@app.get("/calendar")
def get_calendar():
    return FileResponse("calendar.html")


@app.get("/group")
def get_group():
    return FileResponse("group.html")


# ---------- REST API ----------
@app.get("/api/tasks")
def get_tasks():
    tasks = load_tasks()
    
    def sort_key(task):
        is_completed = task.get("completed", False)
        try:
            deadline_date = datetime.fromisoformat(task["deadline"])
        except (ValueError, KeyError):
            deadline_date = datetime.max
        
        return (is_completed, deadline_date)

    try:
        return sorted(tasks, key=sort_key)
    except Exception as e:
        print(f"Ошибка сортировки: {e}")
        return tasks


@app.post("/api/tasks")
def create_task(task: Task):
    tasks = load_tasks()
    task_dict = task.model_dump()
    task_dict["id"] = int(datetime.now().timestamp() * 1000)
    tasks.append(task_dict)
    save_tasks(tasks)
    return task_dict


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
