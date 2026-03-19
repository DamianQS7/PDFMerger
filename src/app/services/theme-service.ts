import { effect, Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  public readonly isDarkMode = signal(false);

  public toggleDarkMode() {
    this.isDarkMode.update(v => !v);
  }

  private toggleDarkClassEffect = effect(() => {
    document.documentElement.classList.toggle('dark', this.isDarkMode());
  });
}
