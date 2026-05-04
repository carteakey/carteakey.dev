export default {
  eleventyComputed: {
    permalink(data) {
      if (data.item?.data?.hidden === true && !data.showHiddenContent) {
        return false;
      }

      return `${data.item.url}raw.txt`;
    },
  },
};
