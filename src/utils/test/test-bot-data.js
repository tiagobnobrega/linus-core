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
      tokenizers: [],
      ignoreTokens: null,
      onEnter: null,
    },
    {
      id: 'GET_TOPIC_TARGET_INTERACTION',
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
      topicId: 'GET_TOPIC_TARGET_INTERACTION',
      id: 'i1',
      condition: 'c=> true',
      priority: -99,
      actions: [],
    },
    {
      botId: 'test-bot',
      topicId: 'GET_TOPIC_TARGET_INTERACTION',
      id: 'i2',
      condition: 'c=> false',
      priority: 99,
      actions: [],
    },
    {
      botId: 'test-bot',
      topicId: 'GET_TOPIC_TARGET_INTERACTION',
      id: 'target-interaction',
      condition: 'c=> true',
      priority: 0,
      actions: [],
    },
    {
      botId: 'test-bot',
      topicId: 'ROOT',
      id: 'fallback',
      condition: 'c=> true',
      priority: -99,
      actions: [
        {
          steps: [
            {
              feedback: {
                type: 'REPLY',
                payload: {
                  type: 'text',
                  content: "Sorry. I didn't understand that",
                },
              },
            },
          ],
        },
      ],
    },
    {
      botId: 'test-bot',
      topicId: 'ROOT',
      id: 'hi',
      condition: 'c=> !!c.intents.hi',
      actions: [
        {
          steps: [
            {
              feedback: {
                type: 'REPLY',
                payload: {
                  type: 'text',
                  content: 'Hi, how may I assist You ?',
                },
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
      condition: 'c=> !!c.intents.hiFunction',
      actions: [
        {
          steps: [
            {
              feedback: `() => ({
                type: 'REPLY',
                payload: { type: 'text', content: 'Hi, how may I assist You ?' },
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
      condition: 'c=> !!c.intents.movieSuggestion',
      actions: [
        {
          steps: [
            {
              feedback: {
                type: 'SET_TOPIC',
                payload: {
                  topicId: 'MOVIE_SUGGESTION',
                  runTargetTopicInteractions: true,
                },
                meta: {
                  flowActions: ['BREAK', 'RESOLVE_AGAIN'],
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
      id: 'incomplete_data',
      condition: 'c=> !c.entities.movie_genre || !c.entities.movie_quality',
      actions: [
        {
          condition: 'c=> !c.entities.movie_genre && !c.entities.movie_quality',
          steps: [
            {
              feedback: {
                type: 'REPLY',
                payload: {
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
                payload: {
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
                payload: {
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
      actions: [
        {
          condition:
            'c=> c.entities.movie_genre[0] ==="horror" && c.entities.movie_quality[0]==="good"',
          steps: [
            {
              feedback: {
                type: 'REPLY',
                payload: {
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
                payload: {
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
                payload: {
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
                payload: {
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
