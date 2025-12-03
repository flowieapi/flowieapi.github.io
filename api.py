from flask import Flask, jsonify, request
from flask_cors import CORS
import json
import os
from datetime import datetime, timedelta

app = Flask(__name__)
CORS(app)

# Загрузка данных
def load_data(filename):
    if os.path.exists(filename):
        with open(filename, 'r', encoding='utf-8') as f:
            return json.load(f)
    return {}

def save_data(filename, data):
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

# API endpoints
@app.route('/api/tariffs', methods=['GET'])
def get_tariffs():
    """Получение списка тарифов"""
    tariffs = load_data('tariffs.json')
    return jsonify(tariffs)

@app.route('/api/tariffs/<tariff_id>', methods=['GET'])
def get_tariff(tariff_id):
    """Получение конкретного тарифа"""
    tariffs = load_data('tariffs.json')
    if tariff_id in tariffs:
        return jsonify(tariffs[tariff_id])
    return jsonify({'error': 'Тариф не найден'}), 404

@app.route('/api/tariffs', methods=['POST'])
def create_tariff():
    """Создание нового тарифа (админ)"""
    data = request.json
    tariffs = load_data('tariffs.json')
    
    # Генерация ID
    tariff_id = str(len(tariffs) + 1)
    tariffs[tariff_id] = data
    
    save_data('tariffs.json', tariffs)
    return jsonify({'id': tariff_id, 'message': 'Тариф создан'})

@app.route('/api/subscriptions', methods=['GET'])
def get_subscriptions():
    """Получение подписок пользователя"""
    user_id = request.args.get('user_id')
    if not user_id:
        return jsonify({'error': 'Не указан user_id'}), 400
    
    subscriptions = load_data('subscriptions.json')
    user_subs = [sub for sub in subscriptions.values() if sub.get('user_id') == user_id]
    
    # Проверяем статус
    for sub in user_subs:
        expires = datetime.fromisoformat(sub['expires_at'])
        sub['status'] = 'active' if expires > datetime.now() else 'expired'
    
    return jsonify(user_subs)

@app.route('/api/subscriptions', methods=['POST'])
def create_subscription():
    """Создание новой подписки"""
    data = request.json
    
    # Валидация
    required_fields = ['user_id', 'tariff_id', 'payment_method']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'Отсутствует поле: {field}'}), 400
    
    # Получаем информацию о тарифе
    tariffs = load_data('tariffs.json')
    tariff = tariffs.get(data['tariff_id'])
    
    if not tariff:
        return jsonify({'error': 'Тариф не найден'}), 404
    
    # Создаем подписку
    subscriptions = load_data('subscriptions.json')
    subscription_id = str(len(subscriptions) + 1)
    
    subscription = {
        'id': subscription_id,
        'user_id': data['user_id'],
        'tariff_id': data['tariff_id'],
        'tariff_name': tariff['name'],
        'price': tariff['price'],
        'created_at': datetime.now().isoformat(),
        'expires_at': (datetime.now() + timedelta(days=tariff['days'])).isoformat(),
        'payment_method': data['payment_method'],
        'status': 'active'
    }
    
    subscriptions[subscription_id] = subscription
    save_data('subscriptions.json', subscriptions)
    
    # Логируем оплату
    payments = load_data('payments.json')
    payment_id = str(len(payments) + 1)
    
    payments[payment_id] = {
        'id': payment_id,
        'user_id': data['user_id'],
        'subscription_id': subscription_id,
        'amount': tariff['price'],
        'method': data['payment_method'],
        'status': 'success',
        'timestamp': datetime.now().isoformat()
    }
    save_data('payments.json', payments)
    
    return jsonify({
        'success': True,
        'subscription_id': subscription_id,
        'message': 'Подписка активирована'
    })

@app.route('/api/payment/create', methods=['POST'])
def create_payment():
    """Создание платежа"""
    data = request.json
    
    # Здесь должна быть интеграция с платежной системой
    # Пока возвращаем тестовый ответ
    return jsonify({
        'success': True,
        'payment_id': 'test_payment_123',
        'amount': data.get('amount', 0),
        'status': 'pending'
    })

@app.route('/api/payment/verify', methods=['POST'])
def verify_payment():
    """Проверка платежа"""
    payment_id = request.json.get('payment_id')
    
    # Здесь должна быть проверка в платежной системе
    # Пока возвращаем успешный ответ
    return jsonify({
        'success': True,
        'payment_id': payment_id,
        'status': 'success'
    })

@app.route('/api/user/<user_id>', methods=['GET'])
def get_user(user_id):
    """Получение информации о пользователе"""
    users = load_data('users.json')
    user = users.get(user_id, {})
    
    return jsonify({
        'id': user_id,
        'balance': user.get('balance', 0),
        'subscriptions_count': user.get('subscriptions_count', 0),
        'total_spent': user.get('total_spent', 0)
    })

if __name__ == '__main__':
    # Создаем тестовые файлы данных, если их нет
    if not os.path.exists('tariffs.json'):
        test_tariffs = {
            "1": {
                "name": "Месячный",
                "price": 299,
                "days": 30,
                "emoji": "🌙",
                "features": ["Все сервера", "Базовая поддержка", "Смена сервера 1 раз в день"]
            },
            "2": {
                "name": "Оптимальный",
                "price": 799,
                "days": 90,
                "emoji": "⭐",
                "features": ["Приоритетная поддержка", "+10% к скорости", "Смена сервера 3 раза в день"],
                "popular": True
            },
            "3": {
                "name": "Годовой VIP",
                "price": 2999,
                "days": 365,
                "emoji": "👑",
                "features": ["VIP поддержка 24/7", "+25% к скорости", "Неограниченная смена сервера"]
            }
        }
        save_data('tariffs.json', test_tariffs)
    
    # Запускаем сервер
    app.run(host='0.0.0.0', port=5000, debug=True)