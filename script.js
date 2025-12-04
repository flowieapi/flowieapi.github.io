// Инициализация приложения
document.addEventListener('DOMContentLoaded', function() {
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
    
    // Загрузка данных
    loadUserData();
});

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
    // В реальном приложении здесь будет запрос к API
    const userData = {
        username: 'gamerpro',
        nickname: 'PUBG_MASTER',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user1&backgroundType=gradientLinear',
        balance: 0,
        activePlan: 'flowi',
        purchases: [
            { plan: 'flowi', date: '2024-11-15', price: 999 },
            { plan: 'pro', date: '2024-10-15', price: 599 }
        ]
    };
    
    // Сохраняем в localStorage для демо
    localStorage.setItem('flowi_vpn_user', JSON.stringify(userData));
    
    // Обновляем интерфейс
    updateUserInterface(userData);
}

function updateUserInterface(userData) {
    // Обновляем аватар
    const avatar = document.querySelector('.user-avatar img');
    if (avatar && userData.avatar) {
        avatar.src = userData.avatar;
    }
    
    // Обновляем активный план
    if (userData.activePlan) {
        const plan = plans[userData.activePlan];
        if (plan) {
            // Можно обновить UI, показать активный план
        }
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