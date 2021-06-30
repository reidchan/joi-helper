import "reflect-metadata";
import { Validate, validate } from "../src";
import { Required, SchemaOptions } from "../src/decorators/BaseDecorators";

class Inner {
  @Required()
  name2: string;
}

class Outer {
  @Required()
  inner: Inner;
  @Required({ message: '名称必传' })
  name: string;
}

async function main() {
  const t = {
    name: 'outter',
    // inner: {
    //   name: 11
    // }
  };
  await validate(Outer, t);
}

main().catch(console.log);
