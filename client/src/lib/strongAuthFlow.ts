export type StrongAuthModalEvent =
  | { type: 'OPEN_REQUESTED' }
  | { type: 'CLOSE_REQUESTED' }
  | { type: 'AUTH_SUCCESS' };

/**
 * Strong 401 responses never open credentials automatically. Login remains an
 * explicit user action, including after a previous successful login.
 */
export function strongAuthModalReducer(
  _isOpen: boolean,
  event: StrongAuthModalEvent,
): boolean {
  return event.type === 'OPEN_REQUESTED';
}