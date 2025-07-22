/**
 * Smart Time Formatter Module
 * Модуль улучшенного форматирования времени
 * Версия: 1.0
 * Дата: 2025-01-27
 * Автор: AI Assistant
 */

// Улучшенная функция для форматирования длительности
function formatDurationSmart(seconds) {
    console.log('🕒 Форматируем время:', seconds);
    
    // Проверяем на корректность входных данных
    if (seconds === null || seconds === undefined || isNaN(seconds) || seconds < 0) {
        return '0с';
    }
    
    // Преобразуем в число и округляем до целого
    const totalSeconds = Math.round(Number(seconds));
    
    if (totalSeconds === 0) {
        return '0с';
    }
    
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const remainingSeconds = totalSeconds % 60;
    
    const parts = [];
    
    if (hours > 0) {
        parts.push(`${hours}ч`);
    }
    if (minutes > 0) {
        parts.push(`${minutes}м`);
    }
    if (remainingSeconds > 0 || parts.length === 0) {
        parts.push(`${remainingSeconds}с`);
    }
    
    const result = parts.join(' ');
    console.log('✅ Время отформатировано:', result);
    return result;
}

// Улучшенная функция обработки активности в папках
function processFolderActivitySmart(windowData) {
    console.log('📁 Обрабатываем активность в папках (улучшенная версия)');
    const folderStats = {};

    windowData.forEach(item => {
        const windowTitle = item.window_title || '';
        const appName = (item.app_name || '').toLowerCase();
        
        // Обрабатываем только активность в проводнике и файловых менеджерах
        const isFileManager = appName.includes('explorer') || 
                             appName.includes('totalcmd') || 
                             appName.includes('winrar') || 
                             appName.includes('7z') ||
                             windowTitle.includes('\\') ||
                             windowTitle.match(/[A-Z]:\\/);
        
        if (!isFileManager) {
            return;
        }
        
        let folderPath = null;
        
        // Различные способы извлечения пути папки
        if (windowTitle.includes(' - ')) {
            // Формат "Filename - Folder"
            const parts = windowTitle.split(' - ');
            if (parts.length >= 2) {
                const pathPart = parts[parts.length - 1];
                if (pathPart.match(/[A-Z]:\\/)) {
                    folderPath = pathPart;
                }
            }
        }
        
        // Прямое извлечение пути из заголовка
        if (!folderPath) {
            const pathMatch = windowTitle.match(/([A-Z]:\\[^"<>|?*\n\r]+)/i);
            if (pathMatch) {
                folderPath = pathMatch[1].trim();
            }
        }
        
        // Извлечение из названий типа "Documents (C:\Users\...)"
        if (!folderPath) {
            const bracketMatch = windowTitle.match(/\(([A-Z]:\\[^)]+)\)/i);
            if (bracketMatch) {
                folderPath = bracketMatch[1];
            }
        }
        
        // Если это просто диск
        if (!folderPath && windowTitle.match(/^[A-Z]:\s*$/)) {
            folderPath = windowTitle.trim();
        }
        
        // Поиск по стандартным папкам Windows
        if (!folderPath) {
            const standardFolders = [
                'Документы', 'Documents', 'Загрузки', 'Downloads', 
                'Рабочий стол', 'Desktop', 'Изображения', 'Pictures',
                'Музыка', 'Music', 'Видео', 'Videos'
            ];
            
            for (const folder of standardFolders) {
                if (windowTitle.includes(folder)) {
                    folderPath = folder;
                    break;
                }
            }
        }
        
        if (folderPath) {
            // Нормализуем путь
            folderPath = folderPath.replace(/\/$/, '');
            
            if (!folderStats[folderPath]) {
                folderStats[folderPath] = {
                    folder_path: folderPath,
                    duration: 0,
                    visits: 0
                };
            }
            folderStats[folderPath].duration += item.duration || 0;
            folderStats[folderPath].visits += 1;
            
            console.log(`📂 Обнаружена папка: ${folderPath} (${Math.round((item.duration || 0)/60)}м)`);
        }
    });

    const result = Object.values(folderStats);
    console.log(`✅ Найдено ${result.length} папок с активностью`);
    return result;
}

// Переопределяем существующие функции
if (typeof window !== 'undefined') {
    // Заменяем старую функцию на новую
    const originalFormatDuration = window.formatDuration;
    window.formatDuration = formatDurationSmart;
    window.formatDurationSmart = formatDurationSmart;
    
    const originalProcessFolderActivity = window.processFolderActivity;
    window.processFolderActivity = processFolderActivitySmart;
    window.processFolderActivitySmart = processFolderActivitySmart;
    
    console.log('🔄 Функции форматирования времени и обработки папок обновлены');
} 