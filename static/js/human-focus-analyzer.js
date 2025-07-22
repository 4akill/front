/**
 * АНАЛИЗАТОР ЧЕЛОВЕЧЕСКОГО ФОКУСА ВНИМАНИЯ
 * Автор: AI Assistant
 * Дата: 2025-01-22
 * Версия: 1.0
 * Назначение: Оценка когнитивного присутствия и вовлеченности человека
 * 
 * Отличие от машинной активности:
 * - Машинная активность: CPU, GPU, RAM, движения мыши, нажатия клавиш
 * - Человеческий фокус: Согласованность, ритм, непрерывность, контекст
 */

// Константы для анализа человеческого фокуса
const HUMAN_FOCUS_CONSTANTS = {
    // Временные окна для анализа
    ANALYSIS_WINDOW_SECONDS: 60,        // Основное окно анализа (1 минута)
    MICRO_WINDOW_SECONDS: 5,            // Микроокно для детального анализа
    MACRO_WINDOW_SECONDS: 300,          // Макроокно для контекста (5 минут)
    
    // Пороги для определения активности
    THRESHOLDS: {
        // Минимальная активность для считания "живым"
        MIN_MOUSE_MOVEMENTS: 3,         // движений за микроокно
        MIN_KEYBOARD_EVENTS: 1,         // событий за микроокно
        MIN_CPU_DELTA: 5,               // изменение CPU за микроокно (%)
        
        // Пороги для определения фокуса
        FOCUS_CONSISTENCY_THRESHOLD: 0.7,   // согласованность действий
        FOCUS_RHYTHM_THRESHOLD: 0.6,        // ритмичность активности
        FOCUS_CONTINUITY_THRESHOLD: 0.8,    // непрерывность
        
        // Пороги для определения вовлеченности
        ENGAGEMENT_THRESHOLD: 0.5,          // минимальная вовлеченность
        HIGH_ENGAGEMENT_THRESHOLD: 0.8,     // высокая вовлеченность
        
        // Максимальный фокус без активности окна
        MAX_FOCUS_WITHOUT_WINDOW: 0.5       // 50% максимум
    },
    
    // Веса для различных каналов активности
    WEIGHTS: {
        MOUSE_MOVEMENT: 0.25,           // Движения мыши
        MOUSE_CLICKS: 0.20,             // Клики мыши
        KEYBOARD_EVENTS: 0.30,          // Клавиатурные события
        CPU_ACTIVITY: 0.15,             // Активность CPU
        GPU_ACTIVITY: 0.05,             // Активность GPU (менее важно)
        RAM_CHANGES: 0.05,              // Изменения RAM
        WINDOW_FOCUS: 0.40,             // Фокус окна (самый важный)
        VISIBILITY_EVENTS: 0.35         // События видимости
    },
    
    // Паттерны ложноположительной активности
    FALSE_POSITIVE_PATTERNS: {
        // Фоновое видео (высокий GPU, низкая активность мыши/клавиатуры)
        BACKGROUND_VIDEO: {
            gpu_threshold: 30,
            mouse_threshold: 2,
            keyboard_threshold: 0
        },
        
        // Idle скрипты (регулярная CPU активность без пользователя)
        IDLE_SCRIPTS: {
            cpu_regularity: 0.9,       // очень регулярная активность
            user_activity: 0.1         // минимальная активность пользователя
        },
        
        // Автоматические обновления
        AUTO_UPDATES: {
            ram_growth_rate: 10,        // MB/сек
            cpu_spike_duration: 30      // секунд
        }
    },
    
    // Типы приложений для контекстного анализа
    APP_CONTEXTS: {
        DEVELOPMENT: {
            apps: ['Cursor.exe', 'Code.exe', 'IntelliJ IDEA.exe', 'Visual Studio.exe'],
            focus_patterns: {
                typing_bursts: true,        // всплески печати
                mouse_precision: true,      // точные движения мыши
                cpu_compilation: true       // всплески CPU при компиляции
            }
        },
        
        BROWSING: {
            apps: ['msedge.exe', 'chrome.exe', 'firefox.exe', 'brave.exe'],
            focus_patterns: {
                scrolling: true,            // скроллинг
                click_navigation: true,     // навигация кликами
                reading_pauses: true        // паузы для чтения
            }
        },
        
        COMMUNICATION: {
            apps: ['Telegram.exe', 'WhatsApp.exe', 'Teams.exe', 'Slack.exe'],
            focus_patterns: {
                message_bursts: true,       // всплески сообщений
                notification_response: true, // реакция на уведомления
                typing_indicators: true     // индикаторы печати
            }
        },
        
        OFFICE_WORK: {
            apps: ['WINWORD.EXE', 'EXCEL.EXE', 'POWERPNT.EXE'],
            focus_patterns: {
                document_editing: true,     // редактирование документов
                formatting_activity: true,  // форматирование
                save_frequency: true        // частота сохранений
            }
        }
    }
};

/**
 * Главная функция для вычисления оценки человеческого фокуса
 * @param {Object} focusWindow - Окно данных для анализа
 * @param {Array} focusWindow.mouseEvents - События мыши
 * @param {Array} focusWindow.keyEvents - События клавиатуры  
 * @param {Array} focusWindow.cpuLoad - Загрузка CPU
 * @param {Array} focusWindow.gpuLoad - Загрузка GPU
 * @param {Array} focusWindow.ramUsage - Использование RAM
 * @param {Array} focusWindow.visibilityEvents - События видимости окна
 * @param {Object} focusWindow.windowContext - Контекст окна (приложение, заголовок)
 * @returns {Object} - Оценка фокуса и детальная информация
 */
function computeHumanFocusScore(focusWindow) {
    console.log('🧠 Начинаем анализ человеческого фокуса внимания');
    console.log('📊 Входные данные:', {
        mouseEvents: focusWindow.mouseEvents?.length || 0,
        keyEvents: focusWindow.keyEvents?.length || 0,
        cpuLoad: focusWindow.cpuLoad?.length || 0,
        gpuLoad: focusWindow.gpuLoad?.length || 0,
        ramUsage: focusWindow.ramUsage?.length || 0,
        visibilityEvents: focusWindow.visibilityEvents?.length || 0,
        windowContext: focusWindow.windowContext
    });
    
    // Валидация входных данных
    if (!validateFocusWindow(focusWindow)) {
        return createEmptyFocusResult('Недостаточно данных для анализа');
    }
    
    // УРОВЕНЬ 1: Анализ сырого поведения
    const rawBehaviorAnalysis = analyzeRawBehavior(focusWindow);
    console.log('📊 Уровень 1 - Сырое поведение:', rawBehaviorAnalysis);
    
    // УРОВЕНЬ 2: Анализ корреляции и ритма
    const correlationAnalysis = analyzeCorrelationAndRhythm(focusWindow, rawBehaviorAnalysis);
    console.log('📊 Уровень 2 - Корреляция и ритм:', correlationAnalysis);
    
    // УРОВЕНЬ 3: Анализ согласованности с видимостью окна
    const visibilityAnalysis = analyzeVisibilityConsistency(focusWindow, correlationAnalysis);
    console.log('📊 Уровень 3 - Согласованность с видимостью:', visibilityAnalysis);
    
    // УРОВЕНЬ 4: Системное подтверждение
    const systemConfirmation = analyzeSystemConfirmation(focusWindow, visibilityAnalysis);
    console.log('📊 Уровень 4 - Системное подтверждение:', systemConfirmation);
    
    // Обнаружение ложноположительных паттернов
    const falsePositiveDetection = detectFalsePositives(focusWindow, systemConfirmation);
    console.log('🔍 Обнаружение ложноположительных паттернов:', falsePositiveDetection);
    
    // Финальный расчет оценки фокуса
    const finalScore = calculateFinalFocusScore(
        rawBehaviorAnalysis,
        correlationAnalysis, 
        visibilityAnalysis,
        systemConfirmation,
        falsePositiveDetection
    );
    
    const result = {
        score: Math.round(finalScore.score),
        tag: getFocusTag(finalScore.score),
        confidence: finalScore.confidence,
        breakdown: {
            rawBehavior: rawBehaviorAnalysis,
            correlation: correlationAnalysis,
            visibility: visibilityAnalysis,
            systemConfirmation: systemConfirmation,
            falsePositiveAdjustment: falsePositiveDetection
        },
        insights: generateFocusInsights(finalScore, focusWindow),
        recommendations: generateRecommendations(finalScore, focusWindow)
    };
    
    console.log('✅ Финальная оценка человеческого фокуса:', result);
    return result;
}

/**
 * Валидация окна данных для анализа
 * @param {Object} focusWindow - Окно данных
 * @returns {boolean} - true если данные валидны
 */
function validateFocusWindow(focusWindow) {
    if (!focusWindow || typeof focusWindow !== 'object') {
        console.warn('⚠️ Окно данных не является объектом');
        return false;
    }
    
    // Проверяем наличие хотя бы одного канала данных
    const hasMouseData = focusWindow.mouseEvents && focusWindow.mouseEvents.length > 0;
    const hasKeyData = focusWindow.keyEvents && focusWindow.keyEvents.length > 0;
    const hasCpuData = focusWindow.cpuLoad && focusWindow.cpuLoad.length > 0;
    const hasVisibilityData = focusWindow.visibilityEvents && focusWindow.visibilityEvents.length > 0;
    
    if (!hasMouseData && !hasKeyData && !hasCpuData && !hasVisibilityData) {
        console.warn('⚠️ Нет данных ни в одном канале');
        return false;
    }
    
    return true;
}

/**
 * Создает пустой результат анализа фокуса
 * @param {string} reason - Причина пустого результата
 * @returns {Object} - Пустой результат
 */
function createEmptyFocusResult(reason) {
    return {
        score: 0,
        tag: 'no_data',
        confidence: 0,
        breakdown: {
            rawBehavior: { score: 0, details: {} },
            correlation: { score: 0, details: {} },
            visibility: { score: 0, details: {} },
            systemConfirmation: { score: 0, details: {} },
            falsePositiveAdjustment: { score: 0, details: {} }
        },
        insights: [`Анализ невозможен: ${reason}`],
        recommendations: ['Убедитесь, что система мониторинга работает корректно']
    };
}

/**
 * УРОВЕНЬ 1: Анализ сырого поведения (движения, нажатия)
 * @param {Object} focusWindow - Окно данных
 * @returns {Object} - Результат анализа сырого поведения
 */
function analyzeRawBehavior(focusWindow) {
    console.log('🔍 Анализ сырого поведения...');
    
    const mouseEvents = focusWindow.mouseEvents || [];
    const keyEvents = focusWindow.keyEvents || [];
    
    // Анализ активности мыши
    const mouseAnalysis = analyzeMouseBehavior(mouseEvents);
    
    // Анализ активности клавиатуры
    const keyboardAnalysis = analyzeKeyboardBehavior(keyEvents);
    
    // Комбинированная оценка сырого поведения
    const rawScore = (
        mouseAnalysis.score * HUMAN_FOCUS_CONSTANTS.WEIGHTS.MOUSE_MOVEMENT +
        keyboardAnalysis.score * HUMAN_FOCUS_CONSTANTS.WEIGHTS.KEYBOARD_EVENTS
    ) / (HUMAN_FOCUS_CONSTANTS.WEIGHTS.MOUSE_MOVEMENT + HUMAN_FOCUS_CONSTANTS.WEIGHTS.KEYBOARD_EVENTS);
    
    return {
        score: rawScore,
        details: {
            mouse: mouseAnalysis,
            keyboard: keyboardAnalysis
        },
        isActive: rawScore > 0.2,
        intensity: getRawBehaviorIntensity(rawScore)
    };
}

/**
 * Анализ поведения мыши
 * @param {Array} mouseEvents - События мыши
 * @returns {Object} - Результат анализа мыши
 */
function analyzeMouseBehavior(mouseEvents) {
    if (!mouseEvents || mouseEvents.length === 0) {
        return { score: 0, movements: 0, clicks: 0, patterns: [] };
    }
    
    let totalMovements = 0;
    let totalClicks = 0;
    const patterns = [];
    
    // Анализируем события мыши
    mouseEvents.forEach(event => {
        totalMovements += event.mouse_movements || 0;
        totalClicks += event.mouse_clicks || 0;
    });
    
    // Определяем паттерны поведения мыши
    if (totalMovements > 50 && totalClicks < 5) {
        patterns.push('scrolling'); // Скроллинг
    }
    if (totalClicks > 10) {
        patterns.push('clicking'); // Активные клики
    }
    if (totalMovements > 20 && totalClicks > 5) {
        patterns.push('navigation'); // Навигация
    }
    
    // Нормализуем оценку (0-1)
    const movementScore = Math.min(totalMovements / 100, 1);
    const clickScore = Math.min(totalClicks / 20, 1);
    const combinedScore = (movementScore * 0.6 + clickScore * 0.4);
    
    return {
        score: combinedScore,
        movements: totalMovements,
        clicks: totalClicks,
        patterns: patterns,
        intensity: combinedScore > 0.7 ? 'high' : combinedScore > 0.3 ? 'medium' : 'low'
    };
}

/**
 * Анализ поведения клавиатуры
 * @param {Array} keyEvents - События клавиатуры
 * @returns {Object} - Результат анализа клавиатуры
 */
function analyzeKeyboardBehavior(keyEvents) {
    if (!keyEvents || keyEvents.length === 0) {
        return { score: 0, events: 0, patterns: [] };
    }
    
    let totalEvents = 0;
    const patterns = [];
    
    // Анализируем события клавиатуры
    keyEvents.forEach(event => {
        totalEvents += event.keyboard_events || 0;
    });
    
    // Определяем паттерны поведения клавиатуры
    if (totalEvents > 50) {
        patterns.push('typing'); // Активная печать
    }
    if (totalEvents > 10 && totalEvents < 30) {
        patterns.push('shortcuts'); // Использование горячих клавиш
    }
    
    // Нормализуем оценку (0-1)
    const keyboardScore = Math.min(totalEvents / 100, 1);
    
    return {
        score: keyboardScore,
        events: totalEvents,
        patterns: patterns,
        intensity: keyboardScore > 0.7 ? 'high' : keyboardScore > 0.3 ? 'medium' : 'low'
    };
}

/**
 * Определяет интенсивность сырого поведения
 * @param {number} score - Оценка сырого поведения
 * @returns {string} - Уровень интенсивности
 */
function getRawBehaviorIntensity(score) {
    if (score > 0.8) return 'very_high';
    if (score > 0.6) return 'high';
    if (score > 0.4) return 'medium';
    if (score > 0.2) return 'low';
    return 'very_low';
}

/**
 * УРОВЕНЬ 2: Анализ корреляции и ритма
 * @param {Object} focusWindow - Окно данных
 * @param {Object} rawBehaviorAnalysis - Результат анализа сырого поведения
 * @returns {Object} - Результат анализа корреляции и ритма
 */
function analyzeCorrelationAndRhythm(focusWindow, rawBehaviorAnalysis) {
    console.log('🔍 Анализ корреляции и ритма...');
    
    // Анализ плотности активности
    const densityAnalysis = analyzeDensity(focusWindow);
    
    // Анализ ритмичности
    const rhythmAnalysis = analyzeRhythm(focusWindow);
    
    // Анализ непрерывности
    const continuityAnalysis = analyzeContinuity(focusWindow);
    
    // Корреляция между каналами
    const correlationAnalysis = analyzeChannelCorrelation(focusWindow);
    
    // Комбинированная оценка
    const correlationScore = (
        densityAnalysis.score * 0.25 +
        rhythmAnalysis.score * 0.25 +
        continuityAnalysis.score * 0.25 +
        correlationAnalysis.score * 0.25
    );
    
    return {
        score: correlationScore,
        details: {
            density: densityAnalysis,
            rhythm: rhythmAnalysis,
            continuity: continuityAnalysis,
            correlation: correlationAnalysis
        },
        consistency: correlationScore > HUMAN_FOCUS_CONSTANTS.THRESHOLDS.FOCUS_CONSISTENCY_THRESHOLD
    };
}

/**
 * Анализ плотности активности
 * @param {Object} focusWindow - Окно данных
 * @returns {Object} - Результат анализа плотности
 */
function analyzeDensity(focusWindow) {
    const mouseEvents = focusWindow.mouseEvents || [];
    const keyEvents = focusWindow.keyEvents || [];
    
    // Создаем временные интервалы (микроокна)
    const intervals = createTimeIntervals(focusWindow, HUMAN_FOCUS_CONSTANTS.MICRO_WINDOW_SECONDS);
    
    let activeIntervals = 0;
    let totalActivity = 0;
    
    intervals.forEach(interval => {
        const mouseActivity = getActivityInInterval(mouseEvents, interval);
        const keyActivity = getActivityInInterval(keyEvents, interval);
        
        const intervalActivity = mouseActivity + keyActivity;
        if (intervalActivity > 0) {
            activeIntervals++;
            totalActivity += intervalActivity;
        }
    });
    
    const densityScore = intervals.length > 0 ? activeIntervals / intervals.length : 0;
    const averageActivity = activeIntervals > 0 ? totalActivity / activeIntervals : 0;
    
    return {
        score: densityScore,
        activeIntervals: activeIntervals,
        totalIntervals: intervals.length,
        averageActivity: averageActivity,
        level: densityScore > 0.7 ? 'high' : densityScore > 0.4 ? 'medium' : 'low'
    };
}

/**
 * Анализ ритмичности активности
 * @param {Object} focusWindow - Окно данных
 * @returns {Object} - Результат анализа ритма
 */
function analyzeRhythm(focusWindow) {
    const mouseEvents = focusWindow.mouseEvents || [];
    const keyEvents = focusWindow.keyEvents || [];
    
    // Создаем временные интервалы
    const intervals = createTimeIntervals(focusWindow, HUMAN_FOCUS_CONSTANTS.MICRO_WINDOW_SECONDS);
    
    const activityLevels = intervals.map(interval => {
        const mouseActivity = getActivityInInterval(mouseEvents, interval);
        const keyActivity = getActivityInInterval(keyEvents, interval);
        return mouseActivity + keyActivity;
    });
    
    // Анализ ритмичности через вариацию
    const mean = activityLevels.reduce((sum, level) => sum + level, 0) / activityLevels.length;
    const variance = activityLevels.reduce((sum, level) => sum + Math.pow(level - mean, 2), 0) / activityLevels.length;
    const standardDeviation = Math.sqrt(variance);
    
    // Коэффициент вариации (обратный ритмичности)
    const coefficientOfVariation = mean > 0 ? standardDeviation / mean : 1;
    const rhythmScore = Math.max(0, 1 - coefficientOfVariation);
    
    return {
        score: rhythmScore,
        mean: mean,
        variance: variance,
        standardDeviation: standardDeviation,
        coefficientOfVariation: coefficientOfVariation,
        level: rhythmScore > 0.7 ? 'rhythmic' : rhythmScore > 0.4 ? 'moderate' : 'chaotic'
    };
}

/**
 * Анализ непрерывности активности
 * @param {Object} focusWindow - Окно данных
 * @returns {Object} - Результат анализа непрерывности
 */
function analyzeContinuity(focusWindow) {
    const mouseEvents = focusWindow.mouseEvents || [];
    const keyEvents = focusWindow.keyEvents || [];
    
    // Создаем временные интервалы
    const intervals = createTimeIntervals(focusWindow, HUMAN_FOCUS_CONSTANTS.MICRO_WINDOW_SECONDS);
    
    let continuousSegments = 0;
    let currentSegmentLength = 0;
    let maxSegmentLength = 0;
    let totalActiveTime = 0;
    
    intervals.forEach(interval => {
        const mouseActivity = getActivityInInterval(mouseEvents, interval);
        const keyActivity = getActivityInInterval(keyEvents, interval);
        const hasActivity = (mouseActivity + keyActivity) > 0;
        
        if (hasActivity) {
            currentSegmentLength++;
            totalActiveTime += HUMAN_FOCUS_CONSTANTS.MICRO_WINDOW_SECONDS;
        } else {
            if (currentSegmentLength > 0) {
                continuousSegments++;
                maxSegmentLength = Math.max(maxSegmentLength, currentSegmentLength);
                currentSegmentLength = 0;
            }
        }
    });
    
    // Завершаем последний сегмент
    if (currentSegmentLength > 0) {
        continuousSegments++;
        maxSegmentLength = Math.max(maxSegmentLength, currentSegmentLength);
    }
    
    const totalTime = intervals.length * HUMAN_FOCUS_CONSTANTS.MICRO_WINDOW_SECONDS;
    const continuityScore = totalTime > 0 ? totalActiveTime / totalTime : 0;
    
    return {
        score: continuityScore,
        continuousSegments: continuousSegments,
        maxSegmentLength: maxSegmentLength,
        totalActiveTime: totalActiveTime,
        totalTime: totalTime,
        level: continuityScore > 0.8 ? 'continuous' : continuityScore > 0.5 ? 'moderate' : 'fragmented'
    };
}

/**
 * Анализ корреляции между каналами
 * @param {Object} focusWindow - Окно данных
 * @returns {Object} - Результат анализа корреляции
 */
function analyzeChannelCorrelation(focusWindow) {
    const mouseEvents = focusWindow.mouseEvents || [];
    const keyEvents = focusWindow.keyEvents || [];
    const cpuLoad = focusWindow.cpuLoad || [];
    
    // Создаем временные интервалы
    const intervals = createTimeIntervals(focusWindow, HUMAN_FOCUS_CONSTANTS.MICRO_WINDOW_SECONDS);
    
    const mouseActivity = intervals.map(interval => getActivityInInterval(mouseEvents, interval));
    const keyActivity = intervals.map(interval => getActivityInInterval(keyEvents, interval));
    const cpuActivity = intervals.map(interval => getActivityInInterval(cpuLoad, interval));
    
    // Вычисляем корреляции
    const mouseKeyCorrelation = calculateCorrelation(mouseActivity, keyActivity);
    const mouseCpuCorrelation = calculateCorrelation(mouseActivity, cpuActivity);
    const keyCpuCorrelation = calculateCorrelation(keyActivity, cpuActivity);
    
    // Средняя корреляция
    const averageCorrelation = (mouseKeyCorrelation + mouseCpuCorrelation + keyCpuCorrelation) / 3;
    
    return {
        score: Math.max(0, averageCorrelation), // Только положительные корреляции
        mouseKeyCorrelation: mouseKeyCorrelation,
        mouseCpuCorrelation: mouseCpuCorrelation,
        keyCpuCorrelation: keyCpuCorrelation,
        averageCorrelation: averageCorrelation,
        level: averageCorrelation > 0.7 ? 'high' : averageCorrelation > 0.3 ? 'medium' : 'low'
    };
}

/**
 * УРОВЕНЬ 3: Анализ согласованности с видимостью окна
 * @param {Object} focusWindow - Окно данных
 * @param {Object} correlationAnalysis - Результат анализа корреляции
 * @returns {Object} - Результат анализа согласованности с видимостью
 */
function analyzeVisibilityConsistency(focusWindow, correlationAnalysis) {
    console.log('🔍 Анализ согласованности с видимостью окна...');
    
    const visibilityEvents = focusWindow.visibilityEvents || [];
    const windowContext = focusWindow.windowContext || {};
    
    // Анализ событий видимости
    const visibilityAnalysis = analyzeVisibilityEvents(visibilityEvents);
    
    // Анализ контекста окна
    const contextAnalysis = analyzeWindowContext(windowContext);
    
    // Согласованность активности с фокусом окна
    const consistencyAnalysis = analyzeActivityConsistency(focusWindow, visibilityAnalysis);
    
    // Комбинированная оценка
    let visibilityScore = (
        visibilityAnalysis.score * 0.4 +
        contextAnalysis.score * 0.3 +
        consistencyAnalysis.score * 0.3
    );
    
    // Ограничение: если окно не активно, максимальный фокус = 50%
    if (!visibilityAnalysis.isWindowActive) {
        visibilityScore = Math.min(visibilityScore, HUMAN_FOCUS_CONSTANTS.THRESHOLDS.MAX_FOCUS_WITHOUT_WINDOW);
    }
    
    return {
        score: visibilityScore,
        details: {
            visibility: visibilityAnalysis,
            context: contextAnalysis,
            consistency: consistencyAnalysis
        },
        isWindowActive: visibilityAnalysis.isWindowActive,
        windowFocusTime: visibilityAnalysis.focusTime
    };
}

/**
 * Анализ событий видимости окна
 * @param {Array} visibilityEvents - События видимости
 * @returns {Object} - Результат анализа видимости
 */
function analyzeVisibilityEvents(visibilityEvents) {
    if (!visibilityEvents || visibilityEvents.length === 0) {
        return {
            score: 0,
            isWindowActive: false,
            focusTime: 0,
            blurTime: 0,
            switchCount: 0
        };
    }
    
    let focusTime = 0;
    let blurTime = 0;
    let switchCount = 0;
    let isCurrentlyActive = false;
    
    // Анализируем события видимости
    for (let i = 0; i < visibilityEvents.length; i++) {
        const event = visibilityEvents[i];
        const nextEvent = visibilityEvents[i + 1];
        
        if (event.type === 'focus') {
            isCurrentlyActive = true;
            switchCount++;
            
            // Вычисляем время фокуса до следующего события
            if (nextEvent) {
                const duration = new Date(nextEvent.timestamp) - new Date(event.timestamp);
                focusTime += duration;
            }
        } else if (event.type === 'blur') {
            isCurrentlyActive = false;
            
            // Вычисляем время размытия до следующего события
            if (nextEvent) {
                const duration = new Date(nextEvent.timestamp) - new Date(event.timestamp);
                blurTime += duration;
            }
        }
    }
    
    const totalTime = focusTime + blurTime;
    const focusRatio = totalTime > 0 ? focusTime / totalTime : 0;
    
    return {
        score: focusRatio,
        isWindowActive: isCurrentlyActive,
        focusTime: focusTime,
        blurTime: blurTime,
        switchCount: switchCount,
        focusRatio: focusRatio,
        level: focusRatio > 0.8 ? 'focused' : focusRatio > 0.5 ? 'moderate' : 'distracted'
    };
}

/**
 * Анализ контекста окна
 * @param {Object} windowContext - Контекст окна
 * @returns {Object} - Результат анализа контекста
 */
function analyzeWindowContext(windowContext) {
    if (!windowContext || !windowContext.application) {
        return {
            score: 0.5, // Нейтральная оценка при отсутствии контекста
            appType: 'unknown',
            isProductive: false,
            focusPatterns: []
        };
    }
    
    const appName = windowContext.application;
    const windowTitle = windowContext.title || '';
    
    // Определяем тип приложения
    let appType = 'unknown';
    let focusPatterns = [];
    let isProductive = false;
    
    for (const [type, config] of Object.entries(HUMAN_FOCUS_CONSTANTS.APP_CONTEXTS)) {
        if (config.apps.some(app => appName.includes(app))) {
            appType = type.toLowerCase();
            focusPatterns = Object.keys(config.focus_patterns);
            isProductive = ['development', 'office_work'].includes(type.toLowerCase());
            break;
        }
    }
    
    // Оценка на основе типа приложения
    let contextScore = 0.5; // Базовая оценка
    
    if (isProductive) {
        contextScore = 0.8; // Высокая оценка для продуктивных приложений
    } else if (appType === 'browsing') {
        contextScore = 0.6; // Средняя оценка для браузинга
    } else if (appType === 'communication') {
        contextScore = 0.7; // Выше средней для коммуникации
    }
    
    return {
        score: contextScore,
        appType: appType,
        isProductive: isProductive,
        focusPatterns: focusPatterns,
        application: appName,
        title: windowTitle
    };
}

/**
 * Анализ согласованности активности с фокусом окна
 * @param {Object} focusWindow - Окно данных
 * @param {Object} visibilityAnalysis - Результат анализа видимости
 * @returns {Object} - Результат анализа согласованности
 */
function analyzeActivityConsistency(focusWindow, visibilityAnalysis) {
    const mouseEvents = focusWindow.mouseEvents || [];
    const keyEvents = focusWindow.keyEvents || [];
    const visibilityEvents = focusWindow.visibilityEvents || [];
    
    if (visibilityEvents.length === 0) {
        return {
            score: 0.5, // Нейтральная оценка при отсутствии данных о видимости
            consistentPeriods: 0,
            inconsistentPeriods: 0
        };
    }
    
    // Создаем временные интервалы
    const intervals = createTimeIntervals(focusWindow, HUMAN_FOCUS_CONSTANTS.MICRO_WINDOW_SECONDS);
    
    let consistentPeriods = 0;
    let inconsistentPeriods = 0;
    
    intervals.forEach(interval => {
        const mouseActivity = getActivityInInterval(mouseEvents, interval);
        const keyActivity = getActivityInInterval(keyEvents, interval);
        const hasUserActivity = (mouseActivity + keyActivity) > 0;
        
        const isWindowFocused = isWindowFocusedInInterval(visibilityEvents, interval);
        
        // Согласованность: активность есть когда окно в фокусе, нет активности когда окно не в фокусе
        if ((hasUserActivity && isWindowFocused) || (!hasUserActivity && !isWindowFocused)) {
            consistentPeriods++;
        } else {
            inconsistentPeriods++;
        }
    });
    
    const totalPeriods = consistentPeriods + inconsistentPeriods;
    const consistencyScore = totalPeriods > 0 ? consistentPeriods / totalPeriods : 0;
    
    return {
        score: consistencyScore,
        consistentPeriods: consistentPeriods,
        inconsistentPeriods: inconsistentPeriods,
        totalPeriods: totalPeriods,
        level: consistencyScore > 0.8 ? 'consistent' : consistencyScore > 0.5 ? 'moderate' : 'inconsistent'
    };
}

/**
 * УРОВЕНЬ 4: Системное подтверждение
 * @param {Object} focusWindow - Окно данных
 * @param {Object} visibilityAnalysis - Результат анализа видимости
 * @returns {Object} - Результат системного подтверждения
 */
function analyzeSystemConfirmation(focusWindow, visibilityAnalysis) {
    console.log('🔍 Системное подтверждение...');
    
    const cpuLoad = focusWindow.cpuLoad || [];
    const gpuLoad = focusWindow.gpuLoad || [];
    const ramUsage = focusWindow.ramUsage || [];
    
    // Анализ пульсаций CPU/GPU
    const cpuPulsations = analyzePulsations(cpuLoad, 'cpu');
    const gpuPulsations = analyzePulsations(gpuLoad, 'gpu');
    
    // Анализ изменений RAM
    const ramChanges = analyzeRamChanges(ramUsage);
    
    // Корреляция системных метрик с активностью пользователя
    const systemCorrelation = analyzeSystemUserCorrelation(focusWindow);
    
    // Комбинированная оценка системного подтверждения
    const systemScore = (
        cpuPulsations.score * 0.3 +
        gpuPulsations.score * 0.2 +
        ramChanges.score * 0.2 +
        systemCorrelation.score * 0.3
    );
    
    return {
        score: systemScore,
        details: {
            cpuPulsations: cpuPulsations,
            gpuPulsations: gpuPulsations,
            ramChanges: ramChanges,
            systemCorrelation: systemCorrelation
        },
        systemActivity: systemScore > 0.6 ? 'high' : systemScore > 0.3 ? 'medium' : 'low'
    };
}

/**
 * Анализ пульсаций CPU/GPU
 * @param {Array} loadData - Данные загрузки
 * @param {string} type - Тип ресурса ('cpu' или 'gpu')
 * @returns {Object} - Результат анализа пульсаций
 */
function analyzePulsations(loadData, type) {
    if (!loadData || loadData.length === 0) {
        return {
            score: 0,
            pulsations: 0,
            averageLoad: 0,
            variance: 0
        };
    }
    
    const loads = loadData.map(item => {
        if (type === 'cpu') {
            return item.cpu || item.cpu_percent || 0;
        } else {
            return item.gpu || item.gpu_percent || 0;
        }
    });
    
    // Вычисляем среднее и вариацию
    const averageLoad = loads.reduce((sum, load) => sum + load, 0) / loads.length;
    const variance = loads.reduce((sum, load) => sum + Math.pow(load - averageLoad, 2), 0) / loads.length;
    
    // Подсчитываем пульсации (значительные изменения)
    let pulsations = 0;
    const threshold = type === 'cpu' ? 10 : 5; // Порог для CPU и GPU
    
    for (let i = 1; i < loads.length; i++) {
        if (Math.abs(loads[i] - loads[i-1]) > threshold) {
            pulsations++;
        }
    }
    
    // Нормализуем оценку
    const pulsationScore = Math.min(pulsations / (loads.length * 0.3), 1); // 30% пульсаций = максимум
    const varianceScore = Math.min(variance / 100, 1); // Нормализуем вариацию
    
    const combinedScore = (pulsationScore * 0.6 + varianceScore * 0.4);
    
    return {
        score: combinedScore,
        pulsations: pulsations,
        averageLoad: averageLoad,
        variance: variance,
        level: combinedScore > 0.7 ? 'high' : combinedScore > 0.3 ? 'medium' : 'low'
    };
}

/**
 * Анализ изменений RAM
 * @param {Array} ramUsage - Данные использования RAM
 * @returns {Object} - Результат анализа изменений RAM
 */
function analyzeRamChanges(ramUsage) {
    if (!ramUsage || ramUsage.length === 0) {
        return {
            score: 0,
            changes: 0,
            trend: 'stable',
            growthRate: 0
        };
    }
    
    const ramValues = ramUsage.map(item => item.ram || item.memory || item.ram_percent || 0);
    
    // Анализируем изменения
    let changes = 0;
    let totalGrowth = 0;
    
    for (let i = 1; i < ramValues.length; i++) {
        const change = ramValues[i] - ramValues[i-1];
        if (Math.abs(change) > 1) { // Изменение больше 1%
            changes++;
        }
        totalGrowth += change;
    }
    
    const growthRate = ramValues.length > 1 ? totalGrowth / (ramValues.length - 1) : 0;
    
    // Определяем тренд
    let trend = 'stable';
    if (growthRate > 0.5) trend = 'growing';
    else if (growthRate < -0.5) trend = 'declining';
    
    // Нормализуем оценку
    const changeScore = Math.min(changes / (ramValues.length * 0.2), 1);
    
    return {
        score: changeScore,
        changes: changes,
        trend: trend,
        growthRate: growthRate,
        level: changeScore > 0.6 ? 'dynamic' : changeScore > 0.3 ? 'moderate' : 'stable'
    };
}

/**
 * Анализ корреляции системных метрик с активностью пользователя
 * @param {Object} focusWindow - Окно данных
 * @returns {Object} - Результат анализа корреляции
 */
function analyzeSystemUserCorrelation(focusWindow) {
    const mouseEvents = focusWindow.mouseEvents || [];
    const keyEvents = focusWindow.keyEvents || [];
    const cpuLoad = focusWindow.cpuLoad || [];
    
    // Создаем временные интервалы
    const intervals = createTimeIntervals(focusWindow, HUMAN_FOCUS_CONSTANTS.MICRO_WINDOW_SECONDS);
    
    const userActivity = intervals.map(interval => {
        const mouseActivity = getActivityInInterval(mouseEvents, interval);
        const keyActivity = getActivityInInterval(keyEvents, interval);
        return mouseActivity + keyActivity;
    });
    
    const cpuActivity = intervals.map(interval => {
        return getActivityInInterval(cpuLoad, interval);
    });
    
    // Вычисляем корреляцию
    const correlation = calculateCorrelation(userActivity, cpuActivity);
    
    return {
        score: Math.max(0, correlation), // Только положительные корреляции
        correlation: correlation,
        level: correlation > 0.7 ? 'high' : correlation > 0.3 ? 'medium' : 'low'
    };
}

/**
 * Обнаружение ложноположительных паттернов
 * @param {Object} focusWindow - Окно данных
 * @param {Object} systemConfirmation - Результат системного подтверждения
 * @returns {Object} - Результат обнаружения ложноположительных паттернов
 */
function detectFalsePositives(focusWindow, systemConfirmation) {
    console.log('🔍 Обнаружение ложноположительных паттернов...');
    
    const detectedPatterns = [];
    let adjustmentFactor = 1.0; // Коэффициент корректировки (1.0 = без корректировки)
    
    // Проверка на фоновое видео
    const backgroundVideoCheck = checkBackgroundVideo(focusWindow);
    if (backgroundVideoCheck.detected) {
        detectedPatterns.push('background_video');
        adjustmentFactor *= 0.3; // Снижаем оценку на 70%
    }
    
    // Проверка на idle скрипты
    const idleScriptsCheck = checkIdleScripts(focusWindow);
    if (idleScriptsCheck.detected) {
        detectedPatterns.push('idle_scripts');
        adjustmentFactor *= 0.5; // Снижаем оценку на 50%
    }
    
    // Проверка на автоматические обновления
    const autoUpdatesCheck = checkAutoUpdates(focusWindow);
    if (autoUpdatesCheck.detected) {
        detectedPatterns.push('auto_updates');
        adjustmentFactor *= 0.4; // Снижаем оценку на 60%
    }
    
    return {
        score: adjustmentFactor,
        detectedPatterns: detectedPatterns,
        details: {
            backgroundVideo: backgroundVideoCheck,
            idleScripts: idleScriptsCheck,
            autoUpdates: autoUpdatesCheck
        },
        adjustmentFactor: adjustmentFactor
    };
}

/**
 * Проверка на фоновое видео
 * @param {Object} focusWindow - Окно данных
 * @returns {Object} - Результат проверки
 */
function checkBackgroundVideo(focusWindow) {
    const gpuLoad = focusWindow.gpuLoad || [];
    const mouseEvents = focusWindow.mouseEvents || [];
    const keyEvents = focusWindow.keyEvents || [];
    
    if (gpuLoad.length === 0) {
        return { detected: false, confidence: 0 };
    }
    
    // Вычисляем средние значения
    const avgGpu = gpuLoad.reduce((sum, item) => sum + (item.gpu || 0), 0) / gpuLoad.length;
    const totalMouse = mouseEvents.reduce((sum, item) => sum + (item.mouse_movements || 0), 0);
    const totalKeys = keyEvents.reduce((sum, item) => sum + (item.keyboard_events || 0), 0);
    
    // Паттерн: высокий GPU, низкая активность пользователя
    const pattern = HUMAN_FOCUS_CONSTANTS.FALSE_POSITIVE_PATTERNS.BACKGROUND_VIDEO;
    
    const detected = (
        avgGpu > pattern.gpu_threshold &&
        totalMouse < pattern.mouse_threshold &&
        totalKeys < pattern.keyboard_threshold
    );
    
    const confidence = detected ? 0.8 : 0;
    
    return {
        detected: detected,
        confidence: confidence,
        avgGpu: avgGpu,
        totalMouse: totalMouse,
        totalKeys: totalKeys
    };
}

/**
 * Проверка на idle скрипты
 * @param {Object} focusWindow - Окно данных
 * @returns {Object} - Результат проверки
 */
function checkIdleScripts(focusWindow) {
    const cpuLoad = focusWindow.cpuLoad || [];
    const mouseEvents = focusWindow.mouseEvents || [];
    const keyEvents = focusWindow.keyEvents || [];
    
    if (cpuLoad.length < 5) {
        return { detected: false, confidence: 0 };
    }
    
    // Анализируем регулярность CPU активности
    const cpuValues = cpuLoad.map(item => item.cpu || 0);
    const mean = cpuValues.reduce((sum, val) => sum + val, 0) / cpuValues.length;
    const variance = cpuValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / cpuValues.length;
    const coefficientOfVariation = mean > 0 ? Math.sqrt(variance) / mean : 0;
    
    // Вычисляем активность пользователя
    const totalMouse = mouseEvents.reduce((sum, item) => sum + (item.mouse_movements || 0), 0);
    const totalKeys = keyEvents.reduce((sum, item) => sum + (item.keyboard_events || 0), 0);
    const userActivity = (totalMouse + totalKeys) / Math.max(cpuLoad.length, 1);
    
    const pattern = HUMAN_FOCUS_CONSTANTS.FALSE_POSITIVE_PATTERNS.IDLE_SCRIPTS;
    
    const detected = (
        coefficientOfVariation < (1 - pattern.cpu_regularity) && // Очень регулярная активность
        userActivity < pattern.user_activity
    );
    
    const confidence = detected ? 0.7 : 0;
    
    return {
        detected: detected,
        confidence: confidence,
        cpuRegularity: 1 - coefficientOfVariation,
        userActivity: userActivity
    };
}

/**
 * Проверка на автоматические обновления
 * @param {Object} focusWindow - Окно данных
 * @returns {Object} - Результат проверки
 */
function checkAutoUpdates(focusWindow) {
    const ramUsage = focusWindow.ramUsage || [];
    const cpuLoad = focusWindow.cpuLoad || [];
    
    if (ramUsage.length < 3 || cpuLoad.length < 3) {
        return { detected: false, confidence: 0 };
    }
    
    // Анализируем рост RAM
    const ramValues = ramUsage.map(item => item.ram || 0);
    let ramGrowth = 0;
    for (let i = 1; i < ramValues.length; i++) {
        ramGrowth += Math.max(0, ramValues[i] - ramValues[i-1]);
    }
    const ramGrowthRate = ramGrowth / (ramValues.length - 1);
    
    // Анализируем всплески CPU
    const cpuValues = cpuLoad.map(item => item.cpu || 0);
    const maxCpu = Math.max(...cpuValues);
    const avgCpu = cpuValues.reduce((sum, val) => sum + val, 0) / cpuValues.length;
    
    const pattern = HUMAN_FOCUS_CONSTANTS.FALSE_POSITIVE_PATTERNS.AUTO_UPDATES;
    
    const detected = (
        ramGrowthRate > pattern.ram_growth_rate ||
        (maxCpu > avgCpu * 2 && maxCpu > 50) // Всплеск CPU
    );
    
    const confidence = detected ? 0.6 : 0;
    
    return {
        detected: detected,
        confidence: confidence,
        ramGrowthRate: ramGrowthRate,
        maxCpu: maxCpu,
        avgCpu: avgCpu
    };
}

/**
 * Финальный расчет оценки фокуса
 * @param {Object} rawBehaviorAnalysis - Анализ сырого поведения
 * @param {Object} correlationAnalysis - Анализ корреляции
 * @param {Object} visibilityAnalysis - Анализ видимости
 * @param {Object} systemConfirmation - Системное подтверждение
 * @param {Object} falsePositiveDetection - Обнаружение ложноположительных паттернов
 * @returns {Object} - Финальная оценка фокуса
 */
function calculateFinalFocusScore(
    rawBehaviorAnalysis,
    correlationAnalysis,
    visibilityAnalysis,
    systemConfirmation,
    falsePositiveDetection
) {
    console.log('🎯 Финальный расчет оценки фокуса...');
    
    // Базовая оценка как взвешенная сумма уровней
    const baseScore = (
        rawBehaviorAnalysis.score * 0.25 +
        correlationAnalysis.score * 0.25 +
        visibilityAnalysis.score * 0.30 +
        systemConfirmation.score * 0.20
    );
    
    // Применяем корректировку на ложноположительные паттерны
    const adjustedScore = baseScore * falsePositiveDetection.adjustmentFactor;
    
    // Ограничиваем диапазон 0-100
    const finalScore = Math.max(0, Math.min(100, adjustedScore * 100));
    
    // Вычисляем уверенность в оценке
    const confidence = calculateConfidence(
        rawBehaviorAnalysis,
        correlationAnalysis,
        visibilityAnalysis,
        systemConfirmation
    );
    
    return {
        score: finalScore,
        confidence: confidence,
        baseScore: baseScore,
        adjustedScore: adjustedScore,
        components: {
            rawBehavior: rawBehaviorAnalysis.score,
            correlation: correlationAnalysis.score,
            visibility: visibilityAnalysis.score,
            systemConfirmation: systemConfirmation.score,
            falsePositiveAdjustment: falsePositiveDetection.adjustmentFactor
        }
    };
}

/**
 * Вычисляет уверенность в оценке
 * @param {Object} rawBehaviorAnalysis - Анализ сырого поведения
 * @param {Object} correlationAnalysis - Анализ корреляции
 * @param {Object} visibilityAnalysis - Анализ видимости
 * @param {Object} systemConfirmation - Системное подтверждение
 * @returns {number} - Уверенность (0-1)
 */
function calculateConfidence(rawBehaviorAnalysis, correlationAnalysis, visibilityAnalysis, systemConfirmation) {
    // Уверенность зависит от согласованности между уровнями
    const scores = [
        rawBehaviorAnalysis.score,
        correlationAnalysis.score,
        visibilityAnalysis.score,
        systemConfirmation.score
    ];
    
    const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
    const standardDeviation = Math.sqrt(variance);
    
    // Чем меньше разброс, тем выше уверенность
    const consistency = Math.max(0, 1 - standardDeviation);
    
    // Также учитываем наличие данных
    const dataCompleteness = (
        (rawBehaviorAnalysis.details.mouse.movements > 0 ? 0.25 : 0) +
        (rawBehaviorAnalysis.details.keyboard.events > 0 ? 0.25 : 0) +
        (visibilityAnalysis.details.visibility.focusTime > 0 ? 0.25 : 0) +
        (systemConfirmation.details.cpuPulsations.pulsations > 0 ? 0.25 : 0)
    );
    
    return Math.min(1, consistency * 0.7 + dataCompleteness * 0.3);
}

/**
 * Определяет тег фокуса на основе оценки
 * @param {number} score - Оценка фокуса (0-100)
 * @returns {string} - Тег фокуса
 */
function getFocusTag(score) {
    if (score >= 80) return 'high';
    if (score >= 60) return 'moderate';
    if (score >= 40) return 'low';
    if (score >= 20) return 'very_low';
    return 'no_focus';
}

/**
 * Генерирует инсайты о фокусе
 * @param {Object} finalScore - Финальная оценка
 * @param {Object} focusWindow - Окно данных
 * @returns {Array} - Массив инсайтов
 */
function generateFocusInsights(finalScore, focusWindow) {
    const insights = [];
    const score = finalScore.score;
    const components = finalScore.components;
    
    // Общая оценка
    if (score >= 80) {
        insights.push('🎯 Высокий уровень фокуса - отличная концентрация на задаче');
    } else if (score >= 60) {
        insights.push('✅ Умеренный фокус - хорошая вовлеченность в работу');
    } else if (score >= 40) {
        insights.push('⚠️ Низкий фокус - возможны отвлечения');
    } else {
        insights.push('❌ Очень низкий фокус - высокий уровень отвлечений');
    }
    
    // Анализ компонентов
    if (components.rawBehavior < 0.3) {
        insights.push('🖱️ Низкая активность мыши и клавиатуры');
    }
    
    if (components.correlation < 0.4) {
        insights.push('🔗 Слабая согласованность между каналами активности');
    }
    
    if (components.visibility < 0.5) {
        insights.push('👁️ Окно часто находится вне фокуса');
    }
    
    if (components.systemConfirmation < 0.3) {
        insights.push('💻 Низкая системная активность');
    }
    
    if (components.falsePositiveAdjustment < 0.8) {
        insights.push('🔍 Обнаружены признаки автоматической активности');
    }
    
    return insights;
}

/**
 * Генерирует рекомендации по улучшению фокуса
 * @param {Object} finalScore - Финальная оценка
 * @param {Object} focusWindow - Окно данных
 * @returns {Array} - Массив рекомендаций
 */
function generateRecommendations(finalScore, focusWindow) {
    const recommendations = [];
    const score = finalScore.score;
    const components = finalScore.components;
    
    if (score < 60) {
        recommendations.push('📱 Рассмотрите возможность отключения уведомлений');
        recommendations.push('⏰ Попробуйте технику Pomodoro для лучшей концентрации');
    }
    
    if (components.visibility < 0.5) {
        recommendations.push('🖥️ Сосредоточьтесь на одном окне за раз');
        recommendations.push('📐 Используйте полноэкранный режим для важных задач');
    }
    
    if (components.correlation < 0.4) {
        recommendations.push('🎯 Синхронизируйте действия мыши и клавиатуры');
        recommendations.push('⌨️ Используйте больше горячих клавиш для эффективности');
    }
    
    if (components.rawBehavior < 0.3) {
        recommendations.push('🏃 Делайте короткие перерывы для поддержания активности');
        recommendations.push('💪 Поддерживайте активное взаимодействие с интерфейсом');
    }
    
    return recommendations;
}

// ==================== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ====================

/**
 * Создает временные интервалы для анализа
 * @param {Object} focusWindow - Окно данных
 * @param {number} intervalSeconds - Размер интервала в секундах
 * @returns {Array} - Массив временных интервалов
 */
function createTimeIntervals(focusWindow, intervalSeconds) {
    // Находим временные границы из всех данных
    const allTimestamps = [];
    
    ['mouseEvents', 'keyEvents', 'cpuLoad', 'gpuLoad', 'ramUsage', 'visibilityEvents'].forEach(key => {
        const data = focusWindow[key] || [];
        data.forEach(item => {
            if (item.timestamp) {
                allTimestamps.push(new Date(item.timestamp));
            }
        });
    });
    
    if (allTimestamps.length === 0) {
        return [];
    }
    
    const startTime = new Date(Math.min(...allTimestamps));
    const endTime = new Date(Math.max(...allTimestamps));
    
    const intervals = [];
    let currentTime = new Date(startTime);
    
    while (currentTime < endTime) {
        const intervalEnd = new Date(currentTime.getTime() + intervalSeconds * 1000);
        intervals.push({
            start: new Date(currentTime),
            end: intervalEnd > endTime ? endTime : intervalEnd
        });
        currentTime = intervalEnd;
    }
    
    return intervals;
}

/**
 * Получает активность в определенном временном интервале
 * @param {Array} events - Массив событий
 * @param {Object} interval - Временной интервал
 * @returns {number} - Уровень активности
 */
function getActivityInInterval(events, interval) {
    if (!events || events.length === 0) return 0;
    
    let activity = 0;
    
    events.forEach(event => {
        const eventTime = new Date(event.timestamp);
        if (eventTime >= interval.start && eventTime <= interval.end) {
            // Суммируем различные типы активности
            activity += event.mouse_movements || 0;
            activity += event.mouse_clicks || 0;
            activity += event.keyboard_events || 0;
            activity += event.cpu || event.cpu_percent || 0;
            activity += event.gpu || event.gpu_percent || 0;
            activity += Math.abs(event.ram || event.memory || event.ram_percent || 0);
        }
    });
    
    return activity;
}

/**
 * Проверяет, находится ли окно в фокусе в определенном интервале
 * @param {Array} visibilityEvents - События видимости
 * @param {Object} interval - Временной интервал
 * @returns {boolean} - true если окно в фокусе
 */
function isWindowFocusedInInterval(visibilityEvents, interval) {
    if (!visibilityEvents || visibilityEvents.length === 0) return false;
    
    // Находим последнее событие видимости перед интервалом
    let lastEvent = null;
    
    for (const event of visibilityEvents) {
        const eventTime = new Date(event.timestamp);
        if (eventTime <= interval.start) {
            lastEvent = event;
        } else {
            break;
        }
    }
    
    // Если нет событий перед интервалом, считаем что окно не в фокусе
    if (!lastEvent) return false;
    
    // Проверяем тип последнего события
    return lastEvent.type === 'focus';
}

/**
 * Вычисляет корреляцию между двумя массивами
 * @param {Array} x - Первый массив
 * @param {Array} y - Второй массив
 * @returns {number} - Коэффициент корреляции (-1 до 1)
 */
function calculateCorrelation(x, y) {
    if (!x || !y || x.length !== y.length || x.length === 0) {
        return 0;
    }
    
    const n = x.length;
    const sumX = x.reduce((sum, val) => sum + val, 0);
    const sumY = y.reduce((sum, val) => sum + val, 0);
    const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
    const sumX2 = x.reduce((sum, val) => sum + val * val, 0);
    const sumY2 = y.reduce((sum, val) => sum + val * val, 0);
    
    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
    
    return denominator === 0 ? 0 : numerator / denominator;
}

// Экспорт главной функции
window.computeHumanFocusScore = computeHumanFocusScore;

console.log('🧠 Анализатор человеческого фокуса внимания загружен!');
console.log('📊 Доступна функция: computeHumanFocusScore(focusWindow)');
console.log('🎯 Анализирует когнитивное присутствие, а не просто машинную активность'); 