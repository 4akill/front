/**
 * МОДУЛЬ ЗАЩИТЫ МЕТРИК ОТ ПЕРЕЗАПИСИ
 * Автор: AI Assistant
 * Дата: 2025-01-24
 * Версия: v1.4
 * Назначение: Предотвращает перезапись правильных метрик от умного калькулятора
 */

(function() {
    'use strict';
    
    console.log('🛡️ [ЗАЩИТА МЕТРИК] Модуль защиты метрик от перезаписи загружается...');
    
    // Флаг для отслеживания, были ли установлены метрики умным калькулятором
    let smartCalculatorMetricsSet = false;
    let lastSmartCalculatorMetrics = null;
    let domObserver = null;
    
    // Сохраняем оригинальные функции для перехвата
    let originalUpdateMetricsFromTableData = null;
    let originalUpdateMetrics = null;
    
    /**
     * Проверяет, содержат ли данные метрики от умного калькулятора
     */
    function isSmartCalculatorData(data) {
        if (!data) return false;
        
        // Проверка на наличие real_activity_stats - основной признак умного калькулятора
        if (data.real_activity_stats) {
            console.log('🛡️ [ЗАЩИТА] Обнаружены real_activity_stats - данные от умного калькулятора');
            return true;
        }
        
        // Проверка на специфические поля умного калькулятора
        if (data.real_activity_percent || data.productivity_score || data.activity_ratio) {
            console.log('🛡️ [ЗАЩИТА] Обнаружены специфические поля умного калькулятора');
            return true;
        }
        
        // Проверка на наличие специфических полей от умного калькулятора в активностях
        if (data.activities && data.activities.length > 0) {
            const firstActivity = data.activities[0];
            if (firstActivity && (firstActivity.hasOwnProperty('real_activity_type') || 
                                 firstActivity.hasOwnProperty('is_real_activity') ||
                                 firstActivity.hasOwnProperty('activity_type'))) {
                console.log('🛡️ [ЗАЩИТА] Обнаружены специфические поля в активностях');
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * Инициализирует перехват функций с задержкой
     */
    function initializeInterception() {
        // Перехватываем updateMetrics
        if (typeof window.updateMetrics === 'function') {
            if (!originalUpdateMetrics) {
                originalUpdateMetrics = window.updateMetrics;
                console.log('✅ [ЗАЩИТА] updateMetrics найдена и готова к перехвату');
            }
        }
        
        // Перехватываем updateMetricsFromTableData
        if (typeof window.updateMetricsFromTableData === 'function') {
            if (!originalUpdateMetricsFromTableData) {
                originalUpdateMetricsFromTableData = window.updateMetricsFromTableData;
                console.log('✅ [ЗАЩИТА] updateMetricsFromTableData найдена и готова к перехвату');
            }
        }
        
        // Устанавливаем перехватчики
        setupInterceptors();
    }
    
    /**
     * Устанавливает перехватчики функций
     */
    function setupInterceptors() {
        // Защищенная версия updateMetrics
        window.updateMetrics = function(data) {
            console.log('🛡️ [ЗАЩИТА] Перехват updateMetrics:', data);
            
            // Проверяем, являются ли данные от умного калькулятора
            if (isSmartCalculatorData(data)) {
                console.log('🧠 [ЗАЩИТА] ОБНАРУЖЕНЫ ДАННЫЕ ОТ УМНОГО КАЛЬКУЛЯТОРА - сохраняем их');
                smartCalculatorMetricsSet = true;
                
                // Извлекаем метрики из данных умного калькулятора
                let metrics = {};
                
                if (data.real_activity_stats) {
                    const stats = data.real_activity_stats;
                    metrics = {
                        totalTime: stats.total_time,
                        activeTime: stats.active_time,
                        passiveTime: stats.passive_time || stats.background_time,
                        productiveTime: stats.productive_time,
                        activityRatio: stats.activity_ratio,
                        productivityScore: stats.productivity_score,
                        timestamp: Date.now()
                    };
                } else {
                    // Fallback для других форматов данных от умного калькулятора
                    metrics = {
                        totalTime: data.total_time || 0,
                        activeTime: data.active_time || 0,
                        passiveTime: data.passive_time || data.background_time || 0,
                        productiveTime: data.productive_time || 0,
                        activityRatio: data.activity_ratio || 0,
                        productivityScore: data.productivity_score || data.real_activity_percent || 0,
                        timestamp: Date.now()
                    };
                }
                
                lastSmartCalculatorMetrics = metrics;
                console.log('🛡️ [ЗАЩИТА] Сохранены метрики умного калькулятора:', lastSmartCalculatorMetrics);
                
                // Создаем DOM наблюдатель для дополнительной защиты
                setTimeout(() => createDOMObserver(), 1000);
                
                // Устанавливаем таймер для сброса защиты через 15 секунд
                setTimeout(() => {
                    console.log('🛡️ [ЗАЩИТА] Автоматический сброс защиты через 15 секунд');
                    smartCalculatorMetricsSet = false;
                    if (domObserver) {
                        domObserver.disconnect();
                        domObserver = null;
                    }
                }, 15000);
            }
            
            // Вызываем оригинальную функцию
            if (originalUpdateMetrics) {
                return originalUpdateMetrics.call(this, data);
            }
        };
        
        // Защищенная версия updateMetricsFromTableData
        window.updateMetricsFromTableData = function() {
            console.log('🛡️ [ЗАЩИТА] Перехват updateMetricsFromTableData');
            
            // Если метрики от умного калькулятора установлены недавно (в течение 15 секунд)
            if (smartCalculatorMetricsSet && lastSmartCalculatorMetrics) {
                const timeSinceSmartCalculator = Date.now() - lastSmartCalculatorMetrics.timestamp;
                
                if (timeSinceSmartCalculator < 15000) { // 15 секунд
                    console.log('🛡️ [ЗАЩИТА] БЛОКИРОВКА: Метрики от умного калькулятора установлены недавно, блокируем перезапись');
                    console.log(`   ⏰ Время с установки: ${timeSinceSmartCalculator}мс`);
                    
                    // Восстанавливаем метрики умного калькулятора
                    restoreSmartCalculatorMetrics();
                    return;
                } else {
                    console.log('🛡️ [ЗАЩИТА] Метрики умного калькулятора устарели, разрешаем обновление');
                    smartCalculatorMetricsSet = false;
                    if (domObserver) {
                        domObserver.disconnect();
                        domObserver = null;
                    }
                }
            }
            
            console.log('🛡️ [ЗАЩИТА] Разрешаем updateMetricsFromTableData (метрики умного калькулятора устарели или отсутствуют)');
            
            // Если прошло достаточно времени или нет метрик от умного калькулятора, разрешаем обновление
            if (originalUpdateMetricsFromTableData) {
                return originalUpdateMetricsFromTableData.call(this);
            }
        };
        
        console.log('🛡️ [ЗАЩИТА] Перехватчики функций установлены');
    }
    
    /**
     * Создает наблюдатель за изменениями в DOM элементах метрик
     */
    function createDOMObserver() {
        if (!lastSmartCalculatorMetrics) return;
        
        const targetElements = [
            'total-working-time',
            'productive-time', 
            'activity-score',
            'break-time'
        ];
        
        // Останавливаем предыдущий наблюдатель
        if (domObserver) {
            domObserver.disconnect();
        }
        
        domObserver = new MutationObserver((mutations) => {
            if (!smartCalculatorMetricsSet || !lastSmartCalculatorMetrics) return;
            
            const timeSinceSmartCalculator = Date.now() - lastSmartCalculatorMetrics.timestamp;
            if (timeSinceSmartCalculator >= 15000) return; // Защита истекла
            
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList' || mutation.type === 'characterData') {
                    const element = mutation.target;
                    const elementId = element.id || element.parentElement?.id;
                    
                    if (targetElements.includes(elementId)) {
                        console.log('🛡️ [DOM ЗАЩИТА] Обнаружено изменение в элементе метрики:', elementId);
                        
                        // Восстанавливаем правильные значения через небольшую задержку
                        setTimeout(() => {
                            if (smartCalculatorMetricsSet && lastSmartCalculatorMetrics) {
                                console.log('🛡️ [DOM ЗАЩИТА] Восстанавливаем метрики после несанкционированного изменения');
                                restoreSmartCalculatorMetrics();
                            }
                        }, 100);
                    }
                }
            });
        });
        
        // Наблюдаем за изменениями в элементах метрик
        targetElements.forEach(elementId => {
            const element = document.getElementById(elementId);
            if (element) {
                domObserver.observe(element, {
                    childList: true,
                    characterData: true,
                    subtree: true
                });
            }
        });
        
        console.log('🛡️ [DOM ЗАЩИТА] DOM наблюдатель активирован для защиты метрик');
    }
    
    /**
     * Восстанавливает метрики умного калькулятора
     */
    function restoreSmartCalculatorMetrics() {
        if (!lastSmartCalculatorMetrics) {
            console.warn('🛡️ [ЗАЩИТА] Нет сохраненных метрик умного калькулятора для восстановления');
            return;
        }
        
        console.log('🛡️ [ЗАЩИТА] Восстанавливаем метрики умного калькулятора');
        
        const metrics = lastSmartCalculatorMetrics;
        
        // Временно отключаем наблюдатель для избежания рекурсии
        if (domObserver) {
            domObserver.disconnect();
        }
        
        // Обновляем элементы интерфейса напрямую
        updateMetricElementSafely('total-working-time', metrics.totalTime, 'Общее время активности от начала до конца');
        updateMetricElementSafely('productive-time', metrics.activeTime, `Активное время (${Math.round(metrics.activityRatio * 100)}% от общего)`);
        updateMetricElementSafely('activity-score', `${Math.round(metrics.productivityScore)}%`, 'Средний балл реальной активности', false);
        updateMetricElementSafely('break-time', metrics.passiveTime, 'Время пассивной активности (фон)');
        
        // Восстанавливаем наблюдатель
        setTimeout(() => createDOMObserver(), 500);
        
        console.log('✅ [ЗАЩИТА] Метрики умного калькулятора восстановлены');
    }
    
    /**
     * Безопасно обновляет элемент метрики
     */
    function updateMetricElementSafely(elementId, value, subtitle = null, formatAsTime = true) {
        const element = document.getElementById(elementId);
        if (!element) {
            console.warn(`🛡️ [ЗАЩИТА] Элемент ${elementId} не найден`);
            return false;
        }
        
        try {
            // Форматируем значение
            let displayValue;
            if (formatAsTime && typeof value === 'number') {
                const hours = Math.floor(value / 60);
                const minutes = Math.round(value % 60);
                displayValue = formatTimeNicely(hours, minutes);
            } else {
                displayValue = value.toString();
            }
            
            element.textContent = displayValue;
            
            // Обновляем подзаголовок если передан
            if (subtitle) {
                const subtitleElement = element.parentElement.querySelector('.metric-subtitle');
                if (subtitleElement) {
                    subtitleElement.textContent = subtitle;
                }
            }
            
            return true;
        } catch (error) {
            console.error(`🛡️ [ЗАЩИТА] Ошибка обновления элемента ${elementId}:`, error);
            return false;
        }
    }
    
    /**
     * Диагностическая функция для проверки текущих значений метрик
     */
    window.diagnoseCurrentMetrics = function() {
        console.log('🔍 [ДИАГНОСТИКА] Текущие значения метрик в интерфейсе:');
        
        const elements = [
            'total-working-time',
            'productive-time',
            'activity-score',
            'break-time'
        ];
        
        elements.forEach(elementId => {
            const element = document.getElementById(elementId);
            if (element) {
                console.log(`   ${elementId}: "${element.textContent}"`);
            } else {
                console.log(`   ${elementId}: ЭЛЕМЕНТ НЕ НАЙДЕН`);
            }
        });
        
        console.log('🔍 [ДИАГНОСТИКА] Состояние защиты:', {
            smartCalculatorMetricsSet,
            lastSmartCalculatorMetrics,
            domObserverActive: domObserver !== null
        });
    };
    
    /**
     * Функция для принудительного восстановления метрик (для отладки)
     */
    window.forceRestoreSmartMetrics = function() {
        console.log('🛡️ [ЗАЩИТА] Принудительное восстановление метрик умного калькулятора');
        restoreSmartCalculatorMetrics();
    };
    
    /**
     * Функция для сброса защиты (для отладки)
     */
    window.resetMetricsProtection = function() {
        console.log('🛡️ [ЗАЩИТА] Сброс защиты метрик');
        smartCalculatorMetricsSet = false;
        lastSmartCalculatorMetrics = null;
        if (domObserver) {
            domObserver.disconnect();
            domObserver = null;
        }
    };
    
    /**
     * Функция для проверки состояния защиты (для отладки)
     */
    window.checkMetricsProtection = function() {
        console.log('🛡️ [ЗАЩИТА] Состояние защиты метрик:', {
            smartCalculatorMetricsSet,
            lastSmartCalculatorMetrics,
            domObserverActive: domObserver !== null,
            timeSinceLastUpdate: lastSmartCalculatorMetrics ? (Date.now() - lastSmartCalculatorMetrics.timestamp) : 'N/A'
        });
        return {
            smartCalculatorMetricsSet,
            lastSmartCalculatorMetrics,
            domObserverActive: domObserver !== null,
            timeSinceLastUpdate: lastSmartCalculatorMetrics ? (Date.now() - lastSmartCalculatorMetrics.timestamp) : null
        };
    };
    
    /**
     * Функция для принудительного запуска умного калькулятора (для отладки)
     */
    window.triggerSmartCalculator = function() {
        console.log('🧠 [ОТЛАДКА] Попытка запуска умного калькулятора');
        
        if (typeof window.updateMainMetricsWithRealActivity === 'function') {
            console.log('🧠 [ОТЛАДКА] Найдена функция updateMainMetricsWithRealActivity, запускаем...');
            
            // Получаем данные из localStorage или создаем тестовые
            const testData = [
                {
                    timestamp: new Date().toISOString(),
                    window_title: 'Test Application',
                    process_name: 'test.exe',
                    duration: 60,
                    is_active: true
                }
            ];
            
            window.updateMainMetricsWithRealActivity(testData);
        } else {
            console.log('❌ [ОТЛАДКА] Функция updateMainMetricsWithRealActivity не найдена');
        }
    };
    
    // Инициализация с задержкой для загрузки основных скриптов
    setTimeout(() => {
        console.log('🛡️ [ЗАЩИТА] Инициализация защиты метрик...');
        initializeInterception();
        
        // Проверяем периодически на случай поздней загрузки функций
        const checkInterval = setInterval(() => {
            if (typeof window.updateMetrics === 'function' && !originalUpdateMetrics) {
                console.log('🛡️ [ЗАЩИТА] Обнаружена поздняя загрузка updateMetrics');
                initializeInterception();
            }
            if (typeof window.updateMetricsFromTableData === 'function' && !originalUpdateMetricsFromTableData) {
                console.log('🛡️ [ЗАЩИТА] Обнаружена поздняя загрузка updateMetricsFromTableData');
                initializeInterception();
            }
        }, 1000);
        
        // Останавливаем проверку через 10 секунд
        setTimeout(() => {
            clearInterval(checkInterval);
            console.log('🛡️ [ЗАЩИТА] Завершена проверка поздней загрузки функций');
        }, 10000);
        
    }, 1000);
    
    console.log('🛡️ [ЗАЩИТА] Модуль защиты метрик от перезаписи загружен');
    
})();

// Добавляем функцию форматирования времени если её нет
if (typeof formatTimeNicely !== 'function') {
    window.formatTimeNicely = function(hours, minutes) {
        // Округляем минуты до целого числа
        minutes = Math.round(minutes);

        // Если минуты равны 60, увеличиваем часы
        if (minutes === 60) {
            hours += 1;
            minutes = 0;
        }

        // Если часов нет (0), показываем только минуты
        if (hours === 0) {
            return `${minutes}м`;
        }
        
        // Если есть часы, показываем часы и минуты
        return `${hours}ч ${minutes}м`;
    };
}

console.log('🛡️ [ЗАЩИТА] Защита метрик от перезаписи готова к работе'); 