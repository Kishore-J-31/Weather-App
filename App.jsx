import React, { useEffect, useState, useMemo } from "react";

/*
  Weather app that fetches timeline from Visual Crossing.
  API key is read from import.meta.env.VITE_WEATHER_API
*/

const API_KEY = import.meta.env.VITE_WEATHER_API || "";

const ICONS = {
  "partly-cloudy-day": {
    icon: "https://i.ibb.co/PZQXH8V/27.png",
    bg: "https://i.ibb.co/qNv7NxZ/pc.webp"
  },
  "partly-cloudy-night": {
    icon: "https://i.ibb.co/Kzkk59k/15.png",
    bg: "https://i.ibb.co/RDfPqXz/pcn.jpg"
  },
  rain: {
    icon: "https://i.ibb.co/kBd2NTS/39.png",
    bg: "https://i.ibb.co/h2p6Yhd/rain.webp"
  },
  "clear-day": {
    icon: "https://i.ibb.co/rb4rrJL/26.png",
    bg: "https://i.ibb.co/WGry01m/cd.jpg"
  },
  "clear-night": {
    icon: "https://i.ibb.co/1nxNGHL/10.png",
    bg: "https://i.ibb.co/kqtZ1Gx/cn.jpg"
  },
  default: {
    icon: "https://i.ibb.co/rb4rrJL/26.png",
    bg: "https://i.ibb.co/qNv7NxZ/pc.webp"
  }
};

export default function App() {
  const [unit, setUnit] = useState("metric"); // metric => metric units (C), us => Fahrenheit (VisualCrossing uses 'us')
  const [cityInput, setCityInput] = useState("Theni");
  const [cityQuery, setCityQuery] = useState("Theni");
  const [data, setData] = useState(null);
  const [tab, setTab] = useState("today");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchWeather(cityQuery, unit);
  }, [cityQuery, unit]);

  async function fetchWeather(city, unitGroup) {
    if (!API_KEY) {
      setError("Missing API key. Put VITE_WEATHER_API in .env");
      setData(null);
      return;
    }

    try {
      setLoading(true);
      setError("");
      const url = `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${encodeURIComponent(
        city
      )}?unitGroup=${unit === "metric" ? "metric" : "us"}&key=${API_KEY}&contentType=json`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Fetch failed");
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error(err);
      setError("Could not load weather. Try another city.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  const current = data?.currentConditions;
  const today = data?.days?.[0];

  const unitSymbol = unit === "metric" ? "°C" : "°F";
  const speedUnit = unit === "metric" ? "km/h" : "mph";

  const iconKey = current?.icon && ICONS[current.icon] ? current.icon : "default";
  const currentIcon = ICONS[iconKey].icon;
  const bgImage = ICONS[iconKey].bg;

  const todayHours = useMemo(() => (today?.hours ? today.hours.slice(0, 24) : []), [today]);
  const weekDays = useMemo(() => (data?.days ? data.days.slice(0, 7) : []), [data]);

  const formatHour = (h) => {
    if (!h) return "";
    const [hourStr] = String(h).split(":");
    let hour = parseInt(hourStr, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    hour = hour % 12 || 12;
    return `${hour.toString().padStart(2, "0")}:00 ${ampm}`;
  };

  const formatDay = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { weekday: "long" });
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return "";
    const [h, m] = timeStr.split(":");
    let hour = parseInt(h, 10);
    const ampm = hour >= 12 ? "pm" : "am";
    hour = hour % 12 || 12;
    return `${hour.toString().padStart(2, "0")}:${m} ${ampm}`;
  };

  const now = useMemo(() => new Date(), []);
  const dateLabel = now.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric"
  });
  const timeLabel = now.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit"
  });

  function handleSearch(e) {
    e?.preventDefault();
    if (!cityInput.trim()) return;
    setCityQuery(cityInput.trim());
  }

  return (
    <div className="app-root" style={{ backgroundImage: `url(${bgImage})` }}>
      <div className="overlay">
        <div className="weather-card">
          <aside className="sidebar">
            <form className="search-box" onSubmit={handleSearch}>
              <input
                type="text"
                placeholder="Search..."
                value={cityInput}
                onChange={(e) => setCityInput(e.target.value)}
              />
              <button type="submit" className="search-btn">🔍</button>
            </form>

            <div className="sidebar-icon">
              <img src={currentIcon} alt="weather icon" />
            </div>

            <div className="sidebar-main-temp">
              {loading ? (
                <span>...</span>
              ) : current ? (
                <>
                  <span className="temp">{Math.round(current.temp)}{unitSymbol}</span>
                  <span className="time">{dateLabel}</span>
                  <span className="time">Saturday, {timeLabel}</span>
                </>
              ) : (
                <span className="time">Search a city to begin</span>
              )}
            </div>

            <div className="sidebar-conditions">
              <p className="condition">{current?.conditions || "—"}</p>
              <p>Perc - {today?.precipprob ?? 0}%</p>
            </div>

            <div className="sidebar-location">{data?.resolvedAddress || cityQuery}</div>
          </aside>

          <section className="main-panel">
            <header className="main-header">
              <div className="tabs">
                <button className={tab === "today" ? "tab active" : "tab"} onClick={() => setTab("today")}>Today</button>
                <button className={tab === "week" ? "tab active" : "tab"} onClick={() => setTab("week")}>Week</button>
              </div>

              <div className="unit-toggle">
                <button className={unit === "metric" ? "unit-btn active" : "unit-btn"} onClick={() => setUnit("metric")}>°C</button>
                <button className={unit === "us" ? "unit-btn active" : "unit-btn"} onClick={() => setUnit("us")}>°F</button>
              </div>
            </header>

            {error && <p className="error-msg">{error}</p>}
            {loading && <p className="loading">Loading weather...</p>}

            {!loading && data && (
              <>
                {tab === "today" ? (
                  <div className="forecast-grid">
                    {todayHours.map((h) => (
                      <div className="forecast-card" key={h.datetime}>
                        <span className="forecast-time">{formatHour(h.datetime)}</span>
                        <img src={ICONS[h.icon]?.icon || ICONS.default.icon} alt="" className="forecast-icon" />
                        <span className="forecast-temp">{Math.round(h.temp)}{unitSymbol}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="forecast-grid week-view">
                    {weekDays.map((d) => (
                      <div className="forecast-card" key={d.datetime}>
                        <span className="forecast-time">{formatDay(d.datetime)}</span>
                        <img src={ICONS[d.icon]?.icon || ICONS.default.icon} alt="" className="forecast-icon" />
                        <span className="forecast-temp">{Math.round(d.temp)}{unitSymbol}</span>
                      </div>
                    ))}
                  </div>
                )}

                <h2 className="highlights-title">Today's Highlights</h2>
                <div className="highlights-grid">
                  <div className="highlight-card">
                    <h3>UV Index</h3>
                    <p className="highlight-main">{today?.uvindex ?? "—"}</p>
                    <p className="highlight-sub">Moderate</p>
                  </div>

                  <div className="highlight-card">
                    <h3>Wind Status</h3>
                    <p className="highlight-main">{Math.round(current?.windspeed ?? 0)}</p>
                    <p className="highlight-sub">{speedUnit}</p>
                  </div>

                  <div className="highlight-card">
                    <h3>Sunrise &amp; Sunset</h3>
                    <p className="highlight-main">{formatTime(today?.sunrise)}</p>
                    <p className="highlight-sub">{formatTime(today?.sunset)}</p>
                  </div>

                  <div className="highlight-card">
                    <h3>Humidity</h3>
                    <p className="highlight-main">{current?.humidity ?? "—"}%</p>
                    <p className="highlight-sub">High</p>
                  </div>

                  <div className="highlight-card">
                    <h3>Visibility</h3>
                    <p className="highlight-main">{current?.visibility ?? "—"}</p>
                    <p className="highlight-sub">Very Clear Air</p>
                  </div>

                  <div className="highlight-card">
                    <h3>Air Quality</h3>
                    <p className="highlight-main">26.5</p>
                    <p className="highlight-sub">Good ✌️</p>
                  </div>
                </div>

                <footer className="footer">
                  Weather App by <span className="author">Kishore</span>
                </footer>
              </>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
