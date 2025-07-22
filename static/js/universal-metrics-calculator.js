/**
 * УНИВЕРСАЛЬНЫЙ КАЛЬКУЛЯТОР МЕТРИК
 * Автор: AI Assistant
 * Дата: 2025-01-24
 * Версия: v1.0
 * Назначение: Рассчитывает метрики из любых доступных данных, даже без duration
 */

console.log('🧮 [UNIVERSAL-CALC] Загружается универсальный калькулятор метрик v1.0');

/**
 * Основная функция расчета метрик
 * @param {Array} data - Массив записей активности
 * @param {string} selectedDate - Дата для фильтрации (опционально)
 * @returns {Object} - Рассчитанные метрики
 */
function calculateUniversalMetrics(data, selectedDate = null) {
    console.log('🧮 [UNIVERSAL-CALC] Расчет универсальных метрик для', data.length, 'записей');
    
    if (!data || data.length === 0) {
        console.warn('⚠️ [UNIVERSAL-CALC] Нет данных для расчета');
        return getZeroMetrics();
    }
    
    // Фильтруем по дате если указана
    let filteredData = data;
    if (selectedDate) {
        filteredData = data.filter(activity => {
            const timeField = activity.timestamp || activity.start_time;
            if (!timeField) return false;
            
            try {
                const activityDate = new Date(timeField).toISOString().split('T')[0];
                return activityDate === selectedDate;
            } catch (e) {
                return false;
            }
        });
        
        console.log(`📅 [UNIVERSAL-CALC] Отфильтровано по дате ${selectedDate}: ${filteredData.length} записей`);
    }
    
    if (filteredData.length === 0) {
        console.warn(`⚠️ [UNIVERSAL-CALC] Нет данных за дату ${selectedDate}`);
        return getZeroMetrics();
    }
    
    // Анализируем структуру данных
    const dataStructure = analyzeDataStructure(filteredData.slice(0, 10));
    console.log('🔍 [UNIVERSAL-CALC] Структура данных:', dataStructure);
    
    // Рассчитываем метрики на основе доступных данных
    const metrics = calculateMetricsFromStructure(filteredData, dataStructure);
    
    console.log('📊 [UNIVERSAL-CALC] Рассчитанные метрики:', {
        totalTime: formatTimeFromSeconds(metrics.totalTime),
        productiveTime: formatTimeFromSeconds(metrics.productiveTime),
        backgroundTime: formatTimeFromSeconds(metrics.backgroundTime),
        productivity: `${metrics.productivity}%`,
        recordsCount: metrics.recordsCount
    });
    
    return metrics;
}

/**
 * Анализирует структуру данных для определения доступных полей
 */
function analyzeDataStructure(sample) {
    const structure = {
        hasDuration: false,
        hasTimestamp: false,
        hasAppName: false,
        durationField: null,
        timestampField: null,
        appNameField: null,
        sampleRecord: sample[0] || {}
    };
    
    if (sample.length === 0) return structure;
    
    const firstRecord = sample[0];
    
    // Ищем поле duration
    const durationFields = ['duration', 'time_spent', 'elapsed_time', 'session_duration'];
    for (const field of durationFields) {
        if (firstRecord[field] !== undefined) {
            structure.hasDuration = true;
            structure.durationField = field;
            break;
        }
    }
    
    // Ищем поле timestamp
    const timestampFields = ['timestamp', 'start_time', 'created_at', 'time'];
    for (const field of timestampFields) {
        if (firstRecord[field] !== undefined) {
            structure.hasTimestamp = true;
            structure.timestampField = field;
            break;
        }
    }
    
    // Ищем поле app_name
    const appNameFields = ['app_name', 'application', 'process_name', 'program'];
    for (const field of appNameFields) {
        if (firstRecord[field] !== undefined) {
            structure.hasAppName = true;
            structure.appNameField = field;
            break;
        }
    }
    
    return structure;
}

/**
 * Рассчитывает метрики на основе структуры данных
 */
function calculateMetricsFromStructure(data, structure) {
    let totalTime = 0;
    let productiveTime = 0;
    let backgroundTime = 0;
    let activeRecords = 0;
    
    // Если есть duration, используем его
    if (structure.hasDuration && structure.durationField) {
        console.log('📊 [UNIVERSAL-CALC] Используем поле duration:', structure.durationField);
        
        data.forEach(record => {
            let duration = parseInt(record[structure.durationField]) || 0;
            
            // Если duration = 0, устанавливаем значение по умолчанию
            if (duration === 0) {
                duration = 60000; // 60 секунд в мс
            }
            
            // Конвертируем в секунды если это миллисекунды
            if (duration > 10000) {
                duration = Math.round(duration / 1000);
            }
            
            totalTime += duration;
            activeRecords++;
            
            // Классифицируем активность
            const category = classifyActivity(record, structure);
            if (category === 'productive') {
                productiveTime += duration;
            } else if (category === 'background') {
                backgroundTime += duration;
            } else {
                // Нейтральная активность - 50% продуктивности
                productiveTime += duration * 0.5;
            }
        });
        
    } else {
        console.log('📊 [UNIVERSAL-CALC] Duration отсутствует, используем подсчет записей');
        
        // Если нет duration, считаем по времени между записями
        const timeBasedMetrics = calculateTimeBasedMetrics(data, structure);
        totalTime = timeBasedMetrics.totalTime;
        productiveTime = timeBasedMetrics.productiveTime;
        backgroundTime = timeBasedMetrics.backgroundTime;
        activeRecords = data.length;
    }
    
    const productivity = totalTime > 0 ? Math.round((productiveTime / totalTime) * 100) : 0;
    
    return {
        totalTime: Math.round(totalTime),
        productiveTime: Math.round(productiveTime),
        backgroundTime: Math.round(backgroundTime),
        productivity,
        recordsCount: activeRecords,
        dataStructure: structure
    };
}

/**
 * Рассчитывает метрики на основе времени между записями
 */
function calculateTimeBasedMetrics(data, structure) {
    console.log('⏰ [UNIVERSAL-CALC] Расчет метрик на основе времени между записями');
    
    if (!structure.hasTimestamp || data.length < 2) {
        // Fallback: считаем каждую запись как 1 минуту
        const totalRecords = data.length;
        const totalTime = totalRecords * 60; // 60 секунд на запись
        
        let productiveTime = 0;
        let backgroundTime = 0;
        
        data.forEach(record => {
            const category = classifyActivity(record, structure);
            if (category === 'productive') {
                productiveTime += 60;
            } else if (category === 'background') {
                backgroundTime += 60;
            } else {
                productiveTime += 30; // 50% продуктивности
            }
        });
        
        return { totalTime, productiveTime, backgroundTime };
    }
    
    // Сортируем записи по времени
    const sortedData = [...data].sort((a, b) => {
        const timeA = new Date(a[structure.timestampField]);
        const timeB = new Date(b[structure.timestampField]);
        return timeA - timeB;
    });
    
    let totalTime = 0;
    let productiveTime = 0;
    let backgroundTime = 0;
    
    // Рассчитываем интервалы между записями
    for (let i = 0; i < sortedData.length - 1; i++) {
        const currentTime = new Date(sortedData[i][structure.timestampField]);
        const nextTime = new Date(sortedData[i + 1][structure.timestampField]);
        
        const intervalSeconds = Math.min((nextTime - currentTime) / 1000, 300); // Максимум 5 минут
        
        if (intervalSeconds > 0 && intervalSeconds <= 300) {
            totalTime += intervalSeconds;
            
            const category = classifyActivity(sortedData[i], structure);
            if (category === 'productive') {
                productiveTime += intervalSeconds;
            } else if (category === 'background') {
                backgroundTime += intervalSeconds;
            } else {
                productiveTime += intervalSeconds * 0.5;
            }
        }
    }
    
    // Добавляем время для последней записи (1 минута по умолчанию)
    totalTime += 60;
    const lastCategory = classifyActivity(sortedData[sortedData.length - 1], structure);
    if (lastCategory === 'productive') {
        productiveTime += 60;
    } else if (lastCategory === 'background') {
        backgroundTime += 60;
    } else {
        productiveTime += 30;
    }
    
    return { totalTime, productiveTime, backgroundTime };
}

/**
 * Классифицирует активность на продуктивную, фоновую или нейтральную
 */
function classifyActivity(record, structure) {
    if (!structure.hasAppName || !structure.appNameField) {
        return 'neutral';
    }
    
    const appName = (record[structure.appNameField] || '').toLowerCase();
    
    // Продуктивные приложения
    const productivePatterns = [
        'cursor', 'code', 'visual studio', 'pycharm', 'intellij',
        'firefox', 'chrome', 'edge', 'browser',
        'word', 'excel', 'powerpoint', 'office',
        'notepad', 'text', 'editor',
        'git', 'terminal', 'cmd', 'powershell'
    ];
    
    // Фоновые приложения
    const backgroundPatterns = [
        'video.ui', 'y.music', 'music', 'media',
        'nvidia', 'overlay', 'graphics',
        'texttInputhost', 'system', 'settings',
        'rdclient', 'remote', 'sndvol', 'volume',
        'calculator', 'calc', 'startup'
    ];
    
    // Проверяем продуктивные паттерны
    for (const pattern of productivePatterns) {
        if (appName.includes(pattern)) {
            return 'productive';
        }
    }
    
    // Проверяем фоновые паттерны
    for (const pattern of backgroundPatterns) {
        if (appName.includes(pattern)) {
            return 'background';
        }
    }
    
    return 'neutral';
}

/**
 * Возвращает нулевые метрики
 */
function getZeroMetrics() {
    return {
        totalTime: 0,
        productiveTime: 0,
        backgroundTime: 0,
        productivity: 0,
        recordsCount: 0
    };
}

/**
 * Форматирует время из секунд в читаемый вид
 */
function formatTimeFromSeconds(seconds) {
    if (seconds === 0) return '0м';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours === 0) {
        return `${minutes}м`;
    }
    return `${hours}ч ${minutes}м`;
}

/**
 * Универсальная функция обновления метрик в интерфейсе
 */
function updateMetricsUniversal(data, selectedDate = null) {
    console.log('🧮 [UNIVERSAL-CALC] Универсальное обновление метрик');
    
    const metrics = calculateUniversalMetrics(data, selectedDate);
    
    // Обновляем элементы интерфейса
    const elements = {
        '#total-working-time': formatTimeFromSeconds(metrics.totalTime),
        '#productive-time': formatTimeFromSeconds(metrics.productiveTime),
        '#activity-score': `${metrics.productivity}%`,
        '#break-time': formatTimeFromSeconds(metrics.backgroundTime)
    };
    
    Object.entries(elements).forEach(([selector, value]) => {
        const element = document.querySelector(selector);
        if (element) {
            element.textContent = value;
            console.log(`📊 [UNIVERSAL-CALC] Обновлен ${selector}: ${value}`);
        }
    });
    
    // Обновляем подзаголовки
    const subtitles = {
        '#productive-time': `${metrics.productivity}% от общего времени`,
        '#activity-score': `Основано на ${metrics.recordsCount} записях`,
        '#break-time': 'Фоновые процессы и неактивность'
    };
    
    Object.entries(subtitles).forEach(([selector, subtitle]) => {
        const element = document.querySelector(selector);
        if (element) {
            const subtitleElement = element.parentElement?.querySelector('.metric-subtitle');
            if (subtitleElement) {
                subtitleElement.textContent = subtitle;
            }
        }
    });
    
    console.log('✅ [UNIVERSAL-CALC] Универсальные метрики обновлены');
    return metrics;
}

// Экспортируем в глобальную область
window.calculateUniversalMetrics = calculateUniversalMetrics;
window.updateMetricsUniversal = updateMetricsUniversal;

console.log('✅ [UNIVERSAL-CALC] Универсальный калькулятор метрик загружен'); 