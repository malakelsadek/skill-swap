import { Injectable, inject } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';

const DEFAULT_TITLE = 'SkillSwap | Learn a skill. Share a skill.';

/** Browser tab title: "Login | SkillSwap" for routes that set a `title`, the default otherwise. */
@Injectable({ providedIn: 'root' })
export class SkillSwapTitleStrategy extends TitleStrategy {
  private title = inject(Title);

  override updateTitle(snapshot: RouterStateSnapshot): void {
    const page = this.buildTitle(snapshot);
    this.title.setTitle(page ? `${page} | SkillSwap` : DEFAULT_TITLE);
  }
}
