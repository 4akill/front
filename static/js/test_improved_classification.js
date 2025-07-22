/**
 * Тест улучшенной системы классификации активности
 * Проверяем работу интеллектуальной классификации на основе активности мыши
 */

// Тестовые данные - имитируем реальные данные из API
const testWindowData = [
    {
        app_name: 'Cursor.exe',
        timestamp: '2025-07-15T16:10:45.000Z',
        duration: 120 // 2 минуты
    },
    {
        app_name: 'msedge.exe',
        timestamp: '2025-07-15T16:12:00.000Z',
        duration: 180 // 3 минуты
    },
    {
        app_name: 'Y.Music.exe',
        timestamp: '2025-07-15T16:11:00.000Z',
        duration: 300 // 5 минут (фоновый)
    },
    {
        app_name: 'GameCenter.exe',
        timestamp: '2025-07-15T16:13:00.000Z',
        duration: 60 // 1 минута (фоновый)
    }
];

// Тестовые данные мыши - имитируем активность
const testMouseData = [
    {
        timestamp: '2025-07-15T16:11:00.000Z',
        mouse_clicks: 5,
        mouse_movements: 15
    },
    {
        timestamp: '2025-07-15T16:12:30.000Z',
        mouse_clicks: 3,
        mouse_movements: 10
    },
    {
        timestamp: '2025-07-15T16:14:00.000Z',
        mouse_clicks: 0,
        mouse_movements: 2 // Мало движений
    }
];

console.log('🧪 ТЕСТ УЛУЧШЕННОЙ СИСТЕМЫ КЛАССИФИКАЦИИ');
console.log('=========================================');

console.log('📊 Тестовые данные окон:');
testWindowData.forEach((entry, index) => {
    console.log(`   ${index + 1}. ${entry.app_name}: ${entry.duration}с с ${entry.timestamp}`);
});

console.log('');
console.log('🖱️ Тестовые данные мыши:');
testMouseData.forEach((entry, index) => {
    console.log(`   ${index + 1}. ${entry.timestamp}: ${entry.mouse_clicks} кликов, ${entry.mouse_movements} движений`);
});

console.log('');
console.log('🔍 Ожидаемые результаты:');
console.log('   - Cursor.exe: должен быть АКТИВНЫМ (есть активность мыши)');
console.log('   - msedge.exe: должен быть АКТИВНЫМ (есть активность мыши)');
console.log('   - Y.Music.exe: должен быть ФОНОВЫМ (в списке фоновых)');
console.log('   - GameCenter.exe: должен быть ФОНОВЫМ (в списке фоновых)');
console.log('   - Общее время: ~9 минут');
console.log('   - Активное время: ~5 минут');
console.log('   - Фоновое время: ~4 минуты');

console.log('');
console.log('💡 Для тестирования в браузере:');
console.log('   1. Откройте консоль браузера');
console.log('   2. Выполните: updateMainMetricsWithRealActivity(testWindowData, testMouseData, "2025-07-15")');
console.log('   3. Проверьте результаты классификации');

// Экспортируем для использования в браузере
if (typeof window !== 'undefined') {
    window.testWindowData = testWindowData;
    window.testMouseData = testMouseData;
    
    // Добавляем функцию для быстрого тестирования
    window.testImprovedClassification = function() {
        console.log('🧪 Запуск теста улучшенной классификации...');
        
        if (typeof updateMainMetricsWithRealActivity === 'function') {
            updateMainMetricsWithRealActivity(testWindowData, testMouseData, '2025-07-15');
        } else {
            console.error('❌ Функция updateMainMetricsWithRealActivity не найдена');
        }
    };
    
    console.log('🧪 Тест загружен! Используйте: testImprovedClassification()');
} 