import * as i from "io-ts-schema";
import { REDmodInfoType } from "../src/installers.types";

const REDmodInfoTypeSchema = {
    description: "REDmodInfoType JSON Schema",
    ...i.convert(REDmodInfoType)
};

console.log(JSON.stringify(REDmodInfoTypeSchema, null, 2));
