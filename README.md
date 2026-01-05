# ClathraEnergies

This project is the **backend for the ClathraEnergies website**, including a full **CMS** that allows admins to manage all content, styles, services, and job listings. A **super admin** can create sub-admins with specific permissions, while sub-admins complete their account setup securely.

## Features
- Full **CMS backend** for website content, styles, services, and job listings ....
- Super admin creates sub-admins with custom permissions
- RESTful APIs for frontend integration
- Role-based access control and secure authentication
- Admins can update content dynamically without code changes

## Tech Stack
- Backend: **NestJS (Node.js)**
- Database: **MongoDB**
- Authentication & Authorization: JWT, Role-based
- Notifications: Firebase Cloud Messaging (FCM)
- Containerization: Docker

## Installation & Setup

1. Clone the repository
```bash
git clone https://github.com/esraa237/ClarthraEnergies.git
cd ClarthraEnergies
````
2. Install dependencies

```bash
npm install
```

3. Setup environment variables

```env
# MongoDB connection string for your database
MONGO_URL=<your_mongo_uri>

# Port your NestJS server will run on
PORT=3000

# JWT (JSON Web Token) secret key and expiration time
JWT_SECRET=<your_jwt_secret>
JWT_EXPIRES_IN="24h"

# Number of salt rounds for bcrypt password hashing
SALT_NUMBER=10

# Default super admin credentials
SUPER_ADMIN_EMAIL=<super_admin_email>
SUPER_ADMIN_PASSWORD=<super_admin_password>

# SMTP (email) configuration for sending emails
SMTP_HOST=<smtp_host>
SMTP_PORT=<smtp_port>
SMTP_USER=<smtp_user>
SMTP_PASS=<smtp_password>

# Token expiration times in milliseconds
PROFILE_COMPLETION_TOKEN_EXPIRY=86400000   # 24 hours
EMAIL_UPDATE_TOKEN_EXPIRY=86400000         # 24 hours
RESET_PASSWORD_TOKEN_EXPIRY=3600000        # 1 hour

# Frontend application URLs
FRONT_ADMIN_URL=<frontend_admin_url>
FRONT_WEBSITE_URL=<frontend_website_url>

# Backend application URL
HOST_URL=<backend_host_url>

# Company information for email templates
COMPANY_LOGO_URL=<company_logo_url>
COMPANY_SUPPORT_EMAIL=<support_email>
COMPANY_NAME=<company_name>
CONTACT_RECEIVER_EMAIL=<contact_email>

# File uploads configuration
UPLOAD_DIR=uploads
MAX_IMAGE_SIZE=5242880       # 5MB
MAX_VIDEO_SIZE=20971520      # 20MB
MAX_FILE_SIZE=10485760       # 10MB
ALLOWED_IMAGE_EXTENSIONS=".jpg,.jpeg,.png,.gif,.webp"
ALLOWED_VIDEO_EXTENSIONS=".mp4,.mov,.avi"
ALLOWED_FILE_EXTENSIONS=".pdf,.doc,.docx,.txt"

```

4. Run the project

```bash
npm run start:dev
```

## API Documentation

* Access Swagger UI at: `http://localhost:<PORT in Env for backend>/api`

## Folder Structure

* src/

  * modules/   # All feature modules 
  * main.ts    # Application entry point

## License

* Freelance project / For internal use
