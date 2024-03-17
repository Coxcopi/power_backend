import type { Endpoint, HTTPRequest } from "../types";

const endpoint : Endpoint = {
    url: "/lastvaluesget",
    method: "get",
    execute(req : HTTPRequest) {
        return {
            isError: false,
            errorMsg: "",
            response: new Response()
        }
    },
};

export default endpoint;