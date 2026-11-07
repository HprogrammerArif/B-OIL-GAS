import 'dart:async';

import 'package:bogcl_oneops/app/l10n_ext.dart';
import 'package:bogcl_oneops/app/routes.dart';
import 'package:bogcl_oneops/core/network/api_error.dart';
import 'package:bogcl_oneops/core/theme/tokens.dart';
import 'package:bogcl_oneops/core/utils/dates.dart';
import 'package:bogcl_oneops/core/utils/money.dart';
import 'package:bogcl_oneops/features/licences/data/licence_repository.dart';
import 'package:bogcl_oneops/features/licences/domain/licence_models.dart';
import 'package:bogcl_oneops/features/licences/presentation/licence_providers.dart';
import 'package:bogcl_oneops/features/licences/presentation/licence_ui.dart';
import 'package:bogcl_oneops/shared/widgets/app_text_field.dart';
import 'package:bogcl_oneops/shared/widgets/buttons.dart';
import 'package:bogcl_oneops/shared/widgets/state_views.dart';
import 'package:bogcl_oneops/shared/widgets/status_pill.dart';
import 'package:bogcl_oneops/shared/widgets/toast_and_sheets.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

class LicenceDetailScreen extends ConsumerStatefulWidget {
  const LicenceDetailScreen({required this.id, super.key});

  final String id;

  @override
  ConsumerState<LicenceDetailScreen> createState() =>
      _LicenceDetailScreenState();
}

class _LicenceDetailScreenState extends ConsumerState<LicenceDetailScreen> {
  bool _busy = false;

  LicenceRepository get _repo => ref.read(licenceRepositoryProvider);

  void _refresh() => ref
    ..invalidate(licenceDetailProvider)
    ..invalidate(licencesProvider);

  String _err(ApiException e) {
    final l10n = context.l10n;
    return switch (e.rule) {
      'FUND_NOT_APPROVED' => l10n.cpErrFund,
      'CHECKLIST_INCOMPLETE' => l10n.cpErrTicks,
      'CHECKLIST_FAILED' => l10n.cpErrFail,
      'LETTER_NOT_DUE' => l10n.cpErrLetter,
      'RENEWAL_OPEN' => l10n.cpErrOpen,
      'VALIDITY_RANGE' => l10n.cpErrValidity,
      _ =>
        e.code == ApiErrorCode.offline || e.code == ApiErrorCode.timeout
            ? l10n.claimErrOffline
            : e.fieldErrors.values.firstOrNull ?? l10n.cpErrFailed,
    };
  }

  Future<void> _run(Future<void> Function() call, String done) async {
    setState(() => _busy = true);
    try {
      await call();
      _refresh();
      if (!mounted) return;
      AppToast.show(context, done, tone: StatusTone.success);
    } on ApiException catch (e) {
      if (!mounted) return;
      AppToast.show(context, _err(e), tone: StatusTone.danger);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _completeAllChecklistItems(Licence l, LicenceRenewal r) async {
    final pending = r.checklist.where((c) => c.status != 'PASSED').toList();
    if (pending.isEmpty) {
      AppToast.show(
        context,
        context.isBangla
            ? 'সকল চেকলিস্ট আগেই সম্পন্ন হয়েছে'
            : 'All checklist items are already passed',
      );
      return;
    }

    setState(() => _busy = true);
    try {
      for (final item in pending) {
        await _repo.tickItem(l.id, item.id, {'status': 'PASSED'});
      }
      _refresh();
      if (!mounted) return;
      AppToast.show(
        context,
        context.isBangla
            ? 'সকল অডিট চেকলিস্ট সম্পন্ন হিসেবে চিহ্নিত করা হয়েছে'
            : 'All ${pending.length} checklist items certified PASSED',
        tone: StatusTone.success,
      );
    } on ApiException catch (e) {
      if (!mounted) return;
      AppToast.show(context, _err(e), tone: StatusTone.danger);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _openInspectorModal(Licence l) async {
    final bangla = context.isBangla;
    final nameCtrl = TextEditingController(
      text: 'Engr. A. K. Rahman (Chief Inspector)',
    );
    final findingsCtrl = TextEditingController(
      text: 'All storage tanks, fire hydrants and nitrogen blanketing systems fully compliant.',
    );
    var outcome = 'SATISFACTORY';

    final confirmed = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setModalState) => Padding(
          padding: EdgeInsets.fromLTRB(
            Space.lg,
            0,
            Space.lg,
            MediaQuery.viewInsetsOf(ctx).bottom + Space.lg,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                bangla
                    ? 'মাঠ পরিদর্শন ফলাফল নথিভুক্তকরণ'
                    : 'Log Field Inspection Findings',
                style: Theme.of(ctx).textTheme.titleLarge
                    ?.copyWith(fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: Space.xs),
              Text(
                bangla
                    ? 'পরিদর্শক কর্মকর্তার পর্যবেক্ষণ এবং নবায়ন সুপারিশ লিখুন।'
                    : 'Record regulatory inspector findings and safety audit clearance.',
                style: Theme.of(ctx).textTheme.bodySmall,
              ),
              const SizedBox(height: Space.md),
              AppTextField(
                label: bangla
                    ? 'পরিদর্শকের নাম ও পদবি'
                    : 'Inspector Name & Designation',
                controller: nameCtrl,
              ),
              const SizedBox(height: Space.xs),
              Wrap(
                spacing: Space.xs,
                children: [
                  ActionChip(
                    label: const Text(
                      'Engr. A. K. Rahman (Chief Inspector)',
                      style: TextStyle(fontSize: 11),
                    ),
                    onPressed: () => setModalState(
                      () => nameCtrl.text =
                          'Engr. A. K. Rahman (Chief Inspector)',
                    ),
                  ),
                  ActionChip(
                    label: const Text(
                      'Md. Tariqul Islam (Deputy Director)',
                      style: TextStyle(fontSize: 11),
                    ),
                    onPressed: () => setModalState(
                      () =>
                          nameCtrl.text = 'Md. Tariqul Islam (Deputy Director)',
                    ),
                  ),
                ],
              ),
              const SizedBox(height: Space.sm),
              Text(
                bangla ? 'পরিদর্শন ফলাফল' : 'Inspection Outcome',
                style: Theme.of(ctx).textTheme.labelMedium
                    ?.copyWith(fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 4),
              Row(
                children: [
                  ChoiceChip(
                    label: Text(
                      bangla
                          ? 'সন্তোষজনক (অনুমোদনযোগ্য)'
                          : 'Satisfactory (Recommended)',
                    ),
                    selected: outcome == 'SATISFACTORY',
                    onSelected: (_) =>
                        setModalState(() => outcome = 'SATISFACTORY'),
                  ),
                  const SizedBox(width: Space.sm),
                  ChoiceChip(
                    label: Text(bangla ? 'শর্তসাপেক্ষ' : 'Conditional'),
                    selected: outcome == 'CONDITIONAL',
                    onSelected: (_) =>
                        setModalState(() => outcome = 'CONDITIONAL'),
                  ),
                ],
              ),
              const SizedBox(height: Space.sm),
              AppTextField(
                label: bangla
                    ? 'পরিদর্শন পর্যবেক্ষণ ও মন্তব্য'
                    : 'Audit Observations & Findings',
                controller: findingsCtrl,
                maxLines: 3,
              ),
              const SizedBox(height: Space.md),
              PrimaryButton(
                label: bangla
                    ? 'সংরক্ষণ ও মন্ত্রণালয় যাচাইয়ে পাঠান'
                    : 'Save & Move to Ministry Vetting',
                onPressed: () => Navigator.pop(ctx, true),
              ),
            ],
          ),
        ),
      ),
    );

    if (confirmed == true && mounted) {
      final name = nameCtrl.text.trim();
      final findings = findingsCtrl.text.trim();
      if (name.isEmpty || findings.length < 10) {
        AppToast.show(
          context,
          bangla
              ? 'পরিদর্শকের নাম এবং কমপক্ষে ১০ অক্ষরের ফলাফল লিখুন'
              : 'Enter inspector name and at least 10 characters for findings',
          tone: StatusTone.warning,
        );
        return;
      }
      await _run(
        () => _repo.act(l.id, 'advance', {
          'inspectorName': name,
          'auditFindings': '[$outcome] $findings',
        }),
        bangla
            ? 'পরিদর্শন সম্পন্ন এবং মন্ত্রণালয় যাচাইয়ে পাঠানো হয়েছে'
            : 'Inspection logged and forwarded to Ministry',
      );
    }
  }

  Future<void> _openCertificateModal(Licence l) async {
    final bangla = context.isBangla;
    final year = DateTime.now().year;
    final nextYear = year + 1;
    final certCtrl = TextEditingController(
      text:
          '${l.bodyCode}/RNW/$year/${l.licenceNo.split('/').lastOrNull ?? '09'}',
    );
    final expiryCtrl = TextEditingController(
      text: DateTime(nextYear, 12, 31).toIso8601String().substring(0, 10),
    );
    final chalanCtrl = TextEditingController(text: 'CHALAN-SONALI-$year-78941');

    final confirmed = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setModalState) => Padding(
          padding: EdgeInsets.fromLTRB(
            Space.lg,
            0,
            Space.lg,
            MediaQuery.viewInsetsOf(ctx).bottom + Space.lg,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                bangla
                    ? 'নবায়ন সনদ ও লাইসেন্স ইস্যু নিশ্চিতকরণ'
                    : 'Confirm Renewal Certificate Issued',
                style: Theme.of(ctx).textTheme.titleLarge
                    ?.copyWith(fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: Space.xs),
              Text(
                bangla
                    ? 'মন্ত্রণালয় বা নিয়ন্ত্রক সংস্থা কর্তৃক প্রদত্ত নবায়ন সনদ নম্বর ও মেয়াদ নথিভুক্ত করুন।'
                    : 'Record official renewed licence reference and validity extension issued by the regulator.',
                style: Theme.of(ctx).textTheme.bodySmall,
              ),
              const SizedBox(height: Space.md),
              AppTextField(
                label: bangla
                    ? 'নতুন সনদ / লাইসেন্স নম্বর'
                    : 'New Certificate / Licence No',
                controller: certCtrl,
              ),
              const SizedBox(height: Space.sm),
              AppTextField(
                label: bangla
                    ? 'নতুন মেয়াদোত্তীর্ণ তারিখ (YYYY-MM-DD)'
                    : 'New Expiration Date (YYYY-MM-DD)',
                controller: expiryCtrl,
              ),
              if (l.feeAmount > 0) ...[
                const SizedBox(height: Space.sm),
                AppTextField(
                  label: bangla
                      ? 'সরকারি ট্রেজারি চালান নম্বর'
                      : 'Treasury Challan No',
                  controller: chalanCtrl,
                ),
              ],
              const SizedBox(height: Space.md),
              PrimaryButton(
                label: bangla
                    ? 'সনদ অনুমোদন ও সক্রিয়করণ'
                    : 'Issue Certificate & Activate',
                onPressed: () => Navigator.pop(ctx, true),
              ),
            ],
          ),
        ),
      ),
    );

    if (confirmed == true && mounted) {
      final cert = certCtrl.text.trim();
      final exp = expiryCtrl.text.trim();
      final chalan = chalanCtrl.text.trim();
      if (cert.isEmpty || exp.isEmpty) {
        AppToast.show(
          context,
          bangla
              ? 'সনদ নম্বর ও মেয়াদ পূরণ করুন'
              : 'Enter certificate number and expiry date',
          tone: StatusTone.warning,
        );
        return;
      }
      await _run(
        () => _repo.act(l.id, 'advance', {
          'certificateNo': cert,
          'newExpiresAt': exp.contains('T') ? exp : '${exp}T00:00:00.000Z',
          if (l.feeAmount > 0) 'chalanNo': chalan,
        }),
        bangla
            ? 'লাইসেন্স সফলভাবে নবায়ন ও সক্রিয় করা হয়েছে!'
            : 'Licence renewed and activated successfully!',
      );
    }
  }

  Future<void> _openRevertModal(Licence l) async {
    final bangla = context.isBangla;
    final reasonCtrl = TextEditingController();

    final confirmed = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      builder: (ctx) => Padding(
        padding: EdgeInsets.fromLTRB(
          Space.lg,
          0,
          Space.lg,
          MediaQuery.viewInsetsOf(ctx).bottom + Space.lg,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              bangla
                  ? 'পূর্ববর্তী ধাপে ফেরত পাঠান'
                  : 'Revert to Previous Stage',
              style: Theme.of(ctx).textTheme.titleLarge
                  ?.copyWith(fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: Space.xs),
            Text(
              bangla
                  ? 'নিয়ন্ত্রক সংস্থা বা অডিট দল কর্তৃক কোনো সংশোধন চাওয়া হলে কারণ উল্লেখ করে পূর্ববর্তী ধাপে ফেরত দিন।'
                  : 'Specify the reason for stepping back if regulator or audit team requires corrections.',
              style: Theme.of(ctx).textTheme.bodySmall,
            ),
            const SizedBox(height: Space.md),
            AppTextField(
              label: bangla
                  ? 'ফেরত পাঠানোর সুনির্দিষ্ট কারণ'
                  : 'Reason for Reversion',
              controller: reasonCtrl,
              maxLines: 3,
            ),
            const SizedBox(height: Space.md),
            PrimaryButton.secondary(
              label: bangla ? 'পূর্ববর্তী ধাপে স্থানান্তর' : 'Revert Stage',
              onPressed: () => Navigator.pop(ctx, true),
            ),
          ],
        ),
      ),
    );

    if (confirmed == true && mounted) {
      final reason = reasonCtrl.text.trim();
      if (reason.length < 5) {
        AppToast.show(
          context,
          bangla
              ? 'কমপক্ষে ৫ অক্ষরের কারণ লিখুন'
              : 'Please provide a valid reason (min 5 chars)',
          tone: StatusTone.warning,
        );
        return;
      }
      await _run(
        () => _repo.act(l.id, 'back', {'reason': reason}),
        bangla
            ? 'ফাইল পূর্ববর্তী ধাপে ফেরত পাঠানো হয়েছে'
            : 'File reverted to previous stage',
      );
    }
  }

  Future<void> _openDoLetterModal(Licence l) async {
    final bangla = context.isBangla;
    final year = DateTime.now().year;
    final memoNo = 'BOGCL/CMD-DO/${l.bodyCode}-$year-0101';
    final subject = bangla
        ? '${l.heading(bangla: true)} নবায়ন দ্রুত ইস্যুর অনুরোধ — কেরানীগঞ্জ প্ল্যান্ট।'
        : 'Request to expedite renewal of ${l.heading(bangla: false)} — Keraniganj Plant.';
    final body = bangla
        ? 'কেরানীগঞ্জ বিটুমিন প্ল্যান্টে ${l.licenceNo} এর সকল প্রাক-নবায়ন প্রস্তুতি এবং সরকারি ফি ${l.feeAmount > 0 ? licenceTaka(l.feeAmount, bangla: true) : ''} সম্পন্ন হয়েছে (${l.statutoryLaw(bangla: true)})। নবায়নে বিলম্ব ঘটলে রিফাইনারি উৎপাদন ও বিটুমিন সরবরাহ ব্যাহত হয়ে দৈনিক ${Money.fromPaisa((l.shutdownRiskPerDay * 100).round()).format(bengali: true)} ক্ষতির ঝুঁকি সৃষ্টি হবে। বিষয়টি জরুরি বিবেচনায় নবায়ন সনদ ইস্যু করার অনুরোধ করছি।'
        : 'Statutory compliance audits for permit ${l.licenceNo} under ${l.statutoryLaw(bangla: false)} are complete. Ongoing plant operations and nationwide bitumen supplies require immediate renewal; any operational halt carries a plant shutdown exposure of ${Money.fromPaisa((l.shutdownRiskPerDay * 100).round()).format()}/day. We respectfully request expeditious issuance of the renewal certificate.';

    final subjectCtrl = TextEditingController(text: subject);
    final bodyCtrl = TextEditingController(text: body);
    var channel = 'COURIER'; // COURIER, ENOTHI, LIAISON

    final confirmed = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setModalState) => Padding(
          padding: EdgeInsets.fromLTRB(
            Space.lg,
            0,
            Space.lg,
            MediaQuery.viewInsetsOf(ctx).bottom + Space.lg,
          ),
          child: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Icon(
                      Icons.mark_email_read_outlined,
                      color: Theme.of(ctx).colorScheme.primary,
                    ),
                    const SizedBox(width: Space.xs),
                    Expanded(
                      child: Text(
                        bangla
                            ? 'সরকারি ডিও লেটার প্রণয়ন ও প্রেরণ'
                            : 'Official Chairman Demi-Official (DO) Letter',
                        style: Theme.of(ctx).textTheme.titleLarge
                            ?.copyWith(fontWeight: FontWeight.bold),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: Space.xs),
                Text(
                  bangla
                      ? 'নিয়ন্ত্রক সংস্থার মহাপরিচালক বরাবর চেয়ারম্যান মহোদয়ের আনুষ্ঠানিক ডিও পত্র।'
                      : 'Expedited regulatory clearance memorandum signed by Chairman & Managing Director.',
                  style: Theme.of(ctx).textTheme.bodySmall,
                ),
                const SizedBox(height: Space.md),

                // Formal Letterhead Box
                Container(
                  padding: const EdgeInsets.all(Space.md),
                  decoration: BoxDecoration(
                    color: Colors.amber.shade50.withValues(alpha: 0.5),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: Colors.amber.shade300),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Center(
                        child: Text(
                          'BASHUNDHARA GROUP',
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w900,
                            letterSpacing: 1.2,
                            color: Colors.red.shade900,
                          ),
                        ),
                      ),
                      Center(
                        child: Text(
                          bangla
                              ? 'চেয়ারম্যান ও ব্যবস্থাপনা পরিচালকের দপ্তর'
                              : 'Office of the Chairman & Managing Director',
                          style: const TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                      const Divider(height: 16),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            'Memo: $memoNo',
                            style: const TextStyle(
                              fontSize: 11,
                              fontFamily: 'monospace',
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          Text(
                            DateFmt.date(DateTime.now(), bangla ? 'bn' : 'en'),
                            style: const TextStyle(fontSize: 11),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: Space.md),

                Text(
                  bangla
                      ? 'প্রেরণ মাধ্যম (Cross-Module Integration)'
                      : 'Dispatch Channel & Cross-Module Integration',
                  style: Theme.of(ctx).textTheme.labelMedium
                      ?.copyWith(fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 6),
                Wrap(
                  spacing: Space.xs,
                  runSpacing: 4,
                  children: [
                    ChoiceChip(
                      label: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(Icons.local_shipping_outlined, size: 14),
                          const SizedBox(width: 4),
                          Text(
                            bangla
                                ? 'অফিসিয়াল কুরিয়ার (MOD-04 পার্সেল)'
                                : 'Official Courier (Tracked Parcel)',
                          ),
                        ],
                      ),
                      selected: channel == 'COURIER',
                      onSelected: (_) =>
                          setModalState(() => channel = 'COURIER'),
                    ),
                    ChoiceChip(
                      label: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(Icons.account_balance_outlined, size: 14),
                          const SizedBox(width: 4),
                          Text(
                            bangla
                                ? 'সরকারি ই-নথি (Digital Govt)'
                                : 'Govt e-Nothi Portal',
                          ),
                        ],
                      ),
                      selected: channel == 'ENOTHI',
                      onSelected: (_) =>
                          setModalState(() => channel = 'ENOTHI'),
                    ),
                    ChoiceChip(
                      label: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(
                            Icons.person_pin_circle_outlined,
                            size: 14,
                          ),
                          const SizedBox(width: 4),
                          Text(
                            bangla
                                ? 'লিয়াজোঁ কর্মকর্তা (হাতে হাতে)'
                                : 'Liaison Officer (Hand)',
                          ),
                        ],
                      ),
                      selected: channel == 'LIAISON',
                      onSelected: (_) =>
                          setModalState(() => channel = 'LIAISON'),
                    ),
                  ],
                ),

                if (channel == 'COURIER') ...[
                  const SizedBox(height: Space.xs),
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: Colors.blue.shade50,
                      borderRadius: BorderRadius.circular(6),
                      border: Border.all(color: Colors.blue.shade200),
                    ),
                    child: Row(
                      children: [
                        Icon(
                          Icons.info_outline,
                          size: 16,
                          color: Colors.blue.shade800,
                        ),
                        const SizedBox(width: 6),
                        Expanded(
                          child: Text(
                            bangla
                                ? 'কুরিয়ার প্রেরণে ক্লিক করলে MOD-04 Parcels-এ একটি ট্র্যাকযোগ্য সিলগালা পার্সেল স্বয়ংক্রিয়ভাবে তৈরি হবে।'
                                : 'Selecting Official Courier automatically creates a confidential tracked parcel in MOD-04 (Parcels).',
                            style: TextStyle(
                              fontSize: 11,
                              color: Colors.blue.shade900,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],

                const SizedBox(height: Space.sm),
                AppTextField(
                  label: bangla ? 'চিঠির বিষয়' : 'Letter Subject',
                  controller: subjectCtrl,
                ),
                const SizedBox(height: Space.sm),
                AppTextField(
                  label: bangla ? 'চিঠির মূল বক্তব্য' : 'Letter Body',
                  controller: bodyCtrl,
                  maxLines: 4,
                ),
                const SizedBox(height: Space.md),
                PrimaryButton(
                  label: bangla
                      ? 'ডিও লেটার প্রেরণ ও নথিভুক্ত করুন'
                      : 'Dispatch DO Letter Now',
                  onPressed: () => Navigator.pop(ctx, true),
                ),
              ],
            ),
          ),
        ),
      ),
    );

    if (confirmed == true && mounted) {
      await _run(
        () => _repo.act(l.id, 'letters', {
          'subject': subjectCtrl.text.trim(),
          'body': bodyCtrl.text.trim(),
          'channel': channel,
        }),
        bangla
            ? 'ডিও লেটার সফলভাবে প্রেরিত হয়েছে${channel == 'COURIER' ? ' (MOD-04 পার্সেল তৈরি হয়েছে)' : ''}'
            : 'DO letter dispatched successfully${channel == 'COURIER' ? ' (Tracked in MOD-04 Parcels)' : ''}',
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final bangla = context.isBangla;
    final async = ref.watch(licenceDetailProvider(widget.id));
    final scheme = Theme.of(context).colorScheme;

    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.moduleCompliance),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            tooltip: bangla ? 'রিফ্রেশ' : 'Refresh',
            onPressed: _refresh,
          ),
        ],
      ),
      body: async.when(
        loading: () => const SkeletonList(),
        error: (_, _) => ErrorState(
          onRetry: () => ref.invalidate(licenceDetailProvider(widget.id)),
        ),
        data: (l) {
          final m = l.me;
          final r = l.renewal;
          final who = l.owner?.display(bangla: bangla) ?? '';
          final riskTk = l.shutdownRiskPerDay > 0
              ? l.shutdownRiskPerDay
              : l.exposurePerDay;

          return ListView(
            padding: const EdgeInsets.all(Space.md),
            children: [
              // Top Verdict Card
              Container(
                padding: const EdgeInsets.all(Space.md),
                decoration: BoxDecoration(
                  color: l.urgency == 'CRITICAL' || l.urgency == 'EXPIRED'
                      ? scheme.errorContainer.withValues(alpha: 0.25)
                      : scheme.primaryContainer.withValues(alpha: 0.2),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: l.urgency == 'CRITICAL' || l.urgency == 'EXPIRED'
                        ? scheme.error.withValues(alpha: 0.4)
                        : scheme.primary.withValues(alpha: 0.3),
                  ),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                l.heading(bangla: bangla),
                                style: Theme.of(context).textTheme.titleMedium
                                    ?.copyWith(fontWeight: FontWeight.bold),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                [
                                  l.bodyCode,
                                  l.licenceNo,
                                  l.siteLabel(bangla: bangla),
                                ].join(' · '),
                                style: Theme.of(context).textTheme.bodySmall
                                    ?.copyWith(
                                      fontFamily: 'monospace',
                                      color: scheme.onSurfaceVariant,
                                    ),
                              ),
                            ],
                          ),
                        ),
                        StatusPill(
                          label: licenceUrgencyLabel(l10n, l.urgency),
                          tone: licenceUrgencyTone(l.urgency),
                        ),
                      ],
                    ),
                    const Divider(height: 16),
                    Row(
                      children: [
                        Icon(
                          Icons.info_outline,
                          size: 16,
                          color: scheme.onSurfaceVariant,
                        ),
                        const SizedBox(width: 6),
                        Expanded(
                          child: Text(
                            licenceNextLine(l10n, l, bangla: bangla),
                            style: Theme.of(context).textTheme.bodySmall
                                ?.copyWith(fontWeight: FontWeight.w600),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),

              const SizedBox(height: Space.md),

              // CARD 1: Statutory Risk & Legal Penalty Card
              Card(
                elevation: 0,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                  side: BorderSide(color: Colors.red.shade300),
                ),
                color: Colors.red.shade50.withValues(alpha: 0.3),
                child: Padding(
                  padding: const EdgeInsets.all(Space.md),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Icon(
                            Icons.gavel,
                            color: Colors.red.shade800,
                            size: 20,
                          ),
                          const SizedBox(width: Space.xs),
                          Text(
                            bangla
                                ? 'সংবিধিবদ্ধ আইন ও জরিমানা ধারা'
                                : 'Statutory Law & Regulatory Exposure',
                            style: TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.bold,
                              color: Colors.red.shade900,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: Space.xs),
                      Text(
                        l.statutoryLaw(bangla: bangla),
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w700,
                          color: scheme.onSurface,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        l.statutoryPenalty(bangla: bangla),
                        style: TextStyle(
                          fontSize: 12,
                          color: Colors.red.shade900,
                        ),
                      ),
                      const SizedBox(height: Space.sm),
                      Container(
                        padding: const EdgeInsets.all(Space.sm),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: Colors.red.shade200),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  bangla
                                      ? 'দৈনিক রিফাইনারি উৎপাদন ক্ষতি'
                                      : 'Daily Plant Shutdown Exposure',
                                  style: const TextStyle(
                                    fontSize: 11,
                                    color: Colors.grey,
                                  ),
                                ),
                                Text(
                                  riskTk > 0
                                      ? (bangla
                                            ? '${Money.fromPaisa((riskTk * 100).round()).format(bengali: true)} / দিন'
                                            : '${Money.fromPaisa((riskTk * 100).round()).format()} / day')
                                      : (bangla
                                            ? 'ঝুঁকিমুক্ত'
                                            : 'Low risk profile'),
                                  style: TextStyle(
                                    fontSize: 15,
                                    fontWeight: FontWeight.w900,
                                    color: Colors.red.shade800,
                                  ),
                                ),
                              ],
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 8,
                                vertical: 4,
                              ),
                              decoration: BoxDecoration(
                                color: Colors.red.shade100,
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: Text(
                                bangla
                                    ? 'গুরুত্বপূর্ণ সংবিধিবদ্ধ'
                                    : 'MANDATORY STATUTORY',
                                style: TextStyle(
                                  fontSize: 10,
                                  fontWeight: FontWeight.bold,
                                  color: Colors.red.shade900,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),

              const SizedBox(height: Space.md),

              // CARD 2: 5-Stage Interactive Renewal Pipeline Stepper
              Card(
                elevation: 0,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                  side: BorderSide(color: scheme.outlineVariant),
                ),
                child: Padding(
                  padding: const EdgeInsets.all(Space.md),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            bangla
                                ? '৫-ধাপ বিশিষ্ট নবায়ন প্রক্রিয়া'
                                : '5-Stage Renewal Pipeline',
                            style: Theme.of(context).textTheme.titleSmall
                                ?.copyWith(fontWeight: FontWeight.bold),
                          ),
                          if (r != null)
                            Text(
                              '${r.readinessPct.round()}% Ready',
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.bold,
                                color: scheme.primary,
                              ),
                            ),
                        ],
                      ),
                      const SizedBox(height: Space.sm),
                      _PipelineVisualStepper(
                        currentStage:
                            r?.stage ??
                            (l.status == 'ACTIVE' ? 'RENEWED' : null),
                        bangla: bangla,
                      ),
                    ],
                  ),
                ),
              ),

              const SizedBox(height: Space.md),

              // CARD 3: Active Stage Gate Action Panel
              Card(
                elevation: 0,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                  side: BorderSide(color: scheme.outlineVariant),
                ),
                child: Padding(
                  padding: const EdgeInsets.all(Space.md),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        bangla
                            ? 'সক্রিয় নবায়ন কার্যক্রম ও গেট'
                            : 'Active Renewal Actions & Gates',
                        style: Theme.of(context).textTheme.titleSmall
                            ?.copyWith(fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: Space.sm),

                      // If no renewal open:
                      if (r == null) ...[
                        Text(
                          bangla
                              ? 'লাইসেন্সের বর্তমান মেয়াদ সচল রয়েছে অথবা এখনও নবায়ন শুরু হয়নি।'
                              : 'Current permit is active or renewal file has not yet been initiated.',
                          style: Theme.of(context).textTheme.bodySmall,
                        ),
                        const SizedBox(height: Space.md),
                        if (m.canRenew)
                          PrimaryButton(
                            label: bangla
                                ? 'নবায়ন ফাইল সূচনা করুন (৯০ দিনের চক্র)'
                                : 'Initiate Renewal File (90-Day Cycle)',
                            onPressed: _busy
                                ? null
                                : () => unawaited(
                                    _run(
                                      () => _repo.act(l.id, 'renewals'),
                                      bangla
                                          ? 'নবায়ন ফাইল খোলা হয়েছে'
                                          : 'Renewal file initiated',
                                    ),
                                  ),
                          ),
                      ],

                      // Stage 1: Internal Review & Checklist Gate
                      if (r != null && r.stage == 'INTERNAL_REVIEW') ...[
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              bangla
                                  ? 'গেট ১: প্রাক-আবেদন অডিট চেকলিস্ট'
                                  : 'Gate 1: Pre-Submission Audit Checklist',
                              style: const TextStyle(
                                fontWeight: FontWeight.bold,
                                fontSize: 13,
                              ),
                            ),
                            TextButton.icon(
                              onPressed: _busy
                                  ? null
                                  : () => _completeAllChecklistItems(l, r),
                              icon: const Icon(Icons.done_all, size: 16),
                              label: Text(
                                bangla
                                    ? 'সব টিক দিন (ডেমো)'
                                    : 'Pass All (Demo)',
                                style: const TextStyle(fontSize: 11),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: Space.xs),
                        for (final c in r.checklist)
                          CheckboxListTile(
                            contentPadding: EdgeInsets.zero,
                            title: Text(
                              c.display(bangla: bangla),
                              style: const TextStyle(fontSize: 13),
                            ),
                            value: c.status == 'PASSED',
                            subtitle: c.note != null
                                ? Text(
                                    c.note!,
                                    style: const TextStyle(fontSize: 11),
                                  )
                                : null,
                            onChanged:
                                !m.canChecklist || c.status == 'PASSED' || _busy
                                ? null
                                : (_) => unawaited(
                                    _run(
                                      () => _repo.tickItem(l.id, c.id, {
                                        'status': 'PASSED',
                                      }),
                                      context.isBangla
                                          ? 'চেকলিস্ট সম্পন্ন'
                                          : 'Item passed',
                                    ),
                                  ),
                          ),
                        const SizedBox(height: Space.sm),
                        PrimaryButton(
                          label: bangla
                              ? 'আবেদন দাখিল ও সরকারি চালান ধাপে যান'
                              : 'File Application & Advance to Fee Gate',
                          onPressed: _busy || !m.canAdvance
                              ? null
                              : () => unawaited(
                                  _run(
                                    () => _repo.act(l.id, 'advance'),
                                    bangla
                                        ? 'আবেদন দাখিল সম্পন্ন হয়েছে'
                                        : 'Application filed successfully',
                                  ),
                                ),
                        ),
                      ],

                      // Stage 2: Application Filed & Fee Challan Gate
                      if (r != null && r.stage == 'APPLICATION_FILED') ...[
                        Text(
                          bangla
                              ? 'গেট ২: সরকারি ট্রেজারি চালান ও অর্থ বিভাগ অনুমোদন'
                              : 'Gate 2: Treasury Challan & Fee Clearance',
                          style: const TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 13,
                          ),
                        ),
                        const SizedBox(height: Space.xs),
                        Container(
                          padding: const EdgeInsets.all(Space.sm),
                          decoration: BoxDecoration(
                            color: scheme.surfaceContainerHighest.withValues(
                              alpha: 0.5,
                            ),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                mainAxisAlignment:
                                    MainAxisAlignment.spaceBetween,
                                children: [
                                  Text(
                                    bangla
                                        ? 'সরকারি লাইসেন্স ফি'
                                        : 'Statutory Licence Fee',
                                    style: const TextStyle(fontSize: 12),
                                  ),
                                  Text(
                                    licenceTaka(r.feeAmount, bangla: bangla),
                                    style: const TextStyle(
                                      fontSize: 14,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 4),
                              Text(
                                'Sonali Bank Treasury Code: 1-4241-0000-2031',
                                style: TextStyle(
                                  fontSize: 11,
                                  color: scheme.onSurfaceVariant,
                                ),
                              ),
                              const SizedBox(height: Space.xs),
                              Row(
                                children: [
                                  Text(
                                    bangla
                                        ? 'অর্থ বিভাগ স্ট্যাটাস: '
                                        : 'Finance Status: ',
                                    style: const TextStyle(fontSize: 12),
                                  ),
                                  StatusPill(
                                    label: r.fundApproved
                                        ? (bangla ? 'অনুমোদিত' : 'FEE APPROVED')
                                        : (bangla
                                              ? 'অনুমোদন পেন্ডিং'
                                              : 'PENDING FINANCE'),
                                    tone: r.fundApproved
                                        ? StatusTone.success
                                        : StatusTone.warning,
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: Space.md),
                        if (!r.fundApproved) ...[
                          PrimaryButton(
                            label: bangla
                                ? 'সরকারি চালান ফি অনুমোদন করুন (HOD Finance)'
                                : 'Approve Statutory Challan Fee',
                            onPressed: _busy
                                ? null
                                : () => unawaited(
                                    _run(
                                      () => _repo.act(l.id, 'fund'),
                                      bangla
                                          ? 'চালান ফি অনুমোদিত হয়েছে'
                                          : 'Treasury fee approved',
                                    ),
                                  ),
                          ),
                          const SizedBox(height: Space.xs),
                        ],
                        PrimaryButton(
                          label: bangla
                              ? 'পরিদর্শন নির্ধারণ করুন (ধাপ ৩)'
                              : 'Schedule & Log Field Inspection',
                          onPressed: _busy || !r.fundApproved
                              ? null
                              : () => _openInspectorModal(l),
                        ),
                      ],

                      // Stage 3: Field Inspection Gate
                      if (r != null && r.stage == 'FIELD_INSPECTION') ...[
                        Text(
                          bangla
                              ? 'গেট ৩: সরেজমিন মাঠ পরিদর্শন ফলাফল'
                              : 'Gate 3: Field Inspection Findings',
                          style: const TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 13,
                          ),
                        ),
                        const SizedBox(height: Space.xs),
                        if (r.inspectorName != null) ...[
                          Text(
                            'Inspector: ${r.inspectorName}',
                            style: const TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                        if (r.auditFindings != null) ...[
                          const SizedBox(height: 2),
                          Text(
                            'Findings: ${r.auditFindings}',
                            style: TextStyle(
                              fontSize: 12,
                              color: scheme.onSurfaceVariant,
                            ),
                          ),
                        ],
                        const SizedBox(height: Space.md),
                        PrimaryButton(
                          label: bangla
                              ? 'পরিদর্শন ফলাফল রেকর্ড ও মন্ত্রণালয় যাচাইয়ে পাঠান'
                              : 'Log Inspector Findings & Advance',
                          onPressed: _busy
                              ? null
                              : () => _openInspectorModal(l),
                        ),
                      ],

                      // Stage 4: Ministry Vetting Gate
                      if (r != null && r.stage == 'MINISTRY_VETTING') ...[
                        Text(
                          bangla ? 'গেট ৪: মন্ত্রণালয়ে যাচাই ও সনদ ইস্যু' : 'Gate 4: Ministry Vetting & Certificate Issuance',
                          style: const TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 13,
                          ),
                        ),
                        const SizedBox(height: Space.xs),
                        Text(
                          bangla
                              ? 'নথি বর্তমানে সংশ্লিষ্ট মন্ত্রণালয় / অধিদপ্তরের টেবিলে স্বাক্ষরের অপেক্ষায় রয়েছে।'
                              : 'File is currently under vetting at the ministry / regulatory directorate.',
                          style: Theme.of(context).textTheme.bodySmall,
                        ),
                        const SizedBox(height: Space.md),
                        PrimaryButton(
                          label: bangla
                              ? 'নবায়ন সনদ ইস্যু নিশ্চিতকরণ (ধাপ ৫)'
                              : 'Confirm Renewal Certificate Issued',
                          onPressed: _busy
                              ? null
                              : () => _openCertificateModal(l),
                        ),
                      ],

                      // Stage 5: Renewed & Active
                      if (r != null && r.stage == 'RENEWED') ...[
                        Container(
                          padding: const EdgeInsets.all(Space.md),
                          decoration: BoxDecoration(
                            color: Colors.green.shade50,
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(color: Colors.green.shade300),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Icon(
                                    Icons.check_circle,
                                    color: Colors.green.shade800,
                                  ),
                                  const SizedBox(width: Space.xs),
                                  Text(
                                    bangla
                                        ? 'লাইসেন্স সফলভাবে নবায়িত ও সক্রিয়'
                                        : 'Licence Renewed & Fully Active',
                                    style: TextStyle(
                                      fontWeight: FontWeight.bold,
                                      color: Colors.green.shade900,
                                    ),
                                  ),
                                ],
                              ),
                              if (r.certificateNo != null) ...[
                                const SizedBox(height: 4),
                                Text(
                                  'Certificate No: ${r.certificateNo}',
                                  style: const TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ],
                            ],
                          ),
                        ),
                      ],

                      // Revert Button
                      if (m.canBack &&
                          r != null &&
                          r.stage != 'INTERNAL_REVIEW' &&
                          r.stage != 'RENEWED') ...[
                        const SizedBox(height: Space.md),
                        Center(
                          child: TextButton.icon(
                            onPressed: _busy ? null : () => _openRevertModal(l),
                            icon: const Icon(Icons.undo, size: 16),
                            label: Text(
                              bangla
                                  ? 'পূর্ববর্তী ধাপে ফেরত পাঠান (Revert)'
                                  : 'Revert to Previous Stage',
                              style: const TextStyle(fontSize: 12),
                            ),
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              ),

              const SizedBox(height: Space.md),

              // CARD 4: Official DO Letter Generator & Dispatcher (with MOD-04 Parcel Integration)
              Card(
                elevation: 0,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                  side: BorderSide(color: Colors.amber.shade300),
                ),
                color: Colors.amber.shade50.withValues(alpha: 0.3),
                child: Padding(
                  padding: const EdgeInsets.all(Space.md),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Icon(
                            Icons.mark_email_unread_outlined,
                            color: Colors.brown.shade800,
                            size: 20,
                          ),
                          const SizedBox(width: Space.xs),
                          Text(
                            bangla
                                ? 'চেয়ারম্যান ডিও পত্র (DO Letter Dispatch)'
                                : 'Chairman Demi-Official (DO) Letter',
                            style: TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.bold,
                              color: Colors.brown.shade900,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: Space.xs),
                      Text(
                        bangla
                            ? 'নবায়ন প্রক্রিয়া দ্রুততর করতে নিয়ন্ত্রক অধিদপ্তরের মহাপরিচালক বরাবরে চেয়ারম্যান মহোদয়ের আনুষ্ঠানিক ডিও পত্র প্রেরণ করুন।'
                            : 'Expedite agency processing by generating an official Demi-Official letter to the regulatory Director General.',
                        style: Theme.of(context).textTheme.bodySmall,
                      ),
                      const SizedBox(height: Space.sm),
                      PrimaryButton.secondary(
                        label: bangla
                            ? 'ডিও লেটার তৈরি ও প্রেরণ করুন'
                            : 'Generate & Dispatch DO Letter',
                        onPressed: _busy ? null : () => _openDoLetterModal(l),
                      ),
                    ],
                  ),
                ),
              ),

              // CARD 5: Dispatched DO Letters & Cross-Module Parcel Tracking
              if (l.letters.isNotEmpty) ...[
                const SizedBox(height: Space.md),
                Card(
                  elevation: 0,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                    side: BorderSide(color: scheme.outlineVariant),
                  ),
                  child: Padding(
                    padding: const EdgeInsets.all(Space.md),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          bangla
                              ? 'প্রেরিত ডিও চিঠিপত্র ও পার্সেল ট্র্যাকিং'
                              : 'Dispatched Letters & Parcel Tracking',
                          style: Theme.of(context).textTheme.titleSmall
                              ?.copyWith(fontWeight: FontWeight.bold),
                        ),
                        const SizedBox(height: Space.sm),
                        for (final letter in l.letters) ...[
                          Container(
                            padding: const EdgeInsets.all(Space.sm),
                            margin: const EdgeInsets.only(bottom: Space.sm),
                            decoration: BoxDecoration(
                              color: scheme.surfaceContainerHighest.withValues(
                                alpha: 0.4,
                              ),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  mainAxisAlignment:
                                      MainAxisAlignment.spaceBetween,
                                  children: [
                                    Text(
                                      letter.memoNo,
                                      style: const TextStyle(
                                        fontSize: 12,
                                        fontWeight: FontWeight.bold,
                                        fontFamily: 'monospace',
                                      ),
                                    ),
                                    StatusPill(
                                      label: letter.channel,
                                      tone: StatusTone.info,
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  letter.subject,
                                  style: const TextStyle(fontSize: 12),
                                ),
                                if (letter.parcelId != null) ...[
                                  const SizedBox(height: Space.xs),
                                  ElevatedButton.icon(
                                    style: ElevatedButton.styleFrom(
                                      visualDensity: VisualDensity.compact,
                                      padding: const EdgeInsets.symmetric(
                                        horizontal: 10,
                                        vertical: 4,
                                      ),
                                    ),
                                    onPressed: () => context.push(
                                      AppRoutes.parcelDetail(letter.parcelId!),
                                    ),
                                    icon: const Icon(
                                      Icons.local_shipping,
                                      size: 14,
                                    ),
                                    label: Text(
                                      bangla
                                          ? 'MOD-04 পার্সেল ট্র্যাক করুন (#${letter.parcelId})'
                                          : 'Track in MOD-04 Parcels (#${letter.parcelId})',
                                      style: const TextStyle(fontSize: 11),
                                    ),
                                  ),
                                ],
                              ],
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                ),
              ],

              const SizedBox(height: Space.md),

              // CARD 6: Metadata & Details Tile
              ExpansionTile(
                title: Text(l10n.cpDetails),
                children: [
                  ListTile(
                    title: Text(l10n.cpPassport),
                    subtitle: Text(
                      [l.ref, l.licenceNo, l.bodyCode].join(' · '),
                    ),
                  ),
                  if (l.expiresAt != null)
                    ListTile(
                      title: Text(bangla ? 'মেয়াদ শেষ' : 'Expiry Date'),
                      subtitle: Text(
                        DateFmt.date(l.expiresAt!, bangla ? 'bn' : 'en'),
                      ),
                    ),
                  ListTile(
                    title: Text(
                      bangla
                          ? 'দায়িত্বপ্রাপ্ত কর্মকর্তা'
                          : 'Permit Focal / Owner',
                    ),
                    subtitle: Text(
                      who.isNotEmpty ? who : 'Plant Operations GM',
                    ),
                  ),
                  if (l.feeAmount > 0)
                    ListTile(
                      title: Text(l10n.cpFieldFee),
                      subtitle: Text(licenceTaka(l.feeAmount, bangla: bangla)),
                    ),
                ],
              ),
            ],
          );
        },
      ),
    );
  }
}

class _PipelineVisualStepper extends StatelessWidget {
  const _PipelineVisualStepper({
    required this.currentStage,
    required this.bangla,
  });

  final String? currentStage;
  final bool bangla;

  static const _steps = [
    ('INTERNAL_REVIEW', '1. App Prep', '১. আবেদন'),
    ('APPLICATION_FILED', '2. Fee', '২. ফি'),
    ('FIELD_INSPECTION', '3. Inspection', '৩. পরিদর্শন'),
    ('MINISTRY_VETTING', '4. Vetting', '৪. যাচাই'),
    ('RENEWED', '5. Active', '৫. সক্রিয়'),
  ];

  int _currentIndex() {
    if (currentStage == null) return -1;
    final idx = _steps.indexWhere((s) => s.$1 == currentStage);
    return idx >= 0 ? idx : 0;
  }

  @override
  Widget build(BuildContext context) {
    final cur = _currentIndex();
    final scheme = Theme.of(context).colorScheme;

    return Row(
      children: [
        for (var i = 0; i < _steps.length; i++) ...[
          Expanded(
            child: Column(
              children: [
                Container(
                  width: 24,
                  height: 24,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: i < cur
                        ? Colors.green
                        : (i == cur ? scheme.primary : scheme.outlineVariant),
                  ),
                  child: Center(
                    child: i < cur
                        ? const Icon(Icons.check, size: 14, color: Colors.white)
                        : Text(
                            '${i + 1}',
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                              color: i == cur
                                  ? scheme.onPrimary
                                  : scheme.onSurfaceVariant,
                            ),
                          ),
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  bangla ? _steps[i].$3 : _steps[i].$2,
                  textAlign: TextAlign.center,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: i == cur ? FontWeight.bold : FontWeight.normal,
                    color: i == cur ? scheme.primary : scheme.onSurfaceVariant,
                  ),
                ),
              ],
            ),
          ),
          if (i < _steps.length - 1)
            Container(
              width: 12,
              height: 2,
              color: i < cur ? Colors.green : scheme.outlineVariant,
            ),
        ],
      ],
    );
  }
}
