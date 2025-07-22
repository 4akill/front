/**
 * УМНЫЙ КАЛЬКУЛЯТОР РАБОЧЕГО ВРЕМЕНИ
 * Корректирует время активности на основе реальной активности мыши и клавиатуры
 * Исключает пассивные периоды из общего подсчета рабочего времени
 */

// Функция для форматирования времени с корректным округлением
function formatTimeNicely(hours, minutes) {
    // Округляем минуты до целого числа
    minutes = Math.round(minutes);

    // Если минуты равны 60, увеличиваем часы
    if (minutes === 60) {
        hours += 1;
        minutes = 0;
    }

    // Если часов нет (0), показываем только минуты
    if (hours === 0) {
        return `${minutes}м`;
    }
    
    // Если есть часы, показываем часы и минуты
    return `${hours}ч ${minutes}м`;
}

// Константы для определения активности
const ACTIVITY_CONSTANTS = {
    // Минимальная активность мыши для считания периода активным (движения + клики за минуту)
    MIN_MOUSE_ACTIVITY_PER_MINUTE: 5,
    
    // Максимальная длительность периода без активности мыши (в секундах)
    MAX_INACTIVE_PERIOD: 300, // 5 минут
    
    // Размер временного окна для анализа активности (в секундах)
    ACTIVITY_WINDOW_SIZE: 60, // 1 минута
    
    // Коэффициент снижения времени для пассивных периодов
    PASSIVE_TIME_COEFFICIENT: 0.1, // 10% от времени засчитывается для пассивных периодов
    PASSIVE_TIME_WEIGHT: 0.1, // 10% от времени засчитывается для пассивных периодов
    
    // Список фоновых процессов, которые нужно ПОЛНОСТЬЮ ИСКЛЮЧАТЬ из расчета времени
    BACKGROUND_PROCESSES: [
        'NVIDIA Overlay.exe',
        'NVIDIA GeForce Overlay',
        'TextInputHost.exe',
        'RdClient.Windows.exe',
        'Video.UI.exe', // Кино и ТВ (обычно в фоне)
        'Кино и ТВ',
        'Y.Music.exe', // Музыка (обычно в фоне)
        'SystemSettings.exe', // Кратковременные настройки
        'GameCenter.exe', // Игровой центр
        'dwm.exe', // Desktop Window Manager
        'explorer.exe', // Проводник (когда работает в фоне)
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
        'Taskmgr.exe', // Диспетчер задач (кратковременный)
        'MsMpEng.exe', // Windows Defender
        'SecurityHealthSystray.exe',
        'WinStore.App.exe',
        'Microsoft.Photos.exe', // Фотографии (в фоне)
        'Calculator.exe' // Калькулятор (кратковременный)
    ],
    
    // Процессы, которые считаются активными только при наличии мышиной активности
    CONDITIONAL_ACTIVE_PROCESSES: [
        'msedge.exe',
        'firefox.exe',
        'brave.exe',
        'chrome.exe',
        'Cursor.exe',
        'WorClient.exe',
        'notepad.exe',
        'Code.exe'
    ]
};

/**
 * Корректирует активности на основе реальной мышиной активности
 * @param {Array} activities - Массив активностей
 * @param {Array} mouseData - Данные активности мыши
 * @returns {Array} - Скорректированные активности
 */
function correctActivitiesWithMouseData(activities, mouseData) {
    console.log('🧠 Корректируем активности на основе реальной мышиной активности');
    console.log('📊 Входные данные:', {
        activities: activities.length,
        mouseData: mouseData.length
    });

    if (!mouseData || mouseData.length === 0) {
        console.warn('⚠️ Нет данных о мышиной активности, возвращаем активности без изменений');
        return activities;
    }

    // Создаем карту мышиной активности по времени
    const mouseActivityMap = createMouseActivityMap(mouseData);
    console.log('🗺️ Создана карта мышиной активности:', mouseActivityMap.size, 'временных окон');

    // Корректируем каждую активность
    const correctedActivities = [];
    
    activities.forEach((activity, index) => {
        if (!activity || !activity.duration) {
            return;
        }

        const startTime = activity.start || new Date(activity.timestamp || activity.start_time);
        const duration = parseInt(activity.duration) || 0;
        
        if (isNaN(startTime.getTime()) || duration <= 0) {
            return;
        }

        // Анализируем активность в течение времени работы приложения
        const activityAnalysis = analyzeActivityPeriod(startTime, duration, mouseActivityMap);
        
        // Создаем скорректированную активность
        const correctedActivity = {
            ...activity,
            original_duration: duration,
            corrected_duration: activityAnalysis.correctedDuration,
            duration: activityAnalysis.correctedDuration,
            is_real_activity: activityAnalysis.isRealActivity,
            activity_score: activityAnalysis.activityScore,
            active_periods: activityAnalysis.activePeriods,
            passive_periods: activityAnalysis.passivePeriods
        };

        if (correctedActivity.duration > 0) {
            correctedActivities.push(correctedActivity);
        }

        // Логируем значительные корректировки
        const timeDifference = duration - activityAnalysis.correctedDuration;
        if (timeDifference > 300) { // Больше 5 минут разницы
            console.log(`📝 Значительная корректировка активности #${index}:`, {
                app: activity.app_name || activity.application,
                originalDuration: `${Math.floor(duration/60)}м ${duration%60}с`,
                correctedDuration: `${Math.floor(activityAnalysis.correctedDuration/60)}м ${activityAnalysis.correctedDuration%60}с`,
                timeSaved: `${Math.floor(timeDifference/60)}м ${timeDifference%60}с`,
                activityScore: `${activityAnalysis.activityScore}%`
            });
        }
    });

    console.log('✅ Корректировка завершена:', {
        originalActivities: activities.length,
        correctedActivities: correctedActivities.length,
        totalOriginalTime: activities.reduce((sum, a) => sum + (parseInt(a.duration) || 0), 0),
        totalCorrectedTime: correctedActivities.reduce((sum, a) => sum + (parseInt(a.duration) || 0), 0)
    });

    return correctedActivities;
}

/**
 * Создает карту мышиной активности по временным окнам
 * @param {Array} mouseData - Данные активности мыши
 * @returns {Map} - Карта активности по временным окнам
 */
function createMouseActivityMap(mouseData) {
    const activityMap = new Map();
    
    mouseData.forEach(mouseEntry => {
        if (!mouseEntry.timestamp) return;
        
        const timestamp = new Date(mouseEntry.timestamp);
        if (isNaN(timestamp.getTime())) return;
        
        // Округляем до минуты для создания временного окна
        const windowStart = new Date(timestamp);
        windowStart.setSeconds(0, 0);
        const windowKey = windowStart.getTime().toString();
        
        if (!activityMap.has(windowKey)) {
            activityMap.set(windowKey, {
                timestamp: windowStart,
                clicks: 0,
                movements: 0,
                totalActivity: 0
            });
        }
        
        const window = activityMap.get(windowKey);
        window.clicks += parseInt(mouseEntry.mouse_clicks) || 0;
        window.movements += parseInt(mouseEntry.mouse_movements) || 0;
        window.totalActivity = window.clicks + window.movements;
    });
    
    return activityMap;
}

/**
 * Анализирует период активности приложения
 * @param {Date} startTime - Время начала активности
 * @param {number} duration - Длительность в секундах
 * @param {Map} mouseActivityMap - Карта мышиной активности
 * @returns {Object} - Результат анализа
 */
function analyzeActivityPeriod(startTime, duration, mouseActivityMap) {
    const endTime = new Date(startTime.getTime() + duration * 1000);
    
    let totalActiveTime = 0;
    let totalPassiveTime = 0;
    let activePeriods = 0;
    let passivePeriods = 0;
    
    // Анализируем каждую минуту периода активности
    for (let currentTime = new Date(startTime); currentTime < endTime; currentTime.setMinutes(currentTime.getMinutes() + 1)) {
        const windowStart = new Date(currentTime);
        windowStart.setSeconds(0, 0);
        const windowKey = windowStart.getTime().toString();
        
        const mouseActivity = mouseActivityMap.get(windowKey);
        const activityLevel = mouseActivity ? mouseActivity.totalActivity : 0;
        
        // Определяем, является ли эта минута активной
        const isActiveMinute = activityLevel >= ACTIVITY_CONSTANTS.MIN_MOUSE_ACTIVITY_PER_MINUTE;
        
        const minuteDuration = Math.min(60, Math.floor((endTime - currentTime) / 1000));
        
        if (isActiveMinute) {
            totalActiveTime += minuteDuration;
            activePeriods++;
        } else {
            // Для пассивных периодов засчитываем только часть времени
            totalPassiveTime += minuteDuration * ACTIVITY_CONSTANTS.PASSIVE_TIME_COEFFICIENT;
            passivePeriods++;
        }
    }
    
    const correctedDuration = Math.floor(totalActiveTime + totalPassiveTime);
    const activityScore = duration > 0 ? Math.round((totalActiveTime / duration) * 100) : 0;
    const isRealActivity = activityScore >= 20; // Считаем реальной активностью если хотя бы 20% времени было активности
    
    return {
        correctedDuration,
        isRealActivity,
        activityScore,
        activePeriods,
        passivePeriods,
        originalDuration: duration,
        activeTime: Math.floor(totalActiveTime),
        passiveTime: Math.floor(totalPassiveTime)
    };
}

/**
 * Расширенная функция updateMainMetrics с учетом реальной активности
 * @param {Array} windowData - ТОЛЬКО данные активности окон (включая браузеры)
 * @param {Array} mouseData - ОПЦИОНАЛЬНО: данные активности мыши (если не передано, пытается получить из window.lastLoadedData)
 */
function updateMainMetricsWithRealActivity(windowData, mouseData = null) {
    console.log('🧠 Используем умный калькулятор рабочего времени ТОЛЬКО с WindowActivity');
    
    // ДЕТАЛЬНОЕ ЛОГИРОВАНИЕ ВХОДНЫХ ДАННЫХ
    console.log('📊 ДИАГНОСТИКА: Входные данные в умный калькулятор:', {
        totalActivities: windowData ? windowData.length : 0,
        mouseDataProvided: mouseData ? mouseData.length : 0,
        sampleActivities: windowData ? windowData.slice(0, 5) : []
    });
    
    if (windowData && windowData.length > 0) {
        console.log('🔍 ПЕРВЫЕ 5 АКТИВНОСТЕЙ:');
        windowData.slice(0, 5).forEach((activity, index) => {
            console.log(`   ${index + 1}. ${activity.app_name || activity.application || 'Unknown'}: ${activity.duration}с (${Math.floor((activity.duration || 0)/60)}м ${(activity.duration || 0)%60}с)`);
            console.log(`      Timestamp: ${activity.timestamp}`);
            console.log(`      Raw activity:`, activity);
        });
    }
    
    if (!windowData || windowData.length === 0) {
        console.log('❌ Нет данных для анализа активности');
        updateMetrics({ activities: [], mouse_activity: [], website_visits: [] });
        return;
    }

    // Получаем данные активности мыши из разных источников
    let mouseActivityData = mouseData;
    
    // Если данные мыши не переданы, пытаемся получить из window.lastLoadedData
    if (!mouseActivityData) {
        mouseActivityData = window.lastLoadedData?.mouse || [];
        console.log('🖱️ Данные мыши получены из window.lastLoadedData:', mouseActivityData.length);
    } else {
        console.log('🖱️ Данные мыши переданы напрямую:', mouseActivityData.length);
    }
    
    // Если все еще нет данных мыши, пытаемся получить из глобальных переменных
    if (!mouseActivityData || mouseActivityData.length === 0) {
        if (window.lastAnalyzedRawData?.mouseActivities) {
            mouseActivityData = window.lastAnalyzedRawData.mouseActivities;
            console.log('🖱️ Данные мыши получены из window.lastAnalyzedRawData:', mouseActivityData.length);
        }
    }
    
    console.log(`🖱️ Итоговые данные активности мыши: ${mouseActivityData.length} записей`);
    console.log(`📊 ИСПОЛЬЗУЕМ ТОЛЬКО WindowActivity: ${windowData.length} записей (включая ВСЕ активности)`);
    console.log('🚫 ОТКЛЮЧЕНО: browserData, websiteData - используем только windowData');
    
    // Предварительный анализ активностей для показа что будет исключено
    console.log('🔍 ПРЕДВАРИТЕЛЬНЫЙ АНАЛИЗ АКТИВНОСТЕЙ:');
    const backgroundActivities = [];
    const validActivities = [];
    
    windowData.forEach(activity => {
        const appName = activity.app_name || activity.application || '';
        const duration = parseInt(activity.duration) || 60;
        
        if (isBackgroundProcess(appName)) {
            backgroundActivities.push({
                app: appName,
                duration: `${Math.floor(duration/60)}м ${duration%60}с`
            });
        } else {
            validActivities.push({
                app: appName,
                duration: `${Math.floor(duration/60)}м ${duration%60}с`
            });
        }
    });
    
    console.log(`🚫 БУДУТ ИСКЛЮЧЕНЫ (${backgroundActivities.length} фоновых процессов):`);
    backgroundActivities.forEach(bg => {
        console.log(`   - ${bg.app}: ${bg.duration}`);
    });
    
    console.log(`✅ БУДУТ УЧТЕНЫ (${validActivities.length} активных процессов):`);
    validActivities.forEach(valid => {
        console.log(`   + ${valid.app}: ${valid.duration}`);
    });
    
    // Создаем карту активности мыши по минутам
    const mouseActivityMap = new Map();
    mouseActivityData.forEach(mouse => {
        const timestamp = new Date(mouse.timestamp);
        const minuteKey = `${timestamp.getFullYear()}-${timestamp.getMonth()}-${timestamp.getDate()}-${timestamp.getHours()}-${timestamp.getMinutes()}`;
        
        if (!mouseActivityMap.has(minuteKey)) {
            mouseActivityMap.set(minuteKey, { clicks: 0, movements: 0 });
        }
        
        const existing = mouseActivityMap.get(minuteKey);
        existing.clicks += mouse.mouse_clicks || 0;
        existing.movements += mouse.mouse_movements || 0;
    });

    console.log(`🖱️ Карта активности мыши создана для ${mouseActivityMap.size} минут`);

    // ИСПРАВЛЕННАЯ ЛОГИКА: Создаем уникальные временные интервалы ТОЛЬКО из windowData
    const uniqueTimeSlots = new Set();
    const timeSlotDetails = new Map(); // Для хранения детальной информации о каждом слоте
    
    // ОБРАБАТЫВАЕМ ТОЛЬКО windowData (в нем уже есть ВСЕ активности включая браузеры)
    windowData.forEach(activity => {
        const appName = activity.app_name || activity.application || '';
        
        // ВАЖНО: Полностью пропускаем фоновые процессы - они НЕ создают временные слоты
        if (isBackgroundProcess(appName)) {
            console.log(`🚫 ИСКЛЮЧЕН фоновый процесс: ${appName} (не участвует в расчете времени)`);
            return; // Пропускаем эту активность полностью
        }
        
        const startTime = new Date(activity.timestamp);
        const duration = parseInt(activity.duration) || 60;
        const endTime = new Date(startTime.getTime() + duration * 1000);
        
        console.log(`✅ ВКЛЮЧЕН в расчет: ${appName} (${Math.floor(duration/60)}м ${duration%60}с = ${duration} секунд)`);
        
        // Создаем минутные слоты, но запоминаем количество секунд в каждом
        for (let currentTime = new Date(startTime); currentTime < endTime; currentTime.setMinutes(currentTime.getMinutes() + 1)) {
            const minuteKey = `${currentTime.getFullYear()}-${currentTime.getMonth()}-${currentTime.getDate()}-${currentTime.getHours()}-${currentTime.getMinutes()}`;
            uniqueTimeSlots.add(minuteKey);
            
            // Вычисляем сколько секунд этой активности попадает в эту минуту
            const minuteStart = new Date(currentTime);
            const minuteEnd = new Date(currentTime.getTime() + 60000); // +1 минута
            const overlapStart = new Date(Math.max(startTime.getTime(), minuteStart.getTime()));
            const overlapEnd = new Date(Math.min(endTime.getTime(), minuteEnd.getTime()));
            const secondsInThisMinute = Math.max(0, Math.floor((overlapEnd - overlapStart) / 1000));
            
            if (!timeSlotDetails.has(minuteKey)) {
                timeSlotDetails.set(minuteKey, {
                    apps: new Set(),
                    maxSeconds: 0, // МАКСИМАЛЬНОЕ время в этом слоте
                    hasNonBackground: false,
                    mouseActivity: mouseActivityMap.get(minuteKey) || { clicks: 0, movements: 0 }
                });
            }
            
            const slotInfo = timeSlotDetails.get(minuteKey);
            slotInfo.apps.add(appName);
            // Берем МАКСИМУМ времени для этого слота (если несколько активностей пересекаются)
            slotInfo.maxSeconds = Math.max(slotInfo.maxSeconds, secondsInThisMinute);
            slotInfo.hasNonBackground = true; // Все процессы здесь уже не-фоновые
        }
    });
    
    console.log(`📊 Создано ${uniqueTimeSlots.size} уникальных минутных слотов ТОЛЬКО из windowData`);
    
    // Анализируем каждый уникальный временной слот
    let totalActiveSeconds = 0;
    let totalPassiveSeconds = 0;
    let realActiveSeconds = 0;
    
    uniqueTimeSlots.forEach(minuteKey => {
        const slotInfo = timeSlotDetails.get(minuteKey);
        const hasMouseActivity = slotInfo.mouseActivity.clicks > 0 || slotInfo.mouseActivity.movements >= ACTIVITY_CONSTANTS.MIN_MOUSE_ACTIVITY_PER_MINUTE;
        
        // Используем МАКСИМАЛЬНОЕ время в этом слоте
        const secondsInSlot = Math.min(60, slotInfo.maxSeconds);
        
        if (hasMouseActivity) {
            // Если есть активность мыши - считаем все секунды реально активными
            realActiveSeconds += secondsInSlot;
            totalActiveSeconds += secondsInSlot;
        } else if (slotInfo.hasNonBackground) {
            // Если нет активности мыши, но есть не-фоновое приложение - считаем пассивным
            totalPassiveSeconds += secondsInSlot;
        }
        
        const apps = Array.from(slotInfo.apps).join(', ');
        console.log(`⏰ ${minuteKey}: ${secondsInSlot}сек (МАКС:${slotInfo.maxSeconds}с), ${hasMouseActivity ? 'РЕАЛЬНО АКТИВНАЯ' : 'ПАССИВНАЯ'} (мышь: ${hasMouseActivity}, приложения: ${apps})`);
    });
    
    // Преобразуем секунды в минуты для передачи в dashboard
    const realActiveTimeMinutes = Math.round(realActiveSeconds / 60);
    const passiveTimeMinutes = Math.round(totalPassiveSeconds / 60);
    
    // ИСПРАВЛЕНИЕ: Рассчитываем МАШИННОЕ общее время (от первой до последней активности)
    const machineTimeInfo = calculateMachineTime(windowData);
    const machineTimeMinutes = machineTimeInfo.totalMachineTimeMinutes;
    
    console.log(`⏰ ИСПРАВЛЕННАЯ статистика времени:`);
    console.log(`   🤖 МАШИННОЕ общее время (от первой до последней активности): ${machineTimeMinutes}м`);
    console.log(`   ✅ Реально активное время (с мышью): ${realActiveSeconds}сек = ${realActiveTimeMinutes}м`);
    console.log(`   😴 Пассивное время (фон/трей без мыши): ${totalPassiveSeconds}сек = ${passiveTimeMinutes}м`);
    console.log(`   📊 Сумма активное+пассивное: ${realActiveTimeMinutes + passiveTimeMinutes}м`);
    
    // Пересчитываем коэффициент активности на основе активного времени от общего машинного времени
    const realActivityPercent = machineTimeMinutes > 0 ? ((realActiveTimeMinutes / machineTimeMinutes) * 100) : 0;
    console.log(`   📈 Коэффициент активности: ${realActivityPercent.toFixed(1)}% (${realActiveTimeMinutes}м / ${machineTimeMinutes}м)`);

    // Проверяем, есть ли данные для отображения
    if (machineTimeMinutes === 0) {
        console.log('⚠️ Нет данных для отображения - все активности были исключены как фоновые процессы');
        updateMetricsToZero();
        return;
    }

    // Обрабатываем активности для отображения (ТОЛЬКО из windowData)
    const processedActivities = windowData.map(activity => {
        const appName = activity.app_name || activity.application || '';
        const timestamp = new Date(activity.timestamp);
        const minuteKey = `${timestamp.getFullYear()}-${timestamp.getMonth()}-${timestamp.getDate()}-${timestamp.getHours()}-${timestamp.getMinutes()}`;
        
        const mouseActivity = mouseActivityMap.get(minuteKey) || { clicks: 0, movements: 0 };
        const hasMouseActivity = mouseActivity.clicks > 0 || mouseActivity.movements >= ACTIVITY_CONSTANTS.MIN_MOUSE_ACTIVITY_PER_MINUTE;
        const isBackground = isBackgroundProcess(appName);
        const weight = getActivityWeight(appName, hasMouseActivity);
        
        // Активность считается реальной если:
        // 1. Не фоновый процесс И есть активность мыши
        // 2. ИЛИ высокий вес активности
        const isRealActivity = (!isBackground && hasMouseActivity) || weight > 0.5;
        
        return {
            ...activity,
            is_real_activity: isRealActivity,
            activity_type: isRealActivity ? 'active' : (isBackground ? 'background' : 'passive'),
            real_activity_score: weight,
            mouse_clicks: mouseActivity.clicks,
            mouse_movements: mouseActivity.movements,
            is_background: isBackground
        };
    });

    // Обновляем метрики с ПРАВИЛЬНЫМ расчетом времени
    const processedData = {
        activities: processedActivities, // ТОЛЬКО из windowData
        mouse_activity: mouseActivityData, // Переданные или полученные данные мыши
        website_visits: [], // Пустой массив - не используем для расчета времени
        browser_activity: [], // Пустой массив - не используем для расчета времени
        real_activity_stats: {
            total_time: machineTimeMinutes, // МАШИННОЕ общее время от первой до последней активности
            active_time: realActiveTimeMinutes, // Реально активное время с мышью
            passive_time: passiveTimeMinutes, // Пассивное время фон/трей без мыши
            activity_ratio: machineTimeMinutes > 0 ? realActiveTimeMinutes / machineTimeMinutes : 0,
            // Продуктивное время = реально активное время
            productive_time: realActiveTimeMinutes,
            productivity_score: realActivityPercent
        }
    };

    console.log('✅ ИСПРАВЛЕНО: Используем ТОЛЬКО windowData, отключены browserData и websiteData');
    updateMetrics(processedData);

    // Сохраняем метрики для других функций
    const metrics = {
        totalWorkTime: machineTimeMinutes, // Машинное общее время
        totalProductiveTime: realActiveTimeMinutes, // Реально активное время
        totalBreakTime: passiveTimeMinutes, // Пассивное время
        avgProductivity: Math.round((realActiveTimeMinutes / machineTimeMinutes) * 100), // Процент от машинного времени
        activities: processedData.activities || []
    };
}

/**
 * Рассчитывает уникальные временные интервалы из активностей
 * @param {Array} activities - Массив активностей
 * @returns {Object} - Объект с общим количеством уникальных минут
 */
function calculateUniqueTimeIntervals(activities) {
    const timeSlots = new Set();
    
    activities.forEach(activity => {
        const startTime = new Date(activity.timestamp);
        const duration = activity.duration || 60; // По умолчанию 60 секунд
        const endTime = new Date(startTime.getTime() + duration * 1000);
        
        // Добавляем каждую минуту периода активности в Set
        for (let time = new Date(startTime); time < endTime; time.setMinutes(time.getMinutes() + 1)) {
            const minuteKey = `${time.getFullYear()}-${time.getMonth()}-${time.getDate()}-${time.getHours()}-${time.getMinutes()}`;
            timeSlots.add(minuteKey);
        }
    });
    
    return {
        totalMinutes: timeSlots.size,
        uniqueSlots: timeSlots
    };
}

/**
 * Рассчитывает временные интервалы с учетом активности мыши
 * @param {Array} activities - Массив активностей
 * @param {Map} mouseActivityMap - Карта активности мыши
 * @returns {Object} - Объект с активными и пассивными минутами
 */
function calculateTimeIntervalsWithMouseActivity(activities, mouseActivityMap) {
    const timeSlots = new Set();
    const activeSlots = new Set();
    const passiveSlots = new Set();
    
    activities.forEach(activity => {
        const startTime = new Date(activity.timestamp);
        const duration = activity.duration || 60;
        const endTime = new Date(startTime.getTime() + duration * 1000);
        
        for (let time = new Date(startTime); time < endTime; time.setMinutes(time.getMinutes() + 1)) {
            const minuteKey = `${time.getFullYear()}-${time.getMonth()}-${time.getDate()}-${time.getHours()}-${time.getMinutes()}`;
            timeSlots.add(minuteKey);
            
            // Проверяем активность мыши для этой минуты
            const mouseActivity = mouseActivityMap.get(minuteKey) || { clicks: 0, movements: 0 };
            const hasMouseActivity = mouseActivity.clicks > 0 || mouseActivity.movements >= ACTIVITY_CONSTANTS.MIN_MOUSE_ACTIVITY_PER_MINUTE;
            
            if (hasMouseActivity) {
                activeSlots.add(minuteKey);
            } else {
                passiveSlots.add(minuteKey);
            }
        }
    });
    
    return {
        totalMinutes: timeSlots.size,
        activeMinutes: activeSlots.size,
        passiveMinutes: passiveSlots.size,
        uniqueSlots: timeSlots
    };
}

/**
 * Рассчитывает метрики на основе скорректированных активностей
 * @param {Array} correctedActivities - Скорректированные активности
 * @returns {Object} - Рассчитанные метрики
 */
function calculateRealActivityMetrics(correctedActivities) {
    let totalWorkTime = 0; // в минутах
    let totalProductiveTime = 0; // в минутах
    let realActivityTime = 0; // время с реальной активностью
    let passiveTime = 0; // пассивное время
    let totalProductivitySum = 0;
    let totalActivities = 0;

    correctedActivities.forEach(activity => {
        const durationMinutes = (activity.corrected_duration || activity.duration) / 60;
        const productivity = activity.productivity_score || getProductivityScore(activity);
        const productiveTime = durationMinutes * (productivity / 100);
        
        totalWorkTime += durationMinutes;
        totalProductiveTime += productiveTime;
        totalProductivitySum += productivity;
        totalActivities++;
        
        // Учитываем реальную и пассивную активность
        if (activity.is_real_activity) {
            realActivityTime += durationMinutes;
        } else {
            passiveTime += durationMinutes;
        }
    });

    const avgProductivity = totalActivities > 0 ? (totalProductivitySum / totalActivities) : 0;
    const realActivityPercent = totalWorkTime > 0 ? (realActivityTime / totalWorkTime) * 100 : 0;

    return {
        totalWorkTime: Math.round(totalWorkTime),
        totalProductiveTime: Math.round(totalProductiveTime),
        realActivityTime: Math.round(realActivityTime),
        passiveTime: Math.round(passiveTime),
        avgProductivity: Math.round(avgProductivity),
        realActivityPercent: Math.round(realActivityPercent),
        totalActivities
    };
}

/**
 * Обновляет метрики в интерфейсе
 * @param {Object} metrics - Рассчитанные метрики
 */
function updateMetricsInUI(metrics) {
    // Общее рабочее время (показываем ОБЩЕЕ время от начала до конца)
    const totalWorkingTimeElement = document.getElementById('total-working-time');
    if (totalWorkingTimeElement) {
        // Показываем ОБЩЕЕ время (активное + пассивное)
        const totalTime = metrics.totalWorkTime || (metrics.realActivityTime + metrics.passiveTime) || 0;
        const activeTime = metrics.realActivityTime || 0;
        const hours = Math.floor(totalTime / 60);
        const minutes = Math.round(totalTime % 60);
        totalWorkingTimeElement.textContent = formatTimeNicely(hours, minutes);

        // Обновляем подзаголовок с информацией об общем времени активности
        const subtitle = totalWorkingTimeElement.parentElement.querySelector('.metric-subtitle');
        if (subtitle) {
            subtitle.textContent = `Общее время активности от начала до конца`;
        }
    }

    // Продуктивное время (теперь показываем АКТИВНОЕ время)
    const productiveTimeElement = document.getElementById('productive-time');
    if (productiveTimeElement) {
        const activeTime = metrics.realActivityTime || 0;
        const totalTime = metrics.totalWorkTime || (metrics.realActivityTime + metrics.passiveTime) || 0;
        const productiveHours = Math.floor(activeTime / 60);
        const productiveMinutes = Math.round(activeTime % 60);
        productiveTimeElement.textContent = formatTimeNicely(productiveHours, productiveMinutes);

        // Обновляем подзаголовок с процентом активного времени от общего
        const subtitle = productiveTimeElement.parentElement.querySelector('.metric-subtitle');
        if (subtitle && totalTime > 0) {
            const percent = ((activeTime / totalTime) * 100).toFixed(0);
            const totalTimeFormatted = formatTimeNicely(Math.floor(totalTime / 60), totalTime % 60);
            subtitle.textContent = `Активное время (${percent}% от общего ${totalTimeFormatted})`;
        }
    }

    // Средний балл продуктивности
    const activityScoreElement = document.getElementById('activity-score');
    if (activityScoreElement) {
        activityScoreElement.textContent = `${metrics.avgProductivity}%`;

        // Обновляем подзаголовок с информацией о реальной активности
        const subtitle = activityScoreElement.parentElement.querySelector('.metric-subtitle');
        if (subtitle) {
            subtitle.textContent = `Средний балл реальной активности`;
        }
    }

    // Время неактивности (пассивное время)
    const breakTimeElement = document.getElementById('break-time');
    if (breakTimeElement) {
        const passiveHours = Math.floor(metrics.passiveTime / 60);
        const passiveMinutes = Math.round(metrics.passiveTime % 60);
        breakTimeElement.textContent = formatTimeNicely(passiveHours, passiveMinutes);

        const subtitle = breakTimeElement.parentElement.querySelector('.metric-subtitle');
        if (subtitle) {
            subtitle.textContent = 'Время пассивной активности';
        }
    }
}

/**
 * Обнуляет метрики в интерфейсе
 */
function updateMetricsToZero() {
    const totalWorkingTimeElement = document.getElementById('total-working-time');
    if (totalWorkingTimeElement) {
        totalWorkingTimeElement.textContent = '0м';
        const subtitle = totalWorkingTimeElement.parentElement.querySelector('.metric-subtitle');
        if (subtitle) {
            subtitle.textContent = 'Нет данных для выбранного сотрудника';
        }
    }

    const productiveTimeElement = document.getElementById('productive-time');
    if (productiveTimeElement) {
        productiveTimeElement.textContent = '0м';
        const subtitle = productiveTimeElement.parentElement.querySelector('.metric-subtitle');
        if (subtitle) {
            subtitle.textContent = '0% от общего времени';
        }
    }

    const activityScoreElement = document.getElementById('activity-score');
    if (activityScoreElement) {
        activityScoreElement.textContent = '0%';
        const subtitle = activityScoreElement.parentElement.querySelector('.metric-subtitle');
        if (subtitle) {
            subtitle.textContent = 'Нет данных о продуктивности';
        }
    }

    const breakTimeElement = document.getElementById('break-time');
    if (breakTimeElement) {
        breakTimeElement.textContent = '0м';
        const subtitle = breakTimeElement.parentElement.querySelector('.metric-subtitle');
        if (subtitle) {
            subtitle.textContent = 'Нет данных о неактивности';
        }
    }
}

/**
 * Определяет, является ли процесс фоновым
 * @param {string} appName - Название приложения
 * @returns {boolean} - true если процесс фоновый
 */
function isBackgroundProcess(appName) {
    if (!appName) return false;
    
    // Приводим к нижнему регистру для сравнения
    const appNameLower = appName.toLowerCase();
    
    return ACTIVITY_CONSTANTS.BACKGROUND_PROCESSES.some(bg => {
        const bgLower = bg.toLowerCase();
        // Проверяем точное совпадение или частичное вхождение
        return appNameLower === bgLower || 
               appNameLower.includes(bgLower) || 
               bgLower.includes(appNameLower) ||
               // Дополнительные проверки для конкретных случаев
               (appNameLower.includes('nvidia') && bgLower.includes('nvidia')) ||
               (appNameLower.includes('video') && bgLower.includes('video')) ||
               (appNameLower.includes('кино') && bgLower.includes('кино')) ||
               (appNameLower.includes('overlay') && bgLower.includes('overlay'));
    });
}

/**
 * Определяет вес активности для процесса
 * @param {string} appName - Название приложения
 * @param {boolean} hasMouseActivity - Есть ли активность мыши
 * @returns {number} - Вес от 0 до 1
 */
function getActivityWeight(appName, hasMouseActivity) {
    if (!appName) return hasMouseActivity ? 1.0 : 0.1;
    
    // Фоновые процессы имеют минимальный вес
    if (isBackgroundProcess(appName)) {
        return 0.05; // 5% веса
    }
    
    // Условно активные процессы зависят от мышиной активности
    const isConditionalActive = ACTIVITY_CONSTANTS.CONDITIONAL_ACTIVE_PROCESSES.some(proc => 
        appName.includes(proc) || proc.includes(appName)
    );
    
    if (isConditionalActive) {
        return hasMouseActivity ? 1.0 : 0.2; // 100% если есть мышь, 20% если нет
    }
    
    // Остальные процессы
    return hasMouseActivity ? 1.0 : 0.3; // 100% если есть мышь, 30% если нет
}

/**
 * Фильтрует и группирует активности по временным окнам
 * @param {Array} activities - Массив активностей
 * @param {Map} mouseActivityMap - Карта активности мыши
 * @returns {Object} - Сгруппированные данные
 */
function filterAndGroupActivities(activities, mouseActivityMap) {
    const timeWindows = new Map();
    
    console.log('🔍 Анализируем активности с учетом фоновых процессов');
    
    activities.forEach(activity => {
        const appName = activity.app_name || activity.application || '';
        const timestamp = new Date(activity.timestamp);
        const duration = parseInt(activity.duration) || 60;
        
        // Создаем ключ для минуты
        const minuteKey = `${timestamp.getFullYear()}-${timestamp.getMonth()}-${timestamp.getDate()}-${timestamp.getHours()}-${timestamp.getMinutes()}`;
        
        if (!timeWindows.has(minuteKey)) {
            timeWindows.set(minuteKey, {
                timestamp: new Date(timestamp.getFullYear(), timestamp.getMonth(), timestamp.getDate(), timestamp.getHours(), timestamp.getMinutes()),
                activities: [],
                mouseActivity: mouseActivityMap.get(minuteKey) || { clicks: 0, movements: 0 },
                totalWeight: 0,
                hasRealActivity: false
            });
        }
        
        const window = timeWindows.get(minuteKey);
        const mouseActivity = window.mouseActivity;
        const hasMouseActivity = mouseActivity.clicks > 0 || mouseActivity.movements >= ACTIVITY_CONSTANTS.MIN_MOUSE_ACTIVITY_PER_MINUTE;
        
        const weight = getActivityWeight(appName, hasMouseActivity);
        const isBackground = isBackgroundProcess(appName);
        
        window.activities.push({
            ...activity,
            weight: weight,
            isBackground: isBackground,
            hasMouseActivity: hasMouseActivity
        });
        
        // Увеличиваем общий вес только для не-фоновых процессов
        if (!isBackground) {
            window.totalWeight += weight;
        }
        
        // Определяем, есть ли реальная активность в этом окне
        if (hasMouseActivity && !isBackground) {
            window.hasRealActivity = true;
        }
        
        console.log(`📱 ${minuteKey}: ${appName} - вес: ${weight}, фон: ${isBackground}, мышь: ${hasMouseActivity}`);
    });
    
    return timeWindows;
}

/**
 * Рассчитывает МАШИННОЕ общее время от первой до последней активности (включая все перерывы)
 * @param {Array} windowData - Данные активности окон
 * @returns {Object} - Объект с информацией о машинном времени
 */
function calculateMachineTime(windowData) {
    console.log('🤖 [МАШИННОЕ ВРЕМЯ] Расчет общего времени от первой до последней активности');
    
    if (!windowData || windowData.length === 0) {
        return {
            totalMachineTimeMinutes: 0,
            firstActivity: null,
            lastActivity: null
        };
    }
    
    // Фильтруем только не-фоновые процессы
    const validActivities = windowData.filter(activity => {
        const appName = activity.app_name || activity.application || '';
        return !isBackgroundProcess(appName);
    });
    
    if (validActivities.length === 0) {
        console.log('⚠️ [МАШИННОЕ ВРЕМЯ] Все активности - фоновые процессы');
        return {
            totalMachineTimeMinutes: 0,
            firstActivity: null,
            lastActivity: null
        };
    }
    
    // Сортируем активности по времени
    const sortedActivities = validActivities.sort((a, b) => {
        return new Date(a.timestamp) - new Date(b.timestamp);
    });
    
    // Находим первую и последнюю активность
    const firstActivity = sortedActivities[0];
    const lastActivity = sortedActivities[sortedActivities.length - 1];
    
    const firstTime = new Date(firstActivity.timestamp);
    const lastTime = new Date(lastActivity.timestamp);
    const lastDuration = parseInt(lastActivity.duration) || 0;
    const lastEndTime = new Date(lastTime.getTime() + lastDuration * 1000);
    
    // Рассчитываем МАШИННОЕ время = от первой активности до конца последней активности
    const machineTimeMs = lastEndTime - firstTime;
    const machineTimeMinutes = Math.round(machineTimeMs / (1000 * 60));
    
    console.log('🤖 [МАШИННОЕ ВРЕМЯ] Результат расчета:');
    console.log(`   📅 Первая активность: ${firstActivity.app_name} в ${firstTime.toLocaleTimeString()}`);
    console.log(`   📅 Последняя активность: ${lastActivity.app_name} в ${lastTime.toLocaleTimeString()} - ${lastEndTime.toLocaleTimeString()}`);
    console.log(`   ⏰ МАШИННОЕ общее время: ${machineTimeMinutes}м (${Math.floor(machineTimeMinutes/60)}ч ${machineTimeMinutes%60}м)`);
    
    return {
        totalMachineTimeMinutes: machineTimeMinutes,
        firstActivity: firstActivity,
        lastActivity: lastActivity,
        firstTime: firstTime,
        lastEndTime: lastEndTime
    };
}

/**
 * Рассчитывает РЕАЛЬНОЕ общее время на основе временных сессий
 * @param {Array} windowData - Данные активности окон
 * @returns {Object} - Объект с информацией о реальных сессиях
 */
function calculateRealSessionTime(windowData) {
    console.log('⏰ [ИСПРАВЛЕНИЕ] Расчет РЕАЛЬНОГО общего времени на основе сессий');
    
    if (!windowData || windowData.length === 0) {
        return {
            totalSessionTimeMinutes: 0,
            sessions: [],
            sessionCount: 0
        };
    }
    
    // Фильтруем только не-фоновые процессы
    const validActivities = windowData.filter(activity => {
        const appName = activity.app_name || activity.application || '';
        return !isBackgroundProcess(appName);
    });
    
    if (validActivities.length === 0) {
        console.log('⚠️ [ИСПРАВЛЕНИЕ] Все активности - фоновые процессы');
        return {
            totalSessionTimeMinutes: 0,
            sessions: [],
            sessionCount: 0
        };
    }
    
    // Сортируем активности по времени
    const sortedActivities = validActivities.sort((a, b) => {
        return new Date(a.timestamp) - new Date(b.timestamp);
    });
    
    console.log('📊 [ИСПРАВЛЕНИЕ] Анализируем активности для поиска сессий:');
    sortedActivities.forEach((activity, index) => {
        const time = new Date(activity.timestamp);
        const duration = parseInt(activity.duration) || 0;
        const endTime = new Date(time.getTime() + duration * 1000);
        console.log(`   ${index + 1}. ${activity.app_name}: ${time.toLocaleTimeString()} - ${endTime.toLocaleTimeString()} (${Math.floor(duration/60)}м ${duration%60}с)`);
    });
    
    // Группируем активности в сессии (перерыв больше 15 минут = новая сессия)
    const sessions = [];
    let currentSession = null;
    const SESSION_GAP_MINUTES = 15; // Перерыв больше 15 минут = новая сессия
    
    sortedActivities.forEach(activity => {
        const activityStart = new Date(activity.timestamp);
        const activityDuration = parseInt(activity.duration) || 0;
        const activityEnd = new Date(activityStart.getTime() + activityDuration * 1000);
        
        if (!currentSession) {
            // Первая активность - начинаем новую сессию
            currentSession = {
                start: activityStart,
                end: activityEnd,
                activities: [activity]
            };
        } else {
            // Проверяем, продолжается ли текущая сессия
            const gapMinutes = (activityStart - currentSession.end) / (1000 * 60);
            
            if (gapMinutes <= SESSION_GAP_MINUTES) {
                // Продолжаем текущую сессию
                currentSession.end = new Date(Math.max(currentSession.end.getTime(), activityEnd.getTime()));
                currentSession.activities.push(activity);
            } else {
                // Завершаем текущую сессию и начинаем новую
                sessions.push(currentSession);
                currentSession = {
                    start: activityStart,
                    end: activityEnd,
                    activities: [activity]
                };
            }
        }
    });
    
    // Добавляем последнюю сессию
    if (currentSession) {
        sessions.push(currentSession);
    }
    
    // Рассчитываем общее время сессий
    let totalSessionTimeMinutes = 0;
    
    console.log('📊 [ИСПРАВЛЕНИЕ] Найденные сессии:');
    sessions.forEach((session, index) => {
        const sessionDurationMs = session.end - session.start;
        const sessionDurationMinutes = Math.round(sessionDurationMs / (1000 * 60));
        totalSessionTimeMinutes += sessionDurationMinutes;
        
        console.log(`   Сессия ${index + 1}: ${session.start.toLocaleTimeString()} - ${session.end.toLocaleTimeString()} = ${sessionDurationMinutes}м (${session.activities.length} активностей)`);
    });
    
    console.log(`⏰ [ИСПРАВЛЕНИЕ] ИТОГО реальное общее время: ${totalSessionTimeMinutes}м (${sessions.length} сессий)`);
    
    return {
        totalSessionTimeMinutes,
        sessions,
        sessionCount: sessions.length
    };
}

// Экспортируем функции для использования в основном файле
window.correctActivitiesWithMouseData = correctActivitiesWithMouseData;
window.updateMainMetricsWithRealActivity = updateMainMetricsWithRealActivity;
window.calculateRealActivityMetrics = calculateRealActivityMetrics;
window.calculateRealSessionTime = calculateRealSessionTime;
window.calculateMachineTime = calculateMachineTime;

console.log('🧠 Умный калькулятор рабочего времени загружен! Теперь система будет учитывать РЕАЛЬНУЮ активность пользователя.'); 