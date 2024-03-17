import type { Serve } from "bun";
import { prepare } from "./db/db";
import { readdirSync} from "node:fs";
import type { Endpoint, HTTPRequest, HTTPRequestQueries, HTTPRequestResponse } from "./types";

let endpoints : {[url: string]: Endpoint} = {};

const server : Serve = {
    port: 8080,
    development: true,
    fetch: onRequest
};

function onRequest(req : Request): Response {
    const parts = req.url.split("?")[0].split("/");
    const url = "/" + parts[parts.length - 1];
    
    let queries : HTTPRequestQueries = {};

    // Prepary queries
    const items = req.url.split("?");
    for (const item of items.slice(1, items.length)) {
        if (!item.includes("=")) {
            continue;
        }
        const parts = item.split("=");
        const key = parts[0];
        let value : string | number | boolean;
        const valstr : string = parts[1];
        if (valstr == "true") {
            value = true;
        } else if (valstr == "false") {
            value = false;
        } else if (valstr.includes(".") && !isNaN(parseFloat(valstr))) {
            value = parseFloat(valstr);
        } else if (!isNaN(parseInt(valstr))) {
            value = parseInt(valstr);
        } else {
            value = valstr;
        }
        queries[key] = value;
    }

    const request : HTTPRequest = {
        path: url,
        queries,
        request: req
    };

    if (endpoints[url]) {
        const res : HTTPRequestResponse = endpoints[url].execute(request);
        if (res.isError) {
            console.log("Error while processing request for url '" + url + "': " + res.errorMsg);
        }
        res.response.headers.set("Access-Control-Allow-Origin", "*");
        return res.response;
    }
    return new Response("Hello");
}

async function start() {
    await preloadEndpoints();
    prepare();
    Bun.serve(server);
}

async function preloadEndpoints() {
    const path = import.meta.dir + "/endpoints";
    const files = readdirSync(path).filter((file => {return file.endsWith(".ts")}));
    for (const file of files) {
        const endpoint : Endpoint = (await import(path + "/" + file)).default as Endpoint;
        endpoints[endpoint.url] = endpoint;
    }
}

await start();