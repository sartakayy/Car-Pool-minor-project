import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { map, tap, switchMap, catchError } from 'rxjs/operators';
import { Auth, onAuthStateChanged, User as FirebaseUser } from '@angular/fire/auth';

export interface Ride {
  id: string;
  from: string;
  to: string;
  date: string;
  time: string;
  driver: string;
  driverId: string;
  availableSeats: number;
  totalSeats: number;
  pricePerSeat: number;
  car: string;
  status: 'available' | 'full' | 'completed' | 'cancelled';
  createdAt: string;
}

export interface Booking {
  id: string;
  rideId: string;
  passengerId: string;
  passengerName: string;
  seatsBooked: number;
  totalCost: number;
  bookingDate: string;
  status: 'confirmed' | 'cancelled' | 'completed';
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  rating: number;
  totalRides: number;
  joinDate: string;
}

@Injectable({
  providedIn: 'root'
})
export class RidesService {
  private apiUrl = 'http://localhost:3000';
  private currentUserId = 'current-user';
  private username = 'Current User'; // Placeholder for current user's name
  
  // BehaviorSubjects for real-time updates
  private ridesSubject = new BehaviorSubject<Ride[]>([]);
  private bookingsSubject = new BehaviorSubject<Booking[]>([]);
  
  public rides$ = this.ridesSubject.asObservable();
  public bookings$ = this.bookingsSubject.asObservable();

  constructor(private http: HttpClient, private auth: Auth) {
      // Load rides immediately
      this.loadRides();
      
      onAuthStateChanged(this.auth, (user: FirebaseUser | null) => {
          if (user) {
            console.log('User authenticated:', user.uid, user.displayName);
            this.currentUserId = user.uid;
            this.username = user.displayName || 'Current User';
            this.loadRides();
            this.loadBookings();
          } else {
            console.log('No authenticated user');
            // Don't load bookings if no user is authenticated
            this.bookingsSubject.next([]);
          }
      });
  }

  // Method to manually set user (for testing)
  setCurrentUser(userId: string): void {
    this.currentUserId = userId;
    this.loadBookings();
  }

  // Get current user info for debugging
  getCurrentUserId(): string {
    return this.currentUserId;
  }

  // Get current bookings for debugging
  getCurrentBookings(): Observable<Booking[]> {
    return this.bookings$;
  }

  // Debug method to test with specific user ID
  testWithUserId(userId: string): void {
    console.log('Testing with user ID:', userId);
    this.currentUserId = userId;
    this.loadBookings();
  }

  // Get all bookings (for debugging)
  getAllBookings(): Observable<Booking[]> {
    return this.http.get<Booking[]>(`${this.apiUrl}/bookings`);
  }

  // Load all rides
  loadRides(): void {
    this.http.get<Ride[]>(`${this.apiUrl}/rides`).subscribe({
      next: (rides) => {
        console.log('Loaded rides:', rides);
        this.ridesSubject.next(rides);
      },
      error: (error) => {
        console.error('Error loading rides:', error);
      }
    });
  }

  // Load user bookings
  loadBookings(): void {
    if (!this.currentUserId) {
      console.warn('No current user ID available for loading bookings');
      return;
    }
    
    this.http.get<Booking[]>(`${this.apiUrl}/bookings?passengerId=${this.currentUserId}`)
      .subscribe({
        next: (bookings) => {
          console.log('Loaded bookings for user:', this.currentUserId, bookings);
          this.bookingsSubject.next(bookings);
        },
        error: (error) => {
          console.error('Error loading bookings:', error);
        }
      });
  }

  // Get available rides
  getAvailableRides(): Observable<Ride[]> {
    return this.rides$.pipe(
      switchMap(rides => {
        return this.bookings$.pipe(
          map(bookings => {
            // Get IDs of rides already booked by current user
            const bookedRideIds = bookings
              .filter(booking => booking.status === 'confirmed')
              .map(booking => booking.rideId);
            
            // Filter out rides that are:
            // 1. Not available or have no seats
            // 2. Driven by current user
            // 3. Already booked by current user
            return rides.filter(ride => 
              ride.status === 'available' && 
              ride.availableSeats > 0 &&
              ride.driverId !== this.currentUserId &&
              !bookedRideIds.includes(ride.id)
            );
          })
        );
      })
    );
  }

  // Get upcoming rides (booked by current user)
  getUpcomingRides(): Observable<Ride[]> {
    return this.bookings$.pipe(
      switchMap(bookings => {
        const rideIds = bookings
          .filter(booking => booking.status === 'confirmed')
          .map(booking => booking.rideId);
        
        return this.rides$.pipe(
          map(rides => rides.filter(ride => rideIds.includes(ride.id)))
        );
      })
    );
  }

  // Create a new ride
  createRide(rideData: Omit<Ride, 'id' | 'createdAt' | 'driverId' | 'driver'>): Observable<Ride> {
    const newRide: Ride = {
      ...rideData,
      id: Date.now().toString(),
      driverId: this.currentUserId,
      driver: 'Current User', // In real app, get from auth service
      createdAt: new Date().toISOString(),
      status: 'available'
    };

    return this.http.post<Ride>(`${this.apiUrl}/rides`, newRide).pipe(
      tap(() => this.loadRides())
    );
  }

  // Book a ride
  bookRide(rideId: string, seatsToBook: number = 1): Observable<Booking> {
    const ride = this.ridesSubject.value.find(r => r.id === rideId);
    if (!ride || ride.availableSeats < seatsToBook) {
      throw new Error('Not enough seats available');
    }

    // Check for booking conflicts before proceeding
    return this.checkBookingConflict(ride).pipe(
      switchMap((hasConflict: boolean) => {
        if (hasConflict) {
          return throwError(() => new Error('BOOKING_CONFLICT: You have another ride booked at a similar time. Please ensure you have enough time between rides.'));
        }

        const booking: Booking = {
          id: Date.now().toString(),
          rideId: rideId,
          passengerId: this.currentUserId,
          passengerName: 'Current User', // In real app, get from auth service
          seatsBooked: seatsToBook,
          totalCost: ride.pricePerSeat * seatsToBook,
          bookingDate: new Date().toISOString(),
          status: 'confirmed'
        };

        // Update ride seats
        const updatedRide = {
          ...ride,
          availableSeats: ride.availableSeats - seatsToBook
        };

        return this.http.post<Booking>(`${this.apiUrl}/bookings`, booking).pipe(
          tap(() => {
            // Update the ride with new available seats
            this.http.put<Ride>(`${this.apiUrl}/rides/${rideId}`, updatedRide).subscribe(() => {
              this.loadRides();
              this.loadBookings();
            });
          })
        );
      })
    );
  }

  // Cancel a booking
  cancelBooking(bookingId: string): Observable<void> {
    const booking = this.bookingsSubject.value.find(b => b.id === bookingId);
    if (!booking) {
      throw new Error('Booking not found');
    }

    const ride = this.ridesSubject.value.find(r => r.id === booking.rideId);
    if (ride) {
      const updatedRide = {
        ...ride,
        availableSeats: ride.availableSeats + booking.seatsBooked
      };

      // Update ride seats and delete booking
      return this.http.put<Ride>(`${this.apiUrl}/rides/${booking.rideId}`, updatedRide).pipe(
        tap(() => {
          this.http.delete(`${this.apiUrl}/bookings/${bookingId}`).subscribe(() => {
            this.loadRides();
            this.loadBookings();
          });
        }),
        map(() => void 0)
      );
    }

    return this.http.delete(`${this.apiUrl}/bookings/${bookingId}`).pipe(
      tap(() => this.loadBookings()),
      map(() => void 0)
    );
  }

  // Get user profile
  getCurrentUser(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/users/${this.currentUserId}`);
  }

  // Search rides
  searchRides(from?: string, to?: string, date?: string): Observable<Ride[]> {
    let url = `${this.apiUrl}/rides?status=available`;
    
    if (from) url += `&from_like=${encodeURIComponent(from)}`;
    if (to) url += `&to_like=${encodeURIComponent(to)}`;
    if (date) url += `&date=${date}`;
    
    return this.http.get<Ride[]>(url);
  }

  // Check for booking time conflicts
  checkBookingConflict(rideToBook: Ride): Observable<boolean> {
    return this.getUpcomingRides().pipe(
      map(upcomingRides => {
        return upcomingRides.some(existingRide => 
          this.hasTimeOverlap(existingRide, rideToBook)
        );
      })
    );
  }

  // Helper method to check if two rides have time overlap
  private hasTimeOverlap(ride1: Ride, ride2: Ride): boolean {
    // If rides are on different dates, no overlap
    if (ride1.date !== ride2.date) {
      return false;
    }

    // Parse times and add buffer time (e.g., 30 minutes before and after)
    const bufferMinutes = 30;
    const ride1StartTime = this.parseTimeWithBuffer(ride1.time, -bufferMinutes);
    const ride1EndTime = this.parseTimeWithBuffer(ride1.time, bufferMinutes);
    const ride2StartTime = this.parseTimeWithBuffer(ride2.time, -bufferMinutes);
    const ride2EndTime = this.parseTimeWithBuffer(ride2.time, bufferMinutes);

    // Check for overlap: ride1 starts before ride2 ends AND ride2 starts before ride1 ends
    return ride1StartTime < ride2EndTime && ride2StartTime < ride1EndTime;
  }

  // Helper method to parse time and add buffer
  private parseTimeWithBuffer(timeString: string, bufferMinutes: number): number {
    const [hours, minutes] = timeString.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + bufferMinutes;
    return totalMinutes;
  }

  // Get conflicting rides for a specific ride
  getConflictingRides(rideToCheck: Ride): Observable<Ride[]> {
    return this.getUpcomingRides().pipe(
      map(upcomingRides => 
        upcomingRides.filter(existingRide => 
          this.hasTimeOverlap(existingRide, rideToCheck)
        )
      )
    );
  }
}