export default {
  '**/*.{js,mjs,ts,tsx}': ['eslint --fix', 'prettier --write'],
  '**/*.{json,md,css}': ['prettier --write']
};
