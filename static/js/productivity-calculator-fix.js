/**
 * 📊 МОДУЛЬ РАСЧЕТА ПРОДУКТИВНОСТИ
 * Назначение: Правильный расчет продуктивности на основе типов приложений
 * Автор: AI Assistant, дата: 2025-01-07, версия: v1.0
 */

(function() {
    'use strict';
    
    console.log('📊 Применяем модуль расчета продуктивности');
    
    // Определяем продуктивные приложения
    const PRODUCTIVE_APPS = {
        'acad.exe': 100,           // AutoCAD - очень продуктивно
        'AutoCAD': 100,
        'chrome.exe': 70,          // Chrome - умеренно продуктивно
        'Google Chrome': 70,
        'Taskmgr.exe': 30,         // Диспетчер задач - низкая продуктивность
        'Диспетчер задач': 30,
        'AnyDesk.exe': 80,         // Удаленный доступ - продуктивно
        'AnyDesk': 80,
        'smart_client.exe': 10,    // Наш клиент - низкая продуктивность
        'ApplicationFrameHost.exe': 20, // Хост приложений - низкая
        'KYOCERA Print Center': 40 // Печать - средняя продуктивность
    };
    
    // Фоновые процессы (не влияют на продуктивность)
    const BACKGROUND_PROCESSES = [
        'TextInputHost.exe',
        'dwm.exe',
        'winlogon.exe',
        'csrss.exe',
        'lsass.exe',
        'spoolsv.exe'
    ];
    
    /**
     * Определяет продуктивность приложения
     * @param {string} appName - Название приложения
     * @returns {number} - Процент продуктивности (0-100)
     */
    function calculateAppProductivity(appName) {
        if (!appName) return 50; // По умолчанию нейтрально
        
        // Проверяем фоновые процессы
        if (BACKGROUND_PROCESSES.includes(appName)) {
            return 0; // Фоновые процессы не считаются
        }
        
        // Ищем точное совпадение
        if (PRODUCTIVE_APPS[appName] !== undefined) {
            return PRODUCTIVE_APPS[appName];
        }
        
        // Ищем частичное совпадение
        const appLower = appName.toLowerCase();
        for (const [key, value] of Object.entries(PRODUCTIVE_APPS)) {
            if (appLower.includes(key.toLowerCase()) || key.toLowerCase().includes(appLower)) {
                return value;
            }
        }
        
        // По умолчанию - средняя продуктивность
        return 50;
    }
    
    /**
     * Рассчитывает общую продуктивность на основе активностей
     * @param {Array} activities - Массив активностей
     * @returns {Object} - Объект с метриками продуктивности
     */
    function calculateProductivityMetrics(activities) {
        if (!activities || activities.length === 0) {
            return {
                totalProductiveTime: 0,
                totalUnproductiveTime: 0,
                averageProductivity: 0,
                productivityScore: 0
            };
        }
        
        let totalWeightedProductivity = 0;
        let totalTime = 0;
        let productiveTime = 0;
        let unproductiveTime = 0;
        
        // Группируем активности по приложениям для расчета времени
        const appGroups = {};
        
        activities.forEach(activity => {
            const appName = activity.app_name || activity.application || '';
            const duration = parseInt(activity.duration) || 0;
            
            if (duration > 0) {
                if (!appGroups[appName]) {
                    appGroups[appName] = { totalTime: 0, activities: [] };
                }
                appGroups[appName].totalTime += duration;
                appGroups[appName].activities.push(activity);
            }
        });
        
        // Рассчитываем продуктивность для каждого приложения
        Object.entries(appGroups).forEach(([appName, group]) => {
            const productivity = calculateAppProductivity(appName);
            const timeInMinutes = group.totalTime / 60;
            
            totalTime += timeInMinutes;
            totalWeightedProductivity += productivity * timeInMinutes;
            
            if (productivity >= 70) {
                productiveTime += timeInMinutes;
            } else if (productivity <= 30) {
                unproductiveTime += timeInMinutes;
            } else {
                // Частично продуктивное время
                const productivePart = (productivity / 100) * timeInMinutes;
                productiveTime += productivePart;
                unproductiveTime += (timeInMinutes - productivePart);
            }
            
            console.log(`📊 [ПРОДУКТИВНОСТЬ] ${appName}: ${Math.round(timeInMinutes)}м, продуктивность: ${productivity}%`);
        });
        
        const averageProductivity = totalTime > 0 ? Math.round(totalWeightedProductivity / totalTime) : 0;
        const productivityScore = totalTime > 0 ? Math.round((productiveTime / totalTime) * 100) : 0;
        
        console.log(`📊 [ПРОДУКТИВНОСТЬ] Итого:`);
        console.log(`   ⏰ Общее время: ${Math.round(totalTime)}м`);
        console.log(`   ✅ Продуктивное время: ${Math.round(productiveTime)}м`);
        console.log(`   ❌ Непродуктивное время: ${Math.round(unproductiveTime)}м`);
        console.log(`   📈 Средняя продуктивность: ${averageProductivity}%`);
        console.log(`   🎯 Балл продуктивности: ${productivityScore}%`);
        
        return {
            totalProductiveTime: Math.round(productiveTime),
            totalUnproductiveTime: Math.round(unproductiveTime),
            averageProductivity: averageProductivity,
            productivityScore: productivityScore
        };
    }
    
    // Перехватываем хотфикс для добавления расчета продуктивности
    const originalHotfix = window.updateMainMetricsWithRealActivity;
    
    if (originalHotfix) {
        window.updateMainMetricsWithRealActivity = function(windowData, mouseData = null) {
            console.log('📊 [ПРОДУКТИВНОСТЬ] Перехват хотфикса для добавления расчета продуктивности');
            
            // Вызываем оригинальный хотфикс
            const result = originalHotfix.call(this, windowData, mouseData);
            
            if (result && result.activities) {
                // Рассчитываем продуктивность
                const productivityMetrics = calculateProductivityMetrics(result.activities);
                
                // Обновляем данные результата
                if (result.real_activity_stats) {
                    // Заменяем активное время на продуктивное
                    result.real_activity_stats.productive_time = productivityMetrics.totalProductiveTime;
                    result.real_activity_stats.productivity_score = productivityMetrics.averageProductivity;
                    
                    console.log('📊 [ПРОДУКТИВНОСТЬ] Обновлены метрики продуктивности в результате');
                }
            }
            
            return result;
        };
        
        console.log('📊 [ПРОДУКТИВНОСТЬ] Хотфикс расширен модулем продуктивности');
    }
    
    // Экспортируем функции для использования в других модулях
    window.calculateAppProductivity = calculateAppProductivity;
    window.calculateProductivityMetrics = calculateProductivityMetrics;
    
    console.log('✅ Модуль расчета продуктивности применен');
    
})(); 