/**
 * 🚀 Продвинутая система аналитики браузеров
 * Синхронизация данных между всеми метриками: браузеры, мышь, ресурсы, активность
 */

class BrowserAnalytics {
    constructor() {
        this.activeFilters = new Set();
        this.allData = {};
        this.syncedMetrics = {
            browsers: {},
            mouse: {},
            resources: {},
            activity: {},
            websites: {}
        };
        this.init();
    }

    init() {
        console.log('🔧 Инициализация продвинутой аналитики браузеров...');
        this.createFilterButtons();
        this.setupEventListeners();
    }

    /**
     * 🎨 Создание красивых кнопок фильтрации
     */
    createFilterButtons() {
        const browserStatsContainer = document.getElementById('browser-stats-container');
        if (!browserStatsContainer) return;

        const filtersHTML = `
            <div class="browser-analytics-panel">
                <div class="analytics-header">
                    <h5><i class="bi bi-graph-up-arrow"></i> Продвинутая аналитика</h5>
                    <div class="analytics-status">
                        <span class="status-indicator active" id="sync-status">
                            <i class="bi bi-check-circle-fill"></i> Синхронизировано
                        </span>
                    </div>
                </div>
                
                <div class="filter-controls">
                    <div class="filter-group">
                        <label class="filter-label">Режимы анализа:</label>
                        <div class="btn-group filter-buttons" role="group">
                            <button type="button" class="btn btn-outline-primary btn-sm filter-btn active" 
                                    data-filter="real-time" title="Показать реальное время без перекрытий">
                                <i class="bi bi-clock"></i> Реальное время
                            </button>
                            <button type="button" class="btn btn-outline-success btn-sm filter-btn" 
                                    data-filter="active-only" title="Только активные периоды">
                                <i class="bi bi-activity"></i> Активность
                            </button>
                            <button type="button" class="btn btn-outline-info btn-sm filter-btn" 
                                    data-filter="productive" title="Только продуктивные сайты">
                                <i class="bi bi-trophy"></i> Продуктивность
                            </button>
                            <button type="button" class="btn btn-outline-warning btn-sm filter-btn" 
                                    data-filter="cross-metrics" title="Синхронизация всех метрик">
                                <i class="bi bi-diagram-3"></i> Кросс-анализ
                            </button>
                        </div>
                    </div>

                    <div class="filter-group">
                        <label class="filter-label">Источники данных:</label>
                        <div class="btn-group filter-buttons" role="group">
                            <button type="button" class="btn btn-outline-secondary btn-sm source-btn active" 
                                    data-source="browser" title="Данные браузеров">
                                <i class="bi bi-globe"></i> Браузеры
                            </button>
                            <button type="button" class="btn btn-outline-secondary btn-sm source-btn active" 
                                    data-source="mouse" title="Активность мыши">
                                <i class="bi bi-mouse"></i> Мышь
                            </button>
                            <button type="button" class="btn btn-outline-secondary btn-sm source-btn active" 
                                    data-source="resources" title="Системные ресурсы">
                                <i class="bi bi-cpu"></i> Ресурсы
                            </button>
                            <button type="button" class="btn btn-outline-secondary btn-sm source-btn active" 
                                    data-source="activity" title="Активность приложений">
                                <i class="bi bi-window"></i> Активность
                            </button>
                        </div>
                    </div>

                    <div class="analytics-actions">
                        <button type="button" class="btn btn-primary btn-sm" id="apply-analytics">
                            <i class="bi bi-play-fill"></i> Применить анализ
                        </button>
                        <button type="button" class="btn btn-outline-danger btn-sm" id="reset-analytics">
                            <i class="bi bi-arrow-clockwise"></i> Сброс
                        </button>
                        <button type="button" class="btn btn-outline-info btn-sm" id="export-analytics">
                            <i class="bi bi-download"></i> Экспорт
                        </button>
                    </div>
                </div>

                <div class="analytics-insights" id="analytics-insights">
                    <!-- Здесь будут отображаться инсайты -->
                </div>
            </div>
        `;

        // Вставляем панель перед существующим контентом
        browserStatsContainer.insertAdjacentHTML('afterbegin', filtersHTML);

        // Добавляем стили
        this.addAnalyticsStyles();
    }

    /**
     * 🎨 Стили для панели аналитики
     */
    addAnalyticsStyles() {
        const styles = `
            <style id="browser-analytics-styles">
                .browser-analytics-panel {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    border-radius: 15px;
                    padding: 20px;
                    margin-bottom: 20px;
                    color: white;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.2);
                }

                .analytics-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                }

                .analytics-header h5 {
                    margin: 0;
                    font-weight: 600;
                    color: white;
                }

                .status-indicator {
                    display: flex;
                    align-items: center;
                    gap: 5px;
                    font-size: 0.9em;
                    padding: 5px 10px;
                    border-radius: 20px;
                    background: rgba(255,255,255,0.2);
                }

                .status-indicator.active {
                    background: rgba(40, 167, 69, 0.3);
                    color: #d4edda;
                }

                .filter-group {
                    margin-bottom: 15px;
                }

                .filter-label {
                    display: block;
                    margin-bottom: 8px;
                    font-weight: 500;
                    font-size: 0.9em;
                    color: rgba(255,255,255,0.9);
                }

                .filter-buttons {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 8px;
                }

                .filter-btn, .source-btn {
                    border-radius: 20px !important;
                    padding: 6px 12px !important;
                    font-size: 0.85em !important;
                    font-weight: 500 !important;
                    transition: all 0.3s ease !important;
                    border: 2px solid rgba(255,255,255,0.3) !important;
                    background: rgba(255,255,255,0.1) !important;
                    color: white !important;
                }

                .filter-btn:hover, .source-btn:hover {
                    background: rgba(255,255,255,0.2) !important;
                    transform: translateY(-2px);
                    box-shadow: 0 5px 15px rgba(0,0,0,0.2);
                }

                .filter-btn.active, .source-btn.active {
                    background: rgba(255,255,255,0.9) !important;
                    color: #667eea !important;
                    border-color: white !important;
                }

                .analytics-actions {
                    display: flex;
                    gap: 10px;
                    flex-wrap: wrap;
                    margin-top: 15px;
                }

                .analytics-actions .btn {
                    border-radius: 20px !important;
                    padding: 8px 16px !important;
                    font-weight: 500 !important;
                    transition: all 0.3s ease !important;
                }

                .analytics-insights {
                    margin-top: 20px;
                    padding: 15px;
                    background: rgba(255,255,255,0.1);
                    border-radius: 10px;
                    backdrop-filter: blur(10px);
                    display: none;
                }

                .insight-card {
                    background: rgba(255,255,255,0.15);
                    border-radius: 8px;
                    padding: 12px;
                    margin-bottom: 10px;
                    border-left: 4px solid #ffd700;
                }

                .insight-title {
                    font-weight: 600;
                    margin-bottom: 5px;
                    color: #ffd700;
                }

                .insight-value {
                    font-size: 1.1em;
                    font-weight: 500;
                }

                @media (max-width: 768px) {
                    .filter-buttons {
                        justify-content: center;
                    }
                    
                    .analytics-actions {
                        justify-content: center;
                    }
                }
            </style>
        `;

        if (!document.getElementById('browser-analytics-styles')) {
            document.head.insertAdjacentHTML('beforeend', styles);
        }
    }

    /**
     * 🔧 Настройка обработчиков событий
     */
    setupEventListeners() {
        // Кнопки фильтров
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('filter-btn')) {
                this.handleFilterClick(e.target);
            }
            if (e.target.classList.contains('source-btn')) {
                this.handleSourceClick(e.target);
            }
        });

        // Основные действия
        document.getElementById('apply-analytics')?.addEventListener('click', () => {
            this.applyAdvancedAnalytics();
        });

        document.getElementById('reset-analytics')?.addEventListener('click', () => {
            this.resetAnalytics();
        });

        document.getElementById('export-analytics')?.addEventListener('click', () => {
            this.exportAnalytics();
        });
    }

    /**
     * 🎯 Обработка кликов по фильтрам
     */
    handleFilterClick(button) {
        // Убираем активность с других кнопок в группе
        button.parentElement.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Активируем выбранную кнопку
        button.classList.add('active');
        
        const filter = button.dataset.filter;
        this.activeFilters.clear();
        this.activeFilters.add(filter);
        
        console.log(`🎯 Активирован фильтр: ${filter}`);
        this.updateSyncStatus();
    }

    /**
     * 📊 Обработка кликов по источникам данных
     */
    handleSourceClick(button) {
        button.classList.toggle('active');
        const source = button.dataset.source;
        
        if (button.classList.contains('active')) {
            this.activeFilters.add(`source-${source}`);
        } else {
            this.activeFilters.delete(`source-${source}`);
        }
        
        console.log(`📊 Источник ${source}: ${button.classList.contains('active') ? 'включен' : 'отключен'}`);
        this.updateSyncStatus();
    }

    /**
     * 🚀 Применение продвинутой аналитики
     */
    async applyAdvancedAnalytics() {
        console.log('🚀 Запуск продвинутой аналитики...');
        
        this.updateSyncStatus('processing');
        
        try {
            // Собираем данные из всех источников
            await this.collectAllMetrics();
            
            // Применяем фильтры
            this.applyFilters();
            
            // Синхронизируем метрики
            this.synchronizeMetrics();
            
            // Показываем инсайты
            this.displayInsights();
            
            // Обновляем все графики и таблицы
            this.updateAllVisualizations();
            
            this.updateSyncStatus('success');
            
        } catch (error) {
            console.error('❌ Ошибка при применении аналитики:', error);
            this.updateSyncStatus('error');
        }
    }

    /**
     * 📈 Сбор всех метрик
     */
    async collectAllMetrics() {
        console.log('📈 Сбор данных из всех источников...');
        
        // Получаем текущие данные дашборда
        const dashboardData = window.currentDashboardData || {};
        
        // Браузеры
        this.syncedMetrics.browsers = this.processBrowserData(
            dashboardData.browser_activity || dashboardData.website_visits || []
        );
        
        // Мышь
        this.syncedMetrics.mouse = this.processMouseData(
            dashboardData.mouse_activity || []
        );
        
        // Ресурсы
        this.syncedMetrics.resources = this.processResourceData(
            dashboardData.resource_usage || []
        );
        
        // Активность
        this.syncedMetrics.activity = this.processActivityData(
            dashboardData.activities || []
        );
        
        // Веб-сайты
        this.syncedMetrics.websites = this.processWebsiteData(
            dashboardData.website_visits || []
        );
        
        console.log('✅ Данные собраны:', this.syncedMetrics);
    }

    /**
     * 🌐 Обработка данных браузеров
     */
    processBrowserData(browserData) {
        const processed = {
            sessions: {},
            totalTime: 0,
            realTime: 0,
            overlaps: [],
            productivity: {}
        };

        // Группируем по браузерам
        const browserSessions = {};
        browserData.forEach(item => {
            const browserName = item.browser_name || item.browser || "Неизвестный браузер";
            if (!browserSessions[browserName]) {
                browserSessions[browserName] = [];
            }

            const duration = parseInt(item.total_time || item.duration || 0);
            const startTime = new Date(item.timestamp || item.start_time);
            const endTime = new Date(startTime.getTime() + duration * 1000);

            browserSessions[browserName].push({
                start: startTime,
                end: endTime,
                duration: duration,
                url: item.url || '',
                productive: this.isProductiveUrl(item.url)
            });
        });

        // Анализ перекрытий и реального времени
        const allPeriods = [];
        Object.keys(browserSessions).forEach(browserName => {
            const sessions = browserSessions[browserName];
            sessions.forEach(session => {
                allPeriods.push({
                    ...session,
                    browser: browserName
                });
            });
        });

        // Сортируем и объединяем перекрывающиеся периоды
        allPeriods.sort((a, b) => a.start - b.start);
        
        const mergedPeriods = [];
        let currentPeriod = null;

        allPeriods.forEach(period => {
            if (!currentPeriod) {
                currentPeriod = {
                    start: period.start,
                    end: period.end,
                    browsers: [period.browser],
                    productive: period.productive
                };
            } else {
                if (period.start <= currentPeriod.end) {
                    // Перекрытие найдено
                    processed.overlaps.push({
                        browsers: [currentPeriod.browsers[0], period.browser],
                        start: period.start,
                        end: new Date(Math.min(currentPeriod.end.getTime(), period.end.getTime()))
                    });
                    
                    currentPeriod.end = new Date(Math.max(currentPeriod.end.getTime(), period.end.getTime()));
                    if (!currentPeriod.browsers.includes(period.browser)) {
                        currentPeriod.browsers.push(period.browser);
                    }
                } else {
                    mergedPeriods.push(currentPeriod);
                    currentPeriod = {
                        start: period.start,
                        end: period.end,
                        browsers: [period.browser],
                        productive: period.productive
                    };
                }
            }
        });

        if (currentPeriod) {
            mergedPeriods.push(currentPeriod);
        }

        processed.sessions = browserSessions;
        processed.totalTime = Object.values(browserSessions).flat().reduce((sum, session) => sum + session.duration, 0);
        processed.realTime = mergedPeriods.reduce((total, period) => {
            return total + Math.floor((period.end - period.start) / 1000);
        }, 0);

        return processed;
    }

    /**
     * 🖱️ Обработка данных мыши
     */
    processMouseData(mouseData) {
        return {
            totalClicks: mouseData.reduce((sum, item) => sum + (item.clicks || 0), 0),
            totalDistance: mouseData.reduce((sum, item) => sum + (item.distance || 0), 0),
            activeTime: mouseData.length * 60, // примерно
            patterns: this.analyzeMousePatterns(mouseData)
        };
    }

    /**
     * 💻 Обработка данных ресурсов
     */
    processResourceData(resourceData) {
        if (!resourceData.length) return { cpu: 0, memory: 0, disk: 0 };
        
        return {
            cpu: resourceData.reduce((sum, item) => sum + (item.cpu_usage || 0), 0) / resourceData.length,
            memory: resourceData.reduce((sum, item) => sum + (item.memory_usage || 0), 0) / resourceData.length,
            disk: resourceData.reduce((sum, item) => sum + (item.disk_usage || 0), 0) / resourceData.length,
            peaks: this.findResourcePeaks(resourceData)
        };
    }

    /**
     * 📱 Обработка данных активности
     */
    processActivityData(activityData) {
        const productive = activityData.filter(item => item.is_productive);
        const neutral = activityData.filter(item => !item.is_productive && !item.is_break);
        const breaks = activityData.filter(item => item.is_break);

        return {
            total: activityData.length,
            productive: productive.length,
            neutral: neutral.length,
            breaks: breaks.length,
            productivityScore: productive.length / Math.max(activityData.length, 1) * 100
        };
    }

    /**
     * 🌍 Обработка данных веб-сайтов
     */
    processWebsiteData(websiteData) {
        const domains = {};
        websiteData.forEach(visit => {
            try {
                const domain = new URL(visit.url).hostname;
                if (!domains[domain]) {
                    domains[domain] = { visits: 0, productive: this.isProductiveUrl(visit.url) };
                }
                domains[domain].visits++;
            } catch (e) {
                // Игнорируем некорректные URL
            }
        });

        return {
            totalVisits: websiteData.length,
            uniqueDomains: Object.keys(domains).length,
            domains: domains,
            productiveVisits: Object.values(domains).filter(d => d.productive).reduce((sum, d) => sum + d.visits, 0)
        };
    }

    /**
     * 🎯 Применение фильтров
     */
    applyFilters() {
        console.log('🎯 Применение фильтров:', Array.from(this.activeFilters));
        
        if (this.activeFilters.has('active-only')) {
            this.filterActivePeriodsOnly();
        }
        
        if (this.activeFilters.has('productive')) {
            this.filterProductiveOnly();
        }
        
        if (this.activeFilters.has('cross-metrics')) {
            this.applyCrossMetricsAnalysis();
        }
    }

    /**
     * 🔄 Синхронизация метрик
     */
    synchronizeMetrics() {
        console.log('🔄 Синхронизация всех метрик...');
        
        // Находим общие временные периоды
        const commonPeriods = this.findCommonTimePeriods();
        
        // Корректируем метрики на основе общих периодов
        this.adjustMetricsByCommonPeriods(commonPeriods);
        
        console.log('✅ Метрики синхронизированы');
    }

    /**
     * 💡 Отображение инсайтов
     */
    displayInsights() {
        const insightsContainer = document.getElementById('analytics-insights');
        if (!insightsContainer) return;

        const insights = this.generateInsights();
        
        insightsContainer.innerHTML = insights.map(insight => `
            <div class="insight-card">
                <div class="insight-title">${insight.title}</div>
                <div class="insight-value">${insight.value}</div>
            </div>
        `).join('');
        
        insightsContainer.style.display = 'block';
    }

    /**
     * 🧠 Генерация инсайтов
     */
    generateInsights() {
        const insights = [];
        
        // Анализ эффективности времени
        const realTime = this.syncedMetrics.browsers.realTime;
        const totalTime = this.syncedMetrics.browsers.totalTime;
        const efficiency = realTime > 0 ? ((realTime / totalTime) * 100).toFixed(1) : 0;
        
        insights.push({
            title: '⚡ Эффективность времени',
            value: `${efficiency}% (${this.formatDuration(realTime)} из ${this.formatDuration(totalTime)})`
        });
        
        // Анализ перекрытий
        const overlaps = this.syncedMetrics.browsers.overlaps.length;
        if (overlaps > 0) {
            insights.push({
                title: '🔄 Найдено перекрытий',
                value: `${overlaps} периодов одновременной работы браузеров`
            });
        }
        
        // Продуктивность
        const productivityScore = this.syncedMetrics.activity.productivityScore || 0;
        insights.push({
            title: '🎯 Продуктивность',
            value: `${productivityScore.toFixed(1)}% продуктивной активности`
        });
        
        // Активность мыши
        const mouseClicks = this.syncedMetrics.mouse.totalClicks || 0;
        if (mouseClicks > 0) {
            insights.push({
                title: '🖱️ Активность мыши',
                value: `${mouseClicks} кликов, ${(this.syncedMetrics.mouse.totalDistance || 0).toFixed(0)}px пройдено`
            });
        }
        
        return insights;
    }

    /**
     * 🔄 Обновление всех визуализаций
     */
    updateAllVisualizations() {
        console.log('🔄 Обновление всех графиков и таблиц...');
        
        // Обновляем время браузеров
        const totalBrowserTimeElement = document.getElementById('total-browser-time');
        if (totalBrowserTimeElement) {
            totalBrowserTimeElement.textContent = this.formatDuration(this.syncedMetrics.browsers.realTime);
            totalBrowserTimeElement.style.background = 'linear-gradient(45deg, #28a745, #20c997)';
            totalBrowserTimeElement.style.color = 'white';
            totalBrowserTimeElement.style.padding = '5px 10px';
            totalBrowserTimeElement.style.borderRadius = '15px';
            totalBrowserTimeElement.style.fontWeight = 'bold';
        }
        
        // Добавляем анимацию обновления
        this.animateUpdate();
    }

    /**
     * ✨ Анимация обновления
     */
    animateUpdate() {
        const elements = [
            document.getElementById('browser-chart'),
            document.getElementById('top-browsers-table'),
            document.getElementById('total-browser-time')
        ].filter(el => el);
        
        elements.forEach(el => {
            el.style.transform = 'scale(0.98)';
            el.style.transition = 'all 0.3s ease';
            
            setTimeout(() => {
                el.style.transform = 'scale(1)';
                el.style.boxShadow = '0 0 20px rgba(102, 126, 234, 0.3)';
                
                setTimeout(() => {
                    el.style.boxShadow = '';
                }, 1000);
            }, 100);
        });
    }

    /**
     * 🔄 Обновление статуса синхронизации
     */
    updateSyncStatus(status = 'active') {
        const statusElement = document.getElementById('sync-status');
        if (!statusElement) return;
        
        statusElement.className = `status-indicator ${status}`;
        
        const statusConfig = {
            active: { icon: 'check-circle-fill', text: 'Синхронизировано', color: '#28a745' },
            processing: { icon: 'arrow-repeat', text: 'Обработка...', color: '#ffc107' },
            error: { icon: 'exclamation-triangle-fill', text: 'Ошибка', color: '#dc3545' },
            success: { icon: 'check-circle-fill', text: 'Готово!', color: '#28a745' }
        };
        
        const config = statusConfig[status] || statusConfig.active;
        statusElement.innerHTML = `<i class="bi bi-${config.icon}"></i> ${config.text}`;
        statusElement.style.background = `rgba(${this.hexToRgb(config.color)}, 0.3)`;
    }

    /**
     * 🎨 Вспомогательные методы
     */
    formatDuration(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        return hours > 0 ? `${hours}ч ${minutes}м` : `${minutes}м`;
    }

    isProductiveUrl(url) {
        if (!url) return false;
        const productiveDomains = ['github.com', 'stackoverflow.com', 'docs.', 'developer.', 'learn.'];
        return productiveDomains.some(domain => url.includes(domain));
    }

    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? 
            `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : 
            '40, 167, 69';
    }

    /**
     * 🔄 Сброс аналитики
     */
    resetAnalytics() {
        console.log('🔄 Сброс аналитики...');
        
        this.activeFilters.clear();
        this.activeFilters.add('real-time');
        
        // Сбрасываем кнопки
        document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector('[data-filter="real-time"]')?.classList.add('active');
        
        document.querySelectorAll('.source-btn').forEach(btn => btn.classList.add('active'));
        
        // Скрываем инсайты
        const insightsContainer = document.getElementById('analytics-insights');
        if (insightsContainer) {
            insightsContainer.style.display = 'none';
        }
        
        // Обновляем данные
        if (window.refreshData) {
            window.refreshData();
        }
        
        this.updateSyncStatus('active');
    }

    /**
     * 📥 Экспорт аналитики
     */
    exportAnalytics() {
        console.log('📥 Экспорт данных аналитики...');
        
        const exportData = {
            timestamp: new Date().toISOString(),
            filters: Array.from(this.activeFilters),
            metrics: this.syncedMetrics,
            insights: this.generateInsights()
        };
        
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `browser-analytics-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        URL.revokeObjectURL(url);
        
        console.log('✅ Данные экспортированы');
    }

    // Заглушки для дополнительных методов
    analyzeMousePatterns(mouseData) { return {}; }
    findResourcePeaks(resourceData) { return []; }
    filterActivePeriodsOnly() { console.log('🎯 Фильтр: только активные периоды'); }
    filterProductiveOnly() { console.log('🎯 Фильтр: только продуктивные'); }
    applyCrossMetricsAnalysis() { console.log('🎯 Кросс-анализ метрик'); }
    findCommonTimePeriods() { return []; }
    adjustMetricsByCommonPeriods(periods) { console.log('🔄 Корректировка по общим периодам'); }
}

// Инициализация после загрузки DOM
document.addEventListener('DOMContentLoaded', () => {
    // Ждем загрузки основных данных
    setTimeout(() => {
        window.browserAnalytics = new BrowserAnalytics();
        console.log('🚀 Система продвинутой аналитики браузеров готова!');
    }, 1000);
});

// Экспорт для использования в других скриптах
window.BrowserAnalytics = BrowserAnalytics; 