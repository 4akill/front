/**
 * Модуль для работы с кэшированными метриками и отображения продвинутой статистики
 */

// Константы для графиков и отображения
const CHART_COLORS = {
    blue: 'rgba(54, 162, 235, 0.8)',
    green: 'rgba(75, 192, 192, 0.8)',
    red: 'rgba(255, 99, 132, 0.8)',
    orange: 'rgba(255, 159, 64, 0.8)',
    purple: 'rgba(153, 102, 255, 0.8)',
    yellow: 'rgba(255, 205, 86, 0.8)',
    grey: 'rgba(201, 203, 207, 0.8)'
};

// Список графиков для обновления
const charts = {};

/**
 * Инициализация дашборда метрик
 */
async function initMetricsDashboard() {
    console.log('Инициализация дашборда метрик');

    // Загружаем данные для дашборда
    await loadDashboardSummary();

    // Настраиваем фильтры и события
    setupFilters();

    // Запускаем автоматическое обновление данных
    setInterval(refreshMetricsData, 60000); // Обновление каждую минуту
}

/**
 * Настройка фильтров и обработчиков событий
 */
function setupFilters() {
    // Обработчик изменения устройства
    $('#device-filter').on('change', async function () {
        const deviceId = $(this).val();
        await loadDetailedMetrics(deviceId);
    });

    // Обработчик изменения периода
    $('#period-filter').on('change', async function () {
        const deviceId = $('#device-filter').val();
        if (deviceId) {
            await loadDetailedMetrics(deviceId);
        }
    });

    // Обработчик кнопки обновления
    $('#refresh-metrics').on('click', async function () {
        await refreshMetricsData(true);
    });
}

/**
 * Загрузка сводной информации для дашборда
 */
async function loadDashboardSummary() {
    try {
        showLoading(true);

        const response = await fetch('/api/dashboard/dashboard-summary');
        const data = await response.json();

        if (data) {
            updateDashboardSummary(data);
        }

        showLoading(false);
    } catch (error) {
        console.error('Ошибка при загрузке сводной информации:', error);
        showError('Не удалось загрузить сводную информацию');
        showLoading(false);
    }
}

/**
 * Загрузка детальных метрик для устройства
 */
async function loadDetailedMetrics(deviceId, forceRefresh = false) {
    if (!deviceId) return;

    try {
        showLoading(true);

        // Загружаем кэшированные метрики
        const response = await fetch(`/api/dashboard/cached-metrics?device_id=${deviceId}&force_refresh=${forceRefresh}`);
        const data = await response.json();

        if (data) {
            // Обновляем все секции метрик
            updateBrowserMetrics(data.browser_activity, data.website_visits);
            updateApplicationMetrics(data.window_activity, data.office_activity);
            updateProductivityMetrics(data.productivity, data.stats);
            updateResourceMetrics(data.resources);
        }

        showLoading(false);
    } catch (error) {
        console.error('Ошибка при загрузке детальных метрик:', error);
        showError('Не удалось загрузить детальные метрики');
        showLoading(false);
    }
}

/**
 * Обновление сводной информации на дашборде
 */
function updateDashboardSummary(data) {
    // Обновляем счетчики
    $('#active-devices-count').text(data.active_devices_count);
    $('#employees-count').text(data.employees_count);

    // Обновляем показатель продуктивности
    const productivityPercent = data.avg_productivity.toFixed(1);
    $('#avg-productivity').text(productivityPercent + '%');

    // Устанавливаем класс цвета в зависимости от значения
    const productivityElement = $('#avg-productivity');
    productivityElement.removeClass('text-success text-warning text-danger');

    if (productivityPercent >= 70) {
        productivityElement.addClass('text-success');
    } else if (productivityPercent >= 40) {
        productivityElement.addClass('text-warning');
    } else {
        productivityElement.addClass('text-danger');
    }

    // Обновляем список наиболее используемых приложений
    const topAppsContainer = $('#top-apps');
    topAppsContainer.empty();

    if (data.top_apps && data.top_apps.length > 0) {
        data.top_apps.forEach(app => {
            const hours = Math.floor(app.total_duration / 3600);
            const minutes = Math.floor((app.total_duration % 3600) / 60);
            const formattedTime = `${hours}ч ${minutes}м`;

            topAppsContainer.append(`
                <div class="top-app-item d-flex justify-content-between mb-2">
                    <span>${app.app_name}</span>
                    <span class="text-muted">${formattedTime}</span>
                </div>
            `);
        });
    } else {
        topAppsContainer.append('<div class="text-muted">Нет данных</div>');
    }

    // Обновляем список наиболее посещаемых сайтов
    const topSitesContainer = $('#top-sites');
    topSitesContainer.empty();

    if (data.top_sites && data.top_sites.length > 0) {
        data.top_sites.forEach(site => {
            topSitesContainer.append(`
                <div class="top-site-item d-flex justify-content-between mb-2">
                    <span class="text-truncate" style="max-width: 80%;">${site.url}</span>
                    <span class="text-muted">${site.count} посещений</span>
                </div>
            `);
        });
    } else {
        topSitesContainer.append('<div class="text-muted">Нет данных</div>');
    }

    // Обновляем список наиболее активных сотрудников
    const topEmployeesContainer = $('#top-employees');
    topEmployeesContainer.empty();

    if (data.top_employees && data.top_employees.length > 0) {
        data.top_employees.forEach(employee => {
            const hours = Math.floor(employee.total_duration / 3600);
            const minutes = Math.floor((employee.total_duration % 3600) / 60);
            const formattedTime = `${hours}ч ${minutes}м`;

            topEmployeesContainer.append(`
                <div class="top-employee-item d-flex justify-content-between mb-2">
                    <span>${employee.employee_name}</span>
                    <span class="text-muted">${formattedTime}</span>
                </div>
            `);
        });
    } else {
        topEmployeesContainer.append('<div class="text-muted">Нет данных</div>');
    }

    // Обновляем время последнего обновления
    const lastUpdateTime = new Date(data.timestamp);
    $('#last-update').text(lastUpdateTime.toLocaleTimeString());
}

/**
 * Обновление метрик браузеров
 */
function updateBrowserMetrics(browserActivity, websiteVisits) {
    // Обновляем количество активных вкладок
    const tabsCount = browserActivity ? browserActivity.length : 0;
    $('#active-tabs-count').text(tabsCount);

    // Обновляем количество посещенных сайтов
    const sitesCount = websiteVisits ? websiteVisits.length : 0;
    $('#visited-sites-count').text(sitesCount);

    // Подготавливаем данные для графика браузеров
    if (browserActivity && browserActivity.length > 0) {
        // Группируем активность по браузерам
        const browserStats = {};
        browserActivity.forEach(activity => {
            const browserName = activity.browser_name || 'Неизвестно';
            if (!browserStats[browserName]) {
                browserStats[browserName] = {
                    count: 0,
                    total_time: 0
                };
            }
            browserStats[browserName].count++;
            browserStats[browserName].total_time += activity.total_time || 0;
        });

        // Подготавливаем данные для графика
        const browserNames = Object.keys(browserStats);
        const browserCounts = browserNames.map(name => browserStats[name].count);
        const browserTimes = browserNames.map(name => browserStats[name].total_time / 60); // Конвертируем в минуты

        // Обновляем график использования браузеров
        updateBrowserUsageChart(browserNames, browserCounts, browserTimes);
    } else {
        // Если данных нет, показываем пустой график
        updateBrowserUsageChart([], [], []);
    }

    // Подготавливаем данные для графика посещенных сайтов
    if (websiteVisits && websiteVisits.length > 0) {
        // Группируем посещения по сайтам
        const siteStats = {};
        websiteVisits.forEach(visit => {
            const url = visit.url || 'Неизвестно';
            siteStats[url] = (siteStats[url] || 0) + 1;
        });

        // Сортируем и берем топ-10 сайтов
        const sortedSites = Object.entries(siteStats)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);

        const siteUrls = sortedSites.map(site => site[0]);
        const siteCounts = sortedSites.map(site => site[1]);

        // Обновляем график посещений сайтов
        updateWebsiteVisitsChart(siteUrls, siteCounts);

        // Обновляем таблицу с посещенными сайтами
        updateWebsiteVisitsTable(websiteVisits);
    } else {
        // Если данных нет, показываем пустые графики и таблицы
        updateWebsiteVisitsChart([], []);
        $('#website-visits-table tbody').html('<tr><td colspan="4" class="text-center">Нет данных</td></tr>');
    }
}

/**
 * Обновление метрик приложений
 */
function updateApplicationMetrics(windowActivity, officeActivity) {
    // Обновляем количество активных приложений
    if (windowActivity && windowActivity.length > 0) {
        // Подсчитываем уникальные приложения
        const uniqueApps = new Set();
        windowActivity.forEach(activity => {
            if (activity.app_name) {
                uniqueApps.add(activity.app_name);
            }
        });
        $('#active-apps-count').text(uniqueApps.size);

        // Группируем активность по приложениям для графика
        const appStats = {};
        windowActivity.forEach(activity => {
            const appName = activity.app_name || 'Неизвестно';
            if (!appStats[appName]) {
                appStats[appName] = 0;
            }
            appStats[appName] += activity.duration || 0;
        });

        // Сортируем и берем топ-10 приложений
        const sortedApps = Object.entries(appStats)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);

        const appNames = sortedApps.map(app => app[0]);
        const appDurations = sortedApps.map(app => app[1] / 60); // Конвертируем в минуты

        // Обновляем график использования приложений
        updateAppUsageChart(appNames, appDurations);

        // Обновляем таблицу с активностью приложений
        updateAppActivityTable(windowActivity);
    } else {
        // Если данных нет, показываем пустые графики и таблицы
        $('#active-apps-count').text('0');
        updateAppUsageChart([], []);
        $('#app-activity-table tbody').html('<tr><td colspan="4" class="text-center">Нет данных</td></tr>');
    }

    // Обновляем количество офисных документов
    if (officeActivity && officeActivity.length > 0) {
        // Подсчитываем уникальные документы
        const uniqueDocs = new Set();
        officeActivity.forEach(activity => {
            if (activity.document_name) {
                uniqueDocs.add(activity.document_name);
            }
        });
        $('#office-docs-count').text(uniqueDocs.size);

        // Группируем активность по офисным приложениям
        const officeStats = {};
        officeActivity.forEach(activity => {
            const appName = activity.app_name || 'Неизвестно';
            if (!officeStats[appName]) {
                officeStats[appName] = 0;
            }
            officeStats[appName]++;
        });

        // Сортируем офисные приложения
        const sortedOfficeApps = Object.entries(officeStats)
            .sort((a, b) => b[1] - a[1]);

        const officeAppNames = sortedOfficeApps.map(app => app[0]);
        const officeAppCounts = sortedOfficeApps.map(app => app[1]);

        // Обновляем график использования офисных приложений
        updateOfficeUsageChart(officeAppNames, officeAppCounts);

        // Обновляем таблицу с офисными документами
        updateOfficeDocsTable(officeActivity);
    } else {
        // Если данных нет, показываем пустые графики и таблицы
        $('#office-docs-count').text('0');
        updateOfficeUsageChart([], []);
        $('#office-docs-table tbody').html('<tr><td colspan="4" class="text-center">Нет данных</td></tr>');
    }
}

/**
 * Обновление метрик продуктивности
 */
function updateProductivityMetrics(productivityData, stats) {
    // Обновляем общее рабочее время
    let totalWorkTime = 0;
    let productiveTime = 0;

    if (productivityData && productivityData.length > 0) {
        productivityData.forEach(record => {
            totalWorkTime += record.total_work_time || 0;
            productiveTime += record.productive_time || 0;
        });
    }

    // Форматируем времена
    const totalHours = Math.floor(totalWorkTime / 3600);
    const totalMinutes = Math.floor((totalWorkTime % 3600) / 60);
    $('#total-work-time').text(`${totalHours}ч ${totalMinutes}м`);

    const productiveHours = Math.floor(productiveTime / 3600);
    const productiveMinutes = Math.floor((productiveTime % 3600) / 60);
    $('#productive-time').text(`${productiveHours}ч ${productiveMinutes}м`);

    // Рассчитываем процент продуктивности
    const productivityPercent = totalWorkTime > 0 ? (productiveTime / totalWorkTime * 100).toFixed(1) : 0;
    $('#productivity-percent').text(`${productivityPercent}%`);

    // Обновляем график продуктивности
    if (productivityData && productivityData.length > 0) {
        // Подготавливаем данные для графика
        const dates = productivityData.map(record => {
            const date = new Date(record.start_date);
            return date.toLocaleDateString();
        });

        const percentages = productivityData.map(record => {
            return record.productivity_percent || 0;
        });

        // Обновляем график продуктивности
        updateProductivityChart(dates, percentages);
    } else {
        // Если данных нет, показываем пустой график
        updateProductivityChart([], []);
    }

    // Обновляем наиболее посещаемые сайты
    if (stats && stats.most_visited_sites && stats.most_visited_sites.length > 0) {
        const mostVisitedContainer = $('#most-visited-sites');
        mostVisitedContainer.empty();

        stats.most_visited_sites.forEach(site => {
            mostVisitedContainer.append(`
                <div class="most-visited-item d-flex justify-content-between mb-2">
                    <span class="text-truncate" style="max-width: 80%;">${site.url}</span>
                    <span class="text-muted">${site.count} посещений</span>
                </div>
            `);
        });
    } else {
        $('#most-visited-sites').html('<div class="text-muted">Нет данных</div>');
    }

    // Обновляем наиболее используемые приложения
    if (stats && stats.most_used_apps && stats.most_used_apps.length > 0) {
        const mostUsedContainer = $('#most-used-apps');
        mostUsedContainer.empty();

        stats.most_used_apps.forEach(app => {
            const hours = Math.floor(app.total_time / 3600);
            const minutes = Math.floor((app.total_time % 3600) / 60);
            const formattedTime = `${hours}ч ${minutes}м`;

            mostUsedContainer.append(`
                <div class="most-used-item d-flex justify-content-between mb-2">
                    <span>${app.app_name}</span>
                    <span class="text-muted">${formattedTime}</span>
                </div>
            `);
        });
    } else {
        $('#most-used-apps').html('<div class="text-muted">Нет данных</div>');
    }
}

/**
 * Обновление метрик системных ресурсов
 */
function updateResourceMetrics(resourcesData) {
    if (!resourcesData || resourcesData.length === 0) {
        // Если данных нет, показываем пустые графики
        updateResourcesChart([], [], [], [], []);
        return;
    }

    // Подготавливаем данные для графика ресурсов
    const timestamps = [];
    const cpuValues = [];
    const memoryValues = [];
    const diskValues = [];
    const networkValues = [];

    resourcesData.forEach(resource => {
        const timestamp = new Date(resource.timestamp);
        timestamps.push(timestamp.toLocaleTimeString());
        cpuValues.push(resource.cpu_usage || 0);
        memoryValues.push(resource.memory_usage || 0);
        diskValues.push(resource.disk_usage || 0);
        networkValues.push(resource.network_usage || 0);
    });

    // Обновляем график ресурсов
    updateResourcesChart(timestamps, cpuValues, memoryValues, diskValues, networkValues);

    // Рассчитываем средние значения
    const avgCpu = cpuValues.reduce((a, b) => a + b, 0) / cpuValues.length;
    const avgMemory = memoryValues.reduce((a, b) => a + b, 0) / memoryValues.length;
    const avgDisk = diskValues.reduce((a, b) => a + b, 0) / diskValues.length;
    const avgNetwork = networkValues.reduce((a, b) => a + b, 0) / networkValues.length;

    // Обновляем показатели ресурсов
    $('#avg-cpu').text(`${avgCpu.toFixed(1)}%`);
    $('#avg-memory').text(`${avgMemory.toFixed(1)}%`);
    $('#avg-disk').text(`${avgDisk.toFixed(1)}%`);
    $('#avg-network').text(`${avgNetwork.toFixed(1)}%`);
}

/**
 * Обновление графика использования браузеров
 */
function updateBrowserUsageChart(browserNames, browserCounts, browserTimes) {
    const ctx = document.getElementById('browser-usage-chart');

    // Если график уже существует, уничтожаем его
    if (charts.browserUsage) {
        charts.browserUsage.destroy();
    }

    // Создаем новый график
    charts.browserUsage = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: browserNames,
            datasets: [
                {
                    label: 'Количество вкладок',
                    data: browserCounts,
                    backgroundColor: CHART_COLORS.blue,
                    borderColor: CHART_COLORS.blue.replace('0.8', '1'),
                    borderWidth: 1,
                    yAxisID: 'y'
                },
                {
                    label: 'Время использования (мин)',
                    data: browserTimes,
                    backgroundColor: CHART_COLORS.green,
                    borderColor: CHART_COLORS.green.replace('0.8', '1'),
                    borderWidth: 1,
                    yAxisID: 'y1'
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
                        text: 'Количество вкладок'
                    }
                },
                y1: {
                    beginAtZero: true,
                    position: 'right',
                    title: {
                        display: true,
                        text: 'Время (мин)'
                    },
                    grid: {
                        drawOnChartArea: false
                    }
                }
            }
        }
    });
}

/**
 * Обновление графика посещений сайтов
 */
function updateWebsiteVisitsChart(siteUrls, siteCounts) {
    const ctx = document.getElementById('website-visits-chart');

    // Если график уже существует, уничтожаем его
    if (charts.websiteVisits) {
        charts.websiteVisits.destroy();
    }

    // Сокращаем URL для отображения
    const shortUrls = siteUrls.map(url => {
        if (url.length > 30) {
            return url.substring(0, 27) + '...';
        }
        return url;
    });

    // Создаем новый график
    charts.websiteVisits = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: shortUrls,
            datasets: [{
                label: 'Количество посещений',
                data: siteCounts,
                backgroundColor: CHART_COLORS.purple,
                borderColor: CHART_COLORS.purple.replace('0.8', '1'),
                borderWidth: 1
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    beginAtZero: true
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            return `${context.raw} посещений`;
                        },
                        title: function (context) {
                            const index = context[0].dataIndex;
                            return siteUrls[index];
                        }
                    }
                }
            }
        }
    });
}

/**
 * Обновление графика использования приложений
 */
function updateAppUsageChart(appNames, appDurations) {
    const ctx = document.getElementById('app-usage-chart');

    // Если график уже существует, уничтожаем его
    if (charts.appUsage) {
        charts.appUsage.destroy();
    }

    // Создаем новый график
    charts.appUsage = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: appNames,
            datasets: [{
                label: 'Время использования (мин)',
                data: appDurations,
                backgroundColor: CHART_COLORS.orange,
                borderColor: CHART_COLORS.orange.replace('0.8', '1'),
                borderWidth: 1
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Время (мин)'
                    }
                }
            }
        }
    });
}

/**
 * Обновление графика использования офисных приложений
 */
function updateOfficeUsageChart(officeAppNames, officeAppCounts) {
    const ctx = document.getElementById('office-usage-chart');

    // Если график уже существует, уничтожаем его
    if (charts.officeUsage) {
        charts.officeUsage.destroy();
    }

    // Создаем новый график
    charts.officeUsage = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: officeAppNames,
            datasets: [{
                label: 'Количество документов',
                data: officeAppCounts,
                backgroundColor: [
                    CHART_COLORS.blue,
                    CHART_COLORS.green,
                    CHART_COLORS.red,
                    CHART_COLORS.orange,
                    CHART_COLORS.purple,
                    CHART_COLORS.yellow
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

/**
 * Обновление графика продуктивности
 */
function updateProductivityChart(dates, percentages) {
    const ctx = document.getElementById('productivity-chart');

    // Если график уже существует, уничтожаем его
    if (charts.productivity) {
        charts.productivity.destroy();
    }

    // Создаем новый график
    charts.productivity = new Chart(ctx, {
        type: 'line',
        data: {
            labels: dates,
            datasets: [{
                label: 'Продуктивность (%)',
                data: percentages,
                backgroundColor: CHART_COLORS.green,
                borderColor: CHART_COLORS.green.replace('0.8', '1'),
                borderWidth: 2,
                fill: false,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    title: {
                        display: true,
                        text: 'Продуктивность (%)'
                    }
                }
            }
        }
    });
}

/**
 * Обновление графика системных ресурсов
 */
function updateResourcesChart(timestamps, cpuValues, memoryValues, diskValues, networkValues) {
    const ctx = document.getElementById('resources-chart');

    // Если график уже существует, уничтожаем его
    if (charts.resources) {
        charts.resources.destroy();
    }

    // Создаем новый график
    charts.resources = new Chart(ctx, {
        type: 'line',
        data: {
            labels: timestamps,
            datasets: [
                {
                    label: 'CPU (%)',
                    data: cpuValues,
                    backgroundColor: CHART_COLORS.red.replace('0.8', '0.2'),
                    borderColor: CHART_COLORS.red.replace('0.8', '1'),
                    borderWidth: 2,
                    fill: true
                },
                {
                    label: 'Память (%)',
                    data: memoryValues,
                    backgroundColor: CHART_COLORS.blue.replace('0.8', '0.2'),
                    borderColor: CHART_COLORS.blue.replace('0.8', '1'),
                    borderWidth: 2,
                    fill: true
                },
                {
                    label: 'Диск (%)',
                    data: diskValues,
                    backgroundColor: CHART_COLORS.green.replace('0.8', '0.2'),
                    borderColor: CHART_COLORS.green.replace('0.8', '1'),
                    borderWidth: 2,
                    fill: true
                },
                {
                    label: 'Сеть (%)',
                    data: networkValues,
                    backgroundColor: CHART_COLORS.purple.replace('0.8', '0.2'),
                    borderColor: CHART_COLORS.purple.replace('0.8', '1'),
                    borderWidth: 2,
                    fill: true
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    title: {
                        display: true,
                        text: 'Использование (%)'
                    }
                }
            }
        }
    });
}

/**
 * Обновление таблицы с посещенными сайтами
 */
function updateWebsiteVisitsTable(websiteVisits) {
    const tableBody = $('#website-visits-table tbody');
    tableBody.empty();

    if (!websiteVisits || websiteVisits.length === 0) {
        tableBody.append('<tr><td colspan="4" class="text-center">Нет данных</td></tr>');
        return;
    }

    // Сортируем посещения по времени (последние сверху)
    websiteVisits.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Берем последние 50 посещений
    const recentVisits = websiteVisits.slice(0, 50);

    recentVisits.forEach(visit => {
        const timestamp = new Date(visit.timestamp);
        const timeString = timestamp.toLocaleTimeString();
        const dateString = timestamp.toLocaleDateString();

        tableBody.append(`
            <tr>
                <td>${timeString}<br><small class="text-muted">${dateString}</small></td>
                <td>${visit.browser || 'Неизвестно'}</td>
                <td class="text-truncate" style="max-width: 300px;">
                    <a href="${visit.url}" target="_blank" title="${visit.url}">${visit.url}</a>
                </td>
                <td>${visit.employee_name || 'Неизвестно'}</td>
            </tr>
        `);
    });
}

/**
 * Обновление таблицы с активностью приложений
 */
function updateAppActivityTable(windowActivity) {
    const tableBody = $('#app-activity-table tbody');
    tableBody.empty();

    if (!windowActivity || windowActivity.length === 0) {
        tableBody.append('<tr><td colspan="4" class="text-center">Нет данных</td></tr>');
        return;
    }

    // Сортируем активность по времени (последние сверху)
    windowActivity.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Берем последние 50 записей
    const recentActivity = windowActivity.slice(0, 50);

    recentActivity.forEach(activity => {
        const timestamp = new Date(activity.timestamp);
        const timeString = timestamp.toLocaleTimeString();
        const dateString = timestamp.toLocaleDateString();

        // Форматируем длительность
        const durationSeconds = activity.duration || 0;
        const minutes = Math.floor(durationSeconds / 60);
        const seconds = durationSeconds % 60;
        const durationString = `${minutes}м ${seconds}с`;

        tableBody.append(`
            <tr>
                <td>${timeString}<br><small class="text-muted">${dateString}</small></td>
                <td>${activity.app_name || 'Неизвестно'}</td>
                <td class="text-truncate" style="max-width: 300px;">${activity.window_title || 'Неизвестно'}</td>
                <td>${durationString}</td>
            </tr>
        `);
    });
}

/**
 * Обновление таблицы с офисными документами
 */
function updateOfficeDocsTable(officeActivity) {
    const tableBody = $('#office-docs-table tbody');
    tableBody.empty();

    if (!officeActivity || officeActivity.length === 0) {
        tableBody.append('<tr><td colspan="4" class="text-center">Нет данных</td></tr>');
        return;
    }

    // Сортируем активность по времени (последние сверху)
    officeActivity.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Берем последние 50 записей
    const recentActivity = officeActivity.slice(0, 50);

    recentActivity.forEach(activity => {
        const timestamp = new Date(activity.timestamp);
        const timeString = timestamp.toLocaleTimeString();
        const dateString = timestamp.toLocaleDateString();

        tableBody.append(`
            <tr>
                <td>${timeString}<br><small class="text-muted">${dateString}</small></td>
                <td>${activity.app_name || 'Неизвестно'}</td>
                <td class="text-truncate" style="max-width: 300px;">${activity.document_name || 'Неизвестно'}</td>
                <td>${activity.is_active ? 'Да' : 'Нет'}</td>
            </tr>
        `);
    });
}

/**
 * Обновление всех метрик
 */
async function refreshMetricsData(forceRefresh = false) {
    // Обновляем сводную информацию
    await loadDashboardSummary();

    // Обновляем детальные метрики для выбранного устройства
    const deviceId = $('#device-filter').val();
    if (deviceId) {
        await loadDetailedMetrics(deviceId, forceRefresh);
    }

    // Обновляем время последнего обновления
    $('#last-update').text(new Date().toLocaleTimeString());
}

/**
 * Отображение/скрытие индикатора загрузки
 */
function showLoading(isLoading) {
    if (isLoading) {
        $('#loading-indicator').show();
    } else {
        $('#loading-indicator').hide();
    }
}

/**
 * Отображение сообщения об ошибке
 */
function showError(message) {
    // Показываем сообщение об ошибке
    const errorAlert = $('#error-alert');
    errorAlert.text(message);
    errorAlert.fadeIn();

    // Автоматически скрываем через 5 секунд
    setTimeout(() => {
        errorAlert.fadeOut();
    }, 5000);
}

// Инициализация при загрузке страницы
$(document).ready(function () {
    initMetricsDashboard();
}); 