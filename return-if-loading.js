/**
 * @fileoverview Enforce that first statement of an onChange function must be 'if' and must return if isLoading is true
 * @author Arun Rahul
 */
"use strict";

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

module.exports = {
    meta: {
        docs: {
            description: "Enforce that first statement of an onChange function must return if isLoading is true",
            category: "Fill me in",
            recommended: false
        },
        schema: []
    },

    create: function(context) {

          let source = context.getSourceCode();
          function hasProperIf(node) {
              let proper = false;
              if( node.body.length !== 0){
                let first = node.body[0];
                proper = isProperIf(first);
              }
              return proper;

          }

          function isProperIf (node) {
              let result = false;
              if(node.type == "IfStatement" && node.test && node.consequent) {
                 let expression = source.getText(node.test);
                 return expression.indexOf("isLoading") >= 0 && isOnlyReturn(node.consequent);
              }
              return result;
          }

          function isOnlyReturn (node) {
              return (node.body && node.body.length == 1 && node.body[0].type == "ReturnStatement") || node.type == "ReturnStatement";
          }

          //----------------------------------------------------------------------
          // Public
          //----------------------------------------------------------------------

          return {
              FunctionDeclaration(node) {
                 if(node.id.name == "onChange" && node.params.filter(id => id.name == "isLoading").length >= 1) {
                   let block = node.body;
                   if (!hasProperIf(block)) {
                       context.report(node, 'first statement of an onChange function must return if isLoading is true');
                   }
                 }
             }

          };
    }
};
