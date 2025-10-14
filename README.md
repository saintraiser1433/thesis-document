# Thesis Archiving System

A comprehensive thesis archiving and management system built with Next.js, TypeScript, Prisma, and PostgreSQL.

## Features

### 🔐 Authentication & Authorization
- NextAuth.js with credentials provider
- Role-based access control (Admin, Program Head, Student, Teacher)
- Secure password hashing with bcryptjs

### 👥 User Roles & Permissions

#### Admin
- Manage user accounts (create/update/delete)
- View all thesis uploaded per school year
- Manage thesis categories
- Filter thesis (published/unpublished)
- Manage indexing references

#### Program Head / Research Teacher
- Upload thesis (PDF file) with abstract and author list
- Add multiple indexing entries per thesis
- Mark as "Published Online" (add publisher info, link, and citation)
- Edit or delete uploaded thesis

#### Students / Teachers
- Browse and view thesis records
- Filter by category, author, or school year
- Download thesis PDF files
- Search and view published works online

### 📊 Database Schema
- **User**: Authentication and role management
- **Thesis**: Core thesis information with metadata
- **ThesisAuthor**: Multiple authors per thesis
- **Category**: Thesis categorization
- **Indexing**: External publication references

### 🎨 UI/UX Features
- ShadCN/UI components for consistent design
- Responsive dashboard layout with sidebar navigation
- Data tables for listing and management
- File upload with drag & drop support
- Advanced search and filtering
- Toast notifications for user feedback

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: NextAuth.js
- **UI Library**: ShadCN/UI
- **Styling**: Tailwind CSS
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL database
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd thesis-document
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```



3. **Set up the database**
   ```bash
   # Generate Prisma client
   npm run db:generate

   # Push schema to database
   npm run db:push

   # Seed the database with initial data
   npm run db:seed
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Default Login Credentials

After seeding the database, you can use these accounts:

- **Admin**: `admin@example.com` / `password123`
- **Program Head**: `programhead@example.com` / `password123`
- **Teacher**: `teacher@example.com` / `password123`
- **Student**: `student@example.com` / `password123`

## Project Structure

```
thesis-document/
├── app/                    # Next.js App Router pages
│   ├── admin/             # Admin-only pages
│   ├── program-head/      # Program head pages
│   ├── thesis/            # Student/teacher pages
│   ├── auth/              # Authentication pages
│   └── api/               # API routes
├── components/            # React components
│   ├── ui/               # ShadCN UI components
│   └── ...               # Custom components
├── lib/                  # Utility functions
├── prisma/               # Database schema and migrations
├── public/               # Static assets
└── types/                # TypeScript type definitions
```

## API Routes

- `POST /api/auth/[...nextauth]` - NextAuth.js authentication
- `POST /api/upload` - File upload endpoint
- Additional API routes for CRUD operations (to be implemented)

## Database Commands

```bash
# Generate Prisma client
npm run db:generate

# Push schema changes to database
npm run db:push

# Create and run migrations
npm run db:migrate

# Seed database with sample data
npm run db:seed
```

## File Upload

The system supports PDF file uploads with the following features:
- File type validation (PDF only)
- File size limit (10MB)
- Secure file storage in `public/uploads/`
- Unique filename generation
- Upload progress indication

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, email support@example.com or create an issue in the repository.