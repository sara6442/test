// التطبيق الرئيسي
document.addEventListener('DOMContentLoaded', function() {
    // تحديث التاريخ والوقت
    function updateDateTime() {
        const now = new Date();
        const dateStr = now.toLocaleDateString('ar-SA', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        const timeStr = now.toLocaleTimeString('ar-SA', {
            hour: '2-digit',
            minute: '2-digit'
        });
        
        document.getElementById('current-date').textContent = dateStr;
        document.getElementById('current-time').textContent = timeStr;
    }
    
    updateDateTime();
    setInterval(updateDateTime, 60000);
    
    // إدارة النوافذ
    const views = document.querySelectorAll('.nav-menu li[data-view]');
    const contentViews = document.querySelectorAll('.content-view');
    
    views.forEach(view => {
        view.addEventListener('click', function() {
            const viewId = this.getAttribute('data-view');
            
            // تحديث القائمة النشطة
            views.forEach(v => v.classList.remove('active'));
            this.classList.add('active');
            
            // إظهار العرض المحدد
            contentViews.forEach(v => v.classList.remove('active'));
            document.getElementById(`${viewId}-view`).classList.add('active');
            
            // إذا كانت نافذة Charts، قم بتحديثها
            if (viewId === 'charts' && typeof updateAllCharts === 'function') {
                updateAllCharts();
            }
        });
    });
    
    // إدارة نافذة المهام
    const taskModal = document.getElementById('task-modal');
    const addTaskBtn = document.getElementById('add-task-btn');
    const cancelTaskBtn = document.getElementById('cancel-task');
    const taskForm = document.getElementById('task-form');
    
    addTaskBtn.addEventListener('click', () => {
        taskModal.style.display = 'flex';
        // إعادة تعيين الفئة إلى الافتراضي
        document.getElementById('task-category').value = 'personal';
    });
    
    cancelTaskBtn.addEventListener('click', () => {
        taskModal.style.display = 'none';
        taskForm.reset();
    });
    
    // إغلاق النافذة عند النقر خارجها
    window.addEventListener('click', (e) => {
        if (e.target === taskModal || e.target === document.getElementById('chart-settings-modal')) {
            taskModal.style.display = 'none';
            document.getElementById('chart-settings-modal').style.display = 'none';
            taskForm.reset();
        }
    });
    
    // معالجة إضافة مهمة
    taskForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const taskData = {
            id: Date.now(),
            title: document.getElementById('task-title').value,
            category: document.getElementById('task-category').value,
            duration: parseInt(document.getElementById('task-duration').value),
            time: document.getElementById('task-time').value,
            repeat: document.getElementById('task-repeat').value,
            completed: false,
            createdAt: new Date().toISOString()
        };
        
        // التحقق من الحدود باستخدام categoryManager
        if (typeof categoryManager !== 'undefined' && 
            typeof categoryManager.canAddTask === 'function') {
            
            if (!categoryManager.canAddTask(taskData.category, taskData.duration)) {
                const category = categoryManager.getCategory(taskData.category);
                const remaining = categoryManager.getRemainingTime(taskData.category);
                
                alert(`❌ لا يمكن إضافة هذه المهمة!\nالمدة المطلوبة: ${taskData.duration} دقيقة\nالوقت المتبقي في الفئة: ${remaining} دقيقة`);
                return;
            }
        }
        
        // حفظ المهمة
        if (typeof saveTask === 'function') {
            saveTask(taskData);
        }
        
        taskModal.style.display = 'none';
        this.reset();
        
        // إعادة تحميل العروض
        if (typeof loadTasks === 'function') {
            loadTasks();
        }
        
        if (typeof loadCalendar === 'function') {
            loadCalendar();
        }
        
        if (typeof updateAllCharts === 'function') {
            updateAllCharts();
        }
    });
    
    // تهيئة التطبيق
    if (typeof initApp === 'function') {
        initApp();
    }
    
    if (typeof initCharts === 'function') {
        initCharts();
    }
});

// دالة لفتح إعدادات Chart
function openChartSettings(category) {
    document.getElementById('chart-settings-modal').style.display = 'flex';
    document.getElementById('selected-chart').value = category;
    if (typeof loadChartSettings === 'function') {
        loadChartSettings(category);
    }
}

// دالة لفتح إضافة مهمة لفئة محددة
function openAddTaskForCategory(category) {
    // التحقق إذا كانت الفئة ممتلئة
    if (typeof categoryManager !== 'undefined') {
        const categoryData = categoryManager.getCategory(category);
        if (categoryData && categoryData.usedMinutes >= categoryData.totalMinutes && categoryData.totalMinutes > 0) {
            alert(`❌ لا يمكن إضافة مهام جديدة لهذه الفئة!\nلقد وصلت إلى الحد الأقصى للوقت`);
            return;
        }
    }
    
    // فتح نافذة إضافة مهمة مع تحديد الفئة
    document.getElementById('task-modal').style.display = 'flex';
    document.getElementById('task-category').value = category;
}

// تعريف الدوال للنافذة العالمية
window.openChartSettings = openChartSettings;
window.openAddTaskForCategory = openAddTaskForCategory;
