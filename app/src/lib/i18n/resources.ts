import enAttendance from "@/locales/en/attendance.json";
import enLeave from "@/locales/en/leave.json";
import enApprovals from "@/locales/en/approvals.json";
import enAuth from "@/locales/en/auth.json";
import enCommon from "@/locales/en/common.json";
import enErrors from "@/locales/en/errors.json";
import enHome from "@/locales/en/home.json";
import enNotices from "@/locales/en/notices.json";
import enNotifications from "@/locales/en/notifications.json";
import bnAttendance from "@/locales/bn/attendance.json";
import bnLeave from "@/locales/bn/leave.json";
import bnApprovals from "@/locales/bn/approvals.json";
import bnAuth from "@/locales/bn/auth.json";
import bnCommon from "@/locales/bn/common.json";
import bnErrors from "@/locales/bn/errors.json";
import bnHome from "@/locales/bn/home.json";
import bnNotices from "@/locales/bn/notices.json";
import bnNotifications from "@/locales/bn/notifications.json";

/** Namespaces mirror feature folders; add a pair of JSON files per new namespace. */
export const resources = {
  en: {
    common: enCommon, auth: enAuth, errors: enErrors, home: enHome,
    approvals: enApprovals, notifications: enNotifications, notices: enNotices, attendance: enAttendance, leave: enLeave,
  },
  bn: {
    common: bnCommon, auth: bnAuth, errors: bnErrors, home: bnHome,
    approvals: bnApprovals, notifications: bnNotifications, notices: bnNotices, attendance: bnAttendance, leave: bnLeave,
  },
} as const;

export type Namespace = keyof (typeof resources)["en"];
export const namespaces = Object.keys(resources.en) as Namespace[];
