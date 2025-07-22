// Константы для определения продуктивности приложений
const PRODUCTIVE_APPS = {
    'Microsoft Word': 1.0,
    'Microsoft Excel': 1.0,
    'Microsoft PowerPoint': 1.0,
    'Visual Studio Code': 1.0,
    'PyCharm': 1.0,
    'IntelliJ IDEA': 1.0,
    'Git': 1.0,
    'Terminal': 1.0,
    'Command Prompt': 1.0,
    'PowerShell': 1.0,
    'Chrome': 0.8,
    'Firefox': 0.8,
    'Edge': 0.8,
    'Outlook': 0.9,
    'Teams': 0.9,
    'Slack': 0.9,
    'Jira': 0.9,
    'Confluence': 0.9
};

const UNPRODUCTIVE_APPS = {
    'Facebook': 0.0,
    'Instagram': 0.0,
    'Twitter': 0.0,
    'TikTok': 0.0,
    'YouTube': 0.1,
    'VK': 0.1,
    'Telegram': 0.2,
    'WhatsApp': 0.2,
    'Discord': 0.2,
    'Steam': 0.0,
    'Epic Games': 0.0,
    'Battle.net': 0.0
};

// Константы для иконок браузеров
const BROWSER_ICONS = {
    'Chrome': '<i class="bi bi-browser-chrome text-success"></i>',
    'Firefox': '<i class="bi bi-browser-firefox text-warning"></i>',
    'Edge': '<i class="bi bi-browser-edge text-primary"></i>',
    'Safari': '<i class="bi bi-browser-safari text-info"></i>',
    'Opera': '<i class="bi bi-browser-opera text-danger"></i>',
    'Internet Explorer': '<i class="bi bi-browser-ie text-primary"></i>',
    'Unknown': '<i class="bi bi-globe text-secondary"></i>'
};

// Функции для работы с временем
function formatTime(date) {
    if (!(date instanceof Date)) {
        date = new Date(date);
    }
    return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

function formatDate(date) {
    if (!(date instanceof Date)) {
        date = new Date(date);
    }
    return date.toLocaleDateString('ru-RU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function calculateDuration(start, end) {
    let startTime, endTime;

    if (typeof start === 'string') {
        startTime = new Date(start);
    } else if (typeof start === 'number') {
        startTime = new Date(start);
    } else {
        startTime = start;
    }

    if (typeof end === 'string') {
        endTime = new Date(end);
    } else if (typeof end === 'number') {
        endTime = new Date(end);
    } else {
        endTime = end;
    }

    const diff = endTime - startTime;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}ч ${minutes}м`;
}

// Функции для работы с продуктивностью
function calculateProductivity(activities) {
    if (!activities || activities.length === 0) {
        return {
            totalTime: 0,
            productiveTime: 0,
            unproductiveTime: 0,
            breaks: 0,
            productivityScore: 0
        };
    }

    console.log('🧮 Calculating productivity for', activities.length, 'activities');    
    // ⚡ ИСПОЛЬЗУЕМ ТОЛЬКО SMART-КАЛЬКУЛЯТОР! Браузерное время НЕ считаем!
    console.log('🧮 [SMART] Calculating productivity for', activities.length, 'activities - ONLY from smart calculator');
    
    // Получаем метрики только из smart-калькулятора
    const smartMetrics = window.lastSmartMetrics || {};
    
    if (smartMetrics.totalTime && smartMetrics.totalTime > 0) {
        console.log('✅ [SMART] Using data from smart calculator:', smartMetrics);
        
        const totalTime = smartMetrics.totalTime;
        const productiveTime = smartMetrics.productiveTime || 0;
        const unproductiveTime = smartMetrics.unproductiveTime || 0;
        const breaksTime = smartMetrics.breaksTime || 0;
        
        console.log('📊 [SMART] Productivity calculation results:', {
            totalTime: `${Math.floor(totalTime / 60)}м ${totalTime % 60}с`,
            productiveTime: `${Math.floor(productiveTime / 60)}м ${productiveTime % 60}с`,
            unproductiveTime: `${Math.floor(unproductiveTime / 60)}м ${unproductiveTime % 60}с`,
            breaksTime: `${Math.floor(breaksTime / 60)}м ${breaksTime % 60}с`
        });
        
        return {
            totalTime,
            productiveTime,
            unproductiveTime,
            breaks: breaksTime,
            productivityScore: totalTime > 0 ? (productiveTime / totalTime) * 100 : 0
        };
    } else {
        console.warn('⚠️ [SMART] No data from smart calculator - showing zeros');
        return {
            totalTime: 0,
            productiveTime: 0,
            unproductiveTime: 0,
            breaks: 0,
            productivityScore: 0
        };
    }

    console.log('📊 Productivity calculation results:', {
        totalTime: `${Math.floor(totalTime / 60)}м ${totalTime % 60}с`,
        productiveTime: `${Math.floor(productiveTime / 60)}м ${productiveTime % 60}с`,
        unproductiveTime: `${Math.floor(unproductiveTime / 60)}м ${unproductiveTime % 60}с`,
        breaksTime: `${Math.floor(breaksTime / 60)}м ${breaksTime % 60}с`,
        activitiesBreakdown: {
            total: activities.length,
            productive: productiveActivities.length,
            unproductive: unproductiveActivities.length,
            breaks: breakActivities.length
        }
    });

    return {
        totalTime,
        productiveTime,
        unproductiveTime,
        breaks: breaksTime,
        productivityScore: totalTime > 0 ? (productiveTime / totalTime) * 100 : 0
    };
}

function isBreak(activity) {
    if (!activity) return false;

    if (activity.activity_type === 'break') return true;

    const title = (activity.window_title || '').toLowerCase();
    return title.includes('заблокирован') ||
        title.includes('locked') ||
        title.includes('idle') ||
        title.includes('screensaver');
}

function getProductivityScore(activity) {
    if (!activity) return 0.5;

    const appName = activity.app_name || activity.window_title || '';

    if (PRODUCTIVE_APPS[appName] !== undefined) {
        return PRODUCTIVE_APPS[appName];
    }

    if (UNPRODUCTIVE_APPS[appName] !== undefined) {
        return UNPRODUCTIVE_APPS[appName];
    }

    // Анализ по ключевым словам
    const title = (activity.window_title || '').toLowerCase();
    if (title.includes('работа') || title.includes('work') ||
        title.includes('проект') || title.includes('project')) {
        return 0.8;
    }

    if (title.includes('игра') || title.includes('game') ||
        title.includes('соц') || title.includes('social')) {
        return 0.2;
    }

    return 0.5; // Нейтральная продуктивность по умолчанию
}

// Функции для работы с графиками
function updateActivityChart(activities) {
    if (!activities || activities.length === 0) {
        console.warn('Нет данных для отображения в графике активности');
        return;
    }

    // Список браузеров для исключения из общего графика приложений
    const browserProcesses = [
        'chrome.exe', 'firefox.exe', 'msedge.exe', 'opera.exe',
        'brave.exe', 'vivaldi.exe', 'safari.exe', 'browser.exe',
        'opera_gx.exe', 'tor.exe', 'arc.exe', 'palemoon.exe'
    ];

    const appUsage = {};
    activities.forEach(activity => {
        if (activity.app_name) {
            const processName = (activity.process_name || activity.app_name || '').toLowerCase();

            // Проверяем, является ли это браузером
            const isBrowser = browserProcesses.some(browser =>
                processName.includes(browser.toLowerCase()) ||
                activity.app_name.toLowerCase().includes('chrome') ||
                activity.app_name.toLowerCase().includes('firefox') ||
                activity.app_name.toLowerCase().includes('edge') ||
                activity.app_name.toLowerCase().includes('opera') ||
                activity.app_name.toLowerCase().includes('safari') ||
                activity.app_name.toLowerCase().includes('браузер')
            );

            // Исключаем браузеры из общего графика приложений
            if (!isBrowser) {
                appUsage[activity.app_name] = (appUsage[activity.app_name] || 0) +
                    (activity.duration || 0);
            }
        }
    });

    // Сортировка и ограничение количества приложений для графика
    const sortedApps = Object.entries(appUsage)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10);

    const plotData = [{
        x: sortedApps.map(([app]) => app),
        y: sortedApps.map(([, time]) => time),
        type: 'bar',
        marker: { color: '#1e3a8a' }
    }];

    const layout = {
        title: 'Использование приложений (без браузеров)',
        margin: { t: 40, b: 100 },
        xaxis: { tickangle: -45 },
        yaxis: { title: 'Время (минуты)' }
    };

    Plotly.newPlot('activity-chart', plotData, layout);
}

function updateResourceChart(resources) {
    if (!resources || resources.length === 0) {
        console.warn('Нет данных для отображения в графике ресурсов');
        return;
    }

    // Сортируем данные по времени
    const sortedResources = [...resources].sort((a, b) => {
        return new Date(a.timestamp) - new Date(b.timestamp);
    });

    const times = sortedResources.map(r => formatTime(new Date(r.timestamp)));
    const cpu = sortedResources.map(r => r.cpu);
    const ram = sortedResources.map(r => r.memory);
    const disk = sortedResources.map(r => r.disk);
    const gpu = sortedResources.map(r => r.gpu || 0);
    const network = sortedResources.map(r => r.network || 0);
    const keyboard = sortedResources.map(r => r.keyboard || 0);
    // Обновляем метрики текущего использования
    if (sortedResources.length > 0) {
        const latestData = sortedResources[sortedResources.length - 1];
        updateResourceMetrics(latestData);
        
        // Обновляем GPU метрики если модуль доступен
        if (typeof window.smartGPUMetrics !== 'undefined' && window.smartGPUMetrics.updateGPUMetrics) {
            try {
                console.log('🎮 [GPU] Обновляем GPU метрики с массивом данных:', sortedResources.length, 'записей');
                console.log('🎮 [GPU] Пример данных:', sortedResources[0]);
                window.smartGPUMetrics.updateGPUMetrics(sortedResources);
            } catch (error) {
                console.error('🎮 [GPU] Ошибка обновления GPU метрик:', error);
            }
        }
    }
    // Вычисляем средние и максимальные значения
    const avgCpu = cpu.reduce((sum, val) => sum + val, 0) / cpu.length;
    const avgRam = ram.reduce((sum, val) => sum + val, 0) / ram.length;
    const avgDisk = disk.reduce((sum, val) => sum + val, 0) / disk.length;

    const maxCpu = Math.max(...cpu);
    const maxRam = Math.max(...ram);
    const maxDisk = Math.max(...disk);

    // Обновляем статистику
    document.getElementById('avg-cpu-usage').textContent = `${Math.round(avgCpu)}%`;
    document.getElementById('avg-ram-usage').textContent = `${Math.round(avgRam)}%`;
    document.getElementById('avg-disk-usage').textContent = `${Math.round(avgDisk)}%`;

    document.getElementById('max-cpu-usage').textContent = `${Math.round(maxCpu)}%`;
    document.getElementById('max-ram-usage').textContent = `${Math.round(maxRam)}%`;
    document.getElementById('max-disk-usage').textContent = `${Math.round(maxDisk)}%`;

    // Найдем индекс максимальных значений
    const maxCpuIndex = cpu.indexOf(maxCpu);
    const maxRamIndex = ram.indexOf(maxRam);
    const maxDiskIndex = disk.indexOf(maxDisk);

    // Обновляем пиковые значения
    document.getElementById('peak-cpu').textContent = `${Math.round(maxCpu)}%`;
    document.getElementById('peak-ram').textContent = `${Math.round(maxRam)}%`;
    document.getElementById('peak-disk').textContent = `${Math.round(maxDisk)}%`;

    if (maxCpuIndex !== -1 && times[maxCpuIndex]) {
        document.getElementById('peak-cpu-time').textContent = times[maxCpuIndex];
    }
    if (maxRamIndex !== -1 && times[maxRamIndex]) {
        document.getElementById('peak-ram-time').textContent = times[maxRamIndex];
    }
    if (maxDiskIndex !== -1 && times[maxDiskIndex]) {
        document.getElementById('peak-disk-time').textContent = times[maxDiskIndex];
    }

    // Создание графиков для отдельных ресурсов
    const cpuData = [{
        x: times,
        y: cpu,
        type: 'scatter',
        mode: 'lines+markers',
        name: 'CPU',
        line: { color: '#dc3545', width: 2 }
    }];

    const ramData = [{
        x: times,
        y: ram,
        type: 'scatter',
        mode: 'lines+markers',
        name: 'RAM',
        line: { color: '#0d6efd', width: 2 }
    }];

    const diskData = [{
        x: times,
        y: disk,
        type: 'scatter',
        mode: 'lines+markers',
        name: 'Disk',
                line: { color: '#198754', width: 2 }
            },
            {
                x: times,
                y: gpu,
                type: 'scatter',
                mode: 'lines',
                name: 'GPU',
                line: { color: '#6f42c1', width: 2 }
            },
            {
                x: times,
                y: network,
                type: 'scatter',
                mode: 'lines',
                name: 'Network',
                line: { color: '#20c997', width: 2 }
            },
            {
                x: times,
                y: keyboard,
                type: 'scatter',
                mode: 'lines',
                name: 'Keyboard',
                line: { color: '#fd7e14', width: 2 }
            }
        ];

    const layout = {
        autosize: true,
        height: 300,
        margin: { l: 50, r: 50, b: 50, t: 30, pad: 4 },
        yaxis: {
            title: '%',
            range: [0, 100]
        },
        xaxis: {
            title: 'Время'
        },
        hovermode: 'closest',
        showlegend: false
    };

    Plotly.newPlot('cpu-chart', cpuData, layout);
    Plotly.newPlot('ram-chart', ramData, layout);
    Plotly.newPlot('disk-chart', diskData, layout);

    // Создание объединенного графика
    const combinedData = [
        {
            x: times,
            y: cpu,
            type: 'scatter',
            mode: 'lines',
            name: 'CPU',
            line: { color: '#dc3545', width: 2 }
        },
        {
            x: times,
            y: ram,
            type: 'scatter',
            mode: 'lines',
            name: 'RAM',
            line: { color: '#0d6efd', width: 2 }
        },
        {
            x: times,
            y: disk,
            type: 'scatter',
            mode: 'lines',
            name: 'Disk',
            line: { color: '#198754', width: 2 }
        }
    ];

    const combinedLayout = {
        autosize: true,
        height: 400,
        margin: { l: 50, r: 50, b: 50, t: 10, pad: 4 },
        yaxis: {
            title: '%',
            range: [0, 100]
        },
        xaxis: {
            title: 'Время'
        },
        hovermode: 'closest',
        showlegend: false
    };

    Plotly.newPlot('combined-resources-chart', combinedData, combinedLayout);

    // Добавляем обработчики для кнопок переключения представления
    setupResourceChartControls(times, cpu, ram, disk, gpu || [], network || [], keyboard || []);
}

// Функция для обновления метрик текущего использования ресурсов
function updateResourceMetrics(data) {
    if (!data) return;

    // Обновляем текущие значения
    const cpuUsage = Math.round(data.cpu || 0);
    const ramUsage = Math.round(data.memory || 0);
    const diskUsage = Math.round(data.disk || 0);

    // Обновляем значения в интерфейсе, проверяя существование элементов
    const currentCpuElement = document.getElementById('current-cpu-usage');
    const currentRamElement = document.getElementById('current-ram-usage');
    const currentDiskElement = document.getElementById('current-disk-usage');

    if (currentCpuElement) currentCpuElement.textContent = cpuUsage;
    if (currentRamElement) currentRamElement.textContent = ramUsage;
    if (currentDiskElement) currentDiskElement.textContent = diskUsage;

    // Обновляем индикаторы прогресса
    const cpuProgress = document.getElementById('cpu-progress');
    const ramProgress = document.getElementById('ram-progress');
    const diskProgress = document.getElementById('disk-progress');

    if (cpuProgress) cpuProgress.style.width = `${cpuUsage}%`;
    if (ramProgress) ramProgress.style.width = `${ramUsage}%`;
    if (diskProgress) diskProgress.style.width = `${diskUsage}%`;

    // Устанавливаем цвета в зависимости от нагрузки
    if (cpuProgress) {
        if (cpuUsage > 80) {
            cpuProgress.className = 'progress-bar bg-danger';
        } else if (cpuUsage > 60) {
            cpuProgress.className = 'progress-bar bg-warning';
        } else {
            cpuProgress.className = 'progress-bar bg-success';
        }
    }

    if (ramProgress) {
        if (ramUsage > 80) {
            ramProgress.className = 'progress-bar bg-danger';
        } else if (ramUsage > 60) {
            ramProgress.className = 'progress-bar bg-warning';
        } else {
            ramProgress.className = 'progress-bar bg-success';
        }
    }

    if (diskProgress) {
        if (diskUsage > 80) {
            diskProgress.className = 'progress-bar bg-danger';
        } else if (diskUsage > 60) {
            diskProgress.className = 'progress-bar bg-warning';
        } else {
            diskProgress.className = 'progress-bar bg-success';
        }
    }
}

// Функция для настройки элементов управления графиками ресурсов
function setupResourceChartControls(times, cpu, ram, disk, gpu, network, keyboard) {
    const allButton = document.getElementById('chart-view-all');
    const cpuButton = document.getElementById('chart-view-cpu');
    const ramButton = document.getElementById('chart-view-ram');
    const diskButton = document.getElementById('chart-view-disk');
    const gpuButton = document.getElementById('chart-view-gpu');
    const networkButton = document.getElementById('chart-view-network');
    const keyboardButton = document.getElementById('chart-view-keyboard');
    if (!allButton || !cpuButton || !ramButton || !diskButton) {
        return;
    }

    const layout = {
        autosize: true,
        height: 400,
        margin: { l: 50, r: 50, b: 50, t: 10, pad: 4 },
        yaxis: {
            title: '%',
            range: [0, 100]
        },
        xaxis: {
            title: 'Время'
        },
        hovermode: 'closest',
        showlegend: false
    };

    allButton.addEventListener('click', function () {
        setActiveButton(this);
        const combinedData = [
            {
                x: times,
                y: cpu,
                type: 'scatter',
                mode: 'lines',
                name: 'CPU',
                line: { color: '#dc3545', width: 2 }
            },
            {
                x: times,
                y: ram,
                type: 'scatter',
                mode: 'lines',
                name: 'RAM',
                line: { color: '#0d6efd', width: 2 }
            },
            {
                x: times,
                y: disk,
                type: 'scatter',
                mode: 'lines',
                name: 'Disk',
                line: { color: '#198754', width: 2 }
            }
        ];
        Plotly.newPlot('combined-resources-chart', combinedData, layout);
    });

    cpuButton.addEventListener('click', function () {
        setActiveButton(this);
        const cpuData = [{
            x: times,
            y: cpu,
            type: 'scatter',
            mode: 'lines',
            name: 'CPU',
            line: { color: '#dc3545', width: 3 }
        }];
        Plotly.newPlot('combined-resources-chart', cpuData, layout);
    });

    ramButton.addEventListener('click', function () {
        setActiveButton(this);
        const ramData = [{
            x: times,
            y: ram,
            type: 'scatter',
            mode: 'lines',
            name: 'RAM',
            line: { color: '#0d6efd', width: 3 }
        }];
        Plotly.newPlot('combined-resources-chart', ramData, layout);
    });

    diskButton.addEventListener('click', function () {
        setActiveButton(this);
        const diskData = [{
            x: times,
            y: disk,
            type: 'scatter',
            mode: 'lines',
            name: 'Disk',
            line: { color: '#198754', width: 3 }
        }];
        Plotly.newPlot('combined-resources-chart', diskData, layout);
    });
    
    if (gpuButton) {
        gpuButton.addEventListener('click', function () {
            setActiveButton(this);
            const gpuData = [{
                x: times,
                y: gpu,
                type: 'scatter',
                mode: 'lines',
                name: 'GPU',
                line: { color: '#6f42c1', width: 3 }
            }];
            Plotly.newPlot('combined-resources-chart', gpuData, layout);
        });
    }

    if (networkButton) {
        networkButton.addEventListener('click', function () {
            setActiveButton(this);
            const networkData = [{
                x: times,
                y: network,
                type: 'scatter',
                mode: 'lines',
                name: 'Network',
                line: { color: '#20c997', width: 3 }
            }];
            Plotly.newPlot('combined-resources-chart', networkData, layout);
        });
    }

    if (keyboardButton) {
        keyboardButton.addEventListener('click', function () {
            setActiveButton(this);
            const keyboardData = [{
                x: times,
                y: keyboard,
                type: 'scatter',
                mode: 'lines',
                name: 'Keyboard',
                line: { color: '#fd7e14', width: 3 }
            }];
            Plotly.newPlot('combined-resources-chart', keyboardData, layout);
        });
    }

    function setActiveButton(button) {
        [allButton, cpuButton, ramButton, diskButton, gpuButton, networkButton, keyboardButton].forEach(btn => {
            btn.classList.remove('active');
        });
        button.classList.add('active');
    }
}

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

// Функция для предварительной обработки данных активности за день
function preprocessDailyData(data) {
    if (!data || !data.website_visits || data.website_visits.length === 0) {
        return data;
    }

    // Если выбран период "День", проверим есть ли данные для всех часов
    const periodFilter = document.getElementById('period-filter');
    if (periodFilter && periodFilter.value === 'day') {
        console.log("Предварительная обработка данных за день");

        // Создадим временные отметки для всех часов дня
        const dateFilter = document.getElementById('date-filter');
        let baseDate = new Date();
        if (dateFilter && dateFilter.value) {
            baseDate = new Date(dateFilter.value);
        }

        // Нормализуем даты в данных
        data.website_visits = data.website_visits.map(visit => {
            if (typeof visit.timestamp === 'string') {
                visit.timestamp = new Date(visit.timestamp).toISOString();
            }
            return visit;
        });

        // Сортируем данные по времени
        data.website_visits.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

        console.log("Обработанные данные веб-сайтов:", data.website_visits);
    }

    return data;
}

// Функция для обновления графика использования браузеров
function updateBrowserChart(data) {
    // Предварительная обработка данных
    data = preprocessDailyData(data);

    // Диаграмма использования браузеров
    const browserData = data.browser_activity || data.website_visits || [];
    const websiteData = data.website_visits || [];

    console.log("Данные браузера:", browserData);
    console.log("Данные веб-сайтов:", websiteData);

    // Проверяем наличие элемента canvas
    const chartElement = document.getElementById('browser-chart');
    const statsContainer = document.getElementById('browser-stats-container');
    const noDataElement = document.getElementById('no-browser-data');

    if (!chartElement) {
        console.error('Элемент browser-chart не найден');
        return;
    }

    if (!statsContainer || !noDataElement) {
        console.error('Элементы контейнеров для графика браузеров не найдены');
        return;
    }

    // Обновление топ-браузеров таблицы
    const topBrowsersTable = document.getElementById('top-browsers-table').querySelector('tbody');
    if (topBrowsersTable) {
        topBrowsersTable.innerHTML = '';
    }

    // Создание диаграммы с браузерами
    if (browserData.length > 0) {
        // Группировка по браузерам и ПРАВИЛЬНЫЙ подсчет времени с учетом перекрывающихся периодов
        const browserGroups = {};

        // Группируем данные по браузерам
        const browserSessions = {};
        browserData.forEach(item => {
            const browserName = item.browser_name || item.browser || "Неизвестный браузер";
            if (!browserSessions[browserName]) {
                browserSessions[browserName] = [];
            }

            // Добавляем сессию с временными рамками
            const duration = parseInt(item.total_time || item.duration || 0);
            const startTime = new Date(item.timestamp || item.start_time);
            const endTime = new Date(startTime.getTime() + duration * 1000);

            browserSessions[browserName].push({
                start: startTime,
                end: endTime,
                duration: duration,
                url: item.url || '',
                window_title: item.window_title || ''
            });
        });

        // Для каждого браузера вычисляем реальное время с учетом перекрытий
        Object.keys(browserSessions).forEach(browserName => {
            const sessions = browserSessions[browserName];

            // Сортируем сессии по времени начала
            sessions.sort((a, b) => a.start - b.start);

            // Объединяем перекрывающиеся периоды
            const mergedPeriods = [];
            let currentPeriod = null;

            sessions.forEach(session => {
                if (!currentPeriod) {
                    currentPeriod = { start: session.start, end: session.end };
                } else {
                    // Если новая сессия начинается до окончания текущего периода
                    if (session.start <= currentPeriod.end) {
                        // Объединяем периоды - расширяем текущий период
                        currentPeriod.end = new Date(Math.max(currentPeriod.end.getTime(), session.end.getTime()));
                    } else {
                        // Если нет перекрытия, сохраняем текущий период и начинаем новый
                        mergedPeriods.push(currentPeriod);
                        currentPeriod = { start: session.start, end: session.end };
                    }
                }
            });

            // Добавляем последний период
            if (currentPeriod) {
                mergedPeriods.push(currentPeriod);
            }

            // Вычисляем общее время как сумму объединенных периодов
            const totalTime = mergedPeriods.reduce((total, period) => {
                return total + Math.floor((period.end - period.start) / 1000);
            }, 0);

            browserGroups[browserName] = totalTime;

            console.log(`Браузер ${browserName}: ${sessions.length} сессий -> ${mergedPeriods.length} периодов = ${totalTime} секунд`);
        });

        // Преобразование в массив для диаграммы
        const labels = Object.keys(browserGroups);
        const times = Object.values(browserGroups);

        // Создание диаграммы
        try {
            const ctx = chartElement.getContext('2d');
            if (!ctx) {
                console.error('Не удалось получить контекст для canvas');
                return;
            }

            // Уничтожаем предыдущий график, если он есть
            if (window.browserChart) {
                window.browserChart.destroy();
            }

            window.browserChart = new Chart(ctx, {
                type: 'pie',
                data: {
                    labels: labels,
                    datasets: [{
                        data: times,
                        backgroundColor: [
                            '#4e73df', '#1cc88a', '#36b9cc', '#f6c23e', '#e74a3b', '#858796'
                        ],
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'right',
                        },
                        tooltip: {
                            callbacks: {
                                label: function (context) {
                                    const value = context.raw;
                                    return formatDuration(value);
                                }
                            }
                        }
                    }
                }
            });

            // Обновляем общее время в браузерах
            const totalBrowserTime = Object.values(browserGroups).reduce((sum, time) => sum + time, 0);

// ИСПРАВЛЕНИЕ: Рассчитываем реальное время с учетом перекрытий между браузерами
const allBrowserPeriods = [];
Object.keys(browserSessions).forEach(browserName => {
    const sessions = browserSessions[browserName];
    sessions.forEach(session => {
        allBrowserPeriods.push({
            start: session.start,
            end: session.end,
            browser: browserName
        });
    });
});

// Сортируем все периоды по времени начала
allBrowserPeriods.sort((a, b) => a.start - b.start);

// Объединяем перекрывающиеся периоды между ВСЕМИ браузерами
const mergedGlobalPeriods = [];
let currentGlobalPeriod = null;

allBrowserPeriods.forEach(period => {
    if (!currentGlobalPeriod) {
        currentGlobalPeriod = {
            start: period.start,
            end: period.end,
            browsers: [period.browser]
        };
    } else {
        if (period.start <= currentGlobalPeriod.end) {
            // Расширяем глобальный период
            currentGlobalPeriod.end = new Date(Math.max(currentGlobalPeriod.end.getTime(), period.end.getTime()));
            if (!currentGlobalPeriod.browsers.includes(period.browser)) {
                currentGlobalPeriod.browsers.push(period.browser);
            }
        } else {
            // Нет перекрытия - сохраняем текущий период и начинаем новый
            mergedGlobalPeriods.push(currentGlobalPeriod);
            currentGlobalPeriod = {
                start: period.start,
                end: period.end,
                browsers: [period.browser]
            };
        }
    }
});

// Добавляем последний период
if (currentGlobalPeriod) {
    mergedGlobalPeriods.push(currentGlobalPeriod);
}

// Вычисляем общее время без дублирования
const totalRealTime = mergedGlobalPeriods.reduce((total, period) => {
    return total + Math.floor((period.end - period.start) / 1000);
}, 0);

console.log(`🔧 Исправление: Общее время браузеров ${formatDuration(totalBrowserTime)} -> ${formatDuration(totalRealTime)}`);

document.getElementById('total-browser-time').textContent = formatDuration(totalRealTime);
            statsContainer.style.display = 'block';
            noDataElement.style.display = 'none';

            // Заполняем таблицу топ-браузеров
            if (topBrowsersTable) {
                const sortedBrowsers = Object.entries(browserGroups)
                    .sort(([, a], [, b]) => b - a);

                sortedBrowsers.forEach(([browser, time]) => {
                    const percentage = totalRealTime > 0 ? ((time / totalRealTime) * 100).toFixed(1) : '0.0';
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${browser}</td>
                        <td>${formatDuration(time)}</td>
                        <td>${percentage}%</td>
                    `;
                    topBrowsersTable.appendChild(row);
                });
            }
        } catch (error) {
            console.error('Ошибка при создании графика браузеров:', error);
            statsContainer.style.display = 'none';
            noDataElement.style.display = 'block';
        }
    } else {
        statsContainer.style.display = 'none';
        noDataElement.style.display = 'block';
        if (topBrowsersTable) {
            topBrowsersTable.innerHTML = '<tr><td colspan="3" class="text-center">Нет данных о браузерах</td></tr>';
        }
    }

    // Обновление списка посещенных сайтов
    try {
    updateWebsitesList(websiteData);
    } catch (error) {
        console.error('Ошибка при обновлении списка веб-сайтов:', error);
    }
}

function updateWebsitesList(websiteData) {
    const container = document.getElementById('website-visits-list');
    const noDataElement = document.getElementById('no-website-visits');

    if (!container || !noDataElement) {
        console.error('Элементы для списка веб-сайтов не найдены');
        return;
    }

    container.innerHTML = '';

    console.log("Обновление списка сайтов:", websiteData);

    if (!websiteData || websiteData.length === 0) {
        // Если нет данных, показываем сообщение
        noDataElement.style.display = 'block';
        return;
    }

    // Скрываем сообщение об отсутствии данных
    noDataElement.style.display = 'none';

    // Добавляем последние 10 посещений
    const recentVisits = [...websiteData].sort((a, b) => {
        return new Date(b.timestamp) - new Date(a.timestamp);
    }).slice(0, 10);

    recentVisits.forEach(visit => {
        const card = document.createElement('div');
        card.className = 'website-card';
        card.onclick = () => openWebsiteModal(visit);

        const url = visit.url || '-';
        // Используем поле browser вместо browser_name, так как это поле из таблицы website_visits
        const browser = visit.browser || 'Неизвестный браузер';
        const timestamp = new Date(visit.timestamp);

        // Извлекаем домен из URL для отображения
        let domain = url;
        try {
                const urlObj = new URL(url);
                domain = urlObj.hostname;
        } catch (e) {
            // Если не получилось распарсить URL, оставляем как есть
            console.warn('Не удалось извлечь домен из URL:', url);
        }

        // Определяем время активности (отсутствует в website_visits)
        const activityTime = '-';

        card.innerHTML = `
            <div class="website-title">${domain}</div>
            <div class="website-url">${url}</div>
            <div class="website-meta">
                <span class="browser-icon"><i class="bi bi-globe"></i> ${browser}</span>
                <span class="time-icon"><i class="bi bi-clock"></i> ${formatDate(timestamp)} ${formatTime(timestamp)}</span>
                <span class="duration-icon"><i class="bi bi-person"></i> ${visit.employee_name || 'Неизвестно'}</span>
                </div>
            `;

        container.appendChild(card);
    });
}

// Функция для обновления графика активности веб-сайтов
function updateWebsiteActivityChart(websiteData) {
    if (!websiteData || websiteData.length === 0) {
        console.warn('Нет данных для отображения в графике активности веб-сайтов');
        const chartElement = document.getElementById('website-activity-chart');
        if (chartElement) {
            chartElement.innerHTML = '<div class="alert alert-info">Нет данных о посещениях веб-сайтов за выбранный период</div>';
        }
        return;
    }

    // Проверяем существование элемента графика
    const chartElement = document.getElementById('website-activity-chart');
    if (!chartElement) {
        console.error('Элемент графика активности веб-сайтов не найден');
        return;
    }

    try {
        // Сортируем данные по времени
        const sortedData = [...websiteData].sort((a, b) => {
            try {
        return new Date(a.timestamp) - new Date(b.timestamp);
            } catch (e) {
                console.warn('Ошибка при сортировке данных по времени:', e);
                return 0;
            }
        });

        // Группировка данных по часам
        const hourlyVisits = {};
        sortedData.forEach(visit => {
            try {
        const date = new Date(visit.timestamp);
                if (!isNaN(date.getTime())) {  // Проверяем, что дата валидная
                    const hour = date.getHours();
        hourlyVisits[hour] = (hourlyVisits[hour] || 0) + 1;
                }
            } catch (e) {
                console.warn('Ошибка при обработке даты:', visit.timestamp, e);
            }
    });

    // Подготовка данных для графика
    const hours = Object.keys(hourlyVisits).sort((a, b) => a - b);
    const visits = hours.map(hour => hourlyVisits[hour]);

        // Если данных меньше 2 точек, добавляем дополнительные точки для лучшего отображения
        if (hours.length < 2) {
            // Добавляем пустые точки до и после
            const firstHour = hours.length > 0 ? parseInt(hours[0]) : new Date().getHours();

            // Добавляем предыдущий час с нулевым значением
            const prevHour = (firstHour - 1 + 24) % 24;
            hours.unshift(prevHour.toString());
            visits.unshift(0);

            // Если всё ещё только одна точка, добавляем следующий час
            if (hours.length === 1) {
                const nextHour = (firstHour + 1) % 24;
                hours.push(nextHour.toString());
                visits.push(0);
            }
        }

    const plotData = [{
        x: hours.map(hour => `${hour}:00`),
        y: visits,
        type: 'scatter',
        mode: 'lines+markers',
        line: { color: '#1e3a8a', width: 2 },
        marker: { size: 8, color: '#1e3a8a' }
    }];

    const layout = {
        height: 300,
        margin: { l: 40, r: 20, b: 40, t: 10 },
        xaxis: { title: 'Время' },
        yaxis: { title: 'Количество посещений' }
    };

    Plotly.newPlot('website-activity-chart', plotData, layout);
    } catch (error) {
        console.error('Ошибка при создании графика активности веб-сайтов:', error);

        // Создаем сообщение об ошибке вместо графика
        chartElement.innerHTML = '<div class="alert alert-warning">Не удалось построить график активности. Недостаточно данных.</div>';
    }
}

// Функция для отображения списка посещённых веб-сайтов
function updateWebsiteVisitsList(websiteData) {
    const container = document.getElementById('website-visits-list');
    const noDataAlert = document.getElementById('no-website-visits');

    container.innerHTML = '';

    if (!websiteData || websiteData.length === 0) {
        noDataAlert.style.display = 'block';
        return;
    }

    noDataAlert.style.display = 'none';

    // Сортируем данные по времени (от новых к старым)
    const sortedData = [...websiteData].sort((a, b) => {
        return new Date(b.timestamp) - new Date(a.timestamp);
    });

    // Отображаем каждое посещение
    sortedData.forEach(visit => {
        const card = document.createElement('div');
        card.className = 'website-card';

        // Определение иконки браузера
        const browserIcon = BROWSER_ICONS[visit.browser] || BROWSER_ICONS['Unknown'];

        // Получение домена для отображения
        let displayUrl = visit.url;
        try {
            const url = new URL(visit.url);
            displayUrl = url.hostname;
        } catch (e) {
            // Если не удалось разобрать URL, оставляем как есть
        }

        // Форматирование времени
        const visitTime = formatTime(new Date(visit.timestamp));
        const visitDate = formatDate(new Date(visit.timestamp));

        card.innerHTML = `
            <div class="d-flex justify-content-between align-items-start">
                <div>
                    <div class="d-flex align-items-center mb-2">
                        <span class="browser-icon">${browserIcon}</span>
                        <span class="fw-bold">${displayUrl}</span>
                    </div>
                    <div class="text-muted small url-text">${visit.url}</div>
                </div>
                <div class="text-end">
                    <div>${visitTime}</div>
                    <div class="text-muted small">${visitDate}</div>
                </div>
            </div>
        `;

        // Добавление обработчика клика для открытия модального окна с деталями
        card.addEventListener('click', () => {
            openWebsiteModal(visit);
        });

        container.appendChild(card);
    });
}

// Функция для открытия модального окна с деталями посещения сайта
function openWebsiteModal(visit) {
    console.log('Открываем модальное окно для сайта:', visit);

    // Создаем модальное окно, если его еще нет
    let modal = document.getElementById('website-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'website-modal';
        modal.className = 'modal fade';
        modal.tabIndex = -1;
        modal.setAttribute('aria-hidden', 'true');

        modal.innerHTML = `
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Информация о посещении сайта</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <div class="website-details">
                            <div class="row mb-3">
                                <div class="col-md-3 fw-bold">URL:</div>
                                <div class="col-md-9 url-text" id="website-url"></div>
                            </div>
                            <div class="row mb-3">
                                <div class="col-md-3 fw-bold">Браузер:</div>
                                <div class="col-md-9" id="website-browser"></div>
                            </div>
                            <div class="row mb-3">
                                <div class="col-md-3 fw-bold">Время посещения:</div>
                                <div class="col-md-9" id="website-time"></div>
                            </div>
                            <div class="row mb-3">
                                <div class="col-md-3 fw-bold">Заголовок:</div>
                                <div class="col-md-9" id="website-title"></div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Закрыть</button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Добавляем обработчики для закрытия модального окна
        const closeButton = modal.querySelector('.btn-close');
        const closeButtonFooter = modal.querySelector('.modal-footer .btn-secondary');

        function handleCloseClick() {
            const bsModal = bootstrap.Modal.getInstance(modal);
            if (bsModal) {
                bsModal.hide();
            }
        }

        closeButton.addEventListener('click', handleCloseClick);
        closeButtonFooter.addEventListener('click', handleCloseClick);

        // Добавляем обработчик клавиши Escape
        function handleEscapeKey(event) {
            if (event.key === 'Escape') {
                const bsModal = bootstrap.Modal.getInstance(modal);
                if (bsModal) {
                    bsModal.hide();
                }
            }
        }

        document.addEventListener('keydown', handleEscapeKey);
    }

    // Заполняем данные
    document.getElementById('website-url').textContent = visit.url || '-';
    document.getElementById('website-browser').textContent = visit.browser || '-';
    document.getElementById('website-title').textContent = visit.title || '-';

    // Форматируем время с секундами
    let timeStr = '-';
    if (visit.timestamp) {
        const date = new Date(visit.timestamp);
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const seconds = date.getSeconds().toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();

        timeStr = `${day}.${month}.${year} ${hours}:${minutes}:${seconds}`;
    }
    document.getElementById('website-time').textContent = timeStr;

    // Открываем модальное окно
    const bsModal = new bootstrap.Modal(modal);
    bsModal.show();
}

// Функции для работы с таблицами
function updateWorkingTimeTable(workingTime) {
    const tbody = document.querySelector('#timeline-table tbody');
    // Проверяем существование tbody
    if (!tbody) {
        console.warn('Таблица timeline-table не найдена на странице');
        return;
    }
    
    const tableContainer = tbody.closest('.table-container') || tbody.closest('.table-responsive') || tbody.closest('div');

    // Очищаем таблицу
    if (tbody) tbody.innerHTML = '';

    // Добавляем управляющие кнопки над таблицей
    let controlsContainer = document.getElementById('timeline-controls');
    if (!controlsContainer) {
        controlsContainer = document.createElement('div');
        controlsContainer.id = 'timeline-controls';
        controlsContainer.className = 'mb-3 d-flex justify-content-between align-items-center';
        controlsContainer.innerHTML = `
            <div>
                <button id="expand-all-btn" class="btn btn-sm btn-outline-primary me-2">
                    <i class="bi bi-arrows-expand"></i> Развернуть все
                </button>
                <button id="collapse-all-btn" class="btn btn-sm btn-outline-secondary">
                    <i class="bi bi-arrows-collapse"></i> Свернуть все
                </button>
            </div>
            <div class="small text-muted">
                Всего активностей: <span id="activities-count">0</span>
            </div>
        `;

        if (tableContainer) {
            tableContainer.insertBefore(controlsContainer, tableContainer.firstChild);
        }
    }

    // Если нет данных, показываем сообщение
    if (!workingTime || workingTime.length === 0) {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td colspan="5" class="text-center">Нет данных о рабочем времени</td>`;
        if (tbody) tbody.appendChild(tr);

        // Обновляем счетчик активностей
        const activitiesCount = document.getElementById('activities-count');
        if (activitiesCount) activitiesCount.textContent = '0';

        return;
    }

    // Обновляем счетчик активностей
    const activitiesCount = document.getElementById('activities-count');
    if (activitiesCount) activitiesCount.textContent = workingTime.length.toString();

    // Группируем данные по приложениям
    const appGroups = {};
    workingTime.forEach(row => {
        const appName = row.app_name || 'Неизвестное приложение';
        if (!appGroups[appName]) {
            appGroups[appName] = [];
        }
        appGroups[appName].push(row);
    });

    // Сортируем приложения по общему времени (от большего к меньшему)
    const sortedApps = Object.entries(appGroups).map(([appName, activities]) => {
        const totalDuration = activities.reduce((sum, act) => sum + (act.duration || 0), 0);
        return { appName, activities, totalDuration };
    }).sort((a, b) => b.totalDuration - a.totalDuration);

    // Добавляем группы в таблицу
    sortedApps.forEach(({ appName, activities, totalDuration }, index) => {
        // Создаем заголовок группы (строка приложения)
        const appRow = document.createElement('tr');
        const groupId = `app-group-${index}`;
        const formattedTotalDuration = formatDuration(totalDuration);

        // Определяем общую продуктивность приложения
        let avgProductivity = activities.reduce((sum, act) => sum + getProductivityScore(act), 0) / activities.length;
        let badgeClass = 'bg-warning';
        let productivityText = 'Нейтрально';

        if (avgProductivity >= 0.7) {
            badgeClass = 'bg-success';
            productivityText = 'Продуктивно';
        } else if (avgProductivity <= 0.3) {
            badgeClass = 'bg-danger';
            productivityText = 'Непродуктивно';
        }

        // Стилизуем строку приложения
        appRow.className = 'app-group-header';
        appRow.setAttribute('data-bs-toggle', 'collapse');
        appRow.setAttribute('data-bs-target', `#${groupId}`);
        appRow.style.cursor = 'pointer';
        appRow.style.backgroundColor = '#f8f9fa';

        appRow.innerHTML = `
            <td colspan="2" class="fw-bold">
                <i class="bi bi-chevron-down period-icon me-2" style="font-size: 1.2em;"></i>
                ${appName}
            </td>
            <td><span class="badge ${badgeClass}">${productivityText}</span></td>
            <td>${activities.length} активностей</td>
            <td>${formattedTotalDuration}</td>
        `;
        if (tbody) tbody.appendChild(appRow);

        // Создаем группу активностей для этого приложения
        const activitiesContainer = document.createElement('tr');
        activitiesContainer.className = 'collapse';
        activitiesContainer.id = groupId;

        const activitiesCell = document.createElement('td');
        activitiesCell.colSpan = 5;
        activitiesCell.style.padding = '0';

        const activitiesTable = document.createElement('table');
        activitiesTable.className = 'table table-sm mb-0';
        activitiesTable.style.backgroundColor = '#fff';

        const activitiesTbody = document.createElement('tbody');

        // Добавляем строки активностей
        activities.forEach(row => {
            const activityRow = document.createElement('tr');
            activityRow.className = 'activity-row';

            const productivity = getProductivityScore(row);
            let rowBadgeClass = 'bg-warning';
            let rowProductivityText = 'Нейтрально';

            if (productivity >= 0.7) {
                rowBadgeClass = 'bg-success';
                rowProductivityText = 'Продуктивно';
            } else if (productivity <= 0.3) {
                rowBadgeClass = 'bg-danger';
                rowProductivityText = 'Непродуктивно';
            }

            // Форматируем длительность с использованием formatDuration
            const formattedDuration = row.duration ? formatDuration(row.duration) : '-';

            activityRow.innerHTML = `
            <td>${formatTime(new Date(row.timestamp))}</td>
            <td>${row.window_title || '-'}</td>
                <td><span class="badge ${rowBadgeClass}">${rowProductivityText}</span></td>
                <td colspan="2">${formattedDuration}</td>
            `;
            activitiesTbody.appendChild(activityRow);
        });

        activitiesTable.appendChild(activitiesTbody);
        activitiesCell.appendChild(activitiesTable);
        activitiesContainer.appendChild(activitiesCell);
        if (tbody) tbody.appendChild(activitiesContainer);
    });

    // Добавляем обработчики для кнопок разворачивания/сворачивания
    const expandAllBtn = document.getElementById('expand-all-btn');
    const collapseAllBtn = document.getElementById('collapse-all-btn');

    if (expandAllBtn) {
        expandAllBtn.addEventListener('click', function () {
            document.querySelectorAll('.app-group-header').forEach(header => {
                const target = header.getAttribute('data-bs-target');
                const content = document.querySelector(target);
                if (content && !content.classList.contains('show')) {
                    header.classList.add('active');
                    header.querySelector('.period-icon').style.transform = 'rotate(90deg)';
                    content.classList.add('show');
                }
            });
        });
    }

    if (collapseAllBtn) {
        collapseAllBtn.addEventListener('click', function () {
            document.querySelectorAll('.app-group-header').forEach(header => {
                const target = header.getAttribute('data-bs-target');
                const content = document.querySelector(target);
                if (content && content.classList.contains('show')) {
                    header.classList.remove('active');
                    header.querySelector('.period-icon').style.transform = 'rotate(0deg)';
                    content.classList.remove('show');
                }
            });
        });
    }

    // Добавляем обработчики для переключения состояния иконок при сворачивании/разворачивании
    document.querySelectorAll('.app-group-header').forEach(header => {
        header.addEventListener('click', function () {
            const icon = this.querySelector('.period-icon');
            const target = this.getAttribute('data-bs-target');
            const content = document.querySelector(target);

            if (content.classList.contains('show')) {
                icon.style.transform = 'rotate(0deg)';
                this.classList.remove('active');
            } else {
                icon.style.transform = 'rotate(90deg)';
                this.classList.add('active');
            }
        });
    });

    // Добавляем стили для анимации иконок
    const styleElement = document.createElement('style');
    styleElement.textContent = `
        .period-icon {
            transition: transform 0.3s ease;
        }
        .app-group-header.active .period-icon {
            transform: rotate(90deg);
        }
        .activity-row {
            background-color: #f9f9f9;
        }
        .activity-row:hover {
            background-color: #f0f0f0;
        }
    `;
    document.head.appendChild(styleElement);
}

function updateActivityTable(activities) {
    const tbody = document.querySelector('#top-apps-table tbody');
    if (tbody) tbody.innerHTML = '';

    if (!activities || activities.length === 0) {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td colspan="3" class="text-center">Нет данных об активности</td>`;
        if (tbody) tbody.appendChild(tr);
        return;
    }

    console.log('Обновляем таблицу активности приложений:', activities.length, 'активностей');

    // Группируем активности по приложениям и объединяем перекрывающиеся периоды
    const appGroups = {};

    activities.forEach(activity => {
        const appName = activity.application || activity.app_name;
        if (!appName) return;

        if (!appGroups[appName]) {
            appGroups[appName] = [];
        }

        const duration = parseInt(activity.duration || 0);
        if (duration > 0) {
            const startTime = new Date(activity.timestamp || activity.start_time);
            const endTime = new Date(startTime.getTime() + duration * 1000);

            appGroups[appName].push({
                start: startTime,
                end: endTime,
                duration: duration,
                activity: activity
            });
        }
    });

    // Для каждого приложения объединяем перекрывающиеся периоды
    const appStats = {};

    Object.keys(appGroups).forEach(appName => {
        const periods = appGroups[appName];

        // Сортируем периоды по времени начала
        periods.sort((a, b) => a.start - b.start);

        // Объединяем перекрывающиеся периоды
        const mergedPeriods = [];
        let currentPeriod = null;

        periods.forEach(period => {
            if (!currentPeriod) {
                currentPeriod = { start: period.start, end: period.end };
            } else {
                // Если новый период начинается до окончания текущего (с буфером 10 сек для учета переключений)
                if (period.start <= new Date(currentPeriod.end.getTime() + 10000)) {
                    // Объединяем периоды - расширяем текущий период
                    currentPeriod.end = new Date(Math.max(currentPeriod.end.getTime(), period.end.getTime()));
                } else {
                    // Если нет перекрытия, сохраняем текущий период и начинаем новый
                    mergedPeriods.push(currentPeriod);
                    currentPeriod = { start: period.start, end: period.end };
                }
            }
        });

        // Добавляем последний период
        if (currentPeriod) {
            mergedPeriods.push(currentPeriod);
        }

        // Вычисляем общее время для приложения как сумму объединенных периодов
        const totalTime = mergedPeriods.reduce((total, period) => {
            return total + Math.floor((period.end - period.start) / 1000);
        }, 0);

        appStats[appName] = totalTime;

        console.log(`${appName}: ${periods.length} периодов -> ${mergedPeriods.length} объединенных периодов = ${totalTime} секунд`);
    });

    const totalTime = Object.values(appStats).reduce((sum, time) => sum + time, 0);

    const sortedApps = Object.entries(appStats)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10);

    sortedApps.forEach(([app, time]) => {
        const percentage = totalTime > 0 ? ((time / totalTime) * 100).toFixed(1) : '0.0';
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${app}</td>
            <td>${formatDuration(time)}</td>
            <td>${percentage}%</td>
        `;
        if (tbody) tbody.appendChild(tr);
    });
}

// Функции для работы со скриншотами
function updateScreenshots(screenshots) {
    const grid = document.getElementById('screenshot-grid');
    grid.innerHTML = '';

    if (!screenshots || screenshots.length === 0) {
        grid.innerHTML = '<div class="alert alert-warning">Нет скриншотов за выбранный период</div>';
        return;
    }

    screenshots.forEach(screenshot => {
        const card = document.createElement('div');
        card.className = 'screenshot-card';

        // Проверяем, есть ли данные скриншота
        const imgSrc = screenshot.screenshot
            ? `data:image/jpeg;base64,${screenshot.screenshot}`
            : '/static/img/no-screenshot.png';

        const timestamp = new Date(screenshot.timestamp);

        card.innerHTML = `
            <img src="${imgSrc}" 
                 class="screenshot-image" 
                 onclick="openScreenshotModal('${screenshot.screenshot || ''}', '${timestamp}', '${screenshot.app_name || 'Неизвестно'}', ${getProductivityScore(screenshot) >= 0.5})" />
            <div class="screenshot-info">
                <div class="screenshot-time">${formatTime(timestamp)}</div>
                <div class="screenshot-app">${screenshot.app_name || 'Неизвестно'}</div>
            </div>
        `;
        grid.appendChild(card);
    });
}

// Функция для открытия модального окна скриншота
function openScreenshotModal(base64data, timestamp, appName, isProductive) {
    const modal = document.getElementById('screenshotModal');
    const modalImage = document.getElementById('modal-screenshot');
    const modalTime = document.getElementById('modal-time');
    const modalApp = document.getElementById('modal-app');
    const modalProductivity = document.getElementById('modal-productivity');

    // Установка изображения
    if (base64data) {
        modalImage.src = `data:image/jpeg;base64,${base64data}`;
    } else {
        modalImage.src = '/static/img/no-screenshot.png';
    }

    // Установка метаданных
    modalTime.textContent = formatTime(new Date(timestamp));
    modalApp.textContent = appName;

    // Установка продуктивности
    const productivityText = isProductive ? 'Продуктивно' : 'Непродуктивно';
    const productivityClass = isProductive ? 'text-success' : 'text-danger';
    modalProductivity.innerHTML = `<span class="${productivityClass}">${productivityText}</span>`;

    // Открытие модального окна
    const bsModal = new bootstrap.Modal(modal);
    bsModal.show();
}

// Глобальные переменные для хранения последних корректных данных
let lastValidMetrics = {
    totalTime: 0,
    productiveTime: 0,
    productivity: 0,
    breaks: 0
};

let lastValidResources = {
    cpu: { current: 0, max: 0, avg: 0 },
    ram: { current: 0, max: 0, avg: 0 },
    disk: { current: 0, max: 0, avg: 0 }
};

// Функция для обновления метрик с сохранением последних корректных значений
function updateMetrics(data) {
    console.log('📊 Обновление метрик с данными:', data);
    
    // Проверяем, применен ли системный фикс
    if (window.systemFixApplied && window.smartSystemFix) {
        console.log('🔧 Используем системный фикс для обновления метрик');
        window.smartSystemFix.metricsManager.safeUpdateMetrics(data, 'dashboard-updateMetrics');
        return;
    }
    
    // Определяем активную вкладку
    const activeTab = getActiveTabId();
    
    // Проверяем наличие данных от умного калькулятора
    if (data.real_activity_stats) {
        console.log('🧠 Используем данные от умного калькулятора времени');
        
        const stats = data.real_activity_stats;
        
        // Безопасное округление с проверкой на валидность
        const totalMinutes = safeRound(stats.total_time);
        const activeMinutes = safeRound(stats.active_time);
        const passiveMinutes = safeRound(stats.passive_time);
        const productiveMinutes = safeRound(stats.productive_time); // Используем продуктивное время из калькулятора
        const activityPercent = safeRound(stats.activity_ratio * 100);
        const productivityPercent = safeRound(stats.productivity_score); // Используем процент продуктивности из калькулятора
        
        console.log('📈 Метрики от умного калькулятора:', {
            total: `${totalMinutes} мин`,
            active: `${activeMinutes} мин`,
            passive: `${passiveMinutes} мин`,
            productive: `${productiveMinutes} мин`,
            activityPercent: `${activityPercent}%`,
            productivityPercent: `${productivityPercent}%`
        });

        // Обновляем общее рабочее время (показываем ОБЩЕЕ время от начала до конца)
        safeUpdateMetricElement('total-working-time', totalMinutes, 'Общее время активности от начала до конца');

        // Обновляем продуктивное время (показываем АКТИВНОЕ время с правильным процентом)
        const totalTimeFormatted = formatTimeNicely(Math.floor(totalMinutes / 60), totalMinutes % 60);
        safeUpdateMetricElement('productive-time', activeMinutes, `Активное время (${activityPercent}% от общего ${totalTimeFormatted})`);

        // Обновляем активность (показываем процент реальной активности)
        safeUpdateMetricElement('activity-score', `${activityPercent}%`, 'Средний балл реальной активности', false);

        // Обновляем время неактивности (пассивное время = фон)
        safeUpdateMetricElement('break-time', passiveMinutes, 'Время пассивной активности (фон)');

        // Сохраняем метрики для других функций
        const metrics = {
            totalWorkTime: totalMinutes,
            totalProductiveTime: productiveMinutes,
            totalBreakTime: passiveMinutes,
            avgProductivity: activityPercent,
            activities: data.activities || []
        };

        // Безопасное сохранение в глобальные переменные
        safeSetGlobalVariable('lastMetrics', metrics);
        safeSetGlobalVariable('lastData', data);
        safeSetGlobalVariable('lastValidMetrics', {
            totalTime: totalMinutes,
            productiveTime: activeMinutes,
            productivity: activityPercent,
            breaks: passiveMinutes
        });
        
        console.log('✅ Метрики обновлены с данными умного калькулятора');
        return; // Выходим из функции после обработки умного калькулятора
    } else {
        // ОТКЛЮЧЕНО: Стандартная система расчета времени (дублировала браузерное время)
        console.log('⚠️ ВНИМАНИЕ: Нет данных от умного калькулятора - отображаем нулевые метрики');
        
        // Обновляем интерфейс с нулевыми значениями
        updateMetricsInInterface({
            totalTime: 0,
            productiveTime: 0,
            productivityScore: 0,
            breaks: 0,
            isSmartCalculator: false
        }, getActiveTabId(), data.period_info || {});
    }
}

// Безопасная функция округления
function safeRound(value) {
    if (typeof value !== 'number' || isNaN(value)) {
        console.warn('⚠️ Некорректное значение для округления:', value);
        return 0;
    }
    return Math.round(value);
}

// Безопасная функция обновления элементов метрик
function safeUpdateMetricElement(elementId, value, subtitle = null, formatAsTime = true) {
    const element = document.getElementById(elementId);
    if (!element) {
        console.warn(`⚠️ Элемент ${elementId} не найден`);
        return false;
    }
    
    try {
        // Форматируем значение
        let displayValue;
        if (formatAsTime && typeof value === 'number') {
            const hours = Math.floor(value / 60);
            const minutes = Math.round(value % 60);
            displayValue = formatTimeNicely(hours, minutes);
        } else {
            displayValue = value.toString();
        }
        
        element.textContent = displayValue;
        
        // Обновляем подзаголовок если передан
        if (subtitle) {
            const subtitleElement = element.parentElement.querySelector('.metric-subtitle');
            if (subtitleElement) {
                subtitleElement.textContent = subtitle;
            }
        }
        
        return true;
    } catch (error) {
        console.error(`❌ Ошибка обновления элемента ${elementId}:`, error);
        return false;
    }
}

// Безопасная функция установки глобальных переменных
function safeSetGlobalVariable(name, value) {
    try {
        window[name] = value;
        return true;
    } catch (error) {
        console.error(`❌ Ошибка установки глобальной переменной ${name}:`, error);
        return false;
    }
}

function updateMetricsInInterface(metrics, activeTab, periodInfo) {
    // Обновление метрик на странице в зависимости от активной вкладки
    if (!metrics) {
        console.warn('⚠️ Метрики не переданы в updateMetricsInInterface');
        return;
    }
    
    // Безопасное обновление общего рабочего времени
    safeUpdateMetricElement('total-working-time', metrics.totalTime);

    // Безопасное обновление продуктивного времени
    if (safeUpdateMetricElement('productive-time', metrics.productiveTime)) {
        // Обновляем подзаголовок с процентом
        const productiveTimeElement = document.getElementById('productive-time');
        if (productiveTimeElement) {
            const subtitle = productiveTimeElement.parentElement.querySelector('.metric-subtitle');
            if (subtitle && metrics.totalTime > 0) {
                const percentOfTotal = ((metrics.productiveTime / metrics.totalTime) * 100).toFixed(1);
                subtitle.textContent = `${percentOfTotal}% от ${metrics.isSmartCalculator ? 'активного' : 'общего'} времени`;
            }
        }
    }

    // Безопасное обновление балла активности
    safeUpdateMetricElement('activity-score', `${metrics.productivityScore.toFixed(1)}%`, 
        metrics.isSmartCalculator ? 'Средний балл реальной активности' : 'Средний балл продуктивности', false);

    // Безопасное обновление времени перерывов
    if (metrics.isSmartCalculator) {
        // Скрываем перерывы при использовании умного калькулятора
        const breakTimeElement = document.getElementById('break-time');
        if (breakTimeElement) {
            const breakContainer = breakTimeElement.closest('.metric-card') || breakTimeElement.parentElement;
            if (breakContainer) {
                breakContainer.style.display = 'none';
            }
        }
    } else {
        // Показываем реальные перерывы из старых расчетов
        const breakTimeElement = document.getElementById('break-time');
        if (breakTimeElement) {
            const breakContainer = breakTimeElement.closest('.metric-card') || breakTimeElement.parentElement;
            if (breakContainer) {
                breakContainer.style.display = '';
            }
            safeUpdateMetricElement('break-time', metrics.breaks, 'Время неактивности');
        }
    }

    // Безопасное обновление времени последнего обновления
    const lastUpdateElement = document.getElementById('last-update');
    if (lastUpdateElement) {
        try {
            lastUpdateElement.textContent = formatTime(new Date());
        } catch (error) {
            console.error('❌ Ошибка обновления времени последнего обновления:', error);
        }
    }
}

// Функция для отображения сохраненных метрик без обновления данных
function displaySavedMetrics() {
    // Проверяем наличие сохраненных метрик
    if (!window.lastValidMetrics) {
        console.log('📊 Нет сохраненных метрик для отображения');
        return;
    }
    
    console.log('Отображаем сохраненные метрики:', window.lastValidMetrics);

    const metrics = window.lastValidMetrics;
    
    // Безопасное отображение сохраненных метрик
    if (metrics.totalTime > 0) {
        safeUpdateMetricElement('total-working-time', metrics.totalTime);
    }

    if (metrics.productiveTime > 0) {
        safeUpdateMetricElement('productive-time', metrics.productiveTime);
        
        // Обновляем подзаголовок
        const productiveTimeElement = document.getElementById('productive-time');
        if (productiveTimeElement && metrics.totalTime > 0) {
            const subtitle = productiveTimeElement.parentElement.querySelector('.metric-subtitle');
            if (subtitle) {
                const percentOfTotal = (metrics.productiveTime / metrics.totalTime * 100).toFixed(1);
                subtitle.textContent = `${percentOfTotal}% от общего времени`;
            }
        }
    }

    if (metrics.productivity > 0) {
        safeUpdateMetricElement('activity-score', `${metrics.productivity.toFixed(1)}%`, null, false);
    }

    if (metrics.breaks > 0) {
        safeUpdateMetricElement('break-time', metrics.breaks);
    }
}

// Функция для обновления метрик ресурсов с сохранением последних корректных значений
function updateResourceMetrics(data) {
    if (!data) {
        console.warn('Нет данных для обновления метрик ресурсов');
        displaySavedResourceMetrics();
        return;
    }

    console.log('Обновление метрик ресурсов с данными:', data);

    // Извлекаем данные о ресурсах с проверкой на валидность
    let cpuValue = parseFloat(data.cpu);
    let ramValue = parseFloat(data.memory);
    let diskValue = parseFloat(data.disk);

    // Проверяем, что значения валидны и не равны нулю
    const isCpuValid = !isNaN(cpuValue) && cpuValue > 0;
    const isRamValid = !isNaN(ramValue) && ramValue > 0;
    const isDiskValid = !isNaN(diskValue) && diskValue > 0;

    // Если данные валидны, обновляем элементы интерфейса и сохраняем значения
    const cpuElement = document.getElementById('current-cpu-usage');
    if (cpuElement) {
        if (isCpuValid) {
            cpuElement.textContent = `${Math.round(cpuValue)}%`;
            lastValidResources.cpu.current = Math.round(cpuValue);
        } else {
            // Используем последнее сохраненное значение
            cpuElement.textContent = `${lastValidResources.cpu.current}%`;
        }
    }

    const ramElement = document.getElementById('current-ram-usage');
    if (ramElement) {
        if (isRamValid) {
            ramElement.textContent = `${Math.round(ramValue)}%`;
            lastValidResources.ram.current = Math.round(ramValue);
        } else {
            // Используем последнее сохраненное значение
            ramElement.textContent = `${lastValidResources.ram.current}%`;
        }
    }

    const diskElement = document.getElementById('current-disk-usage');
    if (diskElement) {
        if (isDiskValid) {
            diskElement.textContent = `${Math.round(diskValue)}%`;
            lastValidResources.disk.current = Math.round(diskValue);
        } else {
            // Используем последнее сохраненное значение
            diskElement.textContent = `${lastValidResources.disk.current}%`;
        }
    }

    // Обновляем максимальные и средние значения, если они доступны
    if (data.max_cpu && !isNaN(parseFloat(data.max_cpu))) {
        lastValidResources.cpu.max = Math.round(parseFloat(data.max_cpu));
    }

    if (data.avg_cpu && !isNaN(parseFloat(data.avg_cpu))) {
        lastValidResources.cpu.avg = Math.round(parseFloat(data.avg_cpu));
    }

    if (data.max_memory && !isNaN(parseFloat(data.max_memory))) {
        lastValidResources.ram.max = Math.round(parseFloat(data.max_memory));
    }

    if (data.avg_memory && !isNaN(parseFloat(data.avg_memory))) {
        lastValidResources.ram.avg = Math.round(parseFloat(data.avg_memory));
    }

    if (data.max_disk && !isNaN(parseFloat(data.max_disk))) {
        lastValidResources.disk.max = Math.round(parseFloat(data.max_disk));
    }

    if (data.avg_disk && !isNaN(parseFloat(data.avg_disk))) {
        lastValidResources.disk.avg = Math.round(parseFloat(data.avg_disk));
    }

    // Обновляем отображение макс и средних значений
    updateMaxAvgResourceMetrics();
}

// Функция для отображения сохраненных метрик ресурсов
function displaySavedResourceMetrics() {
    console.log('Отображаем сохраненные метрики ресурсов:', lastValidResources);

    const cpuElement = document.getElementById('current-cpu-usage');
    if (cpuElement) {
        cpuElement.textContent = `${lastValidResources.cpu.current}%`;
    }

    const ramElement = document.getElementById('current-ram-usage');
    if (ramElement) {
        ramElement.textContent = `${lastValidResources.ram.current}%`;
    }

    const diskElement = document.getElementById('current-disk-usage');
    if (diskElement) {
        diskElement.textContent = `${lastValidResources.disk.current}%`;
    }

    // Обновляем максимальные и средние значения
    updateMaxAvgResourceMetrics();
}

// Функция для обновления максимальных и средних значений ресурсов
function updateMaxAvgResourceMetrics() {
    // CPU
    const maxCpuElement = document.getElementById('max-cpu-usage');
    if (maxCpuElement) {
        maxCpuElement.textContent = `${lastValidResources.cpu.max}%`;
    }

    const avgCpuElement = document.getElementById('avg-cpu-usage');
    if (avgCpuElement) {
        avgCpuElement.textContent = `${lastValidResources.cpu.avg}%`;
    }

    // RAM
    const maxRamElement = document.getElementById('max-ram-usage');
    if (maxRamElement) {
        maxRamElement.textContent = `${lastValidResources.ram.max}%`;
    }

    const avgRamElement = document.getElementById('avg-ram-usage');
    if (avgRamElement) {
        avgRamElement.textContent = `${lastValidResources.ram.avg}%`;
    }

    // Disk
    const maxDiskElement = document.getElementById('max-disk-usage');
    if (maxDiskElement) {
        maxDiskElement.textContent = `${lastValidResources.disk.max}%`;
    }

    const avgDiskElement = document.getElementById('avg-disk-usage');
    if (avgDiskElement) {
        avgDiskElement.textContent = `${lastValidResources.disk.avg}%`;
    }
}

// Обновляем инициализацию метрик ресурсов
function initializeResourceMetrics() {
    // Получаем элементы для отображения метрик ресурсов
    const resourceMetrics = [
        { currentId: 'current-cpu-usage', maxId: 'max-cpu-usage', avgId: 'avg-cpu-usage' },
        { currentId: 'current-ram-usage', maxId: 'max-ram-usage', avgId: 'avg-ram-usage' },
        { currentId: 'current-disk-usage', maxId: 'max-disk-usage', avgId: 'avg-disk-usage' }
    ];

    // Если есть сохраненные значения, используем их
    if (lastValidResources.cpu.current > 0 || lastValidResources.ram.current > 0 || lastValidResources.disk.current > 0) {
        displaySavedResourceMetrics();
        return;
    }

    // Устанавливаем начальные значения (если нет сохраненных)
    resourceMetrics.forEach(metric => {
        const currentElement = document.getElementById(metric.currentId);
        const maxElement = document.getElementById(metric.maxId);
        const avgElement = document.getElementById(metric.avgId);

        if (currentElement) currentElement.textContent = '0%';
        if (maxElement) maxElement.textContent = '0%';
        if (avgElement) avgElement.textContent = '0%';
    });
}

// Функция для определения активной вкладки
function getActiveTabId() {
    const activeTabElement = document.querySelector('.nav-link.active[data-bs-toggle="tab"]');
    if (activeTabElement) {
        return activeTabElement.getAttribute('id') || 'activity-tab'; // По умолчанию - activity
    }
    return 'activity-tab'; // Если не найдена активная вкладка, возвращаем activity
}

// Функция для обновления подзаголовка метрики в зависимости от активной вкладки
function updateMetricSubtitle(metricElement, metrics, activeTabId, periodInfo) {
    const subtitle = metricElement.parentElement.querySelector('.metric-subtitle');
    if (!subtitle) return;

    if (activeTabId === 'timeline-tab') {
        // Для временной шкалы - используем выбранную дату и период из фильтров
        const dateFilter = document.getElementById('date-filter');
        const periodFilter = document.getElementById('period-filter');

        if (dateFilter && periodFilter) {
            const period = periodFilter.options[periodFilter.selectedIndex].text.toLowerCase();

            if (periodInfo && periodInfo.start_date && periodInfo.end_date) {
                if (periodInfo.period_type === 'day') {
                    subtitle.textContent = `За ${formatDate(new Date(periodInfo.end_date))}`;
                } else {
                    subtitle.textContent = `За период ${formatDate(new Date(periodInfo.start_date))} - ${formatDate(new Date(periodInfo.end_date))}`;
                }
            } else {
                subtitle.textContent = `За ${period}${dateFilter.value ? ' ' + formatDate(new Date(dateFilter.value)) : ''}`;
            }
        }
    } else if (activeTabId === 'activity-timesheet-tab') {
        // Для табеля активности - используем данные из фильтров табеля
        const startDateEl = document.getElementById('activity-start-date');
        const endDateEl = document.getElementById('activity-end-date');

        if (startDateEl && endDateEl && startDateEl.value && endDateEl.value) {
            const startDate = new Date(startDateEl.value);
            const endDate = new Date(endDateEl.value);

            if (startDateEl.value === endDateEl.value) {
                subtitle.textContent = `За ${formatDate(startDate)}`;
            } else {
                subtitle.textContent = `За период ${formatDate(startDate)} - ${formatDate(endDate)}`;
            }
        } else {
            subtitle.textContent = 'За выбранный период';
        }
    } else if (activeTabId === 'chronology-tab') {
        // Для хронологии - используем выбранную дату хронологии
        const chronologyDate = document.getElementById('chronology-date');

        if (chronologyDate && chronologyDate.value) {
            subtitle.textContent = `За ${formatDate(new Date(chronologyDate.value))}`;
        } else {
            subtitle.textContent = 'За выбранную дату';
        }
    } else if (activeTabId === 'timesheet-tab') {
        // Для табеля - используем период табеля
        const timesheetStartDate = document.getElementById('timesheet-start-date');
        const timesheetEndDate = document.getElementById('timesheet-end-date');

        if (timesheetStartDate && timesheetEndDate && timesheetStartDate.value && timesheetEndDate.value) {
            const startDate = new Date(timesheetStartDate.value);
            const endDate = new Date(timesheetEndDate.value);

            if (timesheetStartDate.value === timesheetEndDate.value) {
                subtitle.textContent = `За ${formatDate(startDate)}`;
            } else {
                subtitle.textContent = `За период ${formatDate(startDate)} - ${formatDate(endDate)}`;
            }
        } else {
            subtitle.textContent = 'За выбранный период';
        }
    } else {
        // Для других вкладок - общий шаблон
        subtitle.textContent = 'За выбранный период';
    }
}

// Добавляем обработчики событий для обновления метрик при переключении вкладок
document.addEventListener('DOMContentLoaded', function () {
    // Находим все вкладки
    const tabLinks = document.querySelectorAll('.nav-link[data-bs-toggle="tab"]');

    // Добавляем обработчики событий для каждой вкладки
    tabLinks.forEach(tab => {
        tab.addEventListener('shown.bs.tab', function (e) {
            console.log('Переключена вкладка на:', e.target.id);

            // Вызываем соответствующую функцию загрузки данных в зависимости от вкладки
            if (e.target.id === 'timeline-tab') {
                // Для временной шкалы обновляем данные дашборда
                loadDashboardData();
            } else if (e.target.id === 'activity-timesheet-tab') {
                // Для табеля активности проверяем, есть ли уже данные
                const activityTable = document.getElementById('activity-timesheet-table');
                if (activityTable && activityTable.querySelector('tbody').childElementCount <= 1) {
                    loadActivityTimesheet();
                }
            } else if (e.target.id === 'chronology-tab') {
                // Для хронологии - загружаем данные, если есть дата
                const chronologyDate = document.getElementById('chronology-date');
                if (chronologyDate && chronologyDate.value) {
                    loadChronology();
                }
            }
            // Удалено: обработчик для timesheet-tab - теперь обрабатывается в dashboard-timesheet.js
        });
    });

    // Добавляем обработчик для селекта сортировки хронологии
    const chronologySortSelect = document.getElementById('chronology-sort');
    if (chronologySortSelect) {
        chronologySortSelect.addEventListener('change', function () {
            const sortOrder = this.value;
            console.log('Изменена сортировка хронологии на:', sortOrder);
            
            // Если есть загруженные данные хронологии, обновляем таблицу с новой сортировкой
            if (window.chronologyData && window.chronologyData.length > 0) {
                updateChronologyTable(window.chronologyData, sortOrder);
            }
        });
    }
});

// Функция для обновления данных активности мыши
function updateMouseActivityChart(mouseData) {
    if (!mouseData || mouseData.length === 0) {
        console.warn('Нет данных для отображения в графике активности мыши');
        document.getElementById('no-mouse-data').style.display = 'block';
        return;
    }

    // Проверяем наличие элемента canvas
    const chartElement = document.getElementById('mouse-activity-chart');
    if (!chartElement) {
        console.error('Элемент mouse-activity-chart не найден');
        return;
    }

    try {
        const ctx = chartElement.getContext('2d');
        if (!ctx) {
            console.error('Не удалось получить контекст для canvas');
            return;
        }

        // Сортируем данные по времени
        const sortedMouseData = [...mouseData].sort((a, b) => {
            return new Date(a.timestamp) - new Date(b.timestamp);
        });

        // Ограничиваем количество точек для графика (например, берем последние 50)
        const dataToShow = sortedMouseData.slice(-50);

        // Подготавливаем данные для графиков
        const times = dataToShow.map(r => {
            const date = new Date(r.timestamp);
            return date.toLocaleTimeString('ru-RU', {
                hour: '2-digit',
                minute: '2-digit'
            });
        });

        const clicks = dataToShow.map(r => parseInt(r.mouse_clicks) || 0);
        const movements = dataToShow.map(r => parseInt(r.mouse_movements) || 0);

        // Уничтожаем предыдущий график, если он есть
        if (window.mouseChart) {
            window.mouseChart.destroy();
        }

        // Создаем новый график
        window.mouseChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: times,
                datasets: [
                    {
                        label: 'Клики мыши',
                        data: clicks,
                        borderColor: '#1e3a8a',
                        backgroundColor: 'rgba(30, 58, 138, 0.1)',
                        borderWidth: 2,
                        tension: 0.1
                    },
                    {
                        label: 'Движения мыши',
                        data: movements,
                        borderColor: '#dc3545',
                        backgroundColor: 'rgba(220, 53, 69, 0.1)',
                        borderWidth: 2,
                        tension: 0.1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Количество'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Время'
                        }
                    }
                },
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    title: {
                        display: true,
                        text: 'Активность мыши'
                    }
                }
            }
        });

        document.getElementById('no-mouse-data').style.display = 'none';
    } catch (error) {
        console.error('Ошибка при создании графика активности мыши:', error);
        document.getElementById('no-mouse-data').style.display = 'block';
    }
}
