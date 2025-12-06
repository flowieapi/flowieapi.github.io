// Система оплаты с интеграцией Firebase
class PaymentSystem {
    constructor() {
        this.selectedPlan = null;
        this.selectedPrice = null;
        this.selectedPlanName = null;
        this.receiptBase64 = '';
        this.fileName = '';
        
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
            }
            
            // Создаем уникальный ID заказа
            const orderId = 'order_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            const timestamp = new Date().toISOString();
            
            // Данные заказа
            const orderData = {
                id: orderId,
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
            
            // Сохраняем в Firebase
            await this.database.ref('payments/' + orderId).set(orderData);
            
            // Показываем успешное сообщение
            this.showStatus('Чек успешно отправлен на проверку! Мы свяжемся с вами в течение 24 часов.', 'success');
            
            // Обновляем интерфейс
            this.updateUserInterfaceAfterPayment();
            
            // Закрываем модальное окно через 3 секунды
            setTimeout(() => {
                this.closePaymentModal();
            }, 3000);
            
        } catch (error) {
            console.error('Ошибка при сохранении в Firebase:', error);
            this.showStatus('Произошла ошибка при отправке. Пожалуйста, попробуйте еще раз.', 'error');
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Отправить чек на проверку';
        }
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
    
    updateUserInterfaceAfterPayment() {
        // Здесь можно обновить UI после успешной оплаты
        // Например, показать уведомление или обновить список покупок
        
        // Если есть текущий пользователь, обновляем его данные
        if (currentUser) {
            // Можно добавить временную подписку в демо-режиме
            userPurchases.unshift({
                planId: this.selectedPlan,
                price: parseInt(this.selectedPrice),
                status: 'pending',
                purchaseDate: new Date().toISOString(),
                endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
            });
            
            // Обновляем UI покупок, если мы на странице покупок
            if (window.location.pathname.includes('purchases.html')) {
                updatePurchasesUI();
            }
            
            // Обновляем профиль, если мы на странице профиля
            if (window.location.pathname.includes('profile.html')) {
                updateProfileSubscriptionUI();
            }
        }
    }
    
    // Метод для проверки статуса оплаты (для администратора)
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
});