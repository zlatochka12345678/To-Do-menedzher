const STORAGE_KEY = "itteam_tasks_v1";
let allTasks = [];
let currentDate = new Date();
let selectedDate = new Date();

const monthNames = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];
const dayNames = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

function loadTasks() {
    const grid = document.getElementById("calendarGrid");
    if (!grid) return;

    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        allTasks = raw ? JSON.parse(raw) : [];
    } catch (e) {
        allTasks = [];
    }
    renderCalendar();
    renderDayTasks();
}

function getDateString(year, month, day) {
    const m = String(month + 1).padStart(2, "0");
    const d = String(day).padStart(2, "0");
    return `${year}-${m}-${d}`;
}

function renderCalendar() {
    const grid = document.getElementById("calendarGrid");
    const monthLabel = document.getElementById("calendarMonth");
    if (!grid || !monthLabel) return;
    grid.innerHTML = "";

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    monthLabel.textContent = `${monthNames[month]} ${year}`;

    dayNames.forEach((d) => {
        const el = document.createElement("div");
        el.className = "cal-weekday calendar-weekday";
        el.textContent = d;
        grid.appendChild(el);
    });

    const firstDay = new Date(year, month, 1);
    let startWeekday = firstDay.getDay();
    if (startWeekday === 0) startWeekday = 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();

    for (let i = startWeekday - 1; i > 0; i--) {
        const el = document.createElement("div");
        el.className = "cal-day calendar-day other-month muted";
        el.textContent = prevMonthDays - i + 1;
        grid.appendChild(el);
    }

    const today = new Date();
    const todayString = getDateString(today.getFullYear(), today.getMonth(), today.getDate());
    const selectedString = getDateString(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());

    for (let d = 1; d <= daysInMonth; d++) {
        const el = document.createElement("div");
        el.className = "cal-day calendar-day";

        const numSpan = document.createElement("span");
        numSpan.className = "cal-day-num";
        numSpan.textContent = d;
        el.appendChild(numSpan);

        const cellDateString = getDateString(year, month, d);

        if (cellDateString === todayString) el.classList.add("today");
        if (cellDateString === selectedString) el.classList.add("selected");

        const dayTasks = allTasks.filter((task) => task.deadline && task.deadline.substring(0, 10) === cellDateString);

        if (dayTasks.length > 0) {
            const dotsWrap = document.createElement("div");
            dotsWrap.className = "cal-dots";
            dayTasks.slice(0, 3).forEach((t) => {
                const dot = document.createElement("span");
                dot.className = "cal-dot calendar-dot " + (t.completed ? "completed" : "active");
                dotsWrap.appendChild(dot);
            });
            el.appendChild(dotsWrap);
        }

        el.addEventListener("click", () => {
            selectedDate = new Date(year, month, d);
            renderCalendar();
            renderDayTasks();
        });
        grid.appendChild(el);
    }
}

function renderDayTasks() {
    const list = document.getElementById("calendarTaskList");
    const title = document.getElementById("calendarDayTitle");
    const countLabel = document.getElementById("calendarDayCount");
    if (!list || !title) return;

    list.innerHTML = "";

    const selectedString = getDateString(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
    const todayString = getDateString(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());

    const dateStr = selectedDate.toLocaleDateString("ru-RU", { day: "numeric", month: "long" });
    const isToday = selectedString === todayString;
    title.textContent = `${dateStr} • ${isToday ? "сегодня" : "выбранный день"}`;

    const dayTasks = allTasks.filter((t) => t.deadline && t.deadline.substring(0, 10) === selectedString);

    if (countLabel) {
        countLabel.textContent = dayTasks.length > 0 ? `Задач: ${dayTasks.length}` : "";
    }

    if (dayTasks.length === 0) {
        list.innerHTML = `<div class="empty-state">На этот день задач нет</div>`;
        return;
    }

    const now = new Date();

    dayTasks.forEach((task) => {
        const li = document.createElement("li");
        li.className = `task-card prio-${task.priority} ${task.completed ? "completed-status" : ""}`;

        let time = "00:00";
        if (task.deadline.length >= 16) {
            time = task.deadline.substring(11, 16);
        }

        let timeClass = "";
        if (!task.completed && task.deadline) {
            const taskDate = new Date(task.deadline);
            const hoursLeft = (taskDate - now) / (1000 * 60 * 60);
            if (hoursLeft < 0) timeClass = "overdue";
            else if (hoursLeft <= 24) timeClass = "soon";
        }

        li.innerHTML = `
            <div class="task-main-content">
                <div class="task-title">${escapeHTML(task.title)}</div>
                <div class="task-subject">${escapeHTML(task.subject)}</div>
                <div class="task-footer">
                    <span class="prio-tag prio-${task.priority}">${task.priority === "high" ? "Высокий" : task.priority === "medium" ? "Средний" : "Низкий"}</span>
                    <span class="task-time-badge ${timeClass}">${time}</span>
                </div>
            </div>
        `;
        list.appendChild(li);
    });
}

function escapeHTML(str) {
    return String(str).replace(/[&<>'"]/g, (tag) =>
        ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "'", '"': "&quot;" }[tag] || tag)
    );
}

const prevMonthBtn = document.getElementById("prevMonth");
const nextMonthBtn = document.getElementById("nextMonth");
const todayBtn = document.getElementById("todayBtn");

if (prevMonthBtn) {
    prevMonthBtn.addEventListener("click", () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar();
    });
}
if (nextMonthBtn) {
    nextMonthBtn.addEventListener("click", () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar();
    });
}
if (todayBtn) {
    todayBtn.addEventListener("click", () => {
        currentDate = new Date();
        selectedDate = new Date();
        renderCalendar();
        renderDayTasks();
    });
}

loadTasks();
