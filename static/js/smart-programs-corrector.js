/**
 * Smart Programs Activity Corrector
 * Умный корректор времени активности программ
 * Версия: 2.1
 * Дата: 2025-01-27
 * Автор: AI Assistant
 * Назначение: Корректирует ТОЛЬКО отображение времени в таблице "Программы", НЕ влияя на основные метрики
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('🛠️ Инициализация умного корректора времени программ v2.1 (только для таблицы)');
    
    // Константы для определения фоновых процессов
    const BACKGROUND_PROCESSES = [
        'NVIDIA Overlay.exe', 'NVIDIA GeForce Overlay', 'TextInputHost.exe', 'RdClient.Windows.exe',
        'Video.UI.exe', 'Кино и ТВ', 'Y.Music.exe', 'SystemSettings.exe', 'GameCenter.exe',
        'dwm.exe', 'explorer.exe', 'winlogon.exe', 'csrss.exe', 'wininit.exe', 'services.exe',
        'lsass.exe', 'svchost.exe', 'RuntimeBroker.exe', 'ApplicationFrameHost.exe',
        'ShellExperienceHost.exe', 'StartMenuExperienceHost.exe', 'SearchUI.exe', 'Taskmgr.exe',
        'MsMpEng.exe', 'SecurityHealthSystray.exe', 'WinStore.App.exe', 'Microsoft.Photos.exe',
        'Calculator.exe', 'CalculatorApp.exe'
    ];
    
    // Функция для определения фонового процесса
    function isBackgroundProcess(appName) {
        if (!appName) return false;
        const appNameLower = appName.toLowerCase();
        return BACKGROUND_PROCESSES.some(bg => {
            const bgLower = bg.toLowerCase();
            return appNameLower === bgLower || 
                   appNameLower.includes(bgLower) || 
                   bgLower.includes(appNameLower) ||
                   (appNameLower.includes('nvidia') && bgLower.includes('nvidia')) ||
                   (appNameLower.includes('video') && bgLower.includes('video')) ||
                   (appNameLower.includes('кино') && bgLower.includes('кино')) ||
                   (appNameLower.includes('overlay') && bgLower.includes('overlay')) ||
                   (appNameLower.includes('calculator') && bgLower.includes('calculator')) ||
                   (appNameLower.includes('taskmgr') && bgLower.includes('taskmgr'));
        });
    }
    
    // Функция коррекции ТОЛЬКО для таблицы программ
    function correctProgramsTableData(programsData) {
        console.log('🔧 Коррекция данных ТОЛЬКО для таблицы программ (основные метрики НЕ затрагиваются)');
        
        if (!programsData || programsData.length === 0) {
            return programsData;
        }
        
        const correctedPrograms = programsData.map(program => {
            const appName = program.app_name || program.application || '';
            
            // Исключаем или сильно урезаем фоновые процессы в ТАБЛИЦЕ
            if (isBackgroundProcess(appName)) {
                // Сильно урезаем время для фоновых процессов в таблице
                const reducedDuration = Math.min(program.duration * 0.05, 60); // максимум 1 минута
                console.log(`🚫 Фоновый процесс в таблице: ${appName} - урезано с ${Math.floor(program.duration/60)}м до ${Math.floor(reducedDuration/60)}м`);
                
                return {
                    ...program,
                    duration: reducedDuration,
                    is_background_reduced: true
                };
            }
            
            // Для обычных программ оставляем как есть
            return program;
        }).filter(program => program.duration > 30); // Убираем программы с временем меньше 30 секунд
        
        // Сортируем по времени активности
        correctedPrograms.sort((a, b) => b.duration - a.duration);
        
        console.log(`✅ Скорректирована таблица программ: ${correctedPrograms.length} программ`);
        return correctedPrograms;
    }
    
    // ВАЖНО: НЕ переопределяем processProgramActivity - оставляем основную логику нетронутой!
    // Переопределяем ТОЛЬКО updateProgramsActivityTable для коррекции отображения
    if (typeof window.updateProgramsActivityTable === 'function') {
        const originalUpdateProgramsActivityTable = window.updateProgramsActivityTable;
        
        window.updateProgramsActivityTable = function(programsData) {
            console.log('🔄 Перехват updateProgramsActivityTable ТОЛЬКО для коррекции отображения таблицы');
            
            // Применяем коррекцию ТОЛЬКО к данным для отображения в таблице
            const correctedTableData = correctProgramsTableData(programsData);
            
            // Вызываем оригинальную функцию с скорректированными данными для таблицы
            return originalUpdateProgramsActivityTable.call(this, correctedTableData);
        };
        
        console.log('✅ Функция updateProgramsActivityTable настроена для коррекции ТОЛЬКО таблицы программ');
    }
    
    console.log('🎯 Модуль инициализирован: корректирует ТОЛЬКО таблицу программ, основные метрики остаются нетронутыми');
});

// Экспортируем для глобального использования
if (typeof window !== 'undefined') {
    window.smartProgramsCorrector = {
        version: '2.1',
        initialized: true,
        tableOnlyCorrection: true, // Подчеркиваем что корректируем только таблицу
        mainMetricsUntouched: true // Основные метрики не затрагиваются
    };
} 