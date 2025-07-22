/**
 * 🚨 КРИТИЧЕСКИЙ ХОТФИКС РАСЧЕТА ВРЕМЕНИ
 * Назначение: Исправление неправильного слот-алгоритма в smart-time-calculator.js
 * Автор: AI Assistant, дата: 2025-01-07, версия: v1.0
 * 
 * ПРОБЛЕМА: Алгоритм считает сумму времени всех слотов вместо реальной продолжительности сессии
 * РЕШЕНИЕ: Заменяем слот-алгоритм на расчет реальных сессий
 */

(function() {
    'use strict';
    
    console.log('🚨 Применяем критический хотфикс расчета времени');
    
    // Перехватываем и исправляем функцию updateMainMetricsWithRealActivity
    const originalFunction = window.updateMainMetricsWithRealActivity;
    
    if (originalFunction) {
        window.updateMainMetricsWithRealActivity = function(windowData, mouseData = null) {
            console.log('🚨 [ХОТФИКС] Используем исправленный расчет времени');
            
            if (!windowData || windowData.length === 0) {
                console.warn('⚠️ [ХОТФИКС] Нет данных windowData');
                return;
            }
            
            // 1. ПРАВИЛЬНЫЙ РАСЧЕТ МАШИННОГО ВРЕМЕНИ
            const validActivities = windowData.filter(activity => {
                const appName = activity.app_name || activity.application || '';
                const isBackground = ['TextInputHost.exe', 'dwm.exe', 'winlogon.exe', 'csrss.exe', 'lsass.exe', 'spoolsv.exe'].includes(appName);
                return !isBackground;
            });
            
            if (validActivities.length === 0) {
                console.warn('⚠️ [ХОТФИКС] Все активности - фоновые процессы');
                return;
            }
            
            // Сортируем по времени
            const sortedActivities = validActivities.sort((a, b) => {
                return new Date(a.timestamp) - new Date(b.timestamp);
            });
            
            // Вычисляем РЕАЛЬНОЕ время сессии (от первой до последней активности)
            const firstActivity = sortedActivities[0];
            const lastActivity = sortedActivities[sortedActivities.length - 1];
            
            const firstTime = new Date(firstActivity.timestamp);
            const lastTime = new Date(lastActivity.timestamp);
            const lastDuration = parseInt(lastActivity.duration) || 0;
            const lastEndTime = new Date(lastTime.getTime() + lastDuration * 1000);
            
            // ЭТО ПРАВИЛЬНОЕ МАШИННОЕ ВРЕМЯ!
            const realSessionTimeMs = lastEndTime - firstTime;
            const realSessionTimeMinutes = Math.round(realSessionTimeMs / (1000 * 60));
            
            console.log(`🚨 [ХОТФИКС] ИСПРАВЛЕННЫЙ расчет времени:`);
            console.log(`   📅 Первая активность: ${firstActivity.app_name} в ${firstTime.toLocaleTimeString()}`);
            console.log(`   📅 Последняя активность: ${lastActivity.app_name} в ${lastTime.toLocaleTimeString()} - ${lastEndTime.toLocaleTimeString()}`);
            console.log(`   ⏰ ПРАВИЛЬНОЕ общее время: ${realSessionTimeMinutes}м (${Math.floor(realSessionTimeMinutes/60)}ч ${realSessionTimeMinutes%60}м)`);
            
            // 2. АНАЛИЗ АКТИВНОСТИ МЫШИ
            const mouseActivityMap = new Map();
            if (mouseData && mouseData.length > 0) {
                mouseData.forEach(mouseEntry => {
                    const date = new Date(mouseEntry.timestamp);
                    const minuteKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}-${date.getHours()}-${date.getMinutes()}`;
                    
                    if (!mouseActivityMap.has(minuteKey)) {
                        mouseActivityMap.set(minuteKey, { clicks: 0, movements: 0 });
                    }
                    
                    const activity = mouseActivityMap.get(minuteKey);
                    activity.clicks += parseInt(mouseEntry.mouse_clicks) || 0;
                    activity.movements += parseInt(mouseEntry.mouse_movements) || 0;
                });
            }
            
            // 3. АНАЛИЗ АКТИВНОСТИ ПО МИНУТАМ (ТОЛЬКО для определения активное/пассивное)
            const uniqueTimeSlots = new Set();
            let activeMinutes = 0;
            let passiveMinutes = 0;
            
            validActivities.forEach(activity => {
                const startTime = new Date(activity.timestamp);
                const duration = parseInt(activity.duration) || 60;
                const endTime = new Date(startTime.getTime() + duration * 1000);
                
                // Создаем минутные слоты только для анализа активности
                for (let currentTime = new Date(startTime); currentTime < endTime; currentTime.setMinutes(currentTime.getMinutes() + 1)) {
                    const minuteKey = `${currentTime.getFullYear()}-${currentTime.getMonth()}-${currentTime.getDate()}-${currentTime.getHours()}-${currentTime.getMinutes()}`;
                    uniqueTimeSlots.add(minuteKey);
                }
            });
            
            // Анализируем каждую уникальную минуту на предмет активности мыши
            uniqueTimeSlots.forEach(minuteKey => {
                const mouseActivity = mouseActivityMap.get(minuteKey) || { clicks: 0, movements: 0 };
                const hasMouseActivity = mouseActivity.clicks > 0 || mouseActivity.movements >= 10;
                
                if (hasMouseActivity) {
                    activeMinutes++;
                } else {
                    passiveMinutes++;
                }
            });
            
            // 4. ПРАВИЛЬНЫЕ МЕТРИКИ
            const activityPercent = realSessionTimeMinutes > 0 ? Math.round((activeMinutes / realSessionTimeMinutes) * 100) : 0;
            
            console.log(`🚨 [ХОТФИКС] ПРАВИЛЬНЫЕ метрики:`);
            console.log(`   ⏰ Общее время сессии: ${realSessionTimeMinutes}м`);
            console.log(`   ✅ Активных минут: ${activeMinutes}м`);
            console.log(`   😴 Пассивных минут: ${passiveMinutes}м`);
            console.log(`   📈 Процент активности: ${activityPercent}%`);
            
            // 5. ОБНОВЛЯЕМ ИНТЕРФЕЙС С ПРАВИЛЬНЫМИ ДАННЫМИ
            const correctedData = {
                activities: validActivities,
                mouse_activity: mouseData || [],
                website_visits: [],
                browser_activity: [],
                real_activity_stats: {
                    total_time: realSessionTimeMinutes,           // ПРАВИЛЬНОЕ общее время
                    active_time: activeMinutes,                   // Активное время
                    passive_time: passiveMinutes,                 // Пассивное время
                    activity_ratio: realSessionTimeMinutes > 0 ? activeMinutes / realSessionTimeMinutes : 0,
                    productive_time: activeMinutes,               // Продуктивное = активное
                    productivity_score: activityPercent           // Процент активности
                }
            };
            
            console.log('🚨 [ХОТФИКС] Обновляем интерфейс с исправленными данными');
            
            // Вызываем updateMetrics с исправленными данными
            if (window.updateMetrics) {
                window.updateMetrics(correctedData);
            }
            
            return correctedData;
        };
        
        console.log('🚨 [ХОТФИКС] Функция updateMainMetricsWithRealActivity заменена на исправленную версию');
    }
    
    console.log('✅ Критический хотфикс расчета времени применен');
    
})(); 