/**
 * SmartChronologyFix v2.0.4
 * Модуль группировки хронологии по временным периодам
 * Автор: AI Assistant
 * Дата: 2024
 * Назначение: Группировка событий по периодам: Утро (7-12), День (12-18), Вечер (18-24), Ночь (0-7)
 * 
 * v2.0.1 - Исправлено отображение времени окончания событий в маленьких спойлерах
 * v2.0.2 - Исправлен расчет времени, убраны эмоджи, исправлены временные периоды
 * v2.0.3 - Исправлен расчет времени событий и корректное отображение продолжительности
 * v2.0.4 - Добавлено детальное логирование для отладки проблем с временем
 */

console.log('[SmartChronologyFix] v2.0.4 загружается...');

// Определение временных периодов
const TIME_PERIODS = {
    morning: {
        name: 'Утро',
        start: 7,
        end: 12,
        icon: '▲',
        color: '#FFE4B5'
    },
    day: {
        name: 'День', 
        start: 12,
        end: 18,
        icon: '●',
        color: '#87CEEB'
    },
    evening: {
        name: 'Вечер',
        start: 18,
        end: 24,
        icon: '▼',
        color: '#DDA0DD'
    },
    night: {
        name: 'Ночь',
        start: 0,
        end: 7,
        icon: '■',
        color: '#2F2F4F'
    }
};

// Вспомогательные функции
function getTimePeriod(timestamp) {
    const date = new Date(timestamp);
    const hour = date.getHours();
    
    if (hour >= 7 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 18) return 'day';
    if (hour >= 18 && hour < 24) return 'evening';
    return 'night';
}

function formatTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('ru-RU', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
}

function formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
        return `${hours}ч ${minutes}м`;
    } else if (minutes > 0) {
        return `${minutes}м ${secs}с`;
    } else {
        return `${secs}с`;
    }
}

// Функция группировки событий по периодам
function groupEventsByTimePeriods(events) {
    console.log('[SmartChronologyFix] Группировка событий по периодам...');
    console.log('[SmartChronologyFix] DEBUG: Получено событий для группировки:', events.length);
    
    // Логируем первые несколько событий для отладки
    if (events.length > 0) {
        console.log('[SmartChronologyFix] DEBUG: Пример первого события:', events[0]);
        if (events.length > 1) {
            console.log('[SmartChronologyFix] DEBUG: Пример второго события:', events[1]);
        }
    }
    
    // Сортируем события по времени (по возрастанию)
    const sortedEvents = events.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    
    // Инициализируем группы периодов
    const periodGroups = {};
    Object.keys(TIME_PERIODS).forEach(periodKey => {
        periodGroups[periodKey] = {
            period: TIME_PERIODS[periodKey],
            events: [],
            totalDurationSec: 0,
            apps: {}
        };
    });
    
    let totalProcessedDuration = 0;
    let problematicEvents = 0;
    
    // Группируем события
    sortedEvents.forEach((event, index) => {
        const periodKey = getTimePeriod(event.timestamp);
        const group = periodGroups[periodKey];
        
        // Детальное логирование для каждого события
        if (index < 5) { // Логируем первые 5 событий подробно
            console.log(`[SmartChronologyFix] DEBUG: Событие ${index + 1}:`, {
                timestamp: event.timestamp,
                app_name: event.app_name || event.application_name,
                duration: event.duration,
                period: periodKey,
                parsedTime: new Date(event.timestamp).toLocaleString('ru-RU')
            });
        }
        
        group.events.push(event);
        
        // Правильный расчет продолжительности
        let eventDurationSec = 0;
        if (event.duration !== undefined && event.duration !== null) {
            const originalDuration = event.duration;
            eventDurationSec = typeof event.duration === 'number' ? event.duration : parseFloat(event.duration) || 0;
            
            // Логика определения единиц измерения duration
            if (eventDurationSec === 0) {
                eventDurationSec = 60; // по умолчанию 60 секунд
            } else if (eventDurationSec < 60) {
                // Вероятно это минуты, конвертируем в секунды
                eventDurationSec = eventDurationSec * 60;
            } else if (eventDurationSec > 86400) {
                // Слишком большое значение (больше суток), вероятно ошибка
                console.warn(`[SmartChronologyFix] WARN: Аномально большая продолжительность события: ${originalDuration}, ограничиваем до 1 часа`);
                eventDurationSec = 3600; // 1 час
                problematicEvents++;
            }
            // Если значение в разумных пределах (60-86400), оставляем как есть
            
            if (index < 5) {
                console.log(`[SmartChronologyFix] DEBUG: Продолжительность события ${index + 1}: ${originalDuration} -> ${eventDurationSec} сек (${Math.round(eventDurationSec / 60)} мин)`);
            }
        } else {
            eventDurationSec = 60; // по умолчанию 60 секунд
            if (index < 5) {
                console.log(`[SmartChronologyFix] DEBUG: Продолжительность события ${index + 1}: не указана, используем 60 сек`);
            }
        }
        
        group.totalDurationSec += eventDurationSec;
        totalProcessedDuration += eventDurationSec;
        
        // Группировка по приложениям
        const appName = event.app_name || event.application_name || event.title || 'Неизвестное приложение';
        if (!group.apps[appName]) {
            group.apps[appName] = {
                events: [],
                totalDurationSec: 0
            };
        }
        group.apps[appName].events.push(event);
        group.apps[appName].totalDurationSec += eventDurationSec;
    });
    
    // Итоговая статистика
    const totalMinutes = Math.round(totalProcessedDuration / 60);
    const totalHours = Math.round(totalMinutes / 60 * 10) / 10;
    
    console.log(`[SmartChronologyFix] DEBUG: Обработано событий: ${sortedEvents.length}`);
    console.log(`[SmartChronologyFix] DEBUG: Общая продолжительность: ${totalMinutes} мин (${totalHours} часов)`);
    console.log(`[SmartChronologyFix] DEBUG: Проблемных событий: ${problematicEvents}`);
    
    // Логируем статистику по периодам
    Object.keys(periodGroups).forEach(periodKey => {
        const group = periodGroups[periodKey];
        if (group.events.length > 0) {
            const periodMinutes = Math.round(group.totalDurationSec / 60);
            console.log(`[SmartChronologyFix] DEBUG: ${group.period.name}: ${group.events.length} событий, ${periodMinutes} мин`);
        }
    });

    return periodGroups;
}

console.log('[SmartChronologyFix] Функция группировки добавлена');

console.log('[SmartChronologyFix] Базовые функции определены');

// Глобальные функции для управления интерфейсом
window.toggleTimePeriod = function(periodKey) {
    const content = document.getElementById(`period-${periodKey}-content`);
    const arrow = document.getElementById(`period-${periodKey}-arrow`);
    
    if (content && arrow) {
        if (content.style.display === 'none') {
            content.style.display = 'block';
            arrow.textContent = '▼';
        } else {
            content.style.display = 'none';
            arrow.textContent = '▶';
        }
    }
};

window.toggleAppGroup = function(periodKey, appName) {
    const appId = `${periodKey}-${appName.replace(/[^a-zA-Z0-9]/g, '')}`;
    const content = document.getElementById(`app-${appId}-content`);
    const arrow = document.getElementById(`app-${appId}-arrow`);
    
    if (content && arrow) {
        if (content.style.display === 'none') {
            content.style.display = 'block';
            arrow.textContent = '▼';
        } else {
            content.style.display = 'none';
            arrow.textContent = '▶';
        }
    }
};

window.showMoreEvents = function(periodKey, appName) {
    const appId = `${periodKey}-${appName.replace(/[^a-zA-Z0-9]/g, '')}`;
    const hiddenEvents = document.getElementById(`app-${appId}-hidden`);
    const showMoreBtn = document.getElementById(`app-${appId}-more`);
    
    if (hiddenEvents && showMoreBtn) {
        hiddenEvents.style.display = 'block';
        showMoreBtn.style.display = 'none';
    }
};

console.log('[SmartChronologyFix] Функции управления интерфейсом добавлены');

// Функция создания HTML для периодов (БЕЗ анализа продуктивности)
function createTimePeriodsHTML(periodGroups) {
    console.log('[SmartChronologyFix] Создание HTML для периодов...');
    
    let html = '<tbody>';
    
    // Обрабатываем периоды в правильном порядке
    const periodOrder = ['night', 'morning', 'day', 'evening'];
    
    periodOrder.forEach(periodKey => {
        const group = periodGroups[periodKey];
        if (group.events.length === 0) return;
        
        const period = group.period;
        const eventCount = group.events.length;
        // Корректный расчет времени в минутах
        const durationMinutes = Math.round(group.totalDurationSec / 60);
        
        html += `
            <tr>
                <td colspan="4" style="background-color: ${period.color}; padding: 12px; cursor: pointer; border-radius: 6px; border: 2px solid rgba(0,0,0,0.1);" 
                    onclick="toggleTimePeriod('${periodKey}')">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div style="font-weight: bold; font-size: 16px;">
                            <span id="period-${periodKey}-arrow" style="margin-right: 8px;">▼</span>
                            ${period.icon} ${period.name} 
                            <span style="margin-left: 10px; font-size: 14px;">(${eventCount} событий, ${durationMinutes} мин)</span>
                        </div>
                        <div style="font-size: 14px; color: #666;">
                            ${period.start}:00 - ${period.end}:00
                        </div>
                    </div>
                </td>
            </tr>
            <tr id="period-${periodKey}-content" style="display: none;">
                <td colspan="4" style="padding: 0;">
                    ${createPeriodEventsHTML(group, periodKey)}
                </td>
            </tr>
        `;
    });
    
    html += '</tbody>';
    
    console.log('[SmartChronologyFix] HTML создан для', Object.keys(periodGroups).filter(k => periodGroups[k].events.length > 0).length, 'периодов');
    return html;
}

function createPeriodEventsHTML(group, periodKey) {
    let html = '<table style="width: 100%; border-collapse: collapse; margin-left: 20px;">';
    
    // Группируем по приложениям и сортируем по времени использования
    const sortedApps = Object.entries(group.apps)
        .sort((a, b) => b[1].totalDurationSec - a[1].totalDurationSec);
    
    sortedApps.forEach(([appName, appData]) => {
        const appDurationMinutes = Math.round(appData.totalDurationSec / 60);
        const visibleEvents = appData.events.slice(0, 3);
        const hiddenEventsCount = appData.events.length - visibleEvents.length;
        
        // Заголовок приложения
        html += `
            <tr style="background-color: rgba(0,0,0,0.05);">
                <td colspan="4" style="padding: 8px; font-weight: bold; border-top: 1px solid #ddd;">
                    [APP] ${appName} (${appData.events.length} событий, ${appDurationMinutes} мин)
                </td>
            </tr>
        `;
        
        // Отображаем события приложения
        visibleEvents.forEach(event => {
            const eventTime = new Date(event.timestamp).toLocaleTimeString('ru-RU', { 
                hour: '2-digit', 
                minute: '2-digit', 
                second: '2-digit' 
            });
            
            // Вычисляем время окончания события
            let eventDurationSec = 60; // по умолчанию
            if (event.duration) {
                eventDurationSec = typeof event.duration === 'number' ? event.duration : parseInt(event.duration) || 60;
                if (eventDurationSec <= 60 && eventDurationSec > 0) {
                    eventDurationSec = eventDurationSec * 60; // конвертируем минуты в секунды
                }
            }
            
            const endTime = new Date(new Date(event.timestamp).getTime() + eventDurationSec * 1000);
            const endTimeStr = endTime.toLocaleTimeString('ru-RU', { 
                hour: '2-digit', 
                minute: '2-digit', 
                second: '2-digit' 
            });
            
            const eventDurationMinutes = Math.round(eventDurationSec / 60);
            const timeDisplay = `${eventTime} - ${endTimeStr}`;
            
            html += `
                <tr>
                    <td style="padding: 4px 8px; width: 150px; font-size: 12px; border-bottom: 1px solid #eee;">
                        ${timeDisplay}
                    </td>
                    <td style="padding: 4px 8px; font-size: 12px; border-bottom: 1px solid #eee;">
                        ${event.window_title || event.title || 'Без названия'}
                    </td>
                    <td style="padding: 4px 8px; width: 80px; text-align: center; font-size: 12px; border-bottom: 1px solid #eee;">
                        ${eventDurationMinutes} мин
                    </td>
                    <td style="padding: 4px 8px; width: 80px; text-align: center; font-size: 12px; border-bottom: 1px solid #eee;">
                        ${event.is_productive ? '✓' : '✗'}
                    </td>
                </tr>
            `;
        });
        
        // Показываем скрытые события, если есть
        if (hiddenEventsCount > 0) {
            html += `
                <tr>
                    <td colspan="4" style="padding: 4px 8px; font-size: 11px; color: #666; text-align: center; cursor: pointer; border-bottom: 1px solid #eee;"
                        onclick="showMoreEvents('${periodKey}', '${appName}')">
                        ... ещё ${hiddenEventsCount} событий (нажмите для просмотра)
                    </td>
                </tr>
            `;
            
            // Скрытые события
            const hiddenEvents = appData.events.slice(3);
            hiddenEvents.forEach(event => {
                const eventTime = new Date(event.timestamp).toLocaleTimeString('ru-RU', { 
                    hour: '2-digit', 
                    minute: '2-digit', 
                    second: '2-digit' 
                });
                
                // Вычисляем время окончания события
                let eventDurationSec = 60;
                if (event.duration) {
                    eventDurationSec = typeof event.duration === 'number' ? event.duration : parseInt(event.duration) || 60;
                    if (eventDurationSec <= 60 && eventDurationSec > 0) {
                        eventDurationSec = eventDurationSec * 60;
                    }
                }
                
                const endTime = new Date(new Date(event.timestamp).getTime() + eventDurationSec * 1000);
                const endTimeStr = endTime.toLocaleTimeString('ru-RU', { 
                    hour: '2-digit', 
                    minute: '2-digit', 
                    second: '2-digit' 
                });
                
                const eventDurationMinutes = Math.round(eventDurationSec / 60);
                const timeDisplay = `${eventTime} - ${endTimeStr}`;
                
                html += `
                    <tr class="hidden-event-${periodKey}-${appName}" style="display: none;">
                        <td style="padding: 4px 8px; width: 150px; font-size: 12px; border-bottom: 1px solid #eee;">
                            ${timeDisplay}
                        </td>
                        <td style="padding: 4px 8px; font-size: 12px; border-bottom: 1px solid #eee;">
                            ${event.window_title || event.title || 'Без названия'}
                        </td>
                        <td style="padding: 4px 8px; width: 80px; text-align: center; font-size: 12px; border-bottom: 1px solid #eee;">
                            ${eventDurationMinutes} мин
                        </td>
                        <td style="padding: 4px 8px; width: 80px; text-align: center; font-size: 12px; border-bottom: 1px solid #eee;">
                            ${event.is_productive ? '✓' : '✗'}
                        </td>
                    </tr>
                `;
            });
        }
    });
    
    html += '</table>';
    return html;
}

console.log('[SmartChronologyFix] Функция создания HTML добавлена');

// Новая функция updateChronologyTable с группировкой по периодам
function createNewUpdateChronologyTable() {
    return function(events) {
        console.log('[SmartChronologyFix] Обновление хронологии с группировкой по периодам');
        console.log('[SmartChronologyFix] Получено событий:', events ? events.length : 0);
        
        // Детальное логирование входных данных
        if (events && events.length > 0) {
            console.log('[SmartChronologyFix] DEBUG: Тип входных данных:', typeof events);
            console.log('[SmartChronologyFix] DEBUG: Структура первого события:', Object.keys(events[0]));
            
            // Анализируем временные метки
            const firstTimestamp = events[0].timestamp;
            const lastTimestamp = events[events.length - 1].timestamp;
            console.log('[SmartChronologyFix] DEBUG: Первое событие:', firstTimestamp, '→', new Date(firstTimestamp).toLocaleString('ru-RU'));
            console.log('[SmartChronologyFix] DEBUG: Последнее событие:', lastTimestamp, '→', new Date(lastTimestamp).toLocaleString('ru-RU'));
        }
        
        const chronologyTable = document.getElementById('chronology-table');
        if (!chronologyTable) {
            console.error('[SmartChronologyFix] Элемент chronology-table не найден');
            return;
        }
        
        if (!events || events.length === 0) {
            chronologyTable.innerHTML = `
                <thead>
                    <tr>
                        <th>Время</th>
                        <th>Приложение</th>
                        <th>Активность</th>
                        <th>Длительность</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td colspan="4" style="text-align: center; padding: 20px; color: #666;">
                            Нет данных для отображения
                        </td>
                    </tr>
                </tbody>
            `;
            return;
        }
        
        // Группируем события по временным периодам
        const periodGroups = groupEventsByTimePeriods(events);
        
        // Проверяем есть ли данные в периодах
        const hasData = Object.values(periodGroups).some(group => group.events.length > 0);
        
        if (!hasData) {
            chronologyTable.innerHTML = `
                <thead>
                    <tr>
                        <th>Время</th>
                        <th>Приложение</th>
                        <th>Активность</th>
                        <th>Длительность</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td colspan="4" style="text-align: center; padding: 20px; color: #666;">
                            Нет активности в определенных периодах
                        </td>
                    </tr>
                </tbody>
            `;
            return;
        }
        
        // Создаем HTML для отображения
        const tableBody = createTimePeriodsHTML(periodGroups);
        
        // Обновляем таблицу с заголовком
        chronologyTable.innerHTML = `
            <thead>
                <tr>
                    <th>Время</th>
                    <th>Приложение</th>
                    <th>Активность</th>
                    <th>Длительность</th>
                </tr>
            </thead>
            ${tableBody}
        `;
        
        // Показываем статистику
        const totalEvents = events.length;
        const periodsWithEvents = Object.keys(periodGroups).filter(key => periodGroups[key].events.length > 0);
        console.log(`[SmartChronologyFix] Отображено: ${totalEvents} событий в ${periodsWithEvents.length} периодах`);
        
        // Логируем периоды с данными
        periodsWithEvents.forEach(periodKey => {
            const group = periodGroups[periodKey];
            const appCount = Object.keys(group.apps).length;
            console.log(`  ${group.period.icon} ${group.period.name}: ${group.events.length} событий, ${appCount} приложений`);
        });
    };
}

// Инициализация модуля
(function() {
    console.log('[SmartChronologyFix] Инициализация v2.0.4...');
    
    // Ждем загрузки DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeModule);
    } else {
        initializeModule();
    }
    
    function initializeModule() {
        console.log('[SmartChronologyFix] DOM готов, запуск инициализации...');
        
        // Сохраняем оригинальную функцию
        if (typeof window.updateChronologyTable === 'function') {
            window.originalUpdateChronologyTable = window.updateChronologyTable;
            console.log('[SmartChronologyFix] Оригинальная функция сохранена');
        }
        
        // Заменяем функцию на нашу
        window.updateChronologyTable = createNewUpdateChronologyTable();
        console.log('[SmartChronologyFix] Функция updateChronologyTable заменена');
        
        // Добавляем функцию для тестирования
        window.testChronologyPeriods = function() {
            console.log('[SmartChronologyFix] Тестирование группировки по периодам');
            const testEvents = [
                { timestamp: '2024-01-01T08:30:00', app_name: 'Visual Studio Code', window_title: 'Разработка проекта', duration: 60 },
                { timestamp: '2024-01-01T14:15:00', app_name: 'Google Chrome', window_title: 'Исследование технологий', duration: 30 },
                { timestamp: '2024-01-01T17:00:24', app_name: 'Test App', window_title: 'Тестовое событие в 17:00', duration: 15 },
                { timestamp: '2024-01-01T20:45:00', app_name: 'YouTube', window_title: 'Обучающие видео', duration: 40 },
                { timestamp: '2024-01-01T02:30:00', app_name: 'Terminal', window_title: 'Настройка системы', duration: 15 }
            ];
            
            console.log('[SmartChronologyFix] Тестируем с', testEvents.length, 'событиями');
            window.updateChronologyTable(testEvents);
        };
        
        console.log('[SmartChronologyFix] v2.0.4 успешно инициализирован!');
        console.log('[SmartChronologyFix] Возможности:');
        console.log('  ▲ Группировка по периодам: Утро, День, Вечер, Ночь');
        console.log('  [APP] Группировка по приложениям внутри периодов');
        console.log('  ▼ Интерактивные спойлеры для удобного просмотра');
        console.log('  [STAT] Статистика времени без анализа продуктивности');
        console.log('  [TIME] Исправлено отображение времени начала и окончания событий');
        console.log('  [DEBUG] Добавлено детальное логирование для отладки');
        console.log('  [TEST] Тестирование: window.testChronologyPeriods()');
    }
})();

console.log('[SmartChronologyFix] v2.0.4 модуль загружен'); 