// الجدول الزمني
function loadCalendar(date = new Date()) {
    const container = document.getElementById('time-slots');
    const tasks = getTasksByDate(date);
    
    container.innerHTML = '';
    
    // إنشاء فترات زمنية من 6 صباحاً إلى 10 مساءً
    for (let hour = 6; hour <= 22; hour++) {
        const timeSlot = document.createElement('div');
        timeSlot.className = 'time-slot';
        
        const hourStr = hour.toString().padStart(2, '0');
        const timeLabel = `${hourStr}:00`;
        
        const tasksInHour = tasks.filter(task => {
            if (!task.time) return false;
            const [taskHour] = task.time.split(':');
            return parseInt(taskHour) === hour;
        });
        
        let tasksHTML = '';
        tasksInHour.forEach(task => {
            const color = getCategoryColor(task.category);
            tasksHTML += `
                <span class="slot-task" style="background: ${color};">
                    ${task.title} (${task.duration}د)
                </span>
            `;
        });
        
        timeSlot.innerHTML = `
            <div class="slot-time">${timeLabel}</div>
            <div class="slot-tasks">${tasksHTML || 'لا توجد مهام'}</div>
        `;
        
        container.appendChild(timeSlot);
    }
    
    // تحديث التاريخ المعروض
    const dateStr = date.toLocaleDateString('ar-SA', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    document.getElementById('selected-date').textContent = dateStr;
}

function getCategoryColor(category) {
    const colors = {
        'personal': '#4a90e2',
        'work': '#7b68ee',
        'study': '#2ecc71',
        'health': '#e74c3c'
    };
    return colors[category] || '#6c757d';
}

// التنقل بين الأيام
document.addEventListener('DOMContentLoaded', function() {
    let currentDate = new Date();
    
    document.getElementById('prev-day')?.addEventListener('click', () => {
        currentDate.setDate(currentDate.getDate() - 1);
        loadCalendar(currentDate);
    });
    
    document.getElementById('next-day')?.addEventListener('click', () => {
        currentDate.setDate(currentDate.getDate() + 1);
        loadCalendar(currentDate);
    });
});

window.loadCalendar = loadCalendar;
