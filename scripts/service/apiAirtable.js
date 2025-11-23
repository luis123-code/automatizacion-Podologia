import apiService from "./apiService.js";
import dotenv from "dotenv";

dotenv.config();

let datos = {
    TOKEN: process.env.AIRTABLE_TKN,
    BASE_ID: process.env.AIRTABLE_BSID,
    TABLE: process.env.AIRTABLE_TBL_CITA,
};


function urlApiAirtable(table, query = "") {
    return `https://api.airtable.com/v0/${datos.BASE_ID}/${table}${query}`;
}

function filtrarPorID(id) {
    const formula = `RECORD_ID()='${id}'`;
    return `?filterByFormula=${encodeURIComponent(formula)}`;
}

function filtrarEndpoint({ tipo, valor }) {
    const formula = `{${tipo}}='${valor}'`;
    return `?filterByFormula=${encodeURIComponent(formula)}`;
}

function filtrarIdColumna(id){
    return `/${id}`
}


export default async function apiServiceAirtableCrud({
    method = "get",
    cuerpo = {} ,
    queryId ,
    type  = ""
}) {

    let response = ""

    try {
        switch (method.toUpperCase()) {
            case "GET":
                const stateByTypeGet = {
                    async geCitasInfor() {
                        return apiService({
                            url: urlApiAirtable(datos.TABLE, filtrarEndpoint({ tipo: "Estado", valor: "nuevo" })),
                            token: datos.TOKEN
                        });
                    },

                    async GetUpdateCitasInfor() {
                        return apiService({
                            url: urlApiAirtable(datos.TABLE, filtrarEndpoint({ tipo: "Estado", valor: "actualizar" })),
                            token: datos.TOKEN
                        });
                    },

                    async GetdeleteCitasInfor() {
                        return apiService({
                            url: urlApiAirtable(datos.TABLE, filtrarEndpoint({ tipo: "Estado", valor: "eliminar" })),
                            token: datos.TOKEN
                        });
                    },

                    async GetPacienteInfor() {
                        datos.TABLE = process.env.AIRTABLE_TBL_PACIENTE;
                        return apiService({
                            url: urlApiAirtable(datos.TABLE, filtrarPorID(queryId)),
                            token: datos.TOKEN
                        });
                    }
                };
                response = await stateByTypeGet[type]();
                return response

            case "PATCH":
                const stateByTypePatch = {
                    async updateCalendarioEventAirtable() {
                        datos.TABLE = process.env.AIRTABLE_TBL_CITA;
                        return apiService({
                            url: urlApiAirtable(datos.TABLE, filtrarIdColumna(queryId)),
                            method : "PATCH" ,
                            token: datos.TOKEN ,
                            cuerpo
                        });
                    }
                }
                response = await stateByTypePatch[type]();
                return response

            default:
                return "metodo no indicado"

        }
    } catch (error) {
        return { error: true, message: error.message };
    }
}







