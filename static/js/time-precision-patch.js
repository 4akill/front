/**
 * Патч для исправления точности округления времени
 * Версия: 1.0
 * Дата: 2025-01-22
 * Автор: AI Assistant
 * Назначение: Исправляет накопление ошибок при округлении времени
 */

(function() {
    'use strict';
    
    console.log('🔧 Применяем патч точности времени...');
    
    // Исходная функция Math.round
    const originalMathRound = Math.round;
    
    // Функция точного округления времени
    function preciseTimeRound(value) {
        // Для значений времени добавляем небольшой буфер
        if (typeof value === 'number' && value > 0 && value < 10000) {
            return originalMathRound(value + 0.000001);
        }
        return originalMathRound(value);
    }
    
    // Патчим updateMetrics если он существует
    if (window.updateMetrics) {
        const originalUpdateMetrics = window.updateMetrics;
        
        window.updateMetrics = function(data) {
            console.log('📊 Патч: Обновление метрик с точным округлением');
            
            // Если есть данные от умного калькулятора, обрабатываем их точно
            if (data && data.real_activity_stats) {
                const stats = data.real_activity_stats;
                
                // Создаем копию с точными значениями
                const patchedData = {
                    ...data,
                    real_activity_stats: {
                        ...stats,
                        total_time: preciseTimeRound(stats.total_time),
                        active_time: preciseTimeRound(stats.active_time), 
                        passive_time: preciseTimeRound(stats.passive_time),
                        productive_time: preciseTimeRound(stats.productive_time),
                        activity_ratio: stats.activity_ratio,
                        productivity_score: preciseTimeRound(stats.productivity_score)
                    }
                };
                
                console.log('🎯 Патч применен к метрикам:', {
                    originalTotal: stats.total_time,
                    patchedTotal: patchedData.real_activity_stats.total_time,
                    originalActive: stats.active_time,
                    patchedActive: patchedData.real_activity_stats.active_time
                });
                
                return originalUpdateMetrics.call(this, patchedData);
            }
            
            return originalUpdateMetrics.call(this, data);
        };
        
        console.log('✅ Патч точности времени применен к updateMetrics');
    } else {
        console.log('⚠️ updateMetrics не найден, патч будет применен позже');
        
        // Ждем загрузки dashboard.js
        const checkUpdateMetrics = setInterval(() => {
            if (window.updateMetrics) {
                clearInterval(checkUpdateMetrics);
                window.updateMetrics = (function(originalFn) {
                    return function(data) {
                        if (data && data.real_activity_stats) {
                            const stats = data.real_activity_stats;
                            data.real_activity_stats = {
                                ...stats,
                                total_time: preciseTimeRound(stats.total_time),
                                active_time: preciseTimeRound(stats.active_time),
                                passive_time: preciseTimeRound(stats.passive_time),
                                productive_time: preciseTimeRound(stats.productive_time),
                                productivity_score: preciseTimeRound(stats.productivity_score)
                            };
                        }
                        return originalFn.call(this, data);
                    };
                })(window.updateMetrics);
                console.log('✅ Патч точности времени применен (отложенно)');
            }
        }, 100);
        
        // Останавливаем проверку через 5 секунд
        setTimeout(() => clearInterval(checkUpdateMetrics), 5000);
    }
    
})();

console.log('🚀 Модуль патча точности времени загружен'); 