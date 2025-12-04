// Конфигурация Telegram бота
const BOT_TOKEN = '8164840278:AAFHOBOBc564w5VsVYbQEbdwB9srGbtZq_g'; // Получите у @BotFather
const ADMIN_CHAT_ID = '7620973293'; // Получите у @userinfobot

// Инициализация Telegram Web App
let tg = window.Telegram.WebApp;
let user = null;
let isVPNConnected = false;
let currentServer = 'auto';
let selectedVPN = null;
let currentPaymentData = null;
let receiptFile = null;
let currentPurchaseId = null;

// Инициализация приложения
document.addEventListener('DOMContentLoaded', function () {
    // Настройки для iOS стеклянного стиля
    if (tg && tg.expand) {
        tg.expand();
        tg.enableClosingConfirmation();
        tg.setHeaderColor('#000000');
        tg.setBackgroundColor('#000000');

        // Получаем данные пользователя
        user = tg.initDataUnsafe?.user || tg.initDataUnsafe?.sender;
    } else {
        console.log('Telegram WebApp not detected, running in browser mode');
        // Тестовые данные для браузера
        user = {
            id: 123456789,
            first_name: 'Пользователь',
            username: 'test_player',
            photo_url: ''
        };
    }

    setupUserProfile();
    loadVPNCategories();
    updatePing();
    loadUserData();
    setupEvents();

    setTimeout(() => {
        showNotification('🚀 Добро пожаловать в ФЛОУИ VPN для PUBG!');
    }, 800);
});

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
    // В функции loadVPNCategories обновляем описания
    const vpnCategories = [
        {
            id: 'cheap',
            name: 'VPN Базовый',
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
            name: 'VPN Продвинутый',
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
            name: 'VPN Профессиональный',
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
                <div class="card-number">2200 7007 4183 5250</div>
                <div class="card-info">
                    <div>
                        <div style="color: var(--ios-text-secondary); font-size: 10px;">Получатель</div>
                        <div style="color: white; font-weight: 600;">Иван И.</div>
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
    // Подключение VPN
    const connectBtn = document.getElementById('connect-btn');
    if (connectBtn) {
        connectBtn.addEventListener('click', toggleVPN);
    }

    // Кнопка смены сервера
    const changeServerBtn = document.querySelector('.btn-change-server');
    if (changeServerBtn) {
        changeServerBtn.addEventListener('click', changeServer);
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
                
                <button onclick="closeModal(); showSection('purchases');" style="
                    width: 100%;
                    padding: 16px;
                    background: rgba(255, 255, 255, 0.1);
                    backdrop-filter: blur(20px);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    border-radius: 12px;
                    color: white;
                    font-weight: 600;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 10px;
                ">
                    <i class="fas fa-history"></i>
                    Полная история
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

// Отправить чек на проверку
async function submitReceipt() {
    if (!receiptFile || !currentPaymentData) {
        showNotification('❌ Сначала загрузите чек');
        return;
    }

    try {
        showNotification('📤 Отправляем чек на проверку...');

        // Создаем запись о покупке
        const purchaseData = {
            id: Date.now().toString(),
            name: currentPaymentData.name,
            amount: currentPaymentData.price,
            status: 'pending',
            date: new Date().toLocaleString('ru-RU'),
            order_id: currentPurchaseId,
            user_id: user?.id || 'unknown',
            user_name: user?.first_name || 'Unknown',
            username: user?.username || 'no_username',
            timestamp: new Date().toISOString()
        };

        // Сохраняем покупку (только один раз)
        savePurchaseOnce(purchaseData);

        // Отправляем в Telegram бота
        const success = await sendToTelegramBot(receiptFile, purchaseData);

        if (success) {
            showNotification('✅ Чек отправлен! Админ проверит в течение 15 минут');

            // Обновляем интерфейс
            setTimeout(() => {
                closeReceiptModal();
                loadPurchases();
                loadUserData();
            }, 1500);

        } else {
            showNotification('⚠️ Чек сохранен, но не отправлен. Свяжитесь с поддержкой');
        }

    } catch (error) {
        console.error('Error submitting receipt:', error);
        showNotification('❌ Ошибка отправки. Попробуйте еще раз');
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
        console.log('Покупка сохранена:', purchase.order_id);
        return true;
    } else {
        console.log('Покупка уже существует, не сохраняем дубликат:', purchase.order_id);
        return false;
    }
}

// Отправка в Telegram бота через прокси
async function sendToTelegramBot(file, purchaseData) {
    try {
        // Для работы в браузере нужно использовать прокси
        // В реальном приложении это должен быть ваш сервер

        // Создаем FormData
        const formData = new FormData();
        formData.append('photo', file);
        formData.append('purchase_data', JSON.stringify(purchaseData));

        // Для демо просто симулируем отправку
        console.log('Чек отправлен в Telegram:', {
            file: file.name,
            size: file.size,
            purchase: purchaseData
        });

        // Для демо возвращаем успех
        return true;

    } catch (error) {
        console.error('Error sending to Telegram:', error);
        return false;
    }
}

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
            
            ${purchase.status === 'pending' ? `
                <div style="font-size: 12px; color: #f59e0b; text-align: center; padding: 8px; background: rgba(245, 158, 11, 0.1); border-radius: 8px; border: 1px solid rgba(245, 158, 11, 0.2);">
                    ⏳ Ожидает проверки администратором
                </div>
            ` : purchase.status === 'confirmed' ? `
                <div style="font-size: 12px; color: #22c55e; text-align: center; padding: 8px; background: rgba(34, 197, 94, 0.1); border-radius: 8px; border: 1px solid rgba(34, 197, 94, 0.2);">
                    ✅ Оплата подтверждена! VPN активирован.
                </div>
            ` : `
                <div style="font-size: 12px; color: #FF453A; text-align: center; padding: 8px; background: rgba(255, 69, 58, 0.1); border-radius: 8px; border: 1px solid rgba(255, 69, 58, 0.2);">
                    ❌ Платеж отклонен. Свяжитесь с поддержкой.
                </div>
            `}
        </div>
    `).join('');

    purchasesSection.style.display = 'block';
}

// Загрузка данных пользователя
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
                    <span>Все фичи разблокированы</span>
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
                        <div class="stat-value">${getRandomInt(25, 45)}ms</div>
                        <div class="stat-label">Средний пинг</div>
                    </div>
                </div>
            </div>
        `;

        selectedVPN = getVPNTypeByName(lastConfirmed.name);
        localStorage.setItem('flowie_active_subscription', JSON.stringify({
            name: lastConfirmed.name,
            type: selectedVPN,
            activated_at: new Date().toISOString(),
            order_id: lastConfirmed.order_id
        }));
    } else {
        subscriptionCard.innerHTML = `
            <div class="no-subscription">
                <i class="fas fa-key"></i>
                <p>У тебя нет активной подписки</p>
                <button class="btn-buy" onclick="showVPNModal()">Купить VPN</button>
            </div>
        `;
    }

    loadPurchases();
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
    const connectBtn = document.getElementById('connect-btn');
    const statusText = document.getElementById('vpn-status');

    if (!isVPNConnected) {
        // Проверяем, есть ли активная подписка
        const purchases = JSON.parse(localStorage.getItem('flowie_purchases') || '[]');
        const hasActive = purchases.some(p => p.status === 'confirmed');

        if (!hasActive) {
            showNotification('❌ Нет активной подписки. Купите VPN для подключения');
            showVPNModal();
            return;
        }

        isVPNConnected = true;
        if (connectBtn) connectBtn.style.background = 'linear-gradient(45deg, #20A548, #30D158)';
        if (statusText) statusText.textContent = 'Вкл';
        showNotification('✅ VPN подключен! Пинг оптимизирован');
        updatePing();
    } else {
        isVPNConnected = false;
        if (connectBtn) connectBtn.style.background = 'linear-gradient(45deg, #30D158, #20A548)';
        if (statusText) statusText.textContent = 'Выкл';
        showNotification('❌ VPN отключен');
        updatePing();
    }
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
        currentPing.style.color = isVPNConnected ? '#30D158' : '#FF453A';
    }
}

// Выбор сервера (упрощенно)
function selectServer() {
    // Функция упрощена, так как выбор сервера скрыт
    updatePing();
}

// Сменить сервер
function changeServer() {
    // Упрощенная функция смены сервера
    const serverNames = ['Автоматический', 'Премиум 1', 'Премиум 2', 'Премиум 3', 'Игровой'];
    const randomServer = serverNames[Math.floor(Math.random() * serverNames.length)];

    // Обновляем текст в интерфейсе
    const serverSpan = document.querySelector('.status-indicator strong');
    if (serverSpan) {
        serverSpan.textContent = `${randomServer} • Низкий пинг`;
    }

    updatePing();
    showNotification(`🌍 Сервер изменен: ${randomServer}`);
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

// Показать профиль
function showProfile() {
    showProfileModal();
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

// Обработка статусов платежей от бота
async function handlePaymentStatus(orderId, status) {
    let purchases = JSON.parse(localStorage.getItem('flowie_purchases') || '[]');
    const purchaseIndex = purchases.findIndex(p => p.order_id === orderId);

    if (purchaseIndex !== -1) {
        purchases[purchaseIndex].status = status;
        localStorage.setItem('flowie_purchases', JSON.stringify(purchases));

        if (status === 'confirmed') {
            const purchase = purchases[purchaseIndex];
            localStorage.setItem('flowie_active_subscription', JSON.stringify({
                name: purchase.name,
                type: getVPNTypeByName(purchase.name),
                activated_at: new Date().toISOString(),
                order_id: purchase.order_id
            }));

            showNotification(`🎉 ${purchase.name} активирован!`);

            // Если VPN был отключен, предлагаем подключить
            if (!isVPNConnected) {
                setTimeout(() => {
                    if (confirm('VPN активирован! Хотите подключиться сейчас?')) {
                        toggleVPN();
                    }
                }, 1000);
            }
        }

        loadPurchases();
        loadUserData();
    }
}

// Инициализация обработки URL параметров
document.addEventListener('DOMContentLoaded', function () {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get('payment');
    const orderId = urlParams.get('order_id');

    if (paymentStatus && orderId) {
        handlePaymentStatus(orderId, paymentStatus);
        // Убираем параметры из URL
        window.history.replaceState({}, document.title, window.location.pathname);
    }
});

// Функция для ручного обновления статуса (для админа)
function updatePurchaseStatus(orderId, status) {
    handlePaymentStatus(orderId, status);
}