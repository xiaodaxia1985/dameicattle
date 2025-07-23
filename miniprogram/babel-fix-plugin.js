// Babel plugin to fix recyclableRender issue
module.exports = function() {
  return {
    visitor: {
      ExportNamedDeclaration(path) {
        if (path.node.specifiers) {
          const hasRecyclableRender = path.node.specifiers.some(spec => 
            spec.exported && spec.exported.name === 'recyclableRender'
          );
          
          if (hasRecyclableRender) {
            // Remove recyclableRender from exports and add it as undefined variable
            path.node.specifiers = path.node.specifiers.filter(spec => 
              !(spec.exported && spec.exported.name === 'recyclableRender')
            );
            
            // Add recyclableRender as undefined variable
            const t = require('@babel/types');
            const recyclableRenderDeclaration = t.variableDeclaration('var', [
              t.variableDeclarator(t.identifier('recyclableRender'))
            ]);
            
            path.insertBefore(recyclableRenderDeclaration);
          }
        }
      }
    }
  };
};