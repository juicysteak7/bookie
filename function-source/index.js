// See https://github.com/dialogflow/dialogflow-fulfillment-nodejs
// for Dialogflow fulfillment library docs, samples, and to report issues
'use strict';
const classes = [
  {ClassName: 'Class 1', TextBooks:['Textbook 1']},
  {ClassName: 'Class 2', TextBooks:['Textbook 2']},
  {ClassName: 'Class 3', TextBooks:['Textbook 1', 'Textbook 2']},
  {ClassName: 'Class 4', TextBooks:['Textbook 3', 'Textbook 4']},
  {ClassName: 'Class 5', TextBooks:['Textbook 5']},
  {ClassName: 'Class one', TextBooks:['Textbook 1']},
  {ClassName: 'Class two', TextBooks:['Textbook 2']},
  {ClassName: 'Class three', TextBooks:['Textbook 1', 'Textbook 2']},
  {ClassName: 'Class four', TextBooks:['Textbook 3', 'Textbook 4']},
  {ClassName: 'Class five', TextBooks:['Textbook 5']},
  ];
const books = [
  { BookName: 'Textbook 1', BookPrice: 10.99, Stock: 300},
  { BookName: 'Textbook 2', BookPrice: 12.39, Stock: 45},
  { BookName: 'Textbook 3', BookPrice: 61.89, Stock: 19},
  { BookName: 'Textbook 4', BookPrice: 100.99, Stock: 10},
  { BookName: 'Textbook 5', BookPrice: 8.09, Stock: 45},
  { BookName: 'Textbook One', BookPrice: 10.99, Stock: 300},
  { BookName: 'Textbook Two', BookPrice: 12.39, Stock: 45},
  { BookName: 'Textbook Three', BookPrice: 61.89, Stock: 19},
  { BookName: 'Textbook Four', BookPrice: 100.99, Stock: 10},
  { BookName: 'Textbook Five', BookPrice: 8.09, Stock: 45},
  ];

let cart = [];
 
const functions = require('firebase-functions');
const {WebhookClient} = require('dialogflow-fulfillment');
const {Card, Suggestion} = require('dialogflow-fulfillment');
 
process.env.DEBUG = 'dialogflow:debug'; // enables lib debugging statements
 
exports.dialogflowFirebaseFulfillment = functions.https.onRequest((request, response) => {
  const agent = new WebhookClient({ request, response });
  console.log('Dialogflow Request headers: ' + JSON.stringify(request.headers));
  console.log('Dialogflow Request body: ' + JSON.stringify(request.body));
 
  function welcome(agent) {
    agent.add(`Welcome to my agent!`);
  }
  
  function formatArrayWithAnd(array) {
    if (array.length === 0) {
      return '';
    } else if (array.length === 1) {
      return array[0];
    } else if (array.length === 2) {
      return array.join(' and ');
    } else {
      return array.slice(0, -1).join(', ') + ', and ' + array[array.length - 1];
    }
  }
  
  function resetCart(agent){
    cart = [];
    agent.add('Your cart has been emptied.');
  }
  
  function removeBook(agent){
    const bookName = agent.parameters.bookname;
    let newCart = [];
    for(let book of cart){
      if(book.BookName !== bookName){
        newCart.push(book);
      }
    }
    cart = newCart;
    agent.add(`${bookName} has been removed from the cart.`);
  }
  
  function getBookStock(agent) {
    const bookName = agent.parameters.bookname;
    let stock = null;
    for(let book of books){
      if(book.BookName == bookName){
        stock = book.Stock;
      }
    }
    if(stock){
      agent.add(`There are ${stock} copies of ${bookName} in stock.`);
    } else {
      agent.add(`I couldn't find any textbooks under ${bookName}.`);
    }
  }
 
  function getClassRequirements(agent) {
    // agent.add('Testing from getclassrequirements');
    const className = agent.parameters.classname;
    let textbooks = null;
    for(let c of classes){
      if(c.ClassName == className){
        textbooks = c.TextBooks;
      }
    }
    if(textbooks){
      agent.add(`The textbooks required for ${className} are ${formatArrayWithAnd(textbooks)}.`);
    } else {
      agent.add(`I couldn't find any textbooks for ${className}.`);
    }
  }
  
  function fallback(agent) {
    agent.add(`I didn't understand`);
    agent.add(`I'm sorry, can you try again?`);
  }
  
  function getCart(agent){
    if(cart.length < 1) {
      agent.add('There is nothing in your cart.');
    } else {
      let response = 'Your cart contains: ';
      for(let i = 0; i < cart.length; ++i){
        if(i != (cart.length - 1)){
          response = response + `${cart[i].BookName} ($${cart[i].BookPrice}), `;
        } else {
          response = response + `${cart[i].BookName} ($${cart[i].BookPrice}).`;
        }
      }
      agent.add(response);
    }
  }
  function confirmCheckOut(agent){
    let bookNames = [];
    for(let book of cart){
      bookNames.push(book.BookName);
    }
    cart = [];
    if(bookNames.length == 1){
      agent.add(`${formatArrayWithAnd(bookNames)} has been ordered.`);
    } else {
      agent.add(`${formatArrayWithAnd(bookNames)} have been ordered.`);
    }
  }
  function denyCheckOut(agent){
    agent.add('Checkout canceled.');
  }
  function checkOut(agent) {
    let total = 0;
    if(cart.length > 0){
      for(let book of cart){
        total = total + book.BookPrice;
      }
      agent.add(`The total is $${total.toFixed(2)}. Do you want to proceed to payment?`);
    } else {
      agent.add('There is nothing in your cart.');
    }

  }
  
  function addToCart(agent) {
    const bookName = agent.parameters.bookname;
    let match = false;
    for(let book of books){
      if(book.BookName === bookName){
        match = true;
        cart.push(book);
        //agent.add(JSON.stringify(cart));
        agent.add(`${bookName} added to cart.`);
      }
    }
    if(!match){
      agent.add(`I couldn't find ${bookName} in my library.`);
    }
  }
  
  function capitalizeFirstLetter(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
  
  function checkPrice(agent) {
    let speakOutput = '';
    const bookName = agent.parameters.bookname;
    let bookPrice = null;
    const comparePrice = agent.parameters.bookprice;
    let match = false;
    for(let book of books){
      if(book.BookName === bookName){
        match = true;
        bookPrice = book.BookPrice;
        break;
      }
    }
    if(!match){
      agent.add('I couldn\'t find that book in my library.');
    }
    if(!comparePrice){
      agent.add(`${bookName} costs $${bookPrice}.`);
    }else{
      if(comparePrice > bookPrice){
        agent.add(`${bookName} costs less than $${comparePrice}. It costs $${bookPrice}.`);
      } else if(comparePrice < bookPrice){
        agent.add(`${bookName} costs more than $${comparePrice}. It costs $${bookPrice}.`);
      } else {
        agent.add(`${bookName} costs $${comparePrice}.`);
      }
    }
  }

  // // Uncomment and edit to make your own intent handler
  // // uncomment `intentMap.set('your intent name here', yourFunctionHandler);`
  // // below to get this function to be run when a Dialogflow intent is matched
  // function yourFunctionHandler(agent) {
  //   agent.add(`This message is from Dialogflow's Cloud Functions for Firebase editor!`);
  //   agent.add(new Card({
  //       title: `Title: this is a card title`,
  //       imageUrl: 'https://developers.google.com/actions/images/badges/XPM_BADGING_GoogleAssistant_VER.png',
  //       text: `This is the body text of a card.  You can even use line\n  breaks and emoji! 💁`,
  //       buttonText: 'This is a button',
  //       buttonUrl: 'https://assistant.google.com/'
  //     })
  //   );
  //   agent.add(new Suggestion(`Quick Reply`));
  //   agent.add(new Suggestion(`Suggestion`));
  //   agent.setContext({ name: 'weather', lifespan: 2, parameters: { city: 'Rome' }});
  // }

  // // Uncomment and edit to make your own Google Assistant intent handler
  // // uncomment `intentMap.set('your intent name here', googleAssistantHandler);`
  // // below to get this function to be run when a Dialogflow intent is matched
  // function googleAssistantHandler(agent) {
  //   let conv = agent.conv(); // Get Actions on Google library conv instance
  //   conv.ask('Hello from the Actions on Google client library!') // Use Actions on Google library
  //   agent.add(conv); // Add Actions on Google library responses to your agent's response
  // }
  // // See https://github.com/dialogflow/fulfillment-actions-library-nodejs
  // // for a complete Dialogflow fulfillment library Actions on Google client library v2 integration sample

  // Run the proper function handler based on the matched Dialogflow intent name
  let intentMap = new Map();
  intentMap.set('Default Welcome Intent', welcome);
  intentMap.set('Default Fallback Intent', fallback);
  intentMap.set('Add To Cart Intent', addToCart);
  intentMap.set('Check Price Intent', checkPrice);
  intentMap.set('Check Cart Intent', getCart);
  intentMap.set('Class Requirement Intent', getClassRequirements);
  intentMap.set('Check Stock Intent', getBookStock);
  intentMap.set('Check Out Intent', checkOut);
  intentMap.set('Confirm Check Out Intent', confirmCheckOut);
  intentMap.set('Deny Check Out Intent', denyCheckOut);
  intentMap.set('Remove Book From Cart Intent', removeBook);
  intentMap.set('Reset Cart Intent', resetCart);
  // intentMap.set('your intent name here', yourFunctionHandler);
  // intentMap.set('your intent name here', googleAssistantHandler);
  agent.handleRequest(intentMap);
});
