# backend/app.py
import json
import logging
from pathlib import Path
from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from werkzeug.security import check_password_hash, generate_password_hash
from web3 import Web3
import config

# ------------- Logging -------------
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ------------- App + CORS -------------
app = Flask(__name__)
# Allow common dev localhost ports so frontends on other ports don't get blocked
CORS(app, resources={
    r"/*": {
        "origins": [
            "http://localhost:8080", "http://127.0.0.1:8080",
            "http://localhost:5173", "http://127.0.0.1:5173",
            "http://localhost:3000", "http://127.0.0.1:3000",
            "http://localhost:8081", "http://127.0.0.1:8081",
            "http://localhost:8083", "http://127.0.0.1:8083"
        ]
    }
}, supports_credentials=True)

# ------------- MongoDB (users + certificates) -------------
MONGO_URI = "mongodb://localhost:27017/"
DB_NAME = "CertificateInsertion"
client = MongoClient(MONGO_URI)
db = client[DB_NAME]
users = db["users"]
certificates = db["certificates"]

# ------------- Web3 / Contract -------------
w3 = Web3(Web3.HTTPProvider(config.RPC_URL))
if not w3.is_connected():
    logger.error("🚨 Web3 not connected. Check Ganache / RPC_URL: %s", config.RPC_URL)
else:
    logger.info("✅ Web3 connected to %s", config.RPC_URL)

# load contract ABI
contract_build_path = Path(config.CONTRACT_BUILD_PATH).resolve()
try:
    with open(contract_build_path, "r") as f:
        contract_json = json.load(f)
    contract_abi = contract_json.get("abi")
    if not contract_abi:
        raise RuntimeError("ABI not found in contract build JSON")
except Exception as e:
    logger.exception("Failed to load contract ABI from %s: %s", contract_build_path, e)
    contract_abi = None

contract_address = config.CONTRACT_ADDRESS
cert_contract = None
if contract_abi:
    try:
        checksum_addr = Web3.to_checksum_address(contract_address)
        cert_contract = w3.eth.contract(address=checksum_addr, abi=contract_abi)
        logger.info("🔗 Contract loaded at %s", checksum_addr)
    except Exception as e:
        logger.exception("Failed to create contract instance: %s", e)
        cert_contract = None

# default account selection (ganache)
try:
    accounts = getattr(w3.eth, "accounts", []) or []
    if accounts and len(accounts) > config.DEFAULT_ACCOUNT_INDEX:
        w3.eth.default_account = accounts[config.DEFAULT_ACCOUNT_INDEX]
    elif accounts:
        w3.eth.default_account = accounts[0]
    logger.info("Using default account: %s", w3.eth.default_account)
except Exception:
    logger.warning("Could not set default account; continue but transactions may fail.")

# ------------- Helpers -------------
def normalize_hex_0x(hex_str: str) -> str:
    """Return 0x-prefixed lowercase hex string (no 0x duplicates)."""
    if hex_str is None:
        raise ValueError("hex_str is None")
    s = str(hex_str).strip().lower()
    if s.startswith("0x"):
        s = s[2:]
    return "0x" + s

def normalize_to_bytes32(hex_str: str) -> bytes:
    """
    Validate input is exactly 32 bytes (64 hex chars). Return bytes.
    Raises ValueError on invalid input.
    """
    if not hex_str:
        raise ValueError("Certificate hash cannot be empty")

    s = str(hex_str).strip().lower()
    if s.startswith("0x"):
        s = s[2:]

    if len(s) != 64:
        raise ValueError(f"certHash length invalid: {len(s)} (must be 64 hex chars => 32 bytes).")
    if any(c not in "0123456789abcdef" for c in s):
        raise ValueError("certHash contains non-hex characters")
    return bytes.fromhex(s)

def compute_certificate_hash(student_name: str, course: str, institution: str, issue_date: str) -> str:
    """
    Deterministic cert hash string returned as '0x' + 64 hex chars.
    Uses keccak(text=...) and includes a stable separator '|' to avoid accidental collisions.
    """
    raw = f"{student_name}|{course}|{institution}|{issue_date}"
    return w3.to_hex(w3.keccak(text=raw))

# ------------- Routes -------------
@app.route("/health", methods=["GET"])
def health_check():
    try:
        return jsonify({
            "web3_connected": w3.is_connected(),
            "contract_loaded": bool(cert_contract),
            "contract_address": contract_address,
            "block_number": w3.eth.block_number,
            "default_account": str(w3.eth.default_account)
        }), 200
    except Exception as e:
        logger.exception("Health check error:")
        return jsonify({"error": str(e)}), 500

@app.route("/issue", methods=["POST"])
def issue_certificate():
    """
    Expects JSON:
    { "studentName":"...", "course":"...", "institution":"...", "issueDate":"YYYY-MM-DD" }
    Returns JSON with certHash (0x...), txHash and blockNumber.
    """
    try:
        data = request.get_json(force=True) or {}
        student_name = (data.get("studentName") or "").strip()
        course = (data.get("course") or "").strip()
        institution = (data.get("institution") or "").strip()
        issue_date = (data.get("issueDate") or "").strip()

        # basic validation
        if not all([student_name, course, institution, issue_date]):
            return jsonify({"error": "Missing required fields"}), 400

        if not cert_contract:
            logger.error("Issue attempted but contract not loaded")
            return jsonify({"error": "Contract not loaded"}), 500

        # ensure contract bytecode exists at address
        code = w3.eth.get_code(Web3.to_checksum_address(contract_address))
        if code in (b"", b"0x", None):
            logger.error("No contract code at %s", contract_address)
            return jsonify({"error": "No contract deployed at configured address"}), 500

        # compute cert hash (0x + 64 hex chars)
        cert_hash_hex = compute_certificate_hash(student_name, course, institution, issue_date)
        cert_hash_hex = normalize_hex_0x(cert_hash_hex)

        # convert to 32-byte bytes for contract call
        cert_hash_bytes = normalize_to_bytes32(cert_hash_hex)

        logger.info("Issuing certificate: %s | %s | %s | %s -> %s",
                    student_name, course, institution, issue_date, cert_hash_hex)

        # Call addCertificate contract method. Many solidity ABIs take bytes32 - passing bytes is OK.
        tx_hash = cert_contract.functions.addCertificate(
            cert_hash_bytes,
            student_name,
            course,
            institution,
            issue_date
        ).transact({"from": w3.eth.default_account})

        receipt = w3.eth.wait_for_transaction_receipt(tx_hash)

        # persist to Mongo (helpful for UI quick lookup)
        cert_doc = {
            "studentName": student_name,
            "course": course,
            "institution": institution,
            "issueDate": issue_date,
            "txHash": receipt.transactionHash.hex(),
            "blockNumber": receipt.blockNumber,
            "certHash": cert_hash_hex
        }
        certificates.insert_one(cert_doc)

        logger.info("Issued: tx=%s block=%s certHash=%s", receipt.transactionHash.hex(), receipt.blockNumber, cert_hash_hex)

        return jsonify({
            "status": "issued",
            "certHash": cert_hash_hex,
            "txHash": receipt.transactionHash.hex(),
            "blockNumber": receipt.blockNumber
        }), 201

    except ValueError as ve:
        logger.error("Validation error in /issue: %s", ve)
        return jsonify({"error": str(ve)}), 400
    except Exception as e:
        logger.exception("Issue error:")
        return jsonify({"error": "Blockchain error during issuance", "details": str(e)}), 500

@app.route("/verify", methods=["POST"])
def verify_certificate():
    """
    Expects JSON: { "certHash": "0x..." } OR the 4 fields to recompute:
      { studentName, course, institution, issueDate }
    Returns { valid: true|false, certHash: "0x..." }
    """
    try:
        data = request.get_json(force=True) or {}

        # If full fields are present, recompute the hash
        if all(data.get(k) for k in ("studentName", "course", "institution", "issueDate")):
            cert_hash_hex = compute_certificate_hash(
                data["studentName"],
                data["course"],
                data["institution"],
                data["issueDate"]
            )
            cert_hash_hex = normalize_hex_0x(cert_hash_hex)
        elif data.get("certHash"):
            cert_hash_hex = data.get("certHash")
            cert_hash_hex = normalize_hex_0x(cert_hash_hex)
        else:
            return jsonify({"error": "Provide certHash or all fields (studentName, course, institution, issueDate)"}), 400

        if not cert_contract:
            logger.error("Verify attempted but contract not loaded")
            return jsonify({"error": "Contract not loaded"}), 500

        cert_hash_bytes = normalize_to_bytes32(cert_hash_hex)

        logger.info("Verifying certHash=%s", cert_hash_hex)

        # call contract verify - many ABIs expect bytes32; we pass bytes
        is_valid = cert_contract.functions.verifyCertificate(cert_hash_bytes).call()

        return jsonify({"valid": bool(is_valid), "certHash": cert_hash_hex}), 200

    except ValueError as ve:
        logger.error("Validation error in /verify: %s", ve)
        return jsonify({"error": str(ve)}), 400
    except Exception as e:
        logger.exception("Verify error:")
        return jsonify({"error": "Blockchain error during verification", "details": str(e)}), 500

# ------------- Login (Mongo-backed) -------------
@app.route("/login", methods=["POST"])
def login():
    """
    Expects JSON: { "email": "<email>", "password": "<password>" }
    Returns 200 on success with small user info. 401 on invalid credentials.
    """
    try:
        data = request.get_json(force=True) or {}
        email = (data.get("email") or "").strip()
        password = data.get("password") or ""

        if not email or not password:
            return jsonify({"error": "Email and password required"}), 400

        user = users.find_one({"email": email})
        logger.info("Login attempt for: %s (found user: %s)", email, bool(user))

        if not user:
            return jsonify({"error": "Invalid credentials"}), 401

        stored = user.get("password", "")

        # Accept either hashed passwords (werkzeug) or plain-text legacy
        try:
            if (stored and check_password_hash(stored, password)) or (stored == password):
                # Success
                return jsonify({
                    "message": "Login successful",
                    "role": user.get("role"),
                    "user_id": str(user.get("_id"))
                }), 200
            else:
                return jsonify({"error": "Invalid credentials"}), 401
        except Exception as e:
            logger.exception("Password check failed:")
            return jsonify({"error": "Server error during auth"}), 500

    except Exception as e:
        logger.exception("Login error:")
        return jsonify({"error": "Server error", "details": str(e)}), 500

# ------------- Dev helper: create a test user (only for development) -------------
@app.route("/create-test-user", methods=["POST"])
def create_test_user():
    """
    Dev helper: POST JSON { "email": "...", "password": "...", "role": "issuer" }
    It will insert a user with hashed password. Use only in dev.
    """
    try:
        data = request.get_json(force=True) or {}
        email = (data.get("email") or "").strip()
        password = (data.get("password") or "").strip()
        role = data.get("role", "issuer")
        if not email or not password:
            return jsonify({"error": "email and password required"}), 400

        hashed = generate_password_hash(password)
        doc = {"email": email, "password": hashed, "role": role}
        users.update_one({"email": email}, {"$set": doc}, upsert=True)
        return jsonify({"status": "ok", "email": email}), 201
    except Exception as e:
        logger.exception("create-test-user error:")
        return jsonify({"error": str(e)}), 500

# ------------- Run -------------
if __name__ == "__main__":
    logger.info("Starting Flask server on http://127.0.0.1:5000")
    app.run(host="127.0.0.1", port=5000, debug=True)
import json
import logging
from flask import Flask, request, jsonify
from web3 import Web3
from flask_cors import CORS
from pymongo import MongoClient
import config

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Mongo Setup
client = MongoClient("mongodb://localhost:27017/")
db = client["CertificateInsertion"]
users = db["users"]

# Web3 Setup
w3 = Web3(Web3.HTTPProvider(config.RPC_URL))
if not w3.is_connected():
    raise Exception("Failed to connect to Ethereum RPC")

with open(config.CONTRACT_BUILD_PATH) as f:
    contract_json = json.load(f)

contract_abi = contract_json["abi"]
contract_address = config.CONTRACT_ADDRESS
contract = w3.eth.contract(address=contract_address, abi=contract_abi)

accounts = w3.eth.accounts
if len(accounts) > config.DEFAULT_ACCOUNT_INDEX:
    w3.eth.default_account = accounts[config.DEFAULT_ACCOUNT_INDEX]

def normalize_to_bytes32(h):
    if not h:
        raise ValueError("Empty hash")
    h = h.strip().lower()
    if h.startswith("0x"):
        h = h[2:]
    if len(h) != 64:
        raise ValueError("Hash must be 32 bytes (64 hex chars)")
    return bytes.fromhex(h)

def compute_hash(name, course, inst, date):
    s = f"{name}|{course}|{inst}|{date}"
    return w3.to_hex(w3.keccak(text=s))

@app.post("/issue")
def issue():
    try:
        data = request.get_json()
        name = data.get("studentName")
        course = data.get("course")
        inst = data.get("institution")
        date = data.get("issueDate")

        if not all([name, course, inst, date]):
            return jsonify({"error": "Missing fields"}), 400

        h = compute_hash(name, course, inst, date)
        b32 = normalize_to_bytes32(h)

        tx = contract.functions.addCertificate(
            b32, name, course, inst, date
        ).transact()

        receipt = w3.eth.wait_for_transaction_receipt(tx)

        return jsonify({
            "status": "issued",
            "certHash": h,
            "txHash": tx.hex(),
            "blockNumber": receipt["blockNumber"]
        }), 201

    except Exception as e:
        logger.error(e, exc_info=True)
        return jsonify({"error": str(e)}), 500

@app.post("/verify")
def verify():
    try:
        data = request.get_json()
        h = data.get("certHash")

        if not h:
            return jsonify({"error": "certHash required"}), 400

        if not h.startswith("0x"):
            h = "0x" + h

        b32 = normalize_to_bytes32(h)
        valid = contract.functions.verifyCertificate(b32).call()

        return jsonify({"valid": bool(valid), "certHash": h}), 200

    except Exception as e:
        logger.error(e, exc_info=True)
        return jsonify({"error": str(e)}), 500

@app.post("/login")
def login():
    data = request.get_json()
    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({"error": "Missing email or password"}), 400

    user = users.find_one({"email": email})
    if not user:
        return jsonify({"error": "User not found"}), 401

    if user["password"] != password:
        return jsonify({"error": "Invalid password"}), 401

    return jsonify({
        "status": "success",
        "role": user.get("role", "issuer"),
        "user_id": str(user["_id"])
    }), 200

@app.post("/create-test-user")
def create_test_user():
    data = request.get_json()
    email = data.get("email")
    password = data.get("password")
    role = data.get("role", "issuer")

    if not email or not password:
        return jsonify({"error": "Email and password required"}), 400

    users.insert_one({
        "email": email,
        "password": password,
        "role": role
    })

    return jsonify({"status": "created", "email": email}), 201

@app.get("/health")
def health():
    return jsonify({
        "web3_connected": w3.is_connected(),
        "contract_address": contract_address,
        "block_number": w3.eth.block_number,
        "default_account": w3.eth.default_account
    }), 200

if __name__ == "__main__":
    app.run(debug=True, port=5000)
