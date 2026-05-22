import type { ReactNode } from "react";
import { StyleSheet, Text, TextInput, View, type TextInputProps } from "react-native";
import { colors } from "../../theme/colors";
import { fontStyles } from "../../theme/fonts";

type AuthFieldProps = TextInputProps & {
  label: string;
  suffix?: ReactNode;
  footer?: ReactNode;
};

export function AuthField({ label, suffix, footer, style, ...props }: AuthFieldProps) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputRow}>
        <TextInput
          placeholderTextColor={colors.outline}
          style={[styles.input, suffix ? styles.inputWithSuffix : null, style]}
          {...props}
        />
        {suffix}
      </View>
      {footer}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 12, width: "100%" },
  label: {
    fontSize: 14,
    color: colors.deepNavy,
    marginBottom: 6,
    ...fontStyles.label,
  },
  inputRow: { position: "relative", width: "100%" },
  input: {
    width: "100%",
    backgroundColor: colors.surfaceLowest,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.onSurface,
    ...fontStyles.body,
  },
  inputWithSuffix: { paddingRight: 44 },
});
