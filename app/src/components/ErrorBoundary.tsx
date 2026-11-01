import { Component, type ErrorInfo, type ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { captureError } from "@/lib/sentry";
import { logger } from "@/lib/logger";
import { Button } from "./ui/Button";
import { Icon } from "./ui/Icon";
import { Text } from "./ui/Text";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

function Fallback({ error, onRetry }: { error: Error; onRetry: () => void }) {
  const theme = useTheme();
  const { t } = useTranslation(["errors", "common"]);
  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Icon name="warning-outline" size={40} color="danger" />
      <Text variant="h2" align="center">
        {t("crashTitle")}
      </Text>
      <Text variant="body" color="textSecondary" align="center">
        {__DEV__ ? error.message : t("crashBody")}
      </Text>
      <Button title={t("common:actions.retry")} onPress={onRetry} fullWidth={false} />
    </View>
  );
}

/** Catches render errors, reports them, and offers a retry. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    captureError(error, { componentStack: info.componentStack ?? "" });
    logger.error("[ErrorBoundary]", error);
  }

  private retry = () => this.setState({ error: null });

  render(): ReactNode {
    if (this.state.error) return <Fallback error={this.state.error} onRetry={this.retry} />;
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", padding: Spacing.xxl, gap: Spacing.md },
});
