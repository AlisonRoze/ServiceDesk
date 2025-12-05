"""
Скрипт для создания пользователя с ролью "Сотрудник АХО"
Использование:
    Вариант 1 (рекомендуется):
    python manage.py shell
    >>> exec(open('../Scripts/create_aho_user.py', encoding='utf-8').read())
    
    Вариант 2:
    python manage.py shell < Scripts/create_aho_user.py
    
    Вариант 3 (скопируйте и вставьте код ниже в Django shell):
"""

from back.models import Office, User
from django.contrib.auth.hashers import make_password

# Получаем или создаем офис (можно использовать существующий)
office, created = Office.objects.get_or_create(
    name='Отдел АХО',
    defaults={
        'region': 'Центральный',
        'city': 'Москва',
        'address': 'ул. Примерная, д. 1',
        'level': 1,
    }
)

# Создаем пользователя с ролью "Сотрудник АХО"
aho_user, created = User.objects.get_or_create(
    email='aho@example.com',
    defaults={
        'username': 'aho_user',
        'first_name': 'Алексей',
        'last_name': 'АХО',
        'middle_name': 'Сергеевич',
        'position': 'Сотрудник АХО',
        'role': 'Сотрудник АХО',  # Важно: роль должна содержать "АХО"
        'desk_number': 'АХО-1',
        'office': office,
        'supervisor': None,
        'password': make_password('aho123456'),  # Пароль по умолчанию
    }
)

if created:
    print(f"✓ Пользователь с ролью 'Сотрудник АХО' успешно создан!")
    print(f"  Email: {aho_user.email}")
    print(f"  Пароль: aho123456")
    print(f"  ФИО: {aho_user.last_name} {aho_user.first_name} {aho_user.middle_name}")
    print(f"  Роль: {aho_user.role}")
else:
    print(f"✓ Пользователь с email {aho_user.email} уже существует.")
    print(f"  Роль: {aho_user.role}")
    # Обновляем роль, если она не соответствует
    if 'АХО' not in aho_user.role:
        aho_user.role = 'Сотрудник АХО'
        aho_user.save()
        print(f"  Роль обновлена на: {aho_user.role}")

