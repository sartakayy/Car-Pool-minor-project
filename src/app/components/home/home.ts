import { Component, OnInit } from '@angular/core';
import { Auth, authState, signOut } from '@angular/fire/auth';
import { Router } from '@angular/router';
import { filter } from 'rxjs';

@Component({
  selector: 'app-home',
  imports: [],
  templateUrl: './home.html',
  styleUrl: './home.scss'
})
export class Home implements OnInit{
  user:any;
  constructor(private auth:Auth, private router:Router) {}
  ngOnInit(): void {
    authState(this.auth).pipe(filter(user => !!user)).subscribe((user) => {
      this.user = user.displayName;
    })
  }

  async onLogoutPress() {
    await signOut(this.auth);
    this.router.navigate(['/login'])
  }
}
