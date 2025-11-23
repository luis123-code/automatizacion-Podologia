import fetch from "node-fetch";

export default async function apiService({
    url,
    cuerpo = null,
    method = "GET",
    headers = {},
    token
}) {
    try {
        const httpMethod = method.toUpperCase();

        const defaultHeaders = {
            "Content-Type": "application/json",
            Authorization: token ? `Bearer ${token}` : undefined,
            ...headers
        };

        const fetchOptions = {
            method: httpMethod,
            headers: defaultHeaders,
            ...(cuerpo && !["GET", "DELETE"].includes(httpMethod) ? { body: JSON.stringify(cuerpo) } : {})
        };

        const response = await fetch(url, fetchOptions);

        let data;
        try {
            data = await response.json();
        } catch {
            data = null; // por si no hay JSON en la respuesta
        }

        return {
            cuerpo: data,
            status: response.status
        };

    } catch (error) {
        console.error("Error en apiService:", error.message);
        return {
            cuerpo: { error: error.message },
            status: "Error"
        };
    }
}
