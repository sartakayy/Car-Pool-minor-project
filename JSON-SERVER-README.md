# Car Pool Application - JSON Server Setup

This application now uses JSON Server to manage ride data through a REST API.

## Prerequisites

- Node.js and npm installed
- Angular CLI installed

## Running the Application

### Option 1: Run servers separately

1. **Start JSON Server** (in one terminal):
   ```bash
   npm run json-server
   ```
   This starts the API server on `http://localhost:3001`

2. **Start Angular Development Server** (in another terminal):
   ```bash
   npm start
   ```
   This starts the frontend on `http://localhost:4200`

### Option 2: Use the development script

1. Make the script executable:
   ```bash
   chmod +x start-dev.sh
   ```

2. Run both servers:
   ```bash
   npm run dev
   ```

## API Endpoints

The JSON Server provides the following endpoints:

- **GET /rides** - Get all rides
- **POST /rides** - Create a new ride
- **PUT /rides/:id** - Update a ride
- **DELETE /rides/:id** - Delete a ride

- **GET /bookings** - Get all bookings
- **POST /bookings** - Create a new booking
- **DELETE /bookings/:id** - Cancel a booking

- **GET /users** - Get all users
- **GET /users/:id** - Get a specific user

## Data Structure

### Rides
```json
{
  "id": "string",
  "from": "string",
  "to": "string", 
  "date": "YYYY-MM-DD",
  "time": "HH:MM",
  "driver": "string",
  "driverId": "string",
  "availableSeats": number,
  "totalSeats": number,
  "pricePerSeat": number,
  "car": "string",
  "status": "available|full|completed|cancelled",
  "createdAt": "ISO date string"
}
```

### Bookings
```json
{
  "id": "string",
  "rideId": "string",
  "passengerId": "string", 
  "passengerName": "string",
  "seatsBooked": number,
  "totalCost": number,
  "bookingDate": "ISO date string",
  "status": "confirmed|cancelled|completed"
}
```

### Users
```json
{
  "id": "string",
  "name": "string",
  "email": "string",
  "phone": "string",
  "rating": number,
  "totalRides": number,
  "joinDate": "YYYY-MM-DD"
}
```

## Features

- ✅ Real-time data persistence
- ✅ REST API integration
- ✅ Ride creation and booking
- ✅ Booking cancellation
- ✅ Automatic seat management
- ✅ Error handling and loading states
- ✅ Responsive UI design

## Database File

The data is stored in `db.json` file. You can modify this file directly to add/edit data, and JSON Server will automatically reload the changes.

## Development Notes

- The application uses Angular's HttpClient for API calls
- RxJS observables handle real-time data updates
- The RidesService manages all API interactions
- Data is automatically synchronized between the UI and JSON Server

## Next Steps

To extend this application, you could:
- Add user authentication integration
- Implement real-time updates with WebSockets
- Add search and filtering capabilities
- Integrate with a mapping service
- Add payment processing
- Deploy to a cloud platform