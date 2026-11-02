import type { PersonRef } from "@/types/domain/common";
import type { RoleKey } from "@/types/domain/identity";
import type { MockDb, MockEmployee, MockUser } from "../db/schema";

export function employeeById(db: MockDb, id: string): MockEmployee | undefined {
  return db.employees.find((e) => e.id === id);
}

export function personRef(db: MockDb, employeeId: string): PersonRef {
  const e = employeeById(db, employeeId);
  if (!e) {
    return {
      id: employeeId, empCode: "", name: "Unknown", nameBn: "অজানা", designation: "", designationBn: "",
      department: "", departmentBn: "", initials: "?", avatarColor: "#94A3B8",
    };
  }
  return {
    id: e.id,
    empCode: e.empCode,
    name: e.fullName,
    nameBn: e.fullNameBn,
    designation: e.designation.title,
    designationBn: e.designation.titleBn,
    department: e.department.name,
    departmentBn: e.department.nameBn,
    initials: e.initials,
    avatarColor: e.avatarColor,
  };
}

export function userForEmployee(db: MockDb, employeeId: string): MockUser | undefined {
  return db.users.find((u) => u.employeeId === employeeId && u.isActive);
}

export function usersWithRole(db: MockDb, role: RoleKey): MockUser[] {
  return db.users.filter((u) => u.isActive && u.roles.includes(role));
}

/** Employees reporting to `managerId` (TEAM scope). */
export function teamOf(db: MockDb, managerId: string): MockEmployee[] {
  return db.employees.filter((e) => e.lineManager?.id === managerId);
}
