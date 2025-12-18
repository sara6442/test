import { getTasksByDate, getTasks } from './taskManager.js';
import { getCategoryById } from './categoryManager.js';

// تحميل العرض اليومي
export function loadDailyView() {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const arabicDate = now.toLocaleDateString('ar-SA', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    const tasks = getTasksByDate(today);
    
    let tasksHtml = '';
    if (tasks.length === 0) {
        tasksHtml = '<div class="empty-tasks">لا توجد مهام لهذا اليوم</div>';
    } else {
        tasks.forEach(task => {
            const category = getCategoryById(task.categoryId) || { name: 'عام', color: '#6c757d' };
            tasksHtml += `
                <div class="calendar-task ${task.completed ? 'completed' : ''}" data-id="${task.id}">
                    <div class="task-time">${task.time || 'طوال اليوم'}</div>
                    <div class="task-details">
                        <div class="task-title">${task.title}</div>
                        <div class="task-category" style="color: ${category.color}">
                            <i class="${category.icon || 'fas fa-tag'}"></i> ${category.name}
                        </div>
                    </div>
                    <div class="task-duration">${task.duration} دقيقة</div>
                </div>
            `;
        });
    }
    
    return `
        <div class="daily-view">
            <div class="day-header">
                <h3>${arabicDate}</h3>
                <div class="day-tasks">
                    ${tasksHtml}
                </div>
            </div>
        </div>
    `;
}

// تحميل العرض الأسبوعي
export function loadWeeklyView() {
    const now = new Date();
    const week = getCurrentWeek(now);
    
    let weekHtml = '';
    week.forEach(day => {
        const dayTasks = getTasksByDate(day.date);
        const isToday = day.date === now.toISOString().split('T')[0];
        
        let dayTasksHtml = '';
        if (dayTasks.length === 0) {
            dayTasksHtml = '<div class="empty-day">لا توجد مهام</div>';
        } else {
            dayTasks.forEach(task => {
                dayTasksHtml += `
                    <div class="week-task ${task.completed ? 'completed' : ''}">
                        <div class="task-title">${task.title}</div>
                        ${task.time ? `<div class="task-time">${task.time}</div>` : ''}
                    </div>
                `;
            });
        }
        
        weekHtml += `
            <div class="day-cell ${isToday ? 'current-day' : ''}">
                <div class="day-number">${day.day}</div>
                <div class="day-name">${day.name}</div>
                <div class="day-tasks">${dayTasksHtml}</div>
            </div>
        `;
    });
    
    return `
        <div class="weekly-view">
            <div class="week-navigation">
                <button class="nav-btn prev-week"><i class="fas fa-chevron-right"></i> الأسبوع السابق</button>
                <span id="week-range">${week[0].date} - ${week[6].date}</span>
                <button class="nav-btn next-week">الأسبوع التالي <i class="fas fa-chevron-left"></i></button>
            </div>
            <div class="week-calendar">
                ${weekHtml}
            </div>
        </div>
    `;
}

// تحميل العرض الشهري
export function loadMonthlyView() {
    const now = new Date();
    const month = getCurrentMonth(now);
    const monthName = now.toLocaleDateString('ar-SA', { month: 'long', year: 'numeric' });
    
    let monthHtml = '';
    
    // أسماء الأيام
    const daysOfWeek = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    daysOfWeek.forEach(day => {
        monthHtml += `<div class="day-header-cell">${day}</div>`;
    });
    
    month.forEach(day => {
        if (day) {
            const dayTasks = getTasksByDate(day.date);
            const isToday = day.date === now.toISOString().split('T')[0];
            const hasTasks = dayTasks.length > 0;
            
            monthHtml += `
                <div class="day-cell ${isToday ? 'current-day' : ''} ${hasTasks ? 'has-tasks' : ''}">
                    <div class="day-number">${day.day}</div>
                    ${hasTasks ? `<div class="task-indicator" title="${dayTasks.length} مهام"></div>` : ''}
                </div>
            `;
        } else {
            monthHtml += '<div class="day-cell empty"></div>';
        }
    });
    
    return `
        <div class="monthly-view">
            <div class="month-navigation">
                <button class="nav-btn prev-month"><i class="fas fa-chevron-right"></i> الشهر السابق</button>
                <span id="current-month">${monthName}</span>
                <button class="nav-btn next-month">الشهر التالي <i class="fas fa-chevron-left"></i></button>
            </div>
            <div class="month-calendar">
                ${monthHtml}
            </div>
        </div>
    `;
}

// الحصول على الأسبوع الحالي
export function getCurrentWeek(date = new Date()) {
    const currentDate = new Date(date);
    const day = currentDate.getDay();
    const diff = currentDate.getDate() - day + (day === 0 ? -6 : 1); // تعديل لجعل الإثنين أول يوم
    
    const week = [];
    for (let i = 0; i < 7; i++) {
        const dayDate = new Date(currentDate);
        dayDate.setDate(diff + i);
        
        week.push({
            date: dayDate.toISOString().split('T')[0],
            day: dayDate.getDate(),
            name: dayDate.toLocaleDateString('ar-SA', { weekday: 'short' }),
            fullName: dayDate.toLocaleDateString('ar-SA', { weekday: 'long' })
        });
    }
    
    return week;
}

// الحصول على الشهر الحالي
export function getCurrentMonth(date = new Date()) {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const monthDays = [];
    
    // أيام فارغة قبل بداية الشهر
    for (let i = 0; i < firstDay.getDay(); i++) {
        monthDays.push(null);
    }
    
    // أيام الشهر
    for (let day = 1; day <= lastDay.getDate(); day++) {
        const dayDate = new Date(year, month, day);
        monthDays.push({
            date: dayDate.toISOString().split('T')[0],
            day: day,
            month: month + 1,
            year: year
        });
    }
    
    return monthDays;
}
