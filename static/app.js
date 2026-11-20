const STORAGE_KEY = "itteam_tasks_v1";

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
document.getElementById("deleteDetailBtn").addEventListener("click", () => {
    if (!activeDetailTaskId) return;
    deleteTask(activeDetailTaskId);
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
        const urgent = tasks.filter(
            (t) => !t.completed && t.deadline && new Date(t.deadline) - new Date() <= 86400000
        );
        alert(
            urgent.length > 0
                ? `Срочных задач (до 24ч или просрочено): ${urgent.length}`
                : "Горящих задач нет!"
        );
    });
}

// Загрузка и сохранение задач в localStorage (работает на GitHub Pages без сервера)
function loadTasksFromStorage() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        tasks = raw ? JSON.parse(raw) : [];
    } catch (e) {
        tasks = [];
    }
    sortTasks();
    updateCounters();
    renderTasks();
}

function saveTasksToStorage() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function sortTasks() {
    tasks.sort((a, b) => {
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        return new Date(a.deadline) - new Date(b.deadline);
    });
}

function updateCounters() {
    currentCount.textContent = tasks.filter((t) => !t.completed).length;
    completedCount.textContent = tasks.filter((t) => t.completed).length;
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
        const prioText =
            task.priority === "high" ? "Высокий" : task.priority === "medium" ? "Средний" : "Низкий";

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

        li.querySelector(".task-checkbox").addEventListener("click", (e) => {
            e.stopPropagation();
            toggleTask(task.id);
        });

        li.querySelector(".del-btn").addEventListener("click", (e) => {
            e.stopPropagation();
            deleteTask(task.id);
        });

        li.addEventListener("click", () => openTaskDetails(task));

        taskList.appendChild(li);
    });
}

function openTaskDetails(task) {
    activeDetailTaskId = task.id;
    const prioText =
        task.priority === "high" ? "Высокий" : task.priority === "medium" ? "Средний" : "Низкий";
    detailBody.innerHTML = `
        <div class="detail-row"><span>Задача</span><strong>${escapeHTML(task.title)}</strong></div>
        <div class="detail-row"><span>Описание</span><span>${escapeHTML(task.subject)}</span></div>
        <div class="detail-row"><span>Приоритет</span><span>${prioText}</span></div>
        <div class="detail-row"><span>Дедлайн</span><span>${formatDeadline(task.deadline)}</span></div>
        <div class="detail-row"><span>Статус</span><span>${task.completed ? "Выполнено" : "В работе"}</span></div>
    `;
    detailOverlay.classList.add("open");
}

function toggleTask(id) {
    const task = tasks.find((t) => t.id === id);
    if (task) {
        task.completed = !task.completed;
        sortTasks();
        saveTasksToStorage();
        updateCounters();
        renderTasks();
    }
}

function deleteTask(id) {
    tasks = tasks.filter((t) => t.id !== id);
    saveTasksToStorage();
    updateCounters();
    renderTasks();
}

// Создание новой задачи
taskForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const title = document.getElementById("taskTitle").value.trim();
    const subject = document.getElementById("taskSubject").value.trim();
    const deadline = document.getElementById("taskDeadline").value;

    if (!title || !subject || !deadline) {
        alert("Пожалуйста, заполните все поля!");
        return;
    }

    const newTask = {
        id: Date.now(),
        title,
        subject,
        priority: selectedPriority,
        deadline,
        completed: false,
    };

    tasks.push(newTask);
    sortTasks();
    saveTasksToStorage();
    updateCounters();
    renderTasks();

    modalOverlay.classList.remove("open");
    taskForm.reset();
    selectedPriority = "medium";
    priorityGroup.querySelectorAll(".prio-btn").forEach((b) => b.classList.remove("active"));
    priorityGroup.querySelector('[data-prio="medium"]').classList.add("active");
});

loadTasksFromStorage();
