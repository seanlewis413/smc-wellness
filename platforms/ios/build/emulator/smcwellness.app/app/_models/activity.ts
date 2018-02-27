export class Activity {
    
    id: string;
    totalPts: number|null;
    choices: Array<any>;
    question: string;
    activityType: any;
    

    constructor(id, activityType ,totalPts, choices, question){
        this.id = id;
        this.totalPts = totalPts;
        this.choices = choices;
        this.question = question;
        this.activityType = activityType;
    }

    public setValue(val){
        this.totalPts=val;
    }
}