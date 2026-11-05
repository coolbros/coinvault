module.exports = {
  SaveFormat: { JPEG: 'jpeg', PNG: 'png' },
  manipulateAsync: jest.fn().mockImplementation(async (uri, actions, options) => {
    return {
      uri: `${uri}_processed.jpg`,
      width: 1024,
      height: 1024,
    };
  }),
};
