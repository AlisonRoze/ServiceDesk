from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.conf import settings
import json
import os
from .models import User, Request, TypeOfFailure, Status, Office, Table, Comment, Notification


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

        # Формирование URL аватара
        avatar_url = None
        if user.avatar:
            avatar_url = request.build_absolute_uri(user.avatar.url)

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
                'birthDate': birth_date_str,
                'avatarUrl': avatar_url
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

        # Формирование URL аватара
        avatar_url = None
        if user.avatar:
            avatar_url = request.build_absolute_uri(user.avatar.url)

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
                'birthDate': birth_date_str,
                'avatarUrl': avatar_url
            }
        }

        return JsonResponse(response_data)

    except Exception as e:
        return JsonResponse(
            {'error': 'Ошибка сервера'},
            status=500
        )


@csrf_exempt
@require_http_methods(["POST"])
def upload_avatar(request, user_id):
    """API endpoint для загрузки аватара пользователя"""
    try:
        # Поиск пользователя по ID
        try:
            user = User.objects.get(id_user=user_id)
        except User.DoesNotExist:
            return JsonResponse(
                {'error': 'Пользователь не найден'},
                status=404
            )

        # Проверка наличия файла в запросе
        if 'avatar' not in request.FILES:
            return JsonResponse(
                {'error': 'Файл не был загружен'},
                status=400
            )

        avatar_file = request.FILES['avatar']

        # Проверка типа файла
        if not avatar_file.content_type.startswith('image/'):
            return JsonResponse(
                {'error': 'Файл должен быть изображением'},
                status=400
            )

        # Проверка размера файла (максимум 5MB)
        if avatar_file.size > 5 * 1024 * 1024:
            return JsonResponse(
                {'error': 'Размер файла не должен превышать 5MB'},
                status=400
            )

        # Удаляем старый аватар, если он существует
        if user.avatar:
            old_avatar_path = user.avatar.path
            if os.path.exists(old_avatar_path):
                try:
                    os.remove(old_avatar_path)
                except Exception:
                    pass  # Игнорируем ошибки при удалении старого файла

        # Сохраняем новый аватар
        user.avatar = avatar_file
        user.save()

        # Формируем URL аватара
        avatar_url = request.build_absolute_uri(user.avatar.url) if user.avatar else None

        return JsonResponse({
            'success': True,
            'message': 'Аватар успешно загружен',
            'avatarUrl': avatar_url
        })

    except Exception as e:
        return JsonResponse(
            {'error': f'Ошибка сервера: {str(e)}'},
            status=500
        )


# Маппинг типов поломок с фронтенда на бэкенд
ISSUE_TYPE_MAPPING = {
    'access': 'Доступ',
    'hardware': 'Оборудование',
    'software': 'ПО',
    'network': 'Сеть',
    'furniture': 'Мебель',
    'other': 'Другое',
}

# Маппинг приоритетов с фронтенда на бэкенд
PRIORITY_MAPPING = {
    'low': 'Низкая',
    'medium': 'Средняя',
    'high': 'Высокая',
    'urgent': 'Критическая',
}

# Обратный маппинг приоритетов (из БД на фронтенд)
PRIORITY_REVERSE_MAPPING = {
    'Низкая': 'low',
    'Средняя': 'medium',
    'Высокая': 'high',
    'Критическая': 'urgent',
}

# Обратный маппинг типов поломок (из БД на фронтенд)
ISSUE_TYPE_REVERSE_MAPPING = {
    'Доступ': 'access',
    'Оборудование': 'hardware',
    'ПО': 'software',
    'Сеть': 'network',
    'Мебель': 'furniture',
    'Другое': 'other',
}

# Маппинг статусов из БД на фронтенд
STATUS_MAPPING = {
    'Новая': 'new',
    'На доработке': 'revision',
    'В работе': 'in_progress',
    'Выполнена': 'completed',
    'Выполненные': 'completed',
}


@csrf_exempt
@require_http_methods(["POST"])
def create_request(request):
    """API endpoint для создания заявки"""
    try:
        # Получаем user_id из запроса (FormData)
        user_id = request.POST.get('user_id')
        if not user_id:
            return JsonResponse(
                {'error': 'ID пользователя обязателен'},
                status=400
            )

        try:
            user_id = int(user_id)
        except (ValueError, TypeError):
            return JsonResponse(
                {'error': 'Неверный формат ID пользователя'},
                status=400
            )

        # Поиск пользователя
        try:
            user = User.objects.get(id_user=user_id)
        except User.DoesNotExist:
            return JsonResponse(
                {'error': 'Пользователь не найден'},
                status=404
            )

        # Получаем данные из формы (FormData)
        issue_type_key = request.POST.get('issueType')
        priority_key = request.POST.get('priority')
        description = request.POST.get('problemDescription')
        office_location = request.POST.get('locationDescription')
        employee_location = request.POST.get('employeeLocation', '')

        # Валидация обязательных полей
        if not issue_type_key or not priority_key or not description or not office_location:
            return JsonResponse(
                {'error': 'Заполните все обязательные поля'},
                status=400
            )

        # Получаем или создаем тип поломки
        issue_type_name = ISSUE_TYPE_MAPPING.get(issue_type_key, 'Другое')
        failure_type, created = TypeOfFailure.objects.get_or_create(
            name=issue_type_name,
            defaults={'description': f'Тип поломки: {issue_type_name}'}
        )

        # Получаем или создаем статус "Новая"
        status, created = Status.objects.get_or_create(
            name='Новая',
            defaults={}
        )

        # Получаем или создаем запись в таблице затрат (по умолчанию)
        expense, created = Table.objects.get_or_create(
            expense_name='Заявка',
            defaults={'amount': 0}
        )

        # Используем офис пользователя
        office_address = user.office
        if not office_address:
            return JsonResponse(
                {'error': 'У пользователя не указан офис'},
                status=400
            )

        # Маппинг приоритета
        urgency = PRIORITY_MAPPING.get(priority_key, 'Средняя')

        # Создаем заявку
        new_request = Request.objects.create(
            user=user,
            failure_type=failure_type,
            urgency=urgency,
            description=description,
            office_address=office_address,
            office_location=office_location,
            employee_location=employee_location or '',
            expense=expense,
            status=status
        )

        # Обработка загрузки изображений
        if 'attachments' in request.FILES:
            files = request.FILES.getlist('attachments')
            # Сохраняем первое изображение как основное вложение
            if files:
                new_request.attachments = files[0]
                new_request.save()

        # Создаем уведомление о создании заявки
        Notification.objects.create(
            user=user,
            request=new_request,
            message=f'Ваша заявка #{new_request.id_request} создана.'
        )

        return JsonResponse({
            'success': True,
            'message': 'Заявка успешно создана',
            'request': {
                'id': new_request.id_request,
                'status': status.name,
                'created_at': new_request.created_at.isoformat()
            }
        })

    except json.JSONDecodeError:
        return JsonResponse(
            {'error': 'Неверный формат данных'},
            status=400
        )
    except Exception as e:
        return JsonResponse(
            {'error': f'Ошибка сервера: {str(e)}'},
            status=500
        )


# Обратный маппинг приоритетов (из БД на фронтенд)
PRIORITY_REVERSE_MAPPING = {
    'Низкая': 'low',
    'Средняя': 'medium',
    'Высокая': 'high',
    'Критическая': 'urgent',
}

# Обратный маппинг типов поломок (из БД на фронтенд)
ISSUE_TYPE_REVERSE_MAPPING = {
    'Доступ': 'access',
    'Оборудование': 'hardware',
    'ПО': 'software',
    'Сеть': 'network',
    'Мебель': 'furniture',
    'Другое': 'other',
}

# Маппинг статусов из БД на фронтенд
STATUS_MAPPING = {
    'Новая': 'new',
    'На доработке': 'revision',
    'В работе': 'in_progress',
    'Выполнена': 'completed',
    'Выполненные': 'completed',
}


@csrf_exempt
@require_http_methods(["GET"])
def get_requests(request, user_id):
    """API endpoint для получения списка заявок пользователя"""
    try:
        # Поиск пользователя
        try:
            user = User.objects.get(id_user=user_id)
        except User.DoesNotExist:
            return JsonResponse(
                {'error': 'Пользователь не найден'},
                status=404
            )

        # Получаем заявки пользователя
        requests = Request.objects.filter(user=user).select_related(
            'failure_type', 'status', 'office_address'
        ).order_by('-created_at')

        # Формируем список заявок
        requests_list = []
        for req in requests:
            # Маппинг приоритета
            priority = PRIORITY_REVERSE_MAPPING.get(req.urgency, 'medium')
            
            # Маппинг типа поломки
            issue_type = ISSUE_TYPE_REVERSE_MAPPING.get(req.failure_type.name, 'other')
            
            # Маппинг статуса
            status_key = STATUS_MAPPING.get(req.status.name, 'new')
            
            # Формируем location (объединяем office_location и employee_location)
            location_parts = []
            if req.office_location:
                location_parts.append(req.office_location)
            if req.employee_location:
                location_parts.append(req.employee_location)
            location = ', '.join(location_parts) if location_parts else 'Не указано'

            requests_list.append({
                'id': str(req.id_request),
                'priority': priority,
                'location': location,
                'issueType': issue_type,
                'status': status_key,
                'createdAt': req.created_at.isoformat(),
            })

        return JsonResponse({
            'success': True,
            'requests': requests_list
        })

    except Exception as e:
        return JsonResponse(
            {'error': f'Ошибка сервера: {str(e)}'},
            status=500
        )


@csrf_exempt
@require_http_methods(["GET"])
def get_notifications(request, user_id):
    """API endpoint для получения уведомлений пользователя"""
    try:
        # Поиск пользователя
        try:
            user = User.objects.get(id_user=user_id)
        except User.DoesNotExist:
            return JsonResponse(
                {'error': 'Пользователь не найден'},
                status=404
            )

        # Получаем уведомления из БД
        notifications = Notification.objects.filter(user=user).select_related('request').order_by('-created_at')
        
        notifications_list = []
        for notif in notifications:
            notifications_list.append({
                'id': f'n_{notif.id_notification}',
                'notificationId': notif.id_notification,
                'text': notif.message,
                'createdAt': notif.created_at.isoformat(),
                'isRead': notif.is_read,
            })

        # Подсчитываем непрочитанные уведомления
        unread_count = Notification.objects.filter(user=user, is_read=False).count()

        return JsonResponse({
            'success': True,
            'notifications': notifications_list,
            'unreadCount': unread_count
        })

    except Exception as e:
        return JsonResponse(
            {'error': f'Ошибка сервера: {str(e)}'},
            status=500
        )


@csrf_exempt
@require_http_methods(["PATCH"])
def mark_notification_read(request, notification_id):
    """API endpoint для пометки уведомления как прочитанного"""
    try:
        try:
            data = json.loads(request.body)
        except json.JSONDecodeError:
            return JsonResponse(
                {'error': 'Неверный формат данных'},
                status=400
            )

        user_id = data.get('user_id')
        if not user_id:
            return JsonResponse(
                {'error': 'ID пользователя обязателен'},
                status=400
            )

        try:
            notification = Notification.objects.get(id_notification=notification_id)
        except Notification.DoesNotExist:
            return JsonResponse(
                {'error': 'Уведомление не найдено'},
                status=404
            )

        if notification.user.id_user != int(user_id):
            return JsonResponse(
                {'error': 'Нет доступа к этому уведомлению'},
                status=403
            )

        if not notification.is_read:
            notification.is_read = True
            notification.save(update_fields=['is_read'])

        return JsonResponse({
            'success': True,
            'notification': {
                'id': f'n_{notification.id_notification}',
                'notificationId': notification.id_notification,
                'isRead': notification.is_read
            }
        })
    except Exception as e:
        return JsonResponse(
            {'error': f'Ошибка сервера: {str(e)}'},
            status=500
        )


# Обратный маппинг статусов (из фронтенда на БД)
STATUS_REVERSE_MAPPING = {
    'new': 'Новая',
    'revision': 'На доработке',
    'in_progress': 'В работе',
    'completed': 'Выполнена',
}


@csrf_exempt
@require_http_methods(["PATCH", "PUT"])
def update_request_status(request, request_id):
    """API endpoint для обновления статуса заявки"""
    try:
        # Получаем user_id из запроса
        try:
            json_data = json.loads(request.body)
            user_id = json_data.get('user_id')
            new_status_key = json_data.get('status')
        except json.JSONDecodeError:
            return JsonResponse(
                {'error': 'Неверный формат данных'},
                status=400
            )

        if not user_id or not new_status_key:
            return JsonResponse(
                {'error': 'ID пользователя и новый статус обязательны'},
                status=400
            )

        # Поиск заявки
        try:
            req = Request.objects.get(id_request=request_id)
        except Request.DoesNotExist:
            return JsonResponse(
                {'error': 'Заявка не найдена'},
                status=404
            )

        # Проверяем, что пользователь является владельцем заявки
        if req.user.id_user != int(user_id):
            return JsonResponse(
                {'error': 'Нет доступа к этой заявке'},
                status=403
            )

        # Получаем старый статус для сравнения
        old_status = req.status.name

        # Маппинг статуса из фронтенда на БД
        new_status_name = STATUS_REVERSE_MAPPING.get(new_status_key)
        if not new_status_name:
            return JsonResponse(
                {'error': 'Неверный статус'},
                status=400
            )

        # Получаем или создаем новый статус
        new_status, created = Status.objects.get_or_create(
            name=new_status_name,
            defaults={}
        )

        # Обновляем статус заявки
        req.status = new_status
        req.save()

        # Создаем уведомление, если статус изменился
        if old_status != new_status_name:
            # Формируем текст уведомления
            status_messages = {
                'Выполнена': f'Ваша заявка #{req.id_request} выполнена!',
                'На доработке': f'Ваша заявка #{req.id_request} отправлена на доработку.',
                'В работе': f'Ваша заявка #{req.id_request} взята в работу.',
                'Новая': f'Ваша заявка #{req.id_request} создана.',
            }
            
            message = status_messages.get(new_status_name, f'Статус заявки #{req.id_request} изменен на "{new_status_name}"')
            
            # Создаем уведомление для владельца заявки
            Notification.objects.create(
                user=req.user,
                request=req,
                message=message
            )

        return JsonResponse({
            'success': True,
            'message': 'Статус заявки успешно обновлен',
            'request': {
                'id': req.id_request,
                'status': new_status_key,
                'statusName': new_status_name
            }
        })

    except Exception as e:
        return JsonResponse(
            {'error': f'Ошибка сервера: {str(e)}'},
            status=500
        )
