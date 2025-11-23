import apiServiceAirtableCrud from "../service/apiAirtable.js";
import apiServiceGoogleCalendar from "../service/apiGoogle.js";

async function updateCitasInfo() {
  try {
    const response = await apiServiceAirtableCrud({ type: "GetUpdateCitasInfor" });
    const records = response?.cuerpo?.records || [];

    if (!records.length) return;

    // Mapear pacientes
    const pacientes = records.map(record => ({
      idColumna: record.id,
      Nombre: record.fields["Nombre Paciente"],
      cita: record.fields["Cita Puntual"],
      procedimiento: record.fields["Tipo de procedimiento Cita"],
      progreso: record.fields["Progreso"],
      Fecha: record.fields["Fecha"],
      id: record.fields["Pacientes"][0],
      colorid: getColorId(record.fields["Progreso"]),
      TokenCalendario: record.fields["tokenCalendario"]
    }));

    // Obtener información de todos los pacientes en paralelo
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

    // Actualizar eventos de Google Calendar y Airtable en paralelo
    await Promise.all(
      pacientes.map(async paciente => {
        try {
          paciente.TokenCalendario = await apiServiceGoogleCalendar({
            bodyInformacion: paciente,
            method: "update"
          });

          await apiServiceAirtableCrud({
            method: "PATCH",
            queryId: paciente.idColumna,
            cuerpo: {
              fields: {
                Estado: "registrado",
                tokenCalendario: paciente.TokenCalendario
              }
            },
            type: "updateCalendarioEventAirtable"
          });
        } catch (err) {
          console.error("Error actualizando paciente:", paciente.Nombre, err.message);
        }
      })
    );

    console.log("Actualización completada:", pacientes);

  } catch (error) {
    console.error("Error en updateCitasInfo:", error.message);
  }
}

// Función para obtener colorId
function getColorId(color) {
  const colores = {
    Confirmada: "5",
    Pendiente: "4",
    Cancelada: "11",
    Descontinuado: "2",
    Programado: "1"
  };
  return colores[color] || "";
}

// Ejecutar
updateCitasInfo();
