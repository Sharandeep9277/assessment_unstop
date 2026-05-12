import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';

import { UserFormComponent } from './user-form.component';

/**
 * Lazy-loaded module that ships the user creation form modal.
 *
 * This module is never imported statically from `AppModule` or
 * `UserDashboardModule`. Instead it is resolved at runtime via a dynamic
 * `import('./features/user-form/user-form.module')` call so that the form
 * (and its `ReactiveFormsModule` dependency tree) ends up in its OWN webpack
 * chunk — keeping the initial dashboard payload smaller.
 */
@NgModule({
  declarations: [UserFormComponent],
  imports: [CommonModule, ReactiveFormsModule],
})
export class UserFormModule {}

// Re-export the component so the dynamic-import callsite can grab both the
// module and the component from a single chunk import.
export { UserFormComponent } from './user-form.component';
