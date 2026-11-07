import { Component, HostListener, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from './core/services/auth.service';
import { SoundService } from './core/services/sound.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  auth = inject(AuthService);
  sound = inject(SoundService);
  private router = inject(Router);
  menuOpen = signal(false); // hamburger menu on small screens

  /** Click sound for plain buttons and button-links; submit buttons play their own success/error sound. */
  @HostListener('document:click', ['$event'])
  onClick(e: Event) {
    if ((e.target as HTMLElement).closest('button:not([type=submit]), a.btn')) this.sound.play('click');
  }

  logout() {
    this.auth.logout();
    this.menuOpen.set(false);
    this.router.navigateByUrl('/');
  }
}
