/**
 * 🔬 Модуль продвинутой аналитики дашборда
 * Версия: 1.0.0
 * Автор: AI Assistant
 * Дата: 2024-12-19
 * Назначение: Расширение дашборда метриками GPU, клавиатуры и сетевой активности
 */

class SmartAnalyticsDashboard {
    constructor() {
        this.apiBase = ''; // Убираем префикс, будем использовать полные пути
        this.isInitialized = false;
        this.updateInterval = 30000; // 30 секунд
        this.currentDeviceId = null;
        this.autoUpdateInterval = null;
        this.lastNetworkData = null;
        this.charts = {};
        
        console.log('🔬 SmartAnalyticsDashboard инициализирован');
    }

    /**
     * Инициализация модуля аналитики
     */
    async initialize() {
        console.log('🔧 Инициализация модуля аналитики...');
        
        try {
            // Проверяем, что мы на странице с ресурсами
            const resourcesTab = document.querySelector('[data-bs-target="#resources"]');
            if (!resourcesTab) {
                console.log('⚠️ Модуль аналитики не нужен на этой странице');
                return;
            }

            await this.createAnalyticsUI();
            this.addAnalyticsStyles();
            await this.loadAnalyticsData();
            this.startAutoUpdate();
            console.log('✅ Модуль аналитики инициализирован');
        } catch (error) {
            console.error('❌ Ошибка инициализации аналитики:', error);
        }
    }

    /**
     * Создание UI элементов для аналитики
     */
    async createAnalyticsUI() {
        const resourcesTab = document.querySelector('#resources-content');
        if (!resourcesTab) {
            console.warn('⚠️ Вкладка ресурсов не найдена');
            return;
        }

        // Добавляем новые карточки метрик
        const analyticsHTML = `
            <div class="analytics-dashboard" style="margin-top: 20px;">
                <h3>📊 Продвинутая аналитика</h3>
                
                <!-- GPU метрики -->
                <div class="metric-card gpu-metrics">
                    <h4>🎮 GPU Использование</h4>
                    <div class="gpu-stats">
                        <div class="stat-item">
                            <span class="label">Текущее:</span>
                            <span class="value" id="gpu-current">0%</span>
                        </div>
                        <div class="stat-item">
                            <span class="label">Среднее:</span>
                            <span class="value" id="gpu-average">0%</span>
                        </div>
                        <div class="stat-item">
                            <span class="label">Максимум:</span>
                            <span class="value" id="gpu-max">0%</span>
                        </div>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" id="gpu-progress" style="width: 0%"></div>
                    </div>
                </div>

                <!-- Клавиатурная активность -->
                <div class="metric-card keyboard-metrics">
                    <h4>⌨️ Клавиатурная активность</h4>
                    <div class="keyboard-stats">
                        <div class="stat-item">
                            <span class="label">События за час:</span>
                            <span class="value" id="keyboard-events-hour">0</span>
                        </div>
                        <div class="stat-item">
                            <span class="label">Всего событий:</span>
                            <span class="value" id="keyboard-total">0</span>
                        </div>
                        <div class="stat-item">
                            <span class="label">Интенсивность:</span>
                            <span class="value" id="keyboard-intensity">Низкая</span>
                        </div>
                    </div>
                    <div class="activity-indicator">
                        <div class="indicator-dot" id="keyboard-indicator"></div>
                        <span id="keyboard-status">Неактивна</span>
                    </div>
                </div>

                <!-- Сетевая активность -->
                <div class="metric-card network-metrics">
                    <h4>🌐 Сетевая активность</h4>
                    <div class="network-stats">
                        <div class="stat-item">
                            <span class="label">Отправлено:</span>
                            <span class="value" id="network-sent">0 MB</span>
                        </div>
                        <div class="stat-item">
                            <span class="label">Получено:</span>
                            <span class="value" id="network-received">0 MB</span>
                        </div>
                        <div class="stat-item">
                            <span class="label">Скорость:</span>
                            <span class="value" id="network-speed">0 Mbps</span>
                        </div>
                    </div>
                    <div class="network-chart" id="network-chart"></div>
                </div>

                <!-- Сводная аналитика -->
                <div class="metric-card summary-analytics">
                    <h4>📈 Сводка системы</h4>
                    <div class="summary-stats">
                        <div class="health-indicator">
                            <span class="label">Состояние системы:</span>
                            <span class="value" id="system-health">🟢 Отлично</span>
                        </div>
                        <div class="performance-score">
                            <span class="label">Оценка производительности:</span>
                            <span class="value" id="performance-score">85/100</span>
                        </div>
                        <div class="last-update">
                            <span class="label">Обновлено:</span>
                            <span class="value" id="analytics-last-update">Никогда</span>
                        </div>
                    </div>
                </div>
            </div>
        `;

        resourcesTab.insertAdjacentHTML('beforeend', analyticsHTML);
        this.addAnalyticsStyles();
    }

    /**
     * Добавление стилей для аналитики
     */
    addAnalyticsStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .analytics-dashboard {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                gap: 20px;
                margin-top: 20px;
            }

            .metric-card {
                background: #fff;
                border: 1px solid #e0e0e0;
                border-radius: 8px;
                padding: 16px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                transition: box-shadow 0.3s ease;
            }

            .metric-card:hover {
                box-shadow: 0 4px 8px rgba(0,0,0,0.15);
            }

            .metric-card h4 {
                margin: 0 0 12px 0;
                color: #333;
                font-size: 16px;
                font-weight: 600;
            }

            .stat-item {
                display: flex;
                justify-content: space-between;
                margin-bottom: 8px;
                padding: 4px 0;
            }

            .stat-item .label {
                color: #666;
                font-size: 14px;
            }

            .stat-item .value {
                font-weight: 600;
                color: #333;
            }

            .progress-bar {
                width: 100%;
                height: 8px;
                background: #f0f0f0;
                border-radius: 4px;
                overflow: hidden;
                margin-top: 12px;
            }

            .progress-fill {
                height: 100%;
                background: linear-gradient(90deg, #4CAF50, #8BC34A);
                transition: width 0.3s ease;
                border-radius: 4px;
            }

            .progress-fill.warning {
                background: linear-gradient(90deg, #FF9800, #FFC107);
            }

            .progress-fill.critical {
                background: linear-gradient(90deg, #F44336, #FF5722);
            }

            .activity-indicator {
                display: flex;
                align-items: center;
                margin-top: 12px;
                gap: 8px;
            }

            .indicator-dot {
                width: 12px;
                height: 12px;
                border-radius: 50%;
                background: #ccc;
                transition: background 0.3s ease;
            }

            .indicator-dot.active {
                background: #4CAF50;
                box-shadow: 0 0 8px rgba(76, 175, 80, 0.5);
            }

            .indicator-dot.moderate {
                background: #FF9800;
                box-shadow: 0 0 8px rgba(255, 152, 0, 0.5);
            }

            .indicator-dot.high {
                background: #F44336;
                box-shadow: 0 0 8px rgba(244, 67, 54, 0.5);
            }

            .indicator-dot.critical {
                background: #8B0000;
                box-shadow: 0 0 12px rgba(139, 0, 0, 0.7);
                animation: pulse 1.5s infinite;
            }

            @keyframes pulse {
                0% { transform: scale(1); }
                50% { transform: scale(1.1); }
                100% { transform: scale(1); }
            }

            .network-chart {
                height: 60px;
                background: #f8f9fa;
                border-radius: 4px;
                margin-top: 12px;
                position: relative;
                overflow: hidden;
            }

            .health-indicator, .performance-score, .last-update {
                margin-bottom: 8px;
                padding: 8px;
                background: #f8f9fa;
                border-radius: 4px;
            }

            .summary-stats .value {
                font-weight: 700;
            }

            @media (max-width: 768px) {
                .analytics-dashboard {
                    grid-template-columns: 1fr;
                }
            }

            .intensity-fill {
                width: 100%;
                height: 100%;
                border-radius: 6px;
                transition: all 0.3s ease;
            }

            .intensity-fill.active {
                background: linear-gradient(90deg, #4CAF50 0%, #4CAF50 25%);
            }

            .intensity-fill.moderate {
                background: linear-gradient(90deg, #FF9800 0%, #FF9800 50%);
            }

            .intensity-fill.high {
                background: linear-gradient(90deg, #F44336 0%, #F44336 75%);
            }

            .intensity-fill.critical {
                background: linear-gradient(90deg, #8B0000 0%, #8B0000 100%);
                animation: pulse 1.5s infinite;
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Загрузка данных аналитики
     */
    async loadAnalyticsData() {
        try {
            console.log('📊 Загрузка данных аналитики...');
            
            // Используем только доступные публичные endpoints
            const monitoringData = await this.fetchAnalyticsData('/api/public/monitoring/data');

            // Отладка: смотрим что приходит
            console.log('🔍 Данные мониторинга:', monitoringData);
            if (monitoringData && monitoringData.length > 0) {
                console.log('🔍 Первая запись:', monitoringData[0]);
            }

            // Обрабатываем данные мониторинга как системные метрики
            if (monitoringData && monitoringData.length > 0) {
                const systemMetrics = this.processMonitoringData(monitoringData);
                console.log('🔍 Обработанные метрики:', systemMetrics);
                this.updateSystemMetrics(systemMetrics);
            }

            // Показываем заглушку для пользовательского взаимодействия
            const userInteraction = {
                total_keyboard_events: 0,
                avg_keyboard_activity_per_hour: 0,
                peak_keyboard_activity: 0,
                peak_keyboard_time: '-'
            };
            this.updateUserInteraction(userInteraction);
            
            // Загружаем сетевую активность отдельно
            await this.loadNetworkActivity();
            
            // Обновляем карточки основного дашборда
            const analyticsData = {
                system_metrics: monitoringData && monitoringData.length > 0 ? this.processMonitoringData(monitoringData) : null,
                user_interaction: userInteraction,
                network_data: this.lastNetworkData
            };
            this.updateMainDashboardCards(analyticsData);
            
            // Обновляем графики в карточках детализации
            if (analyticsData.system_metrics) this.updateGPUChart(analyticsData.system_metrics);
            if (analyticsData.user_interaction) this.updateKeyboardChart(analyticsData.user_interaction);
            if (this.lastNetworkData) this.updateNetworkChart(this.lastNetworkData);
            
            console.log('✅ Данные аналитики загружены');
        } catch (error) {
            console.error('❌ Ошибка загрузки аналитики:', error);
        }
    }

    /**
     * Обработка данных мониторинга в формат системных метрик
     */
    processMonitoringData(monitoringData) {
        if (!monitoringData || monitoringData.length === 0) return null;

        // Вычисляем средние и максимальные значения
        const cpuValues = monitoringData.map(item => item.cpu || 0);
        const memoryValues = monitoringData.map(item => item.memory || 0);
        const diskValues = monitoringData.map(item => item.disk || 0);

        return {
            avg_cpu_usage: cpuValues.reduce((sum, val) => sum + val, 0) / cpuValues.length,
            avg_memory_usage: memoryValues.reduce((sum, val) => sum + val, 0) / memoryValues.length,
            avg_disk_usage: diskValues.reduce((sum, val) => sum + val, 0) / diskValues.length,
            avg_gpu_usage: 0, // GPU данные пока не доступны в monitoring/data
            max_cpu_usage: Math.max(...cpuValues),
            max_memory_usage: Math.max(...memoryValues),
            max_disk_usage: Math.max(...diskValues),
            max_gpu_usage: 0
        };
    }

    /**
     * Обработка данных клавиатуры в формат пользовательского взаимодействия
     */
    processKeyboardData(keyboardData) {
        if (!keyboardData || keyboardData.length === 0) return null;

        // Подсчитываем события клавиатуры
        const totalEvents = keyboardData.length;
        
        // Вычисляем временной диапазон
        const timestamps = keyboardData.map(item => new Date(item.timestamp));
        const minTime = Math.min(...timestamps);
        const maxTime = Math.max(...timestamps);
        const timeRangeMs = maxTime - minTime;
        const timeRangeHours = timeRangeMs / (1000 * 60 * 60);
        
        // Защита от деления на ноль - если все записи с одинаковым временем
        let eventsPerHour = 0;
        
        if (timeRangeHours > 0) {
            eventsPerHour = totalEvents / timeRangeHours;
        } else {
            // Если все записи с одинаковым временем, показываем как активность за минуту * 60
            eventsPerHour = totalEvents * 60; // Предполагаем что это активность за минуту
        }

        return {
            total_keyboard_events: totalEvents,
            avg_keyboard_activity_per_hour: Math.round(eventsPerHour),
            peak_keyboard_activity: Math.round(eventsPerHour), // Упрощенная версия
            peak_keyboard_time: keyboardData.length > 0 ? new Date(keyboardData[0].timestamp).toLocaleTimeString() : '-'
        };
    }

    /**
     * Обработка данных мыши в формат пользовательского взаимодействия
     */
    processMouseData(mouseData) {
        if (!mouseData || mouseData.length === 0) return null;

        // Подсчитываем активность мыши
        const totalClicks = mouseData.reduce((sum, item) => sum + (item.mouse_clicks || 0), 0);
        const totalMovements = mouseData.reduce((sum, item) => sum + (item.mouse_movements || 0), 0);
        const totalSessions = mouseData.length;
        
        // Вычисляем временной диапазон
        const timestamps = mouseData.map(item => new Date(item.timestamp));
        const minTime = Math.min(...timestamps);
        const maxTime = Math.max(...timestamps);
        const timeRangeMs = maxTime - minTime;
        const timeRangeHours = timeRangeMs / (1000 * 60 * 60);
        
        // Защита от деления на ноль и некорректных расчетов
        let clicksPerHour = 0;
        let movementsPerHour = 0;
        
        if (timeRangeHours > 0) {
            clicksPerHour = totalClicks / timeRangeHours;
            movementsPerHour = totalMovements / timeRangeHours;
        } else {
            // Если все записи с одинаковым временем, показываем как активность за минуту
            clicksPerHour = totalClicks * 60; // За час = за минуту * 60
            movementsPerHour = totalMovements * 60;
        }

        const totalActivityPerHour = clicksPerHour + movementsPerHour;

        // Адаптируем под формат клавиатурной активности для совместимости с UI
        return {
            total_keyboard_events: totalClicks + totalMovements, // Общее взаимодействие
            avg_keyboard_activity_per_hour: Math.round(totalActivityPerHour), // Общая активность в час
            peak_keyboard_activity: Math.round(Math.max(clicksPerHour, movementsPerHour)), // Пиковая активность
            peak_keyboard_time: mouseData.length > 0 ? new Date(mouseData[0].timestamp).toLocaleTimeString() : '-',
            // Дополнительные поля для мыши
            total_mouse_clicks: totalClicks,
            total_mouse_movements: totalMovements,
            total_mouse_sessions: totalSessions,
            avg_clicks_per_hour: Math.round(clicksPerHour),
            avg_movements_per_hour: Math.round(movementsPerHour)
        };
    }

    /**
     * Обновление метрик системы (включая GPU)
     */
    updateSystemMetrics(data) {
        if (!data) return;

        // GPU метрики
        const gpuCurrent = document.getElementById('gpu-current');
        const gpuAverage = document.getElementById('gpu-average');
        const gpuMax = document.getElementById('gpu-max');
        const gpuProgress = document.getElementById('gpu-progress');

        if (gpuCurrent) gpuCurrent.textContent = `${data.avg_gpu_usage?.toFixed(1) || 0}%`;
        if (gpuAverage) gpuAverage.textContent = `${data.avg_gpu_usage?.toFixed(1) || 0}%`;
        if (gpuMax) gpuMax.textContent = `${data.max_gpu_usage?.toFixed(1) || 0}%`;
        
        if (gpuProgress) {
            const usage = data.avg_gpu_usage || 0;
            gpuProgress.style.width = `${usage}%`;
            gpuProgress.className = 'progress-fill';
            
            if (usage > 80) {
                gpuProgress.classList.add('critical');
            } else if (usage > 60) {
                gpuProgress.classList.add('warning');
            }
        }
    }

    /**
     * Обновление пользовательского взаимодействия (клавиатура/мышь)
     */
    updateUserInteraction(data) {
        if (!data) return;

        const keyboardEventsHour = document.getElementById('keyboard-events-hour');
        const keyboardTotal = document.getElementById('total-keyboard-events');
        const keyboardIntensity = document.getElementById('keyboard-intensity-text');
        const keyboardIndicator = document.getElementById('keyboard-intensity-bar');
        const keyboardEventsPerMin = document.getElementById('keyboard-events-per-minute');

        // Показываем более разумные числа
        const eventsPerHour = data.avg_keyboard_activity_per_hour || 0;
        const eventsPerMin = Math.round(eventsPerHour / 60);
        const totalEvents = data.total_keyboard_events || 0;

        // Обновляем события в минуту
        if (keyboardEventsPerMin) {
            keyboardEventsPerMin.textContent = eventsPerMin;
        }

        // Обновляем события в час - всегда показываем как есть
        if (keyboardEventsHour) {
            keyboardEventsHour.textContent = Math.round(eventsPerHour);
        }
        
        if (keyboardTotal) {
            keyboardTotal.textContent = totalEvents;
        }

        // Определяем интенсивность на основе событий в минуту
        let intensityText = 'Неактивна';
        let intensityClass = '';

        if (eventsPerMin > 50) {
            intensityText = 'Очень высокая активность';
            intensityClass = 'critical';
        } else if (eventsPerMin > 20) {
            intensityText = 'Высокая активность';
            intensityClass = 'high';
        } else if (eventsPerMin > 10) {
            intensityText = 'Умеренная активность';
            intensityClass = 'moderate';
        } else if (eventsPerMin > 2) {
            intensityText = 'Низкая активность';
            intensityClass = 'active';
        }

        if (keyboardIntensity) {
            keyboardIntensity.textContent = intensityText;
        }
        
        if (keyboardIndicator) {
            keyboardIndicator.className = `intensity-fill ${intensityClass}`;
        }
    }

    /**
     * Загрузка сетевой активности
     */
    async loadNetworkActivity() {
        try {
            console.log('🌐 Загрузка сетевой активности...');
            console.log('🔧 API Base:', this.apiBase);
            console.log('🔧 Current Device ID:', this.currentDeviceId);
            
            // Используем новый публичный эндпоинт
            const networkData = await this.fetchAnalyticsData('/api/public/activity/network');
            console.log('📡 Результат запроса сетевой активности:', networkData);
            
            if (networkData && networkData.length > 0) {
                this.lastNetworkData = networkData;
                this.updateNetworkMetrics(networkData);
                console.log('✅ Сетевая активность загружена:', networkData.length, 'записей');
                console.log('📊 Первая запись:', networkData[0]);
            } else {
                console.warn('⚠️ Нет данных сетевой активности');
                // Показываем заглушку
                this.lastNetworkData = [];
                this.updateNetworkMetrics([]);
            }
        } catch (error) {
            console.warn('⚠️ Сетевая активность недоступна:', error.message);
            console.error('📋 Детали ошибки:', error);
            this.lastNetworkData = [];
            this.updateNetworkMetrics([]);
        }
    }

    /**
     * Обновление сетевых метрик (статистика - показываем накопительный трафик)
     */
    updateNetworkMetrics(data) {
        if (!data || !Array.isArray(data) || data.length === 0) return;

        // Берем последнюю запись для отображения накопленного трафика
        const lastRecord = data[data.length - 1];
        let totalSent = lastRecord.bytes_sent || 0;
        let totalReceived = lastRecord.bytes_received || 0;
        let recentSpeed = 0;

        // Вычисляем скорость за период (если есть хотя бы 2 записи)
        if (data.length >= 2) {
            const first = data[0];
            const last = data[data.length - 1];
            
            const timeDiff = (new Date(last.timestamp) - new Date(first.timestamp)) / 1000; // секунды
            
            if (timeDiff > 0) {
                // Вычисляем трафик за период для расчета скорости
                const sentDiff = Math.max(0, last.bytes_sent - first.bytes_sent);
                const receivedDiff = Math.max(0, last.bytes_received - first.bytes_received);
                
                // Скорость в Mbps
                const totalBytesDiff = sentDiff + receivedDiff;
                if (totalBytesDiff > 0) {
                    recentSpeed = (totalBytesDiff * 8) / (timeDiff * 1024 * 1024); // Mbps
                }
            }
        }

        // Защита от неверных значений
        if (!isFinite(recentSpeed) || recentSpeed < 0) {
            recentSpeed = 0;
        }

        // Ограничиваем максимальную скорость разумными пределами (10 Gbps)
        if (recentSpeed > 10000) {
            recentSpeed = 0; // Вероятно, ошибка в данных
        }

        const networkSent = document.getElementById('network-sent');
        const networkReceived = document.getElementById('network-received');
        const networkSpeed = document.getElementById('network-speed');

        if (networkSent) {
            networkSent.textContent = this.formatBytes(totalSent);
        }
        
        if (networkReceived) {
            networkReceived.textContent = this.formatBytes(totalReceived);
        }
        
        if (networkSpeed) {
            networkSpeed.textContent = this.formatNetworkSpeed(recentSpeed);
        }

        console.log('📊 Сетевые метрики обновлены:', {
            totalSent: this.formatBytes(totalSent),
            totalReceived: this.formatBytes(totalReceived),
            speed: this.formatNetworkSpeed(recentSpeed)
        });
    }

    /**
     * Форматирование байт в читаемый вид
     */
    formatBytes(bytes) {
        if (bytes === 0) return '0 B';
        
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Форматирование сетевой скорости в читаемый вид
     */
    formatNetworkSpeed(speedMbps) {
        if (speedMbps === 0) return '0 bps';
        
        if (speedMbps < 0.001) {
            return `${(speedMbps * 1024 * 1024).toFixed(0)} bps`;
        } else if (speedMbps < 1) {
            return `${(speedMbps * 1024).toFixed(1)} Kbps`;
        } else if (speedMbps < 1000) {
            return `${speedMbps.toFixed(1)} Mbps`;
        } else {
            return `${(speedMbps / 1024).toFixed(2)} Gbps`;
        }
    }

    /**
     * Получение данных из API
     */
    async fetchAnalyticsData(endpoint) {
        try {
            const url = `${this.apiBase}${endpoint}${this.currentDeviceId ? `?device_id=${this.currentDeviceId}` : ''}`;
            console.log('🔗 Выполняем запрос к:', url);
            
            // Получаем токен авторизации из localStorage
            const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
            console.log('🔑 Токен авторизации:', token ? 'найден' : 'отсутствует');
            
            const headers = {
                'Content-Type': 'application/json'
            };
            
            // Добавляем заголовок авторизации если токен есть
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
            
            console.log('📋 Заголовки запроса:', headers);
            
            const response = await fetch(url, {
                headers: headers
            });
            
            console.log('📡 Статус ответа:', response.status, response.statusText);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log('✅ Данные получены, количество:', Array.isArray(data) ? data.length : 'не массив');
            return data;
        } catch (error) {
            console.error(`❌ Ошибка запроса ${endpoint}:`, error);
            return null;
        }
    }

    /**
     * Получение текущего device_id
     */
    getCurrentDeviceId() {
        // Пытаемся получить device_id из существующих элементов дашборда
        const deviceSelect = document.querySelector('#device-filter');
        if (deviceSelect && deviceSelect.value) {
            return deviceSelect.value;
        }
        
        // Или из localStorage
        return localStorage.getItem('currentDeviceId') || null;
    }

    /**
     * Автообновление данных
     */
    startAutoUpdate() {
        setInterval(async () => {
            if (this.isInitialized) {
                await this.loadAnalyticsData();
            }
        }, this.updateInterval);
    }

    /**
     * Обновление device_id
     */
    setDeviceId(deviceId) {
        this.currentDeviceId = deviceId;
        if (this.isInitialized) {
            this.loadAnalyticsData();
        }
    }

    /**
     * Интеграция с основным дашбордом - обновление карточек ресурсов
     */
    updateMainDashboardCards(analyticsData) {
        if (!analyticsData) return;

        // Обновляем GPU карточку
        this.updateGPUCard(analyticsData.system_metrics);
        
        // Обновляем сетевую карточку
        this.updateNetworkCard(analyticsData.network_data);
        
        // Обновляем клавиатурную карточку
        this.updateKeyboardCard(analyticsData.user_interaction);
    }

    /**
     * Обновление карточки GPU
     */
    updateGPUCard(systemMetrics) {
        if (!systemMetrics) return;

        const currentGPU = document.getElementById('current-gpu-usage');
        const maxGPU = document.getElementById('max-gpu-usage');
        const avgGPU = document.getElementById('avg-gpu-usage');
        const gpuProgress = document.getElementById('gpu-progress');
        const peakGPU = document.getElementById('peak-gpu');
        const peakGPUTime = document.getElementById('peak-gpu-time');

        if (currentGPU) {
            currentGPU.textContent = Math.round(systemMetrics.avg_gpu_usage || 0);
        }
        
        if (maxGPU) {
            maxGPU.textContent = `${Math.round(systemMetrics.max_gpu_usage || 0)}%`;
        }
        
        if (avgGPU) {
            avgGPU.textContent = `${Math.round(systemMetrics.avg_gpu_usage || 0)}%`;
        }
        
        if (gpuProgress) {
            const usage = systemMetrics.avg_gpu_usage || 0;
            gpuProgress.style.width = `${usage}%`;
        }

        if (peakGPU) {
            peakGPU.textContent = `${Math.round(systemMetrics.max_gpu_usage || 0)}%`;
        }

        if (peakGPUTime) {
            peakGPUTime.textContent = systemMetrics.peak_gpu_time || '-';
        }
    }

    /**
     * Обновление карточки сетевой активности
     */
    updateNetworkCard(networkData) {
        if (!networkData || !Array.isArray(networkData) || networkData.length === 0) return;

        const currentSpeed = document.getElementById('current-network-speed');
        const networkUpload = document.getElementById('network-upload');
        const networkDownload = document.getElementById('network-download');
        const networkIndicator = document.getElementById('network-indicator');
        const networkStatus = document.getElementById('network-status-text');
        const peakSpeed = document.getElementById('peak-network-speed');
        const totalTraffic = document.getElementById('total-network-traffic');
        const networkRatio = document.getElementById('network-ratio');

        let periodTrafficSent = 0;
        let periodTrafficReceived = 0;
        let recentSpeed = 0;
        let maxSpeed = 0;

        // Вычисляем трафик и скорость за период (используем разность между первой и последней записью)
        if (networkData.length >= 2) {
            const first = networkData[0];
            const last = networkData[networkData.length - 1];
            
            const timeDiff = (new Date(last.timestamp) - new Date(first.timestamp)) / 1000; // секунды
            
            if (timeDiff > 0) {
                const sentDiff = Math.max(0, last.bytes_sent - first.bytes_sent);
                const receivedDiff = Math.max(0, last.bytes_received - first.bytes_received);
                
                periodTrafficSent = sentDiff;
                periodTrafficReceived = receivedDiff;
                
                const totalBytesDiff = sentDiff + receivedDiff;
                if (totalBytesDiff > 0) {
                    recentSpeed = (totalBytesDiff * 8) / (timeDiff * 1024 * 1024); // Mbps
                }
            }
        } else {
            // Если только одна запись, берем ее как есть
            const lastRecord = networkData[networkData.length - 1];
            periodTrafficSent = lastRecord.bytes_sent || 0;
            periodTrafficReceived = lastRecord.bytes_received || 0;
        }

        // Защита от некорректных значений
        if (!isFinite(recentSpeed) || recentSpeed < 0 || recentSpeed > 10000) {
            recentSpeed = 0;
        }

        // Обновляем UI с человекочитаемыми единицами
        if (currentSpeed) {
            currentSpeed.textContent = this.formatNetworkSpeed(recentSpeed).replace(' ', '').replace('bps', '').replace('Kbps', 'K').replace('Mbps', 'M').replace('Gbps', 'G');
        }

        if (networkUpload) {
            networkUpload.textContent = this.formatBytes(periodTrafficSent);
        }

        if (networkDownload) {
            networkDownload.textContent = this.formatBytes(periodTrafficReceived);
        }

        if (networkIndicator && networkStatus) {
            if (recentSpeed > 10) {
                networkIndicator.style.background = '#28a745';
                networkStatus.textContent = 'Высокая активность';
            } else if (recentSpeed > 1) {
                networkIndicator.style.background = '#ffc107';
                networkStatus.textContent = 'Умеренная активность';
            } else if (recentSpeed > 0.1) {
                networkIndicator.style.background = '#17a2b8';
                networkStatus.textContent = 'Низкая активность';
            } else {
                networkIndicator.style.background = '#dc3545';
                networkStatus.textContent = 'Неактивна';
            }
        }

        if (peakSpeed) {
            // Вычисляем пиковую скорость по всем данным
            maxSpeed = recentSpeed;
            if (networkData.length > 2) {
                for (let i = 1; i < networkData.length; i++) {
                    const current = networkData[i];
                    const previous = networkData[i - 1];
                    const timeDiff = (new Date(current.timestamp) - new Date(previous.timestamp)) / 1000;
                    
                    if (timeDiff > 0) {
                        const sentDiff = Math.max(0, current.bytes_sent - previous.bytes_sent);
                        const receivedDiff = Math.max(0, current.bytes_received - previous.bytes_received);
                        const totalDiff = sentDiff + receivedDiff;
                        
                        if (totalDiff > 0) {
                            const speed = (totalDiff * 8) / (timeDiff * 1024 * 1024); // Mbps
                            if (isFinite(speed) && speed > maxSpeed && speed <= 10000) {
                                maxSpeed = speed;
                            }
                        }
                    }
                }
            }
            peakSpeed.textContent = this.formatNetworkSpeed(maxSpeed);
        }

        if (totalTraffic) {
            const total = (periodTrafficSent + periodTrafficReceived);
            totalTraffic.textContent = this.formatBytes(total);
        }

        if (networkRatio && periodTrafficReceived > 0 && periodTrafficSent > 0) {
            const ratio = periodTrafficSent / periodTrafficReceived;
            networkRatio.textContent = `${ratio.toFixed(1)}:1`;
        } else if (networkRatio) {
            networkRatio.textContent = '-';
        }

        console.log('🌐 Сетевая карточка обновлена:', {
            speed: this.formatNetworkSpeed(recentSpeed),
            upload: this.formatBytes(periodTrafficSent),
            download: this.formatBytes(periodTrafficReceived),
            peak: this.formatNetworkSpeed(maxSpeed)
        });
    }

    /**
     * Обновление карточки клавиатурной активности
     */
    updateKeyboardCard(userInteraction) {
        if (!userInteraction) return;

        const eventsPerMinute = document.getElementById('keyboard-events-per-minute');
        const totalEvents = document.getElementById('total-keyboard-events');
        const eventsHour = document.getElementById('keyboard-events-hour');
        const intensityBar = document.getElementById('keyboard-intensity-bar');
        const intensityText = document.getElementById('keyboard-intensity-text');
        const peakActivity = document.getElementById('peak-keyboard-activity');
        const peakTime = document.getElementById('peak-keyboard-time');
        const avgActivity = document.getElementById('avg-keyboard-activity');
        const intensityLevel = document.getElementById('keyboard-intensity-level');

        const eventsPerMin = Math.round((userInteraction.avg_keyboard_activity_per_hour || 0) / 60);
        const totalKeyboardEvents = userInteraction.total_keyboard_events || 0;
        const hourlyEvents = Math.round(userInteraction.avg_keyboard_activity_per_hour || 0);

        if (eventsPerMinute) {
            eventsPerMinute.textContent = eventsPerMin;
        }

        if (totalEvents) {
            totalEvents.textContent = totalKeyboardEvents;
        }

        if (eventsHour) {
            eventsHour.textContent = hourlyEvents;
        }

        // Определяем интенсивность
        let intensity = 0;
        let intensityTextValue = 'Неактивна';
        let levelText = 'Низкий';

        if (hourlyEvents > 300) {
            intensity = 100;
            intensityTextValue = 'Очень высокая';
            levelText = 'Очень высокий';
        } else if (hourlyEvents > 200) {
            intensity = 80;
            intensityTextValue = 'Высокая';
            levelText = 'Высокий';
        } else if (hourlyEvents > 100) {
            intensity = 60;
            intensityTextValue = 'Средняя';
            levelText = 'Средний';
        } else if (hourlyEvents > 50) {
            intensity = 30;
            intensityTextValue = 'Низкая';
            levelText = 'Низкий';
        }

        if (intensityBar) {
            intensityBar.style.width = `${intensity}%`;
        }

        if (intensityText) {
            intensityText.textContent = intensityTextValue;
        }

        if (peakActivity) {
            peakActivity.textContent = `${Math.round(userInteraction.peak_keyboard_activity || 0)} соб/мин`;
        }

        if (peakTime) {
            peakTime.textContent = userInteraction.peak_keyboard_time || '-';
        }

        if (avgActivity) {
            avgActivity.textContent = `${eventsPerMin} соб/мин`;
        }

        if (intensityLevel) {
            intensityLevel.textContent = levelText;
        }
    }

    /**
     * Инициализация графиков для новых карточек
     */
    initializeCharts() {
        this.initGPUChart();
        this.initNetworkChart();
        this.initKeyboardChart();
    }

    /**
     * Инициализация графика GPU
     */
    initGPUChart() {
        const chartContainer = document.getElementById('gpu-chart');
        if (!chartContainer) return;

        // Простой график с Canvas
        const canvas = document.createElement('canvas');
        canvas.width = 300;
        canvas.height = 100;
        canvas.style.width = '100%';
        canvas.style.height = '100px';
        chartContainer.appendChild(canvas);

        this.gpuChart = {
            canvas: canvas,
            ctx: canvas.getContext('2d'),
            data: []
        };
    }

    /**
     * Инициализация графика сети
     */
    initNetworkChart() {
        const chartContainer = document.getElementById('network-chart');
        if (!chartContainer) return;

        const canvas = document.createElement('canvas');
        canvas.width = 300;
        canvas.height = 100;
        canvas.style.width = '100%';
        canvas.style.height = '100px';
        chartContainer.appendChild(canvas);

        this.networkChart = {
            canvas: canvas,
            ctx: canvas.getContext('2d'),
            data: []
        };
    }

    /**
     * Инициализация графика клавиатуры
     */
    initKeyboardChart() {
        const chartContainer = document.getElementById('keyboard-chart');
        if (!chartContainer) return;

        const canvas = document.createElement('canvas');
        canvas.width = 300;
        canvas.height = 100;
        canvas.style.width = '100%';
        canvas.style.height = '100px';
        chartContainer.appendChild(canvas);

        this.keyboardChart = {
            canvas: canvas,
            ctx: canvas.getContext('2d'),
            data: []
        };
    }

    /**
     * Обновление графика GPU
     */
    updateGPUChart(data) {
        if (!this.gpuChart || !data) return;

        const ctx = this.gpuChart.ctx;
        const canvas = this.gpuChart.canvas;
        
        // Очищаем canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Добавляем новые данные
        this.gpuChart.data.push(data.avg_gpu_usage || 0);
        if (this.gpuChart.data.length > 20) {
            this.gpuChart.data.shift();
        }

        // Рисуем график
        this.drawLineChart(ctx, this.gpuChart.data, '#007bff', canvas.width, canvas.height);
    }

    /**
     * Обновление графика сети
     */
    updateNetworkChart(data) {
        if (!this.networkChart || !data || !Array.isArray(data)) return;

        const ctx = this.networkChart.ctx;
        const canvas = this.networkChart.canvas;
        
        // Вычисляем скорость
        let speed = 0;
        if (data.length >= 2) {
            // Используем последние две записи для расчета мгновенной скорости
            const prev = data[data.length - 2];
            const current = data[data.length - 1];
            
            const timeDiff = (new Date(current.timestamp) - new Date(prev.timestamp)) / 1000; // секунды
            
            if (timeDiff > 0) {
                const bytesDiff = (current.bytes_sent - prev.bytes_sent) + (current.bytes_received - prev.bytes_received);
                
                if (bytesDiff > 0) {
                    speed = (bytesDiff * 8) / (timeDiff * 1024 * 1024); // Mbps
                    speed = Math.max(0, speed);
                }
            }
        }

        // Защита от некорректных значений
        if (!isFinite(speed) || speed > 1000) {
            speed = 0;
        }

        // Очищаем canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Добавляем новые данные
        this.networkChart.data.push(speed);
        if (this.networkChart.data.length > 20) {
            this.networkChart.data.shift();
        }

        // Рисуем график
        this.drawLineChart(ctx, this.networkChart.data, '#28a745', canvas.width, canvas.height);
    }

    /**
     * Обновление графика клавиатуры
     */
    updateKeyboardChart(data) {
        if (!this.keyboardChart || !data) return;

        const ctx = this.keyboardChart.ctx;
        const canvas = this.keyboardChart.canvas;
        
        // Очищаем canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Добавляем новые данные (события в минуту)
        const eventsPerMin = (data.avg_keyboard_activity_per_hour || 0) / 60;
        this.keyboardChart.data.push(eventsPerMin);
        if (this.keyboardChart.data.length > 20) {
            this.keyboardChart.data.shift();
        }

        // Рисуем график
        this.drawLineChart(ctx, this.keyboardChart.data, '#ffc107', canvas.width, canvas.height);
    }

    /**
     * Рисование линейного графика
     */
    drawLineChart(ctx, data, color, width, height) {
        if (!data || data.length === 0) return;

        const padding = 10;
        const graphWidth = width - padding * 2;
        const graphHeight = height - padding * 2;
        
        const maxValue = Math.max(...data, 1);
        const step = graphWidth / (data.length - 1 || 1);

        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();

        data.forEach((value, index) => {
            const x = padding + index * step;
            const y = padding + graphHeight - (value / maxValue) * graphHeight;
            
            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });

        ctx.stroke();
        
        // Добавляем точки
        ctx.fillStyle = color;
        data.forEach((value, index) => {
            const x = padding + index * step;
            const y = padding + graphHeight - (value / maxValue) * graphHeight;
            
            ctx.beginPath();
            ctx.arc(x, y, 3, 0, 2 * Math.PI);
            ctx.fill();
        });
    }
}

// Глобальная инициализация
window.smartAnalytics = new SmartAnalyticsDashboard();

// Автоматическая инициализация при загрузке DOM
document.addEventListener('DOMContentLoaded', () => {
    // Ждем инициализации основного дашборда
    setTimeout(() => {
        window.smartAnalytics.initialize();
    }, 2000);
});

// Экспорт для использования в других модулях
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SmartAnalyticsDashboard;
} 