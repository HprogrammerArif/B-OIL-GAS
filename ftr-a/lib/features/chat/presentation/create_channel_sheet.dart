import 'dart:async';

import 'package:bogcl_oneops/app/l10n_ext.dart';
import 'package:bogcl_oneops/core/network/api_error.dart';
import 'package:bogcl_oneops/core/theme/tokens.dart';
import 'package:bogcl_oneops/features/chat/data/chat_repository.dart';
import 'package:bogcl_oneops/features/chat/domain/chat_models.dart';
import 'package:bogcl_oneops/features/people/data/people_repository.dart';
import 'package:bogcl_oneops/features/people/domain/person_pick.dart';
import 'package:bogcl_oneops/shared/widgets/app_text_field.dart';
import 'package:bogcl_oneops/shared/widgets/buttons.dart';
import 'package:bogcl_oneops/shared/widgets/state_views.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Chairman names a room and picks who is in it (BR-15-18).
Future<ChatChannel?> showCreateChannelSheet(BuildContext context) {
  return showModalBottomSheet<ChatChannel>(
    context: context,
    isScrollControlled: true,
    showDragHandle: true,
    builder: (_) => const _CreateChannelSheet(),
  );
}

class _CreateChannelSheet extends ConsumerStatefulWidget {
  const _CreateChannelSheet();

  @override
  ConsumerState<_CreateChannelSheet> createState() =>
      _CreateChannelSheetState();
}

class _CreateChannelSheetState extends ConsumerState<_CreateChannelSheet> {
  final _name = TextEditingController();
  final _purpose = TextEditingController();
  final _search = TextEditingController();
  Timer? _debounce;
  late Future<List<PersonPick>> _people = _load('');
  final _selected = <String, PersonPick>{};
  String? _nameError;
  String? _membersError;
  bool _saving = false;

  Future<List<PersonPick>> _load(String q) =>
      ref.read(peopleRepositoryProvider).search(q);

  @override
  void dispose() {
    _debounce?.cancel();
    _name.dispose();
    _purpose.dispose();
    _search.dispose();
    super.dispose();
  }

  void _onSearch(String q) {
    _debounce?.cancel();
    _debounce = Timer(const Duration(milliseconds: 250), () {
      if (!mounted) return;
      setState(() => _people = _load(q.trim()));
    });
  }

  Future<void> _submit() async {
    final l10n = context.l10n;
    final name = _name.text.trim();
    setState(() {
      _nameError = name.length < 2 || name.length > 60
          ? l10n.chRoomNameErr
          : null;
      _membersError = _selected.isEmpty ? l10n.chRoomMembersErr : null;
    });
    if (_nameError != null || _membersError != null) return;
    setState(() => _saving = true);
    try {
      final ch = await ref
          .read(chatRepositoryProvider)
          .createChannel(
            name: name,
            description: _purpose.text.trim(),
            memberUserIds: _selected.keys.toList(),
          );
      if (!mounted) return;
      Navigator.pop(context, ch);
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() {
        _saving = false;
        _membersError = e.message;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final bangla = context.isBangla;
    final scheme = Theme.of(context).colorScheme;
    final inset = MediaQuery.viewInsetsOf(context).bottom;

    return Padding(
      padding: EdgeInsets.fromLTRB(Space.lg, 0, Space.lg, Space.lg + inset),
      child: SizedBox(
        height: MediaQuery.sizeOf(context).height * 0.78,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              l10n.chNewRoomTitle,
              style: Theme.of(context).textTheme.titleMedium
                  ?.copyWith(fontWeight: FontWeight.w800),
            ),
            const SizedBox(height: Space.xs),
            Text(
              l10n.chNewRoomHint,
              style: Theme.of(context).textTheme.bodySmall
                  ?.copyWith(color: scheme.onSurfaceVariant),
            ),
            const SizedBox(height: Space.md),
            AppTextField(
              controller: _name,
              label: l10n.chRoomName,
              required: true,
              maxLength: 60,
              errorText: _nameError,
              hint: l10n.chRoomNameHint,
            ),
            const SizedBox(height: Space.sm),
            AppTextField(
              controller: _purpose,
              label: l10n.chRoomPurpose,
              maxLength: 120,
              hint: l10n.chRoomPurposeHint,
            ),
            const SizedBox(height: Space.md),
            Text(
              l10n.chRoomLeaders,
              style: Theme.of(context).textTheme.labelLarge
                  ?.copyWith(fontWeight: FontWeight.w700),
            ),
            if (_membersError != null)
              Padding(
                padding: const EdgeInsets.only(top: 4),
                child: Text(
                  _membersError!,
                  style: TextStyle(color: scheme.error, fontSize: 12),
                ),
              ),
            const SizedBox(height: Space.xs),
            TextField(
              controller: _search,
              decoration: InputDecoration(
                hintText: l10n.chPeopleSearch,
                prefixIcon: const Icon(Icons.search, size: 20),
                isDense: true,
              ),
              onChanged: _onSearch,
            ),
            const SizedBox(height: Space.sm),
            Expanded(
              child: FutureBuilder<List<PersonPick>>(
                future: _people,
                builder: (context, snap) {
                  if (snap.hasError) {
                    return ErrorState(
                      onRetry: () =>
                          setState(() => _people = _load(_search.text)),
                    );
                  }
                  if (!snap.hasData) {
                    return const Center(child: CircularProgressIndicator());
                  }
                  final list = snap.data!;
                  if (list.isEmpty) {
                    return EmptyState(
                      title: l10n.chNoPeopleTitle,
                      message: l10n.chNoPeople,
                    );
                  }
                  return ListView.builder(
                    itemCount: list.length,
                    itemBuilder: (context, i) {
                      final p = list[i];
                      final id = p.person.userId;
                      final on = _selected.containsKey(id);
                      return CheckboxListTile(
                        value: on,
                        dense: true,
                        title: Text(p.person.display(bangla: bangla)),
                        subtitle: Text(p.where(bangla: bangla)),
                        onChanged: (v) {
                          setState(() {
                            if (v == true) {
                              _selected[id] = p;
                            } else {
                              _selected.remove(id);
                            }
                          });
                        },
                      );
                    },
                  );
                },
              ),
            ),
            const SizedBox(height: Space.md),
            PrimaryButton(
              label: l10n.chRoomOpen,
              loading: _saving,
              onPressed: _saving ? null : () => unawaited(_submit()),
            ),
          ],
        ),
      ),
    );
  }
}
