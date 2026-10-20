import { forwardRef, useImperativeHandle, useRef } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

export const CODE_LENGTH = 6;

type CodeInputProps = {
  value: string;
  onChange: (code: string) => void;
  /** Called once all digits are in (typed, pasted or autofilled). */
  onComplete?: (code: string) => void;
  editable?: boolean;
  hasError?: boolean;
  colors: { box: string; boxActive: string; boxError: string; text: string };
};

export type CodeInputHandle = { focus(): void };

/**
 * Six boxes over a single hidden field: paste, keyboard autofill and
 * backspace all behave like a normal text input.
 */
export const CodeInput = forwardRef<CodeInputHandle, CodeInputProps>(function CodeInput(
  { value, onChange, onComplete, editable = true, hasError = false, colors },
  ref,
) {
  const inputRef = useRef<TextInput>(null);
  useImperativeHandle(ref, () => ({ focus: () => inputRef.current?.focus() }), []);

  const handleChange = (text: string) => {
    const digits = text.replace(/\D/g, '').slice(0, CODE_LENGTH);
    onChange(digits);
    if (digits.length === CODE_LENGTH) onComplete?.(digits);
  };

  return (
    <Pressable
      onPress={() => inputRef.current?.focus()}
      accessibilityRole="none"
      style={styles.row}
    >
      {Array.from({ length: CODE_LENGTH }, (_, i) => {
        const active = editable && i === Math.min(value.length, CODE_LENGTH - 1);
        const borderColor = hasError ? colors.boxError : active ? colors.boxActive : 'transparent';
        return (
          <View key={i} style={[styles.box, { backgroundColor: colors.box, borderColor }]}>
            <Text style={[styles.digit, { color: colors.text }]}>{value[i] ?? ''}</Text>
          </View>
        );
      })}
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={handleChange}
        editable={editable}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="one-time-code"
        maxLength={CODE_LENGTH}
        autoFocus
        caretHidden
        accessibilityLabel="Sign-in code"
        accessibilityHint={`Enter the ${CODE_LENGTH}-digit code from your email`}
        style={styles.hiddenInput}
      />
    </Pressable>
  );
});

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  box: {
    flex: 1,
    aspectRatio: 0.86,
    maxHeight: 60,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  digit: {
    fontSize: 24,
    fontWeight: '700',
  },
  hiddenInput: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.01,
    color: 'transparent',
  },
});
