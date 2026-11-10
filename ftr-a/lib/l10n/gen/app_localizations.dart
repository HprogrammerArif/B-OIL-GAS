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
  /// **'Sign in with your work email or employee ID.'**
  String get loginSubtitle;

  /// No description provided for @loginBrand.
  ///
  /// In en, this message translates to:
  /// **'OneOps'**
  String get loginBrand;

  /// No description provided for @loginWelcome.
  ///
  /// In en, this message translates to:
  /// **'Welcome back'**
  String get loginWelcome;

  /// No description provided for @loginEmailLabel.
  ///
  /// In en, this message translates to:
  /// **'Email'**
  String get loginEmailLabel;

  /// No description provided for @loginEmailHint.
  ///
  /// In en, this message translates to:
  /// **'Work email or employee ID'**
  String get loginEmailHint;

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

  /// No description provided for @loginPasswordHint.
  ///
  /// In en, this message translates to:
  /// **'Enter password'**
  String get loginPasswordHint;

  /// No description provided for @loginRemember.
  ///
  /// In en, this message translates to:
  /// **'Remember me'**
  String get loginRemember;

  /// No description provided for @loginOr.
  ///
  /// In en, this message translates to:
  /// **'or'**
  String get loginOr;

  /// No description provided for @loginLangEn.
  ///
  /// In en, this message translates to:
  /// **'EN'**
  String get loginLangEn;

  /// No description provided for @loginLangBn.
  ///
  /// In en, this message translates to:
  /// **'বাং'**
  String get loginLangBn;

  /// No description provided for @loginLangSwitch.
  ///
  /// In en, this message translates to:
  /// **'Switch to {language}'**
  String loginLangSwitch(String language);

  /// No description provided for @loginDemoAs.
  ///
  /// In en, this message translates to:
  /// **'Sign in as {role}'**
  String loginDemoAs(String role);

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

  /// No description provided for @navAttendance.
  ///
  /// In en, this message translates to:
  /// **'Attendance'**
  String get navAttendance;

  /// No description provided for @navApprovals.
  ///
  /// In en, this message translates to:
  /// **'Approvals'**
  String get navApprovals;

  /// No description provided for @navChat.
  ///
  /// In en, this message translates to:
  /// **'Chat'**
  String get navChat;

  /// No description provided for @homeSeeAll.
  ///
  /// In en, this message translates to:
  /// **'See all'**
  String get homeSeeAll;

  /// No description provided for @homePrimaryEmployee.
  ///
  /// In en, this message translates to:
  /// **'Your day at work'**
  String get homePrimaryEmployee;

  /// No description provided for @homePrimaryDriver.
  ///
  /// In en, this message translates to:
  /// **'Your trip'**
  String get homePrimaryDriver;

  /// No description provided for @homePrimaryGate.
  ///
  /// In en, this message translates to:
  /// **'Guests at the gate'**
  String get homePrimaryGate;

  /// No description provided for @homePrimaryMail.
  ///
  /// In en, this message translates to:
  /// **'Parcels waiting'**
  String get homePrimaryMail;

  /// No description provided for @homePrimaryHse.
  ///
  /// In en, this message translates to:
  /// **'Safety today'**
  String get homePrimaryHse;

  /// No description provided for @homePrimaryApprover.
  ///
  /// In en, this message translates to:
  /// **'Waiting for your decision'**
  String get homePrimaryApprover;

  /// No description provided for @homeActPunch.
  ///
  /// In en, this message translates to:
  /// **'Go to attendance'**
  String get homeActPunch;

  /// No description provided for @homeActTrip.
  ///
  /// In en, this message translates to:
  /// **'Open trips'**
  String get homeActTrip;

  /// No description provided for @homeActScanGuest.
  ///
  /// In en, this message translates to:
  /// **'Register a guest'**
  String get homeActScanGuest;

  /// No description provided for @homeActScanParcel.
  ///
  /// In en, this message translates to:
  /// **'Log a parcel'**
  String get homeActScanParcel;

  /// No description provided for @homeActApprovals.
  ///
  /// In en, this message translates to:
  /// **'Open approvals'**
  String get homeActApprovals;

  /// No description provided for @homeActAnnounce.
  ///
  /// In en, this message translates to:
  /// **'Send a notice'**
  String get homeActAnnounce;

  /// No description provided for @homeActIncidents.
  ///
  /// In en, this message translates to:
  /// **'Open incidents'**
  String get homeActIncidents;

  /// No description provided for @homeFilesWaiting.
  ///
  /// In en, this message translates to:
  /// **'Files waiting for you'**
  String get homeFilesWaiting;

  /// No description provided for @homeFilesClear.
  ///
  /// In en, this message translates to:
  /// **'Nothing is waiting. You are clear.'**
  String get homeFilesClear;

  /// No description provided for @homeFilesCount.
  ///
  /// In en, this message translates to:
  /// **'{count, plural, =0{Nothing is waiting. You are clear.} =1{1 file is waiting for you.} other{{count} files are waiting for you.}}'**
  String homeFilesCount(int count);

  /// No description provided for @homeLocksCount.
  ///
  /// In en, this message translates to:
  /// **'{count, plural, =0{No machine is locked out.} =1{1 machine is locked out.} other{{count} machines are locked out.}}'**
  String homeLocksCount(int count);

  /// No description provided for @homeLeadersOnline.
  ///
  /// In en, this message translates to:
  /// **'Leadership rooms'**
  String get homeLeadersOnline;

  /// No description provided for @homeRoomQuiet.
  ///
  /// In en, this message translates to:
  /// **'No new messages'**
  String get homeRoomQuiet;

  /// No description provided for @homeUnread.
  ///
  /// In en, this message translates to:
  /// **'{count} new'**
  String homeUnread(int count);

  /// No description provided for @homeReturnReason.
  ///
  /// In en, this message translates to:
  /// **'Why are you sending this back?'**
  String get homeReturnReason;

  /// No description provided for @homePlayBriefing.
  ///
  /// In en, this message translates to:
  /// **'Play briefing'**
  String get homePlayBriefing;

  /// No description provided for @homeBriefingLeft.
  ///
  /// In en, this message translates to:
  /// **'{seconds}s'**
  String homeBriefingLeft(int seconds);

  /// No description provided for @homeToday.
  ///
  /// In en, this message translates to:
  /// **'Today'**
  String get homeToday;

  /// No description provided for @homeNotPunched.
  ///
  /// In en, this message translates to:
  /// **'You have not punched in yet.'**
  String get homeNotPunched;

  /// No description provided for @homePunchedAt.
  ///
  /// In en, this message translates to:
  /// **'Punched in at {time}'**
  String homePunchedAt(String time);

  /// No description provided for @homeLeaveLeft.
  ///
  /// In en, this message translates to:
  /// **'{days} days left'**
  String homeLeaveLeft(String days);

  /// No description provided for @homeGatePass.
  ///
  /// In en, this message translates to:
  /// **'Ask for a gate pass'**
  String get homeGatePass;

  /// No description provided for @homeLocks.
  ///
  /// In en, this message translates to:
  /// **'Locks still on'**
  String get homeLocks;

  /// No description provided for @homeLocksClear.
  ///
  /// In en, this message translates to:
  /// **'No machine is locked out.'**
  String get homeLocksClear;

  /// No description provided for @homeReleaseBatch.
  ///
  /// In en, this message translates to:
  /// **'Release'**
  String get homeReleaseBatch;

  /// No description provided for @homeOpen.
  ///
  /// In en, this message translates to:
  /// **'Open'**
  String get homeOpen;

  /// No description provided for @homeOutputTitle.
  ///
  /// In en, this message translates to:
  /// **'Today\'s output'**
  String get homeOutputTitle;

  /// No description provided for @homeOutputLine.
  ///
  /// In en, this message translates to:
  /// **'Sunday made 5,320 MT. The daily target is 5,000.'**
  String get homeOutputLine;

  /// No description provided for @homeWeekTitle.
  ///
  /// In en, this message translates to:
  /// **'This week'**
  String get homeWeekTitle;

  /// No description provided for @homeBatchTitle.
  ///
  /// In en, this message translates to:
  /// **'Bitumen batch ready'**
  String get homeBatchTitle;

  /// No description provided for @homeBatchBody.
  ///
  /// In en, this message translates to:
  /// **'BOGCL-BIT-2026-B88 · Bitumen 60/70 · 2,400 metric tons. Lab tests passed.'**
  String get homeBatchBody;

  /// No description provided for @homeBatchDone.
  ///
  /// In en, this message translates to:
  /// **'Released. Loading gates are open.'**
  String get homeBatchDone;

  /// No description provided for @busRegister.
  ///
  /// In en, this message translates to:
  /// **'Register a bus'**
  String get busRegister;

  /// No description provided for @busReassign.
  ///
  /// In en, this message translates to:
  /// **'Move a bus'**
  String get busReassign;

  /// No description provided for @busSeatMap.
  ///
  /// In en, this message translates to:
  /// **'Seat map'**
  String get busSeatMap;

  /// No description provided for @busFieldCode.
  ///
  /// In en, this message translates to:
  /// **'Route code'**
  String get busFieldCode;

  /// No description provided for @busFieldName.
  ///
  /// In en, this message translates to:
  /// **'Route name'**
  String get busFieldName;

  /// No description provided for @busFieldPlate.
  ///
  /// In en, this message translates to:
  /// **'Bus number'**
  String get busFieldPlate;

  /// No description provided for @busSaved.
  ///
  /// In en, this message translates to:
  /// **'Saved'**
  String get busSaved;

  /// No description provided for @busSeatRegular.
  ///
  /// In en, this message translates to:
  /// **'Regular'**
  String get busSeatRegular;

  /// No description provided for @busSeatLady.
  ///
  /// In en, this message translates to:
  /// **'Lady priority'**
  String get busSeatLady;

  /// No description provided for @busSeatExecutive.
  ///
  /// In en, this message translates to:
  /// **'Executive'**
  String get busSeatExecutive;

  /// No description provided for @busSeatSenior.
  ///
  /// In en, this message translates to:
  /// **'Senior staff'**
  String get busSeatSenior;

  /// No description provided for @busMarkBoarded.
  ///
  /// In en, this message translates to:
  /// **'Mark boarded'**
  String get busMarkBoarded;

  /// No description provided for @busBoarded.
  ///
  /// In en, this message translates to:
  /// **'Boarded'**
  String get busBoarded;

  /// No description provided for @busSeatsFree.
  ///
  /// In en, this message translates to:
  /// **'{count} seats free'**
  String busSeatsFree(int count);

  /// No description provided for @flRegisterCar.
  ///
  /// In en, this message translates to:
  /// **'Register a car'**
  String get flRegisterCar;

  /// No description provided for @flEnrolDriver.
  ///
  /// In en, this message translates to:
  /// **'Enrol a driver'**
  String get flEnrolDriver;

  /// No description provided for @flFieldPlate.
  ///
  /// In en, this message translates to:
  /// **'Plate'**
  String get flFieldPlate;

  /// No description provided for @flFieldType.
  ///
  /// In en, this message translates to:
  /// **'Trip type'**
  String get flFieldType;

  /// No description provided for @flFieldEmp.
  ///
  /// In en, this message translates to:
  /// **'Employee code'**
  String get flFieldEmp;

  /// No description provided for @flFieldDriverCode.
  ///
  /// In en, this message translates to:
  /// **'Driver code'**
  String get flFieldDriverCode;

  /// No description provided for @flSaved.
  ///
  /// In en, this message translates to:
  /// **'Saved'**
  String get flSaved;

  /// No description provided for @asAsk.
  ///
  /// In en, this message translates to:
  /// **'Ask for equipment'**
  String get asAsk;

  /// No description provided for @asAskName.
  ///
  /// In en, this message translates to:
  /// **'What do you need?'**
  String get asAskName;

  /// No description provided for @asAskWhy.
  ///
  /// In en, this message translates to:
  /// **'Why'**
  String get asAskWhy;

  /// No description provided for @asAskDone.
  ///
  /// In en, this message translates to:
  /// **'Request sent'**
  String get asAskDone;

  /// No description provided for @chConfirmAck.
  ///
  /// In en, this message translates to:
  /// **'Confirm this directive'**
  String get chConfirmAck;

  /// No description provided for @chConfirmDone.
  ///
  /// In en, this message translates to:
  /// **'Mark this directive done'**
  String get chConfirmDone;

  /// No description provided for @chConfirmBody.
  ///
  /// In en, this message translates to:
  /// **'This is recorded on the directive. You cannot undo it here.'**
  String get chConfirmBody;

  /// No description provided for @moreMyWork.
  ///
  /// In en, this message translates to:
  /// **'My work'**
  String get moreMyWork;

  /// No description provided for @moreOperations.
  ///
  /// In en, this message translates to:
  /// **'Operations'**
  String get moreOperations;

  /// No description provided for @moreCompany.
  ///
  /// In en, this message translates to:
  /// **'Company'**
  String get moreCompany;

  /// No description provided for @moreGovernanceFinance.
  ///
  /// In en, this message translates to:
  /// **'Governance & Finance'**
  String get moreGovernanceFinance;

  /// No description provided for @moreDailyWork.
  ///
  /// In en, this message translates to:
  /// **'My Daily Work & HR'**
  String get moreDailyWork;

  /// No description provided for @moreTransportCommute.
  ///
  /// In en, this message translates to:
  /// **'Transport & Commute'**
  String get moreTransportCommute;

  /// No description provided for @moreSiteOperations.
  ///
  /// In en, this message translates to:
  /// **'Site Operations & Security'**
  String get moreSiteOperations;

  /// No description provided for @moreSafetyAssetsComms.
  ///
  /// In en, this message translates to:
  /// **'Refinery Safety, Assets & Chat'**
  String get moreSafetyAssetsComms;

  /// No description provided for @moreActivePersona.
  ///
  /// In en, this message translates to:
  /// **'Active Persona'**
  String get moreActivePersona;

  /// No description provided for @moreSwitchPersona.
  ///
  /// In en, this message translates to:
  /// **'Switch Persona'**
  String get moreSwitchPersona;

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

  /// No description provided for @evAddPhoto.
  ///
  /// In en, this message translates to:
  /// **'Add'**
  String get evAddPhoto;

  /// No description provided for @evPhotos.
  ///
  /// In en, this message translates to:
  /// **'Photos'**
  String get evPhotos;

  /// No description provided for @evPhotoCount.
  ///
  /// In en, this message translates to:
  /// **'{count} photos'**
  String evPhotoCount(int count);

  /// No description provided for @evPhotoOpenFailed.
  ///
  /// In en, this message translates to:
  /// **'Could not open the photo.'**
  String get evPhotoOpenFailed;

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

  /// No description provided for @attStatusNotIn.
  ///
  /// In en, this message translates to:
  /// **'Not in yet'**
  String get attStatusNotIn;

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

  /// No description provided for @noticeUseDraft.
  ///
  /// In en, this message translates to:
  /// **'Use a draft'**
  String get noticeUseDraft;

  /// No description provided for @noticeDraftPpe.
  ///
  /// In en, this message translates to:
  /// **'PPE before charging'**
  String get noticeDraftPpe;

  /// No description provided for @noticeDraftHoliday.
  ///
  /// In en, this message translates to:
  /// **'Holiday hours'**
  String get noticeDraftHoliday;

  /// No description provided for @noticeDraftQuarter.
  ///
  /// In en, this message translates to:
  /// **'Quarterly reports'**
  String get noticeDraftQuarter;

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

  /// No description provided for @claimAwaitEmptyTitle.
  ///
  /// In en, this message translates to:
  /// **'Nothing is waiting for you'**
  String get claimAwaitEmptyTitle;

  /// No description provided for @claimAwaitEmptyMessage.
  ///
  /// In en, this message translates to:
  /// **'Claims sent to you for a decision will appear here.'**
  String get claimAwaitEmptyMessage;

  /// No description provided for @claimScopeEmptyTitle.
  ///
  /// In en, this message translates to:
  /// **'No other claims'**
  String get claimScopeEmptyTitle;

  /// No description provided for @claimScopeEmptyMessage.
  ///
  /// In en, this message translates to:
  /// **'Claims from people you can see will appear here.'**
  String get claimScopeEmptyMessage;

  /// No description provided for @claimAwaitLoading.
  ///
  /// In en, this message translates to:
  /// **'Checking what is waiting for you.'**
  String get claimAwaitLoading;

  /// No description provided for @claimAwaitFailed.
  ///
  /// In en, this message translates to:
  /// **'Could not load the claims waiting for you.'**
  String get claimAwaitFailed;

  /// No description provided for @claimTabAwaiting.
  ///
  /// In en, this message translates to:
  /// **'{count, plural, =0{Awaiting me} other{Awaiting me ({count})}}'**
  String claimTabAwaiting(int count);

  /// No description provided for @claimTabPlant.
  ///
  /// In en, this message translates to:
  /// **'This plant'**
  String get claimTabPlant;

  /// No description provided for @claimTabAll.
  ///
  /// In en, this message translates to:
  /// **'All claims'**
  String get claimTabAll;

  /// No description provided for @claimTabTeam.
  ///
  /// In en, this message translates to:
  /// **'My team'**
  String get claimTabTeam;

  /// No description provided for @claimAwaitCount.
  ///
  /// In en, this message translates to:
  /// **'{count, plural, =0{Nothing is waiting for your decision.} =1{1 claim needs your decision, {amount} in total.} other{{count} claims need your decision, {amount} in total.}}'**
  String claimAwaitCount(int count, String amount);

  /// No description provided for @claimScopeNone.
  ///
  /// In en, this message translates to:
  /// **'No other claims are moving through here.'**
  String get claimScopeNone;

  /// No description provided for @claimScopeQuiet.
  ///
  /// In en, this message translates to:
  /// **'{count, plural, =1{1 claim is here. None of them need a decision.} other{{count} claims are here. None of them need a decision.}}'**
  String claimScopeQuiet(int count);

  /// No description provided for @claimScopeWaiting.
  ///
  /// In en, this message translates to:
  /// **'{count, plural, =1{1 claim is with {names}.} other{{count} claims are with {names}.}}'**
  String claimScopeWaiting(int count, String names);

  /// No description provided for @claimWaitingFor.
  ///
  /// In en, this message translates to:
  /// **'Waiting for {name}'**
  String claimWaitingFor(String name);

  /// No description provided for @claimMineClear.
  ///
  /// In en, this message translates to:
  /// **'You have no open claims.'**
  String get claimMineClear;

  /// No description provided for @claimMineReturned.
  ///
  /// In en, this message translates to:
  /// **'{count, plural, =1{1 claim was sent back for you to fix.} other{{count} claims were sent back for you to fix.}}'**
  String claimMineReturned(int count);

  /// No description provided for @claimMineChecking.
  ///
  /// In en, this message translates to:
  /// **'{count, plural, =1{1 claim is being checked, {amount} in total.} other{{count} claims are being checked, {amount} in total.}}'**
  String claimMineChecking(int count, String amount);

  /// No description provided for @claimMineApproved.
  ///
  /// In en, this message translates to:
  /// **'{count, plural, =1{1 claim is approved and waiting to be paid, {amount}.} other{{count} claims are approved and waiting to be paid, {amount} in total.}}'**
  String claimMineApproved(int count, String amount);

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

  /// No description provided for @claimBankFile.
  ///
  /// In en, this message translates to:
  /// **'Bank file'**
  String get claimBankFile;

  /// No description provided for @claimBankReady.
  ///
  /// In en, this message translates to:
  /// **'Today\'s bank transfer'**
  String get claimBankReady;

  /// No description provided for @claimBankEmpty.
  ///
  /// In en, this message translates to:
  /// **'Nothing is waiting to be paid.'**
  String get claimBankEmpty;

  /// No description provided for @claimBankCopied.
  ///
  /// In en, this message translates to:
  /// **'The bank file is copied.'**
  String get claimBankCopied;

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

  /// No description provided for @approvalAlreadySigned.
  ///
  /// In en, this message translates to:
  /// **'Already signed'**
  String get approvalAlreadySigned;

  /// No description provided for @approvalESign.
  ///
  /// In en, this message translates to:
  /// **'Approve & E-Sign'**
  String get approvalESign;

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
  /// **'All files'**
  String get nsTabAll;

  /// No description provided for @nsFilterAllStatuses.
  ///
  /// In en, this message translates to:
  /// **'All'**
  String get nsFilterAllStatuses;

  /// No description provided for @nsSearchHint.
  ///
  /// In en, this message translates to:
  /// **'Search title, file number, or officer...'**
  String get nsSearchHint;

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

  /// No description provided for @nsBudgetTitle.
  ///
  /// In en, this message translates to:
  /// **'Is there budget?'**
  String get nsBudgetTitle;

  /// No description provided for @nsBudgetWithin.
  ///
  /// In en, this message translates to:
  /// **'Within budget'**
  String get nsBudgetWithin;

  /// No description provided for @nsBudgetOver.
  ///
  /// In en, this message translates to:
  /// **'Over budget'**
  String get nsBudgetOver;

  /// No description provided for @nsBudgetNone.
  ///
  /// In en, this message translates to:
  /// **'This file has no fixed amount to check against the budget.'**
  String get nsBudgetNone;

  /// No description provided for @nsBudgetAvailable.
  ///
  /// In en, this message translates to:
  /// **'Available {amount}'**
  String nsBudgetAvailable(String amount);

  /// No description provided for @nsBudgetRequest.
  ///
  /// In en, this message translates to:
  /// **'This request {amount}'**
  String nsBudgetRequest(String amount);

  /// No description provided for @nsBudgetLeft.
  ///
  /// In en, this message translates to:
  /// **'Left after this {amount}'**
  String nsBudgetLeft(String amount);

  /// No description provided for @nsBudgetShort.
  ///
  /// In en, this message translates to:
  /// **'Short by {amount}'**
  String nsBudgetShort(String amount);

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

  /// No description provided for @nsDetails.
  ///
  /// In en, this message translates to:
  /// **'Details'**
  String get nsDetails;

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

  /// No description provided for @nsWhoTitle.
  ///
  /// In en, this message translates to:
  /// **'Who signs this'**
  String get nsWhoTitle;

  /// No description provided for @nsRouteSuggested.
  ///
  /// In en, this message translates to:
  /// **'This is the usual order for this amount. People sign from top to bottom. The last person closes the file.'**
  String get nsRouteSuggested;

  /// No description provided for @nsRouteCustom.
  ///
  /// In en, this message translates to:
  /// **'You changed the order. People still sign from top to bottom. The last person closes the file.'**
  String get nsRouteCustom;

  /// No description provided for @nsRouteRestore.
  ///
  /// In en, this message translates to:
  /// **'Use the suggested order'**
  String get nsRouteRestore;

  /// No description provided for @nsRouteCloses.
  ///
  /// In en, this message translates to:
  /// **'Closes the file'**
  String get nsRouteCloses;

  /// No description provided for @nsRouteAdd.
  ///
  /// In en, this message translates to:
  /// **'Add a person'**
  String get nsRouteAdd;

  /// No description provided for @nsRouteAddHint.
  ///
  /// In en, this message translates to:
  /// **'Search by name'**
  String get nsRouteAddHint;

  /// No description provided for @nsRouteEmpty.
  ///
  /// In en, this message translates to:
  /// **'No one was suggested. Add the person who should sign.'**
  String get nsRouteEmpty;

  /// No description provided for @nsRouteNeedOne.
  ///
  /// In en, this message translates to:
  /// **'Add at least one person to sign this file.'**
  String get nsRouteNeedOne;

  /// No description provided for @nsRouteKept.
  ///
  /// In en, this message translates to:
  /// **'This file keeps the signing order it already has.'**
  String get nsRouteKept;

  /// No description provided for @nsRouteDuplicate.
  ///
  /// In en, this message translates to:
  /// **'That person is already on the list.'**
  String get nsRouteDuplicate;

  /// No description provided for @nsRouteDrag.
  ///
  /// In en, this message translates to:
  /// **'Drag to change the order'**
  String get nsRouteDrag;

  /// No description provided for @nsRouteRemove.
  ///
  /// In en, this message translates to:
  /// **'Remove'**
  String get nsRouteRemove;

  /// No description provided for @nsRouteFields.
  ///
  /// In en, this message translates to:
  /// **'Complete the required fields above to proceed.'**
  String get nsRouteFields;

  /// No description provided for @nsRouteNone.
  ///
  /// In en, this message translates to:
  /// **'No one matches that name.'**
  String get nsRouteNone;

  /// No description provided for @nsErrSignerSelf.
  ///
  /// In en, this message translates to:
  /// **'You cannot sign your own file.'**
  String get nsErrSignerSelf;

  /// No description provided for @nsErrSignerDup.
  ///
  /// In en, this message translates to:
  /// **'Each person can sign only once.'**
  String get nsErrSignerDup;

  /// No description provided for @nsErrSignerMissing.
  ///
  /// In en, this message translates to:
  /// **'Choose someone who works here.'**
  String get nsErrSignerMissing;

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

  /// No description provided for @nsSignUpload.
  ///
  /// In en, this message translates to:
  /// **'Upload'**
  String get nsSignUpload;

  /// No description provided for @nsSignUploadHint.
  ///
  /// In en, this message translates to:
  /// **'Tap to choose signature image'**
  String get nsSignUploadHint;

  /// No description provided for @nsSignUploadSub.
  ///
  /// In en, this message translates to:
  /// **'PNG or JPG from device gallery or files'**
  String get nsSignUploadSub;

  /// No description provided for @nsSignErrUpload.
  ///
  /// In en, this message translates to:
  /// **'Please choose a signature image first.'**
  String get nsSignErrUpload;

  /// No description provided for @nsSignChange.
  ///
  /// In en, this message translates to:
  /// **'Change'**
  String get nsSignChange;

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

  /// Hint for the reject/return reason dropdown on the signature sheet
  ///
  /// In en, this message translates to:
  /// **'Select a reason'**
  String get nsSignReasonPick;

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

  /// No description provided for @nsSignReturnConfirm.
  ///
  /// In en, this message translates to:
  /// **'Sign and return'**
  String get nsSignReturnConfirm;

  /// No description provided for @nsSignRejectConfirm.
  ///
  /// In en, this message translates to:
  /// **'Sign and reject'**
  String get nsSignRejectConfirm;

  /// No description provided for @nsSignErrReason.
  ///
  /// In en, this message translates to:
  /// **'Write a reason of at least 10 characters.'**
  String get nsSignErrReason;

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

  /// No description provided for @pcTabAll.
  ///
  /// In en, this message translates to:
  /// **'All'**
  String get pcTabAll;

  /// No description provided for @pcFilter.
  ///
  /// In en, this message translates to:
  /// **'Filters'**
  String get pcFilter;

  /// No description provided for @pcFilterStatus.
  ///
  /// In en, this message translates to:
  /// **'Status'**
  String get pcFilterStatus;

  /// No description provided for @pcFilterAllStatuses.
  ///
  /// In en, this message translates to:
  /// **'All statuses'**
  String get pcFilterAllStatuses;

  /// No description provided for @pcDirHqPlant.
  ///
  /// In en, this message translates to:
  /// **'HQ to plant'**
  String get pcDirHqPlant;

  /// No description provided for @pcDirPlantHq.
  ///
  /// In en, this message translates to:
  /// **'Plant to HQ'**
  String get pcDirPlantHq;

  /// No description provided for @pcDirExternal.
  ///
  /// In en, this message translates to:
  /// **'Outside the company'**
  String get pcDirExternal;

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

  /// No description provided for @pcUseDraft.
  ///
  /// In en, this message translates to:
  /// **'Use a draft'**
  String get pcUseDraft;

  /// No description provided for @pcDraftTender.
  ///
  /// In en, this message translates to:
  /// **'Tender papers'**
  String get pcDraftTender;

  /// No description provided for @pcDraftSpares.
  ///
  /// In en, this message translates to:
  /// **'Plant spares'**
  String get pcDraftSpares;

  /// No description provided for @pcDraftLicence.
  ///
  /// In en, this message translates to:
  /// **'Licence files'**
  String get pcDraftLicence;

  /// No description provided for @pcDraftIt.
  ///
  /// In en, this message translates to:
  /// **'IT kit'**
  String get pcDraftIt;

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
  /// **'All'**
  String get visTabAll;

  /// No description provided for @visFilter.
  ///
  /// In en, this message translates to:
  /// **'Filters'**
  String get visFilter;

  /// No description provided for @visFilterCategories.
  ///
  /// In en, this message translates to:
  /// **'Kind of guest'**
  String get visFilterCategories;

  /// No description provided for @visFilterAllCategories.
  ///
  /// In en, this message translates to:
  /// **'All kinds'**
  String get visFilterAllCategories;

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

  /// No description provided for @visDetPass.
  ///
  /// In en, this message translates to:
  /// **'Pass number'**
  String get visDetPass;

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

  /// No description provided for @moduleIncidents.
  ///
  /// In en, this message translates to:
  /// **'Safety'**
  String get moduleIncidents;

  /// No description provided for @inIntro.
  ///
  /// In en, this message translates to:
  /// **'Report what you saw. The safety team triages it, finds the cause, and tracks the fix.'**
  String get inIntro;

  /// No description provided for @inNew.
  ///
  /// In en, this message translates to:
  /// **'Report what happened'**
  String get inNew;

  /// No description provided for @inSearchHint.
  ///
  /// In en, this message translates to:
  /// **'Search title or place'**
  String get inSearchHint;

  /// No description provided for @inTabMine.
  ///
  /// In en, this message translates to:
  /// **'Mine'**
  String get inTabMine;

  /// No description provided for @inTabTriage.
  ///
  /// In en, this message translates to:
  /// **'Waiting for you'**
  String get inTabTriage;

  /// No description provided for @inTabOpen.
  ///
  /// In en, this message translates to:
  /// **'Still open'**
  String get inTabOpen;

  /// No description provided for @inTabSerious.
  ///
  /// In en, this message translates to:
  /// **'Serious'**
  String get inTabSerious;

  /// No description provided for @inTabStatutory.
  ///
  /// In en, this message translates to:
  /// **'Government report'**
  String get inTabStatutory;

  /// No description provided for @inTabCapa.
  ///
  /// In en, this message translates to:
  /// **'My fixes'**
  String get inTabCapa;

  /// No description provided for @inTabAll.
  ///
  /// In en, this message translates to:
  /// **'All'**
  String get inTabAll;

  /// No description provided for @inTabOverview.
  ///
  /// In en, this message translates to:
  /// **'Overview'**
  String get inTabOverview;

  /// No description provided for @inTabRca.
  ///
  /// In en, this message translates to:
  /// **'Cause'**
  String get inTabRca;

  /// No description provided for @inTabFixes.
  ///
  /// In en, this message translates to:
  /// **'Fixes'**
  String get inTabFixes;

  /// No description provided for @inTabGov.
  ///
  /// In en, this message translates to:
  /// **'Government'**
  String get inTabGov;

  /// No description provided for @inFilter.
  ///
  /// In en, this message translates to:
  /// **'Filters'**
  String get inFilter;

  /// No description provided for @inFilterZones.
  ///
  /// In en, this message translates to:
  /// **'Plant area'**
  String get inFilterZones;

  /// No description provided for @inFilterAllZones.
  ///
  /// In en, this message translates to:
  /// **'All areas'**
  String get inFilterAllZones;

  /// No description provided for @inZone1.
  ///
  /// In en, this message translates to:
  /// **'Zone 1: Crude distillation'**
  String get inZone1;

  /// No description provided for @inZone2.
  ///
  /// In en, this message translates to:
  /// **'Zone 2: Vacuum distillation'**
  String get inZone2;

  /// No description provided for @inZone3.
  ///
  /// In en, this message translates to:
  /// **'Zone 3: Bitumen blowing'**
  String get inZone3;

  /// No description provided for @inZone4.
  ///
  /// In en, this message translates to:
  /// **'Zone 4: Tank farm'**
  String get inZone4;

  /// No description provided for @inZone5.
  ///
  /// In en, this message translates to:
  /// **'Zone 5: River jetty'**
  String get inZone5;

  /// No description provided for @inZone6.
  ///
  /// In en, this message translates to:
  /// **'Zone 6: Boiler house'**
  String get inZone6;

  /// No description provided for @inZone7.
  ///
  /// In en, this message translates to:
  /// **'Zone 7: QC lab'**
  String get inZone7;

  /// No description provided for @inZone8.
  ///
  /// In en, this message translates to:
  /// **'Zone 8: Drum yard'**
  String get inZone8;

  /// No description provided for @inZone9.
  ///
  /// In en, this message translates to:
  /// **'Zone 9: Substation 3'**
  String get inZone9;

  /// No description provided for @inZone10.
  ///
  /// In en, this message translates to:
  /// **'Zone 10: Baridhara HQ'**
  String get inZone10;

  /// No description provided for @inZoneUnassigned.
  ///
  /// In en, this message translates to:
  /// **'Area not set'**
  String get inZoneUnassigned;

  /// No description provided for @inDetNo.
  ///
  /// In en, this message translates to:
  /// **'Report number'**
  String get inDetNo;

  /// No description provided for @inWhenBy.
  ///
  /// In en, this message translates to:
  /// **'{when} · {name}'**
  String inWhenBy(String when, String name);

  /// No description provided for @inEmpty.
  ///
  /// In en, this message translates to:
  /// **'No safety reports here.'**
  String get inEmpty;

  /// No description provided for @inEmptyFiltered.
  ///
  /// In en, this message translates to:
  /// **'Nothing matches that search.'**
  String get inEmptyFiltered;

  /// No description provided for @inVerdictNone.
  ///
  /// In en, this message translates to:
  /// **'Nothing waiting on you.'**
  String get inVerdictNone;

  /// No description provided for @inVerdictNeed.
  ///
  /// In en, this message translates to:
  /// **'{count} waiting on you'**
  String inVerdictNeed(int count);

  /// No description provided for @inTypeNear.
  ///
  /// In en, this message translates to:
  /// **'Near miss'**
  String get inTypeNear;

  /// No description provided for @inTypeHazard.
  ///
  /// In en, this message translates to:
  /// **'Unsafe condition'**
  String get inTypeHazard;

  /// No description provided for @inTypeMedical.
  ///
  /// In en, this message translates to:
  /// **'Medical treatment'**
  String get inTypeMedical;

  /// No description provided for @inTypeLost.
  ///
  /// In en, this message translates to:
  /// **'Lost-time injury'**
  String get inTypeLost;

  /// No description provided for @inTypeSpill.
  ///
  /// In en, this message translates to:
  /// **'Spill or leak'**
  String get inTypeSpill;

  /// No description provided for @inTypeFire.
  ///
  /// In en, this message translates to:
  /// **'Fire or heat'**
  String get inTypeFire;

  /// No description provided for @inTypeEquip.
  ///
  /// In en, this message translates to:
  /// **'Equipment damaged'**
  String get inTypeEquip;

  /// No description provided for @inTypeVehicle.
  ///
  /// In en, this message translates to:
  /// **'Vehicle accident'**
  String get inTypeVehicle;

  /// No description provided for @inTypeEnv.
  ///
  /// In en, this message translates to:
  /// **'Environmental'**
  String get inTypeEnv;

  /// No description provided for @inTypePipe.
  ///
  /// In en, this message translates to:
  /// **'Pressure or piping'**
  String get inTypePipe;

  /// No description provided for @inTypeFatal.
  ///
  /// In en, this message translates to:
  /// **'Fatality'**
  String get inTypeFatal;

  /// No description provided for @inStageReported.
  ///
  /// In en, this message translates to:
  /// **'Waiting for safety'**
  String get inStageReported;

  /// No description provided for @inStageTriaged.
  ///
  /// In en, this message translates to:
  /// **'Assigned'**
  String get inStageTriaged;

  /// No description provided for @inStageInvest.
  ///
  /// In en, this message translates to:
  /// **'Finding the cause'**
  String get inStageInvest;

  /// No description provided for @inStageCapa.
  ///
  /// In en, this message translates to:
  /// **'Fix in progress'**
  String get inStageCapa;

  /// No description provided for @inStageReview.
  ///
  /// In en, this message translates to:
  /// **'Waiting to close'**
  String get inStageReview;

  /// No description provided for @inStageClosed.
  ///
  /// In en, this message translates to:
  /// **'Closed'**
  String get inStageClosed;

  /// No description provided for @inRiskLow.
  ///
  /// In en, this message translates to:
  /// **'Low risk'**
  String get inRiskLow;

  /// No description provided for @inRiskMedium.
  ///
  /// In en, this message translates to:
  /// **'Medium risk'**
  String get inRiskMedium;

  /// No description provided for @inRiskHigh.
  ///
  /// In en, this message translates to:
  /// **'High risk'**
  String get inRiskHigh;

  /// No description provided for @inRiskExtreme.
  ///
  /// In en, this message translates to:
  /// **'Extreme risk'**
  String get inRiskExtreme;

  /// No description provided for @inRiskLine.
  ///
  /// In en, this message translates to:
  /// **'Score {score} · {label}'**
  String inRiskLine(int score, String label);

  /// No description provided for @inAnonymous.
  ///
  /// In en, this message translates to:
  /// **'Someone who asked not to be named'**
  String get inAnonymous;

  /// No description provided for @inNextTriage.
  ///
  /// In en, this message translates to:
  /// **'Decide how serious {name}’s report is and name an investigator.'**
  String inNextTriage(String name);

  /// No description provided for @inNextWaitHse.
  ///
  /// In en, this message translates to:
  /// **'Waiting for the plant safety lead. Nothing for you to do.'**
  String get inNextWaitHse;

  /// No description provided for @inNextReported.
  ///
  /// In en, this message translates to:
  /// **'Waiting for the safety team.'**
  String get inNextReported;

  /// No description provided for @inNextStart.
  ///
  /// In en, this message translates to:
  /// **'Start the investigation.'**
  String get inNextStart;

  /// No description provided for @inNextTriaged.
  ///
  /// In en, this message translates to:
  /// **'An investigator has been named.'**
  String get inNextTriaged;

  /// No description provided for @inNextRca.
  ///
  /// In en, this message translates to:
  /// **'Write the three whys and the root cause.'**
  String get inNextRca;

  /// No description provided for @inNextInvest.
  ///
  /// In en, this message translates to:
  /// **'The cause is being found.'**
  String get inNextInvest;

  /// No description provided for @inNextMyCapa.
  ///
  /// In en, this message translates to:
  /// **'Do the fix assigned to you.'**
  String get inNextMyCapa;

  /// No description provided for @inNextVerify.
  ///
  /// In en, this message translates to:
  /// **'Confirm a finished fix.'**
  String get inNextVerify;

  /// No description provided for @inNextReview.
  ///
  /// In en, this message translates to:
  /// **'All fixes are done. Send it for close.'**
  String get inNextReview;

  /// No description provided for @inNextCapa.
  ///
  /// In en, this message translates to:
  /// **'Fixes are still open.'**
  String get inNextCapa;

  /// No description provided for @inNextSignSafety.
  ///
  /// In en, this message translates to:
  /// **'Sign as the safety lead.'**
  String get inNextSignSafety;

  /// No description provided for @inNextSignGm.
  ///
  /// In en, this message translates to:
  /// **'Sign as the plant head to close it.'**
  String get inNextSignGm;

  /// No description provided for @inNextReviewWait.
  ///
  /// In en, this message translates to:
  /// **'Waiting for the plant head to close it.'**
  String get inNextReviewWait;

  /// No description provided for @inNextClosed.
  ///
  /// In en, this message translates to:
  /// **'This report is closed.'**
  String get inNextClosed;

  /// No description provided for @inFormIntro.
  ///
  /// In en, this message translates to:
  /// **'Say what happened, where, and how bad it could have been. Safety sees it at once. You may hide your name.'**
  String get inFormIntro;

  /// No description provided for @inFieldType.
  ///
  /// In en, this message translates to:
  /// **'What kind of event'**
  String get inFieldType;

  /// No description provided for @inFieldTitle.
  ///
  /// In en, this message translates to:
  /// **'Short title'**
  String get inFieldTitle;

  /// No description provided for @inFieldDesc.
  ///
  /// In en, this message translates to:
  /// **'What you saw'**
  String get inFieldDesc;

  /// No description provided for @inFieldSite.
  ///
  /// In en, this message translates to:
  /// **'Which site'**
  String get inFieldSite;

  /// No description provided for @inFieldZone.
  ///
  /// In en, this message translates to:
  /// **'Which area'**
  String get inFieldZone;

  /// No description provided for @inFieldWhen.
  ///
  /// In en, this message translates to:
  /// **'When it happened'**
  String get inFieldWhen;

  /// No description provided for @inFieldSev.
  ///
  /// In en, this message translates to:
  /// **'How bad if it happens again: {n}'**
  String inFieldSev(int n);

  /// No description provided for @inFieldLike.
  ///
  /// In en, this message translates to:
  /// **'How likely it happens again: {n}'**
  String inFieldLike(int n);

  /// No description provided for @inFieldAnon.
  ///
  /// In en, this message translates to:
  /// **'Hide my name'**
  String get inFieldAnon;

  /// No description provided for @inFieldAnonHelp.
  ///
  /// In en, this message translates to:
  /// **'Safety still sees the report. Your name is not shown to others.'**
  String get inFieldAnonHelp;

  /// No description provided for @inCreate.
  ///
  /// In en, this message translates to:
  /// **'Send report'**
  String get inCreate;

  /// No description provided for @inUseDraft.
  ///
  /// In en, this message translates to:
  /// **'Use a draft'**
  String get inUseDraft;

  /// No description provided for @inDraftValve.
  ///
  /// In en, this message translates to:
  /// **'Valve drip'**
  String get inDraftValve;

  /// No description provided for @inDraftForklift.
  ///
  /// In en, this message translates to:
  /// **'Forklift alarm'**
  String get inDraftForklift;

  /// No description provided for @inDraftEarthing.
  ///
  /// In en, this message translates to:
  /// **'Earthing clamp'**
  String get inDraftEarthing;

  /// No description provided for @inConfirmSerious.
  ///
  /// In en, this message translates to:
  /// **'This will page the plant head now'**
  String get inConfirmSerious;

  /// No description provided for @inConfirmSeriousMsg.
  ///
  /// In en, this message translates to:
  /// **'High or extreme scores notify the safety lead and the chairman at once.'**
  String get inConfirmSeriousMsg;

  /// No description provided for @inWhat.
  ///
  /// In en, this message translates to:
  /// **'What is this'**
  String get inWhat;

  /// No description provided for @inWho.
  ///
  /// In en, this message translates to:
  /// **'Reported by {name} on {when}.'**
  String inWho(String name, String when);

  /// No description provided for @inMeta.
  ///
  /// In en, this message translates to:
  /// **'Happened {when} at {site}, {zone}. Risk score {score}.'**
  String inMeta(String when, String site, String zone, String score);

  /// No description provided for @inInvestigator.
  ///
  /// In en, this message translates to:
  /// **'Investigator: {name}'**
  String inInvestigator(String name);

  /// No description provided for @inStatutoryDue.
  ///
  /// In en, this message translates to:
  /// **'Must tell {body} by {when}.'**
  String inStatutoryDue(String body, String when);

  /// No description provided for @inStatutoryDone.
  ///
  /// In en, this message translates to:
  /// **'Filed as {receipt}.'**
  String inStatutoryDone(String receipt);

  /// No description provided for @inActTriage.
  ///
  /// In en, this message translates to:
  /// **'Triage'**
  String get inActTriage;

  /// No description provided for @inActInvest.
  ///
  /// In en, this message translates to:
  /// **'Start investigation'**
  String get inActInvest;

  /// No description provided for @inActRca.
  ///
  /// In en, this message translates to:
  /// **'Write the cause'**
  String get inActRca;

  /// No description provided for @inActCapa.
  ///
  /// In en, this message translates to:
  /// **'Add a fix'**
  String get inActCapa;

  /// No description provided for @inActStatutory.
  ///
  /// In en, this message translates to:
  /// **'Record government filing'**
  String get inActStatutory;

  /// No description provided for @inActSignSafety.
  ///
  /// In en, this message translates to:
  /// **'Sign as safety'**
  String get inActSignSafety;

  /// No description provided for @inActSignGm.
  ///
  /// In en, this message translates to:
  /// **'Close as plant head'**
  String get inActSignGm;

  /// No description provided for @inActStart.
  ///
  /// In en, this message translates to:
  /// **'Start'**
  String get inActStart;

  /// No description provided for @inActComplete.
  ///
  /// In en, this message translates to:
  /// **'Done'**
  String get inActComplete;

  /// No description provided for @inActVerify.
  ///
  /// In en, this message translates to:
  /// **'Confirm'**
  String get inActVerify;

  /// No description provided for @inFieldInvestigator.
  ///
  /// In en, this message translates to:
  /// **'Who will investigate'**
  String get inFieldInvestigator;

  /// No description provided for @inFieldOwner.
  ///
  /// In en, this message translates to:
  /// **'Who will do the fix'**
  String get inFieldOwner;

  /// No description provided for @inFieldWhy1.
  ///
  /// In en, this message translates to:
  /// **'Why 1'**
  String get inFieldWhy1;

  /// No description provided for @inFieldWhy2.
  ///
  /// In en, this message translates to:
  /// **'Why 2'**
  String get inFieldWhy2;

  /// No description provided for @inFieldWhy3.
  ///
  /// In en, this message translates to:
  /// **'Why 3'**
  String get inFieldWhy3;

  /// No description provided for @inFieldRoot.
  ///
  /// In en, this message translates to:
  /// **'Root cause'**
  String get inFieldRoot;

  /// No description provided for @inFieldCapa.
  ///
  /// In en, this message translates to:
  /// **'What must be fixed'**
  String get inFieldCapa;

  /// No description provided for @inFieldReceipt.
  ///
  /// In en, this message translates to:
  /// **'Receipt or diary number'**
  String get inFieldReceipt;

  /// No description provided for @inFieldEvidence.
  ///
  /// In en, this message translates to:
  /// **'What you did'**
  String get inFieldEvidence;

  /// No description provided for @inRca.
  ///
  /// In en, this message translates to:
  /// **'Root cause'**
  String get inRca;

  /// No description provided for @inFixes.
  ///
  /// In en, this message translates to:
  /// **'Fixes'**
  String get inFixes;

  /// No description provided for @inDoneCreate.
  ///
  /// In en, this message translates to:
  /// **'Report sent to the safety team.'**
  String get inDoneCreate;

  /// No description provided for @inDoneTriage.
  ///
  /// In en, this message translates to:
  /// **'Investigator named.'**
  String get inDoneTriage;

  /// No description provided for @inDoneInvest.
  ///
  /// In en, this message translates to:
  /// **'Investigation started.'**
  String get inDoneInvest;

  /// No description provided for @inDoneRca.
  ///
  /// In en, this message translates to:
  /// **'Root cause recorded.'**
  String get inDoneRca;

  /// No description provided for @inDoneCapa.
  ///
  /// In en, this message translates to:
  /// **'Fix assigned.'**
  String get inDoneCapa;

  /// No description provided for @inDoneStatutory.
  ///
  /// In en, this message translates to:
  /// **'Filing recorded.'**
  String get inDoneStatutory;

  /// No description provided for @inDoneSignSafety.
  ///
  /// In en, this message translates to:
  /// **'Safety signature recorded.'**
  String get inDoneSignSafety;

  /// No description provided for @inDoneSignGm.
  ///
  /// In en, this message translates to:
  /// **'Report closed.'**
  String get inDoneSignGm;

  /// No description provided for @inDoneStart.
  ///
  /// In en, this message translates to:
  /// **'Fix started.'**
  String get inDoneStart;

  /// No description provided for @inDoneComplete.
  ///
  /// In en, this message translates to:
  /// **'Fix marked done.'**
  String get inDoneComplete;

  /// No description provided for @inDoneVerify.
  ///
  /// In en, this message translates to:
  /// **'Fix confirmed.'**
  String get inDoneVerify;

  /// No description provided for @inErrTitle.
  ///
  /// In en, this message translates to:
  /// **'Write a short title.'**
  String get inErrTitle;

  /// No description provided for @inErrDesc.
  ///
  /// In en, this message translates to:
  /// **'Describe what you saw in a few sentences.'**
  String get inErrDesc;

  /// No description provided for @inErrFailed.
  ///
  /// In en, this message translates to:
  /// **'Something went wrong. Please try again.'**
  String get inErrFailed;

  /// No description provided for @inErrRca.
  ///
  /// In en, this message translates to:
  /// **'Find the root cause before adding a fix.'**
  String get inErrRca;

  /// No description provided for @inErrCapaOpen.
  ///
  /// In en, this message translates to:
  /// **'Every fix must be confirmed first.'**
  String get inErrCapaOpen;

  /// No description provided for @inErrCapaSelf.
  ///
  /// In en, this message translates to:
  /// **'Someone else must confirm your own fix.'**
  String get inErrCapaSelf;

  /// No description provided for @inErrNotStat.
  ///
  /// In en, this message translates to:
  /// **'This report does not need a government filing.'**
  String get inErrNotStat;

  /// No description provided for @moduleAssets.
  ///
  /// In en, this message translates to:
  /// **'Equipment'**
  String get moduleAssets;

  /// No description provided for @asIntro.
  ///
  /// In en, this message translates to:
  /// **'Machines, cars and kits in your care. Those that need a signature, a repair or a safety lock sit first.'**
  String get asIntro;

  /// No description provided for @asSearchHint.
  ///
  /// In en, this message translates to:
  /// **'Search by name or serial'**
  String get asSearchHint;

  /// No description provided for @asNew.
  ///
  /// In en, this message translates to:
  /// **'Add equipment'**
  String get asNew;

  /// No description provided for @asNewIntro.
  ///
  /// In en, this message translates to:
  /// **'Register something the company already bought.'**
  String get asNewIntro;

  /// No description provided for @asTabMine.
  ///
  /// In en, this message translates to:
  /// **'Mine'**
  String get asTabMine;

  /// No description provided for @asTabAttention.
  ///
  /// In en, this message translates to:
  /// **'Needs you'**
  String get asTabAttention;

  /// No description provided for @asTabSign.
  ///
  /// In en, this message translates to:
  /// **'Waiting to sign'**
  String get asTabSign;

  /// No description provided for @asTabRepair.
  ///
  /// In en, this message translates to:
  /// **'In repair'**
  String get asTabRepair;

  /// No description provided for @asTabCal.
  ///
  /// In en, this message translates to:
  /// **'Calibration'**
  String get asTabCal;

  /// No description provided for @asTabRetire.
  ///
  /// In en, this message translates to:
  /// **'Ready to retire'**
  String get asTabRetire;

  /// No description provided for @asTabStock.
  ///
  /// In en, this message translates to:
  /// **'In store'**
  String get asTabStock;

  /// No description provided for @asTabCars.
  ///
  /// In en, this message translates to:
  /// **'Cars'**
  String get asTabCars;

  /// No description provided for @asTabAll.
  ///
  /// In en, this message translates to:
  /// **'All'**
  String get asTabAll;

  /// No description provided for @asEmpty.
  ///
  /// In en, this message translates to:
  /// **'Nothing in this list.'**
  String get asEmpty;

  /// No description provided for @asEmptyFiltered.
  ///
  /// In en, this message translates to:
  /// **'Nothing matches that search.'**
  String get asEmptyFiltered;

  /// No description provided for @asSummaryNone.
  ///
  /// In en, this message translates to:
  /// **'Nothing waiting for you in this list.'**
  String get asSummaryNone;

  /// No description provided for @asSummaryNeed.
  ///
  /// In en, this message translates to:
  /// **'{count, plural, =1{1 item needs you.} other{{count} items need you.}}'**
  String asSummaryNeed(int count);

  /// No description provided for @asWhat.
  ///
  /// In en, this message translates to:
  /// **'What is this, and where is it?'**
  String get asWhat;

  /// No description provided for @asWhy.
  ///
  /// In en, this message translates to:
  /// **'Kept so we know who holds it, what it is worth and when it needs service. {category}.'**
  String asWhy(String category);

  /// No description provided for @asLifeLine.
  ///
  /// In en, this message translates to:
  /// **'Stage {stage} of 8 · planned life {years} years'**
  String asLifeLine(String stage, String years);

  /// No description provided for @asBook.
  ///
  /// In en, this message translates to:
  /// **'Book value {nbv} · health {health}/100'**
  String asBook(String nbv, String health);

  /// No description provided for @asLotoOn.
  ///
  /// In en, this message translates to:
  /// **'Locked out. Permit {permit}. Do not operate.'**
  String asLotoOn(String permit);

  /// No description provided for @asStageStock.
  ///
  /// In en, this message translates to:
  /// **'In store'**
  String get asStageStock;

  /// No description provided for @asStageWork.
  ///
  /// In en, this message translates to:
  /// **'In use'**
  String get asStageWork;

  /// No description provided for @asStageMove.
  ///
  /// In en, this message translates to:
  /// **'On the move'**
  String get asStageMove;

  /// No description provided for @asStageRepair.
  ///
  /// In en, this message translates to:
  /// **'In repair'**
  String get asStageRepair;

  /// No description provided for @asStageCal.
  ///
  /// In en, this message translates to:
  /// **'Calibration due'**
  String get asStageCal;

  /// No description provided for @asStageLoto.
  ///
  /// In en, this message translates to:
  /// **'Locked out'**
  String get asStageLoto;

  /// No description provided for @asStageRetire.
  ///
  /// In en, this message translates to:
  /// **'Retired'**
  String get asStageRetire;

  /// No description provided for @asStageGone.
  ///
  /// In en, this message translates to:
  /// **'Disposed'**
  String get asStageGone;

  /// No description provided for @asNextCommission.
  ///
  /// In en, this message translates to:
  /// **'Put it into service and, if needed, name who holds it.'**
  String get asNextCommission;

  /// No description provided for @asNextStock.
  ///
  /// In en, this message translates to:
  /// **'Waiting in the store. Plant can put it into service.'**
  String get asNextStock;

  /// No description provided for @asNextReceive.
  ///
  /// In en, this message translates to:
  /// **'It is arriving. Confirm you received it.'**
  String get asNextReceive;

  /// No description provided for @asNextMoving.
  ///
  /// In en, this message translates to:
  /// **'On the way to another site.'**
  String get asNextMoving;

  /// No description provided for @asNextLotoRelease.
  ///
  /// In en, this message translates to:
  /// **'Release the lock-out when the job is safe to restart.'**
  String get asNextLotoRelease;

  /// No description provided for @asNextLotoWait.
  ///
  /// In en, this message translates to:
  /// **'Locked out. Waiting for the safety officer.'**
  String get asNextLotoWait;

  /// No description provided for @asNextFinishJob.
  ///
  /// In en, this message translates to:
  /// **'Finish the open job and write what it cost.'**
  String get asNextFinishJob;

  /// No description provided for @asNextRepair.
  ///
  /// In en, this message translates to:
  /// **'A repair is under way.'**
  String get asNextRepair;

  /// No description provided for @asNextCal.
  ///
  /// In en, this message translates to:
  /// **'Record the calibration certificate.'**
  String get asNextCal;

  /// No description provided for @asNextCalWait.
  ///
  /// In en, this message translates to:
  /// **'Calibration is due.'**
  String get asNextCalWait;

  /// No description provided for @asNextDispose.
  ///
  /// In en, this message translates to:
  /// **'All boxes are ready. Close the books.'**
  String get asNextDispose;

  /// No description provided for @asNextWriteOff.
  ///
  /// In en, this message translates to:
  /// **'Approve the write-off, then finance can close it.'**
  String get asNextWriteOff;

  /// No description provided for @asNextRetireWait.
  ///
  /// In en, this message translates to:
  /// **'Waiting for finance to finish the retirement file.'**
  String get asNextRetireWait;

  /// No description provided for @asNextGone.
  ///
  /// In en, this message translates to:
  /// **'Gone from the books. Nothing left to do.'**
  String get asNextGone;

  /// No description provided for @asNextAck.
  ///
  /// In en, this message translates to:
  /// **'Sign to confirm you received this.'**
  String get asNextAck;

  /// No description provided for @asNextOk.
  ///
  /// In en, this message translates to:
  /// **'{who} holds it. Nothing for you to do.'**
  String asNextOk(String who);

  /// No description provided for @asNextIdle.
  ///
  /// In en, this message translates to:
  /// **'In use. Report a fault if something is wrong.'**
  String get asNextIdle;

  /// No description provided for @asFieldName.
  ///
  /// In en, this message translates to:
  /// **'What is it called?'**
  String get asFieldName;

  /// No description provided for @asFieldCategory.
  ///
  /// In en, this message translates to:
  /// **'Kind'**
  String get asFieldCategory;

  /// No description provided for @asFieldSite.
  ///
  /// In en, this message translates to:
  /// **'Site'**
  String get asFieldSite;

  /// No description provided for @asFieldCost.
  ///
  /// In en, this message translates to:
  /// **'What did it cost? (taka)'**
  String get asFieldCost;

  /// No description provided for @asFieldLife.
  ///
  /// In en, this message translates to:
  /// **'How many years will it last?'**
  String get asFieldLife;

  /// No description provided for @asFieldLocation.
  ///
  /// In en, this message translates to:
  /// **'Where will it sit?'**
  String get asFieldLocation;

  /// No description provided for @asFieldCritical.
  ///
  /// In en, this message translates to:
  /// **'How critical?'**
  String get asFieldCritical;

  /// No description provided for @asFieldCommission.
  ///
  /// In en, this message translates to:
  /// **'Put into service now'**
  String get asFieldCommission;

  /// No description provided for @asFieldHolder.
  ///
  /// In en, this message translates to:
  /// **'Who will hold it?'**
  String get asFieldHolder;

  /// No description provided for @asFieldHolderNone.
  ///
  /// In en, this message translates to:
  /// **'No one yet'**
  String get asFieldHolderNone;

  /// No description provided for @asFieldDefect.
  ///
  /// In en, this message translates to:
  /// **'What is wrong?'**
  String get asFieldDefect;

  /// No description provided for @asFieldPermit.
  ///
  /// In en, this message translates to:
  /// **'Lock-out permit (LOTO-YYYY-NNNN)'**
  String get asFieldPermit;

  /// No description provided for @asFieldReason.
  ///
  /// In en, this message translates to:
  /// **'Why?'**
  String get asFieldReason;

  /// No description provided for @asFieldSurvey.
  ///
  /// In en, this message translates to:
  /// **'Survey notes'**
  String get asFieldSurvey;

  /// No description provided for @asFieldCert.
  ///
  /// In en, this message translates to:
  /// **'Certificate number'**
  String get asFieldCert;

  /// No description provided for @asFieldProceeds.
  ///
  /// In en, this message translates to:
  /// **'Sale proceeds (taka, 0 if scrap)'**
  String get asFieldProceeds;

  /// No description provided for @asFieldToSite.
  ///
  /// In en, this message translates to:
  /// **'Receiving site'**
  String get asFieldToSite;

  /// No description provided for @asSiteHq.
  ///
  /// In en, this message translates to:
  /// **'Head office'**
  String get asSiteHq;

  /// No description provided for @asSitePlant.
  ///
  /// In en, this message translates to:
  /// **'Keraniganj plant'**
  String get asSitePlant;

  /// No description provided for @asSiteCtg.
  ///
  /// In en, this message translates to:
  /// **'Chattogram terminal'**
  String get asSiteCtg;

  /// No description provided for @asCritA.
  ///
  /// In en, this message translates to:
  /// **'Plant-critical'**
  String get asCritA;

  /// No description provided for @asCritB.
  ///
  /// In en, this message translates to:
  /// **'Essential'**
  String get asCritB;

  /// No description provided for @asCritC.
  ///
  /// In en, this message translates to:
  /// **'General'**
  String get asCritC;

  /// No description provided for @asActAck.
  ///
  /// In en, this message translates to:
  /// **'I have it'**
  String get asActAck;

  /// No description provided for @asActCommission.
  ///
  /// In en, this message translates to:
  /// **'Put into service'**
  String get asActCommission;

  /// No description provided for @asActAssign.
  ///
  /// In en, this message translates to:
  /// **'Hand over'**
  String get asActAssign;

  /// No description provided for @asActFlag.
  ///
  /// In en, this message translates to:
  /// **'Something is wrong'**
  String get asActFlag;

  /// No description provided for @asActLotoOn.
  ///
  /// In en, this message translates to:
  /// **'Lock out'**
  String get asActLotoOn;

  /// No description provided for @asActLotoOff.
  ///
  /// In en, this message translates to:
  /// **'Release lock-out'**
  String get asActLotoOff;

  /// No description provided for @asActMove.
  ///
  /// In en, this message translates to:
  /// **'Send to another site'**
  String get asActMove;

  /// No description provided for @asActReceive.
  ///
  /// In en, this message translates to:
  /// **'Received here'**
  String get asActReceive;

  /// No description provided for @asActCertify.
  ///
  /// In en, this message translates to:
  /// **'Record certificate'**
  String get asActCertify;

  /// No description provided for @asActRetire.
  ///
  /// In en, this message translates to:
  /// **'Retire'**
  String get asActRetire;

  /// No description provided for @asActWriteOff.
  ///
  /// In en, this message translates to:
  /// **'Approve write-off'**
  String get asActWriteOff;

  /// No description provided for @asActDispose.
  ///
  /// In en, this message translates to:
  /// **'Close the books'**
  String get asActDispose;

  /// No description provided for @asActStart.
  ///
  /// In en, this message translates to:
  /// **'Start job'**
  String get asActStart;

  /// No description provided for @asActFinish.
  ///
  /// In en, this message translates to:
  /// **'Finish job'**
  String get asActFinish;

  /// No description provided for @asJobs.
  ///
  /// In en, this message translates to:
  /// **'Open jobs'**
  String get asJobs;

  /// No description provided for @asRetireFile.
  ///
  /// In en, this message translates to:
  /// **'Retirement file'**
  String get asRetireFile;

  /// No description provided for @asBoxSurvey.
  ///
  /// In en, this message translates to:
  /// **'Technical survey signed'**
  String get asBoxSurvey;

  /// No description provided for @asBoxClean.
  ///
  /// In en, this message translates to:
  /// **'Cleaned / decontaminated'**
  String get asBoxClean;

  /// No description provided for @asBoxSpares.
  ///
  /// In en, this message translates to:
  /// **'Spares taken off'**
  String get asBoxSpares;

  /// No description provided for @asBoxFinance.
  ///
  /// In en, this message translates to:
  /// **'Finance checked'**
  String get asBoxFinance;

  /// No description provided for @asDetails.
  ///
  /// In en, this message translates to:
  /// **'Details'**
  String get asDetails;

  /// No description provided for @asFieldBookFull.
  ///
  /// In en, this message translates to:
  /// **'Cost and depreciation'**
  String get asFieldBookFull;

  /// No description provided for @asBookFull.
  ///
  /// In en, this message translates to:
  /// **'Gross {gross} · already written down {accum} · book {nbv} · method {method}'**
  String asBookFull(String gross, String accum, String nbv, String method);

  /// No description provided for @asYearCharge.
  ///
  /// In en, this message translates to:
  /// **'This year {amount}'**
  String asYearCharge(String amount);

  /// No description provided for @asPassport.
  ///
  /// In en, this message translates to:
  /// **'Tag, serial and maker'**
  String get asPassport;

  /// No description provided for @asDoneAck.
  ///
  /// In en, this message translates to:
  /// **'Signed.'**
  String get asDoneAck;

  /// No description provided for @asDoneCommission.
  ///
  /// In en, this message translates to:
  /// **'In service.'**
  String get asDoneCommission;

  /// No description provided for @asDoneAssign.
  ///
  /// In en, this message translates to:
  /// **'Handed over. They have three days to sign.'**
  String get asDoneAssign;

  /// No description provided for @asDoneFlag.
  ///
  /// In en, this message translates to:
  /// **'Fault logged. A repair job was opened.'**
  String get asDoneFlag;

  /// No description provided for @asDoneLotoOn.
  ///
  /// In en, this message translates to:
  /// **'Locked out.'**
  String get asDoneLotoOn;

  /// No description provided for @asDoneLotoOff.
  ///
  /// In en, this message translates to:
  /// **'Lock-out released.'**
  String get asDoneLotoOff;

  /// No description provided for @asDoneMove.
  ///
  /// In en, this message translates to:
  /// **'On the way.'**
  String get asDoneMove;

  /// No description provided for @asDoneReceive.
  ///
  /// In en, this message translates to:
  /// **'Received.'**
  String get asDoneReceive;

  /// No description provided for @asDoneCertify.
  ///
  /// In en, this message translates to:
  /// **'Certificate recorded.'**
  String get asDoneCertify;

  /// No description provided for @asDoneRetire.
  ///
  /// In en, this message translates to:
  /// **'Retired. Finance still has boxes to tick.'**
  String get asDoneRetire;

  /// No description provided for @asDoneWriteOff.
  ///
  /// In en, this message translates to:
  /// **'Write-off approved.'**
  String get asDoneWriteOff;

  /// No description provided for @asDoneDispose.
  ///
  /// In en, this message translates to:
  /// **'Closed on the books.'**
  String get asDoneDispose;

  /// No description provided for @asDoneStart.
  ///
  /// In en, this message translates to:
  /// **'Job started.'**
  String get asDoneStart;

  /// No description provided for @asDoneFinish.
  ///
  /// In en, this message translates to:
  /// **'Job finished.'**
  String get asDoneFinish;

  /// No description provided for @asDoneTick.
  ///
  /// In en, this message translates to:
  /// **'Box ticked.'**
  String get asDoneTick;

  /// No description provided for @asErrName.
  ///
  /// In en, this message translates to:
  /// **'Give it a short name.'**
  String get asErrName;

  /// No description provided for @asErrCost.
  ///
  /// In en, this message translates to:
  /// **'Enter the purchase cost.'**
  String get asErrCost;

  /// No description provided for @asErrLife.
  ///
  /// In en, this message translates to:
  /// **'Enter the life in years.'**
  String get asErrLife;

  /// No description provided for @asErrFailed.
  ///
  /// In en, this message translates to:
  /// **'Something went wrong. Please try again.'**
  String get asErrFailed;

  /// No description provided for @asErrLoto.
  ///
  /// In en, this message translates to:
  /// **'This machine is locked out.'**
  String get asErrLoto;

  /// No description provided for @asErrLotoNeed.
  ///
  /// In en, this message translates to:
  /// **'Lock this machine out before work starts.'**
  String get asErrLotoNeed;

  /// No description provided for @asErrAck.
  ///
  /// In en, this message translates to:
  /// **'The current holder must sign first.'**
  String get asErrAck;

  /// No description provided for @asErrList.
  ///
  /// In en, this message translates to:
  /// **'Every retirement box must be ticked.'**
  String get asErrList;

  /// No description provided for @asErrWrite.
  ///
  /// In en, this message translates to:
  /// **'Write-off is not approved yet.'**
  String get asErrWrite;

  /// No description provided for @asErrCal.
  ///
  /// In en, this message translates to:
  /// **'Calibrate this first.'**
  String get asErrCal;

  /// No description provided for @moduleCompliance.
  ///
  /// In en, this message translates to:
  /// **'Licences'**
  String get moduleCompliance;

  /// No description provided for @cpIntro.
  ///
  /// In en, this message translates to:
  /// **'Permits the plant needs to stay open. Those that run out first sit at the top.'**
  String get cpIntro;

  /// No description provided for @cpSearchHint.
  ///
  /// In en, this message translates to:
  /// **'Search by name or number'**
  String get cpSearchHint;

  /// No description provided for @cpFilter.
  ///
  /// In en, this message translates to:
  /// **'Filters'**
  String get cpFilter;

  /// No description provided for @cpFilterAgencies.
  ///
  /// In en, this message translates to:
  /// **'Agency'**
  String get cpFilterAgencies;

  /// No description provided for @cpFilterStages.
  ///
  /// In en, this message translates to:
  /// **'Renewal stage'**
  String get cpFilterStages;

  /// No description provided for @cpFilterAllStages.
  ///
  /// In en, this message translates to:
  /// **'All stages'**
  String get cpFilterAllStages;

  /// No description provided for @cpChannelEmail.
  ///
  /// In en, this message translates to:
  /// **'Email'**
  String get cpChannelEmail;

  /// No description provided for @cpChannelCourier.
  ///
  /// In en, this message translates to:
  /// **'Courier'**
  String get cpChannelCourier;

  /// No description provided for @cpChannelHand.
  ///
  /// In en, this message translates to:
  /// **'By hand'**
  String get cpChannelHand;

  /// No description provided for @cpTrackParcel.
  ///
  /// In en, this message translates to:
  /// **'Track parcel'**
  String get cpTrackParcel;

  /// No description provided for @cpReadyPct.
  ///
  /// In en, this message translates to:
  /// **'{pct}% ready'**
  String cpReadyPct(String pct);

  /// No description provided for @cpErrInspector.
  ///
  /// In en, this message translates to:
  /// **'Name the inspector.'**
  String get cpErrInspector;

  /// No description provided for @cpErrSentence.
  ///
  /// In en, this message translates to:
  /// **'Write at least one short sentence.'**
  String get cpErrSentence;

  /// No description provided for @cpWhyMatters.
  ///
  /// In en, this message translates to:
  /// **'Why this matters'**
  String get cpWhyMatters;

  /// No description provided for @cpExposureDay.
  ///
  /// In en, this message translates to:
  /// **'{amount} a day'**
  String cpExposureDay(String amount);

  /// No description provided for @cpNew.
  ///
  /// In en, this message translates to:
  /// **'Add a licence'**
  String get cpNew;

  /// No description provided for @cpNewIntro.
  ///
  /// In en, this message translates to:
  /// **'Register a permit the company already holds.'**
  String get cpNewIntro;

  /// No description provided for @cpTabMine.
  ///
  /// In en, this message translates to:
  /// **'Mine'**
  String get cpTabMine;

  /// No description provided for @cpTabCritical.
  ///
  /// In en, this message translates to:
  /// **'This month'**
  String get cpTabCritical;

  /// No description provided for @cpTabWarning.
  ///
  /// In en, this message translates to:
  /// **'This quarter'**
  String get cpTabWarning;

  /// No description provided for @cpTabRenew.
  ///
  /// In en, this message translates to:
  /// **'Renewing'**
  String get cpTabRenew;

  /// No description provided for @cpTabExpired.
  ///
  /// In en, this message translates to:
  /// **'Lapsed'**
  String get cpTabExpired;

  /// No description provided for @cpTabAll.
  ///
  /// In en, this message translates to:
  /// **'All'**
  String get cpTabAll;

  /// No description provided for @cpEmpty.
  ///
  /// In en, this message translates to:
  /// **'Nothing in this list.'**
  String get cpEmpty;

  /// No description provided for @cpEmptyFiltered.
  ///
  /// In en, this message translates to:
  /// **'Nothing matches that search.'**
  String get cpEmptyFiltered;

  /// No description provided for @cpSummaryNone.
  ///
  /// In en, this message translates to:
  /// **'Nothing waiting for you in this list.'**
  String get cpSummaryNone;

  /// No description provided for @cpSummaryNeed.
  ///
  /// In en, this message translates to:
  /// **'{count, plural, =1{1 licence needs you.} other{{count} licences need you.}}'**
  String cpSummaryNeed(int count);

  /// No description provided for @cpDays.
  ///
  /// In en, this message translates to:
  /// **'{days, plural, =1{1 day left} other{{days} days left}}'**
  String cpDays(int days);

  /// No description provided for @cpWhat.
  ///
  /// In en, this message translates to:
  /// **'What permit is this?'**
  String get cpWhat;

  /// No description provided for @cpWho.
  ///
  /// In en, this message translates to:
  /// **'{who} looks after it. {days}.'**
  String cpWho(String who, String days);

  /// No description provided for @cpWhy.
  ///
  /// In en, this message translates to:
  /// **'Without it the plant cannot legally run that activity.'**
  String get cpWhy;

  /// No description provided for @cpExpires.
  ///
  /// In en, this message translates to:
  /// **'Runs out on {date}.'**
  String cpExpires(String date);

  /// No description provided for @cpRenewLine.
  ///
  /// In en, this message translates to:
  /// **'Renewal: {stage} · checklist {pct}%'**
  String cpRenewLine(String stage, String pct);

  /// No description provided for @cpUrgExpired.
  ///
  /// In en, this message translates to:
  /// **'Lapsed'**
  String get cpUrgExpired;

  /// No description provided for @cpUrgCritical.
  ///
  /// In en, this message translates to:
  /// **'This month'**
  String get cpUrgCritical;

  /// No description provided for @cpUrgWarning.
  ///
  /// In en, this message translates to:
  /// **'This quarter'**
  String get cpUrgWarning;

  /// No description provided for @cpUrgOk.
  ///
  /// In en, this message translates to:
  /// **'In date'**
  String get cpUrgOk;

  /// No description provided for @cpStageReview.
  ///
  /// In en, this message translates to:
  /// **'Getting the file ready'**
  String get cpStageReview;

  /// No description provided for @cpStageFiled.
  ///
  /// In en, this message translates to:
  /// **'Filed with the office'**
  String get cpStageFiled;

  /// No description provided for @cpStageInspect.
  ///
  /// In en, this message translates to:
  /// **'Inspection booked'**
  String get cpStageInspect;

  /// No description provided for @cpStageVet.
  ///
  /// In en, this message translates to:
  /// **'Waiting on the ministry'**
  String get cpStageVet;

  /// No description provided for @cpStageDone.
  ///
  /// In en, this message translates to:
  /// **'Renewed'**
  String get cpStageDone;

  /// No description provided for @cpNextStartExpired.
  ///
  /// In en, this message translates to:
  /// **'This has lapsed. Open a renewal file.'**
  String get cpNextStartExpired;

  /// No description provided for @cpNextExpired.
  ///
  /// In en, this message translates to:
  /// **'This has lapsed. Plant will open a renewal.'**
  String get cpNextExpired;

  /// No description provided for @cpNextStartSoon.
  ///
  /// In en, this message translates to:
  /// **'It runs out soon. Open a renewal file.'**
  String get cpNextStartSoon;

  /// No description provided for @cpNextOk.
  ///
  /// In en, this message translates to:
  /// **'In date until {date}. Nothing for you to do.'**
  String cpNextOk(String date);

  /// No description provided for @cpNextFund.
  ///
  /// In en, this message translates to:
  /// **'Finance must approve the {fee} fee before you can file.'**
  String cpNextFund(String fee);

  /// No description provided for @cpNextTicks.
  ///
  /// In en, this message translates to:
  /// **'Tick every box on the checklist, then file it.'**
  String get cpNextTicks;

  /// No description provided for @cpNextFile.
  ///
  /// In en, this message translates to:
  /// **'File the application with the regulator.'**
  String get cpNextFile;

  /// No description provided for @cpNextWaitFile.
  ///
  /// In en, this message translates to:
  /// **'Waiting for the plant to file the application.'**
  String get cpNextWaitFile;

  /// No description provided for @cpNextBook.
  ///
  /// In en, this message translates to:
  /// **'Book the inspection and name the inspector.'**
  String get cpNextBook;

  /// No description provided for @cpNextWaitInspect.
  ///
  /// In en, this message translates to:
  /// **'Waiting for an inspection date.'**
  String get cpNextWaitInspect;

  /// No description provided for @cpNextFindings.
  ///
  /// In en, this message translates to:
  /// **'Write what the inspector found.'**
  String get cpNextFindings;

  /// No description provided for @cpNextWaitFindings.
  ///
  /// In en, this message translates to:
  /// **'Inspection is booked.'**
  String get cpNextWaitFindings;

  /// No description provided for @cpNextCert.
  ///
  /// In en, this message translates to:
  /// **'Enter the new certificate and the new expiry date.'**
  String get cpNextCert;

  /// No description provided for @cpNextWaitCert.
  ///
  /// In en, this message translates to:
  /// **'Waiting for the new certificate.'**
  String get cpNextWaitCert;

  /// No description provided for @cpNextRenewed.
  ///
  /// In en, this message translates to:
  /// **'Renewed. Nothing left to do.'**
  String get cpNextRenewed;

  /// No description provided for @cpFieldTitle.
  ///
  /// In en, this message translates to:
  /// **'What is it called?'**
  String get cpFieldTitle;

  /// No description provided for @cpFieldNo.
  ///
  /// In en, this message translates to:
  /// **'Licence number on the paper'**
  String get cpFieldNo;

  /// No description provided for @cpFieldKind.
  ///
  /// In en, this message translates to:
  /// **'Kind'**
  String get cpFieldKind;

  /// No description provided for @cpFieldSite.
  ///
  /// In en, this message translates to:
  /// **'Site'**
  String get cpFieldSite;

  /// No description provided for @cpFieldExpiry.
  ///
  /// In en, this message translates to:
  /// **'When does it run out?'**
  String get cpFieldExpiry;

  /// No description provided for @cpFieldFee.
  ///
  /// In en, this message translates to:
  /// **'Renewal fee (taka)'**
  String get cpFieldFee;

  /// No description provided for @cpFieldOwner.
  ///
  /// In en, this message translates to:
  /// **'Who looks after it?'**
  String get cpFieldOwner;

  /// No description provided for @cpFieldOwnerMe.
  ///
  /// In en, this message translates to:
  /// **'You'**
  String get cpFieldOwnerMe;

  /// No description provided for @cpFieldInspector.
  ///
  /// In en, this message translates to:
  /// **'Inspector name'**
  String get cpFieldInspector;

  /// No description provided for @cpFieldFindings.
  ///
  /// In en, this message translates to:
  /// **'What did they find?'**
  String get cpFieldFindings;

  /// No description provided for @cpFieldCert.
  ///
  /// In en, this message translates to:
  /// **'New certificate number'**
  String get cpFieldCert;

  /// No description provided for @cpFieldNewExpiry.
  ///
  /// In en, this message translates to:
  /// **'New expiry (YYYY-MM-DD)'**
  String get cpFieldNewExpiry;

  /// No description provided for @cpFieldChalan.
  ///
  /// In en, this message translates to:
  /// **'Challan number'**
  String get cpFieldChalan;

  /// No description provided for @cpFieldReason.
  ///
  /// In en, this message translates to:
  /// **'Why send it back?'**
  String get cpFieldReason;

  /// No description provided for @cpFieldSubject.
  ///
  /// In en, this message translates to:
  /// **'Letter subject'**
  String get cpFieldSubject;

  /// No description provided for @cpFieldLetter.
  ///
  /// In en, this message translates to:
  /// **'Letter body'**
  String get cpFieldLetter;

  /// No description provided for @cpSiteHq.
  ///
  /// In en, this message translates to:
  /// **'Head office'**
  String get cpSiteHq;

  /// No description provided for @cpSitePlant.
  ///
  /// In en, this message translates to:
  /// **'Keraniganj plant'**
  String get cpSitePlant;

  /// No description provided for @cpActRenew.
  ///
  /// In en, this message translates to:
  /// **'Open a renewal'**
  String get cpActRenew;

  /// No description provided for @cpActFund.
  ///
  /// In en, this message translates to:
  /// **'Approve the fee'**
  String get cpActFund;

  /// No description provided for @cpActFile.
  ///
  /// In en, this message translates to:
  /// **'File the application'**
  String get cpActFile;

  /// No description provided for @cpActInspect.
  ///
  /// In en, this message translates to:
  /// **'Book inspection'**
  String get cpActInspect;

  /// No description provided for @cpActFindings.
  ///
  /// In en, this message translates to:
  /// **'Record findings'**
  String get cpActFindings;

  /// No description provided for @cpActComplete.
  ///
  /// In en, this message translates to:
  /// **'Record the new certificate'**
  String get cpActComplete;

  /// No description provided for @cpActAdvance.
  ///
  /// In en, this message translates to:
  /// **'Move forward'**
  String get cpActAdvance;

  /// No description provided for @cpActBack.
  ///
  /// In en, this message translates to:
  /// **'Send back one step'**
  String get cpActBack;

  /// No description provided for @cpActLetter.
  ///
  /// In en, this message translates to:
  /// **'Send a chairman letter'**
  String get cpActLetter;

  /// No description provided for @cpChecklist.
  ///
  /// In en, this message translates to:
  /// **'Before we file'**
  String get cpChecklist;

  /// No description provided for @cpDetails.
  ///
  /// In en, this message translates to:
  /// **'Details'**
  String get cpDetails;

  /// No description provided for @cpPassport.
  ///
  /// In en, this message translates to:
  /// **'Numbers'**
  String get cpPassport;

  /// No description provided for @cpDoneRenew.
  ///
  /// In en, this message translates to:
  /// **'Renewal file opened.'**
  String get cpDoneRenew;

  /// No description provided for @cpDoneFund.
  ///
  /// In en, this message translates to:
  /// **'Fee approved. The plant can file now.'**
  String get cpDoneFund;

  /// No description provided for @cpDoneAdvance.
  ///
  /// In en, this message translates to:
  /// **'Moved forward.'**
  String get cpDoneAdvance;

  /// No description provided for @cpDoneBack.
  ///
  /// In en, this message translates to:
  /// **'Sent back one step.'**
  String get cpDoneBack;

  /// No description provided for @cpDoneLetter.
  ///
  /// In en, this message translates to:
  /// **'Letter sent.'**
  String get cpDoneLetter;

  /// No description provided for @cpDoneTick.
  ///
  /// In en, this message translates to:
  /// **'Box ticked.'**
  String get cpDoneTick;

  /// No description provided for @cpErrTitle.
  ///
  /// In en, this message translates to:
  /// **'Give it a short name.'**
  String get cpErrTitle;

  /// No description provided for @cpErrNo.
  ///
  /// In en, this message translates to:
  /// **'Enter the number on the paper.'**
  String get cpErrNo;

  /// No description provided for @cpErrFailed.
  ///
  /// In en, this message translates to:
  /// **'Something went wrong. Please try again.'**
  String get cpErrFailed;

  /// No description provided for @cpErrFund.
  ///
  /// In en, this message translates to:
  /// **'Finance must approve the fee first.'**
  String get cpErrFund;

  /// No description provided for @cpErrTicks.
  ///
  /// In en, this message translates to:
  /// **'Every box must be marked first.'**
  String get cpErrTicks;

  /// No description provided for @cpErrFail.
  ///
  /// In en, this message translates to:
  /// **'A failed box is still open.'**
  String get cpErrFail;

  /// No description provided for @cpErrLetter.
  ///
  /// In en, this message translates to:
  /// **'A chairman letter is only for licences inside 30 days or already with the ministry.'**
  String get cpErrLetter;

  /// No description provided for @cpErrOpen.
  ///
  /// In en, this message translates to:
  /// **'A renewal is already open.'**
  String get cpErrOpen;

  /// No description provided for @cpErrValidity.
  ///
  /// In en, this message translates to:
  /// **'The new expiry must match the usual life of this permit.'**
  String get cpErrValidity;

  /// No description provided for @moduleEmployees.
  ///
  /// In en, this message translates to:
  /// **'People'**
  String get moduleEmployees;

  /// No description provided for @emIntro.
  ///
  /// In en, this message translates to:
  /// **'Who works here, who they report to, and who is leaving.'**
  String get emIntro;

  /// No description provided for @emSearchHint.
  ///
  /// In en, this message translates to:
  /// **'Search by name, title or phone'**
  String get emSearchHint;

  /// No description provided for @emNew.
  ///
  /// In en, this message translates to:
  /// **'Add a colleague'**
  String get emNew;

  /// No description provided for @emNewIntro.
  ///
  /// In en, this message translates to:
  /// **'HR records someone who has already joined.'**
  String get emNewIntro;

  /// No description provided for @emTabAll.
  ///
  /// In en, this message translates to:
  /// **'At work'**
  String get emTabAll;

  /// No description provided for @emTabTeam.
  ///
  /// In en, this message translates to:
  /// **'My team'**
  String get emTabTeam;

  /// No description provided for @emTabLeaving.
  ///
  /// In en, this message translates to:
  /// **'Leaving'**
  String get emTabLeaving;

  /// No description provided for @emTabFormer.
  ///
  /// In en, this message translates to:
  /// **'Former'**
  String get emTabFormer;

  /// No description provided for @emEmpty.
  ///
  /// In en, this message translates to:
  /// **'Nobody in this list.'**
  String get emEmpty;

  /// No description provided for @emEmptyFiltered.
  ///
  /// In en, this message translates to:
  /// **'Nobody matches that search.'**
  String get emEmptyFiltered;

  /// No description provided for @emSummaryNone.
  ///
  /// In en, this message translates to:
  /// **'Nothing waiting for you in this list.'**
  String get emSummaryNone;

  /// No description provided for @emSummaryNeed.
  ///
  /// In en, this message translates to:
  /// **'{count, plural, =1{1 person needs you.} other{{count} people need you.}}'**
  String emSummaryNeed(int count);

  /// No description provided for @emStatusActive.
  ///
  /// In en, this message translates to:
  /// **'At work'**
  String get emStatusActive;

  /// No description provided for @emStatusLeave.
  ///
  /// In en, this message translates to:
  /// **'On leave'**
  String get emStatusLeave;

  /// No description provided for @emStatusLeaving.
  ///
  /// In en, this message translates to:
  /// **'Leaving'**
  String get emStatusLeaving;

  /// No description provided for @emStatusFormer.
  ///
  /// In en, this message translates to:
  /// **'Left'**
  String get emStatusFormer;

  /// No description provided for @emWhat.
  ///
  /// In en, this message translates to:
  /// **'Who is this?'**
  String get emWhat;

  /// No description provided for @emWho.
  ///
  /// In en, this message translates to:
  /// **'Reports to {who}.'**
  String emWho(String who);

  /// No description provided for @emWhoNone.
  ///
  /// In en, this message translates to:
  /// **'No line manager on file.'**
  String get emWhoNone;

  /// No description provided for @emWhy.
  ///
  /// In en, this message translates to:
  /// **'The directory is so colleagues can find each other. Sensitive details stay with HR.'**
  String get emWhy;

  /// No description provided for @emExitTitle.
  ///
  /// In en, this message translates to:
  /// **'Leaving — desks that must sign off'**
  String get emExitTitle;

  /// No description provided for @emLastDay.
  ///
  /// In en, this message translates to:
  /// **'Last day {date}.'**
  String emLastDay(String date);

  /// No description provided for @emActExit.
  ///
  /// In en, this message translates to:
  /// **'Start leaving'**
  String get emActExit;

  /// No description provided for @emActClear.
  ///
  /// In en, this message translates to:
  /// **'Clear this desk'**
  String get emActClear;

  /// No description provided for @emActWaive.
  ///
  /// In en, this message translates to:
  /// **'Skip this desk'**
  String get emActWaive;

  /// No description provided for @emActReclaim.
  ///
  /// In en, this message translates to:
  /// **'Take equipment back'**
  String get emActReclaim;

  /// No description provided for @emActClose.
  ///
  /// In en, this message translates to:
  /// **'Close the file'**
  String get emActClose;

  /// No description provided for @emActCancel.
  ///
  /// In en, this message translates to:
  /// **'Keep them'**
  String get emActCancel;

  /// No description provided for @emActRehire.
  ///
  /// In en, this message translates to:
  /// **'Bring them back'**
  String get emActRehire;

  /// No description provided for @emFieldName.
  ///
  /// In en, this message translates to:
  /// **'Full name'**
  String get emFieldName;

  /// No description provided for @emFieldNameBn.
  ///
  /// In en, this message translates to:
  /// **'Name in Bangla'**
  String get emFieldNameBn;

  /// No description provided for @emFieldTitle.
  ///
  /// In en, this message translates to:
  /// **'Job title'**
  String get emFieldTitle;

  /// No description provided for @emFieldPhone.
  ///
  /// In en, this message translates to:
  /// **'Phone'**
  String get emFieldPhone;

  /// No description provided for @emFieldEmail.
  ///
  /// In en, this message translates to:
  /// **'Work email'**
  String get emFieldEmail;

  /// No description provided for @emFieldDept.
  ///
  /// In en, this message translates to:
  /// **'Department'**
  String get emFieldDept;

  /// No description provided for @emFieldSite.
  ///
  /// In en, this message translates to:
  /// **'Workplace'**
  String get emFieldSite;

  /// No description provided for @emFieldManager.
  ///
  /// In en, this message translates to:
  /// **'Line manager'**
  String get emFieldManager;

  /// No description provided for @emFieldManagerHint.
  ///
  /// In en, this message translates to:
  /// **'Optional'**
  String get emFieldManagerHint;

  /// No description provided for @emFieldLastDay.
  ///
  /// In en, this message translates to:
  /// **'Last working day (YYYY-MM-DD)'**
  String get emFieldLastDay;

  /// No description provided for @emFieldExitReason.
  ///
  /// In en, this message translates to:
  /// **'Why they are leaving'**
  String get emFieldExitReason;

  /// No description provided for @emFieldNote.
  ///
  /// In en, this message translates to:
  /// **'What you checked'**
  String get emFieldNote;

  /// No description provided for @emFieldWaive.
  ///
  /// In en, this message translates to:
  /// **'Why this desk can be skipped'**
  String get emFieldWaive;

  /// No description provided for @emFieldVoucher.
  ///
  /// In en, this message translates to:
  /// **'Final-pay voucher number'**
  String get emFieldVoucher;

  /// No description provided for @emFieldCancel.
  ///
  /// In en, this message translates to:
  /// **'Why you are keeping them'**
  String get emFieldCancel;

  /// No description provided for @emFieldJoined.
  ///
  /// In en, this message translates to:
  /// **'Joined'**
  String get emFieldJoined;

  /// No description provided for @emFieldGrade.
  ///
  /// In en, this message translates to:
  /// **'Grade'**
  String get emFieldGrade;

  /// No description provided for @emFieldNid.
  ///
  /// In en, this message translates to:
  /// **'National ID (10, 13 or 17 digits)'**
  String get emFieldNid;

  /// No description provided for @emFieldEmergency.
  ///
  /// In en, this message translates to:
  /// **'Emergency contact'**
  String get emFieldEmergency;

  /// No description provided for @emFieldReports.
  ///
  /// In en, this message translates to:
  /// **'People who report to them'**
  String get emFieldReports;

  /// No description provided for @emPassport.
  ///
  /// In en, this message translates to:
  /// **'Staff number'**
  String get emPassport;

  /// No description provided for @emDetails.
  ///
  /// In en, this message translates to:
  /// **'Details'**
  String get emDetails;

  /// No description provided for @emItemPending.
  ///
  /// In en, this message translates to:
  /// **'Waiting'**
  String get emItemPending;

  /// No description provided for @emItemCleared.
  ///
  /// In en, this message translates to:
  /// **'Done'**
  String get emItemCleared;

  /// No description provided for @emItemWaived.
  ///
  /// In en, this message translates to:
  /// **'Skipped'**
  String get emItemWaived;

  /// No description provided for @emDoneExit.
  ///
  /// In en, this message translates to:
  /// **'Exit file opened. Each desk will get a note.'**
  String get emDoneExit;

  /// No description provided for @emDoneClear.
  ///
  /// In en, this message translates to:
  /// **'Desk signed off.'**
  String get emDoneClear;

  /// No description provided for @emDoneWaive.
  ///
  /// In en, this message translates to:
  /// **'Desk skipped.'**
  String get emDoneWaive;

  /// No description provided for @emDoneReclaim.
  ///
  /// In en, this message translates to:
  /// **'Equipment taken back.'**
  String get emDoneReclaim;

  /// No description provided for @emDoneClose.
  ///
  /// In en, this message translates to:
  /// **'They have left. Login is closed.'**
  String get emDoneClose;

  /// No description provided for @emDoneCancel.
  ///
  /// In en, this message translates to:
  /// **'They stay. Exit file cancelled.'**
  String get emDoneCancel;

  /// No description provided for @emDoneRehire.
  ///
  /// In en, this message translates to:
  /// **'They are back on the books.'**
  String get emDoneRehire;

  /// No description provided for @emErrName.
  ///
  /// In en, this message translates to:
  /// **'Give their name.'**
  String get emErrName;

  /// No description provided for @emErrTitle.
  ///
  /// In en, this message translates to:
  /// **'Give their job title.'**
  String get emErrTitle;

  /// No description provided for @emErrPhone.
  ///
  /// In en, this message translates to:
  /// **'Give a phone number.'**
  String get emErrPhone;

  /// No description provided for @emErrFailed.
  ///
  /// In en, this message translates to:
  /// **'Something went wrong. Try again.'**
  String get emErrFailed;

  /// No description provided for @emErrProtected.
  ///
  /// In en, this message translates to:
  /// **'The Chairman cannot be taken off the books this way.'**
  String get emErrProtected;

  /// No description provided for @emErrSelf.
  ///
  /// In en, this message translates to:
  /// **'Another HR colleague must start your own exit.'**
  String get emErrSelf;

  /// No description provided for @emErrAssets.
  ///
  /// In en, this message translates to:
  /// **'Take the equipment back first, then tick this desk.'**
  String get emErrAssets;

  /// No description provided for @emErrBus.
  ///
  /// In en, this message translates to:
  /// **'End the staff-bus seat first.'**
  String get emErrBus;

  /// No description provided for @emErrTrips.
  ///
  /// In en, this message translates to:
  /// **'Finish their open car trips first.'**
  String get emErrTrips;

  /// No description provided for @emErrFinance.
  ///
  /// In en, this message translates to:
  /// **'Settle claims and advances first.'**
  String get emErrFinance;

  /// No description provided for @emErrPending.
  ///
  /// In en, this message translates to:
  /// **'Every desk must be cleared or skipped first.'**
  String get emErrPending;

  /// No description provided for @emErrOpen.
  ///
  /// In en, this message translates to:
  /// **'An exit file is already open.'**
  String get emErrOpen;

  /// No description provided for @moduleDashboards.
  ///
  /// In en, this message translates to:
  /// **'Today'**
  String get moduleDashboards;

  /// No description provided for @dbWhat.
  ///
  /// In en, this message translates to:
  /// **'What needs you, and the few numbers that change a decision.'**
  String get dbWhat;

  /// No description provided for @dbWhy.
  ///
  /// In en, this message translates to:
  /// **'These figures are counted from the live files, not typed in.'**
  String get dbWhy;

  /// No description provided for @dbNeedsTitle.
  ///
  /// In en, this message translates to:
  /// **'Needs you today'**
  String get dbNeedsTitle;

  /// No description provided for @dbActBrief.
  ///
  /// In en, this message translates to:
  /// **'Send a short briefing'**
  String get dbActBrief;

  /// No description provided for @dbFieldTitle.
  ///
  /// In en, this message translates to:
  /// **'Title'**
  String get dbFieldTitle;

  /// No description provided for @dbFieldBody.
  ///
  /// In en, this message translates to:
  /// **'What should they hear (20+ characters)'**
  String get dbFieldBody;

  /// No description provided for @dbDoneBrief.
  ///
  /// In en, this message translates to:
  /// **'Briefing sent.'**
  String get dbDoneBrief;

  /// No description provided for @dbRoiLine.
  ///
  /// In en, this message translates to:
  /// **'Declared: fleet ৳{fleet}, vendors ৳{vendor}. Not a live calculation.'**
  String dbRoiLine(String fleet, String vendor);

  /// No description provided for @moduleChat.
  ///
  /// In en, this message translates to:
  /// **'Leadership chat'**
  String get moduleChat;

  /// No description provided for @chIntro.
  ///
  /// In en, this message translates to:
  /// **'Leadership rooms. Messages are stored on this device. Not end-to-end encrypted.'**
  String get chIntro;

  /// No description provided for @chEmptyTitle.
  ///
  /// In en, this message translates to:
  /// **'No rooms yet'**
  String get chEmptyTitle;

  /// No description provided for @chEmpty.
  ///
  /// In en, this message translates to:
  /// **'Message a colleague to start one.'**
  String get chEmpty;

  /// No description provided for @chNoMessages.
  ///
  /// In en, this message translates to:
  /// **'No messages yet.'**
  String get chNoMessages;

  /// No description provided for @chLocked.
  ///
  /// In en, this message translates to:
  /// **'Invite only'**
  String get chLocked;

  /// No description provided for @chDirect.
  ///
  /// In en, this message translates to:
  /// **'Message one person'**
  String get chDirect;

  /// No description provided for @chNewRoom.
  ///
  /// In en, this message translates to:
  /// **'New room'**
  String get chNewRoom;

  /// No description provided for @chNewRoomTitle.
  ///
  /// In en, this message translates to:
  /// **'New leadership room'**
  String get chNewRoomTitle;

  /// No description provided for @chNewRoomHint.
  ///
  /// In en, this message translates to:
  /// **'Name the room and pick who should be in it. You are added as admin.'**
  String get chNewRoomHint;

  /// No description provided for @chRoomName.
  ///
  /// In en, this message translates to:
  /// **'Room name'**
  String get chRoomName;

  /// No description provided for @chRoomNameHint.
  ///
  /// In en, this message translates to:
  /// **'e.g. Weekly tank review'**
  String get chRoomNameHint;

  /// No description provided for @chRoomPurpose.
  ///
  /// In en, this message translates to:
  /// **'Purpose'**
  String get chRoomPurpose;

  /// No description provided for @chRoomPurposeHint.
  ///
  /// In en, this message translates to:
  /// **'Daily decisions among these leaders'**
  String get chRoomPurposeHint;

  /// No description provided for @chRoomLeaders.
  ///
  /// In en, this message translates to:
  /// **'Leaders in this room'**
  String get chRoomLeaders;

  /// No description provided for @chRoomOpen.
  ///
  /// In en, this message translates to:
  /// **'Open room'**
  String get chRoomOpen;

  /// No description provided for @chRoomNameErr.
  ///
  /// In en, this message translates to:
  /// **'Use 2–60 characters.'**
  String get chRoomNameErr;

  /// No description provided for @chRoomMembersErr.
  ///
  /// In en, this message translates to:
  /// **'Pick at least one other leader.'**
  String get chRoomMembersErr;

  /// No description provided for @chRoomOpened.
  ///
  /// In en, this message translates to:
  /// **'Room opened.'**
  String get chRoomOpened;

  /// No description provided for @chPeopleSearch.
  ///
  /// In en, this message translates to:
  /// **'Search by name'**
  String get chPeopleSearch;

  /// No description provided for @chNoPeopleTitle.
  ///
  /// In en, this message translates to:
  /// **'No people match'**
  String get chNoPeopleTitle;

  /// No description provided for @chNoPeople.
  ///
  /// In en, this message translates to:
  /// **'Try another name.'**
  String get chNoPeople;

  /// No description provided for @chRemoveRoom.
  ///
  /// In en, this message translates to:
  /// **'Remove this room'**
  String get chRemoveRoom;

  /// No description provided for @chRemoveRoomConfirm.
  ///
  /// In en, this message translates to:
  /// **'Remove this room?'**
  String get chRemoveRoomConfirm;

  /// No description provided for @chRemoveRoomBody.
  ///
  /// In en, this message translates to:
  /// **'Leaders will no longer see it. Messages stay in the record.'**
  String get chRemoveRoomBody;

  /// No description provided for @chKeepRoom.
  ///
  /// In en, this message translates to:
  /// **'Keep room'**
  String get chKeepRoom;

  /// No description provided for @chRoomRemoved.
  ///
  /// In en, this message translates to:
  /// **'Room removed.'**
  String get chRoomRemoved;

  /// No description provided for @chRoomLockedStay.
  ///
  /// In en, this message translates to:
  /// **'This is a standing company room. It cannot be removed.'**
  String get chRoomLockedStay;

  /// No description provided for @chHint.
  ///
  /// In en, this message translates to:
  /// **'Write a message'**
  String get chHint;

  /// No description provided for @chSend.
  ///
  /// In en, this message translates to:
  /// **'Send'**
  String get chSend;

  /// No description provided for @chReact.
  ///
  /// In en, this message translates to:
  /// **'React'**
  String get chReact;

  /// No description provided for @chDeleted.
  ///
  /// In en, this message translates to:
  /// **'Message removed.'**
  String get chDeleted;

  /// No description provided for @chSecureNote.
  ///
  /// In en, this message translates to:
  /// **'Encrypted in transit and at rest. Not end-to-end.'**
  String get chSecureNote;

  /// No description provided for @chActDirective.
  ///
  /// In en, this message translates to:
  /// **'Issue a directive'**
  String get chActDirective;

  /// No description provided for @chActAck.
  ///
  /// In en, this message translates to:
  /// **'I have it'**
  String get chActAck;

  /// No description provided for @chActDone.
  ///
  /// In en, this message translates to:
  /// **'Mark done'**
  String get chActDone;

  /// No description provided for @chFieldTitle.
  ///
  /// In en, this message translates to:
  /// **'Directive title'**
  String get chFieldTitle;

  /// No description provided for @chFieldBody.
  ///
  /// In en, this message translates to:
  /// **'What must happen'**
  String get chFieldBody;

  /// No description provided for @chAckCount.
  ///
  /// In en, this message translates to:
  /// **'{acks} of {needed} have acknowledged.'**
  String chAckCount(int acks, int needed);

  /// No description provided for @demoPlayEvent.
  ///
  /// In en, this message translates to:
  /// **'Play next live event'**
  String get demoPlayEvent;

  /// No description provided for @demoPlayEventHint.
  ///
  /// In en, this message translates to:
  /// **'Drops a leadership message and an inbox ping.'**
  String get demoPlayEventHint;

  /// No description provided for @demoPlayEventDone.
  ///
  /// In en, this message translates to:
  /// **'Event played.'**
  String get demoPlayEventDone;

  /// No description provided for @homeWhat.
  ///
  /// In en, this message translates to:
  /// **'What needs you now.'**
  String get homeWhat;

  /// No description provided for @searchTitle.
  ///
  /// In en, this message translates to:
  /// **'Find a person or a file'**
  String get searchTitle;

  /// No description provided for @searchHint.
  ///
  /// In en, this message translates to:
  /// **'Type a name, employee ID or a reference such as LV-, INC- or PASS-.'**
  String get searchHint;

  /// No description provided for @searchField.
  ///
  /// In en, this message translates to:
  /// **'Search'**
  String get searchField;

  /// No description provided for @searchEmpty.
  ///
  /// In en, this message translates to:
  /// **'Nothing matches that.'**
  String get searchEmpty;

  /// No description provided for @lockMessagePassword.
  ///
  /// In en, this message translates to:
  /// **'Unlock with your account password. Five wrong tries sign you out.'**
  String get lockMessagePassword;

  /// No description provided for @lockPassword.
  ///
  /// In en, this message translates to:
  /// **'Password'**
  String get lockPassword;

  /// No description provided for @lockUnlockPassword.
  ///
  /// In en, this message translates to:
  /// **'Unlock with password'**
  String get lockUnlockPassword;

  /// No description provided for @lockFailedLeft.
  ///
  /// In en, this message translates to:
  /// **'That password did not match. {left} tries left.'**
  String lockFailedLeft(int left);

  /// No description provided for @dbListen.
  ///
  /// In en, this message translates to:
  /// **'Listen'**
  String get dbListen;

  /// No description provided for @dbListenDone.
  ///
  /// In en, this message translates to:
  /// **'Marked as heard.'**
  String get dbListenDone;

  /// No description provided for @dbActRestore.
  ///
  /// In en, this message translates to:
  /// **'Restore'**
  String get dbActRestore;

  /// No description provided for @dbPermitRestored.
  ///
  /// In en, this message translates to:
  /// **'The lock-out is released.'**
  String get dbPermitRestored;

  /// No description provided for @dbActSignHandover.
  ///
  /// In en, this message translates to:
  /// **'Sign handover'**
  String get dbActSignHandover;

  /// No description provided for @dbHandoverSigned.
  ///
  /// In en, this message translates to:
  /// **'Handover signed. You own this shift.'**
  String get dbHandoverSigned;

  /// No description provided for @attTeamTitle.
  ///
  /// In en, this message translates to:
  /// **'Your team today'**
  String get attTeamTitle;

  /// No description provided for @attTeamWhy.
  ///
  /// In en, this message translates to:
  /// **'Who is in, late, on leave, or needs a check.'**
  String get attTeamWhy;

  /// No description provided for @attTeamPresent.
  ///
  /// In en, this message translates to:
  /// **'In'**
  String get attTeamPresent;

  /// No description provided for @attTeamLate.
  ///
  /// In en, this message translates to:
  /// **'Late'**
  String get attTeamLate;

  /// No description provided for @attTeamLeave.
  ///
  /// In en, this message translates to:
  /// **'On leave'**
  String get attTeamLeave;

  /// No description provided for @attTeamReview.
  ///
  /// In en, this message translates to:
  /// **'To review'**
  String get attTeamReview;

  /// No description provided for @attTeamEmpty.
  ///
  /// In en, this message translates to:
  /// **'Nobody in this scope today.'**
  String get attTeamEmpty;

  /// No description provided for @attTeamNothing.
  ///
  /// In en, this message translates to:
  /// **'Nothing for you to do.'**
  String get attTeamNothing;

  /// No description provided for @attTeamReviewHint.
  ///
  /// In en, this message translates to:
  /// **'Open regularisation or leave it.'**
  String get attTeamReviewHint;

  /// No description provided for @attRosterNoneIn.
  ///
  /// In en, this message translates to:
  /// **'{notIn, plural, =1{1 person is not in yet.} other{{notIn} people are not in yet.}} {leave, plural, =0{Nothing for you to do.} other{{leave} are on leave. Nothing for you to do.}}'**
  String attRosterNoneIn(int notIn, int leave);

  /// No description provided for @attRosterLate.
  ///
  /// In en, this message translates to:
  /// **'{present} of {total} are in. {late, plural, =1{1 is late.} other{{late} are late.}} {notIn, plural, =0{Nothing for you to do.} other{{notIn} are not in yet.}}'**
  String attRosterLate(int present, int total, int late, int notIn);

  /// No description provided for @attRosterReview.
  ///
  /// In en, this message translates to:
  /// **'{present} of {total} are in. {review, plural, =1{1 check-in is outside the gate. Open it.} other{{review} check-ins are outside the gate. Open one.}}'**
  String attRosterReview(int present, int total, int review);

  /// No description provided for @attRosterIn.
  ///
  /// In en, this message translates to:
  /// **'{present} of {total} are in. {notIn, plural, =0{Nothing for you to do.} other{{notIn} are not in yet.}}'**
  String attRosterIn(int present, int total, int notIn);

  /// No description provided for @attRosterAll.
  ///
  /// In en, this message translates to:
  /// **'All {count}'**
  String attRosterAll(int count);

  /// No description provided for @attRosterInCount.
  ///
  /// In en, this message translates to:
  /// **'In {count}'**
  String attRosterInCount(int count);

  /// No description provided for @attRosterNotInCount.
  ///
  /// In en, this message translates to:
  /// **'Not in yet {count}'**
  String attRosterNotInCount(int count);

  /// No description provided for @attRosterLeaveCount.
  ///
  /// In en, this message translates to:
  /// **'On leave {count}'**
  String attRosterLeaveCount(int count);

  /// No description provided for @attRosterReviewCount.
  ///
  /// In en, this message translates to:
  /// **'To review {count}'**
  String attRosterReviewCount(int count);

  /// No description provided for @attRosterAbsentCount.
  ///
  /// In en, this message translates to:
  /// **'Absent {count}'**
  String attRosterAbsentCount(int count);

  /// No description provided for @attRosterRole.
  ///
  /// In en, this message translates to:
  /// **'{job} · {site}'**
  String attRosterRole(String job, String site);

  /// No description provided for @attRosterInAt.
  ///
  /// In en, this message translates to:
  /// **'In at {time}'**
  String attRosterInAt(String time);

  /// No description provided for @attRosterOutside.
  ///
  /// In en, this message translates to:
  /// **'Checked in {distance} m outside the gate.'**
  String attRosterOutside(int distance);

  /// No description provided for @approvalRejectExplain.
  ///
  /// In en, this message translates to:
  /// **'Write one sentence the requester will see on the file and in Inbox.'**
  String get approvalRejectExplain;

  /// No description provided for @approvalRejectionSeen.
  ///
  /// In en, this message translates to:
  /// **'Why it was turned down'**
  String get approvalRejectionSeen;

  /// No description provided for @flChat.
  ///
  /// In en, this message translates to:
  /// **'Trip chat'**
  String get flChat;

  /// No description provided for @flChatEmpty.
  ///
  /// In en, this message translates to:
  /// **'No messages on this trip yet.'**
  String get flChatEmpty;

  /// No description provided for @flChatHint.
  ///
  /// In en, this message translates to:
  /// **'Write to the driver or requester'**
  String get flChatHint;

  /// No description provided for @flPoolTitle.
  ///
  /// In en, this message translates to:
  /// **'These two trips can share a car'**
  String get flPoolTitle;

  /// No description provided for @flPoolBody.
  ///
  /// In en, this message translates to:
  /// **'{a} and {b} go the same way. Assign one car if both agree.'**
  String flPoolBody(String a, String b);

  /// No description provided for @flCallDriver.
  ///
  /// In en, this message translates to:
  /// **'Call driver'**
  String get flCallDriver;

  /// No description provided for @flOdoStart.
  ///
  /// In en, this message translates to:
  /// **'Start odometer (km)'**
  String get flOdoStart;

  /// No description provided for @flOdoEnd.
  ///
  /// In en, this message translates to:
  /// **'Finish odometer (km)'**
  String get flOdoEnd;

  /// No description provided for @busConductor.
  ///
  /// In en, this message translates to:
  /// **'Check a passenger'**
  String get busConductor;

  /// No description provided for @busConductorHint.
  ///
  /// In en, this message translates to:
  /// **'Employee ID or seat number'**
  String get busConductorHint;

  /// No description provided for @busConductorOk.
  ///
  /// In en, this message translates to:
  /// **'{name} is in seat {seat}.'**
  String busConductorOk(String name, String seat);

  /// No description provided for @busConductorMiss.
  ///
  /// In en, this message translates to:
  /// **'Nobody on this bus matches that.'**
  String get busConductorMiss;

  /// No description provided for @busSwap.
  ///
  /// In en, this message translates to:
  /// **'Ask to swap seats'**
  String get busSwap;

  /// No description provided for @busSwapHint.
  ///
  /// In en, this message translates to:
  /// **'The other person must accept.'**
  String get busSwapHint;

  /// No description provided for @busSwapDone.
  ///
  /// In en, this message translates to:
  /// **'Swap request sent.'**
  String get busSwapDone;

  /// No description provided for @busSwapAccept.
  ///
  /// In en, this message translates to:
  /// **'Accept seat swap'**
  String get busSwapAccept;

  /// No description provided for @chVoice.
  ///
  /// In en, this message translates to:
  /// **'Voice note'**
  String get chVoice;

  /// No description provided for @chVoiceRecord.
  ///
  /// In en, this message translates to:
  /// **'Hold to record'**
  String get chVoiceRecord;

  /// No description provided for @chVoiceStop.
  ///
  /// In en, this message translates to:
  /// **'Stop and send'**
  String get chVoiceStop;

  /// No description provided for @chVoicePlay.
  ///
  /// In en, this message translates to:
  /// **'Play voice note'**
  String get chVoicePlay;

  /// No description provided for @inGps.
  ///
  /// In en, this message translates to:
  /// **'Add where this happened'**
  String get inGps;

  /// No description provided for @inGpsOn.
  ///
  /// In en, this message translates to:
  /// **'Location attached'**
  String get inGpsOn;

  /// No description provided for @inCloseBlocked.
  ///
  /// In en, this message translates to:
  /// **'Every fix must be confirmed before this file can close.'**
  String get inCloseBlocked;

  /// No description provided for @asScanTag.
  ///
  /// In en, this message translates to:
  /// **'Scan a tag'**
  String get asScanTag;

  /// No description provided for @asScanHint.
  ///
  /// In en, this message translates to:
  /// **'Tag, name or serial'**
  String get asScanHint;

  /// No description provided for @asScanSearch.
  ///
  /// In en, this message translates to:
  /// **'Find'**
  String get asScanSearch;

  /// No description provided for @emErrNid.
  ///
  /// In en, this message translates to:
  /// **'NID must be 10, 13 or 17 digits.'**
  String get emErrNid;
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
