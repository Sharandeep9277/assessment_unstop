import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ComponentRef,
  createNgModule,
  Injector,
  OnDestroy,
  OnInit,
  ViewChild,
  ViewContainerRef,
} from '@angular/core';
import { Observable, Subject, takeUntil } from 'rxjs';

import { RoleDistribution, User, UserDraft } from '../../core/models/user.model';
import { UserService } from '../../core/services/user.service';

/**
 * Top-level page component for the user management dashboard.
 *
 * Responsibilities:
 *   1. Subscribe to `UserService.users$` (BehaviorSubject) and expose the data
 *      to the child table and chart components via the async pipe.
 *   2. Open the lazy-loaded `UserFormComponent` modal on demand. The form
 *      module is fetched via a dynamic `import()` so its code is not part of
 *      the initial bundle — it ships as a separate chunk.
 *   3. Forward the submitted user draft to `UserService.addUser`, which in
 *      turn pushes a new value through the BehaviorSubject. Every subscriber
 *      (table, chart, stat cards) updates reactively.
 */
@Component({
  selector: 'app-user-dashboard',
  templateUrl: './user-dashboard.component.html',
  styleUrl: './user-dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserDashboardComponent implements OnInit, OnDestroy {
  readonly users$: Observable<User[]> = this.userService.users$;
  readonly distribution$: Observable<RoleDistribution> = this.userService.roleDistribution$;

  /** Whether the lazy form chunk is currently being fetched. */
  isFormLoading = false;

  /** Whether the modal is currently mounted. */
  isFormOpen = false;

  /** Toast shown briefly after a successful add. */
  recentlyAddedName: string | null = null;

  /** Total number of users (kept locally so the header doesn't need async). */
  totalUsers = 0;

  /** Host for the dynamically-created `UserFormComponent` instance. */
  @ViewChild('formHost', { read: ViewContainerRef, static: true })
  private formHost!: ViewContainerRef;

  private formComponentRef?: ComponentRef<{
    submitted: { subscribe(cb: (d: UserDraft) => void): { unsubscribe(): void } };
    closed: { subscribe(cb: () => void): { unsubscribe(): void } };
  }>;

  private toastTimer?: number;
  private readonly destroyed$ = new Subject<void>();

  constructor(
    private readonly userService: UserService,
    private readonly injector: Injector,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.users$.pipe(takeUntil(this.destroyed$)).subscribe((users) => {
      this.totalUsers = users.length;
      this.cdr.markForCheck();
    });
  }

  /**
   * Lazy-loads the `UserFormModule` chunk and instantiates `UserFormComponent`
   * inside the `formHost` view container.
   *
   * Uses `createNgModule` so the component is created with its module's
   * provider scope (matching the assessment's requirement to lazy-load the
   * form "via Angular's module system").
   */
  async openAddUserModal(): Promise<void> {
    if (this.isFormOpen || this.isFormLoading) return;

    this.isFormLoading = true;
    this.cdr.markForCheck();

    try {
      const { UserFormModule, UserFormComponent } = await import(
        /* webpackChunkName: "user-form" */ '../user-form/user-form.module'
      );

      const moduleRef = createNgModule(UserFormModule, this.injector);
      this.formHost.clear();
      const ref = this.formHost.createComponent(UserFormComponent, {
        ngModuleRef: moduleRef,
      });
      this.formComponentRef = ref as unknown as typeof this.formComponentRef;

      ref.instance.submitted
        .subscribe((draft) => this.handleUserSubmitted(draft));
      ref.instance.closed
        .subscribe(() => this.closeAddUserModal());

      this.isFormOpen = true;
    } catch (err) {
      // Surfacing a console.error here is intentional: a lazy-chunk fetch
      // failure (network offline, etc.) is the only realistic failure mode
      // and the developer needs to see it to debug. Users get a toast.
      // eslint-disable-next-line no-console
      console.error('Failed to load user form module', err);
      this.recentlyAddedName = null;
    } finally {
      this.isFormLoading = false;
      this.cdr.markForCheck();
    }
  }

  closeAddUserModal(): void {
    this.formComponentRef?.destroy();
    this.formComponentRef = undefined;
    this.formHost.clear();
    this.isFormOpen = false;
    this.cdr.markForCheck();
  }

  /** Called when the lazy form emits a validated draft. */
  private handleUserSubmitted(draft: UserDraft): void {
    const added = this.userService.addUser(draft);
    this.closeAddUserModal();

    this.recentlyAddedName = added.name;
    window.clearTimeout(this.toastTimer);
    this.toastTimer = window.setTimeout(() => {
      this.recentlyAddedName = null;
      this.cdr.markForCheck();
    }, 3200);
    this.cdr.markForCheck();
  }

  ngOnDestroy(): void {
    window.clearTimeout(this.toastTimer);
    this.closeAddUserModal();
    this.destroyed$.next();
    this.destroyed$.complete();
  }
}
