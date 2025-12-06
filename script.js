// Конфигурация Firebase (замените на свои данные)
const firebaseConfig = {
    apiKey: "AIzaSyDG7SJfMbSiIbTkBxV6BBoPAsTAKQsLPv8",
    authDomain: "flowie-vpn.firebaseapp.com",
    databaseURL: "https://flowie-vpn-default-rtdb.firebaseio.com",
    projectId: "flowie-vpn",
    storageBucket: "flowie-vpn.firebasestorage.app",
    messagingSenderId: "55860525820",
    appId: "1:55860525820:web:75bd65ad5e04064b313579",
    measurementId: "G-P8YJD4HCJ2"
};

// Инициализация приложения
let app, db, auth;
let currentUser = null;
let userPurchases = [];
let userActiveSubscription = null;
let telegramUser = null;
let tg = null;

// CSS для полноэкранного режима Telegram
const fullscreenStyles = `
<style id="telegram-fullscreen-styles">
    .telegram-webapp {
        height: 100vh !important;
        max-height: 100vh !important;
        position: relative !important;  /* Изменено с fixed */
        top: 0 !important;
        left: 0 !important;
        right: 0 !important;
        bottom: 0 !important;
        width: 100% !important;
    }
    
    .telegram-webapp body {
        height: auto !important;  /* Изменено */
        min-height: 100vh !important;
        position: relative !important;
        width: 100%;
        margin: 0 !important;
        padding: 0 !important;
        overflow-y: auto !important;  /* Разрешаем скролл */
        overflow-x: hidden !important;
    }
    
    /* Для iOS */
    @supports (-webkit-touch-callout: none) {
        .telegram-webapp {
            height: -webkit-fill-available !important;
        }
    }
    
    /* Убираем скроллбар у самого WebApp, но оставляем у контента */
    .telegram-webapp::-webkit-scrollbar {
        display: none !important;
    }
    
    /* Стили для кастомного хедера */
    .custom-header {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        height: 60px;
        background: var(--dark-bg);
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 20px;
        z-index: 1000;
        border-bottom: 1px solid var(--card-border);
    }
    
    /* Добавляем padding-top для основного контента */
    .main-content {
        padding-top: 70px; /* Чтобы контент не скрывался под фиксированным хедером */
    }
    
    /* Делаем контент скроллируемым */
    .scrollable-content {
        overflow-y: auto;
        -webkit-overflow-scrolling: touch; /* Для плавного скролла на iOS */
    }
</style>
`;

// Добавляем стили в head
document.head.insertAdjacentHTML('beforeend', fullscreenStyles);

// Функция для принудительного полноэкранного режима
async function forceTelegramFullscreen() {
    if (!window.Telegram?.WebApp) return false;
    
    const tg = window.Telegram.WebApp;
    
    try {
        console.log('Применяем принудительный полноэкранный режим...');
        
        // 1. Добавляем класс для стилей
        document.documentElement.classList.add('telegram-webapp');
        document.body.classList.add('telegram-webapp');
        
        // 2. Расширяем на весь экран (основной метод)
        if (typeof tg.expand === 'function') {
            tg.expand();
            console.log('tg.expand() вызван');
        }
        
        // 3. Скрываем ВСЕ элементы интерфейса Telegram
        if (typeof tg.setHeaderColor === 'function') {
            tg.setHeaderColor('secondary_bg_color');
        }
        
        if (tg.BackButton && typeof tg.BackButton.hide === 'function') {
            tg.BackButton.hide();
        }
        
        if (tg.MainButton && typeof tg.MainButton.hide === 'function') {
            tg.MainButton.hide();
        }
        
        // 4. Отключаем свайпы
        if (typeof tg.enableVerticalSwipes === 'function') {
            tg.enableVerticalSwipes(false);
        }
        
        // 5. Скрываем кнопку настроек (три точки)
        if (typeof tg.showSettings === 'function') {
            try {
                tg.showSettings(false);
            } catch (e) {
                console.log('showSettings не поддерживается');
            }
        }
        
        // 6. Устанавливаем подтверждение закрытия
        if (typeof tg.enableClosingConfirmation === 'function') {
            tg.enableClosingConfirmation();
        }
        
        // 7. Фиксируем размеры
        setTimeout(() => {
            if (tg.viewportHeight) {
                document.body.style.height = `${tg.viewportHeight}px`;
                document.body.style.overflow = 'hidden';
                document.documentElement.style.height = `${tg.viewportHeight}px`;
            }
        }, 100);
        
        // 8. Для iOS дополнительные настройки
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        if (isIOS) {
            // Обновляем viewport meta для iOS
            let meta = document.querySelector('meta[name="viewport"]');
            if (!meta) {
                meta = document.createElement('meta');
                meta.name = 'viewport';
                document.head.appendChild(meta);
            }
            meta.content = 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover';
            
            // Устанавливаем CSS переменные для safe areas
            document.documentElement.style.setProperty('--safe-area-top', 'env(safe-area-inset-top, 0px)');
            document.documentElement.style.setProperty('--safe-area-bottom', 'env(safe-area-inset-bottom, 0px)');
            
            // Фиксируем высоту
            setTimeout(() => {
                const height = window.innerHeight;
                document.body.style.height = `${height}px`;
                document.documentElement.style.height = `${height}px`;
            }, 200);
            
            // Предотвращаем bounce эффект
            document.body.addEventListener('touchmove', function(e) {
                const isScrollable = e.target.closest('.scrollable-content');
                if (!isScrollable) {
                    e.preventDefault();
                }
            }, { passive: false });
        }
        
        console.log('Принудительный полноэкранный режим применен');
        return true;
        
    } catch (error) {
        console.error('Ошибка при применении полноэкранного режима:', error);
        return false;
    }
}

// Функция для многократных попыток применения fullscreen
function applyFullscreenWithRetry() {
    if (!window.Telegram?.WebApp) return;
    
    const tg = window.Telegram.WebApp;
    let attempts = 0;
    const maxAttempts = 10;
    
    const tryFullscreen = () => {
        attempts++;
        
        try {
            // Основные методы
            if (typeof tg.expand === 'function') {
                tg.expand();
            }
            
            if (typeof tg.requestFullscreen === 'function') {
                tg.requestFullscreen();
            }
            
            // Скрываем элементы интерфейса
            if (tg.BackButton) tg.BackButton.hide();
            if (tg.MainButton) tg.MainButton.hide();
            
            // Устанавливаем цвет хедера
            tg.setHeaderColor('secondary_bg_color');
            
            console.log(`Попытка fullscreen #${attempts} выполнена`);
            
        } catch (error) {
            console.warn(`Попытка fullscreen #${attempts} не удалась:`, error);
        }
        
        // Продолжаем попытки
        if (attempts < maxAttempts) {
            setTimeout(tryFullscreen, 300 + (attempts * 100));
        }
    };
    
    // Начинаем попытки
    tryFullscreen();
}

// Обновленная инициализация Telegram WebApp
function initTelegramWebApp() {
    if (!window.Telegram?.WebApp) {
        console.log('Telegram WebApp не найден');
        return;
    }
    
    tg = window.Telegram.WebApp;
    console.log('Telegram WebApp инициализирован:', tg);
    
    // 1. Сразу применяем принудительный fullscreen
    forceTelegramFullscreen();
    
    // 2. Запускаем повторные попытки
    applyFullscreenWithRetry();
    
    // 3. Настраиваем тему
    applyTelegramTheme();
    
    // 4. Подписываемся на изменения темы
    tg.onEvent('themeChanged', applyTelegramTheme);
    
    // 5. Получаем данные пользователя
    telegramUser = tg.initDataUnsafe?.user;
    if (telegramUser) {
        updateUserProfileFromTelegram(telegramUser);
        initTelegramAvatar(telegramUser);
        
        currentUser = {
            telegramUser: telegramUser,
            lastAvatarUpdate: Date.now()
        };
    }
    
    // 6. Кастомизируем UI
    setTimeout(() => {
        customizeTelegramUI();
    }, 200);
    
    // 7. Готовим приложение
    if (tg.ready) {
        tg.ready();
    }
    
    // 8. Обработчик изменения размера окна
    let lastHeight = 0;
    const handleResize = () => {
        const currentHeight = window.innerHeight;
        if (Math.abs(currentHeight - lastHeight) > 50) {
            console.log('Высота окна изменилась, применяем fullscreen');
            forceTelegramFullscreen();
            lastHeight = currentHeight;
        }
    };
    
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', () => {
        setTimeout(() => {
            forceTelegramFullscreen();
        }, 300);
    });
    
    // 9. Обработчик скролла для предотвращения появления нативного UI
    let lastScrollTop = 0;
    window.addEventListener('scroll', () => {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        // Если начался сильный скролл вверх - возможно показывается нативный UI
        if (scrollTop < lastScrollTop - 100) {
            console.log('Обнаружен скролл вверх - проверяем fullscreen');
            setTimeout(() => {
                if (tg.expand) tg.expand();
            }, 50);
        }
        
        lastScrollTop = scrollTop;
    });
}

// Функция для проверки, запущено ли из чата
function isLaunchedFromChat() {
    if (!window.Telegram?.WebApp) return false;
    
    const tg = window.Telegram.WebApp;
    const initData = tg.initData || '';
    const startParam = tg.initDataUnsafe?.start_param;
    
    // Если есть start_param, значит запуск из inline режима
    // Если start_param нет, но есть данные пользователя - возможно из чата
    const hasUserData = !!tg.initDataUnsafe?.user;
    const hasStartParam = !!startParam;
    
    return hasUserData && !hasStartParam;
}

// Обновленная функция customizeTelegramUI
function customizeTelegramUI() {
    if (!window.Telegram?.WebApp) return;
    
    const tg = window.Telegram.WebApp;
    
    // Применяем fullscreen еще раз для надежности
    if (tg.expand) {
        tg.expand();
    }
    
    // Скрываем стандартные кнопки
    tg.BackButton?.hide();
    tg.MainButton?.hide();
    
    // Устанавливаем цвет хедера под фон
    tg.setHeaderColor('secondary_bg_color');
    
    // Отключаем свайпы
    if (tg.enableVerticalSwipes) {
        tg.enableVerticalSwipes(false);
    }
    
    // Скрываем кнопку настроек если доступно
    if (tg.showSettings) {
        try {
            tg.showSettings(false);
        } catch (e) {
            console.log('showSettings не доступен');
        }
    }
    
    // Добавляем кастомный хедер
    addCustomHeader();
    
    // Добавляем плавающую кнопку закрытия
    addFloatingCloseButton();
    
    // Добавляем меню действий
    addCustomActionButtons();
    
    console.log('Telegram UI кастомизирован');
}

// Функция для добавления меню действий
function addCustomActionButtons() {
    const existingMenu = document.querySelector('.custom-action-menu');
    if (existingMenu) return;
    
    const actionMenuHTML = `
        <div class="custom-action-menu" id="actionMenu">
            <button class="action-menu-item" onclick="showSettings()">
                <i class="fas fa-cog"></i>
                <span>Настройки</span>
            </button>
            <button class="action-menu-item" onclick="showProfile()">
                <i class="fas fa-user"></i>
                <span>Профиль</span>
            </button>
            <button class="action-menu-item" onclick="showSupport()">
                <i class="fas fa-headset"></i>
                <span>Поддержка</span>
            </button>
            <button class="action-menu-item" onclick="showAbout()">
                <i class="fas fa-info-circle"></i>
                <span>О приложении</span>
            </button>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', actionMenuHTML);
}

// Функция для закрытия приложения
function closeApp() {
    if (window.Telegram?.WebApp?.close) {
        window.Telegram.WebApp.close();
    } else {
        window.close();
    }
}

// Функция для переключения меню
function toggleMoreMenu() {
    const menu = document.getElementById('actionMenu');
    if (menu) {
        menu.classList.toggle('show');
    }
}

// Функции для пунктов меню
function showSettings() {
    window.location.href = 'settings.html';
    toggleMoreMenu();
}

function showProfile() {
    window.location.href = 'profile.html';
    toggleMoreMenu();
}

function showSupport() {
    if (window.Telegram?.WebApp?.openTelegramLink) {
        window.Telegram.WebApp.openTelegramLink('https://t.me/flowivpn_support');
    }
    toggleMoreMenu();
}

function showAbout() {
    const modalHTML = `
        <div class="modal-overlay active" id="aboutModal">
            <div class="modal-container">
                <div class="modal-header">
                    <h3><i class="fas fa-info-circle"></i> О приложении</h3>
                    <button class="modal-close" onclick="closeModal('aboutModal')">&times;</button>
                </div>
                <div class="modal-body">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <div class="logo-icon" style="width: 80px; height: 80px; margin: 0 auto;">
                            <i class="fas fa-shield-alt" style="font-size: 2rem;"></i>
                        </div>
                    </div>
                    <h4 style="text-align: center; margin-bottom: 10px;">ФЛОУИ VPN</h4>
                    <p style="text-align: center; color: var(--text-secondary); margin-bottom: 20px;">
                        Версия 1.0.0
                    </p>
                    <div style="background: rgba(255, 255, 255, 0.05); padding: 15px; border-radius: 12px; margin-bottom: 15px;">
                        <p style="margin: 0; color: var(--text-secondary); font-size: 0.9rem;">
                            Оптимизированный VPN для PUBG Mobile с низким пингом и стабильным соединением.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    toggleMoreMenu();
}

// Функция для закрытия модального окна
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.remove();
    }
}

// Применение темы Telegram
function applyTelegramTheme() {
    if (!window.Telegram?.WebApp) return;
    
    const themeParams = window.Telegram.WebApp.themeParams;
    
    if (themeParams) {
        document.documentElement.style.setProperty('--text-primary', themeParams.text_color || '#ffffff');
        document.documentElement.style.setProperty('--text-secondary', themeParams.hint_color || '#a0a0c0');
        document.documentElement.style.setProperty('--card-bg', themeParams.secondary_bg_color || '#13131a');
        document.documentElement.style.setProperty('--dark-bg', themeParams.bg_color || '#0a0a0f');
        document.documentElement.style.setProperty('--card-border', themeParams.section_bg_color || '#2a2a3a');
    }
}

// Остальные функции (без изменений)
function syncTelegramAvatar(user) {
    if (!user) return;
    
    const avatars = document.querySelectorAll('.user-avatar, .profile-avatar-large');
    let telegramAvatarUrl = null;
    
    if (user.photo_url) {
        telegramAvatarUrl = user.photo_url;
    }
    
    if (!telegramAvatarUrl) {
        const userId = user.id.toString();
        telegramAvatarUrl = `https://api.dicebear.com/7.x/thumbs/svg?seed=telegram_${userId}&backgroundColor=0088cc,34b7f1,00ff88&backgroundType=gradientLinear`;
    }
    
    avatars.forEach(avatar => {
        const img = avatar.querySelector('img');
        if (img) {
            img.src = telegramAvatarUrl;
            img.onerror = function () {
                this.src = `https://api.dicebear.com/7.x/thumbs/svg?seed=user_${Date.now()}&backgroundColor=00ff88,00ccff,9d4edd&backgroundType=gradientLinear`;
            };
        }
        avatar.classList.add('telegram-synced');
    });
    
    try {
        localStorage.setItem('telegram_avatar_url', telegramAvatarUrl);
        localStorage.setItem('telegram_user_id', user.id.toString());
    } catch (e) {
        console.log('Не удалось сохранить аватар в localStorage');
    }
}

function loadSavedAvatar() {
    try {
        const savedAvatarUrl = localStorage.getItem('telegram_avatar_url');
        const savedUserId = localStorage.getItem('telegram_user_id');
        
        if (savedAvatarUrl && savedUserId) {
            const avatars = document.querySelectorAll('.user-avatar, .profile-avatar-large');
            avatars.forEach(avatar => {
                const img = avatar.querySelector('img');
                if (img) {
                    img.src = savedAvatarUrl;
                    avatar.classList.add('telegram-synced');
                }
            });
            return true;
        }
    } catch (e) {
        console.log('Не удалось загрузить сохраненный аватар');
    }
    return false;
}

function updateUserProfileFromTelegram(user) {
    if (!user) return;
    
    console.log('Данные пользователя Telegram:', user);
    updateAllAvatars(user);
    updateProfileInfo(user);
    
    currentUser = {
        id: user.id.toString(),
        username: user.username || `user_${user.id}`,
        firstName: user.first_name || '',
        lastName: user.last_name || '',
        languageCode: user.language_code || 'ru',
        isPremium: user.is_premium || false,
        photoUrl: user.photo_url || null
    };
}

function initTelegramAvatar(user) {
    if (!user) return;
    
    const userId = user.id.toString();
    const avatarUrl = `https://api.dicebear.com/7.x/thumbs/svg?seed=${userId}&backgroundColor=00ff88,00ccff,9d4edd&backgroundType=gradientLinear`;
    
    const avatars = document.querySelectorAll('.user-avatar img, .profile-avatar-large img');
    avatars.forEach(avatar => {
        avatar.src = avatarUrl;
        avatar.onerror = function () {
            this.src = `https://api.dicebear.com/7.x/thumbs/svg?seed=telegram_${userId}`;
        };
    });
}

function updateAllAvatars(user) {
    if (!user) return;
    
    const avatarElements = document.querySelectorAll('.user-avatar, .profile-avatar-large');
    
    avatarElements.forEach(avatarElement => {
        const img = avatarElement.querySelector('img');
        if (img) {
            const seed = user.id.toString();
            img.src = `https://api.dicebear.com/7.x/thumbs/svg?seed=${seed}&backgroundColor=00ff88,00ccff,9d4edd&backgroundType=gradientLinear`;
        }
    });
}

function updateProfileInfo(user) {
    if (!window.location.pathname.includes('profile.html')) return;
    
    const profileName = document.querySelector('.profile-info h2');
    if (profileName) {
        let fullName = '';
        if (user.first_name) fullName += user.first_name;
        if (user.last_name) fullName += ' ' + user.last_name;
        if (!fullName.trim()) fullName = 'Пользователь Telegram';
        profileName.textContent = fullName.trim();
    }
    
    const profileUsername = document.querySelector('.profile-username');
    if (profileUsername) {
        if (user.username) {
            profileUsername.textContent = `@${user.username}`;
        } else {
            profileUsername.textContent = 'Без username';
        }
    }
    
    const profileLevel = document.querySelector('.profile-level');
    if (profileLevel && user.is_premium) {
        profileLevel.innerHTML = '<i class="fas fa-crown"></i> Telegram Premium';
        profileLevel.style.background = 'rgba(255, 215, 0, 0.15)';
        profileLevel.style.color = '#ffd700';
        profileLevel.style.borderColor = 'rgba(255, 215, 0, 0.3)';
    }
    
    updateTelegramStats(user);
}

function updateTelegramStats(user) {
    const stats = document.querySelectorAll('.stat-number');
    if (stats.length >= 3) {
        const userId = user.id.toString();
        const seed = parseInt(userId.slice(-4)) || 1234;
        
        stats[0].textContent = Math.floor((seed % 335) + 30);
        stats[1].textContent = Math.floor(((seed * 13) % 1900) + 100);
        stats[2].textContent = Math.floor(((seed * 7) % 25) + 70) + '%';
    }
}

function updatePageHeaders() {
    if (!currentUser) return;
    
    const logoText = document.querySelector('.logo-text h1');
    if (logoText) {
        logoText.style.width = '100%';
        logoText.style.whiteSpace = 'nowrap';
        logoText.style.overflow = 'hidden';
        logoText.style.textOverflow = 'ellipsis';
    }
    
    const headerTitles = document.querySelectorAll('.header-title h1');
    headerTitles.forEach(title => {
        title.style.width = '100%';
        title.style.whiteSpace = 'nowrap';
        title.style.overflow = 'hidden';
        title.style.textOverflow = 'ellipsis';
    });
    
    if (telegramUser) {
        const headerAvatar = document.querySelector('.header-content .user-avatar img');
        if (headerAvatar) {
            const seed = telegramUser.id.toString();
            headerAvatar.src = `https://api.dicebear.com/7.x/thumbs/svg?seed=${seed}&backgroundColor=00ff88,00ccff,9d4edd&backgroundType=gradientLinear`;
        }
    }
}

// Основная инициализация при загрузке DOM
document.addEventListener('DOMContentLoaded', async function () {
    console.log('DOM загружен, инициализируем приложение...');
    
    // Шаг 1: Инициализация Telegram WebApp с приоритетом на fullscreen
    if (window.Telegram?.WebApp) {
        console.log('Telegram WebApp обнаружен, применяем fullscreen...');
        
        // Сразу добавляем CSS классы
        document.documentElement.classList.add('telegram-webapp');
        document.body.classList.add('telegram-webapp');
        
        // Инициализируем с задержкой для надежности
        setTimeout(() => {
            initTelegramWebApp();
        }, 100);
        
        // Множественные попытки для разных случаев запуска
        setTimeout(() => {
            if (window.Telegram?.WebApp?.expand) {
                window.Telegram.WebApp.expand();
            }
        }, 200);
        
        setTimeout(() => {
            if (window.Telegram?.WebApp?.expand) {
                window.Telegram.WebApp.expand();
            }
        }, 500);
        
        setTimeout(() => {
            if (window.Telegram?.WebApp?.expand) {
                window.Telegram.WebApp.expand();
            }
        }, 1000);
        
        // Получаем данные пользователя
        telegramUser = window.Telegram.WebApp.initDataUnsafe?.user;
        
        if (telegramUser) {
            updateUserProfileFromTelegram(telegramUser);
            initTelegramAvatar(telegramUser);
        }
    }
    
    // Шаг 2: Инициализация Firebase (раскомментируйте когда добавите свои ключи)
    // initFirebase();
    
    // Шаг 3: Загрузка демо данных пока нет Firebase
    loadDemoData();
    
    // Шаг 4: Запуск анимаций появления
    initAppearanceAnimations();
    
    // Шаг 5: Остальная инициализация
    initPingCheck();
    initBuyButtons();
    initModals();
    
    // Шаг 6: Оптимизации для мобильных
    optimizeMobileExperience();
    
    // Шаг 7: Обновление UI с данными пользователя
    updateUserInterface();
    
    // Шаг 8: Финальная проверка fullscreen через 2 секунды
    setTimeout(() => {
        if (window.Telegram?.WebApp?.expand) {
            window.Telegram.WebApp.expand();
        }
    }, 2000);
    
    console.log('Инициализация завершена');
});

// Остальные функции без изменений
async function initFirebase() {
    try {
        if (!firebase.apps.length) {
            app = firebase.initializeApp(firebaseConfig);
            auth = firebase.auth();
            db = firebase.firestore();
            await setupTelegramAuth();
        }
    } catch (error) {
        console.error('Ошибка инициализации Firebase:', error);
        loadDemoData();
    }
}

async function setupTelegramAuth() {
    if (!tg?.initDataUnsafe?.user) {
        console.log('Пользователь Telegram не найден');
        return;
    }
    
    const telegramUser = tg.initDataUnsafe.user;
    const userId = telegramUser.id.toString();
    
    try {
        const userRef = db.collection('users').doc(userId);
        const userDoc = await userRef.get();
        
        if (!userDoc.exists) {
            await userRef.set({
                telegramId: userId,
                username: telegramUser.username || `user_${userId}`,
                firstName: telegramUser.first_name || '',
                lastName: telegramUser.last_name || '',
                languageCode: telegramUser.language_code || 'ru',
                isPremium: telegramUser.is_premium || false,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
                stats: {
                    totalSpent: 0,
                    totalDays: 0,
                    gamesPlayed: 0,
                    accuracy: 0,
                    pingSaved: 0,
                    timeSaved: 0
                }
            });
            console.log('Новый пользователь создан');
        } else {
            await userRef.update({
                lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
                lastSeen: new Date().toISOString()
            });
        }
        
        await loadUserData(userId);
        
    } catch (error) {
        console.error('Ошибка авторизации:', error);
        loadDemoData();
    }
}

async function loadUserData(userId) {
    try {
        const userDoc = await db.collection('users').doc(userId).get();
        if (userDoc.exists) {
            currentUser = { id: userId, ...userDoc.data() };
            await loadUserPurchases(userId);
            updateUserInterface();
        }
    } catch (error) {
        console.error('Ошибка загрузки данных пользователя:', error);
        loadDemoData();
    }
}

async function loadUserPurchases(userId) {
    try {
        const purchasesSnapshot = await db.collection('purchases')
            .where('userId', '==', userId)
            .orderBy('purchaseDate', 'desc')
            .get();
        
        userPurchases = [];
        userActiveSubscription = null;
        
        purchasesSnapshot.forEach(doc => {
            const purchase = { id: doc.id, ...doc.data() };
            userPurchases.push(purchase);
            
            if (purchase.status === 'active' && (!userActiveSubscription ||
                new Date(purchase.endDate) > new Date(userActiveSubscription.endDate))) {
                userActiveSubscription = purchase;
            }
        });
        
        updatePurchasesUI();
        updateProfileSubscriptionUI();
        
    } catch (error) {
        console.error('Ошибка загрузки покупок:', error);
        loadDemoPurchases();
    }
}

function updatePurchasesUI() {
    const purchasesList = document.querySelector('.purchases-list');
    const summaryStats = document.querySelector('.purchases-summary');
    
    if (!purchasesList || !summaryStats) return;
    
    purchasesList.innerHTML = '';
    
    if (userPurchases.length === 0) {
        purchasesList.innerHTML = `
            <div class="simple-card" style="text-align: center; padding: 2rem;">
                <i class="fas fa-shopping-cart" style="font-size: 3rem; color: var(--text-tertiary); margin-bottom: 1rem;"></i>
                <h3 style="color: var(--text-primary); margin-bottom: 0.5rem;">Покупок пока нет</h3>
                <p style="color: var(--text-secondary);">Выберите подходящий тариф VPN</p>
            </div>
        `;
        
        summaryStats.style.display = 'none';
        return;
    }
    
    summaryStats.style.display = 'block';
    
    let totalSpent = 0;
    let activePurchases = 0;
    let totalDays = 0;
    
    userPurchases.forEach(purchase => {
        if (purchase.price) totalSpent += purchase.price;
        if (purchase.status === 'active') activePurchases++;
        
        if (purchase.purchaseDate && purchase.endDate) {
            const start = new Date(purchase.purchaseDate.seconds * 1000);
            const end = new Date(purchase.endDate.seconds * 1000);
            const days = Math.floor((end - start) / (1000 * 60 * 60 * 24));
            totalDays += days;
        }
    });
    
    const summaryItems = summaryStats.querySelectorAll('.summary-item');
    if (summaryItems[0]) summaryItems[0].querySelector('.summary-value').textContent = `${totalSpent} ₽`;
    if (summaryItems[1]) summaryItems[1].querySelector('.summary-value').textContent = `~${Math.floor(totalDays * 0.5)} часов`;
    if (summaryItems[2]) summaryItems[2].querySelector('.summary-value').textContent = '85 мс';
    if (summaryItems[3]) summaryItems[3].querySelector('.summary-value').textContent = '18 мс';
    
    userPurchases.forEach(purchase => {
        const plan = getPlanInfo(purchase.planId);
        const purchaseDate = purchase.purchaseDate ?
            formatDate(purchase.purchaseDate.seconds * 1000) : 'N/A';
        const endDate = purchase.endDate ?
            formatDate(purchase.endDate.seconds * 1000) : 'N/A';
        
        const purchaseItem = document.createElement('div');
        purchaseItem.className = `purchase-item ${purchase.status === 'active' ? 'active' : ''}`;
        purchaseItem.innerHTML = `
            <div class="purchase-icon" style="color: ${plan.color};">
                <i class="fas fa-${plan.icon}"></i>
            </div>
            <div class="purchase-info">
                <h4>${plan.name}</h4>
                <p>${purchaseDate} - ${endDate}</p>
                <span class="status-badge ${purchase.status === 'active' ? 'active' : 'expired'}">
                    ${purchase.status === 'active' ? 'Активна' : 'Истекла'}
                </span>
            </div>
            <div class="purchase-price">
                ${purchase.price || plan.price} ₽
            </div>
        `;
        
        purchasesList.appendChild(purchaseItem);
    });
}

function updateProfileSubscriptionUI() {
    const subscriptionCard = document.querySelector('.subscription-card');
    const subscriptionPlaceholder = document.querySelector('.no-subscription-card');
    
    if (!subscriptionCard) return;
    
    if (userActiveSubscription) {
        const plan = getPlanInfo(userActiveSubscription.planId);
        const endDate = userActiveSubscription.endDate ?
            formatDate(userActiveSubscription.endDate.seconds * 1000) : 'N/A';
        
        subscriptionCard.classList.remove('hidden');
        if (subscriptionPlaceholder) subscriptionPlaceholder.style.display = 'none';
        
        subscriptionCard.querySelector('.subscription-details h4').textContent = plan.name;
        subscriptionCard.querySelector('.subscription-details p:nth-child(2)').textContent = `Активна до: ${endDate}`;
        subscriptionCard.querySelector('.subscription-icon i').className = `fas fa-${plan.icon}`;
        subscriptionCard.querySelector('.subscription-icon').style.color = plan.color;
        
        const renewBtn = subscriptionCard.querySelector('.simple-btn');
        if (renewBtn) renewBtn.style.display = 'none';
    } else {
        subscriptionCard.classList.add('hidden');
        
        if (!subscriptionPlaceholder) {
            const placeholder = document.createElement('div');
            placeholder.className = 'simple-card no-subscription-card';
            placeholder.style.textAlign = 'center';
            placeholder.style.padding = '2rem';
            placeholder.innerHTML = `
                <i class="fas fa-shield-alt" style="font-size: 3rem; color: var(--text-tertiary); margin-bottom: 1rem;"></i>
                <h3 style="color: var(--text-primary); margin-bottom: 0.5rem;">Нет активной подписки</h3>
                <p style="color: var(--text-secondary); margin-bottom: 1.5rem;">Выберите тариф VPN для максимальной производительности</p>
                <a href="index.html" class="simple-btn btn-primary">
                    <i class="fas fa-shopping-cart"></i> Выбрать тариф
                </a>
            `;
            
            subscriptionCard.parentNode.insertBefore(placeholder, subscriptionCard.nextSibling);
        } else {
            subscriptionPlaceholder.style.display = 'block';
        }
    }
}

function getPlanInfo(planId) {
    const plans = {
        light: {
            name: 'Лайт VPN',
            price: 299,
            color: '#00ff88',
            icon: 'bolt'
        },
        pro: {
            name: 'Про VPN',
            price: 599,
            color: '#00ccff',
            icon: 'rocket'
        },
        flowi: {
            name: 'Флоуи VPN',
            price: 999,
            color: '#9d4edd',
            icon: 'gem'
        }
    };
    
    return plans[planId] || plans.light;
}

function formatDate(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

function loadDemoData() {
    console.log('Загружаем демо данные');
    
    if (telegramUser) {
        currentUser = {
            id: telegramUser.id.toString(),
            username: telegramUser.username || `user_${telegramUser.id}`,
            firstName: telegramUser.first_name || 'Пользователь',
            lastName: telegramUser.last_name || '',
            stats: {
                totalSpent: 2196,
                totalDays: 120,
                gamesPlayed: 347,
                accuracy: 85,
                pingSaved: 67,
                timeSaved: 47
            }
        };
    } else {
        currentUser = {
            id: 'demo_user',
            username: 'demo_user',
            firstName: 'Демо',
            lastName: 'Пользователь',
            stats: {
                totalSpent: 2196,
                totalDays: 120,
                gamesPlayed: 347,
                accuracy: 85,
                pingSaved: 67,
                timeSaved: 47
            }
        };
    }
    
    loadDemoPurchases();
    updateUserInterface();
}

function updateUserInterface() {
    if (!currentUser) return;
    
    updateProfileStats();
    updatePageHeaders();
}

function updateProfileStats() {
    if (!currentUser?.stats) return;
    
    const statNumbers = document.querySelectorAll('.stat-number');
    if (statNumbers.length >= 3) {
        statNumbers[0].textContent = currentUser.stats.totalDays || 0;
        statNumbers[1].textContent = currentUser.stats.gamesPlayed || 0;
        statNumbers[2].textContent = currentUser.stats.accuracy ? `${currentUser.stats.accuracy}%` : '0%';
    }
    
    const statDetails = document.querySelector('.stats-details');
    if (statDetails) {
        const detailItems = statDetails.querySelectorAll('.stat-detail');
        if (detailItems.length >= 5) {
            if (currentUser.stats.pingBefore) detailItems[0].querySelector('.stat-value').textContent = `${currentUser.stats.pingBefore} мс`;
            if (currentUser.stats.pingAfter) detailItems[1].querySelector('.stat-value').textContent = `${currentUser.stats.pingAfter} мс`;
            if (currentUser.stats.pingSaved) detailItems[2].querySelector('.stat-value').textContent = `-${currentUser.stats.pingSaved} мс`;
            if (currentUser.stats.timeSaved) detailItems[3].querySelector('.stat-value').textContent = `~${currentUser.stats.timeSaved} часов`;
            if (currentUser.stats.bestPing) detailItems[4].querySelector('.stat-value').textContent = `${currentUser.stats.bestPing} мс`;
        }
    }
}

function initAppearanceAnimations() {
    const sectionHeaders = document.querySelectorAll('.section-header');
    sectionHeaders.forEach(header => {
        header.style.opacity = '1';
        header.style.transform = 'none';
    });
    
    setTimeout(() => {
        simulatePingCheck();
    }, 1000);
    
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate__animated', 'animate__fadeInUp');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);
    
    document.querySelectorAll('.simple-card, .tariff-card, .benefit-card').forEach(card => {
        observer.observe(card);
    });
}

function initPingCheck() {
    const checkPingBtn = document.getElementById('checkPingBtn');
    const pingValue = document.getElementById('pingValue');
    
    if (checkPingBtn && pingValue) {
        checkPingBtn.addEventListener('click', simulatePingCheck);
    }
}

function simulatePingCheck() {
    const checkPingBtn = document.getElementById('checkPingBtn');
    const pingValue = document.getElementById('pingValue');
    const statusText = document.querySelector('.status-text');
    const indicators = document.querySelectorAll('.status-indicator');
    
    if (!checkPingBtn || !pingValue) return;
    
    if (checkPingBtn.classList.contains('checking')) return;
    
    checkPingBtn.classList.add('checking');
    checkPingBtn.disabled = true;
    
    const originalHeight = checkPingBtn.offsetHeight;
    checkPingBtn.style.height = originalHeight + 'px';
    checkPingBtn.style.minHeight = originalHeight + 'px';
    
    const originalContent = checkPingBtn.innerHTML;
    checkPingBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>Проверяем...</span>';
    
    const spinner = checkPingBtn.querySelector('.fa-spinner');
    const textSpan = checkPingBtn.querySelector('span');
    
    if (spinner) {
        spinner.style.fontSize = '1em';
        spinner.style.lineHeight = '1';
    }
    
    if (textSpan) {
        textSpan.style.fontSize = '0.95rem';
        textSpan.style.lineHeight = '1';
    }
    
    checkPingBtn.style.opacity = '0.7';
    
    let dots = 0;
    const interval = setInterval(() => {
        pingValue.textContent = '•'.repeat(dots + 1);
        dots = (dots + 1) % 3;
    }, 200);
    
    const delay = 2000 + Math.random() * 1000;
    
    setTimeout(() => {
        clearInterval(interval);
        
        const randomPing = Math.floor(Math.random() * (28 - 8 + 1)) + 8;
        pingValue.textContent = randomPing;
        
        updatePingStatus(randomPing, statusText, indicators);
        
        checkPingBtn.classList.remove('checking');
        checkPingBtn.disabled = false;
        checkPingBtn.innerHTML = '<i class="fas fa-sync-alt"></i><span>Проверить сейчас</span>';
        
        checkPingBtn.style.height = '';
        checkPingBtn.style.minHeight = '';
        
        checkPingBtn.style.opacity = '1';
        
        pingValue.style.transform = 'scale(1.1)';
        pingValue.style.transition = 'transform 0.3s ease';
        setTimeout(() => {
            pingValue.style.transform = 'scale(1)';
        }, 300);
    }, delay);
}

function updatePingStatus(ping, statusText, indicators) {
    if (!statusText || !indicators) return;
    
    indicators.forEach(indicator => {
        indicator.classList.remove('active');
        indicator.style.height = '20px';
    });
    
    if (ping <= 15) {
        statusText.textContent = 'Идеальное соединение!';
        statusText.style.color = 'var(--success-color)';
        indicators[0].classList.add('active');
        indicators[0].style.height = '28px';
    } else if (ping <= 25) {
        statusText.textContent = 'Отличное соединение';
        statusText.style.color = 'var(--info-color)';
        indicators[1].classList.add('active');
        indicators[1].style.height = '24px';
    } else {
        statusText.textContent = 'Хорошее соединение';
        statusText.style.color = '#ffaa00';
        indicators[2].classList.add('active');
        indicators[2].style.height = '20px';
    }
}

function initBuyButtons() {
    const buyButtons = document.querySelectorAll('.buy-btn');
    
    buyButtons.forEach(button => {
        button.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            const planId = this.getAttribute('data-plan');
            const price = this.getAttribute('data-price');
            const name = this.getAttribute('data-name');
            
            if (planId && window.paymentSystem) {
                // Используем новую систему оплаты
                window.paymentSystem.openPaymentModal({
                    plan: planId,
                    price: price,
                    name: name
                });
            } else if (planId) {
                // Старая система (запасной вариант)
                openBuyModal(planId);
            }
        });
    });
}

function initModals() {
    const modal = document.querySelector('.modal-overlay');
    const closeBtn = document.querySelector('.modal-close');
    const confirmBtn = document.getElementById('confirmBuyBtn');
    
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            modal.classList.remove('active');
        });
    }
    
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    }
    
    if (confirmBtn) {
        confirmBtn.addEventListener('click', processPayment);
    }
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal-overlay').forEach(modal => {
                modal.classList.remove('active');
            });
        }
    });
}

function openBuyModal(planId) {
    const plan = getPlanInfo(planId);
    const modal = document.querySelector('.modal-overlay');
    const modalTitle = document.getElementById('modalTitle');
    const selectedPlanInfo = document.getElementById('selectedPlanInfo');
    
    if (!plan || !modal) return;
    
    modalTitle.textContent = `Оформление: ${plan.name}`;
    
    selectedPlanInfo.innerHTML = `
        <div class="selected-plan-info">
            <div style="border-left: 4px solid ${plan.color}; padding-left: 1rem; margin-bottom: 1.5rem;">
                <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 0.5rem;">
                    <div style="width: 48px; height: 48px; background: ${plan.color}20; border-radius: 12px; display: flex; align-items: center; justify-content: center;">
                        <i class="fas fa-${plan.icon}" style="color: ${plan.color}; font-size: 1.4rem;"></i>
                    </div>
                    <div>
                        <h4 style="color: ${plan.color}; margin: 0; font-size: 1.3rem;">${plan.name}</h4>
                        <div style="font-size: 2rem; font-weight: 800; color: ${plan.color};">${plan.price} ₽</div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    modal.classList.add('active');
}

async function processPayment() {
    const modal = document.querySelector('.modal-overlay');
    const confirmBtn = document.getElementById('confirmBuyBtn');
    
    if (!confirmBtn) return;
    
    confirmBtn.disabled = true;
    confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Обработка...';
    
    setTimeout(async () => {
        try {
            const planName = document.querySelector('#modalTitle')?.textContent?.replace('Оформление: ', '') || 'Про VPN';
            const planId = getPlanIdByName(planName);
            
            modal.classList.remove('active');
            confirmBtn.disabled = false;
            confirmBtn.innerHTML = '<i class="fas fa-lock"></i> Перейти к оплате';
            
            setTimeout(() => {
                const modalBody = document.querySelector('.modal-body');
                if (modalBody) {
                    modalBody.innerHTML = `
                        <div style="text-align: center; padding: 2rem 1rem;">
                            <div style="width: 90px; height: 90px; background: var(--primary-gradient); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem; animation: pulse 2s infinite;">
                                <i class="fas fa-check" style="font-size: 2.5rem; color: white;"></i>
                            </div>
                            <h3 style="color: var(--success-color); margin-bottom: 1rem; font-size: 1.5rem;">Оплата успешна!</h3>
                            <p style="color: var(--text-secondary); margin-bottom: 1.5rem; line-height: 1.5; font-size: 1rem;">
                                Данные для подключения отправлены в личные сообщения Telegram.
                            </p>
                            <div style="background: rgba(0, 255, 136, 0.1); padding: 1.25rem; border-radius: 14px; margin: 1.5rem 0; border: 1px solid rgba(0, 255, 136, 0.3);">
                                <p style="font-size: 0.95rem; color: var(--success-color); margin: 0;">
                                    <i class="fas fa-info-circle"></i> Проверьте чат с ботом
                                </p>
                            </div>
                        </div>
                    `;
                }
            }, 100);
            
        } catch (error) {
            console.error('Ошибка оплаты:', error);
            confirmBtn.disabled = false;
            confirmBtn.innerHTML = '<i class="fas fa-lock"></i> Перейти к оплате';
        }
    }, 2000);
}

function getPlanIdByName(name) {
    const plans = {
        'Лайт VPN': 'light',
        'Про VPN': 'pro',
        'Флоуи VPN': 'flowi'
    };
    return plans[name] || 'light';
}

function optimizeMobileExperience() {
    document.addEventListener('touchstart', function (e) {
        if (e.target.matches('input, select, textarea')) {
            setTimeout(() => {
                e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100);
        }
    });
    
    function setVH() {
        let vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
    }
    
    setVH();
    window.addEventListener('resize', setVH);
    window.addEventListener('orientationchange', setVH);
    
    document.addEventListener('click', function (e) {
        if (e.target.closest('.simple-btn')) {
            createRipple(e, e.target.closest('.simple-btn'));
        }
    });
}

function createRipple(event, button) {
    const circle = document.createElement("span");
    const diameter = Math.max(button.clientWidth, button.clientHeight);
    const radius = diameter / 2;
    
    circle.style.width = circle.style.height = `${diameter}px`;
    circle.style.left = `${event.clientX - button.getBoundingClientRect().left - radius}px`;
    circle.style.top = `${event.clientY - button.getBoundingClientRect().top - radius}px`;
    circle.classList.add("ripple");
    
    const ripple = button.getElementsByClassName("ripple")[0];
    
    if (ripple) {
        ripple.remove();
    }
    
    button.appendChild(circle);
    
    setTimeout(() => {
        circle.remove();
    }, 600);
}

function loadDemoPurchases() {
    userPurchases = [
        {
            planId: 'pro',
            price: 599,
            status: 'active',
            purchaseDate: { seconds: Date.now() / 1000 - 30 * 24 * 60 * 60 },
            endDate: { seconds: Date.now() / 1000 + 30 * 24 * 60 * 60 }
        }
    ];
    userActiveSubscription = userPurchases[0];
    
    updatePurchasesUI();
    updateProfileSubscriptionUI();
}