from django.test import Client, TestCase
from .models import *

# Create your tests here.
class NetworkTestCase(TestCase):
    def setUp(self):

        # create users
        user1 = User.objects.create_user(username="user1", password="user1pw")
        user2 = User.objects.create_user(username="user2", password="user2pw")
        user3 = User.objects.create_user(username="user3", password="user3pw")
        user1.following.add(user1)
        user2.following.add(user1)
        user3.following.add(user2)
        user3.following.add(user1)

        # create posts /default of is_reply is False
        post1 = Post.objects.create(author=user1, content="", is_reply=True)
        post2 = Post.objects.create(author=user2, content="2 Post", is_reply=True)
        post3 = Post.objects.create(author=user3, content="3 Post")
        post4 = Post.objects.create(author=user3, content="4 Post")
        post5 = Post.objects.create(author=user1, content="")
        post4.replies.add(post1)
        post4.replies.add(post2)
        post5.replies.add(post3)

    def test_posts_count(self):
        u1 = User.objects.get(username="user1")
        self.assertEqual(u1.posts.count(),2)

    def test_replies_count(self):
        p4 = Post.objects.get(content="4 Post")
        self.assertEqual(p4.replies.count(),2)

    def test_followers_count(self):
        u1 = User.objects.get(username="user1")
        self.assertEqual(u1.followers.count(),3)

    def test_following_count(self):
        u3 = User.objects.get(username="user3")
        self.assertEqual(u3.following.count(),2)

    def test_valid_post(self):
        p2 = Post.objects.get(content='2 Post')
        self.assertTrue(p2.is_valid_post())

    def test_invalid_post_reply(self):
        p3 = Post.objects.get(content='3 Post')
        self.assertFalse(p3.is_valid_post()) # is_reply marked False, but in post5 replies

    def test_invalid_post_content(self):
        u1 = User.objects.get(username="user1")
        p1 = Post.objects.filter(author=u1).first()
        self.assertFalse(p1.is_valid_post()) # has no content

    def test_valid_follow(self):
        u3 = User.objects.get(username="user3")
        self.assertTrue(u3.is_valid_follow())

    def test_invalid_follow(self):
        u1 = User.objects.get(username="user1")
        self.assertFalse(u1.is_valid_follow())

    def test_valid_login(self):
        c = Client()
        response = c.post('/login', {'username': 'user1', 'password': 'user1pw'})
        self.assertEqual(response.status_code, 302) 
        self.assertRedirects(response, '/') # redirected to index

    def test_homepage(self):
        c = Client()
        response = c.get("/")
        self.assertEqual(response.status_code, 200)
    
    def test_api_valid_post(self):
        c = Client()
        c.login(username='user1', password='user1pw')
        prev_posts = Post.objects.all().count()
        response = c.post("/api", {'type' : 'new', 'post' : 'New post'},content_type='application/json')
        self.assertEqual(response.status_code, 201)
        self.assertEqual(Post.objects.all().count(), prev_posts+1)
    
    def test_api_invalid_post(self):
        c = Client()
        c.login(username='user1', password='user1pw')
        response = c.get("/api")
        self.assertEqual(response.status_code, 405) # invalid request method
        response = c.post("/api", {'type' : 'nnew', 'post' : 'Error post'},content_type='application/json')
        self.assertEqual(response.status_code, 400) # invalid type
        response = c.post("/api", {'type' : 'reply', 'post' : 'Error post'},content_type='application/json')
        self.assertEqual(response.status_code, 400) # missing id
        response = c.post("/api", {'type' : 'reply', 'post' : 'Error post', 'id': 100},content_type='application/json')
        self.assertEqual(response.status_code, 400) # invalid id (not in the db)
        p3 = Post.objects.get(content="3 Post")
        response = c.post("/api", {'type' : 'edit', 'post' : 'Error post', 'id': p3.id},content_type='application/json')
        self.assertEqual(response.status_code, 403) # user not authorized to edit another user's post
    
    def test_api_reply(self):
        c = Client()
        c.login(username='user2', password='user2pw')
        post = Post.objects.get(content="4 Post")
        prev_replies = post.replies.count()
        response = c.post("/api", {'type' : 'reply', 'post' : 'Reply', 'id' : post.id },content_type='application/json')
        self.assertEqual(response.status_code, 201)
        self.assertEqual(post.replies.count(),prev_replies+1)

    def test_api_homepage(self):
        c = Client()
        c.login(username='user1', password='user1pw')
        response = c.get(f"/api/homepage",content_type='application/json')
        self.assertEqual(response.status_code, 200) 

    def test_invalid_api_following(self):
        c = Client()
        response = c.get("/api/following",content_type='application/json')
        self.assertEqual(response.status_code, 401) # user not authenticated 

    def test_valid_api_following(self):
        c = Client()
        c.login(username="user1", password="user1pw")
        response = c.get("/api/following")
        self.assertEqual(response.status_code, 200) 
    
    def test_api_valid_like(self):
        c = Client()
        c.login(username="user1", password="user1pw")
        post = Post.objects.get(content="4 Post")
        prev_likes = post.likes.count()
        response = c.put("/api/update", {'type' : 'like', 'id' : post.id },content_type='application/json')
        self.assertEqual(response.status_code, 201) 
        self.assertEqual(post.likes.count(), prev_likes+1)
    
    def test_api_invalid_like(self):
        c = Client()
        c.login(username="user1", password="user1pw")
        response = c.put("/api/update", {'type' : 'like'},content_type='application/json')
        self.assertEqual(response.status_code, 400) # missing id
        response = c.put("/api/update", {'type' : 'like', 'id':100},content_type='application/json')
        self.assertEqual(response.status_code, 400) # invalid id
    
    def test_api_valid_follow(self):
        u2 = User.objects.get(username='user2')
        u3 = User.objects.get(username='user3')
        prev_followers = u3.followers.count()
        c = Client()
        c.login(username="user2", password="user2pw")
        response = c.put("/api/update", {'type' : 'follow', 'id':u3.id},content_type='application/json')
        self.assertEqual(response.status_code, 201) 
        self.assertEqual(u3.followers.count(), prev_followers+1)
    
    def test_api_invalid_follow(self):
        u1 = User.objects.get(username='user1')
        c = Client()
        c.login(username="user1", password="user1pw")
        response = c.put("/api/update", {'type' : 'follow', 'id':u1.id},content_type='application/json')
        self.assertEqual(response.status_code, 400) 
    
    



    