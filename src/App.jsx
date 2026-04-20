import { useState, useRef, useEffect, useCallback } from "react";

const SUPABASE_URL = "https://lgehirhemjlgzqqrohcp.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxnZWhpcmhlbWpsZ3pxcXJvaGNwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYzODQ1NTksImV4cCI6MjA5MTk2MDU1OX0._HbY2mLPULoSXxxP99z_kgngBFZkATbpghjtauuWmNE";

const H = { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json" };
const db = {
  async get(table, qs = "") { const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?order=id${qs}`, { headers: H }); return r.json(); },
  async insert(table, data) { const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, { method:"POST", headers:{...H,Prefer:"return=representation"}, body:JSON.stringify(data) }); return r.json(); },
  async update(table, id, data) { const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, { method:"PATCH", headers:{...H,Prefer:"return=representation"}, body:JSON.stringify(data) }); return r.json(); },
  async del(table, id) { await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, { method:"DELETE", headers:H }); }
};

const TIPOS = ["Excavadora","Grúa","Camión","Compactadora","Retroexcavadora","Motoniveladora","Vehículo liviano","Generador"];
const ESTADOS = ["Operativo","En mantenimiento","Fuera de servicio","Disponible"];
const ROLES_INFO = {
  maquinista:    {label:"Maquinista",   emoji:"👷",color:"#166534",bg:"#dcfce7"},
  mecanico:      {label:"Mecánico",     emoji:"🔧",color:"#9a3412",bg:"#ffedd5"},
  supervisor:    {label:"Supervisor",   emoji:"📋",color:"#1e40af",bg:"#dbeafe"},
  administrador: {label:"Administrador",emoji:"⚙️",color:"#6b21a8",bg:"#f3e8ff"},
};
const CE = {
  "Operativo":        {bg:"#dcfce7",text:"#166534",dot:"#22c55e",pin:"#22c55e"},
  "En mantenimiento": {bg:"#fef9c3",text:"#854d0e",dot:"#eab308",pin:"#eab308"},
  "Fuera de servicio":{bg:"#fee2e2",text:"#991b1b",dot:"#ef4444",pin:"#ef4444"},
  "Disponible":       {bg:"#dbeafe",text:"#1e40af",dot:"#3b82f6",pin:"#3b82f6"},
};
const PC = {"Crítica":"#ef4444","Alta":"#f97316","Media":"#eab308","Baja":"#22c55e"};

const puede = {
  editarDatos:    r=>r==="administrador",
  cargarFotos:    r=>r==="administrador",
  verFotos:       r=>r==="supervisor"||r==="administrador",
  gestionarFallas:r=>r==="mecanico"||r==="administrador",
  reportarFallas: r=>r==="maquinista"||r==="administrador",
  verHistorial:   r=>r==="supervisor"||r==="administrador",
  agregarEquipo:  r=>r==="administrador",
  gestionarUsers: r=>r==="administrador",
  gestionarObras: r=>r==="administrador",
};

async function logH(user, accion, detalle) {
  const fecha = new Date().toLocaleString("es-AR",{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"});
  await db.insert("historial",{nombre:user.nombre,rol:user.rol,accion,detalle,fecha});
}

const FS = {width:"100%",padding:"9px 12px",borderRadius:9,border:"1.5px solid #e5e7eb",fontSize:13,boxSizing:"border-box",outline:"none"};
const LS = {fontSize:12,fontWeight:600,color:"#374151",display:"block",marginBottom:5};
const BP = {width:"100%",padding:"11px",background:"#1e3a5f",color:"#fff",border:"none",borderRadius:10,fontWeight:700,fontSize:14,cursor:"pointer"};
const BS = {padding:"11px 16px",background:"#f3f4f6",color:"#374151",border:"none",borderRadius:10,fontWeight:600,fontSize:13,cursor:"pointer"};

function Badge({estado}){const c=CE[estado]||{bg:"#f3f4f6",text:"#374151",dot:"#9ca3af"};return<span style={{background:c.bg,color:c.text,padding:"3px 10px",borderRadius:20,fontSize:12,fontWeight:600,display:"inline-flex",alignItems:"center",gap:5}}><span style={{width:7,height:7,borderRadius:"50%",background:c.dot,display:"inline-block"}}/>{estado}</span>;}
function RolTag({rol}){const r=ROLES_INFO[rol]||{label:rol,emoji:"",color:"#374151",bg:"#f3f4f6"};return<span style={{background:r.bg,color:r.color,borderRadius:20,padding:"2px 9px",fontSize:11,fontWeight:700}}>{r.emoji} {r.label}</span>;}
function Spinner(){return<div style={{display:"flex",alignItems:"center",justifyContent:"center",padding:"80px 20px",flexDirection:"column",gap:14}}><div style={{width:36,height:36,border:"4px solid #e5e7eb",borderTop:"4px solid #1e3a5f",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/><div style={{fontSize:13,color:"#9ca3af"}}>Cargando datos...</div><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style></div>;}
function Modal({title,onClose,children,maxWidth=560}){return<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.55)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}><div style={{background:"#fff",borderRadius:16,width:"100%",maxWidth,maxHeight:"92vh",overflowY:"auto",boxShadow:"0 25px 60px rgba(0,0,0,0.3)"}}><div style={{padding:"18px 24px 14px",borderBottom:"1px solid #f0f0f0",display:"flex",justifyContent:"space-between",alignItems:"center",position:"sticky",top:0,background:"#fff",zIndex:10}}><h3 style={{margin:0,fontSize:16,fontWeight:700,color:"#111"}}>{title}</h3><button onClick={onClose} style={{background:"#f3f4f6",border:"none",borderRadius:8,width:32,height:32,cursor:"pointer",fontSize:18,color:"#6b7280"}}>✕</button></div><div style={{padding:24}}>{children}</div></div></div>;}

function LoginModal({onLogin}){
  const[u,setU]=useState("");const[c,setC]=useState("");const[err,setErr]=useState("");const[show,setShow]=useState(false);const[load,setLoad]=useState(false);
  const handle=async()=>{
    if(!u.trim()||!c){setErr("Completá usuario y clave.");return;}
    setLoad(true);
    try{
      const res=await db.get("usuarios",`&usuario=eq.${encodeURIComponent(u.trim().toLowerCase())}`);
      const found=Array.isArray(res)&&res.find(x=>x.clave===c);
      if(found){onLogin(found);}else{setErr("Usuario o clave incorrectos.");setC("");}
    }catch{setErr("Error de conexión.");}
    setLoad(false);
  };
  return<div style={{position:"fixed",inset:0,background:"linear-gradient(135deg,#1e3a5f,#0f2027)",zIndex:2000,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
    <div style={{background:"#fff",borderRadius:20,padding:36,width:"100%",maxWidth:380,boxShadow:"0 30px 80px rgba(0,0,0,0.4)"}}>
      <div style={{textAlign:"center",marginBottom:28}}><div style={{fontSize:46,marginBottom:8}}>🏗️</div><h2 style={{margin:"0 0 4px",fontSize:22,fontWeight:800,color:"#111",fontFamily:"Georgia,serif"}}>FleetOps</h2><p style={{color:"#6b7280",fontSize:13,margin:0}}>Gestión de equipos y maquinaria</p></div>
      <div style={{marginBottom:14}}><label style={LS}>USUARIO</label><input value={u} onChange={e=>{setU(e.target.value);setErr("");}} onKeyDown={e=>e.key==="Enter"&&handle()} placeholder="Tu nombre de usuario" autoCapitalize="none" style={{...FS,border:`2px solid ${err?"#ef4444":"#e5e7eb"}`,fontSize:14}}/></div>
      <div style={{marginBottom:8}}><label style={LS}>CLAVE</label><div style={{position:"relative"}}><input type={show?"text":"password"} value={c} onChange={e=>{setC(e.target.value);setErr("");}} onKeyDown={e=>e.key==="Enter"&&handle()} placeholder="Tu clave" style={{...FS,border:`2px solid ${err?"#ef4444":"#e5e7eb"}`,fontSize:14,paddingRight:40}}/><button onClick={()=>setShow(p=>!p)} style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",fontSize:16,color:"#9ca3af"}}>{show?"🙈":"👁"}</button></div></div>
      {err&&<p style={{color:"#ef4444",fontSize:12,margin:"4px 0 10px"}}>{err}</p>}
      <button onClick={handle} disabled={load} style={{...BP,marginTop:err?0:12,fontSize:15,padding:"13px",opacity:load?0.7:1}}>{load?"Verificando...":"Ingresar →"}</button>
      <p style={{color:"#d1d5db",fontSize:11,textAlign:"center",marginTop:20,marginBottom:0}}>Si no tenés usuario, solicitalo al administrador.</p>
    </div>
  </div>;
}

function MapaLeaflet({equipos,obras}){
  const mapRef=useRef(null);const mapObj=useRef(null);const mRef=useRef([]);
  const svg=(color,count)=>`<svg xmlns="http://www.w3.org/2000/svg" width="36" height="44" viewBox="0 0 36 44"><ellipse cx="18" cy="40" rx="6" ry="3" fill="rgba(0,0,0,0.18)"/><path d="M18 2 C9 2 2 9 2 18 C2 30 18 42 18 42 C18 42 34 30 34 18 C34 9 27 2 18 2Z" fill="${color}" stroke="white" stroke-width="2"/><circle cx="18" cy="18" r="9" fill="white" fill-opacity="0.92"/><text x="18" y="22" text-anchor="middle" font-size="11" font-weight="bold" fill="${color}">${count}</text></svg>`;
  const update=useCallback(()=>{
    const L=window.L;if(!L||!mapObj.current)return;
    mRef.current.forEach(m=>m.remove());mRef.current=[];
    obras.forEach(obra=>{
      if(!obra.lat||!obra.lng)return;
      const eqs=equipos.filter(e=>e.obra_id===obra.id);if(eqs.length===0)return;
      const crit=eqs.some(e=>e.fallas?.some(f=>f.prioridad==="Crítica"&&f.estado!=="Resuelto"));
      const fuera=eqs.some(e=>e.estado==="Fuera de servicio");
      const mant=eqs.some(e=>e.estado==="En mantenimiento");
      const col=crit||fuera?"#ef4444":mant?"#eab308":"#1e3a5f";
      const icon=L.divIcon({html:svg(col,eqs.length),iconSize:[36,44],iconAnchor:[18,44],popupAnchor:[0,-44],className:""});
      const popup=`<div style="min-width:200px;font-family:sans-serif"><div style="font-weight:800;font-size:14px;color:#1e3a5f;margin-bottom:8px;border-bottom:2px solid #e5e7eb;padding-bottom:6px">${obra.nombre}</div><div style="font-size:11px;color:#9ca3af;margin-bottom:8px">📍 ${obra.direccion}</div>${eqs.map(e=>{const c=CE[e.estado]||{dot:"#9ca3af"};const fa=e.fallas?.filter(f=>f.estado!=="Resuelto").length||0;return`<div style="display:flex;align-items:center;gap:6px;padding:4px 0;border-bottom:1px solid #f3f4f6"><span style="width:8px;height:8px;border-radius:50%;background:${c.dot};flex-shrink:0;display:inline-block"></span><div><div style="font-size:12px;font-weight:600;color:#111">${e.codigo} · ${e.nombre}</div><div style="font-size:11px;color:#6b7280">${e.estado}${e.responsable?" · "+e.responsable:""}${fa>0?` · ⚠ ${fa} falla${fa>1?"s":""}`:""}}</div></div></div>`;}).join("")}</div>`;
      const marker=L.marker([obra.lat,obra.lng],{icon}).addTo(mapObj.current).bindPopup(popup,{maxWidth:280});
      mRef.current.push(marker);
    });
    if(mRef.current.length>0){const g=L.featureGroup(mRef.current);mapObj.current.fitBounds(g.getBounds().pad(0.2));}
  },[equipos,obras]);
  useEffect(()=>{
    const init=()=>{if(mapObj.current||!mapRef.current)return;const L=window.L;mapObj.current=L.map(mapRef.current,{zoomControl:true}).setView([-34.62,-58.44],11);L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{attribution:"© OpenStreetMap",maxZoom:19}).addTo(mapObj.current);update();};
    if(!window.L){const lk=document.createElement("link");lk.rel="stylesheet";lk.href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css";document.head.appendChild(lk);const sc=document.createElement("script");sc.src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js";sc.onload=init;document.head.appendChild(sc);}else{init();}
    return()=>{if(mapObj.current){mapObj.current.remove();mapObj.current=null;}};
  },[]);
  useEffect(()=>{if(mapObj.current)update();},[update]);
  return<div><div style={{display:"flex",gap:12,flexWrap:"wrap",marginBottom:12}}>{[["#1e3a5f","Sin alertas"],["#eab308","En mantenimiento"],["#ef4444","Fuera de servicio / Falla crítica"]].map(([col,lbl])=><div key={lbl} style={{display:"flex",alignItems:"center",gap:6,fontSize:12,color:"#374151"}}><span style={{width:12,height:12,borderRadius:"50%",background:col,display:"inline-block"}}/>{lbl}</div>)}</div><div ref={mapRef} style={{height:400,borderRadius:14,border:"1px solid #e2e8f0",overflow:"hidden",zIndex:0}}/><p style={{fontSize:11,color:"#9ca3af",marginTop:8}}>Tocá cada pin para ver los equipos de esa obra.</p></div>;
}

function GestionObras({obras,recargar,user}){
  const V={nombre:"",direccion:"",lat:"",lng:""};
  const[modo,setModo]=useState(null);const[form,setForm]=useState(V);const[err,setErr]=useState("");const[ok,setOk]=useState("");const[load,setLoad]=useState(false);const[conf,setConf]=useState(null);
  const exito=msg=>{setOk(msg);setTimeout(()=>setOk(""),3000);};
  const val=()=>{if(!form.nombre.trim())return"Nombre obligatorio.";if(!form.direccion.trim())return"Dirección obligatoria.";if(isNaN(parseFloat(form.lat)))return"Latitud inválida.";if(isNaN(parseFloat(form.lng)))return"Longitud inválida.";return null;};
  const guardar=async()=>{const e=val();if(e){setErr(e);return;}setLoad(true);const d={nombre:form.nombre.trim(),direccion:form.direccion.trim(),lat:parseFloat(form.lat),lng:parseFloat(form.lng)};if(modo==="nueva"){await db.insert("obras",d);await logH(user,"Obra agregada",`${d.nombre} · ${d.direccion}`);}else{await db.update("obras",modo,d);await logH(user,"Obra editada",`${d.nombre} · ${d.direccion}`);}await recargar();exito("✓ Guardado");setModo(null);setForm(V);setErr("");setLoad(false);};
  const eliminar=async obra=>{setLoad(true);await db.del("obras",obra.id);await logH(user,"Obra eliminada",obra.nombre);await recargar();exito("✓ Eliminada");setConf(null);setLoad(false);};
  return<div>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}><h3 style={{margin:0,fontSize:15,fontWeight:700,color:"#1e3a5f"}}>🏗️ Gestión de obras</h3>{!modo&&<button onClick={()=>{setModo("nueva");setForm(V);setErr("");}} style={{...BP,width:"auto",padding:"8px 16px",fontSize:13}}>+ Nueva obra</button>}</div>
    <p style={{fontSize:13,color:"#6b7280",marginTop:4,marginBottom:16}}>Administrá las obras y sus coordenadas para el mapa.</p>
    <div style={{background:"#eff6ff",border:"1px solid #bfdbfe",borderRadius:10,padding:"10px 14px",fontSize:12,color:"#1e40af",marginBottom:16}}>💡 <b>¿Cómo obtener coordenadas?</b> Abrí Google Maps, clic derecho sobre la ubicación y copiá los dos números (ej: -34.6037, -58.3816). El primero es latitud y el segundo longitud.</div>
    {ok&&<div style={{background:"#dcfce7",border:"1px solid #bbf7d0",borderRadius:10,padding:"10px 14px",fontSize:13,color:"#166534",fontWeight:600,marginBottom:14}}>{ok}</div>}
    {modo&&<div style={{background:"#f8fafc",borderRadius:12,padding:16,border:"1.5px solid #e2e8f0",marginBottom:16}}>
      <h4 style={{margin:"0 0 14px",fontSize:14,fontWeight:700,color:"#1e3a5f"}}>{modo==="nueva"?"➕ Nueva obra":"✏️ Editar obra"}</h4>
      <div style={{marginBottom:10}}><label style={LS}>Nombre *</label><input value={form.nombre} onChange={e=>{setForm(p=>({...p,nombre:e.target.value}));setErr("");}} style={FS}/></div>
      <div style={{marginBottom:10}}><label style={LS}>Dirección *</label><input value={form.direccion} onChange={e=>{setForm(p=>({...p,direccion:e.target.value}));setErr("");}} placeholder="Ej: Av. Libertador 2400, CABA" style={FS}/></div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
        <div><label style={LS}>Latitud *</label><input value={form.lat} onChange={e=>{setForm(p=>({...p,lat:e.target.value}));setErr("");}} placeholder="-34.5705" style={FS}/></div>
        <div><label style={LS}>Longitud *</label><input value={form.lng} onChange={e=>{setForm(p=>({...p,lng:e.target.value}));setErr("");}} placeholder="-58.4270" style={FS}/></div>
      </div>
      {err&&<p style={{color:"#ef4444",fontSize:12,margin:"0 0 10px"}}>{err}</p>}
      <div style={{display:"flex",gap:8}}><button onClick={guardar} disabled={load} style={{...BP,opacity:load?0.7:1}}>✓ {modo==="nueva"?"Agregar":"Guardar"}</button><button onClick={()=>{setModo(null);setErr("");}} style={BS}>Cancelar</button></div>
    </div>}
    <div style={{display:"grid",gap:10}}>{obras.map(o=><div key={o.id} style={{background:"#fff",borderRadius:12,border:"1.5px solid #e5e7eb",padding:"12px 16px",display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:10}}>
      <div style={{flex:1}}><div style={{fontWeight:700,fontSize:14,color:"#111"}}>{o.nombre}</div><div style={{fontSize:12,color:"#6b7280",marginTop:2}}>📍 {o.direccion}</div><div style={{fontSize:11,color:"#9ca3af",marginTop:2,fontFamily:"monospace"}}>{o.lat}, {o.lng}</div></div>
      <div style={{display:"flex",gap:6,flexShrink:0}}>
        <button onClick={()=>{setModo(o.id);setForm({nombre:o.nombre,direccion:o.direccion,lat:String(o.lat),lng:String(o.lng)});setErr("");}} style={{padding:"6px 12px",background:"#f3f4f6",border:"none",borderRadius:8,fontSize:12,fontWeight:600,cursor:"pointer",color:"#374151"}}>✏️</button>
        {conf===o.id?<div style={{display:"flex",gap:4}}><button onClick={()=>eliminar(o)} style={{padding:"6px 10px",background:"#ef4444",color:"#fff",border:"none",borderRadius:8,fontSize:12,fontWeight:700,cursor:"pointer"}}>Sí</button><button onClick={()=>setConf(null)} style={{padding:"6px 10px",background:"#f3f4f6",border:"none",borderRadius:8,fontSize:12,cursor:"pointer"}}>No</button></div>:<button onClick={()=>setConf(o.id)} style={{padding:"6px 10px",background:"#fee2e2",color:"#991b1b",border:"none",borderRadius:8,fontSize:12,fontWeight:600,cursor:"pointer"}}>🗑</button>}
      </div>
    </div>)}</div>
  </div>;
}

function GestionUsuarios({usuarios,recargar,user}){
  const V={nombre:"",usuario:"",clave:"",rol:"maquinista"};
  const[modo,setModo]=useState(null);const[form,setForm]=useState(V);const[conf2,setConf2]=useState("");const[show,setShow]=useState(false);const[err,setErr]=useState("");const[confElim,setConfElim]=useState(null);const[ok,setOk]=useState("");const[load,setLoad]=useState(false);
  const exito=msg=>{setOk(msg);setTimeout(()=>setOk(""),3000);};
  const val=esN=>{if(!form.nombre.trim())return"Nombre obligatorio.";if(!form.usuario.trim())return"Usuario obligatorio.";const dup=usuarios.find(u=>u.usuario.toLowerCase()===form.usuario.trim().toLowerCase()&&u.id!==modo);if(dup)return"Ese usuario ya existe.";if(esN||form.clave){if(form.clave.length<4)return"Clave mínimo 4 caracteres.";if(form.clave!==conf2)return"Las claves no coinciden.";}return null;};
  const guardar=async esN=>{const e=val(esN);if(e){setErr(e);return;}setLoad(true);const d={nombre:form.nombre.trim(),usuario:form.usuario.trim().toLowerCase(),rol:form.rol,...(form.clave?{clave:form.clave}:{})};if(esN){await db.insert("usuarios",{...d,clave:form.clave});await logH(user,"Usuario creado",`${d.nombre} (@${d.usuario}) · ${ROLES_INFO[d.rol].label}`);}else{await db.update("usuarios",modo,d);await logH(user,"Usuario editado",`${d.nombre} (@${d.usuario})${form.clave?" · clave actualizada":""}`);}await recargar();exito("✓ Guardado");setModo(null);setForm(V);setConf2("");setErr("");setLoad(false);};
  const eliminar=async u=>{if(u.id===user.id){setErr("No podés eliminarte a vos mismo.");return;}setLoad(true);await db.del("usuarios",u.id);await logH(user,"Usuario eliminado",`${u.nombre} (@${u.usuario})`);await recargar();exito("✓ Eliminado");setConfElim(null);setLoad(false);};
  const FormU=({esN})=><div style={{background:"#f8fafc",borderRadius:12,padding:16,border:"1.5px solid #e2e8f0",marginBottom:16}}>
    <h4 style={{margin:"0 0 14px",fontSize:14,fontWeight:700,color:"#1e3a5f"}}>{esN?"➕ Nuevo usuario":"✏️ Editar usuario"}</h4>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
      <div><label style={LS}>Nombre completo *</label><input value={form.nombre} onChange={e=>{setForm(p=>({...p,nombre:e.target.value}));setErr("");}} placeholder="Ej: Carlos Méndez" style={FS}/></div>
      <div><label style={LS}>Usuario *</label><input value={form.usuario} onChange={e=>{setForm(p=>({...p,usuario:e.target.value.replace(/\s/,"")}));setErr("");}} placeholder="Ej: carlos" autoCapitalize="none" style={FS}/></div>
    </div>
    <div style={{marginBottom:10}}><label style={LS}>Rol</label><select value={form.rol} onChange={e=>setForm(p=>({...p,rol:e.target.value}))} style={FS}>{Object.entries(ROLES_INFO).map(([k,v])=><option key={k} value={k}>{v.emoji} {v.label}</option>)}</select></div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
      <div><label style={LS}>{esN?"Clave *":"Nueva clave (vacío = no cambiar)"}</label><div style={{position:"relative"}}><input type={show?"text":"password"} value={form.clave} onChange={e=>{setForm(p=>({...p,clave:e.target.value}));setErr("");}} placeholder="Mín. 4 caracteres" style={{...FS,paddingRight:36}}/><button onClick={()=>setShow(p=>!p)} style={{position:"absolute",right:8,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",fontSize:13,color:"#9ca3af"}}>{show?"🙈":"👁"}</button></div></div>
      <div><label style={LS}>Confirmar clave</label><input type={show?"text":"password"} value={conf2} onChange={e=>{setConf2(e.target.value);setErr("");}} placeholder="Repetí la clave" style={FS}/></div>
    </div>
    {err&&<p style={{color:"#ef4444",fontSize:12,margin:"0 0 10px"}}>{err}</p>}
    <div style={{display:"flex",gap:8}}><button onClick={()=>guardar(esN)} disabled={load} style={{...BP,opacity:load?0.7:1}}>✓ {esN?"Crear":"Guardar"}</button><button onClick={()=>{setModo(null);setErr("");setConf2("");}} style={BS}>Cancelar</button></div>
  </div>;
  return<div>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}><h3 style={{margin:0,fontSize:15,fontWeight:700,color:"#1e3a5f"}}>👥 Gestión de usuarios</h3>{!modo&&<button onClick={()=>{setModo("nuevo");setForm(V);setConf2("");setErr("");}} style={{...BP,width:"auto",padding:"8px 16px",fontSize:13}}>+ Nuevo usuario</button>}</div>
    <p style={{fontSize:13,color:"#6b7280",marginTop:4,marginBottom:16}}>Creá y administrá los accesos de cada persona.</p>
    {ok&&<div style={{background:"#dcfce7",border:"1px solid #bbf7d0",borderRadius:10,padding:"10px 14px",fontSize:13,color:"#166534",fontWeight:600,marginBottom:14}}>{ok}</div>}
    {modo==="nuevo"&&<FormU esN={true}/>}
    <div style={{display:"grid",gap:10}}>{usuarios.map(u=>{const info=ROLES_INFO[u.rol];const esYo=u.id===user.id;return<div key={u.id}>{modo===u.id&&<FormU esN={false}/>}{modo!==u.id&&<div style={{background:"#fff",borderRadius:12,border:`1.5px solid ${esYo?"#a5b4fc":"#e5e7eb"}`,padding:"12px 16px",display:"flex",justifyContent:"space-between",alignItems:"center",gap:10}}>
      <div style={{display:"flex",alignItems:"center",gap:12,flex:1,minWidth:0}}><div style={{width:40,height:40,borderRadius:12,background:info.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>{info.emoji}</div><div><div style={{fontWeight:700,fontSize:14,color:"#111"}}>{u.nombre}{esYo&&<span style={{fontSize:11,color:"#6b21a8",fontWeight:600,marginLeft:6}}>(vos)</span>}</div><div style={{fontSize:12,color:"#9ca3af",marginTop:1}}>@{u.usuario} · <RolTag rol={u.rol}/></div></div></div>
      <div style={{display:"flex",gap:6,flexShrink:0}}>
        <button onClick={()=>{setModo(u.id);setForm({nombre:u.nombre,usuario:u.usuario,clave:"",rol:u.rol});setConf2("");setErr("");}} style={{padding:"6px 12px",background:"#f3f4f6",border:"none",borderRadius:8,fontSize:12,fontWeight:600,cursor:"pointer",color:"#374151"}}>✏️ Editar</button>
        {!esYo&&(confElim===u.id?<div style={{display:"flex",gap:4}}><button onClick={()=>eliminar(u)} style={{padding:"6px 10px",background:"#ef4444",color:"#fff",border:"none",borderRadius:8,fontSize:12,fontWeight:700,cursor:"pointer"}}>Confirmar</button><button onClick={()=>setConfElim(null)} style={{padding:"6px 10px",background:"#f3f4f6",border:"none",borderRadius:8,fontSize:12,cursor:"pointer"}}>No</button></div>:<button onClick={()=>setConfElim(u.id)} style={{padding:"6px 10px",background:"#fee2e2",color:"#991b1b",border:"none",borderRadius:8,fontSize:12,fontWeight:600,cursor:"pointer"}}>🗑</button>)}
      </div>
    </div>}</div>})}</div>
  </div>;
}

function Historial({historial,recargar}){
  const ic={"Estado actualizado":"🔄","Responsable asignado":"👷","Foto cargada":"📷","Falla reportada":"⚠️","Falla actualizada":"🔧","Datos editados":"✏️","Equipo agregado":"➕","Check-in registrado":"📝","Usuario creado":"👤","Usuario editado":"✏️","Usuario eliminado":"🗑","Obra agregada":"🏗️","Obra editada":"✏️","Obra eliminada":"🗑"};
  return<div>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}><h3 style={{margin:0,fontSize:15,fontWeight:700,color:"#1e3a5f"}}>📒 Historial de cambios</h3><button onClick={recargar} style={{...BS,padding:"6px 12px",fontSize:12}}>↻ Actualizar</button></div>
    <p style={{fontSize:13,color:"#6b7280",marginTop:0,marginBottom:16}}>{historial.length} eventos registrados</p>
    {historial.length===0?<div style={{textAlign:"center",padding:"40px 20px",color:"#d1d5db"}}><div style={{fontSize:36,marginBottom:8}}>📋</div><div>Sin actividad aún</div></div>
    :<div style={{display:"grid",gap:8}}>{historial.map(ev=><div key={ev.id} style={{background:"#fff",borderRadius:12,padding:"12px 16px",border:"1px solid #e5e7eb",display:"flex",gap:12,alignItems:"flex-start"}}>
      <div style={{fontSize:20,marginTop:1,flexShrink:0}}>{ic[ev.accion]||"📌"}</div>
      <div style={{flex:1,minWidth:0}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:4,marginBottom:4}}><span style={{fontWeight:700,fontSize:13,color:"#111"}}>{ev.accion}</span><RolTag rol={ev.rol}/></div>
        <div style={{fontSize:12,color:"#374151",marginBottom:5,wordBreak:"break-word"}}>{ev.detalle}</div>
        <div style={{fontSize:11,color:"#9ca3af"}}>👤 <b>{ev.nombre}</b> · 🕐 {ev.fecha}</div>
      </div>
    </div>)}</div>}
  </div>;
}

function EquipoCard({equipo,obras,onClick}){
  const obra=obras.find(o=>o.id===equipo.obra_id);
  const fa=equipo.fallas?.filter(f=>f.estado!=="Resuelto").length||0;
  return<div onClick={onClick} style={{background:"#fff",borderRadius:14,padding:16,border:`1.5px solid ${fa?"#fca5a5":"#e5e7eb"}`,cursor:"pointer",boxShadow:fa?"0 0 0 3px rgba(239,68,68,0.08)":"0 1px 4px rgba(0,0,0,0.05)"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}><div><div style={{fontSize:11,fontWeight:700,color:"#9ca3af",letterSpacing:1}}>{equipo.codigo}</div><div style={{fontSize:14,fontWeight:700,color:"#111",marginTop:2}}>{equipo.nombre}</div></div><Badge estado={equipo.estado}/></div>
    <div style={{fontSize:12,color:"#6b7280",marginBottom:4}}>📍 {obra?.nombre||"Sin asignar"}</div>
    <div style={{fontSize:12,color:"#6b7280",marginBottom:fa?10:0}}>👷 {equipo.responsable||<em style={{color:"#d1d5db"}}>Sin asignar</em>}</div>
    {fa>0&&<div style={{background:"#fee2e2",borderRadius:8,padding:"5px 10px",fontSize:11,color:"#991b1b",fontWeight:600}}>⚠ {fa} falla{fa>1?"s":""} pendiente{fa>1?"s":""}</div>}
  </div>;
}

function DetalleEquipo({equipo,obras,user,onClose,recargar}){
  const rol=user.rol;const obra=obras.find(o=>o.id===equipo.obra_id);
  const[tab,setTab]=useState("info");const[editando,setEditando]=useState(false);
  const[campos,setCampos]=useState({responsable:equipo.responsable,obra_id:equipo.obra_id,estado:equipo.estado,observaciones:equipo.observaciones,horas_uso:equipo.horas_uso});
  const[regs,setRegs]=useState(equipo.registros||[]);const[fallas,setFallas]=useState(equipo.fallas||[]);
  const[showCi,setShowCi]=useState(false);const[ci,setCi]=useState({tipo:"entrada",observaciones:"",fotoNombre:""});
  const fRef=useRef();const[showFalla,setShowFalla]=useState(false);const[nf,setNf]=useState({descripcion:"",prioridad:"Media",reportado_por:user.nombre});
  const[notas,setNotas]=useState({});const[load,setLoad]=useState(false);

  const guardar=async()=>{setLoad(true);const d={responsable:campos.responsable,obra_id:Number(campos.obra_id),estado:campos.estado,observaciones:campos.observaciones,horas_uso:Number(campos.horas_uso)};await db.update("equipos",equipo.id,d);if(campos.estado!==equipo.estado)await logH(user,"Estado actualizado",`[${equipo.codigo}] "${equipo.estado}" → "${campos.estado}"`);if(campos.responsable!==equipo.responsable)await logH(user,"Responsable asignado",`[${equipo.codigo}] "${equipo.responsable||"ninguno"}" → "${campos.responsable||"ninguno"}"`);if(Number(campos.obra_id)!==equipo.obra_id)await logH(user,"Datos editados",`[${equipo.codigo}] Obra → "${obras.find(o=>o.id===Number(campos.obra_id))?.nombre}"`);await recargar();setEditando(false);setLoad(false);};
  const guardarCi=async()=>{setLoad(true);const r=await db.insert("registros_estado",{equipo_id:equipo.id,tipo:ci.tipo,observaciones:ci.observaciones,foto_nombre:ci.fotoNombre,cargado_por:user.nombre,rol});setRegs(p=>[...p,...(Array.isArray(r)?r:[r])]);await logH(user,"Check-in registrado",`[${equipo.codigo}] ${ci.tipo==="entrada"?"Recepción":"Devolución"}${ci.fotoNombre?` · 📷 ${ci.fotoNombre}`:""}`);if(ci.fotoNombre)await logH(user,"Foto cargada",`[${equipo.codigo}] ${ci.tipo==="entrada"?"Estado inicial":"Estado final"}: ${ci.fotoNombre}`);setCi({tipo:"entrada",observaciones:"",fotoNombre:""});setShowCi(false);setLoad(false);};
  const guardarFalla=async()=>{if(!nf.descripcion.trim())return;setLoad(true);const fecha=new Date().toLocaleDateString("es-AR");const r=await db.insert("fallas",{equipo_id:equipo.id,descripcion:nf.descripcion,prioridad:nf.prioridad,estado:"Pendiente",reportado_por:nf.reportado_por,nota_mecanico:"",fecha});setFallas(p=>[...p,...(Array.isArray(r)?r:[r])]);await logH(user,"Falla reportada",`[${equipo.codigo}] "${nf.descripcion}" · ${nf.prioridad}`);setNf({descripcion:"",prioridad:"Media",reportado_por:user.nombre});setShowFalla(false);setLoad(false);};
  const updFalla=async(id,estado)=>{setLoad(true);const nota=notas[id]||"";const falla=fallas.find(f=>f.id===id);await db.update("fallas",id,{estado,...(nota?{nota_mecanico:nota}:{})});setFallas(p=>p.map(f=>f.id===id?{...f,estado,nota_mecanico:nota||f.nota_mecanico}:f));await logH(user,"Falla actualizada",`[${equipo.codigo}] "${falla.descripcion}" → ${estado}${nota?` · "${nota}"`:""}` );setNotas(p=>({...p,[id]:""}));setLoad(false);};

  const fa=fallas.filter(f=>f.estado!=="Resuelto");
  const tabs=[{id:"info",label:"📋 Info"},{id:"estado",label:`🔍 Estado${regs.length>0?` (${regs.length})` :""}`},{id:"fallas",label:`🔧 Fallas${fa.length>0?` (${fa.length})` :""}`}];

  return<Modal title={`${equipo.codigo} · ${equipo.nombre}`} onClose={onClose}>
    <div style={{display:"flex",gap:6,marginBottom:20,flexWrap:"wrap"}}>{tabs.map(t=><button key={t.id} onClick={()=>setTab(t.id)} style={{padding:"7px 14px",borderRadius:8,border:"none",background:tab===t.id?"#1e3a5f":"#f3f4f6",color:tab===t.id?"#fff":"#374151",fontWeight:600,fontSize:13,cursor:"pointer"}}>{t.label}</button>)}</div>

    {tab==="info"&&<div>
      <div style={{background:"#f8fafc",borderRadius:12,padding:16,marginBottom:16,display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>{[{l:"Código",v:equipo.codigo},{l:"Tipo",v:equipo.tipo},{l:"Horas de uso",v:`${Number(equipo.horas_uso).toLocaleString()} hs`},{l:"Último service",v:equipo.ultimo_service||"-"}].map(({l,v})=><div key={l}><div style={{fontSize:11,color:"#9ca3af",fontWeight:600}}>{l}</div><div style={{fontSize:14,fontWeight:600,color:"#111",marginTop:2}}>{v}</div></div>)}</div>
      {editando?<div style={{display:"grid",gap:12,marginBottom:16}}>
        <div><label style={LS}>Estado</label><select value={campos.estado} onChange={e=>setCampos(p=>({...p,estado:e.target.value}))} style={FS}>{ESTADOS.map(o=><option key={o}>{o}</option>)}</select></div>
        <div><label style={LS}>Obra</label><select value={campos.obra_id} onChange={e=>setCampos(p=>({...p,obra_id:Number(e.target.value)}))} style={FS}>{obras.map(o=><option key={o.id} value={o.id}>{o.nombre}</option>)}</select></div>
        <div><label style={LS}>Responsable</label><input value={campos.responsable} onChange={e=>setCampos(p=>({...p,responsable:e.target.value}))} style={FS}/></div>
        <div><label style={LS}>Horas de uso</label><input type="number" value={campos.horas_uso} onChange={e=>setCampos(p=>({...p,horas_uso:e.target.value}))} style={FS}/></div>
        <div><label style={LS}>Observaciones</label><textarea value={campos.observaciones} onChange={e=>setCampos(p=>({...p,observaciones:e.target.value}))} rows={3} style={{...FS,resize:"vertical"}}/></div>
        <div style={{display:"flex",gap:8}}><button onClick={guardar} disabled={load} style={{...BP,opacity:load?0.7:1}}>✓ Guardar</button><button onClick={()=>setEditando(false)} style={BS}>Cancelar</button></div>
      </div>:<div style={{display:"grid",gap:10,marginBottom:16}}>
        {[{l:"Estado",v:<Badge estado={equipo.estado}/>},{l:"Obra",v:`📍 ${obra?.nombre||"Sin asignar"}`},{l:"Responsable",v:`👷 ${equipo.responsable||"Sin asignar"}`}].map(({l,v})=><div key={l} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 14px",background:"#f8fafc",borderRadius:10}}><span style={{fontSize:13,color:"#6b7280",fontWeight:600}}>{l}</span><span style={{fontSize:13,fontWeight:600,color:"#111"}}>{v}</span></div>)}
        {equipo.observaciones&&<div style={{background:"#fffbeb",borderRadius:10,padding:"10px 14px",border:"1px solid #fde68a",fontSize:13,color:"#78350f"}}>📝 {equipo.observaciones}</div>}
        {puede.editarDatos(rol)&&<button onClick={()=>setEditando(true)} style={{...BS,width:"100%",border:"1.5px solid #1e3a5f",color:"#1e3a5f"}}>✏️ Editar datos</button>}
      </div>}
    </div>}

    {tab==="estado"&&<div>
      <p style={{fontSize:13,color:"#6b7280",marginTop:0,marginBottom:16}}>{puede.cargarFotos(rol)?"Registrá el estado del equipo al entregarlo o recibirlo.":"Historial de registros de estado."}</p>
      {puede.cargarFotos(rol)&&!showCi&&<button onClick={()=>setShowCi(true)} style={{...BP,marginBottom:20}}>+ Nuevo registro de estado</button>}
      {puede.cargarFotos(rol)&&showCi&&<div style={{background:"#f8fafc",borderRadius:12,padding:16,marginBottom:20,border:"1.5px solid #e2e8f0"}}>
        <div style={{marginBottom:12}}><label style={LS}>Tipo</label><div style={{display:"flex",gap:8}}>{[{id:"entrada",label:"📥 Recepción (estado inicial)"},{id:"salida",label:"📤 Devolución (estado final)"}].map(t=><button key={t.id} onClick={()=>setCi(p=>({...p,tipo:t.id}))} style={{flex:1,padding:"9px 6px",borderRadius:8,border:`2px solid ${ci.tipo===t.id?"#1e3a5f":"#e5e7eb"}`,background:ci.tipo===t.id?"#1e3a5f":"#fff",color:ci.tipo===t.id?"#fff":"#374151",fontWeight:600,fontSize:12,cursor:"pointer"}}>{t.label}</button>)}</div></div>
        <div style={{marginBottom:12}}><label style={LS}>📷 Foto</label><div style={{border:"2px dashed #d1d5db",borderRadius:10,padding:"18px",textAlign:"center",cursor:"pointer",color:ci.fotoNombre?"#166534":"#9ca3af",fontSize:13,background:ci.fotoNombre?"#f0fdf4":"#fff"}} onClick={()=>fRef.current?.click()}>{ci.fotoNombre?`✅ ${ci.fotoNombre}`:"Tap para adjuntar foto"}<input ref={fRef} type="file" accept="image/*" style={{display:"none"}} onChange={e=>setCi(p=>({...p,fotoNombre:e.target.files[0]?.name||""}))}/></div></div>
        <div style={{marginBottom:14}}><label style={LS}>Comentario del estado</label><textarea value={ci.observaciones} onChange={e=>setCi(p=>({...p,observaciones:e.target.value}))} rows={3} style={{...FS,resize:"vertical"}}/></div>
        <div style={{display:"flex",gap:8}}><button onClick={guardarCi} disabled={load} style={{...BP,background:"#22c55e",opacity:load?0.7:1}}>✓ Guardar</button><button onClick={()=>setShowCi(false)} style={BS}>Cancelar</button></div>
      </div>}
      {regs.length===0?<div style={{textAlign:"center",color:"#d1d5db",fontSize:13,padding:"24px 0"}}>Sin registros aún</div>
      :<div><div style={{fontSize:12,fontWeight:700,color:"#374151",marginBottom:10}}>Registros anteriores</div>
        {[...regs].reverse().map(r=><div key={r.id} style={{background:"#fff",borderRadius:10,padding:14,border:"1px solid #e5e7eb",marginBottom:8}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}><span style={{fontWeight:700,fontSize:13,color:r.tipo==="entrada"?"#166534":"#1e40af"}}>{r.tipo==="entrada"?"📥 Recepción":"📤 Devolución"}</span><span style={{fontSize:11,color:"#9ca3af"}}>{new Date(r.created_at).toLocaleString("es-AR",{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"})}</span></div>
          {puede.verFotos(rol)&&r.foto_nombre&&<div style={{background:"#f0fdf4",borderRadius:8,padding:"6px 10px",fontSize:12,color:"#166534",marginBottom:6,fontWeight:600}}>📷 {r.foto_nombre}</div>}
          {!puede.verFotos(rol)&&r.foto_nombre&&<div style={{background:"#f3f4f6",borderRadius:8,padding:"6px 10px",fontSize:11,color:"#9ca3af",marginBottom:6}}>🔒 Foto restringida</div>}
          {r.observaciones&&<div style={{fontSize:12,color:"#374151",marginBottom:6}}>📝 {r.observaciones}</div>}
          <div style={{fontSize:11,color:"#9ca3af"}}>Cargado por: <b>{r.cargado_por}</b> · <RolTag rol={r.rol}/></div>
        </div>)}
      </div>}
    </div>}

    {tab==="fallas"&&<div>
      {puede.reportarFallas(rol)&&!showFalla&&<button onClick={()=>setShowFalla(true)} style={{...BP,background:"#ef4444",marginBottom:20}}>⚠ Reportar falla</button>}
      {puede.reportarFallas(rol)&&showFalla&&<div style={{background:"#fff5f5",borderRadius:12,padding:16,marginBottom:20,border:"1.5px solid #fca5a5"}}>
        <div style={{marginBottom:12}}><label style={LS}>Descripción *</label><textarea value={nf.descripcion} onChange={e=>setNf(p=>({...p,descripcion:e.target.value}))} rows={3} style={{...FS,resize:"vertical"}}/></div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
          <div><label style={LS}>Prioridad</label><select value={nf.prioridad} onChange={e=>setNf(p=>({...p,prioridad:e.target.value}))} style={FS}>{["Baja","Media","Alta","Crítica"].map(p=><option key={p}>{p}</option>)}</select></div>
          <div><label style={LS}>Reportado por</label><input value={nf.reportado_por} onChange={e=>setNf(p=>({...p,reportado_por:e.target.value}))} style={FS}/></div>
        </div>
        <div style={{display:"flex",gap:8}}><button onClick={guardarFalla} disabled={load} style={{...BP,background:"#ef4444",opacity:load?0.7:1}}>Reportar</button><button onClick={()=>setShowFalla(false)} style={BS}>Cancelar</button></div>
      </div>}
      {fallas.length===0?<div style={{textAlign:"center",color:"#d1d5db",fontSize:13,padding:"24px 0"}}>✅ Sin fallas reportadas</div>
      :fallas.map(f=>{const res=f.estado==="Resuelto";return<div key={f.id} style={{background:res?"#f0fdf4":"#fff",borderRadius:12,padding:14,border:`1.5px solid ${res?"#bbf7d0":PC[f.prioridad]+"40"}`,marginBottom:10}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
          <div style={{flex:1,marginRight:8}}><div style={{fontSize:14,fontWeight:700,color:res?"#166534":"#111"}}>{f.descripcion}</div><div style={{fontSize:11,color:"#9ca3af",marginTop:3}}>Por {f.reportado_por} · {f.fecha}</div></div>
          <span style={{background:PC[f.prioridad]+"20",color:PC[f.prioridad],borderRadius:20,padding:"3px 10px",fontSize:11,fontWeight:700,whiteSpace:"nowrap"}}>{f.prioridad}</span>
        </div>
        {f.nota_mecanico&&<div style={{background:"#fff7ed",borderRadius:8,padding:"7px 10px",fontSize:12,color:"#9a3412",marginBottom:8,border:"1px solid #fed7aa"}}>🔧 {f.nota_mecanico}</div>}
        <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap",marginBottom:puede.gestionarFallas(rol)&&!res?10:0}}>
          <span style={{fontSize:12,fontWeight:600,color:"#6b7280"}}>Estado:</span>
          {puede.gestionarFallas(rol)?["Pendiente","En revisión","Resuelto"].map(s=><button key={s} onClick={()=>updFalla(f.id,s)} style={{padding:"4px 10px",borderRadius:20,border:"1.5px solid",borderColor:f.estado===s?"#1e3a5f":"#e5e7eb",background:f.estado===s?"#1e3a5f":"#fff",color:f.estado===s?"#fff":"#374151",fontSize:11,fontWeight:600,cursor:"pointer"}}>{s}</button>):<span style={{fontSize:12,fontWeight:600,color:"#374151"}}>{f.estado}</span>}
        </div>
        {puede.gestionarFallas(rol)&&!res&&<input value={notas[f.id]||""} onChange={e=>setNotas(p=>({...p,[f.id]:e.target.value}))} placeholder="Nota del mecánico (se guarda al cambiar estado)..." style={{...FS,fontSize:12,padding:"7px 10px"}}/>}
      </div>;})}
    </div>}
  </Modal>;
}

export default function App(){
  const[user,setUser]=useState(null);const[obras,setObras]=useState([]);const[usuarios,setUsuarios]=useState([]);const[equipos,setEquipos]=useState([]);const[hist,setHist]=useState([]);const[load,setLoad]=useState(true);
  const[vista,setVista]=useState("tablero");const[busq,setBusq]=useState("");const[fEst,setFEst]=useState("Todos");const[fObra,setFObra]=useState("Todas");const[eqSel,setEqSel]=useState(null);const[showNEq,setShowNEq]=useState(false);
  const[nEq,setNEq]=useState({codigo:"",nombre:"",tipo:TIPOS[0],obra_id:1,estado:"Disponible",responsable:"",horas_uso:0,ultimo_service:"",observaciones:""});

  const cargarObras=async()=>{const d=await db.get("obras");setObras(Array.isArray(d)?d:[]);};
  const cargarUsuarios=async()=>{const d=await db.get("usuarios");setUsuarios(Array.isArray(d)?d:[]);};
  const cargarHist=async()=>{const d=await db.get("historial","&order=id.desc");setHist(Array.isArray(d)?d:[]);};
  const cargarEquipos=async()=>{
    const eqs=await db.get("equipos");if(!Array.isArray(eqs)){setEquipos([]);return;}
    const[regs,falls]=await Promise.all([db.get("registros_estado"),db.get("fallas")]);
    const ra=Array.isArray(regs)?regs:[];const fa=Array.isArray(falls)?falls:[];
    setEquipos(eqs.map(e=>({...e,registros:ra.filter(r=>r.equipo_id===e.id),fallas:fa.filter(f=>f.equipo_id===e.id)})));
  };
  const cargarTodo=async()=>{setLoad(true);await Promise.all([cargarObras(),cargarUsuarios(),cargarEquipos(),cargarHist()]);setLoad(false);};
  useEffect(()=>{cargarTodo();},[]);

  const agregarEq=async()=>{
    if(!nEq.codigo||!nEq.nombre)return;
    await db.insert("equipos",{...nEq,horas_uso:Number(nEq.horas_uso),obra_id:Number(nEq.obra_id)});
    await logH(user,"Equipo agregado",`${nEq.codigo} · ${nEq.nombre}`);
    await cargarEquipos();setShowNEq(false);
    setNEq({codigo:"",nombre:"",tipo:TIPOS[0],obra_id:1,estado:"Disponible",responsable:"",horas_uso:0,ultimo_service:"",observaciones:""});
  };

  if(!user)return<LoginModal onLogin={setUser}/>;
  if(load)return<div style={{background:"#f0f4f8",minHeight:"100vh"}}><Spinner/></div>;

  const rol=user.rol;
  const eqF=equipos.filter(e=>{const q=busq.toLowerCase();return(e.nombre.toLowerCase().includes(q)||e.codigo.toLowerCase().includes(q)||(e.responsable||"").toLowerCase().includes(q))&&(fEst==="Todos"||e.estado===fEst)&&(fObra==="Todas"||e.obra_id===Number(fObra));});
  const stats={total:equipos.length,op:equipos.filter(e=>e.estado==="Operativo").length,mant:equipos.filter(e=>e.estado==="En mantenimiento").length,fall:equipos.filter(e=>e.fallas?.some(f=>f.estado!=="Resuelto")).length};
  const nav=[{id:"tablero",label:"📋 Tablero"},{id:"mapa",label:"🗺️ Mapa"},{id:"fallas",label:`🔧 Fallas${stats.fall>0?` (${stats.fall})`:""}`},...(puede.verHistorial(rol)?[{id:"hist",label:"📒 Historial"}]:[]),...(puede.gestionarUsers(rol)?[{id:"users",label:"👥 Usuarios"}]:[]),...(puede.gestionarObras(rol)?[{id:"obras",label:"🏗️ Obras"}]:[])];

  return<div style={{fontFamily:"'Trebuchet MS',sans-serif",background:"#f0f4f8",minHeight:"100vh"}}>
    <div style={{background:"linear-gradient(135deg,#1e3a5f,#0f2027)",padding:"13px 20px",display:"flex",justifyContent:"space-between",alignItems:"center",position:"sticky",top:0,zIndex:100}}>
      <div style={{display:"flex",alignItems:"center",gap:10}}><span style={{fontSize:22}}>🏗️</span><div><div style={{color:"#fff",fontWeight:800,fontSize:16,letterSpacing:-0.5}}>FleetOps</div><div style={{color:"#93c5fd",fontSize:11}}>{ROLES_INFO[rol].emoji} {user.nombre} · {ROLES_INFO[rol].label}</div></div></div>
      <button onClick={()=>setUser(null)} style={{background:"rgba(255,255,255,0.1)",border:"1px solid rgba(255,255,255,0.2)",color:"#fff",borderRadius:8,padding:"6px 12px",fontSize:12,cursor:"pointer",fontWeight:600}}>Salir</button>
    </div>
    <div style={{background:"#fff",borderBottom:"1px solid #e5e7eb",padding:"0 16px",display:"flex",gap:4,overflowX:"auto"}}>
      {nav.map(v=><button key={v.id} onClick={()=>setVista(v.id)} style={{padding:"12px 14px",border:"none",background:"none",fontWeight:700,fontSize:13,cursor:"pointer",color:vista===v.id?"#1e3a5f":"#9ca3af",borderBottom:`2px solid ${vista===v.id?"#1e3a5f":"transparent"}`,whiteSpace:"nowrap"}}>{v.label}</button>)}
    </div>
    <div style={{padding:16,maxWidth:900,margin:"0 auto"}}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:16}}>
        {[{l:"Total",v:stats.total,c:"#1e3a5f",b:"#dbeafe"},{l:"Operativos",v:stats.op,c:"#166534",b:"#dcfce7"},{l:"Mantenim.",v:stats.mant,c:"#854d0e",b:"#fef9c3"},{l:"Con fallas",v:stats.fall,c:"#991b1b",b:"#fee2e2"}].map(s=><div key={s.l} style={{background:s.b,borderRadius:12,padding:"12px 10px",textAlign:"center"}}><div style={{fontSize:22,fontWeight:800,color:s.c}}>{s.v}</div><div style={{fontSize:10,fontWeight:600,color:s.c,opacity:0.8}}>{s.l}</div></div>)}
      </div>

      {vista==="tablero"&&<>
        <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap"}}>
          <input value={busq} onChange={e=>setBusq(e.target.value)} placeholder="🔍 Buscar equipo, código, responsable..." style={{flex:1,minWidth:180,padding:"9px 12px",borderRadius:10,border:"1.5px solid #e5e7eb",fontSize:13,outline:"none"}}/>
          <select value={fEst} onChange={e=>setFEst(e.target.value)} style={{padding:"9px 10px",borderRadius:10,border:"1.5px solid #e5e7eb",fontSize:13,cursor:"pointer"}}><option>Todos</option>{ESTADOS.map(e=><option key={e}>{e}</option>)}</select>
          <select value={fObra} onChange={e=>setFObra(e.target.value)} style={{padding:"9px 10px",borderRadius:10,border:"1.5px solid #e5e7eb",fontSize:13,cursor:"pointer"}}><option value="Todas">Todas las obras</option>{obras.map(o=><option key={o.id} value={o.id}>{o.nombre}</option>)}</select>
        </div>
        {puede.agregarEquipo(rol)&&<button onClick={()=>setShowNEq(true)} style={{...BP,marginBottom:14}}>+ Agregar nuevo equipo / vehículo</button>}
        <div style={{fontSize:12,color:"#9ca3af",marginBottom:10}}>{eqF.length} de {equipos.length} equipos</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:12}}>{eqF.map(eq=><EquipoCard key={eq.id} equipo={eq} obras={obras} onClick={()=>setEqSel(eq)}/>)}</div>
        {eqF.length===0&&<div style={{textAlign:"center",padding:"40px 20px",color:"#9ca3af"}}><div style={{fontSize:36,marginBottom:8}}>🔍</div><div>No se encontraron equipos</div></div>}
      </>}

      {vista==="mapa"&&<div><h3 style={{margin:"0 0 14px",fontSize:15,fontWeight:700,color:"#1e3a5f"}}>🗺️ Mapa de equipos por obra</h3><MapaLeaflet equipos={equipos} obras={obras}/></div>}

      {vista==="fallas"&&<div>
        <h3 style={{margin:"0 0 14px",fontSize:15,fontWeight:700,color:"#1e3a5f"}}>🔧 Fallas activas</h3>
        {equipos.flatMap(eq=>(eq.fallas||[]).filter(f=>f.estado!=="Resuelto").map(f=>({...f,equipo:eq}))).length===0?<div style={{textAlign:"center",padding:"40px 20px",color:"#9ca3af"}}><div style={{fontSize:36,marginBottom:8}}>✅</div><div>Sin fallas pendientes</div></div>
        :equipos.flatMap(eq=>(eq.fallas||[]).filter(f=>f.estado!=="Resuelto").map(f=>({...f,equipo:eq}))).map(f=><div key={f.id} onClick={()=>setEqSel(f.equipo)} style={{background:"#fff",borderRadius:12,padding:16,border:`1.5px solid ${PC[f.prioridad]}40`,marginBottom:10,cursor:"pointer"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}><div><div style={{fontSize:11,color:"#9ca3af",marginBottom:2}}>{f.equipo.codigo} · {f.equipo.nombre}</div><div style={{fontSize:14,fontWeight:700,color:"#111"}}>{f.descripcion}</div></div><span style={{background:PC[f.prioridad]+"20",color:PC[f.prioridad],borderRadius:20,padding:"3px 10px",fontSize:11,fontWeight:700,whiteSpace:"nowrap",marginLeft:8}}>{f.prioridad}</span></div>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:"#9ca3af"}}><span>👷 {f.reportado_por}</span><span>📅 {f.fecha}</span><span style={{fontWeight:600,color:"#374151"}}>{f.estado}</span></div>
        </div>)}
      </div>}

      {vista==="hist"&&puede.verHistorial(rol)&&<Historial historial={hist} recargar={cargarHist}/>}
      {vista==="users"&&puede.gestionarUsers(rol)&&<GestionUsuarios usuarios={usuarios} recargar={cargarUsuarios} user={user}/>}
      {vista==="obras"&&puede.gestionarObras(rol)&&<GestionObras obras={obras} recargar={cargarObras} user={user}/>}
    </div>

    {eqSel&&<DetalleEquipo equipo={eqSel} obras={obras} user={user} onClose={()=>setEqSel(null)} recargar={cargarEquipos}/>}

    {showNEq&&<Modal title="Agregar nuevo equipo" onClose={()=>setShowNEq(false)}>
      <div style={{display:"grid",gap:12}}>
        {[{l:"Código *",k:"codigo",ph:"Ej: EXC-015"},{l:"Nombre *",k:"nombre",ph:"Ej: Excavadora Caterpillar 325"},{l:"Responsable",k:"responsable",ph:"Nombre del maquinista"},{l:"Horas de uso",k:"horas_uso",t:"number"},{l:"Último service",k:"ultimo_service",t:"date"},{l:"Observaciones",k:"observaciones",ph:"Opcional..."}].map(({l,k,ph,t})=><div key={k}><label style={LS}>{l}</label><input type={t||"text"} value={nEq[k]} onChange={e=>setNEq(p=>({...p,[k]:e.target.value}))} placeholder={ph} style={FS}/></div>)}
        <div><label style={LS}>Tipo</label><select value={nEq.tipo} onChange={e=>setNEq(p=>({...p,tipo:e.target.value}))} style={FS}>{TIPOS.map(t=><option key={t}>{t}</option>)}</select></div>
        <div><label style={LS}>Obra asignada</label><select value={nEq.obra_id} onChange={e=>setNEq(p=>({...p,obra_id:Number(e.target.value)}))} style={FS}>{obras.map(o=><option key={o.id} value={o.id}>{o.nombre}</option>)}</select></div>
        <button onClick={agregarEq} style={BP}>✓ Agregar equipo</button>
      </div>
    </Modal>}
  </div>;
}
