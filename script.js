// Telegram Web App инициализация
let tg = window.Telegram.WebApp;
let user = null;

// Инициализация приложения
document.addEventListener('DOMContentLoaded', function() {
    // Инициализируем Telegram Web App
    tg.expand();
    tg.enableClosingConfirmation();
    
    // Получаем данные пользователя
    user = tg.initDataUnsafe.user;
    
    // Устанавливаем тему
    if (tg.colorScheme === 'dark') {
        document.body.classList.add('dark-theme');
    }
    
    // Настраиваем кнопку назад
    tg.BackButton.onClick(() => {
        history.back();
    });
    
    // Показываем пользователя
    if (user) {
        document.getElementById('user-balance').textContent = '0 ₽';
        if (user.photo_url) {
            document.getElementById('user-avatar').innerHTML = 
                `<img src="${user.photo_url}" alt="${user.first_name}">`;
        }
    }
    
    // Загружаем тарифы
    loadTariffs();
    
    // Загружаем подписки пользователя
    loadSubscriptions();
    
    // Инициализируем FAQ
    initFAQ();
    
    // Тестовые данные (заменить на реальный API)
    setTimeout(() => {
        hideLoader();
    }, 1000);
});

// Загрузка тарифов
async function loadTariffs() {
    try {
        const response = await fetch('/api/tariffs');
        const tariffs = await response.json();
        displayTariffs(tariffs);
    } catch (error) {
        console.error('Ошибка загрузки тарифов:', error);
        // Тестовые данные
        const testTariffs = [
            {
                id: '1',
                name: 'Месячный',
                price: 299,
                days: 30,
                emoji: '🌙',
                features: ['Все сервера', 'Базовая поддержка', 'Смена сервера 1 раз в день'],
                popular: false
            },
            {
                id: '2',
                name: 'Оптимальный',
                price: 799,
                days: 90,
                emoji: '⭐',
                features: ['Приоритетная поддержка', '+10% к скорости', 'Смена сервера 3 раза в день'],
                popular: true
            },
            {
                id: '3',
                name: 'Годовой VIP',
                price: 2999,
                days: 365,
                emoji: '👑',
                features: ['VIP поддержка 24/7', '+25% к скорости', 'Неограниченная смена сервера'],
                popular: false
            }
        ];
        displayTariffs(testTariffs);
    }
}

// Отображение тарифов
function displayTariffs(tariffs) {
    const container = document.getElementById('tariffs-container');
    container.innerHTML = '';
    
    tariffs.forEach(tariff => {
        const card = document.createElement('div');
        card.className = `tariff-card ${tariff.popular ? 'popular' : ''}`;
        
        card.innerHTML = `
            ${tariff.popular ? '<div class="popular-badge">ПОПУЛЯРНЫЙ</div>' : ''}
            <div class="tariff-header">
                <div class="tariff-emoji">${tariff.emoji}</div>
                <h3 class="tariff-name">${tariff.name}</h3>
                <div class="tariff-price">${tariff.price} ₽</div>
                <div class="tariff-period">на ${tariff.days} дней</div>
            </div>
            <ul class="tariff-features">
                ${tariff.features.map(feature => `
                    <li><i class="fas fa-check"></i> ${feature}</li>
                `).join('')}
            </ul>
            <button class="btn-primary" onclick="selectTariff('${tariff.id}')">
                <i class="fas fa-shopping-cart"></i>
                Выбрать тариф
            </button>
        `;
        
        container.appendChild(card);
    });
}

// Загрузка подписок пользователя
async function loadSubscriptions() {
    try {
        const response = await fetch(`/api/subscriptions?user_id=${user.id}`);
        const subscriptions = await response.json();
        displaySubscriptions(subscriptions);
    } catch (error) {
        console.error('Ошибка загрузки подписок:', error);
        // Тестовые данные
        const testSubscriptions = [
            {
                id: '1',
                tariff_name: 'Оптимальный',
                price: 799,
                expires_at: '2024-12-31',
                status: 'active'
            }
        ];
        displaySubscriptions(testSubscriptions);
    }
}

// Отображение подписок
function displaySubscriptions(subscriptions) {
    const container = document.getElementById('subscriptions-container');
    
    if (subscriptions.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-key"></i>
                <p>У вас пока нет активных подписок</p>
                <button class="btn-primary" onclick="showTariffs()">Выбрать тариф</button>
            </div>
        `;
        return;
    }
    
    container.innerHTML = subscriptions.map(sub => `
        <div class="subscription-item">
            <div class="subscription-info">
                <h4>${sub.tariff_name}</h4>
                <div class="subscription-details">
                    <span><i class="fas fa-tag"></i> ${sub.price} ₽</span>
                    <span><i class="fas fa-calendar"></i> До ${formatDate(sub.expires_at)}</span>
                </div>
            </div>
            <div class="subscription-status">
                <span class="status ${sub.status}">${sub.status === 'active' ? 'АКТИВНА' : 'ИСТЕКЛА'}</span>
            </div>
        </div>
    `).join('');
}

// Форматирование даты
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
}

// Инициализация FAQ
function initFAQ() {
    const faqItems = document.querySelectorAll('.faq-item');
    
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        question.addEventListener('click', () => {
            item.classList.toggle('active');
        });
    });
}

// Выбор тарифа
let selectedTariff = null;

function selectTariff(tariffId) {
    showLoader();
    
    // Находим выбранный тариф
    const tariffs = document.querySelectorAll('.tariff-card');
    tariffs.forEach(card => {
        const btn = card.querySelector('button');
        if (btn.onclick.toString().includes(tariffId)) {
            const name = card.querySelector('.tariff-name').textContent;
            const price = card.querySelector('.tariff-price').textContent;
            const period = card.querySelector('.tariff-period').textContent;
            const emoji = card.querySelector('.tariff-emoji').textContent;
            
            selectedTariff = {
                id: tariffId,
                name,
                price: parseInt(price),
                period,
                emoji
            };
            
            showPaymentModal();
        }
    });
    
    hideLoader();
}

// Показать модальное окно оплаты
function showPaymentModal() {
    if (!selectedTariff) return;
    
    const modal = document.getElementById('payment-modal');
    const tariffInfo = document.getElementById('selected-tariff-info');
    
    tariffInfo.innerHTML = `
        <h4>${selectedTariff.emoji} ${selectedTariff.name}</h4>
        <p>Сумма к оплате: <strong>${selectedTariff.price} ₽</strong></p>
        <p>Срок действия: ${selectedTariff.period}</p>
    `;
    
    modal.classList.add('active');
}

// Закрыть модальное окно
function closeModal() {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.classList.remove('active');
    });
}

// Обработка оплаты
function processPayment(method) {
    if (method === 'card') {
        document.getElementById('card-payment').style.display = 'block';
    } else {
        // Для других методов используем Telegram Payments
        initiateTelegramPayment(method);
    }
}

// Оплата через Telegram
function initiateTelegramPayment(method) {
    const paymentData = {
        title: `VPN: ${selectedTariff.name}`,
        description: `Доступ к VPN на ${selectedTariff.period}`,
        prices: [{
            label: selectedTariff.name,
            amount: selectedTariff.price * 100, // в копейках
        }],
        payload: JSON.stringify({
            tariff_id: selectedTariff.id,
            user_id: user.id,
            method: method
        })
    };
    
    tg.sendData(JSON.stringify(paymentData));
}

// Оплата картой
function submitCardPayment() {
    const cardNumber = document.getElementById('card-number').value;
    const expiry = document.getElementById('card-expiry').value;
    const cvv = document.getElementById('card-cvv').value;
    
    if (!validateCard(cardNumber, expiry, cvv)) {
        alert('Пожалуйста, проверьте данные карты');
        return;
    }
    
    showLoader();
    
    // Симуляция оплаты
    setTimeout(() => {
        hideLoader();
        showSuccess('Оплата прошла успешно! Тариф активирован.');
        closeModal();
        
        // Обновляем подписки
        loadSubscriptions();
    }, 2000);
}

// Валидация карты
function validateCard(number, expiry, cvv) {
    // Простая валидация
    const cleanNumber = number.replace(/\s/g, '');
    const cleanExpiry = expiry.replace(/\s/g, '');
    
    if (cleanNumber.length !== 16) return false;
    if (cleanExpiry.length !== 5) return false;
    if (cvv.length !== 3) return false;
    
    return true;
}

// Показать успешную оплату
function showSuccess(message) {
    const modal = document.getElementById('success-modal');
    document.getElementById('success-message').textContent = message;
    modal.classList.add('active');
}

// Закрыть окно успеха
function closeSuccessModal() {
    document.getElementById('success-modal').classList.remove('active');
}

// Показать тарифы
function showTariffs() {
    document.getElementById('tariffs').scrollIntoView({
        behavior: 'smooth'
    });
}

// Открыть поддержку
function openSupport() {
    tg.openTelegramLink('https://t.me/shield_support_bot');
}

// Показать/скрыть загрузку
function showLoader() {
    document.getElementById('loader').classList.add('active');
}

function hideLoader() {
    document.getElementById('loader').classList.remove('active');
}

// Обработка сообщений от Telegram
tg.onEvent('viewportChanged', () => {
    // Адаптация к изменению размера
});

tg.onEvent('themeChanged', () => {
    if (tg.colorScheme === 'dark') {
        document.body.classList.add('dark-theme');
    } else {
        document.body.classList.remove('dark-theme');
    }
});