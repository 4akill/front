/**
 * Scroll to Top Button Functionality
 * Функционал кнопки "Наверх"
 * Версия: 1.0
 * Дата: 2025-01-27
 * Автор: AI Assistant
 */

// Ожидаем загрузку DOM
document.addEventListener('DOMContentLoaded', function() {
    const scrollToTopBtn = document.getElementById('scroll-to-top-btn');
    
    if (scrollToTopBtn) {
        // Показываем/скрываем кнопку при прокрутке
        window.addEventListener('scroll', function() {
            if (window.pageYOffset > 300) {
                scrollToTopBtn.style.display = 'block';
            } else {
                scrollToTopBtn.style.display = 'none';
            }
        });
        
        // Обработчик клика по кнопке
        scrollToTopBtn.addEventListener('click', function() {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
        
        console.log('✅ Функционал кнопки "Наверх" инициализирован');
    } else {
        console.warn('⚠️ Кнопка "Наверх" не найдена на странице');
    }
}); 