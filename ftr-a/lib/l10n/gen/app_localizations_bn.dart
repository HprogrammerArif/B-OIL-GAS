// ignore: unused_import
import 'package:intl/intl.dart' as intl;

import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for Bengali Bangla (`bn`).
class AppL10nBn extends AppL10n {
  AppL10nBn([String locale = 'bn']) : super(locale);

  @override
  String get appName => 'বিওজিসিএল ওয়ানঅপস';

  @override
  String get commonRetry => 'আবার চেষ্টা করুন';

  @override
  String get commonErrorTitle => 'কিছু ভুল হয়েছে';

  @override
  String get commonErrorMessage =>
      'এটি লোড করা যায়নি। আপনার সংযোগ পরীক্ষা করে আবার চেষ্টা করুন।';

  @override
  String get commonEmptyTitle => 'এখনও কিছু নেই';

  @override
  String get commonEmptyMessage => 'নতুন আইটেম এখানে দেখা যাবে।';

  @override
  String get commonOfflineBanner =>
      'আপনি অফলাইনে আছেন। সংযোগ ফিরলে পরিবর্তনগুলো সিঙ্ক হবে।';

  @override
  String get commonPendingSync => 'সিঙ্কের অপেক্ষায়';

  @override
  String get commonLoading => 'লোড হচ্ছে';

  @override
  String get commonShowPassword => 'পাসওয়ার্ড দেখান';

  @override
  String get commonHidePassword => 'পাসওয়ার্ড লুকান';

  @override
  String get commonFieldRequired => 'এই ঘরটি পূরণ করা আবশ্যক';

  @override
  String get commonCancel => 'বাতিল';

  @override
  String get commonConfirm => 'নিশ্চিত করুন';

  @override
  String get languageEnglish => 'English';

  @override
  String get languageBangla => 'বাংলা';

  @override
  String get loginTitle => 'সাইন ইন';

  @override
  String get loginSubtitle =>
      'আপনার কোম্পানির ইমেইল, ফোন নম্বর অথবা কর্মচারী আইডি ব্যবহার করুন।';

  @override
  String get loginIdentifierLabel => 'ইমেইল, ফোন অথবা কর্মচারী আইডি';

  @override
  String get loginPasswordLabel => 'পাসওয়ার্ড';

  @override
  String get loginSubmit => 'সাইন ইন করুন';

  @override
  String get loginErrorInvalid => 'আইডি অথবা পাসওয়ার্ড সঠিক নয়।';

  @override
  String get loginErrorLocked =>
      'অনেকবার ভুল চেষ্টা হয়েছে। অনুগ্রহ করে ১৫ মিনিট পর আবার চেষ্টা করুন।';

  @override
  String get loginErrorOffline =>
      'আপনি অফলাইনে আছেন। ইন্টারনেটে সংযুক্ত হয়ে আবার চেষ্টা করুন।';

  @override
  String get loginErrorGeneric =>
      'সাইন ইন করা যায়নি। অনুগ্রহ করে আবার চেষ্টা করুন।';

  @override
  String get loginErrorValidation => 'আপনার আইডি ও পাসওয়ার্ড লিখুন।';

  @override
  String get sessionRestoreError => 'আপনার সেশন পুনরুদ্ধার করা যায়নি।';

  @override
  String get navHome => 'হোম';

  @override
  String get navMore => 'আরও';

  @override
  String homeGoodMorning(String name) {
    return 'সুপ্রভাত, $name';
  }

  @override
  String homeGoodAfternoon(String name) {
    return 'শুভ অপরাহ্ন, $name';
  }

  @override
  String homeGoodEvening(String name) {
    return 'শুভ সন্ধ্যা, $name';
  }

  @override
  String get homeWorkspaceTitle => 'আপনার কর্মক্ষেত্র';

  @override
  String get profileEmployeeId => 'কর্মচারী আইডি';

  @override
  String get profileDepartment => 'বিভাগ';

  @override
  String get profileSite => 'কর্মস্থল';

  @override
  String get profileGrade => 'গ্রেড';

  @override
  String get profileRoles => 'ভূমিকা';

  @override
  String get profileEmail => 'ইমেইল';

  @override
  String get profilePhone => 'ফোন';

  @override
  String get moreProfile => 'প্রোফাইল';

  @override
  String get moreSettings => 'সেটিংস';

  @override
  String get settingsLanguage => 'ভাষা';

  @override
  String get settingsTheme => 'প্রদর্শন';

  @override
  String get themeSystem => 'সিস্টেম';

  @override
  String get themeLight => 'লাইট';

  @override
  String get themeDark => 'ডার্ক';

  @override
  String get signOut => 'সাইন আউট';

  @override
  String get signOutConfirmTitle => 'সাইন আউট করবেন?';

  @override
  String get signOutConfirmMessage =>
      'অ্যাপ ব্যবহার করতে আপনাকে আবার সাইন ইন করতে হবে।';

  @override
  String versionLabel(String version) {
    return 'সংস্করণ $version';
  }

  @override
  String get enumRoleCHAIRMAN => 'চেয়ারম্যান';

  @override
  String get enumRolePLANT_GM => 'প্ল্যান্ট জেনারেল ম্যানেজার';

  @override
  String get enumRoleHOD => 'বিভাগীয় প্রধান';

  @override
  String get enumRoleLINE_MANAGER => 'লাইন ম্যানেজার';

  @override
  String get enumRoleHR_ADMIN => 'এইচআর প্রশাসক';

  @override
  String get enumRoleFINANCE => 'অর্থ বিভাগ';

  @override
  String get enumRoleTRANSPORT_ADMIN => 'পরিবহন প্রশাসক';

  @override
  String get enumRoleHSE_OFFICER => 'এইচএসই কর্মকর্তা';

  @override
  String get enumRoleSECURITY_GATE => 'নিরাপত্তা গেট';

  @override
  String get enumRoleMAILROOM => 'মেইলরুম';

  @override
  String get enumRoleDRIVER => 'চালক';

  @override
  String get enumRoleEMPLOYEE => 'কর্মচারী';

  @override
  String get demoTitle => 'ডেমো মেনু';

  @override
  String get demoSwitchPersona => 'ব্যবহারকারী পাল্টান';

  @override
  String get demoSimulate => 'সিমুলেশন';

  @override
  String get demoOffline => 'অফলাইন সিমুলেট করুন';

  @override
  String get demoSlowNetwork => 'ধীর নেটওয়ার্ক';

  @override
  String get demoFailureMode => 'ত্রুটি ঘটান';

  @override
  String get demoFailureNone => 'কোনোটি নয়';

  @override
  String get demoFailureTimeout => 'টাইমআউট';

  @override
  String get demoFailureServer => 'সার্ভার ত্রুটি (৫০০)';

  @override
  String get demoFailureConflict => 'দ্বন্দ্ব (৪০৯)';

  @override
  String get demoData => 'ডেটা';

  @override
  String get demoResetData => 'ডেমো ডেটা রিসেট করুন';

  @override
  String get demoResetConfirmTitle => 'ডেমো ডেটা রিসেট করবেন?';

  @override
  String get demoResetConfirmMessage =>
      'সব পরিবর্তন মুছে যাবে এবং আপনি সাইন আউট হবেন।';

  @override
  String demoPersonaSwitched(String name) {
    return '$name-এ পাল্টানো হয়েছে';
  }

  @override
  String get demoResetDone => 'ডেমো ডেটা রিসেট হয়েছে';

  @override
  String get lockTitle => 'অ্যাপ লক করা আছে';

  @override
  String get lockMessage =>
      'চালিয়ে যেতে আপনার আঙুলের ছাপ, মুখ বা স্ক্রিন লক দিয়ে আনলক করুন।';

  @override
  String get lockReason => 'বিওজিসিএল ওয়ানঅপস খুলতে নিজের পরিচয় নিশ্চিত করুন';

  @override
  String get lockUnlock => 'আনলক করুন';

  @override
  String get lockFailed => 'আপনাকে যাচাই করা যায়নি। আবার চেষ্টা করুন।';

  @override
  String get settingsBiometric => 'বায়োমেট্রিক আনলক';

  @override
  String get settingsBiometricHint =>
      'ব্যাকগ্রাউন্ডে ২ মিনিট থাকার পর আঙুলের ছাপ, মুখ বা স্ক্রিন লক চাওয়া হবে।';

  @override
  String get moreOutbox => 'সিঙ্ক কিউ';

  @override
  String get outboxTitle => 'সিঙ্ক কিউ';

  @override
  String get outboxEmptyTitle => 'সবকিছু সিঙ্ক হয়েছে';

  @override
  String get outboxEmptyMessage =>
      'অফলাইনে করা কাজগুলো পাঠানো পর্যন্ত এখানে অপেক্ষা করবে।';

  @override
  String get outboxStatusPending => 'সিঙ্কের অপেক্ষায়';

  @override
  String get outboxStatusSyncing => 'সিঙ্ক হচ্ছে';

  @override
  String get outboxStatusFailed => 'ব্যর্থ';

  @override
  String get outboxRetry => 'আবার চেষ্টা করুন';

  @override
  String get outboxDiscard => 'বাতিল করুন';

  @override
  String get outboxDiscardTitle => 'এই কাজটি বাতিল করবেন?';

  @override
  String get outboxDiscardMessage =>
      'এটি পাঠানো হবে না এবং ফিরে পাওয়া যাবে না।';

  @override
  String get outboxSyncNow => 'এখনই সিঙ্ক করুন';

  @override
  String get outboxFailedReason =>
      'সার্ভার এই কাজটি গ্রহণ করতে পারেনি। আপনি আবার চেষ্টা করতে বা বাতিল করতে পারেন।';

  @override
  String get outboxWillRetry =>
      'অনলাইনে ফিরলে এটি স্বয়ংক্রিয়ভাবে পাঠানো হবে।';

  @override
  String outboxAttempts(int count) {
    final intl.NumberFormat countNumberFormat =
        intl.NumberFormat.decimalPattern(localeName);
    final String countString = countNumberFormat.format(count);

    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$countStringটি প্রচেষ্টা',
    );
    return '$_temp0';
  }

  @override
  String get navInbox => 'ইনবক্স';

  @override
  String get inboxTitle => 'ইনবক্স';

  @override
  String get inboxMarkAllRead => 'সব পঠিত হিসেবে চিহ্নিত করুন';

  @override
  String get inboxMarkedAllRead => 'সব বিজ্ঞপ্তি পঠিত হিসেবে চিহ্নিত হয়েছে';

  @override
  String get inboxFilterAll => 'সব';

  @override
  String get inboxFilterApprovals => 'অনুমোদন';

  @override
  String get inboxFilterSafety => 'নিরাপত্তা';

  @override
  String get inboxFilterTransport => 'পরিবহন';

  @override
  String get inboxFilterUnread => 'অপঠিত';

  @override
  String get inboxEmptyTitle => 'সবকিছু দেখা হয়েছে';

  @override
  String get inboxEmptyUnreadTitle => 'কোনো অপঠিত বিজ্ঞপ্তি নেই';

  @override
  String get inboxEmptyMessage => 'নতুন বিজ্ঞপ্তি এখানে দেখা যাবে।';

  @override
  String get inboxAcknowledge => 'স্বীকার করুন';

  @override
  String get inboxAckRequired => 'স্বীকৃতি প্রয়োজন';

  @override
  String get inboxAcknowledged => 'স্বীকৃত';

  @override
  String get inboxAckLabel => 'বিজ্ঞপ্তি স্বীকার';

  @override
  String get inboxReadLabel => 'বিজ্ঞপ্তি পঠিত চিহ্নিত';

  @override
  String get inboxReadAllLabel => 'সব বিজ্ঞপ্তি পঠিত চিহ্নিত';

  @override
  String get inboxLoadMoreFailed =>
      'আরও লোড করা যায়নি। আবার চেষ্টা করতে স্ক্রল করুন।';

  @override
  String get inboxPriorityCritical => 'জরুরি';

  @override
  String get inboxPriorityHigh => 'উচ্চ অগ্রাধিকার';

  @override
  String get inboxUnreadSemantics => 'অপঠিত';

  @override
  String get commonClose => 'বন্ধ করুন';

  @override
  String get timeJustNow => 'এইমাত্র';

  @override
  String timeMinutesAgo(int count) {
    final intl.NumberFormat countNumberFormat =
        intl.NumberFormat.decimalPattern(localeName);
    final String countString = countNumberFormat.format(count);

    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$countString মিনিট আগে',
      one: '১ মিনিট আগে',
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
      other: '$countString ঘণ্টা আগে',
      one: '১ ঘণ্টা আগে',
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
      other: '$countString দিন আগে',
      one: '১ দিন আগে',
    );
    return '$_temp0';
  }

  @override
  String get moreActivity => 'আমার কার্যকলাপ';

  @override
  String get activityTitle => 'আমার কার্যকলাপ';

  @override
  String get activityEmptyTitle => 'এখনও কোনো কার্যকলাপ নেই';

  @override
  String get activityEmptyMessage =>
      'আপনার সাইন-ইন ও পরিবর্তনগুলো এখানে তালিকাভুক্ত হবে।';

  @override
  String get activityLoginSuccess => 'সাইন ইন করেছেন';

  @override
  String get activityLoginFailed => 'ব্যর্থ সাইন-ইন প্রচেষ্টা';

  @override
  String get activityLogout => 'সাইন আউট করেছেন';

  @override
  String get activityProfileUpdated => 'প্রোফাইল হালনাগাদ করেছেন';

  @override
  String get activityPreferencesUpdated => 'পছন্দ হালনাগাদ করেছেন';

  @override
  String get activityNotificationAcked => 'একটি বিজ্ঞপ্তি স্বীকার করেছেন';

  @override
  String get activityOther => 'অন্যান্য কার্যকলাপ';

  @override
  String get pickerTitle => 'ফাইল যোগ করুন';

  @override
  String get pickerCamera => 'ছবি তুলুন';

  @override
  String get pickerGallery => 'গ্যালারি থেকে বেছে নিন';

  @override
  String get pickerFiles => 'ফাইল ব্রাউজ করুন';

  @override
  String get moreChangePhoto => 'প্রোফাইল ছবি পরিবর্তন করুন';

  @override
  String get photoUpdated => 'প্রোফাইল ছবি হালনাগাদ হয়েছে';

  @override
  String get uploadNeedsConnection =>
      'এই ফাইল আপলোড করতে ইন্টারনেটে সংযুক্ত হন।';

  @override
  String get uploadRejected =>
      'এই ফাইলটি ব্যবহার করা যাবে না। ধরন ও আকার দেখে নিন।';

  @override
  String get uploadBlocked => 'ভাইরাস স্ক্যানে এই ফাইলটি আটকানো হয়েছে।';

  @override
  String get homeQuickActions => 'দ্রুত কাজ';

  @override
  String get moduleLeave => 'ছুটি';

  @override
  String get leaveTitle => 'ছুটি';

  @override
  String get leaveApply => 'ছুটির আবেদন';

  @override
  String get leaveBalancesTitle => 'আমার ছুটির হিসাব';

  @override
  String leaveAvailable(String days) {
    return '$days বাকি';
  }

  @override
  String leaveBalanceDetail(String used, String total) {
    return '$total-এর মধ্যে $used ব্যবহৃত';
  }

  @override
  String leaveBalancePending(String days) {
    return '$days পর্যালোচনাধীন';
  }

  @override
  String get leaveRequestsTitle => 'আমার আবেদন';

  @override
  String get leaveFilterAll => 'সব';

  @override
  String get leaveStatusPending => 'অপেক্ষমাণ';

  @override
  String get leaveStatusApproved => 'অনুমোদিত';

  @override
  String get leaveStatusRejected => 'প্রত্যাখ্যাত';

  @override
  String get leaveStatusCancelled => 'বাতিল';

  @override
  String get leaveEmptyTitle => 'কোনো ছুটির আবেদন নেই';

  @override
  String get leaveEmptyMessage =>
      'ছুটির আবেদন করুন এবং অনুমোদনের অবস্থা এখানে দেখুন।';

  @override
  String leaveDaysCount(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count দিন',
      one: '১ দিন',
    );
    return '$_temp0';
  }

  @override
  String leaveDaysFraction(String value) {
    return '$value দিন';
  }

  @override
  String get leaveHalfDay => 'অর্ধ দিন';

  @override
  String get leaveHalfFirst => 'প্রথম ভাগ';

  @override
  String get leaveHalfSecond => 'দ্বিতীয় ভাগ';

  @override
  String get leaveFormType => 'ছুটির ধরন';

  @override
  String get leaveFormFrom => 'শুরু';

  @override
  String get leaveFormTo => 'শেষ';

  @override
  String get leaveFormHalfDay => 'অর্ধ দিন';

  @override
  String get leaveFormReason => 'কারণ';

  @override
  String get leaveFormReasonHint => 'কেন ছুটি প্রয়োজন?';

  @override
  String leaveFormCounts(String days) {
    return 'গণনা হবে $days';
  }

  @override
  String get leaveFormAttachment => 'সহায়ক নথি';

  @override
  String get leaveFormAttachRequired => 'এই ছুটির জন্য আবশ্যক';

  @override
  String get leaveFormAttach => 'নথি সংযুক্ত করুন';

  @override
  String get leaveFormRemove => 'সরান';

  @override
  String get leaveFormSubmit => 'আবেদন জমা দিন';

  @override
  String get leaveFormNoWorkingDays =>
      'নির্বাচিত তারিখগুলো সবই সাপ্তাহিক ছুটি বা সরকারি ছুটি।';

  @override
  String leaveFormReasonMin(int min) {
    return 'কমপক্ষে $minটি অক্ষর লিখুন';
  }

  @override
  String leaveFormBalanceShort(String days) {
    return 'এই ধরনের ছুটিতে মাত্র $days বাকি আছে।';
  }

  @override
  String leaveFormClLimit(int max) {
    return 'নৈমিত্তিক ছুটি টানা সর্বোচ্চ $max দিন নেওয়া যায়।';
  }

  @override
  String leaveFormBackdate(int days) {
    return 'শুধু অসুস্থতাজনিত বা বিনা বেতনের ছুটি সর্বোচ্চ $days দিন আগের তারিখ থেকে নেওয়া যায়।';
  }

  @override
  String get leaveFormHrReview => 'এই আবেদনে এইচআর পর্যালোচনাও লাগবে।';

  @override
  String get leaveFormUninformed =>
      'শুরুর তারিখের পরে আবেদন; এটি অজানা অনুপস্থিতি হিসেবে চিহ্নিত হবে।';

  @override
  String get leaveSubmitted => 'আবেদন আপনার ম্যানেজারের কাছে জমা হয়েছে।';

  @override
  String get leaveQueued => 'অফলাইনে সংরক্ষিত। অনলাইনে ফিরলে জমা হবে।';

  @override
  String get leaveErrInsufficient =>
      'এই ছুটির জন্য আপনার পর্যাপ্ত ব্যালেন্স নেই।';

  @override
  String get leaveErrOverlap => 'এই তারিখগুলোতে আপনার আগে থেকেই ছুটি আছে।';

  @override
  String get leaveErrFailed => 'আবেদন জমা দেওয়া যায়নি। আবার চেষ্টা করুন।';

  @override
  String leaveQueueLabel(String type, String range) {
    return 'ছুটি: $type, $range';
  }

  @override
  String get leaveDetailTitle => 'ছুটির আবেদন';

  @override
  String get leaveDetailPeriod => 'সময়কাল';

  @override
  String get leaveDetailDuration => 'মেয়াদ';

  @override
  String get leaveDetailReason => 'কারণ';

  @override
  String leaveDetailReviewedBy(String name) {
    return 'পর্যালোচনা করেছেন $name';
  }

  @override
  String get leaveDetailComment => 'পর্যালোচকের মন্তব্য';

  @override
  String get leaveDetailRoute => 'অনুমোদনের ধাপ';

  @override
  String get leaveDetailAttachment => 'সংযুক্তি';

  @override
  String get leaveCancel => 'আবেদন বাতিল করুন';

  @override
  String get leaveCancelTitle => 'এই ছুটির আবেদন বাতিল করবেন?';

  @override
  String get leaveCancelPending =>
      'আপনি প্রত্যাহার করেছেন তা ম্যানেজারকে জানানো হবে।';

  @override
  String get leaveCancelApproved => 'দিনগুলো আপনার ব্যালেন্সে ফিরে যাবে।';

  @override
  String get leaveCancelKeep => 'আবেদন রাখুন';

  @override
  String get leaveCancelled => 'আবেদন বাতিল হয়েছে।';

  @override
  String get leaveCancelQueued => 'অফলাইনে সংরক্ষিত। অনলাইনে ফিরলে বাতিল হবে।';

  @override
  String get leaveCancelFailed => 'আবেদন বাতিল করা যায়নি। আবার চেষ্টা করুন।';

  @override
  String get workflowStepSubmitted => 'জমা দেওয়া হয়েছে';

  @override
  String get workflowStepManager => 'লাইন ম্যানেজার';

  @override
  String get workflowStepHr => 'এইচআর পর্যালোচনা';

  @override
  String workflowStepWaiting(String names) {
    return '$names-এর অপেক্ষায়';
  }

  @override
  String get workflowStepUpNext => 'পরবর্তী ধাপ';

  @override
  String workflowStepApprovedBy(String name) {
    return '$name অনুমোদন করেছেন';
  }

  @override
  String workflowStepRejectedBy(String name) {
    return '$name প্রত্যাখ্যান করেছেন';
  }

  @override
  String get workflowStepSkipped => 'প্রয়োজন নেই';
}
