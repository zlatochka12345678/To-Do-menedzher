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
        console.log("Загруженные задачи:", allTasks); // Отладка
    } catch (e) {
        console.error("Ошибка загрузки задач:", e);
    }
    renderCalendar();
    renderDayTasks();
}

// Генерирует строку даты строго в формате YYYY-MM-DD без учета часовых поясов
function getDateString(year, month, day) {
    const m = String(month + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    return `${year}-${m}-${d}`;
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

    // Узнаем, с какого дня недели начинается месяц (1 - Пн, 7 - Вс)
    const firstDay = new Date(year, month, 1);
    let startWeekday = firstDay.getDay();
    if (startWeekday === 0) startWeekday = 7;
    
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();

    // Пустые ячейки для прошлого месяца
    for (let i = startWeekday - 1; i > 0; i--) {
        const el = document.createElement("div");
        el.className = "calendar-day muted";
        el.textContent = prevMonthDays - i + 1;
        grid.appendChild(el);
    }

    const today = new Date();
    const todayString = getDateString(today.getFullYear(), today.getMonth(), today.getDate());
    const selectedString = getDateString(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
    
    for (let d = 1; d <= daysInMonth; d++) {
        const el = document.createElement("div");
        el.className = "calendar-day";
        
        const numSpan = document.createElement("span");
        numSpan.textContent = d;
        el.appendChild(numSpan);

        const cellDateString = getDateString(year, month, d);

        if (cellDateString === todayString) el.classList.add("today");
        if (cellDateString === selectedString) el.classList.add("selected");

        // Ищем задачи на этот день
        const hasTasks = allTasks.some(task => {
            if (!task.deadline) return false;
            const taskDateStr = task.deadline.substring(0, 10); // "2026-11-19"
            return taskDateStr === cellDateString;
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

    const selectedString = getDateString(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
    const todayString = getDateString(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());
    
    const dateStr = selectedDate.toLocaleDateString("ru-RU", { day: "numeric", month: "long" });
    const isToday = selectedString === todayString;
    title.textContent = `${dateStr} — ${isToday ? "сегодня" : "выбранный день"}`;

    // Фильтруем по строкам
    const dayTasks = allTasks.filter((t) => {
        if (!t.deadline) return false;
        const taskDateStr = t.deadline.substring(0, 10);
        return taskDateStr === selectedString;
    });

    console.log(`Задачи на ${selectedString}:`, dayTasks); // Отладка

    if (dayTasks.length === 0) {
        list.innerHTML = `<div class="empty-state">На этот день задач нет</div>`;
        return;
    }

    const now = new Date();

    dayTasks.forEach((task) => {
        const li = document.createElement("li");
        li.className = `task-card prio-${task.priority} ${task.completed ? "completed-status" : ""}`;
        
        // Берем время из строки "YYYY-MM-DDTHH:MM"
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
