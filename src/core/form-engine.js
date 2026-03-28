// Form Engine — parses JSON Schema, renders progressive disclosure form

import { renderField } from "./renderers/index.js";
import { createSection, createChip, createChipBar } from "./section-manager.js";
import {
  setValue,
  getValue,
  getDocument,
  setDocument,
  subscribe,
} from "./state.js";

// Import all renderers to register them
import "./renderers/string.js";
import "./renderers/enum.js";
import "./renderers/boolean.js";
import "./renderers/array.js";
import "./renderers/object.js";

export class FormEngine {
  constructor(container, schema, options = {}) {
    this.container = container;
    this.schema = schema;
    this.options = options;
    this.sections = new Map();
    this.chips = new Map();
  }

  mount(initialValue = {}) {
    setDocument(initialValue);
    this.render();
  }

  render() {
    this.container.textContent = "";
    const doc = getDocument();

    // Determine the active schema branch
    // CVE schema uses oneOf at root for PUBLISHED/REJECTED states
    const activeSchema = this.resolveSchema(this.schema, doc);
    if (!activeSchema?.properties) return;

    const required = activeSchema.required || [];
    const properties = activeSchema.properties;

    // Separate top-level groups into required (always visible) and optional (chips)
    const requiredSections = [];
    const optionalSections = [];

    Object.entries(properties).forEach(([key, propSchema]) => {
      if (propSchema.options?.hidden) return;

      const isRequired = required.includes(key);
      const hasValue =
        doc[key] != null &&
        (typeof doc[key] !== "object" || Object.keys(doc[key]).length > 0);

      if (isRequired || hasValue || propSchema.type !== "object") {
        requiredSections.push({
          key,
          schema: propSchema,
          required: isRequired,
        });
      } else {
        optionalSections.push({ key, schema: propSchema });
      }
    });

    // Render required/populated sections
    requiredSections.forEach(({ key, schema: propSchema, required: isReq }) => {
      this.renderTopLevelField(key, propSchema, isReq);
    });

    // Render optional section chips
    if (optionalSections.length > 0) {
      const divider = document.createElement("div");
      divider.className = "border-t border-vg-200 dark:border-vg-700 mt-6 mb-4";
      this.container.appendChild(divider);

      const chipLabel = document.createElement("div");
      chipLabel.className =
        "text-xs font-medium text-vg-400 uppercase tracking-wider mb-2 dark:text-vg-500";
      chipLabel.textContent = "Add sections";
      this.container.appendChild(chipLabel);

      const chips = optionalSections.map(({ key, schema: propSchema }) => {
        const title = propSchema.title || key;
        return createChip(title, () => {
          // Initialize empty value and re-render
          const doc = getDocument();
          if (propSchema.type === "array") {
            doc[key] = [];
          } else {
            doc[key] = {};
          }
          setDocument(doc);
          this.render();
        });
      });

      this.container.appendChild(createChipBar(chips));
    }

    // Cmd+K hint
    const hint = document.createElement("div");
    hint.className =
      "mt-6 py-2 text-center text-xs text-vg-400 dark:text-vg-500";
    hint.textContent = "\u2318K to jump to any section";
    this.container.appendChild(hint);
  }

  renderTopLevelField(key, propSchema, isRequired) {
    const value = getValue(key);

    if (propSchema.type === "object" && propSchema.properties) {
      // Render as a collapsible section card
      const title = propSchema.title || key;
      const { section, body } = createSection(title, key);

      const innerRequired = propSchema.required || [];
      Object.entries(propSchema.properties).forEach(
        ([propKey, innerSchema]) => {
          if (innerSchema.options?.hidden) return;

          const fieldPath = `${key}.${propKey}`;
          const fieldValue = value?.[propKey];

          const fieldEl = renderField(
            innerSchema,
            fieldPath,
            fieldValue,
            (path, val) => {
              setValue(path, val);
            },
          );
          body.appendChild(fieldEl);
        },
      );

      this.container.appendChild(section);
    } else if (propSchema.type === "array") {
      // Render array as section card
      const title = propSchema.title || key;
      const { section, body } = createSection(title, key);

      const fieldEl = renderField(propSchema, key, value, (path, val) => {
        setValue(path, val);
      });
      body.appendChild(fieldEl);
      this.container.appendChild(section);
    } else {
      // Simple field — render inline
      const fieldEl = renderField(propSchema, key, value, (path, val) => {
        setValue(path, val);
      });
      this.container.appendChild(fieldEl);
    }
  }

  resolveSchema(schema, value) {
    // Handle oneOf — pick the matching branch based on current value
    if (schema.oneOf) {
      // For CVE schema, pick based on cveMetadata.state
      // Default to first option (PUBLISHED)
      return this.mergeOneOf(schema, schema.oneOf[0]);
    }
    return schema;
  }

  mergeOneOf(base, branch) {
    // Merge base schema properties with the selected oneOf branch
    const merged = { ...base };
    delete merged.oneOf;
    if (branch.properties) {
      merged.properties = {
        ...(merged.properties || {}),
        ...branch.properties,
      };
    }
    if (branch.required) {
      merged.required = [...(merged.required || []), ...branch.required];
    }
    return merged;
  }

  getValue() {
    return getDocument();
  }

  setValue(doc) {
    setDocument(doc);
    this.render();
  }
}
