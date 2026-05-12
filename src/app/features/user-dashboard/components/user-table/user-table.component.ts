import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnChanges,
  SimpleChanges,
} from '@angular/core';

import { User, USER_ROLES, UserRole } from '../../../../core/models/user.model';

/**
 * Presentational table of users with built-in search, role filter and
 * pagination (bonus task #1).
 *
 * The component is intentionally stateless w.r.t. data — it takes a `users`
 * array via `@Input` and derives a filtered + paginated view internally.
 * Whenever the input list changes (e.g. a new user is added through the
 * lazy-loaded form), `ngOnChanges` recomputes the view in O(n).
 *
 * For real-world scalability beyond a few thousand entries you'd swap the
 * in-component filtering for server-side pagination, but for an assessment-
 * sized dataset this keeps things snappy and avoids unnecessary HTTP plumbing.
 */
@Component({
  selector: 'app-user-table',
  templateUrl: './user-table.component.html',
  styleUrl: './user-table.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserTableComponent implements OnChanges {
  @Input() users: readonly User[] = [];

  readonly roles: readonly UserRole[] = USER_ROLES;
  readonly pageSizeOptions = [5, 10, 25, 50];

  searchTerm = '';
  roleFilter: UserRole | 'all' = 'all';
  pageSize = 5;
  pageIndex = 0;

  /** Memoised derived state. */
  filteredUsers: readonly User[] = [];
  pagedUsers: readonly User[] = [];
  pageCount = 1;

  /** Most recently added user id; used to add a fade-in highlight row. */
  newestUserId: string | null = null;
  private lastSeenIds = new Set<string>();

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['users']) {
      this.trackNewestUser();
      this.recompute();
    }
  }

  onSearchChange(value: string): void {
    this.searchTerm = value;
    this.pageIndex = 0;
    this.recompute();
  }

  onRoleFilterChange(value: UserRole | 'all'): void {
    this.roleFilter = value;
    this.pageIndex = 0;
    this.recompute();
  }

  onPageSizeChange(value: number): void {
    this.pageSize = Number(value) || 5;
    this.pageIndex = 0;
    this.recompute();
  }

  nextPage(): void {
    if (this.pageIndex < this.pageCount - 1) {
      this.pageIndex++;
      this.applyPagination();
    }
  }

  prevPage(): void {
    if (this.pageIndex > 0) {
      this.pageIndex--;
      this.applyPagination();
    }
  }

  goToPage(index: number): void {
    if (index >= 0 && index < this.pageCount && index !== this.pageIndex) {
      this.pageIndex = index;
      this.applyPagination();
    }
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.roleFilter = 'all';
    this.pageIndex = 0;
    this.recompute();
  }

  trackByUserId(_index: number, user: User): string {
    return user.id;
  }

  roleClass(role: UserRole): string {
    return `role-pill role-pill--${role.toLowerCase()}`;
  }

  /** Pages currently relevant to the pager UI (with elision for many pages). */
  get pageRange(): number[] {
    const total = this.pageCount;
    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i);
    }
    const current = this.pageIndex;
    const set = new Set<number>([0, total - 1, current - 1, current, current + 1]);
    return [...set]
      .filter((n) => n >= 0 && n < total)
      .sort((a, b) => a - b);
  }

  isElided(pageIndex: number, idx: number, arr: number[]): boolean {
    return idx > 0 && pageIndex - arr[idx - 1] > 1;
  }

  /* --------------------------- internals --------------------------- */

  private trackNewestUser(): void {
    const currentIds = new Set(this.users.map((u) => u.id));
    if (this.lastSeenIds.size === 0) {
      this.lastSeenIds = currentIds;
      return;
    }
    const added: string[] = [];
    for (const id of currentIds) {
      if (!this.lastSeenIds.has(id)) added.push(id);
    }
    this.lastSeenIds = currentIds;
    if (added.length > 0) {
      this.newestUserId = added[added.length - 1];
      window.setTimeout(() => {
        // Highlight fades after the animation completes.
        this.newestUserId = null;
      }, 2600);

      // Snap to the page that contains the new user so it is visible.
      // Done in recompute() once filteredUsers is rebuilt.
    }
  }

  private recompute(): void {
    const term = this.searchTerm.trim().toLowerCase();
    this.filteredUsers = this.users.filter((u) => {
      const matchesRole = this.roleFilter === 'all' || u.role === this.roleFilter;
      if (!matchesRole) return false;
      if (!term) return true;
      return (
        u.name.toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term) ||
        u.role.toLowerCase().includes(term)
      );
    });

    this.pageCount = Math.max(1, Math.ceil(this.filteredUsers.length / this.pageSize));
    this.pageIndex = Math.min(this.pageIndex, this.pageCount - 1);

    // If a new user was just added, navigate to the page that contains them.
    if (this.newestUserId) {
      const idx = this.filteredUsers.findIndex((u) => u.id === this.newestUserId);
      if (idx >= 0) {
        this.pageIndex = Math.floor(idx / this.pageSize);
      }
    }

    this.applyPagination();
  }

  private applyPagination(): void {
    const start = this.pageIndex * this.pageSize;
    this.pagedUsers = this.filteredUsers.slice(start, start + this.pageSize);
  }

  get displayRangeStart(): number {
    return this.filteredUsers.length === 0 ? 0 : this.pageIndex * this.pageSize + 1;
  }

  get displayRangeEnd(): number {
    return Math.min(this.filteredUsers.length, (this.pageIndex + 1) * this.pageSize);
  }
}
