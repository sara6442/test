// اختبار تحميل CSS
function checkCSS() {
    console.log("🔍 فحص تحميل CSS...");
    
    // اختبار 1: فحص عدد أنماط CSS المحملة
    const cssCount = document.styleSheets.length;
    console.log("عدد ملفات CSS:", cssCount);
    
    // اختبار 2: فحص متغيرات CSS
    const rootStyles = getComputedStyle(document.documentElement);
    const themeBg = rootStyles.getPropertyValue('--theme-bg').trim();
    console.log("متغير --theme-bg:", themeBg);
    
    if (!themeBg || themeBg === 'initial' || themeBg === '') {
        console.error("❌ متغيرات CSS غير محملة!");
        
        // تطبيق أنماط طارئة
        document.body.style.cssText = `
            background-color: #f8f9fa !important;
            color: #212529 !important;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif !important;
        `;
        
        // إضافة رسالة تحذير
        const warning = document.createElement('div');
        warning.id = 'css-warning';
        warning.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: #f8d7da;
            color: #721c24;
            padding: 10px 20px;
            border-radius: 5px;
            z-index: 99999;
            font-family: Arial;
            border: 1px solid #f5c6cb;
        `;
        warning.innerHTML = '⚠️ مشكلة في تحميل التنسيقات. الرجاء تحديث الصفحة.';
        document.body.appendChild(warning);
        
        return false;
    }
    
    console.log("✅ CSS محمل بنجاح");
    return true;
}

// ========== حالة التطبيق ==========
const AppState = {
    tasks: [],
    categories: [],
    deletedTasks: [],
    notes: [],
    currentView: 'tasks',
    currentFilter: 'pending',
    currentCalendarView: 'daily',
    currentCalendarDate: new Date(),
    currentTaskId: null,
    currentNoteId: null,
    currentCategoryId: null,
    themes: ['gray', 'black', 'blue', 'beige', 'custom'],
    currentTheme: 'beige'
};

// ========== إدارة البيانات ==========
function initializeData() {
    console.log("تهيئة البيانات...");
    
    // تحميل المهام
    try {
        const savedTasks = localStorage.getItem('mytasks_tasks');
        AppState.tasks = savedTasks ? JSON.parse(savedTasks) : [];
    } catch (e) {
        console.error("خطأ في تحميل المهام:", e);
        AppState.tasks = [];
    }
    
    // تحميل المهام المحذوفة
    try {
        const savedDeleted = localStorage.getItem('mytasks_deleted');
        AppState.deletedTasks = savedDeleted ? JSON.parse(savedDeleted) : [];
    } catch (e) {
        console.error("خطأ في تحميل المهام المحذوفة:", e);
        AppState.deletedTasks = [];
    }
    
    // تحميل الفئات
    try {
        const savedCategories = localStorage.getItem('mytasks_categories');
        AppState.categories = savedCategories ? JSON.parse(savedCategories) : [];
        
        if (!Array.isArray(AppState.categories) || AppState.categories.length === 0) {
            AppState.categories = [
                { 
                    id: 'work', 
                    name: 'عمل', 
                    color: '#5a76e8',
                    timeframeMinutes: 480,
                    timeframeType: 'minutes',
                    messageEmpty: 'لا توجد مهام في فئة العمل اليوم. أضف مهام جديدة لبدء العمل!',
                    messageCompleted: 'ممتاز! لقد أكملت جميع مهام العمل لهذا اليوم. استمر في العمل الجيد!',
                    messageExceeded: 'لقد تجاوزت الوقت المخصص للعمل اليوم. حاول إدارة وقتك بشكل أفضل!'
                },
                { 
                    id: 'personal', 
                    name: 'شخصي', 
                    color: '#4cc9f0',
                    timeframeMinutes: 120,
                    timeframeType: 'minutes',
                    messageEmpty: 'لا توجد مهام شخصية هذا الأسبوع. يمكنك إضافة مهام جديدة!',
                    messageCompleted: 'رائع! لقد أكملت جميع المهام الشخصية لهذا الأسبوع.',
                    messageExceeded: 'لقد تجاوزت الوقت المخصص للمهام الشخصية. حاول التركيز على المهام المهمة!'
                },
                { 
                    id: 'study', 
                    name: 'دراسة', 
                    color: '#f72585',
                    timeframeMinutes: 360,
                    timeframeType: 'minutes',
                    messageEmpty: 'لا توجد مهام دراسية لهذا الشهر. خطط لجدولك الدراسي!',
                    messageCompleted: 'تهانينا! لقد أنجزت جميع المهام الدراسية لهذا الشهر.',
                    messageExceeded: 'لقد تجاوزت الوقت المخصص للدراسة. حاول تنظيم وقتك بشكل أفضل!'
                }
            ];
            saveCategories();
        }
    } catch (e) {
        console.error("خطأ في تحميل الفئات:", e);
        AppState.categories = [
            { 
                id: 'work', 
                name: 'عمل', 
                color: '#5a76e8',
                timeframe: 'daily',
                messageEmpty: 'لا توجد مهام في فئة العمل اليوم. أضف مهام جديدة لبدء العمل!',
                messageCompleted: 'ممتاز! لقد أكملت جميع مهام العمل لهذا اليوم. استمر في العمل الجيد!',
                messagePending: 'هناك مهام عمل معلقة. واصل العمل لإنجازها!',
                customDays: 0
            },
            { 
                id: 'personal', 
                name: 'شخصي', 
                color: '#4cc9f0',
                timeframe: 'weekly',
                messageEmpty: 'لا توجد مهام شخصية هذا الأسبوع. يمكنك إضافة مهام جديدة!',
                messageCompleted: 'رائع! لقد أكملت جميع المهام الشخصية لهذا الأسبوع.',
                messagePending: 'لا يزال لديك مهام شخصية معلقة. حاول إنجازها قريباً!',
                customDays: 0
            },
            { 
                id: 'study', 
                name: 'دراسة', 
                color: '#f72585',
                timeframe: 'monthly',
                messageEmpty: 'لا توجد مهام دراسية لهذا الشهر. خطط لجدولك الدراسي!',
                messageCompleted: 'تهانينا! لقد أنجزت جميع المهام الدراسية لهذا الشهر.',
                messagePending: 'هناك مهام دراسية تحتاج للإنجاز. ركز على دراستك!',
                customDays: 0
            }
        ];
        saveCategories();
    }
    
    // تحميل الملاحظات
    try {
        const savedNotes = localStorage.getItem('mytasks_notes');
        AppState.notes = savedNotes ? JSON.parse(savedNotes) : [];
    } catch (e) {
        console.error("خطأ في تحميل الملاحظات:", e);
        AppState.notes = [];
    }
    
    // بيانات تجريبية إذا لم تكن هناك مهام
    if (AppState.tasks.length === 0) {
        const now = new Date();
        const today = now.toISOString().split('T')[0];
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().split('T')[0];
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        
        AppState.tasks = [
            {
                id: Date.now().toString(),
                title: 'مراجعة التقرير الشهري',
                description: 'مراجعة وإرسال التقرير الشهري للإدارة',
                categoryId: 'work',
                duration: 60,
                date: today,
                time: '10:00',
                priority: 'high',
                completed: false,
                createdAt: new Date().toISOString()
            },
            {
                id: (Date.now() + 1).toString(),
                title: 'مقابلة العملاء الجدد',
                description: 'مقابلة مع العملاء الجدد لمناقشة المشروع',
                categoryId: 'work',
                duration: 90,
                date: today,
                time: '14:30',
                priority: 'medium',
                completed: false,
                createdAt: new Date().toISOString()
            },
            {
                id: (Date.now() + 2).toString(),
                title: 'شراء مستلزمات المنزل',
                description: 'شراء الخضار والفواكه والمنظفات',
                categoryId: 'personal',
                duration: 45,
                date: tomorrowStr,
                time: '16:00',
                priority: 'low',
                completed: false,
                createdAt: new Date().toISOString()
            },
            {
                id: (Date.now() + 3).toString(),
                title: 'مهمة متأخرة',
                description: 'مهمة يجب أن تكون مكتملة بالأمس',
                categoryId: 'personal',
                duration: 30,
                date: yesterdayStr,
                time: '09:00',
                priority: 'high',
                completed: false,
                createdAt: new Date().toISOString()
            },
            {
                id: (Date.now() + 4).toString(),
                title: 'مهمة مكتملة',
                description: 'مهمة تم إنجازها بالفعل',
                categoryId: 'study',
                duration: 60,
                date: today,
                time: '16:00',
                priority: 'low',
                completed: true,
                createdAt: new Date().toISOString()
            }
        ];
        saveTasks();
    }
    
    // بيانات تجريبية للملاحظات إذا لم تكن موجودة
    if (AppState.notes.length === 0) {
        AppState.notes = [
            {
                id: Date.now().toString(),
                title: 'ملاحظة ترحيبية',
                content: '<div class="note-checkbox-item"><input type="checkbox" class="note-checkbox"> <span class="note-checkbox-text">مراجعة التقرير الشهري</span></div><div class="note-checkbox-item"><input type="checkbox" class="note-checkbox"> <span class="note-checkbox-text">مقابلة العملاء الجدد</span></div><div class="note-checkbox-item"><input type="checkbox" class="note-checkbox"> <span class="note-checkbox-text">شراء مستلزمات المنزل</span></div>',
                fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
                fontSize: '16',
                fontWeight: 'normal',
                fontStyle: 'normal',
                color: '#000000',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            },
            {
                id: (Date.now() + 1).toString(),
                title: 'قائمة مهام مهمة',
                content: '<ul><li>شراء مستلزمات المنزل</li><li>مراجعة التقارير الشهرية</li><li>مكالمة مع العميل الجديد</li></ul>',
                fontFamily: "'Cairo', sans-serif",
                fontSize: '18',
                fontWeight: '500',
                fontStyle: 'normal',
                color: '#333333',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }
        ];
        saveNotes();
    }
}

function saveTasks() {
    try {
        localStorage.setItem('mytasks_tasks', JSON.stringify(AppState.tasks));
    } catch (e) {
        console.error("خطأ في حفظ المهام:", e);
    }
}

function saveDeletedTasks() {
    try {
        localStorage.setItem('mytasks_deleted', JSON.stringify(AppState.deletedTasks));
    } catch (e) {
        console.error("خطأ في حفظ المهام المحذوفة:", e);
    }
}

function saveCategories() {
    try {
        localStorage.setItem('mytasks_categories', JSON.stringify(AppState.categories));
    } catch (e) {
        console.error("خطأ في حفظ الفئات:", e);
    }
}

function saveNotes() {
    try {
        localStorage.setItem('mytasks_notes', JSON.stringify(AppState.notes));
    } catch (e) {
        console.error("خطأ في حفظ الملاحظات:", e);
    }
}

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// ========== وظائف المساعدة ==========
function getCategoryById(categoryId) {
    return AppState.categories.find(cat => cat.id === categoryId) || 
           { 
               name: 'عام', 
               color: '#6c757d', 
               timeframe: '', 
               messageEmpty: '', 
               messageCompleted: '', 
               messagePending: '', 
               customDays: 0 
           };
}

function isTaskOverdue(task) {
    if (!task.date || task.completed) return false;
    const today = new Date().toISOString().split('T')[0];
    return task.date < today;
}

function formatDate(dateStr) {
    if (!dateStr) return 'بدون تاريخ';
    const date = new Date(dateStr);
    return date.toLocaleDateString('ar-SA');
}

function formatTime(timeStr) {
    if (!timeStr) return 'بدون وقت';
    return timeStr;
}

function getTaskTimeInMinutes(task) {
    if (!task.time) return 0;
    const [hours, minutes] = task.time.split(':').map(Number);
    return hours * 60 + minutes;
}

function refreshCurrentView() {
    if (AppState.currentView === 'tasks') renderTasks();
    else if (AppState.currentView === 'calendar') renderCalendar();
    else if (AppState.currentView === 'categories') renderCategories();
    else if (AppState.currentView === 'notes') renderNotes();
    
    // تحديث زر حالة الفئات (دالة جديدة)
    if (typeof renderCategoriesStatus === 'function') {
        renderCategoriesStatus();
    }
}
// ========== [عرض المهام]{dir="rtl"} ==========

function renderTasks() {
    const container = document.getElementById('tasks-list');
    
    // ✅ أولاً: عرض شريط الفلتر في الأعلى
    let filterHTML = `
        <div class="filters-container" style="margin-bottom: 20px;">
            <div class="task-filters" style="display: flex; gap: 10px; flex-wrap: wrap; background: var(--theme-card); padding: 15px; border-radius: var(--border-radius); border: 1px solid var(--theme-border);">
                <button class="filter-btn ${AppState.currentFilter === 'all' ? 'active' : ''}" data-filter="all">
                    <i class="fas fa-list"></i> الكل
                </button>
                <button class="filter-btn ${AppState.currentFilter === 'pending' ? 'active' : ''}" data-filter="pending">
                    <i class="fas fa-clock"></i> المعلقة
                </button>
                <button class="filter-btn ${AppState.currentFilter === 'completed' ? 'active' : ''}" data-filter="completed">
                    <i class="fas fa-check-circle"></i> المكتملة
                </button>
                <button class="filter-btn ${AppState.currentFilter === 'overdue' ? 'active' : ''}" data-filter="overdue">
                    <i class="fas fa-exclamation-triangle"></i> المتأخرة
                </button>
                <button class="filter-btn ${AppState.currentFilter === 'deleted' ? 'active' : ''}" data-filter="deleted">
                    <i class="fas fa-trash"></i> المحذوفة
                </button>
            </div>
            
            <div style="display: flex; justify-content: flex-end; margin-top: 15px;">
                <button id="categories-status-btn" class="btn btn-info">
                    <i class="fas fa-chart-pie"></i> حالة الفئات
                </button>
            </div>
        </div>
    `;
    
    // ✅ إضافة الفلاتر أولاً
    container.innerHTML = filterHTML;
    
    // ✅ الآن: عرض المهام
    const tasksContainer = document.createElement('div');
    tasksContainer.id = 'tasks-content-container';
    container.appendChild(tasksContainer);
    
    let tasksToShow = [];
    let completedTasks = [];
    let pendingTasks = [];
    
    switch(AppState.currentFilter) {
        case 'pending':
            pendingTasks = AppState.tasks.filter(task => !task.completed);
            const overdueTasks = pendingTasks.filter(task => isTaskOverdue(task));
            const normalTasks = pendingTasks.filter(task => !isTaskOverdue(task));
            
            overdueTasks.sort((a, b) => {
                const dateA = a.date ? new Date(a.date) : new Date(0);
                const dateB = b.date ? new Date(b.date) : new Date(0);
                return dateA - dateB;
            });
            
            normalTasks.sort((a, b) => {
                const dateA = a.date ? new Date(a.date) : new Date(0);
                const dateB = b.date ? new Date(b.date) : new Date(0);
                return dateA - dateB;
            });
            
            tasksToShow = [...overdueTasks, ...normalTasks];
            break;
            
        case 'completed':
            tasksToShow = AppState.tasks.filter(task => task.completed);
            tasksToShow.sort((a, b) => {
                const dateA = a.date ? new Date(a.date) : new Date(0);
                const dateB = b.date ? new Date(b.date) : new Date(0);
                return dateB - dateA;
            });
            break;
            
        case 'deleted':
            tasksToShow = AppState.deletedTasks;
            break;
            
        case 'overdue':
            tasksToShow = AppState.tasks.filter(task => isTaskOverdue(task) && !task.completed);
            tasksToShow.sort((a, b) => {
                const dateA = a.date ? new Date(a.date) : new Date(0);
                const dateB = b.date ? new Date(b.date) : new Date(0);
                return dateA - dateB;
            });
            break;
            
        case 'all':
            completedTasks = AppState.tasks.filter(task => task.completed);
            pendingTasks = AppState.tasks.filter(task => !task.completed);
            
            const allOverdueTasks = pendingTasks.filter(task => isTaskOverdue(task));
            const allNormalTasks = pendingTasks.filter(task => !isTaskOverdue(task));
            
            allOverdueTasks.sort((a, b) => {
                const dateA = a.date ? new Date(a.date) : new Date(0);
                const dateB = b.date ? new Date(b.date) : new Date(0);
                return dateA - dateB;
            });
            
            allNormalTasks.sort((a, b) => {
                const dateA = a.date ? new Date(a.date) : new Date(0);
                const dateB = b.date ? new Date(b.date) : new Date(0);
                return dateA - dateB;
            });
            
            completedTasks.sort((a, b) => {
                const dateA = a.date ? new Date(a.date) : new Date(0);
                const dateB = b.date ? new Date(b.date) : new Date(0);
                return dateB - dateA;
            });
            
            tasksToShow = [...allOverdueTasks, ...allNormalTasks, ...completedTasks];
            break;
    }
    
    if (tasksToShow.length === 0) {
        let message = 'لا توجد مهام';
        if (AppState.currentFilter === 'pending') message = 'لا توجد مهام نشطة';
        else if (AppState.currentFilter === 'completed') message = 'لا توجد مهام مكتملة';
        else if (AppState.currentFilter === 'deleted') message = 'لا توجد مهام محذوفة';
        else if (AppState.currentFilter === 'overdue') message = 'لا توجد مهام متأخرة';
        
        tasksContainer.innerHTML = `
            <div class="empty-state" style="text-align: center; padding: 60px 20px; color: var(--gray-color);">
                <i class="fas fa-inbox" style="font-size: 3rem; margin-bottom: 20px; opacity: 0.3;"></i>
                <h3 style="color: var(--theme-text); margin-bottom: 10px;">${message}</h3>
                ${AppState.currentFilter === 'pending' ? '<p>اضغط على "إضافة مهمة" لإنشاء مهمتك الأولى</p>' : ''}
            </div>
        `;
        return;
    }
    
    let html = '';
    
    tasksToShow.forEach(task => {
        const category = getCategoryById(task.categoryId);
        const isDeleted = AppState.currentFilter === 'deleted';
        const isOverdue = isTaskOverdue(task) && !task.completed;
        
        const overdueBadge = isOverdue ? `
            <div class="overdue-badge-container" style="position: absolute; bottom: 10px; left: 10px;">
                <span class="overdue-badge" style="background: linear-gradient(135deg, #f72585, #b5179e); color: white; padding: 3px 8px; border-radius: 12px; font-size: 0.7rem; display: inline-flex; align-items: center; gap: 4px; box-shadow: 0 2px 4px rgba(247, 37, 133, 0.3);">
                    <i class="fas fa-exclamation-circle" style="font-size: 0.6rem;"></i> متأخرة
                </span>
            </div>
        ` : '';
        
        if (isDeleted) {
            html += `
                <div class="task-card deleted" data-id="${task.id}">
                    <div class="task-content">
                        <div class="task-title" style="color: #999; text-decoration: line-through;">${task.title}</div>
                        ${task.description ? `<div class="task-description" style="color: #aaa;">${task.description}</div>` : ''}
                        <div class="task-meta">
                            <div class="task-meta-item">
                                <i class="fas fa-tag" style="color: ${category.color}"></i>
                                <span>${category.name}</span>
                            </div>
                            <div class="task-meta-item">
                                <i class="fas fa-calendar"></i>
                                <span>${formatDate(task.date)}</span>
                            </div>
                        </div>
                    </div>
                    <div class="task-actions">
                        <button class="btn btn-success btn-sm restore-task-btn" data-id="${task.id}" title="استعادة">
                            <i class="fas fa-undo"></i>
                        </button>
                        <button class="btn btn-danger btn-sm permanent-delete-btn" data-id="${task.id}" title="حذف نهائي">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        } else {
            html += `
                <div class="task-card ${task.completed ? 'completed' : ''} ${isOverdue ? 'overdue' : ''}"
                     data-id="${task.id}"
                     style="position: relative;"
                     title="انقر لتعديل المهمة">
                    <div style="display: flex; align-items: flex-start; gap: 20px;">
                        <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''} style="margin-top: 5px;">
                        <div class="task-content" style="flex: 1;">
                            <div class="task-title" style="margin-bottom: 5px; padding-right: 10px;">
                                ${task.title}
                            </div>
                            ${task.description ? `<div class="task-description">${task.description}</div>` : ''}
                            <div class="task-meta">
                                <div class="task-meta-item">
                                    <i class="fas fa-tag" style="color: ${category.color}"></i>
                                    <span>${category.name}</span>
                                </div>
                                <div class="task-meta-item">
                                    <i class="fas fa-calendar"></i>
                                    <span>${formatDate(task.date)}</span>
                                </div>
                                <div class="task-meta-item">
                                    <i class="fas fa-clock"></i>
                                    <span>${task.duration} دقيقة</span>
                                </div>
                                <div class="task-meta-item">
                                    <i class="fas fa-flag" style="color: ${
                                        task.priority === 'high' ? '#f72585' :
                                        task.priority === 'medium' ? '#f8961e' : '#4cc9f0'
                                    }"></i>
                                    <span>${task.priority === 'high' ? 'عالية' : 
                                            task.priority === 'medium' ? 'متوسطة' : 'منخفضة'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    ${overdueBadge}
                    <div class="task-actions" style="position: absolute; top: 10px; left: 10px;">
                        <button class="btn btn-secondary btn-sm edit-task-btn" data-id="${task.id}" title="تعديل المهمة">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-danger btn-sm delete-task-btn" data-id="${task.id}" title="حذف">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        }
    });
    
    tasksContainer.innerHTML = html;
    
    // إضافة أحداث للأزرار
    setupTaskButtonsEvents();
    
    // إضافة أحداث للفلاتر بعد إنشائها
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            setFilter(this.dataset.filter);
        });
    });
    
    // إضافة حدث لزر حالة الفئات
    const statusBtn = document.getElementById('categories-status-btn');
    if (statusBtn) {
        statusBtn.addEventListener('click', showCategoriesStatusModal);
    }
}

// ========== إدارة الثيمات ==========
function initializeThemes() {
    console.log("تهيئة الثيمات...");
    
    // تحميل الثيم المخصص أولاً
    loadCustomTheme();
    
    // تحميل الثيم المحفوظ
    const savedTheme = localStorage.getItem('mytasks_theme');
    if (savedTheme && AppState.themes.includes(savedTheme)) {
        AppState.currentTheme = savedTheme;
        document.body.className = `theme-${savedTheme}`;
        console.log("تم تحميل الثيم المحفوظ:", savedTheme);
        
        // تحديث ألوان الملاحظات للثيم الحالي
        updateNotesColorsForTheme(savedTheme);
    } else {
        // تعيين الثيم الافتراضي إلى بيج
        AppState.currentTheme = 'beige';
        document.body.className = 'theme-beige';
        localStorage.setItem('mytasks_theme', 'beige');
        console.log("تم تعيين الثيم الافتراضي: beige");
        
        // تحديث ألوان الملاحظات للثيم الافتراضي
        updateNotesColorsForTheme('beige');
    }
    
    // تحديث الأزرار النشطة
    updateThemeButtons();
    
    // إضافة أحداث تغيير الثيم
    setupThemeEvents();
}

function applyCustomTheme() {
    const color1 = document.getElementById('custom-color1').value;
    const color2 = document.getElementById('custom-color2').value;
    
    // وظيفة لتحويل الألوان بشكل جميل
    function adjustColor(color, percent) {
        const num = parseInt(color.slice(1), 16);
        const amt = Math.round(2.55 * percent);
        const R = Math.min(255, Math.max(0, (num >> 16) + amt));
        const G = Math.min(255, Math.max(0, (num >> 8 & 0x00FF) + amt));
        const B = Math.min(255, Math.max(0, (num & 0x0000FF) + amt));
        return `#${(
            0x1000000 +
            (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
            (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
            (B < 255 ? B < 1 ? 0 : B : 255)
        ).toString(16).slice(1)}`;
    }
    
    // توليد ألوان متناسقة
    const lightBg = adjustColor(color1, 30); // خلفية فاتحة
    const lightCard = adjustColor(color1, 15); // بطاقات أفتح قليلاً
    const borderColor = adjustColor(color1, 10); // حدود
    
    // حفظ الألوان
    localStorage.setItem('mytasks_custom_colors', JSON.stringify({ 
        color1, 
        color2,
        lightBg,
        lightCard,
        borderColor
    }));
    
    // تطبيق الألوان كمتغيرات CSS
    document.documentElement.style.setProperty('--custom-color1', color1);
    document.documentElement.style.setProperty('--custom-color2', color2);
    document.documentElement.style.setProperty('--theme-bg', lightBg);
    document.documentElement.style.setProperty('--theme-card', lightCard);
    document.documentElement.style.setProperty('--theme-border', borderColor);
    document.documentElement.style.setProperty('--theme-primary', color1);
    document.documentElement.style.setProperty('--theme-hover', color2);
    
    // تحديث الثيم
    AppState.currentTheme = 'custom';
    document.body.className = 'theme-custom';
    localStorage.setItem('mytasks_theme', 'custom');
    
    updateThemeButtons();
    refreshCurrentView();
    closeModal('custom-theme-modal');
    
    alert('تم تطبيق الثيم المخصص بنجاح!');
}

// وفي دالة loadCustomTheme:
function loadCustomTheme() {
    const customColors = localStorage.getItem('mytasks_custom_colors');
    if (customColors) {
        try {
            const colors = JSON.parse(customColors);
            document.documentElement.style.setProperty('--custom-color1', colors.color1);
            document.documentElement.style.setProperty('--custom-color2', colors.color2);
            document.documentElement.style.setProperty('--theme-bg', colors.lightBg || '#ffffff');
            document.documentElement.style.setProperty('--theme-card', colors.lightCard || '#ffffff');
            document.documentElement.style.setProperty('--theme-border', colors.borderColor || '#dee2e6');
        } catch (e) {
            console.error("خطأ في تحميل ألوان الثيم المخصص:", e);
        }
    }
}

function updateNotesColorsForTheme(theme) {
    console.log("تحديث ألوان الملاحظات للثيم:", theme);
    
    if (theme === 'black') {
        // إذا كان الثيم أسود، نجعل ألوان النص فاتحة
        AppState.notes.forEach(note => {
            // حفظ اللون الأصلي إذا لم يكن محفوظاً
            if (!note.originalColor) {
                note.originalColor = note.color || '#000000';
            }
            
            // تغيير اللون إلى فاتح إذا كان داكن
            const isDarkColor = isColorDark(note.color || note.originalColor);
            if (isDarkColor) {
                note.color = '#f0f0f0';
            }
        });
    } else {
        // إذا كان الثيم غير أسود، نرجع الألوان الأصلية
        AppState.notes.forEach(note => {
            if (note.originalColor) {
                note.color = note.originalColor;
            } else {
                // إذا لم يكن هناك لون أصلي محفوظ
                note.color = note.color || '#000000';
            }
        });
    }
    
    saveNotes();
    
    // تحديث العرض إذا كنا في عرض الملاحظات
    if (AppState.currentView === 'notes') {
        renderNotes();
    }
}

function isColorDark(color) {
    // تحويل HEX إلى RGB
    let r, g, b;
    
    if (color.startsWith('#')) {
        if (color.length === 4) {
            r = parseInt(color[1] + color[1], 16);
            g = parseInt(color[2] + color[2], 16);
            b = parseInt(color[3] + color[3], 16);
        } else {
            r = parseInt(color.substr(1, 2), 16);
            g = parseInt(color.substr(3, 2), 16);
            b = parseInt(color.substr(5, 2), 16);
        }
    } else if (color.startsWith('rgb')) {
        const match = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
        if (match) {
            r = parseInt(match[1]);
            g = parseInt(match[2]);
            b = parseInt(match[3]);
        } else {
            return true;
        }
    } else {
        return true;
    }
    
    // حساب السطوع
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness < 128;
}

// دالة لتغيير الثيم
function changeTheme(theme) {
    AppState.currentTheme = theme;
    
    if (theme === 'custom') {
        openCustomThemeModal();
        return;
    }
    
    document.body.className = `theme-${theme}`;
    localStorage.setItem('mytasks_theme', theme);
    
    updateNotesColorsForTheme(theme);
    updateThemeButtons();
    refreshCurrentView();
}

function setupThemeEvents() {
    document.querySelectorAll('.theme-option').forEach(option => {
        option.addEventListener('click', function() {
            const theme = this.dataset.theme;
            changeTheme(theme);
        });
    });
}

function updateThemeButtons() {
    document.querySelectorAll('.theme-option').forEach(option => {
        option.classList.remove('active');
        if (option.dataset.theme === AppState.currentTheme) {
            option.classList.add('active');
        }
    });
}

// ========== الثيم المخصص ==========
function openCustomThemeModal() {
    const modalHTML = `
        <div class="modal" id="custom-theme-modal">
            <div class="modal-content" style="max-width: 500px;">
                <div class="modal-header">
                    <h3>🎨 تخصيص الثيم</h3>
                    <button class="close-btn" onclick="closeModal('custom-theme-modal')">&times;</button>
                </div>
                <div class="modal-body">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <div class="theme-preview" id="custom-theme-live-preview" 
                             style="width: 100px; height: 100px; margin: 0 auto 20px; border-radius: 50%; border: 3px solid var(--theme-border);">
                        </div>
                        <p style="color: var(--gray-color);">معاينة التدرج اللوني</p>
                    </div>
                    
                    <div class="form-group">
                        <label for="custom-color1">اللون الأول (أعلى)</label>
                        <input type="color" id="custom-color1" value="#5a76e8" onchange="updateCustomPreview()">
                    </div>
                    
                    <div class="form-group">
                        <label for="custom-color2">اللون الثاني (أسفل)</label>
                        <input type="color" id="custom-color2" value="#3a56d4" onchange="updateCustomPreview()">
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="closeModal('custom-theme-modal')">إلغاء</button>
                    <button class="btn btn-primary" onclick="applyCustomTheme()">تطبيق الثيم</button>
                </div>
            </div>
        </div>
    `;
    
    const existingModal = document.getElementById('custom-theme-modal');
    if (existingModal) existingModal.remove();
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    document.getElementById('custom-theme-modal').classList.add('active');
    
    setTimeout(updateCustomPreview, 100);
}

function updateCustomPreview() {
    const color1 = document.getElementById('custom-color1').value;
    const color2 = document.getElementById('custom-color2').value;
    const preview = document.getElementById('custom-theme-live-preview');
    
    if (preview) {
        preview.style.background = `linear-gradient(45deg, ${color1}, ${color2})`;
    }
}

function applyCustomTheme() {
    const color1 = document.getElementById('custom-color1').value;
    const color2 = document.getElementById('custom-color2').value;
    
    document.documentElement.style.setProperty('--custom-color1', color1);
    document.documentElement.style.setProperty('--custom-color2', color2);
    
    AppState.currentTheme = 'custom';
    document.body.className = 'theme-custom';
    localStorage.setItem('mytasks_theme', 'custom');
    localStorage.setItem('mytasks_custom_colors', JSON.stringify({ color1, color2 }));
    
    updateThemeButtons();
    refreshCurrentView();
    closeModal('custom-theme-modal');
}

function loadCustomTheme() {
    const customColors = localStorage.getItem('mytasks_custom_colors');
    if (customColors) {
        try {
            const { color1, color2 } = JSON.parse(customColors);
            document.documentElement.style.setProperty('--custom-color1', color1);
            document.documentElement.style.setProperty('--custom-color2', color2);
        } catch (e) {
            console.error("خطأ في تحميل ألوان الثيم المخصص:", e);
        }
    }
}



// ========== إدارة المهام ==========
function addTask(taskData) {
    console.log("إضافة مهمة:", taskData);
    
    const timeframeCheck = checkCategoryTimeframe(taskData.categoryId, parseInt(taskData.duration) || 30);
    
    if (!timeframeCheck.allowed) {
        showTimeframeWarning(timeframeCheck, taskData);
        return;
    }
    
    const newTask = {
        id: generateId(),
        title: taskData.title,
        description: taskData.description || '',
        categoryId: taskData.categoryId,
        duration: parseInt(taskData.duration) || 30,
        date: taskData.date || new Date().toISOString().split('T')[0],
        time: taskData.time || '',
        priority: taskData.priority || 'medium',
        completed: false,
        createdAt: new Date().toISOString()
    };
    
    AppState.tasks.push(newTask);
    saveTasks();
    refreshCurrentView();
    
    closeModal('add-task-modal');
    
    // ✅ إصلاح هنا: إعادة تعيين النموذج بشكل صحيح
    setTimeout(() => {
        document.getElementById('task-form').reset();
        
        // إعادة تعيين التاريخ لليوم الحالي
        const today = new Date().toISOString().split('T')[0];
        const dateInput = document.getElementById('task-date');
        if (dateInput) {
            dateInput.value = today;
        }
        
        // إعادة تعيين المدة الافتراضية
        const durationInput = document.getElementById('task-duration');
        if (durationInput) {
            durationInput.value = '30';
        }
        
        // إعادة تعيين الأولوية الافتراضية
        const prioritySelect = document.getElementById('task-priority');
        if (prioritySelect) {
            prioritySelect.value = 'medium';
        }
    }, 100);
}

function updateTask(taskId, taskData) {
    const taskIndex = AppState.tasks.findIndex(task => task.id === taskId);
    if (taskIndex === -1) return;
    
    AppState.tasks[taskIndex] = {
        ...AppState.tasks[taskIndex],
        title: taskData.title,
        description: taskData.description || '',
        categoryId: taskData.categoryId,
        duration: parseInt(taskData.duration) || 30,
        date: taskData.date || new Date().toISOString().split('T')[0],
        time: taskData.time || '',
        priority: taskData.priority || 'medium',
        updatedAt: new Date().toISOString()
    };
    
    saveTasks();
    refreshCurrentView();
    
    closeModal('edit-task-modal');
}

function toggleTaskCompletion(taskId) {
    const taskIndex = AppState.tasks.findIndex(task => task.id === taskId);
    if (taskIndex === -1) return;
    
    AppState.tasks[taskIndex].completed = !AppState.tasks[taskIndex].completed;
    saveTasks();
    refreshCurrentView();
}

function deleteTask(taskId) {
    const taskIndex = AppState.tasks.findIndex(task => task.id === taskId);
    if (taskIndex === -1) {
        const deletedIndex = AppState.deletedTasks.findIndex(task => task.id === taskId);
        if (deletedIndex !== -1) {
            if (confirm('هذه المهمة محذوفة بالفعل. هل تريد حذفها نهائياً؟')) {
                AppState.deletedTasks.splice(deletedIndex, 1);
                saveDeletedTasks();
                renderTasks();
            }
        } else {
            alert('هذه المهمة غير موجودة.');
        }
        return;
    }
    
    const task = AppState.tasks[taskIndex];
    if (!confirm(`هل أنت متأكد من حذف المهمة: "${task.title}"؟`)) return;
    
    AppState.deletedTasks.push({
        ...task,
        deletedAt: new Date().toISOString()
    });
    
    AppState.tasks.splice(taskIndex, 1);
    
    saveTasks();
    saveDeletedTasks();
    refreshCurrentView();
}

function restoreTask(taskId) {
    const taskIndex = AppState.deletedTasks.findIndex(task => task.id === taskId);
    if (taskIndex === -1) return;
    
    const task = AppState.deletedTasks[taskIndex];
    AppState.tasks.push(task);
    AppState.deletedTasks.splice(taskIndex, 1);
    
    saveTasks();
    saveDeletedTasks();
    renderTasks();
}

function checkCategoryTimeframe(categoryId, newTaskDuration = 0) {
    const category = AppState.categories.find(c => c.id === categoryId);
    if (!category || !category.timeframeMinutes) return { allowed: true };
    
    const categoryTasks = AppState.tasks.filter(task => task.categoryId === categoryId);
    const totalDuration = categoryTasks.reduce((sum, task) => sum + (task.duration || 0), 0) + newTaskDuration;
    
    const categoryTimeframeMinutes = category.timeframeMinutes || 60;
    
    if (totalDuration <= categoryTimeframeMinutes) {
        return { allowed: true };
    }
    
    return {
        allowed: false,
        totalDuration: totalDuration,
        categoryTimeframe: categoryTimeframeMinutes,
        exceedBy: totalDuration - categoryTimeframeMinutes,
        categoryName: category.name,
        categoryTasks: categoryTasks
    };
}

function showTimeframeWarning(timeframeCheck, taskData) {
    const warningHTML = `
        <div class="modal" id="timeframe-warning-modal">
            <div class="modal-content" style="max-width: 500px;">
                <div class="modal-header">
                    <h3>⚠️ تحذير: تجاوز الحيز الزمني</h3>
                    <button class="close-btn" onclick="closeModal('timeframe-warning-modal')">&times;</button>
                </div>
                <div class="modal-body">
                    <div style="padding: 20px; background: rgba(247, 37, 133, 0.1); border-radius: 8px; margin-bottom: 20px;">
                        <p style="color: var(--danger-color); font-weight: 600; margin-bottom: 10px;">
                            فئة "${timeframeCheck.categoryName}" قد تجاوزت الحيز الزمني المسموح!
                        </p>
                        <p style="color: var(--theme-text);">
                            • الوقت الإجمالي: ${timeframeCheck.totalDuration} دقيقة<br>
                            • الحد المسموح: ${timeframeCheck.categoryTimeframe} دقيقة<br>
                            • التجاوز: ${timeframeCheck.exceedBy} دقيقة
                        </p>
                    </div>
                    
                    <h4 style="margin-bottom: 15px; color: var(--theme-text);">ماذا تريد أن تفعل؟</h4>
                    
                    <div style="display: flex; flex-direction: column; gap: 10px;">
                        <button class="btn btn-warning" id="add-anyway-btn" style="text-align: right;">
                            <i class="fas fa-plus-circle"></i> إنشاء المهمة الجديدة على أي حال
                        </button>
                        
                        <button class="btn btn-secondary" id="delete-and-replace-btn" style="text-align: right;">
                            <i class="fas fa-exchange-alt"></i> حذف مهمة سابقة وإضافة المهمة الجديدة
                        </button>
                        
                        <button class="btn btn-danger" id="cancel-add-btn" style="text-align: right;">
                            <i class="fas fa-times"></i> إلغاء إضافة المهمة
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    const existingModal = document.getElementById('timeframe-warning-modal');
    if (existingModal) {
        existingModal.remove();
    }
    
    document.body.insertAdjacentHTML('beforeend', warningHTML);
    const modal = document.getElementById('timeframe-warning-modal');
    modal.classList.add('active');
    
    window.pendingTaskData = taskData;
    window.timeframeCheck = timeframeCheck;
    
    setTimeout(() => {
        document.getElementById('add-anyway-btn').addEventListener('click', () => {
            addTaskAnyway(taskData);
            closeModal('timeframe-warning-modal');
        });
        
        document.getElementById('delete-and-replace-btn').addEventListener('click', () => {
            showDeleteReplaceOptions(timeframeCheck, taskData);
        });
        
        document.getElementById('cancel-add-btn').addEventListener('click', () => {
            closeModal('timeframe-warning-modal');
            delete window.pendingTaskData;
            delete window.timeframeCheck;
        });
    }, 100);
}

function showDeleteReplaceOptions(timeframeCheck, taskData) {
    const optionsHTML = `
        <div class="modal" id="delete-replace-modal">
            <div class="modal-content" style="max-width: 600px; max-height: 80vh;">
                <div class="modal-header">
                    <h3>اختر مهمة للحذف</h3>
                    <button class="close-btn" onclick="closeModal('delete-replace-modal')">&times;</button>
                </div>
                <div class="modal-body">
                    <p style="margin-bottom: 20px; color: var(--theme-text);">
                        اختر مهمة من فئة "${timeframeCheck.categoryName}" لحذفها وإضافة المهمة الجديدة:
                    </p>
                    
                    <div id="tasks-to-delete-list" style="max-height: 300px; overflow-y: auto;">
                    </div>
                    
                    <div class="modal-footer" style="margin-top: 20px;">
                        <button class="btn btn-secondary" onclick="closeModal('delete-replace-modal')">
                            <i class="fas fa-arrow-right"></i> رجوع
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    const existingModal = document.getElementById('delete-replace-modal');
    if (existingModal) existingModal.remove();
    
    document.body.insertAdjacentHTML('beforeend', optionsHTML);
    
    closeModal('timeframe-warning-modal');
    setTimeout(() => {
        document.getElementById('delete-replace-modal').classList.add('active');
        renderTasksToDelete(timeframeCheck.categoryTasks, taskData);
    }, 300);
}

function renderTasksToDelete(tasks, newTaskData) {
    const container = document.getElementById('tasks-to-delete-list');
    
    if (!tasks || tasks.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 40px; color: var(--gray-color);">
                <i class="fas fa-inbox" style="font-size: 2rem; opacity: 0.3; margin-bottom: 15px;"></i>
                <p>لا توجد مهام في هذه الفئة للحذف</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    
    tasks.forEach(task => {
        html += `
            <div class="task-card" style="margin-bottom: 10px; cursor: pointer;" 
                 onclick="deleteAndReplaceTask('${task.id}', window.pendingTaskData)">
                <div class="task-content">
                    <div class="task-title">${task.title}</div>
                    <div class="task-description">${task.description || ''}</div>
                    <div class="task-meta">
                        <span><i class="fas fa-clock"></i> ${task.duration} دقيقة</span>
                        <span><i class="fas fa-calendar"></i> ${formatDate(task.date)}</span>
                        ${task.completed ? '<span><i class="fas fa-check-circle" style="color: var(--success-color);"></i> مكتملة</span>' : ''}
                    </div>
                </div>
                <div class="task-actions">
                    <button class="btn btn-danger btn-sm" onclick="event.stopPropagation(); deleteAndReplaceTask('${task.id}', window.pendingTaskData)">
                        <i class="fas fa-trash"></i> حذف وإضافة المهمة الجديدة
                    </button>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

function deleteAndReplaceTask(taskIdToDelete, newTaskData) {
    const taskIndex = AppState.tasks.findIndex(task => task.id === taskIdToDelete);
    if (taskIndex !== -1) {
        AppState.deletedTasks.push({
            ...AppState.tasks[taskIndex],
            deletedAt: new Date().toISOString(),
            replacedBy: newTaskData.title
        });
        
        AppState.tasks.splice(taskIndex, 1);
    }
    
    const newTask = {
        id: generateId(),
        title: newTaskData.title,
        description: newTaskData.description || '',
        categoryId: newTaskData.categoryId,
        duration: parseInt(newTaskData.duration) || 30,
        date: newTaskData.date || new Date().toISOString().split('T')[0],
        time: newTaskData.time || '',
        priority: newTaskData.priority || 'medium',
        completed: false,
        createdAt: new Date().toISOString(),
        replacedTask: taskIdToDelete
    };
    
    AppState.tasks.push(newTask);
    
    saveTasks();
    saveDeletedTasks();
    refreshCurrentView();
    
    closeModal('delete-replace-modal');
    closeModal('add-task-modal');
    
    delete window.pendingTaskData;
    delete window.timeframeCheck;
    
    alert(`تم حذف المهمة القديمة وإضافة المهمة الجديدة "${newTaskData.title}" بنجاح.`);
}

function addTaskAnyway(taskData) {
    const newTask = {
        id: generateId(),
        title: taskData.title,
        description: taskData.description || '',
        categoryId: taskData.categoryId,
        duration: parseInt(taskData.duration) || 30,
        date: taskData.date || new Date().toISOString().split('T')[0],
        time: taskData.time || '',
        priority: taskData.priority || 'medium',
        completed: false,
        createdAt: new Date().toISOString(),
        addedAnyway: true
    };
    
    AppState.tasks.push(newTask);
    saveTasks();
    refreshCurrentView();
    
    closeModal('add-task-modal');
    document.getElementById('task-form').reset();
    
    delete window.pendingTaskData;
    delete window.timeframeCheck;
    
    alert(`تمت إضافة المهمة "${taskData.title}" على الرغم من تجاوز الحيز الزمني.`);
}

// دالة جديدة لإضافة أحداث الأزرار
function setupTaskButtonsEvents() {
    document.querySelectorAll('.task-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
            const taskId = e.target.closest('.task-card').dataset.id;
            toggleTaskCompletion(taskId);
        });
    });
    
    // إضافة حدث النقر على البطاقة لفتح التعديل
    document.querySelectorAll('.task-card:not(.deleted)').forEach(card => {
        card.addEventListener('click', (e) => {
            // منع فتح التعديل إذا تم النقر على أي زر أو checkbox
            if (!e.target.closest('.task-actions') && !e.target.closest('input[type="checkbox"]')) {
                const taskId = card.dataset.id;
                openEditTaskModal(taskId);
            }
        });
    });
    
    document.querySelectorAll('.delete-task-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const taskId = e.target.closest('button').dataset.id;
            deleteTask(taskId);
        });
    });
    
    document.querySelectorAll('.edit-task-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const taskId = e.target.closest('button').dataset.id;
            openEditTaskModal(taskId);
        });
    });
    
    document.querySelectorAll('.restore-task-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const taskId = e.target.closest('button').dataset.id;
            restoreTask(taskId);
        });
    });
    
    document.querySelectorAll('.permanent-delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const taskId = e.target.closest('button').dataset.id;
            if (confirm('هل أنت متأكد من الحذف النهائي؟ لا يمكن استعادة المهمة بعد ذلك.')) {
                const index = AppState.deletedTasks.findIndex(t => t.id === taskId);
                if (index !== -1) {
                    AppState.deletedTasks.splice(index, 1);
                    saveDeletedTasks();
                    renderTasks();
                }
            }
        });
    });
    
    // إضافة حدث النقر على البطاقة لفتح التعديل
    document.querySelectorAll('.task-card:not(.deleted)').forEach(card => {
        card.addEventListener('click', (e) => {
            // منع فتح التعديل إذا تم النقر على أي زر أو checkbox
            if (!e.target.closest('.task-actions') && 
                !e.target.closest('input[type="checkbox"]') &&
                !e.target.classList.contains('btn')) {
                const taskId = card.dataset.id;
                openEditTaskModal(taskId);
            }
        });
    });
} 



// ========== إدارة الفئات ==========
function renderCategories() {
    console.log("🎯 عرض الفئات...");
    const container = document.getElementById('categories-list');
    
    if (!container) {
        console.error("❌ عنصر الفئات غير موجود!");
        return;
    }
    
    if (AppState.categories.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="text-align: center; padding: 60px 20px; color: var(--gray-color);">
                <i class="fas fa-tags" style="font-size: 3rem; margin-bottom: 20px; opacity: 0.3;"></i>
                <h3 style="color: var(--theme-text); margin-bottom: 10px;">لا توجد فئات</h3>
                <p>اضغط على "فئة جديدة" لإنشاء فئتك الأولى</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    
    AppState.categories.forEach(category => {
        const categoryTasks = AppState.tasks.filter(task => task.categoryId === category.id);
        const completedTasks = categoryTasks.filter(task => task.completed).length;
        const totalTasks = categoryTasks.length;
        
        let totalDuration = 0;
        let completedDuration = 0;
        categoryTasks.forEach(task => {
            totalDuration += task.duration || 30;
            if (task.completed) completedDuration += task.duration || 30;
        });
        
        const progressPercent = totalDuration > 0 ? Math.round((completedDuration / totalDuration) * 100) : 0;
        
        html += `
            <div class="category-card" data-id="${category.id}">
                <div class="category-header">
                    <div class="category-color" style="background: ${category.color}"></div>
                    <div class="category-name">${category.name}</div>
                    <div class="category-stats">${totalTasks} مهام</div>
                </div>
                
                <div class="category-progress-info">
                    <span>الإنجاز: ${progressPercent}%</span>
                    <span>مكتملة: ${completedTasks}/${totalTasks}</span>
                </div>
                
                <div class="category-progress-container">
                    <div class="category-progress-bar ${completedDuration === totalDuration && totalTasks > 0 ? 'completed' : completedDuration === 0 ? 'empty' : ''}" 
                         style="width: ${progressPercent}%; background: ${completedDuration === totalDuration && totalTasks > 0 ? 'var(--success-color)' : category.color};">
                    </div>
                </div>
                
                <div class="category-tasks-container">
        `;
        
        if (categoryTasks.length === 0) {
            html += `
                <div style="text-align: center; padding: 20px; color: var(--gray-color);">
                    <i class="fas fa-tasks" style="opacity: 0.3; margin-bottom: 10px;"></i>
                    <p style="margin: 0;">${category.messageEmpty || 'لا توجد مهام في هذه الفئة'}</p>
                </div>
            `;
        } else {
            categoryTasks.slice(0, 5).forEach(task => {
                const isOverdue = isTaskOverdue(task);
                
                html += `
                    <div class="category-task-item ${task.completed ? 'completed' : ''}" 
                         onclick="openEditTaskModal('${task.id}')">
                        <div class="category-task-title">
                            <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''} 
                                   onclick="event.stopPropagation(); toggleTaskCompletion('${task.id}')">
                            <span>${task.title}</span>
                        </div>
                        <div class="category-task-meta">
                            <span><i class="fas fa-calendar"></i> ${formatDate(task.date)}</span>
                            <span><i class="fas fa-clock"></i> ${task.duration} دقيقة</span>
                            ${isOverdue ? '<span style="color: #f72585;"><i class="fas fa-exclamation-circle"></i> متأخرة</span>' : ''}
                        </div>
                    </div>
                `;
            });
            
            if (categoryTasks.length > 5) {
                html += `<div style="text-align: center; color: var(--gray-color); font-size: 0.9rem; padding: 10px;">+${categoryTasks.length - 5} مهام أخرى</div>`;
            }
        }
        
           html += `
            <button class="btn btn-secondary category-add-task-btn" 
                    onclick="openAddTaskModal('${category.id}')" 
                    style="margin-top: 10px; width: 100%;">
                <i class="fas fa-plus"></i> إضافة مهمة جديدة
            </button>
        `;
        
        html += `</div>`; // إغلاق category-card
    });
    
    container.innerHTML = html;
    console.log("✅ تم عرض الفئات بنجاح");
}

// ========== عرض الجدول الزمني ==========
function renderCalendar() {
    const container = document.getElementById('calendar-content'); // هذا السطر ناقص!
    const tabs = document.querySelectorAll('.calendar-tab');
    
    // تحديث التبويبات النشطة
    tabs.forEach(tab => {
        tab.classList.remove('active');
        if (tab.dataset.range === AppState.currentCalendarView) {
            tab.classList.add('active');
        }
    });
    
    if (AppState.currentCalendarView === 'daily') {
        renderDailyCalendar(container);
    } else if (AppState.currentCalendarView === 'weekly') {
        renderWeeklyCalendar(container);
    } else if (AppState.currentCalendarView === 'monthly') {
        renderMonthlyCalendar(container);
    }
}

function renderDailyCalendar(container) {
    console.log("📅 عرض الجدول اليومي...");
    
    const date = AppState.currentCalendarDate;
    const dateStr = date.toISOString().split('T')[0];
    const tasksForDay = AppState.tasks.filter(task => task.date === dateStr);
    
    // ترتيب المهام حسب الوقت
    tasksForDay.sort((a, b) => {
        const timeA = a.time ? getTaskTimeInMinutes(a) : 9999;
        const timeB = b.time ? getTaskTimeInMinutes(b) : 9999;
        return timeA - timeB;
    });
    
    let html = `
        <div class="calendar-nav" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <button class="btn btn-secondary btn-sm" onclick="changeCalendarDate(-1)">
                <i class="fas fa-chevron-right"></i> أمس
            </button>
            <h3 style="margin: 0 15px; text-align: center; color: var(--theme-text);">
                ${date.toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </h3>
            <button class="btn btn-secondary btn-sm" onclick="changeCalendarDate(1)">
                غداً <i class="fas fa-chevron-left"></i>
            </button>
        </div>
        <div class="daily-calendar" id="daily-calendar-container" style="max-height: 500px; overflow-y: auto; padding-right: 10px;">
    `;
    
    if (tasksForDay.length === 0) {
        html += `
            <div style="text-align: center; padding: 60px 20px; color: var(--gray-color);">
                <i class="fas fa-calendar-day" style="font-size: 3rem; margin-bottom: 20px; opacity: 0.3;"></i>
                <h3 style="color: var(--theme-text); margin-bottom: 10px;">لا توجد مهام لهذا اليوم</h3>
                <p>اضغط على "إضافة مهمة" لإنشاء مهمة جديدة</p>
            </div>
        `;
    } else {
const timeSlots = [
    { start: '00:00', end: '04:00', label: 'ليل (12-4 ص)' },
    { start: '04:00', end: '06:00', label: 'فجر (4-6 ص)' },
    { start: '06:00', end: '12:00', label: 'صباح (6-12 ص)' },
    { start: '12:00', end: '16:00', label: 'ظهر (12-4 م)' },
    { start: '16:00', end: '18:00', label: 'عصر (4-6 م)' },
    { start: '18:00', end: '19:00', label: 'مساء (6-7 م)' },
    { start: '19:00', end: '24:00', label: 'ليل (8-12 م)' }
];
        
        timeSlots.forEach(slot => {
            const slotTasks = tasksForDay.filter(task => {
                if (!task.time) return false;
                const taskTime = getTaskTimeInMinutes(task);
                const slotStart = getTaskTimeInMinutes({ time: slot.start });
                const slotEnd = getTaskTimeInMinutes({ time: slot.end });
                return taskTime >= slotStart && taskTime < slotEnd;
            });
            
            if (slotTasks.length > 0) {
                html += `
                    <div class="time-slot" data-time="${slot.start}">
                        <div class="time-header">
                            <div class="time-title">
                                <i class="fas fa-clock"></i>
                                <span>${slot.label}</span>
                            </div>
                            <span class="task-count">${slotTasks.length} مهام</span>
                        </div>
                        <div class="time-tasks">
                `;
                
                slotTasks.forEach(task => {
                    const category = getCategoryById(task.categoryId);
                    const isOverdue = isTaskOverdue(task);
                    
                    html += `
                        <div class="calendar-task-card ${task.completed ? 'completed' : ''} ${isOverdue ? 'overdue' : ''}" 
                             data-id="${task.id}"
                             onclick="openEditTaskModal('${task.id}')"
                             style="border-left: 3px solid ${category.color}; 
                                    border-right: 3px solid ${category.color}; 
                                    cursor: pointer; margin-bottom: 5px; padding: 8px 10px; font-size: 0.85rem;"
                             title="${task.title}">
                            <div class="calendar-task-title" style="font-weight: 500; margin-bottom: 3px; font-size: 0.85rem; display: flex; align-items: center; gap: 8px;">
                                <span style="color: ${category.color}; font-size: 0.7rem;"><i class="fas fa-circle"></i></span>
                                <span>${task.title.length > 25 ? task.title.substring(0, 25) + '...' : task.title}</span>
                            </div>
                            <div class="calendar-task-meta" style="display: flex; justify-content: space-between; font-size: 0.75rem; color: var(--gray-color);">
                                <span><i class="fas fa-clock"></i> ${task.time}</span>
                                <span><i class="fas fa-stopwatch"></i> ${task.duration} د</span>
                            </div>
                        </div>
                    `;
                });
                
                html += `
                        </div>
                    </div>
                `;
            }
        });
    }
    
    html += '</div>';
    container.innerHTML = html;
        // إضافة أحداث التمرير والتفاعل
    setTimeout(() => {
        setupCalendarTooltips();
    }, 100);
}

function renderWeeklyCalendar(container) {
    console.log("📅 عرض الجدول الأسبوعي المصغر...");
    
    const today = new Date();
    const currentDate = AppState.currentCalendarDate;
    
    // حساب بداية ونهاية الأسبوع
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    
    let html = `
        <div class="calendar-nav" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <button class="btn btn-secondary btn-sm" onclick="navigateCalendarWeeks(-1)">
                <i class="fas fa-chevron-right"></i> الأسبوع السابق
            </button>
            <h3 style="margin: 0 15px; text-align: center; color: var(--theme-text);">
                الأسبوع ${currentDate.getWeekNumber()}
                <br>
                <small style="font-size: 0.9rem; color: var(--gray-color);">
                    ${startOfWeek.toLocaleDateString('ar-SA', { day: 'numeric', month: 'short' })} 
                    - 
                    ${endOfWeek.toLocaleDateString('ar-SA', { day: 'numeric', month: 'short', year: 'numeric' })}
                </small>
            </h3>
            <button class="btn btn-secondary btn-sm" onclick="navigateCalendarWeeks(1)">
                الأسبوع التالي <i class="fas fa-chevron-left"></i>
            </button>
        </div>
        
        <div style="text-align: center; margin-bottom: 15px;">
            <button class="btn btn-primary btn-sm" onclick="AppState.currentCalendarDate = new Date(); renderCalendar();">
                <i class="fas fa-calendar-day"></i> العودة للأسبوع الحالي
            </button>
        </div>
        
        <div class="weekly-calendar" style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 10px;">
    `;
    
    const dayNames = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    
    for (let i = 0; i < 7; i++) {
        const day = new Date(startOfWeek);
        day.setDate(startOfWeek.getDate() + i);
        const dateStr = day.toISOString().split('T')[0];
        const dayTasks = AppState.tasks.filter(task => task.date === dateStr);
        const isToday = dateStr === new Date().toISOString().split('T')[0];
        
        html += `
            <div class="day-column ${isToday ? 'today' : ''}" 
                 style="background: var(--theme-card); border-radius: 8px; padding: 12px; border: 1px solid var(--theme-border); min-height: 350px; max-height: 450px; overflow-y: auto;">
                <div class="day-header" style="text-align: center; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 2px solid var(--theme-primary); position: sticky; top: 0; background: var(--theme-card); z-index: 1;">
                    <div class="day-name" style="font-weight: 600; color: var(--theme-primary); font-size: 0.95rem;">${dayNames[i]}</div>
                    <div class="day-date" style="color: var(--gray-color); font-size: 0.85rem; margin-top: 4px;">
                        ${day.toLocaleDateString('ar-SA', { day: 'numeric', month: 'short' })}
                    </div>
                    <div class="day-task-count" style="color: var(--theme-primary); font-size: 0.75rem; margin-top: 4px;">
                        ${dayTasks.length} مهام
                    </div>
                </div>
                <div class="day-tasks" style="display: flex; flex-direction: column; gap: 5px;">
        `;
        
        if (dayTasks.length === 0) {
            html += `
                <div style="text-align: center; padding: 20px 10px; color: var(--gray-color);">
                    <i class="fas fa-calendar-day" style="opacity: 0.3; font-size: 1.5rem; margin-bottom: 8px;"></i>
                    <p style="font-size: 0.8rem;">لا توجد مهام</p>
                </div>
            `;
        } else {
            // ترتيب المهام حسب الوقت
            dayTasks.sort((a, b) => {
                const timeA = a.time ? getTaskTimeInMinutes(a) : 9999;
                const timeB = b.time ? getTaskTimeInMinutes(b) : 9999;
                return timeA - timeB;
            });
            
            dayTasks.forEach(task => {
                const category = getCategoryById(task.categoryId);
                const isOverdue = isTaskOverdue(task);
                const priorityColor = task.priority === 'high' ? '#f72585' : 
                                     task.priority === 'medium' ? '#f8961e' : '#4cc9f0';
                
                html += `
                    <div class="calendar-task-card ${task.completed ? 'completed' : ''} ${isOverdue ? 'overdue' : ''}"
                         data-id="${task.id}"
                         onclick="openEditTaskModal('${task.id}')"
                         style="border-left: 3px solid ${category.color}; 
                                cursor: pointer; 
                                margin-bottom: 4px; 
                                padding: 6px 8px; 
                                font-size: 0.75rem;
                                min-height: 40px;
                                background: var(--theme-card);
                                border-radius: 6px;
                                border: 1px solid var(--theme-border);"
                         title="${task.title}">
                        <div class="calendar-task-title" style="font-weight: 500; margin-bottom: 2px; font-size: 0.75rem; display: flex; align-items: center; gap: 4px;">
                            <span style="color: ${category.color}; font-size: 0.6rem;"><i class="fas fa-circle"></i></span>
                            <span style="flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" 
                                  title="${task.title}">
                                ${task.title.length > 15 ? task.title.substring(0, 15) + '...' : task.title}
                            </span>
                        </div>
                        <div class="calendar-task-meta" style="display: flex; justify-content: space-between; font-size: 0.7rem; color: var(--gray-color);">
                            <span><i class="fas fa-clock" style="font-size: 0.6rem;"></i> ${task.time || ''}</span>
                            <span><i class="fas fa-stopwatch" style="font-size: 0.6rem;"></i> ${task.duration} د</span>
                        </div>
                    </div>
                `;
            });
        }
        
        html += `
                </div>
            </div>
        `;
    }
    
    html += '</div>';
    container.innerHTML = html;
    
    // إضافة Tooltips للمهام
    setTimeout(() => {
        setupWeeklyCalendarTooltips();
    }, 100);
}
function renderMonthlyCalendar(container) {
    console.log("📅 عرض الجدول الشهري مع Tooltips...");
    
    const date = AppState.currentCalendarDate;
    const year = date.getFullYear();
    const month = date.getMonth();
    const today = new Date().toISOString().split('T')[0];
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    const startDay = firstDay.getDay();
    
    let html = `
        <div class="calendar-nav" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <button class="btn btn-secondary btn-sm" onclick="changeCalendarMonth(-1)">
                <i class="fas fa-chevron-right"></i> الشهر الماضي
            </button>
            <h3 style="margin: 0 15px;">${date.toLocaleDateString('ar-SA', { year: 'numeric', month: 'long' })}</h3>
            <button class="btn btn-secondary btn-sm" onclick="changeCalendarMonth(1)">
                الشهر القادم <i class="fas fa-chevron-left"></i>
            </button>
        </div>
        
        <div style="text-align: center; margin-bottom: 15px;">
            <button class="btn btn-primary btn-sm" onclick="AppState.currentCalendarDate = new Date(); renderCalendar();">
                <i class="fas fa-calendar-alt"></i> العودة للشهر الحالي
            </button>
        </div>
        
        <div class="monthly-calendar" style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 8px;">
    `;
    
    // رؤوس الأيام
    const dayHeaders = ['أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];
    dayHeaders.forEach(day => {
        html += `
            <div class="month-day-header" 
                 style="text-align: center; font-weight: bold; color: var(--theme-primary); padding: 8px 4px; background: var(--theme-card); border-radius: 6px; font-size: 0.9rem;">
                ${day}
            </div>
        `;
    });
    
    // أيام فارغة في بداية الشهر
    for (let i = 0; i < startDay; i++) {
        html += '<div class="empty-day" style="background: transparent; border: none; min-height: auto;"></div>';
    }
    
    // أيام الشهر
    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
        const dayTasks = AppState.tasks.filter(task => task.date === dateStr);
        const isToday = dateStr === today;
        
        html += `
            <div class="month-day ${isToday ? 'today' : ''}" 
                 style="background: var(--theme-card); border-radius: 8px; padding: 8px; min-height: 120px; max-height: 150px; border: 1px solid var(--theme-border); overflow-y: auto; position: relative;"
                 data-date="${dateStr}">
                <div class="day-number" style="font-weight: 600; margin-bottom: 8px; color: ${isToday ? 'var(--theme-primary)' : 'var(--theme-text)'}; font-size: 1rem; text-align: center; position: sticky; top: 0; background: var(--theme-card); padding: 4px 0; z-index: 1;">
                    ${day}
                    ${isToday ? '<span style="font-size: 0.7rem; color: var(--theme-primary);">(اليوم)</span>' : ''}
                </div>
                <div class="month-tasks" style="display: flex; flex-direction: column; gap: 4px;">
        `;
        
        if (dayTasks.length === 0) {
            html += `
                <div style="text-align: center; padding: 10px; color: var(--gray-color); font-size: 0.8rem;">
                    <i class="fas fa-calendar-day" style="opacity: 0.3;"></i>
                </div>
            `;
        } else {
            // عرض أول 3 مهام فقط (بسبب المساحة)
            const tasksToShow = dayTasks.slice(0, 3);
            
            tasksToShow.forEach((task, index) => {
                const category = getCategoryById(task.categoryId);
                const isOverdue = isTaskOverdue(task);
                const priorityIcon = task.priority === 'high' ? 'fas fa-flag' : 
                                    task.priority === 'medium' ? 'fas fa-flag' : 'fas fa-flag';
                
                html += `
                    <div class="month-task-item" 
                         data-id="${task.id}"
                         data-task-index="${index}"
                         data-date="${dateStr}"
                         onclick="openEditTaskModal('${task.id}')"
                         style="cursor: pointer; padding: 4px 6px; border-radius: 4px; background: var(--theme-bg); border-right: 2px solid ${category.color}; font-size: 0.7rem;"
                         title="انقر للتعديل">
                        <div style="display: flex; align-items: center; gap: 4px; margin-bottom: 2px;">
                            <span class="month-task-dot" style="width: 6px; height: 6px; border-radius: 50%; background: ${category.color}; flex-shrink: 0;"></span>
                            <span style="font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                                ${task.title.length > 10 ? task.title.substring(0, 10) + '...' : task.title}
                            </span>
                        </div>
                        <div style="display: flex; justify-content: space-between; font-size: 0.65rem; color: var(--gray-color);">
                            <span><i class="fas fa-clock" style="font-size: 0.6rem;"></i> ${task.time || ''}</span>
                            ${task.completed ? '<span style="color: var(--success-color);"><i class="fas fa-check"></i></span>' : ''}
                        </div>
                    </div>
                `;
            });
            
            if (dayTasks.length > 3) {
                html += `
                    <div style="font-size: 0.7rem; color: var(--theme-primary); cursor: pointer; text-align: center; margin-top: 4px; padding: 2px;"
                         onclick="showAllTasksForDay('${dateStr}')">
                        <i class="fas fa-plus-circle"></i> +${dayTasks.length - 3} أخرى
                    </div>
                `;
            }
        }
        
        html += `
                </div>
                ${dayTasks.length > 0 ? 
                    `<div style="position: absolute; bottom: 4px; left: 4px; font-size: 0.65rem; color: var(--gray-color);">
                        <i class="fas fa-tasks"></i> ${dayTasks.length}
                    </div>` 
                    : ''
                }
            </div>
        `;
    }
    
    html += '</div>';
    container.innerHTML = html;
    
    // إضافة Tooltips للمهام الشهرية
    setTimeout(() => {
        setupMonthlyCalendarTooltips();
    }, 100);
}

// دوال التنقل في الجدول
function changeCalendarWeek(weeks) {
    AppState.currentCalendarDate.setDate(AppState.currentCalendarDate.getDate() + (weeks * 7));
    renderCalendar();
}

function changeCalendarMonth(months) {
    AppState.currentCalendarDate.setMonth(AppState.currentCalendarDate.getMonth() + months);
    renderCalendar();
}
function changeCalendarDate(days) {
    AppState.currentCalendarDate.setDate(AppState.currentCalendarDate.getDate() + days);
    renderCalendar();
}

// دالة مساعدة لرقم الأسبوع
Date.prototype.getWeekNumber = function() {
    const date = new Date(this.getTime());
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
    const week1 = new Date(date.getFullYear(), 0, 4);
    return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
};

// دالة للانتقال بين الأسابيع
function navigateCalendarWeeks(direction) {
    AppState.currentCalendarDate.setDate(AppState.currentCalendarDate.getDate() + (direction * 7));
    renderCalendar();
}

// تعديل renderWeeklyCalendar لإضافة أزرار التنقل
function renderWeeklyCalendar(container) {
    console.log("📅 عرض الجدول الأسبوعي...");
    
    const today = new Date();
    const currentDate = AppState.currentCalendarDate;
    
    // حساب بداية ونهاية الأسبوع
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    
    let html = `
        <div class="calendar-nav" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <button class="btn btn-secondary btn-sm" onclick="navigateCalendarWeeks(-1)">
                <i class="fas fa-chevron-right"></i> الأسبوع السابق
            </button>
            <h3 style="margin: 0 15px; text-align: center; color: var(--theme-text);">
                الأسبوع ${currentDate.getWeekNumber()}
                <br>
                <small style="font-size: 0.9rem; color: var(--gray-color);">
                    ${startOfWeek.toLocaleDateString('ar-SA', { day: 'numeric', month: 'short' })} 
                    - 
                    ${endOfWeek.toLocaleDateString('ar-SA', { day: 'numeric', month: 'short', year: 'numeric' })}
                </small>
            </h3>
            <button class="btn btn-secondary btn-sm" onclick="navigateCalendarWeeks(1)">
                الأسبوع التالي <i class="fas fa-chevron-left"></i>
            </button>
        </div>
        
        <div style="text-align: center; margin-bottom: 15px;">
            <button class="btn btn-primary btn-sm" onclick="AppState.currentCalendarDate = new Date(); renderCalendar();">
                <i class="fas fa-calendar-day"></i> العودة للأسبوع الحالي
            </button>
        </div>
        
        <div class="weekly-calendar" style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 10px;">
    `;
    
    const dayNames = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    
    for (let i = 0; i < 7; i++) {
        const day = new Date(startOfWeek);
        day.setDate(startOfWeek.getDate() + i);
        const dateStr = day.toISOString().split('T')[0];
        const dayTasks = AppState.tasks.filter(task => task.date === dateStr);
        const isToday = dateStr === new Date().toISOString().split('T')[0];
        
        html += `
            <div class="day-column ${isToday ? 'today' : ''}" 
                 style="background: var(--theme-card); border-radius: 8px; padding: 15px; border: 1px solid var(--theme-border); min-height: 400px; max-height: 500px; overflow-y: auto;">
                <div class="day-header" style="text-align: center; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 2px solid var(--theme-primary); position: sticky; top: 0; background: var(--theme-card); z-index: 1;">
                    <div class="day-name" style="font-weight: 600; color: var(--theme-primary); font-size: 1rem;">${dayNames[i]}</div>
                    <div class="day-date" style="color: var(--gray-color); font-size: 0.9rem; margin-top: 5px;">
                        ${day.toLocaleDateString('ar-SA', { day: 'numeric', month: 'short' })}
                    </div>
                    <div class="day-task-count" style="color: var(--theme-primary); font-size: 0.8rem; margin-top: 5px;">
                        ${dayTasks.length} مهام
                    </div>
                </div>
                <div class="day-tasks">
        `;
        
        if (dayTasks.length === 0) {
            html += `
                <div style="text-align: center; padding: 40px 10px; color: var(--gray-color);">
                    <i class="fas fa-calendar-day" style="opacity: 0.3; font-size: 2rem; margin-bottom: 10px;"></i>
                    <p style="font-size: 0.9rem;">لا توجد مهام</p>
                </div>
            `;
        } else {
            dayTasks.forEach(task => {
                const category = getCategoryById(task.categoryId);
                const isOverdue = isTaskOverdue(task);
                
                html += `
                    <div class="calendar-task-card ${task.completed ? 'completed' : ''} ${isOverdue ? 'overdue' : ''}"
                         data-id="${task.id}"
                         onclick="openEditTaskModal('${task.id}')"
                         style="border-left: 3px solid ${category.color}; border-right: 3px solid ${category.color}; cursor: pointer; margin-bottom: 6px; padding: 6px 8px; font-size: 0.8rem;"
                         title="${task.title}">
                        <div class="calendar-task-title" style="font-weight: 500; margin-bottom: 3px; font-size: 0.85rem; display: flex; align-items: center; gap: 5px;">
                            <span style="color: ${category.color}; font-size: 0.6rem;"><i class="fas fa-circle"></i></span>
                            <span>${task.title.length > 20 ? task.title.substring(0, 20) + '...' : task.title}</span>
                        </div>
                        <div class="calendar-task-meta" style="display: flex; justify-content: space-between; font-size: 0.75rem; color: var(--gray-color);">
                            <span><i class="fas fa-clock"></i> ${task.time || ''}</span>
                            <span><i class="fas fa-stopwatch"></i> ${task.duration} د</span>
                        </div>
                    </div>
                `;
            });
        }
        
        html += `
                </div>
            </div>
        `;
    }
    
    html += '</div>';
    container.innerHTML = html;
    
    // إضافة أحداث التمرير والتفاعل
    setTimeout(() => {
        setupCalendarTooltips(); // هذه هي الإضافة المطلوبة
    }, 100);
}

function openEditCategoryMessages(categoryId) {
    console.log("فتح تعديل رسائل الفئة:", categoryId);
    const category = AppState.categories.find(c => c.id === categoryId);
    if (!category) {
        alert("الفئة غير موجودة!");
        return;
    }
    
    const modalHTML = `
        <div class="modal" id="edit-category-messages-modal">
            <div class="modal-content" style="max-width: 600px;">
                <div class="modal-header">
                    <h3>تعديل رسائل فئة: ${category.name}</h3>
                    <button class="close-btn" onclick="closeModal('edit-category-messages-modal')">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="category-messages-form">
                        <div class="form-group">
                            <label for="message-empty">رسالة عند عدم وجود مهام</label>
                            <textarea id="message-empty" rows="3" placeholder="رسالة تظهر عندما لا توجد مهام في الفئة...">${category.messageEmpty || ''}</textarea>
                        </div>
                        
                        <div class="form-group">
                            <label for="message-completed">رسالة عند اكتمال جميع المهام</label>
                            <textarea id="message-completed" rows="3" placeholder="رسالة تظهر عند اكتمال جميع مهام الفئة...">${category.messageCompleted || ''}</textarea>
                        </div>
                        
                        <div class="form-group">
                            <label for="message-exceeded">رسالة عند تجاوز الحيز الزمني</label>
                            <textarea id="message-exceeded" rows="3" placeholder="رسالة تظهر عند تجاوز الحيز الزمني...">${category.messageExceeded || ''}</textarea>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="closeModal('edit-category-messages-modal')">إلغاء</button>
                    <button class="btn btn-primary" onclick="saveCategoryMessages('${categoryId}')">حفظ الرسائل</button>
                </div>
            </div>
        </div>
    `;
    
    const existingModal = document.getElementById('edit-category-messages-modal');
    if (existingModal) existingModal.remove();
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    document.getElementById('edit-category-messages-modal').classList.add('active');
}
// ========== إعداد Tooltips للجدول الشهري ==========
function setupMonthlyCalendarTooltips() {
    console.log("🔍 إعداد Tooltips للجدول الشهري...");
    
    document.querySelectorAll('.month-task-item').forEach(item => {
        item.addEventListener('mouseenter', function(e) {
            const taskId = this.dataset.id;
            const task = AppState.tasks.find(t => t.id === taskId);
            if (!task) return;
            
            const category = getCategoryById(task.categoryId);
            const isOverdue = isTaskOverdue(task);
            const priorityText = task.priority === 'high' ? 'عالية' : 
                                task.priority === 'medium' ? 'متوسطة' : 'منخفضة';
            
            const tooltipHTML = `
                <div class="monthly-task-tooltip" style="
                    position: fixed;
                    background: var(--theme-card);
                    border: 2px solid ${category.color};
                    border-radius: 8px;
                    padding: 12px;
                    box-shadow: 0 8px 25px rgba(0,0,0,0.15);
                    z-index: 10000;
                    max-width: 300px;
                    color: var(--theme-text);
                    font-family: inherit;
                ">
                    <div style="margin-bottom: 8px; display: flex; align-items: center; gap: 8px;">
                        <span style="width: 12px; height: 12px; border-radius: 50%; background: ${category.color};"></span>
                        <strong style="color: ${category.color}; font-size: 1rem;">${task.title}</strong>
                    </div>
                    
                    <div style="color: var(--gray-color); font-size: 0.9rem;">
                        <div><i class="fas fa-tag"></i> الفئة: ${category.name}</div>
                        <div><i class="fas fa-calendar"></i> التاريخ: ${formatDate(task.date)}</div>
                        ${task.time ? `<div><i class="fas fa-clock"></i> الوقت: ${task.time}</div>` : ''}
                        <div><i class="fas fa-stopwatch"></i> المدة: ${task.duration} دقيقة</div>
                        <div><i class="fas fa-flag"></i> الأولوية: ${priorityText}</div>
                        ${task.completed ? '<div><i class="fas fa-check-circle" style="color: var(--success-color);"></i> مكتملة</div>' : ''}
                        ${isOverdue ? '<div><i class="fas fa-exclamation-triangle" style="color: var(--danger-color);"></i> متأخرة</div>' : ''}
                    </div>
                    
                    ${task.description ? `
                        <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid var(--theme-border); font-size: 0.85rem;">
                            <strong>الوصف:</strong> ${task.description}
                        </div>
                    ` : ''}
                    
                    <div style="margin-top: 10px; text-align: center; color: var(--theme-primary); font-size: 0.8rem;">
                        <i class="fas fa-mouse-pointer"></i> انقر للتعديل
                    </div>
                </div>
            `;
            
            // إزالة أي Tooltip سابق
            const existingTooltip = document.querySelector('.monthly-task-tooltip');
            if (existingTooltip) existingTooltip.remove();
            
            document.body.insertAdjacentHTML('beforeend', tooltipHTML);
            
            // وضع الـ Tooltip
            const tooltip = document.querySelector('.monthly-task-tooltip');
            const x = e.clientX + 15;
            const y = e.clientY + 15;
            
            // التأكد من أن الـ Tooltip لا يخرج عن الشاشة
            const screenWidth = window.innerWidth;
            const screenHeight = window.innerHeight;
            const tooltipWidth = 300;
            const tooltipHeight = 200;
            
            let finalX = x;
            let finalY = y;
            
            if (x + tooltipWidth > screenWidth) {
                finalX = screenWidth - tooltipWidth - 10;
            }
            
            if (y + tooltipHeight > screenHeight) {
                finalY = screenHeight - tooltipHeight - 10;
            }
            
            tooltip.style.left = `${finalX}px`;
            tooltip.style.top = `${finalY}px`;
        });
        
        item.addEventListener('mouseleave', function() {
            const tooltip = document.querySelector('.monthly-task-tooltip');
            if (tooltip) tooltip.remove();
        });
    });
}
// ========== عرض جميع مهام يوم معين ==========
function showAllTasksForDay(dateStr) {
    console.log("📋 عرض جميع مهام اليوم:", dateStr);
    
    const dayTasks = AppState.tasks.filter(task => task.date === dateStr);
    
    if (dayTasks.length === 0) {
        alert('لا توجد مهام في هذا اليوم');
        return;
    }
    
    const date = new Date(dateStr);
    const formattedDate = date.toLocaleDateString('ar-SA', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    let html = '';
    
    dayTasks.forEach(task => {
        const category = getCategoryById(task.categoryId);
        const isOverdue = isTaskOverdue(task);
        
        html += `
            <div class="task-card ${task.completed ? 'completed' : ''} ${isOverdue ? 'overdue' : ''}" 
                 data-id="${task.id}"
                 style="cursor: pointer; margin-bottom: 10px;"
                 onclick="openEditTaskModal('${task.id}')">
                <div style="display: flex; align-items: flex-start; gap: 15px;">
                    <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''} 
                           onclick="event.stopPropagation(); toggleTaskCompletion('${task.id}')">
                    <div style="flex: 1;">
                        <div style="font-weight: 600; margin-bottom: 5px; color: ${category.color};">
                            ${task.title}
                        </div>
                        ${task.description ? `<div style="color: var(--gray-color); font-size: 0.9rem; margin-bottom: 8px;">${task.description}</div>` : ''}
                        <div style="display: flex; gap: 15px; font-size: 0.85rem; color: var(--gray-color);">
                            <span><i class="fas fa-clock"></i> ${task.time || 'بدون وقت'}</span>
                            <span><i class="fas fa-stopwatch"></i> ${task.duration} د</span>
                            <span><i class="fas fa-flag" style="color: ${task.priority === 'high' ? '#f72585' : task.priority === 'medium' ? '#f8961e' : '#4cc9f0'}"></i> 
                                ${task.priority === 'high' ? 'عالية' : task.priority === 'medium' ? 'متوسطة' : 'منخفضة'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
    
    const modalHTML = `
        <div class="modal" id="day-tasks-modal">
            <div class="modal-content" style="max-width: 600px; max-height: 80vh;">
                <div class="modal-header">
                    <h3>المهام في ${formattedDate}</h3>
                    <button class="close-btn" onclick="closeModal('day-tasks-modal')">&times;</button>
                </div>
                <div class="modal-body">
                    <div style="margin-bottom: 20px; text-align: center; padding: 10px; background: var(--theme-card); border-radius: 8px;">
                        <i class="fas fa-calendar-day" style="color: var(--theme-primary); margin-left: 8px;"></i>
                        <span>إجمالي المهام: ${dayTasks.length}</span>
                    </div>
                    <div style="max-height: 400px; overflow-y: auto; padding-right: 10px;">
                        ${html}
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="closeModal('day-tasks-modal')">إغلاق</button>
                </div>
            </div>
        </div>
    `;
    
    const existingModal = document.getElementById('day-tasks-modal');
    if (existingModal) existingModal.remove();
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    document.getElementById('day-tasks-modal').classList.add('active');
}

function saveCategoryMessages(categoryId) {
    const categoryIndex = AppState.categories.findIndex(c => c.id === categoryId);
    if (categoryIndex === -1) return;
    
    const messageEmpty = document.getElementById('message-empty')?.value.trim() || '';
    const messageCompleted = document.getElementById('message-completed')?.value.trim() || '';
    const messageExceeded = document.getElementById('message-exceeded')?.value.trim() || '';
    
    AppState.categories[categoryIndex] = {
        ...AppState.categories[categoryIndex],
        messageEmpty: messageEmpty || 'لا توجد مهام في هذه الفئة',
        messageCompleted: messageCompleted || 'ممتاز! لقد أكملت جميع المهام',
        messageExceeded: messageExceeded || 'لقد تجاوزت الوقت المخصص لهذه الفئة'
    };
    
    saveCategories();
    renderCategories();
    closeModal('edit-category-messages-modal');
    alert('تم حفظ الرسائل بنجاح!');
}

function openEditCategoryModal(categoryId) {
    console.log("فتح تعديل الفئة:", categoryId);
    const category = AppState.categories.find(c => c.id === categoryId);
    if (!category) {
        alert("الفئة غير موجودة!");
        return;
    }
    
    AppState.currentCategoryId = categoryId;
    
    const modalHTML = `
        <div class="modal" id="edit-category-modal">
            <div class="modal-content" style="max-width: 500px;">
                <div class="modal-header">
                    <h3>تعديل الفئة: ${category.name}</h3>
                    <button class="close-btn" onclick="closeModal('edit-category-modal')">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="edit-category-form">
                        <div class="form-group">
                            <label for="edit-category-name">اسم الفئة *</label>
                            <input type="text" id="edit-category-name" value="${category.name}" required>
                        </div>
                        <div class="form-group">
                            <label for="edit-category-color">لون الفئة *</label>
                            <input type="color" id="edit-category-color" value="${category.color}" required>
                        </div>
                        <div class="form-group">
                            <label for="edit-category-timeframe">الحيز الزمني (بالدقائق)</label>
                            <input type="number" id="edit-category-timeframe" value="${category.timeframeMinutes || 60}" min="1">
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="closeModal('edit-category-modal')">إلغاء</button>
                    <button class="btn btn-primary" onclick="saveCategoryEdit('${categoryId}')">حفظ التعديلات</button>
                </div>
            </div>
        </div>
    `;
    
    const existingModal = document.getElementById('edit-category-modal');
    if (existingModal) existingModal.remove();
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    document.getElementById('edit-category-modal').classList.add('active');
}

function saveCategoryEdit(categoryId) {
    const categoryIndex = AppState.categories.findIndex(c => c.id === categoryId);
    if (categoryIndex === -1) return;
    
    const name = document.getElementById('edit-category-name').value.trim();
    const color = document.getElementById('edit-category-color').value;
    const timeframe = parseInt(document.getElementById('edit-category-timeframe').value) || 60;
    
    if (!name) {
        alert('يرجى إدخال اسم الفئة');
        return;
    }
    
    AppState.categories[categoryIndex] = {
        ...AppState.categories[categoryIndex],
        name: name,
        color: color,
        timeframeMinutes: timeframe
    };
    
    saveCategories();
    renderCategories();
    closeModal('edit-category-modal');
    alert('تم تعديل الفئة بنجاح!');
}

function openAddCategoryModal() {
    AppState.currentCategoryId = null;
    document.getElementById('category-modal-title').textContent = 'إضافة فئة جديدة';
    document.getElementById('category-name').value = '';
    document.getElementById('category-color').value = '#5a76e8';
    document.getElementById('category-timeframe').value = '60';
    document.getElementById('category-timeframe-type').value = 'minutes';
    document.getElementById('category-modal').classList.add('active');
}

function saveCategory() {
    const name = document.getElementById('category-name').value.trim();
    const color = document.getElementById('category-color').value;
    const timeframeMinutes = parseInt(document.getElementById('category-timeframe').value) || 60;
    
    if (!name) {
        alert('يرجى إدخال اسم الفئة');
        return;
    }
    
    if (AppState.currentCategoryId) {
        const categoryIndex = AppState.categories.findIndex(c => c.id === AppState.currentCategoryId);
        if (categoryIndex !== -1) {
            AppState.categories[categoryIndex] = {
                ...AppState.categories[categoryIndex],
                name: name,
                color: color,
                timeframeMinutes: timeframeMinutes
            };
            saveCategories();
            renderCategories();
            alert('تم تعديل الفئة بنجاح!');
        }
    } else {
        const newCategory = {
            id: generateId(),
            name: name,
            color: color,
            timeframeMinutes: timeframeMinutes,
            messageEmpty: 'لا توجد مهام في هذه الفئة. أضف مهام جديدة لبدء العمل!',
            messageCompleted: 'ممتاز! لقد أكملت جميع المهام في هذه الفئة.',
            messageExceeded: 'لقد تجاوزت الوقت المخصص لهذه الفئة. حاول إدارة وقتك بشكل أفضل!'
        };
        
        AppState.categories.push(newCategory);
        saveCategories();
        renderCategories();
        alert('تم إضافة الفئة بنجاح!');
    }
    
    closeModal('category-modal');
    document.getElementById('category-name').value = '';
    document.getElementById('category-color').value = '#5a76e8';
    document.getElementById('category-timeframe').value = '60';
}

function deleteCategory(categoryId) {
    const category = AppState.categories.find(c => c.id === categoryId);
    if (!category) return;
    
    const categoryTasks = AppState.tasks.filter(task => task.categoryId === categoryId);
    if (categoryTasks.length > 0) {
        if (!confirm(`هذه الفئة تحتوي على ${categoryTasks.length} مهام. هل تريد حذف الفئة مع جميع المهام المرتبطة بها؟`)) {
            return;
        }
        
        AppState.tasks = AppState.tasks.filter(task => task.categoryId !== categoryId);
        saveTasks();
    } else {
        if (!confirm(`هل أنت متأكد من حذف الفئة: "${category.name}"؟`)) {
            return;
        }
    }
    
    AppState.categories = AppState.categories.filter(c => c.id !== categoryId);
    saveCategories();
    renderCategories();
}

function calculateCategoryStatus(categoryId) {
    const category = AppState.categories.find(c => c.id === categoryId);
    if (!category) return null;
    
    const categoryTasks = AppState.tasks.filter(task => task.categoryId === categoryId);
    
    if (categoryTasks.length === 0) {
        return {
            status: 'empty',
            message: category.messageEmpty || 'لا توجد مهام في هذه الفئة',
            totalTasks: 0,
            completedTasks: 0,
            totalDuration: 0,
            categoryTimeframe: category.timeframeMinutes || 60
        };
    }
    
    const completedTasks = categoryTasks.filter(task => task.completed);
    const totalDuration = categoryTasks.reduce((sum, task) => sum + (task.duration || 0), 0);
    const completedDuration = completedTasks.reduce((sum, task) => sum + (task.duration || 0), 0);
    
    const categoryTimeframeMinutes = category.timeframeMinutes || 60;
    
    if (completedTasks.length === categoryTasks.length) {
        return {
            status: 'completed',
            message: category.messageCompleted || 'جميع المهام مكتملة',
            totalTasks: categoryTasks.length,
            completedTasks: completedTasks.length,
            totalDuration: totalDuration,
            completedDuration: completedDuration,
            categoryTimeframe: categoryTimeframeMinutes
        };
    }
    
    if (totalDuration > categoryTimeframeMinutes) {
        return {
            status: 'exceeded',
            message: category.messageExceeded || 'لقد تجاوزت الوقت المخصص لهذه الفئة',
            totalTasks: categoryTasks.length,
            completedTasks: completedTasks.length,
            totalDuration: totalDuration,
            completedDuration: completedDuration,
            categoryTimeframe: categoryTimeframeMinutes
        };
    }
    
    return {
        status: 'pending',
        message: category.messagePending || 'هناك مهام معلقة في هذه الفئة',
        totalTasks: categoryTasks.length,
        completedTasks: completedTasks.length,
        totalDuration: totalDuration,
        completedDuration: completedDuration,
        categoryTimeframe: categoryTimeframeMinutes
    };
}

function showCategoriesStatusModal() {
    let modalHTML = `
        <div class="modal" id="categories-status-modal">
            <div class="modal-content" style="max-width: 600px;">
                <div class="modal-header">
                    <h3>حالة الفئات</h3>
                    <button class="close-btn" onclick="closeModal('categories-status-modal')">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="categories-status-container">
    `;
    
    AppState.categories.forEach(category => {
        const status = calculateCategoryStatus(category.id);
        if (!status) return;
        
        let statusColor = '#6c757d';
        let statusIcon = 'fas fa-circle';
        
        switch(status.status) {
            case 'empty':
                statusColor = '#6c757d';
                statusIcon = 'fas fa-inbox';
                break;
            case 'completed':
                statusColor = '#4cc9f0';
                statusIcon = 'fas fa-check-circle';
                break;
            case 'exceeded':
                statusColor = '#f72585';
                statusIcon = 'fas fa-exclamation-triangle';
                break;
            case 'pending':
                statusColor = '#f8961e';
                statusIcon = 'fas fa-clock';
                break;
        }
        
        modalHTML += `
            <div class="category-status-card" style="border-right: 4px solid ${statusColor}; margin-bottom: 15px; padding: 15px; background: var(--theme-card); border-radius: 8px;">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <div style="width: 12px; height: 12px; border-radius: 50%; background: ${status.color};"></div>
                        <h4 style="margin: 0; color: var(--theme-text);">${category.name}</h4>
                    </div>
                    <i class="${statusIcon}" style="color: ${statusColor};"></i>
                </div>
                
                <p style="color: ${statusColor}; margin-bottom: 10px; font-weight: 500;">
                    ${status.message}
                </p>
                
                <div style="display: flex; gap: 15px; font-size: 0.85rem; color: var(--gray-color);">
                    <span><i class="fas fa-tasks"></i> ${status.totalTasks} مهام</span>
                    <span><i class="fas fa-check-circle"></i> ${status.completedTasks} مكتملة</span>
                    <span><i class="fas fa-clock"></i> ${status.totalDuration} دقيقة</span>
                    <span><i class="fas fa-hourglass"></i> ${status.categoryTimeframe} دقيقة (حد)</span>
                </div>
            </div>
        `;
    });
    
    modalHTML += `
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="closeModal('categories-status-modal')">إغلاق</button>
                </div>
            </div>
        </div>
    `;
    
    const existingModal = document.getElementById('categories-status-modal');
    if (existingModal) {
        existingModal.remove();
    }
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    document.getElementById('categories-status-modal').classList.add('active');
}

// ========== إدارة الملاحظات ==========
function renderNotes() {
    const container = document.getElementById('notes-list');
    
    if (AppState.notes.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="text-align: center; padding: 60px 20px; color: var(--gray-color);">
                <i class="fas fa-sticky-note" style="font-size: 3rem; margin-bottom: 20px; opacity: 0.3;"></i>
                <h3 style="color: var(--theme-text); margin-bottom: 10px;">لا توجد ملاحظات</h3>
                <p>اضغط على "ملاحظة جديدة" لإنشاء ملاحظتك الأولى</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    
    AppState.notes.forEach(note => {
        let noteContent = note.content || '';
        
        // إصلاح ألوان الملاحظات للثيمات
        if (AppState.currentTheme === 'black') {
            noteContent = noteContent.replace(/class="note-checkbox-text"/g, 
                'class="note-checkbox-text" style="color: #f0f0f0 !important;"');
        }
        
        noteContent = noteContent.replace(/<input type="checkbox"/g, 
            '<input type="checkbox" class="note-checkbox"');
        
        html += `
            <div class="note-card" data-id="${note.id}" onclick="openNoteEditor('${note.id}')" style="cursor: pointer;">
                <div class="note-header">
                    <input type="text" class="note-title" value="${note.title}" 
                           onchange="updateNoteTitle('${note.id}', this.value)"
                           onclick="event.stopPropagation()">
                    <div class="note-date">${formatDate(note.updatedAt)}</div>
                </div>
                
                <div class="note-content" 
                     style="font-family: ${note.fontFamily}; font-size: ${note.fontSize}px; 
                     font-weight: ${note.fontWeight}; font-style: ${note.fontStyle}; 
                     color: ${note.color}; pointer-events: none;">
                    ${noteContent || '<p style="color: var(--theme-text); opacity: 0.7;">انقر لتحرير الملاحظة...</p>'}
                </div>
                
                <div class="note-footer">
                    <div class="note-font">
                        ${note.fontFamily.split(',')[0].replace(/'/g, '')} - ${note.fontSize}px
                    </div>
                    <div class="note-actions">
                        <button class="btn btn-danger btn-sm delete-note-btn" 
                                data-id="${note.id}" 
                                title="حذف"
                                onclick="event.stopPropagation(); deleteNote('${note.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

    document.querySelectorAll('.note-checkbox').forEach(checkbox => {
        checkbox.addEventListener('click', function(e) {
            e.stopPropagation();
            const item = this.closest('.note-checkbox-item');
            if (item) {
                item.classList.toggle('completed');
            }
        });
    });
    
    document.querySelectorAll('.delete-note-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const noteId = e.target.closest('button').dataset.id;
            deleteNote(noteId);
        });
    });

function addNote() {
    const newNote = {
        id: generateId(),
        title: 'ملاحظة جديدة',
        content: '',
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        fontSize: '16',
        fontWeight: 'normal',
        fontStyle: 'normal',
        color: '#000000',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    AppState.notes.push(newNote);
    saveNotes();
    renderNotes();
    
    setTimeout(() => {
        openNoteEditor(newNote.id);
    }, 100);
}

function updateNoteTitle(noteId, newTitle) {
    const note = AppState.notes.find(n => n.id === noteId);
    if (note) {
        note.title = newTitle;
        note.updatedAt = new Date().toISOString();
        saveNotes();
    }
}

function updateNote(noteId, noteData) {
    const noteIndex = AppState.notes.findIndex(n => n.id === noteId);
    if (noteIndex === -1) return;
    
    AppState.notes[noteIndex] = {
        ...AppState.notes[noteIndex],
        ...noteData,
        updatedAt: new Date().toISOString()
    };
    
    saveNotes();
    renderNotes();
}

function deleteNote(noteId) {
    const note = AppState.notes.find(n => n.id === noteId);
    if (!note) return;
    
    if (confirm(`هل أنت متأكد من حذف الملاحظة: "${note.title}"؟`)) {
        AppState.notes = AppState.notes.filter(n => n.id !== noteId);
        saveNotes();
        renderNotes();
    }
}

function openNoteEditor(noteId) {
    const note = AppState.notes.find(n => n.id === noteId);
    if (!note) return;
    
    AppState.currentNoteId = noteId;
    
    document.getElementById('notes-editor-title').value = note.title;
    document.getElementById('notes-font-family').value = note.fontFamily;
    document.getElementById('notes-font-size').value = note.fontSize;
    document.getElementById('notes-font-weight').value = note.fontWeight;
    document.getElementById('notes-font-style').value = note.fontStyle;
    document.getElementById('notes-font-color').value = note.color;
    
    const editor = document.getElementById('notes-editor-content');
    editor.innerHTML = note.content || '';
    editor.style.fontFamily = note.fontFamily;
    editor.style.fontSize = note.fontSize + 'px';
    editor.style.fontWeight = note.fontWeight;
    editor.style.fontStyle = note.fontStyle;
    editor.style.color = note.color;
    
    document.getElementById('notes-editor').classList.add('active');
    
    setTimeout(() => {
        editor.focus();
    }, 100);
}

// إضافة أزرار جديدة في محرر الملاحظات
function setupEnhancedNotesEditor() {
    console.log("🖼️ إعداد محرر ملاحظات متقدم...");
    
    const toolbarLeft = document.querySelector('.notes-toolbar-left');
    if (!toolbarLeft) return;
    
    // إضافة أزرار جديدة بعد أدوات الخط
    const enhancedToolsHTML = `
        <div class="enhanced-tools" style="display: flex; gap: 5px; margin-left: 10px;">
            <button class="btn btn-success btn-sm" id="add-link-btn" title="إضافة رابط">
                <i class="fas fa-link"></i>
            </button>
            <button class="btn btn-info btn-sm" id="add-image-btn" title="إضافة صورة">
                <i class="fas fa-image"></i>
            </button>
            <button class="btn btn-warning btn-sm" id="add-video-btn" title="إضافة فيديو">
                <i class="fas fa-video"></i>
            </button>
            <input type="file" id="image-upload-input" accept="image/*" style="display: none;">
        </div>
    `;
    
    // إضافة الأدوات المحسنة
    toolbarLeft.insertAdjacentHTML('beforeend', enhancedToolsHTML);
    
    // إضافة حدث للرابط
    const addLinkBtn = document.getElementById('add-link-btn');
    if (addLinkBtn) {
        addLinkBtn.addEventListener('click', addLinkToNote);
    }
    
    // إضافة حدث للصورة
    const addImageBtn = document.getElementById('add-image-btn');
    if (addImageBtn) {
        addImageBtn.addEventListener('click', () => {
            document.getElementById('image-upload-input').click();
        });
    }
    
    // إضافة حدث رفع الصورة
    const imageUploadInput = document.getElementById('image-upload-input');
    if (imageUploadInput) {
        imageUploadInput.addEventListener('change', handleImageUpload);
    }
    
    // إضافة حدث للفيديو
    const addVideoBtn = document.getElementById('add-video-btn');
    if (addVideoBtn) {
        addVideoBtn.addEventListener('click', addVideoToNote);
    }
}

// دالة لإضافة رابط
function addLinkToNote() {
    const url = prompt('أدخل رابط URL:', 'https://');
    if (url) {
        const text = prompt('أدخل نص الرابط:', 'رابط');
        if (text) {
            const linkHTML = `<a href="${url}" target="_blank" style="color: var(--theme-primary); text-decoration: underline;">${text}</a>`;
            insertHTMLToEditor(linkHTML);
        }
    }
}

// دالة لإضافة صورة
function handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
        alert('الرجاء اختيار ملف صورة فقط');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const imageHTML = `<div style="margin: 10px 0;">
            <img src="${e.target.result}" alt="صورة مرفوعة" style="max-width: 100%; height: auto; border-radius: 8px; border: 1px solid var(--theme-border);">
            <div style="font-size: 0.8rem; color: var(--gray-color); text-align: center; margin-top: 5px;">
                ${file.name}
            </div>
        </div>`;
        insertHTMLToEditor(imageHTML);
    };
    reader.readAsDataURL(file);
    
    // إعادة تعيين حقل الرفع
    event.target.value = '';
}

// دالة لإضافة فيديو
function addVideoToNote() {
    const url = prompt('أدخل رابط فيديو (YouTube, Vimeo, etc.):', 'https://');
    if (url) {
        const videoHTML = `<div style="margin: 15px 0; text-align: center;">
            <div style="background: var(--theme-bg); padding: 10px; border-radius: 8px; border: 1px solid var(--theme-border);">
                <i class="fas fa-video" style="font-size: 2rem; color: var(--theme-primary); margin-bottom: 10px;"></i>
                <div style="word-break: break-all;">
                    <a href="${url}" target="_blank" style="color: var(--theme-primary);">${url}</a>
                </div>
                <div style="font-size: 0.8rem; color: var(--gray-color); margin-top: 5px;">
                    رابط فيديو
                </div>
            </div>
        </div>`;
        insertHTMLToEditor(videoHTML);
    }
}

// دالة مساعدة لإدخال HTML في المحرر
function insertHTMLToEditor(html) {
    const editor = document.getElementById('notes-editor-content');
    if (!editor) return;
    
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const div = document.createElement('div');
        div.innerHTML = html;
        const frag = document.createDocumentFragment();
        let node;
        while ((node = div.firstChild)) {
            frag.appendChild(node);
        }
        range.insertNode(frag);
        
        // نقل التحديد بعد العنصر المضاف
        range.setStartAfter(frag.lastChild);
        range.setEndAfter(frag.lastChild);
        selection.removeAllRanges();
        selection.addRange(range);
    } else {
        editor.innerHTML += html;
    }
    
    editor.focus();
}

// في دالة openNoteEditor، أضف استدعاء للإعدادات المحسنة
function openNoteEditor(noteId) {
    const note = AppState.notes.find(n => n.id === noteId);
    if (!note) return;
    
    AppState.currentNoteId = noteId;
    
    document.getElementById('notes-editor-title').value = note.title;
    document.getElementById('notes-font-family').value = note.fontFamily;
    document.getElementById('notes-font-size').value = note.fontSize;
    document.getElementById('notes-font-weight').value = note.fontWeight;
    document.getElementById('notes-font-style').value = note.fontStyle;
    document.getElementById('notes-font-color').value = note.color;
    
    const editor = document.getElementById('notes-editor-content');
    editor.innerHTML = note.content || '';
    editor.style.fontFamily = note.fontFamily;
    editor.style.fontSize = note.fontSize + 'px';
    editor.style.fontWeight = note.fontWeight;
    editor.style.fontStyle = note.fontStyle;
    editor.style.color = note.color;
    
    document.getElementById('notes-editor').classList.add('active');
    

    // إعداد الأدوات المحسنة بعد فتح المحرر
    setTimeout(() => {
        setupEnhancedNotesEditor();
    }, 100);
}

function setupNotesEditorEvents() {
    console.log("📝 إعداد أحداث محرر الملاحظات...");
    
    // ✅ إضافة إمكانية تحميل الصور وGIF
    const imageUploadBtn = document.getElementById('image-upload-btn');
    const imageFileInput = document.getElementById('image-file-input');
    
    if (imageUploadBtn && imageFileInput) {
        imageUploadBtn.addEventListener('click', () => {
            imageFileInput.click();
        });
        
        imageFileInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (!file) return;
            
            // السماح بالصور وGIF
            if (!file.type.startsWith('image/')) {
                alert('الرجاء اختيار ملف صورة (JPG, PNG, GIF)');
                return;
            }
            
            const reader = new FileReader();
            reader.onload = function(event) {
                const img = document.createElement('img');
                img.src = event.target.result;
                img.style.maxWidth = '100%';
                img.style.height = 'auto';
                img.style.borderRadius = '8px';
                img.style.margin = '10px 0';
                img.style.border = '1px solid var(--theme-border)';
                
                const editor = document.getElementById('notes-editor-content');
                if (editor) {
                    editor.appendChild(img);
                    editor.appendChild(document.createElement('br'));
                }
            };
            reader.readAsDataURL(file);
            
            // إعادة تعيين الحقل
            e.target.value = '';
        });
    }
    
    // تأكد من وجود العناصر أولاً
    const saveNotesBtn = document.getElementById('save-notes-btn');
    const closeNotesBtn = document.getElementById('close-notes-btn');
    const addCheckboxBtn = document.getElementById('add-checkbox-btn');
    
    if (saveNotesBtn) {
        saveNotesBtn.addEventListener('click', saveNote);
    } else {
        console.error("❌ زر حفظ الملاحظات غير موجود!");
    }
    
    if (closeNotesBtn) {
        closeNotesBtn.addEventListener('click', () => {
            document.getElementById('notes-editor').classList.remove('active');
        });
    }
    
    if (addCheckboxBtn) {
        addCheckboxBtn.addEventListener('click', () => {
            const editor = document.getElementById('notes-editor-content');
            if (!editor) {
                console.error("❌ محرر الملاحظات غير موجود!");
                return;
            }
            
            const checkboxHtml = `<div class="note-checkbox-item"><input type="checkbox" class="note-checkbox"> <span class="note-checkbox-text" contenteditable="true">عنصر جديد</span></div>`;
            
            // حفظ التحديد الحالي
            const selection = window.getSelection();
            if (selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                const div = document.createElement('div');
                div.innerHTML = checkboxHtml;
                const frag = document.createDocumentFragment();
                let node;
                while ((node = div.firstChild)) {
                    frag.appendChild(node);
                }
                range.insertNode(frag);
                
                // نقل التحديد إلى العنصر الجديد
                range.setStartAfter(frag.lastChild);
                range.setEndAfter(frag.lastChild);
                selection.removeAllRanges();
                selection.addRange(range);
            } else {
                // إذا لم يكن هناك تحديد، أضف في النهاية
                editor.innerHTML += checkboxHtml;
            }
        });
    }
    
    // أدوات التنسيق
    document.querySelectorAll('.format-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const command = this.dataset.command;
            document.execCommand(command, false, null);
            this.classList.toggle('active');
        });
    });
    
    // التحكم بالخط
    const fontFamilySelect = document.getElementById('notes-font-family');
    if (fontFamilySelect) {
        fontFamilySelect.addEventListener('change', function() {
            document.execCommand('fontName', false, this.value);
        });
    }
    
    const fontSizeSelect = document.getElementById('notes-font-size');
    if (fontSizeSelect) {
        fontSizeSelect.addEventListener('change', function() {
            document.execCommand('fontSize', false, this.value);
        });
    }
    
    const fontWeightSelect = document.getElementById('notes-font-weight');
    if (fontWeightSelect) {
        fontWeightSelect.addEventListener('change', function() {
            const editor = document.getElementById('notes-editor-content');
            if (editor) {
                editor.style.fontWeight = this.value;
                document.execCommand('styleWithCSS', false, true);
                document.execCommand('bold', false, this.value === 'bold' ? true : false);
            }
        });
    }
    
    const fontStyleSelect = document.getElementById('notes-font-style');
    if (fontStyleSelect) {
        fontStyleSelect.addEventListener('change', function() {
            const editor = document.getElementById('notes-editor-content');
            if (editor) {
                editor.style.fontStyle = this.value;
                document.execCommand('italic', false, this.value === 'italic' ? true : false);
            }
        });
    }
    
    const fontColorInput = document.getElementById('notes-font-color');
    if (fontColorInput) {
        fontColorInput.addEventListener('change', function() {
            document.execCommand('foreColor', false, this.value);
        });
    }
}

function saveNote() {
    if (!AppState.currentNoteId) return;
    
    const title = document.getElementById('notes-editor-title').value;
    const content = document.getElementById('notes-editor-content').innerHTML;
    const fontFamily = document.getElementById('notes-font-family').value;
    const fontSize = document.getElementById('notes-font-size').value;
    const fontWeight = document.getElementById('notes-font-weight').value;
    const fontStyle = document.getElementById('notes-font-style').value;
    const color = document.getElementById('notes-font-color').value;
    
    updateNote(AppState.currentNoteId, {
        title: title,
        content: content,
        fontFamily: fontFamily,
        fontSize: fontSize,
        fontWeight: fontWeight,
        fontStyle: fontStyle,
        color: color
    });
    
    document.getElementById('notes-editor').classList.remove('active');
}

// ========== إدارة الإعدادات ==========
function setupSettingsEvents() {
    console.log("🔧 إعداد أحداث الإعدادات...");
    
    const settingsBtn = document.getElementById('settings-btn');
    if (settingsBtn) {
        settingsBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log("تم النقر على زر الإعدادات");
            
            const popup = document.getElementById('settings-popup');
            if (popup) {
                const isActive = popup.classList.contains('active');
                console.log("حالة النافذة قبل:", isActive ? 'مفتوحة' : 'مغلقة');
                
                popup.classList.toggle('active');
                console.log("حالة النافذة بعد:", popup.classList.contains('active') ? 'مفتوحة' : 'مغلقة');
                
                // منع الإغلاق الفوري
                e.stopPropagation();
            } else {
                console.error("❌ نافذة الإعدادات غير موجودة!");
            }
        });
    } else {
        console.error("❌ زر الإعدادات غير موجود!");
    }
    
    // إغلاق نافذة الإعدادات عند النقر خارجها
    document.addEventListener('click', function(e) {
        const popup = document.getElementById('settings-popup');
        const settingsBtn = document.getElementById('settings-btn');
        
        if (popup && popup.classList.contains('active') && 
            !popup.contains(e.target) && 
            e.target !== settingsBtn && 
            !settingsBtn.contains(e.target)) {
            popup.classList.remove('active');
            console.log("تم إغلاق نافذة الإعدادات");
        }
    });
    
    // إضافة أحداث لخيارات الثيم
    document.querySelectorAll('.theme-option').forEach(option => {
        option.addEventListener('click', function(e) {
            e.stopPropagation();
            const theme = this.dataset.theme;
            console.log("تغيير الثيم إلى:", theme);
            changeTheme(theme);
            
            const popup = document.getElementById('settings-popup');
            if (popup) {
                popup.classList.remove('active');
            }
        });
    });
}

// ========== إعداد تأثيرات المرور على المهام ==========
function setupTaskHoverEffects() {
    // إضافة Tooltip للمهام
    document.querySelectorAll('.task-card:not(.deleted)').forEach(card => {
        card.addEventListener('mouseenter', function(e) {
            const taskId = this.dataset.id;
            const task = AppState.tasks.find(t => t.id === taskId);
            if (!task) return;
            
            showTaskTooltip(e, task);
        });
        
        card.addEventListener('mouseleave', function() {
            hideTooltip();
        });
        
        // عند النقر على البطاقة تفتح نافذة التعديل
        card.addEventListener('click', function(e) {
            // تجنب فتح التعديل عند النقر على الأزرار
            if (!e.target.closest('.task-actions') && !e.target.closest('input[type="checkbox"]')) {
                const taskId = this.dataset.id;
                openEditTaskModal(taskId);
            }
        });
    });
    
    // إضافة Tooltip لمهام الجدول الزمني
    document.querySelectorAll('.calendar-task-card').forEach(card => {
        card.addEventListener('mouseenter', function(e) {
            const taskTitle = this.querySelector('.calendar-task-title')?.textContent;
            const taskMeta = this.querySelector('.calendar-task-meta')?.innerHTML;
            
            showCalendarTooltip(e, taskTitle, taskMeta);
        });
        
        card.addEventListener('mouseleave', function() {
            hideTooltip();
        });
    });
}

function showTaskTooltip(event, task) {
    const category = getCategoryById(task.categoryId);
    
    const tooltipHTML = `
        <div class="task-tooltip" style="
            position: fixed;
            background: var(--theme-card);
            border: 2px solid var(--theme-primary);
            border-radius: 8px;
            padding: 15px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            z-index: 10000;
            max-width: 300px;
            color: var(--theme-text);
            font-family: inherit;
        ">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <strong style="color: var(--theme-primary);">${task.title}</strong>
                <span style="background: ${category.color}; color: white; padding: 2px 8px; border-radius: 12px; font-size: 0.8rem;">
                    ${category.name}
                </span>
            </div>
            
            ${task.description ? `<p style="margin: 10px 0; color: var(--theme-text);">${task.description}</p>` : ''}
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 15px; font-size: 0.9rem;">
                <div>
                    <i class="fas fa-calendar" style="color: var(--gray-color); margin-left: 5px;"></i>
                    <span>${formatDate(task.date)}</span>
                </div>
                <div>
                    <i class="fas fa-clock" style="color: var(--gray-color); margin-left: 5px;"></i>
                    <span>${task.duration} دقيقة</span>
                </div>
                <div>
                    <i class="fas fa-flag" style="color: ${
                        task.priority === 'high' ? '#f72585' : 
                        task.priority === 'medium' ? '#f8961e' : '#4cc9f0'
                    }; margin-left: 5px;"></i>
                    <span>${task.priority === 'high' ? 'عالية' : task.priority === 'medium' ? 'متوسطة' : 'منخفضة'}</span>
                </div>
                <div>
                    <i class="fas ${task.completed ? 'fa-check-circle' : 'fa-clock'}" 
                       style="color: ${task.completed ? 'var(--success-color)' : 'var(--warning-color)'}; margin-left: 5px;"></i>
                    <span>${task.completed ? 'مكتملة' : 'قيد التنفيذ'}</span>
                </div>
            </div>
            
        </div>
    `;
    
    // إضافة الـ Tooltip إلى DOM
    const existingTooltip = document.querySelector('.task-tooltip');
    if (existingTooltip) existingTooltip.remove();
    
    document.body.insertAdjacentHTML('beforeend', tooltipHTML);
    
    // وضع الـ Tooltip بجانب المؤشر
    const tooltip = document.querySelector('.task-tooltip');
    const x = event.clientX + 15;
    const y = event.clientY + 15;
    
    tooltip.style.left = `${x}px`;
    tooltip.style.top = `${y}px`;
}

function showCalendarTooltip(event, title, meta) {
    const tooltipHTML = `
        <div class="calendar-tooltip" style="
            position: fixed;
            background: var(--theme-card);
            border: 2px solid var(--theme-primary);
            border-radius: 8px;
            padding: 12px;
            box-shadow: 0 8px 25px rgba(0,0,0,0.15);
            z-index: 10000;
            max-width: 250px;
            color: var(--theme-text);
            font-family: inherit;
        ">
            <div style="margin-bottom: 8px;">
                <strong style="color: var(--theme-primary);">${title}</strong>
            </div>
            <div style="color: var(--gray-color); font-size: 0.9rem;">
                ${meta}
            </div>
            <div style="margin-top: 10px; text-align: center; color: var(--gray-color); font-size: 0.8rem;">
                <i class="fas fa-mouse-pointer"></i> انقر لفتح التعديل
            </div>
        </div>
    `;
    
    // إضافة الـ Tooltip
    const existingTooltip = document.querySelector('.calendar-tooltip');
    if (existingTooltip) existingTooltip.remove();
    
    document.body.insertAdjacentHTML('beforeend', tooltipHTML);
    
    // وضع الـ Tooltip
    const tooltip = document.querySelector('.calendar-tooltip');
    const x = event.clientX + 15;
    const y = event.clientY + 15;
    
    tooltip.style.left = `${x}px`;
    tooltip.style.top = `${y}px`;
}

function hideTooltip() {
    document.querySelectorAll('.task-tooltip, .calendar-tooltip').forEach(tooltip => {
        tooltip.remove();
    });
}
// ========== النوافذ والتنقل ==========
function openEditTaskModal(taskId) {
    console.log("فتح تعديل المهمة:", taskId);
    
    const task = AppState.tasks.find(t => t.id === taskId);
    if (!task) {
        console.error("المهمة غير موجودة:", taskId);
        return;
    }
    
    AppState.currentTaskId = taskId;
    
    // ✅ تحقق من وجود كل عنصر قبل استخدامه
    const titleInput = document.getElementById('edit-task-title');
    const descriptionInput = document.getElementById('edit-task-description');
    
    if (titleInput) titleInput.value = task.title;
    if (descriptionInput) descriptionInput.value = task.description || '';
    
    // ✅ نفس الشيء لباقي الحقول
    const dateInput = document.getElementById('edit-task-date');
    const timeInput = document.getElementById('edit-task-time');
    const durationInput = document.getElementById('edit-task-duration');
    const priorityInput = document.getElementById('edit-task-priority');
    
    if (dateInput) dateInput.value = task.date || '';
    if (timeInput) timeInput.value = task.time || '';
    if (durationInput) durationInput.value = task.duration || 30;
    if (priorityInput) priorityInput.value = task.priority || 'medium';
    
    // ✅ تحديث فئة المهمة مع التحقق
    const categorySelect = document.getElementById('edit-task-category');
    if (categorySelect) {
        categorySelect.innerHTML = '<option value="">-- اختر الفئة --</option>';
        
        AppState.categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = category.name;
            if (task.categoryId === category.id) {
                option.selected = true;
            }
            categorySelect.appendChild(option);
        });
    } else {
        console.error("❌ عنصر اختيار الفئة غير موجود");
    }
    
    // ✅ التحقق من وجود النافذة قبل فتحها
    const modal = document.getElementById('edit-task-modal');
    if (modal) {
        modal.classList.add('active');
        console.log("تم فتح نافذة تعديل المهمة");
    } else {
        console.error('❌ نافذة تعديل المهمة غير موجودة في DOM');
    }
}

function openAddTaskModal(preselectedCategory = null) {
    console.log("📝 فتح نافذة إضافة مهمة جديدة");
    
    // ✅ التأكد من وجود النافذة أولاً
    let modal = document.getElementById('add-task-modal');
    
    if (!modal) {
        // إنشاء النافذة إذا لم تكن موجودة
        const modalHTML = `
            <div class="modal active" id="add-task-modal">
                <div class="modal-content" style="max-width: 600px;">
                    <!-- محتوى النافذة هنا -->
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        modal = document.getElementById('add-task-modal');
    } else {
        modal.classList.add('active');
    }
    
    const categorySelect = document.getElementById('task-category');
    if (!categorySelect) {
        console.error("❌ عنصر اختيار الفئة غير موجود!");
        return;
    }
    
    // تفريغ وإعادة تعبئة القائمة
    categorySelect.innerHTML = '<option value="">-- اختر الفئة --</option>';
    
    AppState.categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.id;
        option.textContent = category.name;
        if (preselectedCategory === category.id) {
            option.selected = true;
        }
        categorySelect.appendChild(option);
    });
    
    // تعيين التاريخ لليوم الحالي
    const today = new Date().toISOString().split('T')[0];
    const dateInput = document.getElementById('task-date');
    if (dateInput) {
        dateInput.value = today;
        dateInput.min = today; // يمكنك إزالة هذا السطر إذا أردت التواريخ السابقة
    }
    
    // فتح النافذة
    document.getElementById('add-task-modal').classList.add('active');
    
    // التركيز على حقل العنوان بعد فتح النافذة
    setTimeout(() => {
        const titleInput = document.getElementById('task-title');
        if (titleInput) {
            titleInput.focus();
        }
    }, 150);
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
    }
}

function switchView(viewName) {
    AppState.currentView = viewName;
    
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.view === viewName) {
            item.classList.add('active');
        }
    });
    
    const titles = {
        tasks: 'المهام',
        calendar: 'الجدول الزمني',
        categories: 'الفئات',
        notes: 'الملاحظات'
    };
    document.getElementById('page-title').textContent = titles[viewName] || viewName;
    
    document.querySelectorAll('.view').forEach(view => {
        view.classList.remove('active');
    });
    document.getElementById(`${viewName}-view`).classList.add('active');
    
    refreshCurrentView();
}

function setupEventDelegation() {
    console.log("🔗 إعداد Event Delegation...");
    
    // 1. النقر على أي زر في الجسم
    document.body.addEventListener('click', function(e) {
        const target = e.target;
        
        // أزرار الفلاتر
        if (target.classList.contains('filter-btn')) {
            e.preventDefault();
            const filter = target.dataset.filter;
            console.log("تطبيق فلتر:", filter);
            setFilter(filter);
        }
        
        // أزرار التبويبات في الجدول
        if (target.classList.contains('calendar-tab')) {
            e.preventDefault();
            const range = target.dataset.range;
            console.log("تغيير عرض الجدول:", range);
            AppState.currentCalendarView = range;
            renderCalendar();
        }
        
        // أزرار التنقل بين الأقسام
        if (target.closest('.nav-item')) {
            e.preventDefault();
            const navItem = target.closest('.nav-item');
            const view = navItem.dataset.view;
            console.log("الانتقال إلى:", view);
            switchView(view);
        }
    });
    
    // 2. النقر على النموذجات (Forms)
    document.body.addEventListener('submit', function(e) {
        e.preventDefault();
        
        if (e.target.id === 'task-form') {
            console.log("حفظ مهمة جديدة");
            saveNewTask();
        }
        
        if (e.target.id === 'edit-task-form') {
            console.log("حفظ تعديل المهمة");
            saveEditedTask();
        }
        
        if (e.target.id === 'category-form') {
            console.log("حفظ الفئة");
            saveCategory();
        }
    });
    
    // 3. أحداث النوافذ المنبثقة
    document.body.addEventListener('click', function(e) {
        // إغلاق النافذة عند النقر على X
        if (e.target.classList.contains('close-btn')) {
            const modal = e.target.closest('.modal');
            if (modal) {
                modal.classList.remove('active');
            }
        }
        
        // إغلاق النافذة عند النقر خارجها
        if (e.target.classList.contains('modal')) {
            e.target.classList.remove('active');
        }
        
        // أزرار النوافذ المنبثقة
        if (e.target.id === 'save-task' || e.target.closest('#save-task')) {
            e.preventDefault();
            saveNewTask();
        }
        
        if (e.target.id === 'save-edit-task' || e.target.closest('#save-edit-task')) {
            e.preventDefault();
            saveEditedTask();
        }
        
        if (e.target.id === 'save-category' || e.target.closest('#save-category')) {
            e.preventDefault();
            saveCategory();
        }
        
        if (e.target.id === 'add-task-btn' || e.target.closest('#add-task-btn')) {
            e.preventDefault();
            openAddTaskModal();
        }
        
        if (e.target.id === 'add-category-btn' || e.target.closest('#add-category-btn')) {
            e.preventDefault();
            openAddCategoryModal();
        }
        
        if (e.target.id === 'add-note-btn' || e.target.closest('#add-note-btn')) {
            e.preventDefault();
            addNote();
        }
    });
}

function setFilter(filterName) {
    AppState.currentFilter = filterName;
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.filter === filterName) {
            btn.classList.add('active');
        }
    });
    renderTasks();
}

// ========== إعداد تأثيرات المرور على المهام والجدول ==========
function setupCalendarHoverEffects() {
    document.querySelectorAll('.calendar-task-card').forEach(card => {
        card.addEventListener('mouseenter', function(e) {
            const taskTitle = this.querySelector('.calendar-task-title')?.textContent;
            const taskMeta = this.querySelector('.calendar-task-meta')?.innerHTML;
            
            showCalendarTooltip(e, taskTitle, taskMeta);
        });
        
        card.addEventListener('mouseleave', function() {
            hideTooltip();
        });
        
        // عند النقر على مهمة في الجدول تفتح نافذة التعديل
        card.addEventListener('click', function(e) {
            // تجنب فتح التعديل عند النقر على أي عنصر داخل البطاقة
            if (!e.target.closest('button')) {
                const taskId = this.dataset.id;
                if (taskId) {
                    openEditTaskModal(taskId);
                }
            }
        });
    });
    
    // إضافة أحداث للمهام اليومية
    document.querySelectorAll('.time-tasks .calendar-task-card').forEach(card => {
        card.addEventListener('click', function(e) {
            const taskId = this.dataset.id;
            if (taskId) {
                openEditTaskModal(taskId);
            }
        });
    });
}

// في دالة renderCalendar، تأكد من إضافة data-id للمهام
function renderCalendar() {
    console.log("📅 عرض الجدول الزمني...");
    
    // ✅ تعريف container أولاً
    const container = document.getElementById('calendar-content');
    const tabs = document.querySelectorAll('.calendar-tab');
    
    // ✅ التحقق من وجود العنصر
    if (!container) {
        console.error("❌ عنصر الجدول الزمني غير موجود!");
        return;
    }
    
    // تحديث التبويبات النشطة
    tabs.forEach(tab => {
        tab.classList.remove('active');
        if (tab.dataset.range === AppState.currentCalendarView) {
            tab.classList.add('active');
        }
    });
    
    if (AppState.currentCalendarView === 'daily') {
        renderDailyCalendar(container);
    } else if (AppState.currentCalendarView === 'weekly') {
        renderWeeklyCalendar(container);
    } else if (AppState.currentCalendarView === 'monthly') {
        renderMonthlyCalendar(container);
    }
    
    // ✅ إضافة أحداث التمرير
    setTimeout(() => {
        setupCalendarHoverEffects();
    }, 100);
}

// تعديل renderDailyCalendar لإضافة data-id
function renderDailyCalendar(container) {
    console.log("📅 عرض الجدول اليومي...");
    
    const date = AppState.currentCalendarDate;
    const dateStr = date.toISOString().split('T')[0];
    const tasksForDay = AppState.tasks.filter(task => task.date === dateStr);
    
    // ترتيب المهام حسب الوقت
    tasksForDay.sort((a, b) => {
        const timeA = a.time ? getTaskTimeInMinutes(a) : 9999;
        const timeB = b.time ? getTaskTimeInMinutes(b) : 9999;
        return timeA - timeB;
    });
    
    let html = `
        <div class="calendar-nav" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <button class="btn btn-secondary btn-sm" onclick="changeCalendarDate(-1)">
                <i class="fas fa-chevron-right"></i> أمس
            </button>
            <h3 style="margin: 0 15px; text-align: center; color: var(--theme-text);">
                ${date.toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </h3>
            <button class="btn btn-secondary btn-sm" onclick="changeCalendarDate(1)">
                غداً <i class="fas fa-chevron-left"></i>
            </button>
        </div>
        <div class="daily-calendar" id="daily-calendar-container" style="max-height: 500px; overflow-y: auto; padding-right: 10px;">
    `;
    
    if (tasksForDay.length === 0) {
        html += `
            <div style="text-align: center; padding: 60px 20px; color: var(--gray-color);">
                <i class="fas fa-calendar-day" style="font-size: 3rem; margin-bottom: 20px; opacity: 0.3;"></i>
                <h3 style="color: var(--theme-text); margin-bottom: 10px;">لا توجد مهام لهذا اليوم</h3>
                <p>اضغط على "إضافة مهمة" لإنشاء مهمة جديدة</p>
            </div>
        `;
    } else {
        // تقسيم اليوم إلى فترات زمنية (24 ساعة)
        for (let hour = 0; hour < 24; hour++) {
            const hourStr = hour.toString().padStart(2, '0') + ':00';
            const nextHourStr = (hour + 1).toString().padStart(2, '0') + ':00';
            
            // المهام في هذه الساعة
            const hourTasks = tasksForDay.filter(task => {
                if (!task.time) return false;
                const taskHour = parseInt(task.time.split(':')[0]);
                return taskHour === hour;
            });
            
            html += `
                <div class="time-slot" data-hour="${hour}">
                    <div class="time-header">
                        <div class="time-title">
                            <i class="fas fa-clock"></i>
                            <span>${hourStr} - ${nextHourStr}</span>
                        </div>
                        <span class="task-count">${hourTasks.length} مهام</span>
                    </div>
                    <div class="time-tasks" id="tasks-hour-${hour}">
            `;
            
            if (hourTasks.length === 0) {
                html += `
                    <div style="text-align: center; padding: 15px; color: var(--gray-color); font-size: 0.9rem;">
                        <i class="fas fa-calendar-check" style="opacity: 0.3;"></i>
                        <p>لا توجد مهام في هذا الوقت</p>
                    </div>
                `;
            } else {
                hourTasks.forEach(task => {
                    const category = getCategoryById(task.categoryId);
                    const isOverdue = isTaskOverdue(task);
                    
                    html += `
    <div class="calendar-task-card ${task.completed ? 'completed' : ''} ${isOverdue ? 'overdue' : ''}" 
         data-id="${task.id}"
         onclick="openEditTaskModal('${task.id}')"
         style="border-left: 2px solid ${category.color}; 
                cursor: pointer; margin-bottom: 4px; padding: 6px 8px; font-size: 0.8rem; min-height: 45px;"
         title="${task.title}">
        <div class="calendar-task-title" style="font-weight: 500; margin-bottom: 2px; font-size: 0.8rem;">
            <span style="color: ${category.color}; margin-left: 3px; font-size: 0.6rem;">•</span>
            ${task.title.length > 20 ? task.title.substring(0, 20) + '...' : task.title}
        </div>
        <div class="calendar-task-meta" style="display: flex; justify-content: space-between; font-size: 0.7rem; color: var(--gray-color);">
            <span><i class="fas fa-clock"></i> ${task.time || ''}</span>
            <span><i class="fas fa-stopwatch"></i> ${task.duration} د</span>
        </div>
    </div>
`;
                });
            }
            
            html += `
                    </div>
                </div>
            `;
        }
    }
    
    html += '</div>';
    container.innerHTML = html;
    
    // إضافة أحداث التمرير والتفاعل
setTimeout(() => {
    setupCalendarTooltips();
}, 100);

// دالة جديدة للتمرير في الجدول
function setupCalendarScroll() {
    const calendarContainer = document.getElementById('daily-calendar-container');
    if (calendarContainer) {
        // التمرير السلس
        let isScrolling = false;
        
        calendarContainer.addEventListener('wheel', (e) => {
            if (!isScrolling) {
                isScrolling = true;
                
                // حساب مقدار التمرير
                const scrollAmount = e.deltaY > 0 ? 100 : -100;
                calendarContainer.scrollBy({
                    top: scrollAmount,
                    behavior: 'smooth'
                });
                
                setTimeout(() => {
                    isScrolling = false;
                }, 200);
            }
            e.preventDefault();
        });
    }
        // إضافة الأزرار إذا لم تكن موجودة
        if (!document.getElementById('scroll-up-btn')) {
            document.body.insertAdjacentHTML('beforeend', navHTML);
            
            document.getElementById('scroll-up-btn').addEventListener('click', () => {
                calendarContainer.scrollBy({ top: -200, behavior: 'smooth' });
            });
            
            document.getElementById('scroll-down-btn').addEventListener('click', () => {
                calendarContainer.scrollBy({ top: 200, behavior: 'smooth' });
            });
        }
    }
}
// نفس التعديل لـ renderWeeklyCalendar و renderMonthlyCalendar// ========== تهيئة الصفحة ==========
// ========== تهيئة الصفحة ==========
function initializePage() {
    console.log("🚀 بدء تهيئة الصفحة...");
    
    // اختبار وجود العناصر الأساسية
    checkDOMElements();
    
    // تهيئة البيانات
    initializeData();
    
    // تهيئة الثيمات
    initializeThemes();
    
    // ✅ إعداد Event Delegation أولاً
    setupEventDelegation();
    
    // ✅ إعداد الأحداث الأخرى
    setupAllEvents();
    
    // ✅ عرض المهام
    renderTasks();
    
    // ✅ عرض حالة الفئات
    renderCategoriesStatus();
    
    console.log("🎉 التطبيق جاهز للاستخدام!");
}
    
    // التنقل بين الأقسام
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            switchView(this.dataset.view);
        });
    });
    
    // مرشحات المهام
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            setFilter(this.dataset.filter);
        });
    });
    
    // تبويبات الجدول
    document.querySelectorAll('.calendar-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            AppState.currentCalendarView = this.dataset.range;
            renderCalendar();
        });
    });
    
    // زر إضافة مهمة رئيسي
    document.getElementById('add-task-btn').addEventListener('click', () => {
        openAddTaskModal();
    });
    
    // زر إضافة فئة
    document.getElementById('add-category-btn').addEventListener('click', () => {
        openAddCategoryModal();
    });
    
    // زر إضافة ملاحظة
    document.getElementById('add-note-btn').addEventListener('click', () => {
        addNote();
    });
    
    // إغلاق نافذة إضافة مهمة
    const closeTaskModalBtn = document.getElementById('close-task-modal');
    if (closeTaskModalBtn) {
        closeTaskModalBtn.addEventListener('click', () => {
            closeModal('add-task-modal');
        });
    }
    
    // إلغاء إضافة مهمة
    const cancelTaskBtn = document.getElementById('cancel-task');
    if (cancelTaskBtn) {
        cancelTaskBtn.addEventListener('click', () => {
            closeModal('add-task-modal');
        });
    }
    
    // حفظ المهمة الجديدة
    const saveTaskBtn = document.getElementById('save-task');
    if (saveTaskBtn) {
        saveTaskBtn.addEventListener('click', (e) => {
            e.preventDefault();
            saveNewTask();
        });
    }
    
    // إغلاق نافذة تعديل مهمة
    const closeEditTaskModalBtn = document.getElementById('close-edit-task-modal');
    if (closeEditTaskModalBtn) {
        closeEditTaskModalBtn.addEventListener('click', () => {
            closeModal('edit-task-modal');
        });
    }
    
    // إلغاء تعديل مهمة
    const cancelEditTaskBtn = document.getElementById('cancel-edit-task');
    if (cancelEditTaskBtn) {
        cancelEditTaskBtn.addEventListener('click', () => {
            closeModal('edit-task-modal');
        });
    }
    
    // حذف مهمة من نافذة التعديل
    const deleteEditTaskBtn = document.getElementById('delete-edit-task');
    if (deleteEditTaskBtn) {
        deleteEditTaskBtn.addEventListener('click', () => {
            if (AppState.currentTaskId) {
                deleteTask(AppState.currentTaskId);
                closeModal('edit-task-modal');
            }
        });
    }
    
    // حفظ التعديلات على المهمة
    const saveEditTaskBtn = document.getElementById('save-edit-task');
    if (saveEditTaskBtn) {
        saveEditTaskBtn.addEventListener('click', (e) => {
            e.preventDefault();
            saveEditedTask();
        });
    }
    
    // إغلاق نافذة الفئة
    const closeCategoryModalBtn = document.getElementById('close-category-modal');
    if (closeCategoryModalBtn) {
        closeCategoryModalBtn.addEventListener('click', () => {
            closeModal('category-modal');
        });
    }
    
    // إلغاء نافذة الفئة
    const cancelCategoryBtn = document.getElementById('cancel-category');
    if (cancelCategoryBtn) {
        cancelCategoryBtn.addEventListener('click', () => {
            closeModal('category-modal');
        });
    }
    
    // حفظ الفئة
    const saveCategoryBtn = document.getElementById('save-category');
    if (saveCategoryBtn) {
        saveCategoryBtn.addEventListener('click', (e) => {
            e.preventDefault();
            saveCategory();
        });
    }

// ========== إعداد Tooltips للجدول ==========
function setupCalendarTooltips() {
    document.querySelectorAll('.calendar-task-card, .month-task-item').forEach(card => {
        card.addEventListener('mouseenter', function(e) {
            const taskId = this.dataset.id;
            const task = AppState.tasks.find(t => t.id === taskId);
            if (!task) return;
            
            const category = getCategoryById(task.categoryId);
            const tooltipHTML = `
                <div class="calendar-tooltip" style="
                    position: fixed;
                    background: var(--theme-card);
                    border: 2px solid ${category.color};
                    border-radius: 8px;
                    padding: 12px;
                    box-shadow: 0 8px 25px rgba(0,0,0,0.15);
                    z-index: 10000;
                    max-width: 300px;
                    color: var(--theme-text);
                    font-family: inherit;
                ">
                    <div style="margin-bottom: 8px;">
                        <strong style="color: ${category.color}; font-size: 1rem;">${task.title}</strong>
                    </div>
                    <div style="color: var(--gray-color); font-size: 0.9rem;">
                        <div><i class="fas fa-tag"></i> الفئة: ${category.name}</div>
                        <div><i class="fas fa-calendar"></i> التاريخ: ${formatDate(task.date)}</div>
                        <div><i class="fas fa-clock"></i> الوقت: ${task.time || 'بدون وقت'}</div>
                        <div><i class="fas fa-stopwatch"></i> المدة: ${task.duration} دقيقة</div>
                        <div><i class="fas fa-flag"></i> الأولوية: ${task.priority === 'high' ? 'عالية' : task.priority === 'medium' ? 'متوسطة' : 'منخفضة'}</div>
                        ${task.description ? `<div style="margin-top: 8px; border-top: 1px solid var(--theme-border); padding-top: 8px; font-size: 0.85rem;">${task.description}</div>` : ''}
                    </div>
                    <div style="margin-top: 10px; text-align: center; color: var(--theme-primary); font-size: 0.8rem;">
                        <i class="fas fa-mouse-pointer"></i> انقر للتعديل
                    </div>
                </div>
            `;
            
            const existingTooltip = document.querySelector('.calendar-tooltip');
            if (existingTooltip) existingTooltip.remove();
            
            document.body.insertAdjacentHTML('beforeend', tooltipHTML);
            
            const tooltip = document.querySelector('.calendar-tooltip');
            const x = e.clientX + 15;
            const y = e.clientY + 15;
            
            tooltip.style.left = `${x}px`;
            tooltip.style.top = `${y}px`;
        });
        
        card.addEventListener('mouseleave', function() {
            const tooltip = document.querySelector('.calendar-tooltip');
            if (tooltip) tooltip.remove();
        });
    });
}

    
    // إغلاق النوافذ المنبثقة بالضغط خارجها
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            closeModal(e.target.id);
        }
    });
    
    // عرض المهام
    renderTasks();
    
    setupTaskButtonsEvents(); // أضف هذا السطر
     setupSettingsEvents();
    console.log("✅ التطبيق جاهز للاستخدام!");


// ========== إعداد جميع الأحداث ==========
function setupAllEvents() {
    console.log("🔗 إعداد جميع الأحداث...");
    
    // استخدام Event Delegation بدلاً من ربط أحداث مباشرة
    setupEventDelegation();
    
    // أحداث خاصة لا تعمل مع Event Delegation
    const addTaskBtn = document.getElementById('add-task-btn');
    if (addTaskBtn) {
        addTaskBtn.addEventListener('click', () => {
            console.log("فتح نافذة إضافة مهمة");
            openAddTaskModal();
        });
    }
    
    // إعداد أحداث الإعدادات
    setupSettingsEvents();
    
    // إعداد أحداث محرر الملاحظات
    setupNotesEditorEvents();
    
    console.log("✅ تم إعداد جميع الأحداث بنجاح");
}

// ========== فحص عناصر DOM ==========
function checkDOMElements() {
    console.log("🔍 فحص عناصر DOM...");
    
    const requiredElements = [
        'tasks-view',
        'calendar-view',
        'categories-view',
        'notes-view',
        'tasks-list',
        'calendar-content',
        'categories-list',
        'notes-list',
        'add-task-modal',
        'edit-task-modal',
        'category-modal'
    ];
    
    let missingElements = [];
    
    requiredElements.forEach(id => {
        if (!document.getElementById(id)) {
            missingElements.push(id);
            console.error(`❌ العنصر #${id} غير موجود في DOM`);
        }
    });
    
    if (missingElements.length > 0) {
        console.error(`❌ ${missingElements.length} عناصر مفقودة:`, missingElements);
        alert(`⚠️ هناك مشكلة في تحميل الصفحة. يرجى تحديثها.\nالعناصر المفقودة: ${missingElements.join(', ')}`);
    } else {
        console.log("✅ جميع عناصر DOM موجودة");
    }
}

function saveNewTask() {
    console.log("💾 حفظ مهمة جديدة...");
    
    const titleInput = document.getElementById('task-title');
    const categorySelect = document.getElementById('task-category');
    
    if (!titleInput || !categorySelect) {
        console.error('عناصر النموذج غير موجودة');
        alert('خطأ: النموذج غير مكتمل');
        return;
    }
    
    const title = titleInput.value.trim();
    const category = categorySelect.value;
    
    if (!title) {
        alert('يرجى إدخال عنوان المهمة');
        titleInput.focus();
        return;
    }
    
    if (!category) {
        alert('يرجى اختيار فئة للمهمة');
        categorySelect.focus();
        return;
    }
    
    // ✅ استخدام querySelector للحصول على العناصر بشكل موثوق
    const descriptionTextarea = document.querySelector('#task-description');
    const durationInput = document.querySelector('#task-duration');
    const dateInput = document.querySelector('#task-date');
    const timeInput = document.querySelector('#task-time');
    const prioritySelect = document.querySelector('#task-priority');
    
    console.log("بيانات المهمة:", {
        title,
        category,
        description: descriptionTextarea ? descriptionTextarea.value : '',
        duration: durationInput ? durationInput.value : '30',
        date: dateInput ? dateInput.value : '',
        time: timeInput ? timeInput.value : '',
        priority: prioritySelect ? prioritySelect.value : 'medium'
    });
    
    // استدعاء دالة addTask
    addTask({
        title: title,
        description: descriptionTextarea ? descriptionTextarea.value.trim() : '',
        categoryId: category,
        duration: parseInt(durationInput ? durationInput.value : 30),
        date: dateInput ? dateInput.value : new Date().toISOString().split('T')[0],
        time: timeInput ? timeInput.value : '',
        priority: prioritySelect ? prioritySelect.value : 'medium'
    });
    
    console.log("✅ تم حفظ المهمة بنجاح");
}

function saveEditedTask() {
    if (!AppState.currentTaskId) {
        console.error('لا يوجد معرف للمهمة الحالية');
        return;
    }
    
    const titleInput = document.getElementById('edit-task-title');
    const categorySelect = document.getElementById('edit-task-category');
    
    if (!titleInput || !categorySelect) {
        console.error('عناصر نموذج التعديل غير موجودة');
        return;
    }
    
    const title = titleInput.value.trim();
    const category = categorySelect.value;
    
    if (!title) {
        alert('يرجى إدخال عنوان المهمة');
        return;
    }
    
    if (!category) {
        alert('يرجى اختيار فئة للمهمة');
        return;
    }
    
    const durationInput = document.getElementById('edit-task-duration');
    const dateInput = document.getElementById('edit-task-date');
    const timeInput = document.getElementById('edit-task-time');
    const prioritySelect = document.getElementById('edit-task-priority');
    const descriptionTextarea = document.getElementById('edit-task-description');
    
    updateTask(AppState.currentTaskId, {
        title: title,
        description: descriptionTextarea ? descriptionTextarea.value.trim() : '',
        categoryId: category,
        duration: durationInput ? parseInt(durationInput.value) || 30 : 30,
        date: dateInput ? dateInput.value : new Date().toISOString().split('T')[0],
        time: timeInput ? timeInput.value : '',
        priority: prioritySelect ? prioritySelect.value : 'medium'
    });
}
// ========== إعداد Tooltips للجدول ==========
function setupCalendarTooltips() {
    document.querySelectorAll('.calendar-task-card').forEach(card => {
        card.addEventListener('mouseenter', function(e) {
            const taskId = this.dataset.id;
            const task = AppState.tasks.find(t => t.id === taskId);
            if (!task) return;
            
            const category = getCategoryById(task.categoryId);
            const tooltipHTML = `
                <div class="calendar-tooltip" style="
                    position: fixed;
                    background: var(--theme-card);
                    border: 2px solid ${category.color};
                    border-radius: 8px;
                    padding: 12px;
                    box-shadow: 0 8px 25px rgba(0,0,0,0.15);
                    z-index: 10000;
                    max-width: 300px;
                    color: var(--theme-text);
                    font-family: inherit;
                ">
                    <div style="margin-bottom: 8px;">
                        <strong style="color: ${category.color}; font-size: 1rem;">${task.title}</strong>
                    </div>
                    <div style="color: var(--gray-color); font-size: 0.9rem;">
                        <div><i class="fas fa-tag"></i> الفئة: ${category.name}</div>
                        <div><i class="fas fa-calendar"></i> التاريخ: ${formatDate(task.date)}</div>
                        <div><i class="fas fa-clock"></i> الوقت: ${task.time || 'بدون وقت'}</div>
                        <div><i class="fas fa-stopwatch"></i> المدة: ${task.duration} دقيقة</div>
                        ${task.description ? `<div style="margin-top: 8px; border-top: 1px solid var(--theme-border); padding-top: 8px; font-size: 0.85rem;">${task.description}</div>` : ''}
                    </div>
                </div>
            `;
            
            const existingTooltip = document.querySelector('.calendar-tooltip');
            if (existingTooltip) existingTooltip.remove();
            
            document.body.insertAdjacentHTML('beforeend', tooltipHTML);
            
            const tooltip = document.querySelector('.calendar-tooltip');
            const x = e.clientX + 15;
            const y = e.clientY + 15;
            
            tooltip.style.left = `${x}px`;
            tooltip.style.top = `${y}px`;
        });
        
        card.addEventListener('mouseleave', function() {
            const tooltip = document.querySelector('.calendar-tooltip');
            if (tooltip) tooltip.remove();
        });
    });
}

// ========== التهيئة ==========
window.addEventListener('load', function() {
    console.log("📄 الصفحة محملة");
    checkCSS();
    
    setTimeout(() => {
        const warning = document.getElementById('css-warning');
        if (warning) warning.remove();
    }, 5000);
});

window.addEventListener('DOMContentLoaded', function() {
    console.log("📄 DOM محمل");
    initializePage();
    
    document.addEventListener('click', function(e) {
        const popup = document.getElementById('settings-popup');
        const settingsBtn = document.getElementById('settings-btn');
        
        if (popup && popup.classList.contains('active') && 
            !popup.contains(e.target) && 
            e.target !== settingsBtn && 
            !settingsBtn.contains(e.target)) {
            popup.classList.remove('active');
        }
    });
});
// ========== التهيئة عند تحميل الصفحة ==========
// ========== التهيئة عند تحميل الصفحة ==========
window.addEventListener('DOMContentLoaded', function() {
    console.log("📄 DOMContentLoaded - بدء التهيئة");
    
    // ✅ فحص CSS
    checkCSS();
    
    // ✅ فحص عناصر DOM
    checkDOMElements();
    
    // ✅ تهيئة التطبيق مع معالجة الأخطاء
    setTimeout(() => {
        try {
            initializePage();
        } catch (error) {
            console.error("❌ خطأ في تهيئة الصفحة:", error);
            alert("حدث خطأ في تحميل التطبيق. يرجى تحديث الصفحة.");
        }
    }, 200);
    
    // ✅ إزالة رسالة التحذير بعد 5 ثواني
    setTimeout(() => {
        const warning = document.getElementById('css-warning');
        if (warning) warning.remove();
    }, 5000);
});
function testAddTaskForm() {
    console.log("🔍 اختبار نموذج إضافة المهمة:");
    
    // التحقق من وجود جميع العناصر
    const elements = [
        'task-title', 'task-category', 'task-date', 
        'task-time', 'task-duration', 'task-priority', 
        'task-description', 'save-task'
    ];
    
    elements.forEach(id => {
        const el = document.getElementById(id);
        console.log(`${id}:`, el ? 'موجود ✓' : 'مفقود ✗');
    });
    
    // فتح النافذة وملئها ببيانات تجريبية
    openAddTaskModal();
    
    setTimeout(() => {
        document.getElementById('task-title').value = 'مهمة اختبار';
        document.getElementById('task-description').value = 'هذه مهمة اختبار';
        console.log("✅ تم تعيين بيانات الاختبار");
    }, 200);
}

// يمكنك استدعاء هذه الدالة من وحدة التحكم للمتصفح
window.addEventListener('load', function() {
    console.log("📄 load - الصفحة محملة بالكامل");
});
// تأكد من وجود هذه الدوال العالمية
window.openEditTaskModal = openEditTaskModal;
window.openAddTaskModal = openAddTaskModal;
window.openEditCategoryModal = openEditCategoryModal;
window.updateNoteTitle = updateNoteTitle;
window.openNoteEditor = openNoteEditor;
window.toggleTaskCompletion = toggleTaskCompletion;
window.closeModal = closeModal;
window.openEditCategoryMessages = openEditCategoryMessages;
window.openEditCategoryModal = openEditCategoryModal;
window.saveCategoryMessages = saveCategoryMessages;
window.saveCategoryEdit = saveCategoryEdit;
window.updateCustomPreview = updateCustomPreview;
window.applyCustomTheme = applyCustomTheme;
window.showCategoriesStatusModal = showCategoriesStatusModal;
window.deleteAndReplaceTask = deleteAndReplaceTask;
window.addTaskAnyway = addTaskAnyway;
window.changeCalendarDate = changeCalendarDate;
window.navigateCalendarWeeks = navigateCalendarWeeks;
window.changeCalendarMonth = changeCalendarMonth;
window.changeCalendarWeek = changeCalendarWeek;
