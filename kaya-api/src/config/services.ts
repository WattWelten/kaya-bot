/**
 * Service Configuration and Registration
 * Registers all services in the DI container
 */

import container from './container';
import logger from '../utils/logger';
import CacheRepository from '../repositories/CacheRepository';
import SessionRepository from '../repositories/SessionRepository';
import EmotionService from '../services/EmotionService';

// Initialize repositories
const cacheRepository = new CacheRepository();
const sessionRepository = new SessionRepository();
const emotionService = new EmotionService();

// Register services in container
container.registerInstance('cacheRepository', cacheRepository);
container.registerInstance('sessionRepository', sessionRepository);
container.registerInstance('emotionService', emotionService);

// Register lazy-loaded services
container.register('logger', () => logger, true);

logger.info('Services registered in DI container', {
  services: container.getRegisteredServices(),
});

export default container;
