import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useTranslation } from "react-i18next";
import { Button, Card, Chip, DateField, Sheet, Text, TextField, Toggle } from "@/components/ui";
import { Spacing } from "@/constants/theme";
import { useFormat } from "@/hooks/useLanguage";
import { toast } from "@/lib/toast";
import type { ClaimCategory, ClaimPolicy, ClaimType } from "@/types/domain/claims";
import { LINE_CATEGORIES } from "../presentation";

/** One expense line as edited on the form; `receiptUri` is only a local preview. */
export interface DraftLine {
  key: string;
  date: string;
  category: ClaimCategory;
  description: string;
  amount: string;
  distanceKm: string;
  fromPlace: string;
  toPlace: string;
  isDeclaration: boolean;
  receiptFileId: string | null;
  receiptUri: string | null;
}

export const newDraftLine = (date: string, category: ClaimCategory): DraftLine => ({
  key: `l_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
  date, category, description: "", amount: "", distanceKm: "", fromPlace: "", toPlace: "", isDeclaration: false, receiptFileId: null, receiptUri: null,
});

interface Props {
  visible: boolean;
  line: DraftLine | null;
  type: ClaimType;
  policy: ClaimPolicy | undefined;
  min: string;
  max: string;
  onClose: () => void;
  onSave: (line: DraftLine) => void;
}

const MONEY = /^\d{1,9}(\.\d{1,2})?$/;

/** Add or edit an expense; mileage is computed from distance, receipts come from the camera or library. */
export function LineSheet({ visible, line, type, policy, min, max, onClose, onSave }: Props) {
  const { t } = useTranslation(["claims", "common"]);
  const fmt = useFormat();
  const [draft, setDraft] = useState<DraftLine | null>(line);
  useEffect(() => setDraft(line), [line, visible]);
  if (!draft) return null;

  const patch = (p: Partial<DraftLine>) => setDraft((d) => (d ? { ...d, ...p } : d));
  const mileage = draft.category === "MILEAGE";
  const rate = Number(policy?.mileageRatePerKm ?? 0);
  const km = Number(draft.distanceKm);
  const amount = mileage ? Math.round(km * rate * 100) / 100 : Number(draft.amount);
  const above = Number(policy?.receiptRequiredAbove ?? 500);
  const declMax = Number(policy?.declarationMaxAmount ?? 1000);
  const declarable = !!policy?.declarationCategories.includes(draft.category) && amount > above && amount <= declMax;
  const needsReceipt = !mileage && (draft.category === "HOTEL" || amount > above) && !(draft.isDeclaration && declarable);
  const valid =
    draft.description.trim().length > 0 &&
    (mileage ? km > 0 && draft.fromPlace.trim() !== "" && draft.toPlace.trim() !== "" : MONEY.test(draft.amount) && amount > 0);

  const attach = async (fromCamera: boolean) => {
    try {
      if (fromCamera) {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (!perm.granted) return toast.error(t("line.cameraDenied"));
      }
      const res = fromCamera
        ? await ImagePicker.launchCameraAsync({ mediaTypes: ["images"], quality: 0.6 })
        : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.6 });
      const asset = res.canceled ? undefined : res.assets[0];
      // The mock server has no file store; the local id stands in for a presigned upload (doc 03 §3).
      if (asset) patch({ receiptUri: asset.uri, receiptFileId: `rcpt_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}` });
    } catch {
      toast.error(t("line.invalid"));
    }
  };

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title={t("line.title")}
      footer={<Button title={t("line.save")} icon="checkmark" disabled={!valid} onPress={() => onSave({ ...draft, amount: mileage ? String(amount) : draft.amount })} testID="line-save" />}
    >
      <View style={styles.gap}>
        <Text variant="caption" color="textSecondary">{t("line.category")}</Text>
        <View style={styles.chips}>
          {LINE_CATEGORIES[type].map((c) => (
            <Chip key={c} label={t(`category.${c}`)} selected={c === draft.category} onPress={() => patch({ category: c, isDeclaration: false })} testID={`line-cat-${c}`} />
          ))}
        </View>
        <DateField label={t("line.date")} value={draft.date} onChange={(date) => patch({ date })} min={min} max={max} testID="line-date" />
        <TextField label={t("line.description")} value={draft.description} onChangeText={(description) => patch({ description })} maxLength={200} testID="line-description" />
        {mileage ? (
          <>
            <TextField label={t("line.distance")} value={draft.distanceKm} onChangeText={(distanceKm) => patch({ distanceKm: distanceKm.replace(/[^\d.]/g, "") })} keyboardType="decimal-pad" testID="line-km" />
            <View style={styles.row}>
              <View style={styles.flex}><TextField label={t("line.fromPlace")} value={draft.fromPlace} onChangeText={(fromPlace) => patch({ fromPlace })} maxLength={80} /></View>
              <View style={styles.flex}><TextField label={t("line.toPlace")} value={draft.toPlace} onChangeText={(toPlace) => patch({ toPlace })} maxLength={80} /></View>
            </View>
            <Text variant="caption" color="textSecondary">{`${t("line.rate", { rate: fmt.number(rate) })} = ${fmt.money(Number.isFinite(amount) ? amount : 0)}`}</Text>
          </>
        ) : (
          <TextField label={t("line.amount")} value={draft.amount} onChangeText={(a) => patch({ amount: a.replace(/[^\d.]/g, "") })} keyboardType="decimal-pad" testID="line-amount" />
        )}
        {declarable ? (
          <Card style={styles.row}>
            <View style={styles.flex}>
              <Text variant="bodyStrong">{t("line.declaration")}</Text>
              <Text variant="caption" color="textSecondary">{t("line.declarationHelp", { max: fmt.number(declMax) })}</Text>
            </View>
            <Toggle value={draft.isDeclaration} onChange={(isDeclaration) => patch({ isDeclaration })} accessibilityLabel={t("line.declaration")} />
          </Card>
        ) : null}
        {!mileage ? (
          <View style={styles.gap}>
            <Text variant="caption" color="textSecondary">{needsReceipt ? `${t("line.receipt")} · ${t("line.receiptNeeded", { above: fmt.number(above) })}` : t("line.receipt")}</Text>
            {draft.receiptUri ? <Image source={{ uri: draft.receiptUri }} style={styles.thumb} contentFit="cover" accessibilityLabel={t("line.attached")} /> : null}
            {draft.receiptFileId && !draft.receiptUri ? <Text variant="bodySmall" color="success">{t("line.attached")}</Text> : null}
            <View style={styles.row}>
              <View style={styles.flex}><Button title={t("line.takePhoto")} variant="secondary" icon="camera-outline" onPress={() => void attach(true)} /></View>
              <View style={styles.flex}><Button title={t("line.choosePhoto")} variant="secondary" icon="image-outline" onPress={() => void attach(false)} /></View>
            </View>
            {draft.receiptFileId ? <Button title={t("line.removeReceipt")} variant="ghost" icon="trash-outline" onPress={() => patch({ receiptFileId: null, receiptUri: null })} /> : null}
          </View>
        ) : null}
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  gap: { gap: Spacing.md },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.sm },
  row: { flexDirection: "row", alignItems: "center", gap: Spacing.md },
  flex: { flex: 1 },
  thumb: { width: "100%", height: 160, borderRadius: 12 },
});
