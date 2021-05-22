from django.contrib import admin
from .models import *

class UserAdmin(admin.ModelAdmin):
    list_display = ("username","email", "is_staff")
    filter_horizontal = ("following",)

class PostAdmin(admin.ModelAdmin):
    list_display = ("author","content", "timestamp")
    filter_horizontal = ("replies",)

admin.site.register(User, UserAdmin)
admin.site.register(Post, PostAdmin)