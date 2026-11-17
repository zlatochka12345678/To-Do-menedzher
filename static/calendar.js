const API_URL = "/api/tasks";
let allTasks = [];
let currentDate = new Date();
let selectedDate = new Date();

const monthNames = ["Январь","Февраль","Март","Апрель","Май","Июнь","Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь"];
const dayNames = ["Пн","Вт","Ср","Чт","Пт","Сб","Вс"];

async function loadTasks() {
    try {
        const res = await fetch(API_URL);
        allTasks = await res.json();
    } catch (e) {
        console.error(e);
    }
    renderCalendar();
    renderDayTasks();
}

function renderCalendar() {
    const grid = document.getElementById("calendarGrid");
    const monthLabel = document.getElementById("calendarMonth");
    grid.innerHTML = "";

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    monthLabel.textContent = `${monthNames[month]} ${year}`;

    // Дни недели
    dayNames.forEach((d) => {
        const el = document.createElement("div");
        el.className = "calendar-weekday";
        el.textContent = d;
        grid.appendChild(el);
    });

    const firstDay = new Date(year, month, 1);
    let startWeekday = firstDay.getDay();
    if (startWeekday === 0) startWeekday = 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();

    // Дни прошлого месяца
    for (let i = startWeekday - 1; i > 0; i--) {
        const el = document.createElement("div");
        el.className = "calendar-day muted";
        el.textContent = prevMonthDays - i + 1;
        grid.appendChild(el);
    }

    const today = new Date();
    for (let d = 1; d <= daysInMonth; d++) {
        const el = document.createElement("div");
        el.className = "calendar-day";
        el.textContent = d;

        const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === d;
        const isSelected = selectedDate.getFullYear() === year && selectedDate.getMonth() === month && selectedDate.getDate() === d;

        if (isToday) el.classList.add("today");
        if (isSelected) el.classList.add("selected");

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
    list.innerHTML = "";

    const dateStr = selectedDate.toLocaleDateString("ru-RU", { day: "numeric", month: "long" });
    const isToday = new Date().toDateString() === selectedDate.toDateString();
    title.textContent = `${dateStr} — ${isToday ? "сегодня" : "выбранный день"}`;

    const dayTasks = allTasks.filter((t) => {
        const d = new Date(t.deadline);
        return d.getFullYear() === selectedDate.getFullYear()
            && d.getMonth() === selectedDate.getMonth()
            && d.getDate() === selectedDate.getDate();
    });

    if (dayTasks.length === 0) {
        list.innerHTML = `<div class="empty-state">На этот день задач нет</div>`;
        return;
    }

    dayTasks.forEach((task) => {
        const li = document.createElement("li");
        li.className = `task-card prio-${task.priority} ${task.completed ? "completed-status" : ""}`;
        const time = new Date(task.deadline).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
        li.innerHTML = `
            <div class="task-main-content">
                <div class="task-title">${escapeHTML(task.title)}</div>
                <div class="task-subject">${escapeHTML(task.subject)}</div>
                <div class="task-footer">
                    <span class="prio-tag prio-${task.priority}">${time}</span>
                </div>
            </div>
        `;
        list.appendChild(li);
    });
}

function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, (tag) =>
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

loadTasks();