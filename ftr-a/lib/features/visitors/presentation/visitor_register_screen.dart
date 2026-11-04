import 'dart:async';

import 'package:bogcl_oneops/app/l10n_ext.dart';
import 'package:bogcl_oneops/app/routes.dart';
import 'package:bogcl_oneops/core/network/api_error.dart';
import 'package:bogcl_oneops/core/theme/tokens.dart';
import 'package:bogcl_oneops/features/auth/presentation/session_controller.dart';
import 'package:bogcl_oneops/features/visitors/data/visitor_repository.dart';
import 'package:bogcl_oneops/features/visitors/presentation/visitor_providers.dart';
import 'package:bogcl_oneops/features/visitors/presentation/visitor_ui.dart';
import 'package:bogcl_oneops/shared/widgets/app_text_field.dart';
import 'package:bogcl_oneops/shared/widgets/buttons.dart';
import 'package:bogcl_oneops/shared/widgets/status_pill.dart';
import 'package:bogcl_oneops/shared/widgets/toast_and_sheets.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

class VisitorRegisterScreen extends ConsumerStatefulWidget {
  const VisitorRegisterScreen({super.key});

  @override
  ConsumerState<VisitorRegisterScreen> createState() =>
      _VisitorRegisterScreenState();
}

class _VisitorRegisterScreenState extends ConsumerState<VisitorRegisterScreen> {
  final _name = TextEditingController();
  final _org = TextEditingController();
  final _phone = TextEditingController();
  final _purpose = TextEditingController();
  final _idNo = TextEditingController();
  final _plate = TextEditingController();
  String _category = 'REGULAR';
  String _siteId = 'site_hq';
  String _idType = 'NID';
  late DateTime _when = DateTime.now().add(const Duration(hours: 2));
  final Set<String> _zones = {};
  Map<String, String> _errors = {};
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
    _org.dispose();
    _phone.dispose();
    _purpose.dispose();
    _idNo.dispose();
    _plate.dispose();
    super.dispose();
  }

  bool get _idNeeded => const {'VIP', 'GOVT', 'CONTRACTOR'}.contains(_category);

  Future<void> _pickWhen() async {
    final d = await showDatePicker(
      context: context,
      firstDate: DateTime.now().subtract(const Duration(days: 1)),
      lastDate: DateTime.now().add(const Duration(days: 14)),
      initialDate: _when,
    );
    if (d == null || !mounted) return;
    final t = await showTimePicker(
      context: context,
      initialTime: TimeOfDay.fromDateTime(_when),
    );
    if (t == null || !mounted) return;
    setState(() {
      _when = DateTime(d.year, d.month, d.day, t.hour, t.minute);
    });
  }

  Future<void> _save() async {
    final l10n = context.l10n;
    final errors = <String, String>{};
    if (_name.text.trim().length < 2) errors['fullName'] = l10n.visErrName;
    if (_phone.text.trim().length < 8) errors['phone'] = l10n.visErrPhone;
    if (_purpose.text.trim().length < 5) errors['purpose'] = l10n.visErrPurpose;
    if (_idNeeded && _idNo.text.trim().length < 4) {
      errors['idProofNo'] = l10n.visErrId;
    }
    if (errors.isNotEmpty) {
      setState(() => _errors = errors);
      return;
    }
    setState(() {
      _errors = {};
      _saving = true;
    });
    try {
      final saved = await ref.read(visitorRepositoryProvider).create({
        'fullName': _name.text.trim(),
        'organisation': _org.text.trim().isEmpty ? null : _org.text.trim(),
        'phone': _phone.text.trim(),
        'category': _category,
        if (_category == 'VIP') 'vipTier': 'VIP',
        'purpose': _purpose.text.trim(),
        'expectedAt': _when.toUtc().toIso8601String(),
        'siteId': _siteId,
        'zones': [
          for (final z in _zones) {'id': z},
        ],
        if (_idNeeded) 'idProofType': _idType,
        if (_idNeeded) 'idProofNo': _idNo.text.trim(),
        if (_plate.text.trim().isNotEmpty) 'vehiclePlate': _plate.text.trim(),
      });
      ref.invalidate(visitsProvider);
      if (!mounted) return;
      AppToast.show(context, l10n.visDoneCreate, tone: StatusTone.success);
      context.pushReplacement(AppRoutes.visitDetail(saved.id));
    } on ApiException catch (e) {
      if (!mounted) return;
      if (e.fieldErrors.isNotEmpty) {
        setState(() => _errors = e.fieldErrors);
      } else {
        AppToast.show(
          context,
          e.rule == 'VISITOR_BLACKLISTED'
              ? l10n.visErrBlacklist
              : l10n.visErrFailed,
          tone: StatusTone.danger,
        );
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final theme = Theme.of(context);
    final bangla = context.isBangla;
    final zones = ref.watch(visitZonesProvider(_siteId));
    return Scaffold(
      appBar: AppBar(title: Text(l10n.visNew)),
      body: ListView(
        padding: const EdgeInsets.all(Space.lg),
        children: [
          Text(
            l10n.visFormIntro,
            style: theme.textTheme.bodyMedium?.copyWith(
              color: theme.colorScheme.onSurfaceVariant,
            ),
          ),
          const SizedBox(height: Space.lg),
          AppTextField(
            label: l10n.visFieldName,
            controller: _name,
            errorText: _errors['fullName'],
          ),
          const SizedBox(height: Space.md),
          AppTextField(label: l10n.visFieldOrg, controller: _org),
          const SizedBox(height: Space.md),
          AppTextField(
            label: l10n.visFieldPhone,
            controller: _phone,
            keyboardType: TextInputType.phone,
            errorText: _errors['phone'],
          ),
          const SizedBox(height: Space.md),
          DropdownButtonFormField<String>(
            initialValue: _category,
            decoration: InputDecoration(labelText: l10n.visFieldCategory),
            items: [
              for (final c in visitCategories)
                DropdownMenuItem(
                  value: c,
                  child: Text(visitCategoryLabel(l10n, c)),
                ),
            ],
            onChanged: (v) => setState(() => _category = v ?? _category),
          ),
          const SizedBox(height: Space.md),
          AppTextField(
            label: l10n.visFieldPurpose,
            controller: _purpose,
            maxLines: 3,
            errorText: _errors['purpose'],
          ),
          const SizedBox(height: Space.md),
          ListTile(
            contentPadding: EdgeInsets.zero,
            title: Text(l10n.visFieldWhen),
            subtitle: Text(_when.toLocal().toString().substring(0, 16)),
            trailing: const Icon(Icons.event),
            onTap: () => unawaited(_pickWhen()),
          ),
          DropdownButtonFormField<String>(
            initialValue: _siteId,
            decoration: InputDecoration(labelText: l10n.visFieldSite),
            items: [
              DropdownMenuItem(value: 'site_hq', child: Text(l10n.visSiteHq)),
              DropdownMenuItem(
                value: 'site_plant',
                child: Text(l10n.visSitePlant),
              ),
              DropdownMenuItem(value: 'site_ctg', child: Text(l10n.visSiteCtg)),
            ],
            onChanged: (v) => setState(() {
              _siteId = v ?? _siteId;
              _zones.clear();
            }),
          ),
          const SizedBox(height: Space.md),
          Text(l10n.visFieldZones, style: theme.textTheme.labelLarge),
          zones.when(
            loading: () => const LinearProgressIndicator(),
            error: (_, _) => Text(l10n.commonErrorMessage),
            data: (list) => Wrap(
              spacing: Space.sm,
              children: [
                for (final z in list)
                  FilterChip(
                    label: Text(z.label(bangla: bangla)),
                    selected: _zones.contains(z.id),
                    onSelected: (on) => setState(
                      () => on ? _zones.add(z.id) : _zones.remove(z.id),
                    ),
                  ),
              ],
            ),
          ),
          if (_idNeeded) ...[
            const SizedBox(height: Space.md),
            DropdownButtonFormField<String>(
              initialValue: _idType,
              decoration: InputDecoration(labelText: l10n.visFieldIdType),
              items: [
                DropdownMenuItem(value: 'NID', child: Text(l10n.visIdNid)),
                DropdownMenuItem(
                  value: 'PASSPORT',
                  child: Text(l10n.visIdPass),
                ),
                DropdownMenuItem(
                  value: 'GOVT_BADGE',
                  child: Text(l10n.visIdGovt),
                ),
                DropdownMenuItem(
                  value: 'COMPANY_ID',
                  child: Text(l10n.visIdCo),
                ),
              ],
              onChanged: (v) => setState(() => _idType = v ?? _idType),
            ),
            const SizedBox(height: Space.md),
            AppTextField(
              label: l10n.visFieldIdNo,
              controller: _idNo,
              errorText: _errors['idProofNo'],
            ),
          ],
          const SizedBox(height: Space.md),
          AppTextField(label: l10n.visFieldPlate, controller: _plate),
          const SizedBox(height: Space.lg),
          PrimaryButton(
            label: l10n.visCreate,
            loading: _saving,
            onPressed: () => unawaited(_save()),
          ),
        ],
      ),
    );
  }
}
