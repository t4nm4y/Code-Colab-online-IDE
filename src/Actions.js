//we have mapped the actions here because if there is a typo or any change in the string then we will just make the changes here, 
//so we don't have to change it everywhere its used
const ACTIONS = {
    JOIN: 'join',
    JOINED: 'joined',
    DISCONNECTED: 'disconnected',
    CODE_CHANGE: 'code-change',
    SYNC_CODE: 'sync-code',
    LEAVE: 'leave',
};

module.exports = ACTIONS;
