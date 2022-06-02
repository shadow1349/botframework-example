import {
  ActivityHandler,
  ConversationState,
  StatePropertyAccessor,
  UserState,
} from 'botbuilder';
import { Dialog, DialogState } from 'botbuilder-dialogs';
import { PizzaOrderingDialog } from './pizza.dialog';

export class TurnBot extends ActivityHandler {
  private dialog: Dialog;
  private conversationState: ConversationState;
  private userState: UserState;
  private dialogState: StatePropertyAccessor<DialogState>;

  constructor(
    conversationState: ConversationState,
    userState: UserState,
    dialog: Dialog
  ) {
    super();

    this.conversationState = conversationState;
    this.userState = userState;
    this.dialog = dialog;
    this.dialogState =
      this.conversationState.createProperty<DialogState>('DialogState');

    // See https://aka.ms/about-bot-activity-message to learn more about the message and other activity types.
    this.onMessage(async (context, next) => {
      await (this.dialog as PizzaOrderingDialog).run(context, this.dialogState);
      // By calling next() you ensure that the next BotHandler is run.
      await next();
    });

    this.onMembersAdded(async (context, next) => {
      const membersAdded = context.activity.membersAdded;
      const welcomeText = 'Hello and welcome!';
      for (const member of membersAdded) {
        if (member.id !== context.activity.recipient.id) {
          await (this.dialog as PizzaOrderingDialog).run(
            context,
            this.dialogState
          );
        }
      }
      // By calling next() you ensure that the next BotHandler is run.
      await next();
    });
  }

  /**
   * Override the ActivityHandler.run() method to save state changes after the bot logic completes.
   */
  public async run(context): Promise<void> {
    await super.run(context);

    // Save any state changes. The load happened during the execution of the Dialog.
    await this.conversationState.saveChanges(context, false);
    await this.userState.saveChanges(context, false);
  }
}
