
<p align="center">
  <img src="https://github.com/user-attachments/assets/4e805623-2f52-4b59-9a46-f51c651fe65e" alt="Thrylos" width="400" />
</p>
<p align="center">
  <strong>Competitive Esports & Skill-Based Gaming Platform</strong>
</p>



**Thrylos** is a modern, full-stack esports and skill-based gaming platform designed to host competitive tournaments, manage player registrations, handle secure online payments, and provide a seamless experience for players, organizers, and administrators.

The platform focuses on **fair play, performance, scalability, and compliance**, making it suitable for real-world esports operations in India. Thrylos is built with a strong emphasis on **user experience, real-time data handling, and responsible gaming practices**.

> ⚠️ Thrylos supports **only skill-based games**.  
> No gambling, betting, or chance-based activities are allowed or promoted.

---

## 🌐 Live Platform

- **Production URL:** https://admin.thrylos.in  
- **Platform Type:** Web-based esports tournament system  
- **Target Audience:** Competitive gamers, tournament organizers, esports communities

---

## 🏆 Vision & Purpose

Thrylos was created to solve key challenges in grassroots and online esports:

- Lack of transparent tournament management
- Unstructured player registrations
- Unreliable payment tracking
- Poor user experience on existing platforms
- Limited compliance awareness in esports products

Our goal is to provide a **secure, scalable, and transparent esports ecosystem** that empowers both players and organizers.

---

## 🚀 Core Features

### 🎯 Tournament Management
- Create and manage skill-based tournaments
- Support for **Solo, Duo, and Squad** formats
- Tournament schedules, rules, and entry fees
- Player and team data validation

### 📝 Player Registration
- Simple and intuitive registration flow
- Dynamic form fields based on team type
- Email and phone-based player details
- Game UID validation

### 💳 Payments & Transactions
- QR-based **UPI payment system**
- Manual and automated transaction verification
- Transaction ID tracking
- Payment status handling (Pending / Verified / Failed)

### 🧾 Receipts & Proof of Payment
- Auto-generated payment receipts
- Print-optimized A4 layout
- Browser-based **Save as PDF**
- Unique receipt and order IDs
- Downloadable for user records

### 🏆 Leaderboards & Results
- Real-time leaderboard updates
- Rank-based prize distribution
- Admin-controlled result publishing

### 🔐 Authentication & Security
- Secure user authentication
- Role-based access (Admin / User)
- Protected admin dashboard
- Data validation and sanitization

### 📱 Responsive & Modern UI
- Fully responsive design (mobile-first)
- Dark-themed modern UI
- Smooth animations and transitions
- Optimized for performance and accessibility

---

## 🧩 Tech Stack

### Frontend
- **React.js**
- **TypeScript**
- **Tailwind CSS**
- **Framer Motion**
- **Shadcn UI**
- Modern component-driven architecture

### Backend & Services
- **Supabase**
  - Authentication
  - PostgreSQL database
  - Realtime subscriptions
- Optional Firebase integrations
- Secure REST-based data flow

### Payments
- QR-based UPI workflow
- Manual verification support
- Transaction logging and validation

### Deployment
- **Netlify** for frontend hosting
- Environment-based configuration
- Optimized production builds

---

## 📁 Project Structure


| S. No. | Folder / File | Description |
|------:|---------------|-------------|
| 1 | `public/` | Static public assets |
| 2 | `public/assets/` | Media and static resources |
| 3 | `public/assets/images/` | Image files |
| 4 | `public/assets/icons/` | Icon assets |
| 5 | `public/assets/fonts/` | Custom fonts |
| 6 | `public/favicon.ico` | Site favicon |
| 7 | `public/index.html` | HTML entry point |
| 8 | `src/` | Application source code |
| 9 | `src/components/` | Reusable UI components |
| 10 | `components/common/` | Shared UI elements |
| 11 | `components/layout/` | Navbar, Footer, Wrappers |
| 12 | `components/forms/` | Registration & input forms |
| 13 | `components/ui/` | Buttons, Modals, Cards |
| 14 | `src/pages/` | Route-based pages |
| 15 | `pages/home/` | Landing page |
| 16 | `pages/auth/` | Authentication pages |
| 17 | `pages/tournaments/` | Tournament listings |
| 18 | `pages/dashboard/` | User & admin dashboards |
| 19 | `pages/policies/` | Legal & compliance pages |
| 20 | `pages/not-found/` | 404 page |
| 21 | `src/hooks/` | Custom React hooks |
| 22 | `hooks/useAuth.ts` | Authentication logic |
| 23 | `hooks/useToast.ts` | Toast notifications |
| 24 | `hooks/useScroll.ts` | Scroll utilities |
| 25 | `src/integrations/` | External services |
| 26 | `integrations/supabase/` | Supabase client |
| 27 | `supabase/client.ts` | Supabase configuration |
| 28 | `integrations/payments/` | Payment logic |
| 29 | `payments/upi.ts` | UPI handling |
| 30 | `src/utils/` | Helper utilities |
| 31 | `utils/constants.ts` | App constants |
| 32 | `utils/helpers.ts` | Helper functions |
| 33 | `utils/validators.ts` | Input validation |
| 34 | `src/styles/` | Global styles |
| 35 | `styles/globals.css` | Global CSS |
| 36 | `src/App.tsx` | Root component |
| 37 | `src/main.tsx` | Application entry |
| 38 | `src/routes.tsx` | Route configuration |
| 39 | `.env.example` | Environment variables |
| 40 | `.gitignore` | Git ignore rules |
| 41 | `package.json` | Dependencies & scripts |
| 42 | `tsconfig.json` | TypeScript config |
| 43 | `vite.config.ts` | Vite configuration |
| 44 | `README.md` | Project documentation |




---

## 🧠 Architecture Overview

- Component-based frontend architecture
- Centralized state management
- Secure API interactions via Supabase
- Environment-based configuration
- Print-optimized HTML for receipts
- Scalable database schema

The platform is designed to handle **high traffic during tournament registrations** while maintaining data consistency and reliability.

---

## 🧾 Payments & Receipts (Detailed)

- Payments are collected via **UPI QR flow**
- Each payment is linked to:
  - User
  - Tournament / Service
  - Transaction ID
- Receipt generation:
  - HTML-based
  - A4 print optimized
  - Saved as PDF via browser print
- Receipts include:
  - Order ID
  - Date & time
  - Payment status
  - User details
  - Tournament or service details

---

## 📜 Legal & Compliance

Thrylos strictly adheres to Indian compliance standards and esports best practices.

### Policy Pages
- Privacy Policy
- Refund Policy
- Terms of Service
- Payment Policy
- Responsible Gaming Policy
- Game of Skill Disclaimer

### Compliance Principles
- Skill-based gameplay only
- No betting or wagering
- Transparent refund rules
- Data privacy and security
- Responsible gaming awareness

---

## 🏢 Company Information

- **Brand Name:** Thrylos  
- **Powered By:** Kavya Enterprises  
- **Registration:** MSME / UDYAM Registered  
- **Product Line:** misterutsav  
- **Country of Operation:** India  

Thrylos operates as a technology-driven brand under a registered business entity, ensuring legitimacy and accountability.

---

## 🤝 Contribution Guidelines

We welcome contributions from developers, designers, and esports enthusiasts.

### How to Contribute
1. Fork the repository
2. Create a new feature branch
3. Make your changes
4. Commit with clear messages
5. Submit a pull request

All contributions are reviewed to maintain quality, security, and consistency.

---

## 🧑‍💻 Learning & Internship Friendly

Thrylos is built with:
- Student contributors in mind
- Real-world development exposure
- Clean and readable codebase
- Practical full-stack learning opportunities

---

## 🛠 Future Enhancements

- Automated payment verification
- Advanced analytics dashboard
- Match result automation
- Push notifications
- Multi-game support
- Mobile app version
- Admin audit logs
- Tournament bracket visualization

---

## 📬 Contact & Support

- 📧 Email: **thrylosindia@gmail.com**
- 🌐 Website: https://thrylos.in

For support, queries, or collaborations, feel free to reach out.

---

## ⚠️ Disclaimer

Thrylos is a **skill-based esports platform**.  
It does **not support gambling, betting, or chance-based games**.  
Participation is subject to platform policies and applicable local laws.

---
<p align="center">
  <img src="https://github.com/user-attachments/assets/160c433a-e006-42ee-8923-f6360223e116" alt="Thrylos" width="220" />
</p>


© 2025 **Thrylos**. All rights reserved.

