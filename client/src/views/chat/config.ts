/**
 * Leadership chat — identity and conversation keys.
 *
 * Seed DM threads are stored under the counterpart's member id from the
 * Chairman's side (`hr`, `fb`, …). Every other pair gets its own key so one
 * member never reads another pair's direct messages.
 */
import type { CurrentUser } from '../../auth/session';
import type { ChatMember } from '../../store/operationsStore';

export const CHAIRMAN_ID = 'chairman';

export function chatSelfId(user: CurrentUser, members: readonly ChatMember[]): string {
  const member = members.find((m) => m.name === user.name);
  if (member) return member.id;
  return user.permissions.has('chat:directive') ? CHAIRMAN_ID : user.empId;
}

export function dmKey(selfId: string, otherId: string): string {
  if (selfId === CHAIRMAN_ID) return otherId;
  if (otherId === CHAIRMAN_ID) return selfId;
  return `dm:${[selfId, otherId].sort().join(':')}`;
}
