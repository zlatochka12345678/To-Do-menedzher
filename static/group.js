// Демо-данные участников (в реальном проекте — из API)
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

function renderMembers() {
    const list = document.getElementById("memberList");
    list.innerHTML = "";
    members.forEach((m) => {
        const li = document.createElement("li");
        li.className = "member-item";
        const initials = m.name.split(" ").map((w) => w[0]).join("").toUpperCase();
        li.innerHTML = `
            <div class="member-avatar">${initials}</div>
            <div class="member-info">
                <div class="member-name">${m.name}</div>
                <div class="member-role">${m.role}</div>
            </div>
            <div class="member-status ${m.online ? "online" : "offline"}"></div>
        `;
        list.appendChild(li);
    });
}

renderMembers();