# School Resource Exchange App – Backend

Backend server for a **district-wide asset-sharing platform** that helps teachers share, claim, and track extra assets.

Built with a scalable architecture, secure authentication, and real-time updates to streamline resource management.

---

## 🚀 Features

### 👩‍🏫 Teacher APIs
- JWT authentication for secure login/signup.
- Post, edit, and delete asset listings with image uploads.
- Browse/search items and claim assets.
- View claim status, pickup confirmations, and transfer history.
- Real-time claim status notifications.

### 🛠️ Admin APIs
- Manage teacher accounts and permissions.
- Manage principals accounts
- View asset movement across schools/districts.
- Maintain legal data(privacy policy, terms, conditions, etc)

### 🛠️ Principal APIs
- Oversea the teachers under principal
- Approve assets under the principal
- Maintain legal data(privacy policy, terms, conditions, etc)

### ⚙️ Backend Highlights
- **Authentication:** JWT with role-based access control.
- **Real-time:** Socket.IO for notifications.
- **File Storage:** AWS S3 integration.
- **Databases:** MongoDB.
- **Payments:** Stripe API integration.
- **Hosting:** AWS/DigitalOcean deployment.

---

## 🛠 Tech Stack
- **Language:** TypeScript
- **Framework:** Node.js + Express.js
- **Databases:** MongoDB
- **Real-time:** Socket.IO
- **Cloud:** AWS (S3) / DigitalOcean

---

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/junayednoman/alyse-backend
   cd alyse-backend
