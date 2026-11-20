const STORAGE_KEY = "itteam_tasks_v1";
let allTasks = [];
let currentDate = new Date();
let selectedDate = new Date();

const monthNames = [
    "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
    "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"
];
const dayNames = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

function loadTasks() {
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
        el.className = "cal-weekday";
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
        el.className = "cal-day other-month";
        el.textContent = prevMonthDays - i + 1;
        grid.appendChild(el);
    }

    const today = new Date();
    const todayString = getDateString(today.getFullYear(), today.getMonth(), today.getDate());
    const selectedString = getDateString(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());

    for (let d = 1; d <= daysInMonth; d++) {
        const el = document.createElement("div");
        el.className = "cal-day";

        const num = document.createElement("span");
        num.textContent = d;
        el.appendChild(num);

        const cellDateString = getDateString(year, month, d);
        if (cellDateString === todayString) el.classList.add("today");
        if (cellDateString === selectedString) el.classList.add("selected");

        const dayTasks = allTasks.filter(
            (t) => t.deadline && t.deadline.substring(0, 10) === cellDateString
        );

        if (dayTasks.length > 0) {
            const dots = document.createElement("div");
            dots.className = "cal-dots";
            dayTasks.slice(0, 3).forEach((t) => {
                const dot = document.createElement("span");
                dot.className = "cal-dot" + (t.completed ? " completed" : "");
                dots.appendChild(dot);
            });
            el.appendChild(dots);
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
    const count = document.getElementById("calendarDayCount");
    if (!list || !title) return;

    list.innerHTML = "";
    const selectedString = getDateString(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
    const todayString = getDateString(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());

    const dateStr = selectedDate.toLocaleDateString("ru-RU", { day: "numeric", month: "long" });
    title.textContent = `${dateStr} • ${selectedString === todayString ? "сегодня" : "выбранный день"}`;

    const dayTasks = allTasks.filter(
        (t) => t.deadline && t.deadline.substring(0, 10) === selectedString
    );

    if (count) {
        count.textContent = dayTasks.length > 0 ? `Задач: ${dayTasks.length}` : "";
    }

    if (dayTasks.length === 0) {
        list.innerHTML = `<div class="empty-state">На этот день задач нет</div>`;
        return;
    }

    const now = new Date();
    dayTasks.forEach((task) => {
        const li = document.createElement("li");
        li.className = `task-card prio-${task.priority} ${task.completed ? "completed-status" : ""}`;

        const time = task.deadline.length >= 16 ? task.deadline.substring(11, 16) : "00:00";
        let timeClass = "";
        if (!task.completed && task.deadline) {
            const hrs = (new Date(task.deadline) - now) / 3600000;
            if (hrs < 0) timeClass = "overdue";
            else if (hrs <= 24) timeClass = "soon";
        }

        const prioText =
            task.priority === "high" ? "Высокий" : task.priority === "medium" ? "Средний" : "Низкий";

        li.innerHTML = `
            <div class="task-main-content">
                <div class="task-title">${escapeHTML(task.title)}</div>
                <div class="task-subject">${escapeHTML(task.subject)}</div>
                <div class="task-footer">
                    <span class="prio-tag prio-${task.priority}">${prioText}</span>
                    <span class="task-time-badge ${timeClass}">${time}</span>
                </div>
            </div>
        `;
        list.appendChild(li);
    });
}

function escapeHTML(str) {
    return String(str).replace(/[&<>'"]/g, (tag) =>
        ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[tag] || tag)
    );
}

document.getElementById("prevMonth").addEventListener("click", () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar();
});

document.getElementById("nextMonth").addEventListener("click", () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar();
});

document.getElementById("todayBtn").addEventListener("click", () => {
    currentDate = new Date();
    selectedDate = new Date();
    renderCalendar();
    renderDayTasks();
});

loadTasks();
