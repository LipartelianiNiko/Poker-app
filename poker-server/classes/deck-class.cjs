class Deck{
    constructor(){
        this.ranks = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];//to display and compare card ranks
        this.suits = ['♥️','♦️','♣️','♠️'];// to display and compare card types
        this.weights =[2,3,4,5,6,7,8,9,10,11,12,13,14];//to compare which card is stronger
        this.deck=this.createDeck()
    }

    createDeck(){
        this.deck=[]
        for(let i=0; i <this.ranks.length; i++){
            for(let j=0; j <this.suits.length; j++){
                this.deck.push(
                    {
                        rank: this.ranks[i], 
                        suit: this.suits[j], 
                        weight: this.weights[i]
                    }
                );
            }
        }
        return this.deck;
    }

    shuffle() {//shuffle deck
        for (let i = this.deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1)); //random() generates random number from 0 to , floor() rounds down
            [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]]; //swap i-th element with random j element from 0 to i
        }
        return this.deck;
    }   

    dealOne() {
        return this.deck.pop();
    }
    pop(){
        return this.deck.pop()
    }

}
module.exports =Deck;
