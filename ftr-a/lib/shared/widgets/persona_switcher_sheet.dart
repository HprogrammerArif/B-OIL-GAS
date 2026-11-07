import 'dart:async';

import 'package:bogcl_oneops/app/l10n_ext.dart';
import 'package:bogcl_oneops/app/language_switch.dart';
import 'package:bogcl_oneops/core/theme/tokens.dart';
import 'package:bogcl_oneops/core/utils/haptics.dart';
import 'package:bogcl_oneops/features/auth/presentation/session_controller.dart';
import 'package:bogcl_oneops/mock/bootstrap.dart';
import 'package:bogcl_oneops/mock/mock_config.dart';
import 'package:bogcl_oneops/shared/widgets/toast_and_sheets.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

/// 7 Canonical personas with roles, sites, and pitch highlights for BOGCL OneOps.
class CanonicalPersona {
  const CanonicalPersona({
    required this.code,
    required this.nameEn,
    required this.nameBn,
    required this.roleLabelEn,
    required this.roleLabelBn,
    required this.titleEn,
    required this.titleBn,
    required this.siteEn,
    required this.siteBn,
    required this.isPlantSite,
    required this.initials,
    required this.color,
    required this.pitchHighlightEn,
    required this.pitchHighlightBn,
  });

  final String code;
  final String nameEn;
  final String nameBn;
  final String roleLabelEn;
  final String roleLabelBn;
  final String titleEn;
  final String titleBn;
  final String siteEn;
  final String siteBn;
  final bool isPlantSite;
  final String initials;
  final Color color;
  final String pitchHighlightEn;
  final String pitchHighlightBn;
}

const canonicalPersonas = <CanonicalPersona>[
  CanonicalPersona(
    code: 'EMP-0001',
    nameEn: 'Ahmed Akbar Sobhan',
    nameBn: 'আহমেদ আকবর সোবহান',
    roleLabelEn: 'Chairman & MD',
    roleLabelBn: 'চেয়ারম্যান ও এমডি',
    titleEn: 'Chairman & Managing Director',
    titleBn: 'চেয়ারম্যান ও ব্যবস্থাপনা পরিচালক',
    siteEn: 'Head Office, Baridhara',
    siteBn: 'প্রধান কার্যালয়, বারিধারা',
    isPlantSite: false,
    initials: 'AAS',
    color: Color(0xFFA51C30),
    pitchHighlightEn: 'Approve high-value note-sheets, broadcast notices & send voice briefings',
    pitchHighlightBn:
        'উচ্চ-মূল্যের নোট-শিট অনুমোদন, নোটিশ সম্প্রচার ও ভয়েস ব্রিফিং',
  ),
  CanonicalPersona(
    code: 'EMP-0012',
    nameEn: 'Engr. Md. Harunur Rashid',
    nameBn: 'প্রকৌ. মোঃ হারুনুর রশীদ',
    roleLabelEn: 'Plant GM',
    roleLabelBn: 'প্ল্যান্ট জিএম',
    titleEn: 'GM (Plant Operations)',
    titleBn: 'জিএম (প্ল্যান্ট অপারেশনস)',
    siteEn: 'Keraniganj Refinery',
    siteBn: 'কেরানীগঞ্জ রিফাইনারি প্ল্যান্ট',
    isPlantSite: true,
    initials: 'MHR',
    color: Color(0xFF1E3A8A),
    pitchHighlightEn:
        'Release bitumen batches (BDS 1238), manage LOTO & refinery safety',
    pitchHighlightBn:
        'বিটুমিন ব্যাচ রিলিজ (বিডিএস ১২৩৮), লোতো পারমিট ও রিফাইনারি নিরাপত্তা',
  ),
  CanonicalPersona(
    code: 'EMP-0028',
    nameEn: 'Sayeda Afroza Sultana',
    nameBn: 'সৈয়দা আফরোজা সুলতানা',
    roleLabelEn: 'HR Admin',
    roleLabelBn: 'এইচআর অ্যাডমিন',
    titleEn: 'GM (HR & Administration)',
    titleBn: 'মহাব্যবস্থাপক (মানবসম্পদ ও প্রশাসন)',
    siteEn: 'Head Office, Baridhara',
    siteBn: 'প্রধান কার্যালয়, বারিধারা',
    isPlantSite: false,
    initials: 'SAS',
    color: Color(0xFF047857),
    pitchHighlightEn:
        'Onboard staff, manage 7-desk exit clearance & company attendance',
    pitchHighlightBn: 'কর্মী অনবোর্ডিং, ৭-দপ্তরের ছাড়পত্র ও সার্বিক উপস্থিতি',
  ),
  CanonicalPersona(
    code: 'EMP-0045',
    nameEn: 'Md. Kamruzzaman',
    nameBn: 'মোঃ কামরুজ্জামান',
    roleLabelEn: 'Transport Admin',
    roleLabelBn: 'পরিবহন সুপারভাইজার',
    titleEn: 'Transport & Logistics Supervisor',
    titleBn: 'পরিবহন ও লজিস্টিক্স সুপারভাইজার',
    siteEn: 'Keraniganj Refinery',
    siteBn: 'কেরানীগঞ্জ রিফাইনারি প্ল্যান্ট',
    isPlantSite: true,
    initials: 'MKZ',
    color: Color(0xFFD97706),
    pitchHighlightEn:
        'Dispatch pool cars, merge smart carpools & manage 10 shuttle buses',
    pitchHighlightBn:
        'গাড়ি রিকুইজিশন বরাদ্দ, স্মার্ট কারপুলিং ও ১০টি বাস পরিচালনা',
  ),
  CanonicalPersona(
    code: 'EMP-0062',
    nameEn: 'Farida Begum',
    nameBn: 'ফরিদা বেগম',
    roleLabelEn: 'HOD Finance',
    roleLabelBn: 'অর্থ ও হিসাব প্রধান',
    titleEn: 'Head of Finance & Approver',
    titleBn: 'বিভাগীয় প্রধান (অর্থ ও হিসাব)',
    siteEn: 'Head Office, Baridhara',
    siteBn: 'প্রধান কার্যালয়, বারিধারা',
    isPlantSite: false,
    initials: 'FB',
    color: Color(0xFF7C3AED),
    pitchHighlightEn:
        'Control quarterly budget ceiling, batch-approve & verify claims',
    pitchHighlightBn:
        'ত্রৈমাসিক বাজেট সিলিং নিয়ন্ত্রণ, একযোগে অনুমোদন ও দাবি যাচাই',
  ),
  CanonicalPersona(
    code: 'EMP-1042',
    nameEn: 'Tanvir Ahmed',
    nameBn: 'তানভীর আহমেদ',
    roleLabelEn: 'Employee (Sales)',
    roleLabelBn: 'কর্মকর্তা (বিক্রয়)',
    titleEn: 'Senior Sales Officer',
    titleBn: 'সিনিয়র সেলস অফিসার',
    siteEn: 'Head Office, Baridhara',
    siteBn: 'প্রধান কার্যালয়, বারিধারা',
    isPlantSite: false,
    initials: 'TA',
    color: Color(0xFF0284C7),
    pitchHighlightEn:
        'Punch in with GPS geofence, book cars/bus & submit expense claims',
    pitchHighlightBn: 'জিপিএস জিওফেন্সে উপস্থিতি, গাড়ি/বাস বুকিং ও বিল পেশ',
  ),
  CanonicalPersona(
    code: 'EMP-0821',
    nameEn: 'Md. Rafiqul Islam',
    nameBn: 'মোঃ রফিকুল ইসলাম',
    roleLabelEn: 'Company Driver',
    roleLabelBn: 'কোম্পানি চালক',
    titleEn: 'Senior Company Driver',
    titleBn: 'সিনিয়র কোম্পানি ড্রাইভার',
    siteEn: 'Head Office, Baridhara',
    siteBn: 'প্রধান কার্যালয়, বারিধারা',
    isPlantSite: false,
    initials: 'MRI',
    color: Color(0xFF475569),
    pitchHighlightEn:
        'Pre-trip vehicle readiness, odometer trip console & toll logging',
    pitchHighlightBn:
        'গাড়ির প্রস্তুতি পরীক্ষা, ওডোমিটার ট্রিপ কনসোল ও টোল স্লিপ',
  ),
];

CanonicalPersona? findCanonicalPersona(String? code) {
  if (code == null) return null;
  for (final p in canonicalPersonas) {
    if (p.code == code) return p;
  }
  return null;
}

/// 1-Tap Pitch Persona Switcher Bottom Sheet.
Future<void> showPersonaSwitcherSheet(BuildContext context) {
  return showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    showDragHandle: true,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(Corner.xl)),
    ),
    builder: (_) => const PersonaSwitcherSheet(),
  );
}

class PersonaSwitcherSheet extends ConsumerWidget {
  const PersonaSwitcherSheet({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final bangla = context.isBangla;
    final theme = Theme.of(context);
    final scheme = theme.colorScheme;
    final currentCode = ref
        .watch(sessionControllerProvider)
        .value
        ?.profile
        .employee
        .empCode;
    final config = ref.watch(mockConfigControllerProvider);
    final controller = ref.read(mockConfigControllerProvider.notifier);

    return DraggableScrollableSheet(
      expand: false,
      initialChildSize: 0.85,
      maxChildSize: 0.95,
      minChildSize: 0.5,
      builder: (context, scrollController) => Column(
        children: [
          // Header
          Padding(
            padding: const EdgeInsets.fromLTRB(
              Space.lg,
              Space.xs,
              Space.lg,
              Space.sm,
            ),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(Space.sm),
                  decoration: BoxDecoration(
                    color: scheme.primary.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(Corner.md),
                  ),
                  child: Icon(
                    Icons.badge_outlined,
                    color: scheme.primary,
                    size: 24,
                  ),
                ),
                const SizedBox(width: Space.md),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        bangla
                            ? 'উপস্থাপনা চরিত্র পরিবর্তন'
                            : 'Pitch Persona Switcher',
                        style: theme.textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      Text(
                        bangla
                            ? '৭টি মূল চরিত্রের ভূমিকা ও সাইটের দৃষ্টিকোণ'
                            : 'Select any of 7 canonical roles for live pitch',
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: scheme.onSurfaceVariant,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const Divider(height: 1),

          // Persona List
          Expanded(
            child: ListView.separated(
              controller: scrollController,
              padding: const EdgeInsets.symmetric(
                horizontal: Space.md,
                vertical: Space.sm,
              ),
              itemCount: canonicalPersonas.length,
              separatorBuilder: (_, _) => const SizedBox(height: Space.xs),
              itemBuilder: (context, index) {
                final p = canonicalPersonas[index];
                final isSelected = p.code == currentCode;
                return InkWell(
                  borderRadius: BorderRadius.circular(Corner.lg),
                  onTap: () async {
                    Haptics.tap();
                    final nav = Navigator.of(context);
                    final messenger = ScaffoldMessenger.of(context);
                    final label = bangla ? p.roleLabelBn : p.roleLabelEn;
                    final text = bangla
                        ? '$label হিসেবে সাইন ইন করা হয়েছে'
                        : 'Switched to $label';
                    await ref
                        .read(sessionControllerProvider.notifier)
                        .switchPersona(p.code);
                    if (context.mounted) {
                      nav.pop();
                      messenger.showSnackBar(
                        SnackBar(
                          content: Text(text),
                          behavior: SnackBarBehavior.floating,
                          duration: const Duration(seconds: 2),
                        ),
                      );
                    }
                  },
                  child: Container(
                    padding: const EdgeInsets.all(Space.sm),
                    decoration: BoxDecoration(
                      color: isSelected
                          ? scheme.primaryContainer.withValues(alpha: 0.35)
                          : scheme.surface,
                      borderRadius: BorderRadius.circular(Corner.lg),
                      border: Border.all(
                        color: isSelected
                            ? scheme.primary
                            : scheme.outlineVariant.withValues(alpha: 0.4),
                        width: isSelected ? 1.5 : 1,
                      ),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            CircleAvatar(
                              radius: 20,
                              backgroundColor: p.color,
                              child: Text(
                                p.initials,
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 13,
                                ),
                              ),
                            ),
                            const SizedBox(width: Space.md),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    children: [
                                      Flexible(
                                        child: Text(
                                          bangla
                                              ? p.roleLabelBn
                                              : p.roleLabelEn,
                                          style: theme.textTheme.titleSmall
                                              ?.copyWith(
                                                fontWeight: FontWeight.w700,
                                                color: isSelected
                                                    ? scheme.primary
                                                    : scheme.onSurface,
                                              ),
                                          maxLines: 1,
                                          overflow: TextOverflow.ellipsis,
                                        ),
                                      ),
                                      const SizedBox(width: Space.xs),
                                      Container(
                                        padding: const EdgeInsets.symmetric(
                                          horizontal: 6,
                                          vertical: 1.5,
                                        ),
                                        decoration: BoxDecoration(
                                          color: p.isPlantSite
                                              ? Colors.amber.withValues(
                                                  alpha: 0.18,
                                                )
                                              : Colors.teal.withValues(
                                                  alpha: 0.15,
                                                ),
                                          borderRadius: BorderRadius.circular(
                                            Corner.sm,
                                          ),
                                        ),
                                        child: Text(
                                          p.isPlantSite ? 'Plant' : 'HQ',
                                          style: TextStyle(
                                            fontSize: 10,
                                            fontWeight: FontWeight.w700,
                                            color: p.isPlantSite
                                                ? Colors.amber.shade900
                                                : Colors.teal.shade800,
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                  Text(
                                    '${bangla ? p.nameBn : p.nameEn} · ${p.code}',
                                    style: theme.textTheme.bodySmall?.copyWith(
                                      color: scheme.onSurfaceVariant,
                                    ),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ],
                              ),
                            ),
                            if (isSelected)
                              Icon(
                                Icons.check_circle,
                                color: scheme.primary,
                                size: 22,
                              )
                            else
                              Icon(
                                Icons.arrow_forward_ios,
                                size: 14,
                                color: scheme.onSurfaceVariant.withValues(
                                  alpha: 0.5,
                                ),
                              ),
                          ],
                        ),
                        const SizedBox(height: Space.xs),
                        Container(
                          width: double.infinity,
                          padding: const EdgeInsets.symmetric(
                            horizontal: Space.sm,
                            vertical: 3,
                          ),
                          decoration: BoxDecoration(
                            color: scheme.surfaceContainerHighest.withValues(
                              alpha: 0.4,
                            ),
                            borderRadius: BorderRadius.circular(Corner.sm),
                          ),
                          child: Text(
                            bangla ? p.pitchHighlightBn : p.pitchHighlightEn,
                            style: theme.textTheme.labelSmall?.copyWith(
                              color: scheme.onSurfaceVariant,
                              fontSize: 11,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
          ),

          // Bottom Demo Controls Strip
          Container(
            padding: const EdgeInsets.fromLTRB(
              Space.lg,
              Space.sm,
              Space.lg,
              Space.md,
            ),
            decoration: BoxDecoration(
              color: scheme.surfaceContainerLow,
              border: Border(top: BorderSide(color: scheme.outlineVariant)),
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Row(
                  children: [
                    // Language Switch
                    const Expanded(child: LanguageSwitch()),
                    const SizedBox(width: Space.md),
                    // Offline Simulator Chip
                    FilterChip(
                      avatar: Icon(
                        config.offline ? Icons.cloud_off : Icons.cloud_done,
                        size: 16,
                        color: config.offline ? Colors.red : Colors.green,
                      ),
                      label: Text(
                        config.offline
                            ? (bangla ? 'অফলাইন' : 'Offline')
                            : (bangla ? 'অনলাইন' : 'Online'),
                        style: const TextStyle(fontSize: 12),
                      ),
                      selected: config.offline,
                      onSelected: (v) {
                        Haptics.tap();
                        controller.setOffline(value: v);
                      },
                    ),
                  ],
                ),
                const SizedBox(height: Space.xs),
                SizedBox(
                  width: double.infinity,
                  child: TextButton.icon(
                    style: TextButton.styleFrom(
                      foregroundColor: scheme.error,
                      visualDensity: VisualDensity.compact,
                    ),
                    icon: const Icon(Icons.restart_alt, size: 18),
                    label: Text(
                      bangla
                          ? 'ডেমো ডেটা রিসেট করুন'
                          : 'Reset Demo Data to Initial State',
                      style: const TextStyle(fontSize: 12),
                    ),
                    onPressed: () async {
                      final confirmed = await showConfirmSheet(
                        context,
                        title: bangla
                            ? 'ডেমো ডেটা রিসেট করবেন?'
                            : 'Reset demo data?',
                        message: bangla
                            ? 'সমস্ত পরিবর্তন মুছে ফেলা হবে এবং প্রাথমিক অবস্থা ফিরে আসবে।'
                            : 'All changes are erased and default seed is restored.',
                        confirmLabel: bangla ? 'রিসেট' : 'Reset',
                        destructive: true,
                      );
                      if (!confirmed || !context.mounted) return;
                      final nav = Navigator.of(context);
                      final messenger = ScaffoldMessenger.of(context);
                      await ref.read(mockStoreProvider).reset();
                      await ref
                          .read(sessionControllerProvider.notifier)
                          .logout();
                      if (context.mounted) {
                        nav.pop();
                        messenger.showSnackBar(
                          SnackBar(
                            content: Text(
                              bangla
                                  ? 'ডেটা রিসেট হয়েছে'
                                  : 'Demo data reset successfully',
                            ),
                          ),
                        );
                      }
                    },
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

/// Compact Role Pill to display inside app bars and header strips.
class RolePill extends ConsumerWidget {
  const RolePill({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final session = ref.watch(sessionControllerProvider).value;
    final empCode = session?.profile.employee.empCode;
    final persona = findCanonicalPersona(empCode);
    final bangla = context.isBangla;
    final theme = Theme.of(context);
    final scheme = theme.colorScheme;

    final roleLabel = persona != null
        ? (bangla ? persona.roleLabelBn : persona.roleLabelEn)
        : (session?.profile.roles.firstOrNull?.name ?? 'BOGCL');
    final initials = persona?.initials ?? 'BO';
    final dotColor = persona?.isPlantSite == true
        ? Colors.amber.shade700
        : Colors.teal;

    return Semantics(
      button: true,
      label: 'Switch persona: $roleLabel',
      child: InkWell(
        borderRadius: BorderRadius.circular(Corner.xl),
        onTap: () => unawaited(showPersonaSwitcherSheet(context)),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
          decoration: BoxDecoration(
            color: scheme.surfaceContainerHighest.withValues(alpha: 0.55),
            borderRadius: BorderRadius.circular(Corner.xl),
            border: Border.all(
              color: scheme.outlineVariant.withValues(alpha: 0.6),
            ),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              CircleAvatar(
                radius: 10,
                backgroundColor: persona?.color ?? scheme.primary,
                child: Text(
                  initials,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 8.5,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
              const SizedBox(width: 5),
              ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 82),
                child: Text(
                  roleLabel,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: theme.textTheme.labelSmall?.copyWith(
                    fontWeight: FontWeight.w700,
                    fontSize: 11,
                  ),
                ),
              ),
              const SizedBox(width: 3),
              Container(
                width: 6,
                height: 6,
                decoration: BoxDecoration(
                  color: dotColor,
                  shape: BoxShape.circle,
                ),
              ),
              const Icon(Icons.arrow_drop_down, size: 16),
            ],
          ),
        ),
      ),
    );
  }
}
