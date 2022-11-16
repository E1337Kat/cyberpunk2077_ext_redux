import {
  IO,
} from "fp-ts/lib/IO";

export type Effect<F extends () => void> = IO<F>;
