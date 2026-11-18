// Массив для хранения задач на время работы страницы
let tasks = [];
let currentFilter = 'all';

// Защита от XSS (сохранена совместимость с вашими автотестами)
function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/[&<>'"]/g, 
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag])
    );
}

// Определение класса срочности по дедлайну
function getUrgencyClass(deadlineStr, completed) {
    if (completed || !deadlineStr) return '';
    const now = new Date();
    const deadline = new Date(deadlineStr);
    const diffHours = (deadline - now) / (1000 * 60 * 60);

    if (diffHours < 0) return 'deadline-danger';
    if (diffHours <= 24) return 'deadline-warning';
    return '';
}

// Отрисовка списка задач и обновление счетчиков
function renderTasks() {
    const taskList = document.getElementById('taskList');
    const currentCountEl = document.getElementById('currentCount');
    const completedCountEl = document.getElementById('completedCount');

    // Сортировка: сначала невыполненные по дедлайну, затем выполненные
    const sortedTasks = [...tasks].sort((a, b) => {
        if (a.completed !== b.completed) {
            return a.completed ? 1 : -1;
        }
        return new Date(a.deadline) - new Date(b.deadline);
    });

    // Обновляем счетчики
    const activeCount = tasks.filter(t => !t.completed).length;
    const doneCount = tasks.filter(t => t.completed).length;
    if (currentCountEl) currentCountEl.textContent = activeCount;
    if (completedCountEl) completedCountEl.textContent = doneCount;

    // Фильтрация по вкладкам
    const filteredTasks = sortedTasks.filter(task => {
        if (currentFilter === 'current') return !task.completed;
        if (currentFilter === 'completed') return task.completed;
        return true;
    });

    if (!taskList) return;
    taskList.innerHTML = '';

    filteredTasks.forEach(task => {
        const urgencyClass = getUrgencyClass(task.deadline, task.completed);
        const card = document.createElement('div');
        card.className = `task-card ${task.completed ? 'completed' : ''} ${urgencyClass}`.trim();

        card.innerHTML = `
            <div class="task-left">
                <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''} onchange="toggleTask(${task.id})">
                <div class="task-info">
                    <div class="task-title">${escapeHTML(task.title)}</div>
                    <div class="task-subject">${escapeHTML(task.subject)}</div>
                    <div class="task-deadline">${escapeHTML(task.deadline.replace('T', ' '))}</div>
                </div>
            </div>
            <button class="delete-btn" onclick="deleteTask(${task.id})">🗑</button>
        `;
        taskList.appendChild(card);
    });
}

// Создание задачи БЕЗ запросов к серверу и БЕЗ alert()
function handleCreateTask(event) {
    event.preventDefault();

    const titleInput = document.getElementById('taskTitle');
    const subjectInput = document.getElementById('taskSubject');
    const deadlineInput = document.getElementById('taskDeadline');
    const priorityBtn = document.querySelector('.priority-btn.active');

    const newTask = {
        id: Date.now(),
        title: titleInput ? titleInput.value.trim() : 'Новая задача',
        subject: subjectInput ? subjectInput.value.trim() : '',
        priority: priorityBtn ? priorityBtn.dataset.priority : 'medium',
        deadline: deadlineInput ? deadlineInput.value : '',
        completed: false
    };

    tasks.push(newTask);

    // Очистка формы и закрытие модального окна
    event.target.reset();
    const modal = document.getElementById('taskModal');
    if (modal) modal.style.display = 'none';

    renderTasks();
}

// Переключение статуса выполнения
function toggleTask(id) {
    const task = tasks.find(t => t.id === id);
    if (task) {
        task.completed = !task.completed;
        renderTasks();
    }
}

// Удаление задачи
function deleteTask(id) {
    tasks = tasks.filter(t => t.id !== id);
    renderTasks();
}

// Инициализация событий после загрузки страницы
document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('form');
    if (form) {
        form.addEventListener('submit', handleCreateTask);
    }

    // Переключение вкладок фильтрации
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter || 'all';
            renderTasks();
        });
    });

    // Открытие и закрытие модального окна
    const openBtn = document.getElementById('openModalBtn');
    const modal = document.getElementById('taskModal');
    if (openBtn && modal) {
        openBtn.addEventListener('click', () => {
            modal.style.display = 'flex';
        });
    }

    renderTasks();
});
