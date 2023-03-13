import React from 'react';
import Avatar from 'react-avatar';
import { BsFillCircleFill } from 'react-icons/bs';

const Client = ({ username }) => {
    return (
        <div className="client">
            {/* <Avatar name={username} size={35} round="9px" /> */}
            <BsFillCircleFill color='#C2AFF0'/>
            <span>&nbsp;&nbsp;{username}</span>
        </div>
    );
};

export default Client;
