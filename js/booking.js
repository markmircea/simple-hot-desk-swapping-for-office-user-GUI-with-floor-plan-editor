// Booking Management
class BookingManager {
    constructor(floorPlan) {
        this.floorPlan = floorPlan;
        this.currentDate = null;
        this.users = [];
        this.bookings = [];
    }

    async init() {
        await this.loadUsers();
        this.setupEventListeners();
        this.setDefaultDate();
    }

    setupEventListeners() {
        // Date picker change
        document.getElementById('booking-date').addEventListener('change', (e) => {
            this.currentDate = e.target.value;
            this.loadBookings();
            this.updateDateDisplay();
        });

        // Previous day button
        document.getElementById('prev-day-btn').addEventListener('click', () => {
            this.changeDate(-1);
        });

        // Next day button
        document.getElementById('next-day-btn').addEventListener('click', () => {
            this.changeDate(1);
        });

        // Modal controls
        document.getElementById('confirm-booking').addEventListener('click', () => {
            this.confirmBooking();
        });

        document.getElementById('cancel-booking').addEventListener('click', () => {
            this.cancelBooking();
        });

        document.getElementById('close-modal').addEventListener('click', () => {
            this.closeBookingModal();
        });

        // Modal close buttons
        document.querySelectorAll('.modal .close').forEach(closeBtn => {
            closeBtn.addEventListener('click', (e) => {
                e.target.closest('.modal').style.display = 'none';
            });
        });

        // Clear other field when one is selected/typed
        document.getElementById('user-select').addEventListener('change', () => {
            if (document.getElementById('user-select').value) {
                document.getElementById('new-user-booking').value = '';
            }
        });

        document.getElementById('new-user-booking').addEventListener('input', () => {
            if (document.getElementById('new-user-booking').value) {
                document.getElementById('user-select').value = '';
            }
        });

        // Keyboard shortcuts for date navigation
        document.addEventListener('keydown', (e) => {
            // Don't trigger if user is typing in an input field
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            
            if (e.key === 'ArrowLeft') {
                this.changeDate(-1);
            } else if (e.key === 'ArrowRight') {
                this.changeDate(1);
            }
        });
    }

    setDefaultDate() {
        const today = new Date();
        const dateStr = today.toISOString().split('T')[0];
        document.getElementById('booking-date').value = dateStr;
        // Remove min date to allow viewing past bookings
        this.currentDate = dateStr;
        this.loadBookings();
        this.updateDateDisplay();
    }

    changeDate(days) {
        const currentDate = new Date(this.currentDate);
        currentDate.setDate(currentDate.getDate() + days);
        const newDateStr = currentDate.toISOString().split('T')[0];
        
        document.getElementById('booking-date').value = newDateStr;
        this.currentDate = newDateStr;
        this.loadBookings();
        this.updateDateDisplay();
    }

    updateDateDisplay() {
        const date = new Date(this.currentDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        date.setHours(0, 0, 0, 0);
        
        // Update the selected info to show if viewing past/future
        let dateInfo = '';
        if (date < today) {
            dateInfo = ' (Past)';
        } else if (date > today) {
            dateInfo = ' (Future)';
        } else {
            dateInfo = ' (Today)';
        }
        
        const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
        const formattedDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        
        // Update header or info area with formatted date
        const infoElement = document.getElementById('selected-info');
        if (infoElement && infoElement.textContent === 'Click on a seat to book') {
            infoElement.textContent = `${dayName}, ${formattedDate}${dateInfo} - Click on a seat to book`;
        }
    }

    async loadUsers() {
        try {
            const response = await fetch(`${CONFIG.API_URL}users.php`);
            const data = await response.json();
            
            if (data.success) {
                this.users = data.users;
                this.updateUserSelect();
            }
        } catch (error) {
            console.error('Error loading users:', error);
            // Use default users if API fails
            this.users = [
                { id: 1, name: 'John Doe' },
                { id: 2, name: 'Jane Smith' },
                { id: 3, name: 'Bob Johnson' }
            ];
            this.updateUserSelect();
        }
    }

    updateUserSelect() {
        const select = document.getElementById('user-select');
        select.innerHTML = '<option value="">Choose from list...</option>';
        
        this.users.forEach(user => {
            const option = document.createElement('option');
            option.value = user.id;
            option.textContent = user.name;
            select.appendChild(option);
        });
    }

    async loadBookings() {
        if (!this.currentDate) return;

        try {
            const response = await fetch(`${CONFIG.API_URL}bookings.php?date=${this.currentDate}`);
            const data = await response.json();
            
            if (data.success) {
                this.bookings = data.bookings;
                this.floorPlan.updateAllSeats(this.bookings);
            }
        } catch (error) {
            console.error('Error loading bookings:', error);
            // Clear bookings if API fails
            this.bookings = [];
            this.floorPlan.updateAllSeats([]);
        }
    }

    openBookingModal(seatId) {
        const modal = document.getElementById('booking-modal');
        const seatInfo = this.floorPlan.getSeatInfo(seatId);
        
        if (!seatInfo) return;

        // Check if seat is already booked
        const existingBooking = this.bookings.find(b => b.seat_id == seatId);
        
        document.getElementById('modal-title').textContent = `Book ${seatInfo.name}`;
        document.getElementById('user-select').value = '';
        document.getElementById('new-user-booking').value = '';
        
        if (existingBooking) {
            document.getElementById('existing-booking').style.display = 'block';
            document.getElementById('booked-by').textContent = existingBooking.user_name;
            document.getElementById('confirm-booking').style.display = 'none';
            document.getElementById('cancel-booking').style.display = 'block';
            document.getElementById('user-select').parentElement.style.display = 'none';
            document.getElementById('new-user-booking').parentElement.style.display = 'none';
        } else {
            document.getElementById('existing-booking').style.display = 'none';
            document.getElementById('confirm-booking').style.display = 'block';
            document.getElementById('cancel-booking').style.display = 'none';
            document.getElementById('user-select').parentElement.style.display = 'block';
            document.getElementById('new-user-booking').parentElement.style.display = 'block';
        }
        
        modal.style.display = 'block';
        modal.setAttribute('data-seat-id', seatId);
    }

    closeBookingModal() {
        document.getElementById('booking-modal').style.display = 'none';
        const seatId = document.getElementById('booking-modal').getAttribute('data-seat-id');
        
        // Remove selection if not booked
        if (seatId && !this.bookings.find(b => b.seat_id == seatId)) {
            const seat = document.querySelector(`rect[data-seat-id="${seatId}"], rect[data-room-id="${seatId}"]`);
            if (seat) {
                seat.classList.remove('selected');
            }
        }
    }

    async confirmBooking() {
        const modal = document.getElementById('booking-modal');
        const seatId = modal.getAttribute('data-seat-id');
        let userId = document.getElementById('user-select').value;
        let userName = '';
        const newUserName = document.getElementById('new-user-booking').value.trim();
        
        // Check if we need to create a new user
        if (newUserName) {
            // Create new user first
            try {
                const response = await fetch(`${CONFIG.API_URL}users.php`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        name: newUserName,
                        email: ''
                    })
                });

                const data = await response.json();
                
                if (data.success) {
                    userId = data.user_id;
                    userName = newUserName;
                    // Add to local users list
                    this.users.push({
                        id: userId,
                        name: newUserName,
                        email: ''
                    });
                    this.updateUserSelect();
                } else {
                    // If user creation fails, still allow booking with the name
                    userId = Date.now();
                    userName = newUserName;
                }
            } catch (error) {
                console.error('Error creating user:', error);
                // Continue with booking even if user creation fails
                userId = Date.now();
                userName = newUserName;
            }
        } else if (userId) {
            // Use existing user
            const user = this.users.find(u => u.id == userId);
            if (!user) {
                alert('Please select a user or enter a new name');
                return;
            }
            userName = user.name;
        } else {
            alert('Please select a user or enter a new name');
            return;
        }

        // Now create the booking
        try {
            const response = await fetch(`${CONFIG.API_URL}bookings.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    seat_id: seatId,
                    user_id: userId,
                    user_name: userName,
                    date: this.currentDate
                })
            });

            const data = await response.json();
            
            if (data.success) {
                this.floorPlan.updateSeatStatus(seatId, true, userName);
                this.bookings.push({
                    seat_id: seatId,
                    user_id: userId,
                    user_name: userName,
                    date: this.currentDate
                });
                this.closeBookingModal();
                this.showInfo(`${userName} booked ${this.floorPlan.getSeatInfo(seatId).name} for ${this.currentDate}`);
            } else {
                alert('Failed to book seat: ' + (data.message || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error booking seat:', error);
            // Simulate booking for demo purposes
            this.floorPlan.updateSeatStatus(seatId, true, userName);
            this.bookings.push({
                seat_id: seatId,
                user_id: userId,
                user_name: userName,
                date: this.currentDate
            });
            this.closeBookingModal();
            this.showInfo(`${userName} booked ${this.floorPlan.getSeatInfo(seatId).name} for ${this.currentDate}`);
        }
    }

    async cancelBooking() {
        const modal = document.getElementById('booking-modal');
        const seatId = modal.getAttribute('data-seat-id');
        
        const booking = this.bookings.find(b => b.seat_id == seatId);
        if (!booking) return;

        if (confirm(`Are you sure you want to cancel the booking for ${booking.user_name}?`)) {
            try {
                const response = await fetch(`${CONFIG.API_URL}bookings.php`, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        seat_id: seatId,
                        date: this.currentDate
                    })
                });

                const data = await response.json();
                
                if (data.success) {
                    this.floorPlan.updateSeatStatus(seatId, false);
                    this.bookings = this.bookings.filter(b => b.seat_id != seatId);
                    this.closeBookingModal();
                    this.showInfo(`Booking cancelled for ${this.floorPlan.getSeatInfo(seatId).name}`);
                } else {
                    alert('Failed to cancel booking: ' + (data.message || 'Unknown error'));
                }
            } catch (error) {
                console.error('Error cancelling booking:', error);
                // Simulate cancellation for demo purposes
                this.floorPlan.updateSeatStatus(seatId, false);
                this.bookings = this.bookings.filter(b => b.seat_id != seatId);
                this.closeBookingModal();
                this.showInfo(`Booking cancelled for ${this.floorPlan.getSeatInfo(seatId).name}`);
            }
        }
    }

    showInfo(message) {
        document.getElementById('selected-info').textContent = message;
        setTimeout(() => {
            this.updateDateDisplay();
        }, 3000);
    }
}