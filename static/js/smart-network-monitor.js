/**
 * Smart Network Monitor - Модуль мониторинга сетевой активности
 * 
 * @version 1.0.0
 * @author AI Assistant
 * @date 2024-01-20
 * @description Модуль для отображения и анализа сетевой активности пользователя
 * 
 * Функциональность:
 * - Обновление метрик сетевой активности
 * - Форматирование данных трафика
 * - Расчет скорости передачи данных
 * - Обновление UI элементов сетевых метрик
 */

class SmartNetworkMonitor {
    constructor() {
        this.lastUpdateTime = null;
        this.previousData = null;
        this.maxRecordedSpeed = 0;
        
        console.log('🌐 Smart Network Monitor инициализирован');
    }

    /**
     * Обновление метрик сетевой активности
     * @param {Array} networkData - Данные сетевой активности
     */
    updateNetworkMetrics(networkData) {
        console.log('🌐 Обновление сетевых метрик:', networkData);
        
        if (!networkData || networkData.length === 0) {
            this._showNoDataState();
            return;
        }

        try {
            const metrics = this._calculateNetworkMetrics(networkData);
            this._updateUI(metrics);
            
            console.log('✅ Сетевые метрики обновлены:', metrics);
            
        } catch (error) {
            console.error('❌ Ошибка при обновлении сетевых метрик:', error);
            this._showErrorState();
        }
    }

    /**
     * Вычисление метрик сетевой активности
     * @private
     */
    _calculateNetworkMetrics(networkData) {
        let totalSent = 0;
        let totalReceived = 0;
        let currentSpeed = 0;
        let lastUpdate = null;

        networkData.forEach((entry, index) => {
            const sent = parseInt(entry.bytes_sent || 0);
            const received = parseInt(entry.bytes_received || 0);
            
            totalSent += sent;
            totalReceived += received;
            
            // Вычисляем текущую скорость
            if (index > 0) {
                const prevEntry = networkData[index - 1];
                const timeDiff = new Date(entry.timestamp) - new Date(prevEntry.timestamp);
                const bytesDiff = (sent + received) - (parseInt(prevEntry.bytes_sent || 0) + parseInt(prevEntry.bytes_received || 0));
                
                if (timeDiff > 0) {
                    // Скорость в Mbps
                    const speedMbps = (bytesDiff * 8) / (timeDiff / 1000) / (1024 * 1024);
                    currentSpeed = Math.max(currentSpeed, speedMbps);
                }
            }
            
            lastUpdate = entry.timestamp;
        });

        // Обновляем максимальную зафиксированную скорость
        this.maxRecordedSpeed = Math.max(this.maxRecordedSpeed, currentSpeed);

        return {
            totalSent,
            totalReceived,
            currentSpeed: Math.min(currentSpeed, 1000), // Ограничиваем для реалистичности
            maxSpeed: this.maxRecordedSpeed,
            totalTraffic: totalSent + totalReceived,
            ratio: totalReceived > 0 ? (totalSent / totalReceived) : 0,
            isActive: currentSpeed > 0.1,
            lastUpdate
        };
    }

    /**
     * Обновление пользовательского интерфейса
     * @private
     */
    _updateUI(metrics) {
        // Основные метрики
        this._updateElement('current-network-speed', metrics.currentSpeed.toFixed(1));
        this._updateElement('network-upload', this._formatBytes(metrics.totalSent));
        this._updateElement('network-download', this._formatBytes(metrics.totalReceived));
        
        // Детальные метрики
        this._updateElement('peak-network-speed', `${metrics.maxSpeed.toFixed(1)} Mbps`);
        this._updateElement('total-network-traffic', this._formatBytes(metrics.totalTraffic, 'GB'));
        this._updateElement('network-ratio', `${metrics.ratio.toFixed(2)}:1`);
        
        // Статус соединения
        this._updateElement('network-status-text', metrics.isActive ? 'Активно' : 'Подключено');
        
        // Обновляем индикатор статуса
        this._updateNetworkIndicator(metrics.isActive ? 'active' : 'idle');
    }

    /**
     * Отображение состояния "нет данных"
     * @private
     */
    _showNoDataState() {
        this._updateElement('current-network-speed', '0');
        this._updateElement('network-upload', '0 MB');
        this._updateElement('network-download', '0 MB');
        this._updateElement('network-status-text', 'Нет данных');
        this._updateElement('peak-network-speed', '0 Mbps');
        this._updateElement('total-network-traffic', '0 GB');
        this._updateElement('network-ratio', '-');
        
        this._updateNetworkIndicator('offline');
        console.log('⚠️ Нет данных сетевой активности');
    }

    /**
     * Отображение состояния ошибки
     * @private
     */
    _showErrorState() {
        this._updateElement('network-status-text', 'Ошибка');
        this._updateNetworkIndicator('error');
    }

    /**
     * Обновление элемента интерфейса
     * @private
     */
    _updateElement(elementId, value) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = value;
        } else {
            console.warn(`⚠️ Элемент ${elementId} не найден`);
        }
    }

    /**
     * Обновление индикатора сетевой активности
     * @private
     */
    _updateNetworkIndicator(status) {
        const indicator = document.getElementById('network-indicator');
        if (indicator) {
            indicator.className = `indicator-dot ${status}`;
        }
    }

    /**
     * Форматирование байтов в читаемый формат
     * @private
     */
    _formatBytes(bytes, forceUnit = null) {
        if (bytes === 0) return '0 B';
        
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        
        if (forceUnit) {
            const unitIndex = sizes.indexOf(forceUnit);
            if (unitIndex > 0) {
                const value = bytes / Math.pow(k, unitIndex);
                return `${value.toFixed(2)} ${forceUnit}`;
            }
        }
        
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        const value = bytes / Math.pow(k, i);
        
        return `${value.toFixed(i > 1 ? 2 : 0)} ${sizes[i]}`;
    }

    /**
     * Сброс статистики
     */
    reset() {
        this.maxRecordedSpeed = 0;
        this.previousData = null;
        this.lastUpdateTime = null;
        
        console.log('🔄 Статистика сетевого монитора сброшена');
    }

    /**
     * Получение текущих метрик
     */
    getCurrentMetrics() {
        return {
            maxSpeed: this.maxRecordedSpeed,
            lastUpdate: this.lastUpdateTime
        };
    }
}

// Создаем глобальный экземпляр монитора
window.smartNetworkMonitor = new SmartNetworkMonitor();

// Экспортируем основные функции для совместимости с существующим кодом
window.updateNetworkMetrics = function(networkData) {
    window.smartNetworkMonitor.updateNetworkMetrics(networkData);
};

console.log('📦 Smart Network Monitor модуль загружен'); 