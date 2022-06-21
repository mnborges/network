import json
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.views.decorators.csrf import csrf_exempt, ensure_csrf_cookie
from django.db import IntegrityError
from django.core.exceptions import ObjectDoesNotExist
from django.http import JsonResponse
from django.shortcuts import HttpResponse, HttpResponseRedirect, render
from django.urls import reverse
from django.core.paginator import EmptyPage, Paginator

from .models import *

@ensure_csrf_cookie
def index(request):
    page_number = request.GET.get('page')
    if not page_number: page_number = 1
    return render(request, "network/index.html")

def page(request, page):
    if not page: page = 'homepage'
    page_number = request.GET.get('page')
    if not page_number: page_number = 1
    page_number = int(page_number)
    if page != 'following' and page != 'homepage': 
        try:
            page = int(page)
        except:
            page = '@'+page
    return render(request, "network/index.html", {
                'page': page,
                'page_number' : page_number
    }) 

def listingview(request, page, list):
    message=''
    data =[]
    try: 
        user = User.objects.get(username = page)
    except ObjectDoesNotExist:
        message = "User does not exist."
    if not message:
        if list == "following":
            data = [profile.serialize() for profile in user.following.all()]
        elif list == "followers":
            data = [profile.serialize() for profile in user.followers.all()]
        else:
            page_number = request.GET.get('page')
            if not page_number: page_number = 1
            return render(request, "network/index.html", {
                'page': list,
                'page_number' : page_number
            }) 
    return render(request, "network/user_list.html", {
        "profiles": data,
        'message': message
    })
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
        if not request.user.is_authenticated: 
            return render(request, "network/login.html")
        else: return HttpResponseRedirect(reverse("index"))


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

@login_required(login_url='../login')
def post(request):   
    # Check valid request method
    if (request.method != "POST"):
        return JsonResponse({"error": "POST method required."}, status=405)

    # Get post data
    data = json.loads(request.body)

    # try to get informatiom from request body and return error if data is missing from request 
    type = data.get('type')
    content = data.get('post')
    if type == None or content == None:
        return JsonResponse({"error": "Missing required data in request body. "}, status=400)
    
    # if it is a new post create and add it to db
    if type == 'new':
        post = Post(author = request.user, content = content)
        post.save()
    
    # if it's not a new post, it must be a reply or an edit, and body should have additional data
    else:
        # id of the post user tries to edit or reply
        id = data.get('id')
        if id == None: return JsonResponse({"error": "Missing required data in request body. "}, status=400)
        try: 
            post = Post.objects.get(pk=id)
            # return error if post was not found post in db
        except ObjectDoesNotExist:
            return JsonResponse({"error": "Post does not exist in the database."}, status=400)
        if type =='edit':
            if post.author != request.user: return JsonResponse({"error": "Unauthorized user."}, status=403)
            # if post is being edited for the first time, the original post gets stored 
            if not post.original: post.original = post.content
            post.content = content
            post.save()
        elif type == 'reply':
            reply = Post(author= request.user, content = content)
            reply.is_reply=True
            reply.save()
            post.replies.add(reply)
            post.save()
        else: return JsonResponse({"error": "Type invalid."}, status=400)

    return JsonResponse({"message": "Successful."}, status=201)

def send_data(request, filter):
    data = {}
    page_number = request.GET.get('page')
    if not page_number: page_number = 1
    page_number = int(page_number)
    # get authenticated user
    if(request.user.is_authenticated):  user = User.objects.get(pk=request.user.id)
    elif filter == 'following': 
        return JsonResponse({"error":  "User unauthenticated"}, status=401)
    # send posts according to filter...
    if filter == "homepage":
        posts = Post.objects.exclude(is_reply=True)
    elif filter == "following":
        posts = Post.objects.filter(author__in=user.following.all()).exclude(is_reply=True)
    elif filter[0] == '@':
        username = filter[1:]
        if User.objects.filter(username=username):
            username = User.objects.filter(username=username).first()
            posts = Post.objects.filter(author=username).exclude(is_reply=True)
            data.update({'profile': username.serialize()})
        else: return JsonResponse({"error": f"User '{filter}' does not exist."}, status=400)
    else:
        try: 
            id = int(filter)
            post = Post.objects.get(pk=id)
        except ValueError:
            return JsonResponse({"error": f"'{filter}' is not a valid filter."}, status=400)
        except ObjectDoesNotExist:
            return JsonResponse({"error": "Post does not exist."}, status=400)
        if post.is_reply==True: return JsonResponse({"error": "Invalid post"}, status=400)
        posts = post.replies.order_by("-timestamp").all()
        data.update({'post': post.serialize()})
    # ...in reverse chronologial order and serialized
    posts = posts.order_by("-timestamp").all()
    posts = [elem.serialize() for elem in posts]
    # divide into pages
    paginator = Paginator(posts,10)
    # make sure page number is valid
    try:
        paginator.page(page_number)
    except EmptyPage: 
        return JsonResponse({"error": "Invalid page number."}, status=400)
    data.update({
            'info' : {
            'page_name' : filter,
            'current_page' : page_number, 
            'num_pages' : paginator.num_pages,
            'has_next' : paginator.page(page_number).has_next(),
            'has_previous' : paginator.page(page_number).has_previous()
            },
            'posts': paginator.get_page(page_number).object_list
        })
    return JsonResponse(data, status=200)

@login_required(login_url='../login')
def update(request): 

    # Check valid request method
    if (request.method != "PUT"):
        return JsonResponse({"error": "PUT request required."}, status=405)

    data = json.loads(request.body)
    
    type = data.get('type')
    id = data.get('id')
    if type == None or id == None:
        return JsonResponse({"error": "Missing required data in request body. "}, status=400)
    
    #get request.user
    user = User.objects.get(pk=request.user.id)
    # user requests to follow/unfolow an account
    if type == 'follow':
        try: 
            # get profile account
            profile = User.objects.get(pk=id)
        except:
            return JsonResponse({"error": f"User does not exist."}, status=400)
        if user == profile: return JsonResponse({"error": "User cannot follow themselves"}, status=400)
        # check if request.user follows profile
        if profile in user.following.all():
            # remove if it does
            user.following.remove(profile)
            user.save()
            return JsonResponse({"message": f"@{profile.username} successfully unfollowed."}, status=201)
        else:
            # add if does not
            user.following.add(profile)
            user.save()
            return JsonResponse({"message": f"@{profile.username} successfully followed."}, status=201)
    # user requests to like/unlike a post
    elif type == 'like':
        try:
            # get post
            post = Post.objects.get(pk=id)
        except ObjectDoesNotExist:
            return JsonResponse({"error": f"Post does not exist."}, status=400)
        
        # check if request.user already likes the post, remove if it does and add if it doesnt
        if user in post.likes.all():
            post.likes.remove(user)
            message = "Unlike successful."
        else: 
            post.likes.add(user)
            message = "Like successful."
        post.save()
        return JsonResponse({"message": message}, status=201)
    else:
        return JsonResponse({"error": "Invalid update type."}, status=400)

def srv_test(request):
    info = { 'info' : request.path}
    if request.method == "POST":
        data = json.loads(request.body)
        id = data.get('post_id')
        try:
            post = Post.objects.get(pk=id)
        except ObjectDoesNotExist:
            return JsonResponse({"error": "Post doesnt exist"}, status=400)
        response = {
            'post_info': post.serialize(),
        }
        return JsonResponse(response, status=201)
    else:
        return JsonResponse(info, status=201)