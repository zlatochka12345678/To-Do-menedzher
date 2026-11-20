const STORAGE_KEY = "itteam_tasks_v1";

const members = [
    { name: "Алексей Иванов", role: "Староста", online: true },
    { name: "Мария Петрова", role: "Студент", online: true },
    { name: "Дмитрий Смирнов", role: "Студент", online: false },
    { name: "Анна Кузнецова", role: "Студент", online: true },
    { name: "Иван Соколов", role: "Студент", online: false },
    { name: "Екатерина Новикова", role: "Студент", online: true },
    { name: "Павел Морозов", role: "Студент", online: false },
    { name: "Ольга Волкова", role: "Студент", online: true },
];

function updateGroupStats() {
    const studentsEl = document.getElementById("studentsCount");
    const activeEl = document.getElementById("groupActiveCount");
    const doneEl = document.getElementById("groupDoneCount");

    if (studentsEl) studentsEl.textContent = members.length;

    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        const tasks = raw ? JSON.parse(raw) : [];
        if (activeEl) activeEl.textContent = tasks.filter((t) => !t.completed).length;
        if (doneEl) doneEl.textContent = tasks.filter((t) => t.completed).length;
    } catch (e) {
        if (activeEl) activeEl.textContent = "0";
        if (doneEl) doneEl.textContent = "0";
    }
}

function renderMembers() {
    const list = document.getElementById("memberList");
    if (!list) return;
    list.innerHTML = "";

    members.forEach((m) => {
        const li = document.createElement("li");
        li.className = "member-item";
        const initials = m.name
            .split(" ")
            .map((w) => w[0])
            .join("")
            .toUpperCase();

        li.innerHTML = `
            <div class="member-avatar">${initials}</div>
            <div class="member-info">
                <div class="member-name">${m.name}</div>
                <div class="member-role">${m.role}</div>
            </div>
            <div class="member-status ${m.online ? "online" : "offline"}" title="${m.online ? "В сети" : "Не в сети"}"></div>
        `;
        list.appendChild(li);
    });
}

const notifBtn = document.getElementById("notifBtn");
if (notifBtn) {
    notifBtn.addEventListener("click", () => {
        const onlineCount = members.filter((m) => m.online).length;
        alert(`В сети сейчас: ${onlineCount} из ${members.length} студентов группы ИС-23`);
    });
}

updateGroupStats();
renderMembers();
