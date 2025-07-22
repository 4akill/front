/**
 * SmartChronologyFix v3.0.5
 * Модуль эффективной группировки активности окон по временным сегментам
 * Автор: AI Assistant
 * Дата: 2024
 * Назначение: Группировка window_activity по сегментам: Утро (7-12), День (12-18), Вечер (18-24)
 * 
 * v3.0.0 - ПОЛНАЯ ПЕРЕРАБОТКА: фокус на window_activity, эффективная группировка, агрегация данных
 * v3.0.1 - КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: правильный расчет времени от начала до конца активности
 * v3.0.2 - ДОБАВЛЕНА кнопка читаемой хронологии с временными интервалами
 * v3.0.3 - ИСПРАВЛЕНА читаемая хронология: добавлено отображение времени каждого события
 * v3.0.4 - ИНТЕЛЛЕКТУАЛЬНАЯ группировка: читаемая хронология как на втором скриншоте
 * v3.0.5 - ИСПРАВЛЕН расчет времени интервалов: 11:24 - 17:00 (5ч 36м)
 */

console.log('[SmartChronologyFix] v3.0.5 загружается - исправляем время интервалов...');

// Определение временных сегментов (упрощено)
const TIME_SEGMENTS = {
    morning: {
        name: 'Утро',
        start: 7,
        end: 12,
        icon: '🌅',
        color: '#FFE4B5'
    },
    day: {
        name: 'День', 
        start: 12,
        end: 18,
        icon: '☀️',
        color: '#87CEEB'
    },
    evening: {
        name: 'Вечер',
        start: 18,
        end: 24,
        icon: '🌆',
        color: '#DDA0DD'
    }
};

// Класс для агрегации активности
class WindowActivityAggregator {
    constructor() {
        this.sessionCache = new Map();
        this.debugging = true;
    }

    log(message, data = null) {
        if (this.debugging) {
            console.log(`[ActivityAggregator] ${message}`, data || '');
        }
    }

    // Определение сегмента по времени
    getTimeSegment(timestamp) {
        const date = new Date(timestamp);
        const hour = date.getHours();
        
        if (hour >= 7 && hour < 12) return 'morning';
        if (hour >= 12 && hour < 18) return 'day';
        if (hour >= 18 && hour < 24) return 'evening';
        
        // Ночные часы игнорируем для активности окон
        return null;
    }

    // Фильтрация только window_activity
    filterWindowActivity(events) {
        const filtered = events.filter(event => {
            // Проверяем разные возможные поля для типа активности
            const activityType = event.activity_type || event.type || '';
            const isWindowActivity = activityType === 'window_activity' || 
                                   event.window_title || 
                                   event.app_name;
            
            return isWindowActivity && this.getTimeSegment(event.timestamp);
        });
        
        this.log(`Отфильтровано window_activity: ${filtered.length} из ${events.length}`);
        return filtered;
    }

    // ИСПРАВЛЕННАЯ группировка похожих событий
    groupSimilarEvents(events) {
        if (events.length === 0) return [];
        
        // Сортируем по времени
        const sorted = [...events].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        const groups = [];
        let currentGroup = [sorted[0]];
        
        for (let i = 1; i < sorted.length; i++) {
            const current = sorted[i];
            const lastInGroup = currentGroup[currentGroup.length - 1];
            
            const timeDiff = (new Date(current.timestamp) - new Date(lastInGroup.timestamp)) / (1000 * 60); // минуты
            const sameApp = (current.app_name || '') === (lastInGroup.app_name || '');
            
            // Если разница меньше 5 минут и то же приложение - добавляем в группу
            if (timeDiff <= 5 && sameApp) {
                currentGroup.push(current);
            } else {
                // Сохраняем текущую группу и начинаем новую
                groups.push(this.createEventGroup(currentGroup));
                currentGroup = [current];
            }
        }
        
        // Добавляем последнюю группу
        groups.push(this.createEventGroup(currentGroup));
        
        this.log(`Создано групп: ${groups.length} из ${events.length} событий`);
        return groups;
    }

    // ИСПРАВЛЕННОЕ создание группы событий
    createEventGroup(events) {
        if (events.length === 0) return null;
        
        const firstEvent = events[0];
        const lastEvent = events[events.length - 1];
        
        const startTime = new Date(firstEvent.timestamp);
        const endTime = new Date(lastEvent.timestamp);
        
        // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: правильный расчет продолжительности
        // Если события в группе идут подряд, считаем время от первого до последнего
        // Если это одно событие, даем ему минимум 1 минуту
        let durationMin;
        if (events.length === 1) {
            durationMin = 1; // Минимум 1 минута для одного события
        } else {
            const durationMs = endTime - startTime;
            durationMin = Math.max(1, Math.round(durationMs / (1000 * 60)));
        }
        
        return {
            id: `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            app_name: firstEvent.app_name || 'Неизвестное приложение',
            window_title: firstEvent.window_title || 'Без названия',
            start_time: startTime,
            end_time: endTime,
            duration_min: durationMin,
            events_count: events.length,
            events: events,
            is_group: events.length > 1
        };
    }

    // ИСПРАВЛЕННАЯ агрегация по временным сегментам
    aggregateByTimeSegments(windowEvents) {
        this.log('Начинаем агрегацию по временным сегментам...');
        
        const segments = {};
        
        // Инициализируем сегменты
        Object.keys(TIME_SEGMENTS).forEach(segmentKey => {
            segments[segmentKey] = {
                segment: TIME_SEGMENTS[segmentKey],
                events: [],
                groups: [],
                total_duration_min: 0,
                apps_count: 0,
                time_range: null
            };
        });

        // Распределяем события по сегментам
        windowEvents.forEach(event => {
            const segmentKey = this.getTimeSegment(event.timestamp);
            if (segmentKey && segments[segmentKey]) {
                segments[segmentKey].events.push(event);
            }
        });

        // Группируем события в каждом сегменте
        Object.keys(segments).forEach(segmentKey => {
            const segment = segments[segmentKey];
            if (segment.events.length > 0) {
                segment.groups = this.groupSimilarEvents(segment.events);
                
                // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: правильный расчет времени сегмента
                // Считаем время от первого до последнего события в сегменте
                const sortedEvents = segment.events.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
                const firstEvent = new Date(sortedEvents[0].timestamp);
                const lastEvent = new Date(sortedEvents[sortedEvents.length - 1].timestamp);
                
                const segmentDurationMs = lastEvent - firstEvent;
                segment.total_duration_min = Math.max(1, Math.round(segmentDurationMs / (1000 * 60)));
                segment.time_range = {
                    start: firstEvent,
                    end: lastEvent
                };
                
                const uniqueApps = new Set(segment.groups.map(g => g.app_name));
                segment.apps_count = uniqueApps.size;
                
                this.log(`Сегмент ${segment.segment.name}:`, {
                    events: segment.events.length,
                    groups: segment.groups.length,
                    duration_calculated: segment.total_duration_min,
                    time_range: `${firstEvent.toLocaleTimeString('ru-RU')} - ${lastEvent.toLocaleTimeString('ru-RU')}`,
                    apps: segment.apps_count
                });
            }
        });

        return segments;
    }

    // Основная функция обработки
    processWindowActivity(allEvents) {
        this.log('Обработка активности окон...', { total_events: allEvents.length });
        
        // 1. Фильтруем только window_activity
        const windowEvents = this.filterWindowActivity(allEvents);
        
        if (windowEvents.length === 0) {
            this.log('Нет событий window_activity для обработки');
            return {
                segments: {},
                summary: {
                    total_events: 0,
                    total_duration_min: 0,
                    time_range: null
                }
            };
        }

        // 2. Агрегируем по временным сегментам
        const segments = this.aggregateByTimeSegments(windowEvents);
        
        // 3. ИСПРАВЛЕННАЯ общая сводка
        // Считаем общее время от самого раннего до самого позднего события
        const allTimes = windowEvents.map(e => new Date(e.timestamp)).sort((a, b) => a - b);
        const totalDurationMs = allTimes[allTimes.length - 1] - allTimes[0];
        const totalDurationMin = Math.round(totalDurationMs / (1000 * 60));
        
        const summary = {
            total_events: windowEvents.length,
            total_duration_min: totalDurationMin,
            time_range: allTimes.length > 0 ? {
                start: allTimes[0],
                end: allTimes[allTimes.length - 1]
            } : null
        };

        this.log('Обработка завершена:', {
            total_events: summary.total_events,
            total_duration_calculated: summary.total_duration_min,
            time_span: summary.time_range ? 
                `${summary.time_range.start.toLocaleTimeString('ru-RU')} - ${summary.time_range.end.toLocaleTimeString('ru-RU')}` : 
                'нет данных'
        });
        
        return { segments, summary };
    }
}

// Новый класс для создания читаемой хронологии
class ReadableChronologyBuilder {
    constructor() {
        this.debugging = true;
        this.currentEvents = [];
    }

    log(message, data = null) {
        if (this.debugging) {
            console.log(`[ReadableChronology] ${message}`, data || '');
        }
    }

    // Сохраняем текущие события для использования в читаемой хронологии
    setEvents(events) {
        this.currentEvents = events || [];
        this.log('События сохранены для читаемой хронологии:', this.currentEvents.length);
    }

    // ПОЛНОСТЬЮ ПЕРЕДЕЛАННАЯ группировка событий по временным интервалам (как на втором скриншоте)
    groupByTimeIntervals(events) {
        if (!events || events.length === 0) return [];

        // Сортируем события по времени
        const sortedEvents = [...events].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        
        const intervals = [];
        let currentInterval = null;
        const maxGapMinutes = 10; // Разрыв для создания нового интервала

        sortedEvents.forEach(event => {
            const eventTime = new Date(event.timestamp);
            
            // Если это первое событие или разрыв больше 10 минут - создаем новый интервал
            if (!currentInterval || 
                (eventTime - currentInterval.endTime) > (maxGapMinutes * 60 * 1000)) {
                
                if (currentInterval) {
                    // Финализируем предыдущий интервал
                    this.finalizeInterval(currentInterval);
                    intervals.push(currentInterval);
                }
                
                currentInterval = {
                    startTime: eventTime,
                    endTime: eventTime,
                    events: [],
                    applications: new Map() // Группировка по приложениям
                };
            }

            // Расширяем текущий интервал
            currentInterval.endTime = eventTime;
            currentInterval.events.push(event);

            // Группируем по приложениям ВНУТРИ интервала
            const appName = event.app_name || 'Неизвестное приложение';
            
            if (!currentInterval.applications.has(appName)) {
                currentInterval.applications.set(appName, {
                    events: [],
                    firstTime: eventTime,
                    lastTime: eventTime,
                    totalDuration: 0,
                    significantWindows: new Map() // Для группировки значимых окон
                });
            }
            
            const appData = currentInterval.applications.get(appName);
            appData.events.push(event);
            appData.lastTime = eventTime;
            
            // Группируем значимые окна (не каждое событие отдельно)
            const windowKey = this.getSignificantWindowKey(event);
            if (!appData.significantWindows.has(windowKey)) {
                appData.significantWindows.set(windowKey, {
                    title: event.window_title || 'Без названия',
                    events: [],
                    firstTime: eventTime,
                    lastTime: eventTime
                });
            }
            
            const windowData = appData.significantWindows.get(windowKey);
            windowData.events.push(event);
            windowData.lastTime = eventTime;
        });

        // Финализируем последний интервал
        if (currentInterval) {
            this.finalizeInterval(currentInterval);
            intervals.push(currentInterval);
        }

        this.log('Создано читаемых интервалов:', intervals.length);
        return intervals;
    }

    // Получение ключа для группировки значимых окон (избегаем дублирования)
    getSignificantWindowKey(event) {
        const title = event.window_title || 'Без названия';
        
        // Убираем технические детали и группируем похожие окна
        const cleanTitle = title
            .replace(/\s*—\s*.*$/, '') // Убираем " — Mozilla Firefox" и подобное
            .replace(/\s*-\s*.*$/, '')  // Убираем " - Google Chrome" и подобное
            .replace(/^\[.*?\]\s*/, '') // Убираем "[Administrator]" и подобное
            .trim();
            
        return cleanTitle || title;
    }

    // Финализация интервала - подсчет времени приложений
    finalizeInterval(interval) {
        interval.applications.forEach((appData, appName) => {
            // Считаем время приложения в интервале
            if (appData.events.length === 1) {
                appData.totalDuration = 60; // Минимум 1 минута для одного события
            } else {
                const durationMs = appData.lastTime - appData.firstTime;
                appData.totalDuration = Math.max(60, Math.round(durationMs / 1000)); // В секундах, минимум 1 минута
            }
            
            // Финализируем значимые окна
            appData.significantWindows.forEach((windowData, windowKey) => {
                if (windowData.events.length === 1) {
                    windowData.duration = 30; // 30 секунд для одного события
                } else {
                    const durationMs = windowData.lastTime - windowData.firstTime;
                    windowData.duration = Math.max(10, Math.round(durationMs / 1000)); // В секундах
                }
            });
        });
    }

    // НОВОЕ создание HTML для читаемой хронологии (как на втором скриншоте)
    createReadableHTML(intervals) {
        if (!intervals || intervals.length === 0) {
            return `
                <thead>
                    <tr>
                        <th>Время</th>
                        <th>Приложение</th>
                        <th>Длительность</th>
                        <th>Тип</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td colspan="4" style="text-align: center; padding: 20px; color: #666;">
                            Нет данных для формирования читаемой хронологии
                        </td>
                    </tr>
                </tbody>
            `;
        }

        let html = `
            <thead>
                <tr>
                    <th>Время</th>
                    <th>Приложение</th>
                    <th>Длительность</th>
                    <th>Тип</th>
                </tr>
            </thead>
            <tbody>
        `;

        intervals.forEach((interval, index) => {
            const startTime = this.formatTime(interval.startTime);
            const endTime = this.formatTime(interval.endTime);
            const intervalDurationMin = Math.round((interval.endTime - interval.startTime) / (1000 * 60));
            
            // ИСПРАВЛЕНИЕ: правильное форматирование времени интервала
            let timeRange;
            if (intervalDurationMin >= 60) {
                const hours = Math.floor(intervalDurationMin / 60);
                const mins = intervalDurationMin % 60;
                if (mins === 0) {
                    timeRange = `${startTime} - ${endTime} (${hours}ч)`;
                } else {
                    timeRange = `${startTime} - ${endTime} (${hours}ч ${mins}м)`;
                }
            } else {
                timeRange = `${startTime} - ${endTime} (${intervalDurationMin} мин)`;
            }

            // Заголовок интервала (как на втором скриншоте)
            html += `
                <tr style="background-color: #e8f4fd; font-weight: bold;">
                    <td style="padding: 8px;">${timeRange}</td>
                    <td style="padding: 8px;">📊 Период активности</td>
                    <td style="padding: 8px; text-align: center;">${interval.events.length} событий</td>
                    <td style="padding: 8px; text-align: center;">⚡</td>
                </tr>
            `;

            // Сортируем приложения по времени использования (больше времени = выше)
            const sortedApps = Array.from(interval.applications.entries())
                .sort((a, b) => b[1].totalDuration - a[1].totalDuration);

            sortedApps.forEach(([appName, appData]) => {
                const appDurationStr = this.formatDurationFromSeconds(appData.totalDuration);
                
                // Строка приложения (как на втором скриншоте)
                html += `
                    <tr>
                        <td style="padding: 4px 8px 4px 24px; font-size: 14px; border-bottom: 1px solid #f0f0f0;">
                            (${appDurationStr})
                        </td>
                        <td style="padding: 4px 8px; font-size: 14px; font-weight: bold; border-bottom: 1px solid #f0f0f0;">
                            ${appName}
                        </td>
                        <td style="padding: 4px 8px; text-align: center; font-size: 14px; border-bottom: 1px solid #f0f0f0;">
                            ${appData.events.length} событий
                        </td>
                        <td style="padding: 4px 8px; text-align: center; font-size: 14px; border-bottom: 1px solid #f0f0f0;">
                            🖥️
                        </td>
                    </tr>
                `;

                // Показываем только значимые окна (не все события подряд)
                const significantWindows = Array.from(appData.significantWindows.entries())
                    .sort((a, b) => b[1].duration - a[1].duration)
                    .slice(0, 5); // Максимум 5 значимых окон

                significantWindows.forEach(([windowKey, windowData]) => {
                    const windowDurationStr = this.formatDurationFromSeconds(windowData.duration);
                    
                    html += `
                        <tr>
                            <td style="padding: 2px 8px 2px 48px; font-size: 12px; color: #666; border-bottom: 1px solid #f8f8f8;">
                                ${windowDurationStr}
                            </td>
                            <td style="padding: 2px 8px; font-size: 12px; color: #666; border-bottom: 1px solid #f8f8f8;">
                                ${windowData.title}
                            </td>
                            <td style="padding: 2px 8px; text-align: center; font-size: 12px; color: #666; border-bottom: 1px solid #f8f8f8;">
                                ${windowData.events.length} раз
                            </td>
                            <td style="padding: 2px 8px; text-align: center; font-size: 12px; color: #666; border-bottom: 1px solid #f8f8f8;">
                                📄
                            </td>
                        </tr>
                    `;
                });

                // Если окон больше 5, показываем общее количество
                if (appData.significantWindows.size > 5) {
                    const remainingCount = appData.significantWindows.size - 5;
                    html += `
                        <tr>
                            <td style="padding: 2px 8px 2px 48px; font-size: 11px; color: #999; font-style: italic;" colspan="4">
                                ... ещё ${remainingCount} окон
                            </td>
                        </tr>
                    `;
                }
            });
        });

        html += '</tbody>';
        this.log('HTML для читаемой хронологии создан (интеллектуальная группировка)');
        return html;
    }

    // Форматирование времени
    formatTime(date) {
        return date.toLocaleTimeString('ru-RU', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    // Форматирование длительности из секунд
    formatDurationFromSeconds(seconds) {
        if (seconds < 60) {
            return `${seconds} сек`;
        } else {
            const minutes = Math.round(seconds / 60);
            if (minutes < 60) {
                return `${minutes} мин`;
            } else {
                const hours = Math.floor(minutes / 60);
                const mins = minutes % 60;
                if (mins === 0) {
                    return `${hours} ч`;
                } else {
                    return `${hours} ч ${mins} мин`;
                }
            }
        }
    }

    // Основная функция создания читаемой хронологии
    buildReadableChronology() {
        this.log('Построение читаемой хронологии...');
        
        if (!this.currentEvents || this.currentEvents.length === 0) {
            this.log('Нет событий для построения хронологии');
            return this.createReadableHTML([]);
        }

        // Фильтруем только window_activity
        const windowEvents = this.currentEvents.filter(event => {
            const activityType = event.activity_type || event.type || '';
            return activityType === 'window_activity' || event.window_title || event.app_name;
        });

        this.log('Отфильтровано window_activity событий:', windowEvents.length);

        if (windowEvents.length === 0) {
            return this.createReadableHTML([]);
        }

        // Группируем по временным интервалам
        const intervals = this.groupByTimeIntervals(windowEvents);
        
        // Создаем HTML
        return this.createReadableHTML(intervals);
    }
}

// Класс для рендеринга HTML
class ActivityRenderer {
    constructor() {
        this.debugging = true;
        this.readableBuilder = new ReadableChronologyBuilder();
    }

    log(message, data = null) {
        if (this.debugging) {
            console.log(`[ActivityRenderer] ${message}`, data || '');
        }
    }

    formatTime(date) {
        return date.toLocaleTimeString('ru-RU', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    formatDuration(minutes) {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        
        if (hours > 0) {
            return `${hours}ч ${mins}м`;
        } else {
            return `${mins}м`;
        }
    }

    // Рендер группы событий
    renderEventGroup(group, segmentKey) {
        const startTime = this.formatTime(group.start_time);
        const endTime = this.formatTime(group.end_time);
        const timeRange = `${startTime} - ${endTime}`;
        const duration = this.formatDuration(group.duration_min);
        
        const groupId = `${segmentKey}_${group.id}`;
        const isGrouped = group.is_group ? ` (${group.events_count} событий)` : '';
        
        return `
            <tr class="activity-group">
                <td style="padding: 4px 8px; width: 120px; font-size: 12px; border-bottom: 1px solid #eee;">
                    ${timeRange}
                </td>
                <td style="padding: 4px 8px; font-size: 12px; border-bottom: 1px solid #eee;">
                    <strong>${group.app_name}</strong>${isGrouped}
                    <br><small style="color: #666;">${group.window_title}</small>
                </td>
                <td style="padding: 4px 8px; width: 80px; text-align: center; font-size: 12px; border-bottom: 1px solid #eee;">
                    ${duration}
                </td>
                <td style="padding: 4px 8px; width: 60px; text-align: center; font-size: 12px; border-bottom: 1px solid #eee;">
                    ${group.is_group ? '📁' : '📄'}
                </td>
            </tr>
        `;
    }

    // Рендер сегмента времени
    renderTimeSegment(segmentKey, segmentData) {
        if (segmentData.groups.length === 0) return '';
        
        const segment = segmentData.segment;
        const duration = this.formatDuration(segmentData.total_duration_min);
        const timeRange = segmentData.time_range ? 
            `${this.formatTime(segmentData.time_range.start)}-${this.formatTime(segmentData.time_range.end)}` :
            `${segment.start}:00-${segment.end}:00`;
        
        const headerStyle = `background-color: ${segment.color}; padding: 12px; cursor: pointer; border-radius: 6px; border: 2px solid rgba(0,0,0,0.1);`;
        
        const groupsHtml = segmentData.groups
            .map(group => this.renderEventGroup(group, segmentKey))
            .join('');
        
        return `
            <tr>
                <td colspan="4" style="${headerStyle}" onclick="toggleTimeSegment('${segmentKey}')">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div style="font-weight: bold; font-size: 16px;">
                            <span id="segment-${segmentKey}-arrow" style="margin-right: 8px;">▼</span>
                            ${segment.icon} ${segment.name}
                            <span style="margin-left: 10px; font-size: 14px;">
                                (${segmentData.groups.length} групп, ${duration})
                            </span>
                        </div>
                        <div style="font-size: 14px; color: #666;">
                            ${timeRange}
                        </div>
                    </div>
                </td>
            </tr>
            <tr id="segment-${segmentKey}-content" style="display: none;">
                <td colspan="4" style="padding: 0;">
                    <table style="width: 100%; border-collapse: collapse; margin-left: 20px;">
                        ${groupsHtml}
                    </table>
                </td>
            </tr>
        `;
    }

    // Основной рендер с добавлением кнопки
    renderActivityTable(processedData) {
        this.log('Рендер таблицы активности...');
        
        const { segments, summary } = processedData;
        
        if (summary.total_events === 0) {
            return `
                <thead>
                    <tr>
                        <th>Время</th>
                        <th>Приложение</th>
                        <th>Длительность</th>
                        <th>Тип</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td colspan="4" style="text-align: center; padding: 20px; color: #666;">
                            Нет активности окон для отображения
                        </td>
                    </tr>
                </tbody>
            `;
        }

        // Главный заголовок с ПРАВИЛЬНЫМ временем
        const startTime = summary.time_range ? this.formatTime(summary.time_range.start) : '';
        const endTime = summary.time_range ? this.formatTime(summary.time_range.end) : '';
        const totalDuration = this.formatDuration(summary.total_duration_min);
        
        const mainHeaderStyle = `background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px; text-align: center; font-weight: bold; font-size: 18px;`;
        
        // Кнопка для читаемой хронологии
        const buttonStyle = `
            background: linear-gradient(135deg, #28a745 0%, #20c997 100%); 
            color: white; 
            border: none; 
            padding: 8px 16px; 
            border-radius: 4px; 
            cursor: pointer; 
            font-size: 14px; 
            margin-top: 8px;
            transition: background 0.3s ease;
        `;
        
        const segmentOrder = ['morning', 'day', 'evening'];
        const segmentsHtml = segmentOrder
            .map(segmentKey => this.renderTimeSegment(segmentKey, segments[segmentKey]))
            .filter(html => html !== '')
            .join('');

        return `
            <thead>
                <tr>
                    <th>Время</th>
                    <th>Приложение</th>
                    <th>Длительность</th>
                    <th>Тип</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td colspan="4" style="${mainHeaderStyle}">
                        🖥️ Активность окон с ${startTime} до ${endTime} — ${totalDuration}
                        <br><small style="font-size: 14px; opacity: 0.9;">
                            ${summary.total_events} событий в группах
                        </small>
                        <br>
                        <button id="readable-chronology-btn" 
                                style="${buttonStyle}"
                                onclick="showReadableChronology()"
                                onmouseover="this.style.background='linear-gradient(135deg, #218838 0%, #1e7e34 100%)'"
                                onmouseout="this.style.background='linear-gradient(135deg, #28a745 0%, #20c997 100%)'">
                            📋 Читаемая хронология
                        </button>
                    </td>
                </tr>
                ${segmentsHtml}
            </tbody>
        `;
    }
}

// Глобальные функции для интерфейса
window.toggleTimeSegment = function(segmentKey) {
    const content = document.getElementById(`segment-${segmentKey}-content`);
    const arrow = document.getElementById(`segment-${segmentKey}-arrow`);
    
    if (content && arrow) {
        if (content.style.display === 'none') {
            content.style.display = '';
            arrow.textContent = '▼';
        } else {
            content.style.display = 'none';
            arrow.textContent = '▶';
        }
    }
};

// Глобальная функция для показа читаемой хронологии
window.showReadableChronology = function() {
    console.log('[SmartChronologyFix] Создание читаемой хронологии...');
    
    const chronologyTable = document.getElementById('chronology-table');
    if (!chronologyTable) {
        console.error('[SmartChronologyFix] Элемент chronology-table не найден');
        return;
    }
    
    // Получаем текущий экземпляр builder'а
    if (window.currentReadableBuilder) {
        const readableHTML = window.currentReadableBuilder.buildReadableChronology();
        
        // Добавляем кнопку "Назад" в читаемую хронологию
        const backButtonStyle = `
            background: linear-gradient(135deg, #6c757d 0%, #495057 100%); 
            color: white; 
            border: none; 
            padding: 8px 16px; 
            border-radius: 4px; 
            cursor: pointer; 
            font-size: 14px; 
            margin: 10px;
            transition: background 0.3s ease;
        `;
        
        const headerWithButton = readableHTML.replace(
            '<thead>',
            `<thead>
                <tr>
                    <td colspan="4" style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 15px; text-align: center; font-weight: bold; font-size: 18px;">
                        📋 Читаемая хронология активности окон
                        <br>
                        <button onclick="restoreOriginalView()" 
                                style="${backButtonStyle}"
                                onmouseover="this.style.background='linear-gradient(135deg, #5a6268 0%, #343a40 100%)'"
                                onmouseout="this.style.background='linear-gradient(135deg, #6c757d 0%, #495057 100%)'">
                            ← Назад к группировке
                        </button>
                    </td>
                </tr>
            </thead>`
        );
        
        chronologyTable.innerHTML = headerWithButton;
        console.log('[SmartChronologyFix] Читаемая хронология отображена');
    } else {
        console.error('[SmartChronologyFix] Builder для читаемой хронологии не найден');
    }
};

// Глобальная функция для возврата к оригинальному виду
window.restoreOriginalView = function() {
    console.log('[SmartChronologyFix] Возврат к оригинальному виду...');
    
    // Перезагружаем оригинальную таблицу
    if (window.currentEventsCache) {
        window.updateChronologyTable(window.currentEventsCache);
    }
};

// Основная функция обновления таблицы
function createNewUpdateChronologyTable() {
    const aggregator = new WindowActivityAggregator();
    const renderer = new ActivityRenderer();
    
    return function(events) {
        console.log('[SmartChronologyFix] v3.0.5 - Обновление таблицы активности');
        console.log('[SmartChronologyFix] Получено событий:', events ? events.length : 0);
        
        // Сохраняем события для читаемой хронологии
        window.currentEventsCache = events;
        window.currentReadableBuilder = renderer.readableBuilder;
        renderer.readableBuilder.setEvents(events);
        
        const chronologyTable = document.getElementById('chronology-table');
        if (!chronologyTable) {
            console.error('[SmartChronologyFix] Элемент chronology-table не найден');
            return;
        }
        
        if (!events || events.length === 0) {
            chronologyTable.innerHTML = renderer.renderActivityTable({
                segments: {},
                summary: { total_events: 0, total_duration_min: 0, time_range: null }
            });
            return;
        }
        
        // Обрабатываем данные
        const processedData = aggregator.processWindowActivity(events);
        
        // Рендерим таблицу
        const tableHtml = renderer.renderActivityTable(processedData);
        chronologyTable.innerHTML = tableHtml;
        
        console.log('[SmartChronologyFix] Таблица обновлена:', {
            segments: Object.keys(processedData.segments).filter(k => processedData.segments[k].groups.length > 0),
            total_groups: Object.values(processedData.segments).reduce((sum, s) => sum + s.groups.length, 0),
            total_duration: processedData.summary.total_duration_min
        });
    };
}

// Инициализация модуля
(function() {
    console.log('[SmartChronologyFix] Инициализация v3.0.5...');
    
    function initializeModule() {
        console.log('[SmartChronologyFix] DOM готов, запуск расширенной архитектуры...');
        
        // Сохраняем оригинальную функцию
        if (typeof window.updateChronologyTable === 'function') {
            window.originalUpdateChronologyTable = window.updateChronologyTable;
            console.log('[SmartChronologyFix] Оригинальная функция сохранена');
        }
        
        // Заменяем функцию на нашу новую
        window.updateChronologyTable = createNewUpdateChronologyTable();
        console.log('[SmartChronologyFix] Функция updateChronologyTable заменена на расширенную архитектуру');
        
        // Функция тестирования
        window.testWindowActivity = function() {
            console.log('[SmartChronologyFix] Тестирование расширенной группировки активности...');
            const testEvents = [
                { timestamp: '2024-06-30T11:24:00', activity_type: 'window_activity', app_name: 'Visual Studio Code', window_title: 'main.js' },
                { timestamp: '2024-06-30T11:30:00', activity_type: 'window_activity', app_name: 'Visual Studio Code', window_title: 'index.html' },
                { timestamp: '2024-06-30T14:27:30', activity_type: 'window_activity', app_name: 'notepad++.exe', window_title: 'ANALYSIS_FRONTEND_ARCHITECTURE.md' },
                { timestamp: '2024-06-30T15:01:36', activity_type: 'window_activity', app_name: 'PickerHost.exe', window_title: 'Открытие' },
                { timestamp: '2024-06-30T17:00:00', activity_type: 'window_activity', app_name: 'Google Chrome', window_title: 'Dashboard' }
            ];
            
            console.log('[SmartChronologyFix] Тестируем с', testEvents.length, 'событиями (11:24-17:00)');
            console.log('[SmartChronologyFix] Ожидаемое время: ~5ч 36м');
            window.updateChronologyTable(testEvents);
        };
        
        console.log('[SmartChronologyFix] v3.0.5 успешно инициализирован!');
        console.log('[SmartChronologyFix] Новые возможности:');
        console.log('  ✅ ИСПРАВЛЕН расчет времени: от начала до конца активности');
        console.log('  ✅ Правильное вычисление продолжительности сегментов');
        console.log('  ✅ Корректная общая продолжительность');
        console.log('  📋 НОВАЯ кнопка "Читаемая хронология" с временными интервалами');
        console.log('  🧠 ИНТЕЛЛЕКТУАЛЬНАЯ группировка: как на втором скриншоте');
        console.log('  ⏰ Суммирование времени приложений в интервалах');
        console.log('  🎯 Группировка значимых окон (без дублирования)');
        console.log('  📊 Читаемый формат: интервал → приложения → окна');
        console.log('  🕐 ИСПРАВЛЕНО время интервалов: 11:24 - 17:00 (5ч 36м)');
        console.log('  🧪 Тестирование: window.testWindowActivity()');
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeModule);
    } else {
        initializeModule();
    }
})();

console.log('[SmartChronologyFix] v3.0.5 модуль загружен - добавлена читаемая хронология!'); 