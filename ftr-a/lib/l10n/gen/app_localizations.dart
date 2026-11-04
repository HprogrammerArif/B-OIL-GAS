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

  /// No description provided for @pickerTitle.
  ///
  /// In en, this message translates to:
  /// **'Add a file'**
  String get pickerTitle;

  /// No description provided for @pickerCamera.
  ///
  /// In en, this message translates to:
  /// **'Take a photo'**
  String get pickerCamera;

  /// No description provided for @pickerGallery.
  ///
  /// In en, this message translates to:
  /// **'Choose from gallery'**
  String get pickerGallery;

  /// No description provided for @pickerFiles.
  ///
  /// In en, this message translates to:
  /// **'Browse files'**
  String get pickerFiles;

  /// No description provided for @moreChangePhoto.
  ///
  /// In en, this message translates to:
  /// **'Change profile photo'**
  String get moreChangePhoto;

  /// No description provided for @photoUpdated.
  ///
  /// In en, this message translates to:
  /// **'Profile photo updated'**
  String get photoUpdated;

  /// No description provided for @uploadNeedsConnection.
  ///
  /// In en, this message translates to:
  /// **'Connect to the internet to upload this file.'**
  String get uploadNeedsConnection;

  /// No description provided for @uploadRejected.
  ///
  /// In en, this message translates to:
  /// **'This file can\'t be used. Check its type and size.'**
  String get uploadRejected;

  /// No description provided for @uploadBlocked.
  ///
  /// In en, this message translates to:
  /// **'This file was blocked by the virus scan.'**
  String get uploadBlocked;

  /// No description provided for @homeQuickActions.
  ///
  /// In en, this message translates to:
  /// **'Quick actions'**
  String get homeQuickActions;

  /// No description provided for @moduleLeave.
  ///
  /// In en, this message translates to:
  /// **'Leave'**
  String get moduleLeave;

  /// No description provided for @leaveTitle.
  ///
  /// In en, this message translates to:
  /// **'Leave'**
  String get leaveTitle;

  /// No description provided for @leaveApply.
  ///
  /// In en, this message translates to:
  /// **'Apply for leave'**
  String get leaveApply;

  /// No description provided for @leaveBalancesTitle.
  ///
  /// In en, this message translates to:
  /// **'My balances'**
  String get leaveBalancesTitle;

  /// No description provided for @leaveAvailable.
  ///
  /// In en, this message translates to:
  /// **'{days} left'**
  String leaveAvailable(String days);

  /// No description provided for @leaveBalanceDetail.
  ///
  /// In en, this message translates to:
  /// **'Used {used} of {total}'**
  String leaveBalanceDetail(String used, String total);

  /// No description provided for @leaveBalancePending.
  ///
  /// In en, this message translates to:
  /// **'{days} in review'**
  String leaveBalancePending(String days);

  /// No description provided for @leaveRequestsTitle.
  ///
  /// In en, this message translates to:
  /// **'My requests'**
  String get leaveRequestsTitle;

  /// No description provided for @leaveFilterAll.
  ///
  /// In en, this message translates to:
  /// **'All'**
  String get leaveFilterAll;

  /// No description provided for @leaveStatusPending.
  ///
  /// In en, this message translates to:
  /// **'Pending'**
  String get leaveStatusPending;

  /// No description provided for @leaveStatusApproved.
  ///
  /// In en, this message translates to:
  /// **'Approved'**
  String get leaveStatusApproved;

  /// No description provided for @leaveStatusRejected.
  ///
  /// In en, this message translates to:
  /// **'Rejected'**
  String get leaveStatusRejected;

  /// No description provided for @leaveStatusCancelled.
  ///
  /// In en, this message translates to:
  /// **'Cancelled'**
  String get leaveStatusCancelled;

  /// No description provided for @leaveEmptyTitle.
  ///
  /// In en, this message translates to:
  /// **'No leave requests'**
  String get leaveEmptyTitle;

  /// No description provided for @leaveEmptyMessage.
  ///
  /// In en, this message translates to:
  /// **'Apply for leave and follow its approval here.'**
  String get leaveEmptyMessage;

  /// No description provided for @leaveDaysCount.
  ///
  /// In en, this message translates to:
  /// **'{count, plural, =1{1 day} other{{count} days}}'**
  String leaveDaysCount(int count);

  /// No description provided for @leaveDaysFraction.
  ///
  /// In en, this message translates to:
  /// **'{value} days'**
  String leaveDaysFraction(String value);

  /// No description provided for @leaveHalfDay.
  ///
  /// In en, this message translates to:
  /// **'Half day'**
  String get leaveHalfDay;

  /// No description provided for @leaveHalfFirst.
  ///
  /// In en, this message translates to:
  /// **'First half'**
  String get leaveHalfFirst;

  /// No description provided for @leaveHalfSecond.
  ///
  /// In en, this message translates to:
  /// **'Second half'**
  String get leaveHalfSecond;

  /// No description provided for @leaveFormType.
  ///
  /// In en, this message translates to:
  /// **'Leave type'**
  String get leaveFormType;

  /// No description provided for @leaveFormFrom.
  ///
  /// In en, this message translates to:
  /// **'From'**
  String get leaveFormFrom;

  /// No description provided for @leaveFormTo.
  ///
  /// In en, this message translates to:
  /// **'To'**
  String get leaveFormTo;

  /// No description provided for @leaveFormHalfDay.
  ///
  /// In en, this message translates to:
  /// **'Half day'**
  String get leaveFormHalfDay;

  /// No description provided for @leaveFormReason.
  ///
  /// In en, this message translates to:
  /// **'Reason'**
  String get leaveFormReason;

  /// No description provided for @leaveFormReasonHint.
  ///
  /// In en, this message translates to:
  /// **'Why do you need leave?'**
  String get leaveFormReasonHint;

  /// No description provided for @leaveFormCounts.
  ///
  /// In en, this message translates to:
  /// **'Counts as {days}'**
  String leaveFormCounts(String days);

  /// No description provided for @leaveFormAttachment.
  ///
  /// In en, this message translates to:
  /// **'Supporting document'**
  String get leaveFormAttachment;

  /// No description provided for @leaveFormAttachRequired.
  ///
  /// In en, this message translates to:
  /// **'Required for this leave'**
  String get leaveFormAttachRequired;

  /// No description provided for @leaveFormAttach.
  ///
  /// In en, this message translates to:
  /// **'Attach document'**
  String get leaveFormAttach;

  /// No description provided for @leaveFormRemove.
  ///
  /// In en, this message translates to:
  /// **'Remove'**
  String get leaveFormRemove;

  /// No description provided for @leaveFormSubmit.
  ///
  /// In en, this message translates to:
  /// **'Submit request'**
  String get leaveFormSubmit;

  /// No description provided for @leaveFormNoWorkingDays.
  ///
  /// In en, this message translates to:
  /// **'The selected dates are all weekends or holidays.'**
  String get leaveFormNoWorkingDays;

  /// No description provided for @leaveFormReasonMin.
  ///
  /// In en, this message translates to:
  /// **'Enter at least {min} characters'**
  String leaveFormReasonMin(int min);

  /// No description provided for @leaveFormBalanceShort.
  ///
  /// In en, this message translates to:
  /// **'Only {days} available for this leave type.'**
  String leaveFormBalanceShort(String days);

  /// No description provided for @leaveFormClLimit.
  ///
  /// In en, this message translates to:
  /// **'Casual leave is limited to {max} consecutive days.'**
  String leaveFormClLimit(int max);

  /// No description provided for @leaveFormBackdate.
  ///
  /// In en, this message translates to:
  /// **'Only sick or unpaid leave can start up to {days} days in the past.'**
  String leaveFormBackdate(int days);

  /// No description provided for @leaveFormHrReview.
  ///
  /// In en, this message translates to:
  /// **'This request also needs HR review.'**
  String get leaveFormHrReview;

  /// No description provided for @leaveFormUninformed.
  ///
  /// In en, this message translates to:
  /// **'Filed after the start date; it will be marked uninformed.'**
  String get leaveFormUninformed;

  /// No description provided for @leaveSubmitted.
  ///
  /// In en, this message translates to:
  /// **'Request submitted to your manager.'**
  String get leaveSubmitted;

  /// No description provided for @leaveQueued.
  ///
  /// In en, this message translates to:
  /// **'Saved offline. It will be submitted when you are back online.'**
  String get leaveQueued;

  /// No description provided for @leaveErrInsufficient.
  ///
  /// In en, this message translates to:
  /// **'You do not have enough balance for this leave.'**
  String get leaveErrInsufficient;

  /// No description provided for @leaveErrOverlap.
  ///
  /// In en, this message translates to:
  /// **'You already have leave on these dates.'**
  String get leaveErrOverlap;

  /// No description provided for @leaveErrFailed.
  ///
  /// In en, this message translates to:
  /// **'Could not submit the request. Please try again.'**
  String get leaveErrFailed;

  /// No description provided for @leaveQueueLabel.
  ///
  /// In en, this message translates to:
  /// **'Leave: {type}, {range}'**
  String leaveQueueLabel(String type, String range);

  /// No description provided for @leaveDetailTitle.
  ///
  /// In en, this message translates to:
  /// **'Leave request'**
  String get leaveDetailTitle;

  /// No description provided for @leaveDetailPeriod.
  ///
  /// In en, this message translates to:
  /// **'Period'**
  String get leaveDetailPeriod;

  /// No description provided for @leaveDetailDuration.
  ///
  /// In en, this message translates to:
  /// **'Duration'**
  String get leaveDetailDuration;

  /// No description provided for @leaveDetailReason.
  ///
  /// In en, this message translates to:
  /// **'Reason'**
  String get leaveDetailReason;

  /// No description provided for @leaveDetailReviewedBy.
  ///
  /// In en, this message translates to:
  /// **'Reviewed by {name}'**
  String leaveDetailReviewedBy(String name);

  /// No description provided for @leaveDetailComment.
  ///
  /// In en, this message translates to:
  /// **'Reviewer comment'**
  String get leaveDetailComment;

  /// No description provided for @leaveDetailRoute.
  ///
  /// In en, this message translates to:
  /// **'Approval route'**
  String get leaveDetailRoute;

  /// No description provided for @leaveDetailAttachment.
  ///
  /// In en, this message translates to:
  /// **'Attachment'**
  String get leaveDetailAttachment;

  /// No description provided for @leaveCancel.
  ///
  /// In en, this message translates to:
  /// **'Cancel request'**
  String get leaveCancel;

  /// No description provided for @leaveCancelTitle.
  ///
  /// In en, this message translates to:
  /// **'Cancel this leave request?'**
  String get leaveCancelTitle;

  /// No description provided for @leaveCancelPending.
  ///
  /// In en, this message translates to:
  /// **'Your manager will be told you withdrew it.'**
  String get leaveCancelPending;

  /// No description provided for @leaveCancelApproved.
  ///
  /// In en, this message translates to:
  /// **'The days go back to your balance.'**
  String get leaveCancelApproved;

  /// No description provided for @leaveCancelKeep.
  ///
  /// In en, this message translates to:
  /// **'Keep request'**
  String get leaveCancelKeep;

  /// No description provided for @leaveCancelled.
  ///
  /// In en, this message translates to:
  /// **'Request cancelled.'**
  String get leaveCancelled;

  /// No description provided for @leaveCancelQueued.
  ///
  /// In en, this message translates to:
  /// **'Saved offline. It will be cancelled when you are back online.'**
  String get leaveCancelQueued;

  /// No description provided for @leaveCancelFailed.
  ///
  /// In en, this message translates to:
  /// **'Could not cancel the request. Please try again.'**
  String get leaveCancelFailed;

  /// No description provided for @workflowStepSubmitted.
  ///
  /// In en, this message translates to:
  /// **'Submitted'**
  String get workflowStepSubmitted;

  /// No description provided for @workflowStepManager.
  ///
  /// In en, this message translates to:
  /// **'Line manager'**
  String get workflowStepManager;

  /// No description provided for @workflowStepHr.
  ///
  /// In en, this message translates to:
  /// **'HR review'**
  String get workflowStepHr;

  /// No description provided for @workflowStepWaiting.
  ///
  /// In en, this message translates to:
  /// **'Waiting for {names}'**
  String workflowStepWaiting(String names);

  /// No description provided for @workflowStepUpNext.
  ///
  /// In en, this message translates to:
  /// **'Up next'**
  String get workflowStepUpNext;

  /// No description provided for @workflowStepApprovedBy.
  ///
  /// In en, this message translates to:
  /// **'Approved by {name}'**
  String workflowStepApprovedBy(String name);

  /// No description provided for @workflowStepRejectedBy.
  ///
  /// In en, this message translates to:
  /// **'Rejected by {name}'**
  String workflowStepRejectedBy(String name);

  /// No description provided for @workflowStepSkipped.
  ///
  /// In en, this message translates to:
  /// **'Not needed'**
  String get workflowStepSkipped;

  /// No description provided for @moduleAttendance.
  ///
  /// In en, this message translates to:
  /// **'Attendance'**
  String get moduleAttendance;

  /// No description provided for @attTitle.
  ///
  /// In en, this message translates to:
  /// **'Attendance'**
  String get attTitle;

  /// No description provided for @attShiftLine.
  ///
  /// In en, this message translates to:
  /// **'{name} · {start}–{end}'**
  String attShiftLine(String name, String start, String end);

  /// No description provided for @attIn.
  ///
  /// In en, this message translates to:
  /// **'In'**
  String get attIn;

  /// No description provided for @attOut.
  ///
  /// In en, this message translates to:
  /// **'Out'**
  String get attOut;

  /// No description provided for @attWorked.
  ///
  /// In en, this message translates to:
  /// **'Worked'**
  String get attWorked;

  /// No description provided for @attDuration.
  ///
  /// In en, this message translates to:
  /// **'{h}h {m}m'**
  String attDuration(int h, String m);

  /// No description provided for @attPunchIn.
  ///
  /// In en, this message translates to:
  /// **'Punch in'**
  String get attPunchIn;

  /// No description provided for @attPunchOut.
  ///
  /// In en, this message translates to:
  /// **'Punch out'**
  String get attPunchOut;

  /// No description provided for @attLocating.
  ///
  /// In en, this message translates to:
  /// **'Getting your location…'**
  String get attLocating;

  /// No description provided for @attRecording.
  ///
  /// In en, this message translates to:
  /// **'Recording…'**
  String get attRecording;

  /// No description provided for @attPunchQueued.
  ///
  /// In en, this message translates to:
  /// **'Saved offline. Your punch time is kept and will sync when you are online.'**
  String get attPunchQueued;

  /// No description provided for @attPunchFailed.
  ///
  /// In en, this message translates to:
  /// **'Could not record your punch. Please try again.'**
  String get attPunchFailed;

  /// No description provided for @attOnLeaveToday.
  ///
  /// In en, this message translates to:
  /// **'You are on approved leave today.'**
  String get attOnLeaveToday;

  /// No description provided for @attLateBy.
  ///
  /// In en, this message translates to:
  /// **'Late by {minutes} min'**
  String attLateBy(int minutes);

  /// No description provided for @attPendingReview.
  ///
  /// In en, this message translates to:
  /// **'Awaiting review'**
  String get attPendingReview;

  /// No description provided for @attMissingOut.
  ///
  /// In en, this message translates to:
  /// **'Out missing'**
  String get attMissingOut;

  /// No description provided for @attOvertimeMtd.
  ///
  /// In en, this message translates to:
  /// **'Overtime {duration}'**
  String attOvertimeMtd(String duration);

  /// No description provided for @attStatusPresent.
  ///
  /// In en, this message translates to:
  /// **'Present'**
  String get attStatusPresent;

  /// No description provided for @attStatusLate.
  ///
  /// In en, this message translates to:
  /// **'Late'**
  String get attStatusLate;

  /// No description provided for @attStatusEarlyLeave.
  ///
  /// In en, this message translates to:
  /// **'Early leave'**
  String get attStatusEarlyLeave;

  /// No description provided for @attStatusHalfDay.
  ///
  /// In en, this message translates to:
  /// **'Half day'**
  String get attStatusHalfDay;

  /// No description provided for @attStatusAbsent.
  ///
  /// In en, this message translates to:
  /// **'Absent'**
  String get attStatusAbsent;

  /// No description provided for @attStatusOnLeave.
  ///
  /// In en, this message translates to:
  /// **'On leave'**
  String get attStatusOnLeave;

  /// No description provided for @attStatusHoliday.
  ///
  /// In en, this message translates to:
  /// **'Holiday'**
  String get attStatusHoliday;

  /// No description provided for @attStatusWeekend.
  ///
  /// In en, this message translates to:
  /// **'Weekend'**
  String get attStatusWeekend;

  /// No description provided for @attStatusFieldDuty.
  ///
  /// In en, this message translates to:
  /// **'Field duty'**
  String get attStatusFieldDuty;

  /// No description provided for @attStatusNone.
  ///
  /// In en, this message translates to:
  /// **'No record'**
  String get attStatusNone;

  /// No description provided for @attDaysTitle.
  ///
  /// In en, this message translates to:
  /// **'Daily record'**
  String get attDaysTitle;

  /// No description provided for @attPrevMonth.
  ///
  /// In en, this message translates to:
  /// **'Previous month'**
  String get attPrevMonth;

  /// No description provided for @attNextMonth.
  ///
  /// In en, this message translates to:
  /// **'Next month'**
  String get attNextMonth;

  /// No description provided for @attSumPresent.
  ///
  /// In en, this message translates to:
  /// **'Present'**
  String get attSumPresent;

  /// No description provided for @attSumLate.
  ///
  /// In en, this message translates to:
  /// **'Late'**
  String get attSumLate;

  /// No description provided for @attSumAbsent.
  ///
  /// In en, this message translates to:
  /// **'Absent'**
  String get attSumAbsent;

  /// No description provided for @attSumLeave.
  ///
  /// In en, this message translates to:
  /// **'Leave'**
  String get attSumLeave;

  /// No description provided for @attEmptyTitle.
  ///
  /// In en, this message translates to:
  /// **'No records yet'**
  String get attEmptyTitle;

  /// No description provided for @attEmptyMessage.
  ///
  /// In en, this message translates to:
  /// **'Your attendance for this month will appear here.'**
  String get attEmptyMessage;

  /// No description provided for @attDayPunches.
  ///
  /// In en, this message translates to:
  /// **'Punches'**
  String get attDayPunches;

  /// No description provided for @attNoPunches.
  ///
  /// In en, this message translates to:
  /// **'No punches on this day.'**
  String get attNoPunches;

  /// No description provided for @attPunchAccepted.
  ///
  /// In en, this message translates to:
  /// **'Accepted'**
  String get attPunchAccepted;

  /// No description provided for @attPunchPending.
  ///
  /// In en, this message translates to:
  /// **'Pending approval'**
  String get attPunchPending;

  /// No description provided for @attPunchRejected.
  ///
  /// In en, this message translates to:
  /// **'Rejected'**
  String get attPunchRejected;

  /// No description provided for @attRegsTitle.
  ///
  /// In en, this message translates to:
  /// **'My requests'**
  String get attRegsTitle;

  /// No description provided for @attRegularise.
  ///
  /// In en, this message translates to:
  /// **'Request regularisation'**
  String get attRegularise;

  /// No description provided for @attClose.
  ///
  /// In en, this message translates to:
  /// **'Close'**
  String get attClose;

  /// No description provided for @attTryAgain.
  ///
  /// In en, this message translates to:
  /// **'Try again'**
  String get attTryAgain;

  /// No description provided for @attOpenSettings.
  ///
  /// In en, this message translates to:
  /// **'Open settings'**
  String get attOpenSettings;

  /// No description provided for @attLocTitle.
  ///
  /// In en, this message translates to:
  /// **'Location needed'**
  String get attLocTitle;

  /// No description provided for @attLocServiceOff.
  ///
  /// In en, this message translates to:
  /// **'Turn on location services to punch.'**
  String get attLocServiceOff;

  /// No description provided for @attLocDenied.
  ///
  /// In en, this message translates to:
  /// **'Location permission is needed to punch.'**
  String get attLocDenied;

  /// No description provided for @attLocDeniedForever.
  ///
  /// In en, this message translates to:
  /// **'Location is blocked for this app. Open settings to allow it.'**
  String get attLocDeniedForever;

  /// No description provided for @attLocUnavailable.
  ///
  /// In en, this message translates to:
  /// **'Could not get your location. Try again.'**
  String get attLocUnavailable;

  /// No description provided for @attResultInTitle.
  ///
  /// In en, this message translates to:
  /// **'Punched in'**
  String get attResultInTitle;

  /// No description provided for @attResultOutTitle.
  ///
  /// In en, this message translates to:
  /// **'Punched out'**
  String get attResultOutTitle;

  /// No description provided for @attResultDuplicate.
  ///
  /// In en, this message translates to:
  /// **'Already recorded'**
  String get attResultDuplicate;

  /// No description provided for @attResultOk.
  ///
  /// In en, this message translates to:
  /// **'Your punch was recorded.'**
  String get attResultOk;

  /// No description provided for @attResultAtSite.
  ///
  /// In en, this message translates to:
  /// **'Recorded at {site}.'**
  String attResultAtSite(String site);

  /// No description provided for @attResultPendingTitle.
  ///
  /// In en, this message translates to:
  /// **'Sent for approval'**
  String get attResultPendingTitle;

  /// No description provided for @attResultPendingMessage.
  ///
  /// In en, this message translates to:
  /// **'You punched away from the site. Your line manager will review it as field duty.'**
  String get attResultPendingMessage;

  /// No description provided for @attResultOutsideTitle.
  ///
  /// In en, this message translates to:
  /// **'You are outside the site'**
  String get attResultOutsideTitle;

  /// No description provided for @attResultOutsideMessage.
  ///
  /// In en, this message translates to:
  /// **'You are {distance} m from {site}. Move closer, or request regularisation if you are on duty elsewhere.'**
  String attResultOutsideMessage(int distance, String site);

  /// No description provided for @attResultAccuracyTitle.
  ///
  /// In en, this message translates to:
  /// **'Location not accurate enough'**
  String get attResultAccuracyTitle;

  /// No description provided for @attResultAccuracyMessage.
  ///
  /// In en, this message translates to:
  /// **'Move to open sky and try again.'**
  String get attResultAccuracyMessage;

  /// No description provided for @attResultMockTitle.
  ///
  /// In en, this message translates to:
  /// **'Mock location detected'**
  String get attResultMockTitle;

  /// No description provided for @attResultMockMessage.
  ///
  /// In en, this message translates to:
  /// **'Turn off mock locations and try again. This attempt was recorded for review.'**
  String get attResultMockMessage;

  /// No description provided for @attRegTitle.
  ///
  /// In en, this message translates to:
  /// **'Attendance request'**
  String get attRegTitle;

  /// No description provided for @attRegType.
  ///
  /// In en, this message translates to:
  /// **'Request type'**
  String get attRegType;

  /// No description provided for @attRegTypeMissed.
  ///
  /// In en, this message translates to:
  /// **'Missed punch'**
  String get attRegTypeMissed;

  /// No description provided for @attRegTypeField.
  ///
  /// In en, this message translates to:
  /// **'Field duty'**
  String get attRegTypeField;

  /// No description provided for @attRegTypeLate.
  ///
  /// In en, this message translates to:
  /// **'Late justification'**
  String get attRegTypeLate;

  /// No description provided for @attRegTypeRemote.
  ///
  /// In en, this message translates to:
  /// **'Remote work'**
  String get attRegTypeRemote;

  /// No description provided for @attRegDate.
  ///
  /// In en, this message translates to:
  /// **'Date'**
  String get attRegDate;

  /// No description provided for @attRegHintWindow.
  ///
  /// In en, this message translates to:
  /// **'You can file for the last {days} days.'**
  String attRegHintWindow(int days);

  /// No description provided for @attRegHintField.
  ///
  /// In en, this message translates to:
  /// **'Field duty can be filed up to {days} days ahead.'**
  String attRegHintField(int days);

  /// No description provided for @attRegIn.
  ///
  /// In en, this message translates to:
  /// **'In time'**
  String get attRegIn;

  /// No description provided for @attRegOut.
  ///
  /// In en, this message translates to:
  /// **'Out time'**
  String get attRegOut;

  /// No description provided for @attRegReason.
  ///
  /// In en, this message translates to:
  /// **'Reason'**
  String get attRegReason;

  /// No description provided for @attRegReasonHint.
  ///
  /// In en, this message translates to:
  /// **'Explain what happened'**
  String get attRegReasonHint;

  /// No description provided for @attRegReasonMin.
  ///
  /// In en, this message translates to:
  /// **'Reason must be at least {min} characters'**
  String attRegReasonMin(int min);

  /// No description provided for @attRegSubmit.
  ///
  /// In en, this message translates to:
  /// **'Submit request'**
  String get attRegSubmit;

  /// No description provided for @attRegSubmitted.
  ///
  /// In en, this message translates to:
  /// **'Request sent for approval'**
  String get attRegSubmitted;

  /// No description provided for @attRegQueued.
  ///
  /// In en, this message translates to:
  /// **'Saved offline. It will be sent when you are back online.'**
  String get attRegQueued;

  /// No description provided for @attRegQueueLabel.
  ///
  /// In en, this message translates to:
  /// **'Attendance request, {date}'**
  String attRegQueueLabel(String date);

  /// No description provided for @attRegErrDuplicate.
  ///
  /// In en, this message translates to:
  /// **'A request for this day is already pending.'**
  String get attRegErrDuplicate;

  /// No description provided for @attRegErrWindow.
  ///
  /// In en, this message translates to:
  /// **'Choose a date within the last {days} days.'**
  String attRegErrWindow(int days);

  /// No description provided for @attRegErrTimes.
  ///
  /// In en, this message translates to:
  /// **'Out time must be after in time.'**
  String get attRegErrTimes;

  /// No description provided for @attRegErrMissedTime.
  ///
  /// In en, this message translates to:
  /// **'Enter the time you missed.'**
  String get attRegErrMissedTime;

  /// No description provided for @attRegErrFailed.
  ///
  /// In en, this message translates to:
  /// **'Could not submit the request. Please try again.'**
  String get attRegErrFailed;

  /// No description provided for @demoLocation.
  ///
  /// In en, this message translates to:
  /// **'Punch location'**
  String get demoLocation;

  /// No description provided for @demoLocationDevice.
  ///
  /// In en, this message translates to:
  /// **'Phone GPS'**
  String get demoLocationDevice;

  /// No description provided for @demoLocationHq.
  ///
  /// In en, this message translates to:
  /// **'At Head Office'**
  String get demoLocationHq;

  /// No description provided for @demoLocationPlant.
  ///
  /// In en, this message translates to:
  /// **'At Plant'**
  String get demoLocationPlant;

  /// No description provided for @demoLocationOutside.
  ///
  /// In en, this message translates to:
  /// **'Outside site'**
  String get demoLocationOutside;

  /// No description provided for @demoLocationMock.
  ///
  /// In en, this message translates to:
  /// **'Mock GPS'**
  String get demoLocationMock;

  /// No description provided for @moduleNotices.
  ///
  /// In en, this message translates to:
  /// **'Notices'**
  String get moduleNotices;

  /// No description provided for @moduleClaims.
  ///
  /// In en, this message translates to:
  /// **'Claims'**
  String get moduleClaims;

  /// No description provided for @moduleBus.
  ///
  /// In en, this message translates to:
  /// **'Staff bus'**
  String get moduleBus;

  /// No description provided for @noticesTitle.
  ///
  /// In en, this message translates to:
  /// **'Notices'**
  String get noticesTitle;

  /// No description provided for @noticeFilterAll.
  ///
  /// In en, this message translates to:
  /// **'All'**
  String get noticeFilterAll;

  /// No description provided for @noticeFilterUnread.
  ///
  /// In en, this message translates to:
  /// **'Unread'**
  String get noticeFilterUnread;

  /// No description provided for @noticeFilterUnreadCount.
  ///
  /// In en, this message translates to:
  /// **'Unread ({count})'**
  String noticeFilterUnreadCount(int count);

  /// No description provided for @noticeFilterAck.
  ///
  /// In en, this message translates to:
  /// **'To acknowledge'**
  String get noticeFilterAck;

  /// No description provided for @noticeFilterAckCount.
  ///
  /// In en, this message translates to:
  /// **'To acknowledge ({count})'**
  String noticeFilterAckCount(int count);

  /// No description provided for @noticeFilterMine.
  ///
  /// In en, this message translates to:
  /// **'Published by me'**
  String get noticeFilterMine;

  /// No description provided for @noticeCompose.
  ///
  /// In en, this message translates to:
  /// **'New notice'**
  String get noticeCompose;

  /// No description provided for @noticeEmptyTitle.
  ///
  /// In en, this message translates to:
  /// **'No notices'**
  String get noticeEmptyTitle;

  /// No description provided for @noticeEmptyMessage.
  ///
  /// In en, this message translates to:
  /// **'New notices from your organisation will appear here.'**
  String get noticeEmptyMessage;

  /// No description provided for @noticeUnread.
  ///
  /// In en, this message translates to:
  /// **'New'**
  String get noticeUnread;

  /// No description provided for @noticeNeedsAck.
  ///
  /// In en, this message translates to:
  /// **'Acknowledge'**
  String get noticeNeedsAck;

  /// No description provided for @noticePinned.
  ///
  /// In en, this message translates to:
  /// **'Pinned'**
  String get noticePinned;

  /// No description provided for @noticeDetailTitle.
  ///
  /// In en, this message translates to:
  /// **'Notice'**
  String get noticeDetailTitle;

  /// No description provided for @noticeNotFound.
  ///
  /// In en, this message translates to:
  /// **'Notice not found'**
  String get noticeNotFound;

  /// No description provided for @noticeNotFoundMessage.
  ///
  /// In en, this message translates to:
  /// **'It may have expired or is not meant for you.'**
  String get noticeNotFoundMessage;

  /// No description provided for @noticeAcked.
  ///
  /// In en, this message translates to:
  /// **'Acknowledged'**
  String get noticeAcked;

  /// No description provided for @noticeAckFailed.
  ///
  /// In en, this message translates to:
  /// **'Could not acknowledge. Try again.'**
  String get noticeAckFailed;

  /// No description provided for @noticeAckAction.
  ///
  /// In en, this message translates to:
  /// **'I have read and understood'**
  String get noticeAckAction;

  /// No description provided for @noticeAckedOn.
  ///
  /// In en, this message translates to:
  /// **'Acknowledged on {date}'**
  String noticeAckedOn(String date);

  /// No description provided for @noticeAudience.
  ///
  /// In en, this message translates to:
  /// **'For: {name}'**
  String noticeAudience(String name);

  /// No description provided for @noticeReach.
  ///
  /// In en, this message translates to:
  /// **'Reach'**
  String get noticeReach;

  /// No description provided for @noticeReadStat.
  ///
  /// In en, this message translates to:
  /// **'Read {read} of {total}'**
  String noticeReadStat(int read, int total);

  /// No description provided for @noticeAckStat.
  ///
  /// In en, this message translates to:
  /// **'Acknowledged {ack} of {total}'**
  String noticeAckStat(int ack, int total);

  /// No description provided for @noticeViewReceipts.
  ///
  /// In en, this message translates to:
  /// **'Who has read this'**
  String get noticeViewReceipts;

  /// No description provided for @noticeReceiptAcked.
  ///
  /// In en, this message translates to:
  /// **'Acknowledged'**
  String get noticeReceiptAcked;

  /// No description provided for @noticeReceiptRead.
  ///
  /// In en, this message translates to:
  /// **'Read {date}'**
  String noticeReceiptRead(String date);

  /// No description provided for @noticeReceiptUnread.
  ///
  /// In en, this message translates to:
  /// **'Not read'**
  String get noticeReceiptUnread;

  /// No description provided for @noticeCatGeneral.
  ///
  /// In en, this message translates to:
  /// **'General'**
  String get noticeCatGeneral;

  /// No description provided for @noticeCatPolicy.
  ///
  /// In en, this message translates to:
  /// **'Policy'**
  String get noticeCatPolicy;

  /// No description provided for @noticeCatSafety.
  ///
  /// In en, this message translates to:
  /// **'Safety'**
  String get noticeCatSafety;

  /// No description provided for @noticeCatOperations.
  ///
  /// In en, this message translates to:
  /// **'Operations'**
  String get noticeCatOperations;

  /// No description provided for @noticeCatAdmin.
  ///
  /// In en, this message translates to:
  /// **'Administration'**
  String get noticeCatAdmin;

  /// No description provided for @noticeCatHr.
  ///
  /// In en, this message translates to:
  /// **'HR'**
  String get noticeCatHr;

  /// No description provided for @noticeCatExecutive.
  ///
  /// In en, this message translates to:
  /// **'Executive'**
  String get noticeCatExecutive;

  /// No description provided for @noticePrioNormal.
  ///
  /// In en, this message translates to:
  /// **'Normal'**
  String get noticePrioNormal;

  /// No description provided for @noticePrioHigh.
  ///
  /// In en, this message translates to:
  /// **'High'**
  String get noticePrioHigh;

  /// No description provided for @noticePrioCritical.
  ///
  /// In en, this message translates to:
  /// **'Critical'**
  String get noticePrioCritical;

  /// No description provided for @noticeFieldCategory.
  ///
  /// In en, this message translates to:
  /// **'Category'**
  String get noticeFieldCategory;

  /// No description provided for @noticeFieldTitle.
  ///
  /// In en, this message translates to:
  /// **'Title'**
  String get noticeFieldTitle;

  /// No description provided for @noticeFieldBody.
  ///
  /// In en, this message translates to:
  /// **'Message'**
  String get noticeFieldBody;

  /// No description provided for @noticeFieldPriority.
  ///
  /// In en, this message translates to:
  /// **'Priority'**
  String get noticeFieldPriority;

  /// No description provided for @noticeFieldAudience.
  ///
  /// In en, this message translates to:
  /// **'Audience'**
  String get noticeFieldAudience;

  /// No description provided for @noticeFieldRequireAck.
  ///
  /// In en, this message translates to:
  /// **'Require acknowledgement'**
  String get noticeFieldRequireAck;

  /// No description provided for @noticeFieldPin.
  ///
  /// In en, this message translates to:
  /// **'Pin to the top'**
  String get noticeFieldPin;

  /// No description provided for @noticeCriticalHint.
  ///
  /// In en, this message translates to:
  /// **'Critical notices alert every recipient immediately.'**
  String get noticeCriticalHint;

  /// No description provided for @noticeAudAll.
  ///
  /// In en, this message translates to:
  /// **'Everyone'**
  String get noticeAudAll;

  /// No description provided for @noticeAudDepartment.
  ///
  /// In en, this message translates to:
  /// **'A department'**
  String get noticeAudDepartment;

  /// No description provided for @noticeAudSite.
  ///
  /// In en, this message translates to:
  /// **'A site'**
  String get noticeAudSite;

  /// No description provided for @noticePublish.
  ///
  /// In en, this message translates to:
  /// **'Publish'**
  String get noticePublish;

  /// No description provided for @noticePublishConfirmTitle.
  ///
  /// In en, this message translates to:
  /// **'Publish this notice?'**
  String get noticePublishConfirmTitle;

  /// No description provided for @noticePublishConfirmMessage.
  ///
  /// In en, this message translates to:
  /// **'Recipients are notified straight away. A published notice cannot be edited.'**
  String get noticePublishConfirmMessage;

  /// No description provided for @noticePublished.
  ///
  /// In en, this message translates to:
  /// **'Notice published'**
  String get noticePublished;

  /// No description provided for @noticeErrMaxPinned.
  ///
  /// In en, this message translates to:
  /// **'Five notices are already pinned. Unpin one first or publish without pinning.'**
  String get noticeErrMaxPinned;

  /// No description provided for @noticeErrForbidden.
  ///
  /// In en, this message translates to:
  /// **'You cannot publish to this audience or category.'**
  String get noticeErrForbidden;

  /// No description provided for @noticeErrFailed.
  ///
  /// In en, this message translates to:
  /// **'Could not publish. Check the form and try again.'**
  String get noticeErrFailed;

  /// No description provided for @claimsTitle.
  ///
  /// In en, this message translates to:
  /// **'Claims'**
  String get claimsTitle;

  /// No description provided for @claimTabClaims.
  ///
  /// In en, this message translates to:
  /// **'My claims'**
  String get claimTabClaims;

  /// No description provided for @claimTabAdvances.
  ///
  /// In en, this message translates to:
  /// **'Advances'**
  String get claimTabAdvances;

  /// No description provided for @claimTabPayable.
  ///
  /// In en, this message translates to:
  /// **'To pay'**
  String get claimTabPayable;

  /// No description provided for @claimNew.
  ///
  /// In en, this message translates to:
  /// **'New claim'**
  String get claimNew;

  /// No description provided for @claimNewTitle.
  ///
  /// In en, this message translates to:
  /// **'New claim'**
  String get claimNewTitle;

  /// No description provided for @claimEditTitle.
  ///
  /// In en, this message translates to:
  /// **'Edit claim'**
  String get claimEditTitle;

  /// No description provided for @claimDetailTitle.
  ///
  /// In en, this message translates to:
  /// **'Claim'**
  String get claimDetailTitle;

  /// No description provided for @claimEmptyTitle.
  ///
  /// In en, this message translates to:
  /// **'No claims yet'**
  String get claimEmptyTitle;

  /// No description provided for @claimEmptyMessage.
  ///
  /// In en, this message translates to:
  /// **'Tap New claim to file travel, conveyance or event expenses.'**
  String get claimEmptyMessage;

  /// No description provided for @claimTypeTada.
  ///
  /// In en, this message translates to:
  /// **'Travel and DA'**
  String get claimTypeTada;

  /// No description provided for @claimTypeConveyance.
  ///
  /// In en, this message translates to:
  /// **'Conveyance'**
  String get claimTypeConveyance;

  /// No description provided for @claimTypeTour.
  ///
  /// In en, this message translates to:
  /// **'Tour and event'**
  String get claimTypeTour;

  /// No description provided for @claimTypeTadaHint.
  ///
  /// In en, this message translates to:
  /// **'Official trips: tickets, hotel, meals and daily allowance'**
  String get claimTypeTadaHint;

  /// No description provided for @claimTypeConveyanceHint.
  ///
  /// In en, this message translates to:
  /// **'Local travel within a month: CNG, rickshaw, ride share'**
  String get claimTypeConveyanceHint;

  /// No description provided for @claimTypeTourHint.
  ///
  /// In en, this message translates to:
  /// **'Tours and events, with an optional advance to adjust'**
  String get claimTypeTourHint;

  /// No description provided for @claimStatusDraft.
  ///
  /// In en, this message translates to:
  /// **'Draft'**
  String get claimStatusDraft;

  /// No description provided for @claimStatusPendingManager.
  ///
  /// In en, this message translates to:
  /// **'With manager'**
  String get claimStatusPendingManager;

  /// No description provided for @claimStatusPendingFinance.
  ///
  /// In en, this message translates to:
  /// **'With Finance'**
  String get claimStatusPendingFinance;

  /// No description provided for @claimStatusApproved.
  ///
  /// In en, this message translates to:
  /// **'Approved'**
  String get claimStatusApproved;

  /// No description provided for @claimStatusSettled.
  ///
  /// In en, this message translates to:
  /// **'Paid'**
  String get claimStatusSettled;

  /// No description provided for @claimStatusReturned.
  ///
  /// In en, this message translates to:
  /// **'Returned'**
  String get claimStatusReturned;

  /// No description provided for @claimStatusRejected.
  ///
  /// In en, this message translates to:
  /// **'Rejected'**
  String get claimStatusRejected;

  /// No description provided for @claimStatusCancelled.
  ///
  /// In en, this message translates to:
  /// **'Cancelled'**
  String get claimStatusCancelled;

  /// No description provided for @claimCatDa.
  ///
  /// In en, this message translates to:
  /// **'Daily allowance'**
  String get claimCatDa;

  /// No description provided for @claimCatTicket.
  ///
  /// In en, this message translates to:
  /// **'Ticket'**
  String get claimCatTicket;

  /// No description provided for @claimCatHotel.
  ///
  /// In en, this message translates to:
  /// **'Hotel'**
  String get claimCatHotel;

  /// No description provided for @claimCatMeals.
  ///
  /// In en, this message translates to:
  /// **'Meals'**
  String get claimCatMeals;

  /// No description provided for @claimCatMileage.
  ///
  /// In en, this message translates to:
  /// **'Mileage'**
  String get claimCatMileage;

  /// No description provided for @claimCatCng.
  ///
  /// In en, this message translates to:
  /// **'CNG'**
  String get claimCatCng;

  /// No description provided for @claimCatRickshaw.
  ///
  /// In en, this message translates to:
  /// **'Rickshaw'**
  String get claimCatRickshaw;

  /// No description provided for @claimCatRideShare.
  ///
  /// In en, this message translates to:
  /// **'Ride share'**
  String get claimCatRideShare;

  /// No description provided for @claimCatBusFare.
  ///
  /// In en, this message translates to:
  /// **'Bus fare'**
  String get claimCatBusFare;

  /// No description provided for @claimCatEvent.
  ///
  /// In en, this message translates to:
  /// **'Event cost'**
  String get claimCatEvent;

  /// No description provided for @claimCatOther.
  ///
  /// In en, this message translates to:
  /// **'Other'**
  String get claimCatOther;

  /// No description provided for @claimModeNone.
  ///
  /// In en, this message translates to:
  /// **'Not specified'**
  String get claimModeNone;

  /// No description provided for @claimModeExecutiveCar.
  ///
  /// In en, this message translates to:
  /// **'Executive car'**
  String get claimModeExecutiveCar;

  /// No description provided for @claimModeCompanyCar.
  ///
  /// In en, this message translates to:
  /// **'Company car'**
  String get claimModeCompanyCar;

  /// No description provided for @claimModePoolCar.
  ///
  /// In en, this message translates to:
  /// **'Pool car'**
  String get claimModePoolCar;

  /// No description provided for @claimModeAir.
  ///
  /// In en, this message translates to:
  /// **'Domestic flight'**
  String get claimModeAir;

  /// No description provided for @claimModeAcTrain.
  ///
  /// In en, this message translates to:
  /// **'AC train'**
  String get claimModeAcTrain;

  /// No description provided for @claimModeFirstTrain.
  ///
  /// In en, this message translates to:
  /// **'First class train'**
  String get claimModeFirstTrain;

  /// No description provided for @claimModeTrain.
  ///
  /// In en, this message translates to:
  /// **'Train'**
  String get claimModeTrain;

  /// No description provided for @claimModeAcBus.
  ///
  /// In en, this message translates to:
  /// **'AC bus'**
  String get claimModeAcBus;

  /// No description provided for @claimModeBus.
  ///
  /// In en, this message translates to:
  /// **'Bus'**
  String get claimModeBus;

  /// No description provided for @claimPolicyTitle.
  ///
  /// In en, this message translates to:
  /// **'Your entitlements (band {band})'**
  String claimPolicyTitle(String band);

  /// No description provided for @claimPolicyConveyance.
  ///
  /// In en, this message translates to:
  /// **'Conveyance this month: {used} of {cap}'**
  String claimPolicyConveyance(String used, String cap);

  /// No description provided for @claimPolicyDa.
  ///
  /// In en, this message translates to:
  /// **'Daily allowance: {dhaka} Dhaka, {district} elsewhere'**
  String claimPolicyDa(String dhaka, String district);

  /// No description provided for @claimPolicyHotel.
  ///
  /// In en, this message translates to:
  /// **'Hotel up to {cap} per night'**
  String claimPolicyHotel(String cap);

  /// No description provided for @claimFieldPurpose.
  ///
  /// In en, this message translates to:
  /// **'Purpose'**
  String get claimFieldPurpose;

  /// No description provided for @claimFieldEmployee.
  ///
  /// In en, this message translates to:
  /// **'Employee'**
  String get claimFieldEmployee;

  /// No description provided for @claimFieldPeriod.
  ///
  /// In en, this message translates to:
  /// **'Period'**
  String get claimFieldPeriod;

  /// No description provided for @claimFieldPeriodFrom.
  ///
  /// In en, this message translates to:
  /// **'From'**
  String get claimFieldPeriodFrom;

  /// No description provided for @claimFieldPeriodTo.
  ///
  /// In en, this message translates to:
  /// **'To'**
  String get claimFieldPeriodTo;

  /// No description provided for @claimFieldDepart.
  ///
  /// In en, this message translates to:
  /// **'Departure'**
  String get claimFieldDepart;

  /// No description provided for @claimFieldReturn.
  ///
  /// In en, this message translates to:
  /// **'Return'**
  String get claimFieldReturn;

  /// No description provided for @claimFieldDestination.
  ///
  /// In en, this message translates to:
  /// **'Destination'**
  String get claimFieldDestination;

  /// No description provided for @claimFieldMode.
  ///
  /// In en, this message translates to:
  /// **'Travel mode'**
  String get claimFieldMode;

  /// No description provided for @claimFieldAdvance.
  ///
  /// In en, this message translates to:
  /// **'Advance to adjust'**
  String get claimFieldAdvance;

  /// No description provided for @claimAdvanceNone.
  ///
  /// In en, this message translates to:
  /// **'No advance'**
  String get claimAdvanceNone;

  /// No description provided for @claimDestDhaka.
  ///
  /// In en, this message translates to:
  /// **'Dhaka'**
  String get claimDestDhaka;

  /// No description provided for @claimDestOther.
  ///
  /// In en, this message translates to:
  /// **'Outside Dhaka'**
  String get claimDestOther;

  /// No description provided for @claimDaAuto.
  ///
  /// In en, this message translates to:
  /// **'Daily allowance is added automatically from your departure and return times.'**
  String get claimDaAuto;

  /// No description provided for @claimLines.
  ///
  /// In en, this message translates to:
  /// **'Expense lines ({count})'**
  String claimLines(int count);

  /// No description provided for @claimNoLinesYet.
  ///
  /// In en, this message translates to:
  /// **'No expenses added yet.'**
  String get claimNoLinesYet;

  /// No description provided for @claimLineAdd.
  ///
  /// In en, this message translates to:
  /// **'Add expense'**
  String get claimLineAdd;

  /// No description provided for @claimLineEdit.
  ///
  /// In en, this message translates to:
  /// **'Edit expense'**
  String get claimLineEdit;

  /// No description provided for @claimLineSave.
  ///
  /// In en, this message translates to:
  /// **'Save expense'**
  String get claimLineSave;

  /// No description provided for @claimLineAuto.
  ///
  /// In en, this message translates to:
  /// **'Auto'**
  String get claimLineAuto;

  /// No description provided for @claimLineDeclared.
  ///
  /// In en, this message translates to:
  /// **'Declared'**
  String get claimLineDeclared;

  /// No description provided for @claimFieldCategory.
  ///
  /// In en, this message translates to:
  /// **'Category'**
  String get claimFieldCategory;

  /// No description provided for @claimFieldDate.
  ///
  /// In en, this message translates to:
  /// **'Date'**
  String get claimFieldDate;

  /// No description provided for @claimFieldAmount.
  ///
  /// In en, this message translates to:
  /// **'Amount (BDT)'**
  String get claimFieldAmount;

  /// No description provided for @claimFieldNights.
  ///
  /// In en, this message translates to:
  /// **'Nights'**
  String get claimFieldNights;

  /// No description provided for @claimFieldDistance.
  ///
  /// In en, this message translates to:
  /// **'Distance (km)'**
  String get claimFieldDistance;

  /// No description provided for @claimFieldFrom.
  ///
  /// In en, this message translates to:
  /// **'From'**
  String get claimFieldFrom;

  /// No description provided for @claimFieldTo.
  ///
  /// In en, this message translates to:
  /// **'To'**
  String get claimFieldTo;

  /// No description provided for @claimFieldDescription.
  ///
  /// In en, this message translates to:
  /// **'Note'**
  String get claimFieldDescription;

  /// No description provided for @claimMileageHint.
  ///
  /// In en, this message translates to:
  /// **'Paid at {rate} per km'**
  String claimMileageHint(String rate);

  /// No description provided for @claimKm.
  ///
  /// In en, this message translates to:
  /// **'{km} km'**
  String claimKm(String km);

  /// No description provided for @claimReceiptHint.
  ///
  /// In en, this message translates to:
  /// **'A receipt is required above {amount}.'**
  String claimReceiptHint(String amount);

  /// No description provided for @claimReceiptAdd.
  ///
  /// In en, this message translates to:
  /// **'Add receipt photo'**
  String get claimReceiptAdd;

  /// No description provided for @claimReceiptAttached.
  ///
  /// In en, this message translates to:
  /// **'Receipt attached'**
  String get claimReceiptAttached;

  /// No description provided for @claimDeclaration.
  ///
  /// In en, this message translates to:
  /// **'No receipt, I declare this expense'**
  String get claimDeclaration;

  /// No description provided for @claimDeclarationHint.
  ///
  /// In en, this message translates to:
  /// **'Allowed for small CNG, rickshaw and meal expenses up to {amount}.'**
  String claimDeclarationHint(String amount);

  /// No description provided for @claimEnteredTotal.
  ///
  /// In en, this message translates to:
  /// **'Entered: {amount}'**
  String claimEnteredTotal(String amount);

  /// No description provided for @claimSaveDraft.
  ///
  /// In en, this message translates to:
  /// **'Save draft'**
  String get claimSaveDraft;

  /// No description provided for @claimSaved.
  ///
  /// In en, this message translates to:
  /// **'Draft saved'**
  String get claimSaved;

  /// No description provided for @claimErrRequired.
  ///
  /// In en, this message translates to:
  /// **'Required'**
  String get claimErrRequired;

  /// No description provided for @claimErrPurpose.
  ///
  /// In en, this message translates to:
  /// **'Enter at least 3 characters'**
  String get claimErrPurpose;

  /// No description provided for @claimErrDates.
  ///
  /// In en, this message translates to:
  /// **'Choose valid dates'**
  String get claimErrDates;

  /// No description provided for @claimErrAmount.
  ///
  /// In en, this message translates to:
  /// **'Enter a valid amount'**
  String get claimErrAmount;

  /// No description provided for @claimErrDistance.
  ///
  /// In en, this message translates to:
  /// **'Enter the distance in km'**
  String get claimErrDistance;

  /// No description provided for @claimErrNights.
  ///
  /// In en, this message translates to:
  /// **'Enter 1 to 60 nights'**
  String get claimErrNights;

  /// No description provided for @claimErrSave.
  ///
  /// In en, this message translates to:
  /// **'Could not save the claim. Check the details and try again.'**
  String get claimErrSave;

  /// No description provided for @claimErrOffline.
  ///
  /// In en, this message translates to:
  /// **'You are offline. Connect to the internet and try again.'**
  String get claimErrOffline;

  /// No description provided for @claimErrFailed.
  ///
  /// In en, this message translates to:
  /// **'Something went wrong. Try again.'**
  String get claimErrFailed;

  /// No description provided for @claimErrBlocked.
  ///
  /// In en, this message translates to:
  /// **'Fix the blocking checks before submitting.'**
  String get claimErrBlocked;

  /// No description provided for @claimTotal.
  ///
  /// In en, this message translates to:
  /// **'Total'**
  String get claimTotal;

  /// No description provided for @claimAdvanceAdjusted.
  ///
  /// In en, this message translates to:
  /// **'Advance adjusted'**
  String get claimAdvanceAdjusted;

  /// No description provided for @claimNetPayable.
  ///
  /// In en, this message translates to:
  /// **'Payable to you'**
  String get claimNetPayable;

  /// No description provided for @claimNetRefund.
  ///
  /// In en, this message translates to:
  /// **'To return to company'**
  String get claimNetRefund;

  /// No description provided for @claimVoucher.
  ///
  /// In en, this message translates to:
  /// **'Voucher'**
  String get claimVoucher;

  /// No description provided for @claimReviewerComment.
  ///
  /// In en, this message translates to:
  /// **'Reviewer comment'**
  String get claimReviewerComment;

  /// No description provided for @claimRoute.
  ///
  /// In en, this message translates to:
  /// **'Approval route'**
  String get claimRoute;

  /// No description provided for @claimSubmit.
  ///
  /// In en, this message translates to:
  /// **'Submit for approval'**
  String get claimSubmit;

  /// No description provided for @claimSubmitConfirmTitle.
  ///
  /// In en, this message translates to:
  /// **'Submit this claim?'**
  String get claimSubmitConfirmTitle;

  /// No description provided for @claimSubmitConfirmMessage.
  ///
  /// In en, this message translates to:
  /// **'It goes to your manager and then Finance. You cannot edit it while it is pending.'**
  String get claimSubmitConfirmMessage;

  /// No description provided for @claimSubmitted.
  ///
  /// In en, this message translates to:
  /// **'Claim submitted'**
  String get claimSubmitted;

  /// No description provided for @claimEdit.
  ///
  /// In en, this message translates to:
  /// **'Edit'**
  String get claimEdit;

  /// No description provided for @claimCancel.
  ///
  /// In en, this message translates to:
  /// **'Cancel claim'**
  String get claimCancel;

  /// No description provided for @claimCancelConfirm.
  ///
  /// In en, this message translates to:
  /// **'Cancel this claim?'**
  String get claimCancelConfirm;

  /// No description provided for @claimCancelled.
  ///
  /// In en, this message translates to:
  /// **'Claim cancelled'**
  String get claimCancelled;

  /// No description provided for @claimWithdraw.
  ///
  /// In en, this message translates to:
  /// **'Withdraw claim'**
  String get claimWithdraw;

  /// No description provided for @claimPay.
  ///
  /// In en, this message translates to:
  /// **'Mark as paid'**
  String get claimPay;

  /// No description provided for @claimPayConfirm.
  ///
  /// In en, this message translates to:
  /// **'Pay {amount}?'**
  String claimPayConfirm(String amount);

  /// No description provided for @claimPayMessage.
  ///
  /// In en, this message translates to:
  /// **'A voucher is created and the employee is notified. This cannot be undone.'**
  String get claimPayMessage;

  /// No description provided for @claimPaid.
  ///
  /// In en, this message translates to:
  /// **'Payment recorded'**
  String get claimPaid;

  /// No description provided for @claimFlagNoLines.
  ///
  /// In en, this message translates to:
  /// **'Add at least one expense line.'**
  String get claimFlagNoLines;

  /// No description provided for @claimFlagReceipt.
  ///
  /// In en, this message translates to:
  /// **'A receipt or declaration is missing on a line.'**
  String get claimFlagReceipt;

  /// No description provided for @claimFlagHotel.
  ///
  /// In en, this message translates to:
  /// **'Hotel is above the nightly limit. Eligible: {amount}.'**
  String claimFlagHotel(String amount);

  /// No description provided for @claimFlagConveyance.
  ///
  /// In en, this message translates to:
  /// **'Monthly conveyance limit exceeded. Eligible: {amount}.'**
  String claimFlagConveyance(String amount);

  /// No description provided for @claimFlagOverlap.
  ///
  /// In en, this message translates to:
  /// **'This period overlaps another claim.'**
  String get claimFlagOverlap;

  /// No description provided for @claimFlagDuplicate.
  ///
  /// In en, this message translates to:
  /// **'The same receipt is used more than once.'**
  String get claimFlagDuplicate;

  /// No description provided for @claimFlagLate.
  ///
  /// In en, this message translates to:
  /// **'Filed after the 60 day window.'**
  String get claimFlagLate;

  /// No description provided for @claimFlagMode.
  ///
  /// In en, this message translates to:
  /// **'Travel mode is above your entitlement. Finance will review.'**
  String get claimFlagMode;

  /// No description provided for @claimFlagMileage.
  ///
  /// In en, this message translates to:
  /// **'Long mileage trip. Finance will review.'**
  String get claimFlagMileage;

  /// No description provided for @advNew.
  ///
  /// In en, this message translates to:
  /// **'Request advance'**
  String get advNew;

  /// No description provided for @advNewTitle.
  ///
  /// In en, this message translates to:
  /// **'Tour advance'**
  String get advNewTitle;

  /// No description provided for @advIntro.
  ///
  /// In en, this message translates to:
  /// **'Request cash in advance for an upcoming tour. Adjust it against your tour claim afterwards.'**
  String get advIntro;

  /// No description provided for @advFieldAmount.
  ///
  /// In en, this message translates to:
  /// **'Amount (BDT)'**
  String get advFieldAmount;

  /// No description provided for @advFieldTourStart.
  ///
  /// In en, this message translates to:
  /// **'Tour starts'**
  String get advFieldTourStart;

  /// No description provided for @advFieldTourEnd.
  ///
  /// In en, this message translates to:
  /// **'Tour ends'**
  String get advFieldTourEnd;

  /// No description provided for @advErrAmount.
  ///
  /// In en, this message translates to:
  /// **'Enter an amount up to 5,00,000'**
  String get advErrAmount;

  /// No description provided for @advErrOverdue.
  ///
  /// In en, this message translates to:
  /// **'You have an earlier advance that is not yet settled. Settle it first.'**
  String get advErrOverdue;

  /// No description provided for @advErrFailed.
  ///
  /// In en, this message translates to:
  /// **'Could not request the advance. Try again.'**
  String get advErrFailed;

  /// No description provided for @advSubmit.
  ///
  /// In en, this message translates to:
  /// **'Submit request'**
  String get advSubmit;

  /// No description provided for @advSubmitted.
  ///
  /// In en, this message translates to:
  /// **'Advance requested'**
  String get advSubmitted;

  /// No description provided for @advEmptyTitle.
  ///
  /// In en, this message translates to:
  /// **'No advances'**
  String get advEmptyTitle;

  /// No description provided for @advEmptyMessage.
  ///
  /// In en, this message translates to:
  /// **'Request an advance before a tour.'**
  String get advEmptyMessage;

  /// No description provided for @advStatusDisbursed.
  ///
  /// In en, this message translates to:
  /// **'Disbursed'**
  String get advStatusDisbursed;

  /// No description provided for @advSettleHint.
  ///
  /// In en, this message translates to:
  /// **'Not yet adjusted. Link it to a tour claim.'**
  String get advSettleHint;

  /// No description provided for @advCancel.
  ///
  /// In en, this message translates to:
  /// **'Cancel request'**
  String get advCancel;

  /// No description provided for @advCancelConfirm.
  ///
  /// In en, this message translates to:
  /// **'Cancel this advance request?'**
  String get advCancelConfirm;

  /// No description provided for @advCancelled.
  ///
  /// In en, this message translates to:
  /// **'Advance cancelled'**
  String get advCancelled;

  /// No description provided for @advDisburse.
  ///
  /// In en, this message translates to:
  /// **'Disburse'**
  String get advDisburse;

  /// No description provided for @advDisburseConfirm.
  ///
  /// In en, this message translates to:
  /// **'Disburse {amount}?'**
  String advDisburseConfirm(String amount);

  /// No description provided for @advDisbursed.
  ///
  /// In en, this message translates to:
  /// **'Advance disbursed'**
  String get advDisbursed;

  /// No description provided for @payClaims.
  ///
  /// In en, this message translates to:
  /// **'Claims ready to pay'**
  String get payClaims;

  /// No description provided for @payAdvances.
  ///
  /// In en, this message translates to:
  /// **'Advances to disburse'**
  String get payAdvances;

  /// No description provided for @payEmptyTitle.
  ///
  /// In en, this message translates to:
  /// **'Nothing to pay'**
  String get payEmptyTitle;

  /// No description provided for @payEmptyMessage.
  ///
  /// In en, this message translates to:
  /// **'Approved claims and advances appear here.'**
  String get payEmptyMessage;

  /// No description provided for @busTitle.
  ///
  /// In en, this message translates to:
  /// **'Staff bus'**
  String get busTitle;

  /// No description provided for @busTabMySeat.
  ///
  /// In en, this message translates to:
  /// **'My seat'**
  String get busTabMySeat;

  /// No description provided for @busTabRoutes.
  ///
  /// In en, this message translates to:
  /// **'Routes'**
  String get busTabRoutes;

  /// No description provided for @busRouteTitle.
  ///
  /// In en, this message translates to:
  /// **'Route'**
  String get busRouteTitle;

  /// No description provided for @busRouteMeta.
  ///
  /// In en, this message translates to:
  /// **'Bus {bus} · {km} km'**
  String busRouteMeta(String bus, String km);

  /// No description provided for @busFreeSeats.
  ///
  /// In en, this message translates to:
  /// **'{free} of {total} seats free'**
  String busFreeSeats(String free, String total);

  /// No description provided for @busFull.
  ///
  /// In en, this message translates to:
  /// **'Full · {count} waiting'**
  String busFull(String count);

  /// No description provided for @busMySeatBadge.
  ///
  /// In en, this message translates to:
  /// **'My route'**
  String get busMySeatBadge;

  /// No description provided for @busWaitingBadge.
  ///
  /// In en, this message translates to:
  /// **'Waiting'**
  String get busWaitingBadge;

  /// No description provided for @busOfferedBadge.
  ///
  /// In en, this message translates to:
  /// **'Seat offered'**
  String get busOfferedBadge;

  /// No description provided for @busReleasedBadge.
  ///
  /// In en, this message translates to:
  /// **'Released'**
  String get busReleasedBadge;

  /// No description provided for @busEmptyTitle.
  ///
  /// In en, this message translates to:
  /// **'No bus seat yet'**
  String get busEmptyTitle;

  /// No description provided for @busEmptyMessage.
  ///
  /// In en, this message translates to:
  /// **'Pick a route and join its waitlist. You are offered a seat in turn.'**
  String get busEmptyMessage;

  /// No description provided for @busBrowse.
  ///
  /// In en, this message translates to:
  /// **'Browse routes'**
  String get busBrowse;

  /// No description provided for @busSeatNo.
  ///
  /// In en, this message translates to:
  /// **'Seat {no}'**
  String busSeatNo(String no);

  /// No description provided for @busStopLine.
  ///
  /// In en, this message translates to:
  /// **'{stop} · morning {morning} · evening {evening}'**
  String busStopLine(String stop, String morning, String evening);

  /// No description provided for @busStopTimes.
  ///
  /// In en, this message translates to:
  /// **'Morning {morning} · Evening {evening}'**
  String busStopTimes(String morning, String evening);

  /// No description provided for @busStops.
  ///
  /// In en, this message translates to:
  /// **'Stops'**
  String get busStops;

  /// No description provided for @busJoin.
  ///
  /// In en, this message translates to:
  /// **'Join waitlist'**
  String get busJoin;

  /// No description provided for @busJoinConfirm.
  ///
  /// In en, this message translates to:
  /// **'Join the waitlist for {route}?'**
  String busJoinConfirm(String route);

  /// No description provided for @busJoinMessage.
  ///
  /// In en, this message translates to:
  /// **'You are placed in line by application time. When a seat frees up you have 48 hours to accept.'**
  String get busJoinMessage;

  /// No description provided for @busJoined.
  ///
  /// In en, this message translates to:
  /// **'Added to the waitlist'**
  String get busJoined;

  /// No description provided for @busWaitlistTitle.
  ///
  /// In en, this message translates to:
  /// **'On the waitlist'**
  String get busWaitlistTitle;

  /// No description provided for @busPosition.
  ///
  /// In en, this message translates to:
  /// **'Position {pos}'**
  String busPosition(String pos);

  /// No description provided for @busEstimate.
  ///
  /// In en, this message translates to:
  /// **'Estimated wait: about {days} days'**
  String busEstimate(String days);

  /// No description provided for @busLeave.
  ///
  /// In en, this message translates to:
  /// **'Leave waitlist'**
  String get busLeave;

  /// No description provided for @busLeaveConfirm.
  ///
  /// In en, this message translates to:
  /// **'Leave the waitlist?'**
  String get busLeaveConfirm;

  /// No description provided for @busLeft.
  ///
  /// In en, this message translates to:
  /// **'Removed from the waitlist'**
  String get busLeft;

  /// No description provided for @busOfferTitle.
  ///
  /// In en, this message translates to:
  /// **'Seat {seat} is yours to take'**
  String busOfferTitle(String seat);

  /// No description provided for @busOfferLeft.
  ///
  /// In en, this message translates to:
  /// **'{h}h {m}m left to respond'**
  String busOfferLeft(String h, String m);

  /// No description provided for @busOfferExpired.
  ///
  /// In en, this message translates to:
  /// **'Offer expired'**
  String get busOfferExpired;

  /// No description provided for @busAccept.
  ///
  /// In en, this message translates to:
  /// **'Accept seat'**
  String get busAccept;

  /// No description provided for @busAccepted.
  ///
  /// In en, this message translates to:
  /// **'Seat confirmed'**
  String get busAccepted;

  /// No description provided for @busDecline.
  ///
  /// In en, this message translates to:
  /// **'Decline'**
  String get busDecline;

  /// No description provided for @busDeclineConfirm.
  ///
  /// In en, this message translates to:
  /// **'Decline this seat?'**
  String get busDeclineConfirm;

  /// No description provided for @busDeclineMessage.
  ///
  /// In en, this message translates to:
  /// **'You will be removed from this waitlist and the seat goes to the next person.'**
  String get busDeclineMessage;

  /// No description provided for @busDeclined.
  ///
  /// In en, this message translates to:
  /// **'Offer declined'**
  String get busDeclined;

  /// No description provided for @busChooseStop.
  ///
  /// In en, this message translates to:
  /// **'Choose your stop'**
  String get busChooseStop;

  /// No description provided for @busConfirmSeat.
  ///
  /// In en, this message translates to:
  /// **'Confirm seat'**
  String get busConfirmSeat;

  /// No description provided for @busRelease.
  ///
  /// In en, this message translates to:
  /// **'Release seat for a while'**
  String get busRelease;

  /// No description provided for @busReleaseTitle.
  ///
  /// In en, this message translates to:
  /// **'Release your seat'**
  String get busReleaseTitle;

  /// No description provided for @busReleaseHint.
  ///
  /// In en, this message translates to:
  /// **'Going on leave or travelling? Free the seat for up to 60 days and take it back later.'**
  String get busReleaseHint;

  /// No description provided for @busReleaseFrom.
  ///
  /// In en, this message translates to:
  /// **'From'**
  String get busReleaseFrom;

  /// No description provided for @busReleaseTo.
  ///
  /// In en, this message translates to:
  /// **'Until'**
  String get busReleaseTo;

  /// No description provided for @busReleaseReason.
  ///
  /// In en, this message translates to:
  /// **'Reason'**
  String get busReleaseReason;

  /// No description provided for @busReleased.
  ///
  /// In en, this message translates to:
  /// **'Seat released'**
  String get busReleased;

  /// No description provided for @busReleasedRange.
  ///
  /// In en, this message translates to:
  /// **'Released {range}'**
  String busReleasedRange(String range);

  /// No description provided for @busReclaim.
  ///
  /// In en, this message translates to:
  /// **'Take seat back'**
  String get busReclaim;

  /// No description provided for @busReclaimConfirm.
  ///
  /// In en, this message translates to:
  /// **'Take your seat back?'**
  String get busReclaimConfirm;

  /// No description provided for @busReclaimMessage.
  ///
  /// In en, this message translates to:
  /// **'This works only if nobody else is using it right now.'**
  String get busReclaimMessage;

  /// No description provided for @busReclaimed.
  ///
  /// In en, this message translates to:
  /// **'Seat is yours again'**
  String get busReclaimed;

  /// No description provided for @busErrFailed.
  ///
  /// In en, this message translates to:
  /// **'That did not work. Try again.'**
  String get busErrFailed;

  /// No description provided for @busErrOfferExpired.
  ///
  /// In en, this message translates to:
  /// **'This offer has expired.'**
  String get busErrOfferExpired;

  /// No description provided for @busErrHasSeat.
  ///
  /// In en, this message translates to:
  /// **'You already have a bus seat.'**
  String get busErrHasSeat;

  /// No description provided for @busErrAlreadyWaiting.
  ///
  /// In en, this message translates to:
  /// **'You are already on a waitlist.'**
  String get busErrAlreadyWaiting;

  /// No description provided for @busSeatMap.
  ///
  /// In en, this message translates to:
  /// **'Seat map'**
  String get busSeatMap;

  /// No description provided for @busLegendTaken.
  ///
  /// In en, this message translates to:
  /// **'Taken'**
  String get busLegendTaken;

  /// No description provided for @busLegendReleased.
  ///
  /// In en, this message translates to:
  /// **'Released'**
  String get busLegendReleased;

  /// No description provided for @busLegendOffered.
  ///
  /// In en, this message translates to:
  /// **'Offered'**
  String get busLegendOffered;

  /// No description provided for @busLegendFree.
  ///
  /// In en, this message translates to:
  /// **'Free'**
  String get busLegendFree;

  /// No description provided for @busQueue.
  ///
  /// In en, this message translates to:
  /// **'Waitlist ({count})'**
  String busQueue(int count);

  /// No description provided for @busQueueEmpty.
  ///
  /// In en, this message translates to:
  /// **'Nobody is waiting.'**
  String get busQueueEmpty;

  /// No description provided for @busPriorityLevel.
  ///
  /// In en, this message translates to:
  /// **'Priority {level}'**
  String busPriorityLevel(String level);

  /// No description provided for @busPriorityTitle.
  ///
  /// In en, this message translates to:
  /// **'Priority for {name}'**
  String busPriorityTitle(String name);

  /// No description provided for @busPriorityReason.
  ///
  /// In en, this message translates to:
  /// **'Reason'**
  String get busPriorityReason;

  /// No description provided for @busPriorityReasonHint.
  ///
  /// In en, this message translates to:
  /// **'Explain the override (at least 10 characters). It is recorded in the audit log.'**
  String get busPriorityReasonHint;

  /// No description provided for @busPrioritySave.
  ///
  /// In en, this message translates to:
  /// **'Save priority'**
  String get busPrioritySave;

  /// No description provided for @busPrioritySaved.
  ///
  /// In en, this message translates to:
  /// **'Priority updated'**
  String get busPrioritySaved;

  /// No description provided for @busEnd.
  ///
  /// In en, this message translates to:
  /// **'End allocation'**
  String get busEnd;

  /// No description provided for @busEndConfirm.
  ///
  /// In en, this message translates to:
  /// **'End the allocation of seat {seat}?'**
  String busEndConfirm(String seat);

  /// No description provided for @busEndMessage.
  ///
  /// In en, this message translates to:
  /// **'The seat is offered to the next person on the waitlist.'**
  String get busEndMessage;

  /// No description provided for @busEnded.
  ///
  /// In en, this message translates to:
  /// **'Allocation ended'**
  String get busEnded;

  /// No description provided for @busBroadcast.
  ///
  /// In en, this message translates to:
  /// **'Broadcast to this route'**
  String get busBroadcast;

  /// No description provided for @busBroadcastMessage.
  ///
  /// In en, this message translates to:
  /// **'Message'**
  String get busBroadcastMessage;

  /// No description provided for @busBroadcastSend.
  ///
  /// In en, this message translates to:
  /// **'Send'**
  String get busBroadcastSend;

  /// No description provided for @busBroadcastSent.
  ///
  /// In en, this message translates to:
  /// **'Message sent'**
  String get busBroadcastSent;

  /// No description provided for @moduleApprovals.
  ///
  /// In en, this message translates to:
  /// **'Approvals'**
  String get moduleApprovals;

  /// No description provided for @inboxOpen.
  ///
  /// In en, this message translates to:
  /// **'Open'**
  String get inboxOpen;

  /// No description provided for @approvalsTitle.
  ///
  /// In en, this message translates to:
  /// **'Approvals'**
  String get approvalsTitle;

  /// No description provided for @approvalTabPending.
  ///
  /// In en, this message translates to:
  /// **'Waiting for me'**
  String get approvalTabPending;

  /// No description provided for @approvalTabHistory.
  ///
  /// In en, this message translates to:
  /// **'History'**
  String get approvalTabHistory;

  /// No description provided for @approvalSelected.
  ///
  /// In en, this message translates to:
  /// **'{count} selected'**
  String approvalSelected(int count);

  /// No description provided for @approvalVerdict.
  ///
  /// In en, this message translates to:
  /// **'{count} waiting for your decision'**
  String approvalVerdict(int count);

  /// No description provided for @approvalVerdictOverdue.
  ///
  /// In en, this message translates to:
  /// **'{pending} waiting, {overdue} overdue'**
  String approvalVerdictOverdue(int pending, int overdue);

  /// No description provided for @approvalCatAll.
  ///
  /// In en, this message translates to:
  /// **'All'**
  String get approvalCatAll;

  /// No description provided for @approvalCatLeave.
  ///
  /// In en, this message translates to:
  /// **'Leave'**
  String get approvalCatLeave;

  /// No description provided for @approvalCatClaims.
  ///
  /// In en, this message translates to:
  /// **'Claims'**
  String get approvalCatClaims;

  /// No description provided for @approvalCatProcurement.
  ///
  /// In en, this message translates to:
  /// **'Procurement'**
  String get approvalCatProcurement;

  /// No description provided for @approvalCatFleet.
  ///
  /// In en, this message translates to:
  /// **'Fleet'**
  String get approvalCatFleet;

  /// No description provided for @approvalCatOther.
  ///
  /// In en, this message translates to:
  /// **'Other'**
  String get approvalCatOther;

  /// No description provided for @approvalEmptyTitle.
  ///
  /// In en, this message translates to:
  /// **'All clear'**
  String get approvalEmptyTitle;

  /// No description provided for @approvalEmptyMessage.
  ///
  /// In en, this message translates to:
  /// **'Nothing is waiting for your decision. New requests appear here.'**
  String get approvalEmptyMessage;

  /// No description provided for @approvalBatchHint.
  ///
  /// In en, this message translates to:
  /// **'Press and hold a request to approve several at once. Requests that need a signature or are above 5,00,000 must be decided one by one.'**
  String get approvalBatchHint;

  /// No description provided for @approvalBatchConfirm.
  ///
  /// In en, this message translates to:
  /// **'Approve {count} requests?'**
  String approvalBatchConfirm(int count);

  /// No description provided for @approvalBatchMessage.
  ///
  /// In en, this message translates to:
  /// **'Each one is approved as it stands. This cannot be undone.'**
  String get approvalBatchMessage;

  /// No description provided for @approvalBatchDone.
  ///
  /// In en, this message translates to:
  /// **'{count} approved'**
  String approvalBatchDone(int count);

  /// No description provided for @approvalBatchPartial.
  ///
  /// In en, this message translates to:
  /// **'{ok} approved, {failed} could not be approved'**
  String approvalBatchPartial(int ok, int failed);

  /// No description provided for @approvalApproveSelected.
  ///
  /// In en, this message translates to:
  /// **'Approve {count}'**
  String approvalApproveSelected(int count);

  /// No description provided for @approvalErrFailed.
  ///
  /// In en, this message translates to:
  /// **'That did not work. Try again.'**
  String get approvalErrFailed;

  /// No description provided for @approvalErrSelf.
  ///
  /// In en, this message translates to:
  /// **'You cannot decide your own request.'**
  String get approvalErrSelf;

  /// No description provided for @approvalErrLimit.
  ///
  /// In en, this message translates to:
  /// **'This amount is above your delegated approval limit.'**
  String get approvalErrLimit;

  /// No description provided for @approvalErrClosed.
  ///
  /// In en, this message translates to:
  /// **'This request is no longer waiting for a decision.'**
  String get approvalErrClosed;

  /// No description provided for @approvalErrMinChars.
  ///
  /// In en, this message translates to:
  /// **'Write at least {count} characters'**
  String approvalErrMinChars(int count);

  /// No description provided for @approvalFrom.
  ///
  /// In en, this message translates to:
  /// **'From {name}, {when}'**
  String approvalFrom(String name, String when);

  /// No description provided for @approvalUrgent.
  ///
  /// In en, this message translates to:
  /// **'Urgent'**
  String get approvalUrgent;

  /// No description provided for @approvalDelegatedToYou.
  ///
  /// In en, this message translates to:
  /// **'Delegated to you'**
  String get approvalDelegatedToYou;

  /// No description provided for @approvalSlaOk.
  ///
  /// In en, this message translates to:
  /// **'On time'**
  String get approvalSlaOk;

  /// No description provided for @approvalSlaWarn.
  ///
  /// In en, this message translates to:
  /// **'Half the time used'**
  String get approvalSlaWarn;

  /// No description provided for @approvalSlaDanger.
  ///
  /// In en, this message translates to:
  /// **'Due soon'**
  String get approvalSlaDanger;

  /// No description provided for @approvalSlaOverdue.
  ///
  /// In en, this message translates to:
  /// **'Overdue'**
  String get approvalSlaOverdue;

  /// No description provided for @approvalDecApproved.
  ///
  /// In en, this message translates to:
  /// **'Approved'**
  String get approvalDecApproved;

  /// No description provided for @approvalDecRejected.
  ///
  /// In en, this message translates to:
  /// **'Rejected'**
  String get approvalDecRejected;

  /// No description provided for @approvalDecReturned.
  ///
  /// In en, this message translates to:
  /// **'Returned'**
  String get approvalDecReturned;

  /// No description provided for @approvalDecStarted.
  ///
  /// In en, this message translates to:
  /// **'Sent by me'**
  String get approvalDecStarted;

  /// No description provided for @approvalWithdrawn.
  ///
  /// In en, this message translates to:
  /// **'Withdrawn'**
  String get approvalWithdrawn;

  /// No description provided for @approvalInReview.
  ///
  /// In en, this message translates to:
  /// **'In review'**
  String get approvalInReview;

  /// No description provided for @approvalHistoryEmptyTitle.
  ///
  /// In en, this message translates to:
  /// **'No history yet'**
  String get approvalHistoryEmptyTitle;

  /// No description provided for @approvalHistoryEmptyMessage.
  ///
  /// In en, this message translates to:
  /// **'Decisions you make and requests you send appear here.'**
  String get approvalHistoryEmptyMessage;

  /// No description provided for @approvalActApprove.
  ///
  /// In en, this message translates to:
  /// **'Approve'**
  String get approvalActApprove;

  /// No description provided for @approvalActReject.
  ///
  /// In en, this message translates to:
  /// **'Reject'**
  String get approvalActReject;

  /// No description provided for @approvalActReturn.
  ///
  /// In en, this message translates to:
  /// **'Return'**
  String get approvalActReturn;

  /// No description provided for @approvalActDelegate.
  ///
  /// In en, this message translates to:
  /// **'Delegate'**
  String get approvalActDelegate;

  /// No description provided for @approvalActWithdraw.
  ///
  /// In en, this message translates to:
  /// **'Withdraw'**
  String get approvalActWithdraw;

  /// No description provided for @approvalActComment.
  ///
  /// In en, this message translates to:
  /// **'Comment'**
  String get approvalActComment;

  /// No description provided for @approvalDetailTitle.
  ///
  /// In en, this message translates to:
  /// **'Request'**
  String get approvalDetailTitle;

  /// No description provided for @approvalApproveTitle.
  ///
  /// In en, this message translates to:
  /// **'Approve this request?'**
  String get approvalApproveTitle;

  /// No description provided for @approvalNoteOptional.
  ///
  /// In en, this message translates to:
  /// **'Note (optional)'**
  String get approvalNoteOptional;

  /// No description provided for @approvalRejectTitle.
  ///
  /// In en, this message translates to:
  /// **'Reject this request?'**
  String get approvalRejectTitle;

  /// No description provided for @approvalRejectMessage.
  ///
  /// In en, this message translates to:
  /// **'The requester is told why. This closes the request.'**
  String get approvalRejectMessage;

  /// No description provided for @approvalReturnTitle.
  ///
  /// In en, this message translates to:
  /// **'Return for changes?'**
  String get approvalReturnTitle;

  /// No description provided for @approvalReturnMessage.
  ///
  /// In en, this message translates to:
  /// **'The requester can fix it and send it again.'**
  String get approvalReturnMessage;

  /// No description provided for @approvalReasonHint.
  ///
  /// In en, this message translates to:
  /// **'Reason (at least 10 characters)'**
  String get approvalReasonHint;

  /// No description provided for @approvalDoneApproved.
  ///
  /// In en, this message translates to:
  /// **'Approved'**
  String get approvalDoneApproved;

  /// No description provided for @approvalDoneRejected.
  ///
  /// In en, this message translates to:
  /// **'Rejected'**
  String get approvalDoneRejected;

  /// No description provided for @approvalDoneReturned.
  ///
  /// In en, this message translates to:
  /// **'Returned to the requester'**
  String get approvalDoneReturned;

  /// No description provided for @approvalDoneDelegated.
  ///
  /// In en, this message translates to:
  /// **'Delegated to {name}'**
  String approvalDoneDelegated(String name);

  /// No description provided for @approvalDoneComment.
  ///
  /// In en, this message translates to:
  /// **'Comment added'**
  String get approvalDoneComment;

  /// No description provided for @approvalDoneWithdrawn.
  ///
  /// In en, this message translates to:
  /// **'Request withdrawn'**
  String get approvalDoneWithdrawn;

  /// No description provided for @approvalDelegateTitle.
  ///
  /// In en, this message translates to:
  /// **'Delegate to a colleague'**
  String get approvalDelegateTitle;

  /// No description provided for @approvalDelegateMessage.
  ///
  /// In en, this message translates to:
  /// **'They decide in your place and the record shows it was on your behalf.'**
  String get approvalDelegateMessage;

  /// No description provided for @approvalCommentHint.
  ///
  /// In en, this message translates to:
  /// **'Write a comment'**
  String get approvalCommentHint;

  /// No description provided for @approvalSend.
  ///
  /// In en, this message translates to:
  /// **'Send'**
  String get approvalSend;

  /// No description provided for @approvalWithdrawConfirm.
  ///
  /// In en, this message translates to:
  /// **'Withdraw this request?'**
  String get approvalWithdrawConfirm;

  /// No description provided for @approvalWithdrawMessage.
  ///
  /// In en, this message translates to:
  /// **'Approvers will no longer see it.'**
  String get approvalWithdrawMessage;

  /// No description provided for @approvalNextYou.
  ///
  /// In en, this message translates to:
  /// **'Waiting for you at: {step}'**
  String approvalNextYou(String step);

  /// No description provided for @approvalNextInReview.
  ///
  /// In en, this message translates to:
  /// **'Still in review. Nothing for you to do.'**
  String get approvalNextInReview;

  /// No description provided for @approvalNextWaiting.
  ///
  /// In en, this message translates to:
  /// **'Waiting for {names}. Nothing for you to do.'**
  String approvalNextWaiting(String names);

  /// No description provided for @approvalNextClosed.
  ///
  /// In en, this message translates to:
  /// **'Closed: {status}'**
  String approvalNextClosed(String status);

  /// No description provided for @approvalViewRequest.
  ///
  /// In en, this message translates to:
  /// **'See the full request'**
  String get approvalViewRequest;

  /// No description provided for @approvalRoute.
  ///
  /// In en, this message translates to:
  /// **'Approval route'**
  String get approvalRoute;

  /// No description provided for @approvalDiscussion.
  ///
  /// In en, this message translates to:
  /// **'Comments'**
  String get approvalDiscussion;

  /// No description provided for @approvalNeedsSignature.
  ///
  /// In en, this message translates to:
  /// **'This step needs your signature.'**
  String get approvalNeedsSignature;

  /// No description provided for @commonSave.
  ///
  /// In en, this message translates to:
  /// **'Save'**
  String get commonSave;

  /// No description provided for @moduleNoteSheets.
  ///
  /// In en, this message translates to:
  /// **'Note-sheets'**
  String get moduleNoteSheets;

  /// No description provided for @nsIntro.
  ///
  /// In en, this message translates to:
  /// **'A note-sheet is a formal file note that asks for a decision or for money to be spent. It goes to each officer in turn and each one signs.'**
  String get nsIntro;

  /// No description provided for @nsTabMine.
  ///
  /// In en, this message translates to:
  /// **'Mine'**
  String get nsTabMine;

  /// No description provided for @nsTabToSign.
  ///
  /// In en, this message translates to:
  /// **'To sign'**
  String get nsTabToSign;

  /// No description provided for @nsTabAll.
  ///
  /// In en, this message translates to:
  /// **'All I can see'**
  String get nsTabAll;

  /// No description provided for @nsNew.
  ///
  /// In en, this message translates to:
  /// **'New note-sheet'**
  String get nsNew;

  /// No description provided for @nsEmptyMine.
  ///
  /// In en, this message translates to:
  /// **'You have not written any note-sheet yet.'**
  String get nsEmptyMine;

  /// No description provided for @nsEmptyToSign.
  ///
  /// In en, this message translates to:
  /// **'Nothing is waiting for your signature.'**
  String get nsEmptyToSign;

  /// No description provided for @nsEmptyAll.
  ///
  /// In en, this message translates to:
  /// **'There are no note-sheets to show.'**
  String get nsEmptyAll;

  /// No description provided for @nsStatusDraft.
  ///
  /// In en, this message translates to:
  /// **'Draft'**
  String get nsStatusDraft;

  /// No description provided for @nsStatusInReview.
  ///
  /// In en, this message translates to:
  /// **'With approvers'**
  String get nsStatusInReview;

  /// No description provided for @nsStatusReturned.
  ///
  /// In en, this message translates to:
  /// **'Sent back'**
  String get nsStatusReturned;

  /// No description provided for @nsStatusApproved.
  ///
  /// In en, this message translates to:
  /// **'Approved'**
  String get nsStatusApproved;

  /// No description provided for @nsNextDraft.
  ///
  /// In en, this message translates to:
  /// **'Not sent yet. Add the details and send it for approval.'**
  String get nsNextDraft;

  /// No description provided for @nsNextSign.
  ///
  /// In en, this message translates to:
  /// **'Your turn. Read it and sign, send it back, or reject it.'**
  String get nsNextSign;

  /// No description provided for @nsNextWaiting.
  ///
  /// In en, this message translates to:
  /// **'Waiting for {names}.'**
  String nsNextWaiting(String names);

  /// No description provided for @nsNextReturned.
  ///
  /// In en, this message translates to:
  /// **'Sent back to you. Read the reason, fix it and send it again.'**
  String get nsNextReturned;

  /// No description provided for @nsNextReturnedOther.
  ///
  /// In en, this message translates to:
  /// **'Sent back to {name} for changes.'**
  String nsNextReturnedOther(String name);

  /// No description provided for @nsNextApproved.
  ///
  /// In en, this message translates to:
  /// **'Approved and signed by everyone. Nothing more to do.'**
  String get nsNextApproved;

  /// No description provided for @nsNextRejected.
  ///
  /// In en, this message translates to:
  /// **'Rejected. This file is closed.'**
  String get nsNextRejected;

  /// No description provided for @nsNextWithdrawn.
  ///
  /// In en, this message translates to:
  /// **'Withdrawn by {name}. This file is closed.'**
  String nsNextWithdrawn(String name);

  /// No description provided for @nsFrom.
  ///
  /// In en, this message translates to:
  /// **'From {name}, {dept}, {date}'**
  String nsFrom(String name, String dept, String date);

  /// No description provided for @nsVerdictOne.
  ///
  /// In en, this message translates to:
  /// **'1 quote, from {name}.'**
  String nsVerdictOne(String name);

  /// No description provided for @nsVerdictCheapest.
  ///
  /// In en, this message translates to:
  /// **'{count} quotes. {name} is cheapest, saving {saving} against the dearest.'**
  String nsVerdictCheapest(int count, String name, String saving);

  /// No description provided for @nsVerdictNotLowest.
  ///
  /// In en, this message translates to:
  /// **'{count} quotes. {name} is recommended but costs {extra} more than {lowest}, the lowest.'**
  String nsVerdictNotLowest(
    int count,
    String name,
    String extra,
    String lowest,
  );

  /// No description provided for @nsVerdictNoPick.
  ///
  /// In en, this message translates to:
  /// **'{count} quotes. {name} is the lowest. No supplier is recommended yet.'**
  String nsVerdictNoPick(int count, String name);

  /// No description provided for @nsOverLowest.
  ///
  /// In en, this message translates to:
  /// **'{amount} over the lowest'**
  String nsOverLowest(String amount);

  /// No description provided for @nsRecommended.
  ///
  /// In en, this message translates to:
  /// **'Recommended'**
  String get nsRecommended;

  /// No description provided for @nsQuotesTitle.
  ///
  /// In en, this message translates to:
  /// **'Quotations'**
  String get nsQuotesTitle;

  /// No description provided for @nsQuoteMeta.
  ///
  /// In en, this message translates to:
  /// **'{days} days delivery, {months} months warranty'**
  String nsQuoteMeta(int days, int months);

  /// No description provided for @nsNotesTitle.
  ///
  /// In en, this message translates to:
  /// **'Notes'**
  String get nsNotesTitle;

  /// No description provided for @nsRouteTitle.
  ///
  /// In en, this message translates to:
  /// **'Approval route'**
  String get nsRouteTitle;

  /// No description provided for @nsSignedBy.
  ///
  /// In en, this message translates to:
  /// **'Signed by'**
  String get nsSignedBy;

  /// No description provided for @nsSignedVerified.
  ///
  /// In en, this message translates to:
  /// **'Signed and verified'**
  String get nsSignedVerified;

  /// No description provided for @nsDetails.
  ///
  /// In en, this message translates to:
  /// **'Details'**
  String get nsDetails;

  /// No description provided for @nsDetailsHelp.
  ///
  /// In en, this message translates to:
  /// **'Each note and signature carries a fingerprint (SHA-256). If anyone changed an earlier note, the fingerprints would no longer match.'**
  String get nsDetailsHelp;

  /// No description provided for @nsVerifyCode.
  ///
  /// In en, this message translates to:
  /// **'Verification code {code}'**
  String nsVerifyCode(String code);

  /// No description provided for @nsKindNote.
  ///
  /// In en, this message translates to:
  /// **'Note'**
  String get nsKindNote;

  /// No description provided for @nsKindQuery.
  ///
  /// In en, this message translates to:
  /// **'Question'**
  String get nsKindQuery;

  /// No description provided for @nsKindReturn.
  ///
  /// In en, this message translates to:
  /// **'Sent back'**
  String get nsKindReturn;

  /// No description provided for @nsUrgNormal.
  ///
  /// In en, this message translates to:
  /// **'Normal'**
  String get nsUrgNormal;

  /// No description provided for @nsUrgHigh.
  ///
  /// In en, this message translates to:
  /// **'High'**
  String get nsUrgHigh;

  /// No description provided for @nsUrgCritical.
  ///
  /// In en, this message translates to:
  /// **'Critical'**
  String get nsUrgCritical;

  /// No description provided for @nsConfInternal.
  ///
  /// In en, this message translates to:
  /// **'Internal'**
  String get nsConfInternal;

  /// No description provided for @nsConfConfidential.
  ///
  /// In en, this message translates to:
  /// **'Confidential'**
  String get nsConfConfidential;

  /// No description provided for @nsConfSecret.
  ///
  /// In en, this message translates to:
  /// **'Secret'**
  String get nsConfSecret;

  /// No description provided for @nsEditTitle.
  ///
  /// In en, this message translates to:
  /// **'Edit note-sheet'**
  String get nsEditTitle;

  /// No description provided for @nsFieldTitle.
  ///
  /// In en, this message translates to:
  /// **'Title'**
  String get nsFieldTitle;

  /// No description provided for @nsFieldSubject.
  ///
  /// In en, this message translates to:
  /// **'Subject'**
  String get nsFieldSubject;

  /// No description provided for @nsFieldAmount.
  ///
  /// In en, this message translates to:
  /// **'Amount in taka, if money is involved'**
  String get nsFieldAmount;

  /// No description provided for @nsFieldAmountHelp.
  ///
  /// In en, this message translates to:
  /// **'Leave empty if no spending is asked for.'**
  String get nsFieldAmountHelp;

  /// No description provided for @nsFieldJustification.
  ///
  /// In en, this message translates to:
  /// **'What do you need, and why?'**
  String get nsFieldJustification;

  /// No description provided for @nsFieldUrgency.
  ///
  /// In en, this message translates to:
  /// **'How urgent is it?'**
  String get nsFieldUrgency;

  /// No description provided for @nsFieldConfidentiality.
  ///
  /// In en, this message translates to:
  /// **'Who may read it?'**
  String get nsFieldConfidentiality;

  /// No description provided for @nsQuoteAdd.
  ///
  /// In en, this message translates to:
  /// **'Add quotation'**
  String get nsQuoteAdd;

  /// No description provided for @nsQuotesNeeded.
  ///
  /// In en, this message translates to:
  /// **'Spending of 2,00,000 taka or more needs at least 3 quotations and one recommended supplier.'**
  String get nsQuotesNeeded;

  /// No description provided for @nsQuotesOptional.
  ///
  /// In en, this message translates to:
  /// **'Quotations are optional below 2,00,000 taka.'**
  String get nsQuotesOptional;

  /// No description provided for @nsQuotePickHint.
  ///
  /// In en, this message translates to:
  /// **'Tap the circle to recommend a supplier. Tap a row to change it.'**
  String get nsQuotePickHint;

  /// No description provided for @nsQuoteVendor.
  ///
  /// In en, this message translates to:
  /// **'Supplier'**
  String get nsQuoteVendor;

  /// No description provided for @nsQuotePrice.
  ///
  /// In en, this message translates to:
  /// **'Quoted price in taka'**
  String get nsQuotePrice;

  /// No description provided for @nsQuoteDelivery.
  ///
  /// In en, this message translates to:
  /// **'Delivery in days'**
  String get nsQuoteDelivery;

  /// No description provided for @nsQuoteWarranty.
  ///
  /// In en, this message translates to:
  /// **'Warranty in months'**
  String get nsQuoteWarranty;

  /// No description provided for @nsRecoNote.
  ///
  /// In en, this message translates to:
  /// **'Why not the lowest price?'**
  String get nsRecoNote;

  /// No description provided for @nsWhyReturned.
  ///
  /// In en, this message translates to:
  /// **'Why {name} sent it back'**
  String nsWhyReturned(String name);

  /// No description provided for @nsSaveDraft.
  ///
  /// In en, this message translates to:
  /// **'Save draft'**
  String get nsSaveDraft;

  /// No description provided for @nsSaveChanges.
  ///
  /// In en, this message translates to:
  /// **'Save changes only'**
  String get nsSaveChanges;

  /// No description provided for @nsSend.
  ///
  /// In en, this message translates to:
  /// **'Send for approval'**
  String get nsSend;

  /// No description provided for @nsSendAgain.
  ///
  /// In en, this message translates to:
  /// **'Send again'**
  String get nsSendAgain;

  /// No description provided for @nsSaved.
  ///
  /// In en, this message translates to:
  /// **'Saved'**
  String get nsSaved;

  /// No description provided for @nsSent.
  ///
  /// In en, this message translates to:
  /// **'Sent for approval'**
  String get nsSent;

  /// No description provided for @nsDeleteDraft.
  ///
  /// In en, this message translates to:
  /// **'Delete draft'**
  String get nsDeleteDraft;

  /// No description provided for @nsDeleteConfirm.
  ///
  /// In en, this message translates to:
  /// **'Delete this draft?'**
  String get nsDeleteConfirm;

  /// No description provided for @nsErrTitle.
  ///
  /// In en, this message translates to:
  /// **'Enter a title of at least 5 characters.'**
  String get nsErrTitle;

  /// No description provided for @nsErrSubject.
  ///
  /// In en, this message translates to:
  /// **'Enter the subject.'**
  String get nsErrSubject;

  /// No description provided for @nsErrJustification.
  ///
  /// In en, this message translates to:
  /// **'Explain the request in at least 10 characters.'**
  String get nsErrJustification;

  /// No description provided for @nsErrVendor.
  ///
  /// In en, this message translates to:
  /// **'Enter the supplier name.'**
  String get nsErrVendor;

  /// No description provided for @nsErrPrice.
  ///
  /// In en, this message translates to:
  /// **'Enter the quoted price.'**
  String get nsErrPrice;

  /// No description provided for @nsErrQuotesMin.
  ///
  /// In en, this message translates to:
  /// **'Add at least 3 quotations.'**
  String get nsErrQuotesMin;

  /// No description provided for @nsErrQuotesPick.
  ///
  /// In en, this message translates to:
  /// **'Recommend exactly one supplier.'**
  String get nsErrQuotesPick;

  /// No description provided for @nsErrQuotesNote.
  ///
  /// In en, this message translates to:
  /// **'Explain in at least 30 characters why the recommended supplier is not the cheapest.'**
  String get nsErrQuotesNote;

  /// No description provided for @nsErrFailed.
  ///
  /// In en, this message translates to:
  /// **'That did not work. Please try again.'**
  String get nsErrFailed;

  /// No description provided for @nsSignAction.
  ///
  /// In en, this message translates to:
  /// **'Review and sign'**
  String get nsSignAction;

  /// No description provided for @nsFixAndSend.
  ///
  /// In en, this message translates to:
  /// **'Fix and send again'**
  String get nsFixAndSend;

  /// No description provided for @nsEditAndSend.
  ///
  /// In en, this message translates to:
  /// **'Edit and send'**
  String get nsEditAndSend;

  /// No description provided for @nsAddNote.
  ///
  /// In en, this message translates to:
  /// **'Add a note or question'**
  String get nsAddNote;

  /// No description provided for @nsNoteAppendOnly.
  ///
  /// In en, this message translates to:
  /// **'Notes are never edited or deleted. Everyone on this file can read them.'**
  String get nsNoteAppendOnly;

  /// No description provided for @nsNoteText.
  ///
  /// In en, this message translates to:
  /// **'Your note'**
  String get nsNoteText;

  /// No description provided for @nsNoteAdd.
  ///
  /// In en, this message translates to:
  /// **'Add to file'**
  String get nsNoteAdd;

  /// No description provided for @nsNoteAdded.
  ///
  /// In en, this message translates to:
  /// **'Added to the file'**
  String get nsNoteAdded;

  /// No description provided for @nsReturnTitle.
  ///
  /// In en, this message translates to:
  /// **'Send back for changes'**
  String get nsReturnTitle;

  /// No description provided for @nsRejectTitle.
  ///
  /// In en, this message translates to:
  /// **'Reject this note-sheet'**
  String get nsRejectTitle;

  /// No description provided for @nsReturnedToast.
  ///
  /// In en, this message translates to:
  /// **'Sent back to the author'**
  String get nsReturnedToast;

  /// No description provided for @nsRejectedToast.
  ///
  /// In en, this message translates to:
  /// **'Rejected'**
  String get nsRejectedToast;

  /// No description provided for @nsWithdrawConfirm.
  ///
  /// In en, this message translates to:
  /// **'Withdraw this note-sheet?'**
  String get nsWithdrawConfirm;

  /// No description provided for @nsWithdrawMessage.
  ///
  /// In en, this message translates to:
  /// **'It will be closed and signatures so far will no longer count.'**
  String get nsWithdrawMessage;

  /// No description provided for @nsWithdrawnToast.
  ///
  /// In en, this message translates to:
  /// **'Withdrawn'**
  String get nsWithdrawnToast;

  /// No description provided for @nsPrint.
  ///
  /// In en, this message translates to:
  /// **'Print or save as PDF'**
  String get nsPrint;

  /// No description provided for @nsPrintFailed.
  ///
  /// In en, this message translates to:
  /// **'Could not prepare the PDF.'**
  String get nsPrintFailed;

  /// No description provided for @nsSignTitle.
  ///
  /// In en, this message translates to:
  /// **'Sign this note-sheet'**
  String get nsSignTitle;

  /// No description provided for @nsSignIntro.
  ///
  /// In en, this message translates to:
  /// **'You are signing {ref}. Your signature is tied to exactly what you see now.'**
  String nsSignIntro(String ref);

  /// No description provided for @nsSignTyped.
  ///
  /// In en, this message translates to:
  /// **'Type name'**
  String get nsSignTyped;

  /// No description provided for @nsSignDrawn.
  ///
  /// In en, this message translates to:
  /// **'Draw'**
  String get nsSignDrawn;

  /// No description provided for @nsSignStamp.
  ///
  /// In en, this message translates to:
  /// **'Stamp'**
  String get nsSignStamp;

  /// No description provided for @nsSignTypedLabel.
  ///
  /// In en, this message translates to:
  /// **'Your full name'**
  String get nsSignTypedLabel;

  /// No description provided for @nsSignDrawHint.
  ///
  /// In en, this message translates to:
  /// **'Draw your signature here'**
  String get nsSignDrawHint;

  /// No description provided for @nsSignClear.
  ///
  /// In en, this message translates to:
  /// **'Clear'**
  String get nsSignClear;

  /// No description provided for @nsSignComment.
  ///
  /// In en, this message translates to:
  /// **'Comment (optional)'**
  String get nsSignComment;

  /// No description provided for @nsSignOtp.
  ///
  /// In en, this message translates to:
  /// **'One-time code'**
  String get nsSignOtp;

  /// No description provided for @nsSignOtpHelp.
  ///
  /// In en, this message translates to:
  /// **'Demo app: the code is 123456.'**
  String get nsSignOtpHelp;

  /// No description provided for @nsSignConfirm.
  ///
  /// In en, this message translates to:
  /// **'Sign and approve'**
  String get nsSignConfirm;

  /// No description provided for @nsSignErrName.
  ///
  /// In en, this message translates to:
  /// **'Type your full name.'**
  String get nsSignErrName;

  /// No description provided for @nsSignErrDraw.
  ///
  /// In en, this message translates to:
  /// **'Draw your signature first.'**
  String get nsSignErrDraw;

  /// No description provided for @nsSignErrOtp.
  ///
  /// In en, this message translates to:
  /// **'Enter the 6-digit code.'**
  String get nsSignErrOtp;

  /// No description provided for @nsSignErrOtpWrong.
  ///
  /// In en, this message translates to:
  /// **'The code is not correct.'**
  String get nsSignErrOtpWrong;

  /// No description provided for @nsSignErrFailed.
  ///
  /// In en, this message translates to:
  /// **'Could not sign. Please try again.'**
  String get nsSignErrFailed;

  /// No description provided for @nsSignedToast.
  ///
  /// In en, this message translates to:
  /// **'Signed. It moves to the next officer.'**
  String get nsSignedToast;

  /// No description provided for @nsSignedFinal.
  ///
  /// In en, this message translates to:
  /// **'Signed. The note-sheet is fully approved.'**
  String get nsSignedFinal;

  /// No description provided for @moduleParcels.
  ///
  /// In en, this message translates to:
  /// **'Parcels'**
  String get moduleParcels;

  /// No description provided for @pcSend.
  ///
  /// In en, this message translates to:
  /// **'Send a parcel'**
  String get pcSend;

  /// No description provided for @pcIntro.
  ///
  /// In en, this message translates to:
  /// **'Track parcels you send, receive or look after. Type the number on the label to find one.'**
  String get pcIntro;

  /// No description provided for @pcSearchHint.
  ///
  /// In en, this message translates to:
  /// **'Search, or enter PKG-2026-0001'**
  String get pcSearchHint;

  /// No description provided for @pcNotFound.
  ///
  /// In en, this message translates to:
  /// **'No parcel with that number, or you cannot see it.'**
  String get pcNotFound;

  /// No description provided for @pcTabMine.
  ///
  /// In en, this message translates to:
  /// **'Mine'**
  String get pcTabMine;

  /// No description provided for @pcTabIncoming.
  ///
  /// In en, this message translates to:
  /// **'Coming to me'**
  String get pcTabIncoming;

  /// No description provided for @pcTabSent.
  ///
  /// In en, this message translates to:
  /// **'Sent by me'**
  String get pcTabSent;

  /// No description provided for @pcTabCarrying.
  ///
  /// In en, this message translates to:
  /// **'Carrying'**
  String get pcTabCarrying;

  /// No description provided for @pcTabSite.
  ///
  /// In en, this message translates to:
  /// **'Everything at my site'**
  String get pcTabSite;

  /// No description provided for @pcStuckOnly.
  ///
  /// In en, this message translates to:
  /// **'Stuck only'**
  String get pcStuckOnly;

  /// No description provided for @pcEmpty.
  ///
  /// In en, this message translates to:
  /// **'No parcels yet.'**
  String get pcEmpty;

  /// No description provided for @pcEmptyFiltered.
  ///
  /// In en, this message translates to:
  /// **'No parcels match.'**
  String get pcEmptyFiltered;

  /// No description provided for @pcVerdictNone.
  ///
  /// In en, this message translates to:
  /// **'Nothing needs you right now.'**
  String get pcVerdictNone;

  /// No description provided for @pcVerdictNeed.
  ///
  /// In en, this message translates to:
  /// **'Waiting for you: {count}'**
  String pcVerdictNeed(int count);

  /// No description provided for @pcConfidentialTitle.
  ///
  /// In en, this message translates to:
  /// **'Confidential parcel'**
  String get pcConfidentialTitle;

  /// No description provided for @pcStuckPill.
  ///
  /// In en, this message translates to:
  /// **'Stuck {hours} h'**
  String pcStuckPill(int hours);

  /// No description provided for @pcStatusCreated.
  ///
  /// In en, this message translates to:
  /// **'Not handed over yet'**
  String get pcStatusCreated;

  /// No description provided for @pcStatusDispatched.
  ///
  /// In en, this message translates to:
  /// **'With the courier'**
  String get pcStatusDispatched;

  /// No description provided for @pcStatusInTransit.
  ///
  /// In en, this message translates to:
  /// **'On the way'**
  String get pcStatusInTransit;

  /// No description provided for @pcStatusAtGate.
  ///
  /// In en, this message translates to:
  /// **'At the gate'**
  String get pcStatusAtGate;

  /// No description provided for @pcStatusOut.
  ///
  /// In en, this message translates to:
  /// **'Out for delivery'**
  String get pcStatusOut;

  /// No description provided for @pcStatusDelivered.
  ///
  /// In en, this message translates to:
  /// **'Delivered'**
  String get pcStatusDelivered;

  /// No description provided for @pcStatusHeld.
  ///
  /// In en, this message translates to:
  /// **'Held for checking'**
  String get pcStatusHeld;

  /// No description provided for @pcStatusReturning.
  ///
  /// In en, this message translates to:
  /// **'Going back'**
  String get pcStatusReturning;

  /// No description provided for @pcStatusReturned.
  ///
  /// In en, this message translates to:
  /// **'Returned'**
  String get pcStatusReturned;

  /// No description provided for @pcStatusLost.
  ///
  /// In en, this message translates to:
  /// **'Lost'**
  String get pcStatusLost;

  /// No description provided for @pcStatusDamaged.
  ///
  /// In en, this message translates to:
  /// **'Damaged'**
  String get pcStatusDamaged;

  /// No description provided for @pcStatusCancelled.
  ///
  /// In en, this message translates to:
  /// **'Cancelled'**
  String get pcStatusCancelled;

  /// No description provided for @pcCatLegal.
  ///
  /// In en, this message translates to:
  /// **'Legal documents'**
  String get pcCatLegal;

  /// No description provided for @pcCatSample.
  ///
  /// In en, this message translates to:
  /// **'QC sample'**
  String get pcCatSample;

  /// No description provided for @pcCatSpares.
  ///
  /// In en, this message translates to:
  /// **'Spare parts'**
  String get pcCatSpares;

  /// No description provided for @pcCatTender.
  ///
  /// In en, this message translates to:
  /// **'Tender bid'**
  String get pcCatTender;

  /// No description provided for @pcCatIt.
  ///
  /// In en, this message translates to:
  /// **'IT equipment'**
  String get pcCatIt;

  /// No description provided for @pcCatConfidential.
  ///
  /// In en, this message translates to:
  /// **'Confidential'**
  String get pcCatConfidential;

  /// No description provided for @pcCatGeneral.
  ///
  /// In en, this message translates to:
  /// **'General'**
  String get pcCatGeneral;

  /// No description provided for @pcHandFragile.
  ///
  /// In en, this message translates to:
  /// **'Fragile'**
  String get pcHandFragile;

  /// No description provided for @pcHandCold.
  ///
  /// In en, this message translates to:
  /// **'Keep cold'**
  String get pcHandCold;

  /// No description provided for @pcHandHazmat.
  ///
  /// In en, this message translates to:
  /// **'Hazardous'**
  String get pcHandHazmat;

  /// No description provided for @pcHandUpright.
  ///
  /// In en, this message translates to:
  /// **'Keep upright'**
  String get pcHandUpright;

  /// No description provided for @pcRetTamper.
  ///
  /// In en, this message translates to:
  /// **'Seal was broken'**
  String get pcRetTamper;

  /// No description provided for @pcRetDamaged.
  ///
  /// In en, this message translates to:
  /// **'Contents damaged'**
  String get pcRetDamaged;

  /// No description provided for @pcRetWrong.
  ///
  /// In en, this message translates to:
  /// **'Wrong documents'**
  String get pcRetWrong;

  /// No description provided for @pcRetRefused.
  ///
  /// In en, this message translates to:
  /// **'Recipient refused it'**
  String get pcRetRefused;

  /// No description provided for @pcRetUnavailable.
  ///
  /// In en, this message translates to:
  /// **'Recipient not available'**
  String get pcRetUnavailable;

  /// No description provided for @pcEvCreated.
  ///
  /// In en, this message translates to:
  /// **'Created'**
  String get pcEvCreated;

  /// No description provided for @pcEvHandover.
  ///
  /// In en, this message translates to:
  /// **'Handed to the courier'**
  String get pcEvHandover;

  /// No description provided for @pcEvCheckpoint.
  ///
  /// In en, this message translates to:
  /// **'Stop recorded'**
  String get pcEvCheckpoint;

  /// No description provided for @pcEvGateIn.
  ///
  /// In en, this message translates to:
  /// **'Received at the gate'**
  String get pcEvGateIn;

  /// No description provided for @pcEvOut.
  ///
  /// In en, this message translates to:
  /// **'Out for delivery'**
  String get pcEvOut;

  /// No description provided for @pcEvCode.
  ///
  /// In en, this message translates to:
  /// **'Code confirmed'**
  String get pcEvCode;

  /// No description provided for @pcEvDelivered.
  ///
  /// In en, this message translates to:
  /// **'Delivered'**
  String get pcEvDelivered;

  /// No description provided for @pcEvProblem.
  ///
  /// In en, this message translates to:
  /// **'Problem reported'**
  String get pcEvProblem;

  /// No description provided for @pcEvReturn.
  ///
  /// In en, this message translates to:
  /// **'Sending back started'**
  String get pcEvReturn;

  /// No description provided for @pcEvReturnCheckpoint.
  ///
  /// In en, this message translates to:
  /// **'Stop on the way back'**
  String get pcEvReturnCheckpoint;

  /// No description provided for @pcEvReturned.
  ///
  /// In en, this message translates to:
  /// **'Returned to sender'**
  String get pcEvReturned;

  /// No description provided for @pcEvException.
  ///
  /// In en, this message translates to:
  /// **'Marked lost or damaged'**
  String get pcEvException;

  /// No description provided for @pcEvCancelled.
  ///
  /// In en, this message translates to:
  /// **'Cancelled'**
  String get pcEvCancelled;

  /// No description provided for @pcEvNote.
  ///
  /// In en, this message translates to:
  /// **'Note'**
  String get pcEvNote;

  /// No description provided for @pcNextDispatch.
  ///
  /// In en, this message translates to:
  /// **'Hand it to a courier and record the seal.'**
  String get pcNextDispatch;

  /// No description provided for @pcNextCreatedSender.
  ///
  /// In en, this message translates to:
  /// **'Waiting for the mailroom to hand it to a courier. Nothing for you to do.'**
  String get pcNextCreatedSender;

  /// No description provided for @pcNextCreated.
  ///
  /// In en, this message translates to:
  /// **'Not handed to a courier yet.'**
  String get pcNextCreated;

  /// No description provided for @pcNextGateIn.
  ///
  /// In en, this message translates to:
  /// **'It has arrived. Check the seal and receive it at the gate.'**
  String get pcNextGateIn;

  /// No description provided for @pcNextAtGateYou.
  ///
  /// In en, this message translates to:
  /// **'It is at the gate. You will get a code when it is sent out to you.'**
  String get pcNextAtGateYou;

  /// No description provided for @pcNextAtGate.
  ///
  /// In en, this message translates to:
  /// **'At the gate, waiting to go to the recipient.'**
  String get pcNextAtGate;

  /// No description provided for @pcNextReceive.
  ///
  /// In en, this message translates to:
  /// **'It is on its way to you. Tap I have received it, or read the code to the person delivering it.'**
  String get pcNextReceive;

  /// No description provided for @pcNextHeldAct.
  ///
  /// In en, this message translates to:
  /// **'The seal or contents have a problem. Send it back to the sender.'**
  String get pcNextHeldAct;

  /// No description provided for @pcNextHeld.
  ///
  /// In en, this message translates to:
  /// **'Held for checking because of a problem.'**
  String get pcNextHeld;

  /// No description provided for @pcNextDamagedAct.
  ///
  /// In en, this message translates to:
  /// **'Damaged. Send it back to the sender.'**
  String get pcNextDamagedAct;

  /// No description provided for @pcNextBackYou.
  ///
  /// In en, this message translates to:
  /// **'It is coming back to you. Tap I have received it when you have it.'**
  String get pcNextBackYou;

  /// No description provided for @pcNextLost.
  ///
  /// In en, this message translates to:
  /// **'Marked lost. Nothing more to do.'**
  String get pcNextLost;

  /// No description provided for @pcNextCancelled.
  ///
  /// In en, this message translates to:
  /// **'Cancelled. Nothing more to do.'**
  String get pcNextCancelled;

  /// No description provided for @pcNextCarryLocal.
  ///
  /// In en, this message translates to:
  /// **'Take it to {to}. Record each stop on the way.'**
  String pcNextCarryLocal(String to);

  /// No description provided for @pcNextCarry.
  ///
  /// In en, this message translates to:
  /// **'Take it to {dest}. Record each stop on the way.'**
  String pcNextCarry(String dest);

  /// No description provided for @pcNextComing.
  ///
  /// In en, this message translates to:
  /// **'{courier} is bringing it. Nothing for you to do yet.'**
  String pcNextComing(String courier);

  /// No description provided for @pcNextRoad.
  ///
  /// In en, this message translates to:
  /// **'On the way to {dest}.'**
  String pcNextRoad(String dest);

  /// No description provided for @pcNextBring.
  ///
  /// In en, this message translates to:
  /// **'Send it out for delivery to {to}. They get a one-time code.'**
  String pcNextBring(String to);

  /// No description provided for @pcNextAskCode.
  ///
  /// In en, this message translates to:
  /// **'Ask {name} for the 6-digit code and enter it.'**
  String pcNextAskCode(String name);

  /// No description provided for @pcNextOut.
  ///
  /// In en, this message translates to:
  /// **'Being delivered to {to}.'**
  String pcNextOut(String to);

  /// No description provided for @pcNextDelivered.
  ///
  /// In en, this message translates to:
  /// **'Delivered to {to} on {date}.'**
  String pcNextDelivered(String to, String date);

  /// No description provided for @pcNextCarryBack.
  ///
  /// In en, this message translates to:
  /// **'Take it back to {from}. Record each stop.'**
  String pcNextCarryBack(String from);

  /// No description provided for @pcNextBackSoon.
  ///
  /// In en, this message translates to:
  /// **'Going back to {from}.'**
  String pcNextBackSoon(String from);

  /// No description provided for @pcNextReturned.
  ///
  /// In en, this message translates to:
  /// **'Returned to {from}.'**
  String pcNextReturned(String from);

  /// No description provided for @pcActDispatch.
  ///
  /// In en, this message translates to:
  /// **'Hand to courier'**
  String get pcActDispatch;

  /// No description provided for @pcActCheckpoint.
  ///
  /// In en, this message translates to:
  /// **'Record a stop'**
  String get pcActCheckpoint;

  /// No description provided for @pcActGateIn.
  ///
  /// In en, this message translates to:
  /// **'Receive at gate'**
  String get pcActGateIn;

  /// No description provided for @pcActReportProblem.
  ///
  /// In en, this message translates to:
  /// **'Report a problem'**
  String get pcActReportProblem;

  /// No description provided for @pcActOut.
  ///
  /// In en, this message translates to:
  /// **'Send out for delivery'**
  String get pcActOut;

  /// No description provided for @pcActReceive.
  ///
  /// In en, this message translates to:
  /// **'I have received it'**
  String get pcActReceive;

  /// No description provided for @pcActEnterCode.
  ///
  /// In en, this message translates to:
  /// **'Enter delivery code'**
  String get pcActEnterCode;

  /// No description provided for @pcActConfirmCode.
  ///
  /// In en, this message translates to:
  /// **'Confirm code'**
  String get pcActConfirmCode;

  /// No description provided for @pcActReturn.
  ///
  /// In en, this message translates to:
  /// **'Send back to sender'**
  String get pcActReturn;

  /// No description provided for @pcActException.
  ///
  /// In en, this message translates to:
  /// **'Mark lost or damaged'**
  String get pcActException;

  /// No description provided for @pcActAddNote.
  ///
  /// In en, this message translates to:
  /// **'Add a note'**
  String get pcActAddNote;

  /// No description provided for @pcActResend.
  ///
  /// In en, this message translates to:
  /// **'Send the code again'**
  String get pcActResend;

  /// No description provided for @pcActEdit.
  ///
  /// In en, this message translates to:
  /// **'Edit'**
  String get pcActEdit;

  /// No description provided for @pcActCancel.
  ///
  /// In en, this message translates to:
  /// **'Cancel parcel'**
  String get pcActCancel;

  /// No description provided for @pcActLabel.
  ///
  /// In en, this message translates to:
  /// **'Print label'**
  String get pcActLabel;

  /// No description provided for @pcMore.
  ///
  /// In en, this message translates to:
  /// **'More actions'**
  String get pcMore;

  /// No description provided for @pcDoneProblem.
  ///
  /// In en, this message translates to:
  /// **'Problem reported. The parcel is on hold.'**
  String get pcDoneProblem;

  /// No description provided for @pcDoneReturn.
  ///
  /// In en, this message translates to:
  /// **'It is going back to the sender.'**
  String get pcDoneReturn;

  /// No description provided for @pcDoneException.
  ///
  /// In en, this message translates to:
  /// **'Recorded.'**
  String get pcDoneException;

  /// No description provided for @pcDoneNote.
  ///
  /// In en, this message translates to:
  /// **'Note added.'**
  String get pcDoneNote;

  /// No description provided for @pcDoneResend.
  ///
  /// In en, this message translates to:
  /// **'A new code was sent.'**
  String get pcDoneResend;

  /// No description provided for @pcDoneCancel.
  ///
  /// In en, this message translates to:
  /// **'Parcel cancelled.'**
  String get pcDoneCancel;

  /// No description provided for @pcDoneDispatch.
  ///
  /// In en, this message translates to:
  /// **'Handed to the courier.'**
  String get pcDoneDispatch;

  /// No description provided for @pcDoneGateIn.
  ///
  /// In en, this message translates to:
  /// **'Received at the gate.'**
  String get pcDoneGateIn;

  /// No description provided for @pcDoneOut.
  ///
  /// In en, this message translates to:
  /// **'Out for delivery. The recipient has a code.'**
  String get pcDoneOut;

  /// No description provided for @pcDoneReceive.
  ///
  /// In en, this message translates to:
  /// **'Received. Thank you.'**
  String get pcDoneReceive;

  /// No description provided for @pcDoneVerify.
  ///
  /// In en, this message translates to:
  /// **'Delivery confirmed.'**
  String get pcDoneVerify;

  /// No description provided for @pcDoneCheckpoint.
  ///
  /// In en, this message translates to:
  /// **'Stop recorded.'**
  String get pcDoneCheckpoint;

  /// No description provided for @pcDoneCreate.
  ///
  /// In en, this message translates to:
  /// **'Parcel created.'**
  String get pcDoneCreate;

  /// No description provided for @pcDoneEdit.
  ///
  /// In en, this message translates to:
  /// **'Changes saved.'**
  String get pcDoneEdit;

  /// No description provided for @pcCancelMessage.
  ///
  /// In en, this message translates to:
  /// **'The parcel will not be sent. This cannot be undone.'**
  String get pcCancelMessage;

  /// No description provided for @pcOutMessage.
  ///
  /// In en, this message translates to:
  /// **'{name} will get a 6-digit code to confirm delivery.'**
  String pcOutMessage(String name);

  /// No description provided for @pcReceiveMessage.
  ///
  /// In en, this message translates to:
  /// **'Confirm only if the parcel is in your hands.'**
  String get pcReceiveMessage;

  /// No description provided for @pcErrOtpInvalid.
  ///
  /// In en, this message translates to:
  /// **'That code is not correct.'**
  String get pcErrOtpInvalid;

  /// No description provided for @pcErrOtpExpired.
  ///
  /// In en, this message translates to:
  /// **'The code has expired. Ask for a new one.'**
  String get pcErrOtpExpired;

  /// No description provided for @pcErrOtpLocked.
  ///
  /// In en, this message translates to:
  /// **'Too many wrong codes. Ask the mailroom for help.'**
  String get pcErrOtpLocked;

  /// No description provided for @pcErrOtpRate.
  ///
  /// In en, this message translates to:
  /// **'Too many new codes. Try again in an hour.'**
  String get pcErrOtpRate;

  /// No description provided for @pcErrSeal.
  ///
  /// In en, this message translates to:
  /// **'Enter the seal number.'**
  String get pcErrSeal;

  /// No description provided for @pcErrPhotoNeeded.
  ///
  /// In en, this message translates to:
  /// **'A photo is needed.'**
  String get pcErrPhotoNeeded;

  /// No description provided for @pcErrLostEarly.
  ///
  /// In en, this message translates to:
  /// **'A parcel can be marked lost only after 72 hours without movement.'**
  String get pcErrLostEarly;

  /// No description provided for @pcErrFlagged.
  ///
  /// In en, this message translates to:
  /// **'This parcel is on hold because of a seal problem.'**
  String get pcErrFlagged;

  /// No description provided for @pcErrFailed.
  ///
  /// In en, this message translates to:
  /// **'Something went wrong. Please try again.'**
  String get pcErrFailed;

  /// No description provided for @pcErrLabel.
  ///
  /// In en, this message translates to:
  /// **'Could not prepare the label.'**
  String get pcErrLabel;

  /// No description provided for @pcErrPhotoOpen.
  ///
  /// In en, this message translates to:
  /// **'Could not open the photo.'**
  String get pcErrPhotoOpen;

  /// No description provided for @pcErrPhoto.
  ///
  /// In en, this message translates to:
  /// **'Could not upload the photo. Try again.'**
  String get pcErrPhoto;

  /// No description provided for @pcErrCourier.
  ///
  /// In en, this message translates to:
  /// **'Choose a courier.'**
  String get pcErrCourier;

  /// No description provided for @pcErrLocation.
  ///
  /// In en, this message translates to:
  /// **'Enter where it is.'**
  String get pcErrLocation;

  /// No description provided for @pcErrProblemNote.
  ///
  /// In en, this message translates to:
  /// **'Describe the problem in at least 10 characters.'**
  String get pcErrProblemNote;

  /// No description provided for @pcErrCode.
  ///
  /// In en, this message translates to:
  /// **'Enter the 6-digit code.'**
  String get pcErrCode;

  /// No description provided for @pcErrExceptionNote.
  ///
  /// In en, this message translates to:
  /// **'Explain in at least 20 characters.'**
  String get pcErrExceptionNote;

  /// No description provided for @pcErrNote.
  ///
  /// In en, this message translates to:
  /// **'Write a note.'**
  String get pcErrNote;

  /// No description provided for @pcErrDescription.
  ///
  /// In en, this message translates to:
  /// **'Describe what is inside (at least 5 characters).'**
  String get pcErrDescription;

  /// No description provided for @pcErrRecipient.
  ///
  /// In en, this message translates to:
  /// **'Choose who receives it.'**
  String get pcErrRecipient;

  /// No description provided for @pcErrNumber.
  ///
  /// In en, this message translates to:
  /// **'Enter a valid number.'**
  String get pcErrNumber;

  /// No description provided for @pcErrWaybill.
  ///
  /// In en, this message translates to:
  /// **'At least 3 characters.'**
  String get pcErrWaybill;

  /// No description provided for @pcSheetDispatch.
  ///
  /// In en, this message translates to:
  /// **'Hand to courier'**
  String get pcSheetDispatch;

  /// No description provided for @pcSheetDispatchHelp.
  ///
  /// In en, this message translates to:
  /// **'Choose who carries it. Their name goes on the trail.'**
  String get pcSheetDispatchHelp;

  /// No description provided for @pcSheetCheckpoint.
  ///
  /// In en, this message translates to:
  /// **'Record a stop'**
  String get pcSheetCheckpoint;

  /// No description provided for @pcSheetCheckpointHelp.
  ///
  /// In en, this message translates to:
  /// **'Where is the parcel now?'**
  String get pcSheetCheckpointHelp;

  /// No description provided for @pcSheetReturnCheckpointHelp.
  ///
  /// In en, this message translates to:
  /// **'Where is the parcel now, on its way back?'**
  String get pcSheetReturnCheckpointHelp;

  /// No description provided for @pcSheetGateIn.
  ///
  /// In en, this message translates to:
  /// **'Receive at gate'**
  String get pcSheetGateIn;

  /// No description provided for @pcSheetGateInHelp.
  ///
  /// In en, this message translates to:
  /// **'Check the seal. If it is broken or the parcel is damaged, switch it off and report.'**
  String get pcSheetGateInHelp;

  /// No description provided for @pcSheetVerify.
  ///
  /// In en, this message translates to:
  /// **'Delivery code'**
  String get pcSheetVerify;

  /// No description provided for @pcSheetVerifyHelp.
  ///
  /// In en, this message translates to:
  /// **'Ask the recipient for the 6-digit code they received.'**
  String get pcSheetVerifyHelp;

  /// No description provided for @pcSheetVerifyReturnHelp.
  ///
  /// In en, this message translates to:
  /// **'Ask the sender for the 6-digit code they received.'**
  String get pcSheetVerifyReturnHelp;

  /// No description provided for @pcSheetFlag.
  ///
  /// In en, this message translates to:
  /// **'Report a problem'**
  String get pcSheetFlag;

  /// No description provided for @pcSheetFlagHelp.
  ///
  /// In en, this message translates to:
  /// **'The parcel is held until someone decides what to do.'**
  String get pcSheetFlagHelp;

  /// No description provided for @pcSheetReturn.
  ///
  /// In en, this message translates to:
  /// **'Send back'**
  String get pcSheetReturn;

  /// No description provided for @pcSheetReturnHelp.
  ///
  /// In en, this message translates to:
  /// **'The parcel goes back to {name} with a new code.'**
  String pcSheetReturnHelp(String name);

  /// No description provided for @pcSheetException.
  ///
  /// In en, this message translates to:
  /// **'Lost or damaged'**
  String get pcSheetException;

  /// No description provided for @pcSheetExceptionHelp.
  ///
  /// In en, this message translates to:
  /// **'Use this only when the parcel cannot be delivered.'**
  String get pcSheetExceptionHelp;

  /// No description provided for @pcSheetNote.
  ///
  /// In en, this message translates to:
  /// **'Add a note'**
  String get pcSheetNote;

  /// No description provided for @pcSheetNoteHelp.
  ///
  /// In en, this message translates to:
  /// **'Everyone who can see this parcel can read it.'**
  String get pcSheetNoteHelp;

  /// No description provided for @pcFieldCourier.
  ///
  /// In en, this message translates to:
  /// **'Courier'**
  String get pcFieldCourier;

  /// No description provided for @pcFieldSeal.
  ///
  /// In en, this message translates to:
  /// **'Seal number (optional)'**
  String get pcFieldSeal;

  /// No description provided for @pcFieldSealRequired.
  ///
  /// In en, this message translates to:
  /// **'Seal number'**
  String get pcFieldSealRequired;

  /// No description provided for @pcSealWhy.
  ///
  /// In en, this message translates to:
  /// **'This parcel must be sealed because of its value or type.'**
  String get pcSealWhy;

  /// No description provided for @pcFieldLocation.
  ///
  /// In en, this message translates to:
  /// **'Where is it?'**
  String get pcFieldLocation;

  /// No description provided for @pcFieldSealIntact.
  ///
  /// In en, this message translates to:
  /// **'Seal is intact'**
  String get pcFieldSealIntact;

  /// No description provided for @pcSealNo.
  ///
  /// In en, this message translates to:
  /// **'Seal {no}'**
  String pcSealNo(String no);

  /// No description provided for @pcReasonSeal.
  ///
  /// In en, this message translates to:
  /// **'Seal broken'**
  String get pcReasonSeal;

  /// No description provided for @pcReasonDamaged.
  ///
  /// In en, this message translates to:
  /// **'Contents damaged'**
  String get pcReasonDamaged;

  /// No description provided for @pcFieldCode.
  ///
  /// In en, this message translates to:
  /// **'6-digit code'**
  String get pcFieldCode;

  /// No description provided for @pcFieldReceivedBy.
  ///
  /// In en, this message translates to:
  /// **'Received by (name, optional)'**
  String get pcFieldReceivedBy;

  /// No description provided for @pcFieldWhatHappened.
  ///
  /// In en, this message translates to:
  /// **'What happened'**
  String get pcFieldWhatHappened;

  /// No description provided for @pcFieldNoteOptional.
  ///
  /// In en, this message translates to:
  /// **'Note (optional)'**
  String get pcFieldNoteOptional;

  /// No description provided for @pcFieldNote.
  ///
  /// In en, this message translates to:
  /// **'Note'**
  String get pcFieldNote;

  /// No description provided for @pcPhotoRequired.
  ///
  /// In en, this message translates to:
  /// **'Take a photo (required)'**
  String get pcPhotoRequired;

  /// No description provided for @pcPhotoOptional.
  ///
  /// In en, this message translates to:
  /// **'Add a photo (optional)'**
  String get pcPhotoOptional;

  /// No description provided for @pcPhotoAdded.
  ///
  /// In en, this message translates to:
  /// **'Photo added: {name}'**
  String pcPhotoAdded(String name);

  /// No description provided for @pcFrom.
  ///
  /// In en, this message translates to:
  /// **'From'**
  String get pcFrom;

  /// No description provided for @pcTo.
  ///
  /// In en, this message translates to:
  /// **'To'**
  String get pcTo;

  /// No description provided for @pcCarriedBy.
  ///
  /// In en, this message translates to:
  /// **'Courier'**
  String get pcCarriedBy;

  /// No description provided for @pcTrail.
  ///
  /// In en, this message translates to:
  /// **'Where it has been'**
  String get pcTrail;

  /// No description provided for @pcReturnLine.
  ///
  /// In en, this message translates to:
  /// **'Return {no}: {reason}'**
  String pcReturnLine(String no, String reason);

  /// No description provided for @pcViewPhoto.
  ///
  /// In en, this message translates to:
  /// **'View photo'**
  String get pcViewPhoto;

  /// No description provided for @pcDetCategory.
  ///
  /// In en, this message translates to:
  /// **'Type'**
  String get pcDetCategory;

  /// No description provided for @pcDetWaybill.
  ///
  /// In en, this message translates to:
  /// **'Waybill'**
  String get pcDetWaybill;

  /// No description provided for @pcDetSeal.
  ///
  /// In en, this message translates to:
  /// **'Seal'**
  String get pcDetSeal;

  /// No description provided for @pcDetValue.
  ///
  /// In en, this message translates to:
  /// **'Declared value'**
  String get pcDetValue;

  /// No description provided for @pcDetWeight.
  ///
  /// In en, this message translates to:
  /// **'Weight'**
  String get pcDetWeight;

  /// No description provided for @pcDetHandling.
  ///
  /// In en, this message translates to:
  /// **'Handling'**
  String get pcDetHandling;

  /// No description provided for @pcDetTrail.
  ///
  /// In en, this message translates to:
  /// **'Trail check'**
  String get pcDetTrail;

  /// No description provided for @pcSealBroken.
  ///
  /// In en, this message translates to:
  /// **'Reported broken'**
  String get pcSealBroken;

  /// No description provided for @pcChainOk.
  ///
  /// In en, this message translates to:
  /// **'Fingerprints match. Nobody changed the trail.'**
  String get pcChainOk;

  /// No description provided for @pcChainBroken.
  ///
  /// In en, this message translates to:
  /// **'Fingerprints do not match. The trail was changed.'**
  String get pcChainBroken;

  /// No description provided for @pcEditTitle.
  ///
  /// In en, this message translates to:
  /// **'Edit parcel'**
  String get pcEditTitle;

  /// No description provided for @pcFormIntro.
  ///
  /// In en, this message translates to:
  /// **'Say who gets it and what it is. The mailroom hands it to a courier, and the recipient gets a code to confirm delivery.'**
  String get pcFormIntro;

  /// No description provided for @pcFieldRecipient.
  ///
  /// In en, this message translates to:
  /// **'Who receives it'**
  String get pcFieldRecipient;

  /// No description provided for @pcPickRecipient.
  ///
  /// In en, this message translates to:
  /// **'Choose a colleague'**
  String get pcPickRecipient;

  /// No description provided for @pcFieldCategory.
  ///
  /// In en, this message translates to:
  /// **'What kind of parcel'**
  String get pcFieldCategory;

  /// No description provided for @pcFieldDescription.
  ///
  /// In en, this message translates to:
  /// **'What is inside'**
  String get pcFieldDescription;

  /// No description provided for @pcFieldUrgency.
  ///
  /// In en, this message translates to:
  /// **'How urgent'**
  String get pcFieldUrgency;

  /// No description provided for @pcUrgNormal.
  ///
  /// In en, this message translates to:
  /// **'Normal'**
  String get pcUrgNormal;

  /// No description provided for @pcFieldValue.
  ///
  /// In en, this message translates to:
  /// **'Value in taka (optional)'**
  String get pcFieldValue;

  /// No description provided for @pcValueHelp.
  ///
  /// In en, this message translates to:
  /// **'Above ৳50,000 a photo is needed on delivery. Above ৳1,00,000 it must be sealed.'**
  String get pcValueHelp;

  /// No description provided for @pcFieldWeight.
  ///
  /// In en, this message translates to:
  /// **'Weight in kg (optional)'**
  String get pcFieldWeight;

  /// No description provided for @pcFieldWaybill.
  ///
  /// In en, this message translates to:
  /// **'Courier waybill (optional)'**
  String get pcFieldWaybill;

  /// No description provided for @pcFieldHandling.
  ///
  /// In en, this message translates to:
  /// **'Special handling'**
  String get pcFieldHandling;

  /// No description provided for @pcFieldConfidential.
  ///
  /// In en, this message translates to:
  /// **'Confidential'**
  String get pcFieldConfidential;

  /// No description provided for @pcConfidentialAuto.
  ///
  /// In en, this message translates to:
  /// **'This kind of parcel is always confidential.'**
  String get pcConfidentialAuto;

  /// No description provided for @pcConfidentialHelp.
  ///
  /// In en, this message translates to:
  /// **'Hides what is inside from people who only handle it.'**
  String get pcConfidentialHelp;

  /// No description provided for @pcSaveChanges.
  ///
  /// In en, this message translates to:
  /// **'Save changes'**
  String get pcSaveChanges;

  /// No description provided for @pcCreate.
  ///
  /// In en, this message translates to:
  /// **'Create parcel'**
  String get pcCreate;

  /// No description provided for @peopleSearchHint.
  ///
  /// In en, this message translates to:
  /// **'Search by name, title or department'**
  String get peopleSearchHint;

  /// No description provided for @peopleNone.
  ///
  /// In en, this message translates to:
  /// **'No one found.'**
  String get peopleNone;

  /// No description provided for @moduleVisitors.
  ///
  /// In en, this message translates to:
  /// **'Guests'**
  String get moduleVisitors;

  /// No description provided for @visNew.
  ///
  /// In en, this message translates to:
  /// **'Register a guest'**
  String get visNew;

  /// No description provided for @visIntro.
  ///
  /// In en, this message translates to:
  /// **'People coming to see you, waiting at the gate, or still inside.'**
  String get visIntro;

  /// No description provided for @visSearchHint.
  ///
  /// In en, this message translates to:
  /// **'Search by name, VIS-2026-0001 or plate'**
  String get visSearchHint;

  /// No description provided for @visNotFound.
  ///
  /// In en, this message translates to:
  /// **'No visit with that number, or you cannot see it.'**
  String get visNotFound;

  /// No description provided for @visScanNeedGate.
  ///
  /// In en, this message translates to:
  /// **'Only the gate can scan a pass.'**
  String get visScanNeedGate;

  /// No description provided for @visTabMine.
  ///
  /// In en, this message translates to:
  /// **'Mine'**
  String get visTabMine;

  /// No description provided for @visTabExpected.
  ///
  /// In en, this message translates to:
  /// **'Expected today'**
  String get visTabExpected;

  /// No description provided for @visTabInside.
  ///
  /// In en, this message translates to:
  /// **'Inside now'**
  String get visTabInside;

  /// No description provided for @visTabOverdue.
  ///
  /// In en, this message translates to:
  /// **'Stayed too long'**
  String get visTabOverdue;

  /// No description provided for @visTabApprove.
  ///
  /// In en, this message translates to:
  /// **'Waiting for you'**
  String get visTabApprove;

  /// No description provided for @visTabAll.
  ///
  /// In en, this message translates to:
  /// **'Everything I can see'**
  String get visTabAll;

  /// No description provided for @visEmpty.
  ///
  /// In en, this message translates to:
  /// **'No guests yet.'**
  String get visEmpty;

  /// No description provided for @visEmptyFiltered.
  ///
  /// In en, this message translates to:
  /// **'No guests match.'**
  String get visEmptyFiltered;

  /// No description provided for @visVerdictNone.
  ///
  /// In en, this message translates to:
  /// **'Nothing needs you right now.'**
  String get visVerdictNone;

  /// No description provided for @visVerdictNeed.
  ///
  /// In en, this message translates to:
  /// **'Waiting for you: {count}'**
  String visVerdictNeed(int count);

  /// No description provided for @visStatusWaiting.
  ///
  /// In en, this message translates to:
  /// **'Waiting for approval'**
  String get visStatusWaiting;

  /// No description provided for @visStatusExpected.
  ///
  /// In en, this message translates to:
  /// **'Pass ready'**
  String get visStatusExpected;

  /// No description provided for @visStatusInside.
  ///
  /// In en, this message translates to:
  /// **'Inside'**
  String get visStatusInside;

  /// No description provided for @visStatusOverdue.
  ///
  /// In en, this message translates to:
  /// **'Stayed too long'**
  String get visStatusOverdue;

  /// No description provided for @visStatusDone.
  ///
  /// In en, this message translates to:
  /// **'Left'**
  String get visStatusDone;

  /// No description provided for @visStatusDenied.
  ///
  /// In en, this message translates to:
  /// **'Not approved'**
  String get visStatusDenied;

  /// No description provided for @visStatusCancelled.
  ///
  /// In en, this message translates to:
  /// **'Cancelled'**
  String get visStatusCancelled;

  /// No description provided for @visCatVip.
  ///
  /// In en, this message translates to:
  /// **'VIP'**
  String get visCatVip;

  /// No description provided for @visCatGovt.
  ///
  /// In en, this message translates to:
  /// **'Government'**
  String get visCatGovt;

  /// No description provided for @visCatVendor.
  ///
  /// In en, this message translates to:
  /// **'Vendor'**
  String get visCatVendor;

  /// No description provided for @visCatClient.
  ///
  /// In en, this message translates to:
  /// **'Client'**
  String get visCatClient;

  /// No description provided for @visCatContractor.
  ///
  /// In en, this message translates to:
  /// **'Contractor'**
  String get visCatContractor;

  /// No description provided for @visCatRegular.
  ///
  /// In en, this message translates to:
  /// **'Guest'**
  String get visCatRegular;

  /// No description provided for @visNextWatchlist.
  ///
  /// In en, this message translates to:
  /// **'A name matched the watchlist. Clear it or deny the visit.'**
  String get visNextWatchlist;

  /// No description provided for @visNextWatchlistWait.
  ///
  /// In en, this message translates to:
  /// **'Held for a watchlist check. Nothing for you to do.'**
  String get visNextWatchlistWait;

  /// No description provided for @visNextApprove.
  ///
  /// In en, this message translates to:
  /// **'Approve the visit for {name}.'**
  String visNextApprove(String name);

  /// No description provided for @visNextHostWait.
  ///
  /// In en, this message translates to:
  /// **'Waiting for the site head to approve. Nothing for you to do.'**
  String get visNextHostWait;

  /// No description provided for @visNextWaiting.
  ///
  /// In en, this message translates to:
  /// **'Waiting for approval.'**
  String get visNextWaiting;

  /// No description provided for @visNextPpe.
  ///
  /// In en, this message translates to:
  /// **'Check their PPE, then receive them at the gate.'**
  String get visNextPpe;

  /// No description provided for @visNextEscort.
  ///
  /// In en, this message translates to:
  /// **'Assign someone to stay with them in the red area.'**
  String get visNextEscort;

  /// No description provided for @visNextCheckIn.
  ///
  /// In en, this message translates to:
  /// **'Receive {name} at the gate. Take a photo.'**
  String visNextCheckIn(String name);

  /// No description provided for @visNextHostReady.
  ///
  /// In en, this message translates to:
  /// **'Pass is ready. They are expected {when}. Nothing for you to do.'**
  String visNextHostReady(String when);

  /// No description provided for @visNextReady.
  ///
  /// In en, this message translates to:
  /// **'Pass is ready. Expected {when}.'**
  String visNextReady(String when);

  /// No description provided for @visNextCheckOut.
  ///
  /// In en, this message translates to:
  /// **'Check {name} out and take the badge back.'**
  String visNextCheckOut(String name);

  /// No description provided for @visNextInsideHost.
  ///
  /// In en, this message translates to:
  /// **'They are inside. Stay reachable until they leave.'**
  String get visNextInsideHost;

  /// No description provided for @visNextInside.
  ///
  /// In en, this message translates to:
  /// **'Inside the site.'**
  String get visNextInside;

  /// No description provided for @visNextOverdueAct.
  ///
  /// In en, this message translates to:
  /// **'They have stayed too long. Extend the time or check them out.'**
  String get visNextOverdueAct;

  /// No description provided for @visNextOverdue.
  ///
  /// In en, this message translates to:
  /// **'They have stayed past the agreed time.'**
  String get visNextOverdue;

  /// No description provided for @visNextDone.
  ///
  /// In en, this message translates to:
  /// **'They have left.'**
  String get visNextDone;

  /// No description provided for @visNextDenied.
  ///
  /// In en, this message translates to:
  /// **'This visit was not approved.'**
  String get visNextDenied;

  /// No description provided for @visNextCancelled.
  ///
  /// In en, this message translates to:
  /// **'Cancelled. Nothing more to do.'**
  String get visNextCancelled;

  /// No description provided for @visWatchPill.
  ///
  /// In en, this message translates to:
  /// **'Watchlist'**
  String get visWatchPill;

  /// No description provided for @visHostLine.
  ///
  /// In en, this message translates to:
  /// **'Host: {name} at {site}'**
  String visHostLine(String name, String site);

  /// No description provided for @visWhenLine.
  ///
  /// In en, this message translates to:
  /// **'Expected {start} to {end}'**
  String visWhenLine(String start, String end);

  /// No description provided for @visEscortLine.
  ///
  /// In en, this message translates to:
  /// **'Escort: {name}'**
  String visEscortLine(String name);

  /// No description provided for @visBadgeLine.
  ///
  /// In en, this message translates to:
  /// **'Badge {no}'**
  String visBadgeLine(String no);

  /// No description provided for @visZones.
  ///
  /// In en, this message translates to:
  /// **'Areas they may enter'**
  String get visZones;

  /// No description provided for @visEscortNeed.
  ///
  /// In en, this message translates to:
  /// **'Needs escort'**
  String get visEscortNeed;

  /// No description provided for @visFindings.
  ///
  /// In en, this message translates to:
  /// **'What was seen'**
  String get visFindings;

  /// No description provided for @visDetPhone.
  ///
  /// In en, this message translates to:
  /// **'Phone'**
  String get visDetPhone;

  /// No description provided for @visDetId.
  ///
  /// In en, this message translates to:
  /// **'ID'**
  String get visDetId;

  /// No description provided for @visDetPlate.
  ///
  /// In en, this message translates to:
  /// **'Vehicle'**
  String get visDetPlate;

  /// No description provided for @visPpeOk.
  ///
  /// In en, this message translates to:
  /// **'PPE was cleared at the gate.'**
  String get visPpeOk;

  /// No description provided for @visPpeNeeded.
  ///
  /// In en, this message translates to:
  /// **'PPE must be cleared before they enter.'**
  String get visPpeNeeded;

  /// No description provided for @visPpeNone.
  ///
  /// In en, this message translates to:
  /// **'No special PPE for these areas.'**
  String get visPpeNone;

  /// No description provided for @visActApprove.
  ///
  /// In en, this message translates to:
  /// **'Approve visit'**
  String get visActApprove;

  /// No description provided for @visActDeny.
  ///
  /// In en, this message translates to:
  /// **'Do not approve'**
  String get visActDeny;

  /// No description provided for @visActCancel.
  ///
  /// In en, this message translates to:
  /// **'Cancel visit'**
  String get visActCancel;

  /// No description provided for @visActCheckIn.
  ///
  /// In en, this message translates to:
  /// **'Receive at gate'**
  String get visActCheckIn;

  /// No description provided for @visActCheckOut.
  ///
  /// In en, this message translates to:
  /// **'Check out'**
  String get visActCheckOut;

  /// No description provided for @visActPpe.
  ///
  /// In en, this message translates to:
  /// **'Clear PPE'**
  String get visActPpe;

  /// No description provided for @visActEscort.
  ///
  /// In en, this message translates to:
  /// **'Assign escort'**
  String get visActEscort;

  /// No description provided for @visActExtend.
  ///
  /// In en, this message translates to:
  /// **'Give two more hours'**
  String get visActExtend;

  /// No description provided for @visActFinding.
  ///
  /// In en, this message translates to:
  /// **'Add a finding'**
  String get visActFinding;

  /// No description provided for @visActClearWatch.
  ///
  /// In en, this message translates to:
  /// **'Clear watchlist'**
  String get visActClearWatch;

  /// No description provided for @visActSafe.
  ///
  /// In en, this message translates to:
  /// **'Mark as safe'**
  String get visActSafe;

  /// No description provided for @visActPass.
  ///
  /// In en, this message translates to:
  /// **'Show pass'**
  String get visActPass;

  /// No description provided for @visApproveMsg.
  ///
  /// In en, this message translates to:
  /// **'They will get a pass and can be received at the gate.'**
  String get visApproveMsg;

  /// No description provided for @visCheckOutMsg.
  ///
  /// In en, this message translates to:
  /// **'Confirm only if they have left and the badge is back.'**
  String get visCheckOutMsg;

  /// No description provided for @visFieldReason.
  ///
  /// In en, this message translates to:
  /// **'Reason'**
  String get visFieldReason;

  /// No description provided for @visSheetCheckIn.
  ///
  /// In en, this message translates to:
  /// **'Receive at the gate'**
  String get visSheetCheckIn;

  /// No description provided for @visSheetCheckInHelp.
  ///
  /// In en, this message translates to:
  /// **'Take a photo. The badge number is issued automatically.'**
  String get visSheetCheckInHelp;

  /// No description provided for @visPhotoRequired.
  ///
  /// In en, this message translates to:
  /// **'Take a photo (required)'**
  String get visPhotoRequired;

  /// No description provided for @visPhotoAdded.
  ///
  /// In en, this message translates to:
  /// **'Photo added'**
  String get visPhotoAdded;

  /// No description provided for @visFieldNda.
  ///
  /// In en, this message translates to:
  /// **'NDA signed'**
  String get visFieldNda;

  /// No description provided for @visFieldBriefing.
  ///
  /// In en, this message translates to:
  /// **'Safety briefing done'**
  String get visFieldBriefing;

  /// No description provided for @visSheetPpe.
  ///
  /// In en, this message translates to:
  /// **'Personal protective equipment'**
  String get visSheetPpe;

  /// No description provided for @visSheetPpeHelp.
  ///
  /// In en, this message translates to:
  /// **'Tick only what they are wearing and have been briefed on.'**
  String get visSheetPpeHelp;

  /// No description provided for @visPpeHat.
  ///
  /// In en, this message translates to:
  /// **'Hard hat'**
  String get visPpeHat;

  /// No description provided for @visPpeShoes.
  ///
  /// In en, this message translates to:
  /// **'Safety shoes'**
  String get visPpeShoes;

  /// No description provided for @visPpeVest.
  ///
  /// In en, this message translates to:
  /// **'Hi-vis vest'**
  String get visPpeVest;

  /// No description provided for @visPpeGoggles.
  ///
  /// In en, this message translates to:
  /// **'Goggles'**
  String get visPpeGoggles;

  /// No description provided for @visPpeH2s.
  ///
  /// In en, this message translates to:
  /// **'H2S briefing'**
  String get visPpeH2s;

  /// No description provided for @visFieldEscort.
  ///
  /// In en, this message translates to:
  /// **'Who stays with them'**
  String get visFieldEscort;

  /// No description provided for @visSheetFinding.
  ///
  /// In en, this message translates to:
  /// **'What did you see'**
  String get visSheetFinding;

  /// No description provided for @visFieldArea.
  ///
  /// In en, this message translates to:
  /// **'Where'**
  String get visFieldArea;

  /// No description provided for @visFieldFinding.
  ///
  /// In en, this message translates to:
  /// **'What happened'**
  String get visFieldFinding;

  /// No description provided for @visFindObs.
  ///
  /// In en, this message translates to:
  /// **'Note'**
  String get visFindObs;

  /// No description provided for @visFindCrit.
  ///
  /// In en, this message translates to:
  /// **'Critical'**
  String get visFindCrit;

  /// No description provided for @visDoneCheckIn.
  ///
  /// In en, this message translates to:
  /// **'Received at the gate.'**
  String get visDoneCheckIn;

  /// No description provided for @visDoneCheckOut.
  ///
  /// In en, this message translates to:
  /// **'Checked out.'**
  String get visDoneCheckOut;

  /// No description provided for @visDonePpe.
  ///
  /// In en, this message translates to:
  /// **'PPE recorded.'**
  String get visDonePpe;

  /// No description provided for @visDoneEscort.
  ///
  /// In en, this message translates to:
  /// **'Escort assigned.'**
  String get visDoneEscort;

  /// No description provided for @visDoneExtend.
  ///
  /// In en, this message translates to:
  /// **'Two more hours given.'**
  String get visDoneExtend;

  /// No description provided for @visDoneFinding.
  ///
  /// In en, this message translates to:
  /// **'Finding recorded.'**
  String get visDoneFinding;

  /// No description provided for @visDoneWatch.
  ///
  /// In en, this message translates to:
  /// **'Watchlist cleared.'**
  String get visDoneWatch;

  /// No description provided for @visDoneSafe.
  ///
  /// In en, this message translates to:
  /// **'Marked safe.'**
  String get visDoneSafe;

  /// No description provided for @visDoneApprove.
  ///
  /// In en, this message translates to:
  /// **'Visit approved. The pass is ready.'**
  String get visDoneApprove;

  /// No description provided for @visDoneDeny.
  ///
  /// In en, this message translates to:
  /// **'Visit was not approved.'**
  String get visDoneDeny;

  /// No description provided for @visDoneCancel.
  ///
  /// In en, this message translates to:
  /// **'Visit cancelled.'**
  String get visDoneCancel;

  /// No description provided for @visDoneCreate.
  ///
  /// In en, this message translates to:
  /// **'Guest registered.'**
  String get visDoneCreate;

  /// No description provided for @visErrPpe.
  ///
  /// In en, this message translates to:
  /// **'Clear PPE before they enter.'**
  String get visErrPpe;

  /// No description provided for @visErrEscort.
  ///
  /// In en, this message translates to:
  /// **'A red area needs an escort.'**
  String get visErrEscort;

  /// No description provided for @visErrWatchlist.
  ///
  /// In en, this message translates to:
  /// **'Security must clear the watchlist first.'**
  String get visErrWatchlist;

  /// No description provided for @visErrBlacklist.
  ///
  /// In en, this message translates to:
  /// **'This person cannot be registered or let in.'**
  String get visErrBlacklist;

  /// No description provided for @visErrFull.
  ///
  /// In en, this message translates to:
  /// **'Too many guests inside. Ask a security lead.'**
  String get visErrFull;

  /// No description provided for @visErrExtend.
  ///
  /// In en, this message translates to:
  /// **'Already extended twice today.'**
  String get visErrExtend;

  /// No description provided for @visErrFailed.
  ///
  /// In en, this message translates to:
  /// **'Something went wrong. Please try again.'**
  String get visErrFailed;

  /// No description provided for @visErrName.
  ///
  /// In en, this message translates to:
  /// **'Enter the guest name.'**
  String get visErrName;

  /// No description provided for @visErrPhone.
  ///
  /// In en, this message translates to:
  /// **'Enter a phone number.'**
  String get visErrPhone;

  /// No description provided for @visErrPurpose.
  ///
  /// In en, this message translates to:
  /// **'Say why they are coming.'**
  String get visErrPurpose;

  /// No description provided for @visErrId.
  ///
  /// In en, this message translates to:
  /// **'ID number is required for this kind of guest.'**
  String get visErrId;

  /// No description provided for @visFormIntro.
  ///
  /// In en, this message translates to:
  /// **'Say who is coming, why, and which areas they may enter. Regular guests get a pass at once. VIP, government and red-area visits wait for the site head.'**
  String get visFormIntro;

  /// No description provided for @visFieldName.
  ///
  /// In en, this message translates to:
  /// **'Guest name'**
  String get visFieldName;

  /// No description provided for @visFieldOrg.
  ///
  /// In en, this message translates to:
  /// **'Organisation (optional)'**
  String get visFieldOrg;

  /// No description provided for @visFieldPhone.
  ///
  /// In en, this message translates to:
  /// **'Phone'**
  String get visFieldPhone;

  /// No description provided for @visFieldCategory.
  ///
  /// In en, this message translates to:
  /// **'Who they are'**
  String get visFieldCategory;

  /// No description provided for @visFieldPurpose.
  ///
  /// In en, this message translates to:
  /// **'Why they are coming'**
  String get visFieldPurpose;

  /// No description provided for @visFieldWhen.
  ///
  /// In en, this message translates to:
  /// **'When they arrive'**
  String get visFieldWhen;

  /// No description provided for @visFieldSite.
  ///
  /// In en, this message translates to:
  /// **'Which site'**
  String get visFieldSite;

  /// No description provided for @visSiteHq.
  ///
  /// In en, this message translates to:
  /// **'Head Office, Baridhara'**
  String get visSiteHq;

  /// No description provided for @visSitePlant.
  ///
  /// In en, this message translates to:
  /// **'Keraniganj Plant'**
  String get visSitePlant;

  /// No description provided for @visSiteCtg.
  ///
  /// In en, this message translates to:
  /// **'Chattogram Terminal'**
  String get visSiteCtg;

  /// No description provided for @visFieldZones.
  ///
  /// In en, this message translates to:
  /// **'Areas they may enter'**
  String get visFieldZones;

  /// No description provided for @visFieldIdType.
  ///
  /// In en, this message translates to:
  /// **'ID type'**
  String get visFieldIdType;

  /// No description provided for @visIdNid.
  ///
  /// In en, this message translates to:
  /// **'National ID'**
  String get visIdNid;

  /// No description provided for @visIdPass.
  ///
  /// In en, this message translates to:
  /// **'Passport'**
  String get visIdPass;

  /// No description provided for @visIdGovt.
  ///
  /// In en, this message translates to:
  /// **'Government badge'**
  String get visIdGovt;

  /// No description provided for @visIdCo.
  ///
  /// In en, this message translates to:
  /// **'Company ID'**
  String get visIdCo;

  /// No description provided for @visFieldIdNo.
  ///
  /// In en, this message translates to:
  /// **'ID number'**
  String get visFieldIdNo;

  /// No description provided for @visFieldPlate.
  ///
  /// In en, this message translates to:
  /// **'Vehicle plate (optional)'**
  String get visFieldPlate;

  /// No description provided for @visCreate.
  ///
  /// In en, this message translates to:
  /// **'Register guest'**
  String get visCreate;

  /// No description provided for @visMuster.
  ///
  /// In en, this message translates to:
  /// **'Who is inside'**
  String get visMuster;

  /// No description provided for @visMusterIdle.
  ///
  /// In en, this message translates to:
  /// **'{count} guests are inside. Start a roll-call if you need to account for them.'**
  String visMusterIdle(int count);

  /// No description provided for @visMusterActive.
  ///
  /// In en, this message translates to:
  /// **'Roll-call on: {safe} of {inside} marked safe.'**
  String visMusterActive(int safe, int inside);

  /// No description provided for @visMusterStart.
  ///
  /// In en, this message translates to:
  /// **'Start roll-call'**
  String get visMusterStart;

  /// No description provided for @visMusterEnd.
  ///
  /// In en, this message translates to:
  /// **'End roll-call'**
  String get visMusterEnd;

  /// No description provided for @visMusterMissing.
  ///
  /// In en, this message translates to:
  /// **'Not yet safe'**
  String get visMusterMissing;

  /// No description provided for @visMusterSafe.
  ///
  /// In en, this message translates to:
  /// **'Safe'**
  String get visMusterSafe;

  /// No description provided for @moduleFleet.
  ///
  /// In en, this message translates to:
  /// **'Cars'**
  String get moduleFleet;

  /// No description provided for @flIntro.
  ///
  /// In en, this message translates to:
  /// **'Ask for a car, assign one, or drive the trip. The next step is on each row.'**
  String get flIntro;

  /// No description provided for @flNew.
  ///
  /// In en, this message translates to:
  /// **'Ask for a car'**
  String get flNew;

  /// No description provided for @flSearchHint.
  ///
  /// In en, this message translates to:
  /// **'Search destination or purpose'**
  String get flSearchHint;

  /// No description provided for @flSos.
  ///
  /// In en, this message translates to:
  /// **'Driver help'**
  String get flSos;

  /// No description provided for @flTabMine.
  ///
  /// In en, this message translates to:
  /// **'Mine'**
  String get flTabMine;

  /// No description provided for @flTabDriving.
  ///
  /// In en, this message translates to:
  /// **'My trips'**
  String get flTabDriving;

  /// No description provided for @flTabEndorse.
  ///
  /// In en, this message translates to:
  /// **'Waiting for you'**
  String get flTabEndorse;

  /// No description provided for @flTabDispatch.
  ///
  /// In en, this message translates to:
  /// **'To assign'**
  String get flTabDispatch;

  /// No description provided for @flTabLive.
  ///
  /// In en, this message translates to:
  /// **'On the road'**
  String get flTabLive;

  /// No description provided for @flTabAll.
  ///
  /// In en, this message translates to:
  /// **'All'**
  String get flTabAll;

  /// No description provided for @flEmpty.
  ///
  /// In en, this message translates to:
  /// **'No vehicle requests here.'**
  String get flEmpty;

  /// No description provided for @flEmptyFiltered.
  ///
  /// In en, this message translates to:
  /// **'Nothing matches that search.'**
  String get flEmptyFiltered;

  /// No description provided for @flVerdictNone.
  ///
  /// In en, this message translates to:
  /// **'Nothing waiting on you.'**
  String get flVerdictNone;

  /// No description provided for @flVerdictNeed.
  ///
  /// In en, this message translates to:
  /// **'{count} waiting on you'**
  String flVerdictNeed(int count);

  /// No description provided for @flStatusDraft.
  ///
  /// In en, this message translates to:
  /// **'Draft'**
  String get flStatusDraft;

  /// No description provided for @flStatusPending.
  ///
  /// In en, this message translates to:
  /// **'Waiting for your head of department'**
  String get flStatusPending;

  /// No description provided for @flStatusApproved.
  ///
  /// In en, this message translates to:
  /// **'Waiting for a car'**
  String get flStatusApproved;

  /// No description provided for @flStatusAssigned.
  ///
  /// In en, this message translates to:
  /// **'Car assigned'**
  String get flStatusAssigned;

  /// No description provided for @flStatusLive.
  ///
  /// In en, this message translates to:
  /// **'On the road'**
  String get flStatusLive;

  /// No description provided for @flStatusDone.
  ///
  /// In en, this message translates to:
  /// **'Finished'**
  String get flStatusDone;

  /// No description provided for @flStatusRejected.
  ///
  /// In en, this message translates to:
  /// **'Not approved'**
  String get flStatusRejected;

  /// No description provided for @flStatusCancelled.
  ///
  /// In en, this message translates to:
  /// **'Cancelled'**
  String get flStatusCancelled;

  /// No description provided for @flNextSubmit.
  ///
  /// In en, this message translates to:
  /// **'Send this request to your head of department.'**
  String get flNextSubmit;

  /// No description provided for @flNextWaitHod.
  ///
  /// In en, this message translates to:
  /// **'Waiting for Farida Begum. Nothing for you to do.'**
  String get flNextWaitHod;

  /// No description provided for @flNextEndorse.
  ///
  /// In en, this message translates to:
  /// **'Endorse {name}’s request, or send it back from Approvals.'**
  String flNextEndorse(String name);

  /// No description provided for @flNextAssign.
  ///
  /// In en, this message translates to:
  /// **'Choose a free car and a driver.'**
  String get flNextAssign;

  /// No description provided for @flNextWaitCar.
  ///
  /// In en, this message translates to:
  /// **'Transport will assign a car. Nothing for you to do.'**
  String get flNextWaitCar;

  /// No description provided for @flNextGateOut.
  ///
  /// In en, this message translates to:
  /// **'Leave through the gate after {when}.'**
  String flNextGateOut(String when);

  /// No description provided for @flNextAssigned.
  ///
  /// In en, this message translates to:
  /// **'{plate} is waiting at the gate.'**
  String flNextAssigned(String plate);

  /// No description provided for @flNextFinish.
  ///
  /// In en, this message translates to:
  /// **'Record the last odometer when you return.'**
  String get flNextFinish;

  /// No description provided for @flNextLive.
  ///
  /// In en, this message translates to:
  /// **'{plate} is on the way.'**
  String flNextLive(String plate);

  /// No description provided for @flNextRate.
  ///
  /// In en, this message translates to:
  /// **'Rate this trip.'**
  String get flNextRate;

  /// No description provided for @flNextDone.
  ///
  /// In en, this message translates to:
  /// **'This trip is finished.'**
  String get flNextDone;

  /// No description provided for @flNextFix.
  ///
  /// In en, this message translates to:
  /// **'Fix the request and send it again.'**
  String get flNextFix;

  /// No description provided for @flNextRejected.
  ///
  /// In en, this message translates to:
  /// **'This request was not approved.'**
  String get flNextRejected;

  /// No description provided for @flNextCancelled.
  ///
  /// In en, this message translates to:
  /// **'This request was cancelled.'**
  String get flNextCancelled;

  /// No description provided for @flTypeOne.
  ///
  /// In en, this message translates to:
  /// **'One way'**
  String get flTypeOne;

  /// No description provided for @flTypeRound.
  ///
  /// In en, this message translates to:
  /// **'There and back'**
  String get flTypeRound;

  /// No description provided for @flFormIntro.
  ///
  /// In en, this message translates to:
  /// **'Say where you are going, why, and when. Your head of department endorses it. Transport then gives you a car.'**
  String get flFormIntro;

  /// No description provided for @flFieldPurpose.
  ///
  /// In en, this message translates to:
  /// **'Why you need a car'**
  String get flFieldPurpose;

  /// No description provided for @flFieldDest.
  ///
  /// In en, this message translates to:
  /// **'Where you are going'**
  String get flFieldDest;

  /// No description provided for @flFieldType.
  ///
  /// In en, this message translates to:
  /// **'Trip type'**
  String get flFieldType;

  /// No description provided for @flFieldPax.
  ///
  /// In en, this message translates to:
  /// **'How many people'**
  String get flFieldPax;

  /// No description provided for @flFieldWhen.
  ///
  /// In en, this message translates to:
  /// **'When you leave'**
  String get flFieldWhen;

  /// No description provided for @flFieldNote.
  ///
  /// In en, this message translates to:
  /// **'What happened'**
  String get flFieldNote;

  /// No description provided for @flFieldNoteOpt.
  ///
  /// In en, this message translates to:
  /// **'Note (optional)'**
  String get flFieldNoteOpt;

  /// No description provided for @flFieldOdo.
  ///
  /// In en, this message translates to:
  /// **'Odometer (km)'**
  String get flFieldOdo;

  /// No description provided for @flFieldSos.
  ///
  /// In en, this message translates to:
  /// **'What is wrong'**
  String get flFieldSos;

  /// No description provided for @flFieldPlaza.
  ///
  /// In en, this message translates to:
  /// **'Toll plaza'**
  String get flFieldPlaza;

  /// No description provided for @flFieldAmount.
  ///
  /// In en, this message translates to:
  /// **'Amount (৳)'**
  String get flFieldAmount;

  /// No description provided for @flFieldFeedback.
  ///
  /// In en, this message translates to:
  /// **'How was the trip (optional)'**
  String get flFieldFeedback;

  /// No description provided for @flFieldRating.
  ///
  /// In en, this message translates to:
  /// **'Stars (1 to 5)'**
  String get flFieldRating;

  /// No description provided for @flFieldReason.
  ///
  /// In en, this message translates to:
  /// **'Reason'**
  String get flFieldReason;

  /// No description provided for @flCreate.
  ///
  /// In en, this message translates to:
  /// **'Send request'**
  String get flCreate;

  /// No description provided for @flEstimate.
  ///
  /// In en, this message translates to:
  /// **'About {km} km, {minutes} minutes, {cost}. Suggested: {cls}.'**
  String flEstimate(String km, int minutes, String cost, String cls);

  /// No description provided for @flWhat.
  ///
  /// In en, this message translates to:
  /// **'What is this'**
  String get flWhat;

  /// No description provided for @flWho.
  ///
  /// In en, this message translates to:
  /// **'Asked by {name} on {when}.'**
  String flWho(String name, String when);

  /// No description provided for @flMeta.
  ///
  /// In en, this message translates to:
  /// **'Leaves {when}. {pax} people. {cls}. About {cost}.'**
  String flMeta(String when, String pax, String cls, String cost);

  /// No description provided for @flAssigned.
  ///
  /// In en, this message translates to:
  /// **'Car {plate} with {driver}.'**
  String flAssigned(String plate, String driver);

  /// No description provided for @flPassNo.
  ///
  /// In en, this message translates to:
  /// **'Gate pass {pass}'**
  String flPassNo(String pass);

  /// No description provided for @flActAssign.
  ///
  /// In en, this message translates to:
  /// **'Assign a car'**
  String get flActAssign;

  /// No description provided for @flActGateOut.
  ///
  /// In en, this message translates to:
  /// **'Leave the gate'**
  String get flActGateOut;

  /// No description provided for @flActCheckpoint.
  ///
  /// In en, this message translates to:
  /// **'Record a stop'**
  String get flActCheckpoint;

  /// No description provided for @flActComplete.
  ///
  /// In en, this message translates to:
  /// **'Finish the trip'**
  String get flActComplete;

  /// No description provided for @flActSos.
  ///
  /// In en, this message translates to:
  /// **'Need help'**
  String get flActSos;

  /// No description provided for @flActToll.
  ///
  /// In en, this message translates to:
  /// **'Add a toll'**
  String get flActToll;

  /// No description provided for @flActRate.
  ///
  /// In en, this message translates to:
  /// **'Rate the trip'**
  String get flActRate;

  /// No description provided for @flActCancel.
  ///
  /// In en, this message translates to:
  /// **'Cancel'**
  String get flActCancel;

  /// No description provided for @flActPass.
  ///
  /// In en, this message translates to:
  /// **'Show gate pass'**
  String get flActPass;

  /// No description provided for @flActTollOk.
  ///
  /// In en, this message translates to:
  /// **'Approve'**
  String get flActTollOk;

  /// No description provided for @flActTollPay.
  ///
  /// In en, this message translates to:
  /// **'Mark paid'**
  String get flActTollPay;

  /// No description provided for @flActAck.
  ///
  /// In en, this message translates to:
  /// **'We are coming'**
  String get flActAck;

  /// No description provided for @flSheetAssign.
  ///
  /// In en, this message translates to:
  /// **'Assign a car and a driver'**
  String get flSheetAssign;

  /// No description provided for @flSheetAssignHelp.
  ///
  /// In en, this message translates to:
  /// **'Only free cars with valid papers are listed.'**
  String get flSheetAssignHelp;

  /// No description provided for @flDoneCreate.
  ///
  /// In en, this message translates to:
  /// **'Request sent to your head of department.'**
  String get flDoneCreate;

  /// No description provided for @flDoneAssign.
  ///
  /// In en, this message translates to:
  /// **'Car assigned. The driver has been told.'**
  String get flDoneAssign;

  /// No description provided for @flDoneGateOut.
  ///
  /// In en, this message translates to:
  /// **'The trip has started.'**
  String get flDoneGateOut;

  /// No description provided for @flDoneCheckpoint.
  ///
  /// In en, this message translates to:
  /// **'Stop recorded.'**
  String get flDoneCheckpoint;

  /// No description provided for @flDoneComplete.
  ///
  /// In en, this message translates to:
  /// **'Trip finished.'**
  String get flDoneComplete;

  /// No description provided for @flDoneSos.
  ///
  /// In en, this message translates to:
  /// **'Help request sent.'**
  String get flDoneSos;

  /// No description provided for @flDoneToll.
  ///
  /// In en, this message translates to:
  /// **'Toll sent for review.'**
  String get flDoneToll;

  /// No description provided for @flDoneRate.
  ///
  /// In en, this message translates to:
  /// **'Thank you for the rating.'**
  String get flDoneRate;

  /// No description provided for @flDoneCancel.
  ///
  /// In en, this message translates to:
  /// **'Request cancelled.'**
  String get flDoneCancel;

  /// No description provided for @flDoneTollOk.
  ///
  /// In en, this message translates to:
  /// **'Toll approved.'**
  String get flDoneTollOk;

  /// No description provided for @flDoneTollPay.
  ///
  /// In en, this message translates to:
  /// **'Toll marked paid.'**
  String get flDoneTollPay;

  /// No description provided for @flDoneAck.
  ///
  /// In en, this message translates to:
  /// **'The driver has been told help is coming.'**
  String get flDoneAck;

  /// No description provided for @flErrPurpose.
  ///
  /// In en, this message translates to:
  /// **'Say why you need the car.'**
  String get flErrPurpose;

  /// No description provided for @flErrLead.
  ///
  /// In en, this message translates to:
  /// **'Ask at least one hour ahead, unless it is critical.'**
  String get flErrLead;

  /// No description provided for @flErrFailed.
  ///
  /// In en, this message translates to:
  /// **'Something went wrong. Please try again.'**
  String get flErrFailed;

  /// No description provided for @flErrWindow.
  ///
  /// In en, this message translates to:
  /// **'Too early or too late. Ask transport to override.'**
  String get flErrWindow;

  /// No description provided for @flErrVehicle.
  ///
  /// In en, this message translates to:
  /// **'That car is not free or its papers have expired.'**
  String get flErrVehicle;

  /// No description provided for @flErrDriver.
  ///
  /// In en, this message translates to:
  /// **'That driver cannot take this trip.'**
  String get flErrDriver;

  /// No description provided for @flErrNoneFree.
  ///
  /// In en, this message translates to:
  /// **'No free car and driver fit this trip.'**
  String get flErrNoneFree;

  /// No description provided for @flTolls.
  ///
  /// In en, this message translates to:
  /// **'Tolls'**
  String get flTolls;

  /// No description provided for @flTimeline.
  ///
  /// In en, this message translates to:
  /// **'What happened'**
  String get flTimeline;

  /// No description provided for @flSosIntro.
  ///
  /// In en, this message translates to:
  /// **'Open calls from drivers. Transport and the gate acknowledge them.'**
  String get flSosIntro;

  /// No description provided for @flSosEmpty.
  ///
  /// In en, this message translates to:
  /// **'No help requests.'**
  String get flSosEmpty;

  /// No description provided for @flSosHelp.
  ///
  /// In en, this message translates to:
  /// **'Say where you are and what is wrong. Transport and the gate will see this at once.'**
  String get flSosHelp;

  /// No description provided for @flSosOpen.
  ///
  /// In en, this message translates to:
  /// **'Open'**
  String get flSosOpen;

  /// No description provided for @flSosAcked.
  ///
  /// In en, this message translates to:
  /// **'Help is coming'**
  String get flSosAcked;
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
