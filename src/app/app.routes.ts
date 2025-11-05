import { Routes } from '@angular/router';
import { Login } from './components/login/login';
import { Home } from './components/home/home';
import { AuthGuard } from './guards/auth.guard';
import { LoginGuard } from './guards/login.guard';

export const routes: Routes = [
    {
        path: "", 
        component: Home,
        canActivate: [AuthGuard]
    },
    {
        path: "login", 
        component: Login,
        canActivate: [LoginGuard]
    },
    {
        path: "**", 
        redirectTo: "/login"
    }
];
