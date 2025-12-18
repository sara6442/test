// إدارة المهام
let tasks = JSON.parse(localStorage.getItem('tasks')) || [];

function saveTask(task) {
    tasks.push(task);
    localStorage.setItem('tasks', JSON.stringify(tasks));
    return task;
}

function updateTask(id, updates) {
    const index = tasks.findIndex(task => task.id === id);
    if (index !== -1) {
        tasks[index] = { ...tasks[index], ...updates };
        localStorage.setItem('tasks', JSON.stringify(tasks));
        return tasks[index];
    }
    return null;
}

function deleteTask(id) {
    tasks = tasks.filter(task => task.id !== id);
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

function getTasksByDate(date = new Date()) {
    const dateStr = date.toDateString();
    return tasks.filter(task => {
        const taskDate = new Date(task.createdAt).toDateString();
        return taskDate === dateStr;
    });
}

function getTasksByCategory(category) {
    return tasks.filter(task => task.category === category);
}

function loadTasks() {
    const container = document.getElementById('tasks-container');
    const todayTasks = getTasksByDate();
    
    container.innerHTML = '';
    
    if (todayTasks.length === 0) {
        container.innerHTML = '<p class="no-tasks">لا توجد مهام لهذا اليوم</p>';
        return;
    }
    
    todayTasks.forEach(task => {
        const taskElement = document.createElement('div');
        taskElement.className = `task-item ${task.completed ? 'completed' : ''}`;
        taskElement.innerHTML = `
            <div class="task-info">
                <div class="task-title">${task.title}</div>
                <div class="task-meta">
                    <span class="task-category">${getCategoryName(task.category)}</span>
                    <span><i class="far fa-clock"></i> ${task.duration} دقيقة</span>
                    ${task.time ? `<span><i class="far fa-clock"></i> ${task.time}</span>` : ''}
                    ${task.repeat !== 'none' ? `<span><i class="fas fa-redo"></i> ${getRepeatName(task.repeat)}</span>` : ''}
                </div>
            </div>
            <div class="task-actions">
                <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''} 
                       data-id="${task.id}" onchange="toggleTaskComplete(${task.id})">
                <button class="btn-delete" onclick="deleteTask(${task.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        
        container.appendChild(taskElement);
    });
    
    // تحديث الإحصائيات
    const completedCount = todayTasks.filter(t => t.completed).length;
    document.getElementById('completed-count').textContent = `${completedCount} مكتملة`;
    document.getElementById('total-count').textContent = `${todayTasks.length} إجمالي`;
}

function getCategoryName(category) {
    const categories = {
        'personal': 'مهام شخصية',
        'work': 'عمل',
        'study': 'دراسة',
        'health': 'صحة'
    };
    return categories[category] || category;
}

function getRepeatName(repeat) {
    const repeats = {
        'none': 'لا يوجد',
        'daily': 'يومياً',
        'weekly': 'أسبوعياً',
        'weekdays': 'أيام الأسبوع'
    };
    return repeats[repeat] || repeat;
}

function toggleTaskComplete(id) {
    const task = tasks.find(t => t.id === id);
    if (task) {
        updateTask(id, { completed: !task.completed });
        loadTasks();
        if (typeof updateCharts === 'function') {
            updateCharts();
        }
    }
}

// تعريف الدوال للنافذة العالمية
window.saveTask = saveTask;
window.updateTask = updateTask;
window.deleteTask = deleteTask;
window.loadTasks = loadTasks;
window.toggleTaskComplete = toggleTaskComplete;

function initApp() {
    loadTasks();
}

window.initApp = initApp;
