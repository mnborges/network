from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    #avatar = models.ImageField(upload_to='network/media/avatars/', null=True)
    following = models.ManyToManyField("self", symmetrical=False, null = True, blank=True, related_name="followers")
    bio = models.TextField(blank=True, null=True)

    def __str__(self):
        return(f"[{self.id}] @{self.username}")

    def serialize(self):
        return {
            "id": self.id,
            "username": self.username,
            "email" : self.email,
            "following": [user.username for user in self.following.all()],
            "followers": [user.username for user in self.followers.all()],
            "date_joined": self.date_joined.strftime("%b %d %Y, %I:%M %p"),
        }

class Post(models.Model):
    author = models.ForeignKey("User", on_delete=models.CASCADE, related_name="posts")
    timestamp = models.DateTimeField(auto_now_add=True, editable=False)
    content = models.TextField()
    replies = models.ManyToManyField("self", symmetrical=False, null= True, blank = True)
    original = models.TextField(blank=True, null= True)
    
    def __str__(self):
        return (f"({self.id}) {self.content} - {self.author}")

    def serialize(self):
        return {
            "id": self.id,
            "author": self.author.username,
            "content": self.content,
            "replies": [post.id for post in self.replies.all()],
            "timestamp": self.timestamp.strftime("%b %d %Y, %I:%M %p"),
            "original": self.original
        }
