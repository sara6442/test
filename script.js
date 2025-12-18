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
        });
    });
    
    // إدارة نافذة المهام
    const taskModal = document.getElementById('task-modal');
    const addTaskBtn = document.getElementById('add-task-btn');
    const cancelTaskBtn = document.getElementById('cancel-task');
    const taskForm = document.getElementById('task-form');
    
    addTaskBtn.addEventListener('click', () => {
        taskModal.style.display = 'flex';
    });
    
    cancelTaskBtn.addEventListener('click', () => {
        taskModal.style.display = 'none';
        taskForm.reset();
    });
    
    // إغلاق النافذة عند النقر خارجها
    window.addEventListener('click', (e) => {
        if (e.target === taskModal) {
            taskModal.style.display = 'none';
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
        
        // حفظ المهمة (سيتم دمجه مع taskManager.js)
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
        
        if (typeof updateCharts === 'function') {
            updateCharts();
        }
    });
    
    // تهيئة التطبيق
    if (typeof initApp === 'function') {
        initApp();
    }
});
