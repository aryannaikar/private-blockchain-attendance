# Private Blockchain Attendance System

A secure, decentralized, and tamper-proof attendance tracking system built on a private Ethereum blockchain (Hardhat), with a multi-node Node.js/Express backend, a React web frontend, and a React Native mobile app (Expo).

---

## 📖 Table of Contents

1. [Overview](#-overview)
2. [Key Features](#-key-features)
3. [Architecture](#-architecture)
4. [Project Structure](#-project-structure)
5. [Tech Stack](#-tech-stack)
6. [Smart Contract](#-smart-contract)
7. [Backend – Multi-Node Design](#-backend--multi-node-design)
8. [API Reference](#-api-reference)
9. [Frontend](#-frontend)
10. [Mobile App](#-mobile-app)
11. [Setup & Installation](#-setup--installation)
12. [Environment Variables](#-environment-variables)
13. [Proxy & Bunk Detection](#-proxy--bunk-detection)
14. [Firebase Integration](#-firebase-integration)
15. [Remote Access with ngrok](#-remote-access-with-ngrok)
16. [Contribution](#-contribution)

---

## 🚀 Overview

Traditional attendance systems are susceptible to manipulation, proxy attendance, and data loss. This project solves those problems by recording every attendance event as an immutable transaction on a private Ethereum blockchain. A layered architecture ensures the system remains functional even when the blockchain node is temporarily unavailable: records are first written to local JSON storage, then confirmed on-chain, and finally synced to Firebase Firestore.

---

## ✨ Key Features

| Feature | Description |
|---|---|
| **Blockchain Immutability** | Every attendance record is written as a transaction to a private Ethereum network, making it tamper-proof. |
| **Multi-Node Role Enforcement** | Each backend instance is started with a `ROLE` env variable (`teacher`, `student`, `server`, `unauthorized`). The `checkRole` middleware rejects any request whose role doesn't match the node's configured role, preventing cross-node abuse. |
| **Resilient Storage** | Records are saved locally first (JSON), confirmed on the blockchain asynchronously, and optionally mirrored to Firebase Firestore. |
| **Proxy Detection** | The system flags sessions where multiple different students marked attendance from the same device fingerprint. |
| **Bunk Detection** | The teacher node can surface students who have not marked attendance for an open session. |
| **Device Fingerprinting** | The browser frontend uses FingerprintJS to generate a stable device ID sent with every attendance request. |
| **Role-Based Dashboards** | Separate UIs for Admins, Teachers, and Students, each with context-appropriate actions. |
| **ESP32 Integration** (mobile) | The teacher's mobile app communicates with an ESP32 Wi-Fi module that acts as the classroom access point, controlling when a session is open. |
| **Firebase Optional** | Firebase Firestore is used when a `serviceAccountKey.json` is present; otherwise all data falls back to local JSON files. |
| **Remote Tunnelling** | ngrok tunnels expose local nodes to the internet so mobile devices and remote students can reach them. |

---

## 🏗 Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                         Clients                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌────────────────────────┐   │
│  │  React Web  │  │  Mobile App │  │  ESP32 (classroom AP)  │   │
│  │  (port 3000)│  │  (Expo)     │  │  http://192.168.4.1    │   │
│  └──────┬──────┘  └──────┬──────┘  └───────────┬────────────┘   │
└─────────┼────────────────┼──────────────────────┼────────────────┘
          │                │                       │
          ▼                ▼                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Backend (Node.js / Express)                   │
│                                                                  │
│   Teacher Node        Student Node       Server/Admin Node       │
│   PORT=4000           PORT=3001          PORT=5000               │
│   ROLE=teacher        ROLE=student       ROLE=server             │
│                                                                  │
│   Unauthorized Node (PORT=6000, ROLE=unauthorized)               │
│   — all attendance actions blocked by checkRole middleware       │
└──────────────────────────┬──────────────────────────────────────┘
                           │
              ┌────────────┴────────────┐
              │                         │
              ▼                         ▼
   ┌─────────────────────┐   ┌───────────────────────┐
   │  Private Blockchain  │   │  Firebase Firestore    │
   │  (Hardhat / EVM)    │   │  (optional)            │
   │  PORT=8545          │   │                        │
   │  Attendance.sol     │   │  collections:          │
   └─────────────────────┘   │    attendance, users   │
                              └───────────────────────┘
```

**Data flow for marking attendance:**

1. The client (web or mobile) sends a `POST /attendance/mark` request to the appropriate node.
2. The `checkRole` middleware verifies the request role matches the node's `ROLE`.
3. The backend checks for duplicates in local JSON.
4. The record is written to local `attendance.json` immediately (status: `pending`).
5. The backend calls `contract.markAttendance(studentID)` on the private blockchain with a timeout.
6. On success, the local record is updated with the real `txHash` (status: `confirmed`) and synced to Firestore.
7. On blockchain timeout/failure, the local record is preserved and the client receives a warning.

---

## 📁 Project Structure

```
private-blockchain-attendance/
├── blockchain/                 # Solidity smart contracts & Hardhat config
│   ├── contracts/
│   │   └── Attendance.sol      # Core attendance smart contract
│   ├── scripts/
│   │   └── deploy.js           # Deployment script
│   ├── artifacts/              # Compiled contract ABI & bytecode
│   └── hardhat.config.js
│
├── backend/                    # Node.js / Express multi-node backend
│   ├── routes/
│   │   ├── attendance.js       # Mark, fetch, reset attendance; proxy/bunk alerts
│   │   ├── auth.js             # Login endpoint
│   │   ├── admin.js            # Create / list / delete users
│   │   └── network.js          # Blockchain network status
│   ├── middleware/
│   │   └── checkRole.js        # Enforces node-level role restriction
│   ├── data/
│   │   ├── attendance.json     # Local attendance store (fallback / pre-confirm)
│   │   ├── session.json        # Active session metadata
│   │   └── users.json          # Local user store (fallback)
│   ├── contract.js             # Ethers.js contract instance
│   ├── firebase.js             # Firebase Admin SDK initialisation
│   ├── server.js               # Express app entry point
│   ├── AttendanceABI.json      # Contract ABI (copied from blockchain/artifacts)
│   ├── ngrok.yml               # ngrok tunnel configuration
│   ├── .env.teacher            # Teacher node environment
│   ├── .env.student            # Student node environment
│   ├── .env.server             # Server/admin node environment
│   └── .env.unauthorized       # Unauthorized node environment
│
├── frontend/                   # React 19 web application
│   ├── src/
│   │   ├── pages/              # Admin, Teacher, Student dashboards + Login, Landing
│   │   ├── components/         # Reusable UI components (Navbar, Sidebar, StatsCard, …)
│   │   └── services/
│   │       ├── api.js          # Axios instances + all API helper functions
│   │       └── fingerprint.js  # FingerprintJS device-ID helper
│   └── public/
│
└── mobile-app/                 # React Native / Expo mobile application
    ├── src/
    │   ├── screens/            # AdminDashboard, TeacherDashboard, StudentDashboard, …
    │   ├── components/         # AttendanceCard, NodeStatusCard
    │   └── config/
    │       └── api.js          # Axios instances pointing to local network IPs
    └── App.js
```

---

## 🛠 Tech Stack

### Blockchain
| Technology | Purpose |
|---|---|
| **Hardhat** | Local private Ethereum development network & deployment tooling |
| **Solidity ^0.8.20** | Smart contract language |
| **Hardhat Toolbox** | Testing, deployment, and verification utilities |

### Backend
| Technology | Purpose |
|---|---|
| **Node.js** | JavaScript runtime |
| **Express 5** | HTTP server and routing |
| **Ethers.js 6** | Ethereum provider, wallet, and contract interaction |
| **Firebase Admin SDK** | Firestore read/write and optional authentication |
| **dotenv / dotenv-cli** | Per-node environment variable loading |
| **concurrently** | Launch all four nodes with a single command |
| **nodemon** | Hot-reload during development |
| **cors** | Cross-origin request support |

### Frontend
| Technology | Purpose |
|---|---|
| **React 19** | UI framework |
| **React Router DOM 7** | Client-side routing |
| **Axios** | HTTP client |
| **Framer Motion** | Animations and transitions |
| **Lucide React** | Icon library |
| **Recharts** | Charts and data visualisation |
| **FingerprintJS** | Browser device fingerprinting for proxy detection |

### Mobile App
| Technology | Purpose |
|---|---|
| **React Native 0.81** | Cross-platform mobile framework |
| **Expo 54** | Build tooling and OTA updates |
| **React Navigation** | Screen navigation |
| **react-native-wifi-reborn** | Read current Wi-Fi SSID (classroom network detection) |
| **Axios** | HTTP client |

---

## 📜 Smart Contract

**File:** `blockchain/contracts/Attendance.sol`

The contract is written in Solidity ^0.8.20 and deployed to the local Hardhat network.

### State Variables

| Variable | Type | Description |
|---|---|---|
| `admin` | `address` | The deployer address; has exclusive rights to register teachers and students |
| `teachers` | `mapping(address => bool)` | Registered teacher wallet addresses |
| `studentIDs` | `mapping(address => string)` | Maps a student wallet to their roll number |
| `records` | `AttendanceRecord[]` | Array of all attendance records |

### `AttendanceRecord` Struct

```solidity
struct AttendanceRecord {
    string  studentID;   // Roll number / student ID
    uint    timestamp;   // block.timestamp at mark time
    uint    blockNumber; // Block in which the tx was mined
    address markedBy;    // Wallet that called markAttendance()
}
```

### Functions

| Function | Access | Description |
|---|---|---|
| `registerTeacher(address)` | `onlyAdmin` | Whitelists a teacher wallet |
| `registerStudent(address, string)` | `onlyAdmin` | Registers a student wallet with their roll number |
| `markAttendance(string studentID)` | Public | Appends a new `AttendanceRecord` to the on-chain array |
| `getAttendance()` | Public view | Returns the full `AttendanceRecord[]` array |

> **Note:** The Node.js backend handles Firebase authentication before calling `markAttendance`. The contract trusts the backend wallet as a verified intermediary.

---

## 🔧 Backend – Multi-Node Design

The backend runs **four independent Express instances** from the same `server.js` file, each started with a different `.env` file:

| Node | Port | Role | Responsibility |
|---|---|---|---|
| Teacher Node | 4000 | `teacher` | Mark attendance on behalf of a student, open/close sessions, view all attendance, proxy alerts |
| Student Node | 3001 | `student` | Students mark their own attendance using their roll number and device ID |
| Server / Admin Node | 5000 | `server` | Create, list, and delete users; general administration |
| Unauthorized Node | 6000 | `unauthorized` | Intentionally blocked — all attendance actions return `403` |

### `checkRole` Middleware

Every attendance write endpoint is guarded by `backend/middleware/checkRole.js`. It compares the `role` field in the request body against the `ROLE` environment variable set for that node:

```
Client sends role="student" → Teacher Node (ROLE=teacher) → 403 Forbidden
Client sends role="teacher" → Teacher Node (ROLE=teacher) → ✅ Allowed
```

This prevents a student's device from hitting the teacher node and marking attendance with elevated privileges.

---

## 📡 API Reference

All endpoints accept and return JSON. Base URL depends on the node:
- Teacher: `http://localhost:4000`
- Student: `http://localhost:3001`
- Server/Admin: `http://localhost:5000`

### Authentication

#### `POST /auth/login`
Login for any role. Checks Firebase first, falls back to local `users.json`.

**Request body:**
```json
{ "rollNo": "STU001", "password": "secret" }
```

**Response:**
```json
{ "message": "Login successful", "role": "student", "rollNo": "STU001", "name": "Alice" }
```

---

### Attendance

#### `GET /attendance/active-session`
Returns the currently active session slot.

**Response:**
```json
{ "activeSlot": "Class 1", "teacherID": "TCH001", "teacherName": "Mr Smith", "isOpen": true }
```

#### `POST /attendance/active-session` *(Teacher Node)*
Set or update the active session.

**Request body:**
```json
{ "activeSlot": "Class 2", "teacherID": "TCH001", "teacherName": "Mr Smith", "isOpen": true }
```

#### `POST /attendance/mark`
Mark attendance for a student. Guarded by `checkRole`.

**Request body (student role):**
```json
{ "role": "student", "rollNo": "STU001", "deviceID": "<fingerprint>", "sessionID": "Class 1" }
```

**Request body (teacher role):**
```json
{ "role": "teacher", "studentID": "STU002" }
```

**Response:**
```json
{ "message": "Attendance marked for Class 1 (Blockchain Confirmed)", "txHash": "0xabc..." }
```

If the blockchain is unavailable, the record is still saved locally and the response includes a `warning` field.

#### `GET /attendance/all` *(Teacher Node)*
Returns all attendance records. Merges blockchain records with local metadata. Falls back to local JSON if blockchain is unavailable.

#### `GET /attendance/my/:rollNo` *(Student Node)*
Returns attendance records filtered by the given roll number.

#### `POST /attendance/reset` *(Teacher Node)*
Clears all records from the local `attendance.json` file.

#### `GET /attendance/proxy-alerts` *(Teacher Node)*
Returns sessions where more than one student marked attendance from the same device.

**Response:**
```json
[{ "deviceID": "abc123", "sessionID": "Class 1", "students": ["STU001", "STU002"] }]
```

#### `POST /attendance/proxy-dismiss` *(Teacher Node)*
Dismisses a proxy alert so it no longer appears.

**Request body:**
```json
{ "deviceID": "abc123", "sessionID": "Class 1" }
```

---

### Admin

#### `POST /admin/create-user` *(Server Node)*
Creates a new student or teacher account.

**Request body:**
```json
{ "name": "Bob", "rollNo": "STU010", "password": "pass123", "role": "student" }
```

#### `GET /admin/users` *(Server Node)*
Returns the list of all registered users.

#### `DELETE /admin/delete-user/:rollNo` *(Server Node)*
Deletes the user with the given roll number.

---

### Network

#### `GET /network/status`
Returns the status of the connected private Ethereum node.

**Response:**
```json
{
  "blockchain": "Private Ethereum",
  "chainId": "31337",
  "blockNumber": 42,
  "rpc": "http://127.0.0.1:8545",
  "message": "Connected to private blockchain network"
}
```

---

## 🖥 Frontend

The web frontend is a React 19 single-page application. Routes are defined in `frontend/src/App.js`:

| Path | Component | Description |
|---|---|---|
| `/` | `Landing` | Landing / splash page |
| `/login` | `Login` | Role-based login form |
| `/student` | `StudentDashboard` | Student home: attendance stats |
| `/student/mark` | `MarkAttendance` | Mark own attendance (calls Student Node) |
| `/student/history` | `AttendanceHistory` | View personal attendance history |
| `/teacher` | `TeacherDashboard` | Teacher home: session control, proxy/bunk alerts |
| `/teacher/session` | `StartSession` | Open/close an attendance session |
| `/teacher/history` | `AttendanceHistory` | View all attendance records |
| `/admin` | `AdminDashboard` | Admin home: stats overview |
| `/admin/users` | `ManageUsers` | Create and delete users |
| `/admin/history` | `AttendanceHistory` | Full attendance history |
| `*` | `NotFound` | 404 page |

**API calls** from the frontend are routed through three typed Axios instances in `frontend/src/services/api.js`:

- `teacherAPI` → Teacher Node (port 4000)
- `studentAPI` → Student Node (port 3001)
- `serverAPI` → Server/Admin Node (port 5000)

The base URLs auto-detect the hostname via `window.location.hostname` for LAN usage, and can be overridden with `REACT_APP_TEACHER_URL`, `REACT_APP_STUDENT_URL`, `REACT_APP_SERVER_URL` environment variables.

---

## 📱 Mobile App

The mobile app (`/mobile-app`) is built with React Native and Expo. It mirrors the web frontend's role-based navigation:

| Screen | Role | Description |
|---|---|---|
| `LandingScreen` | All | Entry point |
| `LoginScreen` | All | Credential entry |
| `TeacherDashboard` | Teacher | Controls the ESP32 Wi-Fi module and marks attendance manually |
| `StudentDashboard` | Student | View own attendance stats |
| `AttendanceList` | Teacher / Admin | Tabular list of all attendance records |
| `NetworkStatus` | Admin | Live blockchain node stats |
| `AdminDashboard` | Admin | User management overview |
| `ManageUsers` | Admin | Create / delete users |
| `NotFoundScreen` | All | 404 fallback |

### ESP32 Integration

The Teacher's mobile app communicates with an **ESP32 microcontroller** configured as a Wi-Fi access point at `http://192.168.4.1`:

| Endpoint | Method | Description |
|---|---|---|
| `/status` | GET | Returns `{ students: <n>, status: "OPEN" or "CLOSED" }` |
| `/start` | GET | Opens the attendance window on the ESP32 |

Students connect their devices to the classroom Wi-Fi network hosted by the ESP32 before marking attendance. The teacher polls `/status` every 3 seconds to see how many students are connected.

---

## ⚙️ Setup & Installation

### Prerequisites

- [Node.js](https://nodejs.org/) v16 or higher
- [npm](https://www.npmjs.com/)
- (Optional) [Expo CLI](https://docs.expo.dev/get-started/installation/) for the mobile app
- (Optional) A Firebase project with Firestore enabled

---

### 1. Blockchain Setup

```bash
cd blockchain
npm install

# Terminal 1 — start the local private Ethereum node
npx hardhat node
```

```bash
# Terminal 2 — deploy the Attendance smart contract
npx hardhat run scripts/deploy.js --network localhost
```

Copy the printed contract address and update `CONTRACT_ADDRESS` in each backend `.env.*` file.

---

### 2. Backend Setup

```bash
cd backend
npm install
```

Configure the `.env` files (see [Environment Variables](#-environment-variables) below), then start all four nodes at once:

```bash
npm run start:all
```

Or start individual nodes:

```bash
npm run teacher       # Teacher Node on port 4000
npm run student       # Student Node on port 3001
npm run servernode    # Server/Admin Node on port 5000
npm run unauthorized  # Unauthorized Node on port 6000
```

---

### 3. Frontend Setup

```bash
cd frontend
npm install
npm start             # Starts on http://localhost:3000
```

---

### 4. Mobile App Setup

```bash
cd mobile-app
npm install
npx expo start        # Scan QR with Expo Go app on your phone
```

Update `mobile-app/src/config/api.js` with your machine's LAN IP address so the app can reach the backend nodes.

---

## 🔑 Environment Variables

Each backend node is started with a dedicated `.env` file. Create them inside the `backend/` directory:

### `.env.teacher`
```dotenv
PORT=4000
ROLE=teacher
RPC_URL=http://127.0.0.1:8545
PRIVATE_KEY=<hardhat_account_private_key>
CONTRACT_ADDRESS=<deployed_contract_address>
```

### `.env.student`
```dotenv
PORT=3001
ROLE=student
RPC_URL=http://127.0.0.1:8545
PRIVATE_KEY=<hardhat_account_private_key>
CONTRACT_ADDRESS=<deployed_contract_address>
```

### `.env.server`
```dotenv
PORT=5000
ROLE=server
RPC_URL=http://127.0.0.1:8545
PRIVATE_KEY=<hardhat_account_private_key>
CONTRACT_ADDRESS=<deployed_contract_address>
```

### `.env.unauthorized`
```dotenv
PORT=6000
ROLE=unauthorized
RPC_URL=http://127.0.0.1:8545
PRIVATE_KEY=<any_key>
CONTRACT_ADDRESS=<deployed_contract_address>
```

> **Security note:** Never commit real private keys. The keys shown in the repository are Hardhat's well-known test accounts with no real funds.

### Frontend (optional)

Create `frontend/.env` to override the default localhost URLs when deploying to a remote machine:

```dotenv
REACT_APP_TEACHER_URL=https://<ngrok-or-ip>:4000
REACT_APP_STUDENT_URL=https://<ngrok-or-ip>:3001
REACT_APP_SERVER_URL=https://<ngrok-or-ip>:5000
```

---

## 🕵️ Proxy & Bunk Detection

### Proxy Detection

When a student marks attendance, their **device fingerprint** (generated by FingerprintJS in the browser, or by `react-native-wifi-reborn` in the mobile app) is recorded alongside the attendance entry.

After each session the teacher can call `GET /attendance/proxy-alerts`. The backend groups all records by `(deviceID, sessionID)`. Any group with **more than one unique student ID** is flagged as a potential proxy — meaning multiple students claimed to mark attendance from the same physical device.

Confirmed false-positives can be dismissed via `POST /attendance/proxy-dismiss`.

### Bunk Detection

`GET /attendance/bunk-alerts` returns a list of students who are registered in the system but have **no attendance record** for the currently active session, allowing the teacher to immediately identify absentees.

---

## 🔥 Firebase Integration

Firebase Firestore is used as an optional cloud database. It is activated automatically if `backend/serviceAccountKey.json` is present.

**To enable Firebase:**

1. Go to the [Firebase Console](https://console.firebase.google.com/) and create a project.
2. Enable **Firestore Database**.
3. Generate a **Service Account Key** (Project Settings → Service Accounts → Generate new private key).
4. Save the downloaded JSON as `backend/serviceAccountKey.json` (this file is gitignored).

**Collections used:**

| Collection | Documents | Description |
|---|---|---|
| `users` | Keyed by `rollNo` | Student and teacher accounts |
| `attendance` | Auto-ID | Attendance records with metadata |

When Firebase is available, all reads and writes go to Firestore instead of the local JSON files. Local JSON files still serve as a fallback and a pre-confirmation buffer.

---

## 🌐 Remote Access with ngrok

To expose local nodes over the internet (useful for testing with physical mobile devices or remote students), the project ships an `ngrok.yml` config:

```bash
cd backend
npm run ngrok:all      # Expose Teacher (4000), Student (3001), and Blockchain (8545)
```

Individual tunnels:

```bash
npm run ngrok:teacher      # port 4000
npm run ngrok:student      # port 3001
npm run ngrok:servernode   # port 5000
npm run ngrok:blockchain   # port 8545
```

Update the API base URLs in `frontend/.env` and `mobile-app/src/config/api.js` with the generated ngrok URLs.

---

## 🤝 Contribution

Feel free to fork this project and submit pull requests. For major changes, please open an issue first to discuss what you would like to change.
