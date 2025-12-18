// التطبيق الرئيسي
document.addEventListener('DOMContentLoaded', function() {
    console.log('تهيئة التطبيق...');
    
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
        
        const dateElement = document.getElementById('current-date');
        const timeElement = document.getElementById('current-time');
        
        if (dateElement) dateElement.textContent = dateStr;
        if (timeElement) timeElement.textContent = timeStr;
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
            
            // تحديث المحتوى بناءً على العرض
            switch(viewId) {
                case 'tasks':
                    if (typeof loadTasks === 'function') loadTasks();
                    break;
                case 'calendar':
                    if (typeof updateCalendar === 'function') updateCalendar();
                    break;
                case 'charts':
                    if (typeof initCharts === 'function') initCharts();
                    break;
                case 'categories':
                    if (typeof categoryManager.loadCategoriesView === 'function') {
                        categoryManager.loadCategoriesView();
                    }
                    break;
            }
        });
    });
    
    // إدارة نافذة المهام
    const taskModal = document.getElementById('task-modal');
    const addTaskBtn = document.getElementById('add-task-btn');
    const cancelTaskBtn = document.getElementById('cancel-task');
    const closeTaskModalBtn = document.getElementById('close-task-modal');
    const taskForm = document.getElementById('task-form');
    
    if (addTaskBtn) {
        addTaskBtn.addEventListener('click', () => {
            if (taskModal) {
                taskModal.style.display = 'flex';
                // إعادة تعيين النموذج
                taskForm.reset();
                document.getElementById('task-duration').value = '30';
                document.getElementById('task-repeat').value = 'none';
            }
        });
    }
    
    if (cancelTaskBtn) {
        cancelTaskBtn.addEventListener('click', closeTaskModal);
    }
    
    if (closeTaskModalBtn) {
        closeTaskModalBtn.addEventListener('click', closeTaskModal);
    }
    
    function closeTaskModal() {
        if (taskModal) {
            taskModal.style.display = 'none';
            taskForm.reset();
        }
    }
    
    // إدارة نافذة الفئات
    const categoryModal = document.getElementById('category-modal');
    const addCategoryBtn = document.getElementById('add-category-btn');
    const categoryForm = document.getElementById('category-form');
    
    if (addCategoryBtn) {
        addCategoryBtn.addEventListener('click', () => {
            categoryManager.openCategoryModal(null, 'add');
        });
    }
    
    // أحداث تعديل سعة الفئة
    document.getElementById('category-hours')?.addEventListener('input', function() {
        const value = parseFloat(this.value);
        document.getElementById('capacity-value').textContent = `${value} ساعة`;
    });
    
    // حدث حذف الفئة
    document.getElementById('delete-category')?.addEventListener('click', function() {
        const categoryId = document.getElementById('category-id').value;
        if (categoryId && confirm('هل أنت متأكد من حذف هذه الفئة؟ سيتم حذف جميع المهام المرتبطة بها.')) {
            // حذف الفئة
            delete categoryManager.categories[categoryId];
            categoryManager.saveCategories();
            
            // حذف المهام المرتبطة
            const tasks = getAllTasks ? getAllTasks() : [];
            const updatedTasks = tasks.filter(task => task.category !== categoryId);
            localStorage.setItem('tasks', JSON.stringify(updatedTasks));
            
            // إغلاق النافذة وتحديث الواجهة
            categoryModal.style.display = 'none';
            categoryManager.loadCategoriesView();
            if (typeof loadTasks === 'function') loadTasks();
            if (typeof updateCalendar === 'function') updateCalendar();
        }
    });
    
    // حدث حفظ الفئة
    if (categoryForm) {
        categoryForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const categoryId = document.getElementById('category-id').value || 
                              'category_' + Date.now();
            const name = document.getElementById('category-name').value.trim();
            const color = document.getElementById('category-color').value;
            const hours = parseFloat(document.getElementById('category-hours').value);
            const enabled = document.getElementById('category-enabled').checked;
            
            if (!name) {
                alert('⚠️ الرجاء إدخال اسم الفئة');
                return;
            }
            
            categoryManager.updateCategory(categoryId, {
                name,
                color,
                totalMinutes: hours * 60,
                enabled
            });
            
            categoryModal.style.display = 'none';
            categoryManager.loadCategoriesView();
            
            alert('✅ تم حفظ الفئة بنجاح!');
        });
    }
    
    // إغلاق النافذة عند النقر خارجها
    window.addEventListener('click', (e) => {
        if (e.target === taskModal) closeTaskModal();
        if (e.target === document.getElementById('chart-settings-modal')) {
            document.getElementById('chart-settings-modal').style.display = 'none';
        }
        if (e.target === categoryModal) {
            categoryModal.style.display = 'none';
        }
    });
    
    // معالجة إضافة مهمة
    if (taskForm) {
        taskForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const taskData = {
                id: Date.now(),
                title: document.getElementById('task-title').value.trim(),
                description: document.getElementById('task-description').value.trim(),
                category: document.getElementById('task-category').value,
                duration: parseInt(document.getElementById('task-duration').value) || 30,
                time: document.getElementById('task-time').value,
                repeat: document.getElementById('task-repeat').value,
                completed: false,
                createdAt: new Date().toISOString()
            };
            
            // التحقق من صحة البيانات
            if (!taskData.title) {
                alert('⚠️ الرجاء إدخال عنوان المهمة');
                return;
            }
            
            if (taskData.duration <= 0) {
                alert('⚠️ المدة يجب أن تكون أكبر من صفر');
                return;
            }
            
            // التحقق من الحدود باستخدام categoryManager
            if (typeof categoryManager !== 'undefined' && 
                typeof categoryManager.canAddTask === 'function') {
                
                if (!categoryManager.canAddTask(taskData.category, taskData.duration)) {
                    const category = categoryManager.getCategory(taskData.category);
                    const remaining = categoryManager.getRemainingTime(taskData.category);
                    
                    alert(`❌ لا يمكن إضافة هذه المهمة!\nالمدة المطلوبة: ${taskData.duration} دقيقة\nالوقت المتبقي في الفئة: ${remaining} دقيقة\nسعة الفئة: ${category.totalMinutes} دقيقة`);
                    return;
                }
            }
            
            // حفظ المهمة
            if (typeof saveTask === 'function') {
                saveTask(taskData);
            }
            
            // إغلاق النافذة
            closeTaskModal();
            
            // إعادة تحميل العروض
            setTimeout(() => {
                if (typeof loadTasks === 'function') {
                    loadTasks();
                }
                
                if (typeof updateCalendar === 'function') {
                    updateCalendar();
                }
                
                if (typeof categoryManager !== 'undefined' && 
                    typeof categoryManager.updateSelectedCategoryChart === 'function') {
                    categoryManager.updateSelectedCategoryChart();
                }
                
                if (typeof updateDailyChart === 'function') {
                    updateDailyChart();
                }
            }, 100);
            
            alert('✅ تمت إضافة المهمة بنجاح!');
        });
    }
    
    // تهيئة إعدادات Charts
    document.getElementById('settings-toggle')?.addEventListener('click', function() {
        const modal = document.getElementById('chart-settings-modal');
        if (modal) {
            modal.style.display = 'flex';
            if (typeof categoryManager !== 'undefined' && 
                typeof categoryManager.loadSettings === 'function') {
                categoryManager.loadSettings(categoryManager.getSelectedCategory());
            }
        }
    });
    
    // تهيئة التطبيق
    setTimeout(() => {
        if (typeof initApp === 'function') initApp();
        if (typeof initCalendar === 'function') initCalendar();
        if (typeof initCharts === 'function') initCharts();
    }, 500);
});

// تعريف دالة لحذف المهمة
function deleteTaskHandler(taskId) {
    if (confirm('هل أنت متأكد من حذف هذه المهمة؟')) {
        if (typeof deleteTask === 'function') {
            const success = deleteTask(taskId);
            if (success) {
                if (typeof loadTasks === 'function') loadTasks();
                if (typeof updateCalendar === 'function') updateCalendar();
                if (typeof categoryManager !== 'undefined' && 
                    typeof categoryManager.updateSelectedCategoryChart === 'function') {
                    categoryManager.updateSelectedCategoryChart();
                }
                if (typeof updateDailyChart === 'function') updateDailyChart();
                alert('🗑️ تم حذف المهمة بنجاح!');
            }
        }
    }
}

window.deleteTaskHandler = deleteTaskHandler;
