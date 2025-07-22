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

    // Используем новый алгоритм для корректного расчета общего времени
    const totalTime = calculateTotalActivityTime(activities);

    // НОВЫЙ ПОДХОД: считаем продуктивное время по объединенным периодам
    // Разделяем активности по продуктивности
    const productiveActivities = [];
    const unproductiveActivities = [];
    const breakActivities = [];

    activities.forEach(activity => {
        if (isBreak(activity)) {
            breakActivities.push(activity);
        } else {
            const productivity = getProductivityScore(activity);
            if (productivity >= 0.6) {
                productiveActivities.push(activity);
            } else {
                unproductiveActivities.push(activity);
            }
        }
    });

    // Считаем время для каждого типа активности отдельно с учетом перекрытий
    const productiveTime = calculateTotalActivityTime(productiveActivities);
    const unproductiveTime = calculateTotalActivityTime(unproductiveActivities);
    const breaksTime = calculateTotalActivityTime(breakActivities);

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

    // Обновляем метрики текущего использования
    if (sortedResources.length > 0) {
        const latestData = sortedResources[sortedResources.length - 1];
        updateResourceMetrics(latestData);
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
    }];

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
    setupResourceChartControls(times, cpu, ram, disk);
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
function setupResourceChartControls(times, cpu, ram, disk) {
    const allButton = document.getElementById('chart-view-all');
    const cpuButton = document.getElementById('chart-view-cpu');
    const ramButton = document.getElementById('chart-view-ram');
    const diskButton = document.getElementById('chart-view-disk');

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

    function setActiveButton(button) {
        [allButton, cpuButton, ramButton, diskButton].forEach(btn => {
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

    return `${hours}ч ${minutes}м`;
}

// Функция для форматирования минут в часы и минуты
function formatMinutes(minutes) {
    if (isNaN(minutes) || minutes === null) return "0м";

    // Округляем до ближайшего целого числа
    minutes = Math.round(minutes);

    let hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);

    if (hours > 0) {
        return `${hours}ч ${mins}м`;
    } else {
        return `${mins}м`;
    }
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

// Функция для обновления графика использования браузеров (переделанная для window_activity)
function updateBrowserChart(data) {
    console.log('updateBrowserChart: Начинаем обновление графика браузеров');
    console.log('updateBrowserChart: Входные данные:', data);

    // Используем унифицированный анализатор браузерной активности
    if (window.browserActivityManager) {
        window.browserActivityManager.updateChart(data);
    } else {
        console.error('updateBrowserChart: BrowserActivityManager не инициализирован');

        // Создаем экземпляр если его нет
        if (typeof BrowserActivityManager !== 'undefined') {
            window.browserActivityManager = new BrowserActivityManager();
            window.browserActivityManager.updateChart(data);
        } else {
            console.error('updateBrowserChart: Класс BrowserActivityManager не найден');
        }
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

    console.log("🌐 Обновление списка посещённых сайтов:", websiteData);

    if (!websiteData || websiteData.length === 0) {
        noDataElement.style.display = 'block';
        return;
    }

    noDataElement.style.display = 'none';

    // Группируем по доменам для избежания дублирования
    const siteGroups = {};

    websiteData.forEach(visit => {
        // Извлекаем информацию из window_activity
        const windowTitle = visit.window_title || visit.title || '';
        const appName = visit.app_name || visit.application || '';

        // Определяем браузер
        const browserInfo = identifyBrowserFromWindow(appName, windowTitle);

        // Извлекаем информацию о сайте
        const siteInfo = extractSiteInfoFromTitle(windowTitle, browserInfo.name);

        console.log(`🔍 Анализируем окно: "${windowTitle}" -> домен: "${siteInfo.domain}"`);

        if (!siteInfo.domain || siteInfo.domain === 'unknown') {
            console.log(`❌ Пропускаем: домен не найден для "${windowTitle}"`);
            return; // Пропускаем записи без домена
        }

        const domain = siteInfo.domain;
        const duration = parseInt(visit.duration || 0);

        if (!siteGroups[domain]) {
            siteGroups[domain] = {
                domain: domain,
                site_name: siteInfo.title || domain,
                url: siteInfo.url || domain,
                browser: browserInfo.name,
                browser_icon: browserInfo.icon,
                total_duration: 0,
                visit_count: 0,
                last_visit: visit.timestamp || visit.start_time,
                is_productive: calculateWebsiteProductivity(domain),
                categories: categorizeWebsite(domain),
                visits: []
            };
        }

        // Добавляем время и посещение
        siteGroups[domain].total_duration += duration;
        siteGroups[domain].visit_count += 1;

        // Сохраняем детали посещения
        siteGroups[domain].visits.push({
            timestamp: visit.timestamp || visit.start_time,
            duration: duration,
            window_title: windowTitle,
            app_name: appName
        });

        // Обновляем время последнего посещения
        const currentVisit = new Date(visit.timestamp || visit.start_time);
        const lastVisit = new Date(siteGroups[domain].last_visit);
        if (currentVisit > lastVisit) {
            siteGroups[domain].last_visit = visit.timestamp || visit.start_time;
            siteGroups[domain].browser = browserInfo.name;
            siteGroups[domain].browser_icon = browserInfo.icon;
        }
    });

    // Сортируем по общему времени использования
    const sortedSites = Object.values(siteGroups)
        .filter(site => site.total_duration > 0) // Убираем сайты с нулевым временем
        .sort((a, b) => b.total_duration - a.total_duration)
        .slice(0, 15); // Показываем топ-15 сайтов

    console.log(`📊 Отображаем ${sortedSites.length} уникальных сайтов`);

    sortedSites.forEach(site => {
        const card = document.createElement('div');
        card.className = `website-card ${site.is_productive ? 'productive' : 'unproductive'}`;
        card.onclick = () => openEnhancedWebsiteModal(site);

        // Форматируем время
        const timeSpent = formatDuration(site.total_duration);
        const lastVisitTime = new Date(site.last_visit);
        const timeAgo = getTimeAgo(lastVisitTime);

        // Определяем иконки и классы
        const productivityIcon = site.is_productive ?
            '<i class="bi bi-check-circle-fill text-success"></i>' :
            '<i class="bi bi-x-circle-fill text-danger"></i>';

        const browserIcon = site.browser_icon || 'bi-globe';

        card.innerHTML = `
            <div class="website-header">
                <div class="website-title">
                    <strong>${site.domain}</strong>
                    ${productivityIcon}
                </div>
                <div class="website-time">${timeSpent}</div>
            </div>
            <div class="website-details">
                <div class="website-browser">
                    <i class="${browserIcon}"></i> ${site.browser}
                </div>
                <div class="website-visits">
                    <i class="bi bi-eye"></i> ${site.visit_count} посещений
                </div>
            </div>
            <div class="website-meta">
                <span class="last-visit">
                    <i class="bi bi-clock"></i> ${timeAgo}
                </span>
                <span class="categories">
                    ${site.categories.slice(0, 2).map(cat =>
            `<span class="category-badge">${cat}</span>`
        ).join('')}
                </span>
            </div>
        `;

        container.appendChild(card);
    });
}

// Вспомогательная функция для определения времени "назад"
function getTimeAgo(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'только что';
    if (diffMins < 60) return `${diffMins} мин назад`;
    if (diffHours < 24) return `${diffHours} ч назад`;
    if (diffDays === 1) return 'вчера';
    if (diffDays < 7) return `${diffDays} дн назад`;

    return formatDate(date);
}

// Вспомогательные функции для извлечения информации о сайтах
function identifyBrowserFromWindow(appName, windowTitle) {
    const app = (appName || '').toLowerCase();
    const title = (windowTitle || '').toLowerCase();

    if (app.includes('chrome') || title.includes('chrome')) {
        return { name: 'Chrome', icon: 'bi-browser-chrome' };
    }
    if (app.includes('firefox') || title.includes('firefox')) {
        return { name: 'Firefox', icon: 'bi-browser-firefox' };
    }
    if (app.includes('edge') || title.includes('edge')) {
        return { name: 'Edge', icon: 'bi-browser-edge' };
    }
    if (app.includes('safari') || title.includes('safari')) {
        return { name: 'Safari', icon: 'bi-browser-safari' };
    }
    if (app.includes('opera') || title.includes('opera')) {
        return { name: 'Opera', icon: 'bi-browser-opera' };
    }

    return { name: 'Браузер', icon: 'bi-globe' };
}

function extractSiteInfoFromTitle(windowTitle, browserName) {
    if (!windowTitle) return { title: '', url: '', domain: 'unknown' };

    const title = windowTitle.trim();

    // Паттерны для извлечения URL/домена из заголовка
    const patterns = [
        // Прямые URL в заголовке
        /https?:\/\/(www\.)?([^\/\s]+)/i,
        // Домен в скобках или после тире
        /[—\-–]\s*([a-zA-Z0-9][a-zA-Z0-9-]*\.([a-zA-Z]{2,}))$/i,
        // Домен в начале заголовка
        /^([a-zA-Z0-9][a-zA-Z0-9-]*\.([a-zA-Z]{2,}))/i
    ];

    let domain = 'unknown';
    let url = '';

    for (const pattern of patterns) {
        const match = title.match(pattern);
        if (match) {
            domain = match[2] || match[1];
            url = match[0].startsWith('http') ? match[0] : `https://${domain}`;
            break;
        }
    }

    // Если не нашли домен в заголовке, пытаемся извлечь из известных паттернов
    if (domain === 'unknown') {
        domain = extractDomainFromTitle(title);
    }

    return {
        title: title.split(' - ')[0] || title, // Берём первую часть до тире
        url: url,
        domain: domain
    };
}
function extractDomainFromTitle(title) {
    console.log(`🔍 Извлекаем домен из заголовка: "${title}"`);

    // Паттерны для извлечения URL/доменов
    const urlPatterns = [
        // Полные URL (http/https)
        /https?:\/\/(?:www\.)?([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i,
        // Домены с www
        /www\.([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i,
        // Просто домены
        /([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i
    ];

    // Попытка извлечь URL/домен через регулярные выражения
    for (const pattern of urlPatterns) {
        const match = title.match(pattern);
        if (match) {
            const domain = match[1].toLowerCase();
            console.log(`✅ Найден домен через regex: ${domain}`);
            return domain;
        }
    }

    // Ключевые слова для популярных сайтов
    const commonDomains = {
        'youtube': 'youtube.com',
        'google': 'google.com',
        'github': 'github.com',
        'stackoverflow': 'stackoverflow.com',
        'stack overflow': 'stackoverflow.com',
        'vk': 'vk.com',
        'telegram': 'web.telegram.org',
        'whatsapp': 'web.whatsapp.com',
        'discord': 'discord.com',
        'slack': 'slack.com',
        'notion': 'notion.so',
        'figma': 'figma.com',
        'gmail': 'gmail.com',
        'outlook': 'outlook.com',
        'microsoft': 'microsoft.com',
        'office': 'office.com',
        'docs.google': 'docs.google.com',
        'drive.google': 'drive.google.com',
        'meet.google': 'meet.google.com',
        'teams': 'teams.microsoft.com',
        'zoom': 'zoom.us',
        'jira': 'atlassian.net',
        'confluence': 'atlassian.net',
        'trello': 'trello.com',
        'asana': 'asana.com',
        'monday': 'monday.com',
        'clickup': 'clickup.com',
        'linear': 'linear.app',
        'vercel': 'vercel.com',
        'netlify': 'netlify.com',
        'aws': 'aws.amazon.com',
        'azure': 'portal.azure.com',
        'docker': 'docker.com',
        'kubernetes': 'kubernetes.io',
        'jenkins': 'jenkins.io',
        'gitlab': 'gitlab.com',
        'bitbucket': 'bitbucket.org',
        'gradle': 'gradle.org',
        // ��������� �������
        'yandex': 'yandex.ru',
        'mail.ru': 'mail.ru',
        'dzen': 'dzen.ru',
        'autodesk': 'autodesk.com',
        'autocad': 'autocad.ru',
        'kompas': 'kompas.ru',
        'nanocad': 'nanocad.ru',
        '1c': '1c.ru',
        'kontur': 'kontur.ru',
        'sbis': 'sbis.ru',
        'consultant': 'consultant.ru',
        'garant': 'garant.ru',
        'gosuslugi': 'gosuslugi.ru',
        'zakupki': 'zakupki.gov.ru',
        'goszakupki': 'goszakupki.gov.ru',
        'pypi': 'pypi.org',
        'maven': 'maven.apache.org',
        'gradle': 'gradle.org'
    };

    const lowerTitle = title.toLowerCase();

    for (const [keyword, domain] of Object.entries(commonDomains)) {
        if (lowerTitle.includes(keyword)) {
            console.log(`✅ Найден домен через ключевое слово "${keyword}": ${domain}`);
            return domain;
        }
    }

    console.log(`❌ Домен не найден для заголовка: "${title}"`);
}

function categorizeWebsite(domain) {
    const categories = {
        'youtube.com': ['Видео', 'Развлечения'],
        'google.com': ['Поиск', 'Инструменты'],
        'github.com': ['Разработка', 'Код'],
        'stackoverflow.com': ['Разработка', 'Обучение'],
        'vk.com': ['Социальные сети'],
        'web.telegram.org': ['Мессенджеры'],
        'web.whatsapp.com': ['Мессенджеры'],
        'discord.com': ['Мессенджеры', 'Игры'],
        'slack.com': ['Работа', 'Коммуникация'],
        'notion.so': ['Работа', 'Планирование'],
        'figma.com': ['Дизайн', 'Работа'],
        'gmail.com': ['Почта', 'Коммуникация'],
        'outlook.com': ['Почта', 'Работа']
    };

    return categories[domain] || ['Веб-сайт'];
}
function calculateWebsiteProductivity(domain) {
    const productiveDomains = [
        // -----------------------------
        // 🏗️ Архитектура и проектирование
        // -----------------------------
        'autodesk.com', 'autocad.ru', 'revit.ru',
        'graphisoft.com', 'archicad.ru',
        'ascon.ru', 'kompas.ru', 'nanocad.ru',
        'tekla.com', 'bentley.com',
        'sketchup.com', 'lumion3d.com', 'corona-renderer.com', 'v-ray.com',
        '3dsmax.ru', 'adobe.com', 'creativesuite.ru',
        'bim360.autodesk.com', 'planradar.com', 'cype.com',
        'stroi.ru', 'stroyportal.ru', 'proektant.org',
        'gost.ru', 'snip.ru', 'normacs.ru',
        'mos.ru', 'stroi.mos.ru', 'spb.gov.ru/stroitelstvo',

        // -----------------------------
        // 💰 Сметное дело
        // -----------------------------
        'smetsoft.ru', 'smeta-expert.ru', 'smetnye-normy.ru',
        'smetka.pro', 'smetaonline.ru', 'smetcom.ru',
        'tks.ru', 'tkp.smet.ru', 'smetcalc.ru',

        // -----------------------------
        // 📋 ПТО (Производственно-технический отдел)
        // -----------------------------
        'goszakupki.gov.ru', 'zakupki.gov.ru',
        'roseltorg.ru', 'sberbank-ast.ru',
        'tradesoft1.ru', 'projectbase.ru', 'docsvision.ru',
        '4dsoft.ru', 'business-doc.ru', 'elicense.ru',

        // -----------------------------
        // 🧮 Бухгалтерия и финансы
        // -----------------------------
        '1c.ru', '1c-bitrix.ru', '1c-dnepr.com',
        'kontur.ru', 'sbis.ru', 'moedelo.org',
        'buhsoft.ru', 'nalog.ru', 'gosuslugi.ru',
        'ofd.ru', 'glavbukh.ru', 'audit-it.ru',
        'consultant.ru', 'garant.ru', 'pravoved.ru',

        // -----------------------------
        // 🌐 Универсальные инструменты
        // -----------------------------
        'github.com', 'gitlab.com', 'bitbucket.org',
        'stackoverflow.com', 'docs.google.com', 'notion.so',
        'figma.com', 'slack.com', 'gmail.com', 'outlook.com',
        'drive.google.com', 'meet.google.com', 'teams.microsoft.com',
        'zoom.us', 'atlassian.net', 'trello.com', 'asana.com',
        'vercel.com', 'netlify.com', 'aws.amazon.com', 'portal.azure.com',
        'docker.com', 'kubernetes.io', 'jenkins.io', 'npmjs.com',
        'pypi.org', 'maven.apache.org', 'gradle.org', 'web.telegram.org',

        // -----------------------------
        // 🇷🇺 Российские почтовые и облачные сервисы
        // -----------------------------
    ];

    return productiveDomains.includes(domain);
}


function openEnhancedWebsiteModal(siteData) {
    // Создаём модальное окно с подробной информацией о сайте
    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.id = 'websiteModal';
    modal.setAttribute('tabindex', '-1');

    const totalTime = formatDuration(siteData.total_duration);
    const avgTime = formatDuration(Math.round(siteData.total_duration / siteData.visit_count));

    modal.innerHTML = `
        <div class="modal-dialog modal-lg">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">
                        <i class="${siteData.browser_icon}"></i>
                        ${siteData.domain}
                    </h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <div class="row mb-3">
                        <div class="col-md-6">
                            <strong>Общее время:</strong> ${totalTime}
                        </div>
                        <div class="col-md-6">
                            <strong>Посещений:</strong> ${siteData.visit_count}
                        </div>
                        <div class="col-md-6">
                            <strong>Среднее время:</strong> ${avgTime}
                        </div>
                        <div class="col-md-6">
                            <strong>Продуктивность:</strong> 
                            ${siteData.is_productive ?
            '<span class="badge bg-success">Продуктивный</span>' :
            '<span class="badge bg-danger">Непродуктивный</span>'
        }
                        </div>
                    </div>
                    <div class="mb-3">
                        <strong>Категории:</strong>
                        ${siteData.categories.map(cat =>
            `<span class="badge bg-secondary me-1">${cat}</span>`
        ).join('')}
                    </div>
                    <div>
                        <strong>История посещений:</strong>
                        <div class="visit-history mt-2" style="max-height: 300px; overflow-y: auto;">
                            ${siteData.visits.slice(0, 20).map(visit => `
                                <div class="visit-item p-2 border-bottom">
                                    <div class="d-flex justify-content-between">
                                        <span>${formatDate(new Date(visit.timestamp))} ${formatTime(new Date(visit.timestamp))}</span>
                                        <span>${formatDuration(visit.duration)}</span>
                                    </div>
                                    <small class="text-muted">${visit.window_title}</small>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    const bsModal = new bootstrap.Modal(modal);
    bsModal.show();

    // Удаляем модалку после закрытия
    modal.addEventListener('hidden.bs.modal', () => {
        document.body.removeChild(modal);
    });
}

function generateSiteColor(domain) {
    const siteColors = {
        'github.com': 'rgba(33, 150, 243, 0.8)',
        'stackoverflow.com': 'rgba(255, 152, 0, 0.8)',
        'docs.google.com': 'rgba(76, 175, 80, 0.8)',
        'notion.so': 'rgba(156, 39, 176, 0.8)',
        'figma.com': 'rgba(233, 30, 99, 0.8)',
        'slack.com': 'rgba(103, 58, 183, 0.8)',
        'gmail.com': 'rgba(244, 67, 54, 0.8)',
        'outlook.com': 'rgba(0, 123, 255, 0.8)',
        'microsoft.com': 'rgba(0, 120, 212, 0.8)',
        'office.com': 'rgba(210, 71, 38, 0.8)'
    };

    if (siteColors[domain]) {
        return siteColors[domain];
    }

    // Генерируем цвет на основе хеша домена
    let hash = 0;
    for (let i = 0; i < domain.length; i++) {
        hash = domain.charCodeAt(i) + ((hash << 5) - hash);
    }

    const hue = Math.abs(hash) % 360;
    return `hsla(${hue}, 70%, 60%, 0.8)`;
}

// Функция для показа подробной информации о сайте
function showSiteDetailsModal(siteData) {
    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.id = 'siteDetailsModal';

    const avgTime = Math.round(siteData.total_duration / siteData.visit_count);

    modal.innerHTML = `
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header bg-primary text-white">
                    <h5 class="modal-title">
                        <i class="${siteData.browser_icon || 'bi-globe'} me-2"></i>
                        ${siteData.domain}
                    </h5>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <div class="row g-3">
                        <div class="col-md-6">
                            <div class="card border-0 bg-light">
                                <div class="card-body text-center">
                                    <i class="bi bi-clock-fill text-primary fs-2"></i>
                                    <h6 class="mt-2 mb-1">Общее время</h6>
                                    <p class="fs-5 fw-bold text-primary mb-0">${formatDuration(siteData.total_duration)}</p>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="card border-0 bg-light">
                                <div class="card-body text-center">
                                    <i class="bi bi-eye-fill text-success fs-2"></i>
                                    <h6 class="mt-2 mb-1">Посещений</h6>
                                    <p class="fs-5 fw-bold text-success mb-0">${siteData.visit_count}</p>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="card border-0 bg-light">
                                <div class="card-body text-center">
                                    <i class="bi bi-speedometer2 text-warning fs-2"></i>
                                    <h6 class="mt-2 mb-1">Среднее время</h6>
                                    <p class="fs-5 fw-bold text-warning mb-0">${formatDuration(avgTime)}</p>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="card border-0 bg-light">
                                <div class="card-body text-center">
                                    <i class="${siteData.browser_icon || 'bi-globe'} text-info fs-2"></i>
                                    <h6 class="mt-2 mb-1">Браузер</h6>
                                    <p class="fs-5 fw-bold text-info mb-0">${siteData.browser}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="mt-3">
                        <h6><i class="bi bi-tags me-2"></i>Категории:</h6>
                        <div>
                            ${siteData.categories.map(cat =>
        `<span class="badge bg-secondary me-1">${cat}</span>`
    ).join('')}
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
    const bsModal = new bootstrap.Modal(modal);
    bsModal.show();

    modal.addEventListener('hidden.bs.modal', () => {
        document.body.removeChild(modal);
    });
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
    const tableContainer = tbody.closest('.table-container') || tbody.closest('.table-responsive') || tbody.closest('div');

    // Очищаем таблицу
    tbody.innerHTML = '';

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
        tbody.appendChild(tr);

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
                <i class="bi bi-chevron-right me-2 app-expand-icon"></i>
                ${appName}
            </td>
            <td><span class="badge ${badgeClass}">${productivityText}</span></td>
            <td>${activities.length} активностей</td>
            <td>${formattedTotalDuration}</td>
        `;
        tbody.appendChild(appRow);

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
        tbody.appendChild(activitiesContainer);
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
                    header.querySelector('.app-expand-icon').style.transform = 'rotate(90deg)';
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
                    header.querySelector('.app-expand-icon').style.transform = 'rotate(0deg)';
                    content.classList.remove('show');
                }
            });
        });
    }

    // Добавляем обработчики для переключения состояния иконок при сворачивании/разворачивании
    document.querySelectorAll('.app-group-header').forEach(header => {
        header.addEventListener('click', function () {
            const icon = this.querySelector('.app-expand-icon');
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
        .app-expand-icon {
            transition: transform 0.3s ease;
        }
        .app-group-header.active .app-expand-icon {
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
    tbody.innerHTML = '';

    if (!activities || activities.length === 0) {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td colspan="3" class="text-center">Нет данных об активности</td>`;
        tbody.appendChild(tr);
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
                // Если новый период начинается до окончания текущего (с буфером 30 сек для учета переключений)
                if (period.start <= new Date(currentPeriod.end.getTime() + 30000)) {
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
        tbody.appendChild(tr);
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
    if (!data) {
        console.warn('Нет данных для отображения метрик, используем последние корректные данные');
        // Используем последние сохраненные данные
        displaySavedMetrics();
        return;
    }

    // Определяем активную вкладку для применения соответствующей логики
    const activeTab = getActiveTabId();
    console.log('Обновление метрик для вкладки:', activeTab);

    // Используем новую функцию mergeAllActivities для объединения всех типов активности
    const mergedActivities = mergeAllActivities(data);
    console.log('Обновление метрик: получено объединенных активностей -', mergedActivities.length);

    // Используем функцию calculateProductivity для объединенных активностей
    const metrics = calculateProductivity(mergedActivities);
    console.log('Рассчитанные метрики:', metrics);

    // Если метрики содержат ненулевые значения, сохраняем их
    if (metrics.totalTime > 0 || metrics.productiveTime > 0 || metrics.productivityScore > 0) {
        console.log('Сохраняем корректные метрики:', metrics);
        lastValidMetrics = {
            totalTime: metrics.totalTime,
            productiveTime: metrics.productiveTime,
            productivity: metrics.productivityScore,
            breaks: metrics.breaks
        };
    } else if (mergedActivities.length === 0) {
        // Если запрос вернул пустой массив активностей, то возможно нет данных за выбранную дату
        // Но не обнуляем предыдущие метрики, если были корректные данные
        console.log('Нет активностей за выбранную дату, но сохраняем предыдущие метрики');
    }

    // Информация о периоде из данных (если доступна)
    const periodInfo = data.period_info || {};

    // Обновление метрик на странице в зависимости от активной вкладки
    const totalWorkingTimeElement = document.getElementById('total-working-time');
    if (totalWorkingTimeElement) {
        // Используем метрики с проверкой - если пустые данные, берем последние валидные
        const timeToDisplay = (metrics.totalTime > 0) ? metrics.totalTime : lastValidMetrics.totalTime;
        // Округляем минуты до целых чисел
        const hours = Math.floor(timeToDisplay / 60);
        const minutes = Math.round(timeToDisplay % 60);
        totalWorkingTimeElement.textContent = formatTimeNicely(hours, minutes);

        // Добавляем подзаголовок с периодом в зависимости от вкладки
        updateMetricSubtitle(totalWorkingTimeElement, metrics, activeTab, periodInfo);
    }

    const productiveTimeElement = document.getElementById('productive-time');
    if (productiveTimeElement) {
        // Используем метрики с проверкой - если пустые данные, берем последние валидные
        const prodTimeToDisplay = (metrics.productiveTime > 0) ? metrics.productiveTime : lastValidMetrics.productiveTime;
        // Отображаем продуктивное время в формате "часы:минуты"
        const productiveHours = Math.floor(prodTimeToDisplay / 60);
        const productiveMinutes = Math.round(prodTimeToDisplay % 60);
        productiveTimeElement.textContent = formatTimeNicely(productiveHours, productiveMinutes);

        // Добавляем процент от общего времени
        const subtitle = productiveTimeElement.parentElement.querySelector('.metric-subtitle');
        if (subtitle) {
            const totalTimeForCalc = Math.max(metrics.totalTime, lastValidMetrics.totalTime);
            const prodTimeForCalc = Math.max(metrics.productiveTime, lastValidMetrics.productiveTime);
            const percentOfTotal = totalTimeForCalc > 0 ?
                ((prodTimeForCalc / totalTimeForCalc) * 100).toFixed(1) : 0;
            subtitle.textContent = `${percentOfTotal}% от общего времени`;
        }
    }

    const activityScoreElement = document.getElementById('activity-score');
    if (activityScoreElement) {
        // Используем метрики с проверкой - если пустые данные, берем последние валидные
        const productivityToDisplay = (metrics.productivityScore > 0) ?
            metrics.productivityScore : lastValidMetrics.productivity;

        activityScoreElement.textContent = `${productivityToDisplay.toFixed(1)}%`;

        // Уточняем, что это средний балл
        const subtitle = activityScoreElement.parentElement.querySelector('.metric-subtitle');
        if (subtitle) {
            subtitle.textContent = 'Средний балл продуктивности';
        }
    }

    const breakTimeElement = document.getElementById('break-time');
    if (breakTimeElement) {
        // Показываем реальные перерывы из новых расчетов
        const breakHours = Math.floor(metrics.breaks / 60);
        const breakMinutes = Math.round(metrics.breaks % 60);
        breakTimeElement.textContent = formatTimeNicely(breakHours, breakMinutes);

        const subtitle = breakTimeElement.parentElement.querySelector('.metric-subtitle');
        if (subtitle) {
            subtitle.textContent = 'Время неактивности';
        }
    }

    // Обновление времени последнего обновления
    const lastUpdateElement = document.getElementById('last-update');
    if (lastUpdateElement) {
        lastUpdateElement.textContent = formatTime(new Date());
    }
}

// Функция для отображения сохраненных метрик без обновления данных
function displaySavedMetrics() {
    console.log('Отображаем сохраненные метрики:', lastValidMetrics);

    const totalWorkingTimeElement = document.getElementById('total-working-time');
    if (totalWorkingTimeElement && lastValidMetrics.totalTime > 0) {
        const hours = Math.floor(lastValidMetrics.totalTime / 60);
        const minutes = Math.round(lastValidMetrics.totalTime % 60);
        totalWorkingTimeElement.textContent = formatTimeNicely(hours, minutes);
    }

    const productiveTimeElement = document.getElementById('productive-time');
    if (productiveTimeElement && lastValidMetrics.productiveTime > 0) {
        const productiveHours = Math.floor(lastValidMetrics.productiveTime / 60);
        const productiveMinutes = Math.round(lastValidMetrics.productiveTime % 60);
        productiveTimeElement.textContent = formatTimeNicely(productiveHours, productiveMinutes);

        // Обновляем подзаголовок
        const subtitle = productiveTimeElement.parentElement.querySelector('.metric-subtitle');
        if (subtitle && lastValidMetrics.totalTime > 0) {
            const percentOfTotal = (lastValidMetrics.productiveTime / lastValidMetrics.totalTime * 100).toFixed(1);
            subtitle.textContent = `${percentOfTotal}% от общего времени`;
        }
    }

    const activityScoreElement = document.getElementById('activity-score');
    if (activityScoreElement && lastValidMetrics.productivity > 0) {
        activityScoreElement.textContent = `${lastValidMetrics.productivity.toFixed(1)}%`;
    }

    const breakTimeElement = document.getElementById('break-time');
    if (breakTimeElement && lastValidMetrics.breaks > 0) {
        const breakHours = Math.floor(lastValidMetrics.breaks / 60);
        const breakMinutes = Math.round(lastValidMetrics.breaks % 60);
        breakTimeElement.textContent = formatTimeNicely(breakHours, breakMinutes);
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
    // Инициализируем унифицированный анализатор браузерной активности
    console.log('Инициализируем BrowserActivityManager...');
    if (typeof BrowserActivityManager !== 'undefined') {
        window.browserActivityManager = new BrowserActivityManager();
        console.log('BrowserActivityManager успешно инициализирован');
    } else {
        console.warn('BrowserActivityManager не найден - возможно, не подключен browser-activity.js');
    }

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
            } else if (e.target.id === 'browsers-tab') {
                // Для вкладки браузеров - обновляем данные браузеров
                console.log('🌐 Переключение на вкладку браузеров - обновляем данные');
                if (window.browserActivityManager && window.lastLoadedData) {
                    console.log('📊 Обновляем чарт браузерной активности с сохраненными данными');
                    setTimeout(() => {
                        window.browserActivityManager.updateChart(window.lastLoadedData);
                    }, 200);
                } else {
                    console.log('📊 Загружаем новые данные для браузеров');
                    loadDashboardData();
                }
            }
            // Удалено: обработчик для timesheet-tab - теперь обрабатывается в dashboard-timesheet.js
        });
    });
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

// Функция для обновления таблицы с данными активности мыши
function updateMouseActivityTable(mouseData) {
    const tbody = document.getElementById('mouse-activity-table')?.querySelector('tbody');
    if (!tbody) return;

    if (!mouseData || mouseData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center">Нет данных об активности мыши</td></tr>';
        return;
    }

    // Очистка таблицы
    tbody.innerHTML = '';

    // Добавление данных по активности мыши (последние 10 записей)
    const recentMouseData = [...mouseData].sort((a, b) => {
        return new Date(b.timestamp) - new Date(a.timestamp);
    }).slice(0, 10);

    recentMouseData.forEach(item => {
        const row = document.createElement('tr');
        const timestamp = new Date(item.timestamp);
        row.innerHTML = `
            <td>${formatDate(timestamp)} ${formatTime(timestamp)}</td>
            <td>${item.mouse_clicks || 0}</td>
            <td>${item.mouse_movements || 0}</td>
            <td>${item.device_id || '-'}</td>
        `;
        tbody.appendChild(row);
    });
}

// Функция для форматирования длительности
function formatDuration(seconds) {
    if (!seconds || isNaN(seconds) || seconds < 0) {
        return '0с';
    }

    // Проверка формата входных данных
    if (typeof seconds === 'string' && seconds.includes('.')) {
        // Если это строка с точкой, предполагаем что формат "секунды.миллисекунды"
        seconds = parseFloat(seconds);
    }

    // Округляем до целого значения секунд
    seconds = Math.round(seconds);

    // Преобразуем секунды в более читаемый формат
    if (seconds < 60) {
        // Менее минуты - отображаем в секундах
        return `${seconds}с`;
    } else if (seconds < 3600) {
        // Менее часа - отображаем в минутах и секундах
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        if (remainingSeconds === 0) {
            return `${minutes}м`;
        } else {
            return `${minutes}м ${remainingSeconds}с`;
        }
    } else {
        // Больше часа - отображаем в часах и минутах
        const hours = Math.floor(seconds / 3600);
        const remainingMinutes = Math.floor((seconds % 3600) / 60);
        if (remainingMinutes === 0) {
            return `${hours}ч`;
        } else {
            return `${hours}ч ${remainingMinutes}м`;
        }
    }
}

// Основная функция загрузки данных
async function loadDashboardData() {
    const employeeFilter = document.getElementById('employee-filter');
    const deviceFilter = document.getElementById('device-filter');
    const dateFilter = document.getElementById('date-filter');
    const periodFilter = document.getElementById('period-filter');
    const activityTypeFilter = document.getElementById('activity-type-filter');

    // Установка значений по умолчанию, если они не выбраны
    if (dateFilter && !dateFilter.value) {
        const today = new Date();
        dateFilter.value = today.toISOString().slice(0, 10);
    }

    // Получаем текущую дату
    const selectedDate = dateFilter && dateFilter.value ? new Date(dateFilter.value) : new Date();
    const selectedPeriod = periodFilter && periodFilter.value ? periodFilter.value : 'day';

    // Рассчитываем фактический период для запроса
    let startDate = new Date(selectedDate);
    let endDate = new Date(selectedDate);

    // В зависимости от выбранного периода устанавливаем правильные даты
    if (selectedPeriod === 'day') {
        // Для периода "день" - используем только выбранную дату
        startDate = new Date(selectedDate);
        endDate = new Date(selectedDate);
    } else if (selectedPeriod === 'week') {
        // Для периода "неделя" - отсчитываем неделю назад от выбранной даты
        startDate = new Date(selectedDate);
        startDate.setDate(startDate.getDate() - 6); // 7 дней включая выбранную дату
    } else if (selectedPeriod === 'month') {
        // Для периода "месяц" - отсчитываем месяц назад от выбранной даты
        startDate = new Date(selectedDate);
        startDate.setMonth(startDate.getMonth() - 1);
        // Корректируем день, если в прошлом месяце не было такого числа
        if (startDate.getDate() !== selectedDate.getDate()) {
            // Устанавливаем последний день предыдущего месяца
            startDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 0);
        }
    }

    // Форматируем даты для API-запросов
    const formattedStartDate = startDate.toISOString().split('T')[0];
    const formattedEndDate = endDate.toISOString().split('T')[0];

    console.log(`Загрузка данных за период: ${formattedStartDate} до ${formattedEndDate}, период: ${selectedPeriod}`);

    // Формирование параметров запроса
    const params = new URLSearchParams();
    if (employeeFilter && employeeFilter.value) params.append('employee_id', employeeFilter.value);
    if (deviceFilter && deviceFilter.value) params.append('device_id', deviceFilter.value);
    params.append('date', dateFilter.value); // Всегда передаем выбранную дату
    params.append('period', periodFilter.value); // Всегда передаем выбранный период

    // Добавляем дополнительные параметры для учета периода
    params.append('start_date', formattedStartDate);
    params.append('end_date', formattedEndDate);

    if (activityTypeFilter && activityTypeFilter.value !== 'all') {
        params.append('activity_type', activityTypeFilter.value);
    }

    try {
        showLoading(true);
        const lastUpdateElement = document.getElementById('last-update');
        if (lastUpdateElement) {
            lastUpdateElement.textContent = new Date().toLocaleTimeString();
        }

        // Обновляем данные используя те же API эндпоинты, что и в direct-data.html
        let monitoringData = [], windowData = [], mouseData = [];

        // Получаем данные мониторинга ресурсов
        try {
            const monitoringResponse = await fetch(`/api/public/monitoring/data?${params.toString()}`);
            if (monitoringResponse.ok) {
                monitoringData = await monitoringResponse.json();
                console.log('Данные мониторинга:', monitoringData);

                // Проверяем, содержит ли ответ данные
                if (monitoringData && monitoringData.length > 0) {
                    // Сразу обновляем метрики ресурсов с последними полученными данными
                    const latestData = monitoringData[monitoringData.length - 1];
                    updateResourceMetrics(latestData);
                }
            } else {
                console.error(`HTTP error ${monitoringResponse.status}: ${await monitoringResponse.text()}`);
            }
        } catch (error) {
            console.error('Ошибка при загрузке данных мониторинга:', error);
        }

        // Получаем данные активности окон
        try {
            const windowResponse = await fetch(`/api/public/activity/windows?${params.toString()}`);
            if (windowResponse.ok) {
                windowData = await windowResponse.json();
                console.log('Данные активности окон:', windowData);

                // Применяем клиентскую фильтрацию
                const filters = getCurrentFilters();
                windowData = filterDataByEmployee(windowData, filters.employeeId, filters.deviceId);
                console.log('Данные активности окон после фильтрации:', windowData);
            } else {
                console.error(`HTTP error ${windowResponse.status}: ${await windowResponse.text()}`);
            }
        } catch (error) {
            console.error('Ошибка при загрузке данных окон:', error);
        }

        // Получаем данные активности мыши
        try {
            const mouseResponse = await fetch(`/api/public/activity/mouse?${params.toString()}`);
            if (mouseResponse.ok) {
                mouseData = await mouseResponse.json();
                console.log('Данные активности мыши:', mouseData);

                // Применяем клиентскую фильтрацию
                const filters = getCurrentFilters();
                mouseData = filterDataByEmployee(mouseData, filters.employeeId, filters.deviceId);
                console.log('Данные активности мыши после фильтрации:', mouseData);
            } else {
                console.error(`HTTP error ${mouseResponse.status}: ${await mouseResponse.text()}`);
            }
        } catch (error) {
            console.error('Ошибка при загрузке данных активности мыши:', error);
        }

        // Получаем скриншоты
        let screenshotsData = [];
        try {
            const screenshotsResponse = await fetch(`/api/public/screenshots?${params.toString()}`);
            if (screenshotsResponse.ok) {
                screenshotsData = await screenshotsResponse.json();
                console.log('Данные скриншотов:', screenshotsData);

                // Применяем клиентскую фильтрацию
                const filters = getCurrentFilters();
                screenshotsData = filterDataByEmployee(screenshotsData, filters.employeeId, filters.deviceId);
                console.log('Данные скриншотов после фильтрации:', screenshotsData);
            } else {
                console.error(`HTTP error ${screenshotsResponse.status}: ${await screenshotsResponse.text()}`);
            }
        } catch (error) {
            console.error('Ошибка при загрузке скриншотов:', error);
        }

        // Получаем данные браузерной активности
        let browserData = [];
        try {
            const browserResponse = await fetch(`/api/public/browser-activity?${params.toString()}`);
            if (browserResponse.ok) {
                browserData = await browserResponse.json();
                console.log('Данные браузерной активности:', browserData);

                // Применяем клиентскую фильтрацию
                const filters = getCurrentFilters();
                browserData = filterDataByEmployee(browserData, filters.employeeId, filters.deviceId);
                console.log('Данные браузерной активности после фильтрации:', browserData);
            } else {
                console.error(`HTTP error ${browserResponse.status}: ${await browserResponse.text()}`);
            }
        } catch (error) {
            console.error('Ошибка при загрузке данных браузерной активности:', error);
        }

        // Обновляем информацию о периоде в UI
        updatePeriodDisplay(formattedStartDate, formattedEndDate, selectedPeriod);

        // Создаем объект данных для обработки (убрали browser_activity и website_visits)
        const data = {
            resources: monitoringData,
            activities: windowData,
            mouse_activity: mouseData,
            screenshots: screenshotsData,
            period_info: {
                start_date: formattedStartDate,
                end_date: formattedEndDate,
                period_type: selectedPeriod
            }
        };

        // Проверка на наличие данных перед обновлением метрик
        const hasData = windowData && windowData.length > 0;
        console.log('Проверка наличия данных перед обновлением метрик:', { hasData, windowDataLength: windowData.length });

        // Обновляем метрики только если есть данные активности
        if (hasData) {
            // Безопасное обновление компонентов с обработкой ошибок
            try { updateMetrics(data); }
            catch (e) {
                console.error('Ошибка при обновлении метрик:', e);
                // В случае ошибки, показываем сохраненные метрики
                displaySavedMetrics();
            }
        } else {
            // Если нет данных, используем сохраненные метрики
            console.log('Нет данных активности, используем сохраненные метрики');
            displaySavedMetrics();
        }

        try { updateWorkingTimeTable(windowData); }
        catch (e) { console.error('Ошибка при обновлении таблицы рабочего времени:', e); }

        // Получаем объединенные активности для корректного отображения
        const mergedActivities = data ? mergeAllActivities(data) : [];
        console.log('Объединенные активности для отображения:', mergedActivities.length);

        try { updateActivityTable(mergedActivities); }
        catch (e) { console.error('Ошибка при обновлении таблицы активности:', e); }

        try { updateActivityChart(mergedActivities); }
        catch (e) { console.error('Ошибка при обновлении графика активности:', e); }

        try {
            if (monitoringData && monitoringData.length > 0) {
                updateResourceChart(monitoringData);
            } else {
                console.warn('Нет данных для обновления графиков ресурсов');
            }
        }
        catch (e) { console.error('Ошибка при обновлении графика ресурсов:', e); }

        // Обновление данных по браузерам и посещениям веб-сайтов (теперь из window_activity)
        try { updateBrowserChart({ activities: windowData }); }
        catch (e) { console.error('Ошибка при обновлении графика браузеров:', e); }

        // Извлекаем данные браузеров из окон для обновления списка и графика сайтов
        const browserActivityFromWindows = extractBrowserActivityFromWindows(windowData);

        try { updateWebsitesList(browserActivityFromWindows); }
        catch (e) { console.error('Ошибка при обновлении списка посещений веб-сайтов:', e); }

        try { window.browserActivityManager?.updateChart(window.lastLoadedData || { activities: windowData }); }
        catch (e) { console.error('Ошибка при обновлении графика активности веб-сайтов:', e); }

        // Обновление данных по активности мыши
        try { updateMouseActivityChart(mouseData); }
        catch (e) { console.error('Ошибка при обновлении графика активности мыши:', e); }

        try { updateMouseActivityTable(mouseData); }
        catch (e) { console.error('Ошибка при обновлении таблицы активности мыши:', e); }

        // Обновление скриншотов
        try { updateScreenshots(screenshotsData); }
        catch (e) { console.error('Ошибка при обновлении скриншотов:', e); }

        // Обновляем временную шкалу с новыми данными
        // try { updateTimeScale(dateFilter.value, mergedActivities, selectedPeriod); }
        // catch (e) { console.error('Ошибка при обновлении временной шкалы:', e); }

        // После загрузки всех данных попробуем обновить метрики из данных таблицы
        // try { setTimeout(updateMetricsFromTableData, 1000); } // Даем время на обновление таблицы
        // catch (e) { console.error('Ошибка при обновлении метрик из таблицы:', e); }

        // НОВОЕ: Обновляем основные метрики в шапке на базе всех данных
        try { updateMainMetrics(windowData); }
        catch (e) { console.error('Ошибка при обновлении основных метрик:', e); }

        // Сохраняем данные для повторного использования при переключении вкладок
        window.lastLoadedData = {
            activities: windowData,
            mouse: mouseData,
            screenshots: screenshotsData,
            monitoring: monitoringData,
            browser_activity: browserData
        };

        showLoading(false);
        return data;
    } catch (error) {
        console.error('Ошибка загрузки данных:', error);
        showError('Не удалось загрузить данные. Пожалуйста, попробуйте позже.');
        showLoading(false);
        return null;
    }
}

// Функция для обновления отображения периода в UI
function updatePeriodDisplay(startDate, endDate, periodType) {
    // Обновляем заголовки метрик с информацией о периоде
    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);

    // Форматируем даты
    const formattedStartDate = formatDate(startDateObj);
    const formattedEndDate = formatDate(endDateObj);

    // Получаем все подзаголовки метрик, которые должны отображать период
    const metricSubtitles = document.querySelectorAll('.metric-subtitle');
    metricSubtitles.forEach(subtitle => {
        // Проверяем, что это элемент для отображения периода
        if (subtitle.textContent.toLowerCase().includes('за период') ||
            subtitle.textContent.toLowerCase().includes('от общего') ||
            subtitle.textContent === 'Средний балл продуктивности' ||
            subtitle.textContent === 'Общая продолжительность') {

            if (periodType === 'day') {
                subtitle.textContent = subtitle.textContent.replace(/За период.*$/i, `За ${formattedEndDate}`);
            } else {
                subtitle.textContent = subtitle.textContent.replace(/За период.*$/i, `За период ${formattedStartDate} - ${formattedEndDate}`);
            }
        }
    });
}

// Глобальные переменные для кэширования последних данных временной шкалы
/* let lastTimeScaleData = {
    date: null,
    activities: [],
    period: 'day'
}; */

// Функция для обновления временной шкалы с учетом периода
function updateTimeScale(dateStr, activityData, periodType) {
    const dateDisplay = document.querySelector('.date-display');
    const timeScaleRuler = document.querySelector('.time-scale-ruler');

    if (!dateDisplay || !timeScaleRuler) return;

    // Проверка на пустые данные - используем lastTimeScaleData если данных нет
    if (!activityData || activityData.length === 0) {
        console.log('Нет данных активности для временной шкалы, проверяем кеш...');
        if (lastTimeScaleData && lastTimeScaleData.date === dateStr && lastTimeScaleData.activities.length > 0) {
            console.log('Используем кешированные данные для временной шкалы:', lastTimeScaleData.date);
            activityData = lastTimeScaleData.activities;
            periodType = periodType || lastTimeScaleData.period;
        } else {
            console.warn('Нет данных для временной шкалы и нет в кеше');
        }
    } else {
        // Сохраняем данные для последующего использования
        lastTimeScaleData = {
            date: dateStr,
            activities: activityData,
            period: periodType || 'day'
        };
        console.log('Сохранены данные для временной шкалы:', dateStr, periodType || 'day');
    }

    // Получаем выбранную дату
    const date = new Date(dateStr);

    // Формируем текст с указанием периода
    let displayText = '';
    if (periodType === 'day') {
        displayText = date.toLocaleDateString('ru-RU', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long'
        });
    } else if (periodType === 'week') {
        const startDate = new Date(date);
        startDate.setDate(startDate.getDate() - 6);
        displayText = `Неделя: ${startDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })} - ${date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}`;
    } else if (periodType === 'month') {
        const startDate = new Date(date);
        startDate.setMonth(startDate.getMonth() - 1);
        displayText = `Месяц: ${startDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })} - ${date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}`;
    }

    dateDisplay.textContent = displayText;

    // Удаляем существующие маркеры активности только если есть новые данные
    if (activityData && activityData.length > 0) {
        const activityMarkers = timeScaleRuler.querySelectorAll('.activity-marker');
        activityMarkers.forEach(marker => marker.remove());
    } else {
        console.log('Пропускаем удаление маркеров, так как нет новых данных');
        return; // Выходим, чтобы не удалять существующие маркеры, если нет новых данных
    }

    // Обновляем маркер текущего времени
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentPosition = ((currentHour + currentMinute / 60) / 24) * 100;

    let currentTimeMarker = timeScaleRuler.querySelector('.current-time-marker');

    // Показываем маркер текущего времени только для сегодняшней даты и если период день
    if (dateStr === today && periodType === 'day') {
        if (!currentTimeMarker) {
            currentTimeMarker = document.createElement('div');
            currentTimeMarker.className = 'current-time-marker';
            timeScaleRuler.appendChild(currentTimeMarker);
        }
        currentTimeMarker.style.left = `${currentPosition}%`;
        currentTimeMarker.style.display = 'block';
    } else if (currentTimeMarker) {
        currentTimeMarker.style.display = 'none';
    }

    // Если данные активности предоставлены, добавляем маркеры на шкалу
    if (activityData && activityData.length > 0) {
        // Берем данные только за выбранную дату для периода "день"
        let filteredActivities = activityData;
        if (periodType === 'day') {
            filteredActivities = activityData.filter(activity => {
                const activityDate = new Date(activity.timestamp).toISOString().split('T')[0];
                return activityDate === dateStr;
            });
        }

        // Добавляем маркеры активности
        filteredActivities.forEach(activity => {
            if (!activity.timestamp) return;

            const activityTime = new Date(activity.timestamp);
            const hour = activityTime.getHours();
            const minute = activityTime.getMinutes();
            const position = ((hour + minute / 60) / 24) * 100;

            // Определяем продолжительность активности
            let durationMinutes = activity.duration ? Math.round(activity.duration / 60) : 1;

            // Минимальная ширина для видимости
            const width = Math.max(0.2, (durationMinutes / 1440) * 100);

            // Создаем маркер активности
            const activityMarker = document.createElement('div');
            activityMarker.className = 'activity-marker';
            activityMarker.style.left = `${position}%`;
            activityMarker.style.width = `${width}%`;
            activityMarker.textContent = activity.app_name ?
                `${activity.app_name.substring(0, 15)}` :
                (activity.window_title ? `${activity.window_title.substring(0, 15)}` : 'Активность');

            const timestamp = new Date(activity.timestamp).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
            const duration = durationMinutes > 0 ? `${durationMinutes}м` : '< 1м';
            activityMarker.title = `${timestamp} - ${activity.app_name || ''} - ${activity.window_title || ''} (${duration})`;

            // Добавляем маркер на шкалу
            timeScaleRuler.appendChild(activityMarker);
        });
    } else {
        // Если загружена таблица активностей, добавляем маркеры на шкале (альтернативный источник данных)
        const activitiesTable = document.getElementById('timeline-table');
        if (activitiesTable) {
            const rows = activitiesTable.querySelectorAll('tbody tr');
            rows.forEach(row => {
                const cells = row.querySelectorAll('td');
                if (cells.length >= 5) {
                    const timeText = cells[0].textContent;
                    const appName = cells[1].textContent;
                    const windowTitle = cells[2].textContent;
                    const durationText = cells[4].textContent;

                    // Парсим время и продолжительность
                    const timeParts = timeText.split(':');
                    if (timeParts.length === 2) {
                        const hour = parseInt(timeParts[0]);
                        const minute = parseInt(timeParts[1]);
                        const position = ((hour + minute / 60) / 24) * 100;

                        // Парсим продолжительность для определения ширины маркера
                        let durationMinutes = 0;
                        if (durationText.includes('м')) {
                            durationMinutes = parseInt(durationText.replace('м', ''));
                        }

                        // Минимальная ширина для видимости
                        const width = Math.max(0.2, (durationMinutes / 1440) * 100);

                        // Создаем маркер активности
                        const activityMarker = document.createElement('div');
                        activityMarker.className = 'activity-marker';
                        activityMarker.style.left = `${position}%`;
                        activityMarker.style.width = `${width}%`;
                        activityMarker.textContent = `${appName} - ${windowTitle.substring(0, 30)}`;
                        activityMarker.title = `${timeText} - ${appName} - ${windowTitle} (${durationText})`;

                        // Добавляем маркер на шкалу
                        timeScaleRuler.appendChild(activityMarker);
                    }
                }
            });
        }
    }
}

// Вспомогательные функции
function showLoading(isLoading) {
    // Здесь можно добавить анимацию загрузки
    // Например, отобразить/скрыть спиннер
    const buttons = document.querySelectorAll('button');
    buttons.forEach(button => {
        button.disabled = isLoading;
    });
}

function showError(message) {
    // Фильтрация сообщений об ошибке HTTP 404 или ошибках табеля
    if (message && (message.includes('HTTP error') ||
        message.includes('status: 404') ||
        message.includes('Не удалось загрузить данные табеля'))) {
        // Просто логируем ошибку, но не показываем пользователю
        console.warn('Отфильтрованное сообщение об ошибке:', message);
        return;
    }

    console.error(message);

    // Проверяем наличие элемента для отображения ошибок
    let errorContainer = document.getElementById('error-container');

    if (!errorContainer) {
        // Если элемента нет, создаем его
        errorContainer = document.createElement('div');
        errorContainer.id = 'error-container';
        errorContainer.className = 'alert alert-danger alert-dismissible fade show fixed-top mx-auto mt-3';
        errorContainer.style.maxWidth = '500px';
        errorContainer.style.zIndex = '9999';
        errorContainer.innerHTML = `
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Закрыть"></button>
            <div class="error-message">
                <i class="bi bi-exclamation-triangle-fill me-2"></i>
                ${message}
            </div>
        `;

        // Добавляем элемент в DOM
        document.body.appendChild(errorContainer);

        // Удаляем элемент через 5 секунд
        setTimeout(() => {
            if (errorContainer.parentNode) {
                errorContainer.parentNode.removeChild(errorContainer);
            }
        }, 5000);
    } else {
        // Если элемент существует, обновляем его содержимое
        errorContainer.querySelector('.error-message').innerHTML = `
            <i class="bi bi-exclamation-triangle-fill me-2"></i>
            ${message}
        `;

        // Сбрасываем таймер удаления
        clearTimeout(errorContainer.dataset.timeout);

        // Устанавливаем новый таймер
        errorContainer.dataset.timeout = setTimeout(() => {
            if (errorContainer.parentNode) {
                errorContainer.parentNode.removeChild(errorContainer);
            }
        }, 5000);
    }
}

// Функция обновления данных (для кнопки "Обновить")
function refreshData() {
    // Очищаем кэш перед обновлением
    clearSessionCache();

    // Обновляем интерфейс
    const refreshButton = document.querySelector('button[onclick="refreshData()"]');
    if (refreshButton) {
        const originalText = refreshButton.innerHTML;
        refreshButton.innerHTML = '<i class="bi bi-arrow-repeat"></i> Загрузка...';
        refreshButton.disabled = true;

        // Загружаем данные
        loadDashboardData().finally(() => {
            // Восстанавливаем состояние кнопки
            refreshButton.innerHTML = originalText;
            refreshButton.disabled = false;
        });
    } else {
        loadDashboardData();
    }
}

// Функция для очистки кэша данных
function clearSessionCache() {
    if (window.sessionData) {
        delete window.sessionData;
    }
}

// УДАЛЕНЫ ДУБЛИРУЮЩИЕ ФУНКЦИИ ТАБЕЛЯ:
// - async function loadTimesheet() - функция загрузки табеля
// - function renderTimesheet(data, startDate, endDate) - функция отображения табеля
// - function renderAlternativeTimesheet(data, startDate, endDate) - альтернативный рендеринг
//
// Вся функциональность табеля теперь находится в dashboard-timesheet.js
// Эти функции были удалены чтобы избежать конфликтов и дублирования кода

// Функция для загрузки хронологии дня
async function loadChronology() {
    const chronologyDate = document.getElementById('chronology-date').value;

    if (!chronologyDate) {
        alert("Выберите дату для отображения хронологии");
        return;
    }

    try {
        showLoading(true);

        // Формируем параметры запроса
        const params = new URLSearchParams();
        params.append('start_date', chronologyDate);
        params.append('end_date', chronologyDate);

        // Получаем фильтры из DOM
        const deviceFilter = document.getElementById('device-filter');
        const employeeFilter = document.getElementById('employee-filter');

        // Добавляем device_id если выбран
        if (deviceFilter && deviceFilter.value) {
            params.append('device_id', deviceFilter.value);
        }

        // Добавляем employee_id если выбран
        if (employeeFilter && employeeFilter.value) {
            params.append('employee_id', employeeFilter.value);
        }

        console.log(`Загружаем хронологию за дату: ${chronologyDate} с параметрами:`, params.toString());

        const apiUrl = `/api/public/activity/windows?${params.toString()}`;
        console.log(`🌐 Полный URL запроса: ${apiUrl}`);

        const windowResponse = await fetch(apiUrl);
        if (!windowResponse.ok) {
            throw new Error(`HTTP error! status: ${windowResponse.status}`);
        }

        const windowData = await windowResponse.json();
        console.log('Данные хронологии окон:', windowData);

        // Применяем клиентскую фильтрацию по сотруднику и устройству
        const filters = getCurrentFilters();
        let filteredByEmployee = filterDataByEmployee(windowData, filters.employeeId, filters.deviceId);
        console.log('Данные хронологии окон после фильтрации по сотруднику:', filteredByEmployee);

        // Проверяем, что данные соответствуют выбранной дате
        console.log(`🔍 Фильтруем данные для даты: ${chronologyDate}`);

        // Анализируем доступные даты в данных
        const availableDates = new Set();
        filteredByEmployee.forEach(item => {
            if (item.timestamp) {
                const itemDate = new Date(item.timestamp).toISOString().split('T')[0];
                availableDates.add(itemDate);
            }
        });
        console.log('📅 Доступные даты в данных:', Array.from(availableDates).sort());

        const filteredData = filteredByEmployee.filter(item => {
            if (!item.timestamp) return false;

            // Используем локальную дату для корректного сравнения
            const itemDate = new Date(item.timestamp);
            const localItemDate = new Date(itemDate.getTime() - itemDate.getTimezoneOffset() * 60000)
                .toISOString().split('T')[0];

            const matches = localItemDate === chronologyDate;

            if (matches) {
                console.log(`✅ Найдена запись за ${chronologyDate}:`, {
                    timestamp: item.timestamp,
                    localDate: localItemDate,
                    app_name: item.app_name
                });
            }

            return matches;
        });

        console.log(`🎯 Найдено записей за ${chronologyDate}: ${filteredData.length}`);

        if (filteredData.length === 0) {
            console.warn(`⚠️ Нет данных за выбранную дату ${chronologyDate}`);
            console.log('💡 Попробуйте выбрать одну из доступных дат:', Array.from(availableDates).sort());

            document.getElementById('chronology-table').querySelector('tbody').innerHTML =
                `<tr><td colspan="5" class="text-center">
                    Нет данных за выбранную дату ${chronologyDate}<br>
                    <small class="text-muted">Доступные даты: ${Array.from(availableDates).sort().join(', ')}</small>
                </td></tr>`;

            // Очищаем другие таблицы
            document.getElementById('chronology-websites-table').querySelector('tbody').innerHTML =
                `<tr><td colspan="4" class="text-center">Нет данных за выбранную дату</td></tr>`;
            document.getElementById('folders-activity-table').querySelector('tbody').innerHTML =
                `<tr><td colspan="3" class="text-center">Нет данных за выбранную дату</td></tr>`;
            document.getElementById('programs-activity-table').querySelector('tbody').innerHTML =
                `<tr><td colspan="3" class="text-center">Нет данных за выбранную дату</td></tr>`;

            showLoading(false);
            return;
        }

        // Сохраняем данные в глобальную переменную для использования при сортировке
        window.chronologyData = filteredData;

        // Обновление таблицы хронологии с учетом текущей сортировки
        const sortSelect = document.getElementById('chronology-sort');
        const sortOrder = sortSelect ? sortSelect.value : 'desc';
        updateChronologyTable(filteredData, sortOrder);

        // Подготовка данных для активности в папках и программах
        const folderActivity = processFolderActivity(filteredData);
        const programActivity = processProgramActivity(filteredData);

        // Обновление таблиц активности
        updateFoldersActivityTable(folderActivity);
        updateProgramsActivityTable(programActivity);

        // Загрузка данных о посещенных сайтах
        try {
            const websiteResponse = await fetch(`/api/public/activity/website_visits?${params.toString()}`);
            if (websiteResponse.ok) {
                const websiteData = await websiteResponse.json();
                console.log('Данные о посещенных сайтах:', websiteData);

                // Применяем клиентскую фильтрацию по сотруднику и устройству
                const filters = getCurrentFilters();
                let filteredWebsiteByEmployee = filterDataByEmployee(websiteData, filters.employeeId, filters.deviceId);
                console.log('Данные о посещенных сайтах после фильтрации по сотруднику:', filteredWebsiteByEmployee);

                // Фильтруем данные по выбранной дате
                console.log(`🔍 Фильтруем данные веб-сайтов для даты: ${chronologyDate}`);

                const filteredWebsiteData = filteredWebsiteByEmployee.filter(item => {
                    if (!item.timestamp) return false;

                    // Используем локальную дату для корректного сравнения
                    const itemDate = new Date(item.timestamp);
                    const localItemDate = new Date(itemDate.getTime() - itemDate.getTimezoneOffset() * 60000)
                        .toISOString().split('T')[0];

                    return localItemDate === chronologyDate;
                });

                console.log(`🌐 Найдено записей веб-сайтов за ${chronologyDate}: ${filteredWebsiteData.length}`);

                // Сохраняем для возможной сортировки позже
                window.chronologyWebsiteData = filteredWebsiteData;

                // Обновляем таблицу посещенных сайтов
                updateChronologyWebsitesTable(filteredWebsiteData, sortOrder);
            } else {
                console.error(`HTTP error ${websiteResponse.status}: ${await websiteResponse.text()}`);
                updateChronologyWebsitesTable([], sortOrder);
            }
        } catch (websiteError) {
            console.error('Ошибка при загрузке данных о посещенных сайтах:', websiteError);
            updateChronologyWebsitesTable([], sortOrder);
        }

        showLoading(false);
    } catch (error) {
        console.error('Ошибка загрузки хронологии:', error);
        showError('Не удалось загрузить данные хронологии. Пожалуйста, попробуйте позже.');
        showLoading(false);
    }
}

// Функция для обновления таблицы хронологии дня
function updateChronologyTable(chronologyData, sortOrder = 'desc') {
    console.log('Обновляем таблицу хронологии с данными:', chronologyData);

    // Проверяем наличие данных
    if (!chronologyData || chronologyData.length === 0) {
        document.getElementById('chronology-table').querySelector('tbody').innerHTML =
            '<tr><td colspan="4" class="text-center">Нет данных за выбранную дату</td></tr>';
        return;
    }

    // Сортируем данные по временной метке
    chronologyData.sort((a, b) => {
        const dateA = new Date(a.timestamp);
        const dateB = new Date(b.timestamp);
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });

    // Группируем события по временным периодам с более точной логикой
    const MAX_GAP_SECONDS = 180; // 3 минуты максимальный разрыв для группировки
    const activityGroups = [];
    let currentGroup = null;

    // Сортируем все события по времени в порядке возрастания для группировки
    const sortedEvents = [...chronologyData].sort((a, b) => {
        return new Date(a.timestamp) - new Date(b.timestamp);
    });

    sortedEvents.forEach((event, index) => {
        const eventDate = new Date(event.timestamp);
        const eventDuration = event.duration || 60; // Минимальная длительность 1 минута
        const eventEndDate = new Date(eventDate.getTime() + eventDuration * 1000);

        // Если это первое событие
        if (!currentGroup || index === 0) {
            currentGroup = {
                startTime: eventDate,
                endTime: eventEndDate,
                events: [event],
                isActive: !isBreakActivity(event)
            };
            activityGroups.push(currentGroup);
        } else {
            const prevEvent = sortedEvents[index - 1];
            const prevDuration = prevEvent.duration || 60;
            const prevEndDate = new Date(new Date(prevEvent.timestamp).getTime() + prevDuration * 1000);
            const timeDiff = (eventDate - prevEndDate) / 1000;

            // Если разрыв меньше MAX_GAP_SECONDS, добавляем в текущую группу
            if (timeDiff <= MAX_GAP_SECONDS && timeDiff >= -30) { // Допускаем небольшое пересечение
                currentGroup.events.push(event);
                // Обновляем время окончания группы
                if (eventEndDate > currentGroup.endTime) {
                    currentGroup.endTime = eventEndDate;
                }
                // Если хотя бы одно событие активно, вся группа считается активной
                if (!isBreakActivity(event)) {
                    currentGroup.isActive = true;
                }
            } else if (timeDiff > MAX_GAP_SECONDS) {
                // Если есть значительный разрыв, добавляем период неактивности
                if (timeDiff > 300) { // Только если разрыв больше 5 минут
                    const inactiveGroup = {
                        startTime: prevEndDate,
                        endTime: eventDate,
                        events: [{
                            timestamp: prevEndDate.toISOString(),
                            duration: Math.floor(timeDiff),
                            app_name: "Неактивное время",
                            window_title: `Перерыв в активности (${Math.floor(timeDiff / 60)} мин)`,
                            is_productive: false
                        }],
                        isActive: false
                    };
                    activityGroups.push(inactiveGroup);
                }

                // Создаем новую группу
                currentGroup = {
                    startTime: eventDate,
                    endTime: eventEndDate,
                    events: [event],
                    isActive: !isBreakActivity(event)
                };
                activityGroups.push(currentGroup);
            } else {
                // Небольшое пересечение - просто добавляем к текущей группе
                currentGroup.events.push(event);
                if (eventEndDate > currentGroup.endTime) {
                    currentGroup.endTime = eventEndDate;
                }
                if (!isBreakActivity(event)) {
                    currentGroup.isActive = true;
                }
            }
        }
    });

    // Группируем периоды активности по часам для отображения
    const groupsByHour = {};
    activityGroups.forEach(group => {
        const hour = group.startTime.getHours();
        if (!groupsByHour[hour]) {
            groupsByHour[hour] = [];
        }
        groupsByHour[hour].push(group);
    });

    // Обновляем таблицу
    const tbody = document.getElementById('chronology-table').querySelector('tbody');
    tbody.innerHTML = '';

    // Получаем часы в порядке сортировки
    const hours = Object.keys(groupsByHour).map(Number);
    if (sortOrder === 'desc') {
        hours.sort((a, b) => b - a);
    } else {
        hours.sort((a, b) => a - b);
    }

    // Добавляем строки для каждого часа
    hours.forEach((hour, hourIndex) => {
        const groups = groupsByHour[hour];

        // Находим реальный временной диапазон для часа
        let hourStartTime = null;
        let hourEndTime = null;
        groups.forEach(group => {
            if (!hourStartTime || group.startTime < hourStartTime) {
                hourStartTime = group.startTime;
            }
            if (!hourEndTime || group.endTime > hourEndTime) {
                hourEndTime = group.endTime;
            }
        });

        // Форматируем заголовок часа с реальным временным диапазоном
        const startTimeStr = `${hourStartTime.getHours().toString().padStart(2, '0')}:${hourStartTime.getMinutes().toString().padStart(2, '0')}`;
        const endTimeStr = `${hourEndTime.getHours().toString().padStart(2, '0')}:${hourEndTime.getMinutes().toString().padStart(2, '0')}`;
        const hourRange = `${startTimeStr} - ${endTimeStr}`;

        // Подсчитываем общее количество событий в часе
        let totalEvents = 0;
        groups.forEach(group => {
            totalEvents += group.events.length;
        });

        // Создаем строку заголовка часа
        const hourRow = document.createElement('tr');
        hourRow.className = 'hour-header';
        hourRow.dataset.hour = hour;
        hourRow.dataset.hourIndex = hourIndex;

        hourRow.innerHTML = `
            <td colspan="4">
                <i class="bi bi-chevron-down collapse-icon"></i>
                <span class="badge bg-secondary">${hourRange}</span>
                <span class="badge bg-primary ms-2">${groups.length} ${groups.length === 1 ? 'период' : groups.length < 5 ? 'периода' : 'периодов'}</span>
                <span class="badge bg-info ms-2">${totalEvents} ${totalEvents === 1 ? 'событие' : totalEvents < 5 ? 'события' : 'событий'}</span>
            </td>
        `;

        // Добавляем обработчик для сворачивания/разворачивания часа
        hourRow.addEventListener('click', function () {
            const hourNum = this.dataset.hour;
            const hourIdx = this.dataset.hourIndex;
            const hourRows = tbody.querySelectorAll(`[data-parent-hour="${hourNum}-${hourIdx}"]`);
            const isCollapsed = this.classList.contains('collapsed');

            if (isCollapsed) {
                this.classList.remove('collapsed');
                hourRows.forEach(row => row.style.display = '');
            } else {
                this.classList.add('collapsed');
                hourRows.forEach(row => row.style.display = 'none');
            }
        });

        tbody.appendChild(hourRow);

        // Сортируем группы внутри часа
        let hourGroups = [...groups];
        if (sortOrder === 'desc') {
            hourGroups.sort((a, b) => b.startTime - a.startTime);
        } else {
            hourGroups.sort((a, b) => a.startTime - b.startTime);
        }

        // Добавляем группы активностей
        hourGroups.forEach((group, groupIndex) => {
            const startTime = group.startTime;
            const endTime = group.endTime;

            // Форматируем время с секундами
            const startTimeStr = `${startTime.getHours().toString().padStart(2, '0')}:${startTime.getMinutes().toString().padStart(2, '0')}:${startTime.getSeconds().toString().padStart(2, '0')}`;
            const endTimeStr = `${endTime.getHours().toString().padStart(2, '0')}:${endTime.getMinutes().toString().padStart(2, '0')}:${endTime.getSeconds().toString().padStart(2, '0')}`;

            // Рассчитываем длительность группы
            const durationMs = endTime - startTime;
            const durationSeconds = Math.floor(durationMs / 1000);
            let durationStr;

            if (durationSeconds < 60) {
                durationStr = `${durationSeconds} сек`;
            } else if (durationSeconds < 3600) {
                const minutes = Math.floor(durationSeconds / 60);
                const seconds = durationSeconds % 60;
                durationStr = `${minutes} мин${seconds > 0 ? ` ${seconds} сек` : ''}`;
            } else {
                const hours = Math.floor(durationSeconds / 3600);
                const minutes = Math.floor((durationSeconds % 3600) / 60);
                durationStr = `${hours} ч${minutes > 0 ? ` ${minutes} мин` : ''}`;
            }

            // Создаем строку заголовка группы
            const groupRow = document.createElement('tr');
            groupRow.className = `activity-group ${group.isActive ? 'active-period' : 'inactive-period'}`;
            groupRow.dataset.parentHour = `${hour}-${hourIndex}`;
            groupRow.dataset.groupIndex = groupIndex;

            const statusBadge = group.isActive ?
                '<span class="badge bg-success ms-2">Активность</span>' :
                '<span class="badge bg-secondary ms-2">Неактивное время</span>';

            groupRow.innerHTML = `
                <td colspan="4" class="activity-group-header">
                    <div>
                        <span class="time-badge">${startTimeStr} - ${endTimeStr}</span>
                        <span class="duration-badge">(${durationStr})</span>
                        <span class="events-badge">(${group.events.length} ${group.events.length === 1 ? 'событие' : group.events.length < 5 ? 'события' : 'событий'})</span>
                    </div>
                    <div>
                        ${statusBadge}
                        <i class="bi bi-chevron-down ms-2"></i>
                    </div>
                </td>
            `;

            // Добавляем обработчик для сворачивания/разворачивания группы
            groupRow.addEventListener('click', function (e) {
                e.stopPropagation();
                const hourNum = this.dataset.parentHour;
                const groupIdx = this.dataset.groupIndex;
                const eventRows = tbody.querySelectorAll(`[data-parent-group="${hourNum}-${groupIdx}"]`);
                const icon = this.querySelector('.bi-chevron-down, .bi-chevron-right');
                const isCollapsed = this.classList.contains('group-collapsed');

                if (isCollapsed) {
                    this.classList.remove('group-collapsed');
                    eventRows.forEach(row => row.style.display = '');
                    if (icon) {
                        icon.classList.remove('bi-chevron-right');
                        icon.classList.add('bi-chevron-down');
                    }
                } else {
                    this.classList.add('group-collapsed');
                    eventRows.forEach(row => row.style.display = 'none');
                    if (icon) {
                        icon.classList.remove('bi-chevron-down');
                        icon.classList.add('bi-chevron-right');
                    }
                }
            });

            tbody.appendChild(groupRow);

            // Добавляем события группы
            group.events.forEach((event, eventIndex) => {
                const eventDate = new Date(event.timestamp);
                const timeStr = `${eventDate.getHours().toString().padStart(2, '0')}:${eventDate.getMinutes().toString().padStart(2, '0')}:${eventDate.getSeconds().toString().padStart(2, '0')}`;

                // Определяем продолжительность события
                let durationStr = '-';
                if (event.duration) {
                    const duration = Math.floor(event.duration);
                    if (duration < 60) {
                        durationStr = `${duration} сек`;
                    } else if (duration < 3600) {
                        const mins = Math.floor(duration / 60);
                        const secs = duration % 60;
                        durationStr = `${mins} мин${secs > 0 ? ` ${secs} сек` : ''}`;
                    } else {
                        const hours = Math.floor(duration / 3600);
                        const mins = Math.floor((duration % 3600) / 60);
                        durationStr = `${hours} ч${mins > 0 ? ` ${mins} мин` : ''}`;
                    }
                }

                // Определяем конечное время события, если есть duration
                let endTimeStr = '';
                if (event.duration) {
                    const endTime = new Date(eventDate.getTime() + (Math.floor(event.duration) * 1000));
                    endTimeStr = `${endTime.getHours().toString().padStart(2, '0')}:${endTime.getMinutes().toString().padStart(2, '0')}:${endTime.getSeconds().toString().padStart(2, '0')}`;
                }

                // Определяем класс продуктивности
                const isBreak = isBreakActivity(event);
                const productivityClass = isBreak ? 'text-muted' :
                    (event.is_productive ? 'text-success' :
                        (event.is_productive === false ? 'text-danger' : ''));

                // Создаем строку события
                const eventRow = document.createElement('tr');
                eventRow.className = `activity-group-content ${productivityClass}`;
                eventRow.dataset.parentGroup = `${hour}-${hourIndex}-${groupIndex}`;

                // Формируем ячейку времени с учетом начала и конца
                let timeCell = `<strong>${timeStr}</strong>`;
                if (endTimeStr && endTimeStr !== timeStr) {
                    timeCell += `<br><small class="text-muted">до ${endTimeStr}</small>`;
                }

                // Обрезаем длинные названия, но оставляем достаточно места
                const appName = event.app_name || 'Неизвестно';
                const windowTitle = event.window_title || 'Без названия';

                eventRow.innerHTML = `
                    <td>${timeCell}</td>
                    <td title="${appName}">${appName}</td>
                    <td title="${windowTitle}">${windowTitle}</td>
                    <td><strong>${durationStr}</strong></td>
                `;

                // По умолчанию скрываем события, если в группе больше 3 событий
                if (group.events.length > 3) {
                    eventRow.style.display = 'none';
                    groupRow.classList.add('group-collapsed');
                    const icon = groupRow.querySelector('.bi-chevron-down');
                    if (icon) {
                        icon.classList.remove('bi-chevron-down');
                        icon.classList.add('bi-chevron-right');
                    }
                }

                tbody.appendChild(eventRow);
            });
        });
    });
}

// Функция для определения, является ли активность перерывом
function isBreakActivity(activity) {
    if (!activity) return false;

    const title = (activity.window_title || '').toLowerCase();
    const appName = (activity.app_name || '').toLowerCase();

    const breakKeywords = [
        'idle', 'заблокирован', 'locked', 'screensaver', 'screen saver',
        'блокировка', 'lock screen', 'заставка', 'перерыв', 'break'
    ];

    return breakKeywords.some(keyword => title.includes(keyword) || appName.includes(keyword));
}

// Функция обработки данных о папках
function processFolderActivity(windowData) {
    const folderStats = {};

    windowData.forEach(item => {
        const windowTitle = item.window_title || '';
        // Ищем пути к папкам в заголовках окон
        const folderMatch = windowTitle.match(/([A-Z]:\\[^"<>|?*]+)/i);
        if (folderMatch) {
            const folderPath = folderMatch[1];
            if (!folderStats[folderPath]) {
                folderStats[folderPath] = {
                    folder_path: folderPath,
                    duration: 0,
                    visits: 0
                };
            }
            folderStats[folderPath].duration += item.duration || 0;
            folderStats[folderPath].visits += 1;
        }
    });

    return Object.values(folderStats);
}

// Функция обработки данных о программах
function processProgramActivity(windowData) {
    const programStats = {};

    windowData.forEach(item => {
        const appName = item.app_name || 'Неизвестно';
        if (!programStats[appName]) {
            programStats[appName] = {
                app_name: appName,
                duration: 0,
                launches: 0
            };
        }
        programStats[appName].duration += item.duration || 0;
        // Подсчитываем запуски как уникальные окна программы
        programStats[appName].launches += 1;
    });

    return Object.values(programStats);
}

// Функция для обновления таблицы активности в папках
function updateFoldersActivityTable(foldersData) {
    const tbody = document.querySelector('#folders-activity-table tbody');
    if (!tbody) {
        console.error('Не найден элемент таблицы активности в папках');
        return;
    }

    tbody.innerHTML = '';

    if (!foldersData || foldersData.length === 0) {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td colspan="3" class="text-center">Нет данных об активности в папках за выбранную дату</td>`;
        tbody.appendChild(tr);
        return;
    }

    // Сортируем папки по времени активности (от большего к меньшему)
    const sortedFolders = [...foldersData].sort((a, b) => b.duration - a.duration);

    sortedFolders.forEach(folder => {
        const tr = document.createElement('tr');
        const duration = formatDuration(folder.duration);

        tr.innerHTML = `
            <td>${folder.folder_path || '-'}</td>
            <td>${duration}</td>
            <td>${folder.visits || 0}</td>
        `;
        tbody.appendChild(tr);
    });
}

// Функция для обновления таблицы активности программ
function updateProgramsActivityTable(programsData) {
    const tbody = document.querySelector('#programs-activity-table tbody');
    if (!tbody) {
        console.error('Не найден элемент таблицы активности программ');
        return;
    }

    tbody.innerHTML = '';

    if (!programsData || programsData.length === 0) {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td colspan="3" class="text-center">Нет данных об активности программ за выбранную дату</td>`;
        tbody.appendChild(tr);
        return;
    }

    // Сортируем программы по времени активности (от большего к меньшему)
    const sortedPrograms = [...programsData].sort((a, b) => b.duration - a.duration);

    sortedPrograms.forEach(program => {
        const tr = document.createElement('tr');
        const duration = formatDuration(program.duration);

        // Определяем продуктивность программы для цветовой индикации
        const productivity = getProductivityScore({ app_name: program.app_name });
        let rowClass = '';

        if (productivity >= 0.7) {
            rowClass = 'table-success';
        } else if (productivity <= 0.3) {
            rowClass = 'table-danger';
        } else {
            rowClass = 'table-warning';
        }

        tr.className = rowClass;
        tr.innerHTML = `
            <td>${program.app_name || '-'}</td>
            <td>${duration}</td>
            <td>${program.launches || 0}</td>
        `;
        tbody.appendChild(tr);
    });
}

// Функция для включения автоматического обновления данных
function setupAutoRefresh(intervalSeconds = 60) {
    let autoRefreshInterval = null;
    const autoRefreshToggle = document.getElementById('auto-refresh-toggle');

    // Если на странице есть переключатель автообновления
    if (autoRefreshToggle) {
        autoRefreshToggle.addEventListener('change', function () {
            if (this.checked) {
                startAutoRefresh();
                localStorage.setItem('dashboardAutoRefresh', 'enabled');
            } else {
                stopAutoRefresh();
                localStorage.setItem('dashboardAutoRefresh', 'disabled');
            }
        });

        // Восстанавливаем сохраненное состояние
        const savedState = localStorage.getItem('dashboardAutoRefresh');
        if (savedState === 'enabled') {
            autoRefreshToggle.checked = true;
            startAutoRefresh();
        }
    } else {
        // Если переключателя нет, просто запускаем автообновление
        startAutoRefresh();
    }

    function startAutoRefresh() {
        if (autoRefreshInterval) {
            clearInterval(autoRefreshInterval);
        }

        autoRefreshInterval = setInterval(() => {
            console.log('Автоматическое обновление данных...');
            loadDashboardData().then(data => {
                console.log('Данные обновлены автоматически');
            }).catch(error => {
                console.error('Ошибка при автоматическом обновлении:', error);
            });
        }, intervalSeconds * 1000);

        console.log(`Автообновление данных включено (интервал: ${intervalSeconds} сек)`);
    }

    function stopAutoRefresh() {
        if (autoRefreshInterval) {
            clearInterval(autoRefreshInterval);
            autoRefreshInterval = null;
            console.log('Автообновление данных отключено');
        }
    }

    // Останавливаем обновление при уходе со страницы
    window.addEventListener('beforeunload', function () {
        stopAutoRefresh();
    });

    return {
        start: startAutoRefresh,
        stop: stopAutoRefresh
    };
}

// Функция инициализации табеля активности
function initActivityTimesheet() {
    // Инициализация полей выбора дат
    const activityStartDate = document.getElementById('activity-start-date');
    const activityEndDate = document.getElementById('activity-end-date');

    if (activityStartDate && activityEndDate) {
        const today = new Date();
        const lastWeek = new Date();
        lastWeek.setDate(today.getDate() - 7);

        activityStartDate.value = lastWeek.toISOString().slice(0, 10);
        activityEndDate.value = today.toISOString().slice(0, 10);
    }

    // Привязка обработчиков событий
    const activityTab = document.getElementById('activity-timesheet-tab');
    if (activityTab) {
        activityTab.addEventListener('shown.bs.tab', function () {
            // При первом открытии вкладки загружаем данные
            if (!window.activityTimesheetLoaded) {
                loadActivityTimesheet();
                window.activityTimesheetLoaded = true;
            }
        });
    }

    // Добавляем обработчики для кнопок по ID
    const loadBtn = document.getElementById('load-activity-btn');
    if (loadBtn) {
        loadBtn.addEventListener('click', loadActivityTimesheet);
        console.log('Привязан обработчик к кнопке загрузки табеля');
    } else {
        console.warn('Кнопка загрузки табеля не найдена');
    }

    const exportBtn = document.getElementById('export-activity-btn');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportActivityTimesheetToExcel);
        console.log('Привязан обработчик к кнопке экспорта табеля');
    } else {
        console.warn('Кнопка экспорта табеля не найдена');
    }
}

// Добавляем обработчик для обновления временной шкалы при переключении вкладок
document.addEventListener('DOMContentLoaded', function () {
    // Находим все кнопки навигации по вкладкам
    const tabButtons = document.querySelectorAll('[data-bs-toggle="tab"]');
    if (tabButtons.length > 0) {
        console.log('Найдено кнопок переключения вкладок:', tabButtons.length);

        // Добавляем обработчики для переключения вкладок
        tabButtons.forEach(button => {
            button.addEventListener('shown.bs.tab', function (event) {
                const targetTabId = event.target.getAttribute('href') || event.target.getAttribute('data-bs-target');
                console.log('Переключение на вкладку:', targetTabId);

                // Получаем выбранную дату и период
                const dateFilter = document.getElementById('date-filter');
                const periodFilter = document.getElementById('period-filter');

                if (!dateFilter || !dateFilter.value) return;

                const selectedDate = dateFilter.value;
                const selectedPeriod = periodFilter ? periodFilter.value : 'day';

                // Для вкладки с временной шкалой
                if (targetTabId === '#timeline') {
                    console.log('Активное восстановление данных временной шкалы и метрик');

                    // Принудительно обновляем метрики
                    if (lastValidMetrics && lastValidMetrics.totalTime > 0) {
                        console.log('Восстанавливаем метрики:', lastValidMetrics);
                        displaySavedMetrics();
                    }

                    // Принудительно обновляем временную шкалу
                    /* if (lastTimeScaleData && lastTimeScaleData.date === selectedDate) {
                        console.log('Восстанавливаем временную шкалу:', lastTimeScaleData.date);
                        setTimeout(() => {
                            updateTimeScale(selectedDate, lastTimeScaleData.activities, selectedPeriod);
                        }, 200); // Небольшая задержка для гарантии обновления DOM
                    } */

                    // Если есть сохраненные данные ресурсов, обновляем их тоже
                    if (lastValidResources) {
                        console.log('Восстанавливаем метрики ресурсов');
                        displaySavedResourceMetrics();
                    }
                }

                // Для вкладки с хронологией дня
                if (targetTabId === '#chronology') {
                    console.log('Переключение на вкладку хронологии дня');

                    // Устанавливаем текущую дату в поле выбора даты хронологии, если оно пустое
                    const chronologyDateInput = document.getElementById('chronology-date');
                    if (chronologyDateInput && !chronologyDateInput.value) {
                        chronologyDateInput.value = selectedDate;

                        // Загружаем данные хронологии для выбранной даты
                        if (typeof loadChronology === 'function') {
                            console.log('Автоматическая загрузка хронологии для даты:', selectedDate);
                            setTimeout(() => {
                                loadChronology();
                            }, 200); // Небольшая задержка для гарантии обновления DOM
                        }
                    }
                }

                // Для вкладки браузеров
                if (targetTabId === '#browsers') {
                    console.log('Переключение на вкладку браузеров');

                    // Обновляем чарт браузерной активности
                    if (window.browserActivityManager && window.lastLoadedData) {
                        console.log('Обновляем чарт браузерной активности при переключении вкладки');
                        setTimeout(() => {
                            window.browserActivityManager.updateChart(window.lastLoadedData);
                        }, 200); // Небольшая задержка для гарантии обновления DOM
                    }
                }
            });
        });
    }
});

// После загрузки документа инициализируем автообновление с интервалом 60 секунд
document.addEventListener('DOMContentLoaded', function () {
    try {
        console.log('Инициализация дашборда...');

        // Установка текущей даты в фильтре
        const dateFilter = document.getElementById('date-filter');
        if (dateFilter) {
            const today = new Date();
            dateFilter.value = today.toISOString().slice(0, 10);

            // Добавляем обработчик изменения даты для немедленной загрузки данных
            dateFilter.addEventListener('change', function () {
                console.log('Дата изменена на', this.value);
                // Если выбран период week или month, сбрасываем на day для правильного отображения
                const periodFilter = document.getElementById('period-filter');
                if (periodFilter && (periodFilter.value === 'week' || periodFilter.value === 'month')) {
                    periodFilter.value = 'day';
                }
                // Загружаем данные для выбранной даты
                loadDashboardData();
            });
        }

        // Инициализация даты хронологии
        const chronologyDateInput = document.getElementById('chronology-date');
        if (chronologyDateInput) {
            const today = new Date();
            chronologyDateInput.value = today.toISOString().slice(0, 10);
        }

        // Добавляем обработчик для кнопки "Показать" в хронометраже дня
        const loadChronologyBtn = document.getElementById('load-chronology-btn');
        if (loadChronologyBtn) {
            loadChronologyBtn.addEventListener('click', function () {
                loadChronology();
            });
        }

        // Инициализация дат для табеля
        const timesheetStartDate = document.getElementById('timesheet-start-date');
        const timesheetEndDate = document.getElementById('timesheet-end-date');

        if (timesheetStartDate && timesheetEndDate) {
            const today = new Date();
            // Начало месяца
            const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);

            // Конец месяца (текущая дата или последний день месяца)
            timesheetStartDate.value = firstDay.toISOString().slice(0, 10);
            timesheetEndDate.value = today.toISOString().slice(0, 10);
        }

        // Инициализация значений ресурсов до получения данных
        initializeResourceMetrics();

        // Загрузка данных дашборда
        loadDashboardData().then(data => {
            // После успешной загрузки данных перепроверяем метрики ресурсов
            if (data && data.resources && data.resources.length > 0) {
                updateResourceMetrics(data.resources[data.resources.length - 1]);
            }
        });

        // Загрузка списка устройств
        try {
            loadDevicesList();
        } catch (error) {
            console.error('Ошибка при загрузке списка устройств:', error);
        }

        // Добавление обработчиков событий для фильтров
        const employeeFilter = document.getElementById('employee-filter');
        if (employeeFilter) {
            employeeFilter.addEventListener('change', function () {
                loadDashboardData();
                // При изменении сотрудника обновляем список устройств
                try {
                    loadDevicesList(this.value);
                } catch (error) {
                    console.error('Ошибка при загрузке списка устройств:', error);
                }

                // Если открыта вкладка хронологии, обновляем данные
                if (document.querySelector('#chronology-tab').classList.contains('active')) {
                    setTimeout(() => loadChronology(), 100);
                }
            });
        }

        const deviceFilter = document.getElementById('device-filter');
        if (deviceFilter) {
            deviceFilter.addEventListener('change', function () {
                loadDashboardData();

                // Если открыта вкладка хронологии, обновляем данные
                if (document.querySelector('#chronology-tab').classList.contains('active')) {
                    setTimeout(() => loadChronology(), 100);
                }
            });
        }

        if (dateFilter) {
            dateFilter.addEventListener('change', function () {
                // Если выбран период "день", сразу обновляем данные
                const periodFilter = document.getElementById('period-filter');
                if (periodFilter && periodFilter.value === 'day') {
                    // Очищаем кэш данных (если он используется)
                    clearSessionCache();
                }
                loadDashboardData();
            });
        }

        const periodFilter = document.getElementById('period-filter');
        if (periodFilter) {
            periodFilter.addEventListener('change', function () {
                // Очищаем кэш данных (если он используется)
                clearSessionCache();
                loadDashboardData();
            });
        }

        const activityTypeFilter = document.getElementById('activity-type-filter');
        if (activityTypeFilter) {
            activityTypeFilter.addEventListener('change', loadDashboardData);
        }

        // Добавление обработчика для сортировки хронологии
        const chronologySort = document.getElementById('chronology-sort');
        if (chronologySort) {
            chronologySort.addEventListener('change', function () {
                // Если есть данные хронологии, обновляем таблицу с новой сортировкой
                if (window.chronologyData) {
                    updateChronologyTable(window.chronologyData, this.value);
                }

                // Если есть данные о посещенных сайтах, обновляем таблицу с новой сортировкой
                if (window.chronologyWebsiteData) {
                    updateChronologyWebsitesTable(window.chronologyWebsiteData, this.value);
                }
            });
        }

        // Добавление обработчиков для кнопок
        const refreshBtn = document.getElementById('refresh-btn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', refreshData);
        }

        // Добавляем автообновление данных
        setupAutoRefresh(60);

        // Инициализация табеля активности
        initActivityTimesheet();

        // Инициализация обычного табеля
        initRegularTimesheet();

        console.log('Инициализация дашборда завершена');
    } catch (error) {
        console.error('Ошибка при инициализации дашборда:', error);
    }
});

// Функция для обновления метрик на основе данных из таблицы активности
function updateMetricsFromTableData() {
    console.log('Обновляем метрики из данных таблицы активности');

    // Получаем таблицу активности
    const activityTable = document.getElementById('activity-timesheet-table');
    if (!activityTable) {
        console.warn('Таблица активности не найдена');
        return;
    }

    // Получаем все строки таблицы
    const rows = activityTable.querySelectorAll('tbody tr');
    if (!rows || rows.length === 0) {
        console.warn('В таблице активности нет данных');
        // Используем сохраненные метрики вместо обнуления
        if (lastValidMetrics && lastValidMetrics.totalTime > 0) {
            console.log('Используем сохраненные метрики вместо обнуления');
            displaySavedMetrics();
        }
        return;
    }

    // Проверяем, что первая ячейка не содержит сообщение об отсутствии данных
    if (rows.length === 1 && rows[0].cells.length === 1) {
        const cellText = rows[0].cells[0].textContent.trim().toLowerCase();
        if (cellText.includes('нет данных')) {
            console.warn('В таблице активности нет данных (сообщение об ошибке)');
            // Используем сохраненные метрики вместо обнуления
            if (lastValidMetrics && lastValidMetrics.totalTime > 0) {
                console.log('Используем сохраненные метрики вместо обнуления');
                displaySavedMetrics();
            }
            return;
        }
    }

    // Инициализируем переменные для расчета метрик
    let totalWorkTime = 0;
    let totalProductiveTime = 0;
    let productivitySum = 0;
    let rowsCount = 0;

    // Обходим все строки и собираем данные
    rows.forEach(row => {
        // Пропускаем строки с классом table-secondary (заголовки категорий)
        if (row.classList.contains('table-secondary')) return;

        // Пропускаем строки, содержащие только одну ячейку (информационные строки)
        if (row.cells.length <= 2) return;

        // Получаем данные из ячеек
        // Время берем из третьей колонки (индекс 2)
        const timeCell = row.cells[2];
        if (!timeCell) return;

        // Парсим время (формат "Xч Yм" или "Yм")
        const timeText = timeCell.textContent.trim();
        let minutes = 0;

        // Если в ячейке нет текста или только "-", пропускаем
        if (!timeText || timeText === '-') return;

        if (timeText.includes('ч')) {
            // Формат "Xч Yм"
            const parts = timeText.split('ч');
            const hours = parseInt(parts[0].trim()) || 0;
            minutes += hours * 60;

            if (parts[1]) {
                const minutesPart = parseInt(parts[1].replace('м', '').trim());
                if (!isNaN(minutesPart)) {
                    minutes += minutesPart;
                }
            }
        } else {
            // Формат "Yм"
            minutes = parseInt(timeText.replace('м', '').trim()) || 0;
        }

        // Получаем продуктивность из четвертой колонки (индекс 3)
        const productivityCell = row.cells[3];
        if (!productivityCell) return;

        // Извлекаем процент продуктивности из прогресс-бара
        const progressBar = productivityCell.querySelector('.progress-bar');
        let productivity = 0;

        if (progressBar) {
            // Извлекаем текст из прогресс-бара (формат "XX.X%")
            const productivityText = progressBar.textContent.trim();
            productivity = parseFloat(productivityText) || 0;
        }

        // Суммируем данные
        totalWorkTime += minutes;
        totalProductiveTime += (minutes * productivity / 100);
        productivitySum += productivity;
        rowsCount++;
    });

    // Проверяем, есть ли данные после анализа строк
    if (rowsCount === 0) {
        console.warn('Не удалось извлечь данные из таблицы активности');
        // Используем сохраненные метрики вместо обнуления
        if (lastValidMetrics && lastValidMetrics.totalTime > 0) {
            console.log('Используем сохраненные метрики вместо обнуления');
            displaySavedMetrics();
        }
        return;
    }

    // Рассчитываем средние значения
    const avgProductivity = rowsCount > 0 ? (productivitySum / rowsCount) : 0;
    // Убираем неэтичный расчет перерывов - перерывы должны считаться на основе реальных данных
    // const breakTime = Math.round(totalWorkTime * 0.15); // Примерно 15% от общего времени

    console.log('Результаты расчета метрик:', {
        totalWorkTime,
        totalProductiveTime,
        avgProductivity,
        // breakTime, // Убираем из логирования
        rowsCount
    });

    // Сохраняем новые метрики для использования в будущем
    if (totalWorkTime > 0) {
        lastValidMetrics = {
            totalTime: totalWorkTime,
            productiveTime: totalProductiveTime,
            productivity: avgProductivity
            // breaks: breakTime // Убираем сохранение перерывов
        };
    }

    // Обновляем метрики в верхней части страницы
    // Общее рабочее время
    const totalWorkingTimeElement = document.getElementById('total-working-time');
    if (totalWorkingTimeElement) {
        const hours = Math.floor(totalWorkTime / 60);
        const minutesRemainder = Math.round(totalWorkTime % 60);
        totalWorkingTimeElement.textContent = formatTimeNicely(hours, minutesRemainder);

        // Обновляем подзаголовок
        const subtitle = totalWorkingTimeElement.parentElement.querySelector('.metric-subtitle');
        if (subtitle) {
            const startDate = document.getElementById('activity-start-date')?.value || '';
            const endDate = document.getElementById('activity-end-date')?.value || '';
            if (startDate && endDate) {
                subtitle.textContent = `За период ${formatDate(new Date(startDate))} - ${formatDate(new Date(endDate))}`;
            } else {
                subtitle.textContent = 'За выбранный период';
            }
        }
    }

    // Продуктивное время
    const productiveTimeElement = document.getElementById('productive-time');
    if (productiveTimeElement) {
        const productiveHours = Math.floor(totalProductiveTime / 60);
        const productiveMinutes = Math.round(totalProductiveTime % 60);
        productiveTimeElement.textContent = formatTimeNicely(productiveHours, productiveMinutes);

        // Обновляем подзаголовок с процентом
        const subtitle = productiveTimeElement.parentElement.querySelector('.metric-subtitle');
        if (subtitle && totalWorkTime > 0) {
            const percent = ((totalProductiveTime / totalWorkTime) * 100).toFixed(1);
            subtitle.textContent = `${percent}% от общего времени`;
        }
    }

    // Средний балл продуктивности
    const activityScoreElement = document.getElementById('activity-score');
    if (activityScoreElement) {
        activityScoreElement.textContent = `${avgProductivity.toFixed(1)}%`;

        // Обновляем подзаголовок
        const subtitle = activityScoreElement.parentElement.querySelector('.metric-subtitle');
        if (subtitle) {
            subtitle.textContent = 'Средний балл продуктивности';
        }
    }

    // Перерывы
    const breakTimeElement = document.getElementById('break-time');
    if (breakTimeElement) {
        // Убираем отображение неэтичных расчетных перерывов
        // const breakHours = Math.floor(breakTime / 60);
        // const breakMinutes = Math.round(breakTime % 60);
        // breakTimeElement.textContent = formatTimeNicely(breakHours, breakMinutes);

        // Показываем "Н/Д" вместо расчетных данных
        breakTimeElement.textContent = 'Н/Д';

        const subtitle = breakTimeElement.parentElement.querySelector('.metric-subtitle');
        if (subtitle) {
            subtitle.textContent = 'Требует реальных данных';
        }
    }

    console.log('Метрики успешно обновлены из данных таблицы');
}

// Функция для начальной инициализации метрик ресурсов
function initializeResourceMetrics() {
    // Обновляем текущие значения из статистики на странице
    const cpuMaxElement = document.getElementById('max-cpu-usage');
    const ramMaxElement = document.getElementById('max-ram-usage');
    const diskMaxElement = document.getElementById('max-disk-usage');

    // Если элементы существуют и содержат данные, извлекаем значения
    let cpuMax = 0, ramMax = 0, diskMax = 0;

    if (cpuMaxElement) {
        cpuMax = parseInt(cpuMaxElement.textContent) || 0;
    }

    if (ramMaxElement) {
        ramMax = parseInt(ramMaxElement.textContent) || 0;
    }

    if (diskMaxElement) {
        diskMax = parseInt(diskMaxElement.textContent) || 0;
    }

    // Используем эти значения для начальной установки текущих метрик
    const initialData = {
        cpu: cpuMax,
        memory: ramMax,
        disk: diskMax
    };

    updateResourceMetrics(initialData);
}

// Функция для загрузки списка устройств
async function loadDevicesList(employeeId = null) {
    try {
        // Получаем текущее выбранное устройство, чтобы восстановить его после обновления списка
        const deviceSelect = document.getElementById('device-filter');
        const currentDeviceId = deviceSelect.value;

        // Запрос к API для получения списка устройств
        const response = await fetch('/api/devices');
        if (!response.ok) {
            throw new Error('Ошибка при загрузке списка устройств');
        }

        const devices = await response.json();

        // Очищаем текущий список, оставляя только первый пункт (Все устройства)
        deviceSelect.innerHTML = '<option value="">Все устройства</option>';

        // Группируем устройства по именам сотрудников и объединяем информацию
        const devicesByEmployee = {};

        devices.forEach(device => {
            const employeeName = device.employee_name || 'Неизвестный';

            // Если задан конкретный сотрудник, показываем только его устройства
            if (employeeId && employeeName !== employeeId) {
                return;
            }

            if (!devicesByEmployee[employeeName]) {
                devicesByEmployee[employeeName] = {};
            }

            const deviceKey = device.device_id || device.id;
            if (!devicesByEmployee[employeeName][deviceKey]) {
                devicesByEmployee[employeeName][deviceKey] = {
                    id: deviceKey,
                    name: device.name || 'Неизвестное устройство',
                    computer_name: device.computer_name || '',
                    count: 1,
                    last_seen: device.last_seen || ''
                };
            } else {
                // Если такое устройство уже есть, увеличиваем счетчик
                devicesByEmployee[employeeName][deviceKey].count++;

                // Обновляем last_seen, если новое значение новее текущего
                if (device.last_seen && (!devicesByEmployee[employeeName][deviceKey].last_seen ||
                    new Date(device.last_seen) > new Date(devicesByEmployee[employeeName][deviceKey].last_seen))) {
                    devicesByEmployee[employeeName][deviceKey].last_seen = device.last_seen;
                }
            }
        });

        // Добавляем устройства в выпадающий список
        Object.keys(devicesByEmployee).forEach(employeeName => {
            const employeeDevices = Object.values(devicesByEmployee[employeeName]);

            // Создаем группу для устройств сотрудника
            const optgroup = document.createElement('optgroup');
            optgroup.label = `${employeeName} (${employeeDevices.length} устр.)`;

            // Добавляем устройства в группу
            employeeDevices.forEach(device => {
                const option = document.createElement('option');
                option.value = device.id;
                option.text = `${device.name}${device.count > 1 ? ` (${device.count})` : ''}`;
                if (device.computer_name) {
                    option.text += ` - ${device.computer_name}`;
                }
                optgroup.appendChild(option);
            });

            deviceSelect.appendChild(optgroup);
        });

        // Восстанавливаем выбранное устройство, если оно было
        if (currentDeviceId) {
            deviceSelect.value = currentDeviceId;
        }

    } catch (error) {
        console.error('Ошибка при загрузке списка устройств:', error);
    }
}

// Функция для обновления таблицы посещенных сайтов
function updateChronologyWebsitesTable(websiteData, sortOrder = 'desc') {
    console.log('Обновляем таблицу посещенных сайтов:', websiteData);

    const tbody = document.getElementById('chronology-websites-table').querySelector('tbody');

    // Проверяем наличие данных
    if (!websiteData || websiteData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center">Нет данных о посещенных сайтах за выбранную дату</td></tr>';
        return;
    }

    // Сортируем данные по временной метке
    websiteData.sort((a, b) => {
        const dateA = new Date(a.timestamp);
        const dateB = new Date(b.timestamp);
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });

    // Группируем события по часам
    const eventsByHour = {};
    websiteData.forEach(event => {
        const eventDate = new Date(event.timestamp);
        const hour = eventDate.getHours();

        if (!eventsByHour[hour]) {
            eventsByHour[hour] = [];
        }
        eventsByHour[hour].push(event);
    });

    // Очищаем таблицу
    tbody.innerHTML = '';

    // Получаем часы в порядке сортировки
    const hours = Object.keys(eventsByHour).map(Number);
    if (sortOrder === 'desc') {
        hours.sort((a, b) => b - a);
    } else {
        hours.sort((a, b) => a - b);
    }

    // Добавляем строки для каждого часа
    hours.forEach((hour, hourIndex) => {
        const events = eventsByHour[hour];

        // Находим самое раннее и самое позднее событие в группе
        let earliestEvent = null;
        let latestEvent = null;
        let totalDuration = 0;

        events.forEach(event => {
            const eventStart = new Date(event.timestamp);
            if (!earliestEvent || eventStart < new Date(earliestEvent.timestamp)) {
                earliestEvent = event;
            }
            if (!latestEvent || eventStart > new Date(latestEvent.timestamp)) {
                latestEvent = event;
            }
            if (event.duration) {
                totalDuration += event.duration;
            }
        });

        // Форматируем время для отображения в заголовке
        let timeRangeText = '';
        if (earliestEvent && latestEvent) {
            const startTime = new Date(earliestEvent.timestamp);
            const endTime = new Date(latestEvent.timestamp);

            // Если есть duration у последнего события, добавляем его
            if (latestEvent.duration) {
                endTime.setSeconds(endTime.getSeconds() + latestEvent.duration);
            }

            const formattedStartTime = `${startTime.getHours().toString().padStart(2, '0')}:${startTime.getMinutes().toString().padStart(2, '0')}`;
            const formattedEndTime = `${endTime.getHours().toString().padStart(2, '0')}:${endTime.getMinutes().toString().padStart(2, '0')}`;
            timeRangeText = `${formattedStartTime} - ${formattedEndTime}`;
        }

        // Подсчитываем продуктивные и непродуктивные сайты
        const productiveSites = events.filter(e => e.is_productive === true).length;
        const unproductiveSites = events.filter(e => e.is_productive === false).length;
        const neutralSites = events.length - productiveSites - unproductiveSites;

        // Определяем класс продуктивности для часа
        let hourProductivityClass = '';
        const productivityRatio = events.length > 0 ? productiveSites / events.length : 0;
        if (productivityRatio >= 0.7) {
            hourProductivityClass = 'hour-productive';
        } else if (productivityRatio >= 0.4) {
            hourProductivityClass = 'hour-neutral';
        } else {
            hourProductivityClass = 'hour-unproductive';
        }

        // Создаем заголовок для часа
        const hourRow = document.createElement('tr');
        hourRow.className = `hour-header ${hourProductivityClass}`;
        hourRow.style.cursor = 'pointer';

        hourRow.innerHTML = `
            <td colspan="4" class="hour-header-content">
                <div class="d-flex justify-content-between align-items-center">
                    <div class="hour-info">
                        <span class="collapse-icon">
                            <i class="bi bi-chevron-down"></i>
                        </span>
                        <span class="hour-title">
                            <i class="bi bi-globe2 me-2"></i>
                            <strong>${hour.toString().padStart(2, '0')}:00 - ${hour.toString().padStart(2, '0')}:59</strong>
                        </span>
                        ${timeRangeText ? `<span class="time-range-badge">${timeRangeText}</span>` : ''}
                    </div>
                    <div class="hour-stats">
                        <span class="visits-badge">
                            <i class="bi bi-eye me-1"></i>
                            ${events.length} ${events.length === 1 ? 'посещение' : events.length < 5 ? 'посещения' : 'посещений'}
                        </span>
                        ${productiveSites > 0 ? `<span class="productive-badge"><i class="bi bi-check-circle me-1"></i>${productiveSites}</span>` : ''}
                        ${unproductiveSites > 0 ? `<span class="unproductive-badge"><i class="bi bi-x-circle me-1"></i>${unproductiveSites}</span>` : ''}
                        ${neutralSites > 0 ? `<span class="neutral-badge"><i class="bi bi-circle me-1"></i>${neutralSites}</span>` : ''}
                        ${totalDuration > 0 ? `<span class="duration-badge"><i class="bi bi-clock me-1"></i>${formatDuration(totalDuration)}</span>` : ''}
                    </div>
                </div>
            </td>
        `;

        tbody.appendChild(hourRow);

        // Добавляем события для этого часа
        events.forEach((event, eventIndex) => {
            const eventDate = new Date(event.timestamp);
            const hours = eventDate.getHours().toString().padStart(2, '0');
            const minutes = eventDate.getMinutes().toString().padStart(2, '0');
            const seconds = eventDate.getSeconds().toString().padStart(2, '0');
            const timeStr = `${hours}:${minutes}:${seconds}`;

            // Определяем конечное время события, если есть duration
            let endTimeStr = '';
            let durationText = '';
            if (event.duration) {
                const endTime = new Date(eventDate.getTime() + (event.duration * 1000));
                const endHours = endTime.getHours().toString().padStart(2, '0');
                const endMinutes = endTime.getMinutes().toString().padStart(2, '0');
                const endSeconds = endTime.getSeconds().toString().padStart(2, '0');
                endTimeStr = `${endHours}:${endMinutes}:${endSeconds}`;
                durationText = formatDuration(event.duration);
            }

            // Определяем класс продуктивности
            let productivityClass = '';
            let productivityIcon = '';
            if (event.is_productive === true) {
                productivityClass = 'text-success';
                productivityIcon = '<i class="bi bi-check-circle-fill text-success me-2"></i>';
            } else if (event.is_productive === false) {
                productivityClass = 'text-danger';
                productivityIcon = '<i class="bi bi-x-circle-fill text-danger me-2"></i>';
            } else {
                productivityClass = 'text-muted';
                productivityIcon = '<i class="bi bi-circle text-muted me-2"></i>';
            }

            // Создаем строку события
            const eventRow = document.createElement('tr');
            eventRow.className = `website-event activity-group-content ${productivityClass}`;
            eventRow.dataset.hourGroup = hour;

            // Формируем ячейку времени с учетом начала и конца
            let timeCell = `
                <td class="time-cell">
                    <div class="time-display">
                        <span class="start-time">${timeStr}</span>
                        ${endTimeStr ? `<small class="end-time">до ${endTimeStr}</small>` : ''}
                        ${durationText ? `<small class="duration-text">${durationText}</small>` : ''}
                    </div>
                </td>
            `;

            // Обрезаем URL для отображения
            const maxUrlLength = 60;
            const displayUrl = event.url.length > maxUrlLength
                ? event.url.substring(0, maxUrlLength) + '...'
                : event.url;

            // Получаем домен из URL
            let domain = '';
            let favicon = '';
            try {
                const urlObj = new URL(event.url);
                domain = urlObj.hostname;
                favicon = `https://www.google.com/s2/favicons?domain=${domain}&sz=16`;
            } catch (e) {
                domain = event.url.split('/')[0];
            }

            // Получаем title страницы
            const pageTitle = event.title || 'Без названия';
            const displayTitle = pageTitle.length > 50 ? pageTitle.substring(0, 50) + '...' : pageTitle;

            eventRow.innerHTML = `
                ${timeCell}
                <td class="browser-cell">
                    <div class="browser-info">
                        <i class="bi bi-browser-chrome me-2"></i>
                        ${event.browser_name || 'Неизвестно'}
                    </div>
                </td>
                <td class="url-cell">
                    <div class="url-info">
                        ${productivityIcon}
                        <div class="url-details">
                            ${favicon ? `<img src="${favicon}" alt="" class="favicon me-2" onerror="this.style.display='none'">` : ''}
                            <div class="url-text">
                                <div class="page-title" title="${pageTitle}">${displayTitle}</div>
                                <div class="url-link" title="${event.url}">
                                    <small class="text-muted">${displayUrl}</small>
                                </div>
                                <div class="domain-text">
                                    <small class="badge bg-light text-dark">${domain}</small>
                                </div>
                            </div>
                        </div>
                    </div>
                </td>
                <td class="action-cell">
                    <button class="btn btn-sm btn-outline-primary website-action-btn" 
                            onclick="openWebsiteModal({
                                url: '${event.url.replace(/'/g, "\\'")}',
                                browser: '${(event.browser_name || 'Неизвестно').replace(/'/g, "\\'")}',
                                timestamp: '${event.timestamp}',
                                title: '${pageTitle.replace(/'/g, "\\'")}',
                                duration: ${event.duration || 0},
                                is_productive: ${event.is_productive}
                            })"
                            title="Подробности">
                        <i class="bi bi-eye"></i>
                    </button>
                </td>
            `;

            tbody.appendChild(eventRow);
        });

        // Добавляем обработчик для сворачивания/разворачивания
        hourRow.addEventListener('click', function (e) {
            e.preventDefault();
            const hour = events[0] ? new Date(events[0].timestamp).getHours() : 0;
            const relatedEvents = tbody.querySelectorAll(`tr[data-hour-group="${hour}"]`);
            const icon = this.querySelector('.collapse-icon i');
            const isCollapsed = this.classList.contains('collapsed');

            if (isCollapsed) {
                // Разворачиваем
                this.classList.remove('collapsed');
                icon.className = 'bi bi-chevron-down';
                relatedEvents.forEach(row => {
                    row.style.display = '';
                });
            } else {
                // Сворачиваем
                this.classList.add('collapsed');
                icon.className = 'bi bi-chevron-right';
                relatedEvents.forEach(row => {
                    row.style.display = 'none';
                });
            }
        });

        // По умолчанию сворачиваем все кроме текущего часа
        const currentHour = new Date().getHours();
        if (hour !== currentHour) {
            hourRow.classList.add('collapsed');
            hourRow.querySelector('.collapse-icon i').className = 'bi bi-chevron-right';
            const relatedEvents = tbody.querySelectorAll(`tr[data-hour-group="${hour}"]`);
            relatedEvents.forEach(row => {
                row.style.display = 'none';
            });
        }
    });
}

// Функция для загрузки табеля активности
async function loadActivityTimesheet() {
    const startDate = document.getElementById('activity-start-date').value;
    const endDate = document.getElementById('activity-end-date').value;

    if (!startDate || !endDate) {
        alert("Выберите период для отображения табеля активности");
        return;
    }

    console.log(`Загружаем табель активности за период: ${startDate} - ${endDate}`);

    try {
        showLoading(true);

        // Получаем текущие фильтры
        const employeeFilter = document.getElementById('employee-filter');
        const deviceFilter = document.getElementById('device-filter');

        // Формируем параметры запроса
        const params = new URLSearchParams();
        if (employeeFilter && employeeFilter.value) params.append('employee_id', employeeFilter.value);
        if (deviceFilter && deviceFilter.value) params.append('device_id', deviceFilter.value);
        params.append('start_date', startDate);
        params.append('end_date', endDate);

        // Показываем сообщение о загрузке
        document.getElementById('activity-timesheet-table').querySelector('tbody').innerHTML =
            '<tr><td colspan="7" class="text-center">Загрузка данных...</td></tr>';

        console.log(`Отправляем запрос к API: /api/public/timesheet/activity?${params.toString()}`);

        // Выполняем запрос к API
        let data = [];
        try {
            const response = await fetch(`/api/public/timesheet/activity?${params.toString()}`);

            if (response.ok) {
                // Получаем ответ и парсим JSON только если запрос успешен
                const responseText = await response.text();
                console.log(`Получен ответ от API (первые 200 символов): ${responseText.substring(0, 200)}...`);
                data = JSON.parse(responseText);
                console.log('Данные табеля активности:', data);
            } else {
                // Если запрос не успешен, логируем ошибку, но не показываем пользователю
                console.warn(`Не удалось загрузить данные: HTTP статус ${response.status}`);
                // Используем пустой массив данных
                data = [];
            }
        } catch (fetchError) {
            // Логируем ошибку, но не выбрасываем исключение
            console.warn('Ошибка при получении данных:', fetchError);
            // Используем пустой массив данных
            data = [];
        }

        // Обновляем интерфейс с полученными данными (пустыми или нет)
        updateActivityTimesheet(data);

        // ОТКЛЮЧЕНО: После обновления таблицы обновляем метрики на основе данных таблицы
        // Это предотвращает конфликт с dashboard-timesheet.js который правильно считает метрики
        // setTimeout(updateMetricsFromTableData, 500); // Даем время на рендеринг таблицы

        showLoading(false);
    } catch (error) {
        console.error('Ошибка загрузки табеля активности:', error);
        // Не показываем пользователю сообщение об ошибке
        showLoading(false);

        // В случае ошибки показываем сообщение в таблице без технических деталей
        document.getElementById('activity-timesheet-table').querySelector('tbody').innerHTML =
            '<tr><td colspan="7" class="text-center">Нет данных за выбранный период</td></tr>';

        // Обнуляем только метрики табеля (НЕ трогаем шапку)
        document.getElementById('timesheet-total-time').textContent = '-';
        document.getElementById('timesheet-productive-time').textContent = '-';
        document.getElementById('timesheet-productivity').textContent = '-';
        document.getElementById('timesheet-break-time').textContent = '-';
    }
}

// Функция для обновления интерфейса табеля активности
function updateActivityTimesheet(data) {
    console.log('🔄 Обновляем интерфейс табеля активности с данными:', data);

    // Проверяем наличие данных
    if (!data || data.length === 0) {
        document.getElementById('activity-timesheet-table').querySelector('tbody').innerHTML =
            '<tr><td colspan="7" class="text-center">Нет данных за выбранный период</td></tr>';
        return;
    }

    // Применяем клиентскую фильтрацию к каждому дню
    const filters = getCurrentFilters();
    console.log('Применяем фильтры к табелю активности:', filters);

    const filteredData = data.map(day => {
        if (!day.activities || day.activities.length === 0) {
            return day;
        }

        // Фильтруем активности для дня
        const filteredActivities = filterDataByEmployee(day.activities, filters.employeeId, filters.deviceId);

        return {
            ...day,
            activities: filteredActivities
        };
    }).filter(day => {
        // Оставляем только дни с активностями после фильтрации
        return day.activities && day.activities.length > 0;
    });

    console.log('Данные табеля после фильтрации:', filteredData);

    if (filteredData.length === 0) {
        document.getElementById('activity-timesheet-table').querySelector('tbody').innerHTML =
            `<tr><td colspan="7" class="text-center">${filters.employeeId ? 'Нет данных для выбранного сотрудника' : 'Нет данных за выбранный период'}</td></tr>`;
        return;
    }

    // ВАЖНО: НЕ обновляем метрики здесь, так как это делает dashboard-timesheet.js
    // Это предотвращает дублирование и неправильный подсчет времени

    // Обновляем только таблицу по дням
    const tbody = document.getElementById('activity-timesheet-table').querySelector('tbody');
    tbody.innerHTML = '';

    // Сортируем дни по дате (от новых к старым)
    const sortedDays = [...filteredData].sort((a, b) => {
        return new Date(b.date) - new Date(a.date);
    });

    // Добавляем строки для каждого дня
    sortedDays.forEach(day => {
        const tr = document.createElement('tr');

        // Форматируем дату
        const dayDate = new Date(day.date);
        const formattedDate = formatDate(dayDate);

        // Переводим день недели на русский
        const dayOfWeek = translateDayOfWeek(dayDate.toLocaleString('en-US', { weekday: 'long' }));

        // Получаем цвет строки в зависимости от дня недели
        if (dayOfWeek === 'Суббота' || dayOfWeek === 'Воскресенье') {
            tr.className = 'table-secondary';
        }

        // Форматируем общее время - используем данные из активностей
        let dayTotalDuration = 0;
        if (day.activities && day.activities.length > 0) {
            // Суммируем время всех активностей для дня
            dayTotalDuration = day.activities.reduce((total, activity) => {
                const duration = convertToMinutes(activity.duration || 0);
                return total + duration;
            }, 0);
        }

        const totalDayTime = formatMinutes(dayTotalDuration);

        // Вычисляем процент продуктивности для дня на основе активностей
        let dayProductivity = 0;
        if (day.activities && day.activities.length > 0 && dayTotalDuration > 0) {
            const productiveTime = day.activities.reduce((total, activity) => {
                const duration = convertToMinutes(activity.duration || 0);
                const productivity = activity.productivity || 50; // по умолчанию 50%
                return total + (duration * productivity / 100);
            }, 0);
            dayProductivity = (productiveTime / dayTotalDuration) * 100;
        }

        // Создаем индикатор продуктивности
        const productivityClass = getProductivityClass(dayProductivity);
        const productivityHtml = `
            <div class="progress" style="height: 20px;">
                <div class="progress-bar ${productivityClass}" 
                     style="width: ${dayProductivity.toFixed(1)}%;" 
                     role="progressbar" 
                     aria-valuenow="${dayProductivity.toFixed(1)}" 
                     aria-valuemin="0" 
                     aria-valuemax="100">
                    ${dayProductivity.toFixed(1)}%
                </div>
            </div>
        `;

        // Обрабатываем топ приложений для этого дня
        const activitiesByApp = {};
        if (day.activities && day.activities.length > 0) {
            day.activities.forEach(activity => {
                const appName = activity.app_name || 'Неизвестно';
                if (!activitiesByApp[appName]) {
                    activitiesByApp[appName] = 0;
                }
                const activityDuration = convertToMinutes(activity.duration || 0);
                activitiesByApp[appName] += activityDuration;
            });
        }

        // Сортируем приложения по продолжительности
        const topApps = Object.entries(activitiesByApp)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([name, duration]) => {
                return `<span class="badge bg-primary me-1 mb-1">${name}: ${formatMinutes(duration)}</span>`;
            }).join('');

        // Заполняем ячейки
        tr.innerHTML = `
            <td>${formattedDate}</td>
            <td>${dayOfWeek}</td>
            <td>${totalDayTime}</td>
            <td>${productivityHtml}</td>
            <td>${topApps || '-'}</td>
            <td>-</td>
            <td>
                <button class="btn btn-sm btn-outline-primary view-day-details" data-date="${day.date}">
                    <i class="bi bi-eye"></i>
                </button>
            </td>
        `;

        // Добавляем обработчик для кнопки просмотра деталей
        tr.querySelector('.view-day-details').addEventListener('click', function () {
            showDayDetails(this.getAttribute('data-date'));
        });

        tbody.appendChild(tr);
    });

    console.log('✅ Таблица активности обновлена (метрики обновляются через dashboard-timesheet.js)');
}

// Функция для конвертации секунд в минуты
function convertToMinutes(seconds) {
    if (!seconds || isNaN(seconds)) return 0;
    // Преобразуем значения из секунд в минуты
    return Math.round(seconds / 60);
}

// Функция для определения класса индикатора продуктивности
function getProductivityClass(score) {
    if (score >= 70) return 'bg-success';
    if (score >= 50) return 'bg-info';
    if (score >= 30) return 'bg-warning';
    return 'bg-danger';
}

// Функция для перевода дня недели на русский
function translateDayOfWeek(day) {
    const translations = {
        'Monday': 'Понедельник',
        'Tuesday': 'Вторник',
        'Wednesday': 'Среда',
        'Thursday': 'Четверг',
        'Friday': 'Пятница',
        'Saturday': 'Суббота',
        'Sunday': 'Воскресенье'
    };

    // Проверяем, есть ли такой день в словаре переводов
    if (translations[day]) {
        return translations[day];
    } else {
        console.warn(`Неизвестный день недели: ${day}`);
        return day || 'Неизвестно';
    }
}

// Функция для просмотра детальной информации за выбранный день
function showDayDetails(date) {
    // Переключаемся на вкладку хронологии дня
    document.querySelector('a[href="#chronology"]').click();

    // Устанавливаем дату в поле выбора даты
    const chronologyDateInput = document.getElementById('chronology-date');
    if (chronologyDateInput) {
        chronologyDateInput.value = date;

        // Получаем текущие значения фильтров
        const employeeFilter = document.getElementById('employee-filter');
        const deviceFilter = document.getElementById('device-filter');

        console.log(`Показываем детали дня ${date} для сотрудника ID: ${employeeFilter ? employeeFilter.value : 'все'}, устройство ID: ${deviceFilter ? deviceFilter.value : 'все'}`);

        // Загружаем данные хронологии за выбранный день
        if (typeof loadChronology === 'function') {
            setTimeout(() => {
                loadChronology();
            }, 100); // Небольшая задержка для гарантии обновления DOM
        }
    }
}

// Функция для экспорта табеля активности в Excel
function exportActivityTimesheetToExcel() {
    const table = document.getElementById('activity-timesheet-table');
    if (!table) return;

    try {
        // Получаем данные из таблицы
        const tbody = table.querySelector('tbody');
        if (!tbody || tbody.children.length === 0 || tbody.children[0].cells.length <= 1) {
            alert('Нет данных для экспорта');
            return;
        }

        // Получаем заголовки
        const headers = Array.from(table.querySelectorAll('thead th')).map(th => th.textContent);

        // Создаем данные для Excel
        let csvContent = headers.join(',') + '\n';

        // Добавляем строки данных
        Array.from(tbody.children).forEach(row => {
            if (row.cells.length <= 1) return; // Пропускаем строку "Нет данных"

            const rowData = [];
            Array.from(row.cells).forEach((cell, index) => {
                // Извлекаем текст без HTML тегов
                let text = '';

                if (index === 3) {
                    // Для колонки с продуктивностью получаем значение из прогресс-бара
                    const progressBar = cell.querySelector('.progress-bar');
                    text = progressBar ? progressBar.textContent.trim() : '';
                } else if (index === 4 || index === 5) {
                    // Для колонок с бейджами собираем их значения через запятую
                    const badges = cell.querySelectorAll('.badge');
                    text = Array.from(badges).map(badge => badge.textContent.trim()).join(', ');
                } else if (index === 6) {
                    // Пропускаем колонку с кнопками действий
                    text = '';
                } else {
                    text = cell.textContent.trim();
                }

                // Экранируем кавычки и добавляем кавычки вокруг текста
                text = '"' + text.replace(/"/g, '""') + '"';

                rowData.push(text);
            });

            csvContent += rowData.join(',') + '\n';
        });

        // Создаем временный элемент для скачивания
        const encodedUri = encodeURI('data:text/csv;charset=utf-8,' + csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', 'activity_timesheet.csv');
        document.body.appendChild(link);

        // Запускаем скачивание
        link.click();

        // Удаляем временный элемент
        document.body.removeChild(link);
    } catch (error) {
        console.error('Ошибка при экспорте табеля:', error);
        alert('Не удалось экспортировать данные. Попробуйте позже.');
    }
}

// Функция для загрузки подробного табеля
// УДАЛЕНЫ ДУБЛИРУЮЩИЕ ФУНКЦИИ ТАБЕЛЯ:
// - async function loadDetailedTimesheet() - детальная загрузка табеля
// - function resetTimesheetMetrics() - сброс метрик табеля
// - function updateTimesheetSummary() - обновление сводки табеля
//
// Вся функциональность табеля теперь находится в dashboard-timesheet.js


// Функция для сброса метрик табеля

// Функция для обновления сводной статистики по данным табеля

// Функция для отображения ошибок
function showError(message) {
    // Фильтрация сообщений об ошибке HTTP 404 или ошибках табеля
    if (message && (message.includes('HTTP error') ||
        message.includes('status: 404') ||
        message.includes('Не удалось загрузить данные табеля'))) {
        // Просто логируем ошибку, но не показываем пользователю
        console.warn('Отфильтрованное сообщение об ошибке:', message);
        return;
    }

    console.error(message);

    // Проверяем наличие элемента для отображения ошибок
    let errorContainer = document.getElementById('error-container');

    if (!errorContainer) {
        // Если элемента нет, создаем его
        errorContainer = document.createElement('div');
        errorContainer.id = 'error-container';
        errorContainer.className = 'alert alert-danger alert-dismissible fade show fixed-top mx-auto mt-3';
        errorContainer.style.maxWidth = '500px';
        errorContainer.style.zIndex = '9999';
        errorContainer.innerHTML = `
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Закрыть"></button>
            <div class="error-message">
                <i class="bi bi-exclamation-triangle-fill me-2"></i>
                ${message}
            </div>
        `;

        // Добавляем элемент в DOM
        document.body.appendChild(errorContainer);

        // Удаляем элемент через 5 секунд
        setTimeout(() => {
            if (errorContainer.parentNode) {
                errorContainer.parentNode.removeChild(errorContainer);
            }
        }, 5000);
    } else {
        // Если элемент существует, обновляем его содержимое
        errorContainer.querySelector('.error-message').innerHTML = `
            <i class="bi bi-exclamation-triangle-fill me-2"></i>
            ${message}
        `;

        // Сбрасываем таймер удаления
        clearTimeout(errorContainer.dataset.timeout);

        // Устанавливаем новый таймер
        errorContainer.dataset.timeout = setTimeout(() => {
            if (errorContainer.parentNode) {
                errorContainer.parentNode.removeChild(errorContainer);
            }
        }, 5000);
    }
}

// Добавляем обработчик для кнопки обновления текущего дня
const updateTodayBtn = document.getElementById('update-today-btn');
if (updateTodayBtn) {
    updateTodayBtn.addEventListener('click', updateTodayData);
}

// Добавляем обработчик для кнопки показа табеля

// Инициализируем тултипы

// Функция для корректного расчета общего времени активности с учетом перекрытий
function calculateTotalActivityTime(activities) {
    if (!activities || activities.length === 0) {
        return 0;
    }

    // Создаем массив временных периодов
    const periods = activities.map(activity => {
        const duration = activity.duration || 0;
        const startTime = new Date(activity.timestamp || activity.start_time);
        const endTime = new Date(startTime.getTime() + duration * 1000);

        return {
            start: startTime,
            end: endTime,
            activity: activity
        };
    }).filter(period => !isNaN(period.start.getTime()) && !isNaN(period.end.getTime()));

    if (periods.length === 0) {
        return 0;
    }

    // Сортируем периоды по времени начала
    periods.sort((a, b) => a.start - b.start);

    // Объединяем перекрывающиеся периоды
    const mergedPeriods = [];
    let currentPeriod = null;

    periods.forEach(period => {
        if (!currentPeriod) {
            currentPeriod = { start: period.start, end: period.end };
        } else {
            // Если новый период начинается до окончания текущего (с буфером 30 сек для учета переключений)
            if (period.start <= new Date(currentPeriod.end.getTime() + 30000)) {
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

    // Вычисляем общее время как сумму объединенных периодов
    const totalTime = mergedPeriods.reduce((total, period) => {
        return total + Math.floor((period.end - period.start) / 1000);
    }, 0);

    console.log(`Расчет времени активности: ${periods.length} периодов -> ${mergedPeriods.length} объединенных периодов = ${totalTime} секунд`);

    return totalTime;
}

// Функция для объединения и правильного расчета времени всех типов активности
function mergeAllActivities(data) {
    console.log('Объединение всех активностей для корректного расчета времени');

    const allActivities = [];

    // Обрабатываем активность окон с СПЕЦИАЛЬНОЙ логикой для браузеров
    if (data.activities && Array.isArray(data.activities)) {
        // Разделяем активности на браузерные и обычные
        const browserActivities = {};
        const regularActivities = [];

        // Список браузеров для группировки
        const browserProcesses = [
            'chrome.exe', 'firefox.exe', 'msedge.exe', 'opera.exe',
            'brave.exe', 'vivaldi.exe', 'safari.exe', 'browser.exe',
            'opera_gx.exe', 'tor.exe', 'arc.exe', 'palemoon.exe'
        ];

        data.activities.forEach(activity => {
            const processName = (activity.process_name || activity.app_name || '').toLowerCase();
            const appName = activity.app_name || activity.process_name || 'Неизвестно';

            // Проверяем, является ли это браузером
            const isBrowser = browserProcesses.some(browser => processName.includes(browser.toLowerCase()));

            if (isBrowser) {
                // Группируем браузерные активности для объединения перекрытий
                if (!browserActivities[appName]) {
                    browserActivities[appName] = [];
                }

                const duration = parseInt(activity.duration || activity.total_time || activity.active_time || 0);
                if (duration > 0) {
                    const startTime = new Date(activity.timestamp || activity.start_time);
                    const endTime = new Date(startTime.getTime() + duration * 1000);

                    browserActivities[appName].push({
                        ...activity,
                        start: startTime,
                        end: endTime,
                        duration: duration
                    });
                }
            } else {
                // Обычные активности обрабатываем как раньше
                const duration = parseInt(activity.duration || activity.total_time || activity.active_time || 0);
                if (duration > 0) {
                    const startTime = new Date(activity.timestamp || activity.start_time);
                    const endTime = new Date(startTime.getTime() + duration * 1000);

                    regularActivities.push({
                        ...activity,
                        type: 'window',
                        start: startTime,
                        end: endTime,
                        duration: duration,
                        application: appName,
                        window_title: activity.window_title || activity.title || '',
                        productivity_score: getProductivityScore(activity)
                    });
                }
            }
        });

        // Добавляем обычные активности
        allActivities.push(...regularActivities);

        // Обрабатываем браузерные активности с группировкой
        Object.keys(browserActivities).forEach(browserName => {
            const sessions = browserActivities[browserName];

            // Сортируем сессии по времени начала
            sessions.sort((a, b) => a.start - b.start);

            // Объединяем перекрывающиеся периоды
            const mergedPeriods = [];
            let currentPeriod = null;

            sessions.forEach(session => {
                if (!currentPeriod) {
                    currentPeriod = {
                        start: session.start,
                        end: session.end,
                        sessions: [session]
                    };
                } else {
                    // Если новая сессия начинается до окончания текущего периода (с буфером 30 сек)
                    if (session.start <= new Date(currentPeriod.end.getTime() + 30000)) {
                        // Объединяем периоды
                        currentPeriod.end = new Date(Math.max(currentPeriod.end.getTime(), session.end.getTime()));
                        currentPeriod.sessions.push(session);
                    } else {
                        // Если нет перекрытия, сохраняем текущий период и начинаем новый
                        mergedPeriods.push(currentPeriod);
                        currentPeriod = {
                            start: session.start,
                            end: session.end,
                            sessions: [session]
                        };
                    }
                }
            });

            // Добавляем последний период
            if (currentPeriod) {
                mergedPeriods.push(currentPeriod);
            }

            // Создаем объединенные активности для каждого периода
            mergedPeriods.forEach(period => {
                const periodDuration = Math.floor((period.end - period.start) / 1000);
                const firstSession = period.sessions[0];

                // Объединяем заголовки вкладок
                const windowTitles = period.sessions
                    .map(s => s.window_title || s.title || '')
                    .filter((title, idx, arr) => title && arr.indexOf(title) === idx)
                    .slice(0, 3)
                    .join(', ');

                const finalWindowTitle = windowTitles +
                    (period.sessions.length > 3 ? ` (и еще ${period.sessions.length - 3} вкладок)` : '');

                allActivities.push({
                    ...firstSession,
                    type: 'browser',
                    start: period.start,
                    end: period.end,
                    duration: periodDuration,
                    application: browserName,
                    window_title: finalWindowTitle || 'Браузерная активность',
                    productivity_score: 60 // Браузерная активность считается умеренно продуктивной
                });
            });

            console.log(`🦁 Браузер ${browserName}: ${sessions.length} сессий -> ${mergedPeriods.length} периодов = ${mergedPeriods.reduce((total, p) => total + Math.floor((p.end - p.start) / 1000), 0)} секунд`);
        });
    }

    console.log(`Всего активностей после объединения: ${allActivities.length}`);
    return allActivities;
}

// Функция для расчета продуктивности веб-сайта
function calculateWebsiteProductivity(url) {
    const productiveDomains = [
        'github.com', 'stackoverflow.com', 'docs.', 'documentation',
        'learn.', 'tutorial', 'course', 'edu', 'office.com', 'google.com/docs'
    ];

    const unproductiveDomains = [
        'youtube.com', 'facebook.com', 'instagram.com', 'twitter.com',
        'vk.com', 'tiktok.com', 'netflix.com', 'twitch.tv'
    ];

    const lowerUrl = url.toLowerCase();

    if (productiveDomains.some(domain => lowerUrl.includes(domain))) {
        return 80;
    }

    if (unproductiveDomains.some(domain => lowerUrl.includes(domain))) {
        return 20;
    }

    return 50; // Нейтральная продуктивность по умолчанию
}

// Новая функция для обновления основных метрик в шапке на базе всех данных за день
function updateMainMetrics(allWindowData) {
    console.log('🎯 Обновляем основные метрики в шапке на базе всех данных за день');

    if (!allWindowData || allWindowData.length === 0) {
        console.warn('Нет данных активности окон для расчета метрик');
        // Используем сохраненные метрики
        if (lastValidMetrics && lastValidMetrics.totalTime > 0) {
            displaySavedMetrics();
        }
        return;
    }

    // Применяем клиентскую фильтрацию к данным
    const filters = getCurrentFilters();
    const filteredData = filterDataByEmployee(allWindowData, filters.employeeId, filters.deviceId);
    console.log('Данные для расчета метрик после фильтрации:', filteredData);

    if (filteredData.length === 0) {
        console.warn('Нет данных активности после фильтрации для расчета метрик');
        // Обнуляем метрики если выбран конкретный сотрудник но для него нет данных
        if (filters.employeeId) {
            // Обновляем метрики в шапке нулевыми значениями
            const totalWorkingTimeElement = document.getElementById('total-working-time');
            if (totalWorkingTimeElement) {
                totalWorkingTimeElement.textContent = '0ч 0м';
                const subtitle = totalWorkingTimeElement.parentElement.querySelector('.metric-subtitle');
                if (subtitle) {
                    subtitle.textContent = 'Нет данных для выбранного сотрудника';
                }
            }

            const productiveTimeElement = document.getElementById('productive-time');
            if (productiveTimeElement) {
                productiveTimeElement.textContent = '0ч 0м';
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
        } else if (lastValidMetrics && lastValidMetrics.totalTime > 0) {
            displaySavedMetrics();
        }
        return;
    }

    // Инициализируем переменные для расчета метрик
    let totalWorkTime = 0;
    let totalProductiveTime = 0;
    let totalActivities = 0;
    let productivitySum = 0;

    // Обрабатываем отфильтрованные данные активности окон
    filteredData.forEach(activity => {
        if (!activity || !activity.duration) return;

        const duration = parseInt(activity.duration) || 0;
        if (duration <= 0) return;

        // Конвертируем секунды в минуты
        const durationMinutes = Math.round(duration / 60);

        // Получаем продуктивность (0-100)
        const productivity = getProductivityScore(activity);
        const productiveTime = durationMinutes * (productivity / 100);

        totalWorkTime += durationMinutes;
        totalProductiveTime += productiveTime;
        productivitySum += productivity;
        totalActivities++;
    });

    // Рассчитываем средние значения
    const avgProductivity = totalActivities > 0 ? (productivitySum / totalActivities) : 0;

    console.log('📊 Результаты расчета основных метрик:', {
        totalWorkTime,
        totalProductiveTime,
        avgProductivity,
        totalActivities,
        sourceData: filteredData.length
    });

    // Сохраняем новые метрики
    if (totalWorkTime > 0) {
        lastValidMetrics = {
            totalTime: totalWorkTime,
            productiveTime: totalProductiveTime,
            productivity: avgProductivity
        };
    }

    // Обновляем метрики в шапке
    // Общее рабочее время
    const totalWorkingTimeElement = document.getElementById('total-working-time');
    if (totalWorkingTimeElement) {
        const hours = Math.floor(totalWorkTime / 60);
        const minutesRemainder = Math.round(totalWorkTime % 60);
        totalWorkingTimeElement.textContent = formatTimeNicely(hours, minutesRemainder);

        // Обновляем подзаголовок
        const subtitle = totalWorkingTimeElement.parentElement.querySelector('.metric-subtitle');
        if (subtitle) {
            const dateFilter = document.getElementById('date-filter');
            if (dateFilter && dateFilter.value) {
                const selectedDate = new Date(dateFilter.value);
                subtitle.textContent = `За ${formatDate(selectedDate)}`;
            } else {
                subtitle.textContent = 'За выбранную дату';
            }
        }
    }

    // Продуктивное время
    const productiveTimeElement = document.getElementById('productive-time');
    if (productiveTimeElement) {
        const productiveHours = Math.floor(totalProductiveTime / 60);
        const productiveMinutes = Math.round(totalProductiveTime % 60);
        productiveTimeElement.textContent = formatTimeNicely(productiveHours, productiveMinutes);

        // Обновляем подзаголовок с процентом
        const subtitle = productiveTimeElement.parentElement.querySelector('.metric-subtitle');
        if (subtitle && totalWorkTime > 0) {
            const percent = ((totalProductiveTime / totalWorkTime) * 100).toFixed(1);
            subtitle.textContent = `${percent}% от общего времени`;
        }
    }

    // Средний балл продуктивности
    const activityScoreElement = document.getElementById('activity-score');
    if (activityScoreElement) {
        activityScoreElement.textContent = `${avgProductivity.toFixed(1)}%`;

        // Обновляем подзаголовок
        const subtitle = activityScoreElement.parentElement.querySelector('.metric-subtitle');
        if (subtitle) {
            subtitle.textContent = 'Средний балл продуктивности';
        }
    }

    // Перерывы - показываем что данные недоступны
    const breakTimeElement = document.getElementById('break-time');
    if (breakTimeElement) {
        breakTimeElement.textContent = '0ч 0м';

        const subtitle = breakTimeElement.parentElement.querySelector('.metric-subtitle');
        if (subtitle) {
            subtitle.textContent = 'Время неактивности';
        }
    }

    console.log('✅ Основные метрики в шапке обновлены');
}

function updateMetricsFromTableData() {
    console.log('Обновляем метрики из данных таблицы активности');

    // Получаем таблицу активности
    const activityTable = document.getElementById('activity-timesheet-table');
    if (!activityTable) {
        console.warn('Таблица активности не найдена');
        return;
    }

    // Получаем все строки таблицы
    const rows = activityTable.querySelectorAll('tbody tr');
    if (!rows || rows.length === 0) {
        console.warn('В таблице активности нет данных');
        // Используем сохраненные метрики вместо обнуления
        if (lastValidMetrics && lastValidMetrics.totalTime > 0) {
            console.log('Используем сохраненные метрики вместо обнуления');
            displaySavedMetrics();
        }
        return;
    }

    // Проверяем, что первая ячейка не содержит сообщение об отсутствии данных
    if (rows.length === 1 && rows[0].cells.length === 1) {
        const cellText = rows[0].cells[0].textContent.trim().toLowerCase();
        if (cellText.includes('нет данных')) {
            console.warn('В таблице активности нет данных (сообщение об ошибке)');
            // Используем сохраненные метрики вместо обнуления
            if (lastValidMetrics && lastValidMetrics.totalTime > 0) {
                console.log('Используем сохраненные метрики вместо обнуления');
                displaySavedMetrics();
            }
            return;
        }
    }

    // Инициализируем переменные для расчета метрик
    let totalWorkTime = 0;
    let totalProductiveTime = 0;
    let productivitySum = 0;
    let rowsCount = 0;

    // Обходим все строки и собираем данные
    rows.forEach(row => {
        // Пропускаем строки с классом table-secondary (заголовки категорий)
        if (row.classList.contains('table-secondary')) return;

        // Пропускаем строки, содержащие только одну ячейку (информационные строки)
        if (row.cells.length <= 2) return;

        // Получаем данные из ячеек
        // Время берем из третьей колонки (индекс 2)
        const timeCell = row.cells[2];
        if (!timeCell) return;

        // Парсим время (формат "Xч Yм" или "Yм")
        const timeText = timeCell.textContent.trim();
        let minutes = 0;

        // Если в ячейке нет текста или только "-", пропускаем
        if (!timeText || timeText === '-') return;

        if (timeText.includes('ч')) {
            // Формат "Xч Yм"
            const parts = timeText.split('ч');
            const hours = parseInt(parts[0].trim()) || 0;
            minutes += hours * 60;

            if (parts[1]) {
                const minutesPart = parseInt(parts[1].replace('м', '').trim());
                if (!isNaN(minutesPart)) {
                    minutes += minutesPart;
                }
            }
        } else {
            // Формат "Yм"
            minutes = parseInt(timeText.replace('м', '').trim()) || 0;
        }

        // Получаем продуктивность из четвертой колонки (индекс 3)
        const productivityCell = row.cells[3];
        if (!productivityCell) return;

        // Извлекаем процент продуктивности из прогресс-бара
        const progressBar = productivityCell.querySelector('.progress-bar');
        let productivity = 0;

        if (progressBar) {
            // Извлекаем текст из прогресс-бара (формат "XX.X%")
            const productivityText = progressBar.textContent.trim();
            productivity = parseFloat(productivityText) || 0;
        }

        // Суммируем данные
        totalWorkTime += minutes;
        totalProductiveTime += (minutes * productivity / 100);
        productivitySum += productivity;
        rowsCount++;
    });

    // Проверяем, есть ли данные после анализа строк
    if (rowsCount === 0) {
        console.warn('Не удалось извлечь данные из таблицы активности');
        // Используем сохраненные метрики вместо обнуления
        if (lastValidMetrics && lastValidMetrics.totalTime > 0) {
            console.log('Используем сохраненные метрики вместо обнуления');
            displaySavedMetrics();
        }
        return;
    }

    // Рассчитываем средние значения
    const avgProductivity = rowsCount > 0 ? (productivitySum / rowsCount) : 0;
    // Убираем неэтичный расчет перерывов - перерывы должны считаться на основе реальных данных
    // const breakTime = Math.round(totalWorkTime * 0.15); // Примерно 15% от общего времени

    console.log('Результаты расчета метрик:', {
        totalWorkTime,
        totalProductiveTime,
        avgProductivity,
        // breakTime, // Убираем из логирования
        rowsCount
    });

    // Сохраняем новые метрики для использования в будущем
    if (totalWorkTime > 0) {
        lastValidMetrics = {
            totalTime: totalWorkTime,
            productiveTime: totalProductiveTime,
            productivity: avgProductivity
            // breaks: breakTime // Убираем сохранение перерывов
        };
    }

    // Обновляем метрики в верхней части страницы
    // Общее рабочее время
    const totalWorkingTimeElement = document.getElementById('total-working-time');
    if (totalWorkingTimeElement) {
        const hours = Math.floor(totalWorkTime / 60);
        const minutesRemainder = Math.round(totalWorkTime % 60);
        totalWorkingTimeElement.textContent = formatTimeNicely(hours, minutesRemainder);

        // Обновляем подзаголовок
        const subtitle = totalWorkingTimeElement.parentElement.querySelector('.metric-subtitle');
        if (subtitle) {
            const startDate = document.getElementById('activity-start-date')?.value || '';
            const endDate = document.getElementById('activity-end-date')?.value || '';
            if (startDate && endDate) {
                subtitle.textContent = `За период ${formatDate(new Date(startDate))} - ${formatDate(new Date(endDate))}`;
            } else {
                subtitle.textContent = 'За выбранный период';
            }
        }
    }

    // Продуктивное время
    const productiveTimeElement = document.getElementById('productive-time');
    if (productiveTimeElement) {
        const productiveHours = Math.floor(totalProductiveTime / 60);
        const productiveMinutes = Math.round(totalProductiveTime % 60);
        productiveTimeElement.textContent = formatTimeNicely(productiveHours, productiveMinutes);

        // Обновляем подзаголовок с процентом
        const subtitle = productiveTimeElement.parentElement.querySelector('.metric-subtitle');
        if (subtitle && totalWorkTime > 0) {
            const percent = ((totalProductiveTime / totalWorkTime) * 100).toFixed(1);
            subtitle.textContent = `${percent}% от общего времени`;
        }
    }

    // Средний балл продуктивности
    const activityScoreElement = document.getElementById('activity-score');
    if (activityScoreElement) {
        activityScoreElement.textContent = `${avgProductivity.toFixed(1)}%`;

        // Обновляем подзаголовок
        const subtitle = activityScoreElement.parentElement.querySelector('.metric-subtitle');
        if (subtitle) {
            subtitle.textContent = 'Средний балл продуктивности';
        }
    }

    // Перерывы
    const breakTimeElement = document.getElementById('break-time');
    if (breakTimeElement) {
        // Убираем отображение неэтичных расчетных перерывов
        // const breakHours = Math.floor(breakTime / 60);
        // const breakMinutes = Math.round(breakTime % 60);
        // breakTimeElement.textContent = formatTimeNicely(breakHours, breakMinutes);

        // Показываем "Н/Д" вместо расчетных данных
        breakTimeElement.textContent = 'Н/Д';

        const subtitle = breakTimeElement.parentElement.querySelector('.metric-subtitle');
        if (subtitle) {
            subtitle.textContent = 'Требует реальных данных';
        }
    }

    console.log('Метрики успешно обновлены из данных таблицы');
}

// Универсальная функция для фильтрации данных по выбранному сотруднику и устройству
function filterDataByEmployee(data, employeeId = null, deviceId = null) {
    if (!data || !Array.isArray(data)) {
        return data;
    }

    let filtered = data;

    // Фильтрация по сотруднику
    if (employeeId) {
        console.log(`🔍 Фильтруем данные по сотруднику: ${employeeId}`);
        filtered = filtered.filter(item => {
            const matches = item.employee_name === employeeId ||
                item.employee_id === employeeId ||
                item.user_name === employeeId ||
                item.user_id === employeeId;

            if (matches) {
                console.log(`✅ Найдена запись для сотрудника ${employeeId}:`, {
                    employee_name: item.employee_name,
                    employee_id: item.employee_id,
                    user_name: item.user_name,
                    user_id: item.user_id,
                    app_name: item.app_name || item.url || item.title
                });
            }

            return matches;
        });
        console.log(`📊 После фильтрации по сотруднику ${employeeId}: ${filtered.length} записей`);
    }

    // Фильтрация по устройству
    if (deviceId) {
        console.log(`🔍 Фильтруем данные по устройству: ${deviceId}`);
        filtered = filtered.filter(item => {
            const matches = item.device_id === deviceId ||
                item.computer_name === deviceId ||
                item.hostname === deviceId;

            if (matches) {
                console.log(`✅ Найдена запись для устройства ${deviceId}:`, {
                    device_id: item.device_id,
                    computer_name: item.computer_name,
                    hostname: item.hostname
                });
            }

            return matches;
        });
        console.log(`📊 После фильтрации по устройству ${deviceId}: ${filtered.length} записей`);
    }

    return filtered;
}

// Функция для получения текущих фильтров
function getCurrentFilters() {
    const employeeFilter = document.getElementById('employee-filter');
    const deviceFilter = document.getElementById('device-filter');

    return {
        employeeId: employeeFilter && employeeFilter.value ? employeeFilter.value : null,
        deviceId: deviceFilter && deviceFilter.value ? deviceFilter.value : null
    };
}
