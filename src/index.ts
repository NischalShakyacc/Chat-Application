import {server as WebSocketServer, connection} from 'websocket'
import http from 'http'
import { UserManager } from './UserManager';
import { IncomingMessage, InitMessageType, SupportedMessage, UpvoteMessageType, UserMessageType } from './messages/incomingMessages';
import { InMemoryStore } from './store/InMemoryStore';
import {OutgoingMessage, SupportedMessage as OutgoingSupportedMessage } from './messages/outgoingMessages';
import { Chat } from './store/Store';

const server = http.createServer(function(request:any, response:any) {
    console.log((new Date()) + ' Received request for ' + request.url);
    response.writeHead(404);
    response.end();
});
server.listen(8080, function() {
    console.log((new Date()) + ' Server is listening on port 8080');
});

const userManager = new UserManager();
const store = new InMemoryStore();


const wsServer = new WebSocketServer({
    httpServer: server,
    // You should not use autoAcceptConnections for production
    // applications, as it defeats all standard cross-origin protection
    // facilities built into the protocol and the browser.  You should
    // *always* verify the connection's origin and decide whether or not
    // to accept it.
    autoAcceptConnections: false
});

function originIsAllowed(origin: string) {
    // put logic here to detect whether the specified origin is allowed.
    return true;
}

wsServer.on('request', function(request) {
    console.log('Inside Connection');
    
    if (!originIsAllowed(request.origin)) {
      // Make sure we only accept requests from an allowed origin
        request.reject();
        console.log((new Date()) + ' Connection from origin ' + request.origin + ' rejected.');
        // Whenever a new user comes 
        // UserManager.addUser()
        
        return;
    }
    
    var connection = request.accept('echo-protocol', request.origin);
    console.log((new Date()) + ' Connection accepted.');
    connection.on('message', function(message) {
        // Todo add rate limiting logic here
        if (message.type === 'utf8') {
            try {
                console.log("Messsage " + message.utf8Data)
                messageHanlder(connection, JSON.parse(message.utf8Data))
            } catch (error) {
                
            }
            // console.log('Received Message: ' + message.utf8Data);
            // connection.sendUTF(message.utf8Data);
        }
    });
    // connection.on('close', function(reasonCode, description) {
    //     console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
    //     userManager.removeUser()
    // });
    
});

function messageHanlder (ws:connection, message: IncomingMessage) {
    if(message.type === SupportedMessage.JoinRoom) {
        console.log("Incoming message: " + JSON.stringify(message));
        console.log("User Added")
        const payload = message.payload;
        userManager.addUser(payload.name, payload.userId, payload.roomId, ws);
    }

    if (message.type === SupportedMessage.SendMessage) {
        console.log(message)
        const payload = message.payload;
        const user = userManager.getUser(payload.roomId,payload.userId);
        if(!user){
            console.error('User not found in database')
            return;
        }
        let chat = store.addChat(payload.userId, payload.roomId, payload.roomId, payload.message)
        if(!chat){
            return;
        }

        const outgoingPayload: OutgoingMessage = {
            type: OutgoingSupportedMessage.AddChat,
            payload:{
                chatId:chat.id,
                roomId: payload.roomId,
                message: payload.message,
                name: user.name,
                upvotes: 0
            }
        }
        userManager.broadcast(payload.roomId, payload.userId, outgoingPayload);
    }

    if(message.type === SupportedMessage.UpvoteMessage){
        const payload = message.payload;
        const chat = store.upvote(payload.userId, payload.roomId, payload.chatId);

        if(!chat){
            return;
        }

        const outgoingPayload: OutgoingMessage = {
            type: OutgoingSupportedMessage.UpdateChat,
            payload:{
                chatId:payload.chatId,
                roomId: payload.roomId,
                upvotes: chat.upvotes.length
            }
        }
        userManager.broadcast(payload.roomId, payload.userId, outgoingPayload);
    }
}