import json
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.views.decorators.csrf import csrf_exempt #remove if not in use
from django.db import IntegrityError
from django.http import JsonResponse #remove some if not in use
from django.shortcuts import HttpResponse, HttpResponseRedirect, render
from django.urls import reverse

from .models import *

def index(request):
    all = Post.objects.order_by("-timestamp").all()
    posts = [] 
    for elem in all: posts.append(elem.serialize())
    return render(request, "network/index.html")
    """
    return render(request, "network/index.html", {
        'posts': posts
    })
    """

def login_view(request):
    if request.method == "POST":

        # Attempt to sign user in
        username = request.POST["username"]
        password = request.POST["password"]
        user = authenticate(request, username=username, password=password)

        # Check if authentication successful
        if user is not None:
            login(request, user)
            return HttpResponseRedirect(reverse("index"))
        else:
            return render(request, "network/login.html", {
                "message": "Invalid username and/or password."
            })
    else:
        return render(request, "network/login.html")


def logout_view(request):
    logout(request)
    return HttpResponseRedirect(reverse("index"))


def register(request):
    if request.method == "POST":
        username = request.POST["username"]
        email = request.POST["email"]

        # Ensure password matches confirmation
        password = request.POST["password"]
        confirmation = request.POST["confirmation"]
        if password != confirmation:
            return render(request, "network/register.html", {
                "message": "Passwords must match."
            })

        # Attempt to create new user
        try:
            user = User.objects.create_user(username, email, password)
            user.save()
        except IntegrityError:
            return render(request, "network/register.html", {
                "message": "Username already taken."
            })
        login(request, user)
        return HttpResponseRedirect(reverse("index"))
    else:
        return render(request, "network/register.html")

@csrf_exempt
@login_required
def post(request):
    
    # Check valid request method
    if (request.method != "POST"):
        return JsonResponse({"error": "POST request required."}, status=405)

    # Get post data
    data = json.loads(request.body)
    try: 
        content =  data.get('post')
    except:
        return JsonResponse({"error": "New post data must contain 'post' indentifier. "}, status=400)
    if (data.get('parent') == None): 
        post = Post(author = request.user, content = content)
    else:
        try:
            post = Post.objects.get(pk=data.get('parent'))
        except:
            return JsonResponse({"error": "Invalid parent post."}, status=400)
        reply = Post(author = request.user, content = content)
        post.replies.add(reply)
        reply.save()
    post.save()
    
    return JsonResponse({"message": "Post created successfully."}, status=201)

def send_posts(request, filter):
    # get authenticated user
    if(request.user.is_authenticated):  user = User.objects.get(pk = request.user.id)
    # send posts according to filter...
    if filter == "all":
        posts = Post.objects.all()
    elif filter == "profile" and request.user.is_authenticated:
        posts = user.posts.all()
    elif filter == "following" and request.user.is_authenticated:
        posts = Post.objects.filter(author__in=user.following.all())
    elif filter[0] == '@' :
        username = filter[1:]
        if User.objects.filter(username=username):
            username = User.objects.filter(username=username).first()
            posts = Post.objects.filter(author=username)
        else: return JsonResponse({"error": "User not found."}, status=400)
    else:
        return JsonResponse({"error": "Not available."}, status=400)
    
    # ...in reverse chronologial order
    posts = posts.order_by("-timestamp").all()
    return JsonResponse([elem.serialize() for elem in posts], safe=False)

