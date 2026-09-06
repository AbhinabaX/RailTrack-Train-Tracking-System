"use strict";

/*
=========================================================
RAILTRACK - STATION SERVICE
=========================================================

Purpose:
- Search Indian Railway stations
- Uses real RailRadar API
- Supports station name and station code search
- Keeps API key on backend
=========================================================
*/


/* =====================================================
   CONFIGURATION
===================================================== */

const RAILRADAR_BASE_URL =
    process.env.RAILRADAR_BASE_URL ||
    "https://api.railradar.in";


const RAILRADAR_API_KEY =
    process.env.RAILRADAR_API_KEY ||
    process.env.RAILRADAR_API_TOKEN ||
    "";


/* =====================================================
   VALIDATION
===================================================== */

function validateConfiguration() {

    if (!RAILRADAR_API_KEY) {

        throw new Error(
            "RAILRADAR_API_KEY is not configured."
        );
    }
}


/* =====================================================
   NORMALIZE STATION
===================================================== */

function normalizeStation(station) {

    if (!station) {
        return null;
    }


    const code =
        String(
            station.code ||
            station.stationCode ||
            ""
        )
            .trim()
            .toUpperCase();


    const name =
        String(
            station.name ||
            station.stationName ||
            ""
        )
            .trim();


    const city =
        String(
            station.city ||
            ""
        )
            .trim();


    if (!code && !name) {
        return null;
    }


    return {
        code,
        name,
        city
    };
}


/* =====================================================
   SEARCH STATIONS
===================================================== */

/**
 * Search stations using RailRadar.
 *
 * Examples:
 *
 * searchStations("How")
 * searchStations("HWH")
 * searchStations("Delhi")
 *
 * Returns:
 *
 * [
 *   {
 *      code: "HWH",
 *      name: "Howrah Junction",
 *      city: "Howrah"
 *   }
 * ]
 */

async function searchStations(
    query,
    limit = 10
) {

    validateConfiguration();


    const searchQuery =
        String(query || "")
            .trim();


    /* -----------------------------------------------
       Don't search extremely short queries.
    ------------------------------------------------ */

    if (searchQuery.length < 2) {
        return [];
    }


    /* -----------------------------------------------
       Keep limit within RailRadar allowed values.
    ------------------------------------------------ */

    let resultLimit =
        Number(limit);


    if (!Number.isFinite(resultLimit)) {
        resultLimit = 10;
    }


    resultLimit =
        Math.max(
            5,
            Math.min(
                50,
                Math.floor(resultLimit)
            )
        );


    /* -----------------------------------------------
       Build RailRadar URL
    ------------------------------------------------ */

    const url =
        new URL(
            "/v1/lookup/search/stations",
            RAILRADAR_BASE_URL
        );


    url.searchParams.set(
        "q",
        searchQuery
    );


    url.searchParams.set(
        "limit",
        String(resultLimit)
    );


    /* -----------------------------------------------
       Call RailRadar
    ------------------------------------------------ */

    const response =
        await fetch(
            url,
            {
                method: "GET",

                headers: {
                    "Accept": "application/json",

                    "Authorization":
                        `Bearer ${RAILRADAR_API_KEY}`
                }
            }
        );


    /* -----------------------------------------------
       Handle API errors
    ------------------------------------------------ */

    if (!response.ok) {

        let errorBody = null;


        try {

            errorBody =
                await response.json();

        } catch {
            errorBody = null;
        }


        const message =
            errorBody?.error?.message ||
            errorBody?.message ||
            `RailRadar station search failed with status ${response.status}`;


        const error =
            new Error(message);


        error.status =
            response.status;


        error.code =
            errorBody?.error?.code ||
            null;


        throw error;
    }


    /* -----------------------------------------------
       Parse response
    ------------------------------------------------ */

    const result =
        await response.json();


    /* -----------------------------------------------
       RailRadar response:

       {
         success: true,
         data: [
           {
             code: "NDLS",
             name: "New Delhi",
             city: "Delhi"
           }
         ]
       }
    ------------------------------------------------ */

    const stations =
        Array.isArray(result?.data)
            ? result.data
            : Array.isArray(result)
                ? result
                : [];


    /* -----------------------------------------------
       Normalize and remove invalid results
    ------------------------------------------------ */

    const normalized =
        stations
            .map(
                normalizeStation
            )
            .filter(
                Boolean
            );


    /* -----------------------------------------------
       Remove duplicate station codes
    ------------------------------------------------ */

    const uniqueStations = [];


    const seenCodes =
        new Set();


    for (
        const station
        of normalized
    ) {

        const key =
            station.code ||
            station.name.toUpperCase();


        if (
            seenCodes.has(key)
        ) {
            continue;
        }


        seenCodes.add(key);

        uniqueStations.push(
            station
        );
    }


    return uniqueStations;
}


/* =====================================================
   GET STATION BY CODE
===================================================== */

/**
 * Finds a station by exact station code.
 *
 * This uses the station search endpoint so that we don't
 * need to download the complete station directory.
 */

async function getStationByCode(
    code
) {

    const stationCode =
        String(code || "")
            .trim()
            .toUpperCase();


    if (!stationCode) {
        return null;
    }


    const stations =
        await searchStations(
            stationCode,
            10
        );


    const exactMatch =
        stations.find(
            station =>
                station.code ===
                stationCode
        );


    return exactMatch || null;
}


/* =====================================================
   RESOLVE STATION
===================================================== */

/**
 * Resolve a user supplied station.
 *
 * Examples:
 *
 * resolveStation("HWH")
 * resolveStation("Howrah")
 *
 * Returns a normalized station object.
 */

async function resolveStation(
    value
) {

    const query =
        String(value || "")
            .trim();


    if (!query) {
        return null;
    }


    const stations =
        await searchStations(
            query,
            10
        );


    if (!stations.length) {
        return null;
    }


    const upperQuery =
        query.toUpperCase();


    /* -----------------------------------------------
       First preference:
       Exact station code
    ------------------------------------------------ */

    const exactCode =
        stations.find(
            station =>
                station.code ===
                upperQuery
        );


    if (exactCode) {
        return exactCode;
    }


    /* -----------------------------------------------
       Second preference:
       Exact station name
    ------------------------------------------------ */

    const exactName =
        stations.find(
            station =>
                station.name
                    .toUpperCase() ===
                upperQuery
        );


    if (exactName) {
        return exactName;
    }


    /* -----------------------------------------------
       Otherwise return best first result
    ------------------------------------------------ */

    return stations[0];
}


/* =====================================================
   EXPORTS
===================================================== */

module.exports = {
    searchStations,
    getStationByCode,
    resolveStation
};