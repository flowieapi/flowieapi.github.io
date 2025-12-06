// Система оплаты с интеграцией Firebase и подтверждением после оплаты
class PaymentSystem {
    constructor() {
        this.selectedPlan = null;
        this.selectedPrice = null;
        this.selectedPlanName = null;
        this.receiptBase64 = '';
        this.fileName = '';
        this.currentOrderId = null;
        
        // Firebase конфигурация
        this.firebaseConfig = {
            apiKey: "AIzaSyDG7SJfMbSiIbTkBxV6BBoPAsTAKQsLPv8",
            authDomain: "flowie-vpn.firebaseapp.com",
            databaseURL: "https://flowie-vpn-default-rtdb.firebaseio.com",
            projectId: "flowie-vpn",
            storageBucket: "flowie-vpn.firebasestorage.app",
            messagingSenderId: "55860525820",
            appId: "1:55860525820:web:75bd65ad5e04064b313579"
        };
        
        this.init();
    }
    
    init() {
        this.initFirebase();
        this.initEventListeners();
        this.setupPaymentListener();
    }
    
    initFirebase() {
        try {
            // Инициализация Firebase
            if (!firebase.apps.length) {
                firebase.initializeApp(this.firebaseConfig);
            }
            this.database = firebase.database();
            console.log('Firebase инициализирован для системы оплаты');
        } catch (error) {
            console.error('Ошибка инициализации Firebase:', error);
        }
    }
    
    initEventListeners() {
        // Кнопка тестирования оплаты
        const testPaymentBtn = document.getElementById('testPaymentBtn');
        if (testPaymentBtn) {
            testPaymentBtn.addEventListener('click', () => {
                this.openPaymentModal({
                    plan: 'light',
                    price: '299',
                    name: 'Лайт VPN (тест)'
                });
            });
        }
        
        // Обновляем обработчики кнопок покупки
        document.querySelectorAll('.buy-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                const planId = button.getAttribute('data-plan');
                const price = button.getAttribute('data-price');
                const name = button.getAttribute('data-name');
                
                this.openPaymentModal({
                    plan: planId,
                    price: price,
                    name: name
                });
            });
        });
        
        // Копирование реквизитов
        document.addEventListener('click', (e) => {
            if (e.target.closest('.copy-btn-small')) {
                const button = e.target.closest('.copy-btn-small');
                const textToCopy = button.getAttribute('data-text');
                this.copyToClipboard(textToCopy, button);
            }
        });
        
        // Загрузка файла
        const fileUploadArea = document.getElementById('fileUploadArea');
        const fileInput = document.getElementById('receiptFile');
        
        if (fileUploadArea && fileInput) {
            fileUploadArea.addEventListener('click', () => {
                fileInput.click();
            });
            
            fileInput.addEventListener('change', (e) => {
                this.handleFileUpload(e);
            });
        }
        
        // Отправка формы
        const receiptForm = document.getElementById('receiptUploadForm');
        if (receiptForm) {
            receiptForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.submitPayment();
            });
        }
    }
    
    // Настройка слушателя изменений статуса платежа
    setupPaymentListener() {
        // Проверяем, есть ли ожидающие платежи в localStorage
        this.checkPendingPayments();
        
        // Настраиваем слушатель Firebase для отслеживания изменений
        // В реальном приложении здесь будет логика для конкретного пользователя
        this.setupFirebaseListener();
    }
    
    checkPendingPayments() {
        // Проверяем localStorage на наличие ожидающих платежей
        const pendingPayment = localStorage.getItem('pending_payment_order_id');
        if (pendingPayment) {
            // Проверяем статус платежа в Firebase
            this.checkPaymentStatus(pendingPayment).then(orderData => {
                if (orderData && orderData.status === 'approved') {
                    // Платеж подтвержден, показываем окно подтверждения
                    this.selectedPlan = orderData.plan;
                    this.selectedPlanName = orderData.planName;
                    this.showConfirmationModal();
                    
                    // Очищаем localStorage
                    localStorage.removeItem('pending_payment_order_id');
                } else if (orderData && (orderData.status === 'declined' || orderData.status === 'cancelled')) {
                    // Платеж отклонен, показываем уведомление
                    this.showNotification('Ваш платеж был отклонен администратором. Пожалуйста, свяжитесь с поддержкой.', 'error');
                    localStorage.removeItem('pending_payment_order_id');
                }
                // Если статус все еще 'pending', ничего не делаем - ждем
            });
        }
    }
    
    setupFirebaseListener() {
        // Получаем ID текущего пользователя
        let userId = 'unknown';
        if (window.Telegram?.WebApp?.initDataUnsafe?.user) {
            userId = window.Telegram.WebApp.initDataUnsafe.user.id.toString();
        } else if (window.currentUser && window.currentUser.id) {
            userId = window.currentUser.id;
        }
        
        // Настраиваем слушатель для платежей этого пользователя
        // В реальном приложении здесь будет более сложная логика
        try {
            this.database.ref('payments')
                .orderByChild('userId')
                .equalTo(userId)
                .on('child_changed', (snapshot) => {
                    const orderData = snapshot.val();
                    console.log('Статус платежа изменен:', orderData);
                    
                    // Проверяем, является ли этот платеж текущим
                    if (orderData.id === this.currentOrderId) {
                        if (orderData.status === 'approved') {
                            // Платеж подтвержден!
                            this.selectedPlan = orderData.plan;
                            this.selectedPlanName = orderData.planName;
                            this.showConfirmationModal();
                            
                            // Очищаем текущий заказ
                            this.currentOrderId = null;
                        } else if (orderData.status === 'declined') {
                            // Платеж отклонен
                            this.showNotification('Ваш платеж был отклонен администратором. Пожалуйста, свяжитесь с поддержкой.', 'error');
                            this.currentOrderId = null;
                        }
                    }
                });
        } catch (error) {
            console.error('Ошибка настройки слушателя Firebase:', error);
        }
    }
    
    openPaymentModal(planData) {
        this.selectedPlan = planData.plan;
        this.selectedPrice = planData.price;
        this.selectedPlanName = planData.name;
        
        const modal = document.getElementById('paymentModal');
        const planInfo = document.getElementById('paymentPlanInfo');
        
        if (modal && planInfo) {
            // Заполняем информацию о плане
            const plan = this.getPlanInfo(planData.plan);
            planInfo.innerHTML = `
                <div class="selected-plan-display">
                    <div class="plan-icon" style="background: ${plan.color}20; border-color: ${plan.color};">
                        <i class="fas fa-${plan.icon}" style="color: ${plan.color};"></i>
                    </div>
                    <div class="plan-details">
                        <h4 style="color: ${plan.color}; margin: 0 0 5px 0;">${planData.name}</h4>
                        <div class="plan-price" style="color: ${plan.color}; font-size: 1.8rem; font-weight: 800;">
                            ${planData.price} ₽
                        </div>
                        <small>Срок: 30 дней</small>
                    </div>
                </div>
            `;
            
            // Сбрасываем форму
            this.resetForm();
            
            // Показываем модальное окно
            modal.classList.add('active');
        }
    }
    
    closePaymentModal() {
        const modal = document.getElementById('paymentModal');
        if (modal) {
            modal.classList.remove('active');
            this.resetForm();
        }
    }
    
    getPlanInfo(planId) {
        const plans = {
            light: {
                name: 'Лайт VPN',
                price: 299,
                color: '#00ff88',
                icon: 'bolt'
            },
            pro: {
                name: 'Про VPN',
                price: 599,
                color: '#00ccff',
                icon: 'rocket'
            },
            flowi: {
                name: 'Флоуи VPN',
                price: 999,
                color: '#9d4edd',
                icon: 'gem'
            }
        };
        
        return plans[planId] || plans.light;
    }
    
    copyToClipboard(text, button) {
        navigator.clipboard.writeText(text).then(() => {
            const originalHtml = button.innerHTML;
            button.innerHTML = '<i class="fas fa-check"></i>';
            button.style.background = 'var(--success-color)';
            
            setTimeout(() => {
                button.innerHTML = originalHtml;
                button.style.background = '';
            }, 2000);
        }).catch(err => {
            console.error('Ошибка копирования:', err);
            this.showStatus('Не удалось скопировать', 'error');
        });
    }
    
    handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        // Проверка размера файла (макс. 5MB)
        if (file.size > 5 * 1024 * 1024) {
            this.showStatus('Файл слишком большой. Максимальный размер - 5MB.', 'error');
            return;
        }
        
        // Проверка типа файла
        if (!file.type.match('image.*')) {
            this.showStatus('Пожалуйста, загрузите изображение (JPG, PNG, GIF).', 'error');
            return;
        }
        
        this.fileName = file.name;
        
        // Предпросмотр изображения
        const reader = new FileReader();
        reader.onload = (e) => {
            const preview = document.getElementById('filePreview');
            const previewImage = document.getElementById('previewImage');
            const uploadArea = document.getElementById('fileUploadArea');
            
            if (preview && previewImage) {
                previewImage.src = e.target.result;
                preview.style.display = 'block';
                uploadArea.classList.add('has-file');
                
                // Конвертация в Base64
                this.receiptBase64 = e.target.result;
                
                // Активируем кнопку отправки
                const submitBtn = document.getElementById('submitReceiptBtn');
                if (submitBtn) {
                    submitBtn.disabled = false;
                }
            }
        };
        reader.readAsDataURL(file);
    }
    
    removeUploadedFile() {
        const preview = document.getElementById('filePreview');
        const fileInput = document.getElementById('receiptFile');
        const uploadArea = document.getElementById('fileUploadArea');
        
        if (preview) preview.style.display = 'none';
        if (fileInput) fileInput.value = '';
        if (uploadArea) uploadArea.classList.remove('has-file');
        
        this.receiptBase64 = '';
        this.fileName = '';
        
        const submitBtn = document.getElementById('submitReceiptBtn');
        if (submitBtn) submitBtn.disabled = true;
    }
    
    resetForm() {
        // Сброс формы
        const form = document.getElementById('receiptUploadForm');
        if (form) form.reset();
        
        this.removeUploadedFile();
        
        const status = document.getElementById('paymentStatus');
        if (status) {
            status.style.display = 'none';
            status.className = 'payment-status';
        }
        
        const submitBtn = document.getElementById('submitReceiptBtn');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Отправить чек на проверку';
        }
    }
    
    async submitPayment() {
        if (!this.receiptBase64) {
            this.showStatus('Пожалуйста, загрузите чек об оплате.', 'error');
            return;
        }
        
        const payerName = document.getElementById('payerName').value || 'Не указано';
        const payerEmail = document.getElementById('payerEmail').value || 'Не указано';
        const submitBtn = document.getElementById('submitReceiptBtn');
        
        if (!submitBtn) return;
        
        // Показываем загрузку
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Отправка...';
        
        try {
            // Получаем данные пользователя Telegram
            let telegramUser = null;
            let userId = 'unknown';
            
            if (window.Telegram?.WebApp?.initDataUnsafe?.user) {
                telegramUser = window.Telegram.WebApp.initDataUnsafe.user;
                userId = telegramUser.id.toString();
            } else if (window.currentUser && window.currentUser.id) {
                userId = window.currentUser.id;
            } else {
                // Создаем временный ID для демо
                userId = 'demo_user_' + Date.now();
            }
            
            // Создаем уникальный ID заказа
            this.currentOrderId = 'order_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            const timestamp = new Date().toISOString();
            
            // Данные заказа
            const orderData = {
                id: this.currentOrderId,
                userId: userId,
                telegramUser: telegramUser ? {
                    id: telegramUser.id,
                    username: telegramUser.username,
                    firstName: telegramUser.first_name,
                    lastName: telegramUser.last_name
                } : null,
                payerName: payerName,
                payerEmail: payerEmail,
                plan: this.selectedPlan,
                planName: this.selectedPlanName,
                price: parseInt(this.selectedPrice),
                receipt: this.receiptBase64,
                fileName: this.fileName,
                timestamp: timestamp,
                status: "pending", // pending, approved, declined, processing
                adminNote: "",
                reviewDate: null,
                reviewedBy: null
            };
            
            // Сохраняем ID заказа в localStorage для проверки статуса
            localStorage.setItem('pending_payment_order_id', this.currentOrderId);
            
            // Сохраняем в Firebase
            await this.database.ref('payments/' + this.currentOrderId).set(orderData);
            
            // Показываем успешное сообщение
            this.showStatus('Чек успешно отправлен на проверку! Мы свяжемся с вами в течение 24 часов.', 'success');
            
            // Обновляем интерфейс
            this.updateUserInterfaceAfterPayment();
            
            // Закрываем модальное окно оплаты через 3 секунды
            setTimeout(() => {
                this.closePaymentModal();
            }, 3000);
            
            // Для ДЕМО: Автоматически подтверждаем платеж через 10 секунд
            // В реальном приложении этого не будет - администратор вручную подтверждает
            if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                console.log('ДЕМО РЕЖИМ: Платеж будет автоматически подтвержден через 10 секунд');
                setTimeout(() => {
                    this.simulateAdminApproval(this.currentOrderId);
                }, 10000);
            }
            
        } catch (error) {
            console.error('Ошибка при сохранении в Firebase:', error);
            this.showStatus('Произошла ошибка при отправке. Пожалуйста, попробуйте еще раз.', 'error');
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Отправить чек на проверку';
        }
    }
    
    // Метод для имитации подтверждения администратора (только для демо)
    simulateAdminApproval(orderId) {
        console.log('ДЕМО: Имитация подтверждения платежа администратором');
        
        // Обновляем статус платежа в Firebase
        this.database.ref('payments/' + orderId).update({
            status: 'approved',
            adminNote: 'Платеж подтвержден автоматически (демо-режим)',
            reviewDate: new Date().toISOString(),
            reviewedBy: 'demo_admin'
        }).then(() => {
            console.log('ДЕМО: Платеж подтвержден');
            this.showNotification('Ваш платеж подтвержден администратором!', 'success');
        }).catch(error => {
            console.error('ДЕМО: Ошибка подтверждения платежа:', error);
        });
    }
    
    showStatus(message, type) {
        const statusElement = document.getElementById('paymentStatus');
        if (!statusElement) return;
        
        statusElement.textContent = message;
        statusElement.className = `payment-status ${type}`;
        statusElement.style.display = 'block';
        
        // Автоматическое скрытие через 5 секунд для ошибок
        if (type === 'error') {
            setTimeout(() => {
                statusElement.style.display = 'none';
            }, 5000);
        }
    }
    
    // ===== МЕТОДЫ ДЛЯ МОДАЛЬНОГО ОКНА ПОДТВЕРЖДЕНИЯ =====
    
    showConfirmationModal() {
        // Показываем модальное окно подтверждения
        const confirmationModal = document.getElementById('confirmationModal');
        if (!confirmationModal) return;
        
        // Блокируем body
        document.body.classList.add('confirmation-active');
        
        // Показываем модальное окно
        confirmationModal.classList.add('show');
        
        // Генерируем и настраиваем ссылку для скачивания
        const downloadLink = document.getElementById('configDownloadLink');
        if (downloadLink) {
            const configContent = this.generateWireGuardConfig();
            const blob = new Blob([configContent], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            
            downloadLink.href = url;
            
            // Очистка URL при закрытии
            confirmationModal.addEventListener('click', function cleanup(e) {
                if (e.target.closest('#finalConfirmBtn') && document.getElementById('finalConfirmBtn').classList.contains('enabled')) {
                    URL.revokeObjectURL(url);
                }
            }, { once: true });
        }
        
        // Настраиваем чекбокс
        const checkbox = document.getElementById('confirmationCheckbox');
        const confirmBtn = document.getElementById('finalConfirmBtn');
        
        if (checkbox && confirmBtn) {
            checkbox.addEventListener('change', () => {
                if (checkbox.checked) {
                    confirmBtn.disabled = false;
                    confirmBtn.classList.add('enabled');
                } else {
                    confirmBtn.disabled = true;
                    confirmBtn.classList.remove('enabled');
                }
            });
        }
        
        // Настраиваем кнопку подтверждения
        if (confirmBtn) {
            confirmBtn.addEventListener('click', () => {
                if (confirmBtn.classList.contains('enabled')) {
                    this.closeConfirmationModal();
                    
                    // Показываем уведомление об успехе
                    this.showNotification('Покупка прошла успешно, Приятной игры!', 'success');
                    
                    // Обновляем профиль пользователя
                    if (window.currentUser) {
                        currentUser.subscription = {
                            active: true,
                            plan: this.selectedPlan,
                            planName: this.selectedPlanName,
                            price: parseInt(this.selectedPrice),
                            startDate: new Date().toISOString(),
                            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
                        };
                        
                        // Добавляем в историю покупок
                        if (window.userPurchases) {
                            userPurchases.unshift({
                                orderId: this.currentOrderId,
                                planId: this.selectedPlan,
                                planName: this.selectedPlanName,
                                price: parseInt(this.selectedPrice),
                                status: 'active',
                                purchaseDate: new Date().toISOString(),
                                endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
                            });
                        }
                        
                        // Сохраняем в localStorage
                        localStorage.setItem('flowi_user', JSON.stringify(currentUser));
                        if (window.userPurchases) {
                            localStorage.setItem('flowi_purchases', JSON.stringify(userPurchases));
                        }
                        
                        // Обновляем UI
                        if (window.updateProfileSubscriptionUI) {
                            updateProfileSubscriptionUI();
                        }
                        
                        // Показываем уведомление об успешной активации
                        this.showNotification(`Тариф "${this.selectedPlanName}" успешно активирован на 30 дней!`, 'success');
                    }
                }
            });
        }
        
        // Предотвращаем закрытие окна
        confirmationModal.addEventListener('click', (e) => {
            if (e.target === confirmationModal) {
                e.preventDefault();
                e.stopPropagation();
                // Добавляем анимацию тряски при попытке закрыть
                confirmationModal.classList.add('shake');
                setTimeout(() => confirmationModal.classList.remove('shake'), 300);
            }
        });
        
        // Добавляем анимацию тряски для чекбокса
        const shakeCheckbox = () => {
            const checkboxContainer = document.querySelector('.confirmation-checkbox');
            if (checkboxContainer && !document.getElementById('confirmationCheckbox').checked) {
                checkboxContainer.classList.add('shake');
                setTimeout(() => checkboxContainer.classList.remove('shake'), 300);
            }
        };
        
        // Периодически напоминаем о необходимости подтверждения
        setTimeout(() => {
            if (!document.getElementById('confirmationCheckbox').checked) {
                shakeCheckbox();
            }
        }, 10000);
    }
    
    closeConfirmationModal() {
        const confirmationModal = document.getElementById('confirmationModal');
        if (confirmationModal) {
            confirmationModal.classList.remove('show');
            document.body.classList.remove('confirmation-active');
            
            // Сбрасываем чекбокс
            const checkbox = document.getElementById('confirmationCheckbox');
            const confirmBtn = document.getElementById('finalConfirmBtn');
            
            if (checkbox) checkbox.checked = false;
            if (confirmBtn) {
                confirmBtn.disabled = true;
                confirmBtn.classList.remove('enabled');
            }
        }
    }
    
    // Метод для генерации конфигурационного файла WireGuard
    generateWireGuardConfig() {
        const timestamp = Date.now();
        const serverIP = `10.0.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
        
        return `[Interface]
PrivateKey = eFj9yPq1oZkLmNwXvBtRcSdTgUhViJwOmYzAnXpLq=
Address = ${serverIP}/32
DNS = 1.1.1.1, 8.8.8.8

[Peer]
PublicKey = bLmNwXvBtRcSdTgUhViJwOmYzAnXpLq=eFj9yPq1oZk
AllowedIPs = 0.0.0.0/0
Endpoint = vpn.flowi-proxy.ru:51820
PersistentKeepalive = 25

# ФЛОУИ VPN для PUBG Mobile
# Сгенерировано: ${new Date().toLocaleString('ru-RU')}
# Тариф: ${this.selectedPlanName}
# Действителен до: ${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('ru-RU')}
# ID: ${timestamp}`;
    }
    
    // Функция для показа уведомлений
    showNotification(message, type = 'info') {
        // Создаем элемент уведомления
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        `;
        
        // Добавляем на страницу
        document.body.appendChild(notification);
        
        // Показываем с анимацией
        setTimeout(() => notification.classList.add('show'), 10);
        
        // Скрываем через 3 секунды
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
    
    updateUserInterfaceAfterPayment() {
        // Здесь можно обновить UI после отправки платежа
        
        // Если есть текущий пользователь, обновляем его данные
        if (window.currentUser) {
            // Добавляем ожидающую подписку
            if (window.userPurchases) {
                userPurchases.unshift({
                    orderId: this.currentOrderId,
                    planId: this.selectedPlan,
                    planName: this.selectedPlanName,
                    price: parseInt(this.selectedPrice),
                    status: 'pending',
                    purchaseDate: new Date().toISOString(),
                    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
                });
                
                // Обновляем UI покупок, если мы на странице покупок
                if (window.location.pathname.includes('purchases.html') && window.updatePurchasesUI) {
                    updatePurchasesUI();
                }
                
                // Сохраняем данные
                localStorage.setItem('flowi_purchases', JSON.stringify(userPurchases));
            }
        }
    }
    
    // Метод для проверки статуса оплаты
    async checkPaymentStatus(orderId) {
        try {
            const snapshot = await this.database.ref('payments/' + orderId).once('value');
            return snapshot.val();
        } catch (error) {
            console.error('Ошибка при проверке статуса оплаты:', error);
            return null;
        }
    }
    
    // Метод для загрузки всех платежей пользователя
    async getUserPayments(userId) {
        try {
            const snapshot = await this.database.ref('payments')
                .orderByChild('userId')
                .equalTo(userId)
                .once('value');
            
            const payments = [];
            snapshot.forEach((childSnapshot) => {
                payments.push(childSnapshot.val());
            });
            
            return payments;
        } catch (error) {
            console.error('Ошибка при загрузке платежей пользователя:', error);
            return [];
        }
    }
}

// Инициализация системы оплаты при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    window.paymentSystem = new PaymentSystem();
    
    // Добавляем глобальные функции для закрытия модального окна
    window.closePaymentModal = () => {
        if (window.paymentSystem) {
            window.paymentSystem.closePaymentModal();
        }
    };
    
    window.removeUploadedFile = () => {
        if (window.paymentSystem) {
            window.paymentSystem.removeUploadedFile();
        }
    };
    
    // Функция для тестового открытия модального окна (для отладки)
    window.testConfirmationModal = () => {
        if (window.paymentSystem) {
            window.paymentSystem.selectedPlan = 'light';
            window.paymentSystem.selectedPlanName = 'Лайт VPN';
            window.paymentSystem.showConfirmationModal();
        }
    };
    
    // Функция для имитации подтверждения платежа (для демо)
    window.demoApprovePayment = (orderId) => {
        if (window.paymentSystem && orderId) {
            window.paymentSystem.simulateAdminApproval(orderId);
        } else if (window.paymentSystem) {
            // Если orderId не указан, используем последний
            if (window.paymentSystem.currentOrderId) {
                window.paymentSystem.simulateAdminApproval(window.paymentSystem.currentOrderId);
            } else {
                alert('Нет активных платежей для подтверждения');
            }
        }
    };
});