-- AccessGuard: Secure Role & Permission Misconfiguration Detector
-- Developed by Team Byteforge (CBC090) - Global Academy of Technology
-- PostgreSQL Schema Definition

-- Enable UUID extension if supported
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    department VARCHAR(128) NOT NULL,
    title VARCHAR(128) NOT NULL,
    status VARCHAR(32) DEFAULT 'active',
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Roles Table
CREATE TABLE IF NOT EXISTS roles (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(128) NOT NULL UNIQUE,
    description TEXT,
    department VARCHAR(128),
    is_system_role BOOLEAN DEFAULT FALSE,
    risk_tier VARCHAR(32) DEFAULT 'low',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Role Inheritance (Child role inherits from Parent role)
CREATE TABLE IF NOT EXISTS role_inheritance (
    id VARCHAR(64) PRIMARY KEY,
    parent_role_id VARCHAR(64) NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    child_role_id VARCHAR(64) NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    inherited_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_inheritance UNIQUE (parent_role_id, child_role_id)
);

-- 4. Resources Table
CREATE TABLE IF NOT EXISTS resources (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(64) NOT NULL, -- 'database', 'financial_service', 'iam_policy', 'storage', 'api'
    classification VARCHAR(32) NOT NULL, -- 'public', 'internal', 'confidential', 'critical_pci', 'production_core'
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Permissions Table
CREATE TABLE IF NOT EXISTS permissions (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(128) NOT NULL UNIQUE,
    action VARCHAR(64) NOT NULL, -- 'read', 'write', 'delete', 'approve', 'release', 'admin', 'export'
    resource_id VARCHAR(64) REFERENCES resources(id) ON DELETE CASCADE,
    is_dangerous BOOLEAN DEFAULT FALSE,
    is_destructive BOOLEAN DEFAULT FALSE,
    is_sensitive BOOLEAN DEFAULT FALSE,
    description TEXT
);

-- 6. User Roles (Explicit assignments)
CREATE TABLE IF NOT EXISTS user_roles (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id VARCHAR(64) NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    assigned_by VARCHAR(64) NOT NULL,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_user_role UNIQUE (user_id, role_id)
);

-- 7. Direct User Grants (Permissions granted directly to a user rather than through a role)
CREATE TABLE IF NOT EXISTS direct_grants (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    permission_id VARCHAR(64) NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    resource_id VARCHAR(64) REFERENCES resources(id) ON DELETE CASCADE,
    reason TEXT,
    granted_by VARCHAR(64) NOT NULL,
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE
);

-- 8. Role Permissions (Permissions bound to roles)
CREATE TABLE IF NOT EXISTS role_permissions (
    id VARCHAR(64) PRIMARY KEY,
    role_id VARCHAR(64) NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id VARCHAR(64) NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_role_perm UNIQUE (role_id, permission_id)
);

-- 9. Role Change History (Tracks historic roles to catch stale permissions)
CREATE TABLE IF NOT EXISTS role_history (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    former_role_id VARCHAR(64) NOT NULL REFERENCES roles(id),
    former_role_name VARCHAR(128) NOT NULL,
    changed_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(32) DEFAULT 'unrevoked', -- 'unrevoked', 'revoked', 'acknowledged'
    notes TEXT
);

-- 10. Approved Admin Access (Administrator Safeguards)
CREATE TABLE IF NOT EXISTS approved_admin_access (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    permission_id VARCHAR(64) NOT NULL REFERENCES permissions(id),
    resource_id VARCHAR(64) REFERENCES resources(id),
    approved_by VARCHAR(128) NOT NULL,
    approval_ticket VARCHAR(64) NOT NULL,
    justification TEXT NOT NULL,
    valid_until TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE
);

-- 11. Access Policies & SoD Conflict Matrix
CREATE TABLE IF NOT EXISTS access_policies (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    policy_type VARCHAR(64) NOT NULL, -- 'sod_conflict', 'least_privilege', 'danger_threshold', 'stale_grace_period'
    description TEXT,
    rule_definition JSONB NOT NULL,
    is_enabled BOOLEAN DEFAULT TRUE
);

-- 12. Security Findings
CREATE TABLE IF NOT EXISTS findings (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rule_category VARCHAR(64) NOT NULL, -- 'excessive_permission', 'stale_access', 'sod_conflict', 'dangerous_permission', 'unusual_combination', 'unrestricted_access', 'sensitive_data'
    severity VARCHAR(32) NOT NULL, -- 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    affected_resource_id VARCHAR(64) REFERENCES resources(id),
    affected_permission_id VARCHAR(64) REFERENCES permissions(id),
    affected_role_id VARCHAR(64) REFERENCES roles(id),
    source_grant_type VARCHAR(32) NOT NULL, -- 'direct', 'role', 'inherited_role'
    permission_path JSONB NOT NULL,
    evidence TEXT NOT NULL,
    potential_impact TEXT NOT NULL,
    recommended_fix TEXT NOT NULL,
    review_status VARCHAR(32) DEFAULT 'Open', -- 'Open', 'In Progress', 'Resolved', 'Approved_Exception'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 13. Remediation Actions & Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(64) PRIMARY KEY,
    action VARCHAR(64) NOT NULL, -- 'REVOKE_GRANT', 'REMOVE_ROLE', 'ANALYSIS_RUN', 'POLICY_OVERRIDE'
    target_user_id VARCHAR(64) NOT NULL,
    target_grant_id VARCHAR(64),
    target_permission_id VARCHAR(64),
    target_role_id VARCHAR(64),
    actor_id VARCHAR(64) NOT NULL,
    actor_name VARCHAR(128) NOT NULL,
    reason TEXT NOT NULL,
    previous_state JSONB,
    new_state JSONB,
    risk_score_before INTEGER,
    risk_score_after INTEGER,
    verified BOOLEAN DEFAULT TRUE,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance & quick lookup
CREATE INDEX IF NOT EXISTS idx_user_roles_user ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_role_perms_role ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_findings_user ON findings(user_id);
CREATE INDEX IF NOT EXISTS idx_findings_severity ON findings(severity);
CREATE INDEX IF NOT EXISTS idx_findings_status ON findings(review_status);
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_logs(timestamp);
