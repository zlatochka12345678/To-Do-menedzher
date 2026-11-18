const STORAGE_KEY = "it_team_tasks_storage";
let activeFilter = "all";
let allTasks = [];
let selectedPriority = "medium";

const taskList = document.getElementById("taskList");
const taskForm = document.getElementById("taskForm");
const modalOverlay = document.getElementById("modalOverlay");
const detailOverlay = document.getElementById("detailOverlay");
const detailBody = document.getElementById("detailBody");
const priorityGroup = document.getElementById("priorityGroup");

const prioLabels = { high: "Высокий", medium: "Средний", low: "Низкий" };

// Загрузка задач из localStorage браузера
function loadFromStorage() {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    } catch (e) {
        return [];
    }
}

// Сохранение задач в localStorage браузера
function saveToStorage(tasks) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

// Сортировка: сначала текущие по дедлайну, потом выполненные (как было в main.py)
function sortTasks(tasks) {
    return [...tasks].sort((a, b) => {
        if (Boolean(a.completed) !== Boolean(b.completed)) {
            return a.completed ? 1 : -1;
        }
        const dateA = a.deadline ? new Date(a.deadline).getTime() : Infinity;
        const dateB = b.deadline ? new Date(b.deadline).getTime() : Infinity;
        return dateA - dateB;
    });
}

document.getElementById("openModalBtn").addEventListener("click", () => {
    modalOverlay.classList.add("open");
});
document.getElementById("closeModalBtn").addEventListener("click", () => {
    modalOverlay.classList.remove("open");
});
document.getElementById("closeDetailBtn").addEventListener("click", () => {
    detailOverlay.classList.remove("open");
});

priorityGroup.addEventListener("click", (e) => {
    const btn = e.target.closest(".prio-btn");
    if (!btn) return;
    priorityGroup.querySelectorAll(".prio-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    selectedPriority = btn.dataset.prio;
});

function fetchTasks() {
    allTasks = sortTasks(loadFromStorage());
    renderTasks(allTasks);
}

taskForm.addEventListener("submit", (e) => {
    e.preventDefault();
    
    const title = document.getElementById("taskTitle").value.trim();
    const subject = document.getElementById("taskSubject").value.trim();
    const deadline = document.getElementById("taskDeadline").value;

    if (!title || !subject || !deadline) return;

    const currentTasks = loadFromStorage();
    const newTask = {
        id: Date.now(),
        title,
        subject,
        priority: selectedPriority,
        deadline,
        completed: false
    };

    currentTasks.push(newTask);
    saveToStorage(currentTasks);

    modalOverlay.classList.remove("open");
    taskForm.reset();
    selectedPriority = "medium";
    priorityGroup.querySelectorAll(".prio-btn").forEach((b) => b.classList.remove("active"));
    priorityGroup.querySelector('[data-prio="medium"]').classList.add("active");
    
    fetchTasks();
});

window.toggleTask = function (id, event) {
    if (event) event.stopPropagation();
    const currentTasks = loadFromStorage();
    const task = currentTasks.find((t) => t.id === id);
    if (task) {
        task.completed = !task.completed;
        saveToStorage(currentTasks);
        fetchTasks();
    }
};

window.deleteTask = function (id, event) {
    if (event) event.stopPropagation();
    const currentTasks = loadFromStorage().filter((t) => t.id !== id);
    saveToStorage(currentTasks);
    detailOverlay.classList.remove("open");
    fetchTasks();
};

window.openDetails = function (id) {
    const task = allTasks.find((t) => t.id === id);
    if (!task) return;

    const deadline = new Date(task.deadline);
    const formatted = deadline.toLocaleString("ru-RU", {
        day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
    });

    detailBody.innerHTML = `
        <div class="detail-row"><span>Приоритет</span><span class="prio-tag prio-${task.priority}">${prioLabels[task.priority]}</span></div>
        <div class="detail-row"><span>Дедлайн</span><span>${formatted}</span></div>
        <div class="detail-row"><span>Статус</span><span>${task.completed ? "Выполнено" : "В работе"}</span></div>
        <div class="detail-row"><span>Описание</span><span>${escapeHTML(task.subject)}</span></div>
        <button class="btn btn-primary" onclick="toggleTask(${task.id}); document.getElementById('detailOverlay').classList.remove('open');">
            ${task.completed ? "Вернуть в работу" : "Отметить выполненной"}
        </button>
        <button class="btn btn-cancel" onclick="deleteTask(${task.id})">Удалить задачу</button>
    `;
    detailOverlay.classList.add("open");
};

function updateCounters(tasks) {
    const current = tasks.filter((t) => !t.completed).length;
    const completed = tasks.filter((t) => t.completed).length;
    document.getElementById("currentCount").textContent = current;
    document.getElementById("completedCount").textContent = completed;
}

function renderTasks(tasks) {
    taskList.innerHTML = "";
    updateCounters(tasks);

    let filtered = tasks;
    if (activeFilter === "current") filtered = tasks.filter((t) => !t.completed);
    if (activeFilter === "completed") filtered = tasks.filter((t) => t.completed);

    if (filtered.length === 0) {
        taskList.innerHTML = `<div class="empty-state">Задач в этом разделе нет</div>`;
        return;
    }

    const now = new Date();

    filtered.forEach((task) => {
        const li = document.createElement("li");
        li.className = `task-card prio-${task.priority} ${task.completed ? "completed-status" : ""}`;
        li.addEventListener("click", () => openDetails(task.id));

        let timeClass = "";
        let timeText = "";

        if (!task.completed) {
            const deadline = new Date(task.deadline);
            const hoursLeft = (deadline - now) / (1000 * 60 * 60);
            if (hoursLeft < 0) { li.classList.add("deadline-danger"); timeClass = "overdue"; }
            else if (hoursLeft <= 24) { li.classList.add("deadline-warning"); timeClass = "soon"; }

            timeText = deadline.toLocaleString("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
        } else {
            timeText = "Выполнено";
        }

        li.innerHTML = `
            <input type="checkbox" class="task-checkbox" ${task.completed ? "checked" : ""}
                   onclick="toggleTask(${task.id}, event)" aria-label="Отметить выполненной">
            <div class="task-main-content">
                <div class="task-title">${escapeHTML(task.title)}</div>
                <div class="task-subject">${escapeHTML(task.subject)}</div>
                <div class="task-footer">
                    <span class="prio-tag prio-${task.priority}">${prioLabels[task.priority]}</span>
                    <span class="task-time-badge ${timeClass}">${timeText}</span>
                </div>
            </div>
            <button class="del-btn" onclick="deleteTask(${task.id}, event)" aria-label="Удалить">&times;</button>
        `;
        taskList.appendChild(li);
    });
}

function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, (tag) =>
        ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[tag] || tag)
    );
}

document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
        document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
        e.target.classList.add("active");
        activeFilter = e.target.getAttribute("data-filter");
        renderTasks(allTasks);
    });
});

fetchTasks();
