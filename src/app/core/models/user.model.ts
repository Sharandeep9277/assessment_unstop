export type UserRole = 'Admin' | 'Editor' | 'Viewer';

export const USER_ROLES: readonly UserRole[] = ['Admin', 'Editor', 'Viewer'] as const;

export interface User {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly role: UserRole;
}

export type UserDraft = Omit<User, 'id'>;

export interface RoleDistribution {
  readonly Admin: number;
  readonly Editor: number;
  readonly Viewer: number;
}
