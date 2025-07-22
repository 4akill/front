// 3D Charts - Современные 3D графики для аналитики
// Использует ApexCharts, Three.js и D3.js для создания красивых визуализаций

// Глобальные переменные для 3D графиков
let timeline3DChart = null;
let activity3DChart = null;

// Создание 3D временной шкалы
function create3DTimelineChart(data) {
    const container = document.getElementById('timeline-3d-chart');
    if (!container) return;

    // Очищаем предыдущий график
    container.innerHTML = '';
    
    if (!data || data.length === 0) {
        container.innerHTML = `
            <div class="d-flex align-items-center justify-content-center h-100">
                <div class="text-center">
                    <i class="fas fa-chart-bar fa-3x text-muted mb-3"></i>
                    <h5 class="text-muted">Нет данных для отображения</h5>
                    <p class="text-muted">Загрузите данные для создания 3D визуализации</p>
                </div>
            </div>
        `;
        return;
    }

    // Группируем данные по часам для 3D визуализации
    const hourlyData = groupDataForChart(data);
    
    // Создаем 3D столбчатый график с ApexCharts
    const options = {
        series: [{
            name: 'Активное время',
            data: hourlyData.activeTime,
            color: '#00E396'
        }, {
            name: 'Нейтральное время', 
            data: hourlyData.neutralTime,
            color: '#FEB019'
        }, {
            name: 'Неактивное время',
            data: hourlyData.inactiveTime,
            color: '#FF4560'
        }],
        chart: {
            type: 'bar',
            height: 350,
            background: 'transparent',
            animations: {
                enabled: true,
                easing: 'easeinout',
                speed: 800,
                animateGradually: {
                    enabled: true,
                    delay: 150
                },
                dynamicAnimation: {
                    enabled: true,
                    speed: 350
                }
            },
            toolbar: {
                show: true,
                tools: {
                    download: true,
                    selection: true,
                    zoom: true,
                    zoomin: true,
                    zoomout: true,
                    pan: true,
                    reset: true
                }
            }
        },
        plotOptions: {
            bar: {
                horizontal: false,
                columnWidth: '70%',
                endingShape: 'rounded',
                borderRadius: 8,
                dataLabels: {
                    position: 'top'
                }
            }
        },
        dataLabels: {
            enabled: true,
            formatter: function(val) {
                return formatDurationCorrectly(val);
            },
            offsetY: -20,
            style: {
                fontSize: '10px',
                colors: ['#304758'],
                fontWeight: 'bold'
            }
        },
        stroke: {
            show: true,
            width: 2,
            colors: ['transparent']
        },
        xaxis: {
            categories: hourlyData.hours,
            title: {
                text: 'Время (часы)',
                style: {
                    color: '#666',
                    fontSize: '14px',
                    fontWeight: 'bold'
                }
            },
            labels: {
                style: {
                    colors: '#666',
                    fontSize: '12px'
                }
            }
        },
        yaxis: {
            title: {
                text: 'Время активности (секунды)',
                style: {
                    color: '#666',
                    fontSize: '14px',
                    fontWeight: 'bold'
                }
            },
            labels: {
                formatter: function(val) {
                    return formatDurationCorrectly(val);
                },
                style: {
                    colors: '#666',
                    fontSize: '12px'
                }
            }
        },
        fill: {
            type: 'gradient',
            gradient: {
                shade: 'light',
                type: 'vertical',
                shadeIntensity: 0.3,
                gradientToColors: ['#00E396', '#FEB019', '#FF4560'],
                inverseColors: false,
                opacityFrom: 0.9,
                opacityTo: 0.6,
                stops: [0, 100]
            }
        },
        tooltip: {
            theme: 'dark',
            y: {
                formatter: function(val, { series, seriesIndex, dataPointIndex, w }) {
                    return formatDurationCorrectly(val);
                }
            },
            style: {
                fontSize: '12px'
            }
        },
        legend: {
            position: 'top',
            horizontalAlign: 'center',
            floating: false,
            fontSize: '13px',
            fontWeight: 'bold',
            markers: {
                width: 12,
                height: 12,
                radius: 6
            }
        },
        grid: {
            borderColor: 'rgba(255,255,255,0.1)',
            strokeDashArray: 3,
            xaxis: {
                lines: {
                    show: true
                }
            },
            yaxis: {
                lines: {
                    show: true
                }
            }
        },
        theme: {
            mode: 'light',
            palette: 'palette1'
        }
    };

    timeline3DChart = new ApexCharts(container, options);
    timeline3DChart.render();
    
    console.log('3D Timeline chart создан:', hourlyData);
}

// Создание 3D графика активности
function create3DActivityChart(data) {
    const container = document.getElementById('activity-3d-chart');
    if (!container) return;

    container.innerHTML = '';
    
    if (!data || data.length === 0) {
        container.innerHTML = `
            <div class="d-flex align-items-center justify-content-center h-100">
                <div class="text-center">
                    <i class="fas fa-chart-pie fa-3x text-muted mb-3"></i>
                    <h5 class="text-muted">Нет данных активности</h5>
                    <p class="text-muted">Примените фильтры для отображения данных</p>
                </div>
            </div>
        `;
        return;
    }

    // Создаем данные для круговой диаграммы активности
    const activityData = processActivityData(data);
    
    const options = {
        series: activityData.values,
        chart: {
            type: 'donut',
            height: 400,
            background: 'transparent',
            animations: {
                enabled: true,
                easing: 'easeinout',
                speed: 800,
                animateGradually: {
                    enabled: true,
                    delay: 150
                }
            }
        },
        labels: activityData.labels,
        colors: ['#00E396', '#FEB019', '#FF4560', '#775DD0', '#546E7A'],
        fill: {
            type: 'gradient',
            gradient: {
                shade: 'dark',
                type: 'radial',
                shadeIntensity: 0.4,
                gradientToColors: ['#4CAF50', '#FF9800', '#F44336', '#9C27B0', '#607D8B'],
                inverseColors: false,
                opacityFrom: 1,
                opacityTo: 0.8,
                stops: [0, 100]
            }
        },
        plotOptions: {
            pie: {
                donut: {
                    size: '70%',
                    labels: {
                        show: true,
                        name: {
                            show: true,
                            fontSize: '16px',
                            fontWeight: 'bold',
                            color: '#333'
                        },
                        value: {
                            show: true,
                            fontSize: '20px',
                            fontWeight: 'bold',
                            color: '#333',
                            formatter: function(val) {
                                return formatDurationCorrectly(val);
                            }
                        },
                        total: {
                            show: true,
                            showAlways: true,
                            label: 'Общее время',
                            fontSize: '14px',
                            fontWeight: 'bold',
                            color: '#666',
                            formatter: function(w) {
                                const total = w.globals.seriesTotals.reduce((a, b) => a + b, 0);
                                return formatDurationCorrectly(total);
                            }
                        }
                    }
                }
            }
        },
        dataLabels: {
            enabled: true,
            formatter: function(val, opts) {
                return Math.round(val) + '%';
            },
            style: {
                fontSize: '12px',
                fontWeight: 'bold',
                colors: ['#fff']
            },
            background: {
                enabled: true,
                foreColor: '#fff',
                borderRadius: 4,
                padding: 4,
                opacity: 0.8
            }
        },
        tooltip: {
            theme: 'dark',
            y: {
                formatter: function(val) {
                    return formatDurationCorrectly(val);
                }
            }
        },
        legend: {
            position: 'bottom',
            horizontalAlign: 'center',
            fontSize: '13px',
            fontWeight: 'bold',
            markers: {
                width: 12,
                height: 12,
                radius: 6
            }
        },
        responsive: [{
            breakpoint: 768,
            options: {
                chart: {
                    height: 300
                },
                legend: {
                    position: 'bottom'
                }
            }
        }]
    };

    activity3DChart = new ApexCharts(container, options);
    activity3DChart.render();
    
    console.log('3D Activity chart создан:', activityData);
}

// Группировка данных для графика временной шкалы
function groupDataForChart(data) {
    const hourlyGroups = {};
    
    // Инициализируем все часы
    for (let h = 0; h < 24; h++) {
        const hour = h.toString().padStart(2, '0') + ':00';
        hourlyGroups[hour] = {
            activeTime: 0,
            neutralTime: 0,
            inactiveTime: 0
        };
    }
    
    data.forEach(window => {
        let startTime;
        
        if (window.start_time) {
            startTime = new Date(window.start_time);
        } else if (window.timestamp) {
            startTime = new Date(window.timestamp);
        } else {
            startTime = new Date();
        }
        
        if (isNaN(startTime.getTime())) {
            startTime = new Date();
        }
        
        const hour = startTime.getHours().toString().padStart(2, '0') + ':00';
        
        // Рассчитываем длительность
        let duration = 0;
        if (window.start_time && window.end_time) {
            const endTime = new Date(window.end_time);
            if (!isNaN(endTime.getTime())) {
                duration = Math.max(0, (endTime - startTime) / 1000);
            }
        } else if (window.duration) {
            duration = parseFloat(window.duration);
            if (duration > 86400) duration = duration / 1000; // Конвертируем из мс
        } else {
            duration = 60; // По умолчанию 1 минута
        }
        
        if (isNaN(duration) || duration <= 0) duration = 60;
        if (duration > 28800) duration = 28800; // Максимум 8 часов
        
        // Определяем тип активности
        const activityType = determineActivityType(window);
        
        if (hourlyGroups[hour]) {
            hourlyGroups[hour][activityType] += duration;
        }
    });
    
    const hours = Object.keys(hourlyGroups).sort();
    const activeTime = hours.map(h => Math.round(hourlyGroups[h].activeTime));
    const neutralTime = hours.map(h => Math.round(hourlyGroups[h].neutralTime));
    const inactiveTime = hours.map(h => Math.round(hourlyGroups[h].inactiveTime));
    
    return {
        hours,
        activeTime,
        neutralTime,
        inactiveTime
    };
}

// Обработка данных активности для круговой диаграммы
function processActivityData(data) {
    const activityTypes = {
        'Разработка': 0,
        'Браузер': 0,
        'Офис': 0,
        'Система': 0,
        'Другое': 0
    };
    
    data.forEach(window => {
        let duration = 0;
        
        if (window.start_time && window.end_time) {
            const startTime = new Date(window.start_time);
            const endTime = new Date(window.end_time);
            if (!isNaN(startTime.getTime()) && !isNaN(endTime.getTime())) {
                duration = Math.max(0, (endTime - startTime) / 1000);
            }
        } else if (window.duration) {
            duration = parseFloat(window.duration);
            if (duration > 86400) duration = duration / 1000;
        } else {
            duration = 60;
        }
        
        if (isNaN(duration) || duration <= 0) duration = 60;
        if (duration > 28800) duration = 28800;
        
        const processName = (window.process_name || '').toLowerCase();
        
        if (processName.includes('code') || processName.includes('studio') || 
            processName.includes('intellij') || processName.includes('cursor')) {
            activityTypes['Разработка'] += duration;
        } else if (processName.includes('chrome') || processName.includes('firefox') || 
                   processName.includes('edge') || processName.includes('safari')) {
            activityTypes['Браузер'] += duration;
        } else if (processName.includes('excel') || processName.includes('word') || 
                   processName.includes('powerpoint') || processName.includes('outlook')) {
            activityTypes['Офис'] += duration;
        } else if (processName.includes('explorer') || processName.includes('dwm') || 
                   processName.includes('system')) {
            activityTypes['Система'] += duration;
        } else {
            activityTypes['Другое'] += duration;
        }
    });
    
    const labels = Object.keys(activityTypes).filter(key => activityTypes[key] > 0);
    const values = labels.map(label => Math.round(activityTypes[label]));
    
    return { labels, values };
}

// Определение типа активности для временной шкалы
function determineActivityType(window) {
    const processName = (window.process_name || '').toLowerCase();
    
    if (processName.includes('code') || processName.includes('studio') || 
        processName.includes('intellij') || processName.includes('cursor')) {
        return 'activeTime';
    } else if (processName.includes('chrome') || processName.includes('firefox') || 
               processName.includes('edge') || processName.includes('safari')) {
        return 'neutralTime';
    } else {
        return 'inactiveTime';
    }
}

// Экспорт функций
window.create3DTimelineChart = create3DTimelineChart;
window.create3DActivityChart = create3DActivityChart;

console.log('3D Charts модуль загружен'); 