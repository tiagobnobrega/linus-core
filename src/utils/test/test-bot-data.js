/* eslint no-template-curly-in-string: 0 */

module.exports = {
  bot: {
    id: 'test-bot',
    globalTokenizers: ['globalTokenizer'],
    description: 'Test bot',
    rootTopic: 'ROOT',
  },
  topics: [
    {
      id: 'ROOT',
      botId: 'test-bot',
      useGlobalTokenizers: true,
      tokenizers: ['rootGlobalTokenizer'],
      ignoreTokens: null,
      onEnter: null,
    },
    {
      id: 'MOVIE_SUGGESTION',
      botId: 'test-bot',
      useGlobalTokenizers: true,
      tokenizers: [],
      ignoreTokens: null,
      onEnter: null,
    },
    {
      id: 'LOCAL_TOKENIZER',
      botId: 'test-bot',
      useGlobalTokenizers: true,
      tokenizers: [],
      ignoreTokens: null,
      onEnter: null,
    },
  ],

  interactions: [
    {
      botId: 'test-bot',
      topicId: 'ROOT',
      id: 'hi',
      actons: [
        {
          condition: 'c=> !!c.intents.hi',
          steps: [
            {
              feedback: {
                type: 'REPLY',
                data: { type: 'text', content: 'Hi, how may I assist You ?' },
              },
            },
          ],
        },
      ],
    },
    {
      botId: 'test-bot',
      topicId: 'ROOT',
      id: 'hiFunction',
      actons: [
        {
          condition: 'c=> !!c.intents.hiFunction',
          steps: [
            {
              feedback: `() => ({
                type: 'REPLY',
                data: { type: 'text', content: 'Hi, how may I assist You ?' },
              })`,
            },
          ],
        },
      ],
    },
    {
      botId: 'test-bot',
      topicId: 'ROOT',
      id: 'movie_suggestion',
      actons: [
        {
          condition: 'c=> !!c.intents.movieSuggestion',
          steps: [
            {
              feedback: {
                type: 'CHANGE_TOPIC',
                topicId: 'MOVIE_SUGGESTION',
                runTargetTopicInteractions: true,
              },
            },
          ],
        },
      ],
    },
    {
      botId: 'test-bot',
      topicId: 'MOVIE_SUGGESTION',
      id: 'incomplete_data',
      condition: 'c=> !c.entities.movie_genre || !c.entities.movie_quality',
      actons: [
        {
          condition: 'c=> !c.entities.movie_genre && !c.entities.movie_quality',
          steps: [
            {
              feedback: {
                type: 'REPLY',
                data: {
                  type: 'TEXT',
                  content:
                    'What kind of movie would you like to watch? And should it be a good or a bad movie ?',
                },
              },
            },
          ],
        },
        {
          condition: 'c=> c.entities.movie_genre && !c.entities.movie_quality',
          steps: [
            {
              feedback: {
                type: 'REPLY',
                data: {
                  type: 'TEXT',
                  content:
                    'Do you want a good or a bad ${c.entities.movie_genre} movie ?',
                },
              },
            },
          ],
        },

        {
          condition: 'c=> !c.entities.movie_genre && c.entities.movie_quality',
          steps: [
            {
              feedback: {
                type: 'REPLY',
                data: {
                  type: 'TEXT',
                  content:
                    'What kind of ${c.entities.movie_quality} movie  do You wish to watch?',
                },
              },
            },
          ],
        },
      ],
    },

    {
      botId: 'test-bot',
      topicId: 'MOVIE_SUGGESTION',
      id: 'complete_data',
      condition: 'c=> c.entities.movie_genre && c.entities.movie_quality',
      actons: [
        {
          condition:
            'c=> c.entities.movie_genre[0] ==="horror" && c.entities.movie_quality[0]==="good"',
          steps: [
            {
              feedback: {
                type: 'REPLY',
                data: {
                  type: 'TEXT',
                  content: 'You should watch The Shining',
                },
              },
            },
          ],
        },
        {
          condition:
            'c=> c.entities.movie_genre[0] ==="horror" && c.entities.movie_quality[0]==="bad"',
          steps: [
            {
              feedback: {
                type: 'REPLY',
                data: {
                  type: 'TEXT',
                  content: 'You should watch Final Destination',
                },
              },
            },
          ],
        },

        {
          condition:
            'c=> c.entities.movie_genre[0] ==="action" && c.entities.movie_quality[0]==="good"',
          steps: [
            {
              feedback: {
                type: 'REPLY',
                data: {
                  type: 'TEXT',
                  content: 'You should watch Mission Impossible',
                },
              },
            },
          ],
        },
        {
          condition:
            'c=> c.entities.movie_genre[0] ==="action" && c.entities.movie_quality[0]==="bad"',
          steps: [
            {
              feedback: {
                type: 'REPLY',
                data: {
                  type: 'TEXT',
                  content: 'You should watch Taxi',
                },
              },
            },
          ],
        },
      ],
    },
  ],
};
