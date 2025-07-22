/**
 * Тестирование классификации активности
 * Проверяем почему все время классифицируется как активное
 */

const BACKGROUND_PROCESSES = [
    'NVIDIA Overlay.exe',
    'NVIDIA GeForce Overlay',
    'TextInputHost.exe',
    'RdClient.Windows.exe',
    'Video.UI.exe',
    'Кино и ТВ',
    'Y.Music.exe',
    'SystemSettings.exe',
    'GameCenter.exe',
    'dwm.exe',
    'explorer.exe',
    'winlogon.exe',
    'csrss.exe',
    'wininit.exe',
    'services.exe',
    'lsass.exe',
    'svchost.exe',
    'RuntimeBroker.exe',
    'ApplicationFrameHost.exe',
    'ShellExperienceHost.exe',
    'StartMenuExperienceHost.exe',
    'SearchUI.exe',
    'Taskmgr.exe',
    'MsMpEng.exe',
    'SecurityHealthSystray.exe',
    'WinStore.App.exe',
    'Microsoft.Photos.exe',
    'Calculator.exe'
];

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
               (appNameLower.includes('overlay') && bgLower.includes('overlay'));
    });
}

// Тестовые данные приложений
const testApps = [
    'Cursor.exe',
    'msedge.exe', 
    'WorClient.exe',
    'GameCenter.exe',
    'Y.Music.exe',
    'NVIDIA Overlay.exe',
    'TextInputHost.exe',
    'explorer.exe',
    'notepad.exe',
    'Calculator.exe',
    'Code.exe',
    'firefox.exe',
    'chrome.exe',
    'brave.exe',
    'Photoshop.exe',
    'Word.exe',
    'Excel.exe',
    'PowerPoint.exe',
    'Slack.exe',
    'Teams.exe',
    'Discord.exe',
    'Spotify.exe',
    'VLC.exe',
    'Steam.exe'
];

console.log('🔍 АНАЛИЗ КЛАССИФИКАЦИИ АКТИВНОСТИ');
console.log('=====================================');

console.log('📱 ТЕСТИРОВАНИЕ КЛАССИФИКАЦИИ ПРИЛОЖЕНИЙ:');
testApps.forEach(app => {
    const isBackground = isBackgroundProcess(app);
    const type = isBackground ? '🔄 ФОН' : '✅ АКТИВНОЕ';
    console.log(`   ${app.padEnd(25)} : ${type}`);
});

console.log('');
console.log('🎯 АНАЛИЗ ПРОБЛЕМЫ:');
console.log('   1. Возможно, в реальных данных нет фоновых процессов');
console.log('   2. Или алгоритм классификации работает неправильно');
console.log('   3. Нужно проверить реальные данные из API');

// Функция для анализа реальных данных
async function analyzeRealData() {
    try {
        console.log('');
        console.log('🌐 ЗАПРОС РЕАЛЬНЫХ ДАННЫХ ИЗ API...');
        
        // Пробуем получить данные за 2025-07-15
        const response = await fetch('/api/public/activity/windows?start_date=2025-07-15&end_date=2025-07-15');
        
        if (!response.ok) {
            console.error(`❌ HTTP ошибка: ${response.status}`);
            return;
        }
        
        const data = await response.json();
        console.log(`📊 Получено ${data.length} записей из API`);
        
        // Анализируем приложения
        const appStats = {};
        let totalDuration = 0;
        let backgroundDuration = 0;
        let activeDuration = 0;
        
        data.forEach(record => {
            const appName = record.app_name || record.application || 'Unknown';
            const duration = parseInt(record.duration) || 0;
            const isBackground = isBackgroundProcess(appName);
            
            if (duration > 0) {
                totalDuration += duration;
                
                if (isBackground) {
                    backgroundDuration += duration;
                } else {
                    activeDuration += duration;
                }
                
                if (!appStats[appName]) {
                    appStats[appName] = {
                        count: 0,
                        totalDuration: 0,
                        isBackground: isBackground
                    };
                }
                appStats[appName].count++;
                appStats[appName].totalDuration += duration;
            }
        });
        
        console.log('');
        console.log('📊 СТАТИСТИКА ПО ТИПАМ ПРИЛОЖЕНИЙ:');
        console.log(`   📈 Общее время: ${totalDuration}с = ${Math.round(totalDuration/60)}м`);
        console.log(`   ✅ Активное время: ${activeDuration}с = ${Math.round(activeDuration/60)}м`);
        console.log(`   🔄 Фоновое время: ${backgroundDuration}с = ${Math.round(backgroundDuration/60)}м`);
        console.log(`   📊 Активное: ${Math.round((activeDuration/totalDuration)*100)}%`);
        console.log(`   📊 Фоновое: ${Math.round((backgroundDuration/totalDuration)*100)}%`);
        
        console.log('');
        console.log('📱 ТОП ПРИЛОЖЕНИЙ ПО ВРЕМЕНИ:');
        Object.entries(appStats)
            .sort(([,a], [,b]) => b.totalDuration - a.totalDuration)
            .slice(0, 10)
            .forEach(([appName, stats], index) => {
                const type = stats.isBackground ? '🔄 ФОН' : '✅ АКТИВНОЕ';
                const minutes = Math.round(stats.totalDuration / 60);
                console.log(`   ${(index+1).toString().padStart(2)}. ${appName.padEnd(25)} : ${stats.totalDuration.toString().padStart(4)}с (${minutes}м) ${type}`);
            });
        
        console.log('');
        console.log('🔍 ФОНОВЫЕ ПРОЦЕССЫ В ДАННЫХ:');
        const backgroundApps = Object.entries(appStats)
            .filter(([, stats]) => stats.isBackground)
            .sort(([,a], [,b]) => b.totalDuration - a.totalDuration);
            
        if (backgroundApps.length === 0) {
            console.log('   ❌ НЕТ ФОНОВЫХ ПРОЦЕССОВ В ДАННЫХ!');
            console.log('   🎯 ЭТО ОБЪЯСНЯЕТ ПОЧЕМУ ВСЕ ВРЕМЯ АКТИВНОЕ');
        } else {
            backgroundApps.forEach(([appName, stats]) => {
                const minutes = Math.round(stats.totalDuration / 60);
                console.log(`   🔄 ${appName}: ${stats.totalDuration}с (${minutes}м)`);
            });
        }
        
        console.log('');
        console.log('💡 РЕКОМЕНДАЦИИ:');
        if (backgroundApps.length === 0) {
            console.log('   1. В данных нет фоновых процессов');
            console.log('   2. Нужно добавить более точную классификацию');
            console.log('   3. Или использовать данные мышиной активности');
        } else {
            console.log('   1. Фоновые процессы найдены');
            console.log('   2. Алгоритм классификации работает');
            console.log('   3. Проверьте логику в updateMainMetricsWithRealActivity');
        }
        
    } catch (error) {
        console.error('❌ Ошибка при анализе данных:', error);
    }
}

// Экспортируем функцию для использования в браузере
if (typeof window !== 'undefined') {
    window.analyzeRealData = analyzeRealData;
}

// Если запускаем в Node.js
if (typeof module !== 'undefined') {
    module.exports = { analyzeRealData, isBackgroundProcess };
} 