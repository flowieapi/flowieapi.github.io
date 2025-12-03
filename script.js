// Telegram Web App инициализация
let tg = window.Telegram.WebApp;
let user = null;
let isConnected = false;

// Инициализация приложения
document.addEventListener('DOMContentLoaded', function() {
    // Настройки для мобильных
    tg.expand(); // Полноэкранный режим
    tg.enableClosingConfirmation(); // Подтверждение закрытия
    tg.setHeaderColor('#1e293b'); // Цвет шапки
    tg.setBackgroundColor('#0f172a'); // Цвет фона
    
    // Получаем данные пользователя
    user = tg.initDataUnsafe?.user || tg.initDataUnsafe?.sender;
    
    // Настраиваем аватарку
    setupUserProfile();
    
    // Загружаем тарифы
    loadTariffs();
    
    // Инициализируем данные подписки
    initSubscriptionData();
    
    // Настраиваем события
    setupEventListeners();
    
    // Показываем приветственное сообщение
    setTimeout(() => {
        showToast('Добро пожаловать в SHIELD VPN! 👋');
    }, 1000);
});

// Настройка профиля пользователя
function setupUserProfile() {
    const profileElement = document.getElementById('user-profile');
    
    if (!user) {
        // Если нет данных пользователя
        profileElement.innerHTML = `
            <div class="avatar-placeholder">
                <i class="fas fa-user"></i>
            </div>
        `;
        return;
    }
    
    // Создаем аватарку
    let avatarHTML = '';
    
    if (user.photo_url) {
        // Если есть фото профиля
        avatarHTML = `
            <div class="avatar-placeholder">
                <img src="${user.photo_url}" alt="${user.first_name}" 
                     onerror="this.onerror=null; this.parentElement.innerHTML='<i class=\\'fas fa-user\\'></i>';">
            </div>
        `;
    } else {
        // Если нет фото, показываем инициалы
        const initials = (user.first_name?.[0] || 'U').toUpperCase();
        avatarHTML = `
            <div class="avatar-placeholder">
                <span style="font-weight: bold; font-size: 18px;">${initials}</span>
            </div>
        `;
    }
    
    profileElement.innerHTML = avatarHTML;
    
    // Добавляем обработчик клика
    profileElement.onclick = () => {
        showProfileModal();
    };
}

// Загрузка тарифов
function loadTariffs() {
    const tariffs = [
        {
            id: '1',
            name: 'Месячный',
            price: 299,
            days: 30,
            emoji: '🌙',
            features: ['Все сервера', 'Базовая поддержка', '1 Гбит/с скорость'],
            popular: false
        },
        {
            id: '2',
            name: 'Оптимальный',
            price: 799,
            days: 90,
            emoji: '⭐',
            features: ['Приоритетная поддержка', '+10% скорость', 'Все сервера'],
            popular: true
        },
        {
            id: '3',
            name: 'Годовой VIP',
            price: 2999,
            days: 365,
            emoji: '👑',
            features: ['VIP поддержка 24/7', '+25% скорость', 'Персональный менеджер'],
            popular: false
        }
    ];
    
    displayTariffs(tariffs);
}

// Отображение тарифов в слайдере
function displayTariffs(tariffs) {
    const container = document.getElementById('tariffs-container');
    const modalContainer = document.getElementById('tariffs-list');
    
    let sliderHTML = '';
    let modalHTML = '';
    
    tariffs.forEach((tariff, index) => {
        // Для слайдера
        sliderHTML += `
            <div class="tariff-card-slide ${tariff.popular ? 'popular' : ''}">
                <div class="tariff-emoji-large">${tariff.emoji}</div>
                <h4 class="tariff-name">${tariff.name}</h4>
                <div class="tariff-price">${tariff.price} ₽</div>
                <p>на ${tariff.days} дней</p>
                <ul class="tariff-features-list">
                    ${tariff.features.map(feature => `
                        <li><i class="fas fa-check"></i> ${feature}</li>
                    `).join('')}
                </ul>
                <button class="tariff-btn" onclick="selectTariff('${tariff.id}')">
                    Выбрать тариф
                </button>
            </div>
        `;
        
        // Для модального окна
        modalHTML += `
            <div class="tariff-modal-item" style="
                background: ${tariff.popular ? 'linear-gradient(135deg, #1e293b 0%, #334155 100%)' : 'rgba(30, 41, 59, 0.8)'};
                border: 1px solid ${tariff.popular ? '#667eea' : 'rgba(255, 255, 255, 0.1)'};
                border-radius: 16px;
                padding: 20px;
                margin-bottom: 16px;
            ">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <span style="font-size: 24px;">${tariff.emoji}</span>
                        <h4 style="font-size: 18px; font-weight: 600;">${tariff.name}</h4>
                    </div>
                    ${tariff.popular ? '<span style="background: #667eea; color: white; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600;">ПОПУЛЯРНЫЙ</span>' : ''}
                </div>
                <div style="font-size: 28px; font-weight: 700; margin: 12px 0; color: #667eea;">
                    ${tariff.price} ₽
                </div>
                <p style="color: #94a3b8; margin-bottom: 16px;">на ${tariff.days} дней</p>
                <ul style="list-style: none; margin: 16px 0;">
                    ${tariff.features.map(feature => `
                        <li style="padding: 8px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.05); display: flex; align-items: center; gap: 8px;">
                            <i class="fas fa-check" style="color: #10b981;"></i>
                            ${feature}
                        </li>
                    `).join('')}
                </ul>
                <button onclick="selectTariff('${tariff.id}')" style="
                    width: 100%;
                    padding: 16px;
                    background: ${tariff.popular ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'rgba(255, 255, 255, 0.1)'};
                    border: none;
                    border-radius: 12px;
                    color: white;
                    font-size: 16px;
                    font-weight: 600;
                    cursor: pointer;
                    margin-top: 8px;
                ">
                    Выбрать тариф
                </button>
            </div>
        `;
    });
    
    container.innerHTML = sliderHTML;
    modalContainer.innerHTML = modalHTML;
}

// Инициализация данных подписки
function initSubscriptionData() {
    // Здесь будет запрос к API, пока тестовые данные
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 30);
    
    document.getElementById('expiry-date').textContent = 
        expiryDate.toLocaleDateString('ru-RU');
    
    document.getElementById('days-left').textContent = '30 дней';
}

// Настройка обработчиков событий
function setupEventListeners() {
    // Обработчик для кнопки подключения
    const connectBtn = document.getElementById('connect-btn');
    if (connectBtn) {
        connectBtn.addEventListener('touchstart', function(e) {
            this.style.transform = 'translateY(2px)';
            this.style.boxShadow = '0 4px 10px rgba(102, 126, 234, 0.4)';
        });
        
        connectBtn.addEventListener('touchend', function(e) {
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = '0 8px 20px rgba(102, 126, 234, 0.4)';
        });
    }
    
    // Обработчики для навигации
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('touchstart', function() {
            this.style.transform = 'translateY(2px)';
        });
        
        btn.addEventListener('touchend', function() {
            this.style.transform = 'translateY(0)';
        });
    });
    
    // Обработчик для свайпов
    let startX, startY;
    
    document.addEventListener('touchstart', function(e) {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
    });
    
    document.addEventListener('touchend', function(e) {
        if (!startX || !startY) return;
        
        const endX = e.changedTouches[0].clientX;
        const endY = e.changedTouches[0].clientY;
        
        const diffX = endX - startX;
        const diffY = endY - startY;
        
        // Горизонтальный свайп для слайдера тарифов
        if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
            const slider = document.querySelector('.tariffs-slider');
            if (slider) {
                const scrollAmount = diffX > 0 ? -200 : 200;
                slider.scrollBy({ left: scrollAmount, behavior: 'smooth' });
            }
        }
        
        startX = null;
        startY = null;
    });
}

// Включение/выключение VPN
function toggleVPN() {
    const statusIndicator = document.querySelector('.status-indicator');
    const connectBtn = document.getElementById('connect-btn');
    const statusText = document.querySelector('.connection-status span');
    
    if (!isConnected) {
        // Подключаем VPN
        isConnected = true;
        statusIndicator.className = 'status-indicator connected';
        statusText.textContent = 'Подключено';
        connectBtn.innerHTML = '<i class="fas fa-power-off"></i><span>Отключить VPN</span>';
        showToast('VPN успешно подключен! 🔒');
        
        // Вибрация (если поддерживается)
        if (navigator.vibrate) {
            navigator.vibrate([100, 50, 100]);
        }
    } else {
        // Отключаем VPN
        isConnected = false;
        statusIndicator.className = 'status-indicator disconnected';
        statusText.textContent = 'Не подключено';
        connectBtn.innerHTML = '<i class="fas fa-power-off"></i><span>Подключить VPN</span>';
        showToast('VPN отключен');
    }
}

// Выбор тарифа
function selectTariff(tariffId) {
    closeModal('tariffs-modal');
    
    // Показываем уведомление
    showToast('Тариф выбран! Переход к оплате...');
    
    // Имитация оплаты через Telegram
    setTimeout(() => {
        tg.showPopup({
            title: 'Оплата тарифа',
            message: 'Подтвердите оплату в открывшемся окне',
            buttons: [
                { id: 'pay', type: 'default', text: '💳 Оплатить' },
                { type: 'cancel', text: 'Отмена' }
            ]
        }, (buttonId) => {
            if (buttonId === 'pay') {
                // Имитация успешной оплаты
                setTimeout(() => {
                    showToast('✅ Оплата прошла успешно! Тариф активирован.');
                    
                    // Обновляем данные подписки
                    document.getElementById('days-left').textContent = '90 дней';
                    
                    const newDate = new Date();
                    newDate.setDate(newDate.getDate() + 90);
                    document.getElementById('expiry-date').textContent = 
                        newDate.toLocaleDateString('ru-RU');
                }, 1500);
            }
        });
    }, 500);
}

// Показать модальное окно с тарифами
function showTariffs() {
    openModal('tariffs-modal');
}

// Показать серверы
function showServers() {
    showToast('Выбор сервера скоро будет доступен! 🌐');
}

// Показать настройки
function showSettings() {
    showToast('Настройки скоро будут доступны! ⚙️');
}

// Показать поддержку
function showSupport() {
    tg.openTelegramLink('https://t.me/shield_support_bot');
}

// Показать профиль
function showProfile() {
    showToast('Профиль пользователя');
}

// Показать главную
function showHome() {
    // Прокручиваем наверх
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Модальное окно профиля
function showProfileModal() {
    if (!user) return;
    
    const userName = user.first_name || 'Пользователь';
    const userId = user.id || 'Неизвестно';
    
    tg.showPopup({
        title: 'Профиль',
        message: `👤 ${userName}\n🆔 ID: ${userId}\n\nУправление аккаунтом скоро будет доступно!`,
        buttons: [{ type: 'cancel', text: 'Закрыть' }]
    });
}

// Открыть модальное окно
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

// Закрыть модальное окно
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
        
        // Добавляем вибрацию на закрытие
        if (navigator.vibrate) {
            navigator.vibrate(50);
        }
    }
}

// Показать уведомление
function showToast(message) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    
    toast.textContent = message;
    toast.classList.add('show');
    
    // Автоматическое скрытие
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Закрытие по клику вне модального окна
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal-overlay')) {
        e.target.classList.remove('active');
        document.body.style.overflow = '';
    }
});

// Обработка событий Telegram
tg.onEvent('viewportChanged', (data) => {
    // Адаптация к изменению размера экрана
    console.log('Viewport changed:', data);
});

tg.onEvent('themeChanged', () => {
    // Изменение темы
    if (tg.colorScheme === 'dark') {
        document.body.style.background = 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)';
    } else {
        document.body.style.background = 'linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%)';
    }
});

// Предотвращение зума на мобильных
document.addEventListener('touchmove', function(e) {
    if (e.scale !== 1) {
        e.preventDefault();
    }
}, { passive: false });

// Оптимизация для мобильных
window.addEventListener('load', function() {
    // Убираем задержку тапа на iOS
    document.addEventListener('touchstart', function() {}, { passive: true });
});

// Адаптация к ориентации экрана
window.addEventListener('orientationchange', function() {
    setTimeout(() => {
        // Обновляем высоту
        document.documentElement.style.height = window.innerHeight + 'px';
    }, 300);
});