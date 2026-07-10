import React from 'react';
import {
  FileText,
  Lock,
  Users,
  Plus,
  Search,
  Edit3,
  MoreVertical,
  LogOut,
  CheckCircle2
} from 'lucide-react';

const Dashboard = ({
  documents,
  currentUser,
  searchTerm,
  setSearchTerm,
  invitations,
  onOpenDoc,
  onCreateDoc,
  onLogout,
  onAcceptInvitation
}) => {
  return (
    <div className="max-w-7xl mx-auto p-8">
      <header className="flex justify-between items-center mb-12">
        <div className="flex flex-col">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">DocManager <span className="text-indigo-600">Pro</span></h1>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">Workspace de Colaboración</p>
        </div>

        <div className="flex gap-4 items-center">
          <div className="flex items-center gap-3 bg-white p-2 pr-5 rounded-[1.25rem] border border-slate-100 shadow-sm hover:shadow-md transition-all group cursor-default">
            <div className="w-10 h-10 bg-slate-100 text-slate-500 group-hover:bg-indigo-600 group-hover:text-white rounded-xl flex items-center justify-center font-black text-sm transition-all duration-300">
              {(currentUser?.username ? currentUser.username[0].toUpperCase() : '?')}
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-black text-slate-800 leading-tight">{currentUser?.username || 'Usuario'}</span>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Plan Enterprise</span>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="p-3.5 bg-white text-slate-400 hover:text-rose-500 rounded-2xl border border-slate-100 hover:border-rose-100 transition-all shadow-sm group bg-white/50 backdrop-blur-sm"
            title="Cerrar Sesión"
          >
            <LogOut size={20} className="group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-12">
        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
            <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-inner shadow-indigo-100/50">
              <FileText size={28} />
            </div>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Total Documentos</p>
            <h3 className="text-3xl font-black text-slate-800 tracking-tighter">{documents.length}</h3>
          </div>
          <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
            <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-3xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-inner shadow-amber-100/50">
              <Lock size={28} />
            </div>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">En Edición</p>
            <h3 className="text-3xl font-black text-slate-800 tracking-tighter">{documents.filter(d => d.status === 'bloqueado').length}</h3>
          </div>
          <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
            <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-inner shadow-emerald-100/50">
              <Users size={28} />
            </div>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Colaboraciones</p>
            <h3 className="text-3xl font-black text-slate-800 tracking-tighter">{documents.filter(d => Number(d.owner) !== Number(currentUser?.id)).length}</h3>
          </div>
        </div>

        <button
          onClick={onCreateDoc}
          className="bg-slate-900 border-4 border-white hover:bg-indigo-600 text-white p-6 rounded-[2.5rem] flex flex-col items-center justify-center gap-3 shadow-2xl shadow-slate-200 transition-all hover:-translate-y-1 active:scale-95 text-center group"
        >
          <div className="p-3 bg-white/10 rounded-2xl group-hover:rotate-90 transition-transform duration-500">
            <Plus size={32} strokeWidth={3} />
          </div>
          <span className="font-black text-lg uppercase tracking-tight">Nuevo Archivo</span>
        </button>
      </div>

      {invitations.length > 0 && (
        <div className="mb-10 p-6 bg-gradient-to-r from-amber-500 to-amber-600 rounded-[2.5rem] shadow-xl shadow-amber-100 flex flex-col md:flex-row items-center justify-between gap-6 animate-in slide-in-from-top-4 duration-500">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-2xl text-white">
              <Users size={24} />
            </div>
            <div>
              <h4 className="text-white font-black text-lg leading-tight tracking-tight">Invitaciones Pendientes</h4>
              <p className="text-amber-50 text-sm font-medium">Tienes {invitations.length} solicitudes de acceso pendientes.</p>
            </div>
          </div>
          <button
            onClick={() => onAcceptInvitation(invitations[0].permission_id)}
            className="px-8 py-3 bg-white text-amber-600 rounded-2xl font-black text-sm shadow-xl shadow-amber-700/20 hover:scale-105 active:scale-95 transition-all"
          >
            Aceptar Invitación
          </button>
        </div>
      )}

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-indigo-50/50 overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="relative flex-1 max-w-lg group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={20} />
            <input
              type="text"
              placeholder="Buscar documentos..."
              className="w-full pl-14 pr-6 py-4 bg-slate-50 border-2 border-transparent focus:border-indigo-100 focus:bg-white rounded-[1.5rem] outline-none transition-all font-bold text-slate-700 placeholder:text-slate-400"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <button className="px-5 py-2.5 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase shadow-lg shadow-indigo-100">Recientes</button>
            <button className="px-5 py-2.5 bg-slate-50 text-slate-400 rounded-2xl text-xs font-black uppercase hover:bg-slate-100 transition-all">Más Vistos</button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">
              <tr>
                <th className="px-8 py-5">Documento</th>
                <th className="px-8 py-5">Estado</th>
                <th className="px-8 py-5">Versión</th>
                <th className="px-8 py-5">Modificado</th>
                <th className="px-8 py-5 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {documents.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-8 py-32 text-center bg-slate-50/20">
                    <div className="flex flex-col items-center gap-4">
                      <div className="relative">
                        <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center shadow-2xl shadow-slate-200 border border-slate-50 rotate-6" >
                          <FileText size={48} className="text-slate-100" />
                        </div>
                        <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-xl shadow-indigo-200 -rotate-12">
                          <Plus size={24} />
                        </div>
                      </div>
                      <div className="max-w-xs mt-4">
                        <h3 className="text-xl font-black text-slate-800 tracking-tight leading-none">Sin documentos</h3>
                        <p className="text-sm text-slate-400 font-medium mt-3">Comienza creando tu primer archivo para ver el poder de DocManager Pro.</p>
                      </div>
                      <button
                        onClick={onCreateDoc}
                        className="mt-4 px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase shadow-xl hover:bg-indigo-600 transition-all active:scale-95"
                      >
                        Nuevo Proyecto
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                documents
                  .filter(d => d.name.toLowerCase().includes(searchTerm.toLowerCase()))
                  .map(doc => (
                    <tr key={doc.id} className="hover:bg-slate-50/80 transition-all group cursor-pointer" onClick={() => onOpenDoc(doc)}>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-white border border-slate-100 text-indigo-600 rounded-2xl flex items-center justify-center font-black text-xs shadow-sm group-hover:shadow-indigo-100 transition-all">
                            {(doc.name ? (doc.name.indexOf('.') > 0 ? doc.name.split('.').pop().slice(0, 3) : doc.name.slice(0, 2)).toUpperCase() : 'DOC')}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-slate-800 tracking-tight">{doc.name}</p>
                              {Number(doc.owner) !== Number(currentUser?.id) && (
                                <span className="text-[9px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full font-black uppercase tracking-tighter">Compartido</span>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1 opacity-60">Dueño: {doc.owner_name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        {doc.status === 'bloqueado' ? (
                          <div className="flex items-center gap-2 text-amber-600 bg-amber-50 w-fit px-3 py-1.5 rounded-xl text-[10px] font-black uppercase">
                            <Lock size={14} strokeWidth={3} />
                            <span>En edición by {doc.locked_by_name}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 w-fit px-3 py-1.5 rounded-xl text-[10px] font-black uppercase">
                            <CheckCircle2 size={14} strokeWidth={3} />
                            <span>Disponible</span>
                          </div>
                        )}
                      </td>
                      <td className="px-8 py-6">
                        <span className="font-black text-xs text-slate-400 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">{doc.version}</span>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex flex-col">
                          <span className="text-xs font-black text-slate-700 leading-none">{doc.last_mod}</span>
                          <span className="text-[10px] text-slate-400 font-medium mt-1 uppercase tracking-tighter">Último cambio</span>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                          <button
                            onClick={() => onOpenDoc(doc)}
                            className="p-3 bg-white hover:bg-indigo-600 hover:text-white rounded-xl text-indigo-600 border border-slate-100 hover:border-indigo-600 shadow-sm transition-all"
                          >
                            <Edit3 size={18} />
                          </button>
                          <button className="p-3 bg-white hover:bg-slate-900 hover:text-white rounded-xl text-slate-400 border border-slate-100 transition-all">
                            <MoreVertical size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
