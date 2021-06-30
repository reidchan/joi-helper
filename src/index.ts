export * from './decorators/BaseDecorators'
export * from './decorators/FieldDescription'
export * from './utils/BuilderUtils'
import Joi from 'joi';

function getJoiString(properties) {
  console.log('properties', properties);
  delete properties.designType;
  let joi = Joi.string();
  const messages = {};
  for (const propertyKey of Object.keys(properties)) {
    console.log('propertyKey', propertyKey);
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

export function validate(tp, data) {
  let metadata = this.getMetadata(tp);
  const fieldKeys = Object.keys(metadata);
  const root: any = {
  };
  for (const fieldKey of fieldKeys) {
    const primitives = ['String', 'Boolean', 'Number', 'Array', 'Date'];
    const designType = metadata[fieldKey].designType;
    if (primitives.includes(designType.name)) {
      switch (designType.name) {
        case 'String':
          const joiObj = getJoiString(metadata[fieldKey]);
          root[fieldKey] = joiObj;
          break;
      }
    } else {
    }
  }
  const schema = Joi.object(root);
  const result = schema.validate(data);
  if (result.error) {
    const errorInfo = result.error.details[0].message;
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