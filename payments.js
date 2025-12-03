// Интеграция с платежной системой
class PaymentSystem {
    constructor() {
        this.telegramPayments = window.Telegram.WebApp;
    }
    
    // Инициализация платежа
    async createPayment(tariff, user) {
        try {
            const response = await fetch('/api/payment/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    tariff_id: tariff.id,
                    user_id: user.id,
                    amount: tariff.price,
                    currency: 'RUB'
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                return {
                    success: true,
                    paymentId: data.payment_id,
                    invoice: data.invoice_url
                };
            } else {
                throw new Error(data.error || 'Ошибка создания платежа');
            }
        } catch (error) {
            console.error('Payment creation error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    // Проверка статуса платежа
    async verifyPayment(paymentId) {
        try {
            const response = await fetch('/api/payment/verify', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ payment_id: paymentId })
            });
            
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Payment verification error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    // Показать платежную форму Telegram
    showTelegramPayment(invoiceUrl) {
        this.telegramPayments.openInvoice(invoiceUrl, (status) => {
            if (status === 'paid') {
                this.onPaymentSuccess();
            } else {
                this.onPaymentError(status);
            }
        });
    }
    
    // Обработка успешной оплаты
    onPaymentSuccess() {
        showSuccess('Оплата прошла успешно! Тариф активирован.');
        
        // Обновляем подписки пользователя
        setTimeout(() => {
            loadSubscriptions();
        }, 1000);
    }
    
    // Обработка ошибки оплаты
    onPaymentError(status) {
        let message = '';
        
        switch(status) {
            case 'cancelled':
                message = 'Оплата отменена';
                break;
            case 'failed':
                message = 'Ошибка оплаты';
                break;
            case 'pending':
                message = 'Оплата обрабатывается';
                break;
            default:
                message = 'Произошла ошибка';
        }
        
        alert(message);
    }
}

// Инициализация платежной системы
const paymentSystem = new PaymentSystem();

// Экспорт для использования в других файлах
window.processTelegramPayment = async function(tariff) {
    showLoader();
    
    const payment = await paymentSystem.createPayment(tariff, user);
    
    if (payment.success && payment.invoice) {
        paymentSystem.showTelegramPayment(payment.invoice);
    } else {
        alert(payment.error || 'Ошибка создания платежа');
    }
    
    hideLoader();
};