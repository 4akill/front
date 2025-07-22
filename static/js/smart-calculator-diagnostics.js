/**
 * ДИАГНОСТИЧЕСКИЙ МОДУЛЬ ДЛЯ УМНОГО КАЛЬКУЛЯТОРА
 * Автор: AI Assistant
 * Дата: 2025-01-24
 * Версия: v1.0
 * Назначение: Диагностика работы умного калькулятора времени
 */

(function() {
    'use strict';
    
    console.log('🔍 [ДИАГНОСТИКА] Модуль диагностики умного калькулятора загружается...');
    
    // Перехватываем updateMainMetricsWithRealActivity для диагностики
    let originalUpdateMainMetricsWithRealActivity = null;
    
    /**
     * Инициализирует диагностику умного калькулятора
     */
    function initializeDiagnostics() {
        // Ищем функцию умного калькулятора
        if (typeof window.updateMainMetricsWithRealActivity === 'function') {
            console.log('🔍 [ДИАГНОСТИКА] Найдена функция updateMainMetricsWithRealActivity');
            
            if (!originalUpdateMainMetricsWithRealActivity) {
                originalUpdateMainMetricsWithRealActivity = window.updateMainMetricsWithRealActivity;
                
                // Создаем обертку для диагностики
                window.updateMainMetricsWithRealActivity = function(windowData, mouseData, targetDate) {
                    console.log('🔍 [ДИАГНОСТИКА] Вызов updateMainMetricsWithRealActivity');
                    console.log('   📊 windowData:', windowData);
                    console.log('   🖱️ mouseData:', mouseData);
                    console.log('   📅 targetDate:', targetDate);
                    
                    // Вызываем оригинальную функцию
                    const result = originalUpdateMainMetricsWithRealActivity.call(this, windowData, mouseData, targetDate);
                    
                    console.log('🔍 [ДИАГНОСТИКА] Результат выполнения умного калькулятора:', result);
                    
                    return result;
                };
                
                console.log('✅ [ДИАГНОСТИКА] Обертка для умного калькулятора установлена');
            }
        } else {
            console.log('❌ [ДИАГНОСТИКА] Функция updateMainMetricsWithRealActivity не найдена');
        }
    }
    
    /**
     * Диагностическая функция для проверки состояния умного калькулятора
     */
    window.diagnoseSmartCalculator = function() {
        console.log('🔍 [ДИАГНОСТИКА] Состояние умного калькулятора:');
        
        // Проверяем наличие функций
        console.log('   updateMainMetricsWithRealActivity:', typeof window.updateMainMetricsWithRealActivity);
        console.log('   updateMainMetricsWithRealActivityPrecise:', typeof window.updateMainMetricsWithRealActivityPrecise);
        console.log('   updateMetrics:', typeof window.updateMetrics);
        console.log('   updateMetricsFromTableData:', typeof window.updateMetricsFromTableData);
        
        // Проверяем данные в localStorage
        const windowData = localStorage.getItem('windowActivities');
        const mouseData = localStorage.getItem('mouseActivities');
        
        console.log('   localStorage windowActivities:', windowData ? JSON.parse(windowData).length + ' записей' : 'отсутствует');
        console.log('   localStorage mouseActivities:', mouseData ? JSON.parse(mouseData).length + ' записей' : 'отсутствует');
        
        // Проверяем последние метрики
        console.log('   window.lastSmartMetrics:', window.lastSmartMetrics);
        
        return {
            functions: {
                updateMainMetricsWithRealActivity: typeof window.updateMainMetricsWithRealActivity,
                updateMainMetricsWithRealActivityPrecise: typeof window.updateMainMetricsWithRealActivityPrecise,
                updateMetrics: typeof window.updateMetrics,
                updateMetricsFromTableData: typeof window.updateMetricsFromTableData
            },
            data: {
                windowActivities: windowData ? JSON.parse(windowData).length : 0,
                mouseActivities: mouseData ? JSON.parse(mouseData).length : 0,
                lastSmartMetrics: window.lastSmartMetrics
            }
        };
    };
    
    /**
     * Принудительно запускает умный калькулятор с реальными данными
     */
    window.forceRunSmartCalculator = function() {
        console.log('🔍 [ДИАГНОСТИКА] Принудительный запуск умного калькулятора...');
        
        if (typeof window.updateMainMetricsWithRealActivity !== 'function') {
            console.log('❌ [ДИАГНОСТИКА] Функция updateMainMetricsWithRealActivity не найдена');
            return false;
        }
        
        // Получаем данные из localStorage
        const windowData = localStorage.getItem('windowActivities');
        const mouseData = localStorage.getItem('mouseActivities');
        
        if (!windowData) {
            console.log('❌ [ДИАГНОСТИКА] Нет данных windowActivities в localStorage');
            return false;
        }
        
        try {
            const parsedWindowData = JSON.parse(windowData);
            const parsedMouseData = mouseData ? JSON.parse(mouseData) : null;
            
            console.log('🔍 [ДИАГНОСТИКА] Запускаем умный калькулятор с данными:');
            console.log('   windowData:', parsedWindowData.length, 'записей');
            console.log('   mouseData:', parsedMouseData ? parsedMouseData.length + ' записей' : 'отсутствует');
            
            // Запускаем умный калькулятор
            window.updateMainMetricsWithRealActivity(parsedWindowData, parsedMouseData);
            
            console.log('✅ [ДИАГНОСТИКА] Умный калькулятор запущен');
            return true;
            
        } catch (error) {
            console.error('❌ [ДИАГНОСТИКА] Ошибка при запуске умного калькулятора:', error);
            return false;
        }
    };
    
    /**
     * Проверяет, вызывается ли умный калькулятор автоматически
     */
    window.checkSmartCalculatorCalls = function() {
        console.log('🔍 [ДИАГНОСТИКА] Проверка автоматических вызовов умного калькулятора...');
        
        // Перехватываем функции, которые могут вызывать умный калькулятор
        const functionsToCheck = [
            'loadDashboard',
            'loadTimesheet',
            'updateTimesheet',
            'refreshData',
            'updateMetricsFromTableData'
        ];
        
        functionsToCheck.forEach(funcName => {
            if (typeof window[funcName] === 'function') {
                const originalFunc = window[funcName];
                window[funcName] = function(...args) {
                    console.log(`🔍 [ДИАГНОСТИКА] Вызов ${funcName}:`, args);
                    
                    const result = originalFunc.apply(this, args);
                    
                    // Проверяем, вызывается ли умный калькулятор после этой функции
                    setTimeout(() => {
                        console.log(`🔍 [ДИАГНОСТИКА] Проверка после ${funcName}: lastSmartMetrics =`, window.lastSmartMetrics);
                    }, 1000);
                    
                    return result;
                };
                console.log(`✅ [ДИАГНОСТИКА] Обертка для ${funcName} установлена`);
            }
        });
    };
    
    /**
     * Показывает текущие метрики в консоли
     */
    window.showCurrentMetrics = function() {
        console.log('🔍 [ДИАГНОСТИКА] Текущие метрики:');
        
        const elements = [
            'total-working-time',
            'productive-time',
            'activity-score',
            'break-time'
        ];
        
        const metrics = {};
        elements.forEach(elementId => {
            const element = document.getElementById(elementId);
            if (element) {
                metrics[elementId] = element.textContent;
                console.log(`   ${elementId}: "${element.textContent}"`);
            }
        });
        
        return metrics;
    };
    
    // Инициализация с задержкой
    setTimeout(() => {
        console.log('🔍 [ДИАГНОСТИКА] Инициализация диагностики умного калькулятора...');
        initializeDiagnostics();
        
        // Проверяем периодически на случай поздней загрузки
        const checkInterval = setInterval(() => {
            if (typeof window.updateMainMetricsWithRealActivity === 'function' && !originalUpdateMainMetricsWithRealActivity) {
                console.log('🔍 [ДИАГНОСТИКА] Обнаружена поздняя загрузка updateMainMetricsWithRealActivity');
                initializeDiagnostics();
            }
        }, 1000);
        
        // Останавливаем проверку через 10 секунд
        setTimeout(() => {
            clearInterval(checkInterval);
            console.log('🔍 [ДИАГНОСТИКА] Завершена проверка поздней загрузки функций');
        }, 10000);
        
    }, 1000);
    
    console.log('🔍 [ДИАГНОСТИКА] Модуль диагностики умного калькулятора загружен');
    
})();

console.log('🔍 [ДИАГНОСТИКА] Диагностический модуль готов к работе'); 