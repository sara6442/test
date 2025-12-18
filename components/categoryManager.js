// بعد تعريف class CategoryManager، أضف:

// تحديث الرسوم البيانية بعد إضافة مهمة
function updateAllCharts() {
    if (typeof updateDailyChart === 'function') {
        updateDailyChart();
    }
    
    if (typeof categoryManager !== 'undefined' && 
        typeof categoryManager.updateSelectedCategoryChart === 'function') {
        categoryManager.updateSelectedCategoryChart();
    }
    
    if (typeof categoryManager !== 'undefined' && 
        typeof categoryManager.updateMiniCategories === 'function') {
        categoryManager.updateMiniCategories();
    }
}

// تحديث Chart اليومي بشكل صحيح
function updateDailyChart() {
    const ctx = document.getElementById('daily-summary-chart');
    if (!ctx) return;
    
    const allTasks = getAllTasks ? getAllTasks() : [];
    const todayTasks = getTasksByDate ? getTasksByDate() : [];
    const completedTasks = todayTasks.filter(task => task.completed).length;
    const totalTime = todayTasks.reduce((sum, task) => sum + task.duration, 0);
    const completionRate = todayTasks.length > 0 ? Math.round((completedTasks / todayTasks.length) * 100) : 0;
    
    // توزيع المهام حسب الفئة مع حساب الوقت لكل فئة
    const categoryData = {};
    todayTasks.forEach(task => {
        const categoryId = task.category;
        const category = categoryManager ? categoryManager.getCategory(categoryId) : null;
        const categoryName = category ? category.name : task.category;
        
        if (!categoryData[categoryName]) {
            categoryData[categoryName] = {
                time: 0,
                count: 0,
                color: category ? category.color : '#4a90e2'
            };
        }
        categoryData[categoryName].time += task.duration;
        categoryData[categoryName].count++;
    });
    
    // تدمير Chart السابق
    if (window.dailyChart) {
        window.dailyChart.destroy();
    }
    
    // إعداد بيانات Chart
    const labels = Object.keys(categoryData);
    const timeData = labels.map(label => categoryData[label].time);
    const colors = labels.map(label => categoryData[label].color);
    
    // إنشاء Chart جديد
    window.dailyChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: timeData,
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
                            const hours = Math.floor(value / 60);
                            const minutes = value % 60;
                            const timeStr = hours > 0 ? `${hours}س ${minutes}د` : `${minutes}د`;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = Math.round((value / total) * 100);
                            const count = categoryData[label]?.count || 0;
                            return `${label}: ${timeStr} (${count} مهمة، ${percentage}%)`;
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
    
    const hours = Math.floor(totalTime / 60);
    const minutes = totalTime % 60;
    if (totalTimeEl) {
        if (hours > 0) {
            totalTimeEl.textContent = `${hours}س ${minutes}د`;
        } else {
            totalTimeEl.textContent = `${minutes}د`;
        }
    }
    
    if (completionEl) completionEl.textContent = `${completionRate}%`;
}

// تهيئة Charts عند تحميل الصفحة
function initCharts() {
    console.log('تهيئة Charts...');
    
    if (typeof categoryManager !== 'undefined') {
        // تحديث الفئات المصغرة
        categoryManager.updateMiniCategories();
        
        // تحديد الفئة الأولى
        categoryManager.selectCategory('personal');
        
        // تحديث Chart اليومي
        updateDailyChart();
        
        // تحديث Chart الفئة المحددة
        categoryManager.updateSelectedCategoryChart();
    }
}

// تعريف الدوال للنافذة العالمية
window.updateAllCharts = updateAllCharts;
window.updateDailyChart = updateDailyChart;
window.initCharts = initCharts;
