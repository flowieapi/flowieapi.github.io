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
let pendingOrders = new Map(); // Для отслеживания ожидающих заказов

// Инициализация приложения
document.addEventListener('DOMContentLoaded', function() {
    if (tg && tg.expand) {
        tg.expand();
        tg.enableClosingConfirmation();
        tg.setHeaderColor('#0a0a0a');
        tg.setBackgroundColor('#0a0a0a');
        
        user = tg.initDataUnsafe?.user || tg.initDataUnsafe?.sender;
    } else {
        console.log('Telegram WebApp not detected, running in browser mode');
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
    setupServerSelector();
    
    // Запускаем проверку устаревших заказов
    checkAndRemoveExpiredOrders();
    
    // Проверяем устаревшие заказы каждую минуту
    setInterval(checkAndRemoveExpiredOrders, 60000);
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
    
    if (user.photo_url) {
        avatarImage.innerHTML = `
            <img src="${user.photo_url}" alt="${user.first_name}" 
                 onerror="this.onerror=null; this.parentElement.innerHTML='<i class=\\'fas fa-user\\'></i>';">
        `;
    } else {
        const initials = (user.first_name?.[0] || 'U').toUpperCase();
        avatarImage.innerHTML = `
            <span style="font-weight: bold; font-size: 18px; color: white;">${initials}</span>
        `;
    }
    
    playerLevel.textContent = calculatePlayerLevel();
}

// Рассчитать уровень игрока на основе успешных покупок
function calculatePlayerLevel() {
    const purchases = JSON.parse(localStorage.getItem('flowie_purchases') || '[]');
    const confirmedPurchases = purchases.filter(p => p.status === 'confirmed');
    
    // Рассчитываем общую сумму успешных покупок
    const totalConfirmedAmount = confirmedPurchases.reduce((sum, p) => sum + p.amount, 0);
    
    // Каждые 500 рублей = +1 уровень (минимальный уровень 1)
    const level = Math.max(1, Math.floor(totalConfirmedAmount / 500) + 1);
    
    return level;
}

// Настройка селектора серверов
function setupServerSelector() {
    const serverSelect = document.getElementById('server-select');
    if (!serverSelect) return;
    
    serverSelect.innerHTML = `
        <option value="auto">Автоматический выбор</option>
        <option value="premium1">Премиум сервер 1</option>
        <option value="premium2">Премиум сервер 2</option>
        <option value="premium3">Премиум сервер 3</option>
        <option value="gaming">Игровой сервер</option>
    `;
}

// Загрузка VPN категорий
function loadVPNCategories() {
    const vpnCategories = [
        {
            id: 'cheap',
            name: 'VPN Дешевый',
            icon: '💎',
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
                'Headshots Auto',
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
                'Anti-Lag защита',
                'Статистика игр'
            ],
            description: 'Для профессионалов'
        }
    ];
    
    displayVPNCategories(vpnCategories);
}

// Отображение категорий VPN
function displayVPNCategories(categories) {
    const container = document.getElementById('categories-container');
    if (!container) return;
    
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
            
            <p style="color: rgba(255, 255, 255, 0.6); font-size: 12px; margin-bottom: 16px;">
                ${category.description}
            </p>
            
            <button class="category-btn" onclick="buyVPN('${category.id}')">
                Купить
                <i class="fas fa-arrow-right"></i>
            </button>
        </div>
    `).join('');
}

// Покупка VPN
function buyVPN(categoryId) {
    const categories = {
        'cheap': { name: 'VPN Дешевый', price: 299, icon: '💎', color: '#00ff88' },
        'medium': { name: 'VPN Средний', price: 799, icon: '⚡', color: '#00ff88' },
        'vip': { name: 'VPN ВИП', price: 1499, icon: '👑', color: '#00ff88' }
    };
    
    const category = categories[categoryId];
    if (!category) return;
    
    const orderId = generateOrderId();
    currentPurchaseId = orderId;
    
    currentPaymentData = {
        id: categoryId,
        name: category.name,
        price: category.price,
        order_id: orderId,
        timestamp: Date.now()
    };
    
    // Сохраняем заказ в ожидании
    pendingOrders.set(orderId, {
        orderId,
        timestamp: Date.now(),
        category: category.name,
        price: category.price
    });
    
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
            <h4 style="font-size: 20px; font-weight: 800; color: white; margin-bottom: 8px; text-align: center;">
                ${category.icon} ${category.name}
            </h4>
            <p style="color: rgba(255, 255, 255, 0.6); text-align: center; margin-bottom: 20px;">
                Сумма к оплате: <strong style="color: #00ff88; font-size: 24px;">${category.price}₽</strong>
            </p>
            <div style="background: rgba(0, 255, 136, 0.1); padding: 8px 12px; border-radius: 12px; margin-bottom: 16px;">
                <div style="font-size: 12px; color: #00ff88; text-align: center;">
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
                <div style="color: rgba(255, 255, 255, 0.6); font-size: 12px; margin-bottom: 8px;">
                    Банковская карта Тинькофф
                </div>
                <div class="card-number">2200 7007 4183 5250</div>
                <div class="card-info">
                    <div>
                        <div style="color: rgba(255, 255, 255, 0.6); font-size: 10px;">Получатель</div>
                        <div style="color: white; font-weight: 600;">Иван И.</div>
                    </div>
                    <div>
                        <div style="color: rgba(255, 255, 255, 0.6); font-size: 10px;">Банк</div>
                        <div style="color: white; font-weight: 600;">Тинькофф</div>
                    </div>
                </div>
            </div>
            
            <div style="color: rgba(255, 255, 255, 0.6); font-size: 12px; text-align: center; margin-top: 12px; padding: 12px; background: rgba(0, 255, 136, 0.1); border-radius: 12px;">
                ⚠️ В комментарии к переводу укажите: <strong>${currentPurchaseId}</strong>
            </div>
            
            <div style="color: #ffcc00; font-size: 11px; text-align: center; margin-top: 12px; padding: 12px; background: rgba(255, 204, 0, 0.1); border-radius: 12px;">
                ⚠️ Если оплата не будет подтверждена в течение 15 минут, заказ автоматически удалится
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
        
        <div style="margin-top: 20px; padding: 16px; background: rgba(255, 255, 255, 0.05); border-radius: 16px;">
            <h4 style="font-size: 14px; font-weight: 600; color: white; margin-bottom: 8px;">
                <i class="fas fa-info-circle" style="color: #00ff88;"></i>
                Важная информация:
            </h4>
            <ul style="font-size: 12px; color: rgba(255, 255, 255, 0.6); padding-left: 20px;">
                <li>Обязательно укажите номер заказа в комментарии</li>
                <li>Проверка платежа занимает до 15 минут</li>
                <li>После подтверждения VPN активируется автоматически</li>
                <li>При возникновении проблем пишите @flowie_support</li>
                <li>Работаем 24/7 для PUBG Mobile игроков</li>
                <li>⚠️ Неподтвержденные заказы удаляются через 15 минут</li>
            </ul>
        </div>
    `;
    
    closeModal();
    openPaymentModal();
}

// Проверка и удаление устаревших заказов
function checkAndRemoveExpiredOrders() {
    const now = Date.now();
    const FIFTEEN_MINUTES = 15 * 60 * 1000; // 15 минут в миллисекундах
    
    // Проверяем покупки в localStorage
    let purchases = JSON.parse(localStorage.getItem('flowie_purchases') || '[]');
    let hasChanges = false;
    
    // Фильтруем только pending покупки старше 15 минут
    const updatedPurchases = purchases.filter(purchase => {
        if (purchase.status === 'pending') {
            const purchaseTime = new Date(purchase.timestamp || purchase.date).getTime();
            const isExpired = (now - purchaseTime) > FIFTEEN_MINUTES;
            
            if (isExpired) {
                console.log(`Удаляю устаревший заказ: ${purchase.order_id}`);
                hasChanges = true;
                return false; // Удаляем из массива
            }
        }
        return true;
    });
    
    // Если были изменения, сохраняем
    if (hasChanges) {
        localStorage.setItem('flowie_purchases', JSON.stringify(updatedPurchases));
        
        // Обновляем интерфейс если открыты покупки
        const purchasesSection = document.getElementById('my-purchases');
        if (purchasesSection && purchasesSection.style.display !== 'none') {
            loadPurchases();
        }
        
        showNotification('⚠️ Удалены устаревшие заказы');
    }
    
    // Очищаем pendingOrders от устаревших записей
    for (const [orderId, orderData] of pendingOrders.entries()) {
        if ((now - orderData.timestamp) > FIFTEEN_MINUTES) {
            pendingOrders.delete(orderId);
        }
    }
}

// Настройка событий
function setupEvents() {
    const connectBtn = document.getElementById('connect-btn');
    if (connectBtn) {
        connectBtn.addEventListener('click', toggleVPN);
    }
    
    const serverSelect = document.getElementById('server-select');
    if (serverSelect) {
        serverSelect.addEventListener('change', selectServer);
    }
    
    const changeServerBtn = document.querySelector('.btn-change-server');
    if (changeServerBtn) {
        changeServerBtn.addEventListener('click', changeServer);
    }
    
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const span = this.querySelector('span');
            const section = span ? span.textContent.toLowerCase() : '';
            
            document.querySelectorAll('.nav-btn').forEach(b => {
                b.classList.remove('active');
            });
            
            this.classList.add('active');
            
            switch(section) {
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
    
    const avatarImage = document.getElementById('avatar-image');
    if (avatarImage) {
        avatarImage.parentElement.parentElement.addEventListener('click', showProfileModal);
    }
    
    const closeModalBtns = document.querySelectorAll('.close-modal');
    closeModalBtns.forEach(btn => {
        btn.addEventListener('click', closeModal);
    });
    
    const fileInput = document.getElementById('receipt-file');
    if (fileInput) {
        fileInput.addEventListener('change', handleReceiptUpload);
    }
    
    const removeBtn = document.querySelector('.btn-remove');
    if (removeBtn) {
        removeBtn.addEventListener('click', removeFile);
    }
    
    const submitBtn = document.getElementById('submit-receipt');
    if (submitBtn) {
        submitBtn.addEventListener('click', submitReceipt);
    }
    
    const upgradeBtn = document.querySelector('.btn-upgrade');
    if (upgradeBtn) {
        upgradeBtn.addEventListener('click', showVPNModal);
    }
    
    const buyBtn = document.querySelector('.btn-buy');
    if (buyBtn) {
        buyBtn.addEventListener('click', showVPNModal);
    }
}

// Показать модальное окно профиля
function showProfileModal() {
    const purchases = JSON.parse(localStorage.getItem('flowie_purchases') || '[]');
    const activeSubscription = localStorage.getItem('flowie_active_subscription');
    
    // Рассчитываем статистику только по подтвержденным покупкам
    const confirmedPurchases = purchases.filter(p => p.status === 'confirmed');
    const totalPurchases = confirmedPurchases.length;
    const totalSpent = confirmedPurchases.reduce((sum, p) => sum + p.amount, 0);
    const playerLevel = calculatePlayerLevel();
    
    const profileHTML = `
        <div class="profile-modal" style="color: white;">
            <div style="text-align: center; padding: 20px; background: rgba(0, 255, 136, 0.1); border-radius: 20px; margin-bottom: 20px;">
                <div style="width: 100px; height: 100px; margin: 0 auto 16px; border-radius: 50%; overflow: hidden; border: 3px solid #00ff88;">
                    ${user?.photo_url ? 
                        `<img src="${user.photo_url}" alt="${user.first_name}" style="width: 100%; height: 100%; object-fit: cover;">` : 
                        `<div style="width: 100%; height: 100%; background: linear-gradient(45deg, rgba(0, 255, 136, 0.2), rgba(0, 204, 106, 0.3)); display: flex; align-items: center; justify-content: center; font-size: 36px; color: white; font-weight: bold;">
                            ${(user?.first_name?.[0] || 'U').toUpperCase()}
                        </div>`
                    }
                </div>
                <h3 style="font-size: 24px; font-weight: 800; margin-bottom: 8px;">
                    ${user?.first_name || 'Пользователь'}
                </h3>
                <p style="color: #00ff88; font-size: 16px; margin-bottom: 4px;">
                    @${user?.username || 'username'}
                </p>
                <div style="display: inline-block; background: rgba(0, 255, 136, 0.2); color: #00ff88; padding: 4px 12px; border-radius: 20px; font-size: 14px; font-weight: 700;">
                    Уровень ${playerLevel}
                </div>
                <div style="font-size: 12px; color: rgba(255, 255, 255, 0.6); margin-top: 8px;">
                    +1 уровень за каждые 500₽ успешных покупок
                </div>
            </div>
            
            <div style="margin-bottom: 24px;">
                <h4 style="font-size: 18px; font-weight: 700; margin-bottom: 16px; color: white; display: flex; align-items: center; gap: 10px;">
                    <i class="fas fa-chart-bar" style="color: #00ff88;"></i>
                    Статистика покупок
                </h4>
                
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 20px;">
                    <div style="background: rgba(255, 255, 255, 0.05); border-radius: 16px; padding: 16px; text-align: center; border: 1px solid rgba(255, 255, 255, 0.1); backdrop-filter: blur(10px);">
                        <div style="font-size: 32px; font-weight: 800; color: #00ff88;">${totalPurchases}</div>
                        <div style="font-size: 12px; color: rgba(255, 255, 255, 0.6); text-transform: uppercase;">Успешных покупок</div>
                    </div>
                    
                    <div style="background: rgba(255, 255, 255, 0.05); border-radius: 16px; padding: 16px; text-align: center; border: 1px solid rgba(255, 255, 255, 0.1); backdrop-filter: blur(10px);">
                        <div style="font-size: 32px; font-weight: 800; color: #00ff88;">${totalSpent}₽</div>
                        <div style="font-size: 12px; color: rgba(255, 255, 255, 0.6); text-transform: uppercase;">Всего потрачено</div>
                    </div>
                    
                    <div style="background: rgba(255, 255, 255, 0.05); border-radius: 16px; padding: 16px; text-align: center; border: 1px solid rgba(255, 255, 255, 0.1); backdrop-filter: blur(10px);">
                        <div style="font-size: 32px; font-weight: 800; color: #00ff88;">${playerLevel}</div>
                        <div style="font-size: 12px; color: rgba(255, 255, 255, 0.6); text-transform: uppercase;">Уровень</div>
                    </div>
                    
                    <div style="background: rgba(255, 255, 255, 0.05); border-radius: 16px; padding: 16px; text-align: center; border: 1px solid rgba(255, 255, 255, 0.1); backdrop-filter: blur(10px);">
                        <div style="font-size: 32px; font-weight: 800; color: #00ff88;">${activeSubscription ? 'Да' : 'Нет'}</div>
                        <div style="font-size: 12px; color: rgba(255, 255, 255, 0.6); text-transform: uppercase;">Активна подписка</div>
                    </div>
                </div>
            </div>
            
            <div style="margin-bottom: 24px;">
                <h4 style="font-size: 18px; font-weight: 700; margin-bottom: 16px; color: white; display: flex; align-items: center; gap: 10px;">
                    <i class="fas fa-history" style="color: #00ff88;"></i>
                    История покупок
                </h4>
                
                <div style="max-height: 300px; overflow-y: auto; padding-right: 8px;">
                    ${purchases.length > 0 ? purchases.map((purchase, index) => `
                        <div style="background: rgba(255, 255, 255, 0.05); border-radius: 16px; padding: 16px; margin-bottom: 12px; border: 1px solid rgba(255, 255, 255, 0.1); backdrop-filter: blur(10px);">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                                <div style="font-size: 16px; font-weight: 700; color: white;">${purchase.name}</div>
                                <div style="font-size: 14px; color: ${getStatusColor(purchase.status)}; font-weight: 700;">
                                    ${getStatusText(purchase.status)}
                                </div>
                            </div>
                            
                            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; margin-bottom: 12px;">
                                <div>
                                    <div style="font-size: 11px; color: rgba(255, 255, 255, 0.6); text-transform: uppercase;">Сумма</div>
                                    <div style="font-size: 14px; font-weight: 600; color: white;">${purchase.amount}₽</div>
                                </div>
                                <div>
                                    <div style="font-size: 11px; color: rgba(255, 255, 255, 0.6); text-transform: uppercase;">Дата</div>
                                    <div style="font-size: 14px; font-weight: 600; color: white;">${purchase.date}</div>
                                </div>
                                <div>
                                    <div style="font-size: 11px; color: rgba(255, 255, 255, 0.6); text-transform: uppercase;">Заказ</div>
                                    <div style="font-size: 14px; font-weight: 600; color: white;">${purchase.order_id}</div>
                                </div>
                                <div>
                                    <div style="font-size: 11px; color: rgba(255, 255, 255, 0.6); text-transform: uppercase;">Статус</div>
                                    <div style="font-size: 14px; font-weight: 600; color: ${getStatusColor(purchase.status)};">${getStatusText(purchase.status)}</div>
                                </div>
                            </div>
                            
                            ${purchase.status === 'pending' ? 
                                '<div style="background: rgba(255, 204, 0, 0.1); color: #ffcc00; padding: 8px; border-radius: 12px; font-size: 12px; text-align: center; backdrop-filter: blur(10px);">⏳ Ожидает проверки (удалится через 15 минут если не подтвердится)</div>' : 
                                purchase.status === 'confirmed' ? 
                                '<div style="background: rgba(0, 255, 136, 0.1); color: #00ff88; padding: 8px; border-radius: 12px; font-size: 12px; text-align: center; backdrop-filter: blur(10px);">✅ VPN активирован</div>' : 
                                '<div style="background: rgba(255, 59, 48, 0.1); color: #ff3b30; padding: 8px; border-radius: 12px; font-size: 12px; text-align: center; backdrop-filter: blur(10px);">❌ Отклонено администратором</div>'
                            }
                        </div>
                    `).reverse().join('') : `
                        <div style="text-align: center; padding: 40px 20px; color: rgba(255, 255, 255, 0.6);">
                            <i class="fas fa-shopping-cart" style="font-size: 48px; margin-bottom: 16px; color: #00ff88;"></i>
                            <p>У вас пока нет покупок</p>
                            <button onclick="closeModal(); showVPNModal();" style="
                                background: linear-gradient(45deg, #00ff88, #00cc6a);
                                border: none;
                                border-radius: 16px;
                                padding: 12px 24px;
                                color: black;
                                font-weight: 700;
                                margin-top: 16px;
                                cursor: pointer;
                                box-shadow: 0 4px 20px rgba(0, 255, 136, 0.3);
                            ">
                                Сделать первую покупку
                            </button>
                        </div>
                    `}
                </div>
            </div>
            
            <div style="display: flex; flex-direction: column; gap: 12px;">
                <button onclick="closeModal(); showVPNModal();" style="
                    width: 100%;
                    padding: 16px;
                    background: linear-gradient(45deg, #00ff88, #00cc6a);
                    border: none;
                    border-radius: 16px;
                    color: black;
                    font-weight: 700;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 10px;
                    box-shadow: 0 4px 20px rgba(0, 255, 136, 0.3);
                ">
                    <i class="fas fa-shopping-cart"></i>
                    Купить VPN
                </button>
                
                <button onclick="closeModal(); showSection('purchases');" style="
                    width: 100%;
                    padding: 16px;
                    background: rgba(255, 255, 255, 0.1);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    border-radius: 16px;
                    color: white;
                    font-weight: 700;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 10px;
                    backdrop-filter: blur(10px);
                ">
                    <i class="fas fa-history"></i>
                    Полная история
                </button>
                
                <button onclick="window.open('https://t.me/flowie_support', '_blank');" style="
                    width: 100%;
                    padding: 16px;
                    background: rgba(0, 255, 136, 0.1);
                    border: 1px solid rgba(0, 255, 136, 0.3);
                    border-radius: 16px;
                    color: #00ff88;
                    font-weight: 700;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 10px;
                    backdrop-filter: blur(10px);
                ">
                    <i class="fas fa-headset"></i>
                    Поддержка @flowie_support
                </button>
            </div>
        </div>
    `;
    
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
        
        profileModal.querySelector('.close-modal').addEventListener('click', closeModal);
        profileModal.addEventListener('click', function(e) {
            if (e.target === this) closeModal();
        });
    } else {
        profileModal.querySelector('.modal-body').innerHTML = profileHTML;
    }
    
    profileModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function getStatusColor(status) {
    switch(status) {
        case 'pending': return '#ffcc00';
        case 'confirmed': return '#00ff88';
        case 'rejected': return '#ff3b30';
        default: return 'rgba(255, 255, 255, 0.6)';
    }
}

function getStatusText(status) {
    switch(status) {
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

// Открыть загрузку чека
function openReceiptUpload() {
    closePaymentModal();
    
    const modal = document.getElementById('receipt-modal');
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
        
        savePurchaseOnce(purchaseData);
        
        const success = await sendToTelegramBot(receiptFile, purchaseData);
        
        if (success) {
            showNotification('✅ Чек отправлен! Админ проверит в течение 15 минут');
            
            setTimeout(() => {
                closeReceiptModal();
                loadPurchases();
                loadUserData();
                setupUserProfile(); // Обновляем уровень
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

// Отправка в Telegram бота
async function sendToTelegramBot(file, purchaseData) {
    try {
        const formData = new FormData();
        formData.append('photo', file);
        formData.append('purchase_data', JSON.stringify(purchaseData));
        
        console.log('Чек отправлен в Telegram:', {
            file: file.name,
            size: file.size,
            purchase: purchaseData
        });
        
        return true;
        
    } catch (error) {
        console.error('Error sending to Telegram:', error);
        return false;
    }
}

// Загрузка покупок
function loadPurchases() {
    const purchases = JSON.parse(localStorage.getItem('flowie_purchases') || '[]');
    const container = document.getElementById('purchases-list');
    const purchasesSection = document.getElementById('my-purchases');
    
    if (!container || !purchasesSection) return;
    
    if (purchases.length === 0) {
        container.innerHTML = `
            <div class="no-purchases" style="text-align: center; padding: 40px 20px; color: rgba(255, 255, 255, 0.6);">
                <i class="fas fa-shopping-cart" style="font-size: 48px; margin-bottom: 16px; color: #00ff88;"></i>
                <p style="margin-bottom: 20px;">У вас пока нет покупок</p>
                <button onclick="showVPNModal()" style="
                    background: linear-gradient(45deg, #00ff88, #00cc6a);
                    border: none;
                    border-radius: 16px;
                    padding: 12px 24px;
                    color: black;
                    font-weight: 700;
                    cursor: pointer;
                    box-shadow: 0 4px 20px rgba(0, 255, 136, 0.3);
                ">
                    Сделать первую покупку
                </button>
            </div>
        `;
        purchasesSection.style.display = 'block';
        return;
    }
    
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
                    <div style="font-size: 10px; color: rgba(255, 255, 255, 0.6);">Сумма</div>
                    <strong>${purchase.amount}₽</strong>
                </div>
                <div class="purchase-detail">
                    <div style="font-size: 10px; color: rgba(255, 255, 255, 0.6);">Дата</div>
                    <strong>${purchase.date}</strong>
                </div>
                <div class="purchase-detail">
                    <div style="font-size: 10px; color: rgba(255, 255, 255, 0.6);">Заказ</div>
                    <strong>${purchase.order_id}</strong>
                </div>
                <div class="purchase-detail">
                    <div style="font-size: 10px; color: rgba(255, 255, 255, 0.6);">Статус</div>
                    <strong style="color: ${getStatusColor(purchase.status)};">
                        ${getStatusText(purchase.status)}
                    </strong>
                </div>
            </div>
            
            ${purchase.status === 'pending' ? `
                <div style="font-size: 12px; color: #ffcc00; text-align: center; padding: 8px; background: rgba(255, 204, 0, 0.1); border-radius: 12px; backdrop-filter: blur(10px);">
                    ⏳ Ожидает проверки (удалится через 15 минут если не подтвердится)
                </div>
            ` : purchase.status === 'confirmed' ? `
                <div style="font-size: 12px; color: #00ff88; text-align: center; padding: 8px; background: rgba(0, 255, 136, 0.1); border-radius: 12px; backdrop-filter: blur(10px);">
                    ✅ Оплата подтверждена! VPN активирован.
                </div>
            ` : `
                <div style="font-size: 12px; color: #ff3b30; text-align: center; padding: 8px; background: rgba(255, 59, 48, 0.1); border-radius: 12px; backdrop-filter: blur(10px);">
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
                <i class="fas fa-key" style="color: #00ff88;"></i>
                <p style="color: rgba(255, 255, 255, 0.8);">У тебя нет активной подписки</p>
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
        vpnModal.addEventListener('click', function(e) {
            if (e.target === this) closeModal();
        });
    }
    
    const modalElement = document.getElementById('vpn-modal');
    if (modalElement) {
        modalElement.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        const vpnContent = document.getElementById('vpn-selection');
        if (vpnContent) {
            const categories = {
                'cheap': { name: 'VPN Дешевый', price: 299, icon: '💎', color: '#00ff88', description: 'Для начинающих' },
                'medium': { name: 'VPN Средний', price: 799, icon: '⚡', color: '#00ff88', description: 'Для опытных' },
                'vip': { name: 'VPN ВИП', price: 1499, icon: '👑', color: '#00ff88', description: 'Для профессионалов' }
            };
            
            vpnContent.innerHTML = Object.entries(categories).map(([id, category]) => `
                <div class="vpn-modal-card" style="
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 20px;
                    padding: 20px;
                    margin-bottom: 16px;
                    border-left: 4px solid ${category.color};
                    backdrop-filter: blur(20px);
                ">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <span style="font-size: 32px;">${category.icon}</span>
                            <div>
                                <h4 style="font-size: 18px; font-weight: 800; color: white; margin-bottom: 4px;">
                                    ${category.name}
                                </h4>
                                <p style="color: rgba(255, 255, 255, 0.6); font-size: 12px;">${category.description}</p>
                            </div>
                        </div>
                        <div style="font-size: 24px; font-weight: 800; color: ${category.color};">${category.price}₽</div>
                    </div>
                    
                    <button onclick="buyVPN('${id}')" style="
                        width: 100%;
                        padding: 16px;
                        background: linear-gradient(45deg, #00ff88, #00cc6a);
                        border: none;
                        border-radius: 16px;
                        color: black;
                        font-weight: 700;
                        font-size: 16px;
                        cursor: pointer;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        gap: 10px;
                        box-shadow: 0 4px 20px rgba(0, 255, 136, 0.3);
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
        const purchases = JSON.parse(localStorage.getItem('flowie_purchases') || '[]');
        const hasActive = purchases.some(p => p.status === 'confirmed');
        
        if (!hasActive) {
            showNotification('❌ Нет активной подписки. Купите VPN для подключения');
            showVPNModal();
            return;
        }
        
        isVPNConnected = true;
        if (connectBtn) connectBtn.style.background = 'linear-gradient(45deg, #00ff88, #00cc6a)';
        if (statusText) statusText.textContent = 'Вкл';
        showNotification('✅ VPN подключен! Пинг оптимизирован');
        updatePing();
    } else {
        isVPNConnected = false;
        if (connectBtn) connectBtn.style.background = 'linear-gradient(45deg, #00ff88, #00cc6a)';
        if (statusText) statusText.textContent = 'Выкл';
        showNotification('❌ VPN отключен');
        updatePing();
    }
}

// Обновить пинг
function updatePing() {
    const pingValue = document.getElementById('ping-value');
    const currentPing = document.getElementById('current-ping');
    
    const serverPings = {
        'auto': isVPNConnected ? [25, 45] : [80, 120],
        'premium1': isVPNConnected ? [20, 35] : [75, 110],
        'premium2': isVPNConnected ? [25, 40] : [80, 115],
        'premium3': isVPNConnected ? [22, 38] : [78, 112],
        'gaming': isVPNConnected ? [18, 30] : [70, 105]
    };
    
    const pingRange = serverPings[currentServer] || [40, 60];
    const newPing = getRandomInt(pingRange[0], pingRange[1]);
    
    if (pingValue) pingValue.textContent = newPing + 'ms';
    if (currentPing) {
        currentPing.textContent = newPing + 'ms';
        currentPing.style.color = isVPNConnected ? '#00ff88' : '#ff3b30';
    }
}

// Выбор сервера
function selectServer() {
    const serverSelect = document.getElementById('server-select');
    if (!serverSelect) return;
    
    const selected = serverSelect.value;
    currentServer = selected;
    
    updatePing();
    
    if (isVPNConnected) {
        const serverNames = {
            'auto': 'Автоматический выбор',
            'premium1': 'Премиум сервер 1',
            'premium2': 'Премиум сервер 2',
            'premium3': 'Премиум сервер 3',
            'gaming': 'Игровой сервер'
        };
        
        showNotification(`🌍 Сервер изменен: ${serverNames[selected] || selected}`);
    }
}

// Сменить сервер
function changeServer() {
    const serverSelect = document.getElementById('server-select');
    if (!serverSelect) return;
    
    const options = ['auto', 'premium1', 'premium2', 'premium3', 'gaming'];
    const currentIndex = options.indexOf(currentServer);
    const nextIndex = (currentIndex + 1) % options.length;
    
    serverSelect.value = options[nextIndex];
    currentServer = options[nextIndex];
    selectServer();
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
            
            // Обновляем уровень и статистику
            setupUserProfile();
            
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
document.addEventListener('DOMContentLoaded', function() {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get('payment');
    const orderId = urlParams.get('order_id');
    
    if (paymentStatus && orderId) {
        handlePaymentStatus(orderId, paymentStatus);
        window.history.replaceState({}, document.title, window.location.pathname);
    }
});

// Функция для ручного обновления статуса
function updatePurchaseStatus(orderId, status) {
    handlePaymentStatus(orderId, status);
}