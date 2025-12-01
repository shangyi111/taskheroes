export interface Review {
    id?:string;//review id
    revieweeId?: string;//person receiving the reviewer
    reviewerId?:string;//person give out the review
    rating?:number;
    review?:string;
    serviceId?:string,
    addedDate?:string,
  }