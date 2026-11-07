import { Component, inject } from '@angular/core';
import { KEYS } from '../../core/config';
import { User } from '../../core/models';
import { StorageService } from '../../core/services/storage.service';

@Component({
  selector: 'app-admin-users',
  template: `
    <section class="container">
      <h1>Users</h1>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Name</th><th>Username</th><th>Email</th><th>Role</th></tr></thead>
          <tbody>
            @for (u of users; track u.id) {
              <tr><td>{{ u.name }}</td><td>{{ u.username }}</td><td>{{ u.email }}</td><td>{{ u.role }}</td></tr>
            }
          </tbody>
        </table>
      </div>
    </section>
  `,
})
export class AdminUsers {
  users = inject(StorageService).local.get<User[]>(KEYS.users) ?? [];
}
