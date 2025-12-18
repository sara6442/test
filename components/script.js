import { 
    addTask, 
    deleteTask, 
    updateTask, 
    getTasks, 
    getTasksByDate,
    getTasksByCategory,
    toggleTaskCompletion 
} from './components/taskManager.js';

import { 
    addCategory, 
    deleteCategory, 
    getCategories,
    getCategoryById 
} from './components/categoryManager.js';

import { 
    loadDailyView, 
    loadWeeklyView, 
    loadMonthlyView,
    getCurrentWeek,
    getCurrentMonth 
} from './components/calendar.js';

// العناصر الرئيسية
const currentDateElement = document.getElementById('current-date');
const addTaskBtn = document.getElementById('add-task-btn');
const addTaskModal = document.getElementById('add-task-modal');
const closeTaskModal = document.getElementById('close-task-modal');
const cancelTaskBtn = document.getElementById('cancel-task');
const saveTaskBtn = document.getElementById('save-task');
const taskForm = document.getElementById('task-form');

const addCategoryBtn = document.getElementById('add-category-btn');
const addCategoryModal = document.getElementById('add-category-modal');
const closeCategoryModal = document.getElementById('close-category-modal');
const cancelCategoryBtn = document.getElementById('cancel-category');
const saveCategoryBtn = document.getElementById('save-category');
const categoryForm = document.getElementById('category-form');

const navItems = document.querySelectorAll('.nav-item');
const views = document.querySelectorAll('.view');
const timeNavigation = document.getElementById('time-navigation');
const timeButtons = document.querySelectorAll('.time-btn');
const currentViewTitle = document.getElementById('current-view-title');

// تهيئة التاريخ الحالي
function initializeDate() {
    const now = new Date();
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    };
    const arabicDate = now.toLocaleDateString('ar-SA', options);
    currentDateElement.textContent = arabicDate;
}

// إدارة العرض الحالي
let currentView = 'tasks';

function switchView(viewName) {
    // تحديث التنقل الجانبي
    navItems.forEach(item => {
        item.classList.remove('active');
        if (item.dataset.view === viewName) {
            item.classList.add('active');
        }
    });
    
    // تحديث العناوين
    const viewTitles = {
        'tasks': 'المهام',
        'calendar': 'الجدول الزمني',
        'stats': 'الإحصائيات',
        'categories': 'إدارة الفئات'
    };
    currentViewTitle.textContent = viewTitles[viewName] || viewName;
    
    // إظهار/إخفاء شريط الوقت
    if (viewName === 'calendar') {
        timeNavigation.style.display = 'flex';
    } else {
        timeNavigation.style.display = 'none';
    }
    
    // إخفاء جميع العروض وإظهار العرض الحالي
    views.forEach(view => {
        view.classList.remove('active-view');
        if (view.id === `${viewName}-view`) {
            view.classList.add('active-view');
        }
    });
    
    currentView = viewName;
    loadViewContent(viewName);
}

// تحميل محتوى العرض
function loadViewContent(viewName) {
    switch(viewName) {
        case 'tasks':
            loadTasksView();
            break;
        case 'calendar':
            loadCalendarView();
            break;
        case 'stats':
            loadStatsView();
            break;
        case 'categories':
            loadCategoriesView();
            break;
    }
}

// تحميل عرض المهام
function loadTasksView() {
    const tasksList = document.getElementById('tasks-list');
    const tasks = getTasks();
    
    if (tasks.length === 0) {
        tasksList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-tasks fa-3x"></i>
                <h4>لا توجد مهام</h4>
                <p>اضغط على "إضافة مهمة" لإنشاء مهمتك الأولى</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    tasks.forEach(task => {
        const category = getCategoryById(task.categoryId) || { name: 'عام', color: '#6c757d' };
        const isCompleted = task.completed || false;
        
        html += `
            <div class="task-item ${isCompleted ? 'completed' : ''}" data-id="${task.id}">
                <input type="checkbox" class="task-checkbox" ${isCompleted ? 'checked' : ''}>
                <div class="task-content">
                    <div class="task-title">${task.title}</div>
                    ${task.description ? `<div class="task-description">${task.description}</div>` : ''}
                    <div class="task-meta">
                        <span><i class="fas fa-tag" style="color: ${category.color}"></i> ${category.name}</span>
                        ${task.duration ? `<span><i class="fas fa-clock"></i> ${task.duration} دقيقة</span>` : ''}
                        ${task.date ? `<span><i class="fas fa-calendar"></i> ${task.date}</span>` : ''}
                    </div>
                </div>
                <div class="task-actions">
                    <button class="btn btn-secondary btn-sm edit-task" data-id="${task.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-danger btn-sm delete-task" data-id="${task.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    });
    
    tasksList.innerHTML = html;
    
    // إضافة مستمعي الأحداث للمهام
    document.querySelectorAll('.task-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const taskId = this.closest('.task-item').dataset.id;
            toggleTaskCompletion(taskId);
            loadTasksView();
        });
    });
    
    document.querySelectorAll('.delete-task').forEach(btn => {
        btn.addEventListener('click', function() {
            const taskId = this.dataset.id;
            if (confirm('هل أنت متأكد من حذف هذه المهمة؟')) {
                deleteTask(taskId);
                loadTasksView();
            }
        });
    });
}

// تحميل عرض التقويم
function loadCalendarView() {
    const calendarContainer = document.querySelector('.calendar-container');
    const activeTimeBtn = document.querySelector('.time-btn.active');
    const range = activeTimeBtn ? activeTimeBtn.dataset.range : 'daily';
    
    switch(range) {
        case 'daily':
            calendarContainer.innerHTML = loadDailyView();
            break;
        case 'weekly':
            calendarContainer.innerHTML = loadWeeklyView();
            break;
        case 'monthly':
            calendarContainer.innerHTML = loadMonthlyView();
            break;
    }
}

// تحميل عرض الإحصائيات
function loadStatsView() {
    const statsView = document.getElementById('stats-view');
    const tasks = getTasks();
    const categories = getCategories();
    
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.completed).length;
    const pendingTasks = totalTasks - completedTasks;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    
    let categoryStats = '';
    categories.forEach(category => {
        const categoryTasks = tasks.filter(task => task.categoryId === category.id);
        const categoryCompleted = categoryTasks.filter(task => task.completed).length;
        
        categoryStats += `
            <div class="stat-card">
                <div class="stat-icon">
                    <i class="${category.icon || 'fas fa-tag'}" style="color: ${category.color}"></i>
                </div>
                <div class="stat-value">${categoryTasks.length}</div>
                <div class="stat-label">${category.name}</div>
                <div class="stat-sub">مكتملة: ${categoryCompleted}</div>
            </div>
        `;
    });
    
    statsView.innerHTML = `
        <div class="stats-container">
            <h3>إحصائيات المهام</h3>
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-icon">
                        <i class="fas fa-tasks" style="color: var(--primary-color)"></i>
                    </div>
                    <div class="stat-value">${totalTasks}</div>
                    <div class="stat-label">إجمالي المهام</div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-icon">
                        <i class="fas fa-check-circle" style="color: var(--success-color)"></i>
                    </div>
                    <div class="stat-value">${completedTasks}</div>
                    <div class="stat-label">مهام مكتملة</div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-icon">
                        <i class="fas fa-clock" style="color: var(--warning-color)"></i>
                    </div>
                    <div class="stat-value">${pendingTasks}</div>
                    <div class="stat-label">مهام قيد الانتظار</div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-icon">
                        <i class="fas fa-chart-line" style="color: var(--accent-color)"></i>
                    </div>
                    <div class="stat-value">${completionRate}%</div>
                    <div class="stat-label">نسبة الإنجاز</div>
                </div>
                
                ${categoryStats}
            </div>
        </div>
    `;
}

// تحميل عرض الفئات
function loadCategoriesView() {
    const categoriesList = document.getElementById('categories-list');
    const categories = getCategories();
    
    if (categories.length === 0) {
        categoriesList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-tags fa-3x"></i>
                <h4>لا توجد فئات</h4>
                <p>اضغط على "إضافة فئة جديدة" لإنشاء فئتك الأولى</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    categories.forEach(category => {
        html += `
            <div class="category-item" data-id="${category.id}">
                <div class="category-color" style="background: ${category.color}"></div>
                <i class="${category.icon || 'fas fa-tag'}"></i>
                <div class="category-name">${category.name}</div>
                <div class="category-actions">
                    <button class="btn btn-secondary btn-sm edit-category" data-id="${category.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-danger btn-sm delete-category" data-id="${category.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    });
    
    categoriesList.innerHTML = html;
    
    // إضافة مستمعي الأحداث للفئات
    document.querySelectorAll('.delete-category').forEach(btn => {
        btn.addEventListener('click', function() {
            const categoryId = this.dataset.id;
            if (confirm('هل أنت متأكد من حذف هذه الفئة؟ سيتم إزالة الفئة من جميع المهام.')) {
                deleteCategory(categoryId);
                loadCategoriesView();
                loadTasksView();
            }
        });
    });
}

// فتح نافذة إضافة مهمة
function openAddTaskModal() {
    loadCategoryOptions();
    addTaskModal.classList.add('active');
}

// تحميل خيارات الفئات
function loadCategoryOptions() {
    const categorySelect = document.getElementById('task-category');
    const categories = getCategories();
    
    categorySelect.innerHTML = '';
    
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.id;
        option.textContent = category.name;
        option.style.color = category.color;
        categorySelect.appendChild(option);
    });
    
    if (categories.length === 0) {
        const option = document.createElement('option');
        option.value = 'general';
        option.textContent = 'عام';
        categorySelect.appendChild(option);
    }
}

// حفظ مهمة جديدة
function saveNewTask() {
    const title = document.getElementById('task-title').value;
    const description = document.getElementById('task-description').value;
    const categoryId = document.getElementById('task-category').value;
    const duration = parseInt(document.getElementById('task-duration').value) || 30;
    const date = document.getElementById('task-date').value;
    const time = document.getElementById('task-time').value;
    const repeat = document.getElementById('task-repeat').value;
    
    if (!title.trim()) {
        alert('يرجى إدخال عنوان المهمة');
        return;
    }
    
    const task = {
        id: Date.now().toString(),
        title: title.trim(),
        description: description.trim(),
        categoryId: categoryId,
        duration: duration,
        date: date,
        time: time,
        repeat: repeat,
        completed: false,
        createdAt: new Date().toISOString()
    };
    
    addTask(task);
    addTaskModal.classList.remove('active');
    taskForm.reset();
    
    // تحديث العرض الحالي
    loadViewContent(currentView);
}

// فتح نافذة إضافة فئة
function openAddCategoryModal() {
    addCategoryModal.classList.add('active');
}

// حفظ فئة جديدة
function saveNewCategory() {
    const name = document.getElementById('category-name').value;
    const color = document.getElementById('category-color').value;
    const icon = document.getElementById('category-icon').value;
    
    if (!name.trim()) {
        alert('يرجى إدخال اسم الفئة');
        return;
    }
    
    const category = {
        id: Date.now().toString(),
        name: name.trim(),
        color: color,
        icon: icon,
        createdAt: new Date().toISOString()
    };
    
    addCategory(category);
    addCategoryModal.classList.remove('active');
    categoryForm.reset();
    
    loadCategoriesView();
}

// مستمعي الأحداث عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    initializeDate();
    switchView('tasks');
    
    // التنقل الجانبي
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const viewName = item.dataset.view;
            switchView(viewName);
        });
    });
    
    // التنقل الزمني
    timeButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            timeButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            if (currentView === 'calendar') {
                loadCalendarView();
            }
        });
    });
    
    // إضافة مهمة
    addTaskBtn.addEventListener('click', openAddTaskModal);
    closeTaskModal.addEventListener('click', () => addTaskModal.classList.remove('active'));
    cancelTaskBtn.addEventListener('click', () => addTaskModal.classList.remove('active'));
    saveTaskBtn.addEventListener('click', saveNewTask);
    
    // إضافة فئة
    addCategoryBtn.addEventListener('click', openAddCategoryModal);
    closeCategoryModal.addEventListener('click', () => addCategoryModal.classList.remove('active'));
    cancelCategoryBtn.addEventListener('click', () => addCategoryModal.classList.remove('active'));
    saveCategoryBtn.addEventListener('click', saveNewCategory);
    
    // إغلاق النوافذ عند النقر خارجها
    window.addEventListener('click', (e) => {
        if (e.target === addTaskModal) {
            addTaskModal.classList.remove('active');
        }
        if (e.target === addCategoryModal) {
            addCategoryModal.classList.remove('active');
        }
    });
});

// تصدير الوظائف للاستخدام في ملفات أخرى
export { switchView, loadViewContent };
