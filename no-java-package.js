/**
 * @fileoverview Restricts the use of fully qualified java packages while using Glide API
 * @author Arun Rahul
 */
"use strict";

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

module.exports = {
    meta: {
        docs: {
            description: "Restricts the use of fully qualified java packages while using Glide API",
            category: "Best Practices",
            recommended: true
        },
        schema: []
    },

    create: function(context) {

        const GLIDE_API_PREFIXES = ["packages.com.glide", "packages.com.glideapp", "packages.com.snc"];
        const source = context.getSourceCode();

        //----------------------------------------------------------------------
        // Helpers
        //----------------------------------------------------------------------
        function isGlidePackage (expression) {
            expression = expression.toLowerCase();
            for (let i = 0; i < GLIDE_API_PREFIXES.length; i++) {
                if(expression.indexOf(GLIDE_API_PREFIXES[i]) >= 0) {
                    return true;
                }
            }
            return false;
        }


        //----------------------------------------------------------------------
        // Public
        //----------------------------------------------------------------------

        return {
            "MemberExpression"(node) {
                if(node.parent.type != "MemberExpression" && isGlidePackage(source.getText(node))) {
                    context.report(node, 'Do not use fully qualified java packages while using Glide API. Prefer javascript Glide objects instead.');
                }
            }
        };
    }
};
