import apiServiceAirtableCrud from "../service/apiAirtable.js";
import apiServiceGoogleCalendar from "../service/apiGoogle.js";

let TotalPacienteActualizado = []


async function UpdateCitasInfor() {
    try {
        const response = await apiServiceAirtableCrud(
            {
                type: "GetUpdateCitasInfor"
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

                TotalPacienteActualizado.push(informacionPaciente)
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

    for (let index = 0; index < TotalPacienteActualizado.length; index++) {
        const paciente = TotalPacienteActualizado[index];
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
    if (TotalPacienteActualizado.length === 0) { return }

    for (const paciente of TotalPacienteActualizado) {
        paciente["TokenCalendario"] = await updateCalendarioEvent(paciente);
        await updatedRegistroAirtable(paciente)

    }
    console.log(":Arrays  TotalPacienteActualizado", TotalPacienteActualizado)

}



async function updateCalendarioEvent(getPaciente) {
    try {
        let response = await apiServiceGoogleCalendar(
            {
                bodyInformacion: getPaciente ,
                method :"update",
            }
        )
        return response
    } catch (error) {
        return "vacio"
    }
}





async function updatedRegistroAirtable(paciente) {
    let { idColumna, tokenCalendario } = paciente
    if (!idColumna) {
        return
    }
    let cuerpo = {
        "fields": {
            "Estado": "registrado",
            "tokenCalendario": tokenCalendario
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







UpdateCitasInfor()


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
