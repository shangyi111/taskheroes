export interface Job{
    id?:string,//job Id
    performerId?:string, //person who performs job
    jobDate?:Date,
    customerId?:string,//customer id
    category?:string,
    location?:string,
    fee:string,
    paymentMethod:string,
}