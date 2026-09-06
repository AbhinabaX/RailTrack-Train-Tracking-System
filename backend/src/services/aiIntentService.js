/* =========================================================
   RAILTRACK AI
   NATURAL LANGUAGE INTENT ENGINE
========================================================= */


/*
    This service converts a user's natural language
    into a structured RailTrack request.

    Example:

    "amar 12828 train e kal 3A te seat pabo?"

    becomes:

    {
        intent: "seat_availability",
        trainNumber: "12828",
        date: "tomorrow",
        source: null,
        destination: null,
        classCode: "3A"
    }
*/


/* =========================================================
   SUPPORTED INTENTS
========================================================= */

const INTENTS = {

    TRAIN_SEARCH:
        "train_search",

    LIVE_LOCATION:
        "live_location",

    DELAY:
        "delay",

    ETA:
        "eta",

    NEXT_STATION:
        "next_station",

    ROUTE:
        "route",

    SPEED:
        "speed",

    PROGRESS:
        "progress",

    PNR:
        "pnr",

    SEAT_AVAILABILITY:
        "seat_availability",

    COACH_POSITION:
        "coach_position",

    BETWEEN_STATIONS:
        "between_stations",

    TRAIN_INFO:
        "train_info",

    HELP:
        "help",

    UNKNOWN:
        "unknown"

};


/* =========================================================
   SUPPORTED TRAIN CLASSES
========================================================= */

const TRAIN_CLASSES = [
    "1A",
    "2A",
    "3A",
    "3E",
    "CC",
    "EC",
    "EA",
    "FC",
    "SL",
    "2S",
    "VS",
    "CH",
    "SH",
    "VC",
    "EV"
];


/* =========================================================
   CLEAN USER MESSAGE
========================================================= */

function cleanMessage(message) {

    return String(message || "")
        .trim();

}


/* =========================================================
   FIND TRAIN NUMBER
========================================================= */

function extractTrainNumber(message) {

    const match =
        message.match(
            /\b\d{5}\b/
        );

    return match
        ? match[0]
        : null;

}


/* =========================================================
   FIND PNR
========================================================= */

function extractPNR(message) {

    const match =
        message.match(
            /\b\d{10}\b/
        );

    return match
        ? match[0]
        : null;

}


/* =========================================================
   FIND CLASS
========================================================= */

function extractClass(message) {

    const upper =
        message.toUpperCase();


    for (
        const classCode
        of TRAIN_CLASSES
    ) {

        const regex =
            new RegExp(
                `\\b${classCode}\\b`
            );


        if (
            regex.test(
                upper
            )
        ) {

            return classCode;

        }

    }


    return null;

}


/* =========================================================
   FIND STATION CODES
========================================================= */

function extractStationCodes(message) {

    const matches =
        message.match(
            /\b[A-Z]{2,5}\b/g
        ) || [];


    const ignored =
        new Set([

            "FROM",
            "TO",
            "FOR",
            "THE",
            "AND",
            "WITH",
            "CHECK",
            "TRAIN",
            "SEAT",
            "SEATS",
            "CLASS",
            "COACH",
            "POSITION",
            "STATUS",
            "PNR",
            "ETA",
            "GN",
            "TQ",
            "SL",
            "CC",
            "EC",
            "EA",
            "FC",
            "2S",
            "2A",
            "3A",
            "3E",
            "1A"

        ]);


    return [
        ...new Set(
            matches
                .map(
                    code =>
                        code.toUpperCase()
                )
                .filter(
                    code =>
                        !ignored.has(
                            code
                        )
                )
        )
    ];

}


/* =========================================================
   FIND DATE INTENT
========================================================= */

function extractDateIntent(message) {

    const text =
        message.toLowerCase();


    if (
        text.includes("today") ||
        text.includes("আজ")
    ) {

        return "today";

    }


    if (
        text.includes("tomorrow") ||
        text.includes("কাল")
    ) {

        return "tomorrow";

    }


    if (
        text.includes("day after tomorrow") ||
        text.includes("পরশু")
    ) {

        return "day_after_tomorrow";

    }


    /* YYYY-MM-DD */

    const isoMatch =
        message.match(
            /\b\d{4}-\d{2}-\d{2}\b/
        );


    if (isoMatch) {

        return isoMatch[0];

    }


    return null;

}


/* =========================================================
   DETECT INTENT
========================================================= */

function detectIntent(message) {

    const text =
        message.toLowerCase();


    /* PNR */

    if (
        extractPNR(message) &&
        (
            text.includes("pnr") ||
            text.includes("ticket") ||
            text.includes("reservation") ||
            text.includes("passenger")
        )
    ) {

        return INTENTS.PNR;

    }


    /* Seat */

    if (
        text.includes("seat") ||
        text.includes("seats") ||
        text.includes("berth") ||
        text.includes("availability") ||
        text.includes("available") ||
        text.includes("সিট") ||
        text.includes("বার্থ") ||
        text.includes("খালি")
    ) {

        return INTENTS.SEAT_AVAILABILITY;

    }


    /* Coach */

    if (
        text.includes("coach") ||
        text.includes("coach position") ||
        text.includes("coach location") ||
        text.includes("formation") ||
        text.includes("কোচ")
    ) {

        return INTENTS.COACH_POSITION;

    }


    /* Live location */

    if (
        text.includes("where is") ||
        text.includes("where's") ||
        text.includes("location") ||
        text.includes("live location") ||
        text.includes("current location") ||
        text.includes("কোথায়") ||
        text.includes("কোথায়") ||
        text.includes("লোকেশন")
    ) {

        return INTENTS.LIVE_LOCATION;

    }


    /* Delay */

    if (
        text.includes("late") ||
        text.includes("delay") ||
        text.includes("delayed") ||
        text.includes("দেরি") ||
        text.includes("লেট")
    ) {

        return INTENTS.DELAY;

    }


    /* Next station */

    if (
        text.includes("next station") ||
        text.includes("next stop") ||
        text.includes("পরের স্টেশন")
    ) {

        return INTENTS.NEXT_STATION;

    }


    /* ETA */

    if (
        text.includes("eta") ||
        text.includes("arrival") ||
        text.includes("arrive") ||
        text.includes("reach") ||
        text.includes("পৌঁছাবে") ||
        text.includes("পৌছাবে")
    ) {

        return INTENTS.ETA;

    }


    /* Speed */

    if (
        text.includes("speed") ||
        text.includes("how fast") ||
        text.includes("গতি")
    ) {

        return INTENTS.SPEED;

    }


    /* Progress */

    if (
        text.includes("progress") ||
        text.includes("how far") ||
        text.includes("journey progress") ||
        text.includes("কতদূর")
    ) {

        return INTENTS.PROGRESS;

    }


    /* Route */

    if (
        text.includes("route") ||
        text.includes("stations") ||
        text.includes("stops") ||
        text.includes("রুট")
    ) {

        return INTENTS.ROUTE;

    }


    /* Between stations */

    if (
        (
            text.includes("from") &&
            text.includes("to")
        ) ||
        text.includes("between") ||
        text.includes("best train") ||
        text.includes("which train") ||
        text.includes("কোন ট্রেন")
    ) {

        return INTENTS.BETWEEN_STATIONS;

    }


    /* Train information */

    if (
        text.includes("about my train") ||
        text.includes("train information") ||
        text.includes("train details") ||
        text.includes("tell me about") ||
        text.includes("আমার ট্রেন") ||
        text.includes("ট্রেন সম্পর্কে")
    ) {

        return INTENTS.TRAIN_INFO;

    }


    /* Help */

    if (
        text.includes("what can you do") ||
        text.includes("features") ||
        text.includes("help") ||
        text.includes("কি করতে পারো") ||
        text.includes("কি কি করতে পারো")
    ) {

        return INTENTS.HELP;

    }


    return INTENTS.UNKNOWN;

}


/* =========================================================
   MAIN PARSER
========================================================= */

function parseUserIntent(message) {

    const clean =
        cleanMessage(
            message
        );


    const trainNumber =
        extractTrainNumber(
            clean
        );


    const pnr =
        extractPNR(
            clean
        );


    const classCode =
        extractClass(
            clean
        );


    const stationCodes =
        extractStationCodes(
            clean
        );


    const date =
        extractDateIntent(
            clean
        );


    const intent =
        detectIntent(
            clean
        );


    return {

        intent,

        message:
            clean,

        trainNumber,

        pnr,

        classCode,

        date,

        source:
            stationCodes[0] ||
            null,

        destination:
            stationCodes[1] ||
            null,

        stationCodes

    };

}


/* =========================================================
   EXPORT
========================================================= */

module.exports = {

    INTENTS,

    parseUserIntent

};