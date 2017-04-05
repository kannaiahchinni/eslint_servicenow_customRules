/**
 * @fileoverview Rule to flag references to undeclared variables.
 * @author Mark Macdonald
 */
"use strict";

//------------------------------------------------------------------------------
// Helpers
//------------------------------------------------------------------------------

/**
 * Checks if the given node is the argument of a typeof operator.
 * @param {ASTNode} node The AST node being checked.
 * @returns {boolean} Whether or not the node is the argument of a typeof operator.
 */
function hasTypeOfOperator(node) {
    const parent = node.parent;

    //console.log(node.parent.property.name);
    //if(node.parent.property.name === "getRowCount")
    return parent.type === "UnaryExpression" && parent.operator === "typeof";
}

/**
    @find getRowCount is used on

**/

function findRowCount(reference) {

    console.log(reference);

    if (reference.identifier.parent.property != undefined && reference.identifier.parent.property.name === "getRowCount" && reference.identifier.parent.type == "MemberExpression") {
        return reference.identifier.name;
    }


}

function findGlideRecord(gr, reference) {

    if (reference.identifier.name === gr && reference.identifier.parent.init != undefined && reference.identifier.parent.init.type === "NewExpression" && reference.identifier.parent.init.callee != undefined && reference.identifier.parent.init.callee.name === "GlideRecord") {

        //console.log(reference);
        return true;

    } else {

        return false;

    }

}


function hasNextUsed(gr, reference) {

    if (reference.identifier.name === gr && reference.identifier.parent != undefined && reference.identifier.parent.property != undefined && reference.identifier.parent.property.name === "next" && reference.identifier.parent.type == "MemberExpression") {
        return true;
    } else {
        return false;
    }


}


//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

module.exports = {
    meta: {
        docs: {
            description: "disallow the use of undeclared variables unless mentioned in `/*global */` comments",
            category: "Variables",
            recommended: true
        },

        schema: [
            {
                type: "object",
                properties: {
                    typeof: {
                        type: "boolean"
                    }
                },
                additionalProperties: false
            }
        ]
    },

    create(context) {
        const options = context.options[0];
        var funcInfoStack = [];
        const considerTypeOf = options && options.typeof === true || false;


        return {


            "onCodePathStart": function (codePath, node) {
                funcInfoStack.push({
                    codePath: codePath,
                    node: node,
                    context: context
                });
            },

            Program(node) {
              // Empty scripts will have body length 0.
              if(node.body.length === 0) {
                context.report(node, "Client Scripts should not have an empty script field")
              }

              /* Check if VariableDeclaration is done on global scope */
              node.body.forEach(function(element) {
                if(element.type === "VariableDeclaration") {
              		context.report(element, "Do not declare variables in global scope");
                }
              })
            },

            /*
            Client-side code should not use GlideRecord
            If GlideRecord is used with new keyword, then this will throw the error.
            NOTE: isClientScript is placeholder right now. If this is client script(true)
            then this check should occur.
            */
            NewExpression(node) {
              if(node.callee.name === "GlideRecord" && isClientScript === true) {
                context.report(node, "Do not use GlideRecord in client script");
              }
            },
            /*  */


            "BinaryExpression:exit" (node) {

                console.log(node.object.operator);



            },

            "CallExpression:exit" (node) {

                 
                if (node.callee && node.callee.name == 'eval') {     
                    context.report(node, 'Do not use eval() function... Use GlideEvaluator ');         
                }

                if (node.callee.object && node.callee.object.name === "document") {

                    context.report(node, "Dont use document object for DOM manipulation");
                }

            },


            "FunctionDeclaration:exit" (node) {
                const globalScope = context.getScope();

                console.log(globalScope);

                var glideRef = [];
                var glideRefList = [];

                globalScope.references.forEach(ref => {

                    var result = findRowCount(ref);
                    if (result)
                        glideRef.push(result);

                });



                glideRef.forEach(gRef => {

                    var rowCount = 0;
                    var nextCount = 0;
                    globalScope.references.forEach(ref => {

                        if (findGlideRecord(gRef, ref)) {
                            rowCount++;
                        }

                        if (hasNextUsed(gRef, ref)) {
                            nextCount++;
                        }

                    });

                    var obj = {};
                    obj.name = gRef;
                    obj.rowCount = rowCount;
                    obj.nextCount = nextCount;

                    glideRefList.push(obj);

                });

                glideRefList.forEach(name => {

                    if (name.rowCount == 0)
                        context.report({
                            node: node,
                            message: name.name + " is not a GlideRecord reference.",
                            data: node
                        });


                    if (name.rowCount >= 0 && name.nextCount == 0)
                        context.report({
                            node: node,
                            message: name.name + " ; In place of getRowcount use glide aggregate to get result count",
                            data: node
                        });

                });



            }
        };
    }
};
