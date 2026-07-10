from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.contrib.auth.models import User
from django.utils import timezone
from .models import Document, Version, Permission
from .serializers import DocumentSerializer, VersionSerializer, UserSerializer, PermissionSerializer

class UserViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer

class DocumentViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = DocumentSerializer

    def get_queryset(self):
        user = self.request.user
        # User sees documents they own
        # OR documents where they have an accepted permission
        owned_docs = Document.objects.filter(owner=user)
        shared_docs = Document.objects.filter(permissions__user=user, permissions__status='aceptado')
        return (owned_docs | shared_docs).distinct()

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    @action(detail=True, methods=['post'])
    def share(self, request, pk=None):
        doc = self.get_object()
        if doc.owner != request.user:
            return Response({'error': 'Solo el dueño puede compartir este documento'}, status=status.HTTP_403_FORBIDDEN)
        
        email = request.data.get('email')
        role = request.data.get('role', 'lector')

        try:
            target_user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({'error': 'Usuario no encontrado con ese correo'}, status=status.HTTP_404_NOT_FOUND)

        if target_user == request.user:
            return Response({'error': 'No puedes compartir contigo mismo'}, status=status.HTTP_400_BAD_REQUEST)

        perm, created = Permission.objects.update_or_create(
            document=doc,
            user=target_user,
            defaults={'role': role, 'status': 'pendiente'}
        )

        return Response(PermissionSerializer(perm).data)

    @action(detail=True, methods=['post'])
    def revoke_permission(self, request, pk=None):
        doc = self.get_object()
        if doc.owner != request.user:
            return Response({'error': 'Solo el dueño puede revocar permisos'}, status=status.HTTP_403_FORBIDDEN)
        
        user_id = request.data.get('user_id')
        try:
            perm = Permission.objects.get(document=doc, user__id=user_id)
            perm.delete()
            return Response({'status': 'Permission revoked'})
        except Permission.DoesNotExist:
            return Response({'error': 'Permission not found'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=False, methods=['get'])
    def my_invitations(self, request):
        perms = Permission.objects.filter(user=request.user, status='pendiente')
        # We want to return document info along with permission
        data = []
        for p in perms:
            data.append({
                'permission_id': p.id,
                'document_name': p.document.name,
                'owner': p.document.owner.username,
                'role': p.role,
                'granted_at': p.granted_at
            })
        return Response(data)

    @action(detail=False, methods=['post'])
    def accept_invitation(self, request):
        perm_id = request.data.get('permission_id')
        try:
            perm = Permission.objects.get(id=perm_id, user=request.user)
            perm.status = 'aceptado'
            perm.save()
            return Response({'status': 'invitation accepted', 'document_id': perm.document.id})
        except Permission.DoesNotExist:
            return Response({'error': 'Invitation not found'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=True, methods=['post'])
    def acquire_lock(self, request, pk=None):
        doc = self.get_object()
        user = request.user
        
        has_edit_perm = doc.owner == user or Permission.objects.filter(document=doc, user=user, role__in=['editor', 'admin'], status='aceptado').exists()
        if not has_edit_perm:
            return Response({'error': 'No tienes permisos de edición'}, status=status.HTTP_403_FORBIDDEN)

        now = timezone.now()
        if doc.status == 'bloqueado' and doc.locked_by != user:
            # Check if lock has expired (2 minutes)
            if doc.last_heartbeat and (now - doc.last_heartbeat).total_seconds() > 120:
                pass 
            else:
                return Response({
                    'error': 'bloqueado',
                    'locked_by': doc.locked_by.username,
                    'message': f'Este usuario ({doc.locked_by.username}) está editando, debemos esperar hasta que termine.'
                }, status=status.HTTP_409_CONFLICT)

        doc.status = 'bloqueado'
        doc.locked_by = user
        doc.last_heartbeat = now
        doc.save()
        return Response({'status': 'locked', 'locked_by': user.username})

    @action(detail=True, methods=['post'])
    def heartbeat(self, request, pk=None):
        doc = self.get_object()
        if doc.status == 'bloqueado' and doc.locked_by == request.user:
            doc.last_heartbeat = timezone.now()
            doc.save()
            return Response({'status': 'ok'})
        return Response({'error': 'No posees el bloqueo'}, status=status.HTTP_403_FORBIDDEN)

    @action(detail=True, methods=['post'])
    def release_lock(self, request, pk=None):
        doc = self.get_object()
        if doc.locked_by == request.user or request.user.is_staff:
            doc.status = 'disponible'
            doc.locked_by = None
            doc.last_heartbeat = None
            doc.save()
            return Response({'status': 'unlocked'})
        return Response({'error': 'No puedes liberar este bloqueo'}, status=status.HTTP_403_FORBIDDEN)

    @action(detail=True, methods=['post'])
    def autosave(self, request, pk=None):
        doc = self.get_object()
        if doc.status == 'bloqueado' and doc.locked_by == request.user:
            doc.content = request.data.get('content', doc.content)
            doc.save()
            return Response({'status': 'saved'})
        return Response({'error': 'No posees el bloqueo para autoguardado'}, status=status.HTTP_403_FORBIDDEN)

    @action(detail=True, methods=['post'])
    def save_version(self, request, pk=None):
        doc = self.get_object()
        user = request.user

        has_edit_perm = doc.owner == user or Permission.objects.filter(document=doc, user=user, role__in=['editor', 'admin'], status='aceptado').exists()
        if not has_edit_perm:
            return Response({'error': 'No tienes permisos para guardar versiones'}, status=status.HTTP_403_FORBIDDEN)

        if doc.status == 'bloqueado' and doc.locked_by != user:
             return Response({'error': 'Documento bloqueado por otro usuario'}, status=status.HTTP_403_FORBIDDEN)

        note = request.data.get('note', 'Publicación manual')
        content = request.data.get('content', doc.content)
        
        try:
            curr_v_str = doc.version.replace('v', '')
            curr_v = float(curr_v_str) if curr_v_str else 1.0
            next_v = f"v{curr_v + 0.1:.1f}"
        except ValueError:
            next_v = "v1.1"

        Version.objects.create(
            document=doc,
            version_number=next_v,
            content=content,
            author=user,
            note=note
        )

        doc.content = content
        doc.version = next_v
        doc.last_mod = timezone.now()
        # En este nuevo flujo, guardar versión NO libera el bloqueo necesariamente,
        # pero podemos decidir que sí lo haga si es una "Publicación y Cierre"
        # El usuario pidió "cuando se salga se guarde en automático"
        doc.save()

        return Response(DocumentSerializer(doc).data)
