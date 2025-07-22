// Умная система работы со скриншотами
console.log('🖼️ Загружен модуль smart-screenshots.js');

// Глобальные переменные для кэширования скриншотов
let screenshotsCache = new Map();
let screenshotsLoadingPromises = new Map();

/**
 * Инициализация системы скриншотов
 */
function initSmartScreenshots() {
    console.log('🖼️ Инициализация умной системы скриншотов');
    
    // Очищаем кэш при смене даты
    document.addEventListener('dateChanged', () => {
        screenshotsCache.clear();
        screenshotsLoadingPromises.clear();
        console.log('🗑️ Кэш скриншотов очищен');
    });
}

/**
 * Загружает скриншоты для указанной даты
 * @param {string} date - Дата в формате YYYY-MM-DD
 * @param {string} employeeId - ID сотрудника (опционально)
 * @param {string} deviceId - ID устройства (опционально)
 * @returns {Promise<Array>} - Массив скриншотов
 */
async function loadScreenshotsForDate(date, employeeId = '', deviceId = '') {
    const cacheKey = `${date}-${employeeId}-${deviceId}`;
    
    // Проверяем кэш
    if (screenshotsCache.has(cacheKey)) {
        console.log(`📋 Скриншоты для ${date} взяты из кэша`);
        return screenshotsCache.get(cacheKey);
    }
    
    // Проверяем, не загружаем ли уже
    if (screenshotsLoadingPromises.has(cacheKey)) {
        console.log(`⏳ Ожидание загрузки скриншотов для ${date}`);
        return await screenshotsLoadingPromises.get(cacheKey);
    }
    
    // Создаем промис загрузки
    const loadingPromise = loadScreenshotsFromAPI(date, employeeId, deviceId);
    screenshotsLoadingPromises.set(cacheKey, loadingPromise);
    
    try {
        const screenshots = await loadingPromise;
        
        // Сохраняем в кэш
        screenshotsCache.set(cacheKey, screenshots);
        console.log(`✅ Скриншоты для ${date} загружены и кэшированы: ${screenshots.length} штук`);
        
        return screenshots;
    } catch (error) {
        console.error(`❌ Ошибка загрузки скриншотов для ${date}:`, error);
        return [];
    } finally {
        // Убираем промис из списка загружающихся
        screenshotsLoadingPromises.delete(cacheKey);
    }
}

/**
 * Загружает скриншоты через API
 * @param {string} date - Дата
 * @param {string} employeeId - ID сотрудника
 * @param {string} deviceId - ID устройства
 * @returns {Promise<Array>} - Массив скриншотов
 */
async function loadScreenshotsFromAPI(date, employeeId, deviceId) {
    const params = new URLSearchParams({
        start_date: date,
        end_date: date
    });
    
    if (employeeId) params.append('employee_id', employeeId);
    if (deviceId) params.append('device_id', deviceId);
    
    console.log(`🔄 Загружаем скриншоты через API: /api/public/activity/screenshots?${params.toString()}`);
    
    const response = await fetch(`/api/public/activity/screenshots?${params.toString()}`);
    
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const screenshots = await response.json();
    
    if (!Array.isArray(screenshots)) {
        console.warn('⚠️ API вернул не массив скриншотов:', screenshots);
        return [];
    }
    
    // Обрабатываем скриншоты
    return screenshots.map(screenshot => ({
        ...screenshot,
        timestamp: new Date(screenshot.timestamp || screenshot.created_at),
        app_name: screenshot.app_name || screenshot.application || 'Неизвестно',
        window_title: screenshot.window_title || screenshot.title || '',
        is_productive: screenshot.is_productive !== undefined ? screenshot.is_productive : true,
        base64_data: screenshot.base64_data || screenshot.image_data || screenshot.data
    }));
}

/**
 * УЛУЧШЕННЫЙ поиск скриншота по времени и приложению с точным соответствием
 * @param {Date|string} timestamp - Время активности
 * @param {string} appName - Название приложения
 * @param {Array} screenshots - Массив скриншотов (опционально, если не передан - загружает автоматически)
 * @param {number} maxTimeDiffSeconds - Максимальная разница во времени в секундах (по умолчанию 30 секунд)
 * @returns {Promise<Object|null>} - Найденный скриншот или null
 */
async function findScreenshotByTimeAndApp(timestamp, appName, screenshots = null, maxTimeDiffSeconds = 30) {
    const targetTime = new Date(timestamp);
    const dateStr = targetTime.toISOString().split('T')[0];
    
    // Если скриншоты не переданы, загружаем их
    if (!screenshots) {
        screenshots = await loadScreenshotsForDate(dateStr);
    }
    
    if (!screenshots || screenshots.length === 0) {
        console.log(`📭 Нет скриншотов для поиска (${appName} в ${targetTime.toLocaleTimeString()})`);
        return null;
    }
    
    console.log(`🔍 Ищем скриншот для ${appName} в ${targetTime.toLocaleTimeString()} среди ${screenshots.length} скриншотов`);
    
    // Фильтруем скриншоты по приложению
    const appMatchingScreenshots = screenshots.filter(screenshot => {
        return compareAppNames(appName, screenshot.app_name);
    });
    
    if (appMatchingScreenshots.length === 0) {
        console.log(`❌ Нет скриншотов для приложения ${appName}`);
        return null;
    }
    
    console.log(`📱 Найдено ${appMatchingScreenshots.length} скриншотов для приложения ${appName}`);
    
    // Ищем скриншот с минимальной разницей по времени
    let bestMatch = null;
    let minTimeDiff = Infinity;
    
    appMatchingScreenshots.forEach(screenshot => {
        const screenshotTime = new Date(screenshot.timestamp);
        const timeDiffMs = Math.abs(targetTime - screenshotTime);
        const timeDiffSeconds = timeDiffMs / 1000;
        
        console.log(`⏰ Проверяем скриншот в ${screenshotTime.toLocaleTimeString()}: разница ${timeDiffSeconds.toFixed(1)}с`);
        
        // Проверяем, что разница во времени не превышает максимально допустимую
        if (timeDiffSeconds <= maxTimeDiffSeconds && timeDiffMs < minTimeDiff) {
            bestMatch = screenshot;
            minTimeDiff = timeDiffMs;
            console.log(`✨ Новый лучший кандидат: разница ${timeDiffSeconds.toFixed(1)}с`);
        }
    });
    
    if (bestMatch) {
        const timeDiffSeconds = (minTimeDiff / 1000).toFixed(1);
        console.log(`🎯 НАЙДЕН точный скриншот для ${appName} в ${targetTime.toLocaleTimeString()}: разница ${timeDiffSeconds}с`);
        
        // Дополнительная проверка на "кражу" скриншотов
        const screenshotTime = new Date(bestMatch.timestamp);
        const isExactMatch = Math.abs(targetTime - screenshotTime) <= (maxTimeDiffSeconds * 1000);
        
        if (!isExactMatch) {
            console.warn(`⚠️ Скриншот не точно соответствует времени активности (разница больше ${maxTimeDiffSeconds}с)`);
            return null;
        }
        
        return bestMatch;
    } else {
        console.log(`❌ НЕ НАЙДЕН подходящий скриншот для ${appName} в ${targetTime.toLocaleTimeString()}`);
        return null;
    }
}

/**
 * СТРОГОЕ сравнение названий приложений с учетом различных форматов
 * @param {string} name1 - Первое название
 * @param {string} name2 - Второе название
 * @returns {boolean} - true если названия совпадают
 */
function compareAppNames(name1, name2) {
    if (!name1 || !name2) return false;
    
    const normalize = (name) => {
        return name.toLowerCase()
            .replace(/\.exe$/, '')
            .replace(/\s+/g, '')
            .replace(/[^\w]/g, '');
    };
    
    const normalized1 = normalize(name1);
    const normalized2 = normalize(name2);
    
    console.log(`🔤 Сравниваем приложения: "${normalized1}" vs "${normalized2}"`);
    
    // Точное совпадение
    if (normalized1 === normalized2) {
        console.log(`✅ Точное совпадение названий приложений`);
        return true;
    }
    
    // Проверяем вхождение одного в другое (только если разница не слишком большая)
    const minLength = Math.min(normalized1.length, normalized2.length);
    const maxLength = Math.max(normalized1.length, normalized2.length);
    
    // Если одно название слишком короткое по сравнению с другим, не считаем совпадением
    if (minLength < 3 || maxLength / minLength > 2) {
        console.log(`❌ Названия слишком разные по длине`);
        return false;
    }
    
    if (normalized1.includes(normalized2) || normalized2.includes(normalized1)) {
        console.log(`✅ Частичное совпадение названий приложений`);
        return true;
    }
    
    // Специальные случаи для браузеров (более строгие правила)
    const browserAliases = {
        'chrome': ['googlechrome', 'chromium'],
        'firefox': ['mozilla', 'firefoxesr'],
        'edge': ['msedge', 'microsoftedge'],
        'opera': ['operagx', 'operabrowser']
    };
    
    for (const [main, aliases] of Object.entries(browserAliases)) {
        const name1IsBrowser = normalized1.includes(main) || aliases.some(alias => normalized1.includes(alias));
        const name2IsBrowser = normalized2.includes(main) || aliases.some(alias => normalized2.includes(alias));
        
        if (name1IsBrowser && name2IsBrowser) {
            console.log(`✅ Оба названия относятся к браузеру ${main}`);
            return true;
        }
    }
    
    console.log(`❌ Названия приложений не совпадают`);
    return false;
}

/**
 * Создает кнопку для просмотра скриншота с улучшенной проверкой
 * @param {Date|string} timestamp - Время активности
 * @param {string} appName - Название приложения
 * @param {string} containerId - ID контейнера для кнопки
 * @returns {Promise<HTMLElement|null>} - Созданная кнопка или null
 */
async function createScreenshotButton(timestamp, appName, containerId = null) {
    console.log(`🔘 Создаем кнопку скриншота для ${appName} в ${new Date(timestamp).toLocaleTimeString()}`);
    
    const screenshot = await findScreenshotByTimeAndApp(timestamp, appName);
    
    if (!screenshot) {
        console.log(`❌ Скриншот не найден, кнопка не создана`);
        return null;
    }
    
    const button = document.createElement('button');
    button.className = 'btn btn-sm btn-outline-primary screenshot-btn';
    button.innerHTML = '<i class="bi bi-camera"></i>';
    
    const screenshotTime = new Date(screenshot.timestamp);
    const activityTime = new Date(timestamp);
    const timeDiff = Math.abs(screenshotTime - activityTime) / 1000;
    
    button.title = `Скриншот в ${screenshotTime.toLocaleTimeString()} (±${timeDiff.toFixed(1)}с)`;
    
    button.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        openScreenshotModal(screenshot, timestamp, appName);
    });
    
    if (containerId) {
        const container = document.getElementById(containerId);
        if (container) {
            container.appendChild(button);
        }
    }
    
    console.log(`✅ Кнопка скриншота создана`);
    return button;
}

/**
 * Открывает модальное окно со скриншотом с дополнительной информацией
 * @param {Object} screenshot - Объект скриншота
 * @param {Date|string} activityTimestamp - Время активности (для сравнения)
 * @param {string} activityAppName - Название приложения активности
 */
function openScreenshotModal(screenshot, activityTimestamp = null, activityAppName = null) {
    console.log('🖼️ Открываем скриншот:', screenshot);
    
    // Создаем модальное окно, если его нет
    let modal = document.getElementById('screenshot-modal');
    if (!modal) {
        modal = createScreenshotModal();
        document.body.appendChild(modal);
    }
    
    // Заполняем данные
    const img = modal.querySelector('#screenshot-image');
    const title = modal.querySelector('#screenshot-title');
    const info = modal.querySelector('#screenshot-info');
    
    if (img && screenshot.base64_data) {
        img.src = `data:image/png;base64,${screenshot.base64_data}`;
        img.alt = `Скриншот ${screenshot.app_name}`;
    }
    
    if (title) {
        title.textContent = `${screenshot.app_name} - ${new Date(screenshot.timestamp).toLocaleString()}`;
    }
    
    if (info) {
        let infoHtml = `
            <strong>Приложение:</strong> ${screenshot.app_name}<br>
            <strong>Заголовок окна:</strong> ${screenshot.window_title || 'Не указан'}<br>
            <strong>Время скриншота:</strong> ${new Date(screenshot.timestamp).toLocaleString()}<br>
            <strong>Продуктивность:</strong> ${screenshot.is_productive ? 'Продуктивно' : 'Непродуктивно'}
        `;
        
        // Добавляем информацию о соответствии активности
        if (activityTimestamp && activityAppName) {
            const activityTime = new Date(activityTimestamp);
            const screenshotTime = new Date(screenshot.timestamp);
            const timeDiff = Math.abs(screenshotTime - activityTime) / 1000;
            
            infoHtml += `<hr>`;
            infoHtml += `<strong>Время активности:</strong> ${activityTime.toLocaleString()}<br>`;
            infoHtml += `<strong>Приложение активности:</strong> ${activityAppName}<br>`;
            infoHtml += `<strong>Точность соответствия:</strong> ±${timeDiff.toFixed(1)} секунд<br>`;
            
            if (timeDiff <= 10) {
                infoHtml += `<span class="badge bg-success">Точное соответствие</span>`;
            } else if (timeDiff <= 30) {
                infoHtml += `<span class="badge bg-warning">Приблизительное соответствие</span>`;
            } else {
                infoHtml += `<span class="badge bg-danger">Неточное соответствие</span>`;
            }
        }
        
        info.innerHTML = infoHtml;
    }
    
    // Показываем модальное окно
    const bootstrapModal = new bootstrap.Modal(modal);
    bootstrapModal.show();
}

/**
 * Создает HTML для модального окна скриншота
 * @returns {HTMLElement} - Элемент модального окна
 */
function createScreenshotModal() {
    const modalHtml = `
        <div class="modal fade" id="screenshot-modal" tabindex="-1" aria-labelledby="screenshot-modal-label" aria-hidden="true">
            <div class="modal-dialog modal-xl">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="screenshot-modal-label">
                            <span id="screenshot-title">Скриншот</span>
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Закрыть"></button>
                    </div>
                    <div class="modal-body text-center">
                        <img id="screenshot-image" class="img-fluid rounded shadow" style="max-height: 70vh;" alt="Скриншот">
                        <div class="mt-3">
                            <div id="screenshot-info" class="text-start"></div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Закрыть</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = modalHtml;
    return tempDiv.firstElementChild;
}

/**
 * УЛУЧШЕННОЕ добавление кнопок скриншотов к элементам хронологии с точной привязкой
 * @param {string} containerSelector - Селектор контейнера с элементами хронологии
 * @param {string} dateFilter - Дата для фильтрации (опционально)
 */
async function addScreenshotButtonsToTimeline(containerSelector = '.chronology-item', dateFilter = null) {
    console.log('🔄 Добавляем кнопки скриншотов к хронологии с точной привязкой');
    
    const items = document.querySelectorAll(containerSelector);
    const currentDate = dateFilter || new Date().toISOString().split('T')[0];
    
    console.log(`📅 Обрабатываем ${items.length} элементов хронологии для даты ${currentDate}`);
    
    // Загружаем скриншоты для текущей даты
    const screenshots = await loadScreenshotsForDate(currentDate);
    
    if (screenshots.length === 0) {
        console.log('📭 Нет скриншотов для добавления кнопок');
        return;
    }
    
    console.log(`📸 Загружено ${screenshots.length} скриншотов для сопоставления`);
    
    let buttonsAdded = 0;
    let buttonsSkipped = 0;
    
    for (const item of items) {
        const timeElement = item.querySelector('[data-time]');
        const appElement = item.querySelector('[data-app]');
        
        if (!timeElement || !appElement) {
            buttonsSkipped++;
            continue;
        }
        
        const timestamp = timeElement.getAttribute('data-time');
        const appName = appElement.getAttribute('data-app');
        
        if (!timestamp || !appName) {
            buttonsSkipped++;
            continue;
        }
        
        // Проверяем, нет ли уже кнопки
        if (item.querySelector('.screenshot-btn')) {
            buttonsSkipped++;
            continue;
        }
        
        // Создаем кнопку с передачей уже загруженных скриншотов
        const button = await createScreenshotButtonWithScreenshots(timestamp, appName, screenshots);
        if (button) {
            // Добавляем кнопку в элемент
            const actionsContainer = item.querySelector('.actions') || item;
            actionsContainer.appendChild(button);
            buttonsAdded++;
        } else {
            buttonsSkipped++;
        }
    }
    
    console.log(`✅ Обработка завершена: добавлено ${buttonsAdded} кнопок, пропущено ${buttonsSkipped} элементов`);
}

/**
 * Создает кнопку скриншота с уже загруженными скриншотами (оптимизация)
 * @param {Date|string} timestamp - Время активности
 * @param {string} appName - Название приложения
 * @param {Array} screenshots - Массив скриншотов
 * @returns {Promise<HTMLElement|null>} - Созданная кнопка или null
 */
async function createScreenshotButtonWithScreenshots(timestamp, appName, screenshots) {
    const screenshot = await findScreenshotByTimeAndApp(timestamp, appName, screenshots);
    
    if (!screenshot) {
        return null;
    }
    
    const button = document.createElement('button');
    button.className = 'btn btn-sm btn-outline-primary screenshot-btn';
    button.innerHTML = '<i class="bi bi-camera"></i>';
    
    const screenshotTime = new Date(screenshot.timestamp);
    const activityTime = new Date(timestamp);
    const timeDiff = Math.abs(screenshotTime - activityTime) / 1000;
    
    button.title = `Скриншот в ${screenshotTime.toLocaleTimeString()} (±${timeDiff.toFixed(1)}с)`;
    
    button.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        openScreenshotModal(screenshot, timestamp, appName);
    });
    
    return button;
}

// Инициализируем систему скриншотов при загрузке
document.addEventListener('DOMContentLoaded', initSmartScreenshots);

// Экспортируем функции для глобального использования
window.smartScreenshots = {
    loadScreenshotsForDate,
    findScreenshotByTimeAndApp,
    createScreenshotButton,
    openScreenshotModal,
    addScreenshotButtonsToTimeline,
    compareAppNames
};

console.log('✅ Модуль smart-screenshots.js готов к работе с точной привязкой скриншотов'); 