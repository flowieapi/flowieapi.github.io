// ============================================
// FLOWIE VPN - Telegram Mini App
// Полная версия с Firebase и Telegram интеграцией
// ============================================

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

// Глобальные переменные
let tg = null;
let app, db, auth;
let currentUser = null;
let userPurchases = [];
let userActiveSubscription = null;
let telegramUser = null;

// ============================================
// ОСНОВНАЯ ИНИЦИАЛИЗАЦИЯ
// ============================================

document.addEventListener('DOMContentLoaded', async function () {
    console.log('📱 FLOWIE VPN загружается...');
    
    // 1. Инициализация Telegram Web App
    if (window.Telegram?.WebApp) {
        tg = window.Telegram.WebApp;
        initTelegramWebApp();

        // Получаем данные пользователя Telegram
        telegramUser = tg.initDataUnsafe?.user;
        console.log('👤 Telegram пользователь:', telegramUser?.id || 'не найден');

        if (telegramUser) {
            // Обновляем профиль с данными из Telegram
            updateUserProfileFromTelegram(telegramUser);

            // Инициализируем аватар с seed из Telegram
            initTelegramAvatar(telegramUser);
        }
    }

    // 2. Инициализация Firebase (раскомментируйте когда добавите свои ключи)
    // await initFirebase();
    
    // 3. Загрузка демо данных пока нет Firebase
    loadDemoData();

    // 4. Запуск анимаций появления
    initAppearanceAnimations();

    // 5. Остальная инициализация
    initPingCheck();
    initBuyButtons();
    initModals();

    // 6. Оптимизации для мобильных
    optimizeMobileExperience();

    // 7. Обновление UI с данными пользователя
    updateUserInterface();
    
    console.log('✅ FLOWIE VPN готов к работе!');
});

// ============================================
// TELEGRAM WEB APP ИНТЕГРАЦИЯ
// ============================================

function initTelegramWebApp() {
    if (!tg) {
        console.log('⚠️ Telegram Web App не доступен');
        return;
    }

    console.log('🔗 Инициализация Telegram Web App...');

    // Расширяем приложение на весь экран
    if (tg.expand) {
        tg.expand();
        console.log('📱 Приложение расширено на весь экран');
    }

    // Настраиваем кнопку "Назад" для страниц кроме главной
    const currentPath = window.location.pathname;
    const isMainPage = currentPath.includes('index.html') || 
                       currentPath.endsWith('/') || 
                       currentPath.endsWith('index.html');
    
    if (tg.BackButton && !isMainPage) {
        console.log('◀️ Показываем кнопку "Назад"');
        tg.BackButton.show();
        tg.BackButton.onClick(() => {
            console.log('← Нажата кнопка "Назад"');
            window.history.back();
        });
    }

    // Устанавливаем тему Telegram
    applyTelegramTheme();

    // Подписываемся на изменения темы
    tg.onEvent('themeChanged', applyTelegramTheme);
    
    // Включаем индикатор загрузки
    if (tg.MainButton) {
        tg.MainButton.hide();
    }

    // Синхронизируем аватар Telegram
    if (telegramUser) {
        console.log('🔄 Синхронизация аватара Telegram...');
        
        // Пробуем загрузить сохраненный аватар
        const loadedFromCache = loadSavedAvatar();
        
        // Если не загрузили из кэша или прошло много времени, обновляем
        if (!loadedFromCache || !document.querySelector('.telegram-synced')) {
            console.log('🖼️ Обновляем аватар Telegram');
            setTimeout(() => {
                syncTelegramAvatar(telegramUser);
            }, 500);
        } else {
            console.log('💾 Используем аватар из кэша');
        }
        
        // Сохраняем данные пользователя
        currentUser = {
            telegramUser: telegramUser,
            lastAvatarUpdate: Date.now()
        };
    } else {
        console.log('👤 Пользователь Telegram не найден в initDataUnsafe');
    }

    // Готовим приложение
    if (tg.ready) {
        tg.ready();
        console.log('🎯 Telegram Web App готов');
    }
    
    // Логируем версию Telegram Web App
    console.log(`📊 Telegram Web App версия: ${tg.version}`);
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
        
        console.log('🎨 Применена тема Telegram');
    }
}

// Синхронизация аватара Telegram
function syncTelegramAvatar(user) {
    if (!user) return;
    
    console.log(`🖼️ Синхронизация аватара Telegram для пользователя: ${user.id}`);
    
    // Пытаемся получить аватар из Telegram
    let telegramAvatarUrl = null;
    
    // Если у пользователя есть фото в Telegram
    if (user.photo_url) {
        telegramAvatarUrl = user.photo_url;
        console.log('📸 Используем фото из Telegram');
    }
    
    // Или создаем аватар на основе данных Telegram
    if (!telegramAvatarUrl) {
        const userId = user.id.toString();
        telegramAvatarUrl = `https://api.dicebear.com/7.x/thumbs/svg?seed=telegram_${userId}&backgroundColor=0088cc,34b7f1,00ff88&backgroundType=gradientLinear`;
        console.log('🎨 Создаем аватар на основе ID');
    }
    
    // Обновляем все аватары на странице
    const avatars = document.querySelectorAll('.user-avatar img, .profile-avatar-large img');
    console.log(`🖼️ Найдено аватаров для обновления: ${avatars.length}`);
    
    avatars.forEach((avatar, index) => {
        console.log(`🔄 Обновление аватара ${index + 1}...`);
        
        // Устанавливаем новый источник
        avatar.src = telegramAvatarUrl;
        
        // Добавляем обработчик ошибок
        avatar.onerror = function() {
            console.log(`❌ Ошибка загрузки аватара ${index + 1}, используем fallback`);
            // Fallback если изображение не загрузилось
            const userId = user.id.toString();
            this.src = `https://api.dicebear.com/7.x/thumbs/svg?seed=fallback_${userId}_${Date.now()}&backgroundColor=00ff88,00ccff,9d4edd&backgroundType=gradientLinear`;
        };
        
        // Добавляем стиль для плавной загрузки
        avatar.style.opacity = '0';
        setTimeout(() => {
            avatar.style.transition = 'opacity 0.3s ease';
            avatar.style.opacity = '1';
        }, 100);
        
        // Добавляем класс для стилей Telegram
        const avatarContainer = avatar.closest('.user-avatar, .profile-avatar-large');
        if (avatarContainer) {
            avatarContainer.classList.add('telegram-synced');
        }
    });
    
    // Сохраняем аватар в localStorage для кэширования
    try {
        const cacheData = {
            url: telegramAvatarUrl,
            userId: user.id.toString(),
            timestamp: Date.now()
        };
        localStorage.setItem('telegram_avatar_cache', JSON.stringify(cacheData));
        console.log('💾 Аватар сохранен в кэш');
    } catch (e) {
        console.log('❌ Не удалось сохранить аватар в localStorage:', e);
    }
}

// Загрузка сохраненного аватара
function loadSavedAvatar() {
    try {
        const cacheData = localStorage.getItem('telegram_avatar_cache');
        if (cacheData) {
            const { url, userId, timestamp } = JSON.parse(cacheData);
            
            // Проверяем не устарели ли данные (больше 24 часов)
            const cacheAge = Date.now() - timestamp;
            const maxAge = 24 * 60 * 60 * 1000; // 24 часа
            
            if (cacheAge < maxAge) {
                console.log(`💾 Загружаем аватар из кэша (возраст: ${Math.floor(cacheAge / 1000 / 60)} минут)`);
                
                const avatars = document.querySelectorAll('.user-avatar img, .profile-avatar-large img');
                avatars.forEach(avatar => {
                    avatar.src = url;
                    const container = avatar.closest('.user-avatar, .profile-avatar-large');
                    if (container) {
                        container.classList.add('telegram-synced');
                    }
                });
                return true;
            } else {
                console.log('🕐 Кэш устарел, требуется обновление');
                localStorage.removeItem('telegram_avatar_cache');
            }
        }
    } catch (e) {
        console.log('❌ Ошибка загрузки из кэша:', e);
    }
    return false;
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

// Обновление профиля из данных Telegram
function updateUserProfileFromTelegram(user) {
    if (!user) return;

    console.log('📝 Обновление профиля из данных Telegram');

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

// ============================================
// FIREBASE ИНТЕГРАЦИЯ
// ============================================

// Инициализация Firebase
async function initFirebase() {
    try {
        console.log('🔥 Инициализация Firebase...');
        
        if (!firebase.apps.length) {
            app = firebase.initializeApp(firebaseConfig);
            auth = firebase.auth();
            db = firebase.firestore();

            // Настройка авторизации через Telegram
            await setupTelegramAuth();
            console.log('✅ Firebase инициализирован');
        }
    } catch (error) {
        console.error('❌ Ошибка инициализации Firebase:', error);
        loadDemoData();
    }
}

// Настройка авторизации через Telegram
async function setupTelegramAuth() {
    if (!tg?.initDataUnsafe?.user) {
        console.log('⚠️ Пользователь Telegram не найден для Firebase');
        return;
    }

    const telegramUser = tg.initDataUnsafe.user;
    const userId = telegramUser.id.toString();

    try {
        console.log(`👤 Настройка авторизации для пользователя ${userId}...`);

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

            console.log('🆕 Новый пользователь создан в Firebase');
        } else {
            // Обновляем время последнего входа
            await userRef.update({
                lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
                lastSeen: new Date().toISOString()
            });
            console.log('🔄 Обновлено время входа пользователя');
        }

        // Загружаем данные пользователя
        await loadUserData(userId);

    } catch (error) {
        console.error('❌ Ошибка авторизации Firebase:', error);
        loadDemoData();
    }
}

// Загрузка данных пользователя из Firebase
async function loadUserData(userId) {
    try {
        console.log(`📥 Загрузка данных пользователя ${userId}...`);
        
        // Загружаем пользователя
        const userDoc = await db.collection('users').doc(userId).get();
        if (userDoc.exists) {
            currentUser = { id: userId, ...userDoc.data() };
            console.log('✅ Данные пользователя загружены');

            // Загружаем покупки пользователя
            await loadUserPurchases(userId);

            // Обновляем интерфейс
            updateUserInterface();
        }
    } catch (error) {
        console.error('❌ Ошибка загрузки данных пользователя:', error);
        loadDemoData();
    }
}

// Загрузка покупок пользователя
async function loadUserPurchases(userId) {
    try {
        console.log(`🛒 Загрузка покупок пользователя ${userId}...`);
        
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

        console.log(`✅ Загружено покупок: ${userPurchases.length}`);

        // Обновляем UI покупок
        updatePurchasesUI();
        updateProfileSubscriptionUI();

    } catch (error) {
        console.error('❌ Ошибка загрузки покупок:', error);
        // Используем демо данные
        loadDemoPurchases();
    }
}

// ============================================
// UI ФУНКЦИИ
// ============================================

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
        
        console.log('✅ Активная подписка отображена');
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
        
        console.log('ℹ️ Нет активной подписки');
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

// ============================================
// ДЕМО ДАННЫЕ
// ============================================

// Демо данные (используются если нет Telegram или Firebase)
function loadDemoData() {
    console.log('🎮 Загружаем демо данные...');

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
    
    console.log('✅ Демо данные загружены');
}

// Функция для демо покупок
function loadDemoPurchases() {
    console.log('🛍️ Загрузка демо покупок...');
    
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
    
    console.log('✅ Демо покупки загружены');
}

// Обновление интерфейса пользователя
function updateUserInterface() {
    if (!currentUser) return;

    // Обновляем статистику в профиле
    updateProfileStats();

    // Обновляем заголовки
    updatePageHeaders();
    
    console.log('🎨 UI пользователя обновлен');
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

// ============================================
// АНИМАЦИИ И UI ЭФФЕКТЫ
// ============================================

// Анимации появления элементов
function initAppearanceAnimations() {
    console.log('🎬 Инициализация анимаций...');
    
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

    // Добавляем бейдж демо данных
    if (!window.Telegram?.WebApp?.initDataUnsafe?.user) {
        setTimeout(() => {
            const demoBadge = document.createElement('div');
            demoBadge.className = 'demo-badge';
            demoBadge.textContent = '📱 Демо режим (Telegram не обнаружен)';
            document.body.appendChild(demoBadge);
            
            setTimeout(() => {
                demoBadge.style.opacity = '0';
                setTimeout(() => demoBadge.remove(), 500);
            }, 3000);
        }, 2000);
    }

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

    document.querySelectorAll('.tariff-card, .benefit-card').forEach(card => {
        observer.observe(card);
    });
    
    console.log('✅ Анимации инициализированы');
}

// ============================================
// ПРОВЕРКА ПИНГА
// ============================================

// Проверка пинга
function initPingCheck() {
    const checkPingBtn = document.getElementById('checkPingBtn');
    const pingValue = document.getElementById('pingValue');

    if (checkPingBtn && pingValue) {
        checkPingBtn.addEventListener('click', simulatePingCheck);
        console.log('📡 Кнопка проверки пинга инициализирована');
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
    
    console.log('🔄 Начало проверки пинга...');
    
    // Добавляем класс для стилизации
    checkPingBtn.classList.add('checking');
    checkPingBtn.disabled = true;
    
    // Сохраняем оригинальный текст
    const originalHTML = checkPingBtn.innerHTML;
    checkPingBtn.innerHTML = `
        <i class="fas fa-spinner fa-spin"></i>
        <span>Проверяем...</span>
    `;
    
    // Сброс текущего значения
    pingValue.style.transition = 'opacity 0.3s ease';
    pingValue.style.opacity = '0.5';
    
    let dots = 0;
    const interval = setInterval(() => {
        const display = '•'.repeat(dots + 1) + ' '.repeat(2 - dots);
        pingValue.textContent = display;
        dots = (dots + 1) % 3;
    }, 300);
    
    const delay = 1500 + Math.random() * 1000;
    
    setTimeout(() => {
        clearInterval(interval);
        
        // Генерируем реалистичный пинг
        let randomPing;
        if (Math.random() > 0.7) {
            // Отличное соединение
            randomPing = Math.floor(Math.random() * 8) + 8; // 8-15 мс
        } else if (Math.random() > 0.4) {
            // Хорошее соединение
            randomPing = Math.floor(Math.random() * 10) + 16; // 16-25 мс
        } else {
            // Нормальное соединение
            randomPing = Math.floor(Math.random() * 10) + 26; // 26-35 мс
        }
        
        console.log(`📊 Пинг проверен: ${randomPing}мс`);
        
        // Плавное отображение нового значения
        pingValue.style.opacity = '0';
        setTimeout(() => {
            pingValue.textContent = randomPing;
            pingValue.style.opacity = '1';
            
            // Обновляем статус
            updatePingStatus(randomPing, statusText, indicators);
            
            // Анимация успеха
            pingValue.style.transform = 'scale(1.15)';
            setTimeout(() => {
                pingValue.style.transform = 'scale(1)';
            }, 200);
            
            // Восстанавливаем кнопку
            checkPingBtn.classList.remove('checking');
            checkPingBtn.disabled = false;
            checkPingBtn.innerHTML = originalHTML;
            
            // Показываем уведомление
            setTimeout(() => {
                if (randomPing <= 15) {
                    showNotification(`Пинг ${randomPing}мс! Идеальное соединение 🚀`, 'success');
                } else if (randomPing <= 25) {
                    showNotification(`Пинг ${randomPing}мс. Хорошее соединение ⚡`, 'info');
                } else {
                    showNotification(`Пинг ${randomPing}мс. VPN может улучшить соединение 📊`, 'info');
                }
            }, 500);
            
        }, 200);
        
    }, delay);
}

// Обновление статуса пинга
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

// ============================================
// ПОКУПКИ И ОПЛАТА
// ============================================

// Обработка покупки
function initBuyButtons() {
    const buyButtons = document.querySelectorAll('.buy-btn');

    buyButtons.forEach(button => {
        button.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            const planId = this.getAttribute('data-plan');

            if (planId) {
                console.log(`🛒 Нажата кнопка покупки: ${planId}`);
                openBuyModal(planId);
            }
        });
    });
    
    console.log(`✅ Инициализировано кнопок покупки: ${buyButtons.length}`);
}

// Модальное окно покупки
function initModals() {
    const modal = document.querySelector('.modal-overlay');
    const closeBtn = document.querySelector('.modal-close');
    const confirmBtn = document.getElementById('confirmBuyBtn');

    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            modal.classList.remove('active');
            console.log('❌ Модальное окно закрыто');
        });
    }

    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
                console.log('❌ Модальное окно закрыто (клик по фону)');
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
            console.log('❌ Модальное окно закрыто (Escape)');
        }
    });
    
    console.log('✅ Модальные окна инициализированы');
}

// Открытие модального окна покупки
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
    console.log(`📋 Открыто модальное окно покупки: ${plan.name}`);
}

// Обработка оплаты
async function processPayment() {
    const modal = document.querySelector('.modal-overlay');
    const confirmBtn = document.getElementById('confirmBuyBtn');
    const modalBody = document.querySelector('.modal-body');
    
    if (!confirmBtn || !modalBody) return;
    
    console.log('💳 Начало процесса оплаты...');
    
    // Сохраняем оригинальное содержимое модалки
    const originalContent = modalBody.innerHTML;
    
    confirmBtn.disabled = true;
    confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Обработка...';
    
    // Симуляция оплаты с более реалистичной задержкой
    setTimeout(async () => {
        try {
            // Закрываем модальное окно
            modal.classList.remove('active');
            
            // Сброс кнопки
            confirmBtn.disabled = false;
            confirmBtn.innerHTML = '<i class="fas fa-lock"></i> Перейти к оплате';
            
            console.log('✅ Оплата успешно обработана');
            
            // Показываем сообщение об успехе
            setTimeout(() => {
                // Восстанавливаем модалку в исходное состояние
                modalBody.innerHTML = originalContent;
                
                // Показываем success модалку
                showSuccessModal();
            }, 300);
            
        } catch (error) {
            console.error('❌ Ошибка оплаты:', error);
            confirmBtn.disabled = false;
            confirmBtn.innerHTML = '<i class="fas fa-lock"></i> Перейти к оплате';
            
            // Восстанавливаем содержимое
            modalBody.innerHTML = originalContent;
            
            // Показываем ошибку
            showNotification('Ошибка оплаты. Попробуйте еще раз', 'error');
        }
    }, 2000);
}

// Получение ID тарифа по имени
function getPlanIdByName(name) {
    const plans = {
        'Лайт VPN': 'light',
        'Про VPN': 'pro',
        'Флоуи VPN': 'flowi'
    };
    return plans[name] || 'light';
}

// ============================================
// УВЕДОМЛЕНИЯ И СООБЩЕНИЯ
// ============================================

// Показ успешной оплаты
function showSuccessModal() {
    const modal = document.getElementById('buyModal');
    const modalBody = document.querySelector('.modal-body');
    
    if (!modal || !modalBody) return;
    
    modalBody.innerHTML = `
        <div class="modal-success">
            <div class="success-icon">
                <i class="fas fa-check"></i>
            </div>
            <h3>Оплата успешна!</h3>
            <p>Данные для подключения VPN отправлены в личные сообщения Telegram.</p>
            <div class="payment-info">
                <p><i class="fas fa-info-circle"></i> Проверьте чат с ботом</p>
            </div>
            <button class="simple-btn btn-primary" id="closeSuccessBtn">
                <i class="fas fa-check"></i> Отлично!
            </button>
        </div>
    `;
    
    modal.classList.add('active');
    console.log('🎉 Показано окно успешной оплаты');
    
    // Обработчик закрытия
    document.getElementById('closeSuccessBtn')?.addEventListener('click', () => {
        modal.classList.remove('active');
        
        // Восстанавливаем обычную модалку через 300мс
        setTimeout(() => {
            const originalContent = `
                <div class="selected-plan" id="selectedPlanInfo"></div>
                <div class="payment-section">
                    <h4><i class="fas fa-credit-card"></i> Способ оплаты</h4>
                    <div class="payment-methods">
                        <label class="payment-method active">
                            <input type="radio" name="payment" checked>
                            <div class="payment-icon">
                                <i class="fab fa-cc-visa"></i>
                            </div>
                            <span>Карта</span>
                        </label>
                    </div>
                </div>
                <button class="simple-btn btn-primary" id="confirmBuyBtn">
                    <i class="fas fa-lock"></i> Перейти к оплате
                </button>
            `;
            modalBody.innerHTML = originalContent;
            
            // Реинициализируем кнопку
            const newConfirmBtn = document.getElementById('confirmBuyBtn');
            if (newConfirmBtn) {
                newConfirmBtn.addEventListener('click', processPayment);
            }
        }, 300);
    });
}

// Показ уведомлений
function showNotification(message, type = 'info') {
    console.log(`📢 Уведомление (${type}): ${message}`);
    
    // Создаем элемент уведомления если его нет
    let notification = document.getElementById('notification');
    if (!notification) {
        notification = document.createElement('div');
        notification.id = 'notification';
        document.body.appendChild(notification);
    }
    
    // Устанавливаем иконку в зависимости от типа
    let icon = 'info-circle';
    if (type === 'success') icon = 'check-circle';
    if (type === 'error') icon = 'exclamation-circle';
    
    // Обновляем содержимое
    notification.innerHTML = `
        <i class="fas fa-${icon}"></i>
        <span>${message}</span>
    `;
    
    // Устанавливаем классы
    notification.className = '';
    notification.classList.add(type);
    
    // Показываем уведомление
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // Автоматическое скрытие
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.className = '';
        }, 300);
    }, 3000);
}

// ============================================
// ОПТИМИЗАЦИЯ ДЛЯ МОБИЛЬНЫХ
// ============================================

// Оптимизация для мобильных
function optimizeMobileExperience() {
    console.log('📱 Оптимизация для мобильных устройств...');
    
    // Автофокус на полях ввода
    document.addEventListener('touchstart', function (e) {
        if (e.target.matches('input, select, textarea')) {
            setTimeout(() => {
                e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100);
        }
    });

    // Установка корректной высоты viewport
    function setVH() {
        let vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
    }

    setVH();
    window.addEventListener('resize', setVH);
    window.addEventListener('orientationchange', setVH);

    // Ripple эффект для кнопок
    document.addEventListener('click', function (e) {
        if (e.target.closest('.simple-btn')) {
            createRipple(e, e.target.closest('.simple-btn'));
        }
    });
    
    console.log('✅ Мобильная оптимизация завершена');
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

// ============================================
// ДОПОЛНИТЕЛЬНЫЕ ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================

// Функция для проверки мобильного устройства
function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// Функция для получения параметров из URL
function getQueryParam(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
}

// Функция для форматирования чисел (например, для цен)
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

// Функция для копирования текста в буфер обмена
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showNotification('Скопировано в буфер обмена', 'success');
    }).catch(err => {
        console.error('Ошибка копирования:', err);
        showNotification('Не удалось скопировать', 'error');
    });
}

// Функция для генерации случайного цвета
function getRandomColor() {
    const colors = ['#00ff88', '#00ccff', '#9d4edd', '#ff6b6b', '#ffd166', '#06d6a0'];
    return colors[Math.floor(Math.random() * colors.length)];
}

// ============================================
// ЭКСПОРТ ФУНКЦИЙ ДЛЯ ДЕБАГА
// ============================================

// Для отладки в консоли браузера
window.FLOWIE = {
    checkPing: simulatePingCheck,
    showNotification: showNotification,
    openBuyModal: openBuyModal,
    getUser: () => currentUser,
    getTelegramUser: () => telegramUser,
    getPurchases: () => userPurchases,
    reloadDemoData: loadDemoData,
    clearCache: () => {
        localStorage.removeItem('telegram_avatar_cache');
        console.log('🗑️ Кэш очищен');
    }
};

console.log('🚀 FLOWIE VPN полностью загружен и готов к работе!');
console.log('ℹ️ Для отладки используйте window.FLOWIE в консоли');