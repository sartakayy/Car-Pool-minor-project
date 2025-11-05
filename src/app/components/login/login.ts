import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Auth, GoogleAuthProvider, signInWithPopup } from '@angular/fire/auth';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  imports: [CommonModule],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class Login {
  loading = false;

  constructor(private auth:Auth, private router:Router) {}

  async onLoginPress() {
    this.loading = true;
    try {
      await signInWithPopup(this.auth, new GoogleAuthProvider());
      this.router.navigate(['']);
    } catch(error) {
      console.log('Error Logging In:', error);
    } finally {
      this.loading = false;
    }
  }
}
