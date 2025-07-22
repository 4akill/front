/**
 * УМНЫЙ АНАЛИЗАТОР СПОЙЛЕРОВ
 * Группирует активность по большим временным периодам
 * Разделяет активные и неактивные периоды
 * Создает иерархическую структуру спойлеров
 */

// Константы для анализа спойлеров
const SMART_SPOILER_CONSTANTS = {
    // Минимальная неактивность для разделения периодов (в минутах)
    INACTIVE_THRESHOLD_MINUTES: 5,
    
    // Максимальное количество больших спойлеров
    MAX_BIG_SPOILERS: 4,
    
    // Временные периоды дня
    TIME_PERIODS: {
        MORNING: { start: 6, end: 12, name: 'Утро' },      // 6:00 - 12:00
        DAY: { start: 12, end: 18, name: 'День' },         // 12:00 - 18:00
        EVENING: { start: 18, end: 22, name: 'Вечер' },    // 18:00 - 22:00
        NIGHT: { start: 22, end: 6, name: 'Ночь' }         // 22:00 - 6:00
    },
    
    // Критерии активности
    ACTIVITY_CRITERIA: {
        // Минимальные клики мыши для активности (за 5 минут)
        MIN_MOUSE_CLICKS: 2,
        
        // Минимальные движения мыши для активности (за 5 минут)
        MIN_MOUSE_MOVEMENTS: 10,
        
        // Минимальная загрузка ЦП для активности (%)
        MIN_CPU_USAGE: 15,
        
        // Приоритетные процессы (всегда считаются активными)
        PRIORITY_PROCESSES: [
            'Cursor.exe', 'Code.exe', 'msedge.exe', 'firefox.exe', 
            'chrome.exe', 'brave.exe', 'notepad.exe', 'Telegram.exe'
        ]
    }
};

/**
 * Главная функция анализа спойлеров
 * @param {Array} mergedData - Объединенные данные активности (периоды фокуса)
 * @returns {Array} - Массив больших спойлеров
 */
function analyzeSmartSpoilers(mergedData) {
    console.log('🧠 Начинаем анализ умных спойлеров для', mergedData.length, 'периодов фокуса');
    
    if (!mergedData || mergedData.length === 0) {
        return [];
    }
    
    // Преобразуем периоды фокуса в формат, подходящий для анализа спойлеров
    const activityPeriods = mergedData.map(period => ({
        startTime: new Date(period.startTime),
        endTime: new Date(period.endTime),
        records: [period], // Каждый период фокуса - это одна "запись"
        activeRecords: 1,
        mouseClicks: period.mouseActivity?.clicks || 0,
        mouseMovements: period.mouseActivity?.movements || 0,
        avgCpu: period.cpuUsage?.value || 0,
        avgRam: period.ramUsage?.value || 0,
        uniqueApps: new Set([period.appName]),
        realDuration: period.duration,
        focusTime: period.duration,
        uniqueAppsCount: 1,
        // Добавляем поля для совместимости
        appName: period.appName,
        primaryApp: period.appName,
        duration: period.duration,
        timestamp: period.startTime,
        cpuUsage: period.cpuUsage,
        ramUsage: period.ramUsage,
        mouseActivity: period.mouseActivity,
        status: period.status,
        rawActivities: period.rawActivities || [],
        activitiesCount: period.activitiesCount || 1,
        isBackground: period.isBackground || false
    }));
    
    console.log('📊 Преобразовано периодов активности:', activityPeriods.length);
    
    // Группируем периоды в большие спойлеры
    const bigSpoilers = createBigSpoilers(activityPeriods, mergedData);
    console.log('📦 Создано больших спойлеров:', bigSpoilers.length);
    
    return bigSpoilers;
}

/**
 * Определяет периоды активности и неактивности
 * @param {Array} sortedData - Отсортированные данные
 * @returns {Array} - Массив периодов активности
 */
function identifyActivityPeriods(sortedData) {
    const periods = [];
    let currentPeriod = null;
    
    for (let i = 0; i < sortedData.length; i++) {
        const record = sortedData[i];
        const recordTime = new Date(record.timestamp);
        const isActive = isRecordActive(record);
        
        // Проверяем разрыв с предыдущей записью
        if (currentPeriod) {
            const timeDiff = (recordTime - currentPeriod.endTime) / (1000 * 60); // в минутах
            
            // Если разрыв больше порога неактивности, завершаем текущий период
            if (timeDiff > SMART_SPOILER_CONSTANTS.INACTIVE_THRESHOLD_MINUTES) {
                // Вычисляем реальную длительность периода и время фокуса
                currentPeriod.realDuration = Math.round((currentPeriod.endTime - currentPeriod.startTime) / 1000);
                currentPeriod.focusTime = calculateRealFocusTime(currentPeriod.records);
                periods.push(currentPeriod);
                currentPeriod = null;
            }
        }
        
        // Начинаем новый период или продолжаем текущий
        if (isActive) {
            if (!currentPeriod) {
                currentPeriod = {
                    startTime: recordTime,
                    endTime: recordTime,
                    records: [record],
                    activeRecords: 1,
                    mouseClicks: record.mouseActivity.clicks,
                    mouseMovements: record.mouseActivity.movements,
                    avgCpu: record.cpuUsage.value,
                    avgRam: record.ramUsage.value,
                    uniqueApps: new Set([record.appName])
                };
            } else {
                // Продолжаем текущий период
                currentPeriod.endTime = recordTime;
                currentPeriod.records.push(record);
                currentPeriod.activeRecords++;
                currentPeriod.mouseClicks += record.mouseActivity.clicks;
                currentPeriod.mouseMovements += record.mouseActivity.movements;
                currentPeriod.avgCpu += record.cpuUsage.value;
                currentPeriod.avgRam += record.ramUsage.value;
                currentPeriod.uniqueApps.add(record.appName);
            }
        } else if (currentPeriod) {
            // Неактивная запись в активном периоде - добавляем но не увеличиваем счетчик активности
            currentPeriod.endTime = recordTime;
            currentPeriod.records.push(record);
            currentPeriod.uniqueApps.add(record.appName);
        }
    }
    
    // Добавляем последний период если есть
    if (currentPeriod) {
        // Вычисляем реальную длительность периода и время фокуса
        currentPeriod.realDuration = Math.round((currentPeriod.endTime - currentPeriod.startTime) / 1000);
        currentPeriod.focusTime = calculateRealFocusTime(currentPeriod.records);
        periods.push(currentPeriod);
    }
    
    // Вычисляем средние значения для каждого периода
    periods.forEach((period, index) => {
        if (period.activeRecords > 0) {
            period.avgCpu = Math.round(period.avgCpu / period.activeRecords);
            period.avgRam = Math.round(period.avgRam / period.activeRecords);
        }
        period.uniqueAppsCount = period.uniqueApps.size;
        
        // Отладочная информация
        const startStr = period.startTime.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
        const endStr = period.endTime.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
        const realDurationStr = formatDuration(period.realDuration);
        const focusTimeStr = formatDuration(period.focusTime);
        console.log(`📊 Период ${index + 1}: ${startStr}-${endStr}, записей: ${period.records.length}, активных: ${period.activeRecords}`);
        console.log(`   ⏱️ Общее время: ${realDurationStr}, Время фокуса: ${focusTimeStr} (${Math.round((period.focusTime/period.realDuration)*100)}%)`);
    });
    
    return periods;
}

/**
 * Проверяет активность записи
 * @param {Object} record - Запись активности (может быть период фокуса)
 * @returns {boolean} - true если активна
 */
function isRecordActive(record) {
    // Если это период фокуса из новой системы, он всегда активен
    if (record.startTime && record.endTime && record.duration) {
        return true;
    }
    
    // Проверяем приоритетные процессы
    const appName = record.appName || record.app_name || record.application;
    if (appName && SMART_SPOILER_CONSTANTS.ACTIVITY_CRITERIA.PRIORITY_PROCESSES.includes(appName)) {
        return true;
    }
    
    // Проверяем активность мыши
    const mouseActivity = record.mouseActivity || {};
    const hasMouseActivity = (mouseActivity.clicks || 0) >= SMART_SPOILER_CONSTANTS.ACTIVITY_CRITERIA.MIN_MOUSE_CLICKS ||
                            (mouseActivity.movements || 0) >= SMART_SPOILER_CONSTANTS.ACTIVITY_CRITERIA.MIN_MOUSE_MOVEMENTS;
    
    // Проверяем загрузку ЦП
    const cpuUsage = record.cpuUsage || {};
    const hasCpuActivity = (cpuUsage.value || 0) >= SMART_SPOILER_CONSTANTS.ACTIVITY_CRITERIA.MIN_CPU_USAGE;
    
    // Проверяем статус
    const status = record.status || '';
    const hasActiveStatus = status === 'Активен' || status === 'Работает';
    
    // Исключаем фоновые процессы
    const isNotBackground = status !== 'Фон' && !record.isBackground;
    
    return isNotBackground && (hasMouseActivity || hasCpuActivity || hasActiveStatus);
}

/**
 * Создает большие спойлеры из периодов активности
 * @param {Array} activityPeriods - Периоды активности
 * @param {Array} allData - Все данные
 * @returns {Array} - Массив больших спойлеров
 */
function createBigSpoilers(activityPeriods, allData) {
    if (activityPeriods.length === 0) {
        return [];
    }
    
    const bigSpoilers = [];
    
    // Группируем периоды по времени дня или объединяем близкие
    const groupedPeriods = groupPeriodsByProximity(activityPeriods);
    
    // Ограничиваем количество больших спойлеров
    const limitedGroups = limitBigSpoilers(groupedPeriods);
    
    // Создаем спойлеры
    limitedGroups.forEach((group, index) => {
        const spoiler = createBigSpoiler(group, index, allData);
        if (spoiler) {
            bigSpoilers.push(spoiler);
        }
    });
    
    return bigSpoilers;
}

/**
 * Группирует периоды по близости во времени
 * @param {Array} periods - Периоды активности
 * @returns {Array} - Группы периодов
 */
function groupPeriodsByProximity(periods) {
    const groups = [];
    let currentGroup = null;
    
    for (let period of periods) {
        if (!currentGroup) {
            currentGroup = [period];
        } else {
            const lastPeriod = currentGroup[currentGroup.length - 1];
            const timeDiff = (period.startTime - lastPeriod.endTime) / (1000 * 60 * 60); // в часах
            
            // Если разрыв меньше 2 часов, добавляем в текущую группу
            if (timeDiff <= 2) {
                currentGroup.push(period);
            } else {
                // Иначе начинаем новую группу
                groups.push(currentGroup);
                currentGroup = [period];
            }
        }
    }
    
    if (currentGroup) {
        groups.push(currentGroup);
    }
    
    return groups;
}

/**
 * Ограничивает количество больших спойлеров
 * @param {Array} groups - Группы периодов
 * @returns {Array} - Ограниченные группы
 */
function limitBigSpoilers(groups) {
    // Если групп больше максимума, объединяем самые маленькие
    while (groups.length > SMART_SPOILER_CONSTANTS.MAX_BIG_SPOILERS) {
        // Находим две самые маленькие группы по общей длительности
        let minIndex1 = 0, minIndex2 = 1;
        let minDuration1 = getTotalGroupDuration(groups[0]);
        let minDuration2 = getTotalGroupDuration(groups[1]);
        
        if (minDuration2 < minDuration1) {
            [minIndex1, minIndex2] = [minIndex2, minIndex1];
            [minDuration1, minDuration2] = [minDuration2, minDuration1];
        }
        
        for (let i = 2; i < groups.length; i++) {
            const duration = getTotalGroupDuration(groups[i]);
            if (duration < minDuration1) {
                minIndex2 = minIndex1;
                minDuration2 = minDuration1;
                minIndex1 = i;
                minDuration1 = duration;
            } else if (duration < minDuration2) {
                minIndex2 = i;
                minDuration2 = duration;
            }
        }
        
        // Объединяем две самые маленькие группы
        const merged = [...groups[minIndex1], ...groups[minIndex2]];
        groups.splice(Math.max(minIndex1, minIndex2), 1);
        groups.splice(Math.min(minIndex1, minIndex2), 1);
        groups.push(merged);
    }
    
    return groups;
}

/**
 * Вычисляет общую длительность группы
 * @param {Array} group - Группа периодов
 * @returns {number} - Общая длительность в секундах
 */
function getTotalGroupDuration(group) {
    return group.reduce((sum, period) => sum + (period.duration || period.realDuration || 0), 0);
}

/**
 * Создает большой спойлер из группы периодов
 * @param {Array} group - Группа периодов
 * @param {number} index - Индекс спойлера
 * @param {Array} allData - Все данные
 * @returns {Object} - Большой спойлер
 */
function createBigSpoiler(group, index, allData) {
    if (!group || group.length === 0) {
        return null;
    }
    
    const firstPeriod = group[0];
    const lastPeriod = group[group.length - 1];
    
    // Определяем общие характеристики спойлера
    const startTime = new Date(firstPeriod.startTime || firstPeriod.timestamp);
    const endTime = new Date(lastPeriod.endTime || lastPeriod.timestamp);
    
    // Вычисляем общее время как разность между началом и концом
    const totalDuration = Math.round((endTime - startTime) / 1000);
    const totalFocusTime = group.reduce((sum, period) => sum + (period.duration || period.realDuration || 0), 0);
    const totalRecords = group.length; // Каждый период - это одна запись
    const totalActiveRecords = group.filter(period => isRecordActive(period)).length;
    
    // Собираем все уникальные приложения
    const allApps = new Set();
    const productiveApps = new Set();
    group.forEach(period => {
        const appName = period.appName || period.primaryApp;
        if (appName) {
            allApps.add(appName);
            if (isProductiveApplication(appName)) {
                productiveApps.add(appName);
            }
        }
    });
    
    // Вычисляем средние метрики
    const avgCpu = Math.round(group.reduce((sum, period) => sum + (period.cpuUsage?.value || 0), 0) / group.length);
    const avgRam = Math.round(group.reduce((sum, period) => sum + (period.ramUsage?.value || 0), 0) / group.length);
    const totalMouseClicks = group.reduce((sum, period) => sum + (period.mouseActivity?.clicks || 0), 0);
    const totalMouseMovements = group.reduce((sum, period) => sum + (period.mouseActivity?.movements || 0), 0);
    
    // Определяем название периода
    const periodName = determinePeriodName(startTime, endTime);
    
    // Определяем уровень активности на основе времени фокуса
    const activityLevel = determineActivityLevel(totalFocusTime, totalDuration, totalMouseClicks, avgCpu);
    
    // Вычисляем эффективность фокуса
    const focusEfficiency = totalDuration > 0 ? Math.round((totalFocusTime / totalDuration) * 100) : 0;
    
    // Отладочная информация
    const startStr = startTime.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    const endStr = endTime.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    const durationStr = formatDuration(totalDuration);
    const focusTimeStr = formatDuration(totalFocusTime);
    console.log(`🎯 Большой спойлер ${index + 1}: ${startStr}-${endStr}, периодов: ${group.length}, записей: ${totalRecords}, активных: ${totalActiveRecords}`);
    console.log(`   ⚡ Общее время: ${durationStr}, Время фокуса: ${focusTimeStr} (${focusEfficiency}%), продуктивных приложений: ${productiveApps.size}`);
    
    return {
        id: `big-spoiler-${index}`,
        name: periodName,
        startTime: startTime,
        endTime: endTime,
        duration: totalDuration,
        focusTime: totalFocusTime,
        formattedDuration: formatDuration(totalDuration),
        formattedFocusTime: formatDuration(totalFocusTime),
        focusEfficiency: focusEfficiency,
        totalRecords: totalRecords,
        activeRecords: totalActiveRecords,
        inactiveRecords: totalRecords - totalActiveRecords,
        activityPercentage: Math.round((totalActiveRecords / totalRecords) * 100),
        uniqueApps: Array.from(allApps),
        uniqueAppsCount: allApps.size,
        productiveApps: Array.from(productiveApps),
        productiveAppsCount: productiveApps.size,
        avgCpu: avgCpu,
        avgRam: avgRam,
        mouseClicks: totalMouseClicks,
        mouseMovements: totalMouseMovements,
        activityLevel: activityLevel,
        periods: group,
        isExpanded: false
    };
}

/**
 * Определяет название периода по времени
 * @param {Date} startTime - Время начала
 * @param {Date} endTime - Время окончания
 * @returns {string} - Название периода
 */
function determinePeriodName(startTime, endTime) {
    const startHour = startTime.getHours();
    const endHour = endTime.getHours();
    
    const startTimeStr = startTime.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    const endTimeStr = endTime.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    
    // Определяем основной период дня
    let mainPeriod = '';
    
    if (startHour >= 6 && startHour < 12) {
        mainPeriod = 'Утренняя активность';
    } else if (startHour >= 12 && startHour < 18) {
        mainPeriod = 'Дневная активность';
    } else if (startHour >= 18 && startHour < 22) {
        mainPeriod = 'Вечерняя активность';
    } else {
        mainPeriod = 'Ночная активность';
    }
    
    return `${mainPeriod} (${startTimeStr} - ${endTimeStr})`;
}

/**
 * Определяет уровень активности
 * @param {number} focusTime - Время фокуса в секундах
 * @param {number} totalTime - Общее время в секундах
 * @param {number} mouseClicks - Клики мыши
 * @param {number} avgCpu - Средняя загрузка ЦП
 * @returns {string} - Уровень активности
 */
function determineActivityLevel(focusTime, totalTime, mouseClicks, avgCpu) {
    const focusRatio = focusTime / totalTime;
    const focusMinutes = focusTime / 60;
    
    // Очень высокая активность: высокий процент фокуса + много активности
    if (focusRatio >= 0.7 && focusMinutes >= 10 && mouseClicks >= 50 && avgCpu >= 30) {
        return 'Очень высокая';
    }
    // Высокая активность: хороший фокус + умеренная активность
    else if (focusRatio >= 0.5 && focusMinutes >= 5 && mouseClicks >= 20 && avgCpu >= 20) {
        return 'Высокая';
    }
    // Средняя активность: средний фокус или короткие периоды высокого фокуса
    else if ((focusRatio >= 0.4 && focusMinutes >= 3) || (focusRatio >= 0.6 && focusMinutes >= 1)) {
        return 'Средняя';
    }
    // Низкая активность: небольшой фокус но есть активность
    else if (focusRatio >= 0.2 && focusMinutes >= 1) {
        return 'Низкая';
    }
    // Очень низкая активность: минимальный фокус
    else {
        return 'Очень низкая';
    }
}

/**
 * Обновляет таблицу с большими спойлерами
 * @param {Array} bigSpoilers - Массив больших спойлеров
 * @param {Array} originalData - Исходные данные
 */
function updateTableWithSmartSpoilers(bigSpoilers, originalData) {
    const tbody = document.querySelector('#window-focus-table tbody');
    
    if (!bigSpoilers || bigSpoilers.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center text-muted">
                    <i class="bi bi-info-circle"></i> 
                    Нет активных периодов для отображения
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = '';
    
    bigSpoilers.forEach((spoiler, spoilerIndex) => {
        // Создаем заголовок большого спойлера
        const spoilerHeader = createBigSpoilerHeader(spoiler, spoilerIndex);
        tbody.appendChild(spoilerHeader);
        
        // Создаем контент спойлера (изначально скрыт)
        spoiler.periods.forEach((period, periodIndex) => {
            // Создаем заголовок периода (если нужно детальное отображение)
            const periodHeader = createPeriodHeader(period, spoilerIndex, periodIndex);
            tbody.appendChild(periodHeader);
            
            // Создаем строку с данными периода (изначально скрыта)
            const row = createSmartSpoilerRow(period, spoilerIndex, periodIndex, 0);
            tbody.appendChild(row);
        });
    });
    
    console.log(`📊 Таблица обновлена с ${bigSpoilers.length} большими спойлерами`);
}

/**
 * Создает заголовок большого спойлера
 * @param {Object} spoiler - Большой спойлер
 * @param {number} spoilerIndex - Индекс спойлера
 * @returns {HTMLElement} - Элемент заголовка
 */
function createBigSpoilerHeader(spoiler, spoilerIndex) {
    const row = document.createElement('tr');
    row.className = 'table-dark big-spoiler-header';
    row.style.cursor = 'pointer';
    row.dataset.spoilerIndex = spoilerIndex;
    
    const activityBadge = getActivityLevelBadge(spoiler.activityLevel);
    const focusEfficiencyBadge = getFocusEfficiencyBadge(spoiler.focusEfficiency);
    
    row.innerHTML = `
        <td colspan="8" class="big-spoiler-content">
            <div class="d-flex justify-content-between align-items-center py-2">
                <div class="d-flex align-items-center">
                    <i class="bi bi-chevron-right big-spoiler-toggle me-3" id="big-toggle-${spoilerIndex}"></i>
                    <div>
                        <h6 class="mb-1 text-white">
                            <i class="bi bi-calendar-event me-2"></i>
                            ${spoiler.name}
                        </h6>
                        <div class="d-flex align-items-center gap-2">
                            <span class="badge bg-light text-dark">
                                <i class="bi bi-clock me-1"></i>${spoiler.formattedDuration}
                            </span>
                            <span class="badge bg-primary">
                                <i class="bi bi-eye me-1"></i>${spoiler.formattedFocusTime} фокуса
                            </span>
                            <span class="badge bg-info">${spoiler.totalRecords} записей</span>
                            ${activityBadge}
                            ${focusEfficiencyBadge}
                        </div>
                    </div>
                </div>
                <div class="big-spoiler-summary d-flex align-items-center gap-3">
                    <div class="text-center">
                        <div class="text-white-50 small">Приложения</div>
                        <div class="text-white fw-bold">${spoiler.uniqueAppsCount}</div>
                        <div class="text-white-50 x-small">${spoiler.productiveAppsCount} продуктивных</div>
                    </div>
                    <div class="text-center">
                        <div class="text-white-50 small">Эффективность</div>
                        <div class="text-white fw-bold">${spoiler.focusEfficiency}%</div>
                        <div class="text-white-50 x-small">фокуса</div>
                    </div>
                    <div class="text-center">
                        <div class="text-white-50 small">Мышь</div>
                        <div class="text-white fw-bold">${spoiler.mouseClicks}к/${spoiler.mouseMovements}д</div>
                    </div>
                    <div class="text-center">
                        <div class="text-white-50 small">ЦП/ОЗУ</div>
                        <div class="text-white fw-bold">${spoiler.avgCpu}%/${spoiler.avgRam}%</div>
                    </div>
                </div>
            </div>
        </td>
    `;
    
    // Добавляем обработчик клика
    row.addEventListener('click', () => toggleBigSpoiler(spoilerIndex));
    
    return row;
}

/**
 * Создает заголовок периода внутри большого спойлера
 * @param {Object} period - Период активности
 * @param {number} spoilerIndex - Индекс большого спойлера
 * @param {number} periodIndex - Индекс периода
 * @returns {HTMLElement} - Элемент заголовка периода
 */
function createPeriodHeader(period, spoilerIndex, periodIndex) {
    const row = document.createElement('tr');
    row.className = 'table-secondary period-header';
    row.style.cursor = 'pointer';
    row.style.display = 'none';
    row.dataset.parentSpoiler = spoilerIndex;
    row.dataset.periodIndex = periodIndex;
    
    const startTime = new Date(period.startTime || period.timestamp).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    const endTime = new Date(period.endTime || period.timestamp).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    const duration = formatDuration(period.duration || period.realDuration || 0);
    const focusTime = formatDuration(period.duration || period.focusTime || 0); // В новой системе duration = focusTime
    const focusEfficiency = (period.duration || period.realDuration) > 0 ? 
        Math.round(((period.duration || period.focusTime || 0) / (period.duration || period.realDuration)) * 100) : 100;
    
    // Получаем информацию о приложении
    const appName = period.appName || period.primaryApp || 'Неизвестно';
    const activitiesCount = period.activitiesCount || period.rawActivities || 1;
    
    row.innerHTML = `
        <td colspan="8" class="period-content">
            <div class="d-flex justify-content-between align-items-center py-1 ps-4">
                <div class="d-flex align-items-center">
                    <i class="bi bi-chevron-right period-toggle me-2" id="period-toggle-${spoilerIndex}-${periodIndex}"></i>
                    <div>
                        <strong class="me-3">
                            <i class="bi bi-clock me-1"></i>
                            ${startTime} - ${endTime}
                        </strong>
                        <span class="badge bg-light text-dark me-2">
                            <i class="bi bi-hourglass me-1"></i>${duration}
                        </span>
                        <span class="badge bg-primary me-2">
                            <i class="bi bi-eye me-1"></i>${focusTime} фокуса
                        </span>
                        <span class="badge bg-info me-2">${activitiesCount} активностей</span>
                        <span class="badge bg-success">Активный период</span>
                        <span class="badge ${focusEfficiency >= 50 ? 'bg-success' : focusEfficiency >= 30 ? 'bg-warning' : 'bg-secondary'} ms-2">
                            ${focusEfficiency}% эффективность
                        </span>
                    </div>
                </div>
                <div class="period-summary">
                    <small class="text-muted">
                        <i class="bi bi-app me-1"></i>
                        ${appName}
                    </small>
                </div>
            </div>
        </td>
    `;
    
    // Добавляем обработчик клика
    row.addEventListener('click', (e) => {
        e.stopPropagation();
        togglePeriod(spoilerIndex, periodIndex);
    });
    
    return row;
}

/**
 * Создает строку записи в умном спойлере
 * @param {Object} record - Запись активности (период фокуса)
 * @param {number} spoilerIndex - Индекс большого спойлера
 * @param {number} periodIndex - Индекс периода
 * @param {number} recordIndex - Индекс записи
 * @returns {HTMLElement} - Элемент строки
 */
function createSmartSpoilerRow(record, spoilerIndex, periodIndex, recordIndex) {
    const row = document.createElement('tr');
    row.className = record.isBackground ? 'table-light' : '';
    row.style.display = 'none';
    row.dataset.parentSpoiler = spoilerIndex;
    row.dataset.parentPeriod = periodIndex;
    
    // Обрабатываем период фокуса
    const timeStr = new Date(record.startTime || record.timestamp).toLocaleTimeString('ru-RU');
    const durationStr = formatDuration(record.duration || 0);
    const detailsHtml = createProfessionalPeriodDetails(record);
    const statusClass = getStatusClass(record.status || 'Активен');
    const mouseActivity = record.mouseActivity || { clicks: 0, movements: 0, activityLevel: 'Низкая' };
    const mouseClass = getMouseActivityClass(mouseActivity.activityLevel);
    const cpuUsage = record.cpuUsage || { value: 0, level: 'Низкая' };
    const cpuClass = getResourceClass(cpuUsage.level);
    const ramUsage = record.ramUsage || { value: 0, level: 'Низкая' };
    const ramClass = getRamResourceClass(ramUsage.level);
    
    row.innerHTML = `
        <td class="font-monospace text-nowrap ps-5">
            <small class="text-muted">${timeStr}</small>
        </td>
        <td>
            <div class="d-flex align-items-center">
                <i class="bi bi-app me-2 text-primary"></i>
                <div>
                    <strong class="d-block">${record.appName || 'Неизвестно'}</strong>
                    ${(record.activitiesCount || record.rawActivities?.length || 0) > 1 ? `<small class="text-muted">${record.activitiesCount || record.rawActivities?.length} активностей</small>` : ''}
                </div>
            </div>
        </td>
        <td class="details-cell">
            ${detailsHtml}
        </td>
        <td class="text-nowrap">
            <span class="badge bg-light text-dark">${durationStr}</span>
        </td>
        <td class="text-center">
            <div class="d-flex flex-column align-items-center">
                <span class="badge ${mouseClass} mb-1">
                    ${mouseActivity.clicks}к/${mouseActivity.movements}д
                </span>
                <small class="text-muted">${mouseActivity.activityLevel}</small>
            </div>
        </td>
        <td class="text-center">
            <div class="d-flex flex-column align-items-center">
                <span class="badge ${cpuClass} mb-1">${cpuUsage.value}%</span>
                <small class="text-muted">${cpuUsage.level}</small>
            </div>
        </td>
        <td class="text-center">
            <div class="d-flex flex-column align-items-center">
                <span class="badge ${ramClass} mb-1">${ramUsage.value}%</span>
                <small class="text-muted">${ramUsage.level}</small>
            </div>
        </td>
        <td class="text-center">
            <span class="badge ${statusClass}">${record.status || 'Активен'}</span>
        </td>
    `;
    
    return row;
}

/**
 * Получает бейдж для уровня активности
 * @param {string} level - Уровень активности
 * @returns {string} - HTML бейджа
 */
function getActivityLevelBadge(level) {
    switch (level) {
        case 'Очень высокая':
            return '<span class="badge bg-success"><i class="bi bi-lightning-fill me-1"></i>Очень высокая</span>';
        case 'Высокая':
            return '<span class="badge bg-primary"><i class="bi bi-activity me-1"></i>Высокая</span>';
        case 'Средняя':
            return '<span class="badge bg-warning"><i class="bi bi-bar-chart me-1"></i>Средняя</span>';
        case 'Низкая':
            return '<span class="badge bg-secondary"><i class="bi bi-pause-circle me-1"></i>Низкая</span>';
        default:
            return '<span class="badge bg-danger"><i class="bi bi-x-circle me-1"></i>Очень низкая</span>';
    }
}

/**
 * Получает бейдж для эффективности фокуса
 * @param {number} percentage - Процент эффективности фокуса
 * @returns {string} - HTML бейджа
 */
function getFocusEfficiencyBadge(percentage) {
    if (percentage >= 70) {
        return '<span class="badge bg-success"><i class="bi bi-bullseye me-1"></i>Отличный фокус</span>';
    } else if (percentage >= 50) {
        return '<span class="badge bg-primary"><i class="bi bi-target me-1"></i>Хороший фокус</span>';
    } else if (percentage >= 30) {
        return '<span class="badge bg-warning"><i class="bi bi-circle-half me-1"></i>Средний фокус</span>';
    } else if (percentage >= 15) {
        return '<span class="badge bg-secondary"><i class="bi bi-dash-circle me-1"></i>Слабый фокус</span>';
    } else {
        return '<span class="badge bg-danger"><i class="bi bi-x-circle me-1"></i>Низкий фокус</span>';
    }
}

/**
 * Переключает видимость большого спойлера
 * @param {number} spoilerIndex - Индекс спойлера
 */
function toggleBigSpoiler(spoilerIndex) {
    const periods = document.querySelectorAll(`[data-parent-spoiler="${spoilerIndex}"]`);
    const toggleIcon = document.getElementById(`big-toggle-${spoilerIndex}`);
    
    const isVisible = periods.length > 0 && periods[0].style.display !== 'none';
    
    periods.forEach(element => {
        if (element.classList.contains('period-header')) {
            element.style.display = isVisible ? 'none' : '';
        } else {
            // Записи остаются скрытыми пока не откроют период
            element.style.display = 'none';
        }
    });
    
    // Обновляем иконку
    if (toggleIcon) {
        toggleIcon.className = isVisible ? 'bi bi-chevron-right big-spoiler-toggle me-3' : 'bi bi-chevron-down big-spoiler-toggle me-3';
    }
}

/**
 * Переключает видимость периода
 * @param {number} spoilerIndex - Индекс большого спойлера
 * @param {number} periodIndex - Индекс периода
 */
function togglePeriod(spoilerIndex, periodIndex) {
    const records = document.querySelectorAll(`[data-parent-spoiler="${spoilerIndex}"][data-parent-period="${periodIndex}"]`);
    const toggleIcon = document.getElementById(`period-toggle-${spoilerIndex}-${periodIndex}`);
    
    const isVisible = records.length > 0 && records[0].style.display !== 'none';
    
    records.forEach(record => {
        record.style.display = isVisible ? 'none' : '';
    });
    
    // Обновляем иконку
    if (toggleIcon) {
        toggleIcon.className = isVisible ? 'bi bi-chevron-right period-toggle me-2' : 'bi bi-chevron-down period-toggle me-2';
    }
}

/**
 * Форматирует длительность в читаемый вид
 * @param {number} seconds - Секунды
 * @returns {string} - Форматированная строка
 */
function formatDuration(seconds) {
    if (seconds < 60) {
        return `${seconds}с`;
    } else if (seconds < 3600) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return remainingSeconds > 0 ? `${minutes}м ${remainingSeconds}с` : `${minutes}м`;
    } else {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        return `${hours}ч ${minutes}м`;
    }
}

/**
 * Вычисляет реальное время фокуса на основе переключений между приложениями
 * @param {Array} records - Записи активности в периоде
 * @returns {number} - Реальное время фокуса в секундах
 */
function calculateRealFocusTime(records) {
    if (!records || records.length === 0) return 0;
    if (records.length === 1) {
        // Для одной записи используем её длительность, но ограничиваем разумными пределами
        return Math.min(records[0].duration, 300); // максимум 5 минут для одной записи
    }
    
    let totalFocusTime = 0;
    let lastActiveTime = null;
    let lastActiveApp = null;
    
    // Сортируем записи по времени
    const sortedRecords = [...records].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    
    for (let i = 0; i < sortedRecords.length; i++) {
        const record = sortedRecords[i];
        const recordTime = new Date(record.timestamp);
        const isActive = isRecordActive(record);
        const isProductiveApp = isProductiveApplication(record.appName);
        
        if (isActive && isProductiveApp) {
            if (lastActiveTime && lastActiveApp) {
                // Вычисляем время между активными записями
                const timeDiff = (recordTime - lastActiveTime) / 1000; // в секундах
                
                // Если переключение между разными приложениями
                if (lastActiveApp !== record.appName) {
                    // Учитываем время фокуса с ограничениями
                    const focusSegment = calculateFocusSegment(timeDiff, lastActiveApp, record.appName);
                    totalFocusTime += focusSegment;
                } else {
                    // Та же программа - учитываем полное время, но с ограничениями
                    const focusSegment = Math.min(timeDiff, 180); // максимум 3 минуты непрерывной работы в одном приложении
                    totalFocusTime += focusSegment;
                }
            }
            
            lastActiveTime = recordTime;
            lastActiveApp = record.appName;
        } else if (isActive && !isProductiveApp) {
            // Системные процессы или фоновые - учитываем частично
            if (lastActiveTime) {
                const timeDiff = (recordTime - lastActiveTime) / 1000;
                const focusSegment = Math.min(timeDiff * 0.3, 60); // 30% времени, максимум 1 минута
                totalFocusTime += focusSegment;
            }
            lastActiveTime = recordTime;
            lastActiveApp = record.appName;
        }
    }
    
    // Добавляем время последней записи с учетом её типа
    if (lastActiveTime && sortedRecords.length > 0) {
        const lastRecord = sortedRecords[sortedRecords.length - 1];
        if (isRecordActive(lastRecord)) {
            const lastSegment = isProductiveApplication(lastRecord.appName) ? 
                Math.min(lastRecord.duration, 120) : // продуктивные - до 2 минут
                Math.min(lastRecord.duration * 0.5, 30); // остальные - 50%, до 30 секунд
            totalFocusTime += lastSegment;
        }
    }
    
    return Math.round(totalFocusTime);
}

/**
 * Вычисляет сегмент времени фокуса между переключениями приложений
 * @param {number} timeDiff - Разница во времени в секундах
 * @param {string} fromApp - Предыдущее приложение
 * @param {string} toApp - Текущее приложение
 * @returns {number} - Время фокуса для этого сегмента
 */
function calculateFocusSegment(timeDiff, fromApp, toApp) {
    // Максимальное время фокуса для одного сегмента (5 минут)
    const maxSegmentTime = 300;
    
    // Коэффициенты фокуса для разных типов переключений
    let focusCoefficient = 1.0;
    
    // Переключение между продуктивными приложениями
    if (isProductiveApplication(fromApp) && isProductiveApplication(toApp)) {
        if (isRelatedApplications(fromApp, toApp)) {
            // Связанные приложения (например, код -> браузер для тестирования)
            focusCoefficient = 0.9;
        } else {
            // Разные типы работы
            focusCoefficient = 0.8;
        }
    }
    // Переключение с продуктивного на развлекательное
    else if (isProductiveApplication(fromApp) && !isProductiveApplication(toApp)) {
        focusCoefficient = 0.6;
    }
    // Переключение с развлекательного на продуктивное
    else if (!isProductiveApplication(fromApp) && isProductiveApplication(toApp)) {
        focusCoefficient = 0.7;
    }
    // Между развлекательными приложениями
    else {
        focusCoefficient = 0.4;
    }
    
    // Учитываем длительность сегмента
    let segmentTime = Math.min(timeDiff, maxSegmentTime);
    
    // Для очень коротких сегментов (менее 10 секунд) - минимальный фокус
    if (timeDiff < 10) {
        segmentTime = timeDiff * 0.2;
    }
    // Для средних сегментов (10 секунд - 2 минуты) - нормальный расчет
    else if (timeDiff <= 120) {
        segmentTime = timeDiff * focusCoefficient;
    }
    // Для длинных сегментов (более 2 минут) - убывающая функция
    else {
        const baseTime = 120 * focusCoefficient; // первые 2 минуты
        const extraTime = (timeDiff - 120) * focusCoefficient * 0.7; // остальное время с пониженным коэффициентом
        segmentTime = baseTime + extraTime;
    }
    
    return Math.round(segmentTime);
}

/**
 * Проверяет, является ли приложение продуктивным
 * @param {string} appName - Название приложения
 * @returns {boolean} - true если продуктивное
 */
function isProductiveApplication(appName) {
    const productiveApps = [
        // Разработка
        'Cursor.exe', 'Code.exe', 'Visual Studio.exe', 'IntelliJ IDEA.exe', 'PyCharm.exe',
        'Sublime Text.exe', 'Atom.exe', 'WebStorm.exe', 'PhpStorm.exe',
        
        // Офисные приложения
        'WINWORD.EXE', 'EXCEL.EXE', 'POWERPNT.EXE', 'AcroRd32.exe', 'Acrobat.exe',
        'notepad.exe', 'notepad++.exe', 'WordPad.exe',
        
        // Дизайн и графика
        'Photoshop.exe', 'Illustrator.exe', 'Figma.exe', 'Sketch.exe', 'Canva.exe',
        'GIMP.exe', 'Inkscape.exe', 'Blender.exe',
        
        // Браузеры (частично продуктивные)
        'msedge.exe', 'chrome.exe', 'firefox.exe', 'brave.exe', 'opera.exe',
        
        // Коммуникация (рабочая)
        'Teams.exe', 'Slack.exe', 'Discord.exe', 'Zoom.exe', 'Skype.exe',
        
        // Системные инструменты
        'cmd.exe', 'powershell.exe', 'WindowsTerminal.exe', 'Git Bash.exe'
    ];
    
    return productiveApps.some(app => appName.toLowerCase().includes(app.toLowerCase()));
}

/**
 * Проверяет, связаны ли приложения по типу работы
 * @param {string} app1 - Первое приложение
 * @param {string} app2 - Второе приложение
 * @returns {boolean} - true если связаны
 */
function isRelatedApplications(app1, app2) {
    const relatedGroups = [
        // Разработка
        ['Cursor.exe', 'Code.exe', 'Visual Studio.exe', 'msedge.exe', 'chrome.exe', 'firefox.exe'],
        
        // Офисная работа
        ['WINWORD.EXE', 'EXCEL.EXE', 'POWERPNT.EXE', 'notepad.exe', 'AcroRd32.exe'],
        
        // Дизайн
        ['Photoshop.exe', 'Illustrator.exe', 'Figma.exe', 'Sketch.exe'],
        
        // Коммуникация
        ['Teams.exe', 'Slack.exe', 'Discord.exe', 'Telegram.exe', 'WhatsApp.exe']
    ];
    
    return relatedGroups.some(group => 
        group.some(app => app1.toLowerCase().includes(app.toLowerCase())) &&
        group.some(app => app2.toLowerCase().includes(app.toLowerCase()))
    );
}

console.log('🧠 Умный анализатор спойлеров загружен!'); 