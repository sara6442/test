// إدارة المهام
let tasks = JSON.parse(localStorage.getItem('tasks')) || [];

function saveTask(task) {
    tasks.push(task);
    localStorage.setItem('tasks', JSON.stringify(tasks));
    console.log('تم حفظ المهمة:', task);
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

function getAllTasks()
