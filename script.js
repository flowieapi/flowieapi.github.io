// Данные пользователя
let userData = {
    username: 'gamerpro',
    nickname: 'PUBG_MASTER',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user1',
    balance: 0,
    activePlan: null,
    purchases: []
};

// Данные тарифов
const plans = {
    light: {
        name: 'Лайт VPN',
        price: 299,
        color: '#4CAF50',
        features: [
            'Уменьшение пинга 30-50мс',
            'Лучшая регистрация урона',
            'Серверы в РФ и Европе'
        ]
    },
    pro: {
        name: 'Про VPN',
        price: 599,
        color: '#2196F3',
        features: [
            'Высокая скорость соединения',
            'Лучшая регистрация урона',
            'Больше хедшотов',
            'Приоритет на серверах'
        ]
    },
    flowi: {
        name: 'Флоуи VPN',
        price: 999,
        color: '#9C27B0',
        features: [
            'Максимальное уменьшение пинга',
            'Всё из тарифов Лайт и Про',
            'Эксклюзивные серверы',
            'Приоритетная поддержка 24/7',
            'Авто-оптимизация под ваш регион'
        ]
    }
};

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    // Проверка пинга
    const checkPingBtn = document.getElementById('checkPingBtn');
    const pingValue = document.getElementById('pingValue');
    
    if (checkPingBtn) {
        checkPingBtn.addEventListener('click', function() {
            checkPingBtn.disabled = true;
            checkPingBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Проверяем...';
            
            // Анимация проверки пинга
            let dots = 0;
            const interval = setInterval(() => {
                pingValue.textContent = '.' .repeat(dots);
                dots = (dots + 1) % 4;
            }, 200);
            
            // Через 2 секунды показываем случайный пинг
            setTimeout(() => {
                clearInterval(interval);
                const randomPing = Math.floor(Math.random() * (33 - 10 + 1)) + 10;
                pingValue.textContent = randomPing;
                checkPingBtn.disabled = false;
                checkPingBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Проверить пинг';
                
                // Обновляем статус
                updatePingStatus(randomPing);
            }, 2000);
        });
        
        // Первоначальная проверка
        setTimeout(() => {
            const initialPing = Math.floor(Math.random() * (33 - 10 + 1)) + 10;
            pingValue.textContent = initialPing;
            updatePingStatus(initialPing);
        }, 500);
    }
    
    // Обработчики кнопок покупки
    const buyButtons = document.querySelectorAll('.buy-btn');
    buyButtons.forEach(button => {
        button.addEventListener('click', function() {
            const planId = this.getAttribute('data-plan');
            if (planId && plans[planId]) {
                openBuyModal(planId);
            }
        });
    });
    
    // Модальное окно
    const modal = document.getElementById('buyModal');
    const closeModalBtn = document.querySelector('.close-modal');
    const confirmBuyBtn = document.getElementById('confirmBuyBtn');
    
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', () => {
            modal.classList.remove('active');
        });
    }
    
    if (confirmBuyBtn) {
        confirmBuyBtn.addEventListener('click', processPayment);
    }
    
    // Закрытие модального окна по клику вне его
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.classList.remove('active');
        }
    });
    
    // Загрузка данных пользователя
    loadUserData();
});

// Обновление статуса пинга
function updatePingStatus(ping) {
    const statusText = document.querySelector('.status-text');
    if (statusText) {
        if (ping <= 15) {
            statusText.textContent = 'Идеальное соединение!';
        } else if (ping <= 25) {
            statusText.textContent = 'Отличное соединение';
        } else {
            statusText.textContent = 'Хорошее соединение';
        }
    }
}

// Открытие модального окна покупки
function openBuyModal(planId) {
    const plan = plans[planId];
    const modal = document.getElementById('buyModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalPlanInfo = document.getElementById('modalPlanInfo');
    
    modalTitle.textContent = `Купить ${plan.name}`;
    
    modalPlanInfo.innerHTML = `
        <div class="selected-plan">
            <div class="plan-header" style="border-left: 4px solid ${plan.color}; padding-left: 15px;">
                <h4 style="color: ${plan.color}">${plan.name}</h4>
                <div class="plan-price" style="font-size: 2rem; font-weight: 800; margin: 10px 0;">${plan.price} ₽</div>
            </div>
            <div class="plan-features" style="margin: 20px 0;">
                ${plan.features.map(feature => `
                    <div class="feature" style="display: flex; align-items: center; gap: 10px; margin: 10px 0;">
                        <i class="fas fa-check" style="color: ${plan.color}"></i>
                        <span>${feature}</span>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    
    modal.classList.add('active');
}

// Обработка платежа
function processPayment() {
    const modal = document.getElementById('buyModal');
    const confirmBtn = document.getElementById('confirmBuyBtn');
    
    confirmBtn.disabled = true;
    confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Обработка платежа...';
    
    // Имитация процесса оплаты
    setTimeout(() => {
        // В реальном приложении здесь будет интеграция с платежной системой
        
        // Показываем успешное сообщение
        const modalBody = document.querySelector('.modal-body');
        modalBody.innerHTML = `
            <div style="text-align: center; padding: 30px;">
                <div style="width: 80px; height: 80px; background: ${plans.pro.color}; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px;">
                    <i class="fas fa-check" style="font-size: 2.5rem;"></i>
                </div>
                <h3 style="color: #00FF00; margin-bottom: 15px;">Оплата успешна!</h3>
                <p>Данные для подключения к VPN отправлены вам в Telegram.</p>
                <p style="font-size: 0.9em; color: #aaa; margin-top: 20px;">
                    Проверьте личные сообщения с ботом
                </p>
            </div>
        `;
        
        // Через 3 секунды закрываем модальное окно
        setTimeout(() => {
            modal.classList.remove('active');
            confirmBtn.disabled = false;
            confirmBtn.innerHTML = '<i class="fas fa-lock"></i> Перейти к оплате';
            
            // Восстанавливаем содержимое модального окна
            setTimeout(() => {
                const modalBody = document.querySelector('.modal-body');
                if (modalBody) {
                    modalBody.innerHTML = `
                        <div id="modalPlanInfo"></div>
                        <div class="payment-methods">
                            <h4>Способ оплаты:</h4>
                            <div class="payment-option">
                                <input type="radio" id="card" name="payment" checked>
                                <label for="card">
                                    <i class="fas fa-credit-card"></i> Банковская карта
                                </label>
                            </div>
                            <div class="payment-option">
                                <input type="radio" id="crypto" name="payment">
                                <label for="crypto">
                                    <i class="fas fa-coins"></i> Криптовалюта
                                </label>
                            </div>
                            <div class="payment-option">
                                <input type="radio" id="qiwi" name="payment">
                                <label for="qiwi">
                                    <i class="fas fa-wallet"></i> QIWI
                                </label>
                            </div>
                        </div>
                        <button class="btn btn-primary btn-block" id="confirmBuyBtn">
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

// Загрузка данных пользователя
function loadUserData() {
    // В реальном приложении здесь будет запрос к серверу
    console.log('Данные пользователя загружены:', userData);
}

// Отправка данных в Telegram
function sendToTelegram(data) {
    // Интеграция с Telegram Web Apps SDK
    if (window.Telegram && window.Telegram.WebApp) {
        window.Telegram.WebApp.sendData(JSON.stringify(data));
    }
}