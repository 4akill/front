/**
 * 🔧 Модуль исправления фильтрации данных для умного калькулятора времени
 * Автор: AI Assistant
 * Дата: 2024
 * Версия: v0.1
 * Назначение: Исправляет проблему передачи неотфильтрованных данных в калькулятор
 */

/**
 * Получает текущие фильтры из интерфейса
 * @returns {Object} - Объект с фильтрами
 */
function getCurrentActiveFilters() {
    const employeeFilter = document.getElementById('employee-filter');
    const deviceFilter = document.getElementById('device-filter');
    const dateFilter = document.getElementById('date-filter');
    const periodFilter = document.getElementById('period-filter');
    
    return {
        employeeId: employeeFilter?.value || '',
        deviceId: deviceFilter?.value || '',
        selectedDate: dateFilter?.value || '',
        selectedPeriod: periodFilter?.value || 'day'
    };
}

/**
 * Фильтрует данные активности по выбранным критериям
 * @param {Array} windowData - Исходные данные активности окон
 * @param {Array} mouseData - Данные активности мыши  
 * @param {Object} filters - Объект с фильтрами
 * @returns {Object} - Отфильтрованные данные
 */
function filterDataForSmartCalculator(windowData, mouseData, filters) {
    console.log('🔧 [ФИКС] Применяем фильтры к данным перед передачей в умный калькулятор');
    console.log('📊 [ФИКС] Исходные данные:', {
        windowData: windowData?.length || 0,
        mouseData: mouseData?.length || 0,
        filters: filters
    });

    let filteredWindowData = windowData || [];
    let filteredMouseData = mouseData || [];

    // Фильтрация по сотруднику
    if (filters.employeeId) {
        console.log(`🔍 [ФИКС] Фильтруем по сотруднику: ${filters.employeeId}`);
        
        filteredWindowData = filteredWindowData.filter(item => {
            const matches = item.employee_name === filters.employeeId ||
                           item.employee_id === filters.employeeId ||
                           item.user_name === filters.employeeId ||
                           item.user_id === filters.employeeId;
            return matches;
        });

        filteredMouseData = filteredMouseData.filter(item => {
            const matches = item.employee_name === filters.employeeId ||
                           item.employee_id === filters.employeeId ||
                           item.user_name === filters.employeeId ||
                           item.user_id === filters.employeeId;
            return matches;
        });
    }

    // Фильтрация по устройству
    if (filters.deviceId) {
        console.log(`🔍 [ФИКС] Фильтруем по устройству: ${filters.deviceId}`);
        
        filteredWindowData = filteredWindowData.filter(item => {
            const matches = item.device_id === filters.deviceId ||
                           item.device_name === filters.deviceId ||
                           item.computer_name === filters.deviceId;
            return matches;
        });

        filteredMouseData = filteredMouseData.filter(item => {
            const matches = item.device_id === filters.deviceId ||
                           item.device_name === filters.deviceId ||
                           item.computer_name === filters.deviceId;
            return matches;
        });
    }

    // Фильтрация по дате (если период = день)
    if (filters.selectedDate && filters.selectedPeriod === 'day') {
        console.log(`🔍 [ФИКС] Фильтруем по дате: ${filters.selectedDate}`);
        
        filteredWindowData = filteredWindowData.filter(item => {
            if (!item.timestamp) return false;
            const itemDate = new Date(item.timestamp).toISOString().split('T')[0];
            return itemDate === filters.selectedDate;
        });

        filteredMouseData = filteredMouseData.filter(item => {
            if (!item.timestamp) return false;
            const itemDate = new Date(item.timestamp).toISOString().split('T')[0];
            return itemDate === filters.selectedDate;
        });
    }

    console.log('✅ [ФИКС] Данные отфильтрованы:', {
        windowData: filteredWindowData.length,
        mouseData: filteredMouseData.length,
        reduction: {
            window: `${windowData.length} → ${filteredWindowData.length}`,
            mouse: `${mouseData.length} → ${filteredMouseData.length}`
        }
    });

    return {
        filteredWindowData,
        filteredMouseData
    };
}

/**
 * Обёртка для умного калькулятора с правильной фильтрацией
 * @param {Array} windowData - Исходные данные активности окон
 * @param {Array} mouseData - Данные активности мыши
 */
function updateSmartCalculatorWithFilters(windowData, mouseData) {
    console.log('🧠 [ФИКС] Запуск умного калькулятора с применением фильтров');
    
    // Получаем текущие фильтры
    const filters = getCurrentActiveFilters();
    
    // Фильтруем данные
    const { filteredWindowData, filteredMouseData } = filterDataForSmartCalculator(windowData, mouseData, filters);
    
    // Сохраняем отфильтрованные данные в глобальные переменные для калькулятора
    window.lastLoadedData = {
        activities: filteredWindowData,
        mouse: filteredMouseData,
        browser_activity: [],
        website_visits: [],
        keyboard_activity: [],
        monitoring: [],
        screenshots: []
    };
    
    // Проверяем есть ли данные после фильтрации
    const totalActivityRecords = filteredWindowData.length + filteredMouseData.length;
    console.log(`📊 [ФИКС] Записей активности после фильтрации: ${totalActivityRecords}`);
    
    if (totalActivityRecords === 0) {
        console.log('⚠️ [ФИКС] Нет данных после фильтрации - показываем нулевые метрики');
        // Обновляем интерфейс с нулевыми значениями
        if (typeof updateMetrics === 'function') {
            updateMetrics({
                real_activity_stats: {
                    total_time: 0,
                    active_time: 0,
                    passive_time: 0,
                    productive_time: 0,
                    activity_ratio: 0,
                    productivity_score: 0
                }
            });
        }
        return;
    }
    
    // Вызываем умный калькулятор с отфильтрованными данными
    try {
        if (typeof updateMainMetricsWithRealActivityPrecise === 'function') {
            console.log('🎯 [ФИКС] Используем точный калькулятор с отфильтрованными данными');
            updateMainMetricsWithRealActivityPrecise(filteredWindowData);
        } else if (typeof updateMainMetricsWithRealActivity === 'function') {
            console.log('🎯 [ФИКС] Используем умный калькулятор с отфильтрованными данными');
            updateMainMetricsWithRealActivity(filteredWindowData);
        } else {
            console.warn('⚠️ [ФИКС] Калькуляторы не найдены - используем стандартный метод');
            if (typeof updateMetrics === 'function') {
                updateMetrics({
                    activities: filteredWindowData,
                    mouse_activity: filteredMouseData
                });
            }
        }
    } catch (error) {
        console.error('❌ [ФИКС] Ошибка при вызове калькулятора:', error);
    }
}

// Экспорт функций в глобальную область
window.updateSmartCalculatorWithFilters = updateSmartCalculatorWithFilters;
window.getCurrentActiveFilters = getCurrentActiveFilters;
window.filterDataForSmartCalculator = filterDataForSmartCalculator;

console.log('✅ [ФИКС] Модуль фильтрации данных для умного калькулятора загружен'); 