import { useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Button } from "@/components/ui";
import { useTheme } from "@/hooks/use-theme";
import { Radius, Spacing, Typography } from "@/constants/theme";

// ─── Onboarding data ─────────────────────────────────────────────────────────
// Replace emoji with actual illustrations / Lottie when you have assets
const SLIDES = [
  {
    id: "1",
    emoji: "🚀",
    title: "Welcome to the App",
    description: "Everything you need in one place. Fast, simple, and built for you.",
  },
  {
    id: "2",
    emoji: "🔒",
    title: "Safe & Secure",
    description: "Your data is encrypted end-to-end. Privacy is not an afterthought.",
  },
  {
    id: "3",
    emoji: "✨",
    title: "Ready to Start?",
    description: "Create your account in seconds. No credit card required.",
  },
];

export default function WelcomeScreen() {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const isLast = activeIndex === SLIDES.length - 1;

  const goToNext = () => {
    if (isLast) {
      router.replace("/(auth)/login");
    } else {
      const next = activeIndex + 1;
      flatListRef.current?.scrollToIndex({ index: next, animated: true });
      setActiveIndex(next);
    }
  };

  const handleSkip = () => {
    router.replace("/(auth)/login");
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      {!isLast && (
        <TouchableOpacity style={styles.skipBtn} onPress={handleSkip}>
          <Text style={{ color: theme.textSecondary, fontWeight: "600", fontSize: 15 }}>Skip</Text>
        </TouchableOpacity>
      )}

      <FlatList
        ref={flatListRef}
        data={SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width }]}>
            <View style={[styles.emojiCircle, { backgroundColor: theme.accentMuted }]}>
              <Text style={styles.emoji}>{item.emoji}</Text>
            </View>
            <Text style={[Typography.h1, styles.title, { color: theme.text }]}>{item.title}</Text>
            <Text style={[styles.description, { color: theme.textSecondary }]}>
              {item.description}
            </Text>
          </View>
        )}
      />

      <View style={styles.dotsRow}>
        {SLIDES.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              { backgroundColor: theme.border },
              i === activeIndex && { width: 24, backgroundColor: theme.accent },
            ]}
          />
        ))}
      </View>

      <View style={styles.btnWrap}>
        <Button
          title={isLast ? "Get Started" : "Next"}
          onPress={goToNext}
          leftIcon={isLast ? undefined : <Ionicons name="arrow-forward" size={18} color="#fff" />}
        />
        {isLast && (
          <TouchableOpacity
            style={styles.signInLink}
            onPress={() => router.replace("/(auth)/login")}
          >
            <Text style={{ color: theme.textSecondary, fontSize: 14 }}>
              Already have an account?{" "}
              <Text style={{ color: theme.accent, fontWeight: "700" }}>Sign In</Text>
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  skipBtn: { position: "absolute", top: 56, right: 20, zIndex: 10, padding: Spacing.sm },
  slide: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.xxxl + 4,
    paddingTop: Spacing.huge - 8,
  },
  emojiCircle: {
    width: 140,
    height: 140,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.huge - 8,
  },
  emoji: { fontSize: 64 },
  title: { textAlign: "center", marginBottom: Spacing.md },
  description: { fontSize: 16, textAlign: "center", lineHeight: 24, paddingHorizontal: Spacing.sm },
  dotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.sm - 2,
    marginBottom: Spacing.xxl + 4,
  },
  dot: { width: 8, height: 8, borderRadius: Radius.full },
  btnWrap: { paddingHorizontal: Spacing.xxl, paddingBottom: Spacing.xxl, gap: Spacing.md },
  signInLink: { alignItems: "center", paddingVertical: Spacing.xs },
});
