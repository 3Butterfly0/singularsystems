from rest_framework import status, views
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.contrib.auth.hashers import make_password, check_password
from app0.models import (
    BuildSession,
    CPU,
    Motherboard,
    Ram,
    Gpu,
    Psu,
    Case,
    Storage,
    Cooler,
    Order,
    PrebuiltPC,
)
from app0.serializers import (
    BuildSessionSerializer,
    PrebuiltPCSerializer,
    CPUSerializer,
    MotherboardSerializer,
    RamSerializer,
    GpuSerializer,
    PsuSerializer,
    CaseSerializer,
    StorageSerializer,
    CoolerSerializer,
)
from .compatibility import CompatibilityEngine
from app0.services.ai_assessment import AIAssessmentService
import secrets


def check_session_auth(request, session):
    if request.user.is_authenticated and session.user == request.user:
        return True
    secret = request.headers.get("X-BUILD-SESSION-SECRET") or request.META.get(
        "HTTP_X_BUILD_SESSION_SECRET"
    )
    if (
        secret
        and session.session_secret
        and check_password(secret, session.session_secret)
    ):
        return True
    return False


class BuildSessionCreateView(views.APIView):
    def post(self, request):
        platform = request.data.get("platform", None)  # 'intel' or 'amd'
        raw_secret = secrets.token_urlsafe(32)
        hashed_secret = make_password(raw_secret)
        session = BuildSession.objects.create(
            platform=platform, session_secret=hashed_secret
        )
        if request.user.is_authenticated:
            session.user = request.user
            session.save()

        data = BuildSessionSerializer(session).data
        data["session_secret"] = raw_secret  # Return plain text only once to client
        return Response(data, status=status.HTTP_201_CREATED)

    def get(self, request):
        # Return all active sessions for a user, or error if unauthenticated
        if request.user.is_authenticated:
            sessions = BuildSession.objects.filter(user=request.user)
            serializer = BuildSessionSerializer(sessions, many=True)
            return Response(serializer.data)
        return Response(
            {"detail": "Not authenticated"}, status=status.HTTP_401_UNAUTHORIZED
        )


class BuildSessionDetailView(views.APIView):
    def get(self, request, pk):
        session = get_object_or_404(BuildSession, pk=pk)
        if not check_session_auth(request, session):
            return Response(
                {"error": "Unauthorized"}, status=status.HTTP_401_UNAUTHORIZED
            )
        return Response(BuildSessionSerializer(session).data)


class BuildSessionOptionsView(views.APIView):
    def get(self, request, pk):
        session = get_object_or_404(BuildSession, pk=pk)
        if not check_session_auth(request, session):
            return Response(
                {"error": "Unauthorized"}, status=status.HTTP_401_UNAUTHORIZED
            )

        component_type = request.query_params.get("type")
        if not component_type:
            return Response(
                {"error": "type query param is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        qs = CompatibilityEngine.get_options(session, component_type)
        if qs is None:
            return Response(
                {"error": "invalid component type"}, status=status.HTTP_400_BAD_REQUEST
            )

        from rest_framework.pagination import PageNumberPagination
        paginator = PageNumberPagination()
        paginator.page_size = 20
        paginated_qs = paginator.paginate_queryset(qs, request, view=self)

        serializers_map = {
            "cpu": CPUSerializer,
            "motherboard": MotherboardSerializer,
            "ram": RamSerializer,
            "gpu": GpuSerializer,
            "storage": StorageSerializer,
            "psu": PsuSerializer,
            "cooler": CoolerSerializer,
            "case": CaseSerializer,
        }
        SerializerClass = serializers_map.get(component_type.lower())
        if not SerializerClass:
            return Response(
                {"error": "invalid component type"}, status=status.HTTP_400_BAD_REQUEST
            )

        serializer = SerializerClass(paginated_qs, many=True, context={'request': request})
        
        # Inject stubbed recommendation fields (to be replaced with AI in Phase 5)
        options_data = []
        for item in serializer.data:
            item_copy = dict(item)
            item_copy["is_recommended"] = False
            item_copy["recommendation_rank"] = None
            item_copy["recommendation_reason"] = None
            options_data.append(item_copy)

        return paginator.get_paginated_response(options_data)


class PrebuiltPCListView(views.APIView):
    def get(self, request):
        category = request.query_params.get("category")
        qs = PrebuiltPC.objects.all()
        if category:
            qs = qs.filter(category=category)

        serializer = PrebuiltPCSerializer(qs, many=True, context={'request': request})
        return Response(serializer.data)


class PrebuiltPCDetailView(views.APIView):
    def get(self, request, pk):
        prebuilt = get_object_or_404(PrebuiltPC, pk=pk)
        serializer = PrebuiltPCSerializer(prebuilt, context={'request': request})
        return Response(serializer.data)


class BuildSessionSelectionView(views.APIView):
    def patch(self, request, pk):
        session = get_object_or_404(BuildSession, pk=pk)
        if not check_session_auth(request, session):
            return Response(
                {"error": "Unauthorized"}, status=status.HTTP_401_UNAUTHORIZED
            )

        if session.status != "building":
            return Response(
                {"error": "Cannot modify selection. Build session is already locked/completed."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        comp_type = request.data.get("component_type")
        comp_id = request.data.get("component_id")
        action = request.data.get("action", "add")
        platform = request.data.get("platform")

        if platform:
            if platform in ["intel", "amd"]:
                session.platform = platform
                purpose = request.data.get("purpose")
                if purpose:
                    session.purpose = purpose
                session.save()
                return Response(BuildSessionSerializer(session).data)
            return Response({"error": "Invalid platform"}, status=status.HTTP_400_BAD_REQUEST)

        models_map = {
            "cpu": CPU,
            "motherboard": Motherboard,
            "ram": Ram,
            "gpu": Gpu,
            "psu": Psu,
            "case": Case,
            "storage": Storage,
            "cooler": Cooler,
        }

        if not comp_type or comp_type.lower() not in models_map:
            return Response(
                {"error": "Invalid component type"}, status=status.HTTP_400_BAD_REQUEST
            )

        field_name = comp_type.lower()
        ModelClass = models_map[field_name]

        if action == "remove":
            cleared = CompatibilityEngine.apply_selection(session, field_name, None)
            res_data = BuildSessionSerializer(session).data
            res_data["cleared_fields"] = cleared
            return Response(res_data)

        if action == "add":
            comp = get_object_or_404(ModelClass, pk=comp_id)
            try:
                cleared = CompatibilityEngine.apply_selection(session, field_name, comp)
            except ValueError as e:
                return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

            res_data = BuildSessionSerializer(session).data
            res_data["cleared_fields"] = cleared
            return Response(res_data)

        return Response({"error": "Invalid action"}, status=status.HTTP_400_BAD_REQUEST)


class BuildSessionValidateView(views.APIView):
    def post(self, request, pk):
        session = get_object_or_404(BuildSession, pk=pk)
        if not check_session_auth(request, session):
            return Response(
                {"error": "Unauthorized"}, status=status.HTTP_401_UNAUTHORIZED
            )
        require_complete = request.query_params.get("require_complete", "false").lower() == "true"
        errors = CompatibilityEngine.validate(session, require_complete=require_complete)
        is_valid = len(errors) == 0
        return Response({"valid": is_valid, "errors": errors})


class BuildSessionProceedToBuyView(views.APIView):
    def post(self, request, pk):
        session = get_object_or_404(BuildSession, pk=pk)
        if not check_session_auth(request, session):
            return Response(
                {"error": "Unauthorized"}, status=status.HTTP_401_UNAUTHORIZED
            )
        if not request.user.is_authenticated:
            return Response(
                {"error": "Authentication required to buy"},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        errors = CompatibilityEngine.validate(session, require_complete=True)
        if errors:
            return Response(
                {
                    "error": "Cannot proceed to buy with incomplete or incompatible components.",
                    "validation_errors": errors,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Create or retrieve existing Order for this session
        order, created = Order.objects.get_or_create(
            build_session=session,
            defaults={
                "user": request.user,
                "total_price": session.total_price,
                "status": "pending",
            },
        )

        session.status = "ready_to_buy"
        session.save()
        return Response(
            {
                "success": True,
                "status": session.status,
                "order_id": order.id,
                "message": "Proceeding to checkout/buying flow.",
            }
        )


class BuildSessionPurposeView(views.APIView):
    """
    PATCH /api/builder/session/<id>/purpose/
    Updates the user's stated purpose for this build (gaming / workstation / video_editing).
    Used by the frontend PurposeSelector at the start of the builder.
    """
    VALID_PURPOSES = {"gaming", "workstation", "video_editing"}

    def patch(self, request, pk):
        session = get_object_or_404(BuildSession, pk=pk)
        if not check_session_auth(request, session):
            return Response({"error": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)

        purpose = request.data.get("purpose")
        if purpose not in self.VALID_PURPOSES:
            return Response(
                {"error": f"Invalid purpose. Must be one of: {', '.join(sorted(self.VALID_PURPOSES))}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        session.purpose = purpose
        session.save(update_fields=["purpose"])
        return Response({"purpose": session.purpose})


class BuildSessionAnalyzeView(views.APIView):
    """
    POST /api/builder/session/<id>/analyze/
    Runs the AI Build Assessor against the current session state.
    Requires at least a CPU and GPU to be selected.
    Returns a green/yellow/red assessment with headline, analysis, and flagged components.
    Always returns HTTP 200 — falls back to a green state if Gemini is unavailable.
    """

    def post(self, request, pk):
        session = get_object_or_404(
            BuildSession.objects.select_related(
                "cpu", "gpu", "motherboard", "ram", "psu", "cooler", "storage", "case"
            ),
            pk=pk,
        )
        if not check_session_auth(request, session):
            return Response({"error": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)

        assessment = AIAssessmentService.assess(session)
        return Response(assessment)
