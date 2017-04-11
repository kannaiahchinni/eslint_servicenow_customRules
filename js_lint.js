/**
 * @fileoverview Rule to flag references to undeclared variables.
 * @author Karunakar Medamoni
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


            "BinaryExpression:exit" (node) {

                //console.log(node.object.operator);



            },

            // alert statements removal 

            "Identifier:exit" (node) {

                if (node && node.name === "alert") {

                    context.report(node, " Don't use alert statements in code. Use GlideDialogWindow for popups ");

                }

            },


            // added validation for sys_id hardcodes in code 
            "Literal:exit" (node) {

                var regex = /[0-9a-z]{32}/;

                if (node && regex.test(node.value)) {
                    context.report(node, " don't use sys_id in code");
                }

            },

            "CallExpression:exit" (node) {

                 
                if (node.callee && node.callee.name == 'eval') {

                    context.report(node, 'Do not use eval() function... Use GlideEvaluator ');         

                }

                  
                if (node.callee && node.callee.name == "gel") {   
                    context.report(node, 'Do not use gel in client side code');   
                }

                 
                if (node.callee && node.callee.name == "jQuery") {   
                    context.report(node, 'Do not use gel in client side code');   
                }

                if (node.callee.object && node.callee.object.name === "document") {

                    context.report(node, "Dont use document object for DOM manipulation");
                }

                if (node.callee.property != null && node.callee.property.name == "getXMLWait") {

                      
                    context.report(node.callee, 'Please change getXMLWait to getXML with a callback');

                      
                }  
                if (node.callee.property != null && node.callee.property.name === "log") {  

                    context.report(node.callee.property, 'Please remove log statements');

                      
                }      
                if (node.callee && node.callee.name === '$j') {

                        
                    context.report(node, 'Do not use $j object for DOM manipulation');    
                }

                if (node.callee.object && node.callee.object.name === 'current' && node.callee.property.name == 'update') {    

                       
                    context.report(node.callee, 'GlideAjax. Minimize number of server calls by using one server side call. ');  
                }


                if (node.callee.object && node.callee.object.name === "gs" && node.callee.property.name === "debug") {   
                    context.report(node, 'gs.debug statements should not be used');  
                }

                if (node.callee.object && node.callee.object.name === "gs" && node.callee.property.name === "log") {   
                    context.report(node, 'gs.log statements should not be used');  
                }

                if (node.callee.object && node.callee.object.name === "gs" && node.callee.property.name === "info") {   
                    context.report(node, 'gs.info statements should not be used');  
                }



            },

            "MemberExpression:exit" (node) {      
                if (node.type === 'MemberExpression' && node.object.type === 'Identifier' && node.object.name === 'g_form' && node.property.type === 'Identifier' && node.property.name == 'setValue') {      
                    context.report(node, 'setValue by providing both value and displayValue to reduce second server call');    
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