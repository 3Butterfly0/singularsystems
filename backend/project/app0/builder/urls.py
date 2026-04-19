from django.urls import path
from .views import BuildSessionCreateView, BuildSessionOptionsView, BuildSessionSelectionView, BuildSessionValidateView, BuildSessionProceedToBuyView

urlpatterns = [
    path('session/', BuildSessionCreateView.as_view(), name='builder-session'),
    path('session/<uuid:pk>/options/', BuildSessionOptionsView.as_view(), name='builder-options'),
    path('session/<uuid:pk>/select/', BuildSessionSelectionView.as_view(), name='builder-select'),
    path('session/<uuid:pk>/validate/', BuildSessionValidateView.as_view(), name='builder-validate'),
    path('session/<uuid:pk>/proceed/', BuildSessionProceedToBuyView.as_view(), name='builder-proceed'),
]
