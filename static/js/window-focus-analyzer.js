/**
 * УМНЫЙ АНАЛИЗАТОР ФОКУСА ОКОН
 * Объединяет данные активности окон, мыши и ресурсов по временным интервалам
 * Группирует процессы по времени (±5 секунд) и создает детальный анализ
 */

// Константы для анализа
const FOCUS_ANALYZER_CONSTANTS = {
    // Максимальный перерыв между активностями для группировки (в секундах)
    MAX_GAP_SECONDS: 30,
    
    // Минимальная длительность периода фокуса для отображения (в секундах)
    MIN_FOCUS_PERIOD_SECONDS: 10,
    
    // Максимальная длительность одного периода фокуса (в секундах)
    MAX_FOCUS_PERIOD_SECONDS: 3600, // 1 час
    
    // Приоритеты процессов для выбора лучшего заголовка
    PROCESS_PRIORITIES: {
        'Cursor.exe': 10,
        'Code.exe': 9,
        'msedge.exe': 8,
        'firefox.exe': 8,
        'brave.exe': 8,
        'chrome.exe': 8,
        'notepad.exe': 7,
        'Telegram.exe': 6,
        'WhatsApp.exe': 6,
        'CalculatorApp.exe': 5,
        'SystemSettings.exe': 2,
        'TextInputHost.exe': 1,
        'NVIDIA Overlay.exe': 1,
        'Video.UI.exe': 1,
        'Y.Music.exe': 3
    },
    
    // Фоновые процессы (исключаются из основного анализа)
    BACKGROUND_PROCESSES: [
        'NVIDIA Overlay.exe',
        'TextInputHost.exe',
        'Video.UI.exe',
        'SystemSettings.exe',
        'dwm.exe',
        'explorer.exe',
        'winlogon.exe',
        'csrss.exe',
        'wininit.exe',
        'services.exe',
        'lsass.exe',
        'svchost.exe',
        'RuntimeBroker.exe',
        'ApplicationFrameHost.exe',
        'ShellExperienceHost.exe',
        'StartMenuExperienceHost.exe',
        'SearchUI.exe',
        'MsMpEng.exe',
        'SecurityHealthSystray.exe'
    ]
};

/**
 * Основная функция анализа фокуса окон
 * @param {string} selectedDate - Выбранная дата для анализа
 */
async function analyzeFocus(selectedDate) {
    console.log('🧠 Начинаем умный анализ фокуса окон для даты:', selectedDate);
    
    try {
        // Показываем индикатор загрузки
        const analyzeBtn = document.getElementById('analyze-focus-btn');
        const originalText = analyzeBtn.innerHTML;
        analyzeBtn.innerHTML = '<i class="bi bi-hourglass-split"></i> Анализируем...';
        analyzeBtn.disabled = true;
        
        // Получаем все необходимые данные
        const allData = await loadAllDataForAnalysis(selectedDate);
        
        if (!allData || Object.keys(allData).length === 0) {
            throw new Error('Нет данных для анализа');
        }
        
        console.log('📊 Загружены данные для анализа:', {
            windowActivities: allData.windowActivities?.length || 0,
            mouseActivities: allData.mouseActivities?.length || 0,
            resourceData: allData.resourceData?.length || 0,
            browserActivities: allData.browserActivities?.length || 0,
            websiteVisits: allData.websiteVisits?.length || 0
        });
        
        // Выполняем умное слияние данных
        const mergedData = performSmartMerging(allData);
        console.log('🔄 Создано объединенных записей:', mergedData.length);
        
        // Сохраняем данные для возможности пересортировки
        window.lastAnalyzedData = mergedData;
        
        // Сохраняем исходные данные для детального просмотра процессов
        window.lastAnalyzedRawData = allData;
        
        // Обновляем таблицу с результатами
        updateFocusTable(mergedData);
        
        // 🔗 ИНТЕГРАЦИЯ: Обновляем основные метрики дашборда
        updateDashboardMetricsFromFocusAnalyzer(allData);
        
        // Восстанавливаем кнопку
        analyzeBtn.innerHTML = originalText;
        analyzeBtn.disabled = false;
        
        console.log('✅ Анализ фокуса завершен успешно');
        
    } catch (error) {
        console.error('❌ Ошибка при анализе фокуса:', error);
        
        // Показываем ошибку в таблице
        const tbody = document.querySelector('#window-focus-table tbody');
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center text-danger">
                    <i class="bi bi-exclamation-triangle"></i> 
                    Ошибка анализа: ${error.message}
                </td>
            </tr>
        `;
        
        // Восстанавливаем кнопку
        const analyzeBtn = document.getElementById('analyze-focus-btn');
        analyzeBtn.innerHTML = '<i class="bi bi-cpu"></i> Анализировать фокус';
        analyzeBtn.disabled = false;
    }
}

/**
 * Загружает все данные для анализа
 * @param {string} selectedDate - Дата для загрузки
 * @returns {Object} - Объект со всеми данными
 */
async function loadAllDataForAnalysis(selectedDate) {
    console.log('📥 Загружаем данные со всех эндпоинтов для анализа:', { selectedDate });
    
    try {
        const employeeId = getCurrentEmployeeId();
        const deviceId = getCurrentDeviceId();
        
        // Формируем базовые параметры запроса
        const baseParams = new URLSearchParams({
            start_date: selectedDate,
            end_date: selectedDate
        });
        
        if (employeeId) baseParams.append('employee_id', employeeId);
        if (deviceId) baseParams.append('device_id', deviceId);
        
        console.log('📡 Параметры запроса:', baseParams.toString());
        
        // Загружаем данные параллельно со всех эндпоинтов
        const [
            activitiesResponse,
            mouseResponse,
            monitoringResponse,
            browserResponse,
            websiteResponse
        ] = await Promise.allSettled([
            fetch(`/api/public/activity/windows?${baseParams}`),
            fetch(`/api/public/activity/mouse?${baseParams}`),
            fetch(`/api/public/monitoring/data?${baseParams}`),
            fetch(`/api/public/browser-activity?${baseParams}`),
            fetch(`/api/public/activity/website_visits?${baseParams}`)
        ]);
        
        // Обрабатываем результаты
        const windowActivities = await handleResponse(activitiesResponse, 'activity/windows');
        const mouseActivities = await handleResponse(mouseResponse, 'activity/mouse');
        const resourceData = await handleResponse(monitoringResponse, 'monitoring/data');
        const browserActivities = await handleResponse(browserResponse, 'browser-activity');
        const websiteVisits = await handleResponse(websiteResponse, 'activity/website_visits');
        
        const allData = {
            windowActivities: windowActivities || [],
            mouseActivities: mouseActivities || [],
            resourceData: resourceData || [],
            browserActivities: browserActivities || [],
            websiteVisits: websiteVisits || []
        };
        
        console.log('📊 Загружены данные со всех эндпоинтов:', {
            windowActivities: allData.windowActivities.length,
            mouseActivities: allData.mouseActivities.length,
            resourceData: allData.resourceData.length,
            browserActivities: allData.browserActivities.length,
            websiteVisits: allData.websiteVisits.length
        });
        
        return allData;
        
    } catch (error) {
        console.error('❌ Ошибка загрузки данных для анализа:', error);
        
        // Fallback: пытаемся использовать уже загруженные данные
        console.log('🔄 Пытаемся использовать уже загруженные данные...');
        return await loadDataFromCache(selectedDate);
    }
}

/**
 * Обрабатывает ответ от API
 * @param {Promise} responsePromise - Промис ответа
 * @param {string} endpointName - Название эндпоинта для логирования
 * @returns {Array} - Данные или пустой массив
 */
async function handleResponse(responsePromise, endpointName) {
    try {
        if (responsePromise.status === 'fulfilled') {
            const response = responsePromise.value;
            if (response.ok) {
                const data = await response.json();
                console.log(`✅ ${endpointName}: получено ${Array.isArray(data) ? data.length : 'неизвестно'} записей`);
                return Array.isArray(data) ? data : [];
            } else {
                console.warn(`⚠️ ${endpointName}: HTTP ${response.status}`);
                return [];
            }
        } else {
            console.warn(`⚠️ ${endpointName}: запрос отклонен -`, responsePromise.reason);
            return [];
        }
    } catch (error) {
        console.warn(`⚠️ ${endpointName}: ошибка обработки -`, error);
        return [];
    }
}

/**
 * Загружает данные из кэша (fallback)
 * @param {string} selectedDate - Дата для загрузки
 * @returns {Object} - Данные из кэша
 */
async function loadDataFromCache(selectedDate) {
    console.log('🔄 Пытаемся загрузить данные из кэша...');
    
    // Пытаемся использовать уже загруженные данные из основного дашборда
    if (window.lastLoadedData) {
        console.log('✅ Найдены данные в window.lastLoadedData');
        return {
            windowActivities: window.lastLoadedData.activities || [],
            mouseActivities: window.lastLoadedData.mouse || [],
            resourceData: window.lastLoadedData.monitoring || [],
            browserActivities: window.lastLoadedData.browser || [],
            websiteVisits: window.lastLoadedData.websites || []
        };
    }
    
    // Если нет кэша, возвращаем пустые данные
    console.log('⚠️ Нет данных в кэше, возвращаем пустые массивы');
    return {
        windowActivities: [],
        mouseActivities: [],
        resourceData: [],
        browserActivities: [],
        websiteVisits: []
    };
}

/**
 * Умная фильтрация данных по дате
 * @param {Array} dataArray - Массив данных
 * @param {string} targetDate - Целевая дата
 * @returns {Array} - Отфильтрованные данные
 */
function filterByDate(dataArray, targetDate) {
    if (!Array.isArray(dataArray) || dataArray.length === 0) {
        return [];
    }
    
    console.log(`🔍 Фильтруем ${dataArray.length} записей по дате ${targetDate}`);
    
    // Показываем примеры форматов дат в данных
    const sampleTimestamps = dataArray.slice(0, 3).map(item => item.timestamp);
    console.log('📅 Примеры временных меток в данных:', sampleTimestamps);
    
    // Пробуем разные форматы дат
    const targetDateObj = new Date(targetDate);
    const targetDateStr = targetDate; // YYYY-MM-DD
    const targetDateStrAlt = targetDateObj.toISOString().split('T')[0]; // YYYY-MM-DD
    
    console.log('🎯 Ищем соответствия для дат:', [targetDateStr, targetDateStrAlt]);
    
    const filtered = dataArray.filter(item => {
        if (!item.timestamp) return false;
        
        try {
            const itemDate = new Date(item.timestamp);
            const itemDateStr = itemDate.toISOString().split('T')[0];
            
            // Сравниваем разные форматы
            const matches = itemDateStr === targetDateStr || 
                           itemDateStr === targetDateStrAlt ||
                           item.timestamp.startsWith(targetDateStr);
            
            return matches;
        } catch (error) {
            console.warn('⚠️ Ошибка парсинга даты:', item.timestamp, error);
            return false;
        }
    });
    
    console.log(`✅ Отфильтровано ${filtered.length} из ${dataArray.length} записей`);
    
    // Показываем примеры отфильтрованных временных меток
    if (filtered.length > 0) {
        const filteredSamples = filtered.slice(0, 3).map(item => item.timestamp);
        console.log('📅 Примеры отфильтрованных временных меток:', filteredSamples);
    }
    
    return filtered;
}

/**
 * Выполняет умное слияние всех данных по логическим периодам активности
 * @param {Object} allData - Все данные для слияния
 * @returns {Array} - Массив периодов фокуса
 */
function performSmartMerging(allData) {
    console.log('🧠 Начинаем умный анализ периодов фокуса...');
    
    const { windowActivities, mouseActivities, resourceData, browserActivities } = allData;
    
    if (!windowActivities || windowActivities.length === 0) {
        console.log('❌ Нет данных активности окон для анализа');
        return [];
    }
    
    // Сортируем активности по времени
    const sortedActivities = windowActivities
        .map(activity => ({
            ...activity,
            timestamp: new Date(activity.timestamp),
            appName: activity.app_name || activity.application,
            isBackground: isBackgroundProcess(activity.app_name || activity.application)
        }))
        .sort((a, b) => a.timestamp - b.timestamp);
    
    console.log(`📊 Анализируем ${sortedActivities.length} активностей окон`);
    
    // Создаём логические периоды фокуса
    const focusPeriods = createFocusPeriods(sortedActivities);
    
    // Обогащаем периоды данными мыши и ресурсов
    const enrichedPeriods = enrichPeriodsWithAdditionalData(focusPeriods, mouseActivities, resourceData, browserActivities);
    
    console.log(`✅ Создано ${enrichedPeriods.length} логических периодов фокуса`);
    return enrichedPeriods;
}

/**
 * Создаёт логические периоды фокуса на основе активностей окон
 * @param {Array} sortedActivities - Отсортированные активности
 * @returns {Array} - Периоды фокуса
 */
function createFocusPeriods(sortedActivities) {
    const focusPeriods = [];
    let currentPeriod = null;
    
    for (let i = 0; i < sortedActivities.length; i++) {
        const activity = sortedActivities[i];
        
        // Пропускаем фоновые процессы при создании основных периодов
        if (activity.isBackground) {
            continue;
        }
        
        // Если это первая активность или прошло много времени с последней
        if (!currentPeriod || shouldStartNewPeriod(currentPeriod, activity)) {
            // Сохраняем предыдущий период если он достаточно длинный
            if (currentPeriod && isValidPeriod(currentPeriod)) {
                focusPeriods.push(currentPeriod);
            }
            
            // Создаём новый период
            currentPeriod = {
                startTime: activity.timestamp,
                endTime: activity.timestamp,
                primaryApp: activity.appName,
                activities: [activity],
                apps: new Set([activity.appName]),
                totalActivities: 1
            };
        } else {
            // Добавляем активность к текущему периоду
            currentPeriod.endTime = activity.timestamp;
            currentPeriod.activities.push(activity);
            currentPeriod.apps.add(activity.appName);
            currentPeriod.totalActivities++;
            
            // Обновляем основное приложение если нужно
            updatePrimaryApp(currentPeriod, activity);
        }
    }
    
    // Добавляем последний период
    if (currentPeriod && isValidPeriod(currentPeriod)) {
        focusPeriods.push(currentPeriod);
    }
    
    return focusPeriods;
}

/**
 * Определяет, нужно ли начать новый период фокуса
 * @param {Object} currentPeriod - Текущий период
 * @param {Object} activity - Новая активность
 * @returns {boolean} - true если нужен новый период
 */
function shouldStartNewPeriod(currentPeriod, activity) {
    // Время с последней активности
    const timeSinceLastActivity = (activity.timestamp - currentPeriod.endTime) / 1000;
    
    // Если прошло больше максимального перерыва - новый период
    if (timeSinceLastActivity > FOCUS_ANALYZER_CONSTANTS.MAX_GAP_SECONDS) {
        return true;
    }
    
    // Если сменилось основное приложение и прошло достаточно времени - новый период
    if (activity.appName !== currentPeriod.primaryApp && timeSinceLastActivity > 10) {
        return true;
    }
    
    return false;
}

/**
 * Проверяет, является ли период валидным для отображения
 * @param {Object} period - Период фокуса
 * @returns {boolean} - true если период валиден
 */
function isValidPeriod(period) {
    const duration = (period.endTime - period.startTime) / 1000;
    return duration >= FOCUS_ANALYZER_CONSTANTS.MIN_FOCUS_PERIOD_SECONDS;
}

/**
 * Обновляет основное приложение периода
 * @param {Object} period - Период фокуса
 * @param {Object} activity - Новая активность
 */
function updatePrimaryApp(period, activity) {
    // Подсчитываем активности по приложениям
    const appCounts = {};
    period.activities.forEach(act => {
        appCounts[act.appName] = (appCounts[act.appName] || 0) + 1;
    });
    
    // Находим приложение с наибольшим количеством активностей
    let maxCount = 0;
    let primaryApp = period.primaryApp;
    
    for (const [app, count] of Object.entries(appCounts)) {
        const priority = FOCUS_ANALYZER_CONSTANTS.PROCESS_PRIORITIES[app] || 0;
        const score = count + priority * 0.1; // Учитываем приоритет
        
        if (score > maxCount) {
            maxCount = score;
            primaryApp = app;
        }
    }
    
    period.primaryApp = primaryApp;
}

/**
 * Обогащает периоды фокуса дополнительными данными
 * @param {Array} focusPeriods - Периоды фокуса
 * @param {Array} mouseActivities - Данные мыши
 * @param {Array} resourceData - Данные ресурсов
 * @param {Array} browserActivities - Данные браузера
 * @returns {Array} - Обогащённые периоды
 */
function enrichPeriodsWithAdditionalData(focusPeriods, mouseActivities, resourceData, browserActivities) {
    return focusPeriods.map(period => {
        const duration = Math.round((period.endTime - period.startTime) / 1000);
        
        // Находим данные мыши для этого периода
        const periodMouseData = mouseActivities.filter(mouse => {
            const mouseTime = new Date(mouse.timestamp);
            return mouseTime >= period.startTime && mouseTime <= period.endTime;
        });
        
        // Находим данные ресурсов для этого периода
        const periodResourceData = resourceData.filter(resource => {
            const resourceTime = new Date(resource.timestamp);
            return resourceTime >= period.startTime && resourceTime <= period.endTime;
        });
        
        // Находим данные браузера для этого периода
        const periodBrowserData = browserActivities.filter(browser => {
            const browserTime = new Date(browser.timestamp);
            return browserTime >= period.startTime && browserTime <= period.endTime;
        });
        
        // Анализируем активность мыши
        const mouseAnalysis = analyzeMouseActivity(periodMouseData);
        
        // Анализируем ресурсы
        const resourceAnalysis = analyzeResourceUsage(periodResourceData);
        
        // 🧠 НОВОЕ: Анализируем человеческий фокус с использованием системных метрик
        const humanFocusAnalysis = analyzeHumanFocusWithSystemMetrics(period, periodMouseData, periodResourceData);
        
        // Определяем статус активности (теперь с учетом человеческого фокуса)
        const bestActivity = period.activities.find(act => act.appName === period.primaryApp) || period.activities[0];
        const activityStatus = determineActivityStatusWithFocus(bestActivity, mouseAnalysis, resourceAnalysis, humanFocusAnalysis);
        
        // Создаём детальную информацию
        const details = createDetailedInfo(period.activities, periodBrowserData);
        
        console.log(`📊 Период фокуса: ${period.primaryApp}, ${formatDuration(duration)}, активностей: ${period.totalActivities}, мышь: ${mouseAnalysis.clicks}к/${mouseAnalysis.movements}д, 🧠 фокус: ${humanFocusAnalysis.score}% (${humanFocusAnalysis.level})`);
        
        return {
            timestamp: period.startTime,
            appName: period.primaryApp,
            windowTitle: bestActivity.window_title || bestActivity.title || '',
            details: details,
            duration: duration,
            mouseActivity: mouseAnalysis,
            cpuUsage: resourceAnalysis.cpu,
            ramUsage: resourceAnalysis.ram,
            gpuUsage: resourceAnalysis.gpu,
            networkUsage: resourceAnalysis.network,
            // 🧠 НОВОЕ: Добавляем анализ человеческого фокуса
            humanFocus: humanFocusAnalysis,
            status: activityStatus,
            rawActivities: period.activities,
            activitiesCount: period.totalActivities,
            isBackground: false, // Основные периоды не могут быть фоновыми
            apps: Array.from(period.apps),
            startTime: period.startTime,
            endTime: period.endTime
        };
    });
}

/**
 * Определяет статус активности с учетом человеческого фокуса
 * @param {Object} activity - Активность
 * @param {Object} mouseAnalysis - Анализ мыши
 * @param {Object} resourceAnalysis - Анализ ресурсов
 * @param {Object} humanFocusAnalysis - Анализ человеческого фокуса
 * @returns {string} - Статус активности
 */
function determineActivityStatusWithFocus(activity, mouseAnalysis, resourceAnalysis, humanFocusAnalysis) {
    const appName = activity.app_name || activity.application;
    
    if (isBackgroundProcess(appName)) {
        return 'Фон';
    }
    
    // Используем оценку человеческого фокуса для более точного определения статуса
    if (humanFocusAnalysis.score >= 80) {
        return 'Высокий фокус';
    } else if (humanFocusAnalysis.score >= 60) {
        return 'Средний фокус';
    } else if (humanFocusAnalysis.score >= 40) {
        return 'Низкий фокус';
    } else if (mouseAnalysis.isActive) {
        return 'Активен';
    } else if (resourceAnalysis.cpu.value > 20) {
        return 'Работает';
    } else {
        return 'Пассивен';
    }
}

/**
 * Выбирает лучшую активность по приоритету
 * @param {Array} activities - Массив активностей
 * @returns {Object} - Лучшая активность
 */
function selectBestActivity(activities) {
    // Исключаем фоновые процессы
    const nonBackgroundActivities = activities.filter(activity => {
        const appName = activity.app_name || activity.application;
        return !isBackgroundProcess(appName);
    });
    
    // Если есть не-фоновые процессы, выбираем из них
    const candidateActivities = nonBackgroundActivities.length > 0 ? nonBackgroundActivities : activities;
    
    // Сортируем по приоритету
    candidateActivities.sort((a, b) => {
        const priorityA = FOCUS_ANALYZER_CONSTANTS.PROCESS_PRIORITIES[a.app_name || a.application] || 0;
        const priorityB = FOCUS_ANALYZER_CONSTANTS.PROCESS_PRIORITIES[b.app_name || b.application] || 0;
        return priorityB - priorityA;
    });
    
    return candidateActivities[0];
}

/**
 * Вычисляет общую длительность группы активностей
 * @param {Array} activities - Массив активностей
 * @returns {number} - Длительность в секундах
 */
function calculateTotalDuration(activities) {
    if (!activities || activities.length === 0) {
        return 1; // Минимум 1 секунда
    }
    
    // Если только одна активность, используем её длительность (но не более 60 секунд)
    if (activities.length === 1) {
        const duration = parseInt(activities[0].duration) || 1;
        return Math.min(duration, 60);
    }
    
    // Для нескольких активностей вычисляем реальное время периода
    const timestamps = activities.map(activity => new Date(activity.timestamp));
    const minTime = Math.min(...timestamps);
    const maxTime = Math.max(...timestamps);
    
    // Реальная длительность = разница между первой и последней записью
    const realDuration = Math.round((maxTime - minTime) / 1000);
    
    // Возвращаем реальную длительность, но не менее 1 секунды и не более разумного максимума
    return Math.max(realDuration, 1);
}

/**
 * Анализирует активность мыши
 * @param {Array} mouseData - Данные мыши
 * @returns {Object} - Анализ активности мыши
 */
function analyzeMouseActivity(mouseData) {
    if (!mouseData || mouseData.length === 0) {
        return {
            clicks: 0,
            movements: 0,
            isActive: false,
            activityLevel: 'Нет данных'
        };
    }
    
    const totalClicks = mouseData.reduce((sum, mouse) => sum + (mouse.mouse_clicks || 0), 0);
    const totalMovements = mouseData.reduce((sum, mouse) => sum + (mouse.mouse_movements || 0), 0);
    
    const isActive = totalClicks > 0 || totalMovements >= 5;
    let activityLevel = 'Низкая';
    
    if (totalClicks >= 5 || totalMovements >= 20) {
        activityLevel = 'Высокая';
    } else if (totalClicks >= 2 || totalMovements >= 10) {
        activityLevel = 'Средняя';
    }
    
    return {
        clicks: totalClicks,
        movements: totalMovements,
        isActive: isActive,
        activityLevel: activityLevel
    };
}

/**
 * Анализирует использование ресурсов
 * @param {Array} resourceData - Данные ресурсов
 * @returns {Object} - Анализ ресурсов
 */
function analyzeResourceUsage(resourceData) {
    if (!resourceData || resourceData.length === 0) {
        return {
            cpu: { value: 0, level: 'Нет данных' },
            ram: { value: 0, level: 'Нет данных' },
            gpu: { value: 0, level: 'Нет данных' },
            network: { value: 0, level: 'Нет данных' }
        };
    }
    
    // Вычисляем средние значения для всех ресурсов
    const avgCpu = resourceData.reduce((sum, res) => sum + (res.cpu_percent || res.cpu || 0), 0) / resourceData.length;
    const avgRam = resourceData.reduce((sum, res) => sum + (res.ram_percent || res.memory || 0), 0) / resourceData.length;
    const avgGpu = resourceData.reduce((sum, res) => sum + (res.gpu_percent || res.gpu || 0), 0) / resourceData.length;
    const avgNetwork = resourceData.reduce((sum, res) => sum + (res.network_usage || res.network || 0), 0) / resourceData.length;
    
    return {
        cpu: {
            value: Math.round(avgCpu),
            level: getCpuLevel(avgCpu)
        },
        ram: {
            value: Math.round(avgRam),
            level: getRamLevel(avgRam)
        },
        gpu: {
            value: Math.round(avgGpu),
            level: getGpuLevel(avgGpu)
        },
        network: {
            value: Math.round(avgNetwork),
            level: getNetworkLevel(avgNetwork)
        }
    };
}

/**
 * Определяет уровень загрузки ЦП
 * @param {number} cpuPercent - Процент загрузки ЦП
 * @returns {string} - Уровень загрузки
 */
function getCpuLevel(cpuPercent) {
    if (cpuPercent >= 80) return 'Критический';
    if (cpuPercent >= 60) return 'Высокий';
    if (cpuPercent >= 30) return 'Средний';
    return 'Низкий';
}

/**
 * Определяет уровень использования ОЗУ
 * @param {number} ramPercent - Процент использования ОЗУ
 * @returns {string} - Уровень использования
 */
function getRamLevel(ramPercent) {
    if (ramPercent >= 85) return 'Критический';
    if (ramPercent >= 70) return 'Высокий';
    if (ramPercent >= 50) return 'Средний';
    return 'Низкий';
}

/**
 * Определяет уровень загрузки GPU
 * @param {number} gpuPercent - Процент загрузки GPU
 * @returns {string} - Уровень загрузки
 */
function getGpuLevel(gpuPercent) {
    if (gpuPercent >= 90) return 'Критический';
    if (gpuPercent >= 70) return 'Высокий';
    if (gpuPercent >= 30) return 'Средний';
    return 'Низкий';
}

/**
 * Определяет уровень сетевой активности
 * @param {number} networkPercent - Процент сетевой активности
 * @returns {string} - Уровень активности
 */
function getNetworkLevel(networkPercent) {
    if (networkPercent >= 80) return 'Критический';
    if (networkPercent >= 60) return 'Высокий';
    if (networkPercent >= 20) return 'Средний';
    return 'Низкий';
}

/**
 * Определяет статус активности
 * @param {Object} activity - Активность
 * @param {Object} mouseAnalysis - Анализ мыши
 * @param {Object} resourceAnalysis - Анализ ресурсов
 * @returns {string} - Статус активности
 */
function determineActivityStatus(activity, mouseAnalysis, resourceAnalysis) {
    const appName = activity.app_name || activity.application;
    
    if (isBackgroundProcess(appName)) {
        return 'Фон';
    }
    
    if (mouseAnalysis.isActive) {
        return 'Активен';
    }
    
    if (resourceAnalysis.cpu.value > 20) {
        return 'Работает';
    }
    
    return 'Пассивен';
}

/**
 * Создает детальную информацию об активности
 * @param {Array} activities - Активности
 * @param {Array} browserData - Данные браузера
 * @returns {string} - Детальная информация
 */
function createDetailedInfo(activities, browserData) {
    const details = [];
    
    // Добавляем информацию о процессах
    const uniqueProcesses = [...new Set(activities.map(a => a.app_name || a.application))];
    if (uniqueProcesses.length > 1) {
        details.push(`${uniqueProcesses.length} процессов`);
    }
    
    // Добавляем информацию о заголовках окон
    const windowTitles = activities
        .map(a => a.window_title || a.title)
        .filter(title => title && title.trim() !== '')
        .slice(0, 2);
    
    if (windowTitles.length > 0) {
        details.push(windowTitles.join(', '));
    }
    
    // Добавляем информацию о браузере
    if (browserData && browserData.length > 0) {
        const urls = browserData.map(b => b.url || b.domain).filter(url => url).slice(0, 1);
        if (urls.length > 0) {
            details.push(`URL: ${urls[0]}`);
        }
    }
    
    return details.join(' | ') || 'Без дополнительной информации';
}

/**
 * Проверяет, является ли процесс фоновым
 * @param {string} appName - Название приложения
 * @returns {boolean} - true если фоновый
 */
function isBackgroundProcess(appName) {
    if (!appName) return false;
    
    return FOCUS_ANALYZER_CONSTANTS.BACKGROUND_PROCESSES.some(bg => {
        const appNameLower = appName.toLowerCase();
        const bgLower = bg.toLowerCase();
        return appNameLower === bgLower || 
               appNameLower.includes(bgLower) || 
               bgLower.includes(appNameLower);
    });
}

/**
 * Обновляет таблицу фокуса результатами анализа
 * @param {Array} mergedData - Объединенные данные
 */
function updateFocusTable(mergedData) {
    const tbody = document.querySelector('#window-focus-table tbody');
    
    if (!mergedData || mergedData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center text-muted">
                    <i class="bi bi-info-circle"></i> 
                    Нет данных для отображения за выбранную дата
                </td>
            </tr>
        `;
        return;
    }
    
    // Добавляем общую статистику времени в начало таблицы
    const totalStats = calculateTotalFocusStats(mergedData);
    
    // Проверяем режим отображения
    const displayMode = getDisplayMode();
    
    if (displayMode === 'smart-spoilers') {
        // Используем умный анализатор спойлеров
        const bigSpoilers = analyzeSmartSpoilers(mergedData);
        updateTableWithSmartSpoilers(bigSpoilers, mergedData);
    } else {
        // Используем стандартное отображение
        updateTableStandard(mergedData);
    }
    
    // Добавляем общую статистику в начало таблицы
    addTotalStatsToTable(totalStats);
    
    console.log(`📊 Таблица фокуса обновлена в режиме: ${displayMode}`, totalStats);
}

/**
 * Вычисляет общую статистику времени фокуса
 * @param {Array} mergedData - Данные периодов фокуса
 * @returns {Object} - Статистика времени
 */
function calculateTotalFocusStats(mergedData) {
    if (!mergedData || mergedData.length === 0) {
        return {
            totalTime: 0,
            focusTime: 0,
            productiveTime: 0,
            periodsCount: 0,
            appsCount: 0,
            focusEfficiency: 0,
            // 🧠 НОВОЕ: Статистика человеческого фокуса
            humanFocusStats: {
                averageScore: 0,
                highFocusPeriods: 0,
                mediumFocusPeriods: 0,
                lowFocusPeriods: 0,
                totalFocusTime: 0,
                averageConfidence: 0
            }
        };
    }
    
    let totalTime = 0;
    let focusTime = 0;
    let productiveTime = 0;
    const uniqueApps = new Set();
    const productiveApps = new Set();
    
    // 🧠 НОВОЕ: Переменные для статистики человеческого фокуса
    let totalHumanFocusScore = 0;
    let totalHumanFocusTime = 0;
    let totalConfidence = 0;
    let highFocusPeriods = 0;
    let mediumFocusPeriods = 0;
    let lowFocusPeriods = 0;
    let veryLowFocusPeriods = 0;
    
    // Суммируем время фокуса напрямую из периодов
    mergedData.forEach(period => {
        // Время фокуса - это продолжительность каждого периода
        const periodDuration = period.duration || 0;
        focusTime += periodDuration;
        totalTime += periodDuration; // Общее время = сумма всех периодов фокуса
        
        uniqueApps.add(period.appName);
        
        // Проверяем продуктивность приложения
        if (isProductiveApplication(period.appName)) {
            productiveTime += periodDuration;
            productiveApps.add(period.appName);
        }
        
        // 🧠 НОВОЕ: Обрабатываем статистику человеческого фокуса
        if (period.humanFocus) {
            const focusScore = period.humanFocus.score || 0;
            const confidence = period.humanFocus.confidence || 0;
            
            totalHumanFocusScore += focusScore;
            totalConfidence += confidence;
            
            // Классифицируем периоды по уровню фокуса
            if (focusScore >= 80) {
                highFocusPeriods++;
                totalHumanFocusTime += periodDuration;
            } else if (focusScore >= 60) {
                mediumFocusPeriods++;
                totalHumanFocusTime += periodDuration * 0.7; // Частично засчитываем время
            } else if (focusScore >= 40) {
                lowFocusPeriods++;
                totalHumanFocusTime += periodDuration * 0.4; // Частично засчитываем время
            } else {
                veryLowFocusPeriods++;
                // Очень низкий фокус не засчитывается в общее время фокуса
            }
        }
    });
    
    const focusEfficiency = totalTime > 0 ? Math.round((focusTime / totalTime) * 100) : 100; // Для периодов фокуса это всегда 100%
    const productiveEfficiency = focusTime > 0 ? Math.round((productiveTime / focusTime) * 100) : 0;
    
    // 🧠 НОВОЕ: Вычисляем статистику человеческого фокуса
    const averageHumanFocusScore = mergedData.length > 0 ? Math.round(totalHumanFocusScore / mergedData.length) : 0;
    const averageConfidence = mergedData.length > 0 ? Math.round((totalConfidence / mergedData.length) * 100) : 0;
    const humanFocusEfficiency = totalTime > 0 ? Math.round((totalHumanFocusTime / totalTime) * 100) : 0;
    
    console.log(`📊 Статистика фокуса: периодов ${mergedData.length}, общее время ${formatDuration(totalTime)}, время фокуса ${formatDuration(focusTime)}, продуктивное время ${formatDuration(productiveTime)}`);
    console.log(`🧠 Человеческий фокус: средняя оценка ${averageHumanFocusScore}%, высокий фокус ${highFocusPeriods} периодов, эффективность ${humanFocusEfficiency}%`);
    
    return {
        totalTime,
        focusTime,
        productiveTime,
        periodsCount: mergedData.length,
        appsCount: uniqueApps.size,
        productiveAppsCount: productiveApps.size,
        focusEfficiency,
        productiveEfficiency,
        // 🧠 НОВОЕ: Статистика человеческого фокуса
        humanFocusStats: {
            averageScore: averageHumanFocusScore,
            highFocusPeriods: highFocusPeriods,
            mediumFocusPeriods: mediumFocusPeriods,
            lowFocusPeriods: lowFocusPeriods,
            veryLowFocusPeriods: veryLowFocusPeriods,
            totalFocusTime: Math.round(totalHumanFocusTime),
            averageConfidence: averageConfidence,
            humanFocusEfficiency: humanFocusEfficiency
        }
    };
}

/**
 * Добавляет общую статистику в начало таблицы
 * @param {Object} stats - Статистика времени
 */
function addTotalStatsToTable(stats) {
    const tbody = document.querySelector('#window-focus-table tbody');
    
    // Создаем строку с общей статистикой
    const statsRow = document.createElement('tr');
    statsRow.className = 'table-info';
    statsRow.innerHTML = `
        <td colspan="11" class="p-3">
            <div class="row">
                <div class="col-md-12">
                    <h6 class="mb-3">
                        <i class="bi bi-graph-up me-2"></i>
                        Общая статистика фокуса
                    </h6>
                    <div class="row g-3">
                        <div class="col-md-3">
                            <div class="card border-primary">
                                <div class="card-body text-center p-2">
                                    <h5 class="card-title text-primary mb-1">${formatDuration(stats.totalTime)}</h5>
                                    <small class="text-muted">Общее время</small>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="card border-success">
                                <div class="card-body text-center p-2">
                                    <h5 class="card-title text-success mb-1">${formatDuration(stats.focusTime)}</h5>
                                    <small class="text-muted">Время фокуса</small>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="card border-warning">
                                <div class="card-body text-center p-2">
                                    <h5 class="card-title text-warning mb-1">${formatDuration(stats.productiveTime)}</h5>
                                    <small class="text-muted">Продуктивное время</small>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="card border-info">
                                <div class="card-body text-center p-2">
                                    <h5 class="card-title text-info mb-1">${stats.periodsCount}</h5>
                                    <small class="text-muted">Периодов фокуса</small>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- 🧠 НОВОЕ: Блок статистики человеческого фокуса -->
                    <div class="row g-3 mt-3">
                        <div class="col-md-12">
                            <div class="card border-primary">
                                <div class="card-header bg-primary text-white">
                                    <h6 class="mb-0">
                                        <i class="bi bi-brain me-2"></i>
                                        Анализ человеческого фокуса
                                    </h6>
                                </div>
                                <div class="card-body">
                                    <div class="row g-3">
                                        <div class="col-md-2">
                                            <div class="text-center">
                                                <h5 class="text-primary mb-1">${stats.humanFocusStats.averageScore}%</h5>
                                                <small class="text-muted">Средняя оценка</small>
                                            </div>
                                        </div>
                                        <div class="col-md-2">
                                            <div class="text-center">
                                                <h5 class="text-success mb-1">${stats.humanFocusStats.highFocusPeriods}</h5>
                                                <small class="text-muted">Высокий фокус</small>
                                            </div>
                                        </div>
                                        <div class="col-md-2">
                                            <div class="text-center">
                                                <h5 class="text-primary mb-1">${stats.humanFocusStats.mediumFocusPeriods}</h5>
                                                <small class="text-muted">Средний фокус</small>
                                            </div>
                                        </div>
                                        <div class="col-md-2">
                                            <div class="text-center">
                                                <h5 class="text-warning mb-1">${stats.humanFocusStats.lowFocusPeriods}</h5>
                                                <small class="text-muted">Низкий фокус</small>
                                            </div>
                                        </div>
                                        <div class="col-md-2">
                                            <div class="text-center">
                                                <h5 class="text-info mb-1">${formatDuration(stats.humanFocusStats.totalFocusTime)}</h5>
                                                <small class="text-muted">Качественное время</small>
                                            </div>
                                        </div>
                                        <div class="col-md-2">
                                            <div class="text-center">
                                                <h5 class="text-secondary mb-1">${stats.humanFocusStats.averageConfidence}%</h5>
                                                <small class="text-muted">Уверенность</small>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="row g-3 mt-2">
                        <div class="col-md-3">
                            <div class="d-flex align-items-center">
                                <i class="bi bi-bullseye me-2 text-primary"></i>
                                <div>
                                    <strong>Эффективность фокуса:</strong>
                                    <span class="badge ${stats.focusEfficiency >= 70 ? 'bg-success' : stats.focusEfficiency >= 50 ? 'bg-warning' : 'bg-danger'} ms-1">
                                        ${stats.focusEfficiency}%
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="d-flex align-items-center">
                                <i class="bi bi-award me-2 text-success"></i>
                                <div>
                                    <strong>Продуктивность:</strong>
                                    <span class="badge ${stats.productiveEfficiency >= 70 ? 'bg-success' : stats.productiveEfficiency >= 50 ? 'bg-warning' : 'bg-danger'} ms-1">
                                        ${stats.productiveEfficiency}%
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="d-flex align-items-center">
                                <i class="bi bi-brain me-2 text-primary"></i>
                                <div>
                                    <strong>Человеческий фокус:</strong>
                                    <span class="badge ${stats.humanFocusStats.humanFocusEfficiency >= 70 ? 'bg-success' : stats.humanFocusStats.humanFocusEfficiency >= 50 ? 'bg-warning' : 'bg-danger'} ms-1">
                                        ${stats.humanFocusStats.humanFocusEfficiency}%
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="d-flex align-items-center">
                                <i class="bi bi-apps me-2 text-info"></i>
                                <div>
                                    <strong>Приложений:</strong>
                                    <span class="badge bg-info ms-1">${stats.appsCount} (${stats.productiveAppsCount} продуктивных)</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </td>
    `;
    
    // Добавляем строку в начало таблицы
    tbody.insertBefore(statsRow, tbody.firstChild);
}

/**
 * Проверяет, является ли приложение продуктивным
 * @param {string} appName - Название приложения
 * @returns {boolean} - true если приложение продуктивное
 */
function isProductiveApplication(appName) {
    if (!appName) return false;
    
    const productiveApps = [
        'Cursor.exe',
        'Code.exe',
        'notepad.exe',
        'Notepad++.exe',
        'sublime_text.exe',
        'atom.exe',
        'WebStorm.exe',
        'IntelliJ IDEA.exe',
        'Eclipse.exe',
        'msedge.exe',
        'firefox.exe',
        'brave.exe',
        'chrome.exe',
        'Word.exe',
        'Excel.exe',
        'PowerPoint.exe',
        'Outlook.exe',
        'Teams.exe',
        'Zoom.exe',
        'Skype.exe',
        'CalculatorApp.exe'
    ];
    
    return productiveApps.some(app => {
        const appNameLower = appName.toLowerCase();
        const productiveAppLower = app.toLowerCase();
        return appNameLower === productiveAppLower || 
               appNameLower.includes(productiveAppLower.replace('.exe', '')) ||
               productiveAppLower.includes(appNameLower);
    });
}

/**
 * Получает текущий режим отображения
 * @returns {string} - Режим отображения
 */
function getDisplayMode() {
    const modeSelect = document.getElementById('focus-display-mode');
    return modeSelect ? modeSelect.value : 'standard';
}

/**
 * Обновляет таблицу в стандартном режиме
 * @param {Array} mergedData - Объединенные данные (периоды фокуса)
 */
function updateTableStandard(mergedData) {
    const tbody = document.querySelector('#window-focus-table tbody');
    
    // Применяем сортировку
    const sortedData = applySorting(mergedData);
    
    tbody.innerHTML = '';
    
    // Отображаем каждый период фокуса как отдельную группу
    sortedData.forEach((period, periodIndex) => {
        // Создаём заголовок периода
        const groupRow = createGroupHeader(period, periodIndex);
        tbody.appendChild(groupRow);
        
        // Создаём строку с деталями периода (изначально скрыта)
        const detailRow = createFocusTableRow(period, 0, periodIndex);
        tbody.appendChild(detailRow);
    });
    
    console.log(`📊 Отображено ${sortedData.length} периодов фокуса в стандартном режиме`);
}

/**
 * Применяет сортировку к данным
 * @param {Array} data - Данные для сортировки
 * @returns {Array} - Отсортированные данные
 */
function applySorting(data) {
    const sortSelect = document.getElementById('chronology-sort');
    const sortOrder = sortSelect ? sortSelect.value : 'desc';
    
    return [...data].sort((a, b) => {
        const timeA = new Date(a.timestamp);
        const timeB = new Date(b.timestamp);
        
        return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
    });
}

/**
 * Создает заголовок группы для периода фокуса
 * @param {Object} period - Период фокуса
 * @param {number} groupIndex - Индекс группы
 * @returns {HTMLElement} - Элемент строки заголовка
 */
function createGroupHeader(period, groupIndex) {
    const row = document.createElement('tr');
    row.className = 'table-primary group-header';
    row.style.cursor = 'pointer';
    row.onclick = () => toggleGroup(groupIndex);
    
    // Время начала и окончания периода
    const startTime = new Date(period.startTime).toLocaleTimeString('ru-RU');
    const endTime = new Date(period.endTime).toLocaleTimeString('ru-RU');
    const duration = formatDuration(period.duration);
    
    // Определяем уровень активности периода
    const activityLevel = period.mouseActivity.activityLevel;
    const activityBadge = getActivityBadge(activityLevel);
    
    // Создаем хронологическую последовательность приложений
    const appSequence = createAppSequence(period);
    
    // Создаем детальную статистику активности
    const activityStats = `
        <div class="activity-stats d-flex align-items-center gap-2">
            <div class="stat-item">
                <i class="bi bi-mouse2 text-primary"></i>
                <span class="badge bg-light text-dark">${period.mouseActivity.clicks}к/${period.mouseActivity.movements}д</span>
            </div>
            <div class="stat-item">
                <i class="bi bi-cpu text-info"></i>
                <span class="badge ${getResourceClass(period.cpuUsage.level)}">${period.cpuUsage.value}%</span>
            </div>
            <div class="stat-item">
                <i class="bi bi-memory text-warning"></i>
                <span class="badge ${getRamResourceClass(period.ramUsage.level)}">${period.ramUsage.value}%</span>
            </div>
        </div>
    `;
    
    // Отладочная информация
    console.log(`📋 Заголовок периода ${groupIndex}:`, {
        период: `${startTime} - ${endTime}`,
        активностей: period.activitiesCount,
        длительность: duration,
        последовательность: appSequence.text
    });
    
    row.innerHTML = `
        <td colspan="8" class="p-3">
            <div class="row align-items-center">
                <div class="col-md-8">
                    <div class="d-flex align-items-center">
                        <i class="bi bi-chevron-right me-2 group-toggle-icon" id="toggle-icon-${groupIndex}"></i>
                        <div class="flex-grow-1">
                            <div class="d-flex align-items-center mb-2">
                                <i class="bi bi-clock-history me-2 text-primary"></i>
                                <h6 class="mb-0 me-3">
                                    Период фокуса: ${startTime} - ${endTime}
                                    <span class="badge bg-light text-dark ms-2">${duration}</span>
                                </h6>
                                ${activityBadge}
                            </div>
                            <div class="d-flex align-items-center">
                                <i class="bi bi-diagram-3 me-2 text-secondary"></i>
                                <div class="app-sequence">
                                    <div class="app-timeline">
                                        ${appSequence.html}
                                    </div>
                                    <small class="text-muted mt-1">
                                        <i class="bi bi-layers"></i> ${period.activitiesCount} активностей
                                    </small>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-md-4 text-end">
                    <div class="d-flex flex-column align-items-end gap-2">
                        <span class="badge bg-info">${period.activitiesCount} активностей</span>
                        ${activityStats}
                    </div>
                </div>
            </div>
        </td>
    `;
    
    return row;
}

/**
 * Создает хронологическую последовательность приложений
 * @param {Object} period - Период фокуса
 * @returns {Object} - Объект с HTML и текстовым представлением
 */
function createAppSequence(period) {
    if (!period.activities || period.activities.length === 0) {
        return {
            html: `<span class="app-item">${period.appName}</span>`,
            text: period.appName
        };
    }
    
    // Сортируем активности по времени
    const sortedActivities = period.activities.sort((a, b) => 
        new Date(a.timestamp) - new Date(b.timestamp)
    );
    
    // Группируем последовательные одинаковые приложения
    const appGroups = [];
    let currentGroup = null;
    
    for (const activity of sortedActivities) {
        const appName = activity.appName || activity.app_name || activity.application;
        
        if (!currentGroup || currentGroup.appName !== appName) {
            // Начинаем новую группу
            if (currentGroup) {
                appGroups.push(currentGroup);
            }
            currentGroup = {
                appName: appName,
                startTime: new Date(activity.timestamp),
                endTime: new Date(activity.timestamp),
                count: 1,
                activities: [activity]
            };
        } else {
            // Продолжаем текущую группу
            currentGroup.endTime = new Date(activity.timestamp);
            currentGroup.count++;
            currentGroup.activities.push(activity);
        }
    }
    
    // Добавляем последнюю группу
    if (currentGroup) {
        appGroups.push(currentGroup);
    }
    
    // Создаем HTML для последовательности
    const appSequenceHtml = appGroups.map((group, index) => {
        const appIcon = getAppIcon(group.appName);
        const isProductive = isProductiveApplication(group.appName);
        const productivityClass = isProductive ? 'text-success' : 'text-warning';
        const productivityIcon = isProductive ? 'bi-check-circle' : 'bi-exclamation-triangle';
        
        // Время работы с приложением
        const duration = Math.round((group.endTime - group.startTime) / 1000) + 1;
        const timeRange = `${group.startTime.toLocaleTimeString('ru-RU', {hour: '2-digit', minute: '2-digit'})} - ${group.endTime.toLocaleTimeString('ru-RU', {hour: '2-digit', minute: '2-digit'})}`;
        
        const arrow = index < appGroups.length - 1 ? '<i class="bi bi-arrow-right mx-2 text-muted"></i>' : '';
        
        return `
            <span class="app-item d-inline-flex align-items-center me-1" 
                  title="${group.appName}&#10;${timeRange}&#10;${group.count} активностей&#10;${formatDuration(duration)}">
                <i class="bi ${appIcon} me-1" style="color: ${getAppColor(group.appName)};"></i>
                <strong>${getShortAppName(group.appName)}</strong>
                <i class="bi ${productivityIcon} ms-1 ${productivityClass}" style="font-size: 0.8em;"></i>
                <span class="badge bg-light text-dark ms-1" style="font-size: 0.7em;">${formatDuration(duration)}</span>
            </span>${arrow}
        `;
    }).join('');
    
    // Создаем текстовое представление
    const appSequenceText = appGroups.map(group => group.appName).join(' → ');
    
    return {
        html: appSequenceHtml,
        text: appSequenceText
    };
}

/**
 * Получает иконку для приложения
 * @param {string} appName - Название приложения
 * @returns {string} - CSS класс иконки
 */
function getAppIcon(appName) {
    if (!appName) return 'bi-app';
    
    const appLower = appName.toLowerCase();
    
    if (appLower.includes('chrome') || appLower.includes('firefox') || 
        appLower.includes('edge') || appLower.includes('opera') || appLower.includes('browser')) {
        return 'bi-globe';
    } else if (appLower.includes('code') || appLower.includes('studio') || 
               appLower.includes('dev') || appLower.includes('cursor')) {
        return 'bi-code-slash';
    } else if (appLower.includes('office') || appLower.includes('word') || 
               appLower.includes('excel') || appLower.includes('powerpoint')) {
        return 'bi-file-earmark-text';
    } else if (appLower.includes('teams') || appLower.includes('zoom') || 
               appLower.includes('skype') || appLower.includes('meet')) {
        return 'bi-camera-video';
    } else if (appLower.includes('telegram') || appLower.includes('whatsapp') || 
               appLower.includes('discord') || appLower.includes('slack')) {
        return 'bi-chat-dots';
    } else if (appLower.includes('youtube') || appLower.includes('vlc') || 
               appLower.includes('media') || appLower.includes('player')) {
        return 'bi-play-circle';
    } else if (appLower.includes('calculator') || appLower.includes('calc')) {
        return 'bi-calculator';
    } else if (appLower.includes('notepad') || appLower.includes('note')) {
        return 'bi-journal-text';
    } else if (appLower.includes('rdclient') || appLower.includes('remote')) {
        return 'bi-display';
    }
    
    return 'bi-app';
}

/**
 * Получает цвет для приложения
 * @param {string} appName - Название приложения
 * @returns {string} - CSS цвет
 */
function getAppColor(appName) {
    if (!appName) return '#6c757d';
    
    const appLower = appName.toLowerCase();
    
    if (appLower.includes('chrome') || appLower.includes('browser')) {
        return '#4285f4';
    } else if (appLower.includes('firefox')) {
        return '#ff7139';
    } else if (appLower.includes('edge')) {
        return '#0078d4';
    } else if (appLower.includes('code') || appLower.includes('cursor')) {
        return '#007acc';
    } else if (appLower.includes('office') || appLower.includes('word')) {
        return '#d83b01';
    } else if (appLower.includes('teams')) {
        return '#6264a7';
    } else if (appLower.includes('telegram')) {
        return '#0088cc';
    } else if (appLower.includes('youtube')) {
        return '#ff0000';
    } else if (appLower.includes('rdclient')) {
        return '#0078d4';
    }
    
    return '#6c757d';
}

/**
 * Получает короткое название приложения
 * @param {string} appName - Полное название приложения
 * @returns {string} - Короткое название
 */
function getShortAppName(appName) {
    if (!appName) return 'Неизвестно';
    
    const appLower = appName.toLowerCase();
    
    if (appLower.includes('chrome')) return 'Chrome';
    if (appLower.includes('firefox')) return 'Firefox';
    if (appLower.includes('edge')) return 'Edge';
    if (appLower.includes('telegram')) return 'Telegram';
    if (appLower.includes('code')) return 'VS Code';
    if (appLower.includes('cursor')) return 'Cursor';
    if (appLower.includes('youtube')) return 'YouTube';
    if (appLower.includes('rdclient')) return 'RDP';
    if (appLower.includes('notepad')) return 'Notepad';
    if (appLower.includes('calculator')) return 'Calc';
    if (appLower.includes('teams')) return 'Teams';
    if (appLower.includes('zoom')) return 'Zoom';
    if (appLower.includes('skype')) return 'Skype';
    if (appLower.includes('word')) return 'Word';
    if (appLower.includes('excel')) return 'Excel';
    if (appLower.includes('powerpoint')) return 'PowerPoint';
    
    // Убираем .exe и берем первые 10 символов
    const cleanName = appName.replace('.exe', '').replace('.EXE', '');
    return cleanName.length > 10 ? cleanName.substring(0, 10) + '...' : cleanName;
}

/**
 * Переключает видимость группы
 * @param {number} groupIndex - Индекс группы
 */
function toggleGroup(groupIndex) {
    const rows = document.querySelectorAll(`[data-parent-group="${groupIndex}"]`);
    const toggleIcon = document.getElementById(`toggle-icon-${groupIndex}`);
    
    const isVisible = rows.length > 0 && rows[0].style.display !== 'none';
    
    rows.forEach(row => {
        row.style.display = isVisible ? 'none' : '';
    });
    
    // Обновляем иконку
    if (toggleIcon) {
        toggleIcon.className = isVisible ? 'bi bi-chevron-right group-toggle-icon' : 'bi bi-chevron-down group-toggle-icon';
    }
}

/**
 * Создает строку таблицы для периода фокуса
 * @param {Object} period - Период фокуса
 * @param {number} index - Индекс записи
 * @param {number} groupIndex - Индекс группы
 * @returns {HTMLElement} - Элемент строки таблицы
 */
function createFocusTableRow(period, index, groupIndex) {
    const row = document.createElement('tr');
    row.className = period.isBackground ? 'table-light' : '';
    row.dataset.parentGroup = groupIndex;
    row.style.display = 'none'; // Изначально скрыто
    
    // Форматируем время начала периода
    const timeStr = new Date(period.startTime).toLocaleTimeString('ru-RU');
    
    // Форматируем длительность периода
    const durationStr = formatDuration(period.duration);
    
    // Создаем профессиональные детали для периода
    const detailsHtml = createProfessionalPeriodDetails(period);
    
    // Определяем цвет статуса (обновлено для новых статусов фокуса)
    const statusClass = getStatusClassWithFocus(period.status);
    
    // Определяем цвет активности мыши
    const mouseClass = getMouseActivityClass(period.mouseActivity.activityLevel);
    
    // Определяем цвет ЦП
    const cpuClass = getResourceClass(period.cpuUsage.level);
    
    // Определяем цвет ОЗУ
    const ramClass = getRamResourceClass(period.ramUsage.level);
    
    // 🧠 НОВОЕ: Определяем цвет GPU
    const gpuClass = getResourceClass(period.gpuUsage?.level || 'Низкий');
    
    // 🧠 НОВОЕ: Определяем цвет сети
    const networkClass = getResourceClass(period.networkUsage?.level || 'Низкий');
    
    // 🧠 НОВОЕ: Определяем цвет человеческого фокуса
    const humanFocusClass = getHumanFocusClass(period.humanFocus?.level || 'Очень низкий');
    
    // Определяем иконку приложения
    let appIcon = 'bi-app';
    if (period.appName.toLowerCase().includes('chrome') || period.appName.toLowerCase().includes('firefox') || 
        period.appName.toLowerCase().includes('edge') || period.appName.toLowerCase().includes('opera')) {
        appIcon = 'bi-globe';
    } else if (period.appName.toLowerCase().includes('code') || period.appName.toLowerCase().includes('studio') || 
               period.appName.toLowerCase().includes('dev')) {
        appIcon = 'bi-code-slash';
    } else if (period.appName.toLowerCase().includes('office') || period.appName.toLowerCase().includes('word') || 
               period.appName.toLowerCase().includes('excel') || period.appName.toLowerCase().includes('powerpoint')) {
        appIcon = 'bi-file-earmark-text';
    } else if (period.appName.toLowerCase().includes('teams') || period.appName.toLowerCase().includes('zoom') || 
               period.appName.toLowerCase().includes('skype')) {
        appIcon = 'bi-camera-video';
    }
    
    // Проверяем продуктивность приложения
    const isProductive = isProductiveApplication(period.appName);
    const productivityIndicator = isProductive ? 
        '<i class="bi bi-check-circle text-success ms-1" title="Продуктивное приложение"></i>' : 
        '<i class="bi bi-exclamation-triangle text-warning ms-1" title="Развлекательное приложение"></i>';
    
    row.innerHTML = `
        <td class="font-monospace text-nowrap align-middle">
            <div class="d-flex align-items-center">
                <i class="bi bi-clock text-muted me-2"></i>
                <span class="fw-bold">${timeStr}</span>
            </div>
        </td>
        <td class="align-middle">
            <div class="d-flex align-items-center">
                <i class="bi ${appIcon} me-2 text-primary" style="font-size: 1.2em;"></i>
                <div class="flex-grow-1">
                    <div class="d-flex align-items-center">
                        <strong class="text-truncate" style="max-width: 200px;" title="${period.appName}">${period.appName}</strong>
                        ${productivityIndicator}
                    </div>
                    ${period.activitiesCount > 1 ? `<small class="text-muted"><i class="bi bi-layers"></i> ${period.activitiesCount} активностей</small>` : ''}
                </div>
            </div>
        </td>
        <td class="details-cell align-middle">
            ${detailsHtml}
        </td>
        <td class="text-center align-middle">
            <div class="d-flex flex-column align-items-center">
                <span class="badge bg-primary fs-6 px-3 py-2">${durationStr}</span>
                <small class="text-muted mt-1">Длительность</small>
            </div>
        </td>
        <td class="text-center align-middle">
            <div class="activity-indicator">
                <div class="d-flex justify-content-center align-items-center mb-1">
                    <i class="bi bi-mouse2 text-primary me-1"></i>
                    <span class="badge ${mouseClass} px-2 py-1">
                        ${period.mouseActivity.clicks}к/${period.mouseActivity.movements}д
                    </span>
                </div>
                <div class="activity-level-badge">
                    <span class="badge bg-light text-dark small">${period.mouseActivity.activityLevel}</span>
                </div>
            </div>
        </td>
        <td class="text-center align-middle">
            <div class="resource-indicator">
                <div class="d-flex justify-content-center align-items-center mb-1">
                    <i class="bi bi-cpu text-info me-1"></i>
                    <span class="badge ${cpuClass} px-2 py-1 fw-bold">${period.cpuUsage.value}%</span>
                </div>
                <div class="resource-level-badge">
                    <span class="badge bg-light text-dark small">${period.cpuUsage.level}</span>
                </div>
            </div>
        </td>
        <td class="text-center align-middle">
            <div class="resource-indicator">
                <div class="d-flex justify-content-center align-items-center mb-1">
                    <i class="bi bi-memory text-warning me-1"></i>
                    <span class="badge ${ramClass} px-2 py-1 fw-bold">${period.ramUsage.value}%</span>
                </div>
                <div class="resource-level-badge">
                    <span class="badge bg-light text-dark small">${period.ramUsage.level}</span>
                </div>
            </div>
        </td>
        <td class="text-center align-middle">
            <div class="resource-indicator">
                <div class="d-flex justify-content-center align-items-center mb-1">
                    <i class="bi bi-gpu-card text-success me-1"></i>
                    <span class="badge ${gpuClass} px-2 py-1 fw-bold">${period.gpuUsage?.value || 0}%</span>
                </div>
                <div class="resource-level-badge">
                    <span class="badge bg-light text-dark small">${period.gpuUsage?.level || 'Низкий'}</span>
                </div>
            </div>
        </td>
        <td class="text-center align-middle">
            <div class="resource-indicator">
                <div class="d-flex justify-content-center align-items-center mb-1">
                    <i class="bi bi-wifi text-info me-1"></i>
                    <span class="badge ${networkClass} px-2 py-1 fw-bold">${period.networkUsage?.value || 0}%</span>
                </div>
                <div class="resource-level-badge">
                    <span class="badge bg-light text-dark small">${period.networkUsage?.level || 'Низкий'}</span>
                </div>
            </div>
        </td>
        <td class="text-center align-middle">
            <div class="human-focus-indicator">
                <div class="d-flex justify-content-center align-items-center mb-1">
                    <i class="bi bi-brain text-primary me-1"></i>
                    <span class="badge ${humanFocusClass} px-2 py-1 fw-bold">${period.humanFocus?.score || 0}%</span>
                </div>
                <div class="focus-level-badge">
                    <span class="badge bg-light text-dark small">${period.humanFocus?.level || 'Очень низкий'}</span>
                </div>
                <div class="focus-confidence-badge mt-1">
                    <span class="badge bg-secondary small" title="Уверенность в оценке">
                        <i class="bi bi-shield-check"></i> ${Math.round((period.humanFocus?.confidence || 0) * 100)}%
                    </span>
                </div>
            </div>
        </td>
        <td class="text-center align-middle">
            <div class="status-indicator">
                <span class="badge ${statusClass} px-3 py-2 fs-6">${period.status}</span>
            </div>
        </td>
    `;
    
    return row;
}

/**
 * Получает CSS класс для статуса с учетом фокуса
 * @param {string} status - Статус
 * @returns {string} - CSS класс
 */
function getStatusClassWithFocus(status) {
    switch (status) {
        case 'Высокий фокус': return 'bg-success';
        case 'Средний фокус': return 'bg-primary';
        case 'Низкий фокус': return 'bg-warning';
        case 'Активен': return 'bg-info';
        case 'Работает': return 'bg-secondary';
        case 'Пассивен': return 'bg-light text-dark';
        case 'Фон': return 'bg-dark';
        default: return 'bg-light text-dark';
    }
}

/**
 * Получает CSS класс для человеческого фокуса
 * @param {string} level - Уровень фокуса
 * @returns {string} - CSS класс
 */
function getHumanFocusClass(level) {
    switch (level) {
        case 'Высокий': return 'bg-success';
        case 'Средний': return 'bg-primary';
        case 'Низкий': return 'bg-warning';
        case 'Очень низкий': return 'bg-danger';
        default: return 'bg-secondary';
    }
}

/**
 * Создает профессиональное отображение деталей периода фокуса
 * @param {Object} period - Период фокуса
 * @returns {string} - HTML деталей
 */
function createProfessionalPeriodDetails(period) {
    const details = [];
    
    // Заголовок окна
    if (period.windowTitle && period.windowTitle.trim() !== '') {
        details.push(`
            <div class="detail-item mb-1">
                <i class="bi bi-window me-1 text-info"></i>
                <small class="fw-bold">Окно:</small>
                <small class="text-truncate d-inline-block" style="max-width: 200px;" title="${period.windowTitle}">
                    ${period.windowTitle}
                </small>
            </div>
        `);
    }
    
    // Информация о количестве активностей в периоде
    if (period.activitiesCount > 1) {
        details.push(`
            <div class="detail-item mb-1">
                <i class="bi bi-cpu me-1 text-secondary"></i>
                <small class="fw-bold">Активности:</small>
                <small>${period.activitiesCount} активностей в периоде</small>
                <button class="btn btn-sm btn-outline-primary ms-1 p-0 px-1" 
                        onclick="showProcessDetails('${period.startTime}')" 
                        title="Подробная информация о периоде">
                    <i class="bi bi-search" style="font-size: 0.7em;"></i>
                </button>
            </div>
        `);
    }
    
    // Временной диапазон периода
    const startTime = new Date(period.startTime).toLocaleTimeString('ru-RU');
    const endTime = new Date(period.endTime).toLocaleTimeString('ru-RU');
    details.push(`
        <div class="detail-item mb-1">
            <i class="bi bi-clock me-1 text-primary"></i>
            <small class="fw-bold">Период:</small>
            <small>${startTime} - ${endTime}</small>
        </div>
    `);
    
    // Дополнительная информация из details
    if (period.details && period.details !== 'Без дополнительной информации') {
        const detailParts = period.details.split(' | ');
        
        detailParts.forEach(part => {
            if (part.trim()) {
                let icon = 'bi-info-circle';
                let label = 'Инфо';
                
                if (part.includes('активностей')) {
                    // Пропускаем, так как уже показали выше
                    return;
                } else if (part.startsWith('URL:')) {
                    icon = 'bi-globe';
                    label = 'URL';
                    part = part.replace('URL: ', '');
                } else if (part.includes('запусков')) {
                    icon = 'bi-play-circle';
                    label = 'Запуски';
                } else {
                    // Для остальной информации
                    icon = 'bi-info-circle';
                    label = 'Инфо';
                }
                
                details.push(`
                    <div class="detail-item mb-1">
                        <i class="bi ${icon} me-1 text-secondary"></i>
                        <small class="fw-bold">${label}:</small>
                        <small class="text-truncate d-inline-block" style="max-width: 200px;" title="${part}">
                            ${part}
                        </small>
                    </div>
                `);
            }
        });
    }
    
    // Если нет деталей, показываем базовую информацию
    if (details.length === 1) { // Только временной диапазон
        details.push(`
            <div class="detail-item">
                <i class="bi bi-dash-circle me-1 text-muted"></i>
                <small class="text-muted">Нет дополнительной информации</small>
            </div>
        `);
    }
    
    return `<div class="details-container">${details.join('')}</div>`;
}

/**
 * Получает CSS класс для статуса
 * @param {string} status - Статус
 * @returns {string} - CSS класс
 */
function getStatusClass(status) {
    switch (status) {
        case 'Активен': return 'bg-success';
        case 'Работает': return 'bg-primary';
        case 'Пассивен': return 'bg-warning';
        case 'Фон': return 'bg-secondary';
        default: return 'bg-light text-dark';
    }
}

/**
 * Получает CSS класс для активности мыши
 * @param {string} level - Уровень активности
 * @returns {string} - CSS класс
 */
function getMouseActivityClass(level) {
    switch (level) {
        case 'Высокая': return 'bg-success';
        case 'Средняя': return 'bg-warning';
        case 'Низкая': return 'bg-danger';
        default: return 'bg-secondary';
    }
}

/**
 * Получает CSS класс для ресурсов ЦП
 * @param {string} level - Уровень загрузки
 * @returns {string} - CSS класс
 */
function getResourceClass(level) {
    switch (level) {
        case 'Критический': return 'bg-danger';
        case 'Высокий': return 'bg-warning';
        case 'Средний': return 'bg-info';
        case 'Низкий': return 'bg-success';
        default: return 'bg-secondary';
    }
}

/**
 * Получает CSS класс для ресурсов ОЗУ
 * @param {string} level - Уровень использования
 * @returns {string} - CSS класс
 */
function getRamResourceClass(level) {
    switch (level) {
        case 'Критический': return 'bg-danger';
        case 'Высокий': return 'bg-warning';
        case 'Средний': return 'bg-info';
        case 'Низкий': return 'bg-primary';
        default: return 'bg-secondary';
    }
}

/**
 * Получает ID текущего сотрудника
 * @returns {string|null} - ID сотрудника
 */
function getCurrentEmployeeId() {
    const select = document.getElementById('employee-filter');
    return select ? select.value : null;
}

/**
 * Получает ID текущего устройства
 * @returns {string|null} - ID устройства
 */
function getCurrentDeviceId() {
    const select = document.getElementById('device-filter');
    return select ? select.value : null;
}

// Инициализация обработчиков событий
document.addEventListener('DOMContentLoaded', function() {
    // Обработчик кнопки анализа
    const analyzeBtn = document.getElementById('analyze-focus-btn');
    if (analyzeBtn) {
        analyzeBtn.addEventListener('click', function() {
            const dateInput = document.getElementById('chronology-date');
            const selectedDate = dateInput ? dateInput.value : new Date().toISOString().split('T')[0];
            
            if (!selectedDate) {
                alert('Пожалуйста, выберите дату для анализа');
                return;
            }
            
            analyzeFocus(selectedDate);
        });
    }
    
    // Обработчик кнопки экспорта
    const exportBtn = document.getElementById('export-focus-btn');
    if (exportBtn) {
        exportBtn.addEventListener('click', function() {
            exportFocusAnalysis();
        });
    }
    
    // Обработчик кнопки анализа человеческого фокуса
    const analyzeHumanFocusBtn = document.getElementById('analyze-human-focus-btn');
    if (analyzeHumanFocusBtn) {
        analyzeHumanFocusBtn.addEventListener('click', async function() {
            const dateInput = document.getElementById('chronology-date');
            const selectedDate = dateInput ? dateInput.value : new Date().toISOString().split('T')[0];
            
            if (!selectedDate) {
                alert('Пожалуйста, выберите дату для анализа');
                return;
            }
            
            // Показываем индикатор загрузки
            const originalText = this.innerHTML;
            this.innerHTML = '<i class="bi bi-hourglass-split"></i> Анализируем человеческий фокус...';
            this.disabled = true;
            
            try {
                // Проверяем, есть ли уже проанализированные данные
                if (!window.lastAnalyzedData || window.lastAnalyzedData.length === 0) {
                    // Если нет, сначала выполняем обычный анализ фокуса
                    await analyzeFocus(selectedDate);
                }
                
                // Проверяем, что данные содержат анализ человеческого фокуса
                if (window.lastAnalyzedData && window.lastAnalyzedData.length > 0) {
                    const hasHumanFocusData = window.lastAnalyzedData.some(period => period.humanFocus);
                    
                    if (hasHumanFocusData) {
                        // Обновляем отображение с акцентом на человеческий фокус
                        updateFocusTableWithHumanFocusHighlight();
                        
                        // Показываем детальную статистику человеческого фокуса
                        showHumanFocusDetailedStats(window.lastAnalyzedData);
                        
                        console.log('✅ Анализ человеческого фокуса завершен успешно');
                    } else {
                        throw new Error('Данные человеческого фокуса не найдены в анализе');
                    }
                } else {
                    throw new Error('Нет данных для анализа человеческого фокуса');
                }
                
            } catch (error) {
                console.error('❌ Ошибка анализа человеческого фокуса:', error);
                alert('Ошибка анализа человеческого фокуса: ' + error.message);
            } finally {
                // Восстанавливаем кнопку
                this.innerHTML = originalText;
                this.disabled = false;
            }
        });
    }
    
    // Обработчик переключателя режимов отображения
    const displayModeSelect = document.getElementById('focus-display-mode');
    if (displayModeSelect) {
        displayModeSelect.addEventListener('change', function() {
            updateDisplayModeDescription(this.value);
            
            // Если есть данные для пересортировки, выполняем анализ заново
            if (window.lastAnalyzedData) {
                console.log('🔄 Переключение режима отображения:', this.value);
                updateFocusTable(window.lastAnalyzedData);
            }
        });
        
        // Устанавливаем начальное описание
        updateDisplayModeDescription(displayModeSelect.value);
    }
    
    // Обработчик сортировки
    const sortSelect = document.getElementById('chronology-sort');
    if (sortSelect) {
        sortSelect.addEventListener('change', function() {
            // Если есть данные для пересортировки, выполняем анализ заново
            const dateInput = document.getElementById('chronology-date');
            const selectedDate = dateInput ? dateInput.value : null;
            
            if (selectedDate && window.lastAnalyzedData) {
                console.log('🔄 Пересортировка данных анализа фокуса');
                updateFocusTable(window.lastAnalyzedData);
            }
        });
    }
});

/**
 * Экспортирует результаты анализа фокуса
 */
function exportFocusAnalysis() {
    console.log('📤 Экспорт анализа фокуса (функция будет реализована позже)');
    alert('Функция экспорта будет реализована в следующей версии');
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
 * Показывает детальную информацию о процессах
 * @param {string} timestampKey - Ключ временной метки
 */
/**
 * Показывает детальную информацию о процессах
 * @param {string} timestampKey - Ключ временной метки
 */
function showProcessDetails(timestampKey) {
    if (!window.lastAnalyzedData || window.lastAnalyzedData.length === 0) {
        alert('Данные анализа недоступны. Выполните анализ заново.');
        return;
    }
    
    // Находим период фокуса по временной метке
    const targetTime = new Date(timestampKey);
    const targetPeriod = window.lastAnalyzedData.find(period => {
        const periodStart = new Date(period.startTime);
        const periodEnd = new Date(period.endTime);
        return targetTime >= periodStart && targetTime <= periodEnd;
    });
    
    if (!targetPeriod) {
        alert('Период фокуса не найден для выбранного времени.');
        return;
    }
    
    // Получаем все активности из этого периода
    const periodActivities = targetPeriod.rawActivities || targetPeriod.activities || [];
    
    if (periodActivities.length === 0) {
        console.log('🔍 Отладка: targetPeriod =', targetPeriod);
        console.log('🔍 Доступные ключи:', Object.keys(targetPeriod));
        alert('Нет активностей в выбранном периоде.');
        return;
    }
    
    // Сортируем активности по времени для правильной хронологии
    const sortedActivities = periodActivities.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    
    // Создаем хронологическую последовательность для модального окна
    const appSequence = createDetailedAppSequence(sortedActivities);
    
    // Создаем модальное окно с улучшенным дизайном
    const modalHtml = `
        <div class="modal fade" id="processDetailsModal" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog modal-xl">
                <div class="modal-content">
                    <div class="modal-header bg-primary text-white">
                        <h5 class="modal-title">
                            <i class="bi bi-diagram-3 me-2"></i>
                            Хронология активности в периоде фокуса
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="alert alert-info mb-4">
                            <div class="info-cards-container">
                                <div class="info-card period-card">
                                    <div class="info-card-header">
                                        <div class="info-card-icon">
                                            <i class="bi bi-clock"></i>
                                        </div>
                                        <div class="info-card-title">Период</div>
                                    </div>
                                    <div class="info-card-content">
                                        ${new Date(targetPeriod.startTime).toLocaleTimeString('ru-RU')} - 
                                        ${new Date(targetPeriod.endTime).toLocaleTimeString('ru-RU')}
                                        <span class="badge bg-primary">${formatDuration(targetPeriod.duration)}</span>
                                    </div>
                                </div>
                                
                                <div class="info-card stats-card">
                                    <div class="info-card-header">
                                        <div class="info-card-icon">
                                            <i class="bi bi-activity"></i>
                                        </div>
                                        <div class="info-card-title">Активности</div>
                                    </div>
                                    <div class="info-card-content">
                                        ${sortedActivities.length} активностей в периоде
                                    </div>
                                </div>
                                
                                <div class="info-card status-card">
                                    <div class="info-card-header">
                                        <div class="info-card-icon">
                                            <i class="bi bi-cpu"></i>
                                        </div>
                                        <div class="info-card-title">Инфо</div>
                                    </div>
                                    <div class="info-card-content">
                                        ${new Set(sortedActivities.map(a => a.appName || a.app_name || a.application)).size} процессов
                                    </div>
                                </div>
                                
                                <div class="info-card details-card">
                                    <div class="info-card-header">
                                        <div class="info-card-icon">
                                            <i class="bi bi-window"></i>
                                        </div>
                                        <div class="info-card-title">Окно</div>
                                    </div>
                                    <div class="info-card-content">
                                        <span class="text-truncate" title="${targetPeriod.primaryApp || 'Неизвестно'}">
                                            ${getShortAppName(targetPeriod.primaryApp) || 'Неизвестно'}
                                        </span>
                                        <span class="badge ${getStatusClass(targetPeriod.status)}">${targetPeriod.status}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="mb-3">
                        
                        <div class="d-flex justify-content-between align-items-center mb-2">
                            <h6><i class="bi bi-diagram-2 me-2"></i>Последовательность приложений:</h6>
                            <button class="btn btn-sm btn-outline-secondary" onclick="toggleAppSequenceGrouping()" id="appSequenceToggle">
                                <i class="bi bi-collection me-1"></i>Группировать
                            </button>
                        </div>
                        <div class="app-sequence-modal" id="appSequenceContainer">
                            ${appSequence.html}
                        </div>
                        </div>
                        
                        <div class="table-responsive">
                        <div class="d-flex justify-content-between align-items-center mb-2">
                                <h6><i class="bi bi-list-ul me-2"></i>Детальная хронология активностей:</h6>
                                <button class="btn btn-sm btn-outline-secondary" onclick="toggleChronologyGrouping()" id="chronologyToggle">
                                    <i class="bi bi-chevron-up me-1"></i>Свернуть все
                                </button>
                            </div>
                            <div id="chronologyTableContainer">
                            <table class="table table-sm table-hover">
                                <thead class="table-dark">
                                    <tr>
                                        <th width="15%">Время</th>
                                        <th width="20%">Приложение</th>
                                        <th width="35%">Заголовок окна</th>
                                        <th width="10%">Длительность</th>
                                        <th width="10%">Статус</th>
                                        <th width="10%">Действие</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${sortedActivities.map((activity, index) => {
                                        const appName = activity.appName || activity.app_name || activity.application;
                                        const windowTitle = activity.window_title || activity.title || 'Без заголовка';
                                        const duration = parseInt(activity.duration) || 1;
                                        const isBackground = isBackgroundProcess(appName);
                                        const isProductive = isProductiveApplication(appName);
                                        const appIcon = getAppIcon(appName);
                                        const appColor = getAppColor(appName);
                                        
                                        return `
                                            <tr class="${isBackground ? 'table-light' : ''} ${index % 2 === 0 ? 'table-striped' : ''}">
                                                <td class="font-monospace small">
                                                    <strong>${new Date(activity.timestamp).toLocaleTimeString('ru-RU')}</strong>
                                                </td>
                                                <td>
                                                    <div class="d-flex align-items-center">
                                                        <i class="bi ${appIcon} me-2" style="color: ${appColor}; font-size: 1.2em;"></i>
                                                        <div>
                                                            <strong>${getShortAppName(appName)}</strong>
                                                            ${isProductive ? 
                                                                '<i class="bi bi-check-circle text-success ms-1" title="Продуктивное"></i>' : 
                                                                '<i class="bi bi-exclamation-triangle text-warning ms-1" title="Развлекательное"></i>'
                                                            }
                                                            <br><small class="text-muted">${appName}</small>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <small class="text-truncate d-inline-block" 
                                                           style="max-width: 300px;" 
                                                           title="${windowTitle}">
                                                        ${windowTitle}
                                                    </small>
                                                </td>
                                                <td>
                                                    <span class="badge bg-light text-dark">
                                                        ${formatDuration(duration)}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span class="badge ${isBackground ? 'bg-secondary' : 'bg-success'} small">
                                                        ${isBackground ? 'Фон' : 'Активен'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <button class="btn btn-sm btn-outline-primary" 
                                                            onclick="navigateToActivity('${activity.timestamp}')"
                                                            title="Перейти к активности в хронологии">
                                                        <i class="bi bi-arrow-right-circle"></i>
                                                    </button>
                                                </td>
                                            </tr>
                                        `;
                                    }).join('')}
                                </tbody>
                            </table>
                        </div>
                        
                        <div class="mt-3">
                            <div class="alert alert-success">
                                <div class="row">
                                    <div class="col-md-4">
                                        <i class="bi bi-info-circle me-2"></i>
                                        <strong>Всего активностей:</strong> ${sortedActivities.length}
                                    </div>
                                    <div class="col-md-4">
                                        <i class="bi bi-apps me-2"></i>
                                        <strong>Уникальных приложений:</strong> ${new Set(sortedActivities.map(a => a.appName || a.app_name || a.application)).size}
                                    </div>
                                    <div class="col-md-4">
                                        <i class="bi bi-clock me-2"></i>
                                        <strong>Общая длительность:</strong> ${formatDuration(targetPeriod.duration)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                            <i class="bi bi-x-circle me-1"></i>Закрыть
                        </button>
                        <button type="button" class="btn btn-primary" onclick="exportPeriodDetails('${targetPeriod.startTime}')">
                            <i class="bi bi-download me-1"></i>Экспортировать
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Удаляем старое модальное окно если есть
    const existingModal = document.getElementById('processDetailsModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Добавляем новое модальное окно
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // Показываем модальное окно
    const modal = new bootstrap.Modal(document.getElementById('processDetailsModal'));
    modal.show();
}

/**
 * Создает детальную последовательность приложений для модального окна
 * @param {Array} activities - Массив активностей
 * @returns {Object} - Объект с HTML представлением
 */
function createDetailedAppSequence(activities) {
    // Группируем активности по приложениям с временными диапазонами
    const appGroups = [];
    let currentGroup = null;
    
    for (const activity of activities) {
        const appName = activity.appName || activity.app_name || activity.application;
        
        if (!currentGroup || currentGroup.appName !== appName) {
            if (currentGroup) {
                appGroups.push(currentGroup);
            }
            currentGroup = {
                appName: appName,
                startTime: new Date(activity.timestamp),
                endTime: new Date(activity.timestamp),
                count: 1,
                activities: [activity]
            };
        } else {
            currentGroup.endTime = new Date(activity.timestamp);
            currentGroup.count++;
            currentGroup.activities.push(activity);
        }
    }
    
    if (currentGroup) {
        appGroups.push(currentGroup);
    }
    
    // Создаем HTML для детальной последовательности
    const sequenceHtml = appGroups.map((group, index) => {
        const appIcon = getAppIcon(group.appName);
        const appColor = getAppColor(group.appName);
        const isProductive = isProductiveApplication(group.appName);
        const duration = Math.round((group.endTime - group.startTime) / 1000) + 1;
        const timeRange = `${group.startTime.toLocaleTimeString('ru-RU')} - ${group.endTime.toLocaleTimeString('ru-RU')}`;
        
        return `
            <div class="app-sequence-item mb-2 p-3 border rounded">
                <div class="d-flex align-items-center justify-content-between">
                    <div class="d-flex align-items-center">
                        <span class="sequence-number badge bg-primary me-3">${index + 1}</span>
                        <i class="bi ${appIcon} me-2" style="color: ${appColor}; font-size: 1.5em;"></i>
                        <div>
                            <h6 class="mb-1">
                                ${getShortAppName(group.appName)}
                                ${isProductive ? 
                                    '<i class="bi bi-check-circle text-success ms-1" title="Продуктивное приложение"></i>' : 
                                    '<i class="bi bi-exclamation-triangle text-warning ms-1" title="Развлекательное приложение"></i>'
                                }
                            </h6>
                            <small class="text-muted">${group.appName}</small>
                        </div>
                    </div>
                    <div class="text-end">
                        <div class="badge bg-light text-dark mb-1">${timeRange}</div><br>
                        <div class="badge bg-info">${formatDuration(duration)}</div>
                        <div class="badge bg-secondary ms-1">${group.count} активностей</div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    return {
        html: sequenceHtml
    };
}

/**
 * Переходит к активности в хронологии
 * @param {string} timestamp - Временная метка активности
 */
function navigateToActivity(timestamp) {
    // Закрываем модальное окно
    const modal = bootstrap.Modal.getInstance(document.getElementById('processDetailsModal'));
    if (modal) {
        modal.hide();
    }
    
    // Ждем закрытия модального окна и переходим к активности
    setTimeout(() => {
        showActivityInTimeline(timestamp);
    }, 300);
}

/**
 * Экспортирует детали периода
 * @param {string} periodStart - Начало периода
 */
function exportPeriodDetails(periodStart) {
    console.log('📤 Экспорт деталей периода:', periodStart);
    alert('Функция экспорта будет реализована в следующей версии');
}
/**
 * Переключает группировку последовательности приложений
 */
/**
 * Переключает группировку последовательности приложений
 */
function toggleAppSequenceGrouping() {
    const container = document.getElementById('appSequenceContainer');
    const toggleBtn = document.getElementById('appSequenceToggle');
    const isGrouped = toggleBtn.dataset.grouped === 'true';
    
    if (isGrouped) {
        // Разгруппировать - показать все как было
        toggleBtn.innerHTML = '<i class="bi bi-collection me-1"></i>Группировать';
        toggleBtn.dataset.grouped = 'false';
        
        // Восстанавливаем исходный HTML из сохраненного состояния
        const originalHTML = toggleBtn.dataset.originalHtml;
        if (originalHTML) {
            container.innerHTML = originalHTML;
        }
    } else {
        // Сохраняем исходный HTML перед группировкой
        toggleBtn.dataset.originalHtml = container.innerHTML;
        
        // Группировать в спойлеры
        toggleBtn.innerHTML = '<i class="bi bi-collection-fill me-1"></i>Разгруппировать';
        toggleBtn.dataset.grouped = 'true';
        
        // Получаем все элементы последовательности
        const appItems = container.querySelectorAll('.app-sequence-item');
        const groupedData = {};
        
        // Группируем по приложениям
        appItems.forEach(item => {
            const appName = item.querySelector('h6').textContent.trim();
            if (!groupedData[appName]) {
                groupedData[appName] = [];
            }
            groupedData[appName].push(item.outerHTML);
        });
        
        // Создаем сгруппированный HTML
        let groupedHTML = '';
        let groupIndex = 0;
        
        Object.keys(groupedData).forEach(appName => {
            const items = groupedData[appName];
            const totalActivities = items.length;
            
            groupedHTML += `
                <div class="card mb-2">
                    <div class="card-header py-2" style="cursor: pointer;" onclick="toggleAppGroup(${groupIndex})">
                        <div class="d-flex justify-content-between align-items-center">
                            <h6 class="mb-0">
                                <i class="bi bi-chevron-right me-2" id="chevron-${groupIndex}"></i>
                                ${appName}
                            </h6>
                            <span class="badge bg-primary">${totalActivities} записей</span>
                        </div>
                    </div>
                    <div class="collapse" id="appGroup-${groupIndex}">
                        <div class="card-body p-2">
                            ${items.join('')}
                        </div>
                    </div>
                </div>
            `;
            groupIndex++;
        });
        
        container.innerHTML = groupedHTML;
    }
}

/**
 * Переключает группировку детальной хронологии
 */
function toggleChronologyGrouping() {
    const container = document.getElementById('chronologyTableContainer');
    const toggleBtn = document.getElementById('chronologyToggle');
    const isGrouped = toggleBtn.dataset.grouped === 'true';
    
    if (isGrouped) {
        // Разгруппировать - показать обычную таблицу
        toggleBtn.innerHTML = '<i class="bi bi-chevron-up me-1"></i>Свернуть все';
        toggleBtn.dataset.grouped = 'false';
        
        // Восстанавливаем исходный HTML из сохраненного состояния
        const originalHTML = toggleBtn.dataset.originalHtml;
        if (originalHTML) {
            container.innerHTML = originalHTML;
        }
    } else {
        // Сохраняем исходный HTML перед группировкой
        toggleBtn.dataset.originalHtml = container.innerHTML;
        
        // Группировать по приложениям в спойлеры
        toggleBtn.innerHTML = '<i class="bi bi-chevron-down me-1"></i>Развернуть все';
        toggleBtn.dataset.grouped = 'true';
        
        const table = container.querySelector('table');
        const rows = Array.from(table.querySelectorAll('tbody tr'));
        
        // Группируем строки по приложениям
        const groupedRows = {};
        rows.forEach(row => {
            const appName = row.dataset.app;
            if (!groupedRows[appName]) {
                groupedRows[appName] = [];
            }
            groupedRows[appName].push(row);
        });
        
        // Создаем сгруппированную структуру
        let groupedHTML = '';
        let groupIndex = 0;
        
        Object.keys(groupedRows).forEach(appName => {
            const rowElements = groupedRows[appName];
            const appIcon = getAppIcon(appName);
            const appColor = getAppColor(appName);
            const isProductive = isProductiveApplication(appName);
            
            // Создаем HTML для строк в группе
            const groupRowsHTML = rowElements.map(row => {
                const cells = row.querySelectorAll('td');
                return `
                    <tr>
                        <td>${cells[0].innerHTML}</td>
                        <td>${cells[2].innerHTML}</td>
                        <td>${cells[3].innerHTML}</td>
                        <td>${cells[5].innerHTML}</td>
                    </tr>
                `;
            }).join('');
            
            groupedHTML += `
                <div class="card mb-2">
                    <div class="card-header py-2" style="cursor: pointer;" onclick="toggleChronologyGroup(${groupIndex})">
                        <div class="d-flex justify-content-between align-items-center">
                            <div class="d-flex align-items-center">
                                <i class="bi bi-chevron-right me-2" id="chronoChevron-${groupIndex}"></i>
                                <i class="bi ${appIcon} me-2" style="color: ${appColor};"></i>
                                <h6 class="mb-0">
                                    ${getShortAppName(appName)}
                                    ${isProductive ? 
                                        '<i class="bi bi-check-circle text-success ms-1" title="Продуктивное"></i>' : 
                                        '<i class="bi bi-exclamation-triangle text-warning ms-1" title="Развлекательное"></i>'
                                    }
                                </h6>
                            </div>
                            <span class="badge bg-primary">${rowElements.length} активностей</span>
                        </div>
                    </div>
                    <div class="collapse" id="chronoGroup-${groupIndex}">
                        <div class="card-body p-0">
                            <table class="table table-sm mb-0">
                                <thead class="table-light">
                                    <tr>
                                        <th>Время</th>
                                        <th>Заголовок окна</th>
                                        <th>Длительность</th>
                                        <th>Действие</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${groupRowsHTML}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            `;
            groupIndex++;
        });
        
        container.innerHTML = groupedHTML;
    }
}

/**
 * Переключает отображение группы в хронологии
 */
function toggleChronologyGroup(index) {
    const collapseElement = document.getElementById(`chronoGroup-${index}`);
    const chevron = document.getElementById(`chronoChevron-${index}`);
    
    if (collapseElement.classList.contains('show')) {
        collapseElement.classList.remove('show');
        chevron.classList.remove('bi-chevron-down');
        chevron.classList.add('bi-chevron-right');
    } else {
        collapseElement.classList.add('show');
        chevron.classList.remove('bi-chevron-right');
        chevron.classList.add('bi-chevron-down');
    }
}

/**
 * Разворачивает или сворачивает все группы хронологии
 */
function toggleAllChronologyGroups(expand = true) {
    const groups = document.querySelectorAll('[id^="chronoGroup-"]');
    const chevrons = document.querySelectorAll('[id^="chronoChevron-"]');
    
    groups.forEach((group, index) => {
        if (expand) {
            group.classList.add('show');
            chevrons[index].classList.remove('bi-chevron-right');
            chevrons[index].classList.add('bi-chevron-down');
        } else {
            group.classList.remove('show');
            chevrons[index].classList.remove('bi-chevron-down');
            chevrons[index].classList.add('bi-chevron-right');
        }
    });
}
function showActivityInTimeline(timestamp) {
    // Закрываем модальное окно
    const modal = bootstrap.Modal.getInstance(document.getElementById('processDetailsModal'));
    if (modal) {
        modal.hide();
    }
    
    // Переходим на вкладку активности окон - ищем правильный селектор
    const windowActivityTab = document.querySelector('button[data-bs-target="#window-activity"]') || 
                             document.querySelector('a[href="#window-activity"]') ||
                             document.getElementById('window-activity-tab');
    
    if (windowActivityTab) {
        // Активируем вкладку
        windowActivityTab.click();
        
        // Ждем загрузки данных и прокручиваем к нужной записи
        setTimeout(() => {
            // Ищем таблицу хронологии с разными возможными ID
            const chronologyTable = document.getElementById('chronology-table') ||
                                   document.getElementById('window-activity-table') ||
                                   document.querySelector('#window-activity table') ||
                                   document.querySelector('.chronology-table');
            
            if (chronologyTable) {
                const targetTime = new Date(timestamp).toLocaleTimeString('ru-RU');
                const rows = chronologyTable.querySelectorAll('tbody tr');
                
                console.log(`🔍 Ищем время ${targetTime} среди ${rows.length} строк`);
                
                let found = false;
                for (let row of rows) {
                    const timeCell = row.querySelector('td:first-child');
                    if (timeCell && timeCell.textContent.includes(targetTime)) {
                        row.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        row.classList.add('table-warning');
                        setTimeout(() => row.classList.remove('table-warning'), 3000);
                        found = true;
                        console.log('✅ Найдена и подсвечена строка с временем', targetTime);
                        break;
                    }
                }
                
                if (!found) {
                    console.log('⚠️ Не найдена строка с временем', targetTime);
                    // Пробуем найти ближайшее время
                    const targetTimestamp = new Date(timestamp);
                    let closestRow = null;
                    let minDiff = Infinity;
                    
                    for (let row of rows) {
                        const timeCell = row.querySelector('td:first-child');
                        if (timeCell) {
                            try {
                                const rowTime = timeCell.textContent.trim();
                                const today = new Date().toDateString();
                                const rowTimestamp = new Date(`${today} ${rowTime}`);
                                const diff = Math.abs(rowTimestamp - targetTimestamp);
                                
                                if (diff < minDiff) {
                                    minDiff = diff;
                                    closestRow = row;
                                }
                            } catch (e) {
                                // Игнорируем ошибки парсинга времени
                            }
                        }
                    }
                    
                    if (closestRow) {
                        closestRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        closestRow.classList.add('table-info');
                        setTimeout(() => closestRow.classList.remove('table-info'), 3000);
                        console.log('✅ Найдена ближайшая строка');
                    }
                }
            } else {
                console.log('❌ Таблица хронологии не найдена');
                alert('Таблица хронологии не найдена. Убедитесь, что вкладка "Активность окон" загружена.');
            }
        }, 1000); // Увеличиваем время ожидания
    } else {
        console.log('❌ Вкладка активности окон не найдена');
        alert('Вкладка "Активность окон" не найдена. Перейдите на неё вручную.');
    }
}

/**
 * Обновляет описание режима отображения
 * @param {string} mode - Режим отображения
 */
function updateDisplayModeDescription(mode) {
    const descriptionElement = document.getElementById('display-mode-description');
    if (!descriptionElement) return;
    
    const descriptions = {
        'standard': 'Стандартный режим группирует записи по 5-минутным интервалам',
        'smart-spoilers': 'Умные спойлеры автоматически группируют активность по периодам с учетом неактивного времени (макс. 4 больших периода)'
    };
    
    descriptionElement.textContent = descriptions[mode] || descriptions['standard'];
}

/**
 * Получает бейдж для уровня активности
 * @param {string} level - Уровень активности
 * @returns {string} - HTML бейджа
 */
function getActivityBadge(level) {
    switch (level) {
        case 'Высокая':
            return '<span class="badge bg-success"><i class="bi bi-lightning-fill me-1"></i>Высокая активность</span>';
        case 'Средняя':
            return '<span class="badge bg-warning"><i class="bi bi-activity me-1"></i>Средняя активность</span>';
        case 'Низкая':
            return '<span class="badge bg-secondary"><i class="bi bi-pause-circle me-1"></i>Низкая активность</span>';
        default:
            return '<span class="badge bg-light text-dark">Неизвестно</span>';
    }
}

console.log('🧠 Умный анализатор фокуса окон загружен!'); 

/**
 * Интеграция с умным калькулятором времени
 * Обновляет основные метрики дашборда используя данные анализатора фокуса
 * @param {Object} allData - Все данные из анализатора фокуса
 */
function updateDashboardMetricsFromFocusAnalyzer(allData) {
    console.log('🔗 Интеграция анализатора фокуса с умным калькулятором времени');
    
    // Проверяем, доступен ли умный калькулятор времени
    if (typeof updateMainMetricsWithRealActivity !== 'function') {
        console.log('⚠️ Умный калькулятор времени недоступен, пропускаем обновление метрик');
        return;
    }
    
    // Проверяем наличие данных
    if (!allData.windowActivities || allData.windowActivities.length === 0) {
        console.log('⚠️ Нет данных активности окон для обновления метрик');
        return;
    }
    
    console.log('📊 Передаем данные в умный калькулятор:', {
        windowActivities: allData.windowActivities.length,
        mouseActivities: allData.mouseActivities.length
    });
    
    // Передаем данные в умный калькулятор времени
    // Теперь функция принимает данные мыши как второй параметр
    updateMainMetricsWithRealActivity(allData.windowActivities, allData.mouseActivities);
    
    console.log('✅ Метрики дашборда обновлены из анализатора фокуса');
}

/**
 * НОВАЯ ФУНКЦИЯ: Анализ человеческого фокуса с использованием системных метрик
 * @param {Object} period - Период фокуса
 * @param {Array} mouseData - Данные мыши
 * @param {Array} resourceData - Данные ресурсов
 * @returns {Object} - Оценка человеческого фокуса
 */
function analyzeHumanFocusWithSystemMetrics(period, mouseData, resourceData) {
    console.log('🧠 Анализ человеческого фокуса с системными метриками для периода:', period.primaryApp);
    
    // Константы для анализа человеческого фокуса
    const HUMAN_FOCUS_WEIGHTS = {
        MOUSE_ACTIVITY: 0.30,        // Активность мыши
        SYSTEM_CORRELATION: 0.25,    // Корреляция с системными ресурсами
        RESOURCE_PATTERNS: 0.20,     // Паттерны использования ресурсов
        ACTIVITY_COHERENCE: 0.15,    // Согласованность активности
        CONTEXT_AWARENESS: 0.10      // Контекстная осведомленность
    };
    
    // 1. Анализ активности мыши (базовый уровень)
    const mouseAnalysis = analyzeMouseActivity(mouseData);
    const mouseScore = calculateMouseFocusScore(mouseAnalysis);
    
    // 2. Анализ корреляции системных ресурсов с активностью
    const systemCorrelation = analyzeSystemResourceCorrelation(mouseData, resourceData);
    
    // 3. Анализ паттернов использования ресурсов
    const resourcePatterns = analyzeResourcePatterns(resourceData, period);
    
    // 4. Анализ согласованности активности
    const activityCoherence = analyzeActivityCoherence(mouseData, resourceData, period);
    
    // 5. Контекстная осведомленность (тип приложения)
    const contextAwareness = analyzeContextAwareness(period);
    
    // Вычисляем итоговую оценку человеческого фокуса
    const humanFocusScore = (
        mouseScore * HUMAN_FOCUS_WEIGHTS.MOUSE_ACTIVITY +
        systemCorrelation.score * HUMAN_FOCUS_WEIGHTS.SYSTEM_CORRELATION +
        resourcePatterns.score * HUMAN_FOCUS_WEIGHTS.RESOURCE_PATTERNS +
        activityCoherence.score * HUMAN_FOCUS_WEIGHTS.ACTIVITY_COHERENCE +
        contextAwareness.score * HUMAN_FOCUS_WEIGHTS.CONTEXT_AWARENESS
    );
    
    // Определяем уровень фокуса
    const focusLevel = getFocusLevel(humanFocusScore);
    const confidence = calculateFocusConfidence(mouseAnalysis, systemCorrelation, resourcePatterns);
    
    console.log(`🎯 Человеческий фокус для ${period.primaryApp}: ${Math.round(humanFocusScore * 100)}% (${focusLevel})`);
    
    return {
        score: Math.round(humanFocusScore * 100),
        level: focusLevel,
        confidence: confidence,
        breakdown: {
            mouseActivity: mouseScore,
            systemCorrelation: systemCorrelation.score,
            resourcePatterns: resourcePatterns.score,
            activityCoherence: activityCoherence.score,
            contextAwareness: contextAwareness.score
        },
        details: {
            mouseAnalysis: mouseAnalysis,
            systemCorrelation: systemCorrelation,
            resourcePatterns: resourcePatterns,
            activityCoherence: activityCoherence,
            contextAwareness: contextAwareness
        },
        insights: generateHumanFocusInsights(humanFocusScore, focusLevel, period),
        recommendations: generateFocusRecommendations(humanFocusScore, period)
    };
}

/**
 * Вычисляет оценку фокуса на основе активности мыши
 * @param {Object} mouseAnalysis - Анализ активности мыши
 * @returns {number} - Оценка от 0 до 1
 */
function calculateMouseFocusScore(mouseAnalysis) {
    if (!mouseAnalysis.isActive) return 0;
    
    const clicksScore = Math.min(mouseAnalysis.clicks / 10, 1); // Нормализуем до 10 кликов
    const movementsScore = Math.min(mouseAnalysis.movements / 50, 1); // Нормализуем до 50 движений
    
    // Баланс между кликами и движениями важен для фокуса
    const balance = 1 - Math.abs(clicksScore - movementsScore);
    
    return (clicksScore * 0.4 + movementsScore * 0.4 + balance * 0.2);
}

/**
 * Анализирует корреляцию системных ресурсов с активностью пользователя
 * @param {Array} mouseData - Данные мыши
 * @param {Array} resourceData - Данные ресурсов
 * @returns {Object} - Результат анализа корреляции
 */
function analyzeSystemResourceCorrelation(mouseData, resourceData) {
    if (!mouseData || !resourceData || mouseData.length === 0 || resourceData.length === 0) {
        return { score: 0, correlations: {}, confidence: 0 };
    }
    
    // Создаем временные интервалы для корреляции
    const intervals = createTimeIntervals(mouseData, resourceData);
    
    const correlations = {
        cpuMouse: calculateCorrelation(intervals.cpu, intervals.mouse),
        gpuMouse: calculateCorrelation(intervals.gpu, intervals.mouse),
        ramMouse: calculateCorrelation(intervals.ram, intervals.mouse),
        networkMouse: calculateCorrelation(intervals.network, intervals.mouse)
    };
    
    // Положительная корреляция указывает на человеческую активность
    const avgCorrelation = Object.values(correlations).reduce((sum, val) => sum + Math.max(0, val), 0) / 4;
    
    return {
        score: avgCorrelation,
        correlations: correlations,
        confidence: calculateCorrelationConfidence(correlations),
        interpretation: interpretCorrelations(correlations)
    };
}

/**
 * Анализирует паттерны использования ресурсов
 * @param {Array} resourceData - Данные ресурсов
 * @param {Object} period - Период фокуса
 * @returns {Object} - Анализ паттернов
 */
function analyzeResourcePatterns(resourceData, period) {
    if (!resourceData || resourceData.length === 0) {
        return { score: 0, patterns: [], confidence: 0 };
    }
    
    const patterns = [];
    let patternScore = 0;
    
    // Анализируем вариативность ресурсов (человеческая активность более вариативна)
    const cpuVariability = calculateVariability(resourceData.map(r => r.cpu_percent || r.cpu || 0));
    const ramVariability = calculateVariability(resourceData.map(r => r.ram_percent || r.memory || 0));
    const gpuVariability = calculateVariability(resourceData.map(r => r.gpu_percent || r.gpu || 0));
    
    // Человеческая активность создает пульсации в использовании ресурсов
    if (cpuVariability > 0.3) {
        patterns.push('cpu_pulsation');
        patternScore += 0.3;
    }
    
    if (ramVariability > 0.2) {
        patterns.push('ram_variation');
        patternScore += 0.2;
    }
    
    if (gpuVariability > 0.4) {
        patterns.push('gpu_activity');
        patternScore += 0.2;
    }
    
    // Анализируем соответствие ресурсов типу приложения
    const appTypeScore = analyzeAppResourceMatch(period.primaryApp, resourceData);
    patternScore += appTypeScore * 0.3;
    
    return {
        score: Math.min(patternScore, 1),
        patterns: patterns,
        variability: { cpu: cpuVariability, ram: ramVariability, gpu: gpuVariability },
        appMatch: appTypeScore,
        confidence: patterns.length > 0 ? 0.8 : 0.3
    };
}

/**
 * Анализирует согласованность активности
 * @param {Array} mouseData - Данные мыши
 * @param {Array} resourceData - Данные ресурсов
 * @param {Object} period - Период фокуса
 * @returns {Object} - Анализ согласованности
 */
function analyzeActivityCoherence(mouseData, resourceData, period) {
    if (!mouseData || !resourceData) {
        return { score: 0.5, coherence: 'unknown', factors: [] };
    }
    
    const factors = [];
    let coherenceScore = 0;
    
    // Проверяем временную согласованность
    const timeCoherence = checkTimeCoherence(mouseData, resourceData);
    if (timeCoherence > 0.7) {
        factors.push('temporal_coherence');
        coherenceScore += 0.4;
    }
    
    // Проверяем интенсивность согласованности
    const intensityCoherence = checkIntensityCoherence(mouseData, resourceData);
    if (intensityCoherence > 0.6) {
        factors.push('intensity_coherence');
        coherenceScore += 0.3;
    }
    
    // Проверяем контекстную согласованность
    const contextCoherence = checkContextCoherence(period, resourceData);
    if (contextCoherence > 0.5) {
        factors.push('context_coherence');
        coherenceScore += 0.3;
    }
    
    const coherenceLevel = coherenceScore > 0.7 ? 'high' : coherenceScore > 0.4 ? 'medium' : 'low';
    
    return {
        score: coherenceScore,
        coherence: coherenceLevel,
        factors: factors,
        details: {
            timeCoherence: timeCoherence,
            intensityCoherence: intensityCoherence,
            contextCoherence: contextCoherence
        }
    };
}

/**
 * Анализирует контекстную осведомленность
 * @param {Object} period - Период фокуса
 * @returns {Object} - Анализ контекста
 */
function analyzeContextAwareness(period) {
    const appName = period.primaryApp;
    const duration = period.duration || 0;
    
    // Определяем тип приложения и ожидаемые паттерны фокуса
    const appContext = getApplicationContext(appName);
    const durationScore = calculateDurationScore(duration, appContext.expectedDuration);
    const frequencyScore = calculateFrequencyScore(period.activitiesCount, duration);
    
    const contextScore = (
        appContext.focusPotential * 0.5 +
        durationScore * 0.3 +
        frequencyScore * 0.2
    );
    
    return {
        score: contextScore,
        appType: appContext.type,
        focusPotential: appContext.focusPotential,
        expectedDuration: appContext.expectedDuration,
        durationScore: durationScore,
        frequencyScore: frequencyScore
    };
}

/**
 * Вспомогательные функции для анализа человеческого фокуса
 */

function createTimeIntervals(mouseData, resourceData) {
    // Создаем временные интервалы для корреляционного анализа
    const intervals = { mouse: [], cpu: [], gpu: [], ram: [], network: [] };
    
    // Группируем данные по 10-секундным интервалам
    const intervalSize = 10000; // 10 секунд в миллисекундах
    const startTime = Math.min(
        mouseData.length > 0 ? new Date(mouseData[0].timestamp).getTime() : Date.now(),
        resourceData.length > 0 ? new Date(resourceData[0].timestamp).getTime() : Date.now()
    );
    
    // Создаем интервалы и заполняем их данными
    for (let i = 0; i < 30; i++) { // 30 интервалов = 5 минут
        const intervalStart = startTime + i * intervalSize;
        const intervalEnd = intervalStart + intervalSize;
        
        // Мышиная активность в интервале
        const mouseActivity = mouseData.filter(m => {
            const time = new Date(m.timestamp).getTime();
            return time >= intervalStart && time < intervalEnd;
        }).reduce((sum, m) => sum + (m.mouse_clicks || 0) + (m.mouse_movements || 0), 0);
        
        // Системные ресурсы в интервале
        const resources = resourceData.filter(r => {
            const time = new Date(r.timestamp).getTime();
            return time >= intervalStart && time < intervalEnd;
        });
        
        const avgCpu = resources.reduce((sum, r) => sum + (r.cpu_percent || r.cpu || 0), 0) / Math.max(resources.length, 1);
        const avgGpu = resources.reduce((sum, r) => sum + (r.gpu_percent || r.gpu || 0), 0) / Math.max(resources.length, 1);
        const avgRam = resources.reduce((sum, r) => sum + (r.ram_percent || r.memory || 0), 0) / Math.max(resources.length, 1);
        const avgNetwork = resources.reduce((sum, r) => sum + (r.network_usage || r.network || 0), 0) / Math.max(resources.length, 1);
        
        intervals.mouse.push(mouseActivity);
        intervals.cpu.push(avgCpu);
        intervals.gpu.push(avgGpu);
        intervals.ram.push(avgRam);
        intervals.network.push(avgNetwork);
    }
    
    return intervals;
}

function calculateCorrelation(x, y) {
    if (x.length !== y.length || x.length === 0) return 0;
    
    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
    const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);
    
    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
    
    return denominator === 0 ? 0 : numerator / denominator;
}

function calculateVariability(values) {
    if (values.length === 0) return 0;
    
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    
    return mean > 0 ? stdDev / mean : 0; // Коэффициент вариации
}

function analyzeAppResourceMatch(appName, resourceData) {
    const appLower = appName.toLowerCase();
    const avgCpu = resourceData.reduce((sum, r) => sum + (r.cpu_percent || r.cpu || 0), 0) / resourceData.length;
    const avgGpu = resourceData.reduce((sum, r) => sum + (r.gpu_percent || r.gpu || 0), 0) / resourceData.length;
    
    // Ожидаемое использование ресурсов для разных типов приложений
    if (appLower.includes('chrome') || appLower.includes('firefox') || appLower.includes('edge')) {
        // Браузеры: средний CPU, низкий GPU
        return avgCpu > 10 && avgCpu < 60 ? 0.8 : 0.4;
    } else if (appLower.includes('code') || appLower.includes('cursor')) {
        // Редакторы кода: средний CPU, низкий GPU
        return avgCpu > 5 && avgCpu < 40 ? 0.9 : 0.5;
    } else if (appLower.includes('photoshop') || appLower.includes('blender')) {
        // Графические приложения: высокий CPU и GPU
        return avgCpu > 20 && avgGpu > 10 ? 0.9 : 0.3;
    } else if (appLower.includes('video') || appLower.includes('media')) {
        // Медиа: средний CPU, возможно GPU
        return avgCpu > 15 ? 0.7 : 0.4;
    }
    
    return 0.5; // Нейтральная оценка для неизвестных приложений
}

function checkTimeCoherence(mouseData, resourceData) {
    // Проверяем, совпадают ли пики активности мыши с пиками ресурсов
    // Это упрощенная реализация - в реальности нужен более сложный анализ
    return 0.7; // Заглушка
}

function checkIntensityCoherence(mouseData, resourceData) {
    // Проверяем, соответствует ли интенсивность мыши интенсивности ресурсов
    return 0.6; // Заглушка
}

function checkContextCoherence(period, resourceData) {
    // Проверяем, соответствует ли использование ресурсов контексту приложения
    return analyzeAppResourceMatch(period.primaryApp, resourceData);
}

function getApplicationContext(appName) {
    const appLower = appName.toLowerCase();
    
    if (appLower.includes('chrome') || appLower.includes('firefox') || appLower.includes('edge')) {
        return { type: 'browser', focusPotential: 0.6, expectedDuration: 300 }; // 5 минут
    } else if (appLower.includes('code') || appLower.includes('cursor')) {
        return { type: 'development', focusPotential: 0.9, expectedDuration: 900 }; // 15 минут
    } else if (appLower.includes('word') || appLower.includes('excel')) {
        return { type: 'office', focusPotential: 0.8, expectedDuration: 600 }; // 10 минут
    } else if (appLower.includes('telegram') || appLower.includes('whatsapp')) {
        return { type: 'communication', focusPotential: 0.4, expectedDuration: 120 }; // 2 минуты
    } else if (appLower.includes('youtube') || appLower.includes('media')) {
        return { type: 'media', focusPotential: 0.3, expectedDuration: 600 }; // 10 минут
    }
    
    return { type: 'unknown', focusPotential: 0.5, expectedDuration: 300 };
}

function calculateDurationScore(actualDuration, expectedDuration) {
    if (expectedDuration === 0) return 0.5;
    
    const ratio = actualDuration / expectedDuration;
    
    // Оптимальный диапазон: 0.5 - 2.0 от ожидаемой длительности
    if (ratio >= 0.5 && ratio <= 2.0) {
        return 1.0;
    } else if (ratio >= 0.2 && ratio <= 4.0) {
        return 0.7;
    } else {
        return 0.3;
    }
}

function calculateFrequencyScore(activitiesCount, duration) {
    if (duration === 0) return 0;
    
    const frequency = activitiesCount / (duration / 60); // активностей в минуту
    
    // Оптимальная частота: 1-5 активностей в минуту
    if (frequency >= 1 && frequency <= 5) {
        return 1.0;
    } else if (frequency >= 0.5 && frequency <= 10) {
        return 0.7;
    } else {
        return 0.3;
    }
}

function getFocusLevel(score) {
    if (score >= 0.8) return 'Высокий';
    if (score >= 0.6) return 'Средний';
    if (score >= 0.4) return 'Низкий';
    return 'Очень низкий';
}

function calculateFocusConfidence(mouseAnalysis, systemCorrelation, resourcePatterns) {
    const factors = [
        mouseAnalysis.isActive ? 0.3 : 0,
        systemCorrelation.confidence * 0.3,
        resourcePatterns.confidence * 0.2,
        0.2 // Базовая уверенность
    ];
    
    return Math.min(factors.reduce((sum, f) => sum + f, 0), 1);
}

function calculateCorrelationConfidence(correlations) {
    const validCorrelations = Object.values(correlations).filter(c => !isNaN(c) && c !== 0);
    return validCorrelations.length > 0 ? Math.min(validCorrelations.length / 4, 1) : 0;
}

function interpretCorrelations(correlations) {
    const interpretations = [];
    
    if (correlations.cpuMouse > 0.5) {
        interpretations.push('Высокая корреляция CPU-мышь указывает на активную работу');
    }
    if (correlations.gpuMouse > 0.4) {
        interpretations.push('Корреляция GPU-мышь указывает на графическую активность');
    }
    if (correlations.ramMouse > 0.3) {
        interpretations.push('Корреляция RAM-мышь указывает на работу с данными');
    }
    if (correlations.networkMouse > 0.3) {
        interpretations.push('Корреляция сеть-мышь указывает на онлайн-активность');
    }
    
    return interpretations;
}

function generateHumanFocusInsights(score, level, period) {
    const insights = [];
    
    if (score >= 0.8) {
        insights.push(`Отличный уровень фокуса в ${period.primaryApp}`);
        insights.push('Высокая согласованность между активностью пользователя и системными ресурсами');
    } else if (score >= 0.6) {
        insights.push(`Хороший уровень фокуса в ${period.primaryApp}`);
        insights.push('Умеренная вовлеченность с периодами концентрации');
    } else if (score >= 0.4) {
        insights.push(`Низкий уровень фокуса в ${period.primaryApp}`);
        insights.push('Возможны отвлечения или пассивное использование');
    } else {
        insights.push(`Очень низкий уровень фокуса в ${period.primaryApp}`);
        insights.push('Вероятно фоновая активность или отсутствие концентрации');
    }
    
    return insights;
}

function generateFocusRecommendations(score, period) {
    const recommendations = [];
    
    if (score < 0.6) {
        recommendations.push('Рекомендуется минимизировать отвлекающие факторы');
        recommendations.push('Попробуйте техники управления временем (Pomodoro)');
    }
    
    if (period.duration < 300) { // Менее 5 минут
        recommendations.push('Увеличьте продолжительность фокусных сессий');
    }
    
    if (period.activitiesCount > period.duration / 30) { // Более 2 активностей в минуту
        recommendations.push('Снизьте частоту переключений между задачами');
    }
    
    return recommendations;
}

/**
 * Обновляет таблицу с акцентом на человеческий фокус
 */
function updateFocusTableWithHumanFocusHighlight() {
    const tbody = document.querySelector('#window-focus-table tbody');
    const rows = tbody.querySelectorAll('tr:not(.table-info):not(.table-primary):not(.table-secondary)');
    
    rows.forEach(row => {
        // Находим колонку с человеческим фокусом и выделяем её
        const humanFocusCell = row.querySelector('.human-focus-indicator');
        if (humanFocusCell) {
            const parent = humanFocusCell.closest('td');
            if (parent) {
                parent.style.backgroundColor = '#e3f2fd';
                parent.style.border = '2px solid #2196f3';
            }
        }
    });
    
    // Прокручиваем к первой строке с высоким фокусом
    const highFocusRow = Array.from(rows).find(row => {
        const badge = row.querySelector('.human-focus-indicator .badge');
        return badge && badge.textContent.includes('%') && 
               parseInt(badge.textContent.replace('%', '')) >= 80;
    });
    
    if (highFocusRow) {
        highFocusRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
        highFocusRow.style.backgroundColor = '#e8f5e8';
        setTimeout(() => {
            highFocusRow.style.backgroundColor = '';
        }, 3000);
    }
}

/**
 * Показывает детальную статистику человеческого фокуса
 * @param {Array} data - Данные анализа
 */
function showHumanFocusDetailedStats(data) {
    const humanFocusData = data.filter(period => period.humanFocus);
    
    if (humanFocusData.length === 0) {
        console.warn('⚠️ Нет данных человеческого фокуса для отображения');
        return;
    }
    
    // Создаем детальную статистику
    const insights = [];
    const recommendations = [];
    
    // Анализируем паттерны
    const highFocusPeriods = humanFocusData.filter(p => p.humanFocus.score >= 80);
    const lowFocusPeriods = humanFocusData.filter(p => p.humanFocus.score < 40);
    
    if (highFocusPeriods.length > 0) {
        const topApp = getTopAppByFocus(highFocusPeriods);
        insights.push(`🎯 Лучший фокус достигается в ${topApp.name} (${topApp.avgScore}% в среднем)`);
    }
    
    if (lowFocusPeriods.length > humanFocusData.length * 0.3) {
        insights.push(`⚠️ ${Math.round((lowFocusPeriods.length / humanFocusData.length) * 100)}% времени характеризуется низким фокусом`);
        recommendations.push('Рекомендуется применить техники улучшения концентрации');
    }
    
    // Анализируем корреляции
    const avgCorrelations = calculateAverageCorrelations(humanFocusData);
    if (avgCorrelations.cpuMouse > 0.5) {
        insights.push('💻 Высокая корреляция между активностью мыши и CPU указывает на активную работу');
    }
    
    // Показываем результаты в консоли (можно расширить для UI)
    console.log('🧠 Детальная статистика человеческого фокуса:');
    console.log('📊 Инсайты:', insights);
    console.log('💡 Рекомендации:', recommendations);
    
    // Можно добавить отображение в модальном окне или отдельной панели
    showHumanFocusModal(insights, recommendations, humanFocusData);
}

/**
 * Находит приложение с лучшим фокусом
 * @param {Array} periods - Периоды с высоким фокусом
 * @returns {Object} - Приложение и средняя оценка
 */
function getTopAppByFocus(periods) {
    const appScores = {};
    
    periods.forEach(period => {
        const app = period.appName;
        if (!appScores[app]) {
            appScores[app] = { total: 0, count: 0 };
        }
        appScores[app].total += period.humanFocus.score;
        appScores[app].count++;
    });
    
    let topApp = { name: 'Неизвестно', avgScore: 0 };
    
    Object.entries(appScores).forEach(([app, data]) => {
        const avgScore = data.total / data.count;
        if (avgScore > topApp.avgScore) {
            topApp = { name: app, avgScore: Math.round(avgScore) };
        }
    });
    
    return topApp;
}

/**
 * Вычисляет средние корреляции
 * @param {Array} humanFocusData - Данные с человеческим фокусом
 * @returns {Object} - Средние корреляции
 */
function calculateAverageCorrelations(humanFocusData) {
    const correlations = { cpuMouse: 0, gpuMouse: 0, ramMouse: 0, networkMouse: 0 };
    let count = 0;
    
    humanFocusData.forEach(period => {
        if (period.humanFocus.details && period.humanFocus.details.systemCorrelation) {
            const corr = period.humanFocus.details.systemCorrelation.correlations;
            correlations.cpuMouse += corr.cpuMouse || 0;
            correlations.gpuMouse += corr.gpuMouse || 0;
            correlations.ramMouse += corr.ramMouse || 0;
            correlations.networkMouse += corr.networkMouse || 0;
            count++;
        }
    });
    
    if (count > 0) {
        Object.keys(correlations).forEach(key => {
            correlations[key] = correlations[key] / count;
        });
    }
    
    return correlations;
}

/**
 * Показывает модальное окно с результатами анализа человеческого фокуса
 * @param {Array} insights - Инсайты
 * @param {Array} recommendations - Рекомендации
 * @param {Array} data - Данные анализа
 */
function showHumanFocusModal(insights, recommendations, data) {
    // Создаем модальное окно
    const modalHtml = `
        <div class="modal fade" id="humanFocusModal" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header bg-primary text-white">
                        <h5 class="modal-title">
                            <i class="bi bi-brain me-2"></i>
                            Детальный анализ человеческого фокуса
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="row">
                            <div class="col-md-6">
                                <h6><i class="bi bi-lightbulb me-2"></i>Ключевые инсайты:</h6>
                                <ul class="list-unstyled">
                                    ${insights.map(insight => `<li class="mb-2"><i class="bi bi-arrow-right me-2"></i>${insight}</li>`).join('')}
                                </ul>
                            </div>
                            <div class="col-md-6">
                                <h6><i class="bi bi-gear me-2"></i>Рекомендации:</h6>
                                <ul class="list-unstyled">
                                    ${recommendations.map(rec => `<li class="mb-2"><i class="bi bi-check-circle me-2"></i>${rec}</li>`).join('')}
                                </ul>
                            </div>
                        </div>
                        <div class="mt-4">
                            <h6><i class="bi bi-graph-up me-2"></i>Статистика по приложениям:</h6>
                            <div class="table-responsive">
                                <table class="table table-sm">
                                    <thead>
                                        <tr>
                                            <th>Приложение</th>
                                            <th>Средний фокус</th>
                                            <th>Периоды</th>
                                            <th>Время</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${generateAppStatsTable(data)}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Закрыть</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Удаляем старое модальное окно
    const existingModal = document.getElementById('humanFocusModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Добавляем новое
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // Показываем модальное окно
    const modal = new bootstrap.Modal(document.getElementById('humanFocusModal'));
    modal.show();
}

/**
 * Генерирует таблицу статистики по приложениям
 * @param {Array} data - Данные анализа
 * @returns {string} - HTML таблицы
 */
function generateAppStatsTable(data) {
    const appStats = {};
    
    data.forEach(period => {
        const app = period.appName;
        if (!appStats[app]) {
            appStats[app] = { 
                totalScore: 0, 
                count: 0, 
                totalTime: 0 
            };
        }
        appStats[app].totalScore += period.humanFocus.score;
        appStats[app].count++;
        appStats[app].totalTime += period.duration;
    });
    
    return Object.entries(appStats)
        .map(([app, stats]) => {
            const avgScore = Math.round(stats.totalScore / stats.count);
            const focusClass = avgScore >= 80 ? 'text-success' : avgScore >= 60 ? 'text-primary' : avgScore >= 40 ? 'text-warning' : 'text-danger';
            
            return `
                <tr>
                    <td>${app}</td>
                    <td><span class="${focusClass} fw-bold">${avgScore}%</span></td>
                    <td>${stats.count}</td>
                    <td>${formatDuration(stats.totalTime)}</td>
                </tr>
            `;
        })
        .join('');
}

