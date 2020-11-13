export enum Event {
    CREATE_ROOM = 'CREATE_ROOM',
    CREATE_ROOM_RESULT = 'CREATE_ROOM_RESULT',

    JOIN_ROOM = 'JOIN_ROOM',
    JOIN_ROOM_RESULT = 'JOIN_ROOM_RESULT',

    LEAVE_ROOM = 'LEAVE_ROOM',
    LEAVE_ROOM_RESULT = 'LEAVE_ROOM_RESULT',

    SUBMIT = 'SUBMIT',
    SUBMIT_RESULT = 'SUBMIT_RESULT',

    SET_REMAINING_TIME = 'SET_REMAINING_TIME',
    SET_CURRENT_STATE = 'SET_CURRENT_STATE',
    SET_CURRENT_PLAYER = 'SET_CURRENT_PLAYER',
    SET_CURRENT_QUESTION = 'SET_CURRENT_QUESTION',
    SET_PLAYERS = 'SET_PLAYERS',

    SET_CONNECTED_CLIENTS = 'SET_CONNECTED_CLIENTS',
}