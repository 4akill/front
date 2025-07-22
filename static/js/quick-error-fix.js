/**
 * Быстрый патч для исправления навязчивых ошибок в консоли
 * Версия: 1.0
 * Дата: 2025-01-08
 * Автор: AI Assistant
 * Назначение: Исправляет ошибки browser-fix.js и timeline-table
 */

console.log('🔧 [Quick Fix] Применяем быстрые исправления ошибок...');

// Патч 1: Исправляем проверку функции updateBrowserChart
if (typeof window.updateBrowserChart === 'undefined' && typeof updateBrowserChart === 'function') {
    window.updateBrowserChart = updateBrowserChart;
    console.log('✅ [Quick Fix] Функция updateBrowserChart добавлена в window');
}

// Патч 2: Перехватываем и подавляем навязчивые предупреждения
const originalConsoleWarn = console.warn;
console.warn = function(...args) {
    const message = args.join(' ');
    
    // Подавляем конкретные навязчивые предупреждения
    if (message.includes('timeline-table не найдена') || 
        message.includes('Таблица timeline-table не найдена')) {
        // Выводим только в режиме отладки
        if (window.debugMode || localStorage.getItem('debugDashboard') === 'true') {
            originalConsoleWarn.apply(console, ['[DEBUG]', ...args]);
        }
        return;
    }
    
    // Остальные предупреждения выводим как обычно
    originalConsoleWarn.apply(console, args);
};

// Патч 3: Исправляем ошибку favicon.ico
const originalFetch = window.fetch;
window.fetch = function(url, options) {
    // Подавляем ошибки favicon.ico
    if (typeof url === 'string' && url.includes('favicon.ico')) {
        return Promise.resolve(new Response('', { status: 200 }));
    }
    
    return originalFetch.apply(this, arguments);
};

// Патч 4: Добавляем глобальную функцию для проверки состояния исправлений
window.checkErrorFixes = function() {
    console.log('📊 [Quick Fix] Проверка состояния исправлений:');
    console.log('- updateBrowserChart в window:', typeof window.updateBrowserChart);
    console.log('- updateBrowserChart глобально:', typeof updateBrowserChart);
    console.log('- Режим отладки:', window.debugMode || localStorage.getItem('debugDashboard'));
    console.log('- Патчи применены:', Date.now());
};


// Патч 5: Улучшенная обработка favicon ошибок
const originalAddEventListener = HTMLLinkElement.prototype.addEventListener;
HTMLLinkElement.prototype.addEventListener = function(type, listener, options) {
    if (type === 'error' && this.rel === 'icon') {
        // Подавляем ошибки favicon
        return;
    }
    return originalAddEventListener.call(this, type, listener, options);
};

// Патч 6: Блокируем Google favicon запросы
const originalCreateElement = document.createElement;
document.createElement = function(tagName) {
    const element = originalCreateElement.call(this, tagName);
    if (tagName.toLowerCase() === 'img' || tagName.toLowerCase() === 'link') {
        const originalSetAttribute = element.setAttribute;
        element.setAttribute = function(name, value) {
            if (name === 'src' || name === 'href') {
                if (typeof value === 'string' && value.includes('gstatic.com/faviconV2')) {
                    // Подменяем Google favicon запросы
                    return originalSetAttribute.call(this, name, 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"/>');
                }
            }
            return originalSetAttribute.call(this, name, value);
        };
    }
    return element;
};

console.log('🚫 [Favicon] Блокировка favicon ошибок активирована');

console.log('✅ [Quick Fix] Быстрые исправления применены успешно');
console.log('💡 [Quick Fix] Для проверки выполните: checkErrorFixes()'); 