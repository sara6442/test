// تخزين المهام
let tasks = JSON.parse(localStorage.getItem('tasks')) || [];

// وظائف إدارة المهام
export function addTask(task) {
    tasks.push(task);
    saveToLocalStorage();
}

export function deleteTask(taskId) {
    tasks = tasks.filter(task => task.id !== taskId);
    saveToLocalStorage();
}

export function updateTask(taskId, updatedTask) {
    const index = tasks.findIndex(task => task.id === taskId);
    if (index !== -1) {
        tasks[index] = { ...tasks[index], ...updatedTask };
        saveToLocalStorage();
    }
}

export function getTasks() {
    return [...tasks];
}

export function getTaskById(taskId) {
    return tasks.find(task => task.id === taskId);
}

export function getTasksByDate(date) {
    return tasks.filter(task => task.date === date);
}

export function getTasksByCategory(categoryId) {
    return tasks.filter(task => task.categoryId === categoryId);
}

export function toggleTaskCompletion(taskId) {
    const task = getTaskById(taskId);
    if (task) {
        task.completed = !task.completed;
        updateTask(taskId, task);
    }
}

export function getTasksByTimeRange(range) {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    switch(range) {
        case 'daily':
            return getTasksByDate(today);
        case 'weekly':
            const weekAgo = new Date(now.setDate(now.getDate() - 7));
            return tasks.filter(task => {
                const taskDate = new Date(task.date || task.createdAt);
                return taskDate >= weekAgo;
            });
        case 'monthly':
            const monthAgo = new Date(now.setMonth(now.getMonth() - 1));
            return tasks.filter(task => {
                const taskDate = new Date(task.date || task.createdAt);
                return taskDate >= monthAgo;
            });
        default:
            return tasks;
    }
}

// حفظ في التخزين المحلي
function saveToLocalStorage() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

// تهيئة بعض المهام التجريبية
if (tasks.length === 0) {
    const sampleTasks = [
        {
            id: '1',
            title: 'تسليم تقرير العمل',
            description: 'تسليم التقرير النهائي للمشروع',
            categoryId: 'work',
            duration: 60,
            date: new Date().toISOString().split('T')[0],
            time: '14:00',
            repeat: 'none',
            completed: false,
            createdAt: new Date().toISOString()
        },
        {
            id: '2',
            title: 'شراء مستلزمات المنزل',
            description: 'شراء الخضار والفواكه',
            categoryId: 'personal',
            duration: 45,
            date: new Date().toISOString().split('T')[0],
            time: '18:00',
            repeat: 'weekly',
            completed: true,
            createdAt: new Date().toISOString()
        }
    ];
    
    tasks = sampleTasks;
    saveToLocalStorage();
}
