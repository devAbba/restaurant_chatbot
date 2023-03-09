function handleSelection (input){
    switch (input){
        case 1:
            //showItems
            return 'you have chosen to place order'
            break;
        case 99:
            //checkout order
            return 'you have chosen to checkout order'
            break;
        case 98:
            //order history
            return 'you have chosen to see your order history'
            break;
        case 97:
            //show current order
            return 'you have chosen to see your current order'
            break;
        case 0:
            //cancel order
            return 'you have chosen to cancel your order'
            break;
        default:
            //invalid selection
            return 'you have made an invalid selection, please try again'
            break;
    }
}

module.exports = handleSelection