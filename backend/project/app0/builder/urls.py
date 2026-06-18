from django.urls import path
from .views import BuildSessionCreateView, BuildSessionDetailView, BuildSessionOptionsView, BuildSessionSelectionView, BuildSessionValidateView, BuildSessionProceedToBuyView, PrebuiltPCListView, BuildSessionLoadBuildView, PrebuiltPCDetailView, BuildSessionClaimView

urlpatterns = [
    path('session/', BuildSessionCreateView.as_view(), name='builder-session'),
    path('session/<uuid:pk>/', BuildSessionDetailView.as_view(), name='builder-session-detail'),
    path('session/<uuid:pk>/claim/', BuildSessionClaimView.as_view(), name='builder-session-claim'),
    path('session/<uuid:pk>/options/', BuildSessionOptionsView.as_view(), name='builder-options'),
    path('session/<uuid:pk>/select/', BuildSessionSelectionView.as_view(), name='builder-select'),
    path('session/<uuid:pk>/load/', BuildSessionLoadBuildView.as_view(), name='builder-load'),
    path('session/<uuid:pk>/validate/', BuildSessionValidateView.as_view(), name='builder-validate'),
    path('session/<uuid:pk>/proceed/', BuildSessionProceedToBuyView.as_view(), name='builder-proceed'),
    path('prebuilt/', PrebuiltPCListView.as_view(), name='builder-prebuilt'),
    path('prebuilt/<uuid:pk>/', PrebuiltPCDetailView.as_view(), name='prebuilt-detail'),
]
