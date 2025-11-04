import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes), 
    provideFirebaseApp(() => initializeApp({ projectId: "poolparty-fb354", appId: "1:784824828781:web:9d94565ae107ea7d155064", storageBucket: "poolparty-fb354.firebasestorage.app", apiKey: "AIzaSyAWHxGspY4-YrM6553LqkGTN-RzGqUHEzk", authDomain: "poolparty-fb354.firebaseapp.com", messagingSenderId: "784824828781" })), 
    provideAuth(() => getAuth()), 
    provideFirestore(() => getFirestore())
  ]
};
