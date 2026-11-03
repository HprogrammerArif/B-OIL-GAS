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

  @override
  String get moduleAttendance => 'Attendance';

  @override
  String get attTitle => 'Attendance';

  @override
  String attShiftLine(String name, String start, String end) {
    return '$name · $start–$end';
  }

  @override
  String get attIn => 'In';

  @override
  String get attOut => 'Out';

  @override
  String get attWorked => 'Worked';

  @override
  String attDuration(int h, String m) {
    return '${h}h ${m}m';
  }

  @override
  String get attPunchIn => 'Punch in';

  @override
  String get attPunchOut => 'Punch out';

  @override
  String get attLocating => 'Getting your location…';

  @override
  String get attRecording => 'Recording…';

  @override
  String get attPunchQueued =>
      'Saved offline. Your punch time is kept and will sync when you are online.';

  @override
  String get attPunchFailed => 'Could not record your punch. Please try again.';

  @override
  String get attOnLeaveToday => 'You are on approved leave today.';

  @override
  String attLateBy(int minutes) {
    return 'Late by $minutes min';
  }

  @override
  String get attPendingReview => 'Awaiting review';

  @override
  String get attMissingOut => 'Out missing';

  @override
  String attOvertimeMtd(String duration) {
    return 'Overtime $duration';
  }

  @override
  String get attStatusPresent => 'Present';

  @override
  String get attStatusLate => 'Late';

  @override
  String get attStatusEarlyLeave => 'Early leave';

  @override
  String get attStatusHalfDay => 'Half day';

  @override
  String get attStatusAbsent => 'Absent';

  @override
  String get attStatusOnLeave => 'On leave';

  @override
  String get attStatusHoliday => 'Holiday';

  @override
  String get attStatusWeekend => 'Weekend';

  @override
  String get attStatusFieldDuty => 'Field duty';

  @override
  String get attStatusNone => 'No record';

  @override
  String get attDaysTitle => 'Daily record';

  @override
  String get attPrevMonth => 'Previous month';

  @override
  String get attNextMonth => 'Next month';

  @override
  String get attSumPresent => 'Present';

  @override
  String get attSumLate => 'Late';

  @override
  String get attSumAbsent => 'Absent';

  @override
  String get attSumLeave => 'Leave';

  @override
  String get attEmptyTitle => 'No records yet';

  @override
  String get attEmptyMessage =>
      'Your attendance for this month will appear here.';

  @override
  String get attDayPunches => 'Punches';

  @override
  String get attNoPunches => 'No punches on this day.';

  @override
  String get attPunchAccepted => 'Accepted';

  @override
  String get attPunchPending => 'Pending approval';

  @override
  String get attPunchRejected => 'Rejected';

  @override
  String get attRegsTitle => 'My requests';

  @override
  String get attRegularise => 'Request regularisation';

  @override
  String get attClose => 'Close';

  @override
  String get attTryAgain => 'Try again';

  @override
  String get attOpenSettings => 'Open settings';

  @override
  String get attLocTitle => 'Location needed';

  @override
  String get attLocServiceOff => 'Turn on location services to punch.';

  @override
  String get attLocDenied => 'Location permission is needed to punch.';

  @override
  String get attLocDeniedForever =>
      'Location is blocked for this app. Open settings to allow it.';

  @override
  String get attLocUnavailable => 'Could not get your location. Try again.';

  @override
  String get attResultInTitle => 'Punched in';

  @override
  String get attResultOutTitle => 'Punched out';

  @override
  String get attResultDuplicate => 'Already recorded';

  @override
  String get attResultOk => 'Your punch was recorded.';

  @override
  String attResultAtSite(String site) {
    return 'Recorded at $site.';
  }

  @override
  String get attResultPendingTitle => 'Sent for approval';

  @override
  String get attResultPendingMessage =>
      'You punched away from the site. Your line manager will review it as field duty.';

  @override
  String get attResultOutsideTitle => 'You are outside the site';

  @override
  String attResultOutsideMessage(int distance, String site) {
    return 'You are $distance m from $site. Move closer, or request regularisation if you are on duty elsewhere.';
  }

  @override
  String get attResultAccuracyTitle => 'Location not accurate enough';

  @override
  String get attResultAccuracyMessage => 'Move to open sky and try again.';

  @override
  String get attResultMockTitle => 'Mock location detected';

  @override
  String get attResultMockMessage =>
      'Turn off mock locations and try again. This attempt was recorded for review.';

  @override
  String get attRegTitle => 'Attendance request';

  @override
  String get attRegType => 'Request type';

  @override
  String get attRegTypeMissed => 'Missed punch';

  @override
  String get attRegTypeField => 'Field duty';

  @override
  String get attRegTypeLate => 'Late justification';

  @override
  String get attRegTypeRemote => 'Remote work';

  @override
  String get attRegDate => 'Date';

  @override
  String attRegHintWindow(int days) {
    return 'You can file for the last $days days.';
  }

  @override
  String attRegHintField(int days) {
    return 'Field duty can be filed up to $days days ahead.';
  }

  @override
  String get attRegIn => 'In time';

  @override
  String get attRegOut => 'Out time';

  @override
  String get attRegReason => 'Reason';

  @override
  String get attRegReasonHint => 'Explain what happened';

  @override
  String attRegReasonMin(int min) {
    return 'Reason must be at least $min characters';
  }

  @override
  String get attRegSubmit => 'Submit request';

  @override
  String get attRegSubmitted => 'Request sent for approval';

  @override
  String get attRegQueued =>
      'Saved offline. It will be sent when you are back online.';

  @override
  String attRegQueueLabel(String date) {
    return 'Attendance request, $date';
  }

  @override
  String get attRegErrDuplicate => 'A request for this day is already pending.';

  @override
  String attRegErrWindow(int days) {
    return 'Choose a date within the last $days days.';
  }

  @override
  String get attRegErrTimes => 'Out time must be after in time.';

  @override
  String get attRegErrMissedTime => 'Enter the time you missed.';

  @override
  String get attRegErrFailed =>
      'Could not submit the request. Please try again.';

  @override
  String get demoLocation => 'Punch location';

  @override
  String get demoLocationDevice => 'Phone GPS';

  @override
  String get demoLocationHq => 'At Head Office';

  @override
  String get demoLocationPlant => 'At Plant';

  @override
  String get demoLocationOutside => 'Outside site';

  @override
  String get demoLocationMock => 'Mock GPS';

  @override
  String get moduleNotices => 'Notices';

  @override
  String get moduleClaims => 'Claims';

  @override
  String get moduleBus => 'Staff bus';

  @override
  String get noticesTitle => 'Notices';

  @override
  String get noticeFilterAll => 'All';

  @override
  String get noticeFilterUnread => 'Unread';

  @override
  String noticeFilterUnreadCount(int count) {
    return 'Unread ($count)';
  }

  @override
  String get noticeFilterAck => 'To acknowledge';

  @override
  String noticeFilterAckCount(int count) {
    return 'To acknowledge ($count)';
  }

  @override
  String get noticeFilterMine => 'Published by me';

  @override
  String get noticeCompose => 'New notice';

  @override
  String get noticeEmptyTitle => 'No notices';

  @override
  String get noticeEmptyMessage =>
      'New notices from your organisation will appear here.';

  @override
  String get noticeUnread => 'New';

  @override
  String get noticeNeedsAck => 'Acknowledge';

  @override
  String get noticePinned => 'Pinned';

  @override
  String get noticeDetailTitle => 'Notice';

  @override
  String get noticeNotFound => 'Notice not found';

  @override
  String get noticeNotFoundMessage =>
      'It may have expired or is not meant for you.';

  @override
  String get noticeAcked => 'Acknowledged';

  @override
  String get noticeAckFailed => 'Could not acknowledge. Try again.';

  @override
  String get noticeAckAction => 'I have read and understood';

  @override
  String noticeAckedOn(String date) {
    return 'Acknowledged on $date';
  }

  @override
  String noticeAudience(String name) {
    return 'For: $name';
  }

  @override
  String get noticeReach => 'Reach';

  @override
  String noticeReadStat(int read, int total) {
    return 'Read $read of $total';
  }

  @override
  String noticeAckStat(int ack, int total) {
    return 'Acknowledged $ack of $total';
  }

  @override
  String get noticeViewReceipts => 'Who has read this';

  @override
  String get noticeReceiptAcked => 'Acknowledged';

  @override
  String noticeReceiptRead(String date) {
    return 'Read $date';
  }

  @override
  String get noticeReceiptUnread => 'Not read';

  @override
  String get noticeCatGeneral => 'General';

  @override
  String get noticeCatPolicy => 'Policy';

  @override
  String get noticeCatSafety => 'Safety';

  @override
  String get noticeCatOperations => 'Operations';

  @override
  String get noticeCatAdmin => 'Administration';

  @override
  String get noticeCatHr => 'HR';

  @override
  String get noticeCatExecutive => 'Executive';

  @override
  String get noticePrioNormal => 'Normal';

  @override
  String get noticePrioHigh => 'High';

  @override
  String get noticePrioCritical => 'Critical';

  @override
  String get noticeFieldCategory => 'Category';

  @override
  String get noticeFieldTitle => 'Title';

  @override
  String get noticeFieldBody => 'Message';

  @override
  String get noticeFieldPriority => 'Priority';

  @override
  String get noticeFieldAudience => 'Audience';

  @override
  String get noticeFieldRequireAck => 'Require acknowledgement';

  @override
  String get noticeFieldPin => 'Pin to the top';

  @override
  String get noticeCriticalHint =>
      'Critical notices alert every recipient immediately.';

  @override
  String get noticeAudAll => 'Everyone';

  @override
  String get noticeAudDepartment => 'A department';

  @override
  String get noticeAudSite => 'A site';

  @override
  String get noticePublish => 'Publish';

  @override
  String get noticePublishConfirmTitle => 'Publish this notice?';

  @override
  String get noticePublishConfirmMessage =>
      'Recipients are notified straight away. A published notice cannot be edited.';

  @override
  String get noticePublished => 'Notice published';

  @override
  String get noticeErrMaxPinned =>
      'Five notices are already pinned. Unpin one first or publish without pinning.';

  @override
  String get noticeErrForbidden =>
      'You cannot publish to this audience or category.';

  @override
  String get noticeErrFailed =>
      'Could not publish. Check the form and try again.';

  @override
  String get claimsTitle => 'Claims';

  @override
  String get claimTabClaims => 'My claims';

  @override
  String get claimTabAdvances => 'Advances';

  @override
  String get claimTabPayable => 'To pay';

  @override
  String get claimNew => 'New claim';

  @override
  String get claimNewTitle => 'New claim';

  @override
  String get claimEditTitle => 'Edit claim';

  @override
  String get claimDetailTitle => 'Claim';

  @override
  String get claimEmptyTitle => 'No claims yet';

  @override
  String get claimEmptyMessage =>
      'Tap New claim to file travel, conveyance or event expenses.';

  @override
  String get claimTypeTada => 'Travel and DA';

  @override
  String get claimTypeConveyance => 'Conveyance';

  @override
  String get claimTypeTour => 'Tour and event';

  @override
  String get claimTypeTadaHint =>
      'Official trips: tickets, hotel, meals and daily allowance';

  @override
  String get claimTypeConveyanceHint =>
      'Local travel within a month: CNG, rickshaw, ride share';

  @override
  String get claimTypeTourHint =>
      'Tours and events, with an optional advance to adjust';

  @override
  String get claimStatusDraft => 'Draft';

  @override
  String get claimStatusPendingManager => 'With manager';

  @override
  String get claimStatusPendingFinance => 'With Finance';

  @override
  String get claimStatusApproved => 'Approved';

  @override
  String get claimStatusSettled => 'Paid';

  @override
  String get claimStatusReturned => 'Returned';

  @override
  String get claimStatusRejected => 'Rejected';

  @override
  String get claimStatusCancelled => 'Cancelled';

  @override
  String get claimCatDa => 'Daily allowance';

  @override
  String get claimCatTicket => 'Ticket';

  @override
  String get claimCatHotel => 'Hotel';

  @override
  String get claimCatMeals => 'Meals';

  @override
  String get claimCatMileage => 'Mileage';

  @override
  String get claimCatCng => 'CNG';

  @override
  String get claimCatRickshaw => 'Rickshaw';

  @override
  String get claimCatRideShare => 'Ride share';

  @override
  String get claimCatBusFare => 'Bus fare';

  @override
  String get claimCatEvent => 'Event cost';

  @override
  String get claimCatOther => 'Other';

  @override
  String get claimModeNone => 'Not specified';

  @override
  String get claimModeExecutiveCar => 'Executive car';

  @override
  String get claimModeCompanyCar => 'Company car';

  @override
  String get claimModePoolCar => 'Pool car';

  @override
  String get claimModeAir => 'Domestic flight';

  @override
  String get claimModeAcTrain => 'AC train';

  @override
  String get claimModeFirstTrain => 'First class train';

  @override
  String get claimModeTrain => 'Train';

  @override
  String get claimModeAcBus => 'AC bus';

  @override
  String get claimModeBus => 'Bus';

  @override
  String claimPolicyTitle(String band) {
    return 'Your entitlements (band $band)';
  }

  @override
  String claimPolicyConveyance(String used, String cap) {
    return 'Conveyance this month: $used of $cap';
  }

  @override
  String claimPolicyDa(String dhaka, String district) {
    return 'Daily allowance: $dhaka Dhaka, $district elsewhere';
  }

  @override
  String claimPolicyHotel(String cap) {
    return 'Hotel up to $cap per night';
  }

  @override
  String get claimFieldPurpose => 'Purpose';

  @override
  String get claimFieldEmployee => 'Employee';

  @override
  String get claimFieldPeriod => 'Period';

  @override
  String get claimFieldPeriodFrom => 'From';

  @override
  String get claimFieldPeriodTo => 'To';

  @override
  String get claimFieldDepart => 'Departure';

  @override
  String get claimFieldReturn => 'Return';

  @override
  String get claimFieldDestination => 'Destination';

  @override
  String get claimFieldMode => 'Travel mode';

  @override
  String get claimFieldAdvance => 'Advance to adjust';

  @override
  String get claimAdvanceNone => 'No advance';

  @override
  String get claimDestDhaka => 'Dhaka';

  @override
  String get claimDestOther => 'Outside Dhaka';

  @override
  String get claimDaAuto =>
      'Daily allowance is added automatically from your departure and return times.';

  @override
  String claimLines(int count) {
    return 'Expense lines ($count)';
  }

  @override
  String get claimNoLinesYet => 'No expenses added yet.';

  @override
  String get claimLineAdd => 'Add expense';

  @override
  String get claimLineEdit => 'Edit expense';

  @override
  String get claimLineSave => 'Save expense';

  @override
  String get claimLineAuto => 'Auto';

  @override
  String get claimLineDeclared => 'Declared';

  @override
  String get claimFieldCategory => 'Category';

  @override
  String get claimFieldDate => 'Date';

  @override
  String get claimFieldAmount => 'Amount (BDT)';

  @override
  String get claimFieldNights => 'Nights';

  @override
  String get claimFieldDistance => 'Distance (km)';

  @override
  String get claimFieldFrom => 'From';

  @override
  String get claimFieldTo => 'To';

  @override
  String get claimFieldDescription => 'Note';

  @override
  String claimMileageHint(String rate) {
    return 'Paid at $rate per km';
  }

  @override
  String claimKm(String km) {
    return '$km km';
  }

  @override
  String claimReceiptHint(String amount) {
    return 'A receipt is required above $amount.';
  }

  @override
  String get claimReceiptAdd => 'Add receipt photo';

  @override
  String get claimReceiptAttached => 'Receipt attached';

  @override
  String get claimDeclaration => 'No receipt, I declare this expense';

  @override
  String claimDeclarationHint(String amount) {
    return 'Allowed for small CNG, rickshaw and meal expenses up to $amount.';
  }

  @override
  String claimEnteredTotal(String amount) {
    return 'Entered: $amount';
  }

  @override
  String get claimSaveDraft => 'Save draft';

  @override
  String get claimSaved => 'Draft saved';

  @override
  String get claimErrRequired => 'Required';

  @override
  String get claimErrPurpose => 'Enter at least 3 characters';

  @override
  String get claimErrDates => 'Choose valid dates';

  @override
  String get claimErrAmount => 'Enter a valid amount';

  @override
  String get claimErrDistance => 'Enter the distance in km';

  @override
  String get claimErrNights => 'Enter 1 to 60 nights';

  @override
  String get claimErrSave =>
      'Could not save the claim. Check the details and try again.';

  @override
  String get claimErrOffline =>
      'You are offline. Connect to the internet and try again.';

  @override
  String get claimErrFailed => 'Something went wrong. Try again.';

  @override
  String get claimErrBlocked => 'Fix the blocking checks before submitting.';

  @override
  String get claimTotal => 'Total';

  @override
  String get claimAdvanceAdjusted => 'Advance adjusted';

  @override
  String get claimNetPayable => 'Payable to you';

  @override
  String get claimNetRefund => 'To return to company';

  @override
  String get claimVoucher => 'Voucher';

  @override
  String get claimReviewerComment => 'Reviewer comment';

  @override
  String get claimRoute => 'Approval route';

  @override
  String get claimSubmit => 'Submit for approval';

  @override
  String get claimSubmitConfirmTitle => 'Submit this claim?';

  @override
  String get claimSubmitConfirmMessage =>
      'It goes to your manager and then Finance. You cannot edit it while it is pending.';

  @override
  String get claimSubmitted => 'Claim submitted';

  @override
  String get claimEdit => 'Edit';

  @override
  String get claimCancel => 'Cancel claim';

  @override
  String get claimCancelConfirm => 'Cancel this claim?';

  @override
  String get claimCancelled => 'Claim cancelled';

  @override
  String get claimWithdraw => 'Withdraw claim';

  @override
  String get claimPay => 'Mark as paid';

  @override
  String claimPayConfirm(String amount) {
    return 'Pay $amount?';
  }

  @override
  String get claimPayMessage =>
      'A voucher is created and the employee is notified. This cannot be undone.';

  @override
  String get claimPaid => 'Payment recorded';

  @override
  String get claimFlagNoLines => 'Add at least one expense line.';

  @override
  String get claimFlagReceipt =>
      'A receipt or declaration is missing on a line.';

  @override
  String claimFlagHotel(String amount) {
    return 'Hotel is above the nightly limit. Eligible: $amount.';
  }

  @override
  String claimFlagConveyance(String amount) {
    return 'Monthly conveyance limit exceeded. Eligible: $amount.';
  }

  @override
  String get claimFlagOverlap => 'This period overlaps another claim.';

  @override
  String get claimFlagDuplicate => 'The same receipt is used more than once.';

  @override
  String get claimFlagLate => 'Filed after the 60 day window.';

  @override
  String get claimFlagMode =>
      'Travel mode is above your entitlement. Finance will review.';

  @override
  String get claimFlagMileage => 'Long mileage trip. Finance will review.';

  @override
  String get advNew => 'Request advance';

  @override
  String get advNewTitle => 'Tour advance';

  @override
  String get advIntro =>
      'Request cash in advance for an upcoming tour. Adjust it against your tour claim afterwards.';

  @override
  String get advFieldAmount => 'Amount (BDT)';

  @override
  String get advFieldTourStart => 'Tour starts';

  @override
  String get advFieldTourEnd => 'Tour ends';

  @override
  String get advErrAmount => 'Enter an amount up to 5,00,000';

  @override
  String get advErrOverdue =>
      'You have an earlier advance that is not yet settled. Settle it first.';

  @override
  String get advErrFailed => 'Could not request the advance. Try again.';

  @override
  String get advSubmit => 'Submit request';

  @override
  String get advSubmitted => 'Advance requested';

  @override
  String get advEmptyTitle => 'No advances';

  @override
  String get advEmptyMessage => 'Request an advance before a tour.';

  @override
  String get advStatusDisbursed => 'Disbursed';

  @override
  String get advSettleHint => 'Not yet adjusted. Link it to a tour claim.';

  @override
  String get advCancel => 'Cancel request';

  @override
  String get advCancelConfirm => 'Cancel this advance request?';

  @override
  String get advCancelled => 'Advance cancelled';

  @override
  String get advDisburse => 'Disburse';

  @override
  String advDisburseConfirm(String amount) {
    return 'Disburse $amount?';
  }

  @override
  String get advDisbursed => 'Advance disbursed';

  @override
  String get payClaims => 'Claims ready to pay';

  @override
  String get payAdvances => 'Advances to disburse';

  @override
  String get payEmptyTitle => 'Nothing to pay';

  @override
  String get payEmptyMessage => 'Approved claims and advances appear here.';

  @override
  String get busTitle => 'Staff bus';

  @override
  String get busTabMySeat => 'My seat';

  @override
  String get busTabRoutes => 'Routes';

  @override
  String get busRouteTitle => 'Route';

  @override
  String busRouteMeta(String bus, String km) {
    return 'Bus $bus · $km km';
  }

  @override
  String busFreeSeats(String free, String total) {
    return '$free of $total seats free';
  }

  @override
  String busFull(String count) {
    return 'Full · $count waiting';
  }

  @override
  String get busMySeatBadge => 'My route';

  @override
  String get busWaitingBadge => 'Waiting';

  @override
  String get busOfferedBadge => 'Seat offered';

  @override
  String get busReleasedBadge => 'Released';

  @override
  String get busEmptyTitle => 'No bus seat yet';

  @override
  String get busEmptyMessage =>
      'Pick a route and join its waitlist. You are offered a seat in turn.';

  @override
  String get busBrowse => 'Browse routes';

  @override
  String busSeatNo(String no) {
    return 'Seat $no';
  }

  @override
  String busStopLine(String stop, String morning, String evening) {
    return '$stop · morning $morning · evening $evening';
  }

  @override
  String busStopTimes(String morning, String evening) {
    return 'Morning $morning · Evening $evening';
  }

  @override
  String get busStops => 'Stops';

  @override
  String get busJoin => 'Join waitlist';

  @override
  String busJoinConfirm(String route) {
    return 'Join the waitlist for $route?';
  }

  @override
  String get busJoinMessage =>
      'You are placed in line by application time. When a seat frees up you have 48 hours to accept.';

  @override
  String get busJoined => 'Added to the waitlist';

  @override
  String get busWaitlistTitle => 'On the waitlist';

  @override
  String busPosition(String pos) {
    return 'Position $pos';
  }

  @override
  String busEstimate(String days) {
    return 'Estimated wait: about $days days';
  }

  @override
  String get busLeave => 'Leave waitlist';

  @override
  String get busLeaveConfirm => 'Leave the waitlist?';

  @override
  String get busLeft => 'Removed from the waitlist';

  @override
  String busOfferTitle(String seat) {
    return 'Seat $seat is yours to take';
  }

  @override
  String busOfferLeft(String h, String m) {
    return '${h}h ${m}m left to respond';
  }

  @override
  String get busOfferExpired => 'Offer expired';

  @override
  String get busAccept => 'Accept seat';

  @override
  String get busAccepted => 'Seat confirmed';

  @override
  String get busDecline => 'Decline';

  @override
  String get busDeclineConfirm => 'Decline this seat?';

  @override
  String get busDeclineMessage =>
      'You will be removed from this waitlist and the seat goes to the next person.';

  @override
  String get busDeclined => 'Offer declined';

  @override
  String get busChooseStop => 'Choose your stop';

  @override
  String get busConfirmSeat => 'Confirm seat';

  @override
  String get busRelease => 'Release seat for a while';

  @override
  String get busReleaseTitle => 'Release your seat';

  @override
  String get busReleaseHint =>
      'Going on leave or travelling? Free the seat for up to 60 days and take it back later.';

  @override
  String get busReleaseFrom => 'From';

  @override
  String get busReleaseTo => 'Until';

  @override
  String get busReleaseReason => 'Reason';

  @override
  String get busReleased => 'Seat released';

  @override
  String busReleasedRange(String range) {
    return 'Released $range';
  }

  @override
  String get busReclaim => 'Take seat back';

  @override
  String get busReclaimConfirm => 'Take your seat back?';

  @override
  String get busReclaimMessage =>
      'This works only if nobody else is using it right now.';

  @override
  String get busReclaimed => 'Seat is yours again';

  @override
  String get busErrFailed => 'That did not work. Try again.';

  @override
  String get busErrOfferExpired => 'This offer has expired.';

  @override
  String get busErrHasSeat => 'You already have a bus seat.';

  @override
  String get busErrAlreadyWaiting => 'You are already on a waitlist.';

  @override
  String get busSeatMap => 'Seat map';

  @override
  String get busLegendTaken => 'Taken';

  @override
  String get busLegendReleased => 'Released';

  @override
  String get busLegendOffered => 'Offered';

  @override
  String get busLegendFree => 'Free';

  @override
  String busQueue(int count) {
    return 'Waitlist ($count)';
  }

  @override
  String get busQueueEmpty => 'Nobody is waiting.';

  @override
  String busPriorityLevel(String level) {
    return 'Priority $level';
  }

  @override
  String busPriorityTitle(String name) {
    return 'Priority for $name';
  }

  @override
  String get busPriorityReason => 'Reason';

  @override
  String get busPriorityReasonHint =>
      'Explain the override (at least 10 characters). It is recorded in the audit log.';

  @override
  String get busPrioritySave => 'Save priority';

  @override
  String get busPrioritySaved => 'Priority updated';

  @override
  String get busEnd => 'End allocation';

  @override
  String busEndConfirm(String seat) {
    return 'End the allocation of seat $seat?';
  }

  @override
  String get busEndMessage =>
      'The seat is offered to the next person on the waitlist.';

  @override
  String get busEnded => 'Allocation ended';

  @override
  String get busBroadcast => 'Broadcast to this route';

  @override
  String get busBroadcastMessage => 'Message';

  @override
  String get busBroadcastSend => 'Send';

  @override
  String get busBroadcastSent => 'Message sent';

  @override
  String get moduleApprovals => 'Approvals';

  @override
  String get inboxOpen => 'Open';

  @override
  String get approvalsTitle => 'Approvals';

  @override
  String get approvalTabPending => 'Waiting for me';

  @override
  String get approvalTabHistory => 'History';

  @override
  String approvalSelected(int count) {
    return '$count selected';
  }

  @override
  String approvalVerdict(int count) {
    return '$count waiting for your decision';
  }

  @override
  String approvalVerdictOverdue(int pending, int overdue) {
    return '$pending waiting, $overdue overdue';
  }

  @override
  String get approvalCatAll => 'All';

  @override
  String get approvalCatLeave => 'Leave';

  @override
  String get approvalCatClaims => 'Claims';

  @override
  String get approvalCatProcurement => 'Procurement';

  @override
  String get approvalCatFleet => 'Fleet';

  @override
  String get approvalCatOther => 'Other';

  @override
  String get approvalEmptyTitle => 'All clear';

  @override
  String get approvalEmptyMessage =>
      'Nothing is waiting for your decision. New requests appear here.';

  @override
  String get approvalBatchHint =>
      'Press and hold a request to approve several at once. Requests that need a signature or are above 5,00,000 must be decided one by one.';

  @override
  String approvalBatchConfirm(int count) {
    return 'Approve $count requests?';
  }

  @override
  String get approvalBatchMessage =>
      'Each one is approved as it stands. This cannot be undone.';

  @override
  String approvalBatchDone(int count) {
    return '$count approved';
  }

  @override
  String approvalBatchPartial(int ok, int failed) {
    return '$ok approved, $failed could not be approved';
  }

  @override
  String approvalApproveSelected(int count) {
    return 'Approve $count';
  }

  @override
  String get approvalErrFailed => 'That did not work. Try again.';

  @override
  String get approvalErrSelf => 'You cannot decide your own request.';

  @override
  String get approvalErrLimit =>
      'This amount is above your delegated approval limit.';

  @override
  String get approvalErrClosed =>
      'This request is no longer waiting for a decision.';

  @override
  String approvalErrMinChars(int count) {
    return 'Write at least $count characters';
  }

  @override
  String approvalFrom(String name, String when) {
    return 'From $name, $when';
  }

  @override
  String get approvalUrgent => 'Urgent';

  @override
  String get approvalDelegatedToYou => 'Delegated to you';

  @override
  String get approvalSlaOk => 'On time';

  @override
  String get approvalSlaWarn => 'Half the time used';

  @override
  String get approvalSlaDanger => 'Due soon';

  @override
  String get approvalSlaOverdue => 'Overdue';

  @override
  String get approvalDecApproved => 'Approved';

  @override
  String get approvalDecRejected => 'Rejected';

  @override
  String get approvalDecReturned => 'Returned';

  @override
  String get approvalDecStarted => 'Sent by me';

  @override
  String get approvalWithdrawn => 'Withdrawn';

  @override
  String get approvalInReview => 'In review';

  @override
  String get approvalHistoryEmptyTitle => 'No history yet';

  @override
  String get approvalHistoryEmptyMessage =>
      'Decisions you make and requests you send appear here.';

  @override
  String get approvalActApprove => 'Approve';

  @override
  String get approvalActReject => 'Reject';

  @override
  String get approvalActReturn => 'Return';

  @override
  String get approvalActDelegate => 'Delegate';

  @override
  String get approvalActWithdraw => 'Withdraw';

  @override
  String get approvalActComment => 'Comment';

  @override
  String get approvalDetailTitle => 'Request';

  @override
  String get approvalApproveTitle => 'Approve this request?';

  @override
  String get approvalNoteOptional => 'Note (optional)';

  @override
  String get approvalRejectTitle => 'Reject this request?';

  @override
  String get approvalRejectMessage =>
      'The requester is told why. This closes the request.';

  @override
  String get approvalReturnTitle => 'Return for changes?';

  @override
  String get approvalReturnMessage =>
      'The requester can fix it and send it again.';

  @override
  String get approvalReasonHint => 'Reason (at least 10 characters)';

  @override
  String get approvalDoneApproved => 'Approved';

  @override
  String get approvalDoneRejected => 'Rejected';

  @override
  String get approvalDoneReturned => 'Returned to the requester';

  @override
  String approvalDoneDelegated(String name) {
    return 'Delegated to $name';
  }

  @override
  String get approvalDoneComment => 'Comment added';

  @override
  String get approvalDoneWithdrawn => 'Request withdrawn';

  @override
  String get approvalDelegateTitle => 'Delegate to a colleague';

  @override
  String get approvalDelegateMessage =>
      'They decide in your place and the record shows it was on your behalf.';

  @override
  String get approvalCommentHint => 'Write a comment';

  @override
  String get approvalSend => 'Send';

  @override
  String get approvalWithdrawConfirm => 'Withdraw this request?';

  @override
  String get approvalWithdrawMessage => 'Approvers will no longer see it.';

  @override
  String approvalNextYou(String step) {
    return 'Waiting for you at: $step';
  }

  @override
  String get approvalNextInReview => 'Still in review. Nothing for you to do.';

  @override
  String approvalNextWaiting(String names) {
    return 'Waiting for $names. Nothing for you to do.';
  }

  @override
  String approvalNextClosed(String status) {
    return 'Closed: $status';
  }

  @override
  String get approvalViewRequest => 'See the full request';

  @override
  String get approvalRoute => 'Approval route';

  @override
  String get approvalDiscussion => 'Comments';

  @override
  String get approvalNeedsSignature => 'This step needs your signature.';

  @override
  String get commonSave => 'Save';

  @override
  String get moduleNoteSheets => 'Note-sheets';

  @override
  String get nsIntro =>
      'A note-sheet is a formal file note that asks for a decision or for money to be spent. It goes to each officer in turn and each one signs.';

  @override
  String get nsTabMine => 'Mine';

  @override
  String get nsTabToSign => 'To sign';

  @override
  String get nsTabAll => 'All I can see';

  @override
  String get nsNew => 'New note-sheet';

  @override
  String get nsEmptyMine => 'You have not written any note-sheet yet.';

  @override
  String get nsEmptyToSign => 'Nothing is waiting for your signature.';

  @override
  String get nsEmptyAll => 'There are no note-sheets to show.';

  @override
  String get nsStatusDraft => 'Draft';

  @override
  String get nsStatusInReview => 'With approvers';

  @override
  String get nsStatusReturned => 'Sent back';

  @override
  String get nsStatusApproved => 'Approved';

  @override
  String get nsNextDraft =>
      'Not sent yet. Add the details and send it for approval.';

  @override
  String get nsNextSign =>
      'Your turn. Read it and sign, send it back, or reject it.';

  @override
  String nsNextWaiting(String names) {
    return 'Waiting for $names.';
  }

  @override
  String get nsNextReturned =>
      'Sent back to you. Read the reason, fix it and send it again.';

  @override
  String nsNextReturnedOther(String name) {
    return 'Sent back to $name for changes.';
  }

  @override
  String get nsNextApproved =>
      'Approved and signed by everyone. Nothing more to do.';

  @override
  String get nsNextRejected => 'Rejected. This file is closed.';

  @override
  String nsNextWithdrawn(String name) {
    return 'Withdrawn by $name. This file is closed.';
  }

  @override
  String nsFrom(String name, String dept, String date) {
    return 'From $name, $dept, $date';
  }

  @override
  String nsVerdictOne(String name) {
    return '1 quote, from $name.';
  }

  @override
  String nsVerdictCheapest(int count, String name, String saving) {
    return '$count quotes. $name is cheapest, saving $saving against the dearest.';
  }

  @override
  String nsVerdictNotLowest(
    int count,
    String name,
    String extra,
    String lowest,
  ) {
    return '$count quotes. $name is recommended but costs $extra more than $lowest, the lowest.';
  }

  @override
  String nsVerdictNoPick(int count, String name) {
    return '$count quotes. $name is the lowest. No supplier is recommended yet.';
  }

  @override
  String nsOverLowest(String amount) {
    return '$amount over the lowest';
  }

  @override
  String get nsRecommended => 'Recommended';

  @override
  String get nsQuotesTitle => 'Quotations';

  @override
  String nsQuoteMeta(int days, int months) {
    return '$days days delivery, $months months warranty';
  }

  @override
  String get nsNotesTitle => 'Notes';

  @override
  String get nsRouteTitle => 'Approval route';

  @override
  String get nsSignedBy => 'Signed by';

  @override
  String get nsSignedVerified => 'Signed and verified';

  @override
  String get nsDetails => 'Details';

  @override
  String get nsDetailsHelp =>
      'Each note and signature carries a fingerprint (SHA-256). If anyone changed an earlier note, the fingerprints would no longer match.';

  @override
  String nsVerifyCode(String code) {
    return 'Verification code $code';
  }

  @override
  String get nsKindNote => 'Note';

  @override
  String get nsKindQuery => 'Question';

  @override
  String get nsKindReturn => 'Sent back';

  @override
  String get nsUrgNormal => 'Normal';

  @override
  String get nsUrgHigh => 'High';

  @override
  String get nsUrgCritical => 'Critical';

  @override
  String get nsConfInternal => 'Internal';

  @override
  String get nsConfConfidential => 'Confidential';

  @override
  String get nsConfSecret => 'Secret';

  @override
  String get nsEditTitle => 'Edit note-sheet';

  @override
  String get nsFieldTitle => 'Title';

  @override
  String get nsFieldSubject => 'Subject';

  @override
  String get nsFieldAmount => 'Amount in taka, if money is involved';

  @override
  String get nsFieldAmountHelp => 'Leave empty if no spending is asked for.';

  @override
  String get nsFieldJustification => 'What do you need, and why?';

  @override
  String get nsFieldUrgency => 'How urgent is it?';

  @override
  String get nsFieldConfidentiality => 'Who may read it?';

  @override
  String get nsQuoteAdd => 'Add quotation';

  @override
  String get nsQuotesNeeded =>
      'Spending of 2,00,000 taka or more needs at least 3 quotations and one recommended supplier.';

  @override
  String get nsQuotesOptional => 'Quotations are optional below 2,00,000 taka.';

  @override
  String get nsQuotePickHint =>
      'Tap the circle to recommend a supplier. Tap a row to change it.';

  @override
  String get nsQuoteVendor => 'Supplier';

  @override
  String get nsQuotePrice => 'Quoted price in taka';

  @override
  String get nsQuoteDelivery => 'Delivery in days';

  @override
  String get nsQuoteWarranty => 'Warranty in months';

  @override
  String get nsRecoNote => 'Why not the lowest price?';

  @override
  String nsWhyReturned(String name) {
    return 'Why $name sent it back';
  }

  @override
  String get nsSaveDraft => 'Save draft';

  @override
  String get nsSaveChanges => 'Save changes only';

  @override
  String get nsSend => 'Send for approval';

  @override
  String get nsSendAgain => 'Send again';

  @override
  String get nsSaved => 'Saved';

  @override
  String get nsSent => 'Sent for approval';

  @override
  String get nsDeleteDraft => 'Delete draft';

  @override
  String get nsDeleteConfirm => 'Delete this draft?';

  @override
  String get nsErrTitle => 'Enter a title of at least 5 characters.';

  @override
  String get nsErrSubject => 'Enter the subject.';

  @override
  String get nsErrJustification =>
      'Explain the request in at least 10 characters.';

  @override
  String get nsErrVendor => 'Enter the supplier name.';

  @override
  String get nsErrPrice => 'Enter the quoted price.';

  @override
  String get nsErrQuotesMin => 'Add at least 3 quotations.';

  @override
  String get nsErrQuotesPick => 'Recommend exactly one supplier.';

  @override
  String get nsErrQuotesNote =>
      'Explain in at least 30 characters why the recommended supplier is not the cheapest.';

  @override
  String get nsErrFailed => 'That did not work. Please try again.';

  @override
  String get nsSignAction => 'Review and sign';

  @override
  String get nsFixAndSend => 'Fix and send again';

  @override
  String get nsEditAndSend => 'Edit and send';

  @override
  String get nsAddNote => 'Add a note or question';

  @override
  String get nsNoteAppendOnly =>
      'Notes are never edited or deleted. Everyone on this file can read them.';

  @override
  String get nsNoteText => 'Your note';

  @override
  String get nsNoteAdd => 'Add to file';

  @override
  String get nsNoteAdded => 'Added to the file';

  @override
  String get nsReturnTitle => 'Send back for changes';

  @override
  String get nsRejectTitle => 'Reject this note-sheet';

  @override
  String get nsReturnedToast => 'Sent back to the author';

  @override
  String get nsRejectedToast => 'Rejected';

  @override
  String get nsWithdrawConfirm => 'Withdraw this note-sheet?';

  @override
  String get nsWithdrawMessage =>
      'It will be closed and signatures so far will no longer count.';

  @override
  String get nsWithdrawnToast => 'Withdrawn';

  @override
  String get nsPrint => 'Print or save as PDF';

  @override
  String get nsPrintFailed => 'Could not prepare the PDF.';

  @override
  String get nsSignTitle => 'Sign this note-sheet';

  @override
  String nsSignIntro(String ref) {
    return 'You are signing $ref. Your signature is tied to exactly what you see now.';
  }

  @override
  String get nsSignTyped => 'Type name';

  @override
  String get nsSignDrawn => 'Draw';

  @override
  String get nsSignStamp => 'Stamp';

  @override
  String get nsSignTypedLabel => 'Your full name';

  @override
  String get nsSignDrawHint => 'Draw your signature here';

  @override
  String get nsSignClear => 'Clear';

  @override
  String get nsSignComment => 'Comment (optional)';

  @override
  String get nsSignOtp => 'One-time code';

  @override
  String get nsSignOtpHelp => 'Demo app: the code is 123456.';

  @override
  String get nsSignConfirm => 'Sign and approve';

  @override
  String get nsSignErrName => 'Type your full name.';

  @override
  String get nsSignErrDraw => 'Draw your signature first.';

  @override
  String get nsSignErrOtp => 'Enter the 6-digit code.';

  @override
  String get nsSignErrOtpWrong => 'The code is not correct.';

  @override
  String get nsSignErrFailed => 'Could not sign. Please try again.';

  @override
  String get nsSignedToast => 'Signed. It moves to the next officer.';

  @override
  String get nsSignedFinal => 'Signed. The note-sheet is fully approved.';
}
