// ignore: unused_import
import 'package:intl/intl.dart' as intl;

import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for English (`en`).
class AppL10nEn extends AppL10n {
  AppL10nEn([String locale = 'en']) : super(locale);

  @override
  String get appName => 'BOGCL OneOps';

  @override
  String get commonRetry => 'Retry';

  @override
  String get commonErrorTitle => 'Something went wrong';

  @override
  String get commonErrorMessage =>
      'We could not load this. Check your connection and try again.';

  @override
  String get commonEmptyTitle => 'Nothing here yet';

  @override
  String get commonEmptyMessage => 'New items will appear here.';

  @override
  String get commonOfflineBanner =>
      'You are offline. Changes will sync when you reconnect.';

  @override
  String get commonPendingSync => 'Pending sync';

  @override
  String get commonLoading => 'Loading';

  @override
  String get commonShowPassword => 'Show password';

  @override
  String get commonHidePassword => 'Hide password';

  @override
  String get commonFieldRequired => 'This field is required';

  @override
  String get commonCancel => 'Cancel';

  @override
  String get commonConfirm => 'Confirm';

  @override
  String get languageEnglish => 'English';

  @override
  String get languageBangla => 'বাংলা';

  @override
  String get loginTitle => 'Sign in';

  @override
  String get loginSubtitle =>
      'Use your company email, phone number or employee ID.';

  @override
  String get loginIdentifierLabel => 'Email, phone or employee ID';

  @override
  String get loginPasswordLabel => 'Password';

  @override
  String get loginSubmit => 'Sign in';

  @override
  String get loginErrorInvalid => 'The ID or password is incorrect.';

  @override
  String get loginErrorLocked =>
      'Too many attempts. Please try again in 15 minutes.';

  @override
  String get loginErrorOffline =>
      'You are offline. Connect to the internet and try again.';

  @override
  String get loginErrorGeneric => 'We could not sign you in. Please try again.';

  @override
  String get loginErrorValidation => 'Enter your ID and password.';

  @override
  String get sessionRestoreError => 'We could not restore your session.';

  @override
  String get navHome => 'Home';

  @override
  String get navMore => 'More';

  @override
  String homeGoodMorning(String name) {
    return 'Good morning, $name';
  }

  @override
  String homeGoodAfternoon(String name) {
    return 'Good afternoon, $name';
  }

  @override
  String homeGoodEvening(String name) {
    return 'Good evening, $name';
  }

  @override
  String get homeWorkspaceTitle => 'Your workspace';

  @override
  String get profileEmployeeId => 'Employee ID';

  @override
  String get profileDepartment => 'Department';

  @override
  String get profileSite => 'Site';

  @override
  String get profileGrade => 'Grade';

  @override
  String get profileRoles => 'Roles';

  @override
  String get profileEmail => 'Email';

  @override
  String get profilePhone => 'Phone';

  @override
  String get moreProfile => 'Profile';

  @override
  String get moreSettings => 'Settings';

  @override
  String get settingsLanguage => 'Language';

  @override
  String get settingsTheme => 'Appearance';

  @override
  String get themeSystem => 'System';

  @override
  String get themeLight => 'Light';

  @override
  String get themeDark => 'Dark';

  @override
  String get signOut => 'Sign out';

  @override
  String get signOutConfirmTitle => 'Sign out?';

  @override
  String get signOutConfirmMessage =>
      'You will need to sign in again to use the app.';

  @override
  String versionLabel(String version) {
    return 'Version $version';
  }

  @override
  String get enumRoleCHAIRMAN => 'Chairman';

  @override
  String get enumRolePLANT_GM => 'Plant General Manager';

  @override
  String get enumRoleHOD => 'Head of Department';

  @override
  String get enumRoleLINE_MANAGER => 'Line Manager';

  @override
  String get enumRoleHR_ADMIN => 'HR Administrator';

  @override
  String get enumRoleFINANCE => 'Finance';

  @override
  String get enumRoleTRANSPORT_ADMIN => 'Transport Administrator';

  @override
  String get enumRoleHSE_OFFICER => 'HSE Officer';

  @override
  String get enumRoleSECURITY_GATE => 'Security Gate';

  @override
  String get enumRoleMAILROOM => 'Mailroom';

  @override
  String get enumRoleDRIVER => 'Driver';

  @override
  String get enumRoleEMPLOYEE => 'Employee';

  @override
  String get demoTitle => 'Demo menu';

  @override
  String get demoSwitchPersona => 'Switch persona';

  @override
  String get demoSimulate => 'Simulation';

  @override
  String get demoOffline => 'Simulate offline';

  @override
  String get demoSlowNetwork => 'Slow network';

  @override
  String get demoFailureMode => 'Inject failures';

  @override
  String get demoFailureNone => 'None';

  @override
  String get demoFailureTimeout => 'Timeouts';

  @override
  String get demoFailureServer => 'Server errors (500)';

  @override
  String get demoFailureConflict => 'Conflicts (409)';

  @override
  String get demoData => 'Data';

  @override
  String get demoResetData => 'Reset demo data';

  @override
  String get demoResetConfirmTitle => 'Reset demo data?';

  @override
  String get demoResetConfirmMessage =>
      'All changes are erased and you are signed out.';

  @override
  String demoPersonaSwitched(String name) {
    return 'Switched to $name';
  }

  @override
  String get demoResetDone => 'Demo data was reset';

  @override
  String get lockTitle => 'App locked';

  @override
  String get lockMessage =>
      'Unlock with your fingerprint, face or screen lock to continue.';

  @override
  String get lockReason => 'Confirm it is you to open BOGCL OneOps';

  @override
  String get lockUnlock => 'Unlock';

  @override
  String get lockFailed => 'We could not verify you. Try again.';

  @override
  String get settingsBiometric => 'Biometric unlock';

  @override
  String get settingsBiometricHint =>
      'Ask for fingerprint, face or screen lock after 2 minutes in the background.';

  @override
  String get moreOutbox => 'Sync queue';

  @override
  String get outboxTitle => 'Sync queue';

  @override
  String get outboxEmptyTitle => 'Everything is synced';

  @override
  String get outboxEmptyMessage =>
      'Actions you take offline wait here until they are sent.';

  @override
  String get outboxStatusPending => 'Waiting to sync';

  @override
  String get outboxStatusSyncing => 'Syncing';

  @override
  String get outboxStatusFailed => 'Failed';

  @override
  String get outboxRetry => 'Retry';

  @override
  String get outboxDiscard => 'Discard';

  @override
  String get outboxDiscardTitle => 'Discard this action?';

  @override
  String get outboxDiscardMessage =>
      'It will not be sent and cannot be recovered.';

  @override
  String get outboxSyncNow => 'Sync now';

  @override
  String get outboxFailedReason =>
      'The server could not accept this action. You can retry it or discard it.';

  @override
  String get outboxWillRetry =>
      'It will be sent automatically when you are back online.';

  @override
  String outboxAttempts(int count) {
    final intl.NumberFormat countNumberFormat =
        intl.NumberFormat.decimalPattern(localeName);
    final String countString = countNumberFormat.format(count);

    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$countString attempts',
      one: '1 attempt',
    );
    return '$_temp0';
  }

  @override
  String get navInbox => 'Inbox';

  @override
  String get inboxTitle => 'Inbox';

  @override
  String get inboxMarkAllRead => 'Mark all as read';

  @override
  String get inboxMarkedAllRead => 'All notifications marked as read';

  @override
  String get inboxFilterAll => 'All';

  @override
  String get inboxFilterApprovals => 'Approvals';

  @override
  String get inboxFilterSafety => 'Safety';

  @override
  String get inboxFilterTransport => 'Transport';

  @override
  String get inboxFilterUnread => 'Unread';

  @override
  String get inboxEmptyTitle => 'You\'re all caught up';

  @override
  String get inboxEmptyUnreadTitle => 'No unread notifications';

  @override
  String get inboxEmptyMessage => 'New notifications will appear here.';

  @override
  String get inboxAcknowledge => 'Acknowledge';

  @override
  String get inboxAckRequired => 'Acknowledgement required';

  @override
  String get inboxAcknowledged => 'Acknowledged';

  @override
  String get inboxAckLabel => 'Acknowledge notification';

  @override
  String get inboxReadLabel => 'Mark notification as read';

  @override
  String get inboxReadAllLabel => 'Mark all notifications as read';

  @override
  String get inboxLoadMoreFailed => 'Couldn\'t load more. Scroll to try again.';

  @override
  String get inboxPriorityCritical => 'Critical';

  @override
  String get inboxPriorityHigh => 'High priority';

  @override
  String get inboxUnreadSemantics => 'Unread';

  @override
  String get commonClose => 'Close';

  @override
  String get timeJustNow => 'Just now';

  @override
  String timeMinutesAgo(int count) {
    final intl.NumberFormat countNumberFormat =
        intl.NumberFormat.decimalPattern(localeName);
    final String countString = countNumberFormat.format(count);

    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$countString min ago',
      one: '1 min ago',
    );
    return '$_temp0';
  }

  @override
  String timeHoursAgo(int count) {
    final intl.NumberFormat countNumberFormat =
        intl.NumberFormat.decimalPattern(localeName);
    final String countString = countNumberFormat.format(count);

    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$countString hours ago',
      one: '1 hour ago',
    );
    return '$_temp0';
  }

  @override
  String timeDaysAgo(int count) {
    final intl.NumberFormat countNumberFormat =
        intl.NumberFormat.decimalPattern(localeName);
    final String countString = countNumberFormat.format(count);

    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$countString days ago',
      one: '1 day ago',
    );
    return '$_temp0';
  }

  @override
  String get moreActivity => 'My activity';

  @override
  String get activityTitle => 'My activity';

  @override
  String get activityEmptyTitle => 'No activity yet';

  @override
  String get activityEmptyMessage =>
      'Your sign-ins and changes will be listed here.';

  @override
  String get activityLoginSuccess => 'Signed in';

  @override
  String get activityLoginFailed => 'Failed sign-in attempt';

  @override
  String get activityLogout => 'Signed out';

  @override
  String get activityProfileUpdated => 'Updated profile';

  @override
  String get activityPreferencesUpdated => 'Updated preferences';

  @override
  String get activityNotificationAcked => 'Acknowledged a notification';

  @override
  String get activityOther => 'Other activity';

  @override
  String get pickerTitle => 'Add a file';

  @override
  String get pickerCamera => 'Take a photo';

  @override
  String get pickerGallery => 'Choose from gallery';

  @override
  String get pickerFiles => 'Browse files';

  @override
  String get moreChangePhoto => 'Change profile photo';

  @override
  String get photoUpdated => 'Profile photo updated';

  @override
  String get uploadNeedsConnection =>
      'Connect to the internet to upload this file.';

  @override
  String get uploadRejected =>
      'This file can\'t be used. Check its type and size.';

  @override
  String get uploadBlocked => 'This file was blocked by the virus scan.';

  @override
  String get homeQuickActions => 'Quick actions';

  @override
  String get moduleLeave => 'Leave';

  @override
  String get leaveTitle => 'Leave';

  @override
  String get leaveApply => 'Apply for leave';

  @override
  String get leaveBalancesTitle => 'My balances';

  @override
  String leaveAvailable(String days) {
    return '$days left';
  }

  @override
  String leaveBalanceDetail(String used, String total) {
    return 'Used $used of $total';
  }

  @override
  String leaveBalancePending(String days) {
    return '$days in review';
  }

  @override
  String get leaveRequestsTitle => 'My requests';

  @override
  String get leaveFilterAll => 'All';

  @override
  String get leaveStatusPending => 'Pending';

  @override
  String get leaveStatusApproved => 'Approved';

  @override
  String get leaveStatusRejected => 'Rejected';

  @override
  String get leaveStatusCancelled => 'Cancelled';

  @override
  String get leaveEmptyTitle => 'No leave requests';

  @override
  String get leaveEmptyMessage =>
      'Apply for leave and follow its approval here.';

  @override
  String leaveDaysCount(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count days',
      one: '1 day',
    );
    return '$_temp0';
  }

  @override
  String leaveDaysFraction(String value) {
    return '$value days';
  }

  @override
  String get leaveHalfDay => 'Half day';

  @override
  String get leaveHalfFirst => 'First half';

  @override
  String get leaveHalfSecond => 'Second half';

  @override
  String get leaveFormType => 'Leave type';

  @override
  String get leaveFormFrom => 'From';

  @override
  String get leaveFormTo => 'To';

  @override
  String get leaveFormHalfDay => 'Half day';

  @override
  String get leaveFormReason => 'Reason';

  @override
  String get leaveFormReasonHint => 'Why do you need leave?';

  @override
  String leaveFormCounts(String days) {
    return 'Counts as $days';
  }

  @override
  String get leaveFormAttachment => 'Supporting document';

  @override
  String get leaveFormAttachRequired => 'Required for this leave';

  @override
  String get leaveFormAttach => 'Attach document';

  @override
  String get leaveFormRemove => 'Remove';

  @override
  String get leaveFormSubmit => 'Submit request';

  @override
  String get leaveFormNoWorkingDays =>
      'The selected dates are all weekends or holidays.';

  @override
  String leaveFormReasonMin(int min) {
    return 'Enter at least $min characters';
  }

  @override
  String leaveFormBalanceShort(String days) {
    return 'Only $days available for this leave type.';
  }

  @override
  String leaveFormClLimit(int max) {
    return 'Casual leave is limited to $max consecutive days.';
  }

  @override
  String leaveFormBackdate(int days) {
    return 'Only sick or unpaid leave can start up to $days days in the past.';
  }

  @override
  String get leaveFormHrReview => 'This request also needs HR review.';

  @override
  String get leaveFormUninformed =>
      'Filed after the start date; it will be marked uninformed.';

  @override
  String get leaveSubmitted => 'Request submitted to your manager.';

  @override
  String get leaveQueued =>
      'Saved offline. It will be submitted when you are back online.';

  @override
  String get leaveErrInsufficient =>
      'You do not have enough balance for this leave.';

  @override
  String get leaveErrOverlap => 'You already have leave on these dates.';

  @override
  String get leaveErrFailed =>
      'Could not submit the request. Please try again.';

  @override
  String leaveQueueLabel(String type, String range) {
    return 'Leave: $type, $range';
  }

  @override
  String get leaveDetailTitle => 'Leave request';

  @override
  String get leaveDetailPeriod => 'Period';

  @override
  String get leaveDetailDuration => 'Duration';

  @override
  String get leaveDetailReason => 'Reason';

  @override
  String leaveDetailReviewedBy(String name) {
    return 'Reviewed by $name';
  }

  @override
  String get leaveDetailComment => 'Reviewer comment';

  @override
  String get leaveDetailRoute => 'Approval route';

  @override
  String get leaveDetailAttachment => 'Attachment';

  @override
  String get leaveCancel => 'Cancel request';

  @override
  String get leaveCancelTitle => 'Cancel this leave request?';

  @override
  String get leaveCancelPending => 'Your manager will be told you withdrew it.';

  @override
  String get leaveCancelApproved => 'The days go back to your balance.';

  @override
  String get leaveCancelKeep => 'Keep request';

  @override
  String get leaveCancelled => 'Request cancelled.';

  @override
  String get leaveCancelQueued =>
      'Saved offline. It will be cancelled when you are back online.';

  @override
  String get leaveCancelFailed =>
      'Could not cancel the request. Please try again.';

  @override
  String get workflowStepSubmitted => 'Submitted';

  @override
  String get workflowStepManager => 'Line manager';

  @override
  String get workflowStepHr => 'HR review';

  @override
  String workflowStepWaiting(String names) {
    return 'Waiting for $names';
  }

  @override
  String get workflowStepUpNext => 'Up next';

  @override
  String workflowStepApprovedBy(String name) {
    return 'Approved by $name';
  }

  @override
  String workflowStepRejectedBy(String name) {
    return 'Rejected by $name';
  }

  @override
  String get workflowStepSkipped => 'Not needed';
}
