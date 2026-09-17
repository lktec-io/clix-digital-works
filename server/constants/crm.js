/**
 * CRM / CardHub allowlists — the single source of truth for every status,
 * source and type value. Stored as VARCHAR (not DB ENUMs) so adding a value
 * only means editing this file; no migration. The admin UI fetches these
 * through GET /api/admin/crm/options instead of hardcoding its own copy.
 */

/* global process -- Node module; the root ESLint config assumes browser globals */

const option = (value, label) => ({ value, label });
const values = list => list.map(o => o.value);

export const CRM_TIMEZONE = process.env.CRM_TIMEZONE || 'Africa/Dar_es_Salaam';

export const CLIENT_STATUSES = [
  option('lead', 'Lead'),
  option('prospect', 'Prospect'),
  option('negotiation', 'Negotiation'),
  option('confirmed', 'Confirmed'),
  option('active', 'Active Client'),
  option('completed', 'Completed'),
  option('inactive', 'Inactive'),
];

export const CLIENT_SOURCES = [
  option('whatsapp', 'WhatsApp'),
  option('facebook', 'Facebook'),
  option('instagram', 'Instagram'),
  option('website', 'Website'),
  option('referral', 'Referral'),
  option('walk_in', 'Walk-in'),
  option('existing_client', 'Existing Client'),
  option('cardhub', 'CardHub'),
  option('other', 'Other'),
];

export const PRIORITIES = [
  option('low', 'Low'),
  option('medium', 'Medium'),
  option('high', 'High'),
];

export const PROJECT_STATUSES = [
  option('planned', 'Planned'),
  option('quoted', 'Quoted'),
  option('confirmed', 'Confirmed'),
  option('in_progress', 'In Progress'),
  option('on_hold', 'On Hold'),
  option('completed', 'Completed'),
  option('cancelled', 'Cancelled'),
];

/** Projects that are live work (dashboard "Active Projects"). */
export const ACTIVE_PROJECT_STATUSES = ['confirmed', 'in_progress'];
/** Projects that have not started yet (dashboard "Upcoming Projects"). */
export const PRE_START_PROJECT_STATUSES = ['planned', 'quoted', 'confirmed'];

export const PAYMENT_STATUSES = [
  option('unpaid', 'Unpaid'),
  option('partial', 'Partial'),
  option('paid', 'Paid'),
];

export const PAYMENT_METHODS = [
  option('cash', 'Cash'),
  option('mpesa', 'M-Pesa'),
  option('airtel_money', 'Airtel Money'),
  option('tigo_pesa', 'Tigo Pesa'),
  option('bank', 'Bank'),
  option('other', 'Other'),
];

/** Stored statuses. "Overdue" is derived (due_date < today and not completed), never stored. */
export const FOLLOW_UP_STATUSES = [
  option('pending', 'Pending'),
  option('snoozed', 'Snoozed'),
  option('completed', 'Completed'),
];
export const OPEN_FOLLOW_UP_STATUSES = ['pending', 'snoozed'];

/** Values shared with CardHub's own constants/eventTypes.js where they overlap. */
export const CARDHUB_EVENT_TYPES = [
  option('wedding', 'Wedding'),
  option('send_off', 'Send-off'),
  option('birthday', 'Birthday'),
  option('confirmation', 'Confirmation'),
  option('graduation', 'Graduation'),
  option('anniversary', 'Anniversary'),
  option('baby_shower', 'Baby Shower'),
  option('corporate', 'Corporate'),
  option('other', 'Other'),
];

export const CARDHUB_EVENT_STATUSES = [
  option('new', 'New'),
  option('planning', 'Planning'),
  option('designing', 'Designing'),
  option('ready', 'Ready'),
  option('delivered', 'Delivered'),
  option('event_completed', 'Event Completed'),
  option('cancelled', 'Cancelled'),
];

/** Events that should never appear in "upcoming" views or alerts. */
export const CLOSED_EVENT_STATUSES = ['event_completed', 'cancelled'];

export const V = {
  clientStatus:   values(CLIENT_STATUSES),
  clientSource:   values(CLIENT_SOURCES),
  priority:       values(PRIORITIES),
  projectStatus:  values(PROJECT_STATUSES),
  paymentStatus:  values(PAYMENT_STATUSES),
  paymentMethod:  values(PAYMENT_METHODS),
  followUpStatus: values(FOLLOW_UP_STATUSES),
  eventType:      values(CARDHUB_EVENT_TYPES),
  eventStatus:    values(CARDHUB_EVENT_STATUSES),
};

export const CRM_OPTIONS = {
  client_statuses:        CLIENT_STATUSES,
  client_sources:         CLIENT_SOURCES,
  priorities:             PRIORITIES,
  project_statuses:       PROJECT_STATUSES,
  payment_statuses:       PAYMENT_STATUSES,
  payment_methods:        PAYMENT_METHODS,
  follow_up_statuses:     FOLLOW_UP_STATUSES,
  cardhub_event_types:    CARDHUB_EVENT_TYPES,
  cardhub_event_statuses: CARDHUB_EVENT_STATUSES,
};
