/**
 * A utility type that creates a new type based on the provided type `T`,
 * where all properties are optional and read-only.
 *
 * This type is a combination of the `Readonly` and `Partial` utility types.
 * It allows all properties of the given type to be optionally defined,
 * while ensuring that once set, they cannot be modified.
 *
 * Use this type when you need to describe an object whose properties
 * might or might not be present and should remain immutable if defined.
 *
 * @template T The type for which this utility type will create a read-only, partial version.
 */
export type ReadonlyPartial<T> = Readonly<Partial<T>>;

/**
 * A utility type that represents a partial mapping of keys to their corresponding values.
 *
 * The `PartialRecord` type allows you to define an object where the keys are derived
 * from the union of keys specified by `T`, and the values are of type `K`. The `Partial`
 * utility ensures that all keys within the given record are optional.
 *
 * @template T - A union type representing the possible keys of the record. It extends
 *               `string | number | symbol`.
 * @template K - The type of the values associated with the keys in the record.
 */
export type PartialRecord<T extends string | number | symbol, K> = Partial<Record<T, K>>;

export type SaveEntityStatus = "idle" | "saving" | "saved" | "error";
