const API_URL = "/api/tasks";

let tasks = [];
let currentFilter = "all";
let selectedPriority = "medium";
let activeDetailTaskId = null;

const taskList = document.getElementById("taskList");
const currentCount = document.getElementById("currentCount");
const completedCount = document.getElementById("completedCount");
const modalOverlay = document.getElementById("modalOverlay");
const detailOverlay = document.getElementById("detailOverlay");
const detailBody = document.getElementById("detailBody");
const taskForm = document.getElementById("taskForm");
const priorityGroup = document.getElementById("priorityGroup");

// Открытие и закрытие модального окна создания задачи
document.getElementById("openModalBtn").addEventListener("click", () => {
    modalOverlay.classList.add("open");
});

document.getElementById("closeModalBtn").addEventListener("click", () => {
    modalOverlay.classList.remove("open");
});

modalOverlay.addEventListener("click", (e) => {
    if (e.target === modalOverlay) modalOverlay.classList.remove("open");
});

// Закрытие окна деталей задачи
document.getElementById("closeDetailBtn").addEventListener("click", () => {
    detailOverlay.classList.remove("open");
});

detailOverlay.addEventListener("click", (e) => {
    if (e.target === detailOverlay) detailOverlay.classList.remove("open");
});

// Удаление задачи из окна деталей
document.getElementById("deleteDetailBtn").addEventListener("click", async () => {
    if (!activeDetailTaskId) return;
    await deleteTask(activeDetailTaskId);
    detailOverlay.classList.remove("open");
});

// Выбор приоритета в форме
priorityGroup.querySelectorAll(".prio-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
        priorityGroup.querySelectorAll(".prio-btn").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        selectedPriority = btn.dataset.prio;
    });
});

// Переключение вкладок фильтрации (Все / Текущие / Выполненные)
document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
        document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        currentFilter = btn.dataset.filter;
        renderTasks();
    });
});

// Уведомления
const notifBtn = document.getElementById("notifBtn");
if (notifBtn) {
    notifBtn.addEventListener("click", () => {
        const urgent = tasks.filter((t) => !t.completed && new Date(t.deadline) - new Date() <= 86400000);
        alert(urgent.length > 0 ? `Срочных задач (до 24ч или просрочено): ${urgent.length}` : "Горящих задач нет!");
    });
}

// Загрузка задач с сервера
async function fetchTasks() {
    try {
        const res = await fetch(API_URL);
        if (!res.ok) throw new Error("Ошибка загрузки");
        tasks = await res.json();
        updateCounters();
        renderTasks();
    } catch (err) {
        console.error(err);
        taskList.innerHTML = `<div class="empty-state">Запустите сервер командой <b>python main.py</b> и откройте <b>http://127.0.0.1:8000</b></div>`;
    }
}

function updateCounters() {
    const active = tasks.filter((t) => !t.completed).length;
    const done = tasks.filter((t) => t.completed).length;
    currentCount.textContent = active;
    completedCount.textContent = done;
}

function escapeHTML(str) {
    return String(str).replace(/[&<>'"]/g, (tag) =>
        ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "'", '"': "&quot;" }[tag] || tag)
    );
}

function formatDeadline(isoStr) {
    if (!isoStr) return "Без срока";
    const dt = new Date(isoStr);
    if (isNaN(dt)) return isoStr;
    return dt.toLocaleString("ru-RU", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function renderTasks() {
    taskList.innerHTML = "";
    const filtered = tasks.filter((t) => {
        if (currentFilter === "current") return !t.completed;
        if (currentFilter === "completed") return t.completed;
        return true;
    });

    if (filtered.length === 0) {
        taskList.innerHTML = `<div class="empty-state">Задач в этой категории пока нет</div>`;
        return;
    }

    const now = new Date();

    filtered.forEach((task) => {
        const li = document.createElement("li");
        let urgencyClass = "";
        let timeBadgeClass = "";

        if (!task.completed && task.deadline) {
            const hoursLeft = (new Date(task.deadline) - now) / (1000 * 60 * 60);
            if (hoursLeft < 0) {
                urgencyClass = "deadline-danger";
                timeBadgeClass = "overdue";
            } else if (hoursLeft <= 24) {
                urgencyClass = "deadline-warning";
                timeBadgeClass = "soon";
            }
        }

        li.className = `task-card prio-${task.priority} ${urgencyClass} ${task.completed ? "completed-status" : ""}`;

        const prioText = task.priority === "high" ? "Высокий" : task.priority === "medium" ? "Средний" : "Низкий";

        li.innerHTML = `
            <input type="checkbox" class="task-checkbox" ${task.completed ? "checked" : ""}>
            <div class="task-main-content">
                <div class="task-title">${escapeHTML(task.title)}</div>
                <div class="task-subject">${escapeHTML(task.subject)}</div>
                <div class="task-footer">
                    <span class="prio-tag prio-${task.priority}">${prioText}</span>
                    <span class="task-time-badge ${timeBadgeClass}">${formatDeadline(task.deadline)}</span>
                </div>
            </div>
            <button type="button" class="del-btn" title="Удалить">✕</button>
        `;

        // Переключение статуса выполнения
        li.querySelector(".task-checkbox").addEventListener("click", (e) => {
            e.stopPropagation();
            toggleTask(task.id);
        });

        // Быстрое удаление
        li.querySelector(".del-btn").addEventListener("click", (e) => {
            e.stopPropagation();
            deleteTask(task.id);
        });

        // Открытие деталей задачи при клике на карточку
        li.addEventListener("click", () => openTaskDetails(task));

        taskList.appendChild(li);
    });
}

function openTaskDetails(task) {
    activeDetailTaskId = task.id;
    const prioText = task.priority === "high" ? "Высокий" : task.priority === "medium" ? "Средний" : "Низкий";
    detailBody.innerHTML = `
        <div class="detail-row"><span>Задача</span><strong>${escapeHTML(task.title)}</strong></div>
        <div class="detail-row"><span>Описание</span><span>${escapeHTML(task.subject)}</span></div>
        <div class="detail-row"><span>Приоритет</span><span>${prioText}</span></div>
        <div class="detail-row"><span>Дедлайн</span><span>${formatDeadline(task.deadline)}</span></div>
        <div class="detail-row"><span>Статус</span><span>${task.completed ? "Выполнено" : "В работе"}</span></div>
    `;
    detailOverlay.classList.add("open");
}

async function toggleTask(id) {
    try {
        const res = await fetch(`${API_URL}/${id}/toggle`, { method: "PATCH" });
        if (res.ok) fetchTasks();
    } catch (e) {
        console.error(e);
    }
}

async function deleteTask(id) {
    try {
        const res = await fetch(`${API_URL}/${id}`, { method: "DELETE" });
        if (res.ok) fetchTasks();
    } catch (e) {
        console.error(e);
    }
}

// Создание новой задачи
taskForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const title = document.getElementById("taskTitle").value.trim();
    const subject = document.getElementById("taskSubject").value.trim();
    const deadline = document.getElementById("taskDeadline").value;

    if (!title || !subject || !deadline) {
        alert("Пожалуйста, заполните все поля!");
        return;
    }

    const payload = { title, subject, priority: selectedPriority, deadline };

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || "Ошибка сервера");
        }

        modalOverlay.classList.remove("open");
        taskForm.reset();
        selectedPriority = "medium";
        priorityGroup.querySelectorAll(".prio-btn").forEach((b) => b.classList.remove("active"));
        priorityGroup.querySelector('[data-prio="medium"]').classList.add("active");

        fetchTasks();
    } catch (error) {
        alert("Не удалось сохранить задачу. Причина: " + error.message);
    }
});

fetchTasks();
