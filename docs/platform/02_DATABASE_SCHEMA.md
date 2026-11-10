# 02 — Database Schema (PostgreSQL 16 via Prisma)

**Status:** Baseline v1.0. The Prisma schema below is the authoritative data model for `server/prisma/schema.prisma`. Entity and enum names here are referenced by `03_API_SPECIFICATION.md` and `06_MODULE_FUNCTIONAL_SPECIFICATIONS.md`.

Conventions (from doc 00 §5.2): models `PascalCase` mapped to `snake_case` plural tables; columns `snake_case`; `uuid` PKs (`gen_random_uuid()`; switch to v7 via `uuidv7()` extension when available); `created_at`/`updated_at`/`deleted_at` on business tables; money `Decimal @db.Decimal(14,2)`; all timestamps `timestamptz`.

---

## 1. Schema Overview

```
Identity & Org      User · UserCredential · PasswordHistory · MfaRecoveryCode · UserSession · Role · Permission · RolePermission · UserRole
                    · Delegation · Employee · Department · Site · Grade · Designation
Workflow            WorkflowTemplate · WorkflowInstance · WorkflowStep · WorkflowAction
Platform            Notification · NotificationPreference · NotificationDelivery · DueItem · FileObject
                    · Attachment · AuditLog · Sequence · Setting · Geofence · DeviceToken
MOD-01 Notices      Notice · NoticeAudience · NoticeReceipt · Broadcast
MOD-02 Briefings    VoiceBriefing · VoiceBriefingListen
MOD-03 Note-sheets  NoteSheet · NoteParagraph · NoteSignatory · VendorQuote · Signature
MOD-04 Parcels      Parcel · ParcelEvent · ParcelReturn
MOD-05 Assets       AssetCategory · Asset · AssetEvent · AssetCustody · AssetSpare · WorkOrder
                    · AssetRequisition · AssetTransfer · AssetDisposal · DepreciationSnapshot
MOD-06 Compliance   RegulatoryBody · LicenceType · Licence · LicenceRenewal · LicenceChecklistItem · LicenceDocument
MOD-07 HSE          Incident · IncidentPerson · IncidentRca · CapaAction · IncidentClosure
MOD-08 Visitors     Visitor · Visit · VisitPpe · VisitZone · VisitInspectionFinding · Watchlist
MOD-09 Fleet        Driver · Vehicle · VehicleDocument · VehicleRequisition · Trip · TripEvent · TripLocation · FuelVoucher
                    · TollClaim · FleetChatMessage
MOD-10 Attendance   Shift · ShiftAssignment · AttendancePunch · AttendanceDay · Regularisation · LeaveType
                    · LeaveBalance · LeaveRequest
MOD-11/12/13 Claims ExpensePolicy · Claim · ClaimLine · Advance
MOD-14 Bus          Bus · BusRoute · BusStop · BusSeat · SeatAllocation · SeatWaitlist · SeatOffer · BusBroadcast
MOD-15 Chat         ChatChannel · ChatMember · ChatMessage · ChatReadReceipt · Directive
MOD-16 Workforce    ExitClearance · ExitClearanceItem
```

Tables: 108 (idempotency replay cache lives in Redis, see doc 00 §5.1). Audited models (write `AuditLog` on every change): everything under Identity, Workflow, and every module table except ChatMessage, Notification, NotificationDelivery, AuditLog itself.

---

## 2. Full Prisma Schema

```prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["postgresqlExtensions", "fullTextSearchPostgres", "views"]
}

datasource db {
  provider   = "postgresql"
  url        = env("DATABASE_URL")
  extensions = [pgcrypto, pg_trgm, postgis]
}

/* ─────────────────────────── ENUMS ─────────────────────────── */

enum Gender {
  MALE
  FEMALE
  OTHER
}
enum Lang {
  EN
  BN
}
enum Scope {
  SELF
  TEAM
  DEPARTMENT
  SITE
  COMPANY
}
enum EmploymentStatus {
  ACTIVE
  ON_LEAVE
  SUSPENDED
  OFFBOARDING
  OFFBOARDED
}
enum Priority {
  LOW
  NORMAL
  HIGH
  CRITICAL
}
enum WorkflowStatus {
  DRAFT
  SUBMITTED
  IN_REVIEW
  APPROVED
  REJECTED
  RETURNED
  WITHDRAWN
  CANCELLED
}
enum StepStatus {
  PENDING
  ACTIVE
  COMPLETED
  SKIPPED
  ESCALATED
}
enum StepDecision {
  APPROVED
  REJECTED
  RETURNED
}
enum WorkflowActionType {
  SUBMIT
  APPROVE
  REJECT
  RETURN
  DELEGATE
  ESCALATE
  COMMENT
  WITHDRAW
  REASSIGN
}
enum ApproverRule {
  ROLE
  LINE_MANAGER
  DEPARTMENT_HEAD
  USER
  DYNAMIC
}
enum NotificationChannel {
  IN_APP
  PUSH
  SMS
  EMAIL
}
enum DeliveryStatus {
  QUEUED
  SENT
  DELIVERED
  FAILED
  READ
}
enum DueStatus {
  OPEN
  SNOOZED
  DONE
  OVERDUE
  CANCELLED
}
enum ScanStatus {
  PENDING
  CLEAN
  INFECTED
  FAILED
}
enum GeofenceType {
  CIRCLE
  POLYGON
}
enum Platform {
  ANDROID
  IOS
  WEB
}
enum NoticeCategory {
  HR
  ADMIN
  SAFETY
  POLICY
  OPERATIONS
  FINANCE
  EXECUTIVE
}
enum NoticeStatus {
  DRAFT
  SCHEDULED
  PUBLISHED
  EXPIRED
  ARCHIVED
}
enum AudienceType {
  ALL
  SITE
  DEPARTMENT
  ROLE
  GRADE
  USER
}
enum NoteSheetStatus {
  DRAFT
  IN_REVIEW
  RETURNED
  APPROVED
  REJECTED
  WITHDRAWN
}
enum SignatoryStatus {
  UPCOMING
  PENDING
  SIGNED
  RETURNED
  SKIPPED
}
enum SignatureMethod {
  DRAWN
  TYPED
  STAMP
  UPLOADED
}
enum ParcelCategory {
  LEGAL_DOCS
  QC_SAMPLE
  SPARES
  TENDER_BID
  IT_HARDWARE
  GENERAL
  CONFIDENTIAL
}
enum ParcelStatus {
  CREATED
  DISPATCHED
  IN_TRANSIT
  AT_GATE
  OUT_FOR_DELIVERY
  DELIVERED
  RETURN_INITIATED
  RETURN_IN_TRANSIT
  RETURNED
  LOST
  DAMAGED
  QUARANTINED
}
enum ParcelEventType {
  CREATED
  HANDOVER
  CHECKPOINT
  GATE_IN
  OUT_FOR_DELIVERY
  OTP_VERIFIED
  DELIVERED
  TAMPER_FLAGGED
  RETURN_INITIATED
  RETURN_CHECKPOINT
  RETURNED
  EXCEPTION
  NOTE
}
enum TamperStatus {
  SECURE
  INSPECTED
  FLAGGED
}
enum ReturnReason {
  TAMPER_BROKEN
  DAMAGED_CONTENTS
  WRONG_DOCUMENTS
  RECIPIENT_REFUSED
  RECIPIENT_UNAVAILABLE
}
enum AssetClass {
  PLANT
  VEHICLE
  IT
  SAFETY
  LAB
  CORPORATE
}
enum Criticality {
  CRITICAL_A
  ESSENTIAL_B
  GENERAL_C
}
enum DepreciationMethod {
  SLM
  WDV
  UOP
}
enum AssetStage {
  REQUESTED
  PROCURED
  IN_STOCK
  OPERATIONAL
  IN_TRANSFER
  MAINTENANCE
  CALIBRATION_DUE
  QUARANTINE_LOTO
  DECOMMISSIONED
  DISPOSED
  LOST
}
enum AssetEventType {
  REQUISITION_APPROVED
  PROCURED
  CAPITALIZED
  COMMISSIONED
  CUSTODY_ASSIGNED
  CUSTODY_SIGNED
  TRANSFER_INITIATED
  TRANSFER_COMPLETED
  CUSTODY_RECLAIMED
  PM_CERTIFIED
  CAPEX_OVERHAUL
  DEFECT_FLAGGED
  LOTO_APPLIED
  LOTO_RELEASED
  DECOMMISSION_SURVEY
  DISPOSED
  STOCK_ADJUSTED
  NOTE
}
enum WorkOrderType {
  PM
  CM
  CBM
  CAL
}
enum WorkOrderStatus {
  SCHEDULED
  IN_PROGRESS
  ON_HOLD
  COMPLETED
  CANCELLED
}
enum AssetReqStage {
  PENDING_HOD
  PENDING_EXECUTIVE
  APPROVED_PROCURING
  COMMISSIONED
  REJECTED
}
enum TransferStatus {
  INITIATED
  IN_TRANSIT
  COMPLETED
  CANCELLED
}
enum DisposalReason {
  ECONOMIC_LIFE_EXHAUSTED
  IRREPARABLE_BREAKDOWN
  TECHNOLOGICAL_OBSOLESCENCE
  REGULATORY_CONDEMNATION
  LOST_STOLEN
}
enum DisposalMethod {
  AUCTION
  OEM_TRADE_IN
  SCRAP_RECYCLING
  INSURANCE_WRITE_OFF
  DONATION
}
enum LicenceStage {
  INTERNAL_REVIEW
  APPLICATION_FILED
  FIELD_INSPECTION
  MINISTRY_VETTING
  RENEWED
}
enum LicenceStatus {
  ACTIVE
  RENEWAL_IN_PROGRESS
  EXPIRED
  SUSPENDED
  REVOKED
}
enum ChecklistStatus {
  PENDING
  PASSED
  FAILED
  NA
}
enum IncidentType {
  NEAR_MISS
  HAZARD_OBSERVATION
  FIRST_AID
  MEDICAL_TREATMENT
  LOST_TIME
  FATALITY
  SPILL_LEAK
  PRESSURE_PIPING
  FIRE_THERMAL
  ELECTRICAL_ARC
  EQUIPMENT_DAMAGE
  ENVIRONMENTAL
  SECURITY
  VEHICLE_ACCIDENT
}
enum IncidentStage {
  REPORTED
  TRIAGED
  UNDER_INVESTIGATION
  CAPA_EXECUTION
  MANAGEMENT_REVIEW
  CLOSED
}
enum RiskCategory {
  LOW
  MEDIUM
  HIGH
  EXTREME
}
enum CapaType {
  IMMEDIATE_CONTAINMENT
  CORRECTIVE
  PREVENTIVE
}
enum CapaStatus {
  PENDING
  IN_PROGRESS
  COMPLETED
  VERIFIED
  OVERDUE
}
enum PersonRole {
  INJURED
  WITNESS
  REPORTER
  INVESTIGATOR
}
enum VisitorCategory {
  VIP
  GOVT
  VENDOR
  CLIENT
  CONTRACTOR
  REGULAR
}
enum VipTier {
  VVIP_L1
  VIP_L2
  OFFICIAL_DELEGATION
}
enum VisitStatus {
  PRE_REGISTERED
  APPROVED
  CHECKED_IN
  CHECKED_OUT
  OVERDUE
  CANCELLED
  DENIED
}
enum ZoneLevel {
  GREEN
  YELLOW
  RED
}
enum FindingStatus {
  PASSED
  OBSERVATION
  CRITICAL
}
enum DriverStatus {
  AVAILABLE
  ON_TRIP
  OFF_DUTY
  REST_REQUIRED
  SICK_LEAVE
  ON_LEAVE
  SUSPENDED
}
enum LicenceClass {
  HEAVY_HAZMAT
  HEAVY
  LIGHT
  PSV
}
enum VehicleType {
  EXECUTIVE
  SEDAN
  MICROBUS
  PICKUP
  TANKER
  BUS
}
enum VehicleStatus {
  AVAILABLE
  IN_TRANSIT
  LOADING
  MAINTENANCE
  GROUNDED
  RETIRED
}
enum RequisitionStatus {
  DRAFT
  PENDING_APPROVAL
  APPROVED
  ASSIGNED
  IN_TRANSIT
  COMPLETED
  REJECTED
  CANCELLED
}
enum TripType {
  ONE_WAY
  ROUND_TRIP
}
enum CapacityClass {
  SEDAN_4
  MICROBUS_7
  PICKUP_4X4
  TANKER_HEAVY
}
enum TripEventType {
  ASSIGNED
  GATE_OUT
  CHECKPOINT
  GATE_IN
  COMPLETED
  SOS
  ROUTE_DEVIATION
  NOTE
}
enum ClaimStatus {
  DRAFT
  PENDING_MANAGER
  PENDING_FINANCE
  APPROVED
  REJECTED
  RETURNED
  SETTLED
  CANCELLED
}
enum ClaimType {
  TADA
  CONVEYANCE
  TOUR_EVENT
}
enum TollStatus {
  PENDING
  APPROVED
  REJECTED
  PAID
}
enum FleetMsgType {
  TEXT
  TOLL_CLAIM
  LOCATION
  SYSTEM
  VOICE
  ATTACHMENT
}
enum PunchType {
  IN
  OUT
}
enum PunchResult {
  ACCEPTED
  REJECTED_OUTSIDE_FENCE
  REJECTED_ACCURACY
  REJECTED_MOCK
  PENDING_REGULARISATION
}
enum DayStatus {
  PRESENT
  LATE
  EARLY_LEAVE
  ABSENT
  ON_LEAVE
  HOLIDAY
  WEEKEND
  FIELD_DUTY
  HALF_DAY
}
enum LeaveStatus {
  PENDING
  APPROVED
  REJECTED
  CANCELLED
}
enum RegularisationType {
  MISSED_PUNCH
  FIELD_DUTY
  LATE_JUSTIFICATION
  REMOTE_WORK
}
enum SeatStatus {
  EMPTY
  OCCUPIED
  VACATED
  BLOCKED
}
enum SeatCategory {
  REGULAR
  EXECUTIVE
  LADY_PRIORITY
  SENIOR_STAFF
}
enum BookingType {
  PERMANENT
  SHIFT_PASS
  GUEST
}
enum WaitlistStatus {
  WAITING
  OFFERED
  ACCEPTED
  DECLINED
  EXPIRED
  CANCELLED
}
enum OfferStatus {
  PENDING
  ACCEPTED
  DECLINED
  EXPIRED
}
enum ChatMsgType {
  TEXT
  VOICE
  DOCUMENT
  DIRECTIVE
  SYSTEM
}
enum PresenceStatus {
  ONLINE
  AWAY
  IN_MEETING
  OFFLINE
}
enum ClearanceItemKey {
  IT_ACCESS
  RFID_BADGE
  ASSETS_RETURNED
  VEHICLE_FUEL_CARD
  BUS_SEAT
  FINANCE_SETTLEMENT
  HR_EXIT_INTERVIEW
}
enum ClearanceStatus {
  PENDING
  CLEARED
  WAIVED
}
/* ─────────────────────── IDENTITY & ORG ─────────────────────── */

model Site {
  id          String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  code        String   @unique                         // HQ_BARIDHARA
  name        String
  nameBn      String?  @map("name_bn")
  address     String?
  timezone    String   @default("Asia/Dhaka")
  isActive    Boolean  @default(true) @map("is_active")
  createdAt   DateTime @default(now()) @map("created_at") @db.Timestamptz
  updatedAt   DateTime @updatedAt @map("updated_at") @db.Timestamptz

  geofences     Geofence[]
  departments   Department[]
  employees     Employee[]
  assets        Asset[]
  visits        Visit[]
  @@map("sites")
}

model Department {
  id         String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  code       String   @unique                           // PROC, HR, FIN
  name       String
  nameBn     String?  @map("name_bn")
  parentId   String?  @map("parent_id") @db.Uuid
  headUserId String?  @map("head_user_id") @db.Uuid
  siteId     String?  @map("site_id") @db.Uuid
  costCenter String?  @map("cost_center")
  isActive   Boolean  @default(true) @map("is_active")
  createdAt  DateTime @default(now()) @map("created_at") @db.Timestamptz
  updatedAt  DateTime @updatedAt @map("updated_at") @db.Timestamptz

  parent    Department?  @relation("DeptTree", fields: [parentId], references: [id])
  children  Department[] @relation("DeptTree")
  head      User?        @relation("DeptHead", fields: [headUserId], references: [id])
  site      Site?        @relation(fields: [siteId], references: [id])
  employees Employee[]
  @@map("departments")
}

model Grade {
  id        String  @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  code      String  @unique      // G1..G10
  name      String
  rank      Int                  // lower = more senior
  employees Employee[]
  policies  ExpensePolicy[]
  @@map("grades")
}

model Designation {
  id     String  @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  title  String
  titleBn String? @map("title_bn")
  employees Employee[]
  @@map("designations")
}

model User {
  id            String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  email         String   @unique
  phone         String?  @unique
  isActive      Boolean  @default(true) @map("is_active")
  mfaEnabled    Boolean  @default(false) @map("mfa_enabled")
  mfaSecretEnc  String?  @map("mfa_secret_enc")
  lastLoginAt   DateTime? @map("last_login_at") @db.Timestamptz
  preferredLang Lang     @default(EN) @map("preferred_lang")
  createdAt     DateTime @default(now()) @map("created_at") @db.Timestamptz
  updatedAt     DateTime @updatedAt @map("updated_at") @db.Timestamptz
  deletedAt     DateTime? @map("deleted_at") @db.Timestamptz

  credential    UserCredential?
  employee      Employee?
  sessions      UserSession[]
  roles         UserRole[]
  deviceTokens  DeviceToken[]
  notifications Notification[]
  notificationPref NotificationPreference?
  delegationsFrom Delegation[] @relation("DelegFrom")
  delegationsTo   Delegation[] @relation("DelegTo")
  headOfDepts   Department[] @relation("DeptHead")
  auditLogs     AuditLog[]
  @@map("users")
}

model UserCredential {
  userId            String   @id @map("user_id") @db.Uuid
  passwordHash      String   @map("password_hash")      // argon2id
  passwordChangedAt DateTime @default(now()) @map("password_changed_at") @db.Timestamptz
  failedAttempts    Int      @default(0) @map("failed_attempts")
  lockedUntil       DateTime? @map("locked_until") @db.Timestamptz
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@map("user_credentials")
}

/// Last N password hashes to block reuse (doc 07 password policy).
model PasswordHistory {
  id           String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId       String   @map("user_id") @db.Uuid
  passwordHash String   @map("password_hash")
  createdAt    DateTime @default(now()) @map("created_at") @db.Timestamptz
  @@index([userId, createdAt])
  @@map("password_history")
}

/// One-time MFA recovery codes (argon2id-hashed); regenerated as a set.
model MfaRecoveryCode {
  id        String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId    String   @map("user_id") @db.Uuid
  codeHash  String   @map("code_hash")
  usedAt    DateTime? @map("used_at") @db.Timestamptz
  createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz
  @@index([userId])
  @@map("mfa_recovery_codes")
}

model UserSession {
  id               String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId           String   @map("user_id") @db.Uuid
  familyId         String   @map("family_id") @db.Uuid          // constant across rotations; reuse of an old token revokes the whole family
  refreshTokenHash String   @unique @map("refresh_token_hash")
  rotatedAt        DateTime? @map("rotated_at") @db.Timestamptz
  replacedById     String?  @map("replaced_by_id") @db.Uuid
  platform         Platform
  deviceName       String?  @map("device_name")
  deviceId         String?  @map("device_id")
  ip               String?
  userAgent        String?  @map("user_agent")
  expiresAt        DateTime @map("expires_at") @db.Timestamptz
  revokedAt        DateTime? @map("revoked_at") @db.Timestamptz
  lastSeenAt       DateTime @default(now()) @map("last_seen_at") @db.Timestamptz
  createdAt        DateTime @default(now()) @map("created_at") @db.Timestamptz
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@index([userId])
  @@index([familyId])
  @@map("user_sessions")
}

model Role {
  id          String  @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  key         String  @unique            // CHAIRMAN, HR_ADMIN …
  name        String
  description String?
  isSystem    Boolean @default(false) @map("is_system")
  permissions RolePermission[]
  users       UserRole[]
  @@map("roles")
}

model Permission {
  id          String @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  key         String @unique            // claims:approve
  module      String
  description String?
  roles RolePermission[]
  @@map("permissions")
}

model RolePermission {
  roleId       String @map("role_id") @db.Uuid
  permissionId String @map("permission_id") @db.Uuid
  scope        Scope  @default(COMPANY)
  role       Role       @relation(fields: [roleId], references: [id], onDelete: Cascade)
  permission Permission @relation(fields: [permissionId], references: [id], onDelete: Cascade)
  @@id([roleId, permissionId])
  @@map("role_permissions")
}

model UserRole {
  userId     String   @map("user_id") @db.Uuid
  roleId     String   @map("role_id") @db.Uuid
  siteId     String?  @map("site_id") @db.Uuid      // optional site restriction
  grantedBy  String?  @map("granted_by") @db.Uuid
  grantedAt  DateTime @default(now()) @map("granted_at") @db.Timestamptz
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  role Role @relation(fields: [roleId], references: [id], onDelete: Cascade)
  @@id([userId, roleId])
  @@map("user_roles")
}

model Delegation {
  id         String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  fromUserId String   @map("from_user_id") @db.Uuid
  toUserId   String   @map("to_user_id") @db.Uuid
  modules    String[]                      // [] = all
  maxAmount  Decimal? @map("max_amount") @db.Decimal(14,2)
  startsAt   DateTime @map("starts_at") @db.Timestamptz
  endsAt     DateTime @map("ends_at") @db.Timestamptz
  reason     String?
  isActive   Boolean  @default(true) @map("is_active")
  createdAt  DateTime @default(now()) @map("created_at") @db.Timestamptz
  from User @relation("DelegFrom", fields: [fromUserId], references: [id])
  to   User @relation("DelegTo",   fields: [toUserId],   references: [id])
  @@index([fromUserId, startsAt, endsAt])
  @@map("delegations")
}

model Employee {
  id             String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId         String   @unique @map("user_id") @db.Uuid
  empCode        String   @unique @map("emp_code")          // EMP-1042
  sapPernr       String?  @unique @map("sap_pernr")
  fullName       String   @map("full_name")
  fullNameBn     String?  @map("full_name_bn")
  designationId  String?  @map("designation_id") @db.Uuid
  gradeId        String?  @map("grade_id") @db.Uuid
  departmentId   String   @map("department_id") @db.Uuid
  siteId         String   @map("site_id") @db.Uuid
  lineManagerId  String?  @map("line_manager_id") @db.Uuid
  joinDate       DateTime @map("join_date") @db.Date
  exitDate       DateTime? @map("exit_date") @db.Date
  status         EmploymentStatus @default(ACTIVE)
  nidEnc         String?  @map("nid_enc")                    // AES-256-GCM at app layer (doc 07)
  gender         Gender?
  bloodGroup     String?  @map("blood_group")
  emergencyContact String? @map("emergency_contact")
  photoFileId    String?  @map("photo_file_id") @db.Uuid
  createdAt      DateTime @default(now()) @map("created_at") @db.Timestamptz
  updatedAt      DateTime @updatedAt @map("updated_at") @db.Timestamptz
  deletedAt      DateTime? @map("deleted_at") @db.Timestamptz

  user        User        @relation(fields: [userId], references: [id])
  designation Designation? @relation(fields: [designationId], references: [id])
  grade       Grade?      @relation(fields: [gradeId], references: [id])
  department  Department  @relation(fields: [departmentId], references: [id])
  site        Site        @relation(fields: [siteId], references: [id])
  lineManager Employee?   @relation("LineManager", fields: [lineManagerId], references: [id])
  reports     Employee[]  @relation("LineManager")
  exitClearance ExitClearance?
  custodies   AssetCustody[]
  leaveBalances LeaveBalance[]
  @@index([departmentId])
  @@index([siteId])
  @@index([lineManagerId])
  @@map("employees")
}

/* ─────────────────────────── WORKFLOW ─────────────────────────── */

model WorkflowTemplate {
  id          String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  key         String                               // NOTE_SHEET_CAPEX
  objectType  String   @map("object_type")         // NoteSheet, Claim, VehicleRequisition …
  version     Int      @default(1)
  name        String
  definition  Json                                 // { steps: [{key, approverRule, approverRef, parallel, condition, slaHours, escalateTo}] }
  isActive    Boolean  @default(true) @map("is_active")
  createdAt   DateTime @default(now()) @map("created_at") @db.Timestamptz
  instances   WorkflowInstance[]
  @@unique([key, version])
  @@map("workflow_templates")
}

model WorkflowInstance {
  id           String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  templateId   String   @map("template_id") @db.Uuid
  objectType   String   @map("object_type")
  objectId     String   @map("object_id") @db.Uuid
  status       WorkflowStatus @default(DRAFT)
  currentStepNo Int?    @map("current_step_no")
  initiatorId  String   @map("initiator_id") @db.Uuid
  summary      Json?                                // denormalised {title, amount, refNo, department}
  submittedAt  DateTime? @map("submitted_at") @db.Timestamptz
  completedAt  DateTime? @map("completed_at") @db.Timestamptz
  createdAt    DateTime @default(now()) @map("created_at") @db.Timestamptz
  updatedAt    DateTime @updatedAt @map("updated_at") @db.Timestamptz
  template WorkflowTemplate @relation(fields: [templateId], references: [id])
  steps    WorkflowStep[]
  actions  WorkflowAction[]
  @@unique([objectType, objectId])
  @@index([status])
  @@index([initiatorId])
  @@map("workflow_instances")
}

model WorkflowStep {
  id              String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  instanceId      String   @map("instance_id") @db.Uuid
  stepNo          Int      @map("step_no")
  key             String
  approverRule    ApproverRule @map("approver_rule")
  approverUserId  String?  @map("approver_user_id") @db.Uuid     // resolved
  delegatedToId   String?  @map("delegated_to_id") @db.Uuid
  status          StepStatus @default(PENDING)
  decision        StepDecision?
  comment         String?
  slaHours        Int?     @map("sla_hours")
  activatedAt     DateTime? @map("activated_at") @db.Timestamptz
  dueAt           DateTime? @map("due_at") @db.Timestamptz
  decidedAt       DateTime? @map("decided_at") @db.Timestamptz
  decidedById     String?  @map("decided_by_id") @db.Uuid
  signatureId     String?  @map("signature_id") @db.Uuid
  metadata        Json?                                           // escalation target, reassignment reason, delegation ref
  instance WorkflowInstance @relation(fields: [instanceId], references: [id], onDelete: Cascade)
  @@index([approverUserId, status])
  @@index([delegatedToId, status])
  @@index([dueAt])
  @@map("workflow_steps")
}

model WorkflowAction {
  id         String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  instanceId String   @map("instance_id") @db.Uuid
  stepId     String?  @map("step_id") @db.Uuid
  actorId    String   @map("actor_id") @db.Uuid
  type       WorkflowActionType
  comment    String?
  metadata   Json?
  createdAt  DateTime @default(now()) @map("created_at") @db.Timestamptz
  instance WorkflowInstance @relation(fields: [instanceId], references: [id], onDelete: Cascade)
  @@index([instanceId, createdAt])
  @@map("workflow_actions")
}

/* ─────────────────────────── PLATFORM ─────────────────────────── */

model Notification {
  id        String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId    String   @map("user_id") @db.Uuid
  type      String                                  // APPROVAL_PENDING, PARCEL_DELIVERED …
  priority  Priority @default(NORMAL)
  title     String
  body      String
  data      Json?                                   // { module, objectType, objectId, route }
  readAt    DateTime? @map("read_at") @db.Timestamptz
  ackRequired Boolean @default(false) @map("ack_required")
  ackedAt   DateTime? @map("acked_at") @db.Timestamptz
  createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz
  user       User @relation(fields: [userId], references: [id], onDelete: Cascade)
  deliveries NotificationDelivery[]
  @@index([userId, readAt, createdAt])
  @@map("notifications")
}

model NotificationDelivery {
  id             String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  notificationId String   @map("notification_id") @db.Uuid
  channel        NotificationChannel
  status         DeliveryStatus @default(QUEUED)
  providerRef    String?  @map("provider_ref")
  error          String?
  attempts       Int      @default(0)
  sentAt         DateTime? @map("sent_at") @db.Timestamptz
  notification Notification @relation(fields: [notificationId], references: [id], onDelete: Cascade)
  @@index([notificationId])
  @@map("notification_deliveries")
}

model NotificationPreference {
  userId       String  @id @map("user_id") @db.Uuid
  channels     NotificationChannel[] @default([IN_APP, PUSH])
  quietStart   String? @map("quiet_start")           // "22:00"
  quietEnd     String? @map("quiet_end")
  digestDaily  Boolean @default(false) @map("digest_daily")
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@map("notification_preferences")
}

model DeviceToken {
  id        String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId    String   @map("user_id") @db.Uuid
  platform  Platform
  token     String   @unique                        // Expo push token
  deviceId  String?  @map("device_id")
  lastSeenAt DateTime @default(now()) @map("last_seen_at") @db.Timestamptz
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@map("device_tokens")
}

model DueItem {
  id           String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  module       String
  objectType   String   @map("object_type")
  objectId     String   @map("object_id") @db.Uuid
  title        String
  ownerUserId  String   @map("owner_user_id") @db.Uuid
  dueAt        DateTime @map("due_at") @db.Timestamptz
  reminderDays Int[]    @default([90, 60, 30, 15, 7, 1, 0]) @map("reminder_days")
  remindersSent Int[]   @default([]) @map("reminders_sent")
  status       DueStatus @default(OPEN)
  autoAction   String?  @map("auto_action")         // CREATE_LICENCE_RENEWAL, CREATE_CAL_WO
  createdAt    DateTime @default(now()) @map("created_at") @db.Timestamptz
  updatedAt    DateTime @updatedAt @map("updated_at") @db.Timestamptz
  @@index([dueAt, status])
  @@index([objectType, objectId])
  @@map("due_items")
}

model FileObject {
  id          String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  bucket      String
  key         String   @unique
  fileName    String   @map("file_name")
  mime        String
  sizeBytes   Int      @map("size_bytes")
  sha256      String?
  scanStatus  ScanStatus @default(PENDING) @map("scan_status")
  uploadedById String  @map("uploaded_by_id") @db.Uuid
  isPublic    Boolean  @default(false) @map("is_public")
  isImmutable Boolean  @default(false) @map("is_immutable")     // signed PDFs: S3 object-lock applied, no delete/replace
  retainUntil DateTime? @map("retain_until") @db.Timestamptz
  createdAt   DateTime @default(now()) @map("created_at") @db.Timestamptz
  attachments Attachment[]
  @@map("file_objects")
}

model Attachment {
  id        String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  ownerType String   @map("owner_type")              // NoteSheet, Incident, Claim …
  ownerId   String   @map("owner_id") @db.Uuid
  fileId    String   @map("file_id") @db.Uuid
  kind      String?                                  // RECEIPT, PHOTO, CERTIFICATE, SIGNED_PDF
  createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz
  file FileObject @relation(fields: [fileId], references: [id])
  @@index([ownerType, ownerId])
  @@map("attachments")
}

model AuditLog {
  id          BigInt   @id @default(autoincrement())
  actorUserId String?  @map("actor_user_id") @db.Uuid
  action      String                                 // CREATE, UPDATE, DELETE, APPROVE, SIGN, OTP_VERIFY, LOGIN …
  entityType  String   @map("entity_type")
  entityId    String?  @map("entity_id")
  before      Json?
  after       Json?
  ip          String?
  userAgent   String?  @map("user_agent")
  requestId   String?  @map("request_id")
  createdAt   DateTime @default(now()) @map("created_at") @db.Timestamptz
  actor User? @relation(fields: [actorUserId], references: [id])
  @@index([entityType, entityId])
  @@index([actorUserId, createdAt])
  @@index([createdAt])
  @@map("audit_logs")
}

model Sequence {
  prefix  String
  year    Int
  current Int    @default(0)
  @@id([prefix, year])
  @@map("sequences")
}

model Setting {
  key       String   @id
  value     Json
  updatedBy String?  @map("updated_by") @db.Uuid
  updatedAt DateTime @updatedAt @map("updated_at") @db.Timestamptz
  @@map("settings")
}

model Geofence {
  id           String  @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  siteId       String  @map("site_id") @db.Uuid
  name         String
  type         GeofenceType
  centerLat    Decimal? @map("center_lat") @db.Decimal(9,6)
  centerLng    Decimal? @map("center_lng") @db.Decimal(9,6)
  radiusMeters Int?     @map("radius_meters")
  polygon      Json?                                 // GeoJSON Polygon
  isActive     Boolean  @default(true) @map("is_active")
  site Site @relation(fields: [siteId], references: [id])
  @@map("geofences")
}

/* ─────────────────────────── MOD-01 NOTICES ─────────────────────────── */

model Notice {
  id             String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  refNo          String   @unique @map("ref_no")
  title          String
  titleBn        String?  @map("title_bn")
  body           String
  bodyBn         String?  @map("body_bn")
  category       NoticeCategory
  priority       Priority @default(NORMAL)
  status         NoticeStatus @default(DRAFT)
  isPinned       Boolean  @default(false) @map("is_pinned")
  requiresAck    Boolean  @default(false) @map("requires_ack")
  publishAt      DateTime? @map("publish_at") @db.Timestamptz
  expiresAt      DateTime? @map("expires_at") @db.Timestamptz
  authorId       String   @map("author_id") @db.Uuid
  approvedById   String?  @map("approved_by_id") @db.Uuid
  recipientCount Int      @default(0) @map("recipient_count")
  ackCount       Int      @default(0) @map("ack_count")
  createdAt      DateTime @default(now()) @map("created_at") @db.Timestamptz
  updatedAt      DateTime @updatedAt @map("updated_at") @db.Timestamptz
  deletedAt      DateTime? @map("deleted_at") @db.Timestamptz
  audiences NoticeAudience[]
  receipts  NoticeReceipt[]
  @@index([status, publishAt])
  @@index([category])
  @@map("notices")
}

model NoticeAudience {
  id       String  @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  noticeId String  @map("notice_id") @db.Uuid
  type     AudienceType
  refId    String? @map("ref_id")                    // siteId / departmentId / roleKey / gradeId / userId
  notice Notice @relation(fields: [noticeId], references: [id], onDelete: Cascade)
  @@map("notice_audiences")
}

model NoticeReceipt {
  noticeId String   @map("notice_id") @db.Uuid
  userId   String   @map("user_id") @db.Uuid
  readAt   DateTime? @map("read_at") @db.Timestamptz
  ackedAt  DateTime? @map("acked_at") @db.Timestamptz
  notice Notice @relation(fields: [noticeId], references: [id], onDelete: Cascade)
  @@id([noticeId, userId])
  @@map("notice_receipts")
}

model Broadcast {
  id          String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  noticeId    String   @unique @map("notice_id") @db.Uuid
  authorId    String   @map("author_id") @db.Uuid
  showBanner  Boolean  @default(true) @map("show_banner")
  sendSms     Boolean  @default(false) @map("send_sms")
  activeUntil DateTime? @map("active_until") @db.Timestamptz
  createdAt   DateTime @default(now()) @map("created_at") @db.Timestamptz
  @@map("broadcasts")
}

/* ─────────────────────────── MOD-02 BRIEFINGS ─────────────────────────── */

model VoiceBriefing {
  id           String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  refNo        String   @unique @map("ref_no")
  title        String
  transcript   String
  transcriptBn String?  @map("transcript_bn")
  audioFileId  String?  @map("audio_file_id") @db.Uuid
  durationSec  Int?     @map("duration_sec")
  priority     Priority @default(NORMAL)
  authorId     String   @map("author_id") @db.Uuid
  audience     Json                                  // same shape as NoticeAudience[]
  publishedAt  DateTime? @map("published_at") @db.Timestamptz
  createdAt    DateTime @default(now()) @map("created_at") @db.Timestamptz
  listens VoiceBriefingListen[]
  @@map("voice_briefings")
}

model VoiceBriefingListen {
  briefingId String   @map("briefing_id") @db.Uuid
  userId     String   @map("user_id") @db.Uuid
  listenedAt DateTime @default(now()) @map("listened_at") @db.Timestamptz
  briefing VoiceBriefing @relation(fields: [briefingId], references: [id], onDelete: Cascade)
  @@id([briefingId, userId])
  @@map("voice_briefing_listens")
}

/* ─────────────────────────── MOD-03 NOTE-SHEETS ─────────────────────────── */

model NoteSheet {
  id             String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  fileNo         String   @unique @map("file_no")      // BOGCL/PROC/2026/0894
  title          String
  subject        String?
  departmentId   String   @map("department_id") @db.Uuid
  initiatorId    String   @map("initiator_id") @db.Uuid
  amount         Decimal? @db.Decimal(14,2)
  currency       String   @default("BDT")
  urgency        Priority @default(NORMAL)
  status         NoteSheetStatus @default(DRAFT)
  budgetHead     String?  @map("budget_head")
  budgetAllocated Decimal? @map("budget_allocated") @db.Decimal(14,2)
  budgetAvailable Decimal? @map("budget_available") @db.Decimal(14,2)
  sapPrRef       String?  @map("sap_pr_ref")
  poNumber       String?  @map("po_number")
  confidentiality String  @default("INTERNAL")
  finalPdfFileId String?  @map("final_pdf_file_id") @db.Uuid
  finalPdfSha256 String?  @map("final_pdf_sha256")
  verificationCode String? @unique @map("verification_code")
  approvedAt     DateTime? @map("approved_at") @db.Timestamptz
  createdAt      DateTime @default(now()) @map("created_at") @db.Timestamptz
  updatedAt      DateTime @updatedAt @map("updated_at") @db.Timestamptz
  deletedAt      DateTime? @map("deleted_at") @db.Timestamptz
  paragraphs  NoteParagraph[]
  signatories NoteSignatory[]
  quotes      VendorQuote[]
  @@index([status])
  @@index([initiatorId])
  @@index([departmentId])
  @@map("note_sheets")
}

model NoteParagraph {
  id          String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  noteSheetId String   @map("note_sheet_id") @db.Uuid
  seqNo       Int      @map("seq_no")
  authorId    String   @map("author_id") @db.Uuid
  authorTitle String?  @map("author_title")
  body        String
  kind        String   @default("NOTE")               // NOTE, APPROVAL, RETURN, QUERY
  contentHash String   @map("content_hash")           // sha256(prevHash + body + authorId + ts)
  prevHash    String?  @map("prev_hash")
  createdAt   DateTime @default(now()) @map("created_at") @db.Timestamptz
  noteSheet NoteSheet @relation(fields: [noteSheetId], references: [id], onDelete: Cascade)
  @@unique([noteSheetId, seqNo])
  @@map("note_paragraphs")
}

model NoteSignatory {
  id          String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  noteSheetId String   @map("note_sheet_id") @db.Uuid
  stepNo      Int      @map("step_no")
  userId      String   @map("user_id") @db.Uuid
  roleTitle   String   @map("role_title")
  isFinal     Boolean  @default(false) @map("is_final")
  status      SignatoryStatus @default(UPCOMING)
  signatureId String?  @map("signature_id") @db.Uuid
  signedAt    DateTime? @map("signed_at") @db.Timestamptz
  remark      String?
  noteSheet NoteSheet  @relation(fields: [noteSheetId], references: [id], onDelete: Cascade)
  signature Signature? @relation(fields: [signatureId], references: [id])
  @@unique([noteSheetId, stepNo])
  @@map("note_signatories")
}

model VendorQuote {
  id          String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  noteSheetId String   @map("note_sheet_id") @db.Uuid
  vendorName  String   @map("vendor_name")
  amount      Decimal  @db.Decimal(14,2)
  deliveryDays Int?    @map("delivery_days")
  warrantyMonths Int?  @map("warranty_months")
  isRecommended Boolean @default(false) @map("is_recommended")
  notes       String?
  noteSheet NoteSheet @relation(fields: [noteSheetId], references: [id], onDelete: Cascade)
  @@map("vendor_quotes")
}

model Signature {
  id          String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId      String   @map("user_id") @db.Uuid
  method      SignatureMethod
  imageFileId String?  @map("image_file_id") @db.Uuid
  otpVerified Boolean  @default(false) @map("otp_verified")
  ip          String?
  userAgent   String?  @map("user_agent")
  documentHash String? @map("document_hash")         // hash of what was signed
  stampCode   String   @unique @map("stamp_code")    // APPROVED-2026-7F3A91C2
  createdAt   DateTime @default(now()) @map("created_at") @db.Timestamptz
  signatories NoteSignatory[]
  @@map("signatures")
}

/* ─────────────────────────── MOD-04 PARCELS ─────────────────────────── */

model Parcel {
  id             String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  trackingNo     String   @unique @map("tracking_no")   // PKG-2026-9041
  waybillNo      String?  @unique @map("waybill_no")
  category       ParcelCategory
  urgency        Priority @default(NORMAL)
  description    String
  declaredValue  Decimal? @map("declared_value") @db.Decimal(14,2)
  senderUserId   String   @map("sender_user_id") @db.Uuid
  recipientUserId String? @map("recipient_user_id") @db.Uuid
  recipientName  String?  @map("recipient_name")
  recipientPhone String?  @map("recipient_phone")
  originSiteId   String   @map("origin_site_id") @db.Uuid
  destSiteId     String   @map("dest_site_id") @db.Uuid
  status         ParcelStatus @default(CREATED)
  tamperStatus   TamperStatus @default(SECURE) @map("tamper_status")
  sealNo         String?  @map("seal_no")
  courierUserId  String?  @map("courier_user_id") @db.Uuid
  tripId         String?  @map("trip_id") @db.Uuid
  otpHash        String?  @map("otp_hash")              // bcrypt of 6-digit OTP
  otpExpiresAt   DateTime? @map("otp_expires_at") @db.Timestamptz
  otpAttempts    Int      @default(0) @map("otp_attempts")
  deliveredAt    DateTime? @map("delivered_at") @db.Timestamptz
  isConfidential Boolean  @default(false) @map("is_confidential")
  weightKg       Decimal? @map("weight_kg") @db.Decimal(7,2)
  specialHandling String[] @default([]) @map("special_handling")   // FRAGILE, COLD_CHAIN, HAZMAT, KEEP_UPRIGHT
  createdAt      DateTime @default(now()) @map("created_at") @db.Timestamptz
  updatedAt      DateTime @updatedAt @map("updated_at") @db.Timestamptz
  deletedAt      DateTime? @map("deleted_at") @db.Timestamptz
  events ParcelEvent[]
  return ParcelReturn?
  @@index([status])
  @@index([senderUserId])
  @@index([recipientUserId])
  @@map("parcels")
}

model ParcelEvent {
  id          String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  parcelId    String   @map("parcel_id") @db.Uuid
  type        ParcelEventType
  actorUserId String?  @map("actor_user_id") @db.Uuid
  location    String?
  lat         Decimal? @db.Decimal(9,6)
  lng         Decimal? @db.Decimal(9,6)
  note        String?
  photoFileId String?  @map("photo_file_id") @db.Uuid
  eventHash   String   @map("event_hash")             // sha256 chain
  prevHash    String?  @map("prev_hash")
  createdAt   DateTime @default(now()) @map("created_at") @db.Timestamptz
  parcel Parcel @relation(fields: [parcelId], references: [id], onDelete: Cascade)
  @@index([parcelId, createdAt])
  @@map("parcel_events")
}

model ParcelReturn {
  parcelId     String   @id @map("parcel_id") @db.Uuid
  returnNo     String   @unique @map("return_no")
  reason       ReturnReason
  details      String?
  initiatedById String  @map("initiated_by_id") @db.Uuid
  returnOtpHash String? @map("return_otp_hash")
  returnedAt   DateTime? @map("returned_at") @db.Timestamptz
  createdAt    DateTime @default(now()) @map("created_at") @db.Timestamptz
  parcel Parcel @relation(fields: [parcelId], references: [id], onDelete: Cascade)
  @@map("parcel_returns")
}

/* ─────────────────────────── MOD-05 ASSETS ─────────────────────────── */

model AssetCategory {
  id                 String  @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  code               String  @unique
  name               String
  assetClass         AssetClass @map("asset_class")
  defaultLifeYears   Int     @map("default_life_years")
  defaultMethod      DepreciationMethod @default(SLM) @map("default_method")
  defaultSalvagePct  Decimal @default(8) @map("default_salvage_pct") @db.Decimal(5,2)
  calibrationCycleDays Int?  @map("calibration_cycle_days")
  regulator          String?                         // BSTI, DoE, BRTA …
  glAccount          String? @map("gl_account")
  assets Asset[]
  @@map("asset_categories")
}

model Asset {
  id                String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  tag               String   @unique                    // BOGCL-KER-GEN-101
  sapAssetNo        String?  @unique @map("sap_asset_no")
  name              String
  categoryId        String   @map("category_id") @db.Uuid
  siteId            String   @map("site_id") @db.Uuid
  location          String?
  criticality       Criticality @default(GENERAL_C)
  stage             AssetStage @default(IN_STOCK)
  oem               String?
  model             String?
  serialNo          String?  @map("serial_no")
  vendor            String?
  purchaseDate      DateTime? @map("purchase_date") @db.Date
  commissionedAt    DateTime? @map("commissioned_at") @db.Date
  purchaseCost      Decimal  @default(0) @map("purchase_cost") @db.Decimal(14,2)
  capexAdditions    Decimal  @default(0) @map("capex_additions") @db.Decimal(14,2)
  opexToDate        Decimal  @default(0) @map("opex_to_date") @db.Decimal(14,2)
  salvageValue      Decimal  @default(0) @map("salvage_value") @db.Decimal(14,2)
  usefulLifeYears   Int      @map("useful_life_years")
  depreciationMethod DepreciationMethod @default(SLM) @map("depreciation_method")
  ratedLifeHours    Int?     @map("rated_life_hours")
  runtimeHours      Int      @default(0) @map("runtime_hours")
  healthScore       Int      @default(100) @map("health_score")
  warrantyExpiresAt DateTime? @map("warranty_expires_at") @db.Date
  amcExpiresAt      DateTime? @map("amc_expires_at") @db.Date
  insuranceExpiresAt DateTime? @map("insurance_expires_at") @db.Date
  nextCalibrationAt DateTime? @map("next_calibration_at") @db.Date
  nextServiceAt     DateTime? @map("next_service_at") @db.Date
  lotoPermitNo      String?  @map("loto_permit_no")
  custodianEmployeeId String? @map("custodian_employee_id") @db.Uuid
  qrPayload         String?  @map("qr_payload")
  photoFileId       String?  @map("photo_file_id") @db.Uuid
  createdAt         DateTime @default(now()) @map("created_at") @db.Timestamptz
  updatedAt         DateTime @updatedAt @map("updated_at") @db.Timestamptz
  deletedAt         DateTime? @map("deleted_at") @db.Timestamptz
  category   AssetCategory @relation(fields: [categoryId], references: [id])
  site       Site          @relation(fields: [siteId], references: [id])
  events     AssetEvent[]
  custodies  AssetCustody[]
  spares     AssetSpare[]
  workOrders WorkOrder[]
  transfers  AssetTransfer[]
  disposal   AssetDisposal?
  snapshots  DepreciationSnapshot[]
  @@index([stage])
  @@index([siteId])
  @@index([custodianEmployeeId])
  @@index([nextCalibrationAt])
  @@map("assets")
}

model AssetEvent {
  id          String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  assetId     String   @map("asset_id") @db.Uuid
  type        AssetEventType
  actorUserId String?  @map("actor_user_id") @db.Uuid
  fromStage   AssetStage? @map("from_stage")
  toStage     AssetStage? @map("to_stage")
  note        String?
  amount      Decimal? @db.Decimal(14,2)
  refNo       String?  @map("ref_no")
  eventHash   String   @map("event_hash")
  createdAt   DateTime @default(now()) @map("created_at") @db.Timestamptz
  asset Asset @relation(fields: [assetId], references: [id], onDelete: Cascade)
  @@index([assetId, createdAt])
  @@map("asset_events")
}

model AssetCustody {
  id           String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  assetId      String   @map("asset_id") @db.Uuid
  employeeId   String   @map("employee_id") @db.Uuid
  assignedAt   DateTime @default(now()) @map("assigned_at") @db.Timestamptz
  acknowledgedAt DateTime? @map("acknowledged_at") @db.Timestamptz
  releasedAt   DateTime? @map("released_at") @db.Timestamptz
  releaseReason String? @map("release_reason")
  asset    Asset    @relation(fields: [assetId], references: [id], onDelete: Cascade)
  employee Employee @relation(fields: [employeeId], references: [id])
  @@index([employeeId, releasedAt])
  @@map("asset_custodies")
}

model AssetSpare {
  id           String  @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  assetId      String  @map("asset_id") @db.Uuid
  partNo       String  @map("part_no")
  name         String
  qtyOnHand    Int     @default(0) @map("qty_on_hand")
  reorderLevel Int     @default(1) @map("reorder_level")
  unitCost     Decimal? @map("unit_cost") @db.Decimal(14,2)
  asset Asset @relation(fields: [assetId], references: [id], onDelete: Cascade)
  @@map("asset_spares")
}

model WorkOrder {
  id            String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  woNo          String   @unique @map("wo_no")        // WO-2026-0951
  assetId       String   @map("asset_id") @db.Uuid
  type          WorkOrderType
  priority      Priority @default(NORMAL)
  status        WorkOrderStatus @default(SCHEDULED)
  title         String
  description   String?
  assigneeUserId String? @map("assignee_user_id") @db.Uuid
  lotoPermitNo  String?  @map("loto_permit_no")
  regulator     String?
  isCapex       Boolean  @default(false) @map("is_capex")
  estimatedCost Decimal? @map("estimated_cost") @db.Decimal(14,2)
  actualCost    Decimal? @map("actual_cost") @db.Decimal(14,2)
  dueAt         DateTime? @map("due_at") @db.Date
  startedAt     DateTime? @map("started_at") @db.Timestamptz
  completedAt   DateTime? @map("completed_at") @db.Timestamptz
  certificateNo String?  @map("certificate_no")
  createdAt     DateTime @default(now()) @map("created_at") @db.Timestamptz
  updatedAt     DateTime @updatedAt @map("updated_at") @db.Timestamptz
  asset Asset @relation(fields: [assetId], references: [id])
  @@index([assetId, status])
  @@index([dueAt])
  @@map("work_orders")
}

model AssetRequisition {
  id            String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  reqNo         String   @unique @map("req_no")       // ARQ-2026-022
  title         String
  categoryId    String   @map("category_id") @db.Uuid
  requesterId   String   @map("requester_id") @db.Uuid
  departmentId  String   @map("department_id") @db.Uuid
  siteId        String   @map("site_id") @db.Uuid
  estimatedCost Decimal  @map("estimated_cost") @db.Decimal(14,2)
  justification String
  urgency       Priority @default(NORMAL)
  stage         AssetReqStage @default(PENDING_HOD)
  commissionedAssetId String? @map("commissioned_asset_id") @db.Uuid
  createdAt     DateTime @default(now()) @map("created_at") @db.Timestamptz
  updatedAt     DateTime @updatedAt @map("updated_at") @db.Timestamptz
  @@map("asset_requisitions")
}

model AssetTransfer {
  id           String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  transferNo   String   @unique @map("transfer_no")
  assetId      String   @map("asset_id") @db.Uuid
  fromSiteId   String   @map("from_site_id") @db.Uuid
  toSiteId     String   @map("to_site_id") @db.Uuid
  toLocation   String?  @map("to_location")
  toEmployeeId String?  @map("to_employee_id") @db.Uuid
  gatePassNo   String?  @map("gate_pass_no")
  reason       String?
  status       TransferStatus @default(INITIATED)
  initiatedById String  @map("initiated_by_id") @db.Uuid
  completedAt  DateTime? @map("completed_at") @db.Timestamptz
  createdAt    DateTime @default(now()) @map("created_at") @db.Timestamptz
  asset Asset @relation(fields: [assetId], references: [id])
  @@map("asset_transfers")
}

model AssetDisposal {
  assetId         String   @id @map("asset_id") @db.Uuid
  reason          DisposalReason
  surveyNotes     String?  @map("survey_notes")
  initiatedById   String   @map("initiated_by_id") @db.Uuid
  initiatedAt     DateTime @default(now()) @map("initiated_at") @db.Timestamptz
  checklist       Json     @default("{}")             // {technicalSurveySigned, decontaminationCertified, sparesHarvested, financeVetted}
  method          DisposalMethod?
  buyer           String?
  proceeds        Decimal? @db.Decimal(14,2)
  nbvAtDisposal   Decimal? @map("nbv_at_disposal") @db.Decimal(14,2)
  gainLoss        Decimal? @map("gain_loss") @db.Decimal(14,2)
  voucherNo       String?  @map("voucher_no")
  finalizedAt     DateTime? @map("finalized_at") @db.Timestamptz
  asset Asset @relation(fields: [assetId], references: [id])
  @@map("asset_disposals")
}

model DepreciationSnapshot {
  id            String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  assetId       String   @map("asset_id") @db.Uuid
  fiscalYear    Int      @map("fiscal_year")
  openingNbv    Decimal  @map("opening_nbv") @db.Decimal(14,2)
  depreciation  Decimal  @db.Decimal(14,2)
  closingNbv    Decimal  @map("closing_nbv") @db.Decimal(14,2)
  method        DepreciationMethod
  computedAt    DateTime @default(now()) @map("computed_at") @db.Timestamptz
  asset Asset @relation(fields: [assetId], references: [id], onDelete: Cascade)
  @@unique([assetId, fiscalYear])
  @@map("depreciation_snapshots")
}

/* ─────────────────────────── MOD-06 COMPLIANCE ─────────────────────────── */

model RegulatoryBody {
  id      String @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  code    String @unique          // BSTI, DOEXP, DOENV, DIFE, FSCD, BIWTA, BRTA, BOILER, EMRD
  name    String
  nameBn  String? @map("name_bn")
  contact String?
  licenceTypes LicenceType[]
  @@map("regulatory_bodies")
}

model LicenceType {
  id               String  @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  code             String  @unique
  name             String
  bodyId           String  @map("body_id") @db.Uuid
  validityMonths   Int     @map("validity_months")
  leadTimeDays     Int     @default(90) @map("lead_time_days")
  checklistTemplate Json?  @map("checklist_template")
  workflowTemplateKey String? @map("workflow_template_key")
  body RegulatoryBody @relation(fields: [bodyId], references: [id])
  licences Licence[]
  @@map("licence_types")
}

model Licence {
  id             String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  typeId         String   @map("type_id") @db.Uuid
  siteId         String   @map("site_id") @db.Uuid
  licenceNo      String   @map("licence_no")
  title          String
  ownerUserId    String   @map("owner_user_id") @db.Uuid
  status         LicenceStatus @default(ACTIVE)
  issuedAt       DateTime @map("issued_at") @db.Date
  expiresAt      DateTime @map("expires_at") @db.Date
  feeAmount      Decimal? @map("fee_amount") @db.Decimal(14,2)
  shutdownRiskPerDay Decimal? @map("shutdown_risk_per_day") @db.Decimal(14,2)
  criticality    Criticality @default(ESSENTIAL_B)
  createdAt      DateTime @default(now()) @map("created_at") @db.Timestamptz
  updatedAt      DateTime @updatedAt @map("updated_at") @db.Timestamptz
  deletedAt      DateTime? @map("deleted_at") @db.Timestamptz
  type      LicenceType @relation(fields: [typeId], references: [id])
  renewals  LicenceRenewal[]
  documents LicenceDocument[]
  @@index([expiresAt, status])
  @@index([siteId])
  @@map("licences")
}

model LicenceRenewal {
  id             String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  licenceId      String   @map("licence_id") @db.Uuid
  cycleNo        Int      @map("cycle_no")
  stage          LicenceStage @default(INTERNAL_REVIEW)
  fundApprovedAt DateTime? @map("fund_approved_at") @db.Timestamptz
  appliedAt      DateTime? @map("applied_at") @db.Timestamptz
  inspectionAt   DateTime? @map("inspection_at") @db.Timestamptz
  inspectorName  String?  @map("inspector_name")
  auditFindings  String?  @map("audit_findings")
  feePaidAt      DateTime? @map("fee_paid_at") @db.Timestamptz
  chalanNo       String?  @map("chalan_no")
  renewedAt      DateTime? @map("renewed_at") @db.Timestamptz
  newExpiresAt   DateTime? @map("new_expires_at") @db.Date
  createdAt      DateTime @default(now()) @map("created_at") @db.Timestamptz
  updatedAt      DateTime @updatedAt @map("updated_at") @db.Timestamptz
  licence   Licence @relation(fields: [licenceId], references: [id], onDelete: Cascade)
  checklist LicenceChecklistItem[]
  @@unique([licenceId, cycleNo])
  @@map("licence_renewals")
}

model LicenceChecklistItem {
  id        String  @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  renewalId String  @map("renewal_id") @db.Uuid
  label     String
  status    ChecklistStatus @default(PENDING)
  note      String?
  renewal LicenceRenewal @relation(fields: [renewalId], references: [id], onDelete: Cascade)
  @@map("licence_checklist_items")
}

model LicenceDocument {
  id        String  @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  licenceId String  @map("licence_id") @db.Uuid
  fileId    String  @map("file_id") @db.Uuid
  kind      String                 // CERTIFICATE, CHALAN, APPLICATION, INSPECTION_REPORT
  createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz
  licence Licence @relation(fields: [licenceId], references: [id], onDelete: Cascade)
  @@map("licence_documents")
}

/* ─────────────────────────── MOD-07 HSE ─────────────────────────── */

model Incident {
  id            String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  incidentNo    String   @unique @map("incident_no")   // INC-2026-041
  type          IncidentType
  title         String
  description   String
  siteId        String   @map("site_id") @db.Uuid
  zone          String?
  occurredAt    DateTime @map("occurred_at") @db.Timestamptz
  reportedAt    DateTime @default(now()) @map("reported_at") @db.Timestamptz
  reporterId    String?  @map("reporter_id") @db.Uuid    // null if anonymous
  isAnonymous   Boolean  @default(false) @map("is_anonymous")
  severity      Int                                       // 1..5
  likelihood    Int                                       // 1..5
  riskScore     Int      @map("risk_score")
  riskCategory  RiskCategory @map("risk_category")
  stage         IncidentStage @default(REPORTED)
  investigatorId String? @map("investigator_id") @db.Uuid
  statutoryReportable Boolean @default(false) @map("statutory_reportable")
  statutoryBodyCode String? @map("statutory_body_code")
  statutoryDueAt DateTime? @map("statutory_due_at") @db.Timestamptz
  statutoryReceiptNo String? @map("statutory_receipt_no")
  lat           Decimal? @db.Decimal(9,6)
  lng           Decimal? @db.Decimal(9,6)
  shift         String?
  assetId       String?  @map("asset_id") @db.Uuid        // equipment-damage incidents raise a CM work order on this asset
  createdAt     DateTime @default(now()) @map("created_at") @db.Timestamptz
  updatedAt     DateTime @updatedAt @map("updated_at") @db.Timestamptz
  deletedAt     DateTime? @map("deleted_at") @db.Timestamptz
  people  IncidentPerson[]
  rca     IncidentRca?
  capas   CapaAction[]
  closure IncidentClosure?
  @@index([stage])
  @@index([siteId, occurredAt])
  @@index([riskCategory])
  @@map("incidents")
}

model IncidentPerson {
  id         String  @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  incidentId String  @map("incident_id") @db.Uuid
  employeeId String? @map("employee_id") @db.Uuid
  name       String?
  role       PersonRole
  injuryDesc String? @map("injury_desc")
  incident Incident @relation(fields: [incidentId], references: [id], onDelete: Cascade)
  @@map("incident_people")
}

model IncidentRca {
  incidentId String  @id @map("incident_id") @db.Uuid
  why1 String?
  why2 String?
  why3 String?
  why4 String?
  why5 String?
  rootCause  String? @map("root_cause")
  fishbone   Json?                                  // {Equipment, Procedure, Material, Staffing, Inspection, Environment}
  completedById String? @map("completed_by_id") @db.Uuid
  completedAt DateTime? @map("completed_at") @db.Timestamptz
  incident Incident @relation(fields: [incidentId], references: [id], onDelete: Cascade)
  @@map("incident_rcas")
}

model CapaAction {
  id          String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  capaNo      String   @unique @map("capa_no")
  incidentId  String   @map("incident_id") @db.Uuid
  type        CapaType
  description String
  ownerUserId String   @map("owner_user_id") @db.Uuid
  priority    Priority @default(NORMAL)
  dueAt       DateTime @map("due_at") @db.Date
  status      CapaStatus @default(PENDING)
  completedAt DateTime? @map("completed_at") @db.Timestamptz
  evidence    String?
  verifiedById String? @map("verified_by_id") @db.Uuid
  createdAt   DateTime @default(now()) @map("created_at") @db.Timestamptz
  updatedAt   DateTime @updatedAt @map("updated_at") @db.Timestamptz
  incident Incident @relation(fields: [incidentId], references: [id], onDelete: Cascade)
  @@index([ownerUserId, status])
  @@index([dueAt])
  @@map("capa_actions")
}

model IncidentClosure {
  incidentId       String   @id @map("incident_id") @db.Uuid
  safetyOfficerId  String   @map("safety_officer_id") @db.Uuid
  safetySignedAt   DateTime? @map("safety_signed_at") @db.Timestamptz
  managerId        String   @map("manager_id") @db.Uuid
  managerSignedAt  DateTime? @map("manager_signed_at") @db.Timestamptz
  remarks          String?
  incident Incident @relation(fields: [incidentId], references: [id], onDelete: Cascade)
  @@map("incident_closures")
}

/* ─────────────────────────── MOD-08 VISITORS ─────────────────────────── */

model Visitor {
  id           String  @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  fullName     String  @map("full_name")
  organisation String?
  phone        String?
  email        String?
  idProofType  String? @map("id_proof_type")
  idProofNoEnc String? @map("id_proof_no_enc")
  photoFileId  String? @map("photo_file_id") @db.Uuid
  category     VisitorCategory @default(REGULAR)
  isBlacklisted Boolean @default(false) @map("is_blacklisted")
  createdAt    DateTime @default(now()) @map("created_at") @db.Timestamptz
  visits Visit[]
  @@index([phone])
  @@map("visitors")
}

model Visit {
  id             String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  visitNo        String   @unique @map("visit_no")       // VIS-2026-0811
  visitorId      String   @map("visitor_id") @db.Uuid
  hostUserId     String   @map("host_user_id") @db.Uuid
  siteId         String   @map("site_id") @db.Uuid
  category       VisitorCategory
  vipTier        VipTier? @map("vip_tier")
  purpose        String
  expectedAt     DateTime @map("expected_at") @db.Timestamptz
  expectedEndAt  DateTime? @map("expected_end_at") @db.Timestamptz
  status         VisitStatus @default(PRE_REGISTERED)
  badgeNo        String?  @map("badge_no")
  vehiclePlate   String?  @map("vehicle_plate")
  parkingSlot    String?  @map("parking_slot")
  escortUserId   String?  @map("escort_user_id") @db.Uuid
  qrToken        String?  @unique @map("qr_token")
  checkedInAt    DateTime? @map("checked_in_at") @db.Timestamptz
  checkedInById  String?  @map("checked_in_by_id") @db.Uuid
  checkedOutAt   DateTime? @map("checked_out_at") @db.Timestamptz
  musterSafeAt   DateTime? @map("muster_safe_at") @db.Timestamptz
  hospitality    Json?                                   // { lounge, refreshments, prayerRoom, dietary, protocolOfficerId }
  ndaRequired    Boolean  @default(false) @map("nda_required")
  ndaSignedAt    DateTime? @map("nda_signed_at") @db.Timestamptz
  ndaFileId      String?  @map("nda_file_id") @db.Uuid
  notes          String?
  createdAt      DateTime @default(now()) @map("created_at") @db.Timestamptz
  updatedAt      DateTime @updatedAt @map("updated_at") @db.Timestamptz
  visitor  Visitor @relation(fields: [visitorId], references: [id])
  site     Site    @relation(fields: [siteId], references: [id])
  ppe      VisitPpe?
  zones    VisitZone[]
  findings VisitInspectionFinding[]
  @@index([siteId, status])
  @@index([hostUserId])
  @@index([expectedAt])
  @@map("visits")
}

model VisitPpe {
  visitId    String  @id @map("visit_id") @db.Uuid
  hardHat    Boolean @default(false) @map("hard_hat")
  goggles    Boolean @default(false)
  shoes      Boolean @default(false)
  hiVisVest  Boolean @default(false) @map("hi_vis_vest")
  h2sBriefing Boolean @default(false) @map("h2s_briefing")
  clearedById String? @map("cleared_by_id") @db.Uuid
  clearedAt  DateTime? @map("cleared_at") @db.Timestamptz
  visit Visit @relation(fields: [visitId], references: [id], onDelete: Cascade)
  @@map("visit_ppe")
}

model VisitZone {
  id       String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  visitId  String   @map("visit_id") @db.Uuid
  zone     String
  level    ZoneLevel
  escortRequired Boolean @default(false) @map("escort_required")
  visit Visit @relation(fields: [visitId], references: [id], onDelete: Cascade)
  @@map("visit_zones")
}

model VisitInspectionFinding {
  id        String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  visitId   String   @map("visit_id") @db.Uuid
  area      String
  finding   String
  status    FindingStatus
  createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz
  visit Visit @relation(fields: [visitId], references: [id], onDelete: Cascade)
  @@map("visit_inspection_findings")
}

model Watchlist {
  id        String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  fullName  String   @map("full_name")
  phone     String?
  idProofNoHmac String? @map("id_proof_no_hmac")          // HMAC-SHA256 with server key (not plain SHA-256: ID numbers are low-entropy)
  reason    String
  addedById String   @map("added_by_id") @db.Uuid
  createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz
  @@map("watchlist")
}

/* ─────────────────────────── MOD-09 FLEET ─────────────────────────── */

model Driver {
  id              String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  employeeId      String   @unique @map("employee_id") @db.Uuid
  driverCode      String   @unique @map("driver_code")   // DRV-01
  licenceNo       String   @map("licence_no")
  licenceClass    LicenceClass @map("licence_class")
  licenceExpiresAt DateTime @map("licence_expires_at") @db.Date
  status          DriverStatus @default(AVAILABLE)
  statusReason    String?  @map("status_reason")
  statusUntil     DateTime? @map("status_until") @db.Timestamptz
  dutyHoursToday  Decimal  @default(0) @map("duty_hours_today") @db.Decimal(5,2)
  rating          Decimal  @default(5) @db.Decimal(3,2)
  totalTrips      Int      @default(0) @map("total_trips")
  lastBreathalyzerAt DateTime? @map("last_breathalyzer_at") @db.Timestamptz
  lastBreathalyzerResult String? @map("last_breathalyzer_result")
  createdAt       DateTime @default(now()) @map("created_at") @db.Timestamptz
  updatedAt       DateTime @updatedAt @map("updated_at") @db.Timestamptz
  trips Trip[]
  @@map("drivers")
}

model Vehicle {
  id             String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  plateNo        String   @unique @map("plate_no")      // DHAKA METRO GHA-13-8821
  type           VehicleType
  make           String
  model          String
  year           Int?
  capacity       Int
  siteId         String   @map("site_id") @db.Uuid
  status         VehicleStatus @default(AVAILABLE)
  odometerKm     Int      @default(0) @map("odometer_km")
  fuelType       String?  @map("fuel_type")
  tankLiters     Int?     @map("tank_liters")
  isHazmat       Boolean  @default(false) @map("is_hazmat")
  gpsDeviceId    String?  @map("gps_device_id")
  nextServiceKm  Int?     @map("next_service_km")
  assetId        String?  @unique @map("asset_id") @db.Uuid   // link to MOD-05
  createdAt      DateTime @default(now()) @map("created_at") @db.Timestamptz
  updatedAt      DateTime @updatedAt @map("updated_at") @db.Timestamptz
  deletedAt      DateTime? @map("deleted_at") @db.Timestamptz
  documents VehicleDocument[]
  trips     Trip[]
  fuel      FuelVoucher[]
  @@index([status, siteId])
  @@map("vehicles")
}

model VehicleDocument {
  id        String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  vehicleId String   @map("vehicle_id") @db.Uuid
  kind      String                                  // FITNESS, TAX_TOKEN, ROUTE_PERMIT, INSURANCE, HAZMAT_PERMIT
  docNo     String?  @map("doc_no")
  expiresAt DateTime @map("expires_at") @db.Date
  fileId    String?  @map("file_id") @db.Uuid
  vehicle Vehicle @relation(fields: [vehicleId], references: [id], onDelete: Cascade)
  @@index([expiresAt])
  @@map("vehicle_documents")
}

model VehicleRequisition {
  id             String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  reqNo          String   @unique @map("req_no")         // REQ-2026-441
  requesterId    String   @map("requester_id") @db.Uuid
  departmentId   String   @map("department_id") @db.Uuid
  purpose        String
  tripType       TripType @default(ROUND_TRIP) @map("trip_type")
  origin         String
  stops          Json     @default("[]")                 // [{label, lat?, lng?}]
  destination    String
  departAt       DateTime @map("depart_at") @db.Timestamptz
  returnAt       DateTime? @map("return_at") @db.Timestamptz
  passengers     Json     @default("[]")                 // [{employeeId?, name}]
  passengerCount Int      @default(1) @map("passenger_count")
  capacityClass  CapacityClass @default(SEDAN_4) @map("capacity_class")
  priority       Priority @default(NORMAL)
  estimatedKm    Decimal? @map("estimated_km") @db.Decimal(8,2)
  estimatedCost  Decimal? @map("estimated_cost") @db.Decimal(14,2)
  costCenter     String?  @map("cost_center")
  status         RequisitionStatus @default(DRAFT)
  rejectionReason String? @map("rejection_reason")
  pooledWithId   String?  @map("pooled_with_id") @db.Uuid
  createdAt      DateTime @default(now()) @map("created_at") @db.Timestamptz
  updatedAt      DateTime @updatedAt @map("updated_at") @db.Timestamptz
  deletedAt      DateTime? @map("deleted_at") @db.Timestamptz
  trip Trip?
  chat FleetChatMessage[]
  @@index([status, departAt])
  @@index([requesterId])
  @@map("vehicle_requisitions")
}

model Trip {
  id             String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  requisitionId  String   @unique @map("requisition_id") @db.Uuid
  passNo         String   @unique @map("pass_no")        // PASS-2026-9042
  vehicleId      String   @map("vehicle_id") @db.Uuid
  driverId       String   @map("driver_id") @db.Uuid
  assignedById   String   @map("assigned_by_id") @db.Uuid
  dispatchNote   String?  @map("dispatch_note")
  startKm        Int?     @map("start_km")
  endKm          Int?     @map("end_km")
  gateOutAt      DateTime? @map("gate_out_at") @db.Timestamptz
  gateInAt       DateTime? @map("gate_in_at") @db.Timestamptz
  rating         Int?
  feedback       String?
  totalCost      Decimal? @map("total_cost") @db.Decimal(14,2)
  passPdfFileId  String?  @map("pass_pdf_file_id") @db.Uuid
  createdAt      DateTime @default(now()) @map("created_at") @db.Timestamptz
  updatedAt      DateTime @updatedAt @map("updated_at") @db.Timestamptz
  requisition VehicleRequisition @relation(fields: [requisitionId], references: [id])
  vehicle     Vehicle @relation(fields: [vehicleId], references: [id])
  driver      Driver  @relation(fields: [driverId], references: [id])
  events      TripEvent[]
  tolls       TollClaim[]
  @@index([driverId])
  @@index([vehicleId])
  @@map("trips")
}

model TripEvent {
  id        String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  tripId    String   @map("trip_id") @db.Uuid
  type      TripEventType
  actorUserId String? @map("actor_user_id") @db.Uuid
  lat       Decimal? @db.Decimal(9,6)
  lng       Decimal? @db.Decimal(9,6)
  odometerKm Int?    @map("odometer_km")
  note      String?
  createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz
  trip Trip @relation(fields: [tripId], references: [id], onDelete: Cascade)
  @@index([tripId, createdAt])
  @@map("trip_events")
}

/// High-frequency driver positions (≈ every 15 s while ON_TRIP). Written in batches by the worker,
/// partitioned monthly by recorded_at, purged after 30 days (doc 07 retention). No relation back-ref to keep writes cheap.
model TripLocation {
  id         BigInt   @id @default(autoincrement())
  tripId     String   @map("trip_id") @db.Uuid
  recordedAt DateTime @map("recorded_at") @db.Timestamptz
  lat        Decimal  @db.Decimal(9,6)
  lng        Decimal  @db.Decimal(9,6)
  accuracyM  Decimal? @map("accuracy_m") @db.Decimal(7,2)
  speedKmh   Decimal? @map("speed_kmh") @db.Decimal(6,2)
  headingDeg Int?     @map("heading_deg")
  isMock     Boolean  @default(false) @map("is_mock")
  @@index([tripId, recordedAt])
  @@map("trip_locations")
}

model FuelVoucher {
  id         String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  voucherNo  String   @unique @map("voucher_no")        // FUEL-2026-0931
  vehicleId  String   @map("vehicle_id") @db.Uuid
  tripId     String?  @map("trip_id") @db.Uuid
  station    String
  fuelType   String   @map("fuel_type")
  liters     Decimal  @db.Decimal(8,2)
  amount     Decimal? @db.Decimal(14,2)
  odometerKm Int?     @map("odometer_km")
  issuedById String   @map("issued_by_id") @db.Uuid
  qrToken    String   @unique @map("qr_token")
  redeemedAt DateTime? @map("redeemed_at") @db.Timestamptz
  createdAt  DateTime @default(now()) @map("created_at") @db.Timestamptz
  vehicle Vehicle @relation(fields: [vehicleId], references: [id])
  @@map("fuel_vouchers")
}

model TollClaim {
  id         String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  receiptNo  String   @unique @map("receipt_no")        // TOL-2026-8819
  tripId     String   @map("trip_id") @db.Uuid
  driverUserId String @map("driver_user_id") @db.Uuid
  plaza      String
  amount     Decimal  @db.Decimal(14,2)
  photoFileId String? @map("photo_file_id") @db.Uuid
  status     TollStatus @default(PENDING)
  approvedById String? @map("approved_by_id") @db.Uuid
  approvedAt DateTime? @map("approved_at") @db.Timestamptz
  paidAt     DateTime? @map("paid_at") @db.Timestamptz
  createdAt  DateTime @default(now()) @map("created_at") @db.Timestamptz
  trip Trip @relation(fields: [tripId], references: [id])
  @@map("toll_claims")
}

model FleetChatMessage {
  id            String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  requisitionId String?  @map("requisition_id") @db.Uuid   // null => desk/broadcast/sos channel
  channel       String                                       // REQ:{id} | DESK | BROADCAST | SOS
  senderUserId  String   @map("sender_user_id") @db.Uuid
  type          FleetMsgType @default(TEXT)
  body          String?
  data          Json?
  createdAt     DateTime @default(now()) @map("created_at") @db.Timestamptz
  requisition VehicleRequisition? @relation(fields: [requisitionId], references: [id], onDelete: Cascade)
  @@index([channel, createdAt])
  @@map("fleet_chat_messages")
}

/* ─────────────────────────── MOD-10 ATTENDANCE & LEAVE ─────────────────────────── */

model Shift {
  id         String  @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  code       String  @unique           // GEN, A, B, C
  name       String
  startTime  String  @map("start_time")   // "09:00"
  endTime    String  @map("end_time")
  graceMinutes Int   @default(15) @map("grace_minutes")
  isNight    Boolean @default(false) @map("is_night")
  assignments ShiftAssignment[]
  @@map("shifts")
}

model ShiftAssignment {
  id         String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  employeeId String   @map("employee_id") @db.Uuid
  shiftId    String   @map("shift_id") @db.Uuid
  startsOn   DateTime @map("starts_on") @db.Date
  endsOn     DateTime? @map("ends_on") @db.Date
  shift Shift @relation(fields: [shiftId], references: [id])
  @@index([employeeId, startsOn])
  @@map("shift_assignments")
}

model AttendancePunch {
  id           String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  employeeId   String   @map("employee_id") @db.Uuid
  type         PunchType
  punchedAt    DateTime @map("punched_at") @db.Timestamptz       // device time
  receivedAt   DateTime @default(now()) @map("received_at") @db.Timestamptz
  lat          Decimal? @db.Decimal(9,6)
  lng          Decimal? @db.Decimal(9,6)
  accuracyM    Decimal? @map("accuracy_m") @db.Decimal(7,2)
  geofenceId   String?  @map("geofence_id") @db.Uuid
  distanceM    Decimal? @map("distance_m") @db.Decimal(9,2)
  isMockLocation Boolean @default(false) @map("is_mock_location")
  deviceId     String?  @map("device_id")
  platform     Platform?
  result       PunchResult
  idempotencyKey String? @unique @map("idempotency_key")
  @@index([employeeId, punchedAt])
  @@map("attendance_punches")
}

model AttendanceDay {
  employeeId   String   @map("employee_id") @db.Uuid
  date         DateTime @db.Date
  status       DayStatus
  firstInAt    DateTime? @map("first_in_at") @db.Timestamptz
  lastOutAt    DateTime? @map("last_out_at") @db.Timestamptz
  lateMinutes  Int      @default(0) @map("late_minutes")
  workedMinutes Int     @default(0) @map("worked_minutes")
  overtimeMinutes Int   @default(0) @map("overtime_minutes")
  computedAt   DateTime @default(now()) @map("computed_at") @db.Timestamptz
  @@id([employeeId, date])
  @@index([date, status])
  @@map("attendance_days")
}

model Regularisation {
  id          String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  employeeId  String   @map("employee_id") @db.Uuid
  date        DateTime @db.Date
  type        RegularisationType
  requestedIn DateTime? @map("requested_in") @db.Timestamptz
  requestedOut DateTime? @map("requested_out") @db.Timestamptz
  reason      String
  status      LeaveStatus @default(PENDING)
  createdAt   DateTime @default(now()) @map("created_at") @db.Timestamptz
  @@index([employeeId, date])
  @@map("regularisations")
}

model LeaveType {
  id          String  @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  code        String  @unique      // CL, SL, EL, ML, LWP
  name        String
  annualQuota Int     @map("annual_quota")
  requiresDoc Boolean @default(false) @map("requires_doc")
  balances LeaveBalance[]
  requests LeaveRequest[]
  @@map("leave_types")
}

model LeaveBalance {
  employeeId  String  @map("employee_id") @db.Uuid
  leaveTypeId String  @map("leave_type_id") @db.Uuid
  year        Int
  entitled    Decimal @db.Decimal(5,1)
  used        Decimal @default(0) @db.Decimal(5,1)
  employee  Employee  @relation(fields: [employeeId], references: [id])
  leaveType LeaveType @relation(fields: [leaveTypeId], references: [id])
  @@id([employeeId, leaveTypeId, year])
  @@map("leave_balances")
}

model LeaveRequest {
  id          String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  refNo       String   @unique @map("ref_no")           // LV-2026-089
  employeeId  String   @map("employee_id") @db.Uuid
  leaveTypeId String   @map("leave_type_id") @db.Uuid
  startDate   DateTime @map("start_date") @db.Date
  endDate     DateTime @map("end_date") @db.Date
  days        Decimal  @db.Decimal(5,1)
  reason      String
  status      LeaveStatus @default(PENDING)
  isInformed  Boolean  @default(true) @map("is_informed")   // Chairman status: informed vs uninformed
  reviewedById String? @map("reviewed_by_id") @db.Uuid
  reviewedAt  DateTime? @map("reviewed_at") @db.Timestamptz
  createdAt   DateTime @default(now()) @map("created_at") @db.Timestamptz
  updatedAt   DateTime @updatedAt @map("updated_at") @db.Timestamptz
  leaveType LeaveType @relation(fields: [leaveTypeId], references: [id])
  @@index([employeeId, startDate])
  @@index([status])
  @@map("leave_requests")
}

/* ─────────────────────────── MOD-11/12/13 CLAIMS ─────────────────────────── */

model ExpensePolicy {
  id             String  @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  gradeId        String  @map("grade_id") @db.Uuid
  daDhaka        Decimal @map("da_dhaka") @db.Decimal(10,2)
  daDistrict     Decimal @map("da_district") @db.Decimal(10,2)
  daHalfDayPct   Int     @default(50) @map("da_half_day_pct")
  hotelCapPerNight Decimal? @map("hotel_cap_per_night") @db.Decimal(10,2)
  conveyanceMonthlyCap Decimal @map("conveyance_monthly_cap") @db.Decimal(10,2)
  mileageRatePerKm Decimal @map("mileage_rate_per_km") @db.Decimal(6,2)
  allowedTravelModes String[] @map("allowed_travel_modes")
  receiptRequiredAbove Decimal @default(500) @map("receipt_required_above") @db.Decimal(10,2)
  effectiveFrom  DateTime @map("effective_from") @db.Date
  effectiveTo    DateTime? @map("effective_to") @db.Date
  grade Grade @relation(fields: [gradeId], references: [id])
  @@index([gradeId, effectiveFrom])
  @@map("expense_policies")
}

model Claim {
  id             String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  claimNo        String   @unique @map("claim_no")      // TADA-2026-0419
  type           ClaimType
  claimantId     String   @map("claimant_id") @db.Uuid
  departmentId   String   @map("department_id") @db.Uuid
  costCenter     String?  @map("cost_center")
  purpose        String
  destination    String?
  periodStart    DateTime? @map("period_start") @db.Date
  periodEnd      DateTime? @map("period_end") @db.Date
  travelMode     String?  @map("travel_mode")
  totalAmount    Decimal  @default(0) @map("total_amount") @db.Decimal(14,2)
  policyAmount   Decimal? @map("policy_amount") @db.Decimal(14,2)   // auto-computed entitlement
  advanceId      String?  @map("advance_id") @db.Uuid
  netSettlement  Decimal? @map("net_settlement") @db.Decimal(14,2)  // total - advance
  status         ClaimStatus @default(DRAFT)
  policyFlags    Json     @default("[]") @map("policy_flags")        // [{line, rule, message}]
  voucherNo      String?  @map("voucher_no")
  paidAt         DateTime? @map("paid_at") @db.Timestamptz
  createdAt      DateTime @default(now()) @map("created_at") @db.Timestamptz
  updatedAt      DateTime @updatedAt @map("updated_at") @db.Timestamptz
  deletedAt      DateTime? @map("deleted_at") @db.Timestamptz
  lines   ClaimLine[]
  advance Advance? @relation(fields: [advanceId], references: [id])
  @@index([claimantId, status])
  @@index([status])
  @@map("claims")
}

model ClaimLine {
  id          String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  claimId     String   @map("claim_id") @db.Uuid
  date        DateTime @db.Date
  category    String                                    // DA, HOTEL, TRANSPORT, FUEL, MEALS, RICKSHAW, CNG, RIDE_SHARE, MILEAGE, OTHER
  description String
  fromPlace   String?  @map("from_place")
  toPlace     String?  @map("to_place")
  distanceKm  Decimal? @map("distance_km") @db.Decimal(8,2)
  amount      Decimal  @db.Decimal(14,2)
  receiptFileId String? @map("receipt_file_id") @db.Uuid
  isDeclaration Boolean @default(false) @map("is_declaration")   // no receipt (rickshaw)
  claim Claim @relation(fields: [claimId], references: [id], onDelete: Cascade)
  @@map("claim_lines")
}

model Advance {
  id          String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  advanceNo   String   @unique @map("advance_no")
  employeeId  String   @map("employee_id") @db.Uuid
  purpose     String
  amount      Decimal  @db.Decimal(14,2)
  status      ClaimStatus @default(PENDING_MANAGER)
  disbursedAt DateTime? @map("disbursed_at") @db.Timestamptz
  settledAt   DateTime? @map("settled_at") @db.Timestamptz
  createdAt   DateTime @default(now()) @map("created_at") @db.Timestamptz
  claims Claim[]
  @@map("advances")
}

/* ─────────────────────────── MOD-14 BUS ─────────────────────────── */

model Bus {
  id         String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  plateNo    String   @unique @map("plate_no")
  make       String
  model      String
  capacity   Int
  acType     String?  @map("ac_type")
  status     VehicleStatus @default(AVAILABLE)
  fitnessExpiresAt DateTime? @map("fitness_expires_at") @db.Date
  gpsDeviceId String? @map("gps_device_id")
  driverId   String?  @map("driver_id") @db.Uuid
  conductorName String? @map("conductor_name")
  routeId    String?  @map("route_id") @db.Uuid
  createdAt  DateTime @default(now()) @map("created_at") @db.Timestamptz
  route BusRoute? @relation(fields: [routeId], references: [id])
  @@map("buses")
}

model BusRoute {
  id        String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  code      String   @unique                   // R1
  name      String
  nameBn    String?  @map("name_bn")
  siteId    String   @map("site_id") @db.Uuid  // destination site
  capacity  Int
  distanceKm Decimal? @map("distance_km") @db.Decimal(6,2)
  isActive  Boolean  @default(true) @map("is_active")
  createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz
  stops     BusStop[]
  seats     BusSeat[]
  waitlist  SeatWaitlist[]
  buses     Bus[]
  broadcasts BusBroadcast[]
  @@map("bus_routes")
}

model BusStop {
  id        String  @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  routeId   String  @map("route_id") @db.Uuid
  direction String                       // INBOUND | OUTBOUND
  seqNo     Int     @map("seq_no")
  name      String
  nameBn    String? @map("name_bn")
  lat       Decimal? @db.Decimal(9,6)
  lng       Decimal? @db.Decimal(9,6)
  scheduledTime String @map("scheduled_time")   // "07:18"
  route BusRoute @relation(fields: [routeId], references: [id], onDelete: Cascade)
  @@unique([routeId, direction, seqNo])
  @@map("bus_stops")
}

model BusSeat {
  id        String  @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  routeId   String  @map("route_id") @db.Uuid
  seatNo    Int     @map("seat_no")
  category  SeatCategory @default(REGULAR)
  status    SeatStatus @default(EMPTY)
  route BusRoute @relation(fields: [routeId], references: [id], onDelete: Cascade)
  allocations SeatAllocation[]
  @@unique([routeId, seatNo])
  @@map("bus_seats")
}

model SeatAllocation {
  id          String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  seatId      String   @map("seat_id") @db.Uuid
  employeeId  String   @map("employee_id") @db.Uuid
  bookingType BookingType @default(PERMANENT) @map("booking_type")
  pickupStopId String? @map("pickup_stop_id") @db.Uuid
  startsOn    DateTime @map("starts_on") @db.Date
  endsOn      DateTime? @map("ends_on") @db.Date
  releasedAt  DateTime? @map("released_at") @db.Timestamptz
  releaseReason String? @map("release_reason")
  allocatedById String? @map("allocated_by_id") @db.Uuid
  createdAt   DateTime @default(now()) @map("created_at") @db.Timestamptz
  seat BusSeat @relation(fields: [seatId], references: [id])
  @@index([employeeId, releasedAt])
  @@map("seat_allocations")
}

model SeatWaitlist {
  id          String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  routeId     String   @map("route_id") @db.Uuid
  employeeId  String   @map("employee_id") @db.Uuid
  appliedAt   DateTime @default(now()) @map("applied_at") @db.Timestamptz
  priority    Int      @default(0)                         // 0 normal; admin override >0 with reason
  priorityReason String? @map("priority_reason")
  status      WaitlistStatus @default(WAITING)
  createdAt   DateTime @default(now()) @map("created_at") @db.Timestamptz
  route  BusRoute @relation(fields: [routeId], references: [id], onDelete: Cascade)
  offers SeatOffer[]
  // partial unique (routeId, employeeId) WHERE status IN ('WAITING','OFFERED') — raw SQL migration, see §4
  @@index([routeId, employeeId, status])
  @@index([routeId, status, priority, appliedAt])
  @@map("seat_waitlists")
}

model SeatOffer {
  id          String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  waitlistId  String   @map("waitlist_id") @db.Uuid
  seatId      String   @map("seat_id") @db.Uuid
  offeredAt   DateTime @default(now()) @map("offered_at") @db.Timestamptz
  expiresAt   DateTime @map("expires_at") @db.Timestamptz      // offeredAt + 48h
  status      OfferStatus @default(PENDING)
  respondedAt DateTime? @map("responded_at") @db.Timestamptz
  waitlist SeatWaitlist @relation(fields: [waitlistId], references: [id], onDelete: Cascade)
  @@index([expiresAt, status])
  @@map("seat_offers")
}

model BusBroadcast {
  id        String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  routeId   String?  @map("route_id") @db.Uuid
  message   String
  messageBn String?  @map("message_bn")
  sentById  String   @map("sent_by_id") @db.Uuid
  sendSms   Boolean  @default(false) @map("send_sms")
  createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz
  route BusRoute? @relation(fields: [routeId], references: [id])
  @@map("bus_broadcasts")
}

/* ─────────────────────────── MOD-15 CHAT ─────────────────────────── */

model ChatChannel {
  id        String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  key       String?  @unique                     // executive-leadership
  name      String
  isDirect  Boolean  @default(false) @map("is_direct")
  isLocked  Boolean  @default(false) @map("is_locked")
  ownerId   String   @map("owner_id") @db.Uuid
  retentionDays Int? @map("retention_days")
  createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz
  members  ChatMember[]
  messages ChatMessage[]
  @@map("chat_channels")
}

model ChatMember {
  channelId String   @map("channel_id") @db.Uuid
  userId    String   @map("user_id") @db.Uuid
  joinedAt  DateTime @default(now()) @map("joined_at") @db.Timestamptz
  isAdmin   Boolean  @default(false) @map("is_admin")
  mutedUntil DateTime? @map("muted_until") @db.Timestamptz
  channel ChatChannel @relation(fields: [channelId], references: [id], onDelete: Cascade)
  @@id([channelId, userId])
  @@map("chat_members")
}

model ChatMessage {
  id         String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  channelId  String   @map("channel_id") @db.Uuid
  senderId   String   @map("sender_id") @db.Uuid
  type       ChatMsgType @default(TEXT)
  body       String?
  fileId     String?  @map("file_id") @db.Uuid
  voiceDurationSec Int? @map("voice_duration_sec")
  directiveId String? @map("directive_id") @db.Uuid
  isUrgent   Boolean  @default(false) @map("is_urgent")
  isPinned   Boolean  @default(false) @map("is_pinned")
  replyToId  String?  @map("reply_to_id") @db.Uuid
  reactions  Json     @default("{}")
  editedAt   DateTime? @map("edited_at") @db.Timestamptz
  deletedAt  DateTime? @map("deleted_at") @db.Timestamptz
  createdAt  DateTime @default(now()) @map("created_at") @db.Timestamptz
  channel ChatChannel @relation(fields: [channelId], references: [id], onDelete: Cascade)
  receipts ChatReadReceipt[]
  @@index([channelId, createdAt])
  @@map("chat_messages")
}

model ChatReadReceipt {
  messageId String   @map("message_id") @db.Uuid
  userId    String   @map("user_id") @db.Uuid
  readAt    DateTime @default(now()) @map("read_at") @db.Timestamptz
  message ChatMessage @relation(fields: [messageId], references: [id], onDelete: Cascade)
  @@id([messageId, userId])
  @@map("chat_read_receipts")
}

model Directive {
  id          String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  refNo       String   @unique @map("ref_no")          // BOGCL-DIR-2026-0922
  issuerId    String   @map("issuer_id") @db.Uuid
  title       String
  body        String
  priority    Priority @default(HIGH)
  dueAt       DateTime? @map("due_at") @db.Timestamptz
  acknowledgements Json @default("[]")                 // [{userId, at}]
  executedAt  DateTime? @map("executed_at") @db.Timestamptz
  createdAt   DateTime @default(now()) @map("created_at") @db.Timestamptz
  @@map("directives")
}

/* ─────────────────────────── MOD-16 EXIT CLEARANCE ─────────────────────────── */

model ExitClearance {
  id          String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  employeeId  String   @unique @map("employee_id") @db.Uuid
  initiatedById String @map("initiated_by_id") @db.Uuid
  lastWorkingDay DateTime @map("last_working_day") @db.Date
  reason      String?
  status      WorkflowStatus @default(IN_REVIEW)
  finalSettlementVoucher String? @map("final_settlement_voucher")
  completedAt DateTime? @map("completed_at") @db.Timestamptz
  createdAt   DateTime @default(now()) @map("created_at") @db.Timestamptz
  updatedAt   DateTime @updatedAt @map("updated_at") @db.Timestamptz
  employee Employee @relation(fields: [employeeId], references: [id])
  items    ExitClearanceItem[]
  @@map("exit_clearances")
}

model ExitClearanceItem {
  id          String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  clearanceId String   @map("clearance_id") @db.Uuid
  key         ClearanceItemKey
  ownerRoleKey String  @map("owner_role_key")          // IT_ADMIN, HR_ADMIN, TRANSPORT_ADMIN, FINANCE
  status      ClearanceStatus @default(PENDING)
  clearedById String?  @map("cleared_by_id") @db.Uuid
  clearedAt   DateTime? @map("cleared_at") @db.Timestamptz
  note        String?
  clearance ExitClearance @relation(fields: [clearanceId], references: [id], onDelete: Cascade)
  @@unique([clearanceId, key])
  @@map("exit_clearance_items")
}
```

> Validation: the block above passes `prisma validate` (Prisma CLI 6.19). Prisma 7 (new `prisma.config.ts`, rust-free client) is available; evaluate the upgrade during Phase 0 before the first migration is committed — the schema language is unchanged.

---

## 3. Views (read models, Prisma `views` preview)

| View | Purpose | Definition sketch |
| :--- | :--- | :--- |
| `v_approval_inbox` | One row per ACTIVE workflow step with resolved approver (or delegate) and the instance summary | `workflow_steps` ⨝ `workflow_instances` where `status='ACTIVE'` |
| `v_asset_financials` | NBV/accumulated depreciation computed live for lists | SQL implementing SLM/WDV/UOP per `06` §MOD-05 |
| `v_licence_dashboard` | days-to-expiry, urgency band, current renewal stage | `licences` ⨝ latest `licence_renewals` |
| `v_employee_directory` | user + employee + department + site + grade + roles flattened | for `/employees` list and search |
| `v_attendance_live` | today's status per employee (present/late/absent/leave/inside-fence) | `attendance_days` for current date ⨝ approved leave |
| `v_bus_route_occupancy` | capacity, occupied, vacated, waiting per route | aggregates |

---

## 4. Indexing & Performance Notes

- Every FK has an index (Prisma does not add them automatically on PostgreSQL unless declared) — the `@@index` lines above are the minimum; add composite indexes as query patterns emerge.
- Full-text: `pg_trgm` GIN indexes on `employees.full_name`, `assets.name`, `assets.tag`, `note_sheets.title`, `notices.title` for `?q=` search (`CREATE INDEX … USING gin (full_name gin_trgm_ops)` in a raw migration).
- Partitioning: `trip_locations` by month from day one (declarative range partition in a raw migration); `audit_logs` and `attendance_punches` by month (range on `created_at`/`punched_at`) once > 20 M rows; `chat_messages` by `created_at` quarterly.
- JSONB columns (`workflow_templates.definition`, `vehicle_requisitions.stops`, `claims.policy_flags`) get GIN indexes only if queried.
- Soft delete: all list queries filter `deleted_at IS NULL` via a Prisma client extension; partial unique indexes where uniqueness must ignore deleted rows (e.g. `note_sheets.file_no`).
- Partial unique indexes (raw SQL migrations, Prisma cannot express them): `seat_waitlists (route_id, employee_id) WHERE status IN ('WAITING','OFFERED')` — one live waitlist entry per employee per route; `seat_allocations (seat_id) WHERE released_at IS NULL` — one live occupant per seat; `asset_custodies (asset_id) WHERE released_at IS NULL`.

## 5. Data Protection Columns

Encrypted at application layer (AES-256-GCM, key from KMS/env): `employees.nid_enc`, `visitors.id_proof_no_enc`, `users.mfa_secret_enc`. Hashed: passwords and MFA recovery codes (argon2id), refresh tokens (SHA-256), OTPs (bcrypt), watchlist ID numbers (HMAC-SHA-256 with `WATCHLIST_HMAC_KEY`). Refresh tokens rotate within a `family_id`; reuse of a rotated token revokes the family. PII retention rules in `07_SECURITY_COMPLIANCE_AND_NFR.md`.

## 6. Seed Data (`prisma/seed.ts`)

Seed from the prototype's realistic data so the first demo on the real stack matches the client-facing prototype: 3 sites, 8 departments, 10 grades, 17 roles with permissions, 7 persona users (password set via env), 12 employees, 8 vehicles, 8 drivers, 10 bus routes with stops, 6 licences + regulatory bodies, 12 assets + categories, 6 incidents, 6 visits, 6 parcels, 4 note-sheets, 4 claims, 3 notices, workflow templates for every approvable object, leave types (CL 10, SL 14, EL 20), shifts, geofences (HQ 300 m, Plant 500 m, CTG 400 m), expense policies for 5 grade bands (values from the prototype `GRADE_POLICY`).

## 7. Migration Policy

- `prisma migrate dev` locally; migrations committed under `server/prisma/migrations/`; CI runs `prisma migrate deploy` against a disposable DB and `prisma validate`.
- No destructive migrations without an expand/contract plan (add column → backfill → switch → drop in a later release).
- Raw SQL migrations for views, trigram indexes, partitions, and the `audit_logs` REVOKE UPDATE/DELETE grant.
