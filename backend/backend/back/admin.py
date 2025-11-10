from django.contrib import admin
from .models import User, Office, Request, Status, TypeOfFailure, Comment, Table, Load


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('id_user', 'email', 'username', 'last_name', 'first_name', 'position', 'office')
    list_filter = ('role', 'office', 'position')
    search_fields = ('email', 'username', 'last_name', 'first_name')
    fieldsets = (
        ('Учетные данные', {
            'fields': ('email', 'username', 'password')
        }),
        ('Личная информация', {
            'fields': ('last_name', 'first_name', 'middle_name', 'position', 'role', 'desk_number', 'birth_date')
        }),
        ('Организационная информация', {
            'fields': ('office', 'supervisor')
        }),
    )
    
    def save_model(self, request, obj, form, change):
        # Если пароль был изменен, хешируем его
        if 'password' in form.changed_data:
            obj.set_password(obj.password)
        super().save_model(request, obj, form, change)


@admin.register(Office)
class OfficeAdmin(admin.ModelAdmin):
    list_display = ('id_office', 'name', 'city', 'region', 'level')
    list_filter = ('region', 'city', 'level')
    search_fields = ('name', 'city', 'address')


@admin.register(Request)
class RequestAdmin(admin.ModelAdmin):
    list_display = ('id_request', 'user', 'failure_type', 'urgency', 'status', 'created_at')
    list_filter = ('status', 'urgency', 'created_at')
    search_fields = ('description', 'user__last_name', 'user__first_name')


@admin.register(Status)
class StatusAdmin(admin.ModelAdmin):
    list_display = ('id_status', 'name')


@admin.register(TypeOfFailure)
class TypeOfFailureAdmin(admin.ModelAdmin):
    list_display = ('id_type', 'name', 'description')


@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ('id_comment', 'content', 'created_at')


@admin.register(Table)
class TableAdmin(admin.ModelAdmin):
    list_display = ('id_table', 'expense_name', 'amount', 'created_at')


@admin.register(Load)
class LoadAdmin(admin.ModelAdmin):
    list_display = ('id_load', 'staff', 'current_tasks_count', 'urgency')
