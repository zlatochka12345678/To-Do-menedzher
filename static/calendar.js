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
        console.error("Ошибка загрузки задач для календаря:", e);
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
    if (startWeekday === 0) startWeekday = 7; // Воскресенье - 7-й день
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();

    // Дни прошлого месяца (для заполнения сетки)
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
        
        // Создаем контейнер для числа, чтобы можно было добавить точку
        const numSpan = document.createElement("span");
        numSpan.textContent = d;
        el.appendChild(numSpan);

        const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === d;
        const isSelected = selectedDate.getFullYear() === year && selectedDate.getMonth() === month && selectedDate.getDate() === d;

        if (isToday) el.classList.add("today");
        if (isSelected) el.classList.add("selected");

        // Проверяем, есть ли задачи на этот день
        const hasTasks = allTasks.some(task => {
            const taskDate = new Date(task.deadline);
            return taskDate.getFullYear() === year && taskDate.getMonth() === month && taskDate.getDate() === d;
        });

        if (hasTasks) {
            const dot = document.createElement("div");
            dot.className = "calendar-dot";
            el.appendChild(dot);
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
    list.innerHTML = "";

    const dateStr = selectedDate.toLocaleDateString("ru-RU", { day: "numeric", month: "long" });
    const isToday = new Date().toDateString() === selectedDate.toDateString();
    title.textContent = `${dateStr} — ${isToday ? "сегодня" : "выбранный день"}`;

    // Ищем задачи на выбранный день
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

    const now = new Date();

    dayTasks.forEach((task) => {
        const li = document.createElement("li");
        li.className = `task-card prio-${task.priority} ${task.completed ? "completed-status" : ""}`;
        
        const taskDate = new Date(task.deadline);
        const time = taskDate.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
        
        let timeClass = "";
        if (!task.completed) {
            const hoursLeft = (taskDate - now) / (1000 * 60 * 60);
            if (hoursLeft < 0) timeClass = "overdue";
            else if (hoursLeft <= 24) timeClass = "soon";
        }

        li.innerHTML = `
            <div class="task-main-content">
                <div class="task-title">${escapeHTML(task.title)}</div>
                <div class="task-subject">${escapeHTML(task.subject)}</div>
                <div class="task-footer">
                    <span class="prio-tag prio-${task.priority}">${task.priority === 'high' ? 'Высокий' : task.priority === 'medium' ? 'Средний' : 'Низкий'}</span>
                    <span class="task-time-badge ${timeClass}">${time}</span>
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
