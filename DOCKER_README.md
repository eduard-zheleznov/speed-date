# Speed Date - Сервис видео-знакомств

## Быстрый старт с Docker

### Требования
- Docker 20.10+
- Docker Compose 2.0+
- 2GB RAM минимум
- 10GB свободного места

### Установка

1. **Клонируйте репозиторий:**
```bash
git clone <repository-url>
cd speed-date
```

2. **Создайте файл окружения:**
```bash
cp .env.example .env
```

3. **Отредактируйте .env файл:**
```bash
nano .env
```

Обязательные настройки:
- `JWT_SECRET` - секретный ключ для токенов (сгенерируйте случайную строку)
- `REACT_APP_BACKEND_URL` - URL вашего домена (например, https://speed-date.ru)
- `SMTP_*` - настройки почты для регистрации

4. **Запустите приложение:**
```bash
docker-compose up -d
```

5. **Проверьте статус:**
```bash
docker-compose ps
```

### Доступ

- **Frontend:** http://localhost (или ваш домен)
- **Backend API:** http://localhost/api/
- **MongoDB:** localhost:27017

### Управление

```bash
# Остановить все сервисы
docker-compose down

# Перезапустить
docker-compose restart

# Посмотреть логи
docker-compose logs -f

# Логи конкретного сервиса
docker-compose logs -f backend
docker-compose logs -f frontend

# Пересобрать после изменений
docker-compose up -d --build
```

### Структура проекта

```
/
├── docker-compose.yml      # Конфигурация Docker
├── Dockerfile.backend      # Сборка backend
├── Dockerfile.frontend     # Сборка frontend
├── nginx.conf              # Конфигурация Nginx
├── .env.example            # Пример переменных окружения
├── backend/                # FastAPI backend
│   ├── server.py
│   ├── routers/
│   ├── models.py
│   └── requirements.txt
└── frontend/               # React frontend
    ├── src/
    ├── public/
    └── package.json
```

### Продакшен на Yandex Cloud

1. Создайте VM с Ubuntu 22.04
2. Установите Docker и Docker Compose
3. Настройте домен (A-запись на IP сервера)
4. Добавьте SSL с Let's Encrypt (certbot)
5. Обновите `REACT_APP_BACKEND_URL` в .env

### Тестовые аккаунты

| Роль | Email | Пароль |
|------|-------|--------|
| Админ | admin@test.com | admin123 |
| Пользователь | bob@test.com | test123 |
| Пользователь | alice@test.com | test123 |

### Поддержка

При возникновении проблем проверьте:
1. `docker-compose logs` для ошибок
2. Доступность MongoDB: `docker exec speeddate-mongodb mongosh`
3. Статус backend: `curl http://localhost:8001/api/`
