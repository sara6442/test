// ... بعد الكود الحالي في script.js ...

// إدارة Charts التفاعلية
document.addEventListener('DOMContentLoaded', function() {
    // فتح إعدادات Chart معين
    document.querySelectorAll('.chart-settings-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const category = this.getAttribute('data-category');
            openChartSettings(category);
        });
    });
    
    // إضافة مهمة لفئة محددة
    document.querySelectorAll('.btn-add-to-category').forEach(btn => {
        btn.addEventListener('click', function() {
            const category = this.getAttribute('data-category');
            openAddTaskForCategory(category);
        });
    });
    
    // فتح إعدادات Charts العامة
    document.getElementById('settings-toggle')?.addEventListener('click', function() {
        document.getElementById('chart-settings-modal').style.display = 'flex';
        loadChartSettings('personal'); // تحميل إعدادات Chart الشخصية افتراضياً
    });
    
    // إغلاق إعدادات Charts
    document.getElementById('close-settings')?.addEventListener('click', function() {
        document.getElementById('chart-settings-modal').style.display = 'none';
    });
    
    // تغيير Chart المحدد في الإعدادات
    document.getElementById('selected-chart')?.addEventListener('change', function() {
        loadChartSettings(this.value);
    });
});

function openChartSettings(category) {
    document.getElementById('chart-settings-modal').style.display = 'flex';
    document.getElementById('selected-chart').value = category;
    loadChartSettings(category);
}

function openAddTaskForCategory(category) {
    // التحقق إذا كانت الفئة ممتلئة
    const categoryData = getCategoryData(category);
    if (categoryData.usedMinutes >= categoryData.totalMinutes && categoryData.totalMinutes > 0) {
        alert(`❌ لا يمكن إضافة مهام جديدة لهذه الفئة!\nلقد وصلت إلى الحد الأقصى للوقت (${categoryData.totalMinutes} دقيقة)`);
        return;
    }
    
    // فتح نافذة إضافة مهمة مع تحديد الفئة
    document.getElementById('task-modal').style.display = 'flex';
    document.getElementById('task-category').value = category;
}

window.openChartSettings = openChartSettings;
window.openAddTaskForCategory = openAddTaskForCategory;
