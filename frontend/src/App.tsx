import {
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";

import "./App.css";

import {
  createInitialSimulation,
  generateForecast,
  updateSimulation,
  type SimulationData,
} from "./simulation";

import Forecasting from "./modules/Forecasting";
import Optimization from "./modules/Optimization";
import DigitalTwin from "./modules/DigitalTwin";
import Emergency from "./modules/Emergency";
import Analytics from "./modules/Analytics";
import Settings from "./modules/Settings";

type Page =
  | "dashboard"
  | "forecasting"
  | "optimization"
  | "digital-twin"
  | "emergency"
  | "analytics"
  | "settings";

function App() {
  const [simulation, setSimulation] =
    useState<SimulationData>(
      createInitialSimulation()
    );

  const [running, setRunning] =
    useState<boolean>(true);

  const [speed, setSpeed] =
    useState<number>(1);

  const [activePage, setActivePage] =
    useState<Page>("dashboard");

  /*
   * =========================================================
   * FORECAST DATA
   * =========================================================
   */

  const forecast = useMemo(() => {
    return generateForecast(simulation);
  }, [simulation]);

  /*
   * =========================================================
   * FRONTEND SIMULATION ENGINE
   * =========================================================
   */

  useEffect(() => {
    if (!running) {
      return;
    }

    const interval = window.setInterval(() => {
      setSimulation((previous) =>
        updateSimulation(previous, 5)
      );
    }, 2000 / speed);

    return () => {
      window.clearInterval(interval);
    };
  }, [running, speed]);

  /*
   * =========================================================
   * RESET SIMULATION
   * =========================================================
   */

  const resetSimulation = () => {
    setSimulation(
      createInitialSimulation()
    );

    setRunning(true);
  };

  /*
   * =========================================================
   * SYSTEM STATUS
   * =========================================================
   */

  const statusClass =
    simulation.systemStatus === "EMERGENCY"
      ? "status-emergency"
      : simulation.systemStatus === "WARNING"
      ? "status-warning"
      : "status-normal";

  /*
   * =========================================================
   * COMMON HEADER
   * =========================================================
   */

  const renderHeader = () => {
    return (
      <Header
        simulation={simulation}
        running={running}
        speed={speed}
        setRunning={setRunning}
        setSpeed={setSpeed}
        resetSimulation={resetSimulation}
        statusClass={statusClass}
      />
    );
  };

  /*
   * =========================================================
   * FORECASTING PAGE
   * =========================================================
   */

  if (activePage === "forecasting") {
    return (
      <div className="app">

        {renderHeader()}

        <main className="main-content">

          <Forecasting
            simulation={simulation}
            forecast={forecast}
          />

        </main>

        <Navigation
          activePage={activePage}
          setActivePage={setActivePage}
        />

      </div>
    );
  }

  /*
   * =========================================================
   * OPTIMIZATION PAGE
   * =========================================================
   */

  if (activePage === "optimization") {
    return (
      <div className="app">

        {renderHeader()}

        <main className="main-content">

          <Optimization
            simulation={simulation}
          />

        </main>

        <Navigation
          activePage={activePage}
          setActivePage={setActivePage}
        />

      </div>
    );
  }

  /*
   * =========================================================
   * DIGITAL TWIN PAGE
   * =========================================================
   */

  if (activePage === "digital-twin") {
    return (
      <div className="app">

        {renderHeader()}

        <main className="main-content">

          <DigitalTwin
            simulation={simulation}
          />

        </main>

        <Navigation
          activePage={activePage}
          setActivePage={setActivePage}
        />

      </div>
    );
  }

  /*
   * =========================================================
   * EMERGENCY PAGE
   * =========================================================
   */

  if (activePage === "emergency") {
    return (
      <div className="app">

        {renderHeader()}

        <main className="main-content">

          <Emergency
            simulation={simulation}
          />

        </main>

        <Navigation
          activePage={activePage}
          setActivePage={setActivePage}
        />

      </div>
    );
  }

  /*
   * =========================================================
   * ANALYTICS PAGE
   * =========================================================
   */

if (activePage === "analytics") {
  return (
    <div className="app">
      {renderHeader()}

      <main className="main-content">
        <Analytics
          simulation={simulation}
        />
      </main>

      <Navigation
        activePage={activePage}
        setActivePage={setActivePage}
      />
    </div>
  );
}

 if (activePage === "settings") {
  return (
    <div className="app">

      {renderHeader()}

      <main className="main-content">

        <Settings
          speed={speed}
          setSpeed={setSpeed}
          onResetSimulation={resetSimulation}
        />

      </main>

      <Navigation
        activePage={activePage}
        setActivePage={setActivePage}
      />

    </div>
  );
}

  /*
   * =========================================================
   * DASHBOARD
   * =========================================================
   */

  return (
    <div className="app">

      {renderHeader()}

      <main className="main-content">

        {/* ===================================================
            PAGE HEADER
            =================================================== */}

        <section className="page-heading">

          <div>

            <div className="eyebrow">
              ENERGY COMMAND CENTER
            </div>

            <h1>
              BHARATI RESEARCH STATION
            </h1>

            <p>
              AI-powered smart energy management
              simulation for polar research operations
            </p>

          </div>

          <div className="demo-badge">

            <span className="pulse-dot"></span>

            FRONTEND DEMO MODE

          </div>

        </section>

        {/* ===================================================
            KPI CARDS
            =================================================== */}

        <section className="kpi-grid">

          <MetricCard
            title="Current Load"
            value={`${simulation.currentLoad.toFixed(
              1
            )} kW`}
            subtitle="Total station demand"
            icon="⚡"
            className="blue"
          />

          <MetricCard
            title="Renewable Power"
            value={`${simulation.renewableGeneration.toFixed(
              1
            )} kW`}
            subtitle={`${simulation.renewablePercentage.toFixed(
              0
            )}% of current demand`}
            icon="☀"
            className="green"
          />

          <MetricCard
            title="Battery SOC"
            value={`${simulation.batterySoc.toFixed(
              0
            )}%`}
            subtitle={
              simulation.batteryPower >= 0
                ? "Charging"
                : "Discharging"
            }
            icon="🔋"
            className="purple"
          />

          <MetricCard
            title="Diesel Output"
            value={`${simulation.dieselOutput.toFixed(
              1
            )} kW`}
            subtitle={`${simulation.fuelRate.toFixed(
              1
            )} L/h fuel rate`}
            icon="⚙"
            className="orange"
          />

        </section>

        {/* ===================================================
            DASHBOARD GRID
            =================================================== */}

        <section className="dashboard-grid">

          {/* ENERGY FLOW */}

          <div className="panel energy-flow-panel">

            <PanelHeader
              title="Energy Flow"
              subtitle="Real-time simulated power distribution"
            />

            <div className="energy-flow">

              <EnergyNode
                icon="☀"
                label="SOLAR"
                value={`${simulation.solarGeneration.toFixed(
                  1
                )} kW`}
                color="yellow"
              />

              <div className="flow-line">
                <span>→</span>
              </div>

              <EnergyNode
                icon="🌬"
                label="WIND"
                value={`${simulation.windGeneration.toFixed(
                  1
                )} kW`}
                color="cyan"
              />

              <div className="flow-line">
                <span>→</span>
              </div>

              <EnergyNode
                icon="⚡"
                label="GRID BUS"
                value={`${simulation.currentLoad.toFixed(
                  1
                )} kW`}
                color="green"
              />

            </div>

            <div className="energy-secondary-flow">

              <EnergyNode
                icon="🔋"
                label="BATTERY"
                value={`${
                  simulation.batteryPower >= 0
                    ? "+"
                    : ""
                }${simulation.batteryPower.toFixed(
                  1
                )} kW`}
                color="purple"
              />

              <EnergyNode
                icon="⛽"
                label="DIESEL"
                value={`${simulation.dieselOutput.toFixed(
                  1
                )} kW`}
                color="orange"
              />

              <EnergyNode
                icon="🏠"
                label="LOAD"
                value={`${simulation.currentLoad.toFixed(
                  1
                )} kW`}
                color="blue"
              />

            </div>

          </div>

          {/* WEATHER */}

          <div className="panel">

            <PanelHeader
              title="Polar Weather"
              subtitle="Simulated station environment"
            />

            <div className="weather-grid">

              <WeatherItem
                icon="🌡"
                label="Temperature"
                value={`${simulation.temperature.toFixed(
                  1
                )} °C`}
              />

              <WeatherItem
                icon="🌬"
                label="Wind Speed"
                value={`${simulation.windSpeed.toFixed(
                  1
                )} m/s`}
              />

              <WeatherItem
                icon="☀"
                label="Solar Irradiance"
                value={`${simulation.solarIrradiance.toFixed(
                  0
                )} W/m²`}
              />

              <WeatherItem
                icon="💧"
                label="Humidity"
                value={`${simulation.humidity.toFixed(
                  0
                )}%`}
              />

              <WeatherItem
                icon="☁"
                label="Cloud Cover"
                value={`${simulation.cloudCover.toFixed(
                  0
                )}%`}
              />

              <WeatherItem
                icon="👥"
                label="Occupancy"
                value={`${simulation.occupancy} people`}
              />

            </div>

          </div>

          {/* LOAD BREAKDOWN */}

          <div className="panel">

            <PanelHeader
              title="Load Breakdown"
              subtitle="Current station demand"
            />

            <LoadBar
              label="Heating"
              value={simulation.heatingLoad}
              total={simulation.currentLoad}
            />

            <LoadBar
              label="Laboratory"
              value={simulation.laboratoryLoad}
              total={simulation.currentLoad}
            />

            <LoadBar
              label="Communication"
              value={simulation.communicationLoad}
              total={simulation.currentLoad}
            />

            <LoadBar
              label="Lighting"
              value={simulation.lightingLoad}
              total={simulation.currentLoad}
            />

            <LoadBar
              label="Water Systems"
              value={simulation.waterLoad}
              total={simulation.currentLoad}
            />

          </div>

          {/* BATTERY */}

          <div className="panel">

            <PanelHeader
              title="Battery Status"
              subtitle="Energy storage management"
            />

            <div className="battery-display">

              <div className="battery-circle">

                <div className="battery-percent">
                  {simulation.batterySoc.toFixed(0)}%
                </div>

                <div className="battery-label">
                  STATE OF CHARGE
                </div>

              </div>

              <div className="battery-info">

                <div>

                  <span>
                    Power
                  </span>

                  <strong>
                    {simulation.batteryPower >= 0
                      ? "+"
                      : ""}
                    {simulation.batteryPower.toFixed(
                      1
                    )}{" "}
                    kW
                  </strong>

                </div>

                <div>

                  <span>
                    Capacity
                  </span>

                  <strong>
                    500 kWh
                  </strong>

                </div>

                <div>

                  <span>
                    Operating Range
                  </span>

                  <strong>
                    20–95%
                  </strong>

                </div>

                <div>

                  <span>
                    Status
                  </span>

                  <strong className="green-text">
                    {simulation.batterySoc > 30
                      ? "HEALTHY"
                      : "LOW SOC"}
                  </strong>

                </div>

              </div>

            </div>

          </div>

          {/* FORECAST */}

          <div className="panel forecast-panel">

            <PanelHeader
              title="AI Load Forecast"
              subtitle="Next 6 hours"
            />

            <div className="mini-forecast">

              {forecast.map((point) => (
                <div
                  className="forecast-column"
                  key={point.label}
                >

                  <div className="forecast-value">
                    {point.load.toFixed(0)}
                  </div>

                  <div className="forecast-bar-wrapper">

                    <div
                      className="forecast-bar"
                      style={{
                        height: `${Math.min(
                          point.load * 1.2,
                          100
                        )}%`,
                      }}
                    />

                  </div>

                  <div className="forecast-label">
                    {point.label}
                  </div>

                </div>
              ))}

            </div>

          </div>

          {/* DIESEL */}

          <div className="panel">

            <PanelHeader
              title="Diesel & Fuel"
              subtitle="Generator optimization"
            />

            <div className="diesel-main">

              <div className="diesel-number">

                {simulation.dieselOutput.toFixed(1)}

                <span>
                  {" "}kW
                </span>

              </div>

              <div className="diesel-status">

                {simulation.dieselOutput > 0
                  ? "GENERATOR ACTIVE"
                  : "GENERATOR STANDBY"}

              </div>

            </div>

            <div className="fuel-row">

              <span>
                Fuel consumption
              </span>

              <strong>
                {simulation.fuelRate.toFixed(1)} L/h
              </strong>

            </div>

            <div className="fuel-row">

              <span>
                Fuel tank
              </span>

              <strong>
                {simulation.fuelRemaining.toFixed(0)} L
              </strong>

            </div>

            <div className="fuel-progress">

              <div
                style={{
                  width: `${Math.min(
                    simulation.fuelRemaining / 10,
                    100
                  )}%`,
                }}
              />

            </div>

          </div>

          {/* COMPONENT STATUS */}

          <div className="panel">

            <PanelHeader
              title="Component Status"
              subtitle="Station infrastructure"
            />

            <StatusRow
              name="Solar Array"
              status="ONLINE"
            />

            <StatusRow
              name="Wind Turbine"
              status="ONLINE"
            />

            <StatusRow
              name="Battery System"
              status={
                simulation.batterySoc < 30
                  ? "WARNING"
                  : "ONLINE"
              }
            />

            <StatusRow
              name="Diesel Generator"
              status={
                simulation.dieselOutput > 0
                  ? "ACTIVE"
                  : "STANDBY"
              }
            />

            <StatusRow
              name="Critical Loads"
              status="PROTECTED"
            />

            <StatusRow
              name="Energy Controller"
              status="ONLINE"
            />

          </div>

          {/* AI ADVISOR */}

          <div className="panel advisor-panel">

            <PanelHeader
              title="AI Energy Advisor"
              subtitle="Automated operational recommendation"
            />

            <div className="advisor-message">

              <div className="advisor-icon">
                ✦
              </div>

              <div>

                <h3>
                  {simulation.batterySoc > 70
                    ? "Renewable energy conditions are favorable"
                    : simulation.batterySoc > 35
                    ? "Battery reserve is within operating range"
                    : "Battery reserve requires protection"}
                </h3>

                <p>
                  {simulation.renewableGeneration >
                  simulation.currentLoad
                    ? "Renewable generation currently exceeds station demand. Prioritize battery charging and keep the diesel generator in standby."
                    : simulation.batterySoc > 40
                    ? "Use available battery energy to reduce diesel generator dependency while maintaining reserve for critical loads."
                    : "Reduce flexible loads and preserve battery capacity for critical station operations."}
                </p>

              </div>

            </div>

            <div className="recommendation-list">

              <Recommendation text="Maintain battery reserve above 30%" />

              <Recommendation text="Prioritize renewable generation" />

              <Recommendation text="Protect critical laboratory loads" />

              <Recommendation text="Minimize unnecessary diesel operation" />

            </div>

          </div>

        </section>

        {/* ===================================================
            ALERT
            =================================================== */}

        {simulation.alert && (
          <section
            className={`system-alert ${statusClass}`}
          >

            <div className="alert-icon">
              !
            </div>

            <div>

              <strong>
                {simulation.systemStatus}
              </strong>

              <p>
                {simulation.alert}
              </p>

            </div>

          </section>
        )}

        {/* ===================================================
            DEMO NOTICE
            =================================================== */}

        <section className="demo-notice">

          <div className="demo-notice-icon">
            ◈
          </div>

          <div>

            <strong>
              SIMULATION / DEMO DATA
            </strong>

            <p>
              POLARGRID currently operates entirely
              in frontend simulation mode. Weather,
              energy, battery, load and generator
              values are synthetically generated for
              demonstration purposes. No live NCPOR
              or station telemetry is connected.
            </p>

          </div>

        </section>

      </main>

      <Navigation
        activePage={activePage}
        setActivePage={setActivePage}
      />

    </div>
  );
}

/*
 * =========================================================
 * HEADER
 * =========================================================
 */

type HeaderProps = {
  simulation: SimulationData;
  running: boolean;
  speed: number;
  setRunning: Dispatch<SetStateAction<boolean>>;
  setSpeed: Dispatch<SetStateAction<number>>;
  resetSimulation: () => void;
  statusClass: string;
};

function Header({
  simulation,
  running,
  speed,
  setRunning,
  setSpeed,
  resetSimulation,
  statusClass,
}: HeaderProps) {
  return (
    <header className="topbar">

      <div className="brand-area">

        <div className="brand">
          POLARGRID
        </div>

        <div className="brand-subtitle">
          SMART ENERGY MANAGEMENT
        </div>

      </div>

      <div className="station-info">

        <span className="station-name">
          BHARATI RESEARCH STATION
        </span>

        <span className="location-dot"></span>

        <span>
          ANTARCTICA
        </span>

      </div>

      <div className="header-controls">

        <div
          className={`system-status ${statusClass}`}
        >

          <span className="status-dot"></span>

          {simulation.systemStatus}

        </div>

        <button
          className="control-button"
          onClick={() =>
            setRunning((value) => !value)
          }
        >
          {running
            ? "❚❚ Pause"
            : "▶ Start"}
        </button>

        <div className="speed-controls">

          {[1, 2, 5].map((value) => (
            <button
              key={value}
              className={
                speed === value
                  ? "speed-button active"
                  : "speed-button"
              }
              onClick={() =>
                setSpeed(value)
              }
            >
              {value}x
            </button>
          ))}

        </div>

        <button
          className="control-button reset"
          onClick={resetSimulation}
        >
          ↻ Reset
        </button>

      </div>

    </header>
  );
}

/*
 * =========================================================
 * METRIC CARD
 * =========================================================
 */

type MetricCardProps = {
  title: string;
  value: string;
  subtitle: string;
  icon: string;
  className?: string;
};

function MetricCard({
  title,
  value,
  subtitle,
  icon,
  className = "",
}: MetricCardProps) {
  return (
    <div
      className={`metric-card ${className}`}
    >

      <div className="metric-top">

        <span className="metric-title">
          {title}
        </span>

        <span className="metric-icon">
          {icon}
        </span>

      </div>

      <div className="metric-value">
        {value}
      </div>

      <div className="metric-subtitle">
        {subtitle}
      </div>

    </div>
  );
}

/*
 * =========================================================
 * PANEL HEADER
 * =========================================================
 */

function PanelHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <div className="panel-header">

      <div>

        <h2>
          {title}
        </h2>

        <p>
          {subtitle}
        </p>

      </div>

      <div className="panel-live">

        <span></span>

        LIVE

      </div>

    </div>
  );
}

/*
 * =========================================================
 * ENERGY NODE
 * =========================================================
 */

function EnergyNode({
  icon,
  label,
  value,
  color,
}: {
  icon: string;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div
      className={`energy-node ${color}`}
    >

      <div className="energy-node-icon">
        {icon}
      </div>

      <div className="energy-node-label">
        {label}
      </div>

      <div className="energy-node-value">
        {value}
      </div>

    </div>
  );
}

/*
 * =========================================================
 * WEATHER ITEM
 * =========================================================
 */

function WeatherItem({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <div className="weather-item">

      <div className="weather-icon">
        {icon}
      </div>

      <div>

        <span>
          {label}
        </span>

        <strong>
          {value}
        </strong>

      </div>

    </div>
  );
}

/*
 * =========================================================
 * LOAD BAR
 * =========================================================
 */

function LoadBar({
  label,
  value,
  total,
}: {
  label: string;
  value: number;
  total: number;
}) {
  const percentage =
    total > 0
      ? (value / total) * 100
      : 0;

  return (
    <div className="load-item">

      <div className="load-header">

        <span>
          {label}
        </span>

        <strong>
          {value.toFixed(1)} kW
        </strong>

      </div>

      <div className="load-track">

        <div
          className="load-fill"
          style={{
            width: `${percentage}%`,
          }}
        />

      </div>

    </div>
  );
}

/*
 * =========================================================
 * STATUS ROW
 * =========================================================
 */

function StatusRow({
  name,
  status,
}: {
  name: string;
  status: string;
}) {
  const positive =
    status === "ONLINE" ||
    status === "ACTIVE" ||
    status === "PROTECTED";

  const warning =
    status === "WARNING";

  return (
    <div className="status-row">

      <span>
        {name}
      </span>

      <span
        className={`component-status ${
          positive
            ? "positive"
            : warning
            ? "warning"
            : "standby"
        }`}
      >

        <span></span>

        {status}

      </span>

    </div>
  );
}

/*
 * =========================================================
 * RECOMMENDATION
 * =========================================================
 */

function Recommendation({
  text,
}: {
  text: string;
}) {
  return (
    <div className="recommendation">

      <span>
        ✓
      </span>

      <p>
        {text}
      </p>

    </div>
  );
}

/*
 * =========================================================
 * NAVIGATION
 * =========================================================
 */

type NavigationProps = {
  activePage: Page;
  setActivePage: Dispatch<
    SetStateAction<Page>
  >;
};

function Navigation({
  activePage,
  setActivePage,
}: NavigationProps) {
  const items: {
    id: Page;
    label: string;
    icon: string;
  }[] = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: "⌂",
    },
    {
      id: "forecasting",
      label: "Forecasting",
      icon: "⌁",
    },
    {
      id: "optimization",
      label: "Optimization",
      icon: "◈",
    },
    {
      id: "digital-twin",
      label: "Digital Twin",
      icon: "◉",
    },
    {
      id: "emergency",
      label: "Emergency",
      icon: "!",
    },
    {
      id: "analytics",
      label: "Analytics",
      icon: "▥",
    },
    {
      id: "settings",
      label: "Settings",
      icon: "⚙",
    },
  ];

  return (
    <nav className="bottom-navigation">

      {items.map((item) => (
        <button
          key={item.id}
          className={
            activePage === item.id
              ? "nav-item active"
              : "nav-item"
          }
          onClick={() =>
            setActivePage(item.id)
          }
        >

          <span className="nav-icon">
            {item.icon}
          </span>

          <span>
            {item.label}
          </span>

        </button>
      ))}

    </nav>
  );
}

export default App;