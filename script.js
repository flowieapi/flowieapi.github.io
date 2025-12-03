// Инициализация Telegram Web App
let tg = window.Telegram.WebApp;
let user = null;
let isVPNConnected = false;
let currentServer = 'eu';
let selectedVPN = null;

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
    
    // Настраиваем события
    setupEvents();
    
    // Показываем приветственное сообщение
    setTimeout(() => {
        showNotification('🎮 Добро пожаловать в ФЛОУИ VPN для PUBG!');
    }, 800);
});

// Настройка профиля игрока
function setupUserProfile() {
    const avatar = document.getElementById('player-avatar');
    
    if (user?.photo_url) {
        avatar.innerHTML = `
            <div class="avatar-img">
                <img src="${user.photo_url}" alt="${user.first_name}" 
                     onerror="this.onerror=null; this.parentElement.innerHTML='<i class=\\'fas fa-skull-crossbones\\'></i>';">
            </div>
            <div class="player-level">${getPlayerLevel()}</div>
        `;
    }
    
    // Добавляем клик на аватар для профиля
    avatar.onclick = () => {
        showPlayerProfile();
    };
}

// Генерация уровня игрока
function getPlayerLevel() {
    return Math.floor(Math.random() * 100) + 1;
}

// Загрузка VPN категорий
function loadVPNCategories() {
    const vpnCategories = [
        {
            id: 'cheap',
            name: 'VPN Дешевый',
            icon: '💰',
            price: '299₽',
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
            price: '799₽',
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
            price: '1499₽',
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
                <div class="category-price">${category.price}</div>
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
            
            <button class="category-btn btn-${category.color}" onclick="selectVPNCategory('${category.id}')">
                Выбрать
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
                    ${category.price}
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
            
            <button onclick="buyVPN('${category.id}')" style="
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
                Купить ${category.name}
            </button>
        </div>
    `).join('');
}

// Получение цвета категории
function getCategoryColor(type) {
    switch(type) {
        case 'cheap': return '#38a169';
        case 'medium': return '#3182ce';
        case 'vip': return '#d69e2e';
        default: return '#ff8c00';
    }
}

// Настройка событий
function setupEvents() {
    // Кнопка подключения VPN
    const connectBtn = document.getElementById('connect-btn');
    connectBtn.addEventListener('touchstart', () => {
        connectBtn.style.transform = 'translateY(2px)';
        connectBtn.style.boxShadow = '0 2px 6px rgba(255, 140, 0, 0.4)';
    });
    
    connectBtn.addEventListener('touchend', () => {
        setTimeout(() => {
            connectBtn.style.transform = 'translateY(0)';
            connectBtn.style.boxShadow = '0 4px 12px rgba(255, 140, 0, 0.4)';
        }, 200);
    });
    
    // Навигационные кнопки
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('touchstart', function() {
            this.style.transform = 'scale(0.95)';
        });
        
        btn.addEventListener('touchend', function() {
            setTimeout(() => {
                this.style.transform = 'scale(1)';
            }, 200);
        });
    });
    
    // FAQ элементы
    document.querySelectorAll('.faq-item').forEach(item => {
        item.addEventListener('touchstart', function() {
            this.style.transform = 'scale(0.99)';
        });
        
        item.addEventListener('touchend', function() {
            setTimeout(() => {
                this.style.transform = 'scale(1)';
            }, 200);
        });
    });
}

// Обновление пинга
function updatePing() {
    const pingValue = document.getElementById('ping-value');
    const currentPing = document.getElementById('current-ping');
    
    // Генерация случайного пинга в зависимости от сервера
    let basePing = 45;
    if (currentServer === 'asia') basePing = 85;
    if (currentServer === 'na') basePing = 120;
    if (currentServer === 'ru') basePing = 25;
    
    // Если VPN подключен, уменьшаем пинг
    if (isVPNConnected && selectedVPN) {
        let reduction = 30;
        if (selectedVPN === 'medium') reduction = 50;
        if (selectedVPN === 'vip') reduction = 80;
        
        basePing = Math.max(15, basePing - reduction);
    }
    
    const ping = basePing;
    
    pingValue.textContent = `${ping}ms`;
    currentPing.textContent = `${ping}ms`;
    
    // Цвет пинга в зависимости от значения
    if (ping < 40) {
        pingValue.style.background = 'linear-gradient(45deg, #38a169, #68d391)';
    } else if (ping < 80) {
        pingValue.style.background = 'linear-gradient(45deg, #d69e2e, #ed8936)';
    } else {
        pingValue.style.background = 'linear-gradient(45deg, #e53e3e, #fc8181)';
    }
    
    // Обновляем каждые 5 секунд
    setTimeout(updatePing, 5000);
}

// Переключение VPN
function toggleVPN() {
    const connectBtn = document.getElementById('connect-btn');
    const statusText = document.getElementById('vpn-status');
    const btnIcon = connectBtn.querySelector('i');
    
    if (!selectedVPN) {
        showNotification('⚠️ Сначала выберите VPN тариф!');
        showVPNModal();
        return;
    }
    
    if (!isVPNConnected) {
        // Подключаем VPN
        isVPNConnected = true;
        statusText.textContent = 'Вкл';
        btnIcon.className = 'fas fa-stop';
        connectBtn.querySelector('span').textContent = 'Остановить VPN';
        
        showNotification(`✅ VPN ${getVPNName(selectedVPN)} подключен! Пинг уменьшен.`);
        
        // Вибрация
        if (navigator.vibrate) {
            navigator.vibrate([100, 50, 100]);
        }
    } else {
        // Отключаем VPN
        isVPNConnected = false;
        statusText.textContent = 'Выкл';
        btnIcon.className = 'fas fa-play';
        connectBtn.querySelector('span').textContent = 'Запустить VPN';
        
        showNotification('❌ VPN отключен');
    }
    
    updatePing();
}

// Получение имени VPN
function getVPNName(id) {
    switch(id) {
        case 'cheap': return 'Дешевый';
        case 'medium': return 'Средний';
        case 'vip': return 'ВИП';
        default: return '';
    }
}

// Смена сервера
function changeServer() {
    const servers = ['eu', 'asia', 'na', 'ru'];
    const currentIndex = servers.indexOf(currentServer);
    const nextIndex = (currentIndex + 1) % servers.length;
    currentServer = servers[nextIndex];
    
    const serverSelect = document.getElementById('server-select');
    serverSelect.value = currentServer;
    
    updatePing();
    showNotification(`🌍 Сервер изменен на: ${getServerName(currentServer)}`);
    
    // Вибрация
    if (navigator.vibrate) {
        navigator.vibrate(50);
    }
}

// Выбор сервера из списка
function selectServer() {
    const serverSelect = document.getElementById('server-select');
    currentServer = serverSelect.value;
    updatePing();
    showNotification(`🌍 Выбран сервер: ${getServerName(currentServer)}`);
}

// Получение имени сервера
function getServerName(code) {
    switch(code) {
        case 'eu': return 'Европа';
        case 'asia': return 'Азия';
        case 'na': return 'США';
        case 'ru': return 'Россия';
        default: return 'Европа';
    }
}

// Выбор категории VPN
function selectVPNCategory(categoryId) {
    selectedVPN = categoryId;
    showNotification(`✅ Выбран VPN: ${getVPNName(categoryId)}`);
    closeModal();
}

// Покупка VPN
function buyVPN(categoryId) {
    closeModal();
    
    const vpnName = getVPNName(categoryId);
    const prices = {
        'cheap': 299,
        'medium': 799,
        'vip': 1499
    };
    
    showNotification(`🛒 Покупка VPN ${vpnName} за ${prices[categoryId]}₽...`);
    
    // Имитация оплаты через Telegram
    setTimeout(() => {
        tg.showPopup({
            title: '💳 Оплата VPN',
            message: `Вы покупаете ${vpnName} VPN за ${prices[categoryId]}₽\n\nПосле оплаты все функции будут разблокированы!`,
            buttons: [
                { 
                    id: 'pay', 
                    type: 'default', 
                    text: `Оплатить ${prices[categoryId]}₽`
                },
                { 
                    type: 'cancel', 
                    text: 'Отмена'
                }
            ]
        }, (buttonId) => {
            if (buttonId === 'pay') {
                // Успешная оплата
                setTimeout(() => {
                    selectedVPN = categoryId;
                    showNotification(`🎉 VPN ${vpnName} успешно активирован!`);
                    
                    // Обновляем интерфейс
                    document.querySelector('.sub-name').textContent = `${vpnName} VPN`;
                    document.querySelector('.btn-upgrade').style.display = 'none';
                    
                    // Включаем VPN
                    if (!isVPNConnected) {
                        setTimeout(() => {
                            toggleVPN();
                        }, 1000);
                    }
                }, 1500);
            }
        });
    }, 800);
}

// Показать модальное окно VPN
function showVPNModal() {
    const modal = document.getElementById('vpn-modal');
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

// Закрыть модальное окно
function closeModal() {
    const modal = document.getElementById('vpn-modal');
    modal.classList.remove('active');
    document.body.style.overflow = '';
    
    if (navigator.vibrate) {
        navigator.vibrate(30);
    }
}

// Показать раздел
function showSection(section) {
    // Прокрутка к нужному разделу
    const sections = {
        'home': '.welcome-section',
        'vpn': '.vpn-categories',
        'stats': '.active-subscription',
        'support': '.faq-section',
        'profile': '.pubg-header'
    };
    
    const element = document.querySelector(sections[section]);
    if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
    }
    
    // Обновляем активную кнопку
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.closest('.nav-btn').classList.add('active');
    
    showNotification(`📱 Открыт раздел: ${getSectionName(section)}`);
}

function getSectionName(section) {
    const names = {
        'home': 'Главная',
        'vpn': 'VPN',
        'stats': 'Статистика',
        'support': 'Поддержка',
        'profile': 'Профиль'
    };
    return names[section] || 'Раздел';
}

// Показать профиль игрока
function showPlayerProfile() {
    if (!user) return;
    
    const userName = user.first_name || 'Игрок';
    const stats = {
        'Уровень': getPlayerLevel(),
        'Матчей сыграно': Math.floor(Math.random() * 1000) + 100,
        'Побед': Math.floor(Math.random() * 200) + 20,
        'K/D': (Math.random() * 3 + 1).toFixed(2)
    };
    
    const statsHTML = Object.entries(stats).map(([key, value]) => `
        <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.1);">
            <span style="color: #94a3b8;">${key}</span>
            <span style="font-weight: 700; color: var(--pubg-orange);">${value}</span>
        </div>
    `).join('');
    
    tg.showPopup({
        title: '🎮 Профиль игрока',
        message: `👤 ${userName}\n\n${statsHTML}`,
        buttons: [{ type: 'cancel', text: 'Закрыть' }]
    });
}

// Переключение FAQ
function toggleFAQ(element) {
    element.classList.toggle('active');
}

// Апгрейд подписки
function showUpgrade() {
    showVPNModal();
}

// Показать уведомление
function showNotification(message) {
    const notify = document.getElementById('notification');
    const text = document.getElementById('notify-text');
    
    if (!notify) return;
    
    text.textContent = message;
    notify.classList.add('show');
    
    setTimeout(() => {
        notify.classList.remove('show');
    }, 3000);
}

// Обработка событий Telegram
tg.onEvent('viewportChanged', () => {
    // Адаптация к изменению размера
});

tg.onEvent('themeChanged', () => {
    // Изменение темы
    if (tg.colorScheme === 'dark') {
        document.body.style.background = 'linear-gradient(180deg, #0f1419 0%, #111827 100%)';
    } else {
        document.body.style.background = 'linear-gradient(180deg, #f7fafc 0%, #edf2f7 100%)';
    }
});

// Адаптация к ориентации
window.addEventListener('orientationchange', () => {
    setTimeout(() => {
        document.documentElement.style.height = window.innerHeight + 'px';
    }, 300);
});

// Предотвращение зума
document.addEventListener('touchmove', (e) => {
    if (e.scale !== 1) {
        e.preventDefault();
    }
}, { passive: false });