
from django.urls import path, re_path

from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("login", views.login_view, name="login"),
    path("logout", views.logout_view, name="logout"),
    path("register", views.register, name="register"),
    #re_path(r"/.*", views.index, name='test'),

    #API routes
    path("follow/<str:filter>", views.follow, name="follow"),
    path("api", views.post, name="post"),
    path("api/<str:filter>", views.send_data, name="send")
]
