import json
from django.template.context_processors import csrf
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.views.decorators.csrf import csrf_exempt, ensure_csrf_cookie
from django.db import IntegrityError
from django.core.exceptions import ObjectDoesNotExist, PermissionDenied, SuspiciousOperation
from django.http import JsonResponse, Http404
from django.shortcuts import HttpResponseRedirect, render
from django.urls import reverse
from django.core.paginator import EmptyPage, Paginator

from .models import *


@ensure_csrf_cookie
def profile(request, username):
    try:
        user = User.objects.get(username=username)
    except ObjectDoesNotExist:
        raise Http404(f"User {username} does not exist.")
    return render(request, "network/profile.html")


def viewpost(request, post_id):
    try:
        Post.objects.get(pk=post_id)
    except ObjectDoesNotExist:
        raise Http404(f"Post {post_id} does not exist.")
    return render(request, "network/view_post.html")


@login_required
def following(request):
    return render(request, "network/following.html")


@login_required
def listingview(request, username, list):
    data = []
    try:
        user = User.objects.get(username=username)
    except ObjectDoesNotExist:
        raise Http404(f"User {username} does not exist.")

    if list == "following":
        data = [profile.serialize() for profile in user.following.all()]
    elif list == "followers":
        data = [profile.serialize() for profile in user.followers.all()]
    else:
        raise SuspiciousOperation

    return render(request, "network/user_list.html", {
        "page": user.username,
        "profiles": data,
    })


def login_view(request):
    if request.method == "POST":

        # Attempt to sign user in
        username = request.POST["username"]
        password = request.POST["password"]
        user = authenticate(request, username=username, password=password)

        # Check if authentication was successful
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
        else:
            return HttpResponseRedirect(reverse("index"))


def logout_view(request):
    logout(request)
    return HttpResponseRedirect(reverse("index"))


def register(request):
    if request.method == "POST":
        username = request.POST["username"]
        email = request.POST["email"]
        reserved_words = ["api", "following", "login", "register", "logout"]
        # Prevent user from registering a reserved word
        if username in reserved_words:
            return render(request, "network/register.html", {
                "message": "Invalid username."
            })
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


@login_required
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
        post = Post(author=request.user, content=content)
        post.save()

    # if it's not a new post, it must be a reply or an edit, and body should have additional data
    else:
        # id of the post user tries to edit or reply
        id = data.get('id')
        if id == None:
            return JsonResponse({"error": "Missing required data in request body. "}, status=400)
        try:
            post = Post.objects.get(pk=id)
            # return error if post was not found post in db
        except ObjectDoesNotExist:
            return JsonResponse({"error": "Post does not exist in the database."}, status=400)
        if type == 'edit':
            if post.author != request.user:
                raise PermissionDenied
            # if post is being edited for the first time, the original post gets stored
            if not post.original:
                post.original = post.content
            post.content = content
            post.save()
        elif type == 'reply':
            reply = Post(author=request.user, content=content)
            reply.is_reply = True
            reply.save()
            post.replies.add(reply)
            post.save()
        else:
            return JsonResponse({"error": "Type invalid."}, status=400)

    return JsonResponse({"message": "Successful."}, status=201)


def send_data(request, filter):

    data = {}
    page_number = request.GET.get('page')
    if not page_number:
        page_number = 1
    page_number = int(page_number)
    # get authenticated user
    if(request.user.is_authenticated):
        user = User.objects.get(pk=request.user.id)
        # not authenticated and trying to access restricted data
    elif filter == 'following':
        return JsonResponse({"error":  "User unauthenticated"}, status=403)
    # send posts according to filter...
    if filter == "homepage":
        posts = Post.objects.exclude(is_reply=True)
    elif filter == "following":
        posts = Post.objects.filter(
            author__in=user.following.all()).exclude(is_reply=True)
    else:
        if User.objects.filter(username=filter):
            user = User.objects.filter(username=filter).first()
            posts = Post.objects.filter(author=user).exclude(is_reply=True)
            data.update({'profile': user.serialize()})
        else:
            try:
                id = int(filter)
                post = Post.objects.get(pk=id)
            except ValueError:
                return JsonResponse({"error": f"'{filter}' is not a valid filter."}, status=400)
            except ObjectDoesNotExist:
                return JsonResponse({"error": "Post does not exist."}, status=400)
            if post.is_reply == True:
                return JsonResponse({"error": "Invalid post"}, status=400)
            posts = post.replies.order_by("-timestamp").all()
            data.update({'post': post.serialize()})
    # ...in reverse chronologial order and serialized
    posts = posts.order_by("-timestamp").all()
    posts = [elem.serialize() for elem in posts]
    # divide into pages
    paginator = Paginator(posts, 10)
    # make sure page number is valid
    try:
        paginator.page(page_number)
    except EmptyPage:
        return JsonResponse({"error": "Invalid page number."}, status=400)
    data.update({
        'info': {
                'page_name': filter,
                'current_page': page_number,
                'num_pages': paginator.num_pages,
                'has_next': paginator.page(page_number).has_next(),
                'has_previous': paginator.page(page_number).has_previous()
                },
        'posts': paginator.get_page(page_number).object_list
    })
    return JsonResponse(data, status=200)


@login_required
def update(request):

    # Check valid request method
    if (request.method != "PUT"):
        return JsonResponse({"error": "PUT request required."}, status=405)

    data = json.loads(request.body)

    type = data.get('type')
    id = data.get('id')
    if type == None or id == None:
        return JsonResponse({"error": "Missing required data in request body. "}, status=400)

    # get request.user
    user = User.objects.get(pk=request.user.id)
    # user requests to follow/unfolow an account
    if type == 'follow':
        try:
            # get profile account
            profile = User.objects.get(pk=id)
        except:
            return JsonResponse({"error": f"User does not exist."}, status=400)
        if user == profile:
            return JsonResponse({"error": "User cannot follow themselves"}, status=400)
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
