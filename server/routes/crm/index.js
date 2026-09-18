import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { clientsRouter } from './clients.js';
import { projectsRouter } from './projects.js';
import { followUpsRouter } from './followUps.js';
import { cardhubRouter } from './cardhub.js';
import { paymentsRouter } from './payments.js';
import { expensesRouter } from './expenses.js';
import { dashboardRouter } from './dashboard.js';

/**
 * CRM + CardHub management API, mounted under /api/admin next to the existing
 * admin routes. Authentication is applied once here, for every route, using
 * the existing admin JWT middleware — no route in this module can be exposed
 * by forgetting a per-route guard.
 */
export const crmRouter = Router();

crmRouter.use(requireAuth);
crmRouter.use(dashboardRouter);
crmRouter.use(clientsRouter);
crmRouter.use(projectsRouter);
crmRouter.use(followUpsRouter);
crmRouter.use(cardhubRouter);
crmRouter.use(paymentsRouter);
crmRouter.use(expensesRouter);
