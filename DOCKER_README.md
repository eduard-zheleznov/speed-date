# Speed Date - Сервис видео-знакомств

## Деплой на Timeweb Cloud App Platform

### Требования
- Аккаунт на [Timeweb Cloud](https://timeweb.cloud)
- Git-репозиторий с кодом (GitHub, GitLab, BitBucket или по URL)

### Структура файлов (в корне репозитория)
```
/
├── docker-compose.yml      # Конфигурация Docker Compose
├── Dockerfile.backend      # Сборка backend (FastAPI)
├── Dockerfile.frontend     # Сборка frontend (React + Nginx)
├── nginx.conf              # Конфигурация Nginx
├── .env.example            # Пример переменных окружения
├── backend/                # Код backend
└── frontend/               # Код frontend
```

### Шаги деплоя на Timeweb Cloud

1. **Создайте файл .env в репозитории:**
   ```bash
   cp .env.example .env
   ```

2. **Заполните обязательные переменные в .env:**
   - `JWT_SECRET` - секретный ключ (сгенерируйте: `openssl rand -hex 32`)
   - `REACT_APP_BACKEND_URL` - URL вашего приложения
   - `SMTP_*` - настройки почты

3. **В панели Timeweb Cloud:**
   - Перейдите в App Platform
   - Выберите "Docker" → "Docker Compose"
   - Подключите репозиторий
   - Выберите ветку и коммит
   - Выберите конфигурацию сервера (минимум 2 CPU, 4 GB RAM)
   - Добавьте переменные из .env в настройках
   - Нажмите "Запустить деплой"

### Сервисы

| Сервис | Порт | Описание |
|--------|------|----------|
| frontend | 3000 | React + Nginx (основной домен) |
| backend | 8001 | FastAPI API |
| mongodb | 27017 | База данных |

**Важно:** Frontend - первый сервис в docker-compose.yml, поэтому он получает проксирование на основной домен.

### Доступ после деплоя

- **Основной сайт:** https://ваш-домен.timeweb.cloud
- **API:** https://ваш-домен.timeweb.cloud/api/
- **Backend напрямую:** https://ваш-домен.timeweb.cloud:8001/api/

### Локальная разработка

```bash
# 1. Создайте .env
cp .env.example .env

# 2. Отредактируйте настройки
nano .env

# 3. Запустите
docker-compose up -d

# 4. Откройте в браузере
# Frontend: http://localhost:3000
# API: http://localhost:8001/api/
```

### Управление

```bash
# Остановить
docker-compose down

# Логи
docker-compose logs -f

# Логи конкретного сервиса
docker-compose logs -f backend

# Пересобрать
docker-compose up -d --build

# Статус
docker-compose ps
```

### Тестовые аккаунты

| Роль | Email | Пароль |
|------|-------|--------|
| Админ | admin@test.com | admin123 |
| Пользователь | bob@test.com | test123 |
| Пользователь | alice@test.com | test123 |

### Ограничения Timeweb Cloud

Согласно [документации](https://timeweb.cloud/docs/apps/deploying-with-docker-compose):

- ❌ Нельзя использовать порты 80 и 443 как хост-порты
- ❌ Нельзя использовать директиву `volumes`
- ❌ Нельзя использовать `privileged`, `devices`, `cap_add` и др.
- ✅ Первый сервис получает проксирование на основной домен

### Устранение проблем

1. **Ошибка сборки:** Проверьте логи в панели Timeweb Cloud
2. **502 Bad Gateway:** Подождите 1-2 минуты, сервисы запускаются
3. **Нет доступа к API:** Проверьте `REACT_APP_BACKEND_URL`
4. **Проблемы с MongoDB:** Проверьте healthcheck в логах
