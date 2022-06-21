
from django.urls import path, re_path

from . import views

urlpatterns = [
    #Views
    path("", views.index, name="index"),
    path("login", views.login_view, name="login"),
    path("logout", views.logout_view, name="logout"),
    path("register", views.register, name="register"),

    #API route
    path("api/srv_test", views.srv_test, name="srv"),
    path("api/update", views.update, name="update"),
    path("api/<str:filter>", views.send_data, name="send"),
    path("api", views.post, name="post"),

    #Redirect page (JS) view
    path('<str:page>', views.page, name="page"),

    #Following and followers list
    path("<str:page>/<str:list>", views.listingview, name="listing"),
]
