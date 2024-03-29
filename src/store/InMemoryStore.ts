import { Chat, Store, UserId } from "./Store";
let globalChatId = 0;

export interface Room{
    roomId: string;
    chats: Chat[]
}

export class InMemoryStore implements Store{
    private store: Map<string, Room>;

    constructor(){
        this.store = new Map<string,Room>()
    }
    
    initRoom(roomId: string) {
        this.store.set(roomId, {
            roomId,
            chats: []
        });
    }

    // limit = number of chats to load at a time
    // offset = number of chats to offset
    getChats(roomId: string, limit: number, offset: number){
        const room = this.store.get(roomId);
        if(!room){
            return null;
        }
        return room.chats.reverse().slice(0,offset).slice(-1 * limit);
    }

    addChat(userId: UserId, name:string, roomId: string, message:string){
        if (!this.store.get(roomId)){
            this.initRoom(roomId);
        }

        const room = this.store.get(roomId);
        console.log(this.store)

        if(!room){
            return;
        }

        const chat = {
            id: (globalChatId++).toString(),
            userId,
            name,
            message,
            upvotes: []
        }
        room.chats.push(chat);
        return chat;
    }

    upvote(userId: UserId, roomId: string, chatId: string){
        const room = this.store.get(roomId);
        if(!room){
            return;
        }

        const chat = room.chats.find(({id})=> id === chatId);

        if(chat){
            if(chat.upvotes.find(chat => chat === userId)){
                return chat;
            }
            chat.upvotes.push(userId)
        }
        return chat;
    }
}