// Custom webpack loader to fix recyclableRender issue
module.exports = function(source) {
  // Fix the recyclableRender export issue
  if (source.includes('export { render, staticRenderFns, recyclableRender, components }')) {
    source = source.replace(
      /export\s*{\s*render,\s*staticRenderFns,\s*recyclableRender,\s*components\s*}/g,
      'var recyclableRender; var components; export { render, staticRenderFns }'
    );
  }
  
  return source;
};