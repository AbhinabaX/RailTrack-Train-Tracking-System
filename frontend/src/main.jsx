import React, {
  useEffect,
  useRef,
  useState
} from "react";

import {
  createRoot
} from "react-dom/client";

import L from "leaflet";

import "leaflet/dist/leaflet.css";

import "./styles.css";


/* =====================================================
   API
===================================================== */

const API =
  "http://localhost:5000/api";


/* =====================================================
   HELPERS
===================================================== */

function formatDateTime(value) {

  if (!value) {
    return "—";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return String(value);
  }

  return date.toLocaleString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }
  );
}


function formatTime(value) {

  if (!value) {
    return "—";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return String(value);
  }

  return date.toLocaleTimeString(
    "en-IN",
    {
      hour: "2-digit",
      minute: "2-digit"
    }
  );
}


function formatMinutes(
  minutes
) {

  if (
    minutes === null ||
    minutes === undefined
  ) {
    return "—";
  }

  if (
    minutes <= 0
  ) {
    return "Now";
  }

  if (
    minutes < 60
  ) {
    return `${minutes} min`;
  }

  const hours =
    Math.floor(
      minutes / 60
    );

  const mins =
    minutes % 60;

  return `${hours}h ${mins}m`;
}


/* =====================================================
   APP
===================================================== */

function App() {

  const [
    mode,
    setMode
  ] = useState(
    "train"
  );

  const [
    trainNumber,
    setTrainNumber
  ] = useState(
    ""
  );

  const [
    fromStation,
    setFromStation
  ] = useState(
    ""
  );

  const [
    destination,
    setDestination
  ] = useState(
    ""
  );

  const [
    journeyDate,
    setJourneyDate
  ] = useState(
    ""
  );

  const [
    dashboard,
    setDashboard
  ] = useState(
    null
  );

  const [
    betweenTrains,
    setBetweenTrains
  ] = useState(
    []
  );

  const [
    loading,
    setLoading
  ] = useState(
    false
  );

  const [
    error,
    setError
  ] = useState(
    ""
  );

  const [
    lastUpdated,
    setLastUpdated
  ] = useState(
    null
  );

  const [
    selectedTrain,
    setSelectedTrain
  ] = useState(
    ""
  );


  /* ===================================================
     SEARCH TRAIN
  =================================================== */

  async function searchTrain(
    number = trainNumber
  ) {

    const cleanNumber =
      String(number)
        .trim();

    if (
      !/^\d{5}$/
        .test(
          cleanNumber
        )
    ) {

      setError(
        "Enter a valid 5-digit train number."
      );

      return;
    }

    setLoading(
      true
    );

    setError(
      ""
    );

    try {

      const query =
        journeyDate
          ? `?date=${encodeURIComponent(
              journeyDate
            )}`
          : "";

      const response =
        await fetch(
          `${API}/trains/${cleanNumber}/dashboard${query}`
        );

      const json =
        await response.json();

      if (
        !response.ok ||
        !json.success
      ) {

        throw new Error(
          json?.error?.message ||
          "Train data could not be loaded."
        );
      }

      setDashboard(
        json.data
      );

      setLastUpdated(
        new Date()
      );

    } catch (
      requestError
    ) {

      console.error(
        requestError
      );

      setDashboard(
        null
      );

      setError(
        requestError.message
      );

    } finally {

      setLoading(
        false
      );
    }
  }


  /* ===================================================
     BETWEEN STATIONS
  =================================================== */

  async function searchBetweenStations() {

    if (
      !fromStation.trim()
    ) {

      setError(
        "Enter the From Station."
      );

      return;
    }

    if (
      !destination.trim()
    ) {

      setError(
        "Enter the Destination Station."
      );

      return;
    }

    setLoading(
      true
    );

    setError(
      ""
    );

    setDashboard(
      null
    );

    setBetweenTrains(
      []
    );

    try {

      const query =
        journeyDate
          ? `?date=${encodeURIComponent(
              journeyDate
            )}`
          : "";

      const url =
        `${API}/trains/between/` +
        `${encodeURIComponent(
          fromStation.trim()
        )}/` +
        `${encodeURIComponent(
          destination.trim()
        )}` +
        query;

      const response =
        await fetch(
          url
        );

      const json =
        await response.json();

      if (
        !response.ok ||
        !json.success
      ) {

        throw new Error(
          json?.error?.message ||
          "No trains found."
        );
      }

      setBetweenTrains(
        json.data?.trains ||
        []
      );

    } catch (
      requestError
    ) {

      console.error(
        requestError
      );

      setError(
        requestError.message
      );

    } finally {

      setLoading(
        false
      );
    }
  }


  /* ===================================================
     SELECT TRAIN FROM BETWEEN STATIONS
  =================================================== */

  function selectBetweenTrain(
    item
  ) {

    const number =
      item?.train?.number ||
      item?.trainNumber;

    if (!number) {
      return;
    }

    setSelectedTrain(
      String(number)
    );

    setTrainNumber(
      String(number)
    );

    setMode(
      "train"
    );

    setTimeout(
      () => {
        searchTrain(
          String(number)
        );
      },
      0
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  }


  /* ===================================================
     AUTO REFRESH
  =================================================== */

  useEffect(
    () => {

      if (
        !dashboard?.trainNumber
      ) {
        return;
      }

      const interval =
        setInterval(
          () => {

            searchTrain(
              dashboard.trainNumber
            );

          },
          60000
        );

      return () =>
        clearInterval(
          interval
        );

    },
    [
      dashboard?.trainNumber,
      journeyDate
    ]
  );


  /* ===================================================
     UI
  =================================================== */

  return (

    <div className="app">

      <Header />

      <main className="container">

        <Hero
          mode={mode}
          setMode={setMode}

          trainNumber={
            trainNumber
          }

          setTrainNumber={
            setTrainNumber
          }

          fromStation={
            fromStation
          }

          setFromStation={
            setFromStation
          }

          destination={
            destination
          }

          setDestination={
            setDestination
          }

          journeyDate={
            journeyDate
          }

          setJourneyDate={
            setJourneyDate
          }

          searchTrain={
            searchTrain
          }

          searchBetweenStations={
            searchBetweenStations
          }

          loading={
            loading
          }
        />


        {error && (

          <div className="error-box">

            <div>
              ⚠️
            </div>

            <div>

              <strong>
                Unable to load railway data
              </strong>

              <span>
                {error}
              </span>

            </div>

          </div>

        )}


        {mode ===
          "between" &&
          betweenTrains.length >
          0 && (

          <BetweenResults
            trains={
              betweenTrains
            }

            selectedTrain={
              selectedTrain
            }

            onSelect={
              selectBetweenTrain
            }
          />

        )}


        {dashboard ? (

          <Dashboard
            data={
              dashboard
            }

            lastUpdated={
              lastUpdated
            }

          />

        ) : (

          <Welcome />

        )}

      </main>


      <Footer />

    </div>
  );
}


/* =====================================================
   HEADER
===================================================== */

function Header() {

  return (

    <header className="header">

      <div className="header-inner">

        <div className="brand">

          <div className="brand-logo">
            🚆
          </div>

          <div>

            <strong>
              RailTrack
            </strong>

            <span>
              Live Indian Railway Tracking
            </span>

          </div>

        </div>


        <div className="header-status">

          <span className="live-dot" />

          Live Railway Data

        </div>

      </div>

    </header>
  );
}


/* =====================================================
   HERO SEARCH
===================================================== */

function Hero(props) {

  const {
    mode,
    setMode,
    trainNumber,
    setTrainNumber,
    fromStation,
    setFromStation,
    destination,
    setDestination,
    journeyDate,
    setJourneyDate,
    searchTrain,
    searchBetweenStations,
    loading
  } = props;


  return (

    <section className="hero">

      <div className="hero-content">

        <div className="eyebrow light">
          INDIAN RAILWAY LIVE TRACKING
        </div>

        <h1>
          Where is your train?
        </h1>

        <p>
          Search your train and see its
          live location, speed, delay,
          route, stations and running
          status on an interactive map.
        </p>


        <div className="search-tabs">

          <button
            className={
              mode === "train"
                ? "active"
                : ""
            }

            onClick={() =>
              setMode(
                "train"
              )
            }
          >
            🚆 Search by Train
          </button>


          <button
            className={
              mode === "between"
                ? "active"
                : ""
            }

            onClick={() =>
              setMode(
                "between"
              )
            }
          >
            📍 Between Stations
          </button>

        </div>


        {mode ===
          "train" ? (

          <div className="search-form train-form">

            <div className="field">

              <label>
                TRAIN NUMBER
              </label>

              <input
                value={
                  trainNumber
                }

                maxLength={
                  5
                }

                inputMode="numeric"

                placeholder="12827"

                onChange={
                  event =>
                    setTrainNumber(
                      event.target.value
                        .replace(
                          /\D/g,
                          ""
                        )
                        .slice(
                          0,
                          5
                        )
                    )
                }

                onKeyDown={
                  event => {

                    if (
                      event.key ===
                      "Enter"
                    ) {
                      searchTrain();
                    }

                  }
                }
              />

            </div>


            <div className="field">

              <label>
                JOURNEY DATE
                <small>
                  OPTIONAL
                </small>
              </label>

              <input
                type="date"

                value={
                  journeyDate
                }

                onChange={
                  event =>
                    setJourneyDate(
                      event.target.value
                    )
                }
              />

            </div>


            <button
              className="search-button"

              onClick={() =>
                searchTrain()
              }

              disabled={
                loading
              }
            >

              {loading
                ? "Searching..."
                : "Search Train"}

            </button>

          </div>

        ) : (

          <div className="search-form between-form">

            <div className="field">

              <label>
                FROM STATION
              </label>

              <input
                value={
                  fromStation
                }

                placeholder="BQA"

                onChange={
                  event =>
                    setFromStation(
                      event.target.value
                        .toUpperCase()
                    )
                }
              />

            </div>


            <div className="field">

              <label>
                DESTINATION STATION
              </label>

              <input
                value={
                  destination
                }

                placeholder="MGA"

                onChange={
                  event =>
                    setDestination(
                      event.target.value
                        .toUpperCase()
                    )
                }
              />

            </div>


            <div className="field">

              <label>
                JOURNEY DATE
                <small>
                  OPTIONAL
                </small>
              </label>

              <input
                type="date"

                value={
                  journeyDate
                }

                onChange={
                  event =>
                    setJourneyDate(
                      event.target.value
                    )
                }
              />

            </div>


            <button
              className="search-button"

              onClick={
                searchBetweenStations
              }

              disabled={
                loading
              }
            >

              {loading
                ? "Searching..."
                : "Search Trains"}

            </button>

          </div>

        )}

      </div>

    </section>
  );
}


/* =====================================================
   BETWEEN RESULTS
===================================================== */

function BetweenResults({
  trains,
  selectedTrain,
  onSelect
}) {

  return (

    <section className="section-card">

      <div className="section-header">

        <div>

          <span className="eyebrow">
            ROUTE SEARCH
          </span>

          <h2>
            Trains Between Stations
          </h2>

        </div>

        <span className="count-badge">
          {trains.length} trains
        </span>

      </div>


      <div className="between-list">

        {trains.map(
          (
            item,
            index
          ) => {

            const train =
              item.train ||
              item;

            const live =
              item.live ||
              {};

            return (

              <button
                key={
                  `${train.number || train.trainNumber}-${index}`
                }

                className={
                  "between-card " +
                  (
                    selectedTrain ===
                    String(
                      train.number ||
                      train.trainNumber
                    )
                      ? "selected"
                      : ""
                  )
                }

                onClick={() =>
                  onSelect(
                    item
                  )
                }
              >

                <div className="train-code">

                  {train.number ||
                    train.trainNumber ||
                    "—"}

                </div>


                <div className="between-name">

                  <strong>
                    {train.name ||
                      train.trainName ||
                      "Indian Railways Train"}
                  </strong>

                  <span>
                    {train.type ||
                      train.category ||
                      "Express"}
                  </span>

                </div>


                <div className="between-route">

                  <strong>
                    {item.from?.departure ||
                      item.departure ||
                      "—"}
                  </strong>

                  <span>
                    →
                  </span>

                  <strong>
                    {item.to?.arrival ||
                      item.arrival ||
                      "—"}
                  </strong>

                </div>


                <div className="between-live">

                  {live.delayMinutes !==
                  undefined
                    ? `${live.delayMinutes} min`
                    : "Live"}

                </div>


                <div className="select-arrow">
                  →
                </div>

              </button>

            );
          }
        )}

      </div>

    </section>
  );
}


/* =====================================================
   DASHBOARD
===================================================== */

function Dashboard({
  data,
  lastUpdated
}) {

  return (

    <div className="dashboard">

      <TrainHeader
        data={
          data
        }
      />


      <Metrics
        data={
          data
        }
      />


      <div className="dashboard-grid">

        <LiveMap
          data={
            data
          }
        />


        <Prediction
          data={
            data
          }

          lastUpdated={
            lastUpdated
          }
        />

      </div>


      <RouteTimeline
        data={
          data
        }
      />


      {data.exceptions?.length >
        0 && (

        <ServiceAlerts
          exceptions={
            data.exceptions
          }
        />

      )}

    </div>
  );
}


/* =====================================================
   TRAIN HEADER
===================================================== */

function TrainHeader({
  data
}) {

  const running =
    data.status ===
    "running";


  return (

    <section className="train-header section-card">

      <div>

        <div
          className={
            "status " +
            (
              running
                ? "running"
                : "normal"
            )
          }
        >

          <span />

          {String(
            data.status ||
            "UNKNOWN"
          ).toUpperCase()}

        </div>


        <h2>
          {data.trainName}
        </h2>


        <p>

          {data.source?.name ||
            data.source?.code ||
            "—"}

          <span>
            →
          </span>

          {data.destination?.name ||
            data.destination?.code ||
            "—"}

        </p>

      </div>


      <div className="number-box">

        <span>
          TRAIN NUMBER
        </span>

        <strong>
          {data.trainNumber}
        </strong>

      </div>

    </section>
  );
}


/* =====================================================
   METRICS
===================================================== */

function Metrics({
  data
}) {

  const metrics = [

    {
      icon: "⚡",
      label:
        "CURRENT SPEED",
      value:
        data.currentSpeedKmph !=
        null
          ? `${data.currentSpeedKmph} km/h`
          : "—"
    },

    {
      icon: "🏎️",
      label:
        "MAX SPEED",
      value:
        data.trainStats?.maxSpeedKmph !=
        null
          ? `${data.trainStats.maxSpeedKmph} km/h`
          : "—"
    },

    {
      icon: "📍",
      label:
        "CURRENT LOCATION",
      value:
        data.currentLocation?.name ||
        data.currentLocation?.code ||
        "Between stations"
    },

    {
      icon: "🚉",
      label:
        "NEXT STATION",
      value:
        data.nextHalt?.name ||
        data.nextHalt?.code ||
        "—"
    },

    {
      icon: "⏱️",
      label:
        "DELAY",
      value:
        `${data.delayMinutes || 0} min`
    },

    {
      icon: "🛑",
      label:
        "STATIONS",
      value:
        data.route?.length ||
        0
    }

  ];


  return (

    <div className="metrics">

      {metrics.map(
        (
          metric,
          index
        ) => (

          <div
            className="metric-card"
            key={
              index
            }
          >

            <div className="metric-icon">
              {metric.icon}
            </div>

            <div>

              <span>
                {metric.label}
              </span>

              <strong>
                {metric.value}
              </strong>

            </div>

          </div>

        )
      )}

    </div>
  );
}


/* =====================================================
   LIVE MAP
===================================================== */

function LiveMap({
  data
}) {

  const mapElement =
    useRef(null);

  const mapRef =
    useRef(null);


  useEffect(
    () => {

      if (
        !mapElement.current
      ) {
        return;
      }


      const map =
        L.map(
          mapElement.current,
          {
            zoomControl:
              true,

            scrollWheelZoom:
              true
          }
        );


      mapRef.current =
        map;


      L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
          attribution:
            "&copy; OpenStreetMap contributors"
        }
      ).addTo(
        map
      );


      const allPoints =
        [];


      /* ===============================================
         ROUTE
      =============================================== */

      const geometry =
        data.geometry;


      if (
        geometry?.geometry?.coordinates
      ) {

        const coordinates =
          geometry
            .geometry
            .coordinates;


        const line =
          coordinates.map(
            ([lng, lat]) =>
              [
                lat,
                lng
              ]
          );


        L.polyline(
          line,
          {
            color:
              "#1769e0",

            weight:
              5,

            opacity:
              0.85
          }
        ).addTo(
          map
        );


        allPoints.push(
          ...line
        );
      }


      /* ===============================================
         STATIONS
      =============================================== */

      data.route
        ?.filter(
          station =>
            station.lat !=
              null &&
            station.lng !=
              null
        )
        .forEach(
          station => {

            const marker =
              L.circleMarker(
                [
                  station.lat,
                  station.lng
                ],
                {
                  radius:
                    4,

                  color:
                    "#1769e0",

                  fillColor:
                    "#ffffff",

                  fillOpacity:
                    1,

                  weight:
                    2
                }
              ).addTo(
                map
              );


            marker.bindPopup(
              `
              <strong>
                ${station.name}
              </strong>
              <br>
              ${station.code}
              `
            );


            allPoints.push(
              [
                station.lat,
                station.lng
              ]
            );

          }
        );


      /* ===============================================
         CURRENT TRAIN
      =============================================== */

      const current =
        data.currentLocation;


      if (
        current?.lat !=
          null &&
        current?.lng !=
          null
      ) {

        const trainIcon =
          L.divIcon(
            {
              className:
                "train-marker",

              html:
                `<div>🚆</div>`,

              iconSize:
                [
                  42,
                  42
                ],

              iconAnchor:
                [
                  21,
                  21
                ]
            }
          );


        const marker =
          L.marker(
            [
              current.lat,
              current.lng
            ],
            {
              icon:
                trainIcon
            }
          ).addTo(
            map
          );


        marker.bindPopup(
          `
          <strong>
            ${data.trainName}
          </strong>

          <br>

          ${
            current.name ||
            current.code ||
            "Current location"
          }

          <br>

          Speed:
          ${
            current.speedKmph ??
            "—"
          }
          km/h
          `
        );


        marker.openPopup();


        allPoints.push(
          [
            current.lat,
            current.lng
          ]
        );

      }


      /* ===============================================
         MAP VIEW
      =============================================== */

      if (
        allPoints.length
      ) {

        map.fitBounds(
          allPoints,
          {
            padding:
              [
                35,
                35
              ]
          }
        );

      } else {

        map.setView(
          [
            22.5,
            88.3
          ],
          6
        );

      }


      return () => {

        map.remove();

        mapRef.current =
          null;

      };

    },
    [
      data
    ]
  );


  return (

    <section className="map-card section-card">

      <div className="card-heading">

        <div>

          <span className="eyebrow">
            LIVE LOCATION
          </span>

          <h2>
            Where is my train?
          </h2>

        </div>


        <span className="live-badge">
          ● LIVE
        </span>

      </div>


      <div
        ref={
          mapElement
        }

        className="map"
      />


      <div className="location-flow">

        <LocationItem
          label="PREVIOUS"
          value={
            data.previousHalt?.name ||
            data.previousHalt?.code ||
            "—"
          }
        />


        <div className="flow-arrow">
          →
        </div>


        <LocationItem
          label="CURRENT"
          value={
            data.currentLocation?.name ||
            data.currentLocation?.code ||
            "Between stations"
          }
          current
        />


        <div className="flow-arrow">
          →
        </div>


        <LocationItem
          label="NEXT"
          value={
            data.nextHalt?.name ||
            data.nextHalt?.code ||
            "—"
          }
        />

      </div>

    </section>
  );
}


/* =====================================================
   LOCATION ITEM
===================================================== */

function LocationItem({
  label,
  value,
  current
}) {

  return (

    <div
      className={
        "location-item " +
        (
          current
            ? "current"
            : ""
        )
      }
    >

      <span>
        {label}
      </span>

      <strong>
        {value}
      </strong>

    </div>
  );
}


/* =====================================================
   PREDICTION
===================================================== */

function Prediction({
  data,
  lastUpdated
}) {

  return (

    <section className="prediction-card section-card">

      <span className="eyebrow">
        RUNNING INFORMATION
      </span>


      <h2>
        Live Journey Details
      </h2>


      <div className="big-location">

        <span>
          CURRENT STATION
        </span>

        <strong>
          {data.currentLocation?.name ||
            data.currentLocation?.code ||
            "Between stations"}
        </strong>

      </div>


      <InfoRow
        label="Next Station"
        value={
          data.nextHalt?.name ||
          data.nextHalt?.code ||
          "—"
        }
      />


      <InfoRow
        label="Current Speed"
        value={
          data.currentSpeedKmph !=
          null
            ? `${data.currentSpeedKmph} km/h`
            : "—"
        }
      />


      <InfoRow
        label="Delay"
        value={
          `${data.delayMinutes || 0} min`
        }
      />


      <InfoRow
        label="Station Exit"
        value={
          formatMinutes(
            data.stationExitMinutes
          )
        }
      />


      <InfoRow
        label="Last Updated"
        value={
          formatDateTime(
            data.lastUpdatedAt ||
            lastUpdated
          )
        }
      />


      <InfoRow
        label="Journey Date"
        value={
          data.startDate ||
          "Auto detected"
        }
      />

    </section>
  );
}


/* =====================================================
   INFO ROW
===================================================== */

function InfoRow({
  label,
  value
}) {

  return (

    <div className="info-row">

      <span>
        {label}
      </span>

      <strong>
        {value}
      </strong>

    </div>
  );
}


/* =====================================================
   ROUTE TIMELINE
===================================================== */

function RouteTimeline({
  data
}) {

  return (

    <section className="route-card section-card">

      <div className="section-header">

        <div>

          <span className="eyebrow">
            JOURNEY ROUTE
          </span>

          <h2>
            Stations & Timings
          </h2>

        </div>


        <span className="count-badge">
          {data.route?.length || 0}
          stations
        </span>

      </div>


      <div className="timeline">

        {data.route?.map(
          (
            station,
            index
          ) => (

            <div
              className={
                "timeline-item " +
                (
                  station.status ||
                  ""
                )
              }

              key={
                `${station.sequence}-${station.code}-${index}`
              }
            >

              <div className="timeline-marker">

                {station.status ===
                "departed"
                  ? "✓"
                  : ""}

              </div>


              <div className="timeline-content">

                <div className="station-main">

                  <div>

                    <strong>
                      {station.name}
                    </strong>

                    <span>
                      {station.code}
                    </span>

                  </div>


                  <div className="station-status">

                    {station.status ||
                      "scheduled"}

                  </div>

                </div>


                <div className="station-times">

                  <span>
                    Arrival:
                    {" "}
                    {
                      station.actualArrival ||
                      station.scheduledArrival
                        ? formatDateTime(
                            station.actualArrival ||
                            station.scheduledArrival
                          )
                        : "—"
                    }
                  </span>


                  <span>
                    Departure:
                    {" "}
                    {
                      station.actualDeparture ||
                      station.scheduledDeparture
                        ? formatDateTime(
                            station.actualDeparture ||
                            station.scheduledDeparture
                          )
                        : "—"
                    }
                  </span>


                  {station.platform && (

                    <span>
                      Platform:
                      {" "}
                      {station.platform}
                    </span>

                  )}

                </div>

              </div>

            </div>

          )
        )}

      </div>

    </section>
  );
}


/* =====================================================
   SERVICE ALERTS
===================================================== */

function ServiceAlerts({
  exceptions
}) {

  return (

    <section className="alerts-card section-card">

      <span className="eyebrow">
        SERVICE INFORMATION
      </span>

      <h2>
        Alerts & Exceptions
      </h2>


      {exceptions.map(
        (
          exception,
          index
        ) => (

          <div
            className="alert-item"
            key={
              index
            }
          >

            <strong>
              {exception.type ||
                "NOTICE"}
            </strong>

            <span>
              {exception.message ||
                "Railway service information available."}
            </span>

          </div>

        )
      )}

    </section>
  );
}


/* =====================================================
   WELCOME
===================================================== */

function Welcome() {

  return (

    <section className="welcome section-card">

      <div className="welcome-icon">
        🚆
      </div>

      <h2>
        Search your train
      </h2>

      <p>
        Enter a 5-digit train number
        above to see real-time running
        information and the train's
        current position on the map.
      </p>

      <div className="feature-row">

        <span>
          📍 Live Location
        </span>

        <span>
          ⚡ Current Speed
        </span>

        <span>
          ⏱ Delay
        </span>

        <span>
          🗺 Route Map
        </span>

      </div>

    </section>
  );
}


/* =====================================================
   FOOTER
===================================================== */

function Footer() {

  return (

    <footer className="footer">

      <div>
        © 2026 RailTrack
      </div>

      <div>
        Live Indian Railway Tracking
      </div>

      <div>
        Real railway data
      </div>

    </footer>
  );
}


/* =====================================================
   RENDER
===================================================== */

createRoot(
  document.getElementById(
    "root"
  )
).render(
  <App />
);
