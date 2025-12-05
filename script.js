// Конфигурация Firebase (замените на свои данные)
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Инициализация приложения
let app, db, auth;
let currentUser = null;
let userPurchases = [];
let userActiveSubscription = null;

document.addEventListener('DOMContentLoaded', async function() {
    // Инициализация Telegram Web App
    if (window.Telegram?.WebApp) {
        initTelegramWebApp();
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
                lastLogin: firebase.firestore.FieldValue.serverTimestamp()
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
            <div class="glass-card" style="text-align: center; padding: 2rem;">
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
        const renewBtn = subscriptionCard.querySelector('.glass-btn');
        if (renewBtn) renewBtn.style.display = 'none';
    } else {
        subscriptionCard.classList.add('hidden');
        
        // Показываем заглушку если нет подписки
        if (!subscriptionPlaceholder) {
            const placeholder = document.createElement('div');
            placeholder.className = 'glass-card no-subscription-card';
            placeholder.style.textAlign = 'center';
            placeholder.style.padding = '2rem';
            placeholder.innerHTML = `
                <i class="fas fa-shield-alt" style="font-size: 3rem; color: var(--text-tertiary); margin-bottom: 1rem;"></i>
                <h3 style="color: var(--text-primary); margin-bottom: 0.5rem;">Нет активной подписки</h3>
                <p style="color: var(--text-secondary); margin-bottom: 1.5rem;">Выберите тариф VPN для максимальной производительности</p>
                <a href="index.html" class="glass-btn btn-primary">
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

// Демо данные
function loadDemoData() {
    console.log('Загружаем демо данные');
    currentUser = {
        id: 'demo_user',
        username: 'demo_user',
        firstName: 'Demo',
        lastName: 'User',
        stats: {
            totalSpent: 2196,
            totalDays: 120,
            gamesPlayed: 0,
            accuracy: 0,
            pingSaved: 67,
            timeSaved: 47
        }
    };
    
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

// Обновление заголовков страниц
function updatePageHeaders() {
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
    
    document.querySelectorAll('.glass-card').forEach(card => {
        observer.observe(card);
    });
}

// Инициализация Telegram Web App
const tg = window.Telegram?.WebApp;

function initTelegramWebApp() {
    if (!tg) return;
    
    console.log('Telegram Web App инициализирован');
    
    if (tg.expand) {
        tg.expand();
    }
    
    if (tg.BackButton && !window.location.pathname.includes('index.html')) {
        tg.BackButton.show();
        tg.BackButton.onClick(() => {
            window.history.back();
        });
    }
    
    if (tg.ready) {
        tg.ready();
    }
}

// Проверка пинга
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
    
    // Если уже идет проверка, выходим
    if (checkPingBtn.classList.contains('checking')) return;
    
    checkPingBtn.classList.add('checking');
    checkPingBtn.disabled = true;
    checkPingBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Проверяем...';
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
        checkPingBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Проверить сейчас';
        checkPingBtn.style.opacity = '1';
        
        showNotification(`Пинг проверен: ${randomPing} мс`, 'success');
        
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
        indicator.style.height = '22px';
    });
    
    if (ping <= 15) {
        statusText.textContent = 'Идеальное соединение!';
        statusText.style.color = 'var(--success-color)';
        indicators[0].classList.add('active');
        indicators[0].style.height = '32px';
    } else if (ping <= 25) {
        statusText.textContent = 'Отличное соединение';
        statusText.style.color = 'var(--info-color)';
        indicators[1].classList.add('active');
        indicators[1].style.height = '28px';
    } else {
        statusText.textContent = 'Хорошее соединение';
        statusText.style.color = 'var(--warning-color)';
        indicators[2].classList.add('active');
        indicators[2].style.height = '24px';
    }
}

// Обработка покупки
function initBuyButtons() {
    const buyButtons = document.querySelectorAll('.buy-btn');
    
    buyButtons.forEach(button => {
        button.addEventListener('click', function(e) {
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
            <div class="plan-header" style="border-left: 4px solid ${plan.color}; padding-left: 1rem; margin-bottom: 1.5rem;">
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
    
    notification.className = 'notification';
    if (type === 'success') {
        notification.style.background = 'rgba(0, 255, 136, 0.15)';
        notification.style.borderColor = 'rgba(0, 255, 136, 0.3)';
    } else if (type === 'error') {
        notification.style.background = 'rgba(255, 71, 87, 0.15)';
        notification.style.borderColor = 'rgba(255, 71, 87, 0.3)';
    }
    
    notification.innerHTML = `
        <div style="display: flex; align-items: center; gap: 0.75rem;">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}" 
               style="color: ${type === 'success' ? 'var(--success-color)' : type === 'error' ? 'var(--danger-color)' : 'var(--info-color)'}">
            </i>
            <span>${message}</span>
        </div>
    `;
    
    notification.classList.add('show');
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// Оптимизация для мобильных
function optimizeMobileExperience() {
    document.addEventListener('touchstart', function(e) {
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
    
    document.addEventListener('click', function(e) {
        if (e.target.closest('.glass-btn')) {
            createRipple(e, e.target.closest('.glass-btn'));
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