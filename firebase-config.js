// Firebase конфигурация
const firebaseConfig = {
    apiKey: "AIzaSyDG7SJfMbSiIbTkBxV6BBoPAsTAKQsLPv8",
    authDomain: "flowie-vpn.firebaseapp.com",
    projectId: "flowie-vpn",
    storageBucket: "flowie-vpn.firebasestorage.app",
    messagingSenderId: "55860525820",
    appId: "1:55860525820:web:75bd65ad5e04064b313579"
};

// Инициализация Firebase
try {
    firebase.initializeApp(firebaseConfig);
    console.log("Firebase инициализирован");
} catch (error) {
    console.error("Ошибка инициализации Firebase:", error);
}

// Инициализация сервисов
const db = firebase.firestore();
const auth = firebase.auth();

// Анонимная аутентификация
async function initializeFirebase() {
    try {
        await auth.signInAnonymously();
        console.log('Firebase аутентифицирован анонимно');
        return true;
    } catch (error) {
        console.error('Firebase auth error:', error);
        return false;
    }
}

// Инициализируем при загрузке
document.addEventListener('DOMContentLoaded', function() {
    initializeFirebase();
});