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
