// translations.js - Многоязычные переводы

const translations = {
    ru: {
        // Общие элементы
        'vpn': 'VPN',
        'profile': 'Профиль',
        'settings': 'Настройки',
        'checkNow': 'Проверить сейчас',
        'buyNow': 'Купить сейчас',
        'loading': 'Загрузка...',
        'save': 'Сохранить',
        'cancel': 'Отмена',
        
        // Главная страница
        'pingCheck': 'Проверка пинга',
        'currentPing': 'Текущая задержка в PUBG Mobile',
        'excellentConnection': 'Идеальное соединение',
        'goodConnection': 'Хорошее соединение',
        'normalConnection': 'Нормальное соединение',
        'chooseVPN': 'Выберите VPN',
        'optimizedForPUBG': 'Оптимизировано для PUBG Mobile',
        
        // Тарифы
        'lightVPN': 'Лайт VPN',
        'proVPN': 'Про VPN',
        'flowiVPN': 'Флоуи VPN',
        'perMonth': '/мес',
        'choosePlan': 'Выбрать тариф',
        
        // Характеристики тарифов
        'pingReduction': 'Пинг: -30-50мс',
        'damageRegistration': 'Лучшая регистрация урона',
        'serversRU': 'Серверы в РФ и Европе',
        'highSpeed': 'Высокая скорость',
        'moreHeadshots': 'Больше хедшотов',
        'serverPriority': 'Приоритет на серверах',
        'unlimitedTraffic': 'Безлимитный трафик',
        'maxPing': 'Максимальный пинг',
        'exclusiveServers': 'Эксклюзивные серверы',
        'prioritySupport': 'Приоритетная поддержка',
        'personalManager': 'Персональный менеджер',
        
        // Преимущества
        'advantages': 'Преимущества',
        'whyChooseUs': 'Почему выбирают нас',
        'ddosProtection': 'Защита от DDoS',
        'ddosDesc': 'Полная защита от атак',
        'stability': 'Стабильность 99.9%',
        'stabilityDesc': 'Минимальные потери пакетов',
        'support247': 'Поддержка 24/7',
        'supportDesc': 'Круглосуточная помощь',
        'optimization': 'Оптимизация',
        'optimizationDesc': 'Настроено для PUBG Mobile',
        
        // Модальное окно покупки
        'checkout': 'Оформление заказа',
        'paymentMethod': 'Способ оплаты',
        'proceedToPayment': 'Перейти к оплате',
        
        // Модальное окно оплаты
        'payment': 'Оплата тарифа',
        'paymentDetails': 'Реквизиты для перевода',
        'cardNumber': 'Номер карты:',
        'recipient': 'Получатель:',
        'bank': 'Банк:',
        'instructions': 'Инструкция:',
        'uploadReceipt': 'Загрузите чек об оплате',
        'yourNameOptional': 'Ваше имя (необязательно)',
        'emailOptional': 'Email для связи (необязательно)',
        'uploadClick': 'Нажмите для загрузки чека',
        'uploadFormats': 'JPG, PNG, GIF (макс. 5MB)',
        'submitReceipt': 'Отправить чек на проверку',
        
        // Инструкция оплаты
        'copyDetails': 'Скопируйте реквизиты карты',
        'makeTransfer': 'Совершите перевод на указанную карту',
        'saveScreenshot': 'Сохраните скриншот или фото чека',
        'uploadReceiptForm': 'Загрузите чек в форму ниже',
        
        // Профиль
        'achievements': 'Достижения',
        'gameAchievements': 'Ваши игровые достижения',
        'firstProtection': 'Первая защита',
        'firstProtectionDesc': 'Использовать VPN в 10 играх',
        'speed': 'Скорость',
        'speedDesc': 'Пинг ниже 20мс',
        'veteran': 'Ветеран',
        'veteranDesc': '100 дней с VPN',
        'professional': 'Профессионал',
        'professionalDesc': '500 игр с VPN',
        
        // Настройки
        'basicSettings': 'Основные',
        'notifications': 'Уведомления',
        'notificationsDesc': 'Получать уведомления о статусе',
        'language': 'Язык',
        'languageDesc': 'Язык интерфейса',
        'support': 'Поддержка',
        'help': 'Помощь',
        'helpDesc': 'FAQ и инструкции',
        'supportChat': 'Чат поддержки',
        'supportChatDesc': 'Онлайн консультация',
        'email': 'Email',
        'emailDesc': 'Написать на почту',
        'telegram': 'Telegram',
        'telegramDesc': 'Канал с новостями',
        'aboutApp': 'О приложении',
        'version': 'Версия:',
        'developer': 'Разработчик:',
        'updated': 'Обновлено:',
        'privacyPolicy': 'Политика конфиденциальности',
        'termsOfUse': 'Пользовательское соглашение',
        
        // Модальное подтверждение
        'paymentSuccess': 'Оплата успешно завершена!',
        'vpnActivated': 'Ваш VPN активирован!',
        'downloadConfig': 'Скачайте файл конфигурации',
        'wireguardConfig': 'WireGuard конфигурационный файл',
        'saveFileWarning': 'Сохраните этот файл в безопасном месте!',
        'installInstructions': 'Инструкция по установке в WireGuard',
        'installWireGuard': 'Установите WireGuard',
        'installWireGuardDesc': 'Скачайте и установите WireGuard с официального сайта или из магазина приложений вашего устройства',
        'importConfig': 'Импортируйте конфигурацию',
        'importConfigDesc': 'В приложении WireGuard нажмите "Добавить туннель" → "Импорт из файла" и выберите скачанный файл',
        'activateConnection': 'Активируйте подключение',
        'activateConnectionDesc': 'Нажмите на переключатель рядом с вашим туннелем в списке для активации VPN подключения',
        'checkConnection': 'Проверьте подключение',
        'checkConnectionDesc': 'Убедитесь, что статус подключения изменился на "Active" и появился значок VPN в статус-баре',
        'confirmation': 'Я сохранил файл конфигурации и прочитал инструкцию',
        'confirmationDesc': 'Я понимаю, что без файла конфигурации я не смогу подключиться к VPN',
        'continue': 'Продолжить'
    },
    
    en: {
        // Common elements
        'vpn': 'VPN',
        'profile': 'Profile',
        'settings': 'Settings',
        'checkNow': 'Check Now',
        'buyNow': 'Buy Now',
        'loading': 'Loading...',
        'save': 'Save',
        'cancel': 'Cancel',
        
        // Main page
        'pingCheck': 'Ping Check',
        'currentPing': 'Current latency in PUBG Mobile',
        'excellentConnection': 'Excellent Connection',
        'goodConnection': 'Good Connection',
        'normalConnection': 'Normal Connection',
        'chooseVPN': 'Choose VPN',
        'optimizedForPUBG': 'Optimized for PUBG Mobile',
        
        // Tariffs
        'lightVPN': 'Light VPN',
        'proVPN': 'Pro VPN',
        'flowiVPN': 'Flowi VPN',
        'perMonth': '/month',
        'choosePlan': 'Choose Plan',
        
        // Plan features
        'pingReduction': 'Ping: -30-50ms',
        'damageRegistration': 'Better damage registration',
        'serversRU': 'Servers in RU and Europe',
        'highSpeed': 'High speed',
        'moreHeadshots': 'More headshots',
        'serverPriority': 'Server priority',
        'unlimitedTraffic': 'Unlimited traffic',
        'maxPing': 'Maximum ping',
        'exclusiveServers': 'Exclusive servers',
        'prioritySupport': 'Priority support',
        'personalManager': 'Personal manager',
        
        // Advantages
        'advantages': 'Advantages',
        'whyChooseUs': 'Why choose us',
        'ddosProtection': 'DDoS Protection',
        'ddosDesc': 'Full attack protection',
        'stability': 'Stability 99.9%',
        'stabilityDesc': 'Minimal packet loss',
        'support247': 'Support 24/7',
        'supportDesc': 'Round-the-clock assistance',
        'optimization': 'Optimization',
        'optimizationDesc': 'Configured for PUBG Mobile',
        
        // Purchase modal
        'checkout': 'Checkout',
        'paymentMethod': 'Payment Method',
        'proceedToPayment': 'Proceed to Payment',
        
        // Payment modal
        'payment': 'Payment',
        'paymentDetails': 'Payment Details',
        'cardNumber': 'Card Number:',
        'recipient': 'Recipient:',
        'bank': 'Bank:',
        'instructions': 'Instructions:',
        'uploadReceipt': 'Upload Payment Receipt',
        'yourNameOptional': 'Your name (optional)',
        'emailOptional': 'Contact email (optional)',
        'uploadClick': 'Click to upload receipt',
        'uploadFormats': 'JPG, PNG, GIF (max 5MB)',
        'submitReceipt': 'Submit Receipt for Verification',
        
        // Payment instructions
        'copyDetails': 'Copy card details',
        'makeTransfer': 'Make a transfer to the specified card',
        'saveScreenshot': 'Save a screenshot or photo of the receipt',
        'uploadReceiptForm': 'Upload the receipt in the form below',
        
        // Profile
        'achievements': 'Achievements',
        'gameAchievements': 'Your game achievements',
        'firstProtection': 'First Protection',
        'firstProtectionDesc': 'Use VPN in 10 games',
        'speed': 'Speed',
        'speedDesc': 'Ping below 20ms',
        'veteran': 'Veteran',
        'veteranDesc': '100 days with VPN',
        'professional': 'Professional',
        'professionalDesc': '500 games with VPN',
        
        // Settings
        'basicSettings': 'Basic',
        'notifications': 'Notifications',
        'notificationsDesc': 'Receive status notifications',
        'language': 'Language',
        'languageDesc': 'Interface language',
        'support': 'Support',
        'help': 'Help',
        'helpDesc': 'FAQ and instructions',
        'supportChat': 'Support Chat',
        'supportChatDesc': 'Online consultation',
        'email': 'Email',
        'emailDesc': 'Write to email',
        'telegram': 'Telegram',
        'telegramDesc': 'News channel',
        'aboutApp': 'About App',
        'version': 'Version:',
        'developer': 'Developer:',
        'updated': 'Updated:',
        'privacyPolicy': 'Privacy Policy',
        'termsOfUse': 'Terms of Use',
        
        // Confirmation modal
        'paymentSuccess': 'Payment Successful!',
        'vpnActivated': 'Your VPN is activated!',
        'downloadConfig': 'Download Configuration File',
        'wireguardConfig': 'WireGuard configuration file',
        'saveFileWarning': 'Save this file in a safe place!',
        'installInstructions': 'Installation Instructions for WireGuard',
        'installWireGuard': 'Install WireGuard',
        'installWireGuardDesc': 'Download and install WireGuard from the official website or your device\'s app store',
        'importConfig': 'Import Configuration',
        'importConfigDesc': 'In WireGuard app, tap "Add Tunnel" → "Import from File" and select the downloaded file',
        'activateConnection': 'Activate Connection',
        'activateConnectionDesc': 'Tap the switch next to your tunnel in the list to activate VPN connection',
        'checkConnection': 'Check Connection',
        'checkConnectionDesc': 'Make sure the connection status changed to "Active" and VPN icon appears in status bar',
        'confirmation': 'I saved the configuration file and read the instructions',
        'confirmationDesc': 'I understand that without the configuration file I won\'t be able to connect to VPN',
        'continue': 'Continue'
    }
};

// Управление языком
class LanguageManager {
    constructor() {
        this.currentLang = this.getSavedLanguage() || this.detectLanguage();
        this.init();
    }
    
    // Инициализация менеджера
    init() {
        this.applyLanguage();
        this.setupLanguageSwitcher();
    }
    
    // Получение сохраненного языка
    getSavedLanguage() {
        try {
            return localStorage.getItem('app_language');
        } catch (e) {
            return null;
        }
    }
    
    // Сохранение языка
    saveLanguage(lang) {
        try {
            localStorage.setItem('app_language', lang);
        } catch (e) {
            console.error('Failed to save language:', e);
        }
    }
    
    // Определение языка по умолчанию
    detectLanguage() {
        // Проверяем Telegram язык
        if (window.Telegram?.WebApp?.initDataUnsafe?.user?.language_code) {
            const telegramLang = window.Telegram.WebApp.initDataUnsafe.user.language_code;
            if (translations[telegramLang]) {
                return telegramLang;
            }
        }
        
        // Проверяем язык браузера
        const browserLang = navigator.language.split('-')[0];
        if (translations[browserLang]) {
            return browserLang;
        }
        
        // По умолчанию русский
        return 'ru';
    }
    
    // Применение текущего языка
    applyLanguage() {
        const lang = this.currentLang;
        document.documentElement.lang = lang;
        
        // Обновляем все текстовые элементы
        this.updateAllTexts();
        
        // Сохраняем выбор
        this.saveLanguage(lang);
        
        // Обновляем селектор языка в настройках
        this.updateLanguageSelector();
        
        // Обновляем заголовок страницы
        this.updatePageTitle();
    }
    
    // Обновление всех текстов
    updateAllTexts() {
        const lang = this.currentLang;
        const langData = translations[lang] || translations.ru;
        
        // Находим все элементы с data-translate атрибутом
        document.querySelectorAll('[data-translate]').forEach(element => {
            const key = element.getAttribute('data-translate');
            const text = langData[key];
            
            if (text) {
                if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                    element.placeholder = text;
                } else {
                    element.textContent = text;
                }
            }
        });
        
        // Обновляем placeholder для input с data-translate-placeholder
        document.querySelectorAll('[data-translate-placeholder]').forEach(element => {
            const key = element.getAttribute('data-translate-placeholder');
            const text = langData[key];
            if (text) {
                element.placeholder = text;
            }
        });
    }
    
    // Обновление заголовка страницы
    updatePageTitle() {
        const lang = this.currentLang;
        const path = window.location.pathname;
        
        if (path.includes('profile.html')) {
            document.title = lang === 'en' ? 'Profile - FLOWI VPN' : 'Профиль - ФЛОУИ VPN';
        } else if (path.includes('settings.html')) {
            document.title = lang === 'en' ? 'Settings - FLOWI VPN' : 'Настройки - ФЛОУИ VPN';
        } else {
            document.title = lang === 'en' ? 'FLOWI VPN - PUBG Mobile' : 'ФЛОУИ VPN - PUBG Mobile';
        }
    }
    
    // Настройка переключателя языка
    setupLanguageSwitcher() {
        const selector = document.querySelector('select[data-language-selector]');
        if (selector) {
            selector.value = this.currentLang;
            selector.addEventListener('change', (e) => {
                this.setLanguage(e.target.value);
            });
        }
    }
    
    // Обновление селектора языка
    updateLanguageSelector() {
        const selector = document.querySelector('select[data-language-selector]');
        if (selector) {
            selector.value = this.currentLang;
            
            // Обновляем опции
            const options = selector.querySelectorAll('option');
            options.forEach(option => {
                option.textContent = option.value === 'ru' ? 'Русский' : 'English';
            });
        }
    }
    
    // Смена языка
    setLanguage(lang) {
        if (translations[lang]) {
            this.currentLang = lang;
            this.applyLanguage();
            
            // Показываем уведомление о смене языка
            this.showLanguageChangedNotification();
        }
    }
    
    // Уведомление о смене языка
    showLanguageChangedNotification() {
        const lang = this.currentLang;
        const message = lang === 'en' 
            ? 'Language changed to English' 
            : 'Язык изменен на русский';
        
        // Проверяем, нет ли уже уведомления
        if (document.querySelector('.language-notification')) {
            return;
        }
        
        // Создаем временное уведомление
        const notification = document.createElement('div');
        notification.className = 'language-notification';
        notification.innerHTML = `
            <i class="fas fa-language"></i>
            <span>${message}</span>
        `;
        
        document.body.appendChild(notification);
        
        // Анимация появления
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        // Удаление через 3 секунды
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    }
    
    // Получение перевода по ключу
    t(key) {
        const lang = this.currentLang;
        return translations[lang]?.[key] || translations.ru[key] || key;
    }
}

// Инициализация менеджера языка при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    if (!window.languageManager) {
        window.languageManager = new LanguageManager();
    }
});

// Экспортируем глобальный менеджер
window.LanguageManager = LanguageManager;