"use client";

import { useState } from 'react';

const TARGET_SHEETS = [
  "TRANSVERSALES",
  "ATENCIÓN PERSONA-PERSONAS",
  "HABILIDADES",
  "Promociónprevención (PAPPS)",
  "FAMILIAR",
  "GESTION CLINICA",
  "COMUNITARIA",
  "INVESTIGACIONINNOVACION",
  "CURSOS",
  "DOCENCIA",
  "SESIONES OBLIGATORIAS",
  "SESIONES IMPARTIDAS"
];

const SHEET_LABELS: Record<string, string> = {
  "TRANSVERSALES": "Transversales",
  "ATENCIÓN PERSONA-PERSONAS": "Atención Persona",
  "HABILIDADES": "Habilidades",
  "Promociónprevención (PAPPS)": "PAPPS",
  "FAMILIAR": "Familiar",
  "GESTION CLINICA": "Gestión Clínica",
  "COMUNITARIA": "Comunitaria",
  "INVESTIGACIONINNOVACION": "Investigación",
  "CURSOS": "Cursos",
  "DOCENCIA": "Docencia",
  "SESIONES": "Sesiones"
};

const SITUACION_OPTIONS = ["EN PROGRESO", "CONSEGUIDO", "NO CONSEGUIDO"];

const MAIN_SECTIONS = [
  { key: "Datos", icon: "📋", label: "Datos" },
  { key: "Entrevistas", icon: "🗣️", label: "Entrevistas" },
  { key: "Itinerario", icon: "🗺️", label: "Itinerario" },
  { key: "Competencias", icon: "🎯", label: "Competencias" },
  { key: "Actividades", icon: "📌", label: "Actividades obligatorias" },
  { key: "Otros", icon: "📁", label: "Otros" },
];

export default function Home() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [spreadsheetId, setSpreadsheetId] = useState("");
  const [spreadsheetUrl, setSpreadsheetUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const [data, setData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<string>("");
  const [updates, setUpdates] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);
  const [groupByRotation, setGroupByRotation] = useState(false);
  const [sessionForm, setSessionForm] = useState({ titulo: '', fecha: '', lugar: 'centro salud', tipo: '' });
  const [addingSession, setAddingSession] = useState(false);
  const [courseForm, setCourseForm] = useState({ titulo: '', fecha: '', lugar: '', organizador: 'Competencias Comunes', file: null as File | null });
  const [addingCourse, setAddingCourse] = useState(false);
  const [showOnlyPending, setShowOnlyPending] = useState(false);
  const [lastMeetingDate, setLastMeetingDate] = useState<string | null>(null);
  const [filterRecent, setFilterRecent] = useState(false);
  const [settingMeetingDate, setSettingMeetingDate] = useState(false);
  const [activeSection, setActiveSection] = useState("Competencias");

  // Datos form state
  const [datosForm, setDatosForm] = useState({
    unidadDocente: { nombre: '', ccaa: '', anioInicio: '', anioFinal: '', email: '' },
    residente: { nombre: '', apellido1: '', apellido2: '', email: '' },
    tutor: { nombre: '', apellido1: '', apellido2: '', email: '' },
  });
  const [datosLoaded, setDatosLoaded] = useState(false);
  const [datosLoading, setDatosLoading] = useState(false);
  const [datosSaving, setDatosSaving] = useState(false);
  const [rowMapping, setRowMapping] = useState<any>(null);

  // Entrevistas state
  const [entrevistasForm, setEntrevistasForm] = useState<any[]>([]);
  const [entrevistasLoaded, setEntrevistasLoaded] = useState(false);
  const [entrevistasLoading, setEntrevistasLoading] = useState(false);
  const [entrevistasSaving, setEntrevistasSaving] = useState(false);

  // Itinerario state
  const [itinerarioForm, setItinerarioForm] = useState<any[]>([]);
  const [itinerarioLoaded, setItinerarioLoaded] = useState(false);
  const [itinerarioLoading, setItinerarioLoading] = useState(false);
  const [itinerarioSaving, setItinerarioSaving] = useState(false);
  const [visibleItinRows, setVisibleItinRows] = useState<Record<string, number>>({});

  // Load datos when switching to Datos section
  const loadDatos = async () => {
    if (!spreadsheetId) return;
    setDatosLoading(true);
    try {
      const res = await fetch('/api/get-datos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spreadsheetId }),
      });
      const result = await res.json();
      if (res.ok) {
        setDatosForm(result.datos);
        setRowMapping(result.rowMapping);
        setDatosLoaded(true);
      }
    } catch (err) {
      console.error('Error loading datos:', err);
    } finally {
      setDatosLoading(false);
    }
  };

  const loadEntrevistas = async () => {
    if (!spreadsheetId) return;
    setEntrevistasLoading(true);
    try {
      const res = await fetch('/api/get-entrevistas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spreadsheetId }),
      });
      const result = await res.json();
      if (res.ok) {
        setEntrevistasForm(result.entrevistas);
        setEntrevistasLoaded(true);
      }
    } catch (err) {
      console.error('Error loading entrevistas:', err);
    } finally {
      setEntrevistasLoading(false);
    }
  };

  const loadItinerario = async () => {
    if (!spreadsheetId) return;
    setItinerarioLoading(true);
    try {
      const res = await fetch('/api/get-itinerario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spreadsheetId }),
      });
      const result = await res.json();
      if (res.ok) {
        setItinerarioForm(result.itinerarios);
        
        // Initialize visible rows based on filled items map across years
        const initialVisible: Record<string, number> = {};
        const years = Array.from(new Set(result.itinerarios.map((i: any) => i.year)));
        years.forEach((y: any) => {
          const yearItems = result.itinerarios.filter((i: any) => i.year === y);
          // find last index that is not empty
          let lastFilledIdx = -1;
          for (let i = 0; i < yearItems.length; i++) {
             if (!yearItems[i].isEmpty) lastFilledIdx = i;
          }
          // Show all filled items + 1 empty slot
          initialVisible[y] = lastFilledIdx + 2; 
        });
        setVisibleItinRows(initialVisible);

        setItinerarioLoaded(true);
      }
    } catch (err) {
      console.error('Error loading itinerario:', err);
    } finally {
      setItinerarioLoading(false);
    }
  };

  const handleSaveDatos = async (silent = false) => {
    setDatosSaving(true);
    try {
      const res = await fetch('/api/save-datos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spreadsheetId, datos: datosForm, rowMapping }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
    } catch (err: any) {
      alert('Error guardando datos: ' + err.message);
    } finally {
      setDatosSaving(false);
    }
  };

  const handleSaveEntrevistas = async (silent = false) => {
    setEntrevistasSaving(true);
    try {
      const res = await fetch('/api/save-entrevistas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spreadsheetId, updates: entrevistasForm }),
      });
      if (!res.ok) throw new Error('Error al guardar entrevistas');
    } catch (err: any) {
      alert('Error guardando entrevistas: ' + err.message);
    } finally {
      setEntrevistasSaving(false);
    }
  };

  const handleSaveItinerario = async (silent = false) => {
    setItinerarioSaving(true);
    try {
      const res = await fetch('/api/save-itinerario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spreadsheetId, updates: itinerarioForm }),
      });
      if (!res.ok) throw new Error('Error al guardar itinerario');
    } catch (err: any) {
      alert('Error guardando itinerario: ' + err.message);
    } finally {
      setItinerarioSaving(false);
    }
  };

  const handleGlobalSave = async () => {
    const promises = [];
    if (Object.keys(updates).length > 0) {
      promises.push(handleSave());
    }
    if (datosLoaded) {
      promises.push(handleSaveDatos());
    }
    if (entrevistasLoaded) {
      promises.push(handleSaveEntrevistas(true));
    }
    if (itinerarioLoaded) {
      promises.push(handleSaveItinerario(true));
    }
    
    if (promises.length === 0) {
      alert("No hay cambios pendientes (de competencias) o paneles cargados. Tus datos guardados están seguros.");
      return;
    }
    
    await Promise.all(promises);
    alert('¡Guardado Global Exitoso! Todos los cambios se han volcado a tu archivo.');
  };

  const handleSectionChange = (key: string) => {
    setActiveSection(key);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (key === 'Datos' && !datosLoaded && spreadsheetId) {
      setTimeout(loadDatos, 100);
    } else if (key === 'Entrevistas' && !entrevistasLoaded && spreadsheetId) {
      setTimeout(loadEntrevistas, 100);
    } else if (key === 'Itinerario' && !itinerarioLoaded && spreadsheetId) {
      setTimeout(loadItinerario, 100);
    }
  };

  // Expander state
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;

    setLoading(true);
    try {
      const cleanName = username.trim().toLowerCase().replace(/ /g, "_");
      
      const res = await fetch('/api/build-sheet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: cleanName })
      });
      const result = await res.json();
      
      if (!res.ok) throw new Error(result.error || 'Error al conectar con servidor');
      
      setSpreadsheetId(result.spreadsheetId);
      setSpreadsheetUrl(result.spreadsheetUrl);
      setUsername(cleanName);
      
      const dataRes = await fetch('/api/get-competencies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spreadsheetId: result.spreadsheetId })
      });
      const dataResult = await dataRes.json();
      
      if (!dataRes.ok) throw new Error(dataResult.error || 'Error fetching data');
      
      setData(dataResult);
      if (dataResult.lastMeetingDate) {
        setLastMeetingDate(dataResult.lastMeetingDate);
      }
      
      const firstAvailableTab = TARGET_SHEETS.find(ts => dataResult[ts]);
      if (firstAvailableTab) {
        setActiveTab(firstAvailableTab);
      }
      
      setLoggedIn(true);
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setLoggedIn(false);
    setUsername("");
    setSpreadsheetId("");
    setData(null);
    setUpdates({});
  };

  const handleTabChange = (tabName: string) => {
    setActiveTab(tabName);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUpdateStatus = (rowIdx: string, newStatus: string, statusCol: number) => {
    const key = `${activeTab}::${rowIdx}`;
    setUpdates(prev => ({
      ...prev,
      [key]: { value: newStatus, statusCol }
    }));
  };

  const handleSave = async (silent = false) => {
    if (Object.keys(updates).length === 0) return;
    setSaving(true);
    try {
      // Send the entire updates object without filtering
      const res = await fetch('/api/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          spreadsheetId,
          updates: updates // Send the whole thing. the api extracts sheetName from the composite keys
        })
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);

      // Successfully saved to backend. Now update local react state.
      const newData = { ...data };
      Object.keys(updates).forEach(key => {
        const [sheetName, rowIdx] = key.split('::');
        if (newData[sheetName]) {
          Object.keys(newData[sheetName]).forEach(domainKey => {
            const comps = newData[sheetName][domainKey];
            const compIndex = comps.findIndex((c: any) => c.rowIdx.toString() === rowIdx);
            if (compIndex > -1) {
              newData[sheetName][domainKey][compIndex].situacion = updates[key].value;
            }
          });
        }
      });
      setData(newData);
      // Clear ALL pending changes since they were all saved
      setUpdates({});
    } catch (err: any) {
      alert("Error guardando: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAddSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionForm.titulo) return;
    setAddingSession(true);
    try {
      const res = await fetch('/api/add-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          spreadsheetId,
          ...sessionForm
        })
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);

      // Recargar datos para ver la nueva sesión
      const dataRes = await fetch('/api/get-competencies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spreadsheetId })
      });
      const dataResult = await dataRes.json();
      setData(dataResult);
      
      setSessionForm({ titulo: '', fecha: '', lugar: 'centro salud', tipo: '' });
      alert("✅ Sesión registrada correctamente");
    } catch (err: any) {
      alert("Error registrando sesión: " + err.message);
    } finally {
      setAddingSession(false);
    }
  };

  const handleAddCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseForm.titulo) return;
    setAddingCourse(true);
    try {
      let certificadoUrl = "";

      // 1. Subir archivo si existe
      if (courseForm.file) {
        const uploadFormData = new FormData();
        uploadFormData.append('file', courseForm.file);
        uploadFormData.append('spreadsheetId', spreadsheetId);

        const uploadRes = await fetch('/api/upload-certificate', {
          method: 'POST',
          body: uploadFormData
        });
        const uploadResult = await uploadRes.json();
        if (!uploadRes.ok) throw new Error(uploadResult.error || "Error al subir certificado");
        certificadoUrl = uploadResult.url;
      }

      // 2. Registrar curso
      const res = await fetch('/api/add-course', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          spreadsheetId,
          titulo: courseForm.titulo,
          fecha: courseForm.fecha,
          lugar: courseForm.lugar,
          organizador: courseForm.organizador,
          certificadoUrl
        })
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);

      const dataRes = await fetch('/api/get-competencies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spreadsheetId })
      });
      const dataResult = await dataRes.json();
      setData(dataResult);
      
      setCourseForm({ titulo: '', fecha: '', lugar: '', organizador: 'Competencias Comunes', file: null });
      alert("✅ Curso registrado correctamente");
    } catch (err: any) {
      alert("Error registrando curso: " + err.message);
    } finally {
      setAddingCourse(false);
    }
  };

  const handleSetMeetingDate = async () => {
    if (!confirm("¿Seguro que quieres finalizar la reunión? Esto marcará todos los cambios actuales como 'revisados'.")) return;
    setSettingMeetingDate(true);
    try {
      const res = await fetch('/api/set-meeting-date', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spreadsheetId })
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      setLastMeetingDate(result.lastMeetingDate);
      alert("✅ Fecha de reunión actualizada correctamente.");
    } catch (err: any) {
      alert("Error actualizando fecha de reunión: " + err.message);
    } finally {
      setSettingMeetingDate(false);
    }
  };

  const toggleExpander = (id: string) => {
    setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));
  };

  if (!loggedIn) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', padding: '20px' }}>
        <div style={{ maxWidth: '420px', width: '100%', padding: '40px', background: 'var(--glass-bg)', borderRadius: '24px', border: '1px solid var(--card-border)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
          <div className="login-brand">
            <div className="icon">🩺</div>
            <div className="login-title">LIBRO DEL RESIDENTE</div>
            <div className="login-subtitle">Programa Oficial de Especialidad AFyC</div>
          </div>
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginTop: '30px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <label style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600, color: 'var(--primary-accent)' }}>Identificación de Usuario</label>
              <input 
                type="text" 
                value={username} onChange={e => setUsername(e.target.value)} 
                placeholder="Ejemplo: jaime_bona"
                style={{ padding: '16px', borderRadius: '12px', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--card-border)', color: 'white', outline: 'none', fontSize: '15px' }}
              />
            </div>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Accediendo a la base de datos..." : "Entrar al Libro"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Dashboard calculations
  const rawAvailableTabs = TARGET_SHEETS.filter(ts => data[ts]);
  
  // Virtual tabs logic: Merge OBLIGATORIAS and IMPARTIDAS into "SESIONES"
  const hasSessions = data["SESIONES OBLIGATORIAS"] || data["SESIONES IMPARTIDAS"];
  const hasCourses = data["CURSOS"] || data["OTROS CURSOS"];

  let availableTabs = rawAvailableTabs.filter(t => !t.startsWith("SESIONES") && t !== "CURSOS" && t !== "OTROS CURSOS");
  if (hasCourses) availableTabs.push("CURSOS");
  if (hasSessions) availableTabs.push("SESIONES");

  let activeDomainsObj = data[activeTab] || {};

  if (activeTab === "SESIONES") {
    activeDomainsObj = {
      "Sesiones Obligatorias": (Object.values(data["SESIONES OBLIGATORIAS"] || {}) as any[]).flat(),
      "Sesiones Impartidas": (Object.values(data["SESIONES IMPARTIDAS"] || {}) as any[]).flat(),
    };
  }

  if (activeTab === "CURSOS") {
    activeDomainsObj = {
      "Formación Programada": (Object.values(data["CURSOS"] || {}) as any[]).flat(),
      "Otros Cursos": (Object.values(data["OTROS CURSOS"] || {}) as any[]).flat(),
    };
  }

  if ((activeTab === "ATENCIÓN PERSONA-PERSONAS" || activeTab === "HABILIDADES") && groupByRotation) {
    const newDomainsObj: Record<string, any[]> = {};
    (Object.values(data[activeTab] || {}) as any[]).flat().forEach((comp: any) => {
      const rot = comp.rotacion || "Varios";
      if (!newDomainsObj[rot]) newDomainsObj[rot] = [];
      newDomainsObj[rot].push(comp);
    });
    activeDomainsObj = newDomainsObj;
  }

  const availableDomains = Object.keys(activeDomainsObj);

  const allCompsInTab = activeTab === "SESIONES" 
    ? [...Object.values(data["SESIONES OBLIGATORIAS"] || {}).flat(), ...Object.values(data["SESIONES IMPARTIDAS"] || {}).flat()]
    : activeTab === "CURSOS"
    ? [...Object.values(data["CURSOS"] || {}).flat(), ...Object.values(data["OTROS CURSOS"] || {}).flat()]
    : Object.values(data[activeTab] || {}).flat() as any[];

  let compsForStats = allCompsInTab;
  if (activeTab === "Promociónprevención (PAPPS)") {
    compsForStats = allCompsInTab.filter(c => c.competencia && c.competencia.startsWith("↳ "));
  }

  const getEffectiveStatus = (c: any) => {
    const pending = updates[`${activeTab}::${c.rowIdx}`]?.value;
    if (pending) return pending.toUpperCase();
    return (c.situacion && c.situacion.trim()) ? c.situacion.toUpperCase() : "EN PROGRESO";
  };

  const stats = {
    total: compsForStats.length,
    progreso: compsForStats.filter(c => getEffectiveStatus(c) === "EN PROGRESO").length,
    conseguido: compsForStats.filter(c => getEffectiveStatus(c) === "CONSEGUIDO").length,
    no_conseguido: compsForStats.filter(c => getEffectiveStatus(c) === "NO CONSEGUIDO").length,
  };

  const tabUpdatesCount = Object.keys(updates).filter(k => k.startsWith(`${activeTab}::`)).length;
  const globalUpdatesCount = Object.keys(updates).length;
  const hasUnsavedChanges = globalUpdatesCount > 0;

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className="app-sidebar">
        <div style={{ textAlign: "center", padding: "10px 0" }}>
          <div style={{ fontSize: "42px", marginBottom: "12px", filter: "drop-shadow(0 0 10px rgba(168, 85, 247, 0.5))" }}>🩺</div>
          <h2 style={{ margin: 0, fontSize: "20px", color: "#e879f9" }}>Libro del Residente</h2>
          <p style={{ color: "var(--text-muted)", fontSize: "13px", marginTop: "4px" }}>Medicina Familiar (AFyC)</p>
        </div>
        
        <div className="sidebar-profile">
          <p style={{ color: "var(--primary-accent)", fontSize: "11px", textTransform: "uppercase", letterSpacing: "1px", margin: "0 0 6px 0", fontWeight: 600 }}>Usuario Activo</p>
          <p style={{ color: "#fff", fontSize: "18px", fontWeight: 600, margin: 0 }}>👤 {username}</p>
        </div>

        {/* Main Section Navigation */}
        <nav className="sidebar-nav">
          {MAIN_SECTIONS.map(sec => (
            <button
              key={sec.key}
              onClick={() => handleSectionChange(sec.key)}
              className={`nav-item ${activeSection === sec.key ? 'active' : ''}`}
            >
              <span className="nav-icon">{sec.icon}</span>
              <span className="nav-label">{sec.label}</span>
            </button>
          ))}
        </nav>

        <div style={{ flex: 1 }}></div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ padding: '0 20px' }}>
            <button 
              onClick={handleSetMeetingDate} 
              disabled={settingMeetingDate}
              style={{ width: '100%', padding: '12px', borderRadius: '12px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '13px', fontWeight: 600 }}
            >
              🏁 {settingMeetingDate ? 'Guardando...' : 'Finalizar Reunión'}
            </button>
            {lastMeetingDate && (
              <p style={{ color: 'var(--text-muted)', fontSize: '10px', marginTop: '8px', textAlign: 'center' }}>
                Última tutoría: {new Date(lastMeetingDate).toLocaleDateString()}
              </p>
            )}
          </div>
          <div>
            <a href={`https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=xlsx`} target="_blank" className="btn-success" style={{ display: 'block', textDecoration: 'none', textAlign: 'center' }}>
              📥 Descargar mi Excel Original
            </a>
          </div>
          <button onClick={handleLogout} className="btn-outline">
            🚪 Cerrar Sesión de Residente
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="app-main">
        <div className="main-header animate-fade-in">
          <h1>{MAIN_SECTIONS.find(s => s.key === activeSection)?.label || activeSection}</h1>
          <p>{activeSection === 'Competencias' ? 'Gestiona y actualiza tus progresos en el Programa Oficial de Especialidad' : `Sección ${MAIN_SECTIONS.find(s => s.key === activeSection)?.label}`}</p>
        </div>

        {/* ===== PLACEHOLDER SECTIONS ===== */}
        {activeSection === 'Datos' && (
          <div className="datos-form-container animate-fade-in">
            {datosLoading ? (
              <div className="section-placeholder">
                <div className="placeholder-icon" style={{ animation: 'spin 1s linear infinite' }}>⏳</div>
                <h2>Cargando datos...</h2>
              </div>
            ) : (
              <>
                {/* UNIDAD DOCENTE */}
                <div className="datos-group">
                  <h3 className="datos-group-title">🏥 Unidad Docente</h3>
                  <div className="datos-fields">
                    <div className="datos-field">
                      <label>Nombre</label>
                      <input type="text" value={datosForm.unidadDocente.nombre} onChange={e => setDatosForm({...datosForm, unidadDocente: {...datosForm.unidadDocente, nombre: e.target.value}})} placeholder="Nombre de la Unidad Docente" />
                    </div>
                    <div className="datos-field">
                      <label>CCAA</label>
                      <input type="text" value={datosForm.unidadDocente.ccaa} onChange={e => setDatosForm({...datosForm, unidadDocente: {...datosForm.unidadDocente, ccaa: e.target.value}})} placeholder="Comunidad Autónoma" />
                    </div>
                    <div className="datos-field">
                      <label>Año Inicio Residencia</label>
                      <input type="text" value={datosForm.unidadDocente.anioInicio} onChange={e => setDatosForm({...datosForm, unidadDocente: {...datosForm.unidadDocente, anioInicio: e.target.value}})} placeholder="Ej: 2024" />
                    </div>
                    <div className="datos-field">
                      <label>Año Final Residencia</label>
                      <input type="text" value={datosForm.unidadDocente.anioFinal} onChange={e => setDatosForm({...datosForm, unidadDocente: {...datosForm.unidadDocente, anioFinal: e.target.value}})} placeholder="Ej: 2028" />
                    </div>
                    <div className="datos-field" style={{ gridColumn: '1 / -1' }}>
                      <label>Email</label>
                      <input type="email" value={datosForm.unidadDocente.email} onChange={e => setDatosForm({...datosForm, unidadDocente: {...datosForm.unidadDocente, email: e.target.value}})} placeholder="email@unidaddocente.es" />
                    </div>
                  </div>
                </div>

                {/* RESIDENTE */}
                <div className="datos-group">
                  <h3 className="datos-group-title">👨‍⚕️ Residente</h3>
                  <div className="datos-fields">
                    <div className="datos-field">
                      <label>Nombre</label>
                      <input type="text" value={datosForm.residente.nombre} onChange={e => setDatosForm({...datosForm, residente: {...datosForm.residente, nombre: e.target.value}})} placeholder="Nombre" />
                    </div>
                    <div className="datos-field">
                      <label>Apellido 1</label>
                      <input type="text" value={datosForm.residente.apellido1} onChange={e => setDatosForm({...datosForm, residente: {...datosForm.residente, apellido1: e.target.value}})} placeholder="Primer apellido" />
                    </div>
                    <div className="datos-field">
                      <label>Apellido 2</label>
                      <input type="text" value={datosForm.residente.apellido2} onChange={e => setDatosForm({...datosForm, residente: {...datosForm.residente, apellido2: e.target.value}})} placeholder="Segundo apellido" />
                    </div>
                    <div className="datos-field">
                      <label>Email</label>
                      <input type="email" value={datosForm.residente.email} onChange={e => setDatosForm({...datosForm, residente: {...datosForm.residente, email: e.target.value}})} placeholder="email@residente.es" />
                    </div>
                  </div>
                </div>

                {/* TUTOR */}
                <div className="datos-group">
                  <h3 className="datos-group-title">👩‍🏫 Tutor</h3>
                  <div className="datos-fields">
                    <div className="datos-field">
                      <label>Nombre</label>
                      <input type="text" value={datosForm.tutor.nombre} onChange={e => setDatosForm({...datosForm, tutor: {...datosForm.tutor, nombre: e.target.value}})} placeholder="Nombre" />
                    </div>
                    <div className="datos-field">
                      <label>Apellido 1</label>
                      <input type="text" value={datosForm.tutor.apellido1} onChange={e => setDatosForm({...datosForm, tutor: {...datosForm.tutor, apellido1: e.target.value}})} placeholder="Primer apellido" />
                    </div>
                    <div className="datos-field">
                      <label>Apellido 2</label>
                      <input type="text" value={datosForm.tutor.apellido2} onChange={e => setDatosForm({...datosForm, tutor: {...datosForm.tutor, apellido2: e.target.value}})} placeholder="Segundo apellido" />
                    </div>
                    <div className="datos-field">
                      <label>Email</label>
                      <input type="email" value={datosForm.tutor.email} onChange={e => setDatosForm({...datosForm, tutor: {...datosForm.tutor, email: e.target.value}})} placeholder="email@tutor.es" />
                    </div>
                  </div>
                </div>

              </>
            )}
          </div>
        )}
        {activeSection === 'Entrevistas' && (
          <div className="datos-form-container animate-fade-in">
            {entrevistasLoading ? (
              <div className="section-placeholder">
                <div className="placeholder-icon" style={{ animation: 'spin 1s linear infinite' }}>⏳</div>
                <h2>Cargando entrevistas...</h2>
              </div>
            ) : (
              <>
                {Array.from(new Set(entrevistasForm.map(e => e.year))).map(year => (
                  <div key={year} className="datos-group">
                    <h3 className="datos-group-title">📅 {year}</h3>
                    <div className="datos-fields">
                      {entrevistasForm.filter(e => e.year === year).map((entrevista, idx) => (
                        <div key={entrevista.id || idx} className="datos-field">
                          <label>{entrevista.title}</label>
                          <input 
                            type="date" 
                            value={entrevista.date || ''} 
                            onChange={(e) => {
                              const newForms = [...entrevistasForm];
                              const targetIdx = newForms.findIndex(f => f.rowNum === entrevista.rowNum);
                              if (targetIdx !== -1) newForms[targetIdx].date = e.target.value;
                              setEntrevistasForm(newForms);
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        )}
        {activeSection === 'Itinerario' && (
          <div className="datos-form-container animate-fade-in">
            {itinerarioLoading ? (
              <div className="section-placeholder">
                <div className="placeholder-icon" style={{ animation: 'spin 1s linear infinite' }}>⏳</div>
                <h2>Cargando itinerario...</h2>
              </div>
            ) : (
              <>
                {Array.from(new Set(itinerarioForm.map(i => i.year))).map(year => (
                  <div key={year} className="datos-group" style={{ padding: '24px' }}>
                    <h3 className="datos-group-title">📍 Rotaciones {year}</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {itinerarioForm.filter(i => i.year === year).slice(0, visibleItinRows[year] || 1).map((itin, idx) => (
                        <div key={itin.id || idx} style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 1.5fr) 1fr 1fr 1.5fr', gap: '12px', alignItems: 'center' }}>
                          <div className="datos-field"><label>Rotación</label>
                            <input type="text" value={itin.rotacion} placeholder="Añadir rotación" 
                                   onChange={e => {
                                     const newF = [...itinerarioForm];
                                     const iIdx = newF.findIndex(f => f.rowNum === itin.rowNum);
                                     if (iIdx > -1) newF[iIdx].rotacion = e.target.value;
                                     setItinerarioForm(newF);
                                   }} />
                          </div>
                          <div className="datos-field"><label>Fecha Inicial</label>
                            <input type="date" value={itin.fechaInicial} 
                                   onChange={e => {
                                     const newF = [...itinerarioForm];
                                     const iIdx = newF.findIndex(f => f.rowNum === itin.rowNum);
                                     if (iIdx > -1) newF[iIdx].fechaInicial = e.target.value;
                                     setItinerarioForm(newF);
                                   }} />
                          </div>
                          <div className="datos-field"><label>Fecha Final</label>
                            <input type="date" value={itin.fechaFinal} 
                                   onChange={e => {
                                     const newF = [...itinerarioForm];
                                     const iIdx = newF.findIndex(f => f.rowNum === itin.rowNum);
                                     if (iIdx > -1) newF[iIdx].fechaFinal = e.target.value;
                                     setItinerarioForm(newF);
                                   }} />
                          </div>
                          <div className="datos-field"><label>Tutor/Colaborador</label>
                            <input type="text" value={itin.tutor} placeholder="Nombre del tutor" 
                                   onChange={e => {
                                     const newF = [...itinerarioForm];
                                     const iIdx = newF.findIndex(f => f.rowNum === itin.rowNum);
                                     if (iIdx > -1) newF[iIdx].tutor = e.target.value;
                                     setItinerarioForm(newF);
                                   }} />
                          </div>
                        </div>
                      ))}
                    </div>
                    {/* Botón para añadir más filas si hay espacio en el array */}
                    {visibleItinRows[year] < itinerarioForm.filter(i => i.year === year).length && (
                      <button 
                        onClick={() => setVisibleItinRows(prev => ({ ...prev, [year]: prev[year] + 1 }))}
                        className="btn-outline"
                        style={{ marginTop: '16px', alignSelf: 'flex-start', padding: '8px 16px', fontSize: '13px' }}
                      >
                        ➕ Añadir otra rotación
                      </button>
                    )}
                    {visibleItinRows[year] >= itinerarioForm.filter(i => i.year === year).length && (
                      <div style={{ marginTop: '16px', fontSize: '12px', color: 'rgba(255,255,255,0.4)', fontStyle: 'italic' }}>
                        * Has llegado al límite de espacios configurados en el archivo Excel para {year}.
                      </div>
                    )}
                  </div>
                ))}
              </>
            )}
          </div>
        )}
        {activeSection === 'Actividades' && (
          <div className="section-placeholder animate-fade-in">
            <div className="placeholder-icon">📌</div>
            <h2>Actividades Obligatorias</h2>
            <p>Esta sección estará disponible próximamente.</p>
          </div>
        )}
        {activeSection === 'Otros' && (
          <div className="section-placeholder animate-fade-in">
            <div className="placeholder-icon">📁</div>
            <h2>Otros</h2>
            <p>Esta sección estará disponible próximamente.</p>
          </div>
        )}

        {/* ===== COMPETENCIAS SECTION (existing content) ===== */}
        {activeSection === 'Competencias' && (<>

        {/* Horizontal Scrollable Tabs */}
        <div className="tabs-wrapper animate-fade-in" style={{ animationDelay: '0.1s' }}>
          {availableTabs.map(t => (
            <button key={t} onClick={() => handleTabChange(t)} className={`tab-btn ${activeTab === t ? 'active' : ''}`}>
              {SHEET_LABELS[t] || t}
            </button>
          ))}
        </div>

        {/* Actionable Stats Grid */}
        {activeTab !== "CURSOS" && activeTab !== "SESIONES" && (
          <div className="stats-grid animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <div className="stat-card">
              <div className="stat-number">{stats.total}</div>
              <div className="stat-label">{activeTab === "Promociónprevención (PAPPS)" ? "Actividades" : "Competencias"}</div>
            </div>
            <div className="stat-card" style={{ borderColor: stats.progreso > 0 ? 'rgba(251, 191, 36, 0.4)' : '' }}>
              <div className="stat-number" style={{ background: 'linear-gradient(135deg, #fbbf24, #f59e0b)', WebkitBackgroundClip: 'text' }}>{stats.progreso}</div>
              <div className="stat-label">En Progreso</div>
            </div>
            <div className="stat-card" style={{ borderColor: stats.conseguido > 0 ? 'rgba(16, 185, 129, 0.4)' : '' }}>
              <div className="stat-number" style={{ background: 'linear-gradient(135deg, #34d399, #10b981)', WebkitBackgroundClip: 'text' }}>{stats.conseguido}</div>
              <div className="stat-label">Conseguido</div>
            </div>
            <div className="stat-card" style={{ borderColor: stats.no_conseguido > 0 ? 'rgba(248, 113, 113, 0.4)' : '' }}>
              <div className="stat-number" style={{ background: 'linear-gradient(135deg, #f87171, #ef4444)', WebkitBackgroundClip: 'text' }}>{stats.no_conseguido}</div>
              <div className="stat-label">No Logrado</div>
            </div>
          </div>
        )}

        {/* Render ALL Domains for active tab sequentially */}
        {(activeTab !== "SESIONES IMPARTIDAS" && activeTab !== "OTROS CURSOS" && activeTab !== "CONFIG") && (
          <div className="rotation-toggle-container animate-fade-in" style={{ display: 'flex', justifyContent: 'flex-end', paddingBottom: '16px', gap: '16px', flexWrap: 'wrap' }}>
            {true && (
              <>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '14px', background: 'var(--glass-bg)', padding: '8px 16px', borderRadius: '20px', border: '1px solid var(--card-border)' }}>
                  <input 
                    type="checkbox" 
                    checked={showOnlyPending} 
                    onChange={(e) => setShowOnlyPending(e.target.checked)} 
                    style={{ cursor: 'pointer', accentColor: '#ef4444' }}
                  />
                  🎯 Solo pendientes
                </label>

                <label 
                  title={!lastMeetingDate ? "Pulsa 'Finalizar Reunión' en la barra lateral para activar este filtro" : ""}
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px', 
                    cursor: !lastMeetingDate ? 'not-allowed' : 'pointer', 
                    color: 'var(--text-muted)', 
                    fontSize: '14px', 
                    background: 'var(--glass-bg)', 
                    padding: '8px 16px', 
                    borderRadius: '20px', 
                    border: '1px solid var(--card-border)',
                    opacity: !lastMeetingDate ? 0.5 : 1
                  }}
                >
                  <input 
                    type="checkbox" 
                    checked={filterRecent} 
                    onChange={(e) => setFilterRecent(e.target.checked)} 
                    disabled={!lastMeetingDate}
                    style={{ cursor: !lastMeetingDate ? 'not-allowed' : 'pointer', accentColor: '#22c55e' }}
                  />
                  🔍 {lastMeetingDate ? "Solo cambios recientes" : "Sin reuniones registradas"}
                </label>
              </>
            )}

            {(activeTab === "ATENCIÓN PERSONA-PERSONAS" || activeTab === "HABILIDADES") && (
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '14px', background: 'var(--glass-bg)', padding: '8px 16px', borderRadius: '20px', border: '1px solid var(--card-border)' }}>
                <input 
                  type="checkbox" 
                  checked={groupByRotation} 
                  onChange={(e) => setGroupByRotation(e.target.checked)} 
                  style={{ cursor: 'pointer', accentColor: 'var(--primary-accent)' }}
                />
                Agrupar por especialidades
              </label>
            )}
            {activeTab === "SESIONES" && (
              <span style={{ color: 'var(--text-muted)', fontSize: '14px', background: 'var(--glass-bg)', padding: '8px 16px', borderRadius: '20px', border: '1px solid var(--card-border)' }}>
                🗂️ Registro consolidado de sesiones
              </span>
            )}
            {activeTab === "CURSOS" && (
              <span style={{ color: 'var(--text-muted)', fontSize: '14px', background: 'var(--glass-bg)', padding: '8px 16px', borderRadius: '20px', border: '1px solid var(--card-border)' }}>
                📚 Registro consolidado de cursos
              </span>
            )}
          </div>
        )}
        <div className="animate-fade-in" style={{ animationDelay: '0.3s' }}>
          {availableDomains.map((domainName) => {
            let comps = activeDomainsObj[domainName];
            if (!comps || comps.length === 0) return null;

            if (showOnlyPending && activeTab !== "CURSOS" && activeTab !== "SESIONES") {
              comps = comps.filter((c: any) => {
                const status = (updates[`${activeTab}::${c.rowIdx}`]?.value || c.situacion || "").toUpperCase();
                return status !== "CONSEGUIDO" && status !== "REALIZADO";
              });
            }

            if (filterRecent && lastMeetingDate) {
              const meetingTime = new Date(lastMeetingDate).getTime();
              comps = comps.filter((c: any) => {
                if (!c.lastModified) return false;
                return new Date(c.lastModified).getTime() > meetingTime;
              });
            }

            if (comps.length === 0) return null;

            return (
              <div key={domainName} className="domain-section">
                <div className="domain-header">
                  <h3 className="domain-title">{domainName}</h3>
                  <span className="domain-badge">{comps.length} competencias</span>
                </div>

                <div className="domain-competencies">
                  {comps.map((comp: any) => {
                    const rowId = comp.rowIdx.toString();
                    const updateKey = `${activeTab}::${rowId}`;
                    const currentStatus = updates[updateKey]?.value || (comp.situacion ? comp.situacion.toUpperCase() : 'EN PROGRESO');
                    const hasExtraInfo = comp.actividad || comp.recomendaciones;

                    // Skip empty rows or placeholders in Sesiones Impartidas if they don't have a real title
                    if (domainName === "Sesiones Impartidas" && (!comp.competencia || comp.competencia.toLowerCase().includes("título"))) return null;
                    if (domainName === "Otros Cursos" && (!comp.competencia || comp.competencia.toLowerCase().includes("título"))) return null;

                    const isSubActivity = comp.competencia?.startsWith("↳ ");
                    return (
                      <div key={rowId}>
                        <div className={`comp-row ${isSubActivity ? 'sub-activity' : ''}`} style={isSubActivity ? { marginLeft: '24px', background: 'rgba(168, 85, 247, 0.05)', borderLeft: '3px solid var(--primary-accent)' } : {}}>
                          {!isSubActivity && <div className="comp-id">{comp.number}</div>}
                          <div className="comp-title" style={isSubActivity ? { color: 'rgba(255,255,255,0.85)', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' } : {}}>
                            {isSubActivity ? <span style={{ color: 'var(--primary-accent)', fontSize: '16px' }}>🔸</span> : null}
                            {isSubActivity ? comp.competencia.replace("↳ ", "") : comp.competencia}
                          </div>
                          
                          {(domainName === "Sesiones Impartidas" || domainName === "Otros Cursos") ? (
                            <div style={{ display: 'flex', gap: '12px', fontSize: '13px', color: 'var(--text-muted)', flexWrap: 'wrap', justifyContent: 'flex-end', flex: 1, marginRight: '10px' }}>
                              {domainName === "Sesiones Impartidas" ? (
                                <>
                                  <span style={{ background: 'rgba(255,255,255,0.05)', padding: '4px 10px', borderRadius: '6px', border: '1px solid var(--card-border)' }}>📅 {comp.actividad || '---'}</span>
                                  <span style={{ background: 'rgba(255,255,255,0.05)', padding: '4px 10px', borderRadius: '6px', border: '1px solid var(--card-border)' }}>📍 {comp.recomendaciones || '---'}</span>
                                  <span style={{ background: 'var(--primary-accent)', color: 'white', padding: '4px 10px', borderRadius: '6px', fontWeight: 600 }}>{comp.situacion || '---'}</span>
                                </>
                              ) : (
                                <>
                                  <span style={{ background: 'rgba(255,255,255,0.05)', padding: '4px 10px', borderRadius: '6px', border: '1px solid var(--card-border)' }}>📅 {comp.actividad || '---'}</span>
                                  <span style={{ background: 'rgba(255,255,255,0.05)', padding: '4px 10px', borderRadius: '6px', border: '1px solid var(--card-border)' }}>🏛️ {comp.recomendaciones || '---'}</span>
                                  <span style={{ background: 'var(--primary-accent)', color: 'white', padding: '4px 10px', borderRadius: '6px', fontWeight: 600 }}>🏷️ {comp.rotacion || '---'}</span>
                                  {comp.certificateUrl && (
                                    <a href={comp.certificateUrl} target="_blank" rel="noopener noreferrer" style={{ background: 'rgba(34,197,94,0.1)', color: '#4ade80', padding: '4px 10px', borderRadius: '6px', border: '1px solid #22c55e', textDecoration: 'none', fontSize: '11px', fontWeight: 'bold' }}>
                                      📄 VER CERTIFICADO
                                    </a>
                                  )}
                                </>
                              )}
                            </div>
                          ) : (
                            <div className="status-selector">
                              {domainName === "Formación Programada" ? (
                                <button 
                                  onClick={() => handleUpdateStatus(rowId, currentStatus === "REALIZADO" ? "" : "REALIZADO", comp.statusCol)}
                                  className={`status-pill ${currentStatus === "REALIZADO" ? "active-conseguido" : ""}`}
                                  style={{ minWidth: '120px' }}
                                >
                                  {currentStatus === "REALIZADO" ? "REALIZADO" : "PENDIENTE"}
                                </button>
                              ) : (
                                (isSubActivity ? ["EN PROGRESO", "CONSEGUIDO"] : SITUACION_OPTIONS).map(opt => {
                                  const isActive = currentStatus === opt;
                                  let activeClass = "";
                                  if (isActive && opt === "EN PROGRESO") activeClass = "active-progreso";
                                  if (isActive && opt === "CONSEGUIDO") activeClass = "active-conseguido";
                                  if (isActive && opt === "NO CONSEGUIDO") activeClass = "active-no-conseguido";

                                  return (
                                    <button 
                                      key={opt}
                                      onClick={() => handleUpdateStatus(rowId, opt, comp.statusCol)}
                                      className={`status-pill ${activeClass}`}
                                    >
                                      {opt}
                                    </button>
                                  );
                                })
                              )}
                            </div>
                          )}

                          {hasExtraInfo && domainName !== "Sesiones Impartidas" && domainName !== "Otros Cursos" && (
                            <button onClick={() => toggleExpander(rowId)} className="comp-details-toggle" title="Ver actividades o recomendaciones">
                              {expandedRows[rowId] ? '▼' : '▶'}
                            </button>
                          )}
                        </div>

                        {hasExtraInfo && expandedRows[rowId] && domainName !== "Sesiones Impartidas" && domainName !== "Otros Cursos" && (
                          <div className="comp-details-box animate-fade-in">
                            {comp.actividad && (
                              <div className="comp-details-item">
                                <div className="comp-details-label">📋 Actividad Formativa Formativa recomendada</div>
                                <div className="comp-details-text">{comp.actividad}</div>
                              </div>
                            )}
                            {comp.recomendaciones && (
                              <div className="comp-details-item" style={{ marginTop: comp.actividad ? '16px' : '0' }}>
                                <div className="comp-details-label">💡 Recomendaciones de mejora</div>
                                <div className="comp-details-text">{comp.recomendaciones}</div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* New Session Form for SESIONES tab */}
        {activeTab === "SESIONES" && (
          <div className="domain-section animate-fade-in" style={{ marginTop: '40px', border: '1px dashed var(--primary-accent)', background: 'rgba(168, 85, 247, 0.05)' }}>
            <div className="domain-header">
              <h3 className="domain-title">📝 Registro de Nueva Sesión</h3>
              <span className="domain-badge">Residencia</span>
            </div>
            
            <form onSubmit={handleAddSession} style={{ padding: '24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--primary-accent)' }}>Título de la Sesión</label>
                <input 
                  type="text" required placeholder="Ej: Manejo de HTA..." value={sessionForm.titulo}
                  onChange={e => setSessionForm({...sessionForm, titulo: e.target.value})}
                  style={{ padding: '12px', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--card-border)', color: 'white' }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--primary-accent)' }}>Fecha</label>
                <input 
                  type="date" value={sessionForm.fecha}
                  onChange={e => setSessionForm({...sessionForm, fecha: e.target.value})}
                  style={{ padding: '12px', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--card-border)', color: 'white' }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--primary-accent)' }}>Lugar</label>
                <select 
                  value={sessionForm.lugar}
                  onChange={e => setSessionForm({...sessionForm, lugar: e.target.value})}
                  style={{ padding: '12px', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--card-border)', color: 'white' }}
                >
                  <option value="centro salud">Centro salud</option>
                  <option value="servicio hospitalario">Servicio hospitalario</option>
                  <option value="sesión de la UD">Sesión de la UD</option>
                  <option value="comunidad">Comunidad</option>
                  <option value="otros">Otros</option>
                </select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--primary-accent)' }}>Tipo de sesión</label>
                <input 
                  type="text" placeholder="Ej: Clínica, Bibliográfica..." value={sessionForm.tipo}
                  onChange={e => setSessionForm({...sessionForm, tipo: e.target.value})}
                  style={{ padding: '12px', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--card-border)', color: 'white' }}
                />
              </div>
              <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button type="submit" className="btn-primary" disabled={addingSession} style={{ padding: '12px 32px' }}>
                  {addingSession ? 'Registrando...' : '➕ Registrar Sesión en Excel'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* New Course Form for CURSOS tab */}
        {activeTab === "CURSOS" && (
          <div className="domain-section animate-fade-in" style={{ marginTop: '40px', border: '1px dashed var(--primary-accent)', background: 'rgba(168, 85, 247, 0.05)' }}>
            <div className="domain-header">
              <h3 className="domain-title">📝 Registro de Otros Cursos</h3>
              <span className="domain-badge">Formación Adicional</span>
            </div>
            
            <form onSubmit={handleAddCourse} style={{ padding: '24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--primary-accent)' }}>Título del Curso</label>
                <input 
                  type="text" required placeholder="Ej: Soporte Vital Avanzado..." value={courseForm.titulo}
                  onChange={e => setCourseForm({...courseForm, titulo: e.target.value})}
                  style={{ padding: '12px', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--card-border)', color: 'white' }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--primary-accent)' }}>Fecha</label>
                <input 
                  type="date" value={courseForm.fecha}
                  onChange={e => setCourseForm({...courseForm, fecha: e.target.value})}
                  style={{ padding: '12px', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--card-border)', color: 'white' }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--primary-accent)' }}>Lugar</label>
                <input 
                  type="text" placeholder="Ej: Hospital La Fe..." value={courseForm.lugar}
                  onChange={e => setCourseForm({...courseForm, lugar: e.target.value})}
                  style={{ padding: '12px', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--card-border)', color: 'white' }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--primary-accent)' }}>Organizador</label>
                <select 
                  value={courseForm.organizador}
                  onChange={e => setCourseForm({...courseForm, organizador: e.target.value})}
                  style={{ padding: '12px', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--card-border)', color: 'white' }}
                >
                  <option value="Competencias Comunes">Competencias Comunes</option>
                  <option value="UD">UD</option>
                  <option value="Colegio de Médicos">Colegio de Médicos</option>
                  <option value="Otros">Otros</option>
                </select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--primary-accent)' }}>Certificado (PDF/JPG)</label>
                <input 
                  type="file" accept=".pdf,image/*"
                  onChange={e => setCourseForm({...courseForm, file: e.target.files?.[0] || null})}
                  style={{ padding: '8px', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--card-border)', color: 'white', fontSize: '12px' }}
                />
              </div>
              <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button type="submit" className="btn-primary" disabled={addingCourse} style={{ padding: '12px 32px' }}>
                  {addingCourse ? 'Subiendo y Registrando...' : '➕ Registrar Curso y Certificado'}
                </button>
              </div>
            </form>
          </div>
        )}
        </>)}
      </main>

      {/* Floating Global Save Button */}
      {spreadsheetId && (
        <button 
          onClick={handleGlobalSave} 
          className="btn-primary hover-glow animate-fade-in" 
          disabled={datosSaving || entrevistasSaving || itinerarioSaving || saving}
          style={{
            position: 'fixed',
            bottom: '32px',
            right: '32px',
            padding: '16px 28px',
            fontSize: '16px',
            fontWeight: '600',
            boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            borderRadius: '100px',
            transition: 'all 0.3s ease',
            border: '1px solid rgba(255,255,255,0.2)'
          }}
        >
          { (datosSaving || entrevistasSaving || itinerarioSaving || saving) ? '⏳ Guardando todo...' : '💾 Guardar cambios' }
        </button>
      )}
    </div>
  );
}
