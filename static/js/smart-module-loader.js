/**
 * УМНЫЙ ЗАГРУЗЧИК МОДУЛЕЙ
 * Автор: AI Assistant  
 * Дата: 2025-01-22
 * Версия: 1.0
 * Назначение: Обеспечивает правильный порядок загрузки модулей и предотвращает конфликты
 */

(function() {
    'use strict';
    
    console.log('🚀 Инициализация умного загрузчика модулей...');
    
    // ==================== КОНФИГУРАЦИЯ ЗАГРУЗКИ ====================
    
    const MODULE_CONFIG = {
        // Критический порядок загрузки модулей
        loadOrder: [
            'smart-system-fix.js',           // 1. Сначала системный фикс
            'smart-time-calculator.js',      // 2. Умный калькулятор времени
            'smart-time-precision-fix.js',   // 3. Точный калькулятор
            'smart-time-filter-fix.js',      // 4. Фиксы фильтрации
            'smart-time-formatter.js',       // 5. Форматирование времени
            'time-precision-patch.js',       // 6. Патчи точности (если нужны)
            'smart-time-filter-patch.js'     // 7. Патчи фильтрации (если нужны)
        ],
        
        // Модули которые можно загружать параллельно после основных
        parallelModules: [
            'smart-gpu-metrics.js',
            'smart-keyboard-metrics.js', 
            'smart-network-metrics.js',
            'smart-network-monitor.js',
            'smart-screenshots.js',
            'browser-analytics.js',
            'window-focus-analyzer.js',
            'human-focus-analyzer.js',      // Анализатор человеческого фокуса
            'focus-integration.js'          // Интеграция фокуса
        ],
        
        // Опциональные модули
        optionalModules: [
            'smart-chronology-fix.js',
            'smart-chronology2-fix.js',
            'smart-spoiler-analyzer.js',
            'smart-programs-corrector.js',
            '3d-charts.js',
            'scroll-to-top.js'
        ]
    };
    
    // ==================== СОСТОЯНИЕ ЗАГРУЗКИ ====================
    
    class ModuleLoader {
        constructor() {
            this.loadedModules = new Set();
            this.failedModules = new Set();
            this.loadingPromises = new Map();
            this.isSystemFixLoaded = false;
            this.dependencyWaitlist = new Map();
        }
        
        // Проверка что модуль уже загружен
        isModuleLoaded(moduleName) {
            return this.loadedModules.has(moduleName) || this.isModuleInDOM(moduleName);
        }
        
        // Проверка наличия модуля в DOM
        isModuleInDOM(moduleName) {
            const scripts = document.querySelectorAll('script[src]');
            return Array.from(scripts).some(script => 
                script.src.includes(moduleName)
            );
        }
        
        // Загрузка одного модуля
        async loadModule(moduleName, isOptional = false) {
            // Если уже загружается, возвращаем существующий промис
            if (this.loadingPromises.has(moduleName)) {
                return this.loadingPromises.get(moduleName);
            }
            
            // Если уже загружен, возвращаем успех
            if (this.isModuleLoaded(moduleName)) {
                console.log(`✅ [ЗАГРУЗЧИК] Модуль ${moduleName} уже загружен`);
                return Promise.resolve();
            }
            
            console.log(`📦 [ЗАГРУЗЧИК] Загружаем модуль: ${moduleName}`);
            
            const loadPromise = new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = `/static/js/${moduleName}`;
                script.type = 'text/javascript';
                
                script.onload = () => {
                    console.log(`✅ [ЗАГРУЗЧИК] Модуль ${moduleName} загружен успешно`);
                    this.loadedModules.add(moduleName);
                    
                    // Специальная обработка для системного фикса
                    if (moduleName === 'smart-system-fix.js') {
                        this.isSystemFixLoaded = true;
                        this.processDependencyWaitlist();
                    }
                    
                    resolve();
                };
                
                script.onerror = (error) => {
                    const message = `❌ [ЗАГРУЗЧИК] Ошибка загрузки ${moduleName}`;
                    console.error(message, error);
                    this.failedModules.add(moduleName);
                    
                    if (isOptional) {
                        console.log(`⚠️ [ЗАГРУЗЧИК] Опциональный модуль ${moduleName} пропущен`);
                        resolve(); // Опциональные модули не блокируют загрузку
                    } else {
                        reject(new Error(message));
                    }
                };
                
                document.head.appendChild(script);
            });
            
            this.loadingPromises.set(moduleName, loadPromise);
            return loadPromise;
        }
        
        // Загрузка модулей в правильном порядке
        async loadCoreModules() {
            console.log('🔧 [ЗАГРУЗЧИК] Загружаем основные модули в правильном порядке...');
            
            for (const moduleName of MODULE_CONFIG.loadOrder) {
                try {
                    await this.loadModule(moduleName);
                    
                    // Даем время модулю на инициализацию
                    await this.waitForModuleInit(moduleName);
                    
                } catch (error) {
                    console.error(`❌ [ЗАГРУЗЧИК] Критическая ошибка при загрузке ${moduleName}:`, error);
                    
                    // Для критически важных модулей останавливаем загрузку
                    if (['smart-system-fix.js', 'smart-time-calculator.js'].includes(moduleName)) {
                        throw error;
                    }
                }
            }
            
            console.log('✅ [ЗАГРУЗЧИК] Основные модули загружены');
        }
        
        // Загрузка параллельных модулей
        async loadParallelModules() {
            console.log('⚡ [ЗАГРУЗЧИК] Загружаем параллельные модули...');
            
            const promises = MODULE_CONFIG.parallelModules.map(moduleName => 
                this.loadModule(moduleName, true) // true = optional
            );
            
            await Promise.allSettled(promises);
            console.log('✅ [ЗАГРУЗЧИК] Параллельные модули обработаны');
        }
        
        // Загрузка опциональных модулей
        async loadOptionalModules() {
            console.log('🎯 [ЗАГРУЗЧИК] Загружаем опциональные модули...');
            
            const promises = MODULE_CONFIG.optionalModules.map(moduleName => 
                this.loadModule(moduleName, true)
            );
            
            await Promise.allSettled(promises);
            console.log('✅ [ЗАГРУЗЧИК] Опциональные модули обработаны');
        }
        
        // Ожидание инициализации модуля
        async waitForModuleInit(moduleName) {
            // Специальные проверки для ключевых модулей
            switch (moduleName) {
                case 'smart-system-fix.js':
                    return this.waitForCondition(() => window.systemFixApplied, 1000);
                    
                case 'smart-time-calculator.js':
                    return this.waitForCondition(() => window.updateMainMetricsWithRealActivity, 1000);
                    
                case 'smart-time-precision-fix.js':
                    return this.waitForCondition(() => window.updateMainMetricsWithRealActivityPrecise, 1000);
                    
                default:
                    // Небольшая задержка для обычных модулей
                    return new Promise(resolve => setTimeout(resolve, 50));
            }
        }
        
        // Ожидание выполнения условия
        async waitForCondition(condition, timeout = 5000) {
            const startTime = Date.now();
            
            while (Date.now() - startTime < timeout) {
                if (condition()) {
                    return true;
                }
                await new Promise(resolve => setTimeout(resolve, 10));
            }
            
            console.warn(`⚠️ [ЗАГРУЗЧИК] Таймаут ожидания условия (${timeout}мс)`);
            return false;
        }
        
        // Обработка списка ожидания зависимостей
        processDependencyWaitlist() {
            if (!this.isSystemFixLoaded) return;
            
            for (const [moduleName, resolve] of this.dependencyWaitlist) {
                console.log(`🔄 [ЗАГРУЗЧИК] Активируем отложенный модуль: ${moduleName}`);
                resolve();
            }
            
            this.dependencyWaitlist.clear();
        }
        
        // Получение статистики загрузки
        getLoadingStats() {
            return {
                loaded: Array.from(this.loadedModules),
                failed: Array.from(this.failedModules),
                loading: Array.from(this.loadingPromises.keys()),
                systemFixLoaded: this.isSystemFixLoaded,
                totalRequested: this.loadedModules.size + this.failedModules.size,
                successRate: this.loadedModules.size / (this.loadedModules.size + this.failedModules.size) * 100
            };
        }
    }
    
    // ==================== ИНИЦИАЛИЗАЦИЯ ====================
    
    const moduleLoader = new ModuleLoader();
    
    // Основная функция загрузки
    async function initializeModules() {
        try {
            console.log('🚀 [ЗАГРУЗЧИК] Начинаем инициализацию модулей...');
            
            // 1. Загружаем основные модули последовательно
            await moduleLoader.loadCoreModules();
            
            // 2. Загружаем параллельные модули
            await moduleLoader.loadParallelModules();
            
            // 3. Загружаем опциональные модули
            await moduleLoader.loadOptionalModules();
            
            // 4. Выводим статистику
            const stats = moduleLoader.getLoadingStats();
            console.log('📊 [ЗАГРУЗЧИК] Статистика загрузки:', stats);
            
            console.log('🎉 [ЗАГРУЗЧИК] Инициализация завершена!');
            
            // Уведомляем другие части системы о готовности
            window.dispatchEvent(new CustomEvent('modulesLoaded', { 
                detail: stats 
            }));
            
        } catch (error) {
            console.error('💥 [ЗАГРУЗЧИК] Критическая ошибка инициализации:', error);
            
            // Попытка аварийного восстановления
            if (!moduleLoader.isSystemFixLoaded) {
                console.log('🚨 [ЗАГРУЗЧИК] Попытка аварийного восстановления...');
                try {
                    await moduleLoader.loadModule('smart-system-fix.js');
                } catch (recoveryError) {
                    console.error('💀 [ЗАГРУЗЧИК] Аварийное восстановление не удалось:', recoveryError);
                }
            }
        }
    }
    
    // ==================== ЭКСПОРТ ====================
    
    window.smartModuleLoader = {
        moduleLoader: moduleLoader,
        initializeModules: initializeModules,
        
        // Дополнительные утилиты
        reloadModule: async function(moduleName) {
            console.log(`🔄 [ЗАГРУЗЧИК] Перезагрузка модуля: ${moduleName}`);
            moduleLoader.loadedModules.delete(moduleName);
            moduleLoader.loadingPromises.delete(moduleName);
            return await moduleLoader.loadModule(moduleName);
        },
        
        getStats: function() {
            return moduleLoader.getLoadingStats();
        },
        
        // Проверка готовности системы
        isSystemReady: function() {
            return moduleLoader.isSystemFixLoaded && 
                   moduleLoader.isModuleLoaded('smart-time-calculator.js');
        }
    };
    
    // ==================== АВТОЗАПУСК ====================
    
    // Запускаем инициализацию когда DOM готов
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeModules);
    } else {
        // DOM уже готов, запускаем сразу
        setTimeout(initializeModules, 10);
    }
    
    console.log('✅ [ЗАГРУЗЧИК] Умный загрузчик модулей инициализирован');
    
})(); 