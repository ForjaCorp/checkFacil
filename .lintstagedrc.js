export default {
  '**/*.{js,mjs,ts,tsx}': ['yarn eslint --fix', 'yarn prettier --write'],
  '**/*.{json,md,css}': ['yarn prettier --write']
};
