/**
 * @fileoverview Rule to disallow fully qualified java package names
 */
 "use strict";

 //------------------------------------------------------------------------------
 // Helpers
 //------------------------------------------------------------------------------
const GLIDE_API_PREFIXES = ["Packages.com.glide", "Packages.com.glideapp", "Packages.com.snc"];
function isFullyQualified(node) {

}

 //------------------------------------------------------------------------------
 // Rule Definition
 //------------------------------------------------------------------------------
module.exports = {
    meta: {
        docs: {
            description: "Do not use fully qualified java package to use glide API",
            category: "Best Practices",
            recommended: true
        },
        schema: []
    },
    create: function(context) {
        return {
            FunctionDeclaration(node) {
                context.report(node, 'Do not use template literals');
            }
        };
    }
};
