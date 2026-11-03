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

  @override
  String get moduleAttendance => 'উপস্থিতি';

  @override
  String get attTitle => 'উপস্থিতি';

  @override
  String attShiftLine(String name, String start, String end) {
    return '$name · $start–$end';
  }

  @override
  String get attIn => 'প্রবেশ';

  @override
  String get attOut => 'প্রস্থান';

  @override
  String get attWorked => 'কর্মঘণ্টা';

  @override
  String attDuration(int h, String m) {
    return '$h ঘ $m মি';
  }

  @override
  String get attPunchIn => 'পাঞ্চ ইন';

  @override
  String get attPunchOut => 'পাঞ্চ আউট';

  @override
  String get attLocating => 'আপনার অবস্থান নেওয়া হচ্ছে…';

  @override
  String get attRecording => 'রেকর্ড হচ্ছে…';

  @override
  String get attPunchQueued =>
      'অফলাইনে সংরক্ষিত। আপনার পাঞ্চের সময় ঠিক থাকবে এবং অনলাইনে এলে সিঙ্ক হবে।';

  @override
  String get attPunchFailed => 'পাঞ্চ রেকর্ড করা যায়নি। আবার চেষ্টা করুন।';

  @override
  String get attOnLeaveToday => 'আজ আপনি অনুমোদিত ছুটিতে আছেন।';

  @override
  String attLateBy(int minutes) {
    return '$minutes মিনিট দেরি';
  }

  @override
  String get attPendingReview => 'পর্যালোচনার অপেক্ষায়';

  @override
  String get attMissingOut => 'প্রস্থান নেই';

  @override
  String attOvertimeMtd(String duration) {
    return 'ওভারটাইম $duration';
  }

  @override
  String get attStatusPresent => 'উপস্থিত';

  @override
  String get attStatusLate => 'দেরি';

  @override
  String get attStatusEarlyLeave => 'আগে প্রস্থান';

  @override
  String get attStatusHalfDay => 'অর্ধদিবস';

  @override
  String get attStatusAbsent => 'অনুপস্থিত';

  @override
  String get attStatusOnLeave => 'ছুটিতে';

  @override
  String get attStatusHoliday => 'সরকারি ছুটি';

  @override
  String get attStatusWeekend => 'সাপ্তাহিক ছুটি';

  @override
  String get attStatusFieldDuty => 'মাঠ দায়িত্ব';

  @override
  String get attStatusNone => 'রেকর্ড নেই';

  @override
  String get attDaysTitle => 'দৈনিক রেকর্ড';

  @override
  String get attPrevMonth => 'আগের মাস';

  @override
  String get attNextMonth => 'পরের মাস';

  @override
  String get attSumPresent => 'উপস্থিত';

  @override
  String get attSumLate => 'দেরি';

  @override
  String get attSumAbsent => 'অনুপস্থিত';

  @override
  String get attSumLeave => 'ছুটি';

  @override
  String get attEmptyTitle => 'এখনও কোনো রেকর্ড নেই';

  @override
  String get attEmptyMessage => 'এই মাসের উপস্থিতি এখানে দেখা যাবে।';

  @override
  String get attDayPunches => 'পাঞ্চ';

  @override
  String get attNoPunches => 'এই দিনে কোনো পাঞ্চ নেই।';

  @override
  String get attPunchAccepted => 'গৃহীত';

  @override
  String get attPunchPending => 'অনুমোদনের অপেক্ষায়';

  @override
  String get attPunchRejected => 'বাতিল';

  @override
  String get attRegsTitle => 'আমার আবেদন';

  @override
  String get attRegularise => 'নিয়মিতকরণের আবেদন';

  @override
  String get attClose => 'বন্ধ করুন';

  @override
  String get attTryAgain => 'আবার চেষ্টা করুন';

  @override
  String get attOpenSettings => 'সেটিংস খুলুন';

  @override
  String get attLocTitle => 'অবস্থান প্রয়োজন';

  @override
  String get attLocServiceOff => 'পাঞ্চ করতে লোকেশন সার্ভিস চালু করুন।';

  @override
  String get attLocDenied => 'পাঞ্চ করতে লোকেশনের অনুমতি প্রয়োজন।';

  @override
  String get attLocDeniedForever =>
      'এই অ্যাপের জন্য লোকেশন বন্ধ আছে। অনুমতি দিতে সেটিংস খুলুন।';

  @override
  String get attLocUnavailable =>
      'আপনার অবস্থান পাওয়া যায়নি। আবার চেষ্টা করুন।';

  @override
  String get attResultInTitle => 'পাঞ্চ ইন সম্পন্ন';

  @override
  String get attResultOutTitle => 'পাঞ্চ আউট সম্পন্ন';

  @override
  String get attResultDuplicate => 'ইতিমধ্যে রেকর্ড হয়েছে';

  @override
  String get attResultOk => 'আপনার পাঞ্চ রেকর্ড হয়েছে।';

  @override
  String attResultAtSite(String site) {
    return '$site-এ রেকর্ড হয়েছে।';
  }

  @override
  String get attResultPendingTitle => 'অনুমোদনের জন্য পাঠানো হয়েছে';

  @override
  String get attResultPendingMessage =>
      'আপনি সাইটের বাইরে পাঞ্চ করেছেন। আপনার লাইন ম্যানেজার এটি মাঠ দায়িত্ব হিসেবে পর্যালোচনা করবেন।';

  @override
  String get attResultOutsideTitle => 'আপনি সাইটের বাইরে';

  @override
  String attResultOutsideMessage(int distance, String site) {
    return 'আপনি $site থেকে $distance মিটার দূরে। কাছে আসুন, অথবা অন্যত্র দায়িত্বে থাকলে নিয়মিতকরণের আবেদন করুন।';
  }

  @override
  String get attResultAccuracyTitle => 'অবস্থান যথেষ্ট নির্ভুল নয়';

  @override
  String get attResultAccuracyMessage =>
      'খোলা জায়গায় গিয়ে আবার চেষ্টা করুন।';

  @override
  String get attResultMockTitle => 'নকল লোকেশন শনাক্ত হয়েছে';

  @override
  String get attResultMockMessage =>
      'নকল লোকেশন বন্ধ করে আবার চেষ্টা করুন। এই চেষ্টাটি পর্যালোচনার জন্য রেকর্ড হয়েছে।';

  @override
  String get attRegTitle => 'উপস্থিতির আবেদন';

  @override
  String get attRegType => 'আবেদনের ধরন';

  @override
  String get attRegTypeMissed => 'পাঞ্চ বাদ পড়েছে';

  @override
  String get attRegTypeField => 'মাঠ দায়িত্ব';

  @override
  String get attRegTypeLate => 'দেরির ব্যাখ্যা';

  @override
  String get attRegTypeRemote => 'দূর থেকে কাজ';

  @override
  String get attRegDate => 'তারিখ';

  @override
  String attRegHintWindow(int days) {
    return 'গত $days দিনের জন্য আবেদন করা যাবে।';
  }

  @override
  String attRegHintField(int days) {
    return 'মাঠ দায়িত্বের আবেদন $days দিন আগে পর্যন্ত করা যাবে।';
  }

  @override
  String get attRegIn => 'প্রবেশের সময়';

  @override
  String get attRegOut => 'প্রস্থানের সময়';

  @override
  String get attRegReason => 'কারণ';

  @override
  String get attRegReasonHint => 'কী ঘটেছিল তা লিখুন';

  @override
  String attRegReasonMin(int min) {
    return 'কারণ কমপক্ষে $min অক্ষরের হতে হবে';
  }

  @override
  String get attRegSubmit => 'আবেদন জমা দিন';

  @override
  String get attRegSubmitted => 'আবেদন অনুমোদনের জন্য পাঠানো হয়েছে';

  @override
  String get attRegQueued => 'অফলাইনে সংরক্ষিত। অনলাইনে এলে পাঠানো হবে।';

  @override
  String attRegQueueLabel(String date) {
    return 'উপস্থিতির আবেদন, $date';
  }

  @override
  String get attRegErrDuplicate =>
      'এই দিনের জন্য একটি আবেদন ইতিমধ্যে অপেক্ষমাণ।';

  @override
  String attRegErrWindow(int days) {
    return 'গত $days দিনের মধ্যে একটি তারিখ বেছে নিন।';
  }

  @override
  String get attRegErrTimes => 'প্রস্থানের সময় প্রবেশের পরে হতে হবে।';

  @override
  String get attRegErrMissedTime => 'যে সময়ের পাঞ্চ বাদ পড়েছে তা দিন।';

  @override
  String get attRegErrFailed => 'আবেদন জমা দেওয়া যায়নি। আবার চেষ্টা করুন।';

  @override
  String get demoLocation => 'পাঞ্চের অবস্থান';

  @override
  String get demoLocationDevice => 'ফোনের GPS';

  @override
  String get demoLocationHq => 'প্রধান কার্যালয়ে';

  @override
  String get demoLocationPlant => 'প্ল্যান্টে';

  @override
  String get demoLocationOutside => 'সাইটের বাইরে';

  @override
  String get demoLocationMock => 'নকল GPS';

  @override
  String get moduleNotices => 'নোটিশ';

  @override
  String get moduleClaims => 'বিল ও দাবি';

  @override
  String get moduleBus => 'স্টাফ বাস';

  @override
  String get noticesTitle => 'নোটিশ';

  @override
  String get noticeFilterAll => 'সব';

  @override
  String get noticeFilterUnread => 'অপঠিত';

  @override
  String noticeFilterUnreadCount(int count) {
    return 'অপঠিত ($count)';
  }

  @override
  String get noticeFilterAck => 'স্বীকারের অপেক্ষায়';

  @override
  String noticeFilterAckCount(int count) {
    return 'স্বীকারের অপেক্ষায় ($count)';
  }

  @override
  String get noticeFilterMine => 'আমার প্রকাশিত';

  @override
  String get noticeCompose => 'নতুন নোটিশ';

  @override
  String get noticeEmptyTitle => 'কোনো নোটিশ নেই';

  @override
  String get noticeEmptyMessage => 'প্রতিষ্ঠানের নতুন নোটিশ এখানে দেখা যাবে।';

  @override
  String get noticeUnread => 'নতুন';

  @override
  String get noticeNeedsAck => 'স্বীকার করুন';

  @override
  String get noticePinned => 'পিন করা';

  @override
  String get noticeDetailTitle => 'নোটিশ';

  @override
  String get noticeNotFound => 'নোটিশ পাওয়া যায়নি';

  @override
  String get noticeNotFoundMessage =>
      'এটির মেয়াদ শেষ হয়ে থাকতে পারে অথবা এটি আপনার জন্য নয়।';

  @override
  String get noticeAcked => 'স্বীকার করা হয়েছে';

  @override
  String get noticeAckFailed => 'স্বীকার করা যায়নি। আবার চেষ্টা করুন।';

  @override
  String get noticeAckAction => 'আমি পড়েছি ও বুঝেছি';

  @override
  String noticeAckedOn(String date) {
    return '$date তারিখে স্বীকার করা হয়েছে';
  }

  @override
  String noticeAudience(String name) {
    return 'প্রাপক: $name';
  }

  @override
  String get noticeReach => 'প্রাপ্তি';

  @override
  String noticeReadStat(int read, int total) {
    return 'পড়েছেন $read/$total';
  }

  @override
  String noticeAckStat(int ack, int total) {
    return 'স্বীকার $ack/$total';
  }

  @override
  String get noticeViewReceipts => 'কারা পড়েছেন';

  @override
  String get noticeReceiptAcked => 'স্বীকার করেছেন';

  @override
  String noticeReceiptRead(String date) {
    return 'পড়েছেন $date';
  }

  @override
  String get noticeReceiptUnread => 'পড়েননি';

  @override
  String get noticeCatGeneral => 'সাধারণ';

  @override
  String get noticeCatPolicy => 'নীতিমালা';

  @override
  String get noticeCatSafety => 'নিরাপত্তা';

  @override
  String get noticeCatOperations => 'অপারেশন';

  @override
  String get noticeCatAdmin => 'প্রশাসন';

  @override
  String get noticeCatHr => 'মানবসম্পদ';

  @override
  String get noticeCatExecutive => 'নির্বাহী';

  @override
  String get noticePrioNormal => 'সাধারণ';

  @override
  String get noticePrioHigh => 'জরুরি';

  @override
  String get noticePrioCritical => 'অত্যন্ত জরুরি';

  @override
  String get noticeFieldCategory => 'বিভাগ';

  @override
  String get noticeFieldTitle => 'শিরোনাম';

  @override
  String get noticeFieldBody => 'বার্তা';

  @override
  String get noticeFieldPriority => 'অগ্রাধিকার';

  @override
  String get noticeFieldAudience => 'প্রাপক';

  @override
  String get noticeFieldRequireAck => 'স্বীকৃতি বাধ্যতামূলক';

  @override
  String get noticeFieldPin => 'উপরে পিন করুন';

  @override
  String get noticeCriticalHint =>
      'অত্যন্ত জরুরি নোটিশ সব প্রাপককে সঙ্গে সঙ্গে জানায়।';

  @override
  String get noticeAudAll => 'সবাই';

  @override
  String get noticeAudDepartment => 'একটি বিভাগ';

  @override
  String get noticeAudSite => 'একটি সাইট';

  @override
  String get noticePublish => 'প্রকাশ করুন';

  @override
  String get noticePublishConfirmTitle => 'নোটিশটি প্রকাশ করবেন?';

  @override
  String get noticePublishConfirmMessage =>
      'প্রাপকদের সঙ্গে সঙ্গে জানানো হবে। প্রকাশিত নোটিশ সম্পাদনা করা যায় না।';

  @override
  String get noticePublished => 'নোটিশ প্রকাশিত হয়েছে';

  @override
  String get noticeErrMaxPinned =>
      'ইতিমধ্যে পাঁচটি নোটিশ পিন করা আছে। পিন ছাড়া প্রকাশ করুন।';

  @override
  String get noticeErrForbidden =>
      'এই প্রাপক বা বিভাগে প্রকাশ করার অনুমতি আপনার নেই।';

  @override
  String get noticeErrFailed =>
      'প্রকাশ করা যায়নি। ফর্ম দেখে আবার চেষ্টা করুন।';

  @override
  String get claimsTitle => 'বিল ও দাবি';

  @override
  String get claimTabClaims => 'আমার দাবি';

  @override
  String get claimTabAdvances => 'অগ্রিম';

  @override
  String get claimTabPayable => 'পরিশোধযোগ্য';

  @override
  String get claimNew => 'নতুন দাবি';

  @override
  String get claimNewTitle => 'নতুন দাবি';

  @override
  String get claimEditTitle => 'দাবি সম্পাদনা';

  @override
  String get claimDetailTitle => 'দাবি';

  @override
  String get claimEmptyTitle => 'এখনও কোনো দাবি নেই';

  @override
  String get claimEmptyMessage =>
      'ভ্রমণ, যাতায়াত বা অনুষ্ঠানের খরচের জন্য নতুন দাবি চাপুন।';

  @override
  String get claimTypeTada => 'ভ্রমণ ও ডিএ';

  @override
  String get claimTypeConveyance => 'যাতায়াত বিল';

  @override
  String get claimTypeTour => 'সফর ও অনুষ্ঠান';

  @override
  String get claimTypeTadaHint =>
      'দাপ্তরিক ভ্রমণ: টিকিট, হোটেল, খাবার ও দৈনিক ভাতা';

  @override
  String get claimTypeConveyanceHint =>
      'মাসের স্থানীয় যাতায়াত: সিএনজি, রিকশা, রাইড শেয়ার';

  @override
  String get claimTypeTourHint => 'সফর ও অনুষ্ঠান, চাইলে অগ্রিম সমন্বয়সহ';

  @override
  String get claimStatusDraft => 'খসড়া';

  @override
  String get claimStatusPendingManager => 'ম্যানেজারের কাছে';

  @override
  String get claimStatusPendingFinance => 'অর্থ বিভাগে';

  @override
  String get claimStatusApproved => 'অনুমোদিত';

  @override
  String get claimStatusSettled => 'পরিশোধিত';

  @override
  String get claimStatusReturned => 'ফেরত';

  @override
  String get claimStatusRejected => 'প্রত্যাখ্যাত';

  @override
  String get claimStatusCancelled => 'বাতিল';

  @override
  String get claimCatDa => 'দৈনিক ভাতা';

  @override
  String get claimCatTicket => 'টিকিট';

  @override
  String get claimCatHotel => 'হোটেল';

  @override
  String get claimCatMeals => 'খাবার';

  @override
  String get claimCatMileage => 'মাইলেজ';

  @override
  String get claimCatCng => 'সিএনজি';

  @override
  String get claimCatRickshaw => 'রিকশা';

  @override
  String get claimCatRideShare => 'রাইড শেয়ার';

  @override
  String get claimCatBusFare => 'বাস ভাড়া';

  @override
  String get claimCatEvent => 'অনুষ্ঠানের খরচ';

  @override
  String get claimCatOther => 'অন্যান্য';

  @override
  String get claimModeNone => 'নির্দিষ্ট নয়';

  @override
  String get claimModeExecutiveCar => 'এক্সিকিউটিভ গাড়ি';

  @override
  String get claimModeCompanyCar => 'কোম্পানির গাড়ি';

  @override
  String get claimModePoolCar => 'পুল গাড়ি';

  @override
  String get claimModeAir => 'অভ্যন্তরীণ ফ্লাইট';

  @override
  String get claimModeAcTrain => 'এসি ট্রেন';

  @override
  String get claimModeFirstTrain => 'প্রথম শ্রেণির ট্রেন';

  @override
  String get claimModeTrain => 'ট্রেন';

  @override
  String get claimModeAcBus => 'এসি বাস';

  @override
  String get claimModeBus => 'বাস';

  @override
  String claimPolicyTitle(String band) {
    return 'আপনার প্রাপ্যতা (ব্যান্ড $band)';
  }

  @override
  String claimPolicyConveyance(String used, String cap) {
    return 'এই মাসের যাতায়াত: $cap-এর মধ্যে $used';
  }

  @override
  String claimPolicyDa(String dhaka, String district) {
    return 'দৈনিক ভাতা: ঢাকায় $dhaka, অন্যত্র $district';
  }

  @override
  String claimPolicyHotel(String cap) {
    return 'হোটেল রাতপ্রতি সর্বোচ্চ $cap';
  }

  @override
  String get claimFieldPurpose => 'উদ্দেশ্য';

  @override
  String get claimFieldEmployee => 'কর্মী';

  @override
  String get claimFieldPeriod => 'সময়কাল';

  @override
  String get claimFieldPeriodFrom => 'শুরু';

  @override
  String get claimFieldPeriodTo => 'শেষ';

  @override
  String get claimFieldDepart => 'যাত্রা শুরু';

  @override
  String get claimFieldReturn => 'ফেরা';

  @override
  String get claimFieldDestination => 'গন্তব্য';

  @override
  String get claimFieldMode => 'যাতায়াতের মাধ্যম';

  @override
  String get claimFieldAdvance => 'সমন্বয়ের অগ্রিম';

  @override
  String get claimAdvanceNone => 'অগ্রিম নেই';

  @override
  String get claimDestDhaka => 'ঢাকা';

  @override
  String get claimDestOther => 'ঢাকার বাইরে';

  @override
  String get claimDaAuto =>
      'যাত্রা ও ফেরার সময় থেকে দৈনিক ভাতা নিজে থেকেই যোগ হবে।';

  @override
  String claimLines(int count) {
    return 'খরচের তালিকা ($count)';
  }

  @override
  String get claimNoLinesYet => 'এখনও কোনো খরচ যোগ করা হয়নি।';

  @override
  String get claimLineAdd => 'খরচ যোগ করুন';

  @override
  String get claimLineEdit => 'খরচ সম্পাদনা';

  @override
  String get claimLineSave => 'খরচ সংরক্ষণ';

  @override
  String get claimLineAuto => 'স্বয়ংক্রিয়';

  @override
  String get claimLineDeclared => 'ঘোষিত';

  @override
  String get claimFieldCategory => 'ধরন';

  @override
  String get claimFieldDate => 'তারিখ';

  @override
  String get claimFieldAmount => 'পরিমাণ (টাকা)';

  @override
  String get claimFieldNights => 'রাত';

  @override
  String get claimFieldDistance => 'দূরত্ব (কিমি)';

  @override
  String get claimFieldFrom => 'কোথা থেকে';

  @override
  String get claimFieldTo => 'কোথায়';

  @override
  String get claimFieldDescription => 'মন্তব্য';

  @override
  String claimMileageHint(String rate) {
    return 'প্রতি কিমিতে $rate হারে';
  }

  @override
  String claimKm(String km) {
    return '$km কিমি';
  }

  @override
  String claimReceiptHint(String amount) {
    return '$amount-এর বেশি হলে রসিদ বাধ্যতামূলক।';
  }

  @override
  String get claimReceiptAdd => 'রসিদের ছবি যোগ করুন';

  @override
  String get claimReceiptAttached => 'রসিদ সংযুক্ত';

  @override
  String get claimDeclaration => 'রসিদ নেই, আমি খরচটি ঘোষণা করছি';

  @override
  String claimDeclarationHint(String amount) {
    return 'ছোট সিএনজি, রিকশা ও খাবারের খরচে $amount পর্যন্ত অনুমোদিত।';
  }

  @override
  String claimEnteredTotal(String amount) {
    return 'যোগ করা: $amount';
  }

  @override
  String get claimSaveDraft => 'খসড়া সংরক্ষণ';

  @override
  String get claimSaved => 'খসড়া সংরক্ষিত';

  @override
  String get claimErrRequired => 'আবশ্যক';

  @override
  String get claimErrPurpose => 'কমপক্ষে ৩টি অক্ষর লিখুন';

  @override
  String get claimErrDates => 'সঠিক তারিখ বাছুন';

  @override
  String get claimErrAmount => 'সঠিক পরিমাণ লিখুন';

  @override
  String get claimErrDistance => 'কিমিতে দূরত্ব লিখুন';

  @override
  String get claimErrNights => '১ থেকে ৬০ রাত লিখুন';

  @override
  String get claimErrSave =>
      'দাবি সংরক্ষণ করা যায়নি। তথ্য দেখে আবার চেষ্টা করুন।';

  @override
  String get claimErrOffline =>
      'আপনি অফলাইনে আছেন। ইন্টারনেটে যুক্ত হয়ে আবার চেষ্টা করুন।';

  @override
  String get claimErrFailed => 'কিছু ভুল হয়েছে। আবার চেষ্টা করুন।';

  @override
  String get claimErrBlocked =>
      'জমা দেওয়ার আগে বাধা দেওয়া সমস্যাগুলো ঠিক করুন।';

  @override
  String get claimTotal => 'মোট';

  @override
  String get claimAdvanceAdjusted => 'সমন্বিত অগ্রিম';

  @override
  String get claimNetPayable => 'আপনার প্রাপ্য';

  @override
  String get claimNetRefund => 'কোম্পানিকে ফেরত';

  @override
  String get claimVoucher => 'ভাউচার';

  @override
  String get claimReviewerComment => 'পর্যালোচকের মন্তব্য';

  @override
  String get claimRoute => 'অনুমোদনের ধাপ';

  @override
  String get claimSubmit => 'অনুমোদনের জন্য জমা দিন';

  @override
  String get claimSubmitConfirmTitle => 'দাবিটি জমা দেবেন?';

  @override
  String get claimSubmitConfirmMessage =>
      'এটি আপনার ম্যানেজার ও পরে অর্থ বিভাগে যাবে। অপেক্ষমাণ থাকলে সম্পাদনা করা যাবে না।';

  @override
  String get claimSubmitted => 'দাবি জমা হয়েছে';

  @override
  String get claimEdit => 'সম্পাদনা';

  @override
  String get claimCancel => 'দাবি বাতিল';

  @override
  String get claimCancelConfirm => 'দাবিটি বাতিল করবেন?';

  @override
  String get claimCancelled => 'দাবি বাতিল হয়েছে';

  @override
  String get claimWithdraw => 'দাবি প্রত্যাহার';

  @override
  String get claimPay => 'পরিশোধিত চিহ্নিত করুন';

  @override
  String claimPayConfirm(String amount) {
    return '$amount পরিশোধ করবেন?';
  }

  @override
  String get claimPayMessage =>
      'ভাউচার তৈরি হবে ও কর্মীকে জানানো হবে। এটি ফেরানো যায় না।';

  @override
  String get claimPaid => 'পরিশোধ নথিভুক্ত হয়েছে';

  @override
  String get claimFlagNoLines => 'কমপক্ষে একটি খরচ যোগ করুন।';

  @override
  String get claimFlagReceipt => 'একটি খরচে রসিদ বা ঘোষণা নেই।';

  @override
  String claimFlagHotel(String amount) {
    return 'হোটেল খরচ রাতের সীমার বেশি। প্রাপ্য: $amount।';
  }

  @override
  String claimFlagConveyance(String amount) {
    return 'মাসিক যাতায়াত সীমা ছাড়িয়েছে। প্রাপ্য: $amount।';
  }

  @override
  String get claimFlagOverlap => 'এই সময়কাল অন্য দাবির সঙ্গে মিলে যাচ্ছে।';

  @override
  String get claimFlagDuplicate => 'একই রসিদ একাধিকবার ব্যবহার হয়েছে।';

  @override
  String get claimFlagLate => '৬০ দিনের সময়সীমার পরে জমা।';

  @override
  String get claimFlagMode =>
      'যাতায়াতের মাধ্যম আপনার প্রাপ্যতার ঊর্ধ্বে। অর্থ বিভাগ দেখবে।';

  @override
  String get claimFlagMileage => 'দীর্ঘ মাইলেজ ভ্রমণ। অর্থ বিভাগ দেখবে।';

  @override
  String get advNew => 'অগ্রিম চান';

  @override
  String get advNewTitle => 'সফর অগ্রিম';

  @override
  String get advIntro =>
      'আসন্ন সফরের জন্য আগাম অর্থ চান। পরে সফরের দাবির সঙ্গে সমন্বয় করুন।';

  @override
  String get advFieldAmount => 'পরিমাণ (টাকা)';

  @override
  String get advFieldTourStart => 'সফর শুরু';

  @override
  String get advFieldTourEnd => 'সফর শেষ';

  @override
  String get advErrAmount => '৫,০০,০০০ পর্যন্ত পরিমাণ লিখুন';

  @override
  String get advErrOverdue =>
      'আগের একটি অগ্রিম এখনও সমন্বয় হয়নি। আগে সেটি সমন্বয় করুন।';

  @override
  String get advErrFailed => 'অগ্রিম চাওয়া যায়নি। আবার চেষ্টা করুন।';

  @override
  String get advSubmit => 'অনুরোধ জমা দিন';

  @override
  String get advSubmitted => 'অগ্রিমের অনুরোধ জমা হয়েছে';

  @override
  String get advEmptyTitle => 'কোনো অগ্রিম নেই';

  @override
  String get advEmptyMessage => 'সফরের আগে অগ্রিম চাইতে পারেন।';

  @override
  String get advStatusDisbursed => 'বিতরিত';

  @override
  String get advSettleHint =>
      'এখনও সমন্বয় হয়নি। সফরের দাবির সঙ্গে যুক্ত করুন।';

  @override
  String get advCancel => 'অনুরোধ বাতিল';

  @override
  String get advCancelConfirm => 'অগ্রিমের অনুরোধ বাতিল করবেন?';

  @override
  String get advCancelled => 'অগ্রিম বাতিল হয়েছে';

  @override
  String get advDisburse => 'বিতরণ করুন';

  @override
  String advDisburseConfirm(String amount) {
    return '$amount বিতরণ করবেন?';
  }

  @override
  String get advDisbursed => 'অগ্রিম বিতরণ হয়েছে';

  @override
  String get payClaims => 'পরিশোধের জন্য প্রস্তুত দাবি';

  @override
  String get payAdvances => 'বিতরণের অপেক্ষায় অগ্রিম';

  @override
  String get payEmptyTitle => 'পরিশোধের কিছু নেই';

  @override
  String get payEmptyMessage => 'অনুমোদিত দাবি ও অগ্রিম এখানে দেখা যাবে।';

  @override
  String get busTitle => 'স্টাফ বাস';

  @override
  String get busTabMySeat => 'আমার আসন';

  @override
  String get busTabRoutes => 'রুট';

  @override
  String get busRouteTitle => 'রুট';

  @override
  String busRouteMeta(String bus, String km) {
    return 'বাস $bus · $km কিমি';
  }

  @override
  String busFreeSeats(String free, String total) {
    return '$totalটির মধ্যে $freeটি আসন খালি';
  }

  @override
  String busFull(String count) {
    return 'পূর্ণ · $count জন অপেক্ষায়';
  }

  @override
  String get busMySeatBadge => 'আমার রুট';

  @override
  String get busWaitingBadge => 'অপেক্ষায়';

  @override
  String get busOfferedBadge => 'আসন প্রস্তাবিত';

  @override
  String get busReleasedBadge => 'ছাড়া হয়েছে';

  @override
  String get busEmptyTitle => 'এখনও বাসের আসন নেই';

  @override
  String get busEmptyMessage =>
      'রুট বেছে অপেক্ষমাণ তালিকায় যুক্ত হন। পালা এলে আসন প্রস্তাব করা হবে।';

  @override
  String get busBrowse => 'রুট দেখুন';

  @override
  String busSeatNo(String no) {
    return 'আসন $no';
  }

  @override
  String busStopLine(String stop, String morning, String evening) {
    return '$stop · সকাল $morning · সন্ধ্যা $evening';
  }

  @override
  String busStopTimes(String morning, String evening) {
    return 'সকাল $morning · সন্ধ্যা $evening';
  }

  @override
  String get busStops => 'স্টপেজ';

  @override
  String get busJoin => 'অপেক্ষমাণ তালিকায় যুক্ত হন';

  @override
  String busJoinConfirm(String route) {
    return '$route রুটের অপেক্ষমাণ তালিকায় যুক্ত হবেন?';
  }

  @override
  String get busJoinMessage =>
      'আবেদনের সময় অনুযায়ী আপনি সারিতে থাকবেন। আসন খালি হলে গ্রহণ করতে ৪৮ ঘণ্টা পাবেন।';

  @override
  String get busJoined => 'অপেক্ষমাণ তালিকায় যুক্ত হয়েছেন';

  @override
  String get busWaitlistTitle => 'অপেক্ষমাণ তালিকায়';

  @override
  String busPosition(String pos) {
    return 'অবস্থান $pos';
  }

  @override
  String busEstimate(String days) {
    return 'আনুমানিক অপেক্ষা: প্রায় $days দিন';
  }

  @override
  String get busLeave => 'তালিকা ছাড়ুন';

  @override
  String get busLeaveConfirm => 'অপেক্ষমাণ তালিকা ছাড়বেন?';

  @override
  String get busLeft => 'তালিকা থেকে সরানো হয়েছে';

  @override
  String busOfferTitle(String seat) {
    return 'আসন $seat আপনার জন্য প্রস্তুত';
  }

  @override
  String busOfferLeft(String h, String m) {
    return 'সাড়া দিতে বাকি $h ঘণ্টা $m মিনিট';
  }

  @override
  String get busOfferExpired => 'প্রস্তাবের মেয়াদ শেষ';

  @override
  String get busAccept => 'আসন নিন';

  @override
  String get busAccepted => 'আসন নিশ্চিত হয়েছে';

  @override
  String get busDecline => 'প্রত্যাখ্যান';

  @override
  String get busDeclineConfirm => 'আসনটি প্রত্যাখ্যান করবেন?';

  @override
  String get busDeclineMessage =>
      'আপনি এই তালিকা থেকে বাদ পড়বেন ও আসনটি পরের জন পাবেন।';

  @override
  String get busDeclined => 'প্রস্তাব প্রত্যাখ্যাত';

  @override
  String get busChooseStop => 'আপনার স্টপেজ বাছুন';

  @override
  String get busConfirmSeat => 'আসন নিশ্চিত করুন';

  @override
  String get busRelease => 'কিছুদিনের জন্য আসন ছাড়ুন';

  @override
  String get busReleaseTitle => 'আসন ছেড়ে দিন';

  @override
  String get busReleaseHint =>
      'ছুটি বা সফরে যাচ্ছেন? সর্বোচ্চ ৬০ দিন আসন খালি রাখুন, পরে ফিরে নিন।';

  @override
  String get busReleaseFrom => 'শুরু';

  @override
  String get busReleaseTo => 'শেষ';

  @override
  String get busReleaseReason => 'কারণ';

  @override
  String get busReleased => 'আসন ছাড়া হয়েছে';

  @override
  String busReleasedRange(String range) {
    return 'ছাড়া আছে $range';
  }

  @override
  String get busReclaim => 'আসন ফিরে নিন';

  @override
  String get busReclaimConfirm => 'আসন ফিরে নেবেন?';

  @override
  String get busReclaimMessage => 'এখন অন্য কেউ ব্যবহার না করলেই এটি কাজ করবে।';

  @override
  String get busReclaimed => 'আসন আবার আপনার';

  @override
  String get busErrFailed => 'কাজটি হয়নি। আবার চেষ্টা করুন।';

  @override
  String get busErrOfferExpired => 'এই প্রস্তাবের মেয়াদ শেষ।';

  @override
  String get busErrHasSeat => 'আপনার ইতিমধ্যে বাসের আসন আছে।';

  @override
  String get busErrAlreadyWaiting => 'আপনি ইতিমধ্যে একটি তালিকায় আছেন।';

  @override
  String get busSeatMap => 'আসনের নকশা';

  @override
  String get busLegendTaken => 'দখলে';

  @override
  String get busLegendReleased => 'ছাড়া';

  @override
  String get busLegendOffered => 'প্রস্তাবিত';

  @override
  String get busLegendFree => 'খালি';

  @override
  String busQueue(int count) {
    return 'অপেক্ষমাণ তালিকা ($count)';
  }

  @override
  String get busQueueEmpty => 'কেউ অপেক্ষায় নেই।';

  @override
  String busPriorityLevel(String level) {
    return 'অগ্রাধিকার $level';
  }

  @override
  String busPriorityTitle(String name) {
    return '$name-এর অগ্রাধিকার';
  }

  @override
  String get busPriorityReason => 'কারণ';

  @override
  String get busPriorityReasonHint =>
      'অগ্রাধিকার বদলের কারণ লিখুন (কমপক্ষে ১০ অক্ষর)। এটি অডিট লগে থাকবে।';

  @override
  String get busPrioritySave => 'অগ্রাধিকার সংরক্ষণ';

  @override
  String get busPrioritySaved => 'অগ্রাধিকার হালনাগাদ হয়েছে';

  @override
  String get busEnd => 'বরাদ্দ শেষ করুন';

  @override
  String busEndConfirm(String seat) {
    return 'আসন $seat-এর বরাদ্দ শেষ করবেন?';
  }

  @override
  String get busEndMessage =>
      'আসনটি অপেক্ষমাণ তালিকার পরের জনকে প্রস্তাব করা হবে।';

  @override
  String get busEnded => 'বরাদ্দ শেষ হয়েছে';

  @override
  String get busBroadcast => 'এই রুটে বার্তা পাঠান';

  @override
  String get busBroadcastMessage => 'বার্তা';

  @override
  String get busBroadcastSend => 'পাঠান';

  @override
  String get busBroadcastSent => 'বার্তা পাঠানো হয়েছে';

  @override
  String get moduleApprovals => 'অনুমোদন';

  @override
  String get inboxOpen => 'খুলুন';

  @override
  String get approvalsTitle => 'অনুমোদন';

  @override
  String get approvalTabPending => 'আমার অপেক্ষায়';

  @override
  String get approvalTabHistory => 'ইতিহাস';

  @override
  String approvalSelected(int count) {
    return '$countটি বাছাই';
  }

  @override
  String approvalVerdict(int count) {
    return '$countটি আপনার সিদ্ধান্তের অপেক্ষায়';
  }

  @override
  String approvalVerdictOverdue(int pending, int overdue) {
    return '$pendingটি অপেক্ষায়, $overdueটি সময় পেরিয়েছে';
  }

  @override
  String get approvalCatAll => 'সব';

  @override
  String get approvalCatLeave => 'ছুটি';

  @override
  String get approvalCatClaims => 'বিল ও দাবি';

  @override
  String get approvalCatProcurement => 'ক্রয়';

  @override
  String get approvalCatFleet => 'যানবাহন';

  @override
  String get approvalCatOther => 'অন্যান্য';

  @override
  String get approvalEmptyTitle => 'কিছু বাকি নেই';

  @override
  String get approvalEmptyMessage =>
      'আপনার সিদ্ধান্তের অপেক্ষায় কিছু নেই। নতুন অনুরোধ এখানে আসবে।';

  @override
  String get approvalBatchHint =>
      'একসঙ্গে একাধিক অনুমোদনে অনুরোধ চেপে ধরুন। স্বাক্ষর লাগে বা ৫,০০,০০০-এর বেশি হলে আলাদাভাবে সিদ্ধান্ত নিতে হবে।';

  @override
  String approvalBatchConfirm(int count) {
    return '$countটি অনুরোধ অনুমোদন করবেন?';
  }

  @override
  String get approvalBatchMessage =>
      'প্রতিটি যেমন আছে তেমনই অনুমোদিত হবে। এটি ফেরানো যায় না।';

  @override
  String approvalBatchDone(int count) {
    return '$countটি অনুমোদিত';
  }

  @override
  String approvalBatchPartial(int ok, int failed) {
    return '$okটি অনুমোদিত, $failedটি করা যায়নি';
  }

  @override
  String approvalApproveSelected(int count) {
    return '$countটি অনুমোদন';
  }

  @override
  String get approvalErrFailed => 'কাজটি হয়নি। আবার চেষ্টা করুন।';

  @override
  String get approvalErrSelf => 'নিজের অনুরোধে সিদ্ধান্ত নেওয়া যায় না।';

  @override
  String get approvalErrLimit => 'এই অঙ্ক আপনার অর্পিত অনুমোদনের সীমার বেশি।';

  @override
  String get approvalErrClosed => 'এই অনুরোধ আর সিদ্ধান্তের অপেক্ষায় নেই।';

  @override
  String approvalErrMinChars(int count) {
    return 'কমপক্ষে $countটি অক্ষর লিখুন';
  }

  @override
  String approvalFrom(String name, String when) {
    return '$name-এর কাছ থেকে, $when';
  }

  @override
  String get approvalUrgent => 'জরুরি';

  @override
  String get approvalDelegatedToYou => 'আপনাকে অর্পিত';

  @override
  String get approvalSlaOk => 'সময়মতো';

  @override
  String get approvalSlaWarn => 'অর্ধেক সময় গেছে';

  @override
  String get approvalSlaDanger => 'শিগগির সময় শেষ';

  @override
  String get approvalSlaOverdue => 'সময় পেরিয়েছে';

  @override
  String get approvalDecApproved => 'অনুমোদিত';

  @override
  String get approvalDecRejected => 'প্রত্যাখ্যাত';

  @override
  String get approvalDecReturned => 'ফেরত';

  @override
  String get approvalDecStarted => 'আমার পাঠানো';

  @override
  String get approvalWithdrawn => 'প্রত্যাহৃত';

  @override
  String get approvalInReview => 'পর্যালোচনায়';

  @override
  String get approvalHistoryEmptyTitle => 'এখনও কোনো ইতিহাস নেই';

  @override
  String get approvalHistoryEmptyMessage =>
      'আপনার সিদ্ধান্ত ও পাঠানো অনুরোধ এখানে দেখা যাবে।';

  @override
  String get approvalActApprove => 'অনুমোদন';

  @override
  String get approvalActReject => 'প্রত্যাখ্যান';

  @override
  String get approvalActReturn => 'ফেরত দিন';

  @override
  String get approvalActDelegate => 'অর্পণ';

  @override
  String get approvalActWithdraw => 'প্রত্যাহার';

  @override
  String get approvalActComment => 'মন্তব্য';

  @override
  String get approvalDetailTitle => 'অনুরোধ';

  @override
  String get approvalApproveTitle => 'অনুরোধটি অনুমোদন করবেন?';

  @override
  String get approvalNoteOptional => 'মন্তব্য (ঐচ্ছিক)';

  @override
  String get approvalRejectTitle => 'অনুরোধটি প্রত্যাখ্যান করবেন?';

  @override
  String get approvalRejectMessage =>
      'আবেদনকারীকে কারণ জানানো হবে। অনুরোধটি বন্ধ হয়ে যাবে।';

  @override
  String get approvalReturnTitle => 'পরিবর্তনের জন্য ফেরত দেবেন?';

  @override
  String get approvalReturnMessage => 'আবেদনকারী ঠিক করে আবার পাঠাতে পারবেন।';

  @override
  String get approvalReasonHint => 'কারণ (কমপক্ষে ১০ অক্ষর)';

  @override
  String get approvalDoneApproved => 'অনুমোদিত হয়েছে';

  @override
  String get approvalDoneRejected => 'প্রত্যাখ্যান করা হয়েছে';

  @override
  String get approvalDoneReturned => 'আবেদনকারীর কাছে ফেরত গেছে';

  @override
  String approvalDoneDelegated(String name) {
    return '$name-কে অর্পণ করা হয়েছে';
  }

  @override
  String get approvalDoneComment => 'মন্তব্য যোগ হয়েছে';

  @override
  String get approvalDoneWithdrawn => 'অনুরোধ প্রত্যাহার হয়েছে';

  @override
  String get approvalDelegateTitle => 'সহকর্মীকে অর্পণ করুন';

  @override
  String get approvalDelegateMessage =>
      'তিনি আপনার হয়ে সিদ্ধান্ত নেবেন এবং রেকর্ডে আপনার পক্ষে বলে থাকবে।';

  @override
  String get approvalCommentHint => 'মন্তব্য লিখুন';

  @override
  String get approvalSend => 'পাঠান';

  @override
  String get approvalWithdrawConfirm => 'অনুরোধটি প্রত্যাহার করবেন?';

  @override
  String get approvalWithdrawMessage => 'অনুমোদনকারীরা আর এটি দেখবেন না।';

  @override
  String approvalNextYou(String step) {
    return 'আপনার অপেক্ষায়: $step';
  }

  @override
  String get approvalNextInReview => 'পর্যালোচনা চলছে। আপনার কিছু করার নেই।';

  @override
  String approvalNextWaiting(String names) {
    return '$names-এর অপেক্ষায়। আপনার কিছু করার নেই।';
  }

  @override
  String approvalNextClosed(String status) {
    return 'শেষ: $status';
  }

  @override
  String get approvalViewRequest => 'পুরো অনুরোধ দেখুন';

  @override
  String get approvalRoute => 'অনুমোদনের ধাপ';

  @override
  String get approvalDiscussion => 'মন্তব্য';

  @override
  String get approvalNeedsSignature => 'এই ধাপে আপনার স্বাক্ষর দরকার।';

  @override
  String get commonSave => 'সংরক্ষণ করুন';

  @override
  String get moduleNoteSheets => 'নোট-শিট';

  @override
  String get nsIntro =>
      'নোট-শিট হলো সিদ্ধান্ত বা অর্থ ব্যয়ের অনুমোদন চেয়ে লেখা আনুষ্ঠানিক ফাইল নোট। এটি একে একে প্রতিটি কর্মকর্তার কাছে যায় এবং প্রত্যেকে স্বাক্ষর করেন।';

  @override
  String get nsTabMine => 'আমার';

  @override
  String get nsTabToSign => 'স্বাক্ষরের অপেক্ষায়';

  @override
  String get nsTabAll => 'আমি যা দেখতে পারি';

  @override
  String get nsNew => 'নতুন নোট-শিট';

  @override
  String get nsEmptyMine => 'আপনি এখনো কোনো নোট-শিট লেখেননি।';

  @override
  String get nsEmptyToSign => 'আপনার স্বাক্ষরের জন্য কিছু অপেক্ষায় নেই।';

  @override
  String get nsEmptyAll => 'দেখানোর মতো কোনো নোট-শিট নেই।';

  @override
  String get nsStatusDraft => 'খসড়া';

  @override
  String get nsStatusInReview => 'অনুমোদনকারীদের কাছে';

  @override
  String get nsStatusReturned => 'ফেরত এসেছে';

  @override
  String get nsStatusApproved => 'অনুমোদিত';

  @override
  String get nsNextDraft =>
      'এখনো পাঠানো হয়নি। বিস্তারিত যোগ করে অনুমোদনের জন্য পাঠান।';

  @override
  String get nsNextSign =>
      'এখন আপনার পালা। পড়ে স্বাক্ষর করুন, ফেরত পাঠান অথবা বাতিল করুন।';

  @override
  String nsNextWaiting(String names) {
    return '$names-এর জন্য অপেক্ষা চলছে।';
  }

  @override
  String get nsNextReturned =>
      'আপনার কাছে ফেরত এসেছে। কারণ পড়ে ঠিক করে আবার পাঠান।';

  @override
  String nsNextReturnedOther(String name) {
    return 'পরিবর্তনের জন্য $name-এর কাছে ফেরত গেছে।';
  }

  @override
  String get nsNextApproved =>
      'সবাই অনুমোদন ও স্বাক্ষর করেছেন। আর কিছু করার নেই।';

  @override
  String get nsNextRejected => 'বাতিল হয়েছে। এই ফাইলটি বন্ধ।';

  @override
  String nsNextWithdrawn(String name) {
    return '$name প্রত্যাহার করেছেন। এই ফাইলটি বন্ধ।';
  }

  @override
  String nsFrom(String name, String dept, String date) {
    return '$name, $dept, $date থেকে';
  }

  @override
  String nsVerdictOne(String name) {
    return '১টি কোটেশন, $name থেকে।';
  }

  @override
  String nsVerdictCheapest(int count, String name, String saving) {
    return '$countটি কোটেশন। $name সবচেয়ে সস্তা, সবচেয়ে দামিটির চেয়ে $saving সাশ্রয়।';
  }

  @override
  String nsVerdictNotLowest(
    int count,
    String name,
    String extra,
    String lowest,
  ) {
    return '$countটি কোটেশন। $name সুপারিশকৃত, কিন্তু সর্বনিম্ন $lowest-এর চেয়ে $extra বেশি।';
  }

  @override
  String nsVerdictNoPick(int count, String name) {
    return '$countটি কোটেশন। $name সর্বনিম্ন। এখনো কোনো সরবরাহকারী সুপারিশ করা হয়নি।';
  }

  @override
  String nsOverLowest(String amount) {
    return 'সর্বনিম্নের চেয়ে $amount বেশি';
  }

  @override
  String get nsRecommended => 'সুপারিশকৃত';

  @override
  String get nsQuotesTitle => 'কোটেশন';

  @override
  String nsQuoteMeta(int days, int months) {
    return '$days দিনে সরবরাহ, $months মাস ওয়ারেন্টি';
  }

  @override
  String get nsNotesTitle => 'নোট';

  @override
  String get nsRouteTitle => 'অনুমোদনের ধাপ';

  @override
  String get nsSignedBy => 'স্বাক্ষর করেছেন';

  @override
  String get nsSignedVerified => 'স্বাক্ষরিত ও যাচাইকৃত';

  @override
  String get nsDetails => 'বিস্তারিত';

  @override
  String get nsDetailsHelp =>
      'প্রতিটি নোট ও স্বাক্ষরের একটি ফিঙ্গারপ্রিন্ট (SHA-256) আছে। আগের কোনো নোট বদলালে ফিঙ্গারপ্রিন্ট আর মিলবে না।';

  @override
  String nsVerifyCode(String code) {
    return 'যাচাই কোড $code';
  }

  @override
  String get nsKindNote => 'নোট';

  @override
  String get nsKindQuery => 'প্রশ্ন';

  @override
  String get nsKindReturn => 'ফেরত';

  @override
  String get nsUrgNormal => 'সাধারণ';

  @override
  String get nsUrgHigh => 'জরুরি';

  @override
  String get nsUrgCritical => 'অতি জরুরি';

  @override
  String get nsConfInternal => 'অভ্যন্তরীণ';

  @override
  String get nsConfConfidential => 'গোপনীয়';

  @override
  String get nsConfSecret => 'অতি গোপন';

  @override
  String get nsEditTitle => 'নোট-শিট সম্পাদনা';

  @override
  String get nsFieldTitle => 'শিরোনাম';

  @override
  String get nsFieldSubject => 'বিষয়';

  @override
  String get nsFieldAmount => 'টাকার অঙ্ক, যদি অর্থ জড়িত থাকে';

  @override
  String get nsFieldAmountHelp => 'ব্যয়ের অনুমোদন না চাইলে ফাঁকা রাখুন।';

  @override
  String get nsFieldJustification => 'আপনার কী প্রয়োজন এবং কেন?';

  @override
  String get nsFieldUrgency => 'কতটা জরুরি?';

  @override
  String get nsFieldConfidentiality => 'কারা পড়তে পারবেন?';

  @override
  String get nsQuoteAdd => 'কোটেশন যোগ করুন';

  @override
  String get nsQuotesNeeded =>
      '২,০০,০০০ টাকা বা তার বেশি ব্যয়ে কমপক্ষে ৩টি কোটেশন ও একজন সুপারিশকৃত সরবরাহকারী লাগবে।';

  @override
  String get nsQuotesOptional => '২,০০,০০০ টাকার নিচে কোটেশন ঐচ্ছিক।';

  @override
  String get nsQuotePickHint =>
      'সরবরাহকারী সুপারিশ করতে বৃত্তে ট্যাপ করুন। বদলাতে সারিতে ট্যাপ করুন।';

  @override
  String get nsQuoteVendor => 'সরবরাহকারী';

  @override
  String get nsQuotePrice => 'উদ্ধৃত মূল্য (টাকা)';

  @override
  String get nsQuoteDelivery => 'সরবরাহ (দিন)';

  @override
  String get nsQuoteWarranty => 'ওয়ারেন্টি (মাস)';

  @override
  String get nsRecoNote => 'সর্বনিম্ন দাম কেন নয়?';

  @override
  String nsWhyReturned(String name) {
    return '$name কেন ফেরত পাঠিয়েছেন';
  }

  @override
  String get nsSaveDraft => 'খসড়া সংরক্ষণ';

  @override
  String get nsSaveChanges => 'শুধু পরিবর্তন সংরক্ষণ';

  @override
  String get nsSend => 'অনুমোদনের জন্য পাঠান';

  @override
  String get nsSendAgain => 'আবার পাঠান';

  @override
  String get nsSaved => 'সংরক্ষিত হয়েছে';

  @override
  String get nsSent => 'অনুমোদনের জন্য পাঠানো হয়েছে';

  @override
  String get nsDeleteDraft => 'খসড়া মুছুন';

  @override
  String get nsDeleteConfirm => 'এই খসড়া মুছবেন?';

  @override
  String get nsErrTitle => 'কমপক্ষে ৫ অক্ষরের শিরোনাম দিন।';

  @override
  String get nsErrSubject => 'বিষয় লিখুন।';

  @override
  String get nsErrJustification => 'কমপক্ষে ১০ অক্ষরে অনুরোধটি ব্যাখ্যা করুন।';

  @override
  String get nsErrVendor => 'সরবরাহকারীর নাম লিখুন।';

  @override
  String get nsErrPrice => 'উদ্ধৃত মূল্য লিখুন।';

  @override
  String get nsErrQuotesMin => 'কমপক্ষে ৩টি কোটেশন যোগ করুন।';

  @override
  String get nsErrQuotesPick => 'ঠিক একজন সরবরাহকারীকে সুপারিশ করুন।';

  @override
  String get nsErrQuotesNote =>
      'সুপারিশকৃত সরবরাহকারী কেন সবচেয়ে সস্তা নয়, কমপক্ষে ৩০ অক্ষরে লিখুন।';

  @override
  String get nsErrFailed => 'কাজটি হয়নি। আবার চেষ্টা করুন।';

  @override
  String get nsSignAction => 'দেখে স্বাক্ষর করুন';

  @override
  String get nsFixAndSend => 'ঠিক করে আবার পাঠান';

  @override
  String get nsEditAndSend => 'সম্পাদনা করে পাঠান';

  @override
  String get nsAddNote => 'নোট বা প্রশ্ন যোগ করুন';

  @override
  String get nsNoteAppendOnly =>
      'নোট কখনো সম্পাদনা বা মোছা যায় না। এই ফাইলের সবাই পড়তে পারবেন।';

  @override
  String get nsNoteText => 'আপনার নোট';

  @override
  String get nsNoteAdd => 'ফাইলে যোগ করুন';

  @override
  String get nsNoteAdded => 'ফাইলে যোগ হয়েছে';

  @override
  String get nsReturnTitle => 'পরিবর্তনের জন্য ফেরত পাঠান';

  @override
  String get nsRejectTitle => 'এই নোট-শিট বাতিল করুন';

  @override
  String get nsReturnedToast => 'লেখকের কাছে ফেরত পাঠানো হয়েছে';

  @override
  String get nsRejectedToast => 'বাতিল করা হয়েছে';

  @override
  String get nsWithdrawConfirm => 'এই নোট-শিট প্রত্যাহার করবেন?';

  @override
  String get nsWithdrawMessage =>
      'ফাইলটি বন্ধ হবে এবং এ পর্যন্ত স্বাক্ষর বৈধ থাকবে না।';

  @override
  String get nsWithdrawnToast => 'প্রত্যাহার করা হয়েছে';

  @override
  String get nsPrint => 'প্রিন্ট বা পিডিএফ সংরক্ষণ';

  @override
  String get nsPrintFailed => 'পিডিএফ তৈরি করা যায়নি।';

  @override
  String get nsSignTitle => 'এই নোট-শিটে স্বাক্ষর করুন';

  @override
  String nsSignIntro(String ref) {
    return 'আপনি $ref-এ স্বাক্ষর করছেন। আপনার স্বাক্ষর এখন যা দেখছেন ঠিক তার সঙ্গে যুক্ত থাকবে।';
  }

  @override
  String get nsSignTyped => 'নাম লিখুন';

  @override
  String get nsSignDrawn => 'আঁকুন';

  @override
  String get nsSignStamp => 'সিল';

  @override
  String get nsSignTypedLabel => 'আপনার পূর্ণ নাম';

  @override
  String get nsSignDrawHint => 'এখানে আপনার স্বাক্ষর আঁকুন';

  @override
  String get nsSignClear => 'মুছুন';

  @override
  String get nsSignComment => 'মন্তব্য (ঐচ্ছিক)';

  @override
  String get nsSignOtp => 'ওয়ান-টাইম কোড';

  @override
  String get nsSignOtpHelp => 'ডেমো অ্যাপ: কোডটি 123456।';

  @override
  String get nsSignConfirm => 'স্বাক্ষর করে অনুমোদন দিন';

  @override
  String get nsSignErrName => 'আপনার পূর্ণ নাম লিখুন।';

  @override
  String get nsSignErrDraw => 'আগে স্বাক্ষর আঁকুন।';

  @override
  String get nsSignErrOtp => '৬ সংখ্যার কোডটি দিন।';

  @override
  String get nsSignErrOtpWrong => 'কোডটি সঠিক নয়।';

  @override
  String get nsSignErrFailed => 'স্বাক্ষর করা যায়নি। আবার চেষ্টা করুন।';

  @override
  String get nsSignedToast =>
      'স্বাক্ষর হয়েছে। এটি পরবর্তী কর্মকর্তার কাছে যাচ্ছে।';

  @override
  String get nsSignedFinal => 'স্বাক্ষর হয়েছে। নোট-শিট সম্পূর্ণ অনুমোদিত।';
}
