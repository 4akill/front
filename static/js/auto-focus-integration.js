/**
 * АВТОМАТИЧЕСКАЯ ИНТЕГРАЦИЯ АНАЛИЗА ФОКУСА
 * Автор: AI Assistant
 * Дата: 2025-01-24
 * Версия: v1.0
 * Назначение: Автоматически вызывает существующую функцию analyzeFocus() на главной странице
 */

console.log('🔗 [AUTO-FOCUS] Загружается автоматическая интеграция анализа фокуса');

/**
 * Автоматически запускает анализ фокуса при загрузке страницы
 */
function autoStartFocusAnalysis() {
    console.log('🔗 [AUTO-FOCUS] Автоматический запуск анализа фокуса');
    
    // Получаем текущую дату
    const today = new Date().toISOString().split('T')[0];
    
    // Устанавливаем дату в фильтр если не установлена
    const dateFilter = document.querySelector('#date-filter');
    if (dateFilter && !dateFilter.value) {
        dateFilter.value = today;
        console.log(`📅 [AUTO-FOCUS] Установлена дата: ${today}`);
    }
    
    // Ждем загрузки функции analyzeFocus и запускаем
    waitForAnalyzeFocus(() => {
        console.log(`🧠 [AUTO-FOCUS] Запуск analyzeFocus для: ${today}`);
        
        // Диагностика перед вызовом
        console.log('🔍 [AUTO-FOCUS] Диагностика перед вызовом analyzeFocus:');
        console.log('   - typeof analyzeFocus:', typeof analyzeFocus);
        console.log('   - window.analyzeFocus:', typeof window.analyzeFocus);
        console.log('   - Дата для анализа:', today);
        
        try {
            // Пытаемся вызвать функцию
            const result = analyzeFocus(today);
            console.log('✅ [AUTO-FOCUS] analyzeFocus вызвана, результат:', result);
            
            // Если функция асинхронная
            if (result && typeof result.then === 'function') {
                result.then(() => {
                    console.log('✅ [AUTO-FOCUS] analyzeFocus завершена успешно');
                }).catch(error => {
                    console.error('❌ [AUTO-FOCUS] Ошибка в analyzeFocus:', error);
                });
            }
        } catch (error) {
            console.error('❌ [AUTO-FOCUS] Ошибка при вызове analyzeFocus:', error);
        }
    });
}

/**
 * Ждет загрузки функции analyzeFocus
 */
function waitForAnalyzeFocus(callback) {
    let attempts = 0;
    const maxAttempts = 30;
    
    const checkInterval = setInterval(() => {
        attempts++;
        console.log(`⏳ [AUTO-FOCUS] Попытка ${attempts}/${maxAttempts}: ищем analyzeFocus...`);
        
        // Проверяем разные способы доступа к функции
        const methods = [
            { name: 'window.analyzeFocus', func: window.analyzeFocus },
            { name: 'global analyzeFocus', func: (typeof analyzeFocus !== 'undefined') ? analyzeFocus : undefined }
        ];
        
        for (const method of methods) {
            if (typeof method.func === 'function') {
                console.log(`✅ [AUTO-FOCUS] Функция найдена через: ${method.name}`);
                clearInterval(checkInterval);
                
                // Используем найденную функцию
                window.analyzeFocus = method.func;
                callback();
                return;
            }
        }
        
        if (attempts >= maxAttempts) {
            clearInterval(checkInterval);
            console.error('❌ [AUTO-FOCUS] analyzeFocus не найдена за 30 попыток');
            
            // Показываем что доступно в window
            console.log('🔍 [AUTO-FOCUS] Доступные функции в window:');
            const focusFunctions = Object.keys(window).filter(key => 
                key.toLowerCase().includes('focus') || key.toLowerCase().includes('analyz')
            );
            console.log('   Функции с "focus" или "analyz":', focusFunctions);
        }
    }, 1000);
}

/**
 * Обработчик изменения даты
 */
function onDateChange(event) {
    const selectedDate = event.target.value;
    if (!selectedDate) return;
    
    console.log(`📅 [AUTO-FOCUS] Дата изменена на: ${selectedDate}`);
    
    // Проверяем доступность функции
    const focusFunc = window.analyzeFocus || (typeof analyzeFocus !== 'undefined' ? analyzeFocus : null);
    
    if (typeof focusFunc === 'function') {
        console.log(`🧠 [AUTO-FOCUS] Запуск analyzeFocus для: ${selectedDate}`);
        try {
            const result = focusFunc(selectedDate);
            console.log('✅ [AUTO-FOCUS] analyzeFocus выполнена при изменении даты');
            
            if (result && typeof result.then === 'function') {
                result.catch(error => {
                    console.error('❌ [AUTO-FOCUS] Ошибка при изменении даты:', error);
                });
            }
        } catch (error) {
            console.error('❌ [AUTO-FOCUS] Ошибка при вызове analyzeFocus:', error);
        }
    } else {
        console.error('❌ [AUTO-FOCUS] analyzeFocus недоступна при изменении даты');
    }
}

/**
 * Обработчик изменения периода
 */
function onPeriodChange() {
    const dateFilter = document.querySelector('#date-filter');
    const selectedDate = dateFilter ? dateFilter.value : null;
    
    if (!selectedDate) return;
    
    console.log(`📊 [AUTO-FOCUS] Период изменен, повторяем анализ для: ${selectedDate}`);
    
    // Проверяем доступность функции
    const focusFunc = window.analyzeFocus || (typeof analyzeFocus !== 'undefined' ? analyzeFocus : null);
    
    if (typeof focusFunc === 'function') {
        try {
            const result = focusFunc(selectedDate);
            console.log('✅ [AUTO-FOCUS] analyzeFocus выполнена при изменении периода');
            
            if (result && typeof result.then === 'function') {
                result.catch(error => {
                    console.error('❌ [AUTO-FOCUS] Ошибка при изменении периода:', error);
                });
            }
        } catch (error) {
            console.error('❌ [AUTO-FOCUS] Ошибка при вызове analyzeFocus:', error);
        }
    } else {
        console.error('❌ [AUTO-FOCUS] analyzeFocus недоступна при изменении периода');
    }
}

/**
 * Устанавливает обработчики событий
 */
function setupAutoFocusListeners() {
    // Обработчик изменения даты
    const dateFilter = document.querySelector('#date-filter');
    if (dateFilter) {
        dateFilter.addEventListener('change', onDateChange);
        console.log('✅ [AUTO-FOCUS] Обработчик даты установлен');
    }
    
    // Обработчик изменения периода
    const periodFilter = document.querySelector('#period-filter');
    if (periodFilter) {
        periodFilter.addEventListener('change', onPeriodChange);
        console.log('✅ [AUTO-FOCUS] Обработчик периода установлен');
    }
}

/**
 * Инициализация автоматического анализа фокуса
 */
function initAutoFocusIntegration() {
    console.log('🔗 [AUTO-FOCUS] Инициализация автоматического анализа фокуса');
    
    // Устанавливаем обработчики событий
    setupAutoFocusListeners();
    
    // Запускаем автоматический анализ при загрузке
    setTimeout(autoStartFocusAnalysis, 2000);
    
    // Дополнительная попытка через 5 секунд
    setTimeout(forceAnalyzeFocus, 5000);
    
    console.log('✅ [AUTO-FOCUS] Автоматическая интеграция инициализирована');
}

/**
 * Принудительный поиск и запуск анализа фокуса
 */
function forceAnalyzeFocus() {
    console.log('🔍 [AUTO-FOCUS] Принудительный поиск функции анализа фокуса');
    
    // Получаем дату
    const dateFilter = document.querySelector('#date-filter');
    const selectedDate = dateFilter?.value || new Date().toISOString().split('T')[0];
    
    console.log(`📅 [AUTO-FOCUS] Дата для принудительного анализа: ${selectedDate}`);
    
    // Список возможных имен функций
    const possibleNames = [
        'analyzeFocus',
        'window.analyzeFocus', 
        'analyzeWindowFocus',
        'runFocusAnalysis',
        'performFocusAnalysis',
        'focusAnalyzer',
        'startFocusAnalysis'
    ];
    
    let foundFunction = null;
    
    // Ищем функцию
    for (const name of possibleNames) {
        try {
            let func = null;
            
            if (name.includes('window.')) {
                const propName = name.replace('window.', '');
                func = window[propName];
            } else {
                func = eval(`typeof ${name} !== 'undefined' ? ${name} : null`);
            }
            
            if (typeof func === 'function') {
                console.log(`✅ [AUTO-FOCUS] Найдена функция: ${name}`);
                foundFunction = { name, func };
                break;
            }
        } catch (e) {
            // Игнорируем ошибки поиска
        }
    }
    
    if (foundFunction) {
        console.log(`🧠 [AUTO-FOCUS] Принудительный запуск: ${foundFunction.name}(${selectedDate})`);
        
        try {
            const result = foundFunction.func(selectedDate);
            console.log('✅ [AUTO-FOCUS] Принудительный анализ выполнен:', result);
            
            // Сохраняем функцию для дальнейшего использования
            window.analyzeFocus = foundFunction.func;
            
            if (result && typeof result.then === 'function') {
                result.then(() => {
                    console.log('✅ [AUTO-FOCUS] Принудительный анализ завершен успешно');
                    
                    // Автоматически пытаемся обновить метрики после анализа
                    setTimeout(() => {
                        console.log('🔄 [AUTO-FOCUS] Автоматическое обновление метрик после анализа');
                        forceUpdateDashboardMetrics();
                    }, 1000);
                }).catch(error => {
                    console.error('❌ [AUTO-FOCUS] Ошибка в принудительном анализе:', error);
                });
            } else {
                // Если функция не асинхронная, пытаемся обновить метрики сразу
                setTimeout(() => {
                    console.log('🔄 [AUTO-FOCUS] Автоматическое обновление метрик (синхронный режим)');
                    forceUpdateDashboardMetrics();
                }, 1000);
            }
        } catch (error) {
            console.error('❌ [AUTO-FOCUS] Ошибка при принудительном вызове:', error);
        }
    } else {
        console.error('❌ [AUTO-FOCUS] Функция анализа фокуса не найдена ни под одним именем');
        
        // Показываем все доступные функции для отладки
        console.log('🔍 [AUTO-FOCUS] Все доступные функции в window:');
        const allFunctions = Object.keys(window).filter(key => typeof window[key] === 'function');
        const focusRelated = allFunctions.filter(key => 
            key.toLowerCase().includes('focus') || 
            key.toLowerCase().includes('analyz') ||
            key.toLowerCase().includes('window') ||
            key.toLowerCase().includes('activity')
        );
        console.log('   Функции связанные с фокусом/анализом:', focusRelated);
    }
}

/**
 * Экспортируем функции для отладки
 */
window.forceAnalyzeFocus = forceAnalyzeFocus;
window.autoStartFocusAnalysis = autoStartFocusAnalysis;

/**
 * Принудительно обновляет метрики дашборда после анализа фокуса
 */
function forceUpdateDashboardMetrics() {
    console.log('🔄 [AUTO-FOCUS] Принудительное обновление метрик дашборда');
    
    // Проверяем есть ли сохраненные данные от анализатора фокуса
    if (window.lastAnalyzedRawData) {
        console.log('📊 [AUTO-FOCUS] Найдены данные анализатора фокуса:', {
            windowActivities: window.lastAnalyzedRawData.windowActivities?.length || 0,
            mouseActivities: window.lastAnalyzedRawData.mouseActivities?.length || 0
        });
        
        // Пытаемся обновить метрики через интеграцию
        if (typeof updateDashboardMetricsFromFocusAnalyzer === 'function') {
            console.log('🔗 [AUTO-FOCUS] Используем интеграцию анализатора фокуса');
            updateDashboardMetricsFromFocusAnalyzer(window.lastAnalyzedRawData);
            return true;
        }
    }
    
    // Fallback: используем данные из window.lastLoadedData
    if (window.lastLoadedData?.activities?.length > 0) {
        console.log('📊 [AUTO-FOCUS] Используем lastLoadedData как fallback:', {
            activities: window.lastLoadedData.activities.length,
            mouse: window.lastLoadedData.mouse?.length || 0
        });
        
        // Список функций для попытки обновления
        const updateFunctions = [
            { name: 'updateMainMetricsWithRealActivityPrecise', func: window.updateMainMetricsWithRealActivityPrecise },
            { name: 'updateMainMetricsWithRealActivity', func: window.updateMainMetricsWithRealActivity },
            { name: 'updateSmartCalculatorWithFilters', func: window.updateSmartCalculatorWithFilters }
        ];
        
        for (const updateFunc of updateFunctions) {
            if (typeof updateFunc.func === 'function') {
                try {
                    console.log(`🧠 [AUTO-FOCUS] Пытаемся обновить через ${updateFunc.name}`);
                    
                    if (updateFunc.name === 'updateSmartCalculatorWithFilters') {
                        updateFunc.func(window.lastLoadedData.activities, window.lastLoadedData.mouse || []);
                    } else {
                        updateFunc.func(window.lastLoadedData.activities, window.lastLoadedData.mouse || []);
                    }
                    
                    console.log(`✅ [AUTO-FOCUS] Метрики обновлены через ${updateFunc.name}`);
                    return true;
                } catch (error) {
                    console.error(`❌ [AUTO-FOCUS] Ошибка в ${updateFunc.name}:`, error);
                    continue;
                }
            }
        }
    }
    
    console.error('❌ [AUTO-FOCUS] Не удалось обновить метрики - нет доступных данных или функций');
    return false;
}

/**
 * Экспортируем функцию принудительного обновления
 */
window.forceUpdateDashboardMetrics = forceUpdateDashboardMetrics;

/**
 * Простая команда для принудительного запуска анализа фокуса
 */
window.runFocusAnalysisNow = function() {
    console.log('🚀 [КОМАНДА] Принудительный запуск анализа фокуса из консоли');
    
    const today = new Date().toISOString().split('T')[0];
    console.log(`📅 Дата для анализа: ${today}`);
    
    if (typeof analyzeFocus === 'function') {
        console.log('✅ analyzeFocus найдена, запускаем...');
        const result = analyzeFocus(today);
        
        if (result && typeof result.then === 'function') {
            result.then(() => {
                console.log('✅ Анализ фокуса завершен, пытаемся обновить метрики...');
                setTimeout(() => {
                    forceUpdateDashboardMetrics();
                }, 2000);
            });
        } else {
            setTimeout(() => {
                forceUpdateDashboardMetrics();
            }, 2000);
        }
        
        return result;
    } else {
        console.error('❌ analyzeFocus не найдена');
        return false;
    }
};

/**
 * Команда для проверки доступности всех функций
 */
window.checkAvailableFunctions = function() {
    console.log('🔍 [ДИАГНОСТИКА] Проверка доступности функций:');
    
    const functions = [
        'analyzeFocus',
        'updateMainMetricsWithRealActivity',
        'updateMainMetricsWithRealActivityPrecise',
        'updateSmartCalculatorWithFilters',
        'updateMetrics',
        'updateDashboardMetricsFromFocusAnalyzer'
    ];
    
    functions.forEach(funcName => {
        const func = window[funcName];
        console.log(`   ${funcName}: ${typeof func} ${typeof func === 'function' ? '✅' : '❌'}`);
    });
    
    return functions.reduce((acc, funcName) => {
        acc[funcName] = typeof window[funcName];
        return acc;
    }, {});
};

/**
 * Принудительное обновление метрик через fallback
 */
window.forceUpdateMetricsNow = function() {
    console.log('🔄 [КОМАНДА] Принудительное обновление метрик через fallback');
    
    // Получаем данные из анализатора фокуса
    if (!window.lastAnalyzedRawData) {
        console.error('❌ Нет данных от анализатора фокуса (window.lastAnalyzedRawData)');
        return false;
    }
    
    const data = window.lastAnalyzedRawData;
    console.log('📊 Используем данные анализатора фокуса:', {
        windowActivities: data.windowActivities?.length || 0,
        mouseActivities: data.mouseActivities?.length || 0,
        browserActivities: data.browserActivities?.length || 0,
        websiteVisits: data.websiteVisits?.length || 0
    });
    
    // Проверяем доступность updateMetrics
    if (typeof updateMetrics !== 'function') {
        console.error('❌ Функция updateMetrics недоступна');
        return false;
    }
    
    // Создаем данные в формате ожидаемом updateMetrics
    const fallbackData = {
        activities: data.windowActivities || [],
        mouse_activity: data.mouseActivities || [],
        browser_activity: data.browserActivities || [],
        website_visits: data.websiteVisits || [],
        period_info: {
            start_date: data.selectedDate,
            end_date: data.selectedDate
        }
    };
    
    console.log('🔄 Вызываем updateMetrics с fallback данными...');
    try {
        updateMetrics(fallbackData);
        console.log('✅ Метрики обновлены через fallback updateMetrics');
        return true;
    } catch (error) {
        console.error('❌ Ошибка при вызове updateMetrics:', error);
        return false;
    }
};

/**
 * Ждем загрузки умного калькулятора и принудительно обновляем метрики
 */
window.waitForCalculatorAndUpdate = function() {
    console.log('⏳ [КОМАНДА] Ждем загрузки умного калькулятора...');
    
    let attempts = 0;
    const maxAttempts = 20;
    
    const checkInterval = setInterval(() => {
        attempts++;
        console.log(`⏳ Попытка ${attempts}/${maxAttempts}: проверяем умный калькулятор...`);
        
        // Проверяем доступность основной функции
        if (typeof window.updateMainMetricsWithRealActivity === 'function') {
            console.log('✅ Умный калькулятор найден! Обновляем метрики...');
            clearInterval(checkInterval);
            
            // Получаем данные
            if (!window.lastAnalyzedRawData) {
                console.error('❌ Нет данных от анализатора фокуса');
                return false;
            }
            
            const data = window.lastAnalyzedRawData;
            console.log('📊 Передаем данные в умный калькулятор:', {
                windowActivities: data.windowActivities?.length || 0,
                mouseActivities: data.mouseActivities?.length || 0
            });
            
            try {
                // Вызываем умный калькулятор напрямую
                window.updateMainMetricsWithRealActivity(
                    data.windowActivities || [], 
                    data.mouseActivities || [], 
                    data.selectedDate
                );
                console.log('✅ Умный калькулятор вызван успешно!');
                return true;
            } catch (error) {
                console.error('❌ Ошибка при вызове умного калькулятора:', error);
                return false;
            }
        }
        
        if (attempts >= maxAttempts) {
            clearInterval(checkInterval);
            console.error('❌ Умный калькулятор не загрузился за 20 попыток');
            console.log('🔄 Используем fallback...');
            return forceUpdateMetricsNow();
        }
    }, 1000);
    
    return true;
};

// Автоматическая инициализация при загрузке DOM
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(initAutoFocusIntegration, 1000);
});

console.log('✅ [AUTO-FOCUS] Автоматическая интеграция анализа фокуса загружена'); 