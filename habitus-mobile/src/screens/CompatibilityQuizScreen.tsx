import { useEffect, useState, useRef } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Platform,
  Animated,
} from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";
import {
  es,
  fetchCompatQuiz,
  questionsForRole,
  roleNeedsCompatQuiz,
  saveCompatQuiz,
} from "@habitus/core";
import type { CompatQuizAnswers } from "@habitus/core";
import { useAuth } from "../context/AuthContext";
import { liquidGlassTheme } from "../theme/liquidGlass";

export function CompatibilityQuizScreen() {
  const { user, profile, refreshProfile, markQuizComplete } = useAuth();
  const [answers, setAnswers] = useState<CompatQuizAnswers>({});
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const role = profile?.accountRole;

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    if (!user?.id) return;
    fetchCompatQuiz(user.id)
      .then((q) => {
        setAnswers(q);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, [user?.id]);

  useEffect(() => {
    if (loaded && role) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: liquidGlassTheme.animation.duration.normal,
        useNativeDriver: true,
      }).start();
    }
  }, [loaded, role]);

  // Update progress animation when answers change
  useEffect(() => {
    const questions = role ? questionsForRole(role) : [];
    const answeredCount = Object.keys(answers).length;
    const progress = questions.length > 0 ? answeredCount / questions.length : 0;
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [answers, role]);

  if (!loaded || !role || !roleNeedsCompatQuiz(role)) {
    return (
      <View style={styles.centered}>
        <LinearGradient
          colors={[
            liquidGlassTheme.colors.gradients.primary[0],
            liquidGlassTheme.colors.light.background,
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <ActivityIndicator
          size="large"
          color={liquidGlassTheme.colors.brand.primary}
        />
      </View>
    );
  }

  const questions = questionsForRole(role);
  const progress = questions.length > 0 ? Object.keys(answers).length / questions.length : 0;
  const progressPercent = Math.round(progress * 100);

  async function save() {
    if (!user?.id || !role) return;
    setBusy(true);
    setError(null);
    const result = await saveCompatQuiz(user.id, answers, role);
    setBusy(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    await refreshProfile();
    markQuizComplete();
  }

  const isComplete = questions.length > 0 && Object.keys(answers).length >= questions.length;

  return (
    <View style={styles.root}>
      {/* Background gradient */}
      <LinearGradient
        colors={[
          liquidGlassTheme.colors.gradients.primary[0],
          liquidGlassTheme.colors.light.background,
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <View style={styles.header}>
        {Platform.OS === "ios" && (
          <BlurView intensity={30} tint="light" style={StyleSheet.absoluteFill} />
        )}
        <View style={styles.headerContent}>
          <View style={styles.progressContainer}>
            <View style={styles.progressInfo}>
              <MaterialIcons
                name="psychology"
                size={24}
                color={liquidGlassTheme.colors.brand.primary}
              />
              <View style={styles.progressTextContainer}>
                <Text style={styles.progressTitle}>Progreso</Text>
                <Text style={styles.progressPercent}>{progressPercent}%</Text>
              </View>
            </View>
            <View style={styles.progressBar}>
              <Animated.View
                style={[
                  styles.progressFill,
                  { width: progressAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ["0%", "100%"],
                  }) },
                ]}
              />
            </View>
          </View>
        </View>
      </View>

      {/* Content */}
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Title card */}
          <View style={styles.titleCard}>
            <BlurView intensity={20} tint="light" style={StyleSheet.absoluteFill} />
            <View style={styles.titleCardContent}>
              <MaterialIcons
                name="favorite"
                size={32}
                color={liquidGlassTheme.colors.brand.secondary}
              />
              <Text style={styles.title}>{es.onboarding.quizTitle}</Text>
              <Text style={styles.sub}>{es.onboarding.quizBody}</Text>
            </View>
          </View>

          {/* Questions */}
          <View style={styles.questionsContainer}>
            {questions.map((q, qIndex) => {
              const questionAnim = useState(new Animated.Value(0))[0];

              useEffect(() => {
                Animated.timing(questionAnim, {
                  toValue: 1,
                  duration: liquidGlassTheme.animation.duration.normal,
                  delay: qIndex * 100,
                  useNativeDriver: true,
                }).start();
              }, []);

              return (
                <Animated.View
                  key={q.id}
                  style={[
                    styles.questionBlock,
                    { opacity: questionAnim, transform: [{ translateY: Animated.multiply(10, Animated.subtract(1, questionAnim)) }] },
                  ]}
                >
                  <View style={styles.questionCard}>
                    <BlurView intensity={15} tint="light" style={StyleSheet.absoluteFill} />
                    <View style={styles.questionCardContent}>
                      <View style={styles.questionHeader}>
                        <View style={styles.questionNumber}>
                          <Text style={styles.questionNumberText}>{qIndex + 1}</Text>
                        </View>
                        <Text style={styles.questionText}>{q.label}</Text>
                      </View>

                      <View style={styles.optionsContainer}>
                        {q.options.map((opt, oIndex) => {
                          const isSelected = answers[q.id] === opt.value;
                          const optionAnim = useState(new Animated.Value(0))[0];

                          useEffect(() => {
                            if (isSelected) {
                              Animated.spring(optionAnim, {
                                toValue: 1,
                                ...liquidGlassTheme.animation.spring.bouncy,
                                useNativeDriver: true,
                              }).start();
                            }
                          }, [isSelected]);

                          return (
                            <Pressable
                              key={opt.value}
                              onPress={() =>
                                setAnswers((prev) => ({ ...prev, [q.id]: opt.value }))
                              }
                            >
                              <Animated.View
                                style={[
                                  styles.option,
                                  isSelected && styles.optionActive,
                                  {
                                    transform: [
                                      {
                                        scale: optionAnim.interpolate({
                                          inputRange: [0, 1],
                                          outputRange: [1, 1.02],
                                          extrapolateRight: "clamp",
                                        }),
                                      },
                                    ],
                                  },
                                ]}
                              >
                                {isSelected && (
                                  <Animated.View
                                    style={[
                                      styles.optionCheck,
                                      {
                                        opacity: optionAnim,
                                        transform: [{ scale: optionAnim }],
                                      },
                                    ]}
                                  >
                                    <MaterialIcons
                                      name="check"
                                      size={16}
                                      color={liquidGlassTheme.colors.white}
                                    />
                                  </Animated.View>
                                )}
                                <Text
                                  style={[styles.optionText, isSelected && styles.optionTextActive]}
                                >
                                  {opt.label}
                                </Text>
                              </Animated.View>
                            </Pressable>
                          );
                        })}
                      </View>
                    </View>
                  </View>
                </Animated.View>
              );
            })}
          </View>

          {/* Error message */}
          {error && (
            <View style={styles.errorBanner}>
              <BlurView intensity={20} tint="light" style={StyleSheet.absoluteFill} />
              <View style={styles.errorContent}>
                <MaterialIcons
                  name="error-outline"
                  size={20}
                  color={liquidGlassTheme.colors.brand.error}
                />
                <Text style={styles.error}>{error}</Text>
              </View>
            </View>
          )}

          {/* Submit button */}
          <Pressable
            style={[styles.btn, !isComplete && styles.btnDisabled]}
            onPress={save}
            disabled={busy || !isComplete}
          >
            <LinearGradient
              colors={
                isComplete
                  ? liquidGlassTheme.colors.gradients.primary
                  : ["#ccc", "#999"]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
            {busy ? (
              <ActivityIndicator color={liquidGlassTheme.colors.white} />
            ) : (
              <>
                <MaterialIcons
                  name="check"
                  size={20}
                  color={liquidGlassTheme.colors.white}
                />
                <Text style={styles.btnText}>{es.compat.saveQuiz}</Text>
              </>
            )}
          </Pressable>
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: liquidGlassTheme.colors.light.background,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    paddingTop: liquidGlassTheme.spacing.lg + 8,
    paddingBottom: liquidGlassTheme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: liquidGlassTheme.colors.light.border.subtle,
  },
  headerContent: {
    paddingHorizontal: liquidGlassTheme.spacing.lg,
  },
  progressContainer: {
    backgroundColor: liquidGlassTheme.colors.light.glass.card + "90",
    borderRadius: liquidGlassTheme.borderRadius.lg,
    padding: liquidGlassTheme.spacing.md,
    borderWidth: 1,
    borderColor: liquidGlassTheme.colors.light.border.subtle,
  },
  progressInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: liquidGlassTheme.spacing.sm,
    marginBottom: liquidGlassTheme.spacing.sm,
  },
  progressTextContainer: {
    flex: 1,
  },
  progressTitle: {
    fontSize: liquidGlassTheme.typography.fontSize.footnote,
    fontWeight: liquidGlassTheme.typography.fontWeight.medium,
    color: liquidGlassTheme.colors.light.text.secondary,
  },
  progressPercent: {
    fontSize: liquidGlassTheme.typography.fontSize.title3,
    fontWeight: liquidGlassTheme.typography.fontWeight.bold,
    color: liquidGlassTheme.colors.brand.primary,
  },
  progressBar: {
    height: 6,
    backgroundColor: liquidGlassTheme.colors.light.surfaceVariant,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: liquidGlassTheme.colors.brand.primary,
    borderRadius: 3,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: liquidGlassTheme.spacing.lg,
    paddingBottom: liquidGlassTheme.spacing.xxl,
  },
  titleCard: {
    borderRadius: liquidGlassTheme.borderRadius.xl,
    overflow: "hidden",
    marginBottom: liquidGlassTheme.spacing.lg,
    borderWidth: 1,
    borderColor: liquidGlassTheme.colors.light.border.subtle,
    ...liquidGlassTheme.shadows.lg,
  },
  titleCardContent: {
    padding: liquidGlassTheme.spacing.xl,
    alignItems: "center",
  },
  title: {
    fontSize: liquidGlassTheme.typography.fontSize.title2,
    fontWeight: liquidGlassTheme.typography.fontWeight.bold,
    color: liquidGlassTheme.colors.light.text.primary,
    textAlign: "center",
    marginTop: liquidGlassTheme.spacing.md,
    marginBottom: liquidGlassTheme.spacing.xs,
  },
  sub: {
    fontSize: liquidGlassTheme.typography.fontSize.callout,
    color: liquidGlassTheme.colors.light.text.secondary,
    textAlign: "center",
  },
  questionsContainer: {
    gap: liquidGlassTheme.spacing.lg,
    marginBottom: liquidGlassTheme.spacing.lg,
  },
  questionBlock: {},
  questionCard: {
    borderRadius: liquidGlassTheme.borderRadius.xl,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: liquidGlassTheme.colors.light.border.subtle,
    ...liquidGlassTheme.shadows.md,
  },
  questionCardContent: {
    padding: liquidGlassTheme.spacing.lg,
  },
  questionHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: liquidGlassTheme.spacing.md,
    marginBottom: liquidGlassTheme.spacing.md,
  },
  questionNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: liquidGlassTheme.colors.brand.primary + "20",
    alignItems: "center",
    justifyContent: "center",
  },
  questionNumberText: {
    fontSize: liquidGlassTheme.typography.fontSize.callout,
    fontWeight: liquidGlassTheme.typography.fontWeight.bold,
    color: liquidGlassTheme.colors.brand.primary,
  },
  questionText: {
    flex: 1,
    fontSize: liquidGlassTheme.typography.fontSize.headline,
    fontWeight: liquidGlassTheme.typography.fontWeight.semiBold,
    color: liquidGlassTheme.colors.light.text.primary,
    lineHeight: liquidGlassTheme.typography.lineHeight.tight,
  },
  optionsContainer: {
    gap: liquidGlassTheme.spacing.sm,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    padding: liquidGlassTheme.spacing.md,
    borderRadius: liquidGlassTheme.borderRadius.md,
    borderWidth: 1.5,
    borderColor: liquidGlassTheme.colors.light.border.subtle,
    backgroundColor: liquidGlassTheme.colors.light.glass.card + "60",
    ...liquidGlassTheme.shadows.sm,
  },
  optionActive: {
    borderColor: liquidGlassTheme.colors.brand.primary,
    backgroundColor: liquidGlassTheme.colors.brand.primary + "15",
  },
  optionCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: liquidGlassTheme.colors.brand.primary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: liquidGlassTheme.spacing.md,
  },
  optionText: {
    flex: 1,
    fontSize: liquidGlassTheme.typography.fontSize.callout,
    color: liquidGlassTheme.colors.light.text.primary,
  },
  optionTextActive: {
    color: liquidGlassTheme.colors.brand.primary,
    fontWeight: liquidGlassTheme.typography.fontWeight.medium,
  },
  errorBanner: {
    borderRadius: liquidGlassTheme.borderRadius.md,
    overflow: "hidden",
    marginBottom: liquidGlassTheme.spacing.lg,
    borderWidth: 1,
    borderColor: liquidGlassTheme.colors.brand.error + "30",
  },
  errorContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: liquidGlassTheme.spacing.sm,
    padding: liquidGlassTheme.spacing.md,
  },
  error: {
    flex: 1,
    fontSize: liquidGlassTheme.typography.fontSize.footnote,
    color: liquidGlassTheme.colors.brand.error,
  },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: liquidGlassTheme.spacing.sm,
    borderRadius: liquidGlassTheme.borderRadius.button,
    paddingVertical: liquidGlassTheme.spacing.md + 2,
    overflow: "hidden",
    ...liquidGlassTheme.shadows.md,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  btnText: {
    fontSize: liquidGlassTheme.typography.fontSize.headline,
    fontWeight: liquidGlassTheme.typography.fontWeight.semiBold,
    color: liquidGlassTheme.colors.light.text.inverse,
  },
});
