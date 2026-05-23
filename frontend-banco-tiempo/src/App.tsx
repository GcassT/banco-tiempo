import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface Skill { id: string; nombre: string; }
interface Transaction { id: string; cantidad: number; descripcion: string; }
interface User {
  id: string;
  nombre: string;
  email: string;
  saldoHoras: number;
  habilidades: Skill[];
  enviados?: Transaction[];
  recibidos?: Transaction[];
}

function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem("token"));
  const [currentUserId, setCurrentUserId] = useState<string | null>(localStorage.getItem("userId")); 
  
  // ESTADOS DE AUTENTICACIÓN Y NAVEGACIÓN PÚBLICA
  const [authView, setAuthView] = useState<"landing" | "login" | "register">("landing");
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authMessage, setAuthMessage] = useState("");

  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [view, setView] = useState<"explorar" | "historial">("explorar");
  const [myProfile, setMyProfile] = useState<User | null>(null);

  const [horasATransferir, setHorasATransferir] = useState("");
  const [descripcionTransaccion, setDescripcionTransaccion] = useState(""); 
  const [transferMessage, setTransferMessage] = useState("");

  // ==========================================
  // LÓGICA DE REGISTRO Y LOGIN
  // ==========================================
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthMessage("");
    try {
      const response = await fetch("http://localhost:3000/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, email, password }),
      });

      if (!response.ok) throw new Error("Error al crear la cuenta");

      setAuthMessage("¡Cuenta creada con éxito! Ahora inicia sesión.");
      setAuthView("login"); // Lo mandamos a la pantalla de login
      setPassword(""); // Limpiamos la contraseña por seguridad
    } catch (error) {
      setAuthMessage("Hubo un error al registrarte. Intenta con otro correo.");
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthMessage("");
    try {
      const response = await fetch("http://localhost:3000/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) throw new Error("Credenciales incorrectas");

      const data = await response.json();
      const tokenPayload = JSON.parse(atob(data.access_token.split('.')[1]));
      const realUserId = tokenPayload.sub || tokenPayload.id; 
      
      localStorage.setItem("token", data.access_token);
      localStorage.setItem("userId", realUserId); 
      setToken(data.access_token);
      setCurrentUserId(realUserId);
      
    } catch (error) {
      setAuthMessage("Correo o contraseña incorrectos. Intenta nuevamente.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    setToken(null);
    setCurrentUserId(null);
    setUsers([]);
    setMyProfile(null);
    setView("explorar");
    setAuthView("landing");
  };

  // ==========================================
  // LÓGICA DE DATOS Y TRANSFERENCIAS (Se mantiene igual)
  // ==========================================
  const fetchUsers = async (query: string = "") => {
    try {
      const url = query ? `http://localhost:3000/users/search?skill=${query}` : `http://localhost:3000/users/search`;
      const response = await fetch(url);
      setUsers(await response.json());
    } catch (error) { console.error(error); }
  };

  const fetchMyProfile = async () => {
    if (!currentUserId) return;
    try {
      const response = await fetch(`http://localhost:3000/users/${currentUserId}`);
      setMyProfile(await response.json());
    } catch (error) { console.error(error); }
  };

  useEffect(() => {
    if (token) {
      fetchUsers();
      fetchMyProfile();
    }
  }, [token, currentUserId]);

  const handleTransfer = async (receptorId: string) => {
    setTransferMessage("");
    try {
      const response = await fetch("http://localhost:3000/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({
          senderId: currentUserId,
          receiverId: receptorId,
          cantidad: parseFloat(horasATransferir),
          descripcion: descripcionTransaccion || "Transferencia de horas" 
        }),
      });

      if (!response.ok) throw new Error("Error en la transacción");

      setTransferMessage("¡Transferencia exitosa! 🎉");
      setHorasATransferir("");
      setDescripcionTransaccion(""); 
      fetchUsers(); 
      fetchMyProfile();
      setTimeout(() => setTransferMessage(""), 3000);
    } catch (error: any) {
      setTransferMessage("Error: Verifica tu saldo o intenta de nuevo.");
    }
  };

  // ==========================================
  // ZONA PÚBLICA (Sin token)
  // ==========================================
  if (!token) {
    // 1. PÁGINA DE INICIO (LANDING PAGE)
    if (authView === "landing") {
      return (
        <div className="min-h-screen bg-zinc-50 font-sans text-zinc-900 selection:bg-zinc-200">
          {/* Navbar */}
          <nav className="flex justify-between items-center py-6 px-8 max-w-7xl mx-auto">
            <div className="text-xl font-extrabold tracking-tight">Banco de Tiempo.</div>
            <div className="space-x-4">
              <Button variant="ghost" onClick={() => { setAuthView("login"); setAuthMessage(""); }}>Iniciar sesión</Button>
              <Button onClick={() => { setAuthView("register"); setAuthMessage(""); }}>Crear cuenta</Button>
            </div>
          </nav>

          {/* Hero Section */}
          <main className="max-w-5xl mx-auto px-8 pt-24 pb-32 text-center space-y-8">
            <h1 className="text-6xl md:text-8xl font-extrabold tracking-tighter leading-tight">
              Tu tiempo es <br className="hidden md:block"/>
              <span className="text-zinc-400">tu mejor moneda.</span>
            </h1>
            <p className="text-xl text-zinc-500 max-w-2xl mx-auto">
              Únete a la nueva economía circular. Ofrece tus habilidades, gana horas y contrata a profesionales increíbles sin gastar un solo centavo.
            </p>
            <div className="pt-8 space-x-4">
              <Button size="lg" className="h-14 px-8 text-lg" onClick={() => setAuthView("register")}>
                Empezar ahora — Es gratis
              </Button>
            </div>
          </main>

          {/* Características */}
          <section className="border-t border-zinc-200 bg-white py-24">
            <div className="max-w-7xl mx-auto px-8 grid md:grid-cols-3 gap-12 text-center">
              <div className="space-y-4">
                <div className="w-12 h-12 bg-zinc-100 rounded-full flex items-center justify-center mx-auto text-xl font-bold">1</div>
                <h3 className="text-xl font-bold">Ofrece tu talento</h3>
                <p className="text-zinc-500">Completa tu perfil con tus habilidades profesionales y ayuda a otros en la comunidad.</p>
              </div>
              <div className="space-y-4">
                <div className="w-12 h-12 bg-zinc-100 rounded-full flex items-center justify-center mx-auto text-xl font-bold">2</div>
                <h3 className="text-xl font-bold">Acumula horas</h3>
                <p className="text-zinc-500">Por cada servicio que prestes, recibirás horas en tu cuenta. Tu saldo es tu poder adquisitivo.</p>
              </div>
              <div className="space-y-4">
                <div className="w-12 h-12 bg-zinc-100 rounded-full flex items-center justify-center mx-auto text-xl font-bold">3</div>
                <h3 className="text-xl font-bold">Contrata expertos</h3>
                <p className="text-zinc-500">Usa tus horas acumuladas para pagarle a otros profesionales por sus servicios.</p>
              </div>
            </div>
          </section>
        </div>
      );
    }

    // 2. FORMULARIOS DE LOGIN / REGISTRO
    return (
      <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center p-4 font-sans text-zinc-900">
        <Button variant="ghost" className="absolute top-8 left-8" onClick={() => setAuthView("landing")}>
          ← Volver al inicio
        </Button>
        
        <Card className="w-full max-w-md bg-white shadow-sm border-zinc-200">
          <CardHeader className="space-y-2 text-center pb-8">
            <CardTitle className="text-3xl font-extrabold tracking-tight">
              {authView === "login" ? "Bienvenido de nuevo" : "Crea tu cuenta"}
            </CardTitle>
            <CardDescription className="text-base">
              {authView === "login" ? "Inicia sesión para continuar" : "Únete al Banco de Tiempo"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={authView === "login" ? handleLogin : handleRegister} className="space-y-5">
              
              {/* Campo Nombre (Solo para registro) */}
              {authView === "register" && (
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-zinc-700">Nombre completo</label>
                  <Input type="text" placeholder="Ej: Alex Refero" value={nombre} onChange={(e) => setNombre(e.target.value)} required />
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-semibold text-zinc-700">Correo Electrónico</label>
                <Input type="email" placeholder="ejemplo@correo.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-semibold text-zinc-700">Contraseña</label>
                <Input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>

              {authMessage && (
                <p className={`text-sm font-medium text-center ${authMessage.includes("éxito") ? "text-emerald-600" : "text-red-500"}`}>
                  {authMessage}
                </p>
              )}
              
              <Button type="submit" className="w-full mt-4">
                {authView === "login" ? "Entrar al portal" : "Registrarme y empezar"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ==========================================
  // ZONA PRIVADA (Con token) - DASHBOARD
  // (El resto del código se mantiene exactamente igual que antes)
  // ==========================================
  return (
    <div className="min-h-screen bg-zinc-50 p-8 md:p-16 font-sans text-zinc-900">
      <div className="max-w-5xl mx-auto space-y-10">
        
        <header className="space-y-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-extrabold tracking-tight">Banco de Tiempo.</h1>
              <p className="text-lg text-zinc-500 max-w-2xl mt-2">
                Tu saldo actual es de <span className="font-bold text-emerald-600">{myProfile?.saldoHoras || 0} horas</span>.
              </p>
            </div>
            <Button variant="outline" onClick={handleLogout}>Cerrar sesión</Button>
          </div>
          
          <div className="flex space-x-2 border-b border-zinc-200 pb-px">
            <button onClick={() => setView("explorar")} className={`pb-3 px-1 text-sm font-medium transition-colors ${view === "explorar" ? "border-b-2 border-zinc-900 text-zinc-900" : "text-zinc-500 hover:text-zinc-700"}`}>
              Explorar Comunidad
            </button>
            <button onClick={() => setView("historial")} className={`pb-3 px-1 text-sm font-medium transition-colors ${view === "historial" ? "border-b-2 border-zinc-900 text-zinc-900" : "text-zinc-500 hover:text-zinc-700"}`}>
              Mi Historial
            </button>
          </div>

          {transferMessage && (
            <div className={`p-4 rounded-md text-sm font-medium ${transferMessage.includes("Error") ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"}`}>
              {transferMessage}
            </div>
          )}
        </header>

        {view === "explorar" && (
          <div className="space-y-6">
            <div className="flex w-full max-w-md items-center space-x-2">
              <Input type="text" placeholder="Buscar por habilidad..." className="bg-white" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && fetchUsers(searchTerm)} />
              <Button onClick={() => fetchUsers(searchTerm)}>Buscar</Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {users.length === 0 ? (
                <p className="text-zinc-500">No se encontraron profesionales.</p>
              ) : (
                users.map((user) => (
                  <Card key={user.id} className="bg-white shadow-sm border-zinc-200 hover:shadow-md transition-shadow flex flex-col justify-between">
                    <div>
                      <CardHeader>
                        <CardTitle className="text-xl">{user.nombre}</CardTitle>
                        <CardDescription className="text-zinc-500">{user.email}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="text-sm font-medium text-zinc-700">
                          Saldo: <span className="text-emerald-600">{user.saldoHoras} horas</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {user.habilidades.map((skill) => (
                            <span key={skill.id} className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold text-zinc-800 bg-zinc-100">
                              {skill.nombre}
                            </span>
                          ))}
                        </div>
                      </CardContent>
                    </div>
                    
                    {user.id !== currentUserId && (
                      <div className="p-6 pt-0 mt-4 border-t border-zinc-100">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="secondary" className="w-full">Transferir Tiempo</Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-md bg-white border border-zinc-200 shadow-2xl p-6">
                            <DialogHeader>
                              <DialogTitle className="text-xl font-bold">Transferir horas</DialogTitle>
                              <DialogDescription className="text-zinc-500">
                                Enviando tiempo a <span className="font-semibold text-zinc-900">{user.nombre}</span>.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-5 py-4">
                              <div className="space-y-2">
                                <label className="text-sm font-semibold text-zinc-700">Cantidad (Horas)</label>
                                <Input type="number" min="0.5" step="0.5" placeholder="Ej: 2.5" className="bg-zinc-50" value={horasATransferir} onChange={(e) => setHorasATransferir(e.target.value)} />
                              </div>
                              <div className="space-y-2">
                                <label className="text-sm font-semibold text-zinc-700">Concepto o detalle</label>
                                <Input type="text" placeholder="Ej: Por diseño de logo" className="bg-zinc-50" value={descripcionTransaccion} onChange={(e) => setDescripcionTransaccion(e.target.value)} />
                              </div>
                            </div>
                            <Button onClick={() => handleTransfer(user.id)} className="w-full font-bold">Confirmar transferencia</Button>
                          </DialogContent>
                        </Dialog>
                      </div>
                    )}
                  </Card>
                ))
              )}
            </div>
          </div>
        )}

        {view === "historial" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-zinc-900 flex items-center">
                <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2"></span> Ingresos
              </h3>
              <div className="space-y-3">
                {(!myProfile?.recibidos || myProfile.recibidos.length === 0) ? (
                  <p className="text-sm text-zinc-500 italic">Aún no has recibido horas.</p>
                ) : (
                  myProfile.recibidos.map((tx) => (
                    <div key={tx.id} className="p-4 bg-white border border-zinc-200 rounded-lg shadow-sm flex justify-between items-center">
                      <div className="truncate pr-4"><p className="text-sm font-semibold text-zinc-900 truncate">{tx.descripcion}</p></div>
                      <span className="text-emerald-600 font-bold whitespace-nowrap">+{tx.cantidad} h</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-bold text-zinc-900 flex items-center">
                <span className="w-2 h-2 rounded-full bg-red-500 mr-2"></span> Envíos
              </h3>
              <div className="space-y-3">
                {(!myProfile?.enviados || myProfile.enviados.length === 0) ? (
                  <p className="text-sm text-zinc-500 italic">Aún no has enviado horas.</p>
                ) : (
                  myProfile.enviados.map((tx) => (
                    <div key={tx.id} className="p-4 bg-white border border-zinc-200 rounded-lg shadow-sm flex justify-between items-center">
                      <div className="truncate pr-4"><p className="text-sm font-semibold text-zinc-900 truncate">{tx.descripcion}</p></div>
                      <span className="text-red-600 font-bold whitespace-nowrap">-{tx.cantidad} h</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;