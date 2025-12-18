// تخزين الفئات
let categories = JSON.parse(localStorage.getItem('categories')) || [];

// وظائف إدارة الفئات
export function addCategory(category) {
    categories.push(category);
    saveToLocalStorage();
}

export function deleteCategory(categoryId) {
    categories = categories.filter(category => category.id !== categoryId);
    saveToLocalStorage();
}

export function updateCategory(categoryId, updatedCategory) {
    const index = categories.findIndex(category => category.id === categoryId);
    if (index !== -1) {
        categories[index] = { ...categories[index], ...updatedCategory };
        saveToLocalStorage();
    }
}

export function getCategories() {
    return [...categories];
}

export function getCategoryById(categoryId) {
    return categories.find(category => category.id === categoryId);
}

// حفظ في التخزين المحلي
function saveToLocalStorage() {
    localStorage.setItem('categories', JSON.stringify(categories));
}

// تهيئة بعض الفئات التجريبية
if (categories.length === 0) {
    const sampleCategories = [
        {
            id: 'personal',
            name: 'مهام شخصية',
            color: '#4361ee',
            icon: 'fas fa-home',
            createdAt: new Date().toISOString()
        },
        {
            id: 'work',
            name: 'عمل',
            color: '#f72585',
            icon: 'fas fa-briefcase',
            createdAt: new Date().toISOString()
        },
        {
            id: 'study',
            name: 'دراسة',
            color: '#4cc9f0',
            icon: 'fas fa-graduation-cap',
            createdAt: new Date().toISOString()
        }
    ];
    
    categories = sampleCategories;
    saveToLocalStorage();
}
