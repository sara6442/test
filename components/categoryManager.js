// إدارة الفئات والـ Charts
class CategoryManager {
    constructor() {
        this.categories = JSON.parse(localStorage.getItem('categories')) || this.getDefaultCategories();
        this.selectedCategory = 'personal';
        this.saveCategories();
        this.initEvents();
    }
    
    getDefaultCategories() {
        return {
            personal: {
                name: 'المهام الشخصية',
                color: '#4a90e2',
                totalMinutes: 120, // ساعتان
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
            
            // تحديث الواجهة إذا لزم الأمر
            if (updates.enabled !== undefined || updates.name !== undefined || updates.color !== undefined) {
                this.updateMiniCategories();
                if (typeof updateTaskCategoryOptions === 'function') {
                    updateTaskCategoryOptions();
                }
            }
            
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
    
    getEnabledCategories() {
        return Object.keys(this.categories)
            .filter(catId => this.categories[catId].enabled)
            .reduce((obj, catId) => {
                obj[catId] = this.categories[catId];
                return obj;
            }, {});
    }
    
    getSelectedCategory() {
        return this.selectedCategory;
    }
    
    setSelectedCategory(categoryId) {
        if (this.categories[categoryId] && this.categories[categoryId].enabled) {
            this.selectedCategory = categoryId;
            return true;
        }
        return false;
    }
    
    calculateUsedTime(categoryId) {
        const categoryTasks = getTasksByCategory ? getTasksByCategory(categoryId) : [];
        const today = new Date().toDateString();
        
        // حساب المهام المكتملة لهذا اليوم فقط
        const totalMinutes = categoryTasks.reduce((sum, task) => {
            const taskDate = new Date(task.createdAt).toDateString();
            if (taskDate === today && task.completed) {
                return sum + task.duration;
            }
            return sum;
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
        
        return Math.min(100, Math.round((category.usedMinutes / category.totalMinutes) * 100));
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
    
    initEvents() {
        // تأخير تهيئة الأحداث حتى يتم تحميل الصفحة بالكامل
        setTimeout(() => {
            // أحداث الفئات المصغرة
            this.updateMiniCategories();
            
            // حدث زر الإعدادات
            document.getElementById('category-settings-btn')?.addEventListener('click', () => {
                this.openSettings(this.selectedCategory);
            });
            
            // حدث إضافة مهمة للفئة المحددة
            document.getElementById('add-task-selected-category')?.addEventListener('click', () => {
                this.openAddTaskForCategory(this.selectedCategory);
            });
            
            // حدث إغلاق النوافذ
            document.getElementById('close-settings-modal')?.addEventListener('click', () => {
                document.getElementById('chart-settings-modal').style.display = 'none';
            });
            
            // حدث حفظ الإعدادات
            document.getElementById('chart-settings-form')?.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveSettings();
            });
            
            // حدث تغيير الفئة المحددة في الإعدادات
            document.getElementById('selected-chart')?.addEventListener('change', (e) => {
                this.loadSettings(e.target.value);
            });
        }, 100);
    }
    
    updateMiniCategories() {
        const container = document.querySelector('.mini-categories-list');
        if (!container) return;
        
        let html = '';
        const enabledCategories = this.getEnabledCategories();
        
        Object.keys(enabledCategories).forEach(categoryId => {
            const category = enabledCategories[categoryId];
            const isActive = this.selectedCategory === categoryId;
            
            html += `
                <div class="mini-category ${isActive ? 'active' : ''}" data-category="${categoryId}">
                    <div class="mini-color" style="background: ${category.color};"></div>
                    <span class="mini-name">${category.name}</span>
                </div>
            `;
        });
        
        container.innerHTML = html;
        
        // إعادة إضافة الأحداث
        document.querySelectorAll('.mini-category').forEach(miniCat => {
            miniCat.addEventListener('click', (e) => {
                const categoryId = e.currentTarget.dataset.category;
                this.selectCategory(categoryId);
            });
        });
    }
    
    selectCategory(categoryId) {
        if (this.setSelectedCategory(categoryId)) {
            // تحديث الفئات النشطة
            document.querySelectorAll('.mini-category').forEach(cat => {
                cat.classList.remove('active');
                if (cat.dataset.category === categoryId) {
                    cat.classList.add('active');
                }
            });
            
            // تحديث اسم الفئة
            const categoryName = document.getElementById('selected-category-name');
            if (categoryName) {
                const category = this.getCategory(categoryId);
                categoryName.textContent = category.name;
            }
            
            // تحديث Chart الفئة المحددة
            this.updateSelectedCategoryChart();
        }
    }
    
    updateSelectedCategoryChart() {
        const category = this.getCategory(this.selectedCategory);
        if (!category) return;
        
        const ctx = document.getElementById('selected-category-chart');
        if (!ctx) return;
        
        // حساب النسب
        const usedMinutes = this.calculateUsedTime(this.selectedCategory);
        const percentage = this.getPercentage(this.selectedCategory);
        const remainingMinutes = this.getRemainingTime(this.selectedCategory);
        const taskCount = getTasksByCategory ? getTasksByCategory(this.selectedCategory).length : 0;
        
        // تدمير Chart السابق
        if (window.selectedCategoryChart) {
            window.selectedCategoryChart.destroy();
        }
        
        // إنشاء Chart جديد
        window.selectedCategoryChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                datasets: [{
                    data: [usedMinutes, Math.max(0, category.totalMinutes - usedMinutes)],
                    backgroundColor: category.enabled ? [category.color, '#f0f0f0'] : ['#cccccc', '#f0f0f0'],
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
                                const label = context.dataset.label || '';
                                const value = context.raw;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = Math.round((value / total) * 100);
                                return `${label}: ${value} دقيقة (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
        
        // تحديث التفاصيل
        this.updateCategoryDetails(category, usedMinutes, remainingMinutes, percentage, taskCount);
    }
    
    updateCategoryDetails(category, usedMinutes, remainingMinutes, percentage, taskCount) {
        const usedTimeEl = document.getElementById('category-used-time');
        const remainingTimeEl = document.getElementById('category-remaining-time');
        const percentageEl = document.getElementById('category-percentage');
        const taskCountEl = document.getElementById('category-task-count');
        
        if (usedTimeEl) usedTimeEl.textContent = this.formatTime(usedMinutes);
        if (remainingTimeEl) remainingTimeEl.textContent = this.formatTime(remainingMinutes);
        if (percentageEl) percentageEl.textContent = `${percentage}%`;
        if (taskCountEl) taskCountEl.textContent = taskCount;
    }
    
    openSettings(categoryId) {
        const modal = document.getElementById('chart-settings-modal');
        if (modal) {
            modal.style.display = 'flex';
            this.loadSettings(categoryId);
        }
    }
    
    loadSettings(categoryId) {
        const category = this.getCategory(categoryId);
        if (!category) return;
        
        // تحديث خيارات الفئات
        const selectEl = document.getElementById('selected-chart');
        if (selectEl) {
            selectEl.innerHTML = '';
            Object.keys(this.categories).forEach(catId => {
                const cat = this.categories[catId];
                const option = document.createElement('option');
                option.value = catId;
                option.textContent = cat.name;
                if (catId === categoryId) {
                    option.selected = true;
                }
                selectEl.appendChild(option);
            });
        }
        
        document.getElementById('total-hours').value = Math.floor(category.totalMinutes / 60);
        document.getElementById('total-minutes').value = category.totalMinutes % 60;
        document.getElementById('category-color').value = category.color;
        document.getElementById('category-enabled').checked = category.enabled;
        document.getElementById('status-text').textContent = category.enabled ? 'مفعلة' : 'معطلة';
        
        // تحديث الإحصائيات
        const usedMinutes = this.calculateUsedTime(categoryId);
        const remainingMinutes = this.getRemainingTime(categoryId);
        const percentage = this.getPercentage(categoryId);
        const taskCount = getTasksByCategory ? getTasksByCategory(categoryId).length : 0;
        
        document.getElementById('used-time').textContent = this.formatTime(usedMinutes);
        document.getElementById('remaining-time').textContent = this.formatTime(remainingMinutes);
        document.getElementById('percentage').textContent = `${percentage}%`;
        document.getElementById('task-count').textContent = taskCount;
    }
    
    saveSettings() {
        const categoryId = document.getElementById('selected-chart').value;
        const hours = parseInt(document.getElementById('total-hours').value) || 0;
        const minutes = parseInt(document.getElementById('total-minutes').value) || 0;
        const totalMinutes = (hours * 60) + minutes;
        const color = document.getElementById('category-color').value;
        const enabled = document.getElementById('category-enabled').checked;
        
        this.updateCategory(categoryId, {
            totalMinutes,
            color,
            enabled
        });
        
        // تحديث الواجهة
        this.updateSelectedCategoryChart();
        document.getElementById('chart-settings-modal').style.display = 'none';
        
        // إعادة تحميل المهام إذا كان هناك تغيير
        if (typeof loadTasks === 'function') {
            loadTasks();
        }
    }
    
    openAddTaskForCategory(categoryId) {
        // التحقق إذا كانت الفئة ممتلئة
        if (!this.canAddTask(categoryId, 1)) {
            const category = this.getCategory(categoryId);
            const remaining = this.getRemainingTime(categoryId);
            
            alert(`❌ لا يمكن إضافة مهام جديدة لهذه الفئة!\nالمتبقي: ${this.formatTime(remaining)}\nالحالة: ${this.getStatus(categoryId)}`);
            return;
        }
        
        // فتح نافذة إضافة مهمة مع تحديد الفئة
        const taskModal = document.getElementById('task-modal');
        const taskCategorySelect = document.getElementById('task-category');
        
        if (taskModal && taskCategorySelect) {
            taskModal.style.display = 'flex';
            taskCategorySelect.value = categoryId;
        }
    }
    
    // إدارة الفئات (الدوال الجديدة)
    loadCategoriesView() {
        const container = document.querySelector('.categories-list');
        if (!container) return;
        
        let html = '';
        Object.keys(this.categories).forEach(categoryId => {
            const category = this.categories[categoryId];
            const usedMinutes = this.calculateUsedTime(categoryId);
            const percentage = this.getPercentage(categoryId);
            const taskCount = getTasksByCategory ? getTasksByCategory(categoryId).length : 0;
            
            html += `
                <div class="category-card" data-category="${categoryId}">
                    <div class="category-header">
                        <div class="category-color" style="background: ${category.color};"></div>
                        <h4>${category.name}</h4>
                        <span class="category-status ${category.enabled ? 'enabled' : 'disabled'}">
                            ${category.enabled ? 'مفعلة' : 'معطلة'}
                        </span>
                    </div>
                    
                    <div class="category-stats">
                        <div class="stat">
                            <span class="label">السعة:</span>
                            <span class="value">${this.formatTime(category.totalMinutes)}</span>
                        </div>
                        <div class="stat">
                            <span class="label">المستخدم:</span>
                            <span class="value">${this.formatTime(usedMinutes)}</span>
                        </div>
                        <div class="stat">
                            <span class="label">المهام:</span>
                            <span class="value">${taskCount}</span>
                        </div>
                    </div>
                    
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${percentage}%; background: ${category.color};"></div>
                        <span class="progress-text">${percentage}%</span>
                    </div>
                    
                    <div class="category-actions">
                        <button class="btn-edit" data-category="${categoryId}">
                            <i class="fas fa-edit"></i> تعديل
                        </button>
                        <button class="btn-view-tasks" data-category="${categoryId}">
                            <i class="fas fa-tasks"></i> المهام
                        </button>
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html;
        
        // تحديث الملخص
        this.updateCategoriesSummary();
        
        // إضافة الأحداث
        this.attachCategoriesEvents();
    }
    
    updateCategoriesSummary() {
        const totalCategories = Object.keys(this.categories).length;
        let totalCapacity = 0;
        let totalUsed = 0;
        
        Object.keys(this.categories).forEach(categoryId => {
            const category = this.categories[categoryId];
            const usedMinutes = this.calculateUsedTime(categoryId);
            
            totalCapacity += category.totalMinutes;
            totalUsed += usedMinutes;
        });
        
        document.getElementById('total-categories').textContent = totalCategories;
        document.getElementById('total-capacity').textContent = this.formatTime(totalCapacity);
        document.getElementById('total-used').textContent = this.formatTime(totalUsed);
        document.getElementById('total-remaining').textContent = this.formatTime(totalCapacity - totalUsed);
    }
    
    attachCategoriesEvents() {
        // أحداث أزرار التعديل
        document.querySelectorAll('.btn-edit').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const categoryId = e.currentTarget.dataset.category;
                this.openCategoryModal(categoryId, 'edit');
            });
        });
        
        // أحداث عرض المهام
        document.querySelectorAll('.btn-view-tasks').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const categoryId = e.currentTarget.dataset.category;
                this.selectCategory(categoryId);
                // الانتقال لعرض المهام
                document.querySelector('.nav-menu li[data-view="tasks"]').click();
            });
        });
    }
    
    openCategoryModal(categoryId = null, mode = 'add') {
        const modal = document.getElementById('category-modal');
        const title = document.getElementById('category-modal-title');
        const form = document.getElementById('category-form');
        const deleteBtn = document.getElementById('delete-category');
        
        if (mode === 'add') {
            title.textContent = 'إضافة فئة جديدة';
            form.reset();
            document.getElementById('category-color').value = this.generateRandomColor();
            document.getElementById('category-hours').value = 2;
            document.getElementById('capacity-value').textContent = '2 ساعة';
            document.getElementById('category-enabled').checked = true;
            document.getElementById('category-id').value = '';
            deleteBtn.style.display = 'none';
        } else {
            const category = this.getCategory(categoryId);
            if (!category) return;
            
            title.textContent = 'تعديل الفئة';
            document.getElementById('category-name').value = category.name;
            document.getElementById('category-color').value = category.color;
            document.getElementById('category-hours').value = category.totalMinutes / 60;
            document.getElementById('capacity-value').textContent = `${category.totalMinutes / 60} ساعة`;
            document.getElementById('category-enabled').checked = category.enabled;
            document.getElementById('category-id').value = categoryId;
            deleteBtn.style.display = 'block';
        }
        
        modal.style.display = 'flex';
    }
    
    generateRandomColor() {
        const colors = ['#4a90e2', '#7b68ee', '#2ecc71', '#e74c3c', '#f39c12', '#9b59b6', '#1abc9c', '#34495e'];
        return colors[Math.floor(Math.random() * colors.length)];
    }
}

// إنشاء كائن عالمي لإدارة الفئات
const categoryManager = new CategoryManager();

// تحديث Chart اليومي
function updateDailyChart() {
    const ctx = document.getElementById('daily-summary-chart');
    if (!ctx) return;
    
    const allTasks = getAllTasks ? getAllTasks() : [];
    const todayTasks = getTasksByDate ? getTasksByDate() : [];
    const completedTasks = todayTasks.filter(task => task.completed).length;
    const totalTime = todayTasks.reduce((sum, task) => sum + task.duration, 0);
    const completionRate = todayTasks.length > 0 ? Math.round((completedTasks / todayTasks.length) * 100) : 0;
    
    // توزيع المهام حسب الفئة
    const categoryDistribution = {};
    todayTasks.forEach(task => {
        const categoryName = getCategoryName ? getCategoryName(task.category) : task.category;
        categoryDistribution[categoryName] = (categoryDistribution[categoryName] || 0) + 1;
    });
    
    // تدمير Chart السابق
    if (window.dailyChart) {
        window.dailyChart.destroy();
    }
    
    // الحصول على الألوان من الفئات
    const labels = Object.keys(categoryDistribution);
    const colors = labels.map(label => {
        // البحث عن اللون من الفئة
        if (typeof categoryManager !== 'undefined') {
            const categories = categoryManager.getAllCategories();
            const category = Object.values(categories).find(cat => cat.name === label);
            return category ? category.color : '#4a90e2';
        }
        return '#4a90e2';
    });
    
    // إنشاء Chart جديد
    window.dailyChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: Object.values(categoryDistribution),
                backgroundColor: colors,
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        font: {
                            size: 14
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.raw;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = Math.round((value / total) * 100);
                            return `${label}: ${value} مهمة (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
    
    // تحديث الإحصائيات
    const totalTasksEl = document.getElementById('daily-total-tasks');
    const totalTimeEl = document.getElementById('daily-total-time');
    const completionEl = document.getElementById('daily-completion');
    
    if (totalTasksEl) totalTasksEl.textContent = todayTasks.length;
    if (totalTimeEl) totalTimeEl.textContent = `${Math.round(totalTime / 60)} س`;
    if (completionEl) completionEl.textContent = `${completionRate}%`;
}

// تهيئة Charts عند تحميل الصفحة
function initCharts() {
    console.log('تهيئة Charts...');
    
    // تحديث الفئات المصغرة
    categoryManager.updateMiniCategories();
    
    // تحديد الفئة الأولى
    categoryManager.selectCategory('personal');
    
    // تحديث Chart اليومي
    updateDailyChart();
    
    // تحديث Chart الفئة المحددة
    categoryManager.updateSelectedCategoryChart();
}

// تعريف الدوال للنافذة العالمية
window.categoryManager = categoryManager;
window.initCharts = initCharts;
window.updateDailyChart = updateDailyChart;
