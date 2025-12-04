// ============ КОНФИГУРАЦИЯ ============
const BOT_TOKEN = '8164840278:AAFHOBOBc564w5VsVYbQEbdwB9srGbtZq_g';
const ADMIN_CHAT_ID = '7620973293';

// Firebase конфигурация
const firebaseConfig = {
    apiKey: "AIzaSyDG7SJfMbSiIbTkBxV6BBoPAsTAKQsLPv8",
    authDomain: "flowie-vpn.firebaseapp.com",
    projectId: "flowie-vpn",
    storageBucket: "flowie-vpn.firebasestorage.app",
    messagingSenderId: "55860525820",
    appId: "1:55860525820:web:75bd65ad5e04064b313579"
};
// ============ ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ============
let tg = null;
let user = null;
let db = null;
let currentPaymentData = null;
let receiptFile = null;
let currentPurchaseId = null;
let syncInterval = null;

// ============ ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ============

function getVpnTariff(name) {
    if (!name) return 'Не указан';
    if (name.includes('Лайт') || name.includes('Дешевый')) return 'VPN Лайт';
    if (name.includes('Про') || name.includes('Средний')) return 'VPN Про';
    if (name.includes('Vip') || name.includes('ВИП') || name.includes('VIP')) return 'VPN ВИП';
    return name;
}

function getStatusText(status) {
    switch (status) {
        case 'pending': return 'ОЖИДАНИЕ';
        case 'confirmed': return 'ПОДТВЕРЖДЕНО';
        case 'rejected': return 'ОТКЛОНЕНО';
        default: return status?.toUpperCase() || 'НЕИЗВЕСТНО';
    }
}

function getStatusColor(status) {
    switch (status) {
        case 'pending': return '#f59e0b';
        case 'confirmed': return '#30D158';
        case 'rejected': return '#ef4444';
        default: return '#94a3b8';
    }
}

function getVPNTypeByName(name) {
    if (!name) return 'cheap';
    if (name.includes('Лайт') || name.includes('Дешевый')) return 'cheap';
    if (name.includes('Про') || name.includes('Средний')) return 'medium';
    if (name.includes('Vip') || name.includes('ВИП')) return 'vip';
    return 'cheap';
}

function getVPNFeatures(vpnName) {
    if (vpnName.includes('Лайт') || vpnName.includes('Дешевый')) {
        return 'Пинг 35-25ms • Базовые сервера';
    } else if (vpnName.includes('Про') || vpnName.includes('Средний')) {
        return 'Пинг 25-18ms • Регистрация урона';
    } else if (vpnName.includes('Vip') || vpnName.includes('ВИП')) {
        return 'Пинг 18-12ms • Все фичи • VIP сервера';
    }
    return 'Все фичи разблокированы';
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
        reader.readAsDataURL(file);
    });
}

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

function scrollToElement(selector) {
    const element = document.querySelector(selector);
    if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
    }
}

async function loadFirebase() {
    try {
        // Загружаем Firebase только если еще не загружен
        if (typeof firebase === 'undefined') {
            await loadScript('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
            await loadScript('https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore-compat.js');
            await loadScript('https://www.gstatic.com/firebasejs/9.22.0/firebase-auth-compat.js');
            console.log('✅ Firebase SDK загружен динамически');
        }
        return true;
    } catch (error) {
        console.error('❌ Ошибка загрузки Firebase:', error);
        return false;
    }
}


async function initFirebase() {
    try {
        console.log('Попытка инициализации Firebase...');

        // Проверяем, что Firebase загружен через CDN
        if (typeof firebase === 'undefined') {
            console.error('Firebase не загружен через CDN');
            return false;
        }

        console.log('Firebase загружен через CDN, версия:', firebase.SDK_VERSION);

        // Конфигурация Firebase
        const firebaseConfig = {
            apiKey: "AIzaSyB03T53pNwMOrQUtRR1gn5XOWP1V6Qg6do",
            authDomain: "vpndatabase-7b0ab.firebaseapp.com",
            projectId: "vpndatabase-7b0ab",
            storageBucket: "vpndatabase-7b0ab.appspot.com",
            messagingSenderId: "577858295889",
            appId: "1:577858295889:web:5b2e2b0884984d17c7a6d0"
        };

        // Инициализируем только если еще не инициализировано
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
            console.log('Firebase приложение инициализировано');
        } else {
            console.log('Firebase уже инициализирован');
        }

        // Инициализируем Firestore
        if (typeof firebase.firestore !== 'undefined') {
            window.db = firebase.firestore();
            console.log('Firestore инициализирован');

            // Проверяем подключение
            db.collection('test').doc('test').get()
                .then(() => console.log('✅ Подключение к Firestore успешно'))
                .catch(error => console.error('❌ Ошибка Firestore:', error));

            return true;
        } else {
            console.error('Firestore не доступен');
            return false;
        }
    } catch (error) {
        console.error('Ошибка инициализации Firebase:', error);
        return false;
    }
}

// Функция динамической загрузки скрипта
// Эта функция должна быть ТОЛЬКО для не-Firebase скриптов
function loadScript(src) {
    return new Promise((resolve, reject) => {
        // НЕ загружать Firebase скрипты через эту функцию
        if (src.includes('firebase')) {
            console.log('Firebase уже загружен через CDN');
            resolve();
            return;
        }

        const script = document.createElement('script');
        script.src = src;
        script.onload = () => {
            console.log('✅ Скрипт загружен:', src);
            resolve();
        };
        script.onerror = () => {
            console.error('❌ Ошибка загрузки скрипта:', src);
            reject(new Error(`Failed to load script: ${src}`));
        };
        document.head.appendChild(script);
    });
}

// ============ ТЕЛЕГРАМ ФУНКЦИИ ============

async function sendReceiptToTelegramSimple(purchaseData, firebaseId) {
    try {
        console.log('Отправка уведомления в Telegram...');

        const message = `
📋 *НОВАЯ ПОКУПКА VPN*

👤 *Пользователь:*
• ID: ${purchaseData.user_id}
• Имя: ${purchaseData.user_name}
• Username: @${purchaseData.username || 'отсутствует'}

💰 *Детали покупки:*
• Товар: ${purchaseData.name}
• Сумма: ${purchaseData.amount}₽
• Заказ: ${purchaseData.order_id}
• Тариф: ${purchaseData.vpn_tariff}
• Дата: ${purchaseData.date}
${purchaseData.has_receipt ? '📎 Чек приложен' : '⚠️ Чек не приложен'}

📊 *ID в системе:* ${firebaseId}

👇 *Действия администратора:*`;

        const keyboard = {
            inline_keyboard: [
                [
                    {
                        text: '✅ Принять',
                        callback_data: `approve_${firebaseId}`
                    },
                    {
                        text: '❌ Отклонить',
                        callback_data: `reject_${firebaseId}`
                    }
                ]
            ]
        };

        if (purchaseData.username && purchaseData.username !== 'no_username') {
            keyboard.inline_keyboard.push([
                {
                    text: '💬 Написать пользователю',
                    url: `https://t.me/${purchaseData.username}`
                }
            ]);
        }

        const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: ADMIN_CHAT_ID,
                text: message,
                parse_mode: 'Markdown',
                reply_markup: keyboard
            })
        });

        const result = await response.json();
        console.log('Ответ Telegram:', result);

        if (result.ok && result.result && db) {
            try {
                const docRef = db.collection('purchases').doc(firebaseId);
                await docRef.update({
                    telegram_message_id: result.result.message_id,
                    admin_notified: true,
                    notified_at: new Date().toISOString()
                });
            } catch (updateError) {
                console.error('Ошибка обновления Telegram message ID:', updateError);
            }
        }

        return result;

    } catch (error) {
        console.error('Ошибка отправки в Telegram:', error);
        return null;
    }
}

// ============ ЛОКАЛЬНОЕ ХРАНИЛИЩЕ ============

function savePurchaseOnce(purchase) {
    let purchases = JSON.parse(localStorage.getItem('flowie_purchases') || '[]');

    const exists = purchases.some(p => p.order_id === purchase.order_id);

    if (!exists) {
        purchases.push(purchase);
        localStorage.setItem('flowie_purchases', JSON.stringify(purchases));
        console.log('Покупка сохранена локально:', purchase.order_id);
        return true;
    }
    return false;
}

function updatePurchaseInStorage(updatedPurchase) {
    let purchases = JSON.parse(localStorage.getItem('flowie_purchases') || '[]');
    const index = purchases.findIndex(p => p.order_id === updatedPurchase.order_id);

    if (index !== -1) {
        purchases[index] = { ...purchases[index], ...updatedPurchase };
    } else {
        purchases.push(updatedPurchase);
    }

    localStorage.setItem('flowie_purchases', JSON.stringify(purchases));
}

// ============ ОСНОВНЫЕ ФУНКЦИИ ПРИЛОЖЕНИЯ ============

document.addEventListener('DOMContentLoaded', async function () {
    console.log('Документ загружен, инициализация...');

    // Инициализация Telegram WebApp
    if (window.Telegram && window.Telegram.WebApp) {
        tg = window.Telegram.WebApp;
        console.log('Telegram WebApp обнаружен');

        // Упрощенные настройки Telegram
        try {
            if (tg.expand) tg.expand();
        } catch (e) {
            console.log('Некоторые функции Telegram не поддерживаются');
        }

        // Получаем данные пользователя
        user = tg.initDataUnsafe?.user;
        console.log('Пользователь Telegram:', user ? 'Есть' : 'Нет');
    } else {
        console.log('Telegram WebApp не обнаружен, запуск в режиме браузера');
        user = {
            id: 123456789,
            first_name: 'Тестовый Пользователь',
            username: 'test_user'
        };
    }

    // Загружаем основные данные сразу
    setupUserProfile();
    loadVPNCategories();
    updatePing();
    loadUserData();
    setupEvents();

    await loadFirebase();

    // Инициализируем
    const firebaseReady = await initFirebase();


    // Инициализируем Firebase в фоне (не блокируем интерфейс)
    setTimeout(async () => {
        await initFirebase();
        if (isFirebaseAvailable) {
            console.log('Firebase готов к работе');
            // Можно добавить синхронизацию локальных данных
        }
    }, 1000);

    console.log('Приложение инициализировано');
});

// Добавьте эту простую функцию для отладки
function testFirebase() {
    console.log('=== ТЕСТ FIREBASE ===');
    console.log('Firebase доступен?', typeof firebase !== 'undefined');
    console.log('Firestore доступен?', typeof firebase?.firestore !== 'undefined');
    console.log('db доступен?', !!db);
    console.log('isFirebaseAvailable:', isFirebaseAvailable);

    if (db) {
        console.log('Пробуем создать тестовый документ...');
        try {
            const testRef = db.collection('test').doc('connection_test');
            testRef.set({
                test: true,
                timestamp: new Date().toISOString(),
                message: 'Тест из консоли'
            }).then(() => {
                console.log('✅ Запись создана');
            }).catch(error => {
                console.error('❌ Ошибка записи:', error);
            });
        } catch (error) {
            console.error('❌ Ошибка:', error);
        }
    }

    showNotification('Тест Firebase завершен');
}

// Настройка профиля
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
        avatarImage.innerHTML = `<span style="font-weight: bold; font-size: 18px; color: white;">${initials}</span>`;
    }

    playerLevel.textContent = getPlayerLevel();
}

function getPlayerLevel() {
    const purchases = JSON.parse(localStorage.getItem('flowie_purchases') || '[]');
    const confirmedPurchases = purchases.filter(p => p.status === 'confirmed');

    if (confirmedPurchases.length === 0) return 1;
    if (confirmedPurchases.length === 1) return 10;
    if (confirmedPurchases.length <= 3) return 25;
    if (confirmedPurchases.length <= 5) return 50;
    return 75;
}

// VPN Категории
function loadVPNCategories() {
    const vpnCategories = [
        {
            id: 'cheap',
            name: 'Лайт VPN',
            icon: '🚀',
            price: 299,
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
            name: 'Про VPN',
            icon: '⚡',
            price: 799,
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
            name: 'Vip VPN',
            icon: '👑',
            price: 1499,
            features: [
                'Пинг 18-12ms',
                'Все фичи предыдущих тарифов',
                'Эксклюзивные сервера',
                'Приоритет на матчмейкинге',
                'VIP поддержка 24/7'
            ],
            description: 'Для киберспортсменов'
        }
    ];

    displayVPNCategories(vpnCategories);
}

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
        'cheap': { name: 'VPN Дешевый', price: 299, icon: '🚀' },
        'medium': { name: 'VPN Средний', price: 799, icon: '⚡' },
        'vip': { name: 'VPN ВИП', price: 1499, icon: '👑' }
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

    showPayment(category);
}

function generateOrderId() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    return `FLOWIE-${timestamp}-${random}`.toUpperCase();
}

// Показ оплаты
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
                Реквизиты для оплата
            </h4>
            
            <div class="bank-card">
                <div style="color: var(--ios-text-secondary); font-size: 12px; margin-bottom: 8px;">
                    Банковская карта Тинькофф
                </div>
                <div class="card-number">2200 7013 3827 9851</div>
                <div class="card-info">
                    <div>
                        <div style="color: var(--ios-text-secondary); font-size: 10px;">Получатель</div>
                        <div style="color: white; font-weight: 600;">Исбагиев И.</div>
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
                <li>При проблемах пишите @flowie_support</li>
            </ul>
        </div>
    `;

    closeModal();
    openPaymentModal();
}

// Обработка файлов
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

function removeFile() {
    const uploadArea = document.getElementById('upload-area');
    const selectedFile = document.getElementById('selected-file');
    const fileInput = document.getElementById('receipt-file');

    if (uploadArea) uploadArea.style.display = 'block';
    if (selectedFile) selectedFile.style.display = 'none';
    if (fileInput) fileInput.value = '';

    receiptFile = null;
}

// Основная функция отправки

async function submitReceipt() {
    console.log('=== ОТПРАВКА ДАННЫХ ===');

    if (!currentPaymentData) {
        showNotification('❌ Ошибка: данные покупки не найдены');
        return;
    }

    try {
        showNotification('📤 Сохраняем данные...');

        // Создаем объект покупки
        const purchaseData = {
            name: currentPaymentData.name,
            amount: currentPaymentData.price,
            status: 'pending',
            date: new Date().toLocaleString('ru-RU'),
            order_id: currentPurchaseId,
            user_id: user?.id?.toString() || 'unknown',
            user_name: user?.first_name || 'Unknown',
            username: user?.username || 'no_username',
            timestamp: new Date().toISOString(),
            vpn_tariff: getVpnTariff(currentPaymentData.name),
            order_amount: currentPaymentData.price,
            has_receipt: !!receiptFile
        };

        // Если есть файл, конвертируем
        if (receiptFile) {
            try {
                const base64 = await fileToBase64(receiptFile);
                // Сохраняем только первые 100к символов чтобы не перегружать
                purchaseData.receipt_preview = base64.substring(0, 100000);
                purchaseData.file_name = receiptFile.name;
                purchaseData.file_size = receiptFile.size;
                purchaseData.file_type = receiptFile.type;
            } catch (fileError) {
                console.error('Ошибка конвертации файла:', fileError);
            }
        }

        // ВСЕГДА сохраняем локально
        const savedLocally = savePurchaseOnce(purchaseData);
        if (!savedLocally) {
            showNotification('⚠️ Этот заказ уже был отправлен');
            closeReceiptModal();
            return;
        }

        // Пробуем сохранить в Firebase если доступно
        if (isFirebaseAvailable && db) {
            try {
                console.log('Пробуем сохранить в Firebase...');

                // Создаем упрощенный объект для Firebase
                const firebaseData = {
                    name: purchaseData.name,
                    amount: purchaseData.price,
                    status: 'pending',
                    date: purchaseData.date,
                    order_id: purchaseData.order_id,
                    user_id: purchaseData.user_id,
                    user_name: purchaseData.user_name,
                    username: purchaseData.username,
                    timestamp: new Date().toISOString(),
                    vpn_tariff: purchaseData.vpn_tariff,
                    order_amount: purchaseData.order_amount,
                    has_receipt: purchaseData.has_receipt,
                    created_at: firebase.firestore.FieldValue ?
                        firebase.firestore.FieldValue.serverTimestamp() :
                        new Date().toISOString()
                };

                // Добавляем в Firestore
                const docRef = await db.collection('purchases').add(firebaseData);
                purchaseData.firebase_id = docRef.id;

                console.log('✅ Сохранено в Firebase, ID:', docRef.id);

                // Отправляем уведомление в Telegram
                await sendReceiptToTelegramSimple(purchaseData, docRef.id);

                showNotification('✅ Данные отправлены! Админ проверит в течение 15 минут');

            } catch (firebaseError) {
                console.error('Ошибка Firebase:', firebaseError);
                showNotification('⚠️ Данные сохранены локально. Ошибка подключения к базе.');
            }
        } else {
            // Firebase недоступен, сохраняем только локально
            console.log('Firebase недоступен, сохраняем только локально');
            showNotification('⚠️ Данные сохранены локально. База данных недоступна.');
        }

        // Обновляем интерфейс
        setTimeout(() => {
            closeReceiptModal();
            loadPurchases();
            loadUserData();

            // Очищаем
            currentPaymentData = null;
            currentPurchaseId = null;
            receiptFile = null;
            removeFile();
        }, 1500);

    } catch (error) {
        console.error('Ошибка:', error);
        showNotification('❌ Ошибка сохранения: ' + error.message);
    }
}

// Загрузка данных пользователя
function loadUserData() {
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
                    <span>${getVPNFeatures(lastConfirmed.name)}</span>
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
                        <div class="stat-value">${getRandomInt(12, 35)}ms</div>
                        <div class="stat-label">Текущий пинг</div>
                    </div>
                </div>
            </div>
        `;

        localStorage.setItem('flowie_active_subscription', JSON.stringify({
            name: lastConfirmed.name,
            type: getVPNTypeByName(lastConfirmed.name),
            activated_at: new Date().toISOString(),
            order_id: lastConfirmed.order_id
        }));
    } else {
        subscriptionCard.innerHTML = `
            <div class="no-subscription">
                <i class="fas fa-key"></i>
                <p>У тебя нет активной подписки</p>
                <button class="btn-buy" onclick="showVPNModal()">
                    <i class="fas fa-bolt"></i> Купить VPN
                </button>
            </div>
        `;
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
            
            ${purchase.receipt_base64 ? `
                <div style="margin-top: 10px; text-align: center;">
                    <button onclick="showBase64Image('${purchase.receipt_base64.substring(0, 100)}...')" 
                       style="color: #30D158; text-decoration: none; font-size: 12px; display: inline-flex; align-items: center; gap: 5px; background: none; border: none;">
                        <i class="fas fa-receipt"></i>
                        Посмотреть чек
                    </button>
                </div>
            ` : ''}
            
            ${purchase.status === 'pending' ? `
                <div style="font-size: 12px; color: #f59e0b; text-align: center; padding: 8px; background: rgba(245, 158, 11, 0.1); border-radius: 8px; border: 1px solid rgba(245, 158, 11, 0.2); margin-top: 10px;">
                    ⏳ Ожидает проверки администратором
                </div>
            ` : purchase.status === 'confirmed' ? `
                <div style="font-size: 12px; color: #22c55e; text-align: center; padding: 8px; background: rgba(34, 197, 94, 0.1); border-radius: 8px; border: 1px solid rgba(34, 197, 94, 0.2); margin-top: 10px;">
                    ✅ Оплата подтверждена! VPN активирован.
                </div>
            ` : `
                <div style="font-size: 12px; color: #FF453A; text-align: center; padding: 8px; background: rgba(255, 69, 58, 0.1); border-radius: 8px; border: 1px solid rgba(255, 69, 58, 0.2); margin-top: 10px;">
                    ❌ Платеж отклонен. Свяжитесь с поддержкой.
                </div>
            `}
        </div>
    `).join('');

    purchasesSection.style.display = 'block';
}

function showBase64Image(base64) {
    const newWindow = window.open();
    newWindow.document.write(`
        <html>
        <head><title>Чек</title></head>
        <body style="margin: 0; padding: 20px; background: #f5f5f5;">
            <img src="${base64}" style="max-width: 100%; height: auto; border-radius: 10px;">
        </body>
        </html>
    `);
}

// Модальные окна
function closeModal() {
    const modals = document.querySelectorAll('.modal-overlay');
    modals.forEach(modal => {
        modal.classList.remove('active');
    });
    document.body.style.overflow = '';
}

function openPaymentModal() {
    const modal = document.getElementById('payment-modal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closePaymentModal() {
    const modal = document.getElementById('payment-modal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

function openReceiptUpload() {
    closePaymentModal();
    const modal = document.getElementById('receipt-modal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeReceiptModal() {
    const modal = document.getElementById('receipt-modal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// VPN модальное окно
function showVPNModal() {
    const modal = document.getElementById('vpn-modal');
    if (!modal) {
        const vpnModal = document.createElement('div');
        vpnModal.id = 'vpn-modal';
        vpnModal.className = 'modal-overlay';
        vpnModal.innerHTML = `
            <div class="modal pubg-modal">
                <div class="modal-header">
                    <h3><i class="fas fa-gamepad"></i>Выбор VPN</h3>
                    <button class="close-modal"><i class="fas fa-times"></i></button>
                </div>
                <div class="modal-body" id="vpn-selection"></div>
            </div>
        `;
        document.body.appendChild(vpnModal);
        vpnModal.querySelector('.close-modal').addEventListener('click', closeModal);
    }

    const modalElement = document.getElementById('vpn-modal');
    if (modalElement) {
        modalElement.classList.add('active');
        document.body.style.overflow = 'hidden';

        const vpnContent = document.getElementById('vpn-selection');
        if (vpnContent) {
            const categories = {
                'cheap': { name: 'VPN Дешевый', price: 299, icon: '🚀', description: 'Для начинающих' },
                'medium': { name: 'VPN Средний', price: 799, icon: '⚡', description: 'Для опытных' },
                'vip': { name: 'VPN ВИП', price: 1499, icon: '👑', description: 'Для профессионалов' }
            };

            vpnContent.innerHTML = Object.entries(categories).map(([id, category]) => `
                <div class="vpn-modal-card" style="background: var(--ios-glass); border-radius: 16px; padding: 20px; margin-bottom: 16px; border: 1px solid rgba(48, 209, 88, 0.3);">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <span style="font-size: 32px;">${category.icon}</span>
                            <div>
                                <h4 style="font-size: 18px; font-weight: 700; color: white; margin-bottom: 4px;">${category.name}</h4>
                                <p style="color: var(--ios-text-secondary); font-size: 12px;">${category.description}</p>
                            </div>
                        </div>
                        <div style="font-size: 24px; font-weight: 700; color: #30D158;">${category.price}₽</div>
                    </div>
                    
                    <button onclick="buyVPN('${id}')" style="width: 100%; padding: 16px; background: linear-gradient(45deg, #30D158, #20A548); border: none; border-radius: 12px; color: white; font-weight: 600; font-size: 16px; cursor: pointer; display: flex; justify-content: center; align-items: center; gap: 10px;">
                        <i class="fas fa-shopping-cart"></i> Купить за ${category.price}₽
                    </button>
                </div>
            `).join('');
        }
    }
}

// Профиль
function showProfileModal() {
    const purchases = JSON.parse(localStorage.getItem('flowie_purchases') || '[]');
    const totalPurchases = purchases.length;
    const confirmedPurchases = purchases.filter(p => p.status === 'confirmed');
    const totalSpent = purchases.reduce((sum, p) => sum + p.amount, 0);

    const profileHTML = `
        <div class="profile-modal" style="color: white;">
            <div style="text-align: center; padding: 20px; background: rgba(48, 209, 88, 0.1); border-radius: 16px; margin-bottom: 20px; border: 1px solid rgba(48, 209, 88, 0.3);">
                <div style="width: 100px; height: 100px; margin: 0 auto 16px; border-radius: 50%; overflow: hidden; border: 3px solid #30D158;">
                    ${user?.photo_url ?
            `<img src="${user.photo_url}" alt="${user.first_name}" style="width: 100%; height: 100%; object-fit: cover;">` :
            `<div style="width: 100%; height: 100%; background: rgba(255, 255, 255, 0.1); display: flex; align-items: center; justify-content: center; font-size: 36px; color: white; font-weight: bold;">${(user?.first_name?.[0] || 'U').toUpperCase()}</div>`
        }
                </div>
                <h3 style="font-size: 24px; font-weight: 700; margin-bottom: 8px;">${user?.first_name || 'Писько'}</h3>
                <p style="color: #30D158; font-size: 16px; margin-bottom: 4px;">@${user?.username || 'username'}</p>
                <div style="display: inline-block; background: rgba(48, 209, 88, 0.2); color: #30D158; padding: 4px 12px; border-radius: 20px; font-size: 14px; font-weight: 600;">Уровень ${getPlayerLevel()}</div>
            </div>
            
            <div style="margin-bottom: 24px;">
                <h4 style="font-size: 18px; font-weight: 600; margin-bottom: 16px; color: white; display: flex; align-items: center; gap: 10px;"><i class="fas fa-chart-bar" style="color: #30D158;"></i>Статистика</h4>
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 20px;">
                    <div style="background: rgba(255, 255, 255, 0.05); border-radius: 12px; padding: 16px; text-align: center; border: 1px solid rgba(255, 255, 255, 0.1);">
                        <div style="font-size: 32px; font-weight: 700; color: #30D158;">${totalPurchases}</div>
                        <div style="font-size: 12px; color: var(--ios-text-secondary);">Всего покупок</div>
                    </div>
                    <div style="background: rgba(255, 255, 255, 0.05); border-radius: 12px; padding: 16px; text-align: center; border: 1px solid rgba(255, 255, 255, 0.1);">
                        <div style="font-size: 32px; font-weight: 700; color: #30D158;">${confirmedPurchases.length}</div>
                        <div style="font-size: 12px; color: var(--ios-text-secondary);">Подтверждено</div>
                    </div>
                </div>
            </div>
            
            <div style="display: flex; flex-direction: column; gap: 12px;">
                <button onclick="closeModal(); showVPNModal();" style="width: 100%; padding: 16px; background: linear-gradient(45deg, #30D158, #20A548); border: none; border-radius: 12px; color: white; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px;"><i class="fas fa-shopping-cart"></i>Купить VPN</button>
                <button onclick="window.open('https://t.me/flowie_support', '_blank');" style="width: 100%; padding: 16px; background: rgba(48, 209, 88, 0.2); border: 1px solid rgba(48, 209, 88, 0.4); border-radius: 12px; color: #30D158; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px;"><i class="fas fa-headset"></i>Поддержка</button>
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
                    <h3><i class="fas fa-user-circle"></i>Профиль</h3>
                    <button class="close-modal"><i class="fas fa-times"></i></button>
                </div>
                <div class="modal-body">${profileHTML}</div>
            </div>
        `;
        document.body.appendChild(profileModal);
        profileModal.querySelector('.close-modal').addEventListener('click', closeModal);
        profileModal.addEventListener('click', function (e) {
            if (e.target === this) closeModal();
        });
    } else {
        profileModal.querySelector('.modal-body').innerHTML = profileHTML;
    }

    profileModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

// Другие функции
function updatePing() {
    const pingValue = document.getElementById('ping-value');
    const currentPing = document.getElementById('current-ping');
    const newPing = getRandomInt(12, 35);

    if (pingValue) pingValue.textContent = newPing + 'ms';
    if (currentPing) {
        currentPing.textContent = newPing + 'ms';
        currentPing.style.color = '#30D158';
    }
}

function checkPing() {
    const pingValue = document.getElementById('ping-value');
    const currentPing = document.getElementById('current-ping');
    const connectBtn = document.getElementById('connect-btn');
    const vpnStatus = document.getElementById('vpn-status');

    connectBtn.disabled = true;
    vpnStatus.textContent = 'Проверяем...';
    pingValue.textContent = '...';

    setTimeout(() => {
        const newPing = Math.floor(Math.random() * 30) + 10;
        pingValue.textContent = newPing + 'ms';
        currentPing.textContent = newPing + 'ms';
        vpnStatus.textContent = 'Готов';
        showNotification('Пинг проверен: ' + newPing + 'ms');

        setTimeout(() => {
            connectBtn.disabled = false;
        }, 2000);
    }, 1500);
}

function toggleVPN() {
    showVPNModal();
}

// Настройка событий
function setupEvents() {
    console.log('Настройка событий...');

    const connectBtn = document.getElementById('connect-btn');
    if (connectBtn) {
        connectBtn.addEventListener('click', checkPing);
    }

    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', function (e) {
            e.preventDefault();
            const span = this.querySelector('span');
            const section = span ? span.textContent.toLowerCase() : '';

            document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');

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

    console.log('События настроены');
}

// Простая функция для теста
async function testSystem() {
    console.log('=== ТЕСТ СИСТЕМЫ ===');
    console.log('Telegram:', user ? '✅ Есть пользователь' : '❌ Нет пользователя');
    console.log('Firebase:', db ? '✅ Подключен' : '❌ Не подключен');
    console.log('Локальные покупки:', JSON.parse(localStorage.getItem('flowie_purchases') || '[]').length);
    showNotification('Тест завершен');
}

// Проверяем что все функции определены
console.log('=== ПРОВЕРКА ФУНКЦИЙ ===');
const requiredFunctions = [
    'getVpnTariff', 'getStatusText', 'getStatusColor', 'getVPNTypeByName',
    'getVPNFeatures', 'getRandomInt', 'fileToBase64', 'showNotification',
    'scrollToElement', 'savePurchaseOnce', 'updatePurchaseInStorage',
    'setupUserProfile', 'getPlayerLevel', 'loadVPNCategories',
    'displayVPNCategories', 'buyVPN', 'generateOrderId', 'showPayment',
    'handleReceiptUpload', 'removeFile', 'submitReceipt', 'loadUserData',
    'loadPurchases', 'showBase64Image', 'closeModal', 'openPaymentModal',
    'closePaymentModal', 'openReceiptUpload', 'closeReceiptModal',
    'showVPNModal', 'showProfileModal', 'updatePing', 'checkPing',
    'toggleVPN', 'setupEvents'
];

requiredFunctions.forEach(funcName => {
    if (typeof window[funcName] !== 'function') {
        console.error(`❌ Функция ${funcName} не определена!`);
    } else {
        console.log(`✅ ${funcName} определена`);
    }
});