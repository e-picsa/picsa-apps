export default {
  multipass: true,
  plugins: [
    {
      name: 'preset-default',
      params: {
        overrides: {
          // Keep viewBox for correct scaling when width/height stripped
          removeViewBox: false,
        },
      },
    },
  ],
};
