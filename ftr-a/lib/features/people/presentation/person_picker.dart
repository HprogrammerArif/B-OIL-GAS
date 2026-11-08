import 'dart:async';

import 'package:bogcl_oneops/app/l10n_ext.dart';
import 'package:bogcl_oneops/core/theme/tokens.dart';
import 'package:bogcl_oneops/features/people/data/people_repository.dart';
import 'package:bogcl_oneops/features/people/domain/person_pick.dart';
import 'package:bogcl_oneops/shared/widgets/enterprise_form_widgets.dart';
import 'package:bogcl_oneops/shared/widgets/layout_widgets.dart';
import 'package:bogcl_oneops/shared/widgets/state_views.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Search colleagues by name, title or department and pick one.
Future<PersonPick?> showPersonPicker(
  BuildContext context, {
  required String title,
}) => showModalBottomSheet<PersonPick>(
  context: context,
  isScrollControlled: true,
  showDragHandle: true,
  builder: (_) => _Picker(title: title),
);

class _Picker extends ConsumerStatefulWidget {
  const _Picker({required this.title});

  final String title;

  @override
  ConsumerState<_Picker> createState() => _PickerState();
}

class _PickerState extends ConsumerState<_Picker> {
  final _c = TextEditingController();
  Timer? _debounce;
  late Future<List<PersonPick>> _results = _load('');

  Future<List<PersonPick>> _load(String q) =>
      ref.read(peopleRepositoryProvider).search(q);

  @override
  void dispose() {
    _debounce?.cancel();
    _c.dispose();
    super.dispose();
  }

  void _onChanged(String q) {
    _debounce?.cancel();
    _debounce = Timer(const Duration(milliseconds: 250), () {
      if (mounted) setState(() => _results = _load(q.trim()));
    });
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final bangla = context.isBangla;
    final cs = Theme.of(context).colorScheme;
    return SizedBox(
      height: MediaQuery.sizeOf(context).height * 0.78,
      child: Padding(
        padding: EdgeInsets.only(
          bottom: MediaQuery.viewInsetsOf(context).bottom,
        ),
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: Space.lg),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  EnterpriseModalHeader(
                    title: widget.title,
                    subtitle: bangla
                        ? 'নাম, পদবি বা বিভাগ অনুযায়ী কর্মকর্তা অনুসন্ধান করুন'
                        : 'Search BOGCL directory by officer name, designation, or department',
                    icon: Icons.person_search_outlined,
                  ),
                  TextField(
                    controller: _c,
                    autofocus: true,
                    onChanged: _onChanged,
                    decoration: InputDecoration(
                      hintText: l10n.peopleSearchHint,
                      prefixIcon: const Icon(Icons.search),
                    ),
                  ),
                  const SizedBox(height: Space.sm),
                ],
              ),
            ),
            Expanded(
              child: FutureBuilder<List<PersonPick>>(
                future: _results,
                builder: (context, snap) {
                  if (snap.connectionState != ConnectionState.done) {
                    return const Center(child: CircularProgressIndicator());
                  }
                  if (snap.hasError) {
                    return ErrorState(
                      onRetry: () =>
                          setState(() => _results = _load(_c.text.trim())),
                    );
                  }
                  final rows = snap.data!;
                  if (rows.isEmpty) {
                    return EmptyState(
                      icon: Icons.person_search_outlined,
                      title: l10n.peopleNone,
                    );
                  }
                  return ListView.builder(
                    itemCount: rows.length,
                    itemBuilder: (_, i) {
                      final p = rows[i];
                      return ListRow(
                        leading: CircleAvatar(
                          backgroundColor: cs.primaryContainer,
                          child: Icon(
                            Icons.person_outline,
                            color: cs.onPrimaryContainer,
                          ),
                        ),
                        title: p.person.display(bangla: bangla),
                        subtitle: [
                          if (p.person.title != null) p.person.title!,
                          p.where(bangla: bangla),
                        ].join(' · '),
                        trailing: Icon(
                          Icons.check_circle_outline,
                          size: 18,
                          color: cs.primary,
                        ),
                        onTap: () => Navigator.of(context).pop(p),
                      );
                    },
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}
