export interface MelPositionSaveTicket<TPosition> {
  readonly userId: string;
  readonly sessionGeneration: number;
  readonly sequence: number;
  readonly position: TPosition;
}

/**
 * Shares ordered position writes across mounted Mel surfaces. A position ticket
 * is reserved when its location is observed, so a delayed cleanup cannot
 * become newer than a later screen's position.
 */
export function createMelPositionSaveQueue<TPosition, TResult>(
  isSessionCurrent: (userId: string, sessionGeneration: number) => boolean,
  send: (ticket: MelPositionSaveTicket<TPosition>) => Promise<TResult>,
) {
  let sequence = 0;
  const latestSequenceByUser = new Map<string, number>();
  const saveQueuesByUser = new Map<string, Promise<void>>();

  const reserve = (userId: string | undefined, sessionGeneration: number, position: TPosition) => {
    if (!userId || !isSessionCurrent(userId, sessionGeneration)) return null;
    const ticket: MelPositionSaveTicket<TPosition> = {
      userId,
      sessionGeneration,
      sequence: ++sequence,
      position,
    };
    latestSequenceByUser.set(userId, ticket.sequence);
    return ticket;
  };

  const save = (ticket: MelPositionSaveTicket<TPosition> | null) => {
    if (!ticket || !isSessionCurrent(ticket.userId, ticket.sessionGeneration)) {
      return Promise.resolve(null);
    }
    const previous = saveQueuesByUser.get(ticket.userId) ?? Promise.resolve();
    const request = previous.catch(() => undefined).then(async () => {
      if (
        !isSessionCurrent(ticket.userId, ticket.sessionGeneration) ||
        latestSequenceByUser.get(ticket.userId) !== ticket.sequence
      ) {
        return null;
      }
      return send(ticket);
    });
    saveQueuesByUser.set(ticket.userId, request.then(() => undefined, () => undefined));
    return request;
  };

  return { reserve, save };
}