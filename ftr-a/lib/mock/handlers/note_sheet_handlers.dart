import 'package:bogcl_oneops/mock/engines/note_sheet_engine.dart';
import 'package:bogcl_oneops/mock/engines/workflow_engine.dart';
import 'package:bogcl_oneops/mock/http.dart';
import 'package:bogcl_oneops/mock/router.dart';
import 'package:bogcl_oneops/mock/seed/org.dart';

const _statuses = {
  'DRAFT',
  'IN_REVIEW',
  'RETURNED',
  'APPROVED',
  'REJECTED',
  'WITHDRAWN',
};

Json _readable(HandlerContext ctx) {
  final s = ctx.store.get(Col.noteSheets, ctx.params['id']!);
  if (s == null || !NoteSheetEngine.canRead(ctx, s)) {
    throw notFound('Note-sheet');
  }
  return s;
}

Json _owned(HandlerContext ctx) {
  final s = _readable(ctx);
  if (s['initiatorUserId'] != ctx.requireAuth().user.str('id')) {
    throw forbidden('Only the author can do this');
  }
  return s;
}

Json _out(HandlerContext ctx, Json s, {bool detail = true}) =>
    NoteSheetEngine.wire(
      ctx.store,
      s,
      viewerUserId: ctx.requireAuth().user.str('id'),
      detail: detail,
    );

List<RouteDef> noteSheetRoutes() => [
  RouteDef('GET', '/note-sheets', (ctx) async {
    final a = ctx.requireAuth();
    final me = a.user.str('id');
    final view = ctx.query['view'] ?? 'mine';
    if (!const {'mine', 'to-sign', 'all'}.contains(view)) {
      throw validationError('view', 'Unknown view');
    }
    final status = ctx.query['status'];
    if (status != null && !_statuses.contains(status)) {
      throw validationError('status', 'Unknown status');
    }
    final items = ctx.store.all(Col.noteSheets).where((s) {
      if (status != null && s['status'] != status) return false;
      switch (view) {
        case 'mine':
          return s['initiatorUserId'] == me;
        case 'to-sign':
          final id = s.strOrNull('workflowInstanceId');
          final inst = id == null
              ? null
              : ctx.store.get(Col.workflowInstances, id);
          return s['status'] == 'IN_REVIEW' &&
              inst != null &&
              WorkflowEngine.actionableStep(ctx.store, inst, me) != null;
        default:
          return NoteSheetEngine.canRead(ctx, s);
      }
    }).toList();
    final sorted = sortBy(items, ctx.query['sort'], '-updatedAt');
    return paginate([
      for (final s in sorted) _out(ctx, s, detail: false),
    ], ctx.query);
  }, permission: ['note-sheets:read']),
  RouteDef('GET', '/note-sheets/route-preview', (ctx) async {
    final a = ctx.requireAuth();
    final raw = ctx.query['amount'];
    final amount = raw == null || raw.isEmpty ? 0 : num.tryParse(raw);
    if (amount == null || amount < 0) {
      throw validationError('amount', 'Enter a valid amount');
    }
    return ok({
      'signers': NoteSheetEngine.suggestedSigners(ctx.store, a, amount),
    });
  }, permission: ['note-sheets:create']),
  RouteDef('POST', '/note-sheets', (ctx) async {
    final a = ctx.requireAuth();
    final s = NoteSheetEngine.create(ctx.store, a, ctx.bodyObject());
    await ctx.store.commit();
    return ok(_out(ctx, s), status: 201);
  }, permission: ['note-sheets:create']),
  RouteDef('GET', '/note-sheets/:id', (ctx) async {
    return ok(_out(ctx, _readable(ctx)));
  }, permission: ['note-sheets:read']),
  RouteDef('PUT', '/note-sheets/:id', (ctx) async {
    final s = _owned(ctx);
    NoteSheetEngine.apply(ctx.store, s, ctx.bodyObject());
    await ctx.store.commit();
    return ok(_out(ctx, s));
  }, permission: ['note-sheets:create']),
  RouteDef('DELETE', '/note-sheets/:id', (ctx) async {
    final s = _owned(ctx);
    if (s['status'] != 'DRAFT') {
      throw invalidTransition('Only drafts can be deleted');
    }
    ctx.store.remove(Col.noteSheets, s.str('id'));
    await ctx.store.commit();
    return ok({'deleted': true});
  }, permission: ['note-sheets:create']),
  RouteDef('POST', '/note-sheets/:id/submit', (ctx) async {
    final a = ctx.requireAuth();
    final s = _owned(ctx);
    NoteSheetEngine.submit(ctx.store, a, s);
    await ctx.store.commit();
    return ok(_out(ctx, s));
  }, permission: ['note-sheets:submit']),
  RouteDef('POST', '/note-sheets/:id/paragraphs', (ctx) async {
    final a = ctx.requireAuth();
    final s = _readable(ctx);
    NoteSheetEngine.appendParagraph(ctx.store, a, s, ctx.bodyObject());
    await ctx.store.commit();
    return ok(_out(ctx, s), status: 201);
  }, permission: ['note-sheets:read']),
  RouteDef('POST', '/note-sheets/:id/sign', (ctx) async {
    final a = ctx.requireAuth();
    final s = _readable(ctx);
    NoteSheetEngine.sign(ctx.store, a, s, ctx.bodyObject());
    await ctx.store.commit();
    return ok(_out(ctx, s));
  }, permission: ['note-sheets:sign']),
];
