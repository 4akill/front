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
    if (tbody) tbody.innerHTML = '';

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

        if (tbody) tbody.appendChild(tr);
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
            // Если новый период начинается до окончания текущего (с буфером 10 сек для учета переключений)
            if (period.start <= new Date(currentPeriod.end.getTime() + 10000)) {
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
    console.log('🔄 НОВАЯ ЛОГИКА: Объединение активностей без дублирования браузеров');

    const allActivities = [];

    // Список браузеров для исключения из общего подсчета
    const browserProcesses = [
        'chrome.exe', 'firefox.exe', 'msedge.exe', 'opera.exe',
        'brave.exe', 'vivaldi.exe', 'safari.exe', 'browser.exe',
        'opera_gx.exe', 'tor.exe', 'arc.exe', 'palemoon.exe'
    ];

    // ЭТАП 1: Обрабатываем ТОЛЬКО НЕ-БРАУЗЕРНЫЕ активности из window_activity
    if (data.activities && Array.isArray(data.activities)) {
        console.log('📱 Обрабатываем активности окон (БЕЗ браузеров)');
        
        data.activities.forEach(activity => {
            const processName = (activity.process_name || activity.app_name || '').toLowerCase();
            const appName = activity.app_name || activity.process_name || 'Неизвестно';

            // Проверяем, является ли это браузером
            const isBrowser = browserProcesses.some(browser => 
                processName.includes(browser.toLowerCase()) ||
                appName.toLowerCase().includes('chrome') ||
                appName.toLowerCase().includes('firefox') ||
                appName.toLowerCase().includes('edge') ||
                appName.toLowerCase().includes('opera') ||
                appName.toLowerCase().includes('safari') ||
                appName.toLowerCase().includes('браузер')
            );

            // ВАЖНО: Добавляем в общий подсчет ТОЛЬКО НЕ-браузерные активности
            if (!isBrowser) {
                const duration = parseInt(activity.duration || activity.total_time || activity.active_time || 0);
                if (duration > 0) {
                    const startTime = new Date(activity.timestamp || activity.start_time);
                    const endTime = new Date(startTime.getTime() + duration * 1000);

                    allActivities.push({
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

        console.log(`✅ Добавлено НЕ-браузерных активностей: ${allActivities.length}`);
    }

    // ЭТАП 2: Обрабатываем браузерные активности отдельно и объединяем их
    // Используем ГИБРИДНЫЙ подход - объединяем данные из всех источников о браузерах
    const allBrowserSessions = {};

    // 2.1 Браузеры из window_activity
    if (data.activities && Array.isArray(data.activities)) {
        data.activities.forEach(activity => {
            const processName = (activity.process_name || activity.app_name || '').toLowerCase();
            const appName = activity.app_name || activity.process_name || 'Неизвестно';

            const isBrowser = browserProcesses.some(browser => 
                processName.includes(browser.toLowerCase()) ||
                appName.toLowerCase().includes('chrome') ||
                appName.toLowerCase().includes('firefox') ||
                appName.toLowerCase().includes('edge') ||
                appName.toLowerCase().includes('opera') ||
                appName.toLowerCase().includes('safari')
            );

            if (isBrowser) {
                if (!allBrowserSessions[appName]) {
                    allBrowserSessions[appName] = [];
                }

                const duration = parseInt(activity.duration || activity.total_time || activity.active_time || 0);
                if (duration > 0) {
                    const startTime = new Date(activity.timestamp || activity.start_time);
                    const endTime = new Date(startTime.getTime() + duration * 1000);

                    allBrowserSessions[appName].push({
                        source: 'window_activity',
                        start: startTime,
                        end: endTime,
                        duration: duration,
                        window_title: activity.window_title || 'Браузер',
                        productivity_score: 60
                    });
                }
            }
        });
    }

    // 2.2 Данные из browser_activity
    if (data.browser_activity && Array.isArray(data.browser_activity)) {
        data.browser_activity.forEach(activity => {
            const browserName = activity.browser_name || activity.browser || 'Браузер';
            
            if (!allBrowserSessions[browserName]) {
                allBrowserSessions[browserName] = [];
            }

            const duration = parseInt(activity.total_time || activity.duration || 0);
            if (duration > 0) {
                const startTime = new Date(activity.timestamp || activity.start_time);
                const endTime = new Date(startTime.getTime() + duration * 1000);

                allBrowserSessions[browserName].push({
                    source: 'browser_activity',
                    start: startTime,
                    end: endTime,
                    duration: duration,
                    window_title: activity.url || 'Браузерная активность',
                    productivity_score: 60
                });
            }
        });
    }

    // 2.3 Данные из website_visits (только как дополнительная информация, без времени)
    // website_visits НЕ добавляем в основной подсчет времени, так как это уже учтено в browser_activity

    // ЭТАП 3: Объединяем браузерные сессии по времени для исключения перекрытий
    Object.keys(allBrowserSessions).forEach(browserName => {
        const sessions = allBrowserSessions[browserName];
        
        if (sessions.length === 0) return;

        console.log(`🌐 Обрабатываем браузер ${browserName}: ${sessions.length} сессий`);

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
                // Если новая сессия начинается до окончания текущего периода (с буфером 10 сек)
                if (session.start <= new Date(currentPeriod.end.getTime() + 10000)) {
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
            
            // Объединяем информацию из разных источников
            const windowTitles = period.sessions
                .map(s => s.window_title)
                .filter((title, idx, arr) => title && arr.indexOf(title) === idx)
                .slice(0, 3)
                .join(', ');

            const finalWindowTitle = windowTitles + 
                (period.sessions.length > 3 ? ` (и еще ${period.sessions.length - 3})` : '');

            allActivities.push({
                type: 'browser',
                start: period.start,
                end: period.end,
                duration: periodDuration,
                application: browserName,
                app_name: browserName,
                window_title: finalWindowTitle || 'Браузерная активность',
                productivity_score: 60,
                timestamp: period.start.toISOString()
            });
        });

        const totalBrowserTime = mergedPeriods.reduce((total, p) => total + Math.floor((p.end - p.start) / 1000), 0);
        console.log(`✅ ${browserName}: ${sessions.length} сессий → ${mergedPeriods.length} периодов = ${Math.floor(totalBrowserTime/60)}м ${totalBrowserTime%60}с`);
    });

    console.log(`🎯 ИТОГО активностей в объединенном списке: ${allActivities.length}`);
    console.log(`   - НЕ-браузерные активности: ${allActivities.filter(a => a.type !== 'browser').length}`);
    console.log(`   - Браузерные активности (объединенные): ${allActivities.filter(a => a.type === 'browser').length}`);

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

// Новая функция для объединения активностей с точными данными веб-сайтов
function mergeAllActivitiesWithWebsites(data) {
    console.log('🔄 УЛУЧШЕННАЯ ЛОГИКА: Объединение активностей с точными данными веб-сайтов');

    const allActivities = [];

    // Список браузеров для исключения из общего подсчета
    const browserProcesses = [
        'chrome.exe', 'firefox.exe', 'msedge.exe', 'opera.exe',
        'brave.exe', 'vivaldi.exe', 'safari.exe', 'browser.exe',
        'opera_gx.exe', 'tor.exe', 'arc.exe', 'palemoon.exe'
    ];

    // ЭТАП 1: Обрабатываем ТОЛЬКО НЕ-БРАУЗЕРНЫЕ активности из window_activity
    if (data.activities && Array.isArray(data.activities)) {
        console.log('📱 Обрабатываем активности окон (БЕЗ браузеров)');
        
        data.activities.forEach(activity => {
            const processName = (activity.process_name || activity.app_name || '').toLowerCase();
            const appName = activity.app_name || activity.process_name || 'Неизвестно';

            // Проверяем, является ли это браузером
            const isBrowser = browserProcesses.some(browser => 
                processName.includes(browser.toLowerCase()) ||
                appName.toLowerCase().includes('chrome') ||
                appName.toLowerCase().includes('firefox') ||
                appName.toLowerCase().includes('edge') ||
                appName.toLowerCase().includes('opera') ||
                appName.toLowerCase().includes('safari') ||
                appName.toLowerCase().includes('браузер')
            );

            // ВАЖНО: Добавляем в общий подсчет ТОЛЬКО НЕ-браузерные активности
            if (!isBrowser) {
                const duration = parseInt(activity.duration || activity.total_time || activity.active_time || 0);
                if (duration > 0) {
                    const startTime = new Date(activity.timestamp || activity.start_time);
                    const endTime = new Date(startTime.getTime() + duration * 1000);

                    allActivities.push({
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

        console.log(`✅ Добавлено НЕ-браузерных активностей: ${allActivities.length}`);
    }

    // ЭТАП 2: Используем ТОЧНЫЕ данные веб-сайтов для браузерной активности
    if (data.website_visits && Array.isArray(data.website_visits) && data.website_visits.length > 0) {
        console.log('🌐 Обрабатываем ТОЧНЫЕ данные веб-сайтов:', data.website_visits.length);
        
        // Группируем посещения сайтов по времени для объединения близких по времени активностей
        const websiteActivities = [];
        
        data.website_visits.forEach(visit => {
            if (!visit.timestamp) return;
            
            const startTime = new Date(visit.timestamp);
            // Для веб-сайтов используем стандартную длительность, если не указана
            const duration = parseInt(visit.duration || 60); // 60 секунд по умолчанию
            const endTime = new Date(startTime.getTime() + duration * 1000);
            
            // Рассчитываем продуктивность на основе URL
            const productivity = calculateWebsiteProductivity(visit.url || '');
            
            websiteActivities.push({
                type: 'website',
                start: startTime,
                end: endTime,
                duration: duration,
                application: visit.browser_name || visit.browser || 'Браузер',
                window_title: visit.title || visit.url || 'Веб-сайт',
                url: visit.url,
                productivity_score: productivity,
                timestamp: visit.timestamp,
                browser: visit.browser_name || visit.browser
            });
        });
        
        // Сортируем веб-активности по времени
        websiteActivities.sort((a, b) => a.start - b.start);
        
        // Объединяем близкие по времени веб-активности для исключения микро-дублирования
        const mergedWebsiteActivities = [];
        let currentWebActivity = null;
        
        websiteActivities.forEach(activity => {
            if (!currentWebActivity) {
                currentWebActivity = { ...activity };
            } else {
                // Если активности находятся в пределах 30 секунд друг от друга
                const timeDiff = (activity.start - currentWebActivity.end) / 1000;
                
                if (timeDiff <= 30 && activity.browser === currentWebActivity.browser) {
                    // Объединяем активности
                    currentWebActivity.end = activity.end;
                    currentWebActivity.duration = Math.floor((currentWebActivity.end - currentWebActivity.start) / 1000);
                    
                    // Обновляем заголовок окна, если новый более информативный
                    if (activity.window_title && activity.window_title.length > currentWebActivity.window_title.length) {
                        currentWebActivity.window_title = activity.window_title;
                    }
                    
                    // Усредняем продуктивность
                    currentWebActivity.productivity_score = Math.round((currentWebActivity.productivity_score + activity.productivity_score) / 2);
                } else {
                    // Сохраняем текущую активность и начинаем новую
                    mergedWebsiteActivities.push(currentWebActivity);
                    currentWebActivity = { ...activity };
                }
            }
        });
        
        // Добавляем последнюю активность
        if (currentWebActivity) {
            mergedWebsiteActivities.push(currentWebActivity);
        }
        
        // Добавляем объединенные веб-активности к общему списку
        allActivities.push(...mergedWebsiteActivities);
        
        console.log(`✅ Добавлено веб-активностей: ${websiteActivities.length} → ${mergedWebsiteActivities.length} (после объединения близких)`);
    } else {
        console.log('⚠️ Нет данных веб-сайтов - используем стандартную обработку браузеров');
        
        // Если нет точных данных веб-сайтов, используем старую логику для браузеров
        if (data.activities && Array.isArray(data.activities)) {
            data.activities.forEach(activity => {
                const processName = (activity.process_name || activity.app_name || '').toLowerCase();
                const appName = activity.app_name || activity.process_name || 'Неизвестно';

                const isBrowser = browserProcesses.some(browser => 
                    processName.includes(browser.toLowerCase()) ||
                    appName.toLowerCase().includes('chrome') ||
                    appName.toLowerCase().includes('firefox') ||
                    appName.toLowerCase().includes('edge') ||
                    appName.toLowerCase().includes('opera') ||
                    appName.toLowerCase().includes('safari')
                );

                if (isBrowser) {
                    const duration = parseInt(activity.duration || activity.total_time || activity.active_time || 0);
                    if (duration > 0) {
                        const startTime = new Date(activity.timestamp || activity.start_time);
                        const endTime = new Date(startTime.getTime() + duration * 1000);

                        allActivities.push({
                            ...activity,
                            type: 'browser',
                            start: startTime,
                            end: endTime,
                            duration: duration,
                            application: appName,
                            window_title: activity.window_title || 'Браузерная активность',
                            productivity_score: 60
                        });
                    }
                }
            });
        }
    }

    console.log(`🎯 ИТОГО активностей в улучшенном объединенном списке: ${allActivities.length}`);
    console.log(`   - НЕ-браузерные активности: ${allActivities.filter(a => a.type === 'window').length}`);
    console.log(`   - Веб-активности (точные): ${allActivities.filter(a => a.type === 'website').length}`);
    console.log(`   - Браузерные активности (общие): ${allActivities.filter(a => a.type === 'browser').length}`);

    return allActivities;
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

// Функции для управления двухуровневыми спойлерами хронологии

function toggleMajorPeriod(periodIndex) {
    console.log('Переключение крупного периода:', periodIndex);

    const header = document.querySelector(`tr.major-period-header[data-major-index="${periodIndex}"]`);
    const icon = header?.querySelector('.period-icon');

    if (!header) {
        console.log('Заголовок крупного периода не найден:', periodIndex);
        return;
    }

    // Находим все строки этого периода (подпериоды и события)
    const rows = document.querySelectorAll(`tr[data-parent-major="${periodIndex}"]:not(.major-period-header)`);
    console.log('Найдено строк для переключения:', rows.length);

    // Определяем текущее состояние по иконке
    const isCurrentlyCollapsed = icon?.className.includes('chevron-right');
    console.log('Текущее состояние (свернуто):', isCurrentlyCollapsed);

    // Переключаем видимость
    rows.forEach(row => {
        row.style.display = isCurrentlyCollapsed ? '' : 'none';
    });

    // Обновляем иконку и класс заголовка
    if (icon) {
        if (isCurrentlyCollapsed) {
            // Разворачиваем - показываем стрелку вниз
            icon.className = 'bi bi-chevron-down period-icon me-2';
            header.classList.remove('major-collapsed');
            console.log('Период развернут');
        } else {
            // Сворачиваем - показываем стрелку вправо
            icon.className = 'bi bi-chevron-right period-icon me-2';
            header.classList.add('major-collapsed');
            console.log('Период свернут');
        }
    }
}

function toggleMinorPeriod(majorIndex, minorIndex) {
    console.log('Переключение подпериода:', majorIndex, minorIndex);

    const header = document.querySelector(`tr.minor-period-header[data-minor-index="${majorIndex}-${minorIndex}"]`);
    const icon = header?.querySelector('.period-icon');

    if (!header) {
        console.log('Заголовок подпериода не найден:', majorIndex, minorIndex);
        return;
    }

    // Находим все строки событий этого подпериода
    const rows = document.querySelectorAll(`tr.activity-event[data-parent-minor="${majorIndex}-${minorIndex}"]`);
    console.log('Найдено строк событий для переключения:', rows.length);

    // Определяем текущее состояние по иконке
    const isCurrentlyCollapsed = icon?.className.includes('chevron-right');
    console.log('Текущее состояние подпериода (свернуто):', isCurrentlyCollapsed);

    // Переключаем видимость
    rows.forEach(row => {
        row.style.display = isCurrentlyCollapsed ? '' : 'none';
    });

    // Обновляем иконку и класс заголовка
    if (icon) {
        if (isCurrentlyCollapsed) {
            // Разворачиваем - показываем стрелку вниз
            icon.className = 'bi bi-chevron-down period-icon me-2';
            header.classList.remove('minor-collapsed');
            console.log('Подпериод развернут');
        } else {
            // Сворачиваем - показываем стрелку вправо
            icon.className = 'bi bi-chevron-right period-icon me-2';
            header.classList.add('minor-collapsed');
            console.log('Подпериод свернут');
        }
    }
}

// Исправленная функция для сворачивания/разворачивания всех крупных периодов
function toggleAllMajorPeriods(collapse = null) {
    const tbody = document.querySelector('#chronology-table tbody');
    if (!tbody) return;

    const majorHeaders = tbody.querySelectorAll('.major-period-header');

    if (collapse === null) {
        // Определяем, что делать на основе первого периода
        const firstHeader = majorHeaders[0];
        collapse = firstHeader && !firstHeader.classList.contains('major-collapsed');
    }

    majorHeaders.forEach((header, index) => {
        const periodIndex = header.getAttribute('data-major-index');
        const isCurrentlyCollapsed = header.classList.contains('major-collapsed');

        if (collapse && !isCurrentlyCollapsed) {
            toggleMajorPeriod(periodIndex);
        } else if (!collapse && isCurrentlyCollapsed) {
            toggleMajorPeriod(periodIndex);
        }
    });

    console.log('Все крупные периоды:', collapse ? 'свернуты' : 'развернуты');
}

// Исправленная функция для сворачивания/разворачивания всех подпериодов
function toggleAllMinorPeriods(collapse = null) {
    const tbody = document.querySelector('#chronology-table tbody');
    if (!tbody) return;

    const minorHeaders = tbody.querySelectorAll('.minor-period-header');

    if (collapse === null) {
        // Определяем, что делать на основе первого подпериода
        const firstHeader = minorHeaders[0];
        collapse = firstHeader && !firstHeader.classList.contains('minor-collapsed');
    }

    minorHeaders.forEach(header => {
        const periodKey = header.getAttribute('data-minor-index');
        if (periodKey) {
            const [majorIndex, minorIndex] = periodKey.split('-');
            const isCurrentlyCollapsed = header.classList.contains('minor-collapsed');

            if (collapse && !isCurrentlyCollapsed) {
                toggleMinorPeriod(majorIndex, minorIndex);
            } else if (!collapse && isCurrentlyCollapsed) {
                toggleMinorPeriod(majorIndex, minorIndex);
            }
        }
    });

    console.log('Все подпериоды:', collapse ? 'свернуты' : 'развернуты');
}

// Функция для проверки наличия скриншота
function hasScreenshotForTime(timestamp, appName) {
    console.log('🔍 Проверка наличия скриншота для:', timestamp, appName);
    
    const screenshot = findScreenshotByTime(timestamp, appName);
    const hasScreenshot = !!screenshot;
    
    console.log('📸 Результат проверки скриншота:', {
        timestamp,
        appName,
        hasScreenshot,
        matchQuality: screenshot?._matchQuality,
        timeDiff: screenshot?._timeDiff
    });
    
    return hasScreenshot;
}

// Обновленная функция для создания кнопки скриншота с проверкой наличия
function createScreenshotButton(timeStr, appName) {
    const hasScreenshot = hasScreenshotForTime(timeStr, appName);
    const iconClass = hasScreenshot ? 'bi-camera-fill text-primary' : 'bi-camera text-muted';
    const title = hasScreenshot ? `Скриншот найден для ${timeStr}` : `Поиск скриншота для ${timeStr}`;
    const btnClass = hasScreenshot ? 'btn-primary' : 'btn-outline-secondary';

    return `<button class="btn btn-sm ${btnClass} screenshot-btn ms-2" 
            onclick="openScreenshotFromChronology('${timeStr}', '${appName || 'Неизвестно'}', this)" 
            title="${title}">
            <i class="${iconClass}"></i>
        </button>`;
}

// Инициализация управления спойлерами после загрузки DOM
document.addEventListener('DOMContentLoaded', function () {
    console.log('Инициализация управления спойлерами хронологии');

    // Добавляем делегирование событий для динамически создаваемых элементов
    document.addEventListener('click', function (event) {
        // Обработка кликов по крупным периодам
        if (event.target.closest('.major-period-header')) {
            const header = event.target.closest('.major-period-header');
            const periodIndex = header.getAttribute('data-major-index');
            if (periodIndex !== null) {
                event.preventDefault();
                event.stopPropagation();
                console.log('Клик по крупному периоду:', periodIndex);
                toggleMajorPeriod(periodIndex);
            }
        }

        // Обработка кликов по подпериодам
        else if (event.target.closest('.minor-period-header')) {
            const header = event.target.closest('.minor-period-header');
            const periodKey = header.getAttribute('data-minor-index');
            if (periodKey) {
                const [majorIndex, minorIndex] = periodKey.split('-');
                event.preventDefault();
                event.stopPropagation();
                console.log('Клик по подпериоду:', majorIndex, minorIndex);
                toggleMinorPeriod(majorIndex, minorIndex);
            }
        }

        // Обработка кликов по заголовкам часов (для вкладки активности окон)
        else if (event.target.closest('.hour-header')) {
            const header = event.target.closest('.hour-header');
            if (header && !event.target.closest('.btn')) { // Игнорируем клики по кнопкам внутри заголовка
                event.preventDefault();
                event.stopPropagation();
                console.log('Клик по заголовку часа');
                
                // Находим час из первого события после заголовка
                let hour = null;
                let nextElement = header.nextElementSibling;
                while (nextElement && !hour) {
                    if (nextElement.dataset.hourGroup) {
                        hour = nextElement.dataset.hourGroup;
                        break;
                    }
                    nextElement = nextElement.nextElementSibling;
                }
                
                if (hour !== null) {
                    const tbody = header.closest('tbody');
                    const relatedEvents = tbody.querySelectorAll(`tr[data-hour-group="${hour}"]`);
                    const icon = header.querySelector('.collapse-icon i');
                    const isCollapsed = header.classList.contains('collapsed');

                    console.log('Найдено событий для часа', hour, ':', relatedEvents.length);

                    if (isCollapsed) {
                        // Разворачиваем
                        header.classList.remove('collapsed');
                        if (icon) icon.className = 'bi bi-chevron-down';
                        relatedEvents.forEach(row => {
                            row.style.display = '';
                        });
                        console.log('Час развернут');
                    } else {
                        // Сворачиваем
                        header.classList.add('collapsed');
                        if (icon) icon.className = 'bi bi-chevron-right';
                        relatedEvents.forEach(row => {
                            row.style.display = 'none';
                        });
                        console.log('Час свернут');
                    }
                }
            }
        }
    });

    console.log('Делегирование событий для спойлеров настроено');
});

// Функции для работы со скриншотами по времени из хронологии

function findScreenshotByTime(timestamp, appName) {
    console.log('🔍 Улучшенный поиск скриншота для времени:', timestamp, 'приложение:', appName);

    // Получаем загруженные скриншоты из window.lastLoadedData
    const screenshots = window.lastLoadedData?.screenshots || [];

    if (screenshots.length === 0) {
        console.log('Нет загруженных скриншотов');
        showError('Скриншоты не загружены. Сначала загрузите данные.');
        return null;
    }

    // Парсим время из строки (формат: "20:30:42")
    const targetTime = parseTimeString(timestamp);
    if (!targetTime) {
        console.log('Не удалось распарсить время:', timestamp);
        return null;
    }

    console.log('Ищем скриншот для времени:', targetTime, 'процесс:', appName);

    // Сначала ищем точное совпадение по процессу и времени (в пределах 2 минут)
    let bestExactMatch = null;
    let minExactTimeDiff = Infinity;
    const EXACT_SEARCH_WINDOW = 2 * 60 * 1000; // 2 минуты в миллисекундах

    // Затем ищем близкие совпадения (в пределах 5 минут)
    let bestCloseMatch = null;
    let minCloseTimeDiff = Infinity;
    const CLOSE_SEARCH_WINDOW = 5 * 60 * 1000; // 5 минут в миллисекундах

    screenshots.forEach(screenshot => {
        const screenshotTime = new Date(screenshot.timestamp);
        const timeDiff = Math.abs(targetTime.getTime() - screenshotTime.getTime());
        
        // Проверяем соответствие процесса
        const screenshotApp = (screenshot.app_name || screenshot.active_app || '').toLowerCase();
        const targetApp = (appName || '').toLowerCase();
        
        // Точное совпадение процесса
        const exactProcessMatch = screenshotApp === targetApp || 
                                 screenshotApp.includes(targetApp) || 
                                 targetApp.includes(screenshotApp);
        
        // Частичное совпадение процесса (для .exe файлов)
        const partialProcessMatch = screenshotApp.replace('.exe', '') === targetApp.replace('.exe', '') ||
                                   screenshotApp.split('.')[0] === targetApp.split('.')[0];

        console.log(`Проверяем скриншот: ${screenshot.timestamp} (${screenshotApp}) vs ${targetApp}, разница: ${Math.round(timeDiff/1000)}с`);

        // Приоритет 1: Точное совпадение процесса и времени в пределах 2 минут
        if ((exactProcessMatch || partialProcessMatch) && timeDiff <= EXACT_SEARCH_WINDOW && timeDiff < minExactTimeDiff) {
            minExactTimeDiff = timeDiff;
            bestExactMatch = screenshot;
            console.log(`✅ Найдено точное совпадение: ${screenshot.timestamp} (${screenshotApp}), разница: ${Math.round(timeDiff/1000)}с`);
        }
        
        // Приоритет 2: Близкое совпадение по времени в пределах 5 минут (любой процесс)
        else if (timeDiff <= CLOSE_SEARCH_WINDOW && timeDiff < minCloseTimeDiff) {
            minCloseTimeDiff = timeDiff;
            bestCloseMatch = screenshot;
            console.log(`🔶 Найдено близкое совпадение: ${screenshot.timestamp} (${screenshotApp}), разница: ${Math.round(timeDiff/1000)}с`);
        }
    });

    // Возвращаем лучший результат
    const bestMatch = bestExactMatch || bestCloseMatch;
    
    if (bestMatch) {
        const matchType = bestExactMatch ? 'точное' : 'близкое';
        const timeDiff = bestExactMatch ? minExactTimeDiff : minCloseTimeDiff;
        console.log(`🎯 Выбран ${matchType} скриншот:`, bestMatch.timestamp, 'приложение:', bestMatch.app_name || bestMatch.active_app);
        console.log('Временная разница:', Math.round(timeDiff / 1000), 'секунд');
        
        // Добавляем информацию о качестве совпадения
        bestMatch._matchQuality = bestExactMatch ? 'exact' : 'close';
        bestMatch._timeDiff = timeDiff;
    } else {
        console.log('❌ Скриншот не найден в пределах 5 минут для процесса', appName);
    }

    return bestMatch;
}

function parseTimeString(timeStr) {
    // Парсим время в формате "20:30:42" или "20:30:42 до 20:37:34"
    const timeMatch = timeStr.match(/(\d{2}):(\d{2}):(\d{2})/);
    if (!timeMatch) return null;

    const [, hours, minutes, seconds] = timeMatch;

    // Получаем текущую выбранную дату из фильтра
    const selectedDate = document.getElementById('date-filter')?.value;
    if (!selectedDate) {
        console.log('Не выбрана дата в фильтре');
        return null;
    }

    // Создаем объект Date с правильной датой и временем
    const targetDate = new Date(selectedDate);
    targetDate.setHours(parseInt(hours), parseInt(minutes), parseInt(seconds), 0);

    return targetDate;
}

function openScreenshotFromChronology(timestamp, appName, elementButton) {
    console.log('🖼️ Открытие скриншота из хронологии:', timestamp, appName);

    // Добавляем визуальную обратную связь
    if (elementButton) {
        elementButton.classList.add('loading');
        elementButton.innerHTML = '<i class="bi bi-hourglass-split"></i>';
    }

    // Ищем скриншот
    const screenshot = findScreenshotByTime(timestamp, appName);

    if (screenshot) {
        // Переключаемся на вкладку скриншотов
        switchToScreenshotsTab();

        // Небольшая задержка для завершения переключения вкладки
        setTimeout(() => {
            // Определяем заголовок модального окна с информацией о качестве совпадения
            let modalTitle = `Скриншот: ${screenshot.app_name || screenshot.active_app || appName}`;
            if (screenshot._matchQuality === 'exact') {
                modalTitle += ' ✅ (точное совпадение)';
            } else if (screenshot._matchQuality === 'close') {
                const timeDiffSec = Math.round(screenshot._timeDiff / 1000);
                modalTitle += ` 🔶 (±${timeDiffSec}с)`;
            }

            // Открываем модальное окно скриншота
            openScreenshotModal(
                screenshot.screenshot,
                screenshot.timestamp,
                modalTitle,
                getProductivityScore(screenshot) >= 0.5
            );

            // Восстанавливаем кнопку с индикацией качества совпадения
            if (elementButton) {
                elementButton.classList.remove('loading');
                let iconClass = 'bi-camera text-muted';
                let title = `Скриншот не найден для ${timestamp}`;
                
                if (screenshot._matchQuality === 'exact') {
                    iconClass = 'bi-camera-fill text-success';
                    title = `Точный скриншот для ${timestamp} (${appName})`;
                } else if (screenshot._matchQuality === 'close') {
                    iconClass = 'bi-camera text-warning';
                    const timeDiffSec = Math.round(screenshot._timeDiff / 1000);
                    title = `Приблизительный скриншот для ${timestamp} (±${timeDiffSec}с)`;
                }
                
                elementButton.innerHTML = `<i class="${iconClass}"></i>`;
                elementButton.title = title;
            }
        }, 300);

    } else {
        // Скриншот не найден
        const errorMsg = `Скриншот не найден для времени ${timestamp}${appName ? ' и процесса ' + appName : ''}`;
        showError(errorMsg);
        console.log('❌', errorMsg);

        // Восстанавливаем кнопку
        if (elementButton) {
            elementButton.classList.remove('loading');
            elementButton.innerHTML = '<i class="bi bi-camera-slash text-muted"></i>';
            elementButton.title = `Скриншот не найден для ${timestamp}`;
        }
    }
}

function switchToScreenshotsTab() {
    console.log('Переключение на вкладку скриншотов');

    // Ищем вкладку скриншотов
    const screenshotsTab = document.querySelector('[data-bs-target="#screenshots"]') ||
        document.querySelector('a[href="#screenshots"]') ||
        document.getElementById('screenshots-tab');

    if (screenshotsTab) {
        // Используем Bootstrap для переключения вкладки
        const tabInstance = new bootstrap.Tab(screenshotsTab);
        tabInstance.show();
        console.log('Переключились на вкладку скриншотов');
    } else {
        console.log('Вкладка скриншотов не найдена');
    }
}

function addScreenshotButtonToActivity(activityElement, timestamp, appName) {
    // Проверяем, есть ли уже кнопка скриншота
    if (activityElement.querySelector('.screenshot-btn')) {
        return; // Кнопка уже добавлена
    }

    // Создаем кнопку для просмотра скриншота
    const screenshotBtn = document.createElement('button');
    screenshotBtn.className = 'btn btn-sm btn-outline-info screenshot-btn ms-2';
    screenshotBtn.innerHTML = '<i class="bi bi-camera"></i>';
    screenshotBtn.title = `Найти скриншот для ${timestamp}`;
    screenshotBtn.onclick = function (e) {
        e.preventDefault();
        e.stopPropagation();
        openScreenshotFromChronology(timestamp, appName, this);
    };

    // Добавляем кнопку в первую ячейку (время)
    const timeCell = activityElement.querySelector('td:first-child');
    if (timeCell) {
        timeCell.appendChild(screenshotBtn);
    }
}

// Экспорт функций в глобальную область видимости
window.findScreenshotByTime = findScreenshotByTime;
window.openScreenshotFromChronology = openScreenshotFromChronology;
window.switchToScreenshotsTab = switchToScreenshotsTab;
window.addScreenshotButtonToActivity = addScreenshotButtonToActivity;
window.toggleMajorPeriod = toggleMajorPeriod;
window.toggleMinorPeriod = toggleMinorPeriod;
window.toggleAllMajorPeriods = toggleAllMajorPeriods;
window.toggleAllMinorPeriods = toggleAllMinorPeriods;

// Функция для инициализации обычного табеля (временная заглушка)
function initRegularTimesheet() {
    console.log('🕐 initRegularTimesheet: функция инициализована как заглушка');
    // Эта функция будет реализована в отдельном модуле
}
window.hasScreenshotForTime = hasScreenshotForTime;
window.createScreenshotButton = createScreenshotButton;

// Вспомогательная функция для демонстрации и отладки
function testScreenshotSearch() {
    const testTime = "20:30:42";
    const testApp = "Chrome";
    console.log('Тестируем поиск скриншота для времени:', testTime, 'приложение:', testApp);

    const screenshot = findScreenshotByTime(testTime, testApp);
    if (screenshot) {
        console.log('Найден скриншот:', screenshot);
        return screenshot;
    } else {
        console.log('Скриншот не найден');
        return null;
    }
}

// Делаем функции глобальными для работы кнопок в HTML
window.toggleMajorPeriod = toggleMajorPeriod;
window.toggleMinorPeriod = toggleMinorPeriod;
window.toggleAllMajorPeriods = toggleAllMajorPeriods;
window.toggleAllMinorPeriods = toggleAllMinorPeriods;

