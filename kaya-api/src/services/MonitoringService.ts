/**
 * Monitoring Service
 * Prometheus/Grafana-ready Metrics für Performance-Monitoring
 */

import logger from '../utils/logger';

interface Metric {
  name: string;
  value: number;
  labels?: Record<string, string>;
  timestamp: number;
}

interface MetricsSnapshot {
  timestamp: number;
  metrics: Metric[];
}

class MonitoringService {
  private metrics: Map<string, Metric> = new Map();
  private history: MetricsSnapshot[] = [];
  private maxHistorySize: number = 1000;
  private collectionInterval: NodeJS.Timeout | null = null;

  // Counters
  private requestCount: number = 0;
  private errorCount: number = 0;
  private responseTimeSum: number = 0;
  private responseTimeCount: number = 0;

  // Gauges
  private activeConnections: number = 0;
  private memoryUsage: number = 0;
  private cpuUsage: number = 0;

  constructor() {
    this.startMetricsCollection();
    logger.info('Monitoring Service initialized');
  }

  /**
   * Starte automatische Metrik-Sammlung
   */
  private startMetricsCollection(): void {
    this.collectionInterval = setInterval(() => {
      this.collectSystemMetrics();
    }, 10000); // Alle 10 Sekunden
  }

  /**
   * Sammle System-Metriken
   */
  private collectSystemMetrics(): void {
    const memUsage = process.memoryUsage();
    this.memoryUsage = Math.round(memUsage.heapUsed / 1024 / 1024); // MB

    // CPU-Usage (vereinfacht)
    const cpuUsage = process.cpuUsage();
    this.cpuUsage = Math.round((cpuUsage.user + cpuUsage.system) / 1000); // ms

    // Metriken speichern
    this.recordMetric('memory_usage_bytes', memUsage.heapUsed, {
      type: 'heap',
    });
    this.recordMetric('memory_heap_total_bytes', memUsage.heapTotal, {
      type: 'heap',
    });
    this.recordMetric('memory_external_bytes', memUsage.external, {
      type: 'external',
    });
    this.recordMetric('active_connections', this.activeConnections);
    this.recordMetric('request_count', this.requestCount);
    this.recordMetric('error_count', this.errorCount);

    // Response Time Average
    if (this.responseTimeCount > 0) {
      const avgResponseTime = this.responseTimeSum / this.responseTimeCount;
      this.recordMetric('response_time_avg_ms', avgResponseTime);
    }

    // Snapshot erstellen
    this.createSnapshot();
  }

  /**
   * Metrik aufzeichnen
   */
  recordMetric(name: string, value: number, labels?: Record<string, string>): void {
    const metric: Metric = {
      name,
      value,
      labels,
      timestamp: Date.now(),
    };

    this.metrics.set(name, metric);
  }

  /**
   * Request-Metrik aufzeichnen
   */
  recordRequest(path: string, statusCode: number, responseTime: number): void {
    this.requestCount++;
    this.responseTimeSum += responseTime;
    this.responseTimeCount++;

    this.recordMetric('http_requests_total', this.requestCount, {
      path,
      status: statusCode.toString(),
    });

    this.recordMetric('http_response_time_ms', responseTime, {
      path,
    });

    if (statusCode >= 400) {
      this.errorCount++;
      this.recordMetric('http_errors_total', this.errorCount, {
        path,
        status: statusCode.toString(),
      });
    }
  }

  /**
   * Error-Metrik aufzeichnen
   */
  recordError(error: Error, context?: Record<string, any>): void {
    this.errorCount++;
    this.recordMetric('errors_total', this.errorCount, {
      type: error.name,
      ...context,
    });
  }

  /**
   * Connection-Metrik aktualisieren
   */
  updateConnectionCount(active: number): void {
    this.activeConnections = active;
    this.recordMetric('connections_active', active);
  }

  /**
   * Snapshot erstellen (für Historie)
   */
  private createSnapshot(): void {
    const snapshot: MetricsSnapshot = {
      timestamp: Date.now(),
      metrics: Array.from(this.metrics.values()),
    };

    this.history.push(snapshot);

    // Alte Snapshots entfernen
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
    }
  }

  /**
   * Metriken im Prometheus-Format abrufen
   */
  getPrometheusMetrics(): string {
    const lines: string[] = [];

    for (const [name, metric] of this.metrics.entries()) {
      const labels = metric.labels
        ? `{${Object.entries(metric.labels)
            .map(([k, v]) => `${k}="${v}"`)
            .join(',')}}`
        : '';

      lines.push(`${name}${labels} ${metric.value}`);
    }

    return lines.join('\n') + '\n';
  }

  /**
   * Metriken als JSON abrufen
   */
  getMetricsJSON(): any {
    return {
      timestamp: Date.now(),
      metrics: Array.from(this.metrics.values()),
      summary: {
        requestCount: this.requestCount,
        errorCount: this.errorCount,
        activeConnections: this.activeConnections,
        averageResponseTime:
          this.responseTimeCount > 0
            ? this.responseTimeSum / this.responseTimeCount
            : 0,
        memoryUsageMB: this.memoryUsage,
        cpuUsageMs: this.cpuUsage,
      },
    };
  }

  /**
   * Metriken-Historie abrufen
   */
  getHistory(): MetricsSnapshot[] {
    return this.history;
  }

  /**
   * Metriken zurücksetzen
   */
  reset(): void {
    this.metrics.clear();
    this.history = [];
    this.requestCount = 0;
    this.errorCount = 0;
    this.responseTimeSum = 0;
    this.responseTimeCount = 0;
    this.activeConnections = 0;
  }

  /**
   * Shutdown
   */
  shutdown(): void {
    if (this.collectionInterval) {
      clearInterval(this.collectionInterval);
    }
    logger.info('Monitoring Service shut down');
  }
}

export default new MonitoringService();

