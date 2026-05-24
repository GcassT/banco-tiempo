import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface Skill { id: string; nombre: string; }
interface Transaction { id: string; cantidad: number; descripcion: string; }

interface Application {
  id: string;
  estado: string;
  applicant: { id: string; nombre: string; email: string; titulo: string; bio?: string; };
}

interface Mission {
  id: string;
  titulo: string;
  descripcion: string;
  horas: number;
  estado: string;
  autorId: string;
  autor: { id: string; nombre: string; email: string; titulo?: string; };
  postulantes: Application[];
}

interface ChatMessage { id: string; contenido: string; remitenteId: string; receptorId: string; leido: boolean; }
interface User { id: string; nombre: string; email: string; titulo: string; bio?: string; linkedinUrl?: string; githubUrl?: string; saldoHoras: number; habilidades: Skill[]; enviados?: Transaction[]; recibidos?: Transaction[]; }

const getInitials = (name: string) => {
  if (!name) return "U";
  const words = name.trim().split(" ");
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return words[0][0].toUpperCase();
};

function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem("token"));
  const [currentUserId, setCurrentUserId] = useState<string | null>(localStorage.getItem("userId")); 
  
  const [authView, setAuthView] = useState<"landing" | "login" | "register">("landing");

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
  
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [regTitulo, setRegTitulo] = useState("");
  const [regBio, setRegBio] = useState("");
  const [regLinkedin, setRegLinkedin] = useState("");
  const [regGithub, setRegGithub] = useState("");
  
  const [authMessage, setAuthMessage] = useState("");

  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [suggestions, setSuggestions] = useState<{ nombre: string }[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [view, setView] = useState<"talento" | "misiones" | "mensajes" | "perfil">("talento");
  const [myProfile, setMyProfile] = useState<User | null>(null);
  const [subMisionesView, setSubMisionesView] = useState<"comunidad" | "mias">("comunidad");

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editNombre, setEditNombre] = useState("");
  const [editTitulo, setEditTitulo] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editLinkedin, setEditLinkedin] = useState("");
  const [editGithub, setEditGithub] = useState("");

  const [horasATransferir, setHorasATransferir] = useState("");
  const [descripcionTransaccion, setDescripcionTransaccion] = useState(""); 
  const [transferMessage, setTransferMessage] = useState("");

  const [missions, setMissions] = useState<Mission[]>([]);
  const [misionTitulo, setMisionTitulo] = useState("");
  const [misionDescripcion, setMisionDescripcion] = useState("");
  const [misionHoras, setMisionHoras] = useState("");

  const [activeChatUser, setActiveChatUser] = useState<User | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [nuevoMensajeTexto, setNuevoMensajeTexto] = useState("");
  const [unreadLogs, setUnreadLogs] = useState<{ remitenteId: string }[]>([]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault(); setAuthMessage("");
    try {
      const response = await fetch(`${API_URL}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, email, password, titulo: regTitulo, bio: regBio, linkedinUrl: regLinkedin, githubUrl: regGithub }),
      });
      if (!response.ok) throw new Error("Error");
      setAuthMessage("¡Perfil profesional creado! Inicia sesión."); setAuthView("login");
    } catch (error) { setAuthMessage("Hubo un error. Intenta de nuevo."); }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!response.ok) throw new Error("Error");
      const data = await response.json();
      const tokenPayload = JSON.parse(atob(data.access_token.split('.')[1]));
      localStorage.setItem("token", data.access_token);
      localStorage.setItem("userId", tokenPayload.sub || tokenPayload.id); 
      setToken(data.access_token); setCurrentUserId(tokenPayload.sub || tokenPayload.id);
    } catch (error) { setAuthMessage("Error de acceso."); }
  };

  // 👇 NUEVO: Manejadores Mock para la redirección de OAuth de cara al futuro
  const handleSocialLogin = (platform: string) => {
    // Cuando conectes tu backend real, esto redirigirá al cliente así:
    // window.location.href = `http://localhost:3000/auth/${platform}`;
    alert(`Redirigiendo al flujo seguro de autenticación con ${platform}... (Requiere configuración de Passport en Backend)`);
  };

  const handleLogout = () => {
    localStorage.clear(); setToken(null); setView("talento"); setAuthView("landing");
  };

  const fetchUsers = async (query: string = "") => {
    try {
      const url = query ? `${API_URL}users/search?skill=${query}` : `http://localhost:3000/users/search`;
      const response = await fetch(url); setUsers(await response.json());
    } catch (error) { console.error(error); }
  };

  const fetchUnreadCounts = async () => {
    if (!currentUserId) return;
    try {
      const res = await fetch(`${API_URL}/users/messages/unread-counts/${currentUserId}`);
      setUnreadLogs(await res.json());
    } catch (error) { console.error(error); }
  };

  const handleMarkAsRead = async (otherUserId: string) => {
    try {
      await fetch(`${API_URL}/users/messages/read`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ remitenteId: otherUserId, receptorId: currentUserId }),
      });
      fetchUnreadCounts();
    } catch (error) { console.error(error); }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      if (searchTerm.trim().length >= 2) {
        try {
          const res = await fetch(`${API_URL}/users/skills/suggestions?q=${searchTerm}`);
          setSuggestions(await res.json()); setShowSuggestions(true);
        } catch (error) { console.error(error); }
      } else { setSuggestions([]); setShowSuggestions(false); }
    }, 200);
    return () => clearTimeout(delayDebounce);
  }, [searchTerm]);

  const fetchMyProfile = async () => {
    if (!currentUserId) return;
    try {
      const response = await fetch(`${API_URL}/users/${currentUserId}`);
      setMyProfile(await response.json());
    } catch (error) { console.error(error); }
  };

  const fetchMissions = async () => {
    try {
      const response = await fetch(`${API_URL}/users/missions/all`);
      setMissions(await response.json());
    } catch (error) { console.error(error); }
  };

  const fetchChatHistory = async (otherUserId: string) => {
    try {
      const response = await fetch(`${API_URL}/users/messages/chat?userA=${currentUserId}&userB=${otherUserId}`);
      setChatMessages(await response.json());
    } catch (error) { console.error(error); }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault(); if (!nuevoMensajeTexto.trim() || !activeChatUser) return;
    try {
      const response = await fetch(`${API_URL}/users/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ remitenteId: currentUserId, receptorId: activeChatUser.id, contenido: nuevoMensajeTexto }),
      });
      if (response.ok) { setNuevoMensajeTexto(""); fetchChatHistory(activeChatUser.id); }
    } catch (error) { console.error(error); }
  };

  const startChatWithUser = (targetUser: any) => {
    const formattedUser: User = {
      id: targetUser.id || targetUser.autorId || "", 
      nombre: targetUser.nombre,
      email: targetUser.email,
      titulo: targetUser.titulo || "Profesional Independiente",
      saldoHoras: targetUser.saldoHoras || 0,
      habilidades: targetUser.habilidades || []
    };
    setActiveChatUser(formattedUser); handleMarkAsRead(formattedUser.id); fetchChatHistory(formattedUser.id); setView("mensajes");
  };

  const handleCreateMission = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch(`${API_URL}/users/missions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ autorId: currentUserId, titulo: misionTitulo, descripcion: misionDescripcion, horas: parseFloat(misionHoras) }),
      });
      setMisionTitulo(""); setMisionDescripcion(""); setMisionHoras(""); fetchMissions(); setSubMisionesView("mias");
    } catch (error) { console.error(error); }
  };

  const handleApplyToMission = async (mission: Mission) => {
    try {
      const response = await fetch(`${API_URL}/users/missions/${mission.id}/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicantId: currentUserId }),
      });
      if (!response.ok) { alert("Ya estás postulado."); return; }
      await fetch(`${API_URL}/users/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ remitenteId: currentUserId, receptorId: mission.autorId, contenido: `¡Hola! Acabo de postularme formalmente a tu misión: "${mission.titulo}".` }),
      });
      alert("¡Postulación enviada!"); fetchMissions();
    } catch (error) { console.error(error); }
  };

  const handleAcceptWorker = async (missionId: string, workerId: string) => {
    try {
      const response = await fetch(`${API_URL}/users/missions/${missionId}/accept`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workerId }),
      });
      if (!response.ok) { alert("Error de saldo"); return; }
      alert("¡Postulante contratado!"); fetchMissions(); fetchMyProfile();
    } catch (error) { console.error(error); }
  };

  const handleRejectApplicant = async (applicationId: string) => {
    try {
      const response = await fetch(`${API_URL}/users/applications/${applicationId}`, { method: "DELETE" });
      if (response.ok) { alert("Postulante descartado."); fetchMissions(); }
    } catch (error) { console.error(error); }
  };

  const handleCompleteMission = async (missionId: string) => {
    try {
      const response = await fetch(`${API_URL}/users/missions/${missionId}/complete`, { method: "PATCH" });
      if (!response.ok) throw new Error("Error");
      alert("¡Trabajo completado con éxito!"); fetchMissions(); fetchMyProfile();
    } catch (error) { console.error(error); }
  };

  const handleUpdateProfile = async () => {
    try {
      await fetch(`${API_URL}/users/${currentUserId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: editNombre, titulo: editTitulo, bio: editBio, linkedinUrl: editLinkedin, githubUrl: editGithub }),
      });
      await fetchMyProfile(); setIsEditingProfile(false); 
    } catch (error) { console.error(error); }
  };

  useEffect(() => { if (token) { fetchUsers(); fetchMyProfile(); fetchMissions(); fetchUnreadCounts(); } }, [token, currentUserId]);
  
  useEffect(() => {
    let interval: any;
    if (token) {
      interval = setInterval(() => {
        fetchUnreadCounts();
        if (view === "mensajes" && activeChatUser) {
          fetchChatHistory(activeChatUser.id); handleMarkAsRead(activeChatUser.id);
        }
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [token, view, activeChatUser]);

  const handleTransfer = async (receptorId: string) => {
    setTransferMessage("");
    try {
      const response = await fetch(`${API_URL}/transactions`, { method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` }, body: JSON.stringify({ senderId: currentUserId, receiverId: receptorId, cantidad: parseFloat(horasATransferir), descripcion: descripcionTransaccion || "Transferencia de horas" }), });
      if (!response.ok) throw new Error("Error");
      setTransferMessage("¡Transferencia exitosa! 🎉"); setHorasATransferir(""); setDescripcionTransaccion(""); fetchUsers(); fetchMyProfile();
      setTimeout(() => setTransferMessage(""), 3000);
    } catch (error: any) { setTransferMessage("Error en la transferencia."); }
  };

  if (!token) {
    if (authView === "landing") {
      return (
        <div className="min-h-screen bg-zinc-50 flex flex-col font-sans text-zinc-900">
          <nav className="flex justify-between items-center py-6 px-8 max-w-7xl mx-auto w-full">
            <div className="text-2xl font-black tracking-tighter">BANCO DE TIEMPO.</div>
            <div className="space-x-4"><Button variant="ghost" onClick={() => setAuthView("login")}>Entrar</Button><Button className="bg-zinc-900 text-white" onClick={() => setAuthView("register")}>Registrar Talento</Button></div>
          </nav>
          <main className="flex-grow flex flex-col items-center justify-center text-center px-8 space-y-10">
            <h1 className="text-7xl md:text-9xl font-black tracking-tighter leading-none">LA RED DE<br/><span className="text-zinc-400">EXPERTOS.</span></h1>
            <p className="text-xl text-zinc-500 max-w-2xl mx-auto">Intercambia tus habilidades profesionales. Sin dinero, solo talento y tiempo.</p>
            <Button size="lg" className="h-16 px-10 text-xl bg-zinc-900" onClick={() => setAuthView("register")}>Crear Perfil Profesional</Button>
          </main>
        </div>
      );
    }
    return (
      <div className="min-h-screen bg-zinc-100 flex flex-col items-center justify-center p-6">
        <Button variant="ghost" className="absolute top-8 left-8" onClick={() => setAuthView("landing")}>← Inicio</Button>
        <Card className="w-full max-w-xl bg-white shadow-xl border-none p-6">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-3xl font-black">{authView === "login" ? "Bienvenido" : "Únete al Marketplace"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {/* Formulario clásico */}
            <form onSubmit={authView === "login" ? handleLogin : handleRegister} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2 space-y-2"><label className="text-xs font-bold uppercase text-zinc-500">Email</label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
              <div className="md:col-span-2 space-y-2"><label className="text-xs font-bold uppercase text-zinc-500">Password</label><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /></div>
              {authView === "register" && (
                <>
                  <div className="md:col-span-2 space-y-2"><label className="text-xs font-bold uppercase text-zinc-500">Nombre Completo</label><Input value={nombre} onChange={(e) => setNombre(e.target.value)} required /></div>
                  <div className="md:col-span-2 space-y-2"><label className="text-xs font-bold uppercase text-zinc-500">Título Profesional</label><Input value={regTitulo} onChange={(e) => setRegTitulo(e.target.value)} required /></div>
                  <div className="md:col-span-2 space-y-2"><label className="text-xs font-bold uppercase text-zinc-500">Breve Resumen (Bio)</label><textarea className="w-full p-3 border rounded-md text-sm bg-zinc-50" rows={3} value={regBio} onChange={(e) => setRegBio(e.target.value)} /></div>
                  <div className="space-y-2"><label className="text-xs font-bold uppercase text-zinc-500">LinkedIn URL</label><Input placeholder="https://..." value={regLinkedin} onChange={(e) => setRegLinkedin(e.target.value)} /></div>
                  <div className="space-y-2"><label className="text-xs font-bold uppercase text-zinc-500">GitHub URL</label><Input placeholder="https://..." value={regGithub} onChange={(e) => setRegGithub(e.target.value)} /></div>
                </>
              )}
              <div className="md:col-span-2 pt-2">
                {authMessage && <p className="text-center text-sm font-bold text-emerald-600 mb-4">{authMessage}</p>}
                <Button type="submit" className="w-full bg-zinc-900 text-white h-12 font-bold">{authView === "login" ? "Entrar con Email" : "Completar mi Perfil"}</Button>
              </div>
            </form>

            {/* 👇 NUEVA SECCIÓN: DIVISOR Y BOTONES SOCIALES DE SOCIAL AUTH (OAUTH) */}
            <div className="space-y-4">
              <div className="flex items-center my-4">
                <div className="flex-grow border-t border-zinc-200"></div>
                <span className="px-3 text-xs font-bold uppercase text-zinc-400 tracking-wider">O continúa con</span>
                <div className="flex-grow border-t border-zinc-200"></div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <Button variant="outline" className="h-12 border-zinc-200 hover:bg-zinc-50 flex items-center justify-center gap-2" onClick={() => handleSocialLogin("google")}>
                  <i className="fa-brands fa-google text-red-500 text-lg"></i>
                  <span className="hidden sm:inline text-xs font-bold">Google</span>
                </Button>
                <Button variant="outline" className="h-12 border-zinc-200 hover:bg-zinc-50 flex items-center justify-center gap-2" onClick={() => handleSocialLogin("linkedin")}>
                  <i className="fa-brands fa-linkedin text-blue-600 text-lg"></i>
                  <span className="hidden sm:inline text-xs font-bold">LinkedIn</span>
                </Button>
                <Button variant="outline" className="h-12 border-zinc-200 hover:bg-zinc-50 flex items-center justify-center gap-2" onClick={() => handleSocialLogin("github")}>
                  <i className="fa-brands fa-github text-zinc-900 text-lg"></i>
                  <span className="hidden sm:inline text-xs font-bold">GitHub</span>
                </Button>
              </div>
            </div>

            <div className="text-center">
              <button type="button" className="text-xs font-bold text-zinc-400 hover:text-zinc-600" onClick={() => setAuthView(authView === "login" ? "register" : "login")}>
                {authView === "login" ? "¿No tienes cuenta? Regístrate aquí" : "¿Ya eres miembro? Inicia sesión"}
              </button>
            </div>

          </CardContent>
        </Card>
      </div>
    );
  }

  const misionesFiltradas = missions.filter(m => subMisionesView === "mias" ? m.autorId === currentUserId : m.autorId !== currentUserId);

  return (
    <div className="min-h-screen bg-zinc-50 p-6 md:p-12 font-sans text-zinc-900">
      <div className="max-w-6xl mx-auto space-y-8">
        
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-3xl font-black tracking-tighter">BANCO DE TIEMPO.</h1>
            <p className="text-sm font-bold text-emerald-600 mt-1 uppercase tracking-widest">Saldo: {myProfile?.saldoHoras} h disponibles</p>
          </div>
          
          <nav className="flex bg-zinc-200 p-1 rounded-xl relative">
            <button onClick={() => setView("talento")} className={`px-6 py-2 text-xs font-black rounded-lg transition-all ${view === "talento" ? "bg-white shadow-sm" : "text-zinc-500"}`}>CONTRATAR TALENTO</button>
            <button onClick={() => setView("misiones")} className={`px-6 py-2 text-xs font-black rounded-lg transition-all ${view === "misiones" ? "bg-white shadow-sm" : "text-zinc-500"}`}>BUSCAR TRABAJO</button>
            <button onClick={() => setView("mensajes")} className={`px-6 py-2 text-xs font-black rounded-lg transition-all relative ${view === "mensajes" ? "bg-white shadow-sm" : "text-zinc-500"}`}>
              MENSAJES
              {unreadLogs.length > 0 && ( <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> )}
            </button>
            <button onClick={() => setView("perfil")} className={`px-6 py-2 text-xs font-black rounded-lg transition-all ${view === "perfil" ? "bg-white shadow-sm" : "text-zinc-500"}`}>MI PERFIL</button>
          </nav>

          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-zinc-900 text-white flex items-center justify-center font-bold">{getInitials(myProfile?.nombre || "U")}</div>
            <Button variant="ghost" size="sm" onClick={handleLogout}>Salir</Button>
          </div>
        </header>

        {/* VISTA 1: CONTRATAR TALENTO */}
        {view === "talento" && (
          <div className="space-y-8">
            <div className="flex flex-col gap-1 max-w-md relative">
              <div className="flex gap-4">
                <Input placeholder="¿Qué experto buscas? (Ej: React, Logo, Legal)" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="bg-white border-none shadow-sm h-12" />
                <Button onClick={() => { fetchUsers(searchTerm); setShowSuggestions(false); }} className="bg-zinc-900 text-white h-12 px-8">Buscar</Button>
              </div>
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-14 left-0 w-full bg-white border border-zinc-100 rounded-xl shadow-2xl z-50 overflow-hidden divide-y divide-zinc-50">
                  {suggestions.map((suggestion, idx) => (
                    <div key={idx} onClick={() => { setSearchTerm(suggestion.nombre); fetchUsers(suggestion.nombre); setShowSuggestions(false); }} className="p-3 text-sm font-bold text-zinc-700 hover:bg-zinc-50 cursor-pointer flex items-center gap-2"><span className="text-emerald-500 text-xs"></span> {suggestion.nombre}</div>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {users.filter(u => u.id !== currentUserId).map((user) => (
                <Card key={user.id} className="bg-white border-none shadow-sm hover:shadow-xl transition-all group overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div className="w-14 h-14 rounded-2xl bg-zinc-100 flex items-center justify-center font-black text-xl text-zinc-900">{getInitials(user.nombre)}</div>
                      <div className="flex gap-2">
                        {user.linkedinUrl && <a href={user.linkedinUrl} target="_blank" className="text-zinc-400 hover:text-blue-600"><i className="fa-brands fa-linkedin text-lg"></i></a>}
                        {user.githubUrl && <a href={user.githubUrl} target="_blank" className="text-zinc-400 hover:text-black"><i className="fa-brands fa-github text-lg"></i></a>}
                      </div>
                    </div>
                    <CardTitle className="mt-4 text-xl font-black">{user.nombre}</CardTitle>
                    <CardDescription className="text-emerald-600 font-bold uppercase text-[10px] tracking-widest">{user.titulo}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-zinc-500 line-clamp-3 leading-relaxed">{user.bio || "Este profesional..."}</p>
                    <div className="pt-4 flex gap-2 border-t border-zinc-50 mt-4">
                      <Button className="flex-1 bg-zinc-900 text-white font-bold" onClick={() => startChatWithUser(user)}>Contactar</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* VISTA 2: BUSCAR TRABAJO */}
        {view === "misiones" && (
           <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
            <Card className="bg-white border-none shadow-sm md:col-span-1 p-4">
              <CardHeader><CardTitle className="text-xl font-black">Publicar Misión</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <Input placeholder="Título de la tarea" value={misionTitulo} onChange={(e) => setMisionTitulo(e.target.value)} />
                <textarea className="w-full p-3 border rounded-md text-sm h-32" placeholder="Describe el trabajo..." value={misionDescripcion} onChange={(e) => setMisionDescripcion(e.target.value)} />
                <Input type="number" placeholder="Presupuesto (Horas)" value={misionHoras} onChange={(e) => setMisionHoras(e.target.value)} />
                <Button className="w-full bg-zinc-900 text-white font-bold" onClick={handleCreateMission}>Lanzar al Tablón</Button>
              </CardContent>
            </Card>
            <div className="md:col-span-2 space-y-4">
              <div className="flex gap-2 mb-4">
                <Button variant={subMisionesView === "comunidad" ? "default" : "outline"} size="sm" onClick={() => setSubMisionesView("comunidad")}>COMUNIDAD</Button>
                <Button variant={subMisionesView === "mias" ? "default" : "outline"} size="sm" onClick={() => setSubMisionesView("mias")}>MIS PUBLICACIONES</Button>
              </div>
              {misionesFiltradas.map(m => (
                <Card key={m.id} className="bg-white border-none shadow-sm p-5 space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-black">{m.titulo}</h3>
                      <p className="text-xs font-bold text-zinc-400 uppercase tracking-wide">Estado: {m.estado} • Por {m.autor.nombre}</p>
                    </div>
                    <span className="bg-zinc-900 text-white px-3 py-1 rounded-xl font-black text-xs">{m.horas} Horas</span>
                  </div>
                  <p className="text-sm text-zinc-500 leading-relaxed">{m.descripcion}</p>
                  <div className="pt-4 border-t border-zinc-100 flex flex-col gap-3">
                    {m.autorId !== currentUserId ? (
                      m.estado === "ABIERTA" && ( <Button size="sm" className="bg-zinc-900 text-white font-bold w-fit" onClick={() => handleApplyToMission(m)}>Postularme Formalmente</Button> )
                    ) : (
                      <div className="space-y-3">
                        {m.estado === "ABIERTA" && (
                          <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-100 space-y-3">
                            <p className="text-xs font-black uppercase text-zinc-400 tracking-wider">Candidatos Postulados ({m.postulantes?.length || 0})</p>
                            {(!m.postulantes || m.postulantes.length === 0) ? ( <p className="text-xs text-zinc-400 italic">Esperando profesionales...</p> ) : (
                              <div className="space-y-2">
                                {m.postulantes.map((postulacion) => (
                                  <div key={postulacion.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-white border border-zinc-200/60 rounded-xl gap-2 shadow-xs">
                                    <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 rounded-full bg-zinc-900 text-white flex items-center justify-center font-bold text-xs">{getInitials(postulacion.applicant.nombre)}</div>
                                      <div><p className="text-xs font-black text-zinc-900">{postulacion.applicant.nombre}</p><p className="text-[10px] text-emerald-600 font-bold uppercase">{postulacion.applicant.titulo}</p></div>
                                    </div>
                                    <div className="flex gap-2">
                                      <Button size="xs" className="bg-zinc-900 text-white font-bold text-[11px] h-8 px-3" onClick={() => handleAcceptWorker(m.id, postulacion.applicant.id)}>Aceptar</Button>
                                      <Button size="xs" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 text-[11px] h-8 px-3" onClick={() => handleRejectApplicant(postulacion.id)}>Descartar</Button>
                                      <Button size="xs" variant="secondary" className="text-[11px] h-8 px-3" onClick={() => startChatWithUser(postulacion.applicant)}>Revisar Chat</Button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                        {m.estado === "PROGRESO" && ( <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold w-full h-10" onClick={() => handleCompleteMission(m.id)}>✅ Completar Trabajo y Transferir Garantía</Button> )}
                        {m.estado === "COMPLETADA" && ( <span className="inline-block text-xs font-black text-emerald-600 bg-emerald-50/60 border border-emerald-200/50 px-3 py-1.5 rounded-lg">🎉 Contrato cerrado con éxito.</span> )}
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
           </div>
        )}

        {/* VISTA 3: CENTRO DE MENSAJES */}
        {view === "mensajes" && (
          <Card className="bg-white border-none shadow-xl h-[600px] flex flex-row overflow-hidden rounded-2xl w-full">
            <div className="w-1/3 border-r border-zinc-100 p-4 space-y-4 overflow-y-auto bg-zinc-50/30 flex flex-col h-full shrink-0">
              <h3 className="text-xs font-black uppercase text-zinc-400 tracking-widest">Chats Recientes</h3>
              <div className="space-y-2 flex-grow overflow-y-auto">
                {users.filter(u => u.id !== currentUserId).map(u => {
                  const totalNoLeidos = unreadLogs.filter(log => log.remitenteId === u.id).length;
                  const estaActivo = activeChatUser?.id === u.id;
                  return (
                    <div key={u.id} onClick={() => { setActiveChatUser(u); handleMarkAsRead(u.id); }} className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${estaActivo ? "bg-zinc-900 text-white shadow-md" : "hover:bg-zinc-100 bg-white border border-zinc-100"}`}>
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs shrink-0 relative ${estaActivo ? "bg-white text-zinc-900" : "bg-zinc-900 text-white"}`}>{getInitials(u.nombre)}</div>
                      <div className="flex-grow min-w-0 flex flex-col">
                        <p className="text-sm font-black truncate">{u.nombre}</p>
                        <p className={`text-[10px] font-bold uppercase truncate ${estaActivo ? "text-zinc-300" : "text-emerald-600"}`}>{u.titulo || 'Profesional'}</p>
                      </div>
                      {!estaActivo && totalNoLeidos > 0 && ( <span className="w-5 h-5 bg-emerald-500 text-white font-black rounded-full flex items-center justify-center text-[10px] shrink-0 shadow-sm animate-bounce">{totalNoLeidos}</span> )}
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="flex-grow flex flex-col h-full bg-white justify-between">
              {activeChatUser ? (
                <>
                  <div className="p-4 border-b border-zinc-100 flex items-center gap-3 bg-white shrink-0 shadow-xs">
                    <div className="w-10 h-10 rounded-full bg-zinc-900 text-white flex items-center justify-center font-bold text-xs shrink-0">{getInitials(activeChatUser.nombre)}</div>
                    <div><p className="text-sm font-black">{activeChatUser.nombre}</p><p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">{activeChatUser.titulo}</p></div>
                  </div>
                  <div className="flex-grow p-6 overflow-y-auto space-y-4 bg-zinc-50/20 flex flex-col">
                    {chatMessages.map(m => (
                      <div key={m.id} className={`max-w-[70%] p-3 rounded-2xl text-sm font-medium shadow-xs ${m.remitenteId === currentUserId ? "bg-zinc-900 text-white self-end ml-auto rounded-tr-none" : "bg-white text-zinc-900 self-start rounded-tl-none border border-zinc-100"}`}>{m.contenido}</div>
                    ))}
                  </div>
                  <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-zinc-100 flex gap-2 shrink-0"><Input placeholder={`Escribe un mensaje seguro a ${activeChatUser.nombre}...`} value={nuevoMensajeTexto} onChange={(e) => setNuevoMensajeTexto(e.target.value)} className="border-none bg-zinc-100 h-12 rounded-xl flex-grow" /><Button type="submit" className="bg-zinc-900 text-white h-12 px-6 font-bold rounded-xl shrink-0">Enviar</Button></form>
                </>
              ) : ( <div className="m-auto text-center text-zinc-300 font-black text-xl uppercase tracking-tighter">Selecciona un profesional<br/>para negociar</div> )}
            </div>
          </Card>
        )}

        {/* VISTA 4: MI PERFIL */}
        {view === "perfil" && (
           <div className="max-w-2xl mx-auto space-y-8">
            <Card className="bg-white border-none shadow-sm p-8 rounded-2xl">
              <CardHeader className="flex flex-row items-center gap-6 pb-8 border-b border-zinc-100 mb-8">
                <div className="w-24 h-24 rounded-3xl bg-zinc-900 text-white flex items-center justify-center font-black text-4xl">{getInitials(myProfile?.nombre || "U")}</div>
                <div className="flex-grow">
                  <CardTitle className="text-3xl font-black">{myProfile?.nombre}</CardTitle>
                  <CardDescription className="text-emerald-600 font-bold uppercase tracking-widest text-xs mt-1">{myProfile?.titulo}</CardDescription>
                  <div className="flex gap-4 mt-4">
                    {myProfile?.linkedinUrl && <a href={myProfile.linkedinUrl} target="_blank" className="text-zinc-400 hover:text-blue-600"><i className="fa-brands fa-linkedin text-xl"></i></a>}
                    {myProfile?.githubUrl && <a href={myProfile.githubUrl} target="_blank" className="text-zinc-400 hover:text-black"><i className="fa-brands fa-github text-xl"></i></a>}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {isEditingProfile ? (
                  <div className="space-y-4">
                    <Input placeholder="Título Profesional" value={editTitulo} onChange={(e) => setEditTitulo(e.target.value)} />
                    <textarea className="w-full p-3 border rounded-md text-sm bg-zinc-50" rows={5} value={editBio} onChange={(e) => setEditBio(e.target.value)} />
                    <Input placeholder="LinkedIn URL" value={editLinkedin} onChange={(e) => setEditLinkedin(e.target.value)} />
                    <Input placeholder="GitHub URL" value={editGithub} onChange={(e) => setEditGithub(e.target.value)} />
                    <div className="flex gap-2"><Button className="bg-zinc-900 text-white font-bold" onClick={handleUpdateProfile}>Guardar</Button><Button variant="ghost" onClick={() => setIsEditingProfile(false)}>Cancelar</Button></div>
                  </div>
                ) : (
                  <>
                    <div><h4 className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-2">Sobre mí</h4><p className="text-zinc-600 leading-relaxed italic">{myProfile?.bio || "No has escrito nada sobre ti todavía."}</p></div>
                    <Button variant="secondary" className="w-full h-12 font-black rounded-xl" onClick={() => { setIsEditingProfile(true); setEditTitulo(myProfile?.titulo || ""); setEditBio(myProfile?.bio || ""); setEditLinkedin(myProfile?.linkedinUrl || ""); setEditGithub(myProfile?.githubUrl || ""); }}>EDITAR MI PORTAFOLIO</Button>
                  </>
                )}
              </CardContent>
            </Card>
           </div>
        )}
      </div>
    </div>
  );
}

export default App;