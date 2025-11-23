import apiServiceAirtableCrud from "../service/apiAirtable.js";
import apiServiceGoogleCalendar from "../service/apiGoogle.js";

let pacientesNuevos = [];
let pacientesActualizar = [];
let pacientesEliminar = [];

async function procesarCitas() {
  // Cargar pacientes de forma paralela
  await Promise.all([
    cargarPacientesNuevos(),
    cargarPacientesActualizar(),
    cargarPacientesEliminar()
  ]);

  // Obtener info detallada de cada paciente antes de procesar
  await Promise.all([
    obtenerInfoPacientes(pacientesNuevos),
    obtenerInfoPacientes(pacientesActualizar),
    obtenerInfoPacientes(pacientesEliminar)
  ]);

  // Crear eventos nuevos
  if (pacientesNuevos.length > 0) {
    console.log("Procesando pacientes nuevos:", pacientesNuevos.length);
    await Promise.all(
      pacientesNuevos.map(async paciente => {
        paciente.TokenCalendario = await apiServiceGoogleCalendar({ bodyInformacion: paciente });
        await actualizarAirtable(paciente);
      })
    );
  }

  // Actualizar eventos existentes
  if (pacientesActualizar.length > 0) {
    console.log("Actualizando pacientes:", pacientesActualizar.length);
    await Promise.all(
      pacientesActualizar.map(async paciente => {
        paciente.TokenCalendario = await apiServiceGoogleCalendar({ bodyInformacion: paciente, method: "update" });
        await actualizarAirtable(paciente);
      })
    );
  }

  // Eliminar eventos
  if (pacientesEliminar.length > 0) {
    console.log("Eliminando pacientes:", pacientesEliminar.length);
    await Promise.all(
      pacientesEliminar.map(async paciente => {
        await apiServiceGoogleCalendar({ bodyInformacion: paciente, method: "delete" });
        paciente.TokenCalendario = "eliminado";
        await actualizarAirtable(paciente);
      })
    );
  }

  console.log("Proceso completo ✅");
}

// --- CARGA DE PACIENTES ---
async function cargarPacientesNuevos() {
  const res = await apiServiceAirtableCrud({ type: "geCitasInfor" });
  pacientesNuevos = transformarPacientes(res);
}

async function cargarPacientesActualizar() {
  const res = await apiServiceAirtableCrud({ type: "GetUpdateCitasInfor" });
  pacientesActualizar = transformarPacientes(res);
}

async function cargarPacientesEliminar() {
  const res = await apiServiceAirtableCrud({ type: "GetdeleteCitasInfor" });
  pacientesEliminar = transformarPacientes(res);
}

// --- Obtener info detallada de pacientes ---
async function obtenerInfoPacientes(pacientes) {
  await Promise.all(
    pacientes.map(async paciente => {
      try {
        const resp = await apiServiceAirtableCrud({
          queryId: paciente.id,
          type: "GetPacienteInfor"
        });
        const record = resp?.cuerpo?.records?.[0];
        if (record) {
          const fields = record.fields;
          paciente.Teléfono = fields['Teléfono'];
          paciente.whatsapp = fields['Wasap'];
          paciente.Tipo_de_paciente = fields['Tipo de paciente'];
          paciente.Ubicacion = fields['Ubicacion'];
        }
      } catch (err) {
        console.error("Error obteniendo info de paciente:", paciente.Nombre, err.message);
      }
    })
  );
}

// --- FUNCIONES AUXILIARES ---
function transformarPacientes(response) {
  if (!response?.cuerpo?.records?.length) return [];
  return response.cuerpo.records.map(r => ({
    idColumna: r.id,
    Nombre: r.fields["Nombre Paciente"],
    cita: r.fields["Cita Puntual"],
    procedimiento: r.fields["Tipo de procedimiento Cita"],
    progreso: r.fields["Progreso"],
    Fecha: r.fields["Fecha"],
    id: r.fields["Pacientes"][0],
    colorid: mapColor(r.fields["Progreso"]),
    TokenCalendario: r.fields["tokenCalendario"] || null
  }));
}

function mapColor(color) {
  switch(color) {
    case "Confirmada": return "5";
    case "Pendiente": return "4";
    case "Cancelada": return "11";
    case "Descontinuado": return "2";
    case "Programado": return "1";
    default: return "";
  }
}

async function actualizarAirtable(paciente) {
  const cuerpo = {
    fields: {
      Estado: "registrado",
      tokenCalendario: paciente.TokenCalendario || "vacio"
    }
  };
  await apiServiceAirtableCrud({
    method: "PATCH",
    cuerpo,
    queryId: paciente.idColumna,
    type: "updateCalendarioEventAirtable"
  });
}

// --- EJECUTAR ---
procesarCitas();
