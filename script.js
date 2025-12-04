// Инициализация приложения
document.addEventListener('DOMContentLoaded', function() {
    // Инициализация Telegram Web App
    if (tg) {
        initTelegramWebApp();
    } else {
        console.log('Telegram Web App не обнаружен, используем демо данные');
        loadDemoData();
    }
    
    // Анимация появления
    animateOnScroll();
    
    // Проверка пинга
    initPingCheck();
    
    // Обработчики покупки
    initBuyButtons();
    
    // Модальные окна
    initModals();
    
    // Уведомления
    initNotifications();
    
    // Загрузка данных пользователя
    loadUserData();
});


const tg = window.Telegram?.WebApp;

function initTelegramWebApp() {
    console.log('Telegram Web App инициализирован');
    
    // Расширяем приложение на весь экран
    tg.expand();
    
    // Включаем кнопку назад
    tg.BackButton.show();
    tg.BackButton.onClick(() => {
        window.history.back();
    });
    
    // Обработка изменений видимости кнопки назад
    tg.onEvent('backButtonClicked', () => {
        if (window.location.pathname.includes('index.html') || 
            window.location.pathname.includes('/')) {
            tg.BackButton.hide();
        }
    });
    
    // Отправляем данные о готовности приложения
    tg.ready();
}

// Анимация появления элементов
function animateOnScroll() {
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

// Проверка пинга
function initPingCheck() {
    const checkPingBtn = document.getElementById('checkPingBtn');
    const pingValue = document.getElementById('pingValue');
    
    if (checkPingBtn && pingValue) {
        // Первоначальная проверка
        setTimeout(() => {
            checkPing();
        }, 1000);
        
        checkPingBtn.addEventListener('click', checkPing);
    }
}

function checkPing() {
    const checkPingBtn = document.getElementById('checkPingBtn');
    const pingValue = document.getElementById('pingValue');
    const statusText = document.querySelector('.status-text');
    const indicators = document.querySelectorAll('.status-indicator');
    
    if (!checkPingBtn || !pingValue) return;
    
    // Блокируем кнопку
    checkPingBtn.disabled = true;
    checkPingBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Проверяем...';
    
    // Анимация загрузки
    let dots = 0;
    const interval = setInterval(() => {
        pingValue.textContent = '•'.repeat(dots + 1);
        dots = (dots + 1) % 3;
    }, 200);
    
    // Имитация проверки
    setTimeout(() => {
        clearInterval(interval);
        
        // Случайный пинг 10-33 мс
        const randomPing = Math.floor(Math.random() * (33 - 10 + 1)) + 10;
        pingValue.textContent = randomPing;
        
        // Обновляем статус
        updatePingStatus(randomPing, statusText, indicators);
        
        // Разблокируем кнопку
        checkPingBtn.disabled = false;
        checkPingBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Проверить сейчас';
        
        // Показываем уведомление
        showNotification(`Пинг проверен: ${randomPing} мс`, 'success');
        
        // Анимация успеха
        pingValue.parentElement.classList.add('ping-success');
        setTimeout(() => {
            pingValue.parentElement.classList.remove('ping-success');
        }, 1000);
    }, 2000);
}

function updatePingStatus(ping, statusText, indicators) {
    if (!statusText || !indicators) return;
    
    // Сбрасываем все индикаторы
    indicators.forEach(indicator => {
        indicator.classList.remove('active');
        indicator.style.height = '20px';
    });
    
    // Устанавливаем активный индикатор
    if (ping <= 15) {
        statusText.textContent = 'Идеальное соединение!';
        statusText.style.color = 'var(--success-color)';
        indicators[0].classList.add('active');
        indicators[0].style.height = '30px';
    } else if (ping <= 25) {
        statusText.textContent = 'Отличное соединение';
        statusText.style.color = 'var(--info-color)';
        indicators[1].classList.add('active');
        indicators[1].style.height = '25px';
    } else {
        statusText.textContent = 'Хорошее соединение';
        statusText.style.color = 'var(--warning-color)';
        indicators[2].classList.add('active');
        indicators[2].style.height = '20px';
    }
}

// Обработка покупки
function initBuyButtons() {
    const buyButtons = document.querySelectorAll('.buy-btn');
    
    buyButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const planId = this.getAttribute('data-plan');
            
            if (planId) {
                openBuyModal(planId);
            }
        });
    });
}

// Данные тарифов
const plans = {
    light: {
        name: 'Лайт VPN',
        price: 299,
        color: '#00ff88',
        icon: 'bolt',
        features: [
            'Уменьшение пинга 30-50мс',
            'Лучшая регистрация урона',
            'Серверы в РФ и Европе',
            '24/7 Поддержка'
        ]
    },
    pro: {
        name: 'Про VPN',
        price: 599,
        color: '#00ccff',
        icon: 'rocket',
        features: [
            'Высокая скорость соединения',
            'Больше хедшотов',
            'Приоритет на серверах',
            'Авто-оптимизация',
            'Безлимитный трафик'
        ]
    },
    flowi: {
        name: 'Флоуи VPN',
        price: 999,
        color: '#9d4edd',
        icon: 'gem',
        features: [
            'Максимальное уменьшение пинга',
            'Эксклюзивные серверы',
            'Приоритетная поддержка',
            'Все фишки Про VPN',
            'Аналитика игры',
            'Персональный менеджер'
        ]
    }
};

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
    
    // Закрытие по Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal-overlay').forEach(modal => {
                modal.classList.remove('active');
            });
        }
    });
}

function openBuyModal(planId) {
    const plan = plans[planId];
    const modal = document.querySelector('.modal-overlay');
    const modalTitle = document.getElementById('modalTitle');
    const selectedPlanInfo = document.getElementById('selectedPlanInfo');
    
    if (!plan || !modal) return;
    
    modalTitle.textContent = `Оформление: ${plan.name}`;
    
    selectedPlanInfo.innerHTML = `
        <div class="selected-plan-info">
            <div class="plan-header" style="border-left: 4px solid ${plan.color}; padding-left: 1rem; margin-bottom: 1.5rem;">
                <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 0.5rem;">
                    <div style="width: 40px; height: 40px; background: ${plan.color}20; border-radius: 10px; display: flex; align-items: center; justify-content: center;">
                        <i class="fas fa-${plan.icon}" style="color: ${plan.color}; font-size: 1.2rem;"></i>
                    </div>
                    <div>
                        <h4 style="color: ${plan.color}; margin: 0; font-size: 1.2rem;">${plan.name}</h4>
                        <div style="font-size: 1.8rem; font-weight: 800; color: ${plan.color};">${plan.price} ₽</div>
                    </div>
                </div>
            </div>
            <div class="plan-features">
                <h5 style="margin-bottom: 1rem; font-size: 1rem; color: var(--text-secondary);">Включено:</h5>
                ${plan.features.map(feature => `
                    <div class="feature" style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.5rem; padding: 0.5rem; background: rgba(255, 255, 255, 0.05); border-radius: 8px;">
                        <i class="fas fa-check" style="color: ${plan.color}; font-size: 0.9rem;"></i>
                        <span style="font-size: 0.9rem;">${feature}</span>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    
    modal.classList.add('active');
}

function processPayment() {
    const modal = document.querySelector('.modal-overlay');
    const confirmBtn = document.getElementById('confirmBuyBtn');
    
    if (!confirmBtn) return;
    
    // Блокируем кнопку
    confirmBtn.disabled = true;
    confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Обработка...';
    
    // Имитация процесса оплаты
    setTimeout(() => {
        // Показываем успешное сообщение
        const modalBody = document.querySelector('.modal-body');
        modalBody.innerHTML = `
            <div style="text-align: center; padding: 2rem 1rem;">
                <div style="width: 80px; height: 80px; background: var(--primary-gradient); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem; animation: pulse 2s infinite;">
                    <i class="fas fa-check" style="font-size: 2rem; color: white;"></i>
                </div>
                <h3 style="color: var(--success-color); margin-bottom: 1rem;">Оплата успешна!</h3>
                <p style="color: var(--text-secondary); margin-bottom: 1.5rem; line-height: 1.5;">
                    Данные для подключения к VPN отправлены вам в личные сообщения Telegram.
                </p>
                <div style="background: rgba(0, 255, 136, 0.1); padding: 1rem; border-radius: 12px; margin: 1.5rem 0; border: 1px solid rgba(0, 255, 136, 0.3);">
                    <p style="font-size: 0.9rem; color: var(--success-color); margin: 0;">
                        <i class="fas fa-info-circle"></i> Проверьте чат с ботом для получения данных
                    </p>
                </div>
            </div>
        `;
        
        // Через 3 секунды закрываем
        setTimeout(() => {
            modal.classList.remove('active');
            confirmBtn.disabled = false;
            confirmBtn.innerHTML = '<i class="fas fa-lock"></i> Перейти к оплате';
            
            // Показываем уведомление
            showNotification('VPN успешно активирован!', 'success');
            
            // Восстанавливаем содержимое
            setTimeout(() => {
                const modalBody = document.querySelector('.modal-body');
                if (modalBody) {
                    modalBody.innerHTML = `
                        <div class="selected-plan" id="selectedPlanInfo"></div>
                        <div class="payment-section">
                            <h4><i class="fas fa-credit-card"></i> Способ оплаты</h4>
                            <div class="payment-methods">
                                <label class="payment-method active">
                                    <input type="radio" name="payment" checked>
                                    <div class="payment-icon">
                                        <i class="fab fa-cc-visa"></i>
                                    </div>
                                    <span>Карта Visa/Mastercard</span>
                                </label>
                                <label class="payment-method">
                                    <input type="radio" name="payment">
                                    <div class="payment-icon">
                                        <i class="fab fa-bitcoin"></i>
                                    </div>
                                    <span>Криптовалюта</span>
                                </label>
                                <label class="payment-method">
                                    <input type="radio" name="payment">
                                    <div class="payment-icon">
                                        <i class="fas fa-wallet"></i>
                                    </div>
                                    <span>QIWI / ЮMoney</span>
                                </label>
                            </div>
                        </div>
                        <button class="glass-btn btn-primary btn-block" id="confirmBuyBtn">
                            <i class="fas fa-lock"></i> Перейти к оплате
                        </button>
                    `;
                    
                    // Перепривязываем обработчик
                    document.getElementById('confirmBuyBtn').addEventListener('click', processPayment);
                }
            }, 100);
        }, 3000);
    }, 2000);
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
    
    // Устанавливаем тип уведомления
    notification.className = 'notification';
    notification.classList.add(type);
    
    // Устанавливаем сообщение
    notification.innerHTML = `
        <div style="display: flex; align-items: center; gap: 0.75rem;">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}" 
               style="color: ${type === 'success' ? 'var(--success-color)' : type === 'error' ? 'var(--danger-color)' : 'var(--info-color)'}">
            </i>
            <span>${message}</span>
        </div>
    `;
    
    // Показываем уведомление
    notification.classList.add('show');
    
    // Скрываем через 3 секунды
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// Загрузка данных пользователя
function loadUserData() {
    if (tg) {
        const user = tg.initDataUnsafe?.user;
        
        if (user) {
            // Используем реальные данные из Telegram
            const userData = {
                id: user.id,
                username: user.username || `user_${user.id}`,
                nickname: user.first_name + (user.last_name ? ` ${user.last_name}` : ''),
                avatar: user.photo_url || generateAvatar(user.id),
                language_code: user.language_code || 'ru',
                isPremium: user.is_premium || false
            };
            
            // Сохраняем в localStorage для использования на других страницах
            localStorage.setItem('flowi_vpn_user', JSON.stringify(userData));
            
            // Обновляем интерфейс
            updateUserInterface(userData);
            
            // Если это страница профиля, обновляем данные профиля
            if (window.location.pathname.includes('profile.html')) {
                updateProfilePage(userData);
            }
        } else {
            // Если данные пользователя недоступны, пробуем получить из localStorage
            const savedUser = localStorage.getItem('flowi_vpn_user');
            if (savedUser) {
                updateUserInterface(JSON.parse(savedUser));
            } else {
                loadDemoData();
            }
        }
    } else {
        // Для демо без Telegram
        loadDemoData();
    }
}

function updateProfilePage(userData) {
    // Обновляем аватар
    const avatarImg = document.querySelector('.profile-avatar img');
    if (avatarImg && userData.avatar) {
        avatarImg.src = userData.avatar;
        avatarImg.alt = userData.nickname;
    }
    
    // Обновляем никнейм
    const nicknameEl = document.querySelector('.profile-info h2');
    if (nicknameEl) {
        nicknameEl.textContent = userData.nickname;
    }
    
    // Обновляем юзернейм
    const usernameEl = document.querySelector('.profile-username');
    if (usernameEl) {
        usernameEl.textContent = `@${userData.username}`;
    }
    
    // Если пользователь премиум, показываем бейдж
    if (userData.isPremium) {
        const profileHeader = document.querySelector('.profile-header');
        if (profileHeader) {
            const premiumBadge = document.createElement('div');
            premiumBadge.className = 'premium-badge';
            premiumBadge.innerHTML = '<i class="fas fa-crown"></i> Telegram Premium';
            premiumBadge.style.cssText = `
                position: absolute;
                top: 10px;
                right: 10px;
                background: linear-gradient(45deg, #FFD700, #FFA500);
                color: #000;
                padding: 4px 10px;
                border-radius: 20px;
                font-size: 0.75rem;
                font-weight: 600;
                display: flex;
                align-items: center;
                gap: 5px;
            `;
            profileHeader.style.position = 'relative';
            profileHeader.appendChild(premiumBadge);
        }
    }
}

function updateUserInterface(userData) {
    // Обновляем аватар в хедере
    const headerAvatar = document.querySelector('.user-avatar img');
    if (headerAvatar && userData.avatar) {
        headerAvatar.src = userData.avatar;
        headerAvatar.alt = userData.nickname;
    }
    
    // Если есть Telegram Web App, можно использовать их тему
    if (tg) {
        applyTelegramTheme();
    }
}

function applyTelegramTheme() {
    const themeParams = tg.themeParams;
    
    if (themeParams) {
        document.documentElement.style.setProperty('--primary-color', themeParams.button_color || '#2481cc');
        document.documentElement.style.setProperty('--bg-color', themeParams.bg_color || '#1a1a1a');
        document.documentElement.style.setProperty('--text-color', themeParams.text_color || '#ffffff');
        
        // Обновляем градиенты на основе темы
        updateGradients(themeParams.button_color);
    }
}

function updateGradients(buttonColor) {
    if (!buttonColor) return;
    
    const style = document.createElement('style');
    style.textContent = `
        .glass-btn.btn-primary {
            background: linear-gradient(135deg, ${buttonColor}, ${adjustColor(buttonColor, -20)}) !important;
        }
        
        .tariff-card.featured {
            --card-color: ${buttonColor} !important;
        }
    `;
    document.head.appendChild(style);
}

function adjustColor(color, amount) {
    const hex = color.replace('#', '');
    let r = parseInt(hex.substring(0, 2), 16);
    let g = parseInt(hex.substring(2, 4), 16);
    let b = parseInt(hex.substring(4, 6), 16);
    
    r = Math.max(0, Math.min(255, r + amount));
    g = Math.max(0, Math.min(255, g + amount));
    b = Math.max(0, Math.min(255, b + amount));
    
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

// Генерация аватара на основе ID пользователя
function generateAvatar(userId) {
    const colors = ['00ff88', '00ccff', '9d4edd', 'ff6b6b', 'ffa500'];
    const color = colors[userId % colors.length];
    return `https://api.dicebear.com/7.x/thumbs/svg?seed=${userId}&backgroundColor=${color}&backgroundType=gradientLinear`;
}


// Добавляем обработку закрытия приложения
if (tg) {
    // Обработка события закрытия
    tg.onEvent('viewportChanged', (isStateStable) => {
        if (!isStateStable) {
            // Сохраняем состояние при сворачивании
            saveAppState();
        }
    });
    
    // Обработка нажатия кнопки закрытия
    tg.onEvent('mainButtonClicked', () => {
        tg.close();
    });
}

function restoreAppState() {
    const savedState = localStorage.getItem('flowi_vpn_state');
    if (savedState) {
        const state = JSON.parse(savedState);
        // Можно восстановить состояние если нужно
    }
}

// Анимация для кнопок
document.addEventListener('click', function(e) {
    if (e.target.matches('.glass-btn, .nav-item')) {
        createRipple(e);
    }
});

function createRipple(event) {
    const button = event.currentTarget;
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
}

// Добавляем стили для ripple эффекта
const rippleStyles = document.createElement('style');
rippleStyles.textContent = `
    .ripple {
        position: absolute;
        border-radius: 50%;
        transform: scale(0);
        animation: ripple-animation 0.6s linear;
        background: rgba(255, 255, 255, 0.3);
    }
    
    @keyframes ripple-animation {
        to {
            transform: scale(4);
            opacity: 0;
        }
    }
    
    .glass-btn, .nav-item {
        position: relative;
        overflow: hidden;
    }
    
    .ping-success {
        animation: pingSuccess 1s ease;
    }
    
    @keyframes pingSuccess {
        0% { transform: scale(1); }
        50% { transform: scale(1.05); }
        100% { transform: scale(1); }
    }
`;
document.head.appendChild(rippleStyles);

// Обработка сенсорных событий для мобильных устройств
document.addEventListener('touchstart', function() {}, {passive: true});

// Предотвращаем контекстное меню на кнопках
document.addEventListener('contextmenu', function(e) {
    if (e.target.matches('.glass-btn, .nav-item, .payment-method')) {
        e.preventDefault();
    }
});

// Оптимизация для iOS
if (navigator.platform.indexOf('iPhone') !== -1 || 
    navigator.platform.indexOf('iPad') !== -1 || 
    navigator.platform.indexOf('iPod') !== -1) {
    
    // Фикс для 100vh на iOS
    function setVH() {
        let vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
    }
    
    setVH();
    window.addEventListener('resize', setVH);
    window.addEventListener('orientationchange', setVH);
    
    // Фикс для фокуса на iOS
    document.addEventListener('touchstart', function(e) {
        if (e.target.matches('input, select, textarea')) {
            setTimeout(() => {
                e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100);
        }
    });
}

// Функция для применения безопасных зон
function applySafeAreas() {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    
    if (isIOS) {
        document.body.classList.add('safe-area-padding');
    }
}

// Функция для оптимизации карточек тарифов
function optimizeTariffCards() {
    const tariffCards = document.querySelectorAll('.tariff-card');
    
    tariffCards.forEach(card => {
        const badge = card.querySelector('.tariff-badge');
        const button = card.querySelector('.buy-btn');
        
        if (badge && button) {
            // Принудительное позиционирование
            badge.style.position = 'absolute';
            badge.style.top = '-12px';
            badge.style.left = '50%';
            badge.style.transform = 'translateX(-50%)';
            
            // Выравнивание кнопки
            button.style.margin = 'auto auto 1.5rem';
            button.style.width = 'calc(100% - 2rem)';
        }
    });
}

// Функция для скрытия ненужных элементов
function hideUnnecessaryElements() {
    // Скрываем кнопку камеры в профиле
    document.querySelectorAll('.edit-avatar').forEach(el => el.style.display = 'none');
    
    // Скрываем кнопку QR кода
    document.querySelectorAll('.icon-btn .fa-qrcode').forEach(el => {
        el.closest('.icon-btn').style.display = 'none';
    });
    
    // Скрываем кнопку поиска в настройках
    document.querySelectorAll('.icon-btn .fa-search').forEach(el => {
        el.closest('.icon-btn').style.display = 'none';
    });
}

// Функция для исправления высоты элементов
function fixElementHeights() {
    // Исправляем иконку в карточке подписки
    const subscriptionIcon = document.querySelector('.subscription-icon');
    if (subscriptionIcon) {
        subscriptionIcon.style.width = '50px';
        subscriptionIcon.style.height = '50px';
        subscriptionIcon.style.minWidth = '50px';
    }
}

// Функция для оптимизации сеток
function optimizeGrids() {
    const screenWidth = window.innerWidth;
    
    // Адаптируем сетку преимуществ
    const benefitsGrid = document.querySelector('.benefits-grid');
    if (benefitsGrid && screenWidth <= 480) {
        benefitsGrid.style.gridTemplateColumns = 'repeat(2, 1fr)';
        benefitsGrid.style.gap = '0.75rem';
    }
    
    // Адаптируем сетку достижений
    const achievementsGrid = document.querySelector('.achievements-grid');
    if (achievementsGrid && screenWidth <= 480) {
        achievementsGrid.style.gridTemplateColumns = 'repeat(2, 1fr)';
        achievementsGrid.style.gap = '0.75rem';
    }
}

// Функция для исправления кнопки проверки пинга
function fixPingButton() {
    const pingBtn = document.querySelector('.btn-ping');
    if (pingBtn) {
        pingBtn.classList.add('glass-btn');
        pingBtn.style.background = 'rgba(255, 255, 255, 0.1)';
        pingBtn.style.backdropFilter = 'blur(10px)';
        pingBtn.style.border = '1px solid rgba(255, 255, 255, 0.2)';
        pingBtn.style.color = 'var(--text-primary)';
    }
}

// Инициализация всех исправлений
document.addEventListener('DOMContentLoaded', function() {
    // Применяем все исправления
    applySafeAreas();
    optimizeTariffCards();
    hideUnnecessaryElements();
    fixElementHeights();
    optimizeGrids();
    fixPingButton();
    
    // Оригинальная инициализация
    if (tg) {
        initTelegramWebApp();
    } else {
        console.log('Telegram Web App не обнаружен, используем демо данные');
        loadDemoData();
    }
    
    animateOnScroll();
    initPingCheck();
    initBuyButtons();
    initModals();
    initNotifications();
    loadUserData();
});

// Ресайз обработчик
window.addEventListener('resize', function() {
    optimizeTariffCards();
    optimizeGrids();
});

// Обработчик ориентации
window.addEventListener('orientationchange', function() {
    setTimeout(() => {
        optimizeTariffCards();
        optimizeGrids();
    }, 300);
});