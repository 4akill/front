/**
 * Smart GPU Metrics Module
 * Модуль для управления метриками видеокарты (GPU)
 * 
 * @version 1.0.0
 * @author AI Assistant
 * @date 2025-01-21
 * @purpose Отображение и обновление метрик GPU в дашборде
 */

console.log('🚀 [START] Начало загрузки модуля smart-gpu-metrics.js');

/**
 * Класс для управления GPU метриками
 */
class SmartGPUMetrics {
    constructor() {
        console.log('🔧 [КОНСТРУКТОР] Инициализация SmartGPUMetrics');
        this.elements = {};
        this.lastGPUData = [];
        this.initializeElements();
    }

    /**
     * Инициализация DOM элементов
     */
    initializeElements() {
        this.elements = {
            current: document.querySelector('#current-gpu-usage'),
            max: document.querySelector('#max-gpu-usage'),
            avg: document.querySelector('#avg-gpu-usage'),
            progress: document.querySelector('#gpu-progress'),
            peak: document.querySelector('#peak-gpu'),
            peakTime: document.querySelector('#peak-gpu-time'),
            temperature: document.querySelector('#gpu-temperature')
        };
        console.log('🔧 Инициализированы элементы GPU:', this.elements);
    }

    /**
     * Обновление GPU метрик
     * @param {Array} gpuData - данные о GPU из monitoring_data
     */
    updateGPUMetrics(gpuData) {
        console.log('📊 [ОБНОВЛЕНИЕ] Начинаем обновление GPU метрик');
        console.log('📊 [ДАННЫЕ] Входные данные GPU:', gpuData);

        if (!gpuData) {
            console.warn('📊 [ПРЕДУПРЕЖДЕНИЕ] Данные GPU не переданы');
            this.setDefaultValues();
            return;
        }

        // Сохраняем последние данные
        this.lastGPUData = gpuData;

        // Рассчитываем метрики
        const metrics = this.calculateGPUMetrics(gpuData);
        
        // Обновляем интерфейс
        this.updateInterface(metrics);

        console.log('📊 [ЗАВЕРШЕНО] GPU метрики обновлены успешно');
    }

    /**
     * Расчет GPU метрик
     * @param {Array} gpuData - массив данных GPU
     * @returns {Object} рассчитанные метрики
     */
    calculateGPUMetrics(gpuData) {
        console.log('🧮 [РАСЧЕТ] Начинаем расчет GPU метрик');
        console.log('🧮 [РАСЧЕТ] Входные данные:', gpuData);
        console.log('🧮 [РАСЧЕТ] Пример первой записи:', gpuData[0]);
        
        if (!gpuData || !Array.isArray(gpuData) || gpuData.length === 0) {
            console.warn('🧮 [РАСЧЕТ] Пустые или некорректные данные, возвращаем нули');
            return {
                current: 0,
                avg: 0,
                max: 0,
                min: 0,
                isActive: false,
                recordsCount: 0,
                peakTime: '-'
            };
        }

        let totalUsage = 0;
        let validRecords = 0;
        let maxUsage = 0;
        let minUsage = 100;
        let peakTime = '-';
        let maxTimestamp = null;

        console.log('🧮 [РАСЧЕТ] Обрабатываем записи:', gpuData.length);

        gpuData.forEach((record, index) => {
            console.log(`🧮 [РАСЧЕТ] Запись ${index}:`, record);
            
            if (record && typeof record === 'object') {
                // Пробуем различные варианты названий полей GPU
                const gpuUsage = record.gpu_usage || record.gpu || record.gpu_percent || 0;

                console.log(`🧮 [РАСЧЕТ] Извлеченное значение GPU: ${gpuUsage}%`);

                if (gpuUsage >= 0) {
                    const usage = Number(gpuUsage) || 0;
                    totalUsage += usage;
                    validRecords++;

                    // Отслеживаем максимум и минимум
                    if (usage > maxUsage) {
                        maxUsage = usage;
                        maxTimestamp = record.timestamp;
                        peakTime = this.formatTime(maxTimestamp);
                    }
                    if (usage < minUsage) {
                        minUsage = usage;
                    }
                }
            }
        });

        const avgUsage = validRecords > 0 ? (totalUsage / validRecords) : 0;
        const isActive = avgUsage > 0 || maxUsage > 0;

        // Если нет данных, устанавливаем минимум в 0
        if (validRecords === 0) {
            minUsage = 0;
        }

        const result = {
            current: avgUsage,
            avg: avgUsage,
            max: maxUsage,
            min: minUsage,
            isActive: isActive,
            recordsCount: validRecords,
            peakTime: peakTime
        };

        console.log('🧮 [РАСЧЕТ] Финальный результат:', result);
        return result;
    }

    /**
     * Обновление интерфейса с метриками
     * @param {Object} metrics - вычисленные метрики
     */
    updateInterface(metrics) {
        console.log('🖥️ [ИНТЕРФЕЙС] Обновляем интерфейс с GPU метриками:', metrics);
        
        if (!metrics) {
            console.warn('🖥️ [ИНТЕРФЕЙС] Метрики не переданы');
            return;
        }

        // Обновляем текущее использование GPU
        this.updateElement(this.elements.current, Math.round(metrics.current));
        console.log('🖥️ [ИНТЕРФЕЙС] Обновлено текущее использование:', `${Math.round(metrics.current)}%`);

        // Обновляем максимальное использование
        this.updateElement(this.elements.max, `${Math.round(metrics.max)}%`);
        console.log('🖥️ [ИНТЕРФЕЙС] Обновлено максимальное использование:', `${Math.round(metrics.max)}%`);

        // Обновляем среднее использование
        this.updateElement(this.elements.avg, `${Math.round(metrics.avg)}%`);
        console.log('🖥️ [ИНТЕРФЕЙС] Обновлено среднее использование:', `${Math.round(metrics.avg)}%`);

        // Обновляем прогресс бар
        if (this.elements.progress) {
            const usage = metrics.current;
            this.elements.progress.style.width = `${usage}%`;
            
            // Удаляем старые классы
            this.elements.progress.className = 'progress-bar';
            
            // Добавляем класс в зависимости от нагрузки
            if (usage > 80) {
                this.elements.progress.classList.add('bg-danger');
            } else if (usage > 60) {
                this.elements.progress.classList.add('bg-warning');
            } else {
                this.elements.progress.classList.add('bg-success');
            }
            
            console.log('🖥️ [ИНТЕРФЕЙС] Обновлен прогресс бар:', `${usage}%`);
        }

        // Обновляем пиковое использование
        this.updateElement(this.elements.peak, `${Math.round(metrics.max)}%`);
        this.updateElement(this.elements.peakTime, metrics.peakTime);
        console.log('🖥️ [ИНТЕРФЕЙС] Обновлено пиковое использование:', `${Math.round(metrics.max)}% в ${metrics.peakTime}`);

        console.log('🖥️ [ИНТЕРФЕЙС] Интерфейс GPU обновлен успешно');
    }

    /**
     * Установка значений по умолчанию
     */
    setDefaultValues() {
        console.log('📊 Устанавливаем значения GPU по умолчанию');
        
        this.updateElement(this.elements.current, '0');
        this.updateElement(this.elements.max, '0%');
        this.updateElement(this.elements.avg, '0%');
        this.updateElement(this.elements.peak, '0%');
        this.updateElement(this.elements.peakTime, '-');
        this.updateElement(this.elements.temperature, '-');
        
        if (this.elements.progress) {
            this.elements.progress.style.width = '0%';
            this.elements.progress.className = 'progress-bar bg-secondary';
        }
    }

    /**
     * Безопасное обновление DOM элемента
     * @param {Element} element - DOM элемент
     * @param {string} value - новое значение
     */
    updateElement(element, value) {
        if (element && element.textContent !== String(value)) {
            element.textContent = value;
        }
    }

    /**
     * Форматирование времени для отображения
     * @param {string} timestamp - временная метка
     * @returns {string} отформатированное время
     */
    formatTime(timestamp) {
        if (!timestamp) return '-';
        
        try {
            const date = new Date(timestamp);
            return date.toLocaleTimeString('ru-RU', {
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            console.warn('⚠️ Ошибка форматирования времени:', error);
            return '-';
        }
    }

    /**
     * Получение последних данных GPU
     * @returns {Array} последние данные GPU
     */
    getLastGPUData() {
        return this.lastGPUData;
    }

    /**
     * Проверка активности GPU
     * @returns {boolean} активен ли GPU
     */
    isGPUActive() {
        if (!this.lastGPUData || this.lastGPUData.length === 0) {
            return false;
        }

        return this.lastGPUData.some(entry => 
            (entry.gpu_usage && entry.gpu_usage > 0) || 
            (entry.gpu && entry.gpu > 0)
        );
    }

    /**
     * Инициализация модуля с тестовыми данными для проверки
     */
    initWithTestData() {
        console.log('🧪 [ТЕСТ] Инициализация модуля с тестовыми данными');
        
        const testData = [
            {
                gpu_usage: 45.3,
                timestamp: new Date().toISOString()
            },
            {
                gpu_usage: 67.8,
                timestamp: new Date(Date.now() - 60000).toISOString()
            },
            {
                gpu_usage: 23.1,
                timestamp: new Date(Date.now() - 120000).toISOString()
            },
            {
                gpu_usage: 89.5,
                timestamp: new Date(Date.now() - 180000).toISOString()
            }
        ];
        
        console.log('🧪 [ТЕСТ] Тестовые данные GPU:', testData);
        this.updateGPUMetrics(testData);
    }
}

// Создаем экземпляр модуля и делаем его доступным глобально
console.log('🔧 [СОЗДАНИЕ] Создаем глобальный экземпляр smartGPUMetrics');
try {
    window.smartGPUMetrics = new SmartGPUMetrics();
    console.log('✅ [СОЗДАНИЕ] Экземпляр GPU модуля создан успешно');
} catch (error) {
    console.error('❌ [СОЗДАНИЕ] Ошибка создания экземпляра GPU:', error);
}

// Глобальная функция для обратной совместимости
window.updateGPUMetrics = function(gpuData) {
    console.log('🔧 [ГЛОБАЛ] Вызвана глобальная функция updateGPUMetrics с данными:', gpuData);
    
    if (window.smartGPUMetrics) {
        window.smartGPUMetrics.updateGPUMetrics(gpuData);
    } else {
        console.error('❌ [ГЛОБАЛ] smartGPUMetrics не инициализирован');
    }
};

/**
 * Инициализация модуля
 */
function initGPUModule() {
    console.log('🚀 [ИНИТ] Инициализация GPU модуля');
    
    try {
        if (!window.smartGPUMetrics) {
            window.smartGPUMetrics = new SmartGPUMetrics();
        }
        console.log('✅ [ИНИТ] GPU модуль инициализирован успешно');
    } catch (error) {
        console.error('❌ [ИНИТ] Ошибка инициализации GPU модуля:', error);
    }
}

// Инициализация модуля
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔧 [ИНИТ] Модуль GPU метрик инициализирован');
    
    // Тестовые данные можно запустить вручную через:
    // window.smartGPUMetrics.initWithTestData();
});

console.log('✅ [ЗАГРУЖЕН] Модуль Smart GPU Metrics загружен'); 