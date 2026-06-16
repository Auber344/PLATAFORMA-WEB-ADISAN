(function () {
  const STORAGE_KEY = 'adisan_chat_messages';
  const clienteId = localStorage.getItem('id');

  function cargarMensajesGuardados() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch { return []; }
  }

  function guardarMensajes(mensajes) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(mensajes));
    } catch {}
  }

  const chatHTML = `
    <div id="chatWidget" class="chat-widget">
      <button id="chatBubble" class="chat-bubble" onclick="window.toggleChat()">
        <i class="fa-solid fa-comment-dots"></i>
      </button>
      <div id="chatWindow" class="chat-window oculto">
        <div class="chat-header">
          <div class="chat-header-info">
            <i class="fa-solid fa-robot"></i>
            <span>Asistente ADISAN</span>
          </div>
          <button onclick="window.toggleChat()" class="chat-close">×</button>
        </div>
        <div id="chatMessages" class="chat-messages"></div>
        <div class="chat-input-area">
          <input type="text" id="chatInput" placeholder="Escribe tu mensaje..." onkeydown="if(event.key==='Enter') window.enviarChat()">
          <button onclick="window.enviarChat()"><i class="fa-solid fa-paper-plane"></i></button>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', chatHTML);

  const mensajesGuardados = cargarMensajesGuardados();
  const container = document.getElementById('chatMessages');
  mensajesGuardados.filter(m => !m.texto.includes('Pensando...')).forEach(m => {
    const div = document.createElement('div');
    div.className = 'chat-message ' + m.tipo;
    div.innerHTML = '<div class="msg-content">' + m.texto + '</div>';
    container.appendChild(div);
  });
  container.scrollTop = container.scrollHeight;

  window.toggleChat = function () {
    const win = document.getElementById('chatWindow');
    const bubble = document.getElementById('chatBubble');
    win.classList.toggle('oculto');
    bubble.style.display = win.classList.contains('oculto') ? 'flex' : 'none';
    if (!win.classList.contains('oculto')) {
      document.getElementById('chatInput').focus();
    }
  };

  window.enviarChat = async function () {
    const input = document.getElementById('chatInput');
    const msg = input.value.trim();
    if (!msg) return;

    input.value = '';
    agregarMensaje('user', msg);

    const loadingId = agregarMensaje('bot', '<i class="fa-solid fa-spinner fa-spin"></i> Pensando...', false);

    try {
      const res = await fetch('http://localhost:5000/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mensaje: msg,
          cliente_id: clienteId ? parseInt(clienteId) : null
        })
      });
      const data = await res.json();
      const el = document.getElementById(loadingId);
      if (el) el.remove();

      let respuesta = data.respuesta;
      respuesta = respuesta.replace(
        /https?:\/\/[^\s]+/g,
        url => `<a href="${url}" target="_blank" style="color:#2563eb;text-decoration:underline">${url}</a>`
      );
      respuesta = respuesta.replace(
        /<a href="catalogo\.html"[^>]*>/g,
        '<a href="catalogo.html" style="color:#2563eb;text-decoration:underline;font-weight:700">'
      );
      respuesta = respuesta.replace(
        /href="(?!http)([^"]+\.html)"/g,
        (m, p1) => `href="${p1}" style="color:#2563eb;text-decoration:underline;font-weight:700"`
      );

      agregarMensaje('bot', respuesta);
    } catch (e) {
      const el = document.getElementById(loadingId);
      if (el) el.remove();
      agregarMensaje('bot', '⚠️ Error de conexión con el asistente. Asegúrate de que el servidor de IA esté corriendo en el puerto 5000.');
    }
  };

  function agregarMensaje(tipo, texto, guardar = true) {
    const c = document.getElementById('chatMessages');
    const id = 'msg-' + Date.now() + '-' + Math.random();
    const div = document.createElement('div');
    div.className = 'chat-message ' + tipo;
    div.id = id;
    div.innerHTML = '<div class="msg-content">' + texto + '</div>';
    c.appendChild(div);
    c.scrollTop = c.scrollHeight;

    if (guardar) {
      const msgs = cargarMensajesGuardados();
      msgs.push({ tipo, texto });
      if (msgs.length > 50) msgs.splice(0, msgs.length - 50);
      guardarMensajes(msgs);
    }
    return id;
  }

  window.agregarMensaje = agregarMensaje;
})();
