import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-forbidden',
  imports: [RouterLink],
  template: `
    <section class="forbidden">
      <h1>Not authorized</h1>
      <p>You don't have access to this page with your current account.</p>
      <a routerLink="/">Back to Home</a>
    </section>
  `,
  styles: `
    .forbidden {
      max-width: 32rem;
      margin: 4rem auto;
      padding: 0 1rem;
      text-align: center;
    }
  `,
})
export class Forbidden {}
