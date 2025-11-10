from back.models import Office, User, Table, Status, TypeOfFailure, Comment, Request, Load

# Создаем офиса
office1 = Office.objects.create(
    name='Отдел продаж',
    region='Центральный',
    city='Москва',
    address='ул. Ленина, д. 1',
    level=1,
    supervisor=None
)

office2 = Office.objects.create(
    name='Технический отдел',
    region='Южный',
    city='Саратов',
    address='пр-т Мира, д. 10',
    level=2,
    supervisor=None
)

# Создаем пользователей
user1 = User.objects.create(
    first_name='Иван',
    last_name='Иванов',
    middle_name='Иванович',
    position='Менеджер',
    role='Руководитель',
    office=office1,
    supervisor=None
)

user2 = User.objects.create(
    first_name='Петр',
    last_name='Петров',
    middle_name='Петрович',
    position='Инженер',
    role='Исполнитель',
    office=office2,
    supervisor=user1
)

# Создаем таблицы затрат
table1 = Table.objects.create(
    expense_name='Ремонт оборудования',
    amount=15000.00
)

table2 = Table.objects.create(
    expense_name='Покупка материалов',
    amount=5000.00
)

# Создаем статусы
status1 = Status.objects.create(name='В работе')
status2 = Status.objects.create(name='Завершено')
status3 = Status.objects.create(name='Ожидание')

# Создаем типы неисправностей
failure_type1 = TypeOfFailure.objects.create(
    name='Механическая поломка',
    description='Поломка в механической части устройства'
)
failure_type2 = TypeOfFailure.objects.create(
    name='Электрическая неисправность',
    description='Проблемы с электропитанием или проводкой'
)

# Создаем комментарии
comment1 = Comment.objects.create(content='Провести проверку оборудования')
comment2 = Comment.objects.create(content='Ожидает подтверждения заказа')

# Создаем заявки
from datetime import datetime, timedelta

request1 = Request.objects.create(
    user=user1,
    failure_type=failure_type1,
    urgency='Высокая',
    description='Не работает принтер на первом этаже',
    office_address=office1,
    office_location='Этаж 2, каб. 5',
    employee_location='Рабочий стол 10',
    expense=table1,
    performer=user2,
    status=status1,
    due_time=(datetime.now() + timedelta(days=2)).strftime('%Y-%m-%d %H:%M:%S')
)

# Добавляем комментарии к заявке
request1.comments.add(comment1, comment2)

# Создаем еще одну заявку
request2 = Request.objects.create(
    user=user2,
    failure_type=failure_type2,
    urgency='Средняя',
    description='Не горит лампа в офисе',
    office_address=office2,
    office_location='Этаж 1, коридор',
    employee_location='Рабочий стол 3',
    expense=table2,
    performer=user2,
    status=status2,
    due_time=(datetime.now() + timedelta(days=5)).strftime('%Y-%m-%d %H:%M:%S')
)

# Создаем загрузки сотрудников
load1 = Load.objects.create(
    staff=user1,
    current_tasks_count=2,
    current_tasks='Обновление программного обеспечения, Проверка системы электроснабжения',
    urgency='Средняя'
)

load2 = Load.objects.create(
    staff=user2,
    current_tasks_count=1,
    current_tasks='Диагностика неисправности принтера',
    urgency='Высокая'
)

print("Все записи успешно созданы.")