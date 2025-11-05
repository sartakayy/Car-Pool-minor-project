import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-splash',
  imports: [CommonModule],
  template: `
    <div class="splash-container">
      <div class="splash-content">
        <div class="logo">
          <i class="fas fa-car"></i>
          <span>PoolParty</span>
        </div>
        <div class="loading">
          <div class="spinner">
            <i class="fas fa-spinner fa-spin"></i>
          </div>
          <p>Loading...</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .splash-container {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: #000000;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
    }

    .splash-content {
      text-align: center;
      color: white;
    }

    .logo {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
      margin-bottom: 2rem;
      font-size: 2.5rem;
      font-weight: 800;
    }

    .logo i {
      color: #7f5af0;
      font-size: 2.8rem;
    }

    .logo span {
      background: linear-gradient(135deg, #7f5af0, #9f7aea);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .loading {
      color: #b3b3b3;
    }

    .spinner {
      font-size: 2rem;
      color: #7f5af0;
      margin-bottom: 1rem;
    }

    .spinner i {
      font-size: inherit;
    }

    p {
      margin: 0;
      font-size: 1.1rem;
    }
  `]
})
export class SplashComponent {}