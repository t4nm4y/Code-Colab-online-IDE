import React, { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';
import ACTIONS from '../Actions';
import Client from '../components/Client';
import Editor from '../components/Editor';
import { initSocket } from '../socket';
import {
    useLocation,
    useNavigate,
    Navigate,
    useParams,
} from 'react-router-dom';
import { PlayFill } from 'react-bootstrap-icons';

const EditorPage = () => {
    const socketRef = useRef(null);
    const codeRef = useRef(null);
    const editorRef = useRef(null);
    const langRef = useRef(null);
    const location = useLocation();
    const { roomId } = useParams();
    const reactNavigator = useNavigate();
    const [clients, setClients] = useState([]);


    useEffect(() => {
        const init = async () => {
            socketRef.current = await initSocket();
            socketRef.current.on('connect_error', (err) => handleErrors(err));
            socketRef.current.on('connect_failed', (err) => handleErrors(err));

            function handleErrors(e) {
                console.log('socket error', e);
                toast.error('Socket connection failed, try again later.');
                reactNavigator('/');
            }

            socketRef.current.emit(ACTIONS.JOIN, {
                roomId,
                username: location.state?.username,
            });

            // Listening for joined event
            socketRef.current.on(
                ACTIONS.JOINED,
                ({ clients, username, socketId }) => {
                    //we only broadcast the message to other users not to the one who has joined
                    if (username !== location.state?.username) {
                        toast.success(`${username} joined the room.`);
                        console.log(`${username} joined`);
                    }
                    setClients(clients);
                    socketRef.current.emit(ACTIONS.SYNC_CODE, {
                        code: codeRef.current,
                        socketId,
                        lang: langRef.current
                    });
                    // document.getElementById("langOption").value=langRef.current;
                }
            );

            // Listening for disconnected
            socketRef.current.on(
                ACTIONS.DISCONNECTED,
                ({ socketId, username }) => {
                    toast.success(`${username} left the room.`);
                    setClients((prev) => {
                        //add all the clients except the one who has left 
                        return prev.filter(
                            (client) => client.socketId !== socketId
                        );
                    });
                }
            );
        };
        init();

        //to close all the listeners, return in useEffect is used as a cleaning function
        return () => {
            socketRef.current.disconnect();
            socketRef.current.off(ACTIONS.JOINED);
            socketRef.current.off(ACTIONS.DISCONNECTED);
        };
    }, []);

    const setLanguage = (e) => {
        editorRef.current.setOption("mode", e.target.value)
        langRef.current = e.target.value
    };

    async function copyRoomId() {
        try {
            await navigator.clipboard.writeText(roomId);
            toast.success('Room ID has been copied to your clipboard');
        } catch (err) {
            toast.error('Could not copy the Room ID');
            console.error(err);
        }
    }

    function leaveRoom() {
        reactNavigator('/');
    }
    function runCode() {
        console.log("will add it soon")
    }

    //if don't get the usename as state, then we will redirect it back to the home page
    if (!location.state) {
        return <Navigate to="/" />;
    }
    // const languagesDic = [
    //     { value: 'text/x-c++src', label: 'C++' },
    //     { value: 'text/x-python', label: 'Python' },
    //     { value: 'text/x-java', label: 'Java' },
    // ];
    return (
        <div className='main'>
            <div className='upperPanel'>
                <div className='options'>
                    <label class="visually-hidden" for="autoSizingSelect">Language: &nbsp;</label>
                    <select class="form-select" id="langOption" onChange={setLanguage}>
                        <option selected>Select</option>
                        <option value="text/x-c++src">C++</option>
                        <option value="text/x-python">Python</option>
                        <option value="text/x-java">Java</option>
                    </select>
                </div>
                <PlayFill className='runBtn' size={30} onClick={runCode} />
            </div>
            <div className="mainWrap">
                <div className="editorWrap">
                    <Editor
                        socketRef={socketRef}
                        roomId={roomId}
                        editorRef={editorRef}
                        onLangChange={(lang) => {
                            langRef.current = lang;
                            document.getElementById("langOption").value=lang;
                        }}
                        onCodeChange={(code) => {
                            codeRef.current = code;
                        }}
                    />
                </div>
                <div className="aside">
                    <div className="asideInner">
                        <div className="logo">
                            <img
                                className="logoImage"
                                src="/icon.png"
                                alt="logo"
                            />
                        </div>
                        <h3>Connected Users</h3>
                        <div className="clientsList">
                            {clients.map((client) => (
                                <Client
                                    key={client.socketId}
                                    username={client.username}
                                />
                            ))}
                        </div>
                    </div>
                    <button className="btn copyBtn" onClick={copyRoomId}>
                        Copy ROOM ID
                    </button>
                    <button className="btn leaveBtn" onClick={leaveRoom}>
                        Leave
                    </button>
                </div>
            </div>
        </div>
    );
}

export default EditorPage