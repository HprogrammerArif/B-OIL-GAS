/**
 * Assets — capabilities come from permissions; `getAssetRoleConfig` only
 * supplies the persona-specific heading copy.
 *
 *  - asset:view_all        → whole register + financial ledger (otherwise own custody only)
 *  - asset:manage          → register, transfer, work orders, calibration, decommission
 *  - asset:request         → raise a new/replacement equipment requisition (not Chairman/Finance)
 *  - asset:approve_disposal → write-off authority + depreciation policy
 */
import type { CurrentUser } from '../../auth/session';
import { getAssetRoleConfig, type AssetRecord, type AssetRequisition, type AssetRoleConfig } from '../../store/assetStore';

export function assetConfigFor(user: CurrentUser): AssetRoleConfig {
  const copy = getAssetRoleConfig(user.role);
  const has = (p: Parameters<typeof user.permissions.has>[0]) => user.permissions.has(p);
  const viewAll = has('asset:view_all');
  const manage = has('asset:manage');
  const approveDisposal = has('asset:approve_disposal');
  return {
    ...copy,
    scopeBadge: viewAll ? copy.scopeBadge : `${copy.scopeBadge.replace(/\s*\(.*\)$/, '')} (${user.empId})`,
    scopeBadgeBn: viewAll ? copy.scopeBadgeBn : `${copy.scopeBadgeBn.replace(/\s*\(.*\)$/, '')} (${user.empId})`,
    isSelfServiceOnly: !viewAll,
    defaultCategory: has('fleet:dispatch') ? 'vehicle' : 'all',
    canRegisterAsset: manage,
    canManageWorkOrders: manage,
    canCertifyCalibration: manage,
    canTransferCustody: manage,
    canViewFinancialLedger: viewAll,
    canEditDepreciationPolicy: approveDisposal,
    canApproveRequisition: manage || approveDisposal,
    canRequestEquipment: has('asset:request'),
    canScanTag: has('asset:request') || manage,
    canInitiateDecommission: manage,
    canAuthorizeWriteOff: approveDisposal,
  };
}

export const isMyCustody = (a: AssetRecord, user: CurrentUser) => a.custodianEmpId === user.empId;

export const isMyRequisition = (r: AssetRequisition, user: CurrentUser) =>
  r.requestedByEmpId ? r.requestedByEmpId === user.empId : r.requestedBy === user.name;
