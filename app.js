// ========== اختبار تحميل CSS ==========
function checkCSS() {
    console.log("🔍 فحص تحميل CSS...");
    const cssCount = document.styleSheets.length;
    console.log("عدد ملفات CSS:", cssCount);
    const rootStyles = getComputedStyle(document. documentElement);
    const themeBg = rootStyles.getPropertyValue('--theme-bg').trim();
    console.log("متغير --theme-bg:", themeBg);
    if (! themeBg || themeBg === 'initial' || themeBg === '') {
        console.error("❌ متغيرات CSS غير محملة!");
        document.body.style.cssText = `background-color: #f8f9fa ! important; color: #212529 !important; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif !important;`;
        const warning = document.createElement('div');
        warning.id = 'css-warning';
        warning.style.cssText = `position: fixed; top: 10px; right: 10px; background: #f8d7da; color: #721c24; padding: 10px 20px; border-radius: 5px; z-index: 99999; font-family: Arial; border: 1px solid #f5c6cb;`;
        warning.innerHTML = '⚠️ مشكلة في تحميل التنسيقات.  الرجاء تحديث الصفحة. ';
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
    currentTheme: 'beige',
    undoStack: [],
    redoStack: []
};

// ========== إدارة البيانات ==========
function initializeData() {
    console.log("تهيئة البيانات...");
    try {
        const savedTasks = localStorage.getItem('mytasks_tasks');
        AppState.tasks = savedTasks ? JSON.parse(savedTasks) : [];
    } catch (e) {
        console.error("خطأ في تحميل المهام:", e);
        AppState.tasks = [];
    }
    try {
        const savedDeleted = localStorage.getItem('mytasks_deleted');
        AppState.deletedTasks = savedDeleted ? JSON.parse(savedDeleted) : [];
    } catch (e) {
        console.error("خطأ في تحميل المهام المحذوفة:", e);
        AppState.deletedTasks = [];
    }
    try {
        const savedCategories = localStorage.getItem('mytasks_categories');
        AppState.categories = savedCategories ? JSON.parse(savedCategories) : [];
        if (! Array.isArray(AppState.categories) || AppState.categories.length === 0) {
            AppState.categories = [
                {
                    id: 'work', name: 'عمل', color: '#5a76e8', timeframeMinutes: 480, timeframeType: 'minutes',
                    messagePending: 'هناك مهام عمل معلقة.  واصل العمل لإنجازها! ',
                    messageCompleted: 'ممتاز! لقد أكملت جميع مهام العمل لهذا اليوم.  استمر في العمل الجيد! ',
                    messageExceeded: 'لقد تجاوزت الوقت المخصص للعمل اليوم. حاول إدارة وقتك بشكل أفضل!'
                },
                {
                    id: 'personal', name: 'شخصي', color: '#4cc9f0', timeframeMinutes:  120, timeframeType: 'minutes',
                    messagePending: 'لا يزال لديك مهام شخصية معلقة. حاول إنجازها قريباً!',
                    messageCompleted: 'رائع! لقد أكملت جميع المهام الشخصية هذا الأسبوع.',
                    messageExceeded:  'لقد تجاوزت الوقت المخصص للمهام الشخصية. حاول التركيز على المهام المهمة!'
                },
                {
                    id: 'study', name: 'دراسة', color: '#f72585', timeframeMinutes:  360, timeframeType: 'minutes',
                    messagePending: 'هناك مهام دراسية تحتاج للإنجاز. ركز على دراستك!',
                    messageCompleted: 'تهانينا! لقد أنجزت جميع المهام الدراسية لهذا الشهر.',
                    messageExceeded: 'لقد تجاوزت الوقت المخصص للدراسة. حاول تنظيم وقتك بشكل أفضل!'
                }
            ];
            saveCategories();
        }
    } catch (e) {
        console.error("خطأ في تحميل الفئات:", e);
        AppState.categories = [
            { id: 'work', name:  'عمل', color:  '#5a76e8', timeframeMinutes: 480,
              messagePending: 'هناك مهام عمل معلقة. واصل العمل! ',
              messageCompleted: 'ممتاز! أكملت جميع مهام العمل! ',
              messageExceeded:  'لقد تجاوزت الوقت المخصص!' },
            { id: 'personal', name: 'شخصي', color: '#4cc9f0', timeframeMinutes: 120,
              messagePending: 'لديك مهام شخصية معلقة! ',
              messageCompleted: 'رائع! أكملت المهام الشخصية! ',
              messageExceeded:  'تجاوزت الحد الزمني!' },
            { id: 'study', name: 'دراسة', color: '#f72585', timeframeMinutes:  360,
              messagePending: 'هناك مهام دراسية معلقة!',
              messageCompleted: 'تهانينا على إنجاز الدراسة!',
              messageExceeded: 'تجاوزت وقت الدراسة!' }
        ];
        saveCategories();
    }
    try {
        const savedNotes = localStorage.getItem('mytasks_notes');
        AppState.notes = savedNotes ? JSON.parse(savedNotes) : [];
    } catch (e) {
        console.error("خطأ في تحميل الملاحظات:", e);
        AppState.notes = [];
    }
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
                description:  'مقابلة مع العملاء الجدد لمناقشة المشروع',
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
                categoryId:  'personal',
                duration:  45,
                date: tomorrowStr,
                time:  '16:00',
                priority: 'low',
                completed: false,
                createdAt: new Date().toISOString()
            },
            {
                id: (Date.now() + 3).toString(),
                title: 'مهمة متأخرة',
                description:  'مهمة يجب أن تكون مكتملة بالأمس',
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
                categoryId:  'study',
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
    if (AppState.notes.length === 0) {
        AppState.notes = [
            {
                id: Date.now().toString(),
                title: 'ملاحظة ترحيبية',
                content: '<div class="note-checkbox-item"><input type="checkbox" class="note-checkbox"> <span class="note-checkbox-text">مراجعة التقرير الشهري</span></div><div class="note-checkbox-item"><input type="checkbox" class="note-checkbox"> <span class="note-checkbox-text">مقابلة العملاء الجدد</span></div>',
                fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
                fontSize: '16',
                fontWeight: 'normal',
                color: '#000000',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }
        ];
        saveNotes();
    }
}

function saveTasks() {
    try { localStorage.setItem('mytasks_tasks', JSON.stringify(AppState.tasks)); }
    catch (e) { console.error("خطأ في حفظ المهام:", e); }
}

function saveDeletedTasks() {
    try { localStorage.setItem('mytasks_deleted', JSON.stringify(AppState.deletedTasks)); }
    catch (e) { console.error("خطأ في حفظ المهام المحذوفة:", e); }
}

function saveCategories() {
    try { localStorage. setItem('mytasks_categories', JSON.stringify(AppState.categories)); }
    catch (e) { console.error("خطأ في حفظ الفئات:", e); }
}

function saveNotes() {
    try { localStorage.setItem('mytasks_notes', JSON.stringify(AppState.notes)); }
    catch (e) { console.error("خطأ في حفظ الملاحظات:", e); }
}

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// ========== وظائف المساعدة ==========
function getCategoryById(categoryId) {
    return AppState.categories.find(cat => cat.id === categoryId) || 
    { name: 'عام', color: '#6c757d', timeframeMinutes: 60 };
}

function isTaskOverdue(task) {
    if (!task. date || task.completed) return false;
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

function getTaskTimeInMinutes(taskOrTime) {
    const timeStr = typeof taskOrTime === 'string' ? taskOrTime : (taskOrTime && taskOrTime.time ?  taskOrTime.time : '');
    if (!timeStr) return 0;
    const [hours, minutes] = timeStr. split(':').map(Number);
    return hours * 60 + (minutes || 0);
}

function refreshCurrentView() {
    if (AppState.currentView === 'tasks') renderTasks();
    else if (AppState.currentView === 'calendar') renderCalendar();
    else if (AppState.currentView === 'categories') renderCategories();
    else if (AppState.currentView === 'notes') renderNotes();
    ensureFilterBar();
}

// ========== إدارة الثيمات ==========
function initializeThemes() {
    console.log("تهيئة الثيمات...");
    loadCustomTheme();
    const savedTheme = localStorage.getItem('mytasks_theme');
    if (savedTheme && AppState.themes.includes(savedTheme)) {
        AppState.currentTheme = savedTheme;
        document.body.className = `theme-${savedTheme}`;
        console.log("تم تحميل الثيم المحفوظ:", savedTheme);
        updateNotesColorsForTheme(savedTheme);
    } else {
        AppState.currentTheme = 'beige';
        document.body.className = 'theme-beige';
        localStorage.setItem('mytasks_theme', 'beige');
        console.log("تم تعيين الثيم الافتراضي:  beige");
        updateNotesColorsForTheme('beige');
    }
    updateThemeButtons();
    setupThemeEvents();
}

function applyCustomTheme() {
    const color1 = document.getElementById('custom-color1')?.value || '#5a76e8';
    const color2 = document.getElementById('custom-color2')?.value || '#3a56d4';
    function adjustColor(color, percent) {
        const num = parseInt(color. slice(1), 16);
        const amt = Math.round(2. 55 * percent);
        const R = Math.min(255, Math.max(0, (num >> 16) + amt));
        const G = Math.min(255, Math.max(0, (num >> 8 & 0x00FF) + amt));
        const B = Math.min(255, Math.max(0, (num & 0x0000FF) + amt));
        return `#${(0x1000000 + (R < 255 ? R < 1 ? 0 : R :  255) * 0x10000 + (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 + (B < 255 ?  B < 1 ? 0 : B : 255)).toString(16).slice(1)}`;
    }
    const lightBg = adjustColor(color1, 30);
    const lightCard = adjustColor(color1, 15);
    const borderColor = adjustColor(color1, 10);
    localStorage.setItem('mytasks_custom_colors', JSON.stringify({ color1, color2, lightBg, lightCard, borderColor }));
    document. documentElement.style.setProperty('--custom-color1', color1);
    document.documentElement.style.setProperty('--custom-color2', color2);
    document.documentElement.style. setProperty('--theme-bg', lightBg);
    document.documentElement.style. setProperty('--theme-card', lightCard);
    document.documentElement.style.setProperty('--theme-border', borderColor);
    document.documentElement.style.setProperty('--theme-primary', color1);
    document.documentElement.style.setProperty('--theme-hover', color2);
    AppState.currentTheme = 'custom';
    document.body.className = 'theme-custom';
    localStorage.setItem('mytasks_theme', 'custom');
    updateThemeButtons();
    refreshCurrentView();
    closeModal('custom-theme-modal');
    alert('تم تطبيق الثيم المخصص بنجاح!');
}

function loadCustomTheme() {
    const customColors = localStorage.getItem('mytasks_custom_colors');
    if (customColors) {
        try {
            const colors = JSON.parse(customColors);
            document.documentElement.style.setProperty('--custom-color1', colors.color1);
            document. documentElement.style.setProperty('--custom-color2', colors. color2);
            document. documentElement.style.setProperty('--theme-bg', colors.lightBg || '#ffffff');
            document.documentElement. style.setProperty('--theme-card', colors.lightCard || '#ffffff');
            document.documentElement.style.setProperty('--theme-border', colors.borderColor || '#dee2e6');
        } catch (e) {
            console.error("خطأ في تحميل ألوان الثيم المخصص:", e);
        }
    }
}

function updateNotesColorsForTheme(theme) {
    console.log("تحديث ألوان الملاحظات للثيم:", theme);
    if (theme === 'black') {
        AppState.notes.forEach(note => {
            if (! note.originalColor) note.originalColor = note.color || '#000000';
            const isDarkColor = isColorDark(note.color || note.originalColor);
            if (isDarkColor) note.color = '#f0f0f0';
        });
    } else {
        AppState.notes.forEach(note => {
            if (note.originalColor) note.color = note.originalColor;
            else note.color = note.color || '#000000';
        });
    }
    saveNotes();
    if (AppState.currentView === 'notes') renderNotes();
}

function isColorDark(color) {
    let r, g, b;
    if (! color) return true;
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
        } else return true;
    } else return true;
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness < 128;
}

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
        if (option.dataset.theme === AppState. currentTheme) option.classList.add('active');
    });
}

function openCustomThemeModal() {
    const modalHTML = `<div class="modal" id="custom-theme-modal">
        <div class="modal-content" style="max-width: 500px;">
            <div class="modal-header">
                <h3>🎨 تخصيص الثيم</h3>
                <button class="close-btn" onclick="closeModal('custom-theme-modal')">&times;</button>
            </div>
            <div class="modal-body">
                <div style="text-align: center; margin-bottom: 20px;">
                    <div class="theme-preview" id="custom-theme-live-preview" style="width: 100px; height: 100px; margin: 0 auto 20px; border-radius: 50%; border: 3px solid var(--theme-border);"></div>
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
    </div>`;
    const existingModal = document.getElementById('custom-theme-modal');
    if (existingModal) existingModal.remove();
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    document.getElementById('custom-theme-modal').classList.add('active');
    setTimeout(updateCustomPreview, 100);
}

function updateCustomPreview() {
    const color1 = document.getElementById('custom-color1')?.value || '#5a76e8';
    const color2 = document.getElementById('custom-color2')?.value || '#3a56d4';
    const preview = document.getElementById('custom-theme-live-preview');
    if (preview) preview.style.background = `linear-gradient(45deg, ${color1}, ${color2})`;
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
    AppState. tasks.push(newTask);
    saveTasks();
    refreshCurrentView();
    closeModal('add-task-modal');
    setTimeout(() => {
        const form = document.getElementById('task-form');
        if (form) form.reset();
        const today = new Date().toISOString().split('T')[0];
        const dateInput = document.getElementById('task-date');
        if (dateInput) dateInput.value = today;
        const durationInput = document.getElementById('task-duration');
        if (durationInput) durationInput.value = '30';
        const prioritySelect = document.getElementById('task-priority');
        if (prioritySelect) prioritySelect.value = 'medium';
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
        priority: taskData. priority || 'medium',
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
            if (confirm('هذه المهمة محذوفة بالفعل.  هل تريد حذفها نهائياً؟')) {
                AppState.deletedTasks.splice(deletedIndex, 1);
                saveDeletedTasks();
                renderTasks();
            }
        }
        return;
    }
    const task = AppState.tasks[taskIndex];
    if (! confirm(`هل أنت متأكد من حذف المهمة:  "${task.title}"؟`)) return;
    AppState.deletedTasks.push({
        ... task,
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
    if (totalDuration <= categoryTimeframeMinutes) return { allowed: true };
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
    const warningHTML = `<div class="modal" id="timeframe-warning-modal">
        <div class="modal-content" style="max-width: 500px;">
            <div class="modal-header">
                <h3>⚠️ الحيز الزمني للفئة ممتلئ</h3>
                <button class="close-btn" onclick="closeModal('timeframe-warning-modal')">&times;</button>
            </div>
            <div class="modal-body">
                <div style="padding: 20px; background: rgba(247, 37, 133, 0.06); border-radius: 8px; margin-bottom: 20px;">
                    <p style="color: var(--danger-color); font-weight: 600; margin-bottom: 10px;">
                        الفئة "${timeframeCheck.categoryName}" قد تجاوزت الحيز الزمني المسموح! 
                    </p>
                    <p style="color: var(--theme-text);">
                        • الوقت الإجمالي المطلوب الآن: ${timeframeCheck. totalDuration} دقيقة<br>
                        • الحد المسموح: ${timeframeCheck.categoryTimeframe} دقيقة<br>
                        • التجاوز: ${timeframeCheck.exceedBy} دقيقة
                    </p>
                </div>
                <h4 style="margin-bottom: 15px; color: var(--theme-text);">هل تريد المتابعة؟</h4>
                <div style="display: flex; flex-direction: column; gap: 10px;">
                    <button class="btn btn-warning" id="add-anyway-btn" style="text-align: right;">
                        <i class="fas fa-plus-circle"></i> إضافة المهمة على أي حال
                    </button>
                    <button class="btn btn-secondary" id="replace-with-completed-btn" style="text-align: right;">
                        <i class="fas fa-exchange-alt"></i> استبدال بمهمة مكتملة
                    </button>
                    <button class="btn btn-danger" id="cancel-add-btn" style="text-align: right;">
                        <i class="fas fa-times"></i> إلغاء الإضافة
                    </button>
                </div>
            </div>
        </div>
    </div>`;
    const existingModal = document. getElementById('timeframe-warning-modal');
    if (existingModal) existingModal.remove();
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
        document.getElementById('replace-with-completed-btn').addEventListener('click', () => {
            const completedTasks = timeframeCheck.categoryTasks. filter(t => t.completed);
            if (completedTasks.length === 0) {
                alert('لا توجد مهام مكتملة للاستبدال.  يمكنك اختيار "إضافة على أي حال" أو إلغاء العملية.');
                return;
            }
            showDeleteReplaceOptions({ categoryTasks: completedTasks, categoryName: timeframeCheck.categoryName }, taskData);
        });
        document.getElementById('cancel-add-btn').addEventListener('click', () => {
            closeModal('timeframe-warning-modal');
            delete window.pendingTaskData;
            delete window.timeframeCheck;
        });
    }, 100);
}

function showDeleteReplaceOptions(timeframeCheck, taskData) {
    const optionsHTML = `<div class="modal" id="delete-replace-modal">
        <div class="modal-content" style="max-width: 600px; max-height: 80vh;">
            <div class="modal-header">
                <h3>اختر مهمة مكتملة للاستبدال</h3>
                <button class="close-btn" onclick="closeModal('delete-replace-modal')">&times;</button>
            </div>
            <div class="modal-body">
                <p style="margin-bottom: 20px; color: var(--theme-text);">
                    اختر مهمة مكتملة من فئة "${timeframeCheck. categoryName}" لحذفها وإضافة المهمة الجديدة: 
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
    </div>`;
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
    if (! tasks || tasks.length === 0) {
        container.innerHTML = `<div style="text-align: center; padding: 40px; color: var(--gray-color);">
            <i class="fas fa-inbox" style="font-size: 2rem; opacity: 0.3; margin-bottom: 15px;"></i>
            <p>لا توجد مهام مناسبة للحذف</p>
        </div>`;
        return;
    }
    let html = '';
    tasks.forEach(task => {
        html += `<div class="task-card" style="margin-bottom: 10px; cursor: pointer;" onclick="deleteAndReplaceTask('${task. id}', window.pendingTaskData)">
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
                <button class="btn btn-danger btn-sm" onclick="event.stopPropagation(); deleteAndReplaceTask('${task. id}', window.pendingTaskData)">
                    <i class="fas fa-trash"></i> حذف واستبدال
                </button>
            </div>
        </div>`;
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
    alert(`تم حذف المهمة القديمة وإضافة المهمة الجديدة "${newTaskData.title}" بنجاح. `);
}

function addTaskAnyway(taskData) {
    const newTask = {
        id: generateId(),
        title: taskData. title,
        description: taskData.description || '',
        categoryId: taskData.categoryId,
        duration: parseInt(taskData. duration) || 30,
        date: taskData.date || new Date().toISOString().split('T')[0],
        time: taskData.time || '',
        priority: taskData.priority || 'medium',
        completed:  false,
        createdAt:  new Date().toISOString(),
        addedAnyway: true
    };
    AppState.tasks.push(newTask);
    saveTasks();
    refreshCurrentView();
    closeModal('add-task-modal');
    const form = document.getElementById('task-form');
    if (form) form.reset();
    delete window.pendingTaskData;
    delete window.timeframeCheck;
    alert(`تمت إضافة المهمة "${taskData.title}" على الرغم من تجاوز الحيز الزمني. `);
}

// ========== عرض المهام ==========
function renderTasks() {
    const container = document.getElementById('tasks-list');
    if (!container) return;
    let tasksToShow = [];
    switch(AppState.currentFilter) {
        case 'pending':
            const pendingTasks = AppState. tasks.filter(task => ! task.completed);
            const overdueTasks = pendingTasks.filter(task => isTaskOverdue(task));
            const normalTasks = pendingTasks. filter(task => !isTaskOverdue(task));
            overdueTasks.sort((a, b) => new Date(a.date) - new Date(b.date));
            normalTasks.sort((a, b) => new Date(a.date) - new Date(b.date));
            tasksToShow = [...overdueTasks, ...normalTasks];
            break;
        case 'completed':
            tasksToShow = AppState.tasks.filter(task => task.completed);
            tasksToShow. sort((a, b) => new Date(b.date) - new Date(a.date));
            break;
        case 'deleted':
            tasksToShow = AppState.deletedTasks;
            break;
        case 'overdue':
            tasksToShow = AppState.tasks.filter(task => isTaskOverdue(task) && !task.completed);
            tasksToShow.sort((a, b) => new Date(a.date) - new Date(b.date));
            break;
        case 'all':
            const completedAll = AppState.tasks.filter(task => task.completed);
            const pendingAll = AppState.tasks. filter(task => !task.completed);
            const overdueAll = pendingAll.filter(task => isTaskOverdue(task));
            const normalAll = pendingAll. filter(task => !isTaskOverdue(task));
            overdueAll.sort((a, b) => new Date(a.date) - new Date(b.date));
            normalAll.sort((a, b) => new Date(a.date) - new Date(b.date));
            completedAll.sort((a, b) => new Date(b.date) - new Date(a.date));
            tasksToShow = [...overdueAll, ... normalAll, ...completedAll];
            break;
    }
    if (tasksToShow.length === 0) {
        let message = 'لا توجد مهام';
        if (AppState.currentFilter === 'pending') message = 'لا توجد مهام نشطة';
        else if (AppState.currentFilter === 'completed') message = 'لا توجد مهام مكتملة';
        else if (AppState.currentFilter === 'deleted') message = 'لا توجد مهام محذوفة';
        else if (AppState.currentFilter === 'overdue') message = 'لا توجد مهام متأخرة';
        container.innerHTML = `<div class="empty-state" style="text-align: center; padding: 60px 20px; color: var(--gray-color);">
            <i class="fas fa-inbox" style="font-size: 3rem; margin-bottom: 20px; opacity: 0.3;"></i>
            <h3 style="color: var(--theme-text); margin-bottom: 10px;">${message}</h3>
            ${AppState.currentFilter === 'pending' ? '<p>اضغط على "إضافة مهمة" لإنشاء مهمتك الأولى</p>' : ''}
        </div>`;
        return;
    }
    let html = '';
    tasksToShow.forEach(task => {
        const category = getCategoryById(task.categoryId);
        const isDeleted = AppState.currentFilter === 'deleted';
        const isOverdue = isTaskOverdue(task) && !task.completed;
        const overdueBadge = isOverdue ? `<div class="overdue-badge-container" style="position: absolute; bottom: 10px; left: 10px;">
            <span class="overdue-badge" style="background: linear-gradient(135deg, #f72585, #b5179e); color: white; padding: 3px 8px; border-radius: 12px; font-size: 0.7rem; display: inline-flex; align-items: center; gap: 4px; box-shadow: 0 2px 4px rgba(247, 37, 133, 0.3);">
                <i class="fas fa-exclamation-circle" style="font-size: 0.6rem;"></i> متأخرة
            </span>
        </div>` : '';
        if (isDeleted) {
            html += `<div class="task-card deleted" data-id="${task.id}">
                <div class="task-content">
                    <div class="task-title" style="color: #999; text-decoration: line-through;">${task.title}</div>
                    ${task.description ? `<div class="task-description" style="color:  #aaa;">${task.description}</div>` : ''}
                    <div class="task-meta">
                        <div class="task-meta-item">
                            <i class="fas fa-tag" style="color: ${category.color}"></i>
                            <span>${category. name}</span>
                        </div>
                        <div class="task-meta-item">
                            <i class="fas fa-calendar"></i>
                            <span>${formatDate(task.date)}</span>
                        </div>
                    </div>
                </div>
                <div class="task-actions">
                    <button class="btn btn-success btn-sm restore-task-btn" data-id="${task. id}" title="استعادة">
                        <i class="fas fa-undo"></i>
                    </button>
                    <button class="btn btn-danger btn-sm permanent-delete-btn" data-id="${task.id}" title="حذف نهائي">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>`;
        } else {
            html += `<div class="task-card ${task.completed ? 'completed' :  ''} ${isOverdue ? 'overdue' : ''}" data-id="${task.id}" style="position: relative;" title="انقر لتعديل المهمة">
                <div style="display: flex; align-items: flex-start; gap: 20px;">
                    <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''} style="margin-top: 5px;">
                    <div class="task-content" style="flex: 1;">
                        <div class="task-title" style="margin-bottom: 5px; padding-right: 10px;">${task.title}</div>
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
                                <i class="fas fa-flag" style="color: ${task.priority === 'high' ? '#f72585' : task.priority === 'medium' ?  '#f8961e' : '#4cc9f0'}"></i>
                                <span>${task.priority === 'high' ? 'عالية' : task.priority === 'medium' ? 'متوسطة' : 'منخفضة'}</span>
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
            </div>`;
        }
    });
    container.innerHTML = html;
    setupTaskHoverEffects();
    setupTaskButtonsEvents();
}

function setupTaskButtonsEvents() {
    document.querySelectorAll('.task-checkbox').forEach(checkbox => {
        if (checkbox._bound) return;
        checkbox._bound = true;
        checkbox.addEventListener('change', (e) => {
            const taskId = e.target.closest('.task-card').dataset.id;
            toggleTaskCompletion(taskId);
        });
    });
    document.querySelectorAll('.task-card: not(.deleted)').forEach(card => {
        if (card._boundClick) return;
        card._boundClick = true;
        card. addEventListener('click', (e) => {
            if (! e.target.closest('.task-actions') && !e.target.closest('input[type="checkbox"]')) {
                const taskId = card.dataset.id;
                openEditTaskModal(taskId);
            }
        });
    });
    document.querySelectorAll('.delete-task-btn').forEach(btn => {
        if (btn._bound) return;
        btn._bound = true;
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const taskId = e.target.closest('button').dataset.id;
            deleteTask(taskId);
        });
    });
    document.querySelectorAll('.edit-task-btn').forEach(btn => {
        if (btn._bound) return;
        btn._bound = true;
        btn. addEventListener('click', (e) => {
            e.stopPropagation();
            const taskId = e.target.closest('button').dataset.id;
            openEditTaskModal(taskId);
        });
    });
    document.querySelectorAll('.restore-task-btn').forEach(btn => {
        if (btn._bound) return;
        btn._bound = true;
        btn. addEventListener('click', (e) => {
            const taskId = e.target.closest('button').dataset.id;
            restoreTask(taskId);
        });
    });
    document.querySelectorAll('.permanent-delete-btn').forEach(btn => {
        if (btn._bound) return;
        btn._bound = true;
        btn. addEventListener('click', (e) => {
            const taskId = e.target.closest('button').dataset.id;
            if (confirm('هل أنت متأكد من الحذف النهائي؟ لا يمكن استعادة المهمة بعد ذلك. ')) {
                const index = AppState.deletedTasks.findIndex(t => t.id === taskId);
                if (index !== -1) {
                    AppState. deletedTasks.splice(index, 1);
                    saveDeletedTasks();
                    renderTasks();
                }
            }
        });
    });
}

// ========== إدارة الفئات ==========
function renderCategories() {
    console.log("🎯 عرض الفئات.. .");
    const container = document. getElementById('categories-list');
    if (!container) {
        console.error("❌ عنصر الفئات غير موجود!");
        return;
    }
    if (AppState.categories.length === 0) {
        container. innerHTML = `<div class="empty-state" style="text-align: center; padding: 60px 20px; color:  var(--gray-color);">
            <i class="fas fa-tags" style="font-size: 3rem; margin-bottom: 20px; opacity: 0.3;"></i>
            <h3 style="color: var(--theme-text); margin-bottom: 10px;">لا توجد فئات</h3>
            <p>اضغط على "فئة جديدة" لإنشاء فئتك الأولى</p>
        </div>`;
        return;
    }
    let html = '';
    AppState.categories.forEach(category => {
        const categoryTasks = AppState.tasks.filter(task => task.categoryId === category.id);
        const overdue = categoryTasks.filter(t => isTaskOverdue(t) && !t.completed);
        const pending = categoryTasks.filter(t => !isTaskOverdue(t) && !t.completed);
        const completed = categoryTasks.filter(t => t.completed);
        const orderedTasks = [...overdue, ...pending, ...completed];
        const totalDuration = categoryTasks.reduce((sum, t) => sum + (t.duration || 0), 0);
        const timeframe = category.timeframeMinutes || 60;
        const progressPercent = timeframe > 0 ? Math.min(100, Math.round((totalDuration / timeframe) * 100)) : 0;
        html += `<div class="category-card" data-id="${category.id}" style="position: relative;">
            <div class="category-card-actions" style="position: absolute; top:10px; left:10px; display:flex; gap:6px; z-index:5;">
                <button class="btn btn-xs btn-danger category-delete-btn" data-id="${category.id}" title="حذف الفئة">
                    <i class="fas fa-trash"></i>
                </button>
                <button class="btn btn-xs btn-secondary category-edit-btn" data-id="${category.id}" title="تعديل الفئة">
                    <i class="fas fa-edit"></i>
                </button>
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                <div class="category-header">
                    <div class="category-color" style="background:  ${category.color}"></div>
                    <div class="category-name">${category. name}</div>
                    <div class="category-stats">${categoryTasks.length} مهام</div>
                </div>
                <button class="btn btn-xs btn-info category-status-btn" onclick="showCategoryStateMessage('${category.id}')" title="رسالة الحالة">
                    <i class="fas fa-info-circle"></i>
                </button>
            </div>
            <div class="category-progress-info">
                <span>استهلاك الحيز: ${progressPercent}%</span>
                <span>الزمن المستخدم: ${totalDuration} / ${timeframe} دقيقة</span>
            </div>
            <div class="category-progress-container" style="background-color: ${category.color}20;">
                <div class="category-progress-bar ${progressPercent === 100 ? 'full' : ''}" style="width: ${progressPercent}%; background:  ${progressPercent === 100 ? 'var(--danger-color)' : category.color};"></div>
            </div>
            <div class="category-tasks-container">
                ${orderedTasks. length === 0 ? `<div style="text-align: center; padding: 20px; color: var(--gray-color);">
                    <i class="fas fa-tasks" style="opacity: 0.3; margin-bottom:  10px;"></i>
                    <p style="margin:  0;">لا توجد مهام في هذه الفئة</p>
                </div>` : ''}
                ${orderedTasks.map(task => {
                    const isOver = isTaskOverdue(task);
                    return `<div class="category-task-item ${task.completed ? 'completed' :  ''}" onclick="openEditTaskModal('${task.id}')">
                        <div class="category-task-title">
                            <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''} onclick="event.stopPropagation(); toggleTaskCompletion('${task.id}')">
                            <span>${task.title}</span>
                        </div>
                        <div class="category-task-meta">
                            <span><i class="fas fa-calendar"></i> ${formatDate(task.date)}</span>
                            <span><i class="fas fa-clock"></i> ${task.duration} دقيقة</span>
                            ${isOver ? '<span style="color: var(--danger-color);"><i class="fas fa-exclamation-circle"></i> متأخرة</span>' :  ''}
                        </div>
                    </div>`;
                }).join('')}
            </div>
        </div>`;
    });
    container.innerHTML = html;
    setTimeout(() => {
        document.querySelectorAll('.category-edit-btn').forEach(btn => {
            btn. addEventListener('click', (e) => {
                e.stopPropagation();
                const id = btn.dataset.id;
                openEditCategoryModal(id);
            });
        });
        document.querySelectorAll('.category-delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = btn.dataset. id;
                if (confirm('هل تريد حذف هذه الفئة وكل المهام المرتبطة بها؟')) {
                    deleteCategory(id);
                }
            });
        });
    }, 50);
    console.log("✅ تم عرض الفئات بنجاح");
}

function showCategoryStateMessage(categoryId) {
    const status = calculateCategoryStatus(categoryId);
    const category = AppState.categories.find(c => c.id === categoryId);
    if (! status || !category) {
        alert('لا توجد بيانات');
        return;
    }
    let message = '';
    if (status.status === 'completed') message = category.messageCompleted || 'جميع المهام مكتملة! ';
    else if (status. status === 'exceeded') message = category.messageExceeded || 'الفئة ممتلئة وهناك مهام غير مكتملة!';
    else if (status.status === 'pending') message = category.messagePending || 'هناك مهام غير مكتملة! ';
    else message = 'لا توجد مهام في الفئة. ';
    alert(message);
}

function calculateCategoryStatus(categoryId) {
    const category = AppState.categories.find(c => c.id === categoryId);
    if (!category) return null;
    const categoryTasks = AppState.tasks. filter(task => task.categoryId === categoryId);
    const totalDuration = categoryTasks.reduce((s, t) => s + (t.duration || 0), 0);
    const completedTasks = categoryTasks. filter(t => t.completed);
    const completedDuration = completedTasks.reduce((s, t) => s + (t.duration || 0), 0);
    const timeframe = category.timeframeMinutes || 60;
    if (categoryTasks.length === 0) {
        return { status: 'empty', message: 'لا توجد مهام في هذه الفئة', totalTasks: 0, completedTasks: 0, totalDuration: 0, categoryTimeframe: timeframe };
    }
    if (completedDuration === totalDuration && totalDuration > 0) {
        return { status: 'completed', message: category.messageCompleted || 'جميع المهام مكتملة', totalTasks: categoryTasks. length, completedTasks: completedTasks.length, totalDuration: totalDuration, completedDuration: completedDuration, categoryTimeframe: timeframe };
    }
    if (totalDuration > timeframe) {
        return { status: 'exceeded', message: category.messageExceeded || 'لقد تجاوزت الوقت المخصص لهذه الفئة', totalTasks: categoryTasks.length, completedTasks: completedTasks.length, totalDuration: totalDuration, completedDuration: completedDuration, categoryTimeframe: timeframe };
    }
    return { status: 'pending', message: category.messagePending || 'هناك مهام معلقة في هذه الفئة', totalTasks: categoryTasks.length, completedTasks: completedTasks.length, totalDuration: totalDuration, completedDuration: completedDuration, categoryTimeframe: timeframe };
}

function deleteCategory(categoryId) {
    AppState.categories = AppState.categories.filter(c => c.id !== categoryId);
    AppState.tasks = AppState.tasks.filter(t => t.categoryId !== categoryId);
    saveCategories();
    saveTasks();
    renderCategories();
}

function openAddCategoryModal() {
    const modalHTML = `<div class="modal" id="add-category-modal">
        <div class="modal-content" style="max-width: 550px;">
            <div class="modal-header">
                <h3>إضافة فئة جديدة</h3>
                <button class="close-btn" onclick="closeModal('add-category-modal')">&times;</button>
            </div>
            <div class="modal-body">
                <form id="add-category-form">
                    <div class="form-group">
                        <label for="new-category-name">اسم الفئة *</label>
                        <input type="text" id="new-category-name" placeholder="أدخل اسم الفئة" required>
                    </div>
                    <div class="form-group">
                        <label for="
