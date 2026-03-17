# Private Blockchain Attendance System

A secure, decentralized, and immutable attendance tracking system leveraging a private blockchain (Hardhat) and a modern web interface (React).

## 🚀 Overview

This project provides a robust solution for managing attendance records. By recording attendance on a private blockchain, it ensures that records are tamper-proof and verifiable. 

### Key Features
- **Blockchain Security**: Immutable attendance logs stored on a private Ethereum network.
- **Role-Based Access**: Separate dashboards for Teachers (to start sessions) and Students (to mark attendance).
- **Real-Time Updates**: Integration with Firebase for authentication and metadata.
- **Modern UI**: Smooth animations and responsive design using Framer Motion and Lucide.

## 🏗 Project Structure

The project is divided into three main components:

- **`/blockchain`**: Smart contracts and deployment scripts using Hardhat.
- **`/backend`**: Node.js/Express server that acts as a bridge between the frontend and the blockchain, managing authentication and data flow.
- **`/frontend`**: A React application providing the user interface for teachers and students.

*(Note: The mobile application is kept separate as per requirements.)*

## 🛠 Tech Stack

### Frontend
- **Framework**: React 19
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Data Visualization**: Recharts
- **HTTP Client**: Axios

### Backend
- **Runtime**: Node.js
- **Framework**: Express
- **Blockchain Interaction**: Ethers.js
- **Authentication**: Firebase Admin SDK
- **Configuration**: Dotenv & Dotenv-cli

### Blockchain
- **Development Environment**: Hardhat
- **Language**: Solidity
- **Testing/Deployment**: Hardhat Toolbox

## ⚙️ Setup & Installation

### Prerequisites
- [Node.js](https://nodejs.org/) (v16+ recommended)
- [npm](https://www.npmjs.com/)

### 1. Blockchain Setup
```bash
cd blockchain
npm install
npx hardhat node  # Runs a local blockchain network
```
In a separate terminal:
```bash
npx hardhat run scripts/deploy.js --network localhost
```

### 2. Backend Setup
```bash
cd backend
npm install
# Configure your .env files (teacher, student, server, unauthorized)
npm run start:all
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm start
```

## 📜 Smart Contract

The core logic resides in `Attendance.sol`, which handles:
- Sessions management (Opening/Closing sessions).
- Attendance marking with verification.
- Retrieving attendance history.

## 🤝 Contribution

Feel free to fork this project and submit pull requests. For major changes, please open an issue first to discuss what you would like to change.
