import  OpenAI  from 'openai';
import { AssetCache } from "@11ty/eleventy-fetch";

export default async function () {
  let qotd = new AssetCache("qotd");

  if (qotd.isCacheValid("1d")) {
    return qotd.getCachedValue();
  }

  try {
    const client = new OpenAI({
      apiKey: process.env['OPENAI_API_KEY'], // This is the default and can be omitted
    });

    const completion = await client.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "user",
          content: "Tell me a rare inspirational quote and its author",
        },
      ],
    });

    const quote = {
      quote: completion.data.choices[0].message.content,
    };

    console.log(quote);

    await qotd.save(quote, "json");

    return quote;
  } catch (e) {
    console.log(e);
    return {
      quote:
        "The illiterate of the 21st century will not be those who cannot read and write, but those who cannot learn, unlearn, and relearn. - Alvin Toffler",
    };
  }
}
