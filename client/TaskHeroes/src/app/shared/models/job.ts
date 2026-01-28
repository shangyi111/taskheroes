export interface Job{
    id?:string,//job Id
    performerId?:string, //person who performs job
    jobDate?:Date,
    customerId?:string,//user id
    category?:string,
    location?:string,
    zipCode?:number,
    description?:string,
    fee?:string,
    hourlyRate?:number,
    paymentMethod?:string,
    serviceId?:string,
    jobTitle?:string,
    customerPhone?:string,
    status?:string,
}