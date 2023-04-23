const { AssetCache } = require("@11ty/eleventy-fetch");

module.exports = async function () {
  let qotd = new AssetCache("qotd");

  if (qotd.isCacheValid("1d")) {
    // return cached data.
    return qotd.getCachedValue(); // a promise
  }

  try {
    const { Configuration, OpenAIApi } = require("openai");

    const configuration = new Configuration({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const openai = new OpenAIApi(configuration);

    const completion = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "user",
          content: "Tell me a rare inspirational quote and its author",
        },
      ],
    });

    quote = {
      quote: completion.data.choices[0].message.content,
    };

    console.log(quote);

    await qotd.save(quote, "json");

    return quote;
  } catch (e) {
    console.log(e);
    return {
      // my failure fallback 
      quote:
        "The illiterate of the 21st century will not be those who cannot read and write, but those who cannot learn, unlearn, and relearn. - Alvin Toffler",
    };
  }

};
