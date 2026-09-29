import { useMemo } from "react";
import type { SimulationData } from "../simulation";

type AnalyticsProps = {
  simulation: SimulationData;
};

type HourPoint = {
  hour: string;
  load: number;
  renewable: number;
  solar: number;
  wind: number;
  battery: number;
  diesel: number;
  fuel: number;
};

function Analytics({ simulation }: AnalyticsProps) {
  /*
   * ---------------------------------------------------------
   * LOCAL 24-HOUR ANALYTICS MODEL
   * ---------------------------------------------------------
   *
   * Everything here is generated in the browser.
   * No backend or external API is required.
   */

  const history = useMemo<HourPoint[]>(() => {
    const points: HourPoint[] = [];

    const currentHour = new Date().getHours();

    for (let i = 0; i < 24; i++) {
      const hourIndex =
        (currentHour - 23 + i + 24) % 24;

      const hour = `${String(hourIndex).padStart(
        2,
        "0"
      )}:00`;

      /*
       * Daily operating pattern
       */

      const morningPeak =
        Math.exp(
          -Math.pow((hourIndex - 8) / 3, 2)
        );

      const eveningPeak =
        Math.exp(
          -Math.pow((hourIndex - 19) / 3.5, 2)
        );

      const nightReduction =
        hourIndex >= 0 &&
        hourIndex < 5
          ? 10
          : 0;

      const loadVariation =
        morningPeak * 10 +
        eveningPeak * 15 -
        nightReduction;

      const wave =
        Math.sin(i * 0.75) * 3.2;

      const load = Math.max(
        35,
        simulation.currentLoad +
          loadVariation +
          wave -
          10
      );

      /*
       * Solar generation
       */

      const solarFactor =
        hourIndex >= 6 &&
        hourIndex <= 18
          ? Math.sin(
              ((hourIndex - 6) / 12) *
                Math.PI
            )
          : 0;

      const solar = Math.max(
        0,
        simulation.solarGeneration *
          (0.35 + solarFactor * 0.75)
      );

      /*
       * Wind generation
       */

      const windVariation =
        0.8 +
        Math.sin(i * 0.55 + 1.4) * 0.18;

      const wind = Math.max(
        4,
        simulation.windGeneration *
          windVariation
      );

      const renewable =
        solar + wind;

      /*
       * Battery profile
       */

      const batteryWave =
        Math.sin(
          ((hourIndex - 5) / 24) *
            Math.PI *
            2
        );

      const battery = Math.min(
        95,
        Math.max(
          25,
          simulation.batterySoc +
            batteryWave * 12
        )
      );

      /*
       * Diesel fills remaining demand.
       */

      const deficit =
        Math.max(
          load - renewable,
          0
        );

      const batterySupport =
        battery > 35
          ? Math.min(
              deficit * 0.45,
              18
            )
          : 0;

      const diesel = Math.max(
        0,
        deficit - batterySupport
      );

      const fuel =
        diesel > 0
          ? 2.8 + diesel * 0.14
          : 0;

      points.push({
        hour,
        load,
        renewable,
        solar,
        wind,
        battery,
        diesel,
        fuel,
      });
    }

    /*
     * Keep the final point aligned with
     * the actual live simulation.
     */

    if (points.length > 0) {
      points[points.length - 1] = {
        ...points[points.length - 1],
        load: simulation.currentLoad,
        renewable:
          simulation.renewableGeneration,
        solar:
          simulation.solarGeneration,
        wind:
          simulation.windGeneration,
        battery:
          simulation.batterySoc,
        diesel:
          simulation.dieselOutput,
        fuel:
          simulation.fuelRate,
      };
    }

    return points;
  }, [simulation]);

  /*
   * ---------------------------------------------------------
   * ANALYTICS
   * ---------------------------------------------------------
   */

  const analytics = useMemo(() => {
    const totalLoad = history.reduce(
      (sum, point) => sum + point.load,
      0
    );

    const totalRenewable = history.reduce(
      (sum, point) =>
        sum + point.renewable,
      0
    );

    const averageLoad =
      history.length > 0
        ? totalLoad / history.length
        : 0;

    const averageRenewable =
      history.length > 0
        ? totalRenewable /
          history.length
        : 0;

    const peakLoad =
      history.length > 0
        ? Math.max(
            ...history.map(
              (point) => point.load
            )
          )
        : 0;

    const minimumLoad =
      history.length > 0
        ? Math.min(
            ...history.map(
              (point) => point.load
            )
          )
        : 0;

    const averageBattery =
      history.length > 0
        ? history.reduce(
            (sum, point) =>
              sum + point.battery,
            0
          ) / history.length
        : 0;

    const averageDiesel =
      history.length > 0
        ? history.reduce(
            (sum, point) =>
              sum + point.diesel,
            0
          ) / history.length
        : 0;

    const totalFuel =
      history.reduce(
        (sum, point) =>
          sum + point.fuel,
        0
      );

    const renewableShare =
      totalLoad > 0
        ? (totalRenewable /
            totalLoad) *
          100
        : 0;

    /*
     * Synthetic baseline used to demonstrate
     * the effect of renewable-first dispatch.
     */

    const baselineFuel =
      totalFuel * 1.28;

    const fuelSaved = Math.max(
      baselineFuel - totalFuel,
      0
    );

    const fuelSavingPercent =
      baselineFuel > 0
        ? (fuelSaved /
            baselineFuel) *
          100
        : 0;

    /*
     * Approximate carbon-equivalent reduction
     * for demonstration purposes.
     */

    const carbonAvoided =
      fuelSaved * 2.68;

    return {
      totalLoad,
      totalRenewable,
      averageLoad,
      averageRenewable,
      peakLoad,
      minimumLoad,
      averageBattery,
      averageDiesel,
      totalFuel,
      renewableShare,
      fuelSaved,
      fuelSavingPercent,
      carbonAvoided,
    };
  }, [history]);

  /*
   * ---------------------------------------------------------
   * ENERGY MIX
   * ---------------------------------------------------------
   */

  const energyMix = useMemo(() => {
    const solar = history.reduce(
      (sum, point) =>
        sum + point.solar,
      0
    );

    const wind = history.reduce(
      (sum, point) =>
        sum + point.wind,
      0
    );

    const diesel = history.reduce(
      (sum, point) =>
        sum + point.diesel,
      0
    );

    const battery =
      history.reduce(
        (sum, point) => {
          const support =
            Math.max(
              point.load -
                point.renewable -
                point.diesel,
              0
            );

          return sum + support;
        },
        0
      );

    const total =
      solar +
      wind +
      diesel +
      battery;

    return {
      solar,
      wind,
      diesel,
      battery,
      total,
    };
  }, [history]);

  /*
   * ---------------------------------------------------------
   * LOAD COMPOSITION
   * ---------------------------------------------------------
   */

  const loadComposition = useMemo(() => {
    const total =
      simulation.currentLoad;

    const heating =
      total * 0.38;

    const laboratory =
      total * 0.22;

    const communication =
      total * 0.11;

    const lighting =
      total * 0.09;

    const water =
      total * 0.08;

    const other =
      Math.max(
        total -
          heating -
          laboratory -
          communication -
          lighting -
          water,
        0
      );

    return [
      {
        name: "Heating",
        value: heating,
        className: "heating",
      },
      {
        name: "Laboratory",
        value: laboratory,
        className: "laboratory",
      },
      {
        name: "Communication",
        value: communication,
        className: "communication",
      },
      {
        name: "Lighting",
        value: lighting,
        className: "lighting",
      },
      {
        name: "Water Systems",
        value: water,
        className: "water",
      },
      {
        name: "Other Loads",
        value: other,
        className: "other",
      },
    ];
  }, [simulation.currentLoad]);

  return (
    <div className="module-page analytics-page">

      {/* =====================================================
          HEADER
          ===================================================== */}

      <section className="module-header">

        <div>
          <div className="eyebrow">
            ENERGY PERFORMANCE & ANALYTICS
          </div>

          <h1>
            SYSTEM ANALYTICS
          </h1>

          <p>
            Historical energy performance,
            renewable utilization, battery behavior
            and fuel-efficiency analysis.
          </p>
        </div>

        <div className="analytics-live-status">
          <span></span>
          ANALYTICS ACTIVE
        </div>

      </section>

      {/* =====================================================
          KPI SUMMARY
          ===================================================== */}

      <section className="analytics-kpi-grid">

        <AnalyticsKpi
          title="Average Load"
          value={`${analytics.averageLoad.toFixed(
            1
          )} kW`}
          subtitle="24-hour average"
          icon="⚡"
          type="load"
        />

        <AnalyticsKpi
          title="Peak Demand"
          value={`${analytics.peakLoad.toFixed(
            1
          )} kW`}
          subtitle="Maximum simulated load"
          icon="↗"
          type="peak"
        />

        <AnalyticsKpi
          title="Renewable Share"
          value={`${analytics.renewableShare.toFixed(
            0
          )}%`}
          subtitle="Solar + wind contribution"
          icon="☀"
          type="renewable"
        />

        <AnalyticsKpi
          title="Average Battery"
          value={`${analytics.averageBattery.toFixed(
            0
          )}%`}
          subtitle="24-hour SOC average"
          icon="🔋"
          type="battery"
        />

        <AnalyticsKpi
          title="Diesel Average"
          value={`${analytics.averageDiesel.toFixed(
            1
          )} kW`}
          subtitle="Backup generation"
          icon="⛽"
          type="diesel"
        />

        <AnalyticsKpi
          title="Fuel Saved"
          value={`${analytics.fuelSaved.toFixed(
            1
          )} L`}
          subtitle={`${analytics.fuelSavingPercent.toFixed(
            0
          )}% vs baseline`}
          icon="↓"
          type="saving"
        />

      </section>

      {/* =====================================================
          24 HOUR LOAD TREND
          ===================================================== */}

      <section className="panel analytics-chart-panel">

        <AnalyticsPanelHeader
          title="24-Hour Energy Performance"
          subtitle="Simulated station demand and renewable generation"
        />

        <div className="analytics-chart">

          <div className="analytics-y-axis">
            <span>120</span>
            <span>90</span>
            <span>60</span>
            <span>30</span>
            <span>0</span>
          </div>

          <div className="analytics-chart-body">

            <div className="analytics-grid-lines">
              <span />
              <span />
              <span />
              <span />
              <span />
            </div>

            <div className="analytics-bars">

              {history.map(
                (point, index) => {
                  const loadHeight =
                    Math.min(
                      (point.load / 120) *
                        100,
                      100
                    );

                  const renewableHeight =
                    Math.min(
                      (point.renewable /
                        120) *
                        100,
                      100
                    );

                  return (
                    <div
                      className="analytics-hour"
                      key={`${point.hour}-${index}`}
                    >

                      <div className="analytics-bar-values">

                        <div
                          className="analytics-load-bar"
                          style={{
                            height: `${loadHeight}%`,
                          }}
                          title={`Load ${point.load.toFixed(
                            1
                          )} kW`}
                        />

                        <div
                          className="analytics-renewable-bar"
                          style={{
                            height: `${renewableHeight}%`,
                          }}
                          title={`Renewable ${point.renewable.toFixed(
                            1
                          )} kW`}
                        />

                      </div>

                      <span>
                        {index % 3 === 0
                          ? point.hour
                          : ""}
                      </span>

                    </div>
                  );
                }
              )}

            </div>

          </div>

        </div>

        <div className="analytics-legend">

          <span>
            <i className="legend-load" />
            Station Load
          </span>

          <span>
            <i className="legend-renewable" />
            Renewable Generation
          </span>

        </div>

      </section>

      {/* =====================================================
          THREE COLUMN ANALYTICS
          ===================================================== */}

      <section className="analytics-three-column">

        {/* ENERGY MIX */}

        <div className="panel">

          <AnalyticsPanelHeader
            title="Energy Mix"
            subtitle="24-hour source contribution"
          />

          <div className="energy-mix-visual">

            <div
              className="energy-mix-ring"
              style={{
                background: `conic-gradient(
                  #f59e0b 0 34%,
                  #0ea5e9 34% 55%,
                  #7c3aed 55% 70%,
                  #ea580c 70% 100%
                )`,
              }}
            >
              <div>
                <strong>
                  {analytics.renewableShare.toFixed(
                    0
                  )}%
                </strong>

                <span>
                  Renewable
                </span>
              </div>
            </div>

          </div>

          <div className="energy-mix-list">

            <MixRow
              label="Solar"
              value={energyMix.solar}
              total={energyMix.total}
              className="solar"
            />

            <MixRow
              label="Wind"
              value={energyMix.wind}
              total={energyMix.total}
              className="wind"
            />

            <MixRow
              label="Battery"
              value={energyMix.battery}
              total={energyMix.total}
              className="battery"
            />

            <MixRow
              label="Diesel"
              value={energyMix.diesel}
              total={energyMix.total}
              className="diesel"
            />

          </div>

        </div>

        {/* BATTERY */}

        <div className="panel">

          <AnalyticsPanelHeader
            title="Battery Performance"
            subtitle="Simulated state of charge"
          />

          <div className="battery-performance">

            <div className="battery-large-value">
              <strong>
                {simulation.batterySoc.toFixed(
                  0
                )}%
              </strong>

              <span>
                Current SOC
              </span>
            </div>

            <div className="battery-progress">

              <div
                className="battery-progress-fill"
                style={{
                  width: `${Math.min(
                    simulation.batterySoc,
                    100
                  )}%`,
                }}
              />

            </div>

            <div className="battery-limits">

              <span>
                Minimum 20%
              </span>

              <span>
                Maximum 95%
              </span>

            </div>

          </div>

          <div className="battery-stat-list">

            <SmallStat
              label="24h Average"
              value={`${analytics.averageBattery.toFixed(
                0
              )}%`}
            />

            <SmallStat
              label="Current Power"
              value={`${Math.abs(
                simulation.batteryPower
              ).toFixed(
                1
              )} kW`}
            />

            <SmallStat
              label="Operating Status"
              value={
                simulation.batterySoc < 30
                  ? "RESERVE"
                  : "AVAILABLE"
              }
            />

          </div>

        </div>

        {/* FUEL */}

        <div className="panel">

          <AnalyticsPanelHeader
            title="Fuel Performance"
            subtitle="Diesel backup analysis"
          />

          <div className="fuel-performance-main">

            <strong>
              {analytics.totalFuel.toFixed(
                1
              )}
            </strong>

            <span>
              L / simulated 24h
            </span>

          </div>

          <div className="fuel-saving-box">

            <div>
              <span>
                Estimated saving
              </span>

              <strong>
                {analytics.fuelSaved.toFixed(
                  1
                )} L
              </strong>
            </div>

            <div className="fuel-saving-percent">
              ↓{" "}
              {analytics.fuelSavingPercent.toFixed(
                0
              )}%
            </div>

          </div>

          <div className="fuel-detail-list">

            <SmallStat
              label="Average Diesel"
              value={`${analytics.averageDiesel.toFixed(
                1
              )} kW`}
            />

            <SmallStat
              label="Current Fuel Rate"
              value={`${simulation.fuelRate.toFixed(
                1
              )} L/h`}
            />

          </div>

        </div>

      </section>

      {/* =====================================================
          LOAD COMPOSITION + PERFORMANCE
          ===================================================== */}

      <section className="analytics-two-column">

        {/* LOAD COMPOSITION */}

        <div className="panel">

          <AnalyticsPanelHeader
            title="Current Load Composition"
            subtitle="Estimated station demand distribution"
          />

          <div className="load-composition">

            {loadComposition.map(
              (item) => (
                <LoadCompositionRow
                  key={item.name}
                  name={item.name}
                  value={item.value}
                  total={simulation.currentLoad}
                  className={
                    item.className
                  }
                />
              )
            )}

          </div>

        </div>

        {/* PERFORMANCE */}

        <div className="panel">

          <AnalyticsPanelHeader
            title="System Performance"
            subtitle="Key operational indicators"
          />

          <div className="performance-table">

            <PerformanceRow
              label="Peak Load"
              value={`${analytics.peakLoad.toFixed(
                1
              )} kW`}
              status="MONITORED"
            />

            <PerformanceRow
              label="Minimum Load"
              value={`${analytics.minimumLoad.toFixed(
                1
              )} kW`}
              status="MONITORED"
            />

            <PerformanceRow
              label="Renewable Utilization"
              value={`${analytics.renewableShare.toFixed(
                0
              )}%`}
              status={
                analytics.renewableShare >=
                50
                  ? "GOOD"
                  : "LOW"
              }
            />

            <PerformanceRow
              label="Battery Reserve"
              value={`${simulation.batterySoc.toFixed(
                0
              )}%`}
              status={
                simulation.batterySoc >=
                40
                  ? "HEALTHY"
                  : "LOW"
              }
            />

            <PerformanceRow
              label="Diesel Dependency"
              value={`${(
                100 -
                analytics.renewableShare
              ).toFixed(0)}%`}
              status={
                analytics.renewableShare >=
                60
                  ? "LOW"
                  : "MODERATE"
              }
            />

          </div>

        </div>

      </section>

      {/* =====================================================
          SUSTAINABILITY
          ===================================================== */}

      <section className="analytics-sustainability">

        <div className="sustainability-icon">
          ♻
        </div>

        <div className="sustainability-content">

          <div>
            <span>
              SUSTAINABILITY PERFORMANCE
            </span>

            <strong>
              Renewable-first energy dispatch
            </strong>
          </div>

          <p>
            The simulated operating strategy
            reduces diesel dependency by
            approximately{" "}
            <strong>
              {analytics.fuelSavingPercent.toFixed(
                0
              )}%
            </strong>{" "}
            compared with the local baseline
            scenario, avoiding an estimated{" "}
            <strong>
              {analytics.carbonAvoided.toFixed(
                1
              )} kg CO₂
            </strong>{" "}
            of emissions.
          </p>

        </div>

        <div className="sustainability-value">

          <strong>
            {analytics.renewableShare.toFixed(
              0
            )}%
          </strong>

          <span>
            renewable
          </span>

        </div>

      </section>

      {/* =====================================================
          DEMO NOTICE
          ===================================================== */}

      <section className="demo-notice">

        <div className="demo-notice-icon">
          ◈
        </div>

        <div>

          <strong>
            ANALYTICS / LOCAL SIMULATION MODE
          </strong>

          <p>
            Analytics values are generated locally
            from synthetic POLARGRID operating data.
            They demonstrate the station performance
            monitoring workflow without backend
            services, live NCPOR telemetry or IoT
            hardware.
          </p>

        </div>

      </section>

    </div>
  );
}


/* =========================================================
   KPI
   ========================================================= */

function AnalyticsKpi({
  title,
  value,
  subtitle,
  icon,
  type,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: string;
  type: string;
}) {
  return (
    <div
      className={`analytics-kpi ${type}`}
    >

      <div className="analytics-kpi-top">

        <span>{title}</span>

        <div>
          {icon}
        </div>

      </div>

      <strong>{value}</strong>

      <small>{subtitle}</small>

    </div>
  );
}


/* =========================================================
   PANEL HEADER
   ========================================================= */

function AnalyticsPanelHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <div className="panel-header">

      <div>

        <h2>{title}</h2>

        <p>{subtitle}</p>

      </div>

      <div className="panel-live">

        <span></span>

        LIVE

      </div>

    </div>
  );
}


/* =========================================================
   ENERGY MIX
   ========================================================= */

function MixRow({
  label,
  value,
  total,
  className,
}: {
  label: string;
  value: number;
  total: number;
  className: string;
}) {
  const percentage =
    total > 0
      ? (value / total) * 100
      : 0;

  return (
    <div className="mix-row">

      <div className="mix-row-header">

        <span>
          <i className={`mix-dot ${className}`} />
          {label}
        </span>

        <strong>
          {percentage.toFixed(0)}%
        </strong>

      </div>

      <div className="mix-track">

        <div
          className={`mix-fill ${className}`}
          style={{
            width: `${Math.min(
              percentage,
              100
            )}%`,
          }}
        />

      </div>

    </div>
  );
}


/* =========================================================
   SMALL STAT
   ========================================================= */

function SmallStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="small-stat">

      <span>{label}</span>

      <strong>{value}</strong>

    </div>
  );
}


/* =========================================================
   LOAD COMPOSITION
   ========================================================= */

function LoadCompositionRow({
  name,
  value,
  total,
  className,
}: {
  name: string;
  value: number;
  total: number;
  className: string;
}) {
  const percentage =
    total > 0
      ? (value / total) * 100
      : 0;

  return (
    <div className="load-composition-row">

      <div className="load-composition-header">

        <span>
          <i
            className={`load-dot ${className}`}
          />

          {name}
        </span>

        <strong>
          {value.toFixed(1)} kW
        </strong>

      </div>

      <div className="load-composition-track">

        <div
          className={`load-composition-fill ${className}`}
          style={{
            width: `${percentage}%`,
          }}
        />

      </div>

    </div>
  );
}


/* =========================================================
   PERFORMANCE ROW
   ========================================================= */

function PerformanceRow({
  label,
  value,
  status,
}: {
  label: string;
  value: string;
  status: string;
}) {
  return (
    <div className="performance-row">

      <span>{label}</span>

      <strong>{value}</strong>

      <em className={status.toLowerCase()}>
        {status}
      </em>

    </div>
  );
}


export default Analytics;