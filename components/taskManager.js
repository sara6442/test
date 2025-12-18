// إدارة المهام
let tasks = JSON.parse(localStorage.getItem('tasks')) || [];

function saveTask(task) {
    // التحقق من السعة قبل الإضافة
    if (typeof categoryManager !== 'undefined') {
        if (!categoryManager.canAddTask(task.category, task.duration)) {
            const category = categoryManager.getCategory(task.category);
            const remaining = categoryManager.getRemainingTime(task.category);
            
            alert(`❌ لا يمكن إضافة هذه المهمة!\nالمدة المطلوبة: ${task.duration} دقيقة\nالوقت المتبقي في الفئة: ${remaining} دقيقة\nسعة الفئة: ${category.totalMinutes} دقيقة`);
            return null;
        }
    }
    
    tasks.push(task);
    localStorage.setItem('tasks', JSON.stringify(tasks));
    console.log('تم حفظ المهمة:', task);
    
    // تحديث وقت الفئة المستخدم
    if (typeof categoryManager !== 'undefined') {
        categoryManager.calculateUsedTime(task.category);
    }
    
    return task;
}

function updateTask(id, updates) {
    const index = tasks.findIndex(task => task.id === id);
    if (index !== -1) {
        tasks[index] = { ...tasks[index], ...updates };
        localStorage.setItem('tasks', JSON.stringify(tasks));
        console.log('تم تحديث المهمة:', tasks[index]);
        return tasks[index];
    }
    return null;
}

function deleteTask(id) {
    const taskIndex = tasks.findIndex(task => task.id === id);
    if (taskIndex !== -1) {
        const deletedTask = tasks[taskIndex];
        tasks = tasks.filter(task => task.id !== id);
        localStorage.setItem('tasks', JSON.stringify(tasks));
        console.log('تم حذف المهمة:', deletedTask);
        return true;
    }
    return false;
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

function getAllTasks() {
    return tasks;
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

function getCategoryColor(category) {
    const colors = {
        'personal': '#4a90e2',
        'work': '#7b68ee',
        'study': '#2ecc71',
        'health': '#e74c3c'
    };
    return colors[category] || '#6c757d';
}

function getRepeatName(repeat) {
    const repeats = {
        'none': 'لا يوجد',
        'daily': 'يومياً',
        'weekly': 'أسبوعياً',
        'monthly': 'شهرياً'
    };
    return repeats[repeat] || repeat;
}

function loadTasks() {
    const container = document.getElementById('tasks-container');
    if (!container) return;
    
    const todayTasks = getTasksByDate();
    
    container.innerHTML = '';
    
    if (todayTasks.length === 0) {
        container.innerHTML = `
            <div class="no-tasks">
                <i class="fas fa-tasks fa-3x"></i>
                <h3>لا توجد مهام لهذا اليوم</h3>
                <p>ابدأ بإضافة مهمة جديدة</p>
            </div>
        `;
        updateTaskStats();
        return;
    }
    
    todayTasks.forEach(task => {
        const categoryColor = getCategoryColor(task.category);
        
        const taskElement = document.createElement('div');
        taskElement.className = `task-item ${task.completed ? 'completed' : ''}`;
        taskElement.style.borderRightColor = categoryColor;
        taskElement.dataset.id = task.id;
        
        taskElement.innerHTML = `
            <div class="task-info">
                <div class="task-title">${task.title}</div>
                ${task.description ? `<div class="task-description">${task.description}</div>` : ''}
                <div class="task-meta">
                    <span class="task-category" style="background: ${categoryColor}22; color: ${categoryColor}; border: 1px solid ${categoryColor}44;">
                        ${getCategoryName(task.category)}
                    </span>
                    <span><i class="far fa-clock"></i> ${task.duration} دقيقة</span>
                    ${task.time ? `<span><i class="fas fa-clock"></i> ${task.time}</span>` : ''}
                    ${task.repeat !== 'none' ? `<span><i class="fas fa-redo"></i> ${getRepeatName(task.repeat)}</span>` : ''}
                </div>
            </div>
            <div class="task-actions">
                <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''} 
                       data-id="${task.id}">
                <button class="btn-delete" data-id="${task.id}">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        
        container.appendChild(taskElement);
    });
    
    // إضافة أحداث للمهام الجديدة
    attachTaskEvents();
    updateTaskStats();
}

function attachTaskEvents() {
    // أحداث التبديل
    document.querySelectorAll('.task-checkbox').forEach(checkbox => {
        checkbox.addEventListener('click', function(e) {
            e.stopPropagation();
            const taskId = parseInt(this.dataset.id);
            toggleTaskComplete(taskId);
        });
    });
    
    // أحداث الحذف
    document.querySelectorAll('.btn-delete').forEach(button => {
        button.addEventListener('click', function(e) {
            e.stopPropagation();
            const taskId = parseInt(this.dataset.id);
            if (confirm('هل أنت متأكد من حذف هذه المهمة؟')) {
                deleteTask(taskId);
                loadTasks();
                if (typeof updateAllCharts === 'function') {
                    updateAllCharts();
                }
                if (typeof updateCalendar === 'function') {
                    updateCalendar();
                }
                if (typeof updateDailyChart === 'function') {
                    updateDailyChart();
                }
            }
        });
    });
    
    // أحداث النقر على المهمة (للتوسيع)
    document.querySelectorAll('.task-item').forEach(item => {
        item.addEventListener('click', function() {
            this.classList.toggle('expanded');
        });
    });
}

function toggleTaskComplete(id) {
    const task = tasks.find(t => t.id === id);
    if (task) {
        updateTask(id, { completed: !task.completed });
        loadTasks();
        if (typeof updateAllCharts === 'function') {
            updateAllCharts();
        }
        if (typeof updateCalendar === 'function') {
            updateCalendar();
        }
        if (typeof updateDailyChart === 'function') {
            updateDailyChart();
        }
    }
}

function updateTaskStats() {
    const todayTasks = getTasksByDate();
    const completedCount = todayTasks.filter(t => t.completed).length;
    const totalCount = todayTasks.length;
    
    const completedElement = document.getElementById('completed-count');
    const totalElement = document.getElementById('total-count');
    
    if (completedElement) completedElement.textContent = `${completedCount} مكتملة`;
    if (totalElement) totalElement.textContent = `${totalCount} إجمالي`;
}

function initApp() {
    console.log('تهيئة تطبيق المهام...');
    loadTasks();
}

// تعريف الدوال للنافذة العالمية
window.saveTask = saveTask;
window.updateTask = updateTask;
window.deleteTask = deleteTask;
window.loadTasks = loadTasks;
window.toggleTaskComplete = toggleTaskComplete;
window.initApp = initApp;
window.getTasksByCategory = getTasksByCategory;
window.getAllTasks = getAllTasks;
window.getCategoryColor = getCategoryColor;
