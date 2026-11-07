import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  auth = inject(AuthService);
  private router = inject(Router);
  menuOpen = signal(false); // hamburger menu on small screens

  logout() {
    this.auth.logout();
    this.menuOpen.set(false);
    this.router.navigateByUrl('/');
  }
}
