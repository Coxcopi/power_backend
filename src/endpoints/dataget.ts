import { Table, getLineUsageDuring, getSolarGainDuring, getTotalUsageDuring, isTimestampValidForTable } from "../db/db";
import { getHTTPErrorResponse } from "../error";
import type { Endpoint, HTTPRequestResponse, HTTPRequest } from "../types";

const types = ["usagetotal", "usagelines", "gain"];

const endpoint : Endpoint = {
    url: "/dataget",
    method: "get",
    execute(req: HTTPRequest): HTTPRequestResponse {
        if (!req.queries["type"]) {
            return getHTTPErrorResponse("No data request type specified.");
        }
        if (!types.includes(String(req.queries["type"]))) {
            return getHTTPErrorResponse("Invalid data request type.");
        }
        if (!req.queries["from"]) {
            return getHTTPErrorResponse("No start timestamp provided.");
        }
        if (!req.queries["to"]) {
            return getHTTPErrorResponse("No end timestamp provided");
        }
        if (typeof req.queries["from"] != "number" || typeof req.queries["to"] != "number") {
            return getHTTPErrorResponse("Start of end timestamp have an invalid format.");
        } 
        const start_timestamp : number = req.queries["from"];
        const end_timestamp : number = req.queries["to"];
        if (end_timestamp == start_timestamp) {
            return getHTTPErrorResponse("Start end end timestamps may not be the same.");
        }
        if (end_timestamp < start_timestamp) {
            return getHTTPErrorResponse("End timestamp must be greater than start timestamp.");
        }
        const type : string = req.queries["type"];
        const table : Table = (type == "gain" ? Table.SOLAR_GAIN : Table.POWER_USAGE);
        if (!isTimestampValidForTable(start_timestamp, table)) {
            return getHTTPErrorResponse("Illegal start timestamp.");
        }
        if (!isTimestampValidForTable(end_timestamp, table)) {
            return getHTTPErrorResponse("Illegal end timestamp");
        }
        switch (type) {
            case "usagetotal":
                return {
                    isError: false,
                    errorMsg: "",
                    response: new Response(JSON.stringify(getTotalUsageDuring(start_timestamp, end_timestamp)))
                }
            case "usagelines":
                return {
                    isError: false,
                    errorMsg: "",
                    response: new Response(JSON.stringify(getLineUsageDuring(start_timestamp, end_timestamp)))
                }
            case "gain":
                return {
                    isError: false,
                    errorMsg: "",
                    response: new Response(JSON.stringify(getSolarGainDuring(start_timestamp, end_timestamp)))
                }
            default:
                return {
                    isError: true,
                    errorMsg: "Unknown type.",
                    response: new Response("Unknown type.")
                }
        }
    }
};

export default endpoint;