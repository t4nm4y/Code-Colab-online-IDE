import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const Home = () => {
    const navigate = useNavigate();

    const [roomId, setRoomId] = useState('');
    const [username, setUsername] = useState('');

    const createNewRoom = (e) => {
        e.preventDefault();
        //generating a 4 digit random no. bt 1000, 9999
        // const id = Math.floor(Math.random() * 9000 + 1000);

        // generating 5 digit random string containing alphabets and numbers
        const id=Math.random().toString(36).substring(2,7);
        setRoomId(id);
        toast.success('Created a new room');
    };
    const joinRoom = () => {
        if (!roomId || !username) {
            toast.error('Both ROOM ID & username is required');
            return;
        }

        // Redirect
        navigate(`/editor/${roomId}`, {
            //to forward the username to the editor page
            state: {
                username,
            },
        });
    };

    const handleInputEnter = (e) => {
        if (e.code === 'Enter') {
            joinRoom();
        }
    };

    return (
        <div className="homePageWrapper">
            <div className="formWrapper">
                <img className="homePageLogo" src="/icon.png" alt="code-sync-logo" />
                <h3>&emsp;&emsp;&ensp;Online Real-time Collaborative IDE!</h3>
                <div className="inputGroup">
                    <input
                        type="text"
                        className="inputBox"
                        placeholder="Your Name"
                        onChange={(e) => setUsername(e.target.value)}
                        value={username}
                        onKeyUp={handleInputEnter}
                    />
                    <input
                        type="text"
                        className="inputBox"
                        placeholder="Room ID"
                        onChange={(e) => setRoomId(e.target.value)}
                        value={roomId}
                        onKeyUp={handleInputEnter}
                    />
                    <button className="btn joinBtn" onClick={joinRoom}>Join</button>
                    <span className="createInfo">
                        Create: &nbsp;
                        <a href="" className="NewRoomBtn" onClick={createNewRoom}>
                            New Room
                        </a>
                    </span>
                </div>
            </div>
            <br />
            <h4>Join a room with your friends and start coding!</h4>
        </div>
    )
}

export default Home