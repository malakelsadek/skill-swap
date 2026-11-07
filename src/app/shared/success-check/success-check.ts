import { Component } from '@angular/core';

/** Animated green checkmark. Use <app-success-check /> after a payment, signup, etc. */
@Component({
  selector: 'app-success-check',
  template: `
    <svg class="check" viewBox="0 0 52 52" role="img" aria-label="Success">
      <circle cx="26" cy="26" r="24" fill="none" />
      <path fill="none" d="M14 27l8 8 16-16" />
    </svg>
  `,
  styles: `
    .check { width: 3rem; height: 3rem; }
    circle, path {
      stroke: var(--success);
      stroke-width: 4;
      stroke-linecap: round;
      stroke-linejoin: round;
      stroke-dasharray: 160;
      stroke-dashoffset: 160;
      animation: draw 0.6s ease forwards;
    }
    path { animation-delay: 0.3s; }
    @keyframes draw { to { stroke-dashoffset: 0; } }
  `,
})
export class SuccessCheck {}
