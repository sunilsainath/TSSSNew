/**
 * Shared form-state shapes and constants for server actions.
 *
 * IMPORTANT: files that carry the "use server" directive may only export async
 * functions, so state types and initial values live here instead.
 */

export type FormState<T = Record<string, string>> = {
  status: "idle" | "success" | "error";
  message?: string;
  errors?: T;
  /** Returned to render the success screens. */
  data?: Record<string, string | number | boolean | null>;
} & Record<string, unknown>;

export const INITIAL_FORM_STATE: FormState = { status: "idle" };

export type AdminState = {
  status: "idle" | "success" | "error";
  message?: string;
  errors?: Record<string, string>;
};

export const INITIAL_ADMIN_STATE: AdminState = { status: "idle" };

export type LoginState = {
  status: "idle" | "error";
  message?: string;
};

export const INITIAL_LOGIN_STATE: LoginState = { status: "idle" };