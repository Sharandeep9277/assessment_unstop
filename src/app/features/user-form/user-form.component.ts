import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  HostListener,
  OnInit,
  Output,
} from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ValidationErrors,
  Validators,
} from '@angular/forms';

import { UserDraft, USER_ROLES, UserRole } from '../../core/models/user.model';

/**
 * Modal form for adding a new user.
 *
 * Sits inside the lazy-loaded `UserFormModule`. Communicates with its host
 * (`UserDashboardComponent`) via two outputs:
 *   - `submitted` — emits a validated `UserDraft` on save
 *   - `closed`    — emits when the user dismisses the modal (X / backdrop / Esc)
 *
 * The component is intentionally framework-light: it doesn't know about the
 * `UserService` and is therefore trivially reusable / testable.
 */
@Component({
  selector: 'app-user-form',
  templateUrl: './user-form.component.html',
  styleUrl: './user-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserFormComponent implements OnInit {
  @Output() readonly submitted = new EventEmitter<UserDraft>();
  @Output() readonly closed = new EventEmitter<void>();

  readonly roles: readonly UserRole[] = USER_ROLES;

  form!: FormGroup;
  isSubmitting = false;

  constructor(private readonly fb: FormBuilder) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      name: [
        '',
        [Validators.required, Validators.minLength(2), Validators.maxLength(60), this.noWhitespaceValidator],
      ],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(120)]],
      role: ['', [Validators.required, this.roleValidator]],
    });
  }

  /** Convenience getters used by the template for cleaner expressions. */
  get nameCtrl(): AbstractControl { return this.form.get('name')!; }
  get emailCtrl(): AbstractControl { return this.form.get('email')!; }
  get roleCtrl(): AbstractControl { return this.form.get('role')!; }

  showError(ctrl: AbstractControl): boolean {
    return ctrl.invalid && (ctrl.dirty || ctrl.touched);
  }

  onSubmit(): void {
    if (this.form.invalid || this.isSubmitting) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    const { name, email, role } = this.form.value as {
      name: string;
      email: string;
      role: UserRole;
    };

    const draft: UserDraft = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      role,
    };

    // Tiny artificial latency so the spinner / disabled state is observable
    // — gives the UX a sense of "work happening" without delaying real users
    // perceptibly. Replace with an HTTP call in a real app.
    window.setTimeout(() => {
      this.submitted.emit(draft);
      this.isSubmitting = false;
    }, 250);
  }

  onCancel(): void {
    if (this.isSubmitting) return;
    this.closed.emit();
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.onCancel();
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.onCancel();
  }

  /* --------------------------- validators --------------------------- */

  private noWhitespaceValidator(control: AbstractControl): ValidationErrors | null {
    const value = (control.value ?? '') as string;
    return value.trim().length === 0 && value.length > 0 ? { whitespace: true } : null;
  }

  private roleValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value as UserRole;
    return USER_ROLES.includes(value) ? null : { invalidRole: true };
  }
}
