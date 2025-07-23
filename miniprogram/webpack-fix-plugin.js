// Webpack plugin to fix recyclableRender issue in uni-app
class FixRecyclableRenderPlugin {
  apply(compiler) {
    compiler.hooks.normalModuleFactory.tap('FixRecyclableRenderPlugin', (factory) => {
      factory.hooks.afterResolve.tap('FixRecyclableRenderPlugin', (resolveData) => {
        if (resolveData.resource && resolveData.resource.includes('.vue')) {
          const originalCreateModule = factory.createModule;
          factory.createModule = function(data, callback) {
            const result = originalCreateModule.call(this, data, callback);
            if (result && result._source && result._source._value) {
              // Fix the recyclableRender export issue
              result._source._value = result._source._value.replace(
                /export\s*{\s*render,\s*staticRenderFns,\s*recyclableRender,\s*components\s*}/g,
                'export { render, staticRenderFns, components }; var recyclableRender;'
              );
            }
            return result;
          };
        }
      });
    });
  }
}

module.exports = FixRecyclableRenderPlugin;