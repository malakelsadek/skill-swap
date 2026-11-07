import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

/** Temporary page for routes whose real component is not built yet. Owner replaces the loadComponent line in app.routes.ts. */
@Component({
  selector: 'app-placeholder',
  template: `
    <section class="container">
      <h1>{{ data['title'] }}</h1>
      <p>Coming soon: built by {{ data['owner'] }}.</p>
    </section>
  `,
})
export class Placeholder {
  data = inject(ActivatedRoute).snapshot.data;
}
