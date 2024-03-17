import { Database } from "bun:sqlite";
import type { LastGainValueData, LastUsageValueData, LineColumnData, SingleColumnData } from "../types";

const TIMESTAMP_SAFETY_OFFSET : number = 10 * 60 * 1000; // 10 Minutes. This is necessary because if an end timestamp of Time.now() is used, without this safety margin it would be invalid most of the time.

export enum Table {
    POWER_USAGE,
    SOLAR_GAIN
}

const db = new Database("database.sqlite", {
    create: true
});

export function prepare() {
    // Prepare Database
    db.exec("PRAGMA journal_mode = WAL;");
    db.exec(`CREATE TABLE IF NOT EXISTS power_usage (
                    id INTEGER PRIMARY KEY,
                    timestamp INTEGER,
                    total INTEGER DEFAULT 0,
                    line_a INTEGER DEFAULT 0,
                    line_b INTEGER DEFAULT 0,
                    line_c INTEGER DEFAULT 0
            );
            CREATE TABLE IF NOT EXISTS solar_gain (
                    id INTEGER PRIMARY KEY,
                    timestamp INTEGER,
                    gain INTEGER DEFAULT 0
            );
    `);
    //console.log(getLineUsageDuring(1710281028097, 1710826188097));
    console.log(getLatestUsageData());
}

function populate() {
    const initTimestamp : number = Date.now() - 4 * 24 * 60 * 60 * 1000;
    const TwoMins : number = 60 * 2 * 1000;
    for (let i : number = 0; i < 5000; i++) {
        const a = (Math.random() * 950) | 0;
        const b = (Math.random() * 1000) | 0;
        const c = (Math.random() * 1000) | 0;

        db.run(`INSERT INTO solar_gain (timestamp, gain) VALUES (${initTimestamp + TwoMins * i}, ${a})`);
    }
    console.log((Date.now() - initTimestamp) / 1000.0);
}

export function insertUsageData(timestamp: number, l1: number, l2: number, l3: number) {
    const latestTimestamp = getLastTimestamp(Table.POWER_USAGE);
    if (timestamp < latestTimestamp) {
        console.log("Tried inserting usage value that was older than the latest one.");
        return;
    }
    db.run(`INSERT INTO power_usage (timestamp, total, line_a, line_b, line_c) VALUES (${timestamp}, ${l1 + l2 + l3}, ${l1}, ${l2}, ${l3})`);
}

export function insertGainData(timestamp: number, gain: number) {
    const latestTimestamp = getLastTimestamp(Table.SOLAR_GAIN);
    if (timestamp < latestTimestamp) {
        console.log("Tried inserting gain value that was older than the latest one.");
        return;
    }
    db.run(`INSERT INTO solar_gain (timestamp, gain) VALUES (${timestamp}, ${gain})`);
}

export function getTotalUsageDuring(from: number, to: number): SingleColumnData {
    const db_from : number = getClosestDBTimestampTo(from, Table.POWER_USAGE);
    const db_to : number = getClosestDBTimestampTo(to, Table.POWER_USAGE);
    const query = db.query(`SELECT total FROM power_usage WHERE timestamp >= ${db_from} AND timestamp <= ${db_to}`);
    let values : number[] = [];
    for (let item of query.all()) {
        const i = item as {["total"]: number};
        values.push(i["total"]);
    }
    return {
        startTime: db_from,
        values: values
    };
}

export function getLineUsageDuring(from: number, to: number): LineColumnData {
    const db_from : number = getClosestDBTimestampTo(from, Table.POWER_USAGE);
    const db_to : number = getClosestDBTimestampTo(to, Table.POWER_USAGE);
    const values : number[][] = [];
    const line_names = ["line_a", "line_b", "line_c"];
    for (let i : number = 0; i < 3; i++) {
        const i_values = [];
        const query = db.query(`SELECT ${line_names[i]} FROM power_usage WHERE timestamp >= ${db_from} AND timestamp <= ${db_to}`);
        for (let item of query.all()) {
            const it = item as {[key: string]: number};
            i_values.push(it[line_names[i]]);
        }
        values.push(i_values);
    }
    return {
        startTime: db_from,
        values_a: values[0],
        values_b: values[1],
        values_c: values[2]
    }
}

export function getSolarGainDuring(from: number, to: number): SingleColumnData {
    const db_from : number = getClosestDBTimestampTo(from, Table.SOLAR_GAIN);
    const db_to : number = getClosestDBTimestampTo(to, Table.SOLAR_GAIN);
    const query = db.query(`SELECT gain FROM solar_gain WHERE timestamp >= ${db_from} AND timestamp <= ${db_to}`);
    let values : number[] = [];
    for (let item of query.all()) {
        const i = item as {["gain"]: number};
        values.push(i["gain"]);
    }
    return {
        startTime: db_from,
        values: values
    };
}

export function getLatestUsageData(): LastUsageValueData {
    const timestamp = getLastTimestamp(Table.POWER_USAGE);
    const query = db.query(`SELECT total, line_a, line_b, line_c from power_usage WHERE timestamp = ${timestamp}`);
    const res = query.get() as {
        "total": number,
        "line_a": number,
        "line_b": number,
        "line_c": number
    };
    return {
        timestamp,
        usage: res.total,
        usage_a: res.line_a,
        usage_b: res.line_b,
        usage_c: res.line_c
    };
}

export function getLatestGainData(): LastGainValueData {
    const timestamp = getLastTimestamp(Table.SOLAR_GAIN);
    const query = db.query(`SELECT gain FROM solar_gain WHERE timestamp = ${timestamp}`);
    const res = query.get() as {"gain": number};
    return {
        timestamp,
        gain: res.gain
    }
}

export function isTimestampValidForTable(timestamp: number, table: Table) {
    return timestamp >= getFirstTimestamp(table) && timestamp <= getLastTimestamp(table);
}

export function getClosestDBTimestampTo(to: number, table : Table): number {
    const tableName = getTableName(table);
    //const query = db.query(`SELECT min(timestamp) FROM ${tableName} WHERE timestamp >= ${to} UNION SELECT max(timestamp) FROM ${tableName} WHERE TIMESTAMP <= ${to};`);
    const query = db.query(`SELECT * FROM ${tableName} ORDER BY ABS(timestamp - ${to}) LIMIT 1;`);
    // This only happens if the database is empty 
    if (!query.get()) {
        console.log("ELELE");
        query.finalize();
        return getFirstTimestamp(table);
    }
    const res : number | null = (query.get() as {"timestamp": number})["timestamp"]; 
    query.finalize();
    // This only happens if all entries in the database are in the past of to or all entries in the database lie in the future of to.
    if (!res) {
        console.log("SAJDAISJD");
        return getFirstTimestamp(table);
    }
    return res;
}

function getFirstTimestamp(table : Table): number {
    const query = db.query(`SELECT timestamp FROM ${getTableName(table)} WHERE id=1;`);
    let res = query.get();
    if (!res) {
        return 0;
    }
    if (typeof res == "object") {
        const tres = res as {timestamp: number};
        return tres.timestamp;
    }
    return 0
}

function getLastTimestamp(table : Table): number {
    const query = db.query(`SELECT timestamp FROM ${getTableName(table)} ORDER BY timestamp DESC LIMIT 1;`);
    let res = query.get();
    if (!res) {
        return 0;
    }
    if (typeof res == "object") {
        const tres = res as {timestamp: number};
        return tres.timestamp;
    }
    return 0;
}

function getTableName(table : Table): string {
    return (table == Table.POWER_USAGE) ? "power_usage" : "solar_gain";
}