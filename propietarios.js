const form = document.querySelector('#solicitud-propietarios');
const panel = document.querySelector('#solicitud-lista');
const message = document.querySelector('#solicitud-texto');
const status = document.querySelector('#copia-estado');
form.addEventListener('input', () => { panel.hidden = true; });
form.addEventListener('submit', event => {
  event.preventDefault();
  const data = new FormData(form);
  const fields = {nombre:'Nombre', ciudad:'Ciudad', email:'Correo', whatsapp:'WhatsApp', caballos:'Caballos', interes:'Interés', etapa:'Etapa', mensaje:'Objetivos'};
  const lines = Object.entries(fields).filter(([name]) => data.get(name)?.trim())
    .map(([name, label]) => label + ': ' + data.get(name).trim());
  message.value = ['Hola, Alejandro. Quisiera solicitar un espacio en AC.', ...lines].join('\n');
  panel.hidden = false;
  status.textContent = '';
  message.focus();
});
document.querySelector('#copiar-solicitud').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(message.value);
    status.textContent = 'Solicitud copiada. Puedes enviarla por Instagram.';
  } catch {
    message.select();
    status.textContent = 'Texto seleccionado. Usa Copiar en tu dispositivo.';
  }
});
