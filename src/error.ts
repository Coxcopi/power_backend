import type { HTTPRequestResponse } from "./types";

export function getHTTPErrorResponse(message: string): HTTPRequestResponse {
    return {
        isError: true,
        errorMsg: message,
        response: new Response(message)
    };
}