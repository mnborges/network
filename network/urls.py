
from django.urls import path, re_path
from django.views.generic import TemplateView
from . import views

urlpatterns = [
    # Index page displays all posts + postform depending on whether user is authenticated. Renders Virtual DOM with React
    path("", TemplateView.as_view(
        template_name="network/index.html"), name="index"),

    # Login (display credentials form), logout and register
    path("login", views.login_view, name="login"),
    path("logout", views.logout_view, name="logout"),
    path("register", views.register, name="register"),

    # Almost all paths below render DOM with React (listingview does not)
    path("following", views.following, name="following"),
    path("<int:post_id>", views.viewpost, name="viewpost"),
    # regex to avoid matching api path
    re_path(r"^(?P<username>\w+(?<!api))$", views.profile, name="profile"),
    # Following and followers list page -- using regex to allow only /following or /followers and avoid media path
    re_path(r"^(?P<username>\w+(?<!api))\/(?P<list>follow(ers|ing))$",
            views.listingview, name="listing"),


    # API route
    path("api/update", views.update, name="update"),
    path("api/<str:filter>", views.send_data, name="send"),
    path("api", views.post, name="post"),

]
