# restaurant_chatbot

---

## Requirements
1. ChatBot interface would be like a chat interface
2. No need for authentication but we should be able to store user session based on
devices
3. When a customer lands on the chatbot page, the bot should send these options to the
customer:
    a. Select 1 to Place an order
    b. Select 99 to checkout order
    c. Select 98 to see order history
    d. Select 97 to see current order
    e. Select 0 to cancel order
4. When a customer selects “1”, the bot should return a list of items from the restaurant. It
is up to you to create the items in your restaurant for the customer. The order items can
have multiple options but the customer should be able to select the preferred items from
the list using this same number select system and place an order.
5. When a customer selects “99” out an order, the bot should respond with “order placed”
and if none the bot should respond with “No order to place”. Customer should also see
an option to place a new order
6. When a customer selects “98”, the bot should be able to return all placed order
7. When a customer selects “97”, the bot should be able to return current order
8. When a customer selects “0”, the bot should cancel the order if there is
---

## Setup
- Pull this repo
- Run npm install to install dependencies
- create a .env file and put in the necessary fields
    - MONGO_URL
    - PORT
    - SECRET
- run `npm run start-dev`

---

## Base URL
- https://bukka-t.onrender.com/


## Instructions
- Visit the base url provided and fill in the form to get started. 
- On form submission, the user is redirected to the chat bot. 
On the chat interface be sure to read the bot messages for instructions. Type 'start' at anypoint to bring up the main menu.
- On main menu, type '1' to place an order. The bot will present you with a list of food options. For the sake of giving users the freedom to make a variety of selections, pattern matching has been used to make selections.
Type in your desired selections with the same spelling on the menu and separate multiple selections with a comma. You will be required to confirm your selection. Type 'No' if it does not match your selection and 'Yes' if it does.
- Each group of selection is treated as a single dish, so if you wish to order for multiple dishes, type 'yes' when asked if you wish to make another order and type 'No' if otherwise. Repeat the selection process to add another dish if you wish.
- Current orders has been implemented as a cart here, so you can use '97' on the main menu to see your current selections.
- On the main menu, type '99' to checkout your order (cart). You will be asked to input the delivery address to confirm your order. Input delivery address and confirm to see the cost of processing your order.
- successfully placed orders will show up in your order history. Use '98' on the main menu to see your oder history. Your orders will be listed out with their various timestamps.
- You can use the icon in the top bar section to end the session when you are done.

         Have a happy meal.



## Models
---

### User
| field  |  data_type | constraints  |
|---|---|---|
|  id |  objectId |   |
|  name | string  |  required  |
|  phone  | string  |  required  |
|  orders     | array  |         |


### Item
| field  |  data_type | constraints  |
|---|---|---|
|  id |  objectId |   |
|  name | string  |  required  |
|  price  | number  |  required  |
|  description     | string  |         |
|  inStock  | number  |    |
|  timestamps  | datetime  |    |


### Orders
| field  |  data_type | constraints  |
|---|---|---|
|  id |  objectId |   |
|  createdBy | objectId  |    |
|  delivery_address  | string  |  required  |
|  items     | array  |         |
|  status  | enum  | default: 'order created', options: 'order created', 'processing', 'fulfilled'  |
|  timestamps  | datetime  |    |


[!database design](https://res.cloudinary.com/dnncez2l8/image/upload/v1679151916/docs/drawSQL-buka-t-export-2023-03-18_o6cvkw.png)



```
...

## Contributor
- Victor Abbah