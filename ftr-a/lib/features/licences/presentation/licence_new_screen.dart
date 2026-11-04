import 'dart:async';

import 'package:bogcl_oneops/app/l10n_ext.dart';
import 'package:bogcl_oneops/app/routes.dart';
import 'package:bogcl_oneops/core/network/api_error.dart';
import 'package:bogcl_oneops/core/theme/tokens.dart';
import 'package:bogcl_oneops/features/auth/presentation/session_controller.dart';
import 'package:bogcl_oneops/features/licences/data/licence_repository.dart';
import 'package:bogcl_oneops/features/licences/presentation/licence_providers.dart';
import 'package:bogcl_oneops/features/people/presentation/person_picker.dart';
import 'package:bogcl_oneops/shared/widgets/app_text_field.dart';
import 'package:bogcl_oneops/shared/widgets/buttons.dart';
import 'package:bogcl_oneops/shared/widgets/status_pill.dart';
import 'package:bogcl_oneops/shared/widgets/toast_and_sheets.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

class LicenceNewScreen extends ConsumerStatefulWidget {
  const LicenceNewScreen({super.key});

  @override
  ConsumerState<LicenceNewScreen> createState() => _LicenceNewScreenState();
}

class _LicenceNewScreenState extends ConsumerState<LicenceNewScreen> {
  final _title = TextEditingController();
  final _no = TextEditingController();
  final _fee = TextEditingController();
  String _typeId = 'lt_expl';
  String _siteId = 'site_plant';
  DateTime _expires = DateTime.now().add(const Duration(days: 180));
  String? _ownerId;
  String? _ownerName;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    final s = ref.read(sessionControllerProvider).value;
    final site = s?.profile.employee.site.id;
    if (site != null) _siteId = site;
    _ownerId = s?.profile.id;
    _ownerName = s?.profile.employee.fullName;
  }

  @override
  void dispose() {
    _title.dispose();
    _no.dispose();
    _fee.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final l10n = context.l10n;
    if (_title.text.trim().length < 3) {
      AppToast.show(context, l10n.cpErrTitle, tone: StatusTone.warning);
      return;
    }
    if (_no.text.trim().length < 2) {
      AppToast.show(context, l10n.cpErrNo, tone: StatusTone.warning);
      return;
    }
    setState(() => _saving = true);
    try {
      final rec = await ref.read(licenceRepositoryProvider).create({
        'title': _title.text.trim(),
        'licenceNo': _no.text.trim(),
        'typeId': _typeId,
        'siteId': _siteId,
        'ownerUserId': _ownerId,
        'expiresAt': _expires.toIso8601String(),
        'feeAmount': double.tryParse(_fee.text.replaceAll(',', '')) ?? 0,
      });
      ref.invalidate(licencesProvider);
      if (!mounted) return;
      context.go(AppRoutes.licenceDetail(rec.id));
    } on ApiException catch (e) {
      if (!mounted) return;
      AppToast.show(
        context,
        e.fieldErrors.values.firstOrNull ?? l10n.cpErrFailed,
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
    final types = ref.watch(licenceTypesProvider).asData?.value ?? [];

    return Scaffold(
      appBar: AppBar(title: Text(l10n.cpNew)),
      body: ListView(
        padding: const EdgeInsets.all(Space.lg),
        children: [
          Text(l10n.cpNewIntro),
          const SizedBox(height: Space.md),
          AppTextField(label: l10n.cpFieldTitle, controller: _title),
          const SizedBox(height: Space.md),
          AppTextField(label: l10n.cpFieldNo, controller: _no),
          const SizedBox(height: Space.md),
          Text(l10n.cpFieldKind),
          Wrap(
            spacing: Space.sm,
            children: [
              for (final t in types)
                ChoiceChip(
                  label: Text(t.display(bangla: bangla)),
                  selected: _typeId == t.id,
                  onSelected: (_) => setState(() => _typeId = t.id),
                ),
            ],
          ),
          const SizedBox(height: Space.md),
          Text(l10n.cpFieldSite),
          Wrap(
            spacing: Space.sm,
            children: [
              ChoiceChip(
                label: Text(l10n.cpSiteHq),
                selected: _siteId == 'site_hq',
                onSelected: (_) => setState(() => _siteId = 'site_hq'),
              ),
              ChoiceChip(
                label: Text(l10n.cpSitePlant),
                selected: _siteId == 'site_plant',
                onSelected: (_) => setState(() => _siteId = 'site_plant'),
              ),
            ],
          ),
          const SizedBox(height: Space.md),
          ListTile(
            contentPadding: EdgeInsets.zero,
            title: Text(l10n.cpFieldExpiry),
            subtitle: Text(
              '${_expires.year}-${_expires.month}-${_expires.day}',
            ),
            onTap: () async {
              final d = await showDatePicker(
                context: context,
                firstDate: DateTime.now().subtract(const Duration(days: 30)),
                lastDate: DateTime.now().add(const Duration(days: 2000)),
                initialDate: _expires,
              );
              if (d != null) setState(() => _expires = d);
            },
          ),
          AppTextField(
            label: l10n.cpFieldFee,
            controller: _fee,
            keyboardType: TextInputType.number,
          ),
          ListTile(
            contentPadding: EdgeInsets.zero,
            title: Text(l10n.cpFieldOwner),
            subtitle: Text(_ownerName ?? l10n.cpFieldOwnerMe),
            onTap: () async {
              final pick = await showPersonPicker(
                context,
                title: l10n.cpFieldOwner,
              );
              if (pick == null) return;
              setState(() {
                _ownerId = pick.person.userId;
                _ownerName = pick.person.display(bangla: bangla);
              });
            },
          ),
          const SizedBox(height: Space.lg),
          PrimaryButton(
            label: l10n.cpNew,
            onPressed: _saving ? null : () => unawaited(_submit()),
          ),
        ],
      ),
    );
  }
}
