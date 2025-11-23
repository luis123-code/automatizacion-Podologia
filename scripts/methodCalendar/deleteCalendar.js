import apiServiceAirtableCrud from "../service/apiAirtable.js";
import apiServiceGoogleCalendar from "../service/apiGoogle.js";

let TotalPacienteEliminado = []


async function DeleteCitasInfor() {
    try {
        const response = await apiServiceAirtableCrud(
            {
                type: "GetdeleteCitasInfor"
            }
        )
        let { cuerpo: { records } } = response
        if (records && records.length > 0) {
            for (let record of records) {
                let informacionPaciente = {
                    "idColumna": record.id,
                    "Nombre": record.fields["Nombre Paciente"],
                    "cita": record.fields["Cita Puntual"],
                    "procedimiento": record.fields["Tipo de procedimiento Cita"],
                    "progreso": record.fields["Progreso"],
                    "Fecha": record.fields["Fecha"],
                    "id": record.fields["Pacientes"][0],
                    "colorid": accediendoColores(record.fields["Progreso"]),
                    "TokenCalendario": record.fields["tokenCalendario"]
                };

                TotalPacienteEliminado.push(informacionPaciente)
            }
            await getPacienteInfor()
        } else {
            return
        }
    } catch (error) {
        console.log("respuesta es", error)
    }
}



async function getPacienteInfor() {
    for (let index = 0; index < TotalPacienteEliminado.length; index++) {
        const paciente = TotalPacienteEliminado[index];
        try {
            const response = await apiServiceAirtableCrud(
                {
                    queryId: paciente["id"],
                    type: "GetPacienteInfor",
                }

            )

            let { cuerpo } = response
            if (cuerpo.records && cuerpo.records.length > 0) {
                for (let record of cuerpo.records) {
                    let { fields } = record
                    paciente["Teléfono"] = fields['Teléfono']
                    paciente["whatsapp"] = fields['Wasap']
                    paciente["Tipo_de_paciente"] = fields['Tipo de paciente']
                    paciente["Ubicacion"] = fields['Ubicacion']
                }
            } else {
                return
            }
        } catch (error) {
            throw new Error("error en el api")
        }
    }
    bucleEvntCalendario()

}


async function bucleEvntCalendario() {
    if (TotalPacienteEliminado.length === 0) { return }

    for (const paciente of TotalPacienteEliminado) {
        await deleteCalendarioEvent(paciente);
        await updatedRegistroAirtable(paciente)
    }


    console.log(":Arrays  TotalPacienteEliminado", TotalPacienteEliminado)

}

async function deleteCalendarioEvent(getPaciente) {
    try {
        let response = await apiServiceGoogleCalendar(
            {
                bodyInformacion: getPaciente ,
                method :"delete",
            }
        )
        return response
    } catch (error) {
        return "vacio"
    }
}







async function updatedRegistroAirtable(paciente) {
    let { idColumna } = paciente
    if (!idColumna) {
        return
    }
    let cuerpo = {
        "fields": {
            "Estado": "registrado",
            "tokenCalendario": "eliminado"
        }
    }
    try {
        let response = await apiServiceAirtableCrud(
            {
                method: "PATCH",
                cuerpo,
                queryId : idColumna,
                type : "updateCalendarioEventAirtable"
            }
        )
        console.log("se ejecuto la respuesta updatedRegistroAirtable", response)
    } catch (error) {
        throw new Error("Error a enviar la peticion")
    }
}







DeleteCitasInfor()






function parseCita(cita) {

    const [fecha, textoHora] = cita.split(" - Cita ");
    const [dia, mes, año] = fecha.split("/");
    const hora = textoHora.trim();

    return new Date(`${año}-${mes}-${dia}T${hora}:00`);
}




function filtrarPorID(id) {
    const formula = `RECORD_ID()='${id}'`;
    return `?filterByFormula=${encodeURIComponent(formula)}`;
}


function urlApiAirtable() {
    return `https://api.airtable.com/v0/${datos.BASE_ID}/${datos.TABLE}`;
}


function filtrarEndpoint({ tipo, valor }) {
    const formula = `{${tipo}}='${valor}'`;
    return `?filterByFormula=${encodeURIComponent(formula)}`;
}
function accediendoColores(color) {
    let codigo = ""
    switch (color) {
        case "Confirmada":
            codigo = "5"
            break;
        case "Pendiente":
            codigo = "4"
            break;
        case "Cancelada":
            codigo = "11"
            break;
        case "Descontinuado":
            codigo = "2"
            break;
        case "Programado":
            codigo = "1"
            break;
        default:
            break;
    }
    return codigo
}
