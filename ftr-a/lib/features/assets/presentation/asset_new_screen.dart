import 'dart:async';

import 'package:bogcl_oneops/app/l10n_ext.dart';
import 'package:bogcl_oneops/app/routes.dart';
import 'package:bogcl_oneops/core/network/api_error.dart';
import 'package:bogcl_oneops/core/theme/tokens.dart';
import 'package:bogcl_oneops/features/assets/data/asset_repository.dart';
import 'package:bogcl_oneops/features/assets/presentation/asset_providers.dart';
import 'package:bogcl_oneops/features/auth/presentation/session_controller.dart';
import 'package:bogcl_oneops/features/people/presentation/person_picker.dart';
import 'package:bogcl_oneops/shared/widgets/app_text_field.dart';
import 'package:bogcl_oneops/shared/widgets/buttons.dart';
import 'package:bogcl_oneops/shared/widgets/status_pill.dart';
import 'package:bogcl_oneops/shared/widgets/toast_and_sheets.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

class AssetNewScreen extends ConsumerStatefulWidget {
  const AssetNewScreen({super.key});

  @override
  ConsumerState<AssetNewScreen> createState() => _AssetNewScreenState();
}

class _AssetNewScreenState extends ConsumerState<AssetNewScreen> {
  final _name = TextEditingController();
  final _cost = TextEditingController();
  final _life = TextEditingController(text: '8');
  final _location = TextEditingController();
  String _categoryId = 'cat_plant';
  String _siteId = 'site_plant';
  String _criticality = 'GENERAL_C';
  bool _commission = true;
  String? _custodianUserId;
  String? _custodianName;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    final site = ref
        .read(sessionControllerProvider)
        .value
        ?.profile
        .employee
        .site
        .id;
    if (site != null) _siteId = site;
  }

  @override
  void dispose() {
    _name.dispose();
    _cost.dispose();
    _life.dispose();
    _location.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final l10n = context.l10n;
    final cost = double.tryParse(_cost.text.replaceAll(',', '')) ?? 0;
    final life = int.tryParse(_life.text) ?? 0;
    if (_name.text.trim().length < 3) {
      AppToast.show(context, l10n.asErrName, tone: StatusTone.warning);
      return;
    }
    if (cost <= 0) {
      AppToast.show(context, l10n.asErrCost, tone: StatusTone.warning);
      return;
    }
    if (life < 1) {
      AppToast.show(context, l10n.asErrLife, tone: StatusTone.warning);
      return;
    }
    setState(() => _saving = true);
    try {
      final rec = await ref.read(assetRepositoryProvider).create({
        'name': _name.text.trim(),
        'categoryId': _categoryId,
        'siteId': _siteId,
        'purchaseCost': cost,
        'usefulLifeYears': life,
        'criticality': _criticality,
        'location': _location.text.trim().isEmpty
            ? null
            : _location.text.trim(),
        'commissionNow': _commission,
        'custodianUserId': ?_custodianUserId,
      });
      ref.invalidate(assetsProvider);
      if (!mounted) return;
      context.go(AppRoutes.assetDetail(rec.id));
    } on ApiException catch (e) {
      if (!mounted) return;
      AppToast.show(
        context,
        e.fieldErrors.values.firstOrNull ?? l10n.asErrFailed,
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
    final cats = ref.watch(assetCategoriesProvider).asData?.value ?? [];

    return Scaffold(
      appBar: AppBar(title: Text(l10n.asNew)),
      body: ListView(
        padding: const EdgeInsets.all(Space.lg),
        children: [
          Text(l10n.asNewIntro),
          const SizedBox(height: Space.md),
          AppTextField(label: l10n.asFieldName, controller: _name),
          const SizedBox(height: Space.md),
          Text(l10n.asFieldCategory),
          Wrap(
            spacing: Space.sm,
            children: [
              for (final c in cats)
                ChoiceChip(
                  label: Text(c.display(bangla: bangla)),
                  selected: _categoryId == c.id,
                  onSelected: (_) => setState(() => _categoryId = c.id),
                ),
            ],
          ),
          const SizedBox(height: Space.md),
          Text(l10n.asFieldSite),
          Wrap(
            spacing: Space.sm,
            children: [
              ChoiceChip(
                label: Text(l10n.asSiteHq),
                selected: _siteId == 'site_hq',
                onSelected: (_) => setState(() => _siteId = 'site_hq'),
              ),
              ChoiceChip(
                label: Text(l10n.asSitePlant),
                selected: _siteId == 'site_plant',
                onSelected: (_) => setState(() => _siteId = 'site_plant'),
              ),
              ChoiceChip(
                label: Text(l10n.asSiteCtg),
                selected: _siteId == 'site_ctg',
                onSelected: (_) => setState(() => _siteId = 'site_ctg'),
              ),
            ],
          ),
          const SizedBox(height: Space.md),
          AppTextField(
            label: l10n.asFieldCost,
            controller: _cost,
            keyboardType: TextInputType.number,
          ),
          const SizedBox(height: Space.md),
          AppTextField(
            label: l10n.asFieldLife,
            controller: _life,
            keyboardType: TextInputType.number,
          ),
          const SizedBox(height: Space.md),
          AppTextField(label: l10n.asFieldLocation, controller: _location),
          const SizedBox(height: Space.md),
          Text(l10n.asFieldCritical),
          Wrap(
            spacing: Space.sm,
            children: [
              ChoiceChip(
                label: Text(l10n.asCritC),
                selected: _criticality == 'GENERAL_C',
                onSelected: (_) => setState(() => _criticality = 'GENERAL_C'),
              ),
              ChoiceChip(
                label: Text(l10n.asCritB),
                selected: _criticality == 'ESSENTIAL_B',
                onSelected: (_) => setState(() => _criticality = 'ESSENTIAL_B'),
              ),
              ChoiceChip(
                label: Text(l10n.asCritA),
                selected: _criticality == 'CRITICAL_A',
                onSelected: (_) => setState(() => _criticality = 'CRITICAL_A'),
              ),
            ],
          ),
          SwitchListTile(
            contentPadding: EdgeInsets.zero,
            title: Text(l10n.asFieldCommission),
            value: _commission,
            onChanged: (v) => setState(() => _commission = v),
          ),
          ListTile(
            contentPadding: EdgeInsets.zero,
            title: Text(l10n.asFieldHolder),
            subtitle: Text(_custodianName ?? l10n.asFieldHolderNone),
            onTap: () async {
              final pick = await showPersonPicker(
                context,
                title: l10n.asFieldHolder,
              );
              if (pick == null) return;
              setState(() {
                _custodianUserId = pick.person.userId;
                _custodianName = pick.person.display(bangla: bangla);
              });
            },
          ),
          const SizedBox(height: Space.lg),
          PrimaryButton(
            label: l10n.asNew,
            onPressed: _saving ? null : () => unawaited(_submit()),
          ),
        ],
      ),
    );
  }
}
