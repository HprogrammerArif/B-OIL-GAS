import 'dart:async';

import 'package:bogcl_oneops/app/l10n_ext.dart';
import 'package:bogcl_oneops/core/theme/tokens.dart';
import 'package:bogcl_oneops/features/fleet/data/fleet_repository.dart';
import 'package:bogcl_oneops/shared/widgets/buttons.dart';
import 'package:bogcl_oneops/shared/widgets/state_views.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

Future<void> showTripChat(BuildContext context, String requisitionId) {
  return showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    showDragHandle: true,
    builder: (_) => _TripChatSheet(requisitionId: requisitionId),
  );
}

class _TripChatSheet extends ConsumerStatefulWidget {
  const _TripChatSheet({required this.requisitionId});

  final String requisitionId;

  @override
  ConsumerState<_TripChatSheet> createState() => _TripChatSheetState();
}

class _TripChatSheetState extends ConsumerState<_TripChatSheet> {
  final _text = TextEditingController();
  List<Map<String, Object?>> _msgs = const [];
  bool _busy = true;

  @override
  void initState() {
    super.initState();
    unawaited(_load());
  }

  @override
  void dispose() {
    _text.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    final chat = await ref
        .read(fleetRepositoryProvider)
        .tripChat(widget.requisitionId);
    if (!mounted) return;
    setState(() {
      _msgs = chat.messages;
      _busy = false;
    });
  }

  Future<void> _send() async {
    final body = _text.text.trim();
    if (body.isEmpty) return;
    await ref
        .read(fleetRepositoryProvider)
        .sendTripChat(widget.requisitionId, body);
    _text.clear();
    await _load();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    return Padding(
      padding: EdgeInsets.fromLTRB(
        Space.lg,
        0,
        Space.lg,
        MediaQuery.viewInsetsOf(context).bottom + Space.lg,
      ),
      child: SizedBox(
        height: MediaQuery.sizeOf(context).height * 0.6,
        child: Column(
          children: [
            Text(l10n.flChat, style: Theme.of(context).textTheme.titleLarge),
            Expanded(
              child: _busy
                  ? const SkeletonList()
                  : _msgs.isEmpty
                  ? EmptyState(title: l10n.flChatEmpty)
                  : ListView(
                      children: [
                        for (final m in _msgs)
                          ListTile(
                            title: Text('${m['body'] ?? ''}'),
                            subtitle: Text(
                              '${(m['sender'] as Map?)?['name'] ?? ''}',
                            ),
                          ),
                      ],
                    ),
            ),
            Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _text,
                    decoration: InputDecoration(hintText: l10n.flChatHint),
                  ),
                ),
                IconButton(onPressed: _send, icon: const Icon(Icons.send)),
              ],
            ),
            PrimaryButton.secondary(
              label: l10n.commonClose,
              onPressed: () => Navigator.pop(context),
            ),
          ],
        ),
      ),
    );
  }
}
