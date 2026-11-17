const operation = document.querySelector("#operacion");
const details = document.querySelector("#detalle");
const draft = document.querySelector("#borrador");
const message = document.querySelector("#mensaje");
const status = document.querySelector("#estado");

operation.addEventListener("change", () => {
  const buying = operation.value === "comprar";
  document.querySelector("#pregunta").textContent = buying
    ? "¿Qué tipo de caballo buscas?"
    : "¿Qué caballo quieres ofrecer?";
  details.placeholder = buying
    ? "Tu ubicación, nivel en la cala y presupuesto aproximado"
    : "Nombre de registro, ubicación, precio y enlace a un video reciente";
  draft.hidden = true;
  details.value = "";
});
details.addEventListener("input", () => {
  draft.hidden = true;
});
document.querySelector("#consulta").addEventListener("submit", (event) => {
  event.preventDefault();
  if (!details.value.trim()) {
    details.focus();
    return;
  }
  message.value =
    "Hola, Alejandro. Vi el marketplace de AC y me interesa " +
    operation.value +
    " un caballo. " +
    details.value.trim();
  status.textContent = "";
  draft.hidden = false;
  message.focus();
});
document.querySelector("#copiar").addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(message.value);
    status.textContent = "Mensaje copiado. Abre Instagram para enviarlo.";
  } catch {
    message.focus();
    message.select();
    status.textContent =
      "Mensaje seleccionado. Usa la opción Copiar de tu dispositivo.";
  }
});
