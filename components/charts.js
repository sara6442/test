// الرسوم البيانية
let personalChart, categoryChart, progressChart;

function updateCharts() {
    updatePersonalChart();
    updateCategoryChart();
    updateProgressChart();
}

function updatePersonalChart() {
    const ctx = document.getElementById('personal-chart');
    const personalTasks = getTasksByCategory('personal');
    const completed = personalTasks.filter(t => t.completed).length;
    const pending = personalTasks.length - completed;
    
    if (personalChart) {
        personalChart.destroy();
    }
    
    personalChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['مكتملة', 'قيد الانتظار'],
            datasets: [{
                data: [completed, pending],
                backgroundColor: ['#2ecc71', '#e74c3c'],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
    
    // تحديث وسيلة الإيضاح
    const legend = document.getElementById('personal-legend');
    legend.innerHTML = `
        <div class="legend-item">
            <span class="legend-color" style="background: #2ecc71;"></span>
            <span>مكتملة: ${completed}</span>
        </div>
        <div class="legend-item">
            <span class="legend-color" style="background: #e74c3c;"></span>
            <span>قيد الانتظار: ${pending}</span>
        </div>
    `;
}

function updateCategoryChart() {
    const ctx = document.getElementById('category-chart');
    const categories = ['personal', 'work', 'study', 'health'];
    const data = categories.map(cat => getTasksByCategory(cat).length);
    
    if (categoryChart) {
        categoryChart.destroy();
    }
    
    categoryChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['شخصية', 'عمل', 'دراسة', 'صحة'],
            datasets: [{
                data: data,
                backgroundColor: ['#4a90e2', '#7b68ee', '#2ecc71', '#e74c3c']
            }]
        },
        options: {
            responsive: true
        }
    });
}

function updateProgressChart() {
    const ctx = document.getElementById('progress-chart');
    const allTasks = tasks;
    const completed = allTasks.filter(t => t.completed).length;
    const total = allTasks.length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    if (progressChart) {
        progressChart.destroy();
    }
    
    progressChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            datasets: [{
                data: [percentage, 100 - percentage],
                backgroundColor: ['#4a90e2', '#f0f0f0'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            cutout: '70%',
            plugins: {
                legend: { display: false },
                tooltip: { enabled: false }
            }
        }
    });
    
    // إضافة النسبة المئوية في المركز
    const centerText = percentage + '%';
    Chart.register({
        id: 'centerText',
        afterDraw: (chart) => {
            const { width, height, ctx } = chart;
            ctx.restore();
            ctx.font = 'bold 24px Arial';
            ctx.textBaseline = 'middle';
            ctx.textAlign = 'center';
            ctx.fillText(centerText, width / 2, height / 2);
            ctx.save();
        }
    });
}

// تهيئة الرسوم البيانية عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('charts-view')) {
        updateCharts();
    }
    
    // تحديث الرسوم البيانية عند تغيير الفترة
    document.getElementById('chart-period')?.addEventListener('change', updateCharts);
    document.getElementById('refresh-charts')?.addEventListener('click', updateCharts);
});

window.updateCharts = updateCharts;
