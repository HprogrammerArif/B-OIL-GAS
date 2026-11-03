// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'attendance_providers.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint, type=warning

@ProviderFor(todayAttendance)
final todayAttendanceProvider = TodayAttendanceProvider._();

final class TodayAttendanceProvider
    extends
        $FunctionalProvider<
          AsyncValue<TodayAttendance>,
          TodayAttendance,
          FutureOr<TodayAttendance>
        >
    with $FutureModifier<TodayAttendance>, $FutureProvider<TodayAttendance> {
  TodayAttendanceProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'todayAttendanceProvider',
        isAutoDispose: true,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$todayAttendanceHash();

  @$internal
  @override
  $FutureProviderElement<TodayAttendance> $createElement(
    $ProviderPointer pointer,
  ) => $FutureProviderElement(pointer);

  @override
  FutureOr<TodayAttendance> create(Ref ref) {
    return todayAttendance(ref);
  }
}

String _$todayAttendanceHash() => r'bcc88c6a2dfdb8a6303119578e58c3dce001b9f9';

/// [month] is `YYYY-MM`; the range is clipped to today by the server.

@ProviderFor(attendanceMonth)
final attendanceMonthProvider = AttendanceMonthFamily._();

/// [month] is `YYYY-MM`; the range is clipped to today by the server.

final class AttendanceMonthProvider
    extends
        $FunctionalProvider<
          AsyncValue<AttendanceRange>,
          AttendanceRange,
          FutureOr<AttendanceRange>
        >
    with $FutureModifier<AttendanceRange>, $FutureProvider<AttendanceRange> {
  /// [month] is `YYYY-MM`; the range is clipped to today by the server.
  AttendanceMonthProvider._({
    required AttendanceMonthFamily super.from,
    required String super.argument,
  }) : super(
         retry: null,
         name: r'attendanceMonthProvider',
         isAutoDispose: true,
         dependencies: null,
         $allTransitiveDependencies: null,
       );

  @override
  String debugGetCreateSourceHash() => _$attendanceMonthHash();

  @override
  String toString() {
    return r'attendanceMonthProvider'
        ''
        '($argument)';
  }

  @$internal
  @override
  $FutureProviderElement<AttendanceRange> $createElement(
    $ProviderPointer pointer,
  ) => $FutureProviderElement(pointer);

  @override
  FutureOr<AttendanceRange> create(Ref ref) {
    final argument = this.argument as String;
    return attendanceMonth(ref, argument);
  }

  @override
  bool operator ==(Object other) {
    return other is AttendanceMonthProvider && other.argument == argument;
  }

  @override
  int get hashCode {
    return argument.hashCode;
  }
}

String _$attendanceMonthHash() => r'aaaf836fa3b3387aaa54eff14681221d9bfba8bf';

/// [month] is `YYYY-MM`; the range is clipped to today by the server.

final class AttendanceMonthFamily extends $Family
    with $FunctionalFamilyOverride<FutureOr<AttendanceRange>, String> {
  AttendanceMonthFamily._()
    : super(
        retry: null,
        name: r'attendanceMonthProvider',
        dependencies: null,
        $allTransitiveDependencies: null,
        isAutoDispose: true,
      );

  /// [month] is `YYYY-MM`; the range is clipped to today by the server.

  AttendanceMonthProvider call(String month) =>
      AttendanceMonthProvider._(argument: month, from: this);

  @override
  String toString() => r'attendanceMonthProvider';
}

@ProviderFor(myRegularisations)
final myRegularisationsProvider = MyRegularisationsProvider._();

final class MyRegularisationsProvider
    extends
        $FunctionalProvider<
          AsyncValue<List<Regularisation>>,
          List<Regularisation>,
          FutureOr<List<Regularisation>>
        >
    with
        $FutureModifier<List<Regularisation>>,
        $FutureProvider<List<Regularisation>> {
  MyRegularisationsProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'myRegularisationsProvider',
        isAutoDispose: true,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$myRegularisationsHash();

  @$internal
  @override
  $FutureProviderElement<List<Regularisation>> $createElement(
    $ProviderPointer pointer,
  ) => $FutureProviderElement(pointer);

  @override
  FutureOr<List<Regularisation>> create(Ref ref) {
    return myRegularisations(ref);
  }
}

String _$myRegularisationsHash() => r'64142d30acf2d3c5fb139bd4db8c2cd983324072';
