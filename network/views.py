import json
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.views.decorators.csrf import csrf_exempt #remove if not in use
from django.db import IntegrityError
from django.http import JsonResponse #remove some if not in use
from django.shortcuts import HttpResponse, HttpResponseRedirect, render
from django.urls import reverse
from django.core.paginator import EmptyPage, Paginator

from .models import *

def index(request):

    return render(request, "network/index.html")


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
        type = data.get('type')
        content = data.get('post')
    except:
        return JsonResponse({"error": "Missing required data in request body. "}, status=400)
    if type == 'new':
        # check if post is a reply to another
        # if it is NOT a REPLY new post is created
        if (data.get('parent') == None): 
            post = Post(author = request.user, content = content)
        # if it IS a REPLY try to identify parent post
        else:
            try:
                post = Post.objects.get(pk=data.get('parent'))
            # return error if parent post was not found
            except:
                return JsonResponse({"error": "Invalid parent post."}, status=400)
            # create new entry for reply post
            reply = Post(author = request.user, content = content)
            # add reply to parent post replies
            post.replies.add(reply)
            # save reply
            reply.save()
        # save new post/parent post
        post.save()
    elif type =='edit':
        try: 
            info = data.get('info')
        except:
            return JsonResponse({"error": "Missing required data in request body."}, status=400)
        post = Post.objects.get(pk=info['post_id'])
        if post.author != request.user: return JsonResponse({"error": "Unauthorized user."}, status=403)
        if not post.original: post.original = post.content
        post.content = content
        post.save()
    return JsonResponse({"message": "Successful."}, status=201)

# ADD FEATURE: PROFILE PRIVATE OPTION
def send_data(request, filter):
    page_number = request.GET.get('page')
    if not(page_number): page_number = 1
    else: page_number = int(page_number)
    # get authenticated user
    if(request.user.is_authenticated):  user = User.objects.get(pk = request.user.id)
    elif filter != 'all':  
        return JsonResponse({"error":  "Unauthenticated"}, status=401)
    # send posts according to filter...
    if filter == "all":
        posts = Post.objects.all()
    elif filter == "following":
        posts = Post.objects.filter(author__in=user.following.all())
    elif filter[0] == '@':
        username = filter[1:]
        if User.objects.filter(username=username):
            username = User.objects.filter(username=username).first()
            posts = Post.objects.filter(author=username)
        else: return JsonResponse({"error": f"User '{filter}' does not exist."}, status=400)
    else:
        return JsonResponse({"error": f"'{filter}' is not a valid filter."}, status=400)
    
    # ...in reverse chronologial order and serialized
    posts = posts.order_by("-timestamp").all()
    posts = [elem.serialize() for elem in posts]
    # divide into pages
    paginator = Paginator(posts,10)
    # make sure page number is valid
    try:
        paginator.page(page_number)
    except EmptyPage: 
        return JsonResponse({"error": "Page does not exist."}, status=400)
    data = {
            'info' : {
            'page_name' : filter,
            'current_page' : page_number, 
            'num_pages' : paginator.num_pages,
            'has_next' : paginator.page(page_number).has_next(),
            'has_previous' : paginator.page(page_number).has_previous()
            },
            'posts': paginator.get_page(page_number).object_list
        }
    if filter[0] == '@': data.update({'profile': username.serialize()})
    return JsonResponse(data)

@csrf_exempt
@login_required
def follow(request, filter):

    # Check valid request method
    if (request.method != "PUT"):
        return JsonResponse({"error": "PUT request required."}, status=405)

    #ignore @ char
    if filter[0]=='@': filter = filter[1:]
    
    #get request.user
    user = User.objects.get(pk=request.user.id)
    if not User.objects.filter(username=filter):
        return JsonResponse({"error": f"User '@{filter}' does not exist."}, status=400)
    else:
        profile = User.objects.filter(username = filter).first()
        # check if request.user follows profile
        if profile in user.following.all():
            # remove if it does
            user.following.remove(profile)
            user.save()
            return JsonResponse({"message": f"@{filter} successfully unfollowed."}, status=201)
        else:
            # add if does not
            user.following.add(profile)
            user.save()
            return JsonResponse({"message": f"@{filter} successfully followed."}, status=201)

