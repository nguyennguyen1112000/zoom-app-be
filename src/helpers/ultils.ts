/* eslint-disable prettier/prettier */
export const assignPartialsToThis = (
  _this: { [key: string]: any },
  partials: Partial<{ [key: string]: any }>,
) => {
  for (const key in partials) {
    if (partials[key] != null) {
      _this[key] = partials[key];
    }
  }
};
