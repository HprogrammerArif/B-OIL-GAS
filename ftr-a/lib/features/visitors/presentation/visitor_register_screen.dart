import 'package:bogcl_oneops/app/l10n_ext.dart';
import 'package:bogcl_oneops/core/theme/tokens.dart';
import 'package:bogcl_oneops/features/visitors/data/visitor_repository.dart';
import 'package:bogcl_oneops/features/visitors/presentation/visitor_providers.dart';
import 'package:bogcl_oneops/shared/widgets/app_text_field.dart';
import 'package:bogcl_oneops/shared/widgets/buttons.dart';
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

class _VisitorRegisterScreenState
    extends ConsumerState<VisitorRegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  final _name = TextEditingController();
  final _org = TextEditingController();
  final _designation = TextEditingController();
  final _purpose = TextEditingController();
  final _phone = TextEditingController();
  final _vehicle = TextEditingController();

  String _category = 'REGULAR';
  String _expectedDate = '';
  String _expectedTime = '';
  bool _vipProtocol = false;
  bool _loading = false;

  @override
  void initState() {
    super.initState();
    final now = DateTime.now();
    _expectedDate =
        '${now.year}-${now.month.toString().padLeft(2, '0')}-${now.day.toString().padLeft(2, '0')}';
    _expectedTime = '10:00';
  }

  @override
  void dispose() {
    _name.dispose();
    _org.dispose();
    _designation.dispose();
    _purpose.dispose();
    _phone.dispose();
    _vehicle.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _loading = true);
    try {
      await ref.read(visitorRepositoryProvider).create({
        'name': _name.text.trim(),
        'organization': _org.text.trim(),
        'designation': _designation.text.trim(),
        'category': _category,
        'purpose': _purpose.text.trim(),
        'expectedDate': _expectedDate,
        'expectedTime': _expectedTime,
        'phone': _phone.text.trim().isEmpty ? null : _phone.text.trim(),
        'vehiclePlate':
            _vehicle.text.trim().isEmpty ? null : _vehicle.text.trim(),
        'vipProtocol': _vipProtocol,
        'permittedZones': <Object?>[],
      });
      if (mounted) {
        ref.invalidate(visitorsProvider());
        showAppToast(
          context,
          context.l10n.visRegistered,
          tone: ToastTone.success,
        );
        context.pop();
      }
    } catch (e) {
      if (mounted) showAppToast(context, e.toString(), tone: ToastTone.error);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    return Scaffold(
      appBar: AppBar(title: Text(l10n.visNewTitle)),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(Space.lg),
          children: [
            Text(
              l10n.visFormIntro,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: Theme.of(context).colorScheme.onSurfaceVariant,
                  ),
            ),
            const SizedBox(height: Space.lg),
            AppTextField(
              controller: _name,
              label: l10n.visName,
              required: true,
              validator: (v) =>
                  v == null || v.trim().isEmpty ? l10n.fieldRequired : null,
            ),
            const SizedBox(height: Space.md),
            AppTextField(
              controller: _org,
              label: l10n.visOrganization,
            ),
            const SizedBox(height: Space.md),
            AppTextField(
              controller: _designation,
              label: l10n.visDesignation,
            ),
            const SizedBox(height: Space.md),
            DropdownButtonFormField<String>(
              value: _category,
              decoration: InputDecoration(labelText: l10n.visCategory),
              items: [
                DropdownMenuItem(value: 'REGULAR', child: Text(l10n.visRegular)),
                DropdownMenuItem(value: 'VENDOR', child: Text(l10n.visVendor)),
                DropdownMenuItem(value: 'CLIENT', child: Text(l10n.visClient)),
                DropdownMenuItem(value: 'GOVT', child: Text(l10n.visGovt)),
                DropdownMenuItem(value: 'VIP', child: Text(l10n.visVip)),
              ],
              onChanged: (v) => setState(() => _category = v ?? _category),
            ),
            const SizedBox(height: Space.md),
            AppTextField(
              controller: _purpose,
              label: l10n.visPurpose,
              maxLines: 2,
              required: true,
              validator: (v) =>
                  v == null || v.trim().isEmpty ? l10n.fieldRequired : null,
            ),
            const SizedBox(height: Space.md),
            Row(
              children: [
                Expanded(
                  child: AppTextField(
                    initialValue: _expectedDate,
                    label: l10n.visExpectedDate,
                    onChanged: (v) => _expectedDate = v,
                  ),
                ),
                const SizedBox(width: Space.sm),
                Expanded(
                  child: AppTextField(
                    initialValue: _expectedTime,
                    label: l10n.visExpectedTime,
                    onChanged: (v) => _expectedTime = v,
                  ),
                ),
              ],
            ),
            const SizedBox(height: Space.md),
            AppTextField(
              controller: _phone,
              label: l10n.visPhone,
              keyboardType: TextInputType.phone,
            ),
            const SizedBox(height: Space.md),
            AppTextField(
              controller: _vehicle,
              label: l10n.visVehicle,
            ),
            if (_category == 'VIP' || _category == 'GOVT') ...[
              const SizedBox(height: Space.md),
              SwitchListTile(
                value: _vipProtocol,
                onChanged: (v) => setState(() => _vipProtocol = v),
                title: Text(l10n.visVipProtocol),
                contentPadding: EdgeInsets.zero,
              ),
            ],
            const SizedBox(height: Space.xl),
            PrimaryButton(
              onPressed: _submit,
              loading: _loading,
              label: l10n.visRegister,
            ),
          ],
        ),
      ),
    );
  }
}
