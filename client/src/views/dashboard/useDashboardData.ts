/**
 * Live dashboard data — one hook that gathers every number the role
 * dashboards display from the shared stores, scoped to the signed-in user.
 *
 * Nothing in here is hard-coded "pitch" data: every count is derived from
 * the same stores the module views use, so the dashboard always agrees with
 * Approvals, Attendance, Fleet, Compliance, etc.
 */
import { useMemo } from 'react';
import { useCurrentUser, type CurrentUser } from '../../auth/session';
import { useMyApprovalQueue } from '../approvals/config';
import { useApprovalStore, type ApprovalItem, type ClaimItem } from '../../store/approvalStore';
import { useNotesheetStore, type NoteFile } from '../../store/notesheetStore';
import {
  useOperationsStore,
  type LicenseCard,
  type IncidentItem,
  type ShiftWorker,
} from '../../store/operationsStore';
import { SLA_DAY_MINUTES, slaMinutesLeft, useNow } from '../../lib/sla';
import { useFleetStore, type Driver, type VehicleRequisition } from '../../store/fleetStore';
import { useNoticeStore } from '../../store/noticeStore';
import { useEmployeeStore } from '../../store/employeeStore';
import { useAssetStore } from '../../store/assetStore';
import { useBusStore } from '../../store/busStore';
import type { Seat } from '../../components/bus/busTypes';

export const COMPLIANCE_HORIZON_DAYS = 90;
export const URGENT_SLA_MINUTES = SLA_DAY_MINUTES;

/** Annual casual-leave entitlement used for the employee balance tile. */
export const CASUAL_LEAVE_ENTITLEMENT_DAYS = 10;

export interface DashboardLiveData {
  user: CurrentUser | null;
  approvals: {
    pending: ApprovalItem[];
    decided: ApprovalItem[];
    urgent: number;
    highestValue: ApprovalItem | null;
    approvedByMeBdt: number;
  };
  notesheets: {
    awaitingMe: NoteFile[];
    total: number;
  };
  compliance: {
    dueSoon: LicenseCard[];
    critical: number;
    nearest: LicenseCard | null;
  };
  incidents: {
    open: IncidentItem[];
    highRisk: number;
  };
  fleet: {
    total: number;
    available: number;
    inTransit: number;
    inWorkshop: number;
    driversAvailable: number;
    pendingRequisitions: number;
    activeTrips: number;
    myRequisitions: VehicleRequisition[];
    me: Driver | null;
    myMission: VehicleRequisition | null;
  };
  workforce: {
    roster: ShiftWorker[];
    present: number;
    late: number;
    remote: number;
    absent: number;
    plantPresent: number;
    hqPresent: number;
    deptPresent: number;
    myRecord: ShiftWorker | null;
    pendingLeave: number;
    myCasualLeaveBalance: number;
    employeesActive: number;
    exitInProgress: number;
  };
  claims: {
    mine: ClaimItem[];
    minePending: ClaimItem[];
    minePendingBdt: number;
    deptPending: number;
    financePending: number;
  };
  notices: { total: number; unread: number };
  maintenance: { openWorkOrders: number; critical: number };
  shuttle: { mySeat: Seat | null };
}

function sumCost(items: ApprovalItem[]): number {
  return items.reduce((sum, it) => sum + (it.costTk ?? 0), 0);
}

export function useDashboardData(): DashboardLiveData {
  const user = useCurrentUser();
  const { pending, decided } = useMyApprovalQueue();
  const now = useNow();
  const { claims } = useApprovalStore();
  const { files } = useNotesheetStore();
  const { licenses, incidents, attendanceRoster, leaveRequests } = useOperationsStore();
  const { drivers, vehicles, requisitions } = useFleetStore();
  const { notices } = useNoticeStore();
  const { employees } = useEmployeeStore();
  const { workOrders } = useAssetStore();
  const { routeSeats } = useBusStore();

  return useMemo<DashboardLiveData>(() => {
    const name = user?.name ?? '';
    const empId = user?.empId ?? '';
    const dept = user?.dept ?? '';
    const role = user?.role;

    /* Approvals */
    const urgent = pending.filter((p) => slaMinutesLeft(p, now) <= URGENT_SLA_MINUTES || p.urgency === 'critical').length;
    const highestValue = pending.reduce<ApprovalItem | null>(
      (best, it) => ((it.costTk ?? 0) > (best?.costTk ?? -1) ? it : best),
      null,
    );
    const approvedByMeBdt = sumCost(
      decided.filter((d) => d.decisionStatus === 'approved' && (d.authorizedBy ?? '').startsWith(name)),
    );

    /* Note-sheets awaiting this signatory */
    const awaitingMe = files.filter((f) => {
      if (f.status === 'approved') return false;
      if (f.signatoryRoute && f.signatoryRoute.length > 0) {
        return f.signatoryRoute.some((s) => s.status === 'pending' && s.roleId === role);
      }
      return role === 'chairman' && f.status === 'pending_chairman';
    });

    /* Compliance */
    const dueSoon = [...licenses]
      .filter((l) => l.daysLeft <= COMPLIANCE_HORIZON_DAYS)
      .sort((a, b) => a.daysLeft - b.daysLeft);

    /* Incidents */
    const openIncidents = incidents.filter((i) => i.workflowStage !== 'closed');

    /* Fleet */
    const me = role === 'driver' ? drivers.find((d) => d.name === name) ?? null : null;
    const myMission = me
      ? requisitions.find(
          (r) => r.assignedDriverId === me.id && (r.status === 'in_transit' || r.status === 'assigned'),
        ) ?? null
      : null;

    /* Workforce */
    const notAbsent = attendanceRoster.filter((w) => w.locationStatus !== 'absent');
    const myRecord = attendanceRoster.find((w) => w.id === empId) ?? null;
    const myApprovedLeaveDays = leaveRequests
      .filter((l) => l.empId === empId && l.status === 'approved' && l.leaveType === 'Casual Leave')
      .reduce((sum, l) => sum + l.days, 0);
    const exitInProgress = employees.filter((e) => {
      const c = e.clearance;
      if (!c) return false;
      return !(c.itAccessRevoked && c.rfidGateBadgeSurrendered && c.vehicleFuelCardReturned && c.financeAccountsSettled);
    }).length;

    /* Claims */
    const mine = claims.filter((c) => c.claimant === name);
    const minePending = mine.filter((c) => c.status === 'pending_hod' || c.status === 'pending_finance');

    /* Shuttle */
    let mySeat: Seat | null = null;
    for (const seats of Object.values(routeSeats)) {
      const hit = seats.find((s) => s.status === 'occupied' && (s.staffId === empId || s.assignedTo === name));
      if (hit) {
        mySeat = hit;
        break;
      }
    }

    return {
      user,
      approvals: { pending, decided, urgent, highestValue, approvedByMeBdt },
      notesheets: { awaitingMe, total: files.length },
      compliance: {
        dueSoon,
        critical: dueSoon.filter((l) => l.criticality === 'critical' || l.daysLeft <= 30).length,
        nearest: dueSoon[0] ?? null,
      },
      incidents: {
        open: openIncidents,
        highRisk: openIncidents.filter((i) => i.riskCategory === 'high' || i.riskCategory === 'extreme').length,
      },
      fleet: {
        total: vehicles.length,
        available: vehicles.filter((v) => v.status === 'available').length,
        inTransit: vehicles.filter((v) => v.status === 'in_transit' || v.status === 'loading').length,
        inWorkshop: vehicles.filter((v) => v.status === 'maintenance' || v.status === 'grounded').length,
        driversAvailable: drivers.filter((d) => d.status === 'available').length,
        pendingRequisitions: requisitions.filter((r) => r.status === 'pending').length,
        activeTrips: requisitions.filter((r) => r.status === 'in_transit').length,
        myRequisitions: requisitions.filter(
          (r) => r.requesterName === name && r.status !== 'completed' && r.status !== 'rejected',
        ),
        me,
        myMission,
      },
      workforce: {
        roster: attendanceRoster,
        present: notAbsent.length,
        late: attendanceRoster.filter((w) => w.locationStatus === 'late').length,
        remote: attendanceRoster.filter((w) => w.locationStatus === 'remote_approved').length,
        absent: attendanceRoster.filter((w) => w.locationStatus === 'absent').length,
        plantPresent: notAbsent.filter((w) => w.site === 'PLANT_KERANIGANJ').length,
        hqPresent: notAbsent.filter((w) => w.site === 'HQ_BARIDHARA').length,
        deptPresent: notAbsent.filter((w) => w.dept === dept).length,
        myRecord,
        pendingLeave: leaveRequests.filter((l) => l.status === 'pending').length,
        myCasualLeaveBalance: Math.max(0, CASUAL_LEAVE_ENTITLEMENT_DAYS - myApprovedLeaveDays),
        employeesActive: employees.filter((e) => e.status !== 'offboarded').length,
        exitInProgress,
      },
      claims: {
        mine,
        minePending,
        minePendingBdt: minePending.reduce((sum, c) => sum + c.amount, 0),
        deptPending: claims.filter((c) => c.dept === dept && c.status === 'pending_hod').length,
        financePending: claims.filter((c) => c.status === 'pending_finance').length,
      },
      notices: { total: notices.length, unread: notices.filter((n) => !n.read).length },
      maintenance: {
        openWorkOrders: workOrders.filter((w) => w.status !== 'completed').length,
        critical: workOrders.filter((w) => w.status !== 'completed' && w.priority === 'critical').length,
      },
      shuttle: { mySeat },
    };
  }, [
    user, pending, decided, claims, files, licenses, incidents, attendanceRoster, leaveRequests,
    drivers, vehicles, requisitions, notices, employees, workOrders, routeSeats, now,
  ]);
}
