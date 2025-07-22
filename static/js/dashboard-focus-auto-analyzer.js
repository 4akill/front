/**
 * МОДУЛЬ АВТОМАТИЧЕСКОГО АНАЛИЗА ФОКУСА НА ГЛАВНОЙ СТРАНИЦЕ
 * Автор: AI Assistant
 * Дата: 2025-01-24
 * Версия: v1.0
 * Назначение: Автоматически выполняет анализ фокуса при загрузке страницы и изменении фильтров
 */

console.log('📊 [DASHBOARD-FOCUS] Загружается модуль автоматического анализа фокуса v1.0');

/**
 * Конфигурация модуля
 */
const DASHBOARD_FOCUS_CONFIG = {
    // Селекторы элементов
    DATE_FILTER: '#date-filter',
    PERIOD_FILTER: '#period-filter',
    
    // Селекторы метрик (можно создать новые или использовать существующие)
    FOCUS_TOTAL_TIME: '#focus-total-time',
    FOCUS_PRODUCTIVE_TIME: '#focus-productive-time', 
    FOCUS_SCORE: '#focus-score',
    FOCUS_EFFICIENCY: '#focus-efficiency',
    
    // Альтернативные селекторы (используем существующие элементы)
    ALT_TOTAL_TIME: '#total-working-time',
    ALT_PRODUCTIVE_TIME: '#productive-time',
    ALT_SCORE: '#activity-score',
    ALT_EFFICIENCY: '#break-time',
    
    // Настройки
    DEBUG: true,
    AUTO_ANALYZE_ON_LOAD: true,
    AUTO_ANALYZE_ON_CHANGE: true
};

/**
 * Состояние модуля
 */
const dashboardFocusState = {
    isInitialized: false,
    isAnalyzing: false,
    lastAnalyzedDate: null,
    lastResults: null
};

/**
 * Главная функция инициализации
 */
function initDashboardFocusAnalyzer() {
    if (dashboardFocusState.isInitialized) {
        console.log('📊 [DASHBOARD-FOCUS] Модуль уже инициализирован');
        return;
    }
    
    console.log('📊 [DASHBOARD-FOCUS] Инициализация автоматического анализа фокуса');
    
    // Проверяем доступность функции analyzeFocus
    if (typeof analyzeFocus !== 'function') {
        console.warn('⚠️ [DASHBOARD-FOCUS] Функция analyzeFocus недоступна, отложенная инициализация');
        setTimeout(initDashboardFocusAnalyzer, 1000);
        return;
    }
    
    // Настраиваем обработчики событий
    setupEventListeners();
    
    // Автоматически анализируем фокус при загрузке страницы
    if (DASHBOARD_FOCUS_CONFIG.AUTO_ANALYZE_ON_LOAD) {
        setTimeout(() => {
            autoAnalyzeFocusForToday();
        }, 500); // Небольшая задержка для полной загрузки DOM
    }
    
    dashboardFocusState.isInitialized = true;
    console.log('✅ [DASHBOARD-FOCUS] Модуль инициализирован успешно');
}

/**
 * Настройка обработчиков событий
 */
function setupEventListeners() {
    const dateFilter = document.querySelector(DASHBOARD_FOCUS_CONFIG.DATE_FILTER);
    const periodFilter = document.querySelector(DASHBOARD_FOCUS_CONFIG.PERIOD_FILTER);
    
    // Обработчик изменения даты
    if (dateFilter) {
        dateFilter.addEventListener('change', onDateFilterChange);
        console.log('📅 [DASHBOARD-FOCUS] Подключен обработчик изменения даты');
    } else {
        console.warn('⚠️ [DASHBOARD-FOCUS] Элемент date-filter не найден');
    }
    
    // Обработчик изменения периода
    if (periodFilter) {
        periodFilter.addEventListener('change', onPeriodFilterChange);
        console.log('⏱️ [DASHBOARD-FOCUS] Подключен обработчик изменения периода');
    } else {
        console.warn('⚠️ [DASHBOARD-FOCUS] Элемент period-filter не найден');
    }
}

/**
 * Обработчик изменения даты
 */
function onDateFilterChange(event) {
    if (!DASHBOARD_FOCUS_CONFIG.AUTO_ANALYZE_ON_CHANGE) return;
    
    const selectedDate = event.target.value;
    if (!selectedDate) return;
    
    console.log('📅 [DASHBOARD-FOCUS] Изменена дата:', selectedDate);
    autoAnalyzeFocusForDate(selectedDate);
}

/**
 * Обработчик изменения периода
 */
function onPeriodFilterChange(event) {
    if (!DASHBOARD_FOCUS_CONFIG.AUTO_ANALYZE_ON_CHANGE) return;
    
    const selectedPeriod = event.target.value;
    const dateFilter = document.querySelector(DASHBOARD_FOCUS_CONFIG.DATE_FILTER);
    const selectedDate = dateFilter ? dateFilter.value : getTodayDate();
    
    console.log('⏱️ [DASHBOARD-FOCUS] Изменен период:', selectedPeriod, 'для даты:', selectedDate);
    autoAnalyzeFocusForDate(selectedDate);
}

/**
 * Автоматический анализ фокуса за сегодня
 */
function autoAnalyzeFocusForToday() {
    const todayDate = getTodayDate();
    
    // Устанавливаем сегодняшнюю дату в фильтр если он пустой
    const dateFilter = document.querySelector(DASHBOARD_FOCUS_CONFIG.DATE_FILTER);
    if (dateFilter && !dateFilter.value) {
        dateFilter.value = todayDate;
        console.log('📅 [DASHBOARD-FOCUS] Установлена сегодняшняя дата:', todayDate);
    }
    
    autoAnalyzeFocusForDate(todayDate);
}

/**
 * Автоматический анализ фокуса за указанную дату
 */
async function autoAnalyzeFocusForDate(selectedDate) {
    if (!selectedDate) {
        console.warn('⚠️ [DASHBOARD-FOCUS] Не указана дата для анализа');
        return;
    }
    
    if (dashboardFocusState.isAnalyzing) {
        console.log('⏳ [DASHBOARD-FOCUS] Анализ уже выполняется, пропускаем');
        return;
    }
    
    if (dashboardFocusState.lastAnalyzedDate === selectedDate) {
        console.log('💾 [DASHBOARD-FOCUS] Дата уже анализировалась, используем кэш');
        return;
    }
    
    try {
        dashboardFocusState.isAnalyzing = true;
        console.log('🧠 [DASHBOARD-FOCUS] Запуск автоматического анализа фокуса для:', selectedDate);
        
        // Показываем индикатор загрузки в метриках
        showLoadingInMetrics();
        
        // Выполняем анализ фокуса с использованием оригинальной функции
        await analyzeFocusForDashboard(selectedDate);
        
        dashboardFocusState.lastAnalyzedDate = selectedDate;
        console.log('✅ [DASHBOARD-FOCUS] Автоматический анализ завершен успешно');
        
    } catch (error) {
        console.error('❌ [DASHBOARD-FOCUS] Ошибка автоматического анализа:', error);
        
        // 🔄 FALLBACK: Пытаемся использовать альтернативный метод загрузки данных
        console.log('🔄 [DASHBOARD-FOCUS] Пытаемся альтернативный метод загрузки данных...');
        try {
            await loadDataAlternativeMethod(selectedDate);
        } catch (fallbackError) {
            console.error('❌ [DASHBOARD-FOCUS] Альтернативный метод тоже не сработал:', fallbackError);
            showErrorInMetrics(error.message);
        }
    } finally {
        dashboardFocusState.isAnalyzing = false;
    }
}

/**
 * Альтернативный метод загрузки данных напрямую из localStorage или других источников
 */
async function loadDataAlternativeMethod(selectedDate) {
    console.log('🔄 [DASHBOARD-FOCUS] Альтернативный метод: проверяем localStorage и другие источники');
    
    // Проверяем localStorage
    const storedWindowData = localStorage.getItem('windowActivities');
    const storedMouseData = localStorage.getItem('mouseActivities');
    
    if (storedWindowData || storedMouseData) {
        console.log('💾 [DASHBOARD-FOCUS] Найдены данные в localStorage');
        
        let windowActivities = [];
        let mouseActivities = [];
        
        try {
            if (storedWindowData) {
                windowActivities = JSON.parse(storedWindowData);
                console.log(`📊 [DASHBOARD-FOCUS] Загружено ${windowActivities.length} записей активности из localStorage`);
            }
            
            if (storedMouseData) {
                mouseActivities = JSON.parse(storedMouseData);
                console.log(`🖱️ [DASHBOARD-FOCUS] Загружено ${mouseActivities.length} записей мыши из localStorage`);
            }
            
            // Фильтруем по дате
            const filteredWindowData = windowActivities.filter(activity => {
                if (!activity.timestamp) return false;
                const activityDate = new Date(activity.timestamp).toISOString().split('T')[0];
                return activityDate === selectedDate;
            });
            
            const filteredMouseData = mouseActivities.filter(activity => {
                if (!activity.timestamp) return false;
                const activityDate = new Date(activity.timestamp).toISOString().split('T')[0];
                return activityDate === selectedDate;
            });
            
            console.log(`📊 [DASHBOARD-FOCUS] После фильтрации по дате ${selectedDate}: ${filteredWindowData.length} активности, ${filteredMouseData.length} мыши`);
            
            if (filteredWindowData.length > 0) {
                // Исправляем duration если его нет
                const processedData = filteredWindowData.map(activity => ({
                    ...activity,
                    duration: activity.duration || 60000 // 60 секунд по умолчанию
                }));
                
                // Используем умный калькулятор напрямую
                if (typeof updateMainMetricsWithRealActivity === 'function') {
                    console.log('🧠 [DASHBOARD-FOCUS] Используем умный калькулятор напрямую');
                    updateMainMetricsWithRealActivity(processedData, filteredMouseData, selectedDate);
                    
                    // Обновляем специфичные метрики фокуса
                    const focusMetrics = calculateBasicFocusMetrics(processedData, filteredMouseData);
                    updateFocusMetricsOnDashboard({ windowActivities: processedData, mouseActivities: filteredMouseData }, []);
                    
                    console.log('✅ [DASHBOARD-FOCUS] Альтернативный метод сработал!');
                    return;
                }
            }
            
        } catch (parseError) {
            console.error('❌ [DASHBOARD-FOCUS] Ошибка парсинга данных localStorage:', parseError);
        }
    }
    
    // Пытаемся использовать уже загруженные данные из других модулей
    if (window.lastLoadedData && window.lastLoadedData.activities) {
        console.log('💾 [DASHBOARD-FOCUS] Используем уже загруженные данные из других модулей');
        
        const existingData = window.lastLoadedData.activities.filter(activity => {
            if (!activity.timestamp && !activity.start_time) return false;
            const timeField = activity.timestamp || activity.start_time;
            const activityDate = new Date(timeField).toISOString().split('T')[0];
            return activityDate === selectedDate;
        });
        
        if (existingData.length > 0) {
            console.log(`📊 [DASHBOARD-FOCUS] Найдено ${existingData.length} записей в уже загруженных данных`);
            
            const processedData = existingData.map(activity => ({
                ...activity,
                duration: activity.duration || 60000
            }));
            
            if (typeof updateMainMetricsWithRealActivity === 'function') {
                updateMainMetricsWithRealActivity(processedData, [], selectedDate);
                console.log('✅ [DASHBOARD-FOCUS] Использованы уже загруженные данные');
                return;
            }
        }
    }
    
    throw new Error('Все альтернативные методы загрузки данных исчерпаны');
}

/**
 * Базовый расчет метрик фокуса без сложной логики слияния
 */
function calculateBasicFocusMetrics(windowActivities, mouseActivities) {
    const totalActivities = windowActivities.length;
    let totalTime = 0;
    let productiveTime = 0;
    
    windowActivities.forEach(activity => {
        const duration = parseInt(activity.duration) || 60000; // миллисекунды
        totalTime += duration;
        
        // Простая проверка продуктивности по названию приложения
        const appName = activity.app_name || '';
        if (appName.includes('Cursor') || appName.includes('firefox') || appName.includes('edge')) {
            productiveTime += duration;
        }
    });
    
    // Конвертируем в минуты
    totalTime = Math.round(totalTime / 1000 / 60);
    productiveTime = Math.round(productiveTime / 1000 / 60);
    
    const efficiency = totalTime > 0 ? Math.round((productiveTime / totalTime) * 100) : 0;
    
    return {
        totalTime,
        productiveTime,
        focusTime: productiveTime,
        focusScore: efficiency,
        efficiency,
        activities: totalActivities,
        mouseActivities: mouseActivities.length,
        mergedPeriods: 0
    };
}

/**
 * Специальная версия анализа фокуса для дашборда
 */
async function analyzeFocusForDashboard(selectedDate) {
    console.log('🎯 [DASHBOARD-FOCUS] Выполняем анализ фокуса для дашборда:', selectedDate);
    
    try {
        // Получаем все необходимые данные
        const allData = await loadAllDataForAnalysis(selectedDate);
        
        if (!allData || Object.keys(allData).length === 0) {
            throw new Error('Нет данных для анализа');
        }
        
        console.log('📊 [DASHBOARD-FOCUS] Загружены данные:', {
            windowActivities: allData.windowActivities?.length || 0,
            mouseActivities: allData.mouseActivities?.length || 0,
            resourceData: allData.resourceData?.length || 0,
            browserActivities: allData.browserActivities?.length || 0,
            websiteVisits: allData.websiteVisits?.length || 0
        });
        
        // 🔍 ДИАГНОСТИКА: Проверяем есть ли duration в записях
        if (allData.windowActivities && allData.windowActivities.length > 0) {
            const sampleRecords = allData.windowActivities.slice(0, 5);
            console.log('🔍 [DASHBOARD-FOCUS] Примеры записей активности:', sampleRecords);
            
            const withDuration = allData.windowActivities.filter(r => r.duration && parseInt(r.duration) > 0).length;
            const withoutDuration = allData.windowActivities.length - withDuration;
            
            console.log(`📊 [DASHBOARD-FOCUS] Статистика duration: ${withDuration} с duration, ${withoutDuration} без duration`);
            
            // Если нет duration, добавляем значение по умолчанию
            if (withoutDuration > 0) {
                console.warn(`⚠️ [DASHBOARD-FOCUS] Исправляем ${withoutDuration} записей без duration`);
                allData.windowActivities = allData.windowActivities.map(activity => {
                    if (!activity.duration || parseInt(activity.duration) === 0) {
                        return {
                            ...activity,
                            duration: 60000 // 60 секунд по умолчанию в миллисекундах
                        };
                    }
                    return activity;
                });
                console.log('✅ [DASHBOARD-FOCUS] Все записи исправлены с duration по умолчанию');
            }
        }
        
        // Выполняем умное слияние данных
        const mergedData = performSmartMerging(allData);
        console.log('🔄 [DASHBOARD-FOCUS] Создано объединенных записей:', mergedData.length);
        
        // Сохраняем данные глобально для других модулей
        window.lastAnalyzedData = mergedData;
        window.lastAnalyzedRawData = allData;
        
        // 🔗 КЛЮЧЕВАЯ ИНТЕГРАЦИЯ: Обновляем метрики дашборда
        await updateDashboardMetricsFromFocusAnalyzer(allData);
        
        // Дополнительно обновляем специфичные метрики фокуса
        updateFocusMetricsOnDashboard(allData, mergedData);
        
        // Сохраняем результаты
        dashboardFocusState.lastResults = {
            allData,
            mergedData,
            timestamp: new Date().toISOString()
        };
        
        console.log('✅ [DASHBOARD-FOCUS] Анализ фокуса для дашборда завершен');
        
    } catch (error) {
        console.error('❌ [DASHBOARD-FOCUS] Ошибка анализа фокуса для дашборда:', error);
        throw error;
    }
}

/**
 * Обновление специфичных метрик фокуса на дашборде
 */
function updateFocusMetricsOnDashboard(allData, mergedData) {
    console.log('📊 [DASHBOARD-FOCUS] Обновляем метрики фокуса на дашборде');
    
    // Рассчитываем метрики фокуса
    const focusMetrics = calculateFocusMetrics(allData, mergedData);
    
    // Обновляем элементы (используем существующие или создаем новые)
    updateMetricElement(
        DASHBOARD_FOCUS_CONFIG.FOCUS_TOTAL_TIME, 
        DASHBOARD_FOCUS_CONFIG.ALT_TOTAL_TIME,
        focusMetrics.totalTime,
        'Общее время фокуса'
    );
    
    updateMetricElement(
        DASHBOARD_FOCUS_CONFIG.FOCUS_PRODUCTIVE_TIME,
        DASHBOARD_FOCUS_CONFIG.ALT_PRODUCTIVE_TIME, 
        focusMetrics.productiveTime,
        'Продуктивное время фокуса'
    );
    
    updateMetricElement(
        DASHBOARD_FOCUS_CONFIG.FOCUS_SCORE,
        DASHBOARD_FOCUS_CONFIG.ALT_SCORE,
        `${focusMetrics.focusScore}%`,
        'Средний балл фокуса',
        false
    );
    
    updateMetricElement(
        DASHBOARD_FOCUS_CONFIG.FOCUS_EFFICIENCY,
        DASHBOARD_FOCUS_CONFIG.ALT_EFFICIENCY,
        `${focusMetrics.efficiency}%`,
        'Эффективность фокуса',
        false
    );
    
    console.log('✅ [DASHBOARD-FOCUS] Метрики фокуса обновлены:', focusMetrics);
}

/**
 * Расчет метрик фокуса
 */
function calculateFocusMetrics(allData, mergedData) {
    // Базовые расчеты
    const totalActivities = allData.windowActivities?.length || 0;
    const mouseActivities = allData.mouseActivities?.length || 0;
    const mergedPeriods = mergedData?.length || 0;
    
    // Расчет общего времени (в минутах)
    let totalTime = 0;
    let productiveTime = 0;
    let focusTime = 0;
    
    if (mergedData && mergedData.length > 0) {
        mergedData.forEach(period => {
            const duration = period.duration || 0;
            totalTime += duration;
            
            // Считаем продуктивным если есть активность мыши
            if (period.mouseActivity && period.mouseActivity > 0) {
                productiveTime += duration;
            }
            
            // Считаем фокусом если есть активность мыши И системная активность
            if (period.mouseActivity > 0 && (period.cpuUsage > 10 || period.memoryUsage > 0)) {
                focusTime += duration;
            }
        });
    }
    
    // Конвертируем секунды в минуты
    totalTime = Math.round(totalTime / 60);
    productiveTime = Math.round(productiveTime / 60);
    focusTime = Math.round(focusTime / 60);
    
    // Рассчитываем проценты
    const focusScore = totalTime > 0 ? Math.round((focusTime / totalTime) * 100) : 0;
    const efficiency = totalTime > 0 ? Math.round((productiveTime / totalTime) * 100) : 0;
    
    return {
        totalTime,
        productiveTime,
        focusTime,
        focusScore,
        efficiency,
        activities: totalActivities,
        mouseActivities,
        mergedPeriods
    };
}

/**
 * Обновление элемента метрики
 */
function updateMetricElement(primarySelector, fallbackSelector, value, subtitle, formatAsTime = true) {
    let element = document.querySelector(primarySelector);
    
    // Если основной элемент не найден, используем fallback
    if (!element) {
        element = document.querySelector(fallbackSelector);
    }
    
    if (!element) {
        console.warn(`⚠️ [DASHBOARD-FOCUS] Элемент не найден: ${primarySelector} || ${fallbackSelector}`);
        return;
    }
    
    // Форматируем значение
    let displayValue;
    if (formatAsTime && typeof value === 'number') {
        const hours = Math.floor(value / 60);
        const minutes = Math.round(value % 60);
        displayValue = formatTimeNicely(hours, minutes);
    } else {
        displayValue = value.toString();
    }
    
    // Обновляем значение
    element.textContent = displayValue;
    
    // Обновляем подзаголовок если есть
    if (subtitle) {
        const subtitleElement = element.parentElement?.querySelector('.metric-subtitle');
        if (subtitleElement) {
            subtitleElement.textContent = subtitle;
        }
    }
    
    console.log(`📊 [DASHBOARD-FOCUS] Обновлен элемент ${primarySelector || fallbackSelector}: ${displayValue}`);
}

/**
 * Показать индикатор загрузки в метриках
 */
function showLoadingInMetrics() {
    const loadingText = 'Анализ...';
    
    updateMetricElement(
        DASHBOARD_FOCUS_CONFIG.FOCUS_TOTAL_TIME,
        DASHBOARD_FOCUS_CONFIG.ALT_TOTAL_TIME,
        loadingText,
        'Выполняется анализ фокуса',
        false
    );
}

/**
 * Показать ошибку в метриках
 */
function showErrorInMetrics(errorMessage) {
    const errorText = 'Ошибка';
    
    updateMetricElement(
        DASHBOARD_FOCUS_CONFIG.FOCUS_TOTAL_TIME,
        DASHBOARD_FOCUS_CONFIG.ALT_TOTAL_TIME,
        errorText,
        `Ошибка: ${errorMessage}`,
        false
    );
}

/**
 * Получить сегодняшнюю дату в формате YYYY-MM-DD
 */
function getTodayDate() {
    const today = new Date();
    return today.toISOString().split('T')[0];
}

/**
 * Функция форматирования времени (совместимость)
 */
function formatTimeNicely(hours, minutes) {
    if (typeof window.formatTimeNicely === 'function') {
        return window.formatTimeNicely(hours, minutes);
    }
    
    // Fallback реализация
    if (hours === 0) {
        return `${minutes}м`;
    }
    return `${hours}ч ${minutes}м`;
}

/**
 * Публичный API модуля
 */
window.dashboardFocusAnalyzer = {
    init: initDashboardFocusAnalyzer,
    analyzeToday: autoAnalyzeFocusForToday,
    analyzeDate: autoAnalyzeFocusForDate,
    getState: () => ({ ...dashboardFocusState }),
    getConfig: () => ({ ...DASHBOARD_FOCUS_CONFIG })
};

/**
 * Автоматическая инициализация при загрузке DOM
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('📊 [DASHBOARD-FOCUS] DOM загружен, запускаем инициализацию');
    
    // Небольшая задержка для загрузки всех зависимостей
    setTimeout(() => {
        initDashboardFocusAnalyzer();
    }, 1000);
});

console.log('📊 [DASHBOARD-FOCUS] Модуль автоматического анализа фокуса загружен успешно'); 