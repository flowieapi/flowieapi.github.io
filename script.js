// Инициализация Telegram Web App
let tg = window.Telegram.WebApp;
let user = null;
let isVPNConnected = false;
let currentServer = 'eu';
let selectedVPN = null;
let currentPaymentData = null;
let receiptFile = null;

// Инициализация приложения
document.addEventListener('DOMContentLoaded', function() {
    // Настройки для PUBG стиля
    tg.expand();
    tg.enableClosingConfirmation();
    tg.setHeaderColor('#0f1419');
    tg.setBackgroundColor('#0f1419');
    
    // Получаем данные пользователя
    user = tg.initDataUnsafe?.user || tg.initDataUnsafe?.sender;
    setupUserProfile();
    
    // Загружаем VPN категории
    loadVPNCategories();
    
    // Инициализируем пинг
    updatePing();
    
    // Загружаем данные пользователя
    loadUserData();
    
    // Настраиваем события
    setupEvents();
    
    // Показываем приветственное сообщение
    setTimeout(() => {
        showNotification('🎮 Добро пожаловать в ФЛОУИ VPN для PUBG!');
    }, 800);
});

// Настройка профиля игрока - ИСПРАВЛЕННЫЙ КОД
function setupUserProfile() {
    const avatarImage = document.getElementById('avatar-image');
    const playerLevel = document.getElementById('player-level');
    
    if (!user) {
        // Если нет пользователя
        avatarImage.innerHTML = '<i class="fas fa-user"></i>';
        playerLevel.textContent = '1';
        return;
    }
    
    // Создаем аватарку
    if (user.photo_url) {
        avatarImage.innerHTML = `
            <img src="${user.photo_url}" alt="${user.first_name}" 
                 onerror="this.onerror=null; this.innerHTML='<i class=\\'fas fa-user\\'></i>';">
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

// Загрузка VPN категорий
function loadVPNCategories() {
    const vpnCategories = [
        {
            id: 'cheap',
            name: 'VPN Дешевый',
            icon: '💰',
            price: 299,
            color: 'cheap',
            features: [
                'Уменьшение пинга на 30-50ms',
                'Стабильное соединение',
                'Базовые сервера',
                'Поддержка в чате'
            ],
            description: 'Для начинающих игроков'
        },
        {
            id: 'medium',
            name: 'VPN Средний',
            icon: '⚡',
            price: 799,
            color: 'medium',
            features: [
                'Уменьшение пинга на 50-80ms',
                'Регистрация урона',
                'Залет в голову',
                'Приоритетные сервера',
                'Быстрая поддержка'
            ],
            description: 'Для опытных игроков'
        },
        {
            id: 'vip',
            name: 'VPN ВИП',
            icon: '👑',
            price: 1499,
            color: 'vip',
            features: [
                'Уменьшение пинга на 80-120ms',
                'ВСЕ фичи из предыдущих тарифов',
                'Эксклюзивные сервера',
                'Приоритет на матчмейкинге',
                'VIP поддержка 24/7',
                'Автоматический подбор сервера',
                'Анти-лаг защита',
                'Статистика игр'
            ],
            description: 'Для профессионалов'
        }
    ];
    
    displayVPNCategories(vpnCategories);
    setupVPNModal(vpnCategories);
}

// Отображение категорий VPN
function displayVPNCategories(categories) {
    const container = document.getElementById('categories-container');
    
    container.innerHTML = categories.map(category => `
        <div class="vpn-category-card ${category.color}">
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
                        <i class="fas fa-check"></i>
                        <span>${feature}</span>
                    </div>
                `).join('')}
            </div>
            
            <p style="color: #94a3b8; font-size: 12px; margin-bottom: 16px;">
                ${category.description}
            </p>
            
            <button class="category-btn btn-${category.color}" onclick="showPayment('${category.id}')">
                Купить
                <i class="fas fa-arrow-right"></i>
            </button>
        </div>
    `).join('');
}

// Настройка модального окна VPN
function setupVPNModal(categories) {
    const modalContent = document.getElementById('vpn-selection');
    
    modalContent.innerHTML = categories.map(category => `
        <div class="vpn-modal-card ${category.color}" style="
            background: linear-gradient(135deg, rgba(26, 32, 44, 0.9) 0%, rgba(45, 55, 72, 0.9) 100%);
            border-radius: 16px;
            padding: 20px;
            margin-bottom: 16px;
            border-left: 4px solid ${getCategoryColor(category.color)};
        ">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                <div style="display: flex; align-items: center; gap: 12px;">
                    <span style="font-size: 32px;">${category.icon}</span>
                    <div>
                        <h4 style="font-size: 18px; font-weight: 800; color: white; margin-bottom: 4px;">
                            ${category.name}
                        </h4>
                        <p style="color: #94a3b8; font-size: 12px;">${category.description}</p>
                    </div>
                </div>
                <div style="font-size: 24px; font-weight: 800; color: ${getCategoryColor(category.color)};">
                    ${category.price}₽
                </div>
            </div>
            
            <div style="margin-bottom: 20px;">
                ${category.features.map(feature => `
                    <div style="display: flex; align-items: center; gap: 10px; padding: 8px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.05);">
                        <i class="fas fa-check" style="color: #38a169; font-size: 12px;"></i>
                        <span style="font-size: 14px;">${feature}</span>
                    </div>
                `).join('')}
            </div>
            
            <button onclick="showPayment('${category.id}')" style="
                width: 100%;
                padding: 16px;
                background: ${getCategoryColor(category.color)};
                border: none;
                border-radius: 12px;
                color: white;
                font-weight: 700;
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

// Показать окно оплаты
function showPayment(categoryId) {
    const categories = {
        'cheap': { name: 'VPN Дешевый', price: 299 },
        'medium': { name: 'VPN Средний', price: 799 },
        'vip': { name: 'VPN ВИП', price: 1499 }
    };
    
    const category = categories[categoryId];
    if (!category) return;
    
    currentPaymentData = {
        id: categoryId,
        name: category.name,
        price: category.price
    };
    
    const paymentContent = document.getElementById('payment-content');
    paymentContent.innerHTML = `
        <div class="payment-info">
            <h4 style="font-size: 20px; font-weight: 800; color: white; margin-bottom: 8px; text-align: center;">
                ${category.name}
            </h4>
            <p style="color: #94a3b8; text-align: center; margin-bottom: 20px;">
                Сумма к оплате: <strong style="color: var(--pubg-orange); font-size: 24px;">${category.price}₽</strong>
            </p>
        </div>
        
        <div class="payment-details">
            <h4 style="font-size: 16px; font-weight: 600; color: white; margin-bottom: 16px;">
                <i class="fas fa-credit-card"></i>
                Реквизиты для оплаты
            </h4>
            
            <div class="bank-card">
                <div style="color: #94a3b8; font-size: 12px; margin-bottom: 8px;">
                    Банковская карта
                </div>
                <div class="card-number">2200 0000 0000 0000</div>
                <div class="card-info">
                    <div>
                        <div style="color: #94a3b8; font-size: 10px;">Срок действия</div>
                        <div style="color: white; font-weight: 600;">01/28</div>
                    </div>
                    <div>
                        <div style="color: #94a3b8; font-size: 10px;">CVC</div>
                        <div style="color: white; font-weight: 600;">123</div>
                    </div>
                </div>
            </div>
            
            <div style="color: #94a3b8; font-size: 12px; text-align: center; margin-top: 12px;">
                Получатель: Иван Иванов
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
    `;
    
    closeModal();
    openPaymentModal();
}

// Открыть модальное окно оплаты
function openPaymentModal() {
    const modal = document.getElementById('payment-modal');
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

// Закрыть модальное окно оплаты
function closePaymentModal() {
    const modal = document.getElementById('payment-modal');
    modal.classList.remove('active');
    document.body.style.overflow = '';
}

// Открыть загрузку чека
function openReceiptUpload() {
    closePaymentModal();
    
    const modal = document.getElementById('receipt-modal');
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

// Закрыть загрузку чека
function closeReceiptModal() {
    const modal = document.getElementById('receipt-modal');
    modal.classList.remove('active');
    document.body.style.overflow = '';
}

// Обработка загрузки файла
function handleReceiptUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Проверка размера файла (макс 5MB)
    if (file.size > 5 * 1024 * 1024) {
        showNotification('❌ Файл слишком большой (макс 5MB)');
        return;
    }
    
    // Проверка типа файла
    if (!file.type.startsWith('image/')) {
        showNotification('❌ Пожалуйста, загрузите изображение');
        return;
    }
    
    receiptFile = file;
    
    // Показываем выбранный файл
    const uploadArea = document.getElementById('upload-area');
    const selectedFile = document.getElementById('selected-file');
    const fileName = document.getElementById('file-name');
    const submitBtn = document.getElementById('submit-receipt');
    
    uploadArea.style.display = 'none';
    selectedFile.style.display = 'flex';
    fileName.textContent = file.name;
    submitBtn.disabled = false;
}

// Удалить файл
function removeFile() {
    const uploadArea = document.getElementById('upload-area');
    const selectedFile = document.getElementById('selected-file');
    const fileInput = document.getElementById('receipt-file');
    const submitBtn = document.getElementById('submit-receipt');
    
    uploadArea.style.display = 'block';
    selectedFile.style.display = 'none';
    fileInput.value = '';
    submitBtn.disabled = true;
    receiptFile = null;
}

// Отправить чек на проверку
function submitReceipt() {
    if (!receiptFile || !currentPaymentData) {
        showNotification('❌ Сначала загрузите чек');
        return;
    }
    
    // Создаем FormData
    const formData = new FormData();
    formData.append('receipt', receiptFile);
    formData.append('payment_data', JSON.stringify({
        user_id: user?.id || 'unknown',
        user_name: user?.first_name || 'Unknown',
        vpn_type: currentPaymentData.id,
        vpn_name: currentPaymentData.name,
        amount: currentPaymentData.price,
        timestamp: new Date().toISOString()
    }));
    
    // Показываем уведомление
    showNotification('📤 Отправляем чек на проверку...');
    
    // Имитация отправки на сервер
    setTimeout(() => {
        // Здесь должен быть реальный fetch запрос к вашему бэкенду
        // Например: fetch('/api/submit-receipt', { method: 'POST', body: formData })
        
        // Имитируем успешную отправку
        showNotification('✅ Чек отправлен! Админ проверит в течение 15 минут');
        
        // Закрываем модальное окно
        closeReceiptModal();
        
        // Сохраняем покупку в локальное хранилище
        savePurchase({
            id: Date.now().toString(),
            name: currentPaymentData.name,
            amount: currentPaymentData.price,
            status: 'pending',
            date: new Date().toLocaleString('ru-RU'),
            order_id: `FLOWIE-${Date.now().toString().slice(-6)}`
        });
        
        // Обновляем список покупок
        loadPurchases();
        
        // Отправляем уведомление админу через Telegram Bot API
        // (Это нужно настроить на вашем сервере)
        notifyAdminAboutPayment();
        
    }, 1500);
}

// Уведомить админа о платеже
function notifyAdminAboutPayment() {
    // Эта функция должна отправлять запрос к вашему боту
    // для уведомления админа о новом платеже
    
    // Примерная структура данных для бота:
    const adminNotification = {
        user_id: user?.id,
        user_name: user?.first_name || 'Unknown',
        amount: currentPaymentData.price,
        vpn_type: currentPaymentData.name,
        order_id: `FLOWIE-${Date.now().toString().slice(-6)}`,
        timestamp: new Date().toISOString()
    };
    
    console.log('Уведомление для админа:', adminNotification);
    // fetch('/api/notify-admin', { method: 'POST', body: JSON.stringify(adminNotification) })
}

// Сохранить покупку
function savePurchase(purchase) {
    let purchases = JSON.parse(localStorage.getItem('flowie_purchases') || '[]');
    purchases.push(purchase);
    localStorage.setItem('flowie_purchases', JSON.stringify(purchases));
}

// Загрузить покупки
function loadPurchases() {
    const purchases = JSON.parse(localStorage.getItem('flowie_purchases') || '[]');
    const container = document.getElementById('purchases-list');
    const purchasesSection = document.getElementById('my-purchases');
    
    if (purchases.length === 0) {
        container.innerHTML = `
            <div class="no-purchases" style="text-align: center; padding: 40px 20px; color: #94a3b8;">
                <i class="fas fa-shopping-cart" style="font-size: 48px; margin-bottom: 16px;"></i>
                <p>У вас пока нет покупок</p>
            </div>
        `;
        purchasesSection.style.display = 'none';
        return;
    }
    
    purchasesSection.style.display = 'block';
    
    container.innerHTML = purchases.map(purchase => `
        <div class="purchase-item">
            <div class="purchase-header">
                <div class="purchase-name">${purchase.name}</div>
                <div class="purchase-status status-${purchase.status}">
                    ${getStatusText(purchase.status)}
                </div>
            </div>
            
            <div class="purchase-details">
                <div class="purchase-detail">
                    Сумма: <strong>${purchase.amount}₽</strong>
                </div>
                <div class="purchase-detail">
                    Дата: <strong>${purchase.date}</strong>
                </div>
                <div class="purchase-detail">
                    Заказ: <strong>${purchase.order_id}</strong>
                </div>
            </div>
            
            ${purchase.status === 'pending' ? `
                <div style="font-size: 12px; color: #f59e0b; text-align: center; padding: 8px; background: rgba(245, 158, 11, 0.1); border-radius: 8px;">
                    ⏳ Ожидает проверки администратором
                </div>
            ` : purchase.status === 'confirmed' ? `
                <div style="font-size: 12px; color: #22c55e; text-align: center; padding: 8px; background: rgba(34, 197, 94, 0.1); border-radius: 8px;">
                    ✅ Оплата подтверждена! VPN активирован.
                </div>
            ` : `
                <div style="font-size: 12px; color: #ef4444; text-align: center; padding: 8px; background: rgba(239, 68, 68, 0.1); border-radius: 8px;">
                    ❌ Платеж отклонен. Свяжитесь с поддержкой.
                </div>
            `}
        </div>
    `).join('');
}

function getStatusText(status) {
    switch(status) {
        case 'pending': return 'ОЖИДАНИЕ';
        case 'confirmed': return 'ПОДТВЕРЖДЕНО';
        case 'rejected': return 'ОТКЛОНЕНО';
        default: return 'НЕИЗВЕСТНО';
    }
}

// Загрузка данных пользователя
function loadUserData() {
    // Проверяем активную подписку
    const activeSubscription = localStorage.getItem('flowie_active_subscription');
    const subscriptionCard = document.getElementById('subscription-card');
    
    if (activeSubscription) {
        const sub = JSON.parse(activeSubscription);
        subscriptionCard.innerHTML = `
            <div class="sub-info">
                <div class="sub-name">${sub.name}</div>
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
        
        // Активируем VPN
        selectedVPN = sub.type;
    }
    
    // Загружаем покупки
    loadPurchases();
}

// Случайное число
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Показать профиль
function showProfile() {
    if (!user) {
        showNotification('👤 Профиль пользователя');
        return;
    }
    
    const userName = user.first_name || 'Игрок';
    const userId = user.id || 'Неизвестно';
    
    tg.showPopup({
        title: '👤 Профиль игрока',
        message: `🎮 ${userName}\n🆔 ID: ${userId}\n\n📊 Управление аккаунтом:\n• История покупок\n• Настройки VPN\n• Поддержка\n\nСвяжитесь с @flowie_cfg для помощи`,
        buttons: [
            { id: 'purchases', type: 'default', text: '📦 Мои покупки' },
            { type: 'cancel', text: 'Закрыть' }
        ]
    }, (buttonId) => {
        if (buttonId === 'purchases') {
            showSection('purchases');
        }
    });
}

// Показать раздел покупок
function showSection(section) {
    if (section === 'purchases') {
        loadPurchases();
        const element = document.getElementById('my-purchases');
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    }
    
    // Обновляем активную кнопку
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.closest('.nav-btn').classList.add('active');
}

// Остальной код остается таким же как в предыдущей версии...
// (updatePing, toggleVPN, changeServer, showNotification, etc.)

// Функции для работы с модальными окнами
function showVPNModal() {
    const modal = document.getElementById('vpn-modal');
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

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

// Вебхук для получения статуса платежа от бота
// (Этот код должен быть на вашем сервере)
async function handlePaymentStatus(orderId, status) {
    // Обновляем статус покупки
    let purchases = JSON.parse(localStorage.getItem('flowie_purchases') || '[]');
    const purchaseIndex = purchases.findIndex(p => p.order_id === orderId);
    
    if (purchaseIndex !== -1) {
        purchases[purchaseIndex].status = status;
        localStorage.setItem('flowie_purchases', JSON.stringify(purchases));
        
        // Если платеж подтвержден, активируем подписку
        if (status === 'confirmed') {
            const purchase = purchases[purchaseIndex];
            localStorage.setItem('flowie_active_subscription', JSON.stringify({
                name: purchase.name,
                type: getVPNTypeByName(purchase.name),
                activated_at: new Date().toISOString()
            }));
            
            showNotification(`🎉 ${purchase.name} активирован! Перезагрузите страницу.`);
        }
        
        // Обновляем интерфейс
        loadPurchases();
        loadUserData();
    }
}

function getVPNTypeByName(name) {
    if (name.includes('Дешевый')) return 'cheap';
    if (name.includes('Средний')) return 'medium';
    if (name.includes('ВИП')) return 'vip';
    return 'cheap';
}

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', function() {
    // Проверяем параметры URL для обработки коллбэков от бота
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get('payment');
    const orderId = urlParams.get('order_id');
    
    if (paymentStatus && orderId) {
        handlePaymentStatus(orderId, paymentStatus);
        // Убираем параметры из URL
        window.history.replaceState({}, document.title, window.location.pathname);
    }
});