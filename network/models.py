from django.contrib.auth.models import AbstractUser
from django.utils.timezone import now
from django.db import models


class User(AbstractUser):
    photo = models.ImageField(upload_to='media', null=True, blank=True)
    following = models.ManyToManyField("self", symmetrical=False, blank=True, related_name="followers")
    bio = models.TextField(blank=True, null=True)

    def __str__(self):
        return(f"[{self.id}] @{self.username}")

    def serialize(self):
        if self.photo: photo = self.photo.url
        else: photo = "/media/empty.png"
        return {
            "url" : f"/{self.username}",
            "id": self.id,
            "username": self.username,
            "email" : self.email,
            "bio" : self.bio,
            "following": [user.username for user in self.following.all()],
            "followers": [user.username for user in self.followers.all()],
            "date_joined": self.date_joined.strftime("%b %d %Y"),
            "photo": photo,
        }
    def is_valid_follow(self):
        return self not in self.following.all() and self not in self.followers.all()

class Post(models.Model):
    author = models.ForeignKey("User", on_delete=models.CASCADE, related_name="posts")
    timestamp = models.DateTimeField(auto_now_add=True, editable=False)
    content = models.TextField()
    replies = models.ManyToManyField("self", symmetrical=False, blank = True)
    original = models.TextField(blank=True, null= True)
    likes = models.ManyToManyField("User", related_name="likes", blank = True)
    is_reply = models.BooleanField(blank=False, default=False)
    
    def __str__(self):
        return (f"({self.id}) {self.content} - {self.author}")

    def serialize(self):
        if self.author.photo: photo = self.author.photo.url
        else: photo = "/media/empty.png"
        time = now() - self.timestamp
        if time.days>365: time = self.timestamp.strftime("%b %d %Y")
        elif time.days>0: time = self.timestamp.strftime("%b %d")
        elif int(time.seconds/3600) > 1: time = f"{int(time.seconds/3600)} hours ago"
        elif int(time.seconds/3600) > 0: time = f"{int(time.seconds/3600)} hour ago"
        elif int(time.seconds/60) >1: time = f"{int(time.seconds/60)} minutes ago"
        elif int(time.seconds/60) >0: time = f"{int(time.seconds/60)} minute ago"
        elif (time.seconds>1 or time.seconds==0): time = f"{time.seconds} seconds ago"
        else: time = f"{time.seconds} second ago"
        return {
            "id": self.id,
            "author": self.author.username,
            "author_photo": photo,
            "content": self.content,
            "replies": [post.id for post in self.replies.all()],
            "timestamp": time,
            "original": self.original,
            "likes": [user.username for user in self.likes.all()],
            "is_reply" : self.is_reply,
        }
    def is_valid_post(self):
        if self.author not in User.objects.all() or self.content==None or len(self.content)<=0: return False
        n = 0
        for post in Post.objects.all():
            if self in post.replies.all(): 
                n+=1
        if n > 1: return False
        return (n and self.is_reply or not n and not self.is_reply)
        