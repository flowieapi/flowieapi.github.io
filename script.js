// Инициализация приложения
document.addEventListener('DOMContentLoaded', function() {
    // Инициализация Telegram Web App
    if (window.Telegram?.WebApp) {
        initTelegramWebApp();
    } else {
        console.log('Telegram Web App не обнаружен, используем демо данные');
        loadDemoData();
    }
    
    // Запуск анимаций появления
    initAppearanceAnimations();
    
    // Остальная инициализация
    initPingCheck();
    initBuyButtons();
    initModals();
    initNotifications();
    loadUserData();
    
    // Оптимизации для мобильных
    optimizeMobileExperience();
});

// Анимации появления элементов
function initAppearanceAnimations() {
    // Показываем блок проверки пинга сразу
    const pingWidget = document.querySelector('.ping-widget');
    if (pingWidget) {
        setTimeout(() => {
            pingWidget.classList.add('visible');
        }, 300);
    }
    
    // Показываем заголовок "Выберите свой VPN" после анимации пинга
    const tariffsSection = document.querySelector('.tariffs-section');
    const tariffsHeader = document.querySelector('.tariffs-section .section-header');
    
    if (tariffsHeader) {
        setTimeout(() => {
            tariffsHeader.classList.add('visible');
        }, 800); // Задержка после появления пинга
    }
    
    if (tariffsSection) {
        setTimeout(() => {
            tariffsSection.classList.add('visible');
        }, 900);
    }
    
    // Постепенно показываем остальные элементы
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Для остальных карточек используем обычную анимацию
                if (!entry.target.classList.contains('ping-widget') && 
                    !entry.target.classList.contains('tariffs-section')) {
                    entry.target.classList.add('animate__animated', 'animate__fadeInUp');
                }
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);
    
    // Наблюдаем за всеми карточками кроме тех, что уже анимированы
    document.querySelectorAll('.glass-card:not(.ping-widget):not(.tariff-card)').forEach(card => {
        observer.observe(card);
    });
}

// Инициализация Telegram Web App
const tg = window.Telegram?.WebApp;

function initTelegramWebApp() {
    console.log('Telegram Web App инициализирован');
    
    // Расширяем приложение на весь экран
    if (tg && tg.expand) {
        tg.expand();
    }
    
    // Включаем кнопку назад если это не главная страница
    if (tg && tg.BackButton && !window.location.pathname.includes('index.html')) {
        tg.BackButton.show();
        tg.BackButton.onClick(() => {
            window.history.back();
        });
    }
    
    // Отправляем данные о готовности приложения
    if (tg && tg.ready) {
        tg.ready();
    }
}

// Проверка пинга
function initPingCheck() {
    const checkPingBtn = document.getElementById('checkPingBtn');
    const pingValue = document.getElementById('pingValue');
    
    if (checkPingBtn && pingValue) {
        // Первоначальная проверка с небольшой задержкой для анимации
        setTimeout(() => {
            simulatePingCheck();
        }, 1500);
        
        checkPingBtn.addEventListener('click', simulatePingCheck);
    }
}

function simulatePingCheck() {
    const checkPingBtn = document.getElementById('checkPingBtn');
    const pingValue = document.getElementById('pingValue');
    const statusText = document.querySelector('.status-text');
    const indicators = document.querySelectorAll('.status-indicator');
    
    if (!checkPingBtn || !pingValue) return;
    
    // Блокируем кнопку
    checkPingBtn.disabled = true;
    checkPingBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Проверяем...';
    checkPingBtn.style.opacity = '0.7';
    
    // Анимация загрузки
    let dots = 0;
    const interval = setInterval(() => {
        pingValue.textContent = '•'.repeat(dots + 1);
        dots = (dots + 1) % 3;
    }, 200);
    
    // Имитация проверки (2-3 секунды)
    const delay = 2000 + Math.random() * 1000;
    
    setTimeout(() => {
        clearInterval(interval);
        
        // Случайный пинг 8-28 мс (отличное соединение)
        const randomPing = Math.floor(Math.random() * (28 - 8 + 1)) + 8;
        pingValue.textContent = randomPing;
        
        // Обновляем статус
        updatePingStatus(randomPing, statusText, indicators);
        
        // Разблокируем кнопку
        checkPingBtn.disabled = false;
        checkPingBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Проверить сейчас';
        checkPingBtn.style.opacity = '1';
        
        // Показываем уведомление
        showNotification(`Пинг проверен: ${randomPing} мс`, 'success');
        
        // Анимация успеха
        pingValue.style.transform = 'scale(1.1)';
        pingValue.style.transition = 'transform 0.3s ease';
        setTimeout(() => {
            pingValue.style.transform = 'scale(1)';
        }, 300);
    }, delay);
}

function updatePingStatus(ping, statusText, indicators) {
    if (!statusText || !indicators) return;
    
    // Сбрасываем все индикаторы
    indicators.forEach(indicator => {
        indicator.classList.remove('active');
        indicator.style.height = '22px';
    });
    
    // Устанавливаем активный индикатор
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

// Данные тарифов
const plans = {
    light: {
        name: 'Лайт VPN',
        price: 299,
        color: '#00ff88',
        icon: 'bolt',
        features: [
            'Пинг: -30-50мс',
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
            'Высокая скорость',
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
            'Максимальный пинг',
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
                    <div style="width: 48px; height: 48px; background: ${plan.color}20; border-radius: 12px; display: flex; align-items: center; justify-content: center;">
                        <i class="fas fa-${plan.icon}" style="color: ${plan.color}; font-size: 1.4rem;"></i>
                    </div>
                    <div>
                        <h4 style="color: ${plan.color}; margin: 0; font-size: 1.3rem;">${plan.name}</h4>
                        <div style="font-size: 2rem; font-weight: 800; color: ${plan.color};">${plan.price} ₽</div>
                    </div>
                </div>
            </div>
            <div class="plan-features">
                <h5 style="margin-bottom: 1rem; font-size: 1rem; color: var(--text-secondary);">Включено:</h5>
                ${plan.features.map(feature => `
                    <div class="feature" style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem; padding: 0.75rem; background: rgba(255, 255, 255, 0.05); border-radius: 10px;">
                        <i class="fas fa-check" style="color: ${plan.color}; font-size: 1rem;"></i>
                        <span style="font-size: 0.95rem;">${feature}</span>
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
                <div style="width: 90px; height: 90px; background: var(--primary-gradient); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem; animation: pulse 2s infinite;">
                    <i class="fas fa-check" style="font-size: 2.5rem; color: white;"></i>
                </div>
                <h3 style="color: var(--success-color); margin-bottom: 1rem; font-size: 1.5rem;">Оплата успешна!</h3>
                <p style="color: var(--text-secondary); margin-bottom: 1.5rem; line-height: 1.5; font-size: 1rem;">
                    Данные для подключения к VPN отправлены вам в личные сообщения Telegram.
                </p>
                <div style="background: rgba(0, 255, 136, 0.1); padding: 1.25rem; border-radius: 14px; margin: 1.5rem 0; border: 1px solid rgba(0, 255, 136, 0.3);">
                    <p style="font-size: 0.95rem; color: var(--success-color); margin: 0;">
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
            
            // Восстанавливаем содержимое через небольшой таймаут
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
                    const newConfirmBtn = document.getElementById('confirmBuyBtn');
                    if (newConfirmBtn) {
                        newConfirmBtn.addEventListener('click', processPayment);
                    }
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
    if (type === 'success') {
        notification.style.background = 'rgba(0, 255, 136, 0.15)';
        notification.style.borderColor = 'rgba(0, 255, 136, 0.3)';
    } else if (type === 'error') {
        notification.style.background = 'rgba(255, 71, 87, 0.15)';
        notification.style.borderColor = 'rgba(255, 71, 87, 0.3)';
    }
    
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
    if (tg && tg.initDataUnsafe?.user) {
        const user = tg.initDataUnsafe.user;
        
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
            
            // Обновляем интерфейс
            updateUserInterface(userData);
        }
    } else {
        // Для демо без Telegram
        loadDemoData();
    }
}

function updateUserInterface(userData) {
    // Обновляем аватар в хедере
    const headerAvatar = document.querySelector('.user-avatar img');
    if (headerAvatar && userData.avatar) {
        headerAvatar.src = userData.avatar;
        headerAvatar.alt = userData.nickname;
    }
    
    // Если это страница профиля
    if (window.location.pathname.includes('profile.html')) {
        updateProfilePage(userData);
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
}

function generateAvatar(userId) {
    const colors = ['00ff88', '00ccff', '9d4edd', 'ff6b6b', 'ffa500'];
    const color = colors[userId % colors.length];
    return `https://api.dicebear.com/7.x/thumbs/svg?seed=${userId}&backgroundColor=${color}&backgroundType=gradientLinear`;
}

function loadDemoData() {
    // Загружаем демо данные если нет Telegram
    console.log('Загружаем демо данные');
}

// Оптимизация для мобильных устройств
function optimizeMobileExperience() {
    // Предотвращение зума при фокусе на iOS
    document.addEventListener('touchstart', function(e) {
        if (e.target.matches('input, select, textarea')) {
            setTimeout(() => {
                e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100);
        }
    });
    
    // Фикс для 100vh на мобильных
    function setVH() {
        let vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
    }
    
    setVH();
    window.addEventListener('resize', setVH);
    window.addEventListener('orientationchange', setVH);
    
    // Добавляем ripple эффект для кнопок
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
    
    // Удаляем ripple после анимации
    setTimeout(() => {
        circle.remove();
    }, 600);
}

// Добавляем стили для ripple эффекта
const rippleStyles = document.createElement('style');
rippleStyles.textContent = `
    .ripple {
        position: absolute;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.3);
        transform: scale(0);
        animation: ripple-animation 0.6s linear;
    }
    
    @keyframes ripple-animation {
        to {
            transform: scale(4);
            opacity: 0;
        }
    }
    
    .glass-btn {
        position: relative;
        overflow: hidden;
    }
`;
document.head.appendChild(rippleStyles);