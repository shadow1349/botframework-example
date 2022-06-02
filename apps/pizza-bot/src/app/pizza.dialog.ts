import {
  ActionTypes,
  AttachmentLayoutTypes,
  CardFactory,
  StatePropertyAccessor,
  TurnContext,
} from 'botbuilder';
import {
  ActivityPrompt,
  ChoicePrompt,
  ComponentDialog,
  DialogSet,
  DialogState,
  DialogTurnStatus,
  ListStyle,
  TextPrompt,
  WaterfallDialog,
  WaterfallStepContext,
} from 'botbuilder-dialogs';

export const PIZZA_DIALOG_ID = 'PIZZA_DIALOG';
export const PIZZA_WATERFALL_DIALOG_ID = 'PIZZA_WATERFALL';
export const NAME_STEP_PROMPT_ID = 'NAME_STEP';
export const PIZZA_CHOICE_STEP_PROMPT_ID = 'PIZZA_CHOICE_STEP';
export const PIZZA_SIZE_CHOICE_STEP_PROMPT_ID = 'PIZZA_SIZE_CHOICE_STEP';
export const MORE_TOPPINGS_PROMPT = 'MORE_TOPPINGS';
export const SELECT_TOPPINGS_PROMPT = 'SELECT_TOPPINGS';

export class PizzaOrderingDialog extends ComponentDialog {
  constructor() {
    super();

    this.id = PIZZA_DIALOG_ID;

    this.addDialog(new TextPrompt(NAME_STEP_PROMPT_ID))
      .addDialog(
        new ActivityPrompt(PIZZA_CHOICE_STEP_PROMPT_ID, async (prompt) => true)
      )
      .addDialog(new ChoicePrompt(PIZZA_SIZE_CHOICE_STEP_PROMPT_ID))
      .addDialog(new ChoicePrompt(MORE_TOPPINGS_PROMPT))
      .addDialog(
        new ChoicePrompt(SELECT_TOPPINGS_PROMPT, async (prompt) => {
          const pineappleRgx = /pineapple/gi;
          const choice = prompt.recognized.value.value;

          const matched = pineappleRgx.test(choice);

          return !matched;
        })
      )
      .addDialog(
        new WaterfallDialog(PIZZA_WATERFALL_DIALOG_ID, [
          this.welcomeUserStep.bind(this),
          this.getNameStep.bind(this),
          this.choosePizzaStep.bind(this),
          this.choosePizzaSizeStep.bind(this),
          this.askForMoreToppingsStep.bind(this),
          this.selectAdditionalToppingsStep.bind(this),
          this.finishStep.bind(this),
        ])
      );

    this.initialDialogId = PIZZA_WATERFALL_DIALOG_ID;
  }

  public async run(
    context: TurnContext,
    accessor: StatePropertyAccessor<DialogState>
  ) {
    /**
     * We will create a dialog set with the current state property accessor. Remember, this contains
     * the current conversation state so if a conversation already exists with the current user we will
     * be able to pick up where we left off.
     */
    const dialogSet = new DialogSet(accessor);
    dialogSet.add(this);

    /**
     * We want to create a dialogContext and try to continue the dialog.
     */
    const dialogContext = await dialogSet.createContext(context);

    const results = await dialogContext.continueDialog();
    /**
     * If the current user trying to talk to the bot has no current conversation history with the dialog
     * in question then we will get a turn status of empty. We can use that information to start this dialog
     * fresh.
     */
    if (results.status === DialogTurnStatus.empty) {
      await dialogContext.beginDialog(this.id);
    }
  }

  private async welcomeUserStep(step: WaterfallStepContext) {
    await step.context.sendActivity({
      text: 'Welcome to the pizza ordering bot!',
    });
    /**
     * Since we are not prompting the user for any information we will want to go to the next step
     * in the waterfall right after this
     */
    return step.next();
  }

  private async getNameStep(step: WaterfallStepContext) {
    await step.context.sendActivity({ type: 'typing' });
    return step.prompt(NAME_STEP_PROMPT_ID, { prompt: 'What is your name?' });
  }

  private async choosePizzaStep(step: WaterfallStepContext) {
    /**
     * We can get the result of the previous step
     */
    const name = step.result;

    await step.context.sendActivities([
      { type: 'typing' },
      { text: `It's nice to meet you ${name}` },
    ]);

    const cheesePizza = CardFactory.heroCard(
      'Cheese Pizza',
      [
        'https://imagesvc.meredithcorp.io/v3/mm/image?url=https%3A%2F%2Fstatic.onecms.io%2Fwp-content%2Fuploads%2Fsites%2F9%2F2022%2F02%2F15%2Fclassic-cheese-pizza-FT-RECIPE0422.jpg&q=60',
      ],
      [{ type: ActionTypes.ImBack, title: 'Select', value: 'Cheese' }]
    );

    const pepperoniPizza = CardFactory.heroCard(
      'Pepperoni Pizza',
      [
        'https://www.simplyrecipes.com/thmb/RiK7px2b_-buGiK2w55_jdRiAKM=/1333x1333/smart/filters:no_upscale()/__opt__aboutcom__coeus__resources__content_migration__simply_recipes__uploads__2019__09__easy-pepperoni-pizza-lead-3-8f256746d649404baa36a44d271329bc.jpg',
      ],
      [{ type: ActionTypes.ImBack, title: 'Select', value: 'Pepperoni' }]
    );

    const meatLoversPizza = CardFactory.heroCard(
      'Meat Lovers Pizza',
      [
        'https://www.queensleeappetit.com/wp-content/uploads/2019/02/Meat-Lovers-Pizza-5-1-480x480.jpg',
      ],
      [{ type: ActionTypes.ImBack, title: 'Select', value: 'Meat Lovers' }]
    );

    const veggiePizza = CardFactory.heroCard(
      'Veggie Pizza',
      [
        'https://cookieandkate.com/images/2020/10/best-veggie-pizza-recipe-1.jpg',
      ],
      [{ type: ActionTypes.ImBack, title: 'Select', value: 'Veggie' }]
    );

    return step.prompt(PIZZA_CHOICE_STEP_PROMPT_ID, {
      prompt: {
        text: 'What kind of pizza would you like?',
        attachments: [
          cheesePizza,
          pepperoniPizza,
          meatLoversPizza,
          veggiePizza,
        ],
        attachmentLayout: AttachmentLayoutTypes.Carousel,
      },
    });
  }

  private async choosePizzaSizeStep(step: WaterfallStepContext) {
    const pizzaChoice = step.result.text;

    await step.context.sendActivity({
      text: `Excellent choice, I'm sure you'll love our ${pizzaChoice} pizza!`,
    });

    return step.prompt(PIZZA_SIZE_CHOICE_STEP_PROMPT_ID, {
      prompt: `What size ${pizzaChoice} pizza do you want?`,
      choices: ['12 inch', '16 inch', '20 inch'],
      style: ListStyle.suggestedAction,
    });
  }

  private async askForMoreToppingsStep(step: WaterfallStepContext) {
    return step.prompt(MORE_TOPPINGS_PROMPT, {
      prompt: 'Would you like additional toppings?',
      choices: ['Yes please!', 'No thanks'],
    });
  }

  private async selectAdditionalToppingsStep(step: WaterfallStepContext) {
    const moreToppings = step.result.value;

    if (/yes/gi.test(moreToppings)) {
      return step.prompt(SELECT_TOPPINGS_PROMPT, {
        prompt: 'Select an additional topping for your pizza',
        choices: [
          'Pepperoni',
          'Onion',
          'Bell Pepper',
          'Sausage',
          'Olives',
          'Pineapple',
        ],
        retryPrompt: `Sorry, pineapple is not a valid choice, please re-evaluate your life decisions`,
      });
    } else {
      return step.next();
    }
  }

  private async finishStep(step: WaterfallStepContext) {
    await step.context.sendActivities([
      {
        text: `You're all set! Your imaginary pizza will be ready in 20-30 minutes`,
      },
      { type: 'typing' },
      {
        text: `Thanks for order through the pizza bot!`,
      },
    ]);
    return step.endDialog();
  }
}
