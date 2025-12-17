import { describe, it, expect, beforeEach } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useCurrencyStore } from "@/stores/CurrencyStore.ts";

// Get the return type of the store for type safety
type CurrencyStoreInstance = ReturnType<typeof useCurrencyStore>;

describe("CurrencyStore", () => {
  let store: CurrencyStoreInstance;

  beforeEach(() => {
    // Setup Pinia instance and create a fresh store instance for each test
    setActivePinia(createPinia());
    store = useCurrencyStore();
  });

  it("1. should initialize with default formatting settings (derived from system defaults)", () => {
    // Note: The actual default values are imported by the store itself,
    // we check against common expected defaults or initial values.
    expect(store.minPrecision).toBe(2); // defaultMinPrecision
    expect(store.maxPrecision).toBe(2); // defaultMaxPrecision
    expect(store.thousandsSeparator).toBe(true); // defaultThousandsSeparator
    expect(store.useBankersRounding).toBe(false); // defaultUseBankersRounding
    expect(store.currencyDisplay).toBe("symbol"); // defaultCurrencyDisplay
    expect(store.currencySign).toBe("standard"); // defaultCurrencySign

    // The currency code will default to the system's resolved currency (usually USD or EUR)
    // We will assert that it's a non-empty string.
    expect(store.currency).toBeTypeOf("string");
    expect(store.currency.length).toBeGreaterThanOrEqual(3);
  });

  it("2. should correctly expose the numberFormat computed property", () => {
    const format = store.numberFormat;

    // Check structure and some values
    expect(format).toBeTypeOf("object");
    expect(format.currency).toBe(store.currency);
    expect(format.maxPrecision).toBe(2);
    expect(format.thousandsSeparator).toBe(true);
  });

  it("3. should update multiple formatting properties via updateNumberFormat action", () => {
    const newPayload = {
      maxPrecision: 4,
      thousandsSeparator: false,
      currency: "JPY",
      currencyDisplay: "code" as const, // Use 'as const' to satisfy type for literals
    };

    store.updateNumberFormat(newPayload);

    // Verify direct state updates
    expect(store.maxPrecision).toBe(4);
    expect(store.thousandsSeparator).toBe(false);
    expect(store.currency).toBe("JPY");
    expect(store.currencyDisplay).toBe("code");

    // Verify computed property reflects the updates
    expect(store.numberFormat.maxPrecision).toBe(4);
    expect(store.numberFormat.currency).toBe("JPY");
  });

  it("4. should update specific properties and skip currency and currencySign", () => {
    const initialCurrency = store.currency;
    const initialCurrencySign = store.currencySign;

    // Act: Update two properties, skipping currency (L61) and currencySign (L66)
    store.updateNumberFormat({
      minPrecision: 1, // TRUE branch hit
      maxPrecision: 5, // TRUE branch hit
    });

    // Assert TRUE branch hits:
    expect(store.minPrecision).toBe(1);
    expect(store.maxPrecision).toBe(5);

    // Assert FALSE branch hits (L61, L66):
    expect(store.currency).toBe(initialCurrency);
    expect(store.currencySign).toBe(initialCurrencySign);
  });

  // NEW TEST: Covers the "false" branch for all 8 properties (the missing 27.28%)
  it("5. should ignore calls with an empty payload and keep state unchanged", () => {
    // Arrange: Capture the initial state of a few properties
    const initialMaxPrecision = store.maxPrecision;
    const initialCurrencySign = store.currencySign;
    const initialNegativeZero = store.negativeZero;

    // Act: Call with an empty object
    store.updateNumberFormat({});

    // Assert: All properties should be exactly the same
    expect(store.maxPrecision).toBe(initialMaxPrecision);
    expect(store.currencySign).toBe(initialCurrencySign);
    expect(store.negativeZero).toBe(initialNegativeZero);

    // Assert: Ensure the total numberFormat object is unchanged
    expect(store.numberFormat).toEqual({
      minPrecision: store.minPrecision,
      maxPrecision: initialMaxPrecision,
      thousandsSeparator: store.thousandsSeparator,
      useBankersRounding: store.useBankersRounding,
      negativeZero: initialNegativeZero,
      currency: store.currency,
      currencyDisplay: store.currencyDisplay,
      currencySign: initialCurrencySign,
    });
  });

  // New Test for CurrencyStore.spec.ts

  it("6. should skip updating specific properties when undefined in payload", () => {
    // Arrange: Set initial values for the two properties we want to skip updating
    // This ensures the "false" branch is hit and state remains constant.
    const initialNegativeZero = store.negativeZero; // Line 59-61
    const initialCurrencySign = store.currencySign; // Line 66

    // Act: Update all properties EXCEPT negativeZero and currencySign.
    // This forces the 'if' condition to be false for those two lines.
    store.updateNumberFormat({
      minPrecision: 10,
      maxPrecision: 10,
      thousandsSeparator: false,
      useBankersRounding: true,
      currency: "GBP",
      currencyDisplay: "code" as const,
    });

    // Assert: The skipped properties must retain their initial value.
    expect(store.negativeZero).toBe(initialNegativeZero);
    expect(store.currencySign).toBe(initialCurrencySign);

    // Assert: The updated properties must have changed.
    expect(store.minPrecision).toBe(10);
    expect(store.currency).toBe("GBP");
  });

  // COVERS LINE 61: Update negativeZero explicitly to hit the true branch
  it("7. should update negativeZero property when explicitly provided", () => {
    // Arrange: Get initial value
    const initialNegativeZero = store.negativeZero;

    // Act: Update negativeZero to the opposite of its current value
    store.updateNumberFormat({
      negativeZero: !initialNegativeZero,
    });

    // Assert: The property should have changed
    expect(store.negativeZero).toBe(!initialNegativeZero);

    // Verify it's reflected in the computed property
    expect(store.numberFormat.negativeZero).toBe(!initialNegativeZero);
  });
});