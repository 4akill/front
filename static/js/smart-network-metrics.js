/**
 * Smart Network Metrics v1.0.2
 * Модуль для отображения сетевых метрик
 * Автор: AI Assistant
 * Дата: 2025-01-03
 */

console.log('🚀 [START] Начало загрузки модуля smart-network-metrics.js');

/**
 * Smart Network Metrics Module
 * Модуль для обработки и отображения сетевой активности
 * 
 * @version 1.0.0
 * @author AI Assistant
 * @date 2025-01-07
 * @purpose Управление метриками сетевой активности в реальном времени
 */

class SmartNetworkMetrics {
    constructor() {
        this.lastNetworkData = [];
        this.elements = {};
        this.initializeElements();
    }

    /**
     * Инициализация DOM элементов для сетевых метрик
     */
    initializeElements() {
        this.elements = {
            speed: document.querySelector('#current-network-speed'),
            upload: document.querySelector('#network-upload'),
            download: document.querySelector('#network-download'),
            status: document.querySelector('#network-status-text'),
            indicator: document.querySelector('#network-indicator'),
            speedValue: document.querySelector('#current-network-speed')
        };

        console.log('🌐 Инициализированы элементы сети:', this.elements);
    }

    /**
     * Обновление сетевых метрик
     * @param {Array} networkData - данные сетевой активности
     */
    updateNetworkMetrics(networkData) {
        console.log('🌐 [СЕТЬ] Получены данные:', networkData);
        console.log('🌐 [СЕТЬ] Тип данных:', typeof networkData);
        console.log('🌐 [СЕТЬ] Является ли массивом:', Array.isArray(networkData));
        
        if (!networkData) {
            console.warn('🌐 [СЕТЬ] Данные не переданы, устанавливаем значения по умолчанию');
            this.setDefaultValues();
            return;
        }

        // Рассчитываем метрики
        const metrics = this.calculateNetworkMetrics(networkData);
        console.log('🌐 [СЕТЬ] Рассчитанные метрики:', metrics);
        
        // Обновляем интерфейс
        this.updateInterface(metrics);
        
        // Сохраняем последние данные
        this.lastNetworkData = networkData;
        this.lastUpdateTime = new Date();
        
        console.log('🌐 [СЕТЬ] Метрики успешно обновлены');
    }

    /**
     * Вычисление метрик из данных
     * @param {Array} networkData - исходные данные
     * @returns {Object} вычисленные метрики
     */
    calculateNetworkMetrics(networkData) {
        console.log('🧮 [РАСЧЕТ] Начинаем расчет сетевых метрик');
        console.log('🧮 [РАСЧЕТ] Входные данные:', networkData);
        console.log('🧮 [РАСЧЕТ] Пример первой записи:', networkData[0]);
        
        if (!networkData || !Array.isArray(networkData) || networkData.length === 0) {
            console.warn('🧮 [РАСЧЕТ] Пустые или некорректные данные, возвращаем нули');
            return {
                totalData: 0,
                avgSpeed: 0,
                uploadTraffic: 0,
                downloadTraffic: 0,
                isActive: false,
                status: 'Неактивна',
                recordsCount: 0
            };
        }

        let totalUpload = 0;
        let totalDownload = 0;
        let totalSpeed = 0;
        let validRecords = 0;

        console.log('🧮 [РАСЧЕТ] Обрабатываем записи:', networkData.length);

        // Сначала рассчитаем общий трафик
        networkData.forEach((record, index) => {
            console.log(`🧮 [РАСЧЕТ] Запись ${index}:`, record);
            
            if (record && typeof record === 'object') {
                // Пробуем различные варианты названий полей
                const upload = record.upload || record.upload_bytes || record.sent || record.bytes_sent || 0;
                const download = record.download || record.download_bytes || record.received || record.bytes_received || 0;
                const speed = record.speed || record.bandwidth || record.rate || 0;

                console.log(`🧮 [РАСЧЕТ] Извлеченные значения: upload=${upload}, download=${download}, speed=${speed}`);

                if (upload > 0 || download > 0) {
                    totalUpload += Number(upload) || 0;
                    totalDownload += Number(download) || 0;
                    validRecords++;
                }
                
                // Если есть готовое поле скорости, используем его
                if (speed > 0) {
                    totalSpeed += Number(speed) || 0;
                }
            }
        });

        // Если нет готового поля скорости, рассчитываем приблизительную скорость
        let avgSpeed = 0;
        if (validRecords > 0 && totalSpeed > 0) {
            // Есть готовые данные скорости
            avgSpeed = totalSpeed / validRecords;
            console.log('🧮 [РАСЧЕТ] Скорость из готовых данных:', avgSpeed);
        } else if (networkData.length >= 2 && totalUpload + totalDownload > 0) {
            // Рассчитываем скорость на основе изменения трафика
            const timeSpanMinutes = networkData.length; // Примерно 1 запись = 1 минута
            const totalBytes = totalUpload + totalDownload;
            const avgBytesPerMinute = totalBytes / timeSpanMinutes;
            const avgBytesPerSecond = avgBytesPerMinute / 60;
            // Конвертируем в мегабиты в секунду (1 байт = 8 бит, 1 мегабит = 1,000,000 бит)
            avgSpeed = (avgBytesPerSecond * 8) / 1000000;
            console.log('🧮 [РАСЧЕТ] Рассчитанная скорость:', {
                totalBytes,
                timeSpanMinutes,
                avgBytesPerSecond,
                avgSpeedMbps: avgSpeed
            });
        }

        const isActive = totalUpload > 0 || totalDownload > 0 || avgSpeed > 0;

        const result = {
            totalData: totalUpload + totalDownload,
            avgSpeed: avgSpeed,
            uploadTraffic: totalUpload,
            downloadTraffic: totalDownload,
            isActive: isActive,
            status: isActive ? 'Подключено' : 'Неактивна',
            recordsCount: validRecords
        };

        console.log('🧮 [РАСЧЕТ] Финальный результат:', result);
        return result;
    }

    /**
     * Обновление интерфейса с метриками
     * @param {Object} metrics - вычисленные метрики
     */
    updateInterface(metrics) {
        console.log('🖥️ [ИНТЕРФЕЙС] Обновляем интерфейс с метриками:', metrics);
        
        if (!metrics) {
            console.warn('🖥️ [ИНТЕРФЕЙС] Метрики не переданы');
            return;
        }

        // Обновляем скорость сети
        this.updateElement(this.elements.speedValue, `${metrics.avgSpeed.toFixed(1)}`);
        console.log('🖥️ [ИНТЕРФЕЙС] Обновлена скорость:', `${metrics.avgSpeed.toFixed(1)} Mbps`);

        // Обновляем трафик загрузки и выгрузки
        this.updateElement(this.elements.upload, this.formatBytes(metrics.uploadTraffic));
        this.updateElement(this.elements.download, this.formatBytes(metrics.downloadTraffic));
        console.log('🖥️ [ИНТЕРФЕЙС] Обновлен трафик: upload=' + this.formatBytes(metrics.uploadTraffic) + ', download=' + this.formatBytes(metrics.downloadTraffic));

        // Обновляем статус подключения
        this.updateElement(this.elements.status, metrics.status || 'Неизвестно');
        console.log('🖥️ [ИНТЕРФЕЙС] Обновлен статус:', metrics.status);

        // Обновляем индикатор состояния
        if (this.elements.indicator) {
            this.elements.indicator.className = 'indicator-dot ' + 
                (metrics.isActive ? 'active' : 'inactive');
            console.log('🖥️ [ИНТЕРФЕЙС] Обновлен индикатор:', metrics.isActive ? 'активен' : 'неактивен');
        }

        console.log('🖥️ [ИНТЕРФЕЙС] Интерфейс обновлен успешно');
    }

    /**
     * Установка значений по умолчанию
     */
    setDefaultValues() {
        console.log('📊 Устанавливаем значения сети по умолчанию');
        
        this.updateElement(this.elements.speed, '0');
        this.updateElement(this.elements.speedValue, '0');
        this.updateElement(this.elements.status, 'Неактивна');
        this.updateElement(this.elements.upload, '0 B');
        this.updateElement(this.elements.download, '0 B');
        
        if (this.elements.indicator) {
            this.elements.indicator.className = 'indicator-dot inactive';
        }
    }

    /**
     * Безопасное обновление DOM элемента
     * @param {Element} element - DOM элемент
     * @param {string} value - новое значение
     */
    updateElement(element, value) {
        if (element && element.textContent !== value) {
            element.textContent = value;
        }
    }

    /**
     * Форматирование байтов в читаемый вид
     * @param {number} bytes - количество байтов
     * @returns {string} отформатированная строка
     */
    formatBytes(bytes) {
        if (!bytes || bytes === 0) return '0 B';
        
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        const value = parseFloat((bytes / Math.pow(k, i)).toFixed(2));
        return `${value} ${sizes[i]}`;
    }

    /**
     * Получение последних данных сети
     * @returns {Array} последние данные сетевой активности
     */
    getLastNetworkData() {
        return this.lastNetworkData;
    }

    /**
     * Проверка активности сети
     * @returns {boolean} активна ли сеть
     */
    isNetworkActive() {
        if (!this.lastNetworkData || this.lastNetworkData.length === 0) {
            return false;
        }

        return this.lastNetworkData.some(entry => 
            (entry.bytes_sent && entry.bytes_sent > 0) || 
            (entry.bytes_received && entry.bytes_received > 0)
        );
    }

    /**
     * Инициализация модуля с тестовыми данными для проверки
     */
    initWithTestData() {
        console.log('🧪 [ТЕСТ] Инициализация модуля с тестовыми данными');
        
        const testData = [
            {
                bytes_sent: 1024000,    // 1MB отправлено
                bytes_received: 2048000, // 2MB получено
                speed: 50.5             // 50.5 Mbps
            },
            {
                bytes_sent: 512000,     // 512KB отправлено
                bytes_received: 1536000, // 1.5MB получено
                speed: 25.2             // 25.2 Mbps
            }
        ];
        
        console.log('🧪 [ТЕСТ] Тестовые данные:', testData);
        this.updateNetworkMetrics(testData);
    }
}

// Создаем экземпляр модуля и делаем его доступным глобально
console.log('🌐 [СОЗДАНИЕ] Создаем глобальный экземпляр smartNetworkMetrics');
try {
    window.smartNetworkMetrics = new SmartNetworkMetrics();
    console.log('✅ [СОЗДАНИЕ] Экземпляр создан успешно');
} catch (error) {
    console.error('❌ [СОЗДАНИЕ] Ошибка создания экземпляра:', error);
}

// Глобальная функция для обратной совместимости
window.updateNetworkMetrics = function(networkData) {
    console.log('🌐 [ГЛОБАЛ] Вызвана глобальная функция updateNetworkMetrics с данными:', networkData);
    
    // Если данные пустые или null, устанавливаем тестовые данные для проверки
    if (!networkData || !Array.isArray(networkData) || networkData.length === 0) {
        console.log('🌐 [ГЛОБАЛ] Данные пустые, устанавливаем значения по умолчанию');
        window.smartNetworkMetrics.setDefaultValues();
        return;
    }
    
    window.smartNetworkMetrics.updateNetworkMetrics(networkData);
};

// Инициализация модуля
console.log('🌐 [ГОТОВНОСТЬ] Проверяем готовность DOM:', document.readyState);

if (document.readyState === 'loading') {
    console.log('🌐 [ОЖИДАНИЕ] DOM еще загружается, ждем DOMContentLoaded');
    document.addEventListener('DOMContentLoaded', initNetworkModule);
} else {
    console.log('🌐 [ГОТОВ] DOM уже готов, запускаем инициализацию');
    initNetworkModule();
}

function initNetworkModule() {
    console.log('🌐 [ИНИТ] Модуль сетевых метрик инициализирован');
    
    try {
        // Простая инициализация без задержки
        console.log('🌐 [ИНИТ] Инициализация элементов');
        window.smartNetworkMetrics.initializeElements();
        
        console.log('🌐 [ИНИТ] Установка базовых значений');
        window.smartNetworkMetrics.setDefaultValues();
        
        console.log('✅ [ИНИТ] Инициализация завершена успешно');
    } catch (error) {
        console.error('❌ [ИНИТ] Ошибка инициализации:', error);
    }

    // Временно: автоматический запуск тестовых данных для проверки
    setTimeout(() => {
        console.log('🧪 [АВТОТЕСТ] Запускаем тестовые данные для проверки расчета скорости');
        window.smartNetworkMetrics.initWithTestData();
    }, 3000);
    
    // Тестовые данные можно запустить вручную через:
    // window.smartNetworkMetrics.initWithTestData();
}

console.log('🌐 Smart Network Metrics модуль загружен'); 