export type SingleColumnData = {
    startTime : number,
    values : number[],
}

export type LineColumnData = {
    startTime : number,
    values_a : number[],
    values_b : number[],
    values_c : number[]
}

export type LastUsageValueData = {
    timestamp : number,
    usage : number,
    usage_a : number,
    usage_b : number,
    usage_c : number
}

export type LastGainValueData = {
    timestamp : number,
    gain : number
}

export type LastValueData = {
    timestamp_usage : number,
    timestamp_gain : number,
    usage_combined : number,
    usage_a : number,
    usage_b : number,
    usage_c : number,
    gain : number,
    gain_peak : number,
    usage_total : number,
    sr_today : number,
    sr_tomorrow : number,
    ss_today : number,
    ss_tomorrow : number
}

export type DataReqResponse = {
    updateTime : number,
    solarUpdateTime : number,
    data : SingleLineData
}

export type HTTPRequest = {
    path : string,
    queries : HTTPRequestQueries,
    request : Request
}

export type HTTPRequestQueries = {
    [key : string]: string | number | booleans
}

export type HTTPRequestResponse = {
    isError : boolean,
    errorMsg : string,
    response : Response
}

export type Endpoint = {
    url: string,
    method : "get" | "post",
    execute : (req : HTTPRequest) => HTTPRequestResponse
}