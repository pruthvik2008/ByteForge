# AccessGuard — Secure Role & Permission Misconfiguration Detector

Developed by **Team Byteforge** (Team ID: `CBC090`)  
**Domain:** Cybersecurity  
**Institution:** Global Academy of Technology  
**Event:** CBC 2.0 Hackathon

---

## 1. Project Overview

Modern enterprise applications accumulate excessive, outdated, and conflicting permissions over time as employees transfer departments, change roles, or take on temporary emergency duties.

**AccessGuard** is a rule-based permission-risk engine and cybersecurity dashboard that:
1. **Maps Effective Access**: Resolves complete chains: *User → Assigned Roles → Inherited Roles → Effective Permissions → Resources*.
2. **Detects 7 Classes of Misconfigurations**: Excessive privileges, stale grants, separation-of-duties (SoD) conflicts, destructive permissions, unusual cross-department entitlements, unrestricted access, and sensitive data leakage.
3. **Explains Findings Transparently**: "Why Is This Risky?" breakdown with technical evidence, impact assessments, and provenance paths.
4. **Interactive Attack Intelligence**: Visualizes access paths using React Flow (`@xyflow/react`), illuminating attack vectors and high-risk privilege escalation.
5. **What-If Permission Simulator**: Previews access revocation without modifying live permissions, verifying risk reduction and safeguards.
6. **Administrator Safeguards**: Preserves legitimate administrative break-glass access under verified governance tickets.
7. **Verified Remediation**: Executes atomic changes, recalculates access in real-time, logs immutable audit records, and verifies risk deltas.
8. **Voice-Powered Security Copilot**: Natural language spoken and typed assistant powered by browser Web Speech API and SpeechSynthesis, with read-only safeguards.
9. **End-to-End Encryption**: AES-256-GCM envelope encryption protecting stored policies, secrets, and audit logs.

---

## 2. Synthetic Hackathon Benchmark Scenarios

AccessGuard ships with ready-to-test benchmark data covering all 4 hackathon demonstration cases:

- **Scenario 1: Student with Excessive Access**
  - **User:** Alex Rivera (`usr_101`)
  - **Misconfiguration:** Student assigned `rol_db_operator`, granting `perm_delete_prod_db` (`db:drop_prod_tables`) on the core Production PostgreSQL database.
  - **Demo Action:** Remove `Database Operator` role via Verified Remediation or What-If Simulator and confirm risk score reduction.

- **Scenario 2: Finance Separation-of-Duties (SoD) Conflict**
  - **User:** Jordan Taylor (`usr_102`)
  - **Misconfiguration:** Holds both `rol_finance_reviewer` (Invoice Approve) and `rol_finance_disburser` (Payment Release) on Corporate ERP.
  - **Policy Breached:** `pol_sod_finance` & SOX Section 404 segregation requirements.

- **Scenario 3: Former Employee Stale Access**
  - **User:** Morgan Chen (`usr_103`)
  - **Misconfiguration:** Transferred from DevOps to Analytics 400+ days ago, yet retains direct grant `dg_1` for unencrypted payroll exports.
  - **Demo Action:** Decommission stale direct grant `dg_1`.

- **Scenario 4: Legitimate Administrator Safeguards**
  - **User:** ByteForge (`usr_104`)
  - **Safeguard:** Holds broad break-glass system administration access under validated CISO authorization ticket `SEC-AUTH-2026-992`.
  - **Result:** Engine recognizes approved administrative status and avoids false-positive de-provisioning.

---

## 3. Technology Stack

- **Frontend:** React 19, TypeScript, Tailwind CSS, `@xyflow/react` (Attack Graph), Lucide Icons, Web Speech API (`SpeechRecognition` & `SpeechSynthesis`).
- **Backend:** Node.js with Express REST API.
- **Database:** PostgreSQL (with complete DDL in `database/schema.sql` and `database/seed.sql`, plus high-performance transactional in-memory store for instant demonstration).
- **Security Engine:** 7-rule explainable risk engine with recursive role-inheritance graph resolution.
- **Cryptography:** AES-256-GCM authenticated encryption with tamper-evident HMAC authentication tags.

---

## 4. REST API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/dashboard` | Dashboard metrics, risk score, recent risky access |
| `GET` | `/api/users` | List of identities with effective access summaries |
| `GET` | `/api/users/:id/access` | Deep trace of a user's direct, inherited, and effective permissions |
| `GET` | `/api/roles` | All roles and role inheritance hierarchies |
| `GET` | `/api/permissions` | All permission catalog entries |
| `GET` | `/api/resources` | Classified resources and open finding tallies |
| `POST` | `/api/analysis/run` | Executes the 7-rule permission-risk engine |
| `GET` | `/api/findings` | Filterable list of security findings |
| `GET` | `/api/findings/:id` | Single finding details with evidence and provenance |
| `PATCH` | `/api/findings/:id/status` | Update review status (Open, In Progress, Resolved) |
| `POST` | `/api/simulator/simulate` | What-If sandbox simulation of permission/role revocation |
| `POST` | `/api/remediation` | Executes verified atomic remediation with audit logging |
| `GET` | `/api/graph` | Attack Intelligence nodes and edges for React Flow |
| `POST` | `/api/copilot/query` | Interprets voice/text queries and returns grounded responses |
| `GET` | `/api/audit-logs` | Immutable audit trail with before/after state diffs |
| `GET` | `/api/encryption/status` | Real-time AES-256-GCM cryptographic status |
| `POST` | `/api/import` | Structured JSON batch ingestion with schema validation |
| `POST` | `/api/dataset/reset` | Resets database to CBC090 benchmark scenarios |

---

## 5. Local Setup Instructions (Windows / VS Code / Node.js)

### Prerequisites
1. **Node.js**: Install Node.js v20+ (LTS) from [nodejs.org](https://nodejs.org).
2. **VS Code**: Install Visual Studio Code.
3. **PostgreSQL** *(Optional for external DB)*: Install PostgreSQL 15+ from [postgresql.org](https://www.postgresql.org/download/windows/).

### Step-by-Step Installation

1. **Clone or Open Project**:
   ```bash
   cd accessguard
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

4. **Run the Full-Stack Application**:
   ```bash
   npm run dev
   ```
   Open your browser at `http://localhost:3000`.

5. **(Optional) Initialize External PostgreSQL**:
   If connecting to a standalone PostgreSQL instance:
   ```bash
   psql -U postgres -d accessguard_db -f database/schema.sql
   psql -U postgres -d accessguard_db -f database/seed.sql
   ```

---

## 6. Verification & Demonstration Flow

1. Click **"Load Sample Dataset"** in the top header or **Import Access Data** tab.
2. Click **"Run Risk Analysis"** to evaluate the baseline.
3. Open **Attack Intelligence** tab to explore the interactive React Flow graph and highlight dangerous paths.
4. Navigate to **Risk Findings**, click **"Why Is This Risky?"** on Alex Rivera's destructive database deletion finding.
5. Launch **What-If Simulator** to test removing `rol_db_operator`. Observe risk score drop from 740 to 320.
6. Click **"Remediate Misconfiguration"** in the modal, enter reviewer notes, and confirm.
7. Verify that the finding is resolved, the risk score drops, and an audit entry is created in **Audit Trail**.
8. Click the floating **Voice Copilot** microphone button, and speak or type:
   - *"Show me all high-risk findings"*
   - *"Which users have excessive access?"*
   - *"What happens if I remove DB delete?"*

---

**Team Byteforge (CBC090)** • Global Academy of Technology
