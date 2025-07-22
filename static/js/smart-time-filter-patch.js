/**
 * 🔧 Патч для исправления фильтрации данных в умном калькуляторе времени
 * Автор: AI Assistant
 * Дата: 2024
 * Версия: v0.1
 * Назначение: Перехватывает вызовы калькулятора и применяет правильную фильтрацию
 */

// Сохраняем оригинальные функции
let originalUpdateMainMetricsWithRealActivity = null;
let originalUpdateMainMetricsWithRealActivityPrecise = null;

// Флаг инициализации патча
let isFilterPatchInitialized = false;

/**
 * Инициализирует патч для перехвата вызовов калькулятора
 */
function initializeFilterPatch() {
    if (isFilterPatchInitialized) return;
    
    console.log('🔧 [ПАТЧ] Инициализация патча фильтрации данных');
    
    // Ждем загрузки калькуляторов
    const checkAndPatch = () => {
        // Патчим точный калькулятор
        if (typeof updateMainMetricsWithRealActivityPrecise === 'function' && !originalUpdateMainMetricsWithRealActivityPrecise) {
            originalUpdateMainMetricsWithRealActivityPrecise = updateMainMetricsWithRealActivityPrecise;
            
            window.updateMainMetricsWithRealActivityPrecise = function(windowData) {
                console.log('🎯 [ПАТЧ] Перехват точного калькулятора - применяем фильтрацию');
                
                // Получаем данные мыши из window.lastLoadedData
                const mouseData = window.lastLoadedData?.mouse || [];
                
                // Применяем фильтрацию
                const filters = getCurrentActiveFilters();
                const { filteredWindowData, filteredMouseData } = filterDataForSmartCalculator(windowData, mouseData, filters);
                
                // Обновляем window.lastLoadedData с отфильтрованными данными
                window.lastLoadedData = {
                    ...window.lastLoadedData,
                    activities: filteredWindowData,
                    mouse: filteredMouseData
                };
                
                // Вызываем оригинальную функцию с отфильтрованными данными
                return originalUpdateMainMetricsWithRealActivityPrecise.call(this, filteredWindowData);
            };
            
            console.log('✅ [ПАТЧ] Точный калькулятор пропатчен');
        }
        
        // Патчим обычный калькулятор
        if (typeof updateMainMetricsWithRealActivity === 'function' && !originalUpdateMainMetricsWithRealActivity) {
            originalUpdateMainMetricsWithRealActivity = updateMainMetricsWithRealActivity;
            
            window.updateMainMetricsWithRealActivity = function(windowData) {
                console.log('🎯 [ПАТЧ] Перехват умного калькулятора - применяем фильтрацию');
                
                // Получаем данные мыши из window.lastLoadedData
                const mouseData = window.lastLoadedData?.mouse || [];
                
                // Применяем фильтрацию
                const filters = getCurrentActiveFilters();
                const { filteredWindowData, filteredMouseData } = filterDataForSmartCalculator(windowData, mouseData, filters);
                
                // Обновляем window.lastLoadedData с отфильтрованными данными
                window.lastLoadedData = {
                    ...window.lastLoadedData,
                    activities: filteredWindowData,
                    mouse: filteredMouseData
                };
                
                // Вызываем оригинальную функцию с отфильтрованными данными
                return originalUpdateMainMetricsWithRealActivity.call(this, filteredWindowData);
            };
            
            console.log('✅ [ПАТЧ] Умный калькулятор пропатчен');
        }
    };
    
    // Проверяем сразу
    checkAndPatch();
    
    // Проверяем через интервал для случаев поздней загрузки
    const patchInterval = setInterval(() => {
        checkAndPatch();
        
        // Останавливаем интервал если оба калькулятора пропатчены
        if (originalUpdateMainMetricsWithRealActivity && originalUpdateMainMetricsWithRealActivityPrecise) {
            clearInterval(patchInterval);
            isFilterPatchInitialized = true;
            console.log('🎉 [ПАТЧ] Все калькуляторы успешно пропатчены');
        }
    }, 100);
    
    // Останавливаем попытки через 5 секунд
    setTimeout(() => {
        clearInterval(patchInterval);
        isFilterPatchInitialized = true;
        console.log('⏰ [ПАТЧ] Время ожидания истекло, патч завершен');
    }, 5000);
}

// Запускаем патч когда DOM готов
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeFilterPatch);
} else {
    initializeFilterPatch();
}

// Также запускаем патч если window.lastLoadedData изменяется (значит данные загружены)
let lastDataWatcher = null;
Object.defineProperty(window, 'lastLoadedData', {
    get() {
        return lastDataWatcher;
    },
    set(value) {
        lastDataWatcher = value;
        // При изменении данных перепроверяем патч
        if (!isFilterPatchInitialized) {
            setTimeout(initializeFilterPatch, 100);
        }
    }
});

console.log('🚀 [ПАТЧ] Модуль патча фильтрации загружен и готов к работе'); 