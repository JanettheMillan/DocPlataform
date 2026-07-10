from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DocumentViewSet, UserViewSet
from .authentication.views import login_view, register_view

router = DefaultRouter()
router.register(r'documents', DocumentViewSet, basename='document')
router.register(r'users', UserViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('login/', login_view),
    path('auth/register/', register_view),
]
