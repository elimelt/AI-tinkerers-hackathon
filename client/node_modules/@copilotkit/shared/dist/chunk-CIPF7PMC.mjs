// src/utils/json-schema.ts
function actionParametersToJsonSchema(actionParameters) {
  let parameters = {};
  for (let parameter of actionParameters || []) {
    parameters[parameter.name] = convertAttribute(parameter);
  }
  let requiredParameterNames = [];
  for (let arg of actionParameters || []) {
    if (arg.required !== false) {
      requiredParameterNames.push(arg.name);
    }
  }
  return {
    type: "object",
    properties: parameters,
    required: requiredParameterNames
  };
}
function convertAttribute(attribute) {
  var _a, _b, _c;
  switch (attribute.type) {
    case "string":
      return {
        type: "string",
        description: attribute.description,
        ...attribute.enum && { enum: attribute.enum }
      };
    case "number":
    case "boolean":
      return {
        type: attribute.type,
        description: attribute.description
      };
    case "object":
    case "object[]":
      const properties = (_a = attribute.attributes) == null ? void 0 : _a.reduce(
        (acc, attr) => {
          acc[attr.name] = convertAttribute(attr);
          return acc;
        },
        {}
      );
      const required = (_b = attribute.attributes) == null ? void 0 : _b.filter((attr) => attr.required !== false).map((attr) => attr.name);
      if (attribute.type === "object[]") {
        return {
          type: "array",
          items: {
            type: "object",
            ...properties && { properties },
            ...required && required.length > 0 && { required }
          },
          description: attribute.description
        };
      }
      return {
        type: "object",
        description: attribute.description,
        ...properties && { properties },
        ...required && required.length > 0 && { required }
      };
    default:
      if ((_c = attribute.type) == null ? void 0 : _c.endsWith("[]")) {
        const itemType = attribute.type.slice(0, -2);
        return {
          type: "array",
          items: { type: itemType },
          description: attribute.description
        };
      }
      return {
        type: "string",
        description: attribute.description
      };
  }
}

export {
  actionParametersToJsonSchema
};
//# sourceMappingURL=chunk-CIPF7PMC.mjs.map