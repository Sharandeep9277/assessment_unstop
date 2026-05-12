import { TestBed } from '@angular/core/testing';
import { take } from 'rxjs';

import { UserService } from './user.service';

describe('UserService', () => {
  let service: UserService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(UserService);
    service.setUsers([]);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should emit the current user list synchronously to new subscribers (BehaviorSubject)', (done) => {
    service.setUsers([
      { id: 'u1', name: 'Alice', email: 'alice@example.com', role: 'Admin' },
    ]);

    service.users$.pipe(take(1)).subscribe((users) => {
      expect(users.length).toBe(1);
      expect(users[0].name).toBe('Alice');
      done();
    });
  });

  it('should add a user and emit a new array reference', (done) => {
    const seen: number[] = [];
    service.users$.subscribe((users) => {
      seen.push(users.length);
      if (seen.length === 2) {
        expect(seen).toEqual([0, 1]);
        done();
      }
    });

    service.addUser({ name: 'Bob', email: 'bob@example.com', role: 'Editor' });
  });

  it('should compute role distribution correctly', (done) => {
    service.setUsers([
      { id: 'a', name: 'A', email: 'a@x.com', role: 'Admin' },
      { id: 'b', name: 'B', email: 'b@x.com', role: 'Admin' },
      { id: 'c', name: 'C', email: 'c@x.com', role: 'Editor' },
      { id: 'd', name: 'D', email: 'd@x.com', role: 'Viewer' },
    ]);

    service.roleDistribution$.pipe(take(1)).subscribe((dist) => {
      expect(dist).toEqual({ Admin: 2, Editor: 1, Viewer: 1 });
      done();
    });
  });

  it('should reflect newly added users in roleDistribution$', (done) => {
    let calls = 0;
    service.roleDistribution$.subscribe((dist) => {
      calls++;
      if (calls === 1) {
        expect(dist.Admin).toBe(0);
      } else if (calls === 2) {
        expect(dist.Admin).toBe(1);
        done();
      }
    });

    service.addUser({ name: 'C', email: 'c@x.com', role: 'Admin' });
  });
});
