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

// Настройки UI
let uiSettings = {
    closeButtonColor: '#ff4757',
    showCloseButton: true,
    showMinimizeButton: true,
    showMenuButton: true
};

document.addEventListener('DOMContentLoaded', async function () {
    // Инициализация Telegram Web App
    if (window.Telegram?.WebApp) {
        initTelegramWebApp();

        // Получаем данные пользователя Telegram
        telegramUser = window.Telegram.WebApp.initDataUnsafe?.user;

        if (telegramUser) {
            // Обновляем профиль с данными из Telegram
            updateUserProfileFromTelegram(telegramUser);

            // Инициализируем аватар с seed из Telegram
            initTelegramAvatar(telegramUser);
        }
    }

    // Загружаем настройки UI
    loadUISettings();

    // Инициализация Firebase (раскомментируйте когда добавите свои ключи)
    // initFirebase();

    // Загрузка демо данных пока нет Firebase
    loadDemoData();

    // Запуск анимаций появления
    initAppearanceAnimations();

    // Остальная инициализация
    initPingCheck();
    initBuyButtons();
    initModals();

    // Оптимизации для мобильных
    optimizeMobileExperience();

    // Обновление UI с данными пользователя
    updateUserInterface();
});

// Инициализация Telegram Web App
function initTelegramWebApp() {
    if (!window.Telegram?.WebApp) return;

    const tg = window.Telegram.WebApp;

    // Добавляем класс для стилей
    document.body.classList.add('telegram-webapp');

    console.log('Telegram Web App инициализирован');

    tg.MainButton.hide();
    tg.BackButton.hide();

    // Настраиваем тему
    applyTelegramTheme();

    // Подписываемся на изменения темы
    tg.onEvent('themeChanged', applyTelegramTheme);

    // Синхронизируем данные пользователя
    const telegramUser = tg.initDataUnsafe?.user;
    if (telegramUser) {
        // Пробуем загрузить сохраненный аватар
        const loadedFromCache = loadSavedAvatar();

        if (!loadedFromCache) {
            syncTelegramAvatar(telegramUser);
        }

        currentUser = {
            telegramUser: telegramUser,
            lastAvatarUpdate: Date.now()
        };
    }

    // Готовим приложение
    if (tg.ready) {
        tg.ready();
    }

    // Добавляем подтверждение закрытия
    tg.enableClosingConfirmation();

    // Кастомизируем UI
    setTimeout(() => {
        customizeTelegramUI();
    }, 100);
}

// Кастомизация UI Telegram Mini App
function customizeTelegramUI() {
    if (!window.Telegram?.WebApp) return;

    const tg = window.Telegram.WebApp;

    // Скрываем заголовок Telegram
    tg.setHeaderColor('bg_color');

    // Убираем стандартные кнопки
    if (tg.BackButton) {
        tg.BackButton.hide();
    }

    // Добавляем кастомный хедер
    addCustomHeader();

    // Добавляем плавающую кнопку закрытия
    addFloatingCloseButton();

    // Добавляем кнопки "свернуть" и "три точки"
    addCustomActionButtons();

    // Добавляем меню настроек
    addSettingsMenu();

    // Применяем сохраненные настройки
    applyUISettings();
}

// Создаем кастомный хедер
function addCustomHeader() {
    const existingHeader = document.querySelector('.custom-telegram-header');
    if (existingHeader) return;

    const headerHTML = `
        <div class="custom-telegram-header">
            <div class="custom-header-left">
                <button class="custom-back-btn" onclick="window.history.back()">
                    <i class="fas fa-chevron-left"></i>
                </button>
            </div>
            <div class="custom-header-center">
                <div class="app-logo">
                    <div class="logo-icon-small">
                        <i class="fas fa-shield-alt"></i>
                    </div>
                    <span class="app-name">ФЛОУИ VPN</span>
                </div>
            </div>
            <div class="custom-header-right">
                <button class="custom-minimize-btn" onclick="minimizeApp()">
                    <i class="fas fa-window-minimize"></i>
                </button>
                <button class="custom-more-btn" onclick="toggleMoreMenu()">
                    <i class="fas fa-ellipsis-v"></i>
                </button>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('afterbegin', headerHTML);
}

// Добавляем плавающую кнопку закрытия
function addFloatingCloseButton() {
    const existingCloseBtn = document.querySelector('.floating-close-btn');
    if (existingCloseBtn) return;

    const closeBtnHTML = `
        <button class="floating-close-btn" onclick="closeApp()">
            <i class="fas fa-times"></i>
            <span class="btn-text">Close</span>
        </button>
    `;

    document.body.insertAdjacentHTML('beforeend', closeBtnHTML);
}

// Добавляем кнопки действий (свернуть и три точки)
function addCustomActionButtons() {
    const actionMenuHTML = `
        <div class="custom-action-menu" id="actionMenu">
            <button class="action-menu-item" onclick="showSettingsPage()">
                <i class="fas fa-cog"></i>
                <span>Настройки</span>
            </button>
            <button class="action-menu-item" onclick="showProfilePage()">
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
            <button class="action-menu-item" onclick="openUISettings()">
                <i class="fas fa-palette"></i>
                <span>Настроить кнопки</span>
            </button>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', actionMenuHTML);
}

// Добавляем меню настроек UI
function addSettingsMenu() {
    const settingsMenuHTML = `
        <div class="settings-menu" id="settingsMenu">
            <h4><i class="fas fa-palette"></i> Настройка кнопок</h4>
            
            <div class="color-options">
                <div class="color-option active" style="background: #ff4757;" data-color="#ff4757"></div>
                <div class="color-option" style="background: #00ff88;" data-color="#00ff88"></div>
                <div class="color-option" style="background: #00ccff;" data-color="#00ccff"></div>
                <div class="color-option" style="background: #9d4edd;" data-color="#9d4edd"></div>
                <div class="color-option" style="background: #ffaa00;" data-color="#ffaa00"></div>
                <div class="color-option" style="background: #ff6b81;" data-color="#ff6b81"></div>
            </div>
            
            <div class="toggle-options">
                <div class="toggle-option">
                    <span>Показывать кнопку "Close"</span>
                    <label class="toggle-switch">
                        <input type="checkbox" id="toggleCloseButton" checked>
                        <span class="toggle-slider"></span>
                    </label>
                </div>
                <div class="toggle-option">
                    <span>Показывать кнопку "Свернуть"</span>
                    <label class="toggle-switch">
                        <input type="checkbox" id="toggleMinimizeButton" checked>
                        <span class="toggle-slider"></span>
                    </label>
                </div>
                <div class="toggle-option">
                    <span>Показывать меню (три точки)</span>
                    <label class="checkbox">
                        <input type="checkbox" id="toggleMenuButton" checked>
                        <span class="checkmark"></span>
                    </label>
                </div>
            </div>
            
            <button class="simple-btn btn-primary" onclick="applySettings()" style="margin-top: 16px; width: 100%;">
                <i class="fas fa-check"></i> Применить
            </button>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', settingsMenuHTML);

    // Инициализируем выбор цвета
    const colorOptions = document.querySelectorAll('.color-option');
    colorOptions.forEach(option => {
        option.addEventListener('click', function () {
            colorOptions.forEach(opt => opt.classList.remove('active'));
            this.classList.add('active');
        });
    });

    // Инициализируем переключатели
    document.getElementById('toggleCloseButton').addEventListener('change', updateToggle);
    document.getElementById('toggleMinimizeButton').addEventListener('change', updateToggle);
    document.getElementById('toggleMenuButton').addEventListener('change', updateToggle);
}

// Функции для кнопок
function closeApp() {
    if (window.Telegram?.WebApp?.close) {
        window.Telegram.WebApp.close();
    } else {
        window.close();
    }
}

function minimizeApp() {
    showNotification('Приложение свернуто', 'info');
    // Можно добавить другую логику минимизации
}

function toggleMoreMenu() {
    const menu = document.getElementById('actionMenu');
    const settingsMenu = document.getElementById('settingsMenu');

    if (settingsMenu && settingsMenu.classList.contains('show')) {
        settingsMenu.classList.remove('show');
    }

    if (menu) {
        menu.classList.toggle('show');
    }
}

function openUISettings() {
    const settingsMenu = document.getElementById('settingsMenu');
    const actionMenu = document.getElementById('actionMenu');

    if (actionMenu) {
        actionMenu.classList.remove('show');
    }

    if (settingsMenu) {
        settingsMenu.classList.toggle('show');
    }
}

function showSettingsPage() {
    window.location.href = 'settings.html';
    toggleMoreMenu();
}

function showProfilePage() {
    window.location.href = 'profile.html';
    toggleMoreMenu();
}

function showSupport() {
    if (window.Telegram?.WebApp?.openTelegramLink) {
        window.Telegram.WebApp.openTelegramLink('https://t.me/flowivpn_support');
    } else {
        window.open('https://t.me/flowivpn_support', '_blank');
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
                    <h4 style="text-align: center; margin-bottom: 10px; color: var(--accent-1);">ФЛОУИ VPN</h4>
                    <p style="text-align: center; color: var(--text-secondary); margin-bottom: 20px;">
                        Версия 1.0.0 • Для PUBG Mobile
                    </p>
                    <div style="background: rgba(255, 255, 255, 0.05); padding: 15px; border-radius: 12px; margin-bottom: 15px;">
                        <p style="margin: 0; color: var(--text-secondary); font-size: 0.9rem; line-height: 1.5;">
                            Оптимизированный VPN сервис для геймеров PUBG Mobile. 
                            Снижаем пинг, улучшаем стабильность соединения и повышаем точность регистрации попаданий.
                        </p>
                    </div>
                    <div style="display: flex; justify-content: center; gap: 10px; margin-top: 20px;">
                        <button class="simple-btn btn-outline" onclick="showSupport()" style="flex: 1;">
                            <i class="fas fa-headset"></i> Поддержка
                        </button>
                        <button class="simple-btn btn-primary" onclick="closeModal('aboutModal')" style="flex: 1;">
                            <i class="fas fa-check"></i> Закрыть
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    toggleMoreMenu();
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.remove();
    }
}

// Обновление переключателей
function updateToggle() {
    uiSettings.showCloseButton = document.getElementById('toggleCloseButton').checked;
    uiSettings.showMinimizeButton = document.getElementById('toggleMinimizeButton').checked;
    uiSettings.showMenuButton = document.getElementById('toggleMenuButton').checked;
}

// Применение настроек
function applySettings() {
    const selectedColor = document.querySelector('.color-option.active').getAttribute('data-color');
    uiSettings.closeButtonColor = selectedColor;

    updateToggle();
    applyUISettings();
    saveUISettings();

    const settingsMenu = document.getElementById('settingsMenu');
    if (settingsMenu) {
        settingsMenu.classList.remove('show');
    }

    showNotification('Настройки сохранены', 'success');
}

// Применение настроек UI
function applyUISettings() {
    // Цвет кнопки закрытия
    const closeBtn = document.querySelector('.floating-close-btn');
    if (closeBtn) {
        closeBtn.style.background = `rgba(${hexToRgb(uiSettings.closeButtonColor)}, 0.15)`;
        closeBtn.style.borderColor = `rgba(${hexToRgb(uiSettings.closeButtonColor)}, 0.3)`;
        closeBtn.style.color = uiSettings.closeButtonColor;
    }

    // Показ/скрытие кнопок
    const closeButton = document.querySelector('.floating-close-btn');
    const minimizeButton = document.querySelector('.custom-minimize-btn');
    const menuButton = document.querySelector('.custom-more-btn');

    if (closeButton) {
        closeButton.classList.toggle('hidden-element', !uiSettings.showCloseButton);
    }

    if (minimizeButton) {
        minimizeButton.classList.toggle('hidden-element', !uiSettings.showMinimizeButton);
    }

    if (menuButton) {
        menuButton.classList.toggle('hidden-element', !uiSettings.showMenuButton);
    }
}

// Сохранение настроек
function saveUISettings() {
    try {
        localStorage.setItem('flowi_ui_settings', JSON.stringify(uiSettings));
    } catch (e) {
        console.log('Не удалось сохранить настройки');
    }
}

// Загрузка настроек
function loadUISettings() {
    try {
        const savedSettings = localStorage.getItem('flowi_ui_settings');
        if (savedSettings) {
            uiSettings = JSON.parse(savedSettings);
        }
    } catch (e) {
        console.log('Не удалось загрузить настройки');
    }
}

// Вспомогательная функция для преобразования цвета
function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ?
        `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
        : '255, 71, 87';
}

// Функция для показа уведомлений
function showNotification(message, type = 'info') {
    // Проверяем есть ли уже уведомление
    const existingNotification = document.querySelector('.notification.show');
    if (existingNotification) {
        existingNotification.remove();
    }

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;

    document.body.appendChild(notification);

    // Показываем
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);

    // Скрываем через 3 секунды
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 300);
    }, 3000);
}

// ===== ОСТАЛЬНЫЕ ФУНКЦИИ (из предыдущего кода) =====

function syncTelegramAvatar(user) {
    if (!user) return;

    // Ищем все элементы с аватарками
    const avatars = document.querySelectorAll('.user-avatar, .profile-avatar-large');

    // Пытаемся получить аватар из Telegram
    let telegramAvatarUrl = null;

    // Если у пользователя есть фото в Telegram
    if (user.photo_url) {
        telegramAvatarUrl = user.photo_url;
    }

    // Или создаем аватар на основе данных Telegram
    if (!telegramAvatarUrl) {
        const userId = user.id.toString();
        telegramAvatarUrl = `https://api.dicebear.com/7.x/thumbs/svg?seed=telegram_${userId}&backgroundColor=0088cc,34b7f1,00ff88&backgroundType=gradientLinear`;
    }

    // Обновляем все аватары
    avatars.forEach(avatar => {
        const img = avatar.querySelector('img');
        if (img) {
            img.src = telegramAvatarUrl;
            img.onerror = function () {
                // Fallback если изображение не загрузилось
                this.src = `https://api.dicebear.com/7.x/thumbs/svg?seed=user_${Date.now()}&backgroundColor=00ff88,00ccff,9d4edd&backgroundType=gradientLinear`;
            };
        }

        // Добавляем класс для стилей Telegram
        avatar.classList.add('telegram-synced');
    });

    // Сохраняем аватар в localStorage для кэширования
    try {
        localStorage.setItem('telegram_avatar_url', telegramAvatarUrl);
        localStorage.setItem('telegram_user_id', user.id.toString());
    } catch (e) {
        console.log('Не удалось сохранить аватар в localStorage');
    }
}

// Функция для загрузки сохраненного аватара
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

// Применение темы Telegram
function applyTelegramTheme() {
    if (!window.Telegram?.WebApp) return;

    const tg = window.Telegram.WebApp;
    const themeParams = tg.themeParams;

    if (themeParams) {
        document.documentElement.style.setProperty('--text-primary', themeParams.text_color || '#ffffff');
        document.documentElement.style.setProperty('--text-secondary', themeParams.hint_color || '#a0a0c0');
        document.documentElement.style.setProperty('--card-bg', themeParams.secondary_bg_color || '#13131a');
        document.documentElement.style.setProperty('--dark-bg', themeParams.bg_color || '#0a0a0f');
        document.documentElement.style.setProperty('--card-border', themeParams.section_bg_color || '#2a2a3a');
    }
}

// Обновление профиля из данных Telegram
function updateUserProfileFromTelegram(user) {
    if (!user) return;

    console.log('Данные пользователя Telegram:', user);

    // Обновляем аватар на всех страницах
    updateAllAvatars(user);

    // Обновляем информацию в профиле
    updateProfileInfo(user);

    // Сохраняем пользователя для дальнейшего использования
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

// Инициализация аватара из Telegram
function initTelegramAvatar(user) {
    if (!user) return;

    // Используем ID пользователя для генерации аватара
    const userId = user.id.toString();
    const avatarUrl = `https://api.dicebear.com/7.x/thumbs/svg?seed=${userId}&backgroundColor=00ff88,00ccff,9d4edd&backgroundType=gradientLinear`;

    // Обновляем все аватары на странице
    const avatars = document.querySelectorAll('.user-avatar img, .profile-avatar-large img');
    avatars.forEach(avatar => {
        avatar.src = avatarUrl;
        avatar.onerror = function () {
            // Если аватар не загрузился, используем fallback
            this.src = `https://api.dicebear.com/7.x/thumbs/svg?seed=telegram_${userId}`;
        };
    });
}

// Обновление всех аватаров на странице
function updateAllAvatars(user) {
    if (!user) return;

    const avatarElements = document.querySelectorAll('.user-avatar, .profile-avatar-large');

    avatarElements.forEach(avatarElement => {
        const img = avatarElement.querySelector('img');
        if (img) {
            // Используем ID пользователя для уникального аватара
            const seed = user.id.toString();
            img.src = `https://api.dicebear.com/7.x/thumbs/svg?seed=${seed}&backgroundColor=00ff88,00ccff,9d4edd&backgroundType=gradientLinear`;
        }
    });
}

// Обновление информации в профиле
function updateProfileInfo(user) {
    // Обновляем только на странице профиля
    if (!window.location.pathname.includes('profile.html')) return;

    // Имя пользователя
    const profileName = document.querySelector('.profile-info h2');
    if (profileName) {
        let fullName = '';
        if (user.first_name) fullName += user.first_name;
        if (user.last_name) fullName += ' ' + user.last_name;
        if (!fullName.trim()) fullName = 'Пользователь Telegram';

        profileName.textContent = fullName.trim();
    }

    // Юзернейм
    const profileUsername = document.querySelector('.profile-username');
    if (profileUsername) {
        if (user.username) {
            profileUsername.textContent = `@${user.username}`;
        } else {
            profileUsername.textContent = 'Без username';
        }
    }

    // Уровень для премиум пользователей
    const profileLevel = document.querySelector('.profile-level');
    if (profileLevel) {
        if (user.is_premium) {
            profileLevel.innerHTML = '<i class="fas fa-crown"></i> Telegram Premium';
            profileLevel.style.background = 'rgba(255, 215, 0, 0.15)';
            profileLevel.style.color = '#ffd700';
            profileLevel.style.borderColor = 'rgba(255, 215, 0, 0.3)';
        }
    }

    // Статистика из Telegram
    updateTelegramStats(user);
}

// Обновление статистики из Telegram
function updateTelegramStats(user) {
    // Можно добавить логику для получения статистики из Telegram
    // Например, время использования бота, активность и т.д.

    // Пока используем демо данные, но с привязкой к ID пользователя
    const stats = document.querySelectorAll('.stat-number');
    if (stats.length >= 3) {
        // Генерируем псевдослучайные числа на основе ID пользователя
        const userId = user.id.toString();
        const seed = parseInt(userId.slice(-4)) || 1234;

        // Дни с VPN (30-365 дней)
        stats[0].textContent = Math.floor((seed % 335) + 30);

        // Игры сыграно (100-2000 игр)
        stats[1].textContent = Math.floor(((seed * 13) % 1900) + 100);

        // Точность (70-95%)
        stats[2].textContent = Math.floor(((seed * 7) % 25) + 70) + '%';
    }
}

// Обновление заголовков страниц с данными пользователя
function updatePageHeaders() {
    if (!currentUser) return;

    // Обновляем заголовок "ФЛОУИ VPN" чтобы был на всю ширину
    const logoText = document.querySelector('.logo-text h1');
    if (logoText) {
        logoText.style.width = '100%';
        logoText.style.whiteSpace = 'nowrap';
        logoText.style.overflow = 'hidden';
        logoText.style.textOverflow = 'ellipsis';
    }

    // Обновляем заголовки в хедере
    const headerTitles = document.querySelectorAll('.header-title h1');
    headerTitles.forEach(title => {
        title.style.width = '100%';
        title.style.whiteSpace = 'nowrap';
        title.style.overflow = 'hidden';
        title.style.textOverflow = 'ellipsis';
    });

    // Обновляем аватар в хедере если есть данные Telegram
    if (telegramUser) {
        const headerAvatar = document.querySelector('.header-content .user-avatar img');
        if (headerAvatar) {
            const seed = telegramUser.id.toString();
            headerAvatar.src = `https://api.dicebear.com/7.x/thumbs/svg?seed=${seed}&backgroundColor=00ff88,00ccff,9d4edd&backgroundType=gradientLinear`;
        }
    }
}

// Инициализация Firebase
async function initFirebase() {
    // Реализация Firebase
}

// Демо данные (используются если нет Telegram или Firebase)
function loadDemoData() {
    console.log('Загружаем демо данные');

    // Если есть данные Telegram, используем их
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
        // Иначе используем статические демо данные
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

// Обновление интерфейса пользователя
function updateUserInterface() {
    if (!currentUser) return;

    // Обновляем статистику в профиле
    updateProfileStats();

    // Обновляем заголовки
    updatePageHeaders();
}

// Обновление статистики в профиле
function updateProfileStats() {
    if (!currentUser?.stats) return;

    const statNumbers = document.querySelectorAll('.stat-number');
    if (statNumbers.length >= 3) {
        statNumbers[0].textContent = currentUser.stats.totalDays || 0;
        statNumbers[1].textContent = currentUser.stats.gamesPlayed || 0;
        statNumbers[2].textContent = currentUser.stats.accuracy ? `${currentUser.stats.accuracy}%` : '0%';
    }
}

// Анимации появления элементов
function initAppearanceAnimations() {
    // Показываем все заголовки сразу
    const sectionHeaders = document.querySelectorAll('.section-header');
    sectionHeaders.forEach(header => {
        header.style.opacity = '1';
        header.style.transform = 'none';
    });

    // Запускаем первую проверку пинга
    setTimeout(() => {
        simulatePingCheck();
    }, 1000);

    // Добавляем анимации при скролле
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

// Проверка пинга
function initPingCheck() {
    const checkPingBtn = document.getElementById('checkPingBtn');
    const pingValue = document.getElementById('pingValue');

    if (checkPingBtn && pingValue) {
        checkPingBtn.addEventListener('click', simulatePingCheck);
    }
}

// Симуляция проверки пинга
function simulatePingCheck() {
    const checkPingBtn = document.getElementById('checkPingBtn');
    const pingValue = document.getElementById('pingValue');
    const statusText = document.querySelector('.status-text');
    const indicators = document.querySelectorAll('.status-indicator');

    if (!checkPingBtn || !pingValue) return;

    // Если уже идет проверка, выходим
    if (checkPingBtn.classList.contains('checking')) return;

    checkPingBtn.classList.add('checking');
    checkPingBtn.disabled = true;

    // Сохраняем оригинальную высоту кнопки
    const originalHeight = checkPingBtn.offsetHeight;
    checkPingBtn.style.height = originalHeight + 'px';
    checkPingBtn.style.minHeight = originalHeight + 'px';

    // Обновляем контент без изменения высоты
    const originalContent = checkPingBtn.innerHTML;
    checkPingBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>Проверяем...</span>';

    // Устанавливаем фиксированную ширину для спиннера и текста
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

        // Восстанавливаем оригинальную высоту
        checkPingBtn.style.height = '';
        checkPingBtn.style.minHeight = '';

        checkPingBtn.style.opacity = '1';

        // Анимация успешной проверки
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

// Обработка покупки
function initBuyButtons() {
    const buyButtons = document.querySelectorAll('.buy-btn');

    buyButtons.forEach(button => {
        button.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            const planId = this.getAttribute('data-plan');

            if (planId) {
                openBuyModal(planId);
            }
        });
    });
}

// Модальное окно покупки
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

    // Симуляция оплаты
    setTimeout(async () => {
        try {
            // Здесь будет реальная интеграция с платежной системой
            // Пока используем симуляцию

            const planName = document.querySelector('#modalTitle')?.textContent?.replace('Оформление: ', '') || 'Про VPN';
            const planId = getPlanIdByName(planName);

            // Закрываем модальное окно
            modal.classList.remove('active');
            confirmBtn.disabled = false;
            confirmBtn.innerHTML = '<i class="fas fa-lock"></i> Перейти к оплате';

            // Показываем сообщение об успехе
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

// Оптимизация для мобильных
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

// Ripple эффект
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

// Функция для демо покупок
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

// Получение информации о тарифе
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