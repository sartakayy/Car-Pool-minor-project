import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { Auth, authState } from '@angular/fire/auth';
import { Observable } from 'rxjs';
import { map, take, timeout, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(private auth: Auth, private router: Router) {}

  canActivate(): Observable<boolean | UrlTree> {
    return authState(this.auth).pipe(
      take(1),
      timeout(5000), // 5 second timeout
      map(user => {
        if (user) {
          // User is authenticated, allow access
          console.log('User authenticated, allowing access to home');
          return true;
        } else {
          // User is not authenticated, redirect to login
          console.log('User not authenticated, redirecting to login');
          return this.router.createUrlTree(['/login']);
        }
      }),
      catchError(error => {
        console.error('Authentication check failed:', error);
        // On error, redirect to login for safety
        return of(this.router.createUrlTree(['/login']));
      })
    );
  }
}