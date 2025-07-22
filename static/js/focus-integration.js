/**
 * ИНТЕГРАЦИЯ АНАЛИЗАТОРА ЧЕЛОВЕЧЕСКОГО ФОКУСА
 * Автор: AI Assistant
 * Дата: 2025-01-22
 * Версия: 1.0
 * Назначение: Интеграция анализатора человеческого фокуса с существующими модулями
 * 
 * Связывает:
 * - window-focus-analyzer.js (события фокуса окон)
 * - smart-spoiler-analyzer.js (системные метрики)
 * - human-focus-analyzer.js (анализ когнитивного присутствия)
 */

// Константы для интеграции
const FOCUS_INTEGRATION_CONSTANTS = {
    // Размер окна для анализа человеческого фокуса (в минутах)
    FOCUS_WINDOW_SIZE_MINUTES: 5,
    
    // Перекрытие между окнами (в минутах)
    WINDOW_OVERLAP_MINUTES: 1,
    
    // Минимальное количество данных для анализа
    MIN_DATA_POINTS: 3,
    
    // Интервал обновления анализа (в секундах)
    UPDATE_INTERVAL_SECONDS: 30,
    
    // Пороги для классификации фокуса
    FOCUS_THRESHOLDS: {
        HIGH: 80,
        MODERATE: 60,
        LOW: 40,
        VERY_LOW: 20
    }
};

/**
 * Главная функция интеграции - анализирует человеческий фокус для данных из анализатора фокуса
 * @param {Object} focusAnalyzerData - Данные из window-focus-analyzer.js
 * @returns {Object} - Результат анализа человеческого фокуса
 */
function analyzeHumanFocusFromFocusAnalyzer(focusAnalyzerData) {
    console.log('🔗 Интеграция: Анализ человеческого фокуса из данных анализатора фокуса');
    console.log('📊 Входные данные:', focusAnalyzerData);
    
    // Проверяем доступность анализатора человеческого фокуса
    if (typeof computeHumanFocusScore !== 'function') {
        console.error('❌ Анализатор человеческого фокуса недоступен');
        return createEmptyHumanFocusResult('Анализатор человеческого фокуса не загружен');
    }
    
    // Проверяем наличие данных
    if (!focusAnalyzerData || !focusAnalyzerData.windowActivities) {
        console.error('❌ Нет данных активности окон');
        return createEmptyHumanFocusResult('Нет данных активности окон');
    }
    
    // Преобразуем данные в формат для анализатора человеческого фокуса
    const focusWindows = createFocusWindowsFromAnalyzerData(focusAnalyzerData);
    console.log('📦 Создано окон для анализа:', focusWindows.length);
    
    // Анализируем каждое окно
    const focusResults = [];
    
    focusWindows.forEach((window, index) => {
        console.log(`🔍 Анализ окна ${index + 1}/${focusWindows.length}:`, {
            timeRange: `${window.startTime.toLocaleTimeString()} - ${window.endTime.toLocaleTimeString()}`,
            dataPoints: {
                mouse: window.mouseEvents?.length || 0,
                keyboard: window.keyEvents?.length || 0,
                cpu: window.cpuLoad?.length || 0,
                gpu: window.gpuLoad?.length || 0,
                ram: window.ramUsage?.length || 0,
                visibility: window.visibilityEvents?.length || 0
            }
        });
        
        // Анализируем человеческий фокус для этого окна
        const focusScore = computeHumanFocusScore(window);
        
        focusResults.push({
            window: window,
            focusScore: focusScore,
            timeRange: {
                start: window.startTime,
                end: window.endTime
            },
            index: index
        });
    });
    
    // Создаем сводный результат
    const summaryResult = createFocusSummary(focusResults);
    
    console.log('✅ Анализ человеческого фокуса завершен:', summaryResult);
    return summaryResult;
}

/**
 * Создает окна для анализа человеческого фокуса из данных анализатора фокуса
 * @param {Object} focusAnalyzerData - Данные из window-focus-analyzer.js
 * @returns {Array} - Массив окон для анализа
 */
function createFocusWindowsFromAnalyzerData(focusAnalyzerData) {
    console.log('📦 Создание окон для анализа человеческого фокуса...');
    
    const {
        windowActivities = [],
        mouseActivities = [],
        resourceData = [],
        browserActivities = [],
        websiteVisits = []
    } = focusAnalyzerData;
    
    // Находим временные границы
    const allTimestamps = [];
    
    [windowActivities, mouseActivities, resourceData].forEach(dataArray => {
        dataArray.forEach(item => {
            if (item.timestamp) {
                allTimestamps.push(new Date(item.timestamp));
            }
        });
    });
    
    if (allTimestamps.length === 0) {
        console.warn('⚠️ Нет временных меток в данных');
        return [];
    }
    
    const startTime = new Date(Math.min(...allTimestamps));
    const endTime = new Date(Math.max(...allTimestamps));
    
    console.log('⏰ Временные границы:', {
        start: startTime.toLocaleTimeString(),
        end: endTime.toLocaleTimeString(),
        duration: Math.round((endTime - startTime) / (1000 * 60)) + ' минут'
    });
    
    // Создаем перекрывающиеся окна
    const windows = [];
    const windowSizeMs = FOCUS_INTEGRATION_CONSTANTS.FOCUS_WINDOW_SIZE_MINUTES * 60 * 1000;
    const overlapMs = FOCUS_INTEGRATION_CONSTANTS.WINDOW_OVERLAP_MINUTES * 60 * 1000;
    const stepMs = windowSizeMs - overlapMs;
    
    let currentStart = new Date(startTime);
    
    while (currentStart < endTime) {
        const currentEnd = new Date(Math.min(currentStart.getTime() + windowSizeMs, endTime.getTime()));
        
        // Создаем окно данных
        const focusWindow = {
            startTime: new Date(currentStart),
            endTime: new Date(currentEnd),
            mouseEvents: filterDataByTimeRange(mouseActivities, currentStart, currentEnd),
            keyEvents: [], // Пока нет данных клавиатуры в focusAnalyzerData
            cpuLoad: filterDataByTimeRange(resourceData, currentStart, currentEnd, 'cpu'),
            gpuLoad: filterDataByTimeRange(resourceData, currentStart, currentEnd, 'gpu'),
            ramUsage: filterDataByTimeRange(resourceData, currentStart, currentEnd, 'ram'),
            visibilityEvents: createVisibilityEventsFromWindowActivities(
                filterDataByTimeRange(windowActivities, currentStart, currentEnd)
            ),
            windowContext: extractWindowContext(
                filterDataByTimeRange(windowActivities, currentStart, currentEnd)
            )
        };
        
        // Проверяем, достаточно ли данных для анализа
        if (hasEnoughDataForAnalysis(focusWindow)) {
            windows.push(focusWindow);
        }
        
        currentStart = new Date(currentStart.getTime() + stepMs);
    }
    
    console.log(`📦 Создано ${windows.length} окон для анализа`);
    return windows;
}

/**
 * Фильтрует данные по временному диапазону
 * @param {Array} data - Массив данных
 * @param {Date} startTime - Начальное время
 * @param {Date} endTime - Конечное время
 * @param {string} type - Тип данных для специальной обработки
 * @returns {Array} - Отфильтрованные данные
 */
function filterDataByTimeRange(data, startTime, endTime, type = null) {
    if (!data || !Array.isArray(data)) {
        return [];
    }
    
    const filtered = data.filter(item => {
        if (!item.timestamp) return false;
        
        const itemTime = new Date(item.timestamp);
        return itemTime >= startTime && itemTime <= endTime;
    });
    
    // Специальная обработка для разных типов данных
    if (type === 'cpu') {
        return filtered.map(item => ({
            timestamp: item.timestamp,
            cpu: item.cpu_percent || item.cpu || 0,
            cpu_percent: item.cpu_percent || item.cpu || 0
        }));
    } else if (type === 'gpu') {
        return filtered.map(item => ({
            timestamp: item.timestamp,
            gpu: item.gpu_percent || item.gpu || 0,
            gpu_percent: item.gpu_percent || item.gpu || 0
        }));
    } else if (type === 'ram') {
        return filtered.map(item => ({
            timestamp: item.timestamp,
            ram: item.ram_percent || item.memory || item.ram || 0,
            memory: item.ram_percent || item.memory || item.ram || 0,
            ram_percent: item.ram_percent || item.memory || item.ram || 0
        }));
    }
    
    return filtered;
}

/**
 * Создает события видимости из активностей окон
 * @param {Array} windowActivities - Активности окон
 * @returns {Array} - События видимости
 */
function createVisibilityEventsFromWindowActivities(windowActivities) {
    if (!windowActivities || windowActivities.length === 0) {
        return [];
    }
    
    const visibilityEvents = [];
    let lastApp = null;
    
    // Сортируем по времени
    const sortedActivities = windowActivities.sort((a, b) => 
        new Date(a.timestamp) - new Date(b.timestamp)
    );
    
    sortedActivities.forEach(activity => {
        const appName = activity.app_name || activity.application;
        
        if (appName !== lastApp) {
            // Blur предыдущего приложения
            if (lastApp) {
                visibilityEvents.push({
                    timestamp: activity.timestamp,
                    type: 'blur',
                    application: lastApp
                });
            }
            
            // Focus нового приложения
            visibilityEvents.push({
                timestamp: activity.timestamp,
                type: 'focus',
                application: appName
            });
            
            lastApp = appName;
        }
    });
    
    return visibilityEvents;
}

/**
 * Извлекает контекст окна из активностей
 * @param {Array} windowActivities - Активности окон
 * @returns {Object} - Контекст окна
 */
function extractWindowContext(windowActivities) {
    if (!windowActivities || windowActivities.length === 0) {
        return {};
    }
    
    // Находим наиболее частое приложение
    const appCounts = {};
    let mostFrequentApp = null;
    let maxCount = 0;
    
    windowActivities.forEach(activity => {
        const appName = activity.app_name || activity.application;
        if (appName) {
            appCounts[appName] = (appCounts[appName] || 0) + 1;
            if (appCounts[appName] > maxCount) {
                maxCount = appCounts[appName];
                mostFrequentApp = appName;
            }
        }
    });
    
    // Находим заголовок окна для наиболее частого приложения
    const appActivity = windowActivities.find(activity => 
        (activity.app_name || activity.application) === mostFrequentApp
    );
    
    return {
        application: mostFrequentApp,
        title: appActivity?.window_title || appActivity?.title || '',
        totalActivities: windowActivities.length,
        uniqueApps: Object.keys(appCounts).length
    };
}

/**
 * Проверяет, достаточно ли данных для анализа
 * @param {Object} focusWindow - Окно данных
 * @returns {boolean} - true если достаточно данных
 */
function hasEnoughDataForAnalysis(focusWindow) {
    const mouseCount = focusWindow.mouseEvents?.length || 0;
    const cpuCount = focusWindow.cpuLoad?.length || 0;
    const visibilityCount = focusWindow.visibilityEvents?.length || 0;
    
    const totalDataPoints = mouseCount + cpuCount + visibilityCount;
    
    return totalDataPoints >= FOCUS_INTEGRATION_CONSTANTS.MIN_DATA_POINTS;
}

/**
 * Создает сводный результат анализа фокуса
 * @param {Array} focusResults - Результаты анализа для каждого окна
 * @returns {Object} - Сводный результат
 */
function createFocusSummary(focusResults) {
    if (!focusResults || focusResults.length === 0) {
        return createEmptyHumanFocusResult('Нет результатов анализа');
    }
    
    // Вычисляем общие метрики
    const scores = focusResults.map(result => result.focusScore.score);
    const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const maxScore = Math.max(...scores);
    const minScore = Math.min(...scores);
    
    // Вычисляем уверенность
    const confidences = focusResults.map(result => result.focusScore.confidence);
    const averageConfidence = confidences.reduce((sum, conf) => sum + conf, 0) / confidences.length;
    
    // Анализируем распределение фокуса
    const focusDistribution = analyzeFocusDistribution(focusResults);
    
    // Собираем все инсайты
    const allInsights = [];
    const allRecommendations = [];
    
    focusResults.forEach(result => {
        allInsights.push(...result.focusScore.insights);
        allRecommendations.push(...result.focusScore.recommendations);
    });
    
    // Удаляем дубликаты
    const uniqueInsights = [...new Set(allInsights)];
    const uniqueRecommendations = [...new Set(allRecommendations)];
    
    // Создаем временную диаграмму фокуса
    const focusTimeline = createFocusTimeline(focusResults);
    
    return {
        summary: {
            averageScore: Math.round(averageScore),
            maxScore: maxScore,
            minScore: minScore,
            averageConfidence: averageConfidence,
            tag: getFocusTag(averageScore),
            windowsAnalyzed: focusResults.length
        },
        distribution: focusDistribution,
        timeline: focusTimeline,
        insights: uniqueInsights,
        recommendations: uniqueRecommendations,
        detailedResults: focusResults,
        metadata: {
            analysisTime: new Date().toISOString(),
            totalDataPoints: focusResults.reduce((sum, result) => {
                return sum + 
                    (result.window.mouseEvents?.length || 0) +
                    (result.window.cpuLoad?.length || 0) +
                    (result.window.visibilityEvents?.length || 0);
            }, 0)
        }
    };
}

/**
 * Анализирует распределение фокуса
 * @param {Array} focusResults - Результаты анализа
 * @returns {Object} - Распределение фокуса
 */
function analyzeFocusDistribution(focusResults) {
    const distribution = {
        high: 0,
        moderate: 0,
        low: 0,
        very_low: 0,
        no_focus: 0
    };
    
    focusResults.forEach(result => {
        const score = result.focusScore.score;
        const tag = result.focusScore.tag;
        
        if (tag in distribution) {
            distribution[tag]++;
        }
    });
    
    const total = focusResults.length;
    
    return {
        counts: distribution,
        percentages: {
            high: Math.round((distribution.high / total) * 100),
            moderate: Math.round((distribution.moderate / total) * 100),
            low: Math.round((distribution.low / total) * 100),
            very_low: Math.round((distribution.very_low / total) * 100),
            no_focus: Math.round((distribution.no_focus / total) * 100)
        },
        totalWindows: total
    };
}

/**
 * Создает временную диаграмму фокуса
 * @param {Array} focusResults - Результаты анализа
 * @returns {Array} - Временная диаграмма
 */
function createFocusTimeline(focusResults) {
    return focusResults.map(result => ({
        time: result.timeRange.start.toLocaleTimeString('ru-RU', { 
            hour: '2-digit', 
            minute: '2-digit' 
        }),
        score: result.focusScore.score,
        tag: result.focusScore.tag,
        confidence: result.focusScore.confidence,
        duration: Math.round((result.timeRange.end - result.timeRange.start) / (1000 * 60)), // в минутах
        primaryApp: result.window.windowContext?.application || 'Неизвестно'
    }));
}

/**
 * Создает пустой результат анализа человеческого фокуса
 * @param {string} reason - Причина пустого результата
 * @returns {Object} - Пустой результат
 */
function createEmptyHumanFocusResult(reason) {
    return {
        summary: {
            averageScore: 0,
            maxScore: 0,
            minScore: 0,
            averageConfidence: 0,
            tag: 'no_data',
            windowsAnalyzed: 0
        },
        distribution: {
            counts: { high: 0, moderate: 0, low: 0, very_low: 0, no_focus: 0 },
            percentages: { high: 0, moderate: 0, low: 0, very_low: 0, no_focus: 0 },
            totalWindows: 0
        },
        timeline: [],
        insights: [`Анализ невозможен: ${reason}`],
        recommendations: ['Убедитесь, что система мониторинга работает корректно'],
        detailedResults: [],
        metadata: {
            analysisTime: new Date().toISOString(),
            totalDataPoints: 0
        }
    };
}

/**
 * Определяет тег фокуса на основе оценки
 * @param {number} score - Оценка фокуса (0-100)
 * @returns {string} - Тег фокуса
 */
function getFocusTag(score) {
    if (score >= FOCUS_INTEGRATION_CONSTANTS.FOCUS_THRESHOLDS.HIGH) return 'high';
    if (score >= FOCUS_INTEGRATION_CONSTANTS.FOCUS_THRESHOLDS.MODERATE) return 'moderate';
    if (score >= FOCUS_INTEGRATION_CONSTANTS.FOCUS_THRESHOLDS.LOW) return 'low';
    if (score >= FOCUS_INTEGRATION_CONSTANTS.FOCUS_THRESHOLDS.VERY_LOW) return 'very_low';
    return 'no_focus';
}

/**
 * Интегрирует анализ человеческого фокуса в функцию analyzeFocus
 * @param {string} selectedDate - Выбранная дата
 * @returns {Object} - Результат анализа
 */
async function analyzeHumanFocusIntegrated(selectedDate) {
    console.log('🔗 Интегрированный анализ человеческого фокуса для даты:', selectedDate);
    
    try {
        // Проверяем доступность анализатора фокуса окон
        if (typeof loadAllDataForAnalysis !== 'function') {
            throw new Error('Анализатор фокуса окон недоступен');
        }
        
        // Загружаем данные через существующий анализатор
        const allData = await loadAllDataForAnalysis(selectedDate);
        
        if (!allData || Object.keys(allData).length === 0) {
            throw new Error('Нет данных для анализа');
        }
        
        // Анализируем человеческий фокус
        const humanFocusResult = analyzeHumanFocusFromFocusAnalyzer(allData);
        
        // Возвращаем результат
        return {
            success: true,
            data: humanFocusResult,
            rawData: allData,
            analysisDate: selectedDate
        };
        
    } catch (error) {
        console.error('❌ Ошибка интегрированного анализа человеческого фокуса:', error);
        
        return {
            success: false,
            error: error.message,
            data: createEmptyHumanFocusResult(error.message),
            analysisDate: selectedDate
        };
    }
}

/**
 * Обновляет UI с результатами анализа человеческого фокуса
 * @param {Object} humanFocusResult - Результат анализа человеческого фокуса
 */
function updateHumanFocusUI(humanFocusResult) {
    console.log('🎨 Обновление UI с результатами анализа человеческого фокуса');
    
    // Проверяем наличие контейнера для результатов
    let container = document.getElementById('human-focus-results');
    
    if (!container) {
        // Создаем контейнер если его нет
        container = document.createElement('div');
        container.id = 'human-focus-results';
        container.className = 'human-focus-container mt-4';
        
        // Ищем место для вставки (после таблицы фокуса)
        const focusTable = document.getElementById('window-focus-table');
        if (focusTable && focusTable.parentNode) {
            focusTable.parentNode.insertBefore(container, focusTable.nextSibling);
        } else {
            // Если таблица не найдена, добавляем в конец body
            document.body.appendChild(container);
        }
    }
    
    // Создаем HTML для результатов
    const resultHTML = createHumanFocusResultHTML(humanFocusResult);
    container.innerHTML = resultHTML;
    
    console.log('✅ UI обновлен с результатами анализа человеческого фокуса');
}

/**
 * Создает HTML для отображения результатов анализа человеческого фокуса
 * @param {Object} result - Результат анализа
 * @returns {string} - HTML строка
 */
function createHumanFocusResultHTML(result) {
    const { summary, distribution, timeline, insights, recommendations } = result;
    
    // Определяем цвет на основе оценки
    const getScoreColor = (score) => {
        if (score >= 80) return 'success';
        if (score >= 60) return 'primary';
        if (score >= 40) return 'warning';
        if (score >= 20) return 'danger';
        return 'secondary';
    };
    
    const scoreColor = getScoreColor(summary.averageScore);
    
    return `
        <div class="card">
            <div class="card-header bg-gradient-primary text-white">
                <h5 class="mb-0">
                    <i class="bi bi-brain me-2"></i>
                    Анализ человеческого фокуса внимания
                </h5>
            </div>
            <div class="card-body">
                <!-- Общая оценка -->
                <div class="row mb-4">
                    <div class="col-md-3">
                        <div class="text-center">
                            <div class="display-4 text-${scoreColor} fw-bold">${summary.averageScore}</div>
                            <div class="text-muted">Средняя оценка фокуса</div>
                            <div class="badge bg-${scoreColor} mt-2">${summary.tag.toUpperCase()}</div>
                        </div>
                    </div>
                    <div class="col-md-9">
                        <div class="row">
                            <div class="col-md-3">
                                <div class="text-center">
                                    <div class="h4 text-info">${summary.maxScore}</div>
                                    <div class="text-muted small">Максимум</div>
                                </div>
                            </div>
                            <div class="col-md-3">
                                <div class="text-center">
                                    <div class="h4 text-warning">${summary.minScore}</div>
                                    <div class="text-muted small">Минимум</div>
                                </div>
                            </div>
                            <div class="col-md-3">
                                <div class="text-center">
                                    <div class="h4 text-success">${Math.round(summary.averageConfidence * 100)}%</div>
                                    <div class="text-muted small">Уверенность</div>
                                </div>
                            </div>
                            <div class="col-md-3">
                                <div class="text-center">
                                    <div class="h4 text-primary">${summary.windowsAnalyzed}</div>
                                    <div class="text-muted small">Окон</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Распределение фокуса -->
                <div class="row mb-4">
                    <div class="col-md-6">
                        <h6><i class="bi bi-pie-chart me-2"></i>Распределение фокуса</h6>
                        <div class="progress-stacked">
                            <div class="progress-bar bg-success" style="width: ${distribution.percentages.high}%" 
                                 title="Высокий фокус: ${distribution.percentages.high}%"></div>
                            <div class="progress-bar bg-primary" style="width: ${distribution.percentages.moderate}%" 
                                 title="Умеренный фокус: ${distribution.percentages.moderate}%"></div>
                            <div class="progress-bar bg-warning" style="width: ${distribution.percentages.low}%" 
                                 title="Низкий фокус: ${distribution.percentages.low}%"></div>
                            <div class="progress-bar bg-danger" style="width: ${distribution.percentages.very_low}%" 
                                 title="Очень низкий фокус: ${distribution.percentages.very_low}%"></div>
                            <div class="progress-bar bg-secondary" style="width: ${distribution.percentages.no_focus}%" 
                                 title="Нет фокуса: ${distribution.percentages.no_focus}%"></div>
                        </div>
                        <div class="mt-2">
                            <small class="text-muted">
                                <span class="badge bg-success me-1">${distribution.percentages.high}%</span> Высокий
                                <span class="badge bg-primary me-1 ms-2">${distribution.percentages.moderate}%</span> Умеренный
                                <span class="badge bg-warning me-1 ms-2">${distribution.percentages.low}%</span> Низкий
                                <span class="badge bg-danger me-1 ms-2">${distribution.percentages.very_low}%</span> Очень низкий
                                <span class="badge bg-secondary ms-2">${distribution.percentages.no_focus}%</span> Нет фокуса
                            </small>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <h6><i class="bi bi-graph-up me-2"></i>Временная диаграмма</h6>
                        <div class="timeline-chart">
                            ${timeline.map(point => `
                                <div class="timeline-point mb-1">
                                    <span class="badge bg-light text-dark me-2">${point.time}</span>
                                    <span class="badge bg-${getScoreColor(point.score)} me-2">${point.score}</span>
                                    <small class="text-muted">${point.primaryApp}</small>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
                
                <!-- Инсайты и рекомендации -->
                <div class="row">
                    <div class="col-md-6">
                        <h6><i class="bi bi-lightbulb me-2"></i>Инсайты</h6>
                        <ul class="list-unstyled">
                            ${insights.map(insight => `
                                <li class="mb-2">
                                    <i class="bi bi-arrow-right text-primary me-2"></i>
                                    ${insight}
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                    <div class="col-md-6">
                        <h6><i class="bi bi-gear me-2"></i>Рекомендации</h6>
                        <ul class="list-unstyled">
                            ${recommendations.map(recommendation => `
                                <li class="mb-2">
                                    <i class="bi bi-check-circle text-success me-2"></i>
                                    ${recommendation}
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Экспорт функций
window.analyzeHumanFocusFromFocusAnalyzer = analyzeHumanFocusFromFocusAnalyzer;
window.analyzeHumanFocusIntegrated = analyzeHumanFocusIntegrated;
window.updateHumanFocusUI = updateHumanFocusUI;

console.log('🔗 Интеграция анализатора человеческого фокуса загружена!');
console.log('📊 Доступные функции:');
console.log('  - analyzeHumanFocusFromFocusAnalyzer(focusAnalyzerData)');
console.log('  - analyzeHumanFocusIntegrated(selectedDate)');
console.log('  - updateHumanFocusUI(humanFocusResult)'); 