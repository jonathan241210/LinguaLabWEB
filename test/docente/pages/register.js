import { useState } from 'react';

export default function RegisterDocente() {
  const [form, setForm] = useState({ nombre: '', primer_apellido: '', segundo_apellido: '', correo: '', contrasena: '', matricula: '' });
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw data;
      setMsg({ type: 'success', text: `Docente creado (id=${data.id})` });
    } catch (err) {
      setMsg({ type: 'error', text: err?.error || JSON.stringify(err) });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: 24, fontFamily: 'system-ui, sans-serif' }}>
      <h1>Registro de Docente (test)</h1>
      <form onSubmit={onSubmit} style={{ maxWidth: 480 }}>
        <div>
          <label>Nombre<br /><input value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} required /></label>
        </div>
        <div>
          <label>Primer apellido<br /><input value={form.primer_apellido} onChange={e => setForm({ ...form, primer_apellido: e.target.value })} required /></label>
        </div>
        <div>
          <label>Segundo apellido<br /><input value={form.segundo_apellido} onChange={e => setForm({ ...form, segundo_apellido: e.target.value })} /></label>
        </div>
        <div>
          <label>Correo<br /><input type="email" value={form.correo} onChange={e => setForm({ ...form, correo: e.target.value })} required /></label>
        </div>
        <div>
          <label>Contraseña<br /><input type="password" value={form.contrasena} onChange={e => setForm({ ...form, contrasena: e.target.value })} required /></label>
        </div>
        <div>
          <label>Matrícula (opcional)<br /><input value={form.matricula} onChange={e => setForm({ ...form, matricula: e.target.value })} /></label>
        </div>
        <div style={{ marginTop: 12 }}>
          <button type="submit" disabled={loading}>{loading ? 'Enviando...' : 'Registrar Docente'}</button>
        </div>
      </form>
      {msg && (
        <div style={{ marginTop: 12, padding: 8, borderRadius: 6, background: msg.type === 'error' ? '#fee' : '#efe' }}>
          <strong>{msg.type === 'error' ? 'Error' : 'Éxito'}:</strong> {msg.text}
        </div>
      )}
    </div>
  );
}
