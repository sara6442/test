// إدارة الفئات والـ Charts
class CategoryManager {
    constructor() {
        this.categories = JSON.parse(localStorage.getItem('categories')) || this.getDefaultCategories();
        this.saveCategories();
    }
    
    getDefaultCategories() {
        return {
            personal: {
                name: 'المهام الشخصية',
                color: '#4a90e2',
                totalMinutes: 120, // ساعتين
                enabled: true,
                usedMinutes: 0
            },
            work: {
                name: 'العمل',
                color: '#7b68ee',
                totalMinutes: 480, // 8 ساعات
                enabled: true,
                usedMinutes: 0
            },
            study: {
                name: 'الدراسة',
                color: '#2ecc71',
                totalMinutes: 180, // 3 ساعات
                enabled: true,
                usedMinutes: 0
            },
            health: {
                name: 'الصحة',
                color: '#e74c3c',
                totalMinutes: 60, // ساعة واحدة
                enabled: true,
                usedMinutes: 0
            }
        };
    }
    
    saveCategories() {
        localStorage.setItem('categories', JSON.stringify(this.categories));
    }
    
    updateCategory(categoryId, updates) {
        if (this.categories[categoryId]) {
            this.categories[categoryId] = { ...this.categories[categoryId], ...updates };
            this.saveCategories();
            return true;
        }
        return false;
    }
    
    getCategory(categoryId) {
        return this.categories[categoryId] || null;
    }
    
    getAllCategories() {
        return this.categories;
    }
    
    calculateUsedTime(categoryId) {
        const categoryTasks = getTasksByCategory(categoryId);
        const totalMinutes = categoryTasks.reduce((sum, task) => {
            return sum + (task.completed ? task.duration : 0);
        }, 0);
        
        this.updateCategory(categoryId, { usedMinutes: totalMinutes });
        return totalMinutes;
    }
    
    getRemainingTime(categoryId) {
        const category = this.getCategory(categoryId);
        if (!category) return 0;
        
        const remaining = category.totalMinutes - category.usedMinutes;
        return Math.max(0, remaining);
    }
    
    getPercentage(categoryId) {
        const category = this.getCategory(categoryId);
        if (!category || category.totalMinutes === 0) return 0;
        
        return Math.round((category.usedMinutes / category.totalMinutes) * 100);
    }
    
    canAddTask(categoryId, duration) {
        const category = this.getCategory(categoryId);
        if (!category || !category.enabled) return false;
        
        const remaining = this.getRemainingTime(categoryId);
        return remaining >= duration;
    }
    
    getStatus(categoryId) {
        const category = this.getCategory(categoryId);
        if (!category) return 'غير موجود';
        
        if (!category.enabled) return 'معطلة';
        
        const percentage = this.getPercentage(categoryId);
        if (percentage >= 100) return 'ممتلئة';
        if (percentage >= 80) return 'شبه ممتلئة';
        return 'متاحة';
    }
    
    formatTime(minutes) {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        
        if (hours > 0 && mins > 0) {
            return `${hours} ساعة ${mins} دقيقة`;
        } else if (hours > 0) {
            return `${hours} ساعة`;
        } else {
            return `${mins} دقيقة`;
        }
    }
}

// إنشاء كائن عالمي لإدارة الفئات
const categoryManager = new CategoryManager();

// دالة لتحميل إعدادات Chart
function loadChartSettings(categoryId) {
    const category = categoryManager.getCategory(categoryId);
    if (!category) return;
    
    // تحديث النموذج
    document.getElementById('total-hours').value = Math.floor(category.totalMinutes / 60);
    document.getElementById('total-minutes').value = category.totalMinutes % 60;
    document.getElementById('category-color').value = category.color;
    document.getElementById('category-enabled').checked = category.enabled;
    document.getElementById('status-text').textContent = category.enabled ? 'مفعلة' : 'معطلة';
    
    // تحديث الإحصائيات
    const usedMinutes = categoryManager.calculateUsedTime(categoryId);
    const remainingMinutes = categoryManager.getRemainingTime(categoryId);
    const percentage = categoryManager.getPercentage(categoryId);
    const taskCount = getTasksByCategory(categoryId).length;
    
    document.getElementById('used-time').textContent = categoryManager.formatTime(usedMinutes);
    document.getElementById('remaining-time').textContent = categoryManager.formatTime(remainingMinutes);
    document.getElementById('percentage').textContent = `${percentage}%`;
    document.getElementById('task-count').textContent = taskCount;
    
    // تحديث ألوان العناصر
    document.querySelectorAll('.time-input').forEach(el => {
        el.style.borderColor = category.color;
    });
}

// حفظ إعدادات Chart
document.getElementById('chart-settings-form')?.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const categoryId = document.getElementById('selected-chart').value;
    const hours = parseInt(document.getElementById('total-hours').value) || 0;
    const minutes = parseInt(document.getElementById('total-minutes').value) || 0;
    const totalMinutes = (hours * 60) + minutes;
    const color = document.getElementById('category-color').value;
    const enabled = document.getElementById('category-enabled').checked;
    
    categoryManager.updateCategory(categoryId, {
        totalMinutes,
        color,
        enabled
    });
    
    // تحديث الواجهة
    updateAllCharts();
    document.getElementById('chart-settings-modal').style.display = 'none';
    
    // إعادة تحميل المهام إذا كان هناك تغيير
    if (typeof loadTasks === 'function') {
        loadTasks();
    }
});

// تحديث جميع Charts
function updateAllCharts() {
    Object.keys(categoryManager.getAllCategories()).forEach(categoryId => {
        updateCategoryChart(categoryId);
    });
}

// تحديث Chart لفئة محددة
function updateCategoryChart(categoryId) {
    const category = categoryManager.getCategory(categoryId);
    if (!category) return;
    
    const ctx = document.getElementById(`${categoryId}-chart`);
    if (!ctx) return;
    
    // حساب النسب
    const usedMinutes = categoryManager.calculateUsedTime(categoryId);
    const percentage = categoryManager.getPercentage(categoryId);
    const remainingMinutes = categoryManager.getRemainingTime(categoryId);
    const status = categoryManager.getStatus(categoryId);
    
    // إذا كان الرسم البياني موجوداً، قم بتدميره أولاً
    if (window[`${categoryId}Chart`]) {
        window[`${categoryId}Chart`].destroy();
    }
    
    // إنشاء الرسم البياني
    const chartType = category.enabled ? 'doughnut' : 'doughnut';
    const backgroundColor = category.enabled ? [category.color, '#f0f0f0'] : ['#cccccc', '#f0f0f0'];
    
    window[`${categoryId}Chart`] = new Chart(ctx, {
        type: chartType,
        data: {
            datasets: [{
                data: [usedMinutes, Math.max(0, category.totalMinutes - usedMinutes)],
                backgroundColor: backgroundColor,
                borderWidth: 0,
                cutout: '70%'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const value = context.raw;
                            const hours = Math.floor(value / 60);
                            const minutes = value % 60;
                            
                            if (context.dataIndex === 0) {
                                return `مستخدم: ${hours > 0 ? hours + 'س ' : ''}${minutes}د`;
                            } else {
                                return `متبقي: ${hours > 0 ? hours + 'س ' : ''}${minutes}د`;
                            }
                        }
                    }
                }
            }
        }
    });
    
    // إضافة النسبة المئوية في المركز
    Chart.register({
        id: 'centerText',
        afterDraw: (chart) => {
            const { ctx, width, height } = chart;
            ctx.restore();
            
            // النسبة المئوية
            ctx.font = 'bold 20px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = category.enabled ? category.color : '#666';
            ctx.fillText(`${percentage}%`, width / 2, height / 2 - 10);
            
            // النص
            ctx.font = '12px Arial';
            ctx.fillText(category.enabled ? 'مكتمل' : 'معطل', width / 2, height / 2 + 15);
            
            ctx.save();
        }
    });
    
    // تحديث العناصر المرئية
    const wrapper = document.querySelector(`[data-category="${categoryId}"]`);
    const progressFill = wrapper?.querySelector('.progress-fill');
    const progressText = wrapper?.querySelector('.progress-text');
    const timeInfo = wrapper?.querySelector('.chart-time-info span:first-child');
    const statusElement = wrapper?.querySelector('.chart-time-info .status');
    
    if (progressFill) {
        progressFill.style.width = `${percentage}%`;
        progressFill.style.backgroundColor = category.color;
    }
    
    if (progressText) {
        progressText.textContent = `${percentage}% مكتمل`;
    }
    
    if (timeInfo) {
        const totalFormatted = categoryManager.formatTime(category.totalMinutes);
        const usedFormatted = categoryManager.formatTime(usedMinutes);
        timeInfo.innerHTML = `<i class="far fa-clock"></i> ${usedFormatted}/${totalFormatted}`;
    }
    
    if (statusElement) {
        statusElement.textContent = status;
        statusElement.className = 'status';
        
        switch(status) {
            case 'ممتلئة':
                statusElement.classList.add('status-full');
                wrapper?.classList.add('locked');
                break;
            case 'شبه ممتلئة':
                statusElement.classList.add('status-warning');
                wrapper?.classList.remove('locked');
                break;
            case 'متاحة':
                statusElement.classList.add('status-available');
                wrapper?.classList.remove('locked');
                break;
            case 'معطلة':
                wrapper?.classList.add('chart-disabled');
                break;
            default:
                wrapper?.classList.remove('chart-disabled', 'locked');
        }
    }
    
    // تحديث زر الإضافة
    const addButton = wrapper?.querySelector('.btn-add-to-category');
    if (addButton) {
        if (!category.enabled || percentage >= 100) {
            addButton.disabled = true;
            addButton.innerHTML = '<i class="fas fa-lock"></i> غير متاح';
        } else {
            addButton.disabled = false;
            addButton.innerHTML = '<i class="fas fa-plus"></i> إضافة مهمة لهذه الفئة';
        }
    }
}

// تعديل دالة حفظ المهمة للتحقق من الحدود
const originalSaveTask = window.saveTask;
window.saveTask = function(task) {
    // التحقق إذا كان يمكن إضافة المهمة للفئة
    if (!categoryManager.canAddTask(task.category, task.duration)) {
        const category = categoryManager.getCategory(task.category);
        const remaining = categoryManager.getRemainingTime(task.category);
        
        alert(`❌ لا يمكن إضافة هذه المهمة!\nالمدة المطلوبة: ${task.duration} دقيقة\nالوقت المتبقي في الفئة: ${remaining} دقيقة`);
        return null;
    }
    
    // حفظ المهمة
    const savedTask = originalSaveTask(task);
    
    // تحديث Charts
    updateCategoryChart(task.category);
    
    return savedTask;
};

// تعديل دالة toggleTaskComplete
const originalToggleComplete = window.toggleTaskComplete;
window.toggleTaskComplete = function(id) {
    originalToggleComplete(id);
    
    // تحديث Charts بعد تغيير حالة المهمة
    const task = tasks.find(t => t.id === id);
    if (task) {
        updateCategoryChart(task.category);
    }
};

// تهيئة Charts عند تحميل الصفحة
function initCharts() {
    // تحديث الأوقات المستخدمة أولاً
    Object.keys(categoryManager.getAllCategories()).forEach(categoryId => {
        categoryManager.calculateUsedTime(categoryId);
    });
    
    // تحديث جميع Charts
    updateAllCharts();
}

// عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    if (typeof initCharts === 'function') {
        initCharts();
    }
});

// دالة لتحميل إعدادات Chart (تأكد من وجودها)
function loadChartSettings(categoryId) {
    const category = categoryManager.getCategory(categoryId);
    if (!category) return;
    
    // تحديث النموذج
    document.getElementById('total-hours').value = Math.floor(category.totalMinutes / 60);
    document.getElementById('total-minutes').value = category.totalMinutes % 60;
    document.getElementById('category-color').value = category.color;
    document.getElementById('category-enabled').checked = category.enabled;
    
    // تحديث نص الحالة
    const statusText = document.getElementById('status-text');
    if (statusText) {
        statusText.textContent = category.enabled ? 'مفعلة' : 'معطلة';
    }
    
    // تحديث الإحصائيات
    const usedMinutes = categoryManager.calculateUsedTime(categoryId);
    const remainingMinutes = categoryManager.getRemainingTime(categoryId);
    const percentage = categoryManager.getPercentage(categoryId);
    const taskCount = getTasksByCategory(categoryId).length;
    
    // تحديث العناصر
    const usedTimeEl = document.getElementById('used-time');
    const remainingTimeEl = document.getElementById('remaining-time');
    const percentageEl = document.getElementById('percentage');
    const taskCountEl = document.getElementById('task-count');
    
    if (usedTimeEl) usedTimeEl.textContent = categoryManager.formatTime(usedMinutes);
    if (remainingTimeEl) remainingTimeEl.textContent = categoryManager.formatTime(remainingMinutes);
    if (percentageEl) percentageEl.textContent = `${percentage}%`;
    if (taskCountEl) taskCountEl.textContent = taskCount;
}

// تعريف الدوال للنافذة العالمية
window.loadChartSettings = loadChartSettings;

// عند تحميل الصفحة، تأكد من تحديث Charts
document.addEventListener('DOMContentLoaded', function() {
    // انتظر قليلاً لضمان تحميل جميع الملفات
    setTimeout(() => {
        if (typeof initCharts === 'function') {
            initCharts();
        }
    }, 100);
});

// تعريف الدوال للنافذة العالمية
window.categoryManager = categoryManager;
window.updateAllCharts = updateAllCharts;
window.updateCategoryChart = updateCategoryChart;
window.initCharts = initCharts;
window.loadChartSettings = loadChartSettings;
