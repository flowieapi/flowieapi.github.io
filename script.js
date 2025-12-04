// Конфигурация Telegram бота
const BOT_TOKEN = '8164840278:AAFHOBOBc564w5VsVYbQEbdwB9srGbtZq_g';
const ADMIN_CHAT_ID = '7620973293';

// Инициализация Telegram Web App
let tg = window.Telegram.WebApp;
let user = null;
let isVPNConnected = false;
let currentServer = 'auto';
let selectedVPN = null;
let currentPaymentData = null;
let receiptFile = null;
let currentPurchaseId = null;
let db = null;

// ============ ОСНОВНЫЕ ФУНКЦИИ ============

// Инициализация приложения
document.addEventListener('DOMContentLoaded', async function () {
    console.log('Документ загружен, инициализация...');

    // Настройки для iOS стеклянного стиля
    if (tg && tg.expand) {
        console.log('Telegram WebApp обнаружен');
        tg.expand();
        tg.enableClosingConfirmation();
        tg.setHeaderColor('#000000');
        tg.setBackgroundColor('#000000');

        // Получаем данные пользователя
        user = tg.initDataUnsafe?.user || tg.initDataUnsafe?.sender;
        console.log('Пользователь Telegram:', user);
    } else {
        console.log('Telegram WebApp не обнаружен, запуск в режиме браузера');
        // Тестовые данные для браузера
        user = {
            id: 123456789,
            first_name: 'Тестовый Пользователь',
            username: 'test_user',
            photo_url: ''
        };
    }

    setupUserProfile();
    loadVPNCategories();
    updatePing();
    setupEvents();
    setupFixedScrollIndicator();
    setupTouchScrollIndicator();

    // Инициализируем Firebase
    const firebaseInitialized = await initFirebase();

    if (firebaseInitialized) {
        await loadUserData();
        setupRealTimePurchaseUpdates();
    } else {
        showNotification('⚠️ Работаем в оффлайн режиме');
    }

    // Тестируем соединения (в фоне)
    setTimeout(() => {
        testConnections();
    }, 3000);
});

async function testConnections() {
    console.log('=== ТЕСТ ПОДКЛЮЧЕНИЙ ===');

    // Тест Firebase
    let firebaseOk = false;
    try {
        if (db) {
            const testRef = db.collection('test').doc('test');
            await testRef.set({ test: new Date().toISOString() });
            await testRef.delete();
            firebaseOk = true;
            console.log('✅ Firebase: OK');
        }
    } catch (firebaseError) {
        console.error('❌ Firebase Error:', firebaseError);
    }

    // Тест Telegram
    let telegramOk = false;
    try {
        const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getMe`);
        const data = await response.json();
        telegramOk = data.ok;
        if (telegramOk) {
            console.log('✅ Telegram: OK');
        } else {
            console.error('❌ Telegram Error:', data);
        }
    } catch (telegramError) {
        console.error('❌ Telegram Connection Error:', telegramError);
    }

    // Тест ImgBB (только соединение)
    let imgbbOk = false;
    try {
        const response = await fetch('https://api.imgbb.com', { method: 'HEAD' });
        imgbbOk = response.ok;
        console.log(imgbbOk ? '✅ ImgBB: Доступен' : '❌ ImgBB: Недоступен');
    } catch (imgbbError) {
        console.error('❌ ImgBB Connection Error:', imgbbError);
    }

    console.log('=== РЕЗУЛЬТАТЫ ===');
    console.log('Firebase:', firebaseOk ? 'OK' : 'FAIL');
    console.log('Telegram:', telegramOk ? 'OK' : 'FAIL');
    console.log('ImgBB:', imgbbOk ? 'OK' : 'FAIL (не критично)');

    return { firebaseOk, telegramOk, imgbbOk };
}

// Инициализация Firebase
async function initFirebase() {
    try {
        console.log('Инициализация Firebase...');

        // Проверяем, загружена ли библиотека Firebase
        if (typeof firebase === 'undefined') {
            console.error('Firebase не загружен');
            return false;
        }

        // Проверяем, инициализировано ли уже приложение
        if (firebase.apps.length === 0) {
            console.error('Firebase не инициализирован');
            return false;
        }

        // Получаем Firestore
        if (firebase.firestore) {
            db = firebase.firestore();
            console.log('Firestore успешно инициализирован');
            return true;
        } else {
            console.error('Firestore недоступен');
            return false;
        }
    } catch (error) {
        console.error('Ошибка инициализации Firebase:', error);
        return false;
    }
}

// Добавить эту функцию в script.js после инициализации
function setupRealTimePurchaseUpdates() {
    if (!db) return;

    if (user && user.id) {
        // Подписываемся на обновления покупок пользователя
        db.collection('purchases')
            .where('user_id', '==', user.id.toString())
            .orderBy('timestamp', 'desc')
            .onSnapshot((snapshot) => {
                const updates = [];
                snapshot.docChanges().forEach((change) => {
                    if (change.type === 'modified' || change.type === 'added') {
                        const data = change.doc.data();
                        updates.push({
                            ...data,
                            firebase_id: change.doc.id
                        });
                    }
                });

                // Обновляем локальные данные
                if (updates.length > 0) {
                    updates.forEach(update => {
                        updateLocalPurchaseStatus(update.order_id, update.status, update);
                    });

                    // Обновляем UI
                    loadPurchases();
                    loadUserData();

                    // Показываем уведомления о подтверждении
                    updates.forEach(update => {
                        if (update.status === 'confirmed') {
                            showNotification(`✅ Ваш заказ ${update.order_id} подтвержден!`);
                            activateVPNSubscription(update);
                        }
                    });
                }
            }, (error) => {
                console.error('Ошибка real-time обновлений:', error);
            });
    }
}

// Добавить вызов в конец инициализации:
async function initializeFirebase() {
    try {
        await auth.signInAnonymously();
        console.log('Firebase аутентифицирован анонимно');

        // Загружаем покупки пользователя
        await loadUserPurchases();

        // Настраиваем real-time обновления
        setupRealTimePurchaseUpdates();

        return true;
    } catch (error) {
        console.error('Firebase auth error:', error);
        return false;
    }
}

async function loadUserPurchases() {
    if (!db) {
        console.log('Firestore не доступен');
        return;
    }

    try {
        if (user && user.id) {
            // Загружаем покупки пользователя из Firestore
            const snapshot = await db.collection('purchases')
                .where('user_id', '==', user.id.toString())
                .orderBy('timestamp', 'desc')
                .get();

            if (!snapshot.empty) {
                const purchases = [];
                snapshot.forEach(doc => {
                    const data = doc.data();
                    purchases.push({
                        ...data,
                        firebase_id: doc.id
                    });
                });

                // Сохраняем локально
                localStorage.setItem('flowie_purchases', JSON.stringify(purchases));

                // Обновляем UI
                loadPurchases();
                loadUserData();
            }
        }
    } catch (error) {
        console.error('Ошибка загрузки покупок:', error);
    }
}



// Настройка профиля игрока в хедере
function setupUserProfile() {
    const avatarImage = document.getElementById('avatar-image');
    const playerLevel = document.getElementById('player-level');

    if (!user) {
        avatarImage.innerHTML = '<i class="fas fa-user"></i>';
        playerLevel.textContent = '1';
        return;
    }

    // Создаем аватарку
    if (user.photo_url) {
        avatarImage.innerHTML = `
            <img src="${user.photo_url}" alt="${user.first_name}" 
                 onerror="this.onerror=null; this.parentElement.innerHTML='<i class=\\'fas fa-user\\'></i>';">
        `;
    } else {
        // Если нет фото, показываем инициалы
        const initials = (user.first_name?.[0] || 'U').toUpperCase();
        avatarImage.innerHTML = `
            <span style="font-weight: bold; font-size: 18px; color: white;">${initials}</span>
        `;
    }

    // Устанавливаем уровень
    playerLevel.textContent = getPlayerLevel();
}

// Получить уровень игрока на основе активности
function getPlayerLevel() {
    const purchases = JSON.parse(localStorage.getItem('flowie_purchases') || '[]');
    const confirmedPurchases = purchases.filter(p => p.status === 'confirmed');

    if (confirmedPurchases.length === 0) return 1;
    if (confirmedPurchases.length === 1) return 10;
    if (confirmedPurchases.length <= 3) return 25;
    if (confirmedPurchases.length <= 5) return 50;
    return 75;
}

// Загрузка VPN категорий
function loadVPNCategories() {
    const vpnCategories = [
        {
            id: 'cheap',
            name: 'Лайт VPN',
            icon: '🚀',
            price: 299,
            color: 'cheap',
            features: [
                'Пинг 35-25ms',
                'Стабильное соединение',
                'Базовые сервера',
                'Поддержка в чате'
            ],
            description: 'Для комфортной игры'
        },
        {
            id: 'medium',
            name: 'Про VPN',
            icon: '⚡',
            price: 799,
            color: 'medium',
            features: [
                'Пинг 25-18ms',
                'Регистрация урона',
                'Точные хедшоты',
                'Приоритетные сервера',
                'Быстрая поддержка'
            ],
            description: 'Для конкурентной игры'
        },
        {
            id: 'vip',
            name: 'Vip VPN',
            icon: '👑',
            price: 1499,
            color: 'vip',
            features: [
                'Пинг 18-12ms',
                'Все фичи предыдущих тарифов',
                'Эксклюзивные сервера',
                'Приоритет на матчмейкинге',
                'VIP поддержка 24/7',
                'Автоподбор сервера',
                'Анти-лаг защита',
                'Статистика игр'
            ],
            description: 'Для киберспортсменов'
        }
    ];

    displayVPNCategories(vpnCategories);
}

// Отображение категорий VPN
function displayVPNCategories(categories) {
    const container = document.getElementById('categories-container');
    if (!container) return;

    container.innerHTML = categories.map(category => `
        <div class="vpn-category-card">
            <div class="category-header">
                <div class="category-name">
                    <div class="category-icon">${category.icon}</div>
                    <h3>${category.name}</h3>
                </div>
                <div class="category-price">${category.price}₽</div>
            </div>
            
            <div class="category-features">
                ${category.features.slice(0, 3).map(feature => `
                    <div class="feature-item">
                        <i class="fas fa-check-circle"></i>
                        <span>${feature}</span>
                    </div>
                `).join('')}
            </div>
            
            <p style="color: var(--ios-text-secondary); font-size: 12px; margin-bottom: 16px;">
                ${category.description}
            </p>
            
            <button class="category-btn" onclick="buyVPN('${category.id}')">
                <i class="fas fa-shopping-cart"></i>
                Купить
            </button>
        </div>
    `).join('');
}

// Покупка VPN
function buyVPN(categoryId) {
    const categories = {
        'cheap': { name: 'VPN Дешевый', price: 299, icon: '🚀', color: '#30D158' },
        'medium': { name: 'VPN Средний', price: 799, icon: '⚡', color: '#30D158' },
        'vip': { name: 'VPN ВИП', price: 1499, icon: '👑', color: '#30D158' }
    };

    const category = categories[categoryId];
    if (!category) return;

    // Генерируем уникальный ID заказа
    const orderId = generateOrderId();
    currentPurchaseId = orderId;

    currentPaymentData = {
        id: categoryId,
        name: category.name,
        price: category.price,
        order_id: orderId,
        timestamp: Date.now()
    };

    showPayment(category);
}

// Генерация уникального ID заказа
function generateOrderId() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    return `FLOWIE-${timestamp}-${random}`.toUpperCase();
}

// Показать окно оплаты
function showPayment(category) {
    const paymentContent = document.getElementById('payment-content');
    if (!paymentContent) return;

    paymentContent.innerHTML = `
        <div class="payment-info">
            <h4 style="font-size: 20px; font-weight: 700; color: white; margin-bottom: 8px; text-align: center;">
                ${category.icon} ${category.name}
            </h4>
            <p style="color: var(--ios-text-secondary); text-align: center; margin-bottom: 20px;">
                Сумма к оплате: <strong style="color: #30D158; font-size: 24px;">${category.price}₽</strong>
            </p>
            <div style="background: rgba(48, 209, 88, 0.1); padding: 8px 12px; border-radius: 8px; margin-bottom: 16px;">
                <div style="font-size: 12px; color: #30D158; text-align: center;">
                    Номер заказа: <strong>${currentPurchaseId}</strong>
                </div>
            </div>
        </div>
        
        <div class="payment-details">
            <h4 style="font-size: 16px; font-weight: 600; color: white; margin-bottom: 16px;">
                <i class="fas fa-credit-card"></i>
                Реквизиты для оплаты
            </h4>
            
            <div class="bank-card">
                <div style="color: var(--ios-text-secondary); font-size: 12px; margin-bottom: 8px;">
                    Банковская карта Тинькофф
                </div>
                <div class="card-number">2200 7013 3827 9851</div>
                <div class="card-info">
                    <div>
                        <div style="color: var(--ios-text-secondary); font-size: 10px;">Получатель</div>
                        <div style="color: white; font-weight: 600;">Исбагиев И.</div>
                    </div>
                    <div>
                        <div style="color: var(--ios-text-secondary); font-size: 10px;">Банк</div>
                        <div style="color: white; font-weight: 600;">Тинькофф</div>
                    </div>
                </div>
            </div>
            
            <div style="color: var(--ios-text-secondary); font-size: 12px; text-align: center; margin-top: 12px; padding: 12px; background: rgba(48, 209, 88, 0.1); border-radius: 8px;">
                ⚠️ В комментарии к переводу укажите: <strong>${currentPurchaseId}</strong>
            </div>
        </div>
        
        <div class="payment-steps">
            <div class="step">
                <div class="step-number">1</div>
                <div class="step-content">
                    <h4>Оплатите по реквизитам</h4>
                    <p>Переведите ${category.price}₽ на указанную карту</p>
                </div>
            </div>
            
            <div class="step">
                <div class="step-number">2</div>
                <div class="step-content">
                    <h4>Сделайте скриншот</h4>
                    <p>Захватите в кадр сумму и номер транзакции</p>
                </div>
            </div>
            
            <div class="step">
                <div class="step-number">3</div>
                <div class="step-content">
                    <h4>Отправьте чек</h4>
                    <p>Загрузите скриншот для проверки</p>
                </div>
            </div>
        </div>
        
        <button class="btn-pay-now" onclick="openReceiptUpload()">
            <i class="fas fa-receipt"></i>
            Я оплатил, отправить чек
        </button>
        
        <div style="margin-top: 20px; padding: 16px; background: rgba(0, 0, 0, 0.2); border-radius: 12px;">
            <h4 style="font-size: 14px; font-weight: 600; color: white; margin-bottom: 8px;">
                <i class="fas fa-info-circle" style="color: #30D158;"></i>
                Важная информация:
            </h4>
            <ul style="font-size: 12px; color: var(--ios-text-secondary); padding-left: 20px;">
                <li>Обязательно укажите номер заказа в комментарии</li>
                <li>Проверка платежа занимает до 15 минут</li>
                <li>После подтверждения VPN активируется автоматически</li>
                <li>При возникновении проблем пишите @flowie_support</li>
                <li>Работаем 24/7 для PUBG Mobile игроков</li>
            </ul>
        </div>
    `;

    closeModal();
    openPaymentModal();
}

// Настройка событий
function setupEvents() {
    console.log('Настройка событий...');

    // Подключение VPN
    const connectBtn = document.getElementById('connect-btn');
    if (connectBtn) {
        connectBtn.addEventListener('click', toggleVPN);
    }

    // Навигация
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', function (e) {
            e.preventDefault();
            const span = this.querySelector('span');
            const section = span ? span.textContent.toLowerCase() : '';

            // Убираем активный класс у всех кнопок
            document.querySelectorAll('.nav-btn').forEach(b => {
                b.classList.remove('active');
            });

            // Добавляем активный класс текущей кнопке
            this.classList.add('active');

            // Обрабатываем клик
            switch (section) {
                case 'главная':
                    scrollToElement('.welcome-section');
                    break;
                case 'vpn':
                    scrollToElement('.vpn-categories');
                    break;
                case 'покупки':
                    loadPurchases();
                    scrollToElement('.my-purchases');
                    break;
                case 'поддержка':
                    showNotification('💬 Техподдержка: @flowie_support');
                    break;
                case 'профиль':
                    showProfileModal();
                    break;
            }
        });
    });

    // Клик на аватар в хедере
    const avatarImage = document.getElementById('avatar-image');
    if (avatarImage) {
        avatarImage.parentElement.parentElement.addEventListener('click', showProfileModal);
    }

    // Модальные окна
    const closeModalBtns = document.querySelectorAll('.close-modal');
    closeModalBtns.forEach(btn => {
        btn.addEventListener('click', closeModal);
    });

    // Загрузка файла
    const fileInput = document.getElementById('receipt-file');
    if (fileInput) {
        fileInput.addEventListener('change', handleReceiptUpload);
    }

    // Кнопка удаления файла
    const removeBtn = document.querySelector('.btn-remove');
    if (removeBtn) {
        removeBtn.addEventListener('click', removeFile);
    }

    // Отправка чека
    const submitBtn = document.getElementById('submit-receipt');
    if (submitBtn) {
        submitBtn.addEventListener('click', submitReceipt);
    }

    // Кнопка апгрейда подписки
    const upgradeBtn = document.querySelector('.btn-upgrade');
    if (upgradeBtn) {
        upgradeBtn.addEventListener('click', showVPNModal);
    }

    // Кнопка покупки VPN
    const buyBtn = document.querySelector('.btn-buy');
    if (buyBtn) {
        buyBtn.addEventListener('click', showVPNModal);
    }

    console.log('События настроены');
}

// Показать модальное окно профиля
function showProfileModal() {
    const purchases = JSON.parse(localStorage.getItem('flowie_purchases') || '[]');
    const activeSubscription = localStorage.getItem('flowie_active_subscription');

    // Статистика покупок
    const totalPurchases = purchases.length;
    const confirmedPurchases = purchases.filter(p => p.status === 'confirmed');
    const totalSpent = purchases.reduce((sum, p) => sum + p.amount, 0);

    // Создаем HTML для профиля
    const profileHTML = `
        <div class="profile-modal" style="color: white;">
            <!-- Заголовок профиля -->
            <div style="text-align: center; padding: 20px; background: rgba(48, 209, 88, 0.1); border-radius: 16px; margin-bottom: 20px; border: 1px solid rgba(48, 209, 88, 0.3);">
                <div style="width: 100px; height: 100px; margin: 0 auto 16px; border-radius: 50%; overflow: hidden; border: 3px solid #30D158;">
                    ${user?.photo_url ?
            `<img src="${user.photo_url}" alt="${user.first_name}" style="width: 100%; height: 100%; object-fit: cover;">` :
            `<div style="width: 100%; height: 100%; background: rgba(255, 255, 255, 0.1); backdrop-filter: blur(20px); display: flex; align-items: center; justify-content: center; font-size: 36px; color: white; font-weight: bold;">
                            ${(user?.first_name?.[0] || 'U').toUpperCase()}
                        </div>`
        }
                </div>
                <h3 style="font-size: 24px; font-weight: 700; margin-bottom: 8px;">
                    ${user?.first_name || 'Пользователь'}
                </h3>
                <p style="color: #30D158; font-size: 16px; margin-bottom: 4px;">
                    @${user?.username || 'username'}
                </p>
                <div style="display: inline-block; background: rgba(48, 209, 88, 0.2); color: #30D158; padding: 4px 12px; border-radius: 20px; font-size: 14px; font-weight: 600;">
                    Уровень ${getPlayerLevel()}
                </div>
            </div>
            
            <!-- Статистика -->
            <div style="margin-bottom: 24px;">
                <h4 style="font-size: 18px; font-weight: 600; margin-bottom: 16px; color: white; display: flex; align-items: center; gap: 10px;">
                    <i class="fas fa-chart-bar" style="color: #30D158;"></i>
                    Статистика покупок
                </h4>
                
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 20px;">
                    <div style="background: rgba(255, 255, 255, 0.05); backdrop-filter: blur(20px); border-radius: 12px; padding: 16px; text-align: center; border: 1px solid rgba(255, 255, 255, 0.1);">
                        <div style="font-size: 32px; font-weight: 700; color: #30D158;">${totalPurchases}</div>
                        <div style="font-size: 12px; color: var(--ios-text-secondary); text-transform: uppercase;">Всего покупок</div>
                    </div>
                    
                    <div style="background: rgba(255, 255, 255, 0.05); backdrop-filter: blur(20px); border-radius: 12px; padding: 16px; text-align: center; border: 1px solid rgba(255, 255, 255, 0.1);">
                        <div style="font-size: 32px; font-weight: 700; color: #30D158;">${confirmedPurchases.length}</div>
                        <div style="font-size: 12px; color: var(--ios-text-secondary); text-transform: uppercase;">Подтверждено</div>
                    </div>
                    
                    <div style="background: rgba(255, 255, 255, 0.05); backdrop-filter: blur(20px); border-radius: 12px; padding: 16px; text-align: center; border: 1px solid rgba(255, 255, 255, 0.1);">
                        <div style="font-size: 32px; font-weight: 700; color: #30D158;">${totalSpent}₽</div>
                        <div style="font-size: 12px; color: var(--ios-text-secondary); text-transform: uppercase;">Всего потрачено</div>
                    </div>
                    
                    <div style="background: rgba(255, 255, 255, 0.05); backdrop-filter: blur(20px); border-radius: 12px; padding: 16px; text-align: center; border: 1px solid rgba(255, 255, 255, 0.1);">
                        <div style="font-size: 32px; font-weight: 700; color: #30D158;">${activeSubscription ? 'Да' : 'Нет'}</div>
                        <div style="font-size: 12px; color: var(--ios-text-secondary); text-transform: uppercase;">Активна подписка</div>
                    </div>
                </div>
            </div>
            
            <!-- История покупок -->
            <div style="margin-bottom: 24px;">
                <h4 style="font-size: 18px; font-weight: 600; margin-bottom: 16px; color: white; display: flex; align-items: center; gap: 10px;">
                    <i class="fas fa-history" style="color: #30D158;"></i>
                    История покупок
                </h4>
                
                <div style="max-height: 300px; overflow-y: auto; padding-right: 8px;">
                    ${purchases.length > 0 ? purchases.map((purchase, index) => `
                        <div style="background: rgba(255, 255, 255, 0.05); backdrop-filter: blur(20px); border-radius: 12px; padding: 16px; margin-bottom: 12px; border: 1px solid rgba(255, 255, 255, 0.1);">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                                <div style="font-size: 16px; font-weight: 600; color: white;">${purchase.name}</div>
                                <div style="font-size: 14px; color: ${getStatusColor(purchase.status)}; font-weight: 600;">
                                    ${getStatusText(purchase.status)}
                                </div>
                            </div>
                            
                            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; margin-bottom: 12px;">
                                <div>
                                    <div style="font-size: 11px; color: var(--ios-text-secondary); text-transform: uppercase;">Сумма</div>
                                    <div style="font-size: 14px; font-weight: 600; color: white;">${purchase.amount}₽</div>
                                </div>
                                <div>
                                    <div style="font-size: 11px; color: var(--ios-text-secondary); text-transform: uppercase;">Дата</div>
                                    <div style="font-size: 14px; font-weight: 600; color: white;">${purchase.date}</div>
                                </div>
                                <div>
                                    <div style="font-size: 11px; color: var(--ios-text-secondary); text-transform: uppercase;">Заказ</div>
                                    <div style="font-size: 14px; font-weight: 600; color: white;">${purchase.order_id}</div>
                                </div>
                                <div>
                                    <div style="font-size: 11px; color: var(--ios-text-secondary); text-transform: uppercase;">#</div>
                                    <div style="font-size: 14px; font-weight: 600; color: white;">${index + 1}</div>
                                </div>
                            </div>
                            
                            ${purchase.status === 'pending' ?
                '<div style="background: rgba(245, 158, 11, 0.1); color: #f59e0b; padding: 8px; border-radius: 8px; font-size: 12px; text-align: center; border: 1px solid rgba(245, 158, 11, 0.2);">⏳ Ожидает проверки администратором</div>' :
                purchase.status === 'confirmed' ?
                    '<div style="background: rgba(34, 197, 94, 0.1); color: #22c55e; padding: 8px; border-radius: 8px; font-size: 12px; text-align: center; border: 1px solid rgba(34, 197, 94, 0.2);">✅ VPN активирован</div>' :
                    '<div style="background: rgba(239, 68, 68, 0.1); color: #ef4444; padding: 8px; border-radius: 8px; font-size: 12px; text-align: center; border: 1px solid rgba(239, 68, 68, 0.2);">❌ Отклонено администратором</div>'
            }
                        </div>
                    `).reverse().join('') : `
                        <div style="text-align: center; padding: 40px 20px; color: var(--ios-text-secondary);">
                            <i class="fas fa-shopping-cart" style="font-size: 48px; margin-bottom: 16px; color: #30D158;"></i>
                            <p>У вас пока нет покупок</p>
                            <button onclick="closeModal(); showVPNModal();" style="
                                background: linear-gradient(45deg, #30D158, #20A548);
                                border: none;
                                border-radius: 12px;
                                padding: 12px 24px;
                                color: white;
                                font-weight: 600;
                                margin-top: 16px;
                                cursor: pointer;
                            ">
                                Сделать первую покупку
                            </button>
                        </div>
                    `}
                </div>
            </div>
            
            <!-- Действия -->
            <div style="display: flex; flex-direction: column; gap: 12px;">
                <button onclick="closeModal(); showVPNModal();" style="
                    width: 100%;
                    padding: 16px;
                    background: linear-gradient(45deg, #30D158, #20A548);
                    border: none;
                    border-radius: 12px;
                    color: white;
                    font-weight: 600;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 10px;
                ">
                    <i class="fas fa-shopping-cart"></i>
                    Купить VPN
                </button>
                
                <button onclick="checkAllPendingOrders()" style="
                    width: 100%;
                    padding: 16px;
                    background: rgba(59, 130, 246, 0.2);
                    border: 1px solid rgba(59, 130, 246, 0.4);
                    border-radius: 12px;
                    color: #3b82f6;
                    font-weight: 600;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 10px;
                ">
                    <i class="fas fa-sync-alt"></i>
                    Проверить статусы заказов
                </button>
                
                <button onclick="window.open('https://t.me/flowie_support', '_blank');" style="
                    width: 100%;
                    padding: 16px;
                    background: rgba(48, 209, 88, 0.2);
                    border: 1px solid rgba(48, 209, 88, 0.4);
                    border-radius: 12px;
                    color: #30D158;
                    font-weight: 600;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 10px;
                ">
                    <i class="fas fa-headset"></i>
                    Поддержка @flowie_support
                </button>
            </div>
        </div>
    `;

    // Создаем или обновляем модальное окно профиля
    let profileModal = document.getElementById('profile-modal');
    if (!profileModal) {
        profileModal = document.createElement('div');
        profileModal.id = 'profile-modal';
        profileModal.className = 'modal-overlay';
        profileModal.innerHTML = `
            <div class="modal pubg-modal">
                <div class="modal-header">
                    <h3>
                        <i class="fas fa-user-circle"></i>
                        Профиль игрока
                    </h3>
                    <button class="close-modal">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    ${profileHTML}
                </div>
            </div>
        `;
        document.body.appendChild(profileModal);

        // Добавляем обработчик закрытия
        profileModal.querySelector('.close-modal').addEventListener('click', closeModal);
        profileModal.addEventListener('click', function (e) {
            if (e.target === this) closeModal();
        });
    } else {
        profileModal.querySelector('.modal-body').innerHTML = profileHTML;
    }

    // Показываем модальное окно
    profileModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function getStatusColor(status) {
    switch (status) {
        case 'pending': return '#f59e0b';
        case 'confirmed': return '#30D158';
        case 'rejected': return '#FF453A';
        default: return 'var(--ios-text-secondary)';
    }
}

function getStatusText(status) {
    switch (status) {
        case 'pending': return 'ОЖИДАНИЕ';
        case 'confirmed': return 'ПОДТВЕРЖДЕНО';
        case 'rejected': return 'ОТКЛОНЕНО';
        default: return 'НЕИЗВЕСТНО';
    }
}

// Закрыть модальное окно
function closeModal() {
    const modals = document.querySelectorAll('.modal-overlay');
    modals.forEach(modal => {
        modal.classList.remove('active');
    });
    document.body.style.overflow = '';

    if (navigator.vibrate) {
        navigator.vibrate(30);
    }
}

// Открыть модальное окно оплаты
function openPaymentModal() {
    const modal = document.getElementById('payment-modal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

// Закрыть модальное окно оплаты
function closePaymentModal() {
    const modal = document.getElementById('payment-modal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// Открыть загрузку чека
function openReceiptUpload() {
    closePaymentModal();

    const modal = document.getElementById('receipt-modal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

// Закрыть загрузку чека
function closeReceiptModal() {
    const modal = document.getElementById('receipt-modal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// Обработка загрузки файла
function handleReceiptUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
        showNotification('❌ Файл слишком большой (макс 5MB)');
        return;
    }

    if (!file.type.startsWith('image/')) {
        showNotification('❌ Пожалуйста, загрузите изображение');
        return;
    }

    receiptFile = file;

    const uploadArea = document.getElementById('upload-area');
    const selectedFile = document.getElementById('selected-file');
    const fileName = document.getElementById('file-name');
    const submitBtn = document.getElementById('submit-receipt');

    if (uploadArea) uploadArea.style.display = 'none';
    if (selectedFile) {
        selectedFile.style.display = 'flex';
        if (fileName) fileName.textContent = file.name;
    }
    if (submitBtn) submitBtn.disabled = false;
}

// Удалить файл
function removeFile() {
    const uploadArea = document.getElementById('upload-area');
    const selectedFile = document.getElementById('selected-file');
    const fileInput = document.getElementById('receipt-file');
    const submitBtn = document.getElementById('submit-receipt');

    if (uploadArea) uploadArea.style.display = 'block';
    if (selectedFile) selectedFile.style.display = 'none';
    if (fileInput) fileInput.value = '';
    if (submitBtn) submitBtn.disabled = true;
    receiptFile = null;
}

// Конвертация файла в Base64
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
        reader.readAsDataURL(file);
    });
}

function getVpnTariff(name) {
    if (!name) return 'Не указан';
    if (name.includes('Лайт') || name.includes('Дешевый')) return 'VPN Лайт';
    if (name.includes('Про') || name.includes('Средний')) return 'VPN Про';
    if (name.includes('Vip') || name.includes('ВИП') || name.includes('VIP')) return 'VPN ВИП';
    return name;
}

// Отправить чек на проверку
// Обновить функцию submitReceipt в script.js:
async function submitReceipt() {
    console.log('=== НАЧАЛО submitReceipt ===');
    
    if (!currentPaymentData) {
        console.error('❌ currentPaymentData отсутствует');
        showNotification('❌ Ошибка: данные покупки не найдены');
        return;
    }

    try {
        console.log('1. Подготовка данных покупки...');
        showNotification('📤 Сохраняем данные покупки...');

        // Создаем запись о покупке
        const purchaseData = {
            name: currentPaymentData.name,
            amount: currentPaymentData.price,
            status: 'pending',
            date: new Date().toLocaleString('ru-RU'),
            order_id: currentPurchaseId,
            user_id: user?.id?.toString() || 'unknown',
            user_name: user?.first_name || 'Unknown',
            username: user?.username || 'no_username',
            timestamp: new Date().toISOString(),
            vpn_tariff: getVpnTariff(currentPaymentData.name),
            has_receipt: !!receiptFile,
            created_at: firebase.firestore.FieldValue.serverTimestamp ? 
                firebase.firestore.FieldValue.serverTimestamp() : 
                new Date().toISOString()
        };

        console.log('2. Данные покупки:', purchaseData);

        // Если есть файл, конвертируем в base64
        if (receiptFile) {
            console.log('3. Конвертируем файл в base64...');
            try {
                const base64 = await fileToBase64(receiptFile);
                purchaseData.receipt_base64 = base64.substring(0, 100) + '...'; // Сохраняем только начало для логов
                purchaseData.file_name = receiptFile.name;
                purchaseData.file_size = receiptFile.size;
                purchaseData.file_type = receiptFile.type;
                console.log('4. Файл конвертирован, размер:', receiptFile.size, 'тип:', receiptFile.type);
            } catch (fileError) {
                console.error('Ошибка конвертации файла:', fileError);
                purchaseData.has_receipt = false;
            }
        } else {
            console.log('3. Файл не прикреплен');
        }

        // Сохраняем локально
        console.log('5. Сохраняем локально...');
        const savedLocally = savePurchaseOnce(purchaseData);
        
        if (!savedLocally) {
            console.warn('6. Заказ уже существует локально');
            showNotification('⚠️ Этот заказ уже был отправлен ранее');
            closeReceiptModal();
            return;
        }
        
        console.log('6. Локальное сохранение успешно');

        // Сохраняем в Firebase
        console.log('7. Пытаемся сохранить в Firebase...');
        console.log('db доступен?', !!db);
        console.log('firebase доступен?', typeof firebase !== 'undefined');
        
        let firebaseResult = null;
        let firebaseError = null;
        
        if (db) {
            try {
                console.log('8. Добавляем документ в коллекцию purchases...');
                
                // Тест соединения
                console.log('8.1. Тест соединения...');
                try {
                    const testDoc = db.collection('test_connection').doc('test_' + Date.now());
                    await testDoc.set({ test: true, timestamp: new Date().toISOString() });
                    await testDoc.delete();
                    console.log('8.2. Тест соединения пройден');
                } catch (testError) {
                    console.error('8.2. Тест соединения не пройден:', testError);
                }
                
                // Сохраняем покупку
                console.log('9. Сохраняем purchaseData в Firestore...');
                const docRef = await db.collection('purchases').add(purchaseData);
                console.log('10. Документ создан с ID:', docRef.id);
                
                purchaseData.firebase_id = docRef.id;
                
                // Обновляем документ с ID
                console.log('11. Обновляем документ с firebase_id...');
                await docRef.update({
                    firebase_id: docRef.id,
                    updated_at: new Date().toISOString()
                });
                
                firebaseResult = {
                    success: true,
                    docId: docRef.id
                };
                
                console.log('12. Firebase сохранение успешно!');
                
            } catch (firebaseError) {
                console.error('13. Ошибка Firebase сохранения:', firebaseError);
                console.error('Код ошибки:', firebaseError.code);
                console.error('Сообщение:', firebaseError.message);
                console.error('Подробности:', firebaseError);
                
                firebaseError = firebaseError;
            }
        } else {
            console.error('14. db недоступен!');
            showNotification('⚠️ База данных не подключена. Работаем в оффлайн режиме.');
        }

        if (firebaseResult && firebaseResult.success) {
            console.log('15. Отправляем уведомление в Telegram...');
            // Отправляем уведомление в Telegram
            await sendReceiptToTelegramSimple(purchaseData, firebaseResult.docId);
            
            showNotification('✅ Данные отправлены! Админ проверит в течение 15 минут');

            // Обновляем локальную копию
            purchaseData.firebase_id = firebaseResult.docId;
            updatePurchaseInStorage(purchaseData);
        } else {
            console.log('15. Firebase не сохранил, сохраняем только локально');
            showNotification('⚠️ Данные сохранены локально. Ошибка подключения к Firebase');
        }

        // Обновляем интерфейс
        console.log('16. Обновляем интерфейс...');
        setTimeout(() => {
            closeReceiptModal();
            loadPurchases();
            loadUserData();
            
            // Очищаем данные
            currentPaymentData = null;
            currentPurchaseId = null;
            receiptFile = null;
            removeFile();
            
            console.log('17. Операция завершена');
        }, 1500);

    } catch (error) {
        console.error('=== КРИТИЧЕСКАЯ ОШИБКА ===');
        console.error('Error in submitReceipt:', error);
        console.error('Stack:', error.stack);
        showNotification('❌ Ошибка сохранения данных. Проверьте подключение.');
    }
    
    console.log('=== КОНЕЦ submitReceipt ===');
}

// Добавьте эту функцию в script.js
async function checkFirebaseStatus() {
    console.log('=== ПРОВЕРКА FIREBASE ===');
    
    try {
        // Проверяем загружена ли библиотека
        console.log('1. Firebase загружен?', typeof firebase !== 'undefined');
        if (typeof firebase === 'undefined') {
            throw new Error('Firebase библиотека не загружена');
        }
        
        // Проверяем инициализацию
        console.log('2. Firebase инициализирован?', firebase.apps.length > 0);
        console.log('3. Имя приложения:', firebase.apps[0]?.name);
        
        // Проверяем Firestore
        console.log('4. Firestore доступен?', typeof firebase.firestore !== 'undefined');
        
        // Проверяем подключение
        if (db) {
            console.log('5. db существует');
            
            // Тест записи
            console.log('6. Тест записи...');
            const testDocRef = db.collection('test_connection').doc('test_' + Date.now());
            await testDocRef.set({
                test: true,
                timestamp: new Date().toISOString(),
                test_field: 'test_value'
            });
            console.log('7. Запись создана');
            
            // Чтение
            console.log('8. Чтение записи...');
            const testDoc = await testDocRef.get();
            console.log('9. Документ существует?', testDoc.exists);
            
            // Удаление
            console.log('10. Удаление тестовой записи...');
            await testDocRef.delete();
            console.log('11. Запись удалена');
            
            // Проверяем коллекцию purchases
            console.log('12. Проверяем коллекцию purchases...');
            try {
                const purchasesSnapshot = await db.collection('purchases').limit(1).get();
                console.log('13. Коллекция purchases доступна, записей:', purchasesSnapshot.size);
            } catch (purchasesError) {
                console.error('13. Ошибка доступа к purchases:', purchasesError);
            }
            
            return {
                success: true,
                message: '✅ Firebase работает корректно',
                details: {
                    libraryLoaded: true,
                    appInitialized: true,
                    firestoreAvailable: true,
                    writeTest: true,
                    readTest: true,
                    deleteTest: true
                }
            };
        } else {
            return {
                success: false,
                message: '❌ db не инициализирован',
                details: {
                    libraryLoaded: typeof firebase !== 'undefined',
                    appInitialized: firebase.apps.length > 0,
                    firestoreAvailable: typeof firebase.firestore !== 'undefined',
                    dbInstance: !!db
                }
            };
        }
        
    } catch (error) {
        console.error('❌ Ошибка проверки Firebase:', error);
        console.error('Код ошибки:', error.code);
        console.error('Сообщение:', error.message);
        
        return {
            success: false,
            message: '❌ Firebase ошибка: ' + error.message,
            error: error
        };
    }
}

// Добавить упрощенную функцию отправки в Telegram:
async function sendReceiptToTelegramSimple(purchaseData, firebaseId) {
    try {
        console.log('Отправка уведомления в Telegram...');

        // Формируем сообщение для админа
        const message = `
📋 *НОВАЯ ПОКУПКА VPN*

👤 *Пользователь:*
• ID: ${purchaseData.user_id}
• Имя: ${purchaseData.user_name}
• Username: @${purchaseData.username || 'отсутствует'}

💰 *Детали покупки:*
• Товар: ${purchaseData.name}
• Сумма: ${purchaseData.amount}₽
• Заказ: ${purchaseData.order_id}
• Тариф: ${purchaseData.vpn_tariff}
• Дата: ${purchaseData.date}
${purchaseData.has_receipt ? '📎 Чек приложен (в базе данных)' : '⚠️ Чек не приложен'}

📊 *ID в системе:* ${firebaseId}

👇 *Действия администратора:*`;

        // Создаем клавиатуру
        const keyboard = {
            inline_keyboard: [
                [
                    {
                        text: '✅ Принять',
                        callback_data: `approve_${firebaseId}`
                    },
                    {
                        text: '❌ Отклонить',
                        callback_data: `reject_${firebaseId}`
                    }
                ]
            ]
        };

        // Если есть username, добавляем кнопку для связи
        if (purchaseData.username && purchaseData.username !== 'no_username') {
            keyboard.inline_keyboard.push([
                {
                    text: '💬 Написать пользователю',
                    url: `https://t.me/${purchaseData.username}`
                }
            ]);
        }

        // Отправляем текстовое сообщение
        const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: ADMIN_CHAT_ID,
                text: message,
                parse_mode: 'Markdown',
                reply_markup: keyboard
            })
        });

        const result = await response.json();
        console.log('Ответ Telegram:', result);

        // Сохраняем message_id в Firestore
        if (result.ok && result.result && db) {
            try {
                const docRef = db.collection('purchases').doc(firebaseId);
                await docRef.update({
                    telegram_message_id: result.result.message_id,
                    admin_notified: true,
                    notified_at: new Date().toISOString()
                });
                console.log('Message ID сохранен в Firestore');
            } catch (updateError) {
                console.error('Ошибка обновления Telegram message ID:', updateError);
            }
        }

        return result;

    } catch (error) {
        console.error('Ошибка отправки в Telegram:', error);
        // Не прерываем выполнение если ошибка Telegram
    }
}

// Сохранить покупку (только один раз)
function savePurchaseOnce(purchase) {
    let purchases = JSON.parse(localStorage.getItem('flowie_purchases') || '[]');

    // Проверяем, нет ли уже покупки с таким же order_id
    const exists = purchases.some(p => p.order_id === purchase.order_id);

    if (!exists) {
        purchases.push(purchase);
        localStorage.setItem('flowie_purchases', JSON.stringify(purchases));
        console.log('Покупка сохранена локально:', purchase.order_id);
        return true;
    } else {
        console.log('Покупка уже существует, не сохраняем дубликат:', purchase.order_id);
        return false;
    }
}

// Обновление покупки в localStorage
function updatePurchaseInStorage(updatedPurchase) {
    let purchases = JSON.parse(localStorage.getItem('flowie_purchases') || '[]');
    const index = purchases.findIndex(p => p.order_id === updatedPurchase.order_id);

    if (index !== -1) {
        purchases[index] = { ...purchases[index], ...updatedPurchase };
    } else {
        purchases.push(updatedPurchase);
    }

    localStorage.setItem('flowie_purchases', JSON.stringify(purchases));
}

// ============ ОСТАЛЬНЫЕ ФУНКЦИИ ============

// Загрузка покупок в раздел "Мои покупки"
function loadPurchases() {
    const purchases = JSON.parse(localStorage.getItem('flowie_purchases') || '[]');
    const container = document.getElementById('purchases-list');
    const purchasesSection = document.getElementById('my-purchases');

    if (!container || !purchasesSection) return;

    if (purchases.length === 0) {
        container.innerHTML = `
            <div class="no-purchases" style="text-align: center; padding: 40px 20px; color: var(--ios-text-secondary);">
                <i class="fas fa-shopping-cart" style="font-size: 48px; margin-bottom: 16px; color: #30D158;"></i>
                <p style="margin-bottom: 20px;">У вас пока нет покупок</p>
                <button onclick="showVPNModal()" style="
                    background: linear-gradient(45deg, #30D158, #20A548);
                    border: none;
                    border-radius: 12px;
                    padding: 12px 24px;
                    color: white;
                    font-weight: 600;
                    cursor: pointer;
                ">
                    Сделать первую покупку
                </button>
            </div>
        `;
        purchasesSection.style.display = 'block';
        return;
    }

    // Сортируем покупки по дате (новые сначала)
    const sortedPurchases = [...purchases].sort((a, b) =>
        new Date(b.timestamp || b.date) - new Date(a.timestamp || a.date)
    );

    container.innerHTML = sortedPurchases.map((purchase, index) => `
        <div class="purchase-item">
            <div class="purchase-header">
                <div class="purchase-name">${purchase.name}</div>
                <div class="purchase-status status-${purchase.status}">
                    ${getStatusText(purchase.status)}
                </div>
            </div>
            
            <div class="purchase-details">
                <div class="purchase-detail">
                    <div style="font-size: 10px; color: var(--ios-text-secondary);">Сумма</div>
                    <strong>${purchase.amount}₽</strong>
                </div>
                <div class="purchase-detail">
                    <div style="font-size: 10px; color: var(--ios-text-secondary);">Дата</div>
                    <strong>${purchase.date}</strong>
                </div>
                <div class="purchase-detail">
                    <div style="font-size: 10px; color: var(--ios-text-secondary);">Заказ</div>
                    <strong>${purchase.order_id}</strong>
                </div>
                <div class="purchase-detail">
                    <div style="font-size: 10px; color: var(--ios-text-secondary);">Статус</div>
                    <strong style="color: ${getStatusColor(purchase.status)};">
                        ${getStatusText(purchase.status)}
                    </strong>
                </div>
            </div>
            
            ${purchase.receipt_url ? `
                <div style="margin-top: 10px; text-align: center;">
                    <a href="${purchase.receipt_url}" target="_blank" 
                       style="color: #30D158; text-decoration: none; font-size: 12px; display: inline-flex; align-items: center; gap: 5px;">
                        <i class="fas fa-receipt"></i>
                        Посмотреть чек
                    </a>
                </div>
            ` : ''}
            
            ${purchase.status === 'pending' ? `
                <div style="font-size: 12px; color: #f59e0b; text-align: center; padding: 8px; background: rgba(245, 158, 11, 0.1); border-radius: 8px; border: 1px solid rgba(245, 158, 11, 0.2); margin-top: 10px;">
                    ⏳ Ожидает проверки администратором
                </div>
            ` : purchase.status === 'confirmed' ? `
                <div style="font-size: 12px; color: #22c55e; text-align: center; padding: 8px; background: rgba(34, 197, 94, 0.1); border-radius: 8px; border: 1px solid rgba(34, 197, 94, 0.2); margin-top: 10px;">
                    ✅ Оплата подтверждена! VPN активирован.
                </div>
            ` : `
                <div style="font-size: 12px; color: #FF453A; text-align: center; padding: 8px; background: rgba(255, 69, 58, 0.1); border-radius: 8px; border: 1px solid rgba(255, 69, 58, 0.2); margin-top: 10px;">
                    ❌ Платеж отклонен. Свяжитесь с поддержкой.
                </div>
            `}
        </div>
    `).join('');

    purchasesSection.style.display = 'block';
}

function loadUserData() {
    const activeSubscription = localStorage.getItem('flowie_active_subscription');
    const subscriptionCard = document.getElementById('subscription-card');

    if (!subscriptionCard) return;

    const purchases = JSON.parse(localStorage.getItem('flowie_purchases') || '[]');
    const confirmedPurchases = purchases.filter(p => p.status === 'confirmed');

    if (confirmedPurchases.length > 0) {
        // Берем последнюю подтвержденную покупку
        const lastConfirmed = confirmedPurchases[confirmedPurchases.length - 1];

        subscriptionCard.innerHTML = `
            <div class="sub-info">
                <div class="sub-name">${lastConfirmed.name}</div>
                <div class="sub-badge">АКТИВНО</div>
            </div>
            
            <div class="sub-features">
                <div class="feature">
                    <i class="fas fa-check-circle"></i>
                    <span>${getVPNFeatures(lastConfirmed.name)}</span>
                </div>
                <div class="feature">
                    <i class="fas fa-infinity"></i>
                    <span>Безлимитный трафик</span>
                </div>
                <div class="feature">
                    <i class="fas fa-headset"></i>
                    <span>Приоритетная поддержка</span>
                </div>
            </div>
            
            <div class="sub-stats">
                <div class="stat">
                    <div class="stat-icon">🎮</div>
                    <div class="stat-data">
                        <div class="stat-value">${getRandomInt(100, 500)}</div>
                        <div class="stat-label">Матчей сыграно</div>
                    </div>
                </div>
                <div class="stat">
                    <div class="stat-icon">⚡</div>
                    <div class="stat-data">
                        <div class="stat-value">${getRandomInt(12, 35)}ms</div>
                        <div class="stat-label">Текущий пинг</div>
                    </div>
                </div>
            </div>
        `;

        selectedVPN = getVPNTypeByName(lastConfirmed.name);
        localStorage.setItem('flowie_active_subscription', JSON.stringify({
            name: lastConfirmed.name,
            type: selectedVPN,
            activated_at: new Date().toISOString(),
            order_id: lastConfirmed.order_id,
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        }));
    } else {
        subscriptionCard.innerHTML = `
            <div class="no-subscription">
                <i class="fas fa-key"></i>
                <p>У тебя нет активной подписки</p>
                <button class="btn-buy" onclick="showVPNModal()">
                    <i class="fas fa-bolt"></i> Купить VPN
                </button>
            </div>
        `;
    }
}

// Добавить эту функцию для получения фич VPN:
function getVPNFeatures(vpnName) {
    if (vpnName.includes('Лайт') || vpnName.includes('Дешевый')) {
        return 'Пинг 35-25ms • Базовые сервера';
    } else if (vpnName.includes('Про') || vpnName.includes('Средний')) {
        return 'Пинг 25-18ms • Регистрация урона';
    } else if (vpnName.includes('Vip') || vpnName.includes('ВИП')) {
        return 'Пинг 18-12ms • Все фичи • VIP сервера';
    }
    return 'Все фичи разблокированы';
}

function getVPNTypeByName(name) {
    if (name.includes('Дешевый')) return 'cheap';
    if (name.includes('Средний')) return 'medium';
    if (name.includes('ВИП')) return 'vip';
    return 'cheap';
}

// Показать VPN модальное окно
function showVPNModal() {
    const modal = document.getElementById('vpn-modal');
    if (!modal) {
        // Создаем модальное окно если его нет
        const vpnModal = document.createElement('div');
        vpnModal.id = 'vpn-modal';
        vpnModal.className = 'modal-overlay';
        vpnModal.innerHTML = `
            <div class="modal pubg-modal">
                <div class="modal-header">
                    <h3>
                        <i class="fas fa-gamepad"></i>
                        Выбор VPN
                    </h3>
                    <button class="close-modal">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body" id="vpn-selection"></div>
            </div>
        `;
        document.body.appendChild(vpnModal);

        vpnModal.querySelector('.close-modal').addEventListener('click', closeModal);
        vpnModal.addEventListener('click', function (e) {
            if (e.target === this) closeModal();
        });
    }

    const modalElement = document.getElementById('vpn-modal');
    if (modalElement) {
        modalElement.classList.add('active');
        document.body.style.overflow = 'hidden';

        // Загружаем контент VPN
        const vpnContent = document.getElementById('vpn-selection');
        if (vpnContent) {
            const categories = {
                'cheap': { name: 'VPN Дешевый', price: 299, icon: '🚀', color: '#30D158', description: 'Для начинающих' },
                'medium': { name: 'VPN Средний', price: 799, icon: '⚡', color: '#30D158', description: 'Для опытных' },
                'vip': { name: 'VPN ВИП', price: 1499, icon: '👑', color: '#30D158', description: 'Для профессионалов' }
            };

            vpnContent.innerHTML = Object.entries(categories).map(([id, category]) => `
                <div class="vpn-modal-card" style="
                    background: var(--ios-glass);
                    backdrop-filter: blur(20px);
                    border-radius: 16px;
                    padding: 20px;
                    margin-bottom: 16px;
                    border: 1px solid rgba(48, 209, 88, 0.3);
                ">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <span style="font-size: 32px;">${category.icon}</span>
                            <div>
                                <h4 style="font-size: 18px; font-weight: 700; color: white; margin-bottom: 4px;">
                                    ${category.name}
                                </h4>
                                <p style="color: var(--ios-text-secondary); font-size: 12px;">${category.description}</p>
                            </div>
                        </div>
                        <div style="font-size: 24px; font-weight: 700; color: #30D158;">${category.price}₽</div>
                    </div>
                    
                    <button onclick="buyVPN('${id}')" style="
                        width: 100%;
                        padding: 16px;
                        background: linear-gradient(45deg, #30D158, #20A548);
                        border: none;
                        border-radius: 12px;
                        color: white;
                        font-weight: 600;
                        font-size: 16px;
                        cursor: pointer;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        gap: 10px;
                    ">
                        <i class="fas fa-shopping-cart"></i>
                        Купить за ${category.price}₽
                    </button>
                </div>
            `).join('');
        }
    }
}

// Включить/выключить VPN
function toggleVPN() {
    showVPNModal();
}

// Обновить пинг
function updatePing() {
    const pingValue = document.getElementById('ping-value');
    const currentPing = document.getElementById('current-ping');

    // Генерируем пинг в диапазоне 12-35 мс при включенном VPN
    const newPing = isVPNConnected ? getRandomInt(12, 35) : getRandomInt(12, 35);

    if (pingValue) pingValue.textContent = newPing + 'ms';
    if (currentPing) {
        currentPing.textContent = newPing + 'ms';
        currentPing.style.color = '#30D158';
    }
}

function checkPing() {
    const pingValue = document.getElementById('ping-value');
    const currentPing = document.getElementById('current-ping');
    const connectBtn = document.getElementById('connect-btn');
    const vpnStatus = document.getElementById('vpn-status');

    // Анимация проверки
    connectBtn.disabled = true;
    vpnStatus.textContent = 'Проверяем...';
    pingValue.textContent = '...';

    // Эмуляция проверки пинга
    setTimeout(() => {
        // Генерация случайного пинга (от 30 до 80)
        const newPing = Math.floor(Math.random() * 30) + 10;

        // Обновляем отображение
        pingValue.textContent = newPing + 'ms';
        currentPing.textContent = newPing + 'ms';
        vpnStatus.textContent = 'Готов';

        // Добавляем класс для анимации
        pingValue.classList.add('ping-updated');

        // Показываем уведомление
        showNotification('Пинг проверен: ' + newPing + 'ms');

        // Убираем класс через секунду
        setTimeout(() => {
            pingValue.classList.remove('ping-updated');
        }, 1000);

        // Активируем кнопку через 2 секунды
        setTimeout(() => {
            connectBtn.disabled = false;
        }, 2000);

    }, 1500); // Время проверки 1.5 секунды
}

// Показать уведомление
function showNotification(message) {
    const notification = document.getElementById('notification');
    const notifyText = document.getElementById('notify-text');

    if (!notification || !notifyText) return;

    notifyText.textContent = message;
    notification.classList.add('show');

    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// Показать секцию
function showSection(section) {
    // Скрываем все секции
    const sections = document.querySelectorAll('.pubg-main > section');
    sections.forEach(sec => {
        sec.style.display = 'none';
    });

    // Показываем нужную секцию
    switch (section) {
        case 'home':
            document.querySelector('.welcome-section').style.display = 'block';
            document.querySelector('.vpn-categories').style.display = 'block';
            document.querySelector('.active-subscription').style.display = 'block';
            document.querySelector('.game-advantages').style.display = 'block';
            break;
        case 'vpn':
            document.querySelector('.vpn-categories').style.display = 'block';
            break;
        case 'purchases':
            document.querySelector('.my-purchases').style.display = 'block';
            break;
    }
}

// Вспомогательные функции
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function scrollToElement(selector) {
    const element = document.querySelector(selector);
    if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
    }
}

// ============ ФУНКЦИИ ДЛЯ SCROLL ИНДИКАТОРА ============

function setupFixedScrollIndicator() {
    const container = document.querySelector('.stats-grid-container');
    const dots = document.querySelectorAll('.scroll-dot');

    if (!container || !dots.length) return;

    function checkIfScrollNeeded() {
        const hasScroll = container.scrollWidth > container.clientWidth;
        return hasScroll;
    }

    function updateScrollDots() {
        if (container.scrollWidth <= container.clientWidth) return;

        const scrollPercentage = container.scrollLeft / (container.scrollWidth - container.clientWidth);
        const activeIndex = Math.min(
            Math.floor(scrollPercentage * (dots.length - 1)),
            dots.length - 1
        );

        dots.forEach(dot => {
            dot.classList.remove('active');
        });

        if (dots[activeIndex]) {
            dots[activeIndex].classList.add('active');
        }
    }

    dots.forEach((dot, index) => {
        dot.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();

            const cardWidth = document.querySelector('.stat-card')?.offsetWidth || 170;
            const gap = 15;
            const scrollPosition = index * (cardWidth + gap);

            container.scrollTo({
                left: scrollPosition,
                behavior: 'smooth'
            });
        });
    });

    checkIfScrollNeeded();
    updateScrollDots();

    container.addEventListener('scroll', updateScrollDots);
    window.addEventListener('resize', () => {
        checkIfScrollNeeded();
        updateScrollDots();
    });
}

function setupTouchScrollIndicator() {
    const container = document.querySelector('.stats-grid-container');
    const dots = document.querySelectorAll('.scroll-dot');

    if (!container || !dots.length) return;

    let isScrolling = false;
    let scrollTimeout;

    container.addEventListener('touchstart', () => {
        container.classList.add('scrolling');
    });

    container.addEventListener('touchmove', () => {
        if (!isScrolling) {
            isScrolling = true;
            container.classList.add('scrolling');
        }

        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
            isScrolling = false;
            container.classList.remove('scrolling');
        }, 100);
    });

    container.addEventListener('touchend', () => {
        setTimeout(() => {
            isScrolling = false;
            container.classList.remove('scrolling');
        }, 150);
    });
}

// ============ ФУНКЦИИ ДЛЯ ПРОВЕРКИ СТАТУСА ============

// Функция для проверки статуса заказа
async function checkOrderStatus(orderId) {
    if (!db) {
        showNotification('❌ Firebase не подключен');
        return;
    }

    try {
        showNotification('🔍 Проверяем статус заказа...');

        const snapshot = await db.collection('purchases')
            .where('order_id', '==', orderId)
            .limit(1)
            .get();

        if (snapshot.empty) {
            showNotification('Заказ не найден в базе данных');
            return;
        }

        const doc = snapshot.docs[0];
        const data = doc.data();
        const docId = doc.id;

        // Обновляем локально
        updateLocalPurchaseStatus(orderId, data.status, { ...data, firebase_id: docId });

        // Показываем уведомление
        if (data.status === 'confirmed') {
            showNotification(`✅ Заказ ${orderId} подтвержден!`);
            activateVPNSubscription(data);
        } else if (data.status === 'rejected') {
            showNotification(`❌ Заказ ${orderId} отклонен.`);
        } else {
            showNotification(`⏳ Заказ ${orderId} еще на проверке.`);
        }

        // Обновляем UI
        loadPurchases();
        loadUserData();

    } catch (error) {
        console.error('Error checking order status:', error);
        showNotification('❌ Ошибка при проверке статуса');
    }
}

// Функция проверки всех ожидающих заказов
async function checkAllPendingOrders() {
    const purchases = JSON.parse(localStorage.getItem('flowie_purchases') || '[]');
    const pendingOrders = purchases.filter(p => p.status === 'pending');

    if (pendingOrders.length === 0) {
        showNotification('✅ Нет заказов на проверке');
        return;
    }

    showNotification(`🔍 Проверяем ${pendingOrders.length} заказ(ов)...`);

    let updatedCount = 0;

    for (const order of pendingOrders) {
        if (order.order_id) {
            await checkOrderStatus(order.order_id);
            updatedCount++;

            // Пауза между запросами
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }

    showNotification(`✅ Проверено ${updatedCount} заказ(ов)`);
}

// Обновление локального статуса
function updateLocalPurchaseStatus(orderId, status, purchaseData = null) {
    let purchases = JSON.parse(localStorage.getItem('flowie_purchases') || '[]');
    const index = purchases.findIndex(p => p.order_id === orderId);

    if (index !== -1) {
        purchases[index].status = status;
        purchases[index].updated_at = new Date().toISOString();

        if (purchaseData) {
            purchases[index] = { ...purchases[index], ...purchaseData };
        }

        localStorage.setItem('flowie_purchases', JSON.stringify(purchases));
        return true;
    }

    return false;
}

// Активация VPN подписки
function activateVPNSubscription(purchase) {
    const vpnType = getVPNTypeByName(purchase.name);

    const subscriptionData = {
        name: purchase.name,
        type: vpnType,
        activated_at: new Date().toISOString(),
        order_id: purchase.order_id,
        firebase_id: purchase.firebase_id || purchase.id,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        purchase_data: purchase
    };

    localStorage.setItem('flowie_active_subscription', JSON.stringify(subscriptionData));

    // Обновляем статус VPN
    isVPNConnected = true;

    // Обновляем интерфейс
    updatePing();
    showNotification('✅ VPN успешно активирован!');

    return subscriptionData;
}

// Функция для тестирования системы
async function testSystem() {
    console.log('=== ТЕСТИРОВАНИЕ СИСТЕМЫ ===');

    // Тест Firebase
    const firebaseOk = await initFirebase();
    console.log('Firebase подключение:', firebaseOk ? 'OK' : 'FAILED');

    // Тест Telegram
    try {
        const testResponse = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getMe`);
        const data = await testResponse.json();
        console.log('Telegram бот:', data.ok ? 'OK' : 'FAILED');
    } catch (error) {
        console.error('Ошибка теста Telegram:', error);
    }

    console.log('Текущий пользователь:', user);
    console.log('Локальные покупки:', JSON.parse(localStorage.getItem('flowie_purchases') || '[]'));

    console.log('=== ТЕСТ ЗАВЕРШЕН ===');
}

// Добавляем тестовую кнопку в режиме разработки
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    document.addEventListener('DOMContentLoaded', function () {
        const testBtn = document.createElement('button');
        testBtn.innerHTML = '🧪 Тест';
        testBtn.style.cssText = `
            position: fixed;
            bottom: 80px;
            right: 20px;
            background: #30D158;
            color: white;
            border: none;
            border-radius: 50%;
            width: 50px;
            height: 50px;
            font-size: 20px;
            cursor: pointer;
            z-index: 9999;
            box-shadow: 0 2px 10px rgba(0,0,0,0.3);
        `;
        testBtn.onclick = testSystem;
        document.body.appendChild(testBtn);
    });
}