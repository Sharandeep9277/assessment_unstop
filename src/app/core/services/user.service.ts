import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, map } from 'rxjs';

import {
  RoleDistribution,
  User,
  UserDraft,
  USER_ROLES,
  UserRole,
} from '../models/user.model';

/**
 * Owns the canonical user list and exposes it as an RxJS BehaviorSubject so that
 * any subscriber (table, chart, stats) stays in sync with the latest state.
 *
 * The seed data is provided so the dashboard renders something meaningful on the
 * very first load and the pie chart has all three role buckets populated.
 */
@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly _users$ = new BehaviorSubject<User[]>(UserService.seed());

  /** Stream of users; replays the latest value on subscribe (BehaviorSubject). */
  readonly users$: Observable<User[]> = this._users$.asObservable();

  /** Derived stream of role distribution, recomputed whenever users change. */
  readonly roleDistribution$: Observable<RoleDistribution> = this.users$.pipe(
    map((users) => UserService.computeDistribution(users)),
  );

  /** Synchronous snapshot of the current users (useful for guards / tests). */
  get snapshot(): readonly User[] {
    return this._users$.value;
  }

  /**
   * Add a user to the list. Emits a new immutable array reference so OnPush
   * change detection picks the change up correctly.
   */
  addUser(draft: UserDraft): User {
    const user: User = { ...draft, id: UserService.generateId() };
    this._users$.next([...this._users$.value, user]);
    return user;
  }

  /** Convenience: replace the whole list (e.g. for resets in tests). */
  setUsers(users: readonly User[]): void {
    this._users$.next([...users]);
  }

  /* --------------------------- helpers --------------------------- */

  private static computeDistribution(users: readonly User[]): RoleDistribution {
    const counts: Record<UserRole, number> = { Admin: 0, Editor: 0, Viewer: 0 };
    for (const user of users) {
      counts[user.role] = (counts[user.role] ?? 0) + 1;
    }
    return counts;
  }

  private static generateId(): string {
    // crypto.randomUUID is available in modern browsers and node >=14.17.
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    return 'u_' + Math.random().toString(36).slice(2, 11) + Date.now().toString(36);
  }

  private static seed(): User[] {
    return [
      { id: 'u-1', name: 'Aarav Sharma', email: 'aarav.sharma@example.com', role: 'Admin' },
      { id: 'u-2', name: 'Diya Verma', email: 'diya.verma@example.com', role: 'Editor' },
      { id: 'u-3', name: 'Rohan Mehta', email: 'rohan.mehta@example.com', role: 'Editor' },
      { id: 'u-4', name: 'Isha Kapoor', email: 'isha.kapoor@example.com', role: 'Viewer' },
      { id: 'u-5', name: 'Kabir Singh', email: 'kabir.singh@example.com', role: 'Viewer' },
    ];
  }

  /** Re-exported for component templates. */
  readonly roles = USER_ROLES;
}
