export * from './decorators/BaseDecorators'
export * from './decorators/FieldDescription'
export * from './utils/BuilderUtils'
import Joi from 'joi';

function getJoi(type, properties) {
  let joi = getJoiType(type);
  const messages = {};
  for (const propertyKey of Object.keys(properties)) {
    const propertyValue = properties[propertyKey];
    switch (propertyKey) {
      case 'required':
        joi = joi.required();
        break;
      case 'requiredMessage':
        messages['any.required'] = propertyValue;
        break;
    }
  }
  joi = joi.messages(messages);
  return joi;
}

function getJoiType(type) {
  switch (type) {
    case 'String':
      return Joi.string();
    case 'Object':
      return Joi.object();
  }
}

function buildJoiRoot(metadata) {
  const obj = buildJoi(metadata);
  const schema = Joi.object(obj);
  return schema;
}

function buildJoiChildren(object) {
  const metadata = getMetadata(object.designType);
  console.log('metadata', metadata);
  if (!metadata) {
    return Joi.any();
  }
  console.log('buildJoiChildren metadata', metadata);
  const joi = getJoi('Object', object);
  const obj = buildJoi(metadata);
  const schema = joi['keys'](obj);
  return schema;
}

function buildJoi(metadata) {
  const root: any = {
  };
  const fieldKeys = Object.keys(metadata);
  for (const fieldKey of fieldKeys) {
    const primitives = ['String', 'Boolean', 'Number', 'Array', 'Date'];
    const designType = metadata[fieldKey].designType;
    console.log('designType.name', designType.name);
    if (primitives.includes(designType.name)) {
      switch (designType.name) {
        case 'String':
          const joiObj = getJoi('String', metadata[fieldKey]);
          root[fieldKey] = joiObj;
          break;
      }
    } else if (designType.name === 'Object') {
      const joi = Joi.any();
      root[fieldKey] = joi;
    } else {
      const joi = buildJoiChildren(metadata[fieldKey]);
      root[fieldKey] = joi;
    }
  }
  return root;
}

export function validate(tp, data) {
  let metadata = getMetadata(tp);
  const schema = buildJoiRoot(metadata);
  const result = schema.validate(data);
  console.log('result', result);
  if (result.error) {
    const errorInfo = result.error.details[0].message;
    console.log('result.error.details[0]', result.error.details[0]);
    console.log('errorInfo', errorInfo);
  }
}

export function getMetadata(obj: any) {
  /**
   * Gets the metadata for the current class,
   * Returns a key value object with all base classes and inheriting classes
   */
  const retVal = Reflect.getMetadata('validate:fields', obj.prototype);
  if (!retVal) {
    return;
  }
  return getMetadataFromObject(obj, retVal);
}


/**
 * Extracts metadata for a particular object, aware if that object extends another objects,
 * an joins the metadata properties accordingly ,
 * Method checks recursively through the same object to find super-class metadata
 * @param obj Object class to extract metadata for
 * @param treeMetadata  Metadata registered with Reflect
 */
function getMetadataFromObject(obj: any, treeMetadata: any) {
  /**
   * Current class name
   */
  const name = obj;
  /**
   * Get prototype an prototype name of the class
   * to check if it extends from another class
   */
  const proto = Object.getPrototypeOf(obj);
  const protoName = proto.name;
  /**
   * Current class metadata
   * WIll override if necessary the super class metadata
   */
  const existingObject = treeMetadata.get(name) || {};
  if (!!protoName && protoName !== "Object") {
    const existingFields = existingObject.fields || {};
    let superMetadata = getMetadataFromObject(proto, treeMetadata);
    superMetadata = { ...superMetadata };
    Object.keys(existingFields).forEach((x) => {
      if (!superMetadata[x]) {
        /**
         * If a property exist on the current class but not on the super class
         * insert the property
         */
        superMetadata[x] = existingFields[x];
      } else {
        /**
         * Override the super class metadata for that field with the latest class field metadata
         */
        superMetadata[x] = { ...superMetadata[x], ...existingFields[x] };
      }
    });
    return superMetadata;
  } else {
    return existingObject.fields || {};
  }
}