import apiService from "./apiService.js";
import dotenv from "dotenv";

dotenv.config();

const AIRTABLE_TOKEN = process.env.AIRTABLE_TKN;
const AIRTABLE_BASE = process.env.AIRTABLE_BSID;
const TABLE_CITA = process.env.AIRTABLE_TBL_CITA;
const TABLE_PACIENTE = process.env.AIRTABLE_TBL_PACIENTE;

// Construye URL de Airtable
function urlApiAirtable(table, query = "") {
    return `https://api.airtable.com/v0/${AIRTABLE_BASE}/${table}${query}`;
}

// Formulas de filtrado
const filtrarPorID = id => `?filterByFormula=${encodeURIComponent(`RECORD_ID()='${id}'`)}`;
const filtrarPorCampo = (campo, valor) => `?filterByFormula=${encodeURIComponent(`{${campo}}='${valor}'`)}`;
const filtrarIdColumna = id => `/${id}`;

// Mapeo de funciones GET
const getHandlers = {
    geCitasInfor: () =>
        apiService({
            url: urlApiAirtable(TABLE_CITA, filtrarPorCampo("Estado", "nuevo")),
            token: AIRTABLE_TOKEN
        }),

    GetUpdateCitasInfor: () =>
        apiService({
            url: urlApiAirtable(TABLE_CITA, filtrarPorCampo("Estado", "actualizar")),
            token: AIRTABLE_TOKEN
        }),

    GetdeleteCitasInfor: () =>
        apiService({
            url: urlApiAirtable(TABLE_CITA, filtrarPorCampo("Estado", "eliminar")),
            token: AIRTABLE_TOKEN
        }),

    GetPacienteInfor: queryId =>
        apiService({
            url: urlApiAirtable(TABLE_PACIENTE, filtrarPorID(queryId)),
            token: AIRTABLE_TOKEN
        })
};

// Mapeo de funciones PATCH
const patchHandlers = {
    updateCalendarioEventAirtable: (queryId, cuerpo) =>
        apiService({
            url: urlApiAirtable(TABLE_CITA, filtrarIdColumna(queryId)),
            method: "PATCH",
            token: AIRTABLE_TOKEN,
            cuerpo
        })
};

// Función principal
export default async function apiServiceAirtableCrud({ method = "GET", type = "", queryId = "", cuerpo = {} }) {
    try {
        method = method.toUpperCase();

        if (method === "GET") {
            const handler = getHandlers[type];
            if (!handler) throw new Error(`Tipo GET no encontrado: ${type}`);
            return await handler(queryId);
        }

        if (method === "PATCH") {
            const handler = patchHandlers[type];
            if (!handler) throw new Error(`Tipo PATCH no encontrado: ${type}`);
            return await handler(queryId, cuerpo);
        }

        throw new Error(`Método no soportado: ${method}`);
    } catch (error) {
        console.error("Error en apiServiceAirtableCrud:", error.message);
        return { error: true, message: error.message };
    }
}
