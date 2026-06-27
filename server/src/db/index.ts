export { db } from './connection.js';
import './migrate.js';
import { seedDatabase } from './seed.js';

seedDatabase(false);
