import "reflect-metadata";
import { Validate, validate } from "../src";
import { Required, SchemaOptions } from "../src/decorators/BaseDecorators";
import Joi from 'joi';

class Inner {
  @Required({ message: '名称必传' })
  name2: string;
}

class Outer {
  @Required({ message: 'gg' })
  inner: Inner;
  @Required({ message: '名称必传' })
  name: string;
}

async function main() {
  const t = {
    // name: 'outter',
    inner: {
      // name2: '11'
    }
  };
  const schema = Joi.object({
    inner: Joi.object().required().messages({ 'any.required': '必传1' }).keys({
      name: Joi.string().required()
    })
  })
  const result = schema.validate(t);
  console.log('result', result);
  // await validate(Outer, t);
}

main().catch(console.log);
