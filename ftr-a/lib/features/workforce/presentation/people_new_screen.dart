import 'dart:async';

import 'package:bogcl_oneops/app/l10n_ext.dart';
import 'package:bogcl_oneops/app/routes.dart';
import 'package:bogcl_oneops/core/network/api_error.dart';
import 'package:bogcl_oneops/core/theme/tokens.dart';
import 'package:bogcl_oneops/features/people/presentation/person_picker.dart';
import 'package:bogcl_oneops/features/workforce/data/workforce_repository.dart';
import 'package:bogcl_oneops/features/workforce/presentation/workforce_providers.dart';
import 'package:bogcl_oneops/shared/widgets/app_text_field.dart';
import 'package:bogcl_oneops/shared/widgets/buttons.dart';
import 'package:bogcl_oneops/shared/widgets/status_pill.dart';
import 'package:bogcl_oneops/shared/widgets/toast_and_sheets.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

class PeopleNewScreen extends ConsumerStatefulWidget {
  const PeopleNewScreen({super.key});

  @override
  ConsumerState<PeopleNewScreen> createState() => _PeopleNewScreenState();
}

class _PeopleNewScreenState extends ConsumerState<PeopleNewScreen> {
  final _name = TextEditingController();
  final _nameBn = TextEditingController();
  final _title = TextEditingController();
  final _phone = TextEditingController();
  final _email = TextEditingController();
  final _nid = TextEditingController();
  String _dept = 'dept_hr';
  String _site = 'site_hq';
  String? _mgrUser;
  String? _mgrName;
  bool _saving = false;

  @override
  void dispose() {
    _name.dispose();
    _nameBn.dispose();
    _title.dispose();
    _phone.dispose();
    _email.dispose();
    _nid.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final l10n = context.l10n;
    if (_name.text.trim().length < 2) {
      AppToast.show(context, l10n.emErrName, tone: StatusTone.warning);
      return;
    }
    if (_title.text.trim().length < 2) {
      AppToast.show(context, l10n.emErrTitle, tone: StatusTone.warning);
      return;
    }
    if (_phone.text.trim().length < 8) {
      AppToast.show(context, l10n.emErrPhone, tone: StatusTone.warning);
      return;
    }
    final nid = _nid.text.replaceAll(RegExp(r'\D'), '');
    if (nid.isNotEmpty &&
        nid.length != 10 &&
        nid.length != 13 &&
        nid.length != 17) {
      AppToast.show(context, l10n.emErrNid, tone: StatusTone.warning);
      return;
    }
    setState(() => _saving = true);
    try {
      final rec = await ref.read(workforceRepositoryProvider).create({
        'fullName': _name.text.trim(),
        'fullNameBn': _nameBn.text.trim(),
        'title': _title.text.trim(),
        'phone': _phone.text.trim(),
        'email': _email.text.trim(),
        if (nid.isNotEmpty) 'nationalId': nid,
        'departmentId': _dept,
        'siteId': _site,
        if (_mgrUser != null) 'lineManagerUserId': _mgrUser,
      });
      ref.invalidate(staffListProvider);
      if (!mounted) return;
      context.go(AppRoutes.peopleDetail(rec.id));
    } on ApiException catch (e) {
      if (!mounted) return;
      AppToast.show(
        context,
        e.fieldErrors.values.firstOrNull ?? l10n.emErrFailed,
        tone: StatusTone.danger,
      );
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final bangla = context.isBangla;

    return Scaffold(
      appBar: AppBar(title: Text(l10n.emNew)),
      body: ListView(
        padding: const EdgeInsets.all(Space.lg),
        children: [
          Text(l10n.emNewIntro),
          const SizedBox(height: Space.md),
          AppTextField(label: l10n.emFieldName, controller: _name),
          const SizedBox(height: Space.sm),
          AppTextField(label: l10n.emFieldNameBn, controller: _nameBn),
          const SizedBox(height: Space.sm),
          AppTextField(label: l10n.emFieldTitle, controller: _title),
          const SizedBox(height: Space.sm),
          AppTextField(
            label: l10n.emFieldPhone,
            controller: _phone,
            keyboardType: TextInputType.phone,
          ),
          const SizedBox(height: Space.sm),
          AppTextField(
            label: l10n.emFieldEmail,
            controller: _email,
            keyboardType: TextInputType.emailAddress,
          ),
          const SizedBox(height: Space.sm),
          AppTextField(
            label: l10n.emFieldNid,
            controller: _nid,
            keyboardType: TextInputType.number,
          ),
          const SizedBox(height: Space.md),
          Text(l10n.emFieldDept),
          Wrap(
            spacing: Space.sm,
            children: [
              for (final d in const [
                ('dept_hr', 'HR', 'এইচআর'),
                ('dept_fin', 'Finance', 'অর্থ'),
                ('dept_plant', 'Plant', 'প্ল্যান্ট'),
                ('dept_hse', 'HSE', 'এইচএসই'),
                ('dept_sales', 'Sales', 'বিক্রয়'),
                ('dept_trans', 'Transport', 'পরিবহন'),
              ])
                ChoiceChip(
                  label: Text(bangla ? d.$3 : d.$2),
                  selected: _dept == d.$1,
                  onSelected: (_) => setState(() => _dept = d.$1),
                ),
            ],
          ),
          const SizedBox(height: Space.md),
          Text(l10n.emFieldSite),
          Wrap(
            spacing: Space.sm,
            children: [
              ChoiceChip(
                label: Text(bangla ? 'প্রধান কার্যালয়' : 'Head office'),
                selected: _site == 'site_hq',
                onSelected: (_) => setState(() => _site = 'site_hq'),
              ),
              ChoiceChip(
                label: Text(
                  bangla ? 'কেরানীগঞ্জ প্ল্যান্ট' : 'Keraniganj plant',
                ),
                selected: _site == 'site_plant',
                onSelected: (_) => setState(() => _site = 'site_plant'),
              ),
            ],
          ),
          const SizedBox(height: Space.md),
          ListTile(
            contentPadding: EdgeInsets.zero,
            title: Text(l10n.emFieldManager),
            subtitle: Text(_mgrName ?? l10n.emFieldManagerHint),
            onTap: () async {
              final p = await showPersonPicker(
                context,
                title: l10n.emFieldManager,
              );
              if (p == null) return;
              setState(() {
                _mgrUser = p.person.userId;
                _mgrName = p.person.display(bangla: bangla);
              });
            },
          ),
          const SizedBox(height: Space.lg),
          PrimaryButton(
            label: l10n.emNew,
            loading: _saving,
            onPressed: _saving ? null : _submit,
          ),
        ],
      ),
    );
  }
}
