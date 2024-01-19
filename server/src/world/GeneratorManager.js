import {DefaultGenerator} from "./generators/DefaultGenerator.js";
import {FlatGenerator} from "./generators/FlatGenerator.js";
import {CustomGenerator} from "./generators/CustomGenerator.js";
import {SkyBlockGenerator} from "./generators/SkyBlockGenerator.js";

export const Generators = {
    default: DefaultGenerator,
    flat: FlatGenerator,
    custom: CustomGenerator,
    sky: SkyBlockGenerator
};