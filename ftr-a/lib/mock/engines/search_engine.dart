import 'package:bogcl_oneops/mock/http.dart';
import 'package:bogcl_oneops/mock/seed/org.dart';
import 'package:bogcl_oneops/mock/store.dart';

/// Global search for people, notices and common refs (Home / More).
abstract final class SearchEngine {
  static List<Json> search(MockStore store, String raw) {
    final q = raw.trim().toLowerCase();
    if (q.length < 2) return const [];
    final out = <Json>[];

    void add({
      required String kind,
      required String title,
      required String titleBn,
      required String subtitle,
      required String route,
    }) {
      out.add({
        'kind': kind,
        'title': title,
        'titleBn': titleBn,
        'subtitle': subtitle,
        'route': route,
      });
    }

    for (final e in store.all(Col.employees)) {
      final name = e.str('fullName');
      final nameBn = e.strOrNull('fullNameBn') ?? name;
      final code = e.str('empCode');
      if (name.toLowerCase().contains(q) ||
          nameBn.toLowerCase().contains(q) ||
          code.toLowerCase().contains(q)) {
        add(
          kind: 'person',
          title: name,
          titleBn: nameBn,
          subtitle: code,
          route: '/home/people/${e['id']}',
        );
      }
    }

    for (final n in store.all(Col.notices)) {
      final title = n.strOrNull('title') ?? '';
      final titleBn = n.strOrNull('titleBn') ?? title;
      final ref = n.strOrNull('refNo') ?? '';
      if (title.toLowerCase().contains(q) ||
          titleBn.toLowerCase().contains(q) ||
          ref.toLowerCase().contains(q)) {
        add(
          kind: 'notice',
          title: title,
          titleBn: titleBn,
          subtitle: ref,
          route: '/home/notices/${n['id']}',
        );
      }
    }

    for (final l in store.all(Col.leaveRequests)) {
      final ref = l.strOrNull('refNo') ?? '';
      if (ref.toLowerCase().contains(q)) {
        add(
          kind: 'leave',
          title: ref,
          titleBn: ref,
          subtitle: l.strOrNull('status') ?? '',
          route: '/home/leave/${l['id']}',
        );
      }
    }
    for (final c in store.all(Col.claims)) {
      final ref = c.strOrNull('refNo') ?? '';
      if (ref.toLowerCase().contains(q)) {
        add(
          kind: 'claim',
          title: ref,
          titleBn: ref,
          subtitle: c.strOrNull('status') ?? '',
          route: '/home/claims/${c['id']}',
        );
      }
    }
    for (final i in store.all(Col.incidents)) {
      final ref = i.strOrNull('incidentNo') ?? '';
      if (ref.toLowerCase().contains(q) ||
          (i.strOrNull('title') ?? '').toLowerCase().contains(q)) {
        add(
          kind: 'incident',
          title: i.strOrNull('title') ?? ref,
          titleBn: i.strOrNull('title') ?? ref,
          subtitle: ref,
          route: '/home/incidents/${i['id']}',
        );
      }
    }
    for (final a in store.all(Col.assets)) {
      final tag = a.strOrNull('tag') ?? a.strOrNull('assetTag') ?? '';
      final name = a.strOrNull('name') ?? tag;
      if (tag.toLowerCase().contains(q) || name.toLowerCase().contains(q)) {
        add(
          kind: 'asset',
          title: name,
          titleBn: a.strOrNull('nameBn') ?? name,
          subtitle: tag,
          route: '/home/assets/${a['id']}',
        );
      }
    }
    for (final p in store.all(Col.parcels)) {
      final ref = p.strOrNull('refNo') ?? '';
      if (ref.toLowerCase().contains(q)) {
        add(
          kind: 'parcel',
          title: ref,
          titleBn: ref,
          subtitle: p.strOrNull('status') ?? '',
          route: '/home/parcels/${p['id']}',
        );
      }
    }
    for (final v in store.all(Col.visits)) {
      final pass = v.strOrNull('passNo') ?? '';
      if (pass.toLowerCase().contains(q)) {
        add(
          kind: 'visit',
          title: pass,
          titleBn: pass,
          subtitle: v.strOrNull('status') ?? '',
          route: '/home/visits/${v['id']}',
        );
      }
    }
    for (final r in store.all(Col.fleetRequisitions)) {
      final ref = r.strOrNull('refNo') ?? r.strOrNull('reqNo') ?? '';
      final dest = r.strOrNull('destination') ?? '';
      if (ref.toLowerCase().contains(q) || dest.toLowerCase().contains(q)) {
        add(
          kind: 'fleet',
          title: dest.isEmpty ? ref : dest,
          titleBn: dest.isEmpty ? ref : dest,
          subtitle: ref,
          route: '/home/fleet/${r['id']}',
        );
      }
    }
    for (final r in store.all(Col.busRoutes)) {
      final code = r.strOrNull('code') ?? '';
      final name = r.strOrNull('name') ?? code;
      if (code.toLowerCase().contains(q) || name.toLowerCase().contains(q)) {
        add(
          kind: 'bus',
          title: name,
          titleBn: r.strOrNull('nameBn') ?? name,
          subtitle: code,
          route: '/home/bus/routes/${r['id']}',
        );
      }
    }
    for (final l in store.all(Col.compliance)) {
      final title = l.strOrNull('title') ?? '';
      final no = l.strOrNull('licenceNo') ?? '';
      if (title.toLowerCase().contains(q) || no.toLowerCase().contains(q)) {
        add(
          kind: 'licence',
          title: title,
          titleBn: l.strOrNull('titleBn') ?? title,
          subtitle: no,
          route: '/home/licences/${l['id']}',
        );
      }
    }
    for (final s in store.all(Col.noteSheets)) {
      final ref = s.strOrNull('fileNo') ?? s.strOrNull('refNo') ?? '';
      if (ref.toLowerCase().contains(q) ||
          (s.strOrNull('subject') ?? '').toLowerCase().contains(q)) {
        add(
          kind: 'notesheet',
          title: s.strOrNull('subject') ?? ref,
          titleBn: s.strOrNull('subjectBn') ?? s.strOrNull('subject') ?? ref,
          subtitle: ref,
          route: '/home/note-sheets/${s['id']}',
        );
      }
    }

    return out.take(30).toList();
  }
}
