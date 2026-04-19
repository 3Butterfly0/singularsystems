from rest_framework import status, views
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.contrib.auth.hashers import make_password, check_password
from app0.models import BuildSession, intelCPU, amdCPU, intelMotherboard, amdMotherboard, ram, gpu, psu, case, storage, cooler
from app0.serializers import BuildSessionSerializer
from .compatibility import CompatibilityEngine
import secrets

def check_session_auth(request, session):
    if request.user.is_authenticated and session.user == request.user:
        return True
    secret = request.headers.get('X-BUILD-SESSION-SECRET') or request.META.get('HTTP_X_BUILD_SESSION_SECRET')
    if secret and session.session_secret and check_password(secret, session.session_secret):
        return True
    return False

class BuildSessionCreateView(views.APIView):
    def post(self, request):
        platform = request.data.get('platform', None) # 'intel' or 'amd'
        raw_secret = secrets.token_urlsafe(32)
        hashed_secret = make_password(raw_secret)
        session = BuildSession.objects.create(platform=platform, session_secret=hashed_secret)
        if request.user.is_authenticated:
            session.user = request.user
            session.save()
        
        data = BuildSessionSerializer(session).data
        data['session_secret'] = raw_secret # Return plain text only once to client
        return Response(data, status=status.HTTP_201_CREATED)

    def get(self, request):
        # Return all active sessions for a user, or error if unauthenticated
        if request.user.is_authenticated:
            sessions = BuildSession.objects.filter(user=request.user)
            serializer = BuildSessionSerializer(sessions, many=True)
            return Response(serializer.data)
        return Response({'detail': 'Not authenticated'}, status=status.HTTP_401_UNAUTHORIZED)
        
class BuildSessionOptionsView(views.APIView):
    def get(self, request, pk):
        session = get_object_or_404(BuildSession, pk=pk)
        if not check_session_auth(request, session):
            return Response({'error': 'Unauthorized'}, status=status.HTTP_401_UNAUTHORIZED)
        
        component_type = request.query_params.get('type')
        if not component_type:
            return Response({'error': 'type query param is required'}, status=status.HTTP_400_BAD_REQUEST)
            
        options = []
        if component_type == 'cpu':
            res = CompatibilityEngine.get_compatible_cpus(session)
            if session.platform == 'intel' or not session.platform:
                options.extend([{'id': c.id, 'name': c.name, 'price': c.price, 'type': 'intelCPU'} for c in res['intel']])
            if session.platform == 'amd' or not session.platform:
                options.extend([{'id': c.id, 'name': c.name, 'price': c.price, 'type': 'amdCPU'} for c in res['amd']])
                
        elif component_type == 'motherboard':
            res = CompatibilityEngine.get_compatible_motherboards(session)
            if session.platform == 'intel' or not session.platform:
                options.extend([{'id': c.id, 'name': c.name, 'price': c.price, 'type': 'intelMotherboard'} for c in res['intel']])
            if session.platform == 'amd' or not session.platform:
                options.extend([{'id': c.id, 'name': c.name, 'price': c.price, 'type': 'amdMotherboard'} for c in res['amd']])
                
        elif component_type == 'ram':
            qs = CompatibilityEngine.get_compatible_ram(session)
            options = [{'id': r.id, 'name': r.name, 'price': r.price, 'type': 'ram'} for r in qs]
            
        elif component_type == 'psu':
            qs = CompatibilityEngine.get_compatible_psus(session)
            options = [{'id': p.id, 'name': p.name, 'price': p.price, 'type': 'psu'} for p in qs]

        elif component_type in ['gpu', 'storage', 'cooler', 'case']:
            models_map = {'gpu': gpu, 'storage': storage, 'cooler': cooler, 'case': case}
            ModelClass = models_map[component_type]
            options = [{'id': item.id, 'name': item.name, 'price': item.price, 'type': component_type} for item in ModelClass.objects.all()]
            
        else:
            return Response({'error': 'invalid component type'}, status=status.HTTP_400_BAD_REQUEST)

        return Response(options)

class BuildSessionSelectionView(views.APIView):
    def patch(self, request, pk):
        session = get_object_or_404(BuildSession, pk=pk)
        if not check_session_auth(request, session):
            return Response({'error': 'Unauthorized'}, status=status.HTTP_401_UNAUTHORIZED)
        
        comp_type = request.data.get('component_type')
        comp_id = request.data.get('component_id')
        action = request.data.get('action', 'add')
        
        models_map = {
            'intelCPU': (intelCPU, 'intel_cpu'),
            'amdCPU': (amdCPU, 'amd_cpu'),
            'intelMotherboard': (intelMotherboard, 'intel_motherboard'),
            'amdMotherboard': (amdMotherboard, 'amd_motherboard'),
            'ram': (ram, 'ram'),
            'gpu': (gpu, 'gpu'),
            'psu': (psu, 'psu'),
            'case': (case, 'case'),
            'storage': (storage, 'storage'),
            'cooler': (cooler, 'cooler')
        }
        
        if comp_type not in models_map:
            return Response({'error': 'Invalid component type'}, status=status.HTTP_400_BAD_REQUEST)
            
        ModelClass, field_name = models_map[comp_type]
        
        if action == 'remove':
            setattr(session, field_name, None)
            session.save()
            return Response(BuildSessionSerializer(session).data)
            
        elif action == 'add':
            comp = get_object_or_404(ModelClass, pk=comp_id)
            setattr(session, field_name, comp)
            
            if comp_type in ['intelCPU', 'intelMotherboard']:
                session.platform = 'intel'
            elif comp_type in ['amdCPU', 'amdMotherboard']:
                session.platform = 'amd'
                
            session.save()
            return Response(BuildSessionSerializer(session).data)
            
        return Response({'error': 'Invalid action'}, status=status.HTTP_400_BAD_REQUEST)

class BuildSessionValidateView(views.APIView):
    def post(self, request, pk):
        session = get_object_or_404(BuildSession, pk=pk)
        if not check_session_auth(request, session):
            return Response({'error': 'Unauthorized'}, status=status.HTTP_401_UNAUTHORIZED)
        errors = CompatibilityEngine.get_validation_errors(session)
        is_valid = len(errors) == 0
        return Response({'valid': is_valid, 'errors': errors})

class BuildSessionProceedToBuyView(views.APIView):
    def post(self, request, pk):
        session = get_object_or_404(BuildSession, pk=pk)
        if not check_session_auth(request, session):
            return Response({'error': 'Unauthorized'}, status=status.HTTP_401_UNAUTHORIZED)
        if not request.user.is_authenticated:
            return Response({'error': 'Authentication required to buy'}, status=status.HTTP_401_UNAUTHORIZED)
        
        errors = CompatibilityEngine.get_validation_errors(session)
        if errors:
            return Response({'error': 'Cannot proceed to buy with incompatible components.', 'validation_errors': errors}, status=status.HTTP_400_BAD_REQUEST)
            
        session.status = 'ready_to_buy'
        session.save()
        return Response({'success': True, 'status': session.status, 'message': 'Proceeding to checkout/buying flow.'})
