class Evaluation{

//----------------5 CARD UNIQUE COMBINATION GENERATOR---------------------------//
    getCombinations(cards, k) {
        if (k === 0) return [[]]
        if (cards.length === 0) return []
        const [first, ...rest] = cards
        const withFirst = this.getCombinations(rest, k - 1).map(c => [first, ...c])
        const withoutFirst = this.getCombinations(rest, k)
        return [...withFirst, ...withoutFirst]
    }


//----------------HAND DETECTION FUNCTIONS------------------------------------//

    helperCount(cards){//counting array(key-value paira) to count occurence od each card
        let count={}
        for(let card of cards){
            if(!count[card.weight]){
                count[card.weight]=1
            }else{
                count[card.weight]++
            }
        }
        return count
    }

    isPair(count){
        for(let rank in count){
            if(count[rank]===2){
                return true
            }
        }
        return false
    }

    isTwoPair(count){
        let pairs=0
        for(let rank in count){
            if(count[rank]===2){
                pairs++
            }
            if(pairs===2){
                return true
            }
        }
        return false
    }


    isThreeOfAKind(count){
        for(let rank in count){
            if(count[rank]===3){
                return true
            }
        }
        return false
    }


    isFourOfAKind(count){
        for(let rank in count){
            if(count[rank]===4){
                return true
            }
        }
        return false
    }


    isStraight(cards){
        let longest=1
        let rankcount=1
        let sorted=[...cards].sort((a, b) => a.weight - b.weight);

        //remove duplicates
        let unique=[]
        unique.push(sorted[0])
        for(let i=1; i<sorted.length; i++){
            if((sorted[i].weight)!==(sorted[i-1].weight)){
                unique.push(sorted[i])
            }
        }

        for(let i=0; i<unique.length-1; i++){
            if((unique[i].weight+1)===(unique[i+1].weight)){
                rankcount++
            }else{
                if(rankcount>longest){
                    longest=rankcount
                }
                rankcount=1
            }
        }

        if(rankcount>longest){
                    longest=rankcount
        }

        //aces and 2s
        let hasAce = false;
        let has2 = false;
        let has3 = false;
        let has4 = false;
        let has5 = false;

        for (let card of unique) {
            if (card.weight === 14) hasAce = true;
            if (card.weight === 2) has2 = true;
            if (card.weight === 3) has3 = true;
            if (card.weight === 4) has4 = true;
            if (card.weight === 5) has5 = true;
        }

        if(longest>4){
            return true
        }else if(hasAce && has2 && has3 && has4 && has5) {
            return true;
        }else{
            return false
        }

    }//end of isStraight


    isFlush(cards){
        let flush=true
        let color=cards[0].suit
        for(let c of cards){
            if(c.suit!==color){
                flush=false
            }
        }
       return flush

    }

    isFullHouse(count){
        let hastwo=false
        let hasthree=false
        for(let c in count){
            if(count[c]===3){
                hasthree=true
            }
            if(count[c]===2){
                hastwo=true
            }
        }
        
        return hasthree && hastwo
    }


    isStraightFlush(cards){
        let straight=this.isStraight(cards)
        let flush=this.isFlush(cards)

        return straight && flush
    }

    //--------------------------------EXAMINE EACH 5 CARD COMBOS HANDS---------------------------------//

    evaluatehand(combo){
        const count = this.helperCount(combo)
        const sorted = [...combo].sort((a, b) => b.weight - a.weight)
        const weights = sorted.map(c => c.weight)

        if (this.isStraightFlush(combo)){
            const isWheel = weights.includes(14) && weights.includes(2)
            return { rank: 8, tiebreakers: [isWheel ? 5 : weights[0]] }
        }

        if (this.isFourOfAKind(count)){
            //tie braker logic
            //qudruples go first, then last card
            let quads=this.findrank(count, 4)
            return { rank: 7, tiebreakers: [quads] }
        }

        if (this.isFullHouse(count)){
            //tie braker logic
            //first goes tripples, then pair
            let tripples=this.findrank(count, 3)
            let pairs=this.findrank(count,2)
            return { rank: 6, tiebreakers: [tripples,pairs] }
        }

        if (this.isFlush(combo)){
            //tie braker logic. done already
            //we order all cards with ranks, all of them, hogest to lowest
            //weights has already doen that
            return { rank: 5, tiebreakers: weights }
        }

        if (this.isStraight(combo)){
            //tie braker logic, done already
            const isWheel = weights.includes(14) && weights.includes(2)
            return { rank: 4, tiebreakers: [isWheel ? 5 : weights[0]] }
        }

        if (this.isThreeOfAKind(count)){
            //tie braker logic
            //tripples go first, then highest ranked card, then second.
            let tripples=this.findrank(count, 3)
            let kickers=weights.filter(weight=>weight!==tripples)
            let mytiebreakers=[tripples,...kickers]
            return { rank: 3, tiebreakers: mytiebreakers}
        }

        if (this.isTwoPair(count)){
            //tie braker logic
            let ranks=this.getallranks(count, 2)
            let kickers=weights.filter(weight=>!ranks.includes(weight))

            let mytiebreakers=[...ranks ,...kickers]
            return { rank: 2, tiebreakers: mytiebreakers }
        }

        if (this.isPair(count)){
            //tie braker logic
            //pairs go first, then highest rank card left,then second highers...
            let pairrank=this.findrank(count, 2)
            let kickers=weights.filter(weight=>weight!==pairrank)
            let mytiebreakers=[pairrank,...kickers]
            return { rank: 1, tiebreakers: mytiebreakers }
        }
        
        return { rank: 0, tiebreakers: weights }


    //end of evaluatehand
    }

    findrank(count, n){
        let result
        for(let rank in count){
            if(count[rank]===n){
                result=rank
                return Number(result)
            }
        }
        return null
    }

    getallranks(count, n){
        let result=[]
        for(let rank in count){
            if(count[rank]===n){
                result.push(Number(rank))
            }
        }
        return result.sort((a, b) => b - a)
    }

//-------------------------------DETERMINE WHICH 5 CARD COMBO IS BEST AND RETURN---------------------------------------//

    //1.examine all 5 card combos and determine their strength
    comparehands(hand1, hand2){
        if(hand1.rank!==hand2.rank){
            return hand1.rank-hand2.rank
        }else{
            for(let i=0; i<hand1.tiebreakers.length; i++){
                if(hand1.tiebreakers[i]!==hand2.tiebreakers[i]){
                    return hand1.tiebreakers[i]-hand2.tiebreakers[i]
                }
            }
        }
        return 0
    }

    //2.compare hands and return best
    playerbest(cards){
        const comboes=this.getCombinations(cards, 5)
        let best=null
        for(const combo of comboes){
            let evaluated=this.evaluatehand(combo)
            if(best===null || this.comparehands(evaluated,best)>0){
                best=evaluated
            }
        }
        return best
    }



//end
}

module.exports=Evaluation;