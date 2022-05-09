const mergeStyledAttrsWithNodeAttrs = require('../mergeStyledAttrsWithNodeAttrs');
const getAsProp = require('../getAsProp');
const { inspect } = require('util');
const { cloneDeep } = require('lodash');

module.exports = (context, styledComponents, rule, name) => ({
  JSXElement(node) {
    const func = (inspectee) => name.includes('scope') && context.report(node, inspect(inspectee || node));
    try {
      let elementName = node.openingElement.name.name;

      if (!elementName && node.openingElement.name.type === 'JSXMemberExpression') {
        elementName = `${node.openingElement.name.object.name}.${node.openingElement.name.property.name}`;
      }

      const styledComponent = styledComponents[elementName];

      if (styledComponent) {
        const { tag, attrs } = styledComponent;
        const originalNodeAttr = node.openingElement.attributes;
        const originalNodeName = cloneDeep(node.openingElement.name);

        try {
          const allAttrs = mergeStyledAttrsWithNodeAttrs(attrs, originalNodeAttr);
          const asProp = getAsProp(allAttrs);
          node.openingElement.attributes = allAttrs;

          // Convert JSXMemberExpression (object AST identifier) to JSXIdentifier, so it'll be properly handled by eslint-plugin-jsx-a11y plugin
          node.openingElement.name = {
            type: 'JSXIdentifier',
            name: asProp || tag,
            start: originalNodeName.start,
            end: originalNodeName.end,
            loc: originalNodeName.loc,
            range: originalNodeName.range,
            parent: originalNodeName.parent,
          };

          rule.create(context).JSXElement(node);
        } finally {
          node.openingElement.name = originalNodeName;
          node.openingElement.attributes = originalNodeAttr;
        }
      }
    } catch {}
  },
});
