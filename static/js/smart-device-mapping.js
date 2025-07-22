/**
 * УМНЫЙ МАППИНГ УСТРОЙСТВ
 * Автор: AI Assistant  
 * Дата: 2025-01-27
 * Версия: v1.0
 * Назначение: Преобразование computer_name в device_id для API запросов
 */

console.log('🔧 [DEVICE MAPPING] Загружается модуль маппинга устройств...');

class SmartDeviceMapping {
    constructor() {
        this.deviceMapping = new Map(); // computer_name -> device_id
        this.deviceInfo = new Map(); // computer_name -> полная информация об устройстве
        this.lastUpdated = null;
        this.updateInterval = 5 * 60 * 1000; // 5 минут
        
        console.log('🔧 [DEVICE MAPPING] Модуль инициализирован');
        
        // Автоматически загружаем маппинг при инициализации
        this.updateDeviceMapping();
        
        // Периодически обновляем маппинг
        setInterval(() => {
            this.updateDeviceMapping();
        }, this.updateInterval);
    }
    
    /**
     * Обновляет маппинг устройств из API
     */
    async updateDeviceMapping() {
        try {
            console.log('🔄 [DEVICE MAPPING] Обновляем маппинг устройств...');
            
            const response = await fetch('/api/devices');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const devices = await response.json();
            console.log(`📊 [DEVICE MAPPING] Получено ${devices.length} устройств`);
            
            // Очищаем старый маппинг
            this.deviceMapping.clear();
            this.deviceInfo.clear();
            
            // Строим новый маппинг
            devices.forEach(device => {
                const computerName = device.computer_name;
                const deviceId = device.device_id;
                
                if (computerName && deviceId) {
                    this.deviceMapping.set(computerName, deviceId);
                    this.deviceInfo.set(computerName, device);
                    
                    console.log(`🔗 [DEVICE MAPPING] ${computerName} -> ${deviceId}`);
                }
            });
            
            this.lastUpdated = new Date();
            console.log(`✅ [DEVICE MAPPING] Маппинг обновлен: ${this.deviceMapping.size} записей`);
            
        } catch (error) {
            console.error('❌ [DEVICE MAPPING] Ошибка обновления маппинга:', error);
        }
    }
    
    /**
     * Преобразует computer_name в device_id для API запроса
     * @param {string} computerName - Имя компьютера
     * @returns {string|null} - device_id или null если не найден
     */
    getDeviceId(computerName) {
        if (!computerName) return null;
        
        const deviceId = this.deviceMapping.get(computerName);
        
        if (deviceId) {
            console.log(`🔍 [DEVICE MAPPING] ${computerName} -> ${deviceId}`);
            return deviceId;
        } else {
            console.warn(`⚠️ [DEVICE MAPPING] Не найден device_id для computer_name: ${computerName}`);
            return computerName; // Возвращаем как есть для обратной совместимости
        }
    }
    
    /**
     * Получает полную информацию об устройстве по computer_name
     * @param {string} computerName - Имя компьютера  
     * @returns {Object|null} - Информация об устройстве или null
     */
    getDeviceInfo(computerName) {
        return this.deviceInfo.get(computerName) || null;
    }
    
    /**
     * Модифицирует параметры API запроса, заменяя computer_name на device_id
     * @param {URLSearchParams} params - Параметры запроса
     * @returns {URLSearchParams} - Модифицированные параметры
     */
    mapApiParams(params) {
        // Ищем параметр device_id
        const deviceParam = params.get('device_id');
        
        if (deviceParam) {
            // Проверяем, не является ли это уже device_id (содержит дефисы/guid)
            const isGuid = deviceParam.includes('-') && deviceParam.length > 10;
            
            if (!isGuid) {
                // Это похоже на computer_name, преобразуем в device_id
                const actualDeviceId = this.getDeviceId(deviceParam);
                if (actualDeviceId && actualDeviceId !== deviceParam) {
                    params.set('device_id', actualDeviceId);
                    console.log(`🔄 [DEVICE MAPPING] API параметр изменен: ${deviceParam} -> ${actualDeviceId}`);
                }
            }
        }
        
        return params;
    }
    
    /**
     * Получает статистику маппинга
     */
    getStats() {
        return {
            totalMappings: this.deviceMapping.size,
            lastUpdated: this.lastUpdated,
            devices: Array.from(this.deviceMapping.entries()).map(([computerName, deviceId]) => ({
                computerName,
                deviceId,
                info: this.deviceInfo.get(computerName)
            }))
        };
    }
}

// Создаем глобальный экземпляр
window.smartDeviceMapping = new SmartDeviceMapping();

// Экспортируем функции для удобства
window.getDeviceIdForAPI = function(computerName) {
    return window.smartDeviceMapping.getDeviceId(computerName);
};

window.mapApiParams = function(params) {
    return window.smartDeviceMapping.mapApiParams(params);
};

// Хелпер функция для модификации fetch запросов
window.fetchWithDeviceMapping = async function(url, options = {}) {
    // Парсим URL и модифицируем параметры если нужно
    const urlObj = new URL(url, window.location.origin);
    const params = new URLSearchParams(urlObj.search);
    
    // Применяем маппинг
    const mappedParams = window.smartDeviceMapping.mapApiParams(params);
    
    // Обновляем URL
    urlObj.search = mappedParams.toString();
    const finalUrl = urlObj.toString();
    
    if (finalUrl !== url) {
        console.log(`🔄 [DEVICE MAPPING] URL изменен: ${url} -> ${finalUrl}`);
    }
    
    return fetch(finalUrl, options);
};

console.log('✅ [DEVICE MAPPING] Модуль загружен и готов к работе');

// Команды для отладки
window.showDeviceMapping = function() {
    const stats = window.smartDeviceMapping.getStats();
    console.log('📊 [DEVICE MAPPING] Статистика маппинга:', stats);
    return stats;
};

console.log('🔧 [DEVICE MAPPING] Для просмотра маппинга используйте: showDeviceMapping()'); 