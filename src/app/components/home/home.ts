import { Component, OnInit, OnDestroy } from '@angular/core';
import { Auth, authState, signOut } from '@angular/fire/auth';
import { Router } from '@angular/router';
import { filter, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RidesService, Ride, Booking } from '../../services/rides.service';

@Component({
  selector: 'app-home',
  imports: [CommonModule, FormsModule],
  templateUrl: './home.html',
  styleUrl: './home.scss'
})
export class Home implements OnInit, OnDestroy {
  user: any;
  activeTab: string = 'upcoming';
  showOfferRideModal: boolean = false;
  private destroy$ = new Subject<void>();

  // Ride data from service
  upcomingRides: Ride[] = [];
  availableRides: Ride[] = [];
  filteredAvailableRides: Ride[] = [];
  filteredUpcomingRides: Ride[] = [];
  loading = false;
  error: string | null = null;

  // Search functionality
  searchQuery: string = '';
  showAdvancedFilters: boolean = false;
  filteredRidesCount: number | null = null;
  
  // Conflict tracking
  conflictingRides: Set<string> = new Set();
  
  searchFilters = {
    startDate: '',
    endDate: '',
    maxPrice: null as number | null,
    minSeats: ''
  };

  // New ride form data
  newRide = {
    from: '',
    to: '',
    date: '',
    time: '',
    availableSeats: 1,
    totalSeats: 1,
    pricePerSeat: 0,
    car: ''
  };

  constructor(
    private auth: Auth, 
    private router: Router,
    private ridesService: RidesService
  ) {}

  ngOnInit(): void {
    authState(this.auth).pipe(
      filter(user => !!user),
      takeUntil(this.destroy$)
    ).subscribe((user) => {
      this.user = user.displayName;
    });

    this.loadRidesData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadRidesData(): void {
    this.loading = true;
    
    // Debug: Check current user ID
    console.log('Current user ID:', this.ridesService.getCurrentUserId());
    
    // Load available rides
    this.ridesService.getAvailableRides()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (rides: Ride[]) => {
          console.log('Available rides loaded:', rides.length);
          this.availableRides = rides;
          this.filteredAvailableRides = rides;
          this.checkForConflictingRides();
          this.applySearchAndFilters();
          this.loading = false;
        },
        error: (err: any) => {
          console.error('Error loading available rides:', err);
          this.error = 'Failed to load available rides';
          this.loading = false;
        }
      });

    // Load upcoming rides
    this.ridesService.getUpcomingRides()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (rides: Ride[]) => {
          console.log('Upcoming rides loaded:', rides.length, rides);
          this.upcomingRides = rides;
          this.filteredUpcomingRides = rides; // Always show all upcoming rides
        },
        error: (err: any) => {
          console.error('Error loading upcoming rides:', err);
          this.error = 'Failed to load upcoming rides';
        }
      });
    
    // Debug: Check current bookings
    this.ridesService.getCurrentBookings()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (bookings: Booking[]) => {
          console.log('Current bookings:', bookings.length, bookings);
        },
        error: (err: any) => {
          console.error('Error loading bookings:', err);
        }
      });
      
    // Debug: Get all bookings to see what's in the database
    this.ridesService.getAllBookings()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (allBookings: Booking[]) => {
          console.log('All bookings in database:', allBookings);
        },
        error: (err: any) => {
          console.error('Error loading all bookings:', err);
        }
      });
  }

  // Debug method to test with specific user ID
  testWithFirebaseUser(): void {
    console.log('Testing with Firebase user ID from database');
    this.ridesService.testWithUserId('mbAITkFGa6WQk5J2vec8GACDi3D2');
    
    // Reload data after a short delay
    setTimeout(() => {
      this.loadRidesData();
    }, 1000);
  }

  async onLogoutPress() {
    await signOut(this.auth);
    this.router.navigate(['/login'])
  }

  setActiveTab(tab: string) {
    // Clear search and filters when switching away from available tab
    if (this.activeTab === 'available' && tab !== 'available') {
      this.clearAllFilters();
    }
    
    this.activeTab = tab;
    this.applySearchAndFilters();
  }

  openOfferRideModal() {
    this.showOfferRideModal = true;
  }

  closeOfferRideModal() {
    this.showOfferRideModal = false;
    this.resetNewRideForm();
  }

  resetNewRideForm() {
    this.newRide = {
      from: '',
      to: '',
      date: '',
      time: '',
      availableSeats: 1,
      totalSeats: 1,
      pricePerSeat: 0,
      car: ''
    };
  }

  onOfferRide() {
    if (this.isFormValid()) {
      this.loading = true;
      
      const rideData = {
        from: this.newRide.from,
        to: this.newRide.to,
        date: this.newRide.date,
        time: this.newRide.time,
        availableSeats: this.newRide.availableSeats,
        totalSeats: this.newRide.availableSeats,
        pricePerSeat: this.newRide.pricePerSeat,
        car: this.newRide.car,
        status: 'available' as const
      };
      
      this.ridesService.createRide(rideData).subscribe({
        next: () => {
          this.closeOfferRideModal();
          this.setActiveTab('available');
          this.loading = false;
          alert('Ride offered successfully!');
        },
        error: (err: any) => {
          console.error('Error creating ride:', err);
          this.error = 'Failed to create ride';
          this.loading = false;
          alert('Failed to create ride. Please try again.');
        }
      });
    }
  }

  isFormValid(): boolean {
    return !!(this.newRide.from && this.newRide.to && this.newRide.date && 
              this.newRide.time && this.newRide.car && this.newRide.pricePerSeat > 0);
  }

  bookRide(ride: Ride) {
    if (ride.availableSeats > 0) {
      this.loading = true;
      
      this.ridesService.bookRide(ride.id).subscribe({
        next: () => {
          this.loading = false;
          alert('Ride booked successfully!');
        },
        error: (err: any) => {
          console.error('Error booking ride:', err);
          this.loading = false;
          
          // Handle specific booking conflict error
          if (err.message && err.message.includes('BOOKING_CONFLICT')) {
            const conflictMessage = err.message.replace('BOOKING_CONFLICT: ', '');
            this.showConflictDialog(ride, conflictMessage);
          } else {
            alert('Failed to book ride. Please try again.');
          }
        }
      });
    }
  }

  private showConflictDialog(ride: Ride, message: string) {
    const userConfirmed = confirm(
      `⚠️ Booking Conflict Detected\n\n` +
      `${message}\n\n` +
      `Ride Details:\n` +
      `📍 ${ride.from} → ${ride.to}\n` +
      `📅 ${ride.date} at ${ride.time}\n` +
      `💰 $${ride.pricePerSeat} per seat\n\n` +
      `Would you like to view your upcoming rides to check for conflicts?`
    );
    
    if (userConfirmed) {
      this.setActiveTab('upcoming');
    }
  }

  cancelRide(ride: Ride) {
    // Find the booking for this ride
    this.ridesService.bookings$.pipe(takeUntil(this.destroy$)).subscribe((bookings: Booking[]) => {
      const booking = bookings.find((b: Booking) => b.rideId === ride.id && b.status === 'confirmed');
      
      if (booking) {
        this.loading = true;
        
        this.ridesService.cancelBooking(booking.id).subscribe({
          next: () => {
            this.loading = false;
            alert('Ride cancelled successfully!');
          },
          error: (err: any) => {
            console.error('Error cancelling ride:', err);
            this.loading = false;
            alert('Failed to cancel ride. Please try again.');
          }
        });
      }
    });
  }

  deleteRide(ride: Ride) {
    const confirmDelete = confirm(
      `⚠️ Delete Ride Confirmation\n\n` +
      `Are you sure you want to delete this ride?\n\n` +
      `📍 ${ride.from} → ${ride.to}\n` +
      `📅 ${ride.date} at ${ride.time}\n` +
      `🚗 ${ride.car}\n` +
      `💰 $${ride.pricePerSeat} per seat\n\n` +
      `This action cannot be undone and will cancel any existing bookings.`
    );

    if (confirmDelete) {
      this.loading = true;
      
      this.ridesService.deleteRide(ride.id).subscribe({
        next: () => {
          this.loading = false;
          alert('Ride deleted successfully!');
        },
        error: (err: any) => {
          console.error('Error deleting ride:', err);
          this.loading = false;
          alert(err.message || 'Failed to delete ride. Please try again.');
        }
      });
    }
  }

  // Check if current user is the driver of a ride
  isUserDriver(ride: Ride): boolean {
    return this.ridesService.isUserDriver(ride);
  }

  // Search and Filter Methods
  onSearchChange(): void {
    this.applySearchAndFilters();
  }

  onFilterChange(): void {
    this.applySearchAndFilters();
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.applySearchAndFilters();
  }

  toggleAdvancedFilters(): void {
    this.showAdvancedFilters = !this.showAdvancedFilters;
  }

  clearAllFilters(): void {
    this.searchQuery = '';
    this.searchFilters = {
      startDate: '',
      endDate: '',
      maxPrice: null,
      minSeats: ''
    };
    this.showAdvancedFilters = false; // Also close the advanced filters panel
    this.applySearchAndFilters();
  }

  applySearchAndFilters(): void {
    // Only filter available rides when search/filters are active
    if (this.activeTab === 'available') {
      this.filteredAvailableRides = this.availableRides.filter(ride => this.matchesSearchCriteria(ride));
      this.filteredRidesCount = this.filteredAvailableRides.length;
    } else {
      // For other tabs, show all rides without filtering
      this.filteredUpcomingRides = this.upcomingRides;
      this.filteredRidesCount = null; // Don't show count for non-searchable tabs
    }
  }

  private matchesSearchCriteria(ride: Ride): boolean {
    // Text search
    if (this.searchQuery && this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase().trim();
      const searchableText = `${ride.from} ${ride.to} ${ride.driver || ''} ${ride.car || ''}`.toLowerCase();
      if (!searchableText.includes(query)) {
        return false;
      }
    }

    // Date range filter
    if (this.searchFilters.startDate) {
      if (ride.date < this.searchFilters.startDate) {
        return false;
      }
    }
    
    if (this.searchFilters.endDate) {
      if (ride.date > this.searchFilters.endDate) {
        return false;
      }
    }

    // Price filter
    if (this.searchFilters.maxPrice !== null && this.searchFilters.maxPrice > 0) {
      if (ride.pricePerSeat > this.searchFilters.maxPrice) {
        return false;
      }
    }

    // Seats filter
    if (this.searchFilters.minSeats && this.searchFilters.minSeats !== '') {
      const minSeats = parseInt(this.searchFilters.minSeats);
      if (ride.availableSeats < minSeats) {
        return false;
      }
    }

    return true;
  }

  // Check for conflicting rides and mark them
  checkForConflictingRides(): void {
    this.conflictingRides.clear();
    
    this.availableRides.forEach(ride => {
      this.ridesService.checkBookingConflict(ride).subscribe({
        next: (hasConflict: boolean) => {
          if (hasConflict) {
            this.conflictingRides.add(ride.id);
          }
        },
        error: (err: any) => {
          console.warn('Error checking conflict for ride:', ride.id, err);
        }
      });
    });
  }

  // Check if a specific ride has conflicts
  hasConflict(rideId: string): boolean {
    return this.conflictingRides.has(rideId);
  }

  // Get conflict warning message for a ride
  getConflictWarning(ride: Ride): string {
    if (this.hasConflict(ride.id)) {
      return `⚠️ This ride may conflict with your existing bookings (${ride.date} at ${ride.time})`;
    }
    return '';
  }
}
