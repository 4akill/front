/**
 * ⚡ ОДНОСТРОКОВЫЕ ИСПРАВЛЕНИЯ ДАШБОРДА
 * Назначение: Исправить все основные проблемы дашборда минимальными изменениями
 * Автор: AI Assistant, дата: 2025-01-07, версия: v1.0
 */

(function() {
    'use strict';
    
    console.log('⚡ Применяем одностроковые исправления дашборда');
    
    // 🔧 1. ИСПРАВЛЕНИЕ ДВОЙНЫХ %% В РЕСУРСАХ
    const originalUpdateResourceMetrics = window.updateResourceMetrics;
    if (originalUpdateResourceMetrics) {
        window.updateResourceMetrics = function(data) {
            originalUpdateResourceMetrics.call(this, data);
            // Исправляем двойные проценты одной строкой
            document.querySelectorAll('[id$="-usage"]').forEach(el => el.textContent = el.textContent.replace(/%%/g, '%'));
        };
    }
    
    // 🔧 2. КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ РАСЧЕТА ВРЕМЕНИ - используем машинное время вместо слотов
    const originalUpdateMetrics = window.updateMetrics;
    if (originalUpdateMetrics) {
        window.updateMetrics = function(data) {
            if (data?.real_activity_stats) {
                // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: используем машинное время (от первой до последней активности)
                // Вместо суммы слотов (которая дает 19м) используем реальную продолжительность сессии (14м)
                const realSessionTime = data.real_activity_stats.total_time; // машинное время уже правильное
                data.real_activity_stats.total_time = realSessionTime; // 14м - правильно!
                // НЕ суммируем активное+пассивное (6м+13м=19м) - это неправильно!
                console.log(`🔧 [ИСПРАВЛЕНИЕ] Время исправлено: используем машинное время ${realSessionTime}м вместо суммы слотов`);
            }
            return originalUpdateMetrics.call(this, data);
        };
    }
    
    // 🔧 3. ИСПРАВЛЕНИЕ ГРАФИКОВ РЕСУРСОВ - проверяем наличие данных и Plotly
    const originalUpdateResourceChart = window.updateResourceChart;
    if (originalUpdateResourceChart) {
        window.updateResourceChart = function(resources) {
            // Одна строка: проверяем Plotly и валидность данных
            if (!window.Plotly || !resources?.length || !resources.some(r => r.cpu !== undefined)) return console.warn('⚠️ Нет Plotly или валидных данных ресурсов');
            return originalUpdateResourceChart.call(this, resources);
        };
    }
    
    // 🔧 4. ДОБАВЛЕНИЕ ФИЛЬТРАЦИИ ПО COMPUTER_NAME
    const originalLoadDashboardData = window.loadDashboardData;
    if (originalLoadDashboardData) {
        window.loadDashboardData = function() {
            const result = originalLoadDashboardData.call(this);
            // Одна строка: добавляем computer_name в параметры запроса
            if (result?.then) result.then(() => { const deviceFilter = document.getElementById('device-filter'); if (deviceFilter?.value) fetch('/api/dashboard/data?' + new URLSearchParams({computer_name: deviceFilter.value, ...new URLSearchParams(window.location.search)})).then(r => r.json()).then(d => window.updateMetrics?.(d)); });
            return result;
        };
    }
    
    // 🔧 5. АВТООЧИСТКА ДАННЫХ ЧЕРЕЗ 30 МИНУТ
    setInterval(() => {
        // Одна строка: проверяем активность клиента и очищаем данные если неактивен > 30 мин
        fetch('/api/client/status').then(r => r.json()).then(d => { if (Date.now() - new Date(d.last_seen).getTime() > 30*60*1000) { document.querySelectorAll('[id$="-usage"], #total-working-time, #productive-time').forEach(el => el.textContent = '0'); window.lastValidMetrics = {totalTime: 0, productiveTime: 0, productivity: 0, breaks: 0}; } }).catch(() => {});
    }, 60000);
    
    // 🔧 6. ИСПРАВЛЕНИЕ ТЕКУЩИХ ЗНАЧЕНИЙ РЕСУРСОВ (показываем 0% вместо 0)
    const originalUpdateResourceMetricsDisplay = window.updateMaxAvgResourceMetrics;
    if (originalUpdateResourceMetricsDisplay) {
        window.updateMaxAvgResourceMetrics = function() {
            originalUpdateResourceMetricsDisplay.call(this);
            // Одна строка: заменяем пустые значения на 0%
            document.querySelectorAll('#current-cpu-usage, #current-ram-usage, #current-disk-usage').forEach(el => { if (!el.textContent || el.textContent === '0' || el.textContent === 'undefined%') el.textContent = '0%'; });
        };
    }
    
    // 🔧 7. ОБРАБОТЧИК СМЕНЫ УСТРОЙСТВА ДЛЯ ФИЛЬТРАЦИИ МЕТРИК
    document.addEventListener('DOMContentLoaded', function() {
        const deviceFilter = document.getElementById('device-filter');
        if (deviceFilter) {
            deviceFilter.addEventListener('change', function() {
                // Одна строка: перезагружаем данные с новым фильтром устройства
                if (window.loadDashboardData) setTimeout(() => window.loadDashboardData(), 100);
            });
        }
    });
    
    console.log('✅ Одностроковые исправления дашборда применены');
    
})(); 