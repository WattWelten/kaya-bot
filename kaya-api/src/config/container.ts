/**
 * Dependency Injection Container
 * Provides loose coupling between services through dependency injection
 */

type ServiceFactory<T> = () => T;
type ServiceInstance<T> = T | null;

class ServiceContainer {
  private services: Map<string, ServiceInstance<any>> = new Map();
  private factories: Map<string, ServiceFactory<any>> = new Map();
  private singletons: Set<string> = new Set();

  /**
   * Register a service factory
   */
  register<T>(
    name: string,
    factory: ServiceFactory<T>,
    singleton: boolean = true
  ): void {
    this.factories.set(name, factory);
    if (singleton) {
      this.singletons.add(name);
    }
  }

  /**
   * Register a service instance directly
   */
  registerInstance<T>(name: string, instance: T): void {
    this.services.set(name, instance);
  }

  /**
   * Resolve a service
   */
  resolve<T>(name: string): T {
    // Check if instance already exists (singleton)
    if (this.singletons.has(name) && this.services.has(name)) {
      return this.services.get(name) as T;
    }

    // Get factory and create instance
    const factory = this.factories.get(name);
    if (!factory) {
      throw new Error(`Service '${name}' not found`);
    }

    const instance = factory();

    // Store instance if singleton
    if (this.singletons.has(name)) {
      this.services.set(name, instance);
    }

    return instance as T;
  }

  /**
   * Check if service is registered
   */
  has(name: string): boolean {
    return this.factories.has(name) || this.services.has(name);
  }

  /**
   * Clear all services (useful for testing)
   */
  clear(): void {
    this.services.clear();
    this.factories.clear();
    this.singletons.clear();
  }

  /**
   * Get all registered service names
   */
  getRegisteredServices(): string[] {
    return Array.from(new Set([
      ...this.factories.keys(),
      ...this.services.keys()
    ]));
  }
}

// Singleton container instance
const container = new ServiceContainer();

export default container;
