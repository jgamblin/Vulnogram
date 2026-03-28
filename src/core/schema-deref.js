// JSON Schema $ref dereferencer
// Resolves internal #/definitions/... references recursively

export function derefSchema(schema, maxDepth = 10) {
  const definitions = schema.definitions || {};
  const seen = new Set();

  function resolve(node, depth) {
    if (!node || typeof node !== "object" || depth > maxDepth) return node;
    if (Array.isArray(node)) return node.map((item) => resolve(item, depth));

    // Handle $ref
    if (node.$ref && typeof node.$ref === "string") {
      const ref = node.$ref;

      // Only resolve internal refs (#/definitions/...)
      if (!ref.startsWith("#/definitions/")) {
        // External ref — return node without $ref
        const { $ref, ...rest } = node;
        return resolve(rest, depth);
      }

      // Circular reference guard
      const refKey = `${ref}@${depth}`;
      if (seen.has(ref) && depth > 5) {
        const { $ref, ...rest } = node;
        return rest;
      }
      seen.add(ref);

      // Resolve the definition
      const defName = ref.replace("#/definitions/", "");
      const definition = definitions[defName];
      if (!definition) {
        const { $ref, ...rest } = node;
        return resolve(rest, depth);
      }

      // Merge: node properties override definition properties
      const { $ref: _, ...nodeRest } = node;
      const resolved = { ...resolve(definition, depth + 1), ...nodeRest };

      // Merge properties objects if both exist
      if (definition.properties && nodeRest.properties) {
        resolved.properties = {
          ...resolve(definition.properties, depth + 1),
          ...resolve(nodeRest.properties, depth + 1),
        };
      }

      // Merge required arrays
      if (definition.required && nodeRest.required) {
        resolved.required = [
          ...new Set([...definition.required, ...nodeRest.required]),
        ];
      }

      seen.delete(ref);
      return resolved;
    }

    // Recursively resolve all properties
    const result = {};
    for (const [key, value] of Object.entries(node)) {
      if (key === "definitions") {
        // Don't include raw definitions in output
        continue;
      }
      result[key] = resolve(value, depth);
    }
    return result;
  }

  return resolve(schema, 0);
}
