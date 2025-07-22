/**
 * dashboard-timesheet.js - Модуль для работы с табелем учета рабочего времени
 * Этот файл реализует расширенную функциональность для табеля учёта рабочего времени
 * с учётом активности программ, папок и мыши.
 */

// Основные константы для работы с продуктивностью
const TIMESHEET = {
    // Стандартное рабочее время в часах
    STANDARD_WORK_DAY: 8,

    // Минимальное значение движений мыши для учета активности (в минуту)
    MIN_MOUSE_MOVEMENTS: 10,

    // Минимальное значение кликов мыши для учета активности (в минуту)
    MIN_MOUSE_CLICKS: 2,

    // Минимальное время активности для учета в рабочем дне (в минутах)
    MIN_ACTIVITY_TIME: 5,

    // Максимальный перерыв между активностями, чтобы считать их непрерывными (в минутах)
    MAX_BREAK_TIME: 15
};

// Constants for session management
const SESSION_CONFIG = {
    // Minimum time in minutes to consider as a focus session
    MIN_FOCUS_SESSION: 5,
    // Maximum idle time in minutes before breaking a session
    MAX_IDLE_TIME: 3,
    // Minimum break time in minutes to consider as a real break
    MIN_BREAK_TIME: 2
};

/**
 * Класс для управления данными и расчетами табеля
 */
class TimesheetManager {
    constructor() {
        this.timesheetData = [];
        this.periodStart = null;
        this.periodEnd = null;
        this.selectedEmployeeId = null;
        this.selectedDeviceId = null;
    }

    /**
     * Загружает данные для табеля за выбранный период
     * @param {string} startDate - Дата начала периода в формате YYYY-MM-DD
     * @param {string} endDate - Дата конца периода в формате YYYY-MM-DD
     * @param {string} employeeId - ID сотрудника (опционально)
     * @param {string} deviceId - ID устройства (опционально)
     * @returns {Promise} - Промис с данными табеля
     */
    async loadTimesheetData(startDate, endDate, employeeId = '', deviceId = '') {
        try {
            this.periodStart = startDate;
            this.periodEnd = endDate;
            this.selectedEmployeeId = employeeId;
            this.selectedDeviceId = deviceId;

            console.log(`Загружаем табель за период: ${startDate} - ${endDate}`);
            console.log(`Фильтры: employeeId=${employeeId}, deviceId=${deviceId}`);

            // Сначала пробуем основной эндпоинт для табеля
            const params = new URLSearchParams({
                start_date: startDate,
                end_date: endDate
            });

            if (employeeId) params.append('employee_id', employeeId);
            if (deviceId) params.append('device_id', deviceId);

            console.log(`Запрос к API: /api/public/timesheet/activity?${params.toString()}`);

            try {
                const timesheetResponse = await fetch(`/api/public/timesheet/activity?${params.toString()}`);
                if (timesheetResponse.ok) {
                    const timesheetData = await timesheetResponse.json();
                    console.log('Получены данные от основного API табеля:', timesheetData);

                    if (timesheetData && Array.isArray(timesheetData) && timesheetData.length > 0) {
                        // Преобразуем данные в нужный формат
                        this.timesheetData = this.processTimesheetApiData(timesheetData);
                        return this.timesheetData;
                    }
                }
                console.warn('Основной API табеля не вернул данные, переходим к альтернативному методу');
            } catch (error) {
                console.warn('Ошибка при обращении к основному API табеля:', error);
            }

            // Альтернативный метод: собираем данные из отдельных эндпоинтов
            console.log('Используем альтернативный метод сбора данных...');

            // Генерируем массив дат для периода
            const dateRange = this.generateDateRange(startDate, endDate);
            console.log(`Период включает ${dateRange.length} дней:`, dateRange);

            const timesheetData = [];

            // Загружаем данные для каждого дня
            for (const date of dateRange) {
                console.log(`Загружаем данные за ${date}...`);

                const dayData = await this.loadDayData(date, employeeId, deviceId);

                if (dayData) {
                    timesheetData.push(dayData);
                    console.log(`Данные за ${date} загружены:`, dayData);
                } else {
                    console.log(`Нет данных за ${date}`);
                }
            }

            console.log(`Всего загружено данных за ${timesheetData.length} дней`);

            // Проверяем, есть ли данные
            if (timesheetData.length === 0) {
                console.log('Нет данных за весь период');
                this.timesheetData = [];
                return [];
            }

            // Загружаем данные об активности мыши за весь период
            let mouseActivityData = [];
            try {
                const mouseParams = new URLSearchParams({
                    start_date: startDate,
                    end_date: endDate
                });

                if (employeeId) mouseParams.append('employee_id', employeeId);
                if (deviceId) mouseParams.append('device_id', deviceId);

                const mouseActivityResponse = await fetch(`/api/public/activity/mouse?${mouseParams.toString()}`);
                if (mouseActivityResponse.ok) {
                    mouseActivityData = await mouseActivityResponse.json();
                    console.log('Получены данные активности мыши:', mouseActivityData.length, 'записей');
                } else {
                    console.warn('Не удалось загрузить данные активности мыши');
                }
            } catch (mouseError) {
                console.warn('Ошибка при загрузке данных активности мыши:', mouseError);
            }

            // Объединяем данные табеля с данными активности мыши
            this.timesheetData = this.processTimesheetData(timesheetData, mouseActivityData);

            return this.timesheetData;
        } catch (error) {
            console.error('Ошибка при обработке данных табеля:', error);
            this.timesheetData = [];
            return [];
        }
    }

    /**
     * Обрабатывает данные полученные от API табеля
     * @param {Array} apiData - Данные от API
     * @returns {Array} - Обработанные данные
     */
    processTimesheetApiData(apiData) {
        console.log('Обрабатываем данные API табеля:', apiData);

        return apiData.map(dayData => {
            const activities = dayData.activities || [];
            let totalDuration = 0;
            let productiveTime = 0;

            // Обрабатываем активности
            const processedActivities = activities.map(activity => {
                const duration = parseInt(activity.duration || 0);
                totalDuration += duration;

                // Простая оценка продуктивности
                const productivity = this.calculateActivityProductivity(activity);
                productiveTime += duration * (productivity / 100);

                return {
                    ...activity,
                    type: 'window',
                    application: activity.app_name || 'Неизвестно',
                    window_title: activity.window_title || '',
                    timestamp: activity.timestamp,
                    duration: duration
                };
            });

            // Рассчитываем общую продуктивность
            const overallProductivity = totalDuration > 0 ? (productiveTime / totalDuration) * 100 : 0;

            return {
                date: dayData.date,
                activities: processedActivities,
                work_time: totalDuration,
                duration: totalDuration,
                total_duration: totalDuration,
                productivity: Math.round(overallProductivity),
                employee_name: activities[0]?.employee_name || 'Неизвестно',
                device_name: activities[0]?.device_id || 'Неизвестно',
                employee_id: this.selectedEmployeeId,
                device_id: this.selectedDeviceId
            };
        });
    }

    /**
     * Генерирует массив дат в заданном диапазоне
     * @param {string} startDate - Дата начала в формате YYYY-MM-DD
     * @param {string} endDate - Дата конца в формате YYYY-MM-DD
     * @returns {Array} - Массив дат в формате YYYY-MM-DD
     */
    generateDateRange(startDate, endDate) {
        const dates = [];
        const start = new Date(startDate);
        const end = new Date(endDate);

        // Убеждаемся, что даты корректны
        if (start > end) {
            console.warn('Дата начала больше даты окончания');
            return [];
        }

        const currentDate = new Date(start);
        while (currentDate <= end) {
            dates.push(currentDate.toISOString().split('T')[0]);
            currentDate.setDate(currentDate.getDate() + 1);
        }

        return dates;
    }

    /**
     * Загружает данные за конкретный день
     * @param {string} date - Дата в формате YYYY-MM-DD
     * @param {string} employeeId - ID сотрудника (опционально)
     * @param {string} deviceId - ID устройства (опционально)
     * @returns {Promise<Object>} - Данные за день
     */
    async loadDayData(date, employeeId = '', deviceId = '') {
        try {
            console.log(`🔄 Загружаем данные за ${date} для сотрудника ${employeeId || 'все'} на устройстве ${deviceId || 'все'}`);

            // Формируем параметры запроса
            const params = new URLSearchParams({
                start_date: date,
                end_date: date
            });

            if (employeeId) params.append('employee_id', employeeId);
            if (deviceId) params.append('device_id', deviceId);

            // Загружаем данные параллельно из существующих API эндпоинтов
            const [windowsResponse, browserResponse, websiteVisitsResponse] = await Promise.all([
                fetch(`/api/public/activity/windows?${params.toString()}`).catch(err => {
                    console.warn(`❌ Ошибка загрузки активности окон за ${date}:`, err);
                    return { ok: false };
                }),
                fetch(`/api/public/activity/browsers?${params.toString()}`).catch(err => {
                    console.warn(`❌ Ошибка загрузки активности браузеров за ${date}:`, err);
                    return { ok: false };
                }),
                fetch(`/api/public/activity/website_visits?${params.toString()}`).catch(err => {
                    console.warn(`❌ Ошибка загрузки посещений сайтов за ${date}:`, err);
                    return { ok: false };
                })
            ]);

            // Собираем все активности
            const activities = [];
            let totalDuration = 0;
            let productiveTime = 0;

            // Обрабатываем активность окон (исключая браузеры)
            if (windowsResponse && windowsResponse.ok) {
                const windowsData = await windowsResponse.json();
                console.log(`📊 Активность окон за ${date}:`, windowsData.length, 'записей');

                if (Array.isArray(windowsData)) {
                    const nonBrowserWindows = windowsData.filter(activity => {
                        const appName = (activity.app_name || activity.process_name || activity.application || '').toLowerCase();
                        return !this.isBrowserApplication(appName);
                    });

                    console.log(`📱 Исключено ${windowsData.length - nonBrowserWindows.length} браузерных окон из оконной активности`);

                    nonBrowserWindows.forEach(activity => {
                        const duration = parseInt(activity.duration || activity.total_time || activity.active_time || 0);
                        if (duration <= 0) return;

                        activities.push({
                            ...activity,
                            type: 'window',
                            application: activity.app_name || activity.process_name || activity.application || 'Неизвестно',
                            window_title: activity.window_title || activity.title || '',
                            timestamp: activity.timestamp || activity.start_time,
                            duration: duration,
                            employee_name: activity.employee_name,
                            device_name: activity.device_id || activity.computer_name
                        });
                        totalDuration += duration;

                        // Простая оценка продуктивности
                        const productivity = this.calculateActivityProductivity(activity);
                        productiveTime += duration * (productivity / 100);
                    });

                    console.log(`✅ Обработано ${nonBrowserWindows.length} небраузерных окон`);
                }
            }

            // Обрабатываем активность браузеров - ИСПРАВЛЕННАЯ ЛОГИКА
            if (browserResponse && browserResponse.ok) {
                const browserData = await browserResponse.json();
                console.log(`🌐 Активность браузеров за ${date}:`, browserData.length, 'записей');

                if (Array.isArray(browserData) && browserData.length > 0) {
                    console.log(`🌐 Обработка ${browserData.length} записей браузерной активности`);

                    // Группируем браузерные активности по браузеру и времени
                    const browserSessions = this.mergeBrowserSessions(browserData);

                    console.log(`🔗 Объединено в ${browserSessions.length} уникальных браузерных сессий`);

                    for (const session of browserSessions) {
                        const duration = session.duration;
                        totalDuration += duration;

                        // Рассчитываем продуктивность для браузерной активности
                        const productivity = this.calculateWebsiteProductivity(session.url);
                        productiveTime += (duration * productivity) / 100;

                        activities.push({
                            type: 'browser',
                            timestamp: session.start_time,
                            end_time: session.end_time,
                            duration: duration,
                            application: session.browser,
                            window_title: session.title || session.url || 'Браузер',
                            url: session.url,
                            productivity: productivity,
                            employee_id: employeeId,
                            device_id: deviceId
                        });
                    }
                }
            }

            // Обрабатываем посещения сайтов (только если они не дублируют браузерную активность)
            if (websiteVisitsResponse && websiteVisitsResponse.ok) {
                const websiteVisitsData = await websiteVisitsResponse.json();
                console.log(`🔗 Посещения сайтов за ${date}:`, websiteVisitsData.length, 'записей');

                if (Array.isArray(websiteVisitsData)) {
                    websiteVisitsData.forEach(visit => {
                        // Для посещений сайтов используем время из поля duration или базовое значение
                        const duration = parseInt(visit.duration || visit.time_spent || 30); // 30 секунд по умолчанию

                        activities.push({
                            ...visit,
                            type: 'website',
                            application: 'Веб-сайт',
                            window_title: visit.url || visit.title || '',
                            timestamp: visit.timestamp || visit.start_time,
                            duration: duration,
                            employee_name: visit.employee_name,
                            device_name: visit.device_id || visit.computer_name
                        });
                        totalDuration += duration;

                        // Оценка продуктивности по URL
                        const productivity = this.calculateWebsiteProductivity(visit.url || '');
                        productiveTime += duration * (productivity / 100);
                    });
                }
            }

            // Если нет активностей, возвращаем null
            if (activities.length === 0) {
                console.log(`📭 Нет активностей за ${date}`);
                return null;
            }

            // Сортируем активности по времени
            activities.sort((a, b) => {
                const timeA = new Date(a.timestamp || 0);
                const timeB = new Date(b.timestamp || 0);
                return timeA - timeB;
            });

            // Рассчитываем общую продуктивность
            const overallProductivity = totalDuration > 0 ? (productiveTime / totalDuration) * 100 : 0;

            // Получаем информацию о сотруднике и устройстве из первой активности
            const firstActivity = activities[0];
            const employeeName = firstActivity.employee_name || 'Неизвестно';
            const deviceName = firstActivity.device_name || firstActivity.computer_name || 'Неизвестно';

            const dayResult = {
                date: date,
                activities: activities,
                work_time: totalDuration, // в секундах
                duration: totalDuration,
                total_duration: totalDuration,
                productivity: Math.round(overallProductivity),
                employee_name: employeeName,
                device_name: deviceName,
                employee_id: employeeId || firstActivity.employee_id,
                device_id: deviceId || firstActivity.device_id
            };

            console.log(`Сформированы данные за ${date}:`, {
                activities: activities.length,
                totalDuration: totalDuration,
                productivity: Math.round(overallProductivity)
            });

            return dayResult;

        } catch (error) {
            console.error(`Ошибка при загрузке данных за ${date}:`, error);
            return null;
        }
    }

    /**
     * Рассчитывает продуктивность активности
     * @param {Object} activity - Активность
     * @returns {number} - Продуктивность в процентах (0-100)
     */
    calculateActivityProductivity(activity) {
        const appName = (activity.application || activity.app_name || '').toLowerCase();
        const windowTitle = (activity.window_title || activity.title || '').toLowerCase();

        // Продуктивные приложения
        const productiveApps = [
            'code', 'visual studio', 'intellij', 'pycharm', 'webstorm', 'sublime',
            'notepad++', 'atom', 'brackets', 'vim', 'emacs',
            'word', 'excel', 'powerpoint', 'libreoffice', 'openoffice',
            'photoshop', 'illustrator', 'figma', 'sketch',
            'slack', 'teams', 'zoom', 'skype', 'discord',
            'outlook', 'thunderbird', 'gmail'
        ];

        // Развлекательные приложения
        const entertainmentApps = [
            'youtube', 'netflix', 'spotify', 'steam', 'game',
            'facebook', 'instagram', 'twitter', 'tiktok',
            'vlc', 'media player', 'movies', 'music'
        ];

        // Проверяем приложение
        for (const productiveApp of productiveApps) {
            if (appName.includes(productiveApp)) {
                return 85; // Высокая продуктивность
            }
        }

        for (const entertainmentApp of entertainmentApps) {
            if (appName.includes(entertainmentApp) || windowTitle.includes(entertainmentApp)) {
                return 15; // Низкая продуктивность
            }
        }

        // Средняя продуктивность для остальных
        return 50;
    }

    /**
     * Рассчитывает продуктивность посещения сайта
     * @param {string} url - URL сайта
     * @returns {number} - Продуктивность в процентах (0-100)
     */
    calculateWebsiteProductivity(url) {
        if (!url) return 50;

        const urlLower = url.toLowerCase();

        // Продуктивные сайты
        const productiveSites = [
            'github.com', 'stackoverflow.com', 'docs.microsoft.com', 'developer.mozilla.org',
            'w3schools.com', 'codecademy.com', 'coursera.org', 'udemy.com',
            'linkedin.com', 'indeed.com', 'glassdoor.com',
            'google.com/search', 'bing.com/search', 'duckduckgo.com',
            'wikipedia.org', 'medium.com', 'dev.to'
        ];

        // Развлекательные сайты
        const entertainmentSites = [
            'youtube.com', 'netflix.com', 'facebook.com', 'instagram.com',
            'twitter.com', 'tiktok.com', 'reddit.com', 'twitch.tv',
            'vk.com', 'ok.ru', 'pikabu.ru'
        ];

        // Проверяем продуктивные сайты
        for (const site of productiveSites) {
            if (urlLower.includes(site)) {
                return 80;
            }
        }

        // Проверяем развлекательные сайты
        for (const site of entertainmentSites) {
            if (urlLower.includes(site)) {
                return 20;
            }
        }

        // Средняя продуктивность для остальных сайтов
        return 55;
    }

    /**
     * Объединяет данные табеля с данными о мышиной активности
     * @param {Array} timesheetData - Данные табеля
     * @param {Array} mouseActivityData - Данные активности мыши
     * @returns {Array} - Обработанные данные табеля
     */
    processTimesheetData(timesheetData, mouseActivityData) {
        // Группируем данные мышиной активности по дате
        const mouseActivityByDate = this.groupMouseActivityByDate(mouseActivityData);

        // Для каждой записи в табеле добавляем информацию о мышиной активности
        return timesheetData.map(entry => {
            const entryDate = entry.date || entry.day || (entry.timestamp ? new Date(entry.timestamp).toISOString().split('T')[0] : null);

            if (!entryDate) return entry;

            const mouseActivity = mouseActivityByDate[entryDate] || [];
            const mouseStats = this.calculateMouseActivityStats(mouseActivity);

            // Рассчитываем фокус-сессии для дня, если есть активности
            let focusSessions = { sessions: [], totalSessionTime: 0, averageSessionDuration: 0 };
            if (entry.activities && entry.activities.length > 0) {
                focusSessions = calculateFocusSessions(entry.activities);
            }

            return {
                ...entry,
                mouse_activity: mouseStats,
                // Корректируем продуктивность с учетом мышиной активности
                adjusted_productivity: this.adjustProductivityWithMouseActivity(entry, mouseStats),
                // Корректируем время работы с учетом мышиной активности
                adjusted_work_time: this.calculateAdjustedWorkTime(entry, mouseStats),
                // Добавляем информацию о фокус-сессиях
                focus_sessions: focusSessions
            };
        });
    }

    /**
     * Группирует данные о мышиной активности по датам
     * @param {Array} mouseActivityData - Массив записей о мышиной активности
     * @returns {Object} - Объект, где ключи - даты, значения - массивы записей за эту дату
     */
    groupMouseActivityByDate(mouseActivityData) {
        const result = {};

        if (!mouseActivityData || !Array.isArray(mouseActivityData)) return result;

        mouseActivityData.forEach(activity => {
            if (!activity.timestamp) return;

            const date = new Date(activity.timestamp);
            const dateStr = date.toISOString().split('T')[0];

            if (!result[dateStr]) {
                result[dateStr] = [];
            }

            result[dateStr].push(activity);
        });

        return result;
    }

    /**
     * Рассчитывает статистику мышиной активности за день
     * @param {Array} mouseActivities - Массив записей о мышиной активности за день
     * @returns {Object} - Статистика активности мыши
     */
    calculateMouseActivityStats(mouseActivities) {
        console.log('🖱️ Расчет статистики мышиной активности для', mouseActivities.length, 'записей');

        if (!mouseActivities || !Array.isArray(mouseActivities) || mouseActivities.length === 0) {
            console.log('📊 Нет данных о мышиной активности');
            return {
                total_clicks: 0,
                total_movements: 0,
                total_distance: 0,
                idle_periods: 0,
                total_idle_time: 0,
                activity_score: 0,
                last_activity: null
            };
        }

        let totalClicks = 0;
        let totalMovements = 0;
        let totalDistance = 0;
        let idlePeriods = 0;
        let totalIdleTime = 0;
        let lastActivity = null;

        // Сортируем по времени
        const sortedActivities = mouseActivities.sort((a, b) => {
            const timeA = new Date(a.timestamp || 0);
            const timeB = new Date(b.timestamp || 0);
            return timeA - timeB;
        });

        let previousX = null;
        let previousY = null;
        let lastActivityTime = null;

        for (const activity of sortedActivities) {
            if (!activity.timestamp) continue;

            const currentTime = new Date(activity.timestamp);

            // Учитываем клики
            if (activity.click_count && activity.click_count > 0) {
                totalClicks += parseInt(activity.click_count) || 0;
            }

            // Учитываем движения мыши
            if (activity.x !== undefined && activity.y !== undefined) {
                totalMovements++;

                // Рассчитываем расстояние, если есть предыдущая позиция
                if (previousX !== null && previousY !== null) {
                    const distance = Math.sqrt(
                        Math.pow(activity.x - previousX, 2) +
                        Math.pow(activity.y - previousY, 2)
                    );
                    totalDistance += distance;
                }

                previousX = activity.x;
                previousY = activity.y;
            }

            // Определяем периоды бездействия
            if (lastActivityTime) {
                const timeDiff = (currentTime - lastActivityTime) / 1000; // в секундах

                // Если прошло более 30 секунд - считаем это периодом бездействия
                if (timeDiff > 30) {
                    idlePeriods++;
                    totalIdleTime += timeDiff;
                }
            }

            lastActivityTime = currentTime;
            lastActivity = activity.timestamp;
        }

        // Рассчитываем общий балл активности (0-100)
        const timeSpan = sortedActivities.length > 1 ?
            (new Date(sortedActivities[sortedActivities.length - 1].timestamp) -
                new Date(sortedActivities[0].timestamp)) / 1000 / 60 : 1; // в минутах

        const clicksPerMinute = totalClicks / Math.max(timeSpan, 1);
        const movementsPerMinute = totalMovements / Math.max(timeSpan, 1);

        // Нормализуем показатели
        const normalizedClicks = Math.min(clicksPerMinute / 5, 1) * 40; // до 40 баллов за клики
        const normalizedMovements = Math.min(movementsPerMinute / 60, 1) * 40; // до 40 баллов за движения
        const idlePenalty = Math.min((totalIdleTime / timeSpan / 60) * 20, 20); // штраф до 20 баллов

        const activityScore = Math.max(0, Math.min(100, normalizedClicks + normalizedMovements - idlePenalty));

        const result = {
            total_clicks: totalClicks,
            total_movements: totalMovements,
            total_distance: Math.round(totalDistance),
            idle_periods: idlePeriods,
            total_idle_time: Math.round(totalIdleTime),
            activity_score: Math.round(activityScore),
            last_activity: lastActivity
        };

        console.log('📊 Статистика мышиной активности:', result);
        return result;
    }

    /**
     * Корректирует продуктивность с учетом мышиной активности
     * @param {Object} entry - Запись табеля
     * @param {Object} mouseStats - Статистика мышиной активности
     * @returns {number} - Скорректированная продуктивность
     */
    adjustProductivityWithMouseActivity(entry, mouseStats) {
        console.log('🔧 Корректировка продуктивности с учетом мышиной активности');

        const originalProductivity = entry.productivity || 0;

        if (!mouseStats || mouseStats.activity_score === undefined) {
            console.log('📊 Нет данных о мышиной активности, используем исходную продуктивность:', originalProductivity);
            return originalProductivity;
        }

        // Получаем балл активности мыши (0-100)
        const activityScore = mouseStats.activity_score;

        // Корректируем продуктивность на основе активности мыши
        let adjustedProductivity = originalProductivity;

        if (activityScore < 20) {
            // Очень низкая активность - снижаем продуктивность на 30%
            adjustedProductivity = originalProductivity * 0.7;
        } else if (activityScore < 40) {
            // Низкая активность - снижаем продуктивность на 15%
            adjustedProductivity = originalProductivity * 0.85;
        } else if (activityScore > 80) {
            // Высокая активность - увеличиваем продуктивность на 10%
            adjustedProductivity = Math.min(100, originalProductivity * 1.1);
        }

        const result = Math.round(adjustedProductivity);
        console.log(`📈 Продуктивность скорректирована: ${originalProductivity}% → ${result}% (активность: ${activityScore})`);

        return result;
    }

    /**
     * Рассчитывает скорректированное время работы с учетом мышиной активности
     * @param {Object} entry - Запись табеля
     * @param {Object} mouseStats - Статистика мышиной активности
     * @returns {number} - Скорректированное время работы в секундах
     */
    calculateAdjustedWorkTime(entry, mouseStats) {
        console.log('⏰ Расчет скорректированного времени работы');

        const originalWorkTime = entry.work_time || entry.duration || 0;

        if (!mouseStats || mouseStats.total_idle_time === undefined) {
            console.log('📊 Нет данных о простое, используем исходное время:', originalWorkTime);
            return originalWorkTime;
        }

        // Вычитаем время простоя из общего времени работы
        let adjustedWorkTime = originalWorkTime - mouseStats.total_idle_time;

        // Убеждаемся, что время не может быть отрицательным
        adjustedWorkTime = Math.max(0, adjustedWorkTime);

        // Если простой составляет более 50% от времени, считаем это подозрительным
        const idlePercentage = (mouseStats.total_idle_time / originalWorkTime) * 100;
        if (idlePercentage > 50) {
            console.warn(`⚠️ Большой процент простоя: ${Math.round(idlePercentage)}%`);
            // В этом случае используем более консервативную оценку
            adjustedWorkTime = originalWorkTime * 0.6;
        }

        const result = Math.round(adjustedWorkTime);
        console.log(`⏱️ Время работы скорректировано: ${originalWorkTime}с → ${result}с (простой: ${mouseStats.total_idle_time}с)`);

        return result;
    }

    /**
     * Конвертирует время из секунд в минуты
     * @param {number|string} seconds - Время в секундах
     * @returns {number} - Время в минутах
     */
    convertToMinutes(seconds) {
        if (typeof seconds === 'string') {
            seconds = parseFloat(seconds);
        }

        if (isNaN(seconds) || seconds < 0) {
            return 0;
        }

        return Math.round(seconds / 60);
    }

    /**
     * Рассчитывает время перерывов в минутах
     * @param {Array} dayData - Данные за день
     * @returns {Object} - Информация о перерывах
     */
    calculateBreakTime(dayData) {
        const result = {
            totalBreakTime: 0,
            lunchBreakTime: 0,
            shortBreaksTime: 0,
            breakDetails: []
        };

        if (!dayData || !dayData.activities || dayData.activities.length === 0) {
            return result;
        }

        // Сортируем активности по времени
        const activities = [...dayData.activities].sort((a, b) => {
            return new Date(a.timestamp) - new Date(b.timestamp);
        });

        let lastActivityEnd = null;
        let breakStart = null;

        // Ищем перерывы между активностями
        for (let i = 0; i < activities.length; i++) {
            const activity = activities[i];

            // Преобразуем timestamp в объект Date
            const activityStart = new Date(activity.timestamp);

            // Вычисляем конец активности, добавляя продолжительность
            const durationSeconds = activity.duration || 0;
            const activityEnd = new Date(activityStart.getTime() + durationSeconds * 1000);

            // Если уже была предыдущая активность, проверяем разрыв
            if (lastActivityEnd) {
                const timeDiff = (activityStart - lastActivityEnd) / 1000 / 60; // в минутах

                // Если разрыв больше минимального порога, считаем его перерывом
                if (timeDiff > TIMESHEET.MIN_ACTIVITY_TIME) {
                    // Запоминаем начало перерыва, если еще не запомнили
                    if (!breakStart) {
                        breakStart = lastActivityEnd;
                    }

                    // Если текущая активность начинается после значительного промежутка,
                    // считаем, что перерыв закончился
                    if (timeDiff > TIMESHEET.MAX_BREAK_TIME || i === activities.length - 1) {
                        const breakDuration = (activityStart - breakStart) / 1000 / 60; // в минутах

                        // Учитываем только значимые перерывы
                        if (breakDuration >= TIMESHEET.MIN_ACTIVITY_TIME) {
                            result.totalBreakTime += breakDuration;

                            // Определяем, обеденный ли это перерыв
                            const breakStartHour = breakStart.getHours();
                            const isLunchTime = breakStartHour >= 12 && breakStartHour <= 14;
                            const isLongBreak = breakDuration >= 30;

                            if (isLunchTime && isLongBreak) {
                                result.lunchBreakTime += breakDuration;
                            } else {
                                result.shortBreaksTime += breakDuration;
                            }

                            // Добавляем детали о перерыве
                            result.breakDetails.push({
                                start: breakStart,
                                end: activityStart,
                                duration: Math.round(breakDuration),
                                isLunch: isLunchTime && isLongBreak
                            });
                        }

                        breakStart = null;
                    }
                } else {
                    // Если промежуток слишком короткий, сбрасываем начало перерыва
                    breakStart = null;
                }
            }

            // Запоминаем конец текущей активности для следующей итерации
            lastActivityEnd = activityEnd;
        }

        // Сортируем перерывы по времени начала
        result.breakDetails.sort((a, b) => a.start - b.start);

        // Округляем значения
        result.totalBreakTime = Math.round(result.totalBreakTime);
        result.lunchBreakTime = Math.round(result.lunchBreakTime);
        result.shortBreaksTime = Math.round(result.shortBreaksTime);

        return result;
    }

    /**
     * Рассчитывает сводную информацию по табелю
     * @returns {Object} - Сводная информация
     */
    calculateSummary() {
        console.log('📊 Расчет сводной информации по табелю');

        if (!this.timesheetData || this.timesheetData.length === 0) {
            console.log('📭 Нет данных для расчета сводки');
            return {
                totalWorkDays: 0,
                totalWorkTime: 0,
                averageWorkTime: 0,
                totalProductiveTime: 0,
                totalUnproductiveTime: 0,
                averageProductivity: 0,
                totalActivities: 0,
                totalMouseClicks: 0,
                totalMouseMovements: 0,
                totalIdleTime: 0,
                workDaysByWeek: [],
                productivityTrend: []
            };
        }

        let totalWorkDays = 0;
        let totalWorkTime = 0; // в секундах
        let totalProductiveTime = 0;
        let totalUnproductiveTime = 0;
        let totalProductivity = 0;
        let totalActivities = 0;
        let totalMouseClicks = 0;
        let totalMouseMovements = 0;
        let totalIdleTime = 0;

        const workDaysByWeek = {};
        const productivityTrend = [];

        for (const dayData of this.timesheetData) {
            if (!dayData || !dayData.date) continue;

            // Учитываем только дни с реальной активностью
            const workTime = dayData.adjusted_work_time || dayData.work_time || dayData.duration || 0;
            const productivity = dayData.adjusted_productivity || dayData.productivity || 0;

            if (workTime > 0) {
                totalWorkDays++;
                totalWorkTime += workTime;

                const productiveTime = (workTime * productivity) / 100;
                const unproductiveTime = workTime - productiveTime;

                totalProductiveTime += productiveTime;
                totalUnproductiveTime += unproductiveTime;
                totalProductivity += productivity;

                // Подсчет активностей
                if (dayData.activities && Array.isArray(dayData.activities)) {
                    totalActivities += dayData.activities.length;
                }

                // Подсчет мышиной активности
                if (dayData.mouse_activity) {
                    totalMouseClicks += dayData.mouse_activity.total_clicks || 0;
                    totalMouseMovements += dayData.mouse_activity.total_movements || 0;
                    totalIdleTime += dayData.mouse_activity.total_idle_time || 0;
                }

                // Группировка по неделям
                const date = new Date(dayData.date);
                const weekKey = this.getWeekKey(date);

                if (!workDaysByWeek[weekKey]) {
                    workDaysByWeek[weekKey] = {
                        week: weekKey,
                        days: 0,
                        totalTime: 0,
                        avgProductivity: 0
                    };
                }

                workDaysByWeek[weekKey].days++;
                workDaysByWeek[weekKey].totalTime += workTime;
                workDaysByWeek[weekKey].avgProductivity += productivity;

                // Тренд продуктивности
                productivityTrend.push({
                    date: dayData.date,
                    productivity: productivity,
                    workTime: workTime
                });
            }
        }

        // Вычисляем средние значения по неделям
        Object.values(workDaysByWeek).forEach(week => {
            week.avgProductivity = week.days > 0 ? week.avgProductivity / week.days : 0;
            week.avgTime = week.days > 0 ? week.totalTime / week.days : 0;
        });

        const averageWorkTime = totalWorkDays > 0 ? totalWorkTime / totalWorkDays : 0;
        const averageProductivity = totalWorkDays > 0 ? totalProductivity / totalWorkDays : 0;

        const summary = {
            totalWorkDays: totalWorkDays,
            totalWorkTime: Math.round(totalWorkTime),
            averageWorkTime: Math.round(averageWorkTime),
            totalProductiveTime: Math.round(totalProductiveTime),
            totalUnproductiveTime: Math.round(totalUnproductiveTime),
            averageProductivity: Math.round(averageProductivity),
            totalActivities: totalActivities,
            totalMouseClicks: totalMouseClicks,
            totalMouseMovements: totalMouseMovements,
            totalIdleTime: Math.round(totalIdleTime),
            workDaysByWeek: Object.values(workDaysByWeek),
            productivityTrend: productivityTrend.sort((a, b) => new Date(a.date) - new Date(b.date))
        };

        console.log('📈 Сводная информация рассчитана:', {
            workDays: summary.totalWorkDays,
            totalTime: `${Math.round(summary.totalWorkTime / 3600)}ч`,
            avgProductivity: `${summary.averageProductivity}%`,
            activities: summary.totalActivities
        });

        return summary;
    }

    /**
     * Получает ключ недели для группировки данных
     * @param {Date} date - Дата
     * @returns {string} - Ключ недели в формате "YYYY-WXX"
     */
    getWeekKey(date) {
        const year = date.getFullYear();
        const firstDayOfYear = new Date(year, 0, 1);
        const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
        const weekNumber = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
        return `${year}-W${weekNumber.toString().padStart(2, '0')}`;
    }

    /**
     * Определяет, является ли день рабочим
     * @param {Object} day - Запись о дне
     * @returns {boolean} - true если день рабочий, false если выходной
     */
    isWorkDay(day) {
        if (!day || !day.date) return true; // По умолчанию считаем рабочим

        const date = new Date(day.date);
        const dayOfWeek = date.getDay();

        // 0 - воскресенье, 6 - суббота
        return dayOfWeek !== 0 && dayOfWeek !== 6;
    }

    /**
     * Форматирует время в минутах в читаемый формат
     * @param {number} minutes - Время в минутах
     * @returns {string} - Отформатированное время (например, "8ч 30м")
     */
    formatTime(minutes) {
        if (minutes === undefined || minutes === null || isNaN(minutes)) {
            return "0ч 0м";
        }

        // Проверка на аномально большие значения (более 24 часов в день)
        if (minutes > 24 * 60) {
            // Если значение аномально большое, ограничиваем его 24 часами
            console.warn(`Обнаружено аномально большое значение времени: ${minutes} минут. Ограничиваем до 24 часов.`);
            minutes = 24 * 60;
        }

        // Округляем до целого числа минут
        minutes = Math.round(minutes);

        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;

        if (hours > 0) {
            return `${hours}ч ${mins}м`;
        } else {
            return `${mins}м`;
        }
    }

    /**
     * Форматирует отображение длительности в табеле активности
     * @param {string} durationText - Текст с длительностью (например, "133м")
     * @returns {string} - Отформатированный текст (например, "2ч 13м")
     */
    formatDurationDisplay(durationText) {
        if (!durationText) return '';

        // Извлекаем число минут из строки вида "133м"
        const matches = durationText.match(/(\d+)м/);
        if (matches && matches[1]) {
            const minutes = parseInt(matches[1]);
            if (!isNaN(minutes)) {
                // Если больше 60 минут, преобразуем в формат часы+минуты
                if (minutes >= 60) {
                    const hours = Math.floor(minutes / 60);
                    const mins = minutes % 60;
                    return `${hours}ч ${mins}м`;
                }
            }
        }

        // Если не удалось преобразовать, возвращаем исходный текст
        return durationText;
    }

    /**
     * Получает CSS класс в зависимости от продуктивности
     * @param {number} productivity - Значение продуктивности (0-100)
     * @returns {string} - CSS класс
     */
    getProductivityClass(productivity) {
        if (productivity >= 70) return "text-success";
        if (productivity >= 40) return "text-warning";
        return "text-danger";
    }

    /**
     * Отображает сводную информацию табеля на главной странице
     */
    renderTimesheetSummary() {
        console.log('📊 Отображаем сводную информацию табеля');
        const summary = this.calculateSummary();
        console.log('📊 Данные сводки:', summary);

        // Вспомогательная функция для форматирования секунд
        const formatSeconds = (seconds) => {
            const hours = Math.floor(seconds / 3600);
            const minutes = Math.floor((seconds % 3600) / 60);
            return hours > 0 ? `${hours}ч ${minutes}м` : `${minutes}м`;
        };

        // Вспомогательная функция для обновления элементов
        const updateElement = (id, value) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
            }
        };

        // Обновляем только элементы табеля активности (НЕ трогаем шапку)
        updateElement('timesheet-total-time', formatSeconds(summary.totalWorkTime));
        updateElement('timesheet-productive-time', formatSeconds(summary.totalProductiveTime));
        updateElement('timesheet-productivity', `${summary.averageProductivity.toFixed(1)}%`);
        updateElement('timesheet-work-days', summary.totalWorkDays);
        updateElement('timesheet-average-daily', formatSeconds(summary.averageWorkTime));

        // ОТКЛЮЧЕНО: НЕ обновляем элементы в шапке страницы
        // Это предотвращает конфликты с другими модулями
        /*
        // Обновляем основные метрики в шапке
        updateElement('total-working-time', formatSeconds(summary.totalTime));
        updateElement('productive-time', formatSeconds(summary.productiveTime));
        updateElement('activity-score', `${summary.averageProductivity.toFixed(1)}%`);

        // Обновляем подзаголовки
        const totalWorkingTimeElement = document.getElementById('total-working-time');
        if (totalWorkingTimeElement) {
            const subtitle = totalWorkingTimeElement.parentElement.querySelector('.metric-subtitle');
            if (subtitle) {
                subtitle.textContent = `За ${summary.totalWorkDays} рабочих дней`;
            }
        }

        const productiveTimeElement = document.getElementById('productive-time');
        if (productiveTimeElement) {
            const subtitle = productiveTimeElement.parentElement.querySelector('.metric-subtitle');
            if (subtitle) {
                subtitle.textContent = `${summary.averageProductivity.toFixed(1)}% от общего времени`;
            }
        }

        const activityScoreElement = document.getElementById('activity-score');
        if (activityScoreElement) {
            const subtitle = activityScoreElement.parentElement.querySelector('.metric-subtitle');
            if (subtitle) {
                subtitle.textContent = 'Средний балл продуктивности';
            }
        }
        */

        // Обновляем классы продуктивности только для табеля
        const productivityClass = this.getProductivityClass(summary.averageProductivity);
        const timesheetProductivityElement = document.getElementById('timesheet-productivity');
        if (timesheetProductivityElement) {
            timesheetProductivityElement.className = `metric-value ${productivityClass}`;
        }

        // Собираем все активности и данные мыши для объединенного таймлайна
        const allActivities = [];
        const allMouseData = [];

        this.timesheetData.forEach(dayData => {
            if (dayData.activities) {
                allActivities.push(...dayData.activities);
            }
            if (dayData.mouseActivity) {
                allMouseData.push(...dayData.mouseActivity);
            }
        });

        // Обновляем сводку объединенного таймлайна
        const totalSessions = allActivities.length;
        const averageSessionDuration = totalSessions > 0 ? summary.totalWorkTime / totalSessions : 0;

        let longestSession = 0;
        allActivities.forEach(activity => {
            if (activity.duration > longestSession) {
                longestSession = activity.duration;
            }
        });

        const totalBreakTime = this.getAllBreaks().reduce((total, breakItem) => {
            return total + (breakItem.duration || 0);
        }, 0);

        updateElement('timeline-total-sessions', totalSessions);
        updateElement('timeline-average-duration', formatSeconds(averageSessionDuration));
        updateElement('timeline-longest-session', formatSeconds(longestSession));
        updateElement('timeline-total-breaks', formatSeconds(totalBreakTime));

        console.log('✅ Сводка табеля обновлена (элементы шапки НЕ затронуты)');
    }

    /**
     * Получает все активные периоды из данных табеля
     * @returns {Array} - Массив активных периодов
     */
    getAllFocusSessions() {
        const allSessions = [];

        if (!this.timesheetData || !Array.isArray(this.timesheetData)) {
            console.warn('Нет данных табеля для извлечения активных периодов');
            return allSessions;
        }

        this.timesheetData.forEach(dayData => {
            if (dayData.focus_sessions && Array.isArray(dayData.focus_sessions)) {
                allSessions.push(...dayData.focus_sessions);
            }
        });

        console.log(`Извлечено ${allSessions.length} активных периодов из данных табеля`);
        return allSessions;
    }

    /**
     * Получает все периоды неактивного времени из данных табеля
     * @returns {Array} - Массив периодов неактивного времени
     */
    getAllBreaks() {
        const allBreaks = [];

        if (!this.timesheetData || !Array.isArray(this.timesheetData)) {
            console.warn('Нет данных табеля для извлечения неактивного времени');
            return allBreaks;
        }

        this.timesheetData.forEach(dayData => {
            if (dayData.breaks && Array.isArray(dayData.breaks)) {
                allBreaks.push(...dayData.breaks);
            }
        });

        console.log(`Извлечено ${allBreaks.length} периодов неактивного времени из данных табеля`);
        return allBreaks;
    }

    /**
     * Объединяет перекрывающиеся браузерные сессии одного браузера
     * @param {Array} browserData - Массив браузерных активностей
     * @returns {Array} - Массив объединенных сессий
     */
    mergeBrowserSessions(browserData) {
        if (!browserData || !Array.isArray(browserData) || browserData.length === 0) {
            return [];
        }

        console.log('🔄 Начинаем объединение браузерных сессий');

        // Группируем по браузеру
        const browserGroups = {};

        browserData.forEach(session => {
            const browserName = this.normalizeBrowserName(session.browser_name || session.process_name || 'browser');
            const startTime = new Date(session.timestamp || session.start_time);
            const duration = parseInt(session.total_time || session.duration || session.active_time || 0);

            if (duration <= 0 || !startTime || isNaN(startTime.getTime())) {
                return;
            }

            if (!browserGroups[browserName]) {
                browserGroups[browserName] = [];
            }

            browserGroups[browserName].push({
                start_time: startTime,
                end_time: new Date(startTime.getTime() + duration * 1000),
                duration: duration,
                browser: browserName,
                url: session.url || '',
                title: session.window_title || session.title || '',
                original_session: session
            });
        });

        const mergedSessions = [];

        // Объединяем перекрывающиеся сессии для каждого браузера
        Object.entries(browserGroups).forEach(([browserName, sessions]) => {
            console.log(`🌐 Обрабатываем ${sessions.length} сессий для ${browserName}`);

            // Сортируем по времени начала
            sessions.sort((a, b) => a.start_time - b.start_time);

            const merged = [];

            for (const session of sessions) {
                const lastMerged = merged[merged.length - 1];

                // Если это первая сессия или нет перекрытия с предыдущей
                if (!lastMerged || session.start_time >= lastMerged.end_time) {
                    merged.push({
                        start_time: session.start_time,
                        end_time: session.end_time,
                        duration: session.duration,
                        browser: browserName,
                        url: session.url,
                        title: session.title,
                        tabs: [session.original_session]
                    });
                } else {
                    // Объединяем с предыдущей сессией
                    const newEndTime = new Date(Math.max(lastMerged.end_time.getTime(), session.end_time.getTime()));
                    const newDuration = Math.round((newEndTime - lastMerged.start_time) / 1000);

                    lastMerged.end_time = newEndTime;
                    lastMerged.duration = newDuration;
                    lastMerged.tabs.push(session.original_session);

                    // Объединяем URL и заголовки
                    if (session.url && !lastMerged.url.includes(session.url)) {
                        lastMerged.url = lastMerged.url ? `${lastMerged.url}, ${session.url}` : session.url;
                    }
                    if (session.title && !lastMerged.title.includes(session.title)) {
                        lastMerged.title = lastMerged.title ? `${lastMerged.title}, ${session.title}` : session.title;
                    }
                }
            }

            console.log(`✅ Объединено ${sessions.length} → ${merged.length} сессий для ${browserName}`);
            mergedSessions.push(...merged);
        });

        console.log(`🎯 Итого объединенных сессий: ${mergedSessions.length}`);
        return mergedSessions;
    }

    /**
     * Нормализует название браузера
     * @param {string} browserName - Исходное название браузера
     * @returns {string} - Нормализованное название
     */
    normalizeBrowserName(browserName) {
        if (!browserName) return 'browser';

        const name = browserName.toLowerCase();

        if (name.includes('brave')) return 'Brave';
        if (name.includes('chrome')) return 'Chrome';
        if (name.includes('firefox')) return 'Firefox';
        if (name.includes('edge')) return 'Edge';
        if (name.includes('safari')) return 'Safari';
        if (name.includes('opera')) return 'Opera';
        if (name.includes('yandex')) return 'Yandex';

        return browserName;
    }

    /**
     * Определяет, является ли приложение браузером
     * @param {string} appName - Название приложения
     * @returns {boolean} - true если это браузер
     */
    isBrowserApplication(appName) {
        if (!appName) return false;

        const name = appName.toLowerCase();
        const browserNames = [
            'brave', 'chrome', 'firefox', 'edge', 'safari', 'opera',
            'yandex', 'браузер', 'browser', 'vivaldi', 'tor'
        ];

        return browserNames.some(browser => name.includes(browser));
    }
}

/**
 * Рассчитывает активные периоды на основе активностей
 * @param {Array} activities - Массив активностей
 * @returns {Array} - Массив активных периодов
 */
function calculateFocusSessions(activities) {
    if (!activities || !Array.isArray(activities) || activities.length === 0) {
        return {
            sessions: [],
            sessionCount: 0,
            totalSessionTime: 0,
            averageSessionDuration: 0,
            longestSession: 0
        };
    }

    // Сортируем активности по времени
    const sortedActivities = [...activities].sort((a, b) => {
        return new Date(a.timestamp) - new Date(b.timestamp);
    });

    const sessions = [];
    let currentSession = null;
    let lastActivityEnd = null;

    // Проходим по всем активностям и группируем их в сессии
    sortedActivities.forEach(activity => {
        const activityStart = new Date(activity.timestamp);
        const durationSeconds = activity.duration || 0;
        const activityEnd = new Date(activityStart.getTime() + durationSeconds * 1000);
        const productivity = parseFloat(activity.productivity || 0);

        // Если это первая активность или прошло слишком много времени с предыдущей активности
        if (!lastActivityEnd || (activityStart - lastActivityEnd) / 1000 / 60 > SESSION_CONFIG.MAX_IDLE_TIME) {
            // Если была предыдущая сессия и она достаточно длинная, добавляем её
            if (currentSession &&
                (currentSession.end_time - currentSession.start_time) / 1000 / 60 >= SESSION_CONFIG.MIN_FOCUS_SESSION) {
                sessions.push(currentSession);
            }

            // Создаем новую сессию
            currentSession = {
                start_time: activityStart,
                end_time: activityEnd,
                activities: [activity],
                total_duration: durationSeconds,
                productivity: productivity
            };
        } else {
            // Продолжаем текущую сессию
            currentSession.end_time = activityEnd;
            currentSession.activities.push(activity);
            currentSession.total_duration += durationSeconds;

            // Обновляем продуктивность (среднее взвешенное)
            const totalDuration = currentSession.total_duration;
            const prevDuration = totalDuration - durationSeconds;
            currentSession.productivity =
                (currentSession.productivity * prevDuration + productivity * durationSeconds) / totalDuration;
        }

        // Запоминаем конец активности
        lastActivityEnd = activityEnd;
    });

    // Добавляем последнюю сессию, если она достаточно длинная
    if (currentSession &&
        (currentSession.end_time - currentSession.start_time) / 1000 / 60 >= SESSION_CONFIG.MIN_FOCUS_SESSION) {
        sessions.push(currentSession);
    }

    // Рассчитываем статистику
    let totalSessionTime = 0;
    let longestSession = 0;

    sessions.forEach(session => {
        const durationMinutes = (session.end_time - session.start_time) / (1000 * 60);
        totalSessionTime += durationMinutes;

        if (durationMinutes > longestSession) {
            longestSession = durationMinutes;
        }
    });

    const averageSessionDuration = sessions.length > 0 ? totalSessionTime / sessions.length : 0;

    return {
        sessions: sessions,
        sessionCount: sessions.length,
        totalSessionTime: totalSessionTime,
        averageSessionDuration: averageSessionDuration,
        longestSession: longestSession
    };
}

/**
 * Updates and visualizes the unified timeline with focus sessions and breaks
 * @param {Array} focusSessions - Array of focus sessions
 * @param {Array} breaks - Array of breaks
 * @param {Object} summary - Summary statistics for sessions and breaks
 */
function updateUnifiedTimeline(activities, mouseData, summary) {
    console.log('=== ОБНОВЛЕНИЕ ЕДИНОЙ ВРЕМЕННОЙ ШКАЛЫ ===');
    console.log('Активности:', activities?.length || 0, 'Данные мыши:', mouseData?.length || 0);

    try {
        // Проверяем наличие контейнера для временной шкалы
        if (!document.getElementById('unified-timeline')) {
            console.error('Контейнер для единой временной шкалы не найден');
            return;
        }

        // Вычисляем активные и неактивные периоды
        const periods = calculateActivityPeriods(activities || [], mouseData || []);
        const activePeriods = periods.activePeriods || [];
        const inactivePeriods = periods.inactivePeriods || [];

        console.log('Периоды активности:', {
            активные: activePeriods.length,
            неактивные: inactivePeriods.length
        });

        // Вычисляем метрики для активных периодов
        const totalActivePeriods = activePeriods.length;

        // Средняя продолжительность активного периода
        let avgActiveDuration = 0;
        if (totalActivePeriods > 0) {
            const totalActiveTime = activePeriods.reduce((total, period) => {
                return total + (period.duration || 0);
            }, 0);
            avgActiveDuration = totalActiveTime / totalActivePeriods;
        }

        // Самый длинный активный период
        let longestActiveDuration = 0;
        if (totalActivePeriods > 0) {
            longestActiveDuration = activePeriods.reduce((max, period) => {
                return Math.max(max, period.duration || 0);
            }, 0);
        }

        // Общее неактивное время
        const totalInactiveTime = inactivePeriods.reduce((total, period) => {
            return total + (period.duration || 0);
        }, 0);

        // Обновляем метрики в DOM с новыми названиями
        if (document.getElementById('timeline-total-sessions')) {
            $('#timeline-total-sessions').text(totalActivePeriods);
        }
        if (document.getElementById('timeline-avg-session')) {
            $('#timeline-avg-session').text(formatMinutes(avgActiveDuration));
        }
        if (document.getElementById('timeline-longest-session')) {
            $('#timeline-longest-session').text(formatMinutes(longestActiveDuration));
        }
        if (document.getElementById('timeline-total-breaks')) {
            $('#timeline-total-breaks').text(formatMinutes(totalInactiveTime));
        }

        // Проверяем есть ли данные для отображения
        if (totalActivePeriods === 0 && inactivePeriods.length === 0) {
            $('#unified-timeline').hide();
            if (document.getElementById('unified-timeline-empty')) {
                $('#unified-timeline-empty').show();
            }
            console.log('Нет данных для отображения временной шкалы');
            return;
        }

        $('#unified-timeline').show();
        if (document.getElementById('unified-timeline-empty')) {
            $('#unified-timeline-empty').hide();
        }

        // Сохраняем данные для кнопок управления
        window.currentTimelineData = {
            activePeriods: activePeriods,
            inactivePeriods: inactivePeriods
        };

        // Определяем текущий режим просмотра
        let currentView = 'all';
        if (document.getElementById('view-sessions') && $('#view-sessions').hasClass('btn-primary')) {
            currentView = 'active';
        } else if (document.getElementById('view-breaks') && $('#view-breaks').hasClass('btn-primary')) {
            currentView = 'inactive';
        }

        // Отображаем визуализацию с новой функцией
        visualizeActivityPeriods(activePeriods, inactivePeriods, 'timeline-chart', currentView);

        // Настраиваем обработчики событий для кнопок просмотра
        setupTimelineViewButtons(activePeriods, inactivePeriods);

        console.log('Единая временная шкала обновлена успешно');

    } catch (error) {
        console.error('Ошибка при обновлении единой временной шкалы:', error);
        // Показываем сообщение об ошибке в контейнере
        if (document.getElementById('unified-timeline')) {
            $('#unified-timeline').html(`
                <div class="alert alert-danger">
                    <h6><i class="fas fa-exclamation-triangle"></i> Ошибка отображения временной шкалы</h6>
                    <p class="mb-0">Произошла ошибка при обработке данных: ${error.message}</p>
                </div>
            `);
        }
    }
}

/**
 * Настраивает обработчики событий для кнопок просмотра временной шкалы
 * @param {Array} activePeriods - Активные периоды
 * @param {Array} inactivePeriods - Неактивные периоды
 */
function setupTimelineViewButtons(activePeriods, inactivePeriods) {
    // Кнопка "Активные" (ранее "Сессии")
    const viewActiveBtn = document.getElementById('view-sessions');
    if (viewActiveBtn && !$(viewActiveBtn).data('listener-set')) {
        $(viewActiveBtn).on('click', function () {
            console.log('Показать только активные периоды');
            $(this).removeClass('btn-outline-primary').addClass('btn-primary');
            $('#view-breaks, #view-all').removeClass('btn-primary').addClass('btn-outline-primary');
            visualizeActivityPeriods(activePeriods, inactivePeriods, 'timeline-chart', 'active');
        }).data('listener-set', true);
    }

    // Кнопка "Неактивное время" (ранее "Перерывы")
    const viewInactiveBtn = document.getElementById('view-breaks');
    if (viewInactiveBtn && !$(viewInactiveBtn).data('listener-set')) {
        $(viewInactiveBtn).on('click', function () {
            console.log('Показать только неактивное время');
            $(this).removeClass('btn-outline-primary').addClass('btn-primary');
            $('#view-sessions, #view-all').removeClass('btn-primary').addClass('btn-outline-primary');
            visualizeActivityPeriods(activePeriods, inactivePeriods, 'timeline-chart', 'inactive');
        }).data('listener-set', true);
    }

    // Кнопка "Все"
    const viewAllBtn = document.getElementById('view-all');
    if (viewAllBtn && !$(viewAllBtn).data('listener-set')) {
        $(viewAllBtn).on('click', function () {
            console.log('Показать все периоды');
            $(this).removeClass('btn-outline-primary').addClass('btn-primary');
            $('#view-sessions, #view-breaks').removeClass('btn-primary').addClass('btn-outline-primary');
            visualizeActivityPeriods(activePeriods, inactivePeriods, 'timeline-chart', 'all');
        }).data('listener-set', true);
    }

    // Устанавливаем кнопку "Все" как активную по умолчанию
    if (document.getElementById('view-all')) {
        $('#view-all').removeClass('btn-outline-primary').addClass('btn-primary');
        $('#view-sessions, #view-breaks').removeClass('btn-primary').addClass('btn-outline-primary');
    }
}

/**
 * Visualizes focus sessions and breaks on a timeline
 * @param {Array} sessions - Array of focus sessions
 * @param {Array} breaks - Array of breaks
 * @param {string} containerId - ID of the container element
 * @param {string} viewType - Type of view: 'sessions', 'breaks', or 'all'
 */
function visualizeFocusSessions(sessions, breaks, containerId, viewType = 'all') {
    console.log('Visualizing focus sessions:', { sessions: sessions?.length || 0, breaks: breaks?.length || 0, viewType });

    // Get container element
    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`Container ${containerId} not found`);
        return;
    }

    // Check if we have data
    const hasSessionData = sessions && Array.isArray(sessions) && sessions.length > 0;
    const hasBreakData = breaks && Array.isArray(breaks) && breaks.length > 0;

    if (!hasSessionData && !hasBreakData) {
        console.warn('No session or break data available for visualization');
        container.innerHTML = `
            <div class="alert alert-info">
                <h6><i class="fas fa-info-circle"></i> Нет данных для временной шкалы</h6>
                <p class="mb-0">Временная шкала будет показана после загрузки данных о фокус-сессиях и перерывах.</p>
            </div>
        `;
        return;
    }

    // Check if Plotly is available
    if (typeof Plotly === 'undefined') {
        console.error('Plotly library is not loaded');
        container.innerHTML = `
            <div class="alert alert-danger">
                <h6><i class="fas fa-exclamation-triangle"></i> Ошибка визуализации</h6>
                <p class="mb-0">Библиотека Plotly не загружена. Временная шкала недоступна.</p>
            </div>
        `;
        return;
    }

    try {
        // Prepare data arrays
        let data = [];
        let hasData = false;

        // Add sessions if needed and available
        if ((viewType === 'sessions' || viewType === 'all') && hasSessionData) {
            console.log('Adding session data to visualization');

            sessions.forEach((session, index) => {
                if (!session.start_time || !session.end_time) {
                    console.warn('Session missing time data:', session);
                    return;
                }

                const startTime = new Date(session.start_time);
                const endTime = new Date(session.end_time);

                // Validate dates
                if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
                    console.warn('Invalid session dates:', session);
                    return;
                }

                // Format times for display
                const startFormatted = startTime.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                });
                const endFormatted = endTime.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                });
                const dateFormatted = startTime.toLocaleDateString('ru-RU');

                // Calculate duration in minutes
                const durationMinutes = (endTime - startTime) / (1000 * 60);

                // Get productivity and color
                const productivity = session.productivity || 50;
                const color = getColorByProductivity(productivity);

                // Prepare activity details for hover text
                let activityDetails = '';
                if (session.activities && session.activities.length > 0) {
                    const topActivities = session.activities
                        .slice(0, 3) // Show top 3 activities
                        .map(act => {
                            const actName = act.application || act.app_name || 'Неизвестно';
                            const actDuration = Math.round((act.duration || 0) / 60);
                            return `${actName}: ${actDuration} мин`;
                        })
                        .join('<br>');
                    activityDetails = `<br><strong>Активности:</strong><br>${topActivities}`;
                }

                data.push({
                    x: [startTime, endTime],
                    y: ['Активное время', 'Активное время'],
                    mode: 'lines',
                    line: {
                        color: color,
                        width: 15
                    },
                    name: `Активный период ${index + 1}`,
                    text: [
                        `<strong>Активный период ${index + 1}</strong><br>
                         Начало: ${startFormatted}<br>
                         Дата: ${dateFormatted}<br>
                         Продуктивность: ${Math.round(productivity)}%${activityDetails}`,
                        `Конец: ${endFormatted}<br>
                         Длительность: ${Math.round(durationMinutes)} мин`
                    ],
                    hoverinfo: 'text',
                    hovertemplate: '%{text}<extra></extra>',
                    showlegend: false
                });
                hasData = true;
            });
        }

        // Add breaks if needed and available
        if ((viewType === 'breaks' || viewType === 'all') && hasBreakData) {
            console.log('Adding break data to visualization');

            breaks.forEach((breakItem, index) => {
                if (!breakItem.start_time || !breakItem.end_time) {
                    console.warn('Break missing time data:', breakItem);
                    return;
                }

                const startTime = new Date(breakItem.start_time);
                const endTime = new Date(breakItem.end_time);

                // Validate dates
                if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
                    console.warn('Invalid break dates:', breakItem);
                    return;
                }

                // Format times for display
                const startFormatted = startTime.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                });
                const endFormatted = endTime.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                });
                const dateFormatted = startTime.toLocaleDateString('ru-RU');

                // Calculate duration in minutes
                const durationMinutes = (endTime - startTime) / (1000 * 60);

                // Determine break type and color
                const isLunch = breakItem.is_lunch || false;
                const color = isLunch ? '#fd7e14' : '#6c757d'; // Orange for lunch, gray for regular breaks

                data.push({
                    x: [startTime, endTime],
                    y: ['Неактивное время', 'Неактивное время'],
                    mode: 'lines',
                    line: {
                        color: color,
                        width: 10
                    },
                    name: `${isLunch ? 'Обед' : 'Неактивное время'} ${index + 1}`,
                    text: [
                        `<strong>${isLunch ? 'Обед' : 'Неактивное время'} ${index + 1}</strong><br>
                         Начало: ${startFormatted}<br>
                         Дата: ${dateFormatted}`,
                        `Конец: ${endFormatted}<br>
                         Длительность: ${Math.round(durationMinutes)} мин`
                    ],
                    hoverinfo: 'text',
                    hovertemplate: '%{text}<extra></extra>',
                    showlegend: false
                });
                hasData = true;
            });
        }

        // Check if we have any valid data to display
        if (!hasData || data.length === 0) {
            container.innerHTML = `
                <div class="alert alert-warning">
                    <h6><i class="fas fa-exclamation-triangle"></i> Нет валидных данных</h6>
                    <p class="mb-0">Данные о ${viewType === 'sessions' ? 'активных периодах' : viewType === 'breaks' ? 'неактивном времени' : 'активности'} содержат ошибки или отсутствуют.</p>
                </div>
            `;
            return;
        }

        // Define layout
        const layout = {
            title: {
                text: viewType === 'sessions' ? 'Активные периоды' :
                    viewType === 'breaks' ? 'Неактивное время' :
                        'Активные периоды и неактивное время',
                font: { size: 16 }
            },
            xaxis: {
                title: 'Время',
                type: 'date',
                tickformat: '%H:%M',
                showgrid: true,
                gridcolor: '#e9ecef'
            },
            yaxis: {
                title: '',
                showgrid: false,
                zeroline: false,
                tickfont: { size: 12 }
            },
            hovermode: 'closest',
            height: 400,
            margin: {
                l: 100,
                r: 50,
                b: 80,
                t: 60
            },
            plot_bgcolor: '#ffffff',
            paper_bgcolor: '#ffffff'
        };

        // Clear container and create the plot
        container.innerHTML = '';
        Plotly.newPlot(containerId, data, layout, {
            responsive: true,
            displayModeBar: false
        }).then(() => {
            console.log('Timeline visualization created successfully');
        }).catch(error => {
            console.error('Error creating Plotly chart:', error);
            container.innerHTML = `
                <div class="alert alert-danger">
                    <h6><i class="fas fa-exclamation-triangle"></i> Ошибка создания графика</h6>
                    <p class="mb-0">Не удалось создать временную шкалу: ${error.message}</p>
                </div>
            `;
        });

    } catch (error) {
        console.error('Error in visualizeFocusSessions:', error);
        container.innerHTML = `
            <div class="alert alert-danger">
                <h6><i class="fas fa-exclamation-triangle"></i> Ошибка визуализации</h6>
                <p class="mb-0">Произошла ошибка при создании временной шкалы: ${error.message}</p>
            </div>
        `;
    }
}

/**
 * Returns a color based on productivity value
 * @param {number} productivity - Productivity value (0-100)
 * @returns {string} - Color code
 */
function getColorByProductivity(productivity) {
    if (productivity >= 75) {
        return '#28a745'; // Green - high productivity
    } else if (productivity >= 50) {
        return '#007bff'; // Blue - medium productivity
    } else if (productivity >= 25) {
        return '#ffc107'; // Yellow - low productivity
    } else {
        return '#dc3545'; // Red - very low productivity
    }
}

/**
 * Форматирует время в минутах в читаемый формат
 * @param {number} minutes - Время в минутах
 * @returns {string} - Отформатированное время (например, "8ч 30м")
 */
function formatMinutes(minutes) {
    if (minutes === undefined || minutes === null || isNaN(minutes)) {
        return "0ч 0м";
    }

    // Проверка на аномально большие значения (более 24 часов в день)
    if (minutes > 24 * 60) {
        // Если значение аномально большое, ограничиваем его 24 часами
        console.warn(`Обнаружено аномально большое значение времени: ${minutes} минут. Ограничиваем до 24 часов.`);
        minutes = 24 * 60;
    }

    // Округляем до целого числа минут
    minutes = Math.round(minutes);

    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hours > 0) {
        return `${hours}ч ${mins}м`;
    } else {
        return `${mins}м`;
    }
}

/**
 * Отображает табель учёта рабочего времени
 * @param {Array} data - Данные табеля
 */
function renderTimesheet(data) {
    console.log('Отрисовка табеля с данными:', data);

    if (!data || data.length === 0) {
        console.log('Нет данных для отображения');
        $('#timesheet-table-container').html(`
            <div class="alert alert-warning" role="alert">
                <h5><i class="fas fa-exclamation-triangle"></i> Нет данных за выбранный период</h5>
                <p>Система работает только с фактическими данными из API. Проверьте:</p>
                <ul>
                    <li>Выбранный период содержит рабочие дни</li>
                    <li>В системе есть записи активности за этот период</li>
                    <li>Сотрудник/устройство были активны в выбранное время</li>
                </ul>
            </div>
        `);

        // Сбрасываем метрики
        $('#timesheet-summary').html(`
            <div class="row">
                <div class="col-md-3">
                    <div class="metric-card p-3 text-center border rounded">
                        <h6 class="text-muted">Рабочих дней</h6>
                        <h3 class="mb-0">0</h3>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="metric-card p-3 text-center border rounded">
                        <h6 class="text-muted">Общее время</h6>
                        <h3 class="mb-0">0ч 0м</h3>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="metric-card p-3 text-center border rounded">
                        <h6 class="text-muted">Продуктивное время</h6>
                        <h3 class="mb-0">0ч 0м</h3>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="metric-card p-3 text-center border rounded">
                        <h6 class="text-muted">Продуктивность</h6>
                        <h3 class="mb-0 text-muted">0%</h3>
                    </div>
                </div>
            </div>
        `);
        return;
    }

    // Если есть timesheetManager, используем его для расчетов
    if (window.timesheetManager) {
        // Сохраняем данные в менеджере
        window.timesheetManager.timesheetData = data;

        // Рендерим сводку через менеджер
        window.timesheetManager.renderTimesheetSummary();
    }

    // Обрабатываем данные для отображения
    let processedData = Array.isArray(data) ? data : [];

    // Сортируем по дате
    processedData.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Генерируем подробную таблицу
    let tableHTML = `
        <div class="table-responsive">
            <table class="table table-bordered table-striped table-hover">
                <thead class="table-dark">
                    <tr>
                        <th style="width: 120px;">Дата</th>
                        <th style="width: 100px;">Общее время</th>
                        <th style="width: 120px;">Продуктивное время</th>
                        <th style="width: 100px;">Продуктивность</th>
                        <th style="width: 80px;">Активностей</th>
                        <th style="width: 120px;">Сотрудник</th>
                        <th style="width: 100px;">Устройство</th>
                        <th>Основные приложения</th>
                    </tr>
                </thead>
                <tbody>
    `;

    let totalWorkDays = 0;
    let totalWorkTime = 0;
    let totalProductiveTime = 0;
    let totalActivities = 0;

    processedData.forEach(dayData => {
        const date = new Date(dayData.date).toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });

        // Время работы в секундах
        const workTimeSeconds = dayData.work_time || dayData.duration || dayData.total_duration || 0;
        const workTime = Math.round(workTimeSeconds / 60); // в минутах

        // Продуктивность
        const productivity = Math.round(dayData.productivity || 0);
        const productiveTime = Math.round(workTime * (productivity / 100));

        // Количество активностей
        const activitiesCount = (dayData.activities && dayData.activities.length) || 0;

        // Сотрудник и устройство
        const employeeName = dayData.employee_name || 'Неизвестно';
        const deviceName = dayData.device_name || dayData.device_id || 'Неизвестно';

        // Считаем только дни с активностью как рабочие
        if (workTime > 0) {
            totalWorkDays++;
            totalWorkTime += workTime;
            totalProductiveTime += productiveTime;
            totalActivities += activitiesCount;
        }

        // Определяем класс строки по продуктивности
        let rowClass = '';
        let productivityClass = 'text-muted';
        if (productivity >= 80) {
            rowClass = 'table-success';
            productivityClass = 'text-success fw-bold';
        } else if (productivity >= 60) {
            rowClass = 'table-warning';
            productivityClass = 'text-warning fw-bold';
        } else if (productivity > 30) {
            rowClass = 'table-light';
            productivityClass = 'text-dark';
        } else if (productivity > 0) {
            rowClass = 'table-danger';
            productivityClass = 'text-danger fw-bold';
        }

        // Получаем основные приложения (топ-3)
        let topApps = '';
        if (dayData.activities && dayData.activities.length > 0) {
            // Группируем по приложениям и суммируем время
            const appTimes = {};
            dayData.activities.forEach(activity => {
                const appName = activity.application || activity.app_name || 'Неизвестно';
                const duration = activity.duration || 0;
                appTimes[appName] = (appTimes[appName] || 0) + duration;
            });

            // Сортируем и берем топ-3
            const sortedApps = Object.entries(appTimes)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 3);

            topApps = sortedApps.map(([app, duration]) => {
                const minutes = Math.round(duration / 60);
                return `<small class="badge bg-secondary me-1">${app}: ${formatDuration(duration)}</small>`;
            }).join('<br>');
        }

        tableHTML += `
            <tr class="${rowClass}">
                <td><strong>${date}</strong></td>
                <td><span class="badge bg-primary">${formatDuration(workTimeSeconds)}</span></td>
                <td><span class="badge bg-dark">${formatDuration(productiveTime * 60)}</span></td>
                <td><span class="${productivityClass}">${productivity}%</span></td>
                <td><span class="badge bg-secondary">${activitiesCount}</span></td>
                <td><small>${employeeName}</small></td>
                <td><small>${deviceName}</small></td>
                <td>${topApps || '<small class="text-muted">Нет данных</small>'}</td>
            </tr>
        `;
    });

    tableHTML += `
            </tbody>
        </table>
        </div>
    `;

    // Отображаем таблицу
    $('#timesheet-table-container').html(tableHTML);

    // Рассчитываем общую продуктивность
    const overallProductivity = totalWorkTime > 0 ? Math.round((totalProductiveTime / totalWorkTime) * 100) : 0;
    const averageDailyTime = totalWorkDays > 0 ? Math.round(totalWorkTime / totalWorkDays) : 0;
    const averageActivitiesPerDay = totalWorkDays > 0 ? Math.round(totalActivities / totalWorkDays) : 0;

    // Определяем класс продуктивности для общей метрики
    let overallProductivityClass = 'text-muted';
    if (overallProductivity >= 80) overallProductivityClass = 'text-success';
    else if (overallProductivity >= 60) overallProductivityClass = 'text-warning';
    else if (overallProductivity > 30) overallProductivityClass = 'text-dark';
    else if (overallProductivity > 0) overallProductivityClass = 'text-danger';

    // Отображаем сводную информацию только если нет TimesheetManager
    if (!window.timesheetManager) {
        $('#timesheet-summary').html(`
            <div class="row">
                <div class="col-md-3">
                    <div class="metric-card p-3 text-center border rounded bg-light">
                        <h6 class="text-muted mb-2">Рабочих дней</h6>
                        <h3 class="mb-0 text-primary">${totalWorkDays}</h3>
                        <small class="text-muted">из ${processedData.length} всего</small>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="metric-card p-3 text-center border rounded bg-light">
                        <h6 class="text-muted mb-2">Общее время</h6>
                        <h3 class="mb-0 text-primary">${formatDuration(totalWorkTime * 60)}</h3>
                        <small class="text-muted">за период</small>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="metric-card p-3 text-center border rounded bg-light">
                        <h6 class="text-muted mb-2">Продуктивное время</h6>
                        <h3 class="mb-0 text-info">${formatDuration(totalProductiveTime * 60)}</h3>
                        <small class="text-muted">эффективная работа</small>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="metric-card p-3 text-center border rounded bg-light">
                        <h6 class="text-muted mb-2">Продуктивность</h6>
                        <h3 class="mb-0 ${overallProductivityClass}">${overallProductivity}%</h3>
                        <small class="text-muted">средняя</small>
                    </div>
                </div>
            </div>
            <div class="row mt-3">
                <div class="col-md-6">
                    <div class="metric-card p-3 text-center border rounded">
                        <h6 class="text-muted mb-2">Среднее время в день</h6>
                        <h4 class="mb-0 text-secondary">${formatDuration(averageDailyTime * 60)}</h4>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="metric-card p-3 text-center border rounded">
                        <h6 class="text-muted mb-2">Средне активностей в день</h6>
                        <h4 class="mb-0 text-secondary">${averageActivitiesPerDay}</h4>
                    </div>
                </div>
            </div>
        `);
    }

    console.log(`Табель отрисован: ${totalWorkDays} рабочих дней, ${formatDuration(totalWorkTime * 60)} общее время, ${overallProductivity}% продуктивность`);

    // Извлекаем данные для временной шкалы
    console.log('Извлекаем данные для временной шкалы...');
    let allSessions = [];
    let allBreaks = [];

    // Если есть TimesheetManager, используем его данные
    if (window.timesheetManager) {
        console.log('Используем данные из TimesheetManager');
        allSessions = window.timesheetManager.getAllFocusSessions() || [];
        allBreaks = window.timesheetManager.getAllBreaks() || [];
    } else {
        // Иначе извлекаем из переданных данных
        console.log('Извлекаем данные из параметра data');
        if (Array.isArray(data)) {
            data.forEach(dayData => {
                if (dayData.activities && Array.isArray(dayData.activities)) {
                    // Рассчитываем активные периоды для этого дня
                    const daySessions = calculateFocusSessions(dayData.activities);
                    allSessions = allSessions.concat(daySessions);
                }

                // Добавляем неактивное время если есть
                if (dayData.breaks && Array.isArray(dayData.breaks)) {
                    allBreaks = allBreaks.concat(dayData.breaks);
                }
            });
        }
    }

    console.log(`Найдено ${allSessions.length} активных периодов и ${allBreaks.length} периодов неактивного времени`);

    // Отрисовываем временную шкалу
    renderTimeline(allSessions, allBreaks);
}

/**
 * Проверяет, является ли приложение непродуктивным
 * @param {string} appName - Название приложения
 * @returns {boolean}
 */
function isUnproductiveApp(appName) {
    if (!appName) return false;

    const unproductiveApps = [
        'steam', 'game', 'игра', 'telegram', 'whatsapp', 'viber',
        'skype', 'discord', 'youtube', 'twitch', 'netflix', 'vk',
        'facebook', 'instagram', 'tiktok', 'twitter'
    ];

    const lowerAppName = appName.toLowerCase();
    return unproductiveApps.some(app => lowerAppName.includes(app));
}

/**
 * Проверяет, является ли окно непродуктивным
 * @param {string} windowTitle - Заголовок окна
 * @returns {boolean}
 */
function isUnproductiveWindow(windowTitle) {
    if (!windowTitle) return false;

    const unproductiveKeywords = [
        'youtube', 'игра', 'game', 'вконтакте', 'facebook', 'instagram',
        'развлечения', 'фильм', 'сериал', 'музыка', 'чат'
    ];

    const lowerTitle = windowTitle.toLowerCase();
    return unproductiveKeywords.some(keyword => lowerTitle.includes(keyword));
}

// Глобальная переменная для менеджера табеля
let timesheetManager = null;

/**
 * Инициализация табеля рабочего времени
 */
function initTimesheet() {
    console.log('=== НАЧАЛО ИНИЦИАЛИЗАЦИИ ТАБЕЛЯ ===');
    console.log('jQuery доступен:', typeof $ !== 'undefined');
    console.log('jQuery.fn.version:', $.fn ? $.fn.jquery : 'не определен');
    console.log('DOM готов:', document.readyState);

    try {
        // Проверяем наличие необходимых элементов
        console.log('Проверяем наличие элементов...');

        const requiredElements = [
            '#show-timesheet-btn',
            '#timesheet-start-date',
            '#timesheet-end-date',
            '#timesheet-loading',
            '#timesheet-content'
        ];

        const missingElements = [];
        const foundElements = [];

        requiredElements.forEach(selector => {
            const element = $(selector);
            if (element.length === 0) {
                missingElements.push(selector);
            } else {
                foundElements.push(selector);
                console.log(`Найден элемент: ${selector}`);
            }
        });

        console.log('Найденные элементы:', foundElements);

        if (missingElements.length > 0) {
            console.error('Отсутствуют элементы:', missingElements);
            // Не прерываем выполнение, пробуем работать с тем что есть
        }

        console.log('Создаем TimesheetManager...');
        // Создаем экземпляр TimesheetManager
        if (typeof TimesheetManager === 'undefined') {
            console.error('Класс TimesheetManager не найден!');
            return;
        }

        window.timesheetManager = new TimesheetManager();
        console.log('TimesheetManager создан:', !!window.timesheetManager);

        // Загружаем списки сотрудников и устройств
        console.log('Загружаем фильтры...');
        loadEmployeesForFilter().catch(err => console.warn('Ошибка загрузки сотрудников:', err));
        loadDevicesForFilter().catch(err => console.warn('Ошибка загрузки устройств:', err));

        // Настраиваем обработчики событий
        console.log('Настраиваем обработчики...');
        setupEventHandlers();

        // Устанавливаем дату по умолчанию (последние 7 дней)
        console.log('Устанавливаем даты по умолчанию...');
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - 6);

        const startDateStr = startDate.toISOString().split('T')[0];
        const endDateStr = endDate.toISOString().split('T')[0];

        console.log('Даты:', { startDate: startDateStr, endDate: endDateStr });

        $('#timesheet-start-date').val(startDateStr);
        $('#timesheet-end-date').val(endDateStr);

        console.log('Табель инициализирован успешно');
        console.log('=== ИНИЦИАЛИЗАЦИЯ ЗАВЕРШЕНА ===');

    } catch (error) {
        console.error('Ошибка инициализации табеля:', error);
        console.error('Stack trace:', error.stack);
    }
}

/**
 * Настройка обработчиков событий
 */
function setupEventHandlers() {
    console.log('=== НАСТРОЙКА ОБРАБОТЧИКОВ СОБЫТИЙ ===');

    try {
        // Кнопка "Показать"
        const showBtn = $('#show-timesheet-btn');
        console.log('Кнопка "Показать" найдена:', showBtn.length > 0);

        if (showBtn.length > 0) {
            console.log('Добавляем обработчик для кнопки "Показать"');
            showBtn.off('click').on('click', function (e) {
                console.log('КЛИК ПО КНОПКЕ "ПОКАЗАТЬ"!');
                console.log('Event:', e);
                e.preventDefault();
                showTimesheet();
            });
            console.log('Обработчик кнопки "Показать" добавлен');
        } else {
            console.error('Кнопка "Показать" не найдена!');
        }

        // Фильтр сотрудников
        const employeeFilter = $('#timesheet-employee-filter');
        console.log('Фильтр сотрудников найден:', employeeFilter.length > 0);

        if (employeeFilter.length > 0) {
            employeeFilter.off('change').on('change', function () {
                console.log('Изменен фильтр сотрудников:', $(this).val());
                loadDevicesForFilter($(this).val());
            });
            console.log('Обработчик фильтра сотрудников добавлен');
        }

        // Даты
        const startDate = $('#timesheet-start-date');
        const endDate = $('#timesheet-end-date');
        console.log('Поля дат найдены:', { start: startDate.length > 0, end: endDate.length > 0 });

        // Кнопки просмотра временной шкалы
        const viewActiveBtn = $('#view-sessions');
        const viewInactiveBtn = $('#view-breaks');
        const viewAllBtn = $('#view-all');

        console.log('Кнопки временной шкалы найдены:', {
            active: viewActiveBtn.length > 0,
            inactive: viewInactiveBtn.length > 0,
            all: viewAllBtn.length > 0
        });

        if (viewActiveBtn.length > 0) {
            viewActiveBtn.off('click').on('click', function (e) {
                console.log('Клик по кнопке "Активные"');
                e.preventDefault();
                $(this).addClass('active').siblings().removeClass('active');
                // Здесь будет логика фильтрации активных периодов
            });
        }

        if (viewInactiveBtn.length > 0) {
            viewInactiveBtn.off('click').on('click', function (e) {
                console.log('Клик по кнопке "Неактивное время"');
                e.preventDefault();
                $(this).addClass('active').siblings().removeClass('active');
                // Здесь будет логика фильтрации неактивных периодов
            });
        }

        if (viewAllBtn.length > 0) {
            viewAllBtn.off('click').on('click', function (e) {
                console.log('Клик по кнопке "Все"');
                e.preventDefault();
                $(this).addClass('active').siblings().removeClass('active');
                // Здесь будет логика отображения всех периодов
            });
        }

        console.log('=== ОБРАБОТЧИКИ НАСТРОЕНЫ ===');

    } catch (error) {
        console.error('Ошибка настройки обработчиков:', error);
        console.error('Stack trace:', error.stack);
    }
}

// Инициализация при загрузке DOM
document.addEventListener('DOMContentLoaded', function () {
    console.log('DOM загружен, инициализируем табель...');

    // Ждем пока jQuery полностью загрузится
    function waitForJQuery() {
        if (typeof $ !== 'undefined' && typeof jQuery !== 'undefined') {
            console.log('jQuery доступен, запускаем инициализацию табеля...');
            setTimeout(() => {
                initTimesheet();
            }, 100);
        } else {
            console.log('Ожидаем загрузки jQuery...');
            setTimeout(waitForJQuery, 100);
        }
    }

    waitForJQuery();
});

// Экспорт функций для использования в других модулях
if (typeof window !== 'undefined') {
    window.timesheetManager = timesheetManager;
    window.initTimesheet = initTimesheet;
    window.renderTimesheet = renderTimesheet;
    window.showTimesheet = showTimesheet;
    window.updateUnifiedTimeline = updateUnifiedTimeline;
    window.calculateActivityPeriods = calculateActivityPeriods;
    window.visualizeActivityPeriods = visualizeActivityPeriods;
}

/**
 * Инициализация компонентов табеля
 */
function initTimesheetComponents() {
    console.log('Инициализируем компоненты табеля...');

    // Проверяем наличие необходимых элементов
    const requiredElements = [
        '#timesheet-loading',
        '#timesheet-content',
        '#timesheet-table-container',
        '#timesheet-summary',
        '#show-timesheet-btn',
        '#timesheet-start-date',
        '#timesheet-end-date',
        // Проверяем наличие глобальных фильтров из шапки
        '#employee-filter',
        '#device-filter'
    ];

    for (const elementId of requiredElements) {
        if ($(elementId).length === 0) {
            console.warn(`Элемент ${elementId} не найден на странице`);
        }
    }

    // Скрываем индикатор загрузки по умолчанию
    $('#timesheet-loading').hide();

    console.log('Компоненты табеля инициализированы');
}

/**
 * Инициализация date range picker
 */
function initDateRangePicker() {
    console.log('Инициализируем date range picker');

    // Устанавливаем значения по умолчанию (текущая неделя)
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + 1); // Понедельник

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); // Воскресенье

    // Проверяем наличие элементов и устанавливаем значения
    const startDateElement = $('#timesheet-start-date');
    const endDateElement = $('#timesheet-end-date');

    if (startDateElement.length > 0) {
        startDateElement.val(startOfWeek.toISOString().split('T')[0]);
        console.log('Установлена дата начала:', startOfWeek.toISOString().split('T')[0]);
    } else {
        console.warn('Элемент #timesheet-start-date не найден');
    }

    if (endDateElement.length > 0) {
        endDateElement.val(endOfWeek.toISOString().split('T')[0]);
        console.log('Установлена дата окончания:', endOfWeek.toISOString().split('T')[0]);
    } else {
        console.warn('Элемент #timesheet-end-date не найден');
    }

    console.log('Date range picker инициализирован');
}

// Глобальная переменная для TimesheetManager
window.timesheetManager = null;

/**
 * Загружает список сотрудников для фильтра
 */
async function loadEmployeesForFilter() {
    console.log('Загружаем список сотрудников для фильтра...');

    try {
        // Пробуем получить сотрудников из API устройств
        const devicesResponse = await fetch('/api/devices');
        let employees = new Set();

        if (devicesResponse.ok) {
            const devices = await devicesResponse.json();
            console.log('Получены устройства:', devices.length);

            // Извлекаем уникальные имена сотрудников из устройств
            devices.forEach(device => {
                if (device.employee_name && device.employee_name.trim()) {
                    employees.add(device.employee_name.trim());
                }
            });
        }

        // Если нет сотрудников из устройств, пробуем получить из активности
        if (employees.size === 0) {
            console.log('Нет сотрудников в устройствах, пробуем получить из активности...');

            const endDate = new Date();
            const startDate = new Date();
            startDate.setDate(endDate.getDate() - 7); // Последняя неделя

            const params = new URLSearchParams({
                start_date: startDate.toISOString().split('T')[0],
                end_date: endDate.toISOString().split('T')[0]
            });

            try {
                const activityResponse = await fetch(`/api/public/activity/windows?${params.toString()}`);
                if (activityResponse.ok) {
                    const activities = await activityResponse.json();
                    activities.forEach(activity => {
                        if (activity.employee_name && activity.employee_name.trim()) {
                            employees.add(activity.employee_name.trim());
                        }
                    });
                }
            } catch (activityError) {
                console.warn('Ошибка при получении сотрудников из активности:', activityError);
            }
        }

        // Очищаем текущие опции
        const employeeFilter = $('#employee-filter');
        if (employeeFilter.length > 0) {
            // Сохраняем текущий выбор
            const currentValue = employeeFilter.val();

            // Очищаем и добавляем опцию "Все сотрудники"
            employeeFilter.empty().append('<option value="">Все сотрудники</option>');

            // Добавляем сотрудников в алфавитном порядке
            const sortedEmployees = Array.from(employees).sort();
            sortedEmployees.forEach(employee => {
                employeeFilter.append(`<option value="${employee}">${employee}</option>`);
            });

            // Восстанавливаем выбор если возможно
            if (currentValue && employees.has(currentValue)) {
                employeeFilter.val(currentValue);
            }

            console.log(`Загружено ${employees.size} сотрудников`);

            // Загружаем устройства для выбранного сотрудника
            loadDevicesForFilter(employeeFilter.val());
        } else {
            console.warn('Элемент #employee-filter не найден');
        }

        // Если нет сотрудников, показываем предупреждение
        if (employees.size === 0) {
            console.warn('Не найдено ни одного сотрудника');
            if (employeeFilter.length > 0) {
                employeeFilter.html('<option value="">Нет доступных сотрудников</option>');
            }
        }

    } catch (error) {
        console.error('Ошибка при загрузке списка сотрудников:', error);
        const employeeFilter = $('#employee-filter');
        if (employeeFilter.length > 0) {
            employeeFilter.html('<option value="">Ошибка загрузки сотрудников</option>');
        }
    }
}

/**
 * Загружает список устройств для фильтра
 * @param {string} employeeId - ID выбранного сотрудника (опционально)
 */
async function loadDevicesForFilter(employeeId = '') {
    console.log('Загружаем список устройств для фильтра...', employeeId ? `для сотрудника: ${employeeId}` : '');

    try {
        // Получаем все устройства
        const response = await fetch('/api/devices');

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const allDevices = await response.json();
        console.log('Получено устройств:', allDevices.length);

        // Фильтруем устройства по сотруднику если указан
        let devices = allDevices;
        if (employeeId) {
            devices = allDevices.filter(device =>
                device.employee_name === employeeId || device.employee_id === employeeId
            );
            console.log(`Отфильтровано устройств для сотрудника ${employeeId}:`, devices.length);
        }

        // Очищаем текущие опции
        const deviceFilter = $('#device-filter');
        if (deviceFilter.length > 0) {
            // Сохраняем текущий выбор
            const currentValue = deviceFilter.val();

            // Очищаем и добавляем опцию "Все устройства"
            deviceFilter.empty().append('<option value="">Все устройства</option>');

            if (devices.length > 0) {
                // Удаляем дубликаты по device_id и сортируем по имени
                const uniqueDevices = [];
                const seenDeviceIds = new Set();

                devices.forEach(device => {
                    const deviceId = device.device_id || device.computer_name || device.name;
                    if (deviceId && !seenDeviceIds.has(deviceId)) {
                        seenDeviceIds.add(deviceId);
                        uniqueDevices.push(device);
                    }
                });

                // Сортируем по имени устройства
                uniqueDevices.sort((a, b) => {
                    const nameA = a.device_name || a.computer_name || a.name || a.device_id || '';
                    const nameB = b.device_name || b.computer_name || b.name || b.device_id || '';
                    return nameA.localeCompare(nameB);
                });

                // Добавляем устройства в фильтр
                uniqueDevices.forEach(device => {
                    const deviceId = device.device_id || device.computer_name || device.name;
                    const deviceName = device.device_name || device.computer_name || device.name || deviceId;
                    deviceFilter.append(`<option value="${deviceId}">${deviceName}</option>`);
                });

                // Восстанавливаем выбор если возможно
                if (currentValue) {
                    deviceFilter.val(currentValue);
                }

                console.log(`Загружено ${uniqueDevices.length} уникальных устройств`);
            } else {
                deviceFilter.append('<option value="">Нет доступных устройств</option>');
                console.warn(`Нет устройств${employeeId ? ` для сотрудника ${employeeId}` : ''}`);
            }
        } else {
            console.warn('Элемент #device-filter не найден');
        }

    } catch (error) {
        console.error('Ошибка при загрузке списка устройств:', error);
        const deviceFilter = $('#device-filter');
        if (deviceFilter.length > 0) {
            deviceFilter.html('<option value="">Ошибка загрузки устройств</option>');
        }
    }
}

/**
 * Форматирует длительность из секунд в читаемый формат
 * @param {number} seconds - Длительность в секундах
 * @returns {string} - Отформатированная строка (например, "2ч 30м")
 */
function formatDuration(seconds) {
    if (!seconds || seconds <= 0) return '0м';

    const minutes = Math.round(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hours > 0) {
        return `${hours}ч ${mins}м`;
    } else {
        return `${mins}м`;
    }
}

/**
 * Группирует сессии по временным периодам
 * @param {Array} sessions - Массив сессий
 * @returns {Array} - Сгруппированные сессии
 */
function groupSessionsByTimePeriods(sessions) {
    if (!sessions || sessions.length === 0) return [];

    // Простая группировка - возвращаем сессии как есть
    // В будущем можно добавить более сложную логику группировки
    return sessions.map(session => ({
        ...session,
        start_time: session.start_time,
        end_time: session.end_time,
        productivity: session.productivity || 50,
        activities: session.activities || []
    }));
}

/**
 * Группирует периоды неактивного времени по временным периодам
 * @param {Array} breaks - Массив периодов неактивного времени
 * @returns {Array} - Сгруппированные периоды неактивного времени
 */
function groupBreaksByTimePeriods(breaks) {
    console.log('Группировка периодов неактивного времени...');
    // Простая группировка - возвращаем периоды как есть
    return breaks.map(breakItem => ({
        start_time: breakItem.start_time,
        end_time: breakItem.end_time,
        duration: breakItem.duration,
        is_lunch: breakItem.is_lunch || false
    }));
}

/**
 * Renders the timeline with focus sessions and breaks
 * @param {Array} sessions - Array of focus sessions
 * @param {Array} breaks - Array of breaks
 */
function renderTimeline(sessions = [], breaks = []) {
    console.log('Rendering timeline with sessions:', sessions?.length || 0, 'breaks:', breaks?.length || 0);

    try {
        // Ensure arrays
        const sessionData = Array.isArray(sessions) ? sessions : [];
        const breakData = Array.isArray(breaks) ? breaks : [];

        // Calculate metrics
        const totalSessions = sessionData.length;
        const totalBreaks = breakData.length;

        console.log('Timeline metrics:', { totalSessions, totalBreaks });

        // Calculate average session duration
        let avgSessionDuration = 0;
        if (totalSessions > 0) {
            const totalSessionTime = sessionData.reduce((total, session) => {
                if (session.start_time && session.end_time) {
                    const start = new Date(session.start_time);
                    const end = new Date(session.end_time);
                    if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
                        return total + (end - start);
                    }
                }
                return total;
            }, 0);
            avgSessionDuration = totalSessionTime / totalSessions;
        }

        // Find longest session
        let longestSessionDuration = 0;
        if (totalSessions > 0) {
            longestSessionDuration = sessionData.reduce((max, session) => {
                if (session.start_time && session.end_time) {
                    const start = new Date(session.start_time);
                    const end = new Date(session.end_time);
                    if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
                        const duration = end - start;
                        return Math.max(max, duration);
                    }
                }
                return max;
            }, 0);
        }

        // Calculate total break time
        let totalBreakTime = 0;
        if (totalBreaks > 0) {
            totalBreakTime = breakData.reduce((total, breakItem) => {
                if (breakItem.start_time && breakItem.end_time) {
                    const start = new Date(breakItem.start_time);
                    const end = new Date(breakItem.end_time);
                    if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
                        return total + (end - start);
                    }
                }
                return total;
            }, 0);
        }

        // Helper function to format duration
        const formatDurationMs = (ms) => {
            if (ms <= 0) return '0ч 0м';

            const hours = Math.floor(ms / (1000 * 60 * 60));
            const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));

            if (hours > 0) {
                return `${hours}ч ${minutes}м`;
            } else {
                return `${minutes}м`;
            }
        };

        // Update metrics in DOM
        const updateMetric = (elementId, value) => {
            const element = document.getElementById(elementId);
            if (element) {
                element.textContent = value;
                console.log(`Updated ${elementId}: ${value}`);
            } else {
                console.warn(`Element ${elementId} not found`);
            }
        };

        updateMetric('timeline-total-sessions', totalSessions.toString());
        updateMetric('timeline-avg-session', formatDurationMs(avgSessionDuration));
        updateMetric('timeline-longest-session', formatDurationMs(longestSessionDuration));
        updateMetric('timeline-total-breaks', formatDurationMs(totalBreakTime));

        // Show or hide timeline container based on data availability
        const timelineContainer = document.getElementById('unified-timeline');
        if (timelineContainer) {
            if (totalSessions > 0 || totalBreaks > 0) {
                timelineContainer.style.display = 'block';
                console.log('Timeline container shown');

                // Сохраняем данные для кнопок управления
                if (typeof window.updateTimelineData === 'function') {
                    window.updateTimelineData(sessionData, breakData);
                }

                // Render the visualization
                visualizeFocusSessions(sessionData, breakData, 'timeline-chart', 'all');

                // Устанавливаем активную кнопку "Все" по умолчанию
                $('#view-sessions, #view-breaks').removeClass('btn-primary').addClass('btn-outline-primary');
                $('#view-all').removeClass('btn-outline-primary').addClass('btn-primary');
            } else {
                timelineContainer.style.display = 'none';
                console.log('Timeline container hidden - no data');
            }
        } else {
            console.warn('Timeline container not found');
        }

        console.log('Timeline rendering completed successfully');

    } catch (error) {
        console.error('Error rendering timeline:', error);

        // Update metrics with error state
        const errorMetrics = ['timeline-total-sessions', 'timeline-avg-session', 'timeline-longest-session', 'timeline-total-breaks'];
        errorMetrics.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = 'Ошибка';
            }
        });

        // Show error in timeline chart
        const chartContainer = document.getElementById('timeline-chart');
        if (chartContainer) {
            chartContainer.innerHTML = `
                <div class="alert alert-danger">
                    <h6><i class="fas fa-exclamation-triangle"></i> Ошибка отображения временной шкалы</h6>
                    <p class="mb-0">Произошла ошибка при обработке данных: ${error.message}</p>
                </div>
            `;
        }
    }
}

/**
 * Показать табель рабочего времени
 */
async function showTimesheet() {
    console.log('=== НАЧАЛО ЗАГРУЗКИ ТАБЕЛЯ ===');

    try {
        // Получаем значения дат
        const startDate = $('#timesheet-start-date').val();
        const endDate = $('#timesheet-end-date').val();

        console.log('Введенные даты:', { startDate, endDate });

        if (!startDate || !endDate) {
            alert('Пожалуйста, выберите период');
            return;
        }

        // Проверяем, что конечная дата не раньше начальной
        if (new Date(startDate) > new Date(endDate)) {
            alert('Дата начала не может быть позже даты окончания');
            return;
        }

        // Получаем фильтры (используем основные фильтры из шапки или локальные)
        const employeeId = $('#employee-filter').val() || $('#timesheet-employee-filter').val() || '';
        const deviceId = $('#device-filter').val() || $('#timesheet-device-filter').val() || '';

        console.log('Параметры фильтров:', { employeeId, deviceId });

        // Показываем индикатор загрузки
        console.log('Показываем индикатор загрузки...');
        $('#timesheet-loading').show();
        $('#timesheet-content').hide();

        // Проверяем доступность TimesheetManager
        if (!window.timesheetManager) {
            console.error('TimesheetManager не инициализирован!');
            throw new Error('TimesheetManager не инициализирован');
        }

        console.log('Загружаем данные через TimesheetManager...');
        const data = await window.timesheetManager.loadTimesheetData(startDate, endDate, employeeId, deviceId);

        console.log('Данные табеля загружены:', data);
        console.log('Количество записей:', data ? data.length : 0);

        // Отображаем табель
        console.log('Отображаем табель...');
        renderTimesheet(data);

        // Обновляем единую временную шкалу
        console.log('Обновляем единую временную шкалу...');
        if (data && data.length > 0) {
            // Собираем все активности из данных табеля
            let allActivities = [];
            let allMouseData = [];

            data.forEach(dayData => {
                if (dayData.activities) {
                    allActivities.push(...dayData.activities);
                }
                if (dayData.mouse_data) {
                    allMouseData.push(...dayData.mouse_data);
                }
            });

            console.log('Данные для временной шкалы:', {
                активности: allActivities.length,
                данныеМыши: allMouseData.length
            });

            // Обновляем временную шкалу с новыми данными
            updateUnifiedTimeline(allActivities, allMouseData, { /* summary */ });
        }

        // Скрываем индикатор загрузки и показываем контент
        console.log('Скрываем загрузку, показываем контент...');
        $('#timesheet-loading').hide();
        $('#timesheet-content').show();

        console.log('=== ТАБЕЛЬ УСПЕШНО ЗАГРУЖЕН ===');

    } catch (error) {
        console.error('Ошибка при загрузке табеля:', error);
        console.error('Stack trace:', error.stack);

        alert('Ошибка при загрузке данных табеля: ' + error.message);

        // Скрываем индикатор загрузки
        $('#timesheet-loading').hide();
    }
}

/**
 * Вычисляет активные и неактивные периоды на основе активностей и данных мыши
 * @param {Array} activities - Массив активностей
 * @param {Array} mouseData - Данные активности мыши
 * @returns {Object} - Объект с активными и неактивными периодами
 */
function calculateActivityPeriods(activities = [], mouseData = []) {
    console.log('Расчет периодов активности:', {
        активности: activities.length,
        данныеМыши: mouseData.length
    });

    if (!activities || activities.length === 0) {
        console.log('Нет данных активности для расчета периодов');
        return { activePeriods: [], inactivePeriods: [] };
    }

    // Группируем активности по временным интервалам
    const timeSlots = new Map();

    activities.forEach(activity => {
        if (!activity.timestamp || !activity.duration) return;

        const startTime = new Date(activity.timestamp);
        const endTime = new Date(startTime.getTime() + activity.duration * 1000);

        // Создаем 5-минутные слоты
        const slotSize = 5 * 60 * 1000; // 5 минут в миллисекундах
        const startSlot = Math.floor(startTime.getTime() / slotSize) * slotSize;
        const endSlot = Math.floor(endTime.getTime() / slotSize) * slotSize;

        for (let slot = startSlot; slot <= endSlot; slot += slotSize) {
            const slotKey = slot.toString();
            if (!timeSlots.has(slotKey)) {
                timeSlots.set(slotKey, {
                    startTime: new Date(slot),
                    endTime: new Date(slot + slotSize),
                    activities: [],
                    totalDuration: 0,
                    mouseActivity: 0
                });
            }

            const slotData = timeSlots.get(slotKey);
            slotData.activities.push(activity);
            slotData.totalDuration += activity.duration;
        }
    });

    // Добавляем данные мыши
    mouseData.forEach(mouseEntry => {
        if (!mouseEntry.timestamp) return;

        const timestamp = new Date(mouseEntry.timestamp);
        const slotSize = 5 * 60 * 1000;
        const slot = Math.floor(timestamp.getTime() / slotSize) * slotSize;
        const slotKey = slot.toString();

        if (timeSlots.has(slotKey)) {
            const slotData = timeSlots.get(slotKey);
            slotData.mouseActivity += (mouseEntry.movements || 0) + (mouseEntry.clicks || 0);
        }
    });

    // Определяем активные и неактивные периоды
    const activePeriods = [];
    const inactivePeriods = [];
    const sortedSlots = Array.from(timeSlots.values()).sort((a, b) => a.startTime - b.startTime);

    let currentActivePeriod = null;
    let lastEndTime = null;

    sortedSlots.forEach(slot => {
        // Критерии активности: есть активности или достаточная активность мыши
        const isActive = slot.totalDuration > 0 || slot.mouseActivity >= TIMESHEET.MIN_MOUSE_MOVEMENTS;

        if (isActive) {
            // Если есть пропуск между активными периодами, создаем неактивный период
            if (lastEndTime && slot.startTime - lastEndTime > 5 * 60 * 1000) {
                inactivePeriods.push({
                    start_time: lastEndTime.toISOString(),
                    end_time: slot.startTime.toISOString(),
                    duration: (slot.startTime - lastEndTime) / (1000 * 60), // в минутах
                    type: 'inactive'
                });
            }

            // Продолжаем или начинаем новый активный период
            if (!currentActivePeriod || (lastEndTime && slot.startTime - lastEndTime > 15 * 60 * 1000)) {
                // Завершаем предыдущий активный период
                if (currentActivePeriod) {
                    activePeriods.push(currentActivePeriod);
                }

                // Начинаем новый активный период
                currentActivePeriod = {
                    start_time: slot.startTime.toISOString(),
                    end_time: slot.endTime.toISOString(),
                    duration: 5, // минут
                    activities: [...slot.activities],
                    mouseActivity: slot.mouseActivity,
                    productivity: 50 // базовое значение
                };
            } else {
                // Расширяем текущий активный период
                currentActivePeriod.end_time = slot.endTime.toISOString();
                currentActivePeriod.duration += 5;
                currentActivePeriod.activities.push(...slot.activities);
                currentActivePeriod.mouseActivity += slot.mouseActivity;
            }

            lastEndTime = slot.endTime;
        } else {
            // Неактивный слот
            if (currentActivePeriod && lastEndTime) {
                // Завершаем активный период
                activePeriods.push(currentActivePeriod);
                currentActivePeriod = null;
            }
        }
    });

    // Завершаем последний активный период
    if (currentActivePeriod) {
        activePeriods.push(currentActivePeriod);
    }

    // Рассчитываем продуктивность для активных периодов
    activePeriods.forEach(period => {
        if (period.activities && period.activities.length > 0) {
            const totalProductivity = period.activities.reduce((sum, activity) => {
                return sum + (activity.productivity || 50);
            }, 0);
            period.productivity = Math.round(totalProductivity / period.activities.length);
        }
    });

    console.log('Результат расчета периодов:', {
        активныеПериоды: activePeriods.length,
        неактивныеПериоды: inactivePeriods.length
    });

    return {
        activePeriods,
        inactivePeriods
    };
}

/**
 * Визуализирует периоды активности с улучшенной цветовой схемой
 * @param {Array} activePeriods - Активные периоды
 * @param {Array} inactivePeriods - Неактивные периоды  
 * @param {string} containerId - ID контейнера
 * @param {string} viewType - Тип отображения ('all', 'active', 'inactive')
 */
function visualizeActivityPeriods(activePeriods, inactivePeriods, containerId, viewType = 'all') {
    console.log('Визуализация периодов активности:', {
        активные: activePeriods?.length || 0,
        неактивные: inactivePeriods?.length || 0,
        тип: viewType
    });

    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`Контейнер ${containerId} не найден`);
        return;
    }

    // Проверяем наличие Plotly
    if (typeof Plotly === 'undefined') {
        console.error('Библиотека Plotly не загружена');
        container.innerHTML = `
            <div class="alert alert-danger">
                <h6><i class="fas fa-exclamation-triangle"></i> Ошибка визуализации</h6>
                <p class="mb-0">Библиотека Plotly недоступна.</p>
            </div>
        `;
        return;
    }

    try {
        // Цветовая схема для разных уровней продуктивности
        const colors = {
            high: '#28a745',      // Зеленый для высокой продуктивности
            medium: '#ffc107',    // Желтый для средней продуктивности  
            low: '#fd7e14',       // Оранжевый для низкой продуктивности
            inactive: '#6c757d'   // Серый для неактивного времени
        };

        // Подготавливаем данные для отображения
        let dataToShow = [];

        if (viewType === 'all' || viewType === 'active') {
            dataToShow = dataToShow.concat(activePeriods || []);
        }
        if (viewType === 'all' || viewType === 'inactive') {
            dataToShow = dataToShow.concat((inactivePeriods || []).map(p => ({ ...p, type: 'inactive' })));
        }

        if (dataToShow.length === 0) {
            container.innerHTML = `
                <div class="alert alert-info">
                    <h6><i class="fas fa-info-circle"></i> Нет данных</h6>
                    <p class="mb-0">Нет данных для отображения временной шкалы.</p>
                </div>
            `;
            return;
        }

        // Создаем трассы для активных периодов
        const traces = [];
        const annotations = [];

        dataToShow.forEach((period, index) => {
            if (!period.start_time || !period.end_time) return;

            const startTime = new Date(period.start_time);
            const endTime = new Date(period.end_time);

            if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) return;

            const isInactive = period.type === 'inactive';
            const productivity = period.productivity || 0;

            // Определяем цвет на основе продуктивности
            let color = colors.inactive;
            if (!isInactive) {
                if (productivity >= 70) color = colors.high;
                else if (productivity >= 40) color = colors.medium;
                else color = colors.low;
            }

            // Форматируем время для отображения
            const startFormatted = startTime.toLocaleTimeString('ru-RU', {
                hour: '2-digit',
                minute: '2-digit'
            });
            const endFormatted = endTime.toLocaleTimeString('ru-RU', {
                hour: '2-digit',
                minute: '2-digit'
            });
            const duration = Math.round(period.duration || 0);

            // Подготавливаем детали для hover
            let hoverText = `
                <b>${isInactive ? 'Неактивное время' : 'Активный период'}</b><br>
                Время: ${startFormatted} - ${endFormatted}<br>
                Длительность: ${duration} мин<br>
            `;

            if (!isInactive) {
                hoverText += `Продуктивность: ${productivity}%<br>`;
                if (period.mouseActivity) {
                    hoverText += `Активность мыши: ${period.mouseActivity}<br>`;
                }
                if (period.activities && period.activities.length > 0) {
                    const topApps = period.activities
                        .reduce((acc, act) => {
                            const app = act.application || act.app_name || 'Неизвестно';
                            acc[app] = (acc[app] || 0) + (act.duration || 0);
                            return acc;
                        }, {});

                    const sortedApps = Object.entries(topApps)
                        .sort(([, a], [, b]) => b - a)
                        .slice(0, 3)
                        .map(([app, dur]) => `${app}: ${Math.round(dur / 60)} мин`);

                    if (sortedApps.length > 0) {
                        hoverText += `Приложения:<br>${sortedApps.join('<br>')}`;
                    }
                }
            }

            traces.push({
                x: [startTime, endTime],
                y: [isInactive ? 'Неактивное время' : 'Активное время',
                isInactive ? 'Неактивное время' : 'Активное время'],
                mode: 'lines',
                line: {
                    color: color,
                    width: 15
                },
                hovertemplate: hoverText + '<extra></extra>',
                name: isInactive ? 'Неактивное время' : `Период ${index + 1}`,
                showlegend: false
            });

            // Добавляем аннотации для длинных периодов
            if (duration >= 30) {
                annotations.push({
                    x: new Date((startTime.getTime() + endTime.getTime()) / 2),
                    y: isInactive ? 'Неактивное время' : 'Активное время',
                    text: `${duration}м`,
                    showarrow: false,
                    font: { color: 'white', size: 10 },
                    bgcolor: 'rgba(0,0,0,0.5)',
                    bordercolor: 'rgba(0,0,0,0.8)',
                    borderwidth: 1
                });
            }
        });

        // Настройка макета
        const layout = {
            title: {
                text: viewType === 'active' ? 'Активные периоды' :
                    viewType === 'inactive' ? 'Неактивное время' :
                        'Временная шкала активности',
                font: { size: 16 }
            },
            xaxis: {
                title: 'Время',
                type: 'date',
                tickformat: '%H:%M',
                showgrid: true,
                gridcolor: 'rgba(0,0,0,0.1)'
            },
            yaxis: {
                title: '',
                showgrid: true,
                gridcolor: 'rgba(0,0,0,0.1)'
            },
            margin: { l: 120, r: 50, t: 50, b: 80 },
            plot_bgcolor: 'rgba(0,0,0,0)',
            paper_bgcolor: 'rgba(0,0,0,0)',
            annotations: annotations,
            hovermode: 'closest'
        };

        // Настройка конфигурации
        const config = {
            displayModeBar: true,
            displaylogo: false,
            modeBarButtonsToRemove: ['pan2d', 'lasso2d', 'select2d', 'autoScale2d'],
            responsive: true
        };

        // Создаем график
        Plotly.newPlot(containerId, traces, layout, config);

        // Добавляем интерактивность
        container.on('plotly_hover', () => {
            container.style.cursor = 'pointer';
        });

        container.on('plotly_unhover', () => {
            container.style.cursor = 'default';
        });

        console.log('Визуализация создана успешно');

    } catch (error) {
        console.error('Ошибка при создании визуализации:', error);
        container.innerHTML = `
            <div class="alert alert-danger">
                <h6><i class="fas fa-exclamation-triangle"></i> Ошибка отображения</h6>
                <p class="mb-0">Произошла ошибка: ${error.message}</p>
            </div>
        `;
    }
}

/**
 * Тестовая функция для проверки работоспособности
 */
function testTimesheetFunctions() {
    console.log('=== ТЕСТ ФУНКЦИЙ ТАБЕЛЯ ===');

    // Проверяем доступность функций
    const functions = [
        'showTimesheet',
        'renderTimesheet',
        'updateUnifiedTimeline',
        'calculateActivityPeriods',
        'visualizeActivityPeriods',
        'setupEventHandlers'
    ];

    functions.forEach(funcName => {
        if (typeof window[funcName] === 'function') {
            console.log(`✓ ${funcName} доступна`);
        } else {
            console.warn(`✗ ${funcName} не найдена`);
        }
    });

    // Проверяем TimesheetManager
    if (window.timesheetManager && typeof window.timesheetManager.loadTimesheetData === 'function') {
        console.log('✓ TimesheetManager инициализирован');
    } else {
        console.warn('✗ TimesheetManager не инициализирован');
    }

    console.log('=== ТЕСТ ЗАВЕРШЕН ===');
}

// Добавляем тестовую функцию в window
if (typeof window !== 'undefined') {
    window.testTimesheetFunctions = testTimesheetFunctions;
}
