/**
 * Универсальный анализатор браузерной активности
 * Объединяет данные из browser_activity и window_activity с группировкой по времени
 */
class BrowserActivityManager {
    constructor() {
        this.chart = null;
        this.currentData = null;
        this.TIME_GROUPING_MINUTES = 1; // Группировка по 1 минуте
        this.MINIMUM_SESSION_DURATION = 3; // Минимум 3 секунды для сессии
    }

    /**
     * Основной метод анализа данных
     * Автоматически определяет источник и обрабатывает данные
     */
    analyzeData(data) {
        console.log('BrowserActivityManager: Начинаем анализ данных:', data);

        let unifiedSessions = [];

        // Приоритет: browser_activity -> window_activity -> массив активности
        if (data.browser_activity && Array.isArray(data.browser_activity) && data.browser_activity.length > 0) {
            console.log(`BrowserActivityManager: Обрабатываем ${data.browser_activity.length} записей browser_activity`);
            unifiedSessions = this.processBrowserActivity(data.browser_activity);
        } else if (data.activities && Array.isArray(data.activities) && data.activities.length > 0) {
            console.log(`BrowserActivityManager: Обрабатываем ${data.activities.length} записей window_activity`);
            const browserActivities = this.extractBrowserFromWindowActivity(data.activities);
            unifiedSessions = this.processWindowActivity(browserActivities);
        } else if (Array.isArray(data) && data.length > 0) {
            console.log(`BrowserActivityManager: Обрабатываем массив из ${data.length} активностей`);
            const browserActivities = this.extractBrowserFromWindowActivity(data);
            unifiedSessions = this.processWindowActivity(browserActivities);
        } else {
            console.log('BrowserActivityManager: Нет данных для анализа');
            return [];
        }

        // Группируем сессии по времени и домену
        const groupedSessions = this.groupSessionsByTimeAndDomain(unifiedSessions);

        // Фильтруем и сортируем
        const finalData = this.filterAndSortSessions(groupedSessions);

        console.log(`BrowserActivityManager: Финальный анализ: ${finalData.length} доменов`, finalData);
        return finalData;
    }

    /**
     * Обработка данных из таблицы browser_activity
     */
    processBrowserActivity(browserActivities) {
        console.log('BrowserActivityManager: Обрабатываем browser_activity');

        const sessions = [];

        browserActivities.forEach(activity => {
            const domain = this.extractDomainFromUrl(activity.url || activity.domain || '');
            if (!domain) return;

            const startTime = new Date(activity.start_time || activity.timestamp);
            const endTime = activity.end_time ? new Date(activity.end_time) :
                new Date(startTime.getTime() + (activity.duration || 60) * 1000);

            const duration = (endTime - startTime) / 1000; // в секундах

            if (duration >= this.MINIMUM_SESSION_DURATION) {
                sessions.push({
                    domain: domain,
                    title: activity.title || activity.window_title || domain,
                    url: activity.url || '',
                    browser: activity.browser_name || activity.browser || 'Unknown',
                    startTime: startTime,
                    endTime: endTime,
                    duration: duration,
                    category: this.categorizeWebsite(domain),
                    productivity: this.calculateWebsiteProductivity(domain),
                    source: 'browser_activity'
                });
            }
        });

        console.log(`BrowserActivityManager: Создано ${sessions.length} сессий из browser_activity`);
        return sessions;
    }

    /**
     * Обработка данных из window_activity
     */
    processWindowActivity(windowActivities) {
        console.log('BrowserActivityManager: Обрабатываем window_activity');

        const sessions = [];
        const groupedByDomain = new Map();

        // Группируем активности по домену и времени
        windowActivities.forEach(activity => {
            const domain = this.extractDomainFromTitle(activity.window_title || '');
            if (!domain) return;

            const timestamp = new Date(activity.timestamp);
            const duration = parseInt(activity.duration) || 60;

            // Группируем по доменам и временным периодам
            const timeKey = this.getTimeGroupKey(timestamp);
            const groupKey = `${domain}_${timeKey}`;

            if (!groupedByDomain.has(groupKey)) {
                groupedByDomain.set(groupKey, {
                    domain: domain,
                    activities: [],
                    totalDuration: 0,
                    firstSeen: timestamp,
                    lastSeen: timestamp,
                    titles: new Set(),
                    browser: this.identifyBrowserFromWindow(activity.application, activity.window_title)
                });
            }

            const group = groupedByDomain.get(groupKey);
            group.activities.push(activity);
            group.totalDuration += duration;
            group.titles.add(activity.window_title);

            if (timestamp < group.firstSeen) group.firstSeen = timestamp;
            if (timestamp > group.lastSeen) group.lastSeen = timestamp;
        });

        // Преобразуем группы в сессии
        for (const [key, group] of groupedByDomain) {
            if (group.totalDuration >= this.MINIMUM_SESSION_DURATION) {
                sessions.push({
                    domain: group.domain,
                    title: Array.from(group.titles)[0] || group.domain,
                    url: `http://${group.domain}`,
                    browser: group.browser,
                    startTime: group.firstSeen,
                    endTime: group.lastSeen,
                    duration: group.totalDuration, // ПРАВИЛЬНОЕ время - сумма всех активностей в группе
                    category: this.categorizeWebsite(group.domain),
                    productivity: this.calculateWebsiteProductivity(group.domain),
                    source: 'window_activity',
                    activitiesCount: group.activities.length
                });
            }
        }

        console.log(`BrowserActivityManager: Создано ${sessions.length} сессий из window_activity`);
        return sessions;
    }

    /**
     * Группировка сессий по времени и домену
     */
    groupSessionsByTimeAndDomain(sessions) {
        console.log('BrowserActivityManager: Группируем сессии по времени и домену');

        const grouped = new Map();

        sessions.forEach(session => {
            const domainKey = session.domain;

            if (!grouped.has(domainKey)) {
                grouped.set(domainKey, {
                    domain: session.domain,
                    totalDuration: 0,
                    sessionCount: 0,
                    totalActivities: 0,
                    visits: 0,
                    category: session.category,
                    productivity: session.productivity,
                    browsers: new Set(),
                    titles: new Set(),
                    urls: new Set(),
                    firstSeen: session.startTime,
                    lastSeen: session.endTime,
                    sessions: []
                });
            }

            const domainGroup = grouped.get(domainKey);

            // Объединяем данные - НЕ НАКАПЛИВАЕМ, а правильно считаем!
            domainGroup.totalDuration += session.duration; // Каждая сессия добавляет своё время
            domainGroup.sessionCount += 1;
            domainGroup.visits += 1;
            domainGroup.browsers.add(session.browser);
            domainGroup.titles.add(session.title);
            domainGroup.urls.add(session.url);
            domainGroup.sessions.push(session);

            if (session.activitiesCount) {
                domainGroup.totalActivities += session.activitiesCount;
            }

            // Обновляем временные границы
            if (session.startTime < domainGroup.firstSeen) {
                domainGroup.firstSeen = session.startTime;
            }
            if (session.endTime > domainGroup.lastSeen) {
                domainGroup.lastSeen = session.endTime;
            }
        });

        // Преобразуем в массив
        const result = Array.from(grouped.values()).map(group => ({
            domain: group.domain,
            totalDuration: Math.round(group.totalDuration), // Округляем до секунд
            sessionCount: group.sessionCount,
            totalActivities: group.totalActivities || group.sessionCount,
            visits: group.visits,
            category: group.category,
            productivity: group.productivity,
            browser: Array.from(group.browsers)[0] || 'Unknown',
            browsers: Array.from(group.browsers),
            title: Array.from(group.titles)[0] || group.domain,
            url: Array.from(group.urls)[0] || `http://${group.domain}`,
            firstSeen: group.firstSeen,
            lastSeen: group.lastSeen,
            sessions: group.sessions
        }));

        console.log(`BrowserActivityManager: Сгруппировано в ${result.length} доменов`);
        return result;
    }

    /**
     * Фильтрация и сортировка финальных данных
     */
    filterAndSortSessions(groupedSessions) {
        // Фильтруем по минимальному времени
        const filtered = groupedSessions.filter(site => {
            const isValid = site.totalDuration >= this.MINIMUM_SESSION_DURATION;
            if (!isValid) {
                console.log(`BrowserActivityManager: Фильтруем домен ${site.domain} (${site.totalDuration}с < ${this.MINIMUM_SESSION_DURATION}с)`);
            }
            return isValid;
        });

        // Сортируем по времени
        const sorted = filtered.sort((a, b) => b.totalDuration - a.totalDuration);

        // Берем топ-8 для отображения
        const top8 = sorted.slice(0, 8);

        console.log(`BrowserActivityManager: Итоговая статистика - ${filtered.length} доменов, показываем топ-${top8.length}`);
        top8.forEach((site, index) => {
            console.log(`${index + 1}. ${site.domain}: ${Math.round(site.totalDuration)}с, ${site.visits} посещений, браузер: ${site.browser}`);
        });

        return top8;
    }

    /**
     * Извлечение браузерной активности из window_activity
     */
    extractBrowserFromWindowActivity(activities) {
        return activities.filter(activity => {
            const appName = (activity.application || '').toLowerCase();
            const windowTitle = (activity.window_title || '').toLowerCase();

            return this.isBrowserApplication(appName) ||
                this.containsBrowserKeywords(windowTitle);
        });
    }

    /**
     * Проверка является ли приложение браузером
     */
    isBrowserApplication(appName) {
        const browserNames = [
            'chrome', 'firefox', 'edge', 'safari', 'opera', 'brave',
            'yandex', 'internet explorer', 'msedge', 'chromium'
        ];
        return browserNames.some(browser => appName.includes(browser));
    }

    /**
     * Проверка содержит ли заголовок браузерные ключевые слова
     */
    containsBrowserKeywords(title) {
        const browserKeywords = [
            'google chrome', 'mozilla firefox', 'microsoft edge',
            'safari', 'opera', 'brave', 'яндекс браузер'
        ];
        return browserKeywords.some(keyword => title.includes(keyword));
    }

    /**
     * Создание ключа для группировки по времени
     */
    getTimeGroupKey(timestamp) {
        const date = new Date(timestamp);
        // Группируем по минутам
        date.setSeconds(0, 0);
        return date.getTime();
    }

    /**
     * Извлечение домена из URL
     */
    extractDomainFromUrl(url) {
        if (!url) return null;

        try {
            // Добавляем протокол если его нет
            if (!url.startsWith('http://') && !url.startsWith('https://')) {
                url = 'http://' + url;
            }

            const urlObj = new URL(url);
            let domain = urlObj.hostname;

            // Убираем www.
            if (domain.startsWith('www.')) {
                domain = domain.substring(4);
            }

            return domain;
        } catch (e) {
            // Если URL невалидный, пытаемся извлечь домен вручную
            const match = url.match(/(?:https?:\/\/)?(?:www\.)?([^\/\s?#]+)/);
            return match ? match[1] : null;
        }
    }

    /**
     * Извлечение домена из заголовка окна
     */
    extractDomainFromTitle(windowTitle) {
        if (!windowTitle) return null;

        // Ищем URL в заголовке
        const urlPatterns = [
            /https?:\/\/(?:www\.)?([^\/\s?#]+)/,  // Полный URL
            /(?:www\.)?([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/,  // Домен
            /- ([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/  // Домен после тире
        ];

        for (const pattern of urlPatterns) {
            const match = windowTitle.match(pattern);
            if (match) {
                let domain = match[1];
                if (domain.startsWith('www.')) {
                    domain = domain.substring(4);
                }
                return domain;
            }
        }

        return null;
    }

    /**
     * Определение браузера из окна
     */
    identifyBrowserFromWindow(appName, windowTitle) {
        const app = (appName || '').toLowerCase();
        const title = (windowTitle || '').toLowerCase();

        if (app.includes('chrome') || title.includes('chrome')) return 'Chrome';
        if (app.includes('firefox') || title.includes('firefox')) return 'Firefox';
        if (app.includes('edge') || title.includes('edge')) return 'Edge';
        if (app.includes('safari') || title.includes('safari')) return 'Safari';
        if (app.includes('opera') || title.includes('opera')) return 'Opera';
        if (app.includes('brave') || title.includes('brave')) return 'Brave';
        if (app.includes('yandex') || title.includes('яндекс')) return 'Yandex';

        return 'Unknown';
    }

    /**
     * Категоризация веб-сайта
     */
    categorizeWebsite(domain) {
        if (!domain) return 'Неизвестно';

        // Социальные сети
        if (['facebook.com', 'instagram.com', 'twitter.com', 'linkedin.com', 'vk.com', 'telegram.org'].some(social => domain.includes(social))) {
            return 'Социальные сети';
        }

        // Видео и развлечения
        if (['youtube.com', 'netflix.com', 'twitch.tv', 'rutube.ru'].some(video => domain.includes(video))) {
            return 'Видео и развлечения';
        }

        // Работа и продуктивность
        if (['github.com', 'stackoverflow.com', 'docs.google.com', 'office.com', 'notion.so'].some(work => domain.includes(work))) {
            return 'Работа и продуктивность';
        }

        // Поисковые системы
        if (['google.com', 'yandex.ru', 'bing.com', 'duckduckgo.com'].some(search => domain.includes(search))) {
            return 'Поисковые системы';
        }

        // Новости
        if (['bbc.com', 'cnn.com', 'lenta.ru', 'rbc.ru', 'ria.ru'].some(news => domain.includes(news))) {
            return 'Новости';
        }

        return 'Другое';
    }

    /**
     * Расчет продуктивности веб-сайта
     */
    calculateWebsiteProductivity(domain) {
        if (!domain) return 50;

        // Высокопродуктивные сайты
        const productive = ['github.com', 'stackoverflow.com', 'docs.google.com', 'office.com', 'notion.so', 'jira.'];
        if (productive.some(site => domain.includes(site))) {
            return 90;
        }

        // Средняя продуктивность
        const neutral = ['google.com', 'yandex.ru', 'wikipedia.org'];
        if (neutral.some(site => domain.includes(site))) {
            return 70;
        }

        // Низкопродуктивные сайты
        const unproductive = ['youtube.com', 'facebook.com', 'instagram.com', 'twitter.com', 'vk.com', 'twitch.tv'];
        if (unproductive.some(site => domain.includes(site))) {
            return 20;
        }

        return 50; // По умолчанию
    }

    /**
     * Основной метод обновления графика
     */
    updateChart(data) {
        console.log('BrowserActivityManager: Обновляем график');

        this.currentData = data;

        // Анализируем данные
        const processedData = this.analyzeData(data);

        if (processedData.length === 0) {
            console.log('BrowserActivityManager: Нет данных для отображения');
            this.showNoDataMessage();
            return;
        }

        // Отображаем график
        this.renderChart(processedData);
    }

    /**
     * Отображение графика
     */
    renderChart(sites) {
        console.log('BrowserActivityManager: Отображаем график для', sites.length, 'сайтов');

        const container = document.getElementById('browser-stats-container');
        if (!container) {
            console.error('BrowserActivityManager: Контейнер browser-stats-container не найден');
            return;
        }

        // Очищаем контейнер
        container.innerHTML = '';

        // Создаем график
        const chartDiv = document.createElement('div');
        chartDiv.id = 'browser-activity-chart';
        chartDiv.style.height = '300px';
        chartDiv.style.marginBottom = '20px';
        container.appendChild(chartDiv);

        // Подготавливаем данные для Plotly
        const labels = sites.map(site => site.domain);
        const values = sites.map(site => Math.round(site.totalDuration / 60)); // Конвертируем в минуты
        const colors = sites.map(site => this.getSiteColor(site));

        const data = [{
            type: 'pie',
            labels: labels,
            values: values,
            marker: {
                colors: colors
            },
            textinfo: 'label+percent',
            textposition: 'outside',
            hole: 0.3
        }];

        const layout = {
            title: {
                text: 'Время, проведенное на сайтах',
                font: { size: 16 }
            },
            showlegend: false,
            margin: { t: 50, b: 50, l: 50, r: 50 }
        };

        Plotly.newPlot('browser-activity-chart', data, layout, { responsive: true });

        // Создаем таблицу с деталями
        this.renderDetailsTable(sites, container);
    }

    /**
     * Создание таблицы с деталями
     */
    renderDetailsTable(sites, container) {
        const tableDiv = document.createElement('div');
        tableDiv.innerHTML = `
            <h6 class="mb-3">Детальная статистика</h6>
            <div class="table-responsive">
                <table class="table table-sm">
                    <thead>
                        <tr>
                            <th>Сайт</th>
                            <th>Время</th>
                            <th>Посещения</th>
                            <th>Браузер</th>
                            <th>Категория</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${sites.map(site => `
                            <tr style="cursor: pointer;" onclick="window.browserActivityManager.showSiteDetails('${site.domain}')">
                                <td>
                                    <div class="d-flex align-items-center">
                                        <div class="me-2" style="width: 12px; height: 12px; background-color: ${this.getSiteColor(site)}; border-radius: 50%;"></div>
                                        <span class="fw-bold">${site.domain}</span>
                                    </div>
                                </td>
                                <td>${this.formatDuration(site.totalDuration)}</td>
                                <td>${site.visits}</td>
                                <td>
                                    <span class="badge bg-secondary">${site.browser}</span>
                                </td>
                                <td>
                                    <span class="badge ${this.getCategoryBadgeClass(site.category)}">${site.category}</span>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
        container.appendChild(tableDiv);
    }

    /**
     * Получение цвета для сайта
     */
    getSiteColor(site) {
        const colors = [
            '#3498db', '#e74c3c', '#2ecc71', '#f39c12',
            '#9b59b6', '#1abc9c', '#e67e22', '#34495e'
        ];

        // Генерируем индекс на основе домена
        let hash = 0;
        for (let i = 0; i < site.domain.length; i++) {
            hash = site.domain.charCodeAt(i) + ((hash << 5) - hash);
        }
        return colors[Math.abs(hash) % colors.length];
    }

    /**
     * Получение класса badge для категории
     */
    getCategoryBadgeClass(category) {
        const categoryClasses = {
            'Работа и продуктивность': 'bg-success',
            'Поисковые системы': 'bg-info',
            'Социальные сети': 'bg-warning',
            'Видео и развлечения': 'bg-danger',
            'Новости': 'bg-primary',
            'Другое': 'bg-secondary'
        };
        return categoryClasses[category] || 'bg-secondary';
    }

    /**
     * Форматирование продолжительности
     */
    formatDuration(seconds) {
        if (seconds < 60) {
            return `${Math.round(seconds)}с`;
        } else if (seconds < 3600) {
            const minutes = Math.round(seconds / 60);
            return `${minutes}м`;
        } else {
            const hours = Math.floor(seconds / 3600);
            const minutes = Math.round((seconds % 3600) / 60);
            return `${hours}ч ${minutes}м`;
        }
    }

    /**
     * Показ деталей сайта
     */
    showSiteDetails(domain) {
        const site = this.currentData?.find(s => s.domain === domain);
        if (!site) {
            console.warn('BrowserActivityManager: Сайт не найден:', domain);
            return;
        }

        console.log('BrowserActivityManager: Показываем детали для:', domain, site);

        alert(`Детали для ${domain}:\n\nВремя: ${this.formatDuration(site.totalDuration)}\nПосещения: ${site.visits}\nБраузер: ${site.browser}\nКатегория: ${site.category}\nПродуктивность: ${site.productivity}%`);
    }

    /**
     * Показ сообщения об отсутствии данных
     */
    showNoDataMessage() {
        const container = document.getElementById('browser-stats-container');
        if (container) {
            container.innerHTML = `
                <div class="alert alert-info text-center">
                    <i class="bi bi-info-circle"></i>
                    <p class="mb-0 mt-2">Нет данных о браузерной активности</p>
                    <small class="text-muted">Попробуйте выбрать другой период или устройство</small>
                </div>
            `;
        }
    }
}

// Глобальный экземпляр
window.browserActivityManager = new BrowserActivityManager(); 