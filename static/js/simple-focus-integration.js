/**
 * ПРОСТАЯ ИНТЕГРАЦИЯ АНАЛИЗА ФОКУСА С ГЛАВНОЙ СТРАНИЦЕЙ
 * Автор: AI Assistant
 * Дата: 2025-01-24
 * Версия: v1.0
 * Назначение: Использует существующую функцию analyzeFocus() автоматически на главной странице
 */

console.log('🔗 [SIMPLE-FOCUS] Загружается простая интеграция анализа фокуса');

/**
 * Состояние интеграции
 */
const focusIntegrationState = {
    isAnalyzing: false,
    lastAnalyzedDate: null,
    isEnabled: true
};

/**
 * Автоматически запускает анализ фокуса при загрузке страницы
 */
function autoAnalyzeFocusOnLoad() {
    if (!focusIntegrationState.isEnabled) return;
    
    console.log('🔗 [SIMPLE-FOCUS] Автоматический запуск анализа фокуса при загрузке');
    
    // Получаем текущую дату
    const today = new Date().toISOString().split('T')[0];
    
    // Устанавливаем дату в фильтр если не установлена
    const dateFilter = document.querySelector('#date-filter');
    if (dateFilter && !dateFilter.value) {
        dateFilter.value = today;
        console.log(`📅 [SIMPLE-FOCUS] Установлена дата: ${today}`);
    }
    
    // Запускаем анализ фокуса за сегодня
    setTimeout(() => {
        runFocusAnalysisForDate(today);
    }, 2000);
}

/**
 * Запускает анализ фокуса для указанной даты
 */
async function runFocusAnalysisForDate(selectedDate) {
    if (!selectedDate) {
        console.warn('⚠️ [SIMPLE-FOCUS] Не указана дата для анализа');
        return;
    }
    
    if (focusIntegrationState.isAnalyzing) {
        console.log('⏳ [SIMPLE-FOCUS] Анализ уже выполняется, пропускаем');
        return;
    }
    
    // Проверяем доступность функции analyzeFocus
    if (typeof analyzeFocus !== 'function') {
        console.warn('⚠️ [SIMPLE-FOCUS] Функция analyzeFocus не найдена, ожидаем загрузки...');
        
        // Пытаемся дождаться загрузки функции
        setTimeout(() => {
            if (typeof analyzeFocus === 'function') {
                runFocusAnalysisForDate(selectedDate);
            } else {
                console.error('❌ [SIMPLE-FOCUS] Функция analyzeFocus так и не загрузилась');
            }
        }, 3000);
        return;
    }
    
    try {
        focusIntegrationState.isAnalyzing = true;
        console.log(`🧠 [SIMPLE-FOCUS] Запуск analyzeFocus для даты: ${selectedDate}`);
        
        // Вызываем существующую функцию анализа фокуса
        await analyzeFocus(selectedDate);
        
        focusIntegrationState.lastAnalyzedDate = selectedDate;
        console.log('✅ [SIMPLE-FOCUS] Анализ фокуса завершен успешно');
        
    } catch (error) {
        console.error('❌ [SIMPLE-FOCUS] Ошибка анализа фокуса:', error);
    } finally {
        focusIntegrationState.isAnalyzing = false;
    }
}

/**
 * Обработчик изменения даты
 */
function onDateFilterChange(event) {
    if (!focusIntegrationState.isEnabled) return;
    
    const selectedDate = event.target.value;
    if (!selectedDate) return;
    
    console.log(`📅 [SIMPLE-FOCUS] Изменена дата на: ${selectedDate}`);
    
    // Запускаем анализ для новой даты
    setTimeout(() => {
        runFocusAnalysisForDate(selectedDate);
    }, 500);
}

/**
 * Обработчик изменения периода
 */
function onPeriodFilterChange(event) {
    if (!focusIntegrationState.isEnabled) return;
    
    const dateFilter = document.querySelector('#date-filter');
    const selectedDate = dateFilter ? dateFilter.value : null;
    
    if (!selectedDate) return;
    
    console.log(`📊 [SIMPLE-FOCUS] Изменен период, повторяем анализ для даты: ${selectedDate}`);
    
    // Повторяем анализ для той же даты
    setTimeout(() => {
        runFocusAnalysisForDate(selectedDate);
    }, 500);
}

/**
 * Устанавливает обработчики событий
 */
function setupEventListeners() {
    console.log('🔗 [SIMPLE-FOCUS] Установка обработчиков событий');
    
    // Обработчик изменения даты
    const dateFilter = document.querySelector('#date-filter');
    if (dateFilter) {
        dateFilter.addEventListener('change', onDateFilterChange);
        console.log('✅ [SIMPLE-FOCUS] Обработчик изменения даты установлен');
    }
    
    // Обработчик изменения периода
    const periodFilter = document.querySelector('#period-filter');
    if (periodFilter) {
        periodFilter.addEventListener('change', onPeriodFilterChange);
        console.log('✅ [SIMPLE-FOCUS] Обработчик изменения периода установлен');
    }
}

/**
 * Проверяет доступность функции analyzeFocus
 */
function checkAnalyzeFocusAvailability() {
    const checkInterval = setInterval(() => {
        if (typeof analyzeFocus === 'function') {
            console.log('✅ [SIMPLE-FOCUS] Функция analyzeFocus найдена!');
            clearInterval(checkInterval);
            
            // Запускаем автоматический анализ
            autoAnalyzeFocusOnLoad();
        } else {
            console.log('⏳ [SIMPLE-FOCUS] Ожидаем загрузки analyzeFocus...');
        }
    }, 1000);
    
    // Останавливаем проверку через 30 секунд
    setTimeout(() => {
        clearInterval(checkInterval);
        if (typeof analyzeFocus !== 'function') {
            console.error('❌ [SIMPLE-FOCUS] Функция analyzeFocus не загрузилась за 30 секунд');
        }
    }, 30000);
}

/**
 * Инициализация простой интеграции
 */
function initSimpleFocusIntegration() {
    console.log('🔗 [SIMPLE-FOCUS] Инициализация простой интеграции анализа фокуса');
    
    // Устанавливаем обработчики событий
    setupEventListeners();
    
    // Проверяем доступность analyzeFocus и запускаем анализ
    checkAnalyzeFocusAvailability();
    
    console.log('✅ [SIMPLE-FOCUS] Простая интеграция инициализирована');
}

/**
 * Ручной запуск анализа (для отладки)
 */
function manualAnalyzeFocus(date = null) {
    const targetDate = date || document.querySelector('#date-filter')?.value || new Date().toISOString().split('T')[0];
    console.log(`🔧 [SIMPLE-FOCUS] Ручной запуск анализа для даты: ${targetDate}`);
    runFocusAnalysisForDate(targetDate);
}

/**
 * Включение/выключение автоматического анализа
 */
function toggleFocusIntegration(enabled = null) {
    if (enabled !== null) {
        focusIntegrationState.isEnabled = enabled;
    } else {
        focusIntegrationState.isEnabled = !focusIntegrationState.isEnabled;
    }
    
    console.log(`🔧 [SIMPLE-FOCUS] Автоматический анализ фокуса: ${focusIntegrationState.isEnabled ? 'ВКЛЮЧЕН' : 'ВЫКЛЮЧЕН'}`);
    return focusIntegrationState.isEnabled;
}

// Экспортируем функции для отладки
window.manualAnalyzeFocus = manualAnalyzeFocus;
window.toggleFocusIntegration = toggleFocusIntegration;
window.focusIntegrationState = focusIntegrationState;

// Автоматическая инициализация при загрузке DOM
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(initSimpleFocusIntegration, 1000);
});

console.log('✅ [SIMPLE-FOCUS] Простая интеграция анализа фокуса загружена'); 