import { BehaviorSubject } from 'rxjs';
import {
    ConnectedSocket,
    EmitOnFail,
    EmitOnSuccess,
    MessageBody,
    OnConnect,
    OnDisconnect,
    OnMessage,
    SocketController,
    SocketId,
    SocketIO,
} from 'socket-controllers';
import { Server, Socket } from 'socket.io';
import { Event } from './@types/event';
import { Notification } from './@types/notification';
import { Room } from './models/room';
import { Request as CreateRoomRequest } from './requests/create-room.request';
import { Request as JoinRoomRequest } from './requests/join-room.request';

@SocketController()
export class Teyvat {
    private isFirstRun = true;
    private connectedClients$ = new BehaviorSubject<number>(0);
    private rooms: Room[] = [new Room()];

    @OnConnect()
    onConnect(@SocketId() socketID: string, @SocketIO() server: Server) {
        if (this.isFirstRun) {
            let room = this.defaultRoom;

            room.game.notification$.subscribe((notification) => {
                this.onNotification(server, notification, room.code);
            });

            this.connectedClients$.subscribe((connectedClients) => {
                server.emit(Event.SET_CONNECTED_CLIENTS, connectedClients);
            });

            this.isFirstRun = false;
        }

        this.connectedClients$.next(this.connectedClients$.value + 1);
        // console.log('Client connected.', socketID);
    }

    @OnDisconnect()
    onDisconnect(@ConnectedSocket() connectedSocket: Socket) {
        this.connectedClients$.next(this.connectedClients$.value - 1);
        this.performLeaveRoom(connectedSocket);
        // console.log('Client disconnected.', connectedSocket.id);
    }

    @OnMessage(Event.CREATE_ROOM)
    @EmitOnSuccess(Event.CREATE_ROOM_RESULT)
    @EmitOnFail(Event.CREATE_ROOM_RESULT)
    onCreateRoom(
        @SocketIO() server: Server,
        @ConnectedSocket() connectedSocket: Socket,
        @SocketId() socketID: string,
        @MessageBody() request: CreateRoomRequest,
    ) {}

    @OnMessage(Event.JOIN_ROOM)
    @EmitOnSuccess(Event.JOIN_ROOM_RESULT)
    @EmitOnFail(Event.JOIN_ROOM_RESULT)
    onJoinRoom(
        @SocketIO() server: Server,
        @ConnectedSocket() connectedSocket: Socket,
        @SocketId() socketID: string,
        @MessageBody() request: JoinRoomRequest,
    ) {
        let room = this.defaultRoom;
        room.playerDidJoin(socketID, request.name, () => {
            connectedSocket.join(room.code);
        });
        return { isOK: true, code: room.code };
    }

    @OnMessage(Event.LEAVE_ROOM)
    @EmitOnSuccess(Event.LEAVE_ROOM_RESULT)
    @EmitOnFail(Event.LEAVE_ROOM_RESULT)
    onLeaveRoom(@ConnectedSocket() connectedSocket: Socket) {
        this.performLeaveRoom(connectedSocket);
        return { isOK: true };
    }

    @OnMessage(Event.START)
    @EmitOnSuccess(Event.START_RESULT)
    @EmitOnFail(Event.START_RESULT)
    onStart(@ConnectedSocket() connectedSocket: Socket) {
        this.defaultRoom.game.start();
        return { isOK: true };
    }

    @OnMessage(Event.RESET)
    @EmitOnSuccess(Event.RESET_RESULT)
    @EmitOnFail(Event.RESET_RESULT)
    onReset(@ConnectedSocket() connectedSocket: Socket) {
        this.defaultRoom.game.reset();
        return { isOK: true };
    }

    @OnMessage(Event.SUBMIT)
    @EmitOnSuccess(Event.SUBMIT_RESULT)
    @EmitOnFail(Event.SUBMIT_RESULT)
    onSubmit(@SocketId() socketID: string, @MessageBody() mathExpression: string) {
        this.defaultRoom.game.playerDidSubmit(socketID, mathExpression);
        return { isOK: true };
    }

    private performLeaveRoom(connectedSocket: Socket) {
        let room = this.defaultRoom;
        room.playerDidLeave(connectedSocket.id);
        connectedSocket.leave(room.code);
    }

    private get defaultRoom(): Room {
        return this.rooms[0];
    }

    private onNotification(server: Server, notification: Notification, code: string) {
        // console.log(notification);
        server.to(code).emit(notification.event, notification.payload);
    }
}
