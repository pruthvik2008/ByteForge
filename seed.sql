-- AccessGuard: Synthetic Seed Data
-- Team Byteforge (CBC090)
-- Covers Scenarios 1 (Student excessive access/DB deletion), 2 (Finance SoD conflict),
-- 3 (Former employee stale grant), and 4 (Legitimate administrator approved access).

-- Clear tables (in order of foreign keys)
DELETE FROM audit_logs;
DELETE FROM findings;
DELETE FROM approved_admin_access;
DELETE FROM role_history;
DELETE FROM access_policies;
DELETE FROM direct_grants;
DELETE FROM role_permissions;
DELETE FROM user_roles;
DELETE FROM role_inheritance;
DELETE FROM permissions;
DELETE FROM resources;
DELETE FROM roles;
DELETE FROM users;

-- 1. Insert Resources
INSERT INTO resources (id, name, type, classification, description) VALUES
('res_prod_postgres', 'Production Primary Database (PostgreSQL)', 'database', 'production_core', 'Primary transactional database storing customer accounts, billing data, and mission-critical state.'),
('res_erp_financials', 'Corporate ERP & Ledger (Financials)', 'financial_service', 'critical_pci', 'Core financial system holding accounts payable, receivables, invoice approvals, and wire release.'),
('res_hr_payroll', 'HR & Executive Payroll System', 'storage', 'confidential', 'Contains employee salary tiers, compensation history, PII, and bank deposit routes.'),
('res_dev_cluster', 'Staging Kubernetes Cluster', 'api', 'internal', 'Pre-production staging cluster for student testing and integration builds.'),
('res_campus_portal', 'University Academic Portal', 'api', 'public', 'Student course registration, homework submission, and grade viewing system.'),
('res_iam_vault', 'Enterprise IAM Vault & KMS', 'iam_policy', 'production_core', 'Central secrets engine, role definitions, and access keys.');

-- 2. Insert Permissions
INSERT INTO permissions (id, name, action, resource_id, is_dangerous, is_destructive, is_sensitive, description) VALUES
-- Database permissions
('perm_read_dev_db', 'db:read_dev', 'read', 'res_dev_cluster', false, false, false, 'Read access to staging development cluster logs and metrics'),
('perm_write_dev_db', 'db:write_dev', 'write', 'res_dev_cluster', false, false, false, 'Deploy test containers and schema migrations in staging'),
('perm_read_prod_db', 'db:read_prod', 'read', 'res_prod_postgres', false, false, true, 'Read replica queries for analytical reporting'),
('perm_delete_prod_db', 'db:drop_prod_tables', 'delete', 'res_prod_postgres', true, true, true, 'DROP TABLE and CASCADE schema deletion in Production Database'),

-- Financial permissions
('perm_invoice_create', 'finance:invoice_create', 'write', 'res_erp_financials', false, false, false, 'Submit new vendor payment requests and invoices'),
('perm_invoice_approve', 'finance:invoice_approve', 'approve', 'res_erp_financials', true, false, true, 'Formally authorize vendor invoices up to $500,000'),
('perm_payment_release', 'finance:payment_release', 'release', 'res_erp_financials', true, true, true, 'Trigger automated wire disbursements directly from treasury accounts'),

-- HR & IAM permissions
('perm_view_directory', 'hr:view_directory', 'read', 'res_hr_payroll', false, false, false, 'View employee organization chart and corporate directory'),
('perm_export_payroll', 'hr:export_payroll_records', 'export', 'res_hr_payroll', true, false, true, 'Bulk export unencrypted payroll CSVs and executive tax IDs'),
('perm_modify_iam_policies', 'iam:modify_policies', 'admin', 'res_iam_vault', true, true, true, 'Create or alter role trust relationships and root access boundaries'),

-- Student permissions
('perm_submit_coursework', 'portal:submit_assignment', 'write', 'res_campus_portal', false, false, false, 'Submit laboratory assignments and view grades');

-- 3. Insert Roles
INSERT INTO roles (id, name, description, department, is_system_role, risk_tier) VALUES
('rol_student', 'Undergraduate Student', 'Standard enrolled student with sandbox and homework access', 'Computer Science', false, 'low'),
('rol_db_operator', 'Database Operator', 'Infrastructure role for managing staging and production database instances', 'Cloud Engineering', false, 'high'),
('rol_finance_reviewer', 'Accounts Payable Reviewer', 'Reviews invoices and vendor documentation', 'Finance', false, 'medium'),
('rol_finance_disburser', 'Treasury Disbursements Lead', 'Authorizes treasury funds transfers and bank wires', 'Treasury', false, 'high'),
('rol_devops_engineer', 'Senior DevOps Engineer', 'Manages cloud infrastructure, IAM templates, and CI/CD pipelines', 'DevOps', false, 'critical'),
('rol_junior_analyst', 'Junior Research Analyst', 'Read-only analyst observing data trends and building slide decks', 'Analytics', false, 'low'),
('rol_sys_admin', 'Principal Enterprise Administrator', 'Break-glass root administrator for enterprise infrastructure', 'Security Operations', true, 'critical');

-- 4. Role Inheritance
-- Example: Database Operator inherits from Junior Analyst
INSERT INTO role_inheritance (id, parent_role_id, child_role_id) VALUES
('inh_1', 'rol_junior_analyst', 'rol_db_operator');

-- 5. Role Permissions
INSERT INTO role_permissions (id, role_id, permission_id) VALUES
-- Student role
('rp_1', 'rol_student', 'perm_submit_coursework'),
-- Database Operator role
('rp_2', 'rol_db_operator', 'perm_read_dev_db'),
('rp_3', 'rol_db_operator', 'perm_write_dev_db'),
('rp_4', 'rol_db_operator', 'perm_delete_prod_db'),
-- Finance Reviewer
('rp_5', 'rol_finance_reviewer', 'perm_invoice_create'),
('rp_6', 'rol_finance_reviewer', 'perm_invoice_approve'),
-- Finance Disburser
('rp_7', 'rol_finance_disburser', 'perm_payment_release'),
-- DevOps Engineer
('rp_8', 'rol_devops_engineer', 'perm_read_prod_db'),
('rp_9', 'rol_devops_engineer', 'perm_export_payroll'),
('rp_10', 'rol_devops_engineer', 'perm_modify_iam_policies'),
-- Junior Analyst
('rp_11', 'rol_junior_analyst', 'perm_view_directory'),
-- Sys Admin (all broad administrative permissions)
('rp_12', 'rol_sys_admin', 'perm_modify_iam_policies'),
('rp_13', 'rol_sys_admin', 'perm_delete_prod_db'),
('rp_14', 'rol_sys_admin', 'perm_payment_release');

-- 6. Insert Users
INSERT INTO users (id, name, email, department, title, is_admin) VALUES
('usr_101', 'Alex Rivera', 'alex.rivera@gat.edu', 'Computer Science', 'Student / Lab Assistant', false),
('usr_102', 'Jordan Taylor', 'jordan.taylor@byteforge.corp', 'Finance', 'Senior Accounts Manager', false),
('usr_103', 'Morgan Chen', 'morgan.chen@byteforge.corp', 'Analytics', 'Junior Research Analyst', false),
('usr_104', 'ByteForge', 'byteforge@byteforge.corp', 'Security Operations', 'Principal Systems Architect', true),
('usr_105', 'Marcus Vance', 'marcus.vance@byteforge.corp', 'DevOps', 'Cloud Infrastructure Specialist', false),
('usr_106', 'Priya Sharma', 'priya.sharma@gat.edu', 'Computer Science', 'Graduate Student Researcher', false);

-- 7. Assign User Roles
INSERT INTO user_roles (id, user_id, role_id, assigned_by) VALUES
-- Scenario 1: Alex Rivera (Student) also given Database Operator role!
('ur_1', 'usr_101', 'rol_student', 'admin_admissions'),
('ur_2', 'usr_101', 'rol_db_operator', 'admin_lab_supervisor'),

-- Scenario 2: Jordan Taylor (Finance) has BOTH Reviewer and Disburser roles!
('ur_3', 'usr_102', 'rol_finance_reviewer', 'hr_onboarding'),
('ur_4', 'usr_102', 'rol_finance_disburser', 'cfo_interim_override'),

-- Scenario 3: Morgan Chen is currently Junior Analyst
('ur_5', 'usr_103', 'rol_junior_analyst', 'analytics_director'),

-- Scenario 4: ByteForge has Sys Admin
('ur_6', 'usr_104', 'rol_sys_admin', 'board_resolution'),

-- Normal user Marcus Vance
('ur_7', 'usr_105', 'rol_devops_engineer', 'devops_lead'),

-- Normal student Priya
('ur_8', 'usr_106', 'rol_student', 'admin_admissions');

-- 8. Direct Grants (Scenario 3 Stale Grant: Morgan Chen has direct lingering grant)
INSERT INTO direct_grants (id, user_id, permission_id, resource_id, reason, granted_by, granted_at) VALUES
('dg_1', 'usr_103', 'perm_export_payroll', 'res_hr_payroll', 'Emergency export during Q3 2025 organizational restructuring', 'vp_engineering', '2025-08-15 10:00:00Z');

-- 9. Role Change History (Scenario 3 context)
INSERT INTO role_history (id, user_id, former_role_id, former_role_name, changed_date, status, notes) VALUES
('rh_1', 'usr_103', 'rol_devops_engineer', 'Senior DevOps Engineer', '2025-09-01 09:00:00Z', 'unrevoked', 'Transferred from DevOps to Analytics. Direct payroll export grant dg_1 was never decommissioned.');

-- 10. Approved Admin Access (Scenario 4 Safeguard)
INSERT INTO approved_admin_access (id, user_id, permission_id, resource_id, approved_by, approval_ticket, justification, valid_until, is_active) VALUES
('aaa_1', 'usr_104', 'perm_delete_prod_db', 'res_prod_postgres', 'CISO Governance Board', 'SEC-AUTH-2026-992', 'Approved break-glass disaster recovery authorization for Principal Systems Architect.', '2027-01-01 00:00:00Z', true),
('aaa_2', 'usr_104', 'perm_modify_iam_policies', 'res_iam_vault', 'CISO Governance Board', 'SEC-AUTH-2026-992', 'Root enterprise security policy maintenance and emergency rotation privilege.', '2027-01-01 00:00:00Z', true);

-- 11. Access Policies
INSERT INTO access_policies (id, name, policy_type, description, rule_definition) VALUES
('pol_sod_finance', 'Separation of Duties: Financial Authorization Conflict', 'sod_conflict', 'Prohibits any single identity from simultaneously holding invoice approval and payment release rights.', '{"conflicting_permissions": ["perm_invoice_approve", "perm_payment_release"], "risk": "CRITICAL"}'),
('pol_dangerous_db', 'Dangerous Action: Production DB Drop Restriction', 'danger_threshold', 'Restricts drop table and cascade delete on Production Postgres from non-vetted operational roles.', '{"dangerous_permissions": ["perm_delete_prod_db"], "prohibited_departments": ["Computer Science", "Finance", "Analytics"]}'),
('pol_stale_role', 'Stale Role De-provisioning Policy', 'stale_grace_period', 'Requires all direct grants and privileged permissions from former job titles to be revoked within 14 days of transfer.', '{"grace_period_days": 14}'),
('pol_sensitive_export', 'Sensitive PII / Payroll Export Guard', 'least_privilege', 'Restricts unencrypted payroll data exports solely to authorized VP HR personnel.', '{"restricted_permissions": ["perm_export_payroll"], "authorized_departments": ["Human Resources"]}');
