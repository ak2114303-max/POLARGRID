import { useEffect, useState } from "react";

type SettingsProps = {
  speed: number;
  setSpeed: (speed: number) => void;
  onResetSimulation: () => void;
};

type Station = "BHARATI" | "MAITRI";
type SystemMode = "DEMO" | "SIMULATION";

type SavedSettings = {
  station: Station;
  systemMode: SystemMode;
  speed: number;
  batteryCapacity: number;
  minSoc: number;
  maxSoc: number;
  criticalLoadProtection: boolean;
  alertsEnabled: boolean;
  autoOptimization: boolean;
};

const DEFAULT_SETTINGS: SavedSettings = {
  station: "BHARATI",
  systemMode: "SIMULATION",
  speed: 1,
  batteryCapacity: 500,
  minSoc: 20,
  maxSoc: 95,
  criticalLoadProtection: true,
  alertsEnabled: true,
  autoOptimization: true,
};

function Settings({
  speed,
  setSpeed,
  onResetSimulation,
}: SettingsProps) {
  const [station, setStation] = useState<Station>("BHARATI");
  const [systemMode, setSystemMode] = useState<SystemMode>("SIMULATION");

  const [batteryCapacity, setBatteryCapacity] = useState(500);
  const [minSoc, setMinSoc] = useState(20);
  const [maxSoc, setMaxSoc] = useState(95);

  const [criticalLoadProtection, setCriticalLoadProtection] =
    useState(true);

  const [alertsEnabled, setAlertsEnabled] = useState(true);

  const [autoOptimization, setAutoOptimization] =
    useState(true);

  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("polargrid-settings");

    if (!stored) return;

    try {
      const parsed: SavedSettings = JSON.parse(stored);

      setStation(parsed.station ?? DEFAULT_SETTINGS.station);
      setSystemMode(
        parsed.systemMode ?? DEFAULT_SETTINGS.systemMode
      );
      setBatteryCapacity(
        parsed.batteryCapacity ?? DEFAULT_SETTINGS.batteryCapacity
      );
      setMinSoc(parsed.minSoc ?? DEFAULT_SETTINGS.minSoc);
      setMaxSoc(parsed.maxSoc ?? DEFAULT_SETTINGS.maxSoc);

      setCriticalLoadProtection(
        parsed.criticalLoadProtection ??
          DEFAULT_SETTINGS.criticalLoadProtection
      );

      setAlertsEnabled(
        parsed.alertsEnabled ?? DEFAULT_SETTINGS.alertsEnabled
      );

      setAutoOptimization(
        parsed.autoOptimization ??
          DEFAULT_SETTINGS.autoOptimization
      );
    } catch {
      console.warn("Invalid POLARGRID settings found.");
    }
  }, []);

  const saveSettings = () => {
    const settings: SavedSettings = {
      station,
      systemMode,
      speed,
      batteryCapacity,
      minSoc,
      maxSoc,
      criticalLoadProtection,
      alertsEnabled,
      autoOptimization,
    };

    localStorage.setItem(
      "polargrid-settings",
      JSON.stringify(settings)
    );

    setSaved(true);

    window.setTimeout(() => {
      setSaved(false);
    }, 2500);
  };

  const resetSettings = () => {
    setStation(DEFAULT_SETTINGS.station);
    setSystemMode(DEFAULT_SETTINGS.systemMode);
    setSpeed(DEFAULT_SETTINGS.speed);
    setBatteryCapacity(DEFAULT_SETTINGS.batteryCapacity);
    setMinSoc(DEFAULT_SETTINGS.minSoc);
    setMaxSoc(DEFAULT_SETTINGS.maxSoc);
    setCriticalLoadProtection(
      DEFAULT_SETTINGS.criticalLoadProtection
    );
    setAlertsEnabled(DEFAULT_SETTINGS.alertsEnabled);
    setAutoOptimization(DEFAULT_SETTINGS.autoOptimization);

    localStorage.removeItem("polargrid-settings");

    setSaved(false);
  };

  const handleMinSocChange = (value: number) => {
    setMinSoc(Math.min(value, maxSoc - 5));
  };

  const handleMaxSocChange = (value: number) => {
    setMaxSoc(Math.max(value, minSoc + 5));
  };

  return (
    <div className="settings-page">

      {/* HEADER */}
      <div className="settings-page-header">
        <div>
          <div className="settings-eyebrow">
            SYSTEM CONFIGURATION
          </div>

          <h1>Settings</h1>

          <p>
            Configure POLARGRID simulation, energy storage,
            protection and control parameters.
          </p>
        </div>

        <div className="settings-status">
          <span className="settings-status-dot" />
          SYSTEM CONFIGURATION
        </div>
      </div>

      {/* SYSTEM CONFIGURATION */}
      <section className="settings-section">

        <div className="settings-section-header">
          <div>
            <h2>System Configuration</h2>
            <p>
              Configure the simulated research station and
              operating environment.
            </p>
          </div>

          <span className="settings-section-number">
            01
          </span>
        </div>

        <div className="settings-grid">

          <div className="settings-card">

            <div className="settings-card-icon">
              🛰️
            </div>

            <div className="settings-card-content">

              <h3>Research Station</h3>

              <p>
                Select the polar station represented by the
                digital simulation.
              </p>

              <select
                className="settings-select"
                value={station}
                onChange={(event) =>
                  setStation(event.target.value as Station)
                }
              >
                <option value="BHARATI">
                  BHARATI RESEARCH STATION
                </option>

                <option value="MAITRI">
                  MAITRI RESEARCH STATION
                </option>
              </select>

            </div>
          </div>

          <div className="settings-card">

            <div className="settings-card-icon">
              🧪
            </div>

            <div className="settings-card-content">

              <h3>Operating Mode</h3>

              <p>
                Select how the POLARGRID frontend generates
                operational data.
              </p>

              <div className="settings-mode-buttons">

                <button
                  className={
                    systemMode === "DEMO"
                      ? "settings-mode active"
                      : "settings-mode"
                  }
                  onClick={() => setSystemMode("DEMO")}
                >
                  <strong>DEMO</strong>
                  <span>Presentation mode</span>
                </button>

                <button
                  className={
                    systemMode === "SIMULATION"
                      ? "settings-mode active"
                      : "settings-mode"
                  }
                  onClick={() =>
                    setSystemMode("SIMULATION")
                  }
                >
                  <strong>SIMULATION</strong>
                  <span>Live local simulation</span>
                </button>

              </div>

            </div>
          </div>

        </div>
      </section>

      {/* SIMULATION */}
      <section className="settings-section">

        <div className="settings-section-header">
          <div>
            <h2>Simulation Controls</h2>
            <p>
              Control the speed and behavior of the local
              POLARGRID simulation.
            </p>
          </div>

          <span className="settings-section-number">
            02
          </span>
        </div>

        <div className="settings-control-card">

          <div className="settings-control-row">

            <div>
              <h3>Simulation Speed</h3>
              <p>
                Controls how quickly simulated energy data
                advances.
              </p>
            </div>

            <div className="settings-speed-options">

              {[0.5, 1, 2, 4].map((value) => (
                <button
                  key={value}
                  className={
                    speed === value
                      ? "settings-speed active"
                      : "settings-speed"
                  }
                  onClick={() => setSpeed(value)}
                >
                  {value}×
                </button>
              ))}

            </div>

          </div>

          <div className="settings-slider-row">

            <div className="settings-slider-heading">

              <span>Simulation rate</span>

              <strong>{speed}×</strong>

            </div>

            <input
              type="range"
              min="0.5"
              max="4"
              step="0.5"
              value={speed}
              onChange={(event) =>
                setSpeed(Number(event.target.value))
              }
            />

            <div className="settings-slider-labels">
              <span>0.5×</span>
              <span>Normal</span>
              <span>4×</span>
            </div>

          </div>

        </div>
      </section>

      {/* BATTERY */}
      <section className="settings-section">

        <div className="settings-section-header">
          <div>
            <h2>Battery Management</h2>
            <p>
              Configure the simulated energy storage operating
              envelope.
            </p>
          </div>

          <span className="settings-section-number">
            03
          </span>
        </div>

        <div className="settings-grid">

          <div className="settings-input-card">

            <div className="settings-input-title">
              <span>Battery Capacity</span>
              <strong>{batteryCapacity} kWh</strong>
            </div>

            <input
              type="range"
              min="100"
              max="1000"
              step="50"
              value={batteryCapacity}
              onChange={(event) =>
                setBatteryCapacity(
                  Number(event.target.value)
                )
              }
            />

            <div className="settings-slider-labels">
              <span>100 kWh</span>
              <span>1000 kWh</span>
            </div>

          </div>

          <div className="settings-input-card">

            <div className="settings-input-title">
              <span>Minimum SOC</span>
              <strong>{minSoc}%</strong>
            </div>

            <input
              type="range"
              min="5"
              max="60"
              step="5"
              value={minSoc}
              onChange={(event) =>
                handleMinSocChange(
                  Number(event.target.value)
                )
              }
            />

            <div className="settings-slider-labels">
              <span>5%</span>
              <span>60%</span>
            </div>

          </div>

          <div className="settings-input-card">

            <div className="settings-input-title">
              <span>Maximum SOC</span>
              <strong>{maxSoc}%</strong>
            </div>

            <input
              type="range"
              min="50"
              max="100"
              step="5"
              value={maxSoc}
              onChange={(event) =>
                handleMaxSocChange(
                  Number(event.target.value)
                )
              }
            />

            <div className="settings-slider-labels">
              <span>50%</span>
              <span>100%</span>
            </div>

          </div>

        </div>

        <div className="settings-battery-summary">

          <div>
            <span>Operating Window</span>
            <strong>
              {minSoc}% — {maxSoc}%
            </strong>
          </div>

          <div>
            <span>Available Capacity</span>
            <strong>
              {Math.round(
                batteryCapacity *
                  ((maxSoc - minSoc) / 100)
              )} kWh
            </strong>
          </div>

          <div>
            <span>Protection Margin</span>
            <strong>
              {minSoc}% minimum reserve
            </strong>
          </div>

        </div>
      </section>

      {/* PROTECTION */}
      <section className="settings-section">

        <div className="settings-section-header">
          <div>
            <h2>Protection & Automation</h2>
            <p>
              Configure automated energy-management behavior.
            </p>
          </div>

          <span className="settings-section-number">
            04
          </span>
        </div>

        <div className="settings-toggle-list">

          <div className="settings-toggle-row">

            <div className="settings-toggle-info">

              <div className="settings-toggle-icon">
                🛡️
              </div>

              <div>
                <h3>Critical Load Protection</h3>

                <p>
                  Preserve power for laboratories,
                  communications and essential station systems
                  during shortages.
                </p>
              </div>

            </div>

            <button
              className={
                criticalLoadProtection
                  ? "settings-toggle active"
                  : "settings-toggle"
              }
              onClick={() =>
                setCriticalLoadProtection(
                  !criticalLoadProtection
                )
              }
              aria-label="Toggle critical load protection"
            >
              <span />
            </button>

          </div>

          <div className="settings-toggle-row">

            <div className="settings-toggle-info">

              <div className="settings-toggle-icon">
                🔔
              </div>

              <div>
                <h3>System Alerts</h3>

                <p>
                  Enable simulated warnings for low battery,
                  high demand and generator operation.
                </p>
              </div>

            </div>

            <button
              className={
                alertsEnabled
                  ? "settings-toggle active"
                  : "settings-toggle"
              }
              onClick={() =>
                setAlertsEnabled(!alertsEnabled)
              }
              aria-label="Toggle system alerts"
            >
              <span />
            </button>

          </div>

          <div className="settings-toggle-row">

            <div className="settings-toggle-info">

              <div className="settings-toggle-icon">
                ⚡
              </div>

              <div>
                <h3>Automatic Energy Optimization</h3>

                <p>
                  Allow the frontend optimization model to
                  continuously calculate battery and generator
                  dispatch.
                </p>
              </div>

            </div>

            <button
              className={
                autoOptimization
                  ? "settings-toggle active"
                  : "settings-toggle"
              }
              onClick={() =>
                setAutoOptimization(!autoOptimization)
              }
              aria-label="Toggle automatic energy optimization"
            >
              <span />
            </button>

          </div>

        </div>
      </section>

      {/* CURRENT CONFIGURATION */}
      <section className="settings-section">

        <div className="settings-section-header">
          <div>
            <h2>Current Configuration</h2>
            <p>
              Review the active POLARGRID operating profile.
            </p>
          </div>

          <span className="settings-section-number">
            05
          </span>
        </div>

        <div className="settings-summary-grid">

          <div className="settings-summary-item">
            <span>Station</span>
            <strong>
              {station === "BHARATI"
                ? "BHARATI"
                : "MAITRI"}
            </strong>
          </div>

          <div className="settings-summary-item">
            <span>Mode</span>
            <strong>{systemMode}</strong>
          </div>

          <div className="settings-summary-item">
            <span>Battery</span>
            <strong>{batteryCapacity} kWh</strong>
          </div>

          <div className="settings-summary-item">
            <span>SOC Range</span>
            <strong>
              {minSoc}% — {maxSoc}%
            </strong>
          </div>

          <div className="settings-summary-item">
            <span>Critical Protection</span>
            <strong>
              {criticalLoadProtection
                ? "ENABLED"
                : "DISABLED"}
            </strong>
          </div>

          <div className="settings-summary-item">
            <span>Optimization</span>
            <strong>
              {autoOptimization
                ? "AUTOMATIC"
                : "MANUAL"}
            </strong>
          </div>

        </div>
      </section>

      {/* ACTIONS */}
      <section className="settings-actions">

        <button
          className="settings-reset-button"
          onClick={resetSettings}
        >
          Reset Settings
        </button>

        <button
          className="settings-reset-simulation"
          onClick={onResetSimulation}
        >
          Reset Simulation
        </button>

        <button
          className="settings-save-button"
          onClick={saveSettings}
        >
          {saved ? "✓ Settings Saved" : "Save Configuration"}
        </button>

      </section>

      {/* DEMO NOTICE */}
      <div className="settings-demo-notice">

        <div className="settings-demo-icon">
          ℹ
        </div>

        <div>
          <strong>LOCAL SIMULATION CONFIGURATION</strong>

          <p>
            These settings control the POLARGRID frontend
            demonstration. No live NCPOR, station telemetry,
            IoT hardware or external energy-management system
            is connected.
          </p>
        </div>

      </div>

      {/* ABOUT */}
      <section className="settings-about">

        <div className="settings-about-brand">
          <div className="settings-about-logo">
            PG
          </div>

          <div>
            <h2>POLARGRID</h2>
            <span>
              AI-Powered Smart Energy Management
            </span>
          </div>
        </div>

        <div className="settings-about-details">

          <div>
            <span>Platform</span>
            <strong>Frontend Demonstrator</strong>
          </div>

          <div>
            <span>Data Mode</span>
            <strong>Synthetic / Simulated</strong>
          </div>

          <div>
            <span>Architecture</span>
            <strong>React + TypeScript</strong>
          </div>

        </div>

      </section>

    </div>
  );
}

export default Settings;