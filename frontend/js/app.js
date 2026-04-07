// DOM элементы
const tasksList = document.getElementById("tasksList");
const loadingContainer = document.getElementById("loadingContainer");
const errorMessage = document.getElementById("errorMessage");
const inputTitle = document.getElementById("inputTitle");
const inputDesc = document.getElementById("inputDesc");
const btnAdd = document.getElementById("btnAdd");
const tasksCount = document.getElementById("tasksCount");

// Состояние
let allTasks = [];
let activeFilter = "all";

// Экранирование HTML (защита от XSS)
function escapeHtml(str) {
    if (!str) return "";
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

// Форматирование даты
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString("ru-RU", {
        day: "numeric",
        month: "short",
        year: "numeric"
    });
}

// Создание HTML карточки задачи (режим просмотра)
function createTaskHTML(task) {
    const date = formatDate(task.createdAt);
    const descHtml = task.description 
        ? `<p class="task-description">${escapeHtml(task.description)}</p>` 
        : "";
    
    return `
        <li class="task-item ${task.isCompleted ? "completed" : ""}" id="task-${task.id}">
            <div class="task-view">
                <input type="checkbox" class="task-checkbox" 
                    ${task.isCompleted ? "checked" : ""} 
                    onchange="handleToggle(${task.id}, this.checked)">
                <div class="task-content">
                    <p class="task-title">${escapeHtml(task.title)}</p>
                    ${descHtml}
                    <p class="task-date">📅 ${date}</p>
                </div>
                <div class="task-actions">
                    <button class="btn-edit-task" onclick="showEditMode(${task.id})">✏️</button>
                    <button class="btn-delete-task" onclick="handleDelete(${task.id})">🗑️</button>
                </div>
            </div>
            <div class="task-edit" id="edit-${task.id}">
                <input type="text" id="editTitle-${task.id}" value="${escapeHtml(task.title)}">
                <textarea id="editDesc-${task.id}" rows="2">${escapeHtml(task.description)}</textarea>
                <p class="edit-error" id="editError-${task.id}"></p>
                <div class="edit-buttons">
                    <button class="btn-save-task" onclick="handleUpdate(${task.id})">💾 Сохранить</button>
                    <button class="btn-cancel-task" onclick="hideEditMode(${task.id})">Отмена</button>
                </div>
            </div>
        </li>
    `;
}

// Отрисовка задач
function renderTasks(tasks) {
    // Скрываем загрузчик
    if (loadingContainer) loadingContainer.style.display = "none";
    
    // Обновляем счётчик
    const total = allTasks.length;
    const completed = allTasks.filter(t => t.isCompleted).length;
    if (tasksCount) {
        tasksCount.textContent = `✅ ${completed} из ${total} выполнено`;
    }
    
    if (tasks.length === 0) {
        tasksList.innerHTML = '<li class="empty-text">📭 Задач не найдено</li>';
        return;
    }
    
    tasksList.innerHTML = tasks.map(task => createTaskHTML(task)).join("");
}

// Применение фильтра
function applyFilter() {
    let filtered = allTasks;
    
    if (activeFilter === "active") {
        filtered = allTasks.filter(t => !t.isCompleted);
    } else if (activeFilter === "completed") {
        filtered = allTasks.filter(t => t.isCompleted);
    }
    
    renderTasks(filtered);
}

// Загрузка задач с сервера
async function loadTasks() {
    try {
        allTasks = await getAllTasks();
        applyFilter();
    } catch (error) {
        if (loadingContainer) loadingContainer.style.display = "none";
        tasksList.innerHTML = `<li class="empty-text">❌ Ошибка: ${error.message}</li>`;
    }
}

// Добавление задачи
async function handleAdd() {
    const title = inputTitle.value.trim();
    const description = inputDesc.value.trim();
    
    errorMessage.textContent = "";
    
    if (!title) {
        errorMessage.textContent = "Введите название задачи";
        inputTitle.focus();
        return;
    }
    
    btnAdd.disabled = true;
    btnAdd.textContent = "Добавляем...";
    
    try {
        await createTask(title, description);
        inputTitle.value = "";
        inputDesc.value = "";
        await loadTasks();
    } catch (error) {
        errorMessage.textContent = error.message;
    } finally {
        btnAdd.disabled = false;
        btnAdd.textContent = "➕ Добавить задачу";
        inputTitle.focus();
    }
}

// Переключение статуса задачи (чекбокс)
async function handleToggle(id, isCompleted) {
    const task = allTasks.find(t => t.id === id);
    if (!task) return;
    
    try {
        await updateTask(id, task.title, task.description, isCompleted);
        await loadTasks();
    } catch (error) {
        alert("Ошибка: " + error.message);
        await loadTasks(); // восстанавливаем состояние
    }
}

// Показать режим редактирования
function showEditMode(id) {
    const item = document.getElementById(`task-${id}`);
    const viewMode = item.querySelector(".task-view");
    const editMode = document.getElementById(`edit-${id}`);
    
    viewMode.style.display = "none";
    editMode.style.display = "flex";
    document.getElementById(`editTitle-${id}`).focus();
}

// Скрыть режим редактирования
function hideEditMode(id) {
    const item = document.getElementById(`task-${id}`);
    const viewMode = item.querySelector(".task-view");
    const editMode = document.getElementById(`edit-${id}`);
    
    viewMode.style.display = "flex";
    editMode.style.display = "none";
    
    // Сбрасываем ошибку
    const errorEl = document.getElementById(`editError-${id}`);
    if (errorEl) errorEl.textContent = "";
}

// Обновление задачи (сохранение после редактирования)
async function handleUpdate(id) {
    const title = document.getElementById(`editTitle-${id}`).value.trim();
    const description = document.getElementById(`editDesc-${id}`).value.trim();
    const errorEl = document.getElementById(`editError-${id}`);
    
    errorEl.textContent = "";
    
    if (!title) {
        errorEl.textContent = "Название не может быть пустым";
        return;
    }
    
    const task = allTasks.find(t => t.id === id);
    if (!task) return;
    
    try {
        await updateTask(id, title, description, task.isCompleted);
        hideEditMode(id);
        await loadTasks();
    } catch (error) {
        errorEl.textContent = error.message;
    }
}

// Удаление задачи
async function handleDelete(id) {
    const task = allTasks.find(t => t.id === id);
    const taskName = task ? `"${task.title}"` : `#${id}`;
    
    if (!confirm(`Удалить задачу ${taskName}?`)) return;
    
    try {
        await deleteTask(id);
        await loadTasks();
    } catch (error) {
        alert("Ошибка при удалении: " + error.message);
    }
}

// Настройка фильтров
function setupFilters() {
    const filterBtns = document.querySelectorAll(".filter-btn");
    
    filterBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            // Убираем active у всех
            filterBtns.forEach(b => b.classList.remove("active"));
            // Добавляем active текущей
            btn.classList.add("active");
            // Обновляем фильтр
            activeFilter = btn.dataset.filter;
            applyFilter();
        });
    });
}

// Обработчики событий
btnAdd.addEventListener("click", handleAdd);

inputTitle.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        event.preventDefault();
        handleAdd();
    }
});

// Инициализация при загрузке
document.addEventListener("DOMContentLoaded", () => {
    setupFilters();
    loadTasks();
});``