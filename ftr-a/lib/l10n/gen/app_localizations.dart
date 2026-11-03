import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:intl/intl.dart' as intl;

import 'app_localizations_bn.dart';
import 'app_localizations_en.dart';

// ignore_for_file: type=lint

/// Callers can lookup localized strings with an instance of AppL10n
/// returned by `AppL10n.of(context)`.
///
/// Applications need to include `AppL10n.delegate()` in their app's
/// `localizationDelegates` list, and the locales they support in the app's
/// `supportedLocales` list. For example:
///
/// ```dart
/// import 'gen/app_localizations.dart';
///
/// return MaterialApp(
///   localizationsDelegates: AppL10n.localizationsDelegates,
///   supportedLocales: AppL10n.supportedLocales,
///   home: MyApplicationHome(),
/// );
/// ```
///
/// ## Update pubspec.yaml
///
/// Please make sure to update your pubspec.yaml to include the following
/// packages:
///
/// ```yaml
/// dependencies:
///   # Internationalization support.
///   flutter_localizations:
///     sdk: flutter
///   intl: any # Use the pinned version from flutter_localizations
///
///   # Rest of dependencies
/// ```
///
/// ## iOS Applications
///
/// iOS applications define key application metadata, including supported
/// locales, in an Info.plist file that is built into the application bundle.
/// To configure the locales supported by your app, you’ll need to edit this
/// file.
///
/// First, open your project’s ios/Runner.xcworkspace Xcode workspace file.
/// Then, in the Project Navigator, open the Info.plist file under the Runner
/// project’s Runner folder.
///
/// Next, select the Information Property List item, select Add Item from the
/// Editor menu, then select Localizations from the pop-up menu.
///
/// Select and expand the newly-created Localizations item then, for each
/// locale your application supports, add a new item and select the locale
/// you wish to add from the pop-up menu in the Value field. This list should
/// be consistent with the languages listed in the AppL10n.supportedLocales
/// property.
abstract class AppL10n {
  AppL10n(String locale)
    : localeName = intl.Intl.canonicalizedLocale(locale.toString());

  final String localeName;

  static AppL10n of(BuildContext context) {
    return Localizations.of<AppL10n>(context, AppL10n)!;
  }

  static const LocalizationsDelegate<AppL10n> delegate = _AppL10nDelegate();

  /// A list of this localizations delegate along with the default localizations
  /// delegates.
  ///
  /// Returns a list of localizations delegates containing this delegate along with
  /// GlobalMaterialLocalizations.delegate, GlobalCupertinoLocalizations.delegate,
  /// and GlobalWidgetsLocalizations.delegate.
  ///
  /// Additional delegates can be added by appending to this list in
  /// MaterialApp. This list does not have to be used at all if a custom list
  /// of delegates is preferred or required.
  static const List<LocalizationsDelegate<dynamic>> localizationsDelegates =
      <LocalizationsDelegate<dynamic>>[
        delegate,
        GlobalMaterialLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
      ];

  /// A list of this localizations delegate's supported locales.
  static const List<Locale> supportedLocales = <Locale>[
    Locale('bn'),
    Locale('en'),
  ];

  /// Application name
  ///
  /// In en, this message translates to:
  /// **'BOGCL OneOps'**
  String get appName;

  /// No description provided for @commonRetry.
  ///
  /// In en, this message translates to:
  /// **'Retry'**
  String get commonRetry;

  /// No description provided for @commonErrorTitle.
  ///
  /// In en, this message translates to:
  /// **'Something went wrong'**
  String get commonErrorTitle;

  /// No description provided for @commonErrorMessage.
  ///
  /// In en, this message translates to:
  /// **'We could not load this. Check your connection and try again.'**
  String get commonErrorMessage;

  /// No description provided for @commonEmptyTitle.
  ///
  /// In en, this message translates to:
  /// **'Nothing here yet'**
  String get commonEmptyTitle;

  /// No description provided for @commonEmptyMessage.
  ///
  /// In en, this message translates to:
  /// **'New items will appear here.'**
  String get commonEmptyMessage;

  /// No description provided for @commonOfflineBanner.
  ///
  /// In en, this message translates to:
  /// **'You are offline. Changes will sync when you reconnect.'**
  String get commonOfflineBanner;

  /// No description provided for @commonPendingSync.
  ///
  /// In en, this message translates to:
  /// **'Pending sync'**
  String get commonPendingSync;

  /// No description provided for @commonLoading.
  ///
  /// In en, this message translates to:
  /// **'Loading'**
  String get commonLoading;

  /// No description provided for @commonShowPassword.
  ///
  /// In en, this message translates to:
  /// **'Show password'**
  String get commonShowPassword;

  /// No description provided for @commonHidePassword.
  ///
  /// In en, this message translates to:
  /// **'Hide password'**
  String get commonHidePassword;

  /// No description provided for @commonFieldRequired.
  ///
  /// In en, this message translates to:
  /// **'This field is required'**
  String get commonFieldRequired;

  /// No description provided for @commonCancel.
  ///
  /// In en, this message translates to:
  /// **'Cancel'**
  String get commonCancel;

  /// No description provided for @commonConfirm.
  ///
  /// In en, this message translates to:
  /// **'Confirm'**
  String get commonConfirm;

  /// No description provided for @languageEnglish.
  ///
  /// In en, this message translates to:
  /// **'English'**
  String get languageEnglish;

  /// No description provided for @languageBangla.
  ///
  /// In en, this message translates to:
  /// **'বাংলা'**
  String get languageBangla;

  /// No description provided for @loginTitle.
  ///
  /// In en, this message translates to:
  /// **'Sign in'**
  String get loginTitle;

  /// No description provided for @loginSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Use your company email, phone number or employee ID.'**
  String get loginSubtitle;

  /// No description provided for @loginIdentifierLabel.
  ///
  /// In en, this message translates to:
  /// **'Email, phone or employee ID'**
  String get loginIdentifierLabel;

  /// No description provided for @loginPasswordLabel.
  ///
  /// In en, this message translates to:
  /// **'Password'**
  String get loginPasswordLabel;

  /// No description provided for @loginSubmit.
  ///
  /// In en, this message translates to:
  /// **'Sign in'**
  String get loginSubmit;

  /// No description provided for @loginErrorInvalid.
  ///
  /// In en, this message translates to:
  /// **'The ID or password is incorrect.'**
  String get loginErrorInvalid;

  /// No description provided for @loginErrorLocked.
  ///
  /// In en, this message translates to:
  /// **'Too many attempts. Please try again in 15 minutes.'**
  String get loginErrorLocked;

  /// No description provided for @loginErrorOffline.
  ///
  /// In en, this message translates to:
  /// **'You are offline. Connect to the internet and try again.'**
  String get loginErrorOffline;

  /// No description provided for @loginErrorGeneric.
  ///
  /// In en, this message translates to:
  /// **'We could not sign you in. Please try again.'**
  String get loginErrorGeneric;

  /// No description provided for @loginErrorValidation.
  ///
  /// In en, this message translates to:
  /// **'Enter your ID and password.'**
  String get loginErrorValidation;

  /// No description provided for @sessionRestoreError.
  ///
  /// In en, this message translates to:
  /// **'We could not restore your session.'**
  String get sessionRestoreError;

  /// No description provided for @navHome.
  ///
  /// In en, this message translates to:
  /// **'Home'**
  String get navHome;

  /// No description provided for @navMore.
  ///
  /// In en, this message translates to:
  /// **'More'**
  String get navMore;

  /// No description provided for @homeGoodMorning.
  ///
  /// In en, this message translates to:
  /// **'Good morning, {name}'**
  String homeGoodMorning(String name);

  /// No description provided for @homeGoodAfternoon.
  ///
  /// In en, this message translates to:
  /// **'Good afternoon, {name}'**
  String homeGoodAfternoon(String name);

  /// No description provided for @homeGoodEvening.
  ///
  /// In en, this message translates to:
  /// **'Good evening, {name}'**
  String homeGoodEvening(String name);

  /// No description provided for @homeWorkspaceTitle.
  ///
  /// In en, this message translates to:
  /// **'Your workspace'**
  String get homeWorkspaceTitle;

  /// No description provided for @profileEmployeeId.
  ///
  /// In en, this message translates to:
  /// **'Employee ID'**
  String get profileEmployeeId;

  /// No description provided for @profileDepartment.
  ///
  /// In en, this message translates to:
  /// **'Department'**
  String get profileDepartment;

  /// No description provided for @profileSite.
  ///
  /// In en, this message translates to:
  /// **'Site'**
  String get profileSite;

  /// No description provided for @profileGrade.
  ///
  /// In en, this message translates to:
  /// **'Grade'**
  String get profileGrade;

  /// No description provided for @profileRoles.
  ///
  /// In en, this message translates to:
  /// **'Roles'**
  String get profileRoles;

  /// No description provided for @profileEmail.
  ///
  /// In en, this message translates to:
  /// **'Email'**
  String get profileEmail;

  /// No description provided for @profilePhone.
  ///
  /// In en, this message translates to:
  /// **'Phone'**
  String get profilePhone;

  /// No description provided for @moreProfile.
  ///
  /// In en, this message translates to:
  /// **'Profile'**
  String get moreProfile;

  /// No description provided for @moreSettings.
  ///
  /// In en, this message translates to:
  /// **'Settings'**
  String get moreSettings;

  /// No description provided for @settingsLanguage.
  ///
  /// In en, this message translates to:
  /// **'Language'**
  String get settingsLanguage;

  /// No description provided for @settingsTheme.
  ///
  /// In en, this message translates to:
  /// **'Appearance'**
  String get settingsTheme;

  /// No description provided for @themeSystem.
  ///
  /// In en, this message translates to:
  /// **'System'**
  String get themeSystem;

  /// No description provided for @themeLight.
  ///
  /// In en, this message translates to:
  /// **'Light'**
  String get themeLight;

  /// No description provided for @themeDark.
  ///
  /// In en, this message translates to:
  /// **'Dark'**
  String get themeDark;

  /// No description provided for @signOut.
  ///
  /// In en, this message translates to:
  /// **'Sign out'**
  String get signOut;

  /// No description provided for @signOutConfirmTitle.
  ///
  /// In en, this message translates to:
  /// **'Sign out?'**
  String get signOutConfirmTitle;

  /// No description provided for @signOutConfirmMessage.
  ///
  /// In en, this message translates to:
  /// **'You will need to sign in again to use the app.'**
  String get signOutConfirmMessage;

  /// No description provided for @versionLabel.
  ///
  /// In en, this message translates to:
  /// **'Version {version}'**
  String versionLabel(String version);

  /// No description provided for @enumRoleCHAIRMAN.
  ///
  /// In en, this message translates to:
  /// **'Chairman'**
  String get enumRoleCHAIRMAN;

  /// No description provided for @enumRolePLANT_GM.
  ///
  /// In en, this message translates to:
  /// **'Plant General Manager'**
  String get enumRolePLANT_GM;

  /// No description provided for @enumRoleHOD.
  ///
  /// In en, this message translates to:
  /// **'Head of Department'**
  String get enumRoleHOD;

  /// No description provided for @enumRoleLINE_MANAGER.
  ///
  /// In en, this message translates to:
  /// **'Line Manager'**
  String get enumRoleLINE_MANAGER;

  /// No description provided for @enumRoleHR_ADMIN.
  ///
  /// In en, this message translates to:
  /// **'HR Administrator'**
  String get enumRoleHR_ADMIN;

  /// No description provided for @enumRoleFINANCE.
  ///
  /// In en, this message translates to:
  /// **'Finance'**
  String get enumRoleFINANCE;

  /// No description provided for @enumRoleTRANSPORT_ADMIN.
  ///
  /// In en, this message translates to:
  /// **'Transport Administrator'**
  String get enumRoleTRANSPORT_ADMIN;

  /// No description provided for @enumRoleHSE_OFFICER.
  ///
  /// In en, this message translates to:
  /// **'HSE Officer'**
  String get enumRoleHSE_OFFICER;

  /// No description provided for @enumRoleSECURITY_GATE.
  ///
  /// In en, this message translates to:
  /// **'Security Gate'**
  String get enumRoleSECURITY_GATE;

  /// No description provided for @enumRoleMAILROOM.
  ///
  /// In en, this message translates to:
  /// **'Mailroom'**
  String get enumRoleMAILROOM;

  /// No description provided for @enumRoleDRIVER.
  ///
  /// In en, this message translates to:
  /// **'Driver'**
  String get enumRoleDRIVER;

  /// No description provided for @enumRoleEMPLOYEE.
  ///
  /// In en, this message translates to:
  /// **'Employee'**
  String get enumRoleEMPLOYEE;

  /// No description provided for @demoTitle.
  ///
  /// In en, this message translates to:
  /// **'Demo menu'**
  String get demoTitle;

  /// No description provided for @demoSwitchPersona.
  ///
  /// In en, this message translates to:
  /// **'Switch persona'**
  String get demoSwitchPersona;

  /// No description provided for @demoSimulate.
  ///
  /// In en, this message translates to:
  /// **'Simulation'**
  String get demoSimulate;

  /// No description provided for @demoOffline.
  ///
  /// In en, this message translates to:
  /// **'Simulate offline'**
  String get demoOffline;

  /// No description provided for @demoSlowNetwork.
  ///
  /// In en, this message translates to:
  /// **'Slow network'**
  String get demoSlowNetwork;

  /// No description provided for @demoFailureMode.
  ///
  /// In en, this message translates to:
  /// **'Inject failures'**
  String get demoFailureMode;

  /// No description provided for @demoFailureNone.
  ///
  /// In en, this message translates to:
  /// **'None'**
  String get demoFailureNone;

  /// No description provided for @demoFailureTimeout.
  ///
  /// In en, this message translates to:
  /// **'Timeouts'**
  String get demoFailureTimeout;

  /// No description provided for @demoFailureServer.
  ///
  /// In en, this message translates to:
  /// **'Server errors (500)'**
  String get demoFailureServer;

  /// No description provided for @demoFailureConflict.
  ///
  /// In en, this message translates to:
  /// **'Conflicts (409)'**
  String get demoFailureConflict;

  /// No description provided for @demoData.
  ///
  /// In en, this message translates to:
  /// **'Data'**
  String get demoData;

  /// No description provided for @demoResetData.
  ///
  /// In en, this message translates to:
  /// **'Reset demo data'**
  String get demoResetData;

  /// No description provided for @demoResetConfirmTitle.
  ///
  /// In en, this message translates to:
  /// **'Reset demo data?'**
  String get demoResetConfirmTitle;

  /// No description provided for @demoResetConfirmMessage.
  ///
  /// In en, this message translates to:
  /// **'All changes are erased and you are signed out.'**
  String get demoResetConfirmMessage;

  /// No description provided for @demoPersonaSwitched.
  ///
  /// In en, this message translates to:
  /// **'Switched to {name}'**
  String demoPersonaSwitched(String name);

  /// No description provided for @demoResetDone.
  ///
  /// In en, this message translates to:
  /// **'Demo data was reset'**
  String get demoResetDone;

  /// No description provided for @lockTitle.
  ///
  /// In en, this message translates to:
  /// **'App locked'**
  String get lockTitle;

  /// No description provided for @lockMessage.
  ///
  /// In en, this message translates to:
  /// **'Unlock with your fingerprint, face or screen lock to continue.'**
  String get lockMessage;

  /// No description provided for @lockReason.
  ///
  /// In en, this message translates to:
  /// **'Confirm it is you to open BOGCL OneOps'**
  String get lockReason;

  /// No description provided for @lockUnlock.
  ///
  /// In en, this message translates to:
  /// **'Unlock'**
  String get lockUnlock;

  /// No description provided for @lockFailed.
  ///
  /// In en, this message translates to:
  /// **'We could not verify you. Try again.'**
  String get lockFailed;

  /// No description provided for @settingsBiometric.
  ///
  /// In en, this message translates to:
  /// **'Biometric unlock'**
  String get settingsBiometric;

  /// No description provided for @settingsBiometricHint.
  ///
  /// In en, this message translates to:
  /// **'Ask for fingerprint, face or screen lock after 2 minutes in the background.'**
  String get settingsBiometricHint;

  /// No description provided for @moreOutbox.
  ///
  /// In en, this message translates to:
  /// **'Sync queue'**
  String get moreOutbox;

  /// No description provided for @outboxTitle.
  ///
  /// In en, this message translates to:
  /// **'Sync queue'**
  String get outboxTitle;

  /// No description provided for @outboxEmptyTitle.
  ///
  /// In en, this message translates to:
  /// **'Everything is synced'**
  String get outboxEmptyTitle;

  /// No description provided for @outboxEmptyMessage.
  ///
  /// In en, this message translates to:
  /// **'Actions you take offline wait here until they are sent.'**
  String get outboxEmptyMessage;

  /// No description provided for @outboxStatusPending.
  ///
  /// In en, this message translates to:
  /// **'Waiting to sync'**
  String get outboxStatusPending;

  /// No description provided for @outboxStatusSyncing.
  ///
  /// In en, this message translates to:
  /// **'Syncing'**
  String get outboxStatusSyncing;

  /// No description provided for @outboxStatusFailed.
  ///
  /// In en, this message translates to:
  /// **'Failed'**
  String get outboxStatusFailed;

  /// No description provided for @outboxRetry.
  ///
  /// In en, this message translates to:
  /// **'Retry'**
  String get outboxRetry;

  /// No description provided for @outboxDiscard.
  ///
  /// In en, this message translates to:
  /// **'Discard'**
  String get outboxDiscard;

  /// No description provided for @outboxDiscardTitle.
  ///
  /// In en, this message translates to:
  /// **'Discard this action?'**
  String get outboxDiscardTitle;

  /// No description provided for @outboxDiscardMessage.
  ///
  /// In en, this message translates to:
  /// **'It will not be sent and cannot be recovered.'**
  String get outboxDiscardMessage;

  /// No description provided for @outboxSyncNow.
  ///
  /// In en, this message translates to:
  /// **'Sync now'**
  String get outboxSyncNow;

  /// No description provided for @outboxFailedReason.
  ///
  /// In en, this message translates to:
  /// **'The server could not accept this action. You can retry it or discard it.'**
  String get outboxFailedReason;

  /// No description provided for @outboxWillRetry.
  ///
  /// In en, this message translates to:
  /// **'It will be sent automatically when you are back online.'**
  String get outboxWillRetry;

  /// No description provided for @outboxAttempts.
  ///
  /// In en, this message translates to:
  /// **'{count, plural, =1{1 attempt} other{{count} attempts}}'**
  String outboxAttempts(int count);

  /// No description provided for @navInbox.
  ///
  /// In en, this message translates to:
  /// **'Inbox'**
  String get navInbox;

  /// No description provided for @inboxTitle.
  ///
  /// In en, this message translates to:
  /// **'Inbox'**
  String get inboxTitle;

  /// No description provided for @inboxMarkAllRead.
  ///
  /// In en, this message translates to:
  /// **'Mark all as read'**
  String get inboxMarkAllRead;

  /// No description provided for @inboxMarkedAllRead.
  ///
  /// In en, this message translates to:
  /// **'All notifications marked as read'**
  String get inboxMarkedAllRead;

  /// No description provided for @inboxFilterAll.
  ///
  /// In en, this message translates to:
  /// **'All'**
  String get inboxFilterAll;

  /// No description provided for @inboxFilterApprovals.
  ///
  /// In en, this message translates to:
  /// **'Approvals'**
  String get inboxFilterApprovals;

  /// No description provided for @inboxFilterSafety.
  ///
  /// In en, this message translates to:
  /// **'Safety'**
  String get inboxFilterSafety;

  /// No description provided for @inboxFilterTransport.
  ///
  /// In en, this message translates to:
  /// **'Transport'**
  String get inboxFilterTransport;

  /// No description provided for @inboxFilterUnread.
  ///
  /// In en, this message translates to:
  /// **'Unread'**
  String get inboxFilterUnread;

  /// No description provided for @inboxEmptyTitle.
  ///
  /// In en, this message translates to:
  /// **'You\'re all caught up'**
  String get inboxEmptyTitle;

  /// No description provided for @inboxEmptyUnreadTitle.
  ///
  /// In en, this message translates to:
  /// **'No unread notifications'**
  String get inboxEmptyUnreadTitle;

  /// No description provided for @inboxEmptyMessage.
  ///
  /// In en, this message translates to:
  /// **'New notifications will appear here.'**
  String get inboxEmptyMessage;

  /// No description provided for @inboxAcknowledge.
  ///
  /// In en, this message translates to:
  /// **'Acknowledge'**
  String get inboxAcknowledge;

  /// No description provided for @inboxAckRequired.
  ///
  /// In en, this message translates to:
  /// **'Acknowledgement required'**
  String get inboxAckRequired;

  /// No description provided for @inboxAcknowledged.
  ///
  /// In en, this message translates to:
  /// **'Acknowledged'**
  String get inboxAcknowledged;

  /// No description provided for @inboxAckLabel.
  ///
  /// In en, this message translates to:
  /// **'Acknowledge notification'**
  String get inboxAckLabel;

  /// No description provided for @inboxReadLabel.
  ///
  /// In en, this message translates to:
  /// **'Mark notification as read'**
  String get inboxReadLabel;

  /// No description provided for @inboxReadAllLabel.
  ///
  /// In en, this message translates to:
  /// **'Mark all notifications as read'**
  String get inboxReadAllLabel;

  /// No description provided for @inboxLoadMoreFailed.
  ///
  /// In en, this message translates to:
  /// **'Couldn\'t load more. Scroll to try again.'**
  String get inboxLoadMoreFailed;

  /// No description provided for @inboxPriorityCritical.
  ///
  /// In en, this message translates to:
  /// **'Critical'**
  String get inboxPriorityCritical;

  /// No description provided for @inboxPriorityHigh.
  ///
  /// In en, this message translates to:
  /// **'High priority'**
  String get inboxPriorityHigh;

  /// No description provided for @inboxUnreadSemantics.
  ///
  /// In en, this message translates to:
  /// **'Unread'**
  String get inboxUnreadSemantics;

  /// No description provided for @commonClose.
  ///
  /// In en, this message translates to:
  /// **'Close'**
  String get commonClose;

  /// No description provided for @timeJustNow.
  ///
  /// In en, this message translates to:
  /// **'Just now'**
  String get timeJustNow;

  /// No description provided for @timeMinutesAgo.
  ///
  /// In en, this message translates to:
  /// **'{count, plural, =1{1 min ago} other{{count} min ago}}'**
  String timeMinutesAgo(int count);

  /// No description provided for @timeHoursAgo.
  ///
  /// In en, this message translates to:
  /// **'{count, plural, =1{1 hour ago} other{{count} hours ago}}'**
  String timeHoursAgo(int count);

  /// No description provided for @timeDaysAgo.
  ///
  /// In en, this message translates to:
  /// **'{count, plural, =1{1 day ago} other{{count} days ago}}'**
  String timeDaysAgo(int count);

  /// No description provided for @moreActivity.
  ///
  /// In en, this message translates to:
  /// **'My activity'**
  String get moreActivity;

  /// No description provided for @activityTitle.
  ///
  /// In en, this message translates to:
  /// **'My activity'**
  String get activityTitle;

  /// No description provided for @activityEmptyTitle.
  ///
  /// In en, this message translates to:
  /// **'No activity yet'**
  String get activityEmptyTitle;

  /// No description provided for @activityEmptyMessage.
  ///
  /// In en, this message translates to:
  /// **'Your sign-ins and changes will be listed here.'**
  String get activityEmptyMessage;

  /// No description provided for @activityLoginSuccess.
  ///
  /// In en, this message translates to:
  /// **'Signed in'**
  String get activityLoginSuccess;

  /// No description provided for @activityLoginFailed.
  ///
  /// In en, this message translates to:
  /// **'Failed sign-in attempt'**
  String get activityLoginFailed;

  /// No description provided for @activityLogout.
  ///
  /// In en, this message translates to:
  /// **'Signed out'**
  String get activityLogout;

  /// No description provided for @activityProfileUpdated.
  ///
  /// In en, this message translates to:
  /// **'Updated profile'**
  String get activityProfileUpdated;

  /// No description provided for @activityPreferencesUpdated.
  ///
  /// In en, this message translates to:
  /// **'Updated preferences'**
  String get activityPreferencesUpdated;

  /// No description provided for @activityNotificationAcked.
  ///
  /// In en, this message translates to:
  /// **'Acknowledged a notification'**
  String get activityNotificationAcked;

  /// No description provided for @activityOther.
  ///
  /// In en, this message translates to:
  /// **'Other activity'**
  String get activityOther;
}

class _AppL10nDelegate extends LocalizationsDelegate<AppL10n> {
  const _AppL10nDelegate();

  @override
  Future<AppL10n> load(Locale locale) {
    return SynchronousFuture<AppL10n>(lookupAppL10n(locale));
  }

  @override
  bool isSupported(Locale locale) =>
      <String>['bn', 'en'].contains(locale.languageCode);

  @override
  bool shouldReload(_AppL10nDelegate old) => false;
}

AppL10n lookupAppL10n(Locale locale) {
  // Lookup logic when only language code is specified.
  switch (locale.languageCode) {
    case 'bn':
      return AppL10nBn();
    case 'en':
      return AppL10nEn();
  }

  throw FlutterError(
    'AppL10n.delegate failed to load unsupported locale "$locale". This is likely '
    'an issue with the localizations generation tool. Please file an issue '
    'on GitHub with a reproducible sample app and the gen-l10n configuration '
    'that was used.',
  );
}
