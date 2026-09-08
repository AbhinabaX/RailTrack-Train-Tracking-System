const axios = require("axios");

const RAILRADAR_BASE_URL =
    "https://api.railradar.in";


/* =====================================================
   GET TRAIN SEAT AVAILABILITY
===================================================== */

async function getSeatAvailability({
    trainNumber,
    source,
    destination,
    journeyDate,
    classCode,
    quotaCode = "GN"
}) {

    if (!trainNumber) {
        throw new Error(
            "Train number is required"
        );
    }

    if (!source) {
        throw new Error(
            "Source station is required"
        );
    }

    if (!destination) {
        throw new Error(
            "Destination station is required"
        );
    }

    if (!journeyDate) {
        throw new Error(
            "Journey date is required"
        );
    }

    if (!classCode) {
        throw new Error(
            "Class code is required"
        );
    }


    const apiKey =
        process.env.RAILRADAR_API_KEY;


    if (!apiKey) {
        throw new Error(
            "RAILRADAR_API_KEY is not configured"
        );
    }


    const url =
        `${RAILRADAR_BASE_URL}/v1/trains/${encodeURIComponent(
            trainNumber
        )}/seats`;


    console.log("");

    console.log(
        "======================================"
    );

    console.log(
        "SEAT AVAILABILITY REQUEST"
    );

    console.log(
        "TRAIN:",
        trainNumber
    );

    console.log(
        "SOURCE:",
        source
    );

    console.log(
        "DESTINATION:",
        destination
    );

    console.log(
        "JOURNEY DATE:",
        journeyDate
    );

    console.log(
        "CLASS:",
        classCode
    );

    console.log(
        "QUOTA:",
        quotaCode
    );

    console.log(
        "======================================"
    );


    try {

        const response =
            await axios.get(
                url,
                {
                    params: {

                        source:
                            String(
                                source
                            )
                                .trim()
                                .toUpperCase(),

                        destination:
                            String(
                                destination
                            )
                                .trim()
                                .toUpperCase(),

                        journeyDate:
                            String(
                                journeyDate
                            )
                                .trim(),

                        classCode:
                            String(
                                classCode
                            )
                                .trim()
                                .toUpperCase(),

                        quotaCode:
                            String(
                                quotaCode
                            )
                                .trim()
                                .toUpperCase()
                    },

                    headers: {

                        Authorization:
                            `Bearer ${apiKey}`,

                        Accept:
                            "application/json"
                    },

                    timeout: 15000
                }
            );


        if (
            !response.data
        ) {

            throw new Error(
                "Empty response from RailRadar"
            );
        }


        console.log(
            "Seat Availability API Status:",
            response.status
        );


        return response.data;

    } catch (error) {

        console.error(
            "RailRadar Seat Availability ERROR:"
        );


        /* ============================================
           RAILRADAR API ERROR
        ============================================ */

        const apiError =
            error?.response?.data?.error;


        /*
         * Invalid source / destination
         */

        if (
            apiError?.code ===
            "API:DATA_NOT_AVAILABLE"
        ) {

            throw new Error(
                apiError.message ||
                "Invalid Source and Destination."
            );
        }


        /*
         * Invalid API key
         */

        if (
            error?.response?.status === 401
        ) {

            throw new Error(
                "Invalid RailRadar API key."
            );
        }


        /*
         * Other RailRadar API errors
         */

        if (
            apiError?.message
        ) {

            throw new Error(
                apiError.message
            );
        }


        /*
         * Network / Axios / unknown error
         */

        throw new Error(
            error?.message ||
            "Unable to fetch seat availability."
        );
    }
}


/* =====================================================
   EXPORT
===================================================== */

module.exports = {
    getSeatAvailability
};