// إدارة الجدول الزمني
let currentDate = new Date();
let currentPeriod = 'day'; // day, week, month

function updateCalendar() {
    const container = document.getElementById('calendar-container');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (currentPeriod === 'day') {
        renderDayCalendar();
    } else if (currentPeriod === 'week') {
        renderWeekCalendar();
    } else if (currentPeriod === 'month') {
        renderMonthCalendar();
    }
}

function renderDayCalendar() {
    const container = document.getElementById('calendar-container');
    const tasks = getTasksByDate ? getTasksByDate(currentDate) : [];
    
    // عنوان اليوم
    const dateStr = currentDate.toLocaleDateString('ar-SA', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    // أيام الأسبوع
    const dayNames = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    const todayIndex = currentDate.getDay();
    
    container.innerHTML = `
        <div class="day-header">
            <h3>${dateStr}</h3>
            <div class="day-summary">
                <span>${tasks.length} مهمة</span>
                <span>${calculateTotalTime(tasks)} ساعة</span>
                <span>${calculateCompletedTasks(tasks)} مكتملة</span>
            </div>
        </div>
        <div class="day-of-week">
            <span class="week-day-name">${dayNames[todayIndex]}</span>
        </div>
        <div class="time-slots">
            ${generateTimeSlots(tasks)}
        </div>
    `;
    
    document.getElementById('selected-period').textContent = "اليوم";
}

function renderWeekCalendar() {
    const container = document.getElementById('calendar-container');
    
    // حساب بداية الأسبوع
    const startOfWeek = new Date(currentDate);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 0); // الأحد = 0
    startOfWeek.setDate(diff);
    
    container.innerHTML = `
        <div class="week-header">
            <h3>جدول الأسبوع</h3>
        </div>
        <div class="week-days-container">
            ${generateWeekDays(startOfWeek)}
        </div>
    `;
    
    document.getElementById('selected-period').textContent = "الأسبوع";
}

function renderMonthCalendar() {
    const container = document.getElementById('calendar-container');
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const monthName = currentDate.toLocaleDateString('ar-SA', { month: 'long' });
    
    container.innerHTML = `
        <div class="month-header">
            <h3>${monthName} ${year}</h3>
        </div>
        <div class="month-grid">
            ${generateMonthDays(year, month)}
        </div>
    `;
    
    document.getElementById('selected-period').textContent = `${monthName}`;
}

function generateTimeSlots(tasks) {
    let slotsHTML = '';
    
    // إنشاء فترات زمنية من 6 صباحاً إلى 10 مساءً
    for (let hour = 6; hour <= 22; hour++) {
        const hourStr = hour.toString().padStart(2, '0');
        const timeLabel = `${hourStr}:00`;
        
        const tasksInHour = tasks.filter(task => {
            if (!task.time) return false;
            const [taskHour] = task.time.split(':');
            return parseInt(taskHour) === hour;
        });
        
        let tasksHTML = '';
        tasksInHour.forEach(task => {
            const color = getCategoryColor ? getCategoryColor(task.category) : '#4a90e2';
            const statusClass = task.completed ? 'completed' : '';
            tasksHTML += `
                <div class="calendar-task ${statusClass}" style="border-right: 4px solid ${color};">
                    <div class="task-time">${task.time || ''}</div>
                    <div class="task-title">${task.title}</div>
                    <div class="task-duration">${task.duration} دقيقة</div>
                    <div class="task-category-badge" style="background: ${color}22; color: ${color};">${getCategoryName ? getCategoryName(task.category) : task.category}</div>
                </div>
            `;
        });
        
        slotsHTML += `
            <div class="time-slot">
                <div class="slot-time">${timeLabel}</div>
                <div class="slot-tasks">
                    ${tasksHTML || '<div class="no-tasks">لا توجد مهام</div>'}
                </div>
            </div>
        `;
    }
    
    return slotsHTML;
}

function generateWeekDays(startDate) {
    let daysHTML = '';
    const dayNames = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
    
    for (let i = 0; i < 7; i++) {
        const dayDate = new Date(startDate);
        dayDate.setDate(startDate.getDate() + i);
        
        const tasks = getTasksByDate ? getTasksByDate(dayDate) : [];
        const dayStr = dayDate.getDate();
        const monthStr = monthNames[dayDate.getMonth()];
        const isToday = isSameDay(dayDate, new Date());
        
        daysHTML += `
            <div class="week-day ${isToday ? 'today' : ''}">
                <div class="day-header">
                    <div class="day-name">${dayNames[i]}</div>
                    <div class="day-date">${dayStr} ${monthStr}</div>
                </div>
                <div class="day-tasks">
                    ${tasks.map(task => {
                        const color = getCategoryColor ? getCategoryColor(task.category) : '#4a90e2';
                        return `
                        <div class="week-task" style="background: ${color}22; border-right: 3px solid ${color};">
                            <div class="task-time">${task.time || ''}</div>
                            <div class="task-title">${task.title}</div>
                            <div class="task-duration">${task.duration} د</div>
                        </div>
                    `}).join('')}
                    ${tasks.length === 0 ? '<div class="no-tasks">لا توجد مهام</div>' : ''}
                </div>
            </div>
        `;
    }
    
    return daysHTML;
}

function generateMonthDays(year, month) {
    let daysHTML = '';
    
    // أول يوم من الشهر
    const firstDay = new Date(year, month, 1);
    // آخر يوم من الشهر
    const lastDay = new Date(year, month + 1, 0);
    // عدد الأيام في الشهر
    const daysInMonth = lastDay.getDate();
    // يوم الأسبوع لأول يوم
    const firstDayIndex = firstDay.getDay();
    
    // أسماء الأيام
    const dayNames = ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];
    
    // رؤوس الأيام
    daysHTML += dayNames.map(day => `<div class="day-header">${day}</div>`).join('');
    
    // فراغات قبل أول يوم
    for (let i = 0; i < firstDayIndex; i++) {
        daysHTML += '<div class="day empty"></div>';
    }
    
    // أيام الشهر
    for (let day = 1; day <= daysInMonth; day++) {
        const dayDate = new Date(year, month, day);
        const tasks = getTasksByDate ? getTasksByDate(dayDate) : [];
        const isToday = isSameDay(dayDate, new Date());
        
        daysHTML += `
            <div class="day ${isToday ? 'today' : ''} ${tasks.length > 0 ? 'has-tasks' : ''}">
                <div class="day-number">${day}</div>
                ${tasks.length > 0 ? `
                    <div class="day-tasks-count">${tasks.length} مهمة</div>
                    <div class="day-tasks-preview">
                        ${tasks.slice(0, 2).map(task => `
                            <span class="task-dot" style="background: ${getCategoryColor ? getCategoryColor(task.category) : '#4a90e2'}"></span>
                        `).join('')}
                        ${tasks.length > 2 ? `<span class="more-tasks">+${tasks.length - 2}</span>` : ''}
                    </div>
                ` : ''}
            </div>
        `;
    }
    
    return daysHTML;
}

function calculateTotalTime(tasks) {
    const totalMinutes = tasks.reduce((sum, task) => sum + task.duration, 0);
    return Math.round(totalMinutes / 60);
}

function calculateCompletedTasks(tasks) {
    return tasks.filter(task => task.completed).length;
}

function getWeekNumber(date) {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}

function isSameDay(date1, date2) {
    return date1.getDate() === date2.getDate() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getFullYear() === date2.getFullYear();
}

function changePeriod(period) {
    currentPeriod = period;
    document.querySelectorAll('.period-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.period === period) {
            btn.classList.add('active');
        }
    });
    updateCalendar();
}

function navigatePeriod(direction) {
    if (currentPeriod === 'day') {
        currentDate.setDate(currentDate.getDate() + direction);
    } else if (currentPeriod === 'week') {
        currentDate.setDate(currentDate.getDate() + (direction * 7));
    } else if (currentPeriod === 'month') {
        currentDate.setMonth(currentDate.getMonth() + direction);
    }
    updateCalendar();
}

// تهيئة الجدول الزمني
function initCalendar() {
    console.log('تهيئة الجدول الزمني...');
    
    // أحداث أزرار الفترة
    document.querySelectorAll('.period-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            changePeriod(btn.dataset.period);
        });
    });
    
    // أحداث التنقل
    document.getElementById('prev-period')?.addEventListener('click', () => {
        navigatePeriod(-1);
    });
    
    document.getElementById('next-period')?.addEventListener('click', () => {
        navigatePeriod(1);
    });
    
    // التهيئة الأولى
    updateCalendar();
}

// تعريف الدوال للنافذة العالمية
window.updateCalendar = updateCalendar;
window.initCalendar = initCalendar;
