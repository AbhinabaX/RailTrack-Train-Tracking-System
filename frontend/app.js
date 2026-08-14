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

let currentTrainNumber = "";
let currentJourneyDate = "";

let refreshTimer = null;
let isLoading = false;


/* =========================================================
   DOM ELEMENTS
========================================================= */

let trainTab = null;
let betweenTab = null;

let trainSearchForm = null;
let betweenSearchForm = null;

let trainNumberInput = null;
let trainDateInput = null;

let fromStationInput = null;
let toStationInput = null;
let betweenDateInput = null;

let trainSearchButton = null;
let betweenSearchButton = null;

let errorBox = null;
let dashboard = null;
let emptyState = null;

let betweenResults = null;
let trainList = null;

let connectionStatus = null;


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
    setupRefreshButton();

    setTodayDate();
    checkBackend();

});


/* =========================================================
   CACHE DOM
========================================================= */

function cacheDomElements() {

    trainTab = $("trainTab");
    betweenTab = $("betweenTab");

    trainSearchForm = $("trainSearchForm");
    betweenSearchForm = $("betweenSearchForm");

    trainNumberInput = $("trainNumber");
    trainDateInput = $("trainDate");

    fromStationInput = $("fromStation");
    toStationInput = $("toStation");

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

function setTodayDate() {

    const today = new Date();

    const year = today.getFullYear();

    const month = String(
        today.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
        today.getDate()
    ).padStart(2, "0");

    const todayValue =
        `${year}-${month}-${day}`;

    if (trainDateInput) {
        trainDateInput.value = todayValue;
    }

    if (betweenDateInput) {
        betweenDateInput.value = todayValue;
    }
}


/* =========================================================
   TABS
========================================================= */

function setupTabs() {

    if (trainTab) {

        trainTab.addEventListener("click", () => {

            trainTab.classList.add("active");

            if (betweenTab) {
                betweenTab.classList.remove("active");
            }

            if (trainSearchForm) {
                trainSearchForm.classList.remove("hidden");
            }

            if (betweenSearchForm) {
                betweenSearchForm.classList.add("hidden");
            }

            hideError();
        });
    }


    if (betweenTab) {

        betweenTab.addEventListener("click", () => {

            betweenTab.classList.add("active");

            if (trainTab) {
                trainTab.classList.remove("active");
            }

            if (betweenSearchForm) {
                betweenSearchForm.classList.remove("hidden");
            }

            if (trainSearchForm) {
                trainSearchForm.classList.add("hidden");
            }

            hideError();
        });
    }
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

    const params = new URLSearchParams();

    if (date) {
        params.set("date", date);
    }

    const query = params.toString();

    const url =
        `${API_BASE}/trains/${encodeURIComponent(
            trainNumber
        )}/dashboard${
            query ? `?${query}` : ""
        }`;

    console.log(
        "Loading train:",
        url
    );

    const response = await fetch(
        url,
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
        !response.ok ||
        data?.success === false
    ) {

        throw new Error(
            data?.error?.message ||
            data?.message ||
            "Train information could not be found."
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

    currentTrainNumber = trainNumber;
    currentJourneyDate = date;

    renderDashboard(data);

    emptyState?.classList.add("hidden");
    dashboard?.classList.remove("hidden");
    betweenResults?.classList.add("hidden");

    if (connectionStatus) {

        connectionStatus.textContent =
            "● Live Railway Data";

        connectionStatus.className =
            "connection connected";
    }

    startAutoRefresh();
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


    const nextArrival =
        getArrival(
            next,
            nextStop
        );

    const nextDeparture =
        getDeparture(
            next,
            nextStop
        );


    setText(
        "etaTime",
        formatDateTime(
            nextArrival
        )
    );

    setText(
        "etaNext",
        nextName
    );

    setText(
        "scheduledArrival",
        formatDateTime(
            getScheduledArrival(
                next,
                nextStop
            )
        )
    );

    setText(
        "expectedArrival",
        formatDateTime(
            getExpectedArrival(
                next,
                nextStop
            ) ||
            nextArrival
        )
    );

    setText(
        "stationDeparture",
        formatDateTime(
            nextDeparture
        )
    );

    setText(
        "platform",
        getPlatform(
            next,
            nextStop
        )
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


    /* =====================================================
       ROUTE + MAP
    ===================================================== */

    renderRoute(
        stops,
        current
    );

    renderLiveMap(data);
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

function renderRoute(
    stops,
    current
) {

    const container =
        $("routeList");

    if (!container) {
        return;
    }

    if (
        !Array.isArray(stops) ||
        !stops.length
    ) {

        setText(
            "stationCount",
            "0 stations"
        );

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


    const orderedStops =
        [...stops].sort(
            (a, b) => {

                const aSequence =
                    Number(a?.sequence);

                const bSequence =
                    Number(b?.sequence);

                if (
                    Number.isFinite(aSequence) &&
                    Number.isFinite(bSequence)
                ) {

                    return aSequence - bSequence;
                }

                return 0;
            }
        );


    setText(
        "stationCount",
        `${orderedStops.length} station${
            orderedStops.length === 1
                ? ""
                : "s"
        }`
    );


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


    if (
        currentIndex < 0 &&
        currentCode
    ) {

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


    container.innerHTML =
        orderedStops
            .map(
                (stop, index) => {

                    const sequence =
                        Number(stop?.sequence);

                    let status = "upcoming";


                    if (currentIndex >= 0) {

                        if (
                            index <
                            currentIndex
                        ) {

                            status = "passed";

                        } else if (
                            index ===
                            currentIndex
                        ) {

                            status = "current";
                        }

                    } else if (
                        Number.isFinite(
                            currentSequence
                        ) &&
                        Number.isFinite(sequence)
                    ) {

                        if (
                            sequence <
                            currentSequence
                        ) {

                            status = "passed";

                        } else if (
                            sequence ===
                            currentSequence
                        ) {

                            status = "current";
                        }
                    }


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


                    const halt =
                        calculateHaltMinutes(
                            actualArrival ||
                            expectedArrival ||
                            scheduledArrival,

                            actualDeparture ||
                            expectedDeparture ||
                            scheduledDeparture
                        );


                    const delay =
                        getStopDelay(stop);


                    return `
                        <div class="
                            railway-station
                            ${status}
                        ">

                            <div class="timeline-column">

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
                                    index <
                                    orderedStops.length - 1
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


                            <div class="station-content">

                                <div class="station-header">

                                    <div>

                                        <div class="station-name">
                                            ${escapeHtml(
                                                getStopName(stop)
                                            )}
                                        </div>

                                        <div class="station-code">
                                            ${escapeHtml(
                                                getStopCode(stop) ||
                                                "—"
                                            )}
                                        </div>

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


                                <div class="station-timing-grid">

                                    <div class="timing-box">

                                        <div class="timing-title">
                                            🕐 Scheduled
                                        </div>

                                        <div class="timing-row">
                                            <span>Arrival</span>

                                            <strong>
                                                ${escapeHtml(
                                                    shortTime(
                                                        scheduledArrival
                                                    )
                                                )}
                                            </strong>
                                        </div>

                                        <div class="timing-row">
                                            <span>Departure</span>

                                            <strong>
                                                ${escapeHtml(
                                                    shortTime(
                                                        scheduledDeparture
                                                    )
                                                )}
                                            </strong>
                                        </div>

                                    </div>


                                    <div class="
                                        timing-box
                                        expected-box
                                    ">

                                        <div class="timing-title">
                                            🟠 Expected
                                        </div>

                                        <div class="timing-row">
                                            <span>Arrival</span>

                                            <strong>
                                                ${escapeHtml(
                                                    shortTime(
                                                        expectedArrival
                                                    )
                                                )}
                                            </strong>
                                        </div>

                                        <div class="timing-row">
                                            <span>Departure</span>

                                            <strong>
                                                ${escapeHtml(
                                                    shortTime(
                                                        expectedDeparture
                                                    )
                                                )}
                                            </strong>
                                        </div>

                                    </div>


                                    <div class="
                                        timing-box
                                        actual-box
                                    ">

                                        <div class="timing-title">
                                            🟢 Actual
                                        </div>

                                        <div class="timing-row">
                                            <span>Arrival</span>

                                            <strong>
                                                ${escapeHtml(
                                                    shortTime(
                                                        actualArrival
                                                    )
                                                )}
                                            </strong>
                                        </div>

                                        <div class="timing-row">
                                            <span>Departure</span>

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


                                <div class="station-extra">

                                    <div class="extra-item">

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


                                    <div class="extra-item">

                                        <span>
                                            ⏱️ Halt
                                        </span>

                                        <strong>
                                            ${
                                                halt !== null
                                                    ? formatDuration(halt)
                                                    : "—"
                                            }
                                        </strong>

                                    </div>


                                    <div class="extra-item">

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
                                                    ? formatDuration(delay)
                                                    : "On time"
                                            }
                                        </strong>

                                    </div>


                                    <div class="extra-item">

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


                                ${
                                    status === "current"
                                        ? `
                                            <div class="
                                                current-train-banner
                                            ">
                                                🚆 TRAIN IS CURRENTLY AT THIS STATION
                                            </div>
                                        `
                                        : ""
                                }

                            </div>

                        </div>
                    `;
                }
            )
            .join("");
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
    removeMapLayer(stationLayer);
    removeMapLayer(trainMarker);

    routeLayer = null;
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


    const trainPosition =
        calculateTrainPosition(
            current,
            previous,
            next,
            stops,
            data
        );


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
                String(
                    fromStationInput?.value ||
                    ""
                )
                    .trim()
                    .toUpperCase();


            const to =
                String(
                    toStationInput?.value ||
                    ""
                )
                    .trim()
                    .toUpperCase();


            const date =
                betweenDateInput?.value ||
                "";


            if (!from) {

                showError(
                    "Please enter the FROM station code."
                );

                return;
            }


            if (!to) {

                showError(
                    "Please enter the destination station code."
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