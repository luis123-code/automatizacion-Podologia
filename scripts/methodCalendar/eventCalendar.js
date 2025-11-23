import apiServiceAirtableCrud from "../service/apiAirtable.js";
import apiServiceGoogleCalendar from "../service/apiGoogle.js";
let TotalPaciente = []

async function geCitasInfor() {
    try {
        const response = await apiServiceAirtableCrud(
            {
                type: "geCitasInfor"
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
                    "colorid": accediendoColores(record.fields["Progreso"])
                };

                TotalPaciente.push(informacionPaciente)
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

    for (let index = 0; index < TotalPaciente.length; index++) {
        const paciente = TotalPaciente[index];
        try {
            const response = await apiServiceAirtableCrud(
                {
                    queryId: paciente["id"] ,
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
    if (TotalPaciente.length === 0) { return }

    for (const paciente of TotalPaciente) {
        paciente["tokenCalendario"] = await setCalendarioEvent(paciente);
        await updatedRegistroAirtable(paciente)
    }

    console.log("final Arrays", TotalPaciente)
}




async function setCalendarioEvent(getPaciente) {
    try {
        let response = await apiServiceGoogleCalendar(
            {
                bodyInformacion: getPaciente
            }
        )
        console.log("se ejcuto ", response)
        return response

    } catch (error) {
        console.error("ERROR:", error);
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




async function getPacienteInforhistory() {
    // datos["TABLE"] = process.env.AIRTABLE_TBL_HISTORIALMEDICO
    urlApiAirtable()

    for (let index = 0; index < TotalPaciente.length; index++) {
        const paciente = TotalPaciente[index];
        try {
            let response = await fetch(urlApiAirtable() + filtrarEndpoint(
                {
                    tipo: "Citas Paciente",
                    valor: paciente["cita"]
                }
            ),
                {
                    headers: {
                        Authorization: `Bearer ${datos.TOKEN}`,
                    },
                })
            let data = await response.json()
            if (data.records && data.records.length > 0) {
                for (let record of data.records) {
                    let { fields } = record
                    console.log(fields)
                }

            } else {



            }

        } catch (error) {

        }

    }
}




geCitasInfor();



