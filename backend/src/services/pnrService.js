"use strict";

const RAILRADAR_API_BASE =
    "https://api.railradar.in/v1";


/* =========================================================
   GET PNR STATUS
========================================================= */

async function getPNRStatus(pnr) {

    const cleanPNR =
        String(pnr || "").replace(/\D/g, "");


    /* =====================================================
       VALIDATE PNR
    ===================================================== */

    if (!/^\d{10}$/.test(cleanPNR)) {

        const error =
            new Error(
                "PNR must be exactly 10 digits."
            );

        error.statusCode = 400;

        throw error;
    }


    /* =====================================================
       API KEY
    ===================================================== */

    const apiKey =
        process.env.RAILRADAR_API_KEY;


    if (!apiKey) {

        const error =
            new Error(
                "RAILRADAR_API_KEY is not configured."
            );

        error.statusCode = 500;

        throw error;
    }


    /* =====================================================
       REQUEST RAILRADAR
    ===================================================== */

    const url =
        `${RAILRADAR_API_BASE}/pnr/${cleanPNR}`;


    console.log("");
    console.log("======================================");
    console.log("PNR STATUS REQUEST");
    console.log("PNR:", cleanPNR);
    console.log("======================================");


    let response;


    try {

        response = await fetch(
            url,
            {
                method: "GET",

                headers: {
                    "Authorization":
                        `Bearer ${apiKey}`,

                    "Accept":
                        "application/json"
                }
            }
        );

    } catch (error) {

        console.error(
            "RailRadar PNR Network Error:",
            error
        );

        const networkError =
            new Error(
                "Unable to connect to RailRadar."
            );

        networkError.statusCode = 503;

        throw networkError;
    }


    /* =====================================================
       READ RESPONSE
    ===================================================== */

    let result = null;

    try {

        result = await response.json();

    } catch (error) {

        console.error(
            "RailRadar PNR Invalid JSON:",
            error
        );

        const jsonError =
            new Error(
                "RailRadar returned an invalid response."
            );

        jsonError.statusCode = 502;

        throw jsonError;
    }


    /* =====================================================
       HANDLE RAILRADAR ERRORS
    ===================================================== */

    if (!response.ok || result.success === false) {

        console.error(
            "RailRadar PNR API ERROR:",
            result
        );


        const message =
            result?.error?.message ||
            "Unable to fetch PNR status.";


        const apiError =
            new Error(message);


        apiError.statusCode =
            response.status || 502;


        apiError.code =
            result?.error?.code || null;


        throw apiError;
    }


    /* =====================================================
       RETURN DATA
    ===================================================== */

    return result;

}


module.exports = {
    getPNRStatus
};