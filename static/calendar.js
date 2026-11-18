const STORAGE_KEY = "it_team_tasks_storage";

const calendarGrid = document.getElementById("calendarGrid");
const calendarMonth = document.getElementById("calendarMonth");
const calendarDayTitle = document.getElementById("calendarDayTitle");
const calendarTaskList = document.getElementById("calendarTaskList");
const prevMonthBtn = document.getElementById("prevMonth");
const nextMonthBtn = document.getElementById("nextMonth");
const todayBtn = document.getElementById("todayBtn") || document.querySelector(".small-btn");

const monthNames = [
    "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
    "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"
];

const monthNamesGenitive = [
    "января", "февраля", "марта", "апреля", "мая", "июня",
    "июля", "августа", "сентября", "октября", "ноября", "декабря"
];

const weekDays = ["ПН", "ВТ", "СР", "ЧТ", "ПТ", "СБ", "ВС"];
const prioLabels = { high: "Высокий", medium: "Средний", low: "Низкий" };

let nowDate = new Date();
let viewYear = nowDate.getFullYear();
let viewMonth = nowDate.getMonth();
let selectedDateStr = formatDateKey(nowDate);

function loadTasks() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem("it_team_tasks") || "[]";
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
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

// Исправленное извлечение даты в формате YYYY-MM-DD
function extractDateKey(deadlineStr) {
    if (!deadlineStr) return "";
    const str = String(deadlineStr).trim();

    // Формат YYYY-MM-DD или YYYY-MM-DDTHH:MM
    const isoMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (isoMatch) {
        return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
    }

    // Формат DD.MM.YYYY
    const ruMatch = str.match(/^(\d{2})\.(\d{2})\.(\d{4})/);
    if (ruMatch) {
        return `${ruMatch[3]}-${ruMatch[2]}-${ruMatch[1]}`;
    }

    const parsed = new Date(str);
    if (!isNaN(parsed.getTime())) {
        return formatDateKey(parsed);
    }
    return "";
}

function escapeHTML(str) {
    return String(str).replace(/[&<>'"]/g, (tag) =>
        ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[tag] || tag)
    );
}

// Определяем класс статуса для цветной точки
function getStatusClass(task, now) {
    if (task.completed) return "completed";
    const deadline = new Date(task.deadline);
    if (!isNaN(deadline.getTime())) {
        const hoursLeft = (deadline - now) / (1000 * 60 * 60);
        if (hoursLeft < 0) return "overdue";
        if (hoursLeft <= 24) return "soon";
    }
    return "active";
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
        wd.className = "cal-weekday";
        wd.textContent = day;
        calendarGrid.appendChild(wd);
    });

    const firstDay = new Date(viewYear, viewMonth, 1).getDay();
    const startOffset = firstDay === 0 ? 6 : firstDay - 1;
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

    // Дни предыдущего месяца (серые числа в начале сетки, как на 2 скриншоте)
    const prevMonthDays = new Date(viewYear, viewMonth, 0).getDate();
    for (let i = startOffset - 1; i >= 0; i--) {
        const prevDayNum = prevMonthDays - i;
        const empty = document.createElement("div");
        empty.className = "cal-day other-month";
        empty.innerHTML = `<span class="cal-day-num">${prevDayNum}</span><div class="cal-dots"></div>`;
        calendarGrid.appendChild(empty);
    }

    // Дни текущего месяца
    for (let day = 1; day <= daysInMonth; day++) {
        const dateObj = new Date(viewYear, viewMonth, day);
        const dateKey = formatDateKey(dateObj);

        const cell = document.createElement("div");
        cell.className = "cal-day";
        if (dateKey === todayKey) cell.classList.add("today");
        if (dateKey === selectedDateStr) cell.classList.add("selected");

        const numSpan = document.createElement("span");
        numSpan.className = "cal-day-num";
        numSpan.textContent = day;
        cell.appendChild(numSpan);

        // Находим задачи на этот день
        const dayTasks = tasks.filter((t) => extractDateKey(t.deadline) === dateKey);

        const dotsWrap = document.createElement("div");
        dotsWrap.className = "cal-dots";

        if (dayTasks.length > 0) {
            dayTasks.slice(0, 4).forEach((task) => {
                const dot = document.createElement("span");
                const statusClass = getStatusClass(task, now);
                dot.className = `cal-dot ${statusClass}`;
                dotsWrap.appendChild(dot);
            });
        }

        cell.appendChild(dotsWrap);

        cell.addEventListener("click", () => {
            selectedDateStr = dateKey;
            renderCalendar();
            renderDayTasks();
        });

        calendarGrid.appendChild(cell);
    }

    // Дни следующего месяца (серые числа в конце сетки)
    const totalCells = startOffset + daysInMonth;
    const remainingCells = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
    for (let nextDay = 1; nextDay <= remainingCells; nextDay++) {
        const empty = document.createElement("div");
        empty.className = "cal-day other-month";
        empty.innerHTML = `<span class="cal-day-num">${nextDay}</span><div class="cal-dots"></div>`;
        calendarGrid.appendChild(empty);
    }
}

function renderDayTasks() {
    const tasks = loadTasks();
    const now = new Date();
    const todayKey = formatDateKey(now);

    const [y, m, d] = selectedDateStr.split("-").map(Number);
    const titlePrefix = `${d} ${monthNamesGenitive[m - 1]}`;
    calendarDayTitle.textContent = selectedDateStr === todayKey ? `${titlePrefix} • сегодня` : titlePrefix;

    const dayTasks = tasks
        .filter((t) => extractDateKey(t.deadline) === selectedDateStr)
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
            if (!isNaN(deadline.getTime())) {
                const hoursLeft = (deadline - now) / (1000 * 60 * 60);
                const timeStr = deadline.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });

                if (hoursLeft < 0) {
                    li.classList.add("deadline-danger");
                    timeClass = "overdue";
                    timeText = `${timeStr} • просрочено`;
                } else if (hoursLeft <= 24) {
                    li.classList.add("deadline-warning");
                    timeClass = "soon";
                    const hrs = Math.max(1, Math.round(hoursLeft));
                    timeText = `${timeStr} • осталось ${hrs} ч.`;
                } else {
                    timeText = timeStr;
                }
            } else {
                timeText = task.deadline;
            }
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
