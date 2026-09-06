/* =========================================================
   RAILTRACK - COMPLETE FRONTEND APP
   Live Train + Map + Route + Station Timing + ETA
========================================================= */

"use strict";

/* =========================================================
   CONFIG
========================================================= */

const API_BASE = "/api";
const AUTO_REFRESH_TIME = 30000;


/* =========================================================
   GLOBAL STATE
========================================================= */

let map = null;
let routeLayer = null;
let stationLayer = null;
let trainMarker = null;
let travelledRouteLayer = null;
let swapStationsButton = null;

let currentTrainNumber = "";
let currentJourneyDate = "";

let refreshTimer = null;
let isLoading = false;


/* =========================================================
   DOM ELEMENTS
========================================================= */

let trainTab = null;
let betweenTab = null;
let pnrTab = null;

let trainSearchForm = null;
let betweenSearchForm = null;
let pnrSection = null;
let pnrSearchForm = null;
let pnrNumberInput = null;
let pnrSearchButton = null;
let pnrResult = null;
let seatAvailabilityTab = null;

let seatAvailabilitySection = null;
let seatAvailabilityForm = null;

let seatTrainNumberInput = null;
let seatSourceInput = null;
let seatDestinationInput = null;
let seatJourneyDateInput = null;
let seatClassCodeInput = null;
let seatQuotaCodeInput = null;

let seatAvailabilityButton = null;
let seatAvailabilityResult = null;
let seatAvailabilityLoading = null;




let trainNumberInput = null;
let trainDateInput = null;

let fromStationInput = null;
let toStationInput = null;
let betweenDateInput = null;

let trainSearchButton = null;
let betweenSearchButton = null;
let aiConversationContext = {
    lastIntent: null,
    trainNumber: null
};

let errorBox = null;
let dashboard = null;
let emptyState = null;

let betweenResults = null;
let trainList = null;

let connectionStatus = null;

let coachPositionSection = null;
let coachStationInfo = null;
let coachPlatform = null;
let coachFormation = null;
let coachDetails = null;

let currentCoachData = null;
let aiSeatAvailabilityData = null;
let aiTrainData = null;


/* =========================================================
   DOM HELPER
========================================================= */

function $(id) {
    return document.getElementById(id);
}


/* =========================================================
   GLOBAL STATUS NORMALIZER
========================================================= */

function normalizeStatus(value) {

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return "UNKNOWN";
    }

    const status = String(value)
        .trim()
        .toUpperCase();

    if (status.includes("CANCEL")) {
        return "CANCELLED";
    }

    if (
        status.includes("NOT RUN") ||
        status.includes("NOTRUN")
    ) {
        return "NOT RUNNING";
    }

    if (
        status.includes("RUNNING") ||
        status === "RUN"
    ) {
        return "RUNNING";
    }

    if (status.includes("ARRIV")) {
        return "ARRIVED";
    }

    if (status.includes("DEPART")) {
        return "DEPARTED";
    }

    if (
        status.includes("TERMINAT") ||
        status.includes("DESTINATION") ||
        status.includes("COMPLET")
    ) {
        return "COMPLETED";
    }

    if (
        status.includes("LATE") ||
        status.includes("DELAY")
    ) {
        return "DELAYED";
    }

    if (
        status.includes("ON TIME") ||
        status.includes("ONTIME")
    ) {
        return "ON TIME";
    }

    return status;
}

window.normalizeStatus = normalizeStatus;


/* =========================================================
   STARTUP
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    cacheDomElements();

    setupTabs();
    setupTrainSearch();
    setupBetweenSearch();
    setupStationSwap();
    setupPNRSearch();
    setupRefreshButton();
    setupSeatAvailability();

    setTodayDate();
    checkBackend();

});


/* =========================================================
   CACHE DOM
========================================================= */

function cacheDomElements() {

    trainTab = $("trainTab");
    betweenTab = $("betweenTab");
    pnrTab = $("pnrTab");
    seatAvailabilityTab =
    $("seatAvailabilityTab");

seatAvailabilitySection =
    $("seatAvailabilitySection");

seatAvailabilityForm =
    $("seatAvailabilityForm");

seatTrainNumberInput =
    $("seatTrainNumber");

seatSourceInput =
    $("seatSource");

seatDestinationInput =
    $("seatDestination");

seatJourneyDateInput =
    $("seatJourneyDate");

seatClassCodeInput =
    $("seatClassCode");

seatQuotaCodeInput =
    $("seatQuotaCode");

seatAvailabilityButton =
    $("seatAvailabilityButton");

seatAvailabilityResult =
    $("seatAvailabilityResult");

seatAvailabilityLoading =
    $("seatAvailabilityLoading");
    
    pnrSection = $("pnrSection");
    pnrSearchForm = $("pnrSearchForm");
    pnrNumberInput = $("pnrNumber");
    pnrSearchButton = $("pnrSearchButton");
    pnrResult = $("pnrResult");


    /* =====================================================
       COACH POSITION
    ===================================================== */

    coachPositionSection =
        $("coachPositionSection");

    coachStationInfo =
        $("coachStationInfo");

    coachPlatform =
        $("coachPlatform");

    coachFormation =
        $("coachFormation");

    coachDetails =
        $("coachDetails");


    trainSearchForm = $("trainSearchForm");
    betweenSearchForm = $("betweenSearchForm");

    trainNumberInput = $("trainNumber");
    trainDateInput = $("trainDate");

    fromStationInput = $("fromStation");
    toStationInput = $("toStation");
    swapStationsButton = $("swapStationsButton");

    betweenDateInput = $("betweenDate");

    trainSearchButton = $("trainSearchButton");
    betweenSearchButton = $("betweenSearchButton");

    errorBox = $("errorBox");

    dashboard = $("dashboard");
    emptyState = $("emptyState");

    betweenResults = $("betweenResults");
    trainList = $("trainList");

    connectionStatus = $("connectionStatus");
}


/* =========================================================
   TODAY DATE
========================================================= */

/* =========================================================
   DATE SETUP
========================================================= */

function setTodayDate() {

    const today = new Date();

    const year =
        today.getFullYear();

    const month =
        String(
            today.getMonth() + 1
        ).padStart(2, "0");

    const day =
        String(
            today.getDate()
        ).padStart(2, "0");

    const todayValue =
        `${year}-${month}-${day}`;


    /* TRAIN DATE */

    if (trainDateInput) {

        trainDateInput.value =
            todayValue;

    }


    /* BETWEEN STATION DATE */

    if (betweenDateInput) {

        betweenDateInput.value =
            todayValue;

    }


/* =====================================================
   SEAT AVAILABILITY DATE
   DEFAULT = TOMORROW
===================================================== */

if (seatJourneyDateInput) {

    const tomorrow =
        new Date(today);

    tomorrow.setDate(
        today.getDate() + 1
    );


    const tomorrowYear =
        tomorrow.getFullYear();

    const tomorrowMonth =
        String(
            tomorrow.getMonth() + 1
        ).padStart(2, "0");

    const tomorrowDay =
        String(
            tomorrow.getDate()
        ).padStart(2, "0");


    const tomorrowValue =
        `${tomorrowYear}-${tomorrowMonth}-${tomorrowDay}`;


    /* ================================================
       PAST DATES DISABLED
    ================================================ */

    seatJourneyDateInput.min =
        todayValue;


    /* ================================================
       DEFAULT DATE = TOMORROW
    ================================================ */

    seatJourneyDateInput.value =
        tomorrowValue;


    /* ================================================
       OPEN NATIVE CALENDAR ON CLICK
    ================================================ */

    seatJourneyDateInput.addEventListener(
        "click",
        () => {

            if (
                typeof seatJourneyDateInput.showPicker ===
                "function"
            ) {

                seatJourneyDateInput.showPicker();

            }

        }
    );

}

}




/* =========================================================
   TAB SYSTEM
========================================================= */

/* =========================================================
   TAB SYSTEM
========================================================= */

function setupTabs() {

    function showOnly(activeTab) {

        /* =========================
           RESET ALL TABS
        ========================= */

        [
            trainTab,
            betweenTab,
            pnrTab,
            seatAvailabilityTab
        ].forEach(tab => {

            if (tab) {
                tab.classList.remove("active");
            }

        });


        /* =========================
           HIDE ALL SEARCH SECTIONS
        ========================= */

        if (trainSearchForm) {
            trainSearchForm.classList.add("hidden");
        }

        if (betweenSearchForm) {
            betweenSearchForm.classList.add("hidden");
        }

        if (pnrSection) {
            pnrSection.classList.add("hidden");
        }

        if (seatAvailabilitySection) {
            seatAvailabilitySection.classList.add("hidden");
        }


        /* =========================
           SHOW SELECTED SECTION
        ========================= */

        if (activeTab === "train") {

            trainTab?.classList.add("active");

            trainSearchForm?.classList.remove("hidden");

        }


        else if (activeTab === "between") {

            betweenTab?.classList.add("active");

            betweenSearchForm?.classList.remove("hidden");

        }


        else if (activeTab === "pnr") {

            pnrTab?.classList.add("active");

            pnrSection?.classList.remove("hidden");

        }


        else if (activeTab === "seat") {

            seatAvailabilityTab?.classList.add("active");

            seatAvailabilitySection?.classList.remove("hidden");

        }


        hideError();

    }


    /* =========================
       SEARCH BY TRAIN
    ========================= */

    if (trainTab) {

        trainTab.addEventListener(
            "click",
            () => showOnly("train")
        );

    }


    /* =========================
       BETWEEN STATIONS
    ========================= */

    if (betweenTab) {

        betweenTab.addEventListener(
            "click",
            () => showOnly("between")
        );

    }


    /* =========================
       PNR
    ========================= */

    if (pnrTab) {

        pnrTab.addEventListener(
            "click",
            () => showOnly("pnr")
        );

    }


    /* =========================
       SEAT AVAILABILITY
    ========================= */

    if (seatAvailabilityTab) {

        seatAvailabilityTab.addEventListener(
            "click",
            () => showOnly("seat")
        );

    }


    /* =========================
       DEFAULT
       SEARCH BY TRAIN
    ========================= */

    showOnly("train");

}


/* =========================================================
   BACKEND CHECK
========================================================= */

async function checkBackend() {

    if (!connectionStatus) {
        return;
    }

    try {

        const response = await fetch(
            `${API_BASE}/health`,
            {
                method: "GET",
                cache: "no-store",
                headers: {
                    Accept: "application/json"
                }
            }
        );

        const data = await getJson(response);

        if (
            response.ok &&
            data &&
            (
                data.success === true ||
                data.status === "ok" ||
                data.status === "healthy"
            )
        ) {

            connectionStatus.textContent =
                "● Live Railway Data";

            connectionStatus.className =
                "connection connected";

        } else {

            throw new Error("Backend unavailable");

        }

    } catch (error) {

        connectionStatus.textContent =
            "● Backend disconnected";

        connectionStatus.className =
            "connection disconnected";

        console.error(
            "Backend check:",
            error
        );
    }
}


/* =========================================================
   ERROR
========================================================= */

function showError(message) {

    if (!errorBox) {
        return;
    }

    errorBox.textContent =
        message || "Something went wrong.";

    errorBox.classList.remove("hidden");
}


function hideError() {

    if (!errorBox) {
        return;
    }

    errorBox.textContent = "";

    errorBox.classList.add("hidden");
}


/* =========================================================
   SAFE JSON
========================================================= */

async function getJson(response) {

    const text = await response.text();

    if (!text) {
        return {};
    }

    try {

        return JSON.parse(text);

    } catch {

        throw new Error(
            `Server returned invalid response (${response.status}).`
        );
    }
}


/* =========================================================
   BUTTON LOADING
========================================================= */

function buttonLoading(
    button,
    loading,
    normalText
) {

    if (!button) {
        return;
    }

    button.disabled = loading;

    button.textContent =
        loading
            ? "Searching..."
            : normalText;
}


/* =========================================================
   TRAIN NUMBER
========================================================= */

function cleanTrainNumber(value) {

    return String(value || "")
        .replace(/\D/g, "")
        .slice(0, 5);
}


/* =========================================================
   TRAIN SEARCH
========================================================= */

function setupTrainSearch() {

    if (!trainSearchForm) {
        return;
    }

    trainSearchForm.addEventListener(
        "submit",
        async event => {

            event.preventDefault();

            if (isLoading) {
                return;
            }

            hideError();

            const trainNumber =
                cleanTrainNumber(
                    trainNumberInput?.value
                );

            const date =
                trainDateInput?.value || "";

            if (trainNumber.length !== 5) {

                showError(
                    "Please enter a valid 5-digit train number."
                );

                return;
            }

            currentTrainNumber = trainNumber;
            currentJourneyDate = date;

            stopAutoRefresh();

            buttonLoading(
                trainSearchButton,
                true,
                "Search Train"
            );

            isLoading = true;

            try {

                await loadTrain(
                    trainNumber,
                    date
                );

            } catch (error) {

                console.error(
                    "Train search error:",
                    error
                );

                showError(
                    error.message ||
                    "Unable to load train information."
                );

                dashboard?.classList.add("hidden");
                emptyState?.classList.remove("hidden");

            } finally {

                buttonLoading(
                    trainSearchButton,
                    false,
                    "Search Train"
                );

                isLoading = false;
            }
        }
    );
}


/* =========================================================
   LOAD TRAIN
========================================================= */

async function loadTrain(
    trainNumber,
    date = ""
) {

    const params =
        new URLSearchParams();


    if (date) {

        params.set(
            "date",
            date
        );

    }


    const query =
        params.toString();


    const url =
        `${API_BASE}/trains/${encodeURIComponent(
            trainNumber
        )}/dashboard${
            query
                ? `?${query}`
                : ""
        }`;


    console.log(
        "Loading train:",
        url
    );


    const response =
        await fetch(
            url,
            {
                method: "GET",
                cache: "no-store",
                headers: {
                    "Accept": "application/json"
                }
            }
        );


    const data =
        await getJson(response);


    if (
        !response.ok ||
        data?.success === false
    ) {

        const message =
            data?.error?.message ||
            data?.message ||
            "Train information could not be found.";


        throw new Error(
            message
        );

    }


    if (!data) {

        throw new Error(
            "The railway server returned no information."
        );

    }


    const hasTrain =
        data.train ||
        data.running ||
        data.route ||
        data.dashboard ||
        data.data;


    if (!hasTrain) {

        throw new Error(
            "The railway server returned no train information."
        );

    }


    currentTrainNumber =
        trainNumber;


    currentJourneyDate =
        date;


    /* =====================================================
       MAIN TRAIN DASHBOARD
    ===================================================== */

    renderDashboard(
        data
    );


    /* =====================================================
       COACH POSITION
    ===================================================== */

    console.log(
        "🚆 Starting Coach Position...",
        trainNumber
    );


    loadCoachPosition(
        trainNumber,
        data
    )
        .catch(
            (error) => {

                console.error(
                    "Coach Position failed:",
                    error
                );

            }
        );


    /* =====================================================
       SHOW DASHBOARD
    ===================================================== */

    if (emptyState) {
        emptyState.classList.add(
            "hidden"
        );
    }


    if (dashboard) {
        dashboard.classList.remove(
            "hidden"
        );
    }


    if (betweenResults) {
        betweenResults.classList.add(
            "hidden"
        );
    }


    /* =====================================================
       CONNECTION STATUS
    ===================================================== */

    if (connectionStatus) {

        connectionStatus.textContent =
            "● Live Railway Data";

        connectionStatus.className =
            "connection connected";

    }


    /* =====================================================
       AUTO REFRESH
    ===================================================== */

startAutoRefresh();

return data;

}
/* =========================================================
   COACH POSITION
========================================================= */

async function loadCoachPosition(
    trainNumber,
    dashboardData
) {

    if (!coachPositionSection) {
        return;
    }

    try {

        const stationCode =
            getCoachStationCode(
                dashboardData
            );

        if (!stationCode) {

            console.log(
                "Coach Position: No suitable halting station found."
            );

            hideCoachPosition();

            return;
        }


        console.log(
            "Loading Coach Position:",
            trainNumber,
            stationCode
        );


        const response =
            await fetch(
                `${API_BASE}/coaches/` +
                `${encodeURIComponent(trainNumber)}/` +
                `${encodeURIComponent(stationCode)}`,
                {
                    method: "GET",
                    cache: "no-store",
                    headers: {
                        "Accept":
                            "application/json"
                    }
                }
            );


        const result =
            await getJson(response);


        if (!response.ok) {

            throw new Error(
                result?.error?.message ||
                result?.message ||
                `Coach request failed (${response.status})`
            );

        }


        if (
            !result ||
            result.success !== true
        ) {

            throw new Error(
                result?.error?.message ||
                "Coach position is unavailable."
            );

        }


        const data =
            result.data || result;


        currentCoachData =
            data;


        renderCoachPosition(
            data,
            stationCode
        );


    } catch (error) {

        console.error(
            "COACH POSITION ERROR:",
            error
        );


        /*
           Coach information is an additional feature.
           If it fails, the main train dashboard
           should continue working normally.
        */

        hideCoachPosition();

    }

}


/* =========================================================
   FIND SUITABLE STATION FOR COACH POSITION
========================================================= */

function getCoachStationCode(
    data
) {

    const running =
        data?.running ||
        data?.dashboard?.running ||
        data?.live ||
        {};


    const current =
        running?.currentStation ||
        running?.currentLocation ||
        data?.currentStation ||
        data?.currentLocation ||
        {};


    const next =
        running?.nextHalt ||
        running?.nextStation ||
        data?.nextHalt ||
        data?.nextStation ||
        {};


    /*
       First preference:
       current station if it has a valid code.
    */

    const currentCode =
        current?.stationCode ||
        current?.code ||
        current?.station?.code ||
        current?.stationCode;


    if (
        currentCode &&
        isValidStationCode(
            currentCode
        )
    ) {

        return String(
            currentCode
        )
            .trim()
            .toUpperCase();

    }


    /*
       Second preference:
       next halting station.
    */

    const nextCode =
        next?.stationCode ||
        next?.code ||
        next?.station?.code;


    if (
        nextCode &&
        isValidStationCode(
            nextCode
        )
    ) {

        return String(
            nextCode
        )
            .trim()
            .toUpperCase();

    }


    /*
       Third preference:
       Search route for a halting station.
    */

    const stops =
        getRouteStops(
            data
        );


    const halt =
        stops.find(
            (stop) => {

                const code =
                    getStopCode(
                        stop
                    );

                return (
                    isValidStationCode(
                        code
                    ) &&
                    isStopHalt(
                        stop
                    )
                );

            }
        );


    if (halt) {

        return getStopCode(
            halt
        );

    }


    return null;
}


/* =========================================================
   VALIDATE STATION CODE
========================================================= */

function isValidStationCode(
    value
) {

    return /^[A-Z0-9]{1,10}$/.test(
        String(
            value || ""
        )
            .trim()
            .toUpperCase()
    );

}


/* =========================================================
   GET ROUTE STOPS
========================================================= */

function getRouteStops(
    data
) {

    const possibleRoutes = [

        data?.route,

        data?.stops,

        data?.stations,

        data?.route?.stations,

        data?.route?.stops,

        data?.dashboard?.route,

        data?.dashboard?.stops,

        data?.dashboard?.stations

    ];


    for (
        const value
        of possibleRoutes
    ) {

        if (
            Array.isArray(
                value
            ) &&
            value.length
        ) {

            return value;

        }

    }


    return [];

}


/* =========================================================
   CHECK HALTING STATION
========================================================= */

function isStopHalt(
    stop
) {

    if (!stop) {
        return false;
    }


    if (
        stop.isHalt === true ||
        stop.halt === true ||
        stop.isStop === true
    ) {

        return true;

    }


    if (
        stop.stopType === "HALT" ||
        stop.type === "HALT"
    ) {

        return true;

    }


    /*
       If arrival/departure information exists,
       it is normally a scheduled stopping point.
    */

    return Boolean(
        stop.arrival ||
        stop.departure ||
        stop.scheduledArrival ||
        stop.scheduledDeparture
    );

}


/* =========================================================
   RENDER COACH POSITION
========================================================= */

/* =========================================================
   RENDER COACH POSITION
========================================================= */

function renderCoachPosition(
    data,
    stationCode
) {

    if (
        !coachPositionSection ||
        !coachFormation
    ) {
        return;
    }

    const station =
        data?.station || {};

    const stationName =
        station?.name ||
        stationCode;

    const actualStationCode =
        station?.code ||
        stationCode;

    const platform =
        station?.platform ||
        "—";

    /*
       RailRadar coach formation
       comes inside `rake`
    */

    const coaches =
        Array.isArray(data?.rake)
            ? data.rake
            : [];

    console.log(
        "🚆 Coach data received:",
        coaches
    );

    if (!coaches.length) {

        console.warn(
            "No coach formation found."
        );

        hideCoachPosition();

        return;
    }

    /*
       Station information
    */

    if (coachStationInfo) {

        coachStationInfo.textContent =
            `${stationName} (${actualStationCode})`;
    }

    /*
       Platform
    */

    if (coachPlatform) {

        coachPlatform.textContent =
            `Platform ${platform}`;
    }

    /*
       Train Formation
    */

    coachFormation.innerHTML =
        coaches
            .map(
                (
                    coach,
                    index
                ) => {

                    const displayInfo =
                        getCoachDisplayInfo(
                            coach
                        );

                    const position =
                        coach?.position ??
                        index + 1;

                    const code =
                        displayInfo.code ||
                        "Coach";

                    const classType =
                        displayInfo.classType ||
                        "—";

                    const className =
                        displayInfo.className ||
                        "";

                    return `
                        <button
                            type="button"
                            class="coach-card"
                            data-coach-index="${index}"
                        >

                            <span
                                class="coach-position"
                            >
                                ${escapeHtml(
                                    String(position)
                                )}
                            </span>

                            <strong>
                                ${escapeHtml(
                                    String(code)
                                )}
                            </strong>

                            <span
                                class="coach-class"
                            >
                                ${escapeHtml(
                                    String(classType)
                                )}
                            </span>

                        </button>
                    `;
                }
            )
            .join("");

    /*
       Coach click events
    */

    const coachCards =
        coachFormation.querySelectorAll(
            ".coach-card"
        );

    coachCards.forEach(
        (
            card
        ) => {

            card.addEventListener(
                "click",
                () => {

                    const index =
                        Number(
                            card.dataset
                                .coachIndex
                        );

                    const coach =
                        coaches[index];

                    renderCoachDetails(
                        coach
                    );

                    coachCards.forEach(
                        (
                            item
                        ) => {

                            item.classList.remove(
                                "active"
                            );
                        }
                    );

                    card.classList.add(
                        "active"
                    );
                }
            );
        }
    );

    /*
       Show first coach
    */

    if (
        coachCards.length
    ) {

        renderCoachDetails(
            coaches[0]
        );

        coachCards[0]
            .classList
            .add(
                "active"
            );
    }

    /*
       SHOW COACH SECTION
    */

    coachPositionSection.classList.remove(
        "hidden"
    );

    console.log(
        "✅ Coach Position rendered successfully."
    );
}


/* =========================================================
   COACH DETAILS
========================================================= */

/* =========================================================
   RENDER COACH DETAILS + SEAT LAYOUT
========================================================= */
/* =========================================================
   COACH DISPLAY INFORMATION
   General coach-class mapping
========================================================= */

/* =========================================================
   NORMALIZE COACH INFORMATION
========================================================= */

function getCoachDisplayInfo(coach) {

    const code =
        String(
            coach?.code || ""
        )
            .trim()
            .toUpperCase();


    /* =====================================================
       D COACHES = SECOND SITTING
    ===================================================== */

    if (
        /^D\d+$/.test(code)
    ) {

        return {
            code: code,
            classType: "2S",
            className: "Second Sitting",
            category: "2s",
            hasSeats: true,
            totalBerths: null
        };

    }


    /* =====================================================
       NORMAL API DATA
    ===================================================== */

    return {

        code: code,

        classType:
            coach?.classType || "—",

        className:
            coach?.className || "—",

        category:
            coach?.category || "—",

        hasSeats:
            coach?.hasSeats ?? false,

        totalBerths:
            coach?.totalBerths ?? "—"

    };

}
function renderCoachDetails(
    coach
) {

    if (!coachDetails) {
        return;
    }


    if (!coach) {

        coachDetails.classList.add(
            "hidden"
        );

        coachDetails.innerHTML =
            "";

        return;

    }


    const position =
        coach?.position ??
        "—";


const displayInfo =
    getCoachDisplayInfo(coach);


const code =
    displayInfo.code ||
    "—";


const category =
    displayInfo.category ||
    "—";


const classType =
    displayInfo.classType ||
    "—";


const className =
    displayInfo.className ||
    "—";


const totalBerths =
    displayInfo.totalBerths ??
    "—";


const hasSeats =
    displayInfo.hasSeats;


    /* =====================================================
       FIND BLUEPRINT
    ===================================================== */

    const blueprints =
        currentCoachData?.blueprints ||
        {};


    const blueprint =
        blueprints[classType] ||
        null;


    let layoutHTML =
        "";
    /* =====================================================
   2S COACH INFORMATION
===================================================== */

/* =====================================================
   2S COACH GRAPHICAL SEAT MAP
===================================================== */

if (
    classType === "2S"
) {

    /*
       Standard visual representation for a
       Second Sitting (2S) coach.

       Seat numbers:
       1 - 106
    */

    const totalSeats = 106;

    const seats = [];

    for (
        let number = 1;
        number <= totalSeats;
        number++
    ) {

        let type = "Aisle";

        /*
           Approximate seating classification
           for visual representation.
        */

        const position =
            number % 6;

        if (
            position === 1 ||
            position === 0
        ) {
            type = "Window";
        }
        else if (
            position === 2 ||
            position === 5
        ) {
            type = "Middle";
        }
        else {
            type = "Aisle";
        }

        seats.push({
            number,
            type
        });

    }


    /*
       Create a 2S coach row.

       First row:
       5 seats

       Remaining:
       12 seats per bay
    */

    const firstSeats =
        seats.slice(
            0,
            5
        );

    const remainingSeats =
        seats.slice(
            5
        );


    const seatHTML =
        (seat) => {

            return `
                <button
                    type="button"
                    class="
                        coach-2s-seat
                        coach-2s-${seat.type
                            .toLowerCase()
                            .replace(
                                /\s+/g,
                                "-"
                            )}
                    "
                    title="${escapeHtml(
                        seat.type
                    )} seat ${seat.number}"
                    data-seat-number="${seat.number}"
                >
                    <span>
                        ${seat.number}
                    </span>
                </button>
            `;

        };


    /*
       First front section
    */

    const frontHTML = `

        <div class="coach-2s-front">

            <div class="coach-2s-toilet">
                TOILET
            </div>

            <div class="coach-2s-toilet">
                TOILET
            </div>

        </div>

        <div class="coach-2s-entry">

            <span>
                COACH ENTRY / EXIT
            </span>

            <div class="coach-2s-front-seats">

                ${firstSeats
                    .map(
                        seatHTML
                    )
                    .join("")}

            </div>

        </div>

    `;


    /*
       Create 12-seat bays.

       Left:
       3 + 3

       Right:
       3 + 3

       Middle:
       aisle
    */

    const bayHTML = [];

    for (
        let i = 0;
        i < remainingSeats.length;
        i += 12
    ) {

        const bay =
            remainingSeats.slice(
                i,
                i + 12
            );

        if (
            bay.length < 12
        ) {
            break;
        }


        const leftTop =
            bay.slice(
                0,
                3
            );

        const rightTop =
            bay.slice(
                3,
                6
            );

        const leftBottom =
            bay.slice(
                6,
                9
            );

        const rightBottom =
            bay.slice(
                9,
                12
            );


        bayHTML.push(`

            <div class="coach-2s-bay">

                <div class="coach-2s-row">

                    <div class="coach-2s-seat-group">

                        ${leftTop
                            .map(
                                seatHTML
                            )
                            .join("")}

                    </div>


                    <div class="coach-2s-aisle">
                    </div>


                    <div class="coach-2s-seat-group">

                        ${rightTop
                            .map(
                                seatHTML
                            )
                            .join("")}

                    </div>

                </div>


                <div class="coach-2s-row">

                    <div class="coach-2s-seat-group">

                        ${leftBottom
                            .map(
                                seatHTML
                            )
                            .join("")}

                    </div>


                    <div class="coach-2s-aisle">
                    </div>


                    <div class="coach-2s-seat-group">

                        ${rightBottom
                            .map(
                                seatHTML
                            )
                            .join("")}

                    </div>

                </div>

            </div>

        `);

    }


    layoutHTML = `

        <div class="coach-layout-section coach-2s-layout">

            <div class="coach-layout-header">

                <div>

                    <span>
                        SEAT INFORMATION
                    </span>

                    <h3>
                        Second Sitting (2S)
                    </h3>

                </div>


                <div class="coach-layout-count">
                    106 SEATS
                </div>

            </div>


            <div class="coach-2s-map">

                <div class="coach-2s-label">

                    <strong>
                        Second Sitting Coach
                    </strong>

                    <span>
                        Non-AC
                    </span>

                    <span>
                        Type: LHB
                    </span>

                </div>


                ${frontHTML}


                <div class="coach-2s-bays">

                    ${bayHTML.join("")}

                </div>


                <div class="coach-2s-end">

                    <span>
                        COACH ENTRY / EXIT
                    </span>

                    <div class="coach-2s-end-seats">

                        ${
                            seats
                                .slice(
                                    101,
                                    106
                                )
                                .map(
                                    seatHTML
                                )
                                .join("")
                        }

                    </div>

                </div>

            </div>


            <div class="coach-2s-legend">

                <div>
                    <span class="legend-box window">
                    </span>
                    Window
                </div>

                <div>
                    <span class="legend-box middle">
                    </span>
                    Middle
                </div>

                <div>
                    <span class="legend-box aisle">
                    </span>
                    Aisle
                </div>

            </div>

        </div>

    `;

}


    /* =====================================================
       SEAT / BERTH LAYOUT
    ===================================================== */

    if (
        hasSeats === true &&
        blueprint &&
        Array.isArray(
            blueprint.cabins
        )
    ) {

        const cabins =
            blueprint.cabins;


        layoutHTML = `
            <div class="coach-layout-section">

                <div class="coach-layout-header">

                    <div>
                        <span>
                            SEAT / BERTH LAYOUT
                        </span>

                        <h3>
                            ${escapeHtml(
                                String(
                                    blueprint.className ||
                                    className
                                )
                            )}
                        </h3>
                    </div>

                    <div class="coach-layout-count">
                        ${
                            escapeHtml(
                                String(
                                    blueprint.totalBerths ??
                                    totalBerths
                                )
                            )
                        }
                        ${
                            blueprint.hasSeats
                                ? " seats/berths"
                                : " berths"
                        }
                    </div>

                </div>


                <div class="coach-cabins">

                    ${cabins
                        .map(
                            (
                                cabin
                            ) => {

                                const main =
                                    Array.isArray(
                                        cabin?.main
                                    )
                                        ? cabin.main
                                        : [];


                                const side =
                                    Array.isArray(
                                        cabin?.side
                                    )
                                        ? cabin.side
                                        : [];


                                return `
                                    <div
                                        class="coach-cabin"
                                    >

                                        <div
                                            class="coach-cabin-title"
                                        >
                                            Cabin
                                            ${escapeHtml(
                                                String(
                                                    cabin?.cabinNumber ??
                                                    "—"
                                                )
                                            )}
                                        </div>


                                        <div
                                            class="berth-area"
                                        >

                                            <div
                                                class="main-berths"
                                            >

                                                ${main
                                                    .map(
                                                        (
                                                            berth
                                                        ) => {

                                                            return `
                                                                <div
                                                                    class="berth-item"
                                                                    title="${escapeHtml(
                                                                        berth?.name ||
                                                                        ""
                                                                    )}"
                                                                >

                                                                    <span
                                                                        class="berth-number"
                                                                    >
                                                                        ${escapeHtml(
                                                                            String(
                                                                                berth?.number ??
                                                                                "—"
                                                                            )
                                                                        )}
                                                                    </span>

                                                                    <span
                                                                        class="berth-type"
                                                                    >
                                                                        ${escapeHtml(
                                                                            String(
                                                                                berth?.type ??
                                                                                "—"
                                                                            )
                                                                        )}
                                                                    </span>

                                                                </div>
                                                            `;

                                                        }
                                                    )
                                                    .join("")}

                                            </div>


                                            ${
                                                side.length
                                                    ? `
                                                        <div
                                                            class="side-berths"
                                                        >

                                                            ${side
                                                                .map(
                                                                    (
                                                                        berth
                                                                    ) => {

                                                                        return `
                                                                            <div
                                                                                class="berth-item side-berth"
                                                                                title="${escapeHtml(
                                                                                    berth?.name ||
                                                                                    ""
                                                                                )}"
                                                                            >

                                                                                <span
                                                                                    class="berth-number"
                                                                                >
                                                                                    ${escapeHtml(
                                                                                        String(
                                                                                            berth?.number ??
                                                                                            "—"
                                                                                        )
                                                                                    )}
                                                                                </span>

                                                                                <span
                                                                                    class="berth-type"
                                                                                >
                                                                                    ${escapeHtml(
                                                                                        String(
                                                                                            berth?.type ??
                                                                                            "—"
                                                                                        )
                                                                                    )}
                                                                                </span>

                                                                            </div>
                                                                        `;

                                                                    }
                                                                )
                                                                .join("")}

                                                        </div>
                                                    `
                                                    : ""
                                            }

                                        </div>

                                    </div>
                                `;

                            }
                        )
                        .join("")}

                </div>

            </div>
        `;

    }


    /* =====================================================
       COACH INFORMATION
    ===================================================== */

    coachDetails.innerHTML = `

        <div class="coach-detail-card">

            <div class="coach-detail-header">

                <div>

                    <span>
                        COACH
                    </span>

                    <strong>
                        ${escapeHtml(
                            String(code)
                        )}
                    </strong>

                </div>


                <div>

                    <span>
                        POSITION
                    </span>

                    <strong>
                        ${escapeHtml(
                            String(position)
                        )}
                    </strong>

                </div>

            </div>


            <div class="coach-detail-grid">

                <div>

                    <span>
                        CATEGORY
                    </span>

                    <strong>
                        ${escapeHtml(
                            String(category)
                        )}
                    </strong>

                </div>


                <div>

                    <span>
                        CLASS
                    </span>

                    <strong>
                        ${escapeHtml(
                            String(classType)
                        )}
                    </strong>

                </div>


                <div>

                    <span>
                        NAME
                    </span>

                    <strong>
                        ${escapeHtml(
                            String(className)
                        )}
                    </strong>

                </div>


                <div>

                    <span>
                        TOTAL BERTHS
                    </span>

                    <strong>
                        ${escapeHtml(
                            String(totalBerths)
                        )}
                    </strong>

                </div>


                <div>

                    <span>
                        SEATS
                    </span>

                    <strong>
                        ${
                            hasSeats === true
                                ? "Available"
                                : hasSeats === false
                                    ? "Not available"
                                    : "—"
                        }
                    </strong>

                </div>

            </div>


            ${layoutHTML}

        </div>

    `;


    coachDetails.classList.remove(
        "hidden"
    );

}


/* =========================================================
   HIDE COACH POSITION
========================================================= */

function hideCoachPosition() {

    if (!coachPositionSection) {
        return;
    }


    coachPositionSection.classList.add(
        "hidden"
    );


    if (coachFormation) {

        coachFormation.innerHTML =
            "";

    }


    if (coachDetails) {

        coachDetails.classList.add(
            "hidden"
        );

        coachDetails.innerHTML =
            "";

    }

}

/* =========================================================
   GET STOPS
========================================================= */

function getStops(data) {

    if (!data) {
        return [];
    }

    const candidates = [

        data?.stops,
        data?.route?.stops,
        data?.route?.stations,
        data?.route?.halts,
        data?.stations,

        data?.running?.stops,
        data?.running?.stations,
        data?.running?.halts,

        data?.dashboard?.route?.stops,
        data?.dashboard?.route?.stations,
        data?.dashboard?.route?.halts,

        data?.dashboard?.stops,
        data?.dashboard?.stations,

        data?.data?.route?.stops,
        data?.data?.route?.stations,
        data?.data?.stops,
        data?.data?.stations

    ];

    for (const value of candidates) {

        if (
            Array.isArray(value) &&
            value.length
        ) {

            return value;
        }
    }

    return [];
}


/* =========================================================
   RENDER DASHBOARD
========================================================= */

function renderDashboard(data) {

    const sourceData =
        data?.dashboard || data;

    const train =
        sourceData?.train ||
        data?.train ||
        {};

    const running =
        sourceData?.running ||
        data?.running ||
        data?.live ||
        {};

    const current =
        running?.currentStation ||
        running?.currentLocation ||
        sourceData?.currentStation ||
        data?.currentStation ||
        {};

    const previous =
        running?.previousStation ||
        sourceData?.previousStation ||
        data?.previousStation ||
        {};

    const next =
        running?.nextStation ||
        running?.nextHalt ||
        sourceData?.nextStation ||
        data?.nextStation ||
        {};

    const route =
        sourceData?.route ||
        data?.route ||
        {};

    const stops = getStops(data);


    /* =====================================================
       BASIC TRAIN INFORMATION
    ===================================================== */

    setText(
        "trainName",
        train.name ||
        train.trainName ||
        "Unknown Train"
    );

    setText(
        "displayTrainNumber",
        train.number ||
        train.trainNumber ||
        currentTrainNumber ||
        "—"
    );


    const source =
        getLocationName(
            train.source ||
            train.from
        );

    const destination =
        getLocationName(
            train.destination ||
            train.to
        );

    setText(
        "trainRoute",
        `${source} → ${destination}`
    );


    /* =====================================================
       STATUS
    ===================================================== */

    const status =
        normalizeStatus(
            running.status ||
            running.runningStatus ||
            data?.status
        );

    const statusBadge =
        $("statusBadge");

    if (statusBadge) {

        statusBadge.textContent =
            `● ${status}`;

        statusBadge.classList.remove("error");

        if (
            status === "CANCELLED" ||
            status === "UNKNOWN"
        ) {

            statusBadge.classList.add("error");
        }
    }


    /* =====================================================
       TOTAL JOURNEY DURATION
    ===================================================== */

    const totalJourneyDuration =
        getTotalJourneyDuration(
            data,
            train,
            route,
            stops
        );

    setText(
        "currentSpeed",
        totalJourneyDuration !== null
            ? formatDuration(
                totalJourneyDuration
            )
            : "—"
    );


    /* =====================================================
       MAX SPEED
    ===================================================== */

    setText(
        "maxSpeed",
        formatNumber(
            train?.maxSpeed ||
            train?.maximumSpeed ||
            data?.maxSpeed
        )
    );


    /* =====================================================
       CURRENT STATION
    ===================================================== */

    const currentName =
        getLocationName(current);

    setText(
        "currentStation",
        currentName
    );

    setText(
        "currentStationCode",
        getStationCode(current)
    );


    /* =====================================================
       NEXT STATION
    ===================================================== */

    const nextName =
        getLocationName(next);

    setText(
        "nextStation",
        nextName
    );

    setText(
        "nextStationCode",
        getStationCode(next)
    );


    /* =====================================================
       DELAY
    ===================================================== */

    const delay =
        running?.delayMinutes ??
        running?.delay ??
        current?.delayMinutes ??
        current?.delay ??
        data?.delayMinutes ??
        0;

    setText(
        "delay",
        formatDuration(delay)
    );


    /* =====================================================
       PROGRESS
    ===================================================== */

    let progress =
        Number(
            running?.progress ??
            running?.progressPercent ??
            data?.progress
        );

    if (!Number.isFinite(progress)) {

        progress =
            calculateProgress(
                current,
                stops
            );
    }

    if (Number.isFinite(progress)) {

        progress =
            clamp(
                progress,
                0,
                100
            );

        setText(
            "progress",
            progress.toFixed(1)
        );

        const progressBar =
            $("progressBar");

        if (progressBar) {

            progressBar.style.width =
                `${progress}%`;
        }

    } else {

        setText(
            "progress",
            "—"
        );

        const progressBar =
            $("progressBar");

        if (progressBar) {
            progressBar.style.width = "0%";
        }
    }


    /* =====================================================
       MAP / ETA
    ===================================================== */

    setText(
        "previousStation",
        getLocationName(previous)
    );

    setText(
        "mapCurrentStation",
        currentName
    );

    setText(
        "mapNextStation",
        nextName
    );

    setText(
        "destinationName",
        destination
    );


    const currentCode =
        getStationCode(current);

    const previousCode =
        getStationCode(previous);

    const nextCode =
        getStationCode(next);


    const currentStop =
        findStop(
            stops,
            current,
            currentCode
        );

    const previousStop =
        findStop(
            stops,
            previous,
            previousCode
        );

    const nextStop =
        findStop(
            stops,
            next,
            nextCode
        );


/* =====================================================
   NEXT ETA
===================================================== */

const nextArrival =
    next.expectedArrival ||
    next.eta ||
    next.scheduledArrival ||
    nextStop?.expectedArrival ||
    nextStop?.scheduledArrival ||
    null;


const nextDeparture =
    next.expectedDeparture ||
    next.scheduledDeparture ||
    nextStop?.expectedDeparture ||
    nextStop?.scheduledDeparture ||
    null;


const scheduledArrival =
    next.scheduledArrival ||
    nextStop?.scheduledArrival ||
    null;


const expectedArrival =
    next.expectedArrival ||
    next.eta ||
    nextStop?.expectedArrival ||
    nextArrival ||
    null;


/* -----------------------------------------------------
   NEXT STATION ETA
----------------------------------------------------- */

setText(
    "etaTime",
    formatDateTime(
        expectedArrival
    )
);


/* -----------------------------------------------------
   NEXT STATION
----------------------------------------------------- */

setText(
    "etaNext",
    next.name ||
    next.stationName ||
    next.code ||
    next.stationCode ||
    "—"
);


/* -----------------------------------------------------
   SCHEDULED ARRIVAL
----------------------------------------------------- */

setText(
    "scheduledArrival",
    formatDateTime(
        scheduledArrival
    )
);


/* -----------------------------------------------------
   EXPECTED ARRIVAL
----------------------------------------------------- */

setText(
    "expectedArrival",
    formatDateTime(
        expectedArrival
    )
);


/* -----------------------------------------------------
   STATION DEPARTURE
----------------------------------------------------- */

setText(
    "stationDeparture",
    formatDateTime(
        nextDeparture
    )
);


/* -----------------------------------------------------
   PLATFORM
----------------------------------------------------- */

setText(
    "platform",
    next.platform ||
    nextStop?.platform ||
    "—"
);


    /* =====================================================
       DISTANCE
    ===================================================== */

    const currentDistance =
        running?.currentDistance ??
        running?.distanceCovered ??
        current?.distanceCovered ??
        current?.distance ??
        null;

    const totalDistance =
        train?.distance ??
        train?.totalDistance ??
        route?.distance ??
        route?.totalDistance ??
        null;

    if (
        currentDistance != null &&
        totalDistance != null
    ) {

        setText(
            "distanceText",
            `${formatNumber(
                currentDistance
            )} / ${formatNumber(
                totalDistance
            )} km`
        );

    } else if (
        totalDistance != null
    ) {

        setText(
            "distanceText",
            `${formatNumber(
                totalDistance
            )} km total`
        );

    } else {

        setText(
            "distanceText",
            "Distance unavailable"
        );
    }


    /* =====================================================
       LAST UPDATED
    ===================================================== */

    setText(
        "lastUpdated",
        formatDateTime(
            running?.lastUpdatedAt ||
            running?.updatedAt ||
            data?.lastUpdatedAt ||
            data?.updatedAt ||
            new Date().toISOString()
        )
    );


    /* =====================================================
       STATION TIMING
    ===================================================== */

renderStationTiming(
    previous,
    previousStop,
    current,
    currentStop,
    next,
    nextStop
);

renderRoute(stops, current);

// Scroll route timeline to current station
setTimeout(() => {
    const currentStationElement =
        document.querySelector(".route-item.current");

    if (currentStationElement) {
        currentStationElement.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });
    }
}, 150);

renderLiveMap(data);
}
function scrollToCurrentStation(current, stops) {

    const currentCode =
        getStationCode(current);

    const currentStop =
        findStop(
            stops,
            current,
            currentCode
        );

    if (!currentStop) {
        return;
    }

    const sequence =
        currentStop.sequence ??
        currentStop.seq ??
        currentStop.stopSequence;

    if (sequence == null) {
        return;
    }

    const currentElement =
        document.querySelector(
            `[data-sequence="${sequence}"]`
        );

    if (!currentElement) {
        return;
    }

    currentElement.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });
}


/* =========================================================
   TOTAL JOURNEY DURATION
========================================================= */

function getTotalJourneyDuration(
    data,
    train,
    route,
    stops
) {

    const directValues = [

        train?.totalDuration,
        train?.journeyDuration,
        train?.durationMinutes,
        train?.total_duration,
        train?.journey_duration,

        route?.totalDuration,
        route?.journeyDuration,
        route?.durationMinutes,
        route?.total_duration,
        route?.journey_duration,

        data?.totalDuration,
        data?.journeyDuration,
        data?.durationMinutes,
        data?.total_duration,
        data?.journey_duration,

        data?.dashboard?.totalDuration,
        data?.dashboard?.journeyDuration,
        data?.dashboard?.durationMinutes

    ];

    for (const value of directValues) {

        const parsed =
            parseDurationValue(value);

        if (
            parsed !== null &&
            parsed >= 0
        ) {

            return parsed;
        }
    }


    if (
        !Array.isArray(stops) ||
        stops.length < 2
    ) {

        return null;
    }


    const orderedStops =
        [...stops].sort(
            (a, b) => {

                const aSeq =
                    Number(a?.sequence);

                const bSeq =
                    Number(b?.sequence);

                if (
                    Number.isFinite(aSeq) &&
                    Number.isFinite(bSeq)
                ) {

                    return aSeq - bSeq;
                }

                return 0;
            }
        );


    const firstStop =
        orderedStops[0];

    const lastStop =
        orderedStops[
            orderedStops.length - 1
        ];


    const start =
        getScheduledDeparture(
            firstStop,
            firstStop
        ) ||
        getScheduledArrival(
            firstStop,
            firstStop
        );


    const end =
        getScheduledArrival(
            lastStop,
            lastStop
        ) ||
        getScheduledDeparture(
            lastStop,
            lastStop
        );


    if (!start || !end) {
        return null;
    }


    const startMinutes =
        timeToMinutesWithMeridiem(
            start
        );

    const endMinutes =
        timeToMinutesWithMeridiem(
            end
        );


    if (
        startMinutes === null ||
        endMinutes === null
    ) {

        return null;
    }


    let duration =
        endMinutes -
        startMinutes;


    if (duration < 0) {
        duration += 1440;
    }


    return duration;
}


/* =========================================================
   PARSE DURATION VALUE
========================================================= */

function parseDurationValue(value) {

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {

        return null;
    }


    if (
        typeof value === "number"
    ) {

        return Number.isFinite(value)
            ? Math.round(value)
            : null;
    }


    if (
        typeof value === "object"
    ) {

        return parseDurationValue(
            value?.minutes ??
            value?.durationMinutes ??
            value?.totalMinutes ??
            value?.value
        );
    }


    const text =
        String(value)
            .trim()
            .toLowerCase();


    if (
        /^\d+(?:\.\d+)?$/.test(text)
    ) {

        return Math.round(
            Number(text)
        );
    }


    const hourMatch =
        text.match(
            /(\d+(?:\.\d+)?)\s*(?:hr|hrs|hour|hours|h)/
        );

    const minuteMatch =
        text.match(
            /(\d+(?:\.\d+)?)\s*(?:min|mins|minute|minutes|m)/
        );


    if (
        hourMatch ||
        minuteMatch
    ) {

        const hours =
            hourMatch
                ? Number(hourMatch[1])
                : 0;

        const minutes =
            minuteMatch
                ? Number(minuteMatch[1])
                : 0;

        return Math.round(
            hours * 60 +
            minutes
        );
    }


    return null;
}


/* =========================================================
   TIME TO MINUTES WITH AM / PM
========================================================= */

function timeToMinutesWithMeridiem(value) {

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {

        return null;
    }


    if (
        typeof value === "object"
    ) {

        value =
            value?.time ??
            value?.value ??
            value?.formatted ??
            value?.display ??
            value?.timestamp ??
            null;
    }


    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {

        return null;
    }


    const text =
        String(value).trim();


    const twelveHour =
        text.match(
            /^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)$/i
        );


    if (twelveHour) {

        let hour =
            Number(twelveHour[1]);

        const minute =
            Number(twelveHour[2]);

        const meridiem =
            twelveHour[3].toUpperCase();


        if (
            hour < 1 ||
            hour > 12 ||
            minute < 0 ||
            minute > 59
        ) {

            return null;
        }


        if (
            meridiem === "AM" &&
            hour === 12
        ) {

            hour = 0;
        }


        if (
            meridiem === "PM" &&
            hour !== 12
        ) {

            hour += 12;
        }


        return (
            hour * 60 +
            minute
        );
    }


    const twentyFour =
        text.match(
            /^(\d{1,2}):(\d{2})(?::\d{2})?$/
        );


    if (twentyFour) {

        const hour =
            Number(twentyFour[1]);

        const minute =
            Number(twentyFour[2]);


        if (
            hour >= 0 &&
            hour <= 23 &&
            minute >= 0 &&
            minute <= 59
        ) {

            return (
                hour * 60 +
                minute
            );
        }

        return null;
    }


    if (/^\d{4}$/.test(text)) {

        const hour =
            Number(text.slice(0, 2));

        const minute =
            Number(text.slice(2, 4));


        if (
            hour >= 0 &&
            hour <= 23 &&
            minute >= 0 &&
            minute <= 59
        ) {

            return (
                hour * 60 +
                minute
            );
        }
    }


    const date =
        new Date(value);


    if (
        !Number.isNaN(
            date.getTime()
        )
    ) {

        return (
            date.getHours() * 60 +
            date.getMinutes()
        );
    }


    return null;
}


/* =========================================================
   STATION TIMING
========================================================= */

function renderStationTiming(
    previous,
    previousStop,
    current,
    currentStop,
    next,
    nextStop
) {

    setText(
        "previousTimingStation",
        getLocationName(previous) !== "—"
            ? getLocationName(previous)
            : getStopName(previousStop)
    );

    setText(
        "previousTimingCode",
        getStationCode(previous) ||
        getStopCode(previousStop)
    );

    setText(
        "previousArrival",
        formatDateTime(
            getArrival(
                previous,
                previousStop
            )
        )
    );

    setText(
        "previousDeparture",
        formatDateTime(
            getDeparture(
                previous,
                previousStop
            )
        )
    );


    setText(
        "currentTimingStation",
        getLocationName(current) !== "—"
            ? getLocationName(current)
            : getStopName(currentStop)
    );

    setText(
        "currentTimingCode",
        getStationCode(current) ||
        getStopCode(currentStop)
    );

    setText(
        "currentArrival",
        formatDateTime(
            getArrival(
                current,
                currentStop
            )
        )
    );

    setText(
        "currentDeparture",
        formatDateTime(
            getDeparture(
                current,
                currentStop
            )
        )
    );


    setText(
        "nextTimingStation",
        getLocationName(next) !== "—"
            ? getLocationName(next)
            : getStopName(nextStop)
    );

    setText(
        "nextTimingCode",
        getStationCode(next) ||
        getStopCode(nextStop)
    );

    setText(
        "nextArrival",
        formatDateTime(
            getArrival(
                next,
                nextStop
            )
        )
    );

    setText(
        "nextDeparture",
        formatDateTime(
            getDeparture(
                next,
                nextStop
            )
        )
    );
}


/* =========================================================
   ARRIVAL
========================================================= */

function getArrival(station, stop) {

    return (

        station?.actualArrival ??
        station?.actual_arrival ??
        station?.expectedArrival ??
        station?.expected_arrival ??
        station?.estimatedArrival ??
        station?.estimated_arrival ??
        station?.scheduledArrival ??
        station?.scheduled_arrival ??
        station?.arrivalTime ??
        station?.arrival_time ??
        station?.arrival ??
        station?.eta ??
        station?.arrivalAt ??

        station?.timing?.actualArrival ??
        station?.timing?.expectedArrival ??
        station?.timing?.estimatedArrival ??
        station?.timing?.scheduledArrival ??
        station?.timing?.arrival ??

        station?.timings?.actualArrival ??
        station?.timings?.expectedArrival ??
        station?.timings?.estimatedArrival ??
        station?.timings?.scheduledArrival ??
        station?.timings?.arrival ??

        station?.schedule?.actualArrival ??
        station?.schedule?.expectedArrival ??
        station?.schedule?.estimatedArrival ??
        station?.schedule?.scheduledArrival ??
        station?.schedule?.arrival ??

        stop?.actualArrival ??
        stop?.actual_arrival ??
        stop?.expectedArrival ??
        stop?.expected_arrival ??
        stop?.estimatedArrival ??
        stop?.estimated_arrival ??
        stop?.scheduledArrival ??
        stop?.scheduled_arrival ??
        stop?.arrivalTime ??
        stop?.arrival_time ??
        stop?.arrival ??
        stop?.eta ??
        stop?.arrivalAt ??

        stop?.timing?.actualArrival ??
        stop?.timing?.expectedArrival ??
        stop?.timing?.estimatedArrival ??
        stop?.timing?.scheduledArrival ??
        stop?.timing?.arrival ??

        stop?.timings?.actualArrival ??
        stop?.timings?.expectedArrival ??
        stop?.timings?.estimatedArrival ??
        stop?.timings?.scheduledArrival ??
        stop?.timings?.arrival ??

        stop?.schedule?.actualArrival ??
        stop?.schedule?.expectedArrival ??
        stop?.schedule?.estimatedArrival ??
        stop?.schedule?.scheduledArrival ??
        stop?.schedule?.arrival ??

        null
    );
}


/* =========================================================
   DEPARTURE
========================================================= */

function getDeparture(station, stop) {

    return (

        station?.actualDeparture ??
        station?.actual_departure ??
        station?.expectedDeparture ??
        station?.expected_departure ??
        station?.estimatedDeparture ??
        station?.estimated_departure ??
        station?.scheduledDeparture ??
        station?.scheduled_departure ??
        station?.departureTime ??
        station?.departure_time ??
        station?.departure ??
        station?.departureAt ??

        station?.timing?.actualDeparture ??
        station?.timing?.expectedDeparture ??
        station?.timing?.estimatedDeparture ??
        station?.timing?.scheduledDeparture ??
        station?.timing?.departure ??

        station?.timings?.actualDeparture ??
        station?.timings?.expectedDeparture ??
        station?.timings?.estimatedDeparture ??
        station?.timings?.scheduledDeparture ??
        station?.timings?.departure ??

        station?.schedule?.actualDeparture ??
        station?.schedule?.expectedDeparture ??
        station?.schedule?.estimatedDeparture ??
        station?.schedule?.scheduledDeparture ??
        station?.schedule?.departure ??

        stop?.actualDeparture ??
        stop?.actual_departure ??
        stop?.expectedDeparture ??
        stop?.expected_departure ??
        stop?.estimatedDeparture ??
        stop?.estimated_departure ??
        stop?.scheduledDeparture ??
        stop?.scheduled_departure ??
        stop?.departureTime ??
        stop?.departure_time ??
        stop?.departure ??
        stop?.departureAt ??

        stop?.timing?.actualDeparture ??
        stop?.timing?.expectedDeparture ??
        stop?.timing?.estimatedDeparture ??
        stop?.timing?.scheduledDeparture ??
        stop?.timing?.departure ??

        stop?.timings?.actualDeparture ??
        stop?.timings?.expectedDeparture ??
        stop?.timings?.estimatedDeparture ??
        stop?.timings?.scheduledDeparture ??
        stop?.timings?.departure ??

        stop?.schedule?.actualDeparture ??
        stop?.schedule?.expectedDeparture ??
        stop?.schedule?.estimatedDeparture ??
        stop?.schedule?.scheduledDeparture ??
        stop?.schedule?.departure ??

        null
    );
}


/* =========================================================
   SCHEDULED ARRIVAL
========================================================= */

function getScheduledArrival(
    station,
    stop
) {

    return (

        station?.scheduledArrival ??
        station?.scheduled_arrival ??
        station?.schedule?.arrival ??
        station?.schedule?.scheduledArrival ??
        station?.schedule?.scheduled_arrival ??

        stop?.scheduledArrival ??
        stop?.scheduled_arrival ??
        stop?.schedule?.arrival ??
        stop?.schedule?.scheduledArrival ??
        stop?.schedule?.scheduled_arrival ??

        null
    );
}


/* =========================================================
   SCHEDULED DEPARTURE
========================================================= */

function getScheduledDeparture(
    station,
    stop
) {

    return (

        station?.scheduledDeparture ??
        station?.scheduled_departure ??
        station?.schedule?.departure ??
        station?.schedule?.scheduledDeparture ??
        station?.schedule?.scheduled_departure ??

        stop?.scheduledDeparture ??
        stop?.scheduled_departure ??
        stop?.schedule?.departure ??
        stop?.schedule?.scheduledDeparture ??
        stop?.schedule?.scheduled_departure ??

        null
    );
}


/* =========================================================
   EXPECTED ARRIVAL
========================================================= */

function getExpectedArrival(
    station,
    stop
) {

    return (

        station?.expectedArrival ??
        station?.expected_arrival ??
        station?.estimatedArrival ??
        station?.estimated_arrival ??
        station?.eta ??

        station?.schedule?.expectedArrival ??
        station?.schedule?.expected_arrival ??
        station?.schedule?.estimatedArrival ??

        stop?.expectedArrival ??
        stop?.expected_arrival ??
        stop?.estimatedArrival ??
        stop?.estimated_arrival ??
        stop?.eta ??

        stop?.schedule?.expectedArrival ??
        stop?.schedule?.expected_arrival ??
        stop?.schedule?.estimatedArrival ??

        null
    );
}


/* =========================================================
   EXPECTED DEPARTURE
========================================================= */

function getExpectedDeparture(
    station,
    stop
) {

    return (

        station?.expectedDeparture ??
        station?.expected_departure ??
        station?.estimatedDeparture ??
        station?.estimated_departure ??

        station?.schedule?.expectedDeparture ??
        station?.schedule?.expected_departure ??
        station?.schedule?.estimatedDeparture ??

        stop?.expectedDeparture ??
        stop?.expected_departure ??
        stop?.estimatedDeparture ??
        stop?.estimated_departure ??

        stop?.schedule?.expectedDeparture ??
        stop?.schedule?.expected_departure ??
        stop?.schedule?.estimatedDeparture ??

        null
    );
}


/* =========================================================
   ACTUAL ARRIVAL
========================================================= */

function getActualArrival(
    station,
    stop
) {

    return (

        station?.actualArrival ??
        station?.actual_arrival ??
        station?.timing?.actualArrival ??
        station?.timings?.actualArrival ??

        stop?.actualArrival ??
        stop?.actual_arrival ??
        stop?.timing?.actualArrival ??
        stop?.timings?.actualArrival ??

        null
    );
}


/* =========================================================
   ACTUAL DEPARTURE
========================================================= */

function getActualDeparture(
    station,
    stop
) {

    return (

        station?.actualDeparture ??
        station?.actual_departure ??
        station?.timing?.actualDeparture ??
        station?.timings?.actualDeparture ??

        stop?.actualDeparture ??
        stop?.actual_departure ??
        stop?.timing?.actualDeparture ??
        stop?.timings?.actualDeparture ??

        null
    );
}


/* =========================================================
   PLATFORM
========================================================= */

function getPlatform(
    station,
    stop
) {

    return (

        station?.platform ??
        station?.platformNumber ??
        station?.platform_number ??
        station?.platformNo ??

        stop?.platform ??
        stop?.platformNumber ??
        stop?.platform_number ??
        stop?.platformNo ??

        "—"
    );
}


/* =========================================================
   HALT
========================================================= */

function calculateHaltMinutes(
    arrival,
    departure
) {

    if (!arrival || !departure) {
        return null;
    }

    const arrivalMinutes =
        timeToMinutes(arrival);

    const departureMinutes =
        timeToMinutes(departure);

    if (
        arrivalMinutes === null ||
        departureMinutes === null
    ) {

        return null;
    }

    let difference =
        departureMinutes -
        arrivalMinutes;

    if (difference < 0) {
        difference += 1440;
    }

    return difference >= 0 &&
           difference <= 1440
        ? difference
        : null;
}


/* =========================================================
   TIME TO MINUTES
========================================================= */

function timeToMinutes(value) {

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {

        return null;
    }

    if (typeof value === "object") {

        value =
            value?.time ??
            value?.value ??
            value?.formatted ??
            value?.display ??
            value?.timestamp ??
            null;
    }

    if (!value) {
        return null;
    }

    const text =
        String(value).trim();


    const match =
        text.match(
            /^(\d{1,2}):(\d{2})/
        );

    if (match) {

        const hour =
            Number(match[1]);

        const minute =
            Number(match[2]);

        if (
            hour >= 0 &&
            hour <= 23 &&
            minute >= 0 &&
            minute <= 59
        ) {

            return (
                hour * 60 +
                minute
            );
        }
    }


    if (/^\d{4}$/.test(text)) {

        const hour =
            Number(text.substring(0, 2));

        const minute =
            Number(text.substring(2, 4));

        if (
            hour >= 0 &&
            hour <= 23 &&
            minute >= 0 &&
            minute <= 59
        ) {

            return (
                hour * 60 +
                minute
            );
        }
    }


    const date =
        new Date(value);

    if (!Number.isNaN(date.getTime())) {

        return (
            date.getHours() * 60 +
            date.getMinutes()
        );
    }

    return null;
}


/* =========================================================
   STOP DELAY
========================================================= */

function getStopDelay(stop) {

    if (!stop) {
        return null;
    }

    const values = [

        stop?.delayMinutes,
        stop?.delay_minutes,
        stop?.delay,
        stop?.arrivalDelay,
        stop?.arrival_delay,
        stop?.departureDelay,
        stop?.departure_delay,
        stop?.timing?.delayMinutes,
        stop?.timing?.delay

    ];

    for (const value of values) {

        if (
            value !== null &&
            value !== undefined &&
            value !== ""
        ) {

            const number =
                Number(value);

            if (Number.isFinite(number)) {
                return number;
            }
        }
    }

    return null;
}


/* =========================================================
   STOP NAME
========================================================= */

function getStopName(stop) {

    if (!stop) {
        return "—";
    }

    return (
        stop?.stationName ||
        stop?.name ||
        stop?.station?.name ||
        stop?.station?.stationName ||
        stop?.station?.station_name ||
        stop?.title ||
        "—"
    );
}


/* =========================================================
   STOP CODE
========================================================= */

function getStopCode(stop) {

    if (!stop) {
        return "";
    }

    return (
        stop?.stationCode ||
        stop?.station_code ||
        stop?.code ||
        stop?.station?.code ||
        stop?.station?.stationCode ||
        stop?.station?.station_code ||
        ""
    );
}


/* =========================================================
   FIND STOP
========================================================= */

function findStop(
    stops,
    station,
    code
) {

    if (
        !Array.isArray(stops) ||
        !stops.length
    ) {

        return null;
    }

    const targetCode =
        String(
            code ||
            getStationCode(station) ||
            ""
        )
            .trim()
            .toUpperCase();


    if (targetCode) {

        const found =
            stops.find(
                stop =>
                    getStopCode(stop)
                        .trim()
                        .toUpperCase() ===
                    targetCode
            );

        if (found) {
            return found;
        }
    }


    const targetName =
        String(
            getLocationName(station)
        )
            .trim()
            .toUpperCase();


    if (
        targetName &&
        targetName !== "—"
    ) {

        const found =
            stops.find(
                stop =>
                    getStopName(stop)
                        .trim()
                        .toUpperCase() ===
                    targetName
            );

        if (found) {
            return found;
        }
    }

    return null;
}


/* =========================================================
   RENDER ROUTE
========================================================= */

function renderRoute(stops, current) {

    const container = $("routeList");

    if (!container) {
        return;
    }

    /* =====================================================
       NO ROUTE DATA
    ===================================================== */

    if (!Array.isArray(stops) || !stops.length) {

        setText("stationCount", "0 stations");

        container.innerHTML = `
            <div style="
                padding:20px;
                color:#71809a;
                text-align:center;
            ">
                Route information is unavailable.
            </div>
        `;

        return;
    }


    /* =====================================================
       SORT STATIONS BY SEQUENCE
    ===================================================== */

    const orderedStops = [...stops].sort((a, b) => {

        const aSequence = Number(a?.sequence);
        const bSequence = Number(b?.sequence);

        if (
            Number.isFinite(aSequence) &&
            Number.isFinite(bSequence)
        ) {
            return aSequence - bSequence;
        }

        return 0;
    });


    /* =====================================================
       FIND CURRENT STATION
    ===================================================== */

    const currentSequence =
        Number(current?.sequence);

    const currentCode =
        getStationCode(current)
            .trim()
            .toUpperCase();

    const currentName =
        getLocationName(current)
            .trim()
            .toUpperCase();

    let currentIndex = -1;


    if (Number.isFinite(currentSequence)) {

        currentIndex =
            orderedStops.findIndex(
                stop =>
                    Number(stop?.sequence) ===
                    currentSequence
            );
    }


    if (currentIndex < 0 && currentCode) {

        currentIndex =
            orderedStops.findIndex(
                stop =>
                    getStopCode(stop)
                        .trim()
                        .toUpperCase() ===
                    currentCode
            );
    }


    if (
        currentIndex < 0 &&
        currentName &&
        currentName !== "—"
    ) {

        currentIndex =
            orderedStops.findIndex(
                stop =>
                    getStopName(stop)
                        .trim()
                        .toUpperCase() ===
                    currentName
            );
    }


    /* =====================================================
       DETECT REAL STOP / PASSING STATION

       RailRadar normally provides:

           isHalt: true
           isHalt: false

       true  = train stops
       false = train passes through

       We prefer explicit API metadata.
    ===================================================== */

    function getStopType(stop) {

        if (!stop) {
            return null;
        }


        if (
            typeof stop.isHalt === "boolean"
        ) {

            return stop.isHalt;
        }


        if (
            typeof stop.isStop === "boolean"
        ) {

            return stop.isStop;
        }


        if (
            typeof stop.halt === "boolean"
        ) {

            return stop.halt;
        }


        if (
            typeof stop.stop === "boolean"
        ) {

            return stop.stop;
        }


        const type =
            String(
                stop?.stopType ||
                stop?.stationType ||
                ""
            )
                .trim()
                .toLowerCase();


        if (
            type === "origin" ||
            type === "source" ||
            type === "destination" ||
            type === "terminal" ||
            type === "stop" ||
            type === "halt"
        ) {

            return true;
        }


        if (
            type === "passing" ||
            type === "pass"
        ) {

            return false;
        }


        return null;
    }


    const stopTypes =
        orderedStops.map(
            getStopType
        );


    /*
     * Check whether the API actually gave us
     * stop/pass information.
     */

    const hasExplicitStopMetadata =
        stopTypes.some(
            value => value !== null
        );


    /* =====================================================
       FALLBACK STOP DETECTION

       Only used if explicit halt metadata isn't available.
    ===================================================== */

    function isActualStop(stop, index) {

        const explicit =
            stopTypes[index];


        if (explicit !== null) {
            return explicit;
        }


        const arrival =
            getScheduledArrival(
                stop,
                stop
            );


        const departure =
            getScheduledDeparture(
                stop,
                stop
            );


        if (arrival && departure) {
            return true;
        }


        return null;
    }


    const stopFlags =
        orderedStops.map(
            (stop, index) =>
                isActualStop(
                    stop,
                    index
                )
        );


    const reliableStopFlags =
        stopFlags.some(
            value => value !== null
        );


    /* =====================================================
       STOPPING STATIONS

       Default UI will show ONLY these.
    ===================================================== */

    let stoppingStations;


    if (reliableStopFlags) {

        stoppingStations =
            orderedStops.filter(
                (stop, index) =>
                    stopFlags[index] === true
            );

    } else {

        /*
         * If API gives no reliable stop information,
         * don't guess. Show original route.
         */

        stoppingStations =
            orderedStops;
    }


    /*
     * Safety fallback.
     */

    if (!stoppingStations.length) {
        stoppingStations = orderedStops;
    }


    /* =====================================================
       TOGGLE STATE

       false = stopping stations only
       true  = all stations
    ===================================================== */

    let showAllStations = false;


    /* =====================================================
       RENDER ROUTE
    ===================================================== */

    function renderRouteList() {

        const stationsToRender =
            showAllStations
                ? orderedStops
                : stoppingStations;


        /* ================================================
           STATION COUNT
        ================================================ */

        setText(
            "stationCount",
            `${stationsToRender.length} station${
                stationsToRender.length === 1
                    ? ""
                    : "s"
            }`
        );


        /* ================================================
           BUILD STATION HTML
        ================================================ */

        container.innerHTML =
            stationsToRender
                .map(
                    (
                        stop,
                        displayIndex
                    ) => {

                        const originalIndex =
                            orderedStops.indexOf(
                                stop
                            );


                        const stopFlag =
                            stopFlags[
                                originalIndex
                            ];


                        const isPassing =
                            reliableStopFlags &&
                            stopFlag === false;


                        /* =================================
                           CURRENT / PASSED / UPCOMING
                        ================================= */

                        let status = "upcoming";


                        if (currentIndex >= 0) {

                            if (
                                originalIndex <
                                currentIndex
                            ) {

                                status = "passed";

                            } else if (
                                originalIndex ===
                                currentIndex
                            ) {

                                status = "current";
                            }
                        }


                        /* =================================
                           SCHEDULED TIME
                        ================================= */

                        const scheduledArrival =
                            getScheduledArrival(
                                stop,
                                stop
                            );


                        const scheduledDeparture =
                            getScheduledDeparture(
                                stop,
                                stop
                            );


                        /* =================================
                           EXPECTED TIME
                        ================================= */

                        const expectedArrival =
                            getExpectedArrival(
                                stop,
                                stop
                            );


                        const expectedDeparture =
                            getExpectedDeparture(
                                stop,
                                stop
                            );


                        /* =================================
                           ACTUAL TIME
                        ================================= */

                        const actualArrival =
                            getActualArrival(
                                stop,
                                stop
                            );


                        const actualDeparture =
                            getActualDeparture(
                                stop,
                                stop
                            );


                        /* =================================
                           HALT
                        ================================= */

                        const halt =
                            calculateHaltMinutes(
                                actualArrival ||
                                expectedArrival ||
                                scheduledArrival,

                                actualDeparture ||
                                expectedDeparture ||
                                scheduledDeparture
                            );


                        /* =================================
                           DELAY
                        ================================= */

                        const delay =
                            getStopDelay(stop);


                        /* =================================
                           PASSING STATION LABEL

                           IMPORTANT:
                           This is ONLY visible when
                           "View all stations" is clicked.
                        ================================= */

                        const passingIndicator =
                            showAllStations &&
                            isPassing
                                ? `
                                    <span
                                        class="route-station-type"
                                        style="
                                            display:inline-block;
                                            margin-top:4px;
                                            font-size:10px;
                                            color:#8a97a8;
                                        "
                                    >
                                        ○ Passing station
                                    </span>
                                `
                                : "";


                        /* =================================
                           CURRENT STATION BANNER
                        ================================= */

                        const currentBanner =
                            status === "current"
                                ? `
                                    <div class="
                                        current-train-banner
                                    ">
                                        🚆 TRAIN IS CURRENTLY
                                        AT THIS STATION
                                    </div>
                                `
                                : "";


                        /* =================================
                           STATION HTML
                        ================================= */

                        return `
                            <div class="
                                railway-station
                                ${status}
                                ${
                                    isPassing
                                        ? "passing-station"
                                        : ""
                                }
                            ">

                                <div class="
                                    timeline-column
                                ">

                                    <div class="
                                        timeline-dot
                                        ${status}
                                    ">

                                        ${
                                            status === "passed"
                                                ? "✓"
                                                : status === "current"
                                                    ? "🚆"
                                                    : "○"
                                        }

                                    </div>


                                    ${
                                        displayIndex <
                                        stationsToRender.length - 1
                                            ? `
                                                <div class="
                                                    timeline-line
                                                    ${
                                                        status === "passed"
                                                            ? "completed-line"
                                                            : ""
                                                    }
                                                "></div>
                                            `
                                            : ""
                                    }

                                </div>


                                <div class="
                                    station-content
                                ">


                                    <!-- STATION HEADER -->

                                    <div class="
                                        station-header
                                    ">

                                        <div>

                                            <div class="
                                                station-name
                                            ">
                                                ${escapeHtml(
                                                    getStopName(
                                                        stop
                                                    )
                                                )}
                                            </div>


                                            <div class="
                                                station-code
                                            ">
                                                ${escapeHtml(
                                                    getStopCode(
                                                        stop
                                                    ) || "—"
                                                )}
                                            </div>


                                            ${passingIndicator}

                                        </div>


                                        <div class="
                                            station-status
                                            ${status}
                                        ">

                                            ${
                                                status === "passed"
                                                    ? "PASSED"
                                                    : status === "current"
                                                        ? "CURRENT"
                                                        : "UPCOMING"
                                            }

                                        </div>

                                    </div>


                                    <!-- TIMING -->

                                    <div class="
                                        station-timing-grid
                                    ">


                                        <!-- SCHEDULED -->

                                        <div class="
                                            timing-box
                                        ">

                                            <div class="
                                                timing-title
                                            ">
                                                🕐 Scheduled
                                            </div>


                                            <div class="
                                                timing-row
                                            ">

                                                <span>
                                                    Arrival
                                                </span>

                                                <strong>
                                                    ${escapeHtml(
                                                        shortTime(
                                                            scheduledArrival
                                                        )
                                                    )}
                                                </strong>

                                            </div>


                                            <div class="
                                                timing-row
                                            ">

                                                <span>
                                                    Departure
                                                </span>

                                                <strong>
                                                    ${escapeHtml(
                                                        shortTime(
                                                            scheduledDeparture
                                                        )
                                                    )}
                                                </strong>

                                            </div>

                                        </div>



                                        <!-- EXPECTED -->

                                        <div class="
                                            timing-box
                                            expected-box
                                        ">

                                            <div class="
                                                timing-title
                                            ">
                                                🟠 Expected
                                            </div>


                                            <div class="
                                                timing-row
                                            ">

                                                <span>
                                                    Arrival
                                                </span>

                                                <strong>
                                                    ${escapeHtml(
                                                        shortTime(
                                                            expectedArrival
                                                        )
                                                    )}
                                                </strong>

                                            </div>


                                            <div class="
                                                timing-row
                                            ">

                                                <span>
                                                    Departure
                                                </span>

                                                <strong>
                                                    ${escapeHtml(
                                                        shortTime(
                                                            expectedDeparture
                                                        )
                                                    )}
                                                </strong>

                                            </div>

                                        </div>



                                        <!-- ACTUAL -->

                                        <div class="
                                            timing-box
                                            actual-box
                                        ">

                                            <div class="
                                                timing-title
                                            ">
                                                🟢 Actual
                                            </div>


                                            <div class="
                                                timing-row
                                            ">

                                                <span>
                                                    Arrival
                                                </span>

                                                <strong>
                                                    ${escapeHtml(
                                                        shortTime(
                                                            actualArrival
                                                        )
                                                    )}
                                                </strong>

                                            </div>


                                            <div class="
                                                timing-row
                                            ">

                                                <span>
                                                    Departure
                                                </span>

                                                <strong>
                                                    ${escapeHtml(
                                                        shortTime(
                                                            actualDeparture
                                                        )
                                                    )}
                                                </strong>

                                            </div>

                                        </div>

                                    </div>


                                    <!-- EXTRA INFORMATION -->

                                    <div class="
                                        station-extra
                                    ">


                                        <!-- PLATFORM -->

                                        <div class="
                                            extra-item
                                        ">

                                            <span>
                                                🚉 Platform
                                            </span>

                                            <strong>
                                                ${escapeHtml(
                                                    getPlatform(
                                                        stop,
                                                        stop
                                                    )
                                                )}
                                            </strong>

                                        </div>


                                        <!-- HALT -->

                                        <div class="
                                            extra-item
                                        ">

                                            <span>
                                                ⏱️ Halt
                                            </span>

                                            <strong>
                                                ${
                                                    halt !== null
                                                        ? formatDuration(
                                                            halt
                                                        )
                                                        : "—"
                                                }
                                            </strong>

                                        </div>


                                        <!-- DELAY -->

                                        <div class="
                                            extra-item
                                        ">

                                            <span>
                                                ${
                                                    delay !== null &&
                                                    delay > 0
                                                        ? "⚠️ Delay"
                                                        : "✓ Delay"
                                                }
                                            </span>


                                            <strong class="${
                                                delay !== null &&
                                                delay > 0
                                                    ? "delay-text"
                                                    : "on-time-text"
                                            }">

                                                ${
                                                    delay !== null
                                                        ? formatDuration(
                                                            delay
                                                        )
                                                        : "On time"
                                                }

                                            </strong>

                                        </div>


                                        <!-- DISTANCE -->

                                        <div class="
                                            extra-item
                                        ">

                                            <span>
                                                📍 Distance
                                            </span>


                                            <strong>
                                                ${
                                                    stop?.distance != null
                                                        ? `${formatNumber(
                                                            stop.distance
                                                        )} km`
                                                        : "—"
                                                }
                                            </strong>

                                        </div>

                                    </div>


                                    ${currentBanner}

                                </div>

                            </div>
                        `;
                    }
                )
                .join("");

                        /* =================================================
           AUTO SCROLL TO CURRENT STATION
        ================================================= */

       /* =================================================
   AUTO SCROLL INSIDE ROUTE ONLY
================================================= */

/* =================================================
   AUTO SCROLL TO CURRENT STATION
   ROUTE LIST ONLY
================================================= */

if (currentIndex >= 0) {

    requestAnimationFrame(() => {

        const currentElement =
            container.querySelector(
                ".railway-station.current"
            );

        if (!currentElement) {
            return;
        }

        const containerRect =
            container.getBoundingClientRect();

        const currentRect =
            currentElement.getBoundingClientRect();

        const targetScroll =
            container.scrollTop +
            (currentRect.top - containerRect.top) -
            (container.clientHeight / 2) +
            (currentElement.offsetHeight / 2);

        container.scrollTo({
            top: targetScroll,
            behavior: "smooth"
        });

    });

}

        /* =================================================
           VIEW ALL / HIDE ALL BUTTON
        ================================================= */

        let toggleWrapper =
            container.parentElement?.querySelector(
                ".route-toggle-wrapper"
            );


        /*
         * Button only appears when passing stations exist.
         */

        if (
            orderedStops.length >
            stoppingStations.length
        ) {

            if (!toggleWrapper) {

                toggleWrapper =
                    document.createElement(
                        "div"
                    );

                toggleWrapper.className =
                    "route-toggle-wrapper";

                toggleWrapper.style.cssText = `
                    display:flex;
                    justify-content:center;
                    margin-top:16px;
                `;


                container.parentElement.appendChild(
                    toggleWrapper
                );
            }


            toggleWrapper.innerHTML = `
                <button
                    type="button"
                    class="route-toggle-button"
                    style="
                        border:1px solid #d7e2ef;
                        background:#ffffff;
                        color:#1769e0;
                        border-radius:10px;
                        padding:10px 16px;
                        font-size:12px;
                        font-weight:800;
                        cursor:pointer;
                        transition:all .2s ease;
                    "
                >
                    ${
                        showAllStations
                            ? "Hide all stations"
                            : "View all stations"
                    }
                </button>
            `;


            const toggleButton =
                toggleWrapper.querySelector(
                    ".route-toggle-button"
                );


            toggleButton.addEventListener(
                "click",
                () => {

                    showAllStations =
                        !showAllStations;

                    renderRouteList();
                }
            );

        } else {

            if (toggleWrapper) {
                toggleWrapper.remove();
            }
        }
    }


    /* =====================================================
       INITIAL STATE

       IMPORTANT:
       By default passing stations are hidden.
    ===================================================== */

    renderRouteList();
}


/* =========================================================
   PROGRESS
========================================================= */

function calculateProgress(
    current,
    stops
) {

    if (
        !Array.isArray(stops) ||
        !stops.length
    ) {

        return null;
    }


    const currentSequence =
        Number(current?.sequence);


    if (!Number.isFinite(currentSequence)) {
        return null;
    }


    const firstSequence =
        Number(stops[0]?.sequence);

    const lastSequence =
        Number(
            stops[
                stops.length - 1
            ]?.sequence
        );


    if (
        !Number.isFinite(firstSequence) ||
        !Number.isFinite(lastSequence) ||
        lastSequence === firstSequence
    ) {

        return null;
    }


    return (
        (
            currentSequence -
            firstSequence
        ) /
        (
            lastSequence -
            firstSequence
        )
    ) * 100;
}


/* =========================================================
   MAP
========================================================= */

function initializeMap() {

    if (map) {
        return;
    }

    if (typeof window.L === "undefined") {

        console.error(
            "Leaflet is not loaded."
        );

        return;
    }


    const mapElement =
        $("map");

    if (!mapElement) {

        console.error(
            "Map element not found."
        );

        return;
    }


    map =
        L.map(
            mapElement,
            {
                zoomControl: true
            }
        );


    L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
            maxZoom: 19,

            attribution:
                "&copy; OpenStreetMap contributors"
        }
    ).addTo(map);


    map.setView(
        [22.5726, 88.3639],
        6
    );
}


/* =========================================================
   ROUTE GEOJSON
========================================================= */

function getRouteGeoJSON(
    route,
    data
) {

    if (!route && !data) {
        return null;
    }


    const candidates = [

        data?.routeGeometry,
        data?.routeGeometry?.geometry,

        data?.geojson,
        data?.geoJSON,

        route?.geojson,
        route?.geoJSON,
        route?.geometry,

        route?.geojson?.geometry,
        route?.geoJSON?.geometry,

        data?.live?.routeGeometry,
        data?.live?.geojson,

        data?.running?.routeGeometry,
        data?.running?.geojson,

        data?.dashboard?.routeGeometry,
        data?.dashboard?.geojson,

        data?.dashboard?.route?.geojson,
        data?.dashboard?.route?.geoJSON,
        data?.dashboard?.route?.geometry

    ];


    for (const candidate of candidates) {

        if (!candidate) {
            continue;
        }


        if (
            candidate.type ===
            "FeatureCollection"
        ) {

            return candidate;
        }


        if (
            candidate.type ===
            "Feature"
        ) {

            return candidate;
        }


        if (
            candidate.type &&
            candidate.coordinates
        ) {

            return {
                type: "Feature",
                properties: {},
                geometry: candidate
            };
        }


        if (
            candidate.geometry &&
            candidate.geometry.coordinates
        ) {

            return {
                type:
                    candidate.type ||
                    "Feature",

                properties:
                    candidate.properties ||
                    {},

                geometry:
                    candidate.geometry
            };
        }
    }


    return null;
}


/* =========================================================
   LIVE MAP
========================================================= */
/* =========================================================
   DRAW TRAVELLED ROUTE
   Uses the REAL GeoJSON railway path.
========================================================= */

function drawTravelledRoute(
    routeGeoJSON,
    trainPosition,
    stops,
    current
) {

    if (
        !map ||
        !routeGeoJSON ||
        !trainPosition
    ) {
        return;
    }


    const lines =
        getGeoJSONLineCoordinates(
            routeGeoJSON
        );


    if (
        !Array.isArray(lines) ||
        !lines.length
    ) {
        return;
    }


    const trainLat =
        Number(trainPosition[0]);

    const trainLng =
        Number(trainPosition[1]);


    if (
        !Number.isFinite(trainLat) ||
        !Number.isFinite(trainLng)
    ) {
        return;
    }


    /*
     * -----------------------------------------------------
     * Find the GeoJSON line which is closest to the train.
     * -----------------------------------------------------
     */

    let bestLine = null;
    let bestIndex = -1;
    let bestDistance = Infinity;


    lines.forEach(
        line => {

            if (
                !Array.isArray(line) ||
                line.length < 2
            ) {
                return;
            }


            line.forEach(
                (point, index) => {

                    if (
                        !Array.isArray(point) ||
                        point.length < 2
                    ) {
                        return;
                    }


                    const lng =
                        Number(point[0]);

                    const lat =
                        Number(point[1]);


                    if (
                        !Number.isFinite(lat) ||
                        !Number.isFinite(lng)
                    ) {
                        return;
                    }


                    const distance =
                        Math.pow(
                            lat - trainLat,
                            2
                        ) +
                        Math.pow(
                            lng - trainLng,
                            2
                        );


                    if (
                        distance <
                        bestDistance
                    ) {

                        bestDistance =
                            distance;

                        bestLine =
                            line;

                        bestIndex =
                            index;

                    }

                }
            );

        }
    );


    if (
        !bestLine ||
        bestIndex < 0
    ) {
        return;
    }


    /*
     * -----------------------------------------------------
     * Determine journey direction.
     *
     * Compare GeoJSON ends with first/last route stations.
     * This prevents green route from being drawn backwards.
     * -----------------------------------------------------
     */

    let firstStop = null;
    let lastStop = null;


    if (
        Array.isArray(stops) &&
        stops.length >= 2
    ) {

        const validStops =
            stops
                .map(getCoordinates)
                .filter(Boolean);


        if (
            validStops.length >= 2
        ) {

            firstStop =
                validStops[0];

            lastStop =
                validStops[
                    validStops.length - 1
                ];

        }

    }


    if (
        firstStop &&
        lastStop
    ) {

        const firstPoint =
            bestLine[0];

        const lastPoint =
            bestLine[
                bestLine.length - 1
            ];


        const firstDistance =
            Math.pow(
                Number(firstPoint[1]) -
                firstStop[0],
                2
            ) +
            Math.pow(
                Number(firstPoint[0]) -
                firstStop[1],
                2
            );


        const lastDistance =
            Math.pow(
                Number(lastPoint[1]) -
                firstStop[0],
                2
            ) +
            Math.pow(
                Number(lastPoint[0]) -
                firstStop[1],
                2
            );


        /*
         * If GeoJSON is backwards,
         * reverse it.
         */

        if (
            lastDistance <
            firstDistance
        ) {

            bestLine =
                [...bestLine].reverse();


            /*
             * Recalculate train index after reverse.
             */

            let closestIndex = 0;
            let closestDistance = Infinity;


            bestLine.forEach(
                (point, index) => {

                    const lng =
                        Number(point[0]);

                    const lat =
                        Number(point[1]);


                    const distance =
                        Math.pow(
                            lat - trainLat,
                            2
                        ) +
                        Math.pow(
                            lng - trainLng,
                            2
                        );


                    if (
                        distance <
                        closestDistance
                    ) {

                        closestDistance =
                            distance;

                        closestIndex =
                            index;

                    }

                }
            );


            bestIndex =
                closestIndex;

        }

    }


    /*
     * -----------------------------------------------------
     * Create green travelled section.
     *
     * IMPORTANT:
     * Do NOT connect stations directly.
     * We only use actual GeoJSON points.
     * -----------------------------------------------------
     */

    const travelledCoordinates =
        bestLine
            .slice(
                0,
                bestIndex + 1
            )
            .map(
                point => [
                    Number(point[1]),
                    Number(point[0])
                ]
            );


    /*
     * Add exact train position at the end.
     */

    travelledCoordinates.push(
        [
            trainLat,
            trainLng
        ]
    );


    if (
        travelledCoordinates.length < 2
    ) {
        return;
    }


    travelledRouteLayer =
        L.polyline(
            travelledCoordinates,
            {
                color: "#16a34a",
                weight: 6,
                opacity: 0.95,
                smoothFactor: 1,
                lineCap: "round",
                lineJoin: "round",
                interactive: false
            }
        ).addTo(map);


    /*
     * Green line above blue route,
     * but below train marker.
     */

    if (
        travelledRouteLayer.bringToFront
    ) {

        travelledRouteLayer.bringToFront();

    }


    console.log(
        "RailTrack: GREEN TRAVELLED ROUTE DRAWN"
    );

}
function getGeoJSONLineCoordinates(geoJSON) {

    if (!geoJSON) {
        return [];
    }

    const lines = [];

    function readGeometry(geometry) {

        if (!geometry) {
            return;
        }

        if (geometry.type === "LineString") {

            if (
                Array.isArray(geometry.coordinates) &&
                geometry.coordinates.length >= 2
            ) {
                lines.push(geometry.coordinates);
            }

        } else if (geometry.type === "MultiLineString") {

            if (Array.isArray(geometry.coordinates)) {

                geometry.coordinates.forEach(
                    coordinates => {

                        if (
                            Array.isArray(coordinates) &&
                            coordinates.length >= 2
                        ) {
                            lines.push(coordinates);
                        }

                    }
                );

            }
        }
    }

    if (geoJSON.type === "FeatureCollection") {

        if (Array.isArray(geoJSON.features)) {

            geoJSON.features.forEach(feature => {
                readGeometry(feature?.geometry);
            });

        }

    } else if (geoJSON.type === "Feature") {

        readGeometry(geoJSON.geometry);

    } else {

        readGeometry(geoJSON);
    }

    return lines;
}

function renderLiveMap(data) {

    initializeMap();

    if (!map) {
        return;
    }


    const sourceData =
        data?.dashboard || data;

    const route =
        sourceData?.route ||
        data?.route ||
        {};

    const running =
        sourceData?.running ||
        data?.running ||
        data?.live ||
        {};

    const current =
        running?.currentStation ||
        running?.currentLocation ||
        sourceData?.currentStation ||
        data?.currentStation ||
        {};

    const previous =
        running?.previousStation ||
        sourceData?.previousStation ||
        data?.previousStation ||
        {};

    const next =
        running?.nextStation ||
        running?.nextHalt ||
        sourceData?.nextStation ||
        data?.nextStation ||
        {};

    const stops =
        getStops(data);


    console.log(
        "RailTrack stops:",
        stops
    );


removeMapLayer(routeLayer);
removeMapLayer(travelledRouteLayer);
removeMapLayer(stationLayer);
removeMapLayer(trainMarker);

routeLayer = null;
travelledRouteLayer = null;
stationLayer = null;
trainMarker = null;


    const routeGeoJSON =
        getRouteGeoJSON(
            route,
            data
        );


    if (routeGeoJSON) {

        try {

            routeLayer =
                L.geoJSON(
                    routeGeoJSON,
                    {
                        style: {
                            color: "#2563eb",
                            weight: 5,
                            opacity: 0.90,
                            lineCap: "round",
                            lineJoin: "round"
                        }
                    }
                ).addTo(map);

            routeLayer.bringToBack();

        } catch (error) {

            console.error(
                "GeoJSON route error:",
                error
            );
        }
    }


    if (
        !routeLayer &&
        Array.isArray(stops) &&
        stops.length >= 2
    ) {

        const routeCoordinates =
            stops
                .map(getCoordinates)
                .filter(Array.isArray);


        if (
            routeCoordinates.length >= 2
        ) {

            routeLayer =
                L.polyline(
                    routeCoordinates,
                    {
                        color: "#2563eb",
                        weight: 5,
                        opacity: 0.90,
                        smoothFactor: 1,
                        lineCap: "round",
                        lineJoin: "round"
                    }
                ).addTo(map);

            routeLayer.bringToBack();
        }
    }


    stationLayer =
        L.layerGroup().addTo(map);


    const currentSequence =
        Number(current?.sequence);


    stops.forEach(stop => {

        const coordinates =
            getCoordinates(stop);

        if (!coordinates) {
            return;
        }


        const sequence =
            Number(stop?.sequence);


        const isCurrent =
            Number.isFinite(currentSequence) &&
            Number.isFinite(sequence) &&
            sequence === currentSequence;


        const isPassed =
            Number.isFinite(currentSequence) &&
            Number.isFinite(sequence) &&
            sequence < currentSequence;


        let markerColor = "#7b8ba5";
        let fillColor = "#ffffff";


        if (isCurrent) {

            markerColor = "#1769e0";
            fillColor = "#1769e0";

        } else if (isPassed) {

            markerColor = "#0ba968";
            fillColor = "#0ba968";
        }


        const marker =
            L.circleMarker(
                coordinates,
                {
                    radius:
                        isCurrent ? 8 : 5,

                    color:
                        markerColor,

                    fillColor:
                        fillColor,

                    fillOpacity: 1,

                    weight: 2
                }
            );


        marker.bindPopup(`
            <div style="
                min-width:180px;
                line-height:1.7;
            ">

                <strong>
                    ${escapeHtml(
                        getStopName(stop)
                    )}
                </strong>

                <br>

                ${escapeHtml(
                    getStopCode(stop)
                )}

                <br>

                ${
                    isCurrent
                        ? "🚆 Current train position"
                        : isPassed
                            ? "✓ Passed"
                            : "Upcoming"
                }

                <br>

                Arrival:
                ${escapeHtml(
                    formatDateTime(
                        getArrival(
                            stop,
                            stop
                        )
                    )
                )}

                <br>

                Departure:
                ${escapeHtml(
                    formatDateTime(
                        getDeparture(
                            stop,
                            stop
                        )
                    )
                )}

            </div>
        `);


        marker.addTo(stationLayer);
    });


/* =====================================================
   TRAIN POSITION
===================================================== */

const trainPosition =
    calculateTrainPosition(
        current,
        previous,
        next,
        stops,
        data
    );


/*
 * Draw travelled route using
 * the REAL GeoJSON railway path.
 */

if (
    trainPosition &&
    routeGeoJSON
) {

    drawTravelledRoute(
        routeGeoJSON,
        trainPosition,
        stops,
        current
    );

}


if (trainPosition) {

    createTrainMarker(
        trainPosition,
        data
    );


    map.setView(
        trainPosition,
        Math.max(
            map.getZoom(),
            9
        ),
        {
            animate: true
        }
    );

} else {

    fitMapToRoute(
        route,
        stops,
        routeGeoJSON
    );

}


    routeLayer?.bringToBack();


    /*
       FIX:
       Leaflet L.Marker does NOT have bringToFront().
       Use zIndexOffset instead.
    */

    if (
        trainMarker &&
        typeof trainMarker.setZIndexOffset ===
        "function"
    ) {

        trainMarker.setZIndexOffset(1000);
    }


    setTimeout(
        () => {

            map?.invalidateSize();

        },
        100
    );
}


/* =========================================================
   TRAIN MARKER
========================================================= */

function createTrainMarker(
    position,
    data
) {

    if (!map) {
        return;
    }


    const train =
        data?.train ||
        data?.dashboard?.train ||
        {};


    const running =
        data?.running ||
        data?.dashboard?.running ||
        data?.live ||
        {};


    const current =
        running?.currentStation ||
        running?.currentLocation ||
        data?.currentStation ||
        {};


    const delay =
        running?.delayMinutes ??
        running?.delay ??
        current?.delayMinutes ??
        current?.delay ??
        null;


    const markerHtml = `
        <div style="
            width:42px;
            height:42px;
            border-radius:50%;
            background:#1769e0;
            border:4px solid #fff;
            box-shadow:0 4px 18px rgba(0,0,0,.28);
            display:flex;
            align-items:center;
            justify-content:center;
            font-size:20px;
        ">
            🚆
        </div>
    `;


    const icon =
        L.divIcon({
            className:
                "railtrack-train-marker",

            html:
                markerHtml,

            iconSize:
                [42, 42],

            iconAnchor:
                [21, 21],

            popupAnchor:
                [0, -21]
        });


    trainMarker =
        L.marker(
            position,
            {
                icon,
                zIndexOffset: 1000
            }
        );


    trainMarker.bindPopup(`
        <div style="
            min-width:200px;
            line-height:1.7;
        ">

            <strong>
                ${escapeHtml(
                    train?.name ||
                    train?.trainName ||
                    "Train"
                )}
            </strong>

            <br>

            Train No:
            ${escapeHtml(
                train?.number ||
                train?.trainNumber ||
                currentTrainNumber
            )}

            <br>

            Current:
            ${escapeHtml(
                getLocationName(current)
            )}

            <br>

            Delay:
            ${
                delay != null
                    ? escapeHtml(
                        formatDuration(delay)
                    )
                    : "Unavailable"
            }

        </div>
    `);


    trainMarker.addTo(map);


    /*
       Keep train marker above station markers.
    */

    if (
        typeof trainMarker.setZIndexOffset ===
        "function"
    ) {

        trainMarker.setZIndexOffset(1000);
    }
}


/* =========================================================
   TRAIN POSITION
========================================================= */

function calculateTrainPosition(
    current,
    previous,
    next,
    stops,
    data
) {

    const backendPosition =
        getCoordinates(
            data?.mapPosition ||
            data?.running?.mapPosition ||
            data?.dashboard?.mapPosition
        );


    if (backendPosition) {
        return backendPosition;
    }


    const direct =
        getCoordinates(current);


    if (direct) {
        return direct;
    }


    const currentStop =
        findStop(
            stops,
            current,
            getStationCode(current)
        );


    const currentCoordinates =
        getCoordinates(currentStop);


    if (currentCoordinates) {
        return currentCoordinates;
    }


    const previousStop =
        findStop(
            stops,
            previous,
            getStationCode(previous)
        );


    const nextStop =
        findStop(
            stops,
            next,
            getStationCode(next)
        );


    const previousCoordinates =
        getCoordinates(previousStop);

    const nextCoordinates =
        getCoordinates(nextStop);


    if (
        !previousCoordinates ||
        !nextCoordinates
    ) {

        return null;
    }


    let progress =
        Number(
            current?.segmentProgress ??
            current?.segment_progress ??
            current?.progress ??
            current?.progressPercent
        );


    if (!Number.isFinite(progress)) {
        progress = 0;
    }


    if (
        progress > 1 &&
        progress <= 100
    ) {

        progress /= 100;
    }


    progress =
        clamp(
            progress,
            0,
            1
        );


    const latitude =
        previousCoordinates[0] +
        (
            nextCoordinates[0] -
            previousCoordinates[0]
        ) *
        progress;


    const longitude =
        previousCoordinates[1] +
        (
            nextCoordinates[1] -
            previousCoordinates[1]
        ) *
        progress;


    return [
        latitude,
        longitude
    ];
}


/* =========================================================
   COORDINATES
========================================================= */

function getCoordinates(object) {

    if (!object) {
        return null;
    }


    const lat =
        Number(object?.lat);

    const lng =
        Number(object?.lng);


    if (
        Number.isFinite(lat) &&
        Number.isFinite(lng) &&
        isValidCoordinates(lat, lng)
    ) {

        return [lat, lng];
    }


    const latitude =
        Number(object?.latitude);

    const longitude =
        Number(object?.longitude);


    if (
        Number.isFinite(latitude) &&
        Number.isFinite(longitude) &&
        isValidCoordinates(
            latitude,
            longitude
        )
    ) {

        return [
            latitude,
            longitude
        ];
    }


    if (object?.station) {

        const stationLat =
            Number(
                object.station?.lat ??
                object.station?.latitude
            );

        const stationLng =
            Number(
                object.station?.lng ??
                object.station?.longitude
            );


        if (
            Number.isFinite(stationLat) &&
            Number.isFinite(stationLng) &&
            isValidCoordinates(
                stationLat,
                stationLng
            )
        ) {

            return [
                stationLat,
                stationLng
            ];
        }
    }


    if (
        Array.isArray(object?.coordinates) &&
        object.coordinates.length >= 2
    ) {

        const longitude =
            Number(object.coordinates[0]);

        const latitude =
            Number(object.coordinates[1]);


        if (
            Number.isFinite(latitude) &&
            Number.isFinite(longitude) &&
            isValidCoordinates(
                latitude,
                longitude
            )
        ) {

            return [
                latitude,
                longitude
            ];
        }
    }


    if (
        object?.geometry &&
        Array.isArray(
            object.geometry.coordinates
        ) &&
        object.geometry.coordinates.length >= 2
    ) {

        const longitude =
            Number(
                object.geometry.coordinates[0]
            );

        const latitude =
            Number(
                object.geometry.coordinates[1]
            );


        if (
            Number.isFinite(latitude) &&
            Number.isFinite(longitude) &&
            isValidCoordinates(
                latitude,
                longitude
            )
        ) {

            return [
                latitude,
                longitude
            ];
        }
    }


    if (object?.location) {

        const nested =
            getCoordinates(
                object.location
            );

        if (nested) {
            return nested;
        }
    }


    return null;
}


/* =========================================================
   VALID COORDINATES
========================================================= */

function isValidCoordinates(
    latitude,
    longitude
) {

    return (
        latitude >= -90 &&
        latitude <= 90 &&
        longitude >= -180 &&
        longitude <= 180
    );
}


/* =========================================================
   FIT MAP
========================================================= */

function fitMapToRoute(
    route,
    stops,
    routeGeoJSON = null
) {

    if (!map) {
        return;
    }


    if (routeGeoJSON) {

        try {

            const layer =
                L.geoJSON(routeGeoJSON);

            const bounds =
                layer.getBounds();


            if (bounds.isValid()) {

                map.fitBounds(
                    bounds,
                    {
                        padding: [30, 30]
                    }
                );

                return;
            }

        } catch (error) {

            console.error(
                "GeoJSON bounds error:",
                error
            );
        }
    }


    if (route?.geojson) {

        try {

            const layer =
                L.geoJSON(
                    route.geojson
                );

            const bounds =
                layer.getBounds();


            if (bounds.isValid()) {

                map.fitBounds(
                    bounds,
                    {
                        padding: [30, 30]
                    }
                );

                return;
            }

        } catch (error) {

            console.error(
                "Route bounds error:",
                error
            );
        }
    }


    const points =
        stops
            .map(getCoordinates)
            .filter(Boolean);


    if (!points.length) {
        return;
    }


    const bounds =
        L.latLngBounds(points);


    if (bounds.isValid()) {

        map.fitBounds(
            bounds,
            {
                padding: [30, 30]
            }
        );
    }
}


/* =========================================================
   REMOVE MAP LAYER
========================================================= */

function removeMapLayer(layer) {

    if (
        layer &&
        map
    ) {

        try {

            map.removeLayer(layer);

        } catch (error) {

            console.warn(
                "Map layer removal:",
                error
            );
        }
    }
}

/* =========================================================
   SWAP STATIONS
========================================================= */

function setupStationSwap() {
    if (!swapStationsButton || !fromStationInput || !toStationInput) {
        return;
    }

    swapStationsButton.addEventListener("click", () => {

        // Start animation
        betweenSearchForm.classList.remove("swap-playing");

        // Force browser reflow so animation can replay every click
        void betweenSearchForm.offsetWidth;

        betweenSearchForm.classList.add("swap-playing");

        // Swap station values
        const temp = fromStationInput.value;

        fromStationInput.value = toStationInput.value;
        toStationInput.value = temp;

        // Remove animation class after animation finishes
        setTimeout(() => {
            betweenSearchForm.classList.remove("swap-playing");
        }, 450);
    });
}
/* =========================================================
   BETWEEN STATIONS
========================================================= */

function setupBetweenSearch() {

    if (!betweenSearchForm) {
        return;
    }


    betweenSearchForm.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            if (isLoading) {
                return;
            }


            hideError();


const from =
    getSelectedStationCode(
        fromStationInput
    );


const to =
    getSelectedStationCode(
        toStationInput
    );

            const date =
                betweenDateInput?.value ||
                "";
            
            


if (!from) {

    showError(
        "Please select a valid FROM station."
    );

    return;
}


if (!to) {

    showError(
        "Please select a valid destination station."
    );

    return;
}


            if (from === to) {

                showError(
                    "FROM and destination stations cannot be the same."
                );

                return;
            }


            buttonLoading(
                betweenSearchButton,
                true,
                "Search Trains"
            );


            isLoading = true;


            try {

                await searchBetweenStations(
                    from,
                    to,
                    date
                );

            } catch (error) {

                console.error(
                    "Between station search:",
                    error
                );

                showError(
                    error.message ||
                    "Unable to find trains."
                );

            } finally {

                buttonLoading(
                    betweenSearchButton,
                    false,
                    "Search Trains"
                );

                isLoading = false;
            }
        }
    );
}
/* =========================================================
   PNR SEARCH
========================================================= */

function setupPNRSearch() {

    if (!pnrSearchForm) {
        return;
    }


    pnrSearchForm.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();

            hideError();


            const pnr =
                String(
                    pnrNumberInput?.value || ""
                ).trim();


            /* =================================================
               VALIDATION
            ================================================= */

            if (!/^\d{10}$/.test(pnr)) {

                showError(
                    "Please enter a valid 10-digit PNR number."
                );

                if (pnrNumberInput) {
                    pnrNumberInput.focus();
                }

                return;
            }


            /* =================================================
               LOADING
            ================================================= */

            setPNRLoading(true);


            try {

                const response =
                    await fetch(
                        `${API_BASE}/pnr/${encodeURIComponent(pnr)}`,
                        {
                            method: "GET",
                            cache: "no-store",
                            headers: {
                                "Accept":
                                    "application/json"
                            }
                        }
                    );


                const result =
                    await getJson(response);


                if (!response.ok) {

                    throw new Error(
                        result?.error?.message ||
                        result?.message ||
                        `PNR request failed (${response.status})`
                    );

                }


                if (
                    !result ||
                    result.success !== true
                ) {

                    throw new Error(
                        result?.error?.message ||
                        "Unable to fetch PNR status."
                    );

                }


                renderPNRResult(
                    result.data
                );


            } catch (error) {

                console.error(
                    "PNR SEARCH ERROR:",
                    error
                );


                if (pnrResult) {

                    pnrResult.classList.add(
                        "hidden"
                    );

                    pnrResult.innerHTML = "";

                }


                showError(
                    error.message ||
                    "Unable to fetch PNR status."
                );


            } finally {

                setPNRLoading(false);

            }

        }
    );


    /* =====================================================
       ONLY NUMBERS
    ===================================================== */

    if (pnrNumberInput) {

        pnrNumberInput.addEventListener(
            "input",
            () => {

                pnrNumberInput.value =
                    pnrNumberInput.value
                        .replace(/\D/g, "")
                        .slice(0, 10);

            }
        );

    }

}
/* =========================================================
   PNR STATUS CLASS
========================================================= */

function getPNRStatusClass(status) {

    const value =
        String(status || "")
            .trim()
            .toUpperCase();

    if (
        value.includes("CONFIRMED") ||
        value.includes("CNF")
    ) {
        return "confirmed";
    }

    if (
        value.includes("RAC")
    ) {
        return "rac";
    }

    if (
        value.includes("WAIT") ||
        value.includes("WL")
    ) {
        return "waiting";
    }

    if (
        value.includes("CANCEL")
    ) {
        return "cancelled";
    }

    return "unknown";
}
/* =========================================================
   RENDER PNR RESULT
========================================================= */

function renderPNRResult(data) {

    if (!pnrResult) {
        return;
    }


    if (!data) {

        throw new Error(
            "PNR data is unavailable."
        );

    }


    const train =
        data.train || {};

    const journey =
        data.journey || {};

    const charting =
        data.charting || {};

    const passengers =
        Array.isArray(data.passengers)
            ? data.passengers
            : [];


    const source =
        train.source || {};

    const destination =
        train.destination || {};

    const boardingPoint =
        train.boardingPoint || {};

    const reservationUpto =
        train.reservationUpto || {};


    /* =====================================================
       PASSENGERS
    ===================================================== */

    const passengerHTML =
        passengers.length
            ? passengers.map(
                (passenger) => {

                    const bookingStatus =
                        passenger.bookingStatus ||
                        "—";

                    const currentStatus =
                        passenger.currentStatus ||
                        "—";

                    const coach =
                        passenger.coach ||
                        "—";

                    const berthNumber =
                        passenger.berthNumber ??
                        "—";

                    const berthCode =
                        passenger.berthCode ||
                        "—";


                    return `
                        <div class="pnr-passenger">

                            <div class="pnr-passenger-title">
                                Passenger ${escapeHtml(
                                    passenger.passengerNumber ??
                                    "—"
                                )}
                            </div>


                            <div class="pnr-passenger-grid">

                                <div>
                                    <span>
                                        BOOKING STATUS
                                    </span>

                                    <strong
    class="pnr-status-badge ${getPNRStatusClass(bookingStatus)}"
>
    ${escapeHtml(
        bookingStatus
    )}
</strong>
                                </div>


                                <div>
                                    <span>
                                        CURRENT STATUS
                                    </span>

                                    <strong
    class="pnr-status-badge ${getPNRStatusClass(currentStatus)}"
>
    ${escapeHtml(
        currentStatus
    )}
</strong>
                                </div>


                                <div>
                                    <span>
                                        COACH
                                    </span>

                                    <strong>
                                        ${escapeHtml(
                                            coach
                                        )}
                                    </strong>
                                </div>


                                <div>
                                    <span>
                                        BERTH
                                    </span>

                                    <strong>
                                        ${
                                            berthNumber !== "—"
                                                ? escapeHtml(
                                                    `${berthNumber} ${berthCode}`
                                                )
                                                : "—"
                                        }
                                    </strong>
                                </div>

                            </div>

                        </div>
                    `;

                }
            ).join("")
            : `
                <div class="pnr-empty">
                    Passenger information unavailable.
                </div>
            `;


    /* =====================================================
       FINAL RESULT
    ===================================================== */

    pnrResult.innerHTML = `

        <div class="pnr-result-header">

            <div>

                <span>
                    PNR NUMBER
                </span>

                <strong>
                    ${escapeHtml(
                        data.pnrNumber || "—"
                    )}
                </strong>

            </div>


            <div class="pnr-status-pill">

                ${charting.isPrepared
                    ? "CHART PREPARED"
                    : "CHART NOT PREPARED"
                }

            </div>

        </div>



        <!-- TRAIN -->

        <div class="pnr-result-card">

            <h3>
                🚆 Train Information
            </h3>


            <div class="pnr-info-grid">

                <div>
                    <span>
                        TRAIN
                    </span>

                    <strong>
                        ${escapeHtml(
                            train.number || "—"
                        )}
                    </strong>
                </div>


                <div>
                    <span>
                        TRAIN NAME
                    </span>

                    <strong>
                        ${escapeHtml(
                            train.name || "—"
                        )}
                    </strong>
                </div>


                <div>
                    <span>
                        FROM
                    </span>

                    <strong>
                        ${escapeHtml(
                            source.name ||
                            source.code ||
                            "—"
                        )}
                    </strong>
                </div>


                <div>
                    <span>
                        TO
                    </span>

                    <strong>
                        ${escapeHtml(
                            destination.name ||
                            destination.code ||
                            "—"
                        )}
                    </strong>
                </div>


                <div>
                    <span>
                        BOARDING
                    </span>

                    <strong>
                        ${escapeHtml(
                            boardingPoint.name ||
                            boardingPoint.code ||
                            "—"
                        )}
                    </strong>
                </div>


                <div>
                    <span>
                        RESERVATION UPTO
                    </span>

                    <strong>
                        ${escapeHtml(
                            reservationUpto.name ||
                            reservationUpto.code ||
                            "—"
                        )}
                    </strong>
                </div>

            </div>

        </div>



        <!-- JOURNEY -->

        <div class="pnr-result-card">

            <h3>
                📅 Journey Information
            </h3>


            <div class="pnr-info-grid">

                <div>
                    <span>
                        JOURNEY DATE
                    </span>

                    <strong>
                        ${escapeHtml(
                            journey.date || "—"
                        )}
                    </strong>
                </div>


                <div>
                    <span>
                        CLASS
                    </span>

                    <strong>
                        ${escapeHtml(
                            journey.class || "—"
                        )}
                    </strong>
                </div>


                <div>
                    <span>
                        QUOTA
                    </span>

                    <strong>
                        ${escapeHtml(
                            journey.quota || "—"
                        )}
                    </strong>
                </div>


                <div>
                    <span>
                        BOOKING FARE
                    </span>

                    <strong>
                        ${
                            journey.bookingFare
                                ? `₹${escapeHtml(
                                    journey.bookingFare
                                )}`
                                : "—"
                        }
                    </strong>
                </div>

            </div>

        </div>



        <!-- PASSENGERS -->

        <div class="pnr-result-card">

            <h3>
                👤 Passenger Status
            </h3>


            <div class="pnr-passengers">

                ${passengerHTML}

            </div>

        </div>



        <!-- CHART -->

        <div class="pnr-result-card">

            <h3>
                📋 Chart Status
            </h3>


            <div class="pnr-info-grid">

                <div>
                    <span>
                        STATUS
                    </span>

                    <strong>
                        ${escapeHtml(
                            charting.status || "—"
                        )}
                    </strong>
                </div>


                <div>
                    <span>
                        CHART PREPARED
                    </span>

                    <strong>
                        ${
                            charting.isPrepared
                                ? "Yes"
                                : "No"
                        }
                    </strong>
                </div>

            </div>

        </div>

    `;


    pnrResult.classList.remove(
        "hidden"
    );

}
/* =========================================================
   PNR BUTTON LOADING
========================================================= */

function setPNRLoading(isLoading) {

    if (!pnrSearchButton) {
        return;
    }

    pnrSearchButton.disabled =
        isLoading;

    pnrSearchButton.textContent =
        isLoading
            ? "Checking..."
            : "Check PNR Status";

}
/* =========================================================
   SEARCH BETWEEN STATIONS
========================================================= */

async function searchBetweenStations(
    from,
    to,
    date = ""
) {

    const params =
        new URLSearchParams();


    if (date) {
        params.set("date", date);
    }


    const query =
        params.toString();


    const url =
        `${API_BASE}/trains/between/${encodeURIComponent(
            from
        )}/${encodeURIComponent(
            to
        )}${
            query
                ? `?${query}`
                : ""
        }`;


    console.log(
        "Between stations:",
        url
    );


    const response =
        await fetch(
            url,
            {
                method: "GET",
                cache: "no-store",
                headers: {
                    Accept:
                        "application/json"
                }
            }
        );


    const data =
        await getJson(response);


    if (
        !response.ok ||
        data?.success === false
    ) {

        throw new Error(
            data?.error?.message ||
            data?.message ||
            "No trains found for this route."
        );
    }


    renderBetweenResults(data);
}


/* =========================================================
   BETWEEN RESULTS
========================================================= */

function renderBetweenResults(data) {

    if (
        !betweenResults ||
        !trainList
    ) {

        return;
    }


    betweenResults.classList.remove(
        "hidden"
    );


    const fromName =
        data?.from?.name ||
        data?.from?.stationName ||
        data?.from?.code ||
        "";


    const toName =
        data?.to?.name ||
        data?.to?.stationName ||
        data?.to?.code ||
        "";


    const trains =
        Array.isArray(data?.trains)
            ? data.trains
            : [];


    const count =
        Number(
            data?.count ??
            trains.length
        );


    setText(
        "betweenSubtitle",
        `${count} train${
            count === 1 ? "" : "s"
        } found between ${fromName} and ${toName}`
    );


    if (!trains.length) {

        trainList.innerHTML = `
            <div style="
                padding:30px;
                text-align:center;
                color:#71809a;
            ">
                No trains were returned by the live railway data source.
            </div>
        `;

        return;
    }


    trainList.innerHTML =
        trains
            .map(item => {

                const train =
                    item?.train || {};

                const fromInfo =
                    item?.from || {};

                const toInfo =
                    item?.to || {};

                const live =
                    item?.live || {};


                const trainNumber =
                    String(
                        train?.number ||
                        item?.trainNumber ||
                        ""
                    );


                const safeNumber =
                    cleanTrainNumber(
                        trainNumber
                    );


                return `
                    <div class="train-result">

                        <div>

                            <h3>
                                ${escapeHtml(
                                    train?.name ||
                                    item?.trainName ||
                                    "Unknown Train"
                                )}
                            </h3>

                            <p>
                                Train No.
                                <strong>
                                    ${escapeHtml(
                                        safeNumber ||
                                        trainNumber
                                    )}
                                </strong>
                            </p>

                            <div class="result-meta">

                                <span>
                                    🚉
                                    ${escapeHtml(
                                        fromInfo?.departure ||
                                        fromInfo?.name ||
                                        fromName ||
                                        "—"
                                    )}
                                    →
                                    ${escapeHtml(
                                        toInfo?.arrival ||
                                        toInfo?.name ||
                                        toName ||
                                        "—"
                                    )}
                                </span>

                                <span>
                                    📏
                                    ${
                                        item?.distance != null
                                            ? `${escapeHtml(
                                                item.distance
                                            )} km`
                                            : "—"
                                    }
                                </span>

                                <span>
                                    ⏱
                                    ${
                                        item?.duration != null
                                            ? formatDuration(
                                                item.duration
                                            )
                                            : "—"
                                    }
                                </span>

                                <span>
                                    🛑
                                    ${
                                        item?.totalHaltsBetween ??
                                        "—"
                                    }
                                    halts
                                </span>

                                ${
                                    live?.delayMinutes != null
                                        ? `
                                            <span>
                                                ⏰ Delay:
                                                ${escapeHtml(
                                                    formatDuration(
                                                        live.delayMinutes
                                                    )
                                                )}
                                            </span>
                                        `
                                        : ""
                                }

                            </div>

                        </div>


                        <button
                            type="button"
                            class="track-button"
                            data-train-number="${escapeHtml(
                                safeNumber ||
                                trainNumber
                            )}"
                        >
                            Track Train
                        </button>

                    </div>
                `;
            })
            .join("");


    trainList
        .querySelectorAll(
            ".track-button"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                async () => {

                    const number =
                        cleanTrainNumber(
                            button.dataset.trainNumber
                        );


                    if (
                        number.length !== 5
                    ) {

                        showError(
                            "Invalid train number returned by the railway API."
                        );

                        return;
                    }


                    trainTab?.click();


                    if (trainNumberInput) {

                        trainNumberInput.value =
                            number;
                    }


                    if (trainDateInput) {

                        trainDateInput.value =
                            betweenDateInput?.value ||
                            "";
                    }


                    window.scrollTo({
                        top: 0,
                        behavior: "smooth"
                    });


                    hideError();


                    try {

                        await loadTrain(
                            number,
                            betweenDateInput?.value ||
                            ""
                        );

                    } catch (error) {

                        console.error(
                            "Track selected train:",
                            error
                        );

                        showError(
                            error.message ||
                            "Unable to load selected train."
                        );
                    }
                }
            );
        });
}


/* =========================================================
   AUTO REFRESH
========================================================= */

function startAutoRefresh() {

    stopAutoRefresh();


    if (!currentTrainNumber) {
        return;
    }


    refreshTimer =
        setInterval(
            async () => {

                if (document.hidden) {
                    return;
                }

                await silentRefresh();

            },
            AUTO_REFRESH_TIME
        );
}


async function silentRefresh() {

    if (!currentTrainNumber) {
        return;
    }


    try {

        const params =
            new URLSearchParams();


        if (currentJourneyDate) {

            params.set(
                "date",
                currentJourneyDate
            );
        }


        const query =
            params.toString();


        const url =
            `${API_BASE}/trains/${encodeURIComponent(
                currentTrainNumber
            )}/dashboard${
                query
                    ? `?${query}`
                    : ""
            }`;


        const response =
            await fetch(
                url,
                {
                    method: "GET",
                    cache: "no-store",
                    headers: {
                        Accept:
                            "application/json"
                    }
                }
            );


        if (!response.ok) {

            console.warn(
                "Live update HTTP error:",
                response.status
            );

            return;
        }


        const data =
            await getJson(response);


        if (
            !data ||
            data.success === false
        ) {

            console.warn(
                "Live update returned invalid data."
            );

            return;
        }


        renderDashboard(data);
        /* =====================================================
   REFRESH COACH POSITION
===================================================== */

console.log(
    "🚆 Refreshing Coach Position..."
);

loadCoachPosition(
    currentTrainNumber,
    data
).catch(
    (error) => {

        console.warn(
            "Coach Position refresh failed:",
            error.message
        );

    }
);


        if (connectionStatus) {

            connectionStatus.textContent =
                "● Live Railway Data";

            connectionStatus.className =
                "connection connected";
        }

    } catch (error) {

        console.warn(
            "Automatic live update failed:",
            error.message
        );
    }
}


function stopAutoRefresh() {

    if (refreshTimer !== null) {

        clearInterval(
            refreshTimer
        );

        refreshTimer = null;
    }
}


/* =========================================================
   MANUAL REFRESH
========================================================= */

function setupRefreshButton() {

    const refreshButton =
        $("refreshButton");


    if (!refreshButton) {
        return;
    }


    refreshButton.addEventListener(
        "click",
        async () => {

            if (!currentTrainNumber) {

                showError(
                    "Please search a train first."
                );

                return;
            }


            if (refreshButton.disabled) {
                return;
            }


            refreshButton.disabled = true;


            const oldText =
                refreshButton.textContent;


            refreshButton.textContent =
                "Updating...";


            hideError();


            try {

                await silentRefresh();

            } catch (error) {

                console.error(
                    "Manual refresh error:",
                    error
                );

                showError(
                    "Unable to update train status."
                );

            } finally {

                refreshButton.disabled = false;

                refreshButton.textContent =
                    oldText ||
                    "↻ Refresh Now";
            }
        }
    );
}


/* =========================================================
   VISIBILITY
========================================================= */

document.addEventListener(
    "visibilitychange",
    async () => {

        if (
            !document.hidden &&
            currentTrainNumber
        ) {

            await silentRefresh();
        }
    }
);


/* =========================================================
   ONLINE
========================================================= */

window.addEventListener(
    "online",
    async () => {

        if (currentTrainNumber) {

            await silentRefresh();

            startAutoRefresh();
        }
    }
);


/* =========================================================
   OFFLINE
========================================================= */

window.addEventListener(
    "offline",
    () => {

        if (connectionStatus) {

            connectionStatus.textContent =
                "● Internet disconnected";

            connectionStatus.className =
                "connection disconnected";
        }
    }
);


/* =========================================================
   SET TEXT
========================================================= */

function setText(id, value) {

    const element =
        $(id);


    if (!element) {
        return;
    }


    element.textContent =
        value ??
        "—";
}


/* =========================================================
   LOCATION NAME
========================================================= */

function getLocationName(location) {

    if (!location) {
        return "—";
    }


    if (
        typeof location ===
        "string"
    ) {

        return location;
    }


    return (
        location?.name ||
        location?.stationName ||
        location?.station_name ||
        location?.station?.name ||
        location?.station?.stationName ||
        location?.code ||
        location?.stationCode ||
        "—"
    );
}


/* =========================================================
   STATION CODE
========================================================= */

function getStationCode(location) {

    if (!location) {
        return "";
    }


    if (
        typeof location ===
        "string"
    ) {

        return "";
    }


    return (
        location?.code ||
        location?.stationCode ||
        location?.station_code ||
        location?.station?.code ||
        location?.station?.stationCode ||
        location?.station?.station_code ||
        ""
    );
}


/* =========================================================
   NUMBER FORMAT
========================================================= */

function formatNumber(value) {

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {

        return "—";
    }


    const number =
        Number(value);


    if (!Number.isFinite(number)) {
        return "—";
    }


    return Number.isInteger(number)
        ? String(number)
        : number.toFixed(1);
}


/* =========================================================
   DURATION FORMAT
========================================================= */

function formatDuration(value) {

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {

        return "—";
    }


    let minutes =
        Number(value);


    if (!Number.isFinite(minutes)) {
        return "—";
    }


    minutes =
        Math.round(minutes);


    if (minutes < 0) {
        minutes = 0;
    }


    if (minutes < 60) {

        return `${minutes} min`;
    }


    const hours =
        Math.floor(
            minutes / 60
        );


    const remainingMinutes =
        minutes % 60;


    if (
        remainingMinutes === 0
    ) {

        return `${hours} hr`;
    }


    return `
        ${hours} hr ${remainingMinutes} min
    `.trim();
}


/* =========================================================
   DATE / TIME
========================================================= */

function formatDateTime(value) {

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {

        return "—";
    }


    if (
        typeof value ===
        "object"
    ) {

        value =
            value?.time ??
            value?.value ??
            value?.formatted ??
            value?.display ??
            value?.actual ??
            value?.expected ??
            value?.estimated ??
            value?.scheduled ??
            value?.timestamp ??
            null;
    }


    if (!value) {
        return "—";
    }


    const stringValue =
        String(value).trim();


    if (
        /^\d{1,2}:\d{2}$/.test(
            stringValue
        )
    ) {

        return stringValue;
    }


    if (
        /^\d{1,2}:\d{2}:\d{2}$/.test(
            stringValue
        )
    ) {

        return stringValue.slice(0, 5);
    }


    if (
        /^\d{4}$/.test(
            stringValue
        )
    ) {

        return (
            stringValue.slice(0, 2) +
            ":" +
            stringValue.slice(2, 4)
        );
    }


    const date =
        new Date(value);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return stringValue;
    }


    return date.toLocaleString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true
        }
    );
}


/* =========================================================
   SHORT TIME
========================================================= */

function shortTime(value) {

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {

        return "—";
    }


    if (
        typeof value ===
        "object"
    ) {

        value =
            value?.time ??
            value?.value ??
            value?.formatted ??
            value?.display ??
            value?.actual ??
            value?.expected ??
            value?.estimated ??
            value?.scheduled ??
            value?.timestamp ??
            null;
    }


    if (!value) {
        return "—";
    }


    const stringValue =
        String(value).trim();


    if (
        /^\d{1,2}:\d{2}$/.test(
            stringValue
        )
    ) {

        return stringValue;
    }


    if (
        /^\d{1,2}:\d{2}:\d{2}$/.test(
            stringValue
        )
    ) {

        return stringValue.slice(0, 5);
    }


    if (
        /^\d{4}$/.test(
            stringValue
        )
    ) {

        return (
            stringValue.slice(0, 2) +
            ":" +
            stringValue.slice(2, 4)
        );
    }


    const date =
        new Date(value);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return stringValue;
    }


    return date.toLocaleTimeString(
        "en-IN",
        {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true
        }
    );
}


/* =========================================================
   COMPATIBILITY
========================================================= */

function formatMinutes(value) {
    return formatDuration(value);
}


/* =========================================================
   CLAMP
========================================================= */

function clamp(
    value,
    min,
    max
) {

    return Math.min(
        max,
        Math.max(
            min,
            value
        )
    );
}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHtml(value) {

    return String(
        value ?? ""
    )
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );
}


/* =========================================================
   CLEANUP
========================================================= */

window.addEventListener(
    "beforeunload",
    () => {

        stopAutoRefresh();

    }
);
/* =========================================================
   GET SELECTED STATION CODE
   Used by Between Stations search
========================================================= */

function getSelectedStationCode(input) {

    if (!input) {
        return "";
    }

    const savedCode =
        String(
            input.dataset.stationCode || ""
        )
            .trim()
            .toUpperCase();

    if (savedCode) {
        return savedCode;
    }

    const value =
        String(
            input.value || ""
        )
            .trim()
            .toUpperCase();

    /*
     * Direct station code
     * Example: HWH / NDLS / BWN
     */

    if (/^[A-Z]{2,6}$/.test(value)) {
        return value;
    }

    /*
     * Station displayed as:
     * Howrah Junction (HWH)
     */

    const match =
        value.match(
            /\(([A-Z]{2,6})\)\s*$/
        );

    if (match) {
        return match[1];
    }

    return "";
}


/* =========================================================
   STATION AUTOCOMPLETE
   RailRadar Station Search
========================================================= */

/* =========================================================
   STATION AUTOCOMPLETE
   RailRadar Station Search
   Supports:
   - Between Stations
   - Seat Availability
========================================================= */

(function setupStationAutocomplete() {

    /* =====================================================
       INPUTS
    ===================================================== */

    const fromInput =
        document.getElementById(
            "fromStation"
        );

    const toInput =
        document.getElementById(
            "toStation"
        );

    const seatSourceInput =
        document.getElementById(
            "seatSource"
        );

    const seatDestinationInput =
        document.getElementById(
            "seatDestination"
        );


    const inputs = [
        fromInput,
        toInput,
        seatSourceInput,
        seatDestinationInput
    ].filter(Boolean);


    if (!inputs.length) {

        console.warn(
            "No station autocomplete inputs found."
        );

        return;
    }


    /* =====================================================
       CREATE DROPDOWN
    ===================================================== */

    function createDropdown(input) {

        if (!input) {
            return null;
        }


        /*
         * Prevent duplicate dropdown
         */

        if (
            input.parentElement &&
            input.parentElement.classList.contains(
                "station-autocomplete-wrapper"
            )
        ) {

            const wrapper =
                input.parentElement;


            const dropdown =
                wrapper.querySelector(
                    ".station-autocomplete-dropdown"
                );


            return {
                input,
                wrapper,
                dropdown
            };
        }


        const wrapper =
            document.createElement(
                "div"
            );


        wrapper.className =
            "station-autocomplete-wrapper";


        wrapper.style.cssText = `
            position:relative;
            width:100%;
        `;


        input.parentNode.insertBefore(
            wrapper,
            input
        );


        wrapper.appendChild(
            input
        );


        const dropdown =
            document.createElement(
                "div"
            );


        dropdown.className =
            "station-autocomplete-dropdown";


        dropdown.style.cssText = `
            position:fixed;
            background:#ffffff;
            border:1px solid #dbe4ef;
            border-radius:12px;
            box-shadow:0 12px 30px rgba(15,23,42,.15);
            display:none;
            z-index:99999;
            max-height:280px;
            overflow-y:auto;
            width:300px;
        `;


        document.body.appendChild(
            dropdown
        );


        return {
            input,
            wrapper,
            dropdown
        };

    }


    /* =====================================================
       CREATE ALL DROPDOWNS
    ===================================================== */

    const stationUI =
        inputs.map(
            input => createDropdown(input)
        );


    /* =====================================================
       ESCAPE
    ===================================================== */

    function safe(value) {

        if (
            typeof escapeHtml ===
            "function"
        ) {

            return escapeHtml(
                String(value ?? "")
            );

        }


        return String(
            value ?? ""
        )
            .replace(
                /&/g,
                "&amp;"
            )
            .replace(
                /</g,
                "&lt;"
            )
            .replace(
                />/g,
                "&gt;"
            )
            .replace(
                /"/g,
                "&quot;"
            )
            .replace(
                /'/g,
                "&#039;"
            );

    }


    /* =====================================================
       DEBOUNCE
    ===================================================== */

    function debounce(
        callback,
        delay = 300
    ) {

        let timer = null;


        return function (...args) {

            clearTimeout(
                timer
            );


            timer =
                setTimeout(
                    () => {

                        callback.apply(
                            this,
                            args
                        );

                    },
                    delay
                );

        };

    }


    /* =====================================================
       POSITION DROPDOWN
    ===================================================== */

    function positionDropdown(
        ui
    ) {

        if (
            !ui ||
            !ui.input ||
            !ui.dropdown
        ) {

            return;
        }


        const rect =
            ui.input.getBoundingClientRect();


        ui.dropdown.style.left =
            `${rect.left}px`;


        ui.dropdown.style.top =
            `${rect.bottom + 6}px`;


        ui.dropdown.style.width =
            `${rect.width}px`;

    }


    /* =====================================================
       HIDE DROPDOWN
    ===================================================== */

    function hideDropdown(
        ui
    ) {

        if (!ui) {
            return;
        }


        ui.dropdown.style.display =
            "none";

    }


    /* =====================================================
       SHOW LOADING
    ===================================================== */

    function showLoading(
        ui
    ) {

        if (!ui) {
            return;
        }


        positionDropdown(
            ui
        );


        ui.dropdown.innerHTML = `
            <div
                style="
                    padding:14px 16px;
                    color:#71809a;
                    font-size:13px;
                    font-weight:600;
                "
            >
                Searching stations...
            </div>
        `;


        ui.dropdown.style.display =
            "block";

    }


    /* =====================================================
       SHOW NO RESULTS
    ===================================================== */

    function showNoResults(
        ui
    ) {

        if (!ui) {
            return;
        }


        positionDropdown(
            ui
        );


        ui.dropdown.innerHTML = `
            <div
                style="
                    padding:16px;
                    color:#71809a;
                    font-size:13px;
                "
            >
                No station found
            </div>
        `;


        ui.dropdown.style.display =
            "block";

    }


    /* =====================================================
       SHOW ERROR
    ===================================================== */

    function showSearchError(
        ui,
        message
    ) {

        if (!ui) {
            return;
        }


        positionDropdown(
            ui
        );


        ui.dropdown.innerHTML = `
            <div
                style="
                    padding:16px;
                    color:#d14343;
                    font-size:13px;
                "
            >
                ${safe(
                    message ||
                    "Unable to search stations."
                )}
            </div>
        `;


        ui.dropdown.style.display =
            "block";

    }


    /* =====================================================
       SEARCH STATIONS
    ===================================================== */

    async function searchStations(
        query
    ) {

        const value =
            String(
                query || ""
            )
                .trim();


        if (
            value.length < 2
        ) {

            return [];

        }


        const url =
    `${API_BASE}/trains/lookup/search/stations?q=${encodeURIComponent(
        value
    )}&limit=8`;


        const response =
            await fetch(
                url,
                {
                    method: "GET",
                    cache: "no-store",
                    headers: {
                        "Accept":
                            "application/json"
                    }
                }
            );


        let result = null;


        try {

            result =
                await response.json();

        } catch {

            throw new Error(
                "Invalid station search response."
            );

        }


        if (
            !response.ok
        ) {

            throw new Error(
                result?.error?.message ||
                result?.message ||
                "Station search failed."
            );

        }


        /*
         * Backend:
         *
         * {
         *   success: true,
         *   data: [...]
         * }
         */

        const stations =
            Array.isArray(
                result?.data
            )
                ? result.data
                : [];


        return stations;

    }


    /* =====================================================
       NORMALIZE STATION
    ===================================================== */

    function normalizeStation(
        station
    ) {

        const code =
            String(
                station?.code ||
                station?.stationCode ||
                station?.stnCode ||
                ""
            )
                .trim()
                .toUpperCase();


        const name =
            String(
                station?.name ||
                station?.stationName ||
                station?.station ||
                ""
            )
                .trim();


        const city =
            String(
                station?.city ||
                station?.district ||
                ""
            )
                .trim();


        return {
            code,
            name,
            city
        };

    }


    /* =====================================================
       RENDER RESULTS
    ===================================================== */

    function renderResults(
        ui,
        stations
    ) {

        if (!ui) {
            return;
        }


        const normalized =
            stations
                .map(
                    normalizeStation
                )
                .filter(
                    station =>
                        station.code ||
                        station.name
                );


        if (
            !normalized.length
        ) {

            showNoResults(
                ui
            );

            return;

        }


        positionDropdown(
            ui
        );


        ui.dropdown.innerHTML =
            normalized
                .map(
                    station => {

                        const code =
                            station.code ||
                            "";


                        const name =
                            station.name ||
                            code;


                        const city =
                            station.city ||
                            "";


                        return `
                            <button
                                type="button"
                                class="station-autocomplete-item"
                                data-code="${safe(code)}"
                                data-name="${safe(name)}"
                                style="
                                    display:block;
                                    width:100%;
                                    padding:13px 15px;
                                    border:0;
                                    border-bottom:1px solid #edf1f6;
                                    background:#ffffff;
                                    text-align:left;
                                    cursor:pointer;
                                "
                            >

                                <div
                                    style="
                                        display:flex;
                                        align-items:center;
                                        justify-content:space-between;
                                        gap:12px;
                                    "
                                >

                                    <div
                                        style="
                                            min-width:0;
                                        "
                                    >

                                        <div
                                            style="
                                                font-size:13px;
                                                font-weight:800;
                                                color:#182338;
                                                white-space:nowrap;
                                                overflow:hidden;
                                                text-overflow:ellipsis;
                                            "
                                        >
                                            ${safe(name)}
                                        </div>


                                        ${
                                            city
                                                ? `
                                                    <div
                                                        style="
                                                            margin-top:3px;
                                                            font-size:11px;
                                                            color:#8a97a8;
                                                        "
                                                    >
                                                        ${safe(city)}
                                                    </div>
                                                `
                                                : ""
                                        }

                                    </div>


                                    <span
                                        style="
                                            flex-shrink:0;
                                            padding:4px 7px;
                                            border-radius:6px;
                                            background:#eef5ff;
                                            color:#1769e0;
                                            font-size:11px;
                                            font-weight:900;
                                        "
                                    >
                                        ${safe(code)}
                                    </span>

                                </div>

                            </button>
                        `;

                    }
                )
                .join("");


        ui.dropdown.style.display =
            "block";


        /* =================================================
           RESULT EVENTS
        ================================================== */

        ui.dropdown
            .querySelectorAll(
                ".station-autocomplete-item"
            )
            .forEach(
                item => {

                    item.addEventListener(
                        "mouseenter",
                        () => {

                            item.style.background =
                                "#f5f9ff";

                        }
                    );


                    item.addEventListener(
                        "mouseleave",
                        () => {

                            item.style.background =
                                "#ffffff";

                        }
                    );


                    item.addEventListener(
                        "click",
                        event => {

                            event.preventDefault();
                            event.stopPropagation();


                            const code =
                                String(
                                    item.dataset.code ||
                                    ""
                                )
                                    .trim()
                                    .toUpperCase();


                            const name =
                                String(
                                    item.dataset.name ||
                                    ""
                                )
                                    .trim();


                            /*
                             * Display station name
                             * and code.
                             *
                             * Example:
                             *
                             * Purulia Jn (PRR)
                             */

                            if (
                                name &&
                                code
                            ) {

                                ui.input.value =
                                    `${name} (${code})`;

                            } else if (
                                name
                            ) {

                                ui.input.value =
                                    name;

                            } else {

                                ui.input.value =
                                    code;

                            }


                            /*
                             * Save exact code.
                             */

                            ui.input.dataset.stationCode =
                                code;


                            ui.input.dataset.stationName =
                                name;


                            ui.input.dataset.stationSelected =
                                "true";


                            hideDropdown(
                                ui
                            );


                            console.log(
                                "Selected station:",
                                name,
                                code
                            );

                        }
                    );

                }
            );

    }


    /* =====================================================
       SETUP INPUT
    ===================================================== */

    function setupInput(
        ui
    ) {

        if (
            !ui ||
            !ui.input
        ) {

            return;
        }


        const performSearch =
            debounce(
                async () => {

                    const value =
                        ui.input.value.trim();


                    if (
                        value.length < 2
                    ) {

                        hideDropdown(
                            ui
                        );

                        return;

                    }


                    /*
                     * User changed input.
                     * Clear old station selection.
                     */

                    ui.input.dataset.stationCode =
                        "";

                    ui.input.dataset.stationName =
                        "";

                    ui.input.dataset.stationSelected =
                        "false";


                    showLoading(
                        ui
                    );


                    try {

                        const stations =
                            await searchStations(
                                value
                            );


                        /*
                         * Ignore stale response.
                         */

                        if (
                            ui.input.value.trim() !==
                            value
                        ) {

                            return;
                        }


                        renderResults(
                            ui,
                            stations
                        );

                    } catch (
                        error
                    ) {

                        console.error(
                            "Station autocomplete error:",
                            error
                        );


                        showSearchError(
                            ui,
                            error.message
                        );

                    }

                },
                300
            );


        /* =================================================
           INPUT
        ================================================= */

        ui.input.addEventListener(
            "input",
            () => {

                ui.input.dataset.stationCode =
                    "";

                ui.input.dataset.stationName =
                    "";

                ui.input.dataset.stationSelected =
                    "false";


                performSearch();

            }
        );


        /* =================================================
           FOCUS
        ================================================= */

        ui.input.addEventListener(
            "focus",
            () => {

                const value =
                    ui.input.value.trim();


                if (
                    value.length >= 2
                ) {

                    performSearch();

                }

            }
        );


        /* =================================================
           KEYBOARD
        ================================================= */

        ui.input.addEventListener(
            "keydown",
            event => {

                if (
                    event.key ===
                    "Escape"
                ) {

                    hideDropdown(
                        ui
                    );

                    return;
                }


                if (
                    event.key ===
                    "Enter" &&
                    ui.dropdown.style.display ===
                    "block"
                ) {

                    const firstItem =
                        ui.dropdown.querySelector(
                            ".station-autocomplete-item"
                        );


                    if (
                        firstItem &&
                        ui.input.dataset.stationSelected !==
                        "true"
                    ) {

                        event.preventDefault();


                        firstItem.click();

                    }

                }

            }
        );

    }


    /* =====================================================
       INITIALIZE ALL INPUTS
    ===================================================== */

    stationUI.forEach(
        setupInput
    );


    /* =====================================================
       CLICK OUTSIDE
    ===================================================== */

    document.addEventListener(
        "click",
        event => {

            stationUI.forEach(
                ui => {

                    if (
                        !ui
                    ) {

                        return;
                    }


                    if (
                        !ui.wrapper.contains(
                            event.target
                        ) &&
                        !ui.dropdown.contains(
                            event.target
                        )
                    ) {

                        hideDropdown(
                            ui
                        );

                    }

                }
            );

        }
    );


    /* =====================================================
       SCROLL
    ===================================================== */

    window.addEventListener(
        "scroll",
        () => {

            stationUI.forEach(
                ui => {

                    if (
                        ui &&
                        ui.dropdown.style.display ===
                        "block"
                    ) {

                        positionDropdown(
                            ui
                        );

                    }

                }
            );

        },
        true
    );


    /* =====================================================
       RESIZE
    ===================================================== */

    window.addEventListener(
        "resize",
        () => {

            stationUI.forEach(
                ui => {

                    if (
                        ui &&
                        ui.dropdown.style.display ===
                        "block"
                    ) {

                        positionDropdown(
                            ui
                        );

                    }

                }
            );

        }
    );


    console.log(
        "RailTrack station autocomplete ready for Train, Between Stations and Seat Availability."
    );

})();
/* =========================================================
   SEAT AVAILABILITY
========================================================= */

function setupSeatAvailability() {

    if (!seatAvailabilityForm) {
        return;
    }


    seatAvailabilityForm.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();

            hideError();


            const trainNumber =
                String(
                    seatTrainNumberInput?.value || ""
                ).trim();


           const source =
    getSelectedStationCode(
        seatSourceInput
    );


const destination =
    getSelectedStationCode(
        seatDestinationInput
    );


            const journeyDate =
                String(
                    seatJourneyDateInput?.value || ""
                ).trim();


            const classCode =
                String(
                    seatClassCodeInput?.value || ""
                ).trim()
                .toUpperCase();


            const quotaCode =
                String(
                    seatQuotaCodeInput?.value || "GN"
                ).trim()
                .toUpperCase();


            /* =================================================
               VALIDATION
            ================================================= */

            if (!/^\d{1,5}$/.test(trainNumber)) {

                showError(
                    "Please enter a valid train number."
                );

                seatTrainNumberInput?.focus();

                return;
            }


            if (!source) {

                showError(
                    "Please enter the source station code."
                );

                seatSourceInput?.focus();

                return;
            }


            if (!destination) {

                showError(
                    "Please enter the destination station code."
                );

                seatDestinationInput?.focus();

                return;
            }


            if (!journeyDate) {

                showError(
                    "Please select a journey date."
                );

                seatJourneyDateInput?.focus();

                return;
            }


            if (!classCode) {

                showError(
                    "Please select a travel class."
                );

                return;
            }


            /* =================================================
               LOADING
            ================================================= */

            setSeatAvailabilityLoading(true);


            try {

                const params =
                    new URLSearchParams({

                        source,

                        destination,

                        journeyDate,

                        classCode,

                        quotaCode

                    });


                const response =
                    await fetch(
                        `${API_BASE}/seats/${encodeURIComponent(
                            trainNumber
                        )}?${params.toString()}`,
                        {
                            method: "GET",
                            cache: "no-store",
                            headers: {
                                "Accept":
                                    "application/json"
                            }
                        }
                    );


                const result =
                    await getJson(response);


                if (!response.ok) {

                    throw new Error(
                        result?.error?.message ||
                        result?.message ||
                        `Seat availability request failed (${response.status})`
                    );

                }


                if (
                    !result ||
                    result.success !== true
                ) {

                    throw new Error(
                        result?.error?.message ||
                        "Unable to fetch seat availability."
                    );

                }


                /* =================================================
   SAVE SEAT DATA FOR AI ASSISTANT
================================================= */

aiSeatAvailabilityData = {

    ...(result.data || {}),

    source:
        source,

    destination:
        destination,

    journeyDate:
        journeyDate,

    classCode:
        classCode,

    quotaCode:
        quotaCode,

    trainNumber:
        trainNumber

};


/* =================================================
   RENDER NORMAL SEAT RESULT
================================================= */

renderSeatAvailability(
    result.data
);


            } catch (error) {

                console.error(
                    "SEAT AVAILABILITY ERROR:",
                    error
                );


                if (seatAvailabilityResult) {

                    seatAvailabilityResult.classList.add(
                        "hidden"
                    );

                    seatAvailabilityResult.innerHTML =
                        "";

                }


                showError(
                    error.message ||
                    "Unable to fetch seat availability."
                );


            } finally {

                setSeatAvailabilityLoading(
                    false
                );

            }

        }
    );


    /* =====================================================
       TRAIN NUMBER ONLY
    ===================================================== */

    if (seatTrainNumberInput) {

        seatTrainNumberInput.addEventListener(
            "input",
            () => {

                seatTrainNumberInput.value =
                    seatTrainNumberInput.value
                        .replace(/\D/g, "")
                        .slice(0, 5);

            }
        );

    }


    /* =====================================================
       STATION CODE
    ===================================================== */

    if (seatSourceInput) {

        seatSourceInput.addEventListener(
            "input",
            () => {

                seatSourceInput.value =
                    seatSourceInput.value
                        .replace(/[^a-zA-Z]/g, "")
                        .toUpperCase()
                        .slice(0, 10);

            }
        );

    }


    if (seatDestinationInput) {

        seatDestinationInput.addEventListener(
            "input",
            () => {

                seatDestinationInput.value =
                    seatDestinationInput.value
                        .replace(/[^a-zA-Z]/g, "")
                        .toUpperCase()
                        .slice(0, 10);

            }
        );

    }

}


/* =========================================================
   SEAT AVAILABILITY LOADING
========================================================= */

function setSeatAvailabilityLoading(
    loading
) {

    if (seatAvailabilityLoading) {

        seatAvailabilityLoading.classList.toggle(
            "hidden",
            !loading
        );

    }


    if (seatAvailabilityButton) {

        seatAvailabilityButton.disabled =
            loading;


        seatAvailabilityButton.textContent =
            loading
                ? "Checking..."
                : "Check Availability";

    }

}


/* =========================================================
   RENDER SEAT AVAILABILITY
========================================================= */

function renderSeatAvailability(
    responseData
) {

    if (!seatAvailabilityResult) {
        return;
    }


    /* =====================================================
       RAILRADAR RESPONSE

       Supports both:

       responseData.data
       OR
       responseData

       depending on how the API response is passed.
    ===================================================== */

    const data =
        responseData?.data ||
        responseData ||
        {};


    /* =====================================================
       TRAIN INFORMATION
    ===================================================== */

    const trainNumber =
        data?.trainNumber ||
        "—";


    const trainName =
        data?.trainName ||
        "Train";


    /* =====================================================
       SOURCE / DESTINATION
    ===================================================== */

    const source =
        data?.sourceStation ||
        data?.source ||
        seatSourceInput?.value ||
        "—";


    const destination =
        data?.destinationStation ||
        data?.destination ||
        seatDestinationInput?.value ||
        "—";


    /* =====================================================
       CLASS / QUOTA
    ===================================================== */

    const classCode =
        data?.classCode ||
        seatClassCodeInput?.value ||
        "—";


    const quotaCode =
        data?.quotaCode ||
        seatQuotaCodeInput?.value ||
        "GN";


    /* =====================================================
       OFFICIAL RAILRADAR AVAILABILITY LIST

       RailRadar:
       data.avlDayList[]
    ===================================================== */

   const availabilityList =
    Array.isArray(data?.calendar)
        ? data.calendar
        : [];


    console.log(
        "🚆 Seat Availability data:",
        data
    );

    console.log(
        "💺 Availability list:",
        availabilityList
    );


    /* =====================================================
       NO DATA
    ===================================================== */

    if (!availabilityList.length) {

        seatAvailabilityResult.innerHTML = `

            <div class="pnr-card">

                <h3>
                    No availability data found
                </h3>

                <p>
                    No seat availability information
                    is currently available for this journey.
                </p>

            </div>

        `;


        seatAvailabilityResult.classList.remove(
            "hidden"
        );


        return;
    }


    /* =====================================================
       CREATE AVAILABILITY ROWS
    ===================================================== */

    const rows =
        availabilityList
            .map(
                (item) => {

                    /* =====================================
                       DATE
                    ===================================== */

                    const rawDate =
                        item?.availablityDate ||
                        item?.availabilityDate ||
                        item?.date ||
                        "";


                    /* =====================================
                       STATUS
                    ===================================== */

                    const status =
                        String(
                            item?.availablityStatus ||
                            item?.availabilityStatus ||
                            item?.status ||
                            "NOT AVAILABLE"
                        ).trim();


                    const upperStatus =
                        status.toUpperCase();


                    /* =====================================
                       STATUS CLASS
                    ===================================== */

                    let statusClass =
                        "seat-status-unknown";


                    /* AVAILABLE */

                    if (
                        upperStatus.includes(
                            "AVAILABLE"
                        )
                    ) {

                        statusClass =
                            "seat-status-available";

                    }


                    /* RAC */

                    else if (
                        upperStatus.startsWith(
                            "RAC"
                        )
                    ) {

                        statusClass =
                            "seat-status-rac";

                    }


                    /* WAITING LIST */

                    else if (
                        upperStatus.includes(
                            "WL"
                        ) ||
                        upperStatus.includes(
                            "GNWL"
                        ) ||
                        upperStatus.includes(
                            "RLWL"
                        ) ||
                        upperStatus.includes(
                            "PQWL"
                        )
                    ) {

                        statusClass =
                            "seat-status-wl";

                    }


                    /* REGRET / NOT AVAILABLE */

                    else if (
                        upperStatus.includes(
                            "REGRET"
                        ) ||
                        upperStatus.includes(
                            "NOT AVAILABLE"
                        )
                    ) {

                        statusClass =
                            "seat-status-wl";

                    }


                    /* =====================================
                       FORMAT DATE
                    ===================================== */

                    const displayDate =
                        formatSeatDate(
                            rawDate
                        );


                    /* =====================================
                       RETURN ROW
                    ===================================== */

                    return `

                        <div
                            class="seat-availability-row"
                        >

                            <div
                                class="seat-date"
                            >

                                <strong>
                                    ${escapeHtml(
                                        displayDate
                                    )}
                                </strong>

                            </div>


                            <div
                                class="seat-status ${statusClass}"
                            >

                                ${escapeHtml(
                                    status
                                )}

                            </div>

                        </div>

                    `;

                }
            )
            .join("");


    /* =====================================================
       FINAL RESULT CARD
    ===================================================== */

    seatAvailabilityResult.innerHTML = `

        <div
            class="pnr-card seat-availability-card"
        >

            <!-- =========================================
                 HEADER
            ========================================== -->

            <div
                class="seat-result-header"
            >

                <div>

                    <span>
                        SEAT AVAILABILITY
                    </span>


                    <h3>

                        ${escapeHtml(
                            trainNumber
                        )}

                        —

                        ${escapeHtml(
                            trainName
                        )}

                    </h3>

                </div>


                <div
                    class="seat-result-meta"
                >

                    <strong>

                        ${escapeHtml(
                            source
                        )}

                        →

                        ${escapeHtml(
                            destination
                        )}

                    </strong>


                    <span>

                        ${escapeHtml(
                            classCode
                        )}

                        ·

                        ${escapeHtml(
                            quotaCode
                        )}

                    </span>

                </div>

            </div>


            <!-- =========================================
                 AVAILABILITY LIST
            ========================================== -->

            <div
                class="seat-availability-list"
            >

                ${rows}

            </div>

        </div>

    `;


    /* =====================================================
       SHOW RESULT
    ===================================================== */

    seatAvailabilityResult.classList.remove(
        "hidden"
    );


    /* =====================================================
       DEBUG
    ===================================================== */

    console.log(
        "✅ Seat availability rendered successfully."
    );

}


/* =========================================================
   FORMAT SEAT DATE
========================================================= */

function formatSeatDate(value) {

    if (!value) {
        return "—";
    }


    const parts =
        String(value).split("-");


    if (
        parts.length === 3
    ) {

        const year =
            parts[0];

        const month =
            parts[1];

        const day =
            parts[2];


        return `${day}-${month}-${year}`;

    }


    return String(value);

}
/* =========================================================
   RAILTRACK AI ASSISTANT
   FRONTEND CHAT
========================================================= */

function setupAIAssistant() {

    const assistantButton =
        document.getElementById("aiAssistantButton");

    const chatWindow =
        document.getElementById("aiChatWindow");

    const closeButton =
        document.getElementById("aiChatClose");

    const chatForm =
        document.getElementById("aiChatForm");

    const chatInput =
        document.getElementById("aiChatInput");

    const chatMessages =
        document.getElementById("aiChatMessages");

    const quickQuestions =
        document.querySelectorAll(
            ".ai-quick-question"
        );


    /* -----------------------------------------------------
       SAFETY CHECK
    ----------------------------------------------------- */

    if (
        !assistantButton ||
        !chatWindow ||
        !closeButton ||
        !chatForm ||
        !chatInput ||
        !chatMessages
    ) {

        console.warn(
            "RailTrack AI Assistant elements not found."
        );

        return;

    }


    /* -----------------------------------------------------
       OPEN AI CHAT
    ----------------------------------------------------- */

    assistantButton.addEventListener(
        "click",
        () => {

            chatWindow.classList.remove(
                "hidden"
            );

            setTimeout(
                () => {
                    chatInput.focus();
                },
                100
            );

        }
    );


    /* -----------------------------------------------------
       CLOSE AI CHAT
    ----------------------------------------------------- */

    closeButton.addEventListener(
        "click",
        () => {

            chatWindow.classList.add(
                "hidden"
            );

        }
    );


    /* -----------------------------------------------------
       ADD MESSAGE
    ----------------------------------------------------- */

    function addAIMessage(
        message,
        type = "bot"
    ) {

        const messageWrapper =
            document.createElement("div");


        messageWrapper.className =
            type === "user"
                ? "ai-message ai-message-user"
                : "ai-message ai-message-bot";


        const bubble =
            document.createElement("div");


        bubble.className =
            "ai-message-bubble";


       bubble.textContent =
    message;


        messageWrapper.appendChild(
            bubble
        );


        chatMessages.appendChild(
            messageWrapper
        );


        chatMessages.scrollTop =
            chatMessages.scrollHeight;

    }


    /* -----------------------------------------------------
       TYPING INDICATOR
    ----------------------------------------------------- */

    function showAITyping() {

        const typing =
            document.createElement("div");


        typing.id =
            "aiTypingIndicator";


        typing.className =
            "ai-message ai-message-bot";


        typing.innerHTML = `
            <div class="ai-message-bubble">
                <span>RailTrack AI is typing...</span>
            </div>
        `;


        chatMessages.appendChild(
            typing
        );


        chatMessages.scrollTop =
            chatMessages.scrollHeight;

    }


    /* -----------------------------------------------------
       REMOVE TYPING
    ----------------------------------------------------- */

    function hideAITyping() {

        const typing =
            document.getElementById(
                "aiTypingIndicator"
            );


        if (typing) {

            typing.remove();

        }

    }


    /* -----------------------------------------------------
       GET CURRENT TRAIN CONTEXT
    ----------------------------------------------------- */

    function getTrainContext() {

        return {

            trainNumber:
                currentTrainNumber || "",

            journeyDate:
                currentJourneyDate || "",

            page:
                window.location.pathname

        };

    }


/* =========================================================
   RAILTRACK AI
   SMART SHORT RESPONSE
========================================================= */

function getLocalAIResponse(question) {

    const text =
        String(question || "")
            .trim()
            .toLowerCase();


    /* =====================================================
       NO TRAIN SELECTED
    ===================================================== */

    if (!currentTrainNumber) {

        if (
            text.includes("feature") ||
            text.includes("help") ||
            text.includes("what can") ||
            text.includes("কি করতে") ||
            text.includes("কি কি")
        ) {

            return `
🤖 I can help you with:

📍 Live Train Location
⏱ Delay & ETA
🚉 Current / Next Station
🛤️ Train Route & Stops
🗺️ Live Map
🔎 Train & Station Search
🎫 PNR Status
🚆 Coach Position
💺 Seat Availability

Please search a train first for live train information.
            `.trim();

        }


        return `
🚆 Please search a train first.

Then I can show you:
📍 Live location
⏱ Delay & ETA
🚉 Next station
🛤️ Route
⚡ Speed
📊 Journey progress
        `.trim();

    }


    /* =====================================================
       READ DATA FROM CURRENT DASHBOARD
    ===================================================== */

    const trainName =
        document.getElementById(
            "trainName"
        )?.textContent?.trim() ||
        "Train";


    const trainNumber =
        document.getElementById(
            "displayTrainNumber"
        )?.textContent?.trim() ||
        currentTrainNumber;


    const trainRoute =
        document.getElementById(
            "trainRoute"
        )?.textContent?.trim() ||
        "—";


    const status =
        document.getElementById(
            "statusBadge"
        )?.textContent
            ?.replace(/^●\s*/, "")
            ?.trim() ||
        "—";


    const currentStation =
        document.getElementById(
            "currentStation"
        )?.textContent?.trim() ||
        "—";


    const currentStationCode =
        document.getElementById(
            "currentStationCode"
        )?.textContent?.trim() ||
        "";


    const nextStation =
        document.getElementById(
            "nextStation"
        )?.textContent?.trim() ||
        "—";


    const nextStationCode =
        document.getElementById(
            "nextStationCode"
        )?.textContent?.trim() ||
        "";


    const delay =
        document.getElementById(
            "delay"
        )?.textContent?.trim() ||
        "—";


    const speed =
        document.getElementById(
            "currentSpeed"
        )?.textContent?.trim() ||
        "—";


    const progress =
        document.getElementById(
            "progress"
        )?.textContent?.trim() ||
        "—";


    const distance =
        document.getElementById(
            "distanceText"
        )?.textContent?.trim() ||
        "—";


    /* =====================================================
       TRAIN SUMMARY
    ===================================================== */

    if (
        text.includes("about my train") ||
        text.includes("train details") ||
        text.includes("train information") ||
        text.includes("details") ||
        text.includes("tell me about") ||
        text.includes("আমার ট্রেন") ||
        text.includes("ট্রেন সম্পর্কে")
    ) {

        return `
🚆 ${trainName}
#${trainNumber}

🛤️ ${trainRoute}

📍 Current:
${currentStation}${
    currentStationCode &&
    currentStationCode !== "—"
        ? ` (${currentStationCode})`
        : ""
}

🚉 Next:
${nextStation}${
    nextStationCode &&
    nextStationCode !== "—"
        ? ` (${nextStationCode})`
        : ""
}

⏱ Delay: ${delay}
⚡ Speed: ${speed}
📊 Progress: ${progress}%
        `.trim();

    }


    /* =====================================================
       WHERE IS MY TRAIN?
    ===================================================== */

    if (
        text.includes("where") ||
        text.includes("location") ||
        text.includes("position") ||
        text.includes("কোথায়") ||
        text.includes("কোথায়") ||
        text.includes("লোকেশন")
    ) {

        return `
🚆 ${trainName} (${trainNumber})

📍 Current:
${currentStation}${
    currentStationCode &&
    currentStationCode !== "—"
        ? ` (${currentStationCode})`
        : ""
}

🚉 Next:
${nextStation}${
    nextStationCode &&
    nextStationCode !== "—"
        ? ` (${nextStationCode})`
        : ""
}

📊 Progress: ${progress}%
        `.trim();

    }


    /* =====================================================
       DELAY
    ===================================================== */

    if (
        text.includes("late") ||
        text.includes("delay") ||
        text.includes("delayed") ||
        text.includes("দেরি") ||
        text.includes("লেট")
    ) {

        return `
🚆 ${trainNumber}

⏱ Current Delay:
${delay}

📍 Current:
${currentStation}

🚉 Next:
${nextStation}

📊 Status:
${status}
        `.trim();

    }


    /* =====================================================
       NEXT STATION
    ===================================================== */

    if (
        text.includes("next station") ||
        text.includes("next stop") ||
        text.includes("পরের স্টেশন") ||
        text.includes("পরের স্টেশন কোন")
    ) {

        return `
🚉 Next Station

${nextStation}${
    nextStationCode &&
    nextStationCode !== "—"
        ? ` (${nextStationCode})`
        : ""
}

🚆 Train: ${trainNumber}
📍 Current: ${currentStation}
        `.trim();

    }


    /* =====================================================
       CURRENT STATION
    ===================================================== */

    if (
        text.includes("current station") ||
        text.includes("which station") ||
        text.includes("কোন স্টেশনে") ||
        text.includes("বর্তমান স্টেশন")
    ) {

        return `
📍 Current Station

${currentStation}${
    currentStationCode &&
    currentStationCode !== "—"
        ? ` (${currentStationCode})`
        : ""
}

🚆 Train: ${trainNumber}
⏱ Delay: ${delay}
        `.trim();

    }


    /* =====================================================
       SPEED
    ===================================================== */

    if (
        text.includes("speed") ||
        text.includes("how fast") ||
        text.includes("গতি") ||
        text.includes("কত দ্রুত")
    ) {

        return `
⚡ Train Speed

${speed}

🚆 Train: ${trainNumber}
📍 Current: ${currentStation}
        `.trim();

    }


    /* =====================================================
       ETA / ARRIVAL
    ===================================================== */

    if (
        text.includes("eta") ||
        text.includes("arrival") ||
        text.includes("arrive") ||
        text.includes("কখন পৌঁছাবে") ||
        text.includes("কখন পৌছাবে")
    ) {

        return `
🚆 Train ${trainNumber}

🚉 Next Station:
${nextStation}

⏱ Delay:
${delay}

📊 Current Status:
${status}

For exact arrival time, check the Station Timing section.
        `.trim();

    }


    /* =====================================================
       ROUTE
    ===================================================== */

    if (
        text.includes("route") ||
        text.includes("stations") ||
        text.includes("স্টেশন") ||
        text.includes("রুট")
    ) {

        return `
🛤️ Train Route

🚆 ${trainName}
#${trainNumber}

${trainRoute}

📍 Current:
${currentStation}

🚉 Next:
${nextStation}

You can view the complete station-by-station route below.
        `.trim();

    }


    /* =====================================================
       PROGRESS
    ===================================================== */

    if (
        text.includes("progress") ||
        text.includes("journey") ||
        text.includes("how far") ||
        text.includes("কতদূর") ||
        text.includes("জার্নি")
    ) {

        return `
📊 Journey Progress

🚆 Train: ${trainNumber}

📍 Current:
${currentStation}

🚉 Next:
${nextStation}

📊 Progress:
${progress}%

📏 Distance:
${distance}
        `.trim();

    }


    /* =====================================================
       FEATURES
    ===================================================== */

    if (
        text.includes("feature") ||
        text.includes("help") ||
        text.includes("what can you do") ||
        text.includes("কি করতে পারো") ||
        text.includes("কি কি আছে")
    ) {

        return `
🤖 RailTrack AI can help with:

📍 Live Train Location
⏱ Delay & ETA
🚉 Current / Next Station
🛤️ Route & Stops
🗺️ Live Map
⚡ Train Speed
📊 Journey Progress
🔎 Train / Station Search
🎫 PNR Status
🚆 Coach Position
💺 Seat Availability
        `.trim();

    }


    /* =====================================================
       GREETING
    ===================================================== */

    if (
        text === "hi" ||
        text === "hello" ||
        text === "hey" ||
        text === "হাই" ||
        text === "হ্যালো"
    ) {

        return `
👋 Hello!

🚆 Train: ${trainNumber}
📍 Current: ${currentStation}
🚉 Next: ${nextStation}
⏱ Delay: ${delay}

What would you like to know?
        `.trim();

    }


    /* =====================================================
       DEFAULT
    ===================================================== */

    return `
🤖 I can help with:

📍 Where is my train?
⏱ Is my train late?
🚉 What is the next station?
⚡ What is the speed?
🛤️ Show my route
📊 How far has my journey progressed?
🎫 PNR status
🚆 Coach position
💺 Seat availability

Ask me something about your journey.
    `.trim();

}


/* =========================================================
   RAILTRACK AI
   SMART FEATURE ASSISTANT
========================================================= */

async function handleAIQuestion(question) {

    const cleanQuestion =
        String(question || "").trim();


    if (!cleanQuestion) {
        return;
    }


    /* =====================================================
       USER MESSAGE
    ===================================================== */

    addAIMessage(
        cleanQuestion,
        "user"
    );


    showAITyping();


    try {

        const text =
            cleanQuestion.toLowerCase();
        // =================================================
// REMEMBER USER INTENT
// =================================================

if (
    text.includes("where") ||
    text.includes("location") ||
    text.includes("কোথায়") ||
    text.includes("কোথায়") ||
    text.includes("লোকেশন")
) {

    aiConversationContext.lastIntent =
        "live_location";

}

else if (
    text.includes("late") ||
    text.includes("delay") ||
    text.includes("delayed") ||
    text.includes("দেরি") ||
    text.includes("লেট")
) {

    aiConversationContext.lastIntent =
        "delay";

}

else if (
    text.includes("next station") ||
    text.includes("next stop") ||
    text.includes("পরের স্টেশন")
) {

    aiConversationContext.lastIntent =
        "next_station";

}

else if (
    text.includes("speed") ||
    text.includes("how fast") ||
    text.includes("গতি")
) {

    aiConversationContext.lastIntent =
        "speed";

}

else if (
    text.includes("progress") ||
    text.includes("how far") ||
    text.includes("কতদূর")
) {

    aiConversationContext.lastIntent =
        "progress";

}

else if (
    text.includes("route") ||
    text.includes("stations") ||
    text.includes("রুট")
) {

    aiConversationContext.lastIntent =
        "route";
}
        
// =================================================
// DIRECT TRAIN NUMBER DETECTION
// =================================================

const directTrainMatch =
    cleanQuestion.match(/^\d{5}$/);

if (directTrainMatch) {

    const trainNumber =
        directTrainMatch[0];

    console.log(
        "AI detected train number:",
        trainNumber
    );

    try {

        currentTrainNumber =
            trainNumber;

        aiConversationContext.trainNumber =
            trainNumber;

        const trainData =
            await loadTrain(
                trainNumber,
                currentJourneyDate || ""
            );

        aiTrainData =
            trainData || null;

        hideAITyping();

// =================================================
// ANSWER USING CURRENT DASHBOARD DATA
// =================================================

let aiIntent =
    aiConversationContext.lastIntent ||
    "live_location";

let aiAnswerQuestion =
    "Where is my train?";

if (
    aiIntent === "delay"
) {
    aiAnswerQuestion =
        "Is my train late?";
}

else if (
    aiIntent === "next_station"
) {
    aiAnswerQuestion =
        "What is the next station?";
}

else if (
    aiIntent === "speed"
) {
    aiAnswerQuestion =
        "What is the speed?";
}

else if (
    aiIntent === "progress"
) {
    aiAnswerQuestion =
        "How much journey is completed?";
}

else if (
    aiIntent === "route"
) {
    aiAnswerQuestion =
        "Show my route";
}


const answer =
    getLocalAIResponse(
        aiAnswerQuestion
    );

hideAITyping();

addAIMessage(
    answer,
    "bot"
);

return;

    } catch (error) {

        console.error(
            "AI train loading error:",
            error
        );

        hideAITyping();

        addAIMessage(
            `❌ I couldn't load train ${trainNumber}. ${error.message || "Please try again."}`,
            "bot"
        );

        return;
    }
}


        /* =================================================
           PNR STATUS
           
           Example:
           Check my PNR 1234567890
           PNR 1234567890
        ================================================= */

        const pnrMatch =
            cleanQuestion.match(
                /\b\d{10}\b/
            );


        if (
            pnrMatch &&
            (
                text.includes("pnr") ||
                text.includes("ticket") ||
                text.includes("reservation")
            )
        ) {

            const pnr =
                pnrMatch[0];


            console.log(
                "AI PNR request:",
                pnr
            );


            const response =
                await fetch(
                    `${API_BASE}/pnr/${encodeURIComponent(
                        pnr
                    )}`,
                    {
                        method: "GET",
                        cache: "no-store",
                        headers: {
                            "Accept":
                                "application/json"
                        }
                    }
                );


            const result =
                await getJson(
                    response
                );


            if (
                !response.ok ||
                result?.success === false
            ) {

                throw new Error(
                    result?.error?.message ||
                    result?.message ||
                    "Unable to fetch PNR status."
                );

            }


            hideAITyping();


            const data =
                result.data || result;


            const pnrStatus =
                data?.status ||
                data?.pnrStatus ||
                data?.chartStatus ||
                "—";


            const train =
                data?.trainNumber ||
                data?.train?.number ||
                "—";


            const trainName =
                data?.trainName ||
                data?.train?.name ||
                "—";


            addAIMessage(
                `
🎫 PNR Status

PNR: ${pnr}

🚆 Train:
${trainName} (${train})

📌 Status:
${pnrStatus}

Open the PNR Status section for complete passenger details.
                `.trim(),
                "bot"
            );


            return;

        }


/* =================================================
   SEAT AVAILABILITY
   SMART NATURAL LANGUAGE + SAVED CONTEXT
================================================= */

const seatTrainMatch =
    cleanQuestion.match(
        /\b\d{5}\b/
    );


const isSeatQuestion =
    text.includes("seat") ||
    text.includes("seats") ||
    text.includes("availability") ||
    text.includes("berth") ||
    text.includes("সিট") ||
    text.includes("সিটের") ||
    text.includes("আসন");


if (isSeatQuestion) {


    /* =================================================
       1. USE LAST NORMAL SEAT SEARCH RESULT
    ================================================= */

    if (aiSeatAvailabilityData) {

        const saved =
            aiSeatAvailabilityData;


        const savedTrain =
            String(
                saved?.trainNumber || ""
            );


        const askedTrain =
            seatTrainMatch
                ? seatTrainMatch[0]
                : "";


        /*
           If user mentioned another train,
           don't use the old result.
        */

        const sameTrain =
            !askedTrain ||
            !savedTrain ||
            askedTrain === savedTrain;


        if (sameTrain) {


            /* =============================================
               CALENDAR
            ============================================= */

            const savedCalendar =
                Array.isArray(
                    saved?.calendar
                )
                    ? saved.calendar
                    : [];


            if (savedCalendar.length > 0) {


                /* =========================================
                   CLASS DETECTION
                ========================================= */

                const supportedClasses = [

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


                let requestedClass =
                    null;


                for (
                    const availableClass
                    of supportedClasses
                ) {

                    const classRegex =
                        new RegExp(
                            `\\b${availableClass}\\b`,
                            "i"
                        );


                    if (
                        classRegex.test(
                            cleanQuestion
                        )
                    ) {

                        requestedClass =
                            availableClass;

                        break;

                    }

                }


                const finalClass =
                    requestedClass ||
                    saved?.classCode ||
                    "—";


                /* =========================================
                   DATE DETECTION
                ========================================= */

                let requestedDate =
                    saved?.journeyDate ||
                    currentJourneyDate ||
                    "";


                const now =
                    new Date();


                /* TODAY */

                if (
                    text.includes("today") ||
                    text.includes("আজ")
                ) {

                    requestedDate =
                        now
                            .toISOString()
                            .slice(
                                0,
                                10
                            );

                }


                /* TOMORROW */

                else if (
                    text.includes("tomorrow") ||
                    text.includes("কাল")
                ) {

                    const tomorrow =
                        new Date(
                            now
                        );


                    tomorrow.setDate(
                        now.getDate() + 1
                    );


                    requestedDate =
                        tomorrow
                            .toISOString()
                            .slice(
                                0,
                                10
                            );

                }


                /* DAY AFTER TOMORROW */

                else if (
                    text.includes(
                        "day after tomorrow"
                    ) ||
                    text.includes("পরশু")
                ) {

                    const dayAfterTomorrow =
                        new Date(
                            now
                        );


                    dayAfterTomorrow.setDate(
                        now.getDate() + 2
                    );


                    requestedDate =
                        dayAfterTomorrow
                            .toISOString()
                            .slice(
                                0,
                                10
                            );

                }


                /* =========================================
                   FIND REQUESTED DATE
                ========================================= */

                let availability =
                    savedCalendar.find(
                        item => {

                            const itemDate =
                                String(
                                    item?.date ||
                                    item?.rawDate ||
                                    ""
                                );


                            return itemDate.startsWith(
                                requestedDate
                            );

                        }
                    );


                /*
                   If exact date isn't found,
                   use first result.
                */

                if (!availability) {

                    availability =
                        savedCalendar[0];

                }


                /* =========================================
                   NO AVAILABILITY DATA
                ========================================= */

                if (!availability) {

                    hideAITyping();


                    addAIMessage(

                        `
💺 Seat Availability

🚆 Train:
${savedTrain || "—"}

📍 ${saved?.source || "—"} → ${saved?.destination || "—"}

🪑 Class:
${finalClass}

⚠️ No seat availability data is available right now.
                        `.trim(),

                        "bot"

                    );


                    return;

                }


                /* =========================================
                   STATUS
                ========================================= */

                const status =
                    String(
                        availability?.status ||
                        "UNKNOWN"
                    );


                const statusCode =
                    String(
                        availability?.statusCode ||
                        ""
                    ).toUpperCase();


                const availableSeats =
                    availability?.availableSeats;


                let availabilityText =
                    status;


                if (
                    statusCode === "AVAILABLE" &&
                    availableSeats !== undefined &&
                    availableSeats !== null
                ) {

                    availabilityText =
                        `AVAILABLE — ${availableSeats} seats`;

                }


                /* =========================================
                   FINAL ANSWER
                ========================================= */

                hideAITyping();


                addAIMessage(

                    `
💺 Seat Availability

🚆 Train:
${savedTrain || "—"}

📍 ${saved?.source || "—"} → ${saved?.destination || "—"}

🪑 Class:
${finalClass}

🎫 Quota:
${saved?.quotaCode || "GN"}

📅 Date:
${requestedDate || "—"}

${
    statusCode === "AVAILABLE"
        ? "✅"
        : "⚠️"
} ${availabilityText}

This information is from your latest Seat Availability search.
                    `.trim(),

                    "bot"

                );


                return;

            }

        }

    }


    /* =================================================
       2. NO SAVED RESULT
    ================================================= */

    if (!seatTrainMatch) {

        hideAITyping();


        addAIMessage(

            `
💺 Seat Availability

Please search Seat Availability first.

For example:

🚆 Train: 12828
📍 PRR → HWH
🪑 Class: 3A
📅 Tomorrow

Then simply ask me:

"12828 e kal 3A seat pawa jabe?"
            `.trim(),

            "bot"

        );


        return;

    }


    /* =================================================
       3. COMPLETE NEW NATURAL-LANGUAGE SEARCH
       
       Example:
       12828 check 3A seats from PRR to HWH tomorrow
    ================================================= */

    const seatTrain =
        seatTrainMatch[0];


    const supportedClasses = [

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


    let classCode =
        "2S";


    for (
        const availableClass
        of supportedClasses
    ) {

        const classRegex =
            new RegExp(
                `\\b${availableClass}\\b`,
                "i"
            );


        if (
            classRegex.test(
                cleanQuestion
            )
        ) {

            classCode =
                availableClass;

            break;

        }

    }


    /* =================================================
       STATION CODE DETECTION
    ================================================= */

    const stationMatches =
        cleanQuestion.match(
            /\b[A-Z]{2,5}\b/g
        ) || [];


    const ignoredWords =
        new Set([

            "SEAT",
            "SEATS",
            "AVAILABILITY",
            "AVAILABLE",
            "BERTH",
            "CHECK",
            "TRAIN",
            "FROM",
            "TO",
            "TOMORROW",
            "TODAY",
            "CLASS",
            "COACH",
            "POSITION",
            "BOOK",
            "BOOKING"

        ]);


    const stationCodes =
        stationMatches

            .map(
                code =>
                    code.toUpperCase()
            )

            .filter(
                code =>
                    !ignoredWords.has(
                        code
                    )
            )

            .filter(
                code =>
                    !supportedClasses.includes(
                        code
                    )
            )

            .filter(
                code =>
                    code !== seatTrain
            );


    const source =
        stationCodes[0] ||
        "";


    const destination =
        stationCodes[1] ||
        "";


    /* =================================================
       DATE DETECTION
    ================================================= */

    let journeyDate =
        currentJourneyDate ||
        "";


    const now =
        new Date();


    if (
        text.includes("today") ||
        text.includes("আজ")
    ) {

        journeyDate =
            now
                .toISOString()
                .slice(
                    0,
                    10
                );

    }


    else if (
        text.includes("tomorrow") ||
        text.includes("কাল")
    ) {

        const tomorrow =
            new Date(
                now
            );


        tomorrow.setDate(
            now.getDate() + 1
        );


        journeyDate =
            tomorrow
                .toISOString()
                .slice(
                    0,
                    10
                );

    }


    else if (
        text.includes(
            "day after tomorrow"
        ) ||
        text.includes("পরশু")
    ) {

        const dayAfterTomorrow =
            new Date(
                now
            );


        dayAfterTomorrow.setDate(
            now.getDate() + 2
        );


        journeyDate =
            dayAfterTomorrow
                .toISOString()
                .slice(
                    0,
                    10
                );

    }


    /* =================================================
       VALIDATION
    ================================================= */

    if (
        !source ||
        !destination
    ) {

        hideAITyping();


        addAIMessage(

            `
💺 I need the source and destination station codes to make a new Seat Availability search.

Example:

12828 check 3A seats from PRR to HWH tomorrow

Or search Seat Availability normally first, then ask me about the result.
            `.trim(),

            "bot"

        );


        return;

    }


    if (!journeyDate) {

        hideAITyping();


        addAIMessage(

            `
💺 Please provide a journey date.

Example:

12828 check 3A seats from PRR to HWH tomorrow
            `.trim(),

            "bot"

        );


        return;

    }


    /* =================================================
       API REQUEST
    ================================================= */

    const params =
        new URLSearchParams({

            source,

            destination,

            journeyDate,

            classCode,

            quotaCode:
                "GN"

        });


    const seatURL =
        `${API_BASE}/seats/` +
        `${encodeURIComponent(
            seatTrain
        )}?${params.toString()}`;


    console.log(
        "AI Seat URL:",
        seatURL
    );


    const response =
        await fetch(

            seatURL,

            {
                method: "GET",

                cache: "no-store",

                headers: {

                    "Accept":
                        "application/json"

                }

            }

        );


    const result =
        await getJson(
            response
        );


    if (!response.ok) {

        throw new Error(

            result?.error?.message ||
            result?.message ||
            `Seat availability request failed (${response.status})`

        );

    }


    if (
        !result ||
        result.success !== true
    ) {

        throw new Error(

            result?.error?.message ||
            result?.message ||
            "Seat availability data unavailable."

        );

    }


    /* =================================================
       SAVE NEW AI SEAT RESULT
    ================================================= */

    const data =
        result?.data?.data ||
        result?.data ||
        {};


    const calendar =
        Array.isArray(
            data?.calendar
        )
            ? data.calendar
            : [];


    aiSeatAvailabilityData = {

        ...(result.data || {}),

        source,

        destination,

        journeyDate,

        classCode,

        quotaCode: "GN",

        trainNumber: seatTrain

    };


    /* =================================================
       FIND REQUESTED DATE
    ================================================= */

    const requestedDay =
        calendar.find(

            item => {

                const itemDate =
                    String(
                        item?.date ||
                        item?.rawDate ||
                        ""
                    );


                return itemDate.startsWith(
                    journeyDate
                );

            }

        ) ||
        calendar[0];


    hideAITyping();


    if (!requestedDay) {

        addAIMessage(

            `
💺 Seat Availability

🚆 Train: ${seatTrain}

📍 ${source} → ${destination}

🪑 Class: ${classCode}

📅 ${journeyDate}

⚠️ No availability data was returned.
            `.trim(),

            "bot"

        );


        return;

    }


    /* =================================================
       STATUS
    ================================================= */

    const status =
        String(
            requestedDay?.status ||
            "UNKNOWN"
        );


    const statusCode =
        String(
            requestedDay?.statusCode ||
            ""
        ).toUpperCase();


    const availableSeats =
        requestedDay?.availableSeats;


    let availabilityText =
        status;


    if (
        statusCode === "AVAILABLE" &&
        availableSeats !== undefined &&
        availableSeats !== null
    ) {

        availabilityText =
            `AVAILABLE — ${availableSeats} seats`;

    }


    /* =================================================
       FINAL ANSWER
    ================================================= */

    addAIMessage(

        `
💺 Seat Availability

🚆 Train: ${seatTrain}

📍 ${source} → ${destination}

🪑 Class: ${classCode}

🎫 Quota: GN

📅 ${journeyDate}

${
    statusCode === "AVAILABLE"
        ? "✅"
        : "⚠️"
} ${availabilityText}
        `.trim(),

        "bot"

    );


    return;

}


        /* =================================================
           COACH POSITION
           
           Example:
           12828 coach position at CDGR
        ================================================= */

        const coachTrainMatch =
            cleanQuestion.match(
                /\b\d{5}\b/
            );


        const coachStationMatch =
            cleanQuestion.match(
                /\b[A-Z]{2,5}\b/gi
            ) || [];


        if (
            coachTrainMatch &&
            (
                text.includes("coach") ||
                text.includes("coach position") ||
                text.includes("formation")
            )
        ) {

            const coachTrain =
                coachTrainMatch[0];


            const ignoredCodes =
                new Set([
                    "COACH",
                    "POSITION",
                    "FORMATION",
                    "AT",
                    "THE",
                    "TRAIN"
                ]);


            const coachStation =
                coachStationMatch
                    .map(
                        code =>
                            code.toUpperCase()
                    )
                    .find(
                        code =>
                            !ignoredCodes.has(
                                code
                            ) &&
                            code !==
                                coachTrain
                    );


            if (coachStation) {

                const response =
                    await fetch(
                        `${API_BASE}/coaches/` +
                        `${encodeURIComponent(
                            coachTrain
                        )}/` +
                        `${encodeURIComponent(
                            coachStation
                        )}`,
                        {
                            method: "GET",
                            cache: "no-store",
                            headers: {
                                "Accept":
                                    "application/json"
                            }
                        }
                    );


                const result =
                    await getJson(
                        response
                    );


                if (
                    !response.ok ||
                    result?.success === false
                ) {

                    throw new Error(
                        result?.error?.message ||
                        result?.message ||
                        "Coach position unavailable."
                    );

                }


                hideAITyping();


                const data =
                    result.data || result;


                const stationName =
                    data?.stationName ||
                    data?.station?.name ||
                    coachStation;


                const platform =
                    data?.platform ||
                    data?.station?.platform ||
                    "—";


                const coaches =
                    Array.isArray(
                        data?.coaches
                    )
                        ? data.coaches
                        : (
                            Array.isArray(
                                data?.rake
                            )
                                ? data.rake
                                : []
                        );


                const coachPreview =
                    coaches
                        .slice(
                            0,
                            8
                        )
                        .map(
                            coach => {

                                const code =
                                    coach?.code ||
                                    coach?.name ||
                                    coach?.coachNumber ||
                                    "Coach";

                                return code;

                            }
                        )
                        .join(
                            " → "
                        );


                addAIMessage(
                    `
🚆 Coach Position

Train: ${coachTrain}

📍 Station:
${stationName} (${coachStation})

🚉 Platform:
${platform}

🚃 Formation:
${coachPreview || "Available in Coach Position section"}

Open Coach Position for the complete formation.
                    `.trim(),
                    "bot"
                );


                return;

            }

        }


        /* =================================================
           BETWEEN STATIONS / BEST TRAIN
           
           Example:
           Best train from HWH to MAS
           Trains from HWH to MAS
        ================================================= */

        const betweenMatch =
            cleanQuestion.match(
                /\b([A-Z]{2,5})\b\s*(?:to|->|-)\s*\b([A-Z]{2,5})\b/i
            );


        if (
            betweenMatch &&
            (
                text.includes("train") ||
                text.includes("best") ||
                text.includes("from") ||
                text.includes("between")
            )
        ) {

            const from =
                betweenMatch[1]
                    .toUpperCase();


            const to =
                betweenMatch[2]
                    .toUpperCase();


            const response =
                await fetch(
                    `${API_BASE}/trains/between/` +
                    `${encodeURIComponent(from)}/` +
                    `${encodeURIComponent(to)}`,
                    {
                        method: "GET",
                        cache: "no-store",
                        headers: {
                            "Accept":
                                "application/json"
                        }
                    }
                );


            const result =
                await getJson(
                    response
                );


            if (
                !response.ok ||
                result?.success === false
            ) {

                throw new Error(
                    result?.error?.message ||
                    result?.message ||
                    "Unable to find trains."
                );

            }


            hideAITyping();


            const trains =
                Array.isArray(
                    result?.trains
                )
                    ? result.trains
                    : (
                        Array.isArray(
                            result?.data
                        )
                            ? result.data
                            : []
                    );


            if (!trains.length) {

                addAIMessage(
                    `
🚆 No trains found

📍 ${from} → ${to}

Try another station pair or date.
                    `.trim(),
                    "bot"
                );


                return;

            }


            const topTrains =
                trains
                    .slice(
                        0,
                        5
                    );


            const trainList =
                topTrains
                    .map(
                        (train, index) => {

                            const number =
                                train?.number ||
                                train?.trainNumber ||
                                "—";


                            const name =
                                train?.name ||
                                train?.trainName ||
                                "Train";


                            return (
                                `${index + 1}. 🚆 ` +
                                `${number} ${name}`
                            );

                        }
                    )
                    .join(
                        "\n"
                    );


            addAIMessage(
                `
🚆 Trains Available

📍 ${from} → ${to}

${trainList}

I found ${trains.length} train(s).
Open Between Stations for complete details.
                `.trim(),
                "bot"
            );


            return;

        }


        /* =================================================
           TRAIN SUMMARY
        ================================================= */

        if (
            currentTrainNumber &&
            (
                text.includes("everything") ||
                text.includes("all details") ||
                text.includes("summary") ||
                text.includes("tell me about") ||
                text.includes("full details")
            )
        ) {

            hideAITyping();


            addAIMessage(
                getLocalAIResponse(
                    "tell me about my train"
                ),
                "bot"
            );


            return;

        }


        /* =================================================
           FEATURES
        ================================================= */

        if (
            text.includes("what can you do") ||
            text.includes("what features") ||
            text.includes("features") ||
            text.includes("help me") ||
            text.includes("কি করতে পারো") ||
            text.includes("কি কি আছে")
        ) {

            hideAITyping();


            addAIMessage(
                `
🤖 RailTrack AI

I can help with:

📍 Live Train Location
⏱ Delay & ETA
🚉 Current / Next Station
🛤️ Route & Stops
⚡ Train Speed
📊 Journey Progress
🗺️ Live Map
🔎 Train & Station Search
🎫 PNR Status
💺 Seat Availability
🚆 Coach Position
🚉 Trains Between Stations
🏆 Best Train Options

Just ask naturally.
                `.trim(),
                "bot"
            );


            return;

        }


        /* =================================================
           NORMAL RAILTRACK AI BACKEND
        ================================================= */

        const response =
            await fetch(
                `${API_BASE}/ai/chat`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",

                        "Accept":
                            "application/json"
                    },

                    body: JSON.stringify({

                        message:
                            cleanQuestion,

                        trainNumber:
                            currentTrainNumber || "",

                        journeyDate:
                            currentJourneyDate || ""

                    })

                }
            );


        const result =
            await getJson(
                response
            );


        if (
            !response.ok ||
            result?.success === false
        ) {

            throw new Error(
                result?.message ||
                "AI request failed."
            );

        }


        hideAITyping();


        addAIMessage(
            result.answer ||
            "I could not generate an answer.",
            "bot"
        );


    } catch (error) {

        console.error(
            "RailTrack AI ERROR:",
            error
        );


        hideAITyping();


        addAIMessage(
            `❌ ${error.message || "Something went wrong. Please try again."}`,
            "bot"
        );

    }

}


    /* -----------------------------------------------------
       FORM SUBMIT
    ----------------------------------------------------- */

    chatForm.addEventListener(
        "submit",
        event => {

            event.preventDefault();


            const question =
                chatInput.value.trim();


            if (!question) {
                return;
            }


            chatInput.value = "";


            handleAIQuestion(
                question
            );

        }
    );


    /* -----------------------------------------------------
       QUICK QUESTIONS
    ----------------------------------------------------- */

    quickQuestions.forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    const question =
                        button.dataset.question ||
                        button.textContent.trim();


                    handleAIQuestion(
                        question
                    );

                }
            );

        }
    );


    /* -----------------------------------------------------
       ENTER KEY
    ----------------------------------------------------- */

    chatInput.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Enter" &&
                !event.shiftKey
            ) {

                event.preventDefault();

                chatForm.requestSubmit();

            }

        }
    );


    console.log(
        "RailTrack AI Assistant initialized."
    );

}


/* =========================================================
   START AI ASSISTANT
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        setupAIAssistant();

    }
);

const calendarIcon =
    document.querySelector(".calendar-icon");

if (calendarIcon && betweenDateInput) {

    calendarIcon.addEventListener(
        "click",
        () => {

            if (
                typeof betweenDateInput.showPicker ===
                "function"
            ) {
                betweenDateInput.showPicker();
            } else {
                betweenDateInput.focus();
            }

        }
    );

}