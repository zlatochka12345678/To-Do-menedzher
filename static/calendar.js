const STORAGE_KEY = "it_team_tasks_storage";

const calendarGrid = document.getElementById("calendarGrid");
const calendarMonth = document.getElementById("calendarMonth");
const calendarDayTitle = document.getElementById("calendarDayTitle");
const calendarTaskList = document.getElementById("calendarTaskList");
const prevMonthBtn = document.getElementById("prevMonth");
const nextMonthBtn = document.getElementById("nextMonth");
const todayBtn = document.querySelector(".small-btn");

const monthNames = [
    "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
    "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"
];

const monthNamesGenitive = [
    "января", "февраля", "марта", "апреля", "мая", "июня",
    "июля", "августа", "сентября", "октября", "ноября", "декабря"
];

const weekDays = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
const prioLabels = { high: "Высокий", medium: "Средний", low: "Низкий" };

let currentDate = new Date();
let viewYear = currentDate.getFullYear();
let viewMonth = currentDate.getMonth();
let selectedDateStr = formatDateKey(currentDate);

function loadTasks() {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    } catch (e) {
        return [];
    }
}

function saveTasks(tasks) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function formatDateKey(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
}

function escapeHTML(str) {
    return String(str).replace(/[&<>'"]/g, (tag) =>
        ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[tag] || tag)
    );
}

// Определяем цвет точки для конкретной задачи
function getTaskStatusColor(task, now) {
    if (task.completed) return "#10b981"; // Зеленый — выполнено
    const deadline = new Date(task.deadline);
    const hoursLeft = (deadline - now) / (1000 * 60 * 60);
    if (hoursLeft < 0) return "#ef4444";  // Красный — просрочено
    if (hoursLeft <= 24) return "#f59e0b"; // Оранжевый — срочно (<= 24ч)
    return "#3b82f6";                      // Синий — в работе
}

function renderCalendar() {
    const tasks = loadTasks();
    const now = new Date();
    const todayKey = formatDateKey(now);

    calendarMonth.textContent = `${monthNames[viewMonth]} ${viewYear}`;
    calendarGrid.innerHTML = "";

    // Заголовки дней недели
    weekDays.forEach((day) => {
        const wd = document.createElement("div");
        wd.className = "calendar-weekday";
        wd.textContent = day;
        calendarGrid.appendChild(wd);
    });

    const firstDay = new Date(viewYear, viewMonth, 1);
    let startOffset = firstDay.getDay() - 1;
    if (startOffset < 0) startOffset = 6; // Воскресенье -> 6

    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

    // Пустые ячейки до 1-го числа
    for (let i = 0; i < startOffset; i++) {
        const empty = document.createElement("div");
        empty.className = "calendar-day empty";
        calendarGrid.appendChild(empty);
    }

    // Дни месяца
    for (let day = 1; day <= daysInMonth; day++) {
        const dateObj = new Date(viewYear, viewMonth, day);
        const dateKey = formatDateKey(dateObj);

        const cell = document.createElement("div");
        cell.className = "calendar-day";
        if (dateKey === todayKey) cell.classList.add("today");
        if (dateKey === selectedDateStr) cell.classList.add("selected");

        // Число
        const numSpan = document.createElement("span");
        numSpan.className = "day-number";
        numSpan.textContent = day;
        cell.appendChild(numSpan);

        // Ищем все задачи на эту дату
        const dayTasks = tasks.filter((t) => t.deadline && t.deadline.startsWith(dateKey));

        if (dayTasks.length > 0) {
            const dotsContainer = document.createElement("div");
            dotsContainer.className = "status-dots";
            dotsContainer.style.display = "flex";
            dotsContainer.style.justifyContent = "center";
            dotsContainer.style.gap = "3px";
            dotsContainer.style.marginTop = "3px";

            // Показываем до 4 цветных точек статусов задач за этот день
            dayTasks.slice(0, 4).forEach((task) => {
                const dot = document.createElement("span");
                dot.className = "status-dot";
                dot.style.width = "6px";
                dot.style.height = "6px";
                dot.style.borderRadius = "50%";
                dot.style.display = "inline-block";
                dot.style.backgroundColor = getTaskStatusColor(task, now);
                dotsContainer.appendChild(dot);
            });

            cell.appendChild(dotsContainer);
        }

        cell.addEventListener("click", () => {
            selectedDateStr = dateKey;
            renderCalendar();
            renderDayTasks();
        });

        calendarGrid.appendChild(cell);
    }
}

function renderDayTasks() {
    const tasks = loadTasks();
    const now = new Date();
    const todayKey = formatDateKey(now);

    const [y, m, d] = selectedDateStr.split("-").map(Number);
    const titlePrefix = `${d} ${monthNamesGenitive[m - 1]}`;
    calendarDayTitle.textContent = selectedDateStr === todayKey ? `${titlePrefix} — сегодня` : titlePrefix;

    const dayTasks = tasks
        .filter((t) => t.deadline && t.deadline.startsWith(selectedDateStr))
        .sort((a, b) => {
            if (Boolean(a.completed) !== Boolean(b.completed)) return a.completed ? 1 : -1;
            return new Date(a.deadline) - new Date(b.deadline);
        });

    calendarTaskList.innerHTML = "";

    if (dayTasks.length === 0) {
        calendarTaskList.innerHTML = `<div class="empty-state">На этот день задач нет</div>`;
        return;
    }

    dayTasks.forEach((task) => {
        const li = document.createElement("li");
        li.className = `task-card prio-${task.priority} ${task.completed ? "completed-status" : ""}`;

        const deadline = new Date(task.deadline);
        let timeClass = "";
        let timeText = "";

        if (!task.completed) {
            const hoursLeft = (deadline - now) / (1000 * 60 * 60);
            if (hoursLeft < 0) {
                li.classList.add("deadline-danger");
                timeClass = "overdue";
            } else if (hoursLeft <= 24) {
                li.classList.add("deadline-warning");
                timeClass = "soon";
            }
            timeText = deadline.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
        } else {
            timeText = "Выполнено";
        }

        li.innerHTML = `
            <input type="checkbox" class="task-checkbox" ${task.completed ? "checked" : ""}
                   onchange="toggleCalendarTask(${task.id})" aria-label="Отметить выполненной">
            <div class="task-main-content">
                <div class="task-title">${escapeHTML(task.title)}</div>
                <div class="task-subject">${escapeHTML(task.subject)}</div>
                <div class="task-footer">
                    <span class="prio-tag prio-${task.priority}">${prioLabels[task.priority] || "Средний"}</span>
                    <span class="task-time-badge ${timeClass}">${timeText}</span>
                </div>
            </div>
        `;
        calendarTaskList.appendChild(li);
    });
}

window.toggleCalendarTask = function (id) {
    const tasks = loadTasks();
    const task = tasks.find((t) => t.id === id);
    if (task) {
        task.completed = !task.completed;
        saveTasks(tasks);
        renderCalendar();
        renderDayTasks();
    }
};

prevMonthBtn.addEventListener("click", () => {
    viewMonth--;
    if (viewMonth < 0) {
        viewMonth = 11;
        viewYear--;
    }
    renderCalendar();
});

nextMonthBtn.addEventListener("click", () => {
    viewMonth++;
    if (viewMonth > 11) {
        viewMonth = 0;
        viewYear++;
    }
    renderCalendar();
});

if (todayBtn) {
    todayBtn.addEventListener("click", () => {
        const now = new Date();
        viewYear = now.getFullYear();
        viewMonth = now.getMonth();
        selectedDateStr = formatDateKey(now);
        renderCalendar();
        renderDayTasks();
    });
}

renderCalendar();
renderDayTasks();
