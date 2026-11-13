import { Component, HostListener, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from './core/services/auth.service';
import { SoundService } from './core/services/sound.service';
import { CartService } from './features/student/cart.service';
import { ChatWidget } from './shared/chat-widget/chat-widget';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ChatWidget],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  auth = inject(AuthService);
  sound = inject(SoundService);
  cart = inject(CartService);
  private router = inject(Router);
  menuOpen = signal(false); // hamburger menu on small screens
  profileOpen = signal(false); // dropdown under the profile button

  /** Click sound for plain buttons and button-links; submit buttons play their own success/error sound. */
  @HostListener('document:click', ['$event'])
  onClick(e: Event) {
    const target = e.target as HTMLElement;
    if (target.closest('button:not([type=submit]), a.btn')) this.sound.play('click');
    if (!target.closest('.profile')) this.profileOpen.set(false); // click elsewhere closes the profile menu
  }

  logout() {
    this.auth.logout();
    this.menuOpen.set(false);
    this.profileOpen.set(false);
    this.router.navigateByUrl('/');
  }
}
