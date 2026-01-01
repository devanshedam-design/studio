# IARE Clubs - Next.js & Firebase App

This is a full-stack application built with Next.js, Firebase, and Genkit for the Institute of Aeronautical Engineering (IARE), Hyderabad. It serves as a centralized platform for students and faculty to discover, join, and manage student clubs and their events.

## Features

- **User Authentication:** Secure login and signup for students and admins.
- **Club Management:** Create, manage, and explore student clubs.
- **Admin Approval System:** A workflow for global administrators to approve or reject new club proposals.
- **Event Management:** Club admins can create, update, and manage events for their clubs.
- **Event Registration:** Students can register for events and receive a digital pass with a QR code.
- **AI-Powered Reporting:** Club admins can generate AI-based reports for past events to get insights on attendance and engagement.
- **Role-Based Access Control:** Distinct permissions for students, club admins, and global system admins enforced by Firestore Security Rules.
- **Responsive Design:** A mobile-friendly interface for a seamless experience on all devices.

## Tech Stack

- **Framework:** Next.js (App Router)
- **Styling:** Tailwind CSS with shadcn/ui components
- **Database:** Cloud Firestore
- **Authentication:** Firebase Authentication
- **Generative AI:** Google's Genkit with Gemini models
- **Deployment:** Firebase App Hosting

## Prerequisites

Before you begin, ensure you have the following installed on your local machine:
- [Node.js](https://nodejs.org/) (v18 or later recommended)
- [npm](https://www.npmjs.com/) (or yarn)

## Getting Started

Follow these steps to set up and run the project locally.

### 1. Clone the Repository

First, clone your GitHub repository to your local machine:

```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git
cd YOUR_REPOSITORY
```

### 2. Install Dependencies

Install all the required npm packages:

```bash
npm install
```

### 3. Set Up Environment Variables

The project uses Firebase for its backend. The necessary Firebase configuration is already included in `src/firebase/config.ts`. However, for the Genkit AI features to work, you need to provide a Google AI API key.

1.  Create a new file named `.env` in the root of your project.
2.  Obtain an API key from [Google AI Studio](https://aistudio.google.com/app/apikey).
3.  Add the key to your `.env` file like this:

    ```
    GEMINI_API_KEY=YOUR_API_KEY_HERE
    ```

### 4. Running the Development Servers

This project requires two development servers to run at the same time: one for the Next.js application and another for the Genkit AI flows.

I have added a convenience script to run both concurrently.

In your terminal, run:

```bash
npm run dev
```

This will start:
- The Next.js app on [http://localhost:9002](http://localhost:9002)
- The Genkit developer UI on [http://localhost:4000](http://localhost:4000)

You can now open [http://localhost:9002](http://localhost:9002) in your browser to see the application.

### 5. Available Scripts

- `npm run dev`: Starts both the Next.js and Genkit development servers.
- `npm run build`: Creates a production-ready build of the application.
- `npm run start`: Starts the production server after building.
- `npm run lint`: Lints the codebase for potential errors.
