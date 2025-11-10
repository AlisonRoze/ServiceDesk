from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
import json
from .models import User


@csrf_exempt
@require_http_methods(["POST"])
def login(request):
    """API endpoint для аутентификации пользователя"""
    try:
        data = json.loads(request.body)
        email = data.get('email')
        password = data.get('password')

        # Проверка входных данных
        if not email or not password:
            return JsonResponse(
                {'error': 'Email и пароль обязательны'},
                status=400
            )

        # Поиск пользователя по email
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return JsonResponse(
                {'error': 'Неверный email или пароль'},
                status=401
            )

        # Проверка наличия пароля у пользователя
        if not user.password:
            return JsonResponse(
                {'error': 'У пользователя не установлен пароль. Обратитесь к администратору.'},
                status=401
            )

        # Проверка пароля
        if not user.check_password(password):
            return JsonResponse(
                {'error': 'Неверный email или пароль'},
                status=401
            )

        # Форматирование даты рождения
        birth_date_str = ''
        if user.birth_date:
            birth_date_str = user.birth_date.strftime('%d.%m.%Y')

        # Формирование ответа с данными пользователя
        response_data = {
            'success': True,
            'message': 'Авторизация успешна',
            'user': {
                'id': user.id_user,
                'email': user.email or '',
                'fullName': f"{user.last_name} {user.first_name} {user.middle_name}".strip(),
                'city': user.office.city if user.office else '',
                'officeAddress': user.office.address if user.office else '',
                'position': user.position or '',
                'deskNumber': user.desk_number or '',
                'birthDate': birth_date_str
            }
        }

        return JsonResponse(response_data)

    except json.JSONDecodeError:
        return JsonResponse(
            {'error': 'Неверный формат данных'},
            status=400
        )
    except Exception as e:
        return JsonResponse(
            {'error': 'Ошибка сервера'},
            status=500
        )


@csrf_exempt
@require_http_methods(["GET"])
def get_profile(request, user_id):
    """API endpoint для получения профиля пользователя"""
    try:
        # Поиск пользователя по ID
        try:
            user = User.objects.get(id_user=user_id)
        except User.DoesNotExist:
            return JsonResponse(
                {'error': 'Пользователь не найден'},
                status=404
            )

        # Форматирование даты рождения
        birth_date_str = ''
        if user.birth_date:
            birth_date_str = user.birth_date.strftime('%d.%m.%Y')

        # Формирование ответа с данными пользователя
        response_data = {
            'success': True,
            'user': {
                'id': user.id_user,
                'email': user.email or '',
                'fullName': f"{user.last_name} {user.first_name} {user.middle_name}".strip(),
                'city': user.office.city if user.office else '',
                'officeAddress': user.office.address if user.office else '',
                'position': user.position or '',
                'deskNumber': user.desk_number or '',
                'birthDate': birth_date_str
            }
        }

        return JsonResponse(response_data)

    except Exception as e:
        return JsonResponse(
            {'error': 'Ошибка сервера'},
            status=500
        )
