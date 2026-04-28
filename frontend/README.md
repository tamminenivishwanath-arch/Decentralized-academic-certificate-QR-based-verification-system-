# CertiVerify - Decentralized Academic Certificate Verification System

A React + TypeScript frontend application for issuing and verifying academic certificates using blockchain technology.

## Features

- **University Portal**: Issue tamper-proof academic certificates with automatic QR code generation
- **Verifier Portal**: Verify certificates via manual entry or QR code scanning
- **Blockchain Security**: Certificate hashes stored on blockchain for immutable verification
- **Glassmorphism UI**: Modern, polished interface with deep blue/teal gradient design

## Tech Stack

- React 18 + TypeScript
- Tailwind CSS
- react-router-dom
- axios
- react-qr-code
- @zxing/browser (QR decoding)
- js-sha3 (keccak256 hash computation)

## Setup & Running

### Prerequisites

- Node.js 18+ and npm
- Flask backend running at `http://127.0.0.1:5000`

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:8080`

### Backend Requirements

The Flask backend must be running with CORS enabled at `http://127.0.0.1:5000` with the following endpoints:

- `POST /login` - Authentication
- `POST /issue` - Issue new certificate
- `POST /verify` - Verify certificate hash
- `GET /health` - Health check

## API Examples

### Issue Certificate

```bash
curl -X POST http://127.0.0.1:5000/issue \
  -H "Content-Type: application/json" \
  -d '{"studentName":"John Doe","course":"Bachelor of Science","institution":"MIT","issueDate":"2025-12-05"}'
```

Expected response:
```json
{
  "certHash": "0x...",
  "txHash": "0x...",
  "blockNumber": 12345
}
```

### Verify Certificate

```bash
curl -X POST http://127.0.0.1:5000/verify \
  -H "Content-Type: application/json" \
  -d '{"certHash":"0x..."}'
```

Expected response:
```json
{
  "valid": true,
  "certificate": {
    "studentName": "John Doe",
    "course": "Bachelor of Science",
    "institution": "MIT",
    "issueDate": "2025-12-05"
  }
}
```

### Health Check

```bash
curl http://127.0.0.1:5000/health
```

Expected response:
```json
{
  "status": "ok",
  "connected": true,
  "contract": true,
  "block": 12345
}
```

## Demo Credentials

For testing purposes (if backend supports):
- **Email**: `you@example.com`
- **Password**: `password123`

## Hash Computation

The certificate hash is computed using keccak256 with direct concatenation of fields:

```
hash = keccak256(studentName + course + institution + issueDate)
```

Example:
- studentName: "John Doe"
- course: "Bachelor of Science"
- institution: "MIT"
- issueDate: "2025-12-05"
- Concatenated: "John DoeBachelor of ScienceMIT2025-12-05"
- Hash: `0x...` (64 hex characters)

**Important**: The frontend manual verification computes the hash identically to the backend to ensure matching.

## Project Structure

```
src/
├── components/
│   ├── GlassCard.tsx       # Glassmorphism card component
│   ├── HealthIndicator.tsx # Backend status indicator
│   ├── Navbar.tsx          # Navigation with auth state
│   ├── Footer.tsx          # Footer component
│   ├── QRPreview.tsx       # QR display and download
│   ├── ProtectedRoute.tsx  # Route guard component
│   └── Toast.tsx           # Toast notification system
├── contexts/
│   └── AuthContext.tsx     # Authentication context
├── pages/
│   ├── Home.tsx            # Landing page
│   ├── UniversityLogin.tsx # Issuer login
│   ├── VerifierLogin.tsx   # Verifier login
│   ├── IssuerDashboard.tsx # Certificate issuance
│   ├── VerifierDashboard.tsx # Certificate verification
│   └── NotFound.tsx        # 404 page
├── utils/
│   ├── api.ts              # Axios API wrapper
│   └── qr.ts               # QR utilities & hash computation
├── App.tsx                 # Main app with routing
├── main.tsx                # Entry point
└── index.css               # Tailwind + custom styles
```

## License

MIT
