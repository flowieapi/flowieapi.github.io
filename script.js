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
    initNotifications();

    // Оптимизации для мобильных
    optimizeMobileExperience();

    // Обновление UI с данными пользователя
    updateUserInterface();
});

// Инициализация Telegram Web App
const tg = window.Telegram?.WebApp;


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
            img.onerror = function() {
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


function initTelegramWebApp() {
    if (!tg) return;

    console.log('Telegram Web App инициализирован');

    // Расширяем приложение на весь экран
    if (tg.expand) {
        tg.expand();
    }

    // Настраиваем кнопку "Назад" для страниц кроме главной
    if (tg.BackButton && !window.location.pathname.includes('index.html') && !window.location.pathname.endsWith('/')) {
        tg.BackButton.show();
        tg.BackButton.onClick(() => {
            window.history.back();
        });
    }

    // Устанавливаем тему Telegram
    applyTelegramTheme();

    // Подписываемся на изменения темы
    tg.onEvent('themeChanged', applyTelegramTheme);

    // Синхронизируем аватар Telegram
    const telegramUser = window.Telegram.WebApp.initDataUnsafe?.user;
    if (telegramUser) {
        // Пробуем загрузить сохраненный аватар
        const loadedFromCache = loadSavedAvatar();
        
        // Если не загрузили из кэша или прошло много времени, обновляем
        if (!loadedFromCache) {
            syncTelegramAvatar(telegramUser);
        }
        
        // Сохраняем данные пользователя для обновления аватара при необходимости
        currentUser = {
            telegramUser: telegramUser,
            lastAvatarUpdate: Date.now()
        };
    }

    // Готовим приложение
    if (tg.ready) {
        tg.ready();
    }
}

// Применение темы Telegram
function applyTelegramTheme() {
    if (!tg) return;

    const themeParams = tg.themeParams;

    if (themeParams) {
        // Применяем цвета из темы Telegram
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
    try {
        // Импорт Firebase (добавьте в HTML)
        // <script src="https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js"></script>
        // <script src="https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js"></script>
        // <script src="https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js"></script>

        if (!firebase.apps.length) {
            app = firebase.initializeApp(firebaseConfig);
            auth = firebase.auth();
            db = firebase.firestore();

            // Настройка авторизации через Telegram
            await setupTelegramAuth();
        }
    } catch (error) {
        console.error('Ошибка инициализации Firebase:', error);
        loadDemoData();
    }
}

// Настройка авторизации через Telegram
async function setupTelegramAuth() {
    if (!tg?.initDataUnsafe?.user) {
        console.log('Пользователь Telegram не найден');
        return;
    }

    const telegramUser = tg.initDataUnsafe.user;
    const userId = telegramUser.id.toString();

    try {
        // Проверяем существование пользователя в Firebase
        const userRef = db.collection('users').doc(userId);
        const userDoc = await userRef.get();

        if (!userDoc.exists) {
            // Создаем нового пользователя
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
            // Обновляем время последнего входа
            await userRef.update({
                lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
                lastSeen: new Date().toISOString()
            });
        }

        // Загружаем данные пользователя
        await loadUserData(userId);

    } catch (error) {
        console.error('Ошибка авторизации:', error);
        loadDemoData();
    }
}

// Загрузка данных пользователя из Firebase
async function loadUserData(userId) {
    try {
        // Загружаем пользователя
        const userDoc = await db.collection('users').doc(userId).get();
        if (userDoc.exists) {
            currentUser = { id: userId, ...userDoc.data() };

            // Загружаем покупки пользователя
            await loadUserPurchases(userId);

            // Обновляем интерфейс
            updateUserInterface();
        }
    } catch (error) {
        console.error('Ошибка загрузки данных пользователя:', error);
        loadDemoData();
    }
}

// Загрузка покупок пользователя
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

            // Проверяем активную подписку
            if (purchase.status === 'active' && (!userActiveSubscription ||
                new Date(purchase.endDate) > new Date(userActiveSubscription.endDate))) {
                userActiveSubscription = purchase;
            }
        });

        // Обновляем UI покупок
        updatePurchasesUI();
        updateProfileSubscriptionUI();

    } catch (error) {
        console.error('Ошибка загрузки покупок:', error);
        // Используем демо данные
        loadDemoPurchases();
    }
}

// Обновление UI покупок
function updatePurchasesUI() {
    const purchasesList = document.querySelector('.purchases-list');
    const summaryStats = document.querySelector('.purchases-summary');

    if (!purchasesList || !summaryStats) return;

    // Очищаем список
    purchasesList.innerHTML = '';

    if (userPurchases.length === 0) {
        purchasesList.innerHTML = `
            <div class="simple-card" style="text-align: center; padding: 2rem;">
                <i class="fas fa-shopping-cart" style="font-size: 3rem; color: var(--text-tertiary); margin-bottom: 1rem;"></i>
                <h3 style="color: var(--text-primary); margin-bottom: 0.5rem;">Покупок пока нет</h3>
                <p style="color: var(--text-secondary);">Выберите подходящий тариф VPN</p>
            </div>
        `;

        // Скрываем статистику если нет покупок
        summaryStats.style.display = 'none';
        return;
    }

    // Показываем статистику
    summaryStats.style.display = 'block';

    // Рассчитываем статистику
    let totalSpent = 0;
    let activePurchases = 0;
    let totalDays = 0;

    userPurchases.forEach(purchase => {
        if (purchase.price) totalSpent += purchase.price;
        if (purchase.status === 'active') activePurchases++;

        // Расчет дней использования
        if (purchase.purchaseDate && purchase.endDate) {
            const start = new Date(purchase.purchaseDate.seconds * 1000);
            const end = new Date(purchase.endDate.seconds * 1000);
            const days = Math.floor((end - start) / (1000 * 60 * 60 * 24));
            totalDays += days;
        }
    });

    // Обновляем статистику
    const summaryItems = summaryStats.querySelectorAll('.summary-item');
    if (summaryItems[0]) summaryItems[0].querySelector('.summary-value').textContent = `${totalSpent} ₽`;
    if (summaryItems[1]) summaryItems[1].querySelector('.summary-value').textContent = `~${Math.floor(totalDays * 0.5)} часов`;
    if (summaryItems[2]) summaryItems[2].querySelector('.summary-value').textContent = '85 мс';
    if (summaryItems[3]) summaryItems[3].querySelector('.summary-value').textContent = '18 мс';

    // Добавляем покупки в список
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

// Обновление UI подписки в профиле
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

        // Убираем кнопку продления
        const renewBtn = subscriptionCard.querySelector('.simple-btn');
        if (renewBtn) renewBtn.style.display = 'none';
    } else {
        subscriptionCard.classList.add('hidden');

        // Показываем заглушку если нет подписки
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

// Форматирование даты
function formatDate(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
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

    // Обновляем детальную статистику если есть
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

// В функции simulatePingCheck заменим этот код:
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
        
        // Используем маленькое уведомление снизу
        showNotification(`Пинг: ${randomPing} мс`, 'success', 2000);
        
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

            // Обновляем UI покупки
            showNotification('Оплата успешно завершена!', 'success');

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
            showNotification('Ошибка оплаты. Попробуйте снова.', 'error');
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

// Уведомления
function initNotifications() {
    const notification = document.getElementById('notification');

    if (!notification) {
        const notificationEl = document.createElement('div');
        notificationEl.id = 'notification';
        notificationEl.className = 'notification';
        document.body.appendChild(notificationEl);
    }
}

function showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    
    if (!notification) return;
    
    // Удаляем предыдущее уведомление
    notification.classList.remove('show', 'success', 'error', 'info');
    notification.style.display = 'none';
    
    // Даем время на удаление анимации
    setTimeout(() => {
        // Устанавливаем тип и сообщение
        notification.className = 'notification';
        notification.classList.add(type);
        
        notification.innerHTML = `
            <div style="display: flex; align-items: center; gap: 0.75rem;">
                <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}" 
                   style="color: ${type === 'success' ? 'var(--success-color)' : type === 'error' ? '#ff4757' : 'var(--info-color)'}">
                </i>
                <span>${message}</span>
            </div>
        `;
        
        // Показываем уведомление
        notification.style.display = 'flex';
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        // Автоматическое скрытие через 3 секунды
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.style.display = 'none';
            }, 300);
        }, 3000);
    }, 50);
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