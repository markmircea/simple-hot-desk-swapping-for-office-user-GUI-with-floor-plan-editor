# Office Seat Booking Application

A simple web-based seat booking system for office hot-desking, designed to run on shared hosting environments like A2 Hosting.

## Features

- Visual floor plan with 42 desk seats and 2 meeting rooms
- Daily booking system with date picker
- User management (preloaded users + admin can add more)
- No authentication required (open booking system)
- Click-to-book interface
- Color-coded availability (green = available, red = booked)
- Responsive design

## Technical Stack

- **Frontend**: Pure HTML, CSS, JavaScript (no build process required)
- **Backend**: PHP 7.4+
- **Database**: SQLite (file-based, no setup required)
- **Hosting**: Compatible with any shared hosting with PHP support

## Installation

1. **Upload Files**: Upload all files to your web server (e.g., via FTP or cPanel File Manager)

2. **Directory Structure**: Ensure your files are organized as follows:
   ```
   public_html/seatbooking/
   ├── index.html
   ├── setup.php
   ├── css/
   ├── js/
   ├── api/
   └── database/
   ```

3. **Run Setup**: Navigate to `https://yourdomain.com/seatbooking/setup.php` in your browser

4. **Start Using**: After setup completes, go to `https://yourdomain.com/seatbooking/`

## File Permissions

Ensure the following directories are writable by PHP:
- `database/` - For SQLite database file (chmod 755)

## Configuration

The application works out of the box with sensible defaults:
- 42 desk seats arranged in 7 rows × 6 columns
- 2 meeting rooms
- 10 preloaded users
- SQLite database (no configuration needed)

## Usage

### Booking a Seat
1. Select a date using the date picker
2. Click on an available (green) seat
3. Select a user from the dropdown
4. Click "Book Seat"

### Canceling a Booking
1. Click on a booked (red) seat
2. Click "Cancel Booking"
3. Confirm cancellation

### Admin Functions
1. Click the "Admin" button
2. Add new users with name and optional email
3. View list of all users

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Troubleshooting

### Database Issues
- Run `setup.php` again to reinitialize the database
- Check that `database/` directory has write permissions

### API Not Working
- Ensure PHP 7.4+ is installed
- Check that `.htaccess` files are being processed
- Verify CORS headers are set correctly

## Security Notes

This is a simple booking system without authentication. For production use, consider:
- Adding user authentication
- Implementing access controls
- Using HTTPS
- Regular backups of the SQLite database

## License

Free to use and modify for your organization.