/**
 * Smart Network Activity Analytics Module
 * 
 * @version 1.0.0
 * @author AI Assistant
 * @date 2025-07-03
 * @purpose Модуль для анализа и отображения сетевой активности с умной визуализацией
 * 
 * Ответственность:
 * - Загрузка данных сетевой активности
 * - Анализ трафика (входящий/исходящий)
 * - Построение интерактивных графиков
 * - Расчет метрик производительности сети
 * - Детекция аномалий в сетевом трафике
 */

class SmartNetworkActivityManager {
    constructor() {
        this.apiBaseUrl = '/api/public/activity/network';
        this.data = [];
        this.currentFilters = {
            startDate: null,
            endDate: null,
            deviceId: null
        };
        this.chartInstances = new Map();
        this.init();
    }

    /**
     * Инициализация модуля
     */
    init() {
        console.log('🌐 Инициализация Smart Network Activity Manager v1.0.0');
        this.setupEventListeners();
    }

    /**
     * Настройка обработчиков событий
     */
    setupEventListeners() {
        document.addEventListener('DOMContentLoaded', () => {
            this.loadTodayData();
        });

        // Обработчик изменения фильтров
        document.addEventListener('filterChanged', (event) => {
            this.applyFilters(event.detail);
        });
    }

    /**
     * Загрузка данных за сегодня
     */
    async loadTodayData() {
        const today = new Date().toISOString().split('T')[0];
        await this.loadNetworkData(today, today);
    }

    /**
     * Загрузка данных сетевой активности
     * @param {string} startDate - Начальная дата
     * @param {string} endDate - Конечная дата
     * @param {string} deviceId - ID устройства (опционально)
     */
    async loadNetworkData(startDate, endDate, deviceId = null) {
        try {
            console.log(`🔄 Загрузка сетевой активности: ${startDate} - ${endDate}`);
            
            const params = new URLSearchParams({
                start_date: startDate,
                end_date: endDate
            });

            if (deviceId) {
                params.append('device_id', deviceId);
            }

            const response = await fetch(`${this.apiBaseUrl}?${params}`);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            this.data = await response.json();
            console.log(`✅ Загружено ${this.data.length} записей сетевой активности`);

            // Обновляем фильтры
            this.currentFilters = { startDate, endDate, deviceId };

            // Анализируем и отображаем данные
            this.analyzeNetworkData();
            this.renderNetworkCharts();
            this.updateNetworkMetrics();

        } catch (error) {
            console.error('❌ Ошибка загрузки сетевой активности:', error);
            this.handleError(error);
        }
    }

    /**
     * Анализ данных сетевой активности
     */
    analyzeNetworkData() {
        if (!this.data || this.data.length === 0) {
            console.warn('⚠️ Нет данных для анализа');
            return;
        }

        // Группировка по устройствам
        this.deviceGroups = this.groupByDevice(this.data);
        
        // Временной анализ
        this.timeSeriesData = this.prepareTimeSeriesData(this.data);
        
        // Расчет пиковых нагрузок
        this.peakAnalysis = this.calculatePeakLoads(this.data);

        // Детекция аномалий
        this.anomalies = this.detectAnomalies(this.data);

        console.log('📊 Анализ сетевых данных завершен:', {
            devices: Object.keys(this.deviceGroups).length,
            timePoints: this.timeSeriesData.length,
            peaks: this.peakAnalysis.length,
            anomalies: this.anomalies.length
        });
    }

    /**
     * Группировка данных по устройствам
     */
    groupByDevice(data) {
        const groups = {};
        
        data.forEach(item => {
            const deviceKey = item.device_id || 'Unknown';
            if (!groups[deviceKey]) {
                groups[deviceKey] = {
                    device_id: deviceKey,
                    computer_name: item.computer_name || 'Unknown',
                    records: [],
                    totalSent: 0,
                    totalReceived: 0
                };
            }
            
            groups[deviceKey].records.push(item);
            groups[deviceKey].totalSent += item.bytes_sent || 0;
            groups[deviceKey].totalReceived += item.bytes_received || 0;
        });

        return groups;
    }

    /**
     * Подготовка данных для временного ряда
     */
    prepareTimeSeriesData(data) {
        const timeSeries = {};

        data.forEach(item => {
            const timestamp = new Date(item.timestamp);
            const hourKey = timestamp.toISOString().substring(0, 13) + ':00:00Z';
            
            if (!timeSeries[hourKey]) {
                timeSeries[hourKey] = {
                    timestamp: hourKey,
                    totalSent: 0,
                    totalReceived: 0,
                    packetsCount: 0,
                    deviceCount: new Set()
                };
            }

            timeSeries[hourKey].totalSent += item.bytes_sent || 0;
            timeSeries[hourKey].totalReceived += item.bytes_received || 0;
            timeSeries[hourKey].packetsCount += (item.packets_sent || 0) + (item.packets_received || 0);
            timeSeries[hourKey].deviceCount.add(item.device_id);
        });

        // Преобразуем Set в count
        Object.values(timeSeries).forEach(item => {
            item.deviceCount = item.deviceCount.size;
        });

        return Object.values(timeSeries).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    }

    /**
     * Расчет пиковых нагрузок
     */
    calculatePeakLoads(data) {
        const peaks = [];
        const threshold = this.calculateThreshold(data);

        data.forEach(item => {
            const totalTraffic = (item.bytes_sent || 0) + (item.bytes_received || 0);
            if (totalTraffic > threshold) {
                peaks.push({
                    ...item,
                    totalTraffic,
                    severity: this.classifyPeakSeverity(totalTraffic, threshold)
                });
            }
        });

        return peaks.sort((a, b) => b.totalTraffic - a.totalTraffic);
    }

    /**
     * Расчет порога для пиков
     */
    calculateThreshold(data) {
        const trafficValues = data.map(item => (item.bytes_sent || 0) + (item.bytes_received || 0));
        const average = trafficValues.reduce((sum, val) => sum + val, 0) / trafficValues.length;
        const stdDev = Math.sqrt(trafficValues.reduce((sum, val) => sum + Math.pow(val - average, 2), 0) / trafficValues.length);
        
        return average + (2 * stdDev); // 2 стандартных отклонения
    }

    /**
     * Классификация серьезности пика
     */
    classifyPeakSeverity(traffic, threshold) {
        const ratio = traffic / threshold;
        if (ratio > 3) return 'critical';
        if (ratio > 2) return 'high';
        if (ratio > 1.5) return 'medium';
        return 'low';
    }

    /**
     * Детекция аномалий
     */
    detectAnomalies(data) {
        const anomalies = [];
        
        // Поиск резких скачков трафика
        for (let i = 1; i < data.length; i++) {
            const current = data[i];
            const previous = data[i - 1];
            
            const currentTraffic = (current.bytes_sent || 0) + (current.bytes_received || 0);
            const previousTraffic = (previous.bytes_sent || 0) + (previous.bytes_received || 0);
            
            if (previousTraffic > 0) {
                const ratio = currentTraffic / previousTraffic;
                if (ratio > 10 || ratio < 0.1) { // Скачок в 10 раз или падение в 10 раз
                    anomalies.push({
                        type: ratio > 10 ? 'traffic_spike' : 'traffic_drop',
                        timestamp: current.timestamp,
                        device_id: current.device_id,
                        ratio,
                        current: currentTraffic,
                        previous: previousTraffic
                    });
                }
            }
        }

        return anomalies;
    }

    /**
     * Отображение графиков
     */
    renderNetworkCharts() {
        this.renderTrafficOverTimeChart();
        this.renderDeviceComparisonChart();
        this.renderPacketAnalysisChart();
    }

    /**
     * График трафика во времени
     */
    renderTrafficOverTimeChart() {
        const container = document.getElementById('network-traffic-chart');
        if (!container) return;

        const trace1 = {
            x: this.timeSeriesData.map(d => d.timestamp),
            y: this.timeSeriesData.map(d => d.totalSent / 1024 / 1024), // МБ
            type: 'scatter',
            mode: 'lines+markers',
            name: 'Исходящий трафик',
            line: { color: '#3498db', width: 2 },
            marker: { size: 6 }
        };

        const trace2 = {
            x: this.timeSeriesData.map(d => d.timestamp),
            y: this.timeSeriesData.map(d => d.totalReceived / 1024 / 1024), // МБ
            type: 'scatter',
            mode: 'lines+markers',
            name: 'Входящий трафик',
            line: { color: '#e74c3c', width: 2 },
            marker: { size: 6 }
        };

        const layout = {
            title: '📈 Сетевой трафик во времени',
            xaxis: { title: 'Время' },
            yaxis: { title: 'Трафик (МБ)' },
            hovermode: 'x unified',
            showlegend: true
        };

        Plotly.newPlot(container, [trace1, trace2], layout, { responsive: true });
        this.chartInstances.set('traffic-time', container);
    }

    /**
     * График сравнения устройств
     */
    renderDeviceComparisonChart() {
        const container = document.getElementById('network-devices-chart');
        if (!container) return;

        const devices = Object.values(this.deviceGroups);
        
        const trace = {
            x: devices.map(d => d.computer_name || d.device_id),
            y: devices.map(d => (d.totalSent + d.totalReceived) / 1024 / 1024), // МБ
            type: 'bar',
            name: 'Общий трафик',
            marker: {
                color: devices.map(d => this.getDeviceColor(d.device_id)),
                opacity: 0.8
            }
        };

        const layout = {
            title: '💻 Сравнение трафика по устройствам',
            xaxis: { title: 'Устройства' },
            yaxis: { title: 'Общий трафик (МБ)' },
            showlegend: false
        };

        Plotly.newPlot(container, [trace], layout, { responsive: true });
        this.chartInstances.set('devices-comparison', container);
    }

    /**
     * Анализ пакетов
     */
    renderPacketAnalysisChart() {
        const container = document.getElementById('network-packets-chart');
        if (!container) return;

        const trace = {
            x: this.timeSeriesData.map(d => d.timestamp),
            y: this.timeSeriesData.map(d => d.packetsCount),
            type: 'scatter',
            mode: 'lines+markers',
            name: 'Количество пакетов',
            line: { color: '#9b59b6', width: 2 },
            marker: { size: 6 }
        };

        const layout = {
            title: '📦 Анализ сетевых пакетов',
            xaxis: { title: 'Время' },
            yaxis: { title: 'Количество пакетов' },
            showlegend: false
        };

        Plotly.newPlot(container, [trace], layout, { responsive: true });
        this.chartInstances.set('packets-analysis', container);
    }

    /**
     * Обновление метрик
     */
    updateNetworkMetrics() {
        const metrics = this.calculateNetworkMetrics();
        this.displayMetrics(metrics);
    }

    /**
     * Расчет сетевых метрик
     */
    calculateNetworkMetrics() {
        if (!this.data || this.data.length === 0) {
            return null;
        }

        const totalSent = this.data.reduce((sum, item) => sum + (item.bytes_sent || 0), 0);
        const totalReceived = this.data.reduce((sum, item) => sum + (item.bytes_received || 0), 0);
        const totalPackets = this.data.reduce((sum, item) => sum + (item.packets_sent || 0) + (item.packets_received || 0), 0);

        const devicesCount = new Set(this.data.map(item => item.device_id)).size;
        const avgSentPerDevice = totalSent / devicesCount;
        const avgReceivedPerDevice = totalReceived / devicesCount;

        return {
            totalTraffic: totalSent + totalReceived,
            totalSent,
            totalReceived,
            totalPackets,
            devicesCount,
            avgSentPerDevice,
            avgReceivedPerDevice,
            peaksCount: this.peakAnalysis ? this.peakAnalysis.length : 0,
            anomaliesCount: this.anomalies ? this.anomalies.length : 0
        };
    }

    /**
     * Отображение метрик
     */
    displayMetrics(metrics) {
        if (!metrics) return;

        // Общий трафик
        this.updateMetricElement('total-traffic', this.formatBytes(metrics.totalTraffic));
        
        // Исходящий трафик
        this.updateMetricElement('total-sent', this.formatBytes(metrics.totalSent));
        
        // Входящий трафик
        this.updateMetricElement('total-received', this.formatBytes(metrics.totalReceived));
        
        // Устройства
        this.updateMetricElement('devices-count', metrics.devicesCount);
        
        // Пики
        this.updateMetricElement('peaks-count', metrics.peaksCount);
        
        // Аномалии
        this.updateMetricElement('anomalies-count', metrics.anomaliesCount);

        console.log('📊 Сетевые метрики обновлены:', metrics);
    }

    /**
     * Обновление элемента метрики
     */
    updateMetricElement(elementId, value) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = value;
        }
    }

    /**
     * Форматирование байтов
     */
    formatBytes(bytes) {
        if (bytes === 0) return '0 Б';
        
        const units = ['Б', 'КБ', 'МБ', 'ГБ', 'ТБ'];
        const k = 1024;
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + units[i];
    }

    /**
     * Получение цвета для устройства
     */
    getDeviceColor(deviceId) {
        const colors = ['#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c'];
        const hash = this.simpleHash(deviceId);
        return colors[hash % colors.length];
    }

    /**
     * Простая хеш-функция
     */
    simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Преобразуем в 32-битное целое
        }
        return Math.abs(hash);
    }

    /**
     * Применение фильтров
     */
    applyFilters(filters) {
        console.log('🔍 Применение фильтров:', filters);
        this.loadNetworkData(filters.startDate, filters.endDate, filters.deviceId);
    }

    /**
     * Обработка ошибок
     */
    handleError(error) {
        console.error('❌ Network Activity Error:', error);
        
        // Показать уведомление пользователю
        const errorContainer = document.getElementById('network-error-message');
        if (errorContainer) {
            errorContainer.textContent = `Ошибка загрузки сетевых данных: ${error.message}`;
            errorContainer.style.display = 'block';
        }
    }

    /**
     * Получение данных для экспорта
     */
    getExportData() {
        return {
            raw: this.data,
            metrics: this.calculateNetworkMetrics(),
            peaks: this.peakAnalysis,
            anomalies: this.anomalies,
            deviceGroups: this.deviceGroups,
            timeSeries: this.timeSeriesData
        };
    }

    /**
     * Очистка ресурсов
     */
    cleanup() {
        this.chartInstances.forEach(chart => {
            if (chart && typeof Plotly !== 'undefined') {
                Plotly.purge(chart);
            }
        });
        this.chartInstances.clear();
        console.log('🧹 Network Activity Manager очищен');
    }
}

// Глобальный экземпляр
window.NetworkActivityManager = new SmartNetworkActivityManager();

// Экспорт для модульного использования
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SmartNetworkActivityManager;
} 