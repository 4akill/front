/**
 * ТЕСТ ОТОБРАЖЕНИЯ ВРЕМЕНИ
 * Автор: AI Assistant
 * Дата: 2025-01-22
 * Версия: 1.1
 * Назначение: Проверка правильности отображения метрик времени
 */

// Тестовая функция для проверки логики отображения времени
function testTimeDisplayLogic() {
    console.log('🧪 Тест логики отображения времени');
    
    // Пример данных как в вашем случае
    const testData = {
        real_activity_stats: {
            total_time: 41,        // Общее время от начала до конца работы
            active_time: 26,       // Активное время (с мышиной активностью)  
            passive_time: 15,      // Пассивное время (фон)
            activity_ratio: 26/41, // Коэффициент активности = 0.634
            productivity_score: 63  // 63%
        }
    };
    
    console.log('📊 Тестовые данные:', testData.real_activity_stats);
    
    // Проверяем расчеты
    const stats = testData.real_activity_stats;
    const totalMinutes = Math.round(stats.total_time);
    const activeMinutes = Math.round(stats.active_time);
    const passiveMinutes = Math.round(stats.passive_time);
    const activityPercent = Math.round(stats.activity_ratio * 100);
    
    console.log('🔢 Расчетные значения:');
    console.log(`   Общее время: ${totalMinutes}м`);
    console.log(`   Активное время: ${activeMinutes}м`);
    console.log(`   Пассивное время: ${passiveMinutes}м`);
    console.log(`   Процент активности: ${activityPercent}%`);
    
    // Проверяем правильность формул
    const calculatedTotal = activeMinutes + passiveMinutes;
    const calculatedPercent = Math.round((activeMinutes / totalMinutes) * 100);
    
    console.log('✅ Проверка правильности:');
    console.log(`   ${activeMinutes} + ${passiveMinutes} = ${calculatedTotal} (должно быть ${totalMinutes})`);
    console.log(`   ${activeMinutes} / ${totalMinutes} * 100 = ${calculatedPercent}% (должно быть ${activityPercent}%)`);
    
    // Ожидаемые отображения
    console.log('📱 Ожидаемое отображение:');
    console.log(`   Общее рабочее время: ${totalMinutes}м`);
    console.log(`   ├─ Подпись: "Общее время активности от начала до конца"`);
    console.log(`   Продуктивное время: ${activeMinutes}м`);
    console.log(`   ├─ Подпись: "Активное время (${activityPercent}% от общего ${totalMinutes}м)"`);
    console.log(`   Активность: ${activityPercent}%`);
    console.log(`   ├─ Подпись: "Средний балл реальной активности"`);
    console.log(`   Фон: ${passiveMinutes}м`);
    console.log(`   └─ Подпись: "Время пассивной активности (фон)"`);
    
    // Проверяем систему фиксов
    if (window.smartSystemFix) {
        console.log('🔧 Тестируем системный фикс...');
        window.smartSystemFix.forceUpdateMetrics(testData, 'time-display-test');
    } else {
        console.log('⚠️ Системный фикс не загружен');
    }
    
    return {
        totalMinutes,
        activeMinutes,
        passiveMinutes,
        activityPercent,
        isValid: calculatedTotal === totalMinutes && calculatedPercent === activityPercent
    };
}

// Автозапуск теста когда DOM готов
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(testTimeDisplayLogic, 2000); // Ждем загрузки модулей
    });
} else {
    setTimeout(testTimeDisplayLogic, 2000);
}

// Экспорт для ручного запуска
window.testTimeDisplayLogic = testTimeDisplayLogic; 