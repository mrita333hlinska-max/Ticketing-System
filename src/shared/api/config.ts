/**
 * API configuration.
 *
 * PROJECT_RULES §2: the base URL lives in ONE place and defaults to a
 * placeholder — no live endpoints are hardcoded. The backend does not exist
 * yet; this value is only consumed by the (currently unwired) HTTP adapter.
 * Override at build time with `VITE_API_BASE_URL`.
 */
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api';
