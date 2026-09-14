
Today 1:27 AM

app.js
JavaScript

data.js
JavaScript


favicon.svg
File

index.html
File

style.css
File
how to make this live + should store my data

ec4523fd-b02a-48e2-b584-41f324cf283c.png

8bf80d56-7d26-473a-bca4-8f5d5c5ae761.png

f8310f9d-dc12-4f73-ab2d-24e43167021e.png

1740943e-75a0-4112-8ea4-ad00856ea216.png


aksh-practice-portal-cloud(1).zip
Zip Archive

75971c06-9dbc-44ab-8185-96562f7d1230.png

9c6599d2-2585-42af-90e8-ad60b6327859.png
5662739a-d197-4828-a043-7d663c77df7a.png
and plus when i am not singed in it should keep me at the sign in page only not thid 

c22f875a-1e32-4de3-bc64-d43255bf3a2b.png
why are we asking create account 2 times 

e109b12a-58ab-4df8-b9fc-36dfa4e8d1b5.png

Haan bro 👍, all the project files need to be in the GitHub repository, but only the files that belong to your website.

For your current DSA Tracker, upload the project folder contents, including things like:

practice-portal/
├── index.html
├── app.js
├── data.js
├── style.css
├── supabase-config.js
└── other website assets/files
⚠️ One important file
Your supabase-config.js contains your Supabase URL + publishable/anon key.

That's okay if it's only the publishable/anon key, because that key is designed to be used in browser applications. Never put a service_role or secret key there.

Also, don't upload unnecessary files such as:

node_modules/
.git/
temporary files
old ZIP files
And yes, GitHub makes future updates MUCH easier
Once everything is uploaded:

You edit app.js
      ↓
git push
      ↓
GitHub
      ↓
Vercel automatically deploys
      ↓
🌐 Live website updated
So yes, put the website files in GitHub first. Don't upload the ZIP itself as your website source. Upload the extracted project files.

If you're on the GitHub Create a new repository page right now, send me a screenshot and I'll tell you exactly what to select. 👌


git hub description for Practice Portal\

Sure bro 😎 Here’s a clean GitHub description:

A modern DSA practice and progress-tracking portal for CSE202 & CSE205, featuring topic-wise problem tracking, user authentication, and cloud-synced progress with Supabase.

Shorter version for GitHub's description box:
DSA Practice Portal for CSE202 & CSE205 with topic-wise tracking, authentication, and Supabase cloud sync. 🚀

I'd use the shorter one for the repository description.




favicon(1).svg
File

index(1).html
File

style(1).css
File

supabase.sql
File

supabase-config.js
JavaScript

app(1).js
JavaScript

data(1).js
JavaScript
read me


Analyzed
Yep bro, I made the README.md for your Practice Portal. 🔥

It covers:

✨ Features

🛠️ Tech stack

📁 Project structure

🔐 Supabase setup

▶️ Running locally

☁️ Vercel deployment

💾 How progress syncing works

🔒 Security / RLS

📚 CSE202 & CSE205 structure

👨‍💻 Author

📄 Download
Download README.md

You can put this directly in the root of your GitHub repository. GitHub will automatically display it on the repository homepage. 🚀

I based the README on your actual project structure, including the 104 CSE202 + 100 CSE205 questions and the Supabase setup present in your files. 

 

 


README.md
Document


Practice Portal 🚀
A modern DSA and C++ practice portal for tracking progress across
CSE202 (C++) and CSE205 (DSA).

The portal provides topic-wise practice questions, progress tracking,
user authentication, and cloud-synced progress using Supabase.

✨ Features
📚 204 practice questions

104 CSE202 C++ questions

100 CSE205 DSA questions

📊 Dashboard with overall and subject-wise progress

✅ Mark individual questions as solved

🎯 Quick Progress Adjuster for updating completed-question counts

🔎 Search and filtering for practice questions

👤 Supabase authentication with:

Name

Email

Password

Sign in / Sign out

Forgot password / password reset

☁️ Progress synced to Supabase

🔐 Row Level Security so users can access only their own progress

💾 Local browser backup and import/export support

🎨 Modern dark UI with animated/parallax background effects

📱 Responsive layout

🛠️ Tech Stack
HTML5

CSS3

Vanilla JavaScript

Supabase Auth

Supabase PostgreSQL

Supabase Row Level Security

📁 Project Structure
Practice-Portal/
├── index.html
├── style.css
├── app.js
├── data.js
├── favicon.svg
├── supabase-config.js
└── supabase.sql
🔐 Supabase Setup
1. Create a Supabase project
Create a project at Supabase.

2. Create the progress table
Open:

Supabase Dashboard → SQL Editor → New query

Copy the contents of supabase.sql into the editor and run it.

This creates the progress table and enables Row Level Security.

3. Enable Email Authentication
Go to:

Authentication → Sign In / Providers → Email

Enable email authentication.

If email confirmation is enabled, users will need to confirm their email
before signing in.

4. Configure the frontend
Open supabase-config.js and add your Supabase project URL and
browser-safe publishable/anon key:

window.SUPABASE_CONFIG = {
  url: 'YOUR_SUPABASE_PROJECT_URL',
  anonKey: 'YOUR_SUPABASE_PUBLISHABLE_OR_ANON_KEY'
};
⚠️ Never put a Supabase service_role or secret key in frontend code.

▶️ Run Locally
Because this is a static website, it can be run with VS Code and Live
Server.

Open the project folder in VS Code.

Install the Live Server extension if needed.

Open index.html.

Right-click → Open with Live Server.

Open the generated local URL.

☁️ Deploy to Vercel
The recommended workflow is:

VS Code
   ↓
GitHub
   ↓
Vercel
   ↓
Live Practice Portal
   ↓
Supabase
Push the project to a GitHub repository and import that repository into
Vercel.

After the initial deployment, future GitHub pushes can automatically
trigger a new Vercel deployment.

Supabase redirect URLs
After deploying, add your production Vercel URL to the Supabase
authentication URL configuration so email confirmation and
password-reset links can return to the website.

💾 How Progress Works
Each solved question is associated with the authenticated Supabase user.

The database stores:

user_id
problem_id
subject
completed
updated_at
This means two users can use the same portal while maintaining
completely separate progress.

🔒 Security
The progress table uses Supabase Row Level Security.

Users can:

Read their own progress

Add their own progress

Update their own progress

Delete their own progress

A user cannot access another user's progress through the application's
database queries.

📚 Subjects
CSE202 · C++
Object Oriented Programming practice with 104 questions.

CSE205 · DSA
Data Structures & Algorithms practice with 100 questions, organized
across six units:

Unit I: Arrays & Binary Search

Unit II: Linked Lists

Unit III: Stacks, Queues & Deque

Unit IV: Recursion, Trees & BST

Unit V: Heaps & Hashing

Unit VI: Graphs & Shortest Paths

👨‍💻 Author
Aksh Kumar

Practice Portal built for structured C++ and DSA preparation.

