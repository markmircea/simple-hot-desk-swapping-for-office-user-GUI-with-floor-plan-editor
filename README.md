# Office Seat Booking System

A comprehensive web-based hot-desking and meeting room booking system designed for office environments. Features visual floor plan management, daily seat reservations, and admin controls.

## 📋 Table of Contents

- [Features](#features)
- [System Requirements](#system-requirements)
- [Installation & Deployment](#installation--deployment)
- [User Guide](#user-guide)
- [Admin Guide](#admin-guide)
- [Technical Details](#technical-details)
- [Troubleshooting](#troubleshooting)

## ✨ Features

### For All Users
- **Visual Floor Plan**: Interactive SVG-based office layout showing all desks and meeting rooms
- **Daily Booking System**: Book seats for specific dates
- **Historical View**: Browse past bookings with arrow navigation or date picker
- **User Name Display**: See who has booked each seat
- **Quick Booking**: Click any available seat to book instantly
- **Date Navigation**: Use arrow keys (← →) or buttons to navigate between days

### For Administrators
- **Floor Plan Editor**: Drag-and-drop interface to customize office layout
- **User Management**: Add/delete users from the system
- **Area Labels**: Add text labels to identify different zones (Engineering, Sales, Reception, etc.)
- **Dynamic Seating**: Add/remove desks and meeting rooms as needed
- **Password Protection**: Secure admin functions with changeable password
- **Persistent Layouts**: All changes are saved to database

## 💻 System Requirements

### Hosting Requirements
- **PHP 7.4+** (works on shared hosting like A2 Hosting)
- **SQLite** support (or MySQL)
- **Apache** with `.htaccess` support
- **No Node.js required** - pure HTML/CSS/JavaScript frontend

### Browser Support
- Chrome (recommended)
- Firefox
- Safari
- Edge
- Mobile browsers supported

## 🚀 Installation & Deployment

### Quick Setup (Shared Hosting)

1. **Upload Files**
   - Upload all files to your web server via FTP or cPanel File Manager
   - Place in a subdirectory like `public_html/seatbooking/`

2. **Directory Structure**
   ```
   seatbooking/
   ├── index.html          # Main application
   ├── setup-database.php  # Database setup script
   ├── api/               # PHP backend endpoints
   ├── css/               # Stylesheets
   ├── js/                # JavaScript files
   └── database/          # SQLite database (created automatically)
   ```

3. **Run Setup**
   - Navigate to `https://yourdomain.com/seatbooking/setup-database.php`
   - This will create the database and populate initial data
   - You'll see a success message with statistics

4. **Start Using**
   - Go to `https://yourdomain.com/seatbooking/`
   - Default admin password: `tpgcluj`

### Local Development Setup

1. **Start PHP Server**
   ```bash
   cd seatbooking
   php -S localhost:8000
   ```

2. **Run Setup**
   - Open browser to `http://localhost:8000/setup-database.php`

3. **Access Application**
   - Navigate to `http://localhost:8000/`

## 📖 User Guide

### Booking a Seat

1. **Select Date**
   - Use the date picker or arrow buttons to choose a day
   - Past dates show historical bookings
   - Future dates allow new bookings

2. **Choose a Seat**
   - Green seats = Available
   - Red seats = Booked
   - Click any green seat or meeting room

3. **Book the Seat**
   - Select your name from dropdown OR
   - Type a new name to create a new user
   - Click "Book Seat"

4. **Cancel a Booking**
   - Click on a red (booked) seat
   - Click "Cancel Booking"
   - Confirm cancellation

### Navigating Dates

- **Arrow Buttons**: Click ◀ or ▶ to move one day
- **Date Picker**: Click calendar input to jump to specific date
- **Keyboard**: Use ← → arrow keys (when not typing)
- **Date Info**: Shows (Past), (Today), or (Future) for context

### Understanding the Floor Plan

- **Desk Numbers**: Shown on available seats
- **User Names**: Displayed on booked seats
- **Area Labels**: Gray text identifying different zones
- **Meeting Rooms**: Larger blue rectangles
- **Grid Background**: Helps visualize the space

## 🔐 Admin Guide

### Initial Login

1. Click "Admin Login" button
2. Enter password: `tpgcluj`
3. Admin buttons appear:
   - Admin Panel
   - Edit Floor Plan
   - Logout

### Admin Panel Features

#### User Management
- **Add Users**: Enter name and optional email
- **Delete Users**: Click delete button next to user
- **View All Users**: See complete user list

#### Change Admin Password
1. Go to Admin Panel
2. Scroll to "Change Admin Password"
3. Enter new password (minimum 6 characters)
4. Confirm password
5. Click "Change Password"

### Floor Plan Editor

#### Accessing Editor
1. Login as admin
2. Click "Edit Floor Plan"

#### Adding Elements

**Add Desk**
- Click "Add Desk"
- New desk appears in center (orange highlight)
- Drag to desired position
- Automatically numbered sequentially

**Add Meeting Room**
- Click "Add Meeting Room"
- Enter room name
- Drag to position

**Add Area Label**
- Click "Add Label"
- Enter label text (e.g., "Engineering", "Kitchen")
- Drag to position
- Labels are display-only (not bookable)

#### Modifying Layout

**Move Items**
- Click and drag any desk, room, or label
- Items snap to grid automatically
- Release to place

**Delete Items**
1. Click "Delete Mode" (button turns red)
2. Click any item to delete
3. Confirm deletion
4. Click "Delete Mode" again to exit

#### Saving Changes
- Click "Save Layout" to persist changes
- Changes immediately visible on main page
- All bookings preserved

#### Reset to Default
- Click "Reset to Default"
- Restores original 42-desk layout
- Removes all customizations

### Managing the System

#### Database Management
- SQLite database at `database/seatbooking.db`
- Backup regularly by copying this file
- To reset: Delete file and run setup again

#### Fresh Installation
- Navigate to `setup-database.php?fresh=true`
- Confirms deletion of all data
- Creates clean database

## 🔧 Technical Details

### Architecture

```
Frontend (Pure JavaScript)
    ↓
PHP API (RESTful endpoints)
    ↓
SQLite Database (or MySQL)
```

### API Endpoints

- `GET/POST api/users.php` - User management
- `GET/POST/DELETE api/bookings.php` - Booking operations
- `GET api/seats.php` - Seat layout data
- `POST api/update-layout.php` - Save floor plan
- `POST api/reset-layout.php` - Reset to default
- `POST api/admin-auth.php` - Admin authentication

### Database Schema

**users**
- id, name, email, is_admin, created_at

**seats**
- id, seat_number, seat_type, x_position, y_position, width, height

**bookings**
- id, user_id, user_name, seat_id, booking_date, created_at

### Key Technologies
- **Frontend**: Vanilla JavaScript, SVG for floor plan
- **Backend**: PHP 7.4+
- **Database**: SQLite (portable) or MySQL
- **No build process**: Direct deployment via FTP

## 🐛 Troubleshooting

### Common Issues

**"Failed to book seat"**
- Check database directory has write permissions (755)
- Ensure SQLite is enabled in PHP
- Try running setup script again

**Floor plan not displaying**
- Clear browser cache
- Check JavaScript console for errors
- Verify all files uploaded correctly

**Can't login as admin**
- Default password: `tpgcluj`
- Check browser allows localStorage
- Try incognito/private mode

**Changes not saving**
- Verify database file is writable
- Check PHP error logs
- Ensure .htaccess is processed

### File Permissions

Set these permissions via FTP/cPanel:
```
database/           755
database/*.db       644
api/                755
api/*.php           644
```

### Browser Console Errors

Open Developer Tools (F12) and check Console tab for:
- Network errors (API calls failing)
- JavaScript errors (missing files)
- CORS issues (check .htaccess)

## 📱 Mobile Support

The application is responsive and works on tablets/phones:
- Touch to select seats
- Pinch to zoom floor plan
- Date navigation adapts to screen size
- Admin functions available (though better on desktop)

## 🔒 Security Considerations

### Production Deployment
1. Change default admin password immediately
2. Use HTTPS for all connections
3. Restrict database directory access via .htaccess
4. Regular backups of SQLite database
5. Consider implementing user authentication
6. Add rate limiting for API endpoints

### Data Privacy
- No personal data collected beyond names
- All data stored locally on your server
- No external services or tracking
- GDPR compliant with proper notices

## 📝 License & Credits

- Built for office hot-desking management
- Customizable for your organization's needs
- Uses SQLite for simple, portable database
- Pure JavaScript - no heavy frameworks

## 🆘 Support

For issues or questions:
1. Check this README thoroughly
2. Review browser console for errors
3. Verify all files uploaded correctly
4. Check server PHP configuration
5. Test with default setup before customizing

## 🎯 Quick Start Checklist

- [ ] Upload all files to web server
- [ ] Run `setup-database.php`
- [ ] Test booking a seat
- [ ] Login as admin (password: `tpgcluj`)
- [ ] Change admin password
- [ ] Customize floor plan if needed
- [ ] Add your office users
- [ ] Deploy to production

---

**Version**: 1.0.0  
**Last Updated**: January 2024  
**Minimum PHP**: 7.4  
**Database**: SQLite/MySQL  
**Frontend**: Pure JavaScript