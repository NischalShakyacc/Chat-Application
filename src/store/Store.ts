export type UserId = string;

export interface Chat {
    id: string;
    userId: UserId;
    name: string;
    upvotes: UserId[];
    message: string;
}

export abstract class Store{
    constructor(){

    }
    initRoom(roomId: string){

    }

    getChats(roomId: string, limit: number, offset: number){
        
    }

    addChat(userId:UserId, name:string, roomId: string, message:string){
        
    }
    
    //chatId and Id Different
    upvote(userId:UserId, roomId: string, chatId:string){
        
    }
}