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

// تشغيل فحص CSS بعد تحميل الصفحة
window.addEventListener('load', function() {
    console.log("📄 الصفحة محملة");
    checkCSS();
    
    // إزالة التحذير إذا ظهر
    setTimeout(() => {
        const warning = document.getElementById('css-warning');
        if (warning) warning.remove();
    }, 5000);
});

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
    themes: ['gray', 'black', 'blue', 'beige'],
    currentTheme: 'gray'
};

Date.prototype.getWeekNumber = function() {
    const date = new Date(this.getTime());
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
    const week1 = new Date(date.getFullYear(), 0, 4);
    return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
};

// ========== وظائف المساعدة ==========
function generateId() {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}


// ========== وظائف المساعدة ==========
function getCategoryById(categoryId) {
    return AppState.categories.find(cat => cat.id === categoryId) || 
           { 
               name: 'عام', 
               color: '#6c757d', 
               timeframeMinutes: 30,
               timeframeType: 'minutes',
               messageEmpty: 'لا توجد مهام', 
               messageCompleted: 'جميع المهام مكتملة', 
               messageExceeded: 'تم تجاوز الحيز الزمني'
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
    
 if (typeof renderCategoriesStatus === 'function') {
        renderCategoriesStatus();
    }
}


// ========== إدارة Undo/Redo ==========
const UndoRedoManager = {
    undoStack: [],
    redoStack: [],
    maxStackSize: 50,
    
    saveState(description) {
        const state = {
            tasks: JSON.parse(JSON.stringify(AppState.tasks)),
            notes: JSON.parse(JSON.stringify(AppState.notes)),
            categories: JSON.parse(JSON.stringify(AppState.categories)),
            description: description || 'تغيير',
            timestamp: new Date().toISOString()
        };
        
        this.undoStack.push(state);
        if (this.undoStack.length > this.maxStackSize) {
            this.undoStack.shift();
        }
        
        this.redoStack = [];
        this.updateButtons();
    },
    
    undo() {
        if (this.undoStack.length === 0) return;
        
        const currentState = {
            tasks: JSON.parse(JSON.stringify(AppState.tasks)),
            notes: JSON.parse(JSON.stringify(AppState.notes)),
            categories: JSON.parse(JSON.stringify(AppState.categories)),
            description: 'الحالة الحالية',
            timestamp: new Date().toISOString()
        };
        
        this.redoStack.push(currentState);
        const undoState = this.undoStack.pop();
        
        AppState.tasks = undoState.tasks;
        AppState.notes = undoState.notes;
        AppState.categories = undoState.categories;
        
        saveTasks();
        saveNotes();
        saveCategories();
        
        refreshCurrentView();
        this.updateButtons();
    },
    
    redo() {
        if (this.redoStack.length === 0) return;
        
        const currentState = {
            tasks: JSON.parse(JSON.stringify(AppState.tasks)),
            notes: JSON.parse(JSON.stringify(AppState.notes)),
            categories: JSON.parse(JSON.stringify(AppState.categories)),
            description: 'الحالة الحالية',
            timestamp: new Date().toISOString()
        };
        
        this.undoStack.push(currentState);
        const redoState = this.redoStack.pop();
        
        AppState.tasks = redoState.tasks;
        AppState.notes = redoState.notes;
        AppState.categories = redoState.categories;
        
        saveTasks();
        saveNotes();
        saveCategories();
        
        refreshCurrentView();
        this.updateButtons();
    },
    
    updateButtons() {
        const undoBtn = document.getElementById('undo-btn');
        const redoBtn = document.getElementById('redo-btn');
        
        if (undoBtn) undoBtn.disabled = this.undoStack.length === 0;
        if (redoBtn) redoBtn.disabled = this.redoStack.length === 0;
    }
};

function setupUndoRedoEvents() {
    // إضافة الأزرار في كل صفحة
    document.addEventListener('DOMContentLoaded', () => {
        const views = ['tasks-view', 'calendar-view', 'categories-view', 'notes-view'];
        views.forEach(viewId => {
            const view = document.getElementById(viewId);
            if (view) {
                const undoRedoHTML = `
                    <div class="undo-redo-container" style="display: flex; gap: 10px; justify-content: center; margin: 20px 0;">
                        <button id="undo-btn" class="btn btn-secondary btn-sm">
                            <i class="fas fa-undo"></i> تراجع (Ctrl+Z)
                        </button>
                        <button id="redo-btn" class="btn btn-secondary btn-sm">
                            <i class="fas fa-redo"></i> إعادة (Ctrl+Y)
                        </button>
                    </div>
                `;
                
                if (view.querySelector('.content-area')) {
                    view.querySelector('.content-area').insertAdjacentHTML('beforeend', undoRedoHTML);
                }
            }
        });
        
        // إضافة أحداث
        document.getElementById('undo-btn')?.addEventListener('click', () => UndoRedoManager.undo());
        document.getElementById('redo-btn')?.addEventListener('click', () => UndoRedoManager.redo());
        
        // اختصارات لوحة المفاتيح
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
                e.preventDefault();
                UndoRedoManager.undo();
            }
            if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
                e.preventDefault();
                UndoRedoManager.redo();
            }
        });
    });
}

// ========== الثيم المخصص ==========
function initializeThemes() {
    console.log("تهيئة الثيمات...");
    
    AppState.themes = ['gray', 'black', 'blue', 'beige', 'custom'];
    
    // تحميل الثيم المحفوظ
    const savedTheme = localStorage.getItem('mytasks_theme');
    if (savedTheme && AppState.themes.includes(savedTheme)) {
        AppState.currentTheme = savedTheme;
        document.body.className = `theme-${savedTheme}`;
        console.log("تم تحميل الثيم المحفوظ:", savedTheme);
        
        // إذا كان ثيم مخصص، تحميل الألوان
        if (savedTheme === 'custom') {
            loadCustomTheme();
        }
    } else {
        // تعيين الثيم الافتراضي
        AppState.currentTheme = 'gray';
        document.body.className = 'theme-gray';
        localStorage.setItem('mytasks_theme', 'gray');
    }
    
    // تحديث الأزرار النشطة
    updateThemeButtons();
    
    // إضافة أحداث تغيير الثيم
    setupThemeEvents();
    
    // إعدادات الإعدادات
    setupSettingsEvents();
}

function loadCustomTheme() {
    const customTheme = JSON.parse(localStorage.getItem('mytasks_custom_theme'));
    if (customTheme) {
        document.documentElement.style.setProperty('--theme-bg', customTheme.bgColor);
        document.documentElement.style.setProperty('--theme-sidebar', `linear-gradient(180deg, ${customTheme.sidebarColor1}, ${customTheme.sidebarColor2})`);
        document.documentElement.style.setProperty('--theme-primary', customTheme.primaryColor);
    }
}

// ========== الثيم المخصص المحسّن ==========
function openCustomThemeCreator() {
    // تحميل الثيم المخصص الحالي إن وجد
    const customTheme = JSON.parse(localStorage.getItem('mytasks_custom_theme')) || {
        bgColor: '#ffffff',
        sidebarColor1: '#5a6268',
        sidebarColor2: '#495057',
        primaryColor: '#6c757d'
    };
    
    const modalHTML = `
        <div class="modal" id="custom-theme-modal">
            <div class="modal-content" style="max-width: 500px;">
                <div class="modal-header">
                    <h3><i class="fas fa-palette"></i> إنشاء ثيم مخصص</h3>
                    <button class="close-btn" onclick="closeModal('custom-theme-modal')">&times;</button>
                </div>
                <div class="modal-body">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                        <div class="theme-preview-box" style="background: ${customTheme.bgColor}; border: 2px solid var(--theme-border); border-radius: 12px; padding: 20px; text-align: center;">
                            <div style="font-weight: bold; margin-bottom: 10px;">معاينة</div>
                            <div style="display: flex; height: 100px; border-radius: 8px; overflow: hidden;">
                                <div style="flex: 1; background: ${customTheme.sidebarColor1};"></div>
                                <div style="flex: 3; background: ${customTheme.bgColor}; position: relative;">
                                    <div style="position: absolute; top: 10px; left: 10px; width: 20px; height: 20px; border-radius: 4px; background: ${customTheme.primaryColor};"></div>
                                </div>
                            </div>
                        </div>
                        <div>
                            <p style="color: var(--gray-color); margin-bottom: 15px;">اختر لونين للتدرج في الشريط الجانبي:</p>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="theme-bg-color">لون الخلفية</label>
                        <input type="color" id="theme-bg-color" value="${customTheme.bgColor}">
                    </div>
                    
                    <div class="form-group">
                        <label for="theme-sidebar-color1">لون الشريط الجانبي 1</label>
                        <input type="color" id="theme-sidebar-color1" value="${customTheme.sidebarColor1}">
                    </div>
                    
                    <div class="form-group">
                        <label for="theme-sidebar-color2">لون الشريط الجانبي 2</label>
                        <input type="color" id="theme-sidebar-color2" value="${customTheme.sidebarColor2}">
                        <small style="color: var(--gray-color);">يجب أن يكون مختلفاً عن اللون الأول</small>
                    </div>
                    
                    <div class="form-group">
                        <label for="theme-primary-color">اللون الأساسي</label>
                        <input type="color" id="theme-primary-color" value="${customTheme.primaryColor}">
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="closeModal('custom-theme-modal')">إلغاء</button>
                    <button class="btn btn-primary" onclick="previewCustomTheme()">معاينة</button>
                    <button class="btn btn-success" onclick="saveCustomTheme()">حفظ الثيم</button>
                </div>
            </div>
        </div>
    `;
    
    const existingModal = document.getElementById('custom-theme-modal');
    if (existingModal) existingModal.remove();
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    document.getElementById('custom-theme-modal').classList.add('active');
    
    // إضافة حدث تحديث المعاينة عند تغيير الألوان
    document.querySelectorAll('#custom-theme-modal input[type="color"]').forEach(input => {
        input.addEventListener('input', previewCustomTheme);
    });
}

function previewCustomTheme() {
    const bgColor = document.getElementById('theme-bg-color').value;
    const sidebarColor1 = document.getElementById('theme-sidebar-color1').value;
    const sidebarColor2 = document.getElementById('theme-sidebar-color2').value;
    const primaryColor = document.getElementById('theme-primary-color').value;
    
    const previewBox = document.querySelector('.theme-preview-box');
    if (previewBox) {
        previewBox.style.background = bgColor;
        const sidebar = previewBox.querySelector('div > div > div:first-child');
        const mainArea = previewBox.querySelector('div > div > div:last-child');
        const primaryElement = previewBox.querySelector('div > div > div:last-child > div');
        
        if (sidebar) sidebar.style.background = sidebarColor1;
        if (mainArea) mainArea.style.background = bgColor;
        if (primaryElement) primaryElement.style.background = primaryColor;
    }
}

function saveCustomTheme() {
    const customTheme = {
        bgColor: document.getElementById('theme-bg-color').value,
        sidebarColor1: document.getElementById('theme-sidebar-color1').value,
        sidebarColor2: document.getElementById('theme-sidebar-color2').value,
        primaryColor: document.getElementById('theme-primary-color').value
    };
    
    localStorage.setItem('mytasks_custom_theme', JSON.stringify(customTheme));
    localStorage.setItem('mytasks_theme', 'custom');
    
    AppState.currentTheme = 'custom';
    document.body.className = 'theme-custom';
    
    // تطبيق الألوان المخصصة
    document.documentElement.style.setProperty('--theme-bg', customTheme.bgColor);
    document.documentElement.style.setProperty('--theme-sidebar', `linear-gradient(180deg, ${customTheme.sidebarColor1}, ${customTheme.sidebarColor2})`);
    document.documentElement.style.setProperty('--theme-primary', customTheme.primaryColor);
    
    closeModal('custom-theme-modal');
    updateThemeButtons();
}

// دالة جديدة لتحديث ألوان الملاحظات بناءً على الثيم
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
                note.color = '#f0f0f0'; // لون فاتح للقراءة
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

// دالة مساعدة للتحقق إذا كان اللون داكناً
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
            return true; // إذا كان هناك خطأ، نعتبره داكن
        }
    } else {
        return true; // إذا لم يكن لوناً معروفاً، نعتبره داكن
    }
    
    // حساب السطوع (Brightness)
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    
    // إذا كان السطوع أقل من 128 فهو داكن
    return brightness < 128;
}

// دالة لتغيير الثيم
function changeTheme(theme) {
    AppState.currentTheme = theme;
    document.body.className = `theme-${theme}`;
    localStorage.setItem('mytasks_theme', theme);
    
    // تحديث ألوان الملاحظات للثيم الجديد
    updateNotesColorsForTheme(theme);
    
    updateThemeButtons();
    refreshCurrentView();
}

// دالة جديدة للإعدادات
function setupSettingsEvents() {
    // زر الإعدادات
    const settingsBtn = document.getElementById('settings-btn');
    if (settingsBtn) {
        settingsBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            const popup = document.getElementById('settings-popup');
            if (popup) {
                popup.classList.toggle('active');
            }
        });
    }
    
    // إغلاق النافذة عند النقر خارجها
    document.addEventListener('click', function(e) {
        const popup = document.getElementById('settings-popup');
        if (popup && !popup.contains(e.target) && e.target.id !== 'settings-btn') {
            popup.classList.remove('active');
        }
    });
}

// دالة منفصلة لتحديث أزرار الثيم
function updateThemeButtons() {
    document.querySelectorAll('.theme-option').forEach(option => {
        option.classList.remove('active');
        if (option.dataset.theme === AppState.currentTheme) {
            option.classList.add('active');
        }
    });
}

// دالة منفصلة لإعداد أحداث الثيم
function setupThemeEvents() {
    document.querySelectorAll('.theme-option').forEach(option => {
        option.addEventListener('click', function() {
            const theme = this.dataset.theme;
            changeTheme(theme);
        });
    });
}

// دالة لتغيير الثيم
function changeTheme(theme) {
    AppState.currentTheme = theme;
    document.body.className = `theme-${theme}`;
    localStorage.setItem('mytasks_theme', theme);
    
    updateThemeButtons();
    refreshCurrentView();
    updateNotesTextColorForTheme();
}

// تحديث ألوان النص في الملاحظات بناءً على الثيم
function updateNotesTextColorForTheme() {
    // إذا كان الثيم أسود، نجعل لون النص فاتح
    if (AppState.currentTheme === 'black') {
        // تحديث جميع الملاحظات
        AppState.notes.forEach(note => {
            if (!note.color || note.color === '#000000' || note.color === '#212529') {
                note.color = '#f0f0f0';
            }
        });
        saveNotes();
    }
}

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
        timeframeMinutes: 480, // 8 ساعات
        timeframeType: 'minutes',
        messageEmpty: 'لا توجد مهام في فئة العمل اليوم. أضف مهام جديدة لبدء العمل!',
        messageCompleted: 'ممتاز! لقد أكملت جميع مهام العمل لهذا اليوم. استمر في العمل الجيد!',
        messageExceeded: 'لقد تجاوزت الوقت المخصص للعمل اليوم. حاول إدارة وقتك بشكل أفضل!'
    },
    { 
        id: 'personal', 
        name: 'شخصي', 
        color: '#4cc9f0',
        timeframeMinutes: 120, // 2 ساعة
        timeframeType: 'minutes',
        messageEmpty: 'لا توجد مهام شخصية هذا الأسبوع. يمكنك إضافة مهام جديدة!',
        messageCompleted: 'رائع! لقد أكملت جميع المهام الشخصية لهذا الأسبوع.',
        messageExceeded: 'لقد تجاوزت الوقت المخصص للمهام الشخصية. حاول التركيز على المهام المهمة!'
    },
    { 
        id: 'study', 
        name: 'دراسة', 
        color: '#f72585',
        timeframeMinutes: 360, // 6 ساعات
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
                color: AppState.currentTheme === 'black' ? '#f0f0f0' : '#000000',
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
                color: AppState.currentTheme === 'black' ? '#f0f0f0' : '#333333',
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

// ========== إضافة مهمة جديدة ==========
function addTask(taskData) {
    console.log("إضافة مهمة:", taskData);
    
    const category = AppState.categories.find(c => c.id === taskData.categoryId);
    if (category && category.timeframeMinutes) {
        const categoryTasks = AppState.tasks.filter(task => task.categoryId === taskData.categoryId);
        const totalDuration = categoryTasks.reduce((sum, task) => sum + (task.duration || 0), 0);
        
        if (totalDuration + (taskData.duration || 0) > category.timeframeMinutes) {
            if (!confirm(`الحيز الزمني للفئة "${category.name}" ممتلئ (${totalDuration}/${category.timeframeMinutes} دقيقة).\nهل أنت متأكد من إضافة مهمة جديدة؟`)) {
                return;
            }
            
            showCategoryFullOptions(category.id, taskData);
            return;
        }
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
    
    UndoRedoManager.saveState('إضافة مهمة');
    AppState.tasks.push(newTask);
    saveTasks();
    refreshCurrentView();
    
    closeModal('add-task-modal');
    document.getElementById('task-form')?.reset();
}

function addTaskAnyway(categoryId, taskData) {
    addTask(taskData);
    closeModal('category-full-modal');
}


function replaceCompletedTask(categoryId, taskData) {
    const completedTasks = AppState.tasks.filter(task => 
        task.categoryId === categoryId && task.completed
    );
    
    if (completedTasks.length > 0) {
        const oldestTask = completedTasks.sort((a, b) => 
            new Date(a.createdAt) - new Date(b.createdAt)
        )[0];
        
        deleteTask(oldestTask.id);
        addTask(taskData);
    } else {
        alert('لا توجد مهام مكتملة في هذه الفئة لاستبدالها.');
    }
    
    closeModal('category-full-modal');
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

function toggleTaskCompletion(taskId) {
    const task = AppState.tasks.find(t => t.id === taskId);
    if (task) {
        task.completed = !task.completed;
        saveTasks();
        refreshCurrentView();
    }
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

function openEditTaskModal(taskId) {
    const task = AppState.tasks.find(t => t.id === taskId);
    if (!task) return;
    
    AppState.currentTaskId = taskId;
    
    document.getElementById('edit-task-title').value = task.title;
    document.getElementById('edit-task-description').value = task.description || '';
    document.getElementById('edit-task-date').value = task.date || '';
    document.getElementById('edit-task-time').value = task.time || '';
    document.getElementById('edit-task-duration').value = task.duration || 30;
    document.getElementById('edit-task-priority').value = task.priority || 'medium';
    
    const categorySelect = document.getElementById('edit-task-category');
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
    
    document.getElementById('edit-task-modal').classList.add('active');
}
function renderTasks() {
    const container = document.getElementById('tasks-list');
    const tasksView = document.getElementById('tasks-view');
    
    // ✅ **التحقق من وجود الحاويات**
    if (!container || !tasksView) {
        console.error('عناصر عرض المهام غير موجودة');
        return;
    }
    
    // تنظيف الحاوية أولاً
    container.innerHTML = '';
    
    // ✅ **إعداد الفلاتر الرئيسية وحالة الفئات**
    if (!tasksView.querySelector('.tasks-filters-container')) {
        console.log('إعداد الفلاتر الرئيسية مع حالة الفئات...');
        setupMainPageFiltersWithStatus();
    }
    
    // تحديث حالة الفئات ديناميكياً
    updateCategoriesStatusInFilters();
    
    let tasksToShow = [];
    
    switch(AppState.currentFilter) {
        case 'pending':
            tasksToShow = AppState.tasks.filter(task => !task.completed);
            break;
        case 'completed':
            tasksToShow = AppState.tasks.filter(task => task.completed);
            break;
        case 'deleted':
            tasksToShow = AppState.deletedTasks;
            break;
        case 'overdue':
            tasksToShow = AppState.tasks.filter(task => isTaskOverdue(task));
            break;
        case 'all':
            tasksToShow = AppState.tasks;
            break;
    }
    
    // ترتيب المهام
    tasksToShow.sort((a, b) => {
        const aOverdue = isTaskOverdue(a);
        const bOverdue = isTaskOverdue(b);
        if (aOverdue && !bOverdue) return -1;
        if (!aOverdue && bOverdue) return 1;
        
        if (a.completed && !b.completed) return 1;
        if (!a.completed && b.completed) return -1;
        
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
            return priorityOrder[a.priority] - priorityOrder[b.priority];
        }
        
        const dateA = a.date ? new Date(a.date) : new Date(0);
        const dateB = b.date ? new Date(b.date) : new Date(0);
        if (dateA < dateB) return -1;
        if (dateA > dateB) return 1;
        
        return 0;
    });
    
    if (tasksToShow.length === 0) {
        let message = 'لا توجد مهام';
        if (AppState.currentFilter === 'pending') message = 'لا توجد مهام نشطة';
        else if (AppState.currentFilter === 'completed') message = 'لا توجد مهام مكتملة';
        else if (AppState.currentFilter === 'deleted') message = 'لا توجد مهام محذوفة';
        else if (AppState.currentFilter === 'overdue') message = 'لا توجد مهام متأخرة';
        
        container.innerHTML = `
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
        const isOverdue = isTaskOverdue(task);
        
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
                     data-id="${task.id}">
                    ${isOverdue ? `
                    <div class="task-overdue-badge" style="position: absolute; top: 10px; left: 10px; background: var(--danger-color); color: white; padding: 3px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: 500;">
                        <i class="fas fa-exclamation-circle"></i> متأخرة
                    </div>
                    ` : ''}
                    <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
                    <div class="task-content">
                        <div class="task-title">${task.title}</div>
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
                                <span>${task.priority === 'high' ? 'عالية' : task.priority === 'medium' ? 'متوسطة' : 'منخفضة'}</span>
                            </div>
                        </div>
                    </div>
                    <div class="task-actions">
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
    
    container.innerHTML = html;
    
    // إضافة الأحداث
    if (AppState.currentFilter === 'deleted') {
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
    } else {
        document.querySelectorAll('.task-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const taskId = e.target.closest('.task-card').dataset.id;
                toggleTaskCompletion(taskId);
            });
        });
        
        document.querySelectorAll('.delete-task-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const taskId = e.target.closest('button').dataset.id;
                deleteTask(taskId);
            });
        });
        
        document.querySelectorAll('.edit-task-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const taskId = e.target.closest('button').dataset.id;
                openEditTaskModal(taskId);
            });
        });
    }
}


// ========== عرض الجدول الزمني ==========
function renderCalendar() {
    const container = document.getElementById('calendar-content');
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



// ========== الجدول اليومي مع الأقسام الزمنية الجديدة ==========
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
            <button class="btn btn-secondary btn-sm prev-day-btn" data-change="-1">
                <i class="fas fa-chevron-right"></i> أمس
            </button>
            <h3 style="margin: 0 15px; text-align: center; color: var(--theme-text);">
                ${date.toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </h3>
            <button class="btn btn-secondary btn-sm next-day-btn" data-change="1">
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
        // الأقسام الزمنية الجديدة
        const timeSlots = [
            { start: '00:00', end: '04:00', label: 'منتصف الليل (12-4 ص)' },
            { start: '04:00', end: '06:00', label: 'الفجر (4-6 ص)' },
            { start: '06:00', end: '12:00', label: 'الصباح (6-12 ص)' },
            { start: '12:00', end: '15:00', label: 'الظهر (12-3 م)' },
            { start: '15:00', end: '18:00', label: 'العصر (3-6 م)' },
            { start: '18:00', end: '19:00', label: 'المغرب (6-7 م)' },
            { start: '19:00', end: '24:00', label: 'العشاء (7-12 م)' }
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
                             style="border-left: 3px solid ${category.color}; 
                                    border-right: 3px solid ${category.color}; 
                                    cursor: pointer; margin-bottom: 8px; padding: 10px; background: var(--theme-card); border-radius: 8px; border: 1px solid var(--theme-border); transition: var(--transition);"
                             onmouseenter="showCalendarTaskTooltip(event, '${task.id}')"
                             onmouseleave="hideCalendarTaskTooltip()"
                             onclick="openEditTaskModal('${task.id}')"
                             title="انقر للتعديل">
                            <div class="calendar-task-title" style="font-weight: 500; margin-bottom: 5px; font-size: 0.9rem; display: flex; align-items: center; gap: 8px;">
                                <span style="color: ${category.color}; font-size: 0.7rem;"><i class="fas fa-circle"></i></span>
                                <span>${task.title.length > 25 ? task.title.substring(0, 25) + '...' : task.title}</span>
                                ${task.completed ? '<span style="color: var(--success-color); font-size: 0.8rem;"><i class="fas fa-check"></i></span>' : ''}
                            </div>
                            <div class="calendar-task-meta" style="display: flex; justify-content: space-between; font-size: 0.8rem; color: var(--gray-color);">
                                <span><i class="fas fa-clock"></i> ${task.time || 'بدون وقت'}</span>
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
    
    // ✅ **إضافة الأحداث بعد إضافة HTML إلى DOM**
    setTimeout(() => {
        setupCalendarTooltips();
        
        // إضافة أحداث لأزرار التنقل
        const prevBtn = container.querySelector('.prev-day-btn');
        const nextBtn = container.querySelector('.next-day-btn');
        
        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                const change = parseInt(prevBtn.dataset.change);
                changeCalendarDate(change);
            });
        }
        
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                const change = parseInt(nextBtn.dataset.change);
                changeCalendarDate(change);
            });
        }
    }, 100);
}

function renderWeeklyCalendar(container) {
    console.log("📅 عرض الجدول الأسبوعي الجديد...");
    
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
    
    for (let i = 0; i < 7; i++) {
        const day = new Date(startOfWeek);
        day.setDate(startOfWeek.getDate() + i);
        const dateStr = day.toISOString().split('T')[0];
        const dayTasks = AppState.tasks.filter(task => task.date === dateStr);
        const isToday = dateStr === new Date().toISOString().split('T')[0];
        
        html += `
            <div class="month-day ${isToday ? 'today' : ''}" 
                 style="background: var(--theme-card); border-radius: 8px; padding: 8px; min-height: 120px; max-height: 150px; border: 1px solid var(--theme-border); overflow-y: auto; position: relative;"
                 data-date="${dateStr}">
                <div class="day-number" style="font-weight: 600; margin-bottom: 8px; color: ${isToday ? 'var(--theme-primary)' : 'var(--theme-text)'}; font-size: 1rem; text-align: center; position: sticky; top: 0; background: var(--theme-card); padding: 4px 0; z-index: 1;">
                    ${day.getDate()}
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
            const tasksToShow = dayTasks.slice(0, 3);
            
            tasksToShow.forEach(task => {
                const category = getCategoryById(task.categoryId);
                const isOverdue = isTaskOverdue(task);
                
                html += `
                    <div class="month-task-item" 
                         data-id="${task.id}"
                         onclick="openEditTaskModal('${task.id}')"
                         style="cursor: pointer; padding: 4px 6px; border-radius: 4px; background: var(--theme-bg); border-right: 2px solid ${category.color}; font-size: 0.7rem;"
                         title="انقر للتعديل">
                        <div style="display: flex; align-items: center; gap: 4px; margin-bottom: 2px;">
                            <span class="monthly-task-dot" style="width: 6px; height: 6px; border-radius: 50%; background: ${category.color}; flex-shrink: 0;"></span>
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
            </div>
        `;
    }
    
    html += '</div>';
    container.innerHTML = html;
    
    setTimeout(() => {
        setupMonthlyCalendarTooltips();
    }, 100);
}


function renderMonthlyCalendar(container) {
    const date = AppState.currentCalendarDate;
    const year = date.getFullYear();
    const month = date.getMonth();
    const today = new Date().toISOString().split('T')[0];
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    const startDay = firstDay.getDay(); // 0 = الأحد
    
    let html = `
        <div class="calendar-nav" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <button class="btn btn-secondary btn-sm" id="prev-month">
                <i class="fas fa-chevron-right"></i> الشهر الماضي
            </button>
            <h3 style="margin: 0 15px; text-align: center; color: var(--theme-text);">
                ${date.toLocaleDateString('ar-SA', { year: 'numeric', month: 'long' })}
            </h3>
            <button class="btn btn-secondary btn-sm" id="next-month">
                الشهر القادم <i class="fas fa-chevron-left"></i>
            </button>
        </div>
        
        <div class="monthly-calendar-grid" style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 8px; background: var(--theme-card); border-radius: 12px; padding: 15px; border: 1px solid var(--theme-border);">
    `;
    
    // رؤوس الأيام
    const dayHeaders = ['أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];
    dayHeaders.forEach(day => {
        html += `
            <div class="month-day-header" 
                 style="text-align: center; font-weight: bold; color: var(--theme-primary); padding: 12px 4px; background: var(--theme-bg); border-radius: 6px; font-size: 0.9rem;">
                ${day}
            </div>
        `;
    });
    
    // أيام فارغة في بداية الشهر
    for (let i = 0; i < startDay; i++) {
        html += '<div class="month-day-empty" style="background: transparent; border: none; min-height: auto; border-radius: 8px;"></div>';
    }
    
    // أيام الشهر
    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
        const dayTasks = AppState.tasks.filter(task => task.date === dateStr);
        const isToday = dateStr === today;
        
        html += `
            <div class="month-day ${isToday ? 'today' : ''}" 
                 style="background: var(--theme-card); border-radius: 8px; padding: 10px; min-height: 120px; border: 1px solid ${isToday ? 'var(--theme-primary)' : 'var(--theme-border)'}; overflow: hidden; position: relative; transition: var(--transition);">
                <div class="day-number" style="font-weight: 600; margin-bottom: 8px; color: ${isToday ? 'var(--theme-primary)' : 'var(--theme-text)'}; font-size: 1rem; text-align: center; position: sticky; top: 0; background: var(--theme-card); padding: 4px 0; z-index: 1;">
                    ${day}
                    ${isToday ? '<span style="font-size: 0.7rem; color: var(--theme-primary);">(اليوم)</span>' : ''}
                </div>
                <div class="month-tasks" style="display: flex; flex-direction: column; gap: 4px; max-height: 80px; overflow-y: auto; padding-right: 2px;">
        `;
        
        if (dayTasks.length === 0) {
            html += `
                <div style="text-align: center; padding: 10px; color: var(--gray-color); font-size: 0.8rem; opacity: 0.5;">
                    <i class="fas fa-calendar-day"></i>
                </div>
            `;
        } else {
            const tasksToShow = dayTasks.slice(0, 3);
            
            tasksToShow.forEach(task => {
                const category = getCategoryById(task.categoryId);
                const isOverdue = isTaskOverdue(task);
                
                html += `
                    <div class="month-task-item" 
                         data-id="${task.id}"
                         onmouseenter="showCalendarTaskTooltip(event, '${task.id}')"
                         onmouseleave="hideCalendarTaskTooltip()"
                         onclick="openEditTaskModal('${task.id}')"
                         style="cursor: pointer; padding: 6px; border-radius: 4px; background: var(--theme-bg); border-left: 3px solid ${category.color}; font-size: 0.75rem; transition: var(--transition);"
                         title="انقر للتعديل">
                        <div style="display: flex; align-items: center; gap: 4px; margin-bottom: 2px;">
                            <span class="monthly-task-dot" style="width: 6px; height: 6px; border-radius: 50%; background: ${category.color}; flex-shrink: 0;"></span>
                            <span style="font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                                ${task.title.length > 15 ? task.title.substring(0, 15) + '...' : task.title}
                            </span>
                        </div>
                        <div style="display: flex; justify-content: space-between; font-size: 0.7rem; color: var(--gray-color);">
                            <span><i class="fas fa-clock" style="font-size: 0.6rem;"></i> ${task.time || ''}</span>
                            ${task.completed ? '<span style="color: var(--success-color);"><i class="fas fa-check" style="font-size: 0.6rem;"></i></span>' : ''}
                            ${isOverdue ? '<span style="color: var(--danger-color);"><i class="fas fa-exclamation-circle" style="font-size: 0.6rem;"></i></span>' : ''}
                        </div>
                    </div>
                `;
            });
            
            if (dayTasks.length > 3) {
                html += `
                    <div style="font-size: 0.7rem; color: var(--theme-primary); cursor: pointer; text-align: center; margin-top: 4px; padding: 2px; border-top: 1px dashed var(--theme-border);"
                         onclick="showAllTasksForDay('${dateStr}')">
                        <i class="fas fa-plus-circle"></i> +${dayTasks.length - 3} أخرى
                    </div>
                `;
            }
        }
        
        html += `
                </div>
            </div>
        `;
    }
    
    html += '</div>';
    container.innerHTML = html;
    
    // إضافة الأحداث للأزرار
    document.getElementById('prev-month')?.addEventListener('click', () => {
        AppState.currentCalendarDate.setMonth(AppState.currentCalendarDate.getMonth() - 1);
        renderCalendar();
    });
    
    document.getElementById('next-month')?.addEventListener('click', () => {
        AppState.currentCalendarDate.setMonth(AppState.currentCalendarDate.getMonth() + 1);
        renderCalendar();
    });
    
    setTimeout(() => {
        setupCalendarTooltips();
    }, 100);
}

// ========== وظائف التلميحات للجدول ==========
function showCalendarTaskTooltip(event, taskId) {
    const task = AppState.tasks.find(t => t.id === taskId);
    if (!task) return;
    
    const category = getCategoryById(task.categoryId);
    const tooltip = document.getElementById('global-tooltip');
    if (!tooltip) return;
    
    const isOverdue = isTaskOverdue(task);
    
    tooltip.innerHTML = `
        <div class="tooltip-title" style="color: ${category.color};">${task.title}</div>
        ${task.description ? `<div class="tooltip-desc" style="margin-bottom: 8px;">${task.description}</div>` : ''}
        <div class="tooltip-meta" style="display: flex; flex-direction: column; gap: 4px;">
            <div><i class="fas fa-tag" style="color: ${category.color}"></i> ${category.name}</div>
            <div><i class="fas fa-calendar"></i> ${formatDate(task.date)}</div>
            <div><i class="fas fa-clock"></i> ${task.time || 'بدون وقت'}</div>
            <div><i class="fas fa-stopwatch"></i> ${task.duration} دقيقة</div>
            <div><i class="fas fa-flag" style="color: ${task.priority === 'high' ? '#f72585' : 
                task.priority === 'medium' ? '#f8961e' : '#4cc9f0'}"></i> 
                ${task.priority === 'high' ? 'عالية' : task.priority === 'medium' ? 'متوسطة' : 'منخفضة'}
            </div>
            ${isOverdue ? '<div style="color: #f72585;"><i class="fas fa-exclamation-circle"></i> متأخرة</div>' : ''}
            ${task.completed ? '<div style="color: #4cc9f0;"><i class="fas fa-check-circle"></i> مكتملة</div>' : ''}
        </div>
        <div class="tooltip-hint" style="margin-top: 8px; color: var(--theme-primary); text-align: center; font-size: 0.8rem;">
            انقر للتعديل
        </div>
    `;
    
    tooltip.style.left = (event.pageX + 15) + 'px';
    tooltip.style.top = (event.pageY + 15) + 'px';
    tooltip.style.display = 'block';
}

function hideCalendarTaskTooltip() {
    const tooltip = document.getElementById('global-tooltip');
    if (tooltip) tooltip.style.display = 'none';
}

function setupCalendarTooltips() {
    document.querySelectorAll('.calendar-task-card, .month-task-item').forEach(card => {
        const taskId = card.dataset.id;
        const task = AppState.tasks.find(t => t.id === taskId) || 
                    AppState.deletedTasks.find(t => t.id === taskId);
        
        if (!task) return;
        
        const category = getCategoryById(task.categoryId);
        
        card.addEventListener('mouseenter', (e) => {
            showCalendarTaskTooltip(e, taskId);
        });
        
        card.addEventListener('mouseleave', () => {
            hideCalendarTaskTooltip();
        });
        
        card.addEventListener('click', () => {
            openEditTaskModal(taskId);
        });
    });
}

function renderCategories() {
    const container = document.getElementById('categories-list');
    
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
        // ترتيب المهام حسب الأهمية: متأخرة -> حالية -> مكتملة
        const categoryTasks = AppState.tasks
            .filter(task => task.categoryId === category.id)
            .sort((a, b) => {
                // أولاً: المهام المتأخرة أولاً
                const aOverdue = isTaskOverdue(a);
                const bOverdue = isTaskOverdue(b);
                if (aOverdue && !bOverdue) return -1;
                if (!aOverdue && bOverdue) return 1;
                
                // ثانياً: المهام غير المكتملة أولاً
                if (!a.completed && b.completed) return -1;
                if (a.completed && !b.completed) return 1;
                
                // ثالثاً: حسب التاريخ والوقت
                const dateA = a.date ? new Date(a.date) : new Date(0);
                const dateB = b.date ? new Date(b.date) : new Date(0);
                if (dateA < dateB) return -1;
                if (dateA > dateB) return 1;
                
                return 0;
            });
        
        const completedTasks = categoryTasks.filter(task => task.completed);
        
        let totalDuration = 0;
        let completedDuration = 0;
        categoryTasks.forEach(task => {
            totalDuration += task.duration || 30;
            if (task.completed) {
                completedDuration += task.duration || 30;
            }
        });
        
        // حساب النسبة بناءً على الحيز الزمني
        const categoryTimeframe = category.timeframeMinutes || 480;
        const progressPercent = Math.min(Math.round((totalDuration / categoryTimeframe) * 100), 100);
        
        html += `
            <div class="category-card" data-id="${category.id}">
                <div class="category-header">
                    <div class="category-color" style="background: ${category.color}" 
                         onclick="event.stopPropagation(); openEditCategoryModal('${category.id}')"
                         title="تعديل لون الفئة"></div>
                    <div class="category-name">${category.name}</div>
                    <div class="category-stats">${totalDuration}/${categoryTimeframe} دقيقة</div>
                    <div class="category-actions">
                        <button class="btn btn-warning btn-xs edit-category-btn" data-id="${category.id}" title="تعديل الفئة">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-danger btn-xs delete-category-btn" data-id="${category.id}" title="حذف الفئة">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                
                <div class="category-progress-info">
                    <span>الحيز: ${progressPercent}%</span>
                    <span>مكتملة: ${completedTasks.length}/${categoryTasks.length}</span>
                </div>
                
                <div class="category-progress-container">
                    <div class="category-progress-bar ${completedDuration >= totalDuration && categoryTasks.length > 0 ? 'completed' : totalDuration === 0 ? 'empty' : ''}" 
                         style="width: ${progressPercent}%; background: ${completedDuration >= totalDuration && categoryTasks.length > 0 ? 'var(--success-color)' : category.color};">
                    </div>
                </div>
                
                <div class="category-tasks-container">
        `;
        
        if (categoryTasks.length === 0) {
            html += `
                <div style="text-align: center; padding: 20px; color: var(--gray-color);">
                    <i class="fas fa-tasks" style="opacity: 0.3;"></i>
                    <p>${category.messageEmpty || 'لا توجد مهام في هذه الفئة'}</p>
                </div>
            `;
        } else {
            categoryTasks.forEach(task => {
                const isOverdue = isTaskOverdue(task);
                
                html += `
                    <div class="category-task-item ${task.completed ? 'completed' : ''} ${isOverdue ? 'overdue' : ''}" 
                         data-id="${task.id}"
                         onclick="openEditTaskModal('${task.id}')">
                        <div class="category-task-title">
                            <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''} onclick="event.stopPropagation(); toggleTaskCompletion('${task.id}')">
                            ${task.title}
                            ${isOverdue ? '<span style="color: #f72585; font-size: 0.7rem; margin-right: 5px;"><i class="fas fa-exclamation-circle"></i></span>' : ''}
                        </div>
                        <div class="category-task-meta">
                            <span><i class="fas fa-calendar"></i> ${formatDate(task.date)}</span>
                            <span><i class="fas fa-clock"></i> ${task.duration} دقيقة</span>
                        </div>
                    </div>
                `;
            });
        }
        
        html += `
                </div>
                
                <button class="btn btn-secondary category-add-task-btn" data-category-id="${category.id}">
                    <i class="fas fa-plus"></i> إضافة مهمة جديدة
                </button>
            </div>
        `;
    });
    
    container.innerHTML = html;
    
    // إضافة الأحداث
    document.querySelectorAll('.category-add-task-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const categoryId = e.target.closest('button').dataset.categoryId;
            openAddTaskModal(categoryId);
        });
    });
    
    document.querySelectorAll('.edit-category-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const categoryId = e.target.closest('button').dataset.id;
            openEditCategoryModal(categoryId);
        });
    });
    
    document.querySelectorAll('.delete-category-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const categoryId = e.target.closest('button').dataset.id;
            deleteCategory(categoryId);
        });
    });
}

// ========== إدارة الفئات ==========
function openAddCategoryModal() {
    AppState.currentCategoryId = null;
    document.getElementById('category-modal-title').textContent = 'إضافة فئة جديدة';
    document.getElementById('category-name').value = '';
    document.getElementById('category-color').value = '#5a76e8';
    document.getElementById('category-timeframe').value = '480';
    document.getElementById('category-message-empty').value = 'لا توجد مهام في هذه الفئة. أضف مهام جديدة لبدء العمل!';
    document.getElementById('category-message-completed').value = 'ممتاز! لقد أكملت جميع المهام في هذه الفئة. استمر في العمل الجيد!';
    document.getElementById('category-message-exceeded').value = 'لقد تجاوزت الوقت المخصص لهذه الفئة. حاول إدارة وقتك بشكل أفضل!';
    
    // إضافة خيارات نوع الحيز الزمني
    const timeframeTypeSelect = document.getElementById('category-timeframe-type');
    if (timeframeTypeSelect) {
        timeframeTypeSelect.value = 'minutes';
    }
    
    document.getElementById('category-modal').classList.add('active');
}

function openEditCategoryModal(categoryId) {
    const category = AppState.categories.find(c => c.id === categoryId);
    if (!category) return;
    
    AppState.currentCategoryId = categoryId;
    document.getElementById('category-modal-title').textContent = 'تعديل الفئة';
    document.getElementById('category-name').value = category.name;
    document.getElementById('category-color').value = category.color;
    document.getElementById('category-timeframe').value = category.timeframeMinutes || 480;
    
    // تعيين نوع الحيز الزمني
    const timeframeTypeSelect = document.getElementById('category-timeframe-type');
    if (timeframeTypeSelect) {
        timeframeTypeSelect.value = category.timeframeType || 'minutes';
    }
    
    document.getElementById('category-message-empty').value = category.messageEmpty || 'لا توجد مهام في هذه الفئة. أضف مهام جديدة لبدء العمل!';
    document.getElementById('category-message-completed').value = category.messageCompleted || 'ممتاز! لقد أكملت جميع المهام في هذه الفئة. استمر في العمل الجيد!';
    document.getElementById('category-message-exceeded').value = category.messageExceeded || 'لقد تجاوزت الوقت المخصص لهذه الفئة. حاول إدارة وقتك بشكل أفضل!';
    
    document.getElementById('category-modal').classList.add('active');
}


function openEditCategoryModal(categoryId) {
    const category = AppState.categories.find(c => c.id === categoryId);
    if (!category) return;
    
    AppState.currentCategoryId = categoryId;
    document.getElementById('category-modal-title').textContent = 'تعديل الفئة';
    document.getElementById('category-name').value = category.name;
    document.getElementById('category-color').value = category.color;
    document.getElementById('category-timeframe').value = category.timeframeMinutes || 60;
    document.getElementById('category-timeframe-type').value = category.timeframeType || 'minutes';
    document.getElementById('category-modal').classList.add('active');
}

function saveCategory() {
    UndoRedoManager.saveState('إضافة/تعديل فئة');
    
    const name = document.getElementById('category-name').value.trim();
    const color = document.getElementById('category-color').value;
    const timeframe = parseInt(document.getElementById('category-timeframe').value) || 480;
    const timeframeType = document.getElementById('category-timeframe-type')?.value || 'minutes';
    
    if (!name) {
        alert('يرجى إدخال اسم الفئة');
        return;
    }
    
    if (AppState.currentCategoryId) {
        // تعديل فئة موجودة
        const categoryIndex = AppState.categories.findIndex(c => c.id === AppState.currentCategoryId);
        if (categoryIndex !== -1) {
            AppState.categories[categoryIndex] = {
                ...AppState.categories[categoryIndex],
                name: name,
                color: color,
                timeframeMinutes: timeframe,
                timeframeType: timeframeType,
                messageEmpty: document.getElementById('category-message-empty').value,
                messageCompleted: document.getElementById('category-message-completed').value,
                messageExceeded: document.getElementById('category-message-exceeded').value
            };
            saveCategories();
            renderCategories();
            alert('تم تعديل الفئة بنجاح!');
        }
    } else {
        // إضافة فئة جديدة
        const newCategory = {
            id: generateId(),
            name: name,
            color: color,
            timeframeMinutes: timeframe,
            timeframeType: timeframeType,
            messageEmpty: document.getElementById('category-message-empty').value,
            messageCompleted: document.getElementById('category-message-completed').value,
            messageExceeded: document.getElementById('category-message-exceeded').value
        };
        
        AppState.categories.push(newCategory);
        saveCategories();
        renderCategories();
        alert('تم إضافة الفئة بنجاح!');
    }
    
    closeModal('category-modal');
}

function deleteCategory(categoryId) {
    const category = AppState.categories.find(c => c.id === categoryId);
    if (!category) return;
    
    // التحقق من وجود مهام مرتبطة بالفئة
    const categoryTasks = AppState.tasks.filter(task => task.categoryId === categoryId);
    if (categoryTasks.length > 0) {
        if (!confirm(`هذه الفئة تحتوي على ${categoryTasks.length} مهام. هل تريد حذف الفئة مع جميع المهام المرتبطة بها؟`)) {
            return;
        }
        
        // حذف جميع المهام المرتبطة بالفئة
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
    
    // تحويل الحيز الزمني إلى دقائق
    let categoryTimeframeMinutes = category.timeframeMinutes || 60;
    if (category.timeframeType === 'hours') {
        categoryTimeframeMinutes *= 60;
    } else if (category.timeframeType === 'days') {
        categoryTimeframeMinutes *= 1440;
    }
    
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

    
function updateCategoriesStatusInFilters() {
    const statusItems = document.querySelectorAll('.category-status-item');
    statusItems.forEach(item => {
        const categoryId = item.dataset.categoryId;
        const status = calculateCategoryStatus(categoryId);
        if (status) {
            const percent = status.totalDuration > 0 ? 
                Math.round((status.completedDuration / status.totalDuration) * 100) : 0;
            
            const statusText = item.querySelector('.category-status-text');
            if (statusText) {
                statusText.textContent = `${percent}%`;
                
                // تحديث اللون حسب الحالة
                if (status.status === 'exceeded') {
                    statusText.style.color = 'var(--danger-color)';
                } else if (status.status === 'completed') {
                    statusText.style.color = 'var(--success-color)';
                } else {
                    statusText.style.color = 'var(--gray-color)';
                }
            }
        }
    });
}

function renderCategoriesStatus() {
    const container = document.querySelector('.content-area');
    if (!container) return;
    
    // إضافة زر الحالات في الصفحة الرئيسية (فقط في عرض المهام)
    if (AppState.currentView === 'tasks') {
        const existingStatusBtn = document.getElementById('categories-status-btn');
        if (existingStatusBtn) {
            existingStatusBtn.remove();
        }
        
        if (AppState.categories.length > 0) {
            const statusBtn = document.createElement('button');
            statusBtn.id = 'categories-status-btn';
            statusBtn.className = 'btn btn-info';
            statusBtn.style.cssText = 'margin-left: 15px; margin-bottom: 20px;';
            statusBtn.innerHTML = '<i class="fas fa-chart-pie"></i> حالة الفئات';
            
            statusBtn.addEventListener('click', showCategoriesStatusModal);
            
            const tasksList = document.getElementById('tasks-view');
            if (tasksList) {
                tasksList.insertBefore(statusBtn, tasksList.firstChild);
            }
        }
    }
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
                        <div style="width: 12px; height: 12px; border-radius: 50%; background: ${category.color};"></div>
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
    
    // إضافة النافذة إلى DOM
    const existingModal = document.getElementById('categories-status-modal');
    if (existingModal) {
        existingModal.remove();
    }
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    document.getElementById('categories-status-modal').classList.add('active');
}

function setupMainPageFilters() {
    const tasksView = document.getElementById('tasks-view');
    if (!tasksView) return;
    
    // التحقق من عدم وجود الفلاتر مسبقاً
    if (tasksView.querySelector('.tasks-filters-container')) return;
    
    // إنشاء حاوية جديدة للفلاتر فوق المهام
    const contentArea = tasksView.querySelector('.content-area') || tasksView;
    
    const filtersContainer = document.createElement('div');
    filtersContainer.className = 'tasks-filters-container';
    filtersContainer.style.cssText = `
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
        padding: 15px 20px;
        background: var(--theme-card);
        border-radius: var(--border-radius);
        border: 1px solid var(--theme-border);
        box-shadow: var(--box-shadow);
    `;
    
    // قسم الفلاتر
    const filtersSection = document.createElement('div');
    filtersSection.style.cssText = 'display: flex; gap: 10px; flex-wrap: wrap;';
    filtersSection.innerHTML = `
        <button class="filter-btn active" data-filter="pending">المهام النشطة</button>
        <button class="filter-btn" data-filter="completed">المكتملة</button>
        <button class="filter-btn" data-filter="deleted">المحذوفة</button>
        <button class="filter-btn" data-filter="overdue">المتأخرة</button>
        <button class="filter-btn" data-filter="all">الكل</button>
    `;
    
    // قسم إضافة المهام فقط
    const addTaskSection = document.createElement('div');
    
    // زر إضافة مهمة جديد
    const addTaskBtn = document.createElement('button');
    addTaskBtn.className = 'btn btn-primary';
    addTaskBtn.innerHTML = '<i class="fas fa-plus"></i> إضافة مهمة';
    addTaskBtn.addEventListener('click', () => openAddTaskModal());
    
    addTaskSection.appendChild(addTaskBtn);
    
    // إضافة الأقسام إلى الحاوية
    filtersContainer.appendChild(filtersSection);
    filtersContainer.appendChild(addTaskSection);
    
    // إدراج الفلاتر قبل قائمة المهام مباشرة
    const tasksList = contentArea.querySelector('#tasks-list');
    if (tasksList) {
        contentArea.insertBefore(filtersContainer, tasksList);
    } else {
        contentArea.prepend(filtersContainer);
    }
    
    // إضافة أحداث الفلاتر
    filtersSection.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            filtersSection.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            setFilter(this.dataset.filter);
        });
    });
}

function setupMainPageFiltersWithStatus() {
    const tasksView = document.getElementById('tasks-view');
    if (!tasksView) return;
    
    const contentArea = tasksView.querySelector('.content-area') || tasksView;
    
    const filtersContainer = document.createElement('div');
    filtersContainer.className = 'tasks-filters-container';
    filtersContainer.style.cssText = `
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
        padding: 15px 20px;
        background: var(--theme-card);
        border-radius: var(--border-radius);
        border: 1px solid var(--theme-border);
        box-shadow: var(--box-shadow);
    `;
    
    // قسم حالة الفئات على اليمين
    const categoriesStatusSection = document.createElement('div');
    categoriesStatusSection.className = 'categories-status-section';
    categoriesStatusSection.style.cssText = 'display: flex; gap: 15px; align-items: center;';
    
    // إضافة رموز حالة الفئات
    AppState.categories.forEach(category => {
        const statusItem = document.createElement('div');
        statusItem.className = 'category-status-item';
        statusItem.dataset.categoryId = category.id;
        statusItem.style.cssText = `
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 6px 12px;
            background: ${category.color}20;
            border-radius: 20px;
            border: 1px solid ${category.color};
            cursor: pointer;
            transition: var(--transition);
        `;
        
        statusItem.innerHTML = `
            <div style="width: 10px; height: 10px; border-radius: 50%; background: ${category.color};"></div>
            <span style="font-size: 0.85rem; color: var(--theme-text);">${category.name}</span>
            <span class="category-status-text" style="font-size: 0.75rem; color: var(--gray-color);">0%</span>
        `;
        
        statusItem.addEventListener('click', () => {
            showCategoryFullStatus(category.id);
        });
        
        categoriesStatusSection.appendChild(statusItem);
    });
    
    // زر عرض حالة الفئات
    const viewAllStatusBtn = document.createElement('button');
    viewAllStatusBtn.className = 'btn btn-info btn-sm';
    viewAllStatusBtn.innerHTML = '<i class="fas fa-chart-pie"></i>';
    viewAllStatusBtn.title = 'عرض جميع حالات الفئات';
    viewAllStatusBtn.style.cssText = 'padding: 6px 10px;';
    viewAllStatusBtn.addEventListener('click', showCategoriesStatusModal);
    
    categoriesStatusSection.appendChild(viewAllStatusBtn);
    
    // قسم الفلاتر على اليسار
    const filtersSection = document.createElement('div');
    filtersSection.style.cssText = 'display: flex; gap: 10px; flex-wrap: wrap;';
    filtersSection.innerHTML = `
        <button class="filter-btn active" data-filter="pending">المهام النشطة</button>
        <button class="filter-btn" data-filter="completed">المكتملة</button>
        <button class="filter-btn" data-filter="deleted">المحذوفة</button>
        <button class="filter-btn" data-filter="overdue">المتأخرة</button>
        <button class="filter-btn" data-filter="all">الكل</button>
    `;
    
    // إضافة الأقسام إلى الحاوية
    filtersContainer.appendChild(categoriesStatusSection);
    filtersContainer.appendChild(filtersSection);
    
    // إدراج الفلاتر قبل قائمة المهام مباشرة
    const tasksList = contentArea.querySelector('#tasks-list');
    if (tasksList) {
        contentArea.insertBefore(filtersContainer, tasksList);
    } else {
        contentArea.prepend(filtersContainer);
    }
    
    // إضافة أحداث الفلاتر
    filtersSection.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            filtersSection.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            setFilter(this.dataset.filter);
        });
    });
}

function showCategoryFullStatus(categoryId) {
    const status = calculateCategoryStatus(categoryId);
    if (!status) return;
    
    let message = '';
    let color = '#6c757d';
    
    switch(status.status) {
        case 'empty':
            message = status.message;
            color = '#6c757d';
            break;
        case 'completed':
            message = status.message;
            color = '#4cc9f0';
            break;
        case 'exceeded':
            message = status.message;
            color = '#f72585';
            break;
        default:
            message = `مكتملة: ${status.completedDuration}/${status.totalDuration} دقيقة`;
            color = '#f8961e';
    }
    
    // عرض رسالة مؤقتة
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: var(--theme-card);
        color: var(--theme-text);
        padding: 10px 20px;
        border-radius: 8px;
        border-left: 4px solid ${color};
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        font-size: 0.9rem;
        max-width: 400px;
        text-align: center;
    `;
    notification.innerHTML = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 3000);
}

function isCategoryFull(categoryId) {
    const category = AppState.categories.find(c => c.id === categoryId);
    if (!category || !category.timeframeMinutes) return false;
    
    const categoryTasks = AppState.tasks.filter(task => task.categoryId === categoryId);
    const totalDuration = categoryTasks.reduce((sum, task) => sum + (task.duration || 0), 0);
    
    return totalDuration >= category.timeframeMinutes;
}
function addTask(taskData) {
    console.log("إضافة مهمة:", taskData);
    
    const category = AppState.categories.find(c => c.id === taskData.categoryId);
    if (category && category.timeframeMinutes) {
        const categoryTasks = AppState.tasks.filter(task => task.categoryId === taskData.categoryId);
        const totalDuration = categoryTasks.reduce((sum, task) => sum + (task.duration || 0), 0);
        
        if (totalDuration + (taskData.duration || 0) > category.timeframeMinutes) {
            if (!confirm(`الحيز الزمني للفئة "${category.name}" ممتلئ (${totalDuration}/${category.timeframeMinutes} دقيقة).\nهل أنت متأكد من إضافة مهمة جديدة؟`)) {
                return;
            }
            
            showCategoryFullOptions(category.id, taskData);
            return;
        }
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
    
    UndoRedoManager.saveState('إضافة مهمة');
    AppState.tasks.push(newTask);
    saveTasks();
    refreshCurrentView();
    
    closeModal('add-task-modal');
    document.getElementById('task-form')?.reset();
}

function addTaskAnyway(categoryId, taskData) {
    addTask(taskData);
    closeModal('category-full-modal');
}

function replaceCompletedTask(categoryId, taskData) {
    const completedTasks = AppState.tasks.filter(task => 
        task.categoryId === categoryId && task.completed
    );
    
    if (completedTasks.length > 0) {
        const oldestTask = completedTasks.sort((a, b) => 
            new Date(a.createdAt) - new Date(b.createdAt)
        )[0];
        
        deleteTask(oldestTask.id);
        addTask(taskData);
    } else {
        alert('لا توجد مهام مكتملة في هذه الفئة لاستبدالها.');
    }
    
    closeModal('category-full-modal');
}

function showCategoryFullOptions(categoryId, taskData) {
    const modalHTML = `
        <div class="modal" id="category-full-modal">
            <div class="modal-content" style="max-width: 500px;">
                <div class="modal-header">
                    <h3><i class="fas fa-exclamation-triangle"></i> الحيز الزمني ممتلئ</h3>
                    <button class="close-btn" onclick="closeModal('category-full-modal')">&times;</button>
                </div>
                <div class="modal-body">
                    <p style="color: var(--danger-color); margin-bottom: 20px;">
                        <i class="fas fa-info-circle"></i> الحيز الزمني لهذه الفئة ممتلئ بالفعل.
                    </p>
                    <p style="margin-bottom: 20px;">ماذا تريد أن تفعل؟</p>
                    <div class="full-options">
                        <button class="btn btn-primary" onclick="addTaskAnyway('${categoryId}', ${JSON.stringify(taskData).replace(/'/g, "\\'")})">
                            <i class="fas fa-plus"></i> إضافة المهمة على أي حال
                        </button>
                        <button class="btn btn-warning" onclick="replaceCompletedTask('${categoryId}', ${JSON.stringify(taskData).replace(/'/g, "\\'")})">
                            <i class="fas fa-exchange-alt"></i> استبدالها بمهمة مكتملة
                        </button>
                        <button class="btn btn-secondary" onclick="closeModal('category-full-modal')">
                            <i class="fas fa-times"></i> إلغاء الإضافة
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    const existingModal = document.getElementById('category-full-modal');
    if (existingModal) existingModal.remove();
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    document.getElementById('category-full-modal').classList.add('active');
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
        // استخراج عناصر الـ checkbox من المحتوى
        let noteContent = note.content || '';
        
        // إضافة استايل لكل checkbox لضمان لونه المناسب للثيم
        if (AppState.currentTheme === 'black') {
            noteContent = noteContent.replace(/class="note-checkbox-text"/g, 
                'class="note-checkbox-text" style="color: #f0f0f0 !important;"');
        } else {
            noteContent = noteContent.replace(/class="note-checkbox-text"/g, 
                'class="note-checkbox-text" style="color: var(--theme-text) !important;"');
        }
        
        // تحويل checkboxes إلى HTML قابل للتفاعل
        noteContent = noteContent.replace(/<input type="checkbox"/g, '<input type="checkbox" class="note-checkbox"');
        
        html += `
            <div class="note-card" data-id="${note.id}">
                <div class="note-header">
                    <input type="text" class="note-title" value="${note.title}" 
                           onchange="updateNoteTitle('${note.id}', this.value)">
                    <div class="note-date">${formatDate(note.updatedAt)}</div>
                </div>
                
                <div class="note-content" 
                     style="font-family: ${note.fontFamily}; font-size: ${note.fontSize}px; font-weight: ${note.fontWeight}; font-style: ${note.fontStyle}; color: ${note.color};"
                     onclick="openNoteEditor('${note.id}')">
                    ${noteContent || '<p style="color: var(--theme-text); opacity: 0.7;">انقر لتحرير الملاحظة...</p>'}
                </div>
                
                <div class="note-footer">
                    <div class="note-font">
                        ${note.fontFamily.split(',')[0].replace(/'/g, '')} - ${note.fontSize}px
                    </div>
                    <div class="note-actions">
                        <button class="btn btn-danger btn-sm delete-note-btn" data-id="${note.id}" title="حذف">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
    
    // إضافة أحداث الـ checkboxes
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
}

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
    
    // فتح المحرر للملاحظة الجديدة
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
    if (!note) {
        console.error('الملاحظة غير موجودة:', noteId);
        return;
    }
    
    AppState.currentNoteId = noteId;
    
    // ✅ **التحقق من وجود كل عنصر**
    const editorTitle = document.getElementById('notes-editor-title');
    const editor = document.getElementById('notes-editor-content');
    const modal = document.getElementById('notes-editor');
    
    if (!editorTitle || !editor || !modal) {
        console.error('عناصر محرر الملاحظات غير موجودة');
        return;
    }
    
    editorTitle.value = note.title;
    
    // تحديث عناصر التحكم
    const fontFamilySelect = document.getElementById('notes-font-family');
    const fontSizeSelect = document.getElementById('notes-font-size');
    const fontWeightSelect = document.getElementById('notes-font-weight');
    const fontStyleSelect = document.getElementById('notes-font-style');
    const fontColorSelect = document.getElementById('notes-font-color');
    
    if (fontFamilySelect) fontFamilySelect.value = note.fontFamily;
    if (fontSizeSelect) fontSizeSelect.value = note.fontSize;
    if (fontWeightSelect) fontWeightSelect.value = note.fontWeight;
    if (fontStyleSelect) fontStyleSelect.value = note.fontStyle;
    if (fontColorSelect) fontColorSelect.value = note.color;
    
    // تحديث المحرر
    editor.innerHTML = note.content || '';
    editor.style.fontFamily = note.fontFamily;
    editor.style.fontSize = note.fontSize + 'px';
    editor.style.fontWeight = note.fontWeight;
    editor.style.fontStyle = note.fontStyle;
    editor.style.color = note.color;
    
    // فتح النافذة
    modal.classList.add('active');
    
    setTimeout(() => {
        editor.focus();
        
        // ✅ **إعادة تهيئة أحداث المحرر بعد فتحه**
        setupNotesEditorEvents();
    }, 100);
}
// ========== إدارة الملاحظات ==========
function setupNotesEditorEvents() {
    // ✅ **إضافة تحقق من وجود العناصر قبل إضافة الأحداث**
    const saveNotesBtn = document.getElementById('save-notes-btn');
    const closeNotesBtn = document.getElementById('close-notes-btn');
    const addCheckboxBtn = document.getElementById('add-checkbox-btn');
    const addLinkBtn = document.getElementById('add-link-btn');
    const addImageBtn = document.getElementById('add-image-btn');
    const fontFamilySelect = document.getElementById('notes-font-family');
    const fontSizeSelect = document.getElementById('notes-font-size');
    const fontWeightSelect = document.getElementById('notes-font-weight');
    const fontStyleSelect = document.getElementById('notes-font-style');
    const fontColorSelect = document.getElementById('notes-font-color');
    
    // التحقق من وجود كل العناصر المطلوبة
    if (!saveNotesBtn || !closeNotesBtn || !addCheckboxBtn || !addLinkBtn || !addImageBtn) {
        console.warn('⚠️ بعض عناصر محرر الملاحظات غير موجودة في DOM');
        return;
    }
    
    // حفظ الملاحظات
    saveNotesBtn.addEventListener('click', saveNote);
    
    // إغلاق المحرر
    closeNotesBtn.addEventListener('click', () => {
        const notesEditor = document.getElementById('notes-editor');
        if (notesEditor) {
            notesEditor.classList.remove('active');
        }
    });
    
    // زر إضافة خانة اختيار واحدة فقط
    addCheckboxBtn.addEventListener('click', () => {
        const editor = document.getElementById('notes-editor-content');
        if (!editor) return;
        
        const checkboxHtml = `
            <div class="note-checkbox-item" contenteditable="false" style="display: flex; align-items: center; gap: 8px; margin: 5px 0; padding: 5px; border-radius: 4px; background: rgba(0,0,0,0.02);">
                <input type="checkbox" class="note-checkbox" style="width: 18px; height: 18px; cursor: pointer; accent-color: var(--theme-primary);">
                <span class="note-checkbox-text" contenteditable="true" style="flex: 1; color: var(--theme-text); min-height: 20px; outline: none; text-align: right;">عنصر جديد</span>
            </div>
        `;
        
        // إدراج HTML في المحرر
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
            
            // نقل المؤشر إلى داخل النص
            const textElement = frag.querySelector('.note-checkbox-text');
            if (textElement) {
                range.setStart(textElement, 0);
                range.setEnd(textElement, 0);
                selection.removeAllRanges();
                selection.addRange(range);
                textElement.focus();
            }
        } else {
            // إذا لم يكن هناك نطاق محدد، نضيف في النهاية
            editor.insertAdjacentHTML('beforeend', checkboxHtml);
            
            // التركيز على النص الجديد
            const newCheckboxes = editor.querySelectorAll('.note-checkbox-item');
            const lastItem = newCheckboxes[newCheckboxes.length - 1];
            if (lastItem) {
                const textElement = lastItem.querySelector('.note-checkbox-text');
                if (textElement) {
                    textElement.focus();
                }
            }
        }
        
        // إضافة حدث للـ checkbox
        const newCheckboxes = editor.querySelectorAll('.note-checkbox-item:last-child .note-checkbox');
        newCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', function() {
                const item = this.closest('.note-checkbox-item');
                if (item) {
                    item.classList.toggle('completed');
                    const textElement = item.querySelector('.note-checkbox-text');
                    if (textElement) {
                        if (this.checked) {
                            textElement.style.textDecoration = 'line-through';
                            textElement.style.opacity = '0.6';
                        } else {
                            textElement.style.textDecoration = 'none';
                            textElement.style.opacity = '1';
                        }
                    }
                }
            });
        });
    });
    
    // زر إضافة رابط محسن
    addLinkBtn.addEventListener('click', () => {
        const selection = window.getSelection();
        const selectedText = selection.toString();
        
        let url = '';
        let linkText = '';
        
        if (selectedText) {
            // إذا كان هناك نص محدد، أضف رابط للنص المحدد
            linkText = selectedText;
            url = prompt(`أدخل الرابط URL للنص المحدد "${selectedText}":`, 'https://');
        } else {
            // إذا لم يكن هناك نص محدد، أضف رابط فقط
            url = prompt('أدخل الرابط URL:', 'https://');
            linkText = url;
        }
        
        if (url) {
            // التحقق من صحة الرابط
            if (!url.startsWith('http://') && !url.startsWith('https://')) {
                url = 'https://' + url;
            }
            
            if (selection.rangeCount > 0 && selectedText) {
                // استبدال النص المحدد برابط
                const range = selection.getRangeAt(0);
                range.deleteContents();
                
                const link = document.createElement('a');
                link.href = url;
                link.textContent = linkText;
                link.target = '_blank';
                link.rel = 'noopener noreferrer';
                
                // تعيين لون الرابط بناءً على الثيم
                if (AppState.currentTheme === 'black') {
                    link.style.color = '#f0f0f0';
                } else {
                    link.style.color = 'var(--theme-text)';
                }
                
                range.insertNode(link);
            } else {
                // إضافة رابط جديد
                const linkHtml = `<a href="${url}" target="_blank" rel="noopener noreferrer" style="color: ${AppState.currentTheme === 'black' ? '#f0f0f0' : 'var(--theme-text)'};">${linkText}</a>`;
                
                const editor = document.getElementById('notes-editor-content');
                if (editor) {
                    editor.insertAdjacentHTML('beforeend', linkHtml + ' ');
                }
            }
        }
    });
    
    // زر إضافة صورة مع خيارات متعددة
    addImageBtn.addEventListener('click', () => {
        // إنشاء نافذة اختيار الإضافة
        const imageModalHTML = `
            <div class="modal" id="add-image-modal">
                <div class="modal-content" style="max-width: 500px;">
                    <div class="modal-header">
                        <h3><i class="fas fa-image"></i> إضافة صورة</h3>
                        <button class="close-btn" onclick="closeModal('add-image-modal')">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div style="text-align: center; margin-bottom: 20px;">
                            <p>اختر طريقة إضافة الصورة:</p>
                        </div>
                        <div class="image-options" style="display: flex; flex-direction: column; gap: 10px;">
                            <button class="btn btn-primary" id="paste-image-btn" style="justify-content: center;">
                                <i class="fas fa-paste"></i> لصق صورة من الحافظة
                            </button>
                            <button class="btn btn-secondary" id="upload-image-btn" style="justify-content: center;">
                                <i class="fas fa-upload"></i> رفع صورة من الجهاز
                            </button>
                            <button class="btn btn-info" id="url-image-btn" style="justify-content: center;">
                                <i class="fas fa-link"></i> إدخال رابط الصورة
                            </button>
                        </div>
                        <div id="image-preview-container" style="margin-top: 20px; display: none;">
                            <img id="image-preview" style="max-width: 100%; max-height: 200px; border-radius: 8px; border: 1px solid var(--theme-border);">
                        </div>
                        <input type="file" id="image-file-input" accept="image/*" style="display: none;">
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" onclick="closeModal('add-image-modal')">إلغاء</button>
                        <button class="btn btn-primary" id="insert-image-btn" style="display: none;">إدراج الصورة</button>
                    </div>
                </div>
            </div>
        `;
        
        const existingModal = document.getElementById('add-image-modal');
        if (existingModal) existingModal.remove();
        
        document.body.insertAdjacentHTML('beforeend', imageModalHTML);
        document.getElementById('add-image-modal').classList.add('active');
        
        // تهيئة أحداث نافذة الصور
        setupImageModalEvents();
    });
    
    // أدوات التنسيق مع تصحيح المحاذاة للعربية
    document.querySelectorAll('.format-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const command = this.dataset.command;
            if (command) {
                // تصحيح أوامر المحاذاة للعربية
                let correctedCommand = command;
                let value = null;
                
                // تحويل الأوامر للعربية
                if (command === 'justifyRight') {
                    correctedCommand = 'justifyLeft';
                } else if (command === 'justifyLeft') {
                    correctedCommand = 'justifyRight';
                } else if (command === 'justifyCenter') {
                    correctedCommand = 'justifyCenter';
                }
                
                document.execCommand(correctedCommand, false, value);
                this.classList.toggle('active');
            }
        });
    });
    
    // إعدادات الخط
    if (fontFamilySelect) {
        fontFamilySelect.addEventListener('change', function() {
            document.execCommand('fontName', false, this.value);
        });
    }
    
    if (fontSizeSelect) {
        fontSizeSelect.addEventListener('change', function() {
            const editor = document.getElementById('notes-editor-content');
            if (editor) {
                editor.style.fontSize = this.value + 'px';
            }
        });
    }
    
    if (fontWeightSelect) {
        fontWeightSelect.addEventListener('change', function() {
            const editor = document.getElementById('notes-editor-content');
            if (editor) {
                editor.style.fontWeight = this.value;
            }
        });
    }
    
    if (fontStyleSelect) {
        fontStyleSelect.addEventListener('change', function() {
            const editor = document.getElementById('notes-editor-content');
            if (editor) {
                editor.style.fontStyle = this.value;
            }
        });
    }
    
    if (fontColorSelect) {
        fontColorSelect.addEventListener('change', function() {
            document.execCommand('foreColor', false, this.value);
        });
    }
    
    // إضافة حدث للصق الصور
    const editor = document.getElementById('notes-editor-content');
    if (editor) {
        editor.addEventListener('paste', function(e) {
            const items = e.clipboardData.items;
            for (let i = 0; i < items.length; i++) {
                if (items[i].type.indexOf('image') !== -1) {
                    e.preventDefault();
                    const blob = items[i].getAsFile();
                    const reader = new FileReader();
                    reader.onload = function(event) {
                        insertImageWithControls(event.target.result);
                    };
                    reader.readAsDataURL(blob);
                    break;
                }
            }
        });
    }
}


function setupImageModalEvents() {
    // زر لصق الصورة
    document.getElementById('paste-image-btn')?.addEventListener('click', () => {
        const pasteArea = document.createElement('div');
        pasteArea.contentEditable = true;
        pasteArea.style.cssText = `
            width: 100%;
            height: 100px;
            border: 2px dashed var(--theme-border);
            border-radius: 8px;
            padding: 20px;
            text-align: center;
            color: var(--gray-color);
            margin-bottom: 15px;
            cursor: pointer;
        `;
        pasteArea.innerHTML = '<i class="fas fa-paste" style="font-size: 2rem; margin-bottom: 10px;"></i><br>انقر هنا ثم الصق الصورة (Ctrl+V)';
        
        const container = document.getElementById('add-image-modal').querySelector('.modal-body');
        const previewContainer = document.getElementById('image-preview-container');
        
        previewContainer.style.display = 'none';
        container.insertBefore(pasteArea, previewContainer);
        
        pasteArea.focus();
        
        pasteArea.addEventListener('paste', function(e) {
            e.preventDefault();
            const items = e.clipboardData.items;
            for (let i = 0; i < items.length; i++) {
                if (items[i].type.indexOf('image') !== -1) {
                    const blob = items[i].getAsFile();
                    const reader = new FileReader();
                    reader.onload = function(event) {
                        previewContainer.style.display = 'block';
                        document.getElementById('image-preview').src = event.target.result;
                        document.getElementById('insert-image-btn').style.display = 'block';
                        
                        // حفظ الصورة مؤقتاً
                        window.tempImageData = event.target.result;
                        
                        pasteArea.style.display = 'none';
                    };
                    reader.readAsDataURL(blob);
                    break;
                }
            }
        });
    });
    
    // زر رفع الصورة
    document.getElementById('upload-image-btn')?.addEventListener('click', () => {
        document.getElementById('image-file-input').click();
    });
    
    document.getElementById('image-file-input')?.addEventListener('change', function(e) {
        if (this.files && this.files[0]) {
            const reader = new FileReader();
            reader.onload = function(event) {
                const previewContainer = document.getElementById('image-preview-container');
                previewContainer.style.display = 'block';
                document.getElementById('image-preview').src = event.target.result;
                document.getElementById('insert-image-btn').style.display = 'block';
                
                // حفظ الصورة مؤقتاً
                window.tempImageData = event.target.result;
            };
            reader.readAsDataURL(this.files[0]);
        }
    });
    
    // زر رابط الصورة
    document.getElementById('url-image-btn')?.addEventListener('click', () => {
        const url = prompt('أدخل رابط الصورة:', 'https://');
        if (url) {
            const previewContainer = document.getElementById('image-preview-container');
            previewContainer.style.display = 'block';
            document.getElementById('image-preview').src = url;
            document.getElementById('insert-image-btn').style.display = 'block';
            
            // حفظ الرابط مؤقتاً
            window.tempImageData = url;
        }
    });
    
    // زر إدراج الصورة
    document.getElementById('insert-image-btn')?.addEventListener('click', () => {
        if (window.tempImageData) {
            insertImageWithControls(window.tempImageData);
            closeModal('add-image-modal');
        }
    });
}

function insertImageWithControls(imageData) {
    const editor = document.getElementById('notes-editor-content');
    if (!editor) return;
    
    const imageContainer = document.createElement('div');
    imageContainer.className = 'note-image-container';
    imageContainer.style.cssText = `
        position: relative;
        display: inline-block;
        margin: 10px 0;
        max-width: 100%;
        border: 1px solid var(--theme-border);
        border-radius: 8px;
        overflow: hidden;
        cursor: move;
    `;
    
    const img = document.createElement('img');
    img.src = imageData;
    img.style.cssText = `
        max-width: 100%;
        display: block;
        cursor: move;
        transition: transform 0.2s;
    `;
    
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'image-delete-btn';
    deleteBtn.innerHTML = '<i class="fas fa-times"></i>';
    deleteBtn.style.cssText = `
        position: absolute;
        top: 8px;
        left: 8px;
        background: rgba(247, 37, 133, 0.9);
        color: white;
        border: none;
        border-radius: 50%;
        width: 28px;
        height: 28px;
        cursor: pointer;
        z-index: 10;
        display: none;
        align-items: center;
        justify-content: center;
        font-size: 0.9rem;
        transition: all 0.2s ease;
    `;
    
    const resizeHandle = document.createElement('div');
    resizeHandle.className = 'image-resize-handle';
    resizeHandle.innerHTML = '↘';
    resizeHandle.style.cssText = `
        position: absolute;
        bottom: 8px;
        right: 8px;
        width: 24px;
        height: 24px;
        background: rgba(67, 97, 238, 0.8);
        color: white;
        border-radius: 4px;
        cursor: nwse-resize;
        z-index: 10;
        display: none;
        align-items: center;
        justify-content: center;
        font-size: 0.8rem;
        font-weight: bold;
    `;
    
    imageContainer.appendChild(img);
    imageContainer.appendChild(deleteBtn);
    imageContainer.appendChild(resizeHandle);
    
    // إدراج الصورة في المحرر
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        range.insertNode(imageContainer);
    } else {
        editor.appendChild(imageContainer);
    }
    
    // إضافة أحداث التحكم بالصورة
    makeImageDraggableAndResizable(img, imageContainer, deleteBtn, resizeHandle);
}

function makeImageDraggableAndResizable(img, container, deleteBtn, resizeHandle) {
    let isDragging = false;
    let isResizing = false;
    let startX, startY, startWidth, startHeight, startLeft, startTop;
    
    // إظهار/إخفاء أزرار التحكم
    container.addEventListener('mouseenter', () => {
        deleteBtn.style.display = 'flex';
        resizeHandle.style.display = 'flex';
    });
    
    container.addEventListener('mouseleave', (e) => {
        if (!isDragging && !isResizing) {
            deleteBtn.style.display = 'none';
            resizeHandle.style.display = 'none';
        }
    });
    
    // حدث حذف الصورة
    deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        container.remove();
    });
    
    // أحداث السحب
    img.addEventListener('mousedown', startDrag);
    container.addEventListener('mousedown', startDrag);
    
    function startDrag(e) {
        if (e.target === resizeHandle) return;
        e.preventDefault();
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        
        const style = window.getComputedStyle(container);
        startLeft = parseInt(style.left) || 0;
        startTop = parseInt(style.top) || 0;
        
        container.style.position = 'relative';
        container.style.zIndex = '1000';
        
        document.addEventListener('mousemove', drag);
        document.addEventListener('mouseup', stopDrag);
    }
    
    function drag(e) {
        if (!isDragging) return;
        
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        
        container.style.left = (startLeft + dx) + 'px';
        container.style.top = (startTop + dy) + 'px';
    }
    
    function stopDrag() {
        isDragging = false;
        container.style.zIndex = '';
        document.removeEventListener('mousemove', drag);
        document.removeEventListener('mouseup', stopDrag);
    }
    
    // أحداث التكبير/التصغير
    resizeHandle.addEventListener('mousedown', startResize);
    
    function startResize(e) {
        e.preventDefault();
        e.stopPropagation();
        isResizing = true;
        startX = e.clientX;
        startY = e.clientY;
        startWidth = img.offsetWidth;
        startHeight = img.offsetHeight;
        
        document.addEventListener('mousemove', resize);
        document.addEventListener('mouseup', stopResize);
    }
    
    function resize(e) {
        if (!isResizing) return;
        
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        
        const newWidth = Math.max(50, startWidth + dx);
        const newHeight = Math.max(50, startHeight + dy);
        
        img.style.width = newWidth + 'px';
        img.style.height = newHeight + 'px';
        
        // الحفاظ على نسبة الأبعاد (اختياري)
        // const aspectRatio = startWidth / startHeight;
        // img.style.height = newWidth / aspectRatio + 'px';
    }
    
    function stopResize() {
        isResizing = false;
        document.removeEventListener('mousemove', resize);
        document.removeEventListener('mouseup', stopResize);
    }
}

// دالة لإضافة Undo/Redo لمحرر الملاحظات
function setupEditorUndoRedo() {
    const editor = document.getElementById('notes-editor-content');
    if (!editor) return;
    
    // حفظ حالة المحرر
    let undoStack = [];
    let redoStack = [];
    let maxStackSize = 20;
    
    function saveEditorState() {
        const state = editor.innerHTML;
        undoStack.push(state);
        if (undoStack.length > maxStackSize) {
            undoStack.shift();
        }
        redoStack = [];
    }
    
    function undoEditor() {
        if (undoStack.length === 0) return;
        const currentState = editor.innerHTML;
        redoStack.push(currentState);
        editor.innerHTML = undoStack.pop();
    }
    
    function redoEditor() {
        if (redoStack.length === 0) return;
        const currentState = editor.innerHTML;
        undoStack.push(currentState);
        editor.innerHTML = redoStack.pop();
    }
    
    // حفظ الحالة عند كل تغيير
    editor.addEventListener('input', () => {
        saveEditorState();
    });
    
    // اختصارات لوحة المفاتيح للمحرر
    editor.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
            e.preventDefault();
            undoEditor();
        }
        if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
            e.preventDefault();
            redoEditor();
        }
    });
    
    // حفظ الحالة الأولية
    saveEditorState();
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

// ========== إدارة العروض ==========
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
    const pageTitle = document.getElementById('page-title');
    if (pageTitle) {
        pageTitle.textContent = titles[viewName] || viewName;
    }
    
    document.querySelectorAll('.view').forEach(view => {
        view.classList.remove('active');
    });
    const targetView = document.getElementById(`${viewName}-view`);
    if (targetView) {
        targetView.classList.add('active');
    }
    
    // ✅ **إعادة تهيئة محرر الملاحظات فقط عند التبديل إلى عرض الملاحظات**
    if (viewName === 'notes') {
        setTimeout(() => {
            setupNotesEditorEvents();
            renderNotes();
            addUndoRedoButtons(viewName);
        }, 50);
    } else {
        // ✅ لبقية العروض، نستدعي refreshCurrentView
        refreshCurrentView();
        addUndoRedoButtons(viewName);
    }
}

function addUndoRedoButtons(viewName) {
    const view = document.getElementById(`${viewName}-view`);
    if (!view) return;
    
    // إزالة الأزرار القديمة إن وجدت
    const existingContainer = view.querySelector('.undo-redo-container');
    if (existingContainer) existingContainer.remove();
    
    const container = document.createElement('div');
    container.className = 'undo-redo-container';
    container.style.cssText = `
        display: flex;
        gap: 10px;
        justify-content: center;
        margin: 20px 0;
    `;
    
    container.innerHTML = `
        <button id="undo-btn" class="btn btn-secondary btn-sm">
            <i class="fas fa-undo"></i> تراجع (Ctrl+Z)
        </button>
        <button id="redo-btn" class="btn btn-secondary btn-sm">
            <i class="fas fa-redo"></i> إعادة (Ctrl+Y)
        </button>
    `;
    
    // إدراج الأزرار في مكان مناسب
    if (viewName === 'tasks') {
        const tasksList = view.querySelector('#tasks-list');
        if (tasksList) {
            view.insertBefore(container, tasksList);
        }
    } else if (viewName === 'notes') {
        const notesList = view.querySelector('#notes-list');
        if (notesList) {
            view.insertBefore(container, notesList);
        }
    } else if (viewName === 'categories') {
        const categoriesList = view.querySelector('#categories-list');
        if (categoriesList) {
            view.insertBefore(container, categoriesList);
        }
    } else if (viewName === 'calendar') {
        const calendarContent = view.querySelector('#calendar-content');
        if (calendarContent) {
            view.insertBefore(container, calendarContent);
        }
    }
    
    // إضافة الأحداث
    document.getElementById('undo-btn')?.addEventListener('click', () => UndoRedoManager.undo());
    document.getElementById('redo-btn')?.addEventListener('click', () => UndoRedoManager.redo());
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
function setupGlobalUndoRedo() {
    // إضافة أزرار Undo/Redo الثابتة
    const undoRedoHTML = `
        <div id="global-undo-redo" style="position: fixed; bottom: 20px; left: 20px; display: flex; gap: 8px; z-index: 9999; background: var(--theme-card); padding: 8px; border-radius: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); border: 1px solid var(--theme-border);">
            <button id="global-undo-btn" class="undo-redo-btn" title="تراجع (Ctrl+Z)" style="width: 36px; height: 36px; border-radius: 50%; border: none; background: var(--theme-card); color: var(--theme-text); cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; transition: var(--transition);">
                <i class="fas fa-undo"></i>
            </button>
            <button id="global-redo-btn" class="undo-redo-btn" title="إعادة (Ctrl+Y)" style="width: 36px; height: 36px; border-radius: 50%; border: none; background: var(--theme-card); color: var(--theme-text); cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; transition: var(--transition);">
                <i class="fas fa-redo"></i>
            </button>
        </div>
        
        <style>
            .undo-redo-btn:hover {
                background: var(--theme-primary) !important;
                color: white !important;
                transform: scale(1.1);
            }
            
            .undo-redo-btn:disabled {
                opacity: 0.3;
                cursor: not-allowed;
                transform: none !important;
            }
            
            .undo-redo-btn:disabled:hover {
                background: var(--theme-card) !important;
                color: var(--theme-text) !important;
            }
        </style>
    `;
    
    const existingUndoRedo = document.getElementById('global-undo-redo');
    if (existingUndoRedo) existingUndoRedo.remove();
    
    document.body.insertAdjacentHTML('beforeend', undoRedoHTML);
    
    // إضافة الأحداث
    document.getElementById('global-undo-btn').addEventListener('click', () => UndoRedoManager.undo());
    document.getElementById('global-redo-btn').addEventListener('click', () => UndoRedoManager.redo());
    
    // تحديث حالة الأزرار
    UndoRedoManager.updateButtons = function() {
        const undoBtn = document.getElementById('global-undo-btn');
        const redoBtn = document.getElementById('global-redo-btn');
        
        if (undoBtn) undoBtn.disabled = this.undoStack.length === 0;
        if (redoBtn) redoBtn.disabled = this.redoStack.length === 0;
    };
    
    // تحديث الأزرار أول مرة
    UndoRedoManager.updateButtons();
}

function setupSearch() {
    const searchBtn = document.getElementById('search-btn');
    if (!searchBtn) return;
    
    searchBtn.addEventListener('click', () => {
        const modalHTML = `
            <div class="modal" id="search-modal">
                <div class="modal-content" style="max-width: 800px; max-height: 80vh;">
                    <div class="modal-header">
                        <h3><i class="fas fa-search"></i> البحث</h3>
                        <button class="close-btn" onclick="closeModal('search-modal')">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="search-input-container" style="margin-bottom: 20px;">
                            <input type="text" id="search-input" placeholder="ابحث في المهام والملاحظات..." 
                                   style="width: 100%; padding: 12px; border: 1px solid var(--theme-border); border-radius: 8px;">
                        </div>
                        <div id="search-results" style="max-height: 400px; overflow-y: auto;">
                            <!-- نتائج البحث تظهر هنا -->
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        const existingModal = document.getElementById('search-modal');
        if (existingModal) existingModal.remove();
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        document.getElementById('search-modal').classList.add('active');
        
        // إضافة حدث البحث
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.focus();
            searchInput.addEventListener('input', performSearch);
        }
    });
}

function performSearch() {
    const query = document.getElementById('search-input').value.toLowerCase().trim();
    const resultsContainer = document.getElementById('search-results');
    
    if (!resultsContainer) return;
    
    if (!query) {
        resultsContainer.innerHTML = '<p style="text-align: center; color: var(--gray-color);">اكتب للبحث...</p>';
        return;
    }
    
    let html = '';
    let resultCount = 0;
    
    // البحث في المهام
    AppState.tasks.forEach(task => {
        const matches = task.title.toLowerCase().includes(query) || 
                       (task.description && task.description.toLowerCase().includes(query));
        
        if (matches) {
            resultCount++;
            const category = getCategoryById(task.categoryId);
            html += `
                <div class="search-result-item" onclick="openEditTaskModal('${task.id}')" 
                     style="padding: 15px; border-bottom: 1px solid var(--theme-border); cursor: pointer; transition: var(--transition);">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <i class="fas fa-tasks" style="color: ${category.color};"></i>
                        <div style="flex: 1;">
                            <div style="font-weight: 500; margin-bottom: 5px;">${highlightText(task.title, query)}</div>
                            ${task.description ? `<div style="font-size: 0.9rem; color: var(--gray-color);">${highlightText(task.description, query)}</div>` : ''}
                            <div style="font-size: 0.8rem; color: var(--theme-primary); margin-top: 5px;">
                                <i class="fas fa-tag"></i> ${category.name} • 
                                <i class="fas fa-calendar"></i> ${formatDate(task.date)}
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }
    });
    
    // البحث في الملاحظات
    AppState.notes.forEach(note => {
        const matches = note.title.toLowerCase().includes(query) || 
                       (note.content && note.content.toLowerCase().includes(query));
        
        if (matches) {
            resultCount++;
            // إزالة HTML من المحتوى للعرض
            const contentText = note.content.replace(/<[^>]*>/g, '').substring(0, 100) + '...';
            html += `
                <div class="search-result-item" onclick="openNoteEditor('${note.id}')" 
                     style="padding: 15px; border-bottom: 1px solid var(--theme-border); cursor: pointer; transition: var(--transition);">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <i class="fas fa-sticky-note" style="color: #4361ee;"></i>
                        <div style="flex: 1;">
                            <div style="font-weight: 500; margin-bottom: 5px;">${highlightText(note.title, query)}</div>
                            <div style="font-size: 0.9rem; color: var(--gray-color);">${highlightText(contentText, query)}</div>
                            <div style="font-size: 0.8rem; color: var(--theme-primary); margin-top: 5px;">
                                <i class="fas fa-clock"></i> ${formatDate(note.updatedAt)}
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }
    });
    
    // البحث في المهام المكتملة
    const completedTasks = AppState.tasks.filter(task => task.completed);
    completedTasks.forEach(task => {
        const matches = task.title.toLowerCase().includes(query) || 
                       (task.description && task.description.toLowerCase().includes(query));
        
        if (matches) {
            resultCount++;
            const category = getCategoryById(task.categoryId);
            html += `
                <div class="search-result-item" onclick="openEditTaskModal('${task.id}')" 
                     style="padding: 15px; border-bottom: 1px solid var(--theme-border); cursor: pointer; transition: var(--transition); background: rgba(76, 201, 240, 0.05);">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <i class="fas fa-check-circle" style="color: var(--success-color);"></i>
                        <div style="flex: 1;">
                            <div style="font-weight: 500; margin-bottom: 5px;">${highlightText(task.title, query)}</div>
                            <div style="font-size: 0.8rem; color: var(--theme-primary); margin-top: 5px;">
                                <i class="fas fa-tag"></i> ${category.name} • مكتملة
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }
    });
    
    if (resultCount === 0) {
        html = `<p style="text-align: center; padding: 40px; color: var(--gray-color);">لا توجد نتائج للبحث عن "${query}"</p>`;
    } else {
        html = `<div style="padding: 10px; color: var(--gray-color); font-size: 0.9rem;">تم العثور على ${resultCount} نتيجة</div>` + html;
    }
    
    resultsContainer.innerHTML = html;
    
    // إضافة تأثير hover
    document.querySelectorAll('.search-result-item').forEach(item => {
        item.addEventListener('mouseenter', function() {
            this.style.background = 'var(--theme-border)';
        });
        item.addEventListener('mouseleave', function() {
            this.style.background = '';
        });
    });
}

function highlightText(text, query) {
    if (!query) return text;
    const regex = new RegExp(`(${query})`, 'gi');
    return text.replace(regex, '<span style="background: #ffeb3b; color: #000; padding: 0 2px; border-radius: 2px;">$1</span>');
}
function initializePage() {
    console.log("تهيئة الصفحة...");
    
    // تحديث التاريخ
    const now = new Date();
    const arabicDate = now.toLocaleDateString('ar-SA', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    const currentDateElement = document.getElementById('current-date');
    if (currentDateElement) {
        currentDateElement.textContent = arabicDate;
    }
    
    // ========== نافذة إضافة مهمة ==========
    // ضع تعريف المتغيرات هنا داخل initializePage
    const closeTaskModalBtn = document.getElementById('close-task-modal');
    const cancelTaskBtn = document.getElementById('cancel-task');
    
    if (closeTaskModalBtn) {
        closeTaskModalBtn.addEventListener('click', () => {
            closeModal('add-task-modal');
        });
    }
    
    if (cancelTaskBtn) {
        cancelTaskBtn.addEventListener('click', () => {
            closeModal('add-task-modal');
        });
    }
    
    // ========== زر إضافة فئة ==========
    const addCategoryBtn = document.getElementById('add-category-btn');
    if (addCategoryBtn) {
        // إزالة جميع الأحداث السابقة أولاً
        addCategoryBtn.replaceWith(addCategoryBtn.cloneNode(true));
        
        // إضافة الحدث الجديد
        document.getElementById('add-category-btn').addEventListener('click', () => {
            openAddCategoryModal();
        });
    }
    
    // ========== زر إضافة ملاحظة ==========
    const addNoteBtn = document.getElementById('add-note-btn');
    if (addNoteBtn) {
        // إزالة جميع الأحداث السابقة أولاً
        addNoteBtn.replaceWith(addNoteBtn.cloneNode(true));
        
        // إضافة الحدث الجديد
        document.getElementById('add-note-btn').addEventListener('click', () => {
            addNote();
        });
    }
    
    // ========== زر إضافة مهمة رئيسي ==========
    const addTaskBtn = document.getElementById('add-task-btn');
    if (addTaskBtn) {
        // إزالة جميع الأحداث السابقة أولاً
        addTaskBtn.replaceWith(addTaskBtn.cloneNode(true));
        
        // إضافة الحدث الجديد
        document.getElementById('add-task-btn').addEventListener('click', () => {
            openAddTaskModal();
        });
    }
    
    if (closeTaskModalBtn) {
        closeTaskModalBtn.addEventListener('click', () => {
            closeModal('add-task-modal');
        });
    }
    
    if (cancelTaskBtn) {
        cancelTaskBtn.addEventListener('click', () => {
            closeModal('add-task-modal');
        });
    }
    
    const saveTaskBtn = document.getElementById('save-task');
    if (saveTaskBtn) {
        saveTaskBtn.addEventListener('click', () => {
            const titleInput = document.getElementById('task-title');
            const categorySelect = document.getElementById('task-category');
            
            if (!titleInput || !categorySelect) return;
            
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
            
            const durationInput = document.getElementById('task-duration');
            const dateInput = document.getElementById('task-date');
            const timeInput = document.getElementById('task-time');
            const prioritySelect = document.getElementById('task-priority');
            const descriptionTextarea = document.getElementById('task-description');
            
            addTask({
                title: title,
                description: descriptionTextarea ? descriptionTextarea.value.trim() : '',
                categoryId: category,
                duration: durationInput ? durationInput.value : 30,
                date: dateInput ? dateInput.value : new Date().toISOString().split('T')[0],
                time: timeInput ? timeInput.value : '',
                priority: prioritySelect ? prioritySelect.value : 'medium'
            });
        });
    }
    
    // ========== نافذة تعديل مهمة ==========
    const closeEditTaskModalBtn = document.getElementById('close-edit-task-modal');
    const cancelEditTaskBtn = document.getElementById('cancel-edit-task');
    
    if (closeEditTaskModalBtn) {
        closeEditTaskModalBtn.addEventListener('click', () => {
            closeModal('edit-task-modal');
        });
    }
    
    if (cancelEditTaskBtn) {
        cancelEditTaskBtn.addEventListener('click', () => {
            closeModal('edit-task-modal');
        });
    }
    
    const deleteEditTaskBtn = document.getElementById('delete-edit-task');
    if (deleteEditTaskBtn) {
        deleteEditTaskBtn.addEventListener('click', () => {
            if (AppState.currentTaskId) {
                deleteTask(AppState.currentTaskId);
                closeModal('edit-task-modal');
            }
        });
    }
    
    const saveEditTaskBtn = document.getElementById('save-edit-task');
    if (saveEditTaskBtn) {
        saveEditTaskBtn.addEventListener('click', () => {
            if (!AppState.currentTaskId) return;
            
            const titleInput = document.getElementById('edit-task-title');
            const categorySelect = document.getElementById('edit-task-category');
            
            if (!titleInput || !categorySelect) return;
            
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
                duration: durationInput ? durationInput.value : 30,
                date: dateInput ? dateInput.value : new Date().toISOString().split('T')[0],
                time: timeInput ? timeInput.value : '',
                priority: prioritySelect ? prioritySelect.value : 'medium'
            });
        });
    }
    
    // ========== نافذة الفئة ==========
    const closeCategoryModalBtn = document.getElementById('close-category-modal');
    const cancelCategoryBtn = document.getElementById('cancel-category');
    
    if (closeCategoryModalBtn) {
        closeCategoryModalBtn.addEventListener('click', () => {
            closeModal('category-modal');
        });
    }
    
    if (cancelCategoryBtn) {
        cancelCategoryBtn.addEventListener('click', () => {
            closeModal('category-modal');
        });
    }
    
    const saveCategoryBtn = document.getElementById('save-category');
    if (saveCategoryBtn) {
        saveCategoryBtn.addEventListener('click', saveCategory);
    }
    
    // ========== إغلاق النوافذ عند النقر خارجها ==========
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            closeModal(e.target.id);
        }
    });
    
    // ========== تحميل العرض الأولي ==========
    renderTasks();
    console.log("✅ التطبيق جاهز للاستخدام!");
    
    // ✅ **تأخير تهيئة بعض الأحداث حتى يتم تحميل كل شيء**
    setTimeout(() => {
        // إعادة تهيئة الفلاتر
        const filterButtons = document.querySelectorAll('.filter-btn');
        if (filterButtons.length > 0) {
            filterButtons.forEach(btn => {
                btn.addEventListener('click', function() {
                    setFilter(this.dataset.filter);
                });
            });
        }
        
        // إذا كنا في عرض الملاحظات من البداية (ممكن في حالة refresh)
        if (AppState.currentView === 'notes') {
            setupNotesEditorEvents();
        }
    }, 100);
}

function openAddTaskModal(preselectedCategory = null) {
    // ✅ **التحقق من وجود العنصر أولاً**
    const modal = document.getElementById('add-task-modal');
    if (!modal) {
        console.error('نافذة إضافة المهمة غير موجودة');
        return;
    }
    
    const categorySelect = document.getElementById('task-category');
    if (!categorySelect) {
        console.error('عنصر task-category غير موجود');
        return;
    }
    
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
    
    const today = new Date().toISOString().split('T')[0];
    const dateInput = document.getElementById('task-date');
    if (dateInput) {
        dateInput.value = today;
    }
    
    // ✅ **فقط استخدم المتغير الموجود**
    modal.classList.add('active'); // ⚠️ إزالة const modal الثانية
    
    const titleInput = document.getElementById('task-title');
    if (titleInput) {
        setTimeout(() => {
            titleInput.focus();
        }, 100);
    }
}


function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
    }
}

window.changeCalendarDate = function(change) {
    AppState.currentCalendarDate = new Date(
        AppState.currentCalendarDate.getTime() + change * 24 * 60 * 60 * 1000
    );
    renderCalendar();
};

// دالة التنقل بين أسابيع الجدول
window.navigateCalendarWeeks = function(weeks) {
    AppState.currentCalendarDate = new Date(
        AppState.currentCalendarDate.getTime() + weeks * 7 * 24 * 60 * 60 * 1000
    );
    renderCalendar();
};

// دالة عرض جميع المهام ليوم محدد
window.showAllTasksForDay = function(dateStr) {
    const tasksForDay = AppState.tasks.filter(task => task.date === dateStr);
    if (tasksForDay.length === 0) return;
    
    let message = `المهام ليوم ${formatDate(dateStr)}:\n\n`;
    tasksForDay.forEach((task, index) => {
        const category = getCategoryById(task.categoryId);
        message += `${index + 1}. ${task.title} (${category.name}) - ${task.time || 'بدون وقت'}\n`;
    });
    
    alert(message);
};
window.addTaskAnyway = addTaskAnyway;
window.replaceCompletedTask = replaceCompletedTask;
window.showCategoriesStatusModal = showCategoriesStatusModal;
window.previewCustomTheme = previewCustomTheme;
window.showCalendarTaskTooltip = showCalendarTaskTooltip;
window.hideCalendarTaskTooltip = hideCalendarTaskTooltip;

// بدء التطبيق
document.addEventListener('DOMContentLoaded', initializePage);
