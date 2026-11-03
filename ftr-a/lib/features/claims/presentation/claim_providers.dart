import 'package:bogcl_oneops/features/auth/presentation/session_controller.dart';
import 'package:bogcl_oneops/features/claims/data/claim_repository.dart';
import 'package:bogcl_oneops/features/claims/domain/claim_models.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'claim_providers.g.dart';

void _watchUser(Ref ref) =>
    ref.watch(sessionControllerProvider.select((s) => s.value?.profile.id));

@riverpod
Future<List<Claim>> claims(Ref ref, String scope) {
  _watchUser(ref);
  return ref.watch(claimRepositoryProvider).list(scope: scope);
}

@riverpod
Future<Claim> claimDetail(Ref ref, String id) {
  _watchUser(ref);
  return ref.watch(claimRepositoryProvider).detail(id);
}

@riverpod
Future<ClaimPolicyInfo> claimPolicy(Ref ref) {
  _watchUser(ref);
  return ref.watch(claimRepositoryProvider).policy();
}

@riverpod
Future<List<Advance>> advances(Ref ref, String scope) {
  _watchUser(ref);
  return ref.watch(claimRepositoryProvider).advances(scope: scope);
}
