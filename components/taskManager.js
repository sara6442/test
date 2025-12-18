// ... في بداية الملف، بعد تعريف tasks ...

// تعديل دالة getTasksByCategory لاستخدام categoryManager
function getTasksByCategory(category) {
    return tasks.filter(task => task.category === category);
}

// تعديل دالة loadTasks لإضافة فحص الحدود
function loadTasks() {
    const container = document.getElementById('tasks-container');
    const todayTasks = getTasksByDate();
    
    container.innerHTML = '';
    
    if (todayTasks.length === 0) {
        container.innerHTML = '<p class="no-tasks">لا توجد مهام لهذا اليوم</p>';
        return;
    }
    
    todayTasks.forEach(task => {
        const category = categoryManager.getCategory(task.category);
        const categoryColor = category ? category.color : '#6c757d';
        
        const taskElement = document.createElement('div');
        taskElement.className = `task-item ${task.completed ? 'completed' : ''}`;
        taskElement.style.borderRightColor = categoryColor;
        
        taskElement.innerHTML = `
            <div class="task-info">
                <div class="task-title">${task.title}</div>
                <div class="task-meta">
                    <span class="task-category" style="background: ${categoryColor}22; color: ${categoryColor};">
                        ${getCategoryName(task.category)}
                    </span>
                    <span><i class="far fa-clock"></i> ${task.duration} دقيقة</span>
                    ${task.time ? `<span><i class="far fa-clock"></i> ${task.time}</span>` : ''}
                    ${task.repeat !== 'none' ? `<span><i class="fas fa-redo"></i> ${getRepeatName(task.repeat)}</span>` : ''}
                    ${category && categoryManager.getPercentage(task.category) >= 100 ? 
                      '<span class="category-full"><i class="fas fa-exclamation-triangle"></i> ممتلئة</span>' : ''}
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

// ... بقية الدوال تبقى كما هي ...
