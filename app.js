// اختبار تحميل CSS
function checkCSS() {
    console.log("🔍 فحص تحميل CSS...");
    
    // اختبار 1: فحص عدد أنماط CSS المحملة
    const cssCount = document.styleSheets.length;
    console.log("عدد ملفات CSS:", cssCount);
    
    // اختبار 2: فحص متغيرات CSS
    const rootStyles = getComputedStyle(document.documentElement);
    const themeBg = rootStyles.getPropertyValue('--theme-bg').trim();
    console.log("متغير --theme-bg:", themeBg);
    
    if (!themeBg || themeBg === 'initial' || themeBg === '') {
        console.error("❌ متغيرات CSS غير محملة!");
        
        // تطبيق أنماط طارئة
        document.body.style.cssText = `
            background-color: #f8f9fa !important;
            color: #212529 !important;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif !important;
        `;
        
        // إضافة رسالة تحذير
        const warning = document.createElement('div');
        warning.id = 'css-warning';
        warning.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: #f8d7da;
            color: #721c24;
            padding: 10px 20px;
            border-radius: 5px;
            z-index: 99999;
            font-family: Arial;
            border: 1px solid #f5c6cb;
        `;
        warning.innerHTML = '⚠️ مشكلة في تحميل التنسيقات. الرجاء تحديث الصفحة.';
        document.body.appendChild(warning);
        
        return false;
    }
    
    console.log("✅ CSS محمل بنجاح");
    return true;
}

// ========== حالة التطبيق ==========
const AppState = {
    tasks: [],
    categories: [],
    deletedTasks: [],
    notes: [],
    currentView: 'tasks',
    currentFilter: 'pending',
    currentCalendarView: 'daily',
    currentCalendarDate: new Date(),
    currentTaskId: null,
    currentNoteId: null,
    currentCategoryId: null,
    themes: ['gray', 'black', 'blue', 'beige', 'custom'],
    currentTheme: 'beige',
    undoStack: [],
    redoStack: [],
    notesEditorDirty: false
};

// ========== إدارة البيانات ==========
function initializeData() {
    console.log("تهيئة البيانات...");
    try { AppState.tasks = JSON.parse(localStorage.getItem('mytasks_tasks') || '[]'); } catch (e) { AppState.tasks = []; }
    try { AppState.deletedTasks = JSON.parse(localStorage.getItem('mytasks_deleted') || '[]'); } catch (e) { AppState.deletedTasks = []; }
    try { AppState.categories = JSON.parse(localStorage.getItem('mytasks_categories') || '[]'); } catch (e) { AppState.categories = []; }
    try { AppState.notes = JSON.parse(localStorage.getItem('mytasks_notes') || '[]'); } catch (e) { AppState.notes = []; }

    if (!Array.isArray(AppState.categories) || AppState.categories.length === 0) {
        AppState.categories = [
            { id: 'work', name: 'عمل', color: '#5a76e8', timeframeMinutes: 480,
              messagePending: 'هناك مهام عمل معلقة. واصل العمل لإنجازها!',
              messageCompleted: 'ممتاز! لقد أكملت جميع مهام العمل لهذا اليوم. استمر في العمل الجيد!',
              messageExceeded: 'لقد تجاوزت الوقت المخصص للعمل اليوم. حاول إدارة وقتك بشكل أفضل!' },
            { id: 'personal', name: 'شخصي', color: '#4cc9f0', timeframeMinutes: 120,
              messagePending: 'لا يزال لديك مهام شخصية معلقة. حاول إنجازها قريباً!',
              messageCompleted: 'رائع! لقد أكملت جميع المهام الشخصية هذا الأسبوع.',
              messageExceeded: 'لقد تجاوزت الوقت المخصص للمهام الشخصية. حاول التركيز على المهام المهمة!' },
            { id: 'study', name: 'دراسة', color: '#f72585', timeframeMinutes: 360,
              messagePending: 'هناك مهام دراسية تحتاج للإنجاز. ركز على دراستك!',
              messageCompleted: 'تهانينا! لقد أنجزت جميع المهام الدراسية لهذا الشهر.',
              messageExceeded: 'لقد تجاوزت الوقت المخصص للدراسة. حاول تنظيم وقتك بشكل أفضل!' }
        ];
        saveCategories();
    }

    if (AppState.tasks.length === 0) {
        const now = new Date();
        const today = now.toISOString().split('T')[0];
        const tomorrow = new Date(now); tomorrow.setDate(now.getDate()+1);
        const yesterday = new Date(now); yesterday.setDate(now.getDate()-1);
        const tomorrowStr = tomorrow.toISOString().split('T')[0];
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        AppState.tasks = [
            { id: generateId(), title: 'مراجعة التقرير الشهري', description: 'مراجعة وإرسال التقرير الشهري للإدارة', categoryId: 'work', duration: 60, date: today, time: '10:00', priority: 'high', completed: false, createdAt: new Date().toISOString() },
            { id: generateId(), title: 'مقابلة العملاء الجدد', description: 'مقابلة مع العملاء الجدد لمناقشة المشروع', categoryId: 'work', duration: 90, date: today, time: '14:30', priority: 'medium', completed: false, createdAt: new Date().toISOString() },
            { id: generateId(), title: 'شراء مستلزمات المنزل', description: 'شراء الخضار والفواكه والمنظفات', categoryId: 'personal', duration: 45, date: tomorrowStr, time: '16:00', priority: 'low', completed: false, createdAt: new Date().toISOString() },
            { id: generateId(), title: 'مهمة متأخرة', description: 'مهمة يجب أن تكون مكتملة بالأمس', categoryId: 'personal', duration: 30, date: yesterdayStr, time: '09:00', priority: 'high', completed: false, createdAt: new Date().toISOString() },
            { id: generateId(), title: 'مهمة مكتملة', description: 'مهمة تم إنجازها بالفعل', categoryId: 'study', duration: 60, date: today, time: '16:00', priority: 'low', completed: true, createdAt: new Date().toISOString() }
        ];
        saveTasks();
    }

    if (AppState.notes.length === 0) {
        AppState.notes = [
            { id: generateId(), title: 'ملاحظة ترحيبية', content: '<div class="note-checkbox-item"><input type="checkbox" class="note-checkbox small-checkbox"> <span class="note-checkbox-text">مراجعة التقرير الشهري</span></div>', fontFamily: "'Cairo', sans-serif", fontSize: '16', fontWeight: 'normal', color: '#000000', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
        ];
        saveNotes();
    }
}

function saveTasks() { try { localStorage.setItem('mytasks_tasks', JSON.stringify(AppState.tasks)); } catch(e){console.error(e);} }
function saveDeletedTasks() { try { localStorage.setItem('mytasks_deleted', JSON.stringify(AppState.deletedTasks)); } catch(e){console.error(e);} }
function saveCategories() { try { localStorage.setItem('mytasks_categories', JSON.stringify(AppState.categories)); } catch(e){console.error(e);} }
function saveNotes() { try { localStorage.setItem('mytasks_notes', JSON.stringify(AppState.notes)); } catch(e){console.error(e);} }
function generateId() { return Date.now().toString(36) + Math.random().toString(36).substr(2); }

// ========== Helpers ==========
function getCategoryById(categoryId) {
    return AppState.categories.find(c => c.id === categoryId) || { name: 'عام', color: '#6c757d', timeframeMinutes: 60, messagePending:'',messageCompleted:'',messageExceeded:'' };
}
function isTaskOverdue(task) { if (!task || !task.date || task.completed) return false; const today = new Date().toISOString().split('T')[0]; return task.date < today; }
function formatDate(dateStr) { if (!dateStr) return 'بدون تاريخ'; const d = new Date(dateStr); return d.toLocaleDateString('ar-SA'); }
function timeStrToMinutes(timeStr){ if(!timeStr) return 0; const [h,m]=timeStr.split(':').map(Number); return h*60+(m||0); }

// ========== Themes (kept minimal) ==========
function initializeThemes(){ const saved = localStorage.getItem('mytasks_theme'); if(saved) { AppState.currentTheme = saved; document.body.className = `theme-${saved}`; } else { AppState.currentTheme='beige'; document.body.className='theme-beige'; localStorage.setItem('mytasks_theme','beige'); } updateThemeButtons(); setupThemeEvents(); }
function updateThemeButtons(){ document.querySelectorAll('.theme-option').forEach(o=> o.classList.toggle('active', o.dataset.theme===AppState.currentTheme)); }
function setupThemeEvents(){ document.querySelectorAll('.theme-option').forEach(option=> option.addEventListener('click', ()=> changeTheme(option.dataset.theme))); }
function changeTheme(theme){ if(theme==='custom'){ openCustomThemeModal(); return; } AppState.currentTheme=theme; document.body.className=`theme-${theme}`; localStorage.setItem('mytasks_theme',theme); updateThemeButtons(); refreshCurrentView(); }

// ========== Tasks CRUD ==========
function addTask(taskData){
    const timeframeCheck = checkCategoryTimeframe(taskData.categoryId, parseInt(taskData.duration)||30);
    if(!timeframeCheck.allowed){ showTimeframeWarning(timeframeCheck, taskData); return; }
    const newTask = {
        id: generateId(), title: taskData.title, description: taskData.description||'', categoryId: taskData.categoryId,
        duration: parseInt(taskData.duration)||30, date: taskData.date||new Date().toISOString().split('T')[0],
        time: taskData.time||'', priority: taskData.priority||'medium', completed:false, createdAt:new Date().toISOString()
    };
    AppState.tasks.push(newTask); saveTasks(); refreshCurrentView(); closeModal('add-task-modal');
}
function updateTask(taskId, data){
    const idx = AppState.tasks.findIndex(t=>t.id===taskId); if(idx===-1) return;
    AppState.tasks[idx] = {...AppState.tasks[idx], ...data, updatedAt: new Date().toISOString()}; saveTasks(); refreshCurrentView(); closeModal('edit-task-modal');
}
function toggleTaskCompletion(taskId){ const idx = AppState.tasks.findIndex(t=>t.id===taskId); if(idx===-1) return; AppState.tasks[idx].completed = !AppState.tasks[idx].completed; saveTasks(); refreshCurrentView(); }
function deleteTask(taskId){
    const idx = AppState.tasks.findIndex(t=>t.id===taskId);
    if(idx===-1){
        const dIdx = AppState.deletedTasks.findIndex(t=>t.id===taskId);
        if(dIdx!==-1){ if(confirm('هذه المهمة محذوفة بالفعل. حذف نهائي؟')){ AppState.deletedTasks.splice(dIdx,1); saveDeletedTasks(); renderTasks(); } }
        return;
    }
    if(!confirm('هل أنت متأكد من حذف المهمة؟')) return;
    AppState.deletedTasks.push({...AppState.tasks[idx], deletedAt: new Date().toISOString()});
    AppState.tasks.splice(idx,1); saveTasks(); saveDeletedTasks(); refreshCurrentView();
}
function restoreTask(taskId){ const idx = AppState.deletedTasks.findIndex(t=>t.id===taskId); if(idx===-1) return; AppState.tasks.push(AppState.deletedTasks[idx]); AppState.deletedTasks.splice(idx,1); saveTasks(); saveDeletedTasks(); renderTasks(); }
function checkCategoryTimeframe(categoryId, newTaskDuration=0){
    const cat = AppState.categories.find(c=>c.id===categoryId); if(!cat || !cat.timeframeMinutes) return {allowed:true};
    const categoryTasks = AppState.tasks.filter(t=>t.categoryId===categoryId);
    const total = categoryTasks.reduce((s,t)=>s+(t.duration||0),0)+newTaskDuration;
    if(total <= (cat.timeframeMinutes||60)) return {allowed:true};
    return { allowed:false, totalDuration: total, categoryTimeframe: cat.timeframeMinutes, exceedBy: total-(cat.timeframeMinutes||0), categoryName: cat.name, categoryTasks };
}
function showTimeframeWarning(timeframeCheck, taskData){
    const existing = document.getElementById('timeframe-warning-modal'); if(existing) existing.remove();
    const html = `
    <div class="modal" id="timeframe-warning-modal"><div class="modal-content" style="max-width:520px;">
    <div class="modal-header"><h3>⚠️ الحيز الزمني ممتلئ</h3><button class="close-btn" onclick="closeModal('timeframe-warning-modal')">&times;</button></div>
    <div class="modal-body">
    <p>الفئة "${timeframeCheck.categoryName}" تجاوزت حد الوقت. الوقت الإجمالي: ${timeframeCheck.totalDuration} دقيقة (الحد: ${timeframeCheck.categoryTimeframe})</p>
    <div style="display:flex;gap:10px;flex-wrap:wrap;">
        <button class="btn btn-warning" id="add-anyway-btn">إضافة على أي حال</button>
        <button class="btn btn-secondary" id="replace-with-completed-btn">استبدال بمهمة مكتملة</button>
        <button class="btn btn-danger" id="cancel-add-btn">إلغاء</button>
    </div>
    </div></div></div>`;
    document.body.insertAdjacentHTML('beforeend', html);
    document.getElementById('timeframe-warning-modal').classList.add('active');
    window.pendingTaskData = taskData; window.timeframeCheck = timeframeCheck;
    setTimeout(()=>{
        document.getElementById('add-anyway-btn').addEventListener('click', ()=>{ addTaskAnyway(taskData); closeModal('timeframe-warning-modal'); });
        document.getElementById('replace-with-completed-btn').addEventListener('click', ()=> {
            const completedTasks = timeframeCheck.categoryTasks.filter(t=>t.completed);
            if(completedTasks.length===0){ alert('لا توجد مهام مكتملة للاستبدال'); return; }
            showDeleteReplaceOptions({ categoryTasks: completedTasks, categoryName: timeframeCheck.categoryName }, taskData);
        });
        document.getElementById('cancel-add-btn').addEventListener('click', ()=>{ closeModal('timeframe-warning-modal'); delete window.pendingTaskData; delete window.timeframeCheck; });
    },50);
}
function addTaskAnyway(taskData){ const newTask = { id: generateId(), title: taskData.title, description: taskData.description||'', categoryId: taskData.categoryId, duration: parseInt(taskData.duration)||30, date: taskData.date||new Date().toISOString().split('T')[0], time: taskData.time||'', priority: taskData.priority||'medium', completed:false, createdAt: new Date().toISOString(), addedAnyway:true }; AppState.tasks.push(newTask); saveTasks(); refreshCurrentView(); closeModal('add-task-modal'); alert(`تمت إضافة المهمة "${taskData.title}"`); delete window.pendingTaskData; delete window.timeframeCheck; }

function showDeleteReplaceOptions(timeframeCheck, taskData){
    const existing = document.getElementById('delete-replace-modal'); if(existing) existing.remove();
    const html = `<div class="modal" id="delete-replace-modal"><div class="modal-content" style="max-width:700px;">
        <div class="modal-header"><h3>اختر مهمة مكتملة للاستبدال</h3><button class="close-btn" onclick="closeModal('delete-replace-modal')">&times;</button></div>
        <div class="modal-body"><div id="tasks-to-delete-list"></div></div></div></div>`;
    document.body.insertAdjacentHTML('beforeend', html);
    closeModal('timeframe-warning-modal');
    setTimeout(()=>{ document.getElementById('delete-replace-modal').classList.add('active'); renderTasksToDelete(timeframeCheck.categoryTasks, taskData); }, 200);
}
function renderTasksToDelete(tasks, newTaskData){
    const container = document.getElementById('tasks-to-delete-list'); if(!container) return;
    if(!tasks || tasks.length===0){ container.innerHTML='<div style="text-align:center;padding:30px;color:var(--gray-color)">لا توجد مهام</div>'; return; }
    container.innerHTML = tasks.map(t=>`<div class="task-card" style="margin-bottom:8px;cursor:pointer;" onclick="deleteAndReplaceTask('${t.id}', window.pendingTaskData)"><div class="task-content"><div class="task-title">${t.title}</div><div class="task-meta"><span>${t.duration} دقيقة</span><span>${formatDate(t.date)}</span></div></div></div>`).join('');
}
function deleteAndReplaceTask(taskIdToDelete, newTaskData){
    const idx = AppState.tasks.findIndex(t=>t.id===taskIdToDelete); if(idx!==-1){ AppState.deletedTasks.push({...AppState.tasks[idx], deletedAt: new Date().toISOString(), replacedBy: newTaskData.title}); AppState.tasks.splice(idx,1); }
    const newTask = { id: generateId(), title: newTaskData.title, description: newTaskData.description||'', categoryId: newTaskData.categoryId, duration: parseInt(newTaskData.duration)||30, date: newTaskData.date||new Date().toISOString().split('T')[0], time: newTaskData.time||'', priority: newTaskData.priority||'medium', completed:false, createdAt:new Date().toISOString(), replacedTask: taskIdToDelete };
    AppState.tasks.push(newTask); saveTasks(); saveDeletedTasks(); refreshCurrentView(); closeModal('delete-replace-modal'); closeModal('add-task-modal'); delete window.pendingTaskData; delete window.timeframeCheck; alert('تم الاستبدال وإضافة المهمة الجديدة.');
}

// ========== Render Tasks (main view) ==========
function renderTasks(){
    const container = document.getElementById('tasks-list'); if(!container) return;
    let tasksToShow = [];
    if(AppState.currentFilter==='pending') tasksToShow = AppState.tasks.filter(t=>!t.completed);
    else if(AppState.currentFilter==='completed') tasksToShow = AppState.tasks.filter(t=>t.completed);
    else if(AppState.currentFilter==='deleted') tasksToShow = AppState.deletedTasks;
    else if(AppState.currentFilter==='overdue') tasksToShow = AppState.tasks.filter(t=>isTaskOverdue(t) && !t.completed);
    else tasksToShow = [...AppState.tasks];

    if(tasksToShow.length===0){
        container.innerHTML = `<div class="empty-state" style="text-align:center;padding:60px;color:var(--gray-color)"><i class="fas fa-inbox" style="font-size:3rem;opacity:0.3"></i><h3 style="color:var(--theme-text)">لا توجد مهام</h3></div>`; return;
    }

    let html = tasksToShow.map(task=>{
        const cat = getCategoryById(task.categoryId);
        const isOver = isTaskOverdue(task) && !task.completed;
        if(task.deletedAt) {
            return `<div class="task-card deleted" data-id="${task.id}"><div class="task-content"><div class="task-title" style="text-decoration:line-through;color:#999">${task.title}</div></div><div class="task-actions"><button class="btn btn-success btn-sm restore-task-btn" data-id="${task.id}"><i class="fas fa-undo"></i></button><button class="btn btn-danger btn-sm permanent-delete-btn" data-id="${task.id}"><i class="fas fa-trash"></i></button></div></div>`;
        }
        return `<div class="task-card ${task.completed?'completed':''} ${isOver?'overdue':''}" data-id="${task.id}" style="position:relative;">
            <div style="display:flex;align-items:flex-start;gap:12px;">
                <input type="checkbox" class="task-checkbox" ${task.completed?'checked':''} style="margin-top:6px;">
                <div class="task-content" style="flex:1;">
                    <div class="task-title">${task.title}</div>
                    ${task.description?`<div class="task-description">${task.description}</div>`:''}
                    <div class="task-meta">
                        <div class="task-meta-item"><i class="fas fa-tag" style="color:${cat.color}"></i><span>${cat.name}</span></div>
                        <div class="task-meta-item"><i class="fas fa-calendar"></i><span>${formatDate(task.date)}</span></div>
                        <div class="task-meta-item"><i class="fas fa-clock"></i><span>${task.duration} دقيقة</span></div>
                    </div>
                </div>
            </div>
            ${isOver?`<div class="overdue-badge-container" style="position:absolute;bottom:10px;left:10px"><span class="overdue-badge">متأخرة</span></div>`:''}
            <div class="task-actions" style="position:absolute;top:10px;left:10px;">
                <button class="btn btn-secondary btn-sm edit-task-btn" data-id="${task.id}"><i class="fas fa-edit"></i></button>
                <button class="btn btn-danger btn-sm delete-task-btn" data-id="${task.id}"><i class="fas fa-trash"></i></button>
            </div>
        </div>`;
    }).join('');
    container.innerHTML = html;
    setupTaskButtonsEvents();
    setupTaskHoverEffects();
}

// ========== Task button bindings ==========
function setupTaskButtonsEvents(){
    document.querySelectorAll('.task-checkbox').forEach(cb=>{ if(cb._bound) return; cb._bound=true; cb.addEventListener('change', e=>{ const id = e.target.closest('.task-card').dataset.id; toggleTaskCompletion(id); }); });
    document.querySelectorAll('.task-card:not(.deleted)').forEach(card=>{ if(card._boundClick) return; card._boundClick=true; card.addEventListener('click', (e)=>{ if(!e.target.closest('.task-actions') && !e.target.closest('input[type="checkbox"]')) openEditTaskModal(card.dataset.id); }); });
    document.querySelectorAll('.delete-task-btn').forEach(btn=>{ if(btn._bound) return; btn._bound=true; btn.addEventListener('click', e=>{ e.stopPropagation(); deleteTask(btn.dataset.id); }); });
    document.querySelectorAll('.edit-task-btn').forEach(btn=>{ if(btn._bound) return; btn._bound=true; btn.addEventListener('click', e=>{ e.stopPropagation(); openEditTaskModal(btn.dataset.id); }); });
    document.querySelectorAll('.restore-task-btn').forEach(btn=>{ if(btn._bound) return; btn._bound=true; btn.addEventListener('click', e=>{ restoreTask(btn.dataset.id); }); });
    document.querySelectorAll('.permanent-delete-btn').forEach(btn=>{ if(btn._bound) return; btn._bound=true; btn.addEventListener('click', e=>{ if(confirm('هل أنت متأكد من الحذف النهائي؟')){ const idx = AppState.deletedTasks.findIndex(t=>t.id===btn.dataset.id); if(idx!==-1){ AppState.deletedTasks.splice(idx,1); saveDeletedTasks(); renderTasks(); } } }); });
}

// ========== Categories (render + CRUD) ==========
function renderCategories(){
    const container = document.getElementById('categories-list'); if(!container) return;
    if(AppState.categories.length===0){ container.innerHTML='<div class="empty-state" style="text-align:center;padding:60px;color:var(--gray-color)"><i class="fas fa-tags" style="font-size:3rem;opacity:0.3"></i><h3>لا توجد فئات</h3></div>'; return; }

    let html = AppState.categories.map(category=>{
        const tasks = AppState.tasks.filter(t=>t.categoryId===category.id);
        const overdue = tasks.filter(t=>isTaskOverdue(t) && !t.completed);
        const pending = tasks.filter(t=>!isTaskOverdue(t) && !t.completed);
        const completed = tasks.filter(t=>t.completed);
        const totalDuration = tasks.reduce((s,t)=>s+(t.duration||0),0);
        const timeframe = category.timeframeMinutes||60;
        const percent = timeframe>0?Math.min(100, Math.round((totalDuration/timeframe)*100)):0;
        return `<div class="category-card" data-id="${category.id}" style="position:relative;">
            <div class="category-card-actions" style="position:absolute;top:10px;right:10px;display:flex;gap:6px;z-index:5;">
                <button class="btn btn-xs btn-info category-status-btn" data-id="${category.id}" title="حالة الفئة"><i class="fas fa-chart-pie"></i></button>
                <button class="btn btn-xs btn-secondary category-edit-btn" data-id="${category.id}" title="تعديل الفئة"><i class="fas fa-edit"></i></button>
                <button class="btn btn-xs btn-danger category-delete-btn" data-id="${category.id}" title="حذف الفئة"><i class="fas fa-trash"></i></button>
            </div>
            <div class="category-header"><div class="category-color" style="background:${category.color}"></div><div class="category-name">${category.name}</div><div class="category-stats">${tasks.length} مهام</div></div>
            <div class="category-progress-info"><span>استهلاك الحيز: ${percent}%</span><span>الزمن المستخدم: ${totalDuration} / ${timeframe} دقيقة</span></div>
            <div class="category-progress-container"><div class="category-progress-bar" style="width:${percent}%; background:${category.color};"></div></div>
            <div class="category-tasks-container">${tasks.length===0?`<div style="text-align:center;padding:20px;color:var(--gray-color)"><i class="fas fa-tasks" style="opacity:0.3"></i><p>لا توجد مهام</p></div>`: tasks.map(t=>`<div class="category-task-item ${t.completed?'completed':''}" onclick="openEditTaskModal('${t.id}')"><div class="category-task-title"><input type="checkbox" class="task-checkbox" ${t.completed?'checked':''} onclick="event.stopPropagation(); toggleTaskCompletion('${t.id}')"><span>${t.title}</span></div><div class="category-task-meta"><span>${formatDate(t.date)}</span><span>${t.duration} دقيقة</span>${isTaskOverdue(t)?'<span style="color:var(--danger-color)">متأخرة</span>':''}</div></div>`).join('')}</div>
        </div>`;
    }).join('');
    container.innerHTML = html;

    setTimeout(()=>{
        document.querySelectorAll('.category-edit-btn').forEach(btn=>{ btn.addEventListener('click', (e)=>{ e.stopPropagation(); openEditCategoryModal(btn.dataset.id); }); });
        document.querySelectorAll('.category-delete-btn').forEach(btn=>{ btn.addEventListener('click', (e)=>{ e.stopPropagation(); if(confirm('حذف الفئة وكل المهام؟')) deleteCategory(btn.dataset.id); }); });
        document.querySelectorAll('.category-status-btn').forEach(btn=>{ btn.addEventListener('click', (e)=>{ e.stopPropagation(); showCategoryStatusModal(btn.dataset.id); }); });
    },50);
}

// CRUD for categories
function openAddCategoryModal(){ AppState.currentCategoryId = null; document.getElementById('category-modal-title').textContent='إضافة فئة جديدة'; document.getElementById('category-name').value=''; document.getElementById('category-color').value='#5a76e8'; document.getElementById('category-timeframe').value='60'; document.getElementById('category-message-pending').value=''; document.getElementById('category-message-completed').value=''; document.getElementById('category-message-exceeded').value=''; document.getElementById('category-modal').classList.add('active'); }
function openEditCategoryModal(id){ const cat = AppState.categories.find(c=>c.id===id); if(!cat) return; AppState.currentCategoryId = id; document.getElementById('category-modal-title').textContent='تعديل الفئة'; document.getElementById('category-name').value=cat.name||''; document.getElementById('category-color').value=cat.color||'#5a76e8'; document.getElementById('category-timeframe').value=cat.timeframeMinutes||60; document.getElementById('category-message-pending').value=cat.messagePending||''; document.getElementById('category-message-completed').value=cat.messageCompleted||''; document.getElementById('category-message-exceeded').value=cat.messageExceeded||''; document.getElementById('category-modal').classList.add('active'); }
function saveCategory(){
    const name = document.getElementById('category-name').value.trim();
    const color = document.getElementById('category-color').value;
    const timeframe = parseInt(document.getElementById('category-timeframe').value)||60;
    const msgPending = document.getElementById('category-message-pending').value.trim();
    const msgCompleted = document.getElementById('category-message-completed').value.trim();
    const msgExceeded = document.getElementById('category-message-exceeded').value.trim();
    if(!name){ alert('الرجاء إدخال اسم الفئة'); return; }
    if(AppState.currentCategoryId){
        const idx = AppState.categories.findIndex(c=>c.id===AppState.currentCategoryId); if(idx===-1) return;
        AppState.categories[idx].name = name; AppState.categories[idx].color = color; AppState.categories[idx].timeframeMinutes = timeframe;
        AppState.categories[idx].messagePending = msgPending; AppState.categories[idx].messageCompleted = msgCompleted; AppState.categories[idx].messageExceeded = msgExceeded;
    } else {
        AppState.categories.push({ id: generateId(), name, color, timeframeMinutes: timeframe, messagePending: msgPending||'هناك مهام معلقة', messageCompleted: msgCompleted||'جميع المهام مكتملة', messageExceeded: msgExceeded||'لقد تجاوزت الوقت المخصص' });
    }
    saveCategories(); renderCategories(); closeModal('category-modal');
}
function deleteCategory(id){ if(!confirm('سيتم حذف الفئة وكل المهام المرتبطة بها. متابعة؟')) return; AppState.tasks = AppState.tasks.filter(t=>t.categoryId!==id); const idx = AppState.categories.findIndex(c=>c.id===id); if(idx!==-1) AppState.categories.splice(idx,1); saveCategories(); saveTasks(); refreshCurrentView(); }

// calculate status for a category
function calculateCategoryStatus(categoryId){
    const category = AppState.categories.find(c=>c.id===categoryId); if(!category) return null;
    const tasks = AppState.tasks.filter(t=>t.categoryId===categoryId);
    const totalDuration = tasks.reduce((s,t)=>s+(t.duration||0),0);
    const completedTasks = tasks.filter(t=>t.completed);
    const completedDuration = completedTasks.reduce((s,t)=>s+(t.duration||0),0);
    const timeframe = category.timeframeMinutes||60;
    if(tasks.length===0) return { status:'empty', message: category.messagePending || 'لا توجد مهام', totalTasks:0, completedTasks:0, totalDuration:0, categoryTimeframe: timeframe };
    if(completedDuration===totalDuration && totalDuration>0) return { status:'completed', message: category.messageCompleted || 'كل المهام مكتملة', totalTasks: tasks.length, completedTasks: completedTasks.length, totalDuration, categoryTimeframe: timeframe };
    if(totalDuration > timeframe) return { status:'exceeded', message: category.messageExceeded || 'تجاوزت الوقت المخصص', totalTasks: tasks.length, completedTasks: completedTasks.length, totalDuration, categoryTimeframe: timeframe };
    return { status:'pending', message: category.messagePending || 'هناك مهام معلقة', totalTasks: tasks.length, completedTasks: completedTasks.length, totalDuration, categoryTimeframe: timeframe };
}

// Show modal for single category status with edit button
function showCategoryStatusModal(categoryId){
    const category = AppState.categories.find(c=>c.id===categoryId); if(!category) return;
    const status = calculateCategoryStatus(categoryId);
    const statusColor = status.status==='completed' ? '#4cc9f0' : status.status==='exceeded' ? '#f72585' : '#f8961e';
    const statusIcon = status.status==='completed' ? 'fas fa-check-circle' : status.status==='exceeded' ? 'fas fa-exclamation-triangle' : 'fas fa-clock';
    const existing = document.getElementById('single-category-status-modal'); if(existing) existing.remove();
    const html = `<div class="modal" id="single-category-status-modal"><div class="modal-content" style="max-width:520px;">
        <div class="modal-header"><h3>حالة الفئة: ${category.name}</h3><button class="close-btn" onclick="closeModal('single-category-status-modal')">&times;</button></div>
        <div class="modal-body">
            <div style="border-right:6px solid ${statusColor};padding:12px;border-radius:8px;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
                    <div style="display:flex;align-items:center;gap:10px;"><div style="width:12px;height:12px;border-radius:50%;background:${statusColor}"></div><strong style="color:var(--theme-text)">${category.name}</strong></div>
                    <i class="${statusIcon}" style="color:${statusColor}"></i>
                </div>
                <p style="color:var(--theme-text)">${status.message}</p>
                <div style="font-size:0.9rem;color:var(--gray-color);display:flex;gap:12px;margin-top:10px;">
                    <span><i class="fas fa-tasks"></i> ${status.totalTasks} مهام</span>
                    <span><i class="fas fa-check-circle"></i> ${status.completedTasks} مكتملة</span>
                    <span><i class="fas fa-clock"></i> ${status.totalDuration} دقيقة</span>
                    <span><i class="fas fa-hourglass"></i> ${status.categoryTimeframe} دقيقة (حد)</span>
                </div>
            </div>
        </div>
        <div class="modal-footer"><button class="btn btn-secondary" onclick="closeModal('single-category-status-modal')">إغلاق</button><button class="btn btn-primary" onclick="openEditCategoryModal('${category.id}'); closeModal('single-category-status-modal')">تعديل الرسالة</button></div>
    </div></div>`;
    document.body.insertAdjacentHTML('beforeend', html);
    document.getElementById('single-category-status-modal').classList.add('active');
}

// ========== Calendar rendering ==========
function renderCalendar(){
    const container = document.getElementById('calendar-content'); if(!container) return;
    if(AppState.currentCalendarView==='daily') return renderDailyCalendar(container);
    if(AppState.currentCalendarView==='weekly') return renderWeeklyCalendar(container);
    return renderMonthlyCalendar(container);
}

function renderDailyCalendar(container){
    const date = AppState.currentCalendarDate; const dateStr = date.toISOString().split('T')[0];
    const tasksForDay = AppState.tasks.filter(t=>t.date===dateStr);
    const timedTasks = tasksForDay.filter(t=>t.time).sort((a,b)=>(timeStrToMinutes(a.time)||9999)-(timeStrToMinutes(b.time)||9999));
    const noTimeTasks = tasksForDay.filter(t=>!t.time);
    const overdueGlobal = AppState.tasks.filter(t=>isTaskOverdue(t) && !t.completed);

    const timeSlots = [
        { start: '00:00', end: '04:00', label: 'منتصف الليل (12ص - 4ص)' },
        { start: '04:00', end: '06:00', label: 'الفجر (4ص - 6ص)' },
        { start: '06:00', end: '12:00', label: 'الصباح (6ص - 12م)' },
        { start: '12:00', end: '15:00', label: 'الظهر (12م - 3م)' },
        { start: '15:00', end: '18:00', label: 'العصر (3م - 6م)' },
        { start: '18:00', end: '19:00', label: 'المغرب (6م - 7م)' },
        { start: '19:00', end: '24:00', label: 'العشاء (7م - 12ص)' }
    ];

    let html = `<div class="calendar-nav" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
        <button class="btn btn-secondary btn-sm" onclick="changeCalendarDate(-1)"><i class="fas fa-chevron-right"></i> أمس</button>
        <h3 style="margin:0 15px;">${date.toLocaleDateString('ar-SA', { weekday:'long', year:'numeric', month:'long', day:'numeric'})}</h3>
        <button class="btn btn-secondary btn-sm" onclick="changeCalendarDate(1)">غداً <i class="fas fa-chevron-left"></i></button>
    </div><div class="daily-calendar" id="daily-calendar-container">`;

    // top area: no-time and overdue
    html += `<div class="time-slot" data-time="no-time"><div class="time-header"><div class="time-title"><i class="fas fa-clock"></i> مهام بدون وقت / متأخرة</div><span class="task-count">${noTimeTasks.length + overdueGlobal.length} مهام</span></div><div class="time-tasks">`;
    if(noTimeTasks.length===0 && overdueGlobal.length===0) html += `<div style="text-align:center;padding:12px;color:var(--gray-color)">لا توجد مهام بدون وقت أو متأخرة</div>`;
    else{
        overdueGlobal.forEach(task=>{
            const category = getCategoryById(task.categoryId);
            html += `<div class="calendar-task-card overdue" data-id="${task.id}" onclick="openEditTaskModal('${task.id}')" style="border-left:4px solid ${category.color};"><div class="calendar-task-title">${task.title} <span style="color:var(--danger-color)">(متأخرة)</span></div><div class="calendar-task-meta"><span>${formatDate(task.date)}</span><span>${task.duration} د</span></div></div>`;
        });
        noTimeTasks.forEach(task=>{
            const category = getCategoryById(task.categoryId);
            html += `<div class="calendar-task-card" data-id="${task.id}" onclick="openEditTaskModal('${task.id}')" style="border-left:4px solid ${category.color};"><div class="calendar-task-title">${task.title}</div><div class="calendar-task-meta"><span>${task.duration} د</span></div></div>`;
        });
    }
    html += `</div></div>`;

    timeSlots.forEach(slot=>{
        const slotStart = timeStrToMinutes(slot.start);
        const slotEnd = slot.end==='24:00'?24*60-1:timeStrToMinutes(slot.end);
        const slotTasks = timedTasks.filter(t=>{ const m = timeStrToMinutes(t.time||''); return m>=slotStart && m<=slotEnd; });
        html += `<div class="time-slot" data-time="${slot.start}"><div class="time-header"><div class="time-title"><i class="fas fa-clock"></i> ${slot.label}</div><span class="task-count">${slotTasks.length} مهام</span></div><div class="time-tasks">`;
        if(slotTasks.length===0) html += `<div style="text-align:center;padding:12px;color:var(--gray-color)">لا توجد مهام في هذه الفترة</div>`;
        else {
            slotTasks.forEach(task=>{
                const cat = getCategoryById(task.categoryId);
                html += `<div class="calendar-task-card" data-id="${task.id}" onclick="openEditTaskModal('${task.id}')" style="border-left:4px solid ${cat.color};"><div class="calendar-task-title">${task.title}</div><div class="calendar-task-meta"><span>${task.time||''}</span><span>${task.duration} د</span></div></div>`;
            });
        }
        html += `</div></div>`;
    });

    html += `</div>`;
    container.innerHTML = html;
    setTimeout(()=>{ setupCalendarTooltips(); setupCalendarHoverEffects(); },100);
}

function renderWeeklyCalendar(container){
    // weekly displayed similar to monthly (grid of 7)
    const currentDate = AppState.currentCalendarDate;
    const startOfWeek = new Date(currentDate); startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
    let html = `<div class="calendar-nav" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
        <button class="btn btn-secondary btn-sm" onclick="navigateCalendarWeeks(-1)"><i class="fas fa-chevron-right"></i> الأسبوع السابق</button>
        <h3>الأسبوع ${currentDate.getWeekNumber()}</h3>
        <button class="btn btn-secondary btn-sm" onclick="navigateCalendarWeeks(1)">الأسبوع التالي <i class="fas fa-chevron-left"></i></button>
    </div><div style="text-align:center;margin-bottom:15px;"><button class="btn btn-primary btn-sm" onclick="AppState.currentCalendarDate=new Date(); renderCalendar();">العودة للأسبوع الحالي</button></div><div class="monthly-calendar weekly-like-calendar">`;
    const dayHeaders = ['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'];
    dayHeaders.forEach(h=> html += `<div class="month-day-header">${h}</div>`);
    for(let i=0;i<7;i++){
        const day = new Date(startOfWeek); day.setDate(startOfWeek.getDate()+i);
        const dateStr = day.toISOString().split('T')[0];
        const dayTasks = AppState.tasks.filter(t=>t.date===dateStr).sort((a,b)=> (a.time?timeStrToMinutes(a.time):9999)-(b.time?timeStrToMinutes(b.time):9999));
        const isToday = dateStr === new Date().toISOString().split('T')[0];
        html += `<div class="month-day ${isToday?'today':''}" data-date="${dateStr}"><div class="day-number">${day.getDate()}${isToday?'<span style="font-size:0.7rem;color:var(--theme-primary)">(اليوم)</span>':''}</div><div class="month-tasks">`;
        if(dayTasks.length===0) html += `<div style="text-align:center;padding:20px;color:var(--gray-color)"><i class="fas fa-calendar-day" style="opacity:0.3"></i><p>لا توجد مهام</p></div>`;
        else dayTasks.forEach(task=>{ const cat=getCategoryById(task.categoryId); html += `<div class="month-task-item ${task.completed?'completed':''}" data-id="${task.id}" onclick="openEditTaskModal('${task.id}')" style="border-right:2px solid ${cat.color};"><div style="display:flex;align-items:center;gap:6px"><span class="month-task-dot" style="background:${cat.color}"></span><span>${task.title.length>30?task.title.substring(0,30)+'...':task.title}</span></div><div style="font-size:0.75rem;color:var(--gray-color);">${task.time||''} ${task.completed?'<span style="color:var(--success-color)"><i class="fas fa-check"></i></span>':''}</div></div>`; });
        html += `</div></div>`;
    }
    html += `</div>`;
    container.innerHTML = html;
    setTimeout(()=>{ setupCalendarTooltips(); setupCalendarHoverEffects(); },100);
}

function renderMonthlyCalendar(container){
    const date = AppState.currentCalendarDate; const year = date.getFullYear(); const month = date.getMonth();
    const first = new Date(year,month,1); const last = new Date(year,month+1,0); const daysInMonth = last.getDate(); const startDay = first.getDay();
    let html = `<div class="calendar-nav" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
        <button class="btn btn-secondary btn-sm" onclick="changeCalendarMonth(-1)"><i class="fas fa-chevron-right"></i> الشهر الماضي</button>
        <h3>${date.toLocaleDateString('ar-SA', { year:'numeric', month:'long' })}</h3>
        <button class="btn btn-secondary btn-sm" onclick="changeCalendarMonth(1)">الشهر القادم <i class="fas fa-chevron-left"></i></button>
    </div><div style="text-align:center;margin-bottom:15px;"><button class="btn btn-primary btn-sm" onclick="AppState.currentCalendarDate=new Date(); renderCalendar();">العودة للشهر الحالي</button></div><div class="monthly-calendar">`;
    const dayHeaders = ['أحد','اثنين','ثلاثاء','أربعاء','خميس','جمعة','سبت']; dayHeaders.forEach(d=> html+=`<div class="month-day-header">${d}</div>`);
    for(let i=0;i<startDay;i++) html += '<div class="empty-day"></div>';
    for(let day=1; day<=daysInMonth; day++){
        const dateStr = `${year}-${(month+1).toString().padStart(2,'0')}-${day.toString().padStart(2,'0')}`;
        const dayTasks = AppState.tasks.filter(t=>t.date===dateStr);
        const isToday = dateStr === new Date().toISOString().split('T')[0];
        html += `<div class="month-day ${isToday?'today':''}" data-date="${dateStr}"><div class="day-number">${day}${isToday?'<span style="font-size:0.7rem;color:var(--theme-primary)">(اليوم)</span>':''}</div><div class="month-tasks">`;
        if(dayTasks.length===0) html += `<div style="text-align:center;color:var(--gray-color)"><i class="fas fa-calendar-day" style="opacity:0.3"></i></div>`;
        else{
            dayTasks.slice(0,3).forEach(task=>{ const cat=getCategoryById(task.categoryId); html += `<div class="month-task-item" data-id="${task.id}" onclick="openEditTaskModal('${task.id}')" style="border-right:2px solid ${cat.color};"><div style="display:flex;align-items:center;gap:6px"><span class="month-task-dot" style="background:${cat.color}"></span><span>${task.title.length>20?task.title.substring(0,20)+'...':task.title}</span></div><div style="font-size:0.75rem;color:var(--gray-color);">${task.time||''} ${task.completed?'<span style="color:var(--success-color)"><i class="fas fa-check"></i></span>':''}</div></div>`; });
            if(dayTasks.length>3) html += `<div style="text-align:center;color:var(--theme-primary);cursor:pointer;padding:4px" onclick="showAllTasksForDay('${dateStr}')">+${dayTasks.length-3} أخرى</div>`;
        }
        html += `</div></div>`;
    }
    html += `</div>`;
    container.innerHTML = html;
    setTimeout(()=>{ setupCalendarTooltips(); setupCalendarHoverEffects(); },100);
}

function navigateCalendarWeeks(n){ AppState.currentCalendarDate.setDate(AppState.currentCalendarDate.getDate()+n*7); renderCalendar(); }
function changeCalendarMonth(n){ AppState.currentCalendarDate.setMonth(AppState.currentCalendarDate.getMonth()+n); renderCalendar(); }
function changeCalendarDate(n){ AppState.currentCalendarDate.setDate(AppState.currentCalendarDate.getDate()+n); renderCalendar(); }
Date.prototype.getWeekNumber = function(){ const date = new Date(this.getTime()); date.setHours(0,0,0,0); date.setDate(date.getDate()+3-(date.getDay()+6)%7); const week1 = new Date(date.getFullYear(),0,4); return 1 + Math.round(((date.getTime()-week1.getTime())/86400000 -3 + (week1.getDay()+6)%7)/7); };

// ========== Tooltips (unified) ==========
function setupTaskHoverEffects(){
    document.querySelectorAll('.task-card:not(.deleted)').forEach(card=>{ if(card._hoverBound) return; card._hoverBound=true; card.addEventListener('mouseenter', e=>{ const id = card.dataset.id; const task = AppState.tasks.find(t=>t.id===id); if(task) showTaskTooltip(e, task); }); card.addEventListener('mouseleave', hideTooltip); });
    document.querySelectorAll('.calendar-task-card, .month-task-item').forEach(card=>{ if(card._hoverBound) return; card._hoverBound=true; card.addEventListener('mouseenter', e=>{ const id = card.dataset.id; const task = AppState.tasks.find(t=>t.id===id); if(task) showTaskTooltip(e, task); }); card.addEventListener('mouseleave', hideTooltip); });
}
function showTaskTooltip(event, task){
    const cat = getCategoryById(task.categoryId);
    const tooltipHTML = `<div class="task-tooltip" style="position:fixed;background:var(--theme-card);border:2px solid var(--theme-primary);border-radius:8px;padding:12px;z-index:10000;max-width:320px;color:var(--theme-text);">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;"><strong style="color:var(--theme-primary)">${task.title}</strong><span style="background:${cat.color};color:#fff;padding:3px 8px;border-radius:12px">${cat.name}</span></div>
        ${task.description?`<p style="margin:8px 0;color:var(--theme-text)">${task.description}</p>`:''}
        <div style="color:var(--gray-color);font-size:0.9rem;display:flex;gap:10px;flex-wrap:wrap;"><div><i class="fas fa-calendar"></i> ${formatDate(task.date)}</div><div><i class="fas fa-clock"></i> ${task.time||'بدون وقت'}</div><div><i class="fas fa-stopwatch"></i> ${task.duration} د</div></div>
        <div style="margin-top:8px;text-align:center;color:var(--theme-primary);font-size:0.85rem;">انقر للتعديل</div></div>`;
    document.querySelectorAll('.task-tooltip').forEach(t=>t.remove());
    document.body.insertAdjacentHTML('beforeend', tooltipHTML);
    const tooltip = document.querySelector('.task-tooltip'); positionTooltipNearEvent(tooltip, event);
}
function positionTooltipNearEvent(tooltip,event){
    const padding=12; const x=event.clientX+15; const y=event.clientY+15; const sw=window.innerWidth; const sh=window.innerHeight; const rect = tooltip.getBoundingClientRect ? tooltip.getBoundingClientRect() : {width:300,height:200}; let fx=x, fy=y; if(x+rect.width+padding>sw) fx = sw - rect.width - padding; if(y+rect.height+padding>sh) fy = sh - rect.height - padding; tooltip.style.left=`${fx}px`; tooltip.style.top=`${fy}px`;
}
function hideTooltip(){ document.querySelectorAll('.task-tooltip').forEach(t=>t.remove()); }

// ========== Notes editor ==========
function renderNotes(){
    const container = document.getElementById('notes-list'); if(!container) return;
    if(AppState.notes.length===0){ container.innerHTML='<div class="empty-state" style="text-align:center;padding:60px;color:var(--gray-color)"><i class="fas fa-sticky-note" style="font-size:3rem;opacity:0.3"></i><h3>لا توجد ملاحظات</h3></div>'; return; }
    container.innerHTML = AppState.notes.map(note=>{
        const content = (AppState.currentTheme==='black') ? (note.content || '').replace(/class="note-checkbox-text"/g, 'class="note-checkbox-text" style="color:#f0f0f0 !important;"') : (note.content||'');
        return `<div class="note-card" data-id="${note.id}" onclick="openNoteEditor('${note.id}')" style="cursor:pointer;"><div class="note-header"><input type="text" class="note-title" value="${escapeHtml(note.title)}" onchange="updateNoteTitle('${note.id}', this.value)" onclick="event.stopPropagation()"><div class="note-date">${formatDate(note.updatedAt)}</div></div><div class="note-content" style="font-family:${note.fontFamily};font-size:${note.fontSize}px;font-weight:${note.fontWeight};color:${note.color};pointer-events:none;">${content||'<p style="color:var(--theme-text);opacity:0.7">انقر لتحرير الملاحظة...</p>'}</div><div class="note-footer"><div class="note-font">${note.fontFamily.split(',')[0].replace(/'/g,'')} - ${note.fontSize}px</div><div class="note-actions"><button class="btn btn-danger btn-sm delete-note-btn" data-id="${note.id}" onclick="event.stopPropagation(); deleteNote('${note.id}')"><i class="fas fa-trash"></i></button></div></div></div>`; }).join('');
}

function openNoteEditor(noteId){
    const note = AppState.notes.find(n=>n.id===noteId); if(!note) return;
    AppState.currentNoteId = noteId;
    document.getElementById('notes-editor-title').value = note.title;
    document.getElementById('notes-font-family').value = note.fontFamily;
    document.getElementById('notes-font-size').value = note.fontSize;
    document.getElementById('notes-font-weight').value = note.fontWeight;
    document.getElementById('notes-font-color').value = note.color;
    const editor = document.getElementById('notes-editor-content'); editor.innerHTML = note.content || ''; editor.style.fontFamily = note.fontFamily; editor.style.fontSize = note.fontSize+'px'; editor.style.fontWeight = note.fontWeight; editor.style.color = note.color;
    AppState.notesEditorDirty = false;
    document.getElementById('notes-editor').classList.add('active');
    setTimeout(()=>{ setupEnhancedNotesEditor(); setupNotesEditorEvents(); },100);
}

function setupEnhancedNotesEditor(){
    const linkBtn = document.getElementById('add-link-btn'); if(linkBtn && !linkBtn._bound){ linkBtn._bound = true; linkBtn.addEventListener('click', addLinkToNote); }
    const imgBtn = document.getElementById('add-image-btn'); if(imgBtn && !imgBtn._bound){ imgBtn._bound=true; imgBtn.addEventListener('click', ()=> document.getElementById('notes-image-file-input')?.click()); }
    const fileInput = document.getElementById('notes-image-file-input'); if(fileInput && !fileInput._bound){ fileInput._bound=true; fileInput.addEventListener('change', function(e){ const file = e.target.files[0]; if(!file) return; if(!file.type.startsWith('image/')){ alert('الرجاء اختيار ملف صورة'); return; } const reader = new FileReader(); reader.onload = function(ev){ const imgHTML = `<div class="note-image-wrapper" contenteditable="false"><img src="${ev.target.result}" class="note-embedded-image"><button class="remove-image-btn" title="حذف الصورة">حذف</button></div>`; insertHTMLToEditor(imgHTML); AppState.notesEditorDirty = true; }; reader.readAsDataURL(file); e.target.value=''; }); }
}

function addLinkToNote(){
    const url = prompt('أدخل رابط URL:', 'https://'); if(!url) return;
    const selection = window.getSelection(); const editor = document.getElementById('notes-editor-content');
    if(selection && selection.rangeCount>0 && !selection.isCollapsed && editor.contains(selection.anchorNode)){ document.execCommand('createLink', false, url); }
    else insertHTMLToEditor(`<a href="${url}" target="_blank">${url}</a>`);
    AppState.notesEditorDirty = true;
}
function insertHTMLToEditor(html){ const editor = document.getElementById('notes-editor-content'); if(!editor) return; const sel = window.getSelection(); if(sel && sel.rangeCount>0 && editor.contains(sel.anchorNode)){ const range = sel.getRangeAt(0); range.deleteContents(); const div = document.createElement('div'); div.innerHTML = html; const frag = document.createDocumentFragment(); let node; while((node = div.firstChild)) frag.appendChild(node); range.insertNode(frag); range.collapse(false); sel.removeAllRanges(); sel.addRange(range); } else editor.innerHTML += html; editor.focus(); AppState.notesEditorDirty = true; }

function setupNotesEditorEvents(){
    const editor = document.getElementById('notes-editor-content'); if(!editor) return;
    if(!editor._pasteBound){ editor._pasteBound=true; editor.addEventListener('paste', function(e){ const items = (e.clipboardData||e.originalEvent.clipboardData).items; if(!items) return; for(let i=0;i<items.length;i++){ const item=items[i]; if(item.type.indexOf('image') !== -1){ const file = item.getAsFile(); const reader = new FileReader(); reader.onload = function(ev){ const imgHTML = `<div class="note-image-wrapper" contenteditable="false"><img src="${ev.target.result}" class="note-embedded-image"><button class="remove-image-btn" title="حذف الصورة">حذف</button></div>`; insertHTMLToEditor(imgHTML); AppState.notesEditorDirty=true; }; reader.readAsDataURL(file); e.preventDefault(); } } }); }

    const saveNotesBtn = document.getElementById('save-notes-btn'); if(saveNotesBtn && !saveNotesBtn._bound){ saveNotesBtn._bound=true; saveNotesBtn.addEventListener('click', ()=> saveNote()); }
    const closeNotesBtn = document.getElementById('close-notes-btn'); if(closeNotesBtn && !closeNotesBtn._bound){ closeNotesBtn._bound=true; closeNotesBtn.addEventListener('click', ()=>{ if(AppState.notesEditorDirty && !confirm('هناك تغييرات غير محفوظة. الخروج دون حفظ؟')) return; document.getElementById('notes-editor').classList.remove('active'); AppState.notesEditorDirty=false; }); }

    const addCheckboxBtn = document.getElementById('add-checkbox-btn'); if(addCheckboxBtn && !addCheckboxBtn._bound){ addCheckboxBtn._bound=true; addCheckboxBtn.addEventListener('click', ()=>{ insertHTMLToEditor(`<div class="note-checkbox-item"><input type="checkbox" class="note-checkbox small-checkbox"> <span class="note-checkbox-text" contenteditable="true">عنصر جديد</span></div>`); AppState.notesEditorDirty=true; }); }

    editor.addEventListener('click', function(e){ if(e.target && e.target.classList && e.target.classList.contains('remove-image-btn')){ const wrapper = e.target.closest('.note-image-wrapper'); if(wrapper) wrapper.remove(); AppState.notesEditorDirty = true; } });

    // formatting buttons: alignment are exclusive
    document.querySelectorAll('.format-btn').forEach(btn=>{ if(btn._bound) return; btn._bound=true; btn.addEventListener('click', function(){ const cmd = this.dataset.command; const editorLocal = document.getElementById('notes-editor-content'); if(!editorLocal) return; if(['justifyLeft','justifyCenter','justifyRight'].includes(cmd)){ editorLocal.style.textAlign = cmd==='justifyLeft' ? 'left' : cmd==='justifyCenter' ? 'center' : 'right'; document.querySelectorAll('.format-btn[data-command^="justify"]').forEach(b=>b.classList.remove('active')); this.classList.add('active'); } else { document.execCommand(cmd, false, null); this.classList.toggle('active'); } AppState.notesEditorDirty = true; }); });

    const fontFamilySelect = document.getElementById('notes-font-family'); if(fontFamilySelect && !fontFamilySelect._bound){ fontFamilySelect._bound=true; fontFamilySelect.addEventListener('change', function(){ document.getElementById('notes-editor-content').style.fontFamily = this.value; AppState.notesEditorDirty = true; }); }
    const fontSizeSelect = document.getElementById('notes-font-size'); if(fontSizeSelect && !fontSizeSelect._bound){ fontSizeSelect._bound=true; fontSizeSelect.addEventListener('change', function(){ document.getElementById('notes-editor-content').style.fontSize = this.value + 'px'; AppState.notesEditorDirty = true; }); }
    const fontWeightSelect = document.getElementById('notes-font-weight'); if(fontWeightSelect && !fontWeightSelect._bound){ fontWeightSelect._bound=true; fontWeightSelect.addEventListener('change', function(){ document.getElementById('notes-editor-content').style.fontWeight = this.value; AppState.notesEditorDirty = true; }); }
    const fontColorInput = document.getElementById('notes-font-color'); if(fontColorInput && !fontColorInput._bound){ fontColorInput._bound=true; fontColorInput.addEventListener('change', function(){ document.getElementById('notes-editor-content').style.color = this.value; AppState.notesEditorDirty = true; }); }
}

function saveNote(){
    if(!AppState.currentNoteId) return;
    const title = document.getElementById('notes-editor-title').value;
    const content = document.getElementById('notes-editor-content').innerHTML;
    const fontFamily = document.getElementById('notes-font-family').value;
    const fontSize = document.getElementById('notes-font-size').value;
    const fontWeight = document.getElementById('notes-font-weight').value;
    const color = document.getElementById('notes-font-color').value;
    updateNote(AppState.currentNoteId, { title, content, fontFamily, fontSize, fontWeight, color });
    document.getElementById('notes-editor').classList.remove('active'); AppState.notesEditorDirty=false;
}

// ========== Search modal & functionality ==========
function openSearchModal(){ const existing = document.getElementById('search-modal'); if(existing) existing.remove();
    const html = `<div class="modal" id="search-modal"><div class="modal-content" style="max-width:700px;">
        <div class="modal-header"><h3>بحث في التطبيق</h3><button class="close-btn" onclick="closeModal('search-modal')">&times;</button></div>
        <div class="modal-body">
            <input id="global-search-input-modal" type="search" placeholder="ابحث عن مهام، ملاحظات، فئات..." style="width:100%;padding:12px;border:1px solid var(--theme-border);border-radius:8px;margin-bottom:12px;">
            <div id="global-search-results" style="max-height:400px;overflow:auto;"></div>
        </div>
        <div class="modal-footer"><button class="btn btn-secondary" onclick="closeModal('search-modal')">إغلاق</button></div>
    </div></div>`;
    document.body.insertAdjacentHTML('beforeend', html);
    document.getElementById('search-modal').classList.add('active');
    setTimeout(()=>{ const input = document.getElementById('global-search-input-modal'); input.focus(); input.addEventListener('keydown', (e)=>{ if(e.key==='Enter') performModalSearch(input.value.trim()); }); },50);
}
function performModalSearch(query){
    const results = [];
    if(!query) { document.getElementById('global-search-results').innerHTML = '<div style="color:var(--gray-color)">أدخل نصاً للبحث</div>'; return; }
    const taskMatches = AppState.tasks.filter(t => (t.title && t.title.includes(query)) || (t.description && t.description.includes(query)));
    const noteMatches = AppState.notes.filter(n => (n.title && n.title.includes(query)) || (n.content && n.content.includes(query)));
    const categoryMatches = AppState.categories.filter(c => c.name && c.name.includes(query));
    let html = `<div style="margin-bottom:8px;color:var(--gray-color)">المهام: ${taskMatches.length} — الملاحظات: ${noteMatches.length} — الفئات: ${categoryMatches.length}</div>`;
    if(taskMatches.length>0) html += taskMatches.map(t=>`<div class="search-item" style="padding:8px;border-bottom:1px solid var(--theme-border);cursor:pointer;" onclick="openEditTaskModal('${t.id}'); closeModal('search-modal')"><strong>${t.title}</strong><div style="font-size:0.85rem;color:var(--gray-color)">${t.description||''}</div></div>`).join('');
    if(noteMatches.length>0) html += '<h4>ملاحظات</h4>' + noteMatches.map(n=>`<div class="search-item" style="padding:8px;border-bottom:1px solid var(--theme-border);cursor:pointer;" onclick="openNoteEditor('${n.id}'); closeModal('search-modal')"><strong>${n.title}</strong></div>`).join('');
    if(categoryMatches.length>0) html += '<h4>فئات</h4>' + categoryMatches.map(c=>`<div class="search-item" style="padding:8px;border-bottom:1px solid var(--theme-border);cursor:pointer;" onclick="openEditCategoryModal('${c.id}'); closeModal('search-modal')"><strong>${c.name}</strong></div>`).join('');
    document.getElementById('global-search-results').innerHTML = html;
}

// ========== Settings & UI setup ==========
function setupSettingsEvents(){
    const settingsBtn = document.getElementById('settings-btn');
    if(settingsBtn) settingsBtn.addEventListener('click', e=>{ e.preventDefault(); e.stopPropagation(); document.getElementById('settings-popup')?.classList.toggle('active'); });
    document.addEventListener('click', function(e){
        const popup = document.getElementById('settings-popup'); const btn = document.getElementById('settings-btn');
        if(popup && popup.classList.contains('active') && !popup.contains(e.target) && e.target !== btn && !btn.contains(e.target)) popup.classList.remove('active');
    });
    document.querySelectorAll('.theme-option').forEach(option=> option.addEventListener('click', function(e){ e.stopPropagation(); changeTheme(this.dataset.theme); document.getElementById('settings-popup')?.classList.remove('active'); }));
    document.getElementById('search-btn')?.addEventListener('click', openSearchModal);
}

// ========== Misc UI ==========
function ensureFilterBar(){
    const filters = document.querySelector('.task-filters'); if(!filters) return;
    let right = filters.querySelector('.filters-right'); if(!right){ right = document.createElement('div'); right.className='filters-right'; right.style.display='flex'; right.style.alignItems='center'; right.style.gap='8px'; const statusBtn = document.createElement('button'); statusBtn.id='categories-status-btn'; statusBtn.className='btn btn-info'; statusBtn.innerHTML='<i class="fas fa-chart-pie"></i> حالة الفئات'; statusBtn.addEventListener('click', showCategoriesStatusModal); right.appendChild(statusBtn); filters.appendChild(right); }
}
function showCategoriesStatusModal(){
    const existing = document.getElementById('categories-status-modal'); if(existing) existing.remove();
    let modalHTML = `<div class="modal" id="categories-status-modal"><div class="modal-content" style="max-width:600px;"><div class="modal-header"><h3>حالة الفئات</h3><button class="close-btn" onclick="closeModal('categories-status-modal')">&times;</button></div><div class="modal-body"><div class="categories-status-container">`;
    AppState.categories.forEach(category=>{
        const status = calculateCategoryStatus(category.id);
        if(!status) return;
        let statusColor = '#6c757d'; let statusIcon = 'fas fa-circle';
        if(status.status==='empty'){ statusColor='#6c757d'; statusIcon='fas fa-inbox'; }
        if(status.status==='completed'){ statusColor='#4cc9f0'; statusIcon='fas fa-check-circle'; }
        if(status.status==='exceeded'){ statusColor='#f72585'; statusIcon='fas fa-exclamation-triangle'; }
        if(status.status==='pending'){ statusColor='#f8961e'; statusIcon='fas fa-clock'; }
        modalHTML += `<div class="category-status-card" style="border-right:4px solid ${statusColor};margin-bottom:15px;padding:15px;background:var(--theme-card);border-radius:8px;">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
                <div style="display:flex;align-items:center;gap:10px;"><div style="width:12px;height:12px;border-radius:50%;background:${statusColor}"></div><h4 style="margin:0;color:var(--theme-text)">${category.name}</h4></div><i class="${statusIcon}" style="color:${statusColor}"></i>
            </div>
            <p style="color:${statusColor};margin-bottom:10px;font-weight:500">${status.message}</p>
            <div style="display:flex;gap:15px;font-size:0.85rem;color:var(--gray-color)"><span><i class="fas fa-tasks"></i> ${status.totalTasks} مهام</span><span><i class="fas fa-check-circle"></i> ${status.completedTasks} مكتملة</span><span><i class="fas fa-clock"></i> ${status.totalDuration} دقيقة</span><span><i class="fas fa-hourglass"></i> ${status.categoryTimeframe} دقيقة (حد)</span></div>
            <div style="margin-top:10px;display:flex;gap:8px;justify-content:flex-end"><button class="btn btn-secondary" onclick="openEditCategoryModal('${category.id}'); closeModal('categories-status-modal')">تعديل</button></div>
        </div>`;
    });
    modalHTML += `</div></div><div class="modal-footer"><button class="btn btn-secondary" onclick="closeModal('categories-status-modal')">إغلاق</button></div></div></div>`;
    document.body.insertAdjacentHTML('beforeend', modalHTML); document.getElementById('categories-status-modal').classList.add('active');
}

// ========== Global controls & event delegation ==========
function setupGlobalControls(){
    const undoBtn = document.getElementById('undo-btn'); const redoBtn = document.getElementById('redo-btn'); const searchInput = document.getElementById('global-search');
    if(undoBtn) undoBtn.addEventListener('click', ()=> document.execCommand('undo'));
    if(redoBtn) redoBtn.addEventListener('click', ()=> document.execCommand('redo'));
    if(searchInput) searchInput.addEventListener('keydown', e=>{ if(e.key==='Enter') performGlobalSearch(searchInput.value.trim()); });
}
function performGlobalSearch(query){
    if(!query){ alert('الرجاء إدخال نص للبحث'); return; }
    const taskMatches = AppState.tasks.filter(t=> (t.title && t.title.includes(query)) || (t.description && t.description.includes(query)));
    const noteMatches = AppState.notes.filter(n=> (n.title && n.title.includes(query)) || (n.content && n.content.includes(query)));
    const categoryMatches = AppState.categories.filter(c=> c.name && c.name.includes(query));
    let message = `نتائج البحث عن "${query}":\n\nالمهام: ${taskMatches.length}\nالملاحظات: ${noteMatches.length}\nالفئات: ${categoryMatches.length}\n\n`;
    if(taskMatches.length>0) message += `أولى المهام: ${taskMatches[0].title}\n`;
    if(noteMatches.length>0) message += `أولى الملاحظات: ${noteMatches[0].title}\n`;
    if(categoryMatches.length>0) message += `أولى الفئات: ${categoryMatches[0].name}\n`;
    alert(message);
}

// ========== DOM checks & event wiring ==========
function checkDOMElements(){
    const required = ['tasks-view','calendar-view','categories-view','notes-view','tasks-list','calendar-content','categories-list','notes-list','add-task-modal','edit-task-modal','category-modal'];
    const missing = [];
    required.forEach(id=>{ if(!document.getElementById(id)) missing.push(id); });
    if(missing.length) console.error('عناصر مفقودة:', missing);
    else console.log('✅ جميع عناصر DOM موجودة');
}

function openEditTaskModal(taskId){
    const task = AppState.tasks.find(t=>t.id===taskId); if(!task) return;
    AppState.currentTaskId = taskId;
    document.getElementById('edit-task-title').value = task.title;
    document.getElementById('edit-task-description').value = task.description || '';
    document.getElementById('edit-task-date').value = task.date || '';
    document.getElementById('edit-task-time').value = task.time || '';
    document.getElementById('edit-task-duration').value = task.duration || 30;
    document.getElementById('edit-task-priority').value = task.priority || 'medium';
    const sel = document.getElementById('edit-task-category'); if(sel){ sel.innerHTML = '<option value="">-- اختر الفئة --</option>'; AppState.categories.forEach(c=>{ const opt = document.createElement('option'); opt.value=c.id; opt.textContent=c.name; if(c.id===task.categoryId) opt.selected=true; sel.appendChild(opt); }); }
    document.getElementById('edit-task-modal')?.classList.add('active');
}

function openAddTaskModal(preselectedCategory=null){
    const modal = document.getElementById('add-task-modal'); if(!modal) return;
    modal.classList.add('active');
    const sel = document.getElementById('task-category'); if(sel){ sel.innerHTML='<option value="">-- اختر الفئة --</option>'; AppState.categories.forEach(c=>{ const opt=document.createElement('option'); opt.value=c.id; opt.textContent=c.name; if(preselectedCategory===c.id) opt.selected=true; sel.appendChild(opt); }); }
    const today = new Date().toISOString().split('T')[0]; document.getElementById('task-date').value = today;
    setTimeout(()=>document.getElementById('task-title')?.focus(),150);
}

function closeModal(id){ const modal = document.getElementById(id); if(modal) modal.classList.remove('active'); }

function setupEventDelegation(){
    document.body.addEventListener('click', function(e){
        const target = e.target;
        if(target.classList && target.classList.contains('filter-btn')){ e.preventDefault(); setFilter(target.dataset.filter); }
        if(target.classList && target.classList.contains('calendar-tab')){ e.preventDefault(); AppState.currentCalendarView = target.dataset.range; renderCalendar(); }
        if(target.closest('.nav-item')){ e.preventDefault(); const view = target.closest('.nav-item').dataset.view; switchView(view); }
        // modal saving actions
        if(target.id==='save-task' || target.closest('#save-task')){ e.preventDefault(); saveNewTask(); }
        if(target.id==='save-edit-task' || target.closest('#save-edit-task')){ e.preventDefault(); saveEditedTask(); }
        if(target.id==='save-category' || target.closest('#save-category')){ e.preventDefault(); saveCategory(); }
        if(target.id==='add-task-btn' || target.closest('#add-task-btn')){ e.preventDefault(); openAddTaskModal(); }
        if(target.id==='add-category-btn' || target.closest('#add-category-btn')){ e.preventDefault(); openAddCategoryModal(); }
        if(target.id==='add-note-btn' || target.closest('#add-note-btn')){ e.preventDefault(); addNote(); }
    });

    document.body.addEventListener('submit', function(e){ e.preventDefault(); if(e.target.id==='task-form') saveNewTask(); if(e.target.id==='edit-task-form') saveEditedTask(); if(e.target.id==='category-form') saveCategory(); });
}

// ========== Save new/edit task handlers ==========
function saveNewTask(){
    const title = document.getElementById('task-title'); const category = document.getElementById('task-category');
    if(!title || !category){ alert('نموذج غير مكتمل'); return; }
    if(!title.value.trim()){ alert('الرجاء كتابة عنوان'); title.focus(); return; }
    if(!category.value){ alert('الرجاء اختيار فئة'); category.focus(); return; }
    const desc = document.getElementById('task-description')?.value || '';
    const duration = document.getElementById('task-duration')?.value || 30;
    const date = document.getElementById('task-date')?.value || new Date().toISOString().split('T')[0];
    const time = document.getElementById('task-time')?.value || '';
    const priority = document.getElementById('task-priority')?.value || 'medium';
    addTask({ title: title.value.trim(), description: desc.trim(), categoryId: category.value, duration: parseInt(duration)||30, date, time, priority });
}

function saveEditedTask(){
    if(!AppState.currentTaskId) return;
    const title = document.getElementById('edit-task-title'); const category = document.getElementById('edit-task-category');
    if(!title || !category) return;
    if(!title.value.trim()){ alert('الرجاء إدخال عنوان'); title.focus(); return; }
    const desc = document.getElementById('edit-task-description')?.value || '';
    const duration = document.getElementById('edit-task-duration')?.value || 30;
    const date = document.getElementById('edit-task-date')?.value || new Date().toISOString().split('T')[0];
    const time = document.getElementById('edit-task-time')?.value || '';
    const priority = document.getElementById('edit-task-priority')?.value || 'medium';
    updateTask(AppState.currentTaskId, { title: title.value.trim(), description: desc.trim(), categoryId: category.value, duration: parseInt(duration)||30, date, time, priority });
}

// ========== Utilities & init ==========
function setFilter(filterName){ AppState.currentFilter = filterName; document.querySelectorAll('.filter-btn').forEach(b=> b.classList.toggle('active', b.dataset.filter===filterName)); renderTasks(); }
function setupCalendarTooltips(){ /* bound in setupTaskHoverEffects */ }

function initializePage(){
    checkCSS();
    checkDOMElements();
    initializeData();
    initializeThemes();
    setupEventDelegation();
    setupSettingsEvents();
    setupGlobalControls();
    ensureFilterBar();
    renderTasks();
    renderCategories();
    renderNotes();
    renderCalendar();
    console.log('🎉 جاهز!');
}

window.addEventListener('DOMContentLoaded', function(){
    setTimeout(()=>{ try { initializePage(); } catch(err){ console.error('خطأ في التهيئة', err); alert('حدث خطأ أثناء التهيئة'); } }, 150);
    setTimeout(()=>{ const warning = document.getElementById('css-warning'); if(warning) warning.remove(); }, 5000);
});

// Expose some functions to window for inline onclicks
window.openEditTaskModal = openEditTaskModal;
window.openAddTaskModal = openAddTaskModal;
window.openEditCategoryModal = openEditCategoryModal;
window.openNoteEditor = openNoteEditor;
window.toggleTaskCompletion = toggleTaskCompletion;
window.closeModal = closeModal;
window.openAddCategoryModal = openAddCategoryModal;
window.showCategoryStatusModal = showCategoryStatusModal;
window.deleteAndReplaceTask = deleteAndReplaceTask;
window.addTaskAnyway = addTaskAnyway;
window.changeCalendarDate = changeCalendarDate;
window.navigateCalendarWeeks = navigateCalendarWeeks;
window.changeCalendarMonth = changeCalendarMonth;
window.changeCalendarWeek = changeCalendarWeek;
