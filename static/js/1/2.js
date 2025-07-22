// Функция для обновления таблицы с данными активности мыши
function updateMouseActivityTable(mouseData) {
    const tbody = document.getElementById('mouse-activity-table')?.querySelector('tbody');
    if (!tbody) return;

    if (!mouseData || mouseData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center">Нет данных об активности мыши</td></tr>';
        return;
    }

    // Очистка таблицы
    if (tbody) tbody.innerHTML = '';

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
        let monitoringData = [], windowData = [], browserData = [], mouseData = [], websiteVisitsData = [];

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

        // Получаем данные активности браузеров
        try {
            const browserResponse = await fetch(`/api/public/activity/browsers?${params.toString()}`);
            if (browserResponse.ok) {
                browserData = await browserResponse.json();
                console.log('Данные активности браузеров:', browserData);

                // Применяем клиентскую фильтрацию
                const filters = getCurrentFilters();
                browserData = filterDataByEmployee(browserData, filters.employeeId, filters.deviceId);
                console.log('Данные активности браузеров после фильтрации:', browserData);
            } else {
                console.error(`HTTP error ${browserResponse.status}: ${await browserResponse.text()}`);
            }
        } catch (error) {
            console.error('Ошибка при загрузке данных браузеров:', error);
        }

        // Получаем данные о посещениях веб-сайтов
        try {
            const websiteResponse = await fetch(`/api/public/activity/website_visits?${params.toString()}`);
            if (websiteResponse.ok) {
                websiteVisitsData = await websiteResponse.json();
                console.log('Данные о посещениях веб-сайтов:', websiteVisitsData);

                // Применяем клиентскую фильтрацию
                const filters = getCurrentFilters();
                websiteVisitsData = filterDataByEmployee(websiteVisitsData, filters.employeeId, filters.deviceId);
                console.log('Данные о посещениях веб-сайтов после фильтрации:', websiteVisitsData);
            } else {
                console.error(`HTTP error ${websiteResponse.status}: ${await websiteResponse.text()}`);
            }
        } catch (error) {
            console.error('Ошибка при загрузке данных о посещениях веб-сайтов:', error);
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

        // Получаем данные сетевой активности
        let networkData = [];
        try {
        const networkResponse = await fetch(`/api/public/network_activity?${params.toString()}`);
        if (networkResponse.ok) {
        networkData = await networkResponse.json();
        console.log('Данные сетевой активности:', networkData);

        // Применяем клиентскую фильтрацию
        const filters = getCurrentFilters();
        networkData = filterDataByEmployee(networkData, filters.employeeId, filters.deviceId);
        console.log('Данные сетевой активности после фильтрации:', networkData);

        // Обновляем сетевые метрики через модуль
        if (typeof updateNetworkMetrics === 'function') {
        updateNetworkMetrics(networkData);
        } else {
        console.warn('⚠️ Функция updateNetworkMetrics не найдена. Проверьте подключение модуля smart-network-monitor.js');
        }
        } else {
        console.error(`HTTP error ${networkResponse.status}: ${await networkResponse.text()}`);
        }
    } catch (error) {
        console.error('Ошибка при загрузке данных сетевой активности:', error);
    }

        // Получаем данные клавиатурной активности
        let keyboardData = [];
        try {
            const keyboardResponse = await fetch(`/api/public/activity/keyboard?${params.toString()}`);
            if (keyboardResponse.ok) {
                keyboardData = await keyboardResponse.json();
                console.log('Данные клавиатурной активности:', keyboardData);

                // Применяем клиентскую фильтрацию
                const filters = getCurrentFilters();
                keyboardData = filterDataByEmployee(keyboardData, filters.employeeId, filters.deviceId);
                console.log('Данные клавиатурной активности после фильтрации:', keyboardData);

                // Обновляем клавиатурные метрики через модуль
                if (typeof updateKeyboardMetrics === 'function') {
                    updateKeyboardMetrics(keyboardData);
                } else {
                    console.warn('⚠️ Функция updateKeyboardMetrics не найдена. Проверьте подключение модуля smart-keyboard-metrics.js');
                }
            } else {
                console.error(`HTTP error ${keyboardResponse.status}: ${await keyboardResponse.text()}`);
            }
        } catch (error) {
            console.error('Ошибка при загрузке данных клавиатурной активности:', error);
        }
        // Обновляем информацию о периоде в UI

        // Обновляем информацию о периоде в UI
        updatePeriodDisplay(formattedStartDate, formattedEndDate, selectedPeriod);

        // Создаем объект данных для обработки
        const data = {
        resources: monitoringData,
        activities: windowData,
        website_visits: websiteVisitsData,
        browser_activity: browserData,
        mouse_activity: mouseData,
        screenshots: screenshotsData,
        period_info: {
        start_date: formattedStartDate,
        end_date: formattedEndDate,
        period_type: selectedPeriod
            }
        };
        
        // Сохраняем данные для системы продвинутой аналитики
        window.currentDashboardData = data;
        console.log('📊 Данные сохранены для аналитики:', data);

        // Проверка на наличие данных перед обновлением метрик

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

        // Обновление данных по браузерам и посещениям веб-сайтов
        try { updateBrowserChart(data); }
        catch (e) { console.error('Ошибка при обновлении графика браузеров:', e); }

        try { updateWebsitesList(websiteVisitsData); }
        catch (e) { console.error('Ошибка при обновлении списка посещений веб-сайтов:', e); }

        try { updateWebsiteActivityChart(websiteVisitsData); }
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

        // ДОБАВЛЕНО: Обновляем основные метрики с помощью умного калькулятора
        try {
            // Проверяем доступность умного калькулятора
            if (typeof updateMainMetricsWithRealActivityPrecise === 'function') {
                console.log('🧠 Используем ТОЧНЫЙ калькулятор времени');
                
                // Сначала сохраняем все данные в глобальные переменные для умного калькулятора
                window.lastLoadedData = {
                    activities: windowData || [],
                    mouse: mouseData || [],
                    browser_activity: browserData || [],
                    website_visits: websiteVisitsData || [],
                    keyboard_activity: keyboardData || [],
                    monitoring: monitoringData || [],
                    screenshots: screenshotsData || []
                };
                
                console.log('🔄 Передаем в умный калькулятор данные:');
                console.log('   📱 Оконные активности:', windowData.length);
                console.log('   🌐 Браузерные активности:', browserData.length);
                console.log('   🌐 Посещения сайтов:', websiteVisitsData.length);
                console.log('   ⌨️ Клавиатурная активность:', keyboardData.length);
                console.log('   🖱️ Активность мыши:', mouseData.length);
                
                // Проверяем есть ли данные активности
                const totalActivityRecords = windowData.length + browserData.length + keyboardData.length + mouseData.length;
                console.log('📊 Общее количество записей активности:', totalActivityRecords);
                
                if (totalActivityRecords > 0) {
                    // ИСПРАВЛЕНО: Используем фикс фильтрации данных
                    if (typeof updateSmartCalculatorWithFilters === 'function') {
                        updateSmartCalculatorWithFilters(windowData, mouseData);
                    } else {
                        // Fallback на оригинальный метод если фикс не загружен
                        updateMainMetricsWithRealActivity(windowData);
                    }
                } else {
                    console.log('⚠️ Нет данных активности для расчета метрик');
                    // Используем fallback на стандартную функцию
                    const fallbackData = {
                        activities: windowData || [],
                        browser_activity: browserData || [],
                        website_visits: websiteVisitsData || [],
                        mouse_activity: mouseData || [],
                        keyboard_activity: keyboardData || []
                    };
                    if (typeof updateMetrics === 'function') {
                        updateMetrics(fallbackData);
                    }
                }
            } else if (typeof updateMainMetricsWithRealActivity === 'function') {
                console.log('⚠️ Точный калькулятор недоступен, используем умный калькулятор');
                // Fallback на умный калькулятор
                window.lastLoadedData = {
                    activities: windowData || [],
                    mouse: mouseData || [],
                    browser_activity: browserData || [],
                    website_visits: websiteVisitsData || [],
                    keyboard_activity: keyboardData || [],
                    monitoring: monitoringData || [],
                    screenshots: screenshotsData || []
                };
                
                const totalActivityRecords = windowData.length + browserData.length + keyboardData.length + mouseData.length;
                if (totalActivityRecords > 0) {
                    // ИСПРАВЛЕНО: Используем фикс фильтрации данных
                    if (typeof updateSmartCalculatorWithFilters === 'function') {
                        updateSmartCalculatorWithFilters(windowData, mouseData);
                    } else {
                        // Fallback на оригинальный метод если фикс не загружен
                        updateMainMetricsWithRealActivity(windowData);
                    }
                } else {
                    const fallbackData = {
                        activities: windowData || [],
                        browser_activity: browserData || [],
                        website_visits: websiteVisitsData || [],
                        mouse_activity: mouseData || [],
                        keyboard_activity: keyboardData || []
                    };
                    if (typeof updateMetrics === 'function') {
                        updateMetrics(fallbackData);
                    }
                }
            } else {
                console.log('⚠️ Калькуляторы недоступны, используем стандартный расчет');
                // Fallback на стандартную логику
                const fallbackData = {
                    activities: windowData || [],
                    browser_activity: browserData || [],
                    website_visits: websiteVisitsData || [],
                    mouse_activity: mouseData || [],
                    keyboard_activity: keyboardData || []
                };
                if (typeof updateMetrics === 'function') {
                    updateMetrics(fallbackData);
                }
            }
        } catch (e) {
            console.error('Ошибка при обновлении метрик:', e);
        }

        // Сохраняем данные для повторного использования при переключении вкладок
        window.lastLoadedData = {
        activities: windowData,
        mouse: mouseData,
        screenshots: screenshotsData,
        monitoring: monitoringData,
        browser_activity: browserData,
        website_visits: websiteVisitsData,
        keyboard_activity: keyboardData
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

        // Упрощенная фильтрация по дате - просто проверяем начало строки timestamp
        const filteredData = filteredByEmployee.filter(item => {
            if (!item.timestamp) return false;

            // Простая проверка - начинается ли timestamp с выбранной даты
            const timestampStr = item.timestamp.toString();
            const matches = timestampStr.startsWith(chronologyDate);

            if (matches) {
                console.log(`✅ Найдена запись за ${chronologyDate}:`, {
                    timestamp: item.timestamp,
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
            const browserActivityResponse = await fetch(`/api/public/activity/browsers?${params.toString()}`);
            if (browserActivityResponse.ok) {
                const browserActivityData = await browserActivityResponse.json();
                console.log('Данные об активности браузера:', browserActivityData);

                // Данные уже в формате массива, не нужно извлекать browser_activities
                // Применяем клиентскую фильтрацию по сотруднику и устройству
                const filters = getCurrentFilters();
                let filteredBrowserByEmployee = filterDataByEmployee(browserActivityData, filters.employeeId, filters.deviceId);
                console.log('Данные об активности браузера после фильтрации по сотруднику:', filteredBrowserByEmployee);

                // Фильтруем данные по выбранной дате
                console.log(`🔍 Фильтруем данные активности браузера для даты: ${chronologyDate}`);

                const filteredBrowserData = filteredBrowserByEmployee.filter(item => {
                    if (!item.timestamp) return false;

                    // Простая проверка - начинается ли timestamp с выбранной даты
                    const timestampStr = item.timestamp.toString();
                    return timestampStr.startsWith(chronologyDate);
                });

                console.log(`🌐 Найдено записей активности браузера за ${chronologyDate}: ${filteredBrowserData.length}`);

                // Сохраняем для возможной сортировки позже
                window.chronologyWebsiteData = filteredBrowserData;

                // Обновляем таблицу посещенных сайтов с данными browser_activity
                updateChronologyWebsitesTable(filteredBrowserData, sortOrder);
            } else {
                console.error(`HTTP error ${browserActivityResponse.status}: ${await browserActivityResponse.text()}`);
                updateChronologyWebsitesTable([], sortOrder);
            }
        } catch (browserError) {
            console.error('Ошибка при загрузке данных об активности браузера:', browserError);
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

    // Сортируем данные по временной метке в порядке возрастания для группировки
    const sortedEvents = [...chronologyData].sort((a, b) => {
        return new Date(a.timestamp) - new Date(b.timestamp);
    });

    // Первый уровень группировки - крупные периоды активности (разрыв больше 30 минут)
    const MAJOR_GAP_MINUTES = 15; // 30 минут для разделения крупных периодов
    const MINOR_GAP_MINUTES = 2;  // 3 минуты для разделения подпериодов
    const MIN_INACTIVE_MINUTES = 5; // Минимальный неактивный период для отображения

    const majorPeriods = [];
    let currentMajorPeriod = null;

    // Группируем в крупные периоды
    sortedEvents.forEach((event, index) => {
        const eventDate = new Date(event.timestamp);
        const eventDuration = event.duration || 60;
        const eventEndDate = new Date(eventDate.getTime() + eventDuration * 1000);

        if (!currentMajorPeriod) {
            currentMajorPeriod = {
                startTime: eventDate,
                endTime: eventDate,
                events: [event]
            };
        } else {
            const lastEvent = currentMajorPeriod.events[currentMajorPeriod.events.length - 1];
            const lastEventDuration = lastEvent.duration || 60;
            const lastEventEndDate = new Date(new Date(lastEvent.timestamp).getTime() + lastEventDuration * 1000);
            const timeDiffMinutes = (eventDate - lastEventEndDate) / (1000 * 60);

            // Если разрыв больше 30 минут - создаем новый крупный период
            if (timeDiffMinutes >= MAJOR_GAP_MINUTES) {
                majorPeriods.push(currentMajorPeriod);
                currentMajorPeriod = {
                    startTime: eventDate,
                    endTime: eventDate,
                    events: [event]
                };
            } else {
                // Добавляем событие в текущий крупный период
                currentMajorPeriod.events.push(event);
                currentMajorPeriod.endTime = eventDate;
            }
        }
    });

    // Добавляем последний крупный период
    if (currentMajorPeriod) {
        majorPeriods.push(currentMajorPeriod);
    }

    // Второй уровень группировки - подпериоды внутри каждого крупного периода
    majorPeriods.forEach(majorPeriod => {
        const minorPeriods = [];
        let currentMinorPeriod = null;

        // Сортируем события внутри крупного периода
        const majorPeriodEvents = [...majorPeriod.events].sort((a, b) => {
            return new Date(a.timestamp) - new Date(b.timestamp);
        });

        majorPeriodEvents.forEach((event, index) => {
            const eventDate = new Date(event.timestamp);
            const eventDuration = event.duration || 60;
            const eventEndDate = new Date(eventDate.getTime() + eventDuration * 1000);

            if (!currentMinorPeriod) {
                currentMinorPeriod = {
                    startTime: eventDate,
                    endTime: eventEndDate,
                    events: [event]
                };
            } else {
                const lastEvent = currentMinorPeriod.events[currentMinorPeriod.events.length - 1];
                const lastEventDuration = lastEvent.duration || 60;
                const lastEventEndDate = new Date(new Date(lastEvent.timestamp).getTime() + lastEventDuration * 1000);
                const timeDiffMinutes = (eventDate - lastEventEndDate) / (1000 * 60);

                // Если разрыв больше 3 минут - создаем новый подпериод
                if (timeDiffMinutes >= MINOR_GAP_MINUTES) {
                    minorPeriods.push(currentMinorPeriod);
                    currentMinorPeriod = {
                        startTime: eventDate,
                        endTime: eventEndDate,
                        events: [event]
                    };
                } else {
                    // Добавляем событие в текущий подпериод
                    currentMinorPeriod.events.push(event);
                    if (eventEndDate > currentMinorPeriod.endTime) {
                        currentMinorPeriod.endTime = eventEndDate;
                    }
                }
            }
        });

        // Добавляем последний подпериод
        if (currentMinorPeriod) {
            minorPeriods.push(currentMinorPeriod);
        }

        majorPeriod.minorPeriods = minorPeriods;
    });

    // Сортируем крупные периоды в соответствии с выбранным порядком
    const finalMajorPeriods = [...majorPeriods];
    if (sortOrder === 'desc') {
        finalMajorPeriods.reverse();
    }

    // Обновляем таблицу
    const tbody = document.getElementById('chronology-table').querySelector('tbody');
    if (tbody) tbody.innerHTML = '';

    // Создаем структуру с крупными спойлерами
    finalMajorPeriods.forEach((majorPeriod, majorIndex) => {
        // Рассчитываем общее время и количество событий крупного периода
        const majorStartTime = majorPeriod.startTime;
        const majorEndTime = majorPeriod.endTime;
        const majorDurationMs = majorEndTime - majorStartTime;
        const majorDurationSeconds = Math.floor(majorDurationMs / 1000);
        const totalEvents = majorPeriod.events.length;

        // Форматируем время крупного периода
        const majorStartTimeStr = `${majorStartTime.getHours().toString().padStart(2, '0')}:${majorStartTime.getMinutes().toString().padStart(2, '0')}:${majorStartTime.getSeconds().toString().padStart(2, '0')}`;
        const majorEndTimeStr = `${majorEndTime.getHours().toString().padStart(2, '0')}:${majorEndTime.getMinutes().toString().padStart(2, '0')}:${majorEndTime.getSeconds().toString().padStart(2, '0')}`;

        // Форматируем длительность крупного периода
        let majorDurationStr;
        if (majorDurationSeconds < 60) {
            majorDurationStr = `${majorDurationSeconds} сек`;
        } else if (majorDurationSeconds < 3600) {
            const minutes = Math.floor(majorDurationSeconds / 60);
            const seconds = majorDurationSeconds % 60;
            majorDurationStr = `${minutes} мин${seconds > 0 ? ` ${seconds} сек` : ''}`;
        } else {
            const hours = Math.floor(majorDurationSeconds / 3600);
            const minutes = Math.floor((majorDurationSeconds % 3600) / 60);
            majorDurationStr = `${hours} ч${minutes > 0 ? ` ${minutes} мин` : ''}`;
        }

        // Создаем крупный спойлер
        const majorRow = document.createElement('tr');
        majorRow.className = 'major-period-header';
        majorRow.dataset.majorIndex = majorIndex;

        majorRow.innerHTML = `
            <td colspan="4" class="major-period-spoiler" style="cursor: pointer; background-color: #e3f2fd; padding: 15px; border: 2px solid #2196f3; border-radius: 8px;">
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <i class="bi bi-chevron-down period-icon me-2" style="font-size: 1.2em;"></i>
                        <span class="time-badge fw-bold" style="font-size: 1.1em;">${majorStartTimeStr} - ${majorEndTimeStr}</span>
                        <span class="duration-badge ms-2" style="font-size: 1.1em; font-weight: bold;">(${majorDurationStr})</span>
                        <span class="events-badge ms-2" style="font-size: 1.0em;">(${totalEvents} ${totalEvents === 1 ? 'событие' : totalEvents < 5 ? 'события' : 'событий'})</span>
                    </div>
                    <div>
                        <span class="badge bg-primary" style="font-size: 0.9em;">Период активности</span>
                    </div>
                </div>
            </td>
        `;

        // Удаляем addEventListener - используем делегирование через data-атрибуты
        tbody.appendChild(majorRow);

        // Добавляем подпериоды внутри крупного периода
        const minorPeriodsToShow = sortOrder === 'desc' ? [...majorPeriod.minorPeriods].reverse() : majorPeriod.minorPeriods;

        minorPeriodsToShow.forEach((minorPeriod, minorIndex) => {
            const minorStartTime = minorPeriod.startTime;
            const minorEndTime = minorPeriod.endTime;
            const minorDurationMs = minorEndTime - minorStartTime;
            const minorDurationSeconds = Math.floor(minorDurationMs / 1000);

            // Форматируем время подпериода
            const minorStartTimeStr = `${minorStartTime.getHours().toString().padStart(2, '0')}:${minorStartTime.getMinutes().toString().padStart(2, '0')}:${minorStartTime.getSeconds().toString().padStart(2, '0')}`;
            const minorEndTimeStr = `${minorEndTime.getHours().toString().padStart(2, '0')}:${minorEndTime.getMinutes().toString().padStart(2, '0')}:${minorEndTime.getSeconds().toString().padStart(2, '0')}`;

            // Форматируем длительность подпериода
            let minorDurationStr;
            if (minorDurationSeconds < 60) {
                minorDurationStr = `${minorDurationSeconds} сек`;
            } else if (minorDurationSeconds < 3600) {
                const minutes = Math.floor(minorDurationSeconds / 60);
                const seconds = minorDurationSeconds % 60;
                minorDurationStr = `${minutes} мин${seconds > 0 ? ` ${seconds} сек` : ''}`;
            } else {
                const hours = Math.floor(minorDurationSeconds / 3600);
                const minutes = Math.floor((minorDurationSeconds % 3600) / 60);
                minorDurationStr = `${hours} ч${minutes > 0 ? ` ${minutes} мин` : ''}`;
            }

            // Создаем подспойлер
            const minorRow = document.createElement('tr');
            minorRow.className = 'minor-period-header';
            minorRow.dataset.parentMajor = majorIndex;
            minorRow.dataset.minorIndex = `${majorIndex}-${minorIndex}`;

            minorRow.innerHTML = `
                <td colspan="4" class="minor-period-spoiler" style="cursor: pointer; background-color: #f0f8ff; padding: 10px; margin-left: 20px; border-left: 3px solid #64b5f6;">
                    <div style="margin-left: 20px;">
                        <i class="bi bi-chevron-down period-icon me-2"></i>
                        <span class="time-badge">${minorStartTimeStr} - ${minorEndTimeStr}</span>
                        <span class="duration-badge ms-2">(${minorDurationStr})</span>
                        <span class="events-badge ms-2">(${minorPeriod.events.length} ${minorPeriod.events.length === 1 ? 'событие' : minorPeriod.events.length < 5 ? 'события' : 'событий'})</span>
                        <span class="badge bg-success ms-2" style="font-size: 0.8em;">Активность</span>
                    </div>
                </td>
            `;

            // Удаляем addEventListener - используем делегирование через data-атрибуты
            tbody.appendChild(minorRow);

            // Добавляем события подпериода
            const eventsToShow = sortOrder === 'desc' ? [...minorPeriod.events].reverse() : minorPeriod.events;

            eventsToShow.forEach((event, eventIndex) => {
                const eventDate = new Date(event.timestamp);
                const timeStr = `${eventDate.getHours().toString().padStart(2, '0')}:${eventDate.getMinutes().toString().padStart(2, '0')}:${eventDate.getSeconds().toString().padStart(2, '0')}`;

                // Определяем продолжительность события
                let durationStr = '-';
                let endTimeStr = '';
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

                    // Рассчитываем конечное время
                    const endTime = new Date(eventDate.getTime() + (duration * 1000));
                    endTimeStr = `${endTime.getHours().toString().padStart(2, '0')}:${endTime.getMinutes().toString().padStart(2, '0')}:${endTime.getSeconds().toString().padStart(2, '0')}`;
                }

                // Определяем класс продуктивности
                const isBreak = isBreakActivity(event);
                const productivityClass = isBreak ? 'text-muted' :
                    (event.is_productive ? 'text-success' :
                        (event.is_productive === false ? 'text-danger' : ''));

                // Создаем строку события
                const eventRow = document.createElement('tr');
                eventRow.className = `activity-event ${productivityClass}`;
                eventRow.dataset.parentMajor = majorIndex;
                eventRow.dataset.parentMinor = `${majorIndex}-${minorIndex}`;

                // Формируем ячейку времени с кнопкой скриншота
                let timeCell = `<strong>${timeStr}</strong>`;
                if (endTimeStr && endTimeStr !== timeStr) {
                    timeCell += `<br><small class="text-muted">до ${endTimeStr}</small>`;
                }

                // Добавляем кнопку скриншота используя новую функцию
                timeCell += createScreenshotButton(timeStr, event.app_name || 'Неизвестно');

                const appName = event.app_name || 'Неизвестно';
                const windowTitle = event.window_title || 'Без названия';

                eventRow.innerHTML = `
                    <td style="padding-left: 50px;">${timeCell}</td>
                    <td title="${appName}">${appName}</td>
                    <td title="${windowTitle}">${windowTitle}</td>
                    <td><strong>${durationStr}</strong></td>
                `;

                tbody.appendChild(eventRow);
            });
        });

        // Добавляем неактивный период после крупного периода (если есть следующий период)
        if (majorIndex < finalMajorPeriods.length - 1) {
            const nextMajorPeriod = finalMajorPeriods[majorIndex + 1];
            const currentEndTime = sortOrder === 'desc' ? nextMajorPeriod.endTime : majorPeriod.endTime;
            const nextStartTime = sortOrder === 'desc' ? majorPeriod.startTime : nextMajorPeriod.startTime;
            const inactiveMinutes = Math.floor((nextStartTime - currentEndTime) / (1000 * 60));

            if (inactiveMinutes >= MIN_INACTIVE_MINUTES) {
                const inactiveStartTimeStr = `${currentEndTime.getHours().toString().padStart(2, '0')}:${currentEndTime.getMinutes().toString().padStart(2, '0')}`;
                const inactiveEndTimeStr = `${nextStartTime.getHours().toString().padStart(2, '0')}:${nextStartTime.getMinutes().toString().padStart(2, '0')}`;

                const inactiveRow = document.createElement('tr');
                inactiveRow.className = 'inactive-period-row';
                inactiveRow.innerHTML = `
                    <td colspan="4" class="text-center text-muted" style="background-color: #f8f9fa; padding: 15px; border-top: 2px dashed #dee2e6; border-bottom: 2px dashed #dee2e6;">
                        <i class="bi bi-clock"></i>
                        <strong>Неактивное время: ${inactiveStartTimeStr} - ${inactiveEndTimeStr}</strong>
                        <span class="badge bg-secondary ms-2">${Math.floor(inactiveMinutes / 60) > 0 ? Math.floor(inactiveMinutes / 60) + ' ч ' : ''}${inactiveMinutes % 60} мин</span>
                    </td>
                `;
                tbody.appendChild(inactiveRow);
            }
        }
    });

    // По умолчанию сворачиваем все крупные спойлеры, кроме последнего (самого недавнего)
    const allMajorHeaders = tbody.querySelectorAll('.major-period-header');
    allMajorHeaders.forEach((header, index) => {
        if (sortOrder === 'desc' && index > 0) {
            // В порядке убывания сворачиваем все, кроме первого (самого недавнего)
            const majorIndex = header.dataset.majorIndex;
            toggleMajorPeriod(majorIndex);
        } else if (sortOrder === 'asc' && index < allMajorHeaders.length - 1) {
            // В порядке возрастания сворачиваем все, кроме последнего
            const majorIndex = header.dataset.majorIndex;
            toggleMajorPeriod(majorIndex);
        }
    });

    console.log('Таблица хронологии обновлена с', finalMajorPeriods.length, 'крупными периодами');
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
    console.log('📊 [SMART] Используем данные smart-калькулятора для программ');
    
    // Получаем данные от smart-калькулятора
    const smartMetrics = window.lastSmartMetrics || {};
    const smartDetails = window.lastSmartDetails || {};
    
    if (smartDetails.applications && smartDetails.applications.length > 0) {
        console.log('✅ [SMART] Найдены данные программ от smart-калькулятора:', smartDetails.applications.length);
        
        const programStats = {};
        
        smartDetails.applications.forEach(app => {
            if (!app.name) return;
            
            // Исключаем браузеры из таблицы программ
            const browserProcesses = [
                'chrome.exe', 'firefox.exe', 'msedge.exe', 'opera.exe',
                'brave.exe', 'vivaldi.exe', 'safari.exe', 'browser.exe'
            ];
            
            const isBrowser = browserProcesses.some(browser => 
                app.name.toLowerCase().includes(browser.toLowerCase())
            );
            
            if (isBrowser) {
                console.log(`🌐 [SMART] Пропускаем браузер: ${app.name}`);
                return;
            }
            
            if (!programStats[app.name]) {
                programStats[app.name] = {
                    app_name: app.name,
                    duration: 0,
                    launches: 0,
                    real_activity_time: 0,
                    is_smart_calculated: true
                };
            }
            
            // Используем время из smart-калькулятора
            const appTime = app.time || 0;
            const isActive = app.is_active || false;
            
            programStats[app.name].duration += appTime;
            programStats[app.name].launches += 1;
            
            if (isActive) {
                programStats[app.name].real_activity_time += appTime;
            }
            
            const timeMin = Math.round(appTime / 60);
            console.log(`📱 [SMART] ${app.name}: ${timeMin}м (активность: ${isActive})`);
        });
        
        const result = Object.values(programStats);
        console.log('✅ [SMART] Обработка программ завершена:', result.length, 'программ');
        return result;
        
    } else {
        console.warn('⚠️ [SMART] Нет данных программ от smart-калькулятора - показываем пустой список');
        return [];
    }
}

// Функция для обновления таблицы активности в папках
function updateFoldersActivityTable(foldersData) {
    const tbody = document.querySelector('#folders-activity-table tbody');
    if (!tbody) {
        console.error('Не найден элемент таблицы активности в папках');
        return;
    }

    if (tbody) tbody.innerHTML = '';

    if (!foldersData || foldersData.length === 0) {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td colspan="3" class="text-center">Нет данных об активности в папках за выбранную дату</td>`;
        if (tbody) tbody.appendChild(tr);
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
        if (tbody) tbody.appendChild(tr);
    });
}

// Функция для обновления таблицы активности программ
function updateProgramsActivityTable(programsData) {
    const tbody = document.querySelector('#programs-activity-table tbody');
    if (!tbody) {
        console.error('Не найден элемент таблицы активности программ');
        return;
    }

        if (!programsData || programsData.length === 0) {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td colspan="3" class="text-center">Нет данных об активности программ за выбранную дату</td>`;
        if (tbody) tbody.appendChild(tr);
        return;
    }

    // Проверяем, используются ли данные умного калькулятора
    const isSmartCalculated = programsData.length > 0 && programsData[0].is_smart_calculated;
    
    // Добавляем заголовок с информацией об умном калькуляторе
    if (isSmartCalculated) {
        const headerTr = document.createElement('tr');
        headerTr.className = 'table-info';
        headerTr.innerHTML = `
            <td colspan="3" class="text-center">
                <small><i class="fas fa-brain"></i> Данные скорректированы умным калькулятором (исключены фоновые процессы)</small>
            </td>
        `;
        tbody.appendChild(headerTr);
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
        
        // Добавляем индикатор для программ с реальной активностью
        let activityIndicator = '';
        if (isSmartCalculated && program.real_activity_time > 0) {
            const realActivityPercent = Math.round((program.real_activity_time / program.duration) * 100);
            activityIndicator = ` <small class="text-muted">(${realActivityPercent}% активности)</small>`;
        }
        
        tr.innerHTML = `
            <td>${program.app_name || '-'}${activityIndicator}</td>
            <td>${duration}</td>
            <td>${program.launches || 0}</td>
        `;
        if (tbody) tbody.appendChild(tr);
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

        // Интеграция с модулем продвинутой аналитики
        if (window.smartAnalytics && typeof window.smartAnalytics.initialize === 'function') {
            console.log('🔬 Инициализируем интеграцию с модулем аналитики');
            
            // Добавляем обработчик изменения устройства для аналитики
            const deviceFilter = document.getElementById('device-filter');
            if (deviceFilter) {
                const originalHandler = deviceFilter.onchange;
                deviceFilter.addEventListener('change', function() {
                    if (window.smartAnalytics && typeof window.smartAnalytics.setDeviceId === 'function') {
                        console.log('🔬 Обновляем device_id в модуле аналитики:', this.value);
                        window.smartAnalytics.setDeviceId(this.value);
                    }
                });
            }
        }

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
// ВАЖНО: Эта таблица используется только для ВИЗУАЛИЗАЦИИ посещений сайтов
// Данные НЕ участвуют в общем подсчете времени активности (уже учтены в browser_activity)
function updateChronologyWebsitesTable(browserActivityData, sortOrder = 'desc') {
    console.log('📊 ВИЗУАЛИЗАЦИЯ: Обновляем таблицу активности браузера (на основе browser_activity):', browserActivityData);

    const tbody = document.getElementById('chronology-websites-table').querySelector('tbody');

    // Проверяем наличие данных
    if (!browserActivityData || browserActivityData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center">Нет данных об активности браузера за выбранную дату</td></tr>';
        return;
    }

    // Сортируем данные по временной метке
    browserActivityData.sort((a, b) => {
        const dateA = new Date(a.timestamp);
        const dateB = new Date(b.timestamp);
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });

    // Группируем события по часам
    const eventsByHour = {};
    browserActivityData.forEach(event => {
        const eventDate = new Date(event.timestamp);
        const hour = eventDate.getHours();

        if (!eventsByHour[hour]) {
            eventsByHour[hour] = [];
        }
        eventsByHour[hour].push(event);
    });

    // Очищаем таблицу
    if (tbody) tbody.innerHTML = '';

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
        let totalTime = 0;

        events.forEach(event => {
            const eventStart = new Date(event.timestamp);
            if (!earliestEvent || eventStart < new Date(earliestEvent.timestamp)) {
                earliestEvent = event;
            }
            if (!latestEvent || eventStart > new Date(latestEvent.timestamp)) {
                latestEvent = event;
            }
            // Используем total_time из browser_activity вместо duration
            if (event.total_time) {
                totalTime += event.total_time;
            }
        });

        // Форматируем время для отображения в заголовке
        let timeRangeText = '';
        if (earliestEvent && latestEvent) {
            const startTime = new Date(earliestEvent.timestamp);
            const endTime = new Date(latestEvent.timestamp);

            // Если есть total_time у последнего события, добавляем его
            if (latestEvent.total_time) {
                endTime.setSeconds(endTime.getSeconds() + latestEvent.total_time);
            }

            const formattedStartTime = `${startTime.getHours().toString().padStart(2, '0')}:${startTime.getMinutes().toString().padStart(2, '0')}`;
            const formattedEndTime = `${endTime.getHours().toString().padStart(2, '0')}:${endTime.getMinutes().toString().padStart(2, '0')}`;
            timeRangeText = `${formattedStartTime} - ${formattedEndTime}`;
        }

        // Подсчитываем продуктивные и непродуктивные сайты
        const productiveSites = events.filter(e => calculateWebsiteProductivity(e.url) > 0.6).length;
        const unproductiveSites = events.filter(e => calculateWebsiteProductivity(e.url) < 0.4).length;
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
                            ${events.length} ${events.length === 1 ? 'активность' : events.length < 5 ? 'активности' : 'активностей'}
                        </span>
                        ${productiveSites > 0 ? `<span class="productive-badge"><i class="bi bi-check-circle me-1"></i>${productiveSites}</span>` : ''}
                        ${unproductiveSites > 0 ? `<span class="unproductive-badge"><i class="bi bi-x-circle me-1"></i>${unproductiveSites}</span>` : ''}
                        ${neutralSites > 0 ? `<span class="neutral-badge"><i class="bi bi-circle me-1"></i>${neutralSites}</span>` : ''}
                        ${totalTime > 0 ? `<span class="duration-badge"><i class="bi bi-clock me-1"></i>${formatDuration(totalTime)}</span>` : ''}
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

            // Определяем конечное время события, если есть total_time
            let endTimeStr = '';
            let durationText = '';
            if (event.total_time) {
                const endTime = new Date(eventDate.getTime() + (event.total_time * 1000));
                const endHours = endTime.getHours().toString().padStart(2, '0');
                const endMinutes = endTime.getMinutes().toString().padStart(2, '0');
                const endSeconds = endTime.getSeconds().toString().padStart(2, '0');
                endTimeStr = `${endHours}:${endMinutes}:${endSeconds}`;
                durationText = formatDuration(event.total_time);
            }

            // Определяем класс продуктивности на основе URL
            const productivityScore = calculateWebsiteProductivity(event.url);
            let productivityClass = '';
            let productivityIcon = '';
            if (productivityScore > 0.6) {
                productivityClass = 'text-success';
                productivityIcon = '<i class="bi bi-check-circle-fill text-success me-2"></i>';
            } else if (productivityScore < 0.4) {
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

            // Получаем title страницы (используем window_title из browser_activity)
            const pageTitle = event.window_title || 'Без названия';
            const displayTitle = pageTitle.length > 50 ? pageTitle.substring(0, 50) + '...' : pageTitle;

            eventRow.innerHTML = `
                ${timeCell}
                <td class="website-cell">
                    <div class="website-info">
                        <div class="website-header">
                            ${productivityIcon}
                            <img src="${favicon}" alt="" class="favicon me-2" style="width: 16px; height: 16px;" onerror="this.style.display='none'">
                            <strong class="website-title">${displayTitle}</strong>
                            ${event.browser_name ? `<span class="browser-badge ms-2">${event.browser_name}</span>` : ''}
                        </div>
                        <div class="website-url">
                            <a href="${event.url}" target="_blank" class="text-muted small">
                                <i class="bi bi-link-45deg me-1"></i>${displayUrl}
                            </a>
                        </div>
                        ${event.visits ? `<div class="website-visits"><small class="text-muted"><i class="bi bi-eye me-1"></i>${event.visits} посещений</small></div>` : ''}
                    </div>
                </td>
                <td class="productivity-cell text-center">
                    <span class="productivity-indicator ${productivityClass}">
                        ${Math.round(productivityScore * 100)}%
                    </span>
                </td>
                <td class="actions-cell">
                    <button class="btn btn-sm btn-outline-secondary" onclick="window.open('${event.url}', '_blank')" title="Открыть сайт">
                        <i class="bi bi-box-arrow-up-right"></i>
                    </button>
                </td>
            `;

            tbody.appendChild(eventRow);
        });

        // Добавляем обработчик клика для сворачивания/разворачивания группы
        hourRow.addEventListener('click', function() {
            const content = tbody.querySelectorAll(`[data-hour-group="${hour}"]`);
            const icon = this.querySelector('.collapse-icon i');
            
            content.forEach(row => {
                if (row.style.display === 'none') {
                    row.style.display = '';
                    icon.className = 'bi bi-chevron-down';
                } else {
                    row.style.display = 'none';
                    icon.className = 'bi bi-chevron-right';
                }
            });
        });
    });
}
