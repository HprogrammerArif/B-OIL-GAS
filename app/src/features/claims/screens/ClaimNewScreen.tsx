import { useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Button, Card, Chip, DateField, ListRow, QueryState, Screen, SectionHeader, Segmented, Text, TextField } from "@/components/ui";
import { Spacing } from "@/constants/theme";
import { useFormat } from "@/hooks/useLanguage";
import { useIsOnline } from "@/hooks/useIsOnline";
import { addDays, dateKey } from "@/lib/calendar";
import { toApiError } from "@/lib/api-error";
import { newIdempotencyKey } from "@/lib/device";
import { routes } from "@/lib/routes";
import { toast } from "@/lib/toast";
import type { ClaimComputation, ClaimDetail, ClaimType, CreateClaimRequest, TravelMode } from "@/types/domain/claims";
import { useComputeClaimMutation, useCreateClaimMutation, useGetClaimPolicyQuery, useGetClaimQuery, useResubmitClaimMutation } from "../api";
import { FlagList } from "../components/FlagList";
import { LineSheet, newDraftLine, type DraftLine } from "../components/LineSheet";
import { LINE_CATEGORIES } from "../presentation";

const TYPES: ClaimType[] = ["CONVEYANCE", "TADA"];

function toDrafts(claim: ClaimDetail): DraftLine[] {
  return claim.lines
    .filter((l) => l.category !== "DA")
    .map((l) => ({
      ...newDraftLine(l.date, l.category),
      description: l.description, amount: String(Number(l.amount)), distanceKm: l.distanceKm ? String(l.distanceKm) : "",
      fromPlace: l.fromPlace ?? "", toPlace: l.toPlace ?? "", isDeclaration: l.isDeclaration, receiptFileId: l.receiptFileId,
    }));
}

/** File a claim (or fix and resubmit a returned one). Totals and policy flags come from a live server dry-run. */
export function ClaimNewScreen() {
  const { from } = useLocalSearchParams<{ from?: string }>();
  const { t } = useTranslation(["claims", "common", "errors"]);
  const router = useRouter();
  const fmt = useFormat();
  const online = useIsOnline();
  const today = dateKey();
  const policy = useGetClaimPolicyQuery();
  const source = useGetClaimQuery(from ?? "", { skip: !from });
  const [compute] = useComputeClaimMutation();
  const [create, createState] = useCreateClaimMutation();
  const [resubmit, resubmitState] = useResubmitClaimMutation();

  const [type, setType] = useState<ClaimType>("CONVEYANCE");
  const [purpose, setPurpose] = useState("");
  const [destination, setDestination] = useState("");
  const [start, setStart] = useState(today);
  const [end, setEnd] = useState(today);
  const [mode, setMode] = useState<TravelMode | null>(null);
  const [lines, setLines] = useState<DraftLine[]>([]);
  const [editing, setEditing] = useState<DraftLine | null>(null);
  const [preview, setPreview] = useState<ClaimComputation | null>(null);
  const [checking, setChecking] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const prefilled = useRef(false);

  useEffect(() => {
    const c = source.data;
    if (!c || prefilled.current) return;
    prefilled.current = true;
    setType(c.type); setPurpose(c.purpose); setDestination(c.destination ?? ""); setStart(c.periodStart); setEnd(c.periodEnd);
    setMode(c.travelMode); setLines(toDrafts(c));
  }, [source.data]);
  useEffect(() => {
    if (end < start) setEnd(start);
  }, [start, end]);

  const request = useMemo<CreateClaimRequest | null>(() => {
    if (purpose.trim().length < 5 || !lines.length || (type === "TADA" && !destination.trim())) return null;
    return {
      type, purpose: purpose.trim(), destination: type === "TADA" ? destination.trim() : null, periodStart: start, periodEnd: end,
      travelMode: type === "TADA" ? mode : null,
      lines: lines.map((l) => ({
        date: l.date, category: l.category, description: l.description.trim(), fromPlace: l.fromPlace || null, toPlace: l.toPlace || null,
        distanceKm: l.category === "MILEAGE" ? Number(l.distanceKm) : null, amount: l.category === "MILEAGE" ? undefined : l.amount,
        isDeclaration: l.isDeclaration, receiptFileId: l.receiptFileId,
      })),
    };
  }, [type, purpose, destination, start, end, mode, lines]);

  useEffect(() => {
    if (!request || !online) {
      setPreview(null);
      return;
    }
    setChecking(true);
    const timer = setTimeout(() => {
      compute(request).unwrap().then((r) => { setPreview(r); setFormError(null); }).catch((e: unknown) => { setPreview(null); setFormError(toApiError(e).message); }).finally(() => setChecking(false));
    }, 400);
    return () => clearTimeout(timer);
  }, [request, online, compute]);

  const saveLine = (l: DraftLine) => {
    setLines((cur) => (cur.some((x) => x.key === l.key) ? cur.map((x) => (x.key === l.key ? l : x)) : [...cur, l]));
    setEditing(null);
  };

  const busy = createState.isLoading || resubmitState.isLoading;
  const canSubmit = !!request && !!preview && !preview.blocked && !checking && online;

  const submit = async () => {
    if (!request) return;
    setFormError(null);
    try {
      const claim = from
        ? await resubmit({ id: from, body: request }).unwrap()
        : await create({ body: request, idempotencyKey: newIdempotencyKey() }).unwrap();
      toast.success(t(from ? "new.resubmitted" : "new.submitted"), claim.claimNo);
      router.replace(routes.claim(claim.id));
    } catch (err) {
      const e = toApiError(err);
      setFormError(e.message);
      toast.error(e.message);
    }
  };

  const pol = policy.data;
  const modes = pol?.allowedTravelModes ?? [];

  return (
    <Screen
      title={t(from ? "new.resubmitTitle" : "new.title")}
      footer={
        <>
          {!online ? <Text variant="caption" color="warning" align="center">{t("new.offline")}</Text> : null}
          {preview?.blocked ? <Text variant="caption" color="danger" align="center">{t("new.blocked")}</Text> : null}
          <Button title={t(from ? "new.resubmit" : "new.submit")} icon="send" loading={busy} disabled={!canSubmit} onPress={() => void submit()} testID="claim-submit" />
        </>
      }
    >
      <QueryState isLoading={policy.isLoading || (!!from && source.isLoading)} error={policy.error ?? source.error} hasData={!!pol && (!from || !!source.data)} onRetry={() => void policy.refetch()}>
        <View style={styles.gap}>
          {from ? <Card tone="info"><Text variant="bodySmall">{t("new.resubmitHelp")}</Text></Card> : null}
          {!from ? (
            <View style={styles.gap}>
              <Text variant="caption" color="textSecondary">{t("new.type")}</Text>
              <Segmented value={type} onChange={(v) => { setType(v); setLines([]); }} options={TYPES.map((v) => ({ value: v, label: t(`type.${v}`) }))} />
            </View>
          ) : null}
          <TextField label={t("new.purpose")} value={purpose} onChangeText={setPurpose} helperText={t("new.purposeHelp")} multiline numberOfLines={3} maxLength={300} testID="claim-purpose" />
          {type === "TADA" ? <TextField label={t("new.destination")} value={destination} onChangeText={setDestination} maxLength={120} testID="claim-destination" /> : null}
          <View style={styles.row}>
            <View style={styles.flex}><DateField label={t("new.from")} value={start} onChange={setStart} min={addDays(today, -90)} max={today} testID="claim-start" /></View>
            <View style={styles.flex}><DateField label={t("new.to")} value={end} onChange={setEnd} min={start} max={today} testID="claim-end" /></View>
          </View>
          {type === "TADA" && modes.length ? (
            <View style={styles.gap}>
              <Text variant="caption" color="textSecondary">{t("new.mode")}</Text>
              <View style={styles.chips}>
                {modes.map((m) => <Chip key={m} label={t(`mode.${m}`)} selected={m === mode} onPress={() => setMode(m === mode ? null : m)} />)}
              </View>
            </View>
          ) : null}

          <SectionHeader title={t("new.expenses")} />
          {preview?.lines.some((l) => l.category === "DA") ? (
            <Card padded={false}>
              {preview.lines.filter((l) => l.category === "DA").map((l) => (
                <ListRow key={l.id} icon="cash-outline" title={`${t("category.DA")} · ${fmt.money(l.amount)}`} subtitle={fmt.date(l.date, "EEE, d MMM")} chevron={false} />
              ))}
            </Card>
          ) : null}
          {lines.length ? (
            <Card padded={false}>
              {lines.map((l) => (
                <ListRow
                  key={l.key}
                  icon="receipt-outline"
                  title={`${t(`category.${l.category}`)} · ${l.category === "MILEAGE" ? fmt.money(preview?.lines.find((x) => x.description === l.description && x.category === "MILEAGE")?.amount ?? 0) : fmt.money(Number(l.amount) || 0)}`}
                  subtitle={`${l.description} · ${fmt.date(l.date, "d MMM")}`}
                  meta={l.receiptFileId ? t("line.attached") : undefined}
                  chevron
                  onPress={() => setEditing(l)}
                  testID={`claim-line-${l.key}`}
                />
              ))}
            </Card>
          ) : <Text variant="bodySmall" color="textSecondary">{t("new.noLines")}</Text>}
          <Button title={t("new.addLine")} variant="secondary" icon="add" onPress={() => setEditing(newDraftLine(start, LINE_CATEGORIES[type][0] ?? "OTHER"))} testID="claim-add-line" />
          {editing && lines.some((l) => l.key === editing.key) ? (
            <Button title={t("line.remove")} variant="ghost" icon="trash-outline" onPress={() => { setLines((cur) => cur.filter((l) => l.key !== editing.key)); setEditing(null); }} />
          ) : null}

          {checking ? <Text variant="caption" color="textSecondary">{t("new.checking")}</Text> : null}
          {preview ? (
            <Card style={styles.gap}>
              <View style={styles.between}>
                <Text variant="bodyStrong">{t("new.totals")}</Text>
                <Text variant="h3">{fmt.money(preview.totalAmount)}</Text>
              </View>
              {Number(preview.policyAmount) !== Number(preview.totalAmount) ? (
                <View style={styles.between}>
                  <Text variant="bodySmall" color="textSecondary">{t("new.policyTotal")}</Text>
                  <Text variant="bodySmall" color="textSecondary">{fmt.money(preview.policyAmount)}</Text>
                </View>
              ) : null}
              <FlagList flags={preview.policyFlags} />
            </Card>
          ) : null}
          {pol ? <Text variant="caption" color="textTertiary">{t("new.band", { band: pol.band })}</Text> : null}
          {formError ? <Text variant="bodySmall" color="danger" testID="claim-error">{formError}</Text> : null}
        </View>
      </QueryState>
      <LineSheet visible={!!editing} line={editing} type={type} policy={pol} min={start} max={end} onClose={() => setEditing(null)} onSave={saveLine} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  gap: { gap: Spacing.md },
  row: { flexDirection: "row", gap: Spacing.md },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.sm },
  between: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  flex: { flex: 1 },
});
