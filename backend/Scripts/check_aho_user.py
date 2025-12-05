# -*- coding: utf-8 -*-
"""
Скрипт для проверки пользователя с ролью "Сотрудник АХО"
Запустите: python manage.py shell < Scripts/check_aho_user.py
или скопируйте код в Django shell
"""

import os
import django

# Настройка Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from back.models import User
from django.contrib.auth.hashers import check_password

try:
    user = User.objects.get(email='aho@example.com')
    print("=" * 50)
    print("Пользователь найден!")
    print("=" * 50)
    print(f"Email: {user.email}")
    print(f"ФИО: {user.last_name} {user.first_name} {user.middle_name}")
    print(f"Роль: {user.role}")
    print(f"Должность: {user.position}")
    print(f"Пароль установлен: {'Да' if user.password else 'НЕТ!'}")
    
    if user.password:
        password_correct = check_password('aho123456', user.password)
        print(f"Проверка пароля 'aho123456': {'Правильный' if password_correct else 'НЕПРАВИЛЬНЫЙ!'}")
    else:
        print("ВНИМАНИЕ: Пароль не установлен! Пользователь не сможет войти.")
        print("Установите пароль командой:")
        print("  from django.contrib.auth.hashers import make_password")
        print("  user.password = make_password('aho123456')")
        print("  user.save()")
    
    print("=" * 50)
    
except User.DoesNotExist:
    print("=" * 50)
    print("ОШИБКА: Пользователь с email 'aho@example.com' не найден!")
    print("=" * 50)
    print("Создайте пользователя, выполнив:")
    print("  exec(open('../Scripts/create_aho_user.py', encoding='utf-8').read())")
    print("=" * 50)
except Exception as e:
    print(f"Ошибка: {e}")

