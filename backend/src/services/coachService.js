"use strict";


const RAILRADAR_API_BASE =
    "https://api.railradar.in/v1";


/* =========================================================
   GET COACH POSITION
========================================================= */

async function getCoachPosition(
    trainNumber,
    stationCode
) {

    /* =====================================================
       CLEAN INPUT
    ===================================================== */

    const number =
        String(
            trainNumber || ""
        )
            .replace(/\D/g, "")
            .trim();


    const station =
        String(
            stationCode || ""
        )
            .trim()
            .toUpperCase();


    /* =====================================================
       VALIDATE TRAIN NUMBER
    ===================================================== */

    if (
        !/^\d{5}$/.test(number)
    ) {

        const error =
            new Error(
                "Train number must be exactly 5 digits."
            );

        error.statusCode = 400;

        throw error;
    }


    /* =====================================================
       VALIDATE STATION CODE
    ===================================================== */

    if (
        !/^[A-Z0-9]{1,10}$/.test(station)
    ) {

        const error =
            new Error(
                "Invalid station code."
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
       RAILRADAR URL
    ===================================================== */

    const url =
        `${RAILRADAR_API_BASE}` +
        `/trains/${number}` +
        `/coaches/${station}`;


    console.log("");

    console.log(
        "======================================"
    );

    console.log(
        "COACH POSITION REQUEST"
    );

    console.log(
        "TRAIN:",
        number
    );

    console.log(
        "STATION:",
        station
    );

    console.log(
        "======================================"
    );


    /* =====================================================
       API REQUEST
    ===================================================== */

    let response;


    try {

        response =
            await fetch(
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
            "RailRadar Coach Network Error:",
            error
        );


        const networkError =
            new Error(
                "Unable to connect to RailRadar."
            );


        networkError.statusCode =
            503;


        throw networkError;
    }


    /* =====================================================
       READ JSON
    ===================================================== */

    let result;


    try {

        result =
            await response.json();

    } catch (error) {

        console.error(
            "RailRadar Coach Invalid JSON:",
            error
        );


        const jsonError =
            new Error(
                "RailRadar returned an invalid response."
            );


        jsonError.statusCode =
            502;


        throw jsonError;
    }


    /* =====================================================
       HANDLE API ERROR
    ===================================================== */

    if (
        !response.ok ||
        result.success === false
    ) {

        console.error(
            "RailRadar Coach API ERROR:",
            result
        );


        const apiError =
            new Error(
                result?.error?.message ||
                "Unable to fetch coach position."
            );


        apiError.statusCode =
            response.status || 502;


        apiError.code =
            result?.error?.code || null;


        throw apiError;
    }


    /* =====================================================
       RETURN RESULT
    ===================================================== */

    return result;

}


module.exports = {

    getCoachPosition

};