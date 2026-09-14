# Practice Portal 🚀

A modern DSA and C++ practice portal for tracking progress across
**CSE202 (C++)** and **CSE205 (DSA)**.

The portal provides topic-wise practice questions, progress tracking,
user authentication, and cloud-synced progress using Supabase.

## ✨ Features

-   📚 **204 practice questions**
    -   104 CSE202 C++ questions
    -   100 CSE205 DSA questions
-   📊 Dashboard with overall and subject-wise progress
-   ✅ Mark individual questions as solved
-   🎯 Quick Progress Adjuster for updating completed-question counts
-   🔎 Search and filtering for practice questions
-   👤 Supabase authentication with:
    -   Name
    -   Email
    -   Password
    -   Sign in / Sign out
    -   Forgot password / password reset
-   ☁️ Progress synced to Supabase
-   🔐 Row Level Security so users can access only their own progress
-   💾 Local browser backup and import/export support
-   🎨 Modern dark UI with animated/parallax background effects
-   📱 Responsive layout

## 🛠️ Tech Stack

-   HTML5
-   CSS3
-   Vanilla JavaScript
-   Supabase Auth
-   Supabase PostgreSQL
-   Supabase Row Level Security

## 📁 Project Structure

``` text
Practice-Portal/
├── index.html
├── style.css
├── app.js
├── data.js
├── favicon.svg
├── supabase-config.js
└── supabase.sql
```

## 🔐 Supabase Setup

### 1. Create a Supabase project

Create a project at [Supabase](https://supabase.com/).

### 2. Create the progress table

Open:

**Supabase Dashboard → SQL Editor → New query**

Copy the contents of `supabase.sql` into the editor and run it.

This creates the `progress` table and enables Row Level Security.

### 3. Enable Email Authentication

Go to:

**Authentication → Sign In / Providers → Email**

Enable email authentication.

If email confirmation is enabled, users will need to confirm their email
before signing in.

### 4. Configure the frontend

Open `supabase-config.js` and add your Supabase project URL and
browser-safe publishable/anon key:

``` js
window.SUPABASE_CONFIG = {
  url: 'YOUR_SUPABASE_PROJECT_URL',
  anonKey: 'YOUR_SUPABASE_PUBLISHABLE_OR_ANON_KEY'
};
```

> ⚠️ Never put a Supabase `service_role` or secret key in frontend code.

## ▶️ Run Locally

Because this is a static website, it can be run with VS Code and Live
Server.

1.  Open the project folder in VS Code.
2.  Install the **Live Server** extension if needed.
3.  Open `index.html`.
4.  Right-click → **Open with Live Server**.
5.  Open the generated local URL.

## ☁️ Deploy to Vercel

The recommended workflow is:

``` text
VS Code
   ↓
GitHub
   ↓
Vercel
   ↓
Live Practice Portal
   ↓
Supabase
```

Push the project to a GitHub repository and import that repository into
Vercel.

After the initial deployment, future GitHub pushes can automatically
trigger a new Vercel deployment.

### Supabase redirect URLs

After deploying, add your production Vercel URL to the Supabase
authentication URL configuration so email confirmation and
password-reset links can return to the website.

## 💾 How Progress Works

Each solved question is associated with the authenticated Supabase user.

The database stores:

``` text
user_id
problem_id
subject
completed
updated_at
```

This means two users can use the same portal while maintaining
completely separate progress.

## 🔒 Security

The `progress` table uses Supabase Row Level Security.

Users can:

-   Read their own progress
-   Add their own progress
-   Update their own progress
-   Delete their own progress

A user cannot access another user's progress through the application's
database queries.

## 📚 Subjects

### CSE202 · C++

Object Oriented Programming practice with **104 questions**.

### CSE205 · DSA

Data Structures & Algorithms practice with **100 questions**, organized
across six units:

-   Unit I: Arrays & Binary Search
-   Unit II: Linked Lists
-   Unit III: Stacks, Queues & Deque
-   Unit IV: Recursion, Trees & BST
-   Unit V: Heaps & Hashing
-   Unit VI: Graphs & Shortest Paths

## 👨‍💻 Author

**Aksh Kumar**

Practice Portal built for structured C++ and DSA preparation.
