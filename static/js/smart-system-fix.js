/**
 * УМНЫЙ СИСТЕМНЫЙ ФИКС
 * Автор: AI Assistant
 * Дата: 2025-01-22
 * Версия: 1.0
 * Назначение: Исправляет конфликты функций, проблемы с глобальными переменными и обработкой ошибок
 */

(function() {
    'use strict';
    
    console.log('🔧 Загружается умный системный фикс...');
    
    // ==================== 1. ИСПРАВЛЕНИЕ ГЛОБАЛЬНЫХ ПЕРЕМЕННЫХ ====================
    
    // Безопасная инициализация глобальных переменных
    if (typeof window.lastValidMetrics === 'undefined') {
        window.lastValidMetrics = {
            totalTime: 0,
            productiveTime: 0,
            productivity: 0,
            breaks: 0
        };
    }
    
    if (typeof window.lastValidResources === 'undefined') {
        window.lastValidResources = {
            cpu: { current: 0, max: 0, avg: 0 },
            ram: { current: 0, max: 0, avg: 0 },
            disk: { current: 0, max: 0, avg: 0 }
        };
    }
    
    // Безопасный доступ к window.lastLoadedData
    function getLastLoadedData() {
        return window.lastLoadedData || {};
    }
    
    function setLastLoadedData(data) {
        window.lastLoadedData = data || {};
    }
    
    // ==================== 2. ЦЕНТРАЛИЗОВАННЫЙ МЕНЕДЖЕР МЕТРИК ====================
    
    class MetricsManager {
        constructor() {
            this.isUpdating = false;
            this.updateQueue = [];
            this.lastUpdateTime = 0;
            this.updateThrottle = 100; // Минимум 100мс между обновлениями
        }
        
        // Безопасное обновление метрик с защитой от дублирования
        safeUpdateMetrics(data, source = 'unknown') {
            const now = Date.now();
            
            // Защита от слишком частых обновлений
            if (now - this.lastUpdateTime < this.updateThrottle) {
                console.log(`⏳ [ФИКС] Отложено обновление метрик от ${source} (защита от спама)`);
                this.updateQueue.push({ data, source, timestamp: now });
                return;
            }
            
            // Защита от одновременных обновлений
            if (this.isUpdating) {
                console.log(`🔄 [ФИКС] Пропущено обновление от ${source} (уже обновляется)`);
                return;
            }
            
            this.isUpdating = true;
            this.lastUpdateTime = now;
            
            try {
                console.log(`📊 [ФИКС] Обновление метрик от ${source}`);
                this._processUpdate(data, source);
                
                // Сохраняем успешные метрики
                if (data && data.real_activity_stats) {
                    this._saveValidMetrics(data.real_activity_stats);
                }
                
            } catch (error) {
                console.error(`❌ [ФИКС] Ошибка обновления метрик от ${source}:`, error);
                this._displaySavedMetrics();
            } finally {
                this.isUpdating = false;
                this._processQueue();
            }
        }
        
        _processUpdate(data, source) {
            if (!data) {
                console.warn(`⚠️ [ФИКС] Нет данных от ${source}`);
                this._displaySavedMetrics();
                return;
            }
            
            // Проверяем наличие данных от умного калькулятора
            if (data.real_activity_stats) {
                console.log(`🧠 [ФИКС] Используем данные умного калькулятора от ${source}`);
                this._updateFromSmartCalculator(data.real_activity_stats);
            } else {
                console.log(`📊 [ФИКС] Используем стандартные данные от ${source}`);
                this._updateFromStandardData(data);
            }
        }
        
        _updateFromSmartCalculator(stats) {
            const totalMinutes = this._safeRound(stats.total_time);        // МАШИННОЕ общее время (от первой до последней активности)
            const activeMinutes = this._safeRound(stats.active_time);      // АКТИВНОЕ время (с мышиной активностью)
            const passiveMinutes = this._safeRound(stats.passive_time);    // ПАССИВНОЕ время (фон/трей без мышиной активности)
            const activityPercent = this._safeRound(stats.activity_ratio * 100); // % активности от машинного времени
            
            // Обновляем интерфейс с ПРАВИЛЬНОЙ логикой
            // 1. МАШИННОЕ общее время - показываем total_time (от первой до последней активности включая перерывы)
            this._updateElement('total-working-time', this._formatTime(totalMinutes), 'Машинное общее время от первой до последней активности');
            
            // 2. АКТИВНОЕ время - показываем время с реальной активностью мыши
            this._updateElement('productive-time', this._formatTime(activeMinutes), `Активное время (${activityPercent}% от машинного ${this._formatTime(totalMinutes)})`);
            
            // 3. АКТИВНОСТЬ - показываем процент активности от машинного времени
            this._updateElement('activity-score', `${activityPercent}%`, 'Процент активности от машинного времени');
            
            // 4. ПАССИВНОЕ ВРЕМЯ - показываем время фона/трея без мышиной активности
            this._updateElement('break-time', this._formatTime(passiveMinutes), 'Пассивное время (фон/трей без мышиной активности)');
            
            // Сохраняем для последующего использования
            this._saveValidMetrics(stats);
        }
        
        _updateFromStandardData(data) {
            // Обнуляем метрики если нет данных умного калькулятора
            this._updateElement('total-working-time', '0м', 'Нет данных для выбранного сотрудника');
            this._updateElement('productive-time', '0м', '0% от общего времени');
            this._updateElement('activity-score', '0%', 'Нет данных о продуктивности');
            this._updateElement('break-time', '0м', 'Нет данных о неактивности');
        }
        
        _displaySavedMetrics() {
            if (!window.lastValidMetrics || window.lastValidMetrics.totalTime === 0) {
                console.log('📊 [ФИКС] Нет сохраненных метрик, отображаем нули');
                this._updateFromStandardData({});
                return;
            }
            
            console.log('💾 [ФИКС] Используем сохраненные метрики:', window.lastValidMetrics);
            
            const metrics = window.lastValidMetrics;
            this._updateElement('total-working-time', this._formatTime(metrics.totalTime));
            this._updateElement('productive-time', this._formatTime(metrics.productiveTime));
            this._updateElement('activity-score', `${metrics.productivity.toFixed(1)}%`);
            this._updateElement('break-time', this._formatTime(metrics.breaks));
        }
        
        _saveValidMetrics(stats) {
            window.lastValidMetrics = {
                totalTime: this._safeRound(stats.total_time),
                productiveTime: this._safeRound(stats.active_time),
                productivity: this._safeRound(stats.activity_ratio * 100),
                breaks: this._safeRound(stats.passive_time)
            };
        }
        
        _updateElement(elementId, value, subtitle = null) {
            const element = document.getElementById(elementId);
            if (element) {
                element.textContent = value;
                
                if (subtitle) {
                    const subtitleElement = element.parentElement.querySelector('.metric-subtitle');
                    if (subtitleElement) {
                        subtitleElement.textContent = subtitle;
                    }
                }
            }
        }
        
        _formatTime(minutes) {
            if (!minutes || isNaN(minutes) || minutes <= 0) return '0м';
            
            const hours = Math.floor(minutes / 60);
            const mins = Math.round(minutes % 60);
            
            if (hours > 0) {
                return `${hours}ч ${mins}м`;
            } else {
                return `${mins}м`;
            }
        }
        
        _safeRound(value) {
            if (typeof value !== 'number' || isNaN(value)) return 0;
            return Math.round(value);
        }
        
        _processQueue() {
            if (this.updateQueue.length > 0) {
                const nextUpdate = this.updateQueue.shift();
                setTimeout(() => {
                    this.safeUpdateMetrics(nextUpdate.data, nextUpdate.source + '-queued');
                }, this.updateThrottle);
            }
        }
    }
    
    // ==================== 3. СОЗДАНИЕ ЕДИНОГО МЕНЕДЖЕРА ====================
    
    const metricsManager = new MetricsManager();
    
    // ==================== 4. ПЕРЕОПРЕДЕЛЕНИЕ КОНФЛИКТУЮЩИХ ФУНКЦИЙ ====================
    
    // Сохраняем оригинальные функции если они есть
    const originalFunctions = {
        updateMetrics: window.updateMetrics,
        updateMainMetricsWithRealActivity: window.updateMainMetricsWithRealActivity,
        updateMainMetricsWithRealActivityPrecise: window.updateMainMetricsWithRealActivityPrecise
    };
    
    // Единая функция обновления метрик
    window.updateMetrics = function(data) {
        metricsManager.safeUpdateMetrics(data, 'updateMetrics');
    };
    
    // Замена функции умного калькулятора
    window.updateMainMetricsWithRealActivity = function(windowData) {
        console.log('🔧 [ФИКС] Перехват updateMainMetricsWithRealActivity');
        
        // Если есть оригинальная функция, используем её для обработки данных
        if (originalFunctions.updateMainMetricsWithRealActivity) {
            try {
                originalFunctions.updateMainMetricsWithRealActivity.call(this, windowData);
            } catch (error) {
                console.error('❌ [ФИКС] Ошибка в оригинальной функции калькулятора:', error);
                metricsManager.safeUpdateMetrics({ activities: windowData }, 'smart-calculator-fallback');
            }
        } else {
            metricsManager.safeUpdateMetrics({ activities: windowData }, 'smart-calculator-direct');
        }
    };
    
    // Замена точного калькулятора
    window.updateMainMetricsWithRealActivityPrecise = function(windowData) {
        console.log('🔧 [ФИКС] Перехват updateMainMetricsWithRealActivityPrecise');
        
        if (originalFunctions.updateMainMetricsWithRealActivityPrecise) {
            try {
                originalFunctions.updateMainMetricsWithRealActivityPrecise.call(this, windowData);
            } catch (error) {
                console.error('❌ [ФИКС] Ошибка в точном калькуляторе:', error);
                metricsManager.safeUpdateMetrics({ activities: windowData }, 'precise-calculator-fallback');
            }
        } else {
            metricsManager.safeUpdateMetrics({ activities: windowData }, 'precise-calculator-direct');
        }
    };
    
    // ==================== 5. ИСПРАВЛЕНИЕ ОБРАБОТКИ ОШИБОК ====================
    
    // Безопасная функция получения элементов DOM
    function safeGetElement(id) {
        const element = document.getElementById(id);
        if (!element) {
            console.warn(`⚠️ [ФИКС] Элемент ${id} не найден в DOM`);
        }
        return element;
    }
    
    // Безопасная функция обновления элементов DOM
    function safeUpdateElement(id, value, fallback = '-') {
        const element = safeGetElement(id);
        if (element) {
            element.textContent = value || fallback;
            return true;
        }
        return false;
    }
    
    // ==================== 6. ЗАЩИТА ОТ КОНФЛИКТОВ ПАТЧЕЙ ====================
    
    // Проверяем, не применялись ли уже другие патчи
    if (window.systemFixApplied) {
        console.warn('⚠️ [ФИКС] Системный фикс уже был применен, пропускаем');
        return;
    }
    
    // Отмечаем что фикс применен
    window.systemFixApplied = true;
    
    // ==================== 7. ЭКСПОРТ УТИЛИТ ====================
    
    window.smartSystemFix = {
        metricsManager: metricsManager,
        safeGetElement: safeGetElement,
        safeUpdateElement: safeUpdateElement,
        getLastLoadedData: getLastLoadedData,
        setLastLoadedData: setLastLoadedData,
        
        // Методы для принудительного обновления
        forceUpdateMetrics: function(data, source = 'manual') {
            metricsManager.isUpdating = false; // Сбрасываем блокировку
            metricsManager.safeUpdateMetrics(data, source);
        },
        
        // Восстановление из сохраненных метрик
        restoreMetrics: function() {
            metricsManager._displaySavedMetrics();
        },
        
        // Диагностика состояния
        diagnostics: function() {
            return {
                lastValidMetrics: window.lastValidMetrics,
                lastValidResources: window.lastValidResources,
                isUpdating: metricsManager.isUpdating,
                queueLength: metricsManager.updateQueue.length,
                lastUpdateTime: metricsManager.lastUpdateTime,
                systemFixApplied: window.systemFixApplied
            };
        }
    };
    
    // ==================== 8. ИНИЦИАЛИЗАЦИЯ ====================
    
    // Устанавливаем начальные значения если элементы уже загружены
    setTimeout(() => {
        if (document.getElementById('total-working-time')) {
            console.log('🔧 [ФИКС] Инициализация интерфейса с сохраненными метриками');
            metricsManager._displaySavedMetrics();
        }
    }, 100);
    
    console.log('✅ [ФИКС] Умный системный фикс успешно применен!');
    console.log('🔧 [ФИКС] Доступные утилиты: window.smartSystemFix');
    console.log('📊 [ФИКС] Диагностика: window.smartSystemFix.diagnostics()');
    
})(); 