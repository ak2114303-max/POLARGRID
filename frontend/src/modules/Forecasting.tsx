import { useMemo } from "react";
import type {
  ForecastPoint,
  SimulationData,
} from "../simulation";

type ForecastingProps = {
  simulation: SimulationData;
  forecast: ForecastPoint[];
};

function Forecasting({
  simulation,
  forecast,
}: ForecastingProps) {
  const analysis = useMemo(() => {
    const loads = forecast.map(
      (point) => point.load
    );

    const peakLoad =
      loads.length > 0
        ? Math.max(...loads)
        : simulation.currentLoad;

    const minimumLoad =
      loads.length > 0
        ? Math.min(...loads)
        : simulation.currentLoad;

    const averageLoad =
      loads.length > 0
        ? loads.reduce(
            (sum, value) => sum + value,
            0
          ) / loads.length
        : simulation.currentLoad;

    const renewableValues = forecast.map(
      (point) => point.renewable
    );

    const peakRenewable =
      renewableValues.length > 0
        ? Math.max(...renewableValues)
        : simulation.renewableGeneration;

    return {
      peakLoad,
      minimumLoad,
      averageLoad,
      peakRenewable,
    };
  }, [forecast, simulation]);

  const chartMax = useMemo(() => {
    const values = forecast.map(
      (point) => point.load
    );

    return Math.max(
      ...values,
      simulation.currentLoad,
      100
    );
  }, [forecast, simulation.currentLoad]);

  return (
    <div className="module-page">

      {/* HEADER */}

      <section className="module-header">

        <div>
          <div className="eyebrow">
            AI PREDICTIVE ENERGY MANAGEMENT
          </div>

          <h1>LOAD FORECASTING</h1>

          <p>
            Short-term station electricity demand
            forecasting using locally generated
            simulation data.
          </p>
        </div>

        <div className="forecast-live-status">
          <span></span>
          FORECAST ENGINE ACTIVE
        </div>

      </section>

      {/* SUMMARY */}

      <section className="forecast-summary-grid">

        <ForecastSummaryCard
          title="Current Load"
          value={`${simulation.currentLoad.toFixed(
            1
          )} kW`}
          subtitle="Live simulated demand"
          icon="⚡"
        />

        <ForecastSummaryCard
          title="Peak Forecast"
          value={`${analysis.peakLoad.toFixed(
            1
          )} kW`}
          subtitle="Next 6 hours"
          icon="↗"
        />

        <ForecastSummaryCard
          title="Average Forecast"
          value={`${analysis.averageLoad.toFixed(
            1
          )} kW`}
          subtitle="Expected demand"
          icon="≈"
        />

        <ForecastSummaryCard
          title="Minimum Forecast"
          value={`${analysis.minimumLoad.toFixed(
            1
          )} kW`}
          subtitle="Expected minimum"
          icon="↘"
        />

      </section>

      {/* FORECAST CHART */}

      <section className="panel large-forecast-panel">

        <PanelHeader
          title="Energy Demand Forecast"
          subtitle="Short-term predicted electrical demand"
        />

        <div className="forecast-chart">

          <div className="forecast-y-axis">
            <span>
              {chartMax.toFixed(0)}
            </span>

            <span>
              {(chartMax * 0.75).toFixed(0)}
            </span>

            <span>
              {(chartMax * 0.5).toFixed(0)}
            </span>

            <span>
              {(chartMax * 0.25).toFixed(0)}
            </span>

            <span>0</span>
          </div>

          <div className="forecast-chart-area">

            <div className="chart-grid-lines">
              <span></span>
              <span></span>
              <span></span>
              <span></span>
              <span></span>
            </div>

            <div className="forecast-columns">

              {forecast.map(
                (point, index) => {
                  const height =
                    chartMax > 0
                      ? (point.load /
                          chartMax) *
                        100
                      : 0;

                  return (
                    <div
                      className="forecast-chart-column"
                      key={`${point.label}-${index}`}
                    >

                      <div className="chart-value">
                        {point.load.toFixed(0)}
                      </div>

                      <div className="chart-bar-area">

                        <div
                          className="chart-bar"
                          style={{
                            height: `${height}%`,
                          }}
                        />

                      </div>

                      <div className="chart-label">
                        {point.label}
                      </div>

                    </div>
                  );
                }
              )}

            </div>

          </div>

        </div>

      </section>

      {/* MODEL PERFORMANCE */}

      <section className="forecast-two-column">

        <div className="panel">

          <PanelHeader
            title="Forecast Model Performance"
            subtitle="Demonstration model metrics"
          />

          <div className="model-metrics">

            <ModelMetric
              label="MAE"
              value="4.8 kW"
              description="Mean Absolute Error"
            />

            <ModelMetric
              label="RMSE"
              value="6.2 kW"
              description="Root Mean Square Error"
            />

            <ModelMetric
              label="MAPE"
              value="5.7%"
              description="Mean Absolute Percentage Error"
            />

            <ModelMetric
              label="R²"
              value="0.94"
              description="Coefficient of Determination"
            />

          </div>

          <div className="metric-disclaimer">
            <span>ⓘ</span>

            <p>
              These are demonstration configuration
              metrics for the frontend prototype.
            </p>
          </div>

        </div>

        {/* INSIGHTS */}

        <div className="panel">

          <PanelHeader
            title="Forecast Insights"
            subtitle="Automated interpretation"
          />

          <div className="forecast-insights">

            <Insight
              icon="⚡"
              title="Demand Pattern"
              text={
                analysis.peakLoad >
                simulation.currentLoad * 1.15
                  ? "A noticeable increase in station demand is expected."
                  : "Station demand is expected to remain relatively stable."
              }
            />

            <Insight
              icon="☀"
              title="Renewable Outlook"
              text={
                analysis.peakRenewable >
                simulation.currentLoad * 0.7
                  ? "Renewable generation is expected to provide a significant share of station demand."
                  : "Additional battery or generator support may be required."
              }
            />

            <Insight
              icon="🔋"
              title="Battery Planning"
              text={
                simulation.batterySoc > 60
                  ? "Battery reserve currently provides useful operational flexibility."
                  : "Battery reserve should be protected."
              }
            />

          </div>

        </div>

      </section>

      {/* RENEWABLE OUTLOOK */}

      <section className="panel">

        <PanelHeader
          title="Renewable Generation Outlook"
          subtitle="Forecasted solar and wind contribution"
        />

        <div className="renewable-forecast">

          {forecast.map(
            (point, index) => {

              const solarWidth =
                Math.min(
                  (point.solar / 55) *
                    100,
                  100
                );

              const windWidth =
                Math.min(
                  (point.wind / 50) *
                    100,
                  100
                );

              return (
                <div
                  className="renewable-row"
                  key={`${point.label}-${index}`}
                >

                  <div className="renewable-time">
                    {point.label}
                  </div>

                  <div className="renewable-source">

                    <span>
                      ☀ Solar
                    </span>

                    <div className="renewable-track">

                      <div
                        className="renewable-fill solar"
                        style={{
                          width: `${solarWidth}%`,
                        }}
                      />

                    </div>

                    <strong>
                      {point.solar.toFixed(1)} kW
                    </strong>

                  </div>

                  <div className="renewable-source">

                    <span>
                      🌬 Wind
                    </span>

                    <div className="renewable-track">

                      <div
                        className="renewable-fill wind"
                        style={{
                          width: `${windWidth}%`,
                        }}
                      />

                    </div>

                    <strong>
                      {point.wind.toFixed(1)} kW
                    </strong>

                  </div>

                  <div className="renewable-total">
                    {point.renewable.toFixed(1)} kW
                  </div>

                </div>
              );
            }
          )}

        </div>

      </section>

      {/* RECOMMENDATION */}

      <section className="forecast-recommendation">

        <div className="recommendation-symbol">
          ✦
        </div>

        <div>

          <strong>
            Forecasting Recommendation
          </strong>

          <p>
            {analysis.peakLoad >
            simulation.currentLoad * 1.2
              ? "Prepare additional battery and generator reserve because forecast demand may increase significantly."
              : simulation.renewableGeneration >
                simulation.currentLoad
              ? "Current renewable availability is favorable. Prioritize battery charging and reduce diesel operation."
              : "Maintain sufficient battery reserve and use renewable generation before activating diesel backup."}
          </p>

        </div>

      </section>

      {/* DEMO NOTICE */}

      <section className="demo-notice">

        <div className="demo-notice-icon">
          ◈
        </div>

        <div>

          <strong>
            FORECASTING / SIMULATION MODE
          </strong>

          <p>
            Forecast values are generated locally
            inside the POLARGRID frontend. This module
            demonstrates the forecasting and
            decision-support workflow without requiring
            a backend or live station telemetry.
          </p>

        </div>

      </section>

    </div>
  );
}

/* =========================================================
   SUMMARY CARD
   ========================================================= */

function ForecastSummaryCard({
  title,
  value,
  subtitle,
  icon,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: string;
}) {
  return (
    <div className="forecast-summary-card">

      <div className="forecast-summary-top">

        <span>{title}</span>

        <div className="forecast-summary-icon">
          {icon}
        </div>

      </div>

      <strong>{value}</strong>

      <small>{subtitle}</small>

    </div>
  );
}

/* =========================================================
   MODEL METRIC
   ========================================================= */

function ModelMetric({
  label,
  value,
  description,
}: {
  label: string;
  value: string;
  description: string;
}) {
  return (
    <div className="model-metric">

      <div className="model-metric-label">
        {label}
      </div>

      <strong>{value}</strong>

      <span>{description}</span>

    </div>
  );
}

/* =========================================================
   INSIGHT
   ========================================================= */

function Insight({
  icon,
  title,
  text,
}: {
  icon: string;
  title: string;
  text: string;
}) {
  return (
    <div className="forecast-insight">

      <div className="insight-icon">
        {icon}
      </div>

      <div>

        <strong>{title}</strong>

        <p>{text}</p>

      </div>

    </div>
  );
}

/* =========================================================
   PANEL HEADER
   ========================================================= */

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

/*
 * IMPORTANT:
 * App.tsx imports Forecasting as a DEFAULT export.
 */

export default Forecasting;