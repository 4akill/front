/**
 * МОДУЛЬ ТОЧНОСТИ РАСЧЕТА ВРЕМЕНИ
 * Версия: 1.0
 * Автор: AI Assistant
 * Дата: 2025-01-22
 * Назначение: Исправление проблем с округлением и потерей точности при расчете рабочего времени
 */

/**
 * КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Потеря точности при множественных округлениях
 * 
 * Проблема: В системе происходят множественные округления на разных этапах:
 * 1. При конвертации секунд в минуты (деление на 60)
 * 2. При суммировании времени активностей
 * 3. При финальном округлении результата
 * 4. При отображении в интерфейсе
 * 
 * Это приводит к накоплению ошибки округления, особенно заметной 
 * при работе с короткими промежутками времени.
 */

// Класс для высокоточных расчетов времени
class PreciseTimeCalculator {
    constructor() {
        this.SECONDS_IN_MINUTE = 60;
        this.MILLISECONDS_IN_SECOND = 1000;
        
        // Храним время в секундах с десятичными долями для максимальной точности
        this.totalSeconds = 0;
        this.activeSeconds = 0;
        this.passiveSeconds = 0;
        this.productiveSeconds = 0;
    }

    /**
     * Добавляет активность к расчету с сохранением точности
     * @param {number} durationSeconds - Продолжительность в секундах
     * @param {boolean} isActive - Является ли активность активной
     * @param {number} productivityScore - Балл продуктивности (0-100)
     */
    addActivity(durationSeconds, isActive = true, productivityScore = 50) {
        // Сохраняем исходную точность в секундах
        const preciseDuration = parseFloat(durationSeconds) || 0;
        
        this.totalSeconds += preciseDuration;
        
        if (isActive) {
            this.activeSeconds += preciseDuration;
            // Рассчитываем продуктивное время с точностью
            const productiveMultiplier = Math.max(0, Math.min(100, productivityScore)) / 100;
            this.productiveSeconds += preciseDuration * productiveMultiplier;
        } else {
            this.passiveSeconds += preciseDuration;
        }
    }

    /**
     * Возвращает результаты расчета с минимальной потерей точности
     * @returns {Object} Метрики времени
     */
    getMetrics() {
        return {
            // Для внутренних расчетов храним точные значения в секундах
            totalTimeSeconds: this.totalSeconds,
            activeTimeSeconds: this.activeSeconds,
            passiveTimeSeconds: this.passiveSeconds,
            productiveTimeSeconds: this.productiveSeconds,
            
            // Для отображения округляем только в конце с правильным алгоритмом
            totalTimeMinutes: this.preciseRoundToMinutes(this.totalSeconds),
            activeTimeMinutes: this.preciseRoundToMinutes(this.activeSeconds),
            passiveTimeMinutes: this.preciseRoundToMinutes(this.passiveSeconds),
            productiveTimeMinutes: this.preciseRoundToMinutes(this.productiveSeconds),
            
            // Соотношения рассчитываем с точными значениями
            activityRatio: this.totalSeconds > 0 ? this.activeSeconds / this.totalSeconds : 0,
            productivityScore: this.activeSeconds > 0 ? (this.productiveSeconds / this.activeSeconds) * 100 : 0
        };
    }

    /**
     * Точное округление секунд к минутам с правильным алгоритмом
     * @param {number} seconds - Время в секундах
     * @returns {number} Время в минутах (округленное)
     */
    preciseRoundToMinutes(seconds) {
        const exactMinutes = seconds / this.SECONDS_IN_MINUTE;
        
        // Используем правильное округление к ближайшему целому
        // Math.round() может давать неточности для .5, поэтому используем более точный алгоритм
        return Math.floor(exactMinutes + 0.5);
    }

    /**
     * Форматирование времени для отображения с сохранением исходной логики
     * @param {number} totalMinutes - Общее время в минутах
     * @returns {string} Отформатированная строка времени
     */
    formatTimeDisplay(totalMinutes) {
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60; // Уже округленные минуты
        
        if (hours === 0) {
            return `${minutes}м`;
        }
        
        return `${hours}ч ${minutes}м`;
    }

    /**
     * Сброс калькулятора для нового расчета
     */
    reset() {
        this.totalSeconds = 0;
        this.activeSeconds = 0;
        this.passiveSeconds = 0;
        this.productiveSeconds = 0;
    }
}

/**
 * Исправленная функция расчета метрик реальной активности
 * @param {Array} correctedActivities - Массив скорректированных активностей
 * @returns {Object} Точные метрики времени
 */
function calculateRealActivityMetricsPrecise(correctedActivities) {
    console.log('🎯 Запуск точного расчета метрик времени');
    
    const calculator = new PreciseTimeCalculator();
    let totalProductivitySum = 0;
    let totalActivities = 0;

    // Обрабатываем каждую активность с сохранением точности
    correctedActivities.forEach((activity, index) => {
        const durationSeconds = parseFloat(activity.corrected_duration || activity.duration) || 0;
        const productivity = parseFloat(activity.productivity_score) || getProductivityScore(activity) || 50;
        const isRealActivity = activity.is_real_activity !== false; // По умолчанию считаем активной
        
        if (durationSeconds > 0) {
            calculator.addActivity(durationSeconds, isRealActivity, productivity);
            totalProductivitySum += productivity;
            totalActivities++;
            
            // Детальное логирование для диагностики
            if (durationSeconds >= 60) { // Логируем активности длиннее минуты
                console.log(`📝 Активность #${index}: ${activity.app_name || 'Unknown'}, ` +
                           `${Math.floor(durationSeconds/60)}м ${Math.round(durationSeconds%60)}с, ` +
                           `продуктивность: ${productivity}%, активная: ${isRealActivity}`);
            }
        }
    });

    const metrics = calculator.getMetrics();
    const avgProductivity = totalActivities > 0 ? (totalProductivitySum / totalActivities) : 0;

    const result = {
        // Время в минутах для совместимости с существующим кодом
        total_time: metrics.totalTimeMinutes,
        active_time: metrics.activeTimeMinutes,
        passive_time: metrics.passiveTimeMinutes,
        productive_time: metrics.productiveTimeMinutes,
        
        // Соотношения и проценты
        activity_ratio: metrics.activityRatio,
        productivity_score: avgProductivity,
        
        // Дополнительная диагностическая информация
        debug_info: {
            total_seconds_precise: metrics.totalTimeSeconds,
            total_activities: totalActivities,
            precision_loss: Math.abs(metrics.totalTimeSeconds/60 - metrics.totalTimeMinutes),
            calculation_method: 'precise_calculator_v1.0'
        }
    };

    // Диагностическое логирование
    console.log('🎯 Результаты точного расчета:', {
        'Общее время': `${result.total_time}м (${metrics.totalTimeSeconds.toFixed(1)}с точно)`,
        'Активное время': `${result.active_time}м`,
        'Пассивное время': `${result.passive_time}м`,
        'Продуктивное время': `${result.productive_time}м`,
        'Потеря точности': `${(result.debug_info.precision_loss * 60).toFixed(1)}с`,
        'Всего активностей': totalActivities
    });

    return result;
}

/**
 * Исправленная функция обновления метрик в интерфейсе
 * @param {Object} windowData - Данные от умного калькулятора
 */
function updateMainMetricsWithRealActivityPrecise(windowData) {
    console.log('🎯 Обновление метрик с точным калькулятором');
    
    if (!windowData || !windowData.corrected_activities || windowData.corrected_activities.length === 0) {
        console.warn('⚠️ Нет скорректированных активностей для точного расчета');
        return;
    }

    // Используем точный калькулятор
    const preciseStats = calculateRealActivityMetricsPrecise(windowData.corrected_activities);
    
    // Создаем объект данных для стандартной функции обновления
    const dataForUpdate = {
        real_activity_stats: preciseStats,
        activities: windowData.corrected_activities || [],
        period_info: windowData.period_info || {}
    };

    // Вызываем стандартную функцию обновления интерфейса
    if (typeof updateMetrics === 'function') {
        updateMetrics(dataForUpdate);
    } else {
        console.error('❌ Функция updateMetrics не найдена');
    }

    // Дополнительное логирование для диагностики
    console.log('✅ Точные метрики применены в интерфейс');
}

/**
 * Функция диагностики точности расчетов
 * @param {Array} activities - Исходные активности
 * @returns {Object} Отчет о точности
 */
function diagnosePrecisionIssues(activities) {
    console.log('🔍 Диагностика точности расчетов времени');
    
    if (!activities || activities.length === 0) {
        return { error: 'Нет активностей для анализа' };
    }

    // Расчет старым методом (с округлениями)
    let oldMethodTotal = 0;
    activities.forEach(activity => {
        const durationMinutes = Math.round((activity.duration || 0) / 60); // Округление на каждом шаге
        oldMethodTotal += durationMinutes;
    });

    // Расчет новым точным методом
    const calculator = new PreciseTimeCalculator();
    activities.forEach(activity => {
        calculator.addActivity(activity.duration || 0, true, 50);
    });
    const newMethodTotal = calculator.getMetrics().totalTimeMinutes;

    // Расчет точного времени без округлений
    const exactTotalSeconds = activities.reduce((sum, activity) => sum + (activity.duration || 0), 0);
    const exactTotalMinutes = exactTotalSeconds / 60;

    const report = {
        activities_count: activities.length,
        exact_total_seconds: exactTotalSeconds,
        exact_total_minutes: exactTotalMinutes,
        old_method_minutes: oldMethodTotal,
        new_method_minutes: newMethodTotal,
        precision_loss_old: Math.abs(exactTotalMinutes - oldMethodTotal),
        precision_loss_new: Math.abs(exactTotalMinutes - newMethodTotal),
        improvement: Math.abs(exactTotalMinutes - oldMethodTotal) - Math.abs(exactTotalMinutes - newMethodTotal),
        recommendation: ''
    };

    // Добавляем рекомендацию
    if (report.improvement > 0.5) {
        report.recommendation = 'Рекомендуется использовать точный калькулятор для улучшения точности';
    } else if (report.precision_loss_new < 0.1) {
        report.recommendation = 'Точность расчетов хорошая';
    } else {
        report.recommendation = 'Требуется дополнительная настройка алгоритма';
    }

    console.log('📊 Отчет о точности:', report);
    return report;
}

// Экспорт функций для использования в других модулях
if (typeof window !== 'undefined') {
    window.PreciseTimeCalculator = PreciseTimeCalculator;
    window.calculateRealActivityMetricsPrecise = calculateRealActivityMetricsPrecise;
    window.updateMainMetricsWithRealActivityPrecise = updateMainMetricsWithRealActivityPrecise;
    window.diagnosePrecisionIssues = diagnosePrecisionIssues;
    
    console.log('✅ Модуль точности расчета времени загружен');
} 