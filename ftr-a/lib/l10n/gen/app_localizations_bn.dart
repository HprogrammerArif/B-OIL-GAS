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
      'অ্যাপ খুলতে একটি ডেমো ভূমিকা চাপুন। কোম্পানি সাইন ইন এখন বন্ধ।';

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
  String get navAttendance => 'হাজিরা';

  @override
  String get navApprovals => 'অনুমোদন';

  @override
  String get navChat => 'চ্যাট';

  @override
  String get homeSeeAll => 'সব দেখুন';

  @override
  String get homePrimaryEmployee => 'আজকের কাজ';

  @override
  String get homePrimaryDriver => 'আপনার যাত্রা';

  @override
  String get homePrimaryGate => 'গেটে অতিথি';

  @override
  String get homePrimaryMail => 'পার্সেল অপেক্ষায়';

  @override
  String get homePrimaryHse => 'আজকের নিরাপত্তা';

  @override
  String get homePrimaryApprover => 'আপনার সিদ্ধান্তের অপেক্ষায়';

  @override
  String get homeActPunch => 'হাজিরায় যান';

  @override
  String get homeActTrip => 'যাত্রা খুলুন';

  @override
  String get homeActScanGuest => 'অতিথি নিবন্ধন';

  @override
  String get homeActScanParcel => 'পার্সেল নথি';

  @override
  String get homeActApprovals => 'অনুমোদন খুলুন';

  @override
  String get homeActAnnounce => 'নোটিশ পাঠান';

  @override
  String get homeActIncidents => 'দুর্ঘটনা খুলুন';

  @override
  String get homeFilesWaiting => 'আপনার অপেক্ষায় ফাইল';

  @override
  String get homeFilesClear => 'কিছু অপেক্ষায় নেই। আপনি পরিষ্কার।';

  @override
  String homeFilesCount(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$countটি ফাইল আপনার অপেক্ষায়।',
      one: '১টি ফাইল আপনার অপেক্ষায়।',
      zero: 'কিছু অপেক্ষায় নেই। আপনি পরিষ্কার।',
    );
    return '$_temp0';
  }

  @override
  String homeLocksCount(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$countটি মেশিন লক-আউট।',
      one: '১টি মেশিন লক-আউট।',
      zero: 'কোনো মেশিন লক-আউট নেই।',
    );
    return '$_temp0';
  }

  @override
  String get homeLeadersOnline => 'নেতৃত্বের ঘর';

  @override
  String get homeRoomQuiet => 'নতুন বার্তা নেই';

  @override
  String homeUnread(int count) {
    return '$count নতুন';
  }

  @override
  String get homeReturnReason => 'কেন ফেরত পাঠাচ্ছেন?';

  @override
  String get homePlayBriefing => 'ব্রিফিং শুনুন';

  @override
  String homeBriefingLeft(int seconds) {
    return '$secondsসে';
  }

  @override
  String get homeToday => 'আজ';

  @override
  String get homeNotPunched => 'আপনি এখনও পাঞ্চ করেননি।';

  @override
  String homePunchedAt(String time) {
    return '$time-এ পাঞ্চ হয়েছে';
  }

  @override
  String homeLeaveLeft(String days) {
    return '$days দিন বাকি';
  }

  @override
  String get homeGatePass => 'গেট পাস চান';

  @override
  String get homeLocks => 'লক এখনও চালু';

  @override
  String get homeLocksClear => 'কোনো মেশিন লক-আউট নেই।';

  @override
  String get homeReleaseBatch => 'মুক্ত করুন';

  @override
  String get homeOpen => 'খুলুন';

  @override
  String get homeOutputTitle => 'আজকের উৎপাদন';

  @override
  String get homeOutputLine => 'রবিবার ৫,৩২০ মে.টন হয়েছে। দৈনিক লক্ষ্য ৫,০০০।';

  @override
  String get homeWeekTitle => 'এই সপ্তাহ';

  @override
  String get homeBatchTitle => 'বিটুমিন ব্যাচ প্রস্তুত';

  @override
  String get homeBatchBody =>
      'BOGCL-BIT-2026-B88 · বিটুমিন ৬০/৭০ · ২,৪০০ মেট্রিক টন। ল্যাব পরীক্ষা উত্তীর্ণ।';

  @override
  String get homeBatchDone => 'রিলিজ হয়েছে। লোডিং গেট খোলা।';

  @override
  String get busRegister => 'বাস নিবন্ধন';

  @override
  String get busReassign => 'বাস সরিয়ে দিন';

  @override
  String get busSeatMap => 'আসনের নকশা';

  @override
  String get busFieldCode => 'রুট কোড';

  @override
  String get busFieldName => 'রুটের নাম';

  @override
  String get busFieldPlate => 'বাসের নম্বর';

  @override
  String get busSaved => 'সেভ হয়েছে';

  @override
  String get busSeatRegular => 'সাধারণ';

  @override
  String get busSeatLady => 'মহিলা অগ্রাধিকার';

  @override
  String get busSeatExecutive => 'এক্সিকিউটিভ';

  @override
  String get busSeatSenior => 'সিনিয়র স্টাফ';

  @override
  String get busMarkBoarded => 'উঠেছেন চিহ্নিত করুন';

  @override
  String get busBoarded => 'উঠেছেন';

  @override
  String busSeatsFree(int count) {
    return '$count আসন খালি';
  }

  @override
  String get flRegisterCar => 'গাড়ি নিবন্ধন';

  @override
  String get flEnrolDriver => 'চালক যোগ করুন';

  @override
  String get flFieldPlate => 'নম্বর প্লেট';

  @override
  String get flFieldType => 'ট্রিপের ধরন';

  @override
  String get flFieldEmp => 'কর্মচারী কোড';

  @override
  String get flFieldDriverCode => 'চালক কোড';

  @override
  String get flSaved => 'সেভ হয়েছে';

  @override
  String get asAsk => 'যন্ত্রপাতি চান';

  @override
  String get asAskName => 'কী দরকার?';

  @override
  String get asAskWhy => 'কেন';

  @override
  String get asAskDone => 'অনুরোধ গেছে';

  @override
  String get chConfirmAck => 'এই নির্দেশ নিশ্চিত করুন';

  @override
  String get chConfirmDone => 'নির্দেশ শেষ হিসেবে চিহ্নিত করুন';

  @override
  String get chConfirmBody =>
      'এটি নির্দেশে লেখা থাকবে। এখান থেকে ফেরানো যাবে না।';

  @override
  String get moreMyWork => 'আমার কাজ';

  @override
  String get moreOperations => 'অপারেশন';

  @override
  String get moreCompany => 'কোম্পানি';

  @override
  String get moreGovernanceFinance => 'সুশাসন ও অর্থ';

  @override
  String get moreDailyWork => 'দৈনন্দিন কাজ ও মানবসম্পদ';

  @override
  String get moreTransportCommute => 'পরিবহন ও যাতায়াত';

  @override
  String get moreSiteOperations => 'সাইট অপারেশন ও নিরাপত্তা';

  @override
  String get moreSafetyAssetsComms => 'নিরাপত্তা, সম্পদ ও অভ্যন্তরীণ যোগাযোগ';

  @override
  String get moreActivePersona => 'বর্তমান ভূমিকা';

  @override
  String get moreSwitchPersona => 'চরিত্র পরিবর্তন';

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
  String get claimBankFile => 'ব্যাংক ফাইল';

  @override
  String get claimBankReady => 'আজকের ব্যাংক ট্রান্সফার';

  @override
  String get claimBankEmpty => 'পরিশোধের জন্য কিছু অপেক্ষা করছে না।';

  @override
  String get claimBankCopied => 'ব্যাংক ফাইল কপি হয়েছে।';

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
  String get nsBudgetTitle => 'বাজেট আছে কি?';

  @override
  String get nsBudgetWithin => 'বাজেটের মধ্যে';

  @override
  String get nsBudgetOver => 'বাজেটের বেশি';

  @override
  String get nsBudgetNone =>
      'এই ফাইলে বাজেটের সঙ্গে মেলানোর মতো নির্দিষ্ট অঙ্ক নেই।';

  @override
  String nsBudgetAvailable(String amount) {
    return 'প্রাপ্য $amount';
  }

  @override
  String nsBudgetRequest(String amount) {
    return 'এই আবেদন $amount';
  }

  @override
  String nsBudgetLeft(String amount) {
    return 'এরপর অবশিষ্ট $amount';
  }

  @override
  String nsBudgetShort(String amount) {
    return 'ঘাটতি $amount';
  }

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

  @override
  String get moduleParcels => 'পার্সেল';

  @override
  String get pcSend => 'পার্সেল পাঠান';

  @override
  String get pcIntro =>
      'আপনার পাঠানো, প্রাপ্ত বা দায়িত্বে থাকা পার্সেল ট্র্যাক করুন। লেবেলের নম্বর লিখে খুঁজুন।';

  @override
  String get pcSearchHint => 'খুঁজুন, অথবা PKG-2026-0001 লিখুন';

  @override
  String get pcNotFound =>
      'এই নম্বরে কোনো পার্সেল নেই, অথবা আপনি দেখতে পারেন না।';

  @override
  String get pcTabMine => 'আমার';

  @override
  String get pcTabIncoming => 'আমার জন্য';

  @override
  String get pcTabSent => 'আমার পাঠানো';

  @override
  String get pcTabCarrying => 'বহনে';

  @override
  String get pcTabSite => 'আমার সাইটের সব';

  @override
  String get pcStuckOnly => 'শুধু আটকে থাকা';

  @override
  String get pcEmpty => 'এখনো কোনো পার্সেল নেই।';

  @override
  String get pcEmptyFiltered => 'কোনো পার্সেল মেলেনি।';

  @override
  String get pcVerdictNone => 'এখন আপনার কিছু করার নেই।';

  @override
  String pcVerdictNeed(int count) {
    return 'আপনার অপেক্ষায়: $count';
  }

  @override
  String get pcConfidentialTitle => 'গোপনীয় পার্সেল';

  @override
  String pcStuckPill(int hours) {
    return '$hours ঘণ্টা আটকে';
  }

  @override
  String get pcStatusCreated => 'এখনো হস্তান্তর হয়নি';

  @override
  String get pcStatusDispatched => 'কুরিয়ারের কাছে';

  @override
  String get pcStatusInTransit => 'পথে';

  @override
  String get pcStatusAtGate => 'গেটে পৌঁছেছে';

  @override
  String get pcStatusOut => 'বিতরণে';

  @override
  String get pcStatusDelivered => 'পৌঁছে দেওয়া হয়েছে';

  @override
  String get pcStatusHeld => 'যাচাইয়ের জন্য আটকানো';

  @override
  String get pcStatusReturning => 'ফেরত যাচ্ছে';

  @override
  String get pcStatusReturned => 'ফেরত দেওয়া হয়েছে';

  @override
  String get pcStatusLost => 'হারিয়ে গেছে';

  @override
  String get pcStatusDamaged => 'ক্ষতিগ্রস্ত';

  @override
  String get pcStatusCancelled => 'বাতিল';

  @override
  String get pcCatLegal => 'আইনি নথি';

  @override
  String get pcCatSample => 'কিউসি নমুনা';

  @override
  String get pcCatSpares => 'খুচরা যন্ত্রাংশ';

  @override
  String get pcCatTender => 'দরপত্র';

  @override
  String get pcCatIt => 'আইটি সরঞ্জাম';

  @override
  String get pcCatConfidential => 'গোপনীয়';

  @override
  String get pcCatGeneral => 'সাধারণ';

  @override
  String get pcHandFragile => 'ভঙ্গুর';

  @override
  String get pcHandCold => 'ঠান্ডায় রাখুন';

  @override
  String get pcHandHazmat => 'বিপজ্জনক';

  @override
  String get pcHandUpright => 'সোজা রাখুন';

  @override
  String get pcRetTamper => 'সিল ভাঙা ছিল';

  @override
  String get pcRetDamaged => 'ভেতরের জিনিস ক্ষতিগ্রস্ত';

  @override
  String get pcRetWrong => 'ভুল নথি';

  @override
  String get pcRetRefused => 'প্রাপক নিতে চাননি';

  @override
  String get pcRetUnavailable => 'প্রাপককে পাওয়া যায়নি';

  @override
  String get pcEvCreated => 'তৈরি করা হয়েছে';

  @override
  String get pcEvHandover => 'কুরিয়ারকে দেওয়া হয়েছে';

  @override
  String get pcEvCheckpoint => 'থামার স্থান নথিভুক্ত';

  @override
  String get pcEvGateIn => 'গেটে গ্রহণ করা হয়েছে';

  @override
  String get pcEvOut => 'বিতরণে বের হয়েছে';

  @override
  String get pcEvCode => 'কোড নিশ্চিত হয়েছে';

  @override
  String get pcEvDelivered => 'পৌঁছে দেওয়া হয়েছে';

  @override
  String get pcEvProblem => 'সমস্যা জানানো হয়েছে';

  @override
  String get pcEvReturn => 'ফেরত পাঠানো শুরু';

  @override
  String get pcEvReturnCheckpoint => 'ফেরার পথে থামা';

  @override
  String get pcEvReturned => 'প্রেরকের কাছে ফেরত';

  @override
  String get pcEvException => 'হারানো বা ক্ষতিগ্রস্ত চিহ্নিত';

  @override
  String get pcEvCancelled => 'বাতিল করা হয়েছে';

  @override
  String get pcEvNote => 'মন্তব্য';

  @override
  String get pcNextDispatch => 'কুরিয়ারের হাতে দিন এবং সিল নম্বর লিখুন।';

  @override
  String get pcNextCreatedSender =>
      'মেইলরুম কুরিয়ারকে দেওয়ার অপেক্ষায়। আপনার করণীয় নেই।';

  @override
  String get pcNextCreated => 'এখনো কুরিয়ারকে দেওয়া হয়নি।';

  @override
  String get pcNextGateIn => 'পৌঁছেছে। সিল দেখে গেটে গ্রহণ করুন।';

  @override
  String get pcNextAtGateYou => 'গেটে আছে। আপনার কাছে পাঠানো হলে কোড পাবেন।';

  @override
  String get pcNextAtGate => 'গেটে আছে, প্রাপকের কাছে যাওয়ার অপেক্ষায়।';

  @override
  String get pcNextReceive =>
      'এটি আপনার কাছে আসছে। হাতে পেলে আমি পেয়েছি চাপুন, অথবা বিতরণকারীকে কোডটি বলুন।';

  @override
  String get pcNextHeldAct =>
      'সিল বা ভেতরের জিনিসে সমস্যা আছে। প্রেরকের কাছে ফেরত পাঠান।';

  @override
  String get pcNextHeld => 'সমস্যার কারণে যাচাইয়ের জন্য আটকানো।';

  @override
  String get pcNextDamagedAct => 'ক্ষতিগ্রস্ত। প্রেরকের কাছে ফেরত পাঠান।';

  @override
  String get pcNextBackYou =>
      'এটি আপনার কাছে ফেরত আসছে। হাতে পেলে আমি পেয়েছি চাপুন।';

  @override
  String get pcNextLost => 'হারিয়ে গেছে বলে চিহ্নিত। আর কিছু করার নেই।';

  @override
  String get pcNextCancelled => 'বাতিল। আর কিছু করার নেই।';

  @override
  String pcNextCarryLocal(String to) {
    return '$to-এর কাছে নিয়ে যান। পথে প্রতিটি থামার স্থান লিখুন।';
  }

  @override
  String pcNextCarry(String dest) {
    return '$dest-এ নিয়ে যান। পথে প্রতিটি থামার স্থান লিখুন।';
  }

  @override
  String pcNextComing(String courier) {
    return '$courier নিয়ে আসছেন। এখন আপনার করণীয় নেই।';
  }

  @override
  String pcNextRoad(String dest) {
    return '$dest-এর পথে।';
  }

  @override
  String pcNextBring(String to) {
    return '$to-এর কাছে বিতরণে পাঠান। তিনি একটি এককালীন কোড পাবেন।';
  }

  @override
  String pcNextAskCode(String name) {
    return '$name-এর কাছ থেকে ৬ সংখ্যার কোড নিয়ে লিখুন।';
  }

  @override
  String pcNextOut(String to) {
    return '$to-এর কাছে পৌঁছে দেওয়া হচ্ছে।';
  }

  @override
  String pcNextDelivered(String to, String date) {
    return '$date তারিখে $to-কে পৌঁছে দেওয়া হয়েছে।';
  }

  @override
  String pcNextCarryBack(String from) {
    return '$from-এর কাছে ফেরত নিয়ে যান। প্রতিটি থামার স্থান লিখুন।';
  }

  @override
  String pcNextBackSoon(String from) {
    return '$from-এর কাছে ফেরত যাচ্ছে।';
  }

  @override
  String pcNextReturned(String from) {
    return '$from-এর কাছে ফেরত দেওয়া হয়েছে।';
  }

  @override
  String get pcActDispatch => 'কুরিয়ারকে দিন';

  @override
  String get pcActCheckpoint => 'থামার স্থান লিখুন';

  @override
  String get pcActGateIn => 'গেটে গ্রহণ করুন';

  @override
  String get pcActReportProblem => 'সমস্যা জানান';

  @override
  String get pcActOut => 'বিতরণে পাঠান';

  @override
  String get pcActReceive => 'আমি পেয়েছি';

  @override
  String get pcActEnterCode => 'ডেলিভারি কোড দিন';

  @override
  String get pcActConfirmCode => 'কোড নিশ্চিত করুন';

  @override
  String get pcActReturn => 'প্রেরকের কাছে ফেরত পাঠান';

  @override
  String get pcActException => 'হারানো বা ক্ষতিগ্রস্ত চিহ্নিত করুন';

  @override
  String get pcActAddNote => 'মন্তব্য যোগ করুন';

  @override
  String get pcActResend => 'কোড আবার পাঠান';

  @override
  String get pcActEdit => 'সম্পাদনা করুন';

  @override
  String get pcActCancel => 'পার্সেল বাতিল করুন';

  @override
  String get pcActLabel => 'লেবেল প্রিন্ট করুন';

  @override
  String get pcMore => 'আরও কাজ';

  @override
  String get pcDoneProblem =>
      'সমস্যা জানানো হয়েছে। পার্সেলটি আটকে রাখা হয়েছে।';

  @override
  String get pcDoneReturn => 'এটি প্রেরকের কাছে ফেরত যাচ্ছে।';

  @override
  String get pcDoneException => 'নথিভুক্ত হয়েছে।';

  @override
  String get pcDoneNote => 'মন্তব্য যোগ হয়েছে।';

  @override
  String get pcDoneResend => 'নতুন কোড পাঠানো হয়েছে।';

  @override
  String get pcDoneCancel => 'পার্সেল বাতিল হয়েছে।';

  @override
  String get pcDoneDispatch => 'কুরিয়ারকে দেওয়া হয়েছে।';

  @override
  String get pcDoneGateIn => 'গেটে গ্রহণ করা হয়েছে।';

  @override
  String get pcDoneOut => 'বিতরণে পাঠানো হয়েছে। প্রাপক একটি কোড পেয়েছেন।';

  @override
  String get pcDoneReceive => 'গ্রহণ করা হয়েছে। ধন্যবাদ।';

  @override
  String get pcDoneVerify => 'ডেলিভারি নিশ্চিত হয়েছে।';

  @override
  String get pcDoneCheckpoint => 'থামার স্থান নথিভুক্ত হয়েছে।';

  @override
  String get pcDoneCreate => 'পার্সেল তৈরি হয়েছে।';

  @override
  String get pcDoneEdit => 'পরিবর্তন সংরক্ষিত হয়েছে।';

  @override
  String get pcCancelMessage =>
      'পার্সেলটি আর পাঠানো হবে না। এটি ফেরানো যাবে না।';

  @override
  String pcOutMessage(String name) {
    return 'ডেলিভারি নিশ্চিত করতে $name একটি ৬ সংখ্যার কোড পাবেন।';
  }

  @override
  String get pcReceiveMessage => 'পার্সেল হাতে পেলেই নিশ্চিত করুন।';

  @override
  String get pcErrOtpInvalid => 'কোডটি সঠিক নয়।';

  @override
  String get pcErrOtpExpired => 'কোডের মেয়াদ শেষ। নতুন কোড চান।';

  @override
  String get pcErrOtpLocked =>
      'অনেকবার ভুল কোড দেওয়া হয়েছে। মেইলরুমের সাহায্য নিন।';

  @override
  String get pcErrOtpRate =>
      'অনেকবার নতুন কোড চাওয়া হয়েছে। এক ঘণ্টা পরে চেষ্টা করুন।';

  @override
  String get pcErrSeal => 'সিল নম্বর লিখুন।';

  @override
  String get pcErrPhotoNeeded => 'একটি ছবি দরকার।';

  @override
  String get pcErrLostEarly =>
      '৭২ ঘণ্টা নড়াচড়া না হলে তবেই হারিয়ে গেছে চিহ্নিত করা যায়।';

  @override
  String get pcErrFlagged => 'সিলের সমস্যার কারণে এই পার্সেল আটকে আছে।';

  @override
  String get pcErrFailed => 'কিছু ভুল হয়েছে। আবার চেষ্টা করুন।';

  @override
  String get pcErrLabel => 'লেবেল তৈরি করা যায়নি।';

  @override
  String get pcErrPhotoOpen => 'ছবি খোলা যায়নি।';

  @override
  String get pcErrPhoto => 'ছবি আপলোড করা যায়নি। আবার চেষ্টা করুন।';

  @override
  String get pcErrCourier => 'একজন কুরিয়ার বেছে নিন।';

  @override
  String get pcErrLocation => 'কোথায় আছে লিখুন।';

  @override
  String get pcErrProblemNote => 'সমস্যাটি কমপক্ষে ১০ অক্ষরে লিখুন।';

  @override
  String get pcErrCode => '৬ সংখ্যার কোড লিখুন।';

  @override
  String get pcErrExceptionNote => 'কমপক্ষে ২০ অক্ষরে ব্যাখ্যা করুন।';

  @override
  String get pcErrNote => 'একটি মন্তব্য লিখুন।';

  @override
  String get pcErrDescription => 'ভেতরে কী আছে লিখুন (কমপক্ষে ৫ অক্ষর)।';

  @override
  String get pcErrRecipient => 'কে পাবেন তা বেছে নিন।';

  @override
  String get pcErrNumber => 'সঠিক সংখ্যা লিখুন।';

  @override
  String get pcErrWaybill => 'কমপক্ষে ৩ অক্ষর।';

  @override
  String get pcSheetDispatch => 'কুরিয়ারকে দিন';

  @override
  String get pcSheetDispatchHelp =>
      'কে বহন করবেন তা বেছে নিন। তাঁর নাম ট্রেইলে থাকবে।';

  @override
  String get pcSheetCheckpoint => 'থামার স্থান লিখুন';

  @override
  String get pcSheetCheckpointHelp => 'পার্সেল এখন কোথায়?';

  @override
  String get pcSheetReturnCheckpointHelp => 'ফেরার পথে পার্সেল এখন কোথায়?';

  @override
  String get pcSheetGateIn => 'গেটে গ্রহণ করুন';

  @override
  String get pcSheetGateInHelp =>
      'সিল দেখুন। সিল ভাঙা বা পার্সেল ক্ষতিগ্রস্ত হলে সুইচ বন্ধ করে জানান।';

  @override
  String get pcSheetVerify => 'ডেলিভারি কোড';

  @override
  String get pcSheetVerifyHelp => 'প্রাপকের পাওয়া ৬ সংখ্যার কোডটি চান।';

  @override
  String get pcSheetVerifyReturnHelp => 'প্রেরকের পাওয়া ৬ সংখ্যার কোডটি চান।';

  @override
  String get pcSheetFlag => 'সমস্যা জানান';

  @override
  String get pcSheetFlagHelp =>
      'কী করা হবে তা ঠিক না হওয়া পর্যন্ত পার্সেল আটকে থাকবে।';

  @override
  String get pcSheetReturn => 'ফেরত পাঠান';

  @override
  String pcSheetReturnHelp(String name) {
    return 'পার্সেলটি নতুন কোডসহ $name-এর কাছে ফেরত যাবে।';
  }

  @override
  String get pcSheetException => 'হারানো বা ক্ষতিগ্রস্ত';

  @override
  String get pcSheetExceptionHelp =>
      'পার্সেল পৌঁছে দেওয়া সম্ভব না হলেই শুধু এটি ব্যবহার করুন।';

  @override
  String get pcSheetNote => 'মন্তব্য যোগ করুন';

  @override
  String get pcSheetNoteHelp =>
      'যাঁরা এই পার্সেল দেখতে পারেন সবাই এটি পড়তে পারবেন।';

  @override
  String get pcFieldCourier => 'কুরিয়ার';

  @override
  String get pcFieldSeal => 'সিল নম্বর (ঐচ্ছিক)';

  @override
  String get pcFieldSealRequired => 'সিল নম্বর';

  @override
  String get pcSealWhy =>
      'মূল্য বা ধরনের কারণে এই পার্সেল সিল করা বাধ্যতামূলক।';

  @override
  String get pcFieldLocation => 'কোথায় আছে?';

  @override
  String get pcFieldSealIntact => 'সিল অক্ষত আছে';

  @override
  String pcSealNo(String no) {
    return 'সিল $no';
  }

  @override
  String get pcReasonSeal => 'সিল ভাঙা';

  @override
  String get pcReasonDamaged => 'ভেতরের জিনিস ক্ষতিগ্রস্ত';

  @override
  String get pcFieldCode => '৬ সংখ্যার কোড';

  @override
  String get pcFieldReceivedBy => 'যিনি গ্রহণ করেছেন (নাম, ঐচ্ছিক)';

  @override
  String get pcFieldWhatHappened => 'কী ঘটেছে';

  @override
  String get pcFieldNoteOptional => 'মন্তব্য (ঐচ্ছিক)';

  @override
  String get pcFieldNote => 'মন্তব্য';

  @override
  String get pcPhotoRequired => 'ছবি তুলুন (বাধ্যতামূলক)';

  @override
  String get pcPhotoOptional => 'ছবি যোগ করুন (ঐচ্ছিক)';

  @override
  String pcPhotoAdded(String name) {
    return 'ছবি যোগ হয়েছে: $name';
  }

  @override
  String get pcFrom => 'প্রেরক';

  @override
  String get pcTo => 'প্রাপক';

  @override
  String get pcCarriedBy => 'কুরিয়ার';

  @override
  String get pcTrail => 'কোথায় কোথায় ছিল';

  @override
  String pcReturnLine(String no, String reason) {
    return 'ফেরত $no: $reason';
  }

  @override
  String get pcViewPhoto => 'ছবি দেখুন';

  @override
  String get pcDetCategory => 'ধরন';

  @override
  String get pcDetWaybill => 'ওয়েবিল';

  @override
  String get pcDetSeal => 'সিল';

  @override
  String get pcDetValue => 'ঘোষিত মূল্য';

  @override
  String get pcDetWeight => 'ওজন';

  @override
  String get pcDetHandling => 'হ্যান্ডলিং';

  @override
  String get pcDetTrail => 'ট্রেইল যাচাই';

  @override
  String get pcSealBroken => 'ভাঙা বলে জানানো হয়েছে';

  @override
  String get pcChainOk => 'ফিঙ্গারপ্রিন্ট মিলেছে। ট্রেইল কেউ বদলায়নি।';

  @override
  String get pcChainBroken => 'ফিঙ্গারপ্রিন্ট মেলেনি। ট্রেইল বদলানো হয়েছে।';

  @override
  String get pcEditTitle => 'পার্সেল সম্পাদনা';

  @override
  String get pcFormIntro =>
      'কে পাবেন এবং এটি কী তা লিখুন। মেইলরুম কুরিয়ারকে দেবে, আর প্রাপক ডেলিভারি নিশ্চিত করতে একটি কোড পাবেন।';

  @override
  String get pcFieldRecipient => 'কে গ্রহণ করবেন';

  @override
  String get pcPickRecipient => 'একজন সহকর্মী বেছে নিন';

  @override
  String get pcFieldCategory => 'পার্সেলের ধরন';

  @override
  String get pcFieldDescription => 'ভেতরে কী আছে';

  @override
  String get pcFieldUrgency => 'কত জরুরি';

  @override
  String get pcUrgNormal => 'সাধারণ';

  @override
  String get pcFieldValue => 'টাকায় মূল্য (ঐচ্ছিক)';

  @override
  String get pcValueHelp =>
      '৳৫০,০০০-এর বেশি হলে ডেলিভারিতে ছবি লাগবে। ৳১,০০,০০০-এর বেশি হলে সিল করতে হবে।';

  @override
  String get pcFieldWeight => 'কেজিতে ওজন (ঐচ্ছিক)';

  @override
  String get pcFieldWaybill => 'কুরিয়ার ওয়েবিল (ঐচ্ছিক)';

  @override
  String get pcFieldHandling => 'বিশেষ হ্যান্ডলিং';

  @override
  String get pcFieldConfidential => 'গোপনীয়';

  @override
  String get pcConfidentialAuto => 'এই ধরনের পার্সেল সবসময় গোপনীয়।';

  @override
  String get pcConfidentialHelp =>
      'যাঁরা শুধু বহন করেন তাঁদের কাছ থেকে ভেতরের বিবরণ লুকিয়ে রাখে।';

  @override
  String get pcSaveChanges => 'পরিবর্তন সংরক্ষণ করুন';

  @override
  String get pcCreate => 'পার্সেল তৈরি করুন';

  @override
  String get peopleSearchHint => 'নাম, পদবি বা বিভাগ দিয়ে খুঁজুন';

  @override
  String get peopleNone => 'কাউকে পাওয়া যায়নি।';

  @override
  String get moduleVisitors => 'অতিথি';

  @override
  String get visNew => 'অতিথি নিবন্ধন';

  @override
  String get visIntro =>
      'যাঁরা আপনার সাথে দেখা করতে আসছেন, গেটে আছেন, অথবা এখনো ভিতরে আছেন।';

  @override
  String get visSearchHint => 'নাম, VIS-2026-0001 বা নম্বরপ্লেট দিয়ে খুঁজুন';

  @override
  String get visNotFound => 'এই নম্বরে কোনো সফর নেই, অথবা আপনি দেখতে পারেন না।';

  @override
  String get visScanNeedGate => 'শুধু গেট পাস স্ক্যান করতে পারে।';

  @override
  String get visTabMine => 'আমার';

  @override
  String get visTabExpected => 'আজকের প্রত্যাশিত';

  @override
  String get visTabInside => 'এখন ভিতরে';

  @override
  String get visTabOverdue => 'সময় পেরিয়ে গেছে';

  @override
  String get visTabApprove => 'আপনার অনুমোদন';

  @override
  String get visTabAll => 'আমি যা দেখতে পারি';

  @override
  String get visEmpty => 'এখনো কোনো অতিথি নেই।';

  @override
  String get visEmptyFiltered => 'কোনো অতিথি মেলেনি।';

  @override
  String get visVerdictNone => 'এখন আপনার কিছু করার নেই।';

  @override
  String visVerdictNeed(int count) {
    return 'আপনার অপেক্ষায়: $count';
  }

  @override
  String get visStatusWaiting => 'অনুমোদনের অপেক্ষায়';

  @override
  String get visStatusExpected => 'পাস প্রস্তুত';

  @override
  String get visStatusInside => 'ভিতরে আছেন';

  @override
  String get visStatusOverdue => 'সময় পেরিয়ে গেছে';

  @override
  String get visStatusDone => 'চলে গেছেন';

  @override
  String get visStatusDenied => 'অনুমোদিত হয়নি';

  @override
  String get visStatusCancelled => 'বাতিল';

  @override
  String get visCatVip => 'ভিআইপি';

  @override
  String get visCatGovt => 'সরকারি';

  @override
  String get visCatVendor => 'ভেন্ডর';

  @override
  String get visCatClient => 'ক্লায়েন্ট';

  @override
  String get visCatContractor => 'কন্ট্রাক্টর';

  @override
  String get visCatRegular => 'অতিথি';

  @override
  String get visNextWatchlist =>
      'নামটি নজরতালিকায় মিলেছে। খালাস করুন অথবা সফর বাতিল করুন।';

  @override
  String get visNextWatchlistWait =>
      'নজরতালিকা যাচাইয়ের জন্য আটকানো। আপনার করণীয় নেই।';

  @override
  String visNextApprove(String name) {
    return '$name-এর সফর অনুমোদন করুন।';
  }

  @override
  String get visNextHostWait =>
      'সাইট প্রধানের অনুমোদনের অপেক্ষায়। আপনার করণীয় নেই।';

  @override
  String get visNextWaiting => 'অনুমোদনের অপেক্ষায়।';

  @override
  String get visNextPpe => 'পিপিই দেখে তারপর গেটে গ্রহণ করুন।';

  @override
  String get visNextEscort => 'লাল এলাকায় সঙ্গে থাকার জন্য কাউকে নিয়োগ করুন।';

  @override
  String visNextCheckIn(String name) {
    return 'গেটে $name-কে গ্রহণ করুন। একটি ছবি তুলুন।';
  }

  @override
  String visNextHostReady(String when) {
    return 'পাস প্রস্তুত। তাঁরা $when আসবেন। আপনার করণীয় নেই।';
  }

  @override
  String visNextReady(String when) {
    return 'পাস প্রস্তুত। প্রত্যাশিত সময় $when।';
  }

  @override
  String visNextCheckOut(String name) {
    return '$name-কে বের করে ব্যাজ ফেরত নিন।';
  }

  @override
  String get visNextInsideHost =>
      'তাঁরা ভিতরে আছেন। তাঁরা না যাওয়া পর্যন্ত যোগাযোগ রাখুন।';

  @override
  String get visNextInside => 'সাইটের ভিতরে আছেন।';

  @override
  String get visNextOverdueAct =>
      'তাঁরা অতিরিক্ত সময় ধরে আছেন। সময় বাড়ান অথবা বের করে দিন।';

  @override
  String get visNextOverdue => 'সম্মত সময় পেরিয়ে গেছে।';

  @override
  String get visNextDone => 'তাঁরা চলে গেছেন।';

  @override
  String get visNextDenied => 'এই সফর অনুমোদিত হয়নি।';

  @override
  String get visNextCancelled => 'বাতিল। আর কিছু করার নেই।';

  @override
  String get visWatchPill => 'নজরতালিকা';

  @override
  String visHostLine(String name, String site) {
    return 'আয়োজক: $name, $site';
  }

  @override
  String visWhenLine(String start, String end) {
    return 'প্রত্যাশিত $start থেকে $end';
  }

  @override
  String visEscortLine(String name) {
    return 'সঙ্গী: $name';
  }

  @override
  String visBadgeLine(String no) {
    return 'ব্যাজ $no';
  }

  @override
  String get visZones => 'যে এলাকায় যেতে পারবেন';

  @override
  String get visEscortNeed => 'সঙ্গী দরকার';

  @override
  String get visFindings => 'যা দেখা গেছে';

  @override
  String get visDetPhone => 'ফোন';

  @override
  String get visDetId => 'পরিচয়পত্র';

  @override
  String get visDetPlate => 'গাড়ি';

  @override
  String get visPpeOk => 'গেটে পিপিই যাচাই হয়েছে।';

  @override
  String get visPpeNeeded => 'প্রবেশের আগে পিপিই যাচাই করতে হবে।';

  @override
  String get visPpeNone => 'এই এলাকায় বিশেষ পিপিই লাগবে না।';

  @override
  String get visActApprove => 'সফর অনুমোদন করুন';

  @override
  String get visActDeny => 'অনুমোদন করবেন না';

  @override
  String get visActCancel => 'সফর বাতিল করুন';

  @override
  String get visActCheckIn => 'গেটে গ্রহণ করুন';

  @override
  String get visActCheckOut => 'বের করে দিন';

  @override
  String get visActPpe => 'পিপিই যাচাই করুন';

  @override
  String get visActEscort => 'সঙ্গী নিয়োগ করুন';

  @override
  String get visActExtend => 'আরও দুই ঘণ্টা দিন';

  @override
  String get visActFinding => 'পর্যবেক্ষণ যোগ করুন';

  @override
  String get visActClearWatch => 'নজরতালিকা খালাস করুন';

  @override
  String get visActSafe => 'নিরাপদ চিহ্নিত করুন';

  @override
  String get visActPass => 'পাস দেখুন';

  @override
  String get visApproveMsg => 'তাঁরা একটি পাস পাবেন এবং গেটে গ্রহণ করা যাবে।';

  @override
  String get visCheckOutMsg =>
      'তাঁরা চলে গেলে এবং ব্যাজ ফেরত এলেই নিশ্চিত করুন।';

  @override
  String get visFieldReason => 'কারণ';

  @override
  String get visSheetCheckIn => 'গেটে গ্রহণ করুন';

  @override
  String get visSheetCheckInHelp =>
      'একটি ছবি তুলুন। ব্যাজ নম্বর আপনাআপনি দেওয়া হবে।';

  @override
  String get visPhotoRequired => 'ছবি তুলুন (বাধ্যতামূলক)';

  @override
  String get visPhotoAdded => 'ছবি যোগ হয়েছে';

  @override
  String get visFieldNda => 'এনডিএ স্বাক্ষরিত';

  @override
  String get visFieldBriefing => 'নিরাপত্তা ব্রিফিং হয়েছে';

  @override
  String get visSheetPpe => 'ব্যক্তিগত সুরক্ষা সরঞ্জাম';

  @override
  String get visSheetPpeHelp =>
      'যা পরছেন এবং যা বলা হয়েছে শুধু সেগুলোতে টিক দিন।';

  @override
  String get visPpeHat => 'হেলমেট';

  @override
  String get visPpeShoes => 'সেফটি জুতা';

  @override
  String get visPpeVest => 'হাই-ভিজ ভেস্ট';

  @override
  String get visPpeGoggles => 'গগলস';

  @override
  String get visPpeH2s => 'এইচটুএস ব্রিফিং';

  @override
  String get visFieldEscort => 'কে সঙ্গে থাকবেন';

  @override
  String get visSheetFinding => 'কী দেখেছেন';

  @override
  String get visFieldArea => 'কোথায়';

  @override
  String get visFieldFinding => 'কী ঘটেছে';

  @override
  String get visFindObs => 'মন্তব্য';

  @override
  String get visFindCrit => 'গুরুতর';

  @override
  String get visDoneCheckIn => 'গেটে গ্রহণ করা হয়েছে।';

  @override
  String get visDoneCheckOut => 'বের করে দেওয়া হয়েছে।';

  @override
  String get visDonePpe => 'পিপিই নথিভুক্ত হয়েছে।';

  @override
  String get visDoneEscort => 'সঙ্গী নিয়োগ হয়েছে।';

  @override
  String get visDoneExtend => 'আরও দুই ঘণ্টা দেওয়া হয়েছে।';

  @override
  String get visDoneFinding => 'পর্যবেক্ষণ নথিভুক্ত হয়েছে।';

  @override
  String get visDoneWatch => 'নজরতালিকা খালাস হয়েছে।';

  @override
  String get visDoneSafe => 'নিরাপদ চিহ্নিত হয়েছে।';

  @override
  String get visDoneApprove => 'সফর অনুমোদিত। পাস প্রস্তুত।';

  @override
  String get visDoneDeny => 'সফর অনুমোদিত হয়নি।';

  @override
  String get visDoneCancel => 'সফর বাতিল হয়েছে।';

  @override
  String get visDoneCreate => 'অতিথি নিবন্ধিত হয়েছে।';

  @override
  String get visErrPpe => 'প্রবেশের আগে পিপিই যাচাই করুন।';

  @override
  String get visErrEscort => 'লাল এলাকায় একজন সঙ্গী দরকার।';

  @override
  String get visErrWatchlist => 'আগে নিরাপত্তাকে নজরতালিকা খালাস করতে হবে।';

  @override
  String get visErrBlacklist => 'এই ব্যক্তিকে নিবন্ধন বা প্রবেশ করানো যাবে না।';

  @override
  String get visErrFull => 'ভিতরে অতিথি বেশি। নিরাপত্তা প্রধানকে বলুন।';

  @override
  String get visErrExtend => 'আজ ইতিমধ্যে দুবার সময় বাড়ানো হয়েছে।';

  @override
  String get visErrFailed => 'কিছু ভুল হয়েছে। আবার চেষ্টা করুন।';

  @override
  String get visErrName => 'অতিথির নাম লিখুন।';

  @override
  String get visErrPhone => 'ফোন নম্বর লিখুন।';

  @override
  String get visErrPurpose => 'কেন আসছেন তা লিখুন।';

  @override
  String get visErrId => 'এই ধরনের অতিথির পরিচয়পত্র নম্বর দরকার।';

  @override
  String get visFormIntro =>
      'কে আসছেন, কেন, এবং কোন এলাকায় যেতে পারবেন তা লিখুন। সাধারণ অতিথি সাথে সাথে পাস পান। ভিআইপি, সরকারি এবং লাল এলাকার সফর সাইট প্রধানের অপেক্ষায় থাকে।';

  @override
  String get visFieldName => 'অতিথির নাম';

  @override
  String get visFieldOrg => 'প্রতিষ্ঠান (ঐচ্ছিক)';

  @override
  String get visFieldPhone => 'ফোন';

  @override
  String get visFieldCategory => 'তাঁরা কে';

  @override
  String get visFieldPurpose => 'কেন আসছেন';

  @override
  String get visFieldWhen => 'কখন আসবেন';

  @override
  String get visFieldSite => 'কোন সাইট';

  @override
  String get visSiteHq => 'প্রধান কার্যালয়, বারিধারা';

  @override
  String get visSitePlant => 'কেরানীগঞ্জ প্ল্যান্ট';

  @override
  String get visSiteCtg => 'চট্টগ্রাম টার্মিনাল';

  @override
  String get visFieldZones => 'যে এলাকায় যেতে পারবেন';

  @override
  String get visFieldIdType => 'পরিচয়পত্রের ধরন';

  @override
  String get visIdNid => 'জাতীয় পরিচয়পত্র';

  @override
  String get visIdPass => 'পাসপোর্ট';

  @override
  String get visIdGovt => 'সরকারি ব্যাজ';

  @override
  String get visIdCo => 'কোম্পানি আইডি';

  @override
  String get visFieldIdNo => 'পরিচয়পত্র নম্বর';

  @override
  String get visFieldPlate => 'গাড়ির নম্বর (ঐচ্ছিক)';

  @override
  String get visCreate => 'অতিথি নিবন্ধন করুন';

  @override
  String get visMuster => 'কে কে ভিতরে আছেন';

  @override
  String visMusterIdle(int count) {
    return '$count জন অতিথি ভিতরে আছেন। হিসাব করতে হলে হাজিরা শুরু করুন।';
  }

  @override
  String visMusterActive(int safe, int inside) {
    return 'হাজিরা চলছে: $inside-এর মধ্যে $safe জন নিরাপদ।';
  }

  @override
  String get visMusterStart => 'হাজিরা শুরু করুন';

  @override
  String get visMusterEnd => 'হাজিরা শেষ করুন';

  @override
  String get visMusterMissing => 'এখনো নিরাপদ নন';

  @override
  String get visMusterSafe => 'নিরাপদ';

  @override
  String get moduleFleet => 'গাড়ি';

  @override
  String get flIntro =>
      'গাড়ি চান, একটি বরাদ্দ করুন, অথবা ট্রিপ চালান। পরবর্তী কাজ প্রতিটি সারিতে আছে।';

  @override
  String get flNew => 'গাড়ি চান';

  @override
  String get flSearchHint => 'গন্তব্য বা কারণ খুঁজুন';

  @override
  String get flSos => 'চালকের সাহায্য';

  @override
  String get flTabMine => 'আমার';

  @override
  String get flTabDriving => 'আমার ট্রিপ';

  @override
  String get flTabEndorse => 'আপনার অপেক্ষায়';

  @override
  String get flTabDispatch => 'বরাদ্দ করতে';

  @override
  String get flTabLive => 'পথে';

  @override
  String get flTabAll => 'সব';

  @override
  String get flEmpty => 'এখানে কোনো গাড়ির আবেদন নেই।';

  @override
  String get flEmptyFiltered => 'এই খোঁজার সাথে কিছু মেলেনি।';

  @override
  String get flVerdictNone => 'আপনার করার কিছু নেই।';

  @override
  String flVerdictNeed(int count) {
    return 'আপনার জন্য $countটি অপেক্ষা করছে';
  }

  @override
  String get flStatusDraft => 'খসড়া';

  @override
  String get flStatusPending => 'বিভাগীয় প্রধানের অপেক্ষায়';

  @override
  String get flStatusApproved => 'গাড়ির অপেক্ষায়';

  @override
  String get flStatusAssigned => 'গাড়ি বরাদ্দ';

  @override
  String get flStatusLive => 'পথে';

  @override
  String get flStatusDone => 'শেষ';

  @override
  String get flStatusRejected => 'অনুমোদিত হয়নি';

  @override
  String get flStatusCancelled => 'বাতিল';

  @override
  String get flNextSubmit => 'এই আবেদন বিভাগীয় প্রধানের কাছে পাঠান।';

  @override
  String get flNextWaitHod => 'ফরিদা বেগমের অপেক্ষায়। আপনার করার কিছু নেই।';

  @override
  String flNextEndorse(String name) {
    return '$name-এর আবেদন অনুমোদন করুন, অথবা অনুমোদন কেন্দ্র থেকে ফেরত পাঠান।';
  }

  @override
  String get flNextAssign => 'একটি খালি গাড়ি ও চালক বেছে নিন।';

  @override
  String get flNextWaitCar => 'পরিবহন একটি গাড়ি দেবে। আপনার করার কিছু নেই।';

  @override
  String flNextGateOut(String when) {
    return '$when এর পর গেট দিয়ে বেরোন।';
  }

  @override
  String flNextAssigned(String plate) {
    return '$plate গেটে অপেক্ষা করছে।';
  }

  @override
  String get flNextFinish => 'ফিরে এসে শেষ ওডোমিটার লিখুন।';

  @override
  String flNextLive(String plate) {
    return '$plate পথে আছে।';
  }

  @override
  String get flNextRate => 'এই ট্রিপ রেটিং দিন।';

  @override
  String get flNextDone => 'এই ট্রিপ শেষ।';

  @override
  String get flNextFix => 'আবেদন ঠিক করে আবার পাঠান।';

  @override
  String get flNextRejected => 'এই আবেদন অনুমোদিত হয়নি।';

  @override
  String get flNextCancelled => 'এই আবেদন বাতিল হয়েছে।';

  @override
  String get flTypeOne => 'একমুখী';

  @override
  String get flTypeRound => 'যাতায়াত';

  @override
  String get flFormIntro =>
      'কোথায় যাবেন, কেন, এবং কখন তা লিখুন। বিভাগীয় প্রধান অনুমোদন করবেন। তারপর পরিবহন একটি গাড়ি দেবে।';

  @override
  String get flFieldPurpose => 'কেন গাড়ি দরকার';

  @override
  String get flFieldDest => 'কোথায় যাবেন';

  @override
  String get flFieldPax => 'কতজন যাবেন';

  @override
  String get flFieldWhen => 'কখন বেরোবেন';

  @override
  String get flFieldNote => 'কী হয়েছে';

  @override
  String get flFieldNoteOpt => 'নোট (ঐচ্ছিক)';

  @override
  String get flFieldOdo => 'ওডোমিটার (কিমি)';

  @override
  String get flFieldSos => 'কী সমস্যা';

  @override
  String get flFieldPlaza => 'টোল প্লাজা';

  @override
  String get flFieldAmount => 'পরিমাণ (৳)';

  @override
  String get flFieldFeedback => 'ট্রিপ কেমন ছিল (ঐচ্ছিক)';

  @override
  String get flFieldRating => 'স্টার (১ থেকে ৫)';

  @override
  String get flFieldReason => 'কারণ';

  @override
  String get flCreate => 'আবেদন পাঠান';

  @override
  String flEstimate(String km, int minutes, String cost, String cls) {
    return 'প্রায় $km কিমি, $minutes মিনিট, $cost। পরামর্শ: $cls।';
  }

  @override
  String get flWhat => 'এটি কী';

  @override
  String flWho(String name, String when) {
    return '$when-এ $name চেয়েছেন।';
  }

  @override
  String flMeta(String when, String pax, String cls, String cost) {
    return '$when-এ বেরোবে। $pax জন। $cls। প্রায় $cost।';
  }

  @override
  String flAssigned(String plate, String driver) {
    return 'গাড়ি $plate, চালক $driver।';
  }

  @override
  String flPassNo(String pass) {
    return 'গেট পাস $pass';
  }

  @override
  String get flActAssign => 'গাড়ি বরাদ্দ করুন';

  @override
  String get flActGateOut => 'গেট দিয়ে বেরোন';

  @override
  String get flActCheckpoint => 'একটি স্টপ লিখুন';

  @override
  String get flActComplete => 'ট্রিপ শেষ করুন';

  @override
  String get flActSos => 'সাহায্য লাগবে';

  @override
  String get flActToll => 'টোল যোগ করুন';

  @override
  String get flActRate => 'ট্রিপ রেটিং দিন';

  @override
  String get flActCancel => 'বাতিল';

  @override
  String get flActPass => 'গেট পাস দেখুন';

  @override
  String get flActTollOk => 'অনুমোদন';

  @override
  String get flActTollPay => 'পরিশোধ চিহ্নিত করুন';

  @override
  String get flActAck => 'আমরা আসছি';

  @override
  String get flSheetAssign => 'গাড়ি ও চালক বরাদ্দ করুন';

  @override
  String get flSheetAssignHelp =>
      'শুধু খালি এবং বৈধ কাগজপত্রের গাড়ি দেখানো হয়েছে।';

  @override
  String get flDoneCreate => 'আবেদন বিভাগীয় প্রধানের কাছে পাঠানো হয়েছে।';

  @override
  String get flDoneAssign => 'গাড়ি বরাদ্দ হয়েছে। চালককে জানানো হয়েছে।';

  @override
  String get flDoneGateOut => 'ট্রিপ শুরু হয়েছে।';

  @override
  String get flDoneCheckpoint => 'স্টপ নথিভুক্ত হয়েছে।';

  @override
  String get flDoneComplete => 'ট্রিপ শেষ।';

  @override
  String get flDoneSos => 'সাহায্যের অনুরোধ পাঠানো হয়েছে।';

  @override
  String get flDoneToll => 'টোল পর্যালোচনার জন্য পাঠানো হয়েছে।';

  @override
  String get flDoneRate => 'রেটিং দেওয়ার জন্য ধন্যবাদ।';

  @override
  String get flDoneCancel => 'আবেদন বাতিল হয়েছে।';

  @override
  String get flDoneTollOk => 'টোল অনুমোদিত।';

  @override
  String get flDoneTollPay => 'টোল পরিশোধ চিহ্নিত।';

  @override
  String get flDoneAck => 'চালককে জানানো হয়েছে সাহায্য আসছে।';

  @override
  String get flErrPurpose => 'কেন গাড়ি দরকার তা লিখুন।';

  @override
  String get flErrLead => 'কমপক্ষে এক ঘণ্টা আগে চান, জরুরি না হলে।';

  @override
  String get flErrFailed => 'কিছু ভুল হয়েছে। আবার চেষ্টা করুন।';

  @override
  String get flErrWindow => 'খুব তাড়াতাড়ি বা দেরি। পরিবহনকে বলুন।';

  @override
  String get flErrVehicle => 'সেই গাড়ি খালি নয় বা কাগজপত্র মেয়াদোত্তীর্ণ।';

  @override
  String get flErrDriver => 'সেই চালক এই ট্রিপ নিতে পারবেন না।';

  @override
  String get flErrNoneFree => 'এই ট্রিপের জন্য কোনো খালি গাড়ি ও চালক নেই।';

  @override
  String get flTolls => 'টোল';

  @override
  String get flTimeline => 'কী হয়েছে';

  @override
  String get flSosIntro =>
      'চালকদের খোলা অনুরোধ। পরিবহন ও গেট সেগুলো স্বীকার করে।';

  @override
  String get flSosEmpty => 'কোনো সাহায্যের অনুরোধ নেই।';

  @override
  String get flSosHelp =>
      'আপনি কোথায় এবং কী সমস্যা তা লিখুন। পরিবহন ও গেট সাথে সাথে দেখবে।';

  @override
  String get flSosOpen => 'খোলা';

  @override
  String get flSosAcked => 'সাহায্য আসছে';

  @override
  String get moduleIncidents => 'নিরাপত্তা';

  @override
  String get inIntro =>
      'যা দেখেছেন রিপোর্ট করুন। নিরাপত্তা দল যাচাই করবে, কারণ খুঁজবে এবং সংশোধন ধরবে।';

  @override
  String get inNew => 'কী হয়েছে রিপোর্ট করুন';

  @override
  String get inSearchHint => 'শিরোনাম বা জায়গা খুঁজুন';

  @override
  String get inTabMine => 'আমার';

  @override
  String get inTabTriage => 'আপনার অপেক্ষায়';

  @override
  String get inTabOpen => 'এখনো খোলা';

  @override
  String get inTabSerious => 'গুরুতর';

  @override
  String get inTabStatutory => 'সরকারি রিপোর্ট';

  @override
  String get inTabCapa => 'আমার সংশোধন';

  @override
  String get inTabAll => 'সব';

  @override
  String get inEmpty => 'এখানে কোনো নিরাপত্তা রিপোর্ট নেই।';

  @override
  String get inEmptyFiltered => 'এই খোঁজার সাথে কিছু মেলেনি।';

  @override
  String get inVerdictNone => 'আপনার করার কিছু নেই।';

  @override
  String inVerdictNeed(int count) {
    return 'আপনার জন্য $countটি অপেক্ষা করছে';
  }

  @override
  String get inTypeNear => 'নিয়ার মিস';

  @override
  String get inTypeHazard => 'অনিরাপদ অবস্থা';

  @override
  String get inTypeMedical => 'চিকিৎসা';

  @override
  String get inTypeLost => 'কর্মবিরতি আঘাত';

  @override
  String get inTypeSpill => 'নিঃসরণ বা লিক';

  @override
  String get inTypeFire => 'আগুন বা তাপ';

  @override
  String get inTypeEquip => 'যন্ত্রের ক্ষতি';

  @override
  String get inTypeVehicle => 'গাড়ি দুর্ঘটনা';

  @override
  String get inTypeEnv => 'পরিবেশগত';

  @override
  String get inTypePipe => 'চাপ বা পাইপ';

  @override
  String get inTypeFatal => 'মৃত্যু';

  @override
  String get inStageReported => 'নিরাপত্তার অপেক্ষায়';

  @override
  String get inStageTriaged => 'বরাদ্দ';

  @override
  String get inStageInvest => 'কারণ খোঁজা হচ্ছে';

  @override
  String get inStageCapa => 'সংশোধন চলছে';

  @override
  String get inStageReview => 'বন্ধের অপেক্ষায়';

  @override
  String get inStageClosed => 'বন্ধ';

  @override
  String get inRiskLow => 'কম ঝুঁকি';

  @override
  String get inRiskMedium => 'মাঝারি ঝুঁকি';

  @override
  String get inRiskHigh => 'উচ্চ ঝুঁকি';

  @override
  String get inRiskExtreme => 'চরম ঝুঁকি';

  @override
  String inRiskLine(int score, String label) {
    return 'স্কোর $score · $label';
  }

  @override
  String get inAnonymous => 'যিনি নাম না দিতে চেয়েছেন';

  @override
  String inNextTriage(String name) {
    return '$name-এর রিপোর্ট কতটা গুরুতর তা ঠিক করুন এবং তদন্তকারী নাম করুন।';
  }

  @override
  String get inNextWaitHse =>
      'প্ল্যান্ট নিরাপত্তা প্রধানের অপেক্ষায়। আপনার করার কিছু নেই।';

  @override
  String get inNextReported => 'নিরাপত্তা দলের অপেক্ষায়।';

  @override
  String get inNextStart => 'তদন্ত শুরু করুন।';

  @override
  String get inNextTriaged => 'একজন তদন্তকারী নাম করা হয়েছে।';

  @override
  String get inNextRca => 'তিনটি কেন এবং মূল কারণ লিখুন।';

  @override
  String get inNextInvest => 'কারণ খোঁজা হচ্ছে।';

  @override
  String get inNextMyCapa => 'আপনাকে দেওয়া সংশোধন করুন।';

  @override
  String get inNextVerify => 'একটি শেষ সংশোধন নিশ্চিত করুন।';

  @override
  String get inNextReview => 'সব সংশোধন শেষ। বন্ধের জন্য পাঠান।';

  @override
  String get inNextCapa => 'সংশোধন এখনো খোলা।';

  @override
  String get inNextSignSafety => 'নিরাপত্তা প্রধান হিসেবে স্বাক্ষর করুন।';

  @override
  String get inNextSignGm => 'প্ল্যান্ট প্রধান হিসেবে স্বাক্ষর করে বন্ধ করুন।';

  @override
  String get inNextReviewWait => 'প্ল্যান্ট প্রধানের বন্ধের অপেক্ষায়।';

  @override
  String get inNextClosed => 'এই রিপোর্ট বন্ধ।';

  @override
  String get inFormIntro =>
      'কী হয়েছে, কোথায়, এবং কতটা খারাপ হতে পারত তা লিখুন। নিরাপত্তা সাথে সাথে দেখবে। আপনি নাম লুকাতে পারেন।';

  @override
  String get inFieldType => 'কী ধরনের ঘটনা';

  @override
  String get inFieldTitle => 'ছোট শিরোনাম';

  @override
  String get inFieldDesc => 'যা দেখেছেন';

  @override
  String get inFieldSite => 'কোন সাইট';

  @override
  String get inFieldZone => 'কোন এলাকা';

  @override
  String get inFieldWhen => 'কখন হয়েছে';

  @override
  String inFieldSev(int n) {
    return 'আবার হলে কতটা খারাপ: $n';
  }

  @override
  String inFieldLike(int n) {
    return 'আবার হওয়ার সম্ভাবনা: $n';
  }

  @override
  String get inFieldAnon => 'আমার নাম লুকান';

  @override
  String get inFieldAnonHelp =>
      'নিরাপত্তা রিপোর্ট দেখবে। অন্যরা আপনার নাম দেখবে না।';

  @override
  String get inCreate => 'রিপোর্ট পাঠান';

  @override
  String get inConfirmSerious => 'এতে প্ল্যান্ট প্রধানকে এখনই জানানো হবে';

  @override
  String get inConfirmSeriousMsg =>
      'উচ্চ বা চরম স্কোর নিরাপত্তা প্রধান ও চেয়ারম্যানকে সাথে সাথে জানায়।';

  @override
  String get inWhat => 'এটি কী';

  @override
  String inWho(String name, String when) {
    return '$when-এ $name রিপোর্ট করেছেন।';
  }

  @override
  String inMeta(String when, String site, String zone, String score) {
    return '$when-এ $site, $zone-এ হয়েছে। ঝুঁকি স্কোর $score।';
  }

  @override
  String inInvestigator(String name) {
    return 'তদন্তকারী: $name';
  }

  @override
  String inStatutoryDue(String body, String when) {
    return '$when-এর মধ্যে $body-কে জানাতে হবে।';
  }

  @override
  String inStatutoryDone(String receipt) {
    return '$receipt হিসেবে দাখিল হয়েছে।';
  }

  @override
  String get inActTriage => 'যাচাই করুন';

  @override
  String get inActInvest => 'তদন্ত শুরু করুন';

  @override
  String get inActRca => 'কারণ লিখুন';

  @override
  String get inActCapa => 'সংশোধন যোগ করুন';

  @override
  String get inActStatutory => 'সরকারি দাখিল নথিভুক্ত করুন';

  @override
  String get inActSignSafety => 'নিরাপত্তা হিসেবে স্বাক্ষর';

  @override
  String get inActSignGm => 'প্ল্যান্ট প্রধান হিসেবে বন্ধ করুন';

  @override
  String get inActStart => 'শুরু';

  @override
  String get inActComplete => 'শেষ';

  @override
  String get inActVerify => 'নিশ্চিত';

  @override
  String get inFieldInvestigator => 'কে তদন্ত করবেন';

  @override
  String get inFieldOwner => 'কে সংশোধন করবেন';

  @override
  String get inFieldWhy1 => 'কেন ১';

  @override
  String get inFieldWhy2 => 'কেন ২';

  @override
  String get inFieldWhy3 => 'কেন ৩';

  @override
  String get inFieldRoot => 'মূল কারণ';

  @override
  String get inFieldCapa => 'কী ঠিক করতে হবে';

  @override
  String get inFieldReceipt => 'রসিদ বা ডায়েরি নম্বর';

  @override
  String get inFieldEvidence => 'আপনি কী করেছেন';

  @override
  String get inRca => 'মূল কারণ';

  @override
  String get inFixes => 'সংশোধন';

  @override
  String get inDoneCreate => 'রিপোর্ট নিরাপত্তা দলের কাছে পাঠানো হয়েছে।';

  @override
  String get inDoneTriage => 'তদন্তকারী নাম করা হয়েছে।';

  @override
  String get inDoneInvest => 'তদন্ত শুরু হয়েছে।';

  @override
  String get inDoneRca => 'মূল কারণ নথিভুক্ত হয়েছে।';

  @override
  String get inDoneCapa => 'সংশোধন বরাদ্দ হয়েছে।';

  @override
  String get inDoneStatutory => 'দাখিল নথিভুক্ত হয়েছে।';

  @override
  String get inDoneSignSafety => 'নিরাপত্তা স্বাক্ষর নথিভুক্ত হয়েছে।';

  @override
  String get inDoneSignGm => 'রিপোর্ট বন্ধ হয়েছে।';

  @override
  String get inDoneStart => 'সংশোধন শুরু হয়েছে।';

  @override
  String get inDoneComplete => 'সংশোধন শেষ চিহ্নিত।';

  @override
  String get inDoneVerify => 'সংশোধন নিশ্চিত হয়েছে।';

  @override
  String get inErrTitle => 'একটি ছোট শিরোনাম লিখুন।';

  @override
  String get inErrDesc => 'কয়েক বাক্যে যা দেখেছেন লিখুন।';

  @override
  String get inErrFailed => 'কিছু ভুল হয়েছে। আবার চেষ্টা করুন।';

  @override
  String get inErrRca => 'সংশোধন যোগ করার আগে মূল কারণ খুঁজুন।';

  @override
  String get inErrCapaOpen => 'প্রতিটি সংশোধন আগে নিশ্চিত করতে হবে।';

  @override
  String get inErrCapaSelf => 'অন্য কাউকে আপনার সংশোধন নিশ্চিত করতে হবে।';

  @override
  String get inErrNotStat => 'এই রিপোর্টে সরকারি দাখিল লাগে না।';

  @override
  String get moduleAssets => 'যন্ত্রপাতি';

  @override
  String get asIntro =>
      'আপনার হাতে থাকা যন্ত্র, গাড়ি ও কিট। স্বাক্ষর, মেরামত বা সেফটি লক যাদের দরকার তারা আগে।';

  @override
  String get asSearchHint => 'নাম বা সিরিয়াল দিয়ে খুঁজুন';

  @override
  String get asNew => 'যন্ত্র যোগ করুন';

  @override
  String get asNewIntro => 'কোম্পানি ইতিমধ্যে কেনা কিছু নিবন্ধন করুন।';

  @override
  String get asTabMine => 'আমার';

  @override
  String get asTabAttention => 'আপনার দরকার';

  @override
  String get asTabSign => 'স্বাক্ষর বাকি';

  @override
  String get asTabRepair => 'মেরামতে';

  @override
  String get asTabCal => 'ক্যালিব্রেশন';

  @override
  String get asTabRetire => 'অবসরের জন্য';

  @override
  String get asTabStock => 'স্টোরে';

  @override
  String get asTabCars => 'গাড়ি';

  @override
  String get asTabAll => 'সব';

  @override
  String get asEmpty => 'এই তালিকায় কিছু নেই।';

  @override
  String get asEmptyFiltered => 'এই খোঁজার সাথে কিছু মেলেনি।';

  @override
  String get asSummaryNone => 'এই তালিকায় আপনার জন্য কিছু অপেক্ষা করছে না।';

  @override
  String asSummaryNeed(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$countটি জিনিসে আপনার দরকার।',
      one: '১টি জিনিসে আপনার দরকার।',
    );
    return '$_temp0';
  }

  @override
  String get asWhat => 'এটি কী, এবং কোথায়?';

  @override
  String asWhy(String category) {
    return 'কে ধরে আছে, দাম কত এবং কখন সার্ভিস লাগবে — সেটা জানতে রাখা। $category।';
  }

  @override
  String asLifeLine(String stage, String years) {
    return 'ধাপ $stage / ৮ · পরিকল্পিত আয়ু $years বছর';
  }

  @override
  String asBook(String nbv, String health) {
    return 'বইয়ের মূল্য $nbv · স্বাস্থ্য $health/১০০';
  }

  @override
  String asLotoOn(String permit) {
    return 'লকআউট। পারমিট $permit। চালাবেন না।';
  }

  @override
  String get asStageStock => 'স্টোরে';

  @override
  String get asStageWork => 'ব্যবহারে';

  @override
  String get asStageMove => 'যাচ্ছে';

  @override
  String get asStageRepair => 'মেরামতে';

  @override
  String get asStageCal => 'ক্যালিব্রেশন বাকি';

  @override
  String get asStageLoto => 'লকআউট';

  @override
  String get asStageRetire => 'অবসর';

  @override
  String get asStageGone => 'বাতিল';

  @override
  String get asNextCommission => 'কাজে লাগান এবং প্রয়োজনে ধারক নাম লিখুন।';

  @override
  String get asNextStock => 'স্টোরে অপেক্ষা। প্ল্যান্ট কাজে লাগাতে পারে।';

  @override
  String get asNextReceive => 'আসছে। পেয়েছেন নিশ্চিত করুন।';

  @override
  String get asNextMoving => 'অন্য সাইটে যাচ্ছে।';

  @override
  String get asNextLotoRelease => 'কাজ নিরাপদ হলে লকআউট খুলুন।';

  @override
  String get asNextLotoWait => 'লকআউট। সেফটি অফিসারের অপেক্ষা।';

  @override
  String get asNextFinishJob => 'খোলা কাজ শেষ করুন এবং খরচ লিখুন।';

  @override
  String get asNextRepair => 'মেরামত চলছে।';

  @override
  String get asNextCal => 'ক্যালিব্রেশন সনদ লিখুন।';

  @override
  String get asNextCalWait => 'ক্যালিব্রেশন বাকি।';

  @override
  String get asNextDispose => 'সব ঘর টিক হয়েছে। হিসাব বন্ধ করুন।';

  @override
  String get asNextWriteOff =>
      'রাইট-অফ অনুমোদন করুন, তারপর অর্থ বিভাগ বন্ধ করবে।';

  @override
  String get asNextRetireWait => 'অর্থ বিভাগ অবসর ফাইল শেষ করার অপেক্ষা।';

  @override
  String get asNextGone => 'হিসাব থেকে নামানো হয়েছে। আর কিছু করার নেই।';

  @override
  String get asNextAck => 'পেয়েছেন বলে স্বাক্ষর করুন।';

  @override
  String asNextOk(String who) {
    return '$who ধরে আছেন। আপনার কিছু করার নেই।';
  }

  @override
  String get asNextIdle => 'ব্যবহারে আছে। কিছু খারাপ হলে জানান।';

  @override
  String get asFieldName => 'নাম কী?';

  @override
  String get asFieldCategory => 'ধরন';

  @override
  String get asFieldSite => 'সাইট';

  @override
  String get asFieldCost => 'কেনা হয়েছিল কত টাকায়?';

  @override
  String get asFieldLife => 'কত বছর চলবে?';

  @override
  String get asFieldLocation => 'কোথায় থাকবে?';

  @override
  String get asFieldCritical => 'কতটা জরুরি?';

  @override
  String get asFieldCommission => 'এখনই কাজে লাগান';

  @override
  String get asFieldHolder => 'কে ধরে থাকবেন?';

  @override
  String get asFieldHolderNone => 'এখনও কেউ না';

  @override
  String get asFieldDefect => 'কী সমস্যা?';

  @override
  String get asFieldPermit => 'লকআউট পারমিট (LOTO-YYYY-NNNN)';

  @override
  String get asFieldReason => 'কেন?';

  @override
  String get asFieldSurvey => 'জরিপ নোট';

  @override
  String get asFieldCert => 'সনদ নম্বর';

  @override
  String get asFieldProceeds => 'বিক্রির টাকা (স্ক্র্যাপ হলে ০)';

  @override
  String get asFieldToSite => 'যে সাইটে যাবে';

  @override
  String get asSiteHq => 'প্রধান কার্যালয়';

  @override
  String get asSitePlant => 'কেরানীগঞ্জ প্ল্যান্ট';

  @override
  String get asSiteCtg => 'চট্টগ্রাম টার্মিনাল';

  @override
  String get asCritA => 'প্ল্যান্ট-জরুরি';

  @override
  String get asCritB => 'অপরিহার্য';

  @override
  String get asCritC => 'সাধারণ';

  @override
  String get asActAck => 'আমার কাছে আছে';

  @override
  String get asActCommission => 'কাজে লাগান';

  @override
  String get asActAssign => 'হস্তান্তর';

  @override
  String get asActFlag => 'সমস্যা আছে';

  @override
  String get asActLotoOn => 'লকআউট';

  @override
  String get asActLotoOff => 'লকআউট খুলুন';

  @override
  String get asActMove => 'অন্য সাইটে পাঠান';

  @override
  String get asActReceive => 'এখানে পেয়েছি';

  @override
  String get asActCertify => 'সনদ লিখুন';

  @override
  String get asActRetire => 'অবসর';

  @override
  String get asActWriteOff => 'রাইট-অফ অনুমোদন';

  @override
  String get asActDispose => 'হিসাব বন্ধ';

  @override
  String get asActStart => 'কাজ শুরু';

  @override
  String get asActFinish => 'কাজ শেষ';

  @override
  String get asJobs => 'খোলা কাজ';

  @override
  String get asRetireFile => 'অবসর ফাইল';

  @override
  String get asBoxSurvey => 'কারিগরি জরিপ স্বাক্ষরিত';

  @override
  String get asBoxClean => 'পরিষ্কার / ডিওয়ার্ক';

  @override
  String get asBoxSpares => 'স্পেয়ার নামানো';

  @override
  String get asBoxFinance => 'অর্থ পরীক্ষা';

  @override
  String get asDetails => 'বিস্তারিত';

  @override
  String get asFieldBookFull => 'খরচ ও অবচয়';

  @override
  String asBookFull(String gross, String accum, String nbv, String method) {
    return 'মোট $gross · লেখা হয়েছে $accum · বই $nbv · পদ্ধতি $method';
  }

  @override
  String asYearCharge(String amount) {
    return 'এই বছর $amount';
  }

  @override
  String get asPassport => 'ট্যাগ, সিরিয়াল ও প্রস্তুতকারক';

  @override
  String get asDoneAck => 'স্বাক্ষর হয়েছে।';

  @override
  String get asDoneCommission => 'কাজে আছে।';

  @override
  String get asDoneAssign => 'হস্তান্তর হয়েছে। স্বাক্ষরের তিন দিন আছে।';

  @override
  String get asDoneFlag => 'সমস্যা নথিভুক্ত। মেরামত খোলা হয়েছে।';

  @override
  String get asDoneLotoOn => 'লকআউট হয়েছে।';

  @override
  String get asDoneLotoOff => 'লকআউট খোলা হয়েছে।';

  @override
  String get asDoneMove => 'যাত্রা শুরু।';

  @override
  String get asDoneReceive => 'গ্রহণ হয়েছে।';

  @override
  String get asDoneCertify => 'সনদ নথিভুক্ত।';

  @override
  String get asDoneRetire => 'অবসর। অর্থ বিভাগের ঘর বাকি।';

  @override
  String get asDoneWriteOff => 'রাইট-অফ অনুমোদিত।';

  @override
  String get asDoneDispose => 'হিসাব বন্ধ।';

  @override
  String get asDoneStart => 'কাজ শুরু।';

  @override
  String get asDoneFinish => 'কাজ শেষ।';

  @override
  String get asDoneTick => 'ঘর টিক হয়েছে।';

  @override
  String get asErrName => 'একটি ছোট নাম দিন।';

  @override
  String get asErrCost => 'কেনার মূল্য লিখুন।';

  @override
  String get asErrLife => 'আয়ু বছরে লিখুন।';

  @override
  String get asErrFailed => 'কিছু ভুল হয়েছে। আবার চেষ্টা করুন।';

  @override
  String get asErrLoto => 'এই যন্ত্র লকআউট।';

  @override
  String get asErrLotoNeed => 'কাজ শুরুর আগে লকআউট করুন।';

  @override
  String get asErrAck => 'বর্তমান ধারককে আগে স্বাক্ষর করতে হবে।';

  @override
  String get asErrList => 'অবসরের প্রতিটি ঘর টিক করতে হবে।';

  @override
  String get asErrWrite => 'রাইট-অফ এখনও অনুমোদিত নয়।';

  @override
  String get asErrCal => 'আগে ক্যালিব্রেশন করুন।';

  @override
  String get moduleCompliance => 'লাইসেন্স';

  @override
  String get cpIntro =>
      'প্ল্যান্ট খোলা রাখতে যে অনুমতিগুলো লাগে। যেগুলো আগে শেষ হবে সেগুলো উপরে।';

  @override
  String get cpSearchHint => 'নাম বা নম্বর দিয়ে খুঁজুন';

  @override
  String get cpNew => 'লাইসেন্স যোগ করুন';

  @override
  String get cpNewIntro => 'কোম্পানির কাছে ইতিমধ্যে থাকা অনুমতি নিবন্ধন করুন।';

  @override
  String get cpTabMine => 'আমার';

  @override
  String get cpTabCritical => 'এই মাস';

  @override
  String get cpTabWarning => 'এই তিন মাস';

  @override
  String get cpTabRenew => 'নবায়নে';

  @override
  String get cpTabExpired => 'মেয়াদোত্তীর্ণ';

  @override
  String get cpTabAll => 'সব';

  @override
  String get cpEmpty => 'এই তালিকায় কিছু নেই।';

  @override
  String get cpEmptyFiltered => 'এই খোঁজার সাথে কিছু মেলেনি।';

  @override
  String get cpSummaryNone => 'এই তালিকায় আপনার জন্য কিছু অপেক্ষা করছে না।';

  @override
  String cpSummaryNeed(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$countটি লাইসেন্সে আপনার দরকার।',
      one: '১টি লাইসেন্সে আপনার দরকার।',
    );
    return '$_temp0';
  }

  @override
  String cpDays(int days) {
    String _temp0 = intl.Intl.pluralLogic(
      days,
      locale: localeName,
      other: '$days দিন বাকি',
      one: '১ দিন বাকি',
    );
    return '$_temp0';
  }

  @override
  String get cpWhat => 'এটি কোন অনুমতি?';

  @override
  String cpWho(String who, String days) {
    return '$who দেখাশোনা করেন। $days।';
  }

  @override
  String get cpWhy => 'এটি ছাড়া সেই কাজ আইনত চালানো যায় না।';

  @override
  String cpExpires(String date) {
    return '$date তারিখে শেষ।';
  }

  @override
  String cpRenewLine(String stage, String pct) {
    return 'নবায়ন: $stage · চেকলিস্ট $pct%';
  }

  @override
  String get cpUrgExpired => 'মেয়াদোত্তীর্ণ';

  @override
  String get cpUrgCritical => 'এই মাস';

  @override
  String get cpUrgWarning => 'এই তিন মাস';

  @override
  String get cpUrgOk => 'সচল';

  @override
  String get cpStageReview => 'ফাইল তৈরি';

  @override
  String get cpStageFiled => 'দাপ্তরিক দাখিল';

  @override
  String get cpStageInspect => 'পরিদর্শন নির্ধারিত';

  @override
  String get cpStageVet => 'মন্ত্রণালয়ের অপেক্ষা';

  @override
  String get cpStageDone => 'নবায়ন হয়েছে';

  @override
  String get cpNextStartExpired => 'মেয়াদ শেষ। নবায়ন ফাইল খুলুন।';

  @override
  String get cpNextExpired => 'মেয়াদ শেষ। প্ল্যান্ট নবায়ন খুলবে।';

  @override
  String get cpNextStartSoon => 'শীঘ্রই শেষ। নবায়ন ফাইল খুলুন।';

  @override
  String cpNextOk(String date) {
    return '$date পর্যন্ত সচল। আপনার কিছু করার নেই।';
  }

  @override
  String cpNextFund(String fee) {
    return 'দাখিলের আগে অর্থ বিভাগকে $fee ফি অনুমোদন করতে হবে।';
  }

  @override
  String get cpNextTicks => 'চেকলিস্টের প্রতিটি ঘর টিক করে দাখিল করুন।';

  @override
  String get cpNextFile => 'নিয়ন্ত্রকের কাছে আবেদন দাখিল করুন।';

  @override
  String get cpNextWaitFile => 'প্ল্যান্ট আবেদন দাখিলের অপেক্ষা।';

  @override
  String get cpNextBook => 'পরিদর্শন তারিখ ও পরিদর্শকের নাম লিখুন।';

  @override
  String get cpNextWaitInspect => 'পরিদর্শন তারিখের অপেক্ষা।';

  @override
  String get cpNextFindings => 'পরিদর্শক কী পেয়েছেন লিখুন।';

  @override
  String get cpNextWaitFindings => 'পরিদর্শন নির্ধারিত।';

  @override
  String get cpNextCert => 'নতুন সনদ ও নতুন মেয়াদ লিখুন।';

  @override
  String get cpNextWaitCert => 'নতুন সনদের অপেক্ষা।';

  @override
  String get cpNextRenewed => 'নবায়ন হয়েছে। আর কিছু করার নেই।';

  @override
  String get cpFieldTitle => 'নাম কী?';

  @override
  String get cpFieldNo => 'কাগজের লাইসেন্স নম্বর';

  @override
  String get cpFieldKind => 'ধরন';

  @override
  String get cpFieldSite => 'সাইট';

  @override
  String get cpFieldExpiry => 'কবে শেষ?';

  @override
  String get cpFieldFee => 'নবায়ন ফি (টাকা)';

  @override
  String get cpFieldOwner => 'কে দেখাশোনা করবেন?';

  @override
  String get cpFieldOwnerMe => 'আপনি';

  @override
  String get cpFieldInspector => 'পরিদর্শকের নাম';

  @override
  String get cpFieldFindings => 'কী পেয়েছেন?';

  @override
  String get cpFieldCert => 'নতুন সনদ নম্বর';

  @override
  String get cpFieldNewExpiry => 'নতুন মেয়াদ (YYYY-MM-DD)';

  @override
  String get cpFieldChalan => 'চালান নম্বর';

  @override
  String get cpFieldReason => 'কেন ফেরত?';

  @override
  String get cpFieldSubject => 'চিঠির বিষয়';

  @override
  String get cpFieldLetter => 'চিঠির লেখা';

  @override
  String get cpSiteHq => 'প্রধান কার্যালয়';

  @override
  String get cpSitePlant => 'কেরানীগঞ্জ প্ল্যান্ট';

  @override
  String get cpActRenew => 'নবায়ন খুলুন';

  @override
  String get cpActFund => 'ফি অনুমোদন';

  @override
  String get cpActFile => 'আবেদন দাখিল';

  @override
  String get cpActInspect => 'পরিদর্শন বুক';

  @override
  String get cpActFindings => 'ফলাফল লিখুন';

  @override
  String get cpActComplete => 'নতুন সনদ লিখুন';

  @override
  String get cpActAdvance => 'এগিয়ে যান';

  @override
  String get cpActBack => 'এক ধাপ ফেরত';

  @override
  String get cpActLetter => 'চেয়ারম্যানের চিঠি';

  @override
  String get cpChecklist => 'দাখিলের আগে';

  @override
  String get cpDetails => 'বিস্তারিত';

  @override
  String get cpPassport => 'নম্বর';

  @override
  String get cpDoneRenew => 'নবায়ন ফাইল খোলা হয়েছে।';

  @override
  String get cpDoneFund => 'ফি অনুমোদিত। প্ল্যান্ট এখন দাখিল করতে পারে।';

  @override
  String get cpDoneAdvance => 'এগিয়েছে।';

  @override
  String get cpDoneBack => 'এক ধাপ ফেরত গেছে।';

  @override
  String get cpDoneLetter => 'চিঠি পাঠানো হয়েছে।';

  @override
  String get cpDoneTick => 'ঘর টিক হয়েছে।';

  @override
  String get cpErrTitle => 'একটি ছোট নাম দিন।';

  @override
  String get cpErrNo => 'কাগজের নম্বর লিখুন।';

  @override
  String get cpErrFailed => 'কিছু ভুল হয়েছে। আবার চেষ্টা করুন।';

  @override
  String get cpErrFund => 'আগে অর্থ বিভাগকে ফি অনুমোদন করতে হবে।';

  @override
  String get cpErrTicks => 'প্রতিটি ঘর আগে চিহ্নিত করতে হবে।';

  @override
  String get cpErrFail => 'একটি ব্যর্থ ঘর এখনও খোলা।';

  @override
  String get cpErrLetter =>
      'চেয়ারম্যানের চিঠি কেবল ৩০ দিনের ভিতরে বা মন্ত্রণালয়ে থাকা লাইসেন্সের জন্য।';

  @override
  String get cpErrOpen => 'একটি নবায়ন ইতিমধ্যে খোলা।';

  @override
  String get cpErrValidity =>
      'নতুন মেয়াদ এই অনুমতির স্বাভাবিক আয়ুর সাথে মিলতে হবে।';

  @override
  String get moduleEmployees => 'মানুষ';

  @override
  String get emIntro => 'কে কাজ করেন, কার কাছে রিপোর্ট করেন, কে যাচ্ছেন।';

  @override
  String get emSearchHint => 'নাম, পদ বা ফোন দিয়ে খুঁজুন';

  @override
  String get emNew => 'সহকর্মী যোগ করুন';

  @override
  String get emNewIntro => 'ইতিমধ্যে যোগ দেওয়া কাউকে এইচআর নথিভুক্ত করেন।';

  @override
  String get emTabAll => 'কাজে আছেন';

  @override
  String get emTabTeam => 'আমার দল';

  @override
  String get emTabLeaving => 'যাচ্ছেন';

  @override
  String get emTabFormer => 'আগে ছিলেন';

  @override
  String get emEmpty => 'এই তালিকায় কেউ নেই।';

  @override
  String get emEmptyFiltered => 'এই খোঁজার সাথে কেউ মেলেনি।';

  @override
  String get emSummaryNone => 'এই তালিকায় আপনার জন্য কিছু অপেক্ষা করছে না।';

  @override
  String emSummaryNeed(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count জনের আপনার দরকার।',
      one: '১ জনের আপনার দরকার।',
    );
    return '$_temp0';
  }

  @override
  String get emStatusActive => 'কাজে আছেন';

  @override
  String get emStatusLeave => 'ছুটিতে';

  @override
  String get emStatusLeaving => 'যাচ্ছেন';

  @override
  String get emStatusFormer => 'চলে গেছেন';

  @override
  String get emWhat => 'ইনি কে?';

  @override
  String emWho(String who) {
    return '$who-এর কাছে রিপোর্ট করেন।';
  }

  @override
  String get emWhoNone => 'লাইন ম্যানেজার নথিতে নেই।';

  @override
  String get emWhy =>
      'সহকর্মীরা যেন একে অপরকে খুঁজে পান। সংবেদনশীল তথ্য এইচআর-এ থাকে।';

  @override
  String get emExitTitle => 'যাচ্ছেন — যে ঘরগুলো সই করতে হবে';

  @override
  String emLastDay(String date) {
    return 'শেষ দিন $date।';
  }

  @override
  String get emActExit => 'প্রস্থান শুরু';

  @override
  String get emActClear => 'এই ঘর মিটান';

  @override
  String get emActWaive => 'এই ঘর বাদ দিন';

  @override
  String get emActReclaim => 'যন্ত্র ফেরত নিন';

  @override
  String get emActClose => 'ফাইল বন্ধ করুন';

  @override
  String get emActCancel => 'তাঁকে রাখুন';

  @override
  String get emActRehire => 'ফিরে আনুন';

  @override
  String get emFieldName => 'পুরো নাম';

  @override
  String get emFieldNameBn => 'বাংলা নাম';

  @override
  String get emFieldTitle => 'পদবি';

  @override
  String get emFieldPhone => 'ফোন';

  @override
  String get emFieldEmail => 'অফিস ইমেইল';

  @override
  String get emFieldDept => 'বিভাগ';

  @override
  String get emFieldSite => 'কর্মস্থল';

  @override
  String get emFieldManager => 'লাইন ম্যানেজার';

  @override
  String get emFieldManagerHint => 'ঐচ্ছিক';

  @override
  String get emFieldLastDay => 'শেষ কর্মদিবস (YYYY-MM-DD)';

  @override
  String get emFieldExitReason => 'কেন যাচ্ছেন';

  @override
  String get emFieldNote => 'কী দেখেছেন';

  @override
  String get emFieldWaive => 'কেন এই ঘর বাদ';

  @override
  String get emFieldVoucher => 'শেষ বেতনের ভাউচার নম্বর';

  @override
  String get emFieldCancel => 'কেন তাঁকে রাখছেন';

  @override
  String get emFieldJoined => 'যোগদান';

  @override
  String get emFieldGrade => 'গ্রেড';

  @override
  String get emFieldNid => 'জাতীয় পরিচয়পত্র (১০, ১৩ বা ১৭ অঙ্ক)';

  @override
  String get emFieldEmergency => 'জরুরি যোগাযোগ';

  @override
  String get emFieldReports => 'যাঁরা তাঁর কাছে রিপোর্ট করেন';

  @override
  String get emPassport => 'কর্মী নম্বর';

  @override
  String get emDetails => 'বিস্তারিত';

  @override
  String get emItemPending => 'অপেক্ষায়';

  @override
  String get emItemCleared => 'মিটেছে';

  @override
  String get emItemWaived => 'বাদ';

  @override
  String get emDoneExit => 'প্রস্থান ফাইল খোলা। প্রতিটি ঘরে নোট যাবে।';

  @override
  String get emDoneClear => 'ঘর সই হয়েছে।';

  @override
  String get emDoneWaive => 'ঘর বাদ দেওয়া হয়েছে।';

  @override
  String get emDoneReclaim => 'যন্ত্র ফেরত নেওয়া হয়েছে।';

  @override
  String get emDoneClose => 'তিনি চলে গেছেন। লগইন বন্ধ।';

  @override
  String get emDoneCancel => 'তিনি থাকছেন। প্রস্থান বাতিল।';

  @override
  String get emDoneRehire => 'তিনি আবার খাতায় আছেন।';

  @override
  String get emErrName => 'নাম লিখুন।';

  @override
  String get emErrTitle => 'পদবি লিখুন।';

  @override
  String get emErrPhone => 'ফোন নম্বর দিন।';

  @override
  String get emErrFailed => 'কিছু ভুল হয়েছে। আবার চেষ্টা করুন।';

  @override
  String get emErrProtected => 'চেয়ারম্যানকে এভাবে খাতা থেকে নামানো যায় না।';

  @override
  String get emErrSelf =>
      'আরেকজন এইচআর সহকর্মীকে আপনার প্রস্থান শুরু করতে হবে।';

  @override
  String get emErrAssets => 'আগে যন্ত্র ফেরত নিন, তারপর এই ঘর টিক করুন।';

  @override
  String get emErrBus => 'আগে স্টাফ বাসের আসন শেষ করুন।';

  @override
  String get emErrTrips => 'আগে খোলা গাড়ি যাত্রা শেষ করুন।';

  @override
  String get emErrFinance => 'আগে দাবি ও অগ্রিম মিটান।';

  @override
  String get emErrPending => 'প্রতিটি ঘর আগে মিটাতে বা বাদ দিতে হবে।';

  @override
  String get emErrOpen => 'একটি প্রস্থান ফাইল ইতিমধ্যে খোলা।';

  @override
  String get moduleDashboards => 'আজ';

  @override
  String get dbWhat =>
      'আপনার কী করতে হবে, এবং যে কয়েকটি সংখ্যা সিদ্ধান্ত বদলায়।';

  @override
  String get dbWhy => 'এই সংখ্যাগুলো লাইভ ফাইল থেকে গোনা, টাইপ করা নয়।';

  @override
  String get dbNeedsTitle => 'আজ আপনার দরকার';

  @override
  String get dbActBrief => 'সংক্ষিপ্ত ব্রিফিং পাঠান';

  @override
  String get dbFieldTitle => 'শিরোনাম';

  @override
  String get dbFieldBody => 'কী শোনাবেন (২০+ অক্ষর)';

  @override
  String get dbDoneBrief => 'ব্রিফিং পাঠানো হয়েছে।';

  @override
  String dbRoiLine(String fleet, String vendor) {
    return 'ঘোষিত: বহর ৳$fleet, বিক্রেতা ৳$vendor। লাইভ হিসাব নয়।';
  }

  @override
  String get moduleChat => 'নেতৃত্ব চ্যাট';

  @override
  String get chIntro =>
      'নেতৃত্বের ঘর। বার্তা এই ডিভাইসে থাকে। এন্ড-টু-এন্ড নয়।';

  @override
  String get chEmptyTitle => 'এখনও কোনো ঘর নেই';

  @override
  String get chEmpty => 'শুরু করতে একজন সহকর্মীকে বার্তা পাঠান।';

  @override
  String get chNoMessages => 'এখনও কোনো বার্তা নেই।';

  @override
  String get chLocked => 'নিমন্ত্রণে';

  @override
  String get chDirect => 'একজনকে লিখুন';

  @override
  String get chHint => 'বার্তা লিখুন';

  @override
  String get chSend => 'পাঠান';

  @override
  String get chReact => 'প্রতিক্রিয়া';

  @override
  String get chDeleted => 'বার্তা সরানো হয়েছে।';

  @override
  String get chSecureNote => 'পথে ও সংরক্ষণে এনক্রিপ্টেড। এন্ড-টু-এন্ড নয়।';

  @override
  String get chActDirective => 'নির্দেশ দিন';

  @override
  String get chActAck => 'পেয়েছি';

  @override
  String get chActDone => 'শেষ হয়েছে';

  @override
  String get chFieldTitle => 'নির্দেশের শিরোনাম';

  @override
  String get chFieldBody => 'কী করতে হবে';

  @override
  String chAckCount(int acks, int needed) {
    return '$needed জনের মধ্যে $acks জন স্বীকার করেছেন।';
  }

  @override
  String get demoPlayEvent => 'পরের লাইভ ঘটনা চালান';

  @override
  String get demoPlayEventHint =>
      'নেতৃত্বে একটি বার্তা ও ইনবক্সে একটি নোট পড়ে।';

  @override
  String get demoPlayEventDone => 'ঘটনা চালানো হয়েছে।';

  @override
  String get homeWhat => 'এখন কী করতে হবে।';

  @override
  String get searchTitle => 'মানুষ বা ফাইল খুঁজুন';

  @override
  String get searchHint =>
      'নাম, কর্মচারী আইডি বা LV-, INC-, PASS- এর মতো রেফারেন্স লিখুন।';

  @override
  String get searchField => 'খুঁজুন';

  @override
  String get searchEmpty => 'কিছু মেলেনি।';

  @override
  String get lockMessagePassword =>
      'অ্যাকাউন্টের পাসওয়ার্ড দিয়ে খুলুন। পাঁচবার ভুল হলে সাইন আউট।';

  @override
  String get lockPassword => 'পাসওয়ার্ড';

  @override
  String get lockUnlockPassword => 'পাসওয়ার্ড দিয়ে খুলুন';

  @override
  String lockFailedLeft(int left) {
    return 'পাসওয়ার্ড মেলেনি। $leftবার বাকি।';
  }

  @override
  String get dbListen => 'শুনুন';

  @override
  String get dbListenDone => 'শোনা হয়েছে বলে চিহ্নিত।';

  @override
  String get dbActRestore => 'চালু করুন';

  @override
  String get dbPermitRestored => 'লক-আউট খুলে দেওয়া হয়েছে।';

  @override
  String get dbActSignHandover => 'হস্তান্তরে স্বাক্ষর';

  @override
  String get dbHandoverSigned => 'হস্তান্তর স্বাক্ষরিত। এই শিফট আপনার।';

  @override
  String get attTeamTitle => 'আজ আপনার দল';

  @override
  String get attTeamWhy => 'কে এসেছেন, কে দেরি, কে ছুটিতে, কার খতিয়ান লাগবে।';

  @override
  String get attTeamPresent => 'হাজির';

  @override
  String get attTeamLate => 'দেরি';

  @override
  String get attTeamLeave => 'ছুটিতে';

  @override
  String get attTeamReview => 'দেখতে হবে';

  @override
  String get attTeamEmpty => 'এই পরিসরে আজ কেউ নেই।';

  @override
  String get attTeamNothing => 'আপনার করার কিছু নেই।';

  @override
  String get attTeamReviewHint => 'নিয়মিতকরণ খুলুন, অথবা কিছু করবেন না।';

  @override
  String get approvalRejectExplain =>
      'এক বাক্য লিখুন যা আবেদনকারী ফাইল ও ইনবক্সে দেখবেন।';

  @override
  String get approvalRejectionSeen => 'কেন ফিরিয়ে দেওয়া হয়েছে';

  @override
  String get flChat => 'যাত্রার চ্যাট';

  @override
  String get flChatEmpty => 'এই যাত্রায় এখনও কোনো বার্তা নেই।';

  @override
  String get flChatHint => 'চালক বা আবেদনকারীকে লিখুন';

  @override
  String get flPoolTitle => 'এই দুই যাত্রা এক গাড়ি নিতে পারে';

  @override
  String flPoolBody(String a, String b) {
    return '$a ও $b একই পথে। দুজনে রাজি হলে এক গাড়ি দিন।';
  }

  @override
  String get flCallDriver => 'চালককে ফোন';

  @override
  String get flOdoStart => 'শুরুর ওডোমিটার (কিমি)';

  @override
  String get flOdoEnd => 'শেষ ওডোমিটার (কিমি)';

  @override
  String get busConductor => 'যাত্রী যাচাই';

  @override
  String get busConductorHint => 'কর্মচারী আইডি বা আসন নম্বর';

  @override
  String busConductorOk(String name, String seat) {
    return '$name আসন $seat-এ আছেন।';
  }

  @override
  String get busConductorMiss => 'এই বাসে কেউ মেলেনি।';

  @override
  String get busSwap => 'আসন বদল চান';

  @override
  String get busSwapHint => 'অন্যজনকে মানতে হবে।';

  @override
  String get busSwapDone => 'বদলের অনুরোধ পাঠানো হয়েছে।';

  @override
  String get busSwapAccept => 'আসন বদল মানুন';

  @override
  String get chVoice => 'ভয়েস নোট';

  @override
  String get chVoiceRecord => 'ধরতে ধরে রাখুন';

  @override
  String get chVoiceStop => 'থামান ও পাঠান';

  @override
  String get chVoicePlay => 'ভয়েস নোট চালান';

  @override
  String get inGps => 'কোথায় হয়েছে যোগ করুন';

  @override
  String get inGpsOn => 'অবস্থান যোগ হয়েছে';

  @override
  String get inCloseBlocked =>
      'প্রতিটি সংশোধন নিশ্চিত হলেই ফাইল বন্ধ করা যাবে।';

  @override
  String get asScanTag => 'ট্যাগ স্ক্যান';

  @override
  String get emErrNid => 'এনআইডি ১০, ১৩ বা ১৭ অঙ্কের হতে হবে।';
}
