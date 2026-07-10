import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { API_BASE_URL } from './config';
import Login from './auth/Login';
import Register from './auth/Register';
import Notification from './components/Notification';
import PermissionsModal from './components/PermissionsModal';
import Dashboard from './pages/Dashboard';
import Editor from './pages/Editor';
import CompareView from './pages/CompareView';
import CreateDocumentModal from './components/CreateDocumentModal';

const App = () => {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [currentUser, setCurrentUser] = useState(JSON.parse(localStorage.getItem('user') || 'null'));
  const [view, setView] = useState('dashboard');
  const [selectedDocId, setSelectedDocId] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [compareVersions, setCompareVersions] = useState([null, null]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newDocName, setNewDocName] = useState('');
  const [showVersionModal, setShowVersionModal] = useState(false);
  const [versionNote, setVersionNote] = useState('');
  const [resetParams, setResetParams] = useState(null);
  const [notification, setNotification] = useState(null);
  const [invitations, setInvitations] = useState([]);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);

  const [documents, setDocuments] = useState([]);
  const [currentText, setCurrentText] = useState('');
  const [originalText, setOriginalText] = useState('');
  const textRef = React.useRef(currentText);
  useEffect(() => { textRef.current = currentText; }, [currentText]);

  const hasUnsavedChanges = currentText !== originalText;

  const [isLockedByMe, setIsLockedByMe] = useState(false);
  const [lockMessage, setLockMessage] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const showNotification = (type, message) => {
    setNotification({ type, message });
  };

  const fetchDocuments = useCallback(async () => {
    if (!token) return;
    try {
      const response = await fetch(`${API_BASE_URL}/documents/`, {
        headers: { 'Authorization': `Token ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) setDocuments(data);
        else setDocuments([]);
      } else if (response.status === 401) {
        handleLogout();
        showNotification('error', "Sesión expirada. Por favor ingresa de nuevo.");
      }
    } catch (error) {
      console.error("Error fetching documents:", error);
    }
  }, [token]);

  const fetchInvitations = useCallback(async () => {
    if (!token) return;
    try {
      const response = await fetch(`${API_BASE_URL}/documents/my_invitations/`, {
        headers: { 'Authorization': `Token ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setInvitations(data);
      }
    } catch (error) {
      console.error("Error fetching invitations:", error);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchDocuments();
      fetchInvitations();
    }
  }, [token, fetchDocuments, fetchInvitations]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const docId = params.get('doc');
    if (docId && documents.length > 0 && token) {
      const doc = documents.find(d => d.id === parseInt(docId));
      if (doc) {
        setSelectedDocId(doc.id);
        setCurrentText(doc.content);
        setView('editor');
        fetch(`${API_BASE_URL}/documents/${doc.id}/acquire_lock/`, {
          method: 'POST',
          headers: { 'Authorization': `Token ${token}` }
        }).then(response => response.json()).then(data => {
          if (response.ok) {
            setIsLockedByMe(true);
          } else {
            setIsLockedByMe(false);
            setLockMessage(data.message);
          }
        }).catch(() => {});
      }
    }
  }, [documents, token]);

  const handleLogin = (authToken, userData) => {
    setToken(authToken);
    setCurrentUser(userData);
    localStorage.setItem('token', authToken);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const handleLogout = async () => {
    if (isLockedByMe && selectedDocId) {
      await handleAutosave();
      try {
        await fetch(`${API_BASE_URL}/documents/${selectedDocId}/release_lock/`, {
          method: 'POST',
          headers: { 'Authorization': `Token ${token}` }
        });
      } catch (e) { console.error("Unlock error", e); }
    }
    setToken(null);
    setCurrentUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setView('dashboard');
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const docView = params.get('view');
    if (docView === 'reset_password') {
      setView('dashboard');
    }
  }, []);

  const handleAutosave = useCallback(async () => {
    const docId = selectedDocId;
    if (!docId || !isLockedByMe) return;
    setIsSaving(true);
    try {
      await fetch(`${API_BASE_URL}/documents/${docId}/autosave/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`
        },
        body: JSON.stringify({ content: textRef.current })
      });
    } catch (e) { console.error("Autosave error", e); }
    setTimeout(() => setIsSaving(false), 2000);
  }, [selectedDocId, isLockedByMe, token]);

  useEffect(() => {
    let heartbeatInterval;
    let autosaveInterval;
    let statusCheckInterval;

    if (view === 'editor' && isLockedByMe && selectedDocId) {
      heartbeatInterval = setInterval(async () => {
        try {
          fetch(`${API_BASE_URL}/documents/${selectedDocId}/heartbeat/`, {
            method: 'POST',
            headers: { 'Authorization': `Token ${token}` }
          });
        } catch (e) { console.error("Heartbeat error", e); }
      }, 30000);

      autosaveInterval = setInterval(() => {
        handleAutosave();
      }, 30000);
    }

    if (view === 'editor' && selectedDocId) {
      statusCheckInterval = setInterval(async () => {
        if (!isLockedByMe) return;
        try {
          const response = await fetch(`${API_BASE_URL}/documents/${selectedDocId}/`, {
            headers: { 'Authorization': `Token ${token}` }
          });
          const data = await response.json();
          if (data.status === 'bloqueado' && data.locked_by !== currentUser?.id) {
            setIsLockedByMe(false);
            setLockMessage(`El documento está siendo editado por ${data.locked_by_name}`);
          }
        } catch (e) { console.error("Status check error", e); }
      }, 10000);
    }

    return () => {
      if (heartbeatInterval) clearInterval(heartbeatInterval);
      if (autosaveInterval) clearInterval(autosaveInterval);
      if (statusCheckInterval) clearInterval(statusCheckInterval);
    };
  }, [view, isLockedByMe, selectedDocId, token, currentUser?.id, handleAutosave]);

  useEffect(() => {
    const handleBeforeUnload = async () => {
      if (isLockedByMe && selectedDocId) {
        await handleAutosave();
        try {
          await fetch(`${API_BASE_URL}/documents/${selectedDocId}/release_lock/`, {
            method: 'POST',
            headers: { 'Authorization': `Token ${token}` }
          });
        } catch (e) { console.error("Unlock error on close", e); }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isLockedByMe, selectedDocId, token, handleAutosave]);

  const activeDoc = useMemo(() => documents.find(d => d.id === selectedDocId), [documents, selectedDocId]);

  const handleOpenDoc = async (doc) => {
    setSelectedDocId(doc.id);
    setCurrentText(doc.content);
    setOriginalText(doc.content);
    
    const url = new URL(window.location.href);
    url.searchParams.set('doc', doc.id);
    window.history.pushState({}, '', url);

    try {
      const response = await fetch(`${API_BASE_URL}/documents/${doc.id}/acquire_lock/`, {
        method: 'POST',
        headers: { 'Authorization': `Token ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setIsLockedByMe(true);
        setLockMessage(null);
      } else if (response.status === 409) {
        setIsLockedByMe(false);
        setLockMessage(data.message || `El documento está siendo editado por ${data.locked_by}`);
      } else {
        showNotification('error', data.error || "No se pudo acceder al documento");
      }
    } catch (e) {
      console.error("Lock error", e);
    }
    setView('editor');
  };

  const handleBackToDashboard = async () => {
    if (isLockedByMe) {
      await handleAutosave();
      try {
        await fetch(`${API_BASE_URL}/documents/${selectedDocId}/release_lock/`, {
          method: 'POST',
          headers: { 'Authorization': `Token ${token}` }
        });
      } catch (e) { console.error("Unlock error", e); }
    }
    setIsLockedByMe(false);
    setLockMessage(null);
    setSelectedDocId(null);
    setOriginalText('');
    
    const url = new URL(window.location.href);
    url.searchParams.delete('doc');
    window.history.pushState({}, '', url);
    
    setView('dashboard');
    fetchDocuments();
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!newDocName.trim()) return;

    try {
      const response = await fetch(`${API_BASE_URL}/documents/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`
        },
        body: JSON.stringify({ name: newDocName, content: '' })
      });

      if (response.ok) {
        await fetchDocuments();
        setShowCreateModal(false);
        setNewDocName('');
      } else {
        showNotification('error', "Error al crear el documento.");
      }
    } catch (error) {
      console.error("Error creating document:", error);
    }
  };

  const handleVersionSubmit = async (e) => {
    e.preventDefault();
    if (!versionNote.trim()) return;

    try {
      const response = await fetch(`${API_BASE_URL}/documents/${activeDoc.id}/save_version/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`
        },
        body: JSON.stringify({ content: currentText, note: versionNote })
      });

      if (response.ok) {
        await fetchDocuments();
        setShowVersionModal(false);
        setVersionNote('');
        showNotification('success', "Nueva versión guardada correctamente.");
      } else {
        showNotification('error', "Error al guardar la versión.");
      }
    } catch (error) {
      console.error("Error saving version:", error);
    }
  };

  const handleRestoreVersion = (ver) => {
    setCurrentText(ver.content);
    showNotification('success', `Contenido restaurado a la versión ${ver.version_number}`);
  };

  const handleShare = async (email, role) => {
    try {
      const response = await fetch(`${API_BASE_URL}/documents/${activeDoc.id}/share/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`
        },
        body: JSON.stringify({ email, role })
      });
      const data = await response.json();
      if (response.ok) {
        showNotification('success', `Invitación enviada a ${email}`);
        fetchDocuments();
      } else {
        showNotification('error', data.error || "No se pudo compartir");
      }
    } catch (err) {
      showNotification('error', "Error de conexión");
    }
  };

  const handleRevoke = async (userId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/documents/${activeDoc.id}/revoke_permission/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`
        },
        body: JSON.stringify({ user_id: userId })
      });
      if (response.ok) {
        showNotification('success', "Acceso revocado");
        fetchDocuments();
      }
    } catch (err) {
      showNotification('error', "Error de conexión");
    }
  };

  const handleAcceptInvitation = async (permId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/documents/accept_invitation/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`
        },
        body: JSON.stringify({ permission_id: permId })
      });
      if (response.ok) {
        showNotification('success', "Invitación aceptada correctamente");
        fetchInvitations();
        fetchDocuments();
      }
    } catch (err) {
      showNotification('error', "Error al aceptar invitación");
    }
  };

  const handleUpdateDocName = async (newName) => {
    if (!activeDoc || !newName.trim()) return;
    try {
      const response = await fetch(`${API_BASE_URL}/documents/${activeDoc.id}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`
        },
        body: JSON.stringify({ name: newName.trim() })
      });
      if (response.ok) {
        showNotification('success', "Nombre del documento actualizado");
        fetchDocuments();
      } else {
        showNotification('error', "Error al actualizar el nombre");
      }
    } catch (err) {
      showNotification('error', "Error de conexión");
    }
  };

  if (!token) {
    if (view === 'register') {
      return <Register onLogin={handleLogin} onBack={() => setView('login')} />;
    }
    return (
      <Login
        onLogin={handleLogin}
        onRegister={() => setView('register')}
      />
    );
  }

  const renderContent = () => {
    if (view === 'editor' && activeDoc) {
      return (
        <Editor
          activeDoc={activeDoc}
          currentText={currentText}
          setCurrentText={setCurrentText}
          isLockedByMe={isLockedByMe}
          lockMessage={lockMessage}
          isSaving={isSaving}
          showHistory={showHistory}
          setShowHistory={setShowHistory}
          showPermissionsModal={showPermissionsModal}
          setShowPermissionsModal={setShowPermissionsModal}
          showVersionModal={showVersionModal}
          setShowVersionModal={setShowVersionModal}
          versionNote={versionNote}
          setVersionNote={setVersionNote}
          onBack={handleBackToDashboard}
          onSaveVersion={handleVersionSubmit}
          onRestoreVersion={handleRestoreVersion}
          onUpdateDocName={handleUpdateDocName}
          hasUnsavedChanges={hasUnsavedChanges}
        />
      );
    }
    if (view === 'compare' && activeDoc) {
      return (
        <CompareView
          activeDoc={activeDoc}
          compareVersions={compareVersions}
          setCompareVersions={setCompareVersions}
          onBack={() => setView('editor')}
        />
      );
    }
    return (
      <Dashboard
        documents={documents}
        currentUser={currentUser}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        invitations={invitations}
        onOpenDoc={handleOpenDoc}
        onCreateDoc={() => setShowCreateModal(true)}
        onLogout={handleLogout}
        onAcceptInvitation={handleAcceptInvitation}
      />
    );
  };

  return (
    <>
      {renderContent()}
      {notification && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}
      {showPermissionsModal && activeDoc && (
        <PermissionsModal
          doc={activeDoc}
          currentUser={currentUser}
          onClose={() => setShowPermissionsModal(false)}
          onShare={handleShare}
          onRevoke={handleRevoke}
          API_BASE_URL={API_BASE_URL}
          token={token}
        />
      )}
      <CreateDocumentModal
        show={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateSubmit}
        name={newDocName}
        setName={setNewDocName}
      />
    </>
  );
};

export default App;
