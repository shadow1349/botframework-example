import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as cors from 'cors';
import {
  CloudAdapter,
  ConfigurationServiceClientCredentialFactory,
  ConversationState,
  createBotFrameworkAuthenticationFromConfiguration,
  MemoryStorage,
  UserState,
} from 'botbuilder';
import { TurnBot } from './app/bot';
import { PizzaOrderingDialog } from './app/pizza.dialog';
import { environment } from './environments/environment.prod';

const app = express();

app.use(cors());
app.use(bodyParser.json());

app.listen(environment.port, () => {
  console.log('PIZZA BOT LISTENING ON PORT ', environment.port);
});

const credentialsFactory = new ConfigurationServiceClientCredentialFactory({
  MicrosoftAppId: '',
  MicrosoftAppPassword: '',
});

const botFrameworkAuthentication =
  createBotFrameworkAuthenticationFromConfiguration(null, credentialsFactory);

const adapter = new CloudAdapter(botFrameworkAuthentication);

// Catch-all for errors.
const onTurnErrorHandler = async (context, error) => {
  // This check writes out errors to console log .vs. app insights.
  // NOTE: In production environment, you should consider logging this to DataDog or something
  console.error(`\n [onTurnError] unhandled error: ${error}`);

  // Send a trace activity, which will be displayed in Bot Framework Emulator
  await context.sendTraceActivity(
    'OnTurnError Trace',
    `${error}`,
    'https://www.botframework.com/schemas/error',
    'TurnError'
  );

  // Send a message to the user
  await context.sendActivity('The bot encountered an error or bug.');
  await context.sendActivity(
    'To continue to run this bot, please fix the bot source code.'
  );
};

adapter.onTurnError = onTurnErrorHandler;

const memoryStorage = new MemoryStorage();
const conversationState = new ConversationState(memoryStorage);
const userState = new UserState(memoryStorage);
const dialog = new PizzaOrderingDialog();

const bot = new TurnBot(conversationState, userState, dialog);

app.post('/api/messages', async (req, res) => {
  await adapter.process(req, res, async (context) => {
    await bot.run(context);
  });
});
