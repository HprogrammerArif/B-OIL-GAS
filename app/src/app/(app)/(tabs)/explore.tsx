import { useCallback, useMemo, useState } from "react";
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { EmptyState } from "@/components/ui";
import { useTheme } from "@/hooks/use-theme";
import { Radius, Spacing, Typography } from "@/constants/theme";

// Scaffold data — replace with real API data
const CATEGORIES = ["All", "Popular", "New", "Trending", "Featured"];
const ITEMS = Array.from({ length: 8 }, (_, i) => ({
  id: String(i + 1),
  title: `Item ${i + 1}`,
  subtitle: "Tap to view details",
  emoji: ["🎯", "🚀", "⭐", "🎨", "💡", "🔥", "🎉", "📱"][i],
}));

export default function ExploreScreen() {
  const theme = useTheme();
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  const filtered = useMemo(
    () =>
      ITEMS.filter(
        (item) => query === "" || item.title.toLowerCase().includes(query.toLowerCase()),
      ),
    [query],
  );

  const renderCategory = useCallback(
    ({ item }: { item: string }) => {
      const active = activeCategory === item;
      return (
        <TouchableOpacity
          style={[styles.chip, { backgroundColor: active ? theme.accent : theme.surfaceSecondary }]}
          onPress={() => setActiveCategory(item)}
        >
          <Text style={[styles.chipText, { color: active ? "#fff" : theme.textSecondary }]}>
            {item}
          </Text>
        </TouchableOpacity>
      );
    },
    [activeCategory, theme],
  );

  const renderItem = useCallback(
    ({ item }: { item: (typeof ITEMS)[number] }) => (
      <TouchableOpacity
        style={[styles.card, { backgroundColor: theme.surface, shadowColor: theme.text }]}
        activeOpacity={0.75}
      >
        <Text style={styles.cardEmoji}>{item.emoji}</Text>
        <Text style={[styles.cardTitle, { color: theme.text }]}>{item.title}</Text>
        <Text style={[styles.cardSub, { color: theme.textTertiary }]}>{item.subtitle}</Text>
      </TouchableOpacity>
    ),
    [theme],
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View
        style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}
      >
        <Text style={[Typography.h1, { color: theme.text, marginBottom: Spacing.md }]}>
          Explore
        </Text>

        <View style={[styles.searchRow, { backgroundColor: theme.surfaceSecondary }]}>
          <Ionicons name="search-outline" size={18} color={theme.textTertiary} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Search..."
            placeholderTextColor={theme.textTertiary}
            value={query}
            onChangeText={setQuery}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity
              onPress={() => setQuery("")}
              accessibilityRole="button"
              accessibilityLabel="Clear search"
            >
              <Ionicons name="close-circle" size={18} color={theme.textTertiary} />
            </TouchableOpacity>
          )}
        </View>

        <FlatList
          data={CATEGORIES}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(c) => c}
          contentContainerStyle={styles.chips}
          renderItem={renderCategory}
        />
      </View>

      {/* Grid */}
      <FlatList
        data={filtered}
        numColumns={2}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.grid}
        columnWrapperStyle={styles.row}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState
            icon="search-outline"
            title="No results found"
            description="Try a different search term."
          />
        }
        renderItem={renderItem}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xs,
    borderBottomWidth: 1,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    height: 46,
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  searchInput: { flex: 1, fontSize: 15 },
  chips: { gap: Spacing.sm, paddingBottom: Spacing.md },
  chip: {
    paddingHorizontal: Spacing.lg,
    height: 34,
    borderRadius: Radius.full,
    justifyContent: "center",
  },
  chipText: { fontSize: 13, fontWeight: "600" },
  grid: { padding: Spacing.lg, paddingTop: Spacing.md },
  row: { gap: Spacing.md, marginBottom: Spacing.md },
  card: {
    flex: 1,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    alignItems: "flex-start",
    gap: Spacing.sm,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardEmoji: { fontSize: 32 },
  cardTitle: { fontSize: 14, fontWeight: "700" },
  cardSub: { fontSize: 12 },
});
