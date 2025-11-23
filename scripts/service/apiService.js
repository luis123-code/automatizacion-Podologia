import fetch from "node-fetch";

export default async function apiService ({
    url,
    cuerpo,
    method = "GET",
    headers = {},
    token
}) {
    let resquest;

    try {
        const defaultHeaders = {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            ...headers
        };

        const fetchOptions = {
            method: method.toUpperCase(),
            headers: defaultHeaders,
        };

        if (cuerpo && !["GET", "DELETE"].includes(method.toUpperCase())) {
            fetchOptions.body = JSON.stringify(cuerpo);
        }

        let response;
        let data;

        switch (method.toLowerCase()) {

            case "get":
                response = await fetch(url, fetchOptions);
                data = await response.json();
                break;

            case "patch":
                response = await fetch(url, fetchOptions);
                data = await response.json();
                break;

            case "post":
                response = await fetch(url, fetchOptions);
                data = await response.json();
                break;

            case "delete":
                response = await fetch(url, fetchOptions);
                data = await response.json();
                break;

            default:
                throw new Error(`Método HTTP no soportado: ${method}`);
        }

        resquest = {
            cuerpo: data,
            status: response.status
        };

    } catch (error) {
        console.error("Error en apiService:", error.message);
        resquest = {
            cuerpo: error.message,
            status: "Error",
        };
    }

    return resquest;
}
